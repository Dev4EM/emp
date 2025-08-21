const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');

// Middleware to check if user is a team leader or admin
const checkTeamLeader = (req, res, next) => {
  if (req.user.userType !== 'teamleader' && req.user.userType !== 'admin') {
    return res.status(403).json({ message: 'Access denied. Team leader or admin privileges required.' });
  }
  next();
};

// GET /api/teamleader/team-members
router.get('/team-members', auth, checkTeamLeader, async (req, res) => {
  try {
    const teamMembers = await User.find({ reportingManager: req.user.id }).select('-password');
    res.json(teamMembers);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// GET /api/teamleader/pending-leaves
router.get('/pending-leaves', auth, checkTeamLeader, async (req, res) => {
  try {
    const teamMembers = await User.find({ reportingManager: req.user.id });
    const pendingLeaves = [];
    teamMembers.forEach(member => {
      member.leaves.forEach(leave => {
        if (leave.status === 'pending') {
          pendingLeaves.push({
            leaveId: leave._id,
            employeeId: member._id,
            employeeName: `${member.firstName} ${member.lastName}`,
            employeeEmail: member.workEmail,
            date: leave.date,
            type: leave.type,
            duration: leave.duration,
            reason: leave.reason,
            appliedOn: leave.appliedOn,
            status: leave.status
          });
        }
      });
    });
    res.json(pendingLeaves);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// PUT /api/teamleader/approve-leave
router.put('/approve-leave', auth, checkTeamLeader, async (req, res) => {
  const { employeeId, leaveId } = req.body;

  if (!employeeId || !leaveId) {
    return res.status(400).json({ message: 'Employee ID and Leave ID are required' });
  }

  try {
    const employee = await User.findOne({ _id: employeeId, reportingManager: req.user.id });

    if (!employee) {
      return res.status(404).json({ message: 'Employee not found or not under your management' });
    }

    const leave = employee.leaves.id(leaveId);
    if (!leave) {
      return res.status(404).json({ message: 'Leave request not found' });
    }

    if (leave.status !== 'pending') {
      return res.status(400).json({ message: 'Leave request is not pending' });
    }

    if (leave.type === 'paid') {
      if (employee.paidLeaveBalance < leave.duration) {
        return res.status(400).json({ 
          message: `Cannot approve. Employee has insufficient paid leave balance. Available: ${employee.paidLeaveBalance} days` 
        });
      }
      employee.paidLeaveBalance -= leave.duration;
    }

    leave.status = 'approved';
    leave.approvedBy = req.user.id;
    leave.approvedOn = new Date();

    await employee.save();

    res.json({ 
      message: 'Leave request approved successfully',
      leave: {
        leaveId: leave._id,
        employeeName: `${employee.firstName} ${employee.lastName}`,
        status: leave.status,
        approvedOn: leave.approvedOn
      }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// PUT /api/teamleader/reject-leave
router.put('/reject-leave', auth, checkTeamLeader, async (req, res) => {
  const { employeeId, leaveId, rejectionReason } = req.body;

  if (!employeeId || !leaveId) {
    return res.status(400).json({ message: 'Employee ID and Leave ID are required' });
  }

  try {
    const employee = await User.findOne({ _id: employeeId, reportingManager: req.user.id });

    if (!employee) {
      return res.status(404).json({ message: 'Employee not found or not under your management' });
    }

    const leave = employee.leaves.id(leaveId);
    if (!leave) {
      return res.status(404).json({ message: 'Leave request not found' });
    }

    if (leave.status !== 'pending') {
      return res.status(400).json({ message: 'Leave request is not pending' });
    }

    leave.status = 'rejected';
    leave.approvedBy = req.user.id;
    leave.approvedOn = new Date();
    if (rejectionReason) {
      leave.rejectionReason = rejectionReason;
    }

    await employee.save();

    res.json({ 
      message: 'Leave request rejected successfully',
      leave: {
        leaveId: leave._id,
        employeeName: `${employee.firstName} ${employee.lastName}`,
        status: leave.status,
        rejectedOn: leave.approvedOn
      }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
});

module.exports = router;
