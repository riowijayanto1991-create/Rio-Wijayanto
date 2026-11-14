import React, { useState, useMemo } from 'react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  ComposedChart,
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ReferenceLine, 
  ReferenceArea,
  Cell 
} from 'recharts';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  ShieldAlert, 
  Calendar, 
  Bird, 
  Plane, 
  Download, 
  Layers, 
  Sparkles, 
  Table, 
  Info, 
  CheckCircle2, 
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  CloudRain,
  ShieldCheck,
  FileSpreadsheet,
  Printer,
  Compass,
  ArrowUpRight,
  ArrowDownRight,
  Minus
} from 'lucide-react';
import { PatrolReport, OccurrenceReport, WildlifeStrikeReport, MonthlyReportDocument } from '../types';
import { 
  compileMultiYearWildlifeMetrics, 
  exportWildlifeAnalyticsToExcel, 
  MultiYearAnalyticsResult 
} from '../utils/wildlifeAnalyticsCalculator';
import { MonthlyWildlifeMetric, BirdSpeciesStats } from '../data/wildlifePopulationAnalyticsData';

interface WildlifeStrikePopulationDashboardProps {
  patrols: PatrolReport[];
  occurrences: OccurrenceReport[];
  strikes: WildlifeStrikeReport[];
  monthlyDocuments?: MonthlyReportDocument[];
  onNavigateToForm?: (type: 'patrol' | 'occurrence' | 'strike' | 'vehicle') => void;
  onOpenUploadMonthly?: () => void;
}

export const WildlifeStrikePopulationDashboard: React.FC<WildlifeStrikePopulationDashboardProps> = ({
  patrols,
  occurrences,
  strikes,
  monthlyDocuments = [],
  onNavigateToForm,
  onOpenUploadMonthly
}) => {
  // Navigation & View Modes
  const [activeTab, setActiveTab] = useState<'timeline' | 'comparison' | 'species' | 'summary'>('timeline');
  const [metricFilter, setMetricFilter] = useState<'all' | 'strikes' | 'occurrences' | 'birds' | 'damage'>('all');
  const [yearFilter, setYearFilter] = useState<'2026' | 'all' | '2025' | '2027'>('2026');
  const [showTargetLines, setShowTargetLines] = useState<boolean>(true);
  const [showDataTable, setShowDataTable] = useState<boolean>(false);
  const [selectedSpeciesRisk, setSelectedSpeciesRisk] = useState<string>('all');

  // Compile calculations with live database integration
  const analytics: MultiYearAnalyticsResult = useMemo(() => {
    return compileMultiYearWildlifeMetrics(strikes, occurrences, patrols, monthlyDocuments);
  }, [strikes, occurrences, patrols, monthlyDocuments]);

  // Filter timeline based on year filter
  const filteredTimeline = useMemo(() => {
    if (yearFilter === '2025') return analytics.data2025;
    if (yearFilter === '2026') return analytics.data2026;
    if (yearFilter === '2027') return analytics.data2027;
    // 'all' includes 2025 and 2026 (or 2027 if specified)
    return analytics.timelineData.filter(d => d.year <= 2026);
  }, [analytics, yearFilter]);

  // Filter species
  const filteredSpecies = useMemo(() => {
    if (selectedSpeciesRisk === 'all') return analytics.speciesStats;
    return analytics.speciesStats.filter(sp => sp.kategoriRisiko === selectedSpeciesRisk);
  }, [analytics.speciesStats, selectedSpeciesRisk]);

  // Comparison totals for cards
  const tot25 = analytics.yearlyTotals.year2025;
  const tot26 = analytics.yearlyTotals.year2026;
  const deltaStrikes = tot26.strikes - tot25.strikes;
  const pctStrikes = tot25.strikes > 0 ? Math.round((deltaStrikes / tot25.strikes) * 100) : 0;

  const deltaOccurrences = tot26.occurrences - tot25.occurrences;
  const pctOccurrences = tot25.occurrences > 0 ? Math.round((deltaOccurrences / tot25.occurrences) * 100) : 0;

  const deltaBirds = tot26.birds - tot25.birds;
  const pctBirds = tot25.birds > 0 ? Math.round((deltaBirds / tot25.birds) * 100) : 0;

  // Custom rich tooltip for Timeline Bar Chart
  const CustomTimelineTooltip = ({ active, payload }: any) => {
    if (!active || !payload || !payload.length) return null;
    const data: MonthlyWildlifeMetric = payload[0]?.payload;
    if (!data) return null;

    return (
      <div className="bg-slate-900/95 backdrop-blur-md text-white p-4 rounded-xl shadow-2xl border border-slate-700/90 text-xs min-w-[300px] max-w-sm z-50">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2">
          <div className="flex items-center gap-1.5 font-bold text-sm text-sky-400">
            <Calendar className="w-4 h-4" />
            <span>{data.monthName} {data.year}</span>
          </div>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
            data.season === 'migrasi' 
              ? 'bg-rose-950 text-rose-300 border border-rose-800' 
              : data.season === 'pancaroba' 
              ? 'bg-amber-950 text-amber-300 border border-amber-800' 
              : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
          }`}>
            {data.season === 'migrasi' ? 'Musim Migrasi (Tinggi)' : data.season === 'pancaroba' ? 'Pancaroba' : 'Kemarau'}
          </span>
        </div>

        <div className="space-y-2">
          {/* Strike count */}
          <div className="flex items-center justify-between bg-rose-950/40 border border-rose-900/40 p-2 rounded-lg">
            <span className="text-rose-200 font-medium flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
              Wildlife Strike:
            </span>
            <span className="font-mono font-bold text-white text-sm">
              {data.strikes} Kejadian
              {data.strikesWithDamage > 0 && (
                <span className="ml-1 text-xs text-rose-300 font-normal">({data.strikesWithDamage} Berdampak)</span>
              )}
            </span>
          </div>

          {/* Occurrence count */}
          <div className="flex items-center justify-between bg-amber-950/40 border border-amber-900/40 p-2 rounded-lg">
            <span className="text-amber-200 font-medium flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
              Wildlife Occurrence:
            </span>
            <span className="font-mono font-bold text-white text-sm">
              {data.occurrences} Kejadian
            </span>
          </div>

          {/* Bird Population */}
          <div className="flex items-center justify-between bg-emerald-950/40 border border-emerald-900/40 p-2 rounded-lg">
            <span className="text-emerald-200 font-medium flex items-center gap-1.5">
              <Bird className="w-3.5 h-3.5 text-emerald-400" />
              Populasi Burung Teramati:
            </span>
            <span className="font-mono font-bold text-emerald-300 text-sm">
              {data.totalBirdPopulation.toLocaleString('id-ID')} Ekor
            </span>
          </div>

          {/* Strike Rate */}
          <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 border-t border-slate-800 text-slate-300">
            <div>
              <span className="text-slate-400 block text-[10px]">Trafik Penerbangan:</span>
              <span className="font-mono font-medium">{data.aircraftMovements.toLocaleString('id-ID')} Mvt</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Strike Rate / 10k:</span>
              <span className={`font-mono font-bold ${data.strikeRatePer10kMovements <= 1.0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {data.strikeRatePer10kMovements} (Target &le; 1.0)
              </span>
            </div>
          </div>

          {/* Dominant Species */}
          <div className="text-[11px] pt-1 text-slate-300">
            <span className="text-slate-400">Spesies Burung Dominan:</span>{' '}
            <span className="font-semibold text-sky-300">{data.dominantSpecies}</span>
          </div>

          {/* Mitigation Guidance */}
          <div className="pt-2 border-t border-slate-800 text-[10px] text-slate-300">
            <span className="text-sky-400 font-bold block mb-0.5">SOP Mitigasi ICAO Doc 9137:</span>
            <span>{data.recommendedMitigation}</span>
          </div>
        </div>
      </div>
    );
  };

  // Custom tooltip for Species Chart
  const CustomSpeciesTooltip = ({ active, payload }: any) => {
    if (!active || !payload || !payload.length) return null;
    const data: BirdSpeciesStats = payload[0]?.payload;
    if (!data) return null;

    return (
      <div className="bg-slate-900/95 backdrop-blur-md text-white p-4 rounded-xl shadow-2xl border border-slate-700/90 text-xs min-w-[280px] max-w-xs z-50">
        <div className="border-b border-slate-800 pb-2 mb-2">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-sm text-sky-400">{data.namaIndonesia}</h4>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
              data.kategoriRisiko === 'KRITIS' ? 'bg-purple-900 text-purple-200' :
              data.kategoriRisiko === 'TINGGI' ? 'bg-rose-900 text-rose-200' :
              data.kategoriRisiko === 'SEDANG' ? 'bg-amber-900 text-amber-200' :
              'bg-emerald-900 text-emerald-200'
            }`}>
              Risiko {data.kategoriRisiko}
            </span>
          </div>
          <span className="text-[11px] text-slate-400 italic font-serif">{data.namaLatin}</span>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Populasi Teramati 2025:</span>
            <span className="font-mono font-bold text-white">{data.populasi2025.toLocaleString('id-ID')} ekor</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Populasi Teramati 2026:</span>
            <span className="font-mono font-bold text-emerald-300">{data.populasi2026.toLocaleString('id-ID')} ekor</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Riwayat Strike Terlibat:</span>
            <span className="font-mono font-bold text-rose-400">{data.strikes2025 + data.strikes2026} kali</span>
          </div>
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-400">Bobot Rata-rata:</span>
            <span className="font-mono">{data.bobotRataRataGram} gram</span>
          </div>
          <div className="text-[11px] pt-1.5 border-t border-slate-800 text-slate-300">
            <span className="text-slate-400 block text-[10px]">Habitat Sisi Udara:</span>
            <span>{data.habitatUtama}</span>
          </div>
          <div className="text-[10px] pt-1 border-t border-slate-800 text-slate-300">
            <span className="text-sky-300 font-semibold block">Tindakan Pengendalian:</span>
            <span>{data.deskripsiMitigasi}</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6" id="wildlife-strike-population-dashboard">
      {/* Top Banner Header */}
      <div className="bg-gradient-to-r from-slate-900 via-sky-950 to-indigo-950 text-white rounded-2xl p-5 border border-slate-800 shadow-xl flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 flex-wrap gap-y-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-sky-500/20 text-sky-300 border border-sky-500/30">
              WILDLIFE HAZARD ANALYTICS – KHUSUS TAHUN 2026
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
              <Bird className="w-3.5 h-3.5" />
              Monitoring Terpadu Tahun 2026 (Januari – Desember)
            </span>
            <span className="text-xs text-slate-400">ICAO Doc 9137 Part 3 &amp; KP 326</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white mt-1.5 flex items-center gap-2">
            Dashboard Grafik Batang Khusus Tahun 2026
          </h2>
          <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-3xl leading-relaxed">
            Visualisasi analitik grafik batang dikhususkan untuk Tahun 2026: Pemantauan bulanan Wildlife Strike, Occurrence, dan Populasi Burung Bandara Soekarno-Hatta (CGK) terintegrasi dengan data pelaporan dinas dan dokumen bulanan.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center flex-wrap gap-2.5 shrink-0 w-full lg:w-auto">
          <button
            onClick={() => exportWildlifeAnalyticsToExcel(analytics)}
            className="flex-1 sm:flex-initial px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition flex items-center justify-center gap-1.5 shadow-md cursor-pointer"
            title="Unduh seluruh data grafik batang, linimasa, dan populasi spesies ke Microsoft Excel (.xlsx)"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Export Excel (.xlsx)</span>
          </button>

          <button
            onClick={() => window.print()}
            className="flex-1 sm:flex-initial px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition flex items-center justify-center gap-1.5 cursor-pointer"
            title="Cetak visualisasi grafik atau simpan sebagai dokumen PDF"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak Visual</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Row (2025 vs 2026 dst Highlights) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Wildlife Strike */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Wildlife Strike
            </span>
            <div className={`p-2 rounded-lg ${deltaStrikes < 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2">
            <div className="flex items-baseline space-x-2">
              <span className="text-2xl font-bold text-slate-900 font-mono">{tot26.strikes}</span>
              <span className="text-xs text-slate-500">Strike (2026)</span>
              <span className="text-xs text-slate-400 ml-auto">vs {tot25.strikes} (2025)</span>
            </div>
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 text-xs">
              <span className={`font-semibold font-mono flex items-center gap-1 ${
                deltaStrikes < 0 ? 'text-emerald-600' : 'text-rose-600'
              }`}>
                {deltaStrikes < 0 ? <ArrowDownRight className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                {deltaStrikes > 0 ? `+${deltaStrikes}` : deltaStrikes} ({pctStrikes > 0 ? `+${pctStrikes}%` : `${pctStrikes}%`})
              </span>
              <span className="text-[10px] text-slate-400">
                {deltaStrikes < 0 ? 'Penurunan Risiko Signifikan' : 'Kenaikan Risiko'}
              </span>
            </div>
          </div>
        </div>

        {/* KPI 2: Wildlife Occurrence */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Wildlife Occurrence
            </span>
            <div className="p-2 rounded-lg bg-amber-50 text-amber-600">
              <ShieldAlert className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2">
            <div className="flex items-baseline space-x-2">
              <span className="text-2xl font-bold text-slate-900 font-mono">{tot26.occurrences}</span>
              <span className="text-xs text-slate-500">Kasus (2026)</span>
              <span className="text-xs text-slate-400 ml-auto">vs {tot25.occurrences} (2025)</span>
            </div>
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 text-xs">
              <span className={`font-semibold font-mono flex items-center gap-1 ${
                deltaOccurrences < 0 ? 'text-emerald-600' : 'text-amber-600'
              }`}>
                {deltaOccurrences < 0 ? <ArrowDownRight className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                {deltaOccurrences > 0 ? `+${deltaOccurrences}` : deltaOccurrences} ({pctOccurrences > 0 ? `+${pctOccurrences}%` : `${pctOccurrences}%`})
              </span>
              <span className="text-[10px] text-slate-400">Deteksi Dini Lapangan</span>
            </div>
          </div>
        </div>

        {/* KPI 3: Populasi Burung Teramati */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Populasi Burung Teramati
            </span>
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
              <Bird className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2">
            <div className="flex items-baseline space-x-2">
              <span className="text-2xl font-bold text-emerald-700 font-mono">
                {tot26.birds.toLocaleString('id-ID')}
              </span>
              <span className="text-xs text-slate-500">Ekor (2026)</span>
              <span className="text-xs text-slate-400 ml-auto">vs {tot25.birds.toLocaleString('id-ID')} (2025)</span>
            </div>
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 text-xs">
              <span className={`font-semibold font-mono flex items-center gap-1 ${
                deltaBirds < 0 ? 'text-emerald-600' : 'text-rose-600'
              }`}>
                {deltaBirds < 0 ? <ArrowDownRight className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                {deltaBirds > 0 ? `+${deltaBirds}` : deltaBirds} ({pctBirds > 0 ? `+${pctBirds}%` : `${pctBirds}%`})
              </span>
              <span className="text-[10px] text-slate-400">Tekanan Habitat Berkurang</span>
            </div>
          </div>
        </div>

        {/* KPI 4: Strike Rate per 10k Pergerakan */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Strike Rate / 10k Pergerakan
            </span>
            <div className="p-2 rounded-lg bg-sky-50 text-sky-600">
              <Plane className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2">
            <div className="flex items-baseline space-x-2">
              <span className={`text-2xl font-bold font-mono ${
                tot26.strikeRate <= 1.0 ? 'text-emerald-600' : 'text-amber-600'
              }`}>
                {tot26.strikeRate}
              </span>
              <span className="text-xs text-slate-500">Rate (2026)</span>
              <span className="text-xs text-slate-400 ml-auto">vs {tot25.strikeRate} (2025)</span>
            </div>
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 text-xs">
              <span className="text-emerald-700 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Target ICAO &le; 1.0 Tercapai
              </span>
              <span className="text-[10px] text-slate-400">KPI Bandara</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Bar Chart Container */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Navigation Tabs for Chart View */}
        <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50/50 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-1.5 bg-slate-200/80 p-1 rounded-xl text-xs flex-wrap">
            <button
              onClick={() => setActiveTab('timeline')}
              className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'timeline'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5 text-rose-600" />
              <span>Grafik Batang Bulanan Tahun 2026</span>
            </button>

            <button
              onClick={() => setActiveTab('comparison')}
              className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'comparison'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-sky-600" />
              <span>Komparasi 2026 vs Historis</span>
            </button>

            <button
              onClick={() => setActiveTab('species')}
              className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'species'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Bird className="w-3.5 h-3.5 text-emerald-600" />
              <span>Populasi Spesies Burung 2026</span>
            </button>

            <button
              onClick={() => setActiveTab('summary')}
              className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'summary'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5 text-indigo-600" />
              <span>Rekapitulasi Evaluasi 2026</span>
            </button>
          </div>

          {/* Filtering Controls */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Year Selector (for timeline) */}
            {activeTab === 'timeline' && (
              <div className="flex items-center space-x-1.5 bg-white px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs shadow-2xs">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                <span className="text-slate-500 font-medium">Periode:</span>
                <select
                  value={yearFilter}
                  onChange={(e) => setYearFilter(e.target.value as any)}
                  className="bg-transparent text-slate-800 font-bold focus:outline-hidden cursor-pointer"
                >
                  <option value="2026">Tahun 2026 Saja (Dikhususkan)</option>
                  <option value="all">Linimasa 2025 - 2026</option>
                  <option value="2025">Tahun 2025 Saja</option>
                  <option value="2027">Tahun 2027 (Proyeksi Target)</option>
                </select>
              </div>
            )}

            {/* Metric Selector (for timeline / comparison) */}
            {(activeTab === 'timeline' || activeTab === 'comparison') && (
              <div className="flex items-center space-x-1.5 bg-white px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs shadow-2xs">
                <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
                <span className="text-slate-500 font-medium">Metrik:</span>
                <select
                  value={metricFilter}
                  onChange={(e) => setMetricFilter(e.target.value as any)}
                  className="bg-transparent text-slate-800 font-bold focus:outline-hidden cursor-pointer"
                >
                  <option value="all">Semua Metrik (Strike, Occ, Burung)</option>
                  <option value="strikes">Wildlife Strike Saja</option>
                  <option value="occurrences">Occurrence Saja</option>
                  <option value="birds">Populasi Burung Saja</option>
                  <option value="damage">Dampak Kerusakan Pesawat</option>
                </select>
              </div>
            )}

            {/* Species Risk Filter (for species tab) */}
            {activeTab === 'species' && (
              <div className="flex items-center space-x-1.5 bg-white px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs shadow-2xs">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                <span className="text-slate-500 font-medium">Tingkat Risiko:</span>
                <select
                  value={selectedSpeciesRisk}
                  onChange={(e) => setSelectedSpeciesRisk(e.target.value)}
                  className="bg-transparent text-slate-800 font-bold focus:outline-hidden cursor-pointer"
                >
                  <option value="all">Semua Spesies (10 Spesies Utama)</option>
                  <option value="KRITIS">Kritis (Raptor/Elang)</option>
                  <option value="TINGGI">Tinggi (Kuntul, Blekok, Camar)</option>
                  <option value="SEDANG">Sedang (Layang-layang, Walet, Tekukur)</option>
                  <option value="RENDAH">Rendah (Pipit)</option>
                </select>
              </div>
            )}

            {/* Target line toggle */}
            <button
              onClick={() => setShowTargetLines(prev => !prev)}
              className={`px-2.5 py-1.5 rounded-xl border text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 shadow-2xs ${
                showTargetLines
                  ? 'bg-teal-50 border-teal-300 text-teal-800'
                  : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>{showTargetLines ? '✓ Target ICAO Aktif' : 'Garis Target ICAO'}</span>
            </button>

            {/* Data table toggle */}
            <button
              onClick={() => setShowDataTable(prev => !prev)}
              className="px-2.5 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-1 shadow-2xs"
            >
              <Table className="w-3.5 h-3.5 text-slate-500" />
              <span>Matriks Data</span>
              {showDataTable ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
          </div>
        </div>

        {/* Chart View Content */}
        <div className="p-5">
          {/* TAB 1: Continuous Timeline Bar Chart (2025 - 2026 dst) */}
          {activeTab === 'timeline' && (
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm sm:text-base flex items-center gap-2">
                    <span>
                      {yearFilter === '2026' 
                        ? 'Grafik Batang Bulanan Khusus Tahun 2026 (Januari – Desember)' 
                        : yearFilter === 'all' 
                        ? 'Grafik Batang Linimasa Sepanjang Tahun 2025 - 2026' 
                        : `Grafik Batang Linimasa Tahun ${yearFilter}`}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                      {filteredTimeline.length} Bulan Terpapar
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Monitoring fluktuasi bulanan Wildlife Strike (batang merah/biru), Occurrence (batang kuning/oranye), dan Populasi Burung (batang hijau) dikhususkan untuk Tahun {yearFilter === 'all' ? '2025 - 2026' : yearFilter}.
                  </p>
                </div>

                <div className="flex items-center gap-3 text-xs text-slate-600">
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-xs bg-rose-600 inline-block"></span>
                    <span>Strike</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-xs bg-amber-500 inline-block"></span>
                    <span>Occurrence</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-xs bg-emerald-600 inline-block"></span>
                    <span>Populasi Burung (x100)</span>
                  </span>
                </div>
              </div>

              {/* Responsive Bar Chart Canvas */}
              <div className="h-80 sm:h-96 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart 
                    data={filteredTimeline.map(d => ({
                      ...d,
                      // Scaled bird population for balanced dual display on same chart if metric is 'all'
                      birdsScaled: Number((d.totalBirdPopulation / 100).toFixed(1))
                    }))} 
                    margin={{ top: 15, right: 25, left: -5, bottom: 25 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis 
                      dataKey="label" 
                      tickLine={false} 
                      axisLine={{ stroke: '#cbd5e1' }}
                      tick={{ fontSize: 10, fill: '#475569', fontWeight: 600 }}
                      angle={-35}
                      textAnchor="end"
                      height={45}
                    />
                    <YAxis 
                      yAxisId="left"
                      allowDecimals={false}
                      tickLine={false} 
                      axisLine={false}
                      tick={{ fontSize: 11, fill: '#64748b' }}
                    />
                    <YAxis 
                      yAxisId="right"
                      orientation="right"
                      tickLine={false} 
                      axisLine={false}
                      tick={{ fontSize: 10, fill: '#059669' }}
                      unit=" ekor"
                      tickFormatter={(v) => `${v}`}
                    />
                    <Tooltip content={<CustomTimelineTooltip />} />
                    <Legend 
                      verticalAlign="top" 
                      height={36} 
                      formatter={(value) => <span className="text-xs text-slate-700 font-semibold">{value}</span>}
                    />

                    {/* Migration Season Background Shading */}
                    {yearFilter === '2026' ? (
                      <>
                        <ReferenceArea 
                          {...({ 
                            yAxisId: 'left', 
                            x1: 'Jan 2026', 
                            x2: 'Feb 2026', 
                            fill: '#fee2e2', 
                            fillOpacity: 0.35 
                          } as any)} 
                        />
                        <ReferenceArea 
                          {...({ 
                            yAxisId: 'left', 
                            x1: 'Nov 2026', 
                            x2: 'Des 2026', 
                            fill: '#fee2e2', 
                            fillOpacity: 0.35 
                          } as any)} 
                        />
                      </>
                    ) : (
                      <ReferenceArea 
                        {...({ 
                          yAxisId: 'left', 
                          x1: 'Nov 2025', 
                          x2: 'Feb 2026', 
                          fill: '#fee2e2', 
                          fillOpacity: 0.35 
                        } as any)} 
                      />
                    )}

                    {/* Bars based on metric filter */}
                    {(metricFilter === 'all' || metricFilter === 'strikes') && (
                      <Bar 
                        yAxisId="left"
                        dataKey="strikes" 
                        name="Wildlife Strike (Kasus)" 
                        fill="#e11d48" 
                        radius={[4, 4, 0, 0]}
                        maxBarSize={22}
                      >
                        {filteredTimeline.map((entry, index) => (
                          <Cell 
                            key={`cell-strike-${index}`} 
                            fill={entry.year === 2025 ? '#dc2626' : entry.year === 2026 ? '#0284c7' : '#8b5cf6'} 
                          />
                        ))}
                      </Bar>
                    )}

                    {(metricFilter === 'all' || metricFilter === 'occurrences') && (
                      <Bar 
                        yAxisId="left"
                        dataKey="occurrences" 
                        name="Wildlife Occurrence (Kasus)" 
                        fill="#f59e0b" 
                        radius={[4, 4, 0, 0]}
                        maxBarSize={22}
                      />
                    )}

                    {metricFilter === 'all' && (
                      <Bar 
                        yAxisId="left"
                        dataKey="birdsScaled" 
                        name="Populasi Burung (/100 Ekor)" 
                        fill="#10b981" 
                        radius={[4, 4, 0, 0]}
                        maxBarSize={22}
                      />
                    )}

                    {metricFilter === 'birds' && (
                      <Bar 
                        yAxisId="right"
                        dataKey="totalBirdPopulation" 
                        name="Populasi Burung Teramati (Ekor)" 
                        fill="#059669" 
                        radius={[4, 4, 0, 0]}
                        maxBarSize={32}
                      />
                    )}

                    {metricFilter === 'damage' && (
                      <>
                        <Bar 
                          yAxisId="left"
                          dataKey="strikesWithDamage" 
                          name="Ada Kerusakan Pesawat (Substantial Damage)" 
                          fill="#b91c1c" 
                          radius={[4, 4, 0, 0]}
                          maxBarSize={26}
                        />
                        <Bar 
                          yAxisId="left"
                          dataKey="strikesNoDamage" 
                          name="Tanpa Kerusakan (Nil Damage)" 
                          fill="#38bdf8" 
                          radius={[4, 4, 0, 0]}
                          maxBarSize={26}
                        />
                      </>
                    )}

                    {/* Strike Rate Reference Line */}
                    {showTargetLines && (
                      <ReferenceLine 
                        yAxisId="left" 
                        y={3} 
                        stroke="#0d9488" 
                        strokeDasharray="4 4" 
                        label={{ value: 'Batas Toleransi Bulanan (Maks 3 Strike)', position: 'insideTopRight', fill: '#0d9488', fontSize: 10, fontWeight: 'bold' }}
                      />
                    )}
                  </ComposedChart>
                </ResponsiveContainer>
              </div>

              {/* Informative Season Guidance */}
              <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Info className="w-4 h-4 text-sky-600 shrink-0" />
                  <span>
                    <strong>Pola Dinamika Musiman:</strong> Lonjakan strike &amp; occurrence selalu berkorelasi langsung dengan lonjakan populasi burung air saat Musim Migrasi EAAF (November – Februari).
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="inline-block w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                  <span className="text-[11px] font-semibold text-rose-900">Arsir Merah: Puncak Migrasi EAAF</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Side-by-Side Monthly Comparison Bar Chart (2025 vs 2026 dst) */}
          {activeTab === 'comparison' && (
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm sm:text-base flex items-center gap-2">
                    <span>Komparasi Berdampingan Bulan ke Bulan (Tahun 2025 vs 2026 vs 2027)</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-100 text-sky-800">
                      12 Bulan Standar
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Membandingkan performa setiap bulan secara langsung antara Tahun 2025 (Abu-abu/Merah), 2026 (Biru), dan Target 2027 (Ungu).
                  </p>
                </div>
              </div>

              {/* Comparison Bar Chart */}
              <div className="h-80 sm:h-96 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics.comparisonByMonth} margin={{ top: 15, right: 20, left: -5, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis 
                      dataKey="monthShort" 
                      tickLine={false} 
                      axisLine={{ stroke: '#cbd5e1' }}
                      tick={{ fontSize: 11, fill: '#475569', fontWeight: 600 }}
                    />
                    <YAxis 
                      allowDecimals={false}
                      tickLine={false} 
                      axisLine={false}
                      tick={{ fontSize: 11, fill: '#64748b' }}
                    />
                    <Tooltip 
                      formatter={(val: any, name: any) => [`${val}`, `${name}`]}
                      labelFormatter={(label) => `Bulan ${label}`}
                    />
                    <Legend verticalAlign="top" height={36} />

                    {metricFilter === 'all' || metricFilter === 'strikes' ? (
                      <>
                        <Bar 
                          dataKey="strikes2025" 
                          name="Strike Tahun 2025 (Historis)" 
                          fill="#94a3b8" 
                          radius={[4, 4, 0, 0]}
                          maxBarSize={22}
                        />
                        <Bar 
                          dataKey="strikes2026" 
                          name="Strike Tahun 2026 (Aktif)" 
                          fill="#0284c7" 
                          radius={[4, 4, 0, 0]}
                          maxBarSize={22}
                        />
                        <Bar 
                          dataKey="strikes2027" 
                          name="Target Strike 2027 (ICAO SPI)" 
                          fill="#8b5cf6" 
                          radius={[4, 4, 0, 0]}
                          maxBarSize={22}
                        />
                      </>
                    ) : metricFilter === 'occurrences' ? (
                      <>
                        <Bar 
                          dataKey="occurrences2025" 
                          name="Occurrence 2025" 
                          fill="#cbd5e1" 
                          radius={[4, 4, 0, 0]}
                          maxBarSize={22}
                        />
                        <Bar 
                          dataKey="occurrences2026" 
                          name="Occurrence 2026" 
                          fill="#f59e0b" 
                          radius={[4, 4, 0, 0]}
                          maxBarSize={22}
                        />
                        <Bar 
                          dataKey="occurrences2027" 
                          name="Target Occurrence 2027" 
                          fill="#d97706" 
                          radius={[4, 4, 0, 0]}
                          maxBarSize={22}
                        />
                      </>
                    ) : metricFilter === 'birds' ? (
                      <>
                        <Bar 
                          dataKey="birds2025" 
                          name="Populasi Burung 2025 (Ekor)" 
                          fill="#94a3b8" 
                          radius={[4, 4, 0, 0]}
                          maxBarSize={22}
                        />
                        <Bar 
                          dataKey="birds2026" 
                          name="Populasi Burung 2026 (Ekor)" 
                          fill="#10b981" 
                          radius={[4, 4, 0, 0]}
                          maxBarSize={22}
                        />
                        <Bar 
                          dataKey="birds2027" 
                          name="Target Populasi Burung 2027" 
                          fill="#059669" 
                          radius={[4, 4, 0, 0]}
                          maxBarSize={22}
                        />
                      </>
                    ) : (
                      <>
                        <Bar 
                          dataKey="damage2025" 
                          name="Kerusakan Pesawat 2025" 
                          fill="#ef4444" 
                          radius={[4, 4, 0, 0]}
                          maxBarSize={24}
                        />
                        <Bar 
                          dataKey="damage2026" 
                          name="Kerusakan Pesawat 2026" 
                          fill="#f97316" 
                          radius={[4, 4, 0, 0]}
                          maxBarSize={24}
                        />
                      </>
                    )}
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Key Monthly Delta Badges */}
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2 mt-4">
                {analytics.comparisonByMonth.slice(0, 6).map((m) => (
                  <div key={m.monthIndex} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs">
                    <div className="flex items-center justify-between font-bold text-slate-800">
                      <span>{m.monthName}</span>
                      <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded font-bold ${
                        m.deltaStrikes26vs25 < 0 ? 'bg-emerald-100 text-emerald-800' : m.deltaStrikes26vs25 > 0 ? 'bg-rose-100 text-rose-800' : 'bg-slate-200 text-slate-700'
                      }`}>
                        {m.deltaStrikes26vs25 < 0 ? `${m.deltaStrikes26vs25}` : m.deltaStrikes26vs25 > 0 ? `+${m.deltaStrikes26vs25}` : '0'} Strike
                      </span>
                    </div>
                    <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500 font-mono">
                      <span>25: {m.strikes2025}</span>
                      <span>&rarr;</span>
                      <span className="font-bold text-slate-900">26: {m.strikes2026}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: Bird Population by Species Bar Chart */}
          {activeTab === 'species' && (
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm sm:text-base flex items-center gap-2">
                    <span>Grafik Batang Populasi per Spesies Burung Tahun 2026</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                      {filteredSpecies.length} Spesies Ditampilkan
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Distribusi jumlah ekor satwa teramati dari patroli harian WHU dan sensus periodik runway dikhususkan untuk Tahun 2026.
                  </p>
                </div>
              </div>

              {/* Species Bar Chart */}
              <div className="h-84 sm:h-104 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart 
                    data={filteredSpecies} 
                    layout="vertical"
                    margin={{ top: 10, right: 30, left: 70, bottom: 10 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                    <XAxis 
                      type="number" 
                      tickLine={false} 
                      axisLine={{ stroke: '#cbd5e1' }}
                      tick={{ fontSize: 10, fill: '#64748b' }}
                      unit=" ekor"
                    />
                    <YAxis 
                      type="category" 
                      dataKey="namaIndonesia" 
                      tickLine={false} 
                      axisLine={false}
                      tick={{ fontSize: 11, fill: '#1e293b', fontWeight: 600 }}
                      width={120}
                    />
                    <Tooltip content={<CustomSpeciesTooltip />} />
                    <Legend verticalAlign="top" height={36} />

                    <Bar 
                      dataKey="populasi2026" 
                      name="Populasi Tahun 2026 (Khusus 2026)" 
                      fill="#10b981" 
                      radius={[0, 4, 4, 0]}
                      maxBarSize={18}
                    />
                    <Bar 
                      dataKey="populasi2025" 
                      name="Populasi Tahun 2025 (Historis)" 
                      fill="#94a3b8" 
                      radius={[0, 4, 4, 0]}
                      maxBarSize={14}
                    />
                    <Bar 
                      dataKey="populasi2027" 
                      name="Proyeksi Tahun 2027 (Target ICAO)" 
                      fill="#0284c7" 
                      radius={[0, 4, 4, 0]}
                      maxBarSize={14}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Species Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mt-4">
                {filteredSpecies.slice(0, 6).map((sp) => (
                  <div key={sp.id} className="p-3.5 rounded-xl border border-slate-200 bg-white hover:border-emerald-300 transition shadow-2xs">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-bold text-xs sm:text-sm text-slate-900">{sp.namaIndonesia}</h4>
                        <p className="text-[10px] text-slate-500 italic">{sp.namaLatin}</p>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                        sp.kategoriRisiko === 'KRITIS' ? 'bg-purple-100 text-purple-800' :
                        sp.kategoriRisiko === 'TINGGI' ? 'bg-rose-100 text-rose-800' :
                        sp.kategoriRisiko === 'SEDANG' ? 'bg-amber-100 text-amber-800' :
                        'bg-emerald-100 text-emerald-800'
                      }`}>
                        {sp.kategoriRisiko}
                      </span>
                    </div>

                    <div className="mt-2.5 flex items-center justify-between text-xs font-mono">
                      <div className="text-slate-500">
                        Populasi '25: <span className="text-slate-900 font-bold">{sp.populasi2025.toLocaleString('id-ID')}</span>
                      </div>
                      <div className="text-emerald-700 font-bold">
                        '26: <span>{sp.populasi2026.toLocaleString('id-ID')} ekor</span>
                      </div>
                    </div>

                    <p className="text-[10px] text-slate-600 mt-2 line-clamp-2 leading-relaxed border-t border-slate-100 pt-1.5">
                      <strong className="text-slate-700">Mitigasi:</strong> {sp.deskripsiMitigasi}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: Yearly Summary Aggregate Bar Chart */}
          {activeTab === 'summary' && (
            <div>
              <div className="mb-4">
                <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                  Rekapitulasi Agregat Tahunan: 2025 vs 2026 vs 2027 (dst)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Perbandingan total performa manajemen wildlife hazard antar-tahun dalam memenuhi target ICAO Doc 9137.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Year 2025 Summary */}
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-500 uppercase">Tahun 2025 (Historis)</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-200 text-slate-800">Baseline</span>
                  </div>
                  <div className="mt-3 space-y-2 font-mono text-xs">
                    <div className="flex justify-between py-1 border-b border-slate-200">
                      <span className="text-slate-600">Total Strike:</span>
                      <span className="font-bold text-rose-700">{tot25.strikes} Kejadian</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-200">
                      <span className="text-slate-600">Strike Berdampak Kerusakan:</span>
                      <span className="font-bold text-rose-700">{tot25.damage} Kasus</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-200">
                      <span className="text-slate-600">Total Occurrence:</span>
                      <span className="font-bold text-amber-700">{tot25.occurrences} Kejadian</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-200">
                      <span className="text-slate-600">Populasi Burung Teramati:</span>
                      <span className="font-bold text-emerald-700">{tot25.birds.toLocaleString('id-ID')} Ekor</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-slate-600">Strike Rate / 10k:</span>
                      <span className="font-bold text-slate-900">{tot25.strikeRate}</span>
                    </div>
                  </div>
                </div>

                {/* Year 2026 Summary */}
                <div className="p-4 rounded-xl border-2 border-sky-400 bg-sky-50/40 relative shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-sky-900 uppercase">Tahun 2026 (Tahun Berjalan)</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-sky-600 text-white">Aktif</span>
                  </div>
                  <div className="mt-3 space-y-2 font-mono text-xs">
                    <div className="flex justify-between py-1 border-b border-sky-200">
                      <span className="text-sky-950">Total Strike:</span>
                      <span className="font-bold text-sky-900">{tot26.strikes} Kejadian ({pctStrikes}%)</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-sky-200">
                      <span className="text-sky-950">Strike Berdampak Kerusakan:</span>
                      <span className="font-bold text-sky-900">{tot26.damage} Kasus</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-sky-200">
                      <span className="text-sky-950">Total Occurrence:</span>
                      <span className="font-bold text-amber-800">{tot26.occurrences} Kejadian ({pctOccurrences}%)</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-sky-200">
                      <span className="text-sky-950">Populasi Burung Teramati:</span>
                      <span className="font-bold text-emerald-700">{tot26.birds.toLocaleString('id-ID')} Ekor ({pctBirds}%)</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-sky-950">Strike Rate / 10k:</span>
                      <span className="font-bold text-emerald-600">{tot26.strikeRate} (Memenuhi SPI)</span>
                    </div>
                  </div>
                </div>

                {/* Year 2027 Summary */}
                <div className="p-4 rounded-xl border border-purple-200 bg-purple-50/40">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-purple-900 uppercase">Tahun 2027 (Target ICAO SPI)</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-200 text-purple-900">Proyeksi</span>
                  </div>
                  <div className="mt-3 space-y-2 font-mono text-xs">
                    <div className="flex justify-between py-1 border-b border-purple-200">
                      <span className="text-purple-900">Target Strike:</span>
                      <span className="font-bold text-purple-800">&le; {analytics.yearlyTotals.year2027.strikes} Kejadian</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-purple-200">
                      <span className="text-purple-900">Target Kerusakan Pesawat:</span>
                      <span className="font-bold text-emerald-700">&le; 1 Kasus</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-purple-200">
                      <span className="text-purple-900">Target Occurrence:</span>
                      <span className="font-bold text-purple-800">&le; {analytics.yearlyTotals.year2027.occurrences} Kejadian</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-purple-200">
                      <span className="text-purple-900">Target Populasi Burung:</span>
                      <span className="font-bold text-emerald-700">&le; {analytics.yearlyTotals.year2027.birds.toLocaleString('id-ID')} Ekor</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-purple-900">Target Strike Rate / 10k:</span>
                      <span className="font-bold text-purple-800">&le; {analytics.yearlyTotals.year2027.strikeRate}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Expandable Data Table */}
          {showDataTable && (
            <div className="mt-6 pt-5 border-t border-slate-200 animate-in fade-in duration-200">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-bold text-xs sm:text-sm text-slate-900 flex items-center gap-2">
                  <Table className="w-4 h-4 text-sky-600" />
                  <span>Matriks Data Tabular Lengkap Sepanjang Periode 2025 - 2026 dst</span>
                </h4>
                <span className="text-xs text-slate-500 font-mono">
                  {filteredTimeline.length} Baris Data
                </span>
              </div>

              <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-2xs">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-semibold">
                      <th className="py-2.5 px-3">Periode</th>
                      <th className="py-2.5 px-2.5 text-center">Tahun</th>
                      <th className="py-2.5 px-3 text-center">Strike</th>
                      <th className="py-2.5 px-3 text-center">Kerusakan</th>
                      <th className="py-2.5 px-3 text-center">Occurrence</th>
                      <th className="py-2.5 px-3 text-center">Populasi Burung</th>
                      <th className="py-2.5 px-3 text-center">Trafik Pesawat</th>
                      <th className="py-2.5 px-3 text-center">Rate / 10k</th>
                      <th className="py-2.5 px-3">Spesies Dominan</th>
                      <th className="py-2.5 px-3">Musim</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {filteredTimeline.map((row) => (
                      <tr key={row.periodKey} className="hover:bg-slate-50/80 transition">
                        <td className="py-2 px-3 font-semibold text-slate-900 whitespace-nowrap">
                          {row.monthName}
                        </td>
                        <td className="py-2 px-2.5 text-center font-mono font-bold text-slate-800">
                          {row.year}
                        </td>
                        <td className="py-2 px-3 text-center font-mono font-bold text-rose-600">
                          {row.strikes}
                        </td>
                        <td className="py-2 px-3 text-center font-mono">
                          {row.strikesWithDamage > 0 ? (
                            <span className="text-rose-700 font-bold">{row.strikesWithDamage} Ada</span>
                          ) : (
                            <span className="text-slate-400">Nihil</span>
                          )}
                        </td>
                        <td className="py-2 px-3 text-center font-mono text-amber-700 font-semibold">
                          {row.occurrences}
                        </td>
                        <td className="py-2 px-3 text-center font-mono font-bold text-emerald-700">
                          {row.totalBirdPopulation.toLocaleString('id-ID')}
                        </td>
                        <td className="py-2 px-3 text-center font-mono text-slate-600">
                          {row.aircraftMovements.toLocaleString('id-ID')}
                        </td>
                        <td className="py-2 px-3 text-center font-mono">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            row.strikeRatePer10kMovements <= 1.0 
                              ? 'bg-emerald-100 text-emerald-800' 
                              : 'bg-rose-100 text-rose-800'
                          }`}>
                            {row.strikeRatePer10kMovements}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-slate-800 font-medium">
                          {row.dominantSpecies}
                        </td>
                        <td className="py-2 px-3 text-[11px] text-slate-600 whitespace-nowrap">
                          {row.season === 'migrasi' && (
                            <span className="text-rose-700 font-semibold">Musim Migrasi</span>
                          )}
                          {row.season === 'pancaroba' && (
                            <span className="text-amber-700 font-semibold">Pancaroba</span>
                          )}
                          {row.season === 'kemarau' && (
                            <span className="text-emerald-700 font-semibold">Kemarau</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
