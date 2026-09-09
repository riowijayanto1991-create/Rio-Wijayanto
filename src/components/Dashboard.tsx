import React from 'react';
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
  Search
} from 'lucide-react';
import { PatrolReport, OccurrenceReport, WildlifeStrikeReport } from '../types';
import { AirsideRunwayMap } from './AirsideRunwayMap';
import { exportPatrolPDF, exportOccurrencePDF, exportStrikePDF } from '../utils/pdfExport';
import { exportSinglePatrolToExcel } from '../utils/excelExport';

interface DashboardProps {
  patrols: PatrolReport[];
  occurrences: OccurrenceReport[];
  strikes: WildlifeStrikeReport[];
  onNavigateToForm: (type: 'patrol' | 'occurrence' | 'strike') => void;
  onPreviewReport: (type: 'patrol' | 'occurrence' | 'strike', id: string) => void;
  onOpenBroadcast: (type: 'PATROL' | 'OCCURRENCE' | 'STRIKE', report: any) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  patrols,
  occurrences,
  strikes,
  onNavigateToForm,
  onPreviewReport,
  onOpenBroadcast
}) => {
  const totalPatrols = patrols.length;
  const totalOccurrences = occurrences.length;
  const totalStrikes = strikes.length;
  const totalSatwaObserved = patrols.reduce((acc, p) => acc + p.totalPopulasiTeramati, 0);
  const strikeWithDamage = strikes.filter(s => s.indikasiKerusakan === 'Ada').length;

  // Species distribution aggregation
  const speciesMap: Record<string, number> = {};
  patrols.forEach(p => {
    p.temuanSatwa.forEach(s => {
      speciesMap[s.spesies] = (speciesMap[s.spesies] || 0) + s.jumlah;
    });
  });
  const topSpecies = Object.entries(speciesMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Action Buttons */}
      <div className="bg-gradient-to-r from-slate-900 via-sky-950 to-slate-900 p-5 rounded-2xl border border-slate-800 text-white shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-500/20 text-sky-300 border border-sky-500/30">
              OPERATIONAL COMMAND CENTER
            </span>
            <span className="text-xs text-slate-400">ICAO Doc 9137 Part 3 &amp; KP 326</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white mt-1">
            Monitoring &amp; Pelaporan Wildlife Hazard Management
          </h2>
          <p className="text-slate-300 text-xs sm:text-sm mt-0.5 max-w-2xl">
            Sistem terintegrasi mitigasi resiko tabrakan satwa liar, monitoring habitat bandara real-time, pencatatan patroli harian, dan notifikasi cepat manajemen.
          </p>
        </div>

        {/* Action Shortcuts */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => onNavigateToForm('patrol')}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-medium text-xs shadow transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Input Patroli Harian</span>
          </button>

          <button
            onClick={() => onNavigateToForm('occurrence')}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-medium text-xs shadow transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Lapor Occurrence</span>
          </button>

          <button
            onClick={() => onNavigateToForm('strike')}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-lg bg-rose-700 hover:bg-rose-600 text-white font-medium text-xs shadow transition cursor-pointer"
          >
            <AlertTriangle className="w-4 h-4" />
            <span>Lapor Wildlife Strike</span>
          </button>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Patroli Harian */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Patroli / Inspeksi</span>
            <div className="p-2 rounded-lg bg-sky-50 text-sky-600">
              <FileText className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2">
            <div className="flex items-baseline space-x-2">
              <span className="text-2xl font-bold text-slate-900">{totalPatrols}</span>
              <span className="text-xs text-slate-500">Laporan Shift</span>
            </div>
            <p className="text-xs text-emerald-600 font-medium mt-1 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              100% Perimeter Terinspeksi
            </p>
          </div>
        </div>

        {/* Card 2: Laporan Occurrence */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Laporan Occurrence</span>
            <div className="p-2 rounded-lg bg-amber-50 text-amber-600">
              <ShieldAlert className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2">
            <div className="flex items-baseline space-x-2">
              <span className="text-2xl font-bold text-slate-900">{totalOccurrences}</span>
              <span className="text-xs text-slate-500">Kejadian Airside</span>
            </div>
            <p className="text-xs text-amber-600 font-medium mt-1">
              {occurrences.filter(o => o.status === 'Selesai').length} Selesai diusir / ditangani
            </p>
          </div>
        </div>

        {/* Card 3: Wildlife Strike */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Wildlife Strike</span>
            <div className="p-2 rounded-lg bg-rose-50 text-rose-600">
              <Plane className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2">
            <div className="flex items-baseline space-x-2">
              <span className="text-2xl font-bold text-rose-600">{totalStrikes}</span>
              <span className="text-xs text-slate-500">Insiden Tercatat</span>
            </div>
            <p className="text-xs text-slate-600 font-medium mt-1">
              Kerusakan Pesawat: <strong className={strikeWithDamage > 0 ? 'text-red-600' : 'text-emerald-600'}>{strikeWithDamage} Kasus</strong>
            </p>
          </div>
        </div>

        {/* Card 4: Populasi Satwa Teramati */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Satwa Teramati</span>
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
              <Bird className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2">
            <div className="flex items-baseline space-x-2">
              <span className="text-2xl font-bold text-slate-900">{totalSatwaObserved}</span>
              <span className="text-xs text-slate-500">Ekor (Bulan Ini)</span>
            </div>
            <p className="text-xs text-sky-600 font-medium mt-1">
              Didominasi Burung Air &amp; Pipit
            </p>
          </div>
        </div>
      </div>

      {/* Airside Schematic Map */}
      <AirsideRunwayMap
        patrols={patrols}
        occurrences={occurrences}
        strikes={strikes}
        onSelectReport={(type, id) => onPreviewReport(type, id)}
      />

      {/* Grid for Operational Feeds & Top Species Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Operational Incident Feeds (2 Cols) */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Radio className="w-4 h-4 text-rose-600 animate-pulse" />
              <h3 className="font-bold text-sm text-slate-900">Aktivitas &amp; Laporan Operasional Terkini</h3>
            </div>
            <span className="text-xs text-slate-400 font-medium">Auto-Sync Airside Feed</span>
          </div>

          <div className="divide-y divide-slate-100 max-h-[420px] overflow-y-auto">
            {/* Strikes */}
            {strikes.map(strike => (
              <div key={strike.id} className="p-4 hover:bg-slate-50 transition flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-700 font-bold text-[10px] tracking-wide">
                      WILDLIFE STRIKE
                    </span>
                    <span className="text-xs font-semibold text-slate-800">{strike.flightNumber} ({strike.operatorAirline})</span>
                    <span className="text-xs text-slate-400">• {strike.waktuKejadian}</span>
                  </div>
                  <p className="text-xs text-slate-600 font-medium">
                    {strike.lokasi} | Spesies: {strike.jenisWildlife} ({strike.jumlahWildlife} ekor)
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Fase: <span className="font-semibold text-slate-700">{strike.fasePenerbangan}</span> | Kerusakan: <span className={strike.indikasiKerusakan === 'Ada' ? 'text-red-600 font-bold' : 'text-emerald-700'}>{strike.indikasiKerusakan}</span>
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center space-x-1.5 self-end sm:self-center">
                  <button
                    onClick={() => onPreviewReport('strike', strike.id)}
                    className="px-2.5 py-1 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded transition"
                  >
                    Detail
                  </button>
                  <button
                    onClick={() => exportStrikePDF(strike)}
                    className="p-1 text-slate-600 hover:text-rose-600 bg-slate-100 hover:bg-rose-50 rounded transition"
                    title="Cetak PDF Resmi"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onOpenBroadcast('STRIKE', strike)}
                    className="p-1 text-slate-600 hover:text-sky-600 bg-slate-100 hover:bg-sky-50 rounded transition"
                    title="Kirim Notifikasi Manajemen"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}

            {/* Occurrences */}
            {occurrences.map(occ => (
              <div key={occ.id} className="p-4 hover:bg-slate-50 transition flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-700 font-bold text-[10px] tracking-wide">
                      OCCURRENCE
                    </span>
                    <span className="text-xs font-semibold text-slate-800">{occ.reportNumber}</span>
                    <span className="text-xs text-slate-400">• {occ.waktuKejadian}</span>
                  </div>
                  <p className="text-xs text-slate-600 font-medium">
                    {occ.lokasi} - {occ.jenisOccurrence}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Satwa: <span className="font-semibold">{occ.jenisSatwa} ({occ.jumlahSatwa} ekor)</span> | Status: <span className="text-amber-700 font-semibold">{occ.status}</span>
                  </p>
                </div>

                <div className="flex items-center space-x-1.5 self-end sm:self-center">
                  <button
                    onClick={() => onPreviewReport('occurrence', occ.id)}
                    className="px-2.5 py-1 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded transition"
                  >
                    Detail
                  </button>
                  <button
                    onClick={() => exportOccurrencePDF(occ)}
                    className="p-1 text-slate-600 hover:text-amber-600 bg-slate-100 hover:bg-amber-50 rounded transition"
                    title="Cetak PDF Resmi"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onOpenBroadcast('OCCURRENCE', occ)}
                    className="p-1 text-slate-600 hover:text-sky-600 bg-slate-100 hover:bg-sky-50 rounded transition"
                    title="Kirim Notifikasi WhatsApp"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}

            {/* Patrols */}
            {patrols.map(patrol => (
              <div key={patrol.id} className="p-4 hover:bg-slate-50 transition flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="px-2 py-0.5 rounded bg-sky-100 text-sky-700 font-bold text-[10px] tracking-wide">
                      PATROLI / INSPEKSI
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
            </div>
          </div>

          {/* Operational Airside Readiness Card */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white p-4 rounded-xl border border-slate-700 shadow-sm">
            <h3 className="font-bold text-xs uppercase tracking-wider text-sky-400 mb-2">
              Status Kesiapan Operasional Airside
            </h3>
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between py-1 border-b border-slate-700/60">
                <span className="text-slate-300">Runway Sweeper Mobilization</span>
                <span className="font-semibold text-emerald-400">Standby (05 Min)</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-slate-700/60">
                <span className="text-slate-300">Pyrotechnic Bird Banger</span>
                <span className="font-semibold text-emerald-400">Siap Operasi</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-slate-700/60">
                <span className="text-slate-300">Acoustic &amp; Laser Cannons</span>
                <span className="font-semibold text-emerald-400">Aktif Terprogram</span>
              </div>
              <div className="flex items-center justify-between py-1">
                <span className="text-slate-300">Koordinasi Tower (VHF 118.1)</span>
                <span className="font-semibold text-emerald-400">Terhubung</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
