'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getReports } from '@/lib/api-client';
import { getStatusColor, getStatusLabel, getCategoryColor, formatDate, formatTime } from '@/lib/utils';

interface ReportRow {
  id: string;
  customer_name: string;
  status: string;
  submitted_at: string;
  location: string;
  contact_number: string;
  rvr_or_bvr: string;
  bank_name: string;
  fir_no: string;
  purpose_of_loan: string;
  customer_category: string;
  executive_name: string;
  photo_count: number;
}

export default function ReportsPage() {
  const [reports, setReports] = useState<ReportRow[]>([]);
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const fetchReports = async () => {
    try {
      const params: Record<string, string> = {};
      if (statusFilter !== 'all') params.status = statusFilter;
      if (categoryFilter !== 'all') params.category = categoryFilter;
      if (search) params.search = search;
      const data = await getReports(params);
      setReports(data.reports);
      setStatusCounts(data.statusCounts);
    } catch (err) {
      console.error('Failed to fetch reports:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(fetchReports, search ? 300 : 0);
    return () => clearTimeout(timer);
  }, [statusFilter, categoryFilter, search]);

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-display font-bold text-navy-900">Verification Reports</h1>
          <p className="text-sm text-slate-500 mt-1">{statusCounts.all || 0} total reports from field executives</p>
        </div>
      </div>

      {/* Status Tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {[
          { key: 'all', label: 'All Reports' },
          { key: 'pending', label: 'Pending' },
          { key: 'in_review', label: 'In Review' },
          { key: 'verified', label: 'Verified' },
          { key: 'approved', label: 'Approved' },
          { key: 'rejected', label: 'Rejected' },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setStatusFilter(tab.key)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              statusFilter === tab.key
                ? 'bg-navy-900 text-white shadow-md'
                : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300'
            }`}
          >
            {tab.label}
            <span className={`ml-1.5 ${statusFilter === tab.key ? 'text-teal-400' : 'text-slate-400'}`}>
              {statusCounts[tab.key] || 0}
            </span>
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="flex-1 relative">
          <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder="Search by customer, FIR no, bank, location, executive..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-700"
        >
          <option value="all">All Categories</option>
          <option value="HOME">HOME (RVR)</option>
          <option value="OFFICE">OFFICE (BVR)</option>
          <option value="OTHER">OTHER</option>
        </select>
      </div>

      {/* Loading */}
      {loading && (
        <div className="text-center py-16">
          <svg className="animate-spin h-8 w-8 text-teal-600 mx-auto mb-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <circle cx="12" cy="12" r="10" strokeOpacity="0.2" /><path d="M4 12a8 8 0 018-8" />
          </svg>
          <p className="text-sm text-slate-500">Loading reports...</p>
        </div>
      )}

      {/* Reports Table */}
      {!loading && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-100">
                  <th className="text-left text-[10px] font-semibold uppercase tracking-wider text-slate-400 px-4 py-3">FIR No</th>
                  <th className="text-left text-[10px] font-semibold uppercase tracking-wider text-slate-400 px-4 py-3">Bank</th>
                  <th className="text-left text-[10px] font-semibold uppercase tracking-wider text-slate-400 px-4 py-3">Customer</th>
                  <th className="text-left text-[10px] font-semibold uppercase tracking-wider text-slate-400 px-4 py-3">Purpose</th>
                  <th className="text-left text-[10px] font-semibold uppercase tracking-wider text-slate-400 px-4 py-3">Category</th>
                  <th className="text-left text-[10px] font-semibold uppercase tracking-wider text-slate-400 px-4 py-3">Location</th>
                  <th className="text-left text-[10px] font-semibold uppercase tracking-wider text-slate-400 px-4 py-3">Executive</th>
                  <th className="text-left text-[10px] font-semibold uppercase tracking-wider text-slate-400 px-4 py-3">Submitted</th>
                  <th className="text-left text-[10px] font-semibold uppercase tracking-wider text-slate-400 px-4 py-3">Photos</th>
                  <th className="text-left text-[10px] font-semibold uppercase tracking-wider text-slate-400 px-4 py-3">Status</th>
                  <th className="text-left text-[10px] font-semibold uppercase tracking-wider text-slate-400 px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {reports.map((report) => (
                  <tr key={report.id} className="report-row border-b border-slate-50 last:border-0">
                    <td className="px-4 py-3">
                      <span className="text-sm font-mono font-semibold text-navy-900">{report.fir_no}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-slate-700">{report.bank_name}</span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-navy-900">{report.customer_name}</p>
                      <p className="text-[10px] text-slate-400">{report.contact_number}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md whitespace-nowrap">{report.purpose_of_loan}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded border status-badge ${getCategoryColor(report.customer_category)}`}>
                        {report.customer_category}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-slate-600">{report.location}</span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm text-teal-700 font-medium">{report.executive_name}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm text-slate-600">{formatDate(report.submitted_at)}</p>
                      <p className="text-[10px] text-slate-400">{formatTime(report.submitted_at)}</p>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21,15 16,10 5,21" />
                        </svg>
                        <span className="text-xs text-slate-500">{report.photo_count}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`status-badge ${getStatusColor(report.status)}`}>
                        {getStatusLabel(report.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/reports/${report.id}`}
                        className="inline-flex items-center gap-1 text-xs font-medium text-teal-600 hover:text-teal-700 bg-teal-50 hover:bg-teal-100 px-2.5 py-1.5 rounded-lg transition-colors"
                      >
                        View
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="9,18 15,12 9,6" />
                        </svg>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {reports.length === 0 && !loading && (
            <div className="text-center py-12">
              <svg className="mx-auto mb-3 text-slate-300" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <p className="text-sm text-slate-500">No reports found</p>
              <button onClick={() => { setSearch(''); setStatusFilter('all'); setCategoryFilter('all'); }} className="text-xs text-teal-600 mt-1 hover:underline">
                Clear all filters
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
