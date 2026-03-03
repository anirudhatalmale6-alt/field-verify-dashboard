'use client';

import { useState, useEffect } from 'react';
import { getExecutives } from '@/lib/api-client';

interface Executive {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar: string;
  region: string;
  is_active: number;
  total_cases: number;
  total_reports: number;
  approved_reports: number;
  rejected_reports: number;
  pending_reports: number;
}

export default function ExecutivesPage() {
  const [executives, setExecutives] = useState<Executive[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data = await getExecutives();
        setExecutives(data.executives);
      } catch (err) {
        console.error('Failed to fetch executives:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="p-8 text-center">
        <svg className="animate-spin h-8 w-8 text-teal-600 mx-auto mb-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <circle cx="12" cy="12" r="10" strokeOpacity="0.2" /><path d="M4 12a8 8 0 018-8" />
        </svg>
        <p className="text-sm text-slate-500">Loading executives...</p>
      </div>
    );
  }

  const totalReports = executives.reduce((acc, e) => acc + (e.total_reports || 0), 0);
  const totalCases = executives.reduce((acc, e) => acc + (e.total_cases || 0), 0);

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-display font-bold text-navy-900">Field Executives</h1>
        <p className="text-sm text-slate-500 mt-1">Performance metrics and visit statistics for all field executives</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <SummaryCard label="Total Executives" value={executives.length.toString()} />
        <SummaryCard label="Total Cases" value={totalCases.toLocaleString()} />
        <SummaryCard label="Total Reports" value={totalReports.toLocaleString()} />
        <SummaryCard label="Active" value={executives.filter(e => e.is_active).length.toString()} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {executives.map((exec, i) => (
          <div key={exec.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-navy-900 flex items-center justify-center text-sm font-bold text-white">
                  {exec.avatar}
                </div>
                <div>
                  <h3 className="font-display font-bold text-navy-900">{exec.name}</h3>
                  <p className="text-xs text-slate-500">{exec.region} &middot; {exec.id}</p>
                </div>
              </div>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                i === 0 ? 'bg-amber-100 text-amber-700' :
                i === 1 ? 'bg-slate-100 text-slate-500' :
                i === 2 ? 'bg-orange-100 text-orange-700' :
                'bg-slate-50 text-slate-400'
              }`}>
                #{i + 1}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="text-center p-2 rounded-lg bg-slate-50">
                <p className="text-lg font-bold text-navy-900">{exec.total_cases || 0}</p>
                <p className="text-[9px] uppercase tracking-wider text-slate-400 font-semibold">Cases</p>
              </div>
              <div className="text-center p-2 rounded-lg bg-slate-50">
                <p className="text-lg font-bold text-teal-600">{exec.total_reports || 0}</p>
                <p className="text-[9px] uppercase tracking-wider text-slate-400 font-semibold">Reports</p>
              </div>
              <div className="text-center p-2 rounded-lg bg-slate-50">
                <p className="text-lg font-bold text-emerald-600">{exec.approved_reports || 0}</p>
                <p className="text-[9px] uppercase tracking-wider text-slate-400 font-semibold">Approved</p>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-[10px] mb-1.5">
                <span className="text-slate-400 font-semibold uppercase tracking-wider">Completion Rate</span>
                <span className="text-navy-900 font-bold">
                  {exec.total_reports > 0 ? Math.round(((exec.approved_reports || 0) / exec.total_reports) * 100) : 0}%
                </span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden flex">
                <div className="bg-emerald-500 rounded-full" style={{ width: `${exec.total_reports > 0 ? ((exec.approved_reports || 0) / exec.total_reports) * 100 : 0}%` }} />
                <div className="bg-red-400 rounded-full" style={{ width: `${exec.total_reports > 0 ? ((exec.rejected_reports || 0) / exec.total_reports) * 100 : 0}%` }} />
              </div>
              <div className="flex items-center gap-3 mt-1.5 text-[10px]">
                <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />Approved: {exec.approved_reports || 0}</span>
                <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-red-400" />Rejected: {exec.rejected_reports || 0}</span>
                <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-slate-300" />Pending: {exec.pending_reports || 0}</span>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-100 flex items-center gap-4">
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" />
                </svg>
                {exec.phone}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
      <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold mb-1">{label}</p>
      <p className="text-2xl font-display font-bold text-navy-900">{value}</p>
    </div>
  );
}
