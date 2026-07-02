const express = require('express');
const router = express.Router();
const transactionController = require('../controllers/transactionController');
const { authenticateToken, requireRole } = require('../middlewares/authMiddleware');

router.get('/', authenticateToken, transactionController.getTransactions);
router.get('/admin/stats', authenticateToken, requireRole(['admin']), transactionController.getAdminStats);

module.exports = router;
