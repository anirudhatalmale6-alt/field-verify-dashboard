'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { getDashboard } from '@/lib/api-client';

interface DashStats {
  totalCases: number;
  totalReports: number;
  pendingReview: number;
  approved: number;
  rejected: number;
  todayReports: number;
  avgTAT: number;
}

interface WeekDay {
  day: string;
  visits: number;
  approved: number;
  rejected: number;
}

interface Executive {
  id: string;
  name: string;
  avatar: string;
  region: string;
  total_visits: number;
  avg_tat: number | null;
}

interface RecentReport {
  id: string;
  customer_name: string;
  address: string;
  contact_number: string;
  location: string;
  status: string;
  submitted_at: string;
  case_id: string;
  purpose_of_loan: string;
  executive_name: string;
}

function getStatusColor(status: string): string {
  switch (status) {
    case 'pending': return 'bg-amber-100 text-amber-800 border-amber-200';
    case 'in_review': return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'verified': return 'bg-teal-100 text-teal-800 border-teal-200';
    case 'approved': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    case 'rejected': return 'bg-red-100 text-red-800 border-red-200';
    default: return 'bg-gray-100 text-gray-800 border-gray-200';
  }
}

function getStatusLabel(status: string): string {
  switch (status) {
    case 'pending': return 'Pending Review';
    case 'in_review': return 'In Review';
    case 'verified': return 'Submitted by Maker';
    case 'approved': return 'Submitted by Checker';
    case 'rejected': return 'Rejected';
    default: return status;
  }
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashStats | null>(null);
  const [weeklyData, setWeeklyData] = useState<WeekDay[]>([]);
  const [topExecs, setTopExecs] = useState<Executive[]>([]);
  const [recentReports, setRecentReports] = useState<RecentReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [misFrom, setMisFrom] = useState('');
  const [misTo, setMisTo] = useState('');
  const [archiveDate, setArchiveDate] = useState('');
  const [archiveStats, setArchiveStats] = useState<{ cases: number; reports: number; photos: number } | null>(null);
  const [archiveLoading, setArchiveLoading] = useState(false);
  const [purging, setPurging] = useState(false);
  const [purgeResult, setPurgeResult] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<{ id: string; customer_name: string; fir_no: string; executive_name: string; submitted_at: string }[]>([]);
  const [notifSound, setNotifSound] = useState(true);
  const lastCheckRef = useRef<string>('');
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const playBeep = useCallback(() => {
    if (!notifSound) return;
    try {
      if (!audioRef.current) {
        // Create a beep using AudioContext (no external file needed)
        const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = 880;
        osc.type = 'sine';
        gain.gain.value = 0.3;
        osc.start();
        setTimeout(() => { gain.gain.value = 0; osc.stop(); ctx.close(); }, 300);
      }
    } catch { /* Audio not supported */ }
  }, [notifSound]);

  const checkNotifications = useCallback(async () => {
    try {
      const since = lastCheckRef.current;
      const res = await fetch(`/api/notifications${since ? `?since=${encodeURIComponent(since)}` : ''}`);
      if (!res.ok) return;
      const data = await res.json();
      if (data.newReports && data.newReports.length > 0) {
        setNotifications(prev => [...data.newReports, ...prev].slice(0, 10));
        playBeep();
        // Refresh dashboard data
        getDashboard().then(d => { setStats(d.stats); setRecentReports(d.recentReports); });
      }
      if (data.lastCheck) lastCheckRef.current = data.lastCheck;
    } catch { /* ignore polling errors */ }
  }, [playBeep]);

  useEffect(() => {
    getDashboard().then(data => {
      setStats(data.stats);
      setWeeklyData(data.weeklyData);
      setTopExecs(data.topExecutives);
      setRecentReports(data.recentReports);
      setLoading(false);
    }).catch(() => setLoading(false));

    // Initialize notification polling
    fetch('/api/notifications').then(r => r.json()).then(data => {
      if (data.lastCheck) lastCheckRef.current = data.lastCheck;
    }).catch(() => {});

    const interval = setInterval(checkNotifications, 15000); // Poll every 15 seconds
    return () => clearInterval(interval);
  }, [checkNotifications]);

  if (loading) {
    return (
      <div className="p-6 lg:p-8 flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <svg className="animate-spin h-8 w-8 text-teal-600 mx-auto mb-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" strokeOpacity="0.2" />
            <path d="M4 12a8 8 0 018-8" />
          </svg>
          <p className="text-sm text-slate-500">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-600 flex items-center justify-center">
            <svg width="22" height="22" viewBox="0 0 20 20" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10 2L3 7v9a2 2 0 002 2h10a2 2 0 002-2V7l-7-5z" />
              <path d="M8 18V12h4v6" />
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-display font-bold text-navy-900">Dashboard</h1>
            <p className="text-xs text-slate-500">KOSPL — Verification Overview</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Notification Bell */}
          <div className="relative">
            <button
              onClick={() => setNotifSound(!notifSound)}
              className={`relative w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${notifSound ? 'bg-teal-50 text-teal-600 hover:bg-teal-100' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}
              title={notifSound ? 'Notifications ON — Click to mute' : 'Notifications OFF — Click to unmute'}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 01-3.46 0" />
              </svg>
              {notifications.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center animate-pulse">
                  {notifications.length}
                </span>
              )}
            </button>
            {notifications.length > 0 && (
              <div className="absolute right-0 top-full mt-2 bg-white rounded-xl border border-slate-200 shadow-xl z-20 w-[320px] max-h-[300px] overflow-y-auto">
                <div className="p-3 border-b border-slate-100 flex items-center justify-between">
                  <span className="text-xs font-bold text-navy-900">New Submissions</span>
                  <button onClick={() => setNotifications([])} className="text-[10px] text-slate-400 hover:text-slate-600">Clear All</button>
                </div>
                {notifications.map((n) => (
                  <Link key={n.id} href={`/reports/${n.id}`} className="block px-3 py-2.5 border-b border-slate-50 last:border-0 hover:bg-teal-50 transition-colors">
                    <p className="text-xs font-medium text-navy-900">{n.customer_name} <span className="text-slate-400 font-normal">({n.fir_no})</span></p>
                    <p className="text-[10px] text-slate-500 mt-0.5">by {n.executive_name} &middot; {new Date(n.submitted_at).toLocaleString('en-IN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' })}</p>
                  </Link>
                ))}
              </div>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            <input type="date" value={misFrom} onChange={(e) => setMisFrom(e.target.value)} className="px-2 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500" />
            <span className="text-xs text-slate-400">to</span>
            <input type="date" value={misTo} onChange={(e) => setMisTo(e.target.value)} className="px-2 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500" />
          </div>
          <a href={`/api/reports/export?type=daily${misFrom ? `&from=${misFrom}` : ''}${misTo ? `&to=${misTo}` : ''}`} className="px-3 py-2 rounded-xl bg-blue-50 border border-blue-200 text-xs font-semibold text-blue-700 hover:bg-blue-100 transition-colors flex items-center gap-1.5">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="7,10 12,15 17,10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
            Daily MIS
          </a>
          <a href={`/api/reports/export?type=full${misFrom ? `&from=${misFrom}` : ''}${misTo ? `&to=${misTo}` : ''}`} className="px-3 py-2 rounded-xl bg-teal-50 border border-teal-200 text-xs font-semibold text-teal-700 hover:bg-teal-100 transition-colors flex items-center gap-1.5">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="7,10 12,15 17,10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
            Full MIS
          </a>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 mb-5">
        <StatCard label="Total Cases" value={(stats?.totalCases || 0).toLocaleString()} icon={<VisitsIcon />} color="bg-blue-50 text-blue-600" delay="fade-in" href="/cases" />
        <StatCard label="Total Reports" value={(stats?.totalReports || 0).toString()} icon={<TodayIcon />} color="bg-teal-50 text-teal-600" delay="fade-in fade-in-delay-1" href="/reports" />
        <StatCard label="Pending Review" value={(stats?.pendingReview || 0).toString()} icon={<PendingIcon />} color="bg-amber-50 text-amber-600" delay="fade-in fade-in-delay-2" pulse href="/reports" />
        <StatCard label="Submitted by Checker" value={(stats?.approved || 0).toLocaleString()} icon={<ApprovedIcon />} color="bg-emerald-50 text-emerald-600" delay="fade-in fade-in-delay-3" href="/reports" />
        <StatCard label="Rejected" value={(stats?.rejected || 0).toString()} icon={<RejectedIcon />} color="bg-red-50 text-red-600" delay="fade-in fade-in-delay-4" href="/reports" />
        <StatCard label="Today" value={(stats?.todayReports || 0).toString()} icon={<TATIcon />} color="bg-purple-50 text-purple-600" delay="fade-in fade-in-delay-4" href="/reports" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mb-5">
        {/* Weekly Activity Chart */}
        <div className="xl:col-span-2 bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-display font-bold text-navy-900">Weekly Activity</h3>
              <p className="text-xs text-slate-500 mt-0.5">Reports this week</p>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-teal-500" /> Submitted by Checker</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-400" /> Rejected</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-slate-200" /> Others</span>
            </div>
          </div>
          <div className="flex items-end gap-3 h-[150px]">
            {weeklyData.map((day, i) => {
              const maxVisits = Math.max(...weeklyData.map(d => d.visits), 1);
              const height = (day.visits / maxVisits) * 100;
              const approvedH = day.visits > 0 ? (day.approved / day.visits) * height : 0;
              const rejectedH = day.visits > 0 ? (day.rejected / day.visits) * height : 0;
              const othersH = height - approvedH - rejectedH;
              return (
                <div key={day.day} className="flex-1 flex flex-col items-center gap-2">
                  <div className="w-full flex flex-col items-center justify-end" style={{ height: '180px' }}>
                    <div className="w-full max-w-[40px] flex flex-col-reverse gap-[2px] chart-bar" style={{ animationDelay: `${i * 0.08}s` }}>
                      <div className="rounded-b-md bg-teal-500" style={{ height: `${approvedH * 1.8}px` }} />
                      <div className="bg-red-400" style={{ height: `${rejectedH * 1.8}px` }} />
                      <div className="rounded-t-md bg-slate-200" style={{ height: `${Math.max(othersH * 1.8, day.visits > 0 ? 4 : 0)}px` }} />
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] text-slate-400 font-medium">{day.day}</p>
                    <p className="text-xs font-bold text-navy-900">{day.visits}</p>
                  </div>
                </div>
              );
            })}
          </div>
          {weeklyData.every(d => d.visits === 0) && (
            <div className="text-center py-8">
              <p className="text-sm text-slate-400">No reports submitted this week yet</p>
              <p className="text-xs text-slate-300 mt-1">Data will appear as executives submit reports</p>
            </div>
          )}
        </div>

        {/* Top Executives */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-display font-bold text-navy-900">Top Executives</h3>
              <p className="text-xs text-slate-500 mt-0.5">By report count</p>
            </div>
            <Link href="/executives" className="text-xs text-teal-600 hover:text-teal-700 font-medium">View All</Link>
          </div>
          <div className="space-y-4">
            {topExecs.length > 0 ? topExecs.map((exec, i) => (
              <div key={exec.id} className="flex items-center gap-3">
                <span className="text-xs font-bold text-slate-300 w-4">{i + 1}</span>
                <div className="w-8 h-8 rounded-full bg-navy-900 flex items-center justify-center text-[10px] font-bold text-white">
                  {exec.avatar}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-navy-900 truncate">{exec.name}</p>
                  <p className="text-[10px] text-slate-400">{exec.region}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-navy-900">{exec.total_visits}</p>
                  <p className="text-[10px] text-slate-400">reports</p>
                </div>
              </div>
            )) : (
              <p className="text-sm text-slate-400 text-center py-4">No reports yet</p>
            )}
          </div>
        </div>
      </div>

      {/* Recent Reports */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
        <div className="flex items-center justify-between p-6 pb-0">
          <div>
            <h3 className="font-display font-bold text-navy-900">Recent Reports</h3>
            <p className="text-xs text-slate-500 mt-0.5">Latest field verification submissions</p>
          </div>
          <Link href="/reports" className="text-xs text-teal-600 hover:text-teal-700 font-medium px-3 py-1.5 rounded-lg bg-teal-50 hover:bg-teal-100 transition-colors">
            View All Reports
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full mt-4">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left text-[10px] font-semibold uppercase tracking-wider text-slate-400 px-6 py-3">FIR No</th>
                <th className="text-left text-[10px] font-semibold uppercase tracking-wider text-slate-400 px-6 py-3">Customer</th>
                <th className="text-left text-[10px] font-semibold uppercase tracking-wider text-slate-400 px-6 py-3">Address</th>
                <th className="text-left text-[10px] font-semibold uppercase tracking-wider text-slate-400 px-6 py-3">Purpose</th>
                <th className="text-left text-[10px] font-semibold uppercase tracking-wider text-slate-400 px-6 py-3">Executive</th>
                <th className="text-left text-[10px] font-semibold uppercase tracking-wider text-slate-400 px-6 py-3">Date</th>
                <th className="text-left text-[10px] font-semibold uppercase tracking-wider text-slate-400 px-6 py-3">Status</th>
                <th className="text-left text-[10px] font-semibold uppercase tracking-wider text-slate-400 px-6 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {recentReports.length > 0 ? recentReports.map((report) => (
                <tr key={report.id} className="report-row border-b border-slate-50 last:border-0">
                  <td className="px-6 py-3.5">
                    <span className="text-sm font-mono font-semibold text-navy-900">{report.case_id}</span>
                  </td>
                  <td className="px-6 py-3.5">
                    <p className="text-sm font-medium text-navy-900">{report.customer_name}</p>
                    <p className="text-[11px] text-slate-400">{report.contact_number}</p>
                  </td>
                  <td className="px-6 py-3.5">
                    <p className="text-xs text-slate-600 leading-relaxed">{report.address || 'N/A'}</p>
                    <p className="text-[10px] text-slate-400">{report.location}</p>
                  </td>
                  <td className="px-6 py-3.5">
                    <span className="text-xs text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">{report.purpose_of_loan}</span>
                  </td>
                  <td className="px-6 py-3.5">
                    <p className="text-sm text-slate-700">{report.executive_name}</p>
                  </td>
                  <td className="px-6 py-3.5">
                    <p className="text-sm text-slate-600">{formatDate(report.submitted_at)}</p>
                  </td>
                  <td className="px-6 py-3.5">
                    <span className={`status-badge ${getStatusColor(report.status)}`}>
                      {getStatusLabel(report.status)}
                    </span>
                  </td>
                  <td className="px-6 py-3.5">
                    <Link href={`/reports/${report.id}`} className="text-xs font-medium text-teal-600 hover:text-teal-700">
                      View &rarr;
                    </Link>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-sm text-slate-400">
                    No reports yet. Upload cases and assign them to executives to get started.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Data Archive Section */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 mt-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 8v13H3V8" /><path d="M1 3h22v5H1z" /><path d="M10 12h4" /></svg>
          </div>
          <div>
            <h3 className="font-display font-bold text-navy-900">Data Archive</h3>
            <p className="text-xs text-slate-500">Export and purge old completed cases to free up storage</p>
          </div>
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold mb-1 block">Archive cases before</label>
            <input type="date" value={archiveDate} onChange={(e) => { setArchiveDate(e.target.value); setArchiveStats(null); setPurgeResult(null); }} className="px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-400" />
          </div>
          <button
            onClick={async () => {
              if (!archiveDate) return;
              setArchiveLoading(true);
              try {
                const res = await fetch(`/api/archive?action=stats&before=${archiveDate}`);
                const data = await res.json();
                setArchiveStats(data.archivable);
              } catch { setArchiveStats(null); }
              setArchiveLoading(false);
            }}
            disabled={!archiveDate || archiveLoading}
            className="px-4 py-2 rounded-xl bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-200 transition-colors disabled:opacity-50"
          >
            {archiveLoading ? 'Checking...' : 'Check'}
          </button>
          {archiveStats && (
            <>
              <div className="text-xs text-slate-600 bg-orange-50 border border-orange-200 rounded-lg px-3 py-2">
                <span className="font-semibold">{archiveStats.cases}</span> cases, <span className="font-semibold">{archiveStats.reports}</span> reports, <span className="font-semibold">{archiveStats.photos}</span> photos can be archived
              </div>
              {archiveStats.cases > 0 && (
                <>
                  <a
                    href={`/api/archive?action=export&before=${archiveDate}`}
                    className="px-4 py-2 rounded-xl bg-blue-50 border border-blue-200 text-xs font-semibold text-blue-700 hover:bg-blue-100 transition-colors flex items-center gap-1.5"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="7,10 12,15 17,10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
                    Export ZIP (Data + Photos)
                  </a>
                  <button
                    onClick={async () => {
                      if (!confirm(`Are you sure you want to permanently delete ${archiveStats.cases} cases (${archiveStats.reports} reports, ${archiveStats.photos} photos) imported before ${archiveDate}? Make sure you have exported the data first!`)) return;
                      setPurging(true);
                      try {
                        const res = await fetch(`/api/archive?before=${archiveDate}`, { method: 'DELETE' });
                        const data = await res.json();
                        setPurgeResult(`Deleted ${data.deleted.cases} cases, ${data.deleted.reports} reports, ${data.deleted.photos} photos`);
                        setArchiveStats(null);
                        // Refresh dashboard stats
                        getDashboard().then(d => { setStats(d.stats); setRecentReports(d.recentReports); });
                      } catch { setPurgeResult('Purge failed'); }
                      setPurging(false);
                    }}
                    disabled={purging}
                    className="px-4 py-2 rounded-xl bg-red-50 border border-red-200 text-xs font-semibold text-red-700 hover:bg-red-100 transition-colors disabled:opacity-50"
                  >
                    {purging ? 'Purging...' : 'Purge Data'}
                  </button>
                </>
              )}
            </>
          )}
          {purgeResult && (
            <div className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
              {purgeResult}
            </div>
          )}
        </div>
        <p className="text-[10px] text-slate-400 mt-3">Only completed cases (submitted/approved/rejected) are archived. Active and unassigned cases are never deleted.</p>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, color, delay, pulse, href }: { label: string; value: string; icon: React.ReactNode; color: string; delay: string; pulse?: boolean; href?: string }) {
  const content = (
    <>
      <div className={`w-9 h-9 rounded-xl ${color} flex items-center justify-center mb-3`}>{icon}</div>
      <p className="text-2xl font-display font-bold text-navy-900">{value}</p>
      <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold mt-0.5">{label}</p>
    </>
  );
  if (href) {
    return (
      <Link href={href} className={`stat-card bg-white rounded-2xl border border-slate-100 p-4 shadow-sm ${delay} ${pulse ? 'pulse-teal' : ''} hover:shadow-md hover:border-teal-200 transition-all cursor-pointer block`}>
        {content}
      </Link>
    );
  }
  return (
    <div className={`stat-card bg-white rounded-2xl border border-slate-100 p-4 shadow-sm ${delay} ${pulse ? 'pulse-teal' : ''}`}>
      {content}
    </div>
  );
}

function VisitsIcon() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>; }
function TodayIcon() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>; }
function PendingIcon() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12,6 12,12 16,14" /></svg>; }
function ApprovedIcon() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 11-5.93-9.14" /><polyline points="22,4 12,14.01 9,11.01" /></svg>; }
function RejectedIcon() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></svg>; }
function TATIcon() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22,12 18,12 15,21 9,3 6,12 2,12" /></svg>; }
