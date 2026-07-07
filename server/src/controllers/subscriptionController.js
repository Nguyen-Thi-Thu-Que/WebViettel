const subscriptionService = require('../services/subscriptionService');

module.exports = {
  register: async (req, res, next) => {
    try {
      res.status(501).json({ message: 'Chức năng đăng ký gói chưa được triển khai.' });
    } catch (err) {
      next(err);
    }
  },

  getActive: async (req, res, next) => {
    try {
      res.status(501).json({ message: 'Chức năng lấy danh sách gói đang sử dụng chưa được triển khai.' });
    } catch (err) {
      next(err);
    }
  },

  getHistory: async (req, res, next) => {
    try {
      res.status(501).json({ message: 'Chức năng lấy lịch sử gói chưa được triển khai.' });
    } catch (err) {
      next(err);
    }
  },

  renew: async (req, res, next) => {
    try {
      res.status(501).json({ message: 'Chức năng gia hạn gói chưa được triển khai.' });
    } catch (err) {
      next(err);
    }
  },

  toggleAutoRenew: async (req, res, next) => {
    try {
      res.status(501).json({ message: 'Chức năng bật/tắt tự động gia hạn chưa được triển khai.' });
    } catch (err) {
      next(err);
    }
  },

  cancel: async (req, res, next) => {
    try {
      res.status(501).json({ message: 'Chức năng hủy gói chưa được triển khai.' });
    } catch (err) {
      next(err);
    }
  }
};
