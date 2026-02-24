const jwt = require('jsonwebtoken');
const { ApiError } = require('../lib/errors');

function authenticate(config) {
  return (req, res, next) => {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

    if (!token) {
      return next(new ApiError({
        status: 401,
        title: 'Unauthorized',
        detail: 'Missing access token.',
        code: 'missing_token',
      }));
    }

    try {
      req.user = jwt.verify(token, config.jwtAccessSecret);
      next();
    } catch (err) {
      next(new ApiError({
        status: 401,
        title: 'Unauthorized',
        detail: 'Invalid or expired access token.',
        code: 'invalid_token',
      }));
    }
  };
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(new ApiError({
        status: 403,
        title: 'Forbidden',
        detail: 'Insufficient permissions for this operation.',
        code: 'forbidden',
      }));
    }
    next();
  };
}

module.exports = { authenticate, requireRole };