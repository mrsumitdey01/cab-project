const mongoose = require('mongoose');
const logger = require('./logger');

async function connectDb(uri) {
  await mongoose.connect(uri);
  logger.info('MongoDB connected');
}

async function disconnectDb() {
  await mongoose.disconnect();
}

module.exports = { connectDb, disconnectDb, mongoose };