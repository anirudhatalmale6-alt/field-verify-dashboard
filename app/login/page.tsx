'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('admin@fieldverify.com');
  const [password, setPassword] = useState('demo123');
  const [loading, setLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      router.push('/dashboard');
    }, 800);
  };

  return (
    <div className="min-h-screen flex">
      {/* Left — Branding Panel */}
      <div className="hidden lg:flex lg:w-[55%] bg-navy-900 relative overflow-hidden items-center justify-center">
        {/* Decorative circles */}
        <div className="absolute top-[-120px] right-[-80px] w-[400px] h-[400px] rounded-full bg-teal-600/10" />
        <div className="absolute bottom-[-60px] left-[-100px] w-[300px] h-[300px] rounded-full bg-teal-600/5" />
        <div className="absolute top-[40%] left-[15%] w-[180px] h-[180px] rounded-full border border-teal-600/20" />

        {/* Grid pattern */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px'
        }} />

        <div className="relative z-10 max-w-md px-12">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-xl bg-teal-600 flex items-center justify-center">
              <svg width="26" height="26" viewBox="0 0 20 20" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10 2L3 7v9a2 2 0 002 2h10a2 2 0 002-2V7l-7-5z" />
                <path d="M8 18V12h4v6" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-display font-bold text-white">FieldVerify</h1>
              <p className="text-xs text-teal-400 tracking-widest uppercase font-semibold">Pro Dashboard</p>
            </div>
          </div>

          <h2 className="text-3xl font-display font-bold text-white leading-tight mb-4">
            Streamline your field<br />verification workflow
          </h2>
          <p className="text-slate-400 text-sm leading-relaxed mb-8">
            GPS-tagged photo capture, real-time report tracking, automated PDF generation,
            and complete audit trails — all in one unified platform.
          </p>

          <div className="space-y-4">
            {[
              { label: 'GPS Photo Capture', desc: 'Auto-stamped location on every photo' },
              { label: 'Real-time Sync', desc: 'Instant field-to-office data flow' },
              { label: 'One-click PDF Reports', desc: 'Branded, professional output' },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-teal-600/20 flex items-center justify-center mt-0.5 flex-shrink-0">
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="#14b8a6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="2,6 5,9 10,3" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-white">{item.label}</p>
                  <p className="text-xs text-slate-500">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right — Login Form */}
      <div className="flex-1 flex items-center justify-center px-6 lg:px-16 bg-white">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-teal-600 flex items-center justify-center">
              <svg width="22" height="22" viewBox="0 0 20 20" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10 2L3 7v9a2 2 0 002 2h10a2 2 0 002-2V7l-7-5z" />
                <path d="M8 18V12h4v6" />
              </svg>
            </div>
            <h1 className="text-xl font-display font-bold text-navy-900">FieldVerify Pro</h1>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-display font-bold text-navy-900 mb-1">Welcome back</h2>
            <p className="text-sm text-slate-500">Sign in to access the verification dashboard</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                placeholder="admin@fieldverify.com"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                placeholder="Enter password"
              />
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-xs text-slate-500">
                <input type="checkbox" defaultChecked className="rounded border-slate-300 text-teal-600 focus:ring-teal-500" />
                Remember me
              </label>
              <button type="button" className="text-xs text-teal-600 hover:text-teal-700 font-medium">
                Forgot password?
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-xl transition-all text-sm flex items-center justify-center gap-2 disabled:opacity-70"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <circle cx="12" cy="12" r="10" strokeOpacity="0.3" />
                    <path d="M4 12a8 8 0 018-8" />
                  </svg>
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          <div className="mt-6 p-3 rounded-lg bg-slate-50 border border-slate-100">
            <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold mb-1">Demo Credentials</p>
            <p className="text-xs text-slate-600">
              <span className="font-medium">Email:</span> admin@fieldverify.com<br/>
              <span className="font-medium">Password:</span> demo123
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
