const mongoose = require('mongoose');

const QuerySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  text: {
    type: String,
    required: true
  },
  translatedQuery: {
    type: String,
    required: true
  },
  resultCount: {
    type: Number,
    default: 0
  },
  executionTime: {
    type: Number,
    default: 0
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Query', QuerySchema);
