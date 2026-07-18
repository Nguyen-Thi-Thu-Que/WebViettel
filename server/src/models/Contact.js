const mongoose = require('mongoose');

const contactSchema = new mongoose.Schema({
  contact_id: { type: String, required: true, unique: true, index: true },
  user_id: { type: Number, default: null },
  full_name: { type: String, required: true },
  phone: { type: String, required: true },
  message: { type: String, required: true },
  status: {
    type: String,
    enum: ['NEW', 'READ', 'PROCESSING', 'DONE', 'CLOSED'],
    default: 'NEW'
  },
  source: {
    type: String,
    enum: ['guest', 'user'],
    required: true
  },
  handled_by: { type: Number, default: null },
  handled_at: { type: Date, default: null },
  admin_note: { type: String, default: '' }
}, {
  collection: 'contacts',
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

module.exports = mongoose.model('Contact', contactSchema);
