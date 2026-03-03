# Cab Platform Pro - Working Model Documentation

**Date:** March 1, 2026  
**Version:** 1.0.0  
**Status:** Production-Ready

---

## Table of Contents
1. [Project Overview](#project-overview)
2. [Architecture](#architecture)
3. [Data Models & Database Schema](#data-models--database-schema)
4. [API Specification](#api-specification)
5. [Authentication & Authorization](#authentication--authorization)
6. [Business Logic & Services](#business-logic--services)
7. [Frontend Structure](#frontend-structure)
8. [Middleware & Core Utility Layers](#middleware--core-utility-layers)
9. [Key Features & Workflows](#key-features--workflows)
10. [Deployment & Infrastructure](#deployment--infrastructure)

---

## Project Overview

**Cab Platform Pro** is a production-grade cab booking platform built with:
- **Frontend:** React 18 + React Router v6 + Tailwind CSS + Axios
- **Backend:** Node.js + Express + MongoDB + Mongoose
- **Infrastructure:** Docker, Docker Compose, Nginx reverse proxy
- **Authentication:** JWT (access tokens + refresh token rotation)
- **Authorization:** Role-Based Access Control (RBAC) - User & Admin roles

### Key Capabilities
- User registration, login, logout with secure token management
- Cab booking creation, search, and management
- Guest booking support (without authentication)
- Admin dashboard with audit logs and booking alerts
- Comprehensive booking event tracking for auditability
- Health check endpoints for monitoring
- Idempotent booking creation for reliability
- Rate limiting and security hardening

---

## Architecture

### High-Level System Design

```
┌─────────────────────────────────────────────────────────────┐
│                           CLIENT LAYER                      │
│              React SPA (port 3000, nginx proxy)             │
├─────────────────────────────────────────────────────────────┤
│                     Axios HTTP Client                        │
│         (Token Management, Error Handling, Retry)            │
└────────────────────────────┬────────────────────────────────┘
                             │
                     HTTP/REST API
                        (port 5000)
                             │
┌────────────────────────────▼────────────────────────────────┐
│                      EXPRESS SERVER                          │
│         (Middleware Stack, Route Handlers, Services)         │
├─────────────────────────────────────────────────────────────┤
│                    Core Middleware                           │
│  - Account (CORS, Helmet, Rate Limiting)                   │
│  - Request ID & Metrics Tracking                           │
│  - Authentication & Authorization Checks                    │
│  - Request Validation (Zod schemas)                         │
│  - Error Handling & Response Formatting                     │
├─────────────────────────────────────────────────────────────┤
│                      Route Modules                           │
│  - /auth/* (Register, Login, Refresh, Logout)              │
│  - /bookings/* (Create, List, Get, Update Status)          │
│  - /public/* (Search, Guest Booking)                       │
│  - /admin/* (Audit Logs, Health Summary, Alerts)           │
│  - /health/* (Liveness, Readiness)                         │
├─────────────────────────────────────────────────────────────┤
│                    Service Layer                             │
│  - auth/service.js (User auth flows)                        │
│  - booking/service.js (Booking logic, fare calculation)    │
└────────────────────────────┬────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────┐
│                       MONGODB                                │
│           (Persistent Data Storage & Indexing)              │
└─────────────────────────────────────────────────────────────┘
```

### Technology Stack

| Component | Technology | Version | Purpose |
|-----------|-----------|---------|---------|
| **Frontend Framework** | React | 18.2 | UI rendering |
| **Routing** | React Router | 6.28 | Client-side navigation |
| **Styling** | Tailwind CSS | 3.3 | Utility-first CSS |
| **HTTP Client** | Axios | 1.4 | API requests |
| **Runtime** | Node.js | 14+ | Server runtime |
| **Web Framework** | Express | 4.18 | HTTP server |
| **Database** | MongoDB | 7 | NoSQL data store |
| **ODM** | Mongoose | 7.0 | Schema & validation |
| **Authentication** | JWT + bcreachjs | 9.0.2 / 2.4.3 | Token-based auth |
| **Validation** | Zod | 3.23 | Schema validation |
| **Rate Limiting** | express-rate-limit | 7.4 | DOS protection |
| **Security** | Helmet | 6.0 | HTTP header hardening |
| **CORS** | cors | 2.8 | Cross-origin requests |
| **Logging** | Morgan | 1.10 | HTTP request logging |
| **Container** | Docker | - | Containerization |

---

## Data Models & Database Schema

### 1. User Model
**Collection:** `users`

```javascript
{
  _id: ObjectId,
  name: String (required, trimmed),
  email: String (required, unique, lowercase, trimmed),
  passwordHash: String (bcrypt hash),
  role: String (enum: ['user', 'admin'], default: 'user'),
  timestamps: { createdAt, updatedAt }
}
```

**Indexes:** Email (unique)

**Purpose:** Store registered user accounts and role information.

### 2. Booking Model
**Collection:** `bookings`

```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: User, optional for guests, indexed),
  tripType: String (enum: ['ONE_WAY', 'ROUND_TRIP', 'AIRPORT', 'HOURLY']),
  pickup: {
    address: String (required, trimmed),
    coordinates: { lat: number, lng: number }
  },
  dropoff: {
    address: String (required, trimmed),
    coordinates: { lat: number, lng: number }
  },
  schedule: {
    pickupDate: Date (required),
    pickupTime: String (HH:MM format, required)
  },
  passengerId: ObjectId (ref: Passenger, optional),
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
    totalAmount: Number (required, min: 0)
  },
  status: String (enum: ['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED'], default: 'PENDING'),
  timestamps: { createdAt, updatedAt }
}
```

**Indexes:** userId (indexed), createdAt (descending)

**Purpose:** Core entity representing cab ride bookings.

### 3. BookingEvent Model
**Collection:** `bookingevents`

```javascript
{
  _id: ObjectId,
  bookingId: ObjectId (ref: Booking, required, indexed),
  eventType: String (enum: ['CREATED', 'STATUS_CHANGED']),
  actor: {
    userId: ObjectId (ref: User, optional),
    role: String (default: 'guest')
  },
  payload: Object (event-specific data),
  requestId: String (correlation ID),
  timestamps: { createdAt, updatedAt }
}
```

**Indexes:** bookingId (indexed)

**Purpose:** Immutable audit trail for all booking state changes and events.

### 4. AuditLog Model
**Collection:** `auditlogs`

```javascript
{
  _id: ObjectId,
  action: String (e.g., 'BOOKING_CREATED', 'STATUS_UPDATED'),
  actor: {
    userId: ObjectId (ref: User, required),
    role: String (required),
    email: String (required)
  },
  target: Object (e.g., { type: 'booking', id: ObjectId }),
  metadata: Object (contextual information),
  requestId: String (correlation ID),
  timestamps: { createdAt, updatedAt }
}
```

**Indexes:** createdAt (descending)

**Purpose:** Admin-triggered action audit trail for compliance and monitoring.

### 5. RefreshToken Model
**Collection:** `refreshtokens`

```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: User, required, indexed),
  tokenHash: String (SHA-256 hash of token, indexed),
  expiresAt: Date (required, indexed for cleanup),
  revokedAt: Date (optional, null if active),
  timestamps: { createdAt, updatedAt }
}
```

**Indexes:** userId, tokenHash, expiresAt

**Purpose:** Server-side storage for refresh token rotation and revocation.

### 6. RouteOption Model
**Collection:** `routeoptions`

```javascript
{
  _id: ObjectId,
  fromHub: String (e.g., 'Downtown', required),
  toHub: String (e.g., 'Airport', required),
  flatRate: Number (base fare for this route, required),
  label: String (optional description),
  timestamps: { createdAt, updatedAt }
}
```

**Purpose:** Pre-defined routes for fare calculation and search filtering.

### 7. CabOption Model
**Collection:** `caboptions`

```javascript
{
  _id: ObjectId,
  cabType: String (e.g., 'Economy', 'Premium', required),
  carModel: String (e.g., 'Toyota Corolla', required),
  multiplier: Number (fare multiplier, e.g., 1.0, 1.5),
  availableFrom: Date (optional availability window),
  availableTo: Date (optional availability window),
  timestamps: { createdAt, updatedAt }
}
```

**Purpose:** Cab type definitions with pricing multipliers.

### 8. IdempotencyKey Model
**Collection:** `idempotencykeys`

```javascript
{
  _id: ObjectId,
  key: String (UUID idempotency key),
  userId: ObjectId (optional, for user-specific requests),
  endpoint: String (e.g., '/api/v1/bookings'),
  responseStatus: Number (HTTP status code),
  responseBody: Object (cached response),
  timestamps: { createdAt, updatedAt }
}
```

**Indexes:** Composite unique index on (key, userId, endpoint)

**Purpose:** Prevent duplicate booking requests via idempotent request handling.

---

## API Specification

### Base URL
```
http://localhost:5000/api/v1
```

### Authentication
All protected endpoints require:
```
Authorization: Bearer <accessToken>
```

### Response Format
**Success (2xx):**
```json
{
  "data": { /* payload */ },
  "meta": { /* optional pagination */ }
}
```

**Error (4xx, 5xx):**
```json
{
  "error": {
    "status": 400,
    "title": "Validation Error",
    "detail": "Description of what went wrong",
    "code": "error_code",
    "fieldErrors": [
      { "path": "field.name", "message": "error message" }
    ]
  }
}
```

### Endpoints

#### Authentication Module (`/auth`)

| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| POST | `/auth/register` | ❌ | Register new user |
| POST | `/auth/login` | ❌ | Authenticate user |
| POST | `/auth/refresh` | ❌ | Refresh access token |
| POST | `/auth/logout` | ❌ | Revoke refresh token |

**POST /auth/register**
```json
Request Body:
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePass123!"
}

Response (201):
{
  "data": {
    "user": { "id": "...", "name": "John Doe", "email": "john@example.com", "role": "user" },
    "accessToken": "eyJhbGc...",
    "refreshToken": "eyJhbGc..."
  }
}
```

**POST /auth/login**
```json
Request Body:
{
  "email": "john@example.com",
  "password": "SecurePass123!"
}

Response (200):
{
  "data": {
    "user": { "id": "...", "name": "John Doe", "email": "john@example.com", "role": "user" },
    "accessToken": "eyJhbGc...",
    "refreshToken": "eyJhbGc..."
  }
}
```

**POST /auth/refresh**
```json
Request Body:
{
  "refreshToken": "eyJhbGc..."
}

Response (200):
{
  "data": {
    "user": { "id": "...", "name": "John Doe", "email": "john@example.com", "role": "user" },
    "accessToken": "eyJhbGc...",
    "refreshToken": "eyJhbGc..." // New refresh token issued
  }
}
```

**POST /auth/logout**
```json
Request Body:
{
  "refreshToken": "eyJhbGc..."
}

Response (200):
{
  "data": {
    "loggedOut": true
  }
}
```

#### Booking Module (`/bookings`)

| Method | Endpoint | Auth | Role | Purpose |
|--------|----------|------|------|---------|
| POST | `/bookings` | ✅ | User | Create booking |
| GET | `/bookings` | ✅ | User | List user's bookings |
| GET | `/bookings/:id` | ✅ | User | Get booking details |
| PATCH | `/bookings/:id/status` | ✅ | Admin | Update booking status |

**POST /bookings** (Authenticated User)
```json
Request Headers:
{
  "Authorization": "Bearer <accessToken>",
  "Idempotency-Key": "uuid-string" // Optional, for duplicate prevention
}

Request Body:
{
  "tripType": "ONE_WAY",
  "pickup": {
    "address": "123 Main St, Downtown"
  },
  "dropoff": {
    "address": "Airport Terminal 1"
  },
  "schedule": {
    "pickupDate": "2026-03-15",
    "pickupTime": "14:30"
  },
  "selection": {
    "route": "Downtown-Airport",
    "cabType": "Economy",
    "carModel": "Toyota Corolla"
  }
}

Response (201):
{
  "data": {
    "booking": {
      "_id": "...",
      "userId": "...",
      "tripType": "ONE_WAY",
      "pickup": { "address": "123 Main St, Downtown" },
      "dropoff": { "address": "Airport Terminal 1" },
      "schedule": { "pickupDate": "2026-03-15T00:00:00.000Z", "pickupTime": "14:30" },
      "fare": { "totalAmount": 45.50 },
      "status": "PENDING",
      "createdAt": "2026-03-01T12:00:00.000Z"
    }
  }
}
```

**GET /bookings**
```json
Response (200):
{
  "data": {
    "bookings": [
      { /* booking object */ },
      { /* booking object */ }
    ]
  }
}
```

**GET /bookings/:id**
```json
Response (200):
{
  "data": {
    "booking": { /* booking object */ }
  }
}
```

**PATCH /bookings/:id/status** (Admin Only)
```json
Request Body:
{
  "status": "CONFIRMED"
}

Response (200):
{
  "data": {
    "booking": { /* updated booking with status */ }
  }
}
```

#### Health Module (`/health`)

| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| GET | `/health/live` | ❌ | Liveness probe |
| GET | `/health/ready` | ❌ | Readiness probe |

**GET /health/live**
```json
Response (200):
{
  "data": { "status": "alive" }
}
```

**GET /health/ready**
```json
Response (200):
{
  "data": {
    "status": "ready",
    "dbReady": true
  }
}
```

#### Admin Module (`/admin`) [Admin Role Required]

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/admin/health-summary` | System health & metrics |
| GET | `/admin/audit-logs` | Paginated audit logs |
| GET | `/admin/routes` | List available routes |
| GET | `/admin/cabs` | List cab options |
| GET | `/admin/booking-alerts` | New booking alerts |

**GET /admin/health-summary**
```json
Response (200):
{
  "data": {
    "status": "ok",
    "dbReady": true,
    "metrics": {
      "totalRequests": 5234,
      "activeUsers": 142,
      "averageResponseTime": 45.2
    },
    "auditCount": 892
  }
}
```

**GET /admin/audit-logs?page=1&pageSize=20**
```json
Response (200):
{
  "data": {
    "logs": [
      {
        "_id": "...",
        "action": "BOOKING_CREATED",
        "actor": {
          "userId": "...",
          "role": "user",
          "email": "user@example.com"
        },
        "target": { "type": "booking", "id": "..." },
        "metadata": { "tripType": "ONE_WAY" },
        "createdAt": "2026-03-01T12:00:00.000Z"
      }
    ]
  },
  "meta": {
    "page": 1,
    "pageSize": 20,
    "total": 892
  }
}
```

#### Public Booking Module (`/public`) [No Auth Required]

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/public/search` | Search available routes & cabs |
| POST | `/public/bookings` | Create guest booking |

**POST /public/search**
```json
Request Body:
{
  "schedule": {
    "pickupDate": "2026-03-15"
  }
}

Response (200):
{
  "data": {
    "routes": [ /* RouteOption objects */ ],
    "cabs": [ /* CabOption objects */ ]
  }
}
```

**POST /public/bookings**
```json
Request Body:
{
  "tripType": "ONE_WAY",
  "pickup": { "address": "123 Main St" },
  "dropoff": { "address": "Airport" },
  "schedule": { "pickupDate": "2026-03-15", "pickupTime": "14:30" },
  "contact": {
    "name": "Jane Smith",
    "email": "jane@example.com",
    "phone": "+1234567890"
  },
  "selection": {
    "route": "Downtown-Airport",
    "cabType": "Economy"
  }
}

Response (201):
{
  "data": {
    "booking": { /* booking object */ }
  }
}
```

#### Legacy Compatibility
**POST /api/bookings** - Maps to `/public/bookings` for backward compatibility

---

## Authentication & Authorization

### JWT Token Structure

**Access Token:**
```
Header: { "alg": "HS256", "typ": "JWT" }
Payload: {
  "sub": "userId",          // User ID (subject)
  "role": "user|admin",     // User role
  "email": "user@example.com",
  "iat": 1234567890,        // Issued at
  "exp": 1234571490         // Expires in (typically 15 minutes)
}
Signature: HMAC-SHA256(header.payload, AUTH_SECRET)
```

**Refresh Token:**
```
Header: { "alg": "HS256", "typ": "JWT" }
Payload: {
  "sub": "userId",
  "role": "user|admin",
  "email": "user@example.com",
  "iat": 1234567890,
  "exp": 1234654290         // Expires in (typically 7 days)
}
Signature: HMAC-SHA256(header.payload, REFRESH_SECRET)
```

### Authentication Flow

**Login/Register:**
```
1. User sends credentials
2. Server validates password (bcrypt)
3. Server generates access token (short-lived, 15 min)
4. Server generates refresh token (long-lived, 7 days)
5. Refresh token hashed and stored in RefreshToken collection
6. Both tokens returned to client
```

**Token Refresh:**
```
1. Client detects access token expiration
2. Client sends refresh token to /auth/refresh
3. Server validates refresh token signature
4. Server retrieves corresponding RefreshToken record
5. Server checks: not expired, not revoked
6. Server invalidates old refresh token (set revokedAt)
7. Server issues new access & refresh token pair
```

**Logout:**
```
1. Client sends refresh token to /auth/logout
2. Server finds all RefreshToken records with matching token hash
3. Server marks them as revoked (set revokedAt = now)
4. Client clears localStorage tokens
```

### Authorization (RBAC)

**Roles:**
- `user`: Standard authenticated user
  - Can create and manage own bookings
  - Can view own bookings
  - Cannot access admin features
  
- `admin`: Administrator
  - Can create bookings for others
  - Can update any booking status
  - Can view all audit logs
  - Can manage routes and cabs
  - Can view system health metrics

**Route Protection:**
```javascript
// Unprotected: /auth/register, /auth/login, /health/*, /public/*

// Protected (authenticated): /bookings/*, /auth/refresh, /auth/logout
app.get('/bookings', authenticate(config), listBookings)

// Admin-only: /admin/*
app.get('/admin/audit-logs', authenticate(config), requireRole('admin'), listAuditLogs)
```

---

## Business Logic & Services

### Authentication Service (`server/src/modules/auth/service.js`)

**`register(input, config)`**
- Validates email not already registered
- Bcrypt hashes password (10 rounds)
- Creates User document
- Calls `createSession` to issue tokens
- Returns user object and token pair

**`login(input, config)`**
- Finds user by lowercase email
- Compares plaintext password with stored hash (bcrypt)
- Throws 401 if invalid credentials
- Calls `createSession` to issue tokens
- Returns user object and token pair

**`refresh(refreshTokenRaw, config)`**
- Verifies refresh token signature
- Hashes token and queries RefreshToken collection
- Validates: not revoked, not expired
- Marks old refresh token as revoked
- Retrieves user and calls `createSession`
- Returns new token pair

**`logout(refreshTokenRaw)`**
- Hashes token
- Updates all matching RefreshToken records: set revokedAt = now
- Effectively invalidates all sessions with that token

**`createSession(user, config)`**
- Creates token payload with: userId, role, email
- Signs access token (15 min TTL)
- Signs refresh token (7 days TTL)
- Stores RefreshToken document with expiry
- Returns { user, accessToken, refreshToken }

### Booking Service (`server/src/modules/booking/service.js`)

**`createBooking(payload, actor, requestId, idempotencyKey)`**
- **Idempotency Check:** If idempotencyKey provided, lookup IdempotencyKey collection
  - If found: return cached response immediately (prevents duplicate booking)
  - If not found: proceed with creation
- **Fare Calculation:** Calls `calculateFare(payload)` to compute totalAmount
- **Passenger Creation:** If contact info provided, creates Passenger record
- **Booking Creation:** Inserts Booking document with:
  - userId (null for guests)
  - Trimmed addresses
  - Parsed schedule dates
  - Fare amount
  - Default status: PENDING
- **Event Logging:** Creates BookingEvent record with CREATED event type
- **Audit Logging:** If admin actor, creates AuditLog record
- **Idempotency Storage:** If idempotencyKey provided, stores response in IdempotencyKey
- Returns booking document

**`calculateFare(payload)`**
- Queries RouteOption for matching fromHub/toHub
- Queries CabOption for matching cabType with availability window
- Formula: `flatRate * cabMultiplier = totalFare`
- Returns computed fare amount

**`updateBookingStatus(bookingId, newStatus, actor, requestId)`**
- Validates status transition using ALLOWED_TRANSITIONS
- Updates Booking.status to newStatus
- Creates BookingEvent with STATUS_CHANGED
- Creates AuditLog with actor details
- Returns updated booking

**`listBookings(actor)`**
- If user role: return bookings where userId = actor.userId
- If admin role: return all bookings
- Sorted by createdAt descending

**`getBookingById(bookingId, actor)`**
- If user role: verify booking.userId matches actor.userId
- Throws 403 Forbidden if unauthorized access
- If admin role: allow access to any booking
- Returns booking document

**`searchOptions(input)`**
- Queries all RouteOption records
- If pickupDate provided, filters CabOption by availability window
- Returns { routes, cabs } for frontend search results

### Status Transition Rules

```javascript
const ALLOWED_TRANSITIONS = {
  PENDING:   ['CONFIRMED', 'CANCELLED', 'COMPLETED'],
  CONFIRMED: ['PENDING', 'CANCELLED', 'COMPLETED'],
  COMPLETED: ['PENDING', 'CONFIRMED', 'CANCELLED'],
  CANCELLED: ['PENDING', 'CONFIRMED', 'COMPLETED']
}
```

admin can manually transition bookings between any states for operational flexibility.

---

## Frontend Structure

### Directory Layout
```
client/src/
├── index.js                    # Entry point
├── App.js                      # Root component
├── index.css                   # Global styles
├── config.js                   # Frontend config
├── app/
│   ├── providers.jsx          # Context providers setup
│   └── routes.jsx             # Route definitions & navbar
├── components/
│   └── CabBookingForm.jsx     # Booking form component
├── context/
│   └── BookingContext.js      # Booking state (legacy)
├── features/
│   ├── admin/
│   │   └── AdminPage.jsx      # Admin dashboard
│   ├── auth/
│   │   ├── LoginPage.jsx      # Login form
│   │   └── RegisterPage.jsx   # Registration form
│   └── booking/
│       ├── BookingPage.jsx    # User's booking list
│       └── PublicSearchPage.jsx  # Public search & guest booking
├── shared/
│   ├── api/
│   │   ├── endpoints.js       # API call wrappers
│   │   ├── http.js            # Axios instance & interceptors
│   │   └── warmup.js          # Server warmup on app init
│   ├── contexts/
│   │   └── AuthContext.jsx    # Auth state & token management
│   ├── lib/
│   │   └── env.js             # Environment helper
│   └── ui/
│       ├── Alert.jsx          # Error/success alert component
│       └── ProtectedRoute.jsx # Route guard for authenticated routes
```

### Key Components

**AppProviders** (`app/providers.jsx`)
- Wraps app with BrowserRouter
- Wraps with WarmupProvider (server health check)
- Wraps with AuthProvider (auth state management)
- Renders AppRoutes

**AppRoutes** (`app/routes.jsx`)
- Navbar with:
  - Logo/home link
  - Search link
  - Bookings link (authenticated users)
  - Admin link (admin only)
  - Login/Register/Logout buttons (conditional)
- Route definitions:
  - `/` → PublicSearchPage
  - `/login` → LoginPage (redirects if authenticated)
  - `/register` → RegisterPage (redirects if authenticated)
  - `/bookings` → BookingPage (protected)
  - `/admin` → AdminPage (protected, admin-only)

**AuthContext** (`shared/contexts/AuthContext.jsx`)
- State: `user`, `isAuthenticated`, `loading`, `error`
- Methods: `login()`, `register()`, `logout()`
- Token management via `http.js` utilities
- JWT payload decoding for user info
- Provides useAuth() hook

**HTTP Interceptors** (`shared/api/http.js`)
- Request interceptor: Attaches Authorization header with access token
- Response interceptor: 
  - Handles 401 → triggers refresh token flow
  - Auto-retries with new access token
  - Clears tokens on 403 or refresh failure
- Token storage: localStorage (ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY)

**PublicSearchPage** (`features/booking/PublicSearchPage.jsx`)
- Calls searchTrips() to fetch routes and cabs
- Displays search results
- Allows guest booking without authentication
- Calls createPublicBooking() with contact info

**BookingPage** (`features/booking/BookingPage.jsx`)
- Fetches user's bookings on mount
- Classifies bookings as: present (today), planned (future), past
- Tabs for filtering bookings by classification
- Search and status filtering
- Edit booking form for signed-in users

**AdminPage** (`features/admin/AdminPage.jsx`)
- Health summary widget
- Audit logs table with pagination
- Booking alerts feed
- Admin-only visible to authenticated admin users

### State Management

**AuthContext (Local):**
- User object: { id, role, email }
- Authentication status
- Token pair stored in localStorage

**BookingContext (Legacy, Minimal Use):**
- Booking-related state if needed

**Component State (React.useState):**
- Form inputs
- Loading/error states
- Pagination, filtering, sorting

---

## Middleware & Core Utility Layers

### Server Middleware Stack

**1. Security Middleware**
```javascript
app.use(helmet());           // HTTP security headers
app.use(cors({ ... }));      // CORS policy enforcement
app.use(express.json());     // JSON body parsing (1MB limit)
```

**2. Tracing & Metrics**
```javascript
app.use(requestIdMiddleware);   // Generate unique requestId
app.use(metricsMiddleware);     // Track request metrics
app.use(morgan(...));           // HTTP request logging
```

**3. Request Validation Middleware** (`middleware/validate.js`)
- Zod schema validation
- Validates body, params, or query
- Returns 400 with field errors on validation failure
```javascript
validate(schema, 'body')      // Validate req.body
validate(schema, 'params')    // Validate req.params
validate(schema, 'query')     // Validate req.query
```

**4. Authentication Middleware** (`middleware/auth.js`)
```javascript
authenticate(config)      // Check Bearer token, attach req.user
requireRole('admin')      // Verify req.user.role
```

**5. Rate Limiting** (`middleware/rateLimit.js`)
```javascript
authLimiter   // Stricter limit on /auth/register, /auth/login
```

**6. Error Handler Middleware** (`middleware/errorHandler.js`)
- Catches all thrown errors
- Converts to ApiError format
- Logs to logger with requestId
- Returns JSON error response

**7. 404 Handler** (`middleware/notFound.js`)
- Returns 404 for unmatched routes

### Core Libraries

**Logger** (`lib/logger.js`)
- Winston-based logging
- Levels: error, warn, info, debug
- Includes requestId in log context
- Outputs to console in dev, file in production

**Response Helper** (`lib/response.js`)
```javascript
success(res, data, { status: 200, meta: {...} })
problem(res, ApiError)
```

**Error Helper** (`lib/errors.js`)
```javascript
new ApiError({
  status: 400,
  title: 'Validation Error',
  detail: 'User-facing message',
  code: 'error_code',
  fieldErrors: [...]
})
```

**Metrics** (`lib/metrics.js`)
- Tracks: totalRequests, activeUsers, responseTime, errors
- Provides snapshots for admin health summary

**Database Connection** (`lib/db.js`)
- Mongoose connection management
- connectDb() / disconnectDb()
- Connection pooling

**Config** (`lib/config.js`)
- Environment variable validation
- Defaults: NODE_ENV, PORT, MONGO_URI, JWT secrets, etc.
- isDbReady() status flag

### Client HTTP Service

**Axios Instance Setup:**
- Base URL: `http://localhost:5000/api/v1`
- Timeout: 60 seconds
- Request/response interceptors

**Token Management:**
```javascript
getAccessToken()           // Retrieve from localStorage
getRefreshToken()          // Retrieve from localStorage
setSessionTokens({...})    // Store both tokens
clearSessionTokens()       // Clear both tokens
```

**Request Interceptor:**
- Attaches `Authorization: Bearer <accessToken>` header
- Converts snake_case payloads to camelCase

**Response Interceptor:**
- On 401 error: Triggers token refresh flow
  - Calls /auth/refresh with refreshToken
  - Updates tokens
  - Retries original request
- On 403 or refresh failure: Clears tokens and redirects to login
- Converts response data from snake_case to camelCase

---

## Key Features & Workflows

### Feature 1: User Registration & Authentication

**Workflow:**
```
1. User visits /register
2. User enters: name, email, password
3. Client validates form
4. Client POSTs to /auth/register
5. Server:
   - Validates email not registered
   - Bcrypt hashes password
   - Creates User document (role: 'user')
   - Issues token pair
6. Client stores tokens in localStorage
7. Client redirects to /bookings
```

**Security:**
- Password hashed with bcryptjs (10 rounds)
- Email unique constraint
- Access token short-lived (15 min)
- Refresh token persisted server-side for revocation

### Feature 2: Cab Booking Creation

**User Booking (Authenticated):**
```
1. User navigates to /bookings
2. Clicks "New Booking"
3. Fills form:
   - Pickup address
   - Dropoff address
   - Date & time
   - Cab type selection
4. Client POSTs to /bookings with:
   - Authorization header
   - Optional Idempotency-Key header
5. Server:
   - Validates auth token
   - Validates payload schema
   - Checks idempotency (returns cache if duplicate)
   - Calculates fare (route flatRate * cab multiplier)
   - Creates Booking (userId = user.sub, status = PENDING)
   - Logs BookingEvent (CREATED)
   - Logs AuditLog if admin
   - Stores IdempotencyKey response
6. Client displays confirmation
7. Booking appears in booking list (classified as "planned")
```

**Guest Booking (No Auth):**
```
1. User visits / (PublicSearchPage)
2. Searches: pickup, dropoff, date
3. Server returns available routes & cabs
4. User selects and enters contact: name, email, phone
5. Client POSTs to /public/bookings
6. Server:
   - Validates public booking schema (contact required)
   - Calculates fare
   - Creates Passenger record
   - Creates Booking (userId = null)
   - Logs BookingEvent
7. Booking saved as guest record
8. Admin sees booking alert
```

**Idempotency:**
- Client generates UUID and includes in Idempotency-Key header
- Server checks IdempotencyKey collection before processing
- If found: returns cached response immediately (prevents duplicate)
- Critical for reliability when network retries or double-clicks occur

### Feature 3: Booking Status Management (Admin)

**Workflow:**
```
1. Admin logs in (role: 'admin')
2. Navigates to /admin
3. Views booking alerts
4. Clicks on booking to update status
5. Selects new status: CONFIRMED, CANCELLED, COMPLETED
6. Client POSTs to /bookings/:id/status with new status
7. Server:
   - Authenticates admin
   - Validates status transition (ALLOWED_TRANSITIONS)
   - Updates Booking.status
   - Logs BookingEvent (STATUS_CHANGED)
   - Logs AuditLog (actor = admin)
8. Booking reflects new status in UI
```

**Audit Trail:**
- Every state change recorded in BookingEvent (immutable)
- Admin actions recorded in AuditLog
- Supports compliance and operational review

### Feature 4: Session Management & Token Refresh

**Token Lifecycle:**
```
T=0 min:   User logs in → issues access (15 min) + refresh (7 days)
T=14 min:  User makes request → token valid, request succeeds
T=16 min:  User makes request → token expired (401 response)
           ├─ HTTP interceptor detects 401
           ├─ Queries /auth/refresh with refreshToken
           ├─ Server validates refresh token, issues new pair
           ├─ Client updates tokens in localStorage
           ├─ Retries original request with new access token
           └─ Request succeeds
T=7 days:  Refresh token expires
           ├─ User makes request → 401 again
           ├─ Refresh attempt fails (refresh token expired)
           ├─ Client clears tokens, redirects to /login
           └─ User must login again
```

**Logout:**
```
1. User clicks Logout
2. Client calls /auth/logout with refreshToken
3. Server marks RefreshToken as revoked
4. Client clears localStorage tokens
5. Client redirects to /login
```

### Feature 5: Health Probes & Monitoring

**Liveness Probe** (`/health/live`):
- Returns 200 OK immediately
- Server is running

**Readiness Probe** (`/health/ready`):
- Checks MongoDB connection status
- Returns 200 if ready, 503 if degraded
- Used by Kubernetes/Docker health checks

**Admin Health Summary** (`/admin/health-summary`):
- Metrics snapshot: totalRequests, activeUsers, avgResponseTime
- Audit log count
- DB status
- Used for monitoring dashboard

### Feature 6: Audit & Compliance

**BookingEvent (Per-Booking Audit):**
- Immutable event log for each booking
- Records: CREATED, STATUS_CHANGED events
- Includes actor (userId, role), payload, requestId
- Enables reconstruction of booking lifecycle

**AuditLog (Admin Action Log):**
- Records admin-triggered actions: BOOKING_CREATED, STATUS_UPDATED
- Includes: actor (userId, role, email), target, metadata
- Accessible via /admin/audit-logs (paginated)
- Enables compliance audits and operational review

---

## Deployment & Infrastructure

### Docker Compose Setup

**Services:**
1. **mongo** (mongodb:7)
   - Port 27017
   - Volume: mongo_data
   - Default database: cab_project

2. **server** (Express Node.js)
   - Ports: 5000 (internal), 5000 (host)
   - Env: MONGO_URI=mongodb://mongo:27017/cab_project
   - Depends on: mongo

3. **client** (React + Nginx)
   - Ports: 3000 (host, nginx proxy)
   - Env: REACT_APP_API_URL, REACT_APP_API_PREFIX
   - Depends on: server

**Volume:**
- `mongo_data`: Persists MongoDB data across container restarts

### Environment Variables

**Server (.env):**
```
NODE_ENV=development|production
PORT=5000
MONGO_URI=mongodb://mongo:27017/cab_project
JWT_ACCESS_SECRET=your-secret-key
JWT_REFRESH_SECRET=your-refresh-key
ALLOWED_ORIGINS=http://localhost:3000,https://example.com
```

**Client (.env):**
```
REACT_APP_API_URL=http://localhost:5000
REACT_APP_API_PREFIX=/api/v1
```

### Containerization

**Server Dockerfile:**
- Base: Node 18 (slim)
- Copies source
- Installs dependencies
- Exposes port 5000
- Runs: `npm run dev` or `npm start`

**Client Dockerfile:**
- Build stage: Node 18 + React build
- Runtime stage: Nginx
- Copies build output to /usr/share/nginx/html
- Exposes port 3000 (via nginx)

### Reverse Proxy (Nginx)

**Configuration:**
- Listens on port 3000
- Serves React static build
- Rewrites routes to index.html (SPA support)
- Can proxy /api to backend server

---

## Development Workflow

### Local Setup

**Server:**
```bash
cd server
cp .env.example .env        # Create config
npm install                  # Install dependencies
npm run migrate:indexes      # Create DB indexes
npm run seed-admin          # Create default admin user
npm run dev                 # Start dev server (nodemon)
```

**Client:**
```bash
cd client
cp .env.example .env
npm install
npm start                   # Start dev server (port 3000)
```

**Docker Compose:**
```bash
docker compose up --build   # Build and start all services
```

### Testing

```bash
# Server
cd server
npm run lint                # ESLint
npm test                    # Node test runner
npm run test:coverage       # Coverage report

# Client
cd client
npm run lint                # ESLint
npm test                    # Jest tests
npm run build               # Production build
```

### Load Testing

```bash
cd server/loadtest
k6 run k6-health.js         # Health endpoint load test
```

---

## Summary

**Cab Platform Pro** is a sophisticated, production-ready booking platform demonstrating:

✅ **Architecture:**
- Modular Express backend with layered middleware
- React SPA frontend with context-based state management
- MongoDB document store with proper indexing
- Docker containerization for easy deployment

✅ **Security:**
- JWT tokens with refresh rotation
- Password hashing with bcryptjs
- Role-based access control
- CORS, Helmet, rate limiting

✅ **Reliability:**
- Idempotent request handling
- Audit trails for compliance
- Health probes for monitoring
- Error handling with structured responses

✅ **Data Integrity:**
- Schema validation (Zod)
- Status transition rules
- Immutable event logs
- Indexed database queries

✅ **Developer Experience:**
- Clear separation of concerns
- Comprehensive configuration
- Type-safe validation (Zod)
- Structured logging with request IDs

---

**Document Version:** 1.0  
**Last Updated:** March 1, 2026  
**Author:** CodebaseAnalysis
