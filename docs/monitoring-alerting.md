# Monitoring and Alerting

## Core Alerts
- API 5xx rate > 2% for 5 minutes.
- p95 latency > 500ms for write endpoints.
- Auth failure rate > baseline + 3x.
- `/health/ready` failing for 2 consecutive checks.

## Dashboard Panels
- Requests per minute by route.
- Error rate and status code distribution.
- p50/p95/p99 latency.
- MongoDB connectivity/readiness.
- Booking create success rate.

## Operational Drill
- Trigger synthetic 500 error.
- Validate alert notification and escalation path.
- Verify MTTR under 10 minutes.