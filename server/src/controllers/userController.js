const userService = require('../services/userService');

const userController = {
  getUsers: async (req, res, next) => {
    try {
      const users = await userService.getAllUsers();
      return res.status(200).json({
        success: true,
        message: 'Lấy danh sách người dùng thành công.',
        data: users
      });
    } catch (error) {
      next(error);
    }
  },

  updateUserBalance: async (req, res, next) => {
    try {
      const { id } = req.params;
      const { balance } = req.body;

      if (balance === undefined || balance === null || isNaN(balance) || balance < 0) {
        return res.status(400).json({
          success: false,
          message: 'Số dư mới không hợp lệ.'
        });
      }

      await userService.updateUserBalance(id, balance);
      return res.status(200).json({
        success: true,
        message: 'Cập nhật số dư người dùng thành công!'
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  },

  updateUser: async (req, res, next) => {
    try {
      const { id } = req.params;
      const { subscription_type, is_loyal_customer, status, balance } = req.body;

      const updated = await userService.updateUser(id, {
        subscription_type,
        is_loyal_customer,
        status,
        balance
      });

      return res.status(200).json({
        success: true,
        message: 'Cập nhật thông tin tài khoản thành công!',
        data: updated
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }
};

module.exports = userController;
