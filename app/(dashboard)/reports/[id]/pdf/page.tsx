'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { getReport } from '@/lib/api-client';
import { getStatusLabel, getCategoryColor, formatDateTime } from '@/lib/utils';

interface ReportDetail {
  id: string;
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
  bank_name: string;
  fir_no: string;
  applicant: string;
  purpose_of_loan: string;
  finance_amount: string;
  customer_category: string;
  executive_name: string;
  executive_id: string;
}

interface Photo {
  id: string;
  file_path: string;
  label: string;
  latitude: number | null;
  longitude: number | null;
  captured_at: string;
}

export default function PDFPreviewPage() {
  const params = useParams();
  const reportId = params.id as string;

  const [report, setReport] = useState<ReportDetail | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data = await getReport(reportId);
        setReport(data.report);
        setPhotos(data.photos || []);
      } catch {
        // handled below
      } finally {
        setLoading(false);
      }
    })();
  }, [reportId]);

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

  if (!report) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-xl font-display font-bold text-navy-900 mb-2">Report Not Found</h2>
        <Link href="/reports" className="text-sm text-teal-600 hover:underline">Back to Reports</Link>
      </div>
    );
  }

  const typeOfHouse = (() => {
    try { return JSON.parse(report.type_of_house || '[]'); } catch { return []; }
  })();

  const handlePrint = () => { window.print(); };

  return (
    <div className="p-6 lg:p-8">
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-6 print:hidden">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Link href="/reports" className="hover:text-teal-600 transition-colors">Reports</Link>
          <span>/</span>
          <Link href={`/reports/${report.id}`} className="hover:text-teal-600 transition-colors">{report.fir_no}</Link>
          <span>/</span>
          <span className="text-navy-900 font-medium">PDF Export</span>
        </div>
        <div className="flex gap-2">
          <Link href={`/reports/${report.id}`} className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-sm font-medium text-slate-700 hover:border-slate-300 transition-colors">
            Back to Report
          </Link>
          <button
            onClick={handlePrint}
            className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium transition-colors flex items-center gap-2"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6,9 6,2 18,2 18,9" /><path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2" /><rect x="6" y="14" width="12" height="8" />
            </svg>
            Print / Save PDF
          </button>
        </div>
      </div>

      {/* PDF Content */}
      <div className="max-w-[800px] mx-auto bg-white shadow-xl rounded-2xl print:shadow-none print:rounded-none overflow-hidden">
        {/* Header Banner */}
        <div className="bg-navy-900 text-white p-8 relative overflow-hidden">
          <div className="absolute top-[-40px] right-[-40px] w-[160px] h-[160px] rounded-full bg-teal-600/20" />
          <div className="absolute bottom-[-20px] left-[-30px] w-[100px] h-[100px] rounded-full bg-teal-600/10" />

          <div className="relative flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-teal-600 flex items-center justify-center">
                  <svg width="22" height="22" viewBox="0 0 20 20" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M10 2L3 7v9a2 2 0 002 2h10a2 2 0 002-2V7l-7-5z" />
                    <path d="M8 18V12h4v6" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-xl font-display font-bold">Koteshwari Onfield Services</h1>
                  <p className="text-[10px] text-teal-400 tracking-widest uppercase">Field Investigation Report</p>
                </div>
              </div>
              <h2 className="text-2xl font-display font-bold mt-2">{report.customer_name}</h2>
              <p className="text-sm text-slate-300 mt-1">FIR {report.fir_no} &middot; {report.bank_name} &middot; {report.purpose_of_loan}</p>
            </div>
            <div className="text-right">
              <div className={`inline-block px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider ${
                report.status === 'approved' ? 'bg-emerald-500 text-white' :
                report.status === 'rejected' ? 'bg-red-500 text-white' :
                report.status === 'verified' ? 'bg-teal-500 text-white' :
                'bg-amber-500 text-navy-900'
              }`}>
                {getStatusLabel(report.status)}
              </div>
              <p className="text-[10px] text-slate-400 mt-2">Generated: {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
              <p className="text-[10px] text-slate-400">Report ID: {report.id}</p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-6">
          <section className="mb-4">
            <SectionTitle title="Case Information" />
            <div className="grid grid-cols-2 gap-x-6 gap-y-2 mt-2">
              <PDFField label="Bank Name" value={report.bank_name} />
              <PDFField label="FIR No" value={report.fir_no} />
              <PDFField label="Applicant" value={report.applicant || 'N/A'} />
              <PDFField label="Purpose of Loan" value={report.purpose_of_loan} />
              <PDFField label="Finance Amount" value={report.finance_amount || 'N/A'} />
              <div>
                <p className="text-[9px] uppercase tracking-wider text-slate-400 font-semibold">Customer Category</p>
                <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded border inline-block mt-0.5 ${getCategoryColor(report.customer_category)}`}>
                  {report.customer_category}
                </span>
              </div>
            </div>
          </section>

          <section className="mb-4">
            <SectionTitle title="Section 1: Initial Information" />
            <div className="grid grid-cols-2 gap-x-6 gap-y-2 mt-2">
              <PDFField label="FIR Reference Number" value={report.fir_reference_number || 'N/A'} />
              <PDFField label="Name of Customer" value={report.customer_name} />
              <PDFField
                label="Address Confirmed"
                value={report.address_confirmed ? 'YES — CONFIRMED' : 'NO — NOT CONFIRMED'}
                highlight={report.address_confirmed ? 'green' : 'red'}
              />
            </div>
          </section>

          <section className="mb-4">
            <SectionTitle title="Section 2: Location & Residence Details" />
            <div className="grid grid-cols-2 gap-x-6 gap-y-2 mt-2">
              <PDFField label="Person Met" value={report.person_met || 'N/A'} />
              <PDFField label="Landmark" value={report.landmark || 'N/A'} />
              <PDFField label="Whether RVR or BVR" value={report.rvr_or_bvr || 'N/A'} />
              <PDFField label="Address" value={report.address || 'N/A'} />
              <PDFField label="Location" value={report.location || 'N/A'} />
              <PDFField label="Contact Number" value={report.contact_number || 'N/A'} />
              {report.latitude && report.longitude && (
                <PDFField label="GPS Coordinates" value={`${report.latitude.toFixed(6)}, ${report.longitude.toFixed(6)}`} />
              )}
            </div>
          </section>

          {report.rvr_or_bvr !== 'BVR' && (
            <section className="mb-4">
              <SectionTitle title="Section 3: Personal & Residence Information" />
              <div className="grid grid-cols-2 gap-x-6 gap-y-2 mt-2">
                <PDFField label="Date of Birth / Age" value={report.dob_or_age || 'N/A'} />
                <PDFField label="Area of House" value={report.area_of_house || 'N/A'} />
                <PDFField label="Type of House" value={typeOfHouse.length > 0 ? typeOfHouse.join(', ') : 'N/A'} />
                <PDFField label="Area in Sqft" value={report.area_in_sqft || 'N/A'} />
                <PDFField label="Ownership Details" value={report.ownership_details || 'N/A'} />
              </div>
            </section>
          )}

          {report.rvr_or_bvr !== 'BVR' && (
            <section className="mb-4">
              <SectionTitle title="Section 4: Rental & Residence Duration" />
              <div className="grid grid-cols-2 gap-x-6 gap-y-2 mt-2">
                {report.rented_owner_name && <PDFField label="Rented Owner Name" value={report.rented_owner_name} />}
                <PDFField label="Staying Years" value={report.staying_years || 'N/A'} />
                <PDFField label="Family Members" value={report.family_members || 'N/A'} />
                <PDFField label="Earning Members" value={report.earning_members || 'N/A'} />
              </div>
            </section>
          )}

          {report.rvr_or_bvr !== 'BVR' && (
            <section className="mb-4">
              <SectionTitle title="Section 5: Spouse & Occupation Details" />
              <div className="grid grid-cols-2 gap-x-6 gap-y-2 mt-2">
                <PDFField label="Spouse Occupation" value={report.spouse_occupation || 'N/A'} />
                {report.spouse_occupation_details && <PDFField label="Spouse Details" value={report.spouse_occupation_details} />}
                <PDFField label="Customer Category" value={report.customer_occ_category || 'N/A'} />
              </div>
            </section>
          )}

          {report.customer_occ_category === 'SALARIED' && (
            <section className="mb-4">
              <SectionTitle title="Section 6: Employment Details (Salaried)" />
              <div className="grid grid-cols-2 gap-x-6 gap-y-2 mt-2">
                <PDFField label="Company Name" value={report.company_name || 'N/A'} />
                <PDFField label="Company Address" value={report.company_address || 'N/A'} />
                <PDFField label="Designation" value={report.designation || 'N/A'} />
                <PDFField label="Years Working" value={report.years_working || 'N/A'} />
                <PDFField label="Office Setup Seen" value={report.office_setup_seen || 'N/A'} highlight={report.office_setup_seen === 'YES' ? 'green' : undefined} />
                <PDFField label="Employees Seen" value={report.employees_seen || 'N/A'} />
              </div>
            </section>
          )}

          {report.customer_occ_category === 'BUSINESSMAN' && (
            <section className="mb-4">
              <SectionTitle title="Section 7: Business Details (Businessman)" />
              <div className="grid grid-cols-2 gap-x-6 gap-y-2 mt-2">
                <PDFField label="Business Name & Address" value={report.business_name_address || 'N/A'} />
                <PDFField label="Office Ownership" value={report.office_ownership || 'N/A'} />
                <PDFField label="Nature of Business" value={report.nature_of_business || 'N/A'} />
                <PDFField label="Years in Business" value={report.years_in_business || 'N/A'} />
                <PDFField label="Office Location" value={report.office_location || 'N/A'} />
                <PDFField label="Office Area (Sqft)" value={report.office_area_sqft || 'N/A'} />
                <PDFField label="Office Setup Seen" value={report.office_setup_seen || 'N/A'} highlight={report.office_setup_seen === 'YES' ? 'green' : undefined} />
                <PDFField label="Employees Seen" value={report.employees_seen || 'N/A'} />
                <PDFField label="Company Name Board" value={report.company_name_board || 'N/A'} />
              </div>
            </section>
          )}

          <section className="mb-4">
            <SectionTitle title="Third Party Confirmation (TPC)" />
            <div className="mt-2"><PDFField label="TPC / Neighbour Name" value={report.tpc_neighbour_name || 'N/A'} /></div>
          </section>

          <section className="mb-4">
            <SectionTitle title="Summary Remarks" />
            <div className="bg-teal-50 border border-teal-200 rounded-lg p-3 mt-2">
              <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line">{report.summary_remarks || (() => {
                const r = report;
                const s: string[] = [];
                s.push(`Field verification was conducted for ${r.customer_name} (FIR Ref: ${r.fir_reference_number || r.fir_no}) at ${r.address || 'N/A'}, ${r.location || 'N/A'}, under ${r.bank_name} for ${r.purpose_of_loan} of amount ${r.finance_amount || 'N/A'}.`);
                s.push(`The address was ${r.address_confirmed ? 'CONFIRMED' : 'NOT CONFIRMED'} during the visit. Person met at the premises: ${r.person_met || 'N/A'}. Landmark: ${r.landmark || 'N/A'}. Verification type: ${r.rvr_or_bvr || 'N/A'}.`);
                if (r.contact_number) s.push(`Contact number: ${r.contact_number}.`);
                if (r.latitude && r.longitude) s.push(`GPS coordinates captured: ${r.latitude.toFixed(6)}, ${r.longitude.toFixed(6)}.`);
                if (r.rvr_or_bvr !== 'BVR') {
                  s.push(`The applicant's date of birth/age is ${r.dob_or_age || 'N/A'}. The house is located in ${r.area_of_house || 'N/A'} area, type: ${typeOfHouse.length > 0 ? typeOfHouse.join(', ') : 'N/A'}, area ${r.area_in_sqft || 'N/A'} sqft, ownership: ${r.ownership_details || 'N/A'}.`);
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
              })()}</p>
            </div>
          </section>

          {report.verification_result && (
            <section className="mb-4">
              <SectionTitle title="Verification Result" />
              <div className="mt-2">
                <span className={`inline-block text-sm font-bold uppercase px-3 py-1.5 rounded-lg border ${
                  report.verification_result === 'POSITIVE' ? 'bg-emerald-50 border-emerald-300 text-emerald-700' :
                  report.verification_result === 'NEGATIVE' ? 'bg-red-50 border-red-300 text-red-700' :
                  'bg-amber-50 border-amber-300 text-amber-700'
                }`}>
                  {report.verification_result}
                </span>
              </div>
            </section>
          )}

          {report.special_remarks && (
            <section className="mb-4">
              <SectionTitle title="Special Remarks" />
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 mt-2">
                <p className="text-xs text-slate-700 leading-relaxed">{report.special_remarks}</p>
              </div>
            </section>
          )}

          <section className="mb-4">
            <SectionTitle title={`Field Photos (${photos.length})`} />
            {photos.length > 0 ? (
              <div className="grid grid-cols-2 gap-3 mt-2">
                {photos.map(photo => (
                  <div key={photo.id} className="bg-slate-50 rounded-lg overflow-hidden border border-slate-200">
                    <div className="h-[180px] flex items-center justify-center bg-slate-100">
                      {photo.file_path ? (
                        <img src={photo.file_path} alt={photo.label} className="w-full h-full object-cover" />
                      ) : (
                        <svg className="text-slate-300" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21,15 16,10 5,21" />
                        </svg>
                      )}
                    </div>
                    <div className="p-2">
                      <p className="text-xs font-semibold text-navy-900">{photo.label}</p>
                      <div className="flex items-center justify-between mt-0.5">
                        <p className="text-[9px] text-slate-400">{formatDateTime(photo.captured_at)}</p>
                        {photo.latitude && photo.longitude ? (
                          <p className="text-[9px] text-teal-600 font-medium">GPS: {photo.latitude.toFixed(4)}, {photo.longitude.toFixed(4)}</p>
                        ) : (
                          <p className="text-[9px] text-slate-400">No GPS</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 mt-2">No photos captured yet.</p>
            )}
          </section>

          <section className="mb-4">
            <SectionTitle title="Visit Details" />
            <div className="grid grid-cols-2 gap-x-6 gap-y-2 mt-2">
              <PDFField label="Field Executive" value={`${report.executive_name} (${report.executive_id})`} />
              <PDFField label="Submitted by Maker" value={formatDateTime(report.submitted_at)} />
              {report.reviewed_at && <PDFField label="Reviewed" value={formatDateTime(report.reviewed_at)} />}
              {report.approved_at && <PDFField label="Submitted by Checker" value={formatDateTime(report.approved_at)} />}
              <PDFField label="Status" value={getStatusLabel(report.status)} />
            </div>
          </section>

          <div className="border-t border-slate-200 pt-4 mt-4">
            <div className="flex items-center justify-between text-[10px] text-slate-400">
              <div>
                <p className="font-semibold text-navy-900">Koteshwari Onfield Services Pvt. Ltd.</p>
                <p>Field Investigation Report — FIR {report.fir_no}</p>
              </div>
              <div className="text-right">
                <p>Confidential — For authorized use only</p>
                <p>Generated on {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SectionTitle({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="w-1 h-5 bg-teal-600 rounded-full" />
      <h3 className="text-sm font-display font-bold text-navy-900 uppercase tracking-wider">{title}</h3>
    </div>
  );
}

function PDFField({ label, value, highlight }: { label: string; value: string; highlight?: 'green' | 'red' }) {
  return (
    <div>
      <p className="text-[9px] uppercase tracking-wider text-slate-400 font-semibold">{label}</p>
      <p className={`text-sm ${
        highlight === 'green' ? 'text-emerald-700 font-bold' :
        highlight === 'red' ? 'text-red-700 font-bold' :
        'text-navy-900'
      }`}>{value}</p>
    </div>
  );
}
