const express = require('express');
const router = express.Router();
const {
  requestRefund,
  getMyRefundRequests,
} = require('../controllers/refundController');
const { protect, isBuyer } = require('../middleware/authMiddleware');

router.post('/request', protect, isBuyer, requestRefund);
router.get('/myrequests', protect, isBuyer, getMyRefundRequests);

module.exports = router;