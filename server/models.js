const mongoose = require('mongoose');

// ==========================================
// 1. User Schema
// ==========================================
const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: true,
  },
  skills: {
    type: [String],
    default: [],
  },
  interests: {
    type: [String],
    default: [],
  },
  bio: {
    type: String,
    default: '',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  }
});

// Optimization Indexes
UserSchema.index({ skills: 1 });
UserSchema.index({ interests: 1 });

// ==========================================
// 2. Match Schema
// ==========================================
const MatchSchema = new mongoose.Schema({
  requester: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'declined'],
    default: 'pending',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  }
});

// Optimization Indexes for fast match lookup and status checking
MatchSchema.index({ requester: 1, recipient: 1 }, { unique: true });
MatchSchema.index({ recipient: 1 });
MatchSchema.index({ status: 1 });

// ==========================================
// 3. Notification Schema
// ==========================================
const NotificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  match: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Match',
  },
  type: {
    type: String,
    enum: ['match_request', 'match_accept', 'match_decline'],
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  read: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  }
});

// Optimization Indexes for listing unread notifications
NotificationSchema.index({ recipient: 1, read: 1 });

// ==========================================
// 4. Activity Log Schema
// ==========================================
const ActivityLogSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  action: {
    type: String, // 'login', 'update_profile', 'send_match_request', 'respond_match'
    required: true,
  },
  details: {
    type: mongoose.Schema.Types.Mixed,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  }
});

// Indexing activity log for sessions
ActivityLogSchema.index({ user: 1, createdAt: -1 });

// Export Models
const User = mongoose.model('User', UserSchema);
const Match = mongoose.model('Match', MatchSchema);
const Notification = mongoose.model('Notification', NotificationSchema);
const ActivityLog = mongoose.model('ActivityLog', ActivityLogSchema);

module.exports = {
  User,
  Match,
  Notification,
  ActivityLog,
};
