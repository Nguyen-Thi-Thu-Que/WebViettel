const Account = require('../models/Account');
const Subscription = require('../models/Subscription');
const Package = require('../models/Package');

const userService = {
  getAllUsers: async () => {
    const accounts = await Account.find().sort({ user_id: 1 });
    const users = [];

    for (const acc of accounts) {
      // Find active subscriptions
      const activeSubs = await Subscription.find({ 
        user_id: acc.user_id, 
        status: 'active' 
      });

      const activePackages = [];
      for (const sub of activeSubs) {
        const pkg = await Package.findOne({ $or: [{ package_id: sub.package_id }, { id: sub.package_id }] });
        if (pkg) {
          activePackages.push({
            packageId: pkg.ma_goi.toLowerCase(),
            activatedAt: sub.registered_at,
            expiresAt: sub.expired_at
          });
        }
      }

      users.push({
        id: String(acc.user_id),
        name: acc.fullname,
        phoneNumber: acc.phone_number,
        email: acc.email || '',
        balance: acc.balance,
        role: acc.role === 'admin' ? 'admin' : 'customer',
        activePackages
      });
    }

    return users;
  },

  updateUserBalance: async (userId, balance) => {
    const numericUserId = parseInt(userId);
    const account = await Account.findOne({ user_id: numericUserId });
    if (!account) {
      throw new Error(`Không tìm thấy tài khoản với ID ${userId} để cập nhật số dư.`);
    }

    account.balance = balance;
    await account.save();
    return account;
  }
};

module.exports = userService;
