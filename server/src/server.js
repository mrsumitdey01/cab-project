const { loadConfig } = require('./lib/config');
const { connectDb } = require('./lib/db');
const logger = require('./lib/logger');
const { createApp } = require('./app');

async function startServer() {
  const config = loadConfig();
  await connectDb(config.mongoUri);

  const app = createApp(config);
  app.listen(config.port, () => {
    logger.info('Server started', { port: config.port, env: config.nodeEnv });
  });
}

module.exports = { startServer };