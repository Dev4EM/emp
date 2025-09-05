const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');
const Attendance = require('../models/Attendance'); // Add this import

// Middleware to check if user is an admin
const checkAdmin = (req, res, next) => {
  if (req.user.userType !== 'admin') {
    return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
  }
  next();
};

// ✅ Updated: Get attendance using new Attendance collection
router.get('/:id/attendance', auth, checkAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const { month, year } = req.query;
    let query = { employeeId: req.params.id };

    // Filter by month/year if provided
    if (month && year) {
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0);
      query.date = { $gte: startDate, $lte: endDate };
    }

    // Get attendance from new Attendance collection
    const attendanceRecords = await Attendance.find(query)
      .sort({ date: -1 })
      .populate('employeeId', 'First\ name Last\ name Employee\ Code');

    res.json({
      success: true,
      employee: {
        id: user._id,
        name: `${user['First name']} ${user['Last name']}`,
        employeeCode: user['Employee Code']
      },
      attendance: attendanceRecords
    });

  } catch (error) {
    console.error('Error fetching user attendance:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// ✅ Enhanced: Get leave balance with more details
router.get('/:id/leave-balance', auth, checkAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Calculate leave statistics
    const paidLeavesApproved = user.leaves
      .filter(leave => leave.type === 'paid' && leave.status === 'approved')
      .reduce((total, leave) => total + leave.duration, 0);

    const paidLeavesPending = user.leaves
      .filter(leave => leave.type === 'paid' && leave.status === 'pending')
      .reduce((total, leave) => total + leave.duration, 0);

    const unpaidLeavesApproved = user.leaves
      .filter(leave => leave.type === 'unpaid' && leave.status === 'approved')
      .reduce((total, leave) => total + leave.duration, 0);

    const unpaidLeavesPending = user.leaves
      .filter(leave => leave.type === 'unpaid' && leave.status === 'pending')
      .reduce((total, leave) => total + leave.duration, 0);

    const totalLeavesRejected = user.leaves
      .filter(leave => leave.status === 'rejected').length;

    res.json({
      success: true,
      employee: {
        id: user._id,
        name: `${user['First name']} ${user['Last name']}`,
        employeeCode: user['Employee Code'],
        department: user['Department'],
        designation: user['Designation']
      },
      leaveBalance: {
        remainingPaidLeave: user.paidLeaveBalance,
        totalPaidLeaveAllocation: 12, // Assuming 12 days annually
        paidLeavesUsed: paidLeavesApproved,
        paidLeavesPending: paidLeavesPending,
        unpaidLeavesUsed: unpaidLeavesApproved,
        unpaidLeavesPending: unpaidLeavesPending,
        totalLeavesRejected: totalLeavesRejected
      }
    });

  } catch (error) {
    console.error('Error fetching user leave balance:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// ✅ New: Get user leaves history
router.get('/:id/leaves', auth, checkAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const { status, type, page = 1, limit = 10 } = req.query;
    
    let leaves = [...user.leaves];

    // Filter by status if provided
    if (status) {
      leaves = leaves.filter(leave => leave.status === status);
    }

    // Filter by type if provided
    if (type) {
      leaves = leaves.filter(leave => leave.type === type);
    }

    // Sort by application date (newest first)
    leaves.sort((a, b) => new Date(b.appliedOn) - new Date(a.appliedOn));

    // Pagination
    const startIndex = (parseInt(page) - 1) * parseInt(limit);
    const endIndex = startIndex + parseInt(limit);
    const paginatedLeaves = leaves.slice(startIndex, endIndex);

    res.json({
      success: true,
      employee: {
        id: user._id,
        name: `${user['First name']} ${user['Last name']}`,
        employeeCode: user['Employee Code']
      },
      leaves: paginatedLeaves,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(leaves.length / parseInt(limit)),
        totalLeaves: leaves.length,
        limit: parseInt(limit)
      }
    });

  } catch (error) {
    console.error('Error fetching user leaves:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// ✅ New: Get user profile details
router.get('/:id/profile', auth, checkAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      success: true,
      user: user
    });

  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// ✅ New: Get user attendance summary
router.get('/:id/attendance-summary', auth, checkAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const { month, year } = req.query;
    const currentDate = new Date();
    const targetYear = year ? parseInt(year) : currentDate.getFullYear();
    const targetMonth = month ? parseInt(month) : currentDate.getMonth() + 1;

    const startDate = new Date(targetYear, targetMonth - 1, 1);
    const endDate = new Date(targetYear, targetMonth, 0);

    // Get attendance records for the specified period
    const attendanceRecords = await Attendance.find({
      employeeId: req.params.id,
      date: { $gte: startDate, $lte: endDate }
    }).sort({ date: 1 });

    // Calculate statistics
    const totalWorkingDays = attendanceRecords.length;
    const presentDays = attendanceRecords.filter(att => att.status === 'Present').length;
    const halfDays = attendanceRecords.filter(att => att.status === 'Half Day').length;
    const absentDays = attendanceRecords.filter(att => att.status === 'Absent').length;

    const totalHours = attendanceRecords.reduce((sum, att) => sum + (att.totalHours || 0), 0);
    const averageHours = totalWorkingDays > 0 ? (totalHours / totalWorkingDays).toFixed(2) : 0;

    // Get leave records for the same period
    const leavesInPeriod = user.leaves.filter(leave => {
      const leaveDate = new Date(leave.date);
      return leaveDate >= startDate && leaveDate <= endDate && leave.status === 'approved';
    });

    res.json({
      success: true,
      employee: {
        id: user._id,
        name: `${user['First name']} ${user['Last name']}`,
        employeeCode: user['Employee Code']
      },
      period: {
        month: targetMonth,
        year: targetYear,
        monthName: new Date(targetYear, targetMonth - 1).toLocaleDateString('en-US', { month: 'long' })
      },
      attendanceSummary: {
        totalWorkingDays,
        presentDays,
        halfDays,
        absentDays,
        totalHours: parseFloat(totalHours.toFixed(2)),
        averageHours: parseFloat(averageHours),
        attendancePercentage: totalWorkingDays > 0 ? 
          ((presentDays + halfDays * 0.5) / totalWorkingDays * 100).toFixed(1) : 0
      },
      leavesSummary: {
        totalLeaves: leavesInPeriod.length,
        paidLeaves: leavesInPeriod.filter(l => l.type === 'paid').length,
        unpaidLeaves: leavesInPeriod.filter(l => l.type === 'unpaid').length,
        totalLeaveDays: leavesInPeriod.reduce((sum, leave) => sum + leave.duration, 0)
      }
    });

  } catch (error) {
    console.error('Error fetching attendance summary:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

module.exports = router;
