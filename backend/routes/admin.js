const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');

// Middleware to check if user is an admin
const checkAdmin = (req, res, next) => {
  if (req.user.userType !== 'admin') {
    return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
  }
  next();
};

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

module.exports = router;
