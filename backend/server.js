const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
require('dotenv').config();
const geocodeRoutes = require('./routes/geocode');
const employeeRoutes = require('./routes/employee');
const teamLeaderRoutes = require('./routes/teamleader');
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const { router: userRoutes, addHourlyLeaveBalance } = require('./routes/user');
const notificationRoutes = require('./routes/notification'); // Add this
const weekOffRoutes = require('./routes/weekOffRoutes');
const app = express();
const server = http.createServer(app);
const cron = require('node-cron');

// Setup Socket.IO with CORS
const io = socketIo(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "https://empeople.esromagica.in",
    methods: ["GET", "POST"],
    credentials: true
  }
});

const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Make io available in routes
app.set('socketio', io);

// Database Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB connected successfully'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// Socket.IO Authentication & Connection Handling
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    
    if (!token) {
      return next(new Error('Authentication error'));
    }

    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const User = require('./models/User');
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      return next(new Error('User not found'));
    }

    socket.userId = user._id.toString();
    socket.user = user;
    next();
  } catch (error) {
    next(new Error('Authentication error'));
  }
});

io.on('connection', (socket) => {
  console.log(`🔌 User ${socket.user['First name']} ${socket.user['Last name']} connected - Socket ID: ${socket.id}`);
  
  // Join user to their personal room for targeted notifications
  socket.join(socket.userId);
  
  // Join room based on user type for broadcasting
  socket.join(socket.user.userType);

  socket.on('disconnect', () => {
    console.log(`🔌 User ${socket.user['First name']} ${socket.user['Last name']} disconnected`);
  });

  // Handle real-time notification read status
  socket.on('mark_notification_read', async (notificationId) => {
    try {
      const Notification = require('./models/Notification');
      await Notification.findByIdAndUpdate(
        notificationId,
        { $addToSet: { readBy: { user: socket.userId, readAt: new Date() } } }
      );
      
      // Broadcast read status to user's other devices
      socket.to(socket.userId).emit('notification_read', notificationId);
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  });
});

// Simple GET route
app.get('/', (req, res) => {
  res.send('🚀 EMP Backend with Socket.IO is running successfully!');
});
 // path to your function file

// Schedule cron job to run every minute for testing
cron.schedule('0 0 1 * *', async () => {
  console.log('🧪 Monthly leave update run on 1st day at 12:00 AM IST');
  await addHourlyLeaveBalance();
}, {
  timezone: 'Asia/Kolkata'
});



// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/employee', employeeRoutes);
app.use('/api/teamleader', teamLeaderRoutes);
app.use('/api/user', userRoutes);
app.use('/api/weekoff', weekOffRoutes);
app.use('/api/notifications', notificationRoutes); // Add this line
app.use('/api/geocode', geocodeRoutes);
server.listen(6000, '::', () => {
  console.log('Server listening on all IPv6 interfaces on port 6000');
});





