const test = require('node:test');
const assert = require('node:assert/strict');
const { hashToken, signAccessToken, signRefreshToken, verifyRefreshToken } = require('../src/modules/auth/tokens');

const config = {
  jwtAccessSecret: 'test_access_secret',
  jwtRefreshSecret: 'test_refresh_secret',
  accessTokenTtl: '15m',
  refreshTokenTtl: '1d',
};

test('hashToken returns deterministic digest', () => {
  const a = hashToken('abc');
  const b = hashToken('abc');
  assert.equal(a, b);
  assert.notEqual(a, hashToken('abcd'));
});

test('sign and verify refresh token', () => {
  const payload = { sub: 'user123', role: 'user', email: 'a@b.com' };
  const access = signAccessToken(payload, config);
  const refresh = signRefreshToken(payload, config);

  assert.ok(typeof access === 'string' && access.length > 20);
  assert.ok(typeof refresh === 'string' && refresh.length > 20);

  const decoded = verifyRefreshToken(refresh, config);
  assert.equal(decoded.sub, 'user123');
  assert.equal(decoded.role, 'user');
});