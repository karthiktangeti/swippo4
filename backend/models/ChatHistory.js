const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  userId:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  role:    { type: String, required: true },
  message: { type: String, required: true, maxlength: 2000 },
  sender:  { type: String, enum: ['user', 'assistant'], required: true },
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('ChatHistory', schema);
