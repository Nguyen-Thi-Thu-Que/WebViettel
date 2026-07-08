const subscriptionService = require('../services/subscriptionService');

module.exports = {
  register: async (req, res, next) => {
    try {
      const userId = req.user.user_id;
      const { packageId, cycle } = req.body;

      if (packageId === undefined || packageId === null || packageId === '') {
        return res.status(400).json({ success: false, message: 'Thiếu thông tin gói cước.' });
      }

      const subscription = await subscriptionService.registerSubscription(userId, packageId, cycle);

      res.status(200).json({
        success: true,
        message: 'Đăng ký gói cước thành công!',
        data: subscription
      });
    } catch (err) {
      res.status(400).json({ success: false, message: err.message });
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
