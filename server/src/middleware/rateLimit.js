const rateLimit = require('express-rate-limit');

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    data: null,
    error: {
      title: 'Too Many Requests',
      detail: 'Too many auth attempts, try again later.',
      status: 429,
      code: 'rate_limited',
      fieldErrors: [],
    },
    meta: null,
  },
});

module.exports = { authLimiter };