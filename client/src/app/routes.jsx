import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, Navigate, NavLink, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { LoginPage } from '../features/auth/LoginPage';
import { RegisterPage } from '../features/auth/RegisterPage';
import { BookingPage } from '../features/booking/BookingPage';
import { PublicSearchPage } from '../features/booking/PublicSearchPage';
import { AdminPage } from '../features/admin/AdminPage';
import { PrivacyPolicyPage } from '../features/legal/PrivacyPolicyPage';
import { TermsOfServicePage } from '../features/legal/TermsOfServicePage';
import { ProtectedRoute } from '../shared/ui/ProtectedRoute';
import { useAuth } from '../shared/contexts/AuthContext';
import SafarExpressLogo from '../components/SafarExpressLogo';
import { createCorporateEnquiry } from '../shared/api/endpoints';

function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [avatarOpen, setAvatarOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const headerRef = useRef(null);
  const avatarButtonRef = useRef(null);
  const avatarMenuRef = useRef(null);

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  useEffect(() => {
    setIsOpen(false);
    setAvatarOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    function handleScroll() {
      setScrolled(window.scrollY > 20);
    }
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    function handleClickOutside(event) {
      if (headerRef.current && !headerRef.current.contains(event.target)) {
        setIsOpen(false);
        setAvatarOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!avatarOpen) return undefined;
    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        setAvatarOpen(false);
        avatarButtonRef.current?.focus();
      }
      if (event.key === 'Tab' && avatarMenuRef.current) {
        const focusable = avatarMenuRef.current.querySelectorAll('button, [href], [tabindex]:not([tabindex="-1"])');
        const items = Array.from(focusable);
        if (!items.length) return;
        const first = items[0];
        const last = items[items.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    const firstButton = avatarMenuRef.current?.querySelector('button');
    firstButton?.focus();
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [avatarOpen]);

  const displayName = user?.name || user?.fullName || user?.email || user?.phone || '';
  const initials = displayName
    ? displayName
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('')
    : 'SE';

  const isHome = location.pathname === '/';
  const navBgClass = isHome
    ? scrolled ? 'bg-white/80 backdrop-blur-xl shadow-ambient border-b border-slate-200/60' : 'bg-transparent border-transparent'
    : 'bg-white/80 backdrop-blur-xl shadow-ambient border-b border-slate-200/60';

  const linkClass = isHome && !scrolled ? 'text-white hover:text-blue-300' : 'text-slate-600 hover:text-blue-600';
  const menuIconColor = isHome && !scrolled && !isOpen ? 'text-white' : 'text-slate-600';
  const navItems = useMemo(() => ([
    { to: '/', label: 'Search', show: true },
    { to: '/bookings', label: 'Bookings', show: isAuthenticated },
    { to: '/admin', label: 'Admin', show: user?.role === 'admin' },
    { to: '/login', label: 'Login', show: !isAuthenticated },
    { to: '/register', label: 'Register', show: !isAuthenticated, cta: true },
  ].filter((item) => item.show)), [isAuthenticated, user?.role]);

  return (
    <header ref={headerRef} className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${navBgClass}`}>
      <div className="max-w-6xl mx-auto p-4 flex items-center justify-between relative">
        <Link to="/" className="cursor-pointer">
          <SafarExpressLogo light={isHome && !scrolled} />
        </Link>
        <nav className={`hidden md:flex items-center gap-6 text-sm font-medium transition-colors ${linkClass}`}>
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => item.cta
                ? `rounded-full px-4 py-2 text-white shadow-sm transition-all ${isActive ? 'btn-premium' : 'btn-premium hover:-translate-y-0.5'}`
                : `transition-colors drop-shadow-sm ${isActive ? 'font-semibold' : ''}`
              }
            >
              {item.label}
            </NavLink>
          ))}
          {isAuthenticated && (
            <div className="relative">
              <button
                type="button"
                onClick={() => setAvatarOpen((prev) => !prev)}
                ref={avatarButtonRef}
                className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 font-bold flex items-center justify-center cursor-pointer border border-blue-100 focus-ring-consistent"
                aria-label="User menu"
                aria-expanded={avatarOpen}
                aria-haspopup="menu"
              >
                {initials || 'SE'}
              </button>
              {avatarOpen && (
                <div ref={avatarMenuRef} className="absolute right-0 mt-3 w-56 rounded-xl border border-slate-100/60 bg-white shadow-ambient p-3 z-50 animate-slide-up-fade">
                  <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Signed in</p>
                  <p className="text-sm text-slate-800 mt-1 font-semibold break-all">{displayName}</p>
                  <p className="text-xs text-slate-500 mt-1 break-all">{user?.email || user?.phone}</p>
                  <div className="my-3 h-px bg-slate-100" />
                  <button
                    className="w-full text-left text-red-600 hover:bg-red-50 px-3 py-2 rounded-md font-medium transition-colors"
                    onClick={handleLogout}
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          )}
        </nav>

        <button
          className={`md:hidden p-2 rounded-md ${menuIconColor} hover:bg-white/10`}
          onClick={() => setIsOpen((prev) => !prev)}
          aria-label="Toggle menu"
        >
          {isOpen ? (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>

        {isOpen && (
          <div className="absolute top-full left-0 w-full bg-white/90 backdrop-blur-xl shadow-ambient border-t border-slate-100/60 flex flex-col p-4 gap-4 md:hidden animate-slide-up-fade">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) => `text-slate-700 hover:text-blue-600 font-medium px-2 py-2 rounded-xl transition-all ${isActive ? 'bg-white/70 shadow-sm text-blue-600' : 'hover:bg-white/50'}`}
                onClick={() => setIsOpen(false)}
              >
                {item.label}
              </NavLink>
            ))}
            {isAuthenticated && (
              <>
                <hr className="border-slate-100" />
                <span className="text-slate-700 text-sm px-2 font-semibold">{displayName}</span>
                <span className="text-slate-400 text-xs px-2">{user?.email || user?.phone}</span>
                <button
                  className="text-red-500 hover:bg-red-50 px-2 py-2 rounded-md text-left font-medium transition-colors"
                  onClick={() => {
                    setIsOpen(false);
                    handleLogout();
                  }}
                >
                  Logout
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </header>
  );
}

export function AppRoutes() {
  const { user, isAuthenticated } = useAuth();
  const [isCorporateModalOpen, setIsCorporateModalOpen] = useState(false);
  const [corporateForm, setCorporateForm] = useState({
    company: '',
    contactName: '',
    email: '',
    phone: '',
    city: 'Delhi NCR',
    rides: '10-50',
    requirements: '',
  });
  const [isSubmittingCorporate, setIsSubmittingCorporate] = useState(false);
  const [isCorporateSuccess, setIsCorporateSuccess] = useState(false);

  function handleCorporateChange(e) {
    const { name, value } = e.target;
    setCorporateForm((prev) => ({ ...prev, [name]: value }));
  }

  function handleCloseCorporateModal() {
    setIsCorporateModalOpen(false);
    setIsSubmittingCorporate(false);
    setIsCorporateSuccess(false);
  }

  async function handleCorporateSubmit(e) {
    e.preventDefault();
    if (isSubmittingCorporate) return;
    setIsSubmittingCorporate(true);
    try {
      await createCorporateEnquiry(corporateForm);
      setIsSubmittingCorporate(false);
      setIsCorporateSuccess(true);
      setCorporateForm({
        company: '',
        contactName: '',
        email: '',
        phone: '',
        city: 'Delhi NCR',
        rides: '10-50',
        requirements: '',
      });
      setTimeout(() => {
        setIsCorporateModalOpen(false);
        setIsCorporateSuccess(false);
      }, 4000);
    } catch (_err) {
      setIsSubmittingCorporate(false);
    }
  }

  return (
    <div className="min-h-screen mesh-gradient text-slate-800 antialiased flex flex-col">
      <Navbar />
      <div className="flex-1">
        <Routes>
          <Route path="/" element={<PublicSearchPage />} />
          <Route path="/privacy" element={<PrivacyPolicyPage />} />
          <Route path="/terms" element={<TermsOfServicePage />} />
          <Route path="/login" element={isAuthenticated ? <Navigate to={user?.role === 'admin' ? '/admin' : '/bookings'} replace /> : <LoginPage />} />
          <Route path="/register" element={isAuthenticated ? <Navigate to="/bookings" replace /> : <RegisterPage />} />
          <Route
            path="/bookings"
            element={
              <ProtectedRoute>
                <BookingPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute roles={['admin']}>
                <AdminPage />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
      <footer className="relative w-full mt-8 bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 text-slate-400 overflow-hidden">
        {/* top glow divider */}
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-blue-500/60 to-transparent" />
        <div className="absolute top-0 inset-x-0 h-10 bg-gradient-to-b from-blue-600/10 to-transparent pointer-events-none" />

        <div className="relative max-w-6xl mx-auto px-6 pt-14 pb-10">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10">

            {/* Brand column */}
            <div className="md:col-span-1 space-y-4">
              <SafarExpressLogo light />
              <p className="text-sm text-slate-400 leading-relaxed">
                Premium intercity cab experiences with trusted drivers and transparent pricing.
              </p>
              {/* Call button */}
              <a
                href="tel:+919999999999"
                className="inline-flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-300 hover:bg-blue-500/20 hover:border-blue-400 hover:text-white transition-all duration-200 text-sm font-semibold"
              >
                <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                Call Us · 9999999999
              </a>
            </div>

            {/* Quick Links */}
            <div>
              <p className="text-xs font-bold text-slate-300 uppercase tracking-widest mb-5">Quick Links</p>
              <ul className="space-y-3 text-sm">
                {[
                  { label: 'Search Rides', to: '/' },
                  { label: 'My Bookings', to: '/bookings' },
                ].map(({ label, to }) => (
                  <li key={to}>
                    <Link
                      to={to}
                      className="group flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors duration-200"
                    >
                      <svg className="w-3 h-3 text-blue-500 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                      </svg>
                      <span className="relative after:absolute after:bottom-0 after:left-0 after:h-px after:w-0 after:bg-white after:transition-all after:duration-200 group-hover:after:w-full">
                        {label}
                      </span>
                    </Link>
                  </li>
                ))}
                <li>
                  <button
                    onClick={() => setIsCorporateModalOpen(true)}
                    className="group flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors duration-200"
                  >
                    <svg className="w-3 h-3 text-blue-500 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                    </svg>
                    <span className="relative after:absolute after:bottom-0 after:left-0 after:h-px after:w-0 after:bg-white after:transition-all after:duration-200 group-hover:after:w-full">
                      Corporate Partnerships
                    </span>
                  </button>
                </li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <p className="text-xs font-bold text-slate-300 uppercase tracking-widest mb-5">Legal</p>
              <ul className="space-y-3 text-sm">
                {[
                  { label: 'Privacy Policy', to: '/privacy' },
                  { label: 'Terms of Service', to: '/terms' },
                ].map(({ label, to }) => (
                  <li key={to}>
                    <Link
                      to={to}
                      className="group flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors duration-200"
                    >
                      <svg className="w-3 h-3 text-blue-500 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                      </svg>
                      <span className="relative after:absolute after:bottom-0 after:left-0 after:h-px after:w-0 after:bg-white after:transition-all after:duration-200 group-hover:after:w-full">
                        {label}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Why Choose Us */}
            <div>
              <p className="text-xs font-bold text-slate-300 uppercase tracking-widest mb-5">Why Choose Us</p>
              <ul className="space-y-3 text-sm text-slate-400">
                {['Transparent flat-rate pricing', 'Verified & background-checked drivers', '24/7 live support', 'GPS-tracked every ride', 'Sanitized cabs'].map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <svg className="w-3.5 h-3.5 text-emerald-500 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Bottom legal bar */}
          <div className="mt-12 pt-6 border-t border-slate-800 flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-slate-500">
            <span>© {new Date().getFullYear()} Safar Express. All rights reserved.</span>
            <div className="flex gap-4">
              <Link to="/privacy" className="hover:text-slate-300 transition-colors">Privacy</Link>
              <Link to="/terms" className="hover:text-slate-300 transition-colors">Terms</Link>
            </div>
          </div>
        </div>
      </footer>

      {isCorporateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-slate-900/40 backdrop-blur-sm transition-all duration-300">
          <div className="w-full max-w-xl bg-white/95 backdrop-blur-2xl border border-white/40 shadow-[0_0_50px_-12px_rgba(0,0,0,0.25)] rounded-[2rem] p-8 relative overflow-hidden flex flex-col max-h-[90vh]">
            <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500"></div>

            <button
              className="absolute top-6 right-6 w-9 h-9 flex items-center justify-center rounded-full bg-slate-100/80 text-slate-500 hover:text-slate-800 hover:bg-slate-200 transition-all focus:outline-none z-10"
              onClick={handleCloseCorporateModal}
              aria-label="Close"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>

            {isCorporateSuccess ? (
              <div className="flex flex-col items-center justify-center py-12 px-6 text-center h-full">
                <svg className="mb-6 w-24 h-24 drop-shadow-md" viewBox="0 0 72 72" fill="none" aria-hidden="true">
                  <circle className="tick-circle" cx="36" cy="36" r="30" stroke="#3b82f6" strokeWidth="5" />
                  <path className="tick-check" d="M22 37L32 47L50 29" stroke="#3b82f6" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <h3 className="text-3xl font-black text-slate-800 mb-2 tracking-tight">Proposal Request Sent!</h3>
                <p className="text-slate-500 font-medium max-w-sm mx-auto">Our corporate team will contact you within 24 hours.</p>
                <button
                  onClick={handleCloseCorporateModal}
                  className="mt-8 px-8 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-bold transition-colors w-full sm:w-auto"
                >
                  Close Window
                </button>
              </div>
            ) : (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-300 flex flex-col h-full">
                <div className="mb-6 shrink-0">
                  <h2 className="text-2xl font-black text-slate-800 tracking-tight pr-8">Partner with Safar Express</h2>
                  <p className="text-sm text-slate-500 font-medium mt-1">Reliable corporate fleets and hotel transfers.</p>
                </div>

                <div className="overflow-y-auto pr-2 -mr-2 flex-1 pb-4">
                  <form className="space-y-4" onSubmit={handleCorporateSubmit}>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M3 21h18M5 21V7l7-4 7 4v14" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 21v-6h6v6" />
                        </svg>
                      </span>
                      <input
                        name="company"
                        value={corporateForm.company}
                        onChange={handleCorporateChange}
                        className="w-full bg-white border border-slate-200 hover:border-blue-300 text-slate-800 rounded-xl pl-12 pr-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium placeholder:text-slate-400 shadow-sm"
                        placeholder="Company / Hotel Name"
                        required
                      />
                    </div>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M4 20a8 8 0 0116 0" />
                        </svg>
                      </span>
                      <input
                        name="contactName"
                        value={corporateForm.contactName}
                        onChange={handleCorporateChange}
                        className="w-full bg-white border border-slate-200 hover:border-blue-300 text-slate-800 rounded-xl pl-12 pr-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium placeholder:text-slate-400 shadow-sm"
                        placeholder="Contact Person"
                        required
                      />
                    </div>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M3 8l9 6 9-6" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M21 8v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8" />
                        </svg>
                      </span>
                      <input
                        type="email"
                        name="email"
                        value={corporateForm.email}
                        onChange={handleCorporateChange}
                        className="w-full bg-white border border-slate-200 hover:border-blue-300 text-slate-800 rounded-xl pl-12 pr-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium placeholder:text-slate-400 shadow-sm"
                        placeholder="Official Email"
                        required
                      />
                    </div>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                      </span>
                      <input
                        type="tel"
                        name="phone"
                        value={corporateForm.phone}
                        onChange={handleCorporateChange}
                        className="w-full bg-white border border-slate-200 hover:border-blue-300 text-slate-800 rounded-xl pl-12 pr-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium placeholder:text-slate-400 shadow-sm"
                        placeholder="Phone Number"
                        required
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="relative">
                        <select
                          name="city"
                          value={corporateForm.city}
                          onChange={handleCorporateChange}
                          className="w-full bg-white border border-slate-200 hover:border-blue-300 text-slate-800 rounded-xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium shadow-sm appearance-none"
                        >
                          <option>Delhi NCR</option>
                          <option>Mumbai</option>
                          <option>Bengaluru</option>
                          <option>Hyderabad</option>
                          <option>Other</option>
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500">
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                        </div>
                      </div>
                      <div className="relative">
                        <select
                          name="rides"
                          value={corporateForm.rides}
                          onChange={handleCorporateChange}
                          className="w-full bg-white border border-slate-200 hover:border-blue-300 text-slate-800 rounded-xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium shadow-sm appearance-none"
                        >
                          <option value="10-50">10-50 People</option>
                          <option value="50-200">50-200 People</option>
                          <option value="200+">200+ People</option>
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500">
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                        </div>
                      </div>
                    </div>
                    <textarea
                      name="requirements"
                      value={corporateForm.requirements}
                      onChange={handleCorporateChange}
                      className="w-full bg-white border border-slate-200 hover:border-blue-300 text-slate-800 rounded-xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium placeholder:text-slate-400 shadow-sm resize-none"
                      rows="3"
                      placeholder="Specific Requirements"
                    />
                    <button
                      type="submit"
                      disabled={isSubmittingCorporate}
                      className="w-full flex items-center justify-center gap-2 py-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-lg shadow-[0_8px_20px_-6px_rgba(59,130,246,0.5)] hover:shadow-[0_12px_25px_-6px_rgba(59,130,246,0.6)] sweep-hover transition-all duration-300 disabled:opacity-60 disabled:shadow-none disabled:hover:shadow-none disabled:cursor-not-allowed mt-2 shrink-0"
                    >
                      {isSubmittingCorporate ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Sending...
                        </>
                      ) : (
                        'Request a Proposal'
                      )}
                    </button>
                  </form>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
