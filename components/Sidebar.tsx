'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { logout, getMe, getChatContacts } from '@/lib/api-client';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: DashboardIcon },
  { href: '/cases', label: 'Cases', icon: CasesIcon },
  { href: '/add-case', label: 'Add Case', icon: AddCaseIcon },
  { href: '/upload', label: 'Upload Excel', icon: UploadIcon },
  { href: '/reports', label: 'Reports', icon: ReportsIcon },
  { href: '/executives', label: 'Executives', icon: ExecutivesIcon },
  { href: '/chat', label: 'Chat', icon: ChatIcon },
  { href: '/tracking', label: 'Live Tracking', icon: TrackingIcon },
  { href: '/audit', label: 'Audit Trail', icon: AuditIcon },
  { href: '/admin-submit', label: 'Submit Report', icon: AdminSubmitIcon },
];

function DashboardIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="7" height="8" rx="1.5" />
      <rect x="11" y="2" width="7" height="5" rx="1.5" />
      <rect x="2" y="12" width="7" height="6" rx="1.5" />
      <rect x="11" y="9" width="7" height="9" rx="1.5" />
    </svg>
  );
}

function ReportsIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2H5a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7l-5-5z" />
      <polyline points="12,2 12,7 17,7" />
      <line x1="7" y1="10" x2="13" y2="10" />
      <line x1="7" y1="13" x2="11" y2="13" />
    </svg>
  );
}

function ExecutivesIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 16v-1a3 3 0 00-3-3H7a3 3 0 00-3 3v1" />
      <circle cx="9" cy="7" r="3" />
      <path d="M17 16v-1a3 3 0 00-2-2.83" />
      <path d="M13 4.17a3 3 0 010 5.66" />
    </svg>
  );
}

function CasesIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="16" height="14" rx="2" />
      <line x1="2" y1="7" x2="18" y2="7" />
      <line x1="6" y1="3" x2="6" y2="7" />
      <line x1="14" y1="3" x2="14" y2="7" />
    </svg>
  );
}

function AddCaseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="14" height="14" rx="2" />
      <line x1="10" y1="7" x2="10" y2="13" />
      <line x1="7" y1="10" x2="13" y2="10" />
    </svg>
  );
}

function UploadIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V4a2 2 0 00-2-2z" />
      <polyline points="10,8 10,14" />
      <polyline points="7,11 10,8 13,11" />
    </svg>
  );
}

function AuditIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 18a8 8 0 100-16 8 8 0 000 16z" />
      <polyline points="10,6 10,10 13,12" />
    </svg>
  );
}

function TrackingIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 8.5c0 5.5-7 10-7 10s-7-4.5-7-10a7 7 0 0114 0z" />
      <circle cx="10" cy="8.5" r="2.5" />
    </svg>
  );
}

function ChatIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 13a2 2 0 01-2 2H7l-4 3V5a2 2 0 012-2h10a2 2 0 012 2z" />
      <line x1="7" y1="8" x2="13" y2="8" />
      <line x1="7" y1="11" x2="11" y2="11" />
    </svg>
  );
}

function AdminSubmitIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2H5a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7l-5-5z" />
      <polyline points="12,2 12,7 17,7" />
      <line x1="10" y1="11" x2="10" y2="15" />
      <line x1="8" y1="13" x2="12" y2="13" />
    </svg>
  );
}

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<{ name: string; role: string } | null>(null);
  const [unreadChat, setUnreadChat] = useState(0);
  const prevUnread = useRef(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    getMe().then(data => setUser(data.user)).catch(() => {});
    audioRef.current = new Audio('/notify.wav');
    audioRef.current.volume = 0.5;
  }, []);

  // Poll unread chat count every 5 seconds
  const pollUnread = useCallback(async () => {
    try {
      const data = await getChatContacts();
      const total = data.totalUnread || 0;
      setUnreadChat(total);
      // Play sound if new messages arrived and not on chat page
      if (total > prevUnread.current && prevUnread.current >= 0 && !window.location.pathname.startsWith('/chat')) {
        audioRef.current?.play().catch(() => {});
        // Browser notification
        if (Notification.permission === 'granted') {
          new Notification('New message', { body: 'You have a new chat message', icon: '/icon-192x192.png' });
        }
      }
      prevUnread.current = total;
    } catch {}
  }, []);

  useEffect(() => {
    pollUnread();
    const interval = setInterval(pollUnread, 5000);
    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {});
    }
    return () => clearInterval(interval);
  }, [pollUnread]);

  const handleLogout = async () => {
    try {
      await logout();
    } catch {}
    router.push('/login');
  };

  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'AU';

  return (
    <aside className="fixed left-0 top-0 h-screen w-[240px] bg-navy-900 text-white flex flex-col z-50">
      {/* Logo */}
      <div className="px-4 py-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <img src="/kospl-logo.jpg" alt="KOSPL" className="h-10 w-auto rounded" />
          <div>
            <h1 className="font-display font-bold text-sm tracking-tight">Koteshwari</h1>
            <p className="text-[10px] text-slate-400 tracking-wider uppercase">Onfield Services</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3">
        <p className="text-[10px] uppercase tracking-widest text-slate-500 px-3 mb-3 font-semibold">Navigation</p>
        <ul className="space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`sidebar-item flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                    isActive
                      ? 'bg-teal-600/15 text-teal-400 font-medium'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <item.icon />
                  <span className="flex-1">{item.label}</span>
                  {item.href === '/chat' && unreadChat > 0 && (
                    <span className="bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                      {unreadChat > 99 ? '99+' : unreadChat}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User + Logout */}
      <div className="px-4 py-4 border-t border-white/10">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-full bg-teal-600 flex items-center justify-center text-xs font-bold">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-white truncate">{user?.name || 'Admin User'}</p>
            <p className="text-[10px] text-slate-400 capitalize">{user?.role || 'Admin'}</p>
          </div>
          <div className="w-2 h-2 rounded-full bg-emerald-400" />
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" /><polyline points="16,17 21,12 16,7" /><line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          Sign Out
        </button>
      </div>
    </aside>
  );
}
