# SkillSwap | ML-Powered Peer Learning Platform

SkillSwap is a full-stack, machine learning-powered peer learning platform where users can trade their skills. If Alice knows React and wants to learn Python, and Bob knows Python and wants to learn React, our recommendation engine pairs them together using Cosine Similarity and K-Nearest Neighbors (KNN).

---

## Folder Structure

```
d:\skillswap/
├── client/              # React frontend (Vite)
│   ├── src/
│   │   ├── components/  # Navbar, MatchCard, ProfileSetup
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
│   └── .env             # Configuration properties
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
- **K-Nearest Neighbors**: Trains a `NearestNeighbors` model using `metric='cosine'` to search for complementary profiles.
- **Complementary Matching**: Instead of matching similar users, we **swap** the target user's taught skills and learning interests inside the query vector. This directly returns learners whose taught skills align with the target user's learning interests and vice versa.

### 2. Node.js Backend Server (`/server`)
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
   - Log in as **Alice Johnson** (`alice@skillswap.com`): She knows React/JS and wants to learn Python/ML.
   - She will be recommended **Bob Smith** (`bob@skillswap.com`): He knows Python/ML and wants to learn React/UI.
   - This represents a perfect complementary match (showing high match scores and a "Mutual Skill Swap Potential!" badge).
2. **Real-time Notifications**:
   - Open two browser tabs: one logged in as Alice and the other logged in as Bob.
   - Have Alice request a swap with Bob.
   - Bob's notification bell will immediately ring and show a red badge. Inside the notification dropdown, Bob can click "Accept Swap" or "Decline Swap" in real-time.
