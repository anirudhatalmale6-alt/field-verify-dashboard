'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getExecutives } from '@/lib/api-client';

interface Executive {
  id: string;
  name: string;
}

export default function AddCasePage() {
  const router = useRouter();
  const [executives, setExecutives] = useState<Executive[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const [form, setForm] = useState({
    bank_name: '',
    fir_no: '',
    applicant: '',
    purpose_of_loan: '',
    finance_amount: '',
    customer_name: '',
    address: '',
    location: '',
    contact_number: '',
    executive_id: '',
    customer_category: 'HOME',
    date_and_time: '',
  });

  useEffect(() => {
    getExecutives().then(data => setExecutives(data.executives || [])).catch(() => {});
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.customer_name.trim() && !form.fir_no.trim()) {
      setError('Please enter at least Customer Name or FIR No');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch('/api/cases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create case');
      setSuccess(true);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="p-6 lg:p-8">
        <div className="max-w-2xl mx-auto bg-white rounded-2xl border border-slate-100 shadow-sm p-8 text-center">
          <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20,6 9,17 4,12" />
            </svg>
          </div>
          <h3 className="text-xl font-display font-bold text-navy-900 mb-2">Case Created Successfully</h3>
          <p className="text-sm text-slate-500 mb-6">The case has been added and is ready for assignment.</p>
          <div className="flex gap-3 justify-center">
            <button onClick={() => router.push('/cases')} className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-sm font-medium transition-colors">View Cases</button>
            <button onClick={() => { setSuccess(false); setForm({ bank_name: '', fir_no: '', applicant: '', purpose_of_loan: '', finance_amount: '', customer_name: '', address: '', location: '', contact_number: '', executive_id: '', customer_category: 'HOME', date_and_time: '' }); }} className="px-6 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 hover:border-slate-300 transition-colors">Add Another Case</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-display font-bold text-navy-900">Add Case Manually</h1>
        <p className="text-sm text-slate-500 mt-1">Add a single case without uploading Excel — for emergency or ad-hoc cases</p>
      </div>

      <form onSubmit={handleSubmit} className="max-w-3xl">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-5">
          {/* Row 1: Bank & FIR */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Bank Name <span className="text-red-400">*</span></label>
              <input name="bank_name" value={form.bank_name} onChange={handleChange} placeholder="e.g. SBI, HDFC" className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">FIR No / Reference No</label>
              <input name="fir_no" value={form.fir_no} onChange={handleChange} placeholder="e.g. FI-2026-001" className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500" />
            </div>
          </div>

          {/* Row 2: Customer & Applicant */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Customer Name <span className="text-red-400">*</span></label>
              <input name="customer_name" value={form.customer_name} onChange={handleChange} placeholder="Full name of customer" className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500" required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Applicant</label>
              <input name="applicant" value={form.applicant} onChange={handleChange} placeholder="Applicant name (if different)" className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500" />
            </div>
          </div>

          {/* Row 3: Contact & Category */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Contact Number</label>
              <input name="contact_number" value={form.contact_number} onChange={handleChange} placeholder="e.g. 9876543210" className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Category</label>
              <select name="customer_category" value={form.customer_category} onChange={handleChange} className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 bg-white">
                <option value="HOME">Home (RVR)</option>
                <option value="OFFICE">Office (BVR)</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
          </div>

          {/* Address */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Address</label>
            <textarea name="address" value={form.address} onChange={handleChange} rows={2} placeholder="Full address for verification" className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 resize-none" />
          </div>

          {/* Row 4: Location & Date */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Location / Area</label>
              <input name="location" value={form.location} onChange={handleChange} placeholder="e.g. Kothrud, Pune" className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Date</label>
              <input name="date_and_time" type="date" value={form.date_and_time} onChange={handleChange} className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500" />
            </div>
          </div>

          {/* Row 5: Loan Purpose & Amount */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Purpose of Loan</label>
              <input name="purpose_of_loan" value={form.purpose_of_loan} onChange={handleChange} placeholder="e.g. Home Loan, Personal Loan" className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Finance Amount</label>
              <input name="finance_amount" value={form.finance_amount} onChange={handleChange} placeholder="e.g. 500000" className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500" />
            </div>
          </div>

          {/* Assign Executive */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Assign to Executive</label>
            <select name="executive_id" value={form.executive_id} onChange={handleChange} className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 bg-white">
              <option value="">-- Unassigned --</option>
              {executives.map(e => (
                <option key={e.id} value={e.id}>{e.name}</option>
              ))}
            </select>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200">
              <p className="text-xs text-red-600 font-medium">{error}</p>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={submitting} className="px-8 py-3 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-xl transition-all text-sm flex items-center gap-2 disabled:opacity-70">
              {submitting ? (
                <><svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><circle cx="12" cy="12" r="10" strokeOpacity="0.3" /><path d="M4 12a8 8 0 018-8" /></svg> Creating...</>
              ) : (
                'Create Case'
              )}
            </button>
            <button type="button" onClick={() => router.push('/cases')} className="px-6 py-3 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 hover:border-slate-300 transition-colors">Cancel</button>
          </div>
        </div>
      </form>
    </div>
  );
}
