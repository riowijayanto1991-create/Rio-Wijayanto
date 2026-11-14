import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, 
  FileText, 
  AlertTriangle, 
  Bird, 
  CheckCircle2, 
  TrendingUp, 
  Plane, 
  Download, 
  Plus, 
  Radio, 
  Share2, 
  Calendar, 
  Layers, 
  Sparkles, 
  Search, 
  Crosshair, 
  MapPin, 
  Flame, 
  Truck, 
  FolderArchive, 
  Upload, 
  Info, 
  FileCode, 
  BarChart3, 
  Compass,
  ChevronDown,
  ChevronUp,
  Activity,
  ArrowUpRight,
  Users,
  Edit3,
  Shield,
  RefreshCw,
  X,
  Check,
  Bookmark
} from 'lucide-react';
import { PatrolReport, OccurrenceReport, WildlifeStrikeReport, VehicleCheckReport, MonthlyReportDocument, GeminiTrendAnalysis } from '../types';
import { 
  getActiveDutyInfo, 
  getActiveRosterPersonnel, 
  setActiveRosterPersonnel, 
  resetToOfficialRosterPersonnel, 
  OFFICIAL_ROSTER_PERSONNEL, 
  RosterPersonnel 
} from '../utils/dutyRosterService';
import { 
  subscribeToActiveRosterPersonnel, 
  saveActiveRosterPersonnelToFirestore 
} from '../services/firestoreService';
import { AirsideRunwayMap } from './AirsideRunwayMap';
import { WildlifeHotspotMap } from './WildlifeHotspotMap';
import { WildlifeStrikeMonthlyChart } from './WildlifeStrikeMonthlyChart';
import { WildlifeStrikePopulationDashboard } from './WildlifeStrikePopulationDashboard';
import { WeatherBirdActivityWidget } from './WeatherBirdActivityWidget';
import { exportPatrolPDF, exportOccurrencePDF, exportStrikePDF, exportVehiclePDF } from '../utils/pdfExport';
import { exportSinglePatrolToExcel } from '../utils/excelExport';
import { extractGridCode } from '../utils/gridMapUtils';

interface DashboardProps {
  patrols: PatrolReport[];
  occurrences: OccurrenceReport[];
  strikes: WildlifeStrikeReport[];
  vehicles?: VehicleCheckReport[];
  monthlyDocuments?: MonthlyReportDocument[];
  geminiAnalysis?: GeminiTrendAnalysis | null;
  onOpenGeminiAnalytics?: () => void;
  onOpenMonthlyDraft?: () => void;
  onNavigateToForm: (type: 'patrol' | 'occurrence' | 'strike' | 'vehicle') => void;
  onPreviewReport: (type: 'patrol' | 'occurrence' | 'strike' | 'vehicle', id: string) => void;
  onOpenBroadcast: (type: 'PATROL' | 'OCCURRENCE' | 'STRIKE', report: any) => void;
  onOpenUploadMonthly?: () => void;
  onNavigateToHistory?: () => void;
  onOpenDutyRoster?: () => void;
  onOpenUploadRoster?: () => void;
  onCreateReportWithLocation?: (type: 'occurrence' | 'strike', locationData: {
    latitude: number;
    longitude: number;
    gridLocation: string;
    runwayTaxiway: string;
    lokasi: string;
    distanceFromArpKm: number;
  }) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  patrols,
  occurrences,
  strikes,
  vehicles = [],
  monthlyDocuments = [],
  geminiAnalysis,
  onOpenGeminiAnalytics,
  onOpenMonthlyDraft,
  onNavigateToForm,
  onPreviewReport,
  onOpenBroadcast,
  onOpenUploadMonthly,
  onNavigateToHistory,
  onOpenDutyRoster,
  onOpenUploadRoster,
  onCreateReportWithLocation
}) => {
  const activeDuty = getActiveDutyInfo();
  // Period selector: default to current running month (Bulan Berjalan)
  const currentMonthIdx = new Date().getMonth();
  const currentYearVal = new Date().getFullYear();
  const [selectedMonth, setSelectedMonth] = useState<number>(currentMonthIdx);
  const [selectedYear, setSelectedYear] = useState<number>(currentYearVal);
  const [isAllTimeFilter, setIsAllTimeFilter] = useState<boolean>(false);

  // Active Roster Personnel State & Real-Time Sync across devices
  const [activePersonnel, setActivePersonnel] = useState<Record<'ALPHA' | 'BRAVO' | 'CHARLIE' | 'DELTA', RosterPersonnel[]>>(getActiveRosterPersonnel());
  const [isEditingPersonnelModal, setIsEditingPersonnelModal] = useState<boolean>(false);
  const [editDraft, setEditDraft] = useState<Record<'ALPHA' | 'BRAVO' | 'CHARLIE' | 'DELTA', RosterPersonnel[]>>(getActiveRosterPersonnel());
  const [saveLoading, setSaveLoading] = useState<boolean>(false);
  const [personnelFeedback, setPersonnelFeedback] = useState<string | null>(null);
  const [is4PletonExpanded, setIs4PletonExpanded] = useState<boolean>(false);

  useEffect(() => {
    const unsub = subscribeToActiveRosterPersonnel((personnel) => {
      if (personnel && personnel.ALPHA && personnel.BRAVO && personnel.CHARLIE && personnel.DELTA) {
        setActiveRosterPersonnel(personnel);
        setActivePersonnel(personnel);
      }
    });
    return () => unsub();
  }, []);

  // Month name helper
  const MONTH_NAMES = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  // Helper to check if a report's date matches selected month & year
  const isReportInSelectedMonth = (reportDateStr?: string, createdAt?: string) => {
    if (isAllTimeFilter) return true;
    let y: number | undefined;
    let m: number | undefined;

    // Check reportDateStr (e.g., "Kamis, 01 Oktober 2026", "2026-10-01", etc.)
    if (reportDateStr) {
      const lower = reportDateStr.toLowerCase();
      // Look for 4-digit year
      const yMatch = lower.match(/\b(20\d{2})\b/);
      if (yMatch) y = parseInt(yMatch[1], 10);
      
      // Look for month index
      for (let i = 0; i < MONTH_NAMES.length; i++) {
        const mName = MONTH_NAMES[i].toLowerCase();
        if (lower.includes(mName)) {
          m = i;
          break;
        }
      }

      // If formatted as YYYY-MM-DD
      const isoMatch = reportDateStr.match(/(\d{4})-(\d{2})-(\d{2})/);
      if (isoMatch) {
        y = parseInt(isoMatch[1], 10);
        m = parseInt(isoMatch[2], 10) - 1;
      }
    }

    // Fallback to createdAt ISO timestamp
    if ((y === undefined || m === undefined) && createdAt) {
      try {
        const d = new Date(createdAt);
        if (!isNaN(d.getTime())) {
          y = d.getFullYear();
          m = d.getMonth();
        }
      } catch {}
    }

    if (y !== undefined && m !== undefined) {
      return y === selectedYear && m === selectedMonth;
    }

    return true; // if date couldn't be parsed, keep in list
  };

  // Filtered operational datasets based on current running month
  const activePatrols = patrols.filter(p => isReportInSelectedMonth(p.hariTanggal, p.createdAt));
  const activeOccurrences = occurrences.filter(o => isReportInSelectedMonth(o.hariTanggal, o.createdAt));
  const activeStrikes = strikes.filter(s => isReportInSelectedMonth(s.hariTanggal, s.createdAt));
  const activeVehicles = vehicles.filter(v => isReportInSelectedMonth(v.hariTanggal, v.createdAt));

  // Count pending drafts across all reports
  const pendingDraftPatrols = patrols.filter(p => p.isDraft);
  const pendingDraftOccurrences = occurrences.filter(o => o.isDraft);
  const pendingDraftStrikes = strikes.filter(s => s.isDraft);
  const pendingDraftVehicles = vehicles.filter(v => v.isDraft);
  const totalPendingDrafts = pendingDraftPatrols.length + pendingDraftOccurrences.length + pendingDraftStrikes.length + pendingDraftVehicles.length;

  const totalPatrols = activePatrols.length;
  const totalOccurrences = activeOccurrences.length;
  const totalStrikes = activeStrikes.length;
  const totalVehicles = activeVehicles.length;
  const totalSatwaObserved = activePatrols.reduce((acc, p) => acc + p.totalPopulasiTeramati, 0);
  const strikeWithDamage = activeStrikes.filter(s => s.indikasiKerusakan === 'Ada').length;
  const [focusedGridCell, setFocusedGridCell] = useState<string | null>(null);
  const [mapViewMode, setMapViewMode] = useState<'hotspot' | 'grid'>('hotspot');
  const [dashboardViewMode, setDashboardViewMode] = useState<'command-center' | 'strike-population-analytics'>('command-center');

  const handleJumpToGrid = (gridLocation?: string, fallbackText?: string) => {
    setMapViewMode('grid');
    const code = extractGridCode(gridLocation, fallbackText) || 'C8';
    setFocusedGridCell(code);
    setTimeout(() => {
      const el = document.getElementById('airside-grid-map');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
  };

  // Species distribution aggregation based on filtered patrols
  const speciesMap: Record<string, number> = {};
  activePatrols.forEach(p => {
    p.temuanSatwa.forEach(s => {
      speciesMap[s.spesies] = (speciesMap[s.spesies] || 0) + s.jumlah;
    });
  });
  const topSpecies = Object.entries(speciesMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  if (dashboardViewMode === 'strike-population-analytics') {
    return (
      <div className="space-y-6">
        {/* Top Switcher Navigation to return or toggle */}
        <div className="flex items-center justify-between bg-white p-2.5 rounded-2xl border border-slate-200 shadow-xs flex-wrap gap-2">
          <div className="flex items-center space-x-1.5 p-1 bg-slate-100 rounded-xl text-xs font-bold w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setDashboardViewMode('command-center')}
              className="flex-1 sm:flex-initial px-3.5 py-2 rounded-lg text-slate-600 hover:text-slate-900 transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <Compass className="w-4 h-4 text-slate-500" />
              <span>Pusat Operasional &amp; Radar Spasial</span>
            </button>
            <button
              type="button"
              className="flex-1 sm:flex-initial px-3.5 py-2 rounded-lg bg-gradient-to-r from-rose-700 to-indigo-700 text-white shadow-xs font-bold transition flex items-center justify-center gap-2"
            >
              <BarChart3 className="w-4 h-4 text-emerald-300" />
              <span>Grafik Batang Strike &amp; Populasi Burung (Tahun 2026)</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-400/20 text-emerald-300 border border-emerald-400/30 font-mono hidden md:inline">
                Tahun 2026
              </span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => setDashboardViewMode('command-center')}
            className="text-xs font-semibold text-sky-700 hover:text-sky-900 flex items-center gap-1 cursor-pointer px-3 py-1.5 rounded-lg hover:bg-sky-50 transition"
          >
            <span>&larr; Kembali ke Pusat Operasional</span>
          </button>
        </div>

        {/* The Dedicated Multi-Year Bar Chart Dashboard */}
        <WildlifeStrikePopulationDashboard
          patrols={patrols}
          occurrences={occurrences}
          strikes={strikes}
          monthlyDocuments={monthlyDocuments}
          onNavigateToForm={onNavigateToForm}
          onOpenUploadMonthly={onOpenUploadMonthly}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 1. Section Header: Title (1 row, max 20-22px) */}
      <div className="flex items-center justify-between gap-2.5">
        <div className="flex items-center gap-2 min-w-0">
          <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight truncate">
            Monitoring &amp; Pelaporan Wildlife Hazard Management
          </h2>
          <span className="hidden sm:inline-block px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 shrink-0">
            CGK AIRSIDE
          </span>
        </div>
        <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 shrink-0 hidden md:inline">
          ICAO Doc 9137 Part 3 / KP 326
        </span>
      </div>

      {/* 2. Main Action Buttons: 4 Kolom di Desktop, 2 Kolom di Mobile, Tinggi 36-38px, Above the Fold */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-2.5">
        <button
          type="button"
          onClick={() => onNavigateToForm('patrol')}
          className="h-9 sm:h-9.5 px-3 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs transition flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
          title="WOR — Wildlife Observation Report: observasi dan pengumpulan data satwa liar"
        >
          <Plus className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">WOR — Observasi Satwa</span>
        </button>

        <button
          type="button"
          onClick={() => onNavigateToForm('occurrence')}
          className="h-9 sm:h-9.5 px-3 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs transition flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
          title="WHR — Wildlife Hazard Report: identifikasi bahaya, evaluasi risiko, dan mitigasi"
        >
          <Plus className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">WHR — Hazard Report</span>
        </button>

        <button
          type="button"
          onClick={() => onNavigateToForm('strike')}
          className="h-9 sm:h-9.5 px-3 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs transition flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
          title="WSR — Wildlife Strike Report: pencatatan dugaan atau kejadian wildlife strike, bukti, dampak, dan status verifikasi"
        >
          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">WSR — Strike Report</span>
        </button>

        <button
          type="button"
          onClick={() => onNavigateToForm('vehicle')}
          className="h-9 sm:h-9.5 px-3 rounded-lg bg-teal-600 hover:bg-teal-500 text-white font-semibold text-xs transition flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
          title="Pengecekan Kendaraan Dinas dan Serah Terima Tugas"
        >
          <Truck className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">Check Kendaraan Dinas</span>
        </button>
      </div>

      {/* 3. Kartu Periode Data: Slim Toolbar (~48px height) dengan Summary 1 Baris */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700/80 px-3 py-2 flex flex-col md:flex-row items-start md:items-center justify-between gap-2 shadow-2xs">
        <div className="flex items-center gap-2 flex-wrap w-full md:w-auto">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1 shrink-0">
            <Calendar className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
            Periode:
          </span>

          <div className="flex items-center bg-slate-100 dark:bg-slate-900 rounded-lg p-0.5 border border-slate-200 dark:border-slate-700 text-xs">
            <select
              value={selectedMonth}
              disabled={isAllTimeFilter}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value, 10))}
              className={`bg-transparent text-xs font-semibold text-slate-800 dark:text-slate-100 px-2 py-1 outline-hidden cursor-pointer ${
                isAllTimeFilter ? 'opacity-40 cursor-not-allowed' : ''
              }`}
            >
              {MONTH_NAMES.map((m, idx) => (
                <option key={m} value={idx} className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100">
                  {m}
                </option>
              ))}
            </select>

            <select
              value={selectedYear}
              disabled={isAllTimeFilter}
              onChange={(e) => setSelectedYear(parseInt(e.target.value, 10))}
              className={`bg-transparent text-xs font-semibold text-sky-600 dark:text-sky-400 px-2 py-1 outline-hidden cursor-pointer border-l border-slate-200 dark:border-slate-700 ${
                isAllTimeFilter ? 'opacity-40 cursor-not-allowed' : ''
              }`}
            >
              {[2024, 2025, 2026, 2027].map((y) => (
                <option key={y} value={y} className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100">
                  {y}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={() => {
              setIsAllTimeFilter(false);
              setSelectedMonth(new Date().getMonth());
              setSelectedYear(new Date().getFullYear());
            }}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition cursor-pointer flex items-center gap-1 ${
              !isAllTimeFilter && selectedMonth === currentMonthIdx && selectedYear === currentYearVal
                ? 'bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800 font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
            title="Tampilkan data berdasarkan bulan berjalan saat ini"
          >
            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
            <span>Bulan Berjalan ({MONTH_NAMES[currentMonthIdx]} {currentYearVal})</span>
          </button>

          <button
            type="button"
            onClick={() => setIsAllTimeFilter(v => !v)}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition cursor-pointer border ${
              isAllTimeFilter
                ? 'bg-slate-900 text-white dark:bg-sky-600 border-slate-900 dark:border-sky-600'
                : 'text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
          >
            {isAllTimeFilter ? 'Semua Data' : 'Semua'}
          </button>
        </div>

        {/* Ringkasan 1 Baris */}
        <div className="text-xs font-mono text-slate-500 dark:text-slate-400 shrink-0 self-end md:self-center">
          {totalPatrols} WOR · {totalOccurrences} WHR · {totalStrikes} WSR · {totalVehicles} checklist
          {totalPendingDrafts > 0 && (
            <span className="text-amber-600 dark:text-amber-400 font-bold ml-1.5 bg-amber-50 dark:bg-amber-950/40 px-1.5 py-0.5 rounded border border-amber-200 dark:border-amber-800">
              ({totalPendingDrafts} draft aktif)
            </span>
          )}
        </div>
      </div>

      {/* Pending Drafts Operational Notice */}
      {totalPendingDrafts > 0 && (
        <div className="bg-gradient-to-r from-amber-50 via-amber-50/80 to-transparent dark:from-amber-950/40 dark:via-amber-950/20 dark:to-transparent border-l-4 border-amber-500 border border-slate-200 dark:border-slate-800 p-3 sm:p-3.5 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-amber-950 dark:text-amber-200 shadow-2xs animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-amber-500 text-slate-950 rounded-lg shrink-0 shadow-xs">
              <Bookmark className="w-4 h-4 fill-current" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-slate-900 dark:text-slate-100">
                  Perhatian: Terdapat {totalPendingDrafts} Draft Laporan Belum Diterbitkan
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-200 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-700">
                  Pending Pelaporan
                </span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5">
                Rincian draft: {pendingDraftPatrols.length > 0 && `${pendingDraftPatrols.length} WOR (Observasi) `}{pendingDraftOccurrences.length > 0 && `${pendingDraftOccurrences.length} WHR (Hazard) `}{pendingDraftStrikes.length > 0 && `${pendingDraftStrikes.length} WSR (Strike) `}{pendingDraftVehicles.length > 0 && `${pendingDraftVehicles.length} Kendaraan`}. Dokumen disimpan sementara dan belum disahkan secara operasional.
              </p>
            </div>
          </div>
          {onNavigateToHistory && (
            <button
              type="button"
              onClick={onNavigateToHistory}
              className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-lg text-xs transition cursor-pointer shadow-xs flex items-center gap-1.5 shrink-0"
            >
              <Bookmark className="w-3.5 h-3.5 fill-current" />
              <span>Buka &amp; Selesaikan Draft ({totalPendingDrafts})</span>
            </button>
          )}
        </div>
      )}

      {/* 4. KPI Metric Cards (Padding 12-14px, Gap 8-12px, Rounded 8-10px) */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-2.5 sm:gap-3">
        {/* Card 1: WOR — Wildlife Observation Report */}
        <div 
          className="bg-white dark:bg-slate-800 p-3 sm:p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs hover:border-slate-300 dark:hover:border-slate-600 transition"
          title="WOR — Wildlife Observation Report: observasi dan pengumpulan data satwa liar"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">WOR (Observasi)</span>
            <div className="p-1.5 rounded-lg bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-1.5">
            <div className="flex items-baseline space-x-1.5">
              <span className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">{totalPatrols}</span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">Laporan</span>
            </div>
            <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium mt-0.5 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 shrink-0" />
              <span>100% Perimeter Terinspeksi</span>
            </p>
          </div>
        </div>

        {/* Card 2: WHR — Wildlife Hazard Report */}
        <div 
          onClick={() => occurrences.length > 0 && handleJumpToGrid(occurrences[0].gridLocation, occurrences[0].lokasi)}
          className={`bg-white dark:bg-slate-800 p-3 sm:p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs hover:border-slate-300 dark:hover:border-slate-600 transition ${
            occurrences.length > 0 ? 'cursor-pointer hover:border-amber-400 group' : ''
          }`}
          title="WHR — Wildlife Hazard Report: identifikasi bahaya, evaluasi risiko, dan mitigasi"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">WHR (Hazard)</span>
            <div className="p-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 group-hover:bg-amber-100 transition">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-1.5">
            <div className="flex items-baseline space-x-1.5">
              <span className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">{totalOccurrences}</span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">Kejadian</span>
            </div>
            <p className="text-[11px] text-amber-600 dark:text-amber-400 font-medium mt-0.5 truncate">
              {occurrences.filter(o => o.status === 'Selesai').length} Selesai diusir / ditangani
            </p>
          </div>
        </div>

        {/* Card 3: WSR — Wildlife Strike Report */}
        <div 
          onClick={() => strikes.length > 0 && handleJumpToGrid(strikes[0].gridLocation, strikes[0].lokasi)}
          className={`bg-white dark:bg-slate-800 p-3 sm:p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs hover:border-slate-300 dark:hover:border-slate-600 transition ${
            strikes.length > 0 ? 'cursor-pointer hover:border-rose-400 group' : ''
          }`}
          title="WSR — Wildlife Strike Report: pencatatan dugaan atau kejadian wildlife strike, bukti, dampak, dan status verifikasi"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">WSR (Strike)</span>
            <div className="p-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 group-hover:bg-rose-100 transition">
              <Plane className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-1.5">
            <div className="flex items-baseline space-x-1.5">
              <span className="text-xl sm:text-2xl font-bold text-rose-600 dark:text-rose-400">{totalStrikes}</span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">Insiden</span>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 font-medium mt-0.5 truncate">
              Kerusakan: <strong className={strikeWithDamage > 0 ? 'text-rose-600 font-bold' : 'text-emerald-600 font-semibold'}>{strikeWithDamage} Kasus</strong>
            </p>
          </div>
        </div>

        {/* Card 4: Populasi Satwa Teramati */}
        <div 
          onClick={() => setDashboardViewMode('strike-population-analytics')}
          className="bg-white dark:bg-slate-800 p-3 sm:p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs hover:border-slate-300 dark:hover:border-slate-600 transition cursor-pointer hover:border-emerald-400 group"
          title="Klik untuk melihat Analisis Populasi Burung & Strike"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Satwa Teramati</span>
            <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 group-hover:bg-emerald-100 transition">
              <Bird className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-1.5">
            <div className="flex items-baseline space-x-1.5">
              <span className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">{totalSatwaObserved}</span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">Ekor</span>
            </div>
            <p className="text-[11px] text-sky-600 dark:text-sky-400 font-medium mt-0.5 truncate">
              Didominasi Burung Air &amp; Pipit
            </p>
          </div>
        </div>

        {/* Card 5: Kendaraan Operasional & Serah Terima */}
        <div 
          onClick={() => onNavigateToForm('vehicle')}
          className="col-span-2 sm:col-span-1 bg-white dark:bg-slate-800 p-3 sm:p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs hover:border-slate-300 dark:hover:border-slate-600 transition cursor-pointer hover:border-teal-400 group"
          title="Klik untuk membuka form checklist kendaraan"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Armada Kendaraan</span>
            <div className="p-1.5 rounded-lg bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400 group-hover:bg-teal-100 transition">
              <Truck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-1.5">
            <div className="flex items-baseline space-x-1.5">
              <span className="text-xl sm:text-2xl font-bold text-teal-700 dark:text-teal-300">{totalVehicles}</span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">Checklist</span>
            </div>
            <p className="text-[11px] text-teal-700 dark:text-teal-300 font-medium mt-0.5 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 shrink-0" />
              <span>Dinas Pagi &amp; Malam</span>
            </p>
          </div>
        </div>
      </div>
      {/* Feedback banner if updated */}
      {personnelFeedback && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center justify-between gap-2 shadow-2xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{personnelFeedback}</span>
          </div>
          <button
            type="button"
            onClick={() => setPersonnelFeedback(null)}
            className="text-emerald-700 hover:text-emerald-900 p-0.5 rounded cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Expandable Collapsible 4 Pleton Directory Drawer (Ringkas: Hanya Tampil Saat Dibuka) */}
      {is4PletonExpanded && (
        <div className="bg-white rounded-2xl border border-sky-200 shadow-sm p-4 sm:p-5 space-y-4 animate-in fade-in duration-200">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 pb-3.5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-sky-50 text-sky-600 border border-sky-100">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-bold text-sm sm:text-base text-slate-900">
                  Susunan Personel 4 Pleton (Total 8 Personel Resmi)
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 font-mono flex items-center gap-1 border border-emerald-200">
                  <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                  Real-Time Sync Terhubung
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Rotasi 4 Hari (Pagi - Malam - Libur - Libur) • Shift Aktif Saat Ini: <strong className="text-slate-800">{activeDuty.pleton} ({activeDuty.shiftType === 'PAGI' ? 'Shift Pagi APME' : 'Shift Malam APMG'})</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => {
                setEditDraft(JSON.parse(JSON.stringify(activePersonnel)));
                setIsEditingPersonnelModal(true);
              }}
              className="px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
              title="Perbarui daftar nama dan NIK personel 4 Pleton yang tersinkronisasi otomatis ke semua device"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Update / Edit 8 Personel</span>
            </button>
            <button
              type="button"
              onClick={async () => {
                if (window.confirm('Kembalikan susunan personel ke daftar resmi SK Dept Head (NURJAYA, DANIL, YUDHA, KUKUH, dll)?')) {
                  resetToOfficialRosterPersonnel();
                  const def = OFFICIAL_ROSTER_PERSONNEL;
                  setActivePersonnel(def);
                  try {
                    await saveActiveRosterPersonnelToFirestore(def);
                    setPersonnelFeedback('Susunan Personel 4 Pleton berhasil di-reset ke dokumen resmi SK Dept Head.');
                    setTimeout(() => setPersonnelFeedback(null), 5000);
                  } catch (e) {
                    console.error('Reset error:', e);
                  }
                }
              }}
              className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium border border-slate-200 transition cursor-pointer"
              title="Reset ke susunan personel resmi SK Dept Head"
            >
              <RefreshCw className="w-3 h-3 text-slate-500 inline mr-1" />
              <span>Reset Resmi</span>
            </button>
            {onOpenDutyRoster && (
              <button
                type="button"
                onClick={onOpenDutyRoster}
                className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium border border-slate-200 transition cursor-pointer"
              >
                <span>Kalender Roster →</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => setIs4PletonExpanded(false)}
              className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-medium cursor-pointer"
            >
              <span>Tutup ✕</span>
            </button>
          </div>
        </div>

        {/* 4 Pleton Directory Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {(['ALPHA', 'BRAVO', 'CHARLIE', 'DELTA'] as const).map((code) => {
            const members = activePersonnel[code] || OFFICIAL_ROSTER_PERSONNEL[code];
            const pletonName = code === 'ALPHA' ? 'Pleton Alpha' : code === 'BRAVO' ? 'Pleton Bravo' : code === 'CHARLIE' ? 'Pleton Charlie' : 'Pleton Delta';
            const isCurrent = activeDuty.pletonCode === code;
            
            const badgeStyle = code === 'ALPHA' 
              ? 'bg-blue-50 text-blue-700 border-blue-200' 
              : code === 'BRAVO' 
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
              : code === 'CHARLIE' 
              ? 'bg-purple-50 text-purple-700 border-purple-200' 
              : 'bg-amber-50 text-amber-700 border-amber-200';

            return (
              <div 
                key={code} 
                className={`rounded-xl p-3 border transition ${
                  isCurrent 
                    ? 'bg-sky-50/80 border-sky-300 ring-2 ring-sky-400/30 shadow-xs' 
                    : 'bg-slate-50/70 border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-slate-200/80">
                  <span className={`px-2 py-0.5 rounded text-[11px] font-bold border uppercase ${badgeStyle}`}>
                    {pletonName}
                  </span>
                  {isCurrent && (
                    <span className="text-[10px] font-bold text-sky-700 bg-sky-100 px-1.5 py-0.2 rounded flex items-center gap-0.5 font-mono">
                      <CheckCircle2 className="w-2.5 h-2.5" /> ON DUTY
                    </span>
                  )}
                </div>
                <div className="space-y-2">
                  {members.map((m, idx) => (
                    <div key={idx} className="text-xs bg-white p-2 rounded-lg border border-slate-200 shadow-2xs">
                      <p className="font-bold text-slate-900 leading-tight">{m.nama}</p>
                      <p className="font-mono text-[10px] text-slate-500 mt-0.5">NIK: {m.nik}</p>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      )}

      {/* Direct Modal Edit Susunan Personel 4 Pleton (Total 8 Personel) */}
      {isEditingPersonnelModal && (
        <div className="fixed inset-0 z-60 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-sky-500/20 text-sky-400 border border-sky-500/30">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white">
                    Kelola &amp; Update Susunan Personel (4 Pleton - 8 Personel)
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Perubahan langsung terhubung dan tersinkronisasi otomatis di device seluruh petugas.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsEditingPersonnelModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 sm:p-6 overflow-y-auto space-y-4">
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-800 text-xs flex items-start gap-2">
                <Shield className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Ketentuan Standar WHU Bandara:</p>
                  <p className="text-[11px] text-amber-700 mt-0.5">
                    Terdapat 4 Pleton (Alpha, Bravo, Charlie, Delta) dengan masing-masing 2 personel per pleton (total 8 personel dinas). Pastikan nama lengkap dan NIK akurat sesuai SK Dinas.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(['ALPHA', 'BRAVO', 'CHARLIE', 'DELTA'] as const).map((code) => {
                  const pletonName = code === 'ALPHA' ? 'Pleton Alpha' : code === 'BRAVO' ? 'Pleton Bravo' : code === 'CHARLIE' ? 'Pleton Charlie' : 'Pleton Delta';
                  const pletonMembers = editDraft[code] || [
                    { nama: '', nik: '', pleton: pletonName as any, pletonCode: code },
                    { nama: '', nik: '', pleton: pletonName as any, pletonCode: code }
                  ];
                  while (pletonMembers.length < 2) {
                    pletonMembers.push({ nama: '', nik: '', pleton: pletonName as any, pletonCode: code });
                  }

                  const badgeStyle = code === 'ALPHA' 
                    ? 'bg-blue-50 text-blue-700 border-blue-200' 
                    : code === 'BRAVO' 
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                    : code === 'CHARLIE' 
                    ? 'bg-purple-50 text-purple-700 border-purple-200' 
                    : 'bg-amber-50 text-amber-700 border-amber-200';

                  return (
                    <div key={code} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
                      <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-bold border uppercase ${badgeStyle}`}>
                          {pletonName}
                        </span>
                        <span className="text-[10px] font-mono text-slate-500">2 Personel</span>
                      </div>

                      <div className="space-y-3">
                        {pletonMembers.slice(0, 2).map((mem, idx) => (
                          <div key={idx} className="bg-white p-2.5 rounded-lg border border-slate-200 space-y-1.5 shadow-2xs">
                            <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600">
                              <span>Petugas #{idx + 1}</span>
                            </div>
                            <div>
                              <label className="block text-[10px] font-medium text-slate-500 mb-0.5">
                                Nama Lengkap
                              </label>
                              <input
                                type="text"
                                value={mem.nama}
                                onChange={(e) => {
                                  const val = e.target.value.toUpperCase();
                                  setEditDraft(prev => {
                                    const updatedPleton = [...(prev[code] || [])];
                                    updatedPleton[idx] = { ...updatedPleton[idx], nama: val, pleton: pletonName as any, pletonCode: code };
                                    return { ...prev, [code]: updatedPleton };
                                  });
                                }}
                                placeholder="Contoh: NURJAYA"
                                className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold uppercase focus:ring-2 focus:ring-sky-500 outline-hidden"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-medium text-slate-500 mb-0.5">
                                NIK / No. Induk Karyawan
                              </label>
                              <input
                                type="text"
                                value={mem.nik}
                                onChange={(e) => {
                                  const val = e.target.value.trim();
                                  setEditDraft(prev => {
                                    const updatedPleton = [...(prev[code] || [])];
                                    updatedPleton[idx] = { ...updatedPleton[idx], nik: val, pleton: pletonName as any, pletonCode: code };
                                    return { ...prev, [code]: updatedPleton };
                                  });
                                }}
                                placeholder="Contoh: 20242880"
                                className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-mono focus:ring-2 focus:ring-sky-500 outline-hidden"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => {
                  setEditDraft(JSON.parse(JSON.stringify(OFFICIAL_ROSTER_PERSONNEL)));
                }}
                className="w-full sm:w-auto px-3 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-200 rounded-xl transition cursor-pointer"
              >
                Isi Template Standar Resmi (SK Dept Head)
              </button>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setIsEditingPersonnelModal(false)}
                  className="flex-1 sm:flex-initial px-4 py-2 border border-slate-300 rounded-xl text-xs font-medium text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  disabled={saveLoading}
                  onClick={async () => {
                    setSaveLoading(true);
                    try {
                      setActiveRosterPersonnel(editDraft);
                      setActivePersonnel(editDraft);
                      await saveActiveRosterPersonnelToFirestore(editDraft);
                      setIsEditingPersonnelModal(false);
                      setPersonnelFeedback('Susunan Personel 4 Pleton (Total 8 Personel) berhasil diperbarui dan disinkronkan ke seluruh device!');
                      setTimeout(() => setPersonnelFeedback(null), 5000);
                    } catch (err) {
                      console.error('Error saving personnel:', err);
                      alert('Gagal menyimpan ke cloud database.');
                    } finally {
                      setSaveLoading(false);
                    }
                  }}
                  className="flex-1 sm:flex-initial px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {saveLoading ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Check className="w-3.5 h-3.5" />
                  )}
                  <span>Simpan &amp; Sinkronkan ke Semua Petugas</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Current Weather & Bird Activity Conditions Widget (Soekarno-Hatta WIII) */}
      <WeatherBirdActivityWidget airportId="WIII" />

      {/* Tri-Widget Operational Deck: Roster + Gemini AI + Arsip Bulanan (Ringkas & Efektif) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Widget 1: Jadwal Roster Dinas 4 Pleton */}
        <div className="bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-600 transition">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
                  <Calendar className="w-4 h-4" />
                </div>
                <h4 className="font-bold text-xs text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                  Roster Dinas 4 Pleton
                </h4>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800 font-mono">
                {activeDuty.shiftType === 'PAGI' ? 'APME' : 'APMG'} • {activeDuty.pleton}
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
              Petugas On-Duty Saat Ini:
            </p>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {activeDuty.personnel && activeDuty.personnel.length > 0 ? (
                activeDuty.personnel.map((p, idx) => (
                  <span key={idx} className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 text-[11px] font-semibold border border-slate-200 dark:border-slate-600">
                    {p.nama} ({p.nik})
                  </span>
                ))
              ) : (
                <span className="text-xs text-slate-400 italic">Jadwal rotasi 4 Pleton aktif</span>
              )}
            </div>
          </div>
          <div className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-700 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={onOpenDutyRoster}
              className="flex-1 min-w-[90px] py-1.5 px-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition flex items-center justify-center gap-1 cursor-pointer shadow-xs"
            >
              <span>Jadwal →</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setEditDraft(JSON.parse(JSON.stringify(activePersonnel)));
                setIsEditingPersonnelModal(true);
              }}
              className="py-1.5 px-2 rounded-lg bg-sky-50 hover:bg-sky-100 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800 text-xs font-semibold transition flex items-center gap-1 cursor-pointer"
              title="Edit susunan 8 personel resmi"
            >
              <Edit3 className="w-3 h-3" />
              <span>Edit 8 Personel</span>
            </button>
            <button
              type="button"
              onClick={() => setIs4PletonExpanded(prev => !prev)}
              className="py-1.5 px-2 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-xs font-medium transition flex items-center gap-1 cursor-pointer"
              title="Tampilkan daftar lengkap 4 Pleton"
            >
              <Users className="w-3 h-3" />
              <span>4 Pleton</span>
              {is4PletonExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
            <button
              type="button"
              onClick={onOpenUploadRoster || onOpenDutyRoster}
              className="py-1.5 px-2 rounded-lg bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold transition flex items-center gap-1 cursor-pointer"
              title="Unggah berkas roster Excel / PDF"
            >
              <Upload className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Widget 2: Analisis Risiko AI Gemini */}
        <div className="bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 shadow-2xs flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-600 transition">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-violet-50 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400">
                  <Sparkles className="w-4 h-4" />
                </div>
                <h4 className="font-bold text-xs text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                  Intelijen AI Gemini
                </h4>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                geminiAnalysis?.overallRiskLevel === 'KRITIS'
                  ? 'bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800'
                  : geminiAnalysis?.overallRiskLevel === 'TINGGI'
                  ? 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800'
                  : geminiAnalysis?.overallRiskLevel === 'SEDANG'
                  ? 'bg-sky-50 text-sky-700 border border-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800'
                  : 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
              }`}>
                {geminiAnalysis ? `${geminiAnalysis.overallRiskLevel} (${geminiAnalysis.riskScore}/100)` : 'Siap Analisis'}
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
              {geminiAnalysis?.executiveSummary 
                ? geminiAnalysis.executiveSummary 
                : `Analisis cerdas pola bahaya runway, hotspot risiko, dan rekomendasi mitigasi ICAO Doc 9137.`}
            </p>
          </div>
          <div className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between">
            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
              {totalPatrols} patroli • {totalStrikes} strike
            </span>
            {onOpenGeminiAnalytics && (
              <button
                type="button"
                onClick={onOpenGeminiAnalytics}
                className="py-1.5 px-3 rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold transition flex items-center gap-1 shadow-xs cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-violet-200" />
                <span>{geminiAnalysis ? 'Buka Analisis →' : 'Mulai AI →'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Widget 3: Arsip & Dokumen Laporan Bulanan */}
        <div className="bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-600 transition">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400">
                  <FolderArchive className="w-4 h-4" />
                </div>
                <h4 className="font-bold text-xs text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                  Arsip &amp; Rekap Bulanan
                </h4>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-50 text-sky-700 border border-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800 font-mono">
                {monthlyDocuments.length} Berkas
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
              Arsip laporan resmi format PDF (.pdf), Microsoft Word (.docx), dan integrasi draft JSON.
            </p>
          </div>
          <div className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-700 flex items-center gap-2">
            {onNavigateToHistory && (
              <button
                type="button"
                onClick={onNavigateToHistory}
                className="flex-1 py-1.5 px-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition flex items-center justify-center gap-1 cursor-pointer shadow-xs"
              >
                <span>Buka Arsip →</span>
              </button>
            )}
            {onOpenUploadMonthly && (
              <button
                type="button"
                onClick={onOpenUploadMonthly}
                className="py-1.5 px-2.5 rounded-lg bg-sky-50 hover:bg-sky-100 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800 text-xs font-semibold transition flex items-center gap-1 cursor-pointer"
                title="Unggah berkas laporan bulanan (PDF/Word)"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Unggah</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Airside Map Section (Pusat Pemetaan Spasial Sisi Udara - Tampil Langsung Di Atas) */}
      <div className="space-y-2.5">
        {/* Map View Mode Switcher Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                  Pusat Pemetaan Spasial Sisi Udara (Airside Hazard Map)
                </h3>
                <span className="hidden sm:inline-block px-1.5 py-0.2 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-600">
                  {mapViewMode === 'hotspot' ? 'Leaflet GPS & Hotspot' : 'Grid 14×7 Skematik'}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Visualisasi titik koordinat GPS insiden satwa, runway/taxiway, dan pemetaan hotspot risiko operasi.
              </p>
            </div>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-900 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700 w-full sm:w-auto">
            <button
              onClick={() => setMapViewMode('hotspot')}
              className={`flex-1 sm:flex-initial px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                mapViewMode === 'hotspot'
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Crosshair className="w-3.5 h-3.5 text-sky-200" />
              <span>Peta Hotspot (GPS Interaktif)</span>
            </button>
            <button
              onClick={() => setMapViewMode('grid')}
              className={`flex-1 sm:flex-initial px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                mapViewMode === 'grid'
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-amber-200" />
              <span>Skematik Grid CGK (14×7)</span>
            </button>
          </div>
        </div>

        {/* Selected Map with Transition */}
        <div
          key={mapViewMode}
          className="tab-transition-enter"
        >
          {mapViewMode === 'hotspot' ? (
            <WildlifeHotspotMap
              patrols={activePatrols}
              occurrences={activeOccurrences}
              strikes={activeStrikes}
              onPreviewReport={(type, id) => onPreviewReport(type, id)}
              onCreateReportWithLocation={onCreateReportWithLocation}
              onOpenBroadcast={onOpenBroadcast}
            />
          ) : (
            <AirsideRunwayMap
              patrols={activePatrols}
              occurrences={activeOccurrences}
              strikes={activeStrikes}
              selectedGridCell={focusedGridCell}
              onSelectGrid={(grid) => setFocusedGridCell(grid)}
              onSelectReport={(type, id) => onPreviewReport(type, id)}
              onOpenBroadcast={onOpenBroadcast}
            />
          )}
        </div>
      </div>

      {/* Wildlife Strike Monthly Trends Visualizer with Recharts */}
      <WildlifeStrikeMonthlyChart 
        strikes={strikes} 
        monthlyDocuments={monthlyDocuments} 
        onOpenUploadMonthly={onOpenUploadMonthly}
        onOpenFullPopulationDashboard={() => setDashboardViewMode('strike-population-analytics')}
      />

      {/* Grid for Operational Feeds & Top Species Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Operational Incident Feeds (2 Cols) */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Radio className="w-4 h-4 text-rose-600 animate-pulse" />
              <h3 className="font-bold text-sm text-slate-900">
                Aktivitas &amp; Laporan Operasional ({isAllTimeFilter ? 'Semua' : `${MONTH_NAMES[selectedMonth]} ${selectedYear}`})
              </h3>
            </div>
            <span className="text-xs text-slate-400 font-medium">Auto-Sync Airside Feed</span>
          </div>

          <div className="divide-y divide-slate-100 max-h-[440px] overflow-y-auto">
            {/* Empty state: 1 baris teks abu-abu kecil */}
            {activeStrikes.length === 0 && activeOccurrences.length === 0 && activePatrols.length === 0 && (
              <div className="py-6 text-center text-xs text-slate-400 dark:text-slate-500 font-medium">
                Belum ada aktivitas operasional pada periode ini (0 data).
              </div>
            )}

            {/* Strikes */}
            {activeStrikes.map(strike => {
              const gridCode = extractGridCode(strike.gridLocation, `${strike.lokasi} ${strike.runwayTaxiway}`) || 'C8';
              return (
                <div key={strike.id} className="p-4 hover:bg-rose-50/40 transition flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span 
                        title="WSR — Wildlife Strike Report: pencatatan dugaan atau kejadian wildlife strike, bukti, dampak, dan status verifikasi"
                        className="px-2 py-0.5 rounded bg-rose-100 text-rose-700 font-bold text-[10px] tracking-wide cursor-help"
                      >
                        WSR — WILDLIFE STRIKE
                      </span>
                      <span className="text-xs font-semibold text-slate-800">{strike.flightNumber} ({strike.operatorAirline})</span>
                      <span className="text-xs text-slate-400">• {strike.waktuKejadian}</span>
                      <span className="px-1.5 py-0.2 rounded font-mono text-[10px] font-bold bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-200 border border-rose-200 dark:border-rose-800">
                        GRID {gridCode}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 font-medium">
                      {strike.lokasi} | Spesies: {strike.jenisWildlife} ({strike.jumlahWildlife} ekor)
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Fase: <span className="font-semibold text-slate-700">{strike.fasePenerbangan}</span> | Kerusakan: <span className={strike.indikasiKerusakan === 'Ada' ? 'text-red-600 font-bold' : 'text-emerald-700'}>{strike.indikasiKerusakan}</span>
                    </p>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-wrap items-center gap-1.5 self-end sm:self-center">
                    <button
                      onClick={() => handleJumpToGrid(strike.gridLocation, `${strike.lokasi} ${strike.runwayTaxiway}`)}
                      className="px-2.5 py-1 text-xs font-semibold text-rose-700 bg-rose-100 hover:bg-rose-200 rounded transition flex items-center gap-1 cursor-pointer"
                      title="Sorot lokasi di Gridmap"
                    >
                      <Crosshair className="w-3.5 h-3.5 text-rose-600" />
                      <span>Grid {gridCode}</span>
                    </button>
                    <button
                      onClick={() => onPreviewReport('strike', strike.id)}
                      className="px-2.5 py-1 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded transition cursor-pointer"
                    >
                      Detail
                    </button>
                    <button
                      onClick={() => exportStrikePDF(strike)}
                      className="p-1 text-slate-600 hover:text-rose-600 bg-slate-100 hover:bg-rose-50 rounded transition cursor-pointer"
                      title="Cetak PDF Resmi"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onOpenBroadcast('STRIKE', strike)}
                      className="p-1 text-slate-600 hover:text-sky-600 bg-slate-100 hover:bg-sky-50 rounded transition cursor-pointer"
                      title="Kirim Notifikasi Manajemen"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}

            {/* Occurrences */}
            {activeOccurrences.map(occ => {
              const gridCode = extractGridCode(occ.gridLocation, `${occ.lokasi} ${occ.runwayTaxiwayArea}`) || 'G12';
              return (
                <div key={occ.id} className="p-4 hover:bg-amber-50/40 transition flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span 
                        title="WHR — Wildlife Hazard Report: identifikasi bahaya, evaluasi risiko, dan mitigasi"
                        className="px-2 py-0.5 rounded bg-amber-100 text-amber-700 font-bold text-[10px] tracking-wide cursor-help"
                      >
                        WHR — HAZARD REPORT
                      </span>
                      <span className="text-xs font-semibold text-slate-800">{occ.reportNumber}</span>
                      <span className="text-xs text-slate-400">• {occ.waktuKejadian}</span>
                      <span className="px-1.5 py-0.2 rounded font-mono text-[10px] font-bold bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-200 border border-amber-200 dark:border-amber-800">
                        GRID {gridCode}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 font-medium">
                      {occ.lokasi} - {occ.jenisOccurrence}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Satwa: <span className="font-semibold">{occ.jenisSatwa} ({occ.jumlahSatwa} ekor)</span> | Status: <span className="text-amber-700 font-semibold">{occ.status}</span>
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5 self-end sm:self-center">
                    <button
                      onClick={() => handleJumpToGrid(occ.gridLocation, `${occ.lokasi} ${occ.runwayTaxiwayArea}`)}
                      className="px-2.5 py-1 text-xs font-semibold text-amber-800 bg-amber-100 hover:bg-amber-200 rounded transition flex items-center gap-1 cursor-pointer"
                      title="Sorot lokasi di Gridmap"
                    >
                      <Crosshair className="w-3.5 h-3.5 text-amber-700" />
                      <span>Grid {gridCode}</span>
                    </button>
                    <button
                      onClick={() => onPreviewReport('occurrence', occ.id)}
                      className="px-2.5 py-1 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded transition cursor-pointer"
                    >
                      Detail
                    </button>
                    <button
                      onClick={() => exportOccurrencePDF(occ)}
                      className="p-1 text-slate-600 hover:text-amber-600 bg-slate-100 hover:bg-amber-50 rounded transition cursor-pointer"
                      title="Cetak PDF Resmi"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onOpenBroadcast('OCCURRENCE', occ)}
                      className="p-1 text-slate-600 hover:text-sky-600 bg-slate-100 hover:bg-sky-50 rounded transition cursor-pointer"
                      title="Kirim Notifikasi WhatsApp"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}

            {/* Patrols */}
            {activePatrols.map(patrol => (
              <div key={patrol.id} className="p-4 hover:bg-slate-50 transition flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span 
                      title="WOR — Wildlife Observation Report: observasi dan pengumpulan data satwa liar"
                      className="px-2 py-0.5 rounded bg-sky-100 text-sky-700 font-bold text-[10px] tracking-wide cursor-help"
                    >
                      WOR — OBSERVASI SATWA
                    </span>
                    <span className="text-xs font-semibold text-slate-800">{patrol.pleton} - {patrol.dinas.split(' ')[1]}</span>
                    <span className="text-xs text-slate-400">• {patrol.waktuPatroli}</span>
                  </div>
                  <p className="text-xs text-slate-600 font-medium">
                    {patrol.rutePatroli}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Total Teramati: <strong className="text-slate-800">{patrol.totalPopulasiTeramati} ekor</strong> | POD: {patrol.pod.join(', ')}
                  </p>
                </div>

                <div className="flex items-center space-x-1.5 self-end sm:self-center">
                  <button
                    onClick={() => onPreviewReport('patrol', patrol.id)}
                    className="px-2.5 py-1 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded transition"
                  >
                    Detail
                  </button>
                  <button
                    onClick={() => exportPatrolPDF(patrol)}
                    className="p-1 text-slate-600 hover:text-sky-600 bg-slate-100 hover:bg-sky-50 rounded transition"
                    title="Cetak PDF Resmi"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onOpenBroadcast('PATROL', patrol)}
                    className="p-1 text-slate-600 hover:text-sky-600 bg-slate-100 hover:bg-sky-50 rounded transition"
                    title="Kirim Notifikasi WhatsApp"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Sidebar: Wildlife Population Breakdown & Airport Operation Status */}
        <div className="space-y-4">
          {/* Species Distribution Card */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-3">
              <h3 className="font-bold text-xs text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Bird className="w-4 h-4 text-sky-600" />
                Spesies Paling Sering Teramati
              </h3>
            </div>
            <div className="space-y-3">
              {topSpecies.map(([name, count], idx) => {
                const percentage = totalSatwaObserved > 0 ? Math.round((count / totalSatwaObserved) * 100) : 0;
                return (
                  <div key={idx} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-slate-700 truncate max-w-[190px]">{name}</span>
                      <span className="font-bold text-slate-900">{count} ekor</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5">
                      <div
                        className="bg-sky-600 h-1.5 rounded-full"
                        style={{ width: `${Math.min(percentage * 2, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
              {topSpecies.length === 0 && (
                <div className="py-3 text-center text-xs text-slate-400 dark:text-slate-500 font-medium">
                  Tidak ada satwa teramati (0 data).
                </div>
              )}
            </div>
          </div>

          {/* Operational Wildlife Hazard Readiness Card (Clean Light Card) */}
          <div className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-200 mb-2 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Status Kesiapan Operasional</span>
            </h3>
            <div className="space-y-1.5 text-xs">
              <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-700">
                <span className="text-slate-600 dark:text-slate-400">BST 01 &amp; BST 02</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  Standby (05 Min)
                </span>
              </div>
              <div className="flex items-center justify-between py-1">
                <span className="text-slate-600 dark:text-slate-400">Handy Talky Channel ATC Tower</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  Terhubung
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
