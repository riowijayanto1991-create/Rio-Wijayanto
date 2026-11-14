import React, { useState, useEffect, useRef } from 'react';
import { 
  Clock, 
  Menu,
  FileSpreadsheet, 
  Bell, 
  Calendar, 
  Sun, 
  Moon, 
  Sparkles, 
  FileCode,
  ShieldCheck,
  ShieldAlert,
  Shield,
  Lock,
  ChevronDown,
  Cloud,
  CheckCircle2,
  MoreVertical,
  Smartphone,
  Users,
  LogOut,
  Fingerprint,
  AlertTriangle
} from 'lucide-react';
import { getActiveDutyInfo } from '../utils/dutyRosterService';
import { PWAInstallButton } from './PWAInstallButton';
import { useAuth } from '../context/AuthContext';

interface HeaderProps {
  activeTab: 'dashboard' | 'patrol' | 'occurrence' | 'strike' | 'vehicle' | 'history' | 'notifications' | 'wildlife-dashboard' | 'whmp-risk';
  setActiveTab?: (tab: 'dashboard' | 'patrol' | 'occurrence' | 'strike' | 'vehicle' | 'history' | 'notifications' | 'wildlife-dashboard' | 'whmp-risk') => void;
  unreadCount: number;
  onOpenNotifications: () => void;
  onExportAllExcel: () => void;
  isAdmin?: boolean;
  onOpenAdminAuth?: () => void;
  onLogoutAdmin?: () => void;
  onOpenDutyRoster?: () => void;
  onOpenUploadRoster?: () => void;
  onOpenGeminiAnalytics?: () => void;
  onOpenMonthlyDraft?: () => void;
  onOpenSecurityAdmin?: () => void;
  onOpenLogin?: () => void;
  onOpenMfaEnrollment?: () => void;
  isDarkMode?: boolean;
  onToggleDarkMode?: () => void;
  onToggleMobileSidebar?: () => void;
  syncStatus?: 'connecting' | 'synced' | 'error';
  lastSyncTime?: string;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  unreadCount,
  onOpenNotifications,
  onExportAllExcel,
  isAdmin = false,
  onOpenAdminAuth,
  onLogoutAdmin,
  onOpenDutyRoster,
  onOpenUploadRoster,
  onOpenGeminiAnalytics,
  onOpenMonthlyDraft,
  onOpenSecurityAdmin,
  onOpenLogin,
  onOpenMfaEnrollment,
  isDarkMode = false,
  onToggleDarkMode,
  onToggleMobileSidebar,
  syncStatus = 'synced',
  lastSyncTime = 'Terhubung'
}) => {
  const { user, activeSuperAdminCount, logout, isAuthenticated } = useAuth();
  const [currentTime, setCurrentTime] = useState<string>('');
  const [activeDuty, setActiveDuty] = useState(() => getActiveDutyInfo());
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState<boolean>(false);
  const [showStatusTooltip, setShowStatusTooltip] = useState<boolean>(false);
  const moreMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB');
      setActiveDuty(getActiveDutyInfo());
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Close "Lainnya" menu on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(e.target as Node)) {
        setIsMoreMenuOpen(false);
      }
    };
    if (isMoreMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMoreMenuOpen]);

  const getPletonBadgeClasses = (code: string) => {
    switch (code) {
      case 'ALPHA': return 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800';
      case 'BRAVO': return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800';
      case 'CHARLIE': return 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800';
      case 'DELTA': return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800';
      default: return 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300';
    }
  };

  return (
    <header className="h-14 max-h-14 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30 shadow-xs select-none">
      <div className="w-full h-full px-3 sm:px-5 flex items-center justify-between gap-2 sm:gap-3">
        {/* Left: Hamburger & App Title + Live Status */}
        <div className="flex items-center space-x-2.5 min-w-0">
          <button
            type="button"
            onClick={onToggleMobileSidebar}
            className="lg:hidden p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            aria-label="Buka Menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center space-x-2 min-w-0">
            <h1 className="text-sm font-bold tracking-tight text-slate-900 dark:text-white truncate">
              WHU Operational System
            </h1>

            {/* System Status Indicator: 1 Dot with Tooltip */}
            <div className="relative">
              <button
                type="button"
                onMouseEnter={() => setShowStatusTooltip(true)}
                onMouseLeave={() => setShowStatusTooltip(false)}
                onClick={() => setShowStatusTooltip(prev => !prev)}
                className="flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 transition cursor-pointer"
                title="Status Sinkronisasi Sistem"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="hidden xs:inline font-mono">Live</span>
              </button>

              {/* Status Tooltip */}
              {showStatusTooltip && (
                <div className="absolute left-0 top-full mt-1.5 z-50 w-64 bg-slate-900 text-white text-[11px] rounded-lg p-2.5 shadow-xl border border-slate-700 space-y-1 animate-in fade-in duration-150">
                  <div className="flex items-center gap-1.5 font-bold text-emerald-400">
                    <Cloud className="w-3.5 h-3.5" />
                    <span>Cloud Sync Aktif (Multi-Device)</span>
                  </div>
                  <p className="text-slate-300 text-[10px]">
                    Status: {syncStatus === 'synced' ? 'Semua data tersinkronisasi' : 'Menghubungkan ke cloud...'}
                  </p>
                  <p className="text-slate-400 text-[10px] font-mono">
                    Update Terakhir: {lastSyncTime}
                  </p>
                  <p className="text-slate-400 text-[9px] pt-1 border-t border-slate-800">
                    SOP ICAO Annex 14 &amp; Doc 9137 Part 3
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right: Chip Clock/Shift, Primary AI Button, Notifications, Theme, More Menu */}
        <div className="flex items-center space-x-1.5 sm:space-x-2 shrink-0">
          {/* Time & Shift Compact Chip in 1 element */}
          <div 
            onClick={onOpenDutyRoster}
            className="hidden sm:flex items-center gap-2 bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 text-xs cursor-pointer transition"
            title="Klik untuk membuka Kalender & Roster Dinas"
          >
            <Clock className="w-3.5 h-3.5 text-slate-400 dark:text-slate-400" />
            <span className="font-mono font-medium text-slate-700 dark:text-slate-300 text-[11px]">
              {currentTime}
            </span>
            <span className="text-slate-300 dark:text-slate-600">•</span>
            <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold border ${getPletonBadgeClasses(activeDuty.pletonCode)}`}>
              {activeDuty.pleton} ({activeDuty.shiftType === 'PAGI' ? 'APME' : 'APMG'})
            </span>
          </div>

          {/* SINGLE PRIMARY BUTTON IN HEADER: "AI Gemini" */}
          {onOpenGeminiAnalytics && (
            <button
              type="button"
              onClick={onOpenGeminiAnalytics}
              className="flex items-center gap-1.5 bg-violet-600 hover:bg-violet-700 text-white font-semibold px-2.5 py-1.5 rounded-lg text-xs shadow-xs transition cursor-pointer"
              title="Buka Analisis Risiko & Mitigasi AI Gemini"
            >
              <Sparkles className="w-3.5 h-3.5 text-violet-200" />
              <span className="hidden xs:inline">AI Gemini</span>
            </button>
          )}

          {/* RBAC Security Role Badge & 2-SuperAdmin Warning */}
          <button
            type="button"
            onClick={onOpenSecurityAdmin || onOpenLogin}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition cursor-pointer ${
              user?.role === 'SuperAdmin'
                ? 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800'
                : user?.role === 'AirportAdmin'
                ? 'bg-sky-50 text-sky-700 border-sky-200 hover:bg-sky-100 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800'
                : user?.role === 'WildlifeOfficer'
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                : user?.role === 'DataReviewer'
                ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800'
                : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
            }`}
            title={`Akun: ${user?.fullName || 'User'} (${user?.role || 'Guest'}) • Klik untuk Pusat Keamanan & RBAC`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-current shrink-0" />
            <span className="hidden md:inline">{user?.role || 'Keamanan RBAC'}</span>
            {activeSuperAdminCount < 2 && (
              <span 
                className="w-2 h-2 rounded-full bg-amber-500 animate-pulse shrink-0" 
                title="Peringatan: Terdeteksi < 2 SuperAdmin aktif! Rekomendasi minimal 2 SuperAdmin aktif untuk mitigasi risiko." 
              />
            )}
          </button>

          {/* Notifications Bell */}
          <button
            type="button"
            onClick={onOpenNotifications}
            className="relative p-1.5 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition border border-transparent hover:border-slate-200 dark:hover:border-slate-700 cursor-pointer"
            title="Broadcast WhatsApp & Log Notifikasi"
            aria-label="Notifikasi"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 px-1 min-w-[14px] h-3.5 bg-rose-600 text-white font-bold text-[9px] rounded-full flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* Theme Toggle (Light / Dark) */}
          <button
            type="button"
            onClick={onToggleDarkMode}
            className="p-1.5 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition border border-transparent hover:border-slate-200 dark:hover:border-slate-700 cursor-pointer"
            title={isDarkMode ? 'Beralih ke Tema Cerah (Light Mode)' : 'Beralih ke Tema Gelap (Night Vision)'}
            aria-label="Toggle Tema"
          >
            {isDarkMode ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-slate-600" />
            )}
          </button>

          {/* "Lainnya" Dropdown Menu */}
          <div className="relative" ref={moreMenuRef}>
            <button
              type="button"
              onClick={() => setIsMoreMenuOpen(prev => !prev)}
              className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition cursor-pointer"
              title="Menu Lainnya: Keamanan RBAC, Draft JSON, Export Excel, Instal App"
            >
              <span className="hidden sm:inline">Lainnya</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {isMoreMenuOpen && (
              <div className="absolute right-0 top-full mt-1.5 w-60 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 py-1.5 z-50 text-xs animate-in fade-in duration-150">
                {/* Security Admin & RBAC */}
                <button
                  type="button"
                  onClick={() => {
                    onOpenSecurityAdmin && onOpenSecurityAdmin();
                    setIsMoreMenuOpen(false);
                  }}
                  className="w-full px-3 py-2 text-left flex items-center justify-between text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer font-medium"
                >
                  <div className="flex items-center gap-2.5">
                    <ShieldCheck className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    <span>Pusat Keamanan &amp; RBAC</span>
                  </div>
                  {activeSuperAdminCount < 2 && (
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-800">
                      1 Admin
                    </span>
                  )}
                </button>

                {/* MFA Enrollment */}
                <button
                  type="button"
                  onClick={() => {
                    onOpenMfaEnrollment && onOpenMfaEnrollment();
                    setIsMoreMenuOpen(false);
                  }}
                  className="w-full px-3 py-2 text-left flex items-center gap-2.5 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  <Fingerprint className="w-4 h-4 text-emerald-600" />
                  <span>Aktivasi / Kelola MFA (TOTP)</span>
                </button>

                <div className="my-1 border-t border-slate-100 dark:border-slate-800" />

                {/* Draft JSON */}
                {onOpenMonthlyDraft && (
                  <button
                    type="button"
                    onClick={() => {
                      onOpenMonthlyDraft();
                      setIsMoreMenuOpen(false);
                    }}
                    className="w-full px-3 py-2 text-left flex items-center gap-2.5 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                  >
                    <FileCode className="w-4 h-4 text-amber-500" />
                    <span>Draft JSON Bulanan</span>
                  </button>
                )}

                {/* Export Excel */}
                <button
                  type="button"
                  onClick={() => {
                    onExportAllExcel();
                    setIsMoreMenuOpen(false);
                  }}
                  className="w-full px-3 py-2 text-left flex items-center gap-2.5 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                  <span>Unduh Rekapitulasi Excel</span>
                </button>

                {/* Duty Roster */}
                {onOpenDutyRoster && (
                  <button
                    type="button"
                    onClick={() => {
                      onOpenDutyRoster();
                      setIsMoreMenuOpen(false);
                    }}
                    className="w-full px-3 py-2 text-left flex items-center gap-2.5 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                  >
                    <Calendar className="w-4 h-4 text-sky-600" />
                    <span>Jadwal Roster 4 Pleton</span>
                  </button>
                )}

                {/* Pasang Aplikasi PWA */}
                <PWAInstallButton 
                  variant="menu-item" 
                  onItemClick={() => setIsMoreMenuOpen(false)} 
                />

                <div className="my-1 border-t border-slate-100 dark:border-slate-800" />

                {/* Switch Account or Logout */}
                <button
                  type="button"
                  onClick={() => {
                    onOpenLogin && onOpenLogin();
                    setIsMoreMenuOpen(false);
                  }}
                  className="w-full px-3 py-2 text-left flex items-center gap-2.5 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  <Users className="w-4 h-4 text-sky-500" />
                  <span>Ganti Akun / Masuk</span>
                </button>

                {isAuthenticated && (
                  <button
                    type="button"
                    onClick={() => {
                      logout();
                      setIsMoreMenuOpen(false);
                    }}
                    className="w-full px-3 py-2 text-left flex items-center gap-2.5 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Keluar Sesi ({user?.email})</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
