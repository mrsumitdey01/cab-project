const test = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const { createApp } = require('../src/app');
const { searchOptions } = require('../src/modules/booking/service');

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

test('POST /api/v1/public/search returns 200 even if empty', async () => {
  const app = createApp(makeConfig());
  const original = searchOptions;

  // Temporarily stub to avoid DB dependency in CI.
  const service = require('../src/modules/booking/service');
  service.searchOptions = async () => ({ routes: [], cabs: [] });

  const res = await request(app)
    .post('/api/v1/public/search')
    .send({
      tripType: 'ONE_WAY',
      pickup: { address: 'AAA' },
      dropoff: { address: 'BBB' },
      schedule: { pickupDate: '2026-03-01', pickupTime: '10:00' },
    });

  assert.equal(res.status, 200);
  assert.deepEqual(res.body.data.routes, []);
  assert.deepEqual(res.body.data.cabs, []);

  service.searchOptions = original;
});
