const mongoose = require('mongoose');

const bookingEventSchema = new mongoose.Schema({
  bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true, index: true },
  eventType: { type: String, enum: ['CREATED', 'STATUS_CHANGED'], required: true },
  actor: {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    role: { type: String, default: 'guest' },
  },
  payload: { type: Object, default: {} },
  requestId: { type: String, required: true },
}, { timestamps: true });

module.exports = mongoose.model('BookingEvent', bookingEventSchema);