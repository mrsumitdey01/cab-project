const mongoose = require('mongoose');

const routeOptionSchema = new mongoose.Schema({
  label: { type: String, required: true, trim: true },
  etaMinutes: { type: Number, required: true },
  distanceKm: { type: Number, required: true },
  baseFare: { type: Number, required: true },
}, { timestamps: true });

module.exports = mongoose.model('RouteOption', routeOptionSchema);