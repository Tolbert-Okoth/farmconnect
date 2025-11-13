const express = require('express');
const router = express.Router();
const {
  initiateSTKPush,
  mpesaCallback,
} = require('../controllers/paymentController');
const { protect, isBuyer } = require('../middleware/authMiddleware');

// Buyer initiates payment
router.post('/stkpush', protect, isBuyer, initiateSTKPush);

// Mpesa sends callback here (must be a public POST route)
router.post('/callback', mpesaCallback);

module.exports = router;