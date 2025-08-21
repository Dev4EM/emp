const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');
// Helper function to normalize date to midnight IST for consistent day comparison
function normalizeToDay(date = new Date()) {
  // Convert to IST (UTC + 5:30)
  const istOffset = 5.5 * 60 * 60 * 1000; // IST is UTC + 5:30 in milliseconds
  const istDate = new Date(date.getTime() + istOffset);
  
  // Get the date string in IST
  const dayString = istDate.toISOString().split('T')[0]; // 'YYYY-MM-DD'
  
  // Create midnight IST for that day
  const dayDate = new Date(dayString + 'T00:00:00.000+05:30');
  
  return { dayString, dayDate };
}
// --- /my-attendance remains the same ---
router.get('/my-attendance', auth, async (req, res) => {
  res.json(req.user.attendance);
});

// ROUTE: GET /api/employee/leave-balance (UPDATED)
// DESC:  Get the leave balance, now calculated with durations
router.get('/leave-balance', auth, async (req, res) => {
  try {
    // Use reduce to sum up the duration of each leave
    const paidLeavesTaken = req.user.leaves
      .filter(leave => leave.type === 'paid')
      .reduce((total, leave) => total + leave.duration, 0);

    const unpaidLeavesTaken = req.user.leaves
      .filter(leave => leave.type === 'unpaid')
      .reduce((total, leave) => total + leave.duration, 0);

    res.json({
      remainingPaidLeave: req.user.paidLeaveBalance,
      paidLeavesTaken: paidLeavesTaken,
      unpaidLeavesTaken: unpaidLeavesTaken,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// ROUTE: POST /api/employee/apply-leave (UPDATED)
router.post('/apply-leave', auth, async (req, res) => {
  const { leaveDate, leaveType, leaveDuration } = req.body;
  const duration = leaveDuration === 0.5 ? 0.5 : 1;

  if (!leaveDate || !leaveType) {
    return res.status(400).json({ message: 'Leave date and type are required' });
  }
  if (leaveType !== 'paid' && leaveType !== 'unpaid') {
    return res.status(400).json({ message: 'Invalid leave type.' });
  }

  try {
    const user = await User.findById(req.user.id);
    const newLeaveDateString = new Date(leaveDate).toISOString().split('T')[0];

    const isLeaveAlreadyApplied = user.leaves.some(leave => {
      const existingDateString = leave.date.toISOString().split('T')[0];
      return existingDateString === newLeaveDateString;
    });

    if (isLeaveAlreadyApplied) {
      return res.status(400).json({ message: 'A leave has already been applied for this date.' });
    }

    // NOTE: We don't deduct paid leave balance here anymore - only after approval
    user.leaves.push({ 
      date: leaveDate, 
      type: leaveType, 
      duration: duration,
      status: 'pending' // Always pending initially
    });

    await user.save();

    res.status(201).json({ 
        message: 'Leave application submitted successfully. Awaiting approval.',
        leaveStatus: 'pending'
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
});


// NEW ROUTES FOR CHECK-IN AND CHECK-OUT

// ROUTE: POST /api/employee/check-in
// DESC: Check in for the current day with optional location
router.post('/check-in', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const now = new Date();
    const { dayDate } = normalizeToDay(now);

    // Check if attendance already exists for today
    const existingAttendance = user.attendance.find(a => 
      a.date.toISOString() === dayDate.toISOString()
    );

    if (existingAttendance) {
      return res.status(400).json({ message: 'Already checked in today.' });
    }

    const { location } = req.body || {};
    const attendanceEntry = {
      date: dayDate,
      checkIn: now,
      checkInLocation: {
        lat: location?.lat,
        lng: location?.lng,
        address: location?.address
      }
    };

    user.attendance.push(attendanceEntry);
    await user.save();

    return res.status(201).json({
      message: 'Checked in successfully',
      attendance: attendanceEntry
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server Error' });
  }
});

// ROUTE: POST /api/employee/check-out
// DESC: Check out for the current day with optional location
router.post('/check-out', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const now = new Date();
    const { dayDate } = normalizeToDay(now);

    // Find today's attendance record
    const todayAttendance = user.attendance.find(a => 
      a.date.toISOString() === dayDate.toISOString()
    );

    if (!todayAttendance) {
      return res.status(400).json({ message: 'No check-in found for today.' });
    }

    if (todayAttendance.checkOut) {
      return res.status(400).json({ message: 'Already checked out for today.' });
    }

    const { location } = req.body || {};
    todayAttendance.checkOut = now;
    todayAttendance.checkOutLocation = {
      lat: location?.lat,
      lng: location?.lng,
      address: location?.address
    };

    await user.save();

    return res.status(200).json({
      message: 'Checked out successfully',
      attendance: todayAttendance
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server Error' });
  }
});

module.exports = router;
