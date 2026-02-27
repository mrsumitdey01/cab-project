const mongoose = require('mongoose');

const routeOptionSchema = new mongoose.Schema({
  fromHub: { type: String, required: true, trim: true },
  toHub: { type: String, required: true, trim: true },
  flatRate: { type: Number, required: true },
  label: { type: String, default: '', trim: true },
}, { timestamps: true });

module.exports = mongoose.model('RouteOption', routeOptionSchema);
