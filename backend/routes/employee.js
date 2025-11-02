// routes/employee.js
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');
const Attendance = require('../models/Attendance');
const Leave = require('../models/Leave');
const Notification = require('../models/Notification');

// Helper to normalize date to start of day (UTC)
function normalizeToDay(date = new Date()) {
  const dayString = date.toISOString().split('T')[0];
  const dayDate = new Date(dayString + 'T00:00:00.000Z');
  return { dayString, dayDate };
}

// Helper to format attendance record with checkIn/checkOut showing updated if exists else actual
function formatAttendance(record) {
  return {
    _id: record._id,
    date: record.date,
    checkIn: record.updatedCheckIn || record.checkIn,
    checkOut: record.updatedCheckOut || record.checkOut,
    remarks: record.remarks,
    status: record.status,
    checkInLocation: record.checkInLocation,
    checkOutLocation: record.checkOutLocation,
    updatedCheckIn: record.updatedCheckIn,
    updatedCheckOut: record.updatedCheckOut,
    updatedCheckInAt: record.updatedCheckInAt,
    updatedCheckInBy: record.updatedCheckInBy,
    updatedCheckOutAt: record.updatedCheckOutAt,
    updatedCheckOutBy: record.updatedCheckOutBy,
  };
}

// ====== Leave Routes ======

// POST /api/employee/leave/apply
router.post('/leave/apply', auth, async (req, res) => {
  try {
    const { date: leaveDate, type: leaveType, duration: leaveDuration, half: leaveHalf, reason } = req.body;
    if (!leaveDate || !leaveType || !leaveDuration || !reason) {
      return res.status(400).json({ message: 'Required fields: date, type, duration, reason' });
    }
    if (!['paid','unpaid'].includes(leaveType)) {
      return res.status(400).json({ message: 'Invalid leave type' });
    }
    if (![1, 0.5].includes(leaveDuration)) {
      return res.status(400).json({ message: 'Invalid duration' });
    }
    if (leaveDuration === 0.5 && (leaveHalf !== 'first' && leaveHalf !== 'second')) {
      return res.status(400).json({ message: 'For half-day, half must be "first" or "second"' });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (leaveType === 'paid' && user.paidLeaveBalance < leaveDuration) {
      return res.status(400).json({ message: `Insufficient paid leave balance. Available: ${user.paidLeaveBalance}` });
    }

    const day = new Date(leaveDate);
    // ensure only one leave per user per day (using your Leave model's unique index)
    const existing = await Leave.findOne({ employeeId: user._id, date: { $eq: new Date(day.toISOString().split('T')[0] + 'T00:00:00.000Z') } });
    if (existing) {
      return res.status(400).json({ message: 'Leave already applied for this date' });
    }

    const leave = new Leave({
      employeeId: user._id,
      date: day,
      type: leaveType,
      duration: leaveDuration,
      half: leaveDuration === 0.5 ? leaveHalf : null,
      reason,
      status: 'pending'
    });

    await leave.save();

    const io = req.app.get('socketio');
    // Assuming you have this function defined somewhere for notifications
    if (typeof createLeaveNotifications === 'function') {
      await createLeaveNotifications(user, leave, io);
    }

    return res.status(201).json({ success: true, message: 'Leave applied successfully', leave });

  } catch (err) {
    console.error('Error in /leave/apply:', err);
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /api/employee/leave/balance
router.get('/leave/balance', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    if (!user.isLeaveApplicable) {
      return res.status(400).json({ message: 'Leave not applicable for this user' });
    }

    // Calculate paid and unpaid leave taken (optional, for display)
    const approvedPaidLeaves = await Leave.aggregate([
      { $match: { employeeId: user._id, type: 'paid', status: 'approved' } },
      { $group: { _id: null, total: { $sum: '$duration' } } }
    ]);
    const approvedUnpaidLeaves = await Leave.aggregate([
      { $match: { employeeId: user._id, type: 'unpaid', status: 'approved' } },
      { $group: { _id: null, total: { $sum: '$duration' } } }
    ]);

    const paidTaken = approvedPaidLeaves.length > 0 ? approvedPaidLeaves[0].total : 0;
    const unpaidTaken = approvedUnpaidLeaves.length > 0 ? approvedUnpaidLeaves[0].total : 0;

    // Optional: Current month entry
    const currentMonth = new Date().toISOString().slice(0, 7); // e.g., "2025-09"
    const currentMonthEntry = user.leaveHistory?.find(entry => entry.month === currentMonth);

    return res.json({
      success: true,
      isLeaveApplicable: user.isLeaveApplicable,
      totalLeaveBalance: user.totalLeaveBalance,
      monthlyLeaveAccrual: user.monthlyLeaveAccrual || 1.5,
      carryForwardLeaves: user.carryForwardLeaves || 0,
      paidLeavesTaken: paidTaken,
      unpaidLeavesTaken: unpaidTaken,
      currentMonth: currentMonth,
      currentMonthLeave: currentMonthEntry || null,
      leaveHistory: user.leaveHistory || []
    });

  } catch (err) {
    console.error('Error in /leave/balance:', err);
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /api/employee/leave/history?page&limit
router.get('/leave/history', auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const total = await Leave.countDocuments({ employeeId: req.user._id });
    const leaves = await Leave.find({ employeeId: req.user._id })
      .populate('employeeId', ['First name', 'Last name']) // adjust field names if necessary
      .sort({ date: -1 })
      .skip(skip)
      .limit(limit);

    return res.json({
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      leaves
    });

  } catch (err) {
    console.error('Error in /leave/history:', err);
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// DELETE /api/employee/leave/:leaveId
router.delete('/leave/:leaveId', auth, async (req, res) => {
  try {
    const { leaveId } = req.params;
    const leave = await Leave.findOne({ _id: leaveId, employeeId: req.user._id });
    if (!leave) {
      return res.status(404).json({ message: 'Leave not found' });
    }
    if (leave.status !== 'pending') {
      return res.status(400).json({ message: 'Only pending leaves can be deleted/cancelled' });
    }
    await Leave.deleteOne({ _id: leaveId });
    return res.json({ success: true, message: 'Leave cancelled successfully' });
  } catch (err) {
    console.error('Error in DELETE /leave/:leaveId:', err);
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ===== Attendance Routes =====

// POST /api/employee/attendance/check-in
router.post('/attendance/check-in', auth, async (req, res) => {
  try {
    const userId = req.user._id;
    const now = new Date();
    const { dayDate } = normalizeToDay(now);

    const existing = await Attendance.findOne({ employeeId: userId, date: dayDate });
    if (existing) {
      return res.status(400).json({ message: 'Already checked in today' });
    }

    const { location } = req.body;
    const attendance = new Attendance({
      employeeId: userId,
      date: dayDate,
      checkIn: now,
      checkInLocation: {
        lat: location?.lat,
        lng: location?.lng,
        address: location?.address
      },
      status: 'P|P'
    });

    await attendance.save();

    return res.status(201).json({ success: true, message: 'Checked in', attendance: formatAttendance(attendance) });

  } catch (err) {
    console.error('Error in /attendance/check-in:', err);
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// PUT /api/employee/attendance/:attendanceId
router.put('/attendance/:attendanceId', auth, async (req, res) => {
  try {
    const { attendanceId } = req.params;
    const { updatedCheckIn, updatedCheckOut, reason } = req.body;
    const userId = req.user._id;

    // Find attendance record by ID
    const attendance = await Attendance.findOne({ _id: attendanceId, employeeId: userId });
    if (!attendance) {
      return res.status(404).json({ message: 'Attendance record not found' });
    }

    const updateFields = {};

    if (updatedCheckIn) {
      updateFields.updatedCheckIn = new Date(updatedCheckIn);
      updateFields.updatedCheckInAt = new Date();
      updateFields.updatedCheckInBy = userId;
    }

    if (updatedCheckOut) {
      updateFields.updatedCheckOut = new Date(updatedCheckOut);
      updateFields.updatedCheckOutAt = new Date();
      updateFields.updatedCheckOutBy = userId;
    }

    if (reason) {
      updateFields.remarks = reason;
    }

    const updatedAttendance = await Attendance.findByIdAndUpdate(
      attendanceId,
      { $set: updateFields },
      { new: true }
    );

    return res.json({ success: true, message: 'Attendance updated successfully', attendance: formatAttendance(updatedAttendance) });

  } catch (err) {
    console.error('Error in PUT /attendance/:attendanceId:', err);
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// POST /api/employee/attendance/check-out
router.post('/attendance/check-out', auth, async (req, res) => {
  try {
    const userId = req.user._id;
    const now = new Date();
    const { dayDate } = normalizeToDay(now);

    const attendance = await Attendance.findOne({ employeeId: userId, date: dayDate });
    if (!attendance) {
      return res.status(400).json({ message: 'No check-in record for today' });
    }
    if (attendance.checkOut) {
      return res.status(400).json({ message: 'Already checked out today' });
    }

    const { location } = req.body;
    attendance.checkOut = now;
    attendance.checkOutLocation = {
      lat: location?.lat,
      lng: location?.lng,
      address: location?.address
    };
    await attendance.save();

    return res.json({ success: true, message: 'Checked out', attendance: formatAttendance(attendance) });

  } catch (err) {
    console.error('Error in /attendance/check-out:', err);
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /api/employee/attendance/history?start=YYYY-MM-DD&end=YYYY-MM-DD
router.get('/attendance/history', auth, async (req, res) => {
  try {
    const userId = req.user._id;
    const { start, end } = req.query;

    let filter = { employeeId: userId };
    if (start) {
      const startDate = new Date(start + 'T00:00:00.000Z');
      filter.date = { ...filter.date, $gte: startDate };
    }
    if (end) {
      const endDate = new Date(end + 'T00:00:00.000Z');
      filter.date = { ...filter.date, $lte: endDate };
    }

    const attendanceRecords = await Attendance.find(filter).sort({ date: -1 });

    return res.json({ success: true, attendance: attendanceRecords.map(formatAttendance) });

  } catch (err) {
    console.error('Error in /attendance/history:', err);
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
});
// POST /api/employee/leave/past
router.post('/leave/past', auth, async (req, res) => {
  try {
    const { date: leaveDate, type: leaveType, duration: leaveDuration, half: leaveHalf, reason } = req.body;

    // Validate mandatory fields
    if (!leaveDate || !leaveType || !leaveDuration || !reason) {
      return res.status(400).json({ message: 'Required fields: date, type, duration, reason' });
    }
    if (!['paid','unpaid'].includes(leaveType)) {
      return res.status(400).json({ message: 'Invalid leave type' });
    }
    if (![1, 0.5].includes(leaveDuration)) {
      return res.status(400).json({ message: 'Invalid duration' });
    }
    if (leaveDuration === 0.5 && (leaveHalf !== 'first' && leaveHalf !== 'second')) {
      return res.status(400).json({ message: 'For half-day, half must be "first" or "second"' });
    }

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const day = new Date(leaveDate);
    const normalizedDate = new Date(day.toISOString().split('T')[0] + 'T00:00:00.000Z');

    const existing = await Leave.findOne({ employeeId: user._id, date: normalizedDate });
    if (existing) {
      return res.status(400).json({ message: 'Leave already exists for this date' });
    }

    let finalLeaveType = leaveType;

    // Switch to unpaid if insufficient paid leave balance
    if (leaveType === 'paid' && user.paidLeaveBalance < leaveDuration) {
      finalLeaveType = 'unpaid';
    }

    const leave = new Leave({
      employeeId: user._id,
      date: normalizedDate,
      type: finalLeaveType,
      duration: leaveDuration,
      half: leaveDuration === 0.5 ? leaveHalf : null,
      reason,
      status: 'approved' // automatically approved for past leave
    });

    await leave.save();

    // Deduct paid leave balance if applicable
    if (finalLeaveType === 'paid') {
      user.paidLeaveBalance -= leaveDuration;
      await user.save();
    }

    return res.status(201).json({ 
      success: true, 
      message: `Past leave recorded successfully (${finalLeaveType})`, 
      leave 
    });

  } catch (err) {
    console.error('Error in /leave/past:', err);
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
});


module.exports = router;
