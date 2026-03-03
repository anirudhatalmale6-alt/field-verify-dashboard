'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { cases, executives, getStatusColor, getStatusLabel, getCategoryColor } from '@/lib/mock-data';

export default function CasesPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [selectedCases, setSelectedCases] = useState<string[]>([]);
  const [showAssignModal, setShowAssignModal] = useState(false);

  const filtered = useMemo(() => {
    return cases.filter(c => {
      const matchSearch =
        c.customerName.toLowerCase().includes(search.toLowerCase()) ||
        c.firNo.toLowerCase().includes(search.toLowerCase()) ||
        c.bankName.toLowerCase().includes(search.toLowerCase()) ||
        c.location.toLowerCase().includes(search.toLowerCase()) ||
        c.executiveName.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === 'all' || c.status === statusFilter;
      const matchCategory = categoryFilter === 'all' || c.customerCategory === categoryFilter;
      return matchSearch && matchStatus && matchCategory;
    });
  }, [search, statusFilter, categoryFilter]);

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { all: cases.length };
    cases.forEach(c => { counts[c.status] = (counts[c.status] || 0) + 1; });
    return counts;
  }, []);

  const toggleSelect = (id: string) => {
    setSelectedCases(prev => prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]);
  };

  const toggleAll = () => {
    if (selectedCases.length === filtered.length) {
      setSelectedCases([]);
    } else {
      setSelectedCases(filtered.map(c => c.id));
    }
  };

  return (
    <div className="p-6 lg:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-display font-bold text-navy-900">Case Management</h1>
          <p className="text-sm text-slate-500 mt-1">{cases.length} total cases imported &middot; Assign and track verification cases</p>
        </div>
        <div className="flex items-center gap-2">
          {selectedCases.length > 0 && (
            <button
              onClick={() => setShowAssignModal(true)}
              className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-sm font-medium transition-colors flex items-center gap-2"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="8.5" cy="7" r="4" /><line x1="20" y1="8" x2="20" y2="14" /><line x1="23" y1="11" x2="17" y2="11" />
              </svg>
              Assign {selectedCases.length} Case{selectedCases.length > 1 ? 's' : ''}
            </button>
          )}
          <Link href="/upload" className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 hover:border-slate-300 transition-colors flex items-center gap-2">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="17,8 12,3 7,8" /><line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            Upload Excel
          </Link>
        </div>
      </div>

      {/* Status Tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {[
          { key: 'all', label: 'All Cases' },
          { key: 'unassigned', label: 'Unassigned' },
          { key: 'assigned', label: 'Assigned' },
          { key: 'submitted', label: 'Submitted' },
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

      {/* Cases Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-100">
                <th className="w-10 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selectedCases.length === filtered.length && filtered.length > 0}
                    onChange={toggleAll}
                    className="rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                  />
                </th>
                <th className="text-left text-[10px] font-semibold uppercase tracking-wider text-slate-400 px-4 py-3">FIR No</th>
                <th className="text-left text-[10px] font-semibold uppercase tracking-wider text-slate-400 px-4 py-3">Bank</th>
                <th className="text-left text-[10px] font-semibold uppercase tracking-wider text-slate-400 px-4 py-3">Customer</th>
                <th className="text-left text-[10px] font-semibold uppercase tracking-wider text-slate-400 px-4 py-3">Purpose</th>
                <th className="text-left text-[10px] font-semibold uppercase tracking-wider text-slate-400 px-4 py-3">Amount</th>
                <th className="text-left text-[10px] font-semibold uppercase tracking-wider text-slate-400 px-4 py-3">Location</th>
                <th className="text-left text-[10px] font-semibold uppercase tracking-wider text-slate-400 px-4 py-3">Category</th>
                <th className="text-left text-[10px] font-semibold uppercase tracking-wider text-slate-400 px-4 py-3">Executive</th>
                <th className="text-left text-[10px] font-semibold uppercase tracking-wider text-slate-400 px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.id} className={`report-row border-b border-slate-50 last:border-0 ${selectedCases.includes(c.id) ? 'bg-teal-50/50' : ''}`}>
                  <td className="w-10 px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedCases.includes(c.id)}
                      onChange={() => toggleSelect(c.id)}
                      className="rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm font-mono font-semibold text-navy-900">{c.firNo}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-slate-700">{c.bankName}</span>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-sm font-medium text-navy-900">{c.customerName}</p>
                    <p className="text-[10px] text-slate-400">{c.contactNumber}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md whitespace-nowrap">{c.purposeOfLoan}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-slate-700">{c.financeAmount}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs text-slate-600">{c.location}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded border status-badge ${getCategoryColor(c.customerCategory)}`}>
                      {c.customerCategory}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {c.executiveName ? (
                      <span className="text-sm text-teal-700 font-medium">{c.executiveName}</span>
                    ) : (
                      <span className="text-sm text-amber-600 italic">Unassigned</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`status-badge ${getStatusColor(c.status)}`}>
                      {getStatusLabel(c.status)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Assign Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-navy-900/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 fade-in">
            <h3 className="font-display font-bold text-navy-900 text-lg mb-1">Assign Cases</h3>
            <p className="text-sm text-slate-500 mb-4">Assign {selectedCases.length} selected case{selectedCases.length > 1 ? 's' : ''} to a field executive</p>

            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {executives.map(exec => (
                <button
                  key={exec.id}
                  onClick={() => { setShowAssignModal(false); setSelectedCases([]); }}
                  className="w-full flex items-center gap-3 p-3 rounded-xl border border-slate-200 hover:border-teal-300 hover:bg-teal-50 transition-all text-left"
                >
                  <div className="w-9 h-9 rounded-lg bg-navy-900 flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0">
                    {exec.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-navy-900">{exec.name}</p>
                    <p className="text-[10px] text-slate-400">{exec.region} &middot; {exec.totalVisits} visits &middot; TAT {exec.avgTAT}h</p>
                  </div>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9,18 15,12 9,6" />
                  </svg>
                </button>
              ))}
            </div>

            <button
              onClick={() => setShowAssignModal(false)}
              className="mt-4 w-full py-2 text-sm text-slate-500 hover:text-slate-700 font-medium"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
