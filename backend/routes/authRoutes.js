const express = require('express');
const router = express.Router();
const passport = require('passport'); // Import passport
const {
  registerUser,
  loginUser,
  getMe,
  verifyEmail,
  googleAuthCallback, // Import new controller
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/me', protect, getMe);
router.get('/verify-email/:token', verifyEmail);

// ** ADD GOOGLE AUTH ROUTES **
router.get(
  '/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

router.get(
  '/google/callback',
  passport.authenticate('google', { failureRedirect: '/login', session: false }),
  googleAuthCallback // Call our controller on success
);

module.exports = router;