require('dotenv').config();
const bcrypt = require('bcryptjs');
const { loadConfig } = require('../src/lib/config');
const { connectDb, disconnectDb } = require('../src/lib/db');
const User = require('../models/User');

async function run() {
  const email = process.env.ADMIN_EMAIL || 'admin@rideeasy.local';
  const password = process.env.ADMIN_PASSWORD || 'Admin123!';
  const name = process.env.ADMIN_NAME || 'Platform Admin';

  const config = loadConfig();
  await connectDb(config.mongoUri);

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    console.log('Admin already exists:', existing.email);
    await disconnectDb();
    return;
  }

  const passwordHash = await bcrypt.hash(password, config.bcryptRounds);
  await User.create({ name, email: email.toLowerCase(), passwordHash, role: 'admin' });

  console.log(`Admin created: ${email}`);
  await disconnectDb();
}

run().catch(async (err) => {
  console.error('Failed:', err);
  try {
    await disconnectDb();
  } catch (_) {
    // ignore
  }
  process.exit(1);
});