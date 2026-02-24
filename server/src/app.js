const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');

const { requestIdMiddleware } = require('./middleware/requestId');
const { metricsMiddleware } = require('./lib/metrics');
const { errorHandler } = require('./middleware/errorHandler');
const { notFoundHandler } = require('./middleware/notFound');
const { createHealthRouter } = require('./modules/health/routes');
const { createV1Router } = require('./routes/v1');
const { createLegacyBookingRouter } = require('./routes/legacy');

function createApp(config) {
  const app = express();

  app.use(helmet());
  app.use(cors({
    origin(origin, callback) {
      if (!origin || config.clientUrls.includes(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: false,
  }));
  app.use(express.json({ limit: '1mb' }));
  app.use(requestIdMiddleware);
  app.use(metricsMiddleware);
  app.use(morgan(config.nodeEnv === 'production' ? 'combined' : 'dev'));

  app.use('/health', createHealthRouter(config));
  app.use('/api/v1', createV1Router(config));
  app.use('/api/bookings', createLegacyBookingRouter());

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

module.exports = { createApp };