'use client';

import { useState, useEffect, useCallback } from 'react';
import { getExecutiveLocations } from '@/lib/api-client';

interface ExecutiveLocation {
  id: string;
  name: string;
  avatar: string;
  region: string;
  phone: string;
  last_latitude: number;
  last_longitude: number;
  last_location_at: string;
  active_cases: number;
}

export default function TrackingPage() {
  const [executives, setExecutives] = useState<ExecutiveLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedExec, setSelectedExec] = useState<ExecutiveLocation | null>(null);

  const loadLocations = useCallback(async () => {
    try {
      const data = await getExecutiveLocations();
      setExecutives(data.executives);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => {
    loadLocations();
    const interval = setInterval(loadLocations, 15000); // refresh every 15s
    return () => clearInterval(interval);
  }, [loadLocations]);

  const timeAgo = (dt: string) => {
    const d = new Date(dt + 'Z');
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const mins = Math.floor(diffMs / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  const isOnline = (dt: string) => {
    const d = new Date(dt + 'Z');
    const now = new Date();
    return (now.getTime() - d.getTime()) < 300000; // within 5 min
  };

  const openInMaps = (lat: number, lng: number) => {
    window.open(`https://www.google.com/maps?q=${lat},${lng}`, '_blank');
  };

  if (loading) {
    return (
      <div className="p-8 text-center">
        <svg className="animate-spin h-8 w-8 text-teal-600 mx-auto mb-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <circle cx="12" cy="12" r="10" strokeOpacity="0.2" /><path d="M4 12a8 8 0 018-8" />
        </svg>
        <p className="text-sm text-slate-500">Loading executive locations...</p>
      </div>
    );
  }

  const onlineCount = executives.filter(e => isOnline(e.last_location_at)).length;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-display font-bold text-navy-900">Live Tracking</h1>
          <p className="text-sm text-slate-500 mt-1">Real-time field executive locations</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-sm font-semibold text-emerald-700">{onlineCount} Online</span>
          </div>
          <div className="bg-slate-100 rounded-xl px-3 py-2">
            <span className="text-sm font-semibold text-slate-600">{executives.length} Tracked</span>
          </div>
        </div>
      </div>

      {executives.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <svg className="mx-auto text-slate-300 mb-4" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" />
          </svg>
          <h3 className="text-lg font-display font-bold text-navy-900 mb-1">No Location Data Yet</h3>
          <p className="text-sm text-slate-400">Executive locations will appear here once they open the app.<br />Location is reported automatically every 60 seconds.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {executives.map(exec => {
            const online = isOnline(exec.last_location_at);
            return (
              <div
                key={exec.id}
                className={`bg-white rounded-2xl border overflow-hidden transition-all hover:shadow-md cursor-pointer ${
                  selectedExec?.id === exec.id ? 'border-teal-500 ring-2 ring-teal-100' : 'border-slate-200'
                }`}
                onClick={() => setSelectedExec(selectedExec?.id === exec.id ? null : exec)}
              >
                <div className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-12 h-12 rounded-full bg-navy-900 flex items-center justify-center text-sm font-bold text-white">
                        {exec.avatar || exec.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </div>
                      <div className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-white ${
                        online ? 'bg-emerald-500' : 'bg-slate-400'
                      }`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-navy-900 truncate">{exec.name}</p>
                      <p className="text-xs text-slate-400">{exec.region}</p>
                    </div>
                    <div className="text-right">
                      <span className={`text-[10px] font-semibold px-2 py-1 rounded-full ${
                        online ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {online ? 'Online' : timeAgo(exec.last_location_at)}
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" />
                      </svg>
                      <span className="font-mono text-[11px]">{exec.last_latitude.toFixed(5)}, {exec.last_longitude.toFixed(5)}</span>
                    </div>
                    <span className="text-[10px] bg-teal-50 text-teal-600 font-semibold px-2 py-0.5 rounded-full">
                      {exec.active_cases} active case{exec.active_cases !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>

                {/* Expanded view */}
                {selectedExec?.id === exec.id && (
                  <div className="border-t border-slate-100 px-4 py-3 bg-slate-50">
                    <div className="flex items-center gap-2 mb-3">
                      {exec.phone && (
                        <a href={`tel:${exec.phone}`} className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" />
                          </svg>
                          Call
                        </a>
                      )}
                      <button
                        onClick={(e) => { e.stopPropagation(); openInMaps(exec.last_latitude, exec.last_longitude); }}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-teal-600 text-white rounded-lg text-xs font-medium hover:bg-teal-700"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" />
                        </svg>
                        Open in Maps
                      </button>
                    </div>
                    <p className="text-[10px] text-slate-400 text-center">
                      Last updated: {new Date(exec.last_location_at + 'Z').toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hour12: true })}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
