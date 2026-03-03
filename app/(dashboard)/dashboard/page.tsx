'use client';

import { dashboardStats, executives, reports, weeklyData, getStatusColor, getStatusLabel, formatDate } from '@/lib/mock-data';
import Link from 'next/link';

export default function DashboardPage() {
  const recentReports = reports.slice(0, 5);

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-display font-bold text-navy-900">Dashboard</h1>
        <p className="text-sm text-slate-500 mt-1">Welcome back. Here&apos;s your verification overview for today.</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
        <StatCard
          label="Total Visits"
          value={dashboardStats.totalVisits.toLocaleString()}
          icon={<VisitsIcon />}
          color="bg-blue-50 text-blue-600"
          delay="fade-in"
        />
        <StatCard
          label="Today's Visits"
          value={dashboardStats.todayVisits.toString()}
          icon={<TodayIcon />}
          color="bg-teal-50 text-teal-600"
          delay="fade-in fade-in-delay-1"
        />
        <StatCard
          label="Pending Review"
          value={dashboardStats.pendingReview.toString()}
          icon={<PendingIcon />}
          color="bg-amber-50 text-amber-600"
          delay="fade-in fade-in-delay-2"
          pulse
        />
        <StatCard
          label="Approved"
          value={dashboardStats.approved.toLocaleString()}
          icon={<ApprovedIcon />}
          color="bg-emerald-50 text-emerald-600"
          delay="fade-in fade-in-delay-3"
        />
        <StatCard
          label="Rejected"
          value={dashboardStats.rejected.toString()}
          icon={<RejectedIcon />}
          color="bg-red-50 text-red-600"
          delay="fade-in fade-in-delay-4"
        />
        <StatCard
          label="Avg TAT"
          value={`${dashboardStats.avgTAT}h`}
          icon={<TATIcon />}
          color="bg-purple-50 text-purple-600"
          delay="fade-in fade-in-delay-4"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-8">
        {/* Weekly Activity Chart */}
        <div className="xl:col-span-2 bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-display font-bold text-navy-900">Weekly Activity</h3>
              <p className="text-xs text-slate-500 mt-0.5">Visits this week breakdown</p>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-teal-500" /> Approved</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-400" /> Rejected</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-slate-200" /> Others</span>
            </div>
          </div>

          <div className="flex items-end gap-3 h-[200px]">
            {weeklyData.map((day, i) => {
              const maxVisits = Math.max(...weeklyData.map(d => d.visits));
              const height = (day.visits / maxVisits) * 100;
              const approvedH = (day.approved / day.visits) * height;
              const rejectedH = (day.rejected / day.visits) * height;
              const othersH = height - approvedH - rejectedH;

              return (
                <div key={day.day} className="flex-1 flex flex-col items-center gap-2">
                  <div className="w-full flex flex-col items-center justify-end" style={{ height: '180px' }}>
                    <div className="w-full max-w-[40px] flex flex-col-reverse gap-[2px] chart-bar" style={{ animationDelay: `${i * 0.08}s` }}>
                      <div className="rounded-b-md bg-teal-500" style={{ height: `${approvedH * 1.8}px` }} />
                      <div className="bg-red-400" style={{ height: `${rejectedH * 1.8}px` }} />
                      <div className="rounded-t-md bg-slate-200" style={{ height: `${othersH * 1.8}px` }} />
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
        </div>

        {/* Top Executives */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-display font-bold text-navy-900">Top Executives</h3>
              <p className="text-xs text-slate-500 mt-0.5">By visit count</p>
            </div>
            <Link href="/executives" className="text-xs text-teal-600 hover:text-teal-700 font-medium">
              View All
            </Link>
          </div>
          <div className="space-y-4">
            {executives.slice(0, 5).sort((a, b) => b.totalVisits - a.totalVisits).map((exec, i) => (
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
                  <p className="text-sm font-bold text-navy-900">{exec.totalVisits}</p>
                  <p className="text-[10px] text-slate-400">TAT: {exec.avgTAT}h</p>
                </div>
              </div>
            ))}
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
                <th className="text-left text-[10px] font-semibold uppercase tracking-wider text-slate-400 px-6 py-3">Case ID</th>
                <th className="text-left text-[10px] font-semibold uppercase tracking-wider text-slate-400 px-6 py-3">Customer</th>
                <th className="text-left text-[10px] font-semibold uppercase tracking-wider text-slate-400 px-6 py-3">Type</th>
                <th className="text-left text-[10px] font-semibold uppercase tracking-wider text-slate-400 px-6 py-3">Executive</th>
                <th className="text-left text-[10px] font-semibold uppercase tracking-wider text-slate-400 px-6 py-3">Date</th>
                <th className="text-left text-[10px] font-semibold uppercase tracking-wider text-slate-400 px-6 py-3">Status</th>
                <th className="text-left text-[10px] font-semibold uppercase tracking-wider text-slate-400 px-6 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {recentReports.map((report) => (
                <tr key={report.id} className="report-row border-b border-slate-50 last:border-0">
                  <td className="px-6 py-3.5">
                    <span className="text-sm font-mono font-semibold text-navy-900">{report.caseId}</span>
                  </td>
                  <td className="px-6 py-3.5">
                    <p className="text-sm font-medium text-navy-900">{report.customerName}</p>
                    <p className="text-[11px] text-slate-400">{report.address.city}</p>
                  </td>
                  <td className="px-6 py-3.5">
                    <span className="text-xs text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">{report.applicationType}</span>
                  </td>
                  <td className="px-6 py-3.5">
                    <p className="text-sm text-slate-700">{report.executiveName}</p>
                  </td>
                  <td className="px-6 py-3.5">
                    <p className="text-sm text-slate-600">{formatDate(report.submittedAt)}</p>
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
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, color, delay, pulse }: { label: string; value: string; icon: React.ReactNode; color: string; delay: string; pulse?: boolean }) {
  return (
    <div className={`stat-card bg-white rounded-2xl border border-slate-100 p-4 shadow-sm ${delay} ${pulse ? 'pulse-teal' : ''}`}>
      <div className={`w-9 h-9 rounded-xl ${color} flex items-center justify-center mb-3`}>
        {icon}
      </div>
      <p className="text-2xl font-display font-bold text-navy-900">{value}</p>
      <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold mt-0.5">{label}</p>
    </div>
  );
}

function VisitsIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>;
}
function TodayIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>;
}
function PendingIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12,6 12,12 16,14" /></svg>;
}
function ApprovedIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 11-5.93-9.14" /><polyline points="22,4 12,14.01 9,11.01" /></svg>;
}
function RejectedIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></svg>;
}
function TATIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22,12 18,12 15,21 9,3 6,12 2,12" /></svg>;
}
