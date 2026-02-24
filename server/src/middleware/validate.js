const { z } = require('zod');
const { ApiError } = require('../lib/errors');

function validate(schema, pick = 'body') {
  return (req, res, next) => {
    const payload = req[pick];
    const result = schema.safeParse(payload);

    if (!result.success) {
      return next(new ApiError({
        status: 400,
        title: 'Validation Error',
        detail: 'Input validation failed.',
        code: 'validation_error',
        fieldErrors: result.error.issues.map((issue) => ({
          path: issue.path.join('.'),
          message: issue.message,
        })),
      }));
    }

    req[pick] = result.data;
    next();
  };
}

module.exports = { validate, z };