'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { getMe, reportLocation } from '@/lib/api-client';

export default function ExecutiveLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<{ name: string; role: string; avatar: string } | null>(null);
  const [locStatus, setLocStatus] = useState<'pending' | 'active' | 'denied' | 'unavailable'>('pending');

  useEffect(() => {
    getMe()
      .then(data => {
        if (data.user.role !== 'executive') {
          router.push('/dashboard');
          return;
        }
        setUser(data.user);
      })
      .catch(() => {
        router.push('/login');
      });
  }, [router]);

  // Report location every 60 seconds
  const locationRef = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => {
    if (!user) return;
    if (!('geolocation' in navigator)) {
      setLocStatus('unavailable');
      return;
    }

    const sendLocation = () => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLocStatus('active');
          reportLocation(pos.coords.latitude, pos.coords.longitude).catch(() => {});
        },
        (err) => {
          if (err.code === 1) setLocStatus('denied'); // PERMISSION_DENIED
          else setLocStatus('unavailable');
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 }
      );
    };

    // Check permission first, then start tracking
    if (navigator.permissions) {
      navigator.permissions.query({ name: 'geolocation' }).then(result => {
        if (result.state === 'denied') {
          setLocStatus('denied');
        } else {
          sendLocation();
        }
        result.onchange = () => {
          if (result.state === 'denied') setLocStatus('denied');
          else sendLocation();
        };
      }).catch(() => sendLocation());
    } else {
      sendLocation();
    }

    locationRef.current = setInterval(sendLocation, 60000);
    return () => { if (locationRef.current) clearInterval(locationRef.current); };
  }, [user]);

  const requestLocation = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLocStatus('active');
          reportLocation(pos.coords.latitude, pos.coords.longitude).catch(() => {});
        },
        (err) => {
          if (err.code === 1) {
            setLocStatus('denied');
            alert('Location permission denied. Please enable location in your browser settings (tap the lock icon in the address bar) and reload the page.');
          }
        },
        { enableHighAccuracy: true, timeout: 15000 }
      );
    }
  };

  if (!user) return null;

  const tabs = [
    { href: '/exec/cases', label: 'My Cases', icon: CasesIcon },
    { href: '/exec/chat', label: 'Chat', icon: ExecChatIcon },
    { href: '/exec/profile', label: 'Profile', icon: ProfileIcon },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Header */}
      <header className="bg-navy-900 text-white px-4 py-3 flex items-center justify-between safe-area-top sticky top-0 z-50">
        <div className="flex items-center gap-2.5">
          <img src="/kospl-logo.jpg" alt="KOSPL" className="h-8 w-auto rounded bg-white p-0.5" />
          <div>
            <h1 className="text-sm font-bold">Koteshwari Onfield</h1>
            <p className="text-[9px] text-teal-400 tracking-wider uppercase">Field Executive</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Location status dot */}
          <div className={`w-2.5 h-2.5 rounded-full ${
            locStatus === 'active' ? 'bg-emerald-400 animate-pulse' :
            locStatus === 'denied' ? 'bg-red-400' :
            locStatus === 'pending' ? 'bg-amber-400 animate-pulse' :
            'bg-slate-500'
          }`} title={locStatus === 'active' ? 'Location active' : locStatus === 'denied' ? 'Location denied' : 'Location pending'} />
          <div className="w-8 h-8 rounded-full bg-teal-600/30 flex items-center justify-center text-[10px] font-bold text-teal-400">
            {user.avatar || user.name.split(' ').map(n => n[0]).join('')}
          </div>
        </div>
      </header>

      {/* Location permission banner */}
      {locStatus === 'denied' && (
        <div className="bg-red-50 border-b border-red-200 px-4 py-2.5 flex items-center gap-2">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" />
          </svg>
          <p className="text-xs text-red-700 flex-1">Location access required for tracking.</p>
          <button onClick={requestLocation} className="text-[10px] font-bold text-red-600 bg-red-100 px-2.5 py-1 rounded-lg">
            Enable
          </button>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 pb-20">
        {children}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 safe-area-bottom z-50">
        <div className="flex">
          {tabs.map(tab => {
            const isActive = pathname.startsWith(tab.href);
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`flex-1 flex flex-col items-center gap-0.5 py-2.5 transition-colors ${
                  isActive ? 'text-teal-600' : 'text-slate-400'
                }`}
              >
                <tab.icon active={isActive} />
                <span className={`text-[10px] font-semibold ${isActive ? 'text-teal-600' : 'text-slate-400'}`}>
                  {tab.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

function CasesIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? '#0d9488' : '#94a3b8'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <line x1="3" y1="8" x2="21" y2="8" />
      <line x1="9" y1="4" x2="9" y2="8" />
    </svg>
  );
}

function ExecChatIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? '#0d9488' : '#94a3b8'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
    </svg>
  );
}

function ProfileIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? '#0d9488' : '#94a3b8'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}
