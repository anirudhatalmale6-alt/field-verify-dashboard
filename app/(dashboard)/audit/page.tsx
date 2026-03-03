'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getAuditTrail } from '@/lib/api-client';
import { getStatusLabel, formatDateTime } from '@/lib/utils';

interface AuditEntry {
  id: string;
  report_id: string;
  case_id: string;
  action: string;
  performed_by: string;
  details: string;
  old_value: string | null;
  new_value: string | null;
  performed_at: string;
  customer_name: string | null;
  case_fir: string | null;
}

export default function AuditPage() {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterAction, setFilterAction] = useState('all');

  const fetchAudit = async () => {
    try {
      const data = await getAuditTrail(filterAction !== 'all' ? filterAction : undefined);
      setEntries(data.entries);
    } catch (err) {
      console.error('Failed to fetch audit trail:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchAudit();
  }, [filterAction]);

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

      {/* Loading */}
      {loading && (
        <div className="text-center py-16">
          <svg className="animate-spin h-8 w-8 text-teal-600 mx-auto mb-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <circle cx="12" cy="12" r="10" strokeOpacity="0.2" /><path d="M4 12a8 8 0 018-8" />
          </svg>
          <p className="text-sm text-slate-500">Loading audit trail...</p>
        </div>
      )}

      {/* Audit Entries */}
      {!loading && (
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
                {entries.map((entry) => (
                  <tr key={entry.id} className="report-row border-b border-slate-50 last:border-0">
                    <td className="px-6 py-3.5">
                      <p className="text-xs text-slate-700 font-mono whitespace-nowrap">{formatDateTime(entry.performed_at)}</p>
                    </td>
                    <td className="px-6 py-3.5">
                      <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-lg ${
                        entry.action.includes('Submitted') ? 'bg-blue-50 text-blue-700' :
                        entry.action.includes('Approved') || entry.new_value === 'approved' ? 'bg-emerald-50 text-emerald-700' :
                        entry.action.includes('Rejected') || entry.new_value === 'rejected' ? 'bg-red-50 text-red-700' :
                        entry.action.includes('Note') ? 'bg-amber-50 text-amber-700' :
                        'bg-slate-50 text-slate-700'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          entry.action.includes('Submitted') ? 'bg-blue-500' :
                          entry.action.includes('Approved') || entry.new_value === 'approved' ? 'bg-emerald-500' :
                          entry.action.includes('Rejected') || entry.new_value === 'rejected' ? 'bg-red-500' :
                          entry.action.includes('Note') ? 'bg-amber-500' :
                          'bg-slate-500'
                        }`} />
                        {entry.action}
                      </span>
                    </td>
                    <td className="px-6 py-3.5">
                      {entry.report_id ? (
                        <Link href={`/reports/${entry.report_id}`} className="text-sm text-teal-600 hover:text-teal-700 font-medium">
                          {entry.case_fir || entry.report_id}
                        </Link>
                      ) : (
                        <span className="text-xs text-slate-400">—</span>
                      )}
                      {entry.customer_name && <p className="text-[10px] text-slate-400">{entry.customer_name}</p>}
                    </td>
                    <td className="px-6 py-3.5">
                      <p className="text-sm text-slate-700">{entry.performed_by}</p>
                    </td>
                    <td className="px-6 py-3.5 max-w-[250px]">
                      <p className="text-xs text-slate-600 truncate">{entry.details}</p>
                    </td>
                    <td className="px-6 py-3.5">
                      {entry.old_value && entry.new_value ? (
                        <div className="flex items-center gap-1.5 text-xs">
                          <span className="text-slate-400">{getStatusLabel(entry.old_value)}</span>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12,5 19,12 12,19" />
                          </svg>
                          <span className="font-medium text-navy-900">{getStatusLabel(entry.new_value)}</span>
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

          {entries.length === 0 && !loading && (
            <div className="text-center py-12">
              <p className="text-sm text-slate-500">No audit entries found</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
