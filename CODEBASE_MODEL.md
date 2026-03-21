# Cab Platform Pro - Complete Working Model

**Last Updated**: March 12, 2026  
**Version**: 1.0  
**Status**: Production-Grade

---

## Table of Contents
1. [System Overview](#system-overview)
2. [Architecture](#architecture)
3. [Database Models](#database-models)
4. [Server Implementation](#server-implementation)
5. [Client Implementation](#client-implementation)
6. [API Specification](#api-specification)
7. [Core Features & Workflows](#core-features--workflows)
8. [Security & Reliability](#security--reliability)
9. [Deployment & DevOps](#deployment--devops)

---

## System Overview

**Cab Platform Pro** is a full-stack cab booking application enabling users to search routes, select vehicles, and create bookings. It supports both authenticated users and guest bookings.

### Key Characteristics
- **Full-Stack**: React 18 frontend + Node.js/Express backend
- **Database**: MongoDB with Mongoose ORM
- **Authentication**: JWT-based with refresh token rotation
- **Authorization**: Role-based access control (RBAC) - user & admin roles
- **State Management**: React Context API for auth
- **Styling**: Tailwind CSS with PostCSS
- **API Style**: RESTful JSON with versioning (`/api/v1`)
- **Quality**: Linting, testing, Docker containerization, comprehensive docs

---

## Architecture

### High-Level Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    CLIENT LAYER (React)                      │
├─────────────────────────────────────────────────────────────┤
│  Public Pages          │  Authenticated Pages  │  Admin Pages │
│  • Landing/Search      │  • Booking List       │  • Dashboard  │
│  • Guest Booking       │  • Booking Details    │  • Routes Mgmt│
│  • Login/Register      │  • User Profile       │  • Cabs Mgmt  │
│                        │                       │  • Audit Logs │
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTP/JSON
                    ┌──────────▼──────────┐
                    │  API Gateway (Nginx)│
                    │  (Reverse Proxy)    │
                    └──────────┬──────────┘
                               │
┌──────────────────────────────▼──────────────────────────────┐
│              SERVER LAYER (Express.js)                       │
├──────────────────────────────────────────────────────────────┤
│                  Middleware Pipeline                         │
│  Helmet │ CORS │ Logger │ Auth │ Validate │ ErrorHandler  │
├──────────────────────────────────────────────────────────────┤
│              Router (v1 & Legacy Routes)                    │
│  ┌─────────────┬────────────────┬────────────┬────────────┐ │
│  │ Auth Routes │ Booking Routes │ Public API │ Admin API  │ │
│  └─────────────┴────────────────┴────────────┴────────────┘ │
├──────────────────────────────────────────────────────────────┤
│  Service Layer (Business Logic)                             │
│  • AuthService   • BookingService   • AdminService         │
├──────────────────────────────────────────────────────────────┤
│              Data Layer (Mongoose Models)                   │
│  User │ RefreshToken │ Booking │ RouteOption │ CabOption   │
└──────────────────────────────┬──────────────────────────────┘
                               │ TCP/MongoDB Protocol
                    ┌──────────▼──────────┐
                    │  MongoDB (NoSQL DB) │
                    │  Collections:       │
                    │  • users            │
                    │  • bookings         │
                    │  • routeoptions     │
                    │  • caboptions       │
                    │  • auditlogs        │
                    │  • bookingevents    │
                    │  • refreshtokens    │
                    │  • idempotencykeys  │
                    └─────────────────────┘
```

### Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend Framework | React 18 | Component-based UI |
| Frontend Routing | React Router v6 | Client-side navigation |
| Frontend Styling | Tailwind CSS | Utility-first CSS |
| State Management | React Context API | Global auth state |
| HTTP Client | Axios | API communication with interceptors |
| Backend Framework | Express.js | REST API server |
| Database | MongoDB 7 | Document-based persistence |
| ODM | Mongoose 7 | Schema validation & queries |
| Authentication | JWT (jsonwebtoken) | Stateless auth tokens |
| Password Hashing | bcryptjs | Secure password storage |
| Input Validation | Zod | Runtime schema validation |
| Security | Helmet.js | HTTP header hardening |
| Rate Limiting | express-rate-limit | API abuse prevention |
| Logging | Morgan | HTTP request logging |
| Containerization | Docker | Application packaging |
| Orchestration | docker-compose | Multi-service coordination |
| Web Server | Nginx | Reverse proxy & static hosting |
| Load Testing | K6 | Performance testing |
| CI/CD | GitHub Actions | Automated testing & quality |

---

## Database Models

### 1. **User**
Represents registered users in the system.

```javascript
{
  _id: ObjectId,
  name: String,                    // e.g., "John Doe"
  email: String,                   // Unique, lowercase
  passwordHash: String,            // bcryptjs hashed (12 rounds)
  role: String,                    // "user" or "admin"
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes**: `{ email: 1 }` (unique)

**Constraints**: 
- Email must be valid and unique
- Name min 2 characters
- Password min 8 characters

---

### 2. **Booking**
Core booking records linking users to trip selections.

```javascript
{
  _id: ObjectId,
  userId: ObjectId | null,         // For authenticated users
  tripType: String,                // ONE_WAY, ROUND_TRIP, AIRPORT, HOURLY
  pickup: {
    address: String,               // "123 Main St, City, State"
    coordinates: {
      lat: Number,
      lng: Number
    }
  },
  dropoff: {
    address: String,
    coordinates: {
      lat: Number,
      lng: Number
    }
  },
  schedule: {
    pickupDate: Date,
    pickupTime: String             // HH:MM format
  },
  passengerId: ObjectId | null,    // Reference to Passenger (for guests)
  contact: {
    name: String,
    email: String,
    phone: String
  },
  selection: {
    route: String,                 // Route label/name
    cabType: String,               // "Economy", "Comfort", "Premium"
    carModel: String               // "Toyota Innova", etc.
  },
  fare: {
    totalAmount: Number            // Calculated: routeFlatRate × cabMultiplier
  },
  status: String,                  // PENDING, CONFIRMED, CANCELLED, COMPLETED
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes**: 
- `{ userId: 1, createdAt: -1 }`
- `{ status: 1 }`

**Status Flow**: Any → Any (flexible state machine)

---

### 3. **Passenger**
Guest passenger information for unauthenticated bookings.

```javascript
{
  _id: ObjectId,
  name: String,
  email: String,                   // Index for lookups
  phone: String,                   // Index for lookups
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes**: `{ email: 1 }`, `{ phone: 1 }`

---

### 4. **RouteOption**
Available routes with flat-rate pricing.

```javascript
{
  _id: ObjectId,
  fromHub: String,                 // "Downtown Station"
  toHub: String,                   // "Airport Terminal 1"
  flatRate: Number,                // Base fare in currency units
  label: String,                   // "Delhi - Airport"
  createdAt: Date,
  updatedAt: Date
}
```

**Purpose**: Seeded during setup, admin-manageable for adding new routes.

---

### 5. **CabOption**
Vehicle types with pricing multipliers.

```javascript
{
  _id: ObjectId,
  cabType: String,                 // "Economy", "Comfort", "Premium"
  carModel: String,                // "Toyota Innova", "Hyundai Creta"
  multiplier: Number,              // 1.0 (base), 1.5 (premium), etc.
  availableFrom: String,           // HH:MM
  availableTo: String,             // HH:MM
  createdAt: Date,
  updatedAt: Date
}
```

**Fare Calculation**: `booking.fare = routeOption.flatRate × cabOption.multiplier`

---

### 6. **BookingEvent**
Immutable event log for all booking state changes.

```javascript
{
  _id: ObjectId,
  bookingId: ObjectId,             // Reference to Booking
  eventType: String,               // "CREATED", "STATUS_CHANGED", "PAYMENT_PROCESSED"
  actor: {
    userId: ObjectId | null,
    role: String,                  // "user", "admin", "system"
    email: String
  },
  payload: Object,                 // Event-specific data
  requestId: String,               // UUID for tracing
  createdAt: Date
}
```

**Purpose**: Audit trail for all booking mutations.

**Indexes**: `{ bookingId: 1, createdAt: -1 }`

---

### 7. **AuditLog**
Admin action audit trail.

```javascript
{
  _id: ObjectId,
  action: String,                  // "CREATE_BOOKING", "UPDATE_ROUTE", "DELETE_CAB"
  actor: {
    userId: ObjectId,
    role: String,
    email: String
  },
  target: Object,                  // { type: "Booking", id: ObjectId }
  metadata: Object,                // Action-specific details
  requestId: String,               // UUID for tracing
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes**: `{ createdAt: -1 }`, `{ action: 1 }`

---

### 8. **RefreshToken**
Persistent JWT refresh token storage for revocation support.

```javascript
{
  _id: ObjectId,
  userId: ObjectId,                // Reference to User
  tokenHash: String,               // SHA256 hash of actual token
  expiresAt: Date,                 // TTL for automatic cleanup
  revokedAt: Date | null,          // Set when user logs out
  createdAt: Date
}
```

**Indexes**: `{ userId: 1 }`, `{ tokenHash: 1 }`, `{ expiresAt: 1 }`

**Purpose**: Allow refresh token revocation (logout) while keeping access tokens stateless.

---

### 9. **IdempotencyKey**
Prevents duplicate booking creation from retried requests.

```javascript
{
  _id: ObjectId,
  key: String,                     // Client-supplied or server-generated UUID
  userId: ObjectId,
  endpoint: String,                // "/api/v1/bookings"
  responseStatus: Number,          // 201, 400, etc.
  responseBody: Object,            // Original response
  createdAt: Date,
  expiresAt: Date                  // TTL for cleanup
}
```

**Indexes**: `{ key: 1, userId: 1, endpoint: 1 }` (unique compound)

**Purpose**: Idempotent POST requests. If same idempotency key received, return cached response.

---

## Server Implementation

### Directory Structure

```
server/
├── src/
│   ├── app.js                          # Express app setup
│   ├── server.js                       # Entry point
│   ├── lib/
│   │   ├── config.js                   # Environment & configuration
│   │   ├── db.js                       # MongoDB connection
│   │   ├── error.js                    # Error classes & handling
│   │   ├── logger.js                   # Logging utilities
│   │   ├── metrics.js                  # In-memory metrics
│   │   └── response.js                 # Response formatters
│   ├── middleware/
│   │   ├── auth.js                     # JWT verification & RBAC
│   │   ├── errorHandler.js             # Centralized error handler
│   │   ├── notFound.js                 # 404 handling
│   │   ├── rateLimit.js                # Rate limiting config
│   │   ├── requestId.js                # Request ID generation
│   │   └── validate.js                 # Zod validation wrapper
│   ├── modules/
│   │   ├── auth/
│   │   │   ├── routes.js               # /auth endpoints
│   │   │   ├── schemas.js              # Zod validation schemas
│   │   │   ├── service.js              # Auth business logic
│   │   │   └── tokens.js               # JWT token generation
│   │   ├── booking/
│   │   │   ├── routes.js               # /bookings endpoints
│   │   │   ├── publicRoutes.js         # /public endpoints
│   │   │   ├── schemas.js              # Booking schemas
│   │   │   └── service.js              # Booking logic
│   │   ├── admin/
│   │   │   └── routes.js               # Admin endpoints
│   │   └── health/
│   │       └── routes.js               # Health check endpoints
│   └── routes/
│       ├── v1.js                       # Main v1 router
│       └── legacy.js                   # /api/bookings compatibility
├── models/
│   ├── User.js
│   ├── Booking.js
│   ├── Passenger.js
│   ├── RouteOption.js
│   ├── CabOption.js
│   ├── BookingEvent.js
│   ├── AuditLog.js
│   ├── IdempotencyKey.js
│   └── RefreshToken.js
├── scripts/
│   ├── seed-admin.js                   # Create default admin user
│   ├── promote-admin.js                # Elevate user to admin
│   └── migrate-indexes.js              # Create database indexes
├── test/
│   ├── auth-tokens.test.js
│   ├── health.integration.test.js
│   ├── public-search.test.js
│   └── validation.test.js
├── openapi/
│   └── openapi.yaml                    # OpenAPI 3.0 specification
├── package.json
├── Dockerfile
└── .env.example
```

### Middleware Stack (Order Matters)

```javascript
// server/src/app.js
app.use(helmet());                           // Security headers
app.use(cors(corsOptions));                  // CORS enabling
app.use(morgan('combined'));                 // HTTP logging
app.use(express.json());                     // JSON parsing
app.use(requestId);                          // Request tracing
app.use('/api/v1', rateLimit);              // Rate limiting on API
app.use('/api/v1', authenticate);           // JWT verification (conditional)
app.use('/api/v1', validate);               // Request validation
app.use('/api/v1', routes);                 // Main router
app.use(errorHandler);                       // Error handling (last)
```

### Module Pattern: Auth Example

**routes.js** - Endpoint definitions:
```javascript
POST /auth/register      → AuthService.register() → success response
POST /auth/login         → AuthService.login() → JWT tokens
POST /auth/refresh       → AuthService.refresh() → New access token
POST /auth/logout        → AuthService.logout() → Token revocation
```

**schemas.js** - Input validation with Zod:
```javascript
RegisterSchema = { name: string(2+), email: email, password: string(8+) }
LoginSchema = { email, password }
```

**service.js** - Business logic:
```javascript
register(email, name, password) {
  → Validate email unique
  → Hash password with bcrypt (12 rounds)
  → Create User record
  → Generate first RefreshToken
  → Return JWT tokens
}

login(email, password) {
  → Find User by email
  → Verify password hash
  → Create RefreshToken
  → Return JWT tokens
}

refresh(userId, refreshTokenHash) {
  → Find & validate RefreshToken
  → Check not revoked/expired
  → Generate new access token
  → Create new RefreshToken (rotation)
  → Return tokens
}

logout(userId, refreshTokenHash) {
  → Mark RefreshToken as revokedAt = now()
  → Client will fail on next refresh
}
```

### Authentication Flow

```
1. User registers
   POST /auth/register { email, name, password }
   → Hash password
   → Create User
   → Create RefreshToken
   → Return { accessToken, refreshToken }
   
2. User logs in
   POST /auth/login { email, password }
   → Verify password
   → Create RefreshToken
   → Return { accessToken, refreshToken }
   
3. Access token expires (15 min)
   POST /auth/refresh { refreshToken }
   → Verify refresh token is valid & not revoked
   → Rotate: create new RefreshToken, return new access token
   → Old refresh token keeps working but new one used next
   
4. User logs out
   POST /auth/logout { refreshToken }
   → Mark refresh token as revokedAt
   → Client discards tokens
```

### Booking Creation with Idempotency

```javascript
POST /api/v1/bookings {
  tripType: "ONE_WAY",
  pickup: { address, coordinates },
  dropoff: { address, coordinates },
  schedule: { pickupDate, pickupTime },
  selection: { route, cabType },
  idempotencyKey: "uuid-client-generated"
}

Server:
1. Check IdempotencyKey collection
   - If found & not expired → return cached responseBody
   - Create or skip existing record
   
2. Validate request with Zod schema
   - Invalid → return 400 with field errors
   
3. Look up RouteOption by selection.route
   - Not found → return 400
   
4. Look up CabOption by selection.cabType
   - Not found → return 400
   
5. Calculate fare = routeOption.flatRate × cabOption.multiplier
   
6. For guest bookings:
   - Create Passenger from contact info
   - Create Booking with passengerId, no userId
   
   For user bookings:
   - Create Booking with userId
   
7. Create immutable BookingEvent (CREATED)

8. If authenticated, create AuditLog

9. Store response in IdempotencyKey collection (TTL 24h)

10. Return 201 Created with booking details
```

### Admin Status Update

```javascript
PATCH /api/v1/bookings/:id/status {
  status: "CONFIRMED",
  fare: { totalAmount: 500 },           // Optional override
  selection: { route: "...", cabType: "" }  // Optional override
}

Server (admin only):
1. Fetch booking
2. Validate status in allowed list
3. Update booking fields
4. Create BookingEvent (STATUS_CHANGED)
5. Create AuditLog
6. Return updated booking
```

### Error Handling

```javascript
// Standardized error response
{
  status: 400,
  title: "Validation Error",
  detail: "Input validation failed",
  code: "VALIDATION_ERROR",
  fieldErrors: {
    email: "Invalid email format",
    password: "Must be 8+ characters"
  }
}
```

**Error Classes**: ApiError, ValidationError, NotFoundError, UnauthorizedError

---

## Client Implementation

### Directory Structure

```
client/
├── public/
│   └── index.html                     # HTML template
├── src/
│   ├── index.js                       # React.createRoot entry
│   ├── index.css                      # Global styles
│   ├── config.js                      # API URL config
│   ├── App.js                         # Main app component
│   ├── app/
│   │   ├── routes.jsx                 # Route definitions
│   │   └── providers.jsx              # Context providers wrapper
│   ├── components/
│   │   ├── CabBookingForm.jsx         # Main booking form
│   │   ├── AutocompleteDropdown.jsx   # Location autocomplete
│   │   └── SafarExpressLogo.jsx       # Logo component
│   ├── context/
│   │   └── BookingContext.js          # Booking state (local)
│   ├── features/
│   │   ├── auth/
│   │   │   ├── LoginPage.jsx
│   │   │   └── RegisterPage.jsx
│   │   ├── booking/
│   │   │   ├── PublicSearchPage.jsx   # Landing + guest booking
│   │   │   ├── BookingPage.jsx        # User bookings list
│   │   │   └── BookingDetail.jsx      # Single booking view
│   │   └── admin/
│   │       └── AdminPage.jsx          # Admin dashboard
│   └── shared/
│       ├── api/
│       │   ├── endpoints.js           # API function wrappers
│       │   ├── health.js              # Health check
│       │   ├── http.js                # Axios instance setup
│       │   └── warmup.js              # Backend warmup
│       ├── contexts/
│       │   ├── AuthContext.jsx        # Global auth state
│       │   └── WarmupContext.jsx      # Warmup state
│       ├── lib/
│       │   └── env.js                 # Environment helpers
│       └── ui/
│           ├── Alert.jsx              # Alert component
│           ├── ProtectedRoute.jsx     # Private route guard
│           └── Navbar.jsx             # Navigation bar
├── package.json
├── tailwind.config.js
├── postcss.config.js
├── Dockerfile
└── .env.example
```

### React Component Hierarchy

```
<App>
  └─ <WarmupProvider>
      └─ <AuthProvider>
          └─ <BrowserRouter>
              └─ <Routes>
                  ├─ <PublicSearchPage> →  CabBookingForm
                  ├─ <LoginPage>
                  ├─ <RegisterPage>
                  ├─ <ProtectedRoute>
                  │   └─ <BookingPage>
                  ├─ <ProtectedRoute admin>
                  │   └─ <AdminPage>
                  └─ ...other public pages
```

### Authentication Context (useAuth Hook)

```javascript
const AuthContext = createContext();

function AuthProvider({ children }) {
  const [user, setUser] = useState(null);      // { _id, email, role }
  const [tokens, setTokens] = useState(null);  // { accessToken, refreshToken }
  const [loading, setLoading] = useState(true);

  const register = async (email, name, password) => {
    const response = await http.post('/auth/register', {...});
    storeTokens(response.accessToken, response.refreshToken);
    return response;
  };

  const login = async (email, password) => {
    const response = await http.post('/auth/login', {...});
    storeTokens(response.accessToken, response.refreshToken);
    return response;
  };

  const logout = async () => {
    await http.post('/auth/logout', {});
    clearTokens();
  };

  return (
    <AuthContext.Provider value={{ user, tokens, login, register, logout, ... }}>
      {children}
    </AuthContext.Provider>
  );
}

const useAuth = () => useContext(AuthContext);  // Hook usage
```

### HTTP Client with JWT Handling

```javascript
// shared/api/http.js
const http = axios.create({
  baseURL: process.env.REACT_APP_API_URL,
  timeout: 5000
});

// Request interceptor: Add Bearer token
http.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  config.headers['X-Request-Id'] = generateUUID();
  return config;
});

// Response interceptor: Handle 401 + token refresh
http.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      const refreshToken = localStorage.getItem('refreshToken');
      const newTokens = await http.post('/auth/refresh', { refreshToken });
      localStorage.setItem('accessToken', newTokens.accessToken);
      localStorage.setItem('refreshToken', newTokens.refreshToken);
      // Retry original request with new token
      return http(error.config);
    }
    throw error;
  }
);

export default http;
```

### Pages Overview

#### PublicSearchPage (`/`)
- Hero section with search form
- Search routes by pickup/dropoff (GET /public/search → list RouteOptions)
- Select cab type (GET /public/search → list CabOptions with multipliers)
- For authenticated: Create booking (POST /bookings)
- For guest: Enter contact info (POST /public/bookings with Passenger)
- Tab-based filters (today, upcoming, past bookings if logged in)

#### LoginPage (`/login`)
- Email + password form
- POST /auth/login
- Stores JWT tokens in localStorage
- Redirects to `/bookings` on success

#### RegisterPage (`/register`)
- Email + name + password form
- Validation feedback
- POST /auth/register
- Auto-login on success

#### BookingPage (`/bookings`)
- Protected route (redirects to login if not authenticated)
- Tab filters: Today's bookings, Upcoming (next 7 days), Past (historical)
- For each booking: card with trip details, fare, status, actions
- Click booking → BookingDetail modal

#### AdminPage (`/admin`)
- Protected route (admin only - checks user.role === "admin")
- Tabs:
  - **Routes**: Table of RouteOptions, add/edit/delete routes
  - **Cabs**: Table of CabOptions with multipliers, add/edit/delete cabs
  - **Bookings**: Search + filter bookings, bulk status update, fare override
  - **Audit Logs**: Paginated table of all admin actions with actor, action, timestamp
  - **Health**: System metrics, DB status, request count, error rate

### Styling: Tailwind CSS

- Utility-first approach (no custom CSS files)
- Glass-morphism effects in CabBookingForm
- Responsive design (mobile-first)
- Configured colors, spacing, shadows in `tailwind.config.js`
- PostCSS pipeline for automatic vendor prefixes

---

## API Specification

### Authentication Routes

#### `POST /api/v1/auth/register`
Create a new user account.

**Request**:
```json
{
  "email": "user@example.com",
  "name": "John Doe",
  "password": "SecurePass123"
}
```

**Response** (201):
```json
{
  "accessToken": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "refreshToken": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "user": { "_id": "...", "email": "...", "role": "user" }
}
```

**Errors**:
- `400`: Email already exists / Invalid input
- `500`: Server error

---

#### `POST /api/v1/auth/login`
Authenticate and obtain JWT tokens.

**Request**:
```json
{
  "email": "user@example.com",
  "password": "SecurePass123"
}
```

**Response** (200):
```json
{
  "accessToken": "...",
  "refreshToken": "...",
  "user": { "_id": "...", "email": "...", "role": "user" }
}
```

**Errors**:
- `400`: Invalid credentials
- `404`: User not found

---

#### `POST /api/v1/auth/refresh`
Exchange refresh token for new access token (with refresh rotation).

**Request**:
```json
{
  "refreshToken": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}
```

**Response** (200):
```json
{
  "accessToken": "...",
  "refreshToken": "..."  // New token (rotated)
}
```

**Errors**:
- `401`: Invalid/revoked/expired refresh token

---

#### `POST /api/v1/auth/logout`
Revoke refresh token and invalidate session.

**Request**:
```json
{
  "refreshToken": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}
```

**Response** (200):
```json
{
  "message": "Logged out successfully"
}
```

---

### Booking Routes (Authenticated)

#### `POST /api/v1/bookings`
Create a booking as authenticated user.

**Request**:
```json
{
  "tripType": "ONE_WAY",
  "pickup": {
    "address": "123 Main St, City, State",
    "coordinates": { "lat": 28.7041, "lng": 77.1025 }
  },
  "dropoff": {
    "address": "International Airport, City",
    "coordinates": { "lat": 28.5562, "lng": 77.1000 }
  },
  "schedule": {
    "pickupDate": "2026-03-15",
    "pickupTime": "14:30"
  },
  "selection": {
    "route": "Delhi - Airport",
    "cabType": "Comfort",
    "carModel": "Hyundai Creta"
  },
  "idempotencyKey": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Response** (201):
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "userId": "507f1f77bcf86cd799439010",
  "tripType": "ONE_WAY",
  "pickup": { "address": "...", "coordinates": {...} },
  "dropoff": { "address": "...", "coordinates": {...} },
  "selection": { "route": "...", "cabType": "...", "carModel": "..." },
  "fare": { "totalAmount": 425 },
  "status": "PENDING",
  "createdAt": "2026-03-12T14:30:00Z",
  "updatedAt": "2026-03-12T14:30:00Z"
}
```

**Errors**:
- `400`: Validation error / Route/cab not found / Duplicate idempotency key (same response)
- `401`: Unauthorized
- `500`: Server error

---

#### `GET /api/v1/bookings`
List authenticated user's bookings (admin sees all).

**Query Params**:
- `status=CONFIRMED` - Filter by status
- `limit=10` - Pagination limit
- `offset=0` - Pagination offset

**Response** (200):
```json
{
  "data": [
    { "_id": "...", "userId": "...", "status": "CONFIRMED", ... },
    { "_id": "...", "userId": "...", "status": "COMPLETED", ... }
  ],
  "pagination": {
    "limit": 10,
    "offset": 0,
    "total": 23
  }
}
```

---

#### `GET /api/v1/bookings/:id`
Fetch single booking details.

**Response** (200):
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "userId": "507f1f77bcf86cd799439010",
  "status": "PENDING",
  ...full booking object...
}
```

**Errors**:
- `404`: Booking not found
- `403`: User cannot view other users' bookings (auth check)

---

#### `PATCH /api/v1/bookings/:id/status`
Update booking status (admin only).

**Request**:
```json
{
  "status": "CONFIRMED",
  "fare": { "totalAmount": 450 },               // Optional override
  "selection": { "cabType": "Premium", ... }   // Optional override
}
```

**Response** (200):
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "status": "CONFIRMED",
  "fare": { "totalAmount": 450 },
  ...updated booking...
}
```

**Errors**:
- `403`: User is not admin
- `404`: Booking not found
- `400`: Invalid status

---

### Public Booking Routes (Unauthenticated)

#### `POST /api/v1/public/search`
Search available routes and cabs (no auth required).

**Query Params**:
- `from=Delhi` - Pickup location
- `to=Airport` - Dropoff location
- `date=2026-03-15` - Travel date

**Response** (200):
```json
{
  "routes": [
    { "_id": "...", "fromHub": "Delhi", "toHub": "Airport", "flatRate": 400, "label": "Delhi - Airport" }
  ],
  "cabs": [
    { "_id": "...", "cabType": "Economy", "carModel": "...", "multiplier": 1.0 },
    { "_id": "...", "cabType": "Comfort", "carModel": "...", "multiplier": 1.5 }
  ]
}
```

---

#### `POST /api/v1/public/bookings`
Create guest booking without authentication.

**Request**:
```json
{
  "tripType": "ONE_WAY",
  "pickup": { "address": "...", "coordinates": {...} },
  "dropoff": { "address": "...", "coordinates": {...} },
  "schedule": { "pickupDate": "2026-03-15", "pickupTime": "14:30" },
  "selection": { "route": "...", "cabType": "..." },
  "contact": {
    "name": "Jane Doe",
    "email": "jane@example.com",
    "phone": "+91-9876543210"
  },
  "idempotencyKey": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Response** (201):
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "passengerId": "507f1f77bcf86cd799439012",
  "tripType": "ONE_WAY",
  ...booking details...
  "contact": {
    "name": "Jane Doe",
    "email": "jane@example.com",
    "phone": "+91-9876543210"
  }
}
```

---

### Admin Routes

#### `GET /api/v1/admin/health-summary`
System health and metrics snapshot (admin only).

**Response** (200):
```json
{
  "database": {
    "connected": true,
    "responseTime": 5
  },
  "uptime": 3600000,
  "metrics": {
    "totalRequests": 1523,
    "errorRate": 0.02,
    "avgResponseTime": 45
  },
  "bookings": {
    "total": 156,
    "pending": 12,
    "confirmed": 89,
    "completed": 55
  },
  "auditLogCount": 342
}
```

---

#### `GET /api/v1/admin/audit-logs`
Paginated admin action audit logs (admin only).

**Query Params**:
- `limit=20`
- `offset=0`
- `action=UPDATE_BOOKING_STATUS`

**Response** (200):
```json
{
  "data": [
    {
      "_id": "...",
      "action": "UPDATE_BOOKING_STATUS",
      "actor": { "userId": "...", "email": "admin@example.com", "role": "admin" },
      "target": { "type": "Booking", "id": "..." },
      "metadata": { "oldStatus": "PENDING", "newStatus": "CONFIRMED" },
      "createdAt": "2026-03-12T12:00:00Z"
    }
  ],
  "pagination": { "limit": 20, "offset": 0, "total": 342 }
}
```

---

#### `GET /api/v1/admin/routes`
Get all route options (admin only).

**Response** (200):
```json
{
  "data": [
    { "_id": "...", "fromHub": "Delhi", "toHub": "Airport", "flatRate": 400, "label": "Delhi - Airport" }
  ]
}
```

---

#### `POST /api/v1/admin/routes`
Create new route option (admin only).

**Request**:
```json
{
  "fromHub": "Bangalore",
  "toHub": "Mysore",
  "flatRate": 600,
  "label": "Bangalore - Mysore"
}
```

**Response** (201):
```json
{
  "_id": "...",
  "fromHub": "Bangalore",
  "toHub": "Mysore",
  "flatRate": 600,
  "label": "Bangalore - Mysore",
  "createdAt": "2026-03-12T12:00:00Z"
}
```

---

#### `GET /api/v1/admin/cabs`
Get all cab options (admin only).

**Response** (200):
```json
{
  "data": [
    { "_id": "...", "cabType": "Economy", "carModel": "...", "multiplier": 1.0, "availableFrom": "06:00", "availableTo": "23:00" }
  ]
}
```

---

#### `POST /api/v1/admin/cabs`
Create new cab option (admin only).

**Request**:
```json
{
  "cabType": "Executive",
  "carModel": "BMW 7 Series",
  "multiplier": 3.0,
  "availableFrom": "08:00",
  "availableTo": "22:00"
}
```

**Response** (201):
```json
{
  "_id": "...",
  "cabType": "Executive",
  "carModel": "BMW 7 Series",
  "multiplier": 3.0,
  "availableFrom": "08:00",
  "availableTo": "22:00",
  "createdAt": "2026-03-12T12:00:00Z"
}
```

---

### Health Check Routes

#### `GET /health/live`
Liveness probe (always returns live).

**Response** (200):
```json
{
  "status": "live"
}
```

---

#### `GET /health/ready`
Readiness probe (checks database connection).

**Response** (200):
```json
{
  "status": "ready",
  "database": "connected"
}
```

---

#### `GET /api/v1/health`
Alias for health check.

**Response** (200):
```json
{
  "status": "ok"
}
```

---

### Legacy Route (Backward Compatibility)

#### `POST /api/bookings`
Creates guest booking (same as `/api/v1/public/bookings`).

**Purpose**: Legacy clients expecting old endpoint path.

---

## Core Features & Workflows

### 1. User Registration & Authentication Flow

**Step 1: Register**
```
User fills form: name, email, password
→ Client validates locally
→ POST /api/v1/auth/register
→ Server hashes password (bcryptjs, 12 rounds)
→ Creates User document
→ Creates first RefreshToken
→ Generates JWT access token (15m TTL)
→ Returns tokens + user object
→ Client stores in localStorage
```

**Step 2: Auto-login on Refresh**
```
AuthContext loads on app startup
→ Checks localStorage for tokens
→ If found, axios interceptor adds Authorization header
→ User is auto-logged in
```

**Step 3: Token Expiration & Refresh**
```
User makes API request
→ Access token in Authorization header
→ Response is 401 (token expired)
→ Axios interceptor triggers
→ POST /api/v1/auth/refresh { refreshToken }
→ Server validates refresh token (not revoked, not expired)
→ Rotates: creates NEW refresh token
→ Returns new access token + new refresh token
→ Client retries original request
→ User doesn't notice interruption
```

**Step 4: Logout**
```
User clicks logout
→ POST /api/v1/auth/logout { refreshToken }
→ Server marks refresh token as revokedAt = now()
→ Client clears localStorage
→ Redirects to login page
→ Next refresh attempt fails (token revoked)
```

---

### 2. Public Search to Guest Booking

**Step 1: Public Search (No Auth)**
```
Guest lands on / (PublicSearchPage)
→ Types pickup & dropoff locations
→ Selects trip type (ONE_WAY, ROUND_TRIP, etc.)
→ Client calls POST /api/v1/public/search
→ Server returns available RouteOptions + CabOptions
→ UI displays routes & cabs with pricing (flatRate × multiplier)
```

**Step 2: Cab Selection**
```
Guest selects:
- Route: "Delhi - Airport" (flatRate = 400)
- Cab: "Comfort" (multiplier = 1.5)
→ Display calculated fare: 400 × 1.5 = 600
```

**Step 3: Guest Booking Creation**
```
Guest enters contact info: name, email, phone
→ Client generates idempotencyKey (UUID)
→ POST /api/v1/public/bookings {
    tripType, pickup, dropoff, schedule, selection, contact, idempotencyKey
  }
→ Server:
  1. Check IdempotencyKey (if exists with same key, return cached response)
  2. Create Passenger from contact info
  3. Look up RouteOption & CabOption
  4. Calculate fare
  5. Create Booking (no userId, with passengerId)
  6. Create BookingEvent (CREATED)
  7. Store response in IdempotencyKey cache (TTL 24h)
  8. Return 201 with booking details
  
→ UI shows confirmation
```

**Step 4: Optional Login Upgrade**
```
Guest sees login prompt
→ Optionally logs in
→ System can link future bookings to user account
```

---

### 3. Authenticated User Booking

**Step 1: Login**
```
User navigates to /login
→ Enters email + password
→ Client POST /api/v1/auth/login
→ Server validates credentials
→ Returns tokens
→ Client stores in localStorage
→ Redirects to /bookings
```

**Step 2: Search & Book**
```
User sees CabBookingForm (same as public)
→ Fills trip details
→ Selects route & cab
→ Client has Authorization header (access token)
→ POST /api/v1/bookings {
    tripType, selection, schedule, ... idempotencyKey
  }
→ Server:
  1. Authenticate (verify JWT)
  2. Extract userId from token
  3. Check idempotencyKey (prevent duplicates)
  4. Validate inputs
  5. Create Booking with userId
  6. Create BookingEvent (CREATED)
  7. Create AuditLog ("BOOKING_CREATED", actor = user)
  8. Return 201 with booking

→ Booking appears in user's list (/bookings)
```

**Step 3: View Bookings**
```
User navigates to /bookings
→ GET /api/v1/bookings
→ Client axios interceptor adds Authorization header
→ Server extracts userId from JWT
→ Returns user's bookings (filtered by userId)
→ UI displays tabbed view:
  - Today: pickupDate = today
  - Upcoming: pickupDate in next 7 days
  - Past: pickupDate < today

Each booking card shows:
- Route, trip type, date/time
- Selected cab + fare
- Status badge (PENDING, CONFIRMED, CANCELLED, COMPLETED)
- Action buttons (view details, cancel, etc.)
```

---

### 4. Admin Booking Management

**Step 1: Admin Login**
```
Admin user logs in
→ System checks user.role === "admin"
→ /admin route now accessible
```

**Step 2: Access Admin Dashboard**
```
GET /api/v1/admin/health-summary
→ Returns DB status, metrics, booking counts
→ Dashboard shows system health

GET /api/v1/admin/audit-logs?limit=20&offset=0
→ Paginated table of all admin/system actions
→ Shows actor (who), action (what), target (where), timestamp
```

**Step 3: Update Booking Status**
```
Admin selects booking from list
→ Dashboard shows PATCH /api/v1/bookings/:id/status form
→ Admin updates:
  - status (e.g., PENDING → CONFIRMED)
  - Optional: override fare
  - Optional: override cab selection
→ Update triggers:
  1. Validate new status
  2. Update Booking document
  3. Create BookingEvent (STATUS_CHANGED, payload = old+new values)
  4. Create AuditLog ("UPDATE_BOOKING_STATUS", actor = admin user)
  5. Return 200 with updated booking

→ Booking event log grows for traceability
```

**Step 4: Manage Routes & Cabs**
```
Admin can:
- GET /api/v1/admin/routes → List all routes
- POST /api/v1/admin/routes → Create new route (creates AuditLog)
- GET /api/v1/admin/cabs → List all cabs
- POST /api/v1/admin/cabs → Create new cab (creates AuditLog)

Each interaction logged in AuditLog
```

---

### 5. Rate Limiting & Security

**Rate Limiting**:
```
Applied to /api/v1 endpoints:
- Max 20 requests per 15 minutes
- If exceeded: 429 Too Many Requests
- Prevents brute force on login/register
```

**Request Tracing**:
```
Every request gets X-Request-Id header:
- Client generates UUID on each request
- Server logs request ID
- Server stores request ID in BookingEvent, AuditLog
- Useful for debugging/tracing request path across logs
```

**Password Security**:
```
- Minimum 8 characters
- Hashed with bcryptjs (12 rounds)
- Hash stored in User.passwordHash
- Never transmitted or logged
```

**JWT Security**:
```
- Access tokens expire in 15 minutes (short TTL)
- Refresh tokens in database (can be revoked)
- Refresh token hash stored (not plaintext)
- Tokens signed with secret keys (environment variables)
- Client stores in localStorage (browser memory)
```

---

## Security & Reliability

### Authentication & Authorization

| Control | Implementation |
|---------|-----------------|
| User Registration | Email unique, 8+ char password required |
| Password Hashing | bcryptjs with 12 rounds |
| Access Tokens | JWT with 15-minute TTL |
| Refresh Tokens | Database-persisted, hashable, revocable |
| Token Rotation | New refresh token issued on each refresh |
| Role-Based Access | "user" vs "admin" enforced on protected routes |
| Admin-Only Routes | Middleware check: `requireRole('admin')` |
| Protected Routes (React) | `<ProtectedRoute>` redirects to login if not authenticated |

### Input Validation

| Layer | Tool | Coverage |
|-------|------|----------|
| Client-side | React form validation | UX feedback, not security |
| Server-side | Zod schemas | Email format, string lengths, enum values |
| Middleware | `validate()` wrapper | Applies schema to request body |
| Database | Mongoose schema | Field types, required fields |

### Error Handling

- **Centralized**: Single errorHandler middleware catches all errors
- **Standardized Format**: All errors return JSON with { status, title, detail, code, fieldErrors }
- **No Stack Traces**: Production errors don't leak implementation details
- **Logged**: All errors logged with request ID for traceability

### Idempotent Requests

- **Booking Creation**: Idempotency key prevents duplicate bookings from retried requests
- **Storage**: Cached response stored in IdempotencyKey collection (TTL 24h)
- **Behavior**: Same key = same response, even if request retried

### Audit Trail

- **BookingEvent**: Immutable log of all booking state changes (CREATED, STATUS_CHANGED)
- **AuditLog**: Immutable log of all admin actions (actor, action, target, metadata, timestamp)
- **Request Tracing**: X-Request-Id ties together related logs

### Data Persistence

- **MongoDB**: Document persistence with Mongoose ODM
- **Indexes**: Query optimization on frequently-searched fields
- **TTL Indexes**: Automatic cleanup of expired tokens, idempotency keys
- **Relationships**: ObjectId foreign keys link documents (User → Booking → BookingEvent)

---

## Deployment & DevOps

### Docker Compose Setup

```yaml
Services:
  mongo:7       → MongoDB database (port 27017)
  server:5000   → Express API server (port 5000)
  client:3000   → React app + Nginx (port 3000 on 80)
  nginx         → Reverse proxy (entrypoint)

Config:
  MONGO_URI: mongodb://mongo:27017/cab_project
  CLIENT_URLS: http://localhost:3000
  REACT_APP_API_URL: http://localhost:5000
  REACT_APP_API_PREFIX: /api/v1
```

### CI/CD Pipeline (.github/workflows/ci.yml)

```yaml
Triggers: Push to main/master, PRs

Server Job:
  - Install dependencies
  - ESLint (max-warnings=0)
  - npm test (Node.js test runner)

Client Job:
  - Install dependencies
  - ESLint (max-warnings=0)
  - npm test (React Scripts)
  - npm run build (production bundle)
```

### Environment Variables

**Server (.env)**:
```
PORT=5000
MONGO_URI=mongodb://localhost:27017/cab_project
CLIENT_URLS=http://localhost:3000
ALLOWED_ORIGINS=http://localhost:3000
JWT_ACCESS_SECRET=<random-secure-key>
JWT_REFRESH_SECRET=<random-secure-key>
JWT_ACCESS_TTL=15m
JWT_REFRESH_TTL=7d
BCRYPT_ROUNDS=12
ADMIN_EMAIL=admin@rideeasy.local
ADMIN_PASSWORD=Admin123!
ADMIN_NAME=Platform Admin
```

**Client (.env)**:
```
REACT_APP_API_URL=http://localhost:5000
REACT_APP_API_PREFIX=/api/v1
```

### Startup Scripts

**Server Setup**:
```bash
cd server
cp .env.example .env
npm install
npm run migrate:indexes      # Create database indexes
npm run seed-admin           # Create default admin user
npm run dev                  # Start with nodemon
```

**Client Setup**:
```bash
cd client
cp .env.example .env
npm install
npm start                    # React dev server on :3000
```

**All-in-One**:
```powershell
.\run-all.ps1 -NoInstall     # Starts both server & client in parallel
```

### Testing

**Server**:
```bash
npm run lint                 # ESLint
npm test                     # Node.js native test runner
npm run test:coverage        # Coverage report (c8)
```

**Client**:
```bash
npm run lint                 # ESLint
npm test                     # React Scripts test
npm run build                # Production build
```

### Monitoring & Health Checks

**Endpoints**:
- `GET /health/live` - Liveness (always 200)
- `GET /health/ready` - Readiness (200 if DB connected, 503 otherwise)
- `GET /health` - Simple health check

**Metrics** (in-memory):
- Total requests
- Error rate
- Average response time
- By endpoint/status code

**Logging**:
- Morgan: HTTP request details
- Logger lib: Custom info/warn/error logs

---

## Key Data Flows

### Registration → Booking → Admin Update

```
┌─────────────────────────────────────────────────────────────┐
│ 1. USER REGISTRATION                                        │
├─────────────────────────────────────────────────────────────┤
POST /auth/register { email, name, password }
  ↓
  server/src/modules/auth/service.js:
    - Hash password (bcryptjs)
    - Create User document
    - Create initial RefreshToken
    - Generate JWT tokens
  ↓
Response: { accessToken, refreshToken, user }
Client stores in localStorage
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ 2. PUBLIC SEARCH (NO AUTH)                                  │
├─────────────────────────────────────────────────────────────┤
GET /public/search?from=Delhi&to=Airport
  ↓
  server/src/modules/booking/publicRoutes.js:
    - Find RouteOptions matching from/to
    - Find all CabOptions
  ↓
Response: { routes: [...], cabs: [...] }
Display UI with pricing
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ 3. AUTHENTICATED BOOKING CREATION                           │
├─────────────────────────────────────────────────────────────┤
POST /api/v1/bookings {
  tripType, selection, schedule, idempotencyKey
}
(with Authorization header)
  ↓
server/src/middleware/auth.js:
  - Extract userId from JWT
  ↓
server/src/modules/booking/service.js:
  - Check idempotencyKey (prevent duplicates)
  - Look up RouteOption, CabOption
  - Calculate fare = flatRate × multiplier
  - Create Booking with userId
  - Create BookingEvent (CREATED)
  - Create AuditLog (actor = user)
  ↓
Response: { _id, status: "PENDING", fare, ... }
Booking appears in user's list
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ 4. ADMIN STATUS UPDATE                                      │
├─────────────────────────────────────────────────────────────┤
PATCH /api/v1/bookings/:id/status {
  status: "CONFIRMED",
  fare: {...}
}
(admin user with Authorization header)
  ↓
server/src/middleware/auth.js:
  - Extract userId from JWT
  - Verify role === "admin"
  ↓
server/src/modules/booking/service.js:
  - Validate new status
  - Update Booking
  - Create BookingEvent (STATUS_CHANGED, oldStatus, newStatus)
  - Create AuditLog (actor = admin, action = "UPDATE_BOOKING_STATUS")
  ↓
Response: { _id, status: "CONFIRMED", ... }
Audit log entry created for compliance
└─────────────────────────────────────────────────────────────┘
```

---

## File Organization Summary

```
cab-project/
├── .github/workflows/ci.yml           # GitHub Actions CI/CD
├── docker-compose.yml                 # Multi-service Docker setup
├── README.md                          # Quick start guide
├── run-all.ps1                        # Startup script
│
├── server/                            # Node.js/Express backend
│   ├── src/
│   │   ├── app.js                     # Express app setup
│   │   ├── server.js                  # Entry point
│   │   ├── lib/
│   │   │   ├── config.js              # Environment loading
│   │   │   ├── db.js                  # MongoDB connection
│   │   │   ├── errors.js              # Error classes
│   │   │   ├── logger.js              # Logging
│   │   │   ├── metrics.js             # Metrics collection
│   │   │   └── response.js            # Response formatters
│   │   ├── middleware/
│   │   │   ├── auth.js                # JWT + RBAC
│   │   │   ├── errorHandler.js        # Error handling
│   │   │   ├── notFound.js            # 404
│   │   │   ├── rateLimit.js           # Rate limiting
│   │   │   ├── requestId.js           # Request tracing
│   │   │   └── validate.js            # Zod validation
│   │   ├── modules/
│   │   │   ├── auth/                  # Authentication
│   │   │   ├── booking/               # Booking management
│   │   │   ├── admin/                 # Admin operations
│   │   │   └── health/                # Health checks
│   │   └── routes/
│   │       ├── v1.js                  # Main router
│   │       └── legacy.js              # Backward compatibility
│   │
│   ├── models/                        # Mongoose schemas
│   │   ├── User.js
│   │   ├── Booking.js
│   │   ├── Passenger.js
│   │   ├── RouteOption.js
│   │   ├── CabOption.js
│   │   ├── BookingEvent.js
│   │   ├── AuditLog.js
│   │   ├── IdempotencyKey.js
│   │   └── RefreshToken.js
│   │
│   ├── scripts/                       # Setup/migration scripts
│   │   ├── seed-admin.js
│   │   ├── promote-admin.js
│   │   └── migrate-indexes.js
│   │
│   ├── test/                          # Unit & integration tests
│   ├── openapi/                       # API specification
│   ├── package.json
│   └── Dockerfile
│
├── client/                            # React frontend
│   ├── public/
│   │   └── index.html                 # HTML template
│   │
│   ├── src/
│   │   ├── App.js                     # Main component
│   │   ├── index.js                   # React root
│   │   ├── config.js                  # API config
│   │   │
│   │   ├── app/
│   │   │   ├── routes.jsx             # Route definitions
│   │   │   └── providers.jsx          # Context setup
│   │   │
│   │   ├── components/                # Reusable components
│   │   │   ├── CabBookingForm.jsx
│   │   │   └── ...
│   │   │
│   │   ├── features/                  # Feature pages
│   │   │   ├── auth/
│   │   │   ├── booking/
│   │   │   └── admin/
│   │   │
│   │   ├── shared/
│   │   │   ├── api/                   # API layer
│   │   │   │   ├── http.js
│   │   │   │   └── endpoints.js
│   │   │   │
│   │   │   ├── contexts/              # Global state
│   │   │   │   └── AuthContext.jsx
│   │   │   │
│   │   │   └── ui/                    # Shared UI
│   │   │       ├── ProtectedRoute.jsx
│   │   │       └── ...
│   │   │
│   │   └── index.css
│   │
│   ├── package.json
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   └── Dockerfile
│
└── docs/                              # Documentation
    ├── adr/                           # Architecture Decision Records
    ├── runbooks/                      # Operational guides
    ├── monitoring-alerting.md
    └── slo-sli.md
```

---

## Quick Reference: Key Technologies

| Tool | Purpose | Config |
|------|---------|--------|
| **Mongoose** | MongoDB ODM | `server/models/*.js` |
| **Zod** | Input validation | `server/src/modules/*/schemas.js` |
| **JWT** | Stateless auth tokens | `server/src/modules/auth/tokens.js` |
| **bcryptjs** | Password hashing | 12 rounds in auth service |
| **axios** | HTTP client (React) | `client/src/shared/api/http.js` |
| **React Router** | Client navigation | `client/src/app/routes.jsx` |
| **Tailwind CSS** | Styling | `client/tailwind.config.js` |
| **Express** | Backend framework | `server/src/app.js` |
| **Helmet** | Security headers | Middleware in app.js |
| **morgan** | HTTP logging | Middleware in app.js |
| **Docker** | Containerization | `docker-compose.yml` |

---

## Conclusion

**Cab Platform Pro** is a production-grade, full-stack booking application with:

✅ **Robust Authentication**: JWT + refresh rotation + revocation  
✅ **Role-Based Access Control**: User vs Admin separation  
✅ **Data Integrity**: Idempotent requests, immutable audit trails  
✅ **Security**: Password hashing, rate limiting, helmet, CORS  
✅ **Reliability**: Error handling, input validation, health checks  
✅ **Maintainability**: Modular structure, comprehensive docs, CI/CD  
✅ **Scalability**: MongoDB, indexed queries, containerized deployment  

The system supports both authenticated users and guest bookings, with a flexible admin dashboard for operational management and compliance tracking.

---

**Next Steps to Extend**:
- Payment integration (Stripe/Razorpay)
- Email notifications (booking confirmation, status updates)
- SMS notifications (OTP for login, booking details)
- Real-time notifications (WebSocket for live updates)
- Driver assignment & tracking (GPS integration)
- Rating & reviews (user feedback)
- Analytics dashboard (business metrics)
