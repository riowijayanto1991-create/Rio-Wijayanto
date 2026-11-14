import React, { useState } from 'react';
import { 
  FileText, 
  Search, 
  Download, 
  FileSpreadsheet, 
  Eye, 
  Share2, 
  Calendar, 
  Filter, 
  CheckCircle2, 
  AlertTriangle, 
  Plane, 
  Bird, 
  Trash2, 
  Shield, 
  ShieldAlert, 
  Lock, 
  Unlock, 
  AlertOctagon, 
  Loader2, 
  X, 
  Info,
  Edit3,
  Truck,
  FolderArchive,
  Upload,
  FileCode,
  Bookmark,
  Clock,
  RotateCcw
} from 'lucide-react';
import { PatrolReport, OccurrenceReport, WildlifeStrikeReport, VehicleCheckReport, MonthlyReportDocument } from '../types';
import { exportPatrolPDF, exportOccurrencePDF, exportStrikePDF, exportVehiclePDF } from '../utils/pdfExport';
import { exportSinglePatrolToExcel, exportAllToExcel } from '../utils/excelExport';
import { AdminAuthModal } from './AdminAuthModal';
import { MonthlyReportArchive } from './MonthlyReportArchive';
import { getChronologicalDocNumber, formatReportCreationTime } from '../utils/reportNumberGenerator';
import { parseIndonesianDateToYYYYMMDD, getTodayDateString } from '../utils/dateUtils';

interface ReportHistoryProps {
  patrols: PatrolReport[];
  occurrences: OccurrenceReport[];
  strikes: WildlifeStrikeReport[];
  vehicles?: VehicleCheckReport[];
  monthlyDocuments?: MonthlyReportDocument[];
  onPreviewReport: (type: 'patrol' | 'occurrence' | 'strike' | 'vehicle', id: string) => void;
  onEditReport: (type: 'patrol' | 'occurrence' | 'strike' | 'vehicle', report: PatrolReport | OccurrenceReport | WildlifeStrikeReport | VehicleCheckReport) => void;
  onOpenBroadcast: (type: 'PATROL' | 'OCCURRENCE' | 'STRIKE' | 'VEHICLE', report: any) => void;
  onDeleteReport: (type: 'patrol' | 'occurrence' | 'strike' | 'vehicle', id: string, reportNumber: string) => Promise<void> | void;
  onOpenUploadMonthlyModal?: () => void;
  onDeleteMonthlyDocument?: (id: string, title: string) => Promise<void> | void;
  onOpenMonthlyDraft?: () => void;
  onOpenDutyRoster?: () => void;
  onOpenUploadRoster?: () => void;
  isAdmin: boolean;
  setIsAdmin: (val: boolean) => void;
}

export const ReportHistory: React.FC<ReportHistoryProps> = ({
  patrols,
  occurrences,
  strikes,
  vehicles = [],
  monthlyDocuments = [],
  onPreviewReport,
  onEditReport,
  onOpenBroadcast,
  onDeleteReport,
  onOpenUploadMonthlyModal,
  onDeleteMonthlyDocument,
  onOpenMonthlyDraft,
  onOpenDutyRoster,
  onOpenUploadRoster,
  isAdmin,
  setIsAdmin
}) => {
  const [historySection, setHistorySection] = useState<'daily' | 'monthly'>('daily');
  const [filterType, setFilterType] = useState<'all' | 'draft' | 'patrol' | 'occurrence' | 'strike' | 'vehicle'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'official' | 'draft'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedPleton, setSelectedPleton] = useState<string>('all');
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // Month options for filter
  const MONTH_OPTIONS = [
    { label: 'Januari', val: '01' },
    { label: 'Februari', val: '02' },
    { label: 'Maret', val: '03' },
    { label: 'April', val: '04' },
    { label: 'Mei', val: '05' },
    { label: 'Juni', val: '06' },
    { label: 'Juli', val: '07' },
    { label: 'Agustus', val: '08' },
    { label: 'September', val: '09' },
    { label: 'Oktober', val: '10' },
    { label: 'November', val: '11' },
    { label: 'Desember', val: '12' }
  ];

  // Helper to extract clean YYYY-MM-DD from any report object or date string
  const extractItemIsoDate = (raw: any, displayDate?: string): string => {
    const candidates = [
      raw?.hariTanggal,
      raw?.tanggalKegiatan,
      raw?.tanggalPemeriksaan,
      raw?.tanggalKejadian,
      raw?.createdAt,
      displayDate
    ];
    for (const cand of candidates) {
      if (!cand || typeof cand !== 'string') continue;
      const str = cand.trim();
      // 1. Direct YYYY-MM-DD
      if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
        return str;
      }
      // 2. ISO timestamp YYYY-MM-DDTHH:mm
      if (str.includes('T')) {
        const part = str.split('T')[0];
        if (/^\d{4}-\d{2}-\d{2}$/.test(part)) return part;
      }
      // 3. Indonesian verbal date: "Senin, 25 Oktober 2026"
      const parsedIndo = parseIndonesianDateToYYYYMMDD(str);
      if (parsedIndo) return parsedIndo;

      // 4. DD/MM/YYYY or DD-MM-YYYY
      const ddmmyyyy = str.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})/);
      if (ddmmyyyy) {
        const d = ddmmyyyy[1].padStart(2, '0');
        const m = ddmmyyyy[2].padStart(2, '0');
        const y = ddmmyyyy[3];
        return `${y}-${m}-${d}`;
      }

      // 5. Try JS Date parse
      const timestamp = Date.parse(str);
      if (!isNaN(timestamp)) {
        const d = new Date(timestamp);
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${day}`;
      }
    }
    return '';
  };

  // Admin deletion modal states
  const [isAdminAuthModalOpen, setIsAdminAuthModalOpen] = useState<boolean>(false);
  const [pendingDeleteTarget, setPendingDeleteTarget] = useState<UnifiedItem | null>(null);
  const [itemToDelete, setItemToDelete] = useState<UnifiedItem | null>(null);
  const [deleteReason, setDeleteReason] = useState<string>('');
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // Unified items
  type UnifiedItem = {
    type: 'patrol' | 'occurrence' | 'strike' | 'vehicle';
    id: string;
    number: string;
    date: string;
    dateIso: string;
    pleton: string;
    dinas: string;
    pod: string;
    grid?: string;
    summary: string;
    highlight: string;
    updatedAt?: string;
    raw: PatrolReport | OccurrenceReport | WildlifeStrikeReport | VehicleCheckReport;
  };

  const unifiedList: UnifiedItem[] = [
    ...strikes.map(s => {
      const docNumber = getChronologicalDocNumber(s, strikes, 'STRIKE');
      const dateDisplay = `${s.hariTanggal}, ${s.waktuKejadian}`;
      return {
        type: 'strike' as const,
        id: s.id,
        number: docNumber,
        date: dateDisplay,
        dateIso: extractItemIsoDate(s, dateDisplay),
        pleton: s.pleton,
        dinas: s.dinas,
        pod: s.pod,
        grid: s.gridLocation,
        summary: `${s.operatorAirline} (${s.flightNumber}) - ${s.jenisWildlife} di ${s.lokasi}`,
        highlight: `Kerusakan: ${s.indikasiKerusakan} | Fase: ${s.fasePenerbangan}`,
        updatedAt: s.updatedAt,
        raw: s
      };
    }),
    ...occurrences.map(o => {
      const docNumber = getChronologicalDocNumber(o, occurrences, 'OCC');
      const dateDisplay = `${o.hariTanggal}, ${o.waktuKejadian}`;
      return {
        type: 'occurrence' as const,
        id: o.id,
        number: docNumber,
        date: dateDisplay,
        dateIso: extractItemIsoDate(o, dateDisplay),
        pleton: o.pleton,
        dinas: o.dinas,
        pod: o.pod,
        grid: o.gridLocation,
        summary: `${o.jenisOccurrence} - ${o.jenisSatwa} (${o.jumlahSatwa} ekor)`,
        highlight: `Status: ${o.status} | Lokasi: ${o.lokasi}`,
        updatedAt: o.updatedAt,
        raw: o
      };
    }),
    ...patrols.map(p => {
      const docNumber = getChronologicalDocNumber(p, patrols, 'PATROL');
      const dateDisplay = `${p.hariTanggal} (${p.waktuPatroli})`;
      return {
        type: 'patrol' as const,
        id: p.id,
        number: docNumber,
        date: dateDisplay,
        dateIso: extractItemIsoDate(p, dateDisplay),
        pleton: p.pleton,
        dinas: p.dinas,
        pod: p.pod.join(', '),
        grid: p.gridLocation,
        summary: `Inspeksi Rute: ${p.rutePatroli.slice(0, 75)}...`,
        highlight: `Satwa Teramati: ${p.totalPopulasiTeramati} ekor | Selective Lethal: ${p.selectiveLethal.totalLethal} ekor`,
        updatedAt: p.updatedAt,
        raw: p
      };
    }),
    ...vehicles.map(v => {
      const docNumber = getChronologicalDocNumber(v, vehicles, 'VEH');
      const timeStr = v.waktuPengecekan || (v as any).jamPemeriksaan || '-';
      const driverStr = v.petugasMenerima || (v as any).pengemudiPemeriksa || 'Petugas WHU';
      const prevDriverStr = v.petugasMenyerahkan || (v as any).petugasShiftSebelumnya || '-';
      const lambungStr = v.nomorLambung || (v as any).namaKendaraan || 'Armada Airside';
      const platStr = v.platNomor || (v as any).nomorPolisi || '';
      const odoStr = typeof v.odometerKM === 'number' ? `${v.odometerKM.toLocaleString('id-ID')} KM` : `${(v as any).odometerAkhir || (v as any).odometerAwal || 0} KM`;
      const bbmStr = v.levelBBM || (v as any).statusBahanBakar || 'Normal';
      const dateDisplay = `${v.hariTanggal} (${timeStr})`;
      return {
        type: 'vehicle' as const,
        id: v.id,
        number: docNumber,
        date: dateDisplay,
        dateIso: extractItemIsoDate(v, dateDisplay),
        pleton: v.pleton,
        dinas: v.dinas,
        pod: `${driverStr} (Serah: ${prevDriverStr})`,
        grid: lambungStr,
        summary: `${v.merkModel || 'Kendaraan Airside'} [${lambungStr}${platStr ? ` / ${platStr}` : ''}] | Odo: ${odoStr}`,
        highlight: `Status: ${v.statusKelayakan} | BBM: ${bbmStr} | Amunisi: ${v.amunisiFlareButir ?? 0} Butir`,
        updatedAt: v.updatedAt,
        raw: v
      };
    })
  ];

  // Count total drafts across all categories
  const totalDrafts = unifiedList.filter(item => item.raw.isDraft).length;

  // Filtering
  const filtered = unifiedList.filter(item => {
    if (filterType === 'draft') {
      if (!item.raw.isDraft) return false;
    } else if (filterType !== 'all') {
      if (item.type !== filterType) return false;
    }

    if (statusFilter === 'draft' && !item.raw.isDraft) return false;
    if (statusFilter === 'official' && item.raw.isDraft) return false;

    if (selectedPleton !== 'all' && !item.pleton.includes(selectedPleton)) return false;

    // Filter by Date Range (Rentang Tanggal Mulai s/d Akhir)
    if (startDate || endDate) {
      let minDate = startDate;
      let maxDate = endDate;
      if (startDate && endDate && startDate > endDate) {
        minDate = endDate;
        maxDate = startDate;
      }
      const itemIso = item.dateIso;
      if (itemIso) {
        if (minDate && itemIso < minDate) return false;
        if (maxDate && itemIso > maxDate) return false;
      } else {
        if (minDate && item.date < minDate) return false;
      }
    }

    // Filter by Month & Year if specified
    if (selectedMonth !== 'all' || selectedYear !== 'all') {
      const itemDateLower = item.date.toLowerCase();
      if (selectedYear !== 'all') {
        const matchesYear = item.dateIso ? item.dateIso.startsWith(selectedYear) : itemDateLower.includes(selectedYear);
        if (!matchesYear) return false;
      }
      if (selectedMonth !== 'all') {
        const targetMonthObj = MONTH_OPTIONS.find(m => m.val === selectedMonth);
        const matchesMonth = item.dateIso 
          ? item.dateIso.slice(5, 7) === selectedMonth 
          : (targetMonthObj && itemDateLower.includes(targetMonthObj.label.toLowerCase()));
        if (!matchesMonth) return false;
      }
    }

    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      return (
        item.number.toLowerCase().includes(q) ||
        item.summary.toLowerCase().includes(q) ||
        item.pod.toLowerCase().includes(q) ||
        item.highlight.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Preset Date Range Handlers
  const handlePresetAll = () => {
    setStartDate('');
    setEndDate('');
  };

  const handlePresetToday = () => {
    const today = getTodayDateString();
    setStartDate(today);
    setEndDate(today);
  };

  const handlePreset7Days = () => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - 6);
    const startStr = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}-${String(start.getDate()).padStart(2, '0')}`;
    const endStr = `${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, '0')}-${String(end.getDate()).padStart(2, '0')}`;
    setStartDate(startStr);
    setEndDate(endStr);
  };

  const handlePreset30Days = () => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - 29);
    const startStr = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}-${String(start.getDate()).padStart(2, '0')}`;
    const endStr = `${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, '0')}-${String(end.getDate()).padStart(2, '0')}`;
    setStartDate(startStr);
    setEndDate(endStr);
  };

  const handlePresetThisMonth = () => {
    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth();
    const firstDay = `${y}-${String(m + 1).padStart(2, '0')}-01`;
    const lastDayObj = new Date(y, m + 1, 0);
    const lastDay = `${y}-${String(m + 1).padStart(2, '0')}-${String(lastDayObj.getDate()).padStart(2, '0')}`;
    setStartDate(firstDay);
    setEndDate(lastDay);
  };

  const handlePresetLastMonth = () => {
    const now = new Date();
    const y = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
    const m = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
    const firstDay = `${y}-${String(m + 1).padStart(2, '0')}-01`;
    const lastDayObj = new Date(y, m + 1, 0);
    const lastDay = `${y}-${String(m + 1).padStart(2, '0')}-${String(lastDayObj.getDate()).padStart(2, '0')}`;
    setStartDate(firstDay);
    setEndDate(lastDay);
  };

  const formatIsoToDisplay = (isoStr: string) => {
    if (!isoStr) return '';
    const parts = isoStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return isoStr;
  };

  // Determine active preset
  const todayStr = getTodayDateString();
  const isTodayActive = startDate === todayStr && endDate === todayStr;

  const getPresetRange = (daysBack: number) => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - daysBack);
    const startStr = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}-${String(start.getDate()).padStart(2, '0')}`;
    const endStr = `${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, '0')}-${String(end.getDate()).padStart(2, '0')}`;
    return { startStr, endStr };
  };

  const p7 = getPresetRange(6);
  const is7DaysActive = startDate === p7.startStr && endDate === p7.endStr;

  const p30 = getPresetRange(29);
  const is30DaysActive = startDate === p30.startStr && endDate === p30.endStr;

  const nowObj = new Date();
  const thisMonthStart = `${nowObj.getFullYear()}-${String(nowObj.getMonth() + 1).padStart(2, '0')}-01`;
  const thisMonthLastDayObj = new Date(nowObj.getFullYear(), nowObj.getMonth() + 1, 0);
  const thisMonthEnd = `${nowObj.getFullYear()}-${String(nowObj.getMonth() + 1).padStart(2, '0')}-${String(thisMonthLastDayObj.getDate()).padStart(2, '0')}`;
  const isThisMonthActive = startDate === thisMonthStart && endDate === thisMonthEnd;

  const handleDownloadPDF = (item: UnifiedItem) => {
    if (item.type === 'strike') exportStrikePDF(item.raw as WildlifeStrikeReport, item.number, item.raw.createdAt);
    else if (item.type === 'occurrence') exportOccurrencePDF(item.raw as OccurrenceReport, item.number, item.raw.createdAt);
    else if (item.type === 'vehicle') exportVehiclePDF(item.raw as VehicleCheckReport, item.number, item.raw.createdAt);
    else exportPatrolPDF(item.raw as PatrolReport, item.number, item.raw.createdAt);
  };

  const handleDownloadExcel = (item: UnifiedItem) => {
    if (item.type === 'patrol') {
      exportSinglePatrolToExcel(item.raw as PatrolReport);
    } else {
      exportAllToExcel(patrols, occurrences, strikes, vehicles);
    }
  };

  const handleExportFilteredExcel = () => {
    const filteredPatrols = filtered.filter(f => f.type === 'patrol').map(f => f.raw as PatrolReport);
    const filteredOccurrences = filtered.filter(f => f.type === 'occurrence').map(f => f.raw as OccurrenceReport);
    const filteredStrikes = filtered.filter(f => f.type === 'strike').map(f => f.raw as WildlifeStrikeReport);
    const filteredVehicles = filtered.filter(f => f.type === 'vehicle').map(f => f.raw as VehicleCheckReport);
    exportAllToExcel(filteredPatrols, filteredOccurrences, filteredStrikes, filteredVehicles);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Export Master Excel Button */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-sky-600" />
            Arsip &amp; Rekapitulasi Laporan Wildlife Hazard
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Daftar lengkap seluruh laporan patroli, occurrence, strike, dan kendaraan dengan filter rentang tanggal serta ekspor PDF &amp; Excel.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => exportAllToExcel(patrols, occurrences, strikes, vehicles)}
            className="px-4 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-semibold flex items-center gap-2 shadow transition cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Export Seluruh Database (Excel XLSX)</span>
          </button>
        </div>
      </div>

      {/* Navigation Switcher between Daily Reports vs. Monthly Reports Archive */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
        <div className="flex items-center gap-1.5 flex-1">
          <button
            onClick={() => setHistorySection('daily')}
            className={`flex-1 sm:flex-initial px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
              historySection === 'daily'
                ? 'bg-white text-slate-900 shadow-sm border border-slate-200/80'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            <FileText className="w-4 h-4 text-sky-600" />
            <span>Laporan Harian &amp; Shift</span>
            <span className="ml-1 text-[11px] font-mono px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
              {unifiedList.length}
            </span>
          </button>

          <button
            onClick={() => setHistorySection('monthly')}
            className={`flex-1 sm:flex-initial px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
              historySection === 'monthly'
                ? 'bg-white text-slate-900 shadow-sm border border-slate-200/80'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            <FolderArchive className="w-4 h-4 text-indigo-600" />
            <span>Arsip Laporan Bulanan (PDF / Word)</span>
            <span className="ml-1 text-[11px] font-mono px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
              {monthlyDocuments.length}
            </span>
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {onOpenMonthlyDraft && (
            <button
              type="button"
              onClick={onOpenMonthlyDraft}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition cursor-pointer"
              title="Otomatisasi pembuatan draft dokumen laporan bulanan dalam format JSON (siap integrasi template Word/PDF)"
            >
              <FileCode className="w-3.5 h-3.5 text-amber-200" />
              <span>Draft JSON Bulanan</span>
            </button>
          )}

          {onOpenUploadRoster && (
            <button
              type="button"
              onClick={onOpenUploadRoster}
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-xs transition cursor-pointer"
              title="Unggah Dokumen Roster Dinas (Excel / PDF)"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Upload Roster Dinas</span>
            </button>
          )}

          {onOpenUploadMonthlyModal && (
            <button
              type="button"
              onClick={onOpenUploadMonthlyModal}
              className="px-3.5 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-xs transition cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Unggah Berkas Bulanan</span>
            </button>
          )}
        </div>
      </div>

      {historySection === 'monthly' ? (
        <MonthlyReportArchive
          documents={monthlyDocuments}
          onOpenUploadModal={onOpenUploadMonthlyModal || (() => {})}
          onDeleteDocument={onDeleteMonthlyDocument || (() => {})}
          onOpenMonthlyDraft={onOpenMonthlyDraft}
          isAdmin={isAdmin}
          setIsAdmin={setIsAdmin}
        />
      ) : (
        <>
          {/* Admin Status & Security Policy Bar */}
          <div className={`p-4 rounded-xl border transition flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs ${
        isAdmin 
          ? 'bg-amber-500/10 border-amber-500/30' 
          : 'bg-slate-50 border-slate-200'
      }`}>
        <div className="flex items-start sm:items-center gap-3">
          <div className={`p-2 rounded-lg shrink-0 ${
            isAdmin ? 'bg-amber-500/20 text-amber-700' : 'bg-slate-200 text-slate-700'
          }`}>
            {isAdmin ? <Shield className="w-5 h-5 text-amber-600" /> : <Lock className="w-5 h-5 text-slate-600" />}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-slate-900 text-sm">
                {isAdmin ? 'Mode Administrator Aktif (Wildlife Hazard Department Head)' : 'Akses Operasional: Petugas Pelaksana (POD Unit WHU)'}
              </span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border ${
                isAdmin 
                  ? 'bg-amber-100 text-amber-900 border-amber-300' 
                  : 'bg-slate-200 text-slate-700 border-slate-300'
              }`}>
                {isAdmin ? 'HAK HAPUS ARSIP TERBUKA' : 'HAPUS ARSIP HANYA ADMIN'}
              </span>
            </div>
            <p className="text-[11px] text-slate-600 mt-0.5">
              {isAdmin 
                ? 'Anda berwenang mengelola, mengekspor, serta menghapus data laporan jika terjadi duplikasi atau kesalahan entri.' 
                : 'Sesuai regulasi audit keselamatan, arsip dan rekapitulasi laporan dilindungi dan hanya dapat dihapus oleh Administrator.'}
            </p>
          </div>
        </div>

        <div>
          {isAdmin ? (
            <button
              onClick={() => {
                localStorage.removeItem('whu_admin_mode');
                setIsAdmin(false);
              }}
              className="px-3.5 py-1.5 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 font-semibold rounded-lg text-xs transition flex items-center gap-1.5 shadow-xs shrink-0 cursor-pointer"
            >
              <Lock className="w-3.5 h-3.5 text-slate-500" />
              <span>Kunci Akses Admin</span>
            </button>
          ) : (
            <button
              onClick={() => setIsAdminAuthModalOpen(true)}
              className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg text-xs transition flex items-center gap-1.5 shadow-xs shrink-0 cursor-pointer"
            >
              <Shield className="w-3.5 h-3.5 text-amber-400" />
              <span>Buka Akses Admin</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 text-xs">
        {/* Type selector tabs */}
        <div className="flex items-center space-x-1.5 bg-slate-100 p-1 rounded-lg flex-wrap gap-y-1">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 rounded transition font-medium cursor-pointer ${
              filterType === 'all' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Semua ({unifiedList.length})
          </button>
          <button
            onClick={() => {
              setFilterType('draft');
              setStatusFilter('all');
            }}
            className={`px-3 py-1.5 rounded transition font-medium flex items-center gap-1.5 cursor-pointer ${
              filterType === 'draft' ? 'bg-amber-500 text-slate-950 shadow-xs font-extrabold' : 'text-amber-800 hover:text-amber-950'
            }`}
          >
            <Bookmark className="w-3.5 h-3.5 fill-current" />
            <span>Draft ({totalDrafts})</span>
          </button>
          <button
            onClick={() => setFilterType('patrol')}
            title="WOR — Wildlife Observation Report: observasi dan pengumpulan data satwa liar"
            className={`px-3 py-1.5 rounded transition font-medium cursor-pointer ${
              filterType === 'patrol' ? 'bg-sky-600 text-white font-bold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            WOR — Observasi ({patrols.length})
          </button>
          <button
            onClick={() => setFilterType('occurrence')}
            title="WHR — Wildlife Hazard Report: identifikasi bahaya, evaluasi risiko, dan mitigasi"
            className={`px-3 py-1.5 rounded transition font-medium cursor-pointer ${
              filterType === 'occurrence' ? 'bg-amber-600 text-white font-bold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            WHR — Hazard ({occurrences.length})
          </button>
          <button
            onClick={() => setFilterType('strike')}
            title="WSR — Wildlife Strike Report: pencatatan dugaan atau kejadian wildlife strike, bukti, dampak, dan status verifikasi"
            className={`px-3 py-1.5 rounded transition font-medium cursor-pointer ${
              filterType === 'strike' ? 'bg-rose-700 text-white font-bold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            WSR — Strike ({strikes.length})
          </button>
          <button
            onClick={() => setFilterType('vehicle')}
            title="Pemeriksaan Kendaraan Dinas Operasional"
            className={`px-3 py-1.5 rounded transition font-medium cursor-pointer ${
              filterType === 'vehicle' ? 'bg-teal-700 text-white font-bold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Kendaraan ({vehicles.length})
          </button>
        </div>

        {/* Filter controls */}
        <div className="flex items-center space-x-2 flex-1 max-w-xl flex-wrap gap-y-1">
          <div className="relative flex-1 min-w-[140px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Cari nomor dokumen, penerbangan, satwa..."
              className="w-full pl-9 pr-3 py-1.5 border border-slate-300 rounded-lg text-xs focus:ring-1 focus:ring-sky-500"
            />
          </div>

          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as any)}
            className="px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs bg-white text-slate-700 font-semibold"
            title="Filter Status Publikasi Dokumen"
          >
            <option value="all">Semua Status</option>
            <option value="official">Laporan Resmi</option>
            <option value="draft">Draft Sementara ({totalDrafts})</option>
          </select>

          <select
            value={selectedPleton}
            onChange={e => setSelectedPleton(e.target.value)}
            className="px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs bg-white text-slate-700"
            title="Filter Pleton"
          >
            <option value="all">Semua Pleton</option>
            <option value="Alpha">Pleton Alpha</option>
            <option value="Bravo">Pleton Bravo</option>
            <option value="Charlie">Pleton Charlie</option>
            <option value="Delta">Pleton Delta</option>
          </select>

          <select
            value={selectedMonth}
            onChange={e => setSelectedMonth(e.target.value)}
            className="px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs bg-white text-slate-700 font-semibold"
            title="Filter Bulan"
          >
            <option value="all">Semua Bulan</option>
            {MONTH_OPTIONS.map(m => (
              <option key={m.val} value={m.val}>{m.label}</option>
            ))}
          </select>

          <select
            value={selectedYear}
            onChange={e => setSelectedYear(e.target.value)}
            className="px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs bg-white text-slate-700 font-semibold"
            title="Filter Tahun"
          >
            <option value="all">Semua Tahun</option>
            <option value="2026">2026</option>
            <option value="2025">2025</option>
            <option value="2024">2024</option>
          </select>
        </div>
      </div>

      {/* Date Range Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 text-xs">
        {/* Date Inputs */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 font-bold text-slate-800 shrink-0">
            <Calendar className="w-4 h-4 text-sky-600" />
            <span>Rentang Tanggal:</span>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-50 hover:bg-slate-100/80 px-2.5 py-1.5 border border-slate-300 rounded-lg shadow-2xs focus-within:border-sky-500 focus-within:ring-1 focus-within:ring-sky-500 transition">
            <span className="text-[11px] font-semibold text-slate-500">Mulai:</span>
            <input
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className="text-xs text-slate-800 bg-transparent border-none outline-none font-medium cursor-pointer"
              title="Pilih tanggal mulai"
            />
            {startDate && (
              <button
                type="button"
                onClick={() => setStartDate('')}
                className="text-slate-400 hover:text-rose-600 transition p-0.5 cursor-pointer"
                title="Hapus tanggal mulai"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <span className="text-slate-400 font-bold">s/d</span>

          <div className="flex items-center gap-1.5 bg-slate-50 hover:bg-slate-100/80 px-2.5 py-1.5 border border-slate-300 rounded-lg shadow-2xs focus-within:border-sky-500 focus-within:ring-1 focus-within:ring-sky-500 transition">
            <span className="text-[11px] font-semibold text-slate-500">Akhir:</span>
            <input
              type="date"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              className="text-xs text-slate-800 bg-transparent border-none outline-none font-medium cursor-pointer"
              title="Pilih tanggal akhir"
            />
            {endDate && (
              <button
                type="button"
                onClick={() => setEndDate('')}
                className="text-slate-400 hover:text-rose-600 transition p-0.5 cursor-pointer"
                title="Hapus tanggal akhir"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {(startDate || endDate) && (
            <button
              type="button"
              onClick={handlePresetAll}
              className="px-2.5 py-1.5 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
              title="Hapus filter rentang tanggal"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Rentang</span>
            </button>
          )}
        </div>

        {/* Quick Presets & Export Filtered */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[11px] text-slate-500 font-semibold mr-0.5">Preset:</span>
          <button
            type="button"
            onClick={handlePresetToday}
            className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition cursor-pointer ${
              isTodayActive
                ? 'bg-sky-600 text-white shadow-2xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Hari Ini
          </button>
          <button
            type="button"
            onClick={handlePreset7Days}
            className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition cursor-pointer ${
              is7DaysActive
                ? 'bg-sky-600 text-white shadow-2xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            7 Hari
          </button>
          <button
            type="button"
            onClick={handlePreset30Days}
            className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition cursor-pointer ${
              is30DaysActive
                ? 'bg-sky-600 text-white shadow-2xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            30 Hari
          </button>
          <button
            type="button"
            onClick={handlePresetThisMonth}
            className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition cursor-pointer ${
              isThisMonthActive
                ? 'bg-sky-600 text-white shadow-2xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Bulan Ini
          </button>
          <button
            type="button"
            onClick={handlePresetLastMonth}
            className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 transition cursor-pointer"
          >
            Bulan Lalu
          </button>
          <button
            type="button"
            onClick={handlePresetAll}
            className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition cursor-pointer ${
              !startDate && !endDate
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Semua
          </button>

          {(startDate || endDate || searchQuery || filterType !== 'all' || statusFilter !== 'all' || selectedPleton !== 'all' || selectedMonth !== 'all' || selectedYear !== 'all') && (
            <button
              type="button"
              onClick={handleExportFilteredExcel}
              className="ml-auto sm:ml-2 px-3 py-1 rounded-md text-[11px] font-semibold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 shadow-2xs transition cursor-pointer"
              title="Unduh file Excel berisi hanya laporan yang sesuai filter saat ini"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Export Hasil Filter ({filtered.length})</span>
            </button>
          )}
        </div>
      </div>

      {/* Active Date Range Banner Indicator */}
      {(startDate || endDate) && (
        <div className="bg-sky-50/90 border border-sky-200 rounded-xl px-3.5 py-2.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs text-sky-900 shadow-2xs animate-in fade-in">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center justify-center p-1 bg-sky-200 text-sky-800 rounded-md">
              <Calendar className="w-3.5 h-3.5" />
            </span>
            <span className="font-bold">
              Menampilkan {filtered.length} dari {unifiedList.length} total laporan
            </span>
            <span className="text-sky-700">
              pada rentang tanggal{' '}
              <span className="font-mono font-bold bg-white px-1.5 py-0.5 rounded border border-sky-300">
                {startDate ? formatIsoToDisplay(startDate) : 'Awal Dokumen'}
              </span>{' '}
              sampai{' '}
              <span className="font-mono font-bold bg-white px-1.5 py-0.5 rounded border border-sky-300">
                {endDate ? formatIsoToDisplay(endDate) : 'Sekarang'}
              </span>
            </span>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              type="button"
              onClick={handlePresetAll}
              className="text-[11px] font-bold text-sky-700 hover:text-rose-700 hover:underline flex items-center gap-1 cursor-pointer transition"
            >
              <X className="w-3.5 h-3.5" />
              <span>Hapus Filter Tanggal</span>
            </button>
          </div>
        </div>
      )}

      {/* Pending Draft Notification Banner */}
      {totalDrafts > 0 && filterType !== 'draft' && (
        <div className="bg-amber-50 border border-amber-300 rounded-xl p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-amber-950 shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-amber-500 text-white rounded-lg shrink-0">
              <Bookmark className="w-4 h-4 fill-current" />
            </div>
            <div>
              <p className="font-bold text-amber-900">
                Terdapat {totalDrafts} draft laporan yang belum diterbitkan
              </p>
              <p className="text-[11px] text-amber-800">
                Dokumen disimpan sementara dan belum disahkan secara resmi. Klik tombol untuk memfilter dan melanjutkan pengisian.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              setFilterType('draft');
              setStatusFilter('all');
            }}
            className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-lg font-bold text-xs shrink-0 cursor-pointer transition shadow-xs flex items-center gap-1.5"
          >
            <Bookmark className="w-3.5 h-3.5 fill-current" />
            <span>Lihat Semua Draft ({totalDrafts})</span>
          </button>
        </div>
      )}

      {/* Reports Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold">
              <tr>
                <th className="p-3">Tipe / No. Dokumen</th>
                <th className="p-3">Waktu &amp; Pleton</th>
                <th className="p-3">Ringkasan Insiden / Inspeksi</th>
                <th className="p-3">Person on Duty (POD)</th>
                <th className="p-3 text-center">Aksi Dokumen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-4 text-center text-xs text-slate-400 font-medium">
                    Tidak ada laporan yang cocok dengan filter pencarian (0 data).
                  </td>
                </tr>
              ) : (
                filtered.map(item => (
                  <tr key={item.id} className={item.raw.isDraft ? 'bg-amber-50/50 hover:bg-amber-100/60 transition' : 'hover:bg-slate-50 transition'}>
                    <td className="p-3">
                      <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                        <span 
                          title={
                            item.type === 'strike' 
                              ? 'WSR — Wildlife Strike Report: pencatatan dugaan atau kejadian wildlife strike, bukti, dampak, dan status verifikasi' 
                              : item.type === 'occurrence' 
                              ? 'WHR — Wildlife Hazard Report: identifikasi bahaya, evaluasi risiko, dan mitigasi' 
                              : item.type === 'vehicle' 
                              ? 'Pemeriksaan Kendaraan Dinas Operasional' 
                              : 'WOR — Wildlife Observation Report: observasi dan pengumpulan data satwa liar'
                          }
                          className={`inline-block px-2 py-0.5 rounded font-bold text-[10px] uppercase cursor-help ${
                            item.type === 'strike' ? 'bg-rose-100 text-rose-800' :
                            item.type === 'occurrence' ? 'bg-amber-100 text-amber-800' : 
                            item.type === 'vehicle' ? 'bg-teal-100 text-teal-800' : 'bg-sky-100 text-sky-800'
                          }`}
                        >
                          {item.type === 'strike' ? 'WSR — Strike' : item.type === 'occurrence' ? 'WHR — Hazard' : item.type === 'vehicle' ? 'Check Kendaraan' : 'WOR — Observasi'}
                        </span>
                        {item.raw.isDraft && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-extrabold text-[10px] bg-amber-500 text-slate-950 uppercase shadow-xs">
                            <Bookmark className="w-2.5 h-2.5 fill-current" />
                            DRAFT
                          </span>
                        )}
                        {item.grid && (
                          <span className="font-mono text-[10px] font-bold text-sky-800 bg-sky-50 px-1.5 py-0.5 rounded border border-sky-200">
                            {item.grid}
                          </span>
                        )}
                        {item.updatedAt && !item.raw.isDraft && (
                          <span 
                            className="text-[10px] font-semibold text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-300 flex items-center gap-0.5"
                            title={`Telah diedit: ${new Date(item.updatedAt).toLocaleString('id-ID')}`}
                          >
                            <Edit3 className="w-2.5 h-2.5" />
                            Diedit
                          </span>
                        )}
                      </div>
                      <p className="font-mono font-bold text-slate-800">{item.number}</p>
                      {item.raw.isDraft && item.raw.draftSavedAt ? (
                        <p className="text-[10px] text-amber-700 font-semibold mt-0.5 flex items-center gap-1" title="Waktu Draft Disimpan">
                          <Clock className="w-2.5 h-2.5 text-amber-600 shrink-0" />
                          <span>Draft: {new Date(item.raw.draftSavedAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} ({new Date(item.raw.draftSavedAt).toLocaleDateString('id-ID')})</span>
                        </p>
                      ) : item.raw.createdAt ? (
                        <p className="text-[10px] text-slate-400 font-sans mt-0.5" title="Waktu Pembuatan Dokumen">
                          Dibuat: {formatReportCreationTime(item.raw.createdAt)}
                        </p>
                      ) : null}
                    </td>

                    <td className="p-3">
                      <p className="font-medium text-slate-800">{item.date}</p>
                      <p className="text-[11px] text-slate-500">{item.pleton} • {item.dinas.split(' ')[1]}</p>
                    </td>

                    <td className="p-3 max-w-md">
                      <p className="font-semibold text-slate-800">{item.summary}</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">{item.highlight}</p>
                    </td>

                    <td className="p-3 text-slate-700 font-medium">
                      {item.pod}
                    </td>

                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center space-x-1.5">
                        <button
                          onClick={() => onPreviewReport(item.type, item.id)}
                          className="px-2 py-1 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded transition flex items-center gap-1 cursor-pointer"
                          title="Lihat Pratinjau Dokumen"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Preview</span>
                        </button>

                        {item.raw.isDraft ? (
                          <button
                            onClick={() => onEditReport(item.type, item.raw)}
                            className="px-2.5 py-1 text-xs font-bold text-amber-950 bg-amber-400 hover:bg-amber-300 border border-amber-500 rounded transition flex items-center gap-1 cursor-pointer shadow-xs"
                            title="Lanjutkan pengisian dan terbitkan laporan resmi"
                          >
                            <Edit3 className="w-3.5 h-3.5 text-amber-900" />
                            <span>Lanjutkan Draft</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => onEditReport(item.type, item.raw)}
                            className="px-2 py-1 text-xs font-semibold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-300 rounded transition flex items-center gap-1 cursor-pointer"
                            title="Edit Laporan Ini"
                          >
                            <Edit3 className="w-3.5 h-3.5 text-amber-700" />
                            <span>Edit</span>
                          </button>
                        )}

                        <button
                          onClick={() => handleDownloadPDF(item)}
                          className="p-1.5 text-slate-700 hover:text-rose-600 bg-slate-100 hover:bg-rose-50 rounded transition cursor-pointer"
                          title="Unduh PDF Resmi"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => handleDownloadExcel(item)}
                          className="p-1.5 text-slate-700 hover:text-emerald-600 bg-slate-100 hover:bg-emerald-50 rounded transition cursor-pointer"
                          title="Unduh Excel"
                        >
                          <FileSpreadsheet className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => onOpenBroadcast(item.type.toUpperCase() as any, item.raw)}
                          className="p-1.5 text-slate-700 hover:text-sky-600 bg-slate-100 hover:bg-sky-50 rounded transition cursor-pointer"
                          title="Kirim Notifikasi Broadcast WhatsApp"
                        >
                          <Share2 className="w-3.5 h-3.5" />
                        </button>

                        {/* Admin Delete Report Button */}
                        <button
                          onClick={() => {
                            if (!isAdmin) {
                              setPendingDeleteTarget(item);
                              setIsAdminAuthModalOpen(true);
                            } else {
                              setItemToDelete(item);
                            }
                          }}
                          className={`p-1.5 rounded transition cursor-pointer flex items-center gap-1 ${
                            isAdmin
                              ? 'text-rose-600 hover:text-white hover:bg-rose-600 bg-rose-50 border border-rose-200'
                              : 'text-slate-400 hover:text-rose-600 hover:bg-slate-100 bg-slate-50 border border-slate-200'
                          }`}
                          title={isAdmin ? 'Hapus Laporan (Admin)' : 'Hapus Laporan (Memerlukan Otorisasi Admin)'}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          {!isAdmin && <Lock className="w-2.5 h-2.5 -ml-0.5 text-slate-400" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Admin Verification Modal */}
      <AdminAuthModal
        isOpen={isAdminAuthModalOpen}
        onClose={() => {
          setIsAdminAuthModalOpen(false);
          setPendingDeleteTarget(null);
        }}
        onSuccess={() => {
          setIsAdmin(true);
          if (pendingDeleteTarget) {
            setItemToDelete(pendingDeleteTarget);
            setPendingDeleteTarget(null);
          }
        }}
        title="Otorisasi Admin Diperlukan"
        description="Penghapusan arsip dan rekapitulasi laporan resmi WHU hanya diizinkan untuk Administrator / Wildlife Hazard Department Head. Masukkan PIN / Sandi Admin untuk melanjutkan."
      />

      {/* Admin Delete Confirmation Modal */}
      {itemToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in zoom-in-95">
            {/* Modal Header */}
            <div className="bg-rose-900 text-white p-4.5 flex items-center justify-between border-b border-rose-950">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-rose-500/30 text-rose-100 rounded-lg border border-rose-400/40">
                  <AlertOctagon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white">Konfirmasi Penghapusan Laporan (Admin)</h3>
                  <p className="text-[11px] text-rose-200">Penghapusan Dokumen Resmi Arsip Unit WHU</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setItemToDelete(null);
                  setDeleteReason('');
                }}
                className="text-rose-300 hover:text-white p-1 rounded-md transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4 text-xs">
              <div className="bg-rose-50 border border-rose-200 rounded-lg p-3 text-rose-900 flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Peringatan Penghapusan Permanen</p>
                  <p className="text-[11px] text-rose-800 mt-0.5 leading-relaxed">
                    Dokumen ini akan dihapus secara <strong>permanen</strong> dari database cloud Firebase dan arsip sistem operasional. Tindakan ini tidak dapat dibatalkan.
                  </p>
                </div>
              </div>

              {/* Document Overview */}
              <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 space-y-2 font-mono text-[11px]">
                <div className="flex justify-between items-center pb-1.5 border-b border-slate-200">
                  <span className="text-slate-500 font-sans font-medium">Nomor Dokumen:</span>
                  <span className="font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-300">
                    {itemToDelete.number}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-sans">Kategori Laporan:</span>
                  <span className="font-semibold uppercase text-slate-800">
                    {itemToDelete.type === 'strike' 
                      ? 'WSR — Wildlife Strike Report' 
                      : itemToDelete.type === 'occurrence' 
                      ? 'WHR — Wildlife Hazard Report' 
                      : itemToDelete.type === 'vehicle'
                      ? 'Pengecekan Kendaraan Dinas'
                      : 'WOR — Wildlife Observation Report'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-sans">Tanggal &amp; Dinas:</span>
                  <span className="text-slate-800">{itemToDelete.date} • {itemToDelete.dinas}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-sans">Person on Duty:</span>
                  <span className="text-slate-800">{itemToDelete.pod} ({itemToDelete.pleton})</span>
                </div>
                <div className="pt-2 border-t border-slate-200 text-slate-700 text-xs font-sans">
                  <p className="text-[11px] text-slate-500 font-medium mb-0.5">Ringkasan:</p>
                  <p className="font-medium text-slate-800">{itemToDelete.summary}</p>
                </div>
              </div>

              {/* Audit Reason Input */}
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Alasan Penghapusan (Catatan Audit Administrator):
                </label>
                <input
                  type="text"
                  value={deleteReason}
                  onChange={e => setDeleteReason(e.target.value)}
                  placeholder="Contoh: Duplikasi entri / data uji coba / perbaikan nomor registrasi"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end space-x-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={() => {
                    setItemToDelete(null);
                    setDeleteReason('');
                  }}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                >
                  Batalkan
                </button>
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={async () => {
                    setIsDeleting(true);
                    try {
                      await onDeleteReport(itemToDelete.type, itemToDelete.id, itemToDelete.number);
                      setItemToDelete(null);
                      setDeleteReason('');
                    } finally {
                      setIsDeleting(false);
                    }
                  }}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-lg transition flex items-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Menghapus Dokumen...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Ya, Hapus Dokumen Ini (Admin)</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
        </>
      )}
    </div>
  );
};
