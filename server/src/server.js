const { loadConfig } = require('./lib/config');
const { connectDb } = require('./lib/db');
const logger = require('./lib/logger');
const { createApp } = require('./app');

async function startServer() {
  const config = loadConfig();
  await connectDb();

  const app = createApp(config);
  const port = Number(process.env.PORT || config.port || 5000);
  app.listen(port, () => {
    logger.info('Server started', { port, env: config.nodeEnv });
  });
}

module.exports = { startServer };
