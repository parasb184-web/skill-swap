require('dotenv').config();
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const connectDB = require('./db');
const routes = require('./routes');

const app = express();
const server = http.createServer(app);

// Initialize Socket.io with CORS settings
const io = socketIo(server, {
  cors: {
    origin: '*', // Allow all origins for development
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  }
});

// Connect to Database
connectDB();

// Middlewares
app.use(cors());
app.use(express.json());

// Track online users: Map of userIdString -> socketIdString
const onlineUsers = new Map();

io.on('connection', (socket) => {
  console.log(`Socket connected: ${socket.id}`);

  // User registers their active session
  socket.on('register_user', (userId) => {
    if (userId) {
      onlineUsers.set(userId.toString(), socket.id);
      console.log(`User registered: User ${userId} is on Socket ${socket.id}`);
    }
  });

  socket.on('disconnect', () => {
    console.log(`Socket disconnected: ${socket.id}`);
    for (const [userId, socketId] of onlineUsers.entries()) {
      if (socketId === socket.id) {
        onlineUsers.delete(userId);
        console.log(`User unregistered: User ${userId} left.`);
        break;
      }
    }
  });
});

// Middleware to inject socket.io and online user map into express request
app.use((req, res, next) => {
  req.io = io;
  req.onlineUsers = onlineUsers;
  next();
});

// API Routes
app.use('/api', routes);

// Base route / health check
app.get('/', (req, res) => {
  res.json({
    message: 'SkillSwap API Server is running.',
    database: connectDB ? 'Connected/Configured' : 'Offline',
    sockets: `${onlineUsers.size} users online`
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err.stack);
  res.status(500).json({ error: 'Internal server error occurred.' });
});

const PORT = process.env.PORT || 5050;
server.listen(PORT, () => {
  console.log(`Express server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});
