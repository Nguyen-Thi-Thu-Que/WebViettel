const express = require('express');
const router = express.Router();
const contactController = require('../controllers/contactController');
const { authenticateToken, requireRole, decodeTokenOptional } = require('../middlewares/authMiddleware');

// Public route for contact creation with optional decoding
router.post('/', decodeTokenOptional, contactController.createContact);

// Admin-only routes
router.get('/', authenticateToken, requireRole(['admin']), contactController.getContacts);
router.get('/:id', authenticateToken, requireRole(['admin']), contactController.getContactById);
router.patch('/:id/status', authenticateToken, requireRole(['admin']), contactController.updateContactStatus);
router.patch('/:id/note', authenticateToken, requireRole(['admin']), contactController.updateContactNote);

module.exports = router;
