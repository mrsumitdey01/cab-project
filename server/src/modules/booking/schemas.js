const { z } = require('../../middleware/validate');

const tripTypes = ['ONE_WAY', 'ROUND_TRIP', 'AIRPORT', 'HOURLY'];
const statuses = ['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED'];

const bookingCreateSchema = z.object({
  tripType: z.enum(tripTypes),
  pickup: z.object({
    address: z.string().min(3),
  }),
  dropoff: z.object({
    address: z.string().min(3),
  }),
  schedule: z.object({
    pickupDate: z.string().min(8),
    pickupTime: z.string().min(4),
  }),
  contact: z.object({
    name: z.string().min(2).optional(),
    email: z.string().email().optional(),
    phone: z.string().regex(/^[+]?[0-9]{7,13}$/).optional(),
  }).optional(),
  selection: z.object({
    route: z.string().min(2).optional(),
    cabType: z.string().min(2).optional(),
    carModel: z.string().min(2).optional(),
    multiplier: z.number().optional(),
    fromHub: z.string().min(2).optional(),
    toHub: z.string().min(2).optional(),
  }).optional(),
});

const publicBookingSchema = bookingCreateSchema.extend({
  contact: z.object({
    name: z.string().min(2),
    email: z.string().email(),
    phone: z.string().regex(/^[+]?[0-9]{7,13}$/),
  }),
});

const bookingStatusSchema = z.object({
  status: z.enum(statuses),
});

module.exports = { bookingCreateSchema, bookingStatusSchema, publicBookingSchema, statuses };
