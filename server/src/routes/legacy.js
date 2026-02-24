const express = require('express');
const { validate } = require('../middleware/validate');
const { bookingCreateSchema } = require('../modules/booking/schemas');
const bookingService = require('../modules/booking/service');

function createLegacyBookingRouter() {
  const router = express.Router();

  router.post('/', validate(bookingCreateSchema), async (req, res, next) => {
    try {
      const idempotencyKey = req.headers['idempotency-key'];
      const result = await bookingService.createBooking(
        req.body,
        { userId: null, role: 'guest', email: 'guest@local' },
        res.locals.requestId,
        typeof idempotencyKey === 'string' ? idempotencyKey : null
      );
      return res.status(201).json({
        success: true,
        data: result.booking,
        error: null,
        meta: { compatibility: 'legacy_route' },
        requestId: res.locals.requestId,
      });
    } catch (err) {
      return next(err);
    }
  });

  return router;
}

module.exports = { createLegacyBookingRouter };