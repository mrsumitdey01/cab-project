import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Alert } from '../../shared/ui/Alert';
import { listBookings } from '../../shared/api/endpoints';

const tabs = ['present', 'planned', 'past'];

const TAB_LABELS = { present: 'TODAY', planned: 'UPCOMING', past: 'PAST' };

const STATUS_CONFIG = {
  CONFIRMED: {
    label: 'Confirmed',
    bar: 'bg-emerald-500',
    badge: 'bg-emerald-100 text-emerald-700',
    dot: 'bg-emerald-500',
    tint: 'bg-emerald-50/70',
  },
  COMPLETED: {
    label: 'Completed',
    bar: 'bg-indigo-500',
    badge: 'bg-indigo-100 text-indigo-700',
    dot: 'bg-indigo-500',
    tint: 'bg-indigo-50/70',
  },
  CANCELLED: {
    label: 'Cancelled',
    bar: 'bg-rose-500',
    badge: 'bg-rose-100 text-rose-700',
    dot: 'bg-rose-500',
    tint: 'bg-rose-50/70',
  },
  PENDING: {
    label: 'Pending',
    bar: 'bg-amber-400',
    badge: 'bg-amber-100 text-amber-700',
    dot: 'bg-amber-400',
    tint: 'bg-amber-50/80',
  },
};

function parsePickupDateTime(booking) {
  let dateValue = booking?.schedule?.pickupDate;
  if (!dateValue) return null;
  if (dateValue.includes('T')) {
    dateValue = dateValue.split('T')[0];
  }
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
    let cleanDate = dateStr;
    if (cleanDate.includes('T')) {
      cleanDate = cleanDate.split('T')[0];
    }

    let d = new Date(`${cleanDate}T${timeStr || '00:00'}`);

    if (Number.isNaN(d.getTime())) {
      d = new Date(dateStr);
    }

    if (Number.isNaN(d.getTime())) {
      return dateStr;
    }

    const hasTimeInfo = timeStr || d.getHours() !== 0 || d.getMinutes() !== 0;

    return `${d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}${hasTimeInfo ? `, ${d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}` : ''}`;
  } catch {
    return dateStr;
  }
}

function truncateBookingId(id) {
  if (!id) return '';
  if (id.length <= 12) return id;
  return `${id.slice(0, 6)}...${id.slice(-4)}`;
}

function CalendarBadgeIcon() {
  return (
    <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M8 3v3m8-3v3M4.5 9.5h15M6 5.5h12a1.5 1.5 0 011.5 1.5v11A1.5 1.5 0 0118 19.5H6A1.5 1.5 0 014.5 18V7A1.5 1.5 0 016 5.5z" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-4.35-4.35M17 11A6 6 0 1111 5a6 6 0 016 6z" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg className="h-4.5 w-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M12 6.5v5l3.5 2M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function CarIcon() {
  return (
    <svg className="h-4.5 w-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M7 16h10M6.5 9.5l1.4-3.3A1.5 1.5 0 019.28 5h5.44a1.5 1.5 0 011.38.92l1.4 3.58M5.5 10.5h13A1.5 1.5 0 0120 12v4a1 1 0 01-1 1h-1m-12 0H5a1 1 0 01-1-1v-4a1.5 1.5 0 011.5-1.5zM7 17a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zm13 0a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
    </svg>
  );
}

function RouteIcon({ destination = false }) {
  if (destination) {
    return (
      <svg className="h-4.5 w-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M12 21s6-4.35 6-10a6 6 0 10-12 0c0 5.65 6 10 6 10z" />
        <circle cx="12" cy="11" r="2.5" strokeWidth="1.8" />
      </svg>
    );
  }

  return (
    <svg className="h-4.5 w-4.5" viewBox="0 0 24 24" fill="currentColor">
      <circle cx="12" cy="12" r="5" />
    </svg>
  );
}

function EmptyStateIcon() {
  return (
    <svg className="h-16 w-16" viewBox="0 0 64 64" fill="none" stroke="currentColor">
      <rect x="16" y="18" width="24" height="30" rx="5" strokeWidth="2.2" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M24 18v-4a4 4 0 118 0v4M20 28h16M24 36h8" />
      <circle cx="46" cy="42" r="10" strokeWidth="2.2" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M53 49l6 6" />
    </svg>
  );
}

function formatFare(booking) {
  if (booking.status === 'PENDING' && (booking.fare?.totalAmount == null || booking.fare?.totalAmount === 0)) {
    return 'Pending';
  }
  return `₹${booking.fare?.totalAmount ?? '—'}`;
}

export function BookingPage() {
  const [bookings, setBookings] = useState([]);
  const [activeTab, setActiveTab] = useState('planned');
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [exporting, setExporting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState('');
  const [recentStatusIds, setRecentStatusIds] = useState([]);
  const previousBookingsRef = useRef([]);

  const loadBookings = useCallback(async () => {
    try {
      setLoading(true);
      const data = await listBookings();
      const nextBookings = data.bookings || [];
      setRecentStatusIds((prev) => {
        const previous = new Map(previousBookingsRef.current.map((item) => [item._id, item.status]));
        return nextBookings.filter((item) => previous.has(item._id) && previous.get(item._id) !== item.status).map((item) => item._id);
      });
      setBookings(nextBookings);
      previousBookingsRef.current = nextBookings;
    } catch (err) {
      setError(err?.response?.data?.error?.detail || 'Failed to load bookings.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadBookings(); }, [loadBookings]);

  useEffect(() => {
    if (!recentStatusIds.length) return undefined;
    const timeout = setTimeout(() => setRecentStatusIds([]), 1400);
    return () => clearTimeout(timeout);
  }, [recentStatusIds]);

  const grouped = useMemo(() => {
    const map = { present: [], planned: [], past: [] };
    bookings.forEach((booking) => { map[classifyBooking(booking)].push(booking); });
    return map;
  }, [bookings]);

  const filtered = useMemo(() => {
    const sourceTabs = query ? tabs : [activeTab];
    const list = sourceTabs.flatMap((tab) => grouped[tab] || []);
    return list.filter((booking) => {
      const haystack = [
        booking.pickup?.address,
        booking.dropoff?.address,
        booking.selection?.route,
        booking.selection?.cabType,
        booking.selection?.carModel,
        booking._id,
        booking.schedule?.pickupDate,
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

  async function copyBookingId(id) {
    if (!navigator?.clipboard || !id) return;
    await navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(''), 1500);
  }

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
    <div className="min-h-screen bg-[#faf8ff]">
      <div className="mx-auto max-w-7xl px-6 pb-14 pt-24 lg:px-8">
        <div className="mb-8 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-100 text-[#5382ff] shadow-sm">
              <CalendarBadgeIcon />
            </div>
            <h1 className="text-4xl font-black tracking-tight text-[#1E1B4B]">Your Bookings</h1>
            <p className="mt-2 text-base text-slate-600">Manage your intercity journeys and travel history.</p>
          </div>

          <div className="flex w-full max-w-2xl flex-col gap-3 lg:items-end">
            <div className="grid w-full gap-3 sm:grid-cols-[minmax(0,1fr)_220px_auto]">
              <div className="relative">
                <div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                  <SearchIcon />
                </div>
                <input
                  className="w-full rounded-2xl border border-indigo-100/70 bg-white py-3.5 pl-11 pr-4 text-sm text-slate-700 shadow-[0_10px_30px_rgba(30,27,75,0.06)] outline-none transition-all focus:border-[#5382ff] focus:ring-4 focus:ring-[#5382ff]/10"
                  placeholder="Search by route, ID, or date..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>
              <select
                className="rounded-2xl border border-indigo-100/70 bg-white px-4 py-3.5 text-sm font-medium text-slate-700 shadow-[0_10px_30px_rgba(30,27,75,0.06)] outline-none transition-all focus:border-[#5382ff] focus:ring-4 focus:ring-[#5382ff]/10"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="ALL">All Status</option>
                <option value="PENDING">Pending</option>
                <option value="CONFIRMED">Confirmed</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
              <button
                type="button"
                onClick={exportCsv}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#1E1B4B] px-5 py-3.5 text-sm font-semibold text-white transition-all duration-200 hover:scale-[1.02] hover:bg-[#17153d]"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                {exporting ? 'Exporting...' : 'Export CSV'}
              </button>
            </div>

            <div className="flex flex-wrap gap-3 text-sm">
              <div className="rounded-2xl border border-white/70 bg-white px-4 py-3 shadow-[0_10px_30px_rgba(30,27,75,0.06)]">
                <p className="text-slate-400">Total Bookings</p>
                <p className="mt-1 text-xl font-bold text-[#1E1B4B]">{stats.total}</p>
              </div>
              <div className="rounded-2xl border border-emerald-100 bg-emerald-50/80 px-4 py-3 shadow-[0_10px_30px_rgba(16,185,129,0.08)]">
                <p className="text-emerald-600">Confirmed</p>
                <p className="mt-1 text-xl font-bold text-emerald-700">{stats.confirmed}</p>
              </div>
              <div className="rounded-2xl border border-indigo-100 bg-indigo-50/80 px-4 py-3 shadow-[0_10px_30px_rgba(83,130,255,0.08)]">
                <p className="text-indigo-500">Completed</p>
                <p className="mt-1 text-xl font-bold text-indigo-700">{stats.completed}</p>
              </div>
              <div className="rounded-2xl border border-rose-100 bg-rose-50/80 px-4 py-3 shadow-[0_10px_30px_rgba(244,63,94,0.08)]">
                <p className="text-rose-500">Cancelled</p>
                <p className="mt-1 text-xl font-bold text-rose-700">{stats.cancelled}</p>
              </div>
            </div>
          </div>
        </div>

        {nextRide && (
          <div className="relative mb-8 overflow-hidden rounded-3xl bg-gradient-to-r from-[#1E1B4B] via-[#283277] to-[#5382ff] p-6 text-white shadow-[0_24px_60px_rgba(30,27,75,0.28)]">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.18),transparent_30%),linear-gradient(120deg,transparent,rgba(255,255,255,0.12),transparent)]" />
            <div className="relative flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.28em] text-white/60">Next Ride</p>
                <p className="mt-3 text-2xl font-bold">
                  {nextRide.pickup?.address} <span className="mx-2 text-white/50">→</span> {nextRide.dropoff?.address}
                </p>
                <p className="mt-2 text-sm text-white/70">
                  {(nextRide.selection?.cabType || 'Cab')}{nextRide.selection?.carModel ? ` · ${nextRide.selection.carModel}` : ''}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <div className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold backdrop-blur-sm">
                  {formatDate(nextRide.schedule?.pickupDate, nextRide.schedule?.pickupTime)}
                </div>
                <span className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold ${STATUS_CONFIG[nextRide.status]?.badge || 'bg-white/20 text-white'}`}>
                  <span className={`h-2 w-2 rounded-full ${STATUS_CONFIG[nextRide.status]?.dot || 'bg-white'}`} />
                  {STATUS_CONFIG[nextRide.status]?.label || nextRide.status}
                </span>
              </div>
            </div>
          </div>
        )}

        <div className="mb-6 flex flex-col gap-4">
          <div className="inline-flex w-fit rounded-2xl bg-indigo-100/80 p-1.5 shadow-inner">
            {tabs.map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`rounded-xl px-5 py-2.5 text-sm font-semibold transition-all duration-200 ${activeTab === tab ? 'bg-white text-[#1E1B4B] shadow-[0_8px_20px_rgba(30,27,75,0.12)]' : 'text-slate-500 hover:text-slate-700'}`}
              >
                <span>{TAB_LABELS[tab]}</span>
                {grouped[tab]?.length > 0 && (
                  <span className={`ml-2 rounded-full px-2 py-0.5 text-xs ${activeTab === tab ? 'bg-indigo-100 text-indigo-600' : 'bg-white/60 text-slate-500'}`}>
                    {grouped[tab].length}
                  </span>
                )}
              </button>
            ))}
          </div>

          <Alert type="error" message={error} />
        </div>

        <div key={activeTab} className="mt-2 grid gap-5 lg:grid-cols-2">
          {loading && [...Array(4)].map((_, index) => (
            <div key={`booking-skeleton-${index}`} className="overflow-hidden rounded-3xl border border-indigo-100/60 bg-white shadow-[0_16px_45px_rgba(30,27,75,0.06)]">
              <div className="flex">
                <div className="w-1.5 shrink-0 bg-slate-200" />
                <div className="flex-1 p-6">
                  <div className="mb-5 flex items-center justify-between">
                    <div className="h-7 w-28 animate-pulse rounded-full bg-slate-200" />
                    <div className="h-5 w-24 animate-pulse rounded-full bg-slate-200" />
                  </div>
                  <div className="space-y-3">
                    <div className="h-5 w-4/5 animate-pulse rounded-full bg-slate-200" />
                    <div className="h-4 w-2/5 animate-pulse rounded-full bg-slate-200" />
                    <div className="h-20 animate-pulse rounded-2xl bg-slate-100" />
                  </div>
                </div>
              </div>
            </div>
          ))}

          {!loading && filtered.map((booking, i) => {
            const cfg = STATUS_CONFIG[booking.status] || STATUS_CONFIG.PENDING;
            return (
              <div
                key={booking._id}
                className={`group overflow-hidden rounded-3xl border border-indigo-100/70 bg-white shadow-[0_16px_45px_rgba(30,27,75,0.06)] transition-all duration-300 hover:-translate-y-1 hover:border-indigo-200 hover:shadow-[0_24px_60px_rgba(30,27,75,0.12)] stagger-in ${cfg.tint}`}
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <div className="flex min-h-full">
                  <div className={`w-1 shrink-0 sm:w-1.5 ${cfg.bar}`} />
                  <div className="flex flex-1 flex-col p-6">
                    <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                      <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold uppercase tracking-wide ${cfg.badge} ${recentStatusIds.includes(booking._id) ? 'status-pulse' : ''}`}>
                        <span className={`h-2 w-2 rounded-full ${cfg.dot}`} />
                        {cfg.label}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-slate-500">{truncateBookingId(booking._id)}</span>
                        <button
                          type="button"
                          onClick={() => copyBookingId(booking._id)}
                          className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-500 transition-colors hover:bg-indigo-50 hover:text-indigo-600"
                        >
                          {copiedId === booking._id ? 'Copied' : 'Copy'}
                        </button>
                      </div>
                    </div>

                    <div className="mb-5 flex items-start gap-4">
                      <div className="flex flex-col items-center pt-1">
                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
                          <RouteIcon />
                        </span>
                        <span className="my-1 h-8 w-px bg-slate-200" />
                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                          <RouteIcon destination />
                        </span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold uppercase tracking-[0.22em] text-slate-400">Journey</p>
                        <div className="mt-2 space-y-3">
                          <div>
                            <p className="text-lg font-semibold text-[#1E1B4B]">{booking.pickup?.address || 'Pickup not provided'}</p>
                            <p className="text-xs text-slate-400">Pickup</p>
                          </div>
                          <div>
                            <p className="text-lg font-semibold text-[#1E1B4B]">{booking.dropoff?.address || 'Dropoff not provided'}</p>
                            <p className="text-xs text-slate-400">Destination</p>
                          </div>
                        </div>
                      </div>
                      <span className="rounded-full bg-indigo-50 px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-indigo-600">
                        {(booking.tripType || 'ONE_WAY').replace('_', ' ')}
                      </span>
                    </div>

                    <div className="grid gap-3 rounded-2xl border border-indigo-100/70 bg-white/75 p-4 backdrop-blur-sm sm:grid-cols-2">
                      <div className="flex items-start gap-3">
                        <span className="mt-0.5 rounded-xl bg-indigo-50 p-2 text-indigo-600">
                          <ClockIcon />
                        </span>
                        <div>
                          <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Date & Time</p>
                          <p className="mt-1 text-sm font-semibold text-slate-700">{formatDate(booking.schedule?.pickupDate, booking.schedule?.pickupTime)}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <span className="mt-0.5 rounded-xl bg-indigo-50 p-2 text-indigo-600">
                          <CarIcon />
                        </span>
                        <div>
                          <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Cab Category</p>
                          <p className="mt-1 text-sm font-semibold text-slate-700">
                            {booking.selection?.cabType || 'Cab not assigned'}
                            {booking.selection?.carModel ? ` · ${booking.selection.carModel}` : ''}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-5 border-t border-slate-100/80 pt-5">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-[0.22em] text-slate-400">
                          {booking.status === 'PENDING' ? 'Estimated Fare' : 'Total Fare'}
                        </p>
                        <p className="mt-1 text-3xl font-black tracking-tight text-[#1E1B4B]">{formatFare(booking)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {!loading && filtered.length === 0 && (
          <div className="mt-8 overflow-hidden rounded-[28px] bg-[linear-gradient(135deg,#eef2ff_0%,#f6f8ff_48%,#ffffff_100%)] p-8 text-center shadow-[0_18px_50px_rgba(30,27,75,0.08)]">
            <div className="mx-auto flex h-28 w-28 items-center justify-center rounded-full bg-white text-indigo-300 shadow-[0_18px_40px_rgba(83,130,255,0.14)]">
              <EmptyStateIcon />
            </div>
            <h2 className="mt-6 text-2xl font-bold tracking-tight text-[#1E1B4B]">
              {activeTab === 'present' ? 'No bookings yet today' : activeTab === 'planned' ? 'No upcoming journeys yet' : 'No past trips found'}
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-slate-500">
              {activeTab === 'present'
                ? "It looks like you haven't scheduled any trips for today. Why not plan a quick getaway or book your commute now?"
                : activeTab === 'planned'
                  ? 'Your next intercity journey will show up here once booked. Start planning a smooth ride now.'
                  : 'Your completed and cancelled rides will appear here once you have travel history with Safar Express.'}
            </p>
            <Link
              to="/"
              className="mt-6 inline-flex items-center justify-center gap-2 rounded-2xl bg-[#5382ff] px-5 py-3 font-semibold text-white shadow-[0_16px_40px_rgba(83,130,255,0.24)] transition-all duration-200 hover:scale-[1.02] hover:bg-[#3d72ff]"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v14m-7-7h14" />
              </svg>
              Book a Ride
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
