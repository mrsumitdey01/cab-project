const mongoose = require('mongoose');

const idempotencyKeySchema = new mongoose.Schema({
  key: { type: String, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  endpoint: { type: String, required: true },
  responseStatus: { type: Number, required: true },
  responseBody: { type: Object, required: true },
}, { timestamps: true });

idempotencyKeySchema.index({ key: 1, userId: 1, endpoint: 1 }, { unique: true });

module.exports = mongoose.model('IdempotencyKey', idempotencyKeySchema);