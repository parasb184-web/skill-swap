# SkillSwap | ML-Powered Peer Learning Platform

SkillSwap is a full-stack, machine learning-powered peer learning platform where users can trade their skills. If Alice knows React and wants to learn Python, and Bob knows Python and wants to learn React, our recommendation engine pairs them together using Cosine Similarity and K-Nearest Neighbors (KNN).

---

## Folder Structure

```
skill-swap/
├── client/              # React frontend (Vite)
│   ├── src/
│   │   ├── components/  # Navbar, MatchCard, ProfileSetup, BrowseDirectory
│   │   ├── pages/       # Auth (Login/Register), Dashboard
│   │   ├── index.css    # Premium glassmorphic design system
│   │   └── App.jsx      # State manager & socket connection
│   └── index.html       # Webpage entry & SEO meta
│
├── server/              # Node.js Express Backend
│   ├── db.js            # Mongoose setup with connection pool
│   ├── models.js        # User, Match, Notification, Activity schemas
│   ├── routes.js        # Express API endpoints & ML interface
│   ├── server.js        # Server bootstrap + Socket.io server
│   ├── seed.js          # Database populator (16 rich users)
│   ├── .env.example     # Template for the config below
│   └── .env             # Configuration properties (git-ignored)
│
└── ml-service/          # Python Flask ML Service
    ├── app.py           # Preprocessing (MinMaxScaler) & KNN matching logic
    └── requirements.txt # Python packages
```

---

## Technical Features

### 1. ML Recommendation Engine (`/ml-service`)
- **Feature Engineering**: Encodes taught skills and learning interests into a joint binary tag space, and appends numerical statistics like the number of skills and interests.
- **MinMaxScaling**: Standardizes the mixed binary and numerical representation using a `MinMaxScaler` pipeline.
- **Feature Weighting**: The two count features are dense values sitting in an otherwise sparse tag space, so they are down-weighted (`COUNT_FEATURE_WEIGHT`) before the distance is computed. At full weight, profile *size* dominates the cosine similarity and users sharing no skills at all outrank genuine complementary matches.
- **K-Nearest Neighbors**: Trains a `NearestNeighbors` model using `metric='cosine'` to search for complementary profiles.
- **Complementary Matching**: Instead of matching similar users, we **swap** the target user's taught skills and learning interests inside the query vector. This directly returns learners whose taught skills align with the target user's learning interests and vice versa.
- **Explainable Results**: Every recommendation returns the *actual overlapping skills* (`gives_skills` / `receives_skills`), not just a similarity number, so each card can state exactly why the pairing works.

### 2. Node.js Backend Server (`/server`)
- **Directory Search**: `GET /api/users/search` browses every profile with free-text search (name, bio, skills, interests), exact skill/interest filters, and pagination — the non-ML discovery path for "who teaches Python?". Each row carries the same complementarity view and relationship status as a recommendation card. User input is escaped before use in a regex.
- **Skill Catalog**: `GET /api/skills` aggregates every tag in use with how many people teach or want it, powering the browse filters and doubling as a demand signal.
- **Connection Pooling**: Configured with a `maxPoolSize` of 200 to support high concurrency.
- **Recommendation Caching**: Caches recommendations in-memory for 5 minutes, invalidating only when a user updates their profile or takes a match action, ensuring rapid responses.
- **Real-Time Notifications**: Integrates Socket.io to push instantaneous notifications when swaps are requested or accepted.
- **DB Index Optimization**: Compiles indexes on user tags, match requester/recipient pairs, and notification read states to minimize database latency.

---

## Setup & Running Guide

### Prerequisites
- **Node.js**: v18+ or v22+
- **Python**: v3.10+
- **MongoDB**: Make sure MongoDB is running locally on port `27017` (e.g. standard Windows MongoDB service).

### Configuration
The server reads `server/.env`, but every value has a working local default, so this step is optional:
```bash
cp server/.env.example server/.env
```

### Quick start (all three services at once)
From the repository root, after the one-time ML setup in Step 1 below:
```bash
npm run setup   # installs root, server and client dependencies
npm run seed    # populates MongoDB with the 16 test profiles
npm run dev     # runs server + client + ML service together
```
The step-by-step instructions below do the same thing in three terminals.

---

### Step 1: Start the ML Service
Open a terminal in the `/ml-service` directory:
```bash
# Navigate to service
cd ml-service

# Create virtual environment (if not already created)
python -m venv .venv

# Activate virtual environment
# On Windows PowerShell:
.venv\Scripts\Activate.ps1
# On Windows CMD:
.venv\Scripts\activate.bat
# On macOS/Linux:
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start the Flask API
python app.py
```
*The recommendation API will run on `http://localhost:5000`.*

---

### Step 2: Set Up & Seed the Backend Server
Open a second terminal in the `/server` directory:
```bash
# Navigate to server
cd server

# Install Node dependencies
npm install

# Seed the database with 16 test profiles
npm run seed

# Start the Node.js server in development mode
npm run dev
```
*The backend API will run on `http://localhost:5050`.*

---

### Step 3: Start the React Frontend Client
Open a third terminal in the `/client` directory:
```bash
# Navigate to client
cd client

# Install frontend dependencies
npm install

# Launch Vite development server
npm run dev
```
*Open your browser and navigate to `http://localhost:5173` (or the port indicated in the terminal).*

---

## Testing & Verification

1. **Test Accounts**:
   - We seeded the database with 16 accounts, all with password `password123`.
   - Log in as **Alice Johnson** (`alice@skillswap.com`): She teaches React/JavaScript/CSS/Figma and wants to learn Python/ML/Data Science.
   - Her top recommendations are **Charlie Brown** (~57%), who teaches Python/Data Science and wants to learn CSS/Figma, and **Bob Smith** (~46%, `bob@skillswap.com`), who teaches Python/ML and wants to learn React.
   - Both are two-way complementary matches, so both show the "Mutual Skill Swap Potential!" badge. Profiles with no complementary overlap score ~0% and sort to the bottom.
   - Each card names the skills behind the match ("They can teach you **Machine Learning, Python**"), and ticks the specific badges responsible for it.
2. **Browse & Search**:
   - Open the **Browse All** tab to search the full directory by name, bio, or skill, or filter by a "Teaches" / "Wants to learn" tag chip.
   - Unlike the recommendation feed, browse shows everyone — including people you are already connected to or have a pending request with, labelled accordingly.
3. **Real-time Notifications**:
   - Open two browser tabs: one logged in as Alice and the other logged in as Bob.
   - Have Alice request a swap with Bob.
   - Bob's notification bell will immediately ring and show a red badge. Inside the notification dropdown, Bob can click "Accept Swap" or "Decline Swap" in real-time.
