const asyncHandler = require('express-async-handler');
const db = require('../config/db');

// @desc    Send a message
// @route   POST /api/inquiries
// @access  Private
const sendMessage = asyncHandler(async (req, res) => {
  const { receiver_id, content } = req.body;
  const sender_id = req.user.user_id;

  if (!receiver_id || !content) {
    res.status(400);
    throw new Error('Receiver ID and content are required');
  }

  if (receiver_id === sender_id) {
    res.status(400);
    throw new Error('Cannot send message to yourself');
  }

  const newMessage = await db.query(
    'INSERT INTO messages (sender_id, receiver_id, content) VALUES ($1, $2, $3) RETURNING *',
    [sender_id, receiver_id, content]
  );

  res.status(201).json(newMessage.rows[0]);
});

// @desc    Get conversation with another user
// @route   GET /api/inquiries/:userId
// @access  Private
const getConversation = asyncHandler(async (req, res) => {
  const other_user_id = req.params.userId;
  const my_user_id = req.user.user_id;

  const messages = await db.query(
    `SELECT m.*, s.username AS sender_name, r.username AS receiver_name
     FROM messages m
     JOIN users s ON m.sender_id = s.user_id
     JOIN users r ON m.receiver_id = r.user_id
     WHERE (m.sender_id = $1 AND m.receiver_id = $2)
        OR (m.sender_id = $2 AND m.receiver_id = $1)
     ORDER BY m.created_at ASC`,
    [my_user_id, other_user_id]
  );

  res.json(messages.rows);
});

// @desc    Get list of conversations
// @route   GET /api/inquiries
// @access  Private
const getConversationsList = asyncHandler(async (req, res) => {
  const my_user_id = req.user.user_id;

  // This query gets the latest message from each conversation partner
  const conversations = await db.query(
    `SELECT DISTINCT ON (partner_id) 
        CASE
            WHEN sender_id = $1 THEN receiver_id
            ELSE sender_id
        END AS partner_id,
        u.username AS partner_username,
        m.content AS last_message,
        m.created_at
    FROM messages m
    JOIN users u ON u.user_id = (CASE WHEN sender_id = $1 THEN receiver_id ELSE sender_id END)
    WHERE m.sender_id = $1 OR m.receiver_id = $1
    ORDER BY partner_id, m.created_at DESC`,
    [my_user_id]
  );

  res.json(conversations.rows);
});

// This is the line that was likely causing the error.
// Make sure it is 'module.exports' (with an 's').
module.exports = {
  sendMessage,
  getConversation,
  getConversationsList,
};