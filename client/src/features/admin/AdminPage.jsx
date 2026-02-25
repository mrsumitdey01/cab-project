import React, { useCallback, useEffect, useMemo, useState } from 'react';
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

  const [routes, setRoutes] = useState([]);
  const [cabs, setCabs] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [routeForm, setRouteForm] = useState({ label: '', etaMinutes: '', distanceKm: '', baseFare: '' });
  const [cabForm, setCabForm] = useState({ cabType: '', carModel: '', multiplier: '', availableFrom: '', availableTo: '' });

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
    try {
      const booking = await updateBookingStatus(bookingId, status);
      setSuccess(`Updated booking ${booking._id} to ${booking.status}`);
      await load();
    } catch (err) {
      setError(err?.response?.data?.error?.detail || 'Status update failed.');
    }
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

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <p className="text-sm uppercase tracking-widest text-slate-400 font-semibold">Operations Center</p>
          <h1 className="text-3xl font-bold">Admin Console</h1>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold bg-amber-100 text-amber-800 px-3 py-1 rounded-full">{alertCount} new bookings</span>
          <span className="text-sm font-semibold bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full">{bookings.length} total bookings</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-2xl shadow">
          <p className="text-xs uppercase text-slate-400 font-semibold">Routes</p>
          <p className="text-2xl font-bold mt-2">{routes.length}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl shadow">
          <p className="text-xs uppercase text-slate-400 font-semibold">Cabs</p>
          <p className="text-2xl font-bold mt-2">{cabs.length}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl shadow">
          <p className="text-xs uppercase text-slate-400 font-semibold">Audit Logs</p>
          <p className="text-2xl font-bold mt-2">{logs.length}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl shadow">
          <p className="text-xs uppercase text-slate-400 font-semibold">System</p>
          <p className="text-2xl font-bold mt-2">{health?.status || 'OK'}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white p-6 rounded-2xl shadow">
          <h2 className="text-xl font-semibold mb-3">Route Setup</h2>
          <form onSubmit={handleCreateRoute} className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input className="p-3 rounded-lg border" placeholder="Route Name" value={routeForm.label} onChange={(e) => setRouteForm((prev) => ({ ...prev, label: e.target.value }))} required />
            <input className="p-3 rounded-lg border" placeholder="ETA (min)" type="number" value={routeForm.etaMinutes} onChange={(e) => setRouteForm((prev) => ({ ...prev, etaMinutes: e.target.value }))} required />
            <input className="p-3 rounded-lg border" placeholder="Distance (km)" type="number" value={routeForm.distanceKm} onChange={(e) => setRouteForm((prev) => ({ ...prev, distanceKm: e.target.value }))} required />
            <input className="p-3 rounded-lg border" placeholder="Base Fare" type="number" value={routeForm.baseFare} onChange={(e) => setRouteForm((prev) => ({ ...prev, baseFare: e.target.value }))} required />
            <button className="md:col-span-2 p-3 rounded-lg bg-blue-600 text-white">Add Route</button>
          </form>
          <div className="mt-4 space-y-2">
            {routes.map((route) => (
              <div key={route._id} className="border rounded-lg p-3">
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

        <div className="bg-white p-6 rounded-2xl shadow">
          <h2 className="text-xl font-semibold mb-3">Cab Setup</h2>
          <form onSubmit={handleCreateCab} className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input className="p-3 rounded-lg border" placeholder="Cab Type" value={cabForm.cabType} onChange={(e) => setCabForm((prev) => ({ ...prev, cabType: e.target.value }))} required />
            <input className="p-3 rounded-lg border" placeholder="Car Model" value={cabForm.carModel} onChange={(e) => setCabForm((prev) => ({ ...prev, carModel: e.target.value }))} required />
            <input className="p-3 rounded-lg border" placeholder="Multiplier" type="number" step="0.1" value={cabForm.multiplier} onChange={(e) => setCabForm((prev) => ({ ...prev, multiplier: e.target.value }))} required />
            <input className="p-3 rounded-lg border" type="date" value={cabForm.availableFrom} onChange={(e) => setCabForm((prev) => ({ ...prev, availableFrom: e.target.value }))} />
            <input className="p-3 rounded-lg border md:col-span-2" type="date" value={cabForm.availableTo} onChange={(e) => setCabForm((prev) => ({ ...prev, availableTo: e.target.value }))} />
            <button className="md:col-span-2 p-3 rounded-lg bg-blue-600 text-white">Add Cab</button>
          </form>
          <div className="mt-4 space-y-2">
            {cabs.map((cab) => (
              <div key={cab._id} className="border rounded-lg p-3">
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

      <div className="bg-white p-6 rounded-2xl shadow mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
          <h2 className="text-xl font-semibold">Bookings Overview</h2>
          <div className="flex gap-2">
            {tabs.map((tab) => (
              <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-2 rounded-lg font-semibold ${activeTab === tab ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700'}`}>
                {tab.toUpperCase()} ({groupedBookings[tab].length})
              </button>
            ))}
          </div>
        </div>
        <div className="space-y-3">
          {groupedBookings[activeTab].map((booking) => (
            <div key={booking._id} className="border rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold">{booking.pickup?.address} → {booking.dropoff?.address}</p>
                  <p className="text-sm text-slate-500">{booking.tripType} | {booking.status}</p>
                  <p className="text-sm text-slate-500">Route: {booking.selection?.route || 'N/A'} | Cab: {booking.selection?.cabType || 'N/A'} | Model: {booking.selection?.carModel || 'N/A'}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-semibold text-slate-500">Booking ID #{booking._id}</p>
                  <p className="font-bold">₹{booking.fare?.totalAmount}</p>
                  <p className="text-xs text-slate-500">{booking.schedule?.pickupDate} {booking.schedule?.pickupTime || ''}</p>
                </div>
              </div>
            </div>
          ))}
          {groupedBookings[activeTab].length === 0 && <p className="text-sm text-slate-500">No bookings in this tab.</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white p-6 rounded-2xl shadow">
          <h2 className="text-xl font-semibold mb-3">Update Booking Status</h2>
          <form onSubmit={handleStatusUpdate} className="flex flex-col md:flex-row gap-3">
            <input className="flex-1 p-3 rounded-lg border" placeholder="Booking ID" value={bookingId} onChange={(e) => setBookingId(e.target.value)} required />
          <select className="p-3 rounded-lg border" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="CONFIRMED">CONFIRMED</option>
            <option value="CANCELLED">CANCELLED</option>
            <option value="COMPLETED">COMPLETED</option>
          </select>
            <button className="p-3 rounded-lg bg-blue-600 text-white">Update</button>
          </form>
          <div className="mt-3 space-y-2">
            <Alert type="error" message={error} />
            <Alert type="success" message={success} />
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow">
          <h2 className="text-xl font-semibold mb-3">Health Summary</h2>
          <pre className="text-xs bg-slate-100 p-3 rounded-lg overflow-auto">{JSON.stringify(health, null, 2)}</pre>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow">
        <h2 className="text-xl font-semibold mb-3">Audit Logs</h2>
        <div className="space-y-2">
          {groupedLogs[activeTab].map((log) => (
            <div key={log._id} className="border rounded-lg p-3">
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
