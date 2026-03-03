'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { logout, getCases } from '@/lib/api-client';

interface UserInfo {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  avatar: string;
  region: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<UserInfo | null>(null);
  const [stats, setStats] = useState({ total: 0, submitted: 0, approved: 0, rejected: 0, pending: 0 });
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('user');
      if (stored) setUser(JSON.parse(stored));
    } catch {}

    (async () => {
      try {
        const data = await getCases();
        const cases = data.cases || [];
        setStats({
          total: cases.length,
          submitted: cases.filter((c: { status: string }) => c.status === 'submitted').length,
          approved: cases.filter((c: { status: string }) => c.status === 'approved').length,
          rejected: cases.filter((c: { status: string }) => c.status === 'rejected').length,
          pending: cases.filter((c: { status: string }) => c.status === 'assigned' || c.status === 'in_progress').length,
        });
      } catch {}
    })();
  }, []);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
    } catch {}
    localStorage.removeItem('user');
    router.push('/login');
  };

  if (!user) return null;

  const initials = user.name.split(' ').map(n => n[0]).join('').toUpperCase();

  return (
    <div className="p-4 max-w-lg mx-auto">
      {/* Profile Card */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 mb-4">
        <div className="flex flex-col items-center text-center">
          <div className="w-20 h-20 rounded-2xl bg-navy-900 flex items-center justify-center text-2xl font-bold text-white mb-3">
            {user.avatar || initials}
          </div>
          <h2 className="text-lg font-display font-bold text-navy-900">{user.name}</h2>
          <p className="text-xs text-teal-600 font-semibold uppercase tracking-wider mt-0.5">Field Executive</p>
          {user.region && <p className="text-xs text-slate-500 mt-1">{user.region}</p>}
        </div>

        <div className="mt-5 space-y-3">
          <div className="flex items-center gap-3 text-sm">
            <div className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="4" width="20" height="16" rx="2" /><path d="M22 7l-10 7L2 7" />
              </svg>
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Email</p>
              <p className="text-slate-700">{user.email}</p>
            </div>
          </div>
          {user.phone && (
            <div className="flex items-center gap-3 text-sm">
              <div className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" />
                </svg>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Phone</p>
                <p className="text-slate-700">{user.phone}</p>
              </div>
            </div>
          )}
          <div className="flex items-center gap-3 text-sm">
            <div className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="9" /><rect x="14" y="3" width="7" height="5" /><rect x="14" y="12" width="7" height="9" /><rect x="3" y="16" width="7" height="5" />
              </svg>
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">ID</p>
              <p className="text-slate-700 font-mono text-xs">{user.id}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 mb-4">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">My Statistics</h3>
        <div className="grid grid-cols-2 gap-3">
          <StatBox label="Total Cases" value={stats.total} color="text-navy-900" />
          <StatBox label="Pending" value={stats.pending} color="text-amber-600" />
          <StatBox label="Submitted" value={stats.submitted} color="text-blue-600" />
          <StatBox label="Approved" value={stats.approved} color="text-emerald-600" />
        </div>
      </div>

      {/* Logout */}
      <button
        onClick={handleLogout}
        disabled={loggingOut}
        className="w-full bg-white rounded-2xl border border-red-100 shadow-sm p-4 flex items-center justify-center gap-2 text-red-600 font-semibold text-sm hover:bg-red-50 transition-colors disabled:opacity-50"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" /><polyline points="16,17 21,12 16,7" /><line x1="21" y1="12" x2="9" y2="12" />
        </svg>
        {loggingOut ? 'Logging out...' : 'Log Out'}
      </button>

      <p className="text-center text-[10px] text-slate-300 mt-6">Koteshwari Onfield Services Pvt. Ltd.</p>
    </div>
  );
}

function StatBox({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="text-center p-3 rounded-xl bg-slate-50">
      <p className={`text-xl font-bold ${color}`}>{value}</p>
      <p className="text-[9px] uppercase tracking-wider text-slate-400 font-semibold mt-0.5">{label}</p>
    </div>
  );
}
