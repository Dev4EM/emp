const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
  let token;

  // Check for the token in the Authorization header
  if (req.header('Authorization') && req.header('Authorization').startsWith('Bearer')) {
    try {
      // Extract the token from 'Bearer <token>'
      token = req.header('Authorization').replace('Bearer ', '');

      // Verify the token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Find the user by ID from the token payload and attach it to the request object
      // Exclude the password from the user object that gets attached
      req.user = await User.findById(decoded.userId).select('-password');
      
      if (!req.user) {
        throw new Error();
      }

      next(); // Proceed to the next middleware or route handler
    } catch (error) {
      res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    res.status(401).json({ message: 'Not authorized, no token' });
  }
};

module.exports = auth;
