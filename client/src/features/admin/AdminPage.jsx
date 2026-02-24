import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  createAdminCab,
  createAdminRoute,
  getAdminCabs,
  getAdminRoutes,
  getAuditLogs,
  getBookingAlerts,
  getHealthSummary,
  updateBookingStatus,
} from '../../shared/api/endpoints';
import { Alert } from '../../shared/ui/Alert';

const tabs = ['present', 'planned', 'past'];

function classifyBooking(log) {
  const pickupDate = log?.metadata?.pickupDate ? new Date(log.metadata.pickupDate) : null;
  if (!pickupDate || Number.isNaN(pickupDate.getTime())) return 'planned';

  const now = new Date();
  const sameDay = pickupDate.toDateString() === now.toDateString();

  if (sameDay) return 'present';
  if (pickupDate > now) return 'planned';
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
  const [routeForm, setRouteForm] = useState({ label: '', etaMinutes: '', distanceKm: '', baseFare: '' });
  const [cabForm, setCabForm] = useState({ cabType: '', carModel: '', multiplier: '', availableFrom: '', availableTo: '' });

  const load = useCallback(async () => {
    try {
      const [healthData, auditData, alerts, routesData, cabsData] = await Promise.all([
        getHealthSummary(),
        getAuditLogs(1, 50),
        getBookingAlerts(since),
        getAdminRoutes(),
        getAdminCabs(),
      ]);
      setHealth(healthData);
      setLogs(auditData.logs);
      setAlertCount(alerts.count || 0);
      setRoutes(routesData);
      setCabs(cabsData);
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
      map[classifyBooking(log)].push(log);
    });
    return map;
  }, [logs]);

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-3xl font-bold">Admin Console</h1>
        <span className="text-sm font-semibold bg-red-100 text-red-700 px-3 py-1 rounded-full">{alertCount} new bookings</span>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow mb-6">
        <h2 className="text-xl font-semibold mb-2">Health Summary</h2>
        <pre className="text-xs bg-slate-100 p-3 rounded-lg overflow-auto">{JSON.stringify(health, null, 2)}</pre>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow mb-6">
        <h2 className="text-xl font-semibold mb-3">Route Setup</h2>
        <form onSubmit={handleCreateRoute} className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <input className="p-3 rounded-lg border" placeholder="Route Name" value={routeForm.label} onChange={(e) => setRouteForm((prev) => ({ ...prev, label: e.target.value }))} required />
          <input className="p-3 rounded-lg border" placeholder="ETA (min)" type="number" value={routeForm.etaMinutes} onChange={(e) => setRouteForm((prev) => ({ ...prev, etaMinutes: e.target.value }))} required />
          <input className="p-3 rounded-lg border" placeholder="Distance (km)" type="number" value={routeForm.distanceKm} onChange={(e) => setRouteForm((prev) => ({ ...prev, distanceKm: e.target.value }))} required />
          <input className="p-3 rounded-lg border" placeholder="Base Fare" type="number" value={routeForm.baseFare} onChange={(e) => setRouteForm((prev) => ({ ...prev, baseFare: e.target.value }))} required />
          <button className="md:col-span-4 p-3 rounded-lg bg-blue-600 text-white">Add Route</button>
        </form>
        <div className="mt-4 space-y-2">
          {routes.map((route) => (
            <div key={route._id} className="border rounded-lg p-3">
              <p className="font-semibold">{route.label}</p>
              <p className="text-sm text-slate-500">ETA {route.etaMinutes} min | {route.distanceKm} km | Base ${route.baseFare}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow mb-6">
        <h2 className="text-xl font-semibold mb-3">Cab Setup</h2>
        <form onSubmit={handleCreateCab} className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <input className="p-3 rounded-lg border" placeholder="Cab Type" value={cabForm.cabType} onChange={(e) => setCabForm((prev) => ({ ...prev, cabType: e.target.value }))} required />
          <input className="p-3 rounded-lg border" placeholder="Car Model" value={cabForm.carModel} onChange={(e) => setCabForm((prev) => ({ ...prev, carModel: e.target.value }))} required />
          <input className="p-3 rounded-lg border" placeholder="Multiplier" type="number" step="0.1" value={cabForm.multiplier} onChange={(e) => setCabForm((prev) => ({ ...prev, multiplier: e.target.value }))} required />
          <input className="p-3 rounded-lg border" type="date" value={cabForm.availableFrom} onChange={(e) => setCabForm((prev) => ({ ...prev, availableFrom: e.target.value }))} />
          <input className="p-3 rounded-lg border" type="date" value={cabForm.availableTo} onChange={(e) => setCabForm((prev) => ({ ...prev, availableTo: e.target.value }))} />
          <button className="md:col-span-4 p-3 rounded-lg bg-blue-600 text-white">Add Cab</button>
        </form>
        <div className="mt-4 space-y-2">
          {cabs.map((cab) => (
            <div key={cab._id} className="border rounded-lg p-3">
              <p className="font-semibold">{cab.cabType} - {cab.carModel}</p>
              <p className="text-sm text-slate-500">Multiplier {cab.multiplier} | {cab.availableFrom ? new Date(cab.availableFrom).toLocaleDateString() : 'Always'} - {cab.availableTo ? new Date(cab.availableTo).toLocaleDateString() : 'Always'}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow mb-6">
        <h2 className="text-xl font-semibold mb-3">Update Booking Status</h2>
        <form onSubmit={handleStatusUpdate} className="flex flex-col md:flex-row gap-3">
          <input className="flex-1 p-3 rounded-lg border" placeholder="Booking ID" value={bookingId} onChange={(e) => setBookingId(e.target.value)} required />
          <select className="p-3 rounded-lg border" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="CONFIRMED">CONFIRMED</option>
            <option value="CANCELLED">CANCELLED</option>
          </select>
          <button className="p-3 rounded-lg bg-blue-600 text-white">Update</button>
        </form>
        <div className="mt-3 space-y-2">
          <Alert type="error" message={error} />
          <Alert type="success" message={success} />
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow">
        <div className="flex gap-2 mb-4">
          {tabs.map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-2 rounded-lg font-semibold ${activeTab === tab ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700'}`}>
              {tab.toUpperCase()}
            </button>
          ))}
        </div>
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
