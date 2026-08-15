import numpy as np
import pandas as pd
from flask import Flask, request, jsonify
from flask_cors import CORS
from sklearn.preprocessing import MinMaxScaler
from sklearn.neighbors import NearestNeighbors
import logging

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

app = Flask(__name__)
CORS(app)

# Complementarity between two people lives entirely in the tag columns. The two
# engineered count features describe how *large* a profile is, not how well it
# fits. Because they are dense values in a tag space that is almost all zeros,
# leaving them at full weight inside a cosine distance lets profile size outrank
# genuine skill complementarity (profiles sharing no tags at all were scoring
# ~20%). They stay in the pipeline, weighted down to act as a mild tiebreaker.
COUNT_FEATURE_WEIGHT = 0.15

@app.route('/health', methods=['GET'])
def health():
    return jsonify({"status": "healthy"}), 200

@app.route('/recommend', methods=['POST'])
def recommend():
    try:
        data = request.get_json()
        if not data:
            logging.warning("Recommendation request received with no data")
            return jsonify({"error": "No data provided"}), 400
        
        target_user_id = data.get('target_user_id')
        users_list = data.get('users', [])
        
        if not target_user_id or not users_list:
            logging.warning("Missing target_user_id or users list in request")
            return jsonify({"error": "Missing target_user_id or users list"}), 400
        
        logging.info(f"Computing recommendations for target user: {target_user_id} among {len(users_list)} total profiles")

        # Find target user in list
        target_user = next((u for u in users_list if str(u.get('_id')) == str(target_user_id)), None)
        if not target_user:
            logging.error(f"Target user {target_user_id} not found in users list")
            return jsonify({"error": f"Target user {target_user_id} not found"}), 404
            
        # Extract unique vocabulary of skills and interests
        all_tags = set()
        for u in users_list:
            all_tags.update(u.get('skills', []))
            all_tags.update(u.get('interests', []))
            
        all_tags = sorted(list(all_tags))
        num_tags = len(all_tags)
        
        # If no skills or interests exist in the whole database, return empty recommendations
        if num_tags == 0:
            logging.info("No skill or interest tags found in database. Returning empty list.")
            return jsonify({
                "target_user_id": target_user_id,
                "recommendations": []
            })
            
        tag_to_idx = {tag: i for i, tag in enumerate(all_tags)}
        
        # Feature Engineering:
        # Convert each user profile to a vector:
        # [skills_binary_vector (num_tags), interests_binary_vector (num_tags), num_skills, num_interests]
        features = []
        user_ids = []
        
        for u in users_list:
            user_ids.append(str(u.get('_id')))
            s_vec = np.zeros(num_tags)
            i_vec = np.zeros(num_tags)
            
            for s in u.get('skills', []):
                if s in tag_to_idx:
                    s_vec[tag_to_idx[s]] = 1.0
            for r in u.get('interests', []):
                if r in tag_to_idx:
                    i_vec[tag_to_idx[r]] = 1.0
                    
            num_skills = float(len(u.get('skills', [])))
            num_interests = float(len(u.get('interests', [])))
            
            # Combine binary vectors and engineered numerical stats
            row = np.concatenate([s_vec, i_vec, [num_skills, num_interests]])
            features.append(row)
            
        features = np.array(features)
        
        # Preprocessing Pipeline: MinMaxScaler to scale features between 0 and 1
        scaler = MinMaxScaler()
        scaled_features = scaler.fit_transform(features)

        # Weight vector: tag columns at full strength, the engineered counts damped
        feature_weights = np.ones(scaled_features.shape[1])
        feature_weights[2 * num_tags:] = COUNT_FEATURE_WEIGHT
        scaled_features = scaled_features * feature_weights

        # Get target user's original vector index
        target_idx = user_ids.index(str(target_user_id))
        target_orig = features[target_idx]
        
        # Build a complementary query vector for target user
        # We want to match:
        # target's interests -> other's skills (swap skills and interests)
        # target's skills -> other's interests (swap interests and skills)
        target_skills_part = target_orig[:num_tags]
        target_interests_part = target_orig[num_tags:2*num_tags]
        target_num_skills = target_orig[2*num_tags]
        target_num_interests = target_orig[2*num_tags + 1]
        
        # Construct the query profile: swap taught-skills and learning-interests
        query_vector = np.concatenate([
            target_interests_part, 
            target_skills_part, 
            [target_num_interests, target_num_skills]
        ]).reshape(1, -1)
        
        # Scale the query vector using the same scaler fitted on user features,
        # then apply the identical weighting so both live in the same space
        query_scaled = scaler.transform(query_vector) * feature_weights
        
        # Fit KNN model using Cosine Similarity (metric='cosine')
        # We fit on all profiles
        n_neighbors = len(users_list)
        knn = NearestNeighbors(n_neighbors=n_neighbors, metric='cosine', algorithm='brute')
        knn.fit(scaled_features)
        
        # Query KNN
        distances, indices = knn.kneighbors(query_scaled)
        
        distances = distances[0]
        indices = indices[0]
        
        recommendations = []
        for dist, idx in zip(distances, indices):
            rec_id = user_ids[idx]
            # Exclude the target user
            if rec_id == str(target_user_id):
                continue
                
            # Cosine similarity = 1 - Cosine distance
            sim_score = max(0.0, min(1.0, 1.0 - float(dist)))
            
            # Feature check: calculate overlap to ensure matches have some common ground
            rec_user = users_list[idx]
            target_skills_set = set(target_user.get('skills', []))
            target_interests_set = set(target_user.get('interests', []))
            rec_skills_set = set(rec_user.get('skills', []))
            rec_interests_set = set(rec_user.get('interests', []))
            
            # Mutual skill swap overlap. Return the skills themselves and not
            # just how many there are, so the UI can name the reason for a match.
            # gives    = what they teach that the target wants to learn
            # receives = what the target teaches that they want to learn
            gives_skills = sorted(target_interests_set.intersection(rec_skills_set))
            receives_skills = sorted(target_skills_set.intersection(rec_interests_set))

            gives_match = len(gives_skills)
            receives_match = len(receives_skills)

            # Boost the similarity score based on direct complementarity
            # (KNN with raw cosine distance on swapped profile is already doing this,
            # but we can explicitly record if there is a match)
            has_match = (gives_match > 0 or receives_match > 0)

            recommendations.append({
                "user_id": rec_id,
                "score": round(sim_score, 4),
                "gives_match": gives_match,
                "receives_match": receives_match,
                "gives_skills": gives_skills,
                "receives_skills": receives_skills,
                "has_overlap": has_match
            })
            
        # Sort by similarity score, breaking ties with the count of concrete
        # two-way skill overlaps so equally-scored profiles order deterministically
        recommendations = sorted(
            recommendations,
            key=lambda x: (x['score'], x['gives_match'] + x['receives_match']),
            reverse=True
        )
        
        logging.info(f"Successfully computed {len(recommendations)} recommendations for user {target_user_id}")
        return jsonify({
            "target_user_id": target_user_id,
            "recommendations": recommendations
        })
        
    except Exception as e:
        logging.error(f"Error in recommendation logic: {str(e)}", exc_info=True)
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    logging.info("Starting Flask ML Service on port 5000...")
    app.run(host='0.0.0.0', port=5000, debug=True)
