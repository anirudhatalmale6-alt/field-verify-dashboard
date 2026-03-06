'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getExecutives, createExecutive, updateExecutive } from '@/lib/api-client';

interface Executive {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar: string;
  region: string;
  role: string;
  is_active: number;
  total_cases: number;
  total_reports: number;
  approved_reports: number;
  rejected_reports: number;
  pending_reports: number;
}

export default function ExecutivesPage() {
  const [executives, setExecutives] = useState<Executive[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newExec, setNewExec] = useState({ name: '', email: '', phone: '', region: '', role: 'executive' as string });
  const [addError, setAddError] = useState('');
  const [adding, setAdding] = useState(false);
  const [editExec, setEditExec] = useState<Executive | null>(null);
  const [editForm, setEditForm] = useState({ name: '', email: '', phone: '', region: '' });
  const [editError, setEditError] = useState('');
  const [editing, setEditing] = useState(false);
  const [editSuccess, setEditSuccess] = useState('');

  const loadExecs = async () => {
    try {
      const data = await getExecutives();
      setExecutives(data.executives);
    } catch (err) {
      console.error('Failed to fetch executives:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadExecs(); }, []);

  const handleAddExec = async () => {
    if (!newExec.name || !newExec.email) { setAddError('Name and email are required'); return; }
    setAdding(true);
    setAddError('');
    try {
      await createExecutive(newExec);
      setShowAddModal(false);
      setNewExec({ name: '', email: '', phone: '', region: '', role: 'executive' });
      await loadExecs();
    } catch (err) {
      setAddError((err as Error).message);
    } finally {
      setAdding(false);
    }
  };

  const openEditModal = (exec: Executive) => {
    setEditExec(exec);
    setEditForm({ name: exec.name, email: exec.email, phone: exec.phone || '', region: exec.region || '' });
    setEditError('');
    setEditSuccess('');
  };

  const handleEditExec = async () => {
    if (!editExec) return;
    if (!editForm.name || !editForm.email) { setEditError('Name and email are required'); return; }
    setEditing(true);
    setEditError('');
    setEditSuccess('');
    try {
      await updateExecutive({ id: editExec.id, ...editForm });
      setEditSuccess('Profile updated successfully');
      await loadExecs();
    } catch (err) {
      setEditError((err as Error).message);
    } finally {
      setEditing(false);
    }
  };

  const handleResetPassword = async () => {
    if (!editExec) return;
    if (!confirm('Reset password to default? The user will need to login with the default password.')) return;
    setEditing(true);
    setEditError('');
    setEditSuccess('');
    try {
      const result = await updateExecutive({ id: editExec.id, resetPassword: true });
      setEditSuccess(result.message || 'Password reset successfully');
    } catch (err) {
      setEditError((err as Error).message);
    } finally {
      setEditing(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center">
        <svg className="animate-spin h-8 w-8 text-teal-600 mx-auto mb-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <circle cx="12" cy="12" r="10" strokeOpacity="0.2" /><path d="M4 12a8 8 0 018-8" />
        </svg>
        <p className="text-sm text-slate-500">Loading executives...</p>
      </div>
    );
  }

  const totalReports = executives.reduce((acc, e) => acc + (e.total_reports || 0), 0);
  const totalCases = executives.reduce((acc, e) => acc + (e.total_cases || 0), 0);

  return (
    <div className="p-6 lg:p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-display font-bold text-navy-900">Field Executives</h1>
          <p className="text-sm text-slate-500 mt-1">Performance metrics and visit statistics for all field executives</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold transition-colors flex items-center gap-2"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
          Add User
        </button>
      </div>

      {/* Add Executive Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowAddModal(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-display font-bold text-navy-900 mb-4">Add New User</h2>
            {addError && <div className="mb-3 p-2 rounded-lg bg-red-50 border border-red-200 text-xs text-red-600">{addError}</div>}
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Role *</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setNewExec(p => ({...p, role: 'executive'}))}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-all ${
                      newExec.role === 'executive' ? 'bg-teal-600 text-white border-teal-600' : 'bg-white text-slate-600 border-slate-200'
                    }`}
                  >
                    Field Executive
                  </button>
                  <button
                    onClick={() => setNewExec(p => ({...p, role: 'admin'}))}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-all ${
                      newExec.role === 'admin' ? 'bg-navy-900 text-white border-navy-900' : 'bg-white text-slate-600 border-slate-200'
                    }`}
                  >
                    Admin (Dashboard)
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Full Name *</label>
                <input value={newExec.name} onChange={e => setNewExec(p => ({...p, name: e.target.value}))} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" placeholder="e.g. RAMESH PATIL" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Email *</label>
                <input value={newExec.email} onChange={e => setNewExec(p => ({...p, email: e.target.value}))} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" placeholder="e.g. ramesh@kospl.in" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Phone</label>
                <input value={newExec.phone} onChange={e => setNewExec(p => ({...p, phone: e.target.value}))} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" placeholder="+91 98765 43210" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Region</label>
                <input value={newExec.region} onChange={e => setNewExec(p => ({...p, region: e.target.value}))} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" placeholder="e.g. Pune" />
              </div>
            </div>
            <p className="text-[10px] text-slate-400 mt-3">
              Default password: {newExec.role === 'admin' ? 'Kospl@2026' : 'Field@2026'}
            </p>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowAddModal(false)} className="flex-1 py-2.5 rounded-xl bg-white border border-slate-200 text-sm font-semibold text-slate-700">Cancel</button>
              <button onClick={handleAddExec} disabled={adding} className={`flex-1 py-2.5 rounded-xl text-white text-sm font-semibold disabled:opacity-50 ${newExec.role === 'admin' ? 'bg-navy-900' : 'bg-teal-600'}`}>
                {adding ? 'Adding...' : newExec.role === 'admin' ? 'Add Admin' : 'Add Executive'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {editExec && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setEditExec(null)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-display font-bold text-navy-900 mb-1">Edit Profile</h2>
            <p className="text-xs text-slate-500 mb-4">ID: {editExec.id}</p>
            {editError && <div className="mb-3 p-2 rounded-lg bg-red-50 border border-red-200 text-xs text-red-600">{editError}</div>}
            {editSuccess && <div className="mb-3 p-2 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-600">{editSuccess}</div>}
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Full Name *</label>
                <input value={editForm.name} onChange={e => setEditForm(p => ({...p, name: e.target.value}))} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Email *</label>
                <input value={editForm.email} onChange={e => setEditForm(p => ({...p, email: e.target.value}))} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Phone</label>
                <input value={editForm.phone} onChange={e => setEditForm(p => ({...p, phone: e.target.value}))} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Region</label>
                <input value={editForm.region} onChange={e => setEditForm(p => ({...p, region: e.target.value}))} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setEditExec(null)} className="flex-1 py-2.5 rounded-xl bg-white border border-slate-200 text-sm font-semibold text-slate-700">Close</button>
              <button onClick={handleEditExec} disabled={editing} className="flex-1 py-2.5 rounded-xl bg-teal-600 text-white text-sm font-semibold disabled:opacity-50">
                {editing ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
            <button onClick={handleResetPassword} disabled={editing} className="w-full mt-3 py-2 rounded-xl bg-amber-50 border border-amber-200 text-xs font-semibold text-amber-700 hover:bg-amber-100 transition-colors disabled:opacity-50">
              Reset Password to Default
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <SummaryCard label="Total Executives" value={executives.length.toString()} />
        <SummaryCard label="Total Cases" value={totalCases.toLocaleString()} />
        <SummaryCard label="Total Reports" value={totalReports.toLocaleString()} />
        <SummaryCard label="Active" value={executives.filter(e => e.is_active).length.toString()} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {executives.map((exec) => (
          <div key={exec.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-navy-900 flex items-center justify-center text-sm font-bold text-white">
                  {exec.avatar}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-display font-bold text-navy-900">{exec.name}</h3>
                    {exec.role === 'admin' && (
                      <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-navy-900 text-white">Admin</span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500">{exec.region} &middot; {exec.id}</p>
                </div>
              </div>
              <button
                onClick={() => openEditModal(exec)}
                className="w-8 h-8 rounded-full flex items-center justify-center bg-slate-100 hover:bg-teal-100 text-slate-400 hover:text-teal-600 transition-colors"
                title="Edit Profile"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
              </button>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-4">
              <Link href={`/cases?executive=${encodeURIComponent(exec.name)}`} className="text-center p-2 rounded-lg bg-slate-50 hover:bg-blue-50 hover:ring-1 hover:ring-blue-200 transition-all cursor-pointer block">
                <p className="text-lg font-bold text-navy-900">{exec.total_cases || 0}</p>
                <p className="text-[9px] uppercase tracking-wider text-slate-400 font-semibold">Cases</p>
              </Link>
              <Link href={`/reports?executive=${encodeURIComponent(exec.name)}`} className="text-center p-2 rounded-lg bg-slate-50 hover:bg-teal-50 hover:ring-1 hover:ring-teal-200 transition-all cursor-pointer block">
                <p className="text-lg font-bold text-teal-600">{exec.total_reports || 0}</p>
                <p className="text-[9px] uppercase tracking-wider text-slate-400 font-semibold">Reports</p>
              </Link>
              <Link href={`/reports?executive=${encodeURIComponent(exec.name)}`} className="text-center p-2 rounded-lg bg-slate-50 hover:bg-emerald-50 hover:ring-1 hover:ring-emerald-200 transition-all cursor-pointer block">
                <p className="text-lg font-bold text-emerald-600">{exec.approved_reports || 0}</p>
                <p className="text-[9px] uppercase tracking-wider text-slate-400 font-semibold">Approved</p>
              </Link>
            </div>

            <div>
              <div className="flex items-center justify-between text-[10px] mb-1.5">
                <span className="text-slate-400 font-semibold uppercase tracking-wider">Completion Rate</span>
                <span className="text-navy-900 font-bold">
                  {exec.total_reports > 0 ? Math.round(((exec.approved_reports || 0) / exec.total_reports) * 100) : 0}%
                </span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden flex">
                <div className="bg-emerald-500 rounded-full" style={{ width: `${exec.total_reports > 0 ? ((exec.approved_reports || 0) / exec.total_reports) * 100 : 0}%` }} />
                <div className="bg-red-400 rounded-full" style={{ width: `${exec.total_reports > 0 ? ((exec.rejected_reports || 0) / exec.total_reports) * 100 : 0}%` }} />
              </div>
              <div className="flex items-center gap-3 mt-1.5 text-[10px]">
                <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />Approved: {exec.approved_reports || 0}</span>
                <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-red-400" />Rejected: {exec.rejected_reports || 0}</span>
                <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-slate-300" />Pending: {exec.pending_reports || 0}</span>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-100 flex items-center gap-4">
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" />
                </svg>
                {exec.phone}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
      <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold mb-1">{label}</p>
      <p className="text-2xl font-display font-bold text-navy-900">{value}</p>
    </div>
  );
}
