const metricsStore = {
  requestsTotal: 0,
  requestsByRoute: {},
  errorsTotal: 0,
  avgLatencyMs: 0,
};

function metricsMiddleware(req, res, next) {
  metricsStore.requestsTotal += 1;
  const startedAt = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - startedAt;
    const key = `${req.method} ${req.route?.path || req.path}`;
    metricsStore.requestsByRoute[key] = (metricsStore.requestsByRoute[key] || 0) + 1;

    const n = metricsStore.requestsTotal;
    metricsStore.avgLatencyMs = Number(((metricsStore.avgLatencyMs * (n - 1) + duration) / n).toFixed(2));

    if (res.statusCode >= 500) {
      metricsStore.errorsTotal += 1;
    }
  });

  next();
}

function getMetricsSnapshot() {
  return {
    ...metricsStore,
    errorRate: metricsStore.requestsTotal
      ? Number((metricsStore.errorsTotal / metricsStore.requestsTotal).toFixed(4))
      : 0,
  };
}

module.exports = { metricsMiddleware, getMetricsSnapshot };