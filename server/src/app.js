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
      const defaultOrigins = ['http://localhost:3000', 'https://cab-project-frontend.onrender.com'];
      const allowedOrigins = (process.env.ALLOWED_ORIGINS || config.clientUrls.join(',') || defaultOrigins.join(','))
        .split(',')
        .map((url) => url.trim())
        .filter(Boolean);

      if (!origin || allowedOrigins.includes(origin)) {
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

  app.get('/health', (req, res) => {
    res.status(200).json({ status: 'UP', message: 'Server is active' });
  });
  app.get('/api/v1/health', (req, res) => {
    res.status(200).json({ status: 'UP', message: 'Server is active' });
  });

  app.use('/health', createHealthRouter(config));
  app.use('/api/v1', createV1Router(config));
  app.use('/api/bookings', createLegacyBookingRouter());

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

module.exports = { createApp };
