const mongoose = require('mongoose');

const surveyHistorySchema = new mongoose.Schema({
  userId: {
    type: Number,
    required: true,
    unique: true,
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
  }
}, {
  collection: 'survey_histories',
  timestamps: true
});

module.exports = mongoose.model('SurveyHistory', surveyHistorySchema);
