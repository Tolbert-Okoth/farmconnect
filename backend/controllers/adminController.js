const asyncHandler = require('express-async-handler');
const db = require('../config/db');

// @desc    Get all pending payout requests
// @route   GET /api/admin/payouts
// @access  Private (Admin)
const getPendingPayouts = asyncHandler(async (req, res) => {
  const data = await db.query(
    `SELECT p.*, u.username AS farmer_name, u.phone_number
     FROM payouts p
     JOIN users u ON p.farmer_id = u.user_id
     WHERE p.status = 'pending'
     ORDER BY p.requested_at ASC`
  );
  res.json(data.rows);
});

// @desc    Mark a payout as completed
// @route   PUT /api/admin/payouts/:id/complete
// @access  Private (Admin)
const completePayout = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const data = await db.query(
    "UPDATE payouts SET status = 'completed', completed_at = NOW() WHERE payout_id = $1 AND status = 'pending' RETURNING *",
    [id]
  );
  if (data.rows.length === 0) {
    res.status(404);
    throw new Error('Pending payout not found');
  }
  res.json(data.rows[0]);
});

// @desc    Get all pending refund requests
// @route   GET /api/admin/refunds
// @access  Private (Admin)
const getPendingRefunds = asyncHandler(async (req, res) => {
  const data = await db.query(
    `SELECT r.*, o.total_price, o.mpesa_receipt, p.name AS produce_name, u.username AS buyer_name
     FROM refund_requests r
     JOIN orders o ON r.order_id = o.order_id
     JOIN produce p ON o.produce_id = p.produce_id
     JOIN users u ON r.buyer_id = u.user_id
     WHERE r.status = 'pending'
     ORDER BY r.requested_at ASC`
  );
  res.json(data.rows);
});

// @desc    Approve or reject a refund request
// @route   PUT /api/admin/refunds/:id
// @access  Private (Admin)
const processRefund = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body; // 'approved' or 'rejected'

  if (status !== 'approved' && status !== 'rejected') {
    res.status(400);
    throw new Error('Invalid status');
  }

  const data = await db.query(
    "UPDATE refund_requests SET status = $1, processed_at = NOW() WHERE request_id = $2 AND status = 'pending' RETURNING *",
    [status, id]
  );

  if (data.rows.length === 0) {
    res.status(404);
    throw new Error('Pending refund request not found');
  }
  
  // In a real app, if 'approved', you would also trigger the Mpesa Reversal API here.
  // For now, we just update the status.

  res.json(data.rows[0]);
});

module.exports = {
  getPendingPayouts,
  completePayout,
  getPendingRefunds,
  processRefund,
};