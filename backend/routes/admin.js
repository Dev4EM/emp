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

// ROUTE: PUT /api/admin/assign-reporting-manager
// DESC: Assign or remove a reporting manager for a user
router.put('/assign-reporting-manager', auth, checkAdmin, async (req, res) => {
  const { employeeId, managerId } = req.body;

  if (!employeeId) {
    return res.status(400).json({ message: 'Employee ID is required' });
  }

  try {
    const employee = await User.findById(employeeId);
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    if (managerId) {
      const manager = await User.findById(managerId);
      if (!manager) {
        return res.status(404).json({ message: 'Manager not found' });
      }
      if (manager.userType !== 'teamleader' && manager.userType !== 'admin') {
        return res.status(400).json({ message: 'Specified manager must be a team leader or admin' });
      }
      if (employeeId === managerId) {
        return res.status(400).json({ message: 'Employee cannot be their own reporting manager' });
      }
    }

    employee.reportingManager = managerId || null;
    await employee.save();

    const updatedEmployee = await User.findById(employeeId)
      .populate('reportingManager', 'firstName lastName workEmail userType')
      .select('-password');

    res.json({
      message: managerId ? 'Reporting manager assigned successfully' : 'Reporting manager removed successfully',
      employee: updatedEmployee
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// ROUTE: GET /api/admin/all-users
// DESC: Get all users for admin management
router.get('/all-users', auth, checkAdmin, async (req, res) => {
  try {
    const users = await User.find()
      .populate('reportingManager', 'firstName lastName workEmail')
      .populate('functionalManager', 'firstName lastName workEmail')
      .select('-password')
      .sort({ firstName: 1 });

    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
});

module.exports = router;
