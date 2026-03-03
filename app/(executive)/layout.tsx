'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { getMe } from '@/lib/api-client';

export default function ExecutiveLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<{ name: string; role: string; avatar: string } | null>(null);

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

  if (!user) return null;

  const tabs = [
    { href: '/exec/cases', label: 'My Cases', icon: CasesIcon },
    { href: '/exec/profile', label: 'Profile', icon: ProfileIcon },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Header */}
      <header className="bg-navy-900 text-white px-4 py-3 flex items-center justify-between safe-area-top sticky top-0 z-50">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-teal-600 flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10 2L3 7v9a2 2 0 002 2h10a2 2 0 002-2V7l-7-5z" />
              <path d="M8 18V12h4v6" />
            </svg>
          </div>
          <div>
            <h1 className="text-sm font-bold">Koteshwari Onfield</h1>
            <p className="text-[9px] text-teal-400 tracking-wider uppercase">Field Executive</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-teal-600/30 flex items-center justify-center text-[10px] font-bold text-teal-400">
            {user.avatar || user.name.split(' ').map(n => n[0]).join('')}
          </div>
        </div>
      </header>

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

function ProfileIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? '#0d9488' : '#94a3b8'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}
