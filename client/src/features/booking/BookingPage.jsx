import React, { useEffect, useMemo, useState } from 'react';
import { Alert } from '../../shared/ui/Alert';
import { listBookings } from '../../shared/api/endpoints';

const tabs = ['present', 'planned', 'past'];

const TAB_LABELS = { present: 'Today', planned: 'Upcoming', past: 'Past' };

const STATUS_CONFIG = {
  CONFIRMED: { label: 'Confirmed', bar: 'bg-emerald-500', badge: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-400' },
  COMPLETED: { label: 'Completed', bar: 'bg-indigo-500', badge: 'bg-indigo-100 text-indigo-700', dot: 'bg-indigo-400' },
  CANCELLED: { label: 'Cancelled', bar: 'bg-rose-500', badge: 'bg-rose-100 text-rose-700', dot: 'bg-rose-400' },
  PENDING: { label: 'Pending', bar: 'bg-amber-400', badge: 'bg-amber-100 text-amber-700', dot: 'bg-amber-400' },
};

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
  if (!pickupDateTime) return 'planned';
  const now = new Date();
  const sameDay = pickupDateTime.toDateString() === now.toDateString();
  if (sameDay) return 'present';
  if (pickupDateTime > now) return 'planned';
  return 'past';
}

function formatDate(dateStr, timeStr) {
  if (!dateStr) return 'N/A';
  try {
    const d = new Date(`${dateStr}T${timeStr || '00:00'}`);
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) +
      (timeStr ? `, ${d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}` : '');
  } catch {
    return dateStr;
  }
}

export function BookingPage() {
  const [bookings, setBookings] = useState([]);
  const [activeTab, setActiveTab] = useState('present');
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [exporting, setExporting] = useState(false);

  async function loadBookings() {
    try {
      const data = await listBookings();
      setBookings(data);
    } catch (err) {
      setError(err?.response?.data?.error?.detail || 'Failed to load bookings.');
    }
  }

  useEffect(() => { loadBookings(); }, []);

  const grouped = useMemo(() => {
    const map = { present: [], planned: [], past: [] };
    bookings.forEach((booking) => { map[classifyBooking(booking)].push(booking); });
    return map;
  }, [bookings]);

  const filtered = useMemo(() => {
    const list = grouped[activeTab] || [];
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
  }, [grouped, activeTab, query, statusFilter]);

  const stats = useMemo(() => ({
    total: bookings.length,
    confirmed: bookings.filter((b) => b.status === 'CONFIRMED').length,
    completed: bookings.filter((b) => b.status === 'COMPLETED').length,
    cancelled: bookings.filter((b) => b.status === 'CANCELLED').length,
  }), [bookings]);

  const nextRide = useMemo(() => {
    const future = bookings
      .filter((b) => classifyBooking(b) === 'planned')
      .map((b) => ({ booking: b, date: parsePickupDateTime(b) }))
      .filter((b) => b.date && !Number.isNaN(b.date.getTime()))
      .sort((a, b) => a.date - b.date);
    return future[0]?.booking || null;
  }, [bookings]);

  async function exportCsv() {
    setExporting(true);
    try {
      const header = ['Booking ID', 'Status', 'Pickup', 'Dropoff', 'Pickup Date', 'Pickup Time', 'Cab Type', 'Car Model', 'Fare'];
      const rows = bookings.map((b) => [
        b._id, b.status,
        b.pickup?.address || '', b.dropoff?.address || '',
        b.schedule?.pickupDate || '', b.schedule?.pickupTime || '',
        b.selection?.cabType || '', b.selection?.carModel || '',
        b.fare?.totalAmount ?? '',
      ]);
      const csv = [header, ...rows].map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `safar-express-bookings-${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">

      {/* ── Page header ── */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5 mb-8">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-indigo-500 mb-1">Customer Dashboard</p>
          <h1 className="text-3xl font-black text-slate-900 leading-tight">
            My <span className="relative inline-block">
              Bookings
              <span className="absolute -bottom-1 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 to-blue-400 rounded-full" />
            </span>
          </h1>
        </div>

        {/* ── Stat cards ── */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="bg-white border border-slate-100 rounded-2xl px-4 py-2.5 shadow-sm flex items-center gap-2.5">
            <div className="w-2 h-2 rounded-full bg-slate-400" />
            <div>
              <p className="text-xs text-slate-400 leading-none">Total</p>
              <p className="text-lg font-bold text-slate-800 leading-tight">{stats.total}</p>
            </div>
          </div>
          <div className="bg-emerald-50 border border-emerald-100 rounded-2xl px-4 py-2.5 shadow-sm flex items-center gap-2.5">
            <div className="w-2 h-2 rounded-full bg-emerald-400" />
            <div>
              <p className="text-xs text-emerald-600 leading-none">Confirmed</p>
              <p className="text-lg font-bold text-emerald-700 leading-tight">{stats.confirmed}</p>
            </div>
          </div>
          <div className="bg-indigo-50 border border-indigo-100 rounded-2xl px-4 py-2.5 shadow-sm flex items-center gap-2.5">
            <div className="w-2 h-2 rounded-full bg-indigo-400" />
            <div>
              <p className="text-xs text-indigo-500 leading-none">Completed</p>
              <p className="text-lg font-bold text-indigo-700 leading-tight">{stats.completed}</p>
            </div>
          </div>
          <div className="bg-rose-50 border border-rose-100 rounded-2xl px-4 py-2.5 shadow-sm flex items-center gap-2.5">
            <div className="w-2 h-2 rounded-full bg-rose-400" />
            <div>
              <p className="text-xs text-rose-500 leading-none">Cancelled</p>
              <p className="text-lg font-bold text-rose-700 leading-tight">{stats.cancelled}</p>
            </div>
          </div>

          {/* Export CSV */}
          <button
            type="button"
            onClick={exportCsv}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 font-semibold text-sm shadow-sm hover:border-indigo-300 hover:text-indigo-600 hover:shadow-indigo-500/10 transition-all duration-200"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            {exporting ? 'Exporting…' : 'Export CSV'}
          </button>
        </div>
      </div>

      {/* ── Next Ride Banner ── */}
      {nextRide && (
        <div className="mb-8 rounded-2xl bg-gradient-to-r from-indigo-600 to-blue-600 text-white p-5 shadow-lg shadow-indigo-500/20 relative overflow-hidden">
          <div className="absolute right-0 top-0 bottom-0 w-40 bg-white/5 rounded-l-[3rem]" />
          <p className="text-xs font-bold uppercase tracking-widest text-white/60 mb-2">⚡ Next Ride</p>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 relative z-10">
            <div>
              <p className="text-xl font-bold flex items-center gap-2">
                <svg className="w-5 h-5 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {nextRide.pickup?.address}
                <span className="text-white/50 font-normal">→</span>
                {nextRide.dropoff?.address}
              </p>
              <p className="text-sm text-white/70 mt-1">
                {nextRide.selection?.cabType || 'Cab'} {nextRide.selection?.carModel ? `· ${nextRide.selection.carModel}` : ''}
              </p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <div className="px-3 py-1.5 rounded-full bg-white/15 border border-white/20 text-sm font-semibold backdrop-blur-sm">
                📅 {formatDate(nextRide.schedule?.pickupDate, nextRide.schedule?.pickupTime)}
              </div>
              <span className={`px-3 py-1.5 rounded-full text-sm font-semibold ${STATUS_CONFIG[nextRide.status]?.badge || 'bg-white/20 text-white'}`}>
                {nextRide.status}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ── Tab bar with count badges ── */}
      <div className="flex gap-2 mb-6 p-1.5 bg-slate-100 rounded-2xl w-fit">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`relative px-5 py-2 rounded-xl font-semibold text-sm transition-all duration-200 flex items-center gap-2 ${activeTab === tab
                ? 'bg-white text-indigo-600 shadow-md'
                : 'text-slate-500 hover:text-slate-800'
              }`}
          >
            {TAB_LABELS[tab]}
            {grouped[tab]?.length > 0 && (
              <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${activeTab === tab ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-200 text-slate-500'
                }`}>
                {grouped[tab].length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Search + filter row ── */}
      <div className="flex flex-col md:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1111 5a6 6 0 016 6z" />
          </svg>
          <input
            className="w-full pl-10 pr-4 py-3 rounded-xl bg-white border border-slate-200 shadow-sm focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-300 transition-all"
            placeholder="Search by route, cab, booking ID or location…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <select
          className="px-4 py-3 rounded-xl bg-white border border-slate-200 shadow-sm focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-300 text-slate-700 transition-all"
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

      <Alert type="error" message={error} />

      {/* ── Booking cards ── */}
      <div className="space-y-4 mt-4">
        {filtered.map((booking, i) => {
          const cfg = STATUS_CONFIG[booking.status] || STATUS_CONFIG.PENDING;
          return (
            <div
              key={booking._id}
              className="relative flex rounded-2xl overflow-hidden bg-white border border-slate-100 shadow-sm hover:shadow-indigo-500/10 hover:border-indigo-100 transition-all duration-300"
              style={{ animationDelay: `${i * 40}ms` }}
            >
              {/* left accent bar */}
              <div className={`w-1 shrink-0 ${cfg.bar}`} />

              <div className="flex-1 p-5">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  <div className="space-y-1.5">
                    {/* Route */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-bold text-slate-900 text-base">
                        {booking.pickup?.address}
                        <span className="mx-1.5 text-slate-400">→</span>
                        {booking.dropoff?.address}
                      </p>
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${cfg.badge}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                        {booking.status}
                      </span>
                    </div>

                    {/* Date & type */}
                    <p className="text-sm text-slate-500 flex items-center gap-1.5">
                      <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      {formatDate(booking.schedule?.pickupDate, booking.schedule?.pickupTime)}
                      <span className="mx-1 text-slate-300">·</span>
                      <span className="font-medium text-slate-600">{booking.tripType?.replace('_', ' ')}</span>
                    </p>

                    {/* Cab & route */}
                    <p className="text-sm text-slate-500 flex items-center gap-1.5">
                      <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10l2 1m8-1l2 1m-2-1V6m2 10V6a1 1 0 00-1-1h-1" />
                      </svg>
                      {booking.selection?.cabType || 'N/A'}
                      {booking.selection?.carModel ? ` · ${booking.selection.carModel}` : ''}
                    </p>

                    {/* Booking ID */}
                    <p className="text-xs text-slate-300 font-mono">#{booking._id}</p>
                  </div>

                  {/* Fare */}
                  <div className="text-right shrink-0">
                    <p className="text-xs uppercase tracking-widest text-slate-400">Fare</p>
                    <p className="text-2xl font-black text-indigo-600 leading-tight">
                      ₹{booking.fare?.totalAmount ?? '—'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {/* ── Empty state ── */}
        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 rounded-full bg-indigo-50 flex items-center justify-center mb-5">
              <svg className="w-10 h-10 text-indigo-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10l2 1m8-1l2 1m-2-1V6m2 10V6a1 1 0 00-1-1h-1" />
              </svg>
            </div>
            <p className="text-lg font-bold text-slate-700">No bookings here</p>
            <p className="text-sm text-slate-400 mt-1 max-w-xs">
              {activeTab === 'present'
                ? "You have no rides scheduled for today."
                : activeTab === 'planned'
                  ? "No upcoming rides. Book one now!"
                  : "Your completed and cancelled rides will appear here."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
