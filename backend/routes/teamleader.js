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
// In routes/teamleader.js

const createLeaveDecisionNotifications = async (employee, leave, decision, managerName, rejectionReason = '', io) => {
  try {
    const employeeName = `${employee['First name']} ${employee['Last name']}`;
    const leaveDate = new Date(leave.date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric', 
      month: 'long',
      day: 'numeric'
    });
    const duration = leave.duration === 1 ? 'Full Day' : 'Half Day';

    let notificationData = {
      recipient: employee._id,
      createdBy: employee._id, // Manager's ID would be better if available
      type: decision === 'approved' ? 'approval' : 'update',
      priority: decision === 'approved' ? 'normal' : 'high'
    };

    if (decision === 'approved') {
      notificationData = {
        ...notificationData,
        title: '✅ Leave Request Approved!',
        message: `Great news! Your ${leave.type} leave request for ${leaveDate} (${duration}) has been approved by ${managerName}. Your leave balance has been updated. Enjoy your time off!`
      };
    } else if (decision === 'rejected') {
      notificationData = {
        ...notificationData,
        title: '❌ Leave Request Rejected',
        message: `Your ${leave.type} leave request for ${leaveDate} (${duration}) has been rejected by ${managerName}.${rejectionReason ? ` Reason: ${rejectionReason}` : ''} Please contact your manager for more information.`
      };
    }

    const notification = new Notification(notificationData);
    await notification.save();
    await notification.populate('createdBy', 'First name Last name');

    // Emit to employee
    if (io) {
      io.to(employee._id.toString()).emit('new_notification', notification);
      console.log(`📧 Leave ${decision} notification sent to ${employeeName}`);
    }

    return true;
  } catch (error) {
    console.error(`❌ Error creating leave ${decision} notification:`, error);
    return false;
  }
};

// PUT /api/teamleader/approve-leave - Updated with notifications
router.put('/approve-leave', auth, checkTeamLeader, async (req, res) => {
  const { employeeId, leaveId } = req.body;

  if (!employeeId || !leaveId) {
    return res.status(400).json({ message: 'Employee ID and Leave ID are required' });
  }

  try {
    const currentUser = await User.findById(req.user.id);
    const managerName = `${currentUser["First name"]} ${currentUser["Last name"]}`.trim();
    
    const employee = await User.findOne({ 
      _id: employeeId, 
      "Reporting manager": { 
        $regex: new RegExp(`^${managerName}$`, 'i') 
      } 
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

    // Check and update leave balance
    if (leave.type === 'paid') {
      if (employee.paidLeaveBalance < leave.duration) {
        return res.status(400).json({ 
          message: `Cannot approve. Employee has insufficient paid leave balance. Available: ${employee.paidLeaveBalance} days` 
        });
      }
      employee.paidLeaveBalance -= leave.duration;
    }

    // Update leave status
    leave.status = 'approved';
    leave.approvedBy = req.user.id;
    leave.approvedOn = new Date();

    await employee.save();

    // 🔔 SEND NOTIFICATION TO EMPLOYEE
    const io = req.app.get('socketio');
    await createLeaveDecisionNotifications(employee, leave, 'approved', managerName, '', io);

    res.json({ 
      message: 'Leave request approved successfully and employee has been notified',
      leave: {
        leaveId: leave._id,
        employeeName: `${employee["First name"]} ${employee["Last name"]}`,
        employeeCode: employee["Employee Code"],
        status: leave.status,
        approvedOn: leave.approvedOn,
        type: leave.type,
        duration: leave.duration,
        date: leave.date
      }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// PUT /api/teamleader/reject-leave - Updated with notifications
router.put('/reject-leave', auth, checkTeamLeader, async (req, res) => {
  const { employeeId, leaveId, rejectionReason } = req.body;

  if (!employeeId || !leaveId) {
    return res.status(400).json({ message: 'Employee ID and Leave ID are required' });
  }

  try {
    const currentUser = await User.findById(req.user.id);
    const managerName = `${currentUser["First name"]} ${currentUser["Last name"]}`.trim();
    
    const employee = await User.findOne({ 
      _id: employeeId, 
      "Reporting manager": { 
        $regex: new RegExp(`^${managerName}$`, 'i') 
      } 
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
      leave.rejectionReason = rejectionReason;
    }

    await employee.save();

    // 🔔 SEND NOTIFICATION TO EMPLOYEE
    const io = req.app.get('socketio');
    await createLeaveDecisionNotifications(employee, leave, 'rejected', managerName, rejectionReason, io);

    res.json({ 
      message: 'Leave request rejected successfully and employee has been notified',
      leave: {
        leaveId: leave._id,
        employeeName: `${employee["First name"]} ${employee["Last name"]}`,
        employeeCode: employee["Employee Code"],
        status: leave.status,
        rejectedOn: leave.approvedOn,
        rejectionReason: rejectionReason,
        type: leave.type,
        duration: leave.duration,
        date: leave.date
      }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// POST /api/teamleader/add-employee
router.post('/add-employee', auth, checkTeamLeader, async (req, res) => {
    const { "Work email": workEmail } = req.body;
    try {
        let user = await User.findOne({ "Work email": workEmail });
        if (user) {
            return res.status(400).json({ message: 'User with this email already exists' });
        }

        const newEmployee = new User(req.body);
        await newEmployee.save();

        res.status(201).json({ message: 'Employee added successfully', user: newEmployee });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
});

// GET /api/teamleader/team-members - Updated to find by reporting manager name
router.get('/team-members', auth, checkTeamLeader, async (req, res) => {
  try {
    // Get the current user's full name to match against reporting manager field
    const currentUser = await User.findById(req.user.id);
    const managerName = `${currentUser["First name"]} ${currentUser["Last name"]}`.trim();
    
    // Find all users whose "Reporting manager" field matches the current user's name (case-insensitive)
    const teamMembers = await User.find({ 
      "Reporting manager": { 
        $regex: new RegExp(`^${managerName}$`, 'i') 
      } 
    }).select('-password');
    
    res.json(teamMembers);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// GET /api/teamleader/pending-leaves - Updated to work with reporting manager names
router.get('/pending-leaves', auth, checkTeamLeader, async (req, res) => {
  try {
    // Get the current user's full name
    const currentUser = await User.findById(req.user.id);
    const managerName = `${currentUser["First name"]} ${currentUser["Last name"]}`.trim();
    
    // Find team members by reporting manager name
    const teamMembers = await User.find({ 
      "Reporting manager": { 
        $regex: new RegExp(`^${managerName}$`, 'i') 
      } 
    });
    
    const pendingLeaves = [];
    teamMembers.forEach(member => {
      member.leaves.forEach(leave => {
        if (leave.status === 'pending') {
          pendingLeaves.push({
            leaveId: leave._id,
            employeeId: member._id,
            employeeName: `${member["First name"]} ${member["Last name"]}`,
            employeeEmail: member["Work email"],
            employeeCode: member["Employee Code"],
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
    
    // Sort by applied date (newest first)
    pendingLeaves.sort((a, b) => new Date(b.appliedOn) - new Date(a.appliedOn));
    
    res.json(pendingLeaves);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
});

 

// GET /api/teamleader/team-attendance - New endpoint to get team attendance
router.get('/team-attendance', auth, checkTeamLeader, async (req, res) => {
  try {
    const currentUser = await User.findById(req.user.id);
    const managerName = `${currentUser["First name"]} ${currentUser["Last name"]}`.trim();
    
    const teamMembers = await User.find({ 
      "Reporting manager": { 
        $regex: new RegExp(`^${managerName}$`, 'i') 
      } 
    }).select('["First name"] ["Last name"] ["Employee Code"] attendance');
    
    res.json(teamMembers);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// GET /api/teamleader/department-leaves
// DESC: Get all leaves from the team leader's department
router.get('/department-leaves', auth, checkTeamLeader, async (req, res) => {
  try {
    const currentUser = await User.findById(req.user.id);
    const department = currentUser.Department;

    if (!department) {
      return res.status(400).json({ message: 'You are not assigned to a department.' });
    }

    const usersInDepartment = await User.find({ Department: department });
    console.log(department, usersInDepartment.length);
    
    const departmentLeaves = [];
    usersInDepartment.forEach(user => {
      user.leaves.forEach(leave => {
        departmentLeaves.push({
          leaveId: leave._id,
          employeeId: user._id,
          employeeName: `${user["First name"]} ${user["Last name"]}`,
          employeeEmail: user["Work email"],
          employeeCode: user["Employee Code"],
          date: leave.date,
          type: leave.type,
          duration: leave.duration,
          reason: leave.reason,
          appliedOn: leave.appliedOn,
          status: leave.status,
        });
      });
    });

    // Sort by applied date (newest first)
    departmentLeaves.sort((a, b) => new Date(b.appliedOn) - new Date(a.appliedOn));

    res.json(departmentLeaves);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
});

module.exports = router;
