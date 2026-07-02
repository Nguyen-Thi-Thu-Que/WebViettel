const chatbotService = require('../services/chatbotService');

const chatbotController = {
  getConfig: async (req, res, next) => {
    try {
      const config = await chatbotService.getConfig();
      return res.status(200).json({
        success: true,
        message: 'Lấy cấu hình Chatbot thành công.',
        data: config
      });
    } catch (error) {
      next(error);
    }
  },

  updateConfig: async (req, res, next) => {
    try {
      const { systemPrompt, trainingKeywords } = req.body;
      if (!systemPrompt) {
        return res.status(400).json({
          success: false,
          message: 'System prompt không được để trống.'
        });
      }

      const updated = await chatbotService.updateConfig(req.body);
      return res.status(200).json({
        success: true,
        message: 'Cập nhật cấu hình AI Chatbot thành công!',
        data: updated
      });
    } catch (error) {
      next(error);
    }
  },

  processMessage: async (req, res, next) => {
    try {
      const { message } = req.body;
      if (!message) {
        return res.status(400).json({
          success: false,
          message: 'Nội dung tin nhắn không được để trống.'
        });
      }

      const reply = await chatbotService.processMessage(message);
      return res.status(200).json({
        success: true,
        message: 'Xử lý tin nhắn thành công.',
        data: reply
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = chatbotController;
