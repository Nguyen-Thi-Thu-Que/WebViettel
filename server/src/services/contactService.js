const Contact = require('../models/Contact');
const crypto = require('crypto');

const contactService = {
  createContact: async (contactData) => {
    const contact_id = 'CT' + Date.now() + crypto.randomInt(1000, 9999);
    
    const contact = new Contact({
      contact_id,
      ...contactData,
      status: 'NEW'
    });
    
    return await contact.save();
  },

  getAllContacts: async () => {
    return await Contact.find().sort({ created_at: -1 });
  },

  getContactById: async (contactId) => {
    const contact = await Contact.findOne({ contact_id: contactId });
    if (!contact) {
      throw new Error(`Không tìm thấy liên hệ với ID ${contactId}`);
    }
    return contact;
  },

  updateContactStatus: async (contactId, status, adminUserId) => {
    // Validate status value
    const validStatuses = ['NEW', 'READ', 'PROCESSING', 'DONE', 'CLOSED'];
    if (!validStatuses.includes(status)) {
      throw new Error('Trạng thái không hợp lệ.');
    }

    const contact = await Contact.findOne({ contact_id: contactId });
    if (!contact) {
      throw new Error(`Không tìm thấy liên hệ với ID ${contactId}`);
    }

    contact.status = status;
    contact.handled_by = adminUserId;
    contact.handled_at = new Date();

    const savedContact = await contact.save();

    if (savedContact.user_id) {
      try {
        const notificationService = require('./notificationService');
        await notificationService.createNotification({
          userId: savedContact.user_id,
          title: 'Yêu cầu hỗ trợ được phản hồi',
          content: `Yêu cầu liên hệ hỗ trợ mã ${contactId} của bạn đã được cập nhật trạng thái mới: ${status}. Vui lòng kiểm tra phản hồi từ quản trị viên.`,
          type: 'SYSTEM',
          link: '/contact'
        });
      } catch (err) {
        console.error("Failed to create contact status update notification:", err);
      }
    }

    return savedContact;
  },

  updateContactNote: async (contactId, adminNote, adminUserId) => {
    const contact = await Contact.findOne({ contact_id: contactId });
    if (!contact) {
      throw new Error(`Không tìm thấy liên hệ với ID ${contactId}`);
    }

    contact.admin_note = adminNote;
    contact.handled_by = adminUserId;
    contact.handled_at = new Date();

    return await contact.save();
  }
};

module.exports = contactService;
