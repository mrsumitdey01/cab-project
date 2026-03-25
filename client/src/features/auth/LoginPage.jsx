import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../shared/contexts/AuthContext';
import { Alert } from '../../shared/ui/Alert';
import { getWarmState, warmBackend } from '../../shared/api/warmup';
import { useWarmup } from '../../shared/contexts/WarmupContext';
import { Mail, Lock, ArrowRight, ShieldCheck, Zap, Eye, EyeOff, BadgeCheck, Phone } from 'lucide-react';

export function LoginPage() {
  const navigate = useNavigate();
  const { login, loading, error } = useAuth();
  const [mode, setMode] = useState('phone'); // 'email' | 'phone'
  const [form, setForm] = useState({ identifier: '', password: '' });
  const warmup = useWarmup();
  const [, setWarming] = useState(getWarmState().status);
  const [forgotEmailSent, setForgotEmailSent] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [identifierError, setIdentifierError] = useState('');
  const brandingItems = useMemo(() => ([
    { icon: ShieldCheck, color: 'text-emerald-400', label: 'Bank-level security & encryption' },
    { icon: Zap, color: 'text-amber-400', label: 'Instant booking confirmations' },
    { icon: BadgeCheck, color: 'text-blue-300', label: 'Verified drivers on premium routes' },
  ]), []);

  function validateIdentifier() {
    const val = form.identifier.trim();
    if (!val) return 'Enter your email or phone number.';
    if (mode === 'email') {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) return 'Enter a valid email address.';
    } else {
      if (!/^(?:\+91|91)?\d{10}$/.test(val.replace(/[^+0-9]/g, ''))) return 'Enter a valid 10-digit phone number.';
    }
    return '';
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const err = validateIdentifier();
    if (err) { setIdentifierError(err); return; }

    if (warmup.status !== 'ready') {
      setWarming('warming');
      await warmBackend();
      return;
    }
    try {
      const identifier = mode === 'phone'
        ? form.identifier.trim().replace(/[^+0-9]/g, '')
        : form.identifier.trim();
      await login({ identifier, password: form.password });
      navigate('/');
    } catch (err) {
      // handled in context
    }
  }

  function handleForgotPassword(e) {
    e.preventDefault();
    if (form.identifier) {
      setForgotEmailSent(true);
      setTimeout(() => setForgotEmailSent(false), 4000);
    } else {
      alert("Please enter your email address first to reset your password.");
    }
  }

  function switchMode(newMode) {
    setMode(newMode);
    setForm({ identifier: '', password: form.password });
    setIdentifierError('');
  }

  const isPhone = mode === 'phone';
  const accentClasses = isPhone
    ? { text: 'group-focus-within:text-emerald-500', ring: 'focus:ring-emerald-500/20 focus:border-emerald-500' }
    : { text: 'group-focus-within:text-blue-500', ring: 'focus:ring-blue-500/20 focus:border-blue-500' };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col p-4 sm:p-6 lg:p-8 pt-28 lg:pt-32 relative overflow-hidden">

      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-400 rounded-full mix-blend-multiply filter blur-[128px] opacity-40 animate-blob" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-indigo-400 rounded-full mix-blend-multiply filter blur-[128px] opacity-40 animate-blob animation-delay-2000" />
      </div>

      <div className="m-auto max-w-6xl w-full bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row relative z-10 border border-slate-100 min-h-[600px]">

        {/* Left Side - Visual/Branding */}
        <div className="w-full md:w-5/12 bg-gradient-to-br from-slate-900 via-indigo-950 to-blue-900 p-10 flex flex-col justify-between relative overflow-hidden text-white">
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
            <h2 className="text-4xl font-bold leading-tight mb-6">Your Journey,<br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-300">Elevated.</span></h2>
            <p className="text-slate-300 text-lg leading-relaxed mb-8">
              Experience premium intercity travel with transparent pricing, verified drivers, and 24/7 dedicated support.
            </p>

            <div className="space-y-4">
              {brandingItems.map(({ icon: Icon, color, label }) => (
                <div key={label} className="flex items-center gap-3 text-sm text-slate-300 bg-white/5 p-3 rounded-xl border border-white/10 backdrop-blur-sm w-max transition-all duration-300 hover:bg-white/10 hover:-translate-y-0.5 hover:border-white/20">
                  <Icon className={`w-5 h-5 ${color} transition-transform duration-300 group-hover:scale-110`} />
                  <span>{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Side - Form */}
        <div className="w-full md:w-7/12 p-10 lg:p-16 flex flex-col justify-center bg-white relative">

          {forgotEmailSent && (
            <div className="absolute top-0 left-0 right-0 bg-emerald-50 text-emerald-700 px-6 py-4 text-sm font-medium border-b border-emerald-100 flex items-center justify-center gap-2 animate-in slide-in-from-top-4 duration-300">
              <ShieldCheck className="w-4 h-4" />
              Reset link sent! Please check your email.
            </div>
          )}

          <div className="max-w-md w-full mx-auto">
            <div className="mb-10 text-center md:text-left">
              <h1 className="text-3xl font-black text-slate-900 mb-2">Welcome Back</h1>
              <p className="text-slate-500 font-medium">Sign in with your email or phone number.</p>
            </div>

            {error && (
              <div className="mb-6 animate-shake-in">
                <Alert type="error" message={error} />
              </div>
            )}

            {/* Email / Phone Toggle */}
            <div className="segmented-control segmented-control-2 flex bg-slate-100 rounded-xl p-1 gap-1 mb-6" style={{ '--segment-active': mode === 'email' ? 0 : 1 }}>
              <button
                type="button"
                onClick={() => switchMode('email')}
                className={`segmented-option flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${mode === 'email' ? 'text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
              >
                <Mail className="w-4 h-4" />
                Email
              </button>
              <button
                type="button"
                onClick={() => switchMode('phone')}
                className={`segmented-option flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${mode === 'phone' ? 'text-emerald-600' : 'text-slate-500 hover:text-slate-700'}`}
              >
                <Phone className="w-4 h-4" />
                Phone
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">

              <div className="space-y-1.5 animate-slide-up-fade" style={{ animationDelay: '60ms' }}>
                <label className="text-sm font-bold text-slate-700 block">
                  {isPhone ? 'Phone Number' : 'Email Address'}
                </label>
                <div className="relative group">
                  <div className={`absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 transition-colors ${accentClasses.text}`}>
                    {isPhone ? <Phone className="h-5 w-5" /> : <Mail className="h-5 w-5" />}
                  </div>
                  <input
                    className={`block w-full pl-11 pr-4 py-3.5 bg-slate-50 border rounded-xl text-slate-900 placeholder:text-slate-400 focus:ring-2 transition-all outline-none font-medium focus-ring-consistent input-tonal ${identifierError ? `border-rose-400 focus:border-rose-500 focus:ring-rose-500/20` : `border-slate-200 ${accentClasses.ring}`}`}
                    placeholder={isPhone ? 'Enter your phone number' : 'Enter your email'}
                    type={isPhone ? 'tel' : 'email'}
                    value={form.identifier}
                    onChange={(e) => {
                      const val = isPhone ? e.target.value.replace(/[^+0-9]/g, '') : e.target.value;
                      setForm({ ...form, identifier: val });
                      if (identifierError) setIdentifierError('');
                    }}
                    onBlur={() => {
                      if (form.identifier.trim()) {
                        const err = validateIdentifier();
                        if (err) setIdentifierError(err);
                      }
                    }}
                    required
                  />
                </div>
                {identifierError && <p className="text-xs text-rose-500 font-medium">{identifierError}</p>}
              </div>

              <div className="space-y-1.5 animate-slide-up-fade" style={{ animationDelay: '140ms' }}>
                <div className="flex items-center justify-between">
                  <label className="text-sm font-bold text-slate-700 block">Password</label>
                  {mode === 'email' && (
                    <button
                      type="button"
                      onClick={handleForgotPassword}
                      className="text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors">
                    <Lock className="h-5 w-5" />
                  </div>
                  <input
                    className="block w-full pl-11 pr-12 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none font-medium focus-ring-consistent input-tonal"
                    placeholder="Enter your password"
                    type={showPassword ? 'text' : 'password'}
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    required
                  />
                  <button type="button" onClick={() => setShowPassword((prev) => !prev)} className="absolute inset-y-0 right-0 px-4 text-slate-400 hover:text-slate-700 transition-colors" aria-label={showPassword ? 'Hide password' : 'Show password'}>
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 py-4 px-4 border border-transparent rounded-xl text-base font-bold text-white btn-premium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-70 disabled:cursor-not-allowed group relative overflow-hidden"
                disabled={loading || !!identifierError}
              >
                <span className="relative z-10 flex items-center gap-2">
                  {loading ? 'Authenticating...' : 'Sign In'}
                  {!loading && <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />}
                </span>
                <div className="absolute inset-0 h-full w-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full ease-out duration-1000"></div>
              </button>

            </form>

            <div className="mt-10 text-center text-sm">
              <span className="text-slate-500">Don't have an account? </span>
              <Link to="/register" className="font-bold text-blue-600 hover:text-blue-700 transition-colors">
                Create an account
              </Link>
            </div>

          </div>

          {/* Footer legal links */}
          <div className="text-center mt-6 text-xs text-slate-400 space-x-3">
            <Link to="/privacy" className="hover:text-slate-600 transition-colors">Privacy Policy</Link>
            <span>·</span>
            <Link to="/terms" className="hover:text-slate-600 transition-colors">Terms of Service</Link>
            <span>·</span>
            <a href="mailto:support@safarexpress.in" className="hover:text-slate-600 transition-colors">Support</a>
          </div>
        </div>
      </div>
    </div>
  );
}
