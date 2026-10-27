const mongoose = require('mongoose');

const feedbackReplySchema = new mongoose.Schema({
  message: { type: String, required: true, maxlength: 5000 },
  repliedBy: { type: String, default: '' },
  repliedByName: { type: String, default: '' },
  status: { type: String, enum: ['pending', 'sent', 'failed'], default: 'pending' },
  failureReason: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now },
  sentAt: { type: Date, default: null },
});

const feedbackSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String },
  subject: { type: String },
  phoneNumber: { type: String },
  contact: { type: String },
  message: { type: String, required: true },
  status: { type: String, enum: ['new', 'pending', 'replied'], default: 'pending' },
  replies: { type: [feedbackReplySchema], default: [] },
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('Feedback', feedbackSchema);
