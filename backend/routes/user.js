const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');
const Attendance = require('../models/Attendance');
const mongoose = require('mongoose');
// Middleware to check if user is an admin
const checkAdmin = (req, res, next) => {
  if (req.user.userType !== 'admin') {
    return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
  }
  next();
};
function parseDateTime(dateStr, timeStr) {
  if (!dateStr || !timeStr) return null;
  // dateStr: "2025-09-26"
  // timeStr: "09:00"
  const [hours, minutes] = timeStr.split(':').map(Number);
  const dt = new Date(dateStr);
  dt.setHours(hours, minutes, 0, 0);
  return dt;
}


async function addHourlyLeaveBalance() {
  try {
    const leaveToAdd = 1.5;

    // Find eligible users where isLeaveApplicable is true
    const eligibleUsers = await User.find({
      isLeaveApplicable: true
    });

    if (eligibleUsers.length === 0) {
      console.log('📭 No eligible users found with leave applicable.');
      return;
    }

    const eligibleUserIds = eligibleUsers.map(user => user._id);

    // Add 1.5 days leave to eligible users
    const result = await User.updateMany(
      { _id: { $in: eligibleUserIds } },
      { $inc: { paidLeaveBalance: leaveToAdd } }
    );

    console.log(`✅ Monthly leave granted: ${leaveToAdd} days to ${result.modifiedCount} eligible users.`);
  } catch (err) {
    console.error('❌ Error updating monthly leave balance:', err);
  }
}



// ROUTE: GET /api/user/:id/attendance
// DESC: Get attendance for a specific user by ID (admin only)


router.get('/:id/attendance', auth,checkAdmin, async (req, res) => {
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



router.get('/:id/leave-balance', auth, async (req, res) => {
  const userId = req.params.id;

  // Check for valid ObjectId
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).json({ message: 'Invalid user ID' });
  }

  try {
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const paidLeavesTaken = (user.leaves || [])
      .filter(leave => leave.type === 'paid' && leave.status === 'approved')
      .reduce((total, leave) => total + leave.duration, 0);

    const unpaidLeavesTaken = (user.leaves || [])
      .filter(leave => leave.type === 'unpaid' && leave.status === 'approved')
      .reduce((total, leave) => total + leave.duration, 0);

    res.json({
      remainingPaidLeave: user.paidLeaveBalance || 0,
      paidLeavesTaken,
      unpaidLeavesTaken,
    });
  } catch (error) {
    console.error('Error fetching user leave balance:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// Assuming your imports and middleware are set above


router.put('/attendance/update', auth, checkAdmin, async (req, res) => {
  try {
    const { userId, date, checkIn, checkOut, comment } = req.body;

    if (!userId || !date) {
      return res.status(400).json({ message: 'userId and date are required' });
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: 'Invalid userId' });
    }

    // Normalize the date range (start and end of the day)
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    // Normalize date for storing (UTC midnight)
    const normalizedDate = new Date(Date.UTC(
      startOfDay.getFullYear(),
      startOfDay.getMonth(),
      startOfDay.getDate()
    ));

    // Helper to parse checkIn/checkOut times
    const parseDateTime = (dateStr, timeStr) => {
      if (!timeStr) return null;
      const [hour, minute] = timeStr.split(':').map(Number);
      const dt = new Date(dateStr);
      dt.setHours(hour, minute, 0, 0);
      return dt;
    };

    const checkInDate = checkIn ? parseDateTime(date, checkIn) : null;
    const checkOutDate = checkOut ? parseDateTime(date, checkOut) : null;

    // Use date range instead of exact match to avoid timezone issues
    let attendance = await Attendance.findOne({
      employeeId: userId,
      date: {
        $gte: startOfDay,
        $lte: endOfDay
      }
    });

    if (!attendance) {
      // Create a new attendance record
      attendance = new Attendance({
        employeeId: userId,
        date: normalizedDate,
        remarks: comment || '',
        updatedBy: req.user._id,
        updatedAt: new Date(),
      });

      if (checkInDate) {
        attendance.updatedCheckIn = checkInDate;
        attendance.updatedCheckInAt = new Date();
        attendance.updatedCheckInBy = req.user._id;
      }

      if (checkOutDate) {
        attendance.updatedCheckOut = checkOutDate;
        attendance.updatedCheckOutAt = new Date();
        attendance.updatedCheckOutBy = req.user._id;
      }

      await attendance.save();

      return res.status(201).json({
        message: 'Attendance record created with updated check-in/out.',
        attendance,
      });
    }

    // Update existing attendance
    if (checkInDate) {
      attendance.updatedCheckIn = checkInDate;
      attendance.updatedCheckInAt = new Date();
      attendance.updatedCheckInBy = req.user._id;
    }

    if (checkOutDate) {
      attendance.updatedCheckOut = checkOutDate;
      attendance.updatedCheckOutAt = new Date();
      attendance.updatedCheckOutBy = req.user._id;
    }

    if (comment !== undefined) {
      attendance.remarks = comment;
    }

    attendance.updatedBy = req.user._id;
    attendance.updatedAt = new Date();

    await attendance.save();

    return res.json({ message: 'Attendance updated successfully.', attendance });

  } catch (error) {
    console.error('Error updating attendance:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});


module.exports = {
  router,
  addHourlyLeaveBalance
};