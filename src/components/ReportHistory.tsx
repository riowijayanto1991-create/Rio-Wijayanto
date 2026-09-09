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
  Bird
} from 'lucide-react';
import { PatrolReport, OccurrenceReport, WildlifeStrikeReport } from '../types';
import { exportPatrolPDF, exportOccurrencePDF, exportStrikePDF } from '../utils/pdfExport';
import { exportSinglePatrolToExcel, exportAllToExcel } from '../utils/excelExport';

interface ReportHistoryProps {
  patrols: PatrolReport[];
  occurrences: OccurrenceReport[];
  strikes: WildlifeStrikeReport[];
  onPreviewReport: (type: 'patrol' | 'occurrence' | 'strike', id: string) => void;
  onOpenBroadcast: (type: 'PATROL' | 'OCCURRENCE' | 'STRIKE', report: any) => void;
}

export const ReportHistory: React.FC<ReportHistoryProps> = ({
  patrols,
  occurrences,
  strikes,
  onPreviewReport,
  onOpenBroadcast
}) => {
  const [filterType, setFilterType] = useState<'all' | 'patrol' | 'occurrence' | 'strike'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedPleton, setSelectedPleton] = useState<string>('all');

  // Unified items
  type UnifiedItem = {
    type: 'patrol' | 'occurrence' | 'strike';
    id: string;
    number: string;
    date: string;
    pleton: string;
    dinas: string;
    pod: string;
    grid?: string;
    summary: string;
    highlight: string;
    raw: PatrolReport | OccurrenceReport | WildlifeStrikeReport;
  };

  const unifiedList: UnifiedItem[] = [
    ...strikes.map(s => ({
      type: 'strike' as const,
      id: s.id,
      number: s.reportNumber,
      date: `${s.hariTanggal}, ${s.waktuKejadian}`,
      pleton: s.pleton,
      dinas: s.dinas,
      pod: s.pod,
      grid: s.gridLocation,
      summary: `${s.operatorAirline} (${s.flightNumber}) - ${s.jenisWildlife} di ${s.lokasi}`,
      highlight: `Kerusakan: ${s.indikasiKerusakan} | Fase: ${s.fasePenerbangan}`,
      raw: s
    })),
    ...occurrences.map(o => ({
      type: 'occurrence' as const,
      id: o.id,
      number: o.reportNumber,
      date: `${o.hariTanggal}, ${o.waktuKejadian}`,
      pleton: o.pleton,
      dinas: o.dinas,
      pod: o.pod,
      grid: o.gridLocation,
      summary: `${o.jenisOccurrence} - ${o.jenisSatwa} (${o.jumlahSatwa} ekor)`,
      highlight: `Status: ${o.status} | Lokasi: ${o.lokasi}`,
      raw: o
    })),
    ...patrols.map(p => ({
      type: 'patrol' as const,
      id: p.id,
      number: p.reportNumber,
      date: `${p.hariTanggal} (${p.waktuPatroli})`,
      pleton: p.pleton,
      dinas: p.dinas,
      pod: p.pod.join(', '),
      grid: p.gridLocation,
      summary: `Inspeksi Rute: ${p.rutePatroli.slice(0, 75)}...`,
      highlight: `Satwa Teramati: ${p.totalPopulasiTeramati} ekor | Selective Lethal: ${p.selectiveLethal.totalLethal} ekor`,
      raw: p
    }))
  ];

  // Filtering
  const filtered = unifiedList.filter(item => {
    if (filterType !== 'all' && item.type !== filterType) return false;
    if (selectedPleton !== 'all' && !item.pleton.includes(selectedPleton)) return false;
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

  const handleDownloadPDF = (item: UnifiedItem) => {
    if (item.type === 'strike') exportStrikePDF(item.raw as WildlifeStrikeReport);
    else if (item.type === 'occurrence') exportOccurrencePDF(item.raw as OccurrenceReport);
    else exportPatrolPDF(item.raw as PatrolReport);
  };

  const handleDownloadExcel = (item: UnifiedItem) => {
    if (item.type === 'patrol') {
      exportSinglePatrolToExcel(item.raw as PatrolReport);
    } else {
      exportAllToExcel(patrols, occurrences, strikes);
    }
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
            Daftar lengkap seluruh laporan patroli, occurrence, dan tabrakan satwa liar dengan ekspor PDF &amp; Excel.
          </p>
        </div>

        <button
          onClick={() => exportAllToExcel(patrols, occurrences, strikes)}
          className="px-4 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-semibold flex items-center gap-2 shadow transition cursor-pointer"
        >
          <FileSpreadsheet className="w-4 h-4" />
          Export Seluruh Database (Excel XLSX)
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 text-xs">
        {/* Type selector tabs */}
        <div className="flex items-center space-x-1.5 bg-slate-100 p-1 rounded-lg">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 rounded transition font-medium ${
              filterType === 'all' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Semua ({unifiedList.length})
          </button>
          <button
            onClick={() => setFilterType('patrol')}
            className={`px-3 py-1.5 rounded transition font-medium ${
              filterType === 'patrol' ? 'bg-sky-600 text-white font-bold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Patroli ({patrols.length})
          </button>
          <button
            onClick={() => setFilterType('occurrence')}
            className={`px-3 py-1.5 rounded transition font-medium ${
              filterType === 'occurrence' ? 'bg-amber-600 text-white font-bold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Occurrence ({occurrences.length})
          </button>
          <button
            onClick={() => setFilterType('strike')}
            className={`px-3 py-1.5 rounded transition font-medium ${
              filterType === 'strike' ? 'bg-rose-700 text-white font-bold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Wildlife Strike ({strikes.length})
          </button>
        </div>

        {/* Filter controls */}
        <div className="flex items-center space-x-2 flex-1 max-w-md">
          <div className="relative flex-1">
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
            value={selectedPleton}
            onChange={e => setSelectedPleton(e.target.value)}
            className="px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs bg-white text-slate-700"
          >
            <option value="all">Semua Pleton</option>
            <option value="1">Pleton 1</option>
            <option value="2">Pleton 2</option>
            <option value="3">Pleton 3</option>
            <option value="4">Pleton 4</option>
          </select>
        </div>
      </div>

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
                  <td colSpan={5} className="p-8 text-center text-slate-400">
                    Tidak ada laporan yang cocok dengan kriteria pencarian.
                  </td>
                </tr>
              ) : (
                filtered.map(item => (
                  <tr key={item.id} className="hover:bg-slate-50 transition">
                    <td className="p-3">
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className={`inline-block px-2 py-0.5 rounded font-bold text-[10px] uppercase ${
                          item.type === 'strike' ? 'bg-rose-100 text-rose-800' :
                          item.type === 'occurrence' ? 'bg-amber-100 text-amber-800' : 'bg-sky-100 text-sky-800'
                        }`}>
                          {item.type === 'strike' ? 'Wildlife Strike' : item.type === 'occurrence' ? 'Occurrence' : 'Patroli Harian'}
                        </span>
                        {item.grid && (
                          <span className="font-mono text-[10px] font-bold text-sky-800 bg-sky-50 px-1.5 py-0.5 rounded border border-sky-200">
                            {item.grid}
                          </span>
                        )}
                      </div>
                      <p className="font-mono font-bold text-slate-800">{item.number}</p>
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
                          className="px-2.5 py-1 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded transition flex items-center gap-1 cursor-pointer"
                          title="Lihat Pratinjau Dokumen"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Preview</span>
                        </button>

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
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
