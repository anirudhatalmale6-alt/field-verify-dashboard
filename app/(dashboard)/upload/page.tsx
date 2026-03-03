'use client';

import { useState } from 'react';

export default function UploadPage() {
  const [dragOver, setDragOver] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const sampleData = [
    { bank: 'HDFC Bank', date: '03/03/2026 09:00', fir: 'FIR-2026-4431', applicant: 'Amit Sharma', purpose: 'Home Loan', amount: '₹50,00,000', customer: 'Amit Sharma', address: '101, Green Valley, Andheri East, Mumbai', location: 'Andheri East', contact: '+91 99887 11223', executive: 'AVINASH GARJE', category: 'HOME', status: '' },
    { bank: 'ICICI Bank', date: '03/03/2026 09:30', fir: 'FIR-2026-4432', applicant: 'Neha Desai', purpose: 'Personal Loan', amount: '₹5,00,000', customer: 'Neha Desai', address: '22, Shiv Colony, Dadar, Mumbai', location: 'Dadar', contact: '+91 88776 22334', executive: 'CHETAN NEWALE', category: 'HOME', status: '' },
    { bank: 'SBI', date: '03/03/2026 10:00', fir: 'FIR-2026-4433', applicant: 'Rahul Traders', purpose: 'Business Loan', amount: '₹20,00,000', customer: 'Rahul Patil', address: '45, Market Road, Thane', location: 'Thane', contact: '+91 77665 33445', executive: '', category: 'OFFICE', status: '' },
  ];

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-display font-bold text-navy-900">Upload Cases</h1>
        <p className="text-sm text-slate-500 mt-1">Import cases from Excel file for assignment to field executives</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Upload Area */}
        <div className="xl:col-span-2">
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => { e.preventDefault(); setDragOver(false); setUploadedFile('Cases_March_2026.xlsx'); setShowPreview(true); }}
            className={`border-2 border-dashed rounded-2xl p-12 text-center transition-all ${
              dragOver
                ? 'border-teal-500 bg-teal-50'
                : uploadedFile
                ? 'border-emerald-300 bg-emerald-50'
                : 'border-slate-200 bg-white hover:border-teal-300 hover:bg-teal-50/30'
            }`}
          >
            {uploadedFile ? (
              <div>
                <div className="w-16 h-16 rounded-2xl bg-emerald-100 flex items-center justify-center mx-auto mb-4">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 11.08V12a10 10 0 11-5.93-9.14" /><polyline points="22,4 12,14.01 9,11.01" />
                  </svg>
                </div>
                <p className="text-lg font-display font-bold text-emerald-800">{uploadedFile}</p>
                <p className="text-sm text-emerald-600 mt-1">3 cases found &middot; Ready to import</p>
                <div className="flex items-center justify-center gap-3 mt-4">
                  <button
                    onClick={() => setShowPreview(true)}
                    className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 hover:border-slate-300 transition-colors"
                  >
                    Preview Data
                  </button>
                  <button className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-sm font-medium transition-colors">
                    Import 3 Cases
                  </button>
                  <button
                    onClick={() => { setUploadedFile(null); setShowPreview(false); }}
                    className="px-4 py-2 text-sm text-red-600 hover:text-red-700 font-medium"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                    <polyline points="17,8 12,3 7,8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                </div>
                <p className="text-lg font-display font-bold text-navy-900">Drop your Excel file here</p>
                <p className="text-sm text-slate-500 mt-1">or click to browse &middot; Supports .xlsx and .xls</p>
                <button
                  onClick={() => { setUploadedFile('Cases_March_2026.xlsx'); setShowPreview(true); }}
                  className="mt-4 px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-sm font-medium transition-colors"
                >
                  Browse Files
                </button>
              </div>
            )}
          </div>

          {/* Preview Table */}
          {showPreview && (
            <div className="mt-6 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden fade-in">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="font-display font-bold text-navy-900">Data Preview</h3>
                  <p className="text-xs text-slate-500">Review before importing — 3 rows found</p>
                </div>
                <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-lg font-medium">All columns mapped</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-100">
                      {['Bank', 'FIR No', 'Applicant', 'Purpose', 'Amount', 'Customer', 'Location', 'Executive', 'Category'].map(h => (
                        <th key={h} className="text-left text-[9px] font-semibold uppercase tracking-wider text-slate-400 px-4 py-2">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sampleData.map((row, i) => (
                      <tr key={i} className="border-b border-slate-50 last:border-0 report-row">
                        <td className="px-4 py-2.5 font-medium text-navy-900">{row.bank}</td>
                        <td className="px-4 py-2.5 font-mono text-slate-600">{row.fir}</td>
                        <td className="px-4 py-2.5 text-slate-700">{row.applicant}</td>
                        <td className="px-4 py-2.5"><span className="bg-slate-100 px-1.5 py-0.5 rounded">{row.purpose}</span></td>
                        <td className="px-4 py-2.5 text-slate-700">{row.amount}</td>
                        <td className="px-4 py-2.5 font-medium text-navy-900">{row.customer}</td>
                        <td className="px-4 py-2.5 text-slate-600">{row.location}</td>
                        <td className="px-4 py-2.5">
                          {row.executive ? (
                            <span className="text-teal-700 font-medium">{row.executive}</span>
                          ) : (
                            <span className="text-amber-600 font-medium">Unassigned</span>
                          )}
                        </td>
                        <td className="px-4 py-2.5">
                          <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded border ${
                            row.category === 'HOME' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-orange-50 text-orange-700 border-orange-200'
                          }`}>{row.category}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          {/* Expected Format */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <h3 className="font-display font-bold text-navy-900 text-sm mb-3">Expected Columns</h3>
            <div className="space-y-1.5">
              {[
                'BANK NAME', 'DATE AND TIME', 'FIR NO', 'APPLICANT', 'PURPOSE OF LOAN',
                'FINANCE AMOUNT', 'NAME OF CUSTOMER', 'ADDRESS', 'LOCATION',
                'CONTACT NUMBER', 'EXECUTIVE NAME', 'CUSTOMER CATEGORY', 'STATUS'
              ].map((col, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded bg-slate-100 flex items-center justify-center text-[9px] font-bold text-slate-500">{i + 1}</span>
                  <span className="text-xs text-slate-700">{col}</span>
                  {['BANK NAME', 'FIR NO', 'NAME OF CUSTOMER', 'ADDRESS', 'CUSTOMER CATEGORY'].includes(col) && (
                    <span className="text-[8px] text-red-500 font-bold">REQ</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <h3 className="font-display font-bold text-navy-900 text-sm mb-3">Import History</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Total Imported</span>
                <span className="font-bold text-navy-900">10 cases</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Last Import</span>
                <span className="font-bold text-navy-900">03 Mar 2026</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Unassigned</span>
                <span className="font-bold text-amber-600">2 cases</span>
              </div>
            </div>
          </div>

          {/* Download Template */}
          <div className="bg-teal-50 rounded-2xl border border-teal-100 p-6">
            <h3 className="font-display font-bold text-teal-900 text-sm mb-2">Need the template?</h3>
            <p className="text-xs text-teal-700 mb-3">Download our Excel template with the correct column format.</p>
            <button className="w-full px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-medium transition-colors flex items-center justify-center gap-2">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                <polyline points="7,10 12,15 17,10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Download Template (.xlsx)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
