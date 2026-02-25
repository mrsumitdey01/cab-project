# Cab Platform Pro - Complete Architecture & Functional Model

**Version:** 1.0.0  
**Date:** February 2026  
**Project Type:** Production-Grade Full-Stack Cab Booking Platform

---

## 1. SYSTEM OVERVIEW

### Core Purpose
A scalable, enterprise-grade cab booking platform enabling users to search for trips, create bookings, and manage reservations. Includes admin capabilities for operational management, audit logging, and fleet configuration.

### Key Characteristics
- **Type:** Full-stack web application (React + Node.js + MongoDB)
- **Deployment:** Docker containerized with docker-compose orchestration
- **API Style:** RESTful JSON APIs with versioning
- **Authentication:** JWT with refresh token rotation
- **Database:** MongoDB (NoSQL)
- **Frontend Framework:** React 18 with React Router v6
- **Backend Framework:** Express.js

---

## 2. ARCHITECTURAL LAYERS

```
┌─────────────────────────────────────────────────────────────┐
│                   CLIENT LAYER (React)                       │
│  - UI Components | State Management | Authentication         │
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTP/REST
┌──────────────────────────┴──────────────────────────────────┐
│                    API GATEWAY Layer                          │
│  - CORS | Nginx Reverse Proxy | Rate Limiting               │
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTP
┌──────────────────────────┴──────────────────────────────────┐
│             SERVER LAYER (Express.js)                        │
│  - Routes | Middleware | Business Logic | Services          │
└──────────────────────────┬──────────────────────────────────┘
                           │ MongoDB Driver
┌──────────────────────────┴──────────────────────────────────┐
│              DATA LAYER (MongoDB)                            │
│  - Collections | Indexes | Transactions                      │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. DATABASE SCHEMA & MODELS

### 3.1 User Model
```
{
  _id: ObjectId,
  name: String (required, trimmed),
  email: String (required, unique, lowercased, trimmed),
  passwordHash: String (bcrypt hash),
  role: Enum ['user', 'admin'] (default: 'user'),
  timestamps: { createdAt, updatedAt }
}
```

**Indexes:** Email (unique), createdAt (descending)

---

### 3.2 Booking Model
```
{
  _id: ObjectId,
  userId: ObjectId | null (ref: User, indexed, nullable for guest bookings),
  tripType: Enum ['ONE_WAY', 'ROUND_TRIP', 'AIRPORT', 'HOURLY'],
  pickup: {
    address: String (required, trimmed),
    coordinates: { lat: Number, lng: Number }
  },
  dropoff: {
    address: String (required, trimmed),
    coordinates: { lat: Number, lng: Number }
  },
  schedule: {
    pickupDate: Date (required),
    pickupTime: String (required, HH:mm format)
  },
  contact: {
    name: String,
    email: String,
    phone: String
  },
  selection: {
    route: String,
    cabType: String,
    carModel: String
  },
  fare: {
    totalAmount: Number (required, minimum 0)
  },
  status: Enum ['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED'] (default: 'PENDING'),
  timestamps: { createdAt, updatedAt }
}
```

**Indexes:** userId (indexed), createdAt (descending)

**Status Transitions:**
- PENDING → CONFIRMED, CANCELLED
- CONFIRMED → CANCELLED, COMPLETED
- COMPLETED → (terminal state)
- CANCELLED → (terminal state)

---

### 3.3 BookingEvent Model (Event Sourcing)
```
{
  _id: ObjectId,
  bookingId: ObjectId (ref: Booking, indexed),
  eventType: Enum ['CREATED', 'STATUS_CHANGED'],
  actor: {
    userId: ObjectId | null (ref: User),
    role: String ('guest', 'user', 'admin')
  },
  payload: Object (event-specific data),
  requestId: String (unique request tracking),
  timestamps: { createdAt, updatedAt }
}
```

**Purpose:** Immutable event log for audit trails and booking lifecycle tracking

---

### 3.4 AuditLog Model (Admin Actions)
```
{
  _id: ObjectId,
  action: String (required, e.g., 'UPDATE_BOOKING_STATUS'),
  actor: {
    userId: ObjectId (ref: User),
    role: String ('admin'),
    email: String
  },
  target: Object (affected resource details),
  metadata: Object (contextual information),
  requestId: String (unique request tracking),
  timestamps: { createdAt, updatedAt }
}
```

**Indexes:** createdAt (descending)

**Purpose:** Compliance and operational auditing

---

### 3.5 RefreshToken Model
```
{
  _id: ObjectId,
  userId: ObjectId (ref: User, required),
  tokenHash: String (SHA256 hash of JWT),
  expiresAt: Date (required),
  revokedAt: Date | null (nullable, for token revocation),
  timestamps: { createdAt, updatedAt }
}
```

**Purpose:** Server-side refresh token validation and revocation

---

### 3.6 RouteOption Model
```
{
  _id: ObjectId,
  label: String (e.g., "Express Route", required, trimmed),
  etaMinutes: Number (estimated time in minutes),
  distanceKm: Number (distance in kilometers),
  baseFare: Number (base fare in currency units),
  timestamps: { createdAt, updatedAt }
}
```

**Purpose:** Pre-defined route templates for fare calculation

---

### 3.7 CabOption Model
```
{
  _id: ObjectId,
  cabType: String (e.g., "Economy", required, trimmed),
  carModel: String (e.g., "Maruti Alto", required, trimmed),
  multiplier: Number (fare multiplier, e.g., 1.5x base fare),
  availableFrom: Date | null (availability window start),
  availableTo: Date | null (availability window end),
  timestamps: { createdAt, updatedAt }
}
```

**Purpose:** Cab type definitions with dynamic availability and pricing

---

### 3.8 IdempotencyKey Model
```
{
  _id: ObjectId,
  key: String (unique idempotency key),
  userId: ObjectId | null,
  endpoint: String (API endpoint),
  responseStatus: Number,
  responseBody: Object,
  timestamps: { createdAt, updatedAt }
}
```

**Purpose:** Ensures idempotent booking creation (prevents duplicates on retry)

---

## 4. API ARCHITECTURE

### 4.1 API Structure & Versioning

**Base URL:** `http://localhost:5000/api/v1` (or environment-configured)

**Legacy Support:** `/api/bookings` (backward compatibility)

**Health Endpoints:**
- `GET /health/live` - Liveness probe for K8s/orchestrators
- `GET /health/ready` - Readiness probe (checks DB connection)
- `GET /api/v1/health` - Simple status check

---

### 4.2 Authentication Endpoints

**POST /api/v1/auth/register**
- **Payload:** `{ name, email, password }`
- **Response:** `{ user, accessToken, refreshToken }`
- **Status:** 201 Created
- **Errors:** 409 (email exists), 400 (validation)

**POST /api/v1/auth/login**
- **Payload:** `{ email, password }`
- **Response:** `{ user, accessToken, refreshToken }`
- **Status:** 200 OK
- **Errors:** 401 (invalid credentials), 404 (user not found)

**POST /api/v1/auth/refresh**
- **Payload:** `{ refreshToken }`
- **Response:** `{ user, accessToken, refreshToken }`
- **Status:** 200 OK
- **Errors:** 401 (invalid/expired/revoked token)
- **Auth:** None (token validation via body)

**POST /api/v1/auth/logout**
- **Payload:** `{ refreshToken }`
- **Response:** `{ status: "success" }`
- **Status:** 200 OK
- **Auth:** OAuth Token (via Authorization header)
- **Purpose:** Revokes refresh token server-side

---

### 4.3 Booking Endpoints (Authenticated Users)

**POST /api/v1/bookings** (Create Booking)
- **Auth:** Required (JWT)
- **Headers:** 
  - `Authorization: Bearer <jwt-token>`
  - `Idempotency-Key: <uuid>` (optional, for idempotency)
- **Payload:**
  ```json
  {
    "tripType": "ONE_WAY",
    "pickup": { "address": "123 Main St" },
    "dropoff": { "address": "456 Oak Ave" },
    "schedule": { "pickupDate": "2026-03-01", "pickupTime": "10:00" },
    "selection": { "route": "route_id", "cabType": "Economy", "carModel": "Maruti" }
  }
  ```
- **Response:** `{ booking }`
- **Status:** 201 Created

**GET /api/v1/bookings** (List User Bookings)
- **Auth:** Required (JWT)
- **Response:** `{ bookings: [...] }`
- **Status:** 200 OK
- **Filters:** By userId (from JWT)

**GET /api/v1/bookings/{id}** (Get Single Booking)
- **Auth:** Required (JWT)
- **Response:** `{ booking }`
- **Status:** 200 OK
- **Authorization:** User must own booking or be admin

**PATCH /api/v1/bookings/{id}/status** (Update Booking Status)
- **Auth:** Required, Admin Only
- **Payload:** `{ status: "CONFIRMED" }`
- **Response:** `{ booking }`
- **Status:** 200 OK
- **Errors:** 403 (not admin), 400 (invalid transition)

---

### 4.4 Public Endpoints (No Authentication)

**POST /api/v1/public/search** (Search Available Trips)
- **Auth:** None
- **Payload:** `{ tripType, pickup, dropoff, schedule }`
- **Response:** `{ routes, cabs, estimated_fare }`
- **Status:** 200 OK

**POST /api/v1/public/bookings** (Create Guest Booking)
- **Auth:** None
- **Headers:** `Idempotency-Key: <uuid>` (optional)
- **Payload:** Same as authenticated booking + contact info
- **Response:** `{ booking }`
- **Status:** 201 Created
- **Purpose:** Allows guest (unauthenticated) booking creation

---

### 4.5 Admin Endpoints

**GET /api/v1/admin/health-summary** (Admin Only)
- **Auth:** Required, Admin Role
- **Response:** `{ totalBookings, upcomingBookings, revenue, ... }`
- **Status:** 200 OK

**GET /api/v1/admin/audit-logs** (Audit Logs)
- **Auth:** Required, Admin Role
- **Query Params:** `?page=1&pageSize=20`
- **Response:** `{ logs: [...], meta: { total, pages } }`
- **Status:** 200 OK

**GET /api/v1/admin/booking-alerts** (Recent Booking Alerts)
- **Auth:** Required, Admin Role
- **Query Params:** `?since=<ISO-8601-datetime>`
- **Response:** `{ alerts: [...], count: N }`
- **Status:** 200 OK

**GET /api/v1/admin/routes** (List Route Options)
- **Auth:** Required, Admin Role
- **Response:** `{ routes: [...] }`
- **Status:** 200 OK

**POST /api/v1/admin/routes** (Create Route Option)
- **Auth:** Required, Admin Role
- **Payload:** `{ label, etaMinutes, distanceKm, baseFare }`
- **Response:** `{ route }`
- **Status:** 201 Created

**GET /api/v1/admin/cabs** (List Cab Options)
- **Auth:** Required, Admin Role
- **Response:** `{ cabs: [...] }`
- **Status:** 200 OK

**POST /api/v1/admin/cabs** (Create Cab Option)
- **Auth:** Required, Admin Role
- **Payload:** `{ cabType, carModel, multiplier, availableFrom, availableTo }`
- **Response:** `{ cab }`
- **Status:** 201 Created

---

## 5. BACKEND SERVER ARCHITECTURE

### 5.1 Middleware Stack

**Applied in Order:**

1. **helmet()** - Security headers (XSS, CSRF, clickjacking protection)
2. **cors()** - Cross-origin resource sharing with origin whitelist
3. **express.json()** - JSON body parser (1MB limit)
4. **requestIdMiddleware** - Generates unique request ID for tracing
5. **metricsMiddleware** - Metrics collection (requests, latency)
6. **morgan()** - HTTP request logging (combined/dev format)
7. **authenticate()** (conditional) - JWT token verification
8. **rateLimit()** (conditional) - Rate limiting per endpoint
9. **errorHandler** - Central error handling
10. **notFoundHandler** - 404 responses

---

### 5.2 Directory Structure

```
server/
├── src/
│   ├── app.js                         # Express app factory
│   ├── server.js                      # Server entry point
│   ├── lib/
│   │   ├── config.js                  # Configuration loader
│   │   ├── db.js                      # MongoDB connection
│   │   ├── errors.js                  # ApiError class
│   │   ├── logger.js                  # Logging utilities
│   │   ├── metrics.js                 # Metrics collection
│   │   └── response.js                # Response formatting
│   ├── middleware/
│   │   ├── auth.js                    # JWT authentication/authorization
│   │   ├── errorHandler.js            # Global error handler
│   │   ├── notFound.js                # 404 handler
│   │   ├── rateLimit.js               # Rate limiting
│   │   ├── requestId.js               # Request ID injection
│   │   └── validate.js                # Zod schema validation
│   ├── modules/
│   │   ├── auth/
│   │   │   ├── routes.js              # Auth endpoints
│   │   │   ├── schemas.js             # Zod schemas
│   │   │   ├── service.js             # Auth business logic
│   │   │   └── tokens.js              # JWT token management
│   │   ├── booking/
│   │   │   ├── routes.js              # Booking endpoints (user)
│   │   │   ├── publicRoutes.js        # Public booking endpoints
│   │   │   ├── schemas.js             # Validation schemas
│   │   │   └── service.js             # Booking business logic
│   │   ├── admin/
│   │   │   └── routes.js              # Admin endpoints
│   │   └── health/
│   │       └── routes.js              # Health check endpoints
│   ├── routes/
│   │   ├── v1.js                      # API v1 router
│   │   └── legacy.js                  # Legacy /api/bookings
│   └── utils/
│       └── validation.js              # Validation helpers
├── models/
│   ├── User.js
│   ├── Booking.js
│   ├── BookingEvent.js
│   ├── AuditLog.js
│   ├── RefreshToken.js
│   ├── RouteOption.js
│   ├── CabOption.js
│   └── IdempotencyKey.js
├── scripts/
│   ├── migrate-indexes.js             # Create MongoDB indexes
│   ├── seed-admin.js                  # Create default admin user
│   ├── promote-admin.js               # Promote user to admin
├── test/
│   ├── health.integration.test.js
│   ├── public-search.test.js
│   ├── auth-tokens.test.js
│   └── validation.test.js
├── loadtest/
│   └── k6-health.js                   # Load testing script
├── openapi/
│   └── openapi.yaml                   # API specification
├── Dockerfile
├── package.json
└── server.js
```

---

### 5.3 Service Layer - Auth Service

**Functions:**

```javascript
// Registration
register(input, config)
  → Validate email uniqueness
  → Hash password (bcrypt)
  → Create User document
  → Generate session (tokens)
  → Returns: { user, accessToken, refreshToken }

// Login
login(input, config)
  → Lookup user by email
  → Compare password hash
  → Generate session
  → Returns: { user, accessToken, refreshToken }

// Refresh Token
refresh(refreshTokenRaw, config)
  → Verify JWT signature
  → Check token hash in RefreshToken collection
  → Validate expiry and revocation status
  → Generate new tokens
  → Returns: { user, accessToken, refreshToken }

// Logout
logout(refreshToken)
  → Mark RefreshToken as revoked (set revokedAt)
  → Returns: { status: 'success' }

// Create Session
createSession(user, config)
  → Generate access token (15-min TTL)
  → Generate refresh token (7-day TTL)
  → Store refresh token hash in DB
  → Returns: { user, accessToken, refreshToken }
```

**Token Structure:**

```json
{
  "sub": "user_id",
  "email": "user@example.com",
  "role": "user|admin",
  "iat": 1708867200,
  "exp": 1708868100
}
```

---

### 5.4 Service Layer - Booking Service

**Functions:**

```javascript
// Create Booking
createBooking(payload, actor, requestId, idempotencyKey)
  → Check idempotency key (return cached response if exists)
  → Calculate fare based on route + cab multiplier
  → Validate addresses
  → Create Booking document
  → Create BookingEvent (CREATED)
  → Cache response with idempotency key
  → Returns: { booking, replayed: boolean }

// Search Available Options
searchOptions(input)
  → Fetch all RouteOption documents
  → Fetch CabOption documents (filtered by date availability)
  → Calculate estimated fares
  → Returns: { routes, cabs, estimatedFares }

// List Bookings
listBookings(userId)
  → Query Booking collection by userId
  → Sort by createdAt descending
  → Returns: { bookings }

// Get Booking by ID
getBooking(bookingId, userId)
  → Fetch Booking by ID
  → Authorize (user owns or is admin)
  → Returns: { booking }

// Update Booking Status
updateBookingStatus(bookingId, newStatus, actor, requestId)
  → Fetch current booking
  → Validate status transition
  → Update status
  → Create BookingEvent (STATUS_CHANGED)
  → Create AuditLog entry
  → Returns: { booking }

// Calculate Fare
calculateFare(payload)
  → Get base fare from selected route
  → Apply cab multiplier
  → Apply surcharges (time-based, distance-based)
  → Returns: totalAmount
```

---

### 5.5 Middleware Details

**Authentication Middleware:**
```javascript
authenticate(config)
  → Extract JWT from Authorization header
  → Verify signature using config.jwtAccessSecret
  → Attach decoded payload to req.user
  → Next handler or 401 error

requireRole(...roles)
  → Check req.user exists
  → Check user role in allowed roles list
  → Next handler or 403 error
```

**Validation Middleware:**
```javascript
validate(schema)
  → Parse request body using Zod schema
  → Transform data (coercion, defaults)
  → Return validation errors (400) or next
```

**Error Handler:**
```javascript
errorHandler(err, req, res, next)
  → Classify error (ApiError, validation, unknown)
  → Format response envelope
  → Log error with requestId
  → Return JSON response with status
```

---

### 5.6 Configuration & Secrets

**Environment Variables:**
```env
NODE_ENV=development|production|test
PORT=5000
MONGO_URI=mongodb://mongo:27017/cab_project
CLIENT_URLS=http://localhost:3000,https://frontend.example.com
JWT_ACCESS_SECRET=<secret-key-32-chars-min>
JWT_REFRESH_SECRET=<secret-key-32-chars-min>
JWT_ACCESS_TTL=15m
JWT_REFRESH_TTL=7d
BCRYPT_ROUNDS=12
ALLOWED_ORIGINS=http://localhost:3000,https://app.example.com
```

---

## 6. FRONTEND CLIENT ARCHITECTURE

### 6.1 Technology Stack

- **React 18** - UI library with hooks
- **React Router v6** - Client-side routing
- **Axios** - HTTP client
- **Tailwind CSS** - Utility-first styling
- **Context API** - State management

---

### 6.2 Directory Structure

```
client/
├── src/
│   ├── App.js                          # Root component
│   ├── index.js                        # Entry point
│   ├── index.css                       # Global styles
│   ├── config.js                       # Client-side config
│   ├── app/
│   │   ├── providers.jsx               # App providers wrapper
│   │   └── routes.jsx                  # Routing & navbar
│   ├── components/
│   │   └── CabBookingForm.jsx          # Reusable booking form
│   ├── context/
│   │   └── BookingContext.js           # Legacy booking state (deprecated)
│   ├── features/
│   │   ├── auth/
│   │   │   ├── LoginPage.jsx           # Login form
│   │   │   └── RegisterPage.jsx        # Registration form
│   │   ├── booking/
│   │   │   ├── PublicSearchPage.jsx    # Landing: search + guest book
│   │   │   └── BookingPage.jsx         # Authenticated user bookings
│   │   └── admin/
│   │       └── AdminPage.jsx           # Admin dashboard
│   ├── shared/
│   │   ├── api/
│   │   │   ├── endpoints.js            # API call functions
│   │   │   ├── http.js                 # Axios instance + interceptors
│   │   │   └── warmup.js               # Server warmup logic
│   │   ├── contexts/
│   │   │   ├── AuthContext.jsx         # Authentication state
│   │   │   └── WarmupContext.jsx       # Server warmup state
│   │   ├── lib/
│   │   │   └── env.js                  # Environment variables
│   │   └── ui/
│   │       ├── Alert.jsx               # Alert/notification component
│   │       └── ProtectedRoute.jsx      # Route guard component
├── public/
│   └── index.html
├── build/
│   ├── index.html
│   └── static/
├── Dockerfile
├── nginx.conf                           # Nginx configuration
├── package.json
├── postcss.config.js
├── tailwind.config.js
└── .env.example
```

---

### 6.3 State Management

**AuthContext (Provider-based):**
```javascript
{
  user: { id, email, role },
  loading: boolean,
  error: string,
  isAuthenticated: boolean,
  login(email, password),
  register(name, email, password),
  logout(),
  refresh()
}
```

**WarmupContext (Provider-based):**
```javascript
{
  status: 'idle' | 'warming' | 'ready' | 'failed',
  warmTime: number,
  warmBackend()
}
```

---

### 6.4 HTTP Client Setup

**Axios Interceptors:**

1. **Request Interceptor:**
   - Attach access token from localStorage to Authorization header
   - Pass through

2. **Response Interceptor:**
   - On 401 error (if not retry):
     - Get refresh token from localStorage
     - POST to `/auth/refresh` with refresh token
     - Update tokens in localStorage (if valid response)
     - Retry original request with new access token
     - Return response

   - On other errors:
     - If no refresh token or refresh fails:
       - Clear session tokens
       - Throw error (triggers auth redirect)

---

### 6.5 Page Components

**PublicSearchPage:**
- Search interface (no authentication required)
- Trip type selection (ONE_WAY, ROUND_TRIP, AIRPORT, HOURLY)
- Pickup/dropoff address input
- Date and time picker
- Fetch available routes and cabs
- Display search results (routes, cabs, estimated fares)
- Modal form for guest booking or redirect to login for authenticated users
- Booking submission with idempotency key
- Success/error notifications

**BookingPage (Protected):**
- Display user's bookings (paginated list)
- Filter by status (PENDING, CONFIRMED, COMPLETED, CANCELLED)
- Booking details (pickup, dropoff, schedule, fare)
- Status badge
- Create new booking button

**LoginPage:**
- Email and password input
- Form validation
- Error messaging
- Redirect to dashboard on success
- Link to registration

**RegisterPage:**
- Name, email, password input
- Password confirmation
- Form validation
- Error messaging
- Auto-login on success
- Link to login

**AdminPage:**
- Tab navigation (Present, Planned, Past bookings)
- Health summary (total bookings, upcoming, revenue)
- Booking list with status
- Status update interface (dropdown + submit)
- Audit logs table (paginated)
- Recent booking alerts
- Route management (create, list)
- Cab management (create, list, multiplier)

---

### 6.6 Token Management

**Access Token:**
- Stored in localStorage: `cab_access_token`
- TTL: 15 minutes (configured)
- JWT format: { sub, email, role, iat, exp }
- Attached to all authenticated requests

**Refresh Token:**
- Stored in localStorage: `cab_refresh_token`
- TTL: 7 days (configured)
- Used only for refresh endpoint
- Server-side validation (checked against RefreshToken collection)
- Can be revoked server-side (revokedAt field)

**Session Lifecycle:**
1. Register/Login → receive tokens
2. Store in localStorage + set user state
3. Every request → attach accessToken
4. On 401 → use refreshToken to get new tokens
5. On logout → DELETE from localStorage + clear user state

---

## 7. API REQUEST/RESPONSE FLOW

### 7.1 Authentication Flow

```
User Input (email/password)
    ↓
Frontend: POST /api/v1/auth/login
    ↓
Backend: Validate credentials
    ↓
Backend: Generate JWT tokens
    ↓
Response: { user, accessToken, refreshToken }
    ↓
Frontend: Store in localStorage
    ↓
Frontend: Set AuthContext.user
    ↓
Frontend: Redirect to dashboard
```

---

### 7.2 Booking Creation Flow (Authenticated)

```
User: Fill booking form
    ↓
Frontend: Generate Idempotency-Key (UUID)
    ↓
Frontend: POST /api/v1/bookings
  Headers: Authorization: Bearer <access-token>
  Headers: Idempotency-Key: <uuid>
    ↓
Backend: Authenticate (verify JWT)
    ↓
Backend: Check idempotency key (return cached if exists)
    ↓
Backend: Validate input (Zod schema)
    ↓
Backend: Calculate fare
    ↓
Backend: Create Booking document
    ↓
Backend: Create BookingEvent (CREATED)
    ↓
Backend: Cache response with idempotency key
    ↓
Response: { booking: {...} }
    ↓
Frontend: Show success message
    ↓
Frontend: Redirect to /bookings
```

---

### 7.3 Guest Booking Flow (Public)

```
User: Fill search + contact details
    ↓
Frontend: POST /api/v1/public/bookings
  No auth required
  Headers: Idempotency-Key: <uuid>
    ↓
Backend: Validate input
    ↓
Backend: Check idempotency key
    ↓
Backend: Create Booking (userId: null for guest)
    ↓
Backend: Create BookingEvent
    ↓
Response: { booking: {...} }
    ↓
Frontend: Show confirmation page
```

---

### 7.4 Admin Status Update Flow

```
Admin: Select booking → change status
    ↓
Frontend: PATCH /api/v1/bookings/{id}/status
  Headers: Authorization: Bearer <admin-token>
  Body: { status: "CONFIRMED" }
    ↓
Backend: Authenticate + check role === 'admin'
    ↓
Backend: Validate status transition
    ↓
Backend: Update Booking.status
    ↓
Backend: Create BookingEvent (STATUS_CHANGED)
    ↓
Backend: Create AuditLog entry
    ↓
Response: { booking: {...} }
    ↓
Frontend: Update list
    ↓
Frontend: Show success
```

---

## 8. SECURITY ARCHITECTURE

### 8.1 Authentication & Authorization

**JWT Security:**
- Tokens signed with HS256 algorithm
- Secret stored in environment variables
- Access token: Short-lived (15 minutes)
- Refresh token: Long-lived (7 days), server-validated

**Password Security:**
- Bcrypt with 12 rounds (configurable)
- Salted hashes stored in DB
- Never transmitted over HTTP (HTTPS required in production)

**Refresh Token Rotation:**
- New refresh token issued on each refresh
- Old tokens remain valid until revocation
- Revocation tracked via revokedAt timestamp
- Stored token hash (SHA256) for additional security

---

### 8.2 API Security

**CORS Policy:**
- Whitelist specific origins in ALLOWED_ORIGINS env var
- Deny requests from unknown origins
- Credentials: false (tokens in Authorization header)

**Rate Limiting:**
- Express-rate-limit middleware
- Per-endpoint configuration
- Sliding window algorithm
- Returns 429 (Too Many Requests) on limit

**Input Validation:**
- All inputs validated with Zod schemas
- Type coercion and defaults applied
- Invalid inputs return 400 (Bad Request)
- Error details in response

**Security Headers (Helmet):**
- X-Frame-Options: DENY (clickjacking)
- X-Content-Type-Options: nosniff (MIME sniffing)
- X-XSS-Protection: enabled
- Strict-Transport-Security: HSTS enabled

---

### 8.3 Data Protection

**Password Fields:**
- Never exposed in API responses
- Stored as bcrypt hashes

**PII Protection:**
- Contact info stored in contact object
- Phone/email not indexed for privacy
- Audit logs record actions, not sensitive data

**Request Tracing:**
- Each request gets unique requestId
- Logged with all events for compliance
- Used in RefreshToken and IdempotencyKey models

---

### 8.4 Role-Based Access Control (RBAC)

**Roles:**
- `user` - Can create bookings, view own bookings
- `admin` - Can manage bookings, view audit logs, manage routes/cabs

**Protected Routes:**
- `/api/v1/bookings` - Requires authentication
- `/api/v1/admin/*` - Requires authentication + admin role
- `/api/v1/public/*` - No authentication

---

## 9. DATA FLOW ARCHITECTURE

### 9.1 Request Context

Every request carries:
- **requestId:** Unique UUID (generated or from header)
- **user:** JWT payload { sub, email, role } (if authenticated)
- **body:** Validated input payload
- **headers:** Request headers including Authorization

---

### 9.2 Event Sourcing

**Booking Events:**
- Immutable records of booking lifecycle
- Stored separately from Booking collection
- Query patterns:
  - All events for a booking (history)
  - All CREATED events in time window (analytics)
  - Status changes by actor (audit)

---

### 9.3 Audit Trail

**AuditLog Purpose:**
- Administrative actions (status updates, user promotions)
- Actor tracking (who did what)
- Target tracking (affected resource)
- Request tracing (unique requestId)

---

## 10. DEPLOYMENT & INFRASTRUCTURE

### 10.1 Docker Compose Services

**Service: mongo**
- Image: mongo:7
- Port: 27017
- Volume: mongo_data (persistent)
- Purpose: Database

**Service: server**
- Build: ./server
- Env: .env file
- Depends on: mongo
- Port: 5000 (internal)
- MONGO_URI: mongodb://mongo:27017/cab_project

**Service: client**
- Build: ./client
- Nginx reverse proxy (port 80 → port 3000)
- Frontend assets served statically
- Port: 3000 (mapped to 3000)
- Depends on: server

**Volume: mongo_data**
- Persists MongoDB data

---

### 10.2 Dockerfile Strategies

**Server Dockerfile:**
- Multi-stage build (optional)
- Node base image
- npm install
- Expose port 5000
- CMD: npm start or npm run dev

**Client Dockerfile:**
- Multi-stage: build stage → production stage
- Node build stage: npm run build
- Nginx production stage: serve static files + reverse proxy
- Expose port 80 or 3000 (via nginx.conf)

---

### 10.3 Nginx Configuration

**reverse-proxy.conf:**
- Upstream server: localhost:5000
- Static routes: /api/* → upstream
- Root: /usr/share/nginx/html (built frontend)
- SPA routing: 404 → index.html (for React Router)

---

### 10.4 Health Checks

**Liveness Probe (/health/live):**
- No dependencies
- Returns 200 immediately
- Used by orchestrators to restart dead containers

**Readiness Probe (/health/ready):**
- Checks MongoDB connection
- Returns 200 only if DB connected
- Used by orchestrators to route traffic

---

## 11. FEATURE BREAKDOWN

### 11.1 User Features

**Authentication:**
- ✅ Register account
- ✅ Login with email/password
- ✅ Logout (revoke refresh token)
- ✅ Automatic token refresh on 401
- ✅ Session persistence (refresh on page load)

**Booking Management:**
- ✅ Create booking (authenticated)
- ✅ View own bookings (list, detail)
- ✅ Search available trips (public)
- ✅ Create guest booking (no auth)
- ✅ Select route and cab type
- ✅ View booking status

---

### 11.2 Admin Features

**Booking Management:**
- ✅ View all bookings
- ✅ Filter bookings (present, planned, past)
- ✅ Update booking status
- ✅ View booking alerts (recent)

**Analytics & Monitoring:**
- ✅ Health summary (total, upcoming, revenue)
- ✅ Audit logs (paginated)
- ✅ Request tracing (per requestId)

**Fleet Management:**
- ✅ Create route options
- ✅ View route options
- ✅ Create cab options  (with multipliers, availability)
- ✅ View cab options

---

### 11.3 System Features

**Reliability:**
- ✅ Idempotent booking creation (no duplicates on retry)
- ✅ Status transition validation
- ✅ Event sourcing (immutable booking history)
- ✅ Audit logging

**Scalability:**
- ✅ Stateless API (JWT-based, no sessions)
- ✅ Database indexes for performance
- ✅ Request rate limiting
- ✅ Pagination support (audit logs)

**Observability:**
- ✅ Request logging (morgan)
- ✅ Error logging
- ✅ Request tracing (requestId)
- ✅ Health probes

---

## 12. TECHNICAL DEBT & FUTURE ENHANCEMENTS

### Currently Not Implemented

1. **Real-time Features:**
   - WebSocket support for live booking updates
   - Server-sent events (SSE)

2. **Payment Integration:**
   - Stripe/Razorpay integration
   - Payment status tracking

3. **Notifications:**
   - Email notifications (booking confirmations)
   - SMS notifications
   - Push notifications

4. **Geolocation:**
   - Maps integration (Google Maps)
   - Real-time driver tracking
   - Distance calculation

5. **Advanced Admin Features:**
   - User analytics dashboard
   - Revenue reports
   - Driver management
   - Promotion/discount codes

6. **Performance:**
   - Redis caching layer
   - Elasticsearch for booking search
   - Database query optimization

7. **Testing:**
   - Integration tests (more comprehensive)
   - End-to-end tests (Cypress)
   - Contract testing

8. **DevOps:**
   - Kubernetes deployment
   - CI/CD pipeline (GitHub Actions)
   - Monitoring (Prometheus, Grafana)
   - Log aggregation (ELK stack)

---

## 13. CONFIGURATION MATRIX

| Component | Development | Production |
|-----------|-------------|-----------|
| **JWT_ACCESS_TTL** | 15m | 15m |
| **JWT_REFRESH_TTL** | 7d | 7d |
| **BCRYPT_ROUNDS** | 12 | 12 |
| **MONGO_URI** | localhost:27017 | Cloud (Atlas/Compose) |
| **CORS** | localhost:3000 | production domain |
| **Rate Limit** | Disabled/High | Enabled/Strict |
| **Logging** | 'dev' | 'combined' |
| **Error Details** | Full stack trace | Limited info |

---

## 14. KEY DEPENDENCIES

**Backend (server/package.json):**
- express: 4.18.2 (Web framework)
- mongoose: 7.0.0 (MongoDB ODM)
- jsonwebtoken: 9.0.2 (JWT handling)
- bcryptjs: 2.4.3 (Password hashing)
- zod: 3.23.8 (Schema validation)
- helmet: 6.0.1 (Security headers)
- cors: 2.8.5 (CORS middleware)
- express-rate-limit: 7.4.1 (Rate limiting)
- morgan: 1.10.0 (HTTP logging)
- uuid: 11.1.0 (ID generation)

**Frontend (client/package.json):**
- react: 18.2.0 (UI library)
- react-router-dom: 6.28.0 (Routing)
- react-dom: 18.2.0 (React DOM)
- axios: 1.4.0 (HTTP client)
- tailwindcss: 3.3.0 (CSS utility framework)

---

## 15. SUMMARY

This cab platform is a **production-ready, full-stack application** featuring:

- **Robust Authentication:** JWT + refresh token rotation with server-side revocation
- **Scalable Architecture:** Stateless API, indexed database queries, rate limiting
- **Comprehensive Booking System:** Idempotent creation, status transitions, guest support
- **Admin Dashboard:** Booking management, fleet configuration, audit trails
- **Security:** RBAC, input validation, CORS, rate limiting, password hashing
- **Reliability:** Event sourcing, idempotency keys, health checks
- **Modern Stack:** React 18, Express, MongoDB, Docker, Tailwind CSS

**Deployment:** Docker Compose with MongoDB, Express backend, React frontend, and Nginx reverse proxy.

