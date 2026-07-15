const express = require('express');
const router = express.Router();
const surveyController = require('../controllers/surveyController');
const { authenticateToken, decodeTokenOptional } = require('../middlewares/authMiddleware');

// GET /api/survey/config (Công khai - lấy danh sách câu hỏi, có nhận diện user)
router.get('/config', decodeTokenOptional, surveyController.getConfig);

// Các endpoint yêu cầu đăng nhập
router.post('/', authenticateToken, surveyController.submitAnswers);
router.get('/history', authenticateToken, surveyController.getHistory);
router.delete('/history', authenticateToken, surveyController.deleteHistory);

module.exports = router;
