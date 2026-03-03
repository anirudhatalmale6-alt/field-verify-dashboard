'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { uploadExcel } from '@/lib/api-client';

export default function UploadPage() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<{ imported: number; failed: number; total: number; errors?: string[] } | null>(null);
  const [error, setError] = useState('');

  const handleFile = (file: File) => {
    if (!file.name.match(/\.(xlsx|xls)$/i)) {
      setError('Please upload an Excel file (.xlsx or .xls)');
      return;
    }
    setSelectedFile(file);
    setError('');
    setResult(null);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    setUploading(true);
    setError('');
    try {
      const data = await uploadExcel(selectedFile);
      setResult(data);
    } catch (err) {
      setError((err as Error).message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-display font-bold text-navy-900">Upload Cases</h1>
        <p className="text-sm text-slate-500 mt-1">Import cases from Excel file for assignment to field executives</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          {!result ? (
            <>
              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all ${
                  dragOver ? 'border-teal-500 bg-teal-50' :
                  selectedFile ? 'border-teal-300 bg-teal-50/50' :
                  'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <input ref={fileRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
                {selectedFile ? (
                  <>
                    <div className="w-16 h-16 bg-teal-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#0d9488" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14,2 14,8 20,8" />
                      </svg>
                    </div>
                    <p className="text-lg font-display font-bold text-navy-900">{selectedFile.name}</p>
                    <p className="text-sm text-slate-500 mt-1">{(selectedFile.size / 1024).toFixed(1)} KB</p>
                    <p className="text-xs text-teal-600 mt-2">Click to change file</p>
                  </>
                ) : (
                  <>
                    <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="17,8 12,3 7,8" /><line x1="12" y1="3" x2="12" y2="15" />
                      </svg>
                    </div>
                    <p className="text-lg font-display font-bold text-navy-900">Drop your Excel file here</p>
                    <p className="text-sm text-slate-500 mt-1">or click to browse &middot; Supports .xlsx and .xls</p>
                    <button className="mt-4 px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-sm font-medium transition-colors">Browse Files</button>
                  </>
                )}
              </div>

              {error && (
                <div className="mt-4 p-3 rounded-lg bg-red-50 border border-red-200">
                  <p className="text-xs text-red-600 font-medium">{error}</p>
                </div>
              )}

              {selectedFile && (
                <button onClick={handleUpload} disabled={uploading} className="mt-4 w-full py-3 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-xl transition-all text-sm flex items-center justify-center gap-2 disabled:opacity-70">
                  {uploading ? (
                    <><svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><circle cx="12" cy="12" r="10" strokeOpacity="0.3" /><path d="M4 12a8 8 0 018-8" /></svg> Processing...</>
                  ) : (
                    'Upload & Import Cases'
                  )}
                </button>
              )}
            </>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 text-center">
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 ${result.failed === 0 ? 'bg-emerald-100' : 'bg-amber-100'}`}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={result.failed === 0 ? '#059669' : '#d97706'} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20,6 9,17 4,12" />
                </svg>
              </div>
              <h3 className="text-xl font-display font-bold text-navy-900 mb-2">Import Complete</h3>
              <div className="flex items-center justify-center gap-6 mb-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-emerald-600">{result.imported}</p>
                  <p className="text-xs text-slate-500">Imported</p>
                </div>
                {result.failed > 0 && (
                  <div className="text-center">
                    <p className="text-2xl font-bold text-red-600">{result.failed}</p>
                    <p className="text-xs text-slate-500">Failed</p>
                  </div>
                )}
                <div className="text-center">
                  <p className="text-2xl font-bold text-slate-700">{result.total}</p>
                  <p className="text-xs text-slate-500">Total Rows</p>
                </div>
              </div>
              {result.errors && result.errors.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 text-left">
                  <p className="text-xs font-semibold text-red-700 mb-1">Errors:</p>
                  {result.errors.map((err, i) => <p key={i} className="text-xs text-red-600">{err}</p>)}
                </div>
              )}
              <div className="flex gap-3 justify-center">
                <button onClick={() => router.push('/cases')} className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-sm font-medium transition-colors">View Cases</button>
                <button onClick={() => { setResult(null); setSelectedFile(null); }} className="px-6 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 hover:border-slate-300 transition-colors">Upload Another</button>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <h3 className="font-display font-bold text-navy-900 mb-4 text-sm">Expected Columns</h3>
            <div className="space-y-2">
              {[
                { col: 'BANK NAME', required: true }, { col: 'DATE AND TIME', required: false },
                { col: 'FIR NO', required: true }, { col: 'APPLICANT', required: false },
                { col: 'PURPOSE OF LOAN', required: false }, { col: 'FINANCE AMOUNT', required: false },
                { col: 'NAME OF CUSTOMER', required: true }, { col: 'ADDRESS', required: true },
                { col: 'LOCATION', required: false }, { col: 'CONTACT NUMBER', required: false },
                { col: 'EXECUTIVE NAME', required: false }, { col: 'CUSTOMER CATEGORY', required: true },
                { col: 'STATUS', required: false },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-md bg-teal-100 text-teal-700 text-[9px] font-bold flex items-center justify-center">{i + 1}</span>
                  <span className="text-xs text-slate-700 font-medium">{item.col}</span>
                  {item.required && <span className="text-[8px] font-bold text-red-500 uppercase">REQ</span>}
                </div>
              ))}
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <h3 className="font-display font-bold text-navy-900 mb-3 text-sm">Notes</h3>
            <div className="space-y-2 text-xs text-slate-500">
              <p>&bull; EXECUTIVE NAME must match exactly (e.g., AVINASH GARJE)</p>
              <p>&bull; CUSTOMER CATEGORY: HOME, OFFICE, or OTHER</p>
              <p>&bull; If executive is specified, case is auto-assigned</p>
              <p>&bull; If executive is blank, case is marked &quot;Unassigned&quot;</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
