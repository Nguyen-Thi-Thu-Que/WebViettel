const mongoose = require('mongoose');
const Account = require('../models/Account');
const Subscription = require('../models/Subscription');
const Deposit = require('../models/Deposit');
const Package = require('../models/Package');

const transactionService = {
  // 1. Virtual wallet top up with MongoDB Transaction
  deposit: async (userId, amount, network) => {
    if (amount < 10000) {
      throw new Error('Số tiền nạp tối thiểu là 10.000đ.');
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const account = await Account.findOne({ user_id: userId }).session(session);
      if (!account) {
        throw new Error('Không tìm thấy tài khoản để nạp tiền.');
      }

      // Find next deposit_id
      const lastDeposit = await Deposit.findOne().sort({ deposit_id: -1 }).session(session);
      const nextDepId = lastDeposit ? lastDeposit.deposit_id + 1 : 1;

      const txHash = `0x${crypto.randomBytes(32).toString('hex')}`;
      const amountDecimal = mongoose.Types.Decimal128.fromString(String(amount / 80000000)); // Simulating crypto equivalent
      const fiatDecimal = mongoose.Types.Decimal128.fromString(String(amount));

      // 1. Create Deposit Record
      await Deposit.create([{
        deposit_id: nextDepId,
        user_id: userId,
        amount: amountDecimal,
        fiat_equivalent: fiatDecimal,
        tx_hash: txHash,
        network: network || 'VietQR',
        status: 'success',
        created_at: new Date().toISOString()
      }], { session });

      // 2. Increment Account balance
      account.balance += amount;
      await account.save({ session });

      await session.commitTransaction();
      return { balance: account.balance };
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  },

  // 2. Subscribe package with MongoDB Transaction
  subscribePackage: async (userId, packageIdStr) => {
    const pkgCode = packageIdStr.toUpperCase();
    const pkg = await Package.findOne({ ma_goi: pkgCode });
    if (!pkg) {
      throw new Error(`Gói cước ${pkgCode} không tồn tại trên hệ thống.`);
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const account = await Account.findOne({ user_id: userId }).session(session);
      if (!account) {
        throw new Error('Tài khoản không tồn tại.');
      }

      // Check balance
      if (account.balance < pkg.gia) {
        throw new Error('Số dư tài khoản không đủ. Vui lòng nạp thêm tiền.');
      }

      // Check if already active
      const activeSub = await Subscription.findOne({
        user_id: userId,
        package_id: pkg.id,
        status: 'active'
      }).session(session);

      if (activeSub) {
        throw new Error(`Bạn đang sử dụng gói ${pkg.ten} rồi.`);
      }

      // Find next subscription_id
      const lastSub = await Subscription.findOne().sort({ subscription_id: -1 }).session(session);
      const nextSubId = lastSub ? lastSub.subscription_id + 1 : 1;

      const activatedAt = new Date().toISOString();
      const cycleDays = parseInt(pkg.chu_ky_ngay) || 30;
      const expiresAt = new Date(Date.now() + cycleDays * 24 * 60 * 60 * 1000).toISOString();

      // 1. Create Subscription
      await Subscription.create([{
        subscription_id: nextSubId,
        user_id: userId,
        package_id: pkg.id,
        registered_at: activatedAt,
        expired_at: expiresAt,
        is_auto_renew: true,
        status: 'active'
      }], { session });

      // 2. Deduct user balance
      account.balance -= pkg.gia;
      await account.save({ session });

      await session.commitTransaction();
      return { 
        balance: account.balance,
        activePackage: {
          packageId: pkg.ma_goi.toLowerCase(),
          activatedAt,
          expiresAt
        }
      };
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  },

  // 3. Unsubscribe package
  unsubscribePackage: async (userId, packageIdStr) => {
    const pkgCode = packageIdStr.toUpperCase();
    const pkg = await Package.findOne({ ma_goi: pkgCode });
    if (!pkg) {
      throw new Error(`Gói cước ${pkgCode} không tồn tại.`);
    }

    const sub = await Subscription.findOne({
      user_id: userId,
      package_id: pkg.id,
      status: 'active'
    });

    if (!sub) {
      throw new Error(`Bạn hiện không kích hoạt sử dụng gói cước ${pkgCode}.`);
    }

    sub.status = 'expired';
    await sub.save();
    return true;
  },

  // 4. Merge deposits & subscriptions into user transactions
  getTransactionsForUser: async (userId) => {
    const userDeposits = await Deposit.find({ user_id: userId });
    const userSubscriptions = await Subscription.find({ user_id: userId });

    const txs = [];

    // Map deposits
    for (const dep of userDeposits) {
      txs.push({
        id: `tx_dep_${dep.deposit_id}`,
        userId: String(dep.user_id),
        type: 'deposit',
        amount: parseFloat(dep.fiat_equivalent ? dep.fiat_equivalent.toString() : '0'),
        paymentMethod: dep.network || 'VietQR',
        status: dep.status || 'success',
        createdAt: dep.created_at || new Date().toISOString()
      });
    }

    // Map subscriptions
    for (const sub of userSubscriptions) {
      const pkg = await Package.findOne({ $or: [{ package_id: sub.package_id }, { id: sub.package_id }] });
      txs.push({
        id: `tx_sub_${sub.subscription_id}`,
        userId: String(sub.user_id),
        type: 'subscribe',
        amount: pkg ? pkg.gia : 0,
        packageName: pkg ? pkg.ten : 'Gói cước di động',
        status: 'success', // if subscription exists, it was paid successfully
        createdAt: sub.registered_at
      });
    }

    // Sort by Date descending
    txs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return txs;
  },

  // 5. Statistics for Admin Dashboard
  getAdminDashboardStats: async () => {
    const totalUsersCount = await Account.countDocuments();
    const totalPackagesCount = await Package.countDocuments();
    const allDeposits = await Deposit.find({ status: 'success' });
    const totalRevenueVal = allDeposits.reduce((sum, curr) => {
      const fiat = parseFloat(curr.fiat_equivalent ? curr.fiat_equivalent.toString() : '0');
      return sum + fiat;
    }, 0);
    const totalSubscriptionsCount = await Subscription.countDocuments();

    // Fetch and merge 10 most recent transactions across all users
    const latestDeposits = await Deposit.find().sort({ deposit_id: -1 }).limit(10);
    const latestSubs = await Subscription.find().sort({ subscription_id: -1 }).limit(10);

    const merged = [];

    for (const dep of latestDeposits) {
      const user = await Account.findOne({ user_id: dep.user_id });
      merged.push({
        id: `tx_dep_${dep.deposit_id}`,
        type: 'deposit',
        phoneNumber: user ? user.phone_number : '09xxxxxxxx',
        amount: parseFloat(dep.fiat_equivalent ? dep.fiat_equivalent.toString() : '0'),
        paymentMethod: dep.network || 'VietQR',
        status: dep.status || 'success',
        createdAt: dep.created_at
      });
    }

    for (const sub of latestSubs) {
      const user = await Account.findOne({ user_id: sub.user_id });
      const pkg = await Package.findOne({ $or: [{ package_id: sub.package_id }, { id: sub.package_id }] });
      merged.push({
        id: `tx_sub_${sub.subscription_id}`,
        type: 'subscribe',
        phoneNumber: user ? user.phone_number : '09xxxxxxxx',
        amount: pkg ? pkg.gia : 0,
        packageName: pkg ? pkg.ten : 'Gói cước',
        status: 'success',
        createdAt: sub.registered_at
      });
    }

    // Sort and slice top 10
    merged.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    const recentTransactions = merged.slice(0, 10);

    return {
      totalUsersCount,
      totalPackagesCount,
      totalRevenueVal,
      totalSubscriptionsCount,
      recentTransactions
    };
  }
};

// Help crypto require inside module
const crypto = require('crypto');

module.exports = transactionService;
