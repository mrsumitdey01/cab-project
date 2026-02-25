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

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-4">My Bookings</h1>
      <div className="flex gap-2 mb-6">
        {tabs.map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-2 rounded-lg font-semibold ${activeTab === tab ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700'}`}>
            {tab.toUpperCase()}
          </button>
        ))}
      </div>
      <Alert type="error" message={error} />
      <div className="space-y-3">
        {grouped[activeTab].map((booking) => (
          <div key={booking._id} className="border rounded-lg p-3 bg-white shadow-sm">
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
        {grouped[activeTab].length === 0 && <p className="text-sm text-slate-500">No bookings in this tab.</p>}
      </div>
    </div>
  );
}
