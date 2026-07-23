const contactService = require('../services/contactService');

const contactController = {
  createContact: async (req, res, next) => {
    try {
      const { full_name, phone, message } = req.body;

      // Validate Họ tên
      if (!full_name || typeof full_name !== 'string' || !full_name.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Họ và tên là bắt buộc.'
        });
      }

      // Validate SĐT: 10-11 số
      const phoneRegex = /^[0-9]{10,11}$/;
      if (!phone || !phoneRegex.test(phone)) {
        return res.status(400).json({
          success: false,
          message: 'Số điện thoại không hợp lệ. Phải bao gồm 10 hoặc 11 chữ số.'
        });
      }

      // Validate Nội dung: tối thiểu 10 ký tự
      if (!message || typeof message !== 'string' || message.trim().length < 10) {
        return res.status(400).json({
          success: false,
          message: 'Nội dung liên hệ là bắt buộc và phải có ít nhất 10 ký tự.'
        });
      }

      let user_id = null;
      let source = 'guest';

      if (req.user) {
        user_id = req.user.user_id;
        source = 'user';
      }

      const newContact = await contactService.createContact({
        user_id,
        full_name: full_name.trim(),
        phone: phone.trim(),
        message: message.trim(),
        source,
        admin_note: ''
      });

      return res.status(201).json({
        success: true,
        message: 'Gửi yêu cầu liên hệ thành công!',
        data: newContact
      });
    } catch (error) {
      next(error);
    }
  },

  getContacts: async (req, res, next) => {
    try {
      const { status, search } = req.query;
      const contacts = await contactService.getAllContacts({ status, search });
      return res.status(200).json({
        success: true,
        message: 'Lấy danh sách liên hệ thành công.',
        data: contacts
      });
    } catch (error) {
      next(error);
    }
  },

  getContactById: async (req, res, next) => {
    try {
      const { id } = req.params;
      const contact = await contactService.getContactById(id);
      return res.status(200).json({
        success: true,
        message: 'Lấy chi tiết liên hệ thành công.',
        data: contact
      });
    } catch (error) {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }
  },

  updateContactStatus: async (req, res, next) => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!status) {
        return res.status(400).json({
          success: false,
          message: 'Trạng thái là bắt buộc.'
        });
      }

      const adminUserId = req.user ? req.user.user_id : null;
      const updated = await contactService.updateContactStatus(id, status, adminUserId);

      return res.status(200).json({
        success: true,
        message: 'Cập nhật trạng thái liên hệ thành công!',
        data: updated
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
  },

  updateContactNote: async (req, res, next) => {
    try {
      const { id } = req.params;
      const { admin_note } = req.body;

      if (admin_note === undefined) {
        return res.status(400).json({
          success: false,
          message: 'Ghi chú admin_note là bắt buộc.'
        });
      }

      const adminUserId = req.user ? req.user.user_id : null;
      const updated = await contactService.updateContactNote(id, admin_note, adminUserId);

      return res.status(200).json({
        success: true,
        message: 'Cập nhật ghi chú liên hệ thành công!',
        data: updated
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }
};

module.exports = contactController;
