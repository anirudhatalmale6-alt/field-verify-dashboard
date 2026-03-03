'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { reports, getStatusColor, getStatusLabel, getCategoryColor, formatDate, formatTime } from '@/lib/mock-data';

export default function ReportsPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const filtered = useMemo(() => {
    return reports.filter(r => {
      const matchSearch =
        r.customerName.toLowerCase().includes(search.toLowerCase()) ||
        r.caseId.toLowerCase().includes(search.toLowerCase()) ||
        r.executiveName.toLowerCase().includes(search.toLowerCase()) ||
        r.location.toLowerCase().includes(search.toLowerCase()) ||
        r.bankName.toLowerCase().includes(search.toLowerCase()) ||
        r.firNo.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === 'all' || r.status === statusFilter;
      const matchCategory = categoryFilter === 'all' || r.customerCategory === categoryFilter;
      return matchSearch && matchStatus && matchCategory;
    });
  }, [search, statusFilter, categoryFilter]);

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { all: reports.length };
    reports.forEach(r => {
      counts[r.status] = (counts[r.status] || 0) + 1;
    });
    return counts;
  }, []);

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-display font-bold text-navy-900">Verification Reports</h1>
          <p className="text-sm text-slate-500 mt-1">{reports.length} total reports from field executives</p>
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

      {/* Reports Table */}
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
              {filtered.map((report) => (
                <tr key={report.id} className="report-row border-b border-slate-50 last:border-0">
                  <td className="px-4 py-3">
                    <span className="text-sm font-mono font-semibold text-navy-900">{report.firNo}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-slate-700">{report.bankName}</span>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-sm font-medium text-navy-900">{report.customerName}</p>
                    <p className="text-[10px] text-slate-400">{report.contactNumber}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md whitespace-nowrap">{report.purposeOfLoan}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded border status-badge ${getCategoryColor(report.customerCategory)}`}>
                      {report.customerCategory}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs text-slate-600">{report.location}</span>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-sm text-teal-700 font-medium">{report.executiveName}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-sm text-slate-600">{formatDate(report.submittedAt)}</p>
                    <p className="text-[10px] text-slate-400">{formatTime(report.submittedAt)}</p>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21,15 16,10 5,21" />
                      </svg>
                      <span className="text-xs text-slate-500">{report.photos.length}</span>
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

        {filtered.length === 0 && (
          <div className="text-center py-12">
            <svg className="mx-auto mb-3 text-slate-300" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <p className="text-sm text-slate-500">No reports match your filters</p>
            <button onClick={() => { setSearch(''); setStatusFilter('all'); setCategoryFilter('all'); }} className="text-xs text-teal-600 mt-1 hover:underline">
              Clear all filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
