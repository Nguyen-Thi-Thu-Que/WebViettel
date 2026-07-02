const mongoose = require('mongoose');

const depositSchema = new mongoose.Schema({
  deposit_id: { type: Number, required: true, unique: true },
  user_id: { type: Number, required: true, index: true },
  amount: { type: mongoose.Schema.Types.Decimal128, required: true },
  fiat_equivalent: { type: mongoose.Schema.Types.Decimal128, required: true },
  tx_hash: { type: String },
  network: { type: String },
  status: { type: String, default: 'success' },
  created_at: { type: String, default: () => new Date().toISOString() }
}, {
  collection: 'deposits',
  timestamps: false
});

module.exports = mongoose.model('Deposit', depositSchema);
