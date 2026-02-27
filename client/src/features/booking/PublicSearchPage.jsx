import React, { useEffect, useMemo, useState } from 'react';
import { MapPin, Flag, CalendarDays, Clock, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { searchTrips, createPublicBooking, createBooking } from '../../shared/api/endpoints';
import { Alert } from '../../shared/ui/Alert';
import { useAuth } from '../../shared/contexts/AuthContext';
import { getWarmState, warmBackend } from '../../shared/api/warmup';
import { useWarmup } from '../../shared/contexts/WarmupContext';

const TRIP_TYPES = ['ONE_WAY', 'ROUND_TRIP', 'AIRPORT', 'HOURLY'];

export function PublicSearchPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [formData, setFormData] = useState({
    tripType: TRIP_TYPES[0],
    pickup: { address: '' },
    dropoff: { address: '' },
    schedule: { pickupDate: '', pickupTime: '' },
  });
  const [results, setResults] = useState(null);
  const [bookingFormOpen, setBookingFormOpen] = useState(false);
  const [selection, setSelection] = useState({ route: '', cabType: '', carModel: '' });
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [selectedCab, setSelectedCab] = useState(null);
  const [contact, setContact] = useState({ name: '', email: '', phone: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const warmup = useWarmup();
  const [, setWarming] = useState(getWarmState().status);

  useEffect(() => {
    if (bookingFormOpen) {
      document.body.classList.add('modal-open');
    } else {
      document.body.classList.remove('modal-open');
    }
    return () => document.body.classList.remove('modal-open');
  }, [bookingFormOpen]);

  useEffect(() => {
    if (!isSubmitted) return;
    const timeout = setTimeout(() => {
      setBookingFormOpen(false);
      setIsSubmitted(false);
      navigate('/');
    }, 4000);
    return () => clearTimeout(timeout);
  }, [isSubmitted, navigate]);

  function handleSearchChange(e) {
    const { name, value } = e.target;
    if (name === 'pickup' || name === 'dropoff') {
      setFormData((prev) => ({ ...prev, [name]: { address: value } }));
      return;
    }
    setFormData((prev) => ({ ...prev, schedule: { ...prev.schedule, [name]: value } }));
  }

  async function handleSearch(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      if (warmup.status !== 'ready') {
        setWarming('warming');
        await warmBackend();
        setError('');
        setResults({ routes: [], cabs: [] });
        setBookingFormOpen(true);
        return;
      }
      const data = await searchTrips(formData);
      setResults(data);
      const routeLabel = `${formData.pickup.address} → ${formData.dropoff.address}`;
      const defaultCab = data.cabs?.[0] || null;
      setSelectedRoute({ label: routeLabel });
      setSelectedCab(defaultCab);
      setSelection((prev) => ({
        ...prev,
        route: routeLabel,
        cabType: defaultCab?.cabType || '',
        carModel: defaultCab?.carModel || '',
      }));
      setBookingFormOpen(true);
    } catch (err) {
      setError(err?.response?.data?.error?.detail || 'Search failed.');
    } finally {
      setLoading(false);
    }
  }

  const idempotencyKey = useMemo(() => {
    const raw = `${formData.pickup.address}-${formData.dropoff.address}-${formData.schedule.pickupDate}-${formData.schedule.pickupTime}-${formData.tripType}-${selection.route}-${selection.cabType}`;
    const base64 = btoa(unescape(encodeURIComponent(raw)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
    return base64.slice(0, 96);
  }, [formData, selection]);

  async function handleBookingSubmit(e) {
    e.preventDefault();
    const phoneValid = /^[0-9]{10}$/.test(contact.phone || '');
    if (!contact.name || !phoneValid) {
      setError('Please enter your name and a valid 10-digit WhatsApp number.');
      return;
    }
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      if (warmup.status !== 'ready') {
        setWarming('warming');
        await warmBackend();
        setError('');
        setResults({ routes: [], cabs: [] });
        setBookingFormOpen(true);
        return;
      }
      const safeSelection = selection.cabType
        ? selection
        : {
          ...selection,
          cabType: selectedCab?.cabType || results?.cabs?.[0]?.cabType || '',
          carModel: selectedCab?.carModel || results?.cabs?.[0]?.carModel || '',
        };

      const payload = {
        ...formData,
        selection: safeSelection,
        contact: isAuthenticated ? undefined : contact,
      };

      await (isAuthenticated
        ? await createBooking(payload, idempotencyKey)
        : await createPublicBooking(payload, idempotencyKey));

      setSuccess('Enquiry submitted.');
      setIsSubmitted(true);
    } catch (err) {
      console.error('Booking error:', err?.response?.data || err);
      setError(
        err?.response?.data?.error?.detail ||
        err?.response?.data?.message ||
        err?.message ||
        'Booking failed.'
      );
    } finally {
      setLoading(false);
    }
  }

  const showSkeleton = warmup.status !== 'ready' || loading;

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="text-center mt-8 mb-10">
        <h1 className="text-4xl md:text-6xl font-black text-slate-900 tracking-tighter leading-tight">
          Travel Smart.
          <span className="block text-transparent bg-clip-text bg-gradient-to-r from-slate-900 to-indigo-600">
            Travel in <span className="text-indigo-600">Style</span>.
          </span>
        </h1>
        <p className="text-lg text-slate-500 font-medium mt-3">Safarexpress Cab. Premium rides at your fingertips.</p>
      </div>

      <div className="glass-card bg-white/70 backdrop-blur-xl border border-white/40 shadow-2xl rounded-3xl overflow-hidden">
        <div className="flex border-b border-slate-100 bg-white/60 p-2 gap-2 overflow-x-auto">
          {TRIP_TYPES.map((tab) => (
            <button
              key={tab}
              onClick={() => setFormData((prev) => ({ ...prev, tripType: tab }))}
              className={`flex-1 py-3 px-4 text-center text-sm font-bold whitespace-nowrap rounded-xl transition-all duration-300 ${
                formData.tripType === tab ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:bg-white'
              }`}
            >
              {tab.replace('_', ' ')}
            </button>
          ))}
        </div>

        <form onSubmit={handleSearch} className="p-6 md:p-10 bg-white/70">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6 relative">
            <div className="relative">
              <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">From</label>
              <div className="relative">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-600" size={18} />
                <input
                  type="text"
                  name="pickup"
                  placeholder="Enter Pickup Location"
                  value={formData.pickup.address}
                  onChange={handleSearchChange}
                  className="w-full pl-11 pr-4 py-4 bg-white/80 border border-white/40 rounded-xl text-slate-700 font-medium appearance-none focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition"
                  required
                />
              </div>
            </div>
            <div className="relative">
              <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">To</label>
              <div className="relative">
                <Flag className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-600" size={18} />
                <input
                  type="text"
                  name="dropoff"
                  placeholder="Enter Drop Location"
                  value={formData.dropoff.address}
                  onChange={handleSearchChange}
                  className="w-full pl-11 pr-4 py-4 bg-white/80 border border-white/40 rounded-xl text-slate-700 font-medium appearance-none focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition"
                  required
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">Pick-Up Date</label>
              <div className="relative">
                <CalendarDays className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-600" size={18} />
                <input
                  type="date"
                  name="pickupDate"
                  value={formData.schedule.pickupDate}
                  onChange={handleSearchChange}
                  onClick={(e) => e.currentTarget.showPicker && e.currentTarget.showPicker()}
                  className="w-full pl-11 pr-4 py-4 bg-white/80 border border-white/40 rounded-xl text-slate-700 font-medium cursor-pointer hover:bg-slate-50 transition-colors focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">Pick-Up Time</label>
              <div className="relative">
                <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-600" size={18} />
                <input
                  type="time"
                  name="pickupTime"
                  value={formData.schedule.pickupTime}
                  onChange={handleSearchChange}
                  onClick={(e) => e.currentTarget.showPicker && e.currentTarget.showPicker()}
                  className="w-full pl-11 pr-4 py-4 bg-white/80 border border-white/40 rounded-xl text-slate-700 font-medium cursor-pointer hover:bg-slate-50 transition-colors focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500"
                  required
                />
              </div>
            </div>
            <button
              className="py-4 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 text-white font-bold text-lg shadow-lg hover:brightness-110 hover:shadow-indigo-500/30 transform hover:-translate-y-1 transition-all disabled:opacity-50"
              disabled={loading || warmup.status !== 'ready'}
            >
              {loading ? 'Searching...' : warmup.status !== 'ready' ? 'Connecting...' : 'Book Cab'}
            </button>
          </div>
        </form>
      </div>

      <div className="mt-4 space-y-2">
        <Alert type="error" message={error} />
        <Alert type="success" message={success} />
      </div>



      {bookingFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4 modal-backdrop">
          <div className="glass-card w-full max-w-2xl rounded-2xl shadow-2xl p-6 relative modal-panel">
            <button
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
              onClick={() => setBookingFormOpen(false)}
              aria-label="Close"
            >
              X
            </button>
            <h2 className="text-xl font-semibold mb-3">Passenger Details</h2>
            {isSubmitted ? (
              <div className="flex flex-col items-center justify-center p-10 text-center">
                <CheckCircle className="text-blue-600 animate-bounce mb-4" size={56} />
                <p className="text-2xl font-bold text-slate-900">Thank You!</p>
                <p className="text-slate-500 mt-2">We will connect with you shortly.</p>
              </div>
            ) : (
              <form onSubmit={handleBookingSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {showSkeleton && (
                <div className="md:col-span-2 space-y-3">
                  <div className="h-4 w-40 bg-slate-200/80 rounded-full animate-pulse"></div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {[...Array(4)].map((_, i) => (
                      <div key={`route-skel-${i}`} className="h-12 rounded-xl bg-slate-200/80 animate-pulse"></div>
                    ))}
                  </div>
                  <div className="h-4 w-32 bg-slate-200/80 rounded-full animate-pulse mt-4"></div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {[...Array(4)].map((_, i) => (
                      <div key={`cab-skel-${i}`} className="h-12 rounded-xl bg-slate-200/80 animate-pulse"></div>
                    ))}
                  </div>
                </div>
              )}
              {results && !showSkeleton && (
                <div className="md:col-span-2">
                  <div className="p-4 rounded-xl shadow-sm bg-white/70 border border-white/60">
                    <p className="text-xs uppercase tracking-widest text-slate-400 font-semibold">Trip Summary</p>
                    <div className="mt-2 space-y-1 text-sm text-slate-600">
                      <p><span className="font-semibold text-slate-800">From:</span> {formData.pickup.address || 'N/A'}</p>
                      <p><span className="font-semibold text-slate-800">To:</span> {formData.dropoff.address || 'N/A'}</p>
                      <p><span className="font-semibold text-slate-800">Route:</span> {selectedRoute?.label || 'N/A'}</p>
                    </div>
                  </div>
                </div>
              )}
              <>
                <input className="p-3 rounded-xl border" placeholder="Passenger Full Name" value={contact.name} onChange={(e) => setContact((prev) => ({ ...prev, name: e.target.value }))} required />
                <input className="p-3 rounded-xl border" placeholder="Email (optional)" type="email" value={contact.email} onChange={(e) => setContact((prev) => ({ ...prev, email: e.target.value }))} />
                <input className="p-3 rounded-xl border" placeholder="WhatsApp Number (for updates)" value={contact.phone} onChange={(e) => setContact((prev) => ({ ...prev, phone: e.target.value.replace(/\\D/g, '') }))} required />
              </>
              <button
                className="md:col-span-2 p-3 rounded-xl bg-indigo-600 text-white font-semibold"
                disabled={loading || showSkeleton || (!contact.name || !/^[0-9]{10}$/.test(contact.phone || ''))}
              >
                {loading ? 'Sending...' : 'Send Your Enquiry'}
              </button>
            </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

