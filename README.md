# Cab Platform Pro

Production-grade cab booking platform with React + Express + MongoDB.

## Highlights
- Versioned API (`/api/v1`) with backward-compatible legacy booking route (`/api/bookings`).
- AuthN/AuthZ: register/login/refresh/logout with JWT + refresh rotation.
- RBAC: `user` and `admin` roles.
- Booking reliability: schema validation, status transition rules, idempotent booking create.
- Auditability: immutable booking events + admin audit logs.
- Health probes: `/health/live`, `/health/ready`.
- CI pipeline, Dockerfiles, reverse proxy config, runbooks, ADRs, OpenAPI skeleton.

## Quick Start

### 1) Server
```bash
npm install
cd server
cp .env.example .env
npm install
npm run migrate:indexes
npm run seed-admin
npm run dev
```

### 2) Client
```bash
cd client
cp .env.example .env
npm install
npm start
```

### 3) Docker Compose
```bash
docker compose up --build
```

## Default API Endpoints
- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/refresh`
- `POST /api/v1/auth/logout`
- `POST /api/v1/bookings`
- `GET /api/v1/bookings`
- `GET /api/v1/bookings/:id`
- `PATCH /api/v1/bookings/:id/status` (admin)
- `GET /api/v1/admin/health-summary` (admin)
- `GET /api/v1/admin/audit-logs` (admin)
- `GET /api/v1/admin/booking-alerts` (admin)
- `POST /api/bookings` (legacy compatibility)

## Admin Credentials (Default)
- Email: `admin@rideeasy.local`
- Password: `Admin123!`

## Public Search and Guest Booking
- Landing page `/` allows search without login.
- Booking requires details and saves as guest in DB.
- Admin dashboard shows new booking alerts.

## Testing and Quality
```bash
cd server && npm run lint && npm test
cd client && npm run lint && npm test && npm run build
```

## Docs
- `docs/adr/`
- `docs/runbooks/`
- `docs/slo-sli.md`
- `docs/monitoring-alerting.md`
- `server/openapi/openapi.yaml`
