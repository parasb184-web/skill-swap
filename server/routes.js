const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const axios = require('axios');
const { User, Match, Notification, ActivityLog } = require('./models');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'skillswap_jwt_secret_token_12345';
const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:5000';

// ==========================================
// Caching Middleware for Recommendations
// ==========================================
const recsCache = new Map(); // userId -> { data, expiry }
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes cache lifetime

const getCachedRecs = (userId) => {
  const item = recsCache.get(userId.toString());
  if (!item) return null;
  if (Date.now() > item.expiry) {
    recsCache.delete(userId.toString());
    return null;
  }
  return item.data;
};

const setCachedRecs = (userId, data) => {
  recsCache.set(userId.toString(), {
    data,
    expiry: Date.now() + CACHE_TTL
  });
};

const invalidateRecsCache = (userId) => {
  recsCache.delete(userId.toString());
};

// ==========================================
// Authentication Middleware
// ==========================================
const protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = await User.findById(decoded.id).select('-password');
      if (!req.user) {
        return res.status(401).json({ error: 'User not found' });
      }
      next();
    } catch (error) {
      console.error('JWT Verification error:', error.message);
      return res.status(401).json({ error: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    return res.status(401).json({ error: 'Not authorized, no token provided' });
  }
};

// Builds a lookup of this user's relationship with everyone they have a Match
// record with. Shared by the recommendation feed and the browse directory so
// both label a person's status identically.
// other_user_id -> { status: 'pending_sent'|'pending_received'|'accepted'|'declined', matchId }
const buildRelationMap = async (userId) => {
  const existingMatches = await Match.find({
    $or: [{ requester: userId }, { recipient: userId }]
  }).lean();

  const map = new Map();
  existingMatches.forEach(m => {
    const isReq = m.requester.toString() === userId.toString();
    const otherUser = isReq ? m.recipient.toString() : m.requester.toString();
    let status = null;
    if (m.status === 'accepted') {
      status = 'accepted';
    } else if (m.status === 'declined') {
      status = 'declined';
    } else if (m.status === 'pending') {
      status = isReq ? 'pending_sent' : 'pending_received';
    }
    if (status) {
      map.set(otherUser, { status, matchId: m._id });
    }
  });
  return map;
};

// Escapes user input before it is used inside a RegExp
const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Helper to log user activities
const logActivity = async (userId, action, details = {}) => {
  try {
    await ActivityLog.create({ user: userId, action, details });
  } catch (error) {
    console.error('Activity logging failed:', error.message);
  }
};

// ==========================================
// 1. Auth Endpoints
// ==========================================

// Register
router.post('/auth/register', async (req, res) => {
  const { name, email, password } = req.body;
  
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Please provide all fields' });
  }

  try {
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      skills: [],
      interests: [],
      bio: ''
    });

    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '7d' });
    await logActivity(user._id, 'register');

    res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        skills: user.skills,
        interests: user.interests,
        bio: user.bio
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Login
router.post('/auth/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Please provide email and password' });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '7d' });
    await logActivity(user._id, 'login');

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        skills: user.skills,
        interests: user.interests,
        bio: user.bio
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// 2. Profile Endpoints
// ==========================================

// Get current profile
router.get('/users/profile', protect, async (req, res) => {
  res.json({
    id: req.user._id,
    name: req.user.name,
    email: req.user.email,
    skills: req.user.skills,
    interests: req.user.interests,
    bio: req.user.bio
  });
});

// Update profile
router.put('/users/profile', protect, async (req, res) => {
  const { name, bio, skills, interests } = req.body;

  try {
    const user = await User.findById(req.user._id);

    if (name) user.name = name;
    if (bio !== undefined) user.bio = bio;
    if (skills) user.skills = skills;
    if (interests) user.interests = interests;

    await user.save();
    
    // Invalidate recommendation cache so new recommendations compute instantly
    invalidateRecsCache(user._id);
    await logActivity(user._id, 'update_profile');

    res.json({
      id: user._id,
      name: user.name,
      email: user.email,
      skills: user.skills,
      interests: user.interests,
      bio: user.bio
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// 3. Recommendation Engine Integration
// ==========================================

router.get('/recommendations', protect, async (req, res) => {
  try {
    const userId = req.user._id;

    // 1. Check in-memory cache
    const cachedData = getCachedRecs(userId);
    if (cachedData) {
      // Return cached results
      return res.json(cachedData);
    }

    // 2. Fetch all user profiles from DB
    // Retrieve only necessary fields to keep payload light for 200+ concurrency
    const allUsers = await User.find({}, '_id skills interests name bio').lean();

    // 3. Request recommendation from Python ML Flask service
    let mlResponse;
    try {
      mlResponse = await axios.post(`${ML_SERVICE_URL}/recommend`, {
        target_user_id: userId.toString(),
        users: allUsers
      }, { timeout: 4000 }); // 4s timeout
    } catch (mlError) {
      console.error('Failed to communicate with Flask ML Service:', mlError.message);
      // Fallback matching in JS if ML service is down
      return res.status(503).json({ 
        error: 'Recommendation service is temporarily unavailable. Please try again later.' 
      });
    }

    const { recommendations } = mlResponse.data;

    // 4. Look up existing relationships so matched/pending people are filtered out
    const matchMap = await buildRelationMap(userId);

    // 5. Populate and filter recommended users
    const detailedRecommendations = [];
    
    for (let rec of recommendations) {
      const recUserId = rec.user_id;

      // Filter out users who are already matched/declined or pending
      const relation = matchMap.get(recUserId);
      const matchStatus = relation ? relation.status : null;
      if (matchStatus === 'accepted' || matchStatus === 'declined' || matchStatus === 'pending_sent') {
        continue;
      }

      // Find user profile details
      const profile = allUsers.find(u => u._id.toString() === recUserId);
      if (!profile) continue;

      detailedRecommendations.push({
        user: {
          id: profile._id,
          name: profile.name,
          bio: profile.bio,
          skills: profile.skills,
          interests: profile.interests
        },
        score: rec.score,
        gives_match: rec.gives_match,
        receives_match: rec.receives_match,
        // The actual skills driving the match, for display on the card
        gives_skills: rec.gives_skills || [],
        receives_skills: rec.receives_skills || [],
        has_overlap: rec.has_overlap,
        matchStatus: matchStatus || 'none', // 'pending_received' or 'none'
        // Present only for 'pending_received' so the client can accept/decline that exact request
        matchId: matchStatus === 'pending_received' ? relation.matchId : null
      });
    }

    // 6. Cache the output
    setCachedRecs(userId, detailedRecommendations);
    res.json(detailedRecommendations);

  } catch (error) {
    console.error('Error in recommendations route:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// 3b. Directory: search & browse
// ==========================================

// Search every profile by free text and/or an exact skill / interest filter.
// This is the non-ML discovery path: it answers "who teaches Python?" directly
// instead of waiting for the recommender to surface someone.
router.get('/users/search', protect, async (req, res) => {
  const userId = req.user._id;
  const { q = '', skill = '', interest = '', page = '1', limit = '12' } = req.query;

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const perPage = Math.min(50, Math.max(1, parseInt(limit, 10) || 12));

  try {
    // Never show the searcher themselves
    const filters = [{ _id: { $ne: userId } }];

    const term = String(q).trim();
    if (term) {
      const rx = new RegExp(escapeRegex(term), 'i');
      filters.push({ $or: [{ name: rx }, { bio: rx }, { skills: rx }, { interests: rx }] });
    }

    // Exact (case-insensitive) tag filters, served by the skills/interests indexes
    const skillFilter = String(skill).trim();
    if (skillFilter) {
      filters.push({ skills: new RegExp(`^${escapeRegex(skillFilter)}$`, 'i') });
    }
    const interestFilter = String(interest).trim();
    if (interestFilter) {
      filters.push({ interests: new RegExp(`^${escapeRegex(interestFilter)}$`, 'i') });
    }

    const query = { $and: filters };

    const [total, users, relationMap] = await Promise.all([
      User.countDocuments(query),
      User.find(query, '_id name bio skills interests')
        .sort({ name: 1 })
        .skip((pageNum - 1) * perPage)
        .limit(perPage)
        .lean(),
      buildRelationMap(userId)
    ]);

    // Compute the same complementarity view the recommendation cards show, so a
    // browsed profile explains itself just as well as a recommended one.
    const mySkills = new Set(req.user.skills);
    const myInterests = new Set(req.user.interests);

    const results = users.map(u => {
      const relation = relationMap.get(u._id.toString());
      // Sorted to match the ordering the ML service returns for recommendations
      const givesSkills = (u.skills || []).filter(s => myInterests.has(s)).sort();
      const receivesSkills = (u.interests || []).filter(i => mySkills.has(i)).sort();
      return {
        user: {
          id: u._id,
          name: u.name,
          bio: u.bio,
          skills: u.skills,
          interests: u.interests
        },
        gives_match: givesSkills.length,
        receives_match: receivesSkills.length,
        gives_skills: givesSkills,
        receives_skills: receivesSkills,
        has_overlap: givesSkills.length > 0 || receivesSkills.length > 0,
        matchStatus: relation ? relation.status : 'none',
        matchId: relation && relation.status === 'pending_received' ? relation.matchId : null
      };
    });

    res.json({
      results,
      page: pageNum,
      perPage,
      total,
      totalPages: Math.max(1, Math.ceil(total / perPage))
    });
  } catch (error) {
    console.error('Error in user search route:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Every tag in use, with how many people teach or want it. Powers the browse
// filters and doubles as a "what is in demand" signal.
router.get('/skills', protect, async (req, res) => {
  try {
    const tally = (field) => User.aggregate([
      { $unwind: `$${field}` },
      { $group: { _id: `$${field}`, count: { $sum: 1 } } },
      { $sort: { count: -1, _id: 1 } }
    ]);

    const [taught, wanted] = await Promise.all([tally('skills'), tally('interests')]);

    res.json({
      skills: taught.map(t => ({ name: t._id, count: t.count })),
      interests: wanted.map(t => ({ name: t._id, count: t.count }))
    });
  } catch (error) {
    console.error('Error in skills catalog route:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// 4. Swap Matching Endpoints
// ==========================================

// Request to match
router.post('/matches/request', protect, async (req, res) => {
  const { recipientId } = req.body;
  const requesterId = req.user._id;

  if (!recipientId) {
    return res.status(400).json({ error: 'Recipient ID is required' });
  }

  if (requesterId.toString() === recipientId.toString()) {
    return res.status(400).json({ error: 'You cannot match with yourself' });
  }

  try {
    const recipient = await User.findById(recipientId);
    if (!recipient) {
      return res.status(404).json({ error: 'Recipient not found' });
    }

    // Check if relation already exists
    const existing = await Match.findOne({
      $or: [
        { requester: requesterId, recipient: recipientId },
        { requester: recipientId, recipient: requesterId }
      ]
    });

    if (existing) {
      return res.status(400).json({ error: 'Match request or relationship already exists' });
    }

    // Create pending match
    const match = await Match.create({
      requester: requesterId,
      recipient: recipientId,
      status: 'pending'
    });

    // Create Notification
    const notification = await Notification.create({
      recipient: recipientId,
      sender: requesterId,
      match: match._id,
      type: 'match_request',
      message: `${req.user.name} sent you a skill swap request! Check out their profile.`
    });

    await logActivity(requesterId, 'send_match_request', { recipientId });

    // Send real-time Socket.io push if recipient is online
    if (req.onlineUsers && req.io) {
      const recipientSocketId = req.onlineUsers.get(recipientId.toString());
      if (recipientSocketId) {
        // Send full populated notification
        const populatedNotification = {
          _id: notification._id,
          recipient: notification.recipient,
          // Same shape as the populated match returned by GET /notifications
          match: { _id: match._id, status: match.status },
          sender: {
            id: req.user._id,
            name: req.user.name,
            skills: req.user.skills,
            interests: req.user.interests
          },
          type: notification.type,
          message: notification.message,
          read: notification.read,
          createdAt: notification.createdAt
        };
        req.io.to(recipientSocketId).emit('notification', populatedNotification);
      }
    }

    // Invalidate recommendation cache for both users
    invalidateRecsCache(requesterId);
    invalidateRecsCache(recipientId);

    res.status(201).json({ message: 'Swap request sent successfully', match });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Respond to match request (Accept / Decline)
router.post('/matches/respond', protect, async (req, res) => {
  const { matchId, action } = req.body; // action: 'accept' or 'decline'
  const userId = req.user._id;

  if (!matchId || !action || !['accept', 'decline'].includes(action)) {
    return res.status(400).json({ error: 'Match ID and action (accept/decline) are required' });
  }

  try {
    const match = await Match.findById(matchId);
    if (!match) {
      return res.status(404).json({ error: 'Match record not found' });
    }

    // Ensure user is the recipient of the match request
    if (match.recipient.toString() !== userId.toString()) {
      return res.status(403).json({ error: 'Unauthorized to respond to this request' });
    }

    if (match.status !== 'pending') {
      return res.status(400).json({ error: 'This match request is no longer pending' });
    }

    if (action === 'accept') {
      match.status = 'accepted';
      await match.save();

      // Create success notification for requester
      const notification = await Notification.create({
        recipient: match.requester,
        sender: userId,
        match: match._id,
        type: 'match_accept',
        message: `${req.user.name} accepted your skill swap request! You can now start learning together.`
      });

      await logActivity(userId, 'accept_match', { matchId });

      // Real-time Socket.io notification to requester
      if (req.onlineUsers && req.io) {
        const requesterSocketId = req.onlineUsers.get(match.requester.toString());
        if (requesterSocketId) {
          const populatedNotification = {
            _id: notification._id,
            recipient: notification.recipient,
            match: { _id: match._id, status: match.status },
            sender: {
              id: req.user._id,
              name: req.user.name,
              skills: req.user.skills,
              interests: req.user.interests
            },
            type: notification.type,
            message: notification.message,
            read: notification.read,
            createdAt: notification.createdAt
          };
          req.io.to(requesterSocketId).emit('notification', populatedNotification);
        }
      }
    } else {
      match.status = 'declined';
      await match.save();
      await logActivity(userId, 'decline_match', { matchId });
    }

    // Invalidate caches
    invalidateRecsCache(match.requester);
    invalidateRecsCache(match.recipient);

    res.json({ message: `Match request ${action}ed successfully`, match });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all mutual (accepted) matches
router.get('/matches', protect, async (req, res) => {
  const userId = req.user._id;

  try {
    const matches = await Match.find({
      status: 'accepted',
      $or: [{ requester: userId }, { recipient: userId }]
    }).populate('requester recipient', '-password').lean();

    // Map matches to extract target partner profile
    const partners = matches.map(m => {
      const isRequester = m.requester._id.toString() === userId.toString();
      const partner = isRequester ? m.recipient : m.requester;
      return {
        matchId: m._id,
        connectedAt: m.createdAt,
        partner: {
          id: partner._id,
          name: partner.name,
          email: partner.email, // Expose email to start communication
          bio: partner.bio,
          skills: partner.skills,
          interests: partner.interests
        }
      };
    });

    res.json(partners);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get received pending match requests
router.get('/matches/pending', protect, async (req, res) => {
  const userId = req.user._id;

  try {
    const requests = await Match.find({
      recipient: userId,
      status: 'pending'
    }).populate('requester', '-password').lean();

    const formatted = requests.map(r => ({
      matchId: r._id,
      sentAt: r.createdAt,
      requester: {
        id: r.requester._id,
        name: r.requester.name,
        bio: r.requester.bio,
        skills: r.requester.skills,
        interests: r.requester.interests
      }
    }));

    res.json(formatted);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// 5. Notifications Endpoints
// ==========================================

// Get user notifications
router.get('/notifications', protect, async (req, res) => {
  const userId = req.user._id;

  try {
    // The match status travels with the notification so the client knows whether
    // a request is still actionable (accept/decline) or already resolved.
    const notifications = await Notification.find({ recipient: userId })
      .populate('sender', 'name skills interests')
      .populate('match', 'status')
      .sort({ createdAt: -1 })
      .lean();

    res.json(notifications);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Mark all as read
router.put('/notifications/read', protect, async (req, res) => {
  const userId = req.user._id;

  try {
    await Notification.updateMany(
      { recipient: userId, read: false },
      { $set: { read: true } }
    );
    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
