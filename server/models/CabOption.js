const mongoose = require('mongoose');

const cabOptionSchema = new mongoose.Schema({
  cabType: { type: String, required: true, trim: true },
  carModel: { type: String, required: true, trim: true },
  multiplier: { type: Number, required: true },
  availableFrom: { type: Date, required: false },
  availableTo: { type: Date, required: false },
}, { timestamps: true });

module.exports = mongoose.model('CabOption', cabOptionSchema);