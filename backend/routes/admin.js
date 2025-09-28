const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');
const Attendance = require('../models/Attendance');
const Leave = require('../models/Leave');
const mongoose = require('mongoose');
const { Parser: Json2csvParser } = require('json2csv');

function normalizeToDay(date = new Date()) {
  const dayString = date.toISOString().split('T')[0]; // 'YYYY-MM-DD'
  const dayDate = new Date(dayString + 'T00:00:00.000Z'); // UTC midnight
  return { dayString, dayDate };
}

const checkAdmin = (req, res, next) => {
  if (req.user.userType !== 'admin') {
    return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
  }
  next();
};

const formatDate = (isoString) => {
  if (!isoString) return '';
  try {
    const date = new Date(isoString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  } catch (error) {
    console.error('Date formatting error:', error);
    return isoString;
  }
};

const formatDateTime = (isoString) => {
  if (!isoString) return '';
  try {
    const date = new Date(isoString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${day}-${month}-${year} ${hours}:${minutes}`;
  } catch (error) {
    console.error('DateTime formatting error:', error);
    return isoString;
  }
};

function calculateAttendanceStatus(checkIn, checkOut, updatedCheckIn, updatedCheckOut) {
  const actualCheckIn = updatedCheckIn || checkIn;
  const actualCheckOut = updatedCheckOut || checkOut;

  if (!actualCheckIn || !actualCheckOut) {
    return { totalHours: 0, status: 'Incomplete' };
  }

  const ms = new Date(actualCheckOut) - new Date(actualCheckIn);
  const totalHours = ms / (1000 * 60 * 60);

  let status = 'Present';
  if (totalHours < 4) status = 'Half Day';
  if (totalHours < 1) status = 'Absent';

  return { totalHours, status };
}

/**
 * ROUTE: GET /attendance/all/csv
 * DESCRIPTION: Export all users’ attendance as CSV, using updatedCheckIn/out fallback
 */
router.get('/attendance/all/csv', auth, checkAdmin, async (req, res) => {
  try {
    console.log('Generating CSV of all attendance...');

    // Fetch all users (only needed name fields)
    const users = await User.find({}, {
      _id: 1,
      'First name': 1,
      'Last name': 1,
      firstName: 1,
      lastName: 1
    });

    const records = [];

    // For each user, fetch attendance records and prepare CSV rows
    for (const user of users) {
      const attendanceRecords = await Attendance.find({ employeeId: user._id });

      attendanceRecords.forEach(a => {
        const { totalHours, status } = calculateAttendanceStatus(
          a.checkIn,
          a.checkOut,
          a.updatedCheckIn,
          a.updatedCheckOut
        );

        const firstName = user['First name'] || user.firstName || 'Unknown';
        const lastName = user['Last name'] || user.lastName || 'User';

        records.push({
          Employee: `${firstName} ${lastName}`.trim(),
          Date: a.date ? a.date.toISOString().split('T')[0] : '',
          'Check-in': (a.updatedCheckIn || a.checkIn) ? (a.updatedCheckIn || a.checkIn).toISOString() : '',
          'Check-out': (a.updatedCheckOut || a.checkOut) ? (a.updatedCheckOut || a.checkOut).toISOString() : '',
          'Total Hours': totalHours ? totalHours.toFixed(2) : '0.00',
          Status: status || 'Unknown'
        });
      });
    }

    const fields = ['Employee', 'Date', 'Check-in', 'Check-out', 'Total Hours', 'Status'];
    const json2csv = new Json2csvParser({ fields });
    const csv = json2csv.parse(records);

    res.header('Content-Type', 'text/csv');
    res.attachment('all_employees_attendance.csv');
    return res.send(csv);

  } catch (err) {
    console.error('CSV generation error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

/**
 * ROUTE: GET /attendance/:employeeId/csv
 * DESCRIPTION: Export attendance CSV for a single user
 */
router.get('/attendance/:employeeId/csv', auth, checkAdmin, async (req, res) => {
  try {
    const employeeId = req.params.employeeId;

    // Fetch the user info
    const user = await User.findById(employeeId).select({
      'First name': 1,
      'Last name': 1,
      firstName: 1,
      lastName: 1,
      'Employee Code': 1,
      'Mobile number': 1,
      'Prefix': 1,
      'Designation': 1,
      'userType': 1,
      'Work email': 1,
      'Department': 1,
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Fetch attendance records for the user, sorted by date ascending
    const attendanceRecords = await Attendance.find({ employeeId }).sort({ date: 1 });

    if (!attendanceRecords.length) {
      return res.status(404).json({ message: "No attendance records found for this user" });
    }

    const firstName = user['First name'] || user.firstName || '';
    const lastName = user['Last name'] || user.lastName || '';
    const employeeName = `${firstName} ${lastName}`.trim() || employeeId;

    // Map attendance records to CSV rows
    const records = attendanceRecords.map(a => {
      const { totalHours, status } = calculateAttendanceStatus(
        a.checkIn,
        a.checkOut,
        a.updatedCheckIn,
        a.updatedCheckOut
      );

      return {
        EmployeeID: employeeId.toString(),
        EmployeeName: employeeName,
        MobileNumber: user['Mobile number'] || '',
        Prefix: user['Prefix'] || '',
        Designation: user['Designation'] || '',
        WorkEmail: user['Work email'] || '',

        Date: formatDate(a.date),

        // Show updatedCheckIn if exists, else checkIn
        CheckIn: (a.updatedCheckIn || a.checkIn) ? formatDateTime(a.updatedCheckIn || a.checkIn) : '',

        // Show updatedCheckOut if exists, else checkOut
        CheckOut: (a.updatedCheckOut || a.checkOut) ? formatDateTime(a.updatedCheckOut || a.checkOut) : '',

        TotalHours: totalHours ? totalHours.toFixed(2) : '0.00',
        Status: status || 'Unknown',
        CheckInLocation: a.checkInLocation?.address || '',
        CheckOutLocation: a.checkOutLocation?.address || '',
        Remarks: a.remarks || '',
      };
    });

    // Define CSV fields
    const fields = [
    
      'EmployeeName',
      'Date',
      'CheckIn',
      'CheckOut',
      'TotalHours',
      'Status',
    ];

    const json2csv = new Json2csvParser({ fields });
    const csv = json2csv.parse(records);

    res.header('Content-Type', 'text/csv');
    res.attachment(`${employeeName.replace(/\s+/g, '_')}_attendance.csv`);
    return res.send(csv);

  } catch (err) {
    console.error('CSV generation error (single user):', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

/**
 * ROUTE: POST /adduser
 * DESCRIPTION: Add a new user (admin)
 */
router.post('/adduser', auth, checkAdmin, async (req, res) => {
  try {
    const {
      "Prefix": prefix,
      "First name": firstName,
      "Last name": lastName,
      "Date of birth": dob,
      "Gender": gender,
      "Blood group": bloodGroup,
      "Nationality": nationality,
      "Work email": workEmail,
      "Mobile number": mobileNumber,
      "ISDcode": isdCode,
      password,
      "Employee Code": employeeCode,
      "Date of joining": doj,
      "Employment type": employmentType,
      "Employment status": employmentStatus,
      "Company": company,
      "Business Unit": businessUnit,
      "Department": department,
      "Sub department": subDepartment,
      "Designation": designation,
      "Region": region,
      "Branch": branch,
      "Sub branch": subBranch,
      "Shift": shift,
      "Level": level,
      "Skill Type": skillType,
      "Date of Confirmation": doc,
      "Employee Other Status": employeeOtherStatus,
      userType,
      "Reporting manager": reportingManager,
      "Functional manager": functionalManager,
    } = req.body;

    let user = await User.findOne({ "Work email": workEmail });
    if (user) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    user = new User({
      "Prefix": prefix,
      "First name": firstName,
      "Last name": lastName,
      "Date of birth": dob,
      "Gender": gender,
      "Blood group": bloodGroup,
      "Nationality": nationality,
      "Work email": workEmail,
      "Mobile number": mobileNumber,
      "ISDcode": isdCode,
      password,
      "Employee Code": employeeCode,
      "Date of joining": doj,
      "Employment type": employmentType,
      "Employment status": employmentStatus,
      "Company": company,
      "Business Unit": businessUnit,
      "Department": department,
      "Sub department": subDepartment,
      "Designation": designation,
      "Region": region,
      "Branch": branch,
      "Sub branch": subBranch,
      "Shift": shift,
      "Level": level,
      "Skill Type": skillType,
      "Date of Confirmation": doc,
      "Employee Other Status": employeeOtherStatus,
      userType,
      "Reporting manager": reportingManager,
      "Functional manager": functionalManager,
    });

    await user.save();

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      user,
    });
  } catch (error) {
    console.error('Error adding new user:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message,
    });
  }
});

/**
 * ROUTE: GET /all-users
 * DESCRIPTION: Get all users (admin view)
 */
router.get('/all-users', auth, checkAdmin, async (req, res) => {
  try {
    console.log('Fetching all users for admin...');
    const users = await User.find()
      .select('-password')
      .sort({ "First name": 1 });
    console.log(`Found ${users.length} users`);
    res.json({
      success: true,
      count: users.length,
      users
    });
  } catch (error) {
    console.error('Error fetching all users:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
});

/**
 * ROUTE: PUT /assign-reporting-manager
 */
router.put('/assign-reporting-manager', auth, checkAdmin, async (req, res) => {
  const { employeeId, managerName } = req.body;
  if (!employeeId) {
    return res.status(400).json({ message: 'Employee ID is required' });
  }

  try {
    const employee = await User.findById(employeeId);
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    let manager = null;
    if (managerName) {
      manager = await User.findOne({
        $or: [
          { "First name": { $regex: managerName, $options: 'i' } },
          { $expr: { $regexMatch: { input: { $concat: ["$First name", " ", "$Last name"] }, regex: managerName, options: 'i' } } }
        ]
      });

      if (!manager) {
        return res.status(404).json({ message: 'Manager not found' });
      }
      if (manager.userType !== 'teamleader' && manager.userType !== 'admin') {
        return res.status(400).json({ message: 'Manager must be a team leader or admin' });
      }
      if (employeeId === manager._id.toString()) {
        return res.status(400).json({ message: 'Employee cannot be their own manager' });
      }
    }

    employee["Reporting manager"] = managerName || '';
    await employee.save();

    const updatedEmployee = await User.findById(employeeId).select('-password');
    res.json({
      success: true,
      message: managerName ? 'Reporting manager assigned' : 'Reporting manager removed',
      employee: updatedEmployee
    });
  } catch (error) {
    console.error('Error assigning reporting manager:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
});

/**
 * ROUTE: PUT /update-user/:id
 */
router.put('/update-user/:id', auth, checkAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    console.log('Updating user:', id);
    console.log('Request body:', req.body);

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid user ID format' });
    }

    if (req.body.password) {
      delete req.body.password; // don’t update password here
    }

    const updateData = {};
    for (const key in req.body) {
      if (req.body[key] !== '' && req.body[key] !== null && req.body[key] !== undefined) {
        updateData[key] = req.body[key];
      }
    }

    const updatedUser = await User.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true
    }).select('-password');

    if (!updatedUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({
      success: true,
      message: 'User updated successfully',
      user: updatedUser
    });

  } catch (error) {
    console.error('Error updating user:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: Object.values(error.errors).map(e => e.message)
      });
    }
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID format'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
});

/**
 * ROUTE: DELETE /delete-user/:id
 */
router.delete('/delete-user/:id', auth, checkAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const deletedUser = await User.findByIdAndDelete(id);
    if (!deletedUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.json({
      success: true,
      message: 'User deleted successfully',
      deletedUser: {
        id: deletedUser._id,
        name: `${deletedUser["First name"]} ${deletedUser["Last name"]}`,
        email: deletedUser["Work email"]
      }
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
});

/**
 * ROUTE: GET /all-leaves
 */
router.get('/all-leaves', auth, checkAdmin, async (req, res) => {
  try {
    const leaves = await Leave.find({})
      .populate({
        path: 'employeeId',
        select: 'First name Work email Employee Code Department Designation'
      })
      .populate({
        path: 'approvedBy',
        select: 'First name Work email'
      })
      .sort({ appliedOn: -1 });

    const formattedLeaves = leaves.map(leave => ({
      leaveId: leave._id,
      employeeId: leave.employeeId?._id || null,
      employeeName: leave.employeeId?.['First name'] || '',
      employeeEmail: leave.employeeId?.['Work email'] || '',
      employeeCode: leave.employeeId?.['Employee Code'] || '',
      department: leave.employeeId?.Department || '',
      designation: leave.employeeId?.Designation || '',
      date: leave.date,
      type: leave.type,
      duration: leave.duration,
      reason: leave.reason,
      appliedOn: leave.appliedOn,
      status: leave.status,
      approvedBy: leave.approvedBy?.['First name'] || '',
      approvedOn: leave.approvedOn,
      rejectionReason: leave.rejectionReason
    }));

    res.json({
      success: true,
      count: formattedLeaves.length,
      leaves: formattedLeaves
    });

  } catch (error) {
    console.error('Error fetching all leaves:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
});

/**
 * ROUTE: GET /Dashb-all-users  (dashboard style)
 */
router.get('/Dashb-all-users', auth, checkAdmin, async (req, res) => {
  try {
    console.log('Fetching all users with attendance (dashboard)...');

    const queryDate = req.query.date ? new Date(req.query.date) : new Date();
    queryDate.setHours(0, 0, 0, 0);

    const startOfMonth = new Date(queryDate.getFullYear(), queryDate.getMonth(), 1);
    const endOfMonth = new Date(queryDate.getFullYear(), queryDate.getMonth() + 1, 0);
    endOfMonth.setHours(23, 59, 59, 999);

    const users = await User.find()
      .select('-password')
      .sort({ "First name": 1 });

    const userAttendancePromises = users.map(async (user) => {
      const attendanceRecords = await Attendance.find({
        employeeId: user._id,
        date: {
          $gte: startOfMonth,
          $lte: endOfMonth
        }
      }).sort({ date: 1 });

      const formattedAttendance = attendanceRecords.map(record => ({
        date: record.date?.toISOString().split('T')[0] || '',
        checkIn: record.updatedCheckIn || record.checkIn || null,
        checkOut: record.updatedCheckOut || record.checkOut || null,
        checkInLocation: record.checkInLocation?.address || 'N/A',
        checkOutLocation: record.checkOutLocation?.address || 'N/A',
        remarks: record.remarks || ''
      }));

      return {
        _id: user._id,
        name: `${user['First name'] || ''} ${user['Last name'] || ''}`.trim(),
        employeeCode: user['Employee Code'] || '',
        userContact: user['Mobile number'] || '',
        userPrefix: user['Prefix'] || '',
        userDesignation: user['Designation'] || '',
        userType: user['userType'] || '',
        workEmail: user['Work email'] || '',
        userShift:user.Shift ||'No',
        department: user.Department || '',
        attendance: formattedAttendance
      };
    });

    const usersWithAttendance = await Promise.all(userAttendancePromises);

    console.log(`Found ${usersWithAttendance.length} users with attendance`);

    res.json({
      success: true,
      count: usersWithAttendance.length,
      users: usersWithAttendance,
    });

  } catch (error) {
    console.error('Error fetching dashboard users with attendance:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
});

/**
 * ROUTE: PUT /attendance/:userId
 * DESCRIPTION: Update a specific attendance record inside user (if you ever embedded it in user)
 * NOTE: Your current design stores attendance in separate collection, so likely this route is not used. 
 */
router.put('/attendance/:userId', auth, checkAdmin, async (req, res) => {
  const { userId } = req.params;
  const { date, checkIn, checkOut } = req.body;

  try {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }
    if (!date) {
      return res.status(400).json({ message: 'Date is required' });
    }

    const { dayString, dayDate } = normalizeToDay(new Date(date));

    // Find the attendance document
    let attendanceDoc = await Attendance.findOne({
      employeeId: userId,
      date: dayDate
    });

    if (!attendanceDoc) {
      return res.status(404).json({ message: 'Attendance record not found for that day' });
    }

    // Update fields
    if (checkIn) {
      attendanceDoc.updatedCheckIn = new Date(`${dayString}T${checkIn}:00.000Z`);
      attendanceDoc.updatedCheckInAt = new Date();
      attendanceDoc.updatedCheckInBy = req.user._id;
    }
    if (checkOut) {
      attendanceDoc.updatedCheckOut = new Date(`${dayString}T${checkOut}:00.000Z`);
      attendanceDoc.updatedCheckOutAt = new Date();
      attendanceDoc.updatedCheckOutBy = req.user._id;
    }

    attendanceDoc.updatedBy = req.user._id;
    attendanceDoc.updatedAt = new Date();

    await attendanceDoc.save();

    return res.json({
      success: true,
      message: 'Attendance updated successfully',
      attendance: attendanceDoc
    });
  } catch (error) {
    console.error('Error updating attendance for user:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * ROUTE: PUT /leave-balance/:userId
 */
router.put('/leave-balance/:userId', auth, checkAdmin, async (req, res) => {
  const { userId } = req.params;
  const { leaveBalance } = req.body;

  if (leaveBalance === undefined) {
    return res.status(400).json({ message: 'Leave balance is required' });
  }

  try {
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: { paidLeaveBalance: leaveBalance } },
      { new: true }
    ).select('-password');

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      success: true,
      message: 'Leave balance updated successfully',
      user: updatedUser
    });
  } catch (error) {
    console.error('Error updating leave balance:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
