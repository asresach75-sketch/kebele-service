const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
  docType: { type: String },
  fileUrl: { type: String }
}, { _id: false });

const applicationSchema = new mongoose.Schema({
  serviceType: { type: String, required: true },
  trackingNumber: { type: String, required: true, unique: true },
  formData: { type: mongoose.Schema.Types.Mixed },
  documents: { type: [documentSchema], default: [] },
  status: { type: String, default: 'Pending' }
}, { timestamps: true });

module.exports = mongoose.model('Application', applicationSchema);
