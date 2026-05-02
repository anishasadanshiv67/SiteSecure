const express = require('express');
const router = express.Router();
const {
  registerUser,
  loginUser,
  getMe,
} = require('../controllers/authController');
const { verifyToken, authorizeRoles } = require('../middleware/authMiddleware');

// Register a new user
router.post('/register', registerUser);

// Login a user
router.post('/login', loginUser);

// Get current logged-in user profile
router.get('/me', verifyToken, getMe);

// Example of a protected route requiring a specific role
// router.get('/admin-only', verifyToken, authorizeRoles('site_admin', 'super_admin'), (req, res) => {
//   res.json({ message: 'Welcome Admin' });
// });

module.exports = router;
