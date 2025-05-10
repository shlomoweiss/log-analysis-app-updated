const mongoose = require('mongoose');

const SavedQuerySchema = new mongoose.Schema({
  name: {
    type: String,
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
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastUsed: {
    type: Date
  }
});

module.exports = mongoose.model('SavedQuery', SavedQuerySchema);
