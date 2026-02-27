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

export function BookingPage() {
  const [bookings, setBookings] = useState([]);
  const [activeTab, setActiveTab] = useState('present');
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

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

  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <p className="text-sm uppercase tracking-widest text-slate-400 font-semibold">Customer Dashboard</p>
          <h1 className="text-3xl font-bold text-slate-900">My Bookings</h1>
        </div>
        <div className="flex flex-wrap gap-3">
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
        </div>
      </div>
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
      <div className="space-y-3">
        {filtered.map((booking) => (
          <div key={booking._id} className="border rounded-2xl p-4 bg-white/80 shadow-sm hover:shadow-indigo-500/20 transition-shadow">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-semibold">{booking.pickup?.address} -> {booking.dropoff?.address}</p>
                <p className="text-sm text-slate-500">{booking.tripType} | {booking.status}</p>
                <p className="text-sm text-slate-500">Route: {booking.selection?.route || 'N/A'} | Cab: {booking.selection?.cabType || 'N/A'} | Model: {booking.selection?.carModel || 'N/A'}</p>
              </div>
              <p className="font-bold">₹{booking.fare?.totalAmount}</p>
            </div>
          </div>
        ))}
        {filtered.length === 0 && <p className="text-sm text-slate-500">No bookings in this tab.</p>}
      </div>
    </div>
  );
}
