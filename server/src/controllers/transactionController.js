const transactionService = require('../services/transactionService');

const transactionController = {
  deposit: async (req, res, next) => {
    console.log(req.body);
    try {
      const { amount, method, txHash, walletAddress, network } = req.body;
      if (amount === undefined || amount === null || amount === '') {
        console.error("Deposit Controller Error: Missing amount");
        return res.status(400).json({
          success: false,
          message: 'Số tiền nạp là bắt buộc.'
        });
      }

      let result;
      if (txHash && walletAddress && network) {
        console.log("Routing to blockchain deposit: transactionService.depositBlockchain");
        result = await transactionService.depositBlockchain(
          req.user.user_id,
          amount,
          network,
          txHash,
          walletAddress
        );
      } else {
        console.log("Routing to fiat deposit: transactionService.depositFiat");
        result = await transactionService.depositFiat(
          req.user.user_id,
          amount
        );
      }

      return res.status(200).json({
        success: true,
        message: `Nạp tiền thành công! Số dư mới là ${result.balance.toLocaleString()}đ.`,
        data: result
      });
    } catch (error) {
      console.error('DEPOSIT ERROR:', error);
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
  },

  subscribePackage: async (req, res, next) => {
    try {
      const { packageId } = req.body;
      if (!packageId) {
        return res.status(400).json({
          success: false,
          message: 'Mã gói cước đăng ký là bắt buộc.'
        });
      }

      const result = await transactionService.subscribePackage(req.user.user_id, packageId);
      return res.status(200).json({
        success: true,
        message: 'Đăng ký gói cước thành công!',
        data: result
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  },

  unsubscribePackage: async (req, res, next) => {
    try {
      const { packageId } = req.params;
      if (!packageId) {
        return res.status(400).json({
          success: false,
          message: 'Mã gói cước hủy là bắt buộc.'
        });
      }

      await transactionService.unsubscribePackage(req.user.user_id, packageId);
      return res.status(200).json({
        success: true,
        message: 'Hủy gia hạn gói cước thành công!'
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  },

  getTransactions: async (req, res, next) => {
    try {
      const txs = await transactionService.getTransactionsForUser(req.user.user_id);
      return res.status(200).json({
        success: true,
        message: 'Lấy danh sách giao dịch thành công.',
        data: txs
      });
    } catch (error) {
      next(error);
    }
  },

  getAdminStats: async (req, res, next) => {
    try {
      const stats = await transactionService.getAdminDashboardStats();
      return res.status(200).json({
        success: true,
        message: 'Lấy dữ liệu báo cáo thống kê thành công.',
        data: stats
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = transactionController;
