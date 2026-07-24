const express = require('express');
const router = express.Router();
const contactController = require('../controllers/contactController');
const { authenticateToken, requireRole, decodeTokenOptional } = require('../middlewares/authMiddleware');

// Public routes / member routes
router.post('/', decodeTokenOptional, contactController.createContact);
router.get('/my-requests', authenticateToken, contactController.getMyRequests);
router.get('/lookup', contactController.lookupContacts);

// Admin-only routes
router.get('/', authenticateToken, requireRole(['admin']), contactController.getAdminContacts);
router.patch('/:id/reply', authenticateToken, requireRole(['admin']), contactController.updateContactReply);
router.delete('/:id', authenticateToken, requireRole(['admin']), contactController.deleteContact);

module.exports = router;
