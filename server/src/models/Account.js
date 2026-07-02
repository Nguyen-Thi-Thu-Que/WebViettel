const mongoose = require('mongoose');

const accountSchema = new mongoose.Schema({
  user_id: { type: Number, required: true, unique: true },
  fullname: { type: String, required: true },
  phone_number: { type: String, required: true, unique: true, index: true },
  password: { type: String, required: true },
  balance: { type: Number, default: 0 },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  created_at: { type: String, default: () => new Date().toISOString() }
}, {
  collection: 'accounts',
  timestamps: false
});

module.exports = mongoose.model('Account', accountSchema);
