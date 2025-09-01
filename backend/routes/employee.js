const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');
const Notification = require('../models/Notification');

// Helper function to normalize a date to midnight UTC for consistent day comparison
function normalizeToDay(date = new Date()) {
  const dayString = date.toISOString().split('T')[0]; // 'YYYY-MM-DD' in UTC
  const dayDate = new Date(dayString + 'T00:00:00.000Z'); // Z denotes UTC
  return { dayString, dayDate };
}


// Helper function with enhanced debugging
const createLeaveNotifications = async (employee, leaveData, io) => {
  try {
    console.log('🔧 DEBUG: Starting createLeaveNotifications');
    console.log('🔧 DEBUG: Employee data:', {
      id: employee._id,
      firstName: employee['First name'],
      lastName: employee['Last name'],
      manager: employee['Reporting manager']
    });
    console.log('🔧 DEBUG: Leave data:', leaveData);
    console.log('🔧 DEBUG: Socket.IO available:', !!io);

    const employeeName = `${employee['First name'] || 'Unknown'} ${employee['Last name'] || 'User'}`;
    const leaveDate = new Date(leaveData.date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    const duration = leaveData.duration === 1 ? 'Full Day' : 'Half Day';

    console.log('🔧 DEBUG: Processed data:', { employeeName, leaveDate, duration });

    // 1. 📧 NOTIFICATION TO EMPLOYEE (Confirmation)
    console.log('🔧 DEBUG: Creating employee notification...');
    
    const employeeNotification = new Notification({
      title: '✅ Leave Application Submitted',
      message: `Your leave request for ${leaveDate} (${duration}) has been successfully submitted. You'll receive a notification once your manager reviews your application.`,
      recipient: employee._id,
      type: 'reminder',
      priority: 'normal',
      createdBy: employee._id
    });
    
    await employeeNotification.save();
    console.log('✅ Employee notification saved to DB:', employeeNotification._id);
    
    await employeeNotification.populate('createdBy', 'First name Last name');

    // Emit to employee
    if (io) {
      console.log('🔧 DEBUG: Emitting to employee room:', employee._id.toString());
      io.to(employee._id.toString()).emit('new_notification', employeeNotification);
      console.log(`📧 Confirmation notification sent to employee: ${employeeName}`);
      
      // Also emit to all connected sockets (for testing)
      io.emit('test_notification', {
        title: '🧪 Test: Employee notification sent',
        message: `Notification sent to ${employeeName}`,
        recipient: employee._id.toString()
      });
    } else {
      console.error('❌ Socket.IO not available for employee notification');
    }

    // 2. 👨‍💼 NOTIFICATION TO REPORTING MANAGER (Action Required)
    // 2. 👨‍💼 NOTIFICATION TO REPORTING MANAGER (Action Required)
if (employee['Reporting manager']) {
  console.log('🔧 DEBUG: Looking for reporting manager:', employee['Reporting manager']);
  
  // ✅ IMPROVED: Case-insensitive and flexible name matching
  const managerName = employee['Reporting manager'].trim();
  
  const manager = await User.findOne({
    $expr: {
      $eq: [
        { 
          $toLower: { 
            $trim: { 
              input: { $concat: ['$First name', ' ', '$Last name'] }
            }
          }
        },
        managerName.toLowerCase()
      ]
    }
  });

  // Alternative: Also try variations of the name
  let alternativeManager = null;
  if (!manager) {
    // Try with different case variations
    alternativeManager = await User.findOne({
      $or: [
        {
          $expr: {
            $eq: [
              { $concat: ['$First name', ' ', '$Last name'] },
              managerName
            ]
          }
        },
        {
          $and: [
            { 'First name': { $regex: new RegExp(managerName.split(' ')[0], 'i') } },
            { 'Last name': { $regex: new RegExp(managerName.split(' ')[1] || '', 'i') } }
          ]
        }
      ]
    });
  }

  const foundManager = manager || alternativeManager;

  console.log('🔧 DEBUG: Manager search result:', foundManager ? {
    id: foundManager._id,
    name: `${foundManager['First name']} ${foundManager['Last name']}`,
    searchedFor: managerName
  } : 'NOT FOUND');

  if (foundManager) {
    console.log('🔧 DEBUG: Creating manager notification...');
    
    const managerNotification = new Notification({
      title: '📋 New Leave Request - Action Required',
      message: `${employeeName} has submitted a leave request for ${leaveDate} (${duration}). Type: ${leaveData.type} leave. Reason: "${leaveData.reason}". Please review and approve/reject this request.`,
      recipient: foundManager._id,
      type: 'approval',
      priority: leaveData.duration > 3 ? 'high' : 'normal',
      createdBy: employee._id
    });
    
    await managerNotification.save();
    console.log('✅ Manager notification saved to DB:', managerNotification._id);
    
    await managerNotification.populate('createdBy', 'First name Last name');

    // Emit to manager
    if (io) {
      console.log('🔧 DEBUG: Emitting to manager room:', foundManager._id.toString());
      io.to(foundManager._id.toString()).emit('new_notification', managerNotification);
      console.log(`📧 Action required notification sent to manager: ${foundManager['First name']} ${foundManager['Last name']}`);
      
      // Test notification to all (for debugging)
      io.emit('test_notification', {
        title: '🧪 Test: Manager notification sent',
        message: `Manager notification sent to ${foundManager['First name']} ${foundManager['Last name']}`,
        recipient: foundManager._id.toString()
      });
    }

    // 3. 🚨 URGENT NOTIFICATION FOR SHORT NOTICE (< 2 days)
    const daysDifference = Math.ceil((new Date(leaveData.date) - new Date()) / (1000 * 60 * 60 * 24));
    console.log('🔧 DEBUG: Days difference:', daysDifference);
    
    if (daysDifference <= 2) {
      console.log('🔧 DEBUG: Creating urgent notification...');
      
      const urgentNotification = new Notification({
        title: '🚨 URGENT: Short Notice Leave Request',
        message: `${employeeName} has requested leave for ${leaveDate} with only ${daysDifference} day(s) notice. This requires immediate attention for proper coverage planning.`,
        recipient: foundManager._id,
        type: 'announcement',
        priority: 'urgent',
        createdBy: employee._id
      });
      
      await urgentNotification.save();
      console.log('✅ Urgent notification saved to DB:', urgentNotification._id);
      
      await urgentNotification.populate('createdBy', 'First name Last name');

      if (io) {
        console.log('🔧 DEBUG: Emitting urgent notification to manager');
        io.to(foundManager._id.toString()).emit('new_notification', urgentNotification);
        console.log(`🚨 Urgent notification sent to manager for short notice leave`);
      }
    }
  } else {
    console.warn(`⚠️ Reporting manager "${employee['Reporting manager']}" not found for employee ${employeeName}`);
    console.log('🔧 DEBUG: Available managers in database:');
    
    // Debug: Show available managers
    const allManagers = await User.find({ 
      userType: { $in: ['admin', 'teamleader'] } 
    }).select('First name Last name userType');
    
    allManagers.forEach(mgr => {
      console.log(`   - ${mgr['First name']} ${mgr['Last name']} (${mgr.userType})`);
    });
    
    // Send to all admins if manager not found
    const admins = await User.find({ userType: 'admin' });
    console.log('🔧 DEBUG: Found admins:', admins.length);
    
    for (const admin of admins) {
      console.log('🔧 DEBUG: Creating admin notification for:', admin['First name'], admin['Last name']);
      
      const adminNotification = new Notification({
        title: '📋 New Leave Request (No Manager Found)',
        message: `${employeeName} has submitted a leave request for ${leaveDate} but the reporting manager "${employee['Reporting manager']}" was not found in the system. Please review and assign appropriate approval authority.`,
        recipient: admin._id,
        type: 'system',
        priority: 'high',
        createdBy: employee._id
      });
      
      await adminNotification.save();
      console.log('✅ Admin notification saved to DB:', adminNotification._id);
      
      await adminNotification.populate('createdBy', 'First name Last name');

      if (io) {
        console.log('🔧 DEBUG: Emitting to admin:', admin._id.toString());
        io.to(admin._id.toString()).emit('new_notification', adminNotification);
        console.log(`📧 Admin notification sent to: ${admin['First name']} ${admin['Last name']}`);
      }
    }
  }
} else {
  console.warn('⚠️ No reporting manager specified for employee');
}


    console.log('✅ createLeaveNotifications completed successfully');
    return true;
  } catch (error) {
    console.error('❌ Error in createLeaveNotifications:', error);
    console.error('❌ Stack trace:', error.stack);
    return false;
  }
};


// POST /api/employee/apply-leave - Enhanced with debugging
router.post('/apply-leave', auth, async (req, res) => {
  console.log('🔧 DEBUG: Apply leave request started');
  console.log('🔧 DEBUG: Request body:', req.body);
  console.log('🔧 DEBUG: User ID:', req.user._id);
  
  try {
    const { leaveDate, leaveType, leaveDuration, leaveHalf, reason } = req.body;

    // Validation
    if (!leaveDate || !leaveType || !leaveDuration || !reason) {
      console.error('❌ Validation failed - missing required fields');
      return res.status(400).json({ message: 'All fields are required' });
    }

    console.log('✅ Validation passed');

    const user = await User.findById(req.user._id);
    if (!user) {
      console.error('❌ User not found:', req.user._id);
      return res.status(404).json({ message: 'User not found' });
    }

    console.log('✅ User found:', {
      id: user._id,
      name: `${user['First name']} ${user['Last name']}`,
      manager: user['Reporting manager']
    });

    // Check leave balance for paid leave
    if (leaveType === 'paid') {
      if (user.paidLeaveBalance < leaveDuration) {
        console.error('❌ Insufficient leave balance');
        return res.status(400).json({ 
          message: `Insufficient paid leave balance. Available: ${user.paidLeaveBalance} days` 
        });
      }
    }

    console.log('✅ Leave balance check passed');

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

    console.log('🔧 DEBUG: New leave object:', newLeave);

    // Add leave to user's leaves array
    user.leaves.push(newLeave);
    await user.save();

    console.log('✅ Leave saved to user record');

    // Get the created leave (last one added)
    const createdLeave = user.leaves[user.leaves.length - 1];
    console.log('🔧 DEBUG: Created leave:', createdLeave);

    // 🔔 SEND NOTIFICATIONS TO EMPLOYEE AND MANAGER
    console.log('🔧 DEBUG: Getting Socket.IO instance...');
    const io = req.app.get('socketio');
    console.log('🔧 DEBUG: Socket.IO instance available:', !!io);
    
    if (io) {
      console.log('🔧 DEBUG: Socket.IO rooms:', Object.keys(io.sockets.adapter.rooms));
      console.log('🔧 DEBUG: Connected sockets count:', io.engine.clientsCount);
    }

    console.log('🔧 DEBUG: Calling createLeaveNotifications...');
    const notificationResult = await createLeaveNotifications(user, createdLeave, io);
    console.log('🔧 DEBUG: Notification result:', notificationResult);

    if (notificationResult) {
      console.log('✅ Notifications sent successfully');
    } else {
      console.error('❌ Failed to send notifications');
    }

    res.status(201).json({
      success: true,
      message: 'Leave application submitted successfully! Notifications sent to you and your manager.',
      leave: createdLeave,
      debug: {
        socketIOAvailable: !!io,
        notificationsSent: notificationResult
      }
    });

    console.log('✅ Apply leave request completed successfully');

  } catch (error) {
    console.error('❌ Error in apply-leave route:', error);
    console.error('❌ Stack trace:', error.stack);
    res.status(500).json({ 
      message: 'Server error',
      error: error.message 
    });
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
