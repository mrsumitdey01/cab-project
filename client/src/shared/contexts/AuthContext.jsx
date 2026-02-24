import React, { createContext, useContext, useMemo, useState } from 'react';
import { login as apiLogin, logout as apiLogout, register as apiRegister } from '../api/endpoints';
import { clearSessionTokens, getAccessToken, getRefreshToken, setSessionTokens } from '../api/http';

const AuthContext = createContext(null);

function decodeJwtPayload(token) {
  if (!token) return null;
  try {
    const payload = token.split('.')[1];
    return JSON.parse(atob(payload));
  } catch (err) {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const payload = decodeJwtPayload(getAccessToken());
    if (!payload) return null;
    return { id: payload.sub, role: payload.role, email: payload.email };
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isAuthenticated = Boolean(user && getAccessToken());

  async function login(input) {
    setLoading(true);
    setError('');
    try {
      const session = await apiLogin(input);
      setSessionTokens(session);
      setUser(session.user);
      return session;
    } catch (err) {
      setError(err?.response?.data?.error?.detail || 'Login failed.');
      throw err;
    } finally {
      setLoading(false);
    }
  }

  async function register(input) {
    setLoading(true);
    setError('');
    try {
      const session = await apiRegister(input);
      setSessionTokens(session);
      setUser(session.user);
      return session;
    } catch (err) {
      setError(err?.response?.data?.error?.detail || 'Registration failed.');
      throw err;
    } finally {
      setLoading(false);
    }
  }

  async function logout() {
    const refreshToken = getRefreshToken();
    await apiLogout(refreshToken);
    clearSessionTokens();
    setUser(null);
  }

  const value = useMemo(() => ({
    user,
    isAuthenticated,
    loading,
    error,
    login,
    register,
    logout,
  }), [user, isAuthenticated, loading, error]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}