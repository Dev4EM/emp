const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();
// PUT /api/auth/change-password
router.put('/change-password', auth, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  
  try {
    // Validate input
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current password and new password are required' });
    }
    
    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters long' });
    }
    
    // Get the user
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Verify current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }
    
    // Update password (you might want to hash this in a real application)
    user.password = newPassword;
    await user.save();
    
    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/auth/register
router.post('/register', async (req, res) => {
  const { firstName, lastName, workEmail, password } = req.body;
  try {
    let user = await User.findOne({ workEmail });
    if (user) {
      return res.status(400).json({ message: 'User already exists' });
    }
    user = new User({ firstName, lastName, workEmail, password });
    await user.save();
    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/login', async (req, res) => {
  const { workEmail, password } = req.body;
  
  try {
    console.log('=== LOGIN DEBUG START ===');
    console.log('1. Input email:', workEmail);
    console.log('2. Input email type:', typeof workEmail);
    console.log('3. Input email length:', workEmail ? workEmail.length : 'undefined');
    console.log('4. Input password:', password);
    
    // Case-insensitive query using regex
    const user = await User.findOne({ 
      "Work email": { $regex: `^${workEmail}$`, $options: 'i' } 
    });
    
    console.log('5. Query executed successfully');
    console.log('6. User found?', !!user);
    console.log('7. User type:', typeof user);
    
    if (user) {
      console.log('8. User ID:', user._id);
      console.log('9. User email from DB:', user["Work email"]);
      console.log('10. User password from DB:', user.password);
      console.log('11. Password type from DB:', typeof user.password);
      
      // Direct password comparison since your DB has plain text passwords
      const passwordMatch = user.password === password;
      console.log('12. Password match:', passwordMatch);
      console.log('13. DB password === Input password:', user.password, '===', password, '=', passwordMatch);
      
      if (!passwordMatch) {
        console.log('14. Password mismatch - returning invalid credentials');
        return res.status(400).json({ message: 'Invalid credentials' });
      }
      
      console.log('15. Creating JWT token');
      const payload = { 
        userId: user._id,
        userType: user.userType,
        email: user["Work email"],
        name: `${user["First name"]} ${user["Last name"]}`
      };
      
      const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '24h' });
      
      console.log('16. Login successful, returning token');
      return res.json({ 
        token,
        user: {
          id: user._id,
          name: `${user["First name"]} ${user["Last name"]}`,
          email: user["Work email"],
          userType: user.userType,
          department: user.Department
        }
      });
    } else {
      console.log('14. No user found - user variable is falsy');
      console.log('15. User variable:', user);
      console.log('16. Checking if user exists with different query...');
      
      // Try exact match
      const userExact = await User.findOne({ "Work email": workEmail });
      console.log('17. Exact match result:', !!userExact);
      
      // Try to find any user to test DB connection
      const anyUser = await User.findOne({});
      console.log('18. Any user exists in DB:', !!anyUser);
      console.log('19. Total user count:', await User.countDocuments());
      
      return res.status(400).json({ message: 'User not found' });
    }
    
  } catch (error) {
    console.error('=== LOGIN ERROR ===');
    console.error('Error details:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ message: 'Server error' });
  }
});


// GET /api/auth/me (Get User Profile)
router.get('/me', auth, async (req, res) => {
  res.json(req.user);
});

// PUT /api/auth/me/update (Update User Profile)
router.put('/me/update', auth, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.user.id, req.body, { new: true }).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
