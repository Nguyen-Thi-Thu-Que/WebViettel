const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticateToken, requireRole } = require('../middlewares/authMiddleware');

router.get('/', authenticateToken, requireRole(['admin']), userController.getUsers);
router.put('/:id/balance', authenticateToken, requireRole(['admin']), userController.updateUserBalance);

module.exports = router;
