const { v4: uuidv4 } = require('uuid');

function requestIdMiddleware(req, res, next) {
  const requestId = req.headers['x-request-id'] || uuidv4();
  res.locals.requestId = requestId;
  res.setHeader('x-request-id', requestId);
  next();
}

module.exports = { requestIdMiddleware };