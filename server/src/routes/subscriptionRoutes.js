const express = require('express');
const router = express.Router();
const subscriptionController = require('../controllers/subscriptionController');
const { authenticateToken } = require('../middlewares/authMiddleware');

router.post('/check', authenticateToken, subscriptionController.check);
router.post('/register', authenticateToken, subscriptionController.register);
router.get('/active', authenticateToken, subscriptionController.getActive);
router.get('/history', authenticateToken, subscriptionController.getHistory);
router.delete('/history', authenticateToken, subscriptionController.clearHistory);
router.post('/renew', authenticateToken, subscriptionController.renew);
router.post('/toggle-auto-renew', authenticateToken, subscriptionController.toggleAutoRenew);
router.post('/cancel', authenticateToken, subscriptionController.cancel);
router.get('/dev/virtual-time', subscriptionController.getVirtualTime);
router.post('/dev/set-virtual-time', subscriptionController.setVirtualTime);
router.post('/dev/reset-virtual-time', subscriptionController.resetVirtualTime);

module.exports = router;
