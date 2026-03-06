'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { getReport, updateReport } from '@/lib/api-client';
import { getStatusColor, getStatusLabel, getCategoryColor, formatDateTime, formatDate } from '@/lib/utils';

interface ReportDetail {
  id: string;
  case_id: string;
  executive_id: string;
  status: string;
  submitted_at: string;
  reviewed_at: string | null;
  approved_at: string | null;
  internal_notes: string | null;
  fir_reference_number: string;
  customer_name: string;
  address_confirmed: number;
  person_met: string;
  landmark: string;
  rvr_or_bvr: string;
  address: string;
  location: string;
  contact_number: string;
  latitude: number | null;
  longitude: number | null;
  dob_or_age: string;
  area_of_house: string;
  type_of_house: string;
  area_in_sqft: string;
  ownership_details: string;
  rented_owner_name: string;
  staying_years: string;
  family_members: string;
  earning_members: string;
  spouse_occupation: string;
  spouse_occupation_details: string;
  customer_occ_category: string;
  company_name: string;
  company_address: string;
  designation: string;
  years_working: string;
  business_name_address: string;
  office_ownership: string;
  nature_of_business: string;
  years_in_business: string;
  office_location: string;
  office_area_sqft: string;
  office_setup_seen: string;
  employees_seen: string;
  company_name_board: string;
  tpc_neighbour_name: string;
  special_remarks: string;
  summary_remarks: string | null;
  verification_result: string | null;
  negative_reason: string | null;
  bank_name: string;
  fir_no: string;
  applicant: string;
  purpose_of_loan: string;
  finance_amount: string;
  customer_category: string;
  executive_name: string;
  executive_avatar: string;
  executive_phone: string;
  executive_region: string;
}

interface Photo {
  id: string;
  file_path: string;
  label: string;
  latitude: number | null;
  longitude: number | null;
  captured_at: string;
}

interface AuditEntry {
  id: string;
  report_id: string;
  action: string;
  performed_by: string;
  details: string;
  old_value: string | null;
  new_value: string | null;
  performed_at: string;
}

export default function ReportDetailPage() {
  const params = useParams();
  const reportId = params.id as string;

  const [report, setReport] = useState<ReportDetail | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [auditTrail, setAuditTrail] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'details' | 'photos' | 'audit'>('details');
  const [internalNote, setInternalNote] = useState('');
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [editingSummary, setEditingSummary] = useState(false);
  const [summaryText, setSummaryText] = useState('');
  const [savingSummary, setSavingSummary] = useState(false);
  const [savingResult, setSavingResult] = useState(false);
  const [negativeReason, setNegativeReason] = useState('');
  const [savingReason, setSavingReason] = useState(false);

  const fetchData = async () => {
    try {
      const data = await getReport(reportId);
      setReport(data.report);
      setPhotos(data.photos || []);
      setAuditTrail(data.auditTrail || []);
      setNegativeReason(data.report.negative_reason || '');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [reportId]);

  const handleStatusChange = async (newStatus: string) => {
    setShowStatusMenu(false);
    setUpdating(true);
    try {
      await updateReport(reportId, { status: newStatus });
      await fetchData();
    } catch (err) {
      alert('Failed to update status: ' + (err as Error).message);
    } finally {
      setUpdating(false);
    }
  };

  const generateAutoSummary = (r: ReportDetail, houseTypes: string[]) => {
    const s: string[] = [];
    s.push(`Field verification was conducted for ${r.customer_name} (FIR Ref: ${r.fir_reference_number || r.fir_no}) at ${r.address || 'N/A'}, ${r.location || 'N/A'}, under ${r.bank_name} for ${r.purpose_of_loan} of amount ${r.finance_amount || 'N/A'}.`);
    s.push(`The address was ${r.address_confirmed ? 'CONFIRMED' : 'NOT CONFIRMED'} during the visit. Person met at the premises: ${r.person_met || 'N/A'}. Landmark: ${r.landmark || 'N/A'}. Verification type: ${r.rvr_or_bvr || 'N/A'}.`);
    if (r.contact_number) s.push(`Contact number: ${r.contact_number}.`);
    if (r.latitude && r.longitude) s.push(`GPS coordinates captured: ${r.latitude.toFixed(6)}, ${r.longitude.toFixed(6)}.`);
    if (r.rvr_or_bvr !== 'BVR') {
      s.push(`The applicant's date of birth/age is ${r.dob_or_age || 'N/A'}. The house is located in ${r.area_of_house || 'N/A'} area, type: ${houseTypes.length > 0 ? houseTypes.join(', ') : 'N/A'}, area ${r.area_in_sqft || 'N/A'} sqft, ownership: ${r.ownership_details || 'N/A'}.`);
      if (r.rented_owner_name) s.push(`Rented from: ${r.rented_owner_name}.`);
      s.push(`Staying since ${r.staying_years || 'N/A'} years with ${r.family_members || 'N/A'} family members and ${r.earning_members || 'N/A'} earning members.`);
      if (r.spouse_occupation) s.push(`Spouse occupation: ${r.spouse_occupation}${r.spouse_occupation_details ? ' (' + r.spouse_occupation_details + ')' : ''}.`);
    }
    if (r.customer_occ_category === 'SALARIED') {
      s.push(`The customer is salaried, working at ${r.company_name || 'N/A'} (${r.company_address || 'N/A'}) as ${r.designation || 'N/A'} for ${r.years_working || 'N/A'} years. Office setup ${r.office_setup_seen === 'YES' ? 'was seen' : 'was not seen'}, employees seen: ${r.employees_seen || 'N/A'}.`);
    } else if (r.customer_occ_category === 'BUSINESSMAN') {
      s.push(`The customer is a businessman. Business: ${r.business_name_address || 'N/A'}, nature: ${r.nature_of_business || 'N/A'}, running for ${r.years_in_business || 'N/A'} years. Office ownership: ${r.office_ownership || 'N/A'}, location: ${r.office_location || 'N/A'}, area: ${r.office_area_sqft || 'N/A'} sqft. Office setup ${r.office_setup_seen === 'YES' ? 'was seen' : 'was not seen'}, employees seen: ${r.employees_seen || 'N/A'}, company name board: ${r.company_name_board || 'N/A'}.`);
    }
    s.push(`Third party confirmation (TPC) / Neighbour: ${r.tpc_neighbour_name || 'N/A'}.`);
    if (r.special_remarks) s.push(`Special remarks by field executive: ${r.special_remarks}.`);
    if (r.verification_result) s.push(`Verification result: ${r.verification_result}.`);
    return s.join(' ');
  };

  const handleSaveSummary = async () => {
    setSavingSummary(true);
    try {
      await updateReport(reportId, { summary_remarks: summaryText });
      await fetchData();
      setEditingSummary(false);
    } catch (err) {
      alert('Failed to save summary: ' + (err as Error).message);
    } finally {
      setSavingSummary(false);
    }
  };

  const handleVerificationResult = async (value: string) => {
    setSavingResult(true);
    try {
      await updateReport(reportId, { verification_result: value });
      await fetchData();
    } catch (err) {
      alert('Failed to save: ' + (err as Error).message);
    } finally {
      setSavingResult(false);
    }
  };

  const handleSaveReason = async () => {
    setSavingReason(true);
    try {
      await updateReport(reportId, { negative_reason: negativeReason });
      await fetchData();
    } catch (err) {
      alert('Failed to save reason: ' + (err as Error).message);
    } finally {
      setSavingReason(false);
    }
  };

  const handleAddNote = async () => {
    if (!internalNote.trim()) return;
    setUpdating(true);
    try {
      await updateReport(reportId, { internal_note: internalNote.trim() });
      setInternalNote('');
      await fetchData();
    } catch (err) {
      alert('Failed to add note: ' + (err as Error).message);
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center">
        <svg className="animate-spin h-8 w-8 text-teal-600 mx-auto mb-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <circle cx="12" cy="12" r="10" strokeOpacity="0.2" /><path d="M4 12a8 8 0 018-8" />
        </svg>
        <p className="text-sm text-slate-500">Loading report...</p>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-xl font-display font-bold text-navy-900 mb-2">Report Not Found</h2>
        <p className="text-sm text-slate-500 mb-4">{error || 'The report could not be found.'}</p>
        <Link href="/reports" className="text-sm text-teal-600 hover:underline">Back to Reports</Link>
      </div>
    );
  }

  const typeOfHouse = (() => {
    try { return JSON.parse(report.type_of_house || '[]'); } catch { return []; }
  })();

  return (
    <div className="p-6 lg:p-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-slate-400 mb-4">
        <Link href="/reports" className="hover:text-teal-600 transition-colors">Reports</Link>
        <span>/</span>
        <span className="text-navy-900 font-medium">{report.fir_no}</span>
      </div>

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-display font-bold text-navy-900">{report.customer_name}</h1>
            <span className={`status-badge ${getStatusColor(report.status)}`}>
              {getStatusLabel(report.status)}
            </span>
            <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded border ${getCategoryColor(report.customer_category)}`}>
              {report.customer_category}
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            FIR {report.fir_no} &middot; {report.bank_name} &middot; {report.purpose_of_loan} &middot; {report.finance_amount} &middot; Submitted by Maker {formatDate(report.submitted_at)}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {report.status !== 'approved' && (
            <button
              onClick={() => handleStatusChange('approved')}
              disabled={updating}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20,6 9,17 4,12" /></svg>
              {updating ? 'Updating...' : 'Submitted by Checker'}
            </button>
          )}
          <div className="relative">
            <button
              onClick={() => setShowStatusMenu(!showStatusMenu)}
              disabled={updating}
              className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-sm font-medium text-slate-700 hover:border-slate-300 transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
              </svg>
              {updating ? 'Updating...' : 'Update Status'}
            </button>
            {showStatusMenu && (
              <div className="absolute right-0 top-full mt-2 bg-white rounded-xl border border-slate-200 shadow-lg py-1 z-10 min-w-[160px]">
                {['pending', 'in_review', 'verified', 'approved', 'rejected'].map(s => (
                  <button
                    key={s}
                    onClick={() => handleStatusChange(s)}
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

          {report.status === 'approved' ? (
            <Link
              href={`/reports/${report.id}/pdf`}
              className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium transition-colors flex items-center gap-2"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                <polyline points="14,2 14,8 20,8" />
              </svg>
              Export PDF
            </Link>
          ) : (
            <span className="px-4 py-2 rounded-xl bg-slate-200 text-slate-400 text-sm font-medium cursor-not-allowed flex items-center gap-2" title="PDF available after Submitted by Checker">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0110 0v4" />
              </svg>
              PDF Locked
            </span>
          )}
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
            {tab === 'details' ? 'Verification Details' : tab === 'photos' ? `Photos (${photos.length})` : `Audit Trail (${auditTrail.length})`}
          </button>
        ))}
      </div>

      {/* Details Tab */}
      {activeTab === 'details' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <FormSection title="Section 1: Initial Information" icon="clipboard">
              <div className="grid grid-cols-2 gap-4">
                <InfoField label="FIR Reference Number" value={report.fir_reference_number || 'N/A'} />
                <InfoField label="Name of Customer" value={report.customer_name} />
                <InfoField
                  label="Address Confirmed"
                  value={report.address_confirmed ? 'YES - CONFIRMED' : 'NO - NOT CONFIRMED'}
                  valueColor={report.address_confirmed ? 'text-emerald-600' : 'text-red-600'}
                />
              </div>
            </FormSection>

            <FormSection title="Section 2: Location & Residence Details" icon="map">
              <div className="grid grid-cols-2 gap-4">
                <InfoField label="Person Met" value={report.person_met || 'N/A'} />
                <InfoField label="Landmark" value={report.landmark || 'N/A'} />
                <InfoField label="Whether RVR or BVR" value={report.rvr_or_bvr || 'N/A'} />
                <InfoField label="Address" value={report.address || 'N/A'} />
                <InfoField label="Location" value={report.location || 'N/A'} />
                <InfoField label="Contact Number" value={report.contact_number || 'N/A'} />
              </div>
              {report.latitude && report.longitude && (
                <div className="mt-4 rounded-xl bg-slate-100 h-[160px] flex items-center justify-center border border-slate-200 overflow-hidden relative">
                  <div className="absolute inset-0 opacity-20" style={{
                    backgroundImage: `linear-gradient(#94a3b8 1px, transparent 1px), linear-gradient(90deg, #94a3b8 1px, transparent 1px)`,
                    backgroundSize: '20px 20px'
                  }} />
                  <div className="relative text-center">
                    <svg className="mx-auto mb-2 text-slate-400" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" />
                    </svg>
                    <p className="text-xs text-slate-500 font-medium">GPS: {report.latitude.toFixed(4)}, {report.longitude.toFixed(4)}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">GPS-tagged location captured during visit</p>
                  </div>
                </div>
              )}
            </FormSection>

            {report.rvr_or_bvr !== 'BVR' && (
              <FormSection title="Section 3: Personal & Residence Information" icon="home">
                <div className="grid grid-cols-2 gap-4">
                  <InfoField label="Date of Birth / Approx Age" value={report.dob_or_age || 'N/A'} />
                  <InfoField label="Area of House" value={report.area_of_house || 'N/A'} />
                  <InfoField label="Type of House" value={typeOfHouse.length > 0 ? typeOfHouse.join(', ') : 'N/A'} />
                  <InfoField label="Area in Sqft" value={report.area_in_sqft || 'N/A'} />
                  <InfoField label="Ownership Details" value={report.ownership_details || 'N/A'} />
                </div>
              </FormSection>
            )}

            {report.rvr_or_bvr !== 'BVR' && (
              <FormSection title="Section 4: Rental & Residence Duration" icon="calendar">
                <div className="grid grid-cols-2 gap-4">
                  {report.rented_owner_name && <InfoField label="Rented Owner Name" value={report.rented_owner_name} />}
                  <InfoField label="Staying Years" value={report.staying_years || 'N/A'} />
                  <InfoField label="Family Members" value={report.family_members || 'N/A'} />
                  <InfoField label="Earning Members" value={report.earning_members || 'N/A'} />
                </div>
              </FormSection>
            )}

            {report.rvr_or_bvr !== 'BVR' && (
              <FormSection title="Section 5: Spouse & Occupation Details" icon="users">
                <div className="grid grid-cols-2 gap-4">
                  <InfoField label="Spouse Occupation" value={report.spouse_occupation || 'N/A'} />
                  {report.spouse_occupation_details && <InfoField label="Spouse Occupation Details" value={report.spouse_occupation_details} />}
                  <InfoField label="Customer Category" value={report.customer_occ_category || 'N/A'} />
                </div>
              </FormSection>
            )}

            {report.customer_occ_category === 'SALARIED' && (
              <FormSection title="Section 6: Salaried — Employment Details" icon="briefcase">
                <div className="grid grid-cols-2 gap-4">
                  <InfoField label="Company Name" value={report.company_name || 'N/A'} />
                  <InfoField label="Company Address" value={report.company_address || 'N/A'} />
                  <InfoField label="Designation" value={report.designation || 'N/A'} />
                  <InfoField label="Years Working" value={report.years_working || 'N/A'} />
                  <InfoField
                    label="Office Setup Seen"
                    value={report.office_setup_seen || 'N/A'}
                    valueColor={report.office_setup_seen === 'YES' ? 'text-emerald-600' : undefined}
                  />
                  <InfoField label="No. of Employees Seen" value={report.employees_seen || 'N/A'} />
                </div>
              </FormSection>
            )}

            {report.customer_occ_category === 'BUSINESSMAN' && (
              <FormSection title="Section 7: Businessman — Business Details" icon="building">
                <div className="grid grid-cols-2 gap-4">
                  <InfoField label="Business Name & Address" value={report.business_name_address || 'N/A'} />
                  <InfoField label="Office Ownership" value={report.office_ownership || 'N/A'} />
                  <InfoField label="Nature of Business" value={report.nature_of_business || 'N/A'} />
                  <InfoField label="Years in Business" value={report.years_in_business || 'N/A'} />
                  <InfoField label="Office Location / Address" value={report.office_location || 'N/A'} />
                  <InfoField label="Office Area (Sqft)" value={report.office_area_sqft || 'N/A'} />
                  <InfoField
                    label="Office Setup Seen"
                    value={report.office_setup_seen || 'N/A'}
                    valueColor={report.office_setup_seen === 'YES' ? 'text-emerald-600' : undefined}
                  />
                  <InfoField label="No. of Employees Seen" value={report.employees_seen || 'N/A'} />
                  <InfoField label="Company Name Board" value={report.company_name_board || 'N/A'} />
                </div>
              </FormSection>
            )}

            <FormSection title="Section 9: Third Party Confirmation (TPC)" icon="user-check">
              <InfoField label="TPC / Neighbour Name" value={report.tpc_neighbour_name || 'N/A'} />
            </FormSection>

            <FormSection title="Section 10: Special Remarks" icon="message">
              <div className={`p-4 rounded-lg border ${report.special_remarks ? 'bg-slate-50 border-slate-200' : 'bg-slate-50 border-slate-100'}`}>
                <p className="text-sm text-slate-700 leading-relaxed">
                  {report.special_remarks || 'No special remarks.'}
                </p>
              </div>
            </FormSection>

            <FormSection title="Summary Remarks" icon="message">
              {editingSummary ? (
                <div>
                  <textarea
                    value={summaryText}
                    onChange={(e) => setSummaryText(e.target.value)}
                    rows={8}
                    className="w-full px-4 py-3 rounded-lg border border-teal-300 text-sm text-slate-700 leading-relaxed focus:outline-none focus:ring-2 focus:ring-teal-500 resize-vertical bg-white"
                  />
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={handleSaveSummary}
                      disabled={savingSummary}
                      className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold rounded-lg transition-colors disabled:opacity-50"
                    >
                      {savingSummary ? 'Saving...' : 'Save'}
                    </button>
                    <button
                      onClick={() => setEditingSummary(false)}
                      className="px-4 py-2 bg-white border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg hover:border-slate-300 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => setSummaryText(generateAutoSummary(report, typeOfHouse))}
                      className="px-4 py-2 bg-white border border-slate-200 text-slate-500 text-xs font-medium rounded-lg hover:border-slate-300 transition-colors ml-auto"
                    >
                      Reset to Auto-Generated
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="bg-teal-50 border border-teal-200 rounded-lg p-4">
                    <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                      {report.summary_remarks || generateAutoSummary(report, typeOfHouse)}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setSummaryText(report.summary_remarks || generateAutoSummary(report, typeOfHouse));
                      setEditingSummary(true);
                    }}
                    className="mt-3 px-4 py-2 bg-white border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg hover:border-slate-300 transition-colors flex items-center gap-2"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
                    </svg>
                    Edit Summary
                  </button>
                </div>
              )}
            </FormSection>

            <FormSection title="Verification Result" icon="check">
              <div className="flex items-center gap-3">
                <select
                  value={report.verification_result || ''}
                  onChange={(e) => handleVerificationResult(e.target.value)}
                  disabled={savingResult}
                  className={`px-4 py-2.5 rounded-lg border text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500 transition-colors ${
                    report.verification_result === 'POSITIVE' ? 'bg-emerald-50 border-emerald-300 text-emerald-700' :
                    report.verification_result === 'NEGATIVE' ? 'bg-red-50 border-red-300 text-red-700' :
                    report.verification_result === 'REFER TO CREDIT' ? 'bg-amber-50 border-amber-300 text-amber-700' :
                    'bg-white border-slate-200 text-slate-500'
                  }`}
                >
                  <option value="">-- Select Result --</option>
                  <option value="POSITIVE">Positive</option>
                  <option value="NEGATIVE">Negative</option>
                  <option value="REFER TO CREDIT">Refer to Credit</option>
                </select>
                {savingResult && <span className="text-xs text-slate-400">Saving...</span>}
                {report.verification_result && !savingResult && (
                  <span className={`text-xs font-bold uppercase px-2 py-1 rounded ${
                    report.verification_result === 'POSITIVE' ? 'bg-emerald-100 text-emerald-700' :
                    report.verification_result === 'NEGATIVE' ? 'bg-red-100 text-red-700' :
                    'bg-amber-100 text-amber-700'
                  }`}>
                    {report.verification_result}
                  </span>
                )}
              </div>
              {(report.verification_result === 'NEGATIVE' || report.verification_result === 'REFER TO CREDIT') && (
                <div className="mt-3">
                  <label className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold mb-1 block">
                    Reason for {report.verification_result === 'NEGATIVE' ? 'Negative' : 'Refer to Credit'}
                  </label>
                  <textarea
                    value={negativeReason}
                    onChange={e => setNegativeReason(e.target.value)}
                    rows={3}
                    placeholder={`Enter reason why the case is ${report.verification_result.toLowerCase()}...`}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none resize-vertical"
                  />
                  <button
                    onClick={handleSaveReason}
                    disabled={savingReason}
                    className="mt-2 px-4 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold transition-colors disabled:opacity-50"
                  >
                    {savingReason ? 'Saving...' : 'Save Reason'}
                  </button>
                </div>
              )}
            </FormSection>

            <FormSection title="Visit Timeline" icon="clock">
              <div className="space-y-3">
                <TimelineItem label="Submitted by Maker" time={formatDateTime(report.submitted_at)} by={report.executive_name} color="bg-blue-500" />
                {report.reviewed_at && (
                  <TimelineItem label="Reviewed" time={formatDateTime(report.reviewed_at)} by="Admin" color="bg-amber-500" />
                )}
                {report.approved_at && (
                  <TimelineItem label="Submitted by Checker" time={formatDateTime(report.approved_at)} by="Admin" color="bg-emerald-500" />
                )}
                {report.status === 'rejected' && report.reviewed_at && (
                  <TimelineItem label="Rejected" time={formatDateTime(report.reviewed_at)} by="Admin" color="bg-red-500" />
                )}
              </div>
            </FormSection>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
              <h3 className="font-display font-bold text-navy-900 mb-4 text-sm">Case Information</h3>
              <div className="space-y-3">
                <SidebarField label="Bank" value={report.bank_name} />
                <SidebarField label="FIR No" value={report.fir_no} />
                <SidebarField label="Purpose" value={report.purpose_of_loan} />
                <SidebarField label="Finance Amount" value={report.finance_amount || 'N/A'} />
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">Category</span>
                  <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded border ${getCategoryColor(report.customer_category)}`}>
                    {report.customer_category}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">Type</span>
                  <span className="text-sm font-bold text-navy-900">{report.rvr_or_bvr}</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
              <h3 className="font-display font-bold text-navy-900 mb-4 text-sm">Field Executive</h3>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-navy-900 flex items-center justify-center text-xs font-bold text-white">
                  {report.executive_avatar || report.executive_name.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <p className="text-sm font-medium text-navy-900">{report.executive_name}</p>
                  <p className="text-[10px] text-slate-400">{report.executive_region} &middot; {report.executive_phone}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
              <h3 className="font-display font-bold text-navy-900 mb-4 text-sm flex items-center gap-2">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
                </svg>
                Internal Notes
                <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-semibold">Private</span>
              </h3>
              {report.internal_notes && (
                <div className="bg-amber-50 border border-amber-100 rounded-lg p-3 mb-3">
                  <p className="text-xs text-amber-900 leading-relaxed whitespace-pre-line">{report.internal_notes}</p>
                </div>
              )}
              <textarea
                value={internalNote}
                onChange={(e) => setInternalNote(e.target.value)}
                placeholder="Add a note..."
                rows={3}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
              />
              <button
                onClick={handleAddNote}
                disabled={updating || !internalNote.trim()}
                className="mt-2 w-full py-2 bg-navy-900 hover:bg-navy-800 text-white text-xs font-semibold rounded-lg transition-colors disabled:opacity-50"
              >
                {updating ? 'Adding...' : 'Add Note'}
              </button>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
              <h3 className="font-display font-bold text-navy-900 mb-4 text-sm">Report Summary</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">Photos Captured</span>
                  <span className="text-sm font-bold text-navy-900">{photos.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">Address Confirmed</span>
                  <span className={`text-sm font-bold ${report.address_confirmed ? 'text-emerald-600' : 'text-red-600'}`}>
                    {report.address_confirmed ? 'Yes' : 'No'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">Verification Type</span>
                  <span className="text-sm font-bold text-navy-900">{report.rvr_or_bvr}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">Audit Entries</span>
                  <span className="text-sm font-bold text-navy-900">{auditTrail.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">GPS Tagged</span>
                  <span className={`text-sm font-bold ${report.latitude ? 'text-emerald-600' : 'text-slate-400'}`}>
                    {report.latitude ? 'Yes' : 'No'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Photos Tab */}
      {activeTab === 'photos' && (
        <div>
          {photos.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-slate-100 shadow-sm">
              <svg className="mx-auto mb-3 text-slate-300" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21,15 16,10 5,21" />
              </svg>
              <p className="text-sm text-slate-500">No photos uploaded yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {photos.map((photo) => (
                <div key={photo.id} className="photo-card bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                  <div className="bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center relative">
                    {photo.file_path ? (
                      <img src={photo.file_path} alt={photo.label} className="w-full h-auto object-contain" />
                    ) : (
                      <div className="relative text-center py-12">
                        <svg className="mx-auto mb-1 text-slate-400" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21,15 16,10 5,21" />
                        </svg>
                        <p className="text-xs text-slate-400">{photo.label}</p>
                      </div>
                    )}
                    {photo.latitude && photo.longitude && (
                      <div className="absolute top-2 right-2 bg-emerald-600/90 backdrop-blur-sm text-white text-[9px] px-2 py-1 rounded-lg flex items-center gap-1">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                        </svg>
                        GPS
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <p className="text-sm font-medium text-navy-900">{photo.label}</p>
                    <p className="text-[10px] text-slate-400">{formatDateTime(photo.captured_at)}</p>
                    {photo.latitude && photo.longitude && (
                      <p className="text-[10px] text-emerald-600 font-medium mt-0.5">
                        GPS: {photo.latitude.toFixed(6)}, {photo.longitude.toFixed(6)}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Audit Trail Tab */}
      {activeTab === 'audit' && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          {auditTrail.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-8">No audit entries yet</p>
          ) : (
            <div className="space-y-0">
              {auditTrail.map((entry, i) => (
                <div key={entry.id} className="flex gap-4 relative">
                  {i < auditTrail.length - 1 && (
                    <div className="absolute left-[11px] top-[28px] w-[2px] h-[calc(100%-8px)] bg-slate-200" />
                  )}
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                    entry.action.includes('Submitted') ? 'bg-blue-100 text-blue-600' :
                    entry.action.includes('Approved') || entry.new_value === 'approved' ? 'bg-emerald-100 text-emerald-600' :
                    entry.action.includes('Rejected') || entry.new_value === 'rejected' ? 'bg-red-100 text-red-600' :
                    entry.action.includes('Note') ? 'bg-amber-100 text-amber-600' :
                    'bg-slate-100 text-slate-600'
                  }`}>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
                      <circle cx="12" cy="12" r="5" />
                    </svg>
                  </div>
                  <div className="pb-6 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-navy-900">{entry.action}</p>
                      {entry.old_value && entry.new_value && (
                        <span className="text-[10px] text-slate-400">
                          {getStatusLabel(entry.old_value)} &rarr; {getStatusLabel(entry.new_value)}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">{entry.details}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] text-slate-400">by {entry.performed_by}</span>
                      <span className="text-[10px] text-slate-300">&middot;</span>
                      <span className="text-[10px] text-slate-400">{formatDateTime(entry.performed_at)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function FormSection({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  const iconSvg: Record<string, React.ReactNode> = {
    clipboard: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0d9488" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2" /><rect x="8" y="2" width="8" height="4" rx="1" /></svg>,
    map: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0d9488" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" /></svg>,
    home: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0d9488" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" /><polyline points="9,22 9,12 15,12 15,22" /></svg>,
    calendar: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0d9488" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>,
    users: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0d9488" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 00-3-3.87" /><path d="M16 3.13a4 4 0 010 7.75" /></svg>,
    briefcase: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0d9488" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" /></svg>,
    building: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0d9488" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="2" width="16" height="20" rx="2" /><line x1="9" y1="6" x2="9" y2="6.01" /><line x1="15" y1="6" x2="15" y2="6.01" /><line x1="9" y1="10" x2="9" y2="10.01" /><line x1="15" y1="10" x2="15" y2="10.01" /><line x1="9" y1="14" x2="9" y2="14.01" /><line x1="15" y1="14" x2="15" y2="14.01" /><line x1="9" y1="18" x2="15" y2="18" /></svg>,
    check: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0d9488" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20,6 9,17 4,12" /></svg>,
    'user-check': <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0d9488" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="8.5" cy="7" r="4" /><polyline points="17,11 19,13 23,9" /></svg>,
    message: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0d9488" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" /></svg>,
    clock: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0d9488" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12,6 12,12 16,14" /></svg>,
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
      <h3 className="font-display font-bold text-navy-900 mb-4 flex items-center gap-2">
        {iconSvg[icon] || null}
        {title}
      </h3>
      {children}
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

function SidebarField({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-slate-500">{label}</span>
      <span className="text-sm font-medium text-navy-900">{value}</span>
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
