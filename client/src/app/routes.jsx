import React, { useState } from 'react';
import { Link, Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import { LoginPage } from '../features/auth/LoginPage';
import { RegisterPage } from '../features/auth/RegisterPage';
import { BookingPage } from '../features/booking/BookingPage';
import { PublicSearchPage } from '../features/booking/PublicSearchPage';
import { AdminPage } from '../features/admin/AdminPage';
import { ProtectedRoute } from '../shared/ui/ProtectedRoute';
import { useAuth } from '../shared/contexts/AuthContext';
import SafarExpressLogo from '../components/SafarExpressLogo';

function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  return (
    <header className="bg-white/80 backdrop-blur-md shadow-sm border-b sticky top-0 z-50">
      <div className="max-w-6xl mx-auto p-4 flex items-center justify-between relative">
        <Link to="/" className="cursor-pointer">
          <SafarExpressLogo />
        </Link>
        <nav className="hidden md:flex items-center gap-4 text-sm">
          <Link to="/">Search</Link>
          {isAuthenticated && <Link to="/bookings">Bookings</Link>}
          {user?.role === 'admin' && <Link to="/admin">Admin</Link>}
          {!isAuthenticated && <Link to="/login">Login</Link>}
          {!isAuthenticated && <Link to="/register">Register</Link>}
          {isAuthenticated && <span className="text-slate-500">{user?.email}</span>}
          {isAuthenticated && <button className="text-red-600" onClick={handleLogout}>Logout</button>}
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

  return (
    <div className="min-h-screen mesh-gradient text-slate-800 antialiased">
      <Navbar />
      <Routes>
        <Route path="/" element={<PublicSearchPage />} />
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
  );
}
