import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../shared/contexts/AuthContext';
import { Alert } from '../../shared/ui/Alert';
import { User, Mail, Lock, ArrowRight, Zap, Eye, EyeOff, ShieldCheck, BadgeCheck, Phone } from 'lucide-react';

export function RegisterPage() {
  const navigate = useNavigate();
  const { register, loading, error } = useAuth();
  const [mode, setMode] = useState('email'); // 'email' | 'phone'
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [identifierError, setIdentifierError] = useState('');
  const brandingItems = useMemo(() => ([
    { icon: User, color: 'text-blue-400', label: 'Save passenger profiles' },
    { icon: Zap, color: 'text-amber-400', label: '1-click booking history' },
    { icon: ShieldCheck, color: 'text-emerald-400', label: 'Secure account access across devices' },
    { icon: BadgeCheck, color: 'text-indigo-300', label: 'Priority access to premium cab classes' },
  ]), []);

  function validateIdentifier() {
    if (mode === 'email') {
      const val = form.email.trim();
      if (!val) return 'Enter your email address.';
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) return 'Enter a valid email address.';
    } else {
      const val = form.phone.trim().replace(/[^+0-9]/g, '');
      if (!val) return 'Enter your phone number.';
      if (!/^(?:\+91|91)?\d{10}$/.test(val)) return 'Enter a valid 10-digit phone number.';
    }
    return '';
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const err = validateIdentifier();
    if (err) { setIdentifierError(err); return; }

    try {
      const payload = { name: form.name, password: form.password };
      if (mode === 'email') {
        payload.email = form.email.trim();
      } else {
        payload.phone = form.phone.trim().replace(/[^+0-9]/g, '');
      }
      await register(payload);
      navigate('/');
    } catch (err) {
      // handled in context
    }
  }

  function switchMode(newMode) {
    setMode(newMode);
    setForm({ ...form, email: '', phone: '' });
    setIdentifierError('');
  }

  const isPhone = mode === 'phone';

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col p-4 sm:p-6 lg:p-8 pt-28 lg:pt-32 relative overflow-hidden">

      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-400 rounded-full mix-blend-multiply filter blur-[128px] opacity-40 animate-blob" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-indigo-400 rounded-full mix-blend-multiply filter blur-[128px] opacity-40 animate-blob animation-delay-2000" />
      </div>

      <div className="m-auto flex-row-reverse max-w-6xl w-full bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row relative z-10 border border-slate-100 min-h-[600px]">

        {/* Left (visually Right) Side - Branding */}
        <div className="w-full md:w-5/12 bg-gradient-to-br from-indigo-950 via-slate-900 to-blue-900 p-10 flex flex-col justify-between relative overflow-hidden text-white">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>

          <div className="relative z-10">
            <Link to="/" className="inline-flex items-center gap-2 group">
              <div className="w-10 h-10 bg-white/10 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/20 group-hover:bg-white/20 transition-all">
                <svg className="w-6 h-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <span className="text-2xl font-black tracking-tight text-white group-hover:text-blue-200 transition-colors">Safar Express</span>
            </Link>
          </div>

          <div className="relative z-10 mt-12 mb-8">
            <h2 className="text-4xl font-bold leading-tight mb-6">Join the <br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-300">Fast Lane.</span></h2>
            <p className="text-slate-300 text-lg leading-relaxed mb-8">
              Create an account to track your rides, earn loyalty rewards, and book your next journey in seconds.
            </p>

            <div className="space-y-4">
              {brandingItems.map(({ icon: Icon, color, label }) => (
                <div key={label} className="flex items-center gap-3 text-sm text-slate-300 bg-white/5 p-3 rounded-xl border border-white/10 backdrop-blur-sm w-max transition-all duration-300 hover:bg-white/10 hover:-translate-y-0.5 hover:border-white/20">
                  <Icon className={`w-5 h-5 ${color}`} />
                  <span>{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right (visually Left) Side - Form */}
        <div className="w-full md:w-7/12 p-10 lg:p-16 flex flex-col justify-center bg-white relative">

          <div className="max-w-md w-full mx-auto">
            <div className="mb-10 text-center md:text-left">
              <h1 className="text-3xl font-black text-slate-900 mb-2">Create Account</h1>
              <p className="text-slate-500 font-medium">Join us with your email or phone number.</p>
            </div>

            {error && (
              <div className="mb-6 animate-shake-in">
                <Alert type="error" message={error} />
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">

              <div className="space-y-1.5 animate-slide-up-fade" style={{ animationDelay: '60ms' }}>
                <label className="text-sm font-bold text-slate-700 block">Full Name</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors">
                    <User className="h-5 w-5" />
                  </div>
                  <input
                    className="block w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all outline-none font-medium text-base focus-ring-consistent"
                    placeholder="Enter your full name"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                  />
                </div>
              </div>

              {/* Email / Phone Toggle */}
              <div className="space-y-1.5 animate-slide-up-fade" style={{ animationDelay: '120ms' }}>
                <label className="text-sm font-bold text-slate-700 block">
                  {isPhone ? 'Phone Number' : 'Email Address'}
                </label>
                <div className="flex bg-slate-100 rounded-xl p-1 gap-1 mb-3">
                  <button
                    type="button"
                    onClick={() => switchMode('email')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold transition-all duration-200 ${mode === 'email' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    <Mail className="w-3.5 h-3.5" />
                    Email
                  </button>
                  <button
                    type="button"
                    onClick={() => switchMode('phone')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold transition-all duration-200 ${mode === 'phone' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    <Phone className="w-3.5 h-3.5" />
                    Phone
                  </button>
                </div>
                <div className="relative group">
                  <div className={`absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-${isPhone ? 'emerald' : 'blue'}-500 transition-colors`}>
                    {isPhone ? <Phone className="h-5 w-5" /> : <Mail className="h-5 w-5" />}
                  </div>
                  <input
                    className={`block w-full pl-11 pr-4 py-3.5 bg-slate-50 border rounded-xl text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:bg-white transition-all outline-none font-medium text-base focus-ring-consistent ${identifierError ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/20' : `border-slate-200 focus:ring-${isPhone ? 'emerald' : 'blue'}-500/20 focus:border-${isPhone ? 'emerald' : 'blue'}-500`}`}
                    placeholder={isPhone ? 'Enter your phone number' : 'Enter your email'}
                    type={isPhone ? 'tel' : 'email'}
                    value={isPhone ? form.phone : form.email}
                    onChange={(e) => {
                      const val = isPhone ? e.target.value.replace(/[^+0-9]/g, '') : e.target.value;
                      setForm({ ...form, [isPhone ? 'phone' : 'email']: val });
                      if (identifierError) setIdentifierError('');
                    }}
                    onBlur={() => {
                      const val = isPhone ? form.phone.trim() : form.email.trim();
                      if (val) {
                        const err = validateIdentifier();
                        if (err) setIdentifierError(err);
                      }
                    }}
                    required
                  />
                </div>
                {identifierError && <p className="text-xs text-rose-500 font-medium">{identifierError}</p>}
              </div>

              <div className="space-y-1.5 animate-slide-up-fade" style={{ animationDelay: '180ms' }}>
                <label className="text-sm font-bold text-slate-700 block">Password</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors">
                    <Lock className="h-5 w-5" />
                  </div>
                  <input
                    className="block w-full pl-11 pr-12 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all outline-none font-medium text-base focus-ring-consistent"
                    placeholder="Create a password (min. 8 chars)"
                    type={showPassword ? 'text' : 'password'}
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    minLength={8}
                    required
                  />
                  <button type="button" onClick={() => setShowPassword((prev) => !prev)} className="absolute inset-y-0 right-0 px-4 text-slate-400 hover:text-slate-700 transition-colors" aria-label={showPassword ? 'Hide password' : 'Show password'}>
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 py-4 px-4 border border-transparent rounded-xl shadow-sm text-base font-bold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all disabled:opacity-70 disabled:cursor-not-allowed group relative overflow-hidden mt-2"
                disabled={loading}
              >
                <span className="relative z-10 flex items-center gap-2">
                  {loading ? 'Creating Account...' : 'Create Account'}
                  {!loading && <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />}
                </span>
                <div className="absolute inset-0 h-full w-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full ease-out duration-1000"></div>
              </button>

            </form>

            <div className="mt-10 text-center text-sm">
              <span className="text-slate-500">Already have an account? </span>
              <Link to="/login" className="font-bold text-blue-600 hover:text-blue-700 transition-colors">
                Sign in here
              </Link>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
