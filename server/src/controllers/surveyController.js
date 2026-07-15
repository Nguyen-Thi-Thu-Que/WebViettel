const surveyService = require('../services/surveyService');
const { mapToEnglish } = require('./packageController');

module.exports = {
  getConfig: async (req, res, next) => {
    try {
      const answersStr = req.query.answers;
      let answers = null;
      if (answersStr) {
        try {
          answers = JSON.parse(answersStr);
        } catch (e) {
          // Bỏ qua lỗi phân tích JSON
        }
      }
      const config = await surveyService.getSurveyConfig(answers, req.user);
      res.status(200).json({
        success: true,
        config
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /api/survey
   * Lưu kết quả khảo sát của User và trả về gợi ý gói cước tối ưu
   */
  submitAnswers: async (req, res, next) => {
    try {
      const userId = req.user.user_id;
      const { answers } = req.body;

      if (!answers) {
        return res.status(400).json({
          success: false,
          message: 'Thiếu câu trả lời khảo sát.'
        });
      }

      // Xử lý gửi câu trả lời và chạy so khớp gói cước bằng service chung
      const result = await surveyService.submitSurveyAnswers(userId, answers);

      res.status(200).json({
        success: true,
        message: 'Khảo sát hoàn tất thành công!',
        answers: result.surveyHistory.answers,
        recommendedPackages: result.packages
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/survey/history
   * Lấy lịch sử câu trả lời và kết quả gợi ý trước đó của User
   */
  getHistory: async (req, res, next) => {
    try {
      const userId = req.user.user_id;
      const result = await surveyService.getSurveyHistory(userId);

      if (!result) {
        return res.status(200).json({
          success: true,
          hasHistory: false,
          message: 'Không tìm thấy lịch sử khảo sát của người dùng.'
        });
      }

      res.status(200).json({
        success: true,
        hasHistory: true,
        answers: result.history.answers,
        recommendedPackages: result.packages
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * DELETE /api/survey/history
   * Xóa thông tin lịch sử khảo sát hiện tại của User
   */
  deleteHistory: async (req, res, next) => {
    try {
      const userId = req.user.user_id;
      const success = await surveyService.deleteSurveyHistory(userId);

      if (!success) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy lịch sử khảo sát nào để xóa.'
        });
      }

      res.status(200).json({
        success: true,
        message: 'Xóa lịch sử khảo sát thành công!'
      });
    } catch (error) {
      next(error);
    }
  }
};
