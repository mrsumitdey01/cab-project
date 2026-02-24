require('dotenv').config();
const { startServer } = require('./src/server');

startServer().catch((err) => {
  console.error('Fatal startup error:', err);
  process.exit(1);
});
