const mongoose = require('mongoose');

const chatHistorySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'Account', required: true, index: true },
  sender: { type: String, enum: ['user', 'bot'], required: true },
  text: { type: String, required: true },
  suggestedAction: { type: mongoose.Schema.Types.Mixed, default: null },
  packages: { type: Array, default: [] },
  isDeleted: { type: Boolean, default: false },
  deletedAt: { type: Date, default: null }
}, {
  collection: 'chat_histories',
  timestamps: true
});

// Create compound index for querying history
chatHistorySchema.index({ userId: 1, createdAt: 1 });

module.exports = mongoose.model('ChatHistory', chatHistorySchema);
