const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');

// Middleware to check if user is a team leader
const checkTeamLeader = async (req, res, next) => {
  if (req.user.userType !== 'teamleader') {
    return res.status(403).json({ message: 'Access denied. Team leader privileges required.' });
  }
  next();
};

// ROUTE: GET /api/teamleader/team-members
// DESC: Get all team members under the logged-in team leader
router.get('/team-members', auth, checkTeamLeader, async (req, res) => {
  try {
    const teamMembers = await User.find({ 
      reportingManager: req.user.id 
    }).select('-password'); // Exclude password from response

    res.json(teamMembers);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// ROUTE: GET /api/teamleader/pending-leaves
// DESC: Get all pending leave requests from team members
router.get('/pending-leaves', auth, checkTeamLeader, async (req, res) => {
  try {
    const teamMembers = await User.find({ 
      reportingManager: req.user.id 
    }).populate('leaves');

    const pendingLeaves = [];
    
    teamMembers.forEach(member => {
      member.leaves.forEach(leave => {
        if (leave.status === 'pending') {
          pendingLeaves.push({
            leaveId: leave._id,
            employeeId: member._id,
            employeeName: member.name,
            employeeEmail: member.email,
            date: leave.date,
            type: leave.type,
            duration: leave.duration,
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

// ROUTE: PUT /api/teamleader/approve-leave
// DESC: Approve a leave request
router.put('/approve-leave', auth, checkTeamLeader, async (req, res) => {
  const { employeeId, leaveId } = req.body;

  if (!employeeId || !leaveId) {
    return res.status(400).json({ message: 'Employee ID and Leave ID are required' });
  }

  try {
    const employee = await User.findOne({ 
      _id: employeeId, 
      reportingManager: req.user.id 
    });

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

    // Check if employee has sufficient paid leave balance (for paid leaves only)
    if (leave.type === 'paid') {
      if (employee.paidLeaveBalance < leave.duration) {
        return res.status(400).json({ 
          message: `Cannot approve. Employee has insufficient paid leave balance. Available: ${employee.paidLeaveBalance} days` 
        });
      }
      // Deduct from balance upon approval
      employee.paidLeaveBalance -= leave.duration;
    }

    // Update leave status
    leave.status = 'approved';
    leave.approvedBy = req.user.id;
    leave.approvedOn = new Date();

    await employee.save();

    res.json({ 
      message: 'Leave request approved successfully',
      leave: {
        leaveId: leave._id,
        employeeName: employee.name,
        status: leave.status,
        approvedOn: leave.approvedOn
      }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// ROUTE: PUT /api/teamleader/reject-leave
// DESC: Reject a leave request
router.put('/reject-leave', auth, checkTeamLeader, async (req, res) => {
  const { employeeId, leaveId, rejectionReason } = req.body;

  if (!employeeId || !leaveId) {
    return res.status(400).json({ message: 'Employee ID and Leave ID are required' });
  }

  try {
    const employee = await User.findOne({ 
      _id: employeeId, 
      reportingManager: req.user.id 
    });

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

    // Update leave status
    leave.status = 'rejected';
    leave.approvedBy = req.user.id;
    leave.approvedOn = new Date();
    if (rejectionReason) {
      leave.rejectionReason = rejectionReason; // You may want to add this field to schema
    }

    await employee.save();

    res.json({ 
      message: 'Leave request rejected successfully',
      leave: {
        leaveId: leave._id,
        employeeName: employee.name,
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
