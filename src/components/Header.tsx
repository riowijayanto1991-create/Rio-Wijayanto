import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, 
  FileSpreadsheet, 
  Bell, 
  Clock, 
  Plane, 
  CheckCircle2, 
  ChevronRight,
  Radio
} from 'lucide-react';

interface HeaderProps {
  activeTab: 'dashboard' | 'patrol' | 'occurrence' | 'strike' | 'history' | 'notifications';
  setActiveTab: (tab: 'dashboard' | 'patrol' | 'occurrence' | 'strike' | 'history' | 'notifications') => void;
  unreadCount: number;
  onOpenNotifications: () => void;
  onExportAllExcel: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  unreadCount,
  onOpenNotifications,
  onExportAllExcel
}) => {
  const [currentTime, setCurrentTime] = useState<string>('');
  const [currentDate, setCurrentDate] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' WIB');
      setCurrentDate(now.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-30 shadow-md">
      {/* Top Banner with Airport Branding & Operational Clock */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between py-3 border-b border-slate-800/80 gap-3">
          {/* Logo & Identity */}
          <div className="flex items-center space-x-3.5">
            <div className="h-10 w-10 rounded-lg bg-sky-600 flex items-center justify-center text-white font-bold shadow-inner">
              <Plane className="w-5 h-5 text-sky-100 -rotate-45" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-semibold tracking-wider text-sky-400 uppercase">PT ANGKASA PURA INDONESIA</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 font-mono border border-emerald-800 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  AIRSIDE LIVE
                </span>
              </div>
              <h1 className="text-base sm:text-lg font-bold tracking-tight text-white flex items-center gap-2">
                Sistem Pelaporan & Monitoring Wildlife Hazard (WHU)
              </h1>
            </div>
          </div>

          {/* Operational Meta: Clock, Shift & Actions */}
          <div className="flex items-center flex-wrap gap-2.5 sm:gap-4 text-xs">
            <div className="hidden sm:flex items-center space-x-2 bg-slate-800/90 px-3 py-1.5 rounded-md border border-slate-700">
              <Clock className="w-3.5 h-3.5 text-sky-400" />
              <div className="text-left">
                <p className="font-mono font-medium text-slate-200">{currentTime}</p>
                <p className="text-[10px] text-slate-400">{currentDate}</p>
              </div>
            </div>

            <div className="hidden lg:flex items-center space-x-1.5 bg-slate-800/90 px-2.5 py-1.5 rounded-md border border-slate-700">
              <Radio className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
              <span className="text-slate-300">Pleton Aktif: <strong className="text-white">Pleton 1</strong></span>
            </div>

            {/* Quick Export Excel */}
            <button
              onClick={onExportAllExcel}
              className="flex items-center space-x-1.5 bg-emerald-700 hover:bg-emerald-600 text-white font-medium px-3 py-1.5 rounded-md transition text-xs shadow-sm"
              title="Unduh Rekapitulasi Lengkap Excel"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Export Semua Excel</span>
            </button>

            {/* Notification Center Trigger */}
            <button
              onClick={onOpenNotifications}
              className="relative flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white px-3 py-1.5 rounded-md transition border border-slate-700 text-xs"
            >
              <Bell className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline font-medium">Notifikasi Manajemen</span>
              {unreadCount > 0 && (
                <span className="ml-1 px-1.5 py-0.2 bg-red-500 text-white font-bold text-[10px] rounded-full">
                  {unreadCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex space-x-1 overflow-x-auto py-2 scrollbar-none text-xs sm:text-sm font-medium">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`px-3 py-1.5 rounded-md whitespace-nowrap transition flex items-center gap-1.5 ${
              activeTab === 'dashboard'
                ? 'bg-sky-600 text-white shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            Dashboard Real-Time
          </button>

          <button
            onClick={() => setActiveTab('patrol')}
            className={`px-3 py-1.5 rounded-md whitespace-nowrap transition flex items-center gap-1.5 ${
              activeTab === 'patrol'
                ? 'bg-sky-600 text-white shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-blue-400"></span>
            1. Laporan Patroli / Inspeksi
          </button>

          <button
            onClick={() => setActiveTab('occurrence')}
            className={`px-3 py-1.5 rounded-md whitespace-nowrap transition flex items-center gap-1.5 ${
              activeTab === 'occurrence'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-amber-400"></span>
            2. Laporan Occurrence
          </button>

          <button
            onClick={() => setActiveTab('strike')}
            className={`px-3 py-1.5 rounded-md whitespace-nowrap transition flex items-center gap-1.5 ${
              activeTab === 'strike'
                ? 'bg-rose-700 text-white shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-red-400 animate-ping"></span>
            3. Laporan Wildlife Strike
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`px-3 py-1.5 rounded-md whitespace-nowrap transition flex items-center gap-1.5 ${
              activeTab === 'history'
                ? 'bg-slate-700 text-white shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            Arsip & Rekapitulasi Laporan
          </button>

          <button
            onClick={() => setActiveTab('notifications')}
            className={`px-3 py-1.5 rounded-md whitespace-nowrap transition flex items-center gap-1.5 ${
              activeTab === 'notifications'
                ? 'bg-slate-700 text-white shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            Broadcast Manajemen
          </button>
        </nav>
      </div>
    </header>
  );
};
