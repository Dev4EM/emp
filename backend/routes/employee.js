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

// Helper function to create notifications
const createLeaveNotifications = async (employee, leaveData, io) => {
  try {
    const employeeName = `${employee['First name']} ${employee['Last name']}`;
    const leaveDate = new Date(leaveData.date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    const duration = leaveData.duration === 1 ? 'Full Day' : 'Half Day';

    // 1. 📧 NOTIFICATION TO EMPLOYEE (Confirmation)
    const employeeNotification = new Notification({
      title: '✅ Leave Application Submitted',
      message: `Your leave request for ${leaveDate} (${duration}) has been successfully submitted. You'll receive a notification once your manager reviews your application.`,
      recipient: employee._id,
      type: 'reminder',
      priority: 'normal',
      createdBy: employee._id
    });
    await employeeNotification.save();
    await employeeNotification.populate('createdBy', 'First name Last name');

    // Emit to employee
    if (io) {
      io.to(employee._id.toString()).emit('new_notification', employeeNotification);
      console.log(`📧 Confirmation notification sent to employee: ${employeeName}`);
    }

    // 2. 👨‍💼 NOTIFICATION TO REPORTING MANAGER (Action Required)
    if (employee['Reporting manager']) {
      // Find the reporting manager by name
      const manager = await User.findOne({
        $expr: {
          $eq: [
            { $concat: ['$First name', ' ', '$Last name'] },
            employee['Reporting manager']
          ]
        }
      });

      if (manager) {
        const managerNotification = new Notification({
          title: '📋 New Leave Request - Action Required',
          message: `${employeeName} has submitted a leave request for ${leaveDate} (${duration}). Type: ${leaveData.type} leave. Reason: "${leaveData.reason}". Please review and approve/reject this request.`,
          recipient: manager._id,
          type: 'approval',
          priority: leaveData.duration > 3 ? 'high' : 'normal', // High priority for long leaves
          createdBy: employee._id
        });
        await managerNotification.save();
        await managerNotification.populate('createdBy', 'First name Last name');

        // Emit to manager
        if (io) {
          io.to(manager._id.toString()).emit('new_notification', managerNotification);
          console.log(`📧 Action required notification sent to manager: ${manager['First name']} ${manager['Last name']}`);
        }

        // 3. 🚨 URGENT NOTIFICATION FOR SHORT NOTICE (< 2 days)
        const daysDifference = Math.ceil((new Date(leaveData.date) - new Date()) / (1000 * 60 * 60 * 24));
        if (daysDifference <= 2) {
          const urgentNotification = new Notification({
            title: '🚨 URGENT: Short Notice Leave Request',
            message: `${employeeName} has requested leave for ${leaveDate} with only ${daysDifference} day(s) notice. This requires immediate attention for proper coverage planning.`,
            recipient: manager._id,
            type: 'announcement',
            priority: 'urgent',
            createdBy: employee._id
          });
          await urgentNotification.save();
          await urgentNotification.populate('createdBy', 'First name Last name');

          if (io) {
            io.to(manager._id.toString()).emit('new_notification', urgentNotification);
            console.log(`🚨 Urgent notification sent to manager for short notice leave`);
          }
        }
      } else {
        console.warn(`⚠️ Reporting manager "${employee['Reporting manager']}" not found for employee ${employeeName}`);
        
        // Send to all admins if manager not found
        const admins = await User.find({ userType: 'admin' });
        for (const admin of admins) {
          const adminNotification = new Notification({
            title: '📋 New Leave Request (No Manager Assigned)',
            message: `${employeeName} has submitted a leave request for ${leaveDate} but no reporting manager is assigned. Please review and assign appropriate approval authority.`,
            recipient: admin._id,
            type: 'system',
            priority: 'high',
            createdBy: employee._id
          });
          await adminNotification.save();
          await adminNotification.populate('createdBy', 'First name Last name');

          if (io) {
            io.to(admin._id.toString()).emit('new_notification', adminNotification);
          }
        }
      }
    }

    return true;
  } catch (error) {
    console.error('❌ Error creating leave notifications:', error);
    return false;
  }
};

// POST /api/employee/apply-leave - Updated with notifications
router.post('/apply-leave', auth, async (req, res) => {
  try {
    const { leaveDate, leaveType, leaveDuration, leaveHalf, reason } = req.body;

    // Validation
    if (!leaveDate || !leaveType || !leaveDuration || !reason) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check leave balance for paid leave
    if (leaveType === 'paid') {
      if (user.paidLeaveBalance < leaveDuration) {
        return res.status(400).json({ 
          message: `Insufficient paid leave balance. Available: ${user.paidLeaveBalance} days` 
        });
      }
    }

    // Create leave object
    const newLeave = {
      date: leaveDate,
      type: leaveType,
      duration: leaveDuration,
      half: leaveHalf,
      reason: reason,
      status: 'pending',
      appliedOn: new Date()
    };

    // Add leave to user's leaves array
    user.leaves.push(newLeave);
    await user.save();

    // Get the created leave (last one added)
    const createdLeave = user.leaves[user.leaves.length - 1];

    // 🔔 SEND NOTIFICATIONS TO EMPLOYEE AND MANAGER
    const io = req.app.get('socketio');
    await createLeaveNotifications(user, createdLeave, io);

    res.status(201).json({
      message: 'Leave application submitted successfully! Notifications sent to you and your manager.',
      leave: createdLeave
    });

  } catch (error) {
    console.error('Error applying for leave:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/employee/my-attendance
router.get('/my-attendance', auth, async (req, res) => {
  res.json(req.user.attendance);
});
// GET /api/employee/leave-balance - Get leave balance for current authenticated employee
router.get('/leave-balance', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
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
    console.error('Error fetching leave balance:', error);
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
