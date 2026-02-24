const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');
const { validateBookingPayload } = require('../utils/validation');

router.post('/', async (req, res) => {
    try {
        const validation = validateBookingPayload(req.body);
        if (!validation.valid) {
            return res.status(400).json({
                success: false,
                error: 'Invalid booking payload.',
                details: validation.errors
            });
        }

        const { pickup, dropoff, tripType, schedule } = req.body;
        const fare = 100 + Math.floor(Math.random() * 500); // Mock fare until pricing engine is integrated.
        const booking = new Booking({
            tripType,
            pickup: { address: pickup.address.trim() },
            dropoff: { address: dropoff.address.trim() },
            schedule: {
                pickupDate: new Date(schedule.pickupDate),
                pickupTime: schedule.pickupTime
            },
            fare: { totalAmount: fare }
        });
        await booking.save();
        res.status(201).json({ success: true, data: booking });
    } catch (err) {
        console.error('Booking creation failed:', err);
        res.status(500).json({ success: false, error: 'Internal server error.' });
    }
});

module.exports = router;
