const mongoose = require('mongoose');

const corporateEnquirySchema = new mongoose.Schema({
  company: { type: String, required: true, trim: true },
  contactName: { type: String, required: true, trim: true },
  email: { type: String, required: true, trim: true, lowercase: true },
  phone: { type: String, required: true, trim: true },
  city: { type: String, default: '', trim: true },
  rides: { type: String, default: '', trim: true },
  requirements: { type: String, default: '', trim: true },
}, { timestamps: true });

corporateEnquirySchema.index({ createdAt: -1 });
corporateEnquirySchema.index({ email: 1, company: 1 });

module.exports = mongoose.model('CorporateEnquiry', corporateEnquirySchema);
