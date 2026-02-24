# Secret Rotation Runbook

## Scope
JWT secrets, DB credentials, API keys.

## Steps
1. Generate new secrets in secret manager.
2. Deploy with dual validation window if required.
3. Revoke old refresh tokens after rollout.
4. Restart services with new env vars.
5. Verify auth and DB health.