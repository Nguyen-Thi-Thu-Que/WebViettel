const faqService = require('../services/faqService');

const faqController = {
  getFAQs: async (req, res, next) => {
    try {
      const faqs = await faqService.getAllFAQs();
      return res.status(200).json({
        success: true,
        message: 'Lấy danh sách câu hỏi FAQ thành công.',
        data: faqs
      });
    } catch (error) {
      next(error);
    }
  },

  createFAQ: async (req, res, next) => {
    try {
      const { question, answer, category } = req.body;
      if (!question || !answer) {
        return res.status(400).json({
          success: false,
          message: 'Nội dung câu hỏi và câu trả lời không được để trống.'
        });
      }

      const faq = await faqService.createFAQ(req.body);
      return res.status(201).json({
        success: true,
        message: 'Tạo câu hỏi thường gặp FAQ thành công!',
        data: faq
      });
    } catch (error) {
      next(error);
    }
  },

  updateFAQ: async (req, res, next) => {
    try {
      const { id } = req.params;
      const { question, answer, category } = req.body;

      if (!question || !answer) {
        return res.status(400).json({
          success: false,
          message: 'Câu hỏi và câu trả lời là bắt buộc.'
        });
      }

      const faq = await faqService.updateFAQ(id, req.body);
      return res.status(200).json({
        success: true,
        message: 'Cập nhật FAQ thành công!',
        data: faq
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  },

  deleteFAQ: async (req, res, next) => {
    try {
      const { id } = req.params;
      await faqService.deleteFAQ(id);
      return res.status(200).json({
        success: true,
        message: 'Xóa câu hỏi FAQ thành công!'
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }
};

module.exports = faqController;
