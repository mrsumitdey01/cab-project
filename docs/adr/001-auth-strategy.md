# ADR-001: Authentication Strategy

- Status: Accepted
- Date: 2026-02-24

## Decision
Use JWT access tokens (short TTL) and refresh token rotation persisted in MongoDB.

## Rationale
- Stateless access checks for API performance.
- Server-side revocation for refresh tokens.

## Consequences
- Requires secure secret management and clock synchronization.
- Requires token rotation and revocation workflows.