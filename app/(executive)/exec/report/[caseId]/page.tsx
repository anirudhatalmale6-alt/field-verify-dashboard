'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
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

interface SectionDef {
  key: string;
  title: string;
}

const HOUSE_TYPES = ['KACCHA', 'PUCCA', 'SEMI PUCCA', 'APARTMENT', 'BUNGALOW', 'FLAT', 'CHAWL', 'INDEPENDENT HOUSE', 'OTHERS'];

const OFFICE_OWNERSHIP_OPTIONS = ['OWNED', 'RENTED', 'SHARED'];
const COMPANY_BOARD_OPTIONS = ['YES - SEEN', 'NO - NOT SEEN'];
const SPOUSE_OCC_OPTIONS = ['HOUSEWIFE', 'UNMARRIED', 'SALARIED', 'SELF EMPLOYED', 'BUSINESS', 'STUDENT', 'OTHER'];

const MIN_PHOTOS = 4;

const STORAGE_KEY_PREFIX = 'kospl_form_';

export default function VerificationFormPage() {
  const params = useParams();
  const router = useRouter();
  const caseId = params.caseId as string;
  const storageKey = STORAGE_KEY_PREFIX + caseId;

  const [caseInfo, setCaseInfo] = useState<CaseInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [currentSectionIdx, setCurrentSectionIdx] = useState(0);
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [gpsStatus, setGpsStatus] = useState<'pending' | 'acquired' | 'error'>('pending');
  const [currentCoords, setCurrentCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const watchIdRef = useRef<number | null>(null);
  const formInitialized = useRef(false);

  // ── Prevent pull-to-refresh on this page ──
  useEffect(() => {
    document.body.style.overscrollBehaviorY = 'contain';
    const meta = document.createElement('meta');
    meta.name = 'viewport';
    // Ensure no bounce on iOS
    const existing = document.querySelector('meta[name="viewport"]');
    if (existing) {
      existing.setAttribute('content', 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no');
    }
    return () => {
      document.body.style.overscrollBehaviorY = '';
      if (existing) {
        existing.setAttribute('content', 'width=device-width, initial-scale=1');
      }
    };
  }, []);

  // Form state — all sections
  const [form, setForm] = useState({
    // Section 1: Case & Initial Info
    fir_reference_number: '',
    customer_name: '',
    address_confirmed: false,
    // Section 2: Location & Residence
    person_met: '',
    landmark: '',
    rvr_or_bvr: 'RVR',
    address: '',
    location: '',
    contact_number: '',
    // Section 3: House Details
    dob_or_age: '',
    area_of_house: 'NORMAL',
    type_of_house: [] as string[],
    area_in_sqft: '',
    other_house_type: '',
    ownership_details: 'OWNED',
    other_ownership: '',
    // Section 4: Rental & Duration
    rented_owner_name: '',
    staying_years: '',
    family_members: '',
    earning_members: '',
    // Section 5: Occupation
    spouse_occupation: '',
    spouse_occupation_details: '',
    customer_occ_category: 'SALARIED',
    // Section 6: Employment (Salaried)
    company_name: '',
    company_address: '',
    designation: '',
    years_working: '',
    // Section 7: Business
    business_name_address: '',
    office_ownership: '',
    nature_of_business: '',
    years_in_business: '',
    office_location: '',
    office_area_sqft: '',
    office_setup_seen: '',
    employees_seen: '',
    company_name_board: '',
    // Section 8: TPC & Remarks
    tpc_neighbour_name: '',
    special_remarks: '',
    // Photos & Review are UI-only sections
  });

  // ── Auto-save form data to sessionStorage ──
  useEffect(() => {
    if (!formInitialized.current) return; // Don't save before restoring
    try {
      const saveData = { form, currentSectionIdx };
      sessionStorage.setItem(storageKey, JSON.stringify(saveData));
    } catch { /* ignore storage errors */ }
  }, [form, currentSectionIdx, storageKey]);

  // ── Restore form data from sessionStorage on mount ──
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.form) {
          setForm(prev => ({ ...prev, ...parsed.form }));
        }
        if (typeof parsed.currentSectionIdx === 'number') {
          setCurrentSectionIdx(parsed.currentSectionIdx);
        }
      }
    } catch { /* ignore parse errors */ }
    formInitialized.current = true;
  }, [storageKey]);

  // ── Dynamic sections based on form conditions ──
  const activeSections: SectionDef[] = useMemo(() => {
    const sections: SectionDef[] = [];

    // Section 1 always present
    sections.push({ key: 'case_info', title: 'Case & Initial Info' });

    // If address NOT confirmed, skip everything up to TPC & Remarks
    if (!form.address_confirmed) {
      sections.push({ key: 'tpc_remarks', title: 'TPC & Remarks' });
      sections.push({ key: 'photos', title: 'Photos' });
      sections.push({ key: 'review', title: 'Review & Submit' });
      return sections;
    }

    // Section 2 always present when address confirmed
    sections.push({ key: 'location', title: 'Location & Residence' });

    // Section 3 & 4: House Details + Rental — only if RVR or RESI CUM OFFICE (skip for BVR)
    if (form.rvr_or_bvr !== 'BVR') {
      sections.push({ key: 'house_details', title: 'House Details' });
      // If DOOR LOCK, skip remaining sections — go straight to TPC & Remarks
      if (form.ownership_details === 'DOOR LOCK') {
        sections.push({ key: 'tpc_remarks', title: 'TPC & Remarks' });
        sections.push({ key: 'photos', title: 'Photos' });
        sections.push({ key: 'review', title: 'Review & Submit' });
        return sections;
      }
      sections.push({ key: 'rental_duration', title: 'Rental & Duration' });
    }

    // Section 5: Occupation always present when address confirmed
    sections.push({ key: 'occupation', title: 'Occupation' });

    // Section 6 or 7 based on occupation category
    if (form.customer_occ_category === 'SALARIED') {
      sections.push({ key: 'employment', title: 'Employment (Salaried)' });
    } else {
      sections.push({ key: 'business', title: 'Business Details' });
    }

    // Section 8: TPC & Remarks
    sections.push({ key: 'tpc_remarks', title: 'TPC & Remarks' });

    // Photos
    sections.push({ key: 'photos', title: 'Photos' });

    // Review & Submit
    sections.push({ key: 'review', title: 'Review & Submit' });

    return sections;
  }, [form.address_confirmed, form.rvr_or_bvr, form.customer_occ_category, form.ownership_details]);

  // Clamp currentSectionIdx when activeSections shrinks
  useEffect(() => {
    if (currentSectionIdx >= activeSections.length) {
      setCurrentSectionIdx(activeSections.length - 1);
    }
  }, [activeSections.length, currentSectionIdx]);

  const currentSectionKey = activeSections[currentSectionIdx]?.key ?? 'case_info';

  // ── Fetch case info ──
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/cases?search=${caseId}`, { credentials: 'include' });
        const data = await res.json();
        if (data.cases && data.cases.length > 0) {
          const c = data.cases.find((x: CaseInfo) => x.id === caseId) || data.cases[0];
          setCaseInfo(c);
          // Auto-set rvr_or_bvr based on customer_category
          let autoRvrBvr = 'RVR';
          if (c.customer_category === 'OFFICE') autoRvrBvr = 'BVR';
          else if (c.customer_category === 'HOME') autoRvrBvr = 'RVR';
          setForm(prev => ({
            ...prev,
            customer_name: c.customer_name || '',
            address: c.address || '',
            location: c.location || '',
            contact_number: c.contact_number || '',
            fir_reference_number: c.fir_no || '',
            rvr_or_bvr: autoRvrBvr,
          }));
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    })();
  }, [caseId]);

  // ── GPS: watchPosition for better accuracy ──
  const startGpsWatch = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
    }
    setGpsStatus('pending');
    setCurrentCoords(null);
    setGpsAccuracy(null);

    if (!navigator.geolocation) {
      setGpsStatus('error');
      return;
    }

    const timeoutId = setTimeout(() => {
      // If still pending after 15s, mark error
      setGpsStatus(prev => (prev === 'pending' ? 'error' : prev));
    }, 15000);

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        clearTimeout(timeoutId);
        const { latitude, longitude, accuracy } = pos.coords;
        // Accept position, prefer better accuracy
        if (gpsAccuracy === null || accuracy < (gpsAccuracy ?? Infinity)) {
          setCurrentCoords({ lat: latitude, lng: longitude });
          setGpsAccuracy(accuracy);
        }
        setGpsStatus('acquired');
      },
      () => {
        clearTimeout(timeoutId);
        setGpsStatus('error');
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
    );

    return () => {
      clearTimeout(timeoutId);
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, [gpsAccuracy]);

  useEffect(() => {
    const cleanup = startGpsWatch();
    return cleanup;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Cleanup watch on unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  const retryGps = () => {
    startGpsWatch();
  };

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

  // Stamp GPS coordinates + timestamp on photo using canvas
  const stampPhoto = (file: File, lat: number | null, lng: number | null): Promise<{ stampedFile: File; preview: string }> => {
    return new Promise((resolve) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(img, 0, 0);

        // Stamp bar at bottom
        const barHeight = Math.max(img.height * 0.06, 50);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
        ctx.fillRect(0, img.height - barHeight, img.width, barHeight);

        const fontSize = Math.max(barHeight * 0.32, 14);
        ctx.font = `bold ${fontSize}px sans-serif`;
        ctx.fillStyle = '#FFFFFF';
        ctx.textBaseline = 'middle';

        const now = new Date();
        const dateStr = now.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
        const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
        const timestamp = `${dateStr} ${timeStr}`;

        const pad = fontSize * 0.5;
        const lineY1 = img.height - barHeight * 0.62;
        const lineY2 = img.height - barHeight * 0.28;

        ctx.fillText(timestamp, pad, lineY1);

        if (lat !== null && lng !== null) {
          const gpsText = `GPS: ${lat.toFixed(6)}, ${lng.toFixed(6)}`;
          ctx.fillText(gpsText, pad, lineY2);

          // KOSPL branding on right
          ctx.textAlign = 'right';
          ctx.font = `${fontSize * 0.8}px sans-serif`;
          ctx.fillStyle = 'rgba(255,255,255,0.7)';
          ctx.fillText('KOSPL Field Verify', img.width - pad, lineY2);
          ctx.textAlign = 'left';
        } else {
          ctx.fillStyle = '#FF6B6B';
          ctx.fillText('GPS: Not Available', pad, lineY2);
        }

        canvas.toBlob((blob) => {
          URL.revokeObjectURL(url);
          if (blob) {
            const stampedFile = new File([blob], file.name, { type: 'image/jpeg' });
            const preview = URL.createObjectURL(blob);
            resolve({ stampedFile, preview });
          } else {
            resolve({ stampedFile: file, preview: URL.createObjectURL(file) });
          }
        }, 'image/jpeg', 0.9);
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        resolve({ stampedFile: file, preview: URL.createObjectURL(file) });
      };
      img.src = url;
    });
  };

  const handlePhotoCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const captureWithGps = async (lat: number | null, lng: number | null) => {
      const fileArr = Array.from(files);
      const stampedPhotos: PhotoItem[] = [];
      for (let i = 0; i < fileArr.length; i++) {
        const { stampedFile, preview } = await stampPhoto(fileArr[i], lat, lng);
        stampedPhotos.push({
          file: stampedFile,
          preview,
          label: `Photo ${photos.length + i + 1}`,
          lat,
          lng,
        });
      }
      setPhotos(prev => [...prev, ...stampedPhotos]);
      e.target.value = '';
    };

    if (currentCoords) {
      captureWithGps(currentCoords.lat, currentCoords.lng);
    } else if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          setCurrentCoords({ lat: latitude, lng: longitude });
          setGpsStatus('acquired');
          captureWithGps(latitude, longitude);
        },
        () => {
          captureWithGps(null, null);
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 30000 }
      );
    } else {
      captureWithGps(null, null);
    }
  };

  const removePhoto = (idx: number) => {
    setPhotos(prev => {
      URL.revokeObjectURL(prev[idx].preview);
      return prev.filter((_, i) => i !== idx);
    });
  };

  const canSubmit = photos.length >= MIN_PHOTOS;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      // Merge "OTHERS" text into the respective fields before submitting
      const finalForm = { ...form };
      if (finalForm.type_of_house.includes('OTHERS') && finalForm.other_house_type) {
        finalForm.type_of_house = finalForm.type_of_house.map(t =>
          t === 'OTHERS' ? `OTHERS: ${finalForm.other_house_type}` : t
        );
      }
      if (finalForm.ownership_details === 'OTHERS' && finalForm.other_ownership) {
        finalForm.ownership_details = `OTHERS: ${finalForm.other_ownership}`;
      }
      const reportData = {
        case_id: caseId,
        ...finalForm,
        latitude: currentCoords?.lat || null,
        longitude: currentCoords?.lng || null,
      };
      const result = await submitReport(reportData);

      if (photos.length > 0 && result.id) {
        // Use latest GPS coords for photos that were captured without GPS
        const finalCoords = photos.map(p => ({
          lat: p.lat || currentCoords?.lat || 0,
          lng: p.lng || currentCoords?.lng || 0,
        }));
        await uploadPhotos(
          result.id,
          photos.map(p => p.file),
          photos.map(p => p.label),
          finalCoords
        );
      }

      // Clear saved form data after successful submission
      try { sessionStorage.removeItem(storageKey); } catch { /* ignore */ }
      alert('Report submitted successfully!');
      router.push('/exec/cases');
    } catch (err) {
      alert('Failed to submit: ' + (err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  // ── Loading / Error states ──
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

  return (
    <div className="px-4 py-4" style={{ overscrollBehaviorY: 'contain', touchAction: 'pan-y' }}>
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
        {/* Click-to-Call */}
        {caseInfo.contact_number && (
          <a
            href={`tel:${caseInfo.contact_number}`}
            className="inline-flex items-center gap-1.5 mt-2 px-3 py-1.5 bg-teal-600/20 border border-teal-500/30 rounded-lg text-teal-300 text-xs font-semibold active:bg-teal-600/40 transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" />
            </svg>
            {caseInfo.contact_number}
          </a>
        )}
      </div>

      {/* GPS Status */}
      <div className={`flex items-center justify-between px-3 py-2 rounded-lg mb-4 text-xs ${
        gpsStatus === 'acquired' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
        gpsStatus === 'error' ? 'bg-red-50 text-red-700 border border-red-200' :
        'bg-amber-50 text-amber-700 border border-amber-200'
      }`}>
        <div className="flex items-center gap-2">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" />
          </svg>
          <span>
            {gpsStatus === 'acquired' && currentCoords
              ? `GPS: ${currentCoords.lat.toFixed(4)}, ${currentCoords.lng.toFixed(4)}${gpsAccuracy ? ` (~${Math.round(gpsAccuracy)}m)` : ''}`
              : gpsStatus === 'error'
              ? 'GPS unavailable'
              : 'Acquiring GPS...'
            }
          </span>
        </div>
        {gpsStatus === 'error' && (
          <button
            onClick={retryGps}
            className="px-2.5 py-1 bg-red-600 text-white text-[10px] font-bold rounded-lg active:bg-red-700 transition-colors"
          >
            Retry GPS
          </button>
        )}
      </div>

      {/* Section Progress — dynamic, only shows applicable sections */}
      <div className="flex items-center gap-1 mb-4 overflow-x-auto pb-1">
        {activeSections.map((s, i) => (
          <button
            key={s.key}
            onClick={() => setCurrentSectionIdx(i)}
            className={`flex-shrink-0 w-7 h-7 rounded-full text-[10px] font-bold transition-all ${
              i === currentSectionIdx ? 'bg-teal-600 text-white scale-110 shadow-md' :
              i < currentSectionIdx ? 'bg-teal-100 text-teal-700' :
              'bg-slate-100 text-slate-400'
            }`}
          >
            {i + 1}
          </button>
        ))}
      </div>

      {/* Section Title */}
      <h3 className="text-sm font-bold text-navy-900 mb-3">
        {activeSections[currentSectionIdx]?.title}
      </h3>

      {/* ════════════════════════════════════════════════ */}
      {/* SECTION: Case & Initial Info                     */}
      {/* ════════════════════════════════════════════════ */}
      {currentSectionKey === 'case_info' && (
        <div className="space-y-3">
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
            {!form.address_confirmed && (
              <p className="text-[10px] text-amber-600 mt-1.5 font-medium">
                Address not confirmed — form will skip to TPC &amp; Remarks
              </p>
            )}
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════ */}
      {/* SECTION: Location & Residence                    */}
      {/* ════════════════════════════════════════════════ */}
      {currentSectionKey === 'location' && (
        <div className="space-y-3">
          <div>
            <label className="block text-[10px] uppercase tracking-wider text-slate-500 font-semibold mb-1">Person Met</label>
            <div className="flex gap-2">
              <button
                onClick={() => updateForm('person_met', form.person_met === 'SELF' ? '' : 'SELF')}
                className={`px-6 py-2.5 rounded-xl text-xs font-semibold border transition-all ${
                  form.person_met === 'SELF' ? 'bg-teal-600 text-white border-teal-600' : 'bg-white text-slate-600 border-slate-200'
                }`}
              >
                SELF
              </button>
              <input
                type="text"
                placeholder="Name & Relation (if other than self)"
                value={form.person_met === 'SELF' ? '' : form.person_met}
                onChange={e => updateForm('person_met', e.target.value)}
                disabled={form.person_met === 'SELF'}
                className="flex-1 px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:bg-slate-50 disabled:text-slate-400"
              />
            </div>
          </div>
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
            {form.rvr_or_bvr === 'BVR' && (
              <p className="text-[10px] text-amber-600 mt-1.5 font-medium">
                BVR selected — House Details &amp; Rental sections will be skipped
              </p>
            )}
          </div>
          <FormField label="Address" value={form.address} onChange={v => updateForm('address', v)} multiline />
          <FormField label="Location" value={form.location} onChange={v => updateForm('location', v)} />
          <FormField label="Contact Number" value={form.contact_number} onChange={v => updateForm('contact_number', v)} type="tel" />
        </div>
      )}

      {/* ════════════════════════════════════════════════ */}
      {/* SECTION: House Details                           */}
      {/* ════════════════════════════════════════════════ */}
      {currentSectionKey === 'house_details' && (
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
          {form.type_of_house.includes('OTHERS') && (
            <FormField label="Other House Type (please specify)" value={form.other_house_type} onChange={v => updateForm('other_house_type', v)} />
          )}
          <FormField label="Area in Sqft" value={form.area_in_sqft} onChange={v => updateForm('area_in_sqft', v)} />
          <div>
            <label className="block text-[10px] uppercase tracking-wider text-slate-500 font-semibold mb-1">Ownership Details</label>
            <div className="flex flex-wrap gap-2">
              {['OWNED', 'RENTED', 'COMPANY PROVIDED', 'DOOR LOCK', 'OTHERS'].map(opt => (
                <button
                  key={opt}
                  onClick={() => {
                    updateForm('ownership_details', opt);
                    if (opt === 'DOOR LOCK') {
                      // Auto-fill TPC and remarks for Door Lock
                      setForm(prev => ({
                        ...prev,
                        ownership_details: opt,
                        tpc_neighbour_name: prev.tpc_neighbour_name || 'Door Locked — No TPC available',
                        special_remarks: prev.special_remarks
                          ? (prev.special_remarks.includes('DOOR LOCK') ? prev.special_remarks : prev.special_remarks + '\nDOOR LOCK — Premises was locked during visit.')
                          : 'DOOR LOCK — Premises was locked during visit.'
                      }));
                    }
                  }}
                  className={`px-4 py-2.5 rounded-xl text-xs font-semibold border transition-all ${
                    form.ownership_details === opt ? 'bg-teal-600 text-white border-teal-600' : 'bg-white text-slate-600 border-slate-200'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
          {form.ownership_details === 'OTHERS' && (
            <FormField label="Other Ownership (please specify)" value={form.other_ownership} onChange={v => updateForm('other_ownership', v)} />
          )}
        </div>
      )}

      {/* ════════════════════════════════════════════════ */}
      {/* SECTION: Rental & Duration                       */}
      {/* ════════════════════════════════════════════════ */}
      {currentSectionKey === 'rental_duration' && (
        <div className="space-y-3">
          {(form.ownership_details === 'RENTED' || form.ownership_details === 'OTHERS') && (
            <FormField label="Rented Owner Name" value={form.rented_owner_name} onChange={v => updateForm('rented_owner_name', v)} />
          )}
          <FormField label="Staying Since (Years)" value={form.staying_years} onChange={v => updateForm('staying_years', v)} />
          <FormField label="No. of Family Members" value={form.family_members} onChange={v => updateForm('family_members', v)} />
          <FormField label="No. of Earning Members" value={form.earning_members} onChange={v => updateForm('earning_members', v)} />
        </div>
      )}

      {/* ════════════════════════════════════════════════ */}
      {/* SECTION: Occupation                              */}
      {/* ════════════════════════════════════════════════ */}
      {currentSectionKey === 'occupation' && (
        <div className="space-y-3">
          {form.rvr_or_bvr !== 'BVR' && (
            <>
              <DropdownField
                label="Spouse Occupation"
                value={form.spouse_occupation}
                options={SPOUSE_OCC_OPTIONS}
                onChange={v => updateForm('spouse_occupation', v)}
              />
              <FormField label="Spouse Occupation Details" value={form.spouse_occupation_details} onChange={v => updateForm('spouse_occupation_details', v)} />
            </>
          )}
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
            <p className="text-[10px] text-slate-400 mt-1">
              {form.customer_occ_category === 'SALARIED'
                ? 'Next section: Employment (Salaried)'
                : 'Next section: Business Details'}
            </p>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════ */}
      {/* SECTION: Employment (Salaried)                   */}
      {/* ════════════════════════════════════════════════ */}
      {currentSectionKey === 'employment' && (
        <div className="space-y-3">
          <FormField label="Company Name" value={form.company_name} onChange={v => updateForm('company_name', v)} />
          <FormField label="Company Address" value={form.company_address} onChange={v => updateForm('company_address', v)} multiline />
          <FormField label="Designation" value={form.designation} onChange={v => updateForm('designation', v)} />
          <FormField label="Years Working" value={form.years_working} onChange={v => updateForm('years_working', v)} />
          {/* Office Setup & Employees — only show for BVR (not needed for RVR home verification) */}
          {form.rvr_or_bvr === 'BVR' && (
            <>
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
              <DropdownField
                label="Company Name Board"
                value={form.company_name_board}
                options={COMPANY_BOARD_OPTIONS}
                onChange={v => updateForm('company_name_board', v)}
              />
            </>
          )}
        </div>
      )}

      {/* ════════════════════════════════════════════════ */}
      {/* SECTION: Business Details                        */}
      {/* ════════════════════════════════════════════════ */}
      {currentSectionKey === 'business' && (
        <div className="space-y-3">
          <FormField label="Business Name & Address" value={form.business_name_address} onChange={v => updateForm('business_name_address', v)} multiline />
          <DropdownField
            label="Office Ownership"
            value={form.office_ownership}
            options={OFFICE_OWNERSHIP_OPTIONS}
            onChange={v => updateForm('office_ownership', v)}
          />
          <FormField label="Nature of Business" value={form.nature_of_business} onChange={v => updateForm('nature_of_business', v)} />
          <FormField label="Years in Business" value={form.years_in_business} onChange={v => updateForm('years_in_business', v)} />
          <FormField label="Office Location / Address" value={form.office_location} onChange={v => updateForm('office_location', v)} multiline />
          <FormField label="Office Area (Sqft)" value={form.office_area_sqft} onChange={v => updateForm('office_area_sqft', v)} />
          {/* Office Setup, Employees, Name Board — only show for BVR */}
          {form.rvr_or_bvr === 'BVR' && (
            <>
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
              <DropdownField
                label="Company Name Board"
                value={form.company_name_board}
                options={COMPANY_BOARD_OPTIONS}
                onChange={v => updateForm('company_name_board', v)}
              />
            </>
          )}
        </div>
      )}

      {/* ════════════════════════════════════════════════ */}
      {/* SECTION: TPC & Remarks                           */}
      {/* ════════════════════════════════════════════════ */}
      {currentSectionKey === 'tpc_remarks' && (
        <div className="space-y-3">
          <FormField label="TPC / Neighbour Name" value={form.tpc_neighbour_name} onChange={v => updateForm('tpc_neighbour_name', v)} />
          <VoiceRemarkField value={form.special_remarks} onChange={v => updateForm('special_remarks', v)} />
        </div>
      )}

      {/* ════════════════════════════════════════════════ */}
      {/* SECTION: Photos                                  */}
      {/* ════════════════════════════════════════════════ */}
      {currentSectionKey === 'photos' && (
        <div className="space-y-3">
          <p className="text-xs text-slate-500 mb-2">
            Capture photos from camera or upload from gallery. Photos will be GPS-tagged automatically.
          </p>

          {/* Min photos warning */}
          {photos.length < MIN_PHOTOS && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-50 text-amber-700 border border-amber-200 text-xs">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
              <span className="font-semibold">Minimum {MIN_PHOTOS} photos required.</span>
              <span>({photos.length}/{MIN_PHOTOS} uploaded)</span>
            </div>
          )}

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

      {/* ════════════════════════════════════════════════ */}
      {/* SECTION: Review & Submit                         */}
      {/* ════════════════════════════════════════════════ */}
      {currentSectionKey === 'review' && (
        <div className="space-y-3">
          <div className="bg-white rounded-xl border border-slate-100 p-4 shadow-sm">
            <h4 className="text-xs font-bold text-navy-900 mb-2">Review Summary</h4>
            <div className="space-y-2 text-xs">
              <ReviewRow label="Customer" value={form.customer_name} />
              <ReviewRow label="Address Confirmed" value={form.address_confirmed ? 'YES' : 'NO'} color={form.address_confirmed ? 'text-emerald-600' : 'text-red-600'} />
              <ReviewRow label="Type" value={form.rvr_or_bvr} />
              <ReviewRow label="Person Met" value={form.person_met || '---'} />
              <ReviewRow label="Location" value={form.location || '---'} />
              <ReviewRow label="Occupation" value={form.customer_occ_category} />
              {form.customer_occ_category === 'SALARIED' && (
                <>
                  <ReviewRow label="Company" value={form.company_name || '---'} />
                  <ReviewRow label="Designation" value={form.designation || '---'} />
                </>
              )}
              {form.customer_occ_category === 'BUSINESSMAN' && (
                <>
                  <ReviewRow label="Business" value={form.business_name_address || '---'} />
                  <ReviewRow label="Nature" value={form.nature_of_business || '---'} />
                </>
              )}
              <ReviewRow label="Photos" value={`${photos.length} photo(s)`} color={photos.length < MIN_PHOTOS ? 'text-red-600' : undefined} />
              <ReviewRow label="GPS" value={currentCoords ? `${currentCoords.lat.toFixed(4)}, ${currentCoords.lng.toFixed(4)}` : 'Not available'} />
              <ReviewRow label="Remarks" value={form.special_remarks || 'None'} />
            </div>
          </div>

          {/* Photos validation warning */}
          {photos.length < MIN_PHOTOS && (
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-red-50 text-red-700 border border-red-200 text-xs font-semibold">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
              </svg>
              Minimum {MIN_PHOTOS} photos required ({photos.length}/{MIN_PHOTOS} uploaded). Go back to Photos section to add more.
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={submitting || !canSubmit}
            className={`w-full py-4 text-white text-base font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${
              canSubmit
                ? 'bg-teal-600 hover:bg-teal-700 disabled:opacity-50'
                : 'bg-slate-400 cursor-not-allowed'
            }`}
          >
            {submitting ? (
              <>
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <circle cx="12" cy="12" r="10" strokeOpacity="0.3" /><path d="M4 12a8 8 0 018-8" />
                </svg>
                Submitting...
              </>
            ) : !canSubmit ? (
              <>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0110 0v4" />
                </svg>
                Minimum {MIN_PHOTOS} photos required
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
        {currentSectionIdx > 0 && (
          <button
            onClick={() => setCurrentSectionIdx(currentSectionIdx - 1)}
            className="flex-1 py-3 bg-white border border-slate-200 text-slate-700 text-sm font-semibold rounded-xl"
          >
            Previous
          </button>
        )}
        {currentSectionIdx < activeSections.length - 1 && (
          <button
            onClick={() => setCurrentSectionIdx(currentSectionIdx + 1)}
            className="flex-1 py-3 bg-navy-900 text-white text-sm font-semibold rounded-xl"
          >
            Next
          </button>
        )}
      </div>
    </div>
  );
}

// ── Reusable Components ──

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

function DropdownField({ label, value, options, onChange }: {
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="block text-[10px] uppercase tracking-wider text-slate-500 font-semibold mb-1">{label}</label>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 appearance-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'right 12px center',
        }}
      >
        <option value="">-- Select --</option>
        {options.map(opt => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
    </div>
  );
}

function VoiceRemarkField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  const uploadAndTranscribe = async (audioBlob: Blob, filename: string) => {
    setIsProcessing(true);
    setStatusMsg('Transcribing Marathi → English...');
    setErrorMsg('');

    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, filename);

      const res = await fetch('/api/transcribe', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });
      const data = await res.json();

      if (data.error) {
        setErrorMsg(data.error);
        return;
      }

      if (data.english) {
        const englishText = data.english;
        const marathiText = data.marathi || '';
        const newValue = value
          ? value + '\n' + englishText + (marathiText ? ` [मराठी: ${marathiText}]` : '')
          : englishText + (marathiText ? ` [मराठी: ${marathiText}]` : '');
        onChange(newValue);
        setStatusMsg('Transcription added!');
        setTimeout(() => setStatusMsg(''), 3000);
      } else if (data.marathi) {
        const newValue = value ? value + '\n[mr] ' + data.marathi : '[mr] ' + data.marathi;
        onChange(newValue);
        setStatusMsg('Added Marathi text (translation unavailable)');
        setTimeout(() => setStatusMsg(''), 3000);
      } else {
        setErrorMsg('No speech detected. Please speak clearly and try again.');
      }
    } catch {
      setErrorMsg('Transcription failed. Check internet and try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  // In-browser recording using MediaRecorder + getUserMedia
  const startRecording = async () => {
    setErrorMsg('');
    setStatusMsg('Requesting microphone...');

    // Check if MediaRecorder is available (PWA WebView may not support it)
    if (typeof MediaRecorder === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      setStatusMsg('');
      setErrorMsg('RECORDING_NOT_SUPPORTED');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true }
      });

      // Find a supported MIME type
      let mimeType = '';
      for (const type of ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg', '']) {
        if (!type || MediaRecorder.isTypeSupported(type)) {
          mimeType = type;
          break;
        }
      }

      const recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        stream.getTracks().forEach(t => t.stop());
        if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
        setIsRecording(false);
        setRecordingTime(0);

        if (chunksRef.current.length > 0) {
          const blob = new Blob(chunksRef.current, { type: mimeType });
          const ext = mimeType.includes('webm') ? 'webm' : 'mp4';
          uploadAndTranscribe(blob, `recording.${ext}`);
        }
      };

      recorder.onerror = () => {
        stream.getTracks().forEach(t => t.stop());
        if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
        setIsRecording(false);
        setRecordingTime(0);
        setErrorMsg('Recording failed. Try uploading an audio file instead.');
        setStatusMsg('');
      };

      mediaRecorderRef.current = recorder;
      recorder.start(1000);
      setIsRecording(true);
      setStatusMsg('Recording... Speak in Marathi now');

      setRecordingTime(0);
      timerRef.current = setInterval(() => {
        setRecordingTime(t => {
          if (t >= 59) {
            if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
              mediaRecorderRef.current.stop();
            }
            return 0;
          }
          return t + 1;
        });
      }, 1000);
    } catch {
      setStatusMsg('');
      setErrorMsg('MIC_BLOCKED');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    setStatusMsg('');
  };

  // File input handler — validates audio before uploading
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Check if file is audio
    const isAudio = file.type.startsWith('audio/') ||
      /\.(mp3|wav|ogg|m4a|aac|amr|3gp|wma|flac|opus|webm)$/i.test(file.name);
    if (!isAudio) {
      setErrorMsg('Please select an audio file (mp3, wav, m4a, etc). Not a photo or video.');
      e.target.value = '';
      return;
    }
    uploadAndTranscribe(file, file.name);
    e.target.value = '';
  };

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  // Open Chrome site settings for this domain
  const openMicSettings = () => {
    // Try to open Chrome site settings directly
    const url = window.location.origin;
    try {
      // Android Chrome intent to open site settings
      window.location.href = `intent://settings/content/microphone#Intent;scheme=chrome;package=com.android.chrome;end`;
    } catch {
      // Fallback: copy URL and show manual instructions
      if (navigator.clipboard) {
        navigator.clipboard.writeText(url);
      }
    }
  };

  return (
    <div>
      <label className="block text-[10px] uppercase tracking-wider text-slate-500 font-semibold mb-1">Special Remarks</label>
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        rows={4}
        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
        placeholder="Type or tap button below to speak in Marathi..."
      />

      {/* Hidden file input — NO accept/capture attrs to avoid camera showing on Android */}
      <input
        ref={audioInputRef}
        type="file"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Mic blocked — show detailed fix instructions */}
      {errorMsg === 'MIC_BLOCKED' && (
        <div className="mt-2 px-3 py-3 bg-amber-50 border border-amber-200 rounded-xl">
          <p className="text-xs text-amber-800 font-bold mb-2">Microphone is blocked. Enable it:</p>
          <div className="space-y-2 text-[11px] text-amber-900 leading-relaxed">
            <div className="flex gap-2">
              <span className="font-bold text-amber-600 shrink-0">Step 1:</span>
              <span>Open <strong>Chrome browser</strong> (not the app)</span>
            </div>
            <div className="flex gap-2">
              <span className="font-bold text-amber-600 shrink-0">Step 2:</span>
              <span>Go to <strong>app.kospl.in</strong></span>
            </div>
            <div className="flex gap-2">
              <span className="font-bold text-amber-600 shrink-0">Step 3:</span>
              <span>Tap the <strong>lock icon</strong> (left of URL bar)</span>
            </div>
            <div className="flex gap-2">
              <span className="font-bold text-amber-600 shrink-0">Step 4:</span>
              <span>Tap <strong>Permissions</strong> → Turn ON <strong>Microphone</strong></span>
            </div>
            <div className="flex gap-2">
              <span className="font-bold text-amber-600 shrink-0">Step 5:</span>
              <span>Come back to this app and tap &quot;Record&quot; again</span>
            </div>
          </div>
          <button
            type="button"
            onClick={openMicSettings}
            className="w-full mt-3 flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-600 text-white text-xs font-semibold rounded-xl active:bg-amber-700"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
              <polyline points="15 3 21 3 21 9" />
              <line x1="10" y1="14" x2="21" y2="3" />
            </svg>
            Open Chrome Settings
          </button>
          <button
            type="button"
            onClick={() => { setErrorMsg(''); }}
            className="w-full mt-1.5 text-[10px] text-amber-600 underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Recording not supported in PWA */}
      {errorMsg === 'RECORDING_NOT_SUPPORTED' && (
        <div className="mt-2 px-3 py-3 bg-amber-50 border border-amber-200 rounded-xl">
          <p className="text-xs text-amber-800 font-bold mb-2">Voice recording is not supported in this app mode.</p>
          <p className="text-[11px] text-amber-900 mb-2">Please use one of these alternatives:</p>
          <div className="space-y-2 text-[11px] text-amber-900">
            <p>1. Open <strong>app.kospl.in</strong> in Chrome browser instead of the home screen app</p>
            <p>2. Use the &quot;Upload Audio&quot; button below to record using your phone&apos;s voice recorder app first, then upload</p>
          </div>
          <button
            onClick={() => audioInputRef.current?.click()}
            className="mt-3 px-4 py-2 bg-amber-600 text-white text-xs font-bold rounded-lg w-full"
          >
            Upload Audio File Instead
          </button>
        </div>
      )}

      {/* Other errors */}
      {errorMsg && errorMsg !== 'MIC_BLOCKED' && errorMsg !== 'RECORDING_NOT_SUPPORTED' && (
        <div className="mt-1.5 px-3 py-2 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-xs text-red-600 font-medium">{errorMsg}</p>
        </div>
      )}

      {/* Status / Processing message */}
      {statusMsg && !errorMsg && (
        <div className="mt-1.5 px-3 py-2 bg-teal-50 border border-teal-200 rounded-lg">
          <p className="text-xs text-teal-600 font-medium flex items-center gap-2">
            {isProcessing && (
              <svg className="animate-spin h-3.5 w-3.5 text-teal-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="12" cy="12" r="10" strokeOpacity="0.2" /><path d="M4 12a8 8 0 018-8" />
              </svg>
            )}
            {statusMsg}
          </p>
        </div>
      )}

      {/* Recording timer */}
      {isRecording && (
        <div className="mt-1.5 px-3 py-2 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
          <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
          <p className="text-xs text-red-600 font-medium">Recording: {formatTime(recordingTime)}</p>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex flex-col gap-2 mt-2">
        {/* Record button — tries in-browser mic */}
        <button
          type="button"
          onClick={isRecording ? stopRecording : startRecording}
          disabled={isProcessing}
          className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
            isRecording
              ? 'bg-red-500 text-white animate-pulse shadow-lg shadow-red-200'
              : isProcessing
                ? 'bg-slate-100 text-slate-400 border border-slate-200'
                : 'bg-teal-500 text-white active:bg-teal-600 shadow-md shadow-teal-200'
          }`}
        >
          {isRecording ? (
            <>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <rect x="6" y="6" width="12" height="12" rx="2" />
              </svg>
              Stop & Transcribe ({formatTime(recordingTime)})
            </>
          ) : isProcessing ? (
            <>
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="12" cy="12" r="10" strokeOpacity="0.2" /><path d="M4 12a8 8 0 018-8" />
              </svg>
              Transcribing...
            </>
          ) : (
            <>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" />
                <path d="M19 10v2a7 7 0 01-14 0v-2" />
                <line x1="12" y1="19" x2="12" y2="23" />
                <line x1="8" y1="23" x2="16" y2="23" />
              </svg>
              Record Marathi Voice
            </>
          )}
        </button>

        {/* Upload audio file — always visible */}
        <button
          type="button"
          onClick={() => audioInputRef.current?.click()}
          disabled={isProcessing || isRecording}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-medium bg-slate-50 text-slate-600 border border-slate-200 active:bg-slate-100 disabled:opacity-40"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
          Upload Audio File
        </button>
        <p className="text-[9px] text-slate-400 text-center">Marathi voice → English text (v5)</p>
      </div>
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
