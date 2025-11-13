const asyncHandler = require('express-async-handler');
const db = require('../config/db');

// @desc    Request a refund for an order
// @route   POST /api/refunds/request
// @access  Private (Buyer)
const requestRefund = asyncHandler(async (req, res) => {
  const { order_id, reason } = req.body;
  const buyer_id = req.user.user_id;

  if (!order_id || !reason) {
    res.status(400);
    throw new Error('Order ID and reason are required');
  }

  // 1. Check if the order exists, belongs to the buyer, and is 'paid' or 'delivered'
  const orderQuery = await db.query(
    "SELECT * FROM orders WHERE order_id = $1 AND buyer_id = $2 AND (status = 'paid' OR status = 'delivered')",
    [order_id, buyer_id]
  );

  if (orderQuery.rows.length === 0) {
    res.status(404);
    throw new Error('A valid, paid-for order was not found.');
  }

  // 2. Check if a refund request already exists
  const existingRequest = await db.query(
    'SELECT * FROM refund_requests WHERE order_id = $1',
    [order_id]
  );

  if (existingRequest.rows.length > 0) {
    res.status(400);
    throw new Error('A refund request for this order already exists.');
  }

  // 3. Create the new refund request
  const newRequest = await db.query(
    'INSERT INTO refund_requests (order_id, buyer_id, reason, status) VALUES ($1, $2, $3, $4) RETURNING *',
    [order_id, buyer_id, reason, 'pending']
  );

  res.status(201).json(newRequest.rows[0]);
});

// @desc    Get all refund requests for the logged-in buyer
// @route   GET /api/refunds/myrequests
// @access  Private (Buyer)
const getMyRefundRequests = asyncHandler(async (req, res) => {
  const buyer_id = req.user.user_id;

  const requests = await db.query(
    `SELECT r.*, o.total_price, p.name AS produce_name
     FROM refund_requests r
     JOIN orders o ON r.order_id = o.order_id
     JOIN produce p ON o.produce_id = p.produce_id
     WHERE r.buyer_id = $1
     ORDER BY r.requested_at DESC`,
    [buyer_id]
  );

  res.json(requests.rows);
});

module.exports = {
  requestRefund,
  getMyRefundRequests,
};