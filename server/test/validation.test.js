const test = require('node:test');
const assert = require('node:assert/strict');
const { validateBookingPayload } = require('../utils/validation');

test('validateBookingPayload accepts valid payload', () => {
  const payload = {
    tripType: 'ONE_WAY',
    pickup: { address: 'Airport Road' },
    dropoff: { address: 'City Center' },
    schedule: { pickupDate: '2026-03-01', pickupTime: '10:30' },
  };

  const result = validateBookingPayload(payload);
  assert.equal(result.valid, true);
  assert.deepEqual(result.errors, []);
});

test('validateBookingPayload rejects missing fields and invalid type', () => {
  const payload = {
    tripType: 'UNKNOWN',
    pickup: { address: '' },
    schedule: { pickupDate: 'bad-date', pickupTime: '' },
  };

  const result = validateBookingPayload(payload);
  assert.equal(result.valid, false);
  assert.ok(result.errors.length >= 4);
});
