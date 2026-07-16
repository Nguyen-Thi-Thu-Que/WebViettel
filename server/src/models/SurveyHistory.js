const mongoose = require('mongoose');

const surveyHistorySchema = new mongoose.Schema({
  userId: {
    type: Number,
    required: false,
    index: true
  },
  answers: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  filters: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  recommendedPackages: {
    type: [mongoose.Schema.Types.Mixed],
    required: true
  },
  deleted: {
    type: Boolean,
    default: false
  },
  deletedAt: {
    type: Date,
    default: null
  },
  isEarlyTerminated: {
    type: Boolean,
    default: false
  }
}, {
  collection: 'survey_histories',
  timestamps: true
});

module.exports = mongoose.model('SurveyHistory', surveyHistorySchema);
