const asyncHandler = require('express-async-handler');
const db = require('../config/db');

// @desc    Get farmer's earnings summary
// @route   GET /api/payouts/summary
// @access  Private (Farmer)
const getEarningsSummary = asyncHandler(async (req, res) => {
  const farmer_id = req.user.user_id;
  
  // 1. Calculate total value of completed orders
  const completedOrders = await db.query(
    "SELECT SUM(total_price) AS total FROM orders WHERE farmer_id = $1 AND status = 'delivered'",
    [farmer_id]
  );
  const totalEarned = parseFloat(completedOrders.rows[0].total) || 0;

  // 2. Calculate total payouts already completed
  const totalPaidOut = await db.query(
    "SELECT SUM(amount) AS total FROM payouts WHERE farmer_id = $1 AND status = 'completed'",
    [farmer_id]
  );
  const totalWithdrawn = parseFloat(totalPaidOut.rows[0].total) || 0;
  
  // 3. Calculate pending payouts
  const pendingPayouts = await db.query(
    "SELECT SUM(amount) AS total FROM payouts WHERE farmer_id = $1 AND status = 'pending'",
    [farmer_id]
  );
  const pendingWithdrawal = parseFloat(pendingPayouts.rows[0].total) || 0;

  // 4. Calculate available balance (This assumes a 10% platform fee)
  const platformFee = 0.10;
  const netEarned = totalEarned * (1 - platformFee);
  const availableBalance = netEarned - totalWithdrawn - pendingWithdrawal;

  res.json({
    totalEarned: totalEarned.toFixed(2),
    netEarned: netEarned.toFixed(2),
    totalWithdrawn: totalWithdrawn.toFixed(2),
    pendingWithdrawal: pendingWithdrawal.toFixed(2),
    availableBalance: availableBalance.toFixed(2),
  });
});

// @desc    Request a new payout
// @route   POST /api/payouts/request
// @access  Private (Farmer)
const requestPayout = asyncHandler(async (req, res) => {
  const { amount, phone } = req.body;
  const farmer_id = req.user.user_id;

  // 1. Update/save the farmer's phone number
  await db.query('UPDATE users SET phone_number = $1 WHERE user_id = $2', [phone, farmer_id]);

  // 2. Get their available balance
  // (We're re-running the logic from getEarningsSummary - this should be a separate service in a real app)
  const completedOrders = await db.query("SELECT SUM(total_price) AS total FROM orders WHERE farmer_id = $1 AND status = 'delivered'", [farmer_id]);
  const totalEarned = parseFloat(completedOrders.rows[0].total) || 0;
  const totalPaidOut = await db.query("SELECT SUM(amount) AS total FROM payouts WHERE farmer_id = $1 AND (status = 'completed' OR status = 'pending')", [farmer_id]);
  const totalWithdrawn = parseFloat(totalPaidOut.rows[0].total) || 0;
  
  const netEarned = totalEarned * (1 - 0.10); // 10% fee
  const availableBalance = netEarned - totalWithdrawn;

  if (amount <= 0) {
    res.status(400);
    throw new Error('Invalid payout amount');
  }
  
  if (amount > availableBalance) {
    res.status(400);
    throw new Error('Insufficient funds. Your available balance is ' + availableBalance.toFixed(2));
  }
  
  // 3. Create the payout request
  const newPayout = await db.query(
    'INSERT INTO payouts (farmer_id, amount) VALUES ($1, $2) RETURNING *',
    [farmer_id, amount]
  );
  
  res.status(201).json(newPayout.rows[0]);
});

// @desc    Get farmer's payout history
// @route   GET /api/payouts/history
// @access  Private (Farmer)
const getPayoutHistory = asyncHandler(async (req, res) => {
    const farmer_id = req.user.user_id;
    const history = await db.query(
        'SELECT * FROM payouts WHERE farmer_id = $1 ORDER BY requested_at DESC',
        [farmer_id]
    );
    res.json(history.rows);
});

module.exports = { getEarningsSummary, requestPayout, getPayoutHistory };