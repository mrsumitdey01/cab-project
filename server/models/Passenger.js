const mongoose = require('mongoose');

const passengerSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, default: '', trim: true },
  phone: { type: String, default: '', trim: true },
}, { timestamps: true });

passengerSchema.index({ email: 1 });
passengerSchema.index({ phone: 1 });

module.exports = mongoose.model('Passenger', passengerSchema);
