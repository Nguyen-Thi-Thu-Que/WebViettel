const mongoose = require('mongoose');
const Account = require('../models/Account');
const Subscription = require('../models/Subscription');
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
    const txData = await txResponse.json();
    if (!txData || !txData.result) {
      throw new Error('Không tìm thấy thông tin giao dịch trên Blockchain.');
    }

    const tx = txData.result;
    
    // Verify recipient (to) - case insensitive
    if (!tx.to || tx.to.toLowerCase() !== expectedReceiver.toLowerCase()) {
      throw new Error('Địa chỉ ví nhận không khớp với cấu hình hệ thống.');
    }

    // Verify status on transaction receipt (status should be 0x1)
    const receiptResponse = await fetch(rpcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_getTransactionReceipt',
        params: [txHash],
        id: 2
      })
    });
    const receiptData = await receiptResponse.json();
    if (!receiptData || !receiptData.result) {
      throw new Error('Không tìm thấy hóa đơn giao dịch (receipt) trên Blockchain.');
    }

    const receipt = receiptData.result;
    if (receipt.status !== '0x1') {
      throw new Error('Giao dịch Blockchain thất bại hoặc chưa được xác nhận.');
    }

    // Verify transaction value
    // Parse hex value to bigint in Wei
    const valWei = BigInt(tx.value);
    const expectedWei = BigInt(Math.floor(expectedEthAmount * 1e18));
    
    // Check difference with a tiny tolerance (0.0001 ETH = 10^14 Wei) to prevent decimal rounding mismatch
    const diff = valWei > expectedWei ? valWei - expectedWei : expectedWei - valWei;
    if (diff > BigInt(1e14)) {
      throw new Error('Số tiền thanh toán trên Blockchain không khớp với số tiền yêu cầu.');
    }

    return {
      success: true,
      from: tx.from,
      to: tx.to,
      value: tx.value
    };
  } catch (error) {
    return {
      success: false,
      message: error.message
    };
  }
};

const transactionService = {
  // 1. Web3 MetaMask wallet top up with MongoDB Transaction
  deposit: async (userId, amount, network, txHash, walletAddress) => {
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

      let finalTxHash = txHash;
      let finalNetwork = network || 'Sepolia';
      let finalStatus = 'success';
      let finalWalletAddress = walletAddress || account.walletAddress || '0x';
      
      const rate = parseFloat(process.env.VITE_ETH_EXCHANGE_RATE || '75000000');
      const ethAmount = amount / rate;
      
      if (txHash) {
        // --- 1. Blockchain Verification ---
        // A. Prevent duplicate processing
        const existingTx = await Deposit.findOne({ txHash: txHash }).session(session);
        if (existingTx) {
          throw new Error('Giao dịch này đã được xử lý trên hệ thống.');
        }

        // B. Query blockchain RPC to verify
        const rpcUrl = process.env.VITE_RPC_URL || 'https://sepolia.drpc.org';
        const receiver = process.env.VITE_RECEIVER_WALLET || '0x26FE0B08bB4d0BCc05e04248770e6E2731a04137';

        const verification = await verifyBlockchainTx(txHash, receiver, ethAmount, rpcUrl);
        if (!verification.success) {
          throw new Error(`Xác minh giao dịch Blockchain thất bại: ${verification.message}`);
        }

        // Use the actual sender verified from the blockchain if client input is mismatched
        if (verification.from.toLowerCase() !== finalWalletAddress.toLowerCase()) {
          console.warn(`Wallet address mismatch: client=${finalWalletAddress}, chain=${verification.from}`);
          finalWalletAddress = verification.from;
        }
      } else {
        // Legacy fallback mock flow
        finalTxHash = `0x${crypto.randomBytes(32).toString('hex')}`;
        finalNetwork = network || 'VietQR';
      }

      // Standard legacy Decimals for compatibility
      const amountDecimal = mongoose.Types.Decimal128.fromString(ethAmount.toFixed(18));
      const fiatDecimal = mongoose.Types.Decimal128.fromString(String(amount));

      // 1. Create Deposit Record
      await Deposit.create([{
        deposit_id: nextDepId,
        user_id: userId,
        
        // Standardized Web3 fields
        amountVND: amount,
        amountETH: ethAmount.toFixed(18),
        exchangeRate: rate,
        txHash: finalTxHash,
        network: finalNetwork,
        status: finalStatus,
        walletAddress: finalWalletAddress,

        // Legacy compatibility
        amount: amountDecimal,
        fiat_equivalent: fiatDecimal,
        tx_hash: finalTxHash,
        
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
        amount: dep.amountVND || parseFloat(dep.fiat_equivalent ? dep.fiat_equivalent.toString() : '0'),
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
      const fiat = curr.amountVND || parseFloat(curr.fiat_equivalent ? curr.fiat_equivalent.toString() : '0');
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
        amount: dep.amountVND || parseFloat(dep.fiat_equivalent ? dep.fiat_equivalent.toString() : '0'),
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
