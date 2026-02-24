const { ApiError } = require('../lib/errors');
const { problem } = require('../lib/response');
const logger = require('../lib/logger');

function errorHandler(err, req, res, _next) {
  const apiErr = err instanceof ApiError
    ? err
    : new ApiError({
        status: 500,
        title: 'Internal Server Error',
        detail: 'Unexpected server error.',
        code: 'internal_error',
      });

  logger.error('Request failed', {
    requestId: res.locals.requestId,
    path: req.path,
    method: req.method,
    status: apiErr.status,
    message: err.message,
  });

  return problem(res, apiErr);
}

module.exports = { errorHandler };
