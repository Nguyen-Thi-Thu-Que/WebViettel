const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const transactionController = require('../controllers/transactionController');
const { authenticateToken } = require('../middlewares/authMiddleware');

router.post('/login', authController.login);
router.post('/register', authController.register);
router.get('/me', authenticateToken, authController.getMe);
router.put('/profile', authenticateToken, authController.updateProfile);
router.put('/change-password', authenticateToken, authController.changePassword);
router.post('/deposit', authenticateToken, transactionController.deposit);
router.post('/subscribe', authenticateToken, transactionController.subscribePackage);
router.delete('/unsubscribe/:packageId', authenticateToken, transactionController.unsubscribePackage);

module.exports = router;
