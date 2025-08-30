const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const employeeRoutes = require('./routes/employee'); // 1. Import the new routes
const teamLeaderRoutes = require('./routes/teamleader'); // NEW IMPORT
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin'); // Add this import
const userRoutes = require('./routes/user');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Database Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB connected successfully'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// Simple GET route
app.get('/', (req, res) => {
  res.send('🚀 EMP Backend is running successfully!');
});


// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/employee', employeeRoutes); // 2. Use the new routes with a prefix
app.use('/api/teamleader', teamLeaderRoutes); // NEW ROUTE
app.use('/api/user', userRoutes);

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
