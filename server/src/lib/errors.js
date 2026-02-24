class ApiError extends Error {
  constructor({ status = 500, title = 'Internal Server Error', detail = 'Unexpected error.', code = 'internal_error', fieldErrors = [] } = {}) {
    super(detail);
    this.status = status;
    this.title = title;
    this.detail = detail;
    this.code = code;
    this.fieldErrors = fieldErrors;
  }
}

module.exports = { ApiError };