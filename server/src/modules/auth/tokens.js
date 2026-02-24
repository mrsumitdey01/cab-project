const jwt = require('jsonwebtoken');
const crypto = require('crypto');

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function signAccessToken(payload, config) {
  return jwt.sign(payload, config.jwtAccessSecret, { expiresIn: config.accessTokenTtl });
}

function signRefreshToken(payload, config) {
  return jwt.sign(payload, config.jwtRefreshSecret, { expiresIn: config.refreshTokenTtl });
}

function verifyRefreshToken(token, config) {
  return jwt.verify(token, config.jwtRefreshSecret);
}

module.exports = { hashToken, signAccessToken, signRefreshToken, verifyRefreshToken };