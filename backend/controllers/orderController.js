const asyncHandler = require('express-async-handler');
const db = require('../config/db');
const { toPositiveInt } = require('../utils/validate');

// @desc    Create a new order
// @route   POST /api/orders
// @access  Private (Buyer only)
const createOrder = asyncHandler(async (req, res) => {
  const { produce_id } = req.body;
  const quantity_ordered = toPositiveInt(req.body.quantity_ordered);
  const buyer_id = req.user.user_id;

  if (!produce_id || !quantity_ordered) {
    res.status(400);
    throw new Error('Provide a produce ID and a whole-number quantity of at least 1');
  }

  const produceQuery = await db.query(
    'SELECT price, quantity, farmer_id FROM produce WHERE produce_id = $1',
    [produce_id]
  );

  if (produceQuery.rows.length === 0) {
    res.status(404);
    throw new Error('Produce not found');
  }

  const produce = produceQuery.rows[0];
  if (produce.farmer_id === buyer_id) {
    res.status(400);
    throw new Error('You cannot order your own produce');
  }
  if (produce.quantity != null && quantity_ordered > Number(produce.quantity)) {
    res.status(400);
    throw new Error(`Only ${produce.quantity} available`);
  }
  // Price always comes from the database, never from the client
  const total_price = Math.round(Number(produce.price) * quantity_ordered * 100) / 100;
  const farmer_id = produce.farmer_id;

  const newOrder = await db.query(
    `INSERT INTO orders (buyer_id, produce_id, farmer_id, quantity_ordered, total_price, status)
     VALUES ($1, $2, $3, $4, $5, 'pending')
     RETURNING *`,
    [buyer_id, produce_id, farmer_id, quantity_ordered, total_price]
  );

  res.status(201).json(newOrder.rows[0]);
});

// @desc    Get orders for the logged-in buyer
// @route   GET /api/orders/myorders
// @access  Private (Buyer only)
const getMyOrders = asyncHandler(async (req, res) => {
  const buyer_id = req.user.user_id;
  const orders = await db.query(
    `SELECT o.*, p.name AS produce_name, p.image_url, u.username AS farmer_name
     FROM orders o
     JOIN produce p ON o.produce_id = p.produce_id
     JOIN users u ON o.farmer_id = u.user_id
     WHERE o.buyer_id = $1
     ORDER BY o.created_at DESC`,
    [buyer_id]
  );
  res.json(orders.rows);
});

// @desc    Get orders for the logged-in farmer
// @route   GET /api/orders/farmorders
// @access  Private (Farmer only)
const getFarmOrders = asyncHandler(async (req, res) => {
  const farmer_id = req.user.user_id;
  const orders = await db.query(
    `SELECT o.*, p.name AS produce_name, u.username AS buyer_name, u.email AS buyer_email
     FROM orders o
     JOIN produce p ON o.produce_id = p.produce_id
     JOIN users u ON o.buyer_id = u.user_id
     WHERE o.farmer_id = $1
     ORDER BY o.created_at DESC`,
    [farmer_id]
  );
  res.json(orders.rows);
});

// @desc    Get a single order by ID
// @route   GET /api/orders/:id
// @access  Private
const getOrderById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const user_id = req.user.user_id;

  const query = `
    SELECT o.*, 
           p.name AS produce_name, p.image_url, 
           f.username AS farmer_name, f.email AS farmer_email,
           b.username AS buyer_name, b.email AS buyer_email
    FROM orders o
    JOIN produce p ON o.produce_id = p.produce_id
    JOIN users f ON o.farmer_id = f.user_id
    JOIN users b ON o.buyer_id = b.user_id
    WHERE o.order_id = $1 AND (o.buyer_id = $2 OR o.farmer_id = $2)
  `;

  const orderQuery = await db.query(query, [id, user_id]);

  if (orderQuery.rows.length === 0) {
    res.status(404);
    throw new Error('Order not found or not authorized');
  }

  res.json(orderQuery.rows[0]);
});

// @desc    Update order status: mark a paid order delivered, or cancel a pending one
// @route   PUT /api/orders/:id/status
// @access  Private (Farmer only)
// "paid" is set only by a confirmed M-Pesa callback, never by hand.
const FARMER_TRANSITIONS = { paid: ['delivered'], pending: ['cancelled'] };

const updateOrderStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const farmer_id = req.user.user_id;

  const orderQuery = await db.query(
    'SELECT * FROM orders WHERE order_id = $1 AND farmer_id = $2',
    [id, farmer_id]
  );

  if (orderQuery.rows.length === 0) {
    res.status(404);
    throw new Error('Order not found or you are not authorized');
  }

  const current = orderQuery.rows[0].status;
  if (!(FARMER_TRANSITIONS[current] || []).includes(status)) {
    res.status(400);
    throw new Error(`An order that is "${current}" cannot be changed to "${status}"`);
  }

  if (status === 'cancelled') {
    await db.query("DELETE FROM orders WHERE order_id = $1 AND status = 'pending'", [id]);
    return res.json({ message: 'Order successfully cancelled and deleted.' });
  }

  const updatedOrder = await db.query(
    'UPDATE orders SET status = $1 WHERE order_id = $2 AND status = $3 RETURNING *',
    [status, id, current]
  );
  if (updatedOrder.rows.length === 0) {
    res.status(409);
    throw new Error('Order changed in the meantime; refresh and try again');
  }
  res.json(updatedOrder.rows[0]);
});

// @desc    Confirm delivery location for an order
// @route   PUT /api/orders/:id/location
// @access  Private (Buyer only)
const confirmOrderLocation = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const address = String(req.body.address || '').trim();
  const buyer_id = req.user.user_id;

  if (!address || address.length > 300) {
    res.status(400);
    throw new Error('Enter a delivery address (up to 300 characters)');
  }

  const updatedOrder = await db.query(
    `UPDATE orders 
     SET delivery_address = $1, location_confirmed = true 
     WHERE order_id = $2 AND buyer_id = $3 AND status = 'pending'
     RETURNING *`,
    [address, id, buyer_id]
  );

  if (updatedOrder.rows.length === 0) {
    res.status(404);
    throw new Error('Pending order not found or not authorized');
  }

  res.json(updatedOrder.rows[0]);
});

// @desc    Delete a pending order (Buyer)
// @route   DELETE /api/orders/:id
// @access  Private (Buyer only)
const deleteOrder = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const buyer_id = req.user.user_id;

  const deleteResult = await db.query(
    "DELETE FROM orders WHERE order_id = $1 AND buyer_id = $2 AND status = 'pending'",
    [id, buyer_id]
  );

  if (deleteResult.rowCount === 0) {
    res.status(404);
    throw new Error(
      'Pending order not found or you are not authorized to delete it.'
    );
  }

  res.json({ message: 'Order cancelled and deleted.' });
});

module.exports = {
  createOrder,
  getMyOrders,
  getFarmOrders,
  getOrderById, // Make sure this is here
  updateOrderStatus,
  confirmOrderLocation,
  deleteOrder,
};