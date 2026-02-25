const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null, index: true },
    tripType: { type: String, enum: ['ONE_WAY', 'ROUND_TRIP', 'AIRPORT', 'HOURLY'], required: true },
    pickup: {
        address: { type: String, required: true, trim: true },
        coordinates: { lat: Number, lng: Number }
    },
    dropoff: {
        address: { type: String, required: true, trim: true },
        coordinates: { lat: Number, lng: Number }
    },
    schedule: {
        pickupDate: { type: Date, required: true },
        pickupTime: { type: String, required: true }
    },
    contact: {
        name: { type: String, default: '' },
        email: { type: String, default: '' },
        phone: { type: String, default: '' }
    },
    selection: {
        route: { type: String, default: '' },
        cabType: { type: String, default: '' },
        carModel: { type: String, default: '' }
    },
    fare: {
        totalAmount: { type: Number, required: true, min: 0 }
    },
    status: { type: String, enum: ['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED'], default: 'PENDING' }
}, { timestamps: true });

bookingSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Booking', bookingSchema);
