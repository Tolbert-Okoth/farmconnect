const express = require('express');
const router = express.Router();
const {
  getEarningsSummary,
  requestPayout,
  getPayoutHistory,
} = require('../controllers/payoutController');
const { protect, isFarmer } = require('../middleware/authMiddleware');

router.get('/summary', protect, isFarmer, getEarningsSummary);
router.post('/request', protect, isFarmer, requestPayout);
router.get('/history', protect, isFarmer, getPayoutHistory);

module.exports = router;