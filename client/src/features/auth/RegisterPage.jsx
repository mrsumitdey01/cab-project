import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../shared/contexts/AuthContext';
import { Alert } from '../../shared/ui/Alert';

export function RegisterPage() {
  const navigate = useNavigate();
  const { register, loading, error } = useAuth();
  const [form, setForm] = useState({ name: '', email: '', password: '' });

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      await register(form);
      navigate('/bookings');
    } catch (err) {
      // handled in context
    }
  }

  return (
    <div className="max-w-md mx-auto mt-16 bg-white p-8 rounded-2xl shadow">
      <h1 className="text-2xl font-bold mb-4">Create Account</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input className="w-full p-3 rounded-lg border" placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        <input className="w-full p-3 rounded-lg border" placeholder="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
        <input className="w-full p-3 rounded-lg border" placeholder="Password" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} minLength={8} required />
        <button className="w-full p-3 rounded-lg bg-blue-600 text-white font-semibold" disabled={loading}>{loading ? 'Creating...' : 'Register'}</button>
      </form>
      <div className="mt-4">
        <Alert type="error" message={error} />
      </div>
      <p className="text-sm mt-4">Already have an account? <Link className="text-blue-600" to="/login">Login</Link></p>
    </div>
  );
}