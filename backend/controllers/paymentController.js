const asyncHandler = require('express-async-handler');
const axios = require('axios');
const crypto = require('crypto');
const db = require('../config/db');
const { toKenyanMsisdn } = require('../utils/validate');

// Sandbox by default. Set MPESA_BASE_URL=https://api.safaricom.co.ke for production.
const MPESA_BASE_URL = (process.env.MPESA_BASE_URL || 'https://sandbox.safaricom.co.ke').replace(/\/+$/, '');

const getMpesaToken = async () => {
  const auth =
    'Basic ' +
    Buffer.from(`${process.env.MPESA_CONSUMER_KEY}:${process.env.MPESA_CONSUMER_SECRET}`).toString('base64');
  try {
    const res = await axios.get(`${MPESA_BASE_URL}/oauth/v1/generate?grant_type=client_credentials`, {
      headers: { Authorization: auth },
      timeout: 15000,
    });
    return res.data.access_token;
  } catch (err) {
    console.error('M-Pesa token error:', err.response ? err.response.status : err.message);
    throw new Error('M-Pesa auth failed');
  }
};

const stkPassword = (timestamp) =>
  Buffer.from(process.env.MPESA_SHORTCODE + process.env.MPESA_PASSKEY + timestamp).toString('base64');

const mpesaTimestamp = () => new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14);

// Ask Safaricom directly whether an STK request succeeded. The callback body alone
// can't be trusted: anyone who knows the callback URL could post a fake "success".
const confirmWithSafaricom = async (checkoutRequestId) => {
  const token = await getMpesaToken();
  const timestamp = mpesaTimestamp();
  const res = await axios.post(
    `${MPESA_BASE_URL}/mpesa/stkpushquery/v1/query`,
    {
      BusinessShortCode: process.env.MPESA_SHORTCODE,
      Password: stkPassword(timestamp),
      Timestamp: timestamp,
      CheckoutRequestID: checkoutRequestId,
    },
    { headers: { Authorization: `Bearer ${token}` }, timeout: 15000 }
  );
  return String(res.data.ResultCode) === '0';
};

const callbackTokenValid = (provided) => {
  const expected = process.env.MPESA_CALLBACK_SECRET;
  if (!expected) return true; // not configured (local development)
  if (typeof provided !== 'string') return false;
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
};

// @desc    Initiate M-Pesa STK Push
// @route   POST /api/payments/stkpush
// @access  Private (Buyer)
const initiateSTKPush = asyncHandler(async (req, res) => {
  const { order_id, phone } = req.body;
  const buyer_id = req.user.user_id;

  const formattedPhone = toKenyanMsisdn(phone);
  if (!formattedPhone) {
    res.status(400);
    throw new Error('Enter a valid Safaricom number, e.g. 0712345678');
  }

  // Only pending orders with a confirmed delivery address can be paid
  const orderQuery = await db.query(
    "SELECT * FROM orders WHERE order_id = $1 AND buyer_id = $2 AND status = 'pending'",
    [order_id, buyer_id]
  );
  if (orderQuery.rows.length === 0) {
    res.status(404);
    throw new Error('Pending order not found');
  }
  const order = orderQuery.rows[0];
  if (!order.location_confirmed) {
    res.status(400);
    throw new Error('Confirm your delivery address before paying');
  }

  const amount = Math.round(Number(order.total_price)); // M-Pesa requires whole shillings
  if (!Number.isFinite(amount) || amount < 1) {
    res.status(400);
    throw new Error('Invalid order amount');
  }

  const token = await getMpesaToken();
  const timestamp = mpesaTimestamp();
  const accountRef = `FarmConnect-${order_id}`;

  try {
    const stkRes = await axios.post(
      `${MPESA_BASE_URL}/mpesa/stkpush/v1/processrequest`,
      {
        BusinessShortCode: process.env.MPESA_SHORTCODE,
        Password: stkPassword(timestamp),
        Timestamp: timestamp,
        TransactionType: 'CustomerPayBillOnline',
        Amount: amount,
        PartyA: formattedPhone,
        PartyB: process.env.MPESA_SHORTCODE,
        PhoneNumber: formattedPhone,
        CallBackURL: process.env.MPESA_CALLBACK_URL,
        AccountReference: accountRef,
        TransactionDesc: 'Payment for produce',
      },
      { headers: { Authorization: `Bearer ${token}` }, timeout: 20000 }
    );

    if (stkRes.data && stkRes.data.CheckoutRequestID) {
      await db.query(
        'INSERT INTO mpesa_requests ("CheckoutRequestID", "AccountReference") VALUES ($1, $2)',
        [stkRes.data.CheckoutRequestID, accountRef]
      );
    }

    res.status(200).json({
      message: stkRes.data.CustomerMessage || 'Check your phone to complete payment',
      ResponseCode: stkRes.data.ResponseCode,
    });
  } catch (err) {
    console.error('STK push error:', err.response ? err.response.status : err.message);
    throw new Error('Payment initiation failed');
  }
});

// @desc    M-Pesa callback
// @route   POST /api/payments/callback?token=<MPESA_CALLBACK_SECRET>
// @access  Public (called by Safaricom)
const mpesaCallback = asyncHandler(async (req, res) => {
  const ack = () => res.status(200).json({ ResultCode: 0, ResultDesc: 'Accepted' });

  if (!callbackTokenValid(req.query.token)) {
    console.warn('M-Pesa callback rejected: bad token');
    return res.status(403).json({ ResultCode: 1, ResultDesc: 'Rejected' });
  }

  const callbackData = req.body && req.body.Body && req.body.Body.stkCallback;
  if (!callbackData || !callbackData.CheckoutRequestID) return ack();

  const { CheckoutRequestID: checkoutId, ResultCode: resultCode } = callbackData;
  if (Number(resultCode) !== 0) {
    console.info(`M-Pesa payment not completed (${checkoutId}): ${callbackData.ResultDesc}`);
    return ack();
  }

  const refQuery = await db.query(
    'SELECT "AccountReference" FROM mpesa_requests WHERE "CheckoutRequestID" = $1',
    [checkoutId]
  );
  if (refQuery.rows.length === 0) {
    console.error(`M-Pesa callback for unknown CheckoutRequestID ${checkoutId}`);
    return ack();
  }

  let confirmed = false;
  try {
    confirmed = await confirmWithSafaricom(checkoutId);
  } catch (err) {
    console.error('STK query failed:', err.response ? err.response.status : err.message);
  }
  if (!confirmed) {
    console.warn(`M-Pesa callback for ${checkoutId} not confirmed by Safaricom; order left unpaid`);
    return ack();
  }

  const items = (callbackData.CallbackMetadata && callbackData.CallbackMetadata.Item) || [];
  const receiptItem = items.find((i) => i.Name === 'MpesaReceiptNumber');
  const receipt = receiptItem ? String(receiptItem.Value) : null;
  const order_id = refQuery.rows[0].AccountReference.split('-')[1];

  // Only a pending order can become paid; repeated callbacks are harmless.
  await db.query(
    "UPDATE orders SET status = 'paid', mpesa_receipt = $1 WHERE order_id = $2 AND status = 'pending'",
    [receipt, order_id]
  );
  await db.query('DELETE FROM mpesa_requests WHERE "CheckoutRequestID" = $1', [checkoutId]);
  console.info(`Payment confirmed for order ${order_id}`);

  ack();
});

module.exports = { initiateSTKPush, mpesaCallback };
