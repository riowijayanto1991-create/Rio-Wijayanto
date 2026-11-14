import React, { useState, useMemo } from 'react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  Legend, 
  Cell, 
  ReferenceLine 
} from 'recharts';
import { 
  FileText, 
  FileCode, 
  Upload, 
  Download, 
  Eye, 
  Trash2, 
  Search, 
  Filter, 
  Calendar, 
  ShieldCheck, 
  Layers, 
  User, 
  Clock, 
  FileCheck,
  AlertTriangle,
  FileSpreadsheet,
  CheckCircle2,
  FolderArchive,
  ArrowUpDown,
  BarChart3,
  ChevronDown,
  ChevronUp,
  Sparkles,
  TrendingUp,
  X
} from 'lucide-react';
import { MonthlyReportDocument, MonthlyDocumentCategory, DocumentFormatType } from '../types';
import { MonthlyReportPreviewModal } from './MonthlyReportPreviewModal';
import { AdminAuthModal } from './AdminAuthModal';

interface MonthlyReportArchiveProps {
  documents: MonthlyReportDocument[];
  onOpenUploadModal: () => void;
  onDeleteDocument: (id: string, title: string) => Promise<void> | void;
  onOpenMonthlyDraft?: () => void;
  isAdmin: boolean;
  setIsAdmin: (val: boolean) => void;
}

export const MonthlyReportArchive: React.FC<MonthlyReportArchiveProps> = ({
  documents,
  onOpenUploadModal,
  onDeleteDocument,
  onOpenMonthlyDraft,
  isAdmin,
  setIsAdmin
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [formatFilter, setFormatFilter] = useState<'all' | 'pdf' | 'word' | 'excel'>('all');
  const [yearFilter, setYearFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'name'>('newest');

  // Bar Chart states
  const [showBarChart, setShowBarChart] = useState<boolean>(true);
  const [chartMetric, setChartMetric] = useState<'strikes' | 'patrols' | 'occurrences' | 'satwa' | 'multi'>('strikes');
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);

  // Preview modal state
  const [previewDoc, setPreviewDoc] = useState<MonthlyReportDocument | null>(null);

  // Deletion modal state
  const [docToDelete, setDocToDelete] = useState<MonthlyReportDocument | null>(null);
  const [isAdminAuthOpen, setIsAdminAuthOpen] = useState<boolean>(false);
  const [pendingDeleteTarget, setPendingDeleteTarget] = useState<MonthlyReportDocument | null>(null);

  // Filter logic
  const filtered = documents.filter((doc) => {
    if (formatFilter !== 'all' && doc.fileType !== formatFilter) return false;
    if (yearFilter !== 'all' && doc.periodeTahun.toString() !== yearFilter) return false;
    if (categoryFilter !== 'all' && doc.kategoriLaporan !== categoryFilter) return false;
    if (selectedMonth && doc.periodeBulan.toLowerCase() !== selectedMonth.toLowerCase() && !doc.periodeBulan.toLowerCase().startsWith(selectedMonth.toLowerCase())) {
      return false;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        doc.title.toLowerCase().includes(q) ||
        doc.fileName.toLowerCase().includes(q) ||
        doc.periodeBulan.toLowerCase().includes(q) ||
        doc.uploadedBy.toLowerCase().includes(q) ||
        (doc.catatanRingkasan && doc.catatanRingkasan.toLowerCase().includes(q))
      );
    }
    return true;
  });

  // Sorting
  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'newest') {
      return new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime();
    }
    if (sortBy === 'oldest') {
      return new Date(a.uploadedAt).getTime() - new Date(b.uploadedAt).getTime();
    }
    return a.title.localeCompare(b.title);
  });

  // Count stats
  const totalDocs = documents.length;
  const pdfCount = documents.filter(d => d.fileType === 'pdf').length;
  const wordCount = documents.filter(d => d.fileType === 'word').length;
  const excelCount = documents.filter(d => d.fileType === 'excel').length;
  const yearSet = new Set<number>();
  documents.forEach(d => yearSet.add(Number(d.periodeTahun)));
  const availableYears: number[] = Array.from(yearSet).sort((a, b) => b - a);

  // Months list for chart aggregation
  const MONTHS_LIST = useMemo(() => [
    { key: 0, short: 'Jan', full: 'Januari' },
    { key: 1, short: 'Feb', full: 'Februari' },
    { key: 2, short: 'Mar', full: 'Maret' },
    { key: 3, short: 'Apr', full: 'April' },
    { key: 4, short: 'Mei', full: 'Mei' },
    { key: 5, short: 'Jun', full: 'Juni' },
    { key: 6, short: 'Jul', full: 'Juli' },
    { key: 7, short: 'Agu', full: 'Agustus' },
    { key: 8, short: 'Sep', full: 'September' },
    { key: 9, short: 'Okt', full: 'Oktober' },
    { key: 10, short: 'Nov', full: 'November' },
    { key: 11, short: 'Des', full: 'Desember' }
  ], []);

  const chartYear = useMemo(() => {
    if (yearFilter !== 'all') return Number(yearFilter);
    return availableYears.length > 0 ? availableYears[0] : 2026;
  }, [yearFilter, availableYears]);

  const chartData = useMemo(() => {
    return MONTHS_LIST.map((m) => {
      const doc = documents.find(
        d => Number(d.periodeTahun) === chartYear &&
             (d.periodeBulan.toLowerCase() === m.full.toLowerCase() ||
              d.periodeBulan.toLowerCase() === m.short.toLowerCase())
      );

      return {
        monthKey: m.key,
        shortMonth: m.short,
        fullMonth: m.full,
        hasDoc: Boolean(doc),
        doc,
        strikes: doc?.totalStrikeBulanIni ?? 0,
        strikesWithDamage: doc?.strikeWithDamageBulanIni ?? 0,
        patrols: doc?.totalPatroliBulanIni ?? 0,
        occurrences: doc?.totalOccurrenceBulanIni ?? 0,
        satwa: doc?.totalSatwaBulanIni ?? 0,
        species: doc?.spesiesDominan || '-',
        area: doc?.areaRawanUtama || '-'
      };
    });
  }, [MONTHS_LIST, documents, chartYear]);

  const chartTotals = useMemo(() => {
    const docsInYear = chartData.filter(d => d.hasDoc);
    return {
      uploadedCount: docsInYear.length,
      totalStrikes: docsInYear.reduce((acc, d) => acc + d.strikes, 0),
      totalDamage: docsInYear.reduce((acc, d) => acc + d.strikesWithDamage, 0),
      totalPatrols: docsInYear.reduce((acc, d) => acc + d.patrols, 0),
      totalOccurrences: docsInYear.reduce((acc, d) => acc + d.occurrences, 0),
      totalSatwa: docsInYear.reduce((acc, d) => acc + d.satwa, 0),
    };
  }, [chartData]);

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const handleDownload = (docItem: MonthlyReportDocument) => {
    if (docItem.fileData && docItem.fileData.startsWith('data:')) {
      const link = document.createElement('a');
      link.href = docItem.fileData;
      link.download = docItem.fileName || `${docItem.title}.${docItem.fileType === 'pdf' ? 'pdf' : 'docx'}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      // Create fallback dummy file for template downloading
      const dummyContent = `DOKUMEN RESMI WHMS - PT ANGKASA PURA INDONESIA\n\nJudul: ${docItem.title}\nPeriode: ${docItem.periodeBulan} ${docItem.periodeTahun}\nKategori: ${docItem.kategoriLaporan}\nPengunggah: ${docItem.uploadedBy}\nStatus: ${docItem.statusVerifikasi}\n\nRingkasan:\n${docItem.catatanRingkasan || 'Tidak ada catatan tambahan.'}`;
      const blob = new Blob([dummyContent], { 
        type: docItem.fileType === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = docItem.fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  };

  const handleDeleteRequest = (docItem: MonthlyReportDocument) => {
    if (!isAdmin) {
      setPendingDeleteTarget(docItem);
      setIsAdminAuthOpen(true);
    } else {
      setDocToDelete(docItem);
    }
  };

  const confirmDelete = async () => {
    if (docToDelete) {
      await onDeleteDocument(docToDelete.id, docToDelete.title);
      setDocToDelete(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center font-bold">
              <FolderArchive className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                Arsip Laporan Bulanan Terdahulu (PDF &amp; Word)
              </h2>
              <p className="text-xs text-slate-500">
                Simpan, telusuri, dan unduh berkas resmi laporan bulanan terdahulu unit Wildlife Hazard Management.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
          {onOpenMonthlyDraft && (
            <button
              type="button"
              onClick={onOpenMonthlyDraft}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-sm shadow-amber-600/20 transition cursor-pointer"
              title="Otomatisasi pembuatan draft dokumen laporan bulanan dalam format JSON (siap integrasi template Word/PDF)"
            >
              <FileCode className="w-4 h-4 text-amber-200" />
              <span>Draft JSON Bulanan (Word/PDF)</span>
            </button>
          )}

          <button
            onClick={onOpenUploadModal}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 shadow-sm shadow-sky-600/20 transition cursor-pointer"
          >
            <Upload className="w-4 h-4" />
            <span>Unggah Laporan Bulanan</span>
          </button>
        </div>
      </div>

      {/* Metric Counters Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-600 shrink-0">
            <FolderArchive className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-slate-500 block">Total Arsip Dokumen</span>
            <span className="text-xl font-bold text-slate-900 font-mono">{totalDocs}</span>
            <span className="text-[10px] text-slate-400 block mt-0.5">Berkas tersimpan</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 shrink-0">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-slate-500 block">Dokumen PDF</span>
            <span className="text-xl font-bold text-rose-600 font-mono">{pdfCount}</span>
            <span className="text-[10px] text-slate-400 block mt-0.5">Berkas format .pdf</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0">
            <FileCode className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-slate-500 block">Dokumen Word</span>
            <span className="text-xl font-bold text-blue-600 font-mono">{wordCount}</span>
            <span className="text-[10px] text-slate-400 block mt-0.5">Berkas .docx / .doc</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-slate-500 block">Status Keamanan</span>
            <span className="text-xs font-bold text-emerald-700 font-mono block mt-1">TERINTEGRASI CLOUD</span>
            <span className="text-[10px] text-slate-400 block">Tersinkronisasi otomatis</span>
          </div>
        </div>
      </div>

      {/* Laporan Grafik Batang Rekapitulasi Dokumen Terunggah */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden" id="grafik-batang-dokumen-terunggah">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-md bg-indigo-50 border border-indigo-200/60 text-indigo-700 text-[11px] font-bold uppercase tracking-wider flex items-center gap-1">
                <BarChart3 className="w-3.5 h-3.5 text-indigo-600" />
                Grafik Batang Rekapitulasi
              </span>
              <span className="text-xs font-semibold text-slate-500">
                Tahun {chartYear}
              </span>
              {selectedMonth && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-sky-100 text-sky-800 text-[11px] font-bold">
                  Saring: {selectedMonth}
                  <button 
                    type="button" 
                    onClick={() => setSelectedMonth(null)}
                    className="hover:text-sky-950 cursor-pointer ml-0.5"
                    title="Hapus filter bulan"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
            </div>
            <h3 className="text-base font-bold text-slate-900 mt-1">
              Visualisasi Data Dokumen Laporan Bulanan Terunggah
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Distribusi metrik operasional (Wildlife Strike, Patroli, Occurrence, Satwa) yang diekstrak langsung dari arsip laporan bulanan.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Metric Switcher */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs">
              <button
                type="button"
                onClick={() => setChartMetric('strikes')}
                className={`px-2.5 py-1.5 rounded-lg font-semibold transition cursor-pointer ${
                  chartMetric === 'strikes'
                    ? 'bg-white text-rose-600 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Strike
              </button>
              <button
                type="button"
                onClick={() => setChartMetric('patrols')}
                className={`px-2.5 py-1.5 rounded-lg font-semibold transition cursor-pointer ${
                  chartMetric === 'patrols'
                    ? 'bg-white text-indigo-600 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Patroli
              </button>
              <button
                type="button"
                onClick={() => setChartMetric('occurrences')}
                className={`px-2.5 py-1.5 rounded-lg font-semibold transition cursor-pointer ${
                  chartMetric === 'occurrences'
                    ? 'bg-white text-amber-600 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Occurrence
              </button>
              <button
                type="button"
                onClick={() => setChartMetric('satwa')}
                className={`px-2.5 py-1.5 rounded-lg font-semibold transition cursor-pointer ${
                  chartMetric === 'satwa'
                    ? 'bg-white text-emerald-600 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Satwa
              </button>
              <button
                type="button"
                onClick={() => setChartMetric('multi')}
                className={`px-2.5 py-1.5 rounded-lg font-semibold transition cursor-pointer ${
                  chartMetric === 'multi'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Multi
              </button>
            </div>

            {/* Collapse / Expand Button */}
            <button
              type="button"
              onClick={() => setShowBarChart(!showBarChart)}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 border border-slate-200 transition cursor-pointer"
              title={showBarChart ? "Sembunyikan grafik batang" : "Tampilkan grafik batang"}
            >
              {showBarChart ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {showBarChart && (
          <div className="p-4 sm:p-5 space-y-4">
            {/* Quick Metrics Summary Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 bg-slate-50/80 p-3 rounded-xl border border-slate-200/70 text-xs">
              <div>
                <span className="text-[11px] font-medium text-slate-500 block">Dokumen Terarsip ({chartYear}):</span>
                <span className="font-bold text-slate-900 font-mono text-sm">{chartTotals.uploadedCount} / 12 Bulan</span>
              </div>
              <div>
                <span className="text-[11px] font-medium text-slate-500 block">Total Strike Terarsip:</span>
                <span className="font-bold text-rose-600 font-mono text-sm">{chartTotals.totalStrikes} Kasus</span>
              </div>
              <div>
                <span className="text-[11px] font-medium text-slate-500 block">Kerusakan Pesawat:</span>
                <span className="font-bold text-amber-600 font-mono text-sm">{chartTotals.totalDamage} Kasus</span>
              </div>
              <div>
                <span className="text-[11px] font-medium text-slate-500 block">Total Patroli Lapangan:</span>
                <span className="font-bold text-indigo-600 font-mono text-sm">{chartTotals.totalPatrols} Inspeksi</span>
              </div>
              <div className="col-span-2 sm:col-span-1">
                <span className="text-[11px] font-medium text-slate-500 block">Occurrence Satwa:</span>
                <span className="font-bold text-emerald-600 font-mono text-sm">{chartTotals.totalOccurrences} Kejadian</span>
              </div>
            </div>

            {/* Recharts Bar Canvas */}
            <div className="h-64 sm:h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart 
                  data={chartData} 
                  margin={{ top: 10, right: 15, left: -15, bottom: 0 }}
                  onClick={(e: any) => {
                    if (e && e.activePayload && e.activePayload.length > 0) {
                      const clicked = e.activePayload[0].payload;
                      if (clicked.hasDoc) {
                        setSelectedMonth(selectedMonth === clicked.fullMonth ? null : clicked.fullMonth);
                      }
                    }
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis 
                    dataKey="shortMonth" 
                    tickLine={false} 
                    axisLine={{ stroke: '#cbd5e1' }}
                    tick={{ fontSize: 11, fill: '#475569', fontWeight: 500 }}
                  />
                  <YAxis 
                    allowDecimals={false}
                    tickLine={false} 
                    axisLine={false}
                    tick={{ fontSize: 11, fill: '#64748b' }}
                  />
                  <RechartsTooltip 
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-slate-900/95 text-white p-3 rounded-xl border border-slate-700 shadow-xl text-xs space-y-1.5 max-w-xs">
                            <div className="flex items-center justify-between border-b border-slate-700 pb-1.5">
                              <span className="font-bold text-sm text-sky-400">{data.fullMonth} {chartYear}</span>
                              <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                                data.hasDoc 
                                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' 
                                  : 'bg-slate-800 text-slate-400'
                              }`}>
                                {data.hasDoc ? 'Dokumen Terunggah' : 'Belum Ada Berkas'}
                              </span>
                            </div>

                            {data.hasDoc ? (
                              <>
                                <p className="text-[11px] font-medium text-slate-300 truncate">
                                  {data.doc?.title}
                                </p>
                                <p className="text-[10px] font-mono text-slate-400 truncate">
                                  {data.doc?.fileName}
                                </p>
                                <div className="grid grid-cols-2 gap-1.5 pt-1 border-t border-slate-800 text-[11px]">
                                  <div>
                                    <span className="text-slate-400 block text-[10px]">Strike:</span>
                                    <span className="font-bold font-mono text-rose-400">{data.strikes} (Rusak: {data.strikesWithDamage})</span>
                                  </div>
                                  <div>
                                    <span className="text-slate-400 block text-[10px]">Patroli:</span>
                                    <span className="font-bold font-mono text-indigo-400">{data.patrols} kali</span>
                                  </div>
                                  <div>
                                    <span className="text-slate-400 block text-[10px]">Occurrence:</span>
                                    <span className="font-bold font-mono text-amber-400">{data.occurrences} kejadian</span>
                                  </div>
                                  <div>
                                    <span className="text-slate-400 block text-[10px]">Satwa:</span>
                                    <span className="font-bold font-mono text-emerald-400">{data.satwa.toLocaleString('id-ID')} ekor</span>
                                  </div>
                                </div>
                                <div className="text-[10px] text-slate-400 pt-1 border-t border-slate-800">
                                  <span>Dominan: <strong>{data.species}</strong> • Area: <strong>{data.area}</strong></span>
                                </div>
                                <p className="text-[10px] text-sky-300 text-center pt-1 font-semibold">
                                  💡 Klik batang untuk menyaring arsip bulan ini
                                </p>
                              </>
                            ) : (
                              <p className="text-[11px] text-slate-400">
                                Belum ada berkas laporan bulanan yang diunggah untuk periode ini.
                              </p>
                            )}
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend 
                    verticalAlign="top" 
                    height={32} 
                    formatter={(val) => <span className="text-xs text-slate-700 font-semibold">{val}</span>}
                  />

                  {chartMetric === 'strikes' && (
                    <>
                      <Bar 
                        dataKey="strikes" 
                        name="Total Strike (Biru: Terunggah, Abu: Kosong)" 
                        radius={[4, 4, 0, 0]}
                        maxBarSize={28}
                      >
                        {chartData.map((entry, idx) => (
                          <Cell 
                            key={`doc-cell-strike-${idx}`} 
                            fill={entry.hasDoc ? (selectedMonth === entry.fullMonth ? '#0369a1' : '#0284c7') : '#e2e8f0'} 
                          />
                        ))}
                      </Bar>
                      <Bar 
                        dataKey="strikesWithDamage" 
                        name="Ada Kerusakan Pesawat" 
                        fill="#e11d48"
                        radius={[4, 4, 0, 0]}
                        maxBarSize={28}
                      />
                    </>
                  )}

                  {chartMetric === 'patrols' && (
                    <>
                      <Bar 
                        dataKey="patrols" 
                        name="Patroli &amp; Inspeksi Udara" 
                        radius={[4, 4, 0, 0]}
                        maxBarSize={32}
                      >
                        {chartData.map((entry, idx) => (
                          <Cell 
                            key={`doc-cell-patrol-${idx}`} 
                            fill={entry.hasDoc ? (selectedMonth === entry.fullMonth ? '#3730a3' : '#4f46e5') : '#e2e8f0'} 
                          />
                        ))}
                      </Bar>
                      <ReferenceLine y={90} label="Target SOP (90)" stroke="#059669" strokeDasharray="3 3" />
                    </>
                  )}

                  {chartMetric === 'occurrences' && (
                    <Bar 
                      dataKey="occurrences" 
                      name="Laporan Kejadian Satwa (Occurrence)" 
                      radius={[4, 4, 0, 0]}
                      maxBarSize={32}
                    >
                      {chartData.map((entry, idx) => (
                        <Cell 
                          key={`doc-cell-occ-${idx}`} 
                          fill={entry.hasDoc ? (selectedMonth === entry.fullMonth ? '#b45309' : '#f59e0b') : '#e2e8f0'} 
                        />
                      ))}
                    </Bar>
                  )}

                  {chartMetric === 'satwa' && (
                    <Bar 
                      dataKey="satwa" 
                      name="Populasi Satwa Teramati (Ekor)" 
                      radius={[4, 4, 0, 0]}
                      maxBarSize={32}
                    >
                      {chartData.map((entry, idx) => (
                        <Cell 
                          key={`doc-cell-satwa-${idx}`} 
                          fill={entry.hasDoc ? (selectedMonth === entry.fullMonth ? '#047857' : '#10b981') : '#e2e8f0'} 
                        />
                      ))}
                    </Bar>
                  )}

                  {chartMetric === 'multi' && (
                    <>
                      <Bar dataKey="strikes" name="Strike" fill="#0284c7" radius={[4, 4, 0, 0]} maxBarSize={18} />
                      <Bar dataKey="occurrences" name="Occurrence" fill="#f59e0b" radius={[4, 4, 0, 0]} maxBarSize={18} />
                      <Bar dataKey="patrols" name="Patroli" fill="#4f46e5" radius={[4, 4, 0, 0]} maxBarSize={18} />
                    </>
                  )}
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-sky-600" />
                Data grafik otomatis diperbarui dan disinkronkan saat berkas laporan bulanan baru diunggah.
              </span>
              {selectedMonth && (
                <button
                  type="button"
                  onClick={() => setSelectedMonth(null)}
                  className="text-sky-600 hover:text-sky-700 font-semibold cursor-pointer"
                >
                  Reset Filter Bulan ({selectedMonth})
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Filter and Search Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row items-center gap-3">
          {/* Search Box */}
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari berdasarkan judul, nama file, bulan, atau ringkasan..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:bg-white focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition"
            />
          </div>

          {/* Format Filter Chips */}
          <div className="flex items-center gap-1.5 self-start md:self-auto overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
            <button
              onClick={() => setFormatFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                formatFilter === 'all'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Semua Format ({totalDocs})
            </button>
            <button
              onClick={() => setFormatFilter('excel')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 ${
                formatFilter === 'excel'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200/60'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Excel ({excelCount})</span>
            </button>
            <button
              onClick={() => setFormatFilter('pdf')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 ${
                formatFilter === 'pdf'
                  ? 'bg-rose-600 text-white'
                  : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200/60'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>PDF ({pdfCount})</span>
            </button>
            <button
              onClick={() => setFormatFilter('word')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 ${
                formatFilter === 'word'
                  ? 'bg-blue-600 text-white'
                  : 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200/60'
              }`}
            >
              <FileCode className="w-3.5 h-3.5" />
              <span>Word ({wordCount})</span>
            </button>
          </div>
        </div>

        {/* Secondary Filter Line */}
        <div className="flex flex-wrap items-center gap-2.5 pt-2 border-t border-slate-100 text-xs">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-500 font-medium">Tahun:</span>
            <select
              value={yearFilter}
              onChange={(e) => setYearFilter(e.target.value)}
              className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:ring-1 focus:ring-sky-500 outline-none"
            >
              <option value="all">Semua Tahun</option>
              {availableYears.map(y => (
                <option key={y} value={y.toString()}>{y}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-500 font-medium">Kategori:</span>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:ring-1 focus:ring-sky-500 outline-none max-w-[220px] truncate"
            >
              <option value="all">Semua Kategori Laporan</option>
              <option value="Laporan Bulanan Lengkap (Comprehensive WHMS)">Laporan Bulanan Lengkap</option>
              <option value="Rekapitulasi Wildlife Strike Bulanan (ICAO IBIS)">Rekapitulasi Wildlife Strike</option>
              <option value="Laporan Evaluasi & Rekomendasi Habitat">Evaluasi Habitat</option>
              <option value="Laporan Inspeksi & Patroli Rutin Bulanan">Inspeksi &amp; Patroli Bulanan</option>
              <option value="Laporan Kelaikan Armada & Peralatan WHU">Kelaikan Armada</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 ml-auto">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-500 font-medium">Urutkan:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:ring-1 focus:ring-sky-500 outline-none"
            >
              <option value="newest">Terbaru Diunggah</option>
              <option value="oldest">Terlama Diunggah</option>
              <option value="name">Nama Dokumen</option>
            </select>
          </div>
        </div>
      </div>

      {/* Document Archive List / Grid */}
      {sorted.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
            <FolderArchive className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-slate-800">
            Tidak ada dokumen laporan bulanan yang sesuai
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            {searchQuery || formatFilter !== 'all' || yearFilter !== 'all' || categoryFilter !== 'all'
              ? 'Silakan ubah kata kunci pencarian atau sesuaikan filter format/tahun di atas.'
              : 'Belum ada dokumen laporan bulanan terdahulu yang diunggah ke arsip.'}
          </p>
          <button
            onClick={onOpenUploadModal}
            className="mt-4 px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold inline-flex items-center gap-2 shadow transition cursor-pointer"
          >
            <Upload className="w-4 h-4" />
            <span>Unggah Dokumen Sekarang</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sorted.map((item) => {
            const isPdf = item.fileType === 'pdf';
            const isExcel = item.fileType === 'excel';
            return (
              <div
                key={item.id}
                className="bg-white rounded-2xl border border-slate-200 hover:border-slate-300 shadow-sm hover:shadow transition p-4 flex flex-col justify-between"
              >
                <div>
                  {/* Top line with Format Badge & Period */}
                  <div className="flex items-start justify-between gap-3 mb-2.5">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-10 h-10 rounded-xl flex flex-col items-center justify-center text-white shrink-0 shadow-sm ${
                        isPdf ? 'bg-rose-600' : isExcel ? 'bg-emerald-600' : 'bg-blue-600'
                      }`}>
                        {isPdf ? (
                          <FileText className="w-5 h-5" />
                        ) : isExcel ? (
                          <FileSpreadsheet className="w-5 h-5" />
                        ) : (
                          <FileCode className="w-5 h-5" />
                        )}
                        <span className="text-[8px] font-black uppercase tracking-wider">
                          {isPdf ? 'PDF' : isExcel ? 'XLSX' : 'DOCX'}
                        </span>
                      </div>

                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={`text-[10px] font-bold px-2 py-0.2 rounded-full border ${
                            isPdf 
                              ? 'bg-rose-50 text-rose-700 border-rose-200' 
                              : isExcel
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : 'bg-blue-50 text-blue-700 border-blue-200'
                          }`}>
                            {isPdf ? 'PDF' : isExcel ? 'EXCEL' : 'WORD'}
                          </span>
                          <span className="text-[11px] font-bold text-sky-900 bg-sky-50 px-2 py-0.2 rounded-full border border-sky-200">
                            {item.periodeBulan} {item.periodeTahun}
                          </span>
                          <span className="text-[10px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.2 rounded-full border border-emerald-200 flex items-center gap-1">
                            <CheckCircle2 className="w-2.5 h-2.5" />
                            {item.statusVerifikasi}
                          </span>
                        </div>

                        <h3 className="text-sm font-bold text-slate-900 mt-1 leading-snug">
                          {item.title}
                        </h3>
                      </div>
                    </div>
                  </div>

                  {/* Category & File Name */}
                  <div className="text-xs text-slate-500 space-y-1 mb-3">
                    <p className="flex items-center gap-1.5 text-slate-700 font-medium">
                      <Layers className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                      <span className="truncate">{item.kategoriLaporan}</span>
                    </p>
                    <p className="font-mono text-[11px] text-slate-500 truncate bg-slate-50 px-2 py-1 rounded-md border border-slate-200">
                      📄 {item.fileName} • {formatBytes(item.fileSize)}
                    </p>
                  </div>

                  {/* Summary Notes if present */}
                  {item.catatanRingkasan && (
                    <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/80 text-[11px] text-slate-600 line-clamp-2 mb-3">
                      {item.catatanRingkasan}
                    </div>
                  )}

                  {/* Quick stats tags if present */}
                  {(item.totalStrikeBulanIni !== undefined || 
                    item.totalPatroliBulanIni !== undefined ||
                    item.totalOccurrenceBulanIni !== undefined ||
                    item.totalSatwaBulanIni !== undefined) && (
                    <div className="flex flex-wrap items-center gap-1.5 mb-3 text-[10px]">
                      {item.totalStrikeBulanIni !== undefined && (
                        <span className="px-2 py-0.5 rounded bg-rose-50 border border-rose-200 text-rose-800 font-semibold font-mono">
                          Strike: {item.totalStrikeBulanIni} {item.strikeWithDamageBulanIni ? `(${item.strikeWithDamageBulanIni} damage)` : ''}
                        </span>
                      )}
                      {item.totalPatroliBulanIni !== undefined && (
                        <span className="px-2 py-0.5 rounded bg-sky-50 border border-sky-200 text-sky-800 font-semibold font-mono">
                          Patroli: {item.totalPatroliBulanIni}
                        </span>
                      )}
                      {item.totalOccurrenceBulanIni !== undefined && (
                        <span className="px-2 py-0.5 rounded bg-amber-50 border border-amber-200 text-amber-800 font-semibold font-mono">
                          Occurrence: {item.totalOccurrenceBulanIni}
                        </span>
                      )}
                      {item.totalSatwaBulanIni !== undefined && (
                        <span className="px-2 py-0.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-800 font-semibold font-mono">
                          Satwa: {item.totalSatwaBulanIni.toLocaleString('id-ID')} ekor
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Bottom Line: Metadata & Action Buttons */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <div className="text-[10px] text-slate-400">
                    <span>Oleh <strong>{item.uploadedBy}</strong></span>
                    <span className="mx-1">•</span>
                    <span>{new Date(item.uploadedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => setPreviewDoc(item)}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-sky-50 hover:text-sky-700 text-slate-700 text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
                      title="Lihat Pratinjau Dokumen"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Pratinjau</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDownload(item)}
                      className="px-2.5 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold flex items-center gap-1 transition shadow-sm cursor-pointer"
                      title="Unduh Berkas Asli"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Unduh</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteRequest(item)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                      title="Hapus Dokumen Arsip"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Preview Modal */}
      <MonthlyReportPreviewModal
        isOpen={Boolean(previewDoc)}
        onClose={() => setPreviewDoc(null)}
        document={previewDoc}
        onDownload={handleDownload}
      />

      {/* Delete Confirmation Dialog */}
      {docToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-3">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 text-center">
              Konfirmasi Penghapusan Dokumen Arsip
            </h3>
            <p className="text-xs text-slate-500 text-center mt-1.5">
              Apakah Anda yakin ingin menghapus berkas arsip <strong>"{docToDelete.title}"</strong> ({docToDelete.fileName})? Tindakan ini akan menghapus dokumen dari cloud database.
            </p>

            <div className="mt-5 flex items-center justify-end gap-2.5">
              <button
                onClick={() => setDocToDelete(null)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-semibold transition cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold transition flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Ya, Hapus Dokumen</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Admin Auth Modal for Delete */}
      <AdminAuthModal
        isOpen={isAdminAuthOpen}
        onClose={() => {
          setIsAdminAuthOpen(false);
          setPendingDeleteTarget(null);
        }}
        onSuccess={() => {
          setIsAdmin(true);
          if (pendingDeleteTarget) {
            setDocToDelete(pendingDeleteTarget);
            setPendingDeleteTarget(null);
          }
        }}
        title="Otorisasi Administrator WHU"
        description="Penghapusan arsip dokumen bulanan memerlukan otorisasi PIN / Sandi Administrator Wildlife Hazard Department Head."
      />
    </div>
  );
};
