const express = require('express');
const router = express.Router();
const {
  getPendingPayouts,
  completePayout,
  getPendingRefunds,
  processRefund,
} = require('../controllers/adminController');
const { protect, isAdmin } = require('../middleware/authMiddleware');

// All routes are protected and admin-only
router.use(protect, isAdmin);

// Payout routes
router.get('/payouts', getPendingPayouts);
router.put('/payouts/:id/complete', completePayout);

// Refund routes
router.get('/refunds', getPendingRefunds);
router.put('/refunds/:id', processRefund);

module.exports = router;