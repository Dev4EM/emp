const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');
const Leave = require('../models/Leave');
const Attendance = require('../models/Attendance');

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

// PUT /api/teamleader/reject-leave - Updated with notifications
// PUT /api/teamleader/approve-leave
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

    const leave = await Leave.findById(leaveId);
    if (!leave) {
      return res.status(404).json({ message: 'Leave request not found' });
    }

    // Optional safety check
    if (leave.employeeId.toString() !== employee._id.toString()) {
      return res.status(403).json({ message: 'Leave does not belong to the specified employee' });
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
      await employee.save();
    }

    leave.status = 'approved';
    leave.approvedBy = req.user.id;
    leave.approvedOn = new Date();
    await leave.save();

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


// PUT /api/teamleader/reject-leave
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

    const leave = await Leave.findById(leaveId);

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

    await leave.save();

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
    const currentUser = await User.findById(req.user.id);
    const managerName = `${currentUser["First name"]} ${currentUser["Last name"]}`.trim();

    // Find team members under this manager
    const teamMembers = await User.find({ 
      "Reporting manager": { $regex: new RegExp(`^${managerName}$`, 'i') } 
    }).select({
  _id: 1,
  "First name": 1,
  "Last name": 1,
  "Work email": 1,
  "Employee Code": 1
});


    const teamMemberIds = teamMembers.map(member => member._id);

    // Get pending leaves for these users
    const pendingLeaves = await Leave.find({
      employeeId: { $in: teamMemberIds },
      status: 'pending'
    }).sort({ appliedOn: -1 }).lean();

    // Map leave data with employee info
    const leavesWithEmployeeData = pendingLeaves.map(leave => {
      const emp = teamMembers.find(member => member._id.equals(leave.employeeId));
      return {
        leaveId: leave._id,
        employeeId: leave.employeeId,
         employeeName: emp ? `${emp["First name"]} ${emp["Last name"]}` : '',
        employeeEmail: emp ? emp["Work email"] : '',
        employeeCode: emp ? emp["Employee Code"] : '',
        date: leave.date,
        type: leave.type,
        duration: leave.duration,
        reason: leave.reason,
        appliedOn: leave.appliedOn,
        status: leave.status
      };
    });

    res.json(leavesWithEmployeeData);
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

    // 1. Get team members reporting to the current manager
    const teamMembers = await User.find({
      "Reporting manager": { $regex: new RegExp(`^${managerName}$`, 'i') }
    }).select({
      _id: 1,
      "First name": 1,
      "Last name": 1,
      "Employee Code": 1,
      "Work email": 1
    });

    if (teamMembers.length === 0) {
      return res.json([]); // No team members found
    }

    const teamMemberIds = teamMembers.map(member => member._id);

    // 2. Get attendance records for those team members
    const attendanceRecords = await Attendance.find({
      employeeId: { $in: teamMemberIds }
    }).sort({ date: -1 }).lean();

    // 3. Map attendance records to user details
    const attendanceWithUser = attendanceRecords.map(record => {
      const user = teamMembers.find(u => u._id.equals(record.employeeId));
      return {
        attendanceId: record._id,
        employeeId: record.employeeId,
        employeeName: user ? `${user["First name"]} ${user["Last name"]}` : '',
        employeeCode: user ? user["Employee Code"] : '',
        employeeEmail: user ? user["Work email"] : '',
        date: record.date,
        checkIn: record.checkIn,
        checkInLocation: record.checkInLocation,
        checkOut: record.checkOut,
        checkOutLocation: record.checkOutLocation,
        remarks: record.remarks,
        updatedCheckIn: record.updatedCheckIn,
        updatedCheckOut: record.updatedCheckOut,
        reason: record.reason,
        updatedAt: record.updatedAt
      };
    });

    res.json(attendanceWithUser);
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

    const usersInDepartment = await User.find({ Department: department }).select({
  _id: 1,
  "First name": 1,
  "Last name": 1,
  "Work email": 1,
  "Employee Code": 1
});
;
    const userIds = usersInDepartment.map(u => u._id);

    const leaves = await Leave.find({ employeeId: { $in: userIds } }).sort({ appliedOn: -1 }).lean();

    const leavesWithUser = leaves.map(leave => {
      const user = usersInDepartment.find(u => u._id.equals(leave.employeeId));
      return {
        leaveId: leave._id,
        employeeId: leave.employeeId,
        employeeName: user ? `${user["First name"]} ${user["Last name"]}` : '',
        employeeEmail: user ? user["Work email"] : '',
        employeeCode: user ? user["Employee Code"] : '',
        date: leave.date,
        type: leave.type,
        duration: leave.duration,
        reason: leave.reason,
        appliedOn: leave.appliedOn,
        status: leave.status,
      };
    });

    res.json(leavesWithUser);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
});

module.exports = router;
