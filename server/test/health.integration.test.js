const test = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const { createApp } = require('../src/app');

function makeConfig(dbReady) {
  return {
    nodeEnv: 'test',
    clientUrls: ['http://localhost:3000'],
    jwtAccessSecret: 'access',
    jwtRefreshSecret: 'refresh',
    accessTokenTtl: '15m',
    refreshTokenTtl: '7d',
    isDbReady: () => dbReady,
  };
}

test('GET /health/live returns alive', async () => {
  const app = createApp(makeConfig(false));
  const res = await request(app).get('/health/live');

  assert.equal(res.status, 200);
  assert.equal(res.body.success, true);
  assert.equal(res.body.data.status, 'alive');
  assert.ok(res.body.requestId);
});

test('GET /health/ready reflects readiness state', async () => {
  const app = createApp(makeConfig(true));
  const res = await request(app).get('/health/ready');

  assert.equal(res.status, 200);
  assert.equal(res.body.data.dbReady, true);
  assert.equal(res.body.data.status, 'ready');
});