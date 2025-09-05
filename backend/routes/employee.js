const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');
const Attendance = require('../models/Attendance'); // Add this import
const Notification = require('../models/Notification');

// Helper function to normalize a date to midnight UTC
function normalizeToDay(date = new Date()) {
  const dayString = date.toISOString().split('T')[0];
  const dayDate = new Date(dayString + 'T00:00:00.000Z');
  return { dayString, dayDate };
}

// Enhanced notification creation function
const createLeaveNotifications = async (employee, leaveData, io) => {
  try {
    console.log('🔧 DEBUG: Starting createLeaveNotifications');
    console.log('🔧 DEBUG: Employee data:', {
      id: employee._id,
      firstName: employee['First name'],
      lastName: employee['Last name'],
      manager: employee['Reporting manager']
    });

    const employeeName = `${employee['First name'] || 'Unknown'} ${employee['Last name'] || 'User'}`;
    const leaveDate = new Date(leaveData.date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    const duration = leaveData.duration === 1 ? 'Full Day' : 'Half Day';

    // 1. Notification to employee (confirmation)
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

    // 2. Notification to reporting manager
    if (employee['Reporting manager']) {
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

      if (manager) {
        const managerNotification = new Notification({
          title: '📋 New Leave Request - Action Required',
          message: `${employeeName} has submitted a leave request for ${leaveDate} (${duration}). Type: ${leaveData.type} leave. Reason: "${leaveData.reason}". Please review and approve/reject this request.`,
          recipient: manager._id,
          type: 'approval',
          priority: leaveData.duration > 3 ? 'high' : 'normal',
          createdBy: employee._id
        });
        
        await managerNotification.save();
        await managerNotification.populate('createdBy', 'First name Last name');

        if (io) {
          io.to(manager._id.toString()).emit('new_notification', managerNotification);
          console.log(`📧 Manager notification sent to: ${manager['First name']} ${manager['Last name']}`);
        }

        // 3. Urgent notification for short notice
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
          }
        }
      } else {
        // Send to admins if manager not found
        const admins = await User.find({ userType: 'admin' });
        
        for (const admin of admins) {
          const adminNotification = new Notification({
            title: '📋 New Leave Request (No Manager Found)',
            message: `${employeeName} has submitted a leave request for ${leaveDate} but the reporting manager "${employee['Reporting manager']}" was not found in the system.`,
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
    console.error('❌ Error in createLeaveNotifications:', error);
    return false;
  }
};

// ✅ SINGLE Apply Leave Route (Fixed)
router.post('/apply-leave', auth, async (req, res) => {
  console.log('🔧 DEBUG: Apply leave request started');
  
  try {
    const { leaveDate, leaveType, leaveDuration, leaveHalf, reason } = req.body;

    // Validation
    if (!leaveDate || !leaveType || !leaveDuration || !reason) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    if (leaveType !== 'paid' && leaveType !== 'unpaid') {
      return res.status(400).json({ message: 'Invalid leave type.' });
    }

    const duration = leaveDuration === 0.5 ? 0.5 : 1;

    if (duration === 0.5 && (!leaveHalf || (leaveHalf !== 'first' && leaveHalf !== 'second'))) {
      return res.status(400).json({ message: 'Invalid half-day specification.' });
    }

    // ✅ Fixed: Consistent user ID usage
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check for duplicate leave application
    const newLeaveDateString = new Date(leaveDate).toISOString().split('T')[0];
    const isLeaveAlreadyApplied = user.leaves.some(leave => {
      const existingDateString = leave.date.toISOString().split('T')[0];
      return existingDateString === newLeaveDateString;
    });

    if (isLeaveAlreadyApplied) {
      return res.status(400).json({ message: 'A leave has already been applied for this date.' });
    }

    // Check leave balance for paid leave
    if (leaveType === 'paid') {
      if (user.paidLeaveBalance < duration) {
        return res.status(400).json({ 
          message: `Insufficient paid leave balance. Available: ${user.paidLeaveBalance} days` 
        });
      }
    }

    // Create leave object
    const newLeave = {
      date: leaveDate,
      type: leaveType,
      duration: duration,
      half: duration === 0.5 ? leaveHalf : null,
      reason: reason,
      status: 'pending',
      appliedOn: new Date()
    };

    // Add leave to user's leaves array
    user.leaves.push(newLeave);
    await user.save();

    // Get the created leave (last one added)
    const createdLeave = user.leaves[user.leaves.length - 1];

    // Send notifications
    const io = req.app.get('socketio');
    const notificationResult = await createLeaveNotifications(user, createdLeave, io);

    res.status(201).json({
      success: true,
      message: 'Leave application submitted successfully! Notifications sent to you and your manager.',
      leave: createdLeave,
      debug: {
        socketIOAvailable: !!io,
        notificationsSent: notificationResult
      }
    });

  } catch (error) {
    console.error('❌ Error in apply-leave route:', error);
    res.status(500).json({ 
      message: 'Server error',
      error: error.message 
    });
  }
});

// ✅ NEW: Check-in route using new Attendance collection
router.post('/check-in', auth, async (req, res) => {
  try {
    const userId = req.user._id;
    const { location } = req.body || {};
    
    const today = new Date();
    const { dayDate } = normalizeToDay(today);

    // Check if already checked in today using new Attendance model
    const existingAttendance = await Attendance.findOne({
      employeeId: userId,
      date: dayDate
    });

    if (existingAttendance) {
      return res.status(400).json({ message: 'Already checked in today.' });
    }

    // Create new attendance record
    const attendance = new Attendance({
      employeeId: userId,
      date: dayDate,
      checkIn: new Date(),
      checkInLocation: {
        lat: location?.lat,
        lng: location?.lng,
        address: location?.address
      }
    });

    await attendance.save();

    return res.status(201).json({
      success: true,
      message: 'Checked in successfully',
      attendance: attendance
    });

  } catch (error) {
    console.error('Check-in error:', error);
    return res.status(500).json({ message: 'Server Error' });
  }
});

// ✅ NEW: Check-out route using new Attendance collection
router.post('/check-out', auth, async (req, res) => {
  try {
    const userId = req.user._id;
    const { location } = req.body || {};
    
    const today = new Date();
    const { dayDate } = normalizeToDay(today);

    // Find today's attendance record
    const todayAttendance = await Attendance.findOne({
      employeeId: userId,
      date: dayDate
    });

    if (!todayAttendance) {
      return res.status(400).json({ message: 'No check-in found for today.' });
    }

    if (todayAttendance.checkOut) {
      return res.status(400).json({ message: 'Already checked out for today.' });
    }

    // Update with checkout information
    todayAttendance.checkOut = new Date();
    todayAttendance.checkOutLocation = {
      lat: location?.lat,
      lng: location?.lng,
      address: location?.address
    };

    await todayAttendance.save();

    return res.status(200).json({
      success: true,
      message: 'Checked out successfully',
      attendance: todayAttendance
    });

  } catch (error) {
    console.error('Check-out error:', error);
    return res.status(500).json({ message: 'Server Error' });
  }
});

// ✅ NEW: Get attendance from new collection
router.get('/my-attendance', auth, async (req, res) => {
  try {
    const { month, year } = req.query;
    let query = { employeeId: req.user._id };

    // Filter by month/year if provided
    if (month && year) {
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0);
      query.date = { $gte: startDate, $lte: endDate };
    }

    const attendance = await Attendance.find(query)
      .sort({ date: -1 })
      .limit(100); // Limit to recent 100 records

    res.json({
      success: true,
      attendance: attendance
    });

  } catch (error) {
    console.error('Error fetching attendance:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// ✅ Fixed: Consistent user ID usage
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
      success: true,
      remainingPaidLeave: user.paidLeaveBalance,
      paidLeavesTaken: paidLeavesTaken,
      unpaidLeavesTaken: unpaidLeavesTaken,
    });
  } catch (error) {
    console.error('Error fetching leave balance:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// ✅ Fixed: Consistent user ID usage
router.get('/past-leaves', auth, async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const startIndex = (page - 1) * limit;

  try {
    const user = await User.findById(req.user._id);
    const leaves = user.leaves.slice().reverse();
    const paginatedLeaves = leaves.slice(startIndex, startIndex + limit);

    res.json({
      success: true,
      totalPages: Math.ceil(leaves.length / limit),
      currentPage: page,
      leaves: paginatedLeaves
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// ✅ Fixed: Consistent user ID usage
router.delete('/delete-leave/:leaveId', auth, async (req, res) => {
  const { leaveId } = req.params;
  
  try {
    const result = await User.findOneAndUpdate(
      { _id: req.user._id, 'leaves._id': leaveId },
      { $pull: { leaves: { _id: leaveId, status: 'pending' } } },
      { new: true }
    );
    
    if (!result) {
      return res.status(404).json({ message: 'Leave not found, or cannot be cancelled' });
    }
    
    return res.status(200).json({ 
      success: true,
      message: 'Leave cancelled successfully' 
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server Error' });
  }
});

module.exports = router;
