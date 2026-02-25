import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../shared/contexts/AuthContext';
import { Alert } from '../../shared/ui/Alert';
import { getWarmState, warmBackend } from '../../shared/api/warmup';
import { useWarmup } from '../../shared/contexts/WarmupContext';

export function LoginPage() {
  const navigate = useNavigate();
  const { login, loading, error } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const warmup = useWarmup();
  const [, setWarming] = useState(getWarmState().status);

  async function handleSubmit(e) {
    e.preventDefault();
    if (warmup.status !== 'ready') {
      setWarming('warming');
      await warmBackend();
      return;
    }
    try {
      const session = await login(form);
      navigate(session.user.role === 'admin' ? '/admin' : '/bookings');
    } catch (err) {
      // handled in context
    }
  }

  return (
    <div className="max-w-md mx-auto mt-16 bg-white p-8 rounded-2xl shadow">
      <h1 className="text-2xl font-bold mb-4">Sign In</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input className="w-full p-3 rounded-lg border" placeholder="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
        <input className="w-full p-3 rounded-lg border" placeholder="Password" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
        <button className="w-full p-3 rounded-lg bg-blue-600 text-white font-semibold" disabled={loading}>{loading ? 'Signing in...' : 'Login'}</button>
      </form>
      <div className="mt-4">
        <Alert type="error" message={error} />
      </div>
      <p className="text-sm mt-4">Need an account? <Link className="text-blue-600" to="/register">Register</Link></p>
    </div>
  );
}
