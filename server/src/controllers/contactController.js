const Contact = require('../models/Contact');
const crypto = require('crypto');

// Helper for migrating old format data on the fly
const normalizeContact = async (contact) => {
  if (!contact) return contact;
  const message = contact.message || '';
  const match = message.match(/^\[Chủ đề:\s*(.*?)\]\s*([\s\S]*)$/i) || message.match(/^\[(.*?)\]\s*([\s\S]*)$/);
  if (match) {
    const extractedTopic = match[1].trim();
    const extractedMessage = match[2].trim();
    contact.topic = extractedTopic;
    contact.message = extractedMessage;
    await Contact.updateOne({ _id: contact._id }, { $set: { topic: extractedTopic, message: extractedMessage } });
  }
  return contact;
};

const contactController = {
  createContact: async (req, res, next) => {
    try {
      const { full_name, phone, message, topic } = req.body;

      if (!full_name || !full_name.trim()) {
        return res.status(400).json({ success: false, message: 'Họ và tên là bắt buộc.' });
      }
      const phoneRegex = /^[0-9]{10,11}$/;
      if (!phone || !phoneRegex.test(phone)) {
        return res.status(400).json({ success: false, message: 'Số điện thoại không hợp lệ.' });
      }
      if (!message || message.trim().length < 10) {
        return res.status(400).json({ success: false, message: 'Nội dung liên hệ phải có ít nhất 10 ký tự.' });
      }

      let user_id = null;
      let source = 'guest';
      if (req.user) {
        user_id = req.user.user_id;
        source = 'user';
      }

      const contact_id = 'CT' + Date.now() + crypto.randomInt(1000, 9999);
      const newContact = new Contact({
        contact_id,
        user_id,
        full_name: full_name.trim(),
        phone: phone.trim(),
        topic: (topic && topic.trim()) ? topic.trim() : 'Liên hệ chung',
        message: message.trim(),
        source,
        status: 'NEW'
      });

      await newContact.save();

      return res.status(201).json({
        success: true,
        message: 'Gửi yêu cầu liên hệ thành công!',
        data: newContact
      });
    } catch (error) {
      next(error);
    }
  },

  getAdminContacts: async (req, res, next) => {
    try {
      const { status, search } = req.query;
      const mongoQuery = {};

      if (status) {
        mongoQuery.status = status;
      }

      if (search && search.trim()) {
        const searchRegex = new RegExp(search.trim(), 'i');
        mongoQuery.$or = [
          { full_name: searchRegex },
          { phone: searchRegex },
          { contact_id: searchRegex },
          { topic: searchRegex }
        ];
      }

      const contacts = await Contact.find(mongoQuery).sort({ created_at: -1 });

      const normalized = [];
      for (const contact of contacts) {
        normalized.push(await normalizeContact(contact));
      }

      return res.status(200).json({
        success: true,
        message: 'Lấy danh sách liên hệ thành công.',
        data: normalized
      });
    } catch (error) {
      next(error);
    }
  },

  updateContactReply: async (req, res, next) => {
    try {
      const { id } = req.params;
      const { admin_note } = req.body;

      if (admin_note === undefined || typeof admin_note !== 'string' || !admin_note.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Nội dung phản hồi không được để trống.'
        });
      }

      const adminUserId = req.user ? (req.user.user_id || req.user.id || 1) : 1;

      const updatedContact = await Contact.findOneAndUpdate(
        { contact_id: id },
        {
          $set: {
            admin_note: admin_note.trim(),
            status: 'DONE',
            handled_by: adminUserId,
            handled_at: new Date()
          }
        },
        { new: true }
      );

      if (!updatedContact) {
        return res.status(404).json({
          success: false,
          message: `Không tìm thấy liên hệ với ID ${id}`
        });
      }

      if (updatedContact.user_id !== null && updatedContact.user_id !== undefined) {
        try {
          const notificationService = require('../services/notificationService');
          await notificationService.createNotification({
            userId: updatedContact.user_id,
            title: "CSKH Viettel phản hồi yêu cầu hỗ trợ",
            content: admin_note.trim(),
            type: "SUPPORT",
            link: "/contact"
          });
        } catch (err) {
          console.error("Failed to create contact reply notification:", err);
        }
      }

      return res.status(200).json({
        success: true,
        message: "Phản hồi thành công",
        data: updatedContact
      });
    } catch (error) {
      next(error);
    }
  },

  deleteContact: async (req, res, next) => {
    try {
      const { id } = req.params;
      const deleted = await Contact.findOneAndDelete({ contact_id: id });
      if (!deleted) {
        return res.status(404).json({ success: false, message: 'Không tìm thấy liên hệ.' });
      }
      return res.status(200).json({ success: true, message: 'Xóa liên hệ thành công.' });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = contactController;
