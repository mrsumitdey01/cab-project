import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  createAdminCab,
  createAdminRoute,
  getAdminCabs,
  getAdminRoutes,
  getAuditLogs,
  getBookingAlerts,
  getHealthSummary,
  listBookings,
  updateBookingStatus,
} from '../../shared/api/endpoints';
import { Alert } from '../../shared/ui/Alert';

const tabs = ['present', 'planned', 'past'];

function parsePickupDateTime(booking) {
  const dateValue = booking?.schedule?.pickupDate;
  if (!dateValue) return null;
  const timeValue = booking?.schedule?.pickupTime || '00:00';
  const combined = new Date(`${dateValue}T${timeValue}`);
  if (Number.isNaN(combined.getTime())) {
    const fallback = new Date(dateValue);
    return Number.isNaN(fallback.getTime()) ? null : fallback;
  }
  return combined;
}

function classifyBooking(booking) {
  if (booking?.status === 'COMPLETED' || booking?.status === 'CANCELLED') return 'past';
  const pickupDateTime = parsePickupDateTime(booking);
  if (!pickupDateTime || Number.isNaN(pickupDateTime.getTime())) return 'planned';

  const now = new Date();
  const sameDay = pickupDateTime.toDateString() === now.toDateString();
  if (sameDay) return 'present';
  if (pickupDateTime > now) return 'planned';
  return 'past';
}

function statusBadge(status) {
  const base = 'px-2 py-1 rounded-full text-xs font-semibold';
  if (status === 'CONFIRMED') return `${base} bg-emerald-100 text-emerald-700`;
  if (status === 'COMPLETED') return `${base} bg-indigo-100 text-indigo-700`;
  if (status === 'CANCELLED') return `${base} bg-rose-100 text-rose-700`;
  return `${base} bg-amber-100 text-amber-700`;
}

export function AdminPage() {
  const [health, setHealth] = useState(null);
  const [logs, setLogs] = useState([]);
  const [error, setError] = useState('');
  const [bookingId, setBookingId] = useState('');
  const [status, setStatus] = useState('CONFIRMED');
  const [success, setSuccess] = useState('');
  const [alertCount, setAlertCount] = useState(0);
  const [activeTab, setActiveTab] = useState('present');
  const [since] = useState(new Date(Date.now() - 15 * 60 * 1000).toISOString());
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const [routes, setRoutes] = useState([]);
  const [cabs, setCabs] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [routeForm, setRouteForm] = useState({ label: '', etaMinutes: '', distanceKm: '', baseFare: '' });
  const [cabForm, setCabForm] = useState({ cabType: '', carModel: '', multiplier: '', availableFrom: '', availableTo: '' });
  const [routeModalOpen, setRouteModalOpen] = useState(false);
  const [cabModalOpen, setCabModalOpen] = useState(false);
  const [editingBooking, setEditingBooking] = useState(null);
  const [passengerModalOpen, setPassengerModalOpen] = useState(false);
  const [selectedPassenger, setSelectedPassenger] = useState(null);

  const load = useCallback(async () => {
    try {
      const [healthData, auditData, alerts, routesData, cabsData, bookingsData] = await Promise.all([
        getHealthSummary(),
        getAuditLogs(1, 50),
        getBookingAlerts(since),
        getAdminRoutes(),
        getAdminCabs(),
        listBookings(),
      ]);
      setHealth(healthData);
      setLogs(auditData.logs);
      setAlertCount(alerts.count || 0);
      setRoutes(routesData);
      setCabs(cabsData);
      setBookings(bookingsData);
    } catch (err) {
      setError(err?.response?.data?.error?.detail || 'Failed to load admin data.');
    }
  }, [since]);

  useEffect(() => {
    load();
    const interval = setInterval(load, 15000);
    return () => clearInterval(interval);
  }, [load]);

  async function handleStatusUpdate(e) {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!bookingId) {
      setError('Select a booking to update.');
      return;
    }
    try {
      const booking = await updateBookingStatus(bookingId, status);
      setSuccess(`Updated booking ${booking._id} to ${booking.status}`);
      setEditingBooking(null);
      await load();
    } catch (err) {
      setError(err?.response?.data?.error?.detail || 'Status update failed.');
    }
  }

  function handleEditBooking(booking) {
    setBookingId(booking._id);
    setStatus(booking.status || 'CONFIRMED');
    setEditingBooking(booking);
    document.getElementById('admin-status-section')?.scrollIntoView({ behavior: 'smooth' });
  }

  async function handleCreateRoute(e) {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      await createAdminRoute({
        label: routeForm.label,
        etaMinutes: Number(routeForm.etaMinutes),
        distanceKm: Number(routeForm.distanceKm),
        baseFare: Number(routeForm.baseFare),
      });
      setRouteForm({ label: '', etaMinutes: '', distanceKm: '', baseFare: '' });
      await load();
      setSuccess('Route created.');
    } catch (err) {
      setError(err?.response?.data?.error?.detail || 'Failed to create route.');
    }
  }

  async function handleCreateCab(e) {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      await createAdminCab({
        cabType: cabForm.cabType,
        carModel: cabForm.carModel,
        multiplier: Number(cabForm.multiplier),
        availableFrom: cabForm.availableFrom || null,
        availableTo: cabForm.availableTo || null,
      });
      setCabForm({ cabType: '', carModel: '', multiplier: '', availableFrom: '', availableTo: '' });
      await load();
      setSuccess('Cab created.');
    } catch (err) {
      setError(err?.response?.data?.error?.detail || 'Failed to create cab.');
    }
  }

  const groupedLogs = useMemo(() => {
    const map = { present: [], planned: [], past: [] };
    logs.forEach((log) => {
      const pickupDate = log?.metadata?.pickupDate ? new Date(log.metadata.pickupDate) : null;
      if (!pickupDate || Number.isNaN(pickupDate.getTime())) {
        map.planned.push(log);
        return;
      }
      const now = new Date();
      const sameDay = pickupDate.toDateString() === now.toDateString();
      if (sameDay) map.present.push(log);
      else if (pickupDate > now) map.planned.push(log);
      else map.past.push(log);
    });
    return map;
  }, [logs]);

  const groupedBookings = useMemo(() => {
    const map = { present: [], planned: [], past: [] };
    bookings.forEach((booking) => {
      map[classifyBooking(booking)].push(booking);
    });
    return map;
  }, [bookings]);

  const filteredBookings = useMemo(() => {
    const list = groupedBookings[activeTab] || [];
    return list.filter((booking) => {
      const haystack = [
        booking.pickup?.address,
        booking.dropoff?.address,
        booking.selection?.route,
        booking.selection?.cabType,
        booking.selection?.carModel,
        booking._id,
      ].filter(Boolean).join(' ').toLowerCase();
      const matchesQuery = !query || haystack.includes(query.toLowerCase());
      const matchesStatus = statusFilter === 'ALL' || booking.status === statusFilter;
      return matchesQuery && matchesStatus;
    });
  }, [groupedBookings, activeTab, query, statusFilter]);

  const revenue = useMemo(() => bookings.reduce((sum, b) => sum + (b.fare?.totalAmount || 0), 0), [bookings]);
  const revenueByDay = useMemo(() => {
    const map = new Map();
    bookings.forEach((booking) => {
      const date = booking?.schedule?.pickupDate ? new Date(booking.schedule.pickupDate) : new Date(booking.createdAt);
      const key = Number.isNaN(date.getTime()) ? 'Unknown' : date.toISOString().slice(0, 10);
      map.set(key, (map.get(key) || 0) + (booking.fare?.totalAmount || 0));
    });
    return Array.from(map.entries())
      .map(([date, total]) => ({ date, total }))
      .sort((a, b) => (a.date > b.date ? 1 : -1));
  }, [bookings]);

  const revenueByCab = useMemo(() => {
    const map = new Map();
    bookings.forEach((booking) => {
      const cabType = booking.selection?.cabType || 'Unknown';
      map.set(cabType, (map.get(cabType) || 0) + (booking.fare?.totalAmount || 0));
    });
    return Array.from(map.entries()).map(([cabType, total]) => ({ cabType, total }));
  }, [bookings]);

  const revenueByRoute = useMemo(() => {
    const map = new Map();
    bookings.forEach((booking) => {
      const route = booking.selection?.route || 'Unknown';
      map.set(route, (map.get(route) || 0) + (booking.fare?.totalAmount || 0));
    });
    return Array.from(map.entries())
      .map(([route, total]) => ({ route, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
  }, [bookings]);

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <p className="text-sm uppercase tracking-widest text-slate-400 font-semibold">Operations Center</p>
          <h1 className="text-3xl font-bold text-slate-900">Admin Console</h1>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={load} className="px-4 py-2 rounded-xl bg-white/70 border border-white/60 shadow-sm hover:shadow-indigo-500/20 transition-shadow">Refresh</button>
          <span className="text-sm font-semibold bg-amber-100 text-amber-800 px-3 py-1 rounded-full">{alertCount} new bookings</span>
          <span className="text-sm font-semibold bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full">{bookings.length} total bookings</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white/80 p-4 rounded-2xl shadow">
          <p className="text-xs uppercase text-slate-400 font-semibold">Routes</p>
          <p className="text-2xl font-bold mt-2">{routes.length}</p>
        </div>
        <div className="bg-white/80 p-4 rounded-2xl shadow">
          <p className="text-xs uppercase text-slate-400 font-semibold">Cabs</p>
          <p className="text-2xl font-bold mt-2">{cabs.length}</p>
        </div>
        <div className="bg-white/80 p-4 rounded-2xl shadow">
          <p className="text-xs uppercase text-slate-400 font-semibold">Bookings</p>
          <p className="text-2xl font-bold mt-2">{bookings.length}</p>
        </div>
        <div className="bg-white/80 p-4 rounded-2xl shadow">
          <p className="text-xs uppercase text-slate-400 font-semibold">Revenue</p>
          <p className="text-2xl font-bold mt-2">₹{revenue}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white/80 p-6 rounded-2xl shadow">
          <h2 className="text-xl font-semibold mb-4">Health Summary</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-white/70 border border-white/60 shadow-sm">
              <p className="text-xs uppercase tracking-widest text-slate-400">Avg Latency (ms)</p>
              <p className="text-2xl font-bold mt-2">{health?.metrics?.avgLatencyMs ?? 'N/A'}</p>
              <div className="h-2 bg-slate-100 rounded-full mt-3 overflow-hidden">
                <div
                  className={`h-full ${health?.metrics?.avgLatencyMs <= 300 ? 'bg-emerald-500' : health?.metrics?.avgLatencyMs <= 800 ? 'bg-amber-500' : 'bg-rose-500'}`}
                  style={{ width: `${Math.min(100, (health?.metrics?.avgLatencyMs || 0) / 10)}%` }}
                />
              </div>
            </div>
            <div className="p-4 rounded-2xl bg-white/70 border border-white/60 shadow-sm">
              <p className="text-xs uppercase tracking-widest text-slate-400">Error Rate</p>
              <p className="text-2xl font-bold mt-2">{health?.metrics?.errorRate ?? 'N/A'}</p>
              <div className="h-2 bg-slate-100 rounded-full mt-3 overflow-hidden">
                <div
                  className={`h-full ${health?.metrics?.errorRate <= 0.01 ? 'bg-emerald-500' : health?.metrics?.errorRate <= 0.05 ? 'bg-amber-500' : 'bg-rose-500'}`}
                  style={{ width: `${Math.min(100, (health?.metrics?.errorRate || 0) * 100)}%` }}
                />
              </div>
            </div>
          </div>
        </div>
        <div className="bg-white/80 p-6 rounded-2xl shadow">
          <h2 className="text-xl font-semibold mb-4">System Status</h2>
          <div className="space-y-3 text-sm text-slate-500">
            <p>Database: <span className={health?.dbReady ? 'text-emerald-600 font-semibold' : 'text-rose-600 font-semibold'}>{health?.dbReady ? 'Ready' : 'Degraded'}</span></p>
            <p>Audit Logs: <span className="font-semibold text-slate-700">{health?.auditCount ?? 0}</span></p>
            <p>Metrics Sampled: <span className="font-semibold text-slate-700">{health?.metrics ? 'Active' : 'N/A'}</span></p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="bg-white/80 p-6 rounded-2xl shadow lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Revenue Trend</h2>
            <span className="text-xs text-slate-500">Daily</span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={revenueByDay}>
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip formatter={(value) => [`₹${value}`, 'Revenue']} />
                <Line type="monotone" dataKey="total" stroke="#4f46e5" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="bg-white/80 p-6 rounded-2xl shadow">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Revenue by Cab</h2>
            <span className="text-xs text-slate-500">Top Types</span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueByCab}>
                <XAxis dataKey="cabType" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip formatter={(value) => [`₹${value}`, 'Revenue']} />
                <Bar dataKey="total" fill="#6366f1" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="bg-white/80 p-6 rounded-2xl shadow mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Most Profitable Routes</h2>
          <span className="text-xs text-slate-500">Top 5</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {revenueByRoute.map((route) => (
            <div key={route.route} className="p-4 rounded-xl border border-white/60 bg-white/70 flex items-center justify-between">
              <div>
                <p className="font-semibold text-slate-800">{route.route}</p>
                <p className="text-xs text-slate-500">Revenue</p>
              </div>
              <p className="font-bold text-indigo-600">₹{route.total}</p>
            </div>
          ))}
          {revenueByRoute.length === 0 && <p className="text-sm text-slate-500">No revenue data yet.</p>}
        </div>
      </div>

      <div className="flex flex-wrap gap-3 mb-6">
        <button onClick={() => setRouteModalOpen(true)} className="px-4 py-2 rounded-xl bg-white/70 border border-white/60 shadow-sm hover:shadow-indigo-500/20 transition-shadow">Manage Routes</button>
        <button onClick={() => setCabModalOpen(true)} className="px-4 py-2 rounded-xl bg-white/70 border border-white/60 shadow-sm hover:shadow-indigo-500/20 transition-shadow">Manage Cabs</button>
      </div>

      <div className="bg-white/80 p-6 rounded-2xl shadow mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
          <h2 className="text-xl font-semibold">Bookings Overview</h2>
          <div className="flex flex-wrap gap-2">
            {tabs.map((tab) => (
              <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-2 rounded-xl font-semibold ${activeTab === tab ? 'bg-indigo-600 text-white' : 'bg-white/70 text-slate-700 border border-white/70 shadow-sm'}`}>
                {tab.toUpperCase()} ({groupedBookings[tab].length})
              </button>
            ))}
          </div>
        </div>
        <div className="flex flex-col md:flex-row gap-3 mb-4">
          <input
            className="w-full md:flex-1 p-3 rounded-xl bg-white/80 border border-white/60 shadow-sm focus:outline-none focus:ring-4 focus:ring-blue-500/10"
            placeholder="Search bookings by ID, route, cab, or location"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <select
            className="p-3 rounded-xl bg-white/80 border border-white/60 shadow-sm focus:outline-none focus:ring-4 focus:ring-blue-500/10"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="ALL">All Status</option>
            <option value="PENDING">Pending</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
        <div className="overflow-auto rounded-xl border border-white/60">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-slate-500 uppercase text-xs">
              <tr>
                <th className="text-left p-3">Customer</th>
                <th className="text-left p-3">Pickup → Drop</th>
                <th className="text-left p-3">Fare</th>
                <th className="text-left p-3">Status</th>
                <th className="text-left p-3">Action</th>
              </tr>
            </thead>
            <tbody className="bg-white/70">
              {filteredBookings.map((booking) => (
                <tr key={booking._id} className="border-t">
                  <td className="p-3">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedPassenger(booking);
                        setPassengerModalOpen(true);
                      }}
                      className="font-semibold text-slate-800 hover:text-indigo-600 transition-colors"
                    >
                      {booking.contact?.name || booking.user?.name || booking.contact?.email || booking.user?.email || 'Guest'}
                    </button>
                    <p className="text-xs text-slate-500">ID #{booking._id}</p>
                  </td>
                  <td className="p-3">
                    <p className="font-semibold text-slate-800">{booking.pickup?.address} → {booking.dropoff?.address}</p>
                    <p className="text-xs text-slate-500">{booking.schedule?.pickupDate} {booking.schedule?.pickupTime || ''}</p>
                  </td>
                  <td className="p-3 font-bold">₹{booking.fare?.totalAmount}</td>
                  <td className="p-3"><span className={statusBadge(booking.status)}>{booking.status}</span></td>
                  <td className="p-3">
                    <button onClick={() => handleEditBooking(booking)} className="px-3 py-1 rounded-lg bg-indigo-600 text-white">Edit</button>
                  </td>
                </tr>
              ))}
              {filteredBookings.length === 0 && (
                <tr>
                  <td colSpan="5" className="p-6 text-center text-slate-500">
                    No bookings yet. Start by creating a route and cab, then take a test booking.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {routeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4 modal-backdrop">
          <div className="glass-card w-full max-w-3xl rounded-2xl shadow-2xl p-6 relative modal-panel">
            <button className="absolute top-4 right-4 text-slate-400 hover:text-slate-600" onClick={() => setRouteModalOpen(false)} aria-label="Close">X</button>
            <h2 className="text-xl font-semibold mb-3">Route Setup</h2>
            <form onSubmit={handleCreateRoute} className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input className="p-3 rounded-xl border" placeholder="Route Name" value={routeForm.label} onChange={(e) => setRouteForm((prev) => ({ ...prev, label: e.target.value }))} required />
              <input className="p-3 rounded-xl border" placeholder="ETA (min)" type="number" value={routeForm.etaMinutes} onChange={(e) => setRouteForm((prev) => ({ ...prev, etaMinutes: e.target.value }))} required />
              <input className="p-3 rounded-xl border" placeholder="Distance (km)" type="number" value={routeForm.distanceKm} onChange={(e) => setRouteForm((prev) => ({ ...prev, distanceKm: e.target.value }))} required />
              <input className="p-3 rounded-xl border" placeholder="Base Fare" type="number" value={routeForm.baseFare} onChange={(e) => setRouteForm((prev) => ({ ...prev, baseFare: e.target.value }))} required />
              <button className="md:col-span-2 p-3 rounded-xl bg-indigo-600 text-white">Add Route</button>
            </form>
            <div className="mt-4 space-y-2">
              {routes.map((route) => (
                <div key={route._id} className="border rounded-xl p-3 bg-white/70">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold">{route.label}</p>
                    <span className="text-xs font-semibold bg-slate-100 text-slate-600 px-2 py-1 rounded-full">Base ₹{route.baseFare}</span>
                  </div>
                  <p className="text-sm text-slate-500">ETA {route.etaMinutes} min | {route.distanceKm} km</p>
                </div>
              ))}
              {routes.length === 0 && <p className="text-sm text-slate-500">No routes configured yet.</p>}
            </div>
          </div>
        </div>
      )}

      {cabModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4 modal-backdrop">
          <div className="glass-card w-full max-w-3xl rounded-2xl shadow-2xl p-6 relative modal-panel">
            <button className="absolute top-4 right-4 text-slate-400 hover:text-slate-600" onClick={() => setCabModalOpen(false)} aria-label="Close">X</button>
            <h2 className="text-xl font-semibold mb-3">Cab Setup</h2>
            <form onSubmit={handleCreateCab} className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input className="p-3 rounded-xl border" placeholder="Cab Type" value={cabForm.cabType} onChange={(e) => setCabForm((prev) => ({ ...prev, cabType: e.target.value }))} required />
              <input className="p-3 rounded-xl border" placeholder="Car Model" value={cabForm.carModel} onChange={(e) => setCabForm((prev) => ({ ...prev, carModel: e.target.value }))} required />
              <input className="p-3 rounded-xl border" placeholder="Multiplier" type="number" step="0.1" value={cabForm.multiplier} onChange={(e) => setCabForm((prev) => ({ ...prev, multiplier: e.target.value }))} required />
              <input className="p-3 rounded-xl border" type="date" value={cabForm.availableFrom} onChange={(e) => setCabForm((prev) => ({ ...prev, availableFrom: e.target.value }))} />
              <input className="p-3 rounded-xl border md:col-span-2" type="date" value={cabForm.availableTo} onChange={(e) => setCabForm((prev) => ({ ...prev, availableTo: e.target.value }))} />
              <button className="md:col-span-2 p-3 rounded-xl bg-indigo-600 text-white">Add Cab</button>
            </form>
            <div className="mt-4 space-y-2">
              {cabs.map((cab) => (
                <div key={cab._id} className="border rounded-xl p-3 bg-white/70">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold">{cab.cabType} - {cab.carModel}</p>
                    <span className="text-xs font-semibold bg-blue-100 text-blue-700 px-2 py-1 rounded-full">x{cab.multiplier}</span>
                  </div>
                  <p className="text-sm text-slate-500">Availability {cab.availableFrom ? new Date(cab.availableFrom).toLocaleDateString() : 'Always'} - {cab.availableTo ? new Date(cab.availableTo).toLocaleDateString() : 'Always'}</p>
                </div>
              ))}
              {cabs.length === 0 && <p className="text-sm text-slate-500">No cabs configured yet.</p>}
            </div>
          </div>
        </div>
      )}

      {passengerModalOpen && selectedPassenger && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4 modal-backdrop">
          <div className="glass-card w-full max-w-xl rounded-2xl shadow-2xl p-6 relative modal-panel">
            <button
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
              onClick={() => setPassengerModalOpen(false)}
              aria-label="Close"
            >
              X
            </button>
            <h2 className="text-xl font-semibold mb-4">Passenger Details</h2>
            <div className="space-y-3 text-sm text-slate-600">
              <div className="p-4 rounded-xl bg-white/70 border border-white/60">
                <p className="text-xs uppercase tracking-widest text-slate-400 font-semibold">Passenger</p>
                <p className="mt-2 text-base font-semibold text-slate-900">{selectedPassenger.contact?.name || selectedPassenger.user?.name || 'Guest'}</p>
                <p className="text-slate-500">{selectedPassenger.contact?.email || selectedPassenger.user?.email || 'No email provided'}</p>
                <p className="text-slate-500">{selectedPassenger.contact?.phone || 'No phone provided'}</p>
              </div>
              <div className="p-4 rounded-xl bg-white/70 border border-white/60">
                <p className="text-xs uppercase tracking-widest text-slate-400 font-semibold">Trip</p>
                <p className="mt-2 text-slate-700"><span className="font-semibold">Route:</span> {selectedPassenger.pickup?.address} → {selectedPassenger.dropoff?.address}</p>
                <p className="text-slate-500"><span className="font-semibold">Schedule:</span> {selectedPassenger.schedule?.pickupDate} {selectedPassenger.schedule?.pickupTime || ''}</p>
                <p className="text-slate-500"><span className="font-semibold">Status:</span> {selectedPassenger.status}</p>
                <p className="text-slate-500"><span className="font-semibold">Booking ID:</span> {selectedPassenger._id}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div id="admin-status-section" className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white/80 p-6 rounded-2xl shadow">
          <h2 className="text-xl font-semibold mb-3">Update Booking Status</h2>
          <form onSubmit={handleStatusUpdate} className="flex flex-col md:flex-row gap-3">
            <input className="flex-1 p-3 rounded-xl border" placeholder="Booking ID" value={bookingId} onChange={(e) => setBookingId(e.target.value)} required />
            <select className="p-3 rounded-xl border" value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="CONFIRMED">CONFIRMED</option>
              <option value="CANCELLED">CANCELLED</option>
              <option value="COMPLETED">COMPLETED</option>
            </select>
            <button className="p-3 rounded-xl bg-indigo-600 text-white">Update</button>
          </form>
          {editingBooking && (
            <p className="mt-2 text-xs text-slate-500">Editing booking #{editingBooking._id}</p>
          )}
          <div className="mt-3 space-y-2">
            <Alert type="error" message={error} />
            <Alert type="success" message={success} />
          </div>
        </div>
      </div>

      <div className="bg-white/80 p-6 rounded-2xl shadow">
        <h2 className="text-xl font-semibold mb-3">Audit Logs</h2>
        <div className="space-y-2">
          {groupedLogs[activeTab].map((log) => (
            <div key={log._id} className="border rounded-xl p-3 bg-white/70">
              <p className="font-semibold">{log.action}</p>
              <p className="text-sm text-slate-500">{log.actor?.email} | {new Date(log.createdAt).toLocaleString()}</p>
            </div>
          ))}
          {groupedLogs[activeTab].length === 0 && <p className="text-sm text-slate-500">No audit entries.</p>}
        </div>
      </div>
    </div>
  );
}


