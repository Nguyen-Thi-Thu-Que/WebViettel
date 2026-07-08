const UserSubscription = require('../models/UserSubscription');
const Package = require('../models/Package');

module.exports = {
  registerSubscription: async (userId, packageId, cycle) => {
    console.log("========== REGISTER REQUEST ==========");
    console.log("packageId =", packageId);
    const numericId = Number(packageId);
    console.log("numericId =", numericId);
    let pkg = await Package.findOne({
        package_id: numericId
    });
    console.log("Mongo result =", pkg);
    if (pkg === null) {
      console.log("Package not found in MongoDB");
    }

    // 1. Find package to get chu_ky_ngay
    // Find by numeric package_id or by ma_goi string (case-insensitive)
    if (!pkg) {
      if (!isNaN(numericId)) {
        pkg = await Package.findOne({ $or: [{ package_id: numericId }, { id: numericId }] });
      }
    }
    if (!pkg) {
      pkg = await Package.findOne({ ma_goi: new RegExp(`^${packageId}$`, 'i') });
    }

    if (!pkg) {
      throw new Error('Gói cước không tồn tại.');
    }

    // 2. Calculate expiresAt based on package cycle duration
    const now = new Date();
    const days = parseInt(pkg.chu_ky_ngay || '30', 10);
    const expiresAt = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

    // 3. Create a new subscription (Happy Path)
    const subscription = new UserSubscription({
      userId: userId,
      packageId: pkg.package_id,
      registeredAt: now,
      activatedAt: now,
      startedAt: now,
      expiresAt: expiresAt,
      status: 'ACTIVE',
      autoRenew: true,
      cycle: cycle || 'MONTH'
    });

    await subscription.save();
    return subscription;
  },

  getActiveSubscriptions: async (userId) => {
    // Boilerplate for next print
    return [];
  },

  getSubscriptionHistory: async (userId) => {
    // Boilerplate for next print
    return [];
  },

  renewSubscription: async (subscriptionId) => {
    // Boilerplate for next print
    throw new Error('Chức năng gia hạn gói chưa được triển khai.');
  },

  cancelSubscription: async (subscriptionId, reason) => {
    // Boilerplate for next print
    throw new Error('Chức năng hủy gói chưa được triển khai.');
  },

  updateAutoRenew: async (subscriptionId, autoRenew) => {
    // Boilerplate for next print
    throw new Error('Chức năng thay đổi tự động gia hạn chưa được triển khai.');
  }
};
