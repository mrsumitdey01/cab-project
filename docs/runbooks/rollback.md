# Rollback Runbook

## Triggers
- Error budget breach.
- Health probe failure post deploy.
- Critical regression in booking or auth flows.

## Steps
1. Stop traffic to current release.
2. Deploy previous known-good image tag.
3. Validate `/health/ready`.
4. Run smoke checks: login, create booking, list bookings.
5. Re-open traffic and monitor 30 minutes.