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
  const [routeForm, setRouteForm] = useState({ fromHub: '', toHub: '', flatRate: '' });
  const [cabForm, setCabForm] = useState({ cabType: '', carModel: '', multiplier: '', availableFrom: '', availableTo: '' });
  const [routeModalOpen, setRouteModalOpen] = useState(false);
  const [cabModalOpen, setCabModalOpen] = useState(false);
  const [editingBooking, setEditingBooking] = useState(null);
  const [passengerModalOpen, setPassengerModalOpen] = useState(false);
  const [selectedPassenger, setSelectedPassenger] = useState(null);
  const [exportingBookings, setExportingBookings] = useState(false);

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

  async function exportBookingsCsv() {
    setExportingBookings(true);
    try {
      const header = [
        'Booking ID',
        'Status',
        'Customer',
        'Pickup',
        'Dropoff',
        'Pickup Date',
        'Pickup Time',
        'Cab Type',
        'Car Model',
        'Fare',
      ];
      const rows = bookings.map((b) => ([
        b._id,
        b.status,
        b.passengerId?.name || b.contact?.name || b.user?.name || b.contact?.email || b.user?.email || 'Guest',
        b.pickup?.address || '',
        b.dropoff?.address || '',
        b.schedule?.pickupDate || '',
        b.schedule?.pickupTime || '',
        b.selection?.cabType || '',
        b.selection?.carModel || '',
        b.fare?.totalAmount ?? '',
      ]));
      const csv = [header, ...rows]
        .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
        .join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `safar-express-admin-bookings-${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } finally {
      setExportingBookings(false);
    }
  }

  async function handleStatusUpdate(e) {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!bookingId) {
      setError('Select a booking to update.');
      return;
    }
    if (editingBooking?.status && editingBooking.status === status) {
      setError(`Select a different status than ${editingBooking.status}.`);
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
    const nextStatus = booking.status === 'PENDING' ? 'CONFIRMED' : (booking.status || 'CONFIRMED');
    setStatus(nextStatus);
    setEditingBooking(booking);
    document.getElementById('admin-status-section')?.scrollIntoView({ behavior: 'smooth' });
  }

  async function handleCreateRoute(e) {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      await createAdminRoute({
        fromHub: routeForm.fromHub,
        toHub: routeForm.toHub,
        flatRate: Number(routeForm.flatRate),
      });
      setRouteForm({ fromHub: '', toHub: '', flatRate: '' });
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
    <div className="bg-slate-50 min-h-screen pb-20">
      {/* ── Premium Hero ── */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white pb-12 pt-10 px-6 shadow-2xl">
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.15),_transparent_60%)] pointer-events-none" />
        <div className="max-w-7xl mx-auto relative z-10 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold tracking-widest uppercase border border-indigo-500/30">Operations Center</span>
              <span className="text-sm font-medium text-slate-400 flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Live</span>
            </div>
            <h1 className="text-4xl font-black tracking-tight text-white mb-1">Command Center</h1>
            <p className="text-slate-400 font-medium">Last synced: {new Date().toLocaleTimeString()}</p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <button onClick={load} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold transition-all">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
              Refresh
            </button>
            <button onClick={exportBookingsCsv} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 border border-indigo-500 text-white font-semibold shadow-lg shadow-indigo-500/20 transition-all">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
              {exportingBookings ? 'Exporting...' : 'Export CSV'}
            </button>
          </div>
        </div>
      </div>

      {/* ── Sticky Nav ── */}
      <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200 shadow-sm px-6">
        <div className="max-w-7xl mx-auto flex gap-6 overflow-x-auto hide-scrollbar">
          {['Overview', 'Bookings', 'Routes & Cabs', 'System Health', 'Audit Logs'].map((tab) => (
            <a key={tab} href={`#section-${tab.toLowerCase().replace(/ /g, '-')}`} className="py-4 text-sm font-bold text-slate-500 hover:text-indigo-600 whitespace-nowrap transition-colors border-b-2 border-transparent hover:border-indigo-600">
              {tab}
            </a>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6 space-y-8" id="section-overview">
        {/* ── Premium Stat Cards ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-start gap-4 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0 border border-emerald-100">
              <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <div>
              <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-1">Total Bookings</p>
              <h3 className="text-2xl font-black text-slate-800">{bookings.length}</h3>
              <p className="text-xs text-slate-500 font-medium mt-1"><span className="text-emerald-500 bg-emerald-50 px-1.5 py-0.5 rounded mr-1">+{groupedBookings.present.length}</span> today</p>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-start gap-4 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0 border border-indigo-100">
              <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <div>
              <p className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-1">Revenue</p>
              <h3 className="text-2xl font-black text-slate-800">₹{revenue.toLocaleString('en-IN')}</h3>
              <p className="text-xs text-slate-500 font-medium mt-1">Total collected</p>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-start gap-4 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center shrink-0 border border-blue-100">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" /></svg>
            </div>
            <div>
              <p className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">Active Routes</p>
              <h3 className="text-2xl font-black text-slate-800">{routes.length}</h3>
              <p className="text-xs text-slate-500 font-medium mt-1">Operating regions</p>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-start gap-4 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center shrink-0 border border-orange-100">
              <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
            </div>
            <div>
              <p className="text-xs font-bold text-orange-600 uppercase tracking-wider mb-1">Pending Alerts</p>
              <h3 className="text-2xl font-black text-slate-800">{alertCount}</h3>
              <p className="text-xs text-slate-500 font-medium mt-1">Requires action</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm lg:col-span-2">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                Operations Check
              </h2>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Realtime</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 hover:border-indigo-200 transition-colors">
                <p className="text-xs uppercase tracking-widest text-slate-500 font-bold">Route Health</p>
                <div className="mt-2 flex items-baseline gap-2">
                  <p className="text-2xl font-black text-slate-800">{routes.length}</p>
                  <p className="text-sm font-semibold text-emerald-600">active</p>
                </div>
                <p className="text-xs text-slate-400 mt-1">Review pricing & availability</p>
              </div>
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 hover:border-indigo-200 transition-colors">
                <p className="text-xs uppercase tracking-widest text-slate-500 font-bold">Cab Readiness</p>
                <div className="mt-2 flex items-baseline gap-2">
                  <p className="text-2xl font-black text-slate-800">{cabs.length}</p>
                  <p className="text-sm font-semibold text-indigo-600">listed</p>
                </div>
                <p className="text-xs text-slate-400 mt-1">Update multipliers & dates</p>
              </div>
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 hover:border-indigo-200 transition-colors">
                <p className="text-xs uppercase tracking-widest text-slate-500 font-bold">Today’s Demand</p>
                <div className="mt-2 flex items-baseline gap-2">
                  <p className="text-2xl font-black text-slate-800">{groupedBookings.present.length}</p>
                  <p className="text-sm font-semibold text-blue-600">trips</p>
                </div>
                <p className="text-xs text-slate-400 mt-1">Monitor live operations</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>
                Top Routes
              </h2>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">By Revenue</span>
            </div>
            <div className="space-y-3">
              {revenueByRoute.map((route, i) => (
                <div key={route.route} className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-4 py-2.5">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-slate-400 w-4">{i + 1}</span>
                    <span className="font-semibold text-slate-700 text-sm truncate max-w-[120px]" title={route.route}>{route.route}</span>
                  </div>
                  <span className="text-sm font-bold text-indigo-600">₹{route.total.toLocaleString('en-IN')}</span>
                </div>
              ))}
              {revenueByRoute.length === 0 && (
                <div className="text-center py-6 text-slate-400 text-sm">No routes generating revenue yet.</div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div id="section-system-health" className="max-w-7xl mx-auto mb-8 pt-8 px-6">
        <h2 className="text-xl font-bold text-slate-800 mb-5 flex items-center gap-2">
          <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
          System Health
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex flex-col justify-center">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100">
                <p className="text-xs uppercase tracking-widest text-slate-500 font-bold">Avg Latency (ms)</p>
                <div className="flex items-end gap-3 mt-2">
                  <p className="text-3xl font-black text-slate-800">{health?.metrics?.avgLatencyMs ?? 'N/A'}</p>
                  <p className="text-sm font-semibold text-emerald-600 mb-1">Optimal</p>
                </div>
                <div className="h-1.5 bg-slate-200 rounded-full mt-4 overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 transition-all duration-500"
                    style={{ width: `${Math.min(100, (health?.metrics?.avgLatencyMs || 0) / 10)}%` }}
                  />
                </div>
              </div>
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100">
                <p className="text-xs uppercase tracking-widest text-slate-500 font-bold">Error Rate</p>
                <div className="flex items-end gap-3 mt-2">
                  <p className="text-3xl font-black text-slate-800">{health?.metrics?.errorRate ?? '0%'}</p>
                  <p className="text-sm font-semibold text-emerald-600 mb-1">Healthy</p>
                </div>
                <div className="h-1.5 bg-slate-200 rounded-full mt-4 overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 transition-all duration-500"
                    style={{ width: `${Math.min(100, (health?.metrics?.errorRate || 0) * 100)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
            <h3 className="text-sm font-bold text-slate-800 mb-4 uppercase tracking-widest">Platform Status</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                <div className="flex items-center gap-3">
                  <div className={`w-2.5 h-2.5 rounded-full ${health?.dbReady ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]'}`} />
                  <span className="font-semibold text-slate-700">Database Connection</span>
                </div>
                <span className={`text-sm font-bold ${health?.dbReady ? 'text-emerald-600' : 'text-rose-600'}`}>{health?.dbReady ? 'Connected' : 'Degraded'}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                  <span className="font-semibold text-slate-700">Audit Subsystem</span>
                </div>
                <span className="text-sm font-bold text-slate-600">{health?.auditCount ?? 0} events logged</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]" />
                  <span className="font-semibold text-slate-700">Metrics Collector</span>
                </div>
                <span className="text-sm font-bold text-slate-600">{health?.metrics ? 'Active' : 'Standby'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div id="section-analytics" className="max-w-7xl mx-auto mb-8 pt-4">
        <h2 className="text-xl font-bold text-slate-800 mb-5 flex items-center gap-2">
          <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" /></svg>
          Revenue Analytics
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm lg:col-span-2">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6">Daily Revenue Trend</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={revenueByDay} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} tickFormatter={(val) => `₹${val}`} />
                  <Tooltip
                    formatter={(value) => [`₹${value.toLocaleString('en-IN')}`, 'Revenue']}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' }}
                  />
                  <Line type="monotone" dataKey="total" stroke="#4f46e5" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6">Revenue by Cab Type</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueByCab} margin={{ top: 5, right: 0, bottom: 5, left: -20 }}>
                  <XAxis dataKey="cabType" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} tickFormatter={(val) => `₹${val}`} />
                  <Tooltip
                    formatter={(value) => [`₹${value.toLocaleString('en-IN')}`, 'Revenue']}
                    cursor={{ fill: '#f1f5f9' }}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar dataKey="total" fill="#3b82f6" radius={[6, 6, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      <div id="section-routes-&-cabs" className="max-w-7xl mx-auto mb-8 pt-4">
        <h2 className="text-xl font-bold text-slate-800 mb-5 flex items-center gap-2">
          <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>
          Configure
        </h2>
        <div className="flex flex-wrap gap-4">
          <button onClick={() => setRouteModalOpen(true)} className="flex items-center gap-2 bg-white px-6 py-4 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-purple-200 transition-all font-bold text-slate-700">
            <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            Manage Fleet Routes
          </button>
          <button onClick={() => setCabModalOpen(true)} className="flex items-center gap-2 bg-white px-6 py-4 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-blue-200 transition-all font-bold text-slate-700">
            <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
            Manage Cab Inventory
          </button>
        </div>
      </div>

      <div id="section-bookings" className="max-w-7xl mx-auto mb-8 pt-4">
        <h2 className="text-xl font-bold text-slate-800 mb-5 flex items-center gap-2">
          <svg className="w-5 h-5 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
          Bookings Log
        </h2>
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 bg-slate-50/50">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <div className="flex bg-slate-100 p-1 rounded-xl">
                {tabs.map((tab) => (
                  <button key={tab} onClick={() => setActiveTab(tab)} className={`px-5 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === tab ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                    {tab.toUpperCase()} <span className="ml-1 px-1.5 py-0.5 rounded-md bg-slate-100 text-xs text-slate-400">{groupedBookings[tab].length}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <svg className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                <input
                  className="w-full pl-11 pr-4 py-3 rounded-xl bg-white border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium placeholder:text-slate-400"
                  placeholder="Search passenger, route, or pickup location..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>
              <div className="relative w-full md:w-64 shrink-0">
                <select
                  className="w-full appearance-none px-4 py-3 rounded-xl bg-white border border-slate-200 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="ALL">All Status</option>
                  <option value="PENDING">Pending</option>
                  <option value="CONFIRMED">Confirmed</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
                <svg className="w-4 h-4 text-slate-500 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50/80 text-slate-500 uppercase text-xs font-bold tracking-wider">
                  <tr>
                    <th className="px-6 py-4 rounded-tl-xl">Customer</th>
                    <th className="px-6 py-4">Route & Schedule</th>
                    <th className="px-6 py-4">Cab Type</th>
                    <th className="px-6 py-4">Fare</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right rounded-tr-xl">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {filteredBookings.map((booking) => (
                    <tr key={booking._id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-6 py-4">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedPassenger(booking);
                            setPassengerModalOpen(true);
                          }}
                          className="font-bold text-slate-800 hover:text-indigo-600 transition-colors text-left flex items-center gap-2"
                        >
                          <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0 border border-slate-200">
                            {(booking.passengerId?.name || booking.contact?.name || 'G').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <span>{booking.passengerId?.name || booking.contact?.name || booking.user?.name || booking.contact?.email || booking.user?.email || 'Guest'}</span>
                            <span className="block text-[10px] text-slate-400 font-medium font-mono uppercase tracking-wider mt-0.5">#{booking._id.slice(-6)}</span>
                          </div>
                        </button>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          <p className="font-semibold text-slate-800 flex items-center gap-1.5 line-clamp-1">
                            {booking.pickup?.address?.split(',')[0]}
                            <svg className="w-3 h-3 text-slate-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                            {booking.dropoff?.address?.split(',')[0]}
                          </p>
                          <p className="text-xs text-slate-500 font-medium flex items-center gap-1">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                            {booking.schedule?.pickupDate} • {booking.schedule?.pickupTime || 'Anytime'}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 text-slate-600 text-xs font-bold border border-slate-200">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
                          {booking.cabId?.type || 'Assigned Cab'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-bold text-slate-800">₹{booking.fare?.totalAmount?.toLocaleString('en-IN')}</p>
                        <p className="text-[10px] uppercase tracking-wider font-semibold text-emerald-600 mt-0.5">Paid</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${booking.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : booking.status === 'PENDING' ? 'bg-amber-50 text-amber-700 border-amber-200' : booking.status === 'CONFIRMED' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-slate-50 text-slate-700 border-slate-200'}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${booking.status === 'COMPLETED' ? 'bg-emerald-500' : booking.status === 'PENDING' ? 'bg-amber-500' : booking.status === 'CONFIRMED' ? 'bg-blue-500' : 'bg-slate-500'}`} />
                          {booking.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleEditBooking(booking)}
                          className="inline-flex items-center justify-center p-2 rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-indigo-600 hover:border-indigo-200 hover:bg-indigo-50 transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
                          title="Update Status"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredBookings.length === 0 && (
                    <tr>
                      <td colSpan="6" className="px-6 py-12 text-center text-slate-500">
                        <div className="flex flex-col items-center justify-center">
                          <svg className="w-12 h-12 text-slate-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                          <p className="font-semibold text-slate-600">No bookings match your filters</p>
                          <p className="text-sm mt-1">Try adjusting your search criteria or changing tabs.</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
          {/* ── Modals ── */}
          {routeModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm px-4">
              <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                  <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                    <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /></svg>
                    Route Management
                  </h2>
                  <button className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors" onClick={() => setRouteModalOpen(false)}>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
                <div className="p-6 overflow-y-auto">
                  <form onSubmit={handleCreateRoute} className="bg-slate-50 p-5 rounded-2xl border border-slate-100 mb-6 space-y-4">
                    <h3 className="text-sm font-bold text-slate-600 uppercase tracking-widest mb-2">Create New Route</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <input className="px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all w-full" placeholder="From Hub (e.g. Mumbai)" value={routeForm.fromHub} onChange={(e) => setRouteForm((prev) => ({ ...prev, fromHub: e.target.value }))} required />
                      <input className="px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all w-full" placeholder="To Hub (e.g. Pune)" value={routeForm.toHub} onChange={(e) => setRouteForm((prev) => ({ ...prev, toHub: e.target.value }))} required />
                      <div className="relative md:col-span-2">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                        <input className="px-4 py-3 pl-8 rounded-xl border border-slate-200 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all w-full" placeholder="Flat Rate Base Route Price" type="number" value={routeForm.flatRate} onChange={(e) => setRouteForm((prev) => ({ ...prev, flatRate: e.target.value }))} required />
                      </div>
                    </div>
                    <button className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold transition-colors shadow-lg shadow-purple-500/20">Add Route</button>
                  </form>
                  <div>
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-3">Active Routes ({routes.length})</h3>
                    <div className="space-y-3">
                      {routes.map((route) => (
                        <div key={route._id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border border-slate-100 hover:border-purple-200 hover:bg-purple-50/30 transition-all gap-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center shrink-0">
                              <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" /></svg>
                            </div>
                            <div>
                              <p className="font-bold text-slate-800 text-sm">{route.fromHub} <span className="text-slate-400 mx-1">→</span> {route.toHub}</p>
                              <p className="text-xs text-slate-400 font-mono mt-0.5">ID: {route._id.slice(-6)}</p>
                            </div>
                          </div>
                          <span className="inline-flex items-center px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-sm font-bold border border-emerald-100">₹{route.flatRate}</span>
                        </div>
                      ))}
                      {routes.length === 0 && <p className="text-center py-8 text-slate-400 font-medium">No routes configured yet.</p>}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {cabModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm px-4">
              <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                  <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                    <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
                    Cab Inventory
                  </h2>
                  <button className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors" onClick={() => setCabModalOpen(false)}>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
                <div className="p-6 overflow-y-auto">
                  <form onSubmit={handleCreateCab} className="bg-slate-50 p-5 rounded-2xl border border-slate-100 mb-6 space-y-4">
                    <h3 className="text-sm font-bold text-slate-600 uppercase tracking-widest mb-2">Register New Cab</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <input className="px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all w-full" placeholder="Cab Class (e.g. SUV, Sedan)" value={cabForm.cabType} onChange={(e) => setCabForm((prev) => ({ ...prev, cabType: e.target.value }))} required />
                      <input className="px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all w-full" placeholder="Specific Model (e.g. Innova)" value={cabForm.carModel} onChange={(e) => setCabForm((prev) => ({ ...prev, carModel: e.target.value }))} required />
                      <div className="relative md:col-span-2">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold font-mono">x</span>
                        <input className="px-4 py-3 pl-8 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all w-full" placeholder="Fare Multiplier (e.g. 1.5 for SUV)" type="number" step="0.1" value={cabForm.multiplier} onChange={(e) => setCabForm((prev) => ({ ...prev, multiplier: e.target.value }))} required />
                      </div>
                    </div>
                    <button className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition-colors shadow-lg shadow-blue-500/20">Add Cab to Fleet</button>
                  </form>
                  <div>
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-3">Operating Cabs ({cabs.length})</h3>
                    <div className="space-y-3">
                      {cabs.map((cab) => (
                        <div key={cab._id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border border-slate-100 hover:border-blue-200 hover:bg-blue-50/30 transition-all gap-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                              <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
                            </div>
                            <div>
                              <p className="font-bold text-slate-800 text-sm">{cab.cabType} <span className="text-slate-400 mx-1 font-normal">•</span> {cab.carModel}</p>
                              <p className="text-xs text-slate-400 font-mono mt-0.5">ID: {cab._id.slice(-6)}</p>
                            </div>
                          </div>
                          <span className="inline-flex items-center px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-sm font-bold border border-slate-200">Multiplier x{cab.multiplier}</span>
                        </div>
                      ))}
                      {cabs.length === 0 && <p className="text-center py-8 text-slate-400 font-medium">No cabs configured yet.</p>}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {passengerModalOpen && selectedPassenger && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm px-4">
              <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col">
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                  <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                    <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                    Passenger Dossier
                  </h2>
                  <button className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors" onClick={() => setPassengerModalOpen(false)}>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
                <div className="p-6">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-16 h-16 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-2xl font-black border-2 border-indigo-200">
                      {(selectedPassenger.passengerId?.name || selectedPassenger.contact?.name || selectedPassenger.user?.name || 'G').charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-slate-800">{selectedPassenger.passengerId?.name || selectedPassenger.contact?.name || selectedPassenger.user?.name || 'Guest User'}</h3>
                      <p className="text-sm font-medium text-slate-500 flex items-center gap-1.5 mt-1">
                        <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                        {selectedPassenger.passengerId?.email || selectedPassenger.contact?.email || selectedPassenger.user?.email || 'No email left'}
                      </p>
                      <p className="text-sm font-medium text-slate-500 flex items-center gap-1.5 mt-0.5">
                        <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                        {selectedPassenger.passengerId?.phone || selectedPassenger.contact?.phone || 'No phone left'}
                      </p>
                    </div>
                  </div>
                  <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 grid grid-cols-2 gap-y-4 gap-x-2">
                    <div className="col-span-2 border-b border-slate-200 pb-4">
                      <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-1">Trip Route</p>
                      <p className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" /> {selectedPassenger.pickup?.address}
                      </p>
                      <div className="w-px h-3 bg-slate-300 ml-1 my-0.5" />
                      <p className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-indigo-500 shrink-0" /> {selectedPassenger.dropoff?.address}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-1">Date & Time</p>
                      <p className="text-sm font-semibold text-slate-800">{selectedPassenger.schedule?.pickupDate}</p>
                      <p className="text-xs text-slate-500 font-medium">{selectedPassenger.schedule?.pickupTime || 'Anytime'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-1">Booking Ref</p>
                      <p className="text-sm font-mono font-semibold text-slate-800">#{selectedPassenger._id.slice(-8)}</p>
                      <p className={`text-xs font-bold mt-1 ${selectedPassenger.status === 'COMPLETED' ? 'text-emerald-600' : selectedPassenger.status === 'CANCELLED' ? 'text-rose-600' : 'text-blue-600'}`}>{selectedPassenger.status}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="max-w-7xl mx-auto px-6 mb-8 pt-4" id="section-audit-logs">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div>
                <h2 className="text-xl font-bold text-slate-800 mb-5 flex items-center gap-2">
                  <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                  Status Overrides
                </h2>
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50/50 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
                  <form onSubmit={handleStatusUpdate} className="relative z-10 flex flex-col gap-4">
                    {editingBooking ? (
                      <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-xl flex items-start justify-between gap-4">
                        <div>
                          <p className="text-xs font-bold text-indigo-600 uppercase tracking-widest">Editing Booking</p>
                          <p className="font-mono text-sm font-black text-slate-800 mt-1">#{editingBooking._id.slice(-8)}</p>
                          <p className="text-xs font-medium text-slate-500 mt-0.5">{editingBooking.pickup?.address?.split(',')[0]} → {editingBooking.dropoff?.address?.split(',')[0]}</p>
                        </div>
                        <button type="button" onClick={() => { setBookingId(''); setEditingBooking(null); }} className="text-slate-400 hover:text-slate-600 transition-colors p-1"><svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg></button>
                      </div>
                    ) : (
                      <div>
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-2">Booking Object ID</label>
                        <input className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono text-sm" placeholder="Paste exact Booking ID" value={bookingId} onChange={(e) => setBookingId(e.target.value)} required />
                      </div>
                    )}
                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-2">New State</label>
                      <select className="w-full appearance-none px-4 py-3 rounded-xl border border-slate-200 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all font-bold text-slate-700 bg-white" value={status} onChange={(e) => setStatus(e.target.value)}>
                        <option value="CONFIRMED">CONFIRMED (Approve)</option>
                        <option value="COMPLETED">COMPLETED (Finish)</option>
                        <option value="CANCELLED">CANCELLED (Reject/Fail)</option>
                      </select>
                    </div>
                    <button className="w-full py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition-all shadow-lg shadow-indigo-500/20">Apply Forced Update</button>
                    <div className="empty:hidden">
                      {error && <Alert type="error" message={error} />}
                      {success && <Alert type="success" message={success} />}
                    </div>
                  </form>
                </div>
              </div>

              <div>
                <h2 className="text-xl font-bold text-slate-800 mb-5 flex items-center gap-2">
                  <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  Activity Timeline ({activeTab})
                </h2>
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 max-h-[440px] overflow-y-auto">
                  <div className="relative pl-3 space-y-6">
                    {/* Vertical Timeline Line */}
                    <div className="absolute left-[19px] top-2 bottom-0 w-px bg-slate-100" />

                    {groupedLogs[activeTab].map((log) => (
                      <div key={log._id} className="relative pl-8">
                        {/* Timeline Dot */}
                        <span className="absolute left-[2px] top-1.5 w-2 h-2 rounded-full bg-slate-200 ring-4 ring-white shadow-sm" />

                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-1 sm:gap-4 group">
                          <div>
                            <p className="font-bold text-slate-800 text-sm">{log.action}</p>
                            <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-1 opacity-80 group-hover:opacity-100 transition-opacity">
                              <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                              {log.actor?.email || 'System Action'}
                            </p>
                          </div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 shrink-0 mt-0.5 whitespace-nowrap">
                            {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {new Date(log.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                          </span>
                        </div>
                      </div>
                    ))}
                    {groupedLogs[activeTab].length === 0 && (
                      <div className="text-center py-10">
                        <p className="text-sm font-semibold text-slate-400">No activity logged in this section.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
