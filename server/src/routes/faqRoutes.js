const express = require('express');
const router = express.Router();
const faqController = require('../controllers/faqController');
const { authenticateToken, requireRole } = require('../middlewares/authMiddleware');

router.get('/', faqController.getFAQs);
router.post('/', authenticateToken, requireRole(['admin']), faqController.createFAQ);
router.put('/:id', authenticateToken, requireRole(['admin']), faqController.updateFAQ);
router.delete('/:id', authenticateToken, requireRole(['admin']), faqController.deleteFAQ);

module.exports = router;
