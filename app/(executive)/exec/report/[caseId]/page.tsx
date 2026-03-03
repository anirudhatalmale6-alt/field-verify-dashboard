'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { submitReport, uploadPhotos } from '@/lib/api-client';

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
}

interface PhotoItem {
  file: File;
  preview: string;
  label: string;
  lat: number | null;
  lng: number | null;
}

const HOUSE_TYPES = ['KACCHA', 'PUCCA', 'SEMI PUCCA', 'APARTMENT', 'BUNGALOW', 'FLAT', 'CHAWL'];

export default function VerificationFormPage() {
  const params = useParams();
  const router = useRouter();
  const caseId = params.caseId as string;

  const [caseInfo, setCaseInfo] = useState<CaseInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [currentSection, setCurrentSection] = useState(0);
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [gpsStatus, setGpsStatus] = useState<'pending' | 'acquired' | 'error'>('pending');
  const [currentCoords, setCurrentCoords] = useState<{ lat: number; lng: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Form state — all 10 sections
  const [form, setForm] = useState({
    // Section 1
    fir_report_given_by: '',
    fir_reference_number: '',
    customer_name: '',
    address_confirmed: false,
    // Section 2
    person_met: '',
    landmark: '',
    rvr_or_bvr: 'RVR',
    address: '',
    location: '',
    contact_number: '',
    // Section 3
    dob_or_age: '',
    area_of_house: 'NORMAL',
    type_of_house: [] as string[],
    area_in_sqft: '',
    ownership_details: 'OWNED',
    // Section 4
    rented_owner_name: '',
    staying_years: '',
    family_members: '',
    earning_members: '',
    // Section 5
    spouse_occupation: '',
    spouse_occupation_details: '',
    customer_occ_category: 'SALARIED',
    // Section 6
    company_name: '',
    company_address: '',
    designation: '',
    years_working: '',
    // Section 7
    business_name_address: '',
    office_ownership: '',
    nature_of_business: '',
    years_in_business: '',
    // Office
    office_location: '',
    office_area_sqft: '',
    office_setup_seen: '',
    employees_seen: '',
    // Section 8
    company_name_board: '',
    // Section 9
    tpc_neighbour_name: '',
    // Section 10
    special_remarks: '',
  });

  // Fetch case info
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/cases?search=${caseId}`, { credentials: 'include' });
        const data = await res.json();
        if (data.cases && data.cases.length > 0) {
          const c = data.cases.find((x: CaseInfo) => x.id === caseId) || data.cases[0];
          setCaseInfo(c);
          // Pre-fill from case
          setForm(prev => ({
            ...prev,
            customer_name: c.customer_name || '',
            address: c.address || '',
            location: c.location || '',
            contact_number: c.contact_number || '',
            fir_reference_number: c.fir_no || '',
          }));
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    })();
  }, [caseId]);

  // Get GPS
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setCurrentCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          setGpsStatus('acquired');
        },
        () => setGpsStatus('error'),
        { enableHighAccuracy: true }
      );
    }
  }, []);

  const updateForm = (field: string, value: unknown) => {
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

  const handlePhotoCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const newPhotos: PhotoItem[] = Array.from(files).map(file => ({
      file,
      preview: URL.createObjectURL(file),
      label: `Photo ${photos.length + 1}`,
      lat: currentCoords?.lat || null,
      lng: currentCoords?.lng || null,
    }));
    setPhotos(prev => [...prev, ...newPhotos]);
    e.target.value = '';
  };

  const removePhoto = (idx: number) => {
    setPhotos(prev => {
      URL.revokeObjectURL(prev[idx].preview);
      return prev.filter((_, i) => i !== idx);
    });
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      // Submit the report
      const reportData = {
        case_id: caseId,
        ...form,
        latitude: currentCoords?.lat || null,
        longitude: currentCoords?.lng || null,
      };
      const result = await submitReport(reportData);

      // Upload photos if any
      if (photos.length > 0 && result.id) {
        await uploadPhotos(
          result.id,
          photos.map(p => p.file),
          photos.map(p => p.label),
          photos.map(p => ({ lat: p.lat || 0, lng: p.lng || 0 }))
        );
      }

      alert('Report submitted successfully!');
      router.push('/exec/cases');
    } catch (err) {
      alert('Failed to submit: ' + (err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 text-center">
        <svg className="animate-spin h-8 w-8 text-teal-600 mx-auto mb-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <circle cx="12" cy="12" r="10" strokeOpacity="0.2" /><path d="M4 12a8 8 0 018-8" />
        </svg>
        <p className="text-xs text-slate-400">Loading case...</p>
      </div>
    );
  }

  if (!caseInfo) {
    return (
      <div className="p-6 text-center">
        <p className="text-sm text-slate-500">Case not found</p>
      </div>
    );
  }

  const sections = [
    { title: 'Case & Initial Info', icon: '1' },
    { title: 'Location & Residence', icon: '2' },
    { title: 'House Details', icon: '3' },
    { title: 'Rental & Duration', icon: '4' },
    { title: 'Occupation', icon: '5' },
    { title: 'Employment / Business', icon: '6' },
    { title: 'Office Verification', icon: '7' },
    { title: 'TPC & Remarks', icon: '8' },
    { title: 'Photos', icon: '9' },
    { title: 'Review & Submit', icon: '10' },
  ];

  return (
    <div className="px-4 py-4">
      {/* Case Header */}
      <div className="bg-navy-900 text-white rounded-xl p-4 mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[9px] bg-teal-600 px-2 py-0.5 rounded-full font-bold uppercase">{caseInfo.customer_category}</span>
          <span className="text-[9px] text-slate-400">{caseInfo.fir_no}</span>
        </div>
        <h2 className="text-lg font-bold">{caseInfo.customer_name}</h2>
        <p className="text-xs text-slate-300 mt-0.5">{caseInfo.address}</p>
        <p className="text-xs text-teal-400 font-medium">{caseInfo.location}</p>
        <div className="flex items-center gap-3 mt-2 text-[10px] text-slate-400">
          <span>{caseInfo.bank_name}</span>
          <span>{caseInfo.purpose_of_loan}</span>
        </div>
      </div>

      {/* GPS Status */}
      <div className={`flex items-center gap-2 px-3 py-2 rounded-lg mb-4 text-xs ${
        gpsStatus === 'acquired' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
        gpsStatus === 'error' ? 'bg-red-50 text-red-700 border border-red-200' :
        'bg-amber-50 text-amber-700 border border-amber-200'
      }`}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" />
        </svg>
        {gpsStatus === 'acquired' && currentCoords
          ? `GPS: ${currentCoords.lat.toFixed(4)}, ${currentCoords.lng.toFixed(4)}`
          : gpsStatus === 'error'
          ? 'GPS unavailable — location will not be tagged'
          : 'Acquiring GPS...'
        }
      </div>

      {/* Section Progress */}
      <div className="flex items-center gap-1 mb-4 overflow-x-auto pb-1">
        {sections.map((s, i) => (
          <button
            key={i}
            onClick={() => setCurrentSection(i)}
            className={`flex-shrink-0 w-7 h-7 rounded-full text-[10px] font-bold transition-all ${
              i === currentSection ? 'bg-teal-600 text-white scale-110 shadow-md' :
              i < currentSection ? 'bg-teal-100 text-teal-700' :
              'bg-slate-100 text-slate-400'
            }`}
          >
            {s.icon}
          </button>
        ))}
      </div>

      {/* Section Title */}
      <h3 className="text-sm font-bold text-navy-900 mb-3">
        {sections[currentSection].title}
      </h3>

      {/* SECTION 0: Case & Initial Info */}
      {currentSection === 0 && (
        <div className="space-y-3">
          <FormField label="FIR Report Given By" value={form.fir_report_given_by} onChange={v => updateForm('fir_report_given_by', v)} />
          <FormField label="FIR Reference Number" value={form.fir_reference_number} onChange={v => updateForm('fir_reference_number', v)} />
          <FormField label="Customer Name" value={form.customer_name} onChange={v => updateForm('customer_name', v)} />
          <div>
            <label className="block text-[10px] uppercase tracking-wider text-slate-500 font-semibold mb-1">Address Confirmed?</label>
            <div className="flex gap-3">
              <button
                onClick={() => updateForm('address_confirmed', true)}
                className={`flex-1 py-3 rounded-xl text-sm font-semibold border transition-all ${
                  form.address_confirmed ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-slate-600 border-slate-200'
                }`}
              >
                YES
              </button>
              <button
                onClick={() => updateForm('address_confirmed', false)}
                className={`flex-1 py-3 rounded-xl text-sm font-semibold border transition-all ${
                  !form.address_confirmed ? 'bg-red-600 text-white border-red-600' : 'bg-white text-slate-600 border-slate-200'
                }`}
              >
                NO
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 1: Location */}
      {currentSection === 1 && (
        <div className="space-y-3">
          <FormField label="Person Met" value={form.person_met} onChange={v => updateForm('person_met', v)} />
          <FormField label="Landmark" value={form.landmark} onChange={v => updateForm('landmark', v)} />
          <div>
            <label className="block text-[10px] uppercase tracking-wider text-slate-500 font-semibold mb-1">Whether RVR or BVR</label>
            <div className="flex gap-2">
              {['RVR', 'BVR', 'RESI CUM OFFICE'].map(opt => (
                <button
                  key={opt}
                  onClick={() => updateForm('rvr_or_bvr', opt)}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-semibold border transition-all ${
                    form.rvr_or_bvr === opt ? 'bg-teal-600 text-white border-teal-600' : 'bg-white text-slate-600 border-slate-200'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
          <FormField label="Address" value={form.address} onChange={v => updateForm('address', v)} multiline />
          <FormField label="Location" value={form.location} onChange={v => updateForm('location', v)} />
          <FormField label="Contact Number" value={form.contact_number} onChange={v => updateForm('contact_number', v)} type="tel" />
        </div>
      )}

      {/* SECTION 2: House Details */}
      {currentSection === 2 && (
        <div className="space-y-3">
          <FormField label="Date of Birth / Approx Age" value={form.dob_or_age} onChange={v => updateForm('dob_or_age', v)} />
          <div>
            <label className="block text-[10px] uppercase tracking-wider text-slate-500 font-semibold mb-1">Area of House</label>
            <div className="flex gap-2">
              {['NORMAL', 'SLUM', 'NEGATIVE AREA'].map(opt => (
                <button
                  key={opt}
                  onClick={() => updateForm('area_of_house', opt)}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-semibold border transition-all ${
                    form.area_of_house === opt ? 'bg-teal-600 text-white border-teal-600' : 'bg-white text-slate-600 border-slate-200'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-[10px] uppercase tracking-wider text-slate-500 font-semibold mb-1">Type of House (select all)</label>
            <div className="flex flex-wrap gap-2">
              {HOUSE_TYPES.map(t => (
                <button
                  key={t}
                  onClick={() => toggleHouseType(t)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                    form.type_of_house.includes(t) ? 'bg-teal-600 text-white border-teal-600' : 'bg-white text-slate-600 border-slate-200'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
          <FormField label="Area in Sqft" value={form.area_in_sqft} onChange={v => updateForm('area_in_sqft', v)} />
          <div>
            <label className="block text-[10px] uppercase tracking-wider text-slate-500 font-semibold mb-1">Ownership Details</label>
            <div className="flex gap-2">
              {['OWNED', 'RENTED', 'COMPANY PROVIDED'].map(opt => (
                <button
                  key={opt}
                  onClick={() => updateForm('ownership_details', opt)}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-semibold border transition-all ${
                    form.ownership_details === opt ? 'bg-teal-600 text-white border-teal-600' : 'bg-white text-slate-600 border-slate-200'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SECTION 3: Rental & Duration */}
      {currentSection === 3 && (
        <div className="space-y-3">
          {form.ownership_details === 'RENTED' && (
            <FormField label="Rented Owner Name" value={form.rented_owner_name} onChange={v => updateForm('rented_owner_name', v)} />
          )}
          <FormField label="Staying Since (Years)" value={form.staying_years} onChange={v => updateForm('staying_years', v)} />
          <FormField label="No. of Family Members" value={form.family_members} onChange={v => updateForm('family_members', v)} />
          <FormField label="No. of Earning Members" value={form.earning_members} onChange={v => updateForm('earning_members', v)} />
        </div>
      )}

      {/* SECTION 4: Occupation */}
      {currentSection === 4 && (
        <div className="space-y-3">
          <FormField label="Spouse Occupation" value={form.spouse_occupation} onChange={v => updateForm('spouse_occupation', v)} />
          <FormField label="Spouse Occupation Details" value={form.spouse_occupation_details} onChange={v => updateForm('spouse_occupation_details', v)} />
          <div>
            <label className="block text-[10px] uppercase tracking-wider text-slate-500 font-semibold mb-1">Customer Occupation Category</label>
            <div className="flex gap-2">
              {['SALARIED', 'BUSINESSMAN'].map(opt => (
                <button
                  key={opt}
                  onClick={() => updateForm('customer_occ_category', opt)}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-all ${
                    form.customer_occ_category === opt ? 'bg-teal-600 text-white border-teal-600' : 'bg-white text-slate-600 border-slate-200'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SECTION 5: Employment / Business */}
      {currentSection === 5 && (
        <div className="space-y-3">
          {form.customer_occ_category === 'SALARIED' ? (
            <>
              <FormField label="Company Name" value={form.company_name} onChange={v => updateForm('company_name', v)} />
              <FormField label="Company Address" value={form.company_address} onChange={v => updateForm('company_address', v)} multiline />
              <FormField label="Designation" value={form.designation} onChange={v => updateForm('designation', v)} />
              <FormField label="Years Working" value={form.years_working} onChange={v => updateForm('years_working', v)} />
            </>
          ) : (
            <>
              <FormField label="Business Name & Address" value={form.business_name_address} onChange={v => updateForm('business_name_address', v)} multiline />
              <FormField label="Office Ownership" value={form.office_ownership} onChange={v => updateForm('office_ownership', v)} />
              <FormField label="Nature of Business" value={form.nature_of_business} onChange={v => updateForm('nature_of_business', v)} />
              <FormField label="Years in Business" value={form.years_in_business} onChange={v => updateForm('years_in_business', v)} />
            </>
          )}
        </div>
      )}

      {/* SECTION 6: Office Verification */}
      {currentSection === 6 && (
        <div className="space-y-3">
          <FormField label="Office Location / Address" value={form.office_location} onChange={v => updateForm('office_location', v)} multiline />
          <FormField label="Office Area (Sqft)" value={form.office_area_sqft} onChange={v => updateForm('office_area_sqft', v)} />
          <div>
            <label className="block text-[10px] uppercase tracking-wider text-slate-500 font-semibold mb-1">Office Setup Seen?</label>
            <div className="flex gap-2">
              {['YES', 'NO'].map(opt => (
                <button
                  key={opt}
                  onClick={() => updateForm('office_setup_seen', opt)}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-all ${
                    form.office_setup_seen === opt ? 'bg-teal-600 text-white border-teal-600' : 'bg-white text-slate-600 border-slate-200'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
          <FormField label="No. of Employees Seen" value={form.employees_seen} onChange={v => updateForm('employees_seen', v)} />
          <FormField label="Company Name Board" value={form.company_name_board} onChange={v => updateForm('company_name_board', v)} />
        </div>
      )}

      {/* SECTION 7: TPC & Remarks */}
      {currentSection === 7 && (
        <div className="space-y-3">
          <FormField label="TPC / Neighbour Name" value={form.tpc_neighbour_name} onChange={v => updateForm('tpc_neighbour_name', v)} />
          <FormField label="Special Remarks" value={form.special_remarks} onChange={v => updateForm('special_remarks', v)} multiline rows={4} />
        </div>
      )}

      {/* SECTION 8: Photos */}
      {currentSection === 8 && (
        <div className="space-y-3">
          <p className="text-xs text-slate-500 mb-2">
            Capture photos from camera or upload from gallery. Photos will be GPS-tagged automatically.
          </p>

          {/* Camera + Gallery buttons */}
          <div className="flex gap-3">
            <button
              onClick={() => cameraInputRef.current?.click()}
              className="flex-1 flex flex-col items-center gap-2 py-4 bg-teal-50 border-2 border-dashed border-teal-300 rounded-xl text-teal-700 active:bg-teal-100 transition-colors"
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" /><circle cx="12" cy="13" r="4" />
              </svg>
              <span className="text-xs font-semibold">Camera</span>
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 flex flex-col items-center gap-2 py-4 bg-blue-50 border-2 border-dashed border-blue-300 rounded-xl text-blue-700 active:bg-blue-100 transition-colors"
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21,15 16,10 5,21" />
              </svg>
              <span className="text-xs font-semibold">Gallery</span>
            </button>
          </div>

          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handlePhotoCapture}
            className="hidden"
          />
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handlePhotoCapture}
            className="hidden"
          />

          {/* Photo Grid */}
          {photos.length > 0 && (
            <div className="grid grid-cols-3 gap-2">
              {photos.map((photo, idx) => (
                <div key={idx} className="relative rounded-lg overflow-hidden border border-slate-200">
                  <img src={photo.preview} alt={photo.label} className="w-full h-24 object-cover" />
                  {photo.lat && (
                    <div className="absolute top-1 left-1 bg-navy-900/70 text-white text-[8px] px-1 py-0.5 rounded flex items-center gap-0.5">
                      <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                      </svg>
                      GPS
                    </div>
                  )}
                  <button
                    onClick={() => removePhoto(idx)}
                    className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-[10px]"
                  >
                    ×
                  </button>
                  <div className="p-1">
                    <input
                      value={photo.label}
                      onChange={e => {
                        const updated = [...photos];
                        updated[idx] = { ...updated[idx], label: e.target.value };
                        setPhotos(updated);
                      }}
                      className="w-full text-[10px] text-slate-600 bg-transparent outline-none"
                      placeholder="Label..."
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          <p className="text-[10px] text-slate-400 text-center">{photos.length} photo(s) selected</p>
        </div>
      )}

      {/* SECTION 9: Review & Submit */}
      {currentSection === 9 && (
        <div className="space-y-3">
          <div className="bg-white rounded-xl border border-slate-100 p-4 shadow-sm">
            <h4 className="text-xs font-bold text-navy-900 mb-2">Review Summary</h4>
            <div className="space-y-2 text-xs">
              <ReviewRow label="Customer" value={form.customer_name} />
              <ReviewRow label="Address Confirmed" value={form.address_confirmed ? 'YES' : 'NO'} color={form.address_confirmed ? 'text-emerald-600' : 'text-red-600'} />
              <ReviewRow label="Type" value={form.rvr_or_bvr} />
              <ReviewRow label="Person Met" value={form.person_met || '—'} />
              <ReviewRow label="Location" value={form.location || '—'} />
              <ReviewRow label="Occupation" value={form.customer_occ_category} />
              <ReviewRow label="Photos" value={`${photos.length} photo(s)`} />
              <ReviewRow label="GPS" value={currentCoords ? `${currentCoords.lat.toFixed(4)}, ${currentCoords.lng.toFixed(4)}` : 'Not available'} />
              <ReviewRow label="Remarks" value={form.special_remarks || 'None'} />
            </div>
          </div>

          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full py-4 bg-teal-600 hover:bg-teal-700 text-white text-base font-bold rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <circle cx="12" cy="12" r="10" strokeOpacity="0.3" /><path d="M4 12a8 8 0 018-8" />
                </svg>
                Submitting...
              </>
            ) : (
              <>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20,6 9,17 4,12" />
                </svg>
                Submit Verification Report
              </>
            )}
          </button>
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="flex gap-3 mt-6">
        {currentSection > 0 && (
          <button
            onClick={() => setCurrentSection(currentSection - 1)}
            className="flex-1 py-3 bg-white border border-slate-200 text-slate-700 text-sm font-semibold rounded-xl"
          >
            Previous
          </button>
        )}
        {currentSection < sections.length - 1 && (
          <button
            onClick={() => setCurrentSection(currentSection + 1)}
            className="flex-1 py-3 bg-navy-900 text-white text-sm font-semibold rounded-xl"
          >
            Next
          </button>
        )}
      </div>
    </div>
  );
}

function FormField({ label, value, onChange, type = 'text', multiline = false, rows = 2 }: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  multiline?: boolean;
  rows?: number;
}) {
  return (
    <div>
      <label className="block text-[10px] uppercase tracking-wider text-slate-500 font-semibold mb-1">{label}</label>
      {multiline ? (
        <textarea
          value={value}
          onChange={e => onChange(e.target.value)}
          rows={rows}
          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={e => onChange(e.target.value)}
          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
        />
      )}
    </div>
  );
}

function ReviewRow({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-slate-500">{label}</span>
      <span className={`font-medium ${color || 'text-navy-900'}`}>{value}</span>
    </div>
  );
}
