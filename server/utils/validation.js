const VALID_TRIP_TYPES = ['ONE_WAY', 'ROUND_TRIP', 'AIRPORT', 'HOURLY'];

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function validateBookingPayload(payload) {
  const errors = [];
  const data = payload || {};

  if (!VALID_TRIP_TYPES.includes(data.tripType)) {
    errors.push('tripType is invalid.');
  }

  if (!data.pickup || !isNonEmptyString(data.pickup.address)) {
    errors.push('pickup.address is required.');
  }

  if (!data.dropoff || !isNonEmptyString(data.dropoff.address)) {
    errors.push('dropoff.address is required.');
  }

  if (!data.schedule || !isNonEmptyString(data.schedule.pickupDate)) {
    errors.push('schedule.pickupDate is required.');
  }

  if (!data.schedule || !isNonEmptyString(data.schedule.pickupTime)) {
    errors.push('schedule.pickupTime is required.');
  }

  if (data.schedule && isNonEmptyString(data.schedule.pickupDate)) {
    const parsedDate = new Date(data.schedule.pickupDate);
    if (Number.isNaN(parsedDate.getTime())) {
      errors.push('schedule.pickupDate must be a valid date.');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

module.exports = {
  VALID_TRIP_TYPES,
  validateBookingPayload,
};
