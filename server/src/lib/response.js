function success(res, data, options = {}) {
  const { status = 200, meta } = options;
  return res.status(status).json({
    success: true,
    data,
    error: null,
    meta: meta || null,
    requestId: res.locals.requestId || null,
  });
}

function problem(res, err) {
  const status = err.status || 500;
  return res.status(status).json({
    success: false,
    data: null,
    error: {
      type: `https://httpstatuses.com/${status}`,
      title: err.title || 'Internal Server Error',
      status,
      detail: err.detail || 'Unexpected error.',
      code: err.code || 'internal_error',
      fieldErrors: err.fieldErrors || [],
    },
    meta: null,
    requestId: res.locals.requestId || null,
  });
}

module.exports = { success, problem };