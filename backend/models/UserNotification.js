const mongoose = require('mongoose');

const userNotificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  applicationId: { type: String, required: true, index: true },
  channel: { type: String, enum: ['SMS'], default: 'SMS' },
  deliveryStatus: { type: String, enum: ['simulated', 'unavailable'], required: true },
  message: { type: String, required: true },
}, { timestamps: true });

module.exports = mongoose.model('UserNotification', userNotificationSchema);
