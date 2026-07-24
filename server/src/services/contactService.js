const Contact = require('../models/Contact');
const crypto = require('crypto');

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

  getAllContacts: async ({ status = '', search = '' } = {}) => {
    const mongoQuery = {};
    if (status) {
      mongoQuery.status = status;
    }
    if (search.trim()) {
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
    for (const c of contacts) {
      normalized.push(await normalizeContact(c));
    }
    return normalized;
  },

  getContactById: async (contactId) => {
    const contact = await Contact.findOne({ contact_id: contactId });
    if (!contact) {
      throw new Error(`Không tìm thấy liên hệ với ID ${contactId}`);
    }
    return await normalizeContact(contact);
  },

  updateContactStatus: async (contactId, status, adminUserId) => {
    // Validate status value
    const validStatuses = ['NEW', 'READ', 'PROCESSING', 'DONE', 'CLOSED'];
    if (!validStatuses.includes(status)) {
      throw new Error('Trạng thái không hợp lệ.');
    }

    const savedContact = await Contact.findOneAndUpdate(
      { contact_id: contactId },
      {
        $set: {
          status,
          handled_by: adminUserId,
          handled_at: new Date()
        }
      },
      { new: true }
    );

    if (!savedContact) {
      throw new Error(`Không tìm thấy liên hệ với ID ${contactId}`);
    }

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
    const savedContact = await Contact.findOneAndUpdate(
      { contact_id: contactId },
      {
        $set: {
          admin_note: adminNote,
          handled_by: adminUserId,
          handled_at: new Date()
        }
      },
      { new: true }
    );

    if (!savedContact) {
      throw new Error(`Không tìm thấy liên hệ với ID ${contactId}`);
    }

    return savedContact;
  },

  replyContact: async (contactId, adminNote, adminUserId) => {
    const savedContact = await Contact.findOneAndUpdate(
      { contact_id: contactId },
      {
        $set: {
          admin_note: adminNote,
          status: 'DONE',
          handled_by: adminUserId,
          handled_at: new Date()
        }
      },
      { new: true }
    );

    if (!savedContact) {
      throw new Error(`Không tìm thấy liên hệ với ID ${contactId}`);
    }

    if (savedContact.user_id !== null && savedContact.user_id !== undefined) {
      try {
        const notificationService = require('./notificationService');
        await notificationService.createNotification({
          userId: savedContact.user_id,
          title: "CSKH Viettel phản hồi yêu cầu hỗ trợ",
          content: adminNote,
          type: "SYSTEM"
        });
      } catch (err) {
        console.error("Failed to create contact reply notification:", err);
      }
    }

    return savedContact;
  }
};

module.exports = contactService;
