const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');

// Middleware to check if user is an admin
const checkAdmin = (req, res, next) => {
  if (req.user.userType !== 'admin') {
    return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
  }
  next();
};

// ROUTE: GET /api/user/:id/attendance
// DESC: Get attendance for a specific user by ID (admin only)
router.get('/:id/attendance', auth, checkAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user.attendance);
  } catch (error) {
    console.error('Error fetching user attendance:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// ROUTE: GET /api/user/:id/leave-balance
// DESC: Get leave balance for a specific user by ID (admin only)
router.get('/:id/leave-balance', auth, checkAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const paidLeavesTaken = user.leaves
      .filter(leave => leave.type === 'paid' && leave.status === 'approved')
      .reduce((total, leave) => total + leave.duration, 0);

    const unpaidLeavesTaken = user.leaves
      .filter(leave => leave.type === 'unpaid' && leave.status === 'approved')
      .reduce((total, leave) => total + leave.duration, 0);

    res.json({
      remainingPaidLeave: user.paidLeaveBalance,
      paidLeavesTaken: paidLeavesTaken,
      unpaidLeavesTaken: unpaidLeavesTaken,
    });
  } catch (error) {
    console.error('Error fetching user leave balance:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

module.exports = router;
