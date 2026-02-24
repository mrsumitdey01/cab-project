const { ApiError } = require('../lib/errors');

function notFoundHandler(req, res, next) {
  next(new ApiError({
    status: 404,
    title: 'Not Found',
    detail: `Route ${req.method} ${req.originalUrl} not found`,
    code: 'route_not_found',
  }));
}

module.exports = { notFoundHandler };