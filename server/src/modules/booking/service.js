const Booking = require('../../../models/Booking');
const BookingEvent = require('../../../models/BookingEvent');
const AuditLog = require('../../../models/AuditLog');
const IdempotencyKey = require('../../../models/IdempotencyKey');
const RouteOption = require('../../../models/RouteOption');
const CabOption = require('../../../models/CabOption');
const { ApiError } = require('../../lib/errors');

const ALLOWED_TRANSITIONS = {
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['CANCELLED'],
  CANCELLED: [],
};

async function createBooking(payload, actor, requestId, idempotencyKey) {
  const userId = actor?.userId || null;
  const endpoint = '/api/v1/bookings';

  if (idempotencyKey) {
    const previous = await IdempotencyKey.findOne({ key: idempotencyKey, userId, endpoint });
    if (previous) {
      return { replayed: true, ...previous.responseBody, replayStatus: previous.responseStatus };
    }
  }

  const fare = calculateFare(payload);
  const booking = await Booking.create({
    ...payload,
    pickup: { address: payload.pickup.address.trim() },
    dropoff: { address: payload.dropoff.address.trim() },
    schedule: {
      pickupDate: new Date(payload.schedule.pickupDate),
      pickupTime: payload.schedule.pickupTime,
    },
    fare: { totalAmount: fare },
    userId,
    contact: payload.contact || {},
    selection: payload.selection || {},
  });

  await BookingEvent.create({
    bookingId: booking._id,
    eventType: 'CREATED',
    actor: {
      userId,
      role: actor?.role || 'guest',
    },
    payload: {
      status: booking.status,
      tripType: booking.tripType,
    },
    requestId,
  });

  const responseBody = { booking };
  if (idempotencyKey) {
    await IdempotencyKey.create({
      key: idempotencyKey,
      userId,
      endpoint,
      responseStatus: 201,
      responseBody,
    });
  }

  return responseBody;
}

async function searchOptions(input) {
  const pickupDate = input?.schedule?.pickupDate ? new Date(input.schedule.pickupDate) : null;
  const hasDate = pickupDate && !Number.isNaN(pickupDate.getTime());

  const routes = await RouteOption.find({}).sort({ createdAt: -1 });
  const cabQuery = {};
  if (hasDate) {
    cabQuery.$and = [
      { $or: [{ availableFrom: null }, { availableFrom: { $lte: pickupDate } }] },
      { $or: [{ availableTo: null }, { availableTo: { $gte: pickupDate } }] },
    ];
  }
  const cabs = await CabOption.find(cabQuery).sort({ createdAt: -1 });

  return {
    pickup: input.pickup.address,
    dropoff: input.dropoff.address,
    tripType: input.tripType,
    routes: routes.map((route) => ({
      id: route._id,
      label: route.label,
      etaMinutes: route.etaMinutes,
      distanceKm: route.distanceKm,
      baseFare: route.baseFare,
    })),
    cabs: cabs.map((cab) => ({
      id: cab._id,
      cabType: cab.cabType,
      carModel: cab.carModel,
      multiplier: cab.multiplier,
      availableFrom: cab.availableFrom,
      availableTo: cab.availableTo,
    })),
  };
}

async function listBookings(actor) {
  if (actor.role === 'admin') {
    return Booking.find({}).sort({ createdAt: -1 }).limit(100);
  }

  return Booking.find({ userId: actor.userId }).sort({ createdAt: -1 }).limit(100);
}

async function getBookingById(id, actor) {
  const booking = await Booking.findById(id);
  if (!booking) {
    throw new ApiError({ status: 404, title: 'Not Found', detail: 'Booking not found.', code: 'booking_not_found' });
  }

  if (actor.role !== 'admin' && String(booking.userId) !== String(actor.userId)) {
    throw new ApiError({ status: 403, title: 'Forbidden', detail: 'Cannot access this booking.', code: 'booking_forbidden' });
  }

  return booking;
}

async function updateBookingStatus(id, status, actor, requestId) {
  const booking = await Booking.findById(id);
  if (!booking) {
    throw new ApiError({ status: 404, title: 'Not Found', detail: 'Booking not found.', code: 'booking_not_found' });
  }

  const allowed = ALLOWED_TRANSITIONS[booking.status] || [];
  if (!allowed.includes(status)) {
    throw new ApiError({
      status: 409,
      title: 'Conflict',
      detail: `Invalid status transition from ${booking.status} to ${status}.`,
      code: 'invalid_status_transition',
    });
  }

  const previousStatus = booking.status;
  booking.status = status;
  await booking.save();

  await BookingEvent.create({
    bookingId: booking._id,
    eventType: 'STATUS_CHANGED',
    actor: {
      userId: actor.userId,
      role: actor.role,
    },
    payload: {
      from: previousStatus,
      to: status,
    },
    requestId,
  });

  await AuditLog.create({
    action: 'BOOKING_STATUS_UPDATED',
    actor: {
      userId: actor.userId,
      role: actor.role,
      email: actor.email,
    },
    target: {
      type: 'booking',
      id: booking._id,
    },
    metadata: {
      from: previousStatus,
      to: status,
    },
    requestId,
  });

  return booking;
}

function calculateFare(payload) {
  const base = 100;
  const surge = payload.tripType === 'AIRPORT' ? 200 : 100;
  return base + surge;
}

module.exports = {
  createBooking,
  searchOptions,
  listBookings,
  getBookingById,
  updateBookingStatus,
};
