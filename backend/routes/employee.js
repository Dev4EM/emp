const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');

// Helper function to normalize date to midnight IST for consistent day comparison
function normalizeToDay(date = new Date()) {
  const istOffset = 5.5 * 60 * 60 * 1000; // IST is UTC + 5:30 in milliseconds
  const istDate = new Date(date.getTime() + istOffset);
  const dayString = istDate.toISOString().split('T')[0]; // 'YYYY-MM-DD'
  const dayDate = new Date(dayString + 'T00:00:00.000+05:30');
  return { dayString, dayDate };
}

// GET /api/employee/my-attendance
router.get('/my-attendance', auth, async (req, res) => {
  res.json(req.user.attendance);
});

// GET /api/employee/leave-balance
router.get('/leave-balance', auth, async (req, res) => {
  try {
    const paidLeavesTaken = req.user.leaves
      .filter(leave => leave.type === 'paid' && leave.status === 'approved')
      .reduce((total, leave) => total + leave.duration, 0);

    const unpaidLeavesTaken = req.user.leaves
      .filter(leave => leave.type === 'unpaid' && leave.status === 'approved')
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

// POST /api/employee/apply-leave
router.post('/apply-leave', auth, async (req, res) => {
  const { leaveDate, leaveType, leaveDuration, leaveHalf, reason } = req.body;
  const duration = leaveDuration === 0.5 ? 0.5 : 1;

  if (!leaveDate || !leaveType || !reason) {
    return res.status(400).json({ message: 'Leave date, type, and reason are required' });
  }
  if (leaveType !== 'paid' && leaveType !== 'unpaid') {
    return res.status(400).json({ message: 'Invalid leave type.' });
  }
  if (duration === 0.5 && (!leaveHalf || (leaveHalf !== 'first' && leaveHalf !== 'second'))) {
    return res.status(400).json({ message: 'Invalid half-day specification.' });
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

    user.leaves.push({ 
      date: leaveDate, 
      type: leaveType, 
      duration: duration,
      half: duration === 0.5 ? leaveHalf : null,
      reason: reason,
      status: 'pending'
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

// GET /api/employee/past-leaves
router.get('/past-leaves', auth, async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const startIndex = (page - 1) * limit;

    try {
        const user = await User.findById(req.user.id);
        const leaves = user.leaves.slice().reverse(); // Get all leaves and reverse to show latest first
        const paginatedLeaves = leaves.slice(startIndex, startIndex + limit);

        res.json({
            totalPages: Math.ceil(leaves.length / limit),
            currentPage: page,
            leaves: paginatedLeaves
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
});

// POST /api/employee/check-in
router.post('/check-in', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const now = new Date();
    const { dayDate } = normalizeToDay(now);

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

// POST /api/employee/check-out
router.post('/check-out', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const now = new Date();
    const { dayDate } = normalizeToDay(now);

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
// DELETE /api/employee/delete-leave/:leaveId
router.delete('/delete-leave/:leaveId', auth, async (req, res) => {
  const { leaveId } = req.params;
   try {
    // Only pending/cancellable leaves should be deletable
    const result = await User.findOneAndUpdate(
      { _id: req.user.id, 'leaves._id': leaveId },
      { $pull: { leaves: { _id: leaveId, status: 'pending' } } }, // Only delete if pending
      { new: true }
    );
    if (!result) {
      return res.status(404).json({ message: 'Leave not found, or cannot be cancelled' });
    }
    return res.status(200).json({ message: 'Leave cancelled successfully' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server Error' });
  }
});

module.exports = router;
