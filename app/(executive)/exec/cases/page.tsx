'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
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
  distance?: number;
  admin_instructions?: string | null;
}

export default function ExecCasesPage() {
  const [cases, setCases] = useState<CaseRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('assigned');
  const [search, setSearch] = useState('');
  const [userLat, setUserLat] = useState<number | null>(null);
  const [userLng, setUserLng] = useState<number | null>(null);
  const geocodeTriggered = useRef(false);

  // Push-back modal state
  const [pushbackCaseId, setPushbackCaseId] = useState<string | null>(null);
  const [pushbackReason, setPushbackReason] = useState('');
  const [pushbackSubmitting, setPushbackSubmitting] = useState(false);
  const [pushbackError, setPushbackError] = useState('');

  // Get user's current location
  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLat(pos.coords.latitude);
          setUserLng(pos.coords.longitude);
        },
        () => {},
        { enableHighAccuracy: true, timeout: 15000 }
      );
    }
  }, []);

  // Trigger background geocoding of cases (runs once, then re-fetches)
  useEffect(() => {
    if (geocodeTriggered.current) return;
    geocodeTriggered.current = true;

    const triggerGeocode = async () => {
      try {
        let anyGeocoded = false;
        // Geocode up to 5 cases per call, repeat up to 15 times (covers re-geocoding)
        for (let i = 0; i < 15; i++) {
          const res = await fetch('/api/geocode', { method: 'POST', credentials: 'include' });
          const data = await res.json();
          if (data.geocoded > 0) anyGeocoded = true;
          if (data.remaining === 0) break;
          await new Promise(r => setTimeout(r, 2000));
        }
        // Re-fetch cases with updated coordinates
        if (anyGeocoded) {
          fetchCases();
        }
      } catch {}
    };
    triggerGeocode();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchCases = useCallback(async () => {
    setLoading(true);
    try {
      const locParams = userLat !== null && userLng !== null ? { lat: userLat, lng: userLng } : {};
      let data;
      if (filter === 'assigned') {
        const [assignedData, inProgressData] = await Promise.all([
          getCases({ status: 'assigned', ...locParams }),
          getCases({ status: 'in_progress', ...locParams }),
        ]);
        // Merge and sort by distance
        const merged = [...(assignedData.cases || []), ...(inProgressData.cases || [])];
        if (userLat !== null) {
          merged.sort((a: CaseRow, b: CaseRow) => (a.distance || 999999) - (b.distance || 999999));
        }
        data = { cases: merged };
      } else if (filter === 'all') {
        data = await getCases(locParams);
      } else {
        data = await getCases({ status: filter, ...locParams });
      }
      setCases(data.cases || []);
    } catch (err) {
      console.error('Failed to fetch cases:', err);
    } finally {
      setLoading(false);
    }
  }, [filter, userLat, userLng]);

  useEffect(() => {
    fetchCases();
  }, [fetchCases]);

  const assigned = cases.filter(c => c.status === 'assigned' || c.status === 'in_progress').length;
  const submitted = cases.filter(c => c.status === 'submitted').length;
  const total = cases.length;

  // Push-back handler
  const handlePushback = async () => {
    if (!pushbackCaseId || !pushbackReason.trim()) return;
    setPushbackSubmitting(true);
    setPushbackError('');
    try {
      const res = await fetch('/api/cases/pushback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ case_id: pushbackCaseId, reason: pushbackReason.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Push-back failed');
      setCases(prev => prev.filter(c => c.id !== pushbackCaseId));
      closePushbackModal();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Push-back failed';
      setPushbackError(message);
    } finally {
      setPushbackSubmitting(false);
    }
  };

  const openPushbackModal = (caseId: string) => {
    setPushbackCaseId(caseId);
    setPushbackReason('');
    setPushbackError('');
  };

  const closePushbackModal = () => {
    setPushbackCaseId(null);
    setPushbackReason('');
    setPushbackError('');
  };

  // Open Google Maps directions
  const openMaps = (e: React.MouseEvent, address: string, location: string) => {
    e.preventDefault();
    e.stopPropagation();
    const dest = encodeURIComponent((address + (location ? ', ' + location : '')).trim());
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${dest}`, '_blank');
  };

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

      {/* Location sorting indicator */}
      {userLat !== null && (
        <div className="bg-blue-50 border border-blue-100 rounded-lg px-3 py-1.5 mb-3 flex items-center gap-2">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" />
          </svg>
          <p className="text-[10px] text-blue-700 font-medium">Sorted by nearest location</p>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
        {[
          { key: 'assigned', label: 'To Do' },
          { key: 'all', label: 'All' },
          { key: 'submitted', label: 'Submitted' },
          { key: 'approved', label: 'Approved' },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
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

      {/* Search */}
      <div className="relative mb-4">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          type="text"
          placeholder="Search by name, phone, address, FIR..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
        />
        {search && (
          <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 active:text-slate-600">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}
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
      {!loading && (() => {
        const q = search.toLowerCase().trim();
        const filteredCases = q ? cases.filter(c =>
          c.customer_name.toLowerCase().includes(q) ||
          c.contact_number.toLowerCase().includes(q) ||
          c.address.toLowerCase().includes(q) ||
          c.location.toLowerCase().includes(q) ||
          c.fir_no.toLowerCase().includes(q) ||
          c.bank_name.toLowerCase().includes(q) ||
          (c.applicant && c.applicant.toLowerCase().includes(q))
        ) : cases;
        return (
        <div className="space-y-3">
          {filteredCases.map(c => (
            <div key={c.id}>
              <Link
                href={c.status === 'assigned' || c.status === 'in_progress' ? `/exec/report/${c.id}` : '#'}
                className="block"
              >
                <div className={`bg-white rounded-xl border shadow-sm overflow-hidden transition-all ${
                  c.status === 'assigned' ? 'border-amber-200 active:scale-[0.98]' :
                  c.status === 'in_progress' ? 'border-cyan-200 active:scale-[0.98]' :
                  c.status === 'submitted' ? 'border-purple-200' :
                  c.status === 'approved' ? 'border-emerald-200' :
                  'border-slate-100'
                }`}>
                  {/* Status Bar */}
                  <div className={`h-1 ${
                    c.status === 'assigned' ? 'bg-amber-500' :
                    c.status === 'in_progress' ? 'bg-cyan-500' :
                    c.status === 'submitted' ? 'bg-purple-500' :
                    c.status === 'approved' ? 'bg-emerald-500' :
                    c.status === 'rejected' ? 'bg-red-500' :
                    'bg-slate-300'
                  }`} />

                  <div className="p-4">
                    {/* Top Row: Name + Status + Distance */}
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base font-bold text-navy-900 truncate">{c.customer_name}</h3>
                        <p className="text-xs text-slate-500">{c.applicant}</p>
                      </div>
                      <div className="flex items-center gap-1.5 ml-2 flex-shrink-0">
                        {c.distance !== undefined && c.distance < 999999 && (
                          <span className="text-[9px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-full">
                            {c.distance < 1 ? `${Math.round(c.distance * 1000)}m` : `${c.distance.toFixed(1)} km`}
                          </span>
                        )}
                        <span className={`text-[9px] font-bold uppercase px-2 py-1 rounded-full border ${getStatusColor(c.status)}`}>
                          {getStatusLabel(c.status)}
                        </span>
                      </div>
                    </div>

                    {/* Address */}
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

                    {/* Admin Instructions */}
                    {c.admin_instructions && (
                      <div className="flex items-start gap-2 mb-2 px-2.5 py-2 rounded-lg bg-amber-50 border border-amber-200">
                        <svg className="flex-shrink-0 mt-0.5 text-amber-600" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
                        </svg>
                        <p className="text-xs text-amber-800 leading-snug"><span className="font-bold">Admin: </span>{c.admin_instructions}</p>
                      </div>
                    )}

                    {/* Contact + Navigate buttons */}
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      {c.contact_number && (
                        <a
                          href={`tel:${c.contact_number.replace(/\s+/g, '')}`}
                          onClick={(e) => e.stopPropagation()}
                          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 active:bg-emerald-100 transition-colors"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" />
                          </svg>
                          <span className="text-xs font-medium text-emerald-700">{c.contact_number}</span>
                        </a>
                      )}
                      {/* Google Maps Navigate */}
                      {(c.address || c.location) && (
                        <button
                          onClick={(e) => openMaps(e, c.address, c.location)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 border border-blue-200 active:bg-blue-100 transition-colors"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polygon points="3 11 22 2 13 21 11 13 3 11" />
                          </svg>
                          <span className="text-xs font-medium text-blue-700">Navigate</span>
                        </button>
                      )}
                    </div>

                    {/* CTA for assigned / in_progress cases */}
                    {(c.status === 'assigned' || c.status === 'in_progress') && (
                      <div className="mt-3 pt-3 border-t border-slate-100 flex gap-2">
                        <span className="flex items-center justify-center gap-2 flex-1 py-2.5 bg-teal-600 text-white text-sm font-semibold rounded-lg">
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

              {/* Push Back button */}
              {c.status === 'assigned' && (
                <div className="px-4 pb-3 -mt-1 bg-white rounded-b-xl border border-t-0 border-amber-200 shadow-sm">
                  <button
                    onClick={() => openPushbackModal(c.id)}
                    className="flex items-center justify-center gap-2 w-full py-2 bg-red-50 text-red-600 text-sm font-semibold rounded-lg border border-red-200 active:bg-red-100 transition-colors"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="15 18 9 12 15 6" />
                    </svg>
                    Push Back
                  </button>
                </div>
              )}
            </div>
          ))}

          {filteredCases.length === 0 && (
            <div className="text-center py-12">
              <svg className="mx-auto mb-3 text-slate-300" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="16" rx="2" /><line x1="3" y1="8" x2="21" y2="8" />
              </svg>
              <p className="text-sm text-slate-500">{search ? 'No matching cases found' : 'No cases found'}</p>
            </div>
          )}
        </div>
        );
      })()}

      {/* Push-Back Modal */}
      {pushbackCaseId && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={closePushbackModal}
          />
          <div className="relative w-full max-w-md mx-4 mb-4 sm:mb-0 bg-white rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom">
            <div className="bg-red-50 px-5 py-4 border-b border-red-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="15 18 9 12 15 6" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-base font-bold text-navy-900">Push Back Case</h3>
                  <p className="text-xs text-slate-500">This case will be returned to admin</p>
                </div>
              </div>
            </div>

            <div className="px-5 py-4">
              <label className="block text-sm font-semibold text-navy-900 mb-2">
                Reason for push-back <span className="text-red-500">*</span>
              </label>
              <textarea
                value={pushbackReason}
                onChange={(e) => setPushbackReason(e.target.value)}
                placeholder="e.g., Incorrect address, unable to reach location, customer not available..."
                rows={3}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm text-navy-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-red-300 focus:border-red-300 resize-none"
                autoFocus
              />
              {pushbackError && (
                <p className="mt-2 text-xs text-red-600 font-medium">{pushbackError}</p>
              )}
            </div>

            <div className="px-5 pb-5 flex gap-3">
              <button
                onClick={closePushbackModal}
                className="flex-1 py-2.5 bg-slate-100 text-slate-600 text-sm font-semibold rounded-xl border border-slate-200 active:bg-slate-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handlePushback}
                disabled={!pushbackReason.trim() || pushbackSubmitting}
                className="flex-1 py-2.5 bg-red-600 text-white text-sm font-semibold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed active:bg-red-700 transition-colors"
              >
                {pushbackSubmitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <circle cx="12" cy="12" r="10" strokeOpacity="0.3" /><path d="M4 12a8 8 0 018-8" />
                    </svg>
                    Sending...
                  </span>
                ) : (
                  'Confirm Push Back'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
