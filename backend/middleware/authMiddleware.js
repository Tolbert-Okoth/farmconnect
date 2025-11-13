const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');
const db = require('../config/db');

const protect = asyncHandler(async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      //
      // ** THIS IS THE FIX **
      // We must select 'is_admin' from the database here.
      //
      const userQuery = await db.query(
        'SELECT user_id, username, email, role, is_admin FROM users WHERE user_id = $1',
        [decoded.id]
      );

      if (userQuery.rows.length === 0) {
        res.status(401);
        throw new Error('Not authorized, user not found');
      }

      // Attach user to the request object
      req.user = userQuery.rows[0];
      next();
    } catch (error) {
      console.error(error);
      res.status(401);
      throw new Error('Not authorized, token failed');
    }
  }

  if (!token) {
    res.status(401);
    throw new Error('Not authorized, no token');
  }
});

const isFarmer = (req, res, next) => {
  if (req.user && req.user.role === 'farmer') {
    next();
  } else {
    res.status(403);
    throw new Error('Not authorized as a farmer');
  }
};

const isBuyer = (req, res, next) => {
  if (req.user && req.user.role === 'buyer') {
    next();
  } else {
    res.status(403);
    throw new Error('Not authorized as a buyer');
  }
};

// This function checks the 'req.user' object created by 'protect'
const isAdmin = (req, res, next) => {
  if (req.user && req.user.is_admin) {
    next();
  } else {
    res.status(403);
    throw new Error('Not authorized as an admin');
  }
};

module.exports = { protect, isFarmer, isBuyer, isAdmin };