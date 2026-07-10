const mongoose = require('mongoose');
const { ethers } = require('ethers');
const Account = require('../models/Account');
const UserSubscription = require('../models/UserSubscription');
const Deposit = require('../models/Deposit');
const Package = require('../models/Package');
const subscriptionService = require('./subscriptionService');

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

    console.log(
      '========== BLOCKCHAIN TX =========='
    );
    console.log({
      txHash,
      txTo: tx.to,
      txValue: tx.value,
      expectedReceiver,
      expectedEthAmount
    });

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

    console.log(
      '========== VALUE CHECK =========='
    );
    console.log({
      txValueWei:
        txValueWei.toString(),
      expectedValueWei:
        expectedValueWei.toString(),
      diff:
        diff.toString()
    });

    if (diff > allowedDiff) {
      console.error(`Value mismatch. Tx value Wei: ${tx.value} (${ethers.formatEther(tx.value)} ETH), Expected Wei: ${expectedValueWei}`);
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
    
    console.log(
      '========== RECEIPT =========='
    );
    console.log(receipt);
    
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
  // Process Blockchain deposit
  depositBlockchain: async (userId, amount, network, txHash, walletAddress) => {
    console.log('========== BLOCKCHAIN DEPOSIT START ==========');
    console.log('INPUT:', {
      userId,
      amount,
      network,
      txHash,
      walletAddress
    });

    if (
      isNaN(Number(amount)) ||
      Number(amount) <= 0 ||
      !txHash?.trim() ||
      !walletAddress?.trim() ||
      !network?.trim()
    ) {
      throw new Error('Thiếu thông tin yêu cầu giao dịch nạp tiền blockchain.');
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      console.log('STEP 1');
      const existingDep = await Deposit.findOne({
        $or: [
          { txHash: txHash },
          { tx_hash: txHash }
        ]
      }).session(session);
      console.log('existingDep:', existingDep);
      if (existingDep) {
        throw new Error('Giao dịch đã được xử lý.');
      }

      console.log('STEP 2');
      const account = await Account.findOne({ user_id: userId }).session(session);
      console.log('account:', {
        user_id: account?.user_id,
        balance: account?.balance
      });
      if (!account) {
        throw new Error('Tài khoản không tồn tại.');
      }

      console.log('STEP 3');
      const expectedReceiver = process.env.RECEIVER_WALLET;
      console.log('expectedReceiver:', expectedReceiver);
      if (!expectedReceiver) {
        throw new Error('Chưa cấu hình địa chỉ ví nhận trên server.');
      }

      console.log('STEP 4');
      const exchangeRate = parseFloat(process.env.ETH_EXCHANGE_RATE || '75000000');
      console.log('exchangeRate:', exchangeRate);

      console.log('STEP 5');
      const expectedEthAmount = Number(amount) / exchangeRate;
      console.log('expectedEthAmount:', expectedEthAmount);

      console.log('STEP 6');
      const rpcUrl = process.env.RPC_URL || 'https://sepolia.drpc.org';
      console.log('rpcUrl:', rpcUrl);

      console.log('STEP 7');
      const isValidTx = await verifyBlockchainTx(txHash, expectedReceiver, expectedEthAmount, rpcUrl);
      console.log('STEP 8 isValidTx:', isValidTx);

      if (!isValidTx) {
        throw new Error('Xác minh giao dịch blockchain thất bại. Vui lòng kiểm tra lại Hash hoặc số tiền.');
      }

      console.log('STEP 9');
      const numericAmount = Number(amount);
      account.balance += numericAmount;
      console.log('balance after deposit:', account.balance);

      console.log('STEP 10');
      await account.save({ session });

      const lastDep = await Deposit.findOne().sort({ deposit_id: -1 }).session(session);
      const nextId = lastDep ? lastDep.deposit_id + 1 : 1;

      console.log('STEP 11');
      console.log('Creating Deposit...');
      await Deposit.create([{
        deposit_id: nextId,
        user_id: userId,
        amountVND: numericAmount,
        amountETH: expectedEthAmount.toString(),
        exchangeRate: exchangeRate,
        txHash: txHash,
        walletAddress: walletAddress.toLowerCase(),
        network: network,
        status: 'success',

        // legacy compatibility
        amount: numericAmount,
        fiat_equivalent: numericAmount,
        tx_hash: txHash
      }], { session });

      console.log('STEP 12');
      await session.commitTransaction();
      console.log('========== BLOCKCHAIN DEPOSIT SUCCESS ==========');
      return {
        balance: account.balance
      };
    } catch (error) {
      console.error('========== BLOCKCHAIN DEPOSIT ERROR ==========');
      console.error(error);
      console.error(error.stack);
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  },

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

      const exchangeRate = parseFloat(process.env.ETH_EXCHANGE_RATE || '75000000');
      const virtualHash = `virtual_fiat_dep_${Date.now()}_${Math.floor(Math.random()*1000)}`;
      const walletAddr = account.wallet_address || 'Virtual Wallet';

      await Deposit.create([{
        deposit_id: nextId,
        user_id: userId,
        amountVND: amount,
        amountETH: '0',
        exchangeRate: exchangeRate,
        txHash: virtualHash,
        walletAddress: walletAddr.toLowerCase(),
        network: 'VietQR',
        status: 'success',

        // legacy compatibility
        amount: amount,
        fiat_equivalent: amount,
        tx_hash: virtualHash
      }], { session });

      await session.commitTransaction();
      return {
        balance: account.balance
      };
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
      const metadata = subscriptionService.getPkgMetadata(pkg);
      const expiresAt = subscriptionService.calculateExpiryDate(
        activatedAt,
        metadata.duration,
        metadata.cycle_type,
        metadata.validity_mode
      );

      // 1. Create UserSubscription
      await UserSubscription.create([{
        userId: userId,
        packageId: pkg.package_id,
        activatedAt,
        expiresAt,
        cycle: metadata.cycle,
        duration: metadata.duration,
        cycleType: metadata.cycle_type,
        autoRenew: metadata.support_auto_renew,
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
