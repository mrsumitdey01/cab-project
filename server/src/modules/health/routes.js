const express = require('express');
const { success } = require('../../lib/response');

function createHealthRouter(config) {
  const router = express.Router();

  router.get('/live', (req, res) => {
    return success(res, { status: 'alive' });
  });

  router.get('/ready', (req, res) => {
    const dbReady = config.isDbReady();
    return success(res, {
      status: dbReady ? 'ready' : 'degraded',
      dbReady,
    });
  });

  return router;
}

module.exports = { createHealthRouter };