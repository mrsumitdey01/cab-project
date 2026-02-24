# Backup and Restore Runbook

## Backup Policy
- MongoDB snapshots every 15 minutes.
- Daily full backup retained for 30 days.

## Restore Procedure
1. Provision restore environment.
2. Restore latest consistent snapshot.
3. Run data integrity checks on bookings and audit collections.
4. Cut traffic after smoke validation.

## Targets
- RPO <= 15 minutes.
- RTO <= 60 minutes.