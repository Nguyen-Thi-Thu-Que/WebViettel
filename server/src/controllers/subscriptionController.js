const subscriptionService = require('../services/subscriptionService');

module.exports = {
  check: async (req, res, next) => {
    try {
      const userId = req.user.user_id;
      const { packageId } = req.body;

      if (packageId === undefined || packageId === null || packageId === '') {
        return res.status(400).json({ success: false, message: 'Thiếu thông tin gói cước.' });
      }

      const result = await subscriptionService.checkSubscriptionConflict(userId, packageId);
      res.status(200).json({
        success: true,
        ...result
      });
    } catch (err) {
      res.status(400).json({ success: false, message: err.message });
    }
  },

  register: async (req, res, next) => {
    try {
      const userId = req.user.user_id;
      const { packageId, cycle } = req.body;

      if (packageId === undefined || packageId === null || packageId === '') {
        return res.status(400).json({ success: false, message: 'Thiếu thông tin gói cước.' });
      }

      const { subscription, account, pkg } = await subscriptionService.registerSubscription(userId, packageId, cycle);

      res.status(200).json({
        success: true,
        message: 'Đăng ký gói cước thành công!',
        data: subscription,
        balance: account.balance,
        activePackage: {
          packageId: pkg.ma_goi.toLowerCase(),
          activatedAt: subscription.activatedAt.toISOString(),
          expiresAt: subscription.expiresAt.toISOString()
        }
      });
    } catch (err) {
      res.status(400).json({ success: false, message: err.message });
    }
  },

  getActive: async (req, res, next) => {
    try {
      const userId = req.user.user_id;
      const activeSubs = await subscriptionService.getActiveSubscriptions(userId);
      const Package = require('../models/Package');

      const mappedActive = [];
      for (const sub of activeSubs) {
        const pkg = await Package.findOne({ package_id: sub.packageId });
        if (pkg) {
          mappedActive.push({
            packageId: pkg.ma_goi.toLowerCase(),
            activatedAt: typeof sub.activatedAt === 'string' ? sub.activatedAt : sub.activatedAt.toISOString(),
            expiresAt: typeof sub.expiresAt === 'string' ? sub.expiresAt : sub.expiresAt.toISOString()
          });
        }
      }

      res.status(200).json({
        success: true,
        activePackages: mappedActive
      });
    } catch (err) {
      res.status(400).json({ success: false, message: err.message });
    }
  },

  getHistory: async (req, res, next) => {
    try {
      const userId = req.user.user_id;
      const history = await subscriptionService.getSubscriptionHistory(userId);
      const Package = require('../models/Package');

      const mappedHistory = [];
      for (const sub of history) {
        const pkg = await Package.findOne({ package_id: sub.packageId });
        if (pkg) {
          mappedHistory.push({
            subscriptionId: sub._id,
            packageId: pkg.ma_goi.toLowerCase(),
            packageName: pkg.ten,
            activatedAt: typeof sub.activatedAt === 'string' ? sub.activatedAt : sub.activatedAt.toISOString(),
            expiresAt: typeof sub.expiresAt === 'string' ? sub.expiresAt : sub.expiresAt.toISOString(),
            status: sub.status,
            cycle: sub.cycle
          });
        }
      }

      res.status(200).json({
        success: true,
        history: mappedHistory
      });
    } catch (err) {
      res.status(400).json({ success: false, message: err.message });
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
