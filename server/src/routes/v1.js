const express = require('express');
const { createAuthRouter } = require('../modules/auth/routes');
const { createBookingRouter } = require('../modules/booking/routes');
const { createAdminRouter } = require('../modules/admin/routes');
const { createPublicRouter } = require('../modules/booking/publicRoutes');

function createV1Router(config) {
  const router = express.Router();

  router.use('/auth', createAuthRouter(config));
  router.use('/bookings', createBookingRouter(config));
  router.use('/public', createPublicRouter(config));
  router.use('/admin', createAdminRouter(config));

  return router;
}

module.exports = { createV1Router };
