const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
  subscription_id: { type: Number, required: true, unique: true },
  user_id: { type: Number, required: true, index: true },
  package_id: { type: Number, required: true, index: true },
  registered_at: { type: String, required: true },
  expired_at: { type: String, required: true },
  is_auto_renew: { type: Boolean, default: true },
  status: { type: String, enum: ['active', 'expired', 'replaced'], default: 'active' },
  replaced_at: { type: String, default: null },
  replaced_by_subscription_id: { type: Number, default: null }
}, {
  collection: 'subscriptions',
  timestamps: false
});

module.exports = mongoose.model('Subscription', subscriptionSchema);

