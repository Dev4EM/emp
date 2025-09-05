const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');
const Attendance = require('../models/Attendance'); // Add this import
const json2csv = require('json2csv').parse;

// Middleware to check if user is an admin
const checkAdmin = (req, res, next) => {
  if (req.user.userType !== 'admin') {
    return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
  }
  next();
};

// Helper function to format dates
const formatDate = (date) => {
  if (!date) return '';
  return new Date(date).toLocaleDateString('en-US');
};

const formatDateTime = (dateTime) => {
  if (!dateTime) return '';
  return new Date(dateTime).toLocaleString('en-US');
};

// ✅ GET /api/admin/attendance - Get all attendance records
router.get('/attendance', auth, checkAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 50, month, year, employeeId } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build query filters
    let query = {};
    
    if (employeeId) {
      query.employeeId = employeeId;
    }
    
    if (month && year) {
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0);
      query.date = { $gte: startDate, $lte: endDate };
    }

    // Get attendance records with employee details
    const attendanceRecords = await Attendance.find(query)
      .populate('employeeId', 'First\ name Last\ name Employee\ Code Department Designation')
      .sort({ date: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count for pagination
    const totalRecords = await Attendance.countDocuments(query);
    const totalPages = Math.ceil(totalRecords / parseInt(limit));

    res.json({
      success: true,
      attendance: attendanceRecords,
      pagination: {
        currentPage: parseInt(page),
        totalPages: totalPages,
        totalRecords: totalRecords,
        hasNextPage: parseInt(page) < totalPages,
        hasPrevPage: parseInt(page) > 1
      }
    });

  } catch (error) {
    console.error('Error fetching attendance:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching attendance records',
      error: error.message 
    });
  }
});

// ✅ GET /api/admin/attendance/all/csv - Download all attendance as CSV
router.get('/attendance/all/csv', auth, checkAdmin, async (req, res) => {
  try {
    const { month, year } = req.query;
    
    // Build query filters for CSV
    let query = {};
    if (month && year) {
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0);
      query.date = { $gte: startDate, $lte: endDate };
    }

    // Get all attendance records
    const attendanceRecords = await Attendance.find(query)
      .populate('employeeId', 'First\ name Last\ name Employee\ Code Department Designation')
      .sort({ date: -1 });

    if (attendanceRecords.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'No attendance records found' 
      });
    }

    // Format data for CSV
    const csvData = attendanceRecords.map(record => {
      const employee = record.employeeId;
      return {
        'Employee Name': employee ? `${employee['First name']} ${employee['Last name']}` : 'N/A',
        'Employee Code': employee ? employee['Employee Code'] : 'N/A',
        'Department': employee ? employee['Department'] : 'N/A',
        'Designation': employee ? employee['Designation'] : 'N/A',
        'Date': formatDate(record.date),
        'Check In': formatDateTime(record.checkIn),
        'Check Out': formatDateTime(record.checkOut),
        'Total Hours': record.totalHours ? record.totalHours.toFixed(2) : '0.00',
        'Status': record.status || 'Unknown',
        'Check In Location': record.checkInLocation?.address || 'N/A',
        'Check Out Location': record.checkOutLocation?.address || 'N/A'
      };
    });

    // Generate CSV
    const csv = json2csv(csvData);
    
    // Set headers for file download
    const fileName = month && year 
      ? `attendance_${year}_${month.toString().padStart(2, '0')}.csv`
      : `all_attendance_${new Date().toISOString().split('T')[0]}.csv`;
      
    res.header('Content-Type', 'text/csv');
    res.attachment(fileName);
    return res.send(csv);

  } catch (error) {
    console.error('CSV generation error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error generating CSV',
      error: error.message 
    });
  }
});

// ✅ GET /api/admin/attendance/:employeeId/csv - Download specific employee attendance as CSV
router.get('/attendance/:employeeId/csv', auth, checkAdmin, async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { month, year } = req.query;
    
    // Check if employee exists
    const employee = await User.findById(employeeId).select('First\ name Last\ name Employee\ Code Department Designation');
    if (!employee) {
      return res.status(404).json({ 
        success: false, 
        message: 'Employee not found' 
      });
    }

    // Build query
    let query = { employeeId: employeeId };
    if (month && year) {
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0);
      query.date = { $gte: startDate, $lte: endDate };
    }

    // Get attendance records for specific employee
    const attendanceRecords = await Attendance.find(query).sort({ date: -1 });

    if (attendanceRecords.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'No attendance records found for this employee' 
      });
    }

    // Format data for CSV
    const csvData = attendanceRecords.map(record => ({
      'Date': formatDate(record.date),
      'Check In': formatDateTime(record.checkIn),
      'Check Out': formatDateTime(record.checkOut),
      'Total Hours': record.totalHours ? record.totalHours.toFixed(2) : '0.00',
      'Status': record.status || 'Unknown',
      'Check In Location': record.checkInLocation?.address || 'N/A',
      'Check Out Location': record.checkOutLocation?.address || 'N/A',
      'Remarks': record.remarks || ''
    }));

    // Generate CSV
    const csv = json2csv(csvData);
    
    // Create filename with employee name
    const employeeName = `${employee['First name']}_${employee['Last name']}`.replace(/\s+/g, '_');
    const fileName = month && year 
      ? `${employeeName}_attendance_${year}_${month.toString().padStart(2, '0')}.csv`
      : `${employeeName}_attendance_${new Date().toISOString().split('T')[0]}.csv`;
    
    res.header('Content-Type', 'text/csv');
    res.attachment(fileName);
    return res.send(csv);

  } catch (error) {
    console.error('Employee CSV generation error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error generating employee CSV',
      error: error.message 
    });
  }
});

// ✅ GET /api/admin/attendance/summary - Get attendance summary statistics
router.get('/attendance/summary', auth, checkAdmin, async (req, res) => {
  try {
    const { month, year } = req.query;
    
    // Build date filter
    let dateFilter = {};
    if (month && year) {
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0);
      dateFilter = { date: { $gte: startDate, $lte: endDate } };
    }

    // Get summary statistics using aggregation
    const summary = await Attendance.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: null,
          totalRecords: { $sum: 1 },
          presentCount: { $sum: { $cond: [{ $eq: ['$status', 'Present'] }, 1, 0] } },
          halfDayCount: { $sum: { $cond: [{ $eq: ['$status', 'Half Day'] }, 1, 0] } },
          absentCount: { $sum: { $cond: [{ $eq: ['$status', 'Absent'] }, 1, 0] } },
          totalHours: { $sum: '$totalHours' },
          avgHours: { $avg: '$totalHours' }
        }
      }
    ]);

    // Get unique employee count
    const uniqueEmployees = await Attendance.distinct('employeeId', dateFilter);

    const stats = summary[0] || {
      totalRecords: 0,
      presentCount: 0,
      halfDayCount: 0,
      absentCount: 0,
      totalHours: 0,
      avgHours: 0
    };

    res.json({
      success: true,
      summary: {
        ...stats,
        uniqueEmployees: uniqueEmployees.length,
        avgHours: parseFloat((stats.avgHours || 0).toFixed(2)),
        totalHours: parseFloat((stats.totalHours || 0).toFixed(2))
      },
      period: month && year ? { month, year } : 'all_time'
    });

  } catch (error) {
    console.error('Error fetching attendance summary:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching attendance summary',
      error: error.message 
    });
  }
});

// ✅ PUT /api/admin/attendance/:userId - Update attendance record
router.put('/attendance/:userId', auth, checkAdmin, async (req, res) => {
  const { userId } = req.params;
  const { date, checkIn, checkOut, attendanceId } = req.body;

  if (!date || (!checkIn && !checkOut)) {
    return res.status(400).json({ 
      success: false,
      message: 'Date and at least one of check-in or check-out time are required' 
    });
  }

  try {
    // Normalize date
    const targetDate = new Date(date);
    const dayString = targetDate.toISOString().split('T')[0];
    const dayDate = new Date(dayString + 'T00:00:00.000Z');

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: 'User not found' 
      });
    }

    let attendanceRecord;

    if (attendanceId) {
      // Update existing attendance by ID
      attendanceRecord = await Attendance.findById(attendanceId);
      if (!attendanceRecord) {
        return res.status(404).json({ 
          success: false,
          message: 'Attendance record not found' 
        });
      }
    } else {
      // Find or create attendance for the date
      attendanceRecord = await Attendance.findOne({
        employeeId: userId,
        date: dayDate
      });
    }

    if (attendanceRecord) {
      // Update existing record
      if (checkIn && checkIn.trim() !== '') {
        attendanceRecord.checkIn = new Date(`${dayString}T${checkIn}:00.000Z`);
      }
      
      if (checkOut && checkOut.trim() !== '') {
        attendanceRecord.checkOut = new Date(`${dayString}T${checkOut}:00.000Z`);
      } else if (checkOut === '') {
        attendanceRecord.checkOut = null;
      }

      await attendanceRecord.save();
    } else {
      // Create new attendance record
      if (!checkIn || checkIn.trim() === '') {
        return res.status(400).json({ 
          success: false,
          message: 'Check-in time is required when creating a new attendance record' 
        });
      }

      attendanceRecord = new Attendance({
        employeeId: userId,
        date: dayDate,
        checkIn: new Date(`${dayString}T${checkIn}:00.000Z`),
        checkOut: (checkOut && checkOut.trim() !== '') ? 
          new Date(`${dayString}T${checkOut}:00.000Z`) : null,
      });

      await attendanceRecord.save();
    }

    res.json({
      success: true,
      message: 'Attendance updated successfully',
      attendance: attendanceRecord,
    });

  } catch (error) {
    console.error('Error updating attendance:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error', 
      error: error.message 
    });
  }
});

// ✅ DELETE /api/admin/attendance/:recordId - Delete attendance record
router.delete('/attendance/:recordId', auth, checkAdmin, async (req, res) => {
  try {
    const { recordId } = req.params;
    
    const deletedRecord = await Attendance.findByIdAndDelete(recordId);
    
    if (!deletedRecord) {
      return res.status(404).json({ 
        success: false,
        message: 'Attendance record not found' 
      });
    }

    res.json({
      success: true,
      message: 'Attendance record deleted successfully',
      deletedRecord: {
        id: deletedRecord._id,
        date: deletedRecord.date,
        employeeId: deletedRecord.employeeId
      }
    });

  } catch (error) {
    console.error('Error deleting attendance:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error deleting attendance record',
      error: error.message 
    });
  }
});





// ROUTE: POST /api/admin/adduser
// DESC: Add a new user
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

    // Check if user already exists
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
      password, // In a real app, this should be hashed
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

// ROUTE: GET /api/admin/all-users
// DESC: Get all users for admin management
router.get('/all-users', auth, checkAdmin, async (req, res) => {
  try {
    console.log('Fetching all users for admin...'); // Debug log
    
    const users = await User.find()
      .select('-password') // Exclude password field
      .sort({ "First name": 1 }); // Sort by first name

    console.log(`Found ${users.length} users`); // Debug log
    
    res.json({
      success: true,
      count: users.length,
      users: users
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

// ROUTE: PUT /api/admin/assign-reporting-manager
// DESC: Assign or remove a reporting manager for a user
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

    if (managerName) {
      // Validate that the manager exists
      const manager = await User.findOne({
        $or: [
          { "First name": { $regex: managerName, $options: 'i' } },
          { $expr: { $regexMatch: { input: { $concat: ["$First name", " ", "$Last name"] }, regex: managerName, options: 'i' } } }
        ]
      });
      
      if (!manager) {
        return res.status(404).json({ message: 'Manager not found' });
      }
      
      if (manager.userType !== 'teamleader' && manager.userType !== 'admin') {
        return res.status(400).json({ message: 'Specified manager must be a team leader or admin' });
      }
      
      if (employeeId === manager._id.toString()) {
        return res.status(400).json({ message: 'Employee cannot be their own reporting manager' });
      }
    }

    employee["Reporting manager"] = managerName || '';
    await employee.save();

    const updatedEmployee = await User.findById(employeeId).select('-password');

    res.json({
      success: true,
      message: managerName ? 'Reporting manager assigned successfully' : 'Reporting manager removed successfully',
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

// ROUTE: PUT /api/admin/update-user/:id
// DESC: Update a particular user (admin only)
router.put('/update-user/:id', auth, checkAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log('Updating user:', id); // Debug log
    console.log('Request body:', req.body); // Debug log
    
    // Validate ObjectId format
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID format'
      });
    }
    
    // Never update password here unless you hash it!
    if ('password' in req.body) {
      delete req.body.password;
    }
    
    // Remove empty fields to avoid updating with empty values
    const updateData = Object.keys(req.body).reduce((acc, key) => {
      if (req.body[key] !== '' && req.body[key] !== null && req.body[key] !== undefined) {
        acc[key] = req.body[key];
      }
      return acc;
    }, {});
    
    const updatedUser = await User.findByIdAndUpdate(id, updateData, { 
      new: true,
      runValidators: true // Run schema validators
    }).select('-password');
      
    if (!updatedUser) {
      return res.status(404).json({ 
        success: false,
        message: 'User not found' 
      });
    }
    
    res.json({
      success: true,
      message: 'User updated successfully',
      user: updatedUser
    });
  } catch (error) {
    console.error('Error updating user:', error);
    
    // Handle specific MongoDB errors
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
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});


// ROUTE: DELETE /api/admin/delete-user/:id
// DESC: Delete a user (admin only)
router.delete('/delete-user/:id', auth, checkAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    const deletedUser = await User.findByIdAndDelete(id);
    
    if (!deletedUser) {
      return res.status(404).json({ 
        success: false,
        message: 'User not found' 
      });
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
// GET /api/admin/all-leaves
// DESC: Get all leaves (pending, approved, rejected) across the organization
router.get('/all-leaves', auth, checkAdmin, async (req, res) => {
  try {
    // Get all users with leaves
    const users = await User.find({
      'leaves.0': { $exists: true } // Only users who have at least one leave
    }) 
    const allLeaves = [];
    
    users.forEach(user => {
      console.log(user);
      user.leaves.forEach(leave => {
        allLeaves.push({
          leaveId: leave._id,
          employeeId: user._id,
          employeeName: String(user["First name"]),
          employeeEmail: user["Work email"],
          employeeCode: user["Employee Code"],
          department: user.Department,
          designation: user.Designation,
          date: leave.date,
          type: leave.type,
          duration: leave.duration,
          reason: leave.reason,
          appliedOn: leave.appliedOn,
          status: leave.status,
          approvedBy: leave.approvedBy,
          approvedOn: leave.approvedOn,
          rejectionReason: leave.rejectionReason
        });
      });
    });

    // Sort by applied date (newest first)
    allLeaves.sort((a, b) => new Date(b.appliedOn) - new Date(a.appliedOn));

    res.json({
      success: true,
      count: allLeaves.length,
      leaves: allLeaves
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

// ROUTE: GET /api/admin/dashboard-stats
// DESC: Get dashboard statistics for admin
router.get('/dashboard-stats', auth, checkAdmin, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ "Employment status": "Active" });
    const teamLeaders = await User.countDocuments({ userType: "teamleader" });
    const admins = await User.countDocuments({ userType: "admin" });
    
    // Get recent user registrations (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentUsers = await User.countDocuments({ 
      createdAt: { $gte: thirtyDaysAgo } 
    });

    res.json({
      success: true,
      stats: {
        totalUsers,
        activeUsers,
        teamLeaders,
        admins,
        recentUsers
      }
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server Error',
      error: error.message 
    });
  }
});



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
      user: updatedUser,
    });
  } catch (error) {
    console.error('Error updating leave balance:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
