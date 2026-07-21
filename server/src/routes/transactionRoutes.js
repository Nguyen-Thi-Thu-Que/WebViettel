const express = require('express');
const router = express.Router();
const transactionController = require('../controllers/transactionController');
const { authenticateToken, requireRole } = require('../middlewares/authMiddleware');

router.get('/', authenticateToken, transactionController.getTransactions);
router.post('/deposit/pending', authenticateToken, transactionController.createPendingDeposit);
router.post('/deposit/cancel', authenticateToken, transactionController.cancelDeposit);
router.delete('/', authenticateToken, transactionController.clearTransactions);
router.get('/admin/stats', authenticateToken, requireRole(['admin']), transactionController.getAdminStats);

module.exports = router;
