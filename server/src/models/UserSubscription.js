const mongoose = require('mongoose');

const userSubscriptionSchema = new mongoose.Schema({
  userId: {
    type: Number,
    required: true,
    index: true
  },
  packageId: {
    type: Number,
    required: true,
    index: true
  },
  registeredAt: {
    type: Date,
    required: true,
    default: Date.now
  },
  activatedAt: {
    type: Date,
    required: true,
    default: Date.now
  },
  expiresAt: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['ACTIVE', 'PENDING_PAYMENT', 'EXPIRED', 'CANCELLED'],
    required: true,
    default: 'ACTIVE'
  },
  autoRenew: {
    type: Boolean,
    required: true,
    default: true
  },
  cycle: {
    type: String,
    enum: ['DAY', 'MONTH', 'YEAR'],
    required: true
  },
  cancelledAt: {
    type: Date,
    default: null
  },
  cancelReason: {
    type: String,
    default: ''
  }
}, {
  collection: 'user_subscriptions',
  timestamps: true
});

module.exports = mongoose.model('UserSubscription', userSubscriptionSchema);
