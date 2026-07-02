const express = require('express');
const router = express.Router();
const chatbotController = require('../controllers/chatbotController');
const { authenticateToken, requireRole } = require('../middlewares/authMiddleware');

router.post('/message', chatbotController.processMessage);
router.get('/config', authenticateToken, requireRole(['admin']), chatbotController.getConfig);
router.put('/config', authenticateToken, requireRole(['admin']), chatbotController.updateConfig);

module.exports = router;
