const mongoose = require('mongoose');
const Account = require('../models/Account');
const UserSubscription = require('../models/UserSubscription');
const Deposit = require('../models/Deposit');
const Package = require('../models/Package');

// Verification helper function via JSON-RPC
const verifyBlockchainTx = async (txHash, expectedReceiver, expectedEthAmount, rpcUrl) => {
  try {
    // 1. Get transaction details
    const txResponse = await fetch(rpcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_getTransactionByHash',
        params: [txHash],
        id: 1
      })
    });

    const txResult = await txResponse.json();
    if (!txResult.result) {
      console.error("Tx not found on blockchain:", txHash);
      return false;
    }

    const tx = txResult.result;

    // 2. Validate receiver address (case insensitive comparison)
    if (!tx.to || tx.to.toLowerCase() !== expectedReceiver.toLowerCase()) {
      console.error(`Receiver mismatch. Tx to: ${tx.to}, Expected: ${expectedReceiver}`);
      return false;
    }

    // 3. Validate amount (hex to decimal Wei comparison)
    const txValueWei = BigInt(tx.value);
    // Convert expected ETH to Wei: ETH * 10^18
    const expectedValueWei = BigInt(Math.floor(expectedEthAmount * 1e18));

    // Allow small precision error (e.g. 0.0001 ETH difference is acceptable)
    const allowedDiff = BigInt(Math.floor(0.0001 * 1e18));
    const diff = txValueWei > expectedValueWei ? txValueWei - expectedValueWei : expectedValueWei - txValueWei;

    if (diff > allowedDiff) {
      console.error(`Value mismatch. Tx value Wei: ${tx.value} (${ethers.utils.formatEther(tx.value)} ETH), Expected Wei: ${expectedValueWei}`);
      return false;
    }

    // 4. Verify transaction status by checking receipt
    const receiptResponse = await fetch(rpcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_getTransactionReceipt',
        params: [txHash],
        id: 1
      })
    });

    const receiptResult = await receiptResponse.json();
    if (!receiptResult.result) {
      console.error("Receipt not found for tx:", txHash);
      return false;
    }

    const receipt = receiptResult.result;
    
    // status '0x1' is success, '0x0' is failure
    if (receipt.status !== '0x1') {
      console.error("Blockchain transaction failed. Status:", receipt.status);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error verifying transaction on blockchain:", error);
    return false;
  }
};

const transactionService = {
  // 1. Process Virtual deposit
  depositFiat: async (userId, amount) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const account = await Account.findOne({ user_id: userId }).session(session);
      if (!account) {
        throw new Error('Tài khoản không tồn tại.');
      }

      // Add balance
      account.balance += amount;
      await account.save({ session });

      // Record deposit transaction
      const lastDep = await Deposit.findOne().sort({ deposit_id: -1 }).session(session);
      const nextId = lastDep ? lastDep.deposit_id + 1 : 1;

      await Deposit.create([{
        deposit_id: nextId,
        user_id: userId,
        amountETH: 0,
        fiat_equivalent: amount,
        amountVND: amount,
        tx_hash: `virtual_fiat_dep_${Date.now()}_${Math.floor(Math.random()*1000)}`,
        wallet_address: account.wallet_address || 'Virtual Wallet',
        network: 'VietQR',
        status: 'success'
      }], { session });

      await session.commitTransaction();
      return account.balance;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  },

  // 2. Register package via virtual balance (Unified subscriber)
  subscribePackage: async (userId, packageId) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const account = await Account.findOne({ user_id: userId }).session(session);
      if (!account) {
        throw new Error('Tài khoản không tồn tại.');
      }

      const pkg = await Package.findOne({ $or: [{ package_id: Number(packageId) }, { id: Number(packageId) }] }).session(session);
      if (!pkg) {
        throw new Error('Gói cước không tồn tại.');
      }

      // Check balance
      if (account.balance < pkg.gia) {
        throw new Error('Số dư tài khoản không đủ. Vui lòng nạp thêm tiền.');
      }

      // Check if already active
      const activeSub = await UserSubscription.findOne({
        userId: userId,
        packageId: pkg.package_id,
        status: 'ACTIVE'
      }).session(session);

      if (activeSub) {
        throw new Error(`Bạn đang sử dụng gói ${pkg.ten} rồi.`);
      }

      const activatedAt = new Date();
      const cycleDays = parseInt(pkg.chu_ky_ngay) || 30;
      const expiresAt = new Date(Date.now() + cycleDays * 24 * 60 * 60 * 1000);

      let cycle = 'MONTH';
      if (cycleDays === 1) {
        cycle = 'DAY';
      } else if (cycleDays >= 360) {
        cycle = 'YEAR';
      }

      // 1. Create UserSubscription
      await UserSubscription.create([{
        userId: userId,
        packageId: pkg.package_id,
        activatedAt,
        expiresAt,
        cycle,
        autoRenew: true,
        status: 'ACTIVE'
      }], { session });

      // 2. Deduct user balance
      account.balance -= pkg.gia;
      await account.save({ session });

      await session.commitTransaction();
      return { 
        balance: account.balance,
        activePackage: {
          packageId: pkg.ma_goi.toLowerCase(),
          activatedAt: activatedAt.toISOString(),
          expiresAt: expiresAt.toISOString()
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

    const sub = await UserSubscription.findOne({
      userId: userId,
      packageId: pkg.package_id,
      status: 'ACTIVE'
    });

    if (!sub) {
      throw new Error(`Bạn hiện không kích hoạt sử dụng gói cước ${pkgCode}.`);
    }

    sub.status = 'CANCELLED';
    await sub.save();
    return true;
  },

  // 4. Merge deposits & subscriptions into user transactions
  getTransactionsForUser: async (userId) => {
    const userDeposits = await Deposit.find({ user_id: userId });

    const txs = [];

    // Map deposits
    for (const dep of userDeposits) {
      txs.push({
        id: `tx_dep_${dep.deposit_id}`,
        userId: String(dep.user_id),
        type: 'deposit',
        amount: dep.amountVND || parseFloat(dep.fiat_equivalent ? dep.fiat_equivalent.toString() : '0'),
        paymentMethod: dep.network || 'VietQR',
        status: dep.status || 'success',
        createdAt: dep.created_at || new Date().toISOString(),
        txHash: dep.txHash || dep.tx_hash || '',
        walletAddress: dep.walletAddress || '',
        exchangeRate: dep.exchangeRate || null,
        network: dep.network || '',
        amountETH: dep.amountETH || ''
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
      const fiat = curr.amountVND || parseFloat(curr.fiat_equivalent ? curr.fiat_equivalent.toString() : '0');
      return sum + fiat;
    }, 0);
    const totalSubscriptionsCount = await UserSubscription.countDocuments();

    // Fetch and merge 10 most recent transactions across all users
    const latestDeposits = await Deposit.find().sort({ deposit_id: -1 }).limit(10);
    const latestSubs = await UserSubscription.find().sort({ createdAt: -1 }).limit(10);

    const merged = [];

    for (const dep of latestDeposits) {
      const user = await Account.findOne({ user_id: dep.user_id });
      merged.push({
        id: `tx_dep_${dep.deposit_id}`,
        type: 'deposit',
        phoneNumber: user ? user.phone_number : '09xxxxxxxx',
        amount: dep.amountVND || parseFloat(dep.fiat_equivalent ? dep.fiat_equivalent.toString() : '0'),
        paymentMethod: dep.network || 'VietQR',
        status: dep.status || 'success',
        createdAt: dep.created_at,
        txHash: dep.txHash || dep.tx_hash || ''
      });
    }

    for (const sub of latestSubs) {
      const user = await Account.findOne({ user_id: sub.userId });
      const pkg = await Package.findOne({ $or: [{ package_id: sub.packageId }, { id: sub.packageId }] });
      merged.push({
        id: `tx_sub_${sub._id}`,
        type: 'subscribe',
        phoneNumber: user ? user.phone_number : '09xxxxxxxx',
        amount: pkg ? pkg.gia : 0,
        packageName: pkg ? pkg.ten : 'Gói cước',
        status: 'success',
        createdAt: sub.activatedAt || sub.createdAt || new Date()
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
