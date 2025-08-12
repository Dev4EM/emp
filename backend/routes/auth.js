const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const auth = require('../middleware/auth'); // Import the auth middleware

const router = express.Router();

// --- Public Routes (No Auth Needed) ---

// POST /api/auth/register
router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;
  try {
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: 'User already exists' });
    }
    user = new User({ name, email, password });
    await user.save();
    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    const payload = { userId: user.id };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.json({ token });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});


// --- Protected Routes (Auth Needed) ---

// GET /api/auth/me (Get User Profile)
router.get('/me', auth, async (req, res) => {
  // The 'auth' middleware has already found the user and attached it to req.user
  // We can simply send it back. The password is already excluded.
  res.json(req.user);
});

// PUT /api/auth/me/update (Update User Profile)
router.put('/me/update', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Dynamically update user fields from the request body
    for (const key in req.body) {
      // Add a layer of protection: prevent certain fields from being updated this way
      if (key !== '_id' && key !== 'email') { 
        if (req.body.hasOwnProperty(key)) {
          user[key] = req.body[key];
        }
      }
    }

    await user.save();

    // Return the updated user, excluding the password
    const userResponse = user.toObject();
    delete userResponse.password;

    res.json(userResponse);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});
// ROUTE: PUT /api/auth/assign-reporting-manager
// DESC: Assign a reporting manager to a user (Admin functionality)
router.put('/assign-reporting-manager', auth, async (req, res) => {
  const { employeeId, managerId } = req.body;

  if (!employeeId) {
    return res.status(400).json({ message: 'Employee ID is required' });
  }

  try {
    // Find the employee
    const employee = await User.findById(employeeId);
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    // If managerId is provided, validate the manager exists and is a team leader
    if (managerId) {
      const manager = await User.findById(managerId);
      if (!manager) {
        return res.status(404).json({ message: 'Manager not found' });
      }
      if (manager.userType !== 'teamleader') {
        return res.status(400).json({ message: 'Specified manager must be a team leader' });
      }
      
      // Prevent self-assignment
      if (employeeId === managerId) {
        return res.status(400).json({ message: 'Employee cannot be their own reporting manager' });
      }
    }

    // Update the employee's reporting manager
    employee.reportingManager = managerId || null;
    await employee.save();

    // Return the updated employee info
    const updatedEmployee = await User.findById(employeeId)
      .populate('reportingManager', 'name email')
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

module.exports = router;
