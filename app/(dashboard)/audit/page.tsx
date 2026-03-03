'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { reports, formatDateTime, getStatusLabel } from '@/lib/mock-data';

export default function AuditPage() {
  const [filterAction, setFilterAction] = useState('all');

  const allAuditEntries = useMemo(() => {
    const entries = reports.flatMap(r =>
      r.auditTrail.map(a => ({ ...a, customerName: r.customerName, caseId: r.caseId }))
    );
    return entries.sort((a, b) => new Date(b.performedAt).getTime() - new Date(a.performedAt).getTime());
  }, []);

  const filtered = useMemo(() => {
    if (filterAction === 'all') return allAuditEntries;
    return allAuditEntries.filter(e => e.action.toLowerCase().includes(filterAction));
  }, [allAuditEntries, filterAction]);

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-display font-bold text-navy-900">Audit Trail</h1>
        <p className="text-sm text-slate-500 mt-1">Complete log of all actions taken across verification reports</p>
      </div>

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {[
          { key: 'all', label: 'All Actions' },
          { key: 'submitted', label: 'Submissions' },
          { key: 'status', label: 'Status Changes' },
          { key: 'note', label: 'Notes' },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setFilterAction(tab.key)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              filterAction === tab.key
                ? 'bg-navy-900 text-white shadow-md'
                : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Audit Entries */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-100">
                <th className="text-left text-[10px] font-semibold uppercase tracking-wider text-slate-400 px-6 py-3">Timestamp</th>
                <th className="text-left text-[10px] font-semibold uppercase tracking-wider text-slate-400 px-6 py-3">Action</th>
                <th className="text-left text-[10px] font-semibold uppercase tracking-wider text-slate-400 px-6 py-3">Report</th>
                <th className="text-left text-[10px] font-semibold uppercase tracking-wider text-slate-400 px-6 py-3">Performed By</th>
                <th className="text-left text-[10px] font-semibold uppercase tracking-wider text-slate-400 px-6 py-3">Details</th>
                <th className="text-left text-[10px] font-semibold uppercase tracking-wider text-slate-400 px-6 py-3">Change</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((entry) => (
                <tr key={entry.id} className="report-row border-b border-slate-50 last:border-0">
                  <td className="px-6 py-3.5">
                    <p className="text-xs text-slate-700 font-mono whitespace-nowrap">{formatDateTime(entry.performedAt)}</p>
                  </td>
                  <td className="px-6 py-3.5">
                    <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-lg ${
                      entry.action.includes('Submitted') ? 'bg-blue-50 text-blue-700' :
                      entry.action.includes('Approved') || entry.newValue === 'approved' ? 'bg-emerald-50 text-emerald-700' :
                      entry.action.includes('Rejected') || entry.newValue === 'rejected' ? 'bg-red-50 text-red-700' :
                      entry.action.includes('Note') ? 'bg-amber-50 text-amber-700' :
                      'bg-slate-50 text-slate-700'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        entry.action.includes('Submitted') ? 'bg-blue-500' :
                        entry.action.includes('Approved') || entry.newValue === 'approved' ? 'bg-emerald-500' :
                        entry.action.includes('Rejected') || entry.newValue === 'rejected' ? 'bg-red-500' :
                        entry.action.includes('Note') ? 'bg-amber-500' :
                        'bg-slate-500'
                      }`} />
                      {entry.action}
                    </span>
                  </td>
                  <td className="px-6 py-3.5">
                    <Link href={`/reports/${entry.reportId}`} className="text-sm text-teal-600 hover:text-teal-700 font-medium">
                      {entry.caseId}
                    </Link>
                    <p className="text-[10px] text-slate-400">{entry.customerName}</p>
                  </td>
                  <td className="px-6 py-3.5">
                    <p className="text-sm text-slate-700">{entry.performedBy}</p>
                  </td>
                  <td className="px-6 py-3.5 max-w-[250px]">
                    <p className="text-xs text-slate-600 truncate">{entry.details}</p>
                  </td>
                  <td className="px-6 py-3.5">
                    {entry.oldValue && entry.newValue ? (
                      <div className="flex items-center gap-1.5 text-xs">
                        <span className="text-slate-400">{getStatusLabel(entry.oldValue)}</span>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12,5 19,12 12,19" />
                        </svg>
                        <span className="font-medium text-navy-900">{getStatusLabel(entry.newValue)}</span>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-300">—</span>
                    )}
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
