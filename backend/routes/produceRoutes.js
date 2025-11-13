const express = require('express');
const router = express.Router();
const {
  getAllProduce,
  getProduceById,
  createProduce,
  updateProduce,
  deleteProduce,
} = require('../controllers/produceController');
const { protect, isFarmer } = require('../middleware/authMiddleware');
const { upload } = require('../utils/cloudinary');

// Public routes
router.get('/', getAllProduce);
router.get('/:id', getProduceById);

// Private Farmer routes
router.post(
  '/',
  protect,
  isFarmer,
  upload.single('image'), // 'image' must match the form field name
  createProduce
);

// ** THIS IS THE FIX **
// Add 'upload.single('image')' to the PUT route
router.put(
  '/:id',
  protect,
  isFarmer,
  upload.single('image'), // <-- ADD THIS
  updateProduce
);

router.delete('/:id', protect, isFarmer, deleteProduce);

module.exports = router;