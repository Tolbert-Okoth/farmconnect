const asyncHandler = require('express-async-handler');
const db = require('../config/db');
const { cloudinary } = require('../utils/cloudinary');

// @desc    Get all produce listings
// @route   GET /api/produce
// @access  Public
const getAllProduce = asyncHandler(async (req, res) => {
  const { search } = req.query;
  let query = `
    SELECT p.*, u.username AS farmer_name 
    FROM produce p
    JOIN users u ON p.farmer_id = u.user_id
  `;
  const queryParams = [];

  if (search) {
    query += ' WHERE p.name ILIKE $1 OR p.description ILIKE $1';
    queryParams.push(`%${search}%`);
  }

  query += ' ORDER BY p.created_at DESC';

  const produceList = await db.query(query, queryParams);
  res.json(produceList.rows);
});

// @desc    Get single produce by ID
// @route   GET /api/produce/:id
// @access  Public
const getProduceById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const produce = await db.query(
    `SELECT p.*, u.username AS farmer_name, u.email AS farmer_email, u.user_id AS farmer_id
     FROM produce p
     JOIN users u ON p.farmer_id = u.user_id
     WHERE p.produce_id = $1`,
    [id]
  );

  if (produce.rows.length === 0) {
    res.status(404);
    throw new Error('Produce not found');
  }
  res.json(produce.rows[0]);
});

// @desc    Create new produce listing
// @route   POST /api/produce
// @access  Private (Farmer only)
const createProduce = asyncHandler(async (req, res) => {
  const { name, description, price, quantity } = req.body;
  const farmer_id = req.user.user_id;

  if (!req.file) {
    res.status(400);
    throw new Error('Please upload an image');
  }

  const { path: image_url, filename: image_public_id } = req.file;

  if (!name || !price || !quantity) {
    res.status(400);
    throw new Error('Please provide name, price, and quantity');
  }

  const newProduce = await db.query(
    `INSERT INTO produce (farmer_id, name, description, price, quantity, image_url, image_public_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [farmer_id, name, description, price, quantity, image_url, image_public_id]
  );

  res.status(201).json(newProduce.rows[0]);
});

// @desc    Update a produce listing
// @route   PUT /api/produce/:id
// @access  Private (Farmer only)
const updateProduce = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, description, price, quantity } = req.body;

  // 1. Find the existing produce
  const produceQuery = await db.query(
    'SELECT * FROM produce WHERE produce_id = $1',
    [id]
  );

  if (produceQuery.rows.length === 0) {
    res.status(404);
    throw new Error('Produce not found');
  }

  const produce = produceQuery.rows[0];

  // 2. Check if user is the owner
  if (produce.farmer_id !== req.user.user_id) {
    res.status(403);
    throw new Error('User not authorized to update this listing');
  }

  // 3. Prepare new data
  const fields = {
    name: name || produce.name,
    description: description || produce.description,
    price: price || produce.price,
    quantity: quantity || produce.quantity,
    image_url: produce.image_url, // Default to old image
    image_public_id: produce.image_public_id, // Default to old image
  };

  // 4. Check if a new image was uploaded
  if (req.file) {
    try {
      // A new file was uploaded. Delete the old one from Cloudinary
      if (produce.image_public_id) {
        await cloudinary.uploader.destroy(produce.image_public_id);
      }
    } catch (err) {
      console.error('Cloudinary delete error:', err);
      // Don't stop the update, just log the error
    }

    // Update fields with new image info
    fields.image_url = req.file.path;
    fields.image_public_id = req.file.filename;
  }

  // 5. Update the database
  const updatedProduce = await db.query(
    `UPDATE produce 
     SET name = $1, description = $2, price = $3, quantity = $4, image_url = $5, image_public_id = $6
     WHERE produce_id = $7
     RETURNING *`,
    [
      fields.name,
      fields.description,
      fields.price,
      fields.quantity,
      fields.image_url,
      fields.image_public_id,
      id,
    ]
  );

  res.json(updatedProduce.rows[0]);
});

// @desc    Delete a produce listing
// @route   DELETE /api/produce/:id
// @access  Private (Farmer only)
const deleteProduce = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const produce = await db.query(
    'SELECT * FROM produce WHERE produce_id = $1',
    [id]
  );

  if (produce.rows.length === 0) {
    res.status(404);
    throw new Error('Produce not found');
  }

  // Check if user is the owner
  if (produce.rows[0].farmer_id !== req.user.user_id) {
    res.status(403);
    throw new Error('User not authorized to delete this listing');
  }

  // Delete image from Cloudinary
  try {
    await cloudinary.uploader.destroy(produce.rows[0].image_public_id);
  } catch (err) {
    console.error('Cloudinary delete error:', err);
    // Don't stop the process, just log the error
  }

  // Delete from DB
  await db.query('DELETE FROM produce WHERE produce_id = $1', [id]);

  res.json({ message: 'Produce listing removed' });
});

// This module.exports block is now correct
module.exports = {
  getAllProduce,
  getProduceById,
  createProduce,
  updateProduce,
  deleteProduce,
};