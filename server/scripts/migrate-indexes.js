require('dotenv').config();
const { loadConfig } = require('../src/lib/config');
const { connectDb, disconnectDb } = require('../src/lib/db');
const Booking = require('../models/Booking');
const BookingEvent = require('../models/BookingEvent');
const AuditLog = require('../models/AuditLog');
const IdempotencyKey = require('../models/IdempotencyKey');
const User = require('../models/User');
const RefreshToken = require('../models/RefreshToken');

async function run() {
  const config = loadConfig();
  await connectDb(config.mongoUri);

  await Promise.all([
    Booking.syncIndexes(),
    BookingEvent.syncIndexes(),
    AuditLog.syncIndexes(),
    IdempotencyKey.syncIndexes(),
    User.syncIndexes(),
    RefreshToken.syncIndexes(),
  ]);

  console.log('Indexes synced successfully.');
  await disconnectDb();
}

run().catch(async (err) => {
  console.error('Migration failed:', err);
  try {
    await disconnectDb();
  } catch (_) {
    // ignore
  }
  process.exit(1);
});