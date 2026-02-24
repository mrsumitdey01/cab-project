# ADR-003: Deployment Strategy

- Status: Accepted
- Date: 2026-02-24

## Decision
Deploy containerized client and server on cloud VM behind reverse proxy.

## Rationale
- Predictable runtime parity across environments.
- Simpler operational path than early Kubernetes adoption.

## Consequences
- Manual scaling constraints until orchestration migration.
- Requires VM hardening and backup strategy.