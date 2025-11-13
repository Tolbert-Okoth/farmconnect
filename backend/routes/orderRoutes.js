const express = require('express');
const router = express.Router();
const {
  createOrder,
  getMyOrders,
  getFarmOrders,
  updateOrderStatus,
  confirmOrderLocation,
  deleteOrder,
  getOrderById, // <-- THIS WAS THE MISSING IMPORT
} = require('../controllers/orderController');
const { protect, isBuyer, isFarmer } = require('../middleware/authMiddleware');

// **FIX:** This route must be placed BEFORE other routes with ':id'
router.get('/myorders', protect, isBuyer, getMyOrders);
router.get('/farmorders', protect, isFarmer, getFarmOrders);

// This route for a single order must be below the specific text routes
router.get('/:id', protect, getOrderById);
router.post('/', protect, isBuyer, createOrder);
router.put('/:id/status', protect, isFarmer, updateOrderStatus);
router.put('/:id/location', protect, isBuyer, confirmOrderLocation);
router.delete('/:id', protect, isBuyer, deleteOrder);

module.exports = router;