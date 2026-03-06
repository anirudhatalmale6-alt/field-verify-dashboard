'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { getMe, reportLocation, getChatContacts } from '@/lib/api-client';

export default function ExecutiveLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<{ name: string; role: string; avatar: string } | null>(null);
  const [locStatus, setLocStatus] = useState<'waiting' | 'active' | 'failed'>('waiting');
  const [locError, setLocError] = useState('');
  const watchRef = useRef<number | null>(null);

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

  // Start location tracking with watchPosition (continuous, more reliable)
  useEffect(() => {
    if (!user) return;

    if (!('geolocation' in navigator)) {
      setLocStatus('failed');
      setLocError('Geolocation not supported');
      return;
    }

    // Check if HTTPS
    if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
      setLocStatus('failed');
      setLocError('HTTPS required');
      return;
    }

    startTracking();

    return () => {
      if (watchRef.current !== null) {
        navigator.geolocation.clearWatch(watchRef.current);
      }
    };
  }, [user]);

  const startTracking = () => {
    setLocStatus('waiting');
    setLocError('');

    // Clear previous watch
    if (watchRef.current !== null) {
      navigator.geolocation.clearWatch(watchRef.current);
    }

    // Use watchPosition for continuous tracking
    watchRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        setLocStatus('active');
        setLocError('');
        reportLocation(pos.coords.latitude, pos.coords.longitude).catch(() => {});
      },
      (err) => {
        setLocStatus('failed');
        if (err.code === 1) setLocError('Permission denied — tap Allow when prompted');
        else if (err.code === 2) setLocError('Location unavailable — turn on GPS/Location in phone settings');
        else if (err.code === 3) setLocError('Location timeout — check GPS is enabled');
        else setLocError('Location error');
      },
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 60000 }
    );
  };

  const requestLocation = () => {
    // First try getCurrentPosition to trigger the permission prompt
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocStatus('active');
        setLocError('');
        reportLocation(pos.coords.latitude, pos.coords.longitude).catch(() => {});
        // Re-start watchPosition
        startTracking();
      },
      (err) => {
        setLocStatus('failed');
        if (err.code === 1) setLocError('Permission denied — tap Allow when prompted');
        else if (err.code === 2) setLocError('Turn on GPS/Location in phone settings');
        else setLocError('Location timeout — check GPS');
      },
      { enableHighAccuracy: false, timeout: 20000 }
    );
  };

  // Chat notification polling
  const [unreadChat, setUnreadChat] = useState(0);
  const prevUnread = useRef(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const pollUnread = useCallback(async () => {
    try {
      const data = await getChatContacts();
      const total = data.totalUnread || 0;
      setUnreadChat(total);
      if (total > prevUnread.current && prevUnread.current >= 0 && !pathname.startsWith('/exec/chat')) {
        if (!audioRef.current) audioRef.current = new Audio('/notify.wav');
        audioRef.current.play().catch(() => {});
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('New message', { body: 'You have a new chat message from office', icon: '/icon-192x192.png' });
        }
      }
      prevUnread.current = total;
    } catch {}
  }, [pathname]);

  useEffect(() => {
    if (!user) return;
    pollUnread();
    const interval = setInterval(pollUnread, 5000);
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {});
    }
    return () => clearInterval(interval);
  }, [user, pollUnread]);

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
          <div className={`w-2.5 h-2.5 rounded-full ${
            locStatus === 'active' ? 'bg-emerald-400 animate-pulse' :
            locStatus === 'failed' ? 'bg-red-400' :
            'bg-amber-400 animate-pulse'
          }`} />
          <div className="w-8 h-8 rounded-full bg-teal-600/30 flex items-center justify-center text-[10px] font-bold text-teal-400">
            {user.avatar || user.name.split(' ').map(n => n[0]).join('')}
          </div>
        </div>
      </header>

      {/* Location banner — shows for ANY non-active state */}
      {locStatus !== 'active' && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-3 text-center">
          <button onClick={requestLocation} className="text-sm font-bold text-amber-800 bg-amber-200 px-5 py-2 rounded-lg">
            Enable Location to Use This App
          </button>
          {locError && (
            <p className="text-[11px] text-red-600 mt-1.5">{locError}</p>
          )}
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
                className={`flex-1 flex flex-col items-center gap-0.5 py-2.5 transition-colors relative ${
                  isActive ? 'text-teal-600' : 'text-slate-400'
                }`}
              >
                <div className="relative">
                  <tab.icon active={isActive} />
                  {tab.href === '/exec/chat' && unreadChat > 0 && (
                    <span className="absolute -top-1.5 -right-2.5 bg-red-500 text-white text-[8px] font-bold rounded-full min-w-[16px] h-[16px] flex items-center justify-center px-0.5">
                      {unreadChat > 99 ? '99+' : unreadChat}
                    </span>
                  )}
                </div>
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
