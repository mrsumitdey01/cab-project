require('dotenv').config();
const { loadConfig } = require('../src/lib/config');
const { connectDb, disconnectDb } = require('../src/lib/db');
const User = require('../models/User');

async function run() {
  const email = process.argv[2];
  if (!email) {
    console.error('Usage: node scripts/promote-admin.js <email>');
    process.exit(1);
  }

  const config = loadConfig();
  await connectDb(config.mongoUri);

  const user = await User.findOneAndUpdate(
    { email: email.toLowerCase() },
    { $set: { role: 'admin' } },
    { new: true }
  );

  if (!user) {
    console.error('User not found:', email);
    process.exit(1);
  }

  console.log(`Promoted ${user.email} to admin`);
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