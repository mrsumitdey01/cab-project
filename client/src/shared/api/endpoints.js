import { http, clearSessionTokens } from './http';

export async function register(payload) {
  console.log(`Registering user at ${import.meta.env.VITE_API_URL}/auth/register`);
  const res = await http.post('/auth/register', payload);
  console.log(`Register response status: ${res.status}`);
  return res.data.data;
}

export async function login(payload) {
  const res = await http.post('/auth/login', payload);
  return res.data.data;
}

export async function logout(refreshToken) {
  try {
    if (refreshToken) {
      await http.post('/auth/logout', { refreshToken });
    }
  } finally {
    clearSessionTokens();
  }
}

export async function searchTrips(payload) {
  const res = await http.post('/public/search', payload);
  return res.data.data;
}

export async function createPublicBooking(payload, idempotencyKey) {
  const res = await http.post('/public/bookings', payload, {
    headers: idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : {},
  });
  return res.data.data;
}

export async function createBooking(payload, idempotencyKey) {
  const res = await http.post('/bookings', payload, {
    headers: idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : {},
  });
  return res.data.data;
}

export async function listBookings() {
  const res = await http.get('/bookings');
  return res.data.data.bookings;
}

export async function updateBookingStatus(id, status) {
  const res = await http.patch(`/bookings/${id}/status`, { status });
  return res.data.data.booking;
}

export async function getHealthSummary() {
  const res = await http.get('/admin/health-summary');
  return res.data.data;
}

export async function getAuditLogs(page = 1, pageSize = 20) {
  const res = await http.get(`/admin/audit-logs?page=${page}&pageSize=${pageSize}`);
  return { logs: res.data.data.logs, meta: res.data.meta };
}

export async function getBookingAlerts(since) {
  const query = since ? `?since=${encodeURIComponent(since)}` : '';
  const res = await http.get(`/admin/booking-alerts${query}`);
  return res.data.data;
}

export async function getAdminRoutes() {
  const res = await http.get('/admin/routes');
  return res.data.data.routes;
}

export async function createAdminRoute(payload) {
  const res = await http.post('/admin/routes', payload);
  return res.data.data.route;
}

export async function getAdminCabs() {
  const res = await http.get('/admin/cabs');
  return res.data.data.cabs;
}

export async function createAdminCab(payload) {
  const res = await http.post('/admin/cabs', payload);
  return res.data.data.cab;
}
