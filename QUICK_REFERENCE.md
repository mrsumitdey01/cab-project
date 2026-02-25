# Cab Platform Pro - Developer Quick Reference

## 📊 System Quick Facts

| Aspect | Details |
|--------|---------|
| **Frontend Port** | 3000 (React + Tailwind) |
| **Backend Port** | 5000 (Express) |
| **Database Port** | 27017 (MongoDB) |
| **Auth Method** | JWT + Refresh Token Rotation |
| **API Version** | v1 (/api/v1) |
| **Default Admin** | admin@rideeasy.local / Admin123! |
| **Access Token TTL** | 15 minutes |
| **Refresh Token TTL** | 7 days |

---

## 🔐 Authentication Flow (5 Steps)

```
1. POST /api/v1/auth/register or /api/v1/auth/login
   ↓
2. Backend returns { accessToken, refreshToken, user }
   ↓
3. Frontend stores in localStorage
   ↓
4. All requests include: Authorization: Bearer {accessToken}
   ↓
5. On 401 → use refreshToken to get new tokens (auto-retry)
```

---

## 📍 Key API Endpoints

### Auth Endpoints
- `POST /api/v1/auth/register` - Create account
- `POST /api/v1/auth/login` - Login
- `POST /api/v1/auth/refresh` - Get new tokens
- `POST /api/v1/auth/logout` - Revoke refresh token

### Booking Endpoints
- `POST /api/v1/bookings` - Create booking (auth required)
- `GET /api/v1/bookings` - List user bookings (auth required)
- `GET /api/v1/bookings/{id}` - Get booking detail (auth required)
- `PATCH /api/v1/bookings/{id}/status` - Update status (admin only)

### Public Endpoints
- `POST /api/v1/public/search` - Search trips
- `POST /api/v1/public/bookings` - Create guest booking

### Admin Endpoints
- `GET /api/v1/admin/health-summary` - Stats (admin only)
- `GET /api/v1/admin/audit-logs` - Audit trail (admin only)
- `GET /api/v1/admin/booking-alerts` - Recent bookings (admin only)
- `GET /api/v1/admin/routes` - List routes (admin only)
- `POST /api/v1/admin/routes` - Create route (admin only)
- `GET /api/v1/admin/cabs` - List cabs (admin only)
- `POST /api/v1/admin/cabs` - Create cab (admin only)

### Health Endpoints
- `GET /health/live` - Liveness probe
- `GET /health/ready` - Readiness probe

---

## 📦 Database Collections (8 Total)

| Collection | Purpose | Key Fields |
|-----------|---------|-----------|
| **users** | User accounts | name, email, passwordHash, role |
| **bookings** | Trip reservations | userId, tripType, pickup, dropoff, status, fare |
| **bookingevents** | Event sourcing log | bookingId, eventType, actor, payload |
| **auditlogs** | Admin actions | action, actor, target, metadata |
| **refreshtokens** | Token revocation | userId, tokenHash, expiresAt, revokedAt |
| **routeoptions** | Trip routes | label, etaMinutes, distanceKm, baseFare |
| **caboptions** | Cab types | cabType, carModel, multiplier, availableFrom, availableTo |
| **idempotencykeys** | Duplicate prevention | key, userId, endpoint, responseStatus, responseBody |

---

## 🎨 Frontend Pages (4 Main Pages)

### 1. PublicSearchPage (/)
- Public landing page
- Search trips (pickup, dropoff, date, time)
- View available routes and cabs
- Create guest booking (no login required)
- Show booking confirmation

### 2. LoginPage (/login)
- Email/password input
- Auto-redirect if authenticated
- Error handling
- Link to register

### 3. BookingPage (/bookings)
- Protected route (auth required)
- List user's bookings
- Show booking details and status
- Create new booking button

### 4. AdminPage (/admin)
- Protected route (admin role required)
- Tab navigation: Present, Planned, Past bookings
- Health summary (stats)
- Booking status management
- Audit logs viewer
- Booking alerts
- Route management
- Cab management

---

## 🛠️ Backend Modules (4 Features)

### 1. Auth Module
- **Routes:** `/auth/*`
- **Functions:** register, login, refresh, logout
- **Validates:** Email format, password strength
- **Returns:** JWT tokens + user profile

### 2. Booking Module
- **Routes:** `/bookings/*` and `/public/*`
- **Functions:** Create, read, list, update status
- **Validates:** Address, dates, fares
- **Tracks:** Booking events, audit logs
- **Supports:** Idempotent creation, guest bookings

### 3. Admin Module
- **Routes:** `/admin/*`
- **Functions:** Health stats, audit logs, alerts, route/cab management
- **Requires:** Admin role
- **Returns:** Aggregated data, paginated logs

### 4. Health Module
- **Routes:** `/health/*`
- **Functions:** Liveness, readiness checks
- **Checks:** DB connection, server status
- **Returns:** Status + message

---

## 🚀 Common Development Tasks

### Adding a New API Endpoint

**1. Create validation schema** (`modules/feature/schemas.js`)
```javascript
const newSchema = z.object({
  field1: z.string(),
  field2: z.number()
});
```

**2. Add route handler** (`modules/feature/routes.js`)
```javascript
router.post('/', validate(newSchema), async (req, res, next) => {
  try {
    const result = await service.doSomething(req.body);
    res.status(201).json({ data: result });
  } catch (err) {
    next(err);
  }
});
```

**3. Add service function** (`modules/feature/service.js`)
```javascript
async function doSomething(input) {
  // Business logic
  return result;
}
```

---

### Adding a New Frontend Page

**1. Create page component** (`features/feature/FeaturePage.jsx`)
```jsx
export function FeaturePage() {
  // Component logic
  return <div>Feature Page</div>;
}
```

**2. Add route** (`app/routes.jsx`)
```jsx
<Route path="/feature" element={<FeaturePage />} />
```

**3. Add navigation link** (`app/routes.jsx` → Navbar)
```jsx
<Link to="/feature">Feature</Link>
```

---

### Adding Database Validation

**1. Define schema** (`models/Collection.js`)
```javascript
const schema = new mongoose.Schema({
  field: { type: String, required: true, index: true }
});
```

**2. Add migration** (`scripts/migrate-indexes.js`)
```javascript
db.collection('collections').createIndex({ field: 1 });
```

**3. Run migration**
```bash
npm run migrate:indexes
```

---

## 🧪 Testing Commands

```bash
# Backend tests
cd server
npm test                    # Run all tests
npm run test:coverage       # Coverage report
npm run lint                # ESLint

# Frontend tests  
cd client
npm test                    # Run tests
npm run lint                # ESLint
npm run build               # Production build

# Load testing
cd server
k6 run loadtest/k6-health.js
```

---

## 🔍 Debugging Common Issues

### Issue: 401 Unauthorized on protected routes

**Cause:** Missing or expired access token

**Fix:**
1. Check localStorage: `localStorage.getItem('cab_access_token')`
2. Check token expiry: `JWT.exp < Date.now()`
3. Call refresh endpoint to get new token
4. Verify CORS origin is whitelisted

### Issue: Booking creation fails

**Cause:** Validation error or idempotency issue

**Fix:**
1. Check request payload matches schema
2. Verify addresses are not empty
3. Check date is not in past
4. Unique Idempotency-Key for retries

### Issue: Admin endpoints returning 403

**Cause:** User role is 'user' not 'admin'

**Fix:**
```bash
# Promote user to admin
npm run promote-admin
# Follow prompts to enter email
```

### Issue: Database connection fails

**Cause:** MongoDB not running or wrong URI

**Fix:**
```bash
# Start MongoDB
docker run -d -p 27017:27017 mongo:7

# Or via Docker Compose
docker compose up mongo
```

---

## 📝 Understanding Request Context

### Every Request Has:

```javascript
{
  requestId: "550e8400-e29b-41d4-a716-446655440000",  // Unique trace ID
  user: {                                               // If authenticated
    sub: "user_id",
    email: "user@example.com",
    role: "user" | "admin"
  },
  body: { /* validated payload */ },
  headers: { /* HTTP headers */ }
}
```

### Request ID Usage:

- **Logging:** Every log entry includes requestId
- **Debugging:** Trace a request through all systems
- **Idempotency:** Links to cached responses
- **Audit:** Connected to booking events and audit logs

---

## 🔐 Session Management

### Token Storage (Frontend)

```javascript
// localStorage keys
localStorage.getItem('cab_access_token')     // JWT (15 min)
localStorage.getItem('cab_refresh_token')    // JWT (7 days)
```

### Automatic Refresh (axios interceptor)

```javascript
// On 401 response:
1. Get refreshToken from localStorage
2. POST /api/v1/auth/refresh { refreshToken }
3. Get new tokens from response
4. Update localStorage
5. Retry original request
6. Return response to caller
```

### Logout

```javascript
// Frontend calls logout:
1. POST /api/v1/auth/logout { refreshToken }
2. Clear localStorage
3. Set user = null
4. Redirect to /login
```

---

## 🎯 Booking Status Lifecycle

```
PENDING
  ↓
  ├→ CONFIRMED (admin updates)
  │   ↓
  │   ├→ COMPLETED (done)
  │   └→ CANCELLED (admin cancels)
  │
  └→ CANCELLED (direct cancellation)
```

**Allowed Transitions:**
- PENDING → CONFIRMED, CANCELLED
- CONFIRMED → CANCELLED, COMPLETED
- COMPLETED → (terminal)
- CANCELLED → (terminal)

---

## 💰 Fare Calculation

```javascript
totalFare = baseFare * cabMultiplier + surcharges

where:
  baseFare = RouteOption.baseFare
  cabMultiplier = CabOption.multiplier (e.g., 1.5)
  surcharges = time-based or distance-based fees
```

---

## 🌐 CORS & Origins

**Allowed Origins (configurable):**
```env
ALLOWED_ORIGINS=http://localhost:3000,https://app.example.com
```

**Request Requirement:**
- Browser sends Origin header
- Server checks against ALLOWED_ORIGINS
- If match: Allow request
- If no match: Reject with 403

---

## 📊 Response Format

### Success Response (200)
```json
{
  "data": { /* payload */ },
  "meta": { /* pagination info */ }
}
```

### Error Response (4xx, 5xx)
```json
{
  "error": {
    "title": "Validation Error",
    "detail": "Invalid email format",
    "code": "validation_error"
  }
}
```

---

## 🚀 Deployment Preparation

### Before Going to Production:

1. **Environment variables set:**
   - Strong JWT secrets (32+ chars)
   - Production MongoDB URI
   - ALLOWED_ORIGINS = production domain
   - NODE_ENV = production

2. **Security configured:**
   - HTTPS enabled (SSL certif)
   - CORS origins whitelisted
   - Rate limiting enabled
   - Helmet headers active

3. **Database ready:**
   - Backups configured
   - Indexes created
   - Admin user created

4. **Monitoring active:**
   - Health probes working
   - Logging configured
   - Error tracking enabled

5. **Documentation:**
   - Runbooks written
   - Team trained
   - Rollback procedure documented

---

## 📚 Additional Resources

| Document | Purpose |
|----------|---------|
| ARCHITECTURE.md | Complete system design |
| CODEBASE_STRUCTURE.md | Directory organization |
| docs/adr/ | Architecture decisions |
| docs/runbooks/ | Operational procedures |
| server/openapi/openapi.yaml | API specification |
| README.md | Quick start guide |

---

## 🎓 Key Concepts

### Idempotency
- Same request with same `Idempotency-Key` returns same response
- Prevents duplicate bookings on retry
- Response cached in IdempotencyKey collection

### Event Sourcing
- Every booking status change creates a BookingEvent
- Immutable-log design
- Enables audit trail, replay, analytics

### Token Rotation
- New refresh token issued on each refresh
- Reduces exposure window if token leaked
- Old token remains valid until explicitly revoked

### RBAC (Role-Based Access Control)
- User role: 'user' or 'admin'
- Embedded in JWT payload
- Checked on protected endpoints

---

**Need Help?** Check the corresponding documentation file in `/docs` or `/ARCHITECTURE.md` for detailed information.

