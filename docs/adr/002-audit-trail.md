# ADR-002: Audit Trail Model

- Status: Accepted
- Date: 2026-02-24

## Decision
Persist immutable booking events and admin audit logs in dedicated collections.

## Rationale
- Enables forensic traceability and operational debugging.
- Supports admin accountability and compliance readiness.

## Consequences
- Increased write volume and storage requirements.
- Requires index and retention strategy.