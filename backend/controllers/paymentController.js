const asyncHandler = require('express-async-handler');
const axios = require('axios');
const db = require('../config/db');

// Helper function to get Mpesa OAuth token
const getMpesaToken = async () => {
  const consumerKey = process.env.MPESA_CONSUMER_KEY;
  const consumerSecret = process.env.MPESA_CONSUMER_SECRET;
  const auth =
    'Basic ' +
    Buffer.from(consumerKey + ':' + consumerSecret).toString('base64');

  try {
    const res = await axios.get(
      'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials', // Use live URL in prod
      {
        headers: {
          Authorization: auth,
        },
      }
    );
    return res.data.access_token;
  } catch (err) {
    console.error(
      'Mpesa Token Error:',
      err.response ? err.response.data : err.message
    );
    throw new Error('Mpesa auth failed');
  }
};

// @desc    Initiate Mpesa STK Push
// @route   POST /api/payments/stkpush
// @access  Private (Buyer)
const initiateSTKPush = asyncHandler(async (req, res) => {
  const { order_id, phone } = req.body;
  const buyer_id = req.user.user_id;

  // 1. Get the order from DB
  const orderQuery = await db.query(
    'SELECT * FROM orders WHERE order_id = $1 AND buyer_id = $2',
    [order_id, buyer_id]
  );

  if (orderQuery.rows.length === 0) {
    res.status(404);
    throw new Error('Order not found or not yours');
  }

  const order = orderQuery.rows[0];
  const amount = Math.round(order.total_price); // Mpesa requires an integer

  // 2. Format phone number (e.g., 2547XXXXXXXX)
  const formattedPhone = phone.startsWith('0')
    ? '254' + phone.substring(1)
    : phone;

  // 3. Get Mpesa token
  const token = await getMpesaToken();

  // 4. Prepare STK Push payload
  const timestamp = new Date()
    .toISOString()
    .replace(/[^0-9]/g, '')
    .slice(0, 14);
  const shortcode = process.env.MPESA_SHORTCODE;
  const passkey = process.env.MPESA_PASSKEY;
  const password = Buffer.from(shortcode + passkey + timestamp).toString(
    'base64'
  );

  const accountRef = `FarmConnect-${order_id}`;

  const payload = {
    BusinessShortCode: shortcode,
    Password: password,
    Timestamp: timestamp,
    TransactionType: 'CustomerPayBillOnline', // or 'CustomerBuyGoodsOnline'
    Amount: amount,
    PartyA: formattedPhone,
    PartyB: shortcode,
    PhoneNumber: formattedPhone,
    CallBackURL: process.env.MPESA_CALLBACK_URL,
    AccountReference: accountRef,
    TransactionDesc: 'Payment for produce',
  };

  // 5. Send STK Push request
  try {
    const stkRes = await axios.post(
      'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest', // Use live URL in prod
      payload,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    // **NEW STEP: Save the CheckoutRequestID to map the callback**
    if (stkRes.data && stkRes.data.CheckoutRequestID) {
      await db.query(
        'INSERT INTO mpesa_requests ("CheckoutRequestID", "AccountReference") VALUES ($1, $2)',
        [stkRes.data.CheckoutRequestID, accountRef]
      );
    }

    res.status(200).json(stkRes.data);
  } catch (err) {
    console.error(
      'STK Push Error:',
      err.response ? err.response.data : err.message
    );
    throw new Error('Payment initiation failed');
  }
});

// @desc    Mpesa Callback URL
// @route   POST /api/payments/callback
// @access  Public (from Mpesa)
const mpesaCallback = asyncHandler(async (req, res) => {
  console.log('--- Mpesa Callback Received ---');
  console.log(JSON.stringify(req.body, null, 2));

  // Check if req.body.Body.stkCallback exists
  if (!req.body.Body || !req.body.Body.stkCallback) {
    console.warn('Invalid callback format or test ping.');
    return res.status(200).json({ ResultCode: 1, ResultDesc: 'Accepted' }); // Acknowledge
  }

  const callbackData = req.body.Body.stkCallback;

  if (callbackData.ResultCode === 0) {
    // Payment was successful
    const metadata = callbackData.CallbackMetadata.Item;
    const mpesaReceipt = metadata.find(
      (i) => i.Name === 'MpesaReceiptNumber'
    ).Value;

    // **NEW STEP: Get Order ID from our new table**
    const accountRefQuery = await db.query(
      'SELECT "AccountReference" FROM mpesa_requests WHERE "CheckoutRequestID" = $1',
      [callbackData.CheckoutRequestID]
    );

    if (accountRefQuery.rows.length === 0) {
      console.error(
        `FATAL ERROR: CheckoutRequestID ${callbackData.CheckoutRequestID} not found. Cannot map payment.`
      );
      // We still tell Mpesa "OK" so they don't retry, but we log the error.
      return res.status(200).json({ ResultCode: 0, ResultDesc: 'Accepted' });
    }

    // Extract the order_id from "FarmConnect-order_id"
    const order_id = accountRefQuery.rows[0].AccountReference.split('-')[1];

    // **UPDATED STEP: Save the receipt in the orders table**
    await db.query(
      "UPDATE orders SET status = 'paid', mpesa_receipt = $1 WHERE order_id = $2",
      [mpesaReceipt, order_id]
    );

    console.log(
      `Payment success for Order ${order_id}, Receipt: ${mpesaReceipt}`
    );
    
    // We can now safely delete the mpesa_request
    await db.query('DELETE FROM mpesa_requests WHERE "CheckoutRequestID" = $1', [
      callbackData.CheckoutRequestID,
    ]);

  } else {
    // Payment failed
    console.warn(`Payment failed: ${callbackData.ResultDesc}`);
  }

  // Respond to Mpesa to acknowledge receipt
  res.status(200).json({ ResultCode: 0, ResultDesc: 'Accepted' });
});

module.exports = {
  initiateSTKPush,
  mpesaCallback,
};