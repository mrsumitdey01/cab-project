# SLO and Reliability Targets

## Availability
- API monthly uptime target: 99.9%.

## Latency
- Read APIs p95 < 300ms.
- Write APIs p95 < 500ms.

## Error Budget
- Monthly error budget: 43.2 minutes.
- Freeze non-critical releases when error budget burn > 50% mid-month.

## Monitoring Signals
- Request volume, error rate, p95 latency, DB readiness, auth failures.