const mongoose = require('mongoose');

const serviceFeeSchema = new mongoose.Schema({
  serviceType: { type: String, required: true, unique: true },
  feeAmount: { type: Number, required: true, min: 0.01 }
}, { timestamps: true });

module.exports = mongoose.model('ServiceFee', serviceFeeSchema);