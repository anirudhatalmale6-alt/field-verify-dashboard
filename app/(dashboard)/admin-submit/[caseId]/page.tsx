'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { submitReport, uploadPhotos, getExecutives } from '@/lib/api-client';

interface CaseInfo {
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
  executive_id: string;
  executive_name?: string;
}

interface PhotoItem {
  file: File;
  preview: string;
  label: string;
}

const HOUSE_TYPES = ['KACCHA', 'PUCCA', 'SEMI PUCCA', 'APARTMENT', 'BUNGALOW', 'FLAT', 'CHAWL', 'INDEPENDENT HOUSE', 'OTHERS'];
const OWNERSHIP_OPTIONS = ['OWNED', 'RENTED', 'COMPANY PROVIDED', 'OTHERS'];
const OFFICE_OWNERSHIP_OPTIONS = ['OWNED', 'RENTED', 'SHARED'];
const COMPANY_BOARD_OPTIONS = ['YES - SEEN', 'NO - NOT SEEN'];
const SPOUSE_OCC_OPTIONS = ['HOUSEWIFE', 'SALARIED', 'SELF EMPLOYED', 'BUSINESS', 'STUDENT', 'OTHER'];

export default function AdminSubmitPage() {
  const params = useParams();
  const router = useRouter();
  const caseId = params.caseId as string;

  const [caseInfo, setCaseInfo] = useState<CaseInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [executives, setExecutives] = useState<{ id: string; name: string }[]>([]);
  const [selectedExecId, setSelectedExecId] = useState<string>('');

  const [form, setForm] = useState({
    fir_reference_number: '',
    customer_name: '',
    address_confirmed: false,
    person_met: '',
    landmark: '',
    rvr_or_bvr: 'RVR',
    address: '',
    location: '',
    contact_number: '',
    dob_or_age: '',
    area_of_house: 'NORMAL',
    type_of_house: [] as string[],
    area_in_sqft: '',
    other_house_type: '',
    ownership_details: 'OWNED',
    other_ownership: '',
    rented_owner_name: '',
    staying_years: '',
    family_members: '',
    earning_members: '',
    spouse_occupation: '',
    spouse_occupation_details: '',
    customer_occ_category: 'SALARIED',
    company_name: '',
    company_address: '',
    designation: '',
    years_working: '',
    business_name_address: '',
    office_ownership: '',
    nature_of_business: '',
    years_in_business: '',
    office_location: '',
    office_area_sqft: '',
    office_setup_seen: '',
    employees_seen: '',
    company_name_board: '',
    tpc_neighbour_name: '',
    special_remarks: '',
  });

  useEffect(() => {
    Promise.all([
      fetch(`/api/cases?id=${caseId}`).then(r => r.json()),
      getExecutives(),
    ]).then(([caseData, execData]) => {
      if (caseData.case) {
        setCaseInfo(caseData.case);
        setSelectedExecId(caseData.case.executive_id || '');
        let autoRvrBvr = 'RVR';
        if (caseData.case.customer_category === 'OFFICE') autoRvrBvr = 'BVR';
        else if (caseData.case.customer_category === 'HOME') autoRvrBvr = 'RVR';
        setForm(prev => ({
          ...prev,
          fir_reference_number: caseData.case.fir_no || '',
          customer_name: caseData.case.customer_name || '',
          address: caseData.case.address || '',
          location: caseData.case.location || '',
          contact_number: caseData.case.contact_number || '',
          rvr_or_bvr: autoRvrBvr,
        }));
      }
      if (execData.executives) {
        setExecutives(execData.executives);
      }
    }).catch(() => {}).finally(() => setLoading(false));
  }, [caseId]);

  const updateField = (field: string, value: unknown) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const toggleHouseType = (type: string) => {
    setForm(prev => ({
      ...prev,
      type_of_house: prev.type_of_house.includes(type)
        ? prev.type_of_house.filter(t => t !== type)
        : [...prev.type_of_house, type],
    }));
  };

  const handlePhotoAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const newPhotos: PhotoItem[] = [];
    for (let i = 0; i < files.length; i++) {
      newPhotos.push({
        file: files[i],
        preview: URL.createObjectURL(files[i]),
        label: `Photo ${photos.length + i + 1}`,
      });
    }
    setPhotos(prev => [...prev, ...newPhotos]);
    e.target.value = '';
  };

  const removePhoto = (idx: number) => {
    setPhotos(prev => {
      const p = [...prev];
      URL.revokeObjectURL(p[idx].preview);
      p.splice(idx, 1);
      return p;
    });
  };

  const handleSubmit = async () => {
    if (!caseInfo) return;
    if (!selectedExecId) {
      alert('Please select a field executive before submitting.');
      return;
    }
    setSubmitting(true);
    try {
      // Process OTHERS values
      let typeOfHouse = [...form.type_of_house];
      if (typeOfHouse.includes('OTHERS') && form.other_house_type) {
        typeOfHouse = typeOfHouse.map(t => t === 'OTHERS' ? `OTHERS - ${form.other_house_type}` : t);
      }
      let ownership = form.ownership_details;
      if (ownership === 'OTHERS' && form.other_ownership) {
        ownership = `OTHERS - ${form.other_ownership}`;
      }

      const reportData = {
        case_id: caseId,
        executive_id: selectedExecId,
        ...form,
        type_of_house: typeOfHouse,
        ownership_details: ownership,
        latitude: null,
        longitude: null,
      };

      const result = await submitReport(reportData);

      // Upload photos if any
      if (photos.length > 0 && result.id) {
        const files = photos.map(p => p.file);
        const labels = photos.map(p => p.label);
        const coords = photos.map(() => ({ lat: 0, lng: 0 }));
        await uploadPhotos(result.id, files, labels, coords);
      }

      alert('Report submitted successfully!');
      router.push('/reports');
    } catch (err) {
      alert('Failed to submit: ' + (err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center">
        <svg className="animate-spin h-8 w-8 text-teal-600 mx-auto mb-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <circle cx="12" cy="12" r="10" strokeOpacity="0.2" /><path d="M4 12a8 8 0 018-8" />
        </svg>
        <p className="text-sm text-slate-500">Loading case...</p>
      </div>
    );
  }

  if (!caseInfo) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-xl font-display font-bold text-navy-900 mb-2">Case Not Found</h2>
        <Link href="/cases" className="text-sm text-teal-600 hover:underline">Back to Cases</Link>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-[1000px]">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-slate-400 mb-4">
        <Link href="/cases" className="hover:text-teal-600">Cases</Link>
        <span>/</span>
        <span className="text-navy-900 font-medium">Admin Submit — {caseInfo.fir_no}</span>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-display font-bold text-navy-900">Submit Report (Admin)</h1>
          <p className="text-xs text-slate-500 mt-1">{caseInfo.bank_name} &middot; {caseInfo.purpose_of_loan} &middot; {caseInfo.finance_amount}</p>
        </div>
        <Link href="/cases" className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-sm font-medium text-slate-700 hover:border-slate-300">
          Cancel
        </Link>
      </div>

      {/* Case Info Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div><span className="text-[10px] uppercase text-slate-400 font-semibold block">Customer</span>{caseInfo.customer_name}</div>
          <div><span className="text-[10px] uppercase text-slate-400 font-semibold block">FIR No</span>{caseInfo.fir_no}</div>
          <div><span className="text-[10px] uppercase text-slate-400 font-semibold block">Address</span>{caseInfo.address}</div>
        </div>
        <div className="mt-3 pt-3 border-t border-blue-200">
          <label className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold mb-1 block">Field Executive *</label>
          <select
            value={selectedExecId}
            onChange={e => setSelectedExecId(e.target.value)}
            className="w-full max-w-xs px-3 py-2 rounded-lg border border-blue-300 bg-white text-sm font-medium focus:ring-2 focus:ring-teal-500 focus:outline-none"
          >
            <option value="">— Select Executive —</option>
            {executives.map(ex => (
              <option key={ex.id} value={ex.id}>{ex.name} ({ex.id})</option>
            ))}
          </select>
          {!selectedExecId && <p className="text-[10px] text-red-500 mt-1">Please select a field executive to submit this report under</p>}
        </div>
      </div>

      {/* Form Sections */}
      <div className="space-y-6">
        {/* Section 1: Initial Info */}
        <Section title="Section 1: Initial Information">
          <div className="grid grid-cols-2 gap-4">
            <Field label="FIR Reference Number" value={form.fir_reference_number} onChange={v => updateField('fir_reference_number', v)} />
            <Field label="Customer Name" value={form.customer_name} onChange={v => updateField('customer_name', v)} />
          </div>
          <div className="mt-4">
            <label className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold mb-2 block">Address Confirmed</label>
            <div className="flex gap-3">
              <button onClick={() => updateField('address_confirmed', true)}
                className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all ${form.address_confirmed ? 'bg-emerald-600 text-white' : 'bg-white border border-slate-200 text-slate-600'}`}>
                YES
              </button>
              <button onClick={() => updateField('address_confirmed', false)}
                className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all ${!form.address_confirmed ? 'bg-red-600 text-white' : 'bg-white border border-slate-200 text-slate-600'}`}>
                NO
              </button>
            </div>
          </div>
        </Section>

        {/* Section 2: Location */}
        {form.address_confirmed && (
          <Section title="Section 2: Location & Residence">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold mb-1 block">Person Met</label>
                <div className="flex gap-2">
                  <button onClick={() => updateField('person_met', form.person_met === 'SELF' ? '' : 'SELF')}
                    className={`px-6 py-2 rounded-lg text-xs font-semibold transition-all ${form.person_met === 'SELF' ? 'bg-teal-600 text-white' : 'bg-white border border-slate-200 text-slate-600'}`}>
                    SELF
                  </button>
                  <input type="text" placeholder="Name & Relation (if other than self)"
                    value={form.person_met === 'SELF' ? '' : form.person_met}
                    onChange={e => updateField('person_met', e.target.value)}
                    disabled={form.person_met === 'SELF'}
                    className="flex-1 px-3 py-2 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none disabled:bg-slate-50 disabled:text-slate-400" />
                </div>
              </div>
              <Field label="Landmark" value={form.landmark} onChange={v => updateField('landmark', v)} />
              <div>
                <label className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold mb-1 block">RVR or BVR</label>
                <div className="flex gap-2">
                  {['RVR', 'BVR', 'RESI CUM OFFICE'].map(o => (
                    <button key={o} onClick={() => updateField('rvr_or_bvr', o)}
                      className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${form.rvr_or_bvr === o ? 'bg-teal-600 text-white' : 'bg-white border border-slate-200 text-slate-600'}`}>
                      {o}
                    </button>
                  ))}
                </div>
              </div>
              <Field label="Address" value={form.address} onChange={v => updateField('address', v)} />
              <Field label="Location" value={form.location} onChange={v => updateField('location', v)} />
              <Field label="Contact Number" value={form.contact_number} onChange={v => updateField('contact_number', v)} />
            </div>
          </Section>
        )}

        {/* Section 3: House Details (RVR only) */}
        {form.address_confirmed && form.rvr_or_bvr !== 'BVR' && (
          <Section title="Section 3: House Details">
            <div className="grid grid-cols-2 gap-4">
              <Field label="DOB / Approx Age" value={form.dob_or_age} onChange={v => updateField('dob_or_age', v)} />
              <div>
                <label className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold mb-1 block">Area of House</label>
                <div className="flex gap-2">
                  {['NORMAL', 'PREMIUM', 'SLUM'].map(o => (
                    <button key={o} onClick={() => updateField('area_of_house', o)}
                      className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${form.area_of_house === o ? 'bg-teal-600 text-white' : 'bg-white border border-slate-200 text-slate-600'}`}>
                      {o}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="mt-4">
              <label className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold mb-2 block">Type of House</label>
              <div className="flex flex-wrap gap-2">
                {HOUSE_TYPES.map(t => (
                  <button key={t} onClick={() => toggleHouseType(t)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${form.type_of_house.includes(t) ? 'bg-teal-600 text-white' : 'bg-white border border-slate-200 text-slate-600'}`}>
                    {t}
                  </button>
                ))}
              </div>
              {form.type_of_house.includes('OTHERS') && (
                <input type="text" placeholder="Specify house type..." value={form.other_house_type}
                  onChange={e => updateField('other_house_type', e.target.value)}
                  className="mt-2 w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none" />
              )}
            </div>
            <div className="grid grid-cols-2 gap-4 mt-4">
              <Field label="Area in Sqft" value={form.area_in_sqft} onChange={v => updateField('area_in_sqft', v)} />
              <div>
                <label className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold mb-1 block">Ownership Details</label>
                <div className="flex gap-2">
                  {OWNERSHIP_OPTIONS.map(o => (
                    <button key={o} onClick={() => updateField('ownership_details', o)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${form.ownership_details === o ? 'bg-teal-600 text-white' : 'bg-white border border-slate-200 text-slate-600'}`}>
                      {o}
                    </button>
                  ))}
                </div>
                {form.ownership_details === 'OTHERS' && (
                  <input type="text" placeholder="Specify ownership..." value={form.other_ownership}
                    onChange={e => updateField('other_ownership', e.target.value)}
                    className="mt-2 w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none" />
                )}
              </div>
            </div>
          </Section>
        )}

        {/* Section 4: Rental & Duration (RVR only) */}
        {form.address_confirmed && form.rvr_or_bvr !== 'BVR' && (
          <Section title="Section 4: Rental & Duration">
            <div className="grid grid-cols-2 gap-4">
              {form.ownership_details === 'RENTED' && (
                <Field label="Rented Owner Name" value={form.rented_owner_name} onChange={v => updateField('rented_owner_name', v)} />
              )}
              <Field label="Staying Years" value={form.staying_years} onChange={v => updateField('staying_years', v)} />
              <Field label="Family Members" value={form.family_members} onChange={v => updateField('family_members', v)} />
              <Field label="Earning Members" value={form.earning_members} onChange={v => updateField('earning_members', v)} />
            </div>
          </Section>
        )}

        {/* Section 5: Occupation */}
        {form.address_confirmed && (
          <Section title="Section 5: Occupation">
            <div className="grid grid-cols-2 gap-4">
              {form.rvr_or_bvr !== 'BVR' && (
                <>
                  <div>
                    <label className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold mb-1 block">Spouse Occupation</label>
                    <select value={form.spouse_occupation} onChange={e => updateField('spouse_occupation', e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none">
                      <option value="">Select</option>
                      {SPOUSE_OCC_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </div>
                  {form.spouse_occupation === 'OTHER' && (
                    <Field label="Spouse Occupation Details" value={form.spouse_occupation_details} onChange={v => updateField('spouse_occupation_details', v)} />
                  )}
                </>
              )}
              <div>
                <label className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold mb-1 block">Customer Category</label>
                <div className="flex gap-2">
                  {['SALARIED', 'BUSINESSMAN'].map(o => (
                    <button key={o} onClick={() => updateField('customer_occ_category', o)}
                      className={`px-6 py-2 rounded-lg text-xs font-semibold transition-all ${form.customer_occ_category === o ? 'bg-teal-600 text-white' : 'bg-white border border-slate-200 text-slate-600'}`}>
                      {o}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </Section>
        )}

        {/* Section 6: Employment (Salaried) */}
        {form.address_confirmed && form.customer_occ_category === 'SALARIED' && (
          <Section title="Section 6: Employment (Salaried)">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Company Name" value={form.company_name} onChange={v => updateField('company_name', v)} />
              <Field label="Company Address" value={form.company_address} onChange={v => updateField('company_address', v)} />
              <Field label="Designation" value={form.designation} onChange={v => updateField('designation', v)} />
              <Field label="Years Working" value={form.years_working} onChange={v => updateField('years_working', v)} />
              {/* Office fields only for BVR — not needed for RVR home verification */}
              {form.rvr_or_bvr === 'BVR' && (
                <>
                  <div>
                    <label className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold mb-1 block">Office Setup Seen</label>
                    <div className="flex gap-2">
                      {['YES', 'NO'].map(o => (
                        <button key={o} onClick={() => updateField('office_setup_seen', o)}
                          className={`px-6 py-2 rounded-lg text-xs font-semibold transition-all ${form.office_setup_seen === o ? 'bg-teal-600 text-white' : 'bg-white border border-slate-200 text-slate-600'}`}>
                          {o}
                        </button>
                      ))}
                    </div>
                  </div>
                  <Field label="Employees Seen" value={form.employees_seen} onChange={v => updateField('employees_seen', v)} />
                  <div>
                    <label className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold mb-1 block">Company Name Board</label>
                    <select value={form.company_name_board} onChange={e => updateField('company_name_board', e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none">
                      <option value="">Select</option>
                      {COMPANY_BOARD_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </div>
                </>
              )}
            </div>
          </Section>
        )}

        {/* Section 7: Business */}
        {form.address_confirmed && form.customer_occ_category === 'BUSINESSMAN' && (
          <Section title="Section 7: Business Details">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Business Name & Address" value={form.business_name_address} onChange={v => updateField('business_name_address', v)} />
              <div>
                <label className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold mb-1 block">Office Ownership</label>
                <select value={form.office_ownership} onChange={e => updateField('office_ownership', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none">
                  <option value="">Select</option>
                  {OFFICE_OWNERSHIP_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
              <Field label="Nature of Business" value={form.nature_of_business} onChange={v => updateField('nature_of_business', v)} />
              <Field label="Years in Business" value={form.years_in_business} onChange={v => updateField('years_in_business', v)} />
              <Field label="Office Location" value={form.office_location} onChange={v => updateField('office_location', v)} />
              <Field label="Office Area (Sqft)" value={form.office_area_sqft} onChange={v => updateField('office_area_sqft', v)} />
              <div>
                <label className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold mb-1 block">Office Setup Seen</label>
                <div className="flex gap-2">
                  {['YES', 'NO'].map(o => (
                    <button key={o} onClick={() => updateField('office_setup_seen', o)}
                      className={`px-6 py-2 rounded-lg text-xs font-semibold transition-all ${form.office_setup_seen === o ? 'bg-teal-600 text-white' : 'bg-white border border-slate-200 text-slate-600'}`}>
                      {o}
                    </button>
                  ))}
                </div>
              </div>
              <Field label="Employees Seen" value={form.employees_seen} onChange={v => updateField('employees_seen', v)} />
              <div>
                <label className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold mb-1 block">Company Name Board</label>
                <select value={form.company_name_board} onChange={e => updateField('company_name_board', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none">
                  <option value="">Select</option>
                  {COMPANY_BOARD_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
            </div>
          </Section>
        )}

        {/* TPC & Remarks */}
        <Section title="TPC & Remarks">
          <div className="grid grid-cols-2 gap-4">
            <Field label="TPC / Neighbour Name" value={form.tpc_neighbour_name} onChange={v => updateField('tpc_neighbour_name', v)} />
          </div>
          <div className="mt-4">
            <label className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold mb-1 block">Special Remarks</label>
            <textarea value={form.special_remarks} onChange={e => updateField('special_remarks', e.target.value)}
              rows={3} className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none resize-vertical" />
          </div>
        </Section>

        {/* Photos */}
        <Section title={`Photos (${photos.length})`}>
          <input type="file" accept="image/*" multiple ref={fileInputRef} onChange={handlePhotoAdd} className="hidden" />
          <button onClick={() => fileInputRef.current?.click()}
            className="px-4 py-2 rounded-xl bg-teal-50 border border-teal-200 text-xs font-semibold text-teal-700 hover:bg-teal-100 transition-colors flex items-center gap-2">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21,15 16,10 5,21" />
            </svg>
            Add Photos
          </button>
          {photos.length > 0 && (
            <div className="grid grid-cols-4 gap-3 mt-3">
              {photos.map((p, i) => (
                <div key={i} className="relative rounded-lg overflow-hidden border border-slate-200">
                  <img src={p.preview} alt={p.label} className="w-full h-[120px] object-cover" />
                  <div className="absolute top-1 right-1">
                    <button onClick={() => removePhoto(i)} className="w-5 h-5 bg-red-500 text-white rounded-full text-[10px] flex items-center justify-center hover:bg-red-600">&times;</button>
                  </div>
                  <input type="text" value={p.label} onChange={e => {
                    const n = [...photos];
                    n[i] = { ...n[i], label: e.target.value };
                    setPhotos(n);
                  }} className="w-full px-2 py-1 text-[10px] border-t border-slate-200 focus:outline-none" />
                </div>
              ))}
            </div>
          )}
        </Section>

        {/* Submit */}
        <div className="flex items-center gap-4 pt-4 border-t border-slate-200">
          <button
            onClick={handleSubmit}
            disabled={submitting || !form.customer_name || !selectedExecId}
            className="px-8 py-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {submitting ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <circle cx="12" cy="12" r="10" strokeOpacity="0.2" /><path d="M4 12a8 8 0 018-8" />
                </svg>
                Submitting...
              </>
            ) : (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20,6 9,17 4,12" /></svg>
                Submit Report
              </>
            )}
          </button>
          <Link href="/cases" className="text-sm text-slate-500 hover:text-slate-700">Cancel</Link>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
      <h3 className="font-display font-bold text-navy-900 mb-4 flex items-center gap-2">
        <div className="w-1.5 h-5 bg-teal-600 rounded-full" />
        {title}
      </h3>
      {children}
    </div>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold mb-1 block">{label}</label>
      <input type="text" value={value} onChange={e => onChange(e.target.value)}
        className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none" />
    </div>
  );
}
