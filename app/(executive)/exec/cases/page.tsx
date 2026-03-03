'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getCases } from '@/lib/api-client';
import { getStatusColor, getStatusLabel } from '@/lib/utils';

interface CaseRow {
  id: string;
  bank_name: string;
  fir_no: string;
  customer_name: string;
  applicant: string;
  address: string;
  location: string;
  contact_number: string;
  customer_category: string;
  purpose_of_loan: string;
  finance_amount: string;
  status: string;
  imported_at: string;
}

export default function ExecCasesPage() {
  const [cases, setCases] = useState<CaseRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    (async () => {
      try {
        const data = await getCases(filter !== 'all' ? { status: filter } : undefined);
        setCases(data.cases);
      } catch (err) {
        console.error('Failed to fetch cases:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, [filter]);

  const assigned = cases.filter(c => c.status === 'assigned').length;
  const submitted = cases.filter(c => c.status === 'submitted').length;
  const total = cases.length;

  return (
    <div className="px-4 py-4">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-white rounded-xl p-3 border border-slate-100 shadow-sm text-center">
          <p className="text-2xl font-bold text-navy-900">{total}</p>
          <p className="text-[9px] uppercase tracking-wider text-slate-400 font-semibold">Total</p>
        </div>
        <div className="bg-white rounded-xl p-3 border border-slate-100 shadow-sm text-center">
          <p className="text-2xl font-bold text-amber-600">{assigned}</p>
          <p className="text-[9px] uppercase tracking-wider text-slate-400 font-semibold">Pending</p>
        </div>
        <div className="bg-white rounded-xl p-3 border border-slate-100 shadow-sm text-center">
          <p className="text-2xl font-bold text-emerald-600">{submitted}</p>
          <p className="text-[9px] uppercase tracking-wider text-slate-400 font-semibold">Submitted</p>
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
        {[
          { key: 'all', label: 'All Cases' },
          { key: 'assigned', label: 'To Do' },
          { key: 'submitted', label: 'Submitted' },
          { key: 'approved', label: 'Approved' },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => { setFilter(tab.key); setLoading(true); }}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
              filter === tab.key
                ? 'bg-teal-600 text-white shadow-md'
                : 'bg-white text-slate-500 border border-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Loading */}
      {loading && (
        <div className="text-center py-12">
          <svg className="animate-spin h-8 w-8 text-teal-600 mx-auto mb-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <circle cx="12" cy="12" r="10" strokeOpacity="0.2" /><path d="M4 12a8 8 0 018-8" />
          </svg>
          <p className="text-xs text-slate-400">Loading cases...</p>
        </div>
      )}

      {/* Case Cards */}
      {!loading && (
        <div className="space-y-3">
          {cases.map(c => (
            <Link
              key={c.id}
              href={c.status === 'assigned' || c.status === 'in_progress' ? `/exec/report/${c.id}` : '#'}
              className="block"
            >
              <div className={`bg-white rounded-xl border shadow-sm overflow-hidden transition-all ${
                c.status === 'assigned' ? 'border-amber-200 active:scale-[0.98]' :
                c.status === 'submitted' ? 'border-purple-200' :
                c.status === 'approved' ? 'border-emerald-200' :
                'border-slate-100'
              }`}>
                {/* Status Bar */}
                <div className={`h-1 ${
                  c.status === 'assigned' ? 'bg-amber-500' :
                  c.status === 'submitted' ? 'bg-purple-500' :
                  c.status === 'approved' ? 'bg-emerald-500' :
                  c.status === 'rejected' ? 'bg-red-500' :
                  'bg-slate-300'
                }`} />

                <div className="p-4">
                  {/* Top Row: Name + Status */}
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-bold text-navy-900 truncate">{c.customer_name}</h3>
                      <p className="text-xs text-slate-500">{c.applicant}</p>
                    </div>
                    <span className={`text-[9px] font-bold uppercase px-2 py-1 rounded-full border ml-2 flex-shrink-0 ${getStatusColor(c.status)}`}>
                      {getStatusLabel(c.status)}
                    </span>
                  </div>

                  {/* Address — prominent as client requested */}
                  <div className="flex items-start gap-2 mb-2">
                    <svg className="flex-shrink-0 mt-0.5 text-slate-400" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" />
                    </svg>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-navy-900 leading-snug">{c.address || 'No address provided'}</p>
                      <p className="text-xs text-teal-600 font-medium">{c.location}</p>
                    </div>
                  </div>

                  {/* Details Row */}
                  <div className="flex items-center gap-3 text-[10px] text-slate-400">
                    <span className="flex items-center gap-1">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="4" width="18" height="16" rx="2" /><line x1="3" y1="8" x2="21" y2="8" />
                      </svg>
                      {c.bank_name}
                    </span>
                    <span>{c.fir_no}</span>
                    <span className={`font-bold uppercase px-1.5 py-0.5 rounded ${
                      c.customer_category === 'HOME' ? 'bg-blue-50 text-blue-600' :
                      c.customer_category === 'OFFICE' ? 'bg-orange-50 text-orange-600' :
                      'bg-slate-50 text-slate-500'
                    }`}>
                      {c.customer_category}
                    </span>
                  </div>

                  {/* Contact */}
                  {c.contact_number && (
                    <div className="flex items-center gap-1.5 mt-2">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" />
                      </svg>
                      <span className="text-xs text-slate-500">{c.contact_number}</span>
                    </div>
                  )}

                  {/* CTA for assigned cases */}
                  {(c.status === 'assigned' || c.status === 'in_progress') && (
                    <div className="mt-3 pt-3 border-t border-slate-100">
                      <span className="flex items-center justify-center gap-2 w-full py-2.5 bg-teal-600 text-white text-sm font-semibold rounded-lg">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
                        </svg>
                        Start Verification
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </Link>
          ))}

          {cases.length === 0 && (
            <div className="text-center py-12">
              <svg className="mx-auto mb-3 text-slate-300" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="16" rx="2" /><line x1="3" y1="8" x2="21" y2="8" />
              </svg>
              <p className="text-sm text-slate-500">No cases found</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
