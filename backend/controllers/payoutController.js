const asyncHandler = require('express-async-handler');
const db = require('../config/db');
const { toPositiveAmount, toKenyanMsisdn } = require('../utils/validate');

const PLATFORM_FEE = 0.10; // 10% platform fee on delivered orders

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
  const netEarned = totalEarned * (1 - PLATFORM_FEE);
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
  const farmer_id = req.user.user_id;
  const amount = toPositiveAmount(req.body.amount);
  const phone = toKenyanMsisdn(req.body.phone);

  if (!amount) {
    res.status(400);
    throw new Error('Invalid payout amount');
  }
  if (!phone) {
    res.status(400);
    throw new Error('Enter a valid Safaricom number, e.g. 0712345678');
  }

  // One transaction with a per-farmer lock, so two quick requests can't both
  // pass the balance check and withdraw the same money twice.
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    await client.query('SELECT pg_advisory_xact_lock($1)', [farmer_id]);
    await client.query('UPDATE users SET phone_number = $1 WHERE user_id = $2', [phone, farmer_id]);

    const earned = await client.query(
      "SELECT COALESCE(SUM(total_price), 0) AS total FROM orders WHERE farmer_id = $1 AND status = 'delivered'",
      [farmer_id]
    );
    const withdrawn = await client.query(
      "SELECT COALESCE(SUM(amount), 0) AS total FROM payouts WHERE farmer_id = $1 AND status IN ('completed', 'pending')",
      [farmer_id]
    );
    const availableBalance = Number(earned.rows[0].total) * (1 - PLATFORM_FEE) - Number(withdrawn.rows[0].total);

    if (amount > availableBalance + 1e-9) {
      await client.query('ROLLBACK');
      res.status(400);
      throw new Error('Insufficient funds. Your available balance is ' + availableBalance.toFixed(2));
    }

    const newPayout = await client.query(
      'INSERT INTO payouts (farmer_id, amount) VALUES ($1, $2) RETURNING *',
      [farmer_id, amount]
    );
    await client.query('COMMIT');
    res.status(201).json(newPayout.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    throw err;
  } finally {
    client.release();
  }
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