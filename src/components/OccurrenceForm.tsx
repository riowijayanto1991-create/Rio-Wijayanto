import React, { useState, useEffect, useMemo } from 'react';
import { 
  ShieldAlert, 
  Save, 
  Download, 
  Share2, 
  CheckCircle2, 
  Plus, 
  Trash2, 
  FileSpreadsheet,
  AlertTriangle,
  Edit3,
  X,
  Sparkles,
  Calendar,
  Users,
  RotateCcw,
  Bookmark
} from 'lucide-react';
import { getActiveDutyInfo } from '../utils/dutyRosterService';
import { OccurrenceReport, Pleton, Dinas, Cuaca, OccurrenceStatus } from '../types';
import { exportOccurrencePDF } from '../utils/pdfExport';
import { DateTimeCalendarPicker } from './DateTimeCalendarPicker';
import { DocumentationUpload } from './DocumentationUpload';
import { IncidentLocationPickerModal } from './IncidentLocationPickerModal';
import { MapPin, Navigation } from 'lucide-react';
import { generateSequentialReportNumber, formatReportCreationTime } from '../utils/reportNumberGenerator';
import { WHMP_ZONES } from '../config/whmpRiskConfig';

interface OccurrenceFormProps {
  onSaveReport: (report: OccurrenceReport) => void;
  onOpenBroadcast: (report: OccurrenceReport) => void;
  onNavigateToHistory?: () => void;
  initialData?: OccurrenceReport | null;
  isEditMode?: boolean;
  onCancelEdit?: () => void;
  onOpenDutyRoster?: () => void;
  existingReports?: OccurrenceReport[];
}

export const OccurrenceForm: React.FC<OccurrenceFormProps> = ({
  onSaveReport,
  onOpenBroadcast,
  onNavigateToHistory,
  initialData,
  isEditMode = false,
  onCancelEdit,
  onOpenDutyRoster,
  existingReports = []
}) => {
  const [createdAt] = useState<string>(() => initialData?.createdAt || new Date().toISOString());
  const [reportNumber, setReportNumber] = useState<string>(() => {
    if (initialData?.reportNumber) return initialData.reportNumber;
    return generateSequentialReportNumber('OCC', existingReports, initialData?.createdAt || new Date().toISOString());
  });

  useEffect(() => {
    if (!initialData && !isEditMode) {
      setReportNumber(generateSequentialReportNumber('OCC', existingReports, createdAt));
    }
  }, [existingReports, initialData, isEditMode, createdAt]);

  // I. Data Occurrence
  const [hariTanggal, setHariTanggal] = useState<string>(initialData?.hariTanggal || '');
  const [waktuKejadian, setWaktuKejadian] = useState<string>(initialData?.waktuKejadian || '');
  const [pleton, setPleton] = useState<Pleton>(initialData?.pleton || 'Pleton Alpha');
  const [dinas, setDinas] = useState<Dinas>(initialData?.dinas || 'Dinas Pagi (08:00 - 20:00)');
  const [pod, setPod] = useState<string>(initialData?.pod || '');

  // Auto Roster Synchronization
  const [autoRosterSync, setAutoRosterSync] = useState<boolean>(!initialData);

  const startTimeFromKejadian = useMemo(() => {
    const match = waktuKejadian.match(/(\d{1,2}:\d{2})/);
    return match ? match[1] : '';
  }, [waktuKejadian]);

  const calculatedRoster = useMemo(() => {
    return getActiveDutyInfo(hariTanggal, startTimeFromKejadian);
  }, [hariTanggal, startTimeFromKejadian]);

  // Synchronize pleton and dinas automatically when date/time changes
  useEffect(() => {
    if (autoRosterSync && !isEditMode) {
      setPleton(calculatedRoster.pleton);
      setDinas(calculatedRoster.dinas);
    }
  }, [calculatedRoster, autoRosterSync, isEditMode]);
  const [lokasi, setLokasi] = useState<string>(initialData?.lokasi || '');
  const [gridLocation, setGridLocation] = useState<string>(initialData?.gridLocation || '');
  const [runwayTaxiwayArea, setRunwayTaxiwayArea] = useState<string>(initialData?.runwayTaxiwayArea || '');
  const [jenisOccurrence, setJenisOccurrence] = useState<string>(initialData?.jenisOccurrence || '');
  const [coordinates, setCoordinates] = useState<{ latitude: number; longitude: number; distanceFromArpKm?: number } | undefined>(
    initialData?.coordinates
  );
  const [whmpZoneId, setWhmpZoneId] = useState<string>(initialData?.whmpZoneId || 'zone-1');
  const [isMapPickerOpen, setIsMapPickerOpen] = useState<boolean>(false);

  // II. Kronologi Kejadian
  const [kronologi, setKronologi] = useState<string>(initialData?.kronologi || '');

  // III. Identifikasi Satwa
  const [jenisSatwa, setJenisSatwa] = useState<string>(initialData?.jenisSatwa || '');
  const [jumlahSatwa, setJumlahSatwa] = useState<number>(initialData?.jumlahSatwa || 0);
  const [kondisiSatwa, setKondisiSatwa] = useState<'Hidup' | 'Mati' | 'Terluka' | 'Tidak teridentifikasi'>(
    initialData?.kondisiSatwa || 'Hidup'
  );
  const [aktivitasPergerakan, setAktivitasPergerakan] = useState<string>(initialData?.aktivitasPergerakan || '');

  // IV. Kondisi Operasional
  const [cuaca, setCuaca] = useState<Cuaca>(initialData?.cuaca || 'Cerah');
  const [suhu, setSuhu] = useState<string>(initialData?.suhu || '');
  const [visibility, setVisibility] = useState<string>(initialData?.visibility || '');
  const [kondisiRunwayTaxiway, setKondisiRunwayTaxiway] = useState<string>(initialData?.kondisiRunwayTaxiway || '');
  const [aktivitasPergerakanPesawat, setAktivitasPergerakanPesawat] = useState<string>(
    initialData?.aktivitasPergerakanPesawat || ''
  );

  // V. Potensi Hazard
  const [jenisPotensiHazard, setJenisPotensiHazard] = useState<string>(initialData?.jenisPotensiHazard || '');
  const [potensiDampakOperasi, setPotensiDampakOperasi] = useState<string>(initialData?.potensiDampakOperasi || '');

  // VI. Tindakan yang Dilakukan
  const [deteksiMonitoring, setDeteksiMonitoring] = useState<string>(initialData?.tindakan?.deteksiMonitoring || '');
  const [mobileDispersal, setMobileDispersal] = useState<string>(initialData?.tindakan?.mobileDispersal || '');
  const [auditoryVisualDeterrent, setAuditoryVisualDeterrent] = useState<string>(initialData?.tindakan?.auditoryVisualDeterrent || '');
  const [koordinasi, setKoordinasi] = useState<string>(initialData?.tindakan?.koordinasi || '');
  const [tindakanLainnya, setTindakanLainnya] = useState<string>(initialData?.tindakan?.tindakanLainnya || '');

  // VII. Hasil Penanganan
  const [hasilPenanganan, setHasilPenanganan] = useState<string>(initialData?.hasilPenanganan || '');
  const [status, setStatus] = useState<OccurrenceStatus>(initialData?.status || 'Selesai');

  // VIII. Rekomendasi / Mitigasi
  const [mitigasiList, setMitigasiList] = useState<string[]>(
    initialData?.rekomendasiMitigasi && initialData.rekomendasiMitigasi.length > 0 ? initialData.rekomendasiMitigasi : ['']
  );

  // IX. Dokumentasi
  const [fotoVideoAda, setFotoVideoAda] = useState<boolean>(initialData?.fotoVideoAda ?? (initialData?.fotos && initialData.fotos.length > 0) ?? false);
  const [keteranganDokumentasi, setKeteranganDokumentasi] = useState<string>(initialData?.keteranganDokumentasi || '');
  const [fotos, setFotos] = useState<string[]>(initialData?.fotos || []);

  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  // Populate form if initialData is provided (Edit Mode)
  useEffect(() => {
    if (initialData) {
      setHariTanggal(initialData.hariTanggal || '');
      setWaktuKejadian(initialData.waktuKejadian || '');
      setPleton(initialData.pleton || 'Pleton Alpha');
      setDinas(initialData.dinas || 'Dinas Pagi (08:00 - 20:00)');
      setPod(initialData.pod || '');
      setLokasi(initialData.lokasi || '');
      setGridLocation(initialData.gridLocation || '');
      setRunwayTaxiwayArea(initialData.runwayTaxiwayArea || '');
      setJenisOccurrence(initialData.jenisOccurrence || '');
      setKronologi(initialData.kronologi || '');
      setJenisSatwa(initialData.jenisSatwa || '');
      setJumlahSatwa(initialData.jumlahSatwa ?? 1);
      setKondisiSatwa(initialData.kondisiSatwa || 'Hidup');
      setAktivitasPergerakan(initialData.aktivitasPergerakan || '');
      setCuaca(initialData.cuaca || 'Cerah');
      setSuhu(initialData.suhu || '28°C');
      setVisibility(initialData.visibility || '');
      setKondisiRunwayTaxiway(initialData.kondisiRunwayTaxiway || '');
      setAktivitasPergerakanPesawat(initialData.aktivitasPergerakanPesawat || '');
      setJenisPotensiHazard(initialData.jenisPotensiHazard || '');
      setPotensiDampakOperasi(initialData.potensiDampakOperasi || '');
      if (initialData.tindakan) {
        setDeteksiMonitoring(initialData.tindakan.deteksiMonitoring || '');
        setMobileDispersal(initialData.tindakan.mobileDispersal || '');
        setAuditoryVisualDeterrent(initialData.tindakan.auditoryVisualDeterrent || '');
        setKoordinasi(initialData.tindakan.koordinasi || '');
        setTindakanLainnya(initialData.tindakan.tindakanLainnya || '');
      }
      setHasilPenanganan(initialData.hasilPenanganan || '');
      setStatus(initialData.status || 'Selesai');
      if (initialData.rekomendasiMitigasi) {
        setMitigasiList(initialData.rekomendasiMitigasi);
      }
      setFotoVideoAda(!!(initialData.fotoVideoAda || (initialData.fotos && initialData.fotos.length > 0)));
      setKeteranganDokumentasi(initialData.keteranganDokumentasi || '');
      setFotos(initialData.fotos || []);
      setCoordinates(initialData.coordinates);
      setWhmpZoneId(initialData.whmpZoneId || 'zone-1');
      setSavedSuccess(false);
    }
  }, [initialData]);

  const currentReport: OccurrenceReport = {
    id: initialData?.id || `occ-${Date.now()}`,
    reportNumber,
    createdAt,
    updatedAt: new Date().toISOString(),
    hariTanggal,
    waktuKejadian,
    pleton,
    dinas,
    pod,
    lokasi,
    gridLocation,
    whmpZoneId,
    whmpZoneName: WHMP_ZONES.find(z => z.id === whmpZoneId)?.name || 'Zona 1: Runway Strips & RESA',
    whmpZoneIsCritical: WHMP_ZONES.find(z => z.id === whmpZoneId)?.isCritical ?? true,
    runwayTaxiwayArea,
    coordinates,
    jenisOccurrence,
    kronologi,
    jenisSatwa,
    jumlahSatwa,
    kondisiSatwa,
    aktivitasPergerakan,
    cuaca,
    suhu,
    visibility,
    kondisiRunwayTaxiway,
    aktivitasPergerakanPesawat,
    jenisPotensiHazard,
    potensiDampakOperasi,
    tindakan: {
      deteksiMonitoring,
      mobileDispersal,
      auditoryVisualDeterrent,
      koordinasi,
      tindakanLainnya
    },
    hasilPenanganan,
    status,
    rekomendasiMitigasi: mitigasiList.filter(m => m.trim() !== ''),
    fotoVideoAda: fotoVideoAda || (fotos && fotos.length > 0),
    keteranganDokumentasi,
    fotos
  };

  const [isLastSavedDraft, setIsLastSavedDraft] = useState<boolean>(false);
  const [hasAutoDraft, setHasAutoDraft] = useState<boolean>(false);
  const [autoDraftTimestamp, setAutoDraftTimestamp] = useState<string>('');

  // Check for auto-saved draft in localStorage on mount
  useEffect(() => {
    if (!initialData) {
      try {
        const raw = localStorage.getItem('whu_draft_occ_auto');
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && (parsed.hariTanggal || parsed.kronologi || parsed.jenisSatwa || (parsed.pod && parsed.pod.trim() !== ''))) {
            setHasAutoDraft(true);
            setAutoDraftTimestamp(parsed._savedAt || '');
          }
        }
      } catch {}
    }
  }, [initialData]);

  const loadAutoDraft = () => {
    try {
      const raw = localStorage.getItem('whu_draft_occ_auto');
      if (raw) {
        const d = JSON.parse(raw);
        if (d.hariTanggal) setHariTanggal(d.hariTanggal);
        if (d.waktuKejadian) setWaktuKejadian(d.waktuKejadian);
        if (d.pleton) setPleton(d.pleton);
        if (d.dinas) setDinas(d.dinas);
        if (d.pod) setPod(d.pod);
        if (d.lokasi) setLokasi(d.lokasi);
        if (d.gridLocation) setGridLocation(d.gridLocation);
        if (d.whmpZoneId) setWhmpZoneId(d.whmpZoneId);
        if (d.runwayTaxiwayArea) setRunwayTaxiwayArea(d.runwayTaxiwayArea);
        if (d.coordinates) setCoordinates(d.coordinates);
        if (d.jenisOccurrence) setJenisOccurrence(d.jenisOccurrence);
        if (d.kronologi) setKronologi(d.kronologi);
        if (d.jenisSatwa) setJenisSatwa(d.jenisSatwa);
        if (d.jumlahSatwa) setJumlahSatwa(d.jumlahSatwa);
        if (d.kondisiSatwa) setKondisiSatwa(d.kondisiSatwa);
        if (d.aktivitasPergerakan) setAktivitasPergerakan(d.aktivitasPergerakan);
        if (d.cuaca) setCuaca(d.cuaca);
        if (d.suhu) setSuhu(d.suhu);
        if (d.visibility) setVisibility(d.visibility);
        if (d.kondisiRunwayTaxiway) setKondisiRunwayTaxiway(d.kondisiRunwayTaxiway);
        if (d.aktivitasPergerakanPesawat) setAktivitasPergerakanPesawat(d.aktivitasPergerakanPesawat);
        if (d.jenisPotensiHazard) setJenisPotensiHazard(d.jenisPotensiHazard);
        if (d.potensiDampakOperasi) setPotensiDampakOperasi(d.potensiDampakOperasi);
        if (d.deteksiMonitoring) setDeteksiMonitoring(d.deteksiMonitoring);
        if (d.mobileDispersal) setMobileDispersal(d.mobileDispersal);
        if (d.auditoryVisualDeterrent) setAuditoryVisualDeterrent(d.auditoryVisualDeterrent);
        if (d.koordinasi) setKoordinasi(d.koordinasi);
        if (d.tindakanLainnya) setTindakanLainnya(d.tindakanLainnya);
        if (d.hasilPenanganan) setHasilPenanganan(d.hasilPenanganan);
        if (d.status) setStatus(d.status);
        if (d.mitigasiList) setMitigasiList(d.mitigasiList);
        if (d.keteranganDokumentasi) setKeteranganDokumentasi(d.keteranganDokumentasi);
        if (d.fotos) setFotos(d.fotos);
        setHasAutoDraft(false);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const discardAutoDraft = () => {
    try {
      localStorage.removeItem('whu_draft_occ_auto');
    } catch {}
    setHasAutoDraft(false);
  };

  // Debounced auto-save draft locally while filling
  useEffect(() => {
    if (!initialData && !savedSuccess) {
      const timer = setTimeout(() => {
        try {
          if (hariTanggal || kronologi || jenisSatwa || pod.trim() !== '') {
            const draftData = {
              hariTanggal,
              waktuKejadian,
              pleton,
              dinas,
              pod,
              lokasi,
              gridLocation,
              whmpZoneId,
              runwayTaxiwayArea,
              coordinates,
              jenisOccurrence,
              kronologi,
              jenisSatwa,
              jumlahSatwa,
              kondisiSatwa,
              aktivitasPergerakan,
              cuaca,
              suhu,
              visibility,
              kondisiRunwayTaxiway,
              aktivitasPergerakanPesawat,
              jenisPotensiHazard,
              potensiDampakOperasi,
              deteksiMonitoring,
              mobileDispersal,
              auditoryVisualDeterrent,
              koordinasi,
              tindakanLainnya,
              hasilPenanganan,
              status,
              mitigasiList,
              keteranganDokumentasi,
              fotos,
              _savedAt: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
            };
            localStorage.setItem('whu_draft_occ_auto', JSON.stringify(draftData));
          }
        } catch {}
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [
    initialData,
    savedSuccess,
    hariTanggal,
    waktuKejadian,
    pleton,
    dinas,
    pod,
    lokasi,
    gridLocation,
    runwayTaxiwayArea,
    coordinates,
    jenisOccurrence,
    kronologi,
    jenisSatwa,
    jumlahSatwa,
    kondisiSatwa,
    aktivitasPergerakan,
    cuaca,
    suhu,
    visibility,
    kondisiRunwayTaxiway,
    aktivitasPergerakanPesawat,
    jenisPotensiHazard,
    potensiDampakOperasi,
    deteksiMonitoring,
    mobileDispersal,
    auditoryVisualDeterrent,
    koordinasi,
    tindakanLainnya,
    hasilPenanganan,
    status,
    mitigasiList,
    keteranganDokumentasi,
    fotos
  ]);

  const executeSave = (asDraft: boolean = false) => {
    const finalReport: OccurrenceReport = {
      ...currentReport,
      id: initialData?.id || `occ-${Date.now()}`,
      reportNumber: reportNumber,
      createdAt: createdAt,
      updatedAt: new Date().toISOString(),
      isDraft: asDraft,
      draftSavedAt: asDraft ? new Date().toISOString() : undefined,
      fotoVideoAda: fotoVideoAda || (fotos && fotos.length > 0),
      keteranganDokumentasi,
      fotos,
      pod: pod.trim() !== '' ? pod : (asDraft ? 'Petugas WHU (Draft)' : 'Petugas Pelapor WHU')
    };
    onSaveReport(finalReport);
    setIsLastSavedDraft(asDraft);
    setSavedSuccess(true);
    try {
      localStorage.removeItem('whu_draft_occ_auto');
    } catch {}
  };

  const handleSaveDraft = () => {
    executeSave(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    executeSave(false);
  };

  return (
    <form onSubmit={handleSave} className="max-w-4xl mx-auto bg-white rounded-xl border border-slate-200 shadow-sm p-6 sm:p-8 text-slate-800 space-y-8">
      {/* Official Header */}
      <div className="border-b border-amber-300 pb-5">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div>
            <span className="text-xs font-bold text-amber-800 uppercase tracking-widest">
              PT ANGKASA PURA INDONESIA - ARFF DIVISION
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-0.5 uppercase">
              {isEditMode ? 'EDIT WHR — WILDLIFE HAZARD REPORT' : '2. WHR — WILDLIFE HAZARD REPORT'}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Identifikasi bahaya, evaluasi risiko, dan mitigasi • Unit Wildlife Hazard (WHS)
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0 flex-wrap justify-center sm:justify-end">
            <button
              type="button"
              onClick={handleSaveDraft}
              className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition shadow-xs cursor-pointer"
              title="Simpan sementara sebagai draft agar bisa dilanjutkan nanti tanpa validasi ketat"
            >
              <Bookmark className="w-4 h-4 fill-current" />
              <span>Simpan Draft</span>
            </button>
            <button
              type="button"
              onClick={() => exportOccurrencePDF(currentReport)}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
              title="Download format PDF resmi"
            >
              <Download className="w-3.5 h-3.5 text-amber-600" />
              <span>PDF</span>
            </button>
          </div>
        </div>
      </div>

      {/* Auto Draft Recovery Banner */}
      {hasAutoDraft && !initialData && (
        <div className="p-4 rounded-xl bg-amber-50 border-2 border-amber-300 text-amber-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm animate-in fade-in">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-amber-600 text-white rounded-lg shrink-0">
              <Bookmark className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-sm text-amber-950">Draft Tersimpan Ditemukan</p>
              <p className="text-xs text-amber-800 mt-0.5">
                Terdapat data draft occurrence yang belum diselesaikan (tersimpan otomatis pukul {autoDraftTimestamp || 'sebelumnya'}). Ingin melanjutkan pengisian?
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
            <button
              type="button"
              onClick={discardAutoDraft}
              className="flex-1 sm:flex-initial px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg text-xs font-semibold cursor-pointer transition"
            >
              Abaikan
            </button>
            <button
              type="button"
              onClick={loadAutoDraft}
              className="flex-1 sm:flex-initial px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold cursor-pointer transition shadow-xs"
            >
              Pulihkan Draft
            </button>
          </div>
        </div>
      )}

      {/* Draft Mode Alert Banner (opened from History) */}
      {initialData?.isDraft && (
        <div className="p-4 rounded-xl bg-amber-500/15 border-2 border-amber-400 text-amber-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-amber-600 text-white rounded-lg shrink-0">
              <Bookmark className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-sm text-slate-900">Mode Edit Draft WHR (Hazard Report)</span>
                <span className="px-2 py-0.5 bg-amber-200 text-amber-900 font-mono font-bold rounded text-[11px] border border-amber-300">
                  DRAFT WHR • {initialData.reportNumber}
                </span>
                {initialData.draftSavedAt && (
                  <span className="text-[11px] text-amber-800 font-medium">
                    (Draft disimpan: {new Date(initialData.draftSavedAt).toLocaleString('id-ID')})
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-600 mt-0.5">
                Dokumen ini berstatus <strong>Draft Sementara</strong>. Anda dapat memperbarui draft ini atau klik <strong>"Terbitkan Laporan Resmi"</strong> saat seluruh data telah lengkap.
              </p>
            </div>
          </div>

          {onCancelEdit && (
            <button
              type="button"
              onClick={onCancelEdit}
              className="px-3.5 py-1.5 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-xs shrink-0"
            >
              <X className="w-3.5 h-3.5" />
              <span>Tutup Draft</span>
            </button>
          )}
        </div>
      )}

      {/* Edit Mode Alert Banner (published) */}
      {isEditMode && initialData && !initialData.isDraft && (
        <div className="p-4 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-amber-500 text-white rounded-lg shrink-0">
              <Edit3 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-sm text-slate-900">Mode Edit Dokumen WHR (Hazard Report)</span>
                <span className="px-2 py-0.5 bg-amber-200 text-amber-900 font-mono font-bold rounded text-[11px] border border-amber-300">
                  {initialData.reportNumber}
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-0.5">
                Anda sedang mengubah laporan occurrence yang sudah tersimpan. Klik "Simpan Perubahan Laporan" untuk memperbarui data arsip.
              </p>
            </div>
          </div>

          {onCancelEdit && (
            <button
              type="button"
              onClick={onCancelEdit}
              className="px-3.5 py-1.5 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-xs shrink-0"
            >
              <X className="w-3.5 h-3.5" />
              <span>Batal Edit</span>
            </button>
          )}
        </div>
      )}

      {savedSuccess && (
        <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-300 text-emerald-800 flex items-center justify-between text-sm">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <span>
              <strong>{isEditMode ? 'Perubahan Berhasil Diperbarui!' : 'Berhasil Disimpan!'}</strong> Laporan Occurrence telah tercatat ke sistem dan dashboard.
            </span>
          </div>
          <button
            type="button"
            onClick={() => onOpenBroadcast(currentReport)}
            className="px-3 py-1 bg-amber-700 hover:bg-amber-800 text-white rounded text-xs font-semibold flex items-center gap-1 cursor-pointer"
          >
            <Share2 className="w-3.5 h-3.5" />
            Kirim Broadcast WA
          </button>
        </div>
      )}

      {/* Nomor Dokumen Resmi & Urutan Kronologis */}
      <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-700">No. Dokumen PDF:</span>
          <span className="font-mono font-bold text-amber-950 bg-white px-2.5 py-1 rounded-md border border-amber-300 shadow-2xs">
            {reportNumber}
          </span>
        </div>
        <span className="text-[11px] text-slate-500">
          Penomoran otomatis berurutan sesuai waktu pembuatan ({formatReportCreationTime(createdAt)})
        </span>
      </div>

      {/* I. DATA OCCURRENCE */}
      <div className="space-y-4">
        <div className="bg-amber-50 px-3 py-1.5 rounded text-sm font-bold text-amber-900 border-l-4 border-amber-600">
          I. DATA OCCURRENCE
        </div>

        {/* Kalender & Waktu Kejadian */}
        <DateTimeCalendarPicker
          hariTanggal={hariTanggal}
          onHariTanggalChange={setHariTanggal}
          mode="single"
          waktu={waktuKejadian}
          onWaktuChange={setWaktuKejadian}
          accentColor="amber"
        />

        {/* Smart Roster Indicator Banner */}
        <div className="bg-amber-50/80 border border-amber-200 rounded-lg p-3 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 bg-amber-600 text-white rounded-md shrink-0">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-amber-950">Roster Otomatis CGK:</span>
                <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                  {calculatedRoster.pleton}
                </span>
                <span className="text-slate-600">
                  • {calculatedRoster.dinas} ({calculatedRoster.shiftCode})
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {autoRosterSync 
                  ? 'Pleton dan dinas otomatis disinkronkan berdasarkan tanggal & waktu kejadian.' 
                  : 'Mode manual aktif (Roster otomatis dijeda).'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap shrink-0">
            {!autoRosterSync ? (
              <button
                type="button"
                onClick={() => {
                  setAutoRosterSync(true);
                  setPleton(calculatedRoster.pleton);
                  setDinas(calculatedRoster.dinas);
                }}
                className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded font-semibold text-[11px] flex items-center gap-1 cursor-pointer transition shadow-2xs"
                title="Aktifkan kembali sinkronisasi otomatis sesuai roster"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset ke Roster</span>
              </button>
            ) : null}

            {onOpenDutyRoster && (
              <button
                type="button"
                onClick={onOpenDutyRoster}
                className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded font-semibold text-[11px] flex items-center gap-1 cursor-pointer transition"
                title="Lihat kalender jadwal dinas lengkap resmi WHU"
              >
                <Calendar className="w-3 h-3 text-amber-600" />
                <span>Jadwal Roster</span>
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-semibold text-slate-700">Pleton</label>
              {autoRosterSync && (
                <span className="text-[10px] text-amber-600 font-medium">Otomatis Roster</span>
              )}
            </div>
            <select
              value={pleton}
              onChange={e => {
                setPleton(e.target.value as Pleton);
                setAutoRosterSync(false);
              }}
              className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-amber-500 bg-white"
            >
              <option value="Pleton Alpha">Pleton Alpha</option>
              <option value="Pleton Bravo">Pleton Bravo</option>
              <option value="Pleton Charlie">Pleton Charlie</option>
              <option value="Pleton Delta">Pleton Delta</option>
            </select>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-semibold text-slate-700">Dinas</label>
              {autoRosterSync && (
                <span className="text-[10px] text-amber-600 font-medium">Otomatis Waktu</span>
              )}
            </div>
            <select
              value={dinas}
              onChange={e => {
                setDinas(e.target.value as Dinas);
                setAutoRosterSync(false);
              }}
              className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-amber-500 bg-white"
            >
              <option value="Dinas Pagi (08:00 - 20:00)">Dinas Pagi (08:00 - 20:00)</option>
              <option value="Dinas Malam (20:00 - 08:00)">Dinas Malam (20:00 - 08:00)</option>
            </select>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-semibold text-slate-700">
                Petugas Pelapor / Pelaksana
              </label>
              <span className="text-[10px] text-slate-400">Piket WHU</span>
            </div>
            <input
              type="text"
              value={pod}
              onChange={e => setPod(e.target.value)}
              placeholder="Ketik Nama Petugas Pelapor..."
              className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-amber-500 bg-white"
            />
            {/* Quick chips of roster personnel */}
            {calculatedRoster.personnel.length > 0 && (
              <div className="mt-1.5 flex items-center gap-1 flex-wrap">
                <span className="text-[10px] text-slate-500">Pilih Cepat:</span>
                {calculatedRoster.personnel.map((p, pIdx) => {
                  const label = `${p.nama} (${p.nik})`;
                  return (
                    <button
                      key={p.nik || `occurrence-personnel-${pIdx}`}
                      type="button"
                      onClick={() => setPod(label)}
                      className={`px-1.5 py-0.5 rounded text-[10px] border transition cursor-pointer ${
                        pod === label 
                          ? 'bg-amber-700 text-white border-amber-800' 
                          : 'bg-white hover:bg-amber-50 text-slate-700 border-slate-300'
                      }`}
                    >
                      {p.nama}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Interactive Map Location Pinpoint Trigger */}
          <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
            <div>
              <div className="flex items-center gap-1.5 font-bold text-amber-900 text-xs">
                <MapPin className="w-4 h-4 text-amber-700" />
                <span>Pemetaan Titik &amp; Area Kejadian (Peta Interaktif)</span>
              </div>
              <p className="text-[11px] text-amber-700/80 mt-0.5">
                {coordinates ? (
                  <span className="font-mono font-bold text-amber-900">
                    GPS: {coordinates.latitude}, {coordinates.longitude} ({coordinates.distanceFromArpKm} km dari ARP)
                  </span>
                ) : (
                  'Tandai titik lokasi kejadian langsung di peta airside untuk mendapatkan koordinat presisi.'
                )}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsMapPickerOpen(true)}
              className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer shrink-0"
            >
              <Navigation className="w-3.5 h-3.5" />
              <span>{coordinates ? 'Ubah Titik di Peta' : '📍 Tandai di Peta'}</span>
            </button>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Lokasi Detail</label>
            <input
              type="text"
              value={lokasi}
              onChange={e => setLokasi(e.target.value)}
              placeholder="e.g. Threshold Runway 25L"
              className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-amber-500"
              required
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1 flex items-center justify-between">
              <span>Koordinat Grid Map CGK 2025</span>
              <span className="text-[10px] text-amber-700 font-mono">14 Col × 7 Row (A-G)</span>
            </label>
            <div className="flex space-x-2">
              <input
                type="text"
                value={gridLocation}
                onChange={e => setGridLocation(e.target.value)}
                placeholder="e.g. Grid G12"
                className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-amber-500 font-mono font-bold text-amber-900"
              />
              <select
                onChange={e => setGridLocation(e.target.value)}
                className="px-2 py-2 border border-slate-300 rounded bg-slate-50 text-xs font-mono"
                defaultValue=""
              >
                <option value="" disabled>Pilih Grid...</option>
                <optgroup label="Runway 3 (06-24)">
                  <option value="Grid A4">Grid A4 (THR 06)</option>
                  <option value="Grid A7">Grid A7 (Mid RWY 3)</option>
                  <option value="Grid A11">Grid A11 (THR 24)</option>
                </optgroup>
                <optgroup label="Runway 2 (07L-25R)">
                  <option value="Grid B3">Grid B3 (THR 07L)</option>
                  <option value="Grid C5">Grid C5 (TWY Alpha 2)</option>
                  <option value="Grid C8">Grid C8 (TWY C3)</option>
                  <option value="Grid C12">Grid C12 (THR 25R)</option>
                </optgroup>
                <optgroup label="Runway 1 (07R-25L)">
                  <option value="Grid F3">Grid F3 (THR 07R)</option>
                  <option value="Grid F7">Grid F7 (Infield RWY 1)</option>
                  <option value="Grid G12">Grid G12 (THR 25L)</option>
                </optgroup>
                <optgroup label="Apron & Terminals">
                  <option value="Grid E7">Grid E7 (Terminal 1)</option>
                  <option value="Grid D7">Grid D7 (Terminal 2)</option>
                  <option value="Grid D11">Grid D11 (Terminal 3)</option>
                </optgroup>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Runway / Taxiway / Area</label>
            <input
              type="text"
              value={runwayTaxiwayArea}
              onChange={e => setRunwayTaxiwayArea(e.target.value)}
              placeholder="e.g. RWY 25L Stopway / TWY Alpha"
              className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-amber-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Jenis Occurrence</label>
            <input
              type="text"
              value={jenisOccurrence}
              onChange={e => setJenisOccurrence(e.target.value)}
              placeholder="Deskripsi singkat jenis gangguan..."
              className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-amber-500"
              required
            />
          </div>

          {/* Alokasi Zonasi Risiko WHMP (Bab II) */}
          <div className="sm:col-span-2 bg-amber-50/70 border border-amber-200 rounded-lg p-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-800">Alokasi Zonasi Risiko WHMP (Bab II)</span>
                  {WHMP_ZONES.find(z => z.id === whmpZoneId)?.isCritical ? (
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-bold bg-rose-100 text-rose-700 border border-rose-300">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-pulse"></span>
                      CRITICAL ZONE 1-3
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-100 text-emerald-700 border border-emerald-300">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                      NON-CRITICAL ZONE (4-6)
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500">
                  Klasifikasi zona pergerakan satwa liar sesuai dokumen WHMP Soekarno-Hatta (Zona 1–3 prioritas mitigasi kritis).
                </p>
              </div>
              <div className="text-[11px] bg-white border border-amber-200 rounded px-2.5 py-1 text-slate-600 font-mono">
                Cakupan: <span className="font-semibold text-amber-900">{WHMP_ZONES.find(z => z.id === whmpZoneId)?.airsideArea || '-'}</span>
              </div>
            </div>
            <select
              value={whmpZoneId}
              onChange={e => setWhmpZoneId(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-amber-300 rounded bg-white font-medium text-slate-800 focus:ring-1 focus:ring-amber-500"
            >
              {WHMP_ZONES.map(z => (
                <option key={z.id} value={z.id}>
                  {z.name} {z.isCritical ? '⚠️ [CRITICAL ZONE]' : ''} — {z.description}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* II. KRONOLOGI KEJADIAN */}
      <div className="space-y-3">
        <div className="bg-amber-50 px-3 py-1.5 rounded text-sm font-bold text-amber-900 border-l-4 border-amber-600">
          II. KRONOLOGI KEJADIAN
        </div>
        <textarea
          rows={4}
          value={kronologi}
          onChange={e => setKronologi(e.target.value)}
          placeholder="Tuliskan urutan menit demi menit kejadian, pergerakan pesawat, dan tindakan awal..."
          className="w-full px-3 py-2 text-xs border border-slate-300 rounded focus:ring-1 focus:ring-amber-500"
          required
        />
      </div>

      {/* III. IDENTIFIKASI SATWA */}
      <div className="space-y-3">
        <div className="bg-amber-50 px-3 py-1.5 rounded text-sm font-bold text-amber-900 border-l-4 border-amber-600">
          III. IDENTIFIKASI SATWA
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Jenis / Spesies</label>
            <input
              type="text"
              value={jenisSatwa}
              onChange={e => setJenisSatwa(e.target.value)}
              placeholder="e.g. Kuntul Kerbau / Anjing Liar"
              className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-amber-500"
              required
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Jumlah (Ekor)</label>
            <input
              type="number"
              min={1}
              value={jumlahSatwa}
              onChange={e => setJumlahSatwa(parseInt(e.target.value) || 1)}
              className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-amber-500 font-bold"
              required
            />
          </div>
        </div>

        {/* Checkbox Options for Kondisi */}
        <div className="text-xs">
          <label className="block font-semibold text-slate-700 mb-2">Kondisi Satwa :</label>
          <div className="flex flex-wrap gap-4">
            {(['Hidup', 'Mati', 'Terluka', 'Tidak teridentifikasi'] as const).map(option => (
              <label key={option} className="flex items-center space-x-1.5 cursor-pointer font-medium text-slate-700">
                <input
                  type="radio"
                  name="kondisiSatwa"
                  checked={kondisiSatwa === option}
                  onChange={() => setKondisiSatwa(option)}
                  className="w-4 h-4 text-amber-600 focus:ring-amber-500"
                />
                <span>■ {option}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="block font-semibold text-slate-700 text-xs mb-1">Aktivitas / Pergerakan :</label>
          <input
            type="text"
            value={aktivitasPergerakan}
            onChange={e => setAktivitasPergerakan(e.target.value)}
            placeholder="e.g. Bertengger di PAPI Light, terbang menyeberang rwy..."
            className="w-full px-3 py-2 text-xs border border-slate-300 rounded focus:ring-1 focus:ring-amber-500"
          />
        </div>
      </div>

      {/* IV. KONDISI OPERASIONAL */}
      <div className="space-y-3">
        <div className="bg-amber-50 px-3 py-1.5 rounded text-sm font-bold text-amber-900 border-l-4 border-amber-600">
          IV. KONDISI OPERASIONAL
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Cuaca</label>
            <select
              value={cuaca}
              onChange={e => setCuaca(e.target.value as Cuaca)}
              className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-amber-500 bg-white"
            >
              <option value="Cerah">Cerah</option>
              <option value="Berawan">Berawan</option>
              <option value="Hujan Ringan">Hujan Ringan</option>
              <option value="Hujan Lebat">Hujan Lebat</option>
              <option value="Berkabut">Berkabut</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Suhu</label>
            <input
              type="text"
              value={suhu}
              onChange={e => setSuhu(e.target.value)}
              placeholder="28°C"
              className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-amber-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Visibility</label>
            <input
              type="text"
              value={visibility}
              onChange={e => setVisibility(e.target.value)}
              placeholder="> 10 km"
              className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-amber-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Kondisi Runway / Taxiway</label>
            <input
              type="text"
              value={kondisiRunwayTaxiway}
              onChange={e => setKondisiRunwayTaxiway(e.target.value)}
              placeholder="Kering / Basah"
              className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-amber-500"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block font-semibold text-slate-700 mb-1">Aktivitas Pergerakan Pesawat</label>
            <input
              type="text"
              value={aktivitasPergerakanPesawat}
              onChange={e => setAktivitasPergerakanPesawat(e.target.value)}
              placeholder="e.g. Padat (Pesawat mendekati final approach)"
              className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-amber-500"
            />
          </div>
        </div>
      </div>

      {/* V. POTENSI HAZARD */}
      <div className="space-y-3">
        <div className="bg-amber-50 px-3 py-1.5 rounded text-sm font-bold text-amber-900 border-l-4 border-amber-600">
          V. POTENSI HAZARD
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Jenis Potensi Hazard :</label>
            <input
              type="text"
              value={jenisPotensiHazard}
              onChange={e => setJenisPotensiHazard(e.target.value)}
              placeholder="Resiko bird strike engine ingestion..."
              className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-amber-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Potensi Dampak Operasi :</label>
            <input
              type="text"
              value={potensiDampakOperasi}
              onChange={e => setPotensiDampakOperasi(e.target.value)}
              placeholder="Go-around pesawat, runway closed, dll."
              className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-amber-500"
            />
          </div>
        </div>
      </div>

      {/* VI. TINDAKAN YANG DILAKUKAN */}
      <div className="space-y-3">
        <div className="bg-amber-50 px-3 py-1.5 rounded text-sm font-bold text-amber-900 border-l-4 border-amber-600">
          VI. TINDAKAN YANG DILAKUKAN
        </div>

        <div className="space-y-2 text-xs">
          <div>
            <label className="block text-slate-600 mb-0.5">1. Deteksi / monitoring :</label>
            <input
              type="text"
              value={deteksiMonitoring}
              onChange={e => setDeteksiMonitoring(e.target.value)}
              className="w-full px-3 py-1.5 border border-slate-300 rounded focus:ring-1 focus:ring-amber-500"
            />
          </div>
          <div>
            <label className="block text-slate-600 mb-0.5">2. Mobile dispersal :</label>
            <input
              type="text"
              value={mobileDispersal}
              onChange={e => setMobileDispersal(e.target.value)}
              className="w-full px-3 py-1.5 border border-slate-300 rounded focus:ring-1 focus:ring-amber-500"
            />
          </div>
          <div>
            <label className="block text-slate-600 mb-0.5">3. Auditory / visual deterrent :</label>
            <input
              type="text"
              value={auditoryVisualDeterrent}
              onChange={e => setAuditoryVisualDeterrent(e.target.value)}
              className="w-full px-3 py-1.5 border border-slate-300 rounded focus:ring-1 focus:ring-amber-500"
            />
          </div>
          <div>
            <label className="block text-slate-600 mb-0.5">4. Koordinasi :</label>
            <input
              type="text"
              value={koordinasi}
              onChange={e => setKoordinasi(e.target.value)}
              className="w-full px-3 py-1.5 border border-slate-300 rounded focus:ring-1 focus:ring-amber-500"
            />
          </div>
          <div>
            <label className="block text-slate-600 mb-0.5">5. Tindakan lainnya :</label>
            <input
              type="text"
              value={tindakanLainnya}
              onChange={e => setTindakanLainnya(e.target.value)}
              className="w-full px-3 py-1.5 border border-slate-300 rounded focus:ring-1 focus:ring-amber-500"
            />
          </div>
        </div>
      </div>

      {/* VII. HASIL PENANGANAN */}
      <div className="space-y-3">
        <div className="bg-amber-50 px-3 py-1.5 rounded text-sm font-bold text-amber-900 border-l-4 border-amber-600">
          VII. HASIL PENANGANAN
        </div>
        <textarea
          rows={3}
          value={hasilPenanganan}
          onChange={e => setHasilPenanganan(e.target.value)}
          placeholder="Hasil pengusiran atau penanganan..."
          className="w-full px-3 py-2 text-xs border border-slate-300 rounded focus:ring-1 focus:ring-amber-500"
        />

        <div className="text-xs pt-2">
          <label className="block font-semibold text-slate-700 mb-2">Status Penanganan :</label>
          <div className="flex flex-wrap gap-4">
            {(['Selesai', 'Dalam Monitoring', 'Perlu Tindak Lanjut'] as const).map(opt => (
              <label key={opt} className="flex items-center space-x-1.5 cursor-pointer font-semibold text-slate-800">
                <input
                  type="radio"
                  name="statusOccurrence"
                  checked={status === opt}
                  onChange={() => setStatus(opt)}
                  className="w-4 h-4 text-amber-600 focus:ring-amber-500"
                />
                <span>■ {opt}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* VIII. REKOMENDASI / MITIGASI */}
      <div className="space-y-3">
        <div className="flex items-center justify-between bg-amber-50 px-3 py-1.5 rounded border-l-4 border-amber-600">
          <span className="text-sm font-bold text-amber-900">VIII. REKOMENDASI / MITIGASI</span>
          <button
            type="button"
            onClick={() => setMitigasiList([...mitigasiList, ''])}
            className="text-xs text-amber-800 hover:text-amber-900 font-semibold flex items-center gap-1 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> Tambah Rekomendasi
          </button>
        </div>

        <div className="space-y-2">
          {mitigasiList.map((item, idx) => (
            <div key={idx} className="flex items-start space-x-2 text-xs">
              <span className="font-bold text-slate-600 mt-2">{idx + 1}.</span>
              <input
                type="text"
                value={item}
                onChange={e => {
                  const next = [...mitigasiList];
                  next[idx] = e.target.value;
                  setMitigasiList(next);
                }}
                placeholder="Rekomendasi mitigasi..."
                className="flex-1 px-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-amber-500"
              />
              {mitigasiList.length > 1 && (
                <button
                  type="button"
                  onClick={() => setMitigasiList(mitigasiList.filter((_, i) => i !== idx))}
                  className="p-2 text-slate-400 hover:text-red-600"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* IX. DOKUMENTASI */}
      <DocumentationUpload
        photos={fotos}
        onPhotosChange={(newPhotos) => {
          setFotos(newPhotos);
          if (newPhotos.length > 0) setFotoVideoAda(true);
        }}
        keterangan={keteranganDokumentasi}
        onKeteranganChange={setKeteranganDokumentasi}
        maxPhotos={5}
        sectionNumber="IX"
        title="DOKUMENTASI & BUKTI FOTO OCCURRENCE"
        subtitle="Unggah bukti dokumentasi foto kejadian khusus / temuan satwa liar di airside (maksimal 5 foto)."
        placeholderKeterangan="Catatan dokumentasi kejadian (misal: Foto 1: Biawak berukuran 1.5m di strip runway 25R, Foto 2: Evakuasi menggunakan jaring)..."
        themeColor="amber"
      />

      {savedSuccess && (
        <div className={`p-4 rounded-xl border-2 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in ${
          isLastSavedDraft 
            ? 'bg-amber-50 border-amber-400 text-amber-900' 
            : 'bg-emerald-50 border-emerald-400 text-emerald-900'
        }`}>
          <div className="flex items-center space-x-2.5">
            {isLastSavedDraft ? (
              <Bookmark className="w-6 h-6 text-amber-600 shrink-0" />
            ) : (
              <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
            )}
            <div>
              <p className="font-bold text-sm">
                {isLastSavedDraft 
                  ? 'Draft Laporan WHR (Hazard Report) Berhasil Disimpan!' 
                  : isEditMode 
                  ? 'Perubahan Dokumen WHR Berhasil Diperbarui!' 
                  : 'Laporan WHR (Hazard Report) Resmi Berhasil Disimpan & Disinkronkan!'}
              </p>
              <p className="text-xs mt-0.5">
                Nomor: <span className="font-mono font-semibold">{currentReport.reportNumber}</span> • {
                  isLastSavedDraft 
                    ? 'Tersimpan sebagai draft. Anda dapat melanjutkannya kapan saja melalui menu Arsip Laporan.' 
                    : 'Data tersimpan di database operasional dan dashboard.'
                }
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            {onNavigateToHistory && (
              <button
                type="button"
                onClick={onNavigateToHistory}
                className="flex-1 sm:flex-initial px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1 cursor-pointer transition shadow-xs"
              >
                Lihat di Riwayat
              </button>
            )}
            {!isLastSavedDraft && (
              <button
                type="button"
                onClick={() => onOpenBroadcast(currentReport)}
                className="flex-1 sm:flex-initial px-3 py-1.5 bg-amber-700 hover:bg-amber-800 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1 cursor-pointer transition shadow-xs"
              >
                <Share2 className="w-3.5 h-3.5" />
                Kirim WA
              </button>
            )}
          </div>
        </div>
      )}

      {/* Action Footer */}
      <div className="pt-6 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => exportOccurrencePDF(currentReport)}
          className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
        >
          <Download className="w-4 h-4 text-amber-600" />
          Cetak PDF Resmi
        </button>

        <div className="flex items-center space-x-2 flex-wrap">
          {/* Tombol Simpan Draft */}
          <button
            type="button"
            onClick={handleSaveDraft}
            className="px-3.5 py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-lg text-xs font-bold flex items-center gap-1.5 transition shadow-xs cursor-pointer"
            title="Simpan sementara sebagai draft agar bisa dilanjutkan nanti tanpa validasi ketat"
          >
            <Bookmark className="w-4 h-4 text-amber-600" />
            <span>Simpan sebagai Draft</span>
          </button>

          <button
            type="button"
            onClick={() => onOpenBroadcast(currentReport)}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition shadow cursor-pointer"
          >
            <Share2 className="w-4 h-4" />
            Notifikasi WhatsApp
          </button>

          <button
            type="submit"
            className={`px-5 py-2 text-white rounded-lg text-xs font-bold flex items-center gap-2 transition shadow-md cursor-pointer ${
              initialData?.isDraft 
                ? 'bg-emerald-600 hover:bg-emerald-500' 
                : isEditMode 
                ? 'bg-amber-600 hover:bg-amber-500' 
                : 'bg-amber-700 hover:bg-amber-600'
            }`}
          >
            <Save className="w-4 h-4" />
            <span>
              {initialData?.isDraft 
                ? 'Terbitkan Laporan Resmi' 
                : isEditMode 
                ? 'Simpan Perubahan Dokumen WHR' 
                : 'Simpan Laporan WHR (Hazard Report)'}
            </span>
          </button>
        </div>
      </div>

      {/* Interactive Leaflet Airside Map Modal */}
      <IncidentLocationPickerModal
        isOpen={isMapPickerOpen}
        onClose={() => setIsMapPickerOpen(false)}
        initialLatitude={coordinates?.latitude}
        initialLongitude={coordinates?.longitude}
        onSelectLocation={(data) => {
          setLokasi(data.lokasi);
          setGridLocation(data.gridLocation);
          setRunwayTaxiwayArea(data.runwayTaxiway);
          setCoordinates({
            latitude: data.latitude,
            longitude: data.longitude,
            distanceFromArpKm: data.distanceFromArpKm
          });
        }}
      />
    </form>
  );
};
