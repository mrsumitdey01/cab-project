import React, { useEffect, useMemo, useState } from 'react';
import { Alert } from '../../shared/ui/Alert';
import { listBookings } from '../../shared/api/endpoints';

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
  if (!pickupDateTime) return 'planned';

  const now = new Date();
  const sameDay = pickupDateTime.toDateString() === now.toDateString();
  if (sameDay) return 'present';
  if (pickupDateTime > now) return 'planned';
  return 'past';
}

function statusBadge(status) {
  const base = 'px-2.5 py-1 rounded-full text-xs font-semibold';
  if (status === 'CONFIRMED') return `${base} bg-emerald-100 text-emerald-700`;
  if (status === 'COMPLETED') return `${base} bg-indigo-100 text-indigo-700`;
  if (status === 'CANCELLED') return `${base} bg-rose-100 text-rose-700`;
  return `${base} bg-amber-100 text-amber-700`;
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

  useEffect(() => {
    loadBookings();
  }, []);

  const grouped = useMemo(() => {
    const map = { present: [], planned: [], past: [] };
    bookings.forEach((booking) => {
      map[classifyBooking(booking)].push(booking);
    });
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
      const header = [
        'Booking ID',
        'Status',
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
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <p className="text-sm uppercase tracking-widest text-slate-400 font-semibold">Customer Dashboard</p>
          <h1 className="text-3xl font-bold text-slate-900">My Bookings</h1>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="bg-white/70 border border-white/60 rounded-2xl px-4 py-2 shadow-sm">
            <p className="text-xs text-slate-400 uppercase tracking-widest">Total</p>
            <p className="text-lg font-bold">{stats.total}</p>
          </div>
          <div className="bg-white/70 border border-white/60 rounded-2xl px-4 py-2 shadow-sm">
            <p className="text-xs text-emerald-500 uppercase tracking-widest">Confirmed</p>
            <p className="text-lg font-bold">{stats.confirmed}</p>
          </div>
          <div className="bg-white/70 border border-white/60 rounded-2xl px-4 py-2 shadow-sm">
            <p className="text-xs text-indigo-500 uppercase tracking-widest">Completed</p>
            <p className="text-lg font-bold">{stats.completed}</p>
          </div>
          <div className="bg-white/70 border border-white/60 rounded-2xl px-4 py-2 shadow-sm">
            <p className="text-xs text-rose-500 uppercase tracking-widest">Cancelled</p>
            <p className="text-lg font-bold">{stats.cancelled}</p>
          </div>
          <button
            type="button"
            onClick={exportCsv}
            className="px-4 py-2 rounded-xl bg-white/80 border border-white/60 shadow-sm hover:shadow-indigo-500/20 transition-shadow"
          >
            {exporting ? 'Exporting…' : 'Export CSV'}
          </button>
        </div>
      </div>

      {nextRide && (
        <div className="mb-6 rounded-2xl bg-gradient-to-r from-indigo-600 to-blue-600 text-white p-5 shadow-lg">
          <p className="text-xs uppercase tracking-widest text-white/70">Next Ride</p>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mt-2">
            <div>
              <p className="text-lg font-semibold">{nextRide.pickup?.address} → {nextRide.dropoff?.address}</p>
              <p className="text-sm text-white/80">
                {nextRide.schedule?.pickupDate} {nextRide.schedule?.pickupTime || ''} · {nextRide.selection?.cabType || 'Cab'} {nextRide.selection?.carModel ? `(${nextRide.selection?.carModel})` : ''}
              </p>
            </div>
            <span className="px-3 py-1 rounded-full bg-white/20 text-sm font-semibold">{nextRide.status}</span>
          </div>
        </div>
      )}

      <div className="flex gap-2 mb-6">
        {tabs.map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-2 rounded-xl font-semibold ${activeTab === tab ? 'bg-indigo-600 text-white' : 'bg-white/70 text-slate-700 border border-white/70 shadow-sm'}`}>
            {tab.toUpperCase()}
          </button>
        ))}
      </div>
      <div className="flex flex-col md:flex-row gap-3 mb-6">
        <input
          className="w-full md:flex-1 p-3 rounded-xl bg-white/80 border border-white/60 shadow-sm focus:outline-none focus:ring-4 focus:ring-blue-500/10"
          placeholder="Search by route, cab, booking ID, or location"
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
      <Alert type="error" message={error} />
      <div className="space-y-4">
        {filtered.map((booking) => (
          <div key={booking._id} className="border rounded-2xl p-5 bg-white/85 shadow-sm hover:shadow-indigo-500/20 transition-shadow">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-slate-900">{booking.pickup?.address} → {booking.dropoff?.address}</p>
                  <span className={statusBadge(booking.status)}>{booking.status}</span>
                </div>
                <p className="text-sm text-slate-500">{booking.tripType} · {booking.schedule?.pickupDate} {booking.schedule?.pickupTime || ''}</p>
                <p className="text-sm text-slate-500">
                  Route: {booking.selection?.route || 'N/A'} · Cab: {booking.selection?.cabType || 'N/A'} · Model: {booking.selection?.carModel || 'N/A'}
                </p>
                <p className="text-xs text-slate-400">Booking ID: {booking._id}</p>
              </div>
              <div className="text-right">
                <p className="text-xs uppercase text-slate-400">Fare</p>
                <p className="text-2xl font-bold text-indigo-600">₹{booking.fare?.totalAmount ?? 0}</p>
              </div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && <p className="text-sm text-slate-500">No bookings in this tab.</p>}
      </div>
    </div>
  );
}
