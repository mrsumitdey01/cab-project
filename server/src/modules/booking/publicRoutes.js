const express = require('express');
const { success } = require('../../lib/response');
const { validate } = require('../../middleware/validate');
const { bookingCreateSchema, publicBookingSchema } = require('./schemas');
const bookingService = require('./service');

function createPublicRouter(_config) {
  const router = express.Router();

  router.post('/search', validate(bookingCreateSchema), async (req, res, next) => {
    try {
      const results = await bookingService.searchOptions(req.body);
      return success(res, results);
    } catch (err) {
      return next(err);
    }
  });

  router.post('/bookings', validate(publicBookingSchema), async (req, res, next) => {
    try {
      const idempotencyKey = req.headers['idempotency-key'];
      const result = await bookingService.createBooking(
        req.body,
        { userId: null, role: 'guest', email: req.body?.contact?.email || 'guest@local' },
        res.locals.requestId,
        typeof idempotencyKey === 'string' ? idempotencyKey : null
      );

      return success(res, result, { status: result.replayed ? result.replayStatus : 201 });
    } catch (err) {
      return next(err);
    }
  });

  return router;
}

module.exports = { createPublicRouter };
