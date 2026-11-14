import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, 
  Save, 
  Calendar, 
  AlertTriangle, 
  CheckCircle2, 
  RotateCcw, 
  DownloadCloud, 
  Sliders, 
  ChevronRight, 
  Info, 
  HelpCircle,
  FileSpreadsheet,
  Trash2,
  Sparkles,
  ShieldAlert
} from 'lucide-react';
import { WildlifeStrikeReport, ManualMonthlyWSREntry } from '../types';
import { 
  saveManualMonthlyWSRToFirestore, 
  clearManualMonthlyWSRFromFirestore 
} from '../services/firestoreService';
import { getNormalizedMonthIndex } from '../utils/dateUtils';

interface ManualMonthlyWSRModalProps {
  isOpen: boolean;
  onClose: () => void;
  year: string;
  availableYears: string[];
  onYearChange: (year: string) => void;
  currentLiveStrikes: WildlifeStrikeReport[];
  manualEntries: Record<number, ManualMonthlyWSREntry>;
  initialFocusMonth?: number;
  onSaveSuccess?: () => void;
}

const MONTH_METADATA = [
  { index: 0, name: 'Januari', short: 'Jan', season: 'Musim Migrasi EAAF & Hujan Monsun', icon: '🌧️' },
  { index: 1, name: 'Februari', short: 'Feb', season: 'Puncak Migrasi & Genangan Airside', icon: '🌊' },
  { index: 2, name: 'Maret', short: 'Mar', season: 'Pancaroba Awal / Transisi', icon: '⛅' },
  { index: 3, name: 'April', short: 'Apr', season: 'Pancaroba / Serangga Rumput', icon: '🦗' },
  { index: 4, name: 'Mei', short: 'Mei', season: 'Musim Kemarau Awal', icon: '☀️' },
  { index: 5, name: 'Juni', short: 'Jun', season: 'Puncak Kemarau / Termal Udara', icon: '🔥' },
  { index: 6, name: 'Juli', short: 'Jul', season: 'Kemarau / Angin Timur Kencang', icon: '💨' },
  { index: 7, name: 'Agustus', short: 'Agu', season: 'Kemarau Kering / Potensi Kebakaran Rumput', icon: '🌾' },
  { index: 8, name: 'September', short: 'Sep', season: 'Transisi Kemarau ke Hujan', icon: '🍂' },
  { index: 9, name: 'Oktober', short: 'Okt', season: 'Awal Musim Hujan / Migrasi Selatan', icon: '🌧️' },
  { index: 10, name: 'November', short: 'Nov', season: 'Puncak Hujan & Genangan Taxiway', icon: '⛈️' },
  { index: 11, name: 'Desember', short: 'Des', season: 'Curah Hujan Maksimum & High Density Traffic', icon: '⚡' },
];

const HISTORICAL_BASELINE = [6, 7, 4, 3, 2, 1, 2, 2, 3, 5, 7, 8];

export const ManualMonthlyWSRModal: React.FC<ManualMonthlyWSRModalProps> = ({
  isOpen,
  onClose,
  year,
  availableYears,
  onYearChange,
  currentLiveStrikes,
  manualEntries,
  initialFocusMonth,
  onSaveSuccess
}) => {
  // Local editable form state for 12 months
  const [formData, setFormData] = useState<Record<number, ManualMonthlyWSREntry>>({});
  const [expandedMonth, setExpandedMonth] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [officerName, setOfficerName] = useState<string>('Petugas Unit WHU');

  // Initialize or re-sync form data whenever modal opens or year / manualEntries change
  useEffect(() => {
    if (!isOpen) return;

    const initial: Record<number, ManualMonthlyWSREntry> = {};
    const yNum = Number(year) || 2026;

    MONTH_METADATA.forEach(m => {
      const existing = manualEntries[m.index];
      if (existing) {
        initial[m.index] = { ...existing };
      } else {
        initial[m.index] = {
          monthIndex: m.index,
          monthName: m.name,
          year: yNum,
          totalStrike: 0,
          strikeWithDamage: 0,
          strikeNoDamage: 0,
          totalOccurrence: 0,
          totalPatroli: 0,
          totalSatwa: 0,
          notes: ''
        };
      }
    });

    setFormData(initial);
    if (initialFocusMonth !== undefined && initialFocusMonth >= 0 && initialFocusMonth < 12) {
      setExpandedMonth(initialFocusMonth);
    }
  }, [isOpen, year, manualEntries, initialFocusMonth]);

  if (!isOpen) return null;

  // Handle number change for a month
  const handleInputChange = (
    monthIdx: number, 
    field: keyof ManualMonthlyWSREntry, 
    val: string | number
  ) => {
    setFormData(prev => {
      const current = prev[monthIdx] || {
        monthIndex: monthIdx,
        monthName: MONTH_METADATA[monthIdx].name,
        year: Number(year) || 2026,
        totalStrike: 0,
        strikeWithDamage: 0,
        strikeNoDamage: 0
      };

      const numVal = typeof val === 'number' ? Math.max(0, val) : Math.max(0, parseInt(val, 10) || 0);

      const updated = { ...current };

      if (field === 'totalStrike') {
        updated.totalStrike = numVal;
        // Keep damage <= total
        if (updated.strikeWithDamage > numVal) {
          updated.strikeWithDamage = numVal;
        }
        updated.strikeNoDamage = Math.max(0, updated.totalStrike - updated.strikeWithDamage);
      } else if (field === 'strikeWithDamage') {
        updated.strikeWithDamage = numVal;
        if (numVal > updated.totalStrike) {
          updated.totalStrike = numVal;
        }
        updated.strikeNoDamage = Math.max(0, updated.totalStrike - updated.strikeWithDamage);
      } else if (field === 'notes') {
        updated.notes = String(val);
      } else {
        (updated as any)[field] = numVal;
      }

      return {
        ...prev,
        [monthIdx]: updated
      };
    });
  };

  // Quick Action 1: Autofill from current Live Strike Reports
  const handleAutofillFromLive = () => {
    const counts = new Array(12).fill(0);
    const damageCounts = new Array(12).fill(0);

    const targetYearNum = Number(year);

    currentLiveStrikes.forEach(s => {
      let mIdx = -1;
      let yMatch = false;

      if (s.createdAt) {
        const d = new Date(s.createdAt);
        if (!isNaN(d.getTime())) {
          if (d.getFullYear() === targetYearNum) {
            mIdx = d.getMonth();
            yMatch = true;
          }
        }
      }

      if (!yMatch && s.hariTanggal) {
        const yStr = s.hariTanggal.match(/\b(20\d{2})\b/);
        if (yStr && Number(yStr[1]) === targetYearNum) {
          mIdx = getNormalizedMonthIndex(s.hariTanggal);
        }
      }

      if (mIdx >= 0 && mIdx < 12) {
        counts[mIdx]++;
        if (s.indikasiKerusakan === 'Ada') {
          damageCounts[mIdx]++;
        }
      }
    });

    setFormData(prev => {
      const next = { ...prev };
      MONTH_METADATA.forEach(m => {
        const curr = next[m.index] || {
          monthIndex: m.index,
          monthName: m.name,
          year: targetYearNum,
          totalStrike: 0,
          strikeWithDamage: 0,
          strikeNoDamage: 0
        };
        const strikeCount = counts[m.index];
        const damageCount = damageCounts[m.index];
        next[m.index] = {
          ...curr,
          totalStrike: strikeCount,
          strikeWithDamage: damageCount,
          strikeNoDamage: Math.max(0, strikeCount - damageCount),
          notes: curr.notes || (strikeCount > 0 ? `Sinkronisasi dari ${strikeCount} laporan live lapangan` : '')
        };
      });
      return next;
    });

    setSuccessToast(`Data live tahun ${year} berhasil disalin ke form! Klik 'Simpan' untuk mempublikasikan.`);
    setTimeout(() => setSuccessToast(null), 4000);
  };

  // Quick Action 2: Fill from Historical Baseline standard
  const handleAutofillBaseline = () => {
    setFormData(prev => {
      const next = { ...prev };
      MONTH_METADATA.forEach(m => {
        const curr = next[m.index] || {
          monthIndex: m.index,
          monthName: m.name,
          year: Number(year),
          totalStrike: 0,
          strikeWithDamage: 0,
          strikeNoDamage: 0
        };
        const baselineVal = HISTORICAL_BASELINE[m.index] || 0;
        const damageVal = m.index % 4 === 0 ? 1 : 0;
        next[m.index] = {
          ...curr,
          totalStrike: baselineVal,
          strikeWithDamage: damageVal,
          strikeNoDamage: Math.max(0, baselineVal - damageVal),
          notes: curr.notes || 'Standar baseline evaluasi historis aerodrome'
        };
      });
      return next;
    });

    setSuccessToast(`Baseline historis berhasil diterapkan ke seluruh bulan.`);
    setTimeout(() => setSuccessToast(null), 4000);
  };

  // Quick Action 3: Reset all to 0
  const handleResetAll = () => {
    if (!window.confirm(`Kosongkan semua isian manual untuk tahun ${year}?`)) return;

    setFormData(prev => {
      const next = { ...prev };
      MONTH_METADATA.forEach(m => {
        next[m.index] = {
          monthIndex: m.index,
          monthName: m.name,
          year: Number(year),
          totalStrike: 0,
          strikeWithDamage: 0,
          strikeNoDamage: 0,
          totalOccurrence: 0,
          totalPatroli: 0,
          totalSatwa: 0,
          notes: ''
        };
      });
      return next;
    });
  };

  // Permanent Delete / Clear from Firestore
  const handleDeleteFromFirestore = async () => {
    if (!window.confirm(`PERINGATAN: Hapus permanen seluruh data manual WSR tahun ${year} dari database cloud? Data grafik akan kembali mengacu ke laporan harian.`)) return;

    setIsSaving(true);
    try {
      await clearManualMonthlyWSRFromFirestore(year);
      setSuccessToast(`Data manual WSR tahun ${year} berhasil dihapus dari sistem.`);
      if (onSaveSuccess) onSaveSuccess();
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err) {
      console.error(err);
      alert('Gagal menghapus data dari Firestore.');
    } finally {
      setIsSaving(false);
    }
  };

  // Save to Firestore
  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Clean data with timestamp
      const nowIso = new Date().toISOString();
      const cleanedEntries: Record<number, ManualMonthlyWSREntry> = {};

      MONTH_METADATA.forEach(m => {
        const item = formData[m.index];
        const tot = Number(item?.totalStrike) || 0;
        const dam = Number(item?.strikeWithDamage) || 0;
        cleanedEntries[m.index] = {
          monthIndex: m.index,
          monthName: m.name,
          year: Number(year),
          totalStrike: tot,
          strikeWithDamage: Math.min(dam, tot),
          strikeNoDamage: Math.max(0, tot - Math.min(dam, tot)),
          totalOccurrence: Number(item?.totalOccurrence) || 0,
          totalPatroli: Number(item?.totalPatroli) || 0,
          totalSatwa: Number(item?.totalSatwa) || 0,
          notes: item?.notes?.trim() || '',
          updatedAt: nowIso,
          updatedBy: officerName
        };
      });

      await saveManualMonthlyWSRToFirestore(year, cleanedEntries, officerName);
      setSuccessToast(`Data WSR bulanan tahun ${year} berhasil disimpan & disinkronkan ke seluruh perangkat!`);
      if (onSaveSuccess) onSaveSuccess();

      setTimeout(() => {
        setSuccessToast(null);
        onClose();
      }, 1200);
    } catch (err) {
      console.error(err);
      alert('Terjadi kesalahan saat menyimpan data ke Firestore.');
    } finally {
      setIsSaving(false);
    }
  };

  // Calculate annual totals from current formData
  const annualStats = useMemo(() => {
    let total = 0;
    let damage = 0;
    let peakCount = -1;
    let peakName = '-';

    MONTH_METADATA.forEach(m => {
      const item = formData[m.index];
      const count = Number(item?.totalStrike) || 0;
      const dam = Number(item?.strikeWithDamage) || 0;
      total += count;
      damage += dam;
      if (count > peakCount) {
        peakCount = count;
        peakName = m.name;
      }
    });

    const damagePercent = total > 0 ? Math.round((damage / total) * 100) : 0;
    const avgPerMonth = (total / 12).toFixed(1);

    return { total, damage, damagePercent, avgPerMonth, peakName, peakCount };
  }, [formData]);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
      <div 
        className="bg-white rounded-2xl max-w-5xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4.5 bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white">
                  Pengisian Manual Kejadian WSR Per Bulan
                </h2>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  WSR Calibration
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Input, validasi, dan publikasikan jumlah kejadian Wildlife Strike Report (WSR) per bulan untuk visualisasi grafik batang aerodrome.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Year Selector */}
            <div className="flex items-center space-x-1.5 bg-slate-800/90 px-3 py-1.5 rounded-xl border border-slate-700 text-xs">
              <Calendar className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-slate-400">Tahun:</span>
              <select
                value={year}
                onChange={(e) => onYearChange(e.target.value)}
                className="bg-transparent text-white font-bold focus:outline-hidden cursor-pointer"
              >
                {availableYears.map(y => (
                  <option key={y} value={y} className="bg-slate-800 text-white">
                    {y}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition cursor-pointer"
              title="Tutup Modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Quick Toolbar & Presets */}
        <div className="px-6 py-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-slate-600 mr-1 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              Alat Cepat:
            </span>

            <button
              type="button"
              onClick={handleAutofillFromLive}
              className="px-2.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg text-xs font-medium transition cursor-pointer flex items-center gap-1.5 shadow-2xs"
              title="Tarik data strike dari database laporan harian live tahun ini"
            >
              <DownloadCloud className="w-3.5 h-3.5 text-sky-600" />
              <span>Salin Data Live Lapangan</span>
            </button>

            <button
              type="button"
              onClick={handleAutofillBaseline}
              className="px-2.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg text-xs font-medium transition cursor-pointer flex items-center gap-1.5 shadow-2xs"
              title="Gunakan standar baseline tren tahunan aerodrome"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-indigo-600" />
              <span>Standar Baseline CGK</span>
            </button>

            <button
              type="button"
              onClick={handleResetAll}
              className="px-2.5 py-1.5 bg-white hover:bg-rose-50 text-slate-700 hover:text-rose-700 border border-slate-300 hover:border-rose-300 rounded-lg text-xs font-medium transition cursor-pointer flex items-center gap-1.5 shadow-2xs"
              title="Reset semua nilai ke 0"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
              <span>Reset Angka</span>
            </button>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-500">Nama Petugas Input:</span>
            <input
              type="text"
              value={officerName}
              onChange={(e) => setOfficerName(e.target.value)}
              placeholder="Unit WHU / Nama Petugas"
              className="px-2.5 py-1 border border-slate-300 rounded-lg text-xs bg-white text-slate-800 font-medium w-48 focus:border-amber-500 focus:outline-hidden"
            />
          </div>
        </div>

        {/* Success Toast */}
        {successToast && (
          <div className="mx-6 mt-3 p-3 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs flex items-center justify-between animate-in fade-in shrink-0">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="font-medium">{successToast}</span>
            </div>
            <button 
              onClick={() => setSuccessToast(null)} 
              className="text-emerald-700 hover:text-emerald-950 text-xs underline cursor-pointer"
            >
              Tutup
            </button>
          </div>
        )}

        {/* Annual Stats Summary Bar */}
        <div className="px-6 py-3 bg-indigo-50/60 border-b border-indigo-100 grid grid-cols-2 sm:grid-cols-4 gap-3 shrink-0">
          <div className="bg-white p-2.5 rounded-xl border border-indigo-100 shadow-2xs">
            <span className="text-[11px] text-slate-500 block">Total WSR ({year}):</span>
            <span className="text-lg font-bold font-mono text-indigo-900">{annualStats.total}</span>
            <span className="text-[10px] text-slate-400 ml-1">Kejadian</span>
          </div>

          <div className="bg-white p-2.5 rounded-xl border border-indigo-100 shadow-2xs">
            <span className="text-[11px] text-slate-500 block">Dengan Kerusakan (Damage):</span>
            <span className="text-lg font-bold font-mono text-rose-600">{annualStats.damage}</span>
            <span className="text-[10px] text-rose-500 ml-1">({annualStats.damagePercent}%)</span>
          </div>

          <div className="bg-white p-2.5 rounded-xl border border-indigo-100 shadow-2xs">
            <span className="text-[11px] text-slate-500 block">Rata-rata Per Bulan:</span>
            <span className="text-lg font-bold font-mono text-slate-800">{annualStats.avgPerMonth}</span>
            <span className="text-[10px] text-slate-400 ml-1">Strike/bln</span>
          </div>

          <div className="bg-white p-2.5 rounded-xl border border-indigo-100 shadow-2xs">
            <span className="text-[11px] text-slate-500 block">Bulan Risiko Tertinggi:</span>
            <span className="text-sm font-bold text-amber-700 truncate block">
              {annualStats.peakName} ({annualStats.peakCount} Strike)
            </span>
          </div>
        </div>

        {/* Scrollable Month Grid Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {MONTH_METADATA.map((m) => {
              const item = formData[m.index] || {
                monthIndex: m.index,
                monthName: m.name,
                year: Number(year),
                totalStrike: 0,
                strikeWithDamage: 0,
                strikeNoDamage: 0
              };

              const isExpanded = expandedMonth === m.index;
              const hasDamage = item.strikeWithDamage > 0;
              const isHigh = item.totalStrike >= 6;

              return (
                <div 
                  key={m.index}
                  className={`rounded-2xl border transition-all ${
                    isExpanded 
                      ? 'border-amber-400 shadow-md ring-2 ring-amber-100 bg-white' 
                      : 'border-slate-200 hover:border-slate-300 bg-slate-50/50 hover:bg-white'
                  }`}
                >
                  {/* Month Card Header */}
                  <div className="p-3.5 border-b border-slate-100 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-base">{m.icon}</span>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h4 className="font-bold text-slate-900 text-sm">{m.name}</h4>
                          <span className="text-[10px] text-slate-400 font-mono">Bulan {m.index + 1}</span>
                        </div>
                        <p className="text-[10px] text-slate-500 truncate max-w-[190px]">
                          {m.season}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      {isHigh && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-700">
                          High
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => setExpandedMonth(isExpanded ? null : m.index)}
                        className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold px-2 py-0.5 rounded hover:bg-indigo-50 transition cursor-pointer"
                      >
                        {isExpanded ? 'Ringkas' : 'Detail'}
                      </button>
                    </div>
                  </div>

                  {/* Primary Strike Inputs */}
                  <div className="p-3.5 space-y-3">
                    <div className="grid grid-cols-2 gap-2.5">
                      {/* Total Strike */}
                      <div>
                        <label className="text-[11px] font-bold text-slate-700 block mb-1">
                          Total WSR:
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            min="0"
                            max="999"
                            value={item.totalStrike === 0 ? '' : item.totalStrike}
                            onChange={(e) => handleInputChange(m.index, 'totalStrike', e.target.value)}
                            placeholder="0"
                            className="w-full px-3 py-1.5 text-base font-bold font-mono bg-white border border-slate-300 rounded-xl focus:border-amber-500 focus:ring-2 focus:ring-amber-200 text-slate-900 focus:outline-hidden"
                          />
                          <span className="absolute right-2.5 top-2 text-[10px] text-slate-400 pointer-events-none">
                            Kasus
                          </span>
                        </div>
                      </div>

                      {/* Strike With Damage */}
                      <div>
                        <label className="text-[11px] font-bold text-rose-700 block mb-1">
                          Ada Kerusakan:
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            min="0"
                            max={item.totalStrike || 999}
                            value={item.strikeWithDamage === 0 ? '' : item.strikeWithDamage}
                            onChange={(e) => handleInputChange(m.index, 'strikeWithDamage', e.target.value)}
                            placeholder="0"
                            className="w-full px-3 py-1.5 text-base font-bold font-mono bg-white border border-rose-200 rounded-xl focus:border-rose-500 focus:ring-2 focus:ring-rose-200 text-rose-700 focus:outline-hidden"
                          />
                          <span className="absolute right-2.5 top-2 text-[10px] text-rose-400 pointer-events-none">
                            Kasus
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Breakdown sub-bar: Tanpa Kerusakan & Status */}
                    <div className="flex items-center justify-between text-[11px] px-2 py-1.5 rounded-lg bg-slate-100 text-slate-600">
                      <span>Tanpa Kerusakan:</span>
                      <span className="font-mono font-semibold text-slate-900">
                        {item.strikeNoDamage} Kasus
                      </span>
                    </div>

                    {/* Expandable Extra Operational Context */}
                    {isExpanded && (
                      <div className="pt-2.5 border-t border-slate-200 space-y-2.5 animate-in fade-in">
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[10px] font-medium text-slate-600 block mb-0.5">
                              WHR (Occurrence):
                            </label>
                            <input
                              type="number"
                              min="0"
                              value={item.totalOccurrence || ''}
                              onChange={(e) => handleInputChange(m.index, 'totalOccurrence', e.target.value)}
                              placeholder="0"
                              className="w-full px-2 py-1 text-xs font-mono bg-white border border-slate-300 rounded-lg focus:outline-hidden"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-medium text-slate-600 block mb-0.5">
                              Total Patroli:
                            </label>
                            <input
                              type="number"
                              min="0"
                              value={item.totalPatroli || ''}
                              onChange={(e) => handleInputChange(m.index, 'totalPatroli', e.target.value)}
                              placeholder="0"
                              className="w-full px-2 py-1 text-xs font-mono bg-white border border-slate-300 rounded-lg focus:outline-hidden"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="text-[10px] font-medium text-slate-600 block mb-0.5">
                            Satwa Teramati (Ekor):
                          </label>
                          <input
                            type="number"
                            min="0"
                            value={item.totalSatwa || ''}
                            onChange={(e) => handleInputChange(m.index, 'totalSatwa', e.target.value)}
                            placeholder="0"
                            className="w-full px-2 py-1 text-xs font-mono bg-white border border-slate-300 rounded-lg focus:outline-hidden"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] font-medium text-slate-600 block mb-0.5">
                            Catatan Operasional / Kronologi:
                          </label>
                          <textarea
                            rows={2}
                            value={item.notes || ''}
                            onChange={(e) => handleInputChange(m.index, 'notes', e.target.value)}
                            placeholder="Mis: 1 strike runway 25R dampak radome retak..."
                            className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-hidden text-slate-800"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="flex items-center space-x-2 text-xs text-slate-500">
            <Info className="w-4 h-4 text-slate-400 shrink-0" />
            <span>
              Perubahan akan langsung meng-update grafik batang tahun {year} dan tersinkronisasi ke seluruh rekan tim.
            </span>
          </div>

          <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={handleDeleteFromFirestore}
              disabled={isSaving}
              className="px-3 py-2 text-rose-600 hover:text-rose-800 hover:bg-rose-50 border border-transparent hover:border-rose-200 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-1.5"
              title="Hapus data manual tahun ini"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Hapus Data</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl text-xs font-semibold transition cursor-pointer"
            >
              Batal
            </button>

            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="px-5 py-2 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white rounded-xl text-xs font-bold shadow-md shadow-amber-600/20 transition cursor-pointer flex items-center gap-2"
            >
              {isSaving ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Simpan &amp; Publikasikan Grafik</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
