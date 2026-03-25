const express = require('express');
const { success } = require('../../lib/response');
const { validate } = require('../../middleware/validate');
const { bookingCreateSchema, publicBookingSchema } = require('./schemas');
const bookingService = require('./service');
const CorporateEnquiry = require('../../../models/CorporateEnquiry');
const SiteContent = require('../../../models/SiteContent');
const { buildSiteContentPayload } = require('../siteContent/defaults');

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

  router.post('/corporate-enquiries', async (req, res, next) => {
    try {
      const { company, contactName, email, phone, city, rides, requirements } = req.body || {};
      const enquiry = await CorporateEnquiry.create({
        company,
        contactName,
        email,
        phone,
        city,
        rides,
        requirements,
      });
      // await AuditLog.create({
      //   action: 'CORPORATE_ENQUIRY_SUBMITTED',
      //   actor: {
      //     userId: null,
      //     role: 'guest',
      //     email: email || 'corporate@guest.local',
      //   },
      //   target: { type: 'corporate-enquiry', id: enquiry._id },
      //   metadata: { company, contactName, email, phone, city, rides, requirements },
      //   requestId: res.locals.requestId,
      // });

      return success(res, {
        enquiry,
        received: true,
        message: 'Corporate enquiry submitted successfully.',
      }, { status: 201 });
    } catch (err) {
      return next(err);
    }
  });

  router.get('/site-content', async (req, res, next) => {
    try {
      let siteContent = await SiteContent.findOne({ key: 'primary' }).lean();
      if (!siteContent) {
        siteContent = await SiteContent.create({ key: 'primary', ...buildSiteContentPayload() });
        siteContent = siteContent.toObject();
      }

      return success(res, {
        footer: buildSiteContentPayload(siteContent).footer,
        popularRoutes: buildSiteContentPayload(siteContent).popularRoutes,
      });
    } catch (err) {
      return next(err);
    }
  });

  return router;
}

module.exports = { createPublicRouter };
