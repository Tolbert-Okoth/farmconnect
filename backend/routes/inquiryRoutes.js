const express = require('express');
const router = express.Router();
const {
  sendMessage,
  getConversation,
  getConversationsList,
} = require('../controllers/inquiryController.js');
const { protect } = require('../middleware/authMiddleware');

console.log('Is sendMessage a function?', typeof sendMessage);
router.route('/').post(protect, sendMessage).get(protect, getConversationsList);
router.route('/:userId').get(protect, getConversation);

module.exports = router;