import React, { useEffect, useRef, useState } from 'react';
import { Link, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
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

function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [avatarOpen, setAvatarOpen] = useState(false);
  const location = useLocation();
  const headerRef = useRef(null);

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  useEffect(() => {
    setIsOpen(false);
    setAvatarOpen(false);
  }, [location.pathname]);

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

  const displayName = user?.name || user?.fullName || user?.email || '';
  const initials = displayName
    ? displayName
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('')
    : 'SE';

  return (
    <header ref={headerRef} className="bg-white/80 backdrop-blur-md shadow-sm border-b sticky top-0 z-50">
      <div className="max-w-6xl mx-auto p-4 flex items-center justify-between relative">
        <Link to="/" className="cursor-pointer">
          <SafarExpressLogo />
        </Link>
        <nav className="hidden md:flex items-center gap-6 text-sm">
          <Link to="/">Search</Link>
          {isAuthenticated && <Link to="/bookings">Bookings</Link>}
          {user?.role === 'admin' && <Link to="/admin">Admin</Link>}
          {!isAuthenticated && <Link to="/login">Login</Link>}
          {!isAuthenticated && <Link to="/register">Register</Link>}
          {isAuthenticated && (
            <div className="relative">
              <button
                type="button"
                onClick={() => setAvatarOpen((prev) => !prev)}
                className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 font-bold flex items-center justify-center cursor-pointer border border-blue-100"
                aria-label="User menu"
              >
                {initials || 'SE'}
              </button>
              {avatarOpen && (
                <div className="absolute right-0 mt-3 w-56 rounded-xl border border-slate-100 bg-white shadow-lg p-3 z-50">
                  <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Signed in</p>
                  <p className="text-sm text-slate-600 mt-1 break-all">{user?.email}</p>
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
          className="md:hidden p-2 text-slate-600 hover:bg-slate-50 rounded-md"
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
          <div className="absolute top-full left-0 w-full bg-white shadow-xl border-t border-slate-100 flex flex-col p-4 gap-4 md:hidden">
            <Link to="/" className="text-slate-600 hover:text-blue-600 font-medium px-2 py-1" onClick={() => setIsOpen(false)}>Search</Link>
            {isAuthenticated && <Link to="/bookings" className="text-slate-600 hover:text-blue-600 font-medium px-2 py-1" onClick={() => setIsOpen(false)}>Bookings</Link>}
            {user?.role === 'admin' && <Link to="/admin" className="text-slate-600 hover:text-blue-600 font-medium px-2 py-1" onClick={() => setIsOpen(false)}>Admin</Link>}
            {!isAuthenticated && <Link to="/login" className="text-slate-600 hover:text-blue-600 font-medium px-2 py-1" onClick={() => setIsOpen(false)}>Login</Link>}
            {!isAuthenticated && <Link to="/register" className="text-slate-600 hover:text-blue-600 font-medium px-2 py-1" onClick={() => setIsOpen(false)}>Register</Link>}
            {isAuthenticated && (
              <>
                <hr className="border-slate-100" />
                <span className="text-slate-400 text-sm px-2">{user?.email}</span>
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

  function handleCorporateSubmit(e) {
    e.preventDefault();
    if (isSubmittingCorporate) return;
    setIsSubmittingCorporate(true);
    setTimeout(() => {
      setIsSubmittingCorporate(false);
      setIsCorporateSuccess(true);
    }, 1500);
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
      <footer className="bg-slate-900 text-slate-400 py-12 mt-20 w-full">
        <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-10">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center">SE</div>
              <span className="text-white text-lg font-semibold">Safar Express</span>
            </div>
            <p className="text-sm text-slate-400 mt-3">Premium intercity cab experiences with trusted drivers and transparent pricing.</p>
          </div>
          <div className="grid grid-cols-2 gap-6 md:col-span-2">
            <div>
              <p className="text-sm font-semibold text-white mb-3">Quick Links</p>
              <ul className="space-y-2 text-sm">
                <li><Link className="hover:text-white transition-colors" to="/">Search</Link></li>
                <li><Link className="hover:text-white transition-colors" to="/bookings">Bookings</Link></li>
                <li><Link className="hover:text-white transition-colors" to="/admin">Admin</Link></li>
                <li>
                  <button
                    onClick={() => setIsCorporateModalOpen(true)}
                    className="text-slate-400 hover:text-white transition-colors"
                  >
                    Corporate Partnerships
                  </button>
                </li>
              </ul>
            </div>
            <div>
              <p className="text-sm font-semibold text-white mb-3">Legal</p>
              <ul className="space-y-2 text-sm">
                <li><Link className="hover:text-white transition-colors" to="/privacy">Privacy Policy</Link></li>
                <li><Link className="hover:text-white transition-colors" to="/terms">Terms of Service</Link></li>
              </ul>
            </div>
          </div>
        </div>
        <div className="max-w-6xl mx-auto px-6 border-t border-slate-800 pt-8 mt-8 text-sm text-slate-500">
          © 2026 Safar Express. All rights reserved.
        </div>
      </footer>
      {isCorporateModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden relative">
            <button
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
              onClick={handleCloseCorporateModal}
              aria-label="Close"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <div className="p-6 border-b border-slate-100">
              <h3 className="text-xl font-semibold text-slate-900">Partner with Safar Express</h3>
              <p className="text-sm text-slate-500 mt-1">Reliable corporate fleets and hotel transfers.</p>
            </div>
            {isCorporateSuccess ? (
              <div className="p-10 flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mb-4">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="text-xl font-semibold text-slate-900">Proposal Request Sent!</p>
                <p className="text-sm text-slate-500 mt-2">Our corporate team will contact you within 24 hours.</p>
              </div>
            ) : (
              <form className="p-6 space-y-4" onSubmit={handleCorporateSubmit}>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M3 21h18M5 21V7l7-4 7 4v14" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 21v-6h6v6" />
                    </svg>
                  </span>
                  <input
                    name="company"
                    value={corporateForm.company}
                    onChange={handleCorporateChange}
                    className="w-full p-3 pl-10 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Company / Hotel Name"
                    required
                  />
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M4 20a8 8 0 0116 0" />
                    </svg>
                  </span>
                  <input
                    name="contactName"
                    value={corporateForm.contactName}
                    onChange={handleCorporateChange}
                    className="w-full p-3 pl-10 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Contact Person"
                    required
                  />
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M3 8l9 6 9-6" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M21 8v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8" />
                    </svg>
                  </span>
                  <input
                    type="email"
                    name="email"
                    value={corporateForm.email}
                    onChange={handleCorporateChange}
                    className="w-full p-3 pl-10 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Official Email"
                    required
                  />
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </span>
                  <input
                    type="tel"
                    name="phone"
                    value={corporateForm.phone}
                    onChange={handleCorporateChange}
                    className="w-full p-3 pl-10 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Phone Number"
                    required
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <select
                    name="city"
                    value={corporateForm.city}
                    onChange={handleCorporateChange}
                    className="w-full p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                  <option>Delhi NCR</option>
                  <option>Mumbai</option>
                  <option>Bengaluru</option>
                  <option>Hyderabad</option>
                  <option>Other</option>
                  </select>
                  <select
                    name="rides"
                    value={corporateForm.rides}
                    onChange={handleCorporateChange}
                    className="w-full p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                  <option>10-50</option>
                  <option>50-200</option>
                  <option>200+</option>
                  </select>
                </div>
                <textarea
                  name="requirements"
                  value={corporateForm.requirements}
                  onChange={handleCorporateChange}
                  className="w-full p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows="4"
                  placeholder="Specific Requirements"
                />
                <button
                  type="submit"
                  disabled={isSubmittingCorporate}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold shadow-lg hover:brightness-110 transition flex items-center justify-center gap-2 disabled:opacity-70"
                >
                  {isSubmittingCorporate ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/60 border-t-white rounded-full animate-spin"></span>
                      Sending...
                    </>
                  ) : (
                    'Request a Proposal'
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
