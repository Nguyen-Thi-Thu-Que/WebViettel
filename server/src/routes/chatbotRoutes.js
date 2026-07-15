const express = require('express');
const router = express.Router();
const chatbotController = require('../controllers/chatbotController');
const chatHistoryController = require('../controllers/chatHistoryController');
const { authenticateToken, requireRole, decodeTokenOptional } = require('../middlewares/authMiddleware');
const ChatHistory = require('../models/ChatHistory');
const chatbotService = require('../services/chatbotService');

// Intercept chatbot message to save chat history if user is logged in
router.post('/message', decodeTokenOptional, async (req, res, next) => {
  try {
    const { message } = req.body;
    if (!message) {
      return res.status(400).json({
        success: false,
        message: 'Nội dung tin nhắn không được để trống.'
      });
    }

    // 1. If user is logged in, save the user's message
    if (req.user) {
      await ChatHistory.create({
        userId: req.user._id,
        sender: 'user',
        text: message
      });
    }

    // 2. Call the service to process the message (RAG Flow, Intent, LLM)
    const reply = await chatbotService.processMessage(message);

    // 3. If user is logged in, save the AI's reply message
    if (req.user) {
      await ChatHistory.create({
        userId: req.user._id,
        sender: 'bot',
        text: reply.text,
        suggestedAction: reply.suggestedAction || null,
        packages: reply.packages || []
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Xử lý tin nhắn thành công.',
      data: reply
    });
  } catch (error) {
    next(error);
  }
});

// Chat History API Endpoints
router.get('/history', authenticateToken, chatHistoryController.getHistory);
router.delete('/history', authenticateToken, chatHistoryController.deleteHistory);

router.get('/config', authenticateToken, requireRole(['admin']), chatbotController.getConfig);
router.put('/config', authenticateToken, requireRole(['admin']), chatbotController.updateConfig);

module.exports = router;
