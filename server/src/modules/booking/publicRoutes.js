const express = require('express');
const { success } = require('../../lib/response');
const { validate } = require('../../middleware/validate');
const { bookingCreateSchema, publicBookingSchema } = require('./schemas');
const bookingService = require('./service');

function createPublicRouter(_config) {
  const router = express.Router();

  router.post('/search', validate(bookingCreateSchema), async (req, res, _next) => {
    try {
      const results = await bookingService.searchOptions(req.body);
      if (!results.routes?.length || !results.cabs?.length) {
        return success(res, { ...results, message: 'No cabs found for this route' });
      }
      return success(res, results);
    } catch (err) {
      return success(res, { routes: [], cabs: [], message: 'No cabs found for this route' });
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
