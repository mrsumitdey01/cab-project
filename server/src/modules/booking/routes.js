const express = require('express');
const { success } = require('../../lib/response');
const { validate, z } = require('../../middleware/validate');
const { authenticate, requireRole } = require('../../middleware/auth');
const bookingService = require('./service');
const { bookingCreateSchema, bookingStatusSchema } = require('./schemas');

function createBookingRouter(config) {
  const router = express.Router();

  const idParamSchema = z.object({ id: z.string().min(12) });

  router.post('/', authenticate(config), validate(bookingCreateSchema), async (req, res, next) => {
    try {
      const idempotencyKey = req.headers['idempotency-key'];
      const result = await bookingService.createBooking(
        req.body,
        { userId: req.user.sub, role: req.user.role, email: req.user.email },
        res.locals.requestId,
        typeof idempotencyKey === 'string' ? idempotencyKey : null
      );

      return success(res, result, { status: result.replayed ? result.replayStatus : 201 });
    } catch (err) {
      return next(err);
    }
  });

  router.get('/', authenticate(config), async (req, res, next) => {
    try {
      const bookings = await bookingService.listBookings({ userId: req.user.sub, role: req.user.role });
      return success(res, { bookings });
    } catch (err) {
      return next(err);
    }
  });

  router.get('/:id', authenticate(config), validate(idParamSchema, 'params'), async (req, res, next) => {
    try {
      const booking = await bookingService.getBookingById(req.params.id, { userId: req.user.sub, role: req.user.role });
      return success(res, { booking });
    } catch (err) {
      return next(err);
    }
  });

  router.patch('/:id/status', authenticate(config), requireRole('admin'), validate(idParamSchema, 'params'), validate(bookingStatusSchema), async (req, res, next) => {
    try {
      const booking = await bookingService.updateBookingStatus(
        req.params.id,
        req.body.status,
        { userId: req.user.sub, role: req.user.role, email: req.user.email },
        res.locals.requestId
      );
      return success(res, { booking });
    } catch (err) {
      return next(err);
    }
  });

  return router;
}

module.exports = { createBookingRouter };
