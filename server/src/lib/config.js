const mongoose = require('mongoose');

function loadConfig() {
  const required = ['MONGO_URI', 'JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET'];
  for (const key of required) {
    if (!process.env[key]) {
      throw new Error(`Missing required environment variable: ${key}`);
    }
  }

  return {
    nodeEnv: process.env.NODE_ENV || 'development',
    port: Number(process.env.PORT || 5000),
    mongoUri: process.env.MONGO_URI,
    clientUrls: (process.env.CLIENT_URLS || process.env.CLIENT_URL || 'http://localhost:3000')
      .split(',')
      .map((url) => url.trim())
      .filter(Boolean),
    accessTokenTtl: process.env.JWT_ACCESS_TTL || '15m',
    refreshTokenTtl: process.env.JWT_REFRESH_TTL || '7d',
    jwtAccessSecret: process.env.JWT_ACCESS_SECRET,
    jwtRefreshSecret: process.env.JWT_REFRESH_SECRET,
    bcryptRounds: Number(process.env.BCRYPT_ROUNDS || 12),
    isTest: process.env.NODE_ENV === 'test',
    isDbReady: () => mongoose.connection.readyState === 1,
  };
}

module.exports = { loadConfig };