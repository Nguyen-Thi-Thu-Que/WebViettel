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
    const validStatuses = ['NEW', 'READ', 'PROCESSING', 'DONE', 'CLOSED'];
    if (!validStatuses.includes(status)) {
      throw new Error('Trạng thái không hợp lệ');
    }

    const contact = await Contact.findOne({ contact_id: contactId });
    if (!contact) {
      throw new Error(`Không tìm thấy liên hệ với ID ${contactId}`);
    }

    contact.status = status;
    contact.handled_by = adminUserId;
    contact.handled_at = new Date();
    
    return await contact.save();
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
