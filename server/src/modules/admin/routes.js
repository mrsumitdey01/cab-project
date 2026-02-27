const express = require('express');
const { success } = require('../../lib/response');
const { getMetricsSnapshot } = require('../../lib/metrics');
const AuditLog = require('../../../models/AuditLog');
const RouteOption = require('../../../models/RouteOption');
const CabOption = require('../../../models/CabOption');
const { authenticate, requireRole } = require('../../middleware/auth');

function createAdminRouter(config) {
  const router = express.Router();

  router.use(authenticate(config), requireRole('admin'));

  router.get('/health-summary', async (req, res, next) => {
    try {
      const [auditCount] = await Promise.all([AuditLog.countDocuments({})]);
      return success(res, {
        status: 'ok',
        dbReady: config.isDbReady(),
        metrics: getMetricsSnapshot(),
        auditCount,
      });
    } catch (err) {
      return next(err);
    }
  });

  router.get('/audit-logs', async (req, res, next) => {
    try {
      const page = Number(req.query.page || 1);
      const pageSize = Math.min(100, Number(req.query.pageSize || 20));
      const skip = (page - 1) * pageSize;

      const [logs, total] = await Promise.all([
        AuditLog.find({}).sort({ createdAt: -1 }).skip(skip).limit(pageSize),
        AuditLog.countDocuments({}),
      ]);

      return success(res, { logs }, { meta: { page, pageSize, total } });
    } catch (err) {
      return next(err);
    }
  });

  router.get('/routes', async (req, res, next) => {
    try {
      const routes = await RouteOption.find({}).sort({ createdAt: -1 });
      return success(res, { routes });
    } catch (err) {
      return next(err);
    }
  });

  router.post('/routes', async (req, res, next) => {
    try {
      const { fromHub, toHub, flatRate } = req.body || {};
      const label = `${fromHub} → ${toHub}`;
      const route = await RouteOption.create({ fromHub, toHub, flatRate, label });
      await AuditLog.create({
        action: 'ROUTE_CREATED',
        actor: {
          userId: req.user.sub,
          role: req.user.role,
          email: req.user.email,
        },
        target: { type: 'route', id: route._id },
        metadata: { fromHub, toHub, flatRate },
        requestId: res.locals.requestId,
      });
      return success(res, { route }, { status: 201 });
    } catch (err) {
      return next(err);
    }
  });

  router.get('/cabs', async (req, res, next) => {
    try {
      const cabs = await CabOption.find({}).sort({ createdAt: -1 });
      return success(res, { cabs });
    } catch (err) {
      return next(err);
    }
  });

  router.post('/cabs', async (req, res, next) => {
    try {
      const { cabType, carModel, multiplier, availableFrom, availableTo } = req.body || {};
      const cab = await CabOption.create({
        cabType,
        carModel,
        multiplier,
        availableFrom: availableFrom ? new Date(availableFrom) : null,
        availableTo: availableTo ? new Date(availableTo) : null,
      });
      await AuditLog.create({
        action: 'CAB_CREATED',
        actor: {
          userId: req.user.sub,
          role: req.user.role,
          email: req.user.email,
        },
        target: { type: 'cab', id: cab._id },
        metadata: { cabType, carModel, multiplier, availableFrom, availableTo },
        requestId: res.locals.requestId,
      });
      return success(res, { cab }, { status: 201 });
    } catch (err) {
      return next(err);
    }
  });

  router.get('/booking-alerts', async (req, res, next) => {
    try {
      const since = req.query.since ? new Date(req.query.since) : new Date(Date.now() - 15 * 60 * 1000);
      const Booking = require('../../../models/Booking');
      const count = await Booking.countDocuments({ createdAt: { $gte: since } });
      return success(res, { since, count });
    } catch (err) {
      return next(err);
    }
  });

  return router;
}

module.exports = { createAdminRouter };
