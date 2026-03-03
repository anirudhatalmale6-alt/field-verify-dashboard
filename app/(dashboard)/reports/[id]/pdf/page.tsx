'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { reports, getStatusLabel, getCategoryColor, formatDateTime } from '@/lib/mock-data';

export default function PDFPreviewPage() {
  const params = useParams();
  const reportId = params.id as string;
  const report = reports.find(r => r.id === decodeURIComponent(reportId));

  if (!report) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-xl font-display font-bold text-navy-900 mb-2">Report Not Found</h2>
        <Link href="/reports" className="text-sm text-teal-600 hover:underline">Back to Reports</Link>
      </div>
    );
  }

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="p-6 lg:p-8">
      {/* Toolbar — hidden when printing */}
      <div className="flex items-center justify-between mb-6 print:hidden">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Link href="/reports" className="hover:text-teal-600 transition-colors">Reports</Link>
          <span>/</span>
          <Link href={`/reports/${report.id}`} className="hover:text-teal-600 transition-colors">{report.firNo}</Link>
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
              <h2 className="text-2xl font-display font-bold mt-2">{report.customerName}</h2>
              <p className="text-sm text-slate-300 mt-1">FIR {report.firNo} &middot; {report.bankName} &middot; {report.purposeOfLoan}</p>
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
        <div className="p-8">
          {/* Case Information */}
          <section className="mb-8">
            <SectionTitle title="Case Information" />
            <div className="grid grid-cols-2 gap-x-8 gap-y-3 mt-3">
              <PDFField label="Bank Name" value={report.bankName} />
              <PDFField label="FIR No" value={report.firNo} />
              <PDFField label="Applicant" value={report.applicant} />
              <PDFField label="Purpose of Loan" value={report.purposeOfLoan} />
              <PDFField label="Finance Amount" value={report.financeAmount} />
              <div>
                <p className="text-[9px] uppercase tracking-wider text-slate-400 font-semibold">Customer Category</p>
                <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded border inline-block mt-0.5 ${getCategoryColor(report.customerCategory)}`}>
                  {report.customerCategory}
                </span>
              </div>
            </div>
          </section>

          {/* Section 1: Initial Information */}
          <section className="mb-8">
            <SectionTitle title="Section 1: Initial Information" />
            <div className="grid grid-cols-2 gap-x-8 gap-y-3 mt-3">
              <PDFField label="FIR Report Given By" value={report.firReportGivenBy} />
              <PDFField label="FIR Reference Number" value={report.firReferenceNumber} />
              <PDFField label="Name of Customer" value={report.customerName} />
              <PDFField
                label="Address Confirmed"
                value={report.addressConfirmed ? 'YES — CONFIRMED' : 'NO — NOT CONFIRMED'}
                highlight={report.addressConfirmed ? 'green' : 'red'}
              />
            </div>
          </section>

          {/* Section 2: Location & Residence */}
          <section className="mb-8">
            <SectionTitle title="Section 2: Location & Residence Details" />
            <div className="grid grid-cols-2 gap-x-8 gap-y-3 mt-3">
              <PDFField label="Person Met" value={report.personMet} />
              <PDFField label="Landmark" value={report.landmark} />
              <PDFField label="Whether RVR or BVR" value={report.rvrOrBvr} />
              <PDFField label="Address" value={report.address} />
              <PDFField label="Location" value={report.location} />
              <PDFField label="Contact Number" value={report.contactNumber} />
              <PDFField label="GPS Coordinates" value={`${report.coordinates.lat.toFixed(6)}, ${report.coordinates.lng.toFixed(6)}`} />
            </div>
          </section>

          {/* Section 3: Personal & Residence (RVR) */}
          {report.rvrOrBvr !== 'BVR' && (
            <section className="mb-8">
              <SectionTitle title="Section 3: Personal & Residence Information" />
              <div className="grid grid-cols-2 gap-x-8 gap-y-3 mt-3">
                <PDFField label="Date of Birth / Age" value={report.dobOrAge || 'N/A'} />
                <PDFField label="Area of House" value={report.areaOfHouse} />
                <PDFField label="Type of House" value={report.typeOfHouse.length > 0 ? report.typeOfHouse.join(', ') : 'N/A'} />
                <PDFField label="Area in Sqft" value={report.areaInSqft || 'N/A'} />
                <PDFField label="Ownership Details" value={report.ownershipDetails} />
              </div>
            </section>
          )}

          {/* Section 4: Rental & Duration (RVR) */}
          {report.rvrOrBvr !== 'BVR' && (
            <section className="mb-8">
              <SectionTitle title="Section 4: Rental & Residence Duration" />
              <div className="grid grid-cols-2 gap-x-8 gap-y-3 mt-3">
                {report.rentedOwnerName && <PDFField label="Rented Owner Name" value={report.rentedOwnerName} />}
                <PDFField label="Staying Years" value={report.stayingYears || 'N/A'} />
                <PDFField label="Family Members" value={report.familyMembers || 'N/A'} />
                <PDFField label="Earning Members" value={report.earningMembers || 'N/A'} />
              </div>
            </section>
          )}

          {/* Section 5: Spouse & Occupation */}
          {report.rvrOrBvr !== 'BVR' && (
            <section className="mb-8">
              <SectionTitle title="Section 5: Spouse & Occupation Details" />
              <div className="grid grid-cols-2 gap-x-8 gap-y-3 mt-3">
                <PDFField label="Spouse Occupation" value={report.spouseOccupation || 'N/A'} />
                {report.spouseOccupationDetails && <PDFField label="Spouse Details" value={report.spouseOccupationDetails} />}
                <PDFField label="Customer Category" value={report.customerOccCategory} />
              </div>
            </section>
          )}

          {/* Section 6: Salaried */}
          {report.customerOccCategory === 'SALARIED' && (
            <section className="mb-8">
              <SectionTitle title="Section 6: Employment Details (Salaried)" />
              <div className="grid grid-cols-2 gap-x-8 gap-y-3 mt-3">
                <PDFField label="Company Name" value={report.companyName || 'N/A'} />
                <PDFField label="Company Address" value={report.companyAddress || 'N/A'} />
                <PDFField label="Designation" value={report.designation || 'N/A'} />
                <PDFField label="Years Working" value={report.yearsWorking || 'N/A'} />
              </div>
            </section>
          )}

          {/* Section 7: Businessman */}
          {report.customerOccCategory === 'BUSINESSMAN' && (
            <section className="mb-8">
              <SectionTitle title="Section 7: Business Details (Businessman)" />
              <div className="grid grid-cols-2 gap-x-8 gap-y-3 mt-3">
                <PDFField label="Business Name & Address" value={report.businessNameAddress || 'N/A'} />
                <PDFField label="Office Ownership" value={report.officeOwnership || 'N/A'} />
                <PDFField label="Nature of Business" value={report.natureOfBusiness || 'N/A'} />
                <PDFField label="Years in Business" value={report.yearsInBusiness || 'N/A'} />
              </div>
            </section>
          )}

          {/* Office Verification */}
          <section className="mb-8">
            <SectionTitle title="Office Verification" />
            <div className="grid grid-cols-2 gap-x-8 gap-y-3 mt-3">
              <PDFField label="Office Location" value={report.officeLocation || 'N/A'} />
              <PDFField label="Office Area (Sqft)" value={report.officeAreaSqft || 'N/A'} />
              <PDFField
                label="Office Setup Seen"
                value={report.officeSetupSeen || 'N/A'}
                highlight={report.officeSetupSeen === 'YES' ? 'green' : undefined}
              />
              <PDFField label="Employees Seen" value={report.employeesSeen || 'N/A'} />
            </div>
          </section>

          {/* Section 8: BVR Company Board */}
          {report.rvrOrBvr === 'BVR' && (
            <section className="mb-8">
              <SectionTitle title="Section 8: Business Verification (Name Board)" />
              <div className="mt-3">
                <PDFField label="Company Name Board" value={report.companyNameBoard || 'N/A'} />
              </div>
            </section>
          )}

          {/* Section 9: TPC */}
          <section className="mb-8">
            <SectionTitle title="Section 9: Third Party Confirmation (TPC)" />
            <div className="mt-3">
              <PDFField label="TPC / Neighbour Name" value={report.tpcNeighbourName || 'N/A'} />
            </div>
          </section>

          {/* Section 10: Remarks */}
          <section className="mb-8">
            <SectionTitle title="Section 10: Special Remarks" />
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 mt-3">
              <p className="text-sm text-slate-700 leading-relaxed">{report.specialRemarks || 'No special remarks.'}</p>
            </div>
          </section>

          {/* Photos */}
          <section className="mb-8">
            <SectionTitle title={`Field Photos (${report.photos.length})`} />
            <div className="grid grid-cols-3 gap-3 mt-3">
              {report.photos.map(photo => (
                <div key={photo.id} className="bg-slate-100 rounded-lg p-3 text-center border border-slate-200">
                  <div className="h-[80px] flex items-center justify-center mb-2">
                    <svg className="text-slate-300" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21,15 16,10 5,21" />
                    </svg>
                  </div>
                  <p className="text-xs font-medium text-navy-900">{photo.label}</p>
                  <p className="text-[9px] text-slate-400 mt-0.5">{formatDateTime(photo.timestamp)}</p>
                  <p className="text-[9px] text-slate-400">GPS Tagged</p>
                </div>
              ))}
            </div>
          </section>

          {/* Visit Details */}
          <section className="mb-8">
            <SectionTitle title="Visit Details" />
            <div className="grid grid-cols-2 gap-x-8 gap-y-3 mt-3">
              <PDFField label="Field Executive" value={`${report.executiveName} (${report.executiveId})`} />
              <PDFField label="Submitted" value={formatDateTime(report.submittedAt)} />
              {report.reviewedAt && <PDFField label="Reviewed" value={formatDateTime(report.reviewedAt)} />}
              {report.approvedAt && <PDFField label="Approved" value={formatDateTime(report.approvedAt)} />}
              <PDFField label="Status" value={getStatusLabel(report.status)} />
            </div>
          </section>

          {/* Internal Notes */}
          {report.internalNotes && (
            <section className="mb-8">
              <SectionTitle title="Internal Notes" />
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mt-3">
                <p className="text-sm text-amber-900 leading-relaxed">{report.internalNotes}</p>
              </div>
            </section>
          )}

          {/* Audit Trail */}
          <section className="mb-6">
            <SectionTitle title="Audit Trail" />
            <div className="mt-3 border border-slate-200 rounded-lg overflow-hidden">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-slate-50">
                    <th className="text-left px-3 py-2 font-semibold text-slate-500 text-[10px] uppercase tracking-wider">Time</th>
                    <th className="text-left px-3 py-2 font-semibold text-slate-500 text-[10px] uppercase tracking-wider">Action</th>
                    <th className="text-left px-3 py-2 font-semibold text-slate-500 text-[10px] uppercase tracking-wider">By</th>
                    <th className="text-left px-3 py-2 font-semibold text-slate-500 text-[10px] uppercase tracking-wider">Details</th>
                  </tr>
                </thead>
                <tbody>
                  {report.auditTrail.map(entry => (
                    <tr key={entry.id} className="border-t border-slate-100">
                      <td className="px-3 py-2 text-slate-600 font-mono whitespace-nowrap">{formatDateTime(entry.performedAt)}</td>
                      <td className="px-3 py-2 text-slate-800 font-medium">{entry.action}</td>
                      <td className="px-3 py-2 text-slate-600">{entry.performedBy}</td>
                      <td className="px-3 py-2 text-slate-500">{entry.details}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Footer */}
          <div className="border-t border-slate-200 pt-6 mt-8">
            <div className="flex items-center justify-between text-[10px] text-slate-400">
              <div>
                <p className="font-semibold text-navy-900">Koteshwari Onfield Services Pvt. Ltd.</p>
                <p>Field Investigation Report — FIR {report.firNo}</p>
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
