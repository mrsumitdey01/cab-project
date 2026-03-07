import React, { useEffect, useRef, useState } from 'react';
import { CalendarDays, Clock, ShieldCheck, Headphones, BadgeCheck, Sparkles, LocateFixed } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { searchTrips, createPublicBooking, createBooking } from '../../shared/api/endpoints';
import { Alert } from '../../shared/ui/Alert';
import { useAuth } from '../../shared/contexts/AuthContext';
import { getWarmState, warmBackend } from '../../shared/api/warmup';
import { useWarmup } from '../../shared/contexts/WarmupContext';
import { AutocompleteDropdown } from '../../components/AutocompleteDropdown';

const TRIP_TYPES = ['ONE_WAY', 'ROUND_TRIP', 'HOURLY'];

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
  const [selection, setSelection] = useState({ route: '', cabType: '', carModel: '', multiplier: 1, fromHub: '', toHub: '' });
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [fromQuery, setFromQuery] = useState('');
  const [toQuery, setToQuery] = useState('');
  const [selectedCab, setSelectedCab] = useState(null);
  const [selectedFrom, setSelectedFrom] = useState(null);
  const [selectedTo, setSelectedTo] = useState(null);
  const [contact, setContact] = useState({ name: '', email: '', phone: '' });
  const [emailError, setEmailError] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  /** Parse backend validation errors into a human-readable string */
  function parseApiError(err) {
    const data = err?.response?.data;
    // Backend returns { error: { details: [{field, message}] } } on validation failure
    const details = data?.error?.details;
    if (Array.isArray(details) && details.length > 0) {
      return details
        .map((d) => {
          const field = d.field ? `${d.field}: ` : '';
          return `${field}${d.message || d.msg || JSON.stringify(d)}`;
        })
        .join(' • ');
    }
    return (
      data?.error?.detail ||
      data?.error?.message ||
      data?.message ||
      err?.message ||
      null
    );
  }
  const warmup = useWarmup();
  const [, setWarming] = useState(getWarmState().status);
  const contactBarRef = useRef(null);
  const [showFloatingWhatsApp, setShowFloatingWhatsApp] = useState(false);

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
    function handleScroll() {
      if (!contactBarRef.current) return;
      const trigger = contactBarRef.current.offsetTop + contactBarRef.current.offsetHeight;
      setShowFloatingWhatsApp(window.scrollY > trigger);
    }
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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
    setFormData((prev) => ({ ...prev, schedule: { ...prev.schedule, [name]: value } }));
  }

  function handlePopularRoute(route) {
    const fromLoc = { id: `popular-from-${route.pickup}`, name: route.pickup, hub: route.pickup, keywords: [] };
    const toLoc = { id: `popular-to-${route.dropoff}`, name: route.dropoff, hub: route.dropoff, keywords: [] };
    setSelectedFrom(fromLoc);
    setSelectedTo(toLoc);
    setFromQuery(route.pickup);
    setToQuery(route.dropoff);
    setFormData((prev) => ({
      ...prev,
      pickup: { address: route.pickup },
      dropoff: { address: route.dropoff },
    }));
  }

  function handleSwapLocations() {
    setSelectedFrom((prev) => {
      setSelectedTo(prev);
      return selectedTo;
    });
    setFromQuery((prev) => {
      setToQuery(prev);
      return toQuery;
    });
    setFormData((prev) => ({
      ...prev,
      pickup: prev.dropoff,
      dropoff: prev.pickup,
    }));
  }

  async function handleSearch(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const nextFrom = selectedFrom || (fromQuery.trim() ? { id: `custom-from-${fromQuery}`, name: fromQuery.trim(), hub: fromQuery.trim(), keywords: [] } : null);
      const nextTo = selectedTo || (toQuery.trim() ? { id: `custom-to-${toQuery}`, name: toQuery.trim(), hub: toQuery.trim(), keywords: [] } : null);

      // --- Client-side location length validation ---
      const MIN_LOC_LEN = 3;
      const fromName = nextFrom?.name || '';
      const toName = nextTo?.name || '';
      const badFields = [];
      if (!fromName || fromName.length < MIN_LOC_LEN) badFields.push(`"From" location (must be at least ${MIN_LOC_LEN} characters)`);
      if (!toName || toName.length < MIN_LOC_LEN) badFields.push(`"To" location (must be at least ${MIN_LOC_LEN} characters)`);
      if (badFields.length > 0) {
        setError(`Please fix the following: ${badFields.join(', ')}.`);
        setLoading(false);
        return;
      }
      if (nextFrom) {
        setSelectedFrom(nextFrom);
        setFormData((prev) => ({ ...prev, pickup: { address: nextFrom.name } }));
      }
      if (nextTo) {
        setSelectedTo(nextTo);
        setFormData((prev) => ({ ...prev, dropoff: { address: nextTo.name } }));
      }
      if (warmup.status !== 'ready') {
        setWarming('warming');
        await warmBackend();
        setError('');
        setResults({ routes: [], cabs: [] });
        setBookingFormOpen(true);
        return;
      }
      const data = await searchTrips({
        ...formData,
        pickup: { address: nextFrom?.name || fromQuery.trim() },
        dropoff: { address: nextTo?.name || toQuery.trim() },
      });
      setResults(data);
      const routeLabel = `${nextFrom?.name || formData.pickup.address} → ${nextTo?.name || formData.dropoff.address}`;
      const defaultCab = data.cabs?.[0] || null;
      setSelectedRoute({ label: routeLabel });
      setSelectedCab(defaultCab);
      setSelection((prev) => ({
        ...prev,
        route: routeLabel,
        fromHub: nextFrom?.hub || nextFrom?.name || '',
        toHub: nextTo?.hub || nextTo?.name || '',
        cabType: defaultCab?.cabType || '',
        carModel: defaultCab?.carModel || '',
        multiplier: defaultCab?.multiplier || 1,
      }));
      setBookingFormOpen(true);
    } catch (err) {
      setError(parseApiError(err) || 'Search failed.');
    } finally {
      setLoading(false);
    }
  }

  function buildIdempotencyKey() {
    const context = `${formData.tripType}-${selection.cabType || 'NA'}-${Date.now()}`.replace(/[^a-zA-Z0-9-]/g, '');
    const randomId = crypto.randomUUID();
    return `${randomId}-${context}`.slice(0, 120);
  }

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
      const pickupAddress = selectedFrom?.name || fromQuery.trim() || formData.pickup.address;
      const dropoffAddress = selectedTo?.name || toQuery.trim() || formData.dropoff.address;
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
          multiplier: selectedCab?.multiplier || results?.cabs?.[0]?.multiplier || 1,
        };

      const contactPayload = {
        name: contact.name,
        phone: contact.phone,
      };
      if (contact.email && contact.email.trim()) {
        contactPayload.email = contact.email.trim();
      }

      const payload = {
        ...formData,
        pickup: { address: pickupAddress },
        dropoff: { address: dropoffAddress },
        selection: safeSelection,
        contact: contactPayload,
      };

      const requestIdempotencyKey = buildIdempotencyKey();
      await (isAuthenticated
        ? await createBooking(payload, requestIdempotencyKey)
        : await createPublicBooking(payload, requestIdempotencyKey));

      setSuccess('Enquiry submitted.');
      setIsSubmitted(true);
    } catch (err) {
      console.error('Booking error:', err?.response?.data || err);
      setError(parseApiError(err) || 'Booking failed.');
    } finally {
      setLoading(false);
    }
  }

  const showSkeleton = warmup.status !== 'ready' || loading;


  return (
    <div className="w-full pb-10">
      <div className="hero-premium-bg pt-20 pb-32 px-6 rounded-b-[3rem] shadow-2xl relative mb-[-80px] z-0">
        <div className="max-w-6xl mx-auto relative z-10">
          <div className="text-center mt-2 mb-10">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white text-sm font-medium mb-6 animate-float">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Premium intercity rides now live
            </div>
            <h1 className="text-5xl md:text-7xl font-black text-white tracking-tighter leading-tight drop-shadow-lg">
              Travel Smart.
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-indigo-300">
                Travel in <span className="text-white">Style</span>.
              </span>
            </h1>
            <p className="text-lg text-slate-300 font-medium mt-6 max-w-2xl mx-auto drop-shadow-md">
              Safarexpress Cab. Reliable, comfortable, and premium rides at your fingertips. Book your journey today.
            </p>
          </div>

          <div ref={contactBarRef} className="w-full flex flex-col sm:flex-row items-center justify-center gap-4 mb-16 relative z-10">
            <span className="text-sm font-semibold text-slate-200 bg-black/30 backdrop-blur-md py-1.5 px-4 rounded-full shadow-sm border border-white/10">
              ⚡ Reach out to us instantly:
            </span>

            <div className="flex gap-3">
              <button
                type="button"
                className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-6 py-2.5 rounded-full font-semibold shadow-[0_6px_18px_rgba(16,185,129,0.35)] hover:shadow-[0_8px_22px_rgba(16,185,129,0.45)] sweep-hover transition-all duration-200"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
                WhatsApp
              </button>

              <button
                type="button"
                className="flex items-center gap-2 bg-gradient-to-r from-blue-500 via-indigo-500 to-blue-600 text-white px-6 py-2.5 rounded-full font-semibold shadow-[0_6px_18px_rgba(59,130,246,0.35)] hover:shadow-[0_8px_22px_rgba(59,130,246,0.45)] sweep-hover transition-all duration-200"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                Call Us
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 relative z-10 mb-8">
        <div className="glass-card bg-white/80 backdrop-blur-2xl border border-white/60 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.15)] rounded-3xl overflow-hidden">
          <div className="px-6 pt-6">
            <div className="flex bg-slate-200/60 rounded-full p-1.5 gap-1 sm:gap-2 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              {TRIP_TYPES.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setFormData((prev) => ({ ...prev, tripType: tab }))}
                  className={`flex-1 py-2.5 px-2 sm:px-4 text-center text-xs sm:text-sm whitespace-nowrap rounded-full transition-all duration-300 ${formData.tripType === tab ? 'bg-white text-blue-600 font-bold shadow-md' : 'text-slate-600 font-semibold hover:text-slate-900'
                    }`}
                >
                  {tab.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleSearch} className="p-6 md:p-10 bg-white/70">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6 relative">
              <div className="bg-slate-50 hover:bg-slate-100/50 border border-slate-200 rounded-2xl p-4 transition-all duration-200 focus-within:bg-white focus-within:border-blue-400 focus-within:ring-4 focus-within:ring-blue-500/10">
                <AutocompleteDropdown
                  label="From"
                  placeholder="Enter Pickup Location"
                  value={selectedFrom}
                  onQueryChange={(q) => {
                    setFromQuery(q);
                    // If user is typing a new value, clear the stale selection
                    // so the next search uses the fresh typed text, not the old pick.
                    if (selectedFrom && selectedFrom.name !== q) {
                      setSelectedFrom(null);
                    }
                  }}
                  onChange={(loc) => {
                    const withHub = loc ? { ...loc, hub: loc.hub || loc.name || '' } : null;
                    setSelectedFrom(withHub);
                    setFormData((prev) => ({ ...prev, pickup: { address: loc?.name || '' } }));
                  }}
                />
              </div>
              <div className="bg-slate-50 hover:bg-slate-100/50 border border-slate-200 rounded-2xl p-4 transition-all duration-200 focus-within:bg-white focus-within:border-blue-400 focus-within:ring-4 focus-within:ring-blue-500/10">
                <AutocompleteDropdown
                  label="To"
                  placeholder="Enter Drop Location"
                  value={selectedTo}
                  showPopular
                  onQueryChange={(q) => {
                    setToQuery(q);
                    if (selectedTo && selectedTo.name !== q) {
                      setSelectedTo(null);
                    }
                  }}
                  onChange={(loc) => {
                    const withHub = loc ? { ...loc, hub: loc.hub || loc.name || '' } : null;
                    setSelectedTo(withHub);
                    setFormData((prev) => ({ ...prev, dropoff: { address: loc?.name || '' } }));
                  }}
                />
              </div>
              <button
                type="button"
                onClick={handleSwapLocations}
                className="hidden md:flex items-center justify-center absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white p-2 rounded-full z-20 shadow-[0_8px_20px_rgba(0,0,0,0.12)] border border-slate-100 hover:scale-110 transition-transform cursor-pointer"
                aria-label="Swap locations"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#334155" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 3l4 4-4 4" />
                  <path d="M20 7H9" />
                  <path d="M8 21l-4-4 4-4" />
                  <path d="M4 17h11" />
                </svg>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
              <div className="bg-slate-50 hover:bg-slate-100/50 border border-slate-200 rounded-2xl p-4 transition-all duration-200 focus-within:bg-white focus-within:border-blue-400 focus-within:ring-4 focus-within:ring-blue-500/10">
                <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">Pick-Up Date</label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-blue-50 text-blue-600">
                    <CalendarDays size={16} />
                  </div>
                  <input
                    type="date"
                    name="pickupDate"
                    value={formData.schedule.pickupDate}
                    onChange={handleSearchChange}
                    onClick={(e) => e.currentTarget.showPicker && e.currentTarget.showPicker()}
                    className="w-full pl-14 pr-4 py-4 bg-transparent text-slate-700 font-medium placeholder:text-slate-400 cursor-pointer hover:bg-transparent transition-colors focus:outline-none"
                    required
                  />
                </div>
              </div>
              <div className="bg-slate-50 hover:bg-slate-100/50 border border-slate-200 rounded-2xl p-4 transition-all duration-200 focus-within:bg-white focus-within:border-blue-400 focus-within:ring-4 focus-within:ring-blue-500/10">
                <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">Pick-Up Time</label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-blue-50 text-blue-600">
                    <Clock size={16} />
                  </div>
                  <input
                    type="time"
                    name="pickupTime"
                    value={formData.schedule.pickupTime}
                    onChange={handleSearchChange}
                    onClick={(e) => e.currentTarget.showPicker && e.currentTarget.showPicker()}
                    className="w-full pl-14 pr-4 py-4 bg-transparent text-slate-700 font-medium placeholder:text-slate-400 cursor-pointer hover:bg-transparent transition-colors focus:outline-none"
                    required
                  />
                </div>
              </div>
              <div className="flex flex-col justify-center h-full">
                <button
                  className="w-full py-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-lg shadow-[0_8px_20px_-6px_rgba(59,130,246,0.6)] hover:shadow-[0_12px_25px_-6px_rgba(59,130,246,0.7)] sweep-hover transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2"
                  disabled={loading || warmup.status !== 'ready'}
                >
                  {loading ? 'Searching...' : warmup.status !== 'ready' ? 'Find Best Rides...' : 'Book Cab'}
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      <div className="mt-4 space-y-2">
        <Alert type="error" message={error} />
        <Alert type="success" message={success} />
      </div>

      <div className="max-w-6xl mx-auto px-6 mt-16 pb-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
          <div className="bg-white border text-center border-slate-100 rounded-2xl p-6 shadow-sm feature-card-hover group">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-5 icon-box group-hover:text-indigo-600">
              <ShieldCheck size={28} />
            </div>
            <h3 className="font-semibold text-slate-900 group-hover:text-indigo-900 transition-colors">Transparent Pricing</h3>
            <p className="text-sm text-slate-500 mt-2">No hidden fees. Clear fare breakdown on every route.</p>
          </div>
          <div className="bg-white border text-center border-slate-100 rounded-2xl p-6 shadow-sm feature-card-hover group">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-5 icon-box group-hover:text-indigo-600">
              <Headphones size={28} />
            </div>
            <h3 className="font-semibold text-slate-900 group-hover:text-indigo-900 transition-colors">24/7 Support</h3>
            <p className="text-sm text-slate-500 mt-2">Dedicated team for quick updates and live assistance.</p>
          </div>
          <div className="bg-white border text-center border-slate-100 rounded-2xl p-6 shadow-sm feature-card-hover group">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-5 icon-box group-hover:text-indigo-600">
              <BadgeCheck size={28} />
            </div>
            <h3 className="font-semibold text-slate-900 group-hover:text-indigo-900 transition-colors">Verified Drivers</h3>
            <p className="text-sm text-slate-500 mt-2">Background-checked professionals for your safety.</p>
          </div>
          <div className="bg-white border text-center border-slate-100 rounded-2xl p-6 shadow-sm feature-card-hover group">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-5 icon-box group-hover:text-indigo-600">
              <Sparkles size={28} />
            </div>
            <h3 className="font-semibold text-slate-900 group-hover:text-indigo-900 transition-colors">Sanitized Cabs</h3>
            <p className="text-sm text-slate-500 mt-2">Clean, fresh rides for every journey.</p>
          </div>
          <div className="bg-white border text-center border-slate-100 rounded-2xl p-6 shadow-sm feature-card-hover group">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-5 icon-box group-hover:text-indigo-600">
              <LocateFixed size={28} />
            </div>
            <h3 className="font-semibold text-slate-900 group-hover:text-indigo-900 transition-colors">GPS Tracking</h3>
            <p className="text-sm text-slate-500 mt-2">Live tracking for total peace of mind.</p>
          </div>
        </div>

        <div className="mt-16">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-slate-900">Popular Routes</h2>
            <span className="text-sm font-medium text-slate-500 px-3 py-1 bg-slate-100 rounded-full">Tap to pre-fill</span>
          </div>
          <div className="flex overflow-x-auto gap-4 pb-6 pt-2 snap-x scrollbar-hide [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {popularRoutes.map((route) => (
              <button
                key={route.label}
                type="button"
                onClick={() => handlePopularRoute(route)}
                className="group min-w-[240px] text-left border border-slate-200 bg-white rounded-2xl p-5 hover:border-blue-400 focus:ring-4 focus:ring-blue-100 feature-card-hover transition-all duration-300 cursor-pointer"
              >
                <div className="flex items-center justify-between mb-2">
                  <p className="font-bold text-slate-800 text-lg">{route.label}</p>
                  <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                    <span className="text-slate-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all">→</span>
                  </div>
                </div>
                <p className="text-sm text-slate-500">One tap to book faster</p>
              </button>
            ))}
          </div>
        </div>
      </div>

      <a
        href="https://wa.me/919999999999"
        target="_blank"
        rel="noreferrer"
        className={`fixed bottom-6 right-6 z-50 group transition-all duration-300 ${showFloatingWhatsApp ? 'opacity-100 scale-100' : 'opacity-0 scale-90 pointer-events-none'
          }`}
        aria-label="Chat on WhatsApp"
      >
        <span className="absolute inset-0 rounded-full bg-emerald-400/40 blur-lg opacity-70 animate-pulse"></span>
        <span className="absolute inset-0 rounded-full bg-emerald-400/30 animate-ping"></span>
        <span className="relative inline-flex items-center gap-2 px-4 py-3 rounded-full bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-xl hover:brightness-110 transition">
          <svg className="w-5 h-5" viewBox="0 0 32 32" fill="currentColor" aria-hidden="true">
            <path d="M16.002 3C9.384 3 4 8.384 4 15c0 2.36.69 4.56 1.87 6.41L4 28l6.78-1.78A12.93 12.93 0 0 0 16 27c6.616 0 12-5.384 12-12S22.616 3 16.002 3zm0 21.75c-2.2 0-4.27-.65-6.03-1.88l-.43-.25-4.02 1.06 1.07-3.91-.27-.41A9.72 9.72 0 0 1 6.25 15c0-5.38 4.37-9.75 9.75-9.75S25.75 9.62 25.75 15 21.38 24.75 16 24.75zm5.4-7.08c-.3-.15-1.77-.87-2.04-.97-.28-.1-.48-.15-.68.15-.2.3-.78.97-.96 1.17-.18.2-.36.22-.66.07-.3-.15-1.26-.46-2.4-1.47-.88-.78-1.48-1.75-1.66-2.05-.18-.3-.02-.46.13-.61.13-.13.3-.36.45-.54.15-.18.2-.3.3-.5.1-.2.05-.38-.03-.53-.08-.15-.68-1.64-.93-2.25-.24-.58-.49-.5-.68-.51-.17-.01-.37-.01-.57-.01-.2 0-.53.07-.8.38-.27.3-1.05 1.03-1.05 2.5s1.07 2.9 1.22 3.1c.15.2 2.1 3.21 5.08 4.5.71.31 1.26.5 1.69.64.71.23 1.36.2 1.87.12.57-.09 1.77-.72 2.02-1.42.25-.7.25-1.3.17-1.42-.08-.12-.28-.2-.58-.35z" />
          </svg>
          <span className="text-sm font-semibold hidden sm:inline">WhatsApp</span>
        </span>
      </a>



      {bookingFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-slate-900/40 backdrop-blur-sm transition-all duration-300">
          <div className="w-full max-w-xl bg-white/95 backdrop-blur-2xl border border-white/40 shadow-[0_0_50px_-12px_rgba(0,0,0,0.25)] rounded-[2rem] p-8 relative overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500"></div>

            <button
              className="absolute top-6 right-6 w-9 h-9 flex items-center justify-center rounded-full bg-slate-100/80 text-slate-500 hover:text-slate-800 hover:bg-slate-200 transition-all focus:outline-none"
              onClick={() => setBookingFormOpen(false)}
              aria-label="Close"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>

            {isSubmitted ? (
              <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
                <svg className="mb-6 w-24 h-24 drop-shadow-md" viewBox="0 0 72 72" fill="none" aria-hidden="true">
                  <circle className="tick-circle" cx="36" cy="36" r="30" stroke="#3b82f6" strokeWidth="5" />
                  <path className="tick-check" d="M22 37L32 47L50 29" stroke="#3b82f6" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <h3 className="text-3xl font-black text-slate-800 mb-2 tracking-tight">Booking Confirmed!</h3>
                <p className="text-slate-500 font-medium max-w-sm mx-auto">We've received your request. We will connect with you shortly to finalize details.</p>
                <button
                  onClick={() => setBookingFormOpen(false)}
                  className="mt-8 px-8 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-bold transition-colors w-full sm:w-auto"
                >
                  Close Window
                </button>
              </div>
            ) : (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                <div className="mb-6">
                  <h2 className="text-2xl font-black text-slate-800 tracking-tight">Passenger Details</h2>
                  <p className="text-sm text-slate-500 font-medium mt-1">Provide your details to confirm your ride.</p>
                </div>

                <form onSubmit={handleBookingSubmit} className="space-y-6">
                  {showSkeleton && (
                    <div className="space-y-4">
                      <div className="h-4 w-40 bg-slate-200 rounded-full animate-pulse"></div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {[...Array(4)].map((_, i) => (
                          <div key={`route-skel-${i}`} className="h-14 rounded-2xl bg-slate-200 animate-pulse"></div>
                        ))}
                      </div>
                    </div>
                  )}
                  {results && !showSkeleton && (
                    <div className="p-5 rounded-2xl bg-slate-50/80 border border-slate-100">
                      <div className="flex items-center gap-2 mb-4">
                        <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        <p className="text-xs uppercase tracking-widest text-slate-500 font-bold">Trip Summary</p>
                      </div>
                      <div className="space-y-2 mb-4">
                        <div className="flex items-start gap-3">
                          <div className="w-5 flex justify-center mt-1"><div className="w-2.5 h-2.5 rounded-full border-2 border-emerald-500 bg-white"></div></div>
                          <p className="text-sm font-semibold text-slate-800">{formData.pickup.address || 'N/A'}</p>
                        </div>
                        <div className="flex items-start gap-3">
                          <div className="w-5 flex justify-center py-1"><div className="w-0.5 h-3 bg-slate-200"></div></div>
                          <div className="text-sm font-semibold text-slate-400">Route: {selectedRoute?.label || 'N/A'}</div>
                        </div>
                        <div className="flex items-start gap-3">
                          <div className="w-5 flex justify-center mt-1"><div className="w-2.5 h-2.5 rounded-full bg-rose-500"></div></div>
                          <p className="text-sm font-semibold text-slate-800">{formData.dropoff.address || 'N/A'}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Full Name</label>
                      <input
                        className="w-full bg-white border border-slate-200 hover:border-blue-300 text-slate-800 rounded-xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium placeholder:text-slate-400 shadow-sm"
                        placeholder="John Doe"
                        value={contact.name}
                        onChange={(e) => setContact((prev) => ({ ...prev, name: e.target.value }))}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Email Address <span className="opacity-60">(Optional)</span></label>
                      <input
                        className={`w-full bg-white border ${emailError ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/20' : 'border-slate-200 hover:border-blue-300 focus:border-blue-500 focus:ring-blue-500/20'} text-slate-800 rounded-xl px-4 py-3.5 focus:outline-none focus:ring-2 transition-all font-medium placeholder:text-slate-400 shadow-sm`}
                        placeholder="john@example.com"
                        type="email"
                        value={contact.email}
                        onChange={(e) => { setContact((prev) => ({ ...prev, email: e.target.value })); if (emailError) setEmailError(''); }}
                        onBlur={(e) => {
                          const val = e.target.value.trim();
                          if (val && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) {
                            setEmailError('Please enter a valid email address (e.g. john@example.com)');
                          } else {
                            setEmailError('');
                          }
                        }}
                      />
                      {emailError && (
                        <p className="text-xs text-rose-500 font-medium mt-1.5 ml-1 flex items-center gap-1">
                          <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" /></svg>
                          {emailError}
                        </p>
                      )}
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">WhatsApp Number</label>
                      <div className="relative">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-500">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                        </div>
                        <input
                          className="w-full bg-white border border-slate-200 hover:border-emerald-300 text-slate-800 rounded-xl pl-11 pr-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium placeholder:text-slate-400 shadow-sm"
                          placeholder="+91 9999999999"
                          value={contact.phone}
                          onChange={(e) => setContact((prev) => ({ ...prev, phone: e.target.value.replace(/[^+0-9]/g, '') }))}
                          required
                        />
                      </div>
                      <p className="text-xs text-slate-500 ml-1 mt-1.5 font-medium">We'll send booking updates and driver details here.</p>
                    </div>
                  </div>

                  <button
                    className="w-full flex items-center justify-center gap-2 py-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-lg shadow-[0_8px_20px_-6px_rgba(59,130,246,0.5)] hover:shadow-[0_12px_25px_-6px_rgba(59,130,246,0.6)] sweep-hover transition-all duration-300 disabled:opacity-60 disabled:shadow-none disabled:hover:shadow-none disabled:cursor-not-allowed"
                    disabled={loading || showSkeleton || emailError !== '' || (!contact.name || !/^(?:\+91|91)?\d{10}$/.test(contact.phone || ''))}
                  >
                    {loading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Processing Request...
                      </>
                    ) : 'Confirm Booking Enquiry'}
                    {loading ? null : (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
                    )}
                  </button>
                </form>
              </div>
            )}
          </div>
        </div >
      )
      }
    </div >
  );
}


