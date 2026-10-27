const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  email: { type: String, sparse: true, lowercase: true, unique: true },
  phone: { type: String, required: true },
  password: { type: String, required: true },
  passwordResetTokenHash: { type: String, default: undefined },
  passwordResetExpiresAt: { type: Date, default: undefined },
  passwordResetRequestedAt: { type: Date, default: undefined },
  role: { type: String, enum: ['user', 'admin', 'officer', 'finance', 'support', 'verifier', 'vital'], default: 'user' },
  isBlocked: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);