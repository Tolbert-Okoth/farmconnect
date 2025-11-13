const asyncHandler = require('express-async-handler');
const db = require('../config/db');
const bcrypt = require('bcryptjs');
const generateToken = require('../utils/jwtGenerator');
const crypto = require('crypto'); // Add this built-in module
const sendEmail = require('../utils/sendEmail'); // Add this

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public


// @desc    Handle Google auth callback, create JWT
// @route   GET /api/auth/google/callback
// @access  Public
const googleAuthCallback = (req, res) => {
  // Passport attaches the 'user' object to req
  const user = req.user;
  
  // Create a JWT for this user
  const token = generateToken(user.user_id, user.role);
  
  // We can't just send JSON. We need to send the token to the frontend.
  // We'll render a simple script that saves the token in localStorage
  // and closes the popup window.
  
  const userData = JSON.stringify({
      _id: user.user_id,
      username: user.username,
      email: user.email,
      role: user.role,
      is_admin: user.is_admin,
      token: token
  });

  res.send(`
    <html>
      <body>
        <script>
          window.opener.postMessage(${userData}, 'http://localhost:3000');
          window.close();
        </script>
        <p>Logging in... you can close this window.</p>
      </body>
    </html>
  `);
};
const registerUser = asyncHandler(async (req, res) => {
  const { username, email, password, role } = req.body;

  if (!username || !email || !password || !role) {
    res.status(400);
    throw new Error('Please add all fields');
  }

  if (role !== 'farmer' && role !== 'buyer') {
    res.status(400);
    throw new Error('Invalid user role');
  }

  // Check if user exists
  const userExists = await db.query('SELECT * FROM users WHERE email = $1', [
    email,
  ]);

  if (userExists.rows.length > 0) {
    res.status(400);
    throw new Error('User already exists');
  }

  // Hash password
  const salt = await bcrypt.genSalt(10);
  const password_hash = await bcrypt.hash(password, salt);

  // Create verification token
  const verificationToken = crypto.randomBytes(32).toString('hex');
  const email_verify_token = crypto
    .createHash('sha256')
    .update(verificationToken)
    .digest('hex');
  const email_verify_expires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  // Create user (but not verified yet)
  const newUser = await db.query(
    `INSERT INTO users (username, email, password_hash, role, email_verify_token, email_verify_expires) 
     VALUES ($1, $2, $3, $4, $5, $6) 
     RETURNING user_id, username, email, role`,
    [
      username,
      email,
      password_hash,
      role,
      email_verify_token,
      email_verify_expires,
    ]
  );

  const user = newUser.rows[0];

  if (user) {
    // Send verification email
    try {
      const verifyURL = `${
        process.env.FRONTEND_URL || 'http://localhost:3000'
      }/verify-email/${verificationToken}`;

      const message = `
        <p>Hi ${user.username},</p>
        <p>Welcome to FarmConnect! Please click the link below to verify your email address:</p>
        <a href="${verifyURL}" target="_blank">Verify Your Email</a>
        <p>This link will expire in 10 minutes.</p>
       `;

      await sendEmail({
        email: user.email,
        subject: 'FarmConnect - Verify Your Email',
        html: message,
      });

      res.status(201).json({
        message: 'Registration successful! Please check your email to verify.',
      });
    } catch (err) {
      console.error(err);
      // If email fails, we should probably roll back the user creation,
      // or at least let them resend it. For now, we'll send an error.
      await db.query('DELETE FROM users WHERE user_id = $1', [user.user_id]);
      res.status(500);
      throw new Error('Email could not be sent. Please try again.');
    }
  } else {
    res.status(400);
    throw new Error('Invalid user data');
  }
});

// @desc    Verify user email
// @route   GET /api/auth/verify-email/:token
// @access  Public
const verifyEmail = asyncHandler(async (req, res) => {
  const token = req.params.token;

  // Hash the token
  const hashedToken = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');

  // Find user by token
  const userQuery = await db.query(
    'SELECT * FROM users WHERE email_verify_token = $1',
    [hashedToken]
  );

  const user = userQuery.rows[0];

  // CHECK 1: Is the user already verified?
  // This handles the "refresh" or "second click" issue.
  if (user && user.is_email_verified) {
    res
      .status(200)
      .json({ message: 'Account already verified. Please log in.' });
    return;
  }
  
  // CHECK 2: Is the token valid and not expired?
  if (!user || new Date(user.email_verify_expires) < new Date()) {
      res.status(400);
      throw new Error('Invalid or expired token.');
  }

  // If we get here, the token is valid, and the user is not verified.
  // Update user to be verified
  await db.query(
    `UPDATE users 
     SET is_email_verified = true, email_verify_token = NULL, email_verify_expires = NULL
     WHERE user_id = $1`,
    [user.user_id]
  );

  res
    .status(200)
    .json({ message: 'Email verified successfully! You can now log in.' });
});

// @desc    Authenticate a user
// @route   POST /api/auth/login
// @access  Public
const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Check for user
  const userQuery = await db.query('SELECT * FROM users WHERE email = $1', [
    email,
  ]);
  const user = userQuery.rows[0];

  if (!user) {
    res.status(401);
    throw new Error('Invalid credentials');
  }

  // Check if email is verified
  if (!user.is_email_verified) {
    res.status(403);
    throw new Error('Please verify your email address before logging in.');
  }

  // Check password
  const isMatch = await bcrypt.compare(password, user.password_hash);

  if (user && isMatch) {
    res.json({
      _id: user.user_id,
      username: user.username,
      email: user.email,
      role: user.role,
      is_admin: user.is_admin,
      token: generateToken(user.user_id, user.role),
      
    });
  } else {
    res.status(401);
    throw new Error('Invalid credentials');
  }
});

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
const getMe = asyncHandler(async (req, res) => {
  // req.user is set by the protect middleware
  res.status(200).json(req.user);
});

module.exports = {
  registerUser,
  loginUser,
  getMe,
  verifyEmail,
  googleAuthCallback,
};