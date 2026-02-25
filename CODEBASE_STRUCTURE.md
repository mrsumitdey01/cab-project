# Cab Platform Pro - Codebase Structure Guide

## Quick Navigation Map

```
cab-project/
│
├── 📋 ROOT LEVEL
│   ├── docker-compose.yml         ← Orchestration (3 services: mongo, server, client)
│   ├── README.md                  ← Quick start guide
│   ├── run-all.ps1                ← PowerShell automation script
│   ├── setup-pro.js               ← Initial setup script
│   └── ARCHITECTURE.md            ← Full system documentation
│
├── 🖥️  CLIENT/ (React Frontend - Port 3000)
│   ├── src/
│   │   ├── App.js                 ← Root component + warmup logic
│   │   ├── index.js               ← Entry point
│   │   ├── index.css              ← Global Tailwind styles
│   │   ├── config.js              ← Client config constants
│   │   │
│   │   ├── app/                   ← App shell
│   │   │   ├── providers.jsx      ← Context providers wrapper
│   │   │   └── routes.jsx         ← Router + navbar (main layout)
│   │   │
│   │   ├── components/            ← Reusable components
│   │   │   └── CabBookingForm.jsx ← Booking form component
│   │   │
│   │   ├── features/              ← Feature modules
│   │   │   ├── auth/
│   │   │   │   ├── LoginPage.jsx
│   │   │   │   └── RegisterPage.jsx
│   │   │   ├── booking/
│   │   │   │   ├── PublicSearchPage.jsx    ← Landing page (search + guest book)
│   │   │   │   └── BookingPage.jsx         ← User bookings list
│   │   │   └── admin/
│   │   │       └── AdminPage.jsx           ← Admin dashboard
│   │   │
│   │   ├── shared/                ← Shared utilities
│   │   │   ├── api/
│   │   │   │   ├── endpoints.js   ← API functions (axios wrappers)
│   │   │   │   ├── http.js        ← Axios instance + interceptors
│   │   │   │   └── warmup.js      ← Server startup detection
│   │   │   ├── contexts/
│   │   │   │   ├── AuthContext.jsx     ← User auth state
│   │   │   │   └── WarmupContext.jsx   ← Server warmup state
│   │   │   ├── lib/
│   │   │   │   └── env.js         ← .env var parsing
│   │   │   └── ui/
│   │   │       ├── Alert.jsx      ← Notification component
│   │   │       └── ProtectedRoute.jsx ← Route guard HOC
│   │   │
│   │   └── context/               ← Legacy (deprecated)
│   │       └── BookingContext.js
│   │
│   ├── public/
│   │   └── index.html             ← HTML template
│   │
│   ├── build/                     ← Production build output
│   │   ├── index.html
│   │   └── static/
│   │       ├── css/
│   │       └── js/
│   │
│   ├── Dockerfile                 ← Multi-stage: build → nginx
│   ├── nginx.conf                 ← Nginx reverse proxy config
│   ├── package.json               ← npm dependencies
│   ├── postcss.config.js          ← PostCSS (Tailwind)
│   ├── tailwind.config.js         ← Tailwind config
│   └── .env.example               ← Environment template
│
├── 🚀 SERVER/ (Express Backend - Port 5000)
│   ├── src/
│   │   ├── app.js                 ← Express app factory
│   │   ├── server.js              ← Server entry point
│   │   │
│   │   ├── lib/                   ← Core utilities
│   │   │   ├── config.js          ← Config loader (env vars)
│   │   │   ├── db.js              ← MongoDB connection
│   │   │   ├── errors.js          ← ApiError class
│   │   │   ├── logger.js          ← Logging utilities
│   │   │   ├── metrics.js         ← Request metrics
│   │   │   └── response.js        ← Response formatting
│   │   │
│   │   ├── middleware/            ← Express middleware
│   │   │   ├── auth.js            ← JWT auth + role check
│   │   │   ├── errorHandler.js    ← Global error handler
│   │   │   ├── notFound.js        ← 404 handler
│   │   │   ├── rateLimit.js       ← Rate limiting
│   │   │   ├── requestId.js       ← Unique request ID injection
│   │   │   └── validate.js        ← Zod schema validation
│   │   │
│   │   ├── modules/               ← Feature modules
│   │   │   ├── auth/
│   │   │   │   ├── routes.js      ← /auth endpoints
│   │   │   │   ├── schemas.js     ← Zod validation schemas
│   │   │   │   ├── service.js     ← Login/register/refresh logic
│   │   │   │   └── tokens.js      ← JWT token management
│   │   │   │
│   │   │   ├── booking/
│   │   │   │   ├── routes.js      ← /bookings endpoints (auth)
│   │   │   │   ├── publicRoutes.js ← /public endpoints (no auth)
│   │   │   │   ├── schemas.js     ← Validation (Zod)
│   │   │   │   └── service.js     ← Booking logic
│   │   │   │
│   │   │   ├── admin/
│   │   │   │   └── routes.js      ← /admin/* endpoints
│   │   │   │
│   │   │   └── health/
│   │   │       └── routes.js      ← /health/* probes
│   │   │
│   │   ├── routes/                ← Router aggregation
│   │   │   ├── v1.js              ← /api/v1 router
│   │   │   └── legacy.js          ← /api/bookings (backward compat)
│   │   │
│   │   └── utils/
│   │       └── validation.js      ← Helper functions
│   │
│   ├── models/                    ← Mongoose schemas
│   │   ├── User.js                ← Users collection
│   │   ├── Booking.js             ← Bookings collection
│   │   ├── BookingEvent.js        ← Event sourcing log
│   │   ├── AuditLog.js            ← Admin actions audit trail
│   │   ├── RefreshToken.js        ← Token revocation tracking
│   │   ├── RouteOption.js         ← Available routes (ETA, fare)
│   │   ├── CabOption.js           ← Cab types (multipliers)
│   │   └── IdempotencyKey.js      ← Duplicate prevention
│   │
│   ├── scripts/                   ← CLI utilities
│   │   ├── migrate-indexes.js     ← Create DB indexes
│   │   ├── seed-admin.js          ← Create default admin user
│   │   └── promote-admin.js       ← Make user an admin
│   │
│   ├── test/                      ← Unit/integration tests
│   │   ├── health.integration.test.js
│   │   ├── public-search.test.js
│   │   ├── auth-tokens.test.js
│   │   └── validation.test.js
│   │
│   ├── loadtest/                  ← Performance testing
│   │   └── k6-health.js           ← k6 load test script
│   │
│   ├── openapi/                   ← API documentation
│   │   └── openapi.yaml           ← OpenAPI 3.0 spec
│   │
│   ├── Dockerfile                 ← Container image
│   ├── package.json               ← npm dependencies
│   └── .env.example               ← Environment template
│
├── 📚 DOCS/ (Documentation)
│   ├── monitoring-alerting.md     ← Monitoring strategy
│   ├── slo-sli.md                 ← Service levels
│   ├── adr/                       ← Architecture Decision Records
│   │   ├── 001-auth-strategy.md   ← JWT + refresh token choice
│   │   ├── 002-audit-trail.md     ← Event sourcing + audit logs
│   │   └── 003-deployment-strategy.md ← Docker Compose + future K8s
│   └── runbooks/                  ← Operational guides
│       ├── db-backup-restore.md
│       ├── incident-response.md
│       ├── rollback.md
│       └── secret-rotation.md
│
└── 🏗️  INFRA/ (Infrastructure)
    └── nginx/
        └── reverse-proxy.conf     ← Nginx configuration
```

---

## Component Interaction Diagram

```
┌────────────────────────────────────────────────────────────────┐
│                     BROWSER (React Client)                      │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  AuthContext + WarmupContext (Global State)              │  │
│  └──────────────────┬───────────────────────────────────────┘  │
│                     │                                           │
│  ┌────────────────────────────────────────────────────────┐    │
│  │  Routes (Navbar + Pages)                               │    │
│  │  • / → PublicSearchPage                                │    │
│  │  • /login → LoginPage (ProtectedRoute)                 │    │
│  │  • /bookings → BookingPage (ProtectedRoute)            │    │
│  │  • /admin → AdminPage (ProtectedRoute + Admin Role)    │    │
│  └────────────────────┬─────────────────────────────────┘     │
│                       │                                        │
└─────────────┬─────────┼────────────────────────────────────────┘
              │ HTTP(S) │ (Axios + Interceptors)
              │         │
          ┌───────┴─────────┐
          │  nginx:80/3000  │ (Reverse Proxy)
          └───────┬─────────┘
                  │ HTTP
              ┌───────────────────────────────────┐
              │   EXPRESS APP (Port 5000)         │
              │                                   │
              │  Middleware Stack:                │
              │  • helmet (security)              │
              │  • cors                           │
              │  • requestId                      │
              │  • authenticate (JWT)             │
              │  • errorHandler                   │
              │                                   │
              │  Routes:                          │
              │  /auth/* → AuthService            │
              │  /bookings/* → BookingService     │
              │  /public/* → BookingService       │
              │  /admin/* → AdminService          │
              │  /health/* → Health checks        │
              │                                   │
              └────────────┬─────────────────────┘
                           │ MongoDB Driver
                    ┌──────────────────┐
                    │   MongoDB:27017   │
                    │  Collections:     │
                    │  • users          │
                    │  • bookings       │
                    │  • bookingevents  │
                    │  • auditlogs      │
                    │  • refreshtokens  │
                    │  • routeoptions   │
                    │  • caboptions     │
                    │  • idempotencykeys│
                    └──────────────────┘
```

---

## Data Flow Examples

### 1. USER REGISTRATION & LOGIN

```
Frontend                          Backend                    Database
  │                                 │                          │
  ├─→ POST /auth/register ────────→ │                          │
  │   { name, email, pass }        │                          │
  │                                ├─→ Hash password (bcrypt) │
  │                                ├─→ Check email exists    ←┤
  │                                ├─→ Create User          →┤
  │                                ├─→ Generate tokens       │
  │   ← { user, accessToken }  ←───┤                          │
  │                                │                          │
  ├─ Store tokens (localStorage)  │                          │
  ├─ Set AuthContext.user         │                          │
  │
  ├─→ POST /auth/login ───────────→ │                          │
  │   { email, password }          │                          │
  │                                ├─→ Find user           ←┤
  │                                ├─→ Compare password    ←┤
  │                                ├─→ Generate tokens      │
  │   ← { user, accessToken }  ←───┤                          │
  │
  ├─ Store tokens + set user       │
  └─ Redirect to dashboard        │
```

### 2. BOOKING CREATION (AUTHENTICATED)

```
Frontend                          Backend                    Database
  │                                 │                          │
  ├─→ POST /bookings ────────────→ │                          │
  │   Headers: Authorization       │                          │
  │   IdempotencyKey: uuid         │                          │
  │                                ├─→ Validate JWT        │
  │                                ├─→ Check idempotency ←┤
  │                                ├─→ Calculate fare      │
  │                                ├─→ Create Booking    →┤
  │                                ├─→ Create Event      →┤
  │                                ├─→ Cache response    →┤
  │   ← { booking: {...} }     ←───┤                          │
  │
  ├─ Show success message          │
  └─ Redirect to /bookings         │
```

### 3. ADMIN BOOKING STATUS UPDATE

```
Frontend                          Backend                    Database
  │                                 │                          │
  ├─→ PATCH /bookings/{id}/status  │
  │   Headers: Authorization       │                          │
  │   { status: "CONFIRMED" }      │                          │
  │                                ├─→ Validate JWT        │
  │                                ├─→ Check role=admin    │
  │                                ├─→ Fetch booking     ←┤
  │                                ├─→ Validate transition │
  │                                ├─→ Update status     →┤
  │                                ├─→ Create Event      →┤
  │                                ├─→ Create AuditLog   →┤
  │   ← { booking: {...} }     ←───┤                          │
  │
  ├─ Update UI list                │
  └─ Show success                  │
```

---

## Key Dependencies & Their Roles

### Backend Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| express | 4.18.2 | Web framework, routing |
| mongoose | 7.0.0 | MongoDB ODM, schema validation |
| jsonwebtoken | 9.0.2 | JWT signing/verification |
| bcryptjs | 2.4.3 | Password hashing |
| zod | 3.23.8 | Schema validation (input) |
| helmet | 6.0.1 | Security headers |
| cors | 2.8.5 | Cross-origin requests |
| express-rate-limit | 7.4.1 | Rate limiting |
| morgan | 1.10.0 | HTTP request logging |
| uuid | 11.1.0 | ID generation |

### Frontend Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| react | 18.2.0 | UI library |
| react-router-dom | 6.28.0 | Client-side routing |
| react-dom | 18.2.0 | React rendering |
| axios | 1.4.0 | HTTP client |
| tailwindcss | 3.3.0 | CSS framework |

---

## File Organization Principles

### Backend Organization (Feature-Based)

```
modules/
├── auth/              # Isolated feature
│   ├── routes.js     # HTTP endpoints
│   ├── service.js    # Business logic
│   ├── schemas.js    # Validation rules
│   └── tokens.js     # Token management
├── booking/          # Isolated feature
│   ├── routes.js
│   ├── publicRoutes.js
│   ├── service.js
│   └── schemas.js
└── admin/            # Admin functionality
    └── routes.js
```

**Benefits:**
- Easy to locate feature code
- Clear separation of concerns
- Simple to test individual modules
- Scalable (add new features as new modules)

### Frontend Organization (Feature-Based)

```
features/
├── auth/             # Authentication feature
│   ├── LoginPage.jsx
│   └── RegisterPage.jsx
├── booking/          # Booking feature
│   ├── PublicSearchPage.jsx
│   └── BookingPage.jsx
└── admin/            # Admin feature
    └── AdminPage.jsx
```

**Benefits:**
- Co-located components
- Feature-focused development
- Clear navigation for new developers
- Easy to remove/update features

---

## Environment Variables Reference

### Backend (.env)

```env
NODE_ENV=development
PORT=5000
MONGO_URI=mongodb://localhost:27017/cab_project
CLIENT_URLS=http://localhost:3000
JWT_ACCESS_SECRET=your-secret-key-here-min-32-chars
JWT_REFRESH_SECRET=your-secret-key-here-min-32-chars
JWT_ACCESS_TTL=15m
JWT_REFRESH_TTL=7d
BCRYPT_ROUNDS=12
ALLOWED_ORIGINS=http://localhost:3000,https://app.example.com
```

### Frontend (.env)

```env
REACT_APP_API_URL=http://localhost:5000
REACT_APP_API_PREFIX=/api/v1
```

---

## Development Workflow

### Starting Development

```bash
# Terminal 1: MongoDB (via Docker)
docker run -d -p 27017:27017 mongo:7

# Terminal 2: Backend
cd server
npm install
npm run migrate:indexes
npm run seed-admin
npm run dev

# Terminal 3: Frontend
cd client
npm install
npm start

# Or use Docker Compose
docker compose up --build
```

### Common Commands

```bash
# Backend
npm run dev              # Start with nodemon
npm run lint             # Run ESLint
npm test                 # Run tests
npm run migrate:indexes  # Create DB indexes
npm run seed-admin       # Create admin user
npm run promote-admin    # Make user admin

# Frontend
npm start                # Dev server
npm run build            # Production build
npm run lint             # Run ESLint
npm test                 # Run tests
```

---

## Testing Strategy

### Backend Tests

**Files:** `server/test/*.test.js`

**Coverage:**
- Unit tests: Individual functions
- Integration tests: API endpoints + DB

**Run:** `npm test` or `npm run test:coverage`

### Frontend Tests

**Strategy:** Minimal setup, focus on integration

**Run:** `npm test`

### Load Testing

**Tool:** k6 (Grafana load testing)

**File:** `server/loadtest/k6-health.js`

---

## Performance Considerations

### Database Indexes

**User Collection:**
- email (unique)

**Booking Collection:**
- userId (for user queries)
- createdAt (for pagination/sorting)

**AuditLog Collection:**
- createdAt (for filtering by time)

**BookingEvent Collection:**
- bookingId (for booking history)

### Caching Strategy

- **Frontend:** Access tokens (localStorage) + session state (Context)
- **Backend:** Idempotency key responses (MongoDB)
- **Future:** Redis for rate limit counters, session store

### Rate Limiting

- Login endpoint: 5 attempts per 15 minutes
- Booking creation: 10 per minute per user
- Public search: Higher limit (not authenticated)

---

## Security Considerations

### Token Management

1. **Access Token:** 15-minute TTL, JWT
2. **Refresh Token:** 7-day TTL, stored + hashed
3. **Rotation:** New refresh token issued on each refresh
4. **Revocation:** Mark as revoked via revokedAt field

### Password Security

- Bcrypt with 12 rounds (configurable)
- Salted hashes
- Never transmitted in logs

### API Security

- CORS whitelist (env configured)
- Rate limiting (express-rate-limit)
- Input validation (Zod schemas)
- Security headers (Helmet)

---

## Debugging Tips

### Backend Debugging

```bash
# View logs with requestId
NODE_DEBUG=* npm run dev

# Use debugger
node --inspect server.js
# Open chrome://inspect
```

### Frontend Debugging

```bash
# Redux DevTools extension
# React DevTools extension
# Check storage: localStorage.getItem('cab_access_token')
```

### Database Debugging

```bash
# Connect to MongoDB
mongosh mongodb://localhost:27017/cab_project

# View collections
db.bookings.find().pretty()
db.users.find().pretty()
```

---

## Deployment Checklist

- [ ] Set production environment variables
- [ ] Enable HTTPS (nginx SSL)
- [ ] Set ALLOWED_ORIGINS to production domain
- [ ] Create strong JWT secrets
- [ ] Run database backups (mongodump)
- [ ] Set up monitoring/alerting
- [ ] Configure logging aggregation
- [ ] Test health probes
- [ ] Load test the deployment
- [ ] Document runbooks (already in docs/)

