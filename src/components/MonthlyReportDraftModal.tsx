import React, { useState, useMemo } from 'react';
import { 
  X, 
  Download, 
  Copy, 
  Check, 
  FileJson, 
  FileText, 
  Building, 
  Users, 
  Wrench, 
  Bird, 
  ShieldCheck, 
  MapPin, 
  Calendar, 
  Crosshair, 
  AlertTriangle, 
  Scissors, 
  TrendingUp, 
  Award, 
  Layers,
  Search,
  CheckCircle2,
  FolderArchive
} from 'lucide-react';
import { PatrolReport, OccurrenceReport, WildlifeStrikeReport, MonthlyReportDocument } from '../types';
import { MonthlyReportDraftJSON } from '../types/monthlyReportDraft';
import { 
  generateMonthlyReportDraftJSON, 
  downloadMonthlyReportJSON 
} from '../utils/monthlyReportDraftGenerator';
import { saveDocumentLocally } from '../utils/documentStorage';

interface MonthlyReportDraftModalProps {
  isOpen: boolean;
  onClose: () => void;
  patrolReports?: PatrolReport[];
  occurrenceReports?: OccurrenceReport[];
  strikeReports?: WildlifeStrikeReport[];
  patrols?: PatrolReport[];
  occurrences?: OccurrenceReport[];
  strikes?: WildlifeStrikeReport[];
  onDraftSavedToArchive?: (doc: MonthlyReportDocument) => void;
  onSavedToArchive?: (doc: MonthlyReportDocument) => void;
}

export const MonthlyReportDraftModal: React.FC<MonthlyReportDraftModalProps> = ({
  isOpen,
  onClose,
  patrolReports: propPatrolReports,
  occurrenceReports: propOccurrenceReports,
  strikeReports: propStrikeReports,
  patrols = [],
  occurrences = [],
  strikes = [],
  onDraftSavedToArchive,
  onSavedToArchive
}) => {
  const effectivePatrols = propPatrolReports || patrols;
  const effectiveOccurrences = propOccurrenceReports || occurrences;
  const effectiveStrikes = propStrikeReports || strikes;
  const handleSaveToArchiveCallback = onSavedToArchive || onDraftSavedToArchive;
  const [selectedMonth, setSelectedMonth] = useState<string>('Agustus');
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [activeTab, setActiveTab] = useState<'visual' | 'json' | 'template' | 'sections'>('visual');
  const [copied, setCopied] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [jsonSearch, setJsonSearch] = useState<string>('');
  const [selectedSectionFilter, setSelectedSectionFilter] = useState<string>('all');

  const monthsList = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  // Generate draft JSON based on chosen month and year
  const draftJSON: MonthlyReportDraftJSON = useMemo(() => {
    return generateMonthlyReportDraftJSON(effectivePatrols, effectiveOccurrences, effectiveStrikes, {
      periodeBulan: selectedMonth,
      periodeTahun: selectedYear,
      tanggalPenerbitan: `03 ${selectedMonth === 'Agustus' ? 'September' : selectedMonth} ${selectedYear}`,
      nomorDokumen: `WHMS-CGK/BLN/${selectedYear}/${selectedMonth.substring(0, 3).toUpperCase()}/001`
    });
  }, [effectivePatrols, effectiveOccurrences, effectiveStrikes, selectedMonth, selectedYear]);

  const jsonString = useMemo(() => {
    return JSON.stringify(draftJSON, null, 2);
  }, [draftJSON]);

  const handleCopyJSON = async () => {
    try {
      await navigator.clipboard.writeText(jsonString);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
      const textArea = document.createElement('textarea');
      textArea.value = jsonString;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleDownloadJSON = () => {
    downloadMonthlyReportJSON(draftJSON);
  };

  const handleSaveToArchive = async () => {
    setIsSaving(true);
    try {
      // Create JSON data URL
      const jsonBase64 = `data:application/json;base64,${btoa(unescape(encodeURIComponent(jsonString)))}`;
      const newDoc: MonthlyReportDocument = {
        id: `draft-monthly-${selectedYear}-${selectedMonth.toLowerCase()}-${Date.now()}`,
        title: `Draft Dokumen Laporan Bulanan WHMS - ${selectedMonth} ${selectedYear} (JSON Template-Ready)`,
        periodeBulan: selectedMonth,
        periodeTahun: selectedYear,
        kategoriLaporan: 'Laporan Bulanan Lengkap (Comprehensive WHMS)',
        fileName: `Laporan_Bulanan_Wildlife_Hazard_${selectedMonth}_${selectedYear}_Draft.json`,
        fileType: 'pdf', // classified in archive
        fileMime: 'application/json',
        fileSize: new Blob([jsonString]).size,
        fileData: jsonBase64,
        uploadedAt: new Date().toISOString(),
        uploadedBy: 'Sistem Otomasi WHMS (Draft Generator)',
        pleton: 'Unit Wildlife Hazard Management',
        catatanRingkasan: `Draft dokumen JSON otomatis berstandar ICAO Doc 9137 & KP 434. Merangkum 12 bab: Populasi ${draftJSON.populasiSatwaLiar.totalPopulasiBulanan} ekor, Lethal ${draftJSON.dataLethalBulanBerjalan.totalPelumpuhanHewan} ekor, ${draftJSON.wildlifeStrikePeriodeBerjalan.daftarStrike.length} strike, ${draftJSON.laporanKejadianBahayaSatwaLiar.daftarOccurrence.length} occurrence, ${draftJSON.monitoringPengelolaanHabitat.totalLuasHektar} Ha habitat. Siap diintegrasikan dengan template Word/PDF.`,
        totalStrikeBulanIni: draftJSON.wildlifeStrikePeriodeBerjalan.daftarStrike.length,
        strikeWithDamageBulanIni: draftJSON.wildlifeStrikePeriodeBerjalan.daftarStrike.filter(s => s.kerusakanPesawat === 'Yes').length,
        totalPatroliBulanIni: draftJSON.logWildlifeHazardDaily.daftarLogHarian.length * 4,
        totalOccurrenceBulanIni: draftJSON.laporanKejadianBahayaSatwaLiar.daftarOccurrence.length,
        totalSatwaBulanIni: draftJSON.populasiSatwaLiar.totalPopulasiBulanan,
        spesiesDominan: 'Burung Blekok Sawah & Burung Cabak Kota',
        areaRawanUtama: 'Runway 07L/25R & Infield Area',
        statusVerifikasi: 'Arsip Resmi',
        tags: ['Draft Otomatis', 'Format JSON', 'Word/PDF Ready', 'ICAO Doc 9137']
      };

      await saveDocumentLocally(newDoc);
      if (handleSaveToArchiveCallback) {
        handleSaveToArchiveCallback(newDoc);
      }
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error('Gagal menyimpan draft ke arsip:', err);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/70 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-6xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header Section */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center">
              <FileJson className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase">
                  Otomatisasi Laporan Bulanan
                </span>
                <span className="text-[10px] font-semibold text-slate-400">
                  Format JSON Siap Template Word / PDF
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-bold text-white mt-0.5">
                Draft Laporan Bulanan WHMS — {selectedMonth} {selectedYear}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Month & Year Selectors */}
            <div className="hidden sm:flex items-center gap-2 bg-slate-800/80 p-1 rounded-xl border border-slate-700">
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="bg-transparent text-xs font-semibold text-amber-300 px-2.5 py-1 rounded-lg focus:outline-none cursor-pointer"
              >
                {monthsList.map(m => (
                  <option key={m} value={m} className="bg-slate-900 text-white">{m}</option>
                ))}
              </select>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="bg-transparent text-xs font-semibold text-slate-200 px-2 py-1 rounded-lg focus:outline-none cursor-pointer"
              >
                <option value={2026} className="bg-slate-900 text-white">2026</option>
                <option value={2025} className="bg-slate-900 text-white">2025</option>
              </select>
            </div>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition cursor-pointer"
              aria-label="Tutup Modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation & Action Bar */}
        <div className="bg-slate-50 px-6 py-2.5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 overflow-x-auto py-1">
            <button
              onClick={() => setActiveTab('visual')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                activeTab === 'visual'
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-200'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              Tinjauan Dokumen (12 Bab Lengkap)
            </button>

            <button
              onClick={() => setActiveTab('json')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                activeTab === 'json'
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-200'
              }`}
            >
              <FileJson className="w-3.5 h-3.5" />
              Data JSON Mentah ({Math.round(jsonString.length / 1024)} KB)
            </button>

            <button
              onClick={() => setActiveTab('template')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                activeTab === 'template'
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              Panduan Template Word &amp; PDF
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyJSON}
              className="px-3 py-1.5 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-semibold flex items-center gap-1.5 shadow-sm transition cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Tersalin!' : 'Salin JSON'}
            </button>

            <button
              onClick={handleDownloadJSON}
              className="px-3.5 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              Unduh .JSON
            </button>

            <button
              onClick={handleSaveToArchive}
              disabled={isSaving}
              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition cursor-pointer"
            >
              {saveSuccess ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Tersimpan di Arsip!
                </>
              ) : (
                <>
                  <FolderArchive className="w-3.5 h-3.5" />
                  {isSaving ? 'Menyimpan...' : 'Simpan ke Arsip'}
                </>
              )}
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-100/50">
          
          {/* TAB 1: VISUAL 12 BAB PREVIEW */}
          {activeTab === 'visual' && (
            <div className="space-y-6 max-w-5xl mx-auto">
              
              {/* Cover Banner */}
              <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 rounded-2xl shadow-md border border-slate-800 relative overflow-hidden">
                <div className="absolute right-0 top-0 bottom-0 opacity-10 pointer-events-none flex items-center pr-8">
                  <Bird className="w-64 h-64" />
                </div>
                <div className="relative z-10 space-y-2">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold uppercase tracking-wider">
                    DOKUMEN RESMI PT ANGKASA PURA INDONESIA
                  </div>
                  <h1 className="text-xl sm:text-2xl font-black tracking-tight">
                    {draftJSON.documentInfo.judul}
                  </h1>
                  <p className="text-slate-300 text-sm">
                    {draftJSON.documentInfo.subJudul} • Periode <span className="font-bold text-amber-300">{draftJSON.documentInfo.periodeBulan} {draftJSON.documentInfo.periodeTahun}</span>
                  </p>
                  <div className="pt-2 flex flex-wrap items-center gap-4 text-xs text-slate-400">
                    <span>No. Dokumen: <strong className="text-slate-200">{draftJSON.documentInfo.nomorDokumen}</strong></span>
                    <span>Standar: <strong className="text-slate-200">{draftJSON.documentInfo.formatVersion}</strong></span>
                    <span>Tgl Dokumen: <strong className="text-slate-200">{draftJSON.documentInfo.tanggalPenerbitan}</strong></span>
                  </div>
                </div>
              </div>

              {/* Key Metric Highlights Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Total Populasi</span>
                  <div className="text-2xl font-black text-slate-800 mt-1">{draftJSON.populasiSatwaLiar.totalPopulasiBulanan}</div>
                  <span className="text-[10px] text-slate-500">Satwa teramati di airside</span>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Pelumpuhan (Lethal)</span>
                  <div className="text-2xl font-black text-rose-600 mt-1">{draftJSON.dataLethalBulanBerjalan.totalPelumpuhanHewan}</div>
                  <span className="text-[10px] text-slate-500">55% Blekok, 22.3% Cabak</span>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Wildlife Strike</span>
                  <div className="text-2xl font-black text-amber-600 mt-1">{draftJSON.wildlifeStrikePeriodeBerjalan.daftarStrike.length}</div>
                  <span className="text-[10px] text-emerald-600 font-semibold">{draftJSON.wildlifeStrikePeriodeBerjalan.analisisTrenMoM.persentasePerubahan} MoM</span>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Laporan Occurrence</span>
                  <div className="text-2xl font-black text-indigo-600 mt-1">{draftJSON.laporanKejadianBahayaSatwaLiar.daftarOccurrence.length}</div>
                  <span className="text-[10px] text-slate-500">ATC Tower &amp; AMC</span>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm col-span-2 sm:col-span-1">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Kontrol Habitat</span>
                  <div className="text-2xl font-black text-emerald-600 mt-1">{draftJSON.monitoringPengelolaanHabitat.totalLuasHektar} Ha</div>
                  <span className="text-[10px] text-slate-500">11 Kegiatan Mower/Manual</span>
                </div>
              </div>

              {/* Section Filter Pills */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
                <span className="text-slate-500 font-bold whitespace-nowrap">Lompat ke Bab:</span>
                {[
                  { id: 'all', label: 'Semua Bab (1–12)' },
                  { id: 'sec1', label: '1. Data Bandara' },
                  { id: 'sec2', label: '2. Personel SDM' },
                  { id: 'sec3', label: '3. Inventaris' },
                  { id: 'sec4', label: '4. Populasi & SMS' },
                  { id: 'sec5', label: '5. Zona Mapping' },
                  { id: 'sec6', label: '6. Log Harian' },
                  { id: 'sec8', label: '8. Data Lethal' },
                  { id: 'sec9', label: '9. Wildlife Strike' },
                  { id: 'sec10', label: '10. Occurrence' },
                  { id: 'sec11', label: '11. Habitat' },
                  { id: 'sec12', label: '12. Kesimpulan' },
                  { id: 'sec13', label: 'Pengesahan' }
                ].map(s => (
                  <button
                    key={s.id}
                    onClick={() => setSelectedSectionFilter(s.id)}
                    className={`px-3 py-1 rounded-full whitespace-nowrap font-semibold cursor-pointer transition ${
                      selectedSectionFilter === s.id
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>

              {/* SECTION 1: DATA BANDAR UDARA */}
              {(selectedSectionFilter === 'all' || selectedSectionFilter === 'sec1') && (
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                  <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
                    <div className="w-7 h-7 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center font-bold text-xs">
                      1
                    </div>
                    <h3 className="font-bold text-slate-800 text-sm sm:text-base flex items-center gap-2">
                      <Building className="w-4 h-4 text-sky-600" />
                      DATA BANDAR UDARA
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div className="space-y-2">
                      <div className="flex justify-between py-1 border-b border-slate-100">
                        <span className="text-slate-500">Nama Bandara:</span>
                        <span className="font-semibold text-slate-800">{draftJSON.dataBandarUdara.namaBandara}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-100">
                        <span className="text-slate-500">Lokasi:</span>
                        <span className="font-semibold text-slate-800">{draftJSON.dataBandarUdara.lokasi}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-100">
                        <span className="text-slate-500">Status Penggunaan:</span>
                        <span className="font-semibold text-slate-800">{draftJSON.dataBandarUdara.statusPenggunaan}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-100">
                        <span className="text-slate-500">Koordinat ARP:</span>
                        <span className="font-mono font-semibold text-slate-800">
                          {draftJSON.dataBandarUdara.koordinatARP.latitude} / {draftJSON.dataBandarUdara.koordinatARP.longitude}
                        </span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-100">
                        <span className="text-slate-500">Penyelenggara:</span>
                        <span className="font-semibold text-slate-800 text-right">{draftJSON.dataBandarUdara.penyelenggara}</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between py-1 border-b border-slate-100">
                        <span className="text-slate-500">Kode Referensi:</span>
                        <span className="font-semibold text-slate-800">{draftJSON.dataBandarUdara.kodeReferensiBandarUdara}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-100">
                        <span className="text-slate-500">Pesawat Terkritis:</span>
                        <span className="font-semibold text-rose-600">{draftJSON.dataBandarUdara.tipePesawatUdaraTerkritis}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-100">
                        <span className="text-slate-500">Kategori PKP-PK:</span>
                        <span className="font-semibold text-slate-800">{draftJSON.dataBandarUdara.kategoriPKPPK}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-100">
                        <span className="text-slate-500">Nomor Sertifikat:</span>
                        <span className="font-semibold text-slate-800">{draftJSON.dataBandarUdara.nomorSertifikatBandarUdara}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-100">
                        <span className="text-slate-500">Jam Operasi:</span>
                        <span className="font-semibold text-slate-800">{draftJSON.dataBandarUdara.jamOperasi}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-amber-50/70 p-3 rounded-xl border border-amber-200 text-xs text-amber-900">
                    <strong>Pengecualian (Exemption):</strong> {draftJSON.dataBandarUdara.pengecualianExemption}
                  </div>
                </div>
              )}

              {/* SECTION 2: DATA PERSONEL */}
              {(selectedSectionFilter === 'all' || selectedSectionFilter === 'sec2') && (
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                  <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
                    <div className="w-7 h-7 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center font-bold text-xs">
                      2
                    </div>
                    <h3 className="font-bold text-slate-800 text-sm sm:text-base flex items-center gap-2">
                      <Users className="w-4 h-4 text-sky-600" />
                      DATA PERSONEL &amp; KONDISI SDM
                    </h3>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                        <tr>
                          <th className="py-2 px-3">No</th>
                          <th className="py-2 px-3">Nama Personel</th>
                          <th className="py-2 px-3">NIP</th>
                          <th className="py-2 px-3">Grade</th>
                          <th className="py-2 px-3">Jabatan</th>
                          <th className="py-2 px-3">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {draftJSON.dataPersonel.daftarPersonel.map(p => (
                          <tr key={p.no} className="hover:bg-slate-50">
                            <td className="py-2 px-3 font-semibold text-slate-600">{p.no}</td>
                            <td className="py-2 px-3 font-bold text-slate-900">{p.namaPersonel}</td>
                            <td className="py-2 px-3 font-mono text-slate-600">{p.nip}</td>
                            <td className="py-2 px-3">{p.grade}</td>
                            <td className="py-2 px-3 text-slate-700">{p.jabatan}</td>
                            <td className="py-2 px-3">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                p.keterangan === 'ORGANIK' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                              }`}>
                                {p.keterangan}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs text-slate-700 space-y-2">
                    <h4 className="font-bold text-slate-900">Rangkuman Kondisi SDM:</h4>
                    <p>{draftJSON.dataPersonel.rangkumanKondisiSDM.poinA}</p>
                    <p>{draftJSON.dataPersonel.rangkumanKondisiSDM.poinB}</p>
                    <p>{draftJSON.dataPersonel.rangkumanKondisiSDM.poinC}</p>
                  </div>
                </div>
              )}

              {/* SECTION 3: INVENTARIS PERALATAN */}
              {(selectedSectionFilter === 'all' || selectedSectionFilter === 'sec3') && (
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                  <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
                    <div className="w-7 h-7 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center font-bold text-xs">
                      3
                    </div>
                    <h3 className="font-bold text-slate-800 text-sm sm:text-base flex items-center gap-2">
                      <Wrench className="w-4 h-4 text-sky-600" />
                      DATA INVENTARIS PERALATAN ({draftJSON.dataInventarisPeralatan.daftarPeralatan.length} Item)
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                    {draftJSON.dataInventarisPeralatan.daftarPeralatan.map(item => (
                      <div key={item.no} className="p-3 rounded-xl border border-slate-200 bg-slate-50/50 flex items-start justify-between gap-2 text-xs">
                        <div>
                          <span className="font-bold text-slate-900">{item.namaBarang}</span>
                          <p className="text-[11px] text-slate-500 mt-0.5">{item.merkJenis}</p>
                          <span className="text-[10px] font-semibold text-slate-700">{item.jumlah} {item.satuan}</span>
                        </div>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 whitespace-nowrap">
                          {item.keteranganKondisi}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="p-3 bg-sky-50 rounded-xl border border-sky-200 text-xs text-sky-900">
                    <strong>Kesimpulan Umum Peralatan:</strong> {draftJSON.dataInventarisPeralatan.kesimpulanUmum}
                  </div>
                </div>
              )}

              {/* SECTION 4: POPULASI SATWA LIAR */}
              {(selectedSectionFilter === 'all' || selectedSectionFilter === 'sec4') && (
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                  <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
                    <div className="w-7 h-7 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center font-bold text-xs">
                      4
                    </div>
                    <h3 className="font-bold text-slate-800 text-sm sm:text-base flex items-center gap-2">
                      <Bird className="w-4 h-4 text-sky-600" />
                      POPULASI SATWA LIAR &amp; PENDEKATAN SMS STRATEGIS
                    </h3>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-100 text-slate-700 font-bold">
                        <tr>
                          <th className="py-2 px-3">Jenis Satwa</th>
                          <th className="py-2 px-3 text-right">Total Bulan Berjalan</th>
                          <th className="py-2 px-3">Tingkat Risiko</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {draftJSON.populasiSatwaLiar.populasiBulanan.map((pop, idx) => (
                          <tr key={idx} className="hover:bg-slate-50">
                            <td className="py-2 px-3 font-semibold text-slate-800">{pop.jenisSatwa}</td>
                            <td className="py-2 px-3 text-right font-bold text-slate-900">{pop.total} ekor</td>
                            <td className="py-2 px-3">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                pop.kategoriRisiko === 'HIGH RISK' ? 'bg-rose-100 text-rose-800' :
                                pop.kategoriRisiko === 'MEDIUM RISK' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-700'
                              }`}>
                                {pop.kategoriRisiko}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700 leading-relaxed">
                    <strong className="text-slate-900">Perbandingan 3 Bulan Terakhir ({draftJSON.populasiSatwaLiar.perbandinganTigaBulanTerakhir.periode}):</strong>
                    <p className="mt-1">{draftJSON.populasiSatwaLiar.perbandinganTigaBulanTerakhir.narasi}</p>
                  </div>

                  {/* SMS 3 Steps */}
                  <div className="space-y-3 pt-2">
                    <h4 className="font-bold text-xs uppercase tracking-wider text-slate-500">Tiga Langkah Strategis SMS (Safety Management System):</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                      <div className="p-3.5 rounded-xl bg-sky-50/70 border border-sky-200 space-y-1.5">
                        <h5 className="font-bold text-sky-900">{draftJSON.populasiSatwaLiar.tigaLangkahStrategisSMS.identifikasiHazard.judul}</h5>
                        <p className="text-slate-600 text-[11px]">{draftJSON.populasiSatwaLiar.tigaLangkahStrategisSMS.identifikasiHazard.deskripsi}</p>
                      </div>
                      <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200 space-y-1.5">
                        <h5 className="font-bold text-amber-900">{draftJSON.populasiSatwaLiar.tigaLangkahStrategisSMS.penilaianRisiko.judul}</h5>
                        <p className="text-slate-600 text-[11px]">{draftJSON.populasiSatwaLiar.tigaLangkahStrategisSMS.penilaianRisiko.deskripsi}</p>
                      </div>
                      <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200 space-y-1.5">
                        <h5 className="font-bold text-emerald-900">{draftJSON.populasiSatwaLiar.tigaLangkahStrategisSMS.rencanaPengelolaan.judul}</h5>
                        <p className="text-slate-600 text-[11px]">{draftJSON.populasiSatwaLiar.tigaLangkahStrategisSMS.rencanaPengelolaan.deskripsi}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* SECTION 5: ZONA MAPPING */}
              {(selectedSectionFilter === 'all' || selectedSectionFilter === 'sec5') && (
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                  <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
                    <div className="w-7 h-7 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center font-bold text-xs">
                      5
                    </div>
                    <h3 className="font-bold text-slate-800 text-sm sm:text-base flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-sky-600" />
                      ZONA MAPPING WILDLIFE (ZONA 1 – 6)
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {draftJSON.zonaMappingWildlife.map(z => (
                      <div key={z.zona} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 space-y-2 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-md bg-indigo-600 text-white font-black flex items-center justify-center text-xs">
                            {z.zona}
                          </span>
                          <span className="font-bold text-slate-900">{z.label}</span>
                        </div>
                        <p className="text-[11px] text-slate-500">{z.deskripsiArea}</p>
                        <div className="flex flex-wrap gap-1 pt-1">
                          {z.spesiesTeramati.map((sp, i) => (
                            <span key={i} className="px-1.5 py-0.5 rounded bg-white border border-slate-200 text-[10px] text-slate-700">
                              {sp}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* SECTION 6: LOG WILDLIFE HAZARD DAILY */}
              {(selectedSectionFilter === 'all' || selectedSectionFilter === 'sec6') && (
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center font-bold text-xs">
                        6
                      </div>
                      <h3 className="font-bold text-slate-800 text-sm sm:text-base flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-sky-600" />
                        LOG WILDLIFE HAZARD DAILY ({draftJSON.logWildlifeHazardDaily.daftarLogHarian.length} Hari Lengkap)
                      </h3>
                    </div>
                    <span className="text-xs text-slate-500">4 Sesi/Hari (Awal &amp; Akhir Pagi, Awal &amp; Akhir Malam)</span>
                  </div>

                  {/* Sample Day Entry */}
                  <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-slate-800">
                        Contoh Log Harian: {draftJSON.logWildlifeHazardDaily.daftarLogHarian[0]?.tanggalFormatted}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                        Status: Closed (Safe 3C)
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      {draftJSON.logWildlifeHazardDaily.daftarLogHarian[0]?.sesiInspeksi.map((sesi, idx) => (
                        <div key={idx} className="p-2.5 rounded-lg bg-white border border-slate-200 space-y-1">
                          <div className="flex items-center justify-between font-bold text-slate-800">
                            <span>{sesi.namaSesi}</span>
                            <span className="text-[10px] text-slate-500">{sesi.waktuWib}</span>
                          </div>
                          <div className="text-[11px] text-slate-600">
                            <strong>Temuan:</strong> {sesi.temuanSatwa.map(t => `${t.jenisSatwa} (${t.jumlah} ekor)`).join(', ')}
                          </div>
                          <div className="text-[11px] text-slate-600">
                            <strong>Risiko:</strong> Inherent <span className="text-rose-600 font-bold">{sesi.inherentRisk}</span> → Residual <span className="text-emerald-600 font-bold">{sesi.residualRisk}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Analisa Laporan Harian */}
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700 space-y-2">
                    <h4 className="font-bold text-slate-900">Analisa Laporan Harian (Diintegrasikan ke Dokumen Word/PDF):</h4>
                    <p className="leading-relaxed"><strong>Pagi (05.00–10.00 WIB):</strong> {draftJSON.logWildlifeHazardDaily.analisaLaporanHarian.polaPeriodePagi}</p>
                    <p className="leading-relaxed"><strong>Siang (09.00–16.00 WIB):</strong> {draftJSON.logWildlifeHazardDaily.analisaLaporanHarian.polaPeriodeSiang}</p>
                    <p className="leading-relaxed"><strong>Sore (15.00–18.00 WIB):</strong> {draftJSON.logWildlifeHazardDaily.analisaLaporanHarian.polaPeriodeSore}</p>
                    <p className="leading-relaxed"><strong>Malam &amp; Cabak Kota:</strong> {draftJSON.logWildlifeHazardDaily.analisaLaporanHarian.perilakuKhususCabakKota}</p>
                  </div>
                </div>
              )}

              {/* SECTION 8: DATA LETHAL BULAN BERJALAN */}
              {(selectedSectionFilter === 'all' || selectedSectionFilter === 'sec8') && (
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                  <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
                    <div className="w-7 h-7 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center font-bold text-xs">
                      8
                    </div>
                    <h3 className="font-bold text-slate-800 text-sm sm:text-base flex items-center gap-2">
                      <Crosshair className="w-4 h-4 text-rose-600" />
                      DATA LETHAL BULAN BERJALAN (TOTAL: {draftJSON.dataLethalBulanBerjalan.totalPelumpuhanHewan} EKOR)
                    </h3>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-100 text-slate-700 font-bold">
                        <tr>
                          <th className="py-2 px-3">No</th>
                          <th className="py-2 px-3">Jenis Satwa Liar</th>
                          <th className="py-2 px-3 text-right">Jumlah Dilumpuhkan</th>
                          <th className="py-2 px-3 text-right">Persentase</th>
                          <th className="py-2 px-3">Lokasi Tindakan</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {draftJSON.dataLethalBulanBerjalan.rekapitulasiSpesies
                          .filter(s => s.jumlahIndividuDilumpuhkan > 0)
                          .map(s => (
                            <tr key={s.no} className="hover:bg-slate-50">
                              <td className="py-2 px-3 font-semibold text-slate-600">{s.no}</td>
                              <td className="py-2 px-3 font-bold text-slate-900">{s.jenisSatwaLiar}</td>
                              <td className="py-2 px-3 text-right font-bold text-rose-600">{s.jumlahIndividuDilumpuhkan} ekor</td>
                              <td className="py-2 px-3 text-right font-semibold text-slate-700">{s.persentaseDariTotal}%</td>
                              <td className="py-2 px-3 text-slate-600">{s.lokasiTindakan}</td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="p-3 bg-rose-50 rounded-xl border border-rose-200 text-xs text-rose-950 leading-relaxed">
                    <strong>Evaluasi Tindakan Pelumpuhan:</strong> {draftJSON.dataLethalBulanBerjalan.narasiEvaluasiLethal}
                  </div>
                </div>
              )}

              {/* SECTION 9: WILDLIFE STRIKE */}
              {(selectedSectionFilter === 'all' || selectedSectionFilter === 'sec9') && (
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                  <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
                    <div className="w-7 h-7 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center font-bold text-xs">
                      9
                    </div>
                    <h3 className="font-bold text-slate-800 text-sm sm:text-base flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-600" />
                      WILDLIFE STRIKE PERIODE BERJALAN ({draftJSON.wildlifeStrikePeriodeBerjalan.daftarStrike.length} Insiden)
                    </h3>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-100 text-slate-700 font-bold">
                        <tr>
                          <th className="py-2 px-3">No. Laporan</th>
                          <th className="py-2 px-3">Tanggal &amp; Jam</th>
                          <th className="py-2 px-3">Pesawat &amp; Maskapai</th>
                          <th className="py-2 px-3">Fase</th>
                          <th className="py-2 px-3">Runway</th>
                          <th className="py-2 px-3">Kerusakan</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {draftJSON.wildlifeStrikePeriodeBerjalan.daftarStrike.map(s => (
                          <tr key={s.nomorLaporan} className="hover:bg-slate-50">
                            <td className="py-2 px-3 font-mono font-bold text-sky-700">{s.nomorLaporan}</td>
                            <td className="py-2 px-3">{s.tanggalFormatted}, {s.strikeTime}</td>
                            <td className="py-2 px-3 font-semibold text-slate-800">{s.maskapaiDanRegistrasi} ({s.aircraftType})</td>
                            <td className="py-2 px-3">{s.strikePhase}</td>
                            <td className="py-2 px-3 font-mono">{s.runwayInUse}</td>
                            <td className="py-2 px-3">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                s.kerusakanPesawat === 'Yes' ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
                              }`}>
                                {s.kerusakanPesawat === 'Yes' ? 'Ada Damage' : 'No Damage'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-950 leading-relaxed">
                    <strong>Analisis MoM Wildlife Strike:</strong> {draftJSON.wildlifeStrikePeriodeBerjalan.analisisTrenMoM.narasi}
                  </div>
                </div>
              )}

              {/* SECTION 10: WILDLIFE OCCURRENCE */}
              {(selectedSectionFilter === 'all' || selectedSectionFilter === 'sec10') && (
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                  <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
                    <div className="w-7 h-7 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center font-bold text-xs">
                      10
                    </div>
                    <h3 className="font-bold text-slate-800 text-sm sm:text-base flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-indigo-600" />
                      LAPORAN KEJADIAN BAHAYA SATWA LIAR (OCCURRENCE)
                    </h3>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-100 text-slate-700 font-bold">
                        <tr>
                          <th className="py-2 px-3">No. Laporan</th>
                          <th className="py-2 px-3">Waktu &amp; Sumber</th>
                          <th className="py-2 px-3">Jenis &amp; Jumlah</th>
                          <th className="py-2 px-3">Lokasi</th>
                          <th className="py-2 px-3">Tindakan &amp; Hasil</th>
                          <th className="py-2 px-3">Personel</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {draftJSON.laporanKejadianBahayaSatwaLiar.daftarOccurrence.map(o => (
                          <tr key={o.nomorLaporan} className="hover:bg-slate-50">
                            <td className="py-2 px-3 font-mono font-bold text-indigo-700">{o.nomorLaporan}</td>
                            <td className="py-2 px-3">{o.tanggalFormatted}, {o.waktu} ({o.sumberInformasi})</td>
                            <td className="py-2 px-3 font-semibold text-slate-800">{o.jenisHazard} ({o.jumlah})</td>
                            <td className="py-2 px-3 text-slate-700">{o.lokasiHazard}</td>
                            <td className="py-2 px-3 text-slate-600 text-[11px]">{o.hasilTindakan}</td>
                            <td className="py-2 px-3 text-slate-500 text-[11px]">{o.personel.join(', ')}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="p-3 bg-indigo-50 rounded-xl border border-indigo-200 text-xs text-indigo-950 leading-relaxed">
                    <strong>Analisis MoM Wildlife Occurrence:</strong> {draftJSON.laporanKejadianBahayaSatwaLiar.analisisTrenMoM.narasi}
                  </div>
                </div>
              )}

              {/* SECTION 11: MONITORING PENGELOLAAN HABITAT */}
              {(selectedSectionFilter === 'all' || selectedSectionFilter === 'sec11') && (
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                  <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
                    <div className="w-7 h-7 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center font-bold text-xs">
                      11
                    </div>
                    <h3 className="font-bold text-slate-800 text-sm sm:text-base flex items-center gap-2">
                      <Scissors className="w-4 h-4 text-emerald-600" />
                      MONITORING PENGELOLAAN HABITAT ({draftJSON.monitoringPengelolaanHabitat.totalLuasHektar} Ha)
                    </h3>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-100 text-slate-700 font-bold">
                        <tr>
                          <th className="py-2 px-3">No. WLPH</th>
                          <th className="py-2 px-3">Tanggal</th>
                          <th className="py-2 px-3">Lokasi Kegiatan</th>
                          <th className="py-2 px-3 text-right">Luas / Jumlah</th>
                          <th className="py-2 px-3">Personel</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {draftJSON.monitoringPengelolaanHabitat.daftarKegiatan.map(h => (
                          <tr key={h.nomorKegiatan} className="hover:bg-slate-50">
                            <td className="py-2 px-3 font-mono font-bold text-emerald-700">{h.nomorKegiatan}</td>
                            <td className="py-2 px-3">{h.tanggalFormatted}</td>
                            <td className="py-2 px-3 font-semibold text-slate-800">{h.lokasi}</td>
                            <td className="py-2 px-3 text-right font-bold text-slate-900">{h.luasJumlah}</td>
                            <td className="py-2 px-3 text-slate-500 text-[11px]">{h.personel.join(', ')}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-950 leading-relaxed">
                    <strong>Rekapitulasi Pengendalian Habitat:</strong> {draftJSON.monitoringPengelolaanHabitat.narasiPengelolaanHabitat}
                  </div>
                </div>
              )}

              {/* SECTION 12: KESIMPULAN TREND & PENGESAHAN */}
              {(selectedSectionFilter === 'all' || selectedSectionFilter === 'sec12') && (
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                  <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
                    <div className="w-7 h-7 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center font-bold text-xs">
                      12
                    </div>
                    <h3 className="font-bold text-slate-800 text-sm sm:text-base flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-sky-600" />
                      KESIMPULAN TREND BULAN {draftJSON.documentInfo.periodeBulan.toUpperCase()} {draftJSON.documentInfo.periodeTahun}
                    </h3>
                  </div>

                  <div className="space-y-3 text-xs text-slate-700 leading-relaxed">
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <h4 className="font-bold text-slate-900">A. Dinamika Populasi dan Migrasi Eksternal</h4>
                      <p className="mt-1">{draftJSON.kesimpulanTrendBulanBerjalan.poinA_dinamikaPopulasiDanMigrasi}</p>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <h4 className="font-bold text-slate-900">B. Dampak Kondisi Cuaca terhadap Aktivitas Satwa</h4>
                      <p className="mt-1">{draftJSON.kesimpulanTrendBulanBerjalan.poinB_dampakKondisiCuaca}</p>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                      <h4 className="font-bold text-slate-900">C. Efektivitas Mitigasi dan Pengendalian Operasional</h4>
                      <p>{draftJSON.kesimpulanTrendBulanBerjalan.poinC_efektivitasMitigasiOperasional.narasiPembuka}</p>
                      <ul className="list-disc pl-5 space-y-1 text-slate-600">
                        {draftJSON.kesimpulanTrendBulanBerjalan.poinC_efektivitasMitigasiOperasional.langkahStrategis.map((s, idx) => (
                          <li key={idx}>{s}</li>
                        ))}
                      </ul>
                      <p className="pt-1 text-slate-600"><em>{draftJSON.kesimpulanTrendBulanBerjalan.poinC_efektivitasMitigasiOperasional.evaluasiMoM}</em></p>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <h4 className="font-bold text-slate-900">D. Optimalisasi Sumber Daya Manusia dan Inventaris</h4>
                      <p className="mt-1">{draftJSON.kesimpulanTrendBulanBerjalan.poinD_optimalisasiSdmDanInventaris}</p>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <h4 className="font-bold text-slate-900">E. Evaluasi Strategis</h4>
                      <p className="mt-1">{draftJSON.kesimpulanTrendBulanBerjalan.poinE_evaluasiStrategis}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* LEMBAR PENGESAHAN */}
              {(selectedSectionFilter === 'all' || selectedSectionFilter === 'sec13') && (
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
                  <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
                    <Award className="w-5 h-5 text-amber-500" />
                    <h3 className="font-bold text-slate-800 text-sm sm:text-base">
                      LEMBAR PENGESAHAN DOKUMEN LAPORAN BULANAN
                    </h3>
                  </div>

                  <div className="text-right text-xs text-slate-600 font-semibold">
                    {draftJSON.lembarPengesahan.tempatPenerbitan}, {draftJSON.lembarPengesahan.tanggalPenerbitan}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 text-center pt-4">
                    <div className="space-y-12">
                      <span className="text-xs font-bold text-slate-600 block">MENGETAHUI,</span>
                      <span className="text-xs font-semibold text-slate-800 block">
                        {draftJSON.lembarPengesahan.pejabatDivisionHead.jabatan}
                      </span>
                      <div className="pt-4 border-b border-slate-300 w-48 mx-auto" />
                      <div>
                        <strong className="text-xs font-bold text-slate-900 block">
                          {draftJSON.lembarPengesahan.pejabatDivisionHead.nama}
                        </strong>
                      </div>
                    </div>

                    <div className="space-y-12">
                      <span className="text-xs font-bold text-slate-600 block invisible">MENGETAHUI,</span>
                      <span className="text-xs font-semibold text-slate-800 block">
                        {draftJSON.lembarPengesahan.pejabatDepartmentHead.jabatan}
                      </span>
                      <div className="pt-4 border-b border-slate-300 w-48 mx-auto" />
                      <div>
                        <strong className="text-xs font-bold text-slate-900 block">
                          {draftJSON.lembarPengesahan.pejabatDepartmentHead.nama}
                        </strong>
                      </div>
                    </div>
                  </div>
                </div>
              )}

            </div>
          )}

          {/* TAB 2: RAW JSON VIEWER */}
          {activeTab === 'json' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-4">
                <div className="relative flex-1 max-w-md">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={jsonSearch}
                    onChange={(e) => setJsonSearch(e.target.value)}
                    placeholder="Cari kunci atau nilai di dalam JSON..."
                    className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
                <div className="text-xs text-slate-500 font-mono">
                  {jsonString.split('\n').length} baris JSON
                </div>
              </div>

              <div className="relative bg-slate-900 text-slate-100 rounded-xl p-4 font-mono text-xs overflow-x-auto max-h-[65vh] border border-slate-800 shadow-inner">
                <pre className="leading-relaxed">
                  {jsonString}
                </pre>
              </div>
            </div>
          )}

          {/* TAB 3: TEMPLATE INTEGRATION GUIDE */}
          {activeTab === 'template' && (
            <div className="space-y-6 max-w-4xl mx-auto">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                <h3 className="font-bold text-slate-900 text-sm sm:text-base flex items-center gap-2">
                  <Layers className="w-4 h-4 text-sky-600" />
                  Panduan Integrasi Template Word (.docx) &amp; PDF
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {draftJSON.templateIntegrationGuide.deskripsi}
                </p>
              </div>

              {/* Single Tag Placeholders */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider text-sky-700">
                  Tag Nilai Tunggal (Direct Field Substitutions):
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {Object.entries(draftJSON.templateIntegrationGuide.wordDocxPlaceholders).map(([label, tag]) => (
                    <div key={label} className="p-2.5 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-between gap-2">
                      <span className="text-slate-700 font-semibold">{label}</span>
                      <code className="px-2 py-0.5 rounded bg-sky-100 text-sky-800 font-mono font-bold text-[11px]">
                        {tag}
                      </code>
                    </div>
                  ))}
                </div>
              </div>

              {/* Loop / Table Tags */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider text-emerald-700">
                  Tag Perulangan Tabel / Array (Docx Loop Tags):
                </h4>
                <div className="space-y-2 text-xs">
                  {Object.entries(draftJSON.templateIntegrationGuide.loopTagsGuide).map(([label, tag]) => (
                    <div key={label} className="p-3 rounded-lg border border-slate-200 bg-slate-50 space-y-1">
                      <span className="text-slate-800 font-bold block">{label}</span>
                      <code className="px-2 py-1 rounded bg-emerald-100 text-emerald-900 font-mono text-[11px] block overflow-x-auto whitespace-pre">
                        {tag}
                      </code>
                    </div>
                  ))}
                </div>
              </div>

              {/* Integration Snippet */}
              <div className="bg-slate-900 text-slate-200 p-4 rounded-xl border border-slate-800 space-y-2 text-xs font-mono">
                <div className="flex items-center justify-between text-slate-400">
                  <span>Contoh Integrasi NodeJS docxtemplater:</span>
                </div>
                <pre className="text-[11px] text-amber-300 leading-relaxed overflow-x-auto">
{`import Docxtemplater from 'docxtemplater';
import PizZip from 'pizzip';
import fs from 'fs';

// 1. Baca template resmi Word (.docx)
const content = fs.readFileSync('Template_Laporan_Bulanan_WHMS.docx', 'binary');
const zip = new PizZip(content);
const doc = new Docxtemplater(zip, { paragraphLoop: true, linebreaks: true });

// 2. Suntikkan langsung objek JSON draft yang dihasilkan otomatis
const reportDraftJSON = JSON.parse(fs.readFileSync('Laporan_Bulanan_Draft.json', 'utf8'));
doc.render(reportDraftJSON);

// 3. Simpan dokumen hasil render siap cetak/tanda tangan
const buf = doc.getZip().generate({ type: 'nodebuffer', compression: 'DEFLATE' });
fs.writeFileSync('Laporan_Bulanan_WHMS_Final.docx', buf);`}
                </pre>
              </div>
            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="bg-white px-6 py-3 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="text-slate-500 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Format ICAO Doc 9137 Part 3 &amp; KP 434 Terverifikasi</span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={handleCopyJSON}
              className="flex-1 sm:flex-none px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Tersalin ke Clipboard!' : 'Salin JSON'}
            </button>

            <button
              onClick={handleDownloadJSON}
              className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-semibold flex items-center justify-center gap-1.5 shadow-sm transition cursor-pointer"
            >
              <Download className="w-4 h-4" />
              Unduh File JSON
            </button>

            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold transition cursor-pointer"
            >
              Tutup
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
