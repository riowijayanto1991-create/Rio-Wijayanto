import React, { useState } from 'react';
import { 
  Plane, 
  LayoutDashboard, 
  BarChart3, 
  FileText, 
  ShieldAlert, 
  AlertTriangle, 
  Truck, 
  FolderArchive, 
  Bell, 
  Calendar, 
  Upload, 
  Sparkles, 
  FileSpreadsheet, 
  X,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Compass,
  Wrench
} from 'lucide-react';

export type AppTab = 
  | 'dashboard' 
  | 'wildlife-dashboard' 
  | 'whmp-risk'
  | 'patrol' 
  | 'occurrence' 
  | 'strike' 
  | 'vehicle' 
  | 'history' 
  | 'notifications';

interface SidebarProps {
  activeTab: AppTab;
  setActiveTab: (tab: AppTab) => void;
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
  isDarkMode?: boolean;
  onToggleDarkMode?: () => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  counts?: {
    patrols: number;
    occurrences: number;
    strikes: number;
    vehicles: number;
  };
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  unreadCount,
  onOpenNotifications,
  onExportAllExcel,
  onOpenDutyRoster,
  onOpenUploadRoster,
  onOpenGeminiAnalytics,
  onOpenSecurityAdmin,
  isOpenMobile,
  onCloseMobile,
  isCollapsed = false,
  onToggleCollapse,
  counts
}) => {
  const [isAlatOpen, setIsAlatOpen] = useState<boolean>(true);

  const handleNavClick = (tab: AppTab) => {
    setActiveTab(tab);
    onCloseMobile();
  };

  const navItemClass = (isActive: boolean) => 
    `w-full flex items-center ${isCollapsed ? 'justify-center px-2' : 'justify-between px-2.5'} h-9 rounded-lg text-[13px] font-medium transition cursor-pointer ${
      isActive
        ? 'bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 font-semibold border border-sky-200/80 dark:border-sky-800/40 shadow-2xs'
        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/80'
    }`;

  const renderContent = (collapsedMode: boolean) => (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border-r border-slate-200 dark:border-slate-800 select-none">
      {/* Brand Header */}
      <div className={`h-14 max-h-14 px-3 border-b border-slate-200 dark:border-slate-800 flex items-center ${collapsedMode ? 'justify-center' : 'justify-between'}`}>
        <div className="flex items-center space-x-2.5 min-w-0">
          <div className="h-8 w-8 rounded-lg bg-sky-600 flex items-center justify-center text-white shrink-0 shadow-xs">
            <Plane className="w-4 h-4 -rotate-45" />
          </div>
          {!collapsedMode && (
            <div className="overflow-hidden">
              <span className="text-[10px] font-bold tracking-wider text-sky-600 dark:text-sky-400 uppercase block truncate">
                CGK AIRSIDE
              </span>
              <h2 className="text-xs font-bold text-slate-900 dark:text-white truncate leading-tight">
                WHU System
              </h2>
            </div>
          )}
        </div>

        {/* Desktop Collapse Button */}
        {onToggleCollapse && (
          <button
            type="button"
            onClick={onToggleCollapse}
            className="hidden lg:flex p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            title={collapsedMode ? 'Perlebar Sidebar' : 'Ciutkan Sidebar'}
            aria-label="Toggle Sidebar"
          >
            {collapsedMode ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        )}

        {/* Mobile close button */}
        <button
          type="button"
          onClick={onCloseMobile}
          className="lg:hidden p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-md"
          aria-label="Tutup Menu"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation Links Area */}
      <div className="flex-1 overflow-y-auto p-2 space-y-3.5 scrollbar-thin">
        {/* GROUP 1: Pusat Kontrol & Radar */}
        <div>
          {!collapsedMode && (
            <div className="px-2 mb-1 text-[10px] font-bold tracking-wider text-slate-400 dark:text-slate-500 uppercase flex items-center gap-1">
              <Compass className="w-3 h-3 text-sky-500" />
              <span>Kontrol &amp; Radar</span>
            </div>
          )}
          <div className="space-y-0.5">
            <button
              type="button"
              onClick={() => handleNavClick('dashboard')}
              className={navItemClass(activeTab === 'dashboard')}
              title="Dashboard Real-Time"
            >
              <div className="flex items-center space-x-2 min-w-0">
                <LayoutDashboard className={`w-4 h-4 shrink-0 ${activeTab === 'dashboard' ? 'text-sky-600 dark:text-sky-400' : 'text-slate-400'}`} />
                {!collapsedMode && <span className="truncate">Dashboard</span>}
              </div>
              {!collapsedMode && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              )}
            </button>

            <button
              type="button"
              onClick={() => handleNavClick('wildlife-dashboard')}
              className={navItemClass(activeTab === 'wildlife-dashboard')}
              title="Grafik Batang Strike & Populasi 2026"
            >
              <div className="flex items-center space-x-2 min-w-0">
                <BarChart3 className={`w-4 h-4 shrink-0 ${activeTab === 'wildlife-dashboard' ? 'text-rose-600 dark:text-rose-400' : 'text-slate-400'}`} />
                {!collapsedMode && <span className="truncate">Grafik Batang 2026</span>}
              </div>
            </button>

            <button
              type="button"
              onClick={() => handleNavClick('whmp-risk')}
              className={navItemClass(activeTab === 'whmp-risk')}
              title="Model Risiko WHMP Chapter II & Evaluasi Aktual"
            >
              <div className="flex items-center space-x-2 min-w-0">
                <ShieldAlert className={`w-4 h-4 shrink-0 ${activeTab === 'whmp-risk' ? 'text-sky-600 dark:text-sky-400' : 'text-slate-400'}`} />
                {!collapsedMode && <span className="truncate">Model Risiko WHMP</span>}
              </div>
              {!collapsedMode && (
                <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300">
                  Bab II
                </span>
              )}
            </button>
          </div>
        </div>

        {/* GROUP 2: Formulir Pelaporan */}
        <div>
          {!collapsedMode && (
            <div className="px-2 mb-1 text-[10px] font-bold tracking-wider text-slate-400 dark:text-slate-500 uppercase flex items-center gap-1">
              <FileText className="w-3 h-3 text-sky-500" />
              <span>Pelaporan Lapangan</span>
            </div>
          )}
          <div className="space-y-0.5">
            {/* WOR — Wildlife Observation Report */}
            <button
              type="button"
              onClick={() => handleNavClick('patrol')}
              className={navItemClass(activeTab === 'patrol')}
              title="WOR — Wildlife Observation Report: observasi dan pengumpulan data satwa liar"
            >
              <div className="flex items-center space-x-2 min-w-0">
                <span className="w-2 h-2 rounded-full bg-sky-500 shrink-0"></span>
                {!collapsedMode && <span className="truncate">1. WOR (Observasi Satwa)</span>}
              </div>
              {!collapsedMode && counts?.patrols !== undefined && (
                <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">
                  {counts.patrols}
                </span>
              )}
            </button>

            {/* WHR — Wildlife Hazard Report */}
            <button
              type="button"
              onClick={() => handleNavClick('occurrence')}
              className={navItemClass(activeTab === 'occurrence')}
              title="WHR — Wildlife Hazard Report: identifikasi bahaya, evaluasi risiko, dan mitigasi"
            >
              <div className="flex items-center space-x-2 min-w-0">
                <ShieldAlert className={`w-4 h-4 shrink-0 ${activeTab === 'occurrence' ? 'text-amber-600' : 'text-slate-400'}`} />
                {!collapsedMode && <span className="truncate">2. WHR (Hazard Report)</span>}
              </div>
              {!collapsedMode && counts?.occurrences !== undefined && (
                <span className="text-[10px] font-mono text-amber-600 dark:text-amber-400 font-semibold">
                  {counts.occurrences}
                </span>
              )}
            </button>

            {/* WSR — Wildlife Strike Report */}
            <button
              type="button"
              onClick={() => handleNavClick('strike')}
              className={navItemClass(activeTab === 'strike')}
              title="WSR — Wildlife Strike Report: pencatatan dugaan atau kejadian wildlife strike, bukti, dampak, dan status verifikasi"
            >
              <div className="flex items-center space-x-2 min-w-0">
                <AlertTriangle className={`w-4 h-4 shrink-0 ${activeTab === 'strike' ? 'text-rose-600' : 'text-slate-400'}`} />
                {!collapsedMode && <span className="truncate">3. WSR (Strike Report)</span>}
              </div>
              {!collapsedMode && counts?.strikes !== undefined && (
                <span className="text-[10px] font-mono text-rose-600 dark:text-rose-400 font-bold">
                  {counts.strikes}
                </span>
              )}
            </button>

            {/* Kendaraan */}
            <button
              type="button"
              onClick={() => handleNavClick('vehicle')}
              className={navItemClass(activeTab === 'vehicle')}
              title="4. Pengecekan Kendaraan Dinas"
            >
              <div className="flex items-center space-x-2 min-w-0">
                <Truck className={`w-4 h-4 shrink-0 ${activeTab === 'vehicle' ? 'text-teal-600' : 'text-slate-400'}`} />
                {!collapsedMode && <span className="truncate">4. Cek Kendaraan</span>}
              </div>
              {!collapsedMode && counts?.vehicles !== undefined && (
                <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">
                  {counts.vehicles}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* GROUP 3: Arsip & Broadcast */}
        <div>
          {!collapsedMode && (
            <div className="px-2 mb-1 text-[10px] font-bold tracking-wider text-slate-400 dark:text-slate-500 uppercase flex items-center gap-1">
              <FolderArchive className="w-3 h-3 text-sky-500" />
              <span>Arsip &amp; Notifikasi</span>
            </div>
          )}
          <div className="space-y-0.5">
            <button
              type="button"
              onClick={() => handleNavClick('history')}
              className={navItemClass(activeTab === 'history')}
              title="Arsip Semua Laporan"
            >
              <div className="flex items-center space-x-2 min-w-0">
                <FolderArchive className="w-4 h-4 text-slate-400 shrink-0" />
                {!collapsedMode && <span className="truncate">Arsip Laporan</span>}
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                onOpenNotifications();
                onCloseMobile();
              }}
              className={navItemClass(false)}
              title="Broadcast Notifikasi WhatsApp"
            >
              <div className="flex items-center space-x-2 min-w-0">
                <Bell className="w-4 h-4 text-slate-400 shrink-0" />
                {!collapsedMode && <span className="truncate">Broadcast WA</span>}
              </div>
              {!collapsedMode && unreadCount > 0 && (
                <span className="px-1.5 py-0.2 bg-rose-500 text-white font-bold text-[10px] rounded-full">
                  {unreadCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* GROUP 4: Alat Operasional (Bisa Dilipat / Collapsible) */}
        <div>
          {!collapsedMode ? (
            <button
              type="button"
              onClick={() => setIsAlatOpen(prev => !prev)}
              className="w-full px-2 mb-1 text-[10px] font-bold tracking-wider text-slate-400 dark:text-slate-500 uppercase flex items-center justify-between cursor-pointer hover:text-slate-600 dark:hover:text-slate-300 transition"
              title="Klik untuk melipat / membuka Alat Operasional"
            >
              <span className="flex items-center gap-1">
                <Wrench className="w-3 h-3 text-sky-500" />
                <span>Alat Operasional</span>
              </span>
              <ChevronDown className={`w-3 h-3 transition-transform duration-150 ${isAlatOpen ? '' : '-rotate-90'}`} />
            </button>
          ) : (
            <div className="my-1 border-t border-slate-100 dark:border-slate-800" />
          )}

          {(isAlatOpen || collapsedMode) && (
            <div className="space-y-0.5 animate-in fade-in duration-150">
              {onOpenGeminiAnalytics && (
                <button
                  type="button"
                  onClick={() => {
                    onOpenGeminiAnalytics();
                    onCloseMobile();
                  }}
                  className={navItemClass(false)}
                  title="Analisis AI Gemini"
                >
                  <div className="flex items-center space-x-2 min-w-0">
                    <Sparkles className="w-4 h-4 text-violet-500 shrink-0" />
                    {!collapsedMode && <span className="truncate text-violet-700 dark:text-violet-300 font-semibold">AI Gemini</span>}
                  </div>
                </button>
              )}

              {onOpenSecurityAdmin && (
                <button
                  type="button"
                  onClick={() => {
                    onOpenSecurityAdmin();
                    onCloseMobile();
                  }}
                  className={navItemClass(false)}
                  title="Pusat Keamanan & Hak Akses (RBAC)"
                >
                  <div className="flex items-center space-x-2 min-w-0">
                    <ShieldAlert className="w-4 h-4 text-purple-500 shrink-0" />
                    {!collapsedMode && <span className="truncate text-purple-700 dark:text-purple-300 font-semibold">Keamanan &amp; RBAC</span>}
                  </div>
                </button>
              )}

              {onOpenDutyRoster && (
                <button
                  type="button"
                  onClick={() => {
                    onOpenDutyRoster();
                    onCloseMobile();
                  }}
                  className={navItemClass(false)}
                  title="Jadwal Roster Dinas 4 Pleton"
                >
                  <div className="flex items-center space-x-2 min-w-0">
                    <Calendar className="w-4 h-4 text-sky-500 shrink-0" />
                    {!collapsedMode && <span className="truncate">Jadwal Roster</span>}
                  </div>
                </button>
              )}

              {onOpenUploadRoster && (
                <button
                  type="button"
                  onClick={() => {
                    onOpenUploadRoster();
                    onCloseMobile();
                  }}
                  className={navItemClass(false)}
                  title="Unggah Roster (Excel / PDF)"
                >
                  <div className="flex items-center space-x-2 min-w-0">
                    <Upload className="w-4 h-4 text-emerald-500 shrink-0" />
                    {!collapsedMode && <span className="truncate">Upload Roster</span>}
                  </div>
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  onExportAllExcel();
                  onCloseMobile();
                }}
                className={navItemClass(false)}
                title="Unduh Rekapitulasi Excel"
              >
                <div className="flex items-center space-x-2 min-w-0">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600 shrink-0" />
                  {!collapsedMode && <span className="truncate">Export Excel</span>}
                </div>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar (Permanent) */}
      <aside className={`hidden lg:block shrink-0 h-screen sticky top-0 z-40 transition-all duration-200 ${isCollapsed ? 'w-16' : 'w-[230px]'}`}>
        {renderContent(isCollapsed)}
      </aside>

      {/* Mobile Drawer */}
      {isOpenMobile && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div 
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
          />
          <div className="relative w-64 max-w-[85vw] h-full shadow-2xl z-10 animate-in slide-in-from-left duration-200">
            {renderContent(false)}
          </div>
        </div>
      )}
    </>
  );
};
