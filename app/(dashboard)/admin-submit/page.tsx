'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getCases } from '@/lib/api-client';

interface CaseRow {
  id: string;
  fir_no: string;
  bank_name: string;
  customer_name: string;
  address: string;
  status: string;
  executive_name: string | null;
}

export default function AdminSubmitLanding() {
  const [cases, setCases] = useState<CaseRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    getCases({})
      .then(data => {
        // Only show cases that can be submitted (not already submitted/approved)
        const eligible = data.cases.filter((c: CaseRow) =>
          ['assigned', 'unassigned', 'in_progress'].includes(c.status)
        );
        setCases(eligible);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = cases.filter(c =>
    !search ||
    c.customer_name.toLowerCase().includes(search.toLowerCase()) ||
    c.fir_no.toLowerCase().includes(search.toLowerCase()) ||
    c.bank_name.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="p-8 text-center">
        <svg className="animate-spin h-8 w-8 text-teal-600 mx-auto mb-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <circle cx="12" cy="12" r="10" strokeOpacity="0.2" /><path d="M4 12a8 8 0 018-8" />
        </svg>
        <p className="text-sm text-slate-500">Loading cases...</p>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-[900px]">
      <div className="mb-6">
        <h1 className="text-2xl font-display font-bold text-navy-900">Submit Report (Admin)</h1>
        <p className="text-sm text-slate-500 mt-1">Select a case to submit a verification report on behalf of a field executive</p>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          type="text"
          placeholder="Search by customer, FIR no, bank..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-slate-100">
          <svg className="mx-auto mb-3 text-slate-300" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2" /><line x1="3" y1="9" x2="21" y2="9" /></svg>
          <p className="text-sm text-slate-500">{search ? 'No matching cases found' : 'No pending cases available for submission'}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(c => (
            <Link
              key={c.id}
              href={`/admin-submit/${c.id}`}
              className="block bg-white rounded-xl border border-slate-100 p-4 hover:border-teal-300 hover:bg-teal-50/30 transition-all group"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="text-sm font-mono font-semibold text-navy-900">{c.fir_no}</span>
                    <span className="text-[10px] font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded">{c.bank_name}</span>
                    {c.executive_name && (
                      <span className="text-[10px] font-medium text-teal-600">{c.executive_name}</span>
                    )}
                  </div>
                  <p className="text-sm font-medium text-slate-700">{c.customer_name}</p>
                  <p className="text-xs text-slate-400 truncate">{c.address}</p>
                </div>
                <svg className="text-slate-300 group-hover:text-teal-500 transition-colors flex-shrink-0" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9,18 15,12 9,6" />
                </svg>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
