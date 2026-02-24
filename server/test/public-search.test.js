const test = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const { createApp } = require('../src/app');

function makeConfig() {
  return {
    nodeEnv: 'test',
    clientUrls: ['http://localhost:3000'],
    jwtAccessSecret: 'access',
    jwtRefreshSecret: 'refresh',
    accessTokenTtl: '15m',
    refreshTokenTtl: '7d',
    isDbReady: () => true,
  };
}

test('POST /api/v1/public/search returns routes and cabs', async () => {
  const app = createApp(makeConfig());
  const res = await request(app)
    .post('/api/v1/public/search')
    .send({
      tripType: 'ONE_WAY',
      pickup: { address: 'AAA' },
      dropoff: { address: 'BBB' },
      schedule: { pickupDate: '2026-03-01', pickupTime: '10:00' },
    });

  assert.equal(res.status, 200);
  assert.ok(res.body.data.routes.length > 0);
  assert.ok(res.body.data.cabs.length > 0);
});
