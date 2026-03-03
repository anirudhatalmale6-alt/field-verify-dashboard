'use client';

import { useState } from 'react';
import Link from 'next/link';
import { reports, getStatusColor, getStatusLabel, formatDateTime, formatDate } from '@/lib/mock-data';
import { useParams } from 'next/navigation';

export default function ReportDetailPage() {
  const params = useParams();
  const reportId = params.id as string;
  const report = reports.find(r => r.id === decodeURIComponent(reportId));
  const [activeTab, setActiveTab] = useState<'details' | 'photos' | 'audit'>('details');
  const [internalNote, setInternalNote] = useState('');
  const [showStatusMenu, setShowStatusMenu] = useState(false);

  if (!report) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-xl font-display font-bold text-navy-900 mb-2">Report Not Found</h2>
        <p className="text-sm text-slate-500 mb-4">The report {reportId} could not be found.</p>
        <Link href="/reports" className="text-sm text-teal-600 hover:underline">Back to Reports</Link>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8">
      {/* Breadcrumb & Header */}
      <div className="flex items-center gap-2 text-xs text-slate-400 mb-4">
        <Link href="/reports" className="hover:text-teal-600 transition-colors">Reports</Link>
        <span>/</span>
        <span className="text-navy-900 font-medium">{report.caseId}</span>
      </div>

      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-display font-bold text-navy-900">{report.customerName}</h1>
            <span className={`status-badge ${getStatusColor(report.status)}`}>
              {getStatusLabel(report.status)}
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">Case {report.caseId} &middot; {report.applicationType} &middot; Submitted {formatDate(report.submittedAt)}</p>
        </div>

        <div className="flex items-center gap-2">
          {/* Status Change */}
          <div className="relative">
            <button
              onClick={() => setShowStatusMenu(!showStatusMenu)}
              className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-sm font-medium text-slate-700 hover:border-slate-300 transition-colors flex items-center gap-2"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
              </svg>
              Update Status
            </button>
            {showStatusMenu && (
              <div className="absolute right-0 top-full mt-2 bg-white rounded-xl border border-slate-200 shadow-lg py-1 z-10 min-w-[160px]">
                {['pending', 'in_review', 'verified', 'approved', 'rejected'].map(s => (
                  <button
                    key={s}
                    onClick={() => setShowStatusMenu(false)}
                    className="w-full text-left px-4 py-2 text-sm hover:bg-slate-50 flex items-center gap-2"
                  >
                    <span className={`w-2 h-2 rounded-full ${
                      s === 'pending' ? 'bg-amber-500' :
                      s === 'in_review' ? 'bg-blue-500' :
                      s === 'verified' ? 'bg-teal-500' :
                      s === 'approved' ? 'bg-emerald-500' : 'bg-red-500'
                    }`} />
                    {getStatusLabel(s)}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* PDF Export */}
          <Link
            href={`/reports/${report.id}/pdf`}
            className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium transition-colors flex items-center gap-2"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
              <polyline points="14,2 14,8 20,8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10,9 9,9 8,9" />
            </svg>
            Export PDF
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-slate-100 p-1 rounded-xl w-fit">
        {(['details', 'photos', 'audit'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab
                ? 'bg-white text-navy-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {tab === 'details' ? 'Details' : tab === 'photos' ? `Photos (${report.photos.length})` : `Audit Trail (${report.auditTrail.length})`}
          </button>
        ))}
      </div>

      {/* Details Tab */}
      {activeTab === 'details' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left — Customer & Address Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Customer Information */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
              <h3 className="font-display font-bold text-navy-900 mb-4 flex items-center gap-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0d9488" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" />
                </svg>
                Customer Information
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <InfoField label="Full Name" value={report.customerName} />
                <InfoField label="Phone" value={report.customerPhone} />
                <InfoField label="Email" value={report.customerEmail} />
                <InfoField label="Application Type" value={report.applicationType} />
                <InfoField label="Company" value={report.companyName} />
                <InfoField label="Designation" value={report.designation} />
                <InfoField label="Employee ID" value={report.employeeId} />
                <InfoField label="Monthly Income" value={report.monthlyIncome} />
              </div>
            </div>

            {/* Address Information */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
              <h3 className="font-display font-bold text-navy-900 mb-4 flex items-center gap-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0d9488" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" />
                </svg>
                Address Verification
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <InfoField label="Address Line 1" value={report.address.line1} />
                <InfoField label="Area" value={report.address.line2} />
                <InfoField label="City" value={report.address.city} />
                <InfoField label="State" value={report.address.state} />
                <InfoField label="Pincode" value={report.address.pincode} />
                <InfoField
                  label="Address Confirmed"
                  value={report.addressConfirmed ? 'Yes — Confirmed' : 'No — Not Confirmed'}
                  valueColor={report.addressConfirmed ? 'text-emerald-600' : 'text-red-600'}
                />
                <InfoField label="Person Met" value={report.personMet} />
                <InfoField label="Relation" value={report.relationToApplicant} />
                <InfoField label="Residence Type" value={report.residenceType} />
                <InfoField label="Ownership" value={report.residenceOwnership} />
                <InfoField label="Years at Address" value={report.yearsAtAddress} />
                <InfoField label="Landmark" value={report.landmark} />
              </div>
              <div className="mt-4">
                <InfoField label="Neighbourhood Assessment" value={report.neighbourhood} />
              </div>

              {/* Map placeholder */}
              <div className="mt-4 rounded-xl bg-slate-100 h-[200px] flex items-center justify-center border border-slate-200 overflow-hidden relative">
                <div className="absolute inset-0 opacity-20" style={{
                  backgroundImage: `
                    linear-gradient(#94a3b8 1px, transparent 1px),
                    linear-gradient(90deg, #94a3b8 1px, transparent 1px)
                  `,
                  backgroundSize: '20px 20px'
                }} />
                <div className="relative text-center">
                  <svg className="mx-auto mb-2 text-slate-400" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" />
                  </svg>
                  <p className="text-xs text-slate-500 font-medium">GPS: {report.coordinates.lat.toFixed(4)}, {report.coordinates.lng.toFixed(4)}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Map view available with Google Maps integration</p>
                </div>
              </div>
            </div>

            {/* Field Visit Details */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
              <h3 className="font-display font-bold text-navy-900 mb-4 flex items-center gap-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0d9488" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
                </svg>
                Visit Timeline
              </h3>
              <div className="space-y-3">
                <TimelineItem label="Submitted" time={formatDateTime(report.submittedAt)} by={report.executiveName} color="bg-blue-500" />
                {report.reviewedAt && (
                  <TimelineItem label="Reviewed" time={formatDateTime(report.reviewedAt)} by="Admin User" color="bg-amber-500" />
                )}
                {report.approvedAt && (
                  <TimelineItem label="Approved" time={formatDateTime(report.approvedAt)} by="Admin User" color="bg-emerald-500" />
                )}
                {report.status === 'rejected' && report.reviewedAt && (
                  <TimelineItem label="Rejected" time={formatDateTime(report.reviewedAt)} by="Admin User" color="bg-red-500" />
                )}
              </div>
            </div>
          </div>

          {/* Right — Sidebar */}
          <div className="space-y-6">
            {/* Executive Card */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
              <h3 className="font-display font-bold text-navy-900 mb-4 text-sm">Field Executive</h3>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-navy-900 flex items-center justify-center text-xs font-bold text-white">
                  {report.executiveName.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <p className="text-sm font-medium text-navy-900">{report.executiveName}</p>
                  <p className="text-[10px] text-slate-400">{report.executiveId}</p>
                </div>
              </div>
            </div>

            {/* Internal Notes */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
              <h3 className="font-display font-bold text-navy-900 mb-4 text-sm flex items-center gap-2">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
                </svg>
                Internal Notes
                <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-semibold">Private</span>
              </h3>
              {report.internalNotes && (
                <div className="bg-amber-50 border border-amber-100 rounded-lg p-3 mb-3">
                  <p className="text-xs text-amber-900 leading-relaxed">{report.internalNotes}</p>
                </div>
              )}
              <textarea
                value={internalNote}
                onChange={(e) => setInternalNote(e.target.value)}
                placeholder="Add a note..."
                rows={3}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
              />
              <button className="mt-2 w-full py-2 bg-navy-900 hover:bg-navy-800 text-white text-xs font-semibold rounded-lg transition-colors">
                Add Note
              </button>
            </div>

            {/* Quick Stats */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
              <h3 className="font-display font-bold text-navy-900 mb-4 text-sm">Report Summary</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">Photos Captured</span>
                  <span className="text-sm font-bold text-navy-900">{report.photos.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">Address Confirmed</span>
                  <span className={`text-sm font-bold ${report.addressConfirmed ? 'text-emerald-600' : 'text-red-600'}`}>
                    {report.addressConfirmed ? 'Yes' : 'No'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">Audit Entries</span>
                  <span className="text-sm font-bold text-navy-900">{report.auditTrail.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">GPS Tagged</span>
                  <span className="text-sm font-bold text-emerald-600">Yes</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Photos Tab */}
      {activeTab === 'photos' && (
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {report.photos.map((photo) => (
            <div key={photo.id} className="photo-card bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="h-[200px] bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center relative">
                <div className="absolute inset-0 opacity-10" style={{
                  backgroundImage: `radial-gradient(circle at 50% 50%, #94a3b8 1px, transparent 1px)`,
                  backgroundSize: '16px 16px'
                }} />
                <div className="relative text-center">
                  <svg className="mx-auto mb-1 text-slate-400" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21,15 16,10 5,21" />
                  </svg>
                  <p className="text-xs text-slate-400">{photo.label}</p>
                </div>
                {/* GPS badge */}
                <div className="absolute top-2 right-2 bg-navy-900/80 backdrop-blur-sm text-white text-[9px] px-2 py-1 rounded-lg flex items-center gap-1">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                  </svg>
                  GPS
                </div>
              </div>
              <div className="p-3">
                <p className="text-sm font-medium text-navy-900">{photo.label}</p>
                <p className="text-[10px] text-slate-400">{formatDateTime(photo.timestamp)}</p>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  {report.coordinates.lat.toFixed(4)}, {report.coordinates.lng.toFixed(4)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Audit Trail Tab */}
      {activeTab === 'audit' && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <div className="space-y-0">
            {report.auditTrail.map((entry, i) => (
              <div key={entry.id} className="flex gap-4 relative">
                {/* Timeline line */}
                {i < report.auditTrail.length - 1 && (
                  <div className="absolute left-[11px] top-[28px] w-[2px] h-[calc(100%-8px)] bg-slate-200" />
                )}
                {/* Dot */}
                <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                  entry.action.includes('Submitted') ? 'bg-blue-100 text-blue-600' :
                  entry.action.includes('Approved') || entry.newValue === 'approved' ? 'bg-emerald-100 text-emerald-600' :
                  entry.action.includes('Rejected') || entry.newValue === 'rejected' ? 'bg-red-100 text-red-600' :
                  entry.action.includes('Note') ? 'bg-amber-100 text-amber-600' :
                  'bg-slate-100 text-slate-600'
                }`}>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
                    <circle cx="12" cy="12" r="5" />
                  </svg>
                </div>
                {/* Content */}
                <div className="pb-6 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-navy-900">{entry.action}</p>
                    {entry.oldValue && entry.newValue && (
                      <span className="text-[10px] text-slate-400">
                        {getStatusLabel(entry.oldValue)} &rarr; {getStatusLabel(entry.newValue)}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">{entry.details}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] text-slate-400">by {entry.performedBy}</span>
                    <span className="text-[10px] text-slate-300">&middot;</span>
                    <span className="text-[10px] text-slate-400">{formatDateTime(entry.performedAt)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function InfoField({ label, value, valueColor }: { label: string; value: string; valueColor?: string }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold mb-0.5">{label}</p>
      <p className={`text-sm font-medium ${valueColor || 'text-navy-900'}`}>{value}</p>
    </div>
  );
}

function TimelineItem({ label, time, by, color }: { label: string; time: string; by: string; color: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className={`w-2.5 h-2.5 rounded-full ${color}`} />
      <div className="flex-1">
        <p className="text-sm font-medium text-navy-900">{label}</p>
        <p className="text-[10px] text-slate-400">{time} &middot; by {by}</p>
      </div>
    </div>
  );
}
