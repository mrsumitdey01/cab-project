import React, { useEffect, useMemo, useState } from 'react';
import { MapPin, Flag, CalendarDays, Clock, ShieldCheck, Headphones, BadgeCheck, Sparkles, LocateFixed } from 'lucide-react';
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

  const popularRoutes = [
    { label: 'Delhi → Noida Express', pickup: 'Delhi', dropoff: 'Noida' },
    { label: 'Mumbai → Airport Shuttle', pickup: 'Mumbai', dropoff: 'Mumbai Airport' },
    { label: 'Bengaluru → Whitefield', pickup: 'Bengaluru', dropoff: 'Whitefield' },
    { label: 'Hyderabad → Gachibowli', pickup: 'Hyderabad', dropoff: 'Gachibowli' },
    { label: 'Gurgaon → IGI Airport', pickup: 'Gurgaon', dropoff: 'IGI Airport' },
  ];

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

  function handlePopularRoute(route) {
    setFormData((prev) => ({
      ...prev,
      pickup: { address: route.pickup },
      dropoff: { address: route.dropoff },
    }));
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
    const phoneValid = /^[+]?[0-9]{7,13}$/.test(contact.phone || '');
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

      <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white/70 border border-white/50 rounded-2xl p-5 shadow-sm">
          <ShieldCheck className="text-indigo-600 mb-3" />
          <h3 className="font-semibold text-slate-900">Transparent Pricing</h3>
          <p className="text-sm text-slate-500 mt-1">No hidden fees. Clear fare breakdown on every route.</p>
        </div>
        <div className="bg-white/70 border border-white/50 rounded-2xl p-5 shadow-sm">
          <Headphones className="text-indigo-600 mb-3" />
          <h3 className="font-semibold text-slate-900">24/7 Support</h3>
          <p className="text-sm text-slate-500 mt-1">Dedicated team for quick updates and live assistance.</p>
        </div>
        <div className="bg-white/70 border border-white/50 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <Sparkles className="text-indigo-600" />
            <LocateFixed className="text-indigo-600" />
            <BadgeCheck className="text-indigo-600" />
          </div>
          <h3 className="font-semibold text-slate-900">Safety & Trust</h3>
          <p className="text-sm text-slate-500 mt-1">Sanitized cabs, GPS tracking, and verified drivers.</p>
        </div>
      </div>

      <div className="mt-10">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl font-semibold text-slate-900">Popular Routes</h2>
          <span className="text-xs text-slate-500">Tap to pre-fill</span>
        </div>
        <div className="flex gap-4 overflow-x-auto pb-2">
          {popularRoutes.map((route) => (
            <button
              key={route.label}
              type="button"
              onClick={() => handlePopularRoute(route)}
              className="min-w-[220px] text-left bg-white/80 border border-white/60 rounded-2xl p-4 shadow-sm hover:shadow-indigo-500/20 transition-shadow"
            >
              <p className="font-semibold text-slate-800">{route.label}</p>
              <p className="text-xs text-slate-500 mt-1">One tap to book faster</p>
            </button>
          ))}
        </div>
      </div>

      <a
        href="https://wa.me/919999999999"
        target="_blank"
        rel="noreferrer"
        className="fixed bottom-6 right-6 z-50 bg-emerald-500 text-white p-4 rounded-full shadow-lg hover:brightness-110 transition animate-bounce"
        aria-label="Chat on WhatsApp"
      >
        <span className="sr-only">WhatsApp</span>
        <svg width="22" height="22" viewBox="0 0 32 32" fill="currentColor" aria-hidden="true">
          <path d="M19.11 17.44c-.27-.13-1.6-.79-1.85-.88-.25-.09-.43-.13-.61.13-.18.27-.7.88-.86 1.06-.16.18-.32.2-.59.07-.27-.13-1.14-.42-2.17-1.33-.8-.71-1.34-1.58-1.49-1.85-.16-.27-.02-.41.12-.54.12-.12.27-.32.41-.48.14-.16.18-.27.27-.45.09-.18.04-.34-.02-.48-.07-.13-.61-1.47-.84-2.01-.22-.53-.44-.46-.61-.47-.16-.02-.34-.02-.52-.02-.18 0-.48.07-.73.34-.25.27-.96.94-.96 2.3 0 1.36.98 2.67 1.12 2.85.14.18 1.93 2.95 4.68 4.13.65.28 1.16.45 1.56.57.66.21 1.26.18 1.74.11.53-.08 1.6-.65 1.83-1.28.23-.62.23-1.15.16-1.28-.07-.13-.25-.2-.52-.34zM16 6.24c-5.38 0-9.76 4.38-9.76 9.76 0 1.72.45 3.34 1.24 4.75L6.2 25.6l5.04-1.32c1.35.74 2.9 1.16 4.56 1.16 5.38 0 9.76-4.38 9.76-9.76S21.38 6.24 16 6.24zm0 17.7c-1.53 0-2.96-.44-4.17-1.19l-.3-.18-2.99.78.79-2.92-.19-.3c-.78-1.25-1.24-2.72-1.24-4.29 0-4.46 3.64-8.1 8.1-8.1s8.1 3.64 8.1 8.1-3.64 8.1-8.1 8.1z"/>
        </svg>
      </a>



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
                <svg className="mb-4" width="72" height="72" viewBox="0 0 72 72" fill="none" aria-hidden="true">
                  <circle className="tick-circle" cx="36" cy="36" r="30" stroke="#2563eb" strokeWidth="5" />
                  <path className="tick-check" d="M22 37L32 47L50 29" stroke="#2563eb" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
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
                <input
                  className="p-3 rounded-xl border"
                  placeholder="WhatsApp Number (for updates)"
                  value={contact.phone}
                  onChange={(e) => setContact((prev) => ({ ...prev, phone: e.target.value.replace(/[^+0-9]/g, '') }))}
                  required
                />
              </>
              <button
                className="md:col-span-2 p-3 rounded-xl bg-indigo-600 text-white font-semibold"
                disabled={loading || showSkeleton || (!contact.name || !/^[+]?[0-9]{7,13}$/.test(contact.phone || ''))}
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

