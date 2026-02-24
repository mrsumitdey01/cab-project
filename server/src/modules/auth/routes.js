const express = require('express');
const { success } = require('../../lib/response');
const { validate } = require('../../middleware/validate');
const { authLimiter } = require('../../middleware/rateLimit');
const { registerSchema, loginSchema, refreshSchema } = require('./schemas');
const authService = require('./service');

function createAuthRouter(config) {
  const router = express.Router();

  router.post('/register', authLimiter, validate(registerSchema), async (req, res, next) => {
    try {
      const session = await authService.register(req.body, config);
      return success(res, session, { status: 201 });
    } catch (err) {
      return next(err);
    }
  });

  router.post('/login', authLimiter, validate(loginSchema), async (req, res, next) => {
    try {
      const session = await authService.login(req.body, config);
      return success(res, session);
    } catch (err) {
      return next(err);
    }
  });

  router.post('/refresh', validate(refreshSchema), async (req, res, next) => {
    try {
      const session = await authService.refresh(req.body.refreshToken, config);
      return success(res, session);
    } catch (err) {
      return next(err);
    }
  });

  router.post('/logout', validate(refreshSchema), async (req, res, next) => {
    try {
      const result = await authService.logout(req.body.refreshToken);
      return success(res, result);
    } catch (err) {
      return next(err);
    }
  });

  return router;
}

module.exports = { createAuthRouter };