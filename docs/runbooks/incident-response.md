# Incident Response Runbook

## Detection
- Triggered by alert on 5xx spike, high latency, auth failure spikes, or readiness failures.

## Triage
1. Check `/health/ready` and `/health/live`.
2. Inspect request-scoped logs using `x-request-id`.
3. Identify failing dependency (DB, auth, network).

## Mitigation
1. Roll back latest deployment.
2. Scale service if resource saturation.
3. Rotate secrets if auth compromise suspected.

## Recovery
1. Confirm SLO metrics stabilize.
2. Capture timeline and root cause.
3. Publish postmortem with action items.