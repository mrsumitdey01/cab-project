import React from 'react';
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

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  return (
    <header className="bg-white/80 backdrop-blur-md shadow-sm border-b sticky top-0 z-50">
      <div className="max-w-6xl mx-auto p-4 flex items-center justify-between">
        <Link to="/" className="cursor-pointer">
          <SafarExpressLogo />
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          <Link to="/">Search</Link>
          {isAuthenticated && <Link to="/bookings">Bookings</Link>}
          {user?.role === 'admin' && <Link to="/admin">Admin</Link>}
          {!isAuthenticated && <Link to="/login">Login</Link>}
          {!isAuthenticated && <Link to="/register">Register</Link>}
          {isAuthenticated && <span className="text-slate-500">{user?.email}</span>}
          {isAuthenticated && <button className="text-red-600" onClick={handleLogout}>Logout</button>}
        </nav>
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
