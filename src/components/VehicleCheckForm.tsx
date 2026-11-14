import React, { useState, useEffect, useMemo } from 'react';
import { 
  Truck, 
  Clock, 
  Calendar, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Save, 
  RotateCcw, 
  ShieldCheck, 
  Fuel, 
  Gauge, 
  Radio, 
  Sun, 
  Moon, 
  Eye, 
  Zap, 
  Volume2, 
  Crosshair, 
  Flashlight, 
  Sparkles, 
  UserCheck, 
  FileCheck,
  Check,
  Download,
  Share2,
  FileText,
  ExternalLink,
  Users,
  ArrowRight,
  Bookmark
} from 'lucide-react';
import { 
  VehicleCheckReport, 
  Pleton, 
  FuelLevel, 
  CheckItemStatus, 
  VehicleServiceability 
} from '../types';
import { DateTimeCalendarPicker } from './DateTimeCalendarPicker';
import { DocumentationUpload } from './DocumentationUpload';
import { exportVehiclePDF } from '../utils/pdfExport';
import { getActiveDutyInfo, getPreviousDutyInfo } from '../utils/dutyRosterService';
import { generateSequentialReportNumber, formatReportCreationTime } from '../utils/reportNumberGenerator';

interface VehicleCheckFormProps {
  onSave?: (report: VehicleCheckReport) => void;
  onSaveReport?: (report: VehicleCheckReport) => void;
  onCancel?: () => void;
  onCancelEdit?: () => void;
  initialData?: VehicleCheckReport | null;
  isEditMode?: boolean;
  onOpenBroadcast?: (report: VehicleCheckReport) => void;
  onNavigateToHistory?: () => void;
  onOpenDutyRoster?: () => void;
  existingReports?: VehicleCheckReport[];
}

const FLEET_PRESETS = [
  { nomorLambung: 'WHU-01', platNomor: 'B 9123 PUA', merkModel: 'Toyota Hilux 4x4 Double Cabin' },
  { nomorLambung: 'WHU-02', platNomor: 'B 9452 TQO', merkModel: 'Toyota Hilux 4x4 Double Cabin' },
  { nomorLambung: 'WHU-03', platNomor: 'B 9781 BDA', merkModel: 'Isuzu D-Max 4x4 Airside Patrol' },
  { nomorLambung: 'AMC-08', platNomor: 'B 9033 PUA', merkModel: 'Mitsubishi Triton 4x4 Runway Inspection' }
];

export const VehicleCheckForm: React.FC<VehicleCheckFormProps> = ({
  onSave,
  onSaveReport,
  onCancel,
  onCancelEdit,
  initialData,
  isEditMode = false,
  onOpenBroadcast,
  onNavigateToHistory,
  onOpenDutyRoster,
  existingReports = []
}) => {
  const [createdAt] = useState<string>(() => initialData?.createdAt || new Date().toISOString());
  const [reportNumber, setReportNumber] = useState<string>(() => {
    if (initialData?.reportNumber) return initialData.reportNumber;
    return generateSequentialReportNumber('VEH', existingReports, initialData?.createdAt || new Date().toISOString());
  });

  useEffect(() => {
    if (!initialData && !isEditMode) {
      setReportNumber(generateSequentialReportNumber('VEH', existingReports, createdAt));
    }
  }, [existingReports, initialData, isEditMode, createdAt]);

  const todayStr = () => {
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    const now = new Date();
    return `${days[now.getDay()]}, ${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`;
  };

  const defaultTime = () => {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const mins = String(now.getMinutes()).padStart(2, '0');
    return `${hours}:${mins} WIB`;
  };

  // State
  const [hariTanggal, setHariTanggal] = useState<string>(initialData?.hariTanggal || todayStr());
  const [dinas, setDinas] = useState<'Dinas Pagi (08:00 - 20:00)' | 'Dinas Malam (20:00 - 08:00)'>(
    initialData?.dinas || (new Date().getHours() >= 20 || new Date().getHours() < 8 ? 'Dinas Malam (20:00 - 08:00)' : 'Dinas Pagi (08:00 - 20:00)')
  );
  const [waktuPengecekan, setWaktuPengecekan] = useState<string>(initialData?.waktuPengecekan || defaultTime());
  const [pleton, setPleton] = useState<Pleton>(initialData?.pleton || 'Pleton Alpha');
  
  // Auto Roster Synchronization
  const [autoRosterSync, setAutoRosterSync] = useState<boolean>(!initialData);

  const startTimeFromCheck = useMemo(() => {
    const match = waktuPengecekan.match(/(\d{1,2}:\d{2})/);
    return match ? match[1] : '';
  }, [waktuPengecekan]);

  const calculatedRoster = useMemo(() => {
    return getActiveDutyInfo(hariTanggal, startTimeFromCheck);
  }, [hariTanggal, startTimeFromCheck]);

  const previousRoster = useMemo(() => {
    return getPreviousDutyInfo(hariTanggal, startTimeFromCheck);
  }, [hariTanggal, startTimeFromCheck]);

  useEffect(() => {
    if (autoRosterSync && !isEditMode) {
      setPleton(calculatedRoster.pleton);
      setDinas(calculatedRoster.dinas);
    }
  }, [calculatedRoster, autoRosterSync, isEditMode]);

  // Handover Officers
  const [petugasMenyerahkan, setPetugasMenyerahkan] = useState<string>(initialData?.petugasMenyerahkan || '');
  const [petugasMenerima, setPetugasMenerima] = useState<string>(initialData?.petugasMenerima || '');
  const [supervisorLead, setSupervisorLead] = useState<string>(initialData?.supervisorLead || 'Rachmaditya (Dept Head WHU)');

  // Vehicle data
  const [nomorLambung, setNomorLambung] = useState<string>(initialData?.nomorLambung || 'WHU-01');
  const [platNomor, setPlatNomor] = useState<string>(initialData?.platNomor || 'B 9123 PUA');
  const [merkModel, setMerkModel] = useState<string>(initialData?.merkModel || 'Toyota Hilux 4x4 Double Cabin');
  const [odometerKM, setOdometerKM] = useState<number>(initialData?.odometerKM || 42850);
  const [levelBBM, setLevelBBM] = useState<FuelLevel>(initialData?.levelBBM || 'Full (1/1)');

  // Mechanical and physical checklist
  const [oliMesinCoolant, setOliMesinCoolant] = useState<CheckItemStatus>(initialData?.oliMesinCoolant || 'Baik / Normal');
  const [sistemRemTangan, setSistemRemTangan] = useState<CheckItemStatus>(initialData?.sistemRemTangan || 'Baik / Normal');
  const [kondisiBanTekanan, setKondisiBanTekanan] = useState<CheckItemStatus>(initialData?.kondisiBanTekanan || 'Baik / Normal');
  const [lampuUtamaJauhDekat, setLampuUtamaJauhDekat] = useState<CheckItemStatus>(initialData?.lampuUtamaJauhDekat || 'Baik / Normal');
  const [lampuRotaryStroboAirside, setLampuRotaryStroboAirside] = useState<CheckItemStatus>(initialData?.lampuRotaryStroboAirside || 'Baik / Normal');
  const [lampuSeinHazardRem, setLampuSeinHazardRem] = useState<CheckItemStatus>(initialData?.lampuSeinHazardRem || 'Baik / Normal');
  const [wiperAirPembersih, setWiperAirPembersih] = useState<CheckItemStatus>(initialData?.wiperAirPembersih || 'Baik / Normal');
  const [klaksonSirineAirside, setKlaksonSirineAirside] = useState<CheckItemStatus>(initialData?.klaksonSirineAirside || 'Baik / Normal');
  const [acKabinKelistrikan, setAcKabinKelistrikan] = useState<CheckItemStatus>(initialData?.acKabinKelistrikan || 'Baik / Normal');
  const [kebersihanKendaraan, setKebersihanKendaraan] = useState<CheckItemStatus>(initialData?.kebersihanKendaraan || 'Baik / Normal');

  // Wildlife equipment checklist
  const [radioAirsideHT, setRadioAirsideHT] = useState<CheckItemStatus>(initialData?.radioAirsideHT || 'Baik / Normal');
  const [birdScarerSoundMegaphone, setBirdScarerSoundMegaphone] = useState<CheckItemStatus>(initialData?.birdScarerSoundMegaphone || 'Baik / Normal');
  const [laserBirdDisperser, setLaserBirdDisperser] = useState<CheckItemStatus>(initialData?.laserBirdDisperser || 'Baik / Normal');
  const [pyroFlareGun, setPyroFlareGun] = useState<CheckItemStatus>(initialData?.pyroFlareGun || 'Baik / Normal');
  const [amunisiFlareButir, setAmunisiFlareButir] = useState<number>(initialData?.amunisiFlareButir ?? 12);
  const [binokularTeropong, setBinokularTeropong] = useState<CheckItemStatus>(initialData?.binokularTeropong || 'Baik / Normal');
  const [senterTaktisSearchlight, setSenterTaktisSearchlight] = useState<CheckItemStatus>(initialData?.senterTaktisSearchlight || 'Baik / Normal');
  const [jaringNetGunHandling, setJaringNetGunHandling] = useState<CheckItemStatus>(initialData?.jaringNetGunHandling || 'Baik / Normal');
  const [aparKendaraan, setAparKendaraan] = useState<CheckItemStatus>(initialData?.aparKendaraan || 'Baik / Normal');
  const [kotakP3K, setKotakP3K] = useState<CheckItemStatus>(initialData?.kotakP3K || 'Baik / Normal');
  const [toolKitDongkrak, setToolKitDongkrak] = useState<CheckItemStatus>(initialData?.toolKitDongkrak || 'Baik / Normal');

  // Conclusion & Handover Remarks
  const [statusKelayakan, setStatusKelayakan] = useState<VehicleServiceability>(
    initialData?.statusKelayakan || 'SIAP OPERASI (SERVICEABLE)'
  );
  const [catatanKerusakanKendala, setCatatanKerusakanKendala] = useState<string>(initialData?.catatanKerusakanKendala || '');
  const [catatanSerahTerima, setCatatanSerahTerima] = useState<string>(initialData?.catatanSerahTerima || '');
  const [fotos, setFotos] = useState<string[]>(initialData?.fotos || []);
  const [keteranganDokumentasi, setKeteranganDokumentasi] = useState<string>(initialData?.keteranganDokumentasi || '');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Quick preset vehicle selection
  const handleSelectFleetPreset = (preset: typeof FLEET_PRESETS[0]) => {
    setNomorLambung(preset.nomorLambung);
    setPlatNomor(preset.platNomor);
    setMerkModel(preset.merkModel);
  };

  // Quick mark all items as normal
  const handleMarkAllNormal = () => {
    setOliMesinCoolant('Baik / Normal');
    setSistemRemTangan('Baik / Normal');
    setKondisiBanTekanan('Baik / Normal');
    setLampuUtamaJauhDekat('Baik / Normal');
    setLampuRotaryStroboAirside('Baik / Normal');
    setLampuSeinHazardRem('Baik / Normal');
    setWiperAirPembersih('Baik / Normal');
    setKlaksonSirineAirside('Baik / Normal');
    setAcKabinKelistrikan('Baik / Normal');
    setKebersihanKendaraan('Baik / Normal');

    setRadioAirsideHT('Baik / Normal');
    setBirdScarerSoundMegaphone('Baik / Normal');
    setLaserBirdDisperser('Baik / Normal');
    setPyroFlareGun('Baik / Normal');
    setBinokularTeropong('Baik / Normal');
    setSenterTaktisSearchlight('Baik / Normal');
    setJaringNetGunHandling('Baik / Normal');
    setAparKendaraan('Baik / Normal');
    setKotakP3K('Baik / Normal');
    setToolKitDongkrak('Baik / Normal');

    setStatusKelayakan('SIAP OPERASI (SERVICEABLE)');
  };

  const [showCompletionModal, setShowCompletionModal] = useState<boolean>(false);
  const [savedReportObj, setSavedReportObj] = useState<VehicleCheckReport | null>(null);
  const [pdfDownloadedToast, setPdfDownloadedToast] = useState<boolean>(false);

  const [isDraftSavedToast, setIsDraftSavedToast] = useState<boolean>(false);
  const [hasAutoDraft, setHasAutoDraft] = useState<boolean>(false);
  const [autoDraftTimestamp, setAutoDraftTimestamp] = useState<string>('');

  // Check for auto-saved draft in localStorage on mount
  useEffect(() => {
    if (!initialData) {
      try {
        const raw = localStorage.getItem('whu_draft_veh_auto');
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && (parsed.hariTanggal || parsed.nomorLambung || parsed.petugasMenyerahkan || parsed.petugasMenerima)) {
            setHasAutoDraft(true);
            setAutoDraftTimestamp(parsed._savedAt || '');
          }
        }
      } catch {}
    }
  }, [initialData]);

  const loadAutoDraft = () => {
    try {
      const raw = localStorage.getItem('whu_draft_veh_auto');
      if (raw) {
        const d = JSON.parse(raw);
        if (d.hariTanggal) setHariTanggal(d.hariTanggal);
        if (d.dinas) setDinas(d.dinas);
        if (d.waktuPengecekan) setWaktuPengecekan(d.waktuPengecekan);
        if (d.pleton) setPleton(d.pleton);
        if (d.petugasMenyerahkan) setPetugasMenyerahkan(d.petugasMenyerahkan);
        if (d.petugasMenerima) setPetugasMenerima(d.petugasMenerima);
        if (d.supervisorLead) setSupervisorLead(d.supervisorLead);
        if (d.nomorLambung) setNomorLambung(d.nomorLambung);
        if (d.platNomor) setPlatNomor(d.platNomor);
        if (d.merkModel) setMerkModel(d.merkModel);
        if (d.odometerKM) setOdometerKM(d.odometerKM);
        if (d.levelBBM) setLevelBBM(d.levelBBM);
        if (d.oliMesinCoolant) setOliMesinCoolant(d.oliMesinCoolant);
        if (d.sistemRemTangan) setSistemRemTangan(d.sistemRemTangan);
        if (d.kondisiBanTekanan) setKondisiBanTekanan(d.kondisiBanTekanan);
        if (d.lampuUtamaJauhDekat) setLampuUtamaJauhDekat(d.lampuUtamaJauhDekat);
        if (d.lampuRotaryStroboAirside) setLampuRotaryStroboAirside(d.lampuRotaryStroboAirside);
        if (d.lampuSeinHazardRem) setLampuSeinHazardRem(d.lampuSeinHazardRem);
        if (d.wiperAirPembersih) setWiperAirPembersih(d.wiperAirPembersih);
        if (d.klaksonSirineAirside) setKlaksonSirineAirside(d.klaksonSirineAirside);
        if (d.acKabinKelistrikan) setAcKabinKelistrikan(d.acKabinKelistrikan);
        if (d.kebersihanKendaraan) setKebersihanKendaraan(d.kebersihanKendaraan);
        if (d.radioAirsideHT) setRadioAirsideHT(d.radioAirsideHT);
        if (d.birdScarerSoundMegaphone) setBirdScarerSoundMegaphone(d.birdScarerSoundMegaphone);
        if (d.laserBirdDisperser) setLaserBirdDisperser(d.laserBirdDisperser);
        if (d.pyroFlareGun) setPyroFlareGun(d.pyroFlareGun);
        if (d.amunisiFlareButir !== undefined) setAmunisiFlareButir(d.amunisiFlareButir);
        if (d.binokularTeropong) setBinokularTeropong(d.binokularTeropong);
        if (d.senterTaktisSearchlight) setSenterTaktisSearchlight(d.senterTaktisSearchlight);
        if (d.jaringNetGunHandling) setJaringNetGunHandling(d.jaringNetGunHandling);
        if (d.aparKendaraan) setAparKendaraan(d.aparKendaraan);
        if (d.kotakP3K) setKotakP3K(d.kotakP3K);
        if (d.toolKitDongkrak) setToolKitDongkrak(d.toolKitDongkrak);
        if (d.statusKelayakan) setStatusKelayakan(d.statusKelayakan);
        if (d.catatanKerusakanKendala) setCatatanKerusakanKendala(d.catatanKerusakanKendala);
        if (d.catatanSerahTerima) setCatatanSerahTerima(d.catatanSerahTerima);
        if (d.fotos) setFotos(d.fotos);
        if (d.keteranganDokumentasi) setKeteranganDokumentasi(d.keteranganDokumentasi);
        setHasAutoDraft(false);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const discardAutoDraft = () => {
    try {
      localStorage.removeItem('whu_draft_veh_auto');
    } catch {}
    setHasAutoDraft(false);
  };

  // Debounced auto-save draft locally while filling
  useEffect(() => {
    if (!initialData && !showCompletionModal) {
      const timer = setTimeout(() => {
        try {
          if (hariTanggal || nomorLambung || petugasMenyerahkan || petugasMenerima) {
            const draftData = {
              hariTanggal,
              dinas,
              waktuPengecekan,
              pleton,
              petugasMenyerahkan,
              petugasMenerima,
              supervisorLead,
              nomorLambung,
              platNomor,
              merkModel,
              odometerKM,
              levelBBM,
              oliMesinCoolant,
              sistemRemTangan,
              kondisiBanTekanan,
              lampuUtamaJauhDekat,
              lampuRotaryStroboAirside,
              lampuSeinHazardRem,
              wiperAirPembersih,
              klaksonSirineAirside,
              acKabinKelistrikan,
              kebersihanKendaraan,
              radioAirsideHT,
              birdScarerSoundMegaphone,
              laserBirdDisperser,
              pyroFlareGun,
              amunisiFlareButir,
              binokularTeropong,
              senterTaktisSearchlight,
              jaringNetGunHandling,
              aparKendaraan,
              kotakP3K,
              toolKitDongkrak,
              statusKelayakan,
              catatanKerusakanKendala,
              catatanSerahTerima,
              fotos,
              keteranganDokumentasi,
              _savedAt: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
            };
            localStorage.setItem('whu_draft_veh_auto', JSON.stringify(draftData));
          }
        } catch {}
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [
    initialData,
    showCompletionModal,
    hariTanggal,
    dinas,
    waktuPengecekan,
    pleton,
    petugasMenyerahkan,
    petugasMenerima,
    supervisorLead,
    nomorLambung,
    platNomor,
    merkModel,
    odometerKM,
    levelBBM,
    oliMesinCoolant,
    sistemRemTangan,
    kondisiBanTekanan,
    lampuUtamaJauhDekat,
    lampuRotaryStroboAirside,
    lampuSeinHazardRem,
    wiperAirPembersih,
    klaksonSirineAirside,
    acKabinKelistrikan,
    kebersihanKendaraan,
    radioAirsideHT,
    birdScarerSoundMegaphone,
    laserBirdDisperser,
    pyroFlareGun,
    amunisiFlareButir,
    binokularTeropong,
    senterTaktisSearchlight,
    jaringNetGunHandling,
    aparKendaraan,
    kotakP3K,
    toolKitDongkrak,
    statusKelayakan,
    catatanKerusakanKendala,
    catatanSerahTerima,
    fotos,
    keteranganDokumentasi
  ]);

  const getReportDataFromState = (asDraft: boolean = false): VehicleCheckReport => ({
    id: initialData?.id || `veh-${Date.now()}`,
    reportNumber,
    createdAt,
    updatedAt: new Date().toISOString(),
    isDraft: asDraft,
    draftSavedAt: asDraft ? new Date().toISOString() : undefined,
    hariTanggal,
    dinas,
    waktuPengecekan,
    pleton,
    petugasMenyerahkan: petugasMenyerahkan.trim() || (asDraft ? 'Petugas Dinas (Draft)' : ''),
    petugasMenerima: petugasMenerima.trim() || (asDraft ? 'Petugas Penerima (Draft)' : ''),
    supervisorLead,
    nomorLambung,
    platNomor,
    merkModel,
    odometerKM: Number(odometerKM) || 0,
    levelBBM,
    oliMesinCoolant,
    sistemRemTangan,
    kondisiBanTekanan,
    lampuUtamaJauhDekat,
    lampuRotaryStroboAirside,
    lampuSeinHazardRem,
    wiperAirPembersih,
    klaksonSirineAirside,
    acKabinKelistrikan,
    kebersihanKendaraan,
    radioAirsideHT,
    birdScarerSoundMegaphone,
    laserBirdDisperser,
    pyroFlareGun,
    amunisiFlareButir: Number(amunisiFlareButir) || 0,
    binokularTeropong,
    senterTaktisSearchlight,
    jaringNetGunHandling,
    aparKendaraan,
    kotakP3K,
    toolKitDongkrak,
    statusKelayakan,
    catatanKerusakanKendala,
    catatanSerahTerima,
    fotos,
    keteranganDokumentasi
  });

  const handleQuickDownloadPDF = () => {
    try {
      const rep = savedReportObj || getReportDataFromState(false);
      exportVehiclePDF(rep, rep.reportNumber, rep.createdAt);
      setPdfDownloadedToast(true);
      setTimeout(() => setPdfDownloadedToast(false), 3500);
    } catch (err) {
      console.error('Gagal mengekspor PDF:', err);
    }
  };

  const handleQuickOpenWAG = () => {
    const rep = savedReportObj || getReportDataFromState(false);
    if (onOpenBroadcast) {
      onOpenBroadcast(rep);
    }
  };

  const handleSaveDraft = () => {
    setIsSubmitting(true);
    const draftReport = getReportDataFromState(true);
    const saveFn = onSaveReport || onSave;
    if (saveFn) {
      saveFn(draftReport);
    }
    setSavedReportObj(draftReport);
    setIsDraftSavedToast(true);
    setIsSubmitting(false);
    try {
      localStorage.removeItem('whu_draft_veh_auto');
    } catch {}
    setTimeout(() => setIsDraftSavedToast(false), 4500);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!petugasMenyerahkan.trim() || !petugasMenerima.trim()) {
      alert('Mohon isi nama Petugas yang Menyerahkan dan Petugas yang Menerima untuk serah terima tugas!');
      return;
    }

    setIsSubmitting(true);

    const report = getReportDataFromState(false);

    const saveFn = onSaveReport || onSave;
    if (saveFn) {
      saveFn(report);
    }
    setSavedReportObj(report);
    setShowCompletionModal(true);
    setIsSubmitting(false);
    try {
      localStorage.removeItem('whu_draft_veh_auto');
    } catch {}
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      {/* Banner / Title Header */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-sky-950 text-white p-5 rounded-2xl shadow-xl border border-slate-700/60 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="h-12 w-12 rounded-xl bg-sky-600 flex items-center justify-center text-white shadow-md">
            <Truck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[10px] bg-sky-500/30 text-sky-200 font-mono px-2 py-0.5 rounded font-semibold uppercase">
                FORMULIR SERAH TERIMA TUGAS
              </span>
              <span className="text-xs text-slate-400">ICAO Doc 9137 &amp; Airside Safety</span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
              Pengecekan Kendaraan Operasional WHU (Dinas Pagi &amp; Malam)
            </h2>
            <p className="text-xs text-slate-300">
              Formulir verifikasi kondisi fisik, rotari airside, perlengkapan halau satwa, dan serah terima armada.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Tombol Cepat Simpan Draft */}
          <button
            type="button"
            onClick={handleSaveDraft}
            disabled={isSubmitting}
            className="px-3 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm transition cursor-pointer"
            title="Simpan sementara sebagai draft agar bisa dilanjutkan nanti"
          >
            <Bookmark className="w-4 h-4 fill-current" />
            <span>Simpan Draft</span>
          </button>

          <button
            type="button"
            onClick={handleQuickDownloadPDF}
            className="px-3 py-2 bg-rose-700 hover:bg-rose-600 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm transition cursor-pointer"
            title="Unduh file Bukti PDF Resmi untuk laporan ke Pimpinan"
          >
            <Download className="w-4 h-4" />
            <span>Bukti PDF Pimpinan</span>
          </button>
          
          {onOpenBroadcast && (
            <button
              type="button"
              onClick={handleQuickOpenWAG}
              className="px-3 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm transition cursor-pointer"
              title="Format Laporan WAG / WhatsApp Pimpinan"
            >
              <Share2 className="w-4 h-4" />
              <span>Laporan WAG</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleMarkAllNormal}
            className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm transition cursor-pointer"
            title="Isi seluruh status pemeriksaan dengan 'Baik / Normal'"
          >
            <Sparkles className="w-4 h-4 text-emerald-200" />
            <span>Tandai Semua Normal</span>
          </button>
        </div>
      </div>

      {/* Auto Draft Recovery Banner */}
      {hasAutoDraft && !initialData && (
        <div className="p-4 rounded-xl bg-amber-50 border-2 border-amber-300 text-amber-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm animate-in fade-in">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-amber-600 text-white rounded-lg shrink-0">
              <Bookmark className="w-5 h-5 fill-current" />
            </div>
            <div>
              <p className="font-bold text-sm text-amber-950">Draft Checklist Kendaraan Ditemukan</p>
              <p className="text-xs text-amber-800 mt-0.5">
                Terdapat data draft pemeriksaan kendaraan yang belum diselesaikan (tersimpan otomatis pukul {autoDraftTimestamp || 'sebelumnya'}). Ingin memulihkan data tersebut?
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
        <div className="p-4 rounded-xl bg-amber-500/15 border-2 border-amber-400 text-amber-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs animate-in fade-in">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-amber-600 text-white rounded-lg shrink-0">
              <Bookmark className="w-5 h-5 fill-current" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-sm text-slate-900">Mode Edit Draft Checklist Kendaraan</span>
                <span className="px-2 py-0.5 bg-amber-200 text-amber-900 font-mono font-bold rounded text-[11px] border border-amber-300">
                  DRAFT • {initialData.reportNumber}
                </span>
                {initialData.draftSavedAt && (
                  <span className="text-[11px] text-amber-800 font-medium">
                    (Draft disimpan: {new Date(initialData.draftSavedAt).toLocaleString('id-ID')})
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-700 mt-0.5">
                Dokumen ini berstatus <strong>Draft Sementara</strong>. Anda dapat memperbarui draft ini atau klik <strong>"Terbitkan Laporan Resmi &amp; Serah Terima"</strong> saat seluruh verifikasi fisik kendaraan telah lengkap.
              </p>
            </div>
          </div>

          {onCancelEdit && (
            <button
              type="button"
              onClick={onCancelEdit}
              className="px-3.5 py-1.5 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-xs shrink-0"
            >
              <span>Tutup Draft</span>
            </button>
          )}
        </div>
      )}

      {/* Draft Saved Success Notification */}
      {isDraftSavedToast && (
        <div className="p-4 rounded-xl bg-amber-50 border-2 border-amber-400 text-amber-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-md animate-in fade-in">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-amber-600 text-white rounded-lg shrink-0">
              <Bookmark className="w-5 h-5 fill-current" />
            </div>
            <div>
              <p className="font-bold text-sm text-amber-950">Draft Checklist Kendaraan Berhasil Disimpan!</p>
              <p className="text-xs text-amber-800 mt-0.5">
                Nomor: <span className="font-mono font-bold">{savedReportObj?.reportNumber || reportNumber}</span> • Tersimpan di sistem. Anda dapat melanjutkannya kapan saja melalui menu Riwayat Laporan.
              </p>
            </div>
          </div>
          {onNavigateToHistory && (
            <button
              type="button"
              onClick={onNavigateToHistory}
              className="px-3.5 py-1.5 bg-amber-700 hover:bg-amber-800 text-white rounded-lg text-xs font-bold transition cursor-pointer shadow-xs shrink-0"
            >
              Buka Riwayat
            </button>
          )}
        </div>
      )}

      {/* Main Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* SECTION 1: METADATA & SHIFT SELECTION */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center space-x-2 text-slate-900 font-bold text-sm">
              <Calendar className="w-4 h-4 text-sky-600" />
              <span>I. WAKTU DINAS &amp; IDENTITAS LAPORAN</span>
            </div>
            <span className="text-xs text-slate-500 font-mono">No: {reportNumber}</span>
          </div>

          {/* Nomor Dokumen Resmi & Urutan Kronologis */}
          <div className="bg-teal-50/80 border border-teal-200 rounded-xl p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-700">No. Dokumen PDF:</span>
              <span className="font-mono font-bold text-teal-950 bg-white px-2.5 py-1 rounded-md border border-teal-300 shadow-2xs">
                {reportNumber}
              </span>
            </div>
            <span className="text-[11px] text-slate-500">
              Penomoran otomatis berurutan sesuai waktu pembuatan ({formatReportCreationTime(createdAt)})
            </span>
          </div>

          {/* Smart Roster Indicator Banner */}
          <div className="bg-sky-50/80 border border-sky-200 rounded-lg p-3 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
            <div className="flex items-center space-x-2">
              <div className="p-1.5 bg-sky-600 text-white rounded-md shrink-0">
                <Sparkles className="w-3.5 h-3.5" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-sky-950">Roster Otomatis CGK:</span>
                  <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-sky-100 text-sky-900 border border-sky-300">
                    {calculatedRoster.pleton}
                  </span>
                  <span className="text-slate-600">
                    • {calculatedRoster.dinas} ({calculatedRoster.shiftCode})
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {autoRosterSync 
                    ? `Pleton dan dinas otomatis sinkron berdasarkan jadwal perputaran resmi roster WHU.` 
                    : `Mode manual aktif (Roster otomatis dijeda).`}
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
                    setDinas(calculatedRoster.dinas as any);
                  }}
                  className="px-2.5 py-1 bg-sky-600 hover:bg-sky-700 text-white rounded font-semibold text-[11px] flex items-center gap-1 cursor-pointer transition shadow-2xs"
                  title="Kembalikan ke sinkronisasi otomatis sesuai roster"
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
                  <Calendar className="w-3 h-3 text-sky-600" />
                  <span>Jadwal Roster</span>
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Shift Selector with prominent visual toggles */}
            <div className="sm:col-span-2">
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-700">
                  Pilih Dinas Operasional <span className="text-red-500">*</span>
                </label>
                {autoRosterSync && (
                  <span className="text-[10px] text-sky-600 font-semibold">Otomatis Waktu</span>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setDinas('Dinas Pagi (08:00 - 20:00)');
                    setAutoRosterSync(false);
                  }}
                  className={`p-3 rounded-lg border text-left flex items-center space-x-2.5 transition cursor-pointer ${
                    dinas === 'Dinas Pagi (08:00 - 20:00)'
                      ? 'border-amber-500 bg-amber-50/80 text-amber-950 font-bold shadow-xs'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <Sun className={`w-5 h-5 ${dinas === 'Dinas Pagi (08:00 - 20:00)' ? 'text-amber-500' : 'text-slate-400'}`} />
                  <div>
                    <p className="text-xs font-bold">Dinas Pagi</p>
                    <p className="text-[10px] text-slate-500">08:00 - 20:00 WIB</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setDinas('Dinas Malam (20:00 - 08:00)');
                    setAutoRosterSync(false);
                  }}
                  className={`p-3 rounded-lg border text-left flex items-center space-x-2.5 transition cursor-pointer ${
                    dinas === 'Dinas Malam (20:00 - 08:00)'
                      ? 'border-indigo-600 bg-indigo-50/80 text-indigo-950 font-bold shadow-xs'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <Moon className={`w-5 h-5 ${dinas === 'Dinas Malam (20:00 - 08:00)' ? 'text-indigo-600' : 'text-slate-400'}`} />
                  <div>
                    <p className="text-xs font-bold">Dinas Malam</p>
                    <p className="text-[10px] text-slate-500">20:00 - 08:00 WIB</p>
                  </div>
                </button>
              </div>
            </div>

            {/* Pleton */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-700">Pleton Bertugas</label>
                {autoRosterSync && (
                  <span className="text-[10px] text-sky-600 font-semibold">Otomatis Roster</span>
                )}
              </div>
              <select
                value={pleton}
                onChange={(e) => {
                  setPleton(e.target.value as Pleton);
                  setAutoRosterSync(false);
                }}
                className="w-full p-2.5 border border-slate-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-sky-500 outline-hidden"
              >
                <option value="Pleton Alpha">Pleton Alpha</option>
                <option value="Pleton Bravo">Pleton Bravo</option>
                <option value="Pleton Charlie">Pleton Charlie</option>
                <option value="Pleton Delta">Pleton Delta</option>
              </select>
            </div>

            {/* Waktu Pengecekan */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Waktu Pengecekan</label>
              <div className="relative">
                <input
                  type="text"
                  value={waktuPengecekan}
                  onChange={(e) => setWaktuPengecekan(e.target.value)}
                  className="w-full p-2.5 pl-8 border border-slate-300 rounded-lg text-xs font-mono font-medium focus:ring-2 focus:ring-sky-500 outline-hidden"
                  placeholder="07:45 WIB"
                />
                <Clock className="w-4 h-4 text-slate-400 absolute left-2.5 top-3" />
              </div>
            </div>
          </div>

          {/* Tanggal & Nomor Laporan */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Hari &amp; Tanggal Pengecekan</label>
              <DateTimeCalendarPicker
                hariTanggal={hariTanggal}
                onHariTanggalChange={(val) => setHariTanggal(val)}
                mode="single"
                accentColor="sky"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Nomor Dokumen Serah Terima</label>
              <input
                type="text"
                value={reportNumber}
                onChange={(e) => setReportNumber(e.target.value)}
                className="w-full p-2.5 border border-slate-300 rounded-lg text-xs font-mono font-bold bg-slate-50 text-slate-800"
              />
            </div>
          </div>
        </div>

        {/* SECTION 2: DATA KENDARAAN OPERASIONAL & KILOMETER / BBM */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-3 gap-2">
            <div className="flex items-center space-x-2 text-slate-900 font-bold text-sm">
              <Truck className="w-4 h-4 text-sky-600" />
              <span>II. IDENTITAS ARMADA &amp; KONDISI AWAL</span>
            </div>
            {/* Quick Presets */}
            <div className="flex items-center gap-1.5 overflow-x-auto">
              <span className="text-[11px] text-slate-500 font-medium">Pilih Cepat:</span>
              {FLEET_PRESETS.map((fp) => (
                <button
                  key={fp.nomorLambung}
                  type="button"
                  onClick={() => handleSelectFleetPreset(fp)}
                  className={`px-2 py-1 rounded text-[11px] font-bold border transition cursor-pointer ${
                    nomorLambung === fp.nomorLambung
                      ? 'bg-sky-600 text-white border-sky-600'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                  }`}
                >
                  {fp.nomorLambung}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Nomor Lambung */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Nomor Lambung Kendaraan</label>
              <input
                type="text"
                value={nomorLambung}
                onChange={(e) => setNomorLambung(e.target.value)}
                className="w-full p-2.5 border border-slate-300 rounded-lg text-xs font-bold text-sky-800 uppercase focus:ring-2 focus:ring-sky-500 outline-hidden"
                placeholder="WHU-01"
              />
            </div>

            {/* Plat Nomor */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Nomor Polisi / Plat</label>
              <input
                type="text"
                value={platNomor}
                onChange={(e) => setPlatNomor(e.target.value)}
                className="w-full p-2.5 border border-slate-300 rounded-lg text-xs font-mono font-medium focus:ring-2 focus:ring-sky-500 outline-hidden"
                placeholder="B 9123 PUA"
              />
            </div>

            {/* Merk & Model */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Merk &amp; Tipe Kendaraan</label>
              <input
                type="text"
                value={merkModel}
                onChange={(e) => setMerkModel(e.target.value)}
                className="w-full p-2.5 border border-slate-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-sky-500 outline-hidden"
                placeholder="Toyota Hilux 4x4 Double Cabin"
              />
            </div>

            {/* Odometer KM */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                <Gauge className="w-3.5 h-3.5 text-slate-500" />
                <span>Odometer (KM Serah Terima)</span>
              </label>
              <input
                type="number"
                value={odometerKM}
                onChange={(e) => setOdometerKM(Number(e.target.value))}
                className="w-full p-2.5 border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-900 focus:ring-2 focus:ring-sky-500 outline-hidden"
                placeholder="42850"
              />
            </div>

            {/* Level Bahan Bakar */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                <Fuel className="w-3.5 h-3.5 text-amber-500" />
                <span>Indikator Bahan Bakar (BBM)</span>
              </label>
              <select
                value={levelBBM}
                onChange={(e) => setLevelBBM(e.target.value as FuelLevel)}
                className={`w-full p-2.5 border rounded-lg text-xs font-bold focus:ring-2 focus:ring-sky-500 outline-hidden ${
                  levelBBM.includes('Kritis') ? 'bg-red-50 text-red-700 border-red-300' : 'border-slate-300 text-slate-800'
                }`}
              >
                <option value="Full (1/1)">Full (1/1) - Penuh</option>
                <option value="3/4">3/4 Tangki</option>
                <option value="1/2">1/2 Tangki</option>
                <option value="1/4">1/4 Tangki (Perlu Refill)</option>
                <option value="Kritis / Cadangan (E)">Kritis / Cadangan (E) - Wajib Isi</option>
              </select>
            </div>
          </div>
        </div>

        {/* SECTION 3: CHECKLIST MEKANIKAL, FISIK & KELISTRIKAN AIRSIDE */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center space-x-2 text-slate-900 font-bold text-sm">
              <Zap className="w-4 h-4 text-amber-500" />
              <span>III. PEMERIKSAAN KONDISI MESIN, MEKANIKAL &amp; SISTEM PENERANGAN</span>
            </div>
            <span className="text-xs text-slate-400 font-medium">Standar Safety Airside Kemenhub</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 text-xs">
            {/* 1. Oli & Coolant */}
            <CheckItemRow
              label="Oli Mesin & Air Radiator (Coolant)"
              description="Periksa level dipstick oli dan kecukupan tabung cadangan radiator."
              value={oliMesinCoolant}
              onChange={setOliMesinCoolant}
            />

            {/* 2. Sistem Rem & Rem Tangan */}
            <CheckItemRow
              label="Sistem Rem Kaki & Handbrake"
              description="Pedal rem tidak ambles, rem parkir mencengkeram kuat."
              value={sistemRemTangan}
              onChange={setSistemRemTangan}
            />

            {/* 3. Kondisi Ban & Tekanan Angin */}
            <CheckItemRow
              label="Kondisi Ban (4 Roda + Ban Serep)"
              description="Alur ban tebal, baut roda kencang, tekanan angin sesuai standar (32-35 PSI)."
              value={kondisiBanTekanan}
              onChange={setKondisiBanTekanan}
            />

            {/* 4. Lampu Utama */}
            <CheckItemRow
              label="Lampu Utama (Headlamp Jauh/Dekat & Fog Lamp)"
              description="Kedua lampu depan menyala terang, fokus penerangan optimal malam hari."
              value={lampuUtamaJauhDekat}
              onChange={setLampuUtamaJauhDekat}
            />

            {/* 5. Lampu Rotari / Strobo Kuning Airside (CRITICAL) */}
            <div className="p-3 bg-amber-50/70 border border-amber-300 rounded-lg flex flex-col justify-between gap-2">
              <div>
                <div className="flex items-center gap-1.5 font-bold text-amber-950">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                  Lampu Rotary / Strobo Kuning Airside (Mandatory)
                </div>
                <p className="text-[11px] text-amber-800 mt-0.5">
                  Wajib menyala berputar kuning terang setiap kali memasuki Movement Area / Runway.
                </p>
              </div>
              <div className="flex items-center gap-1.5 self-end">
                {(['Baik / Normal', 'Kurang / Perhatian', 'Rusak / Mati / Nihil'] as CheckItemStatus[]).map((status) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => setLampuRotaryStroboAirside(status)}
                    className={`px-2.5 py-1 rounded text-[11px] font-bold border transition cursor-pointer ${
                      lampuRotaryStroboAirside === status
                        ? status === 'Baik / Normal'
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                          : status === 'Kurang / Perhatian'
                          ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                          : 'bg-rose-600 text-white border-rose-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>

            {/* 6. Lampu Sein, Hazard & Rem Belakang */}
            <CheckItemRow
              label="Lampu Sein, Hazard & Rem Belakang"
              description="Lampu rem menyala saat diinjak, lampu sein & hazard berkedip normal."
              value={lampuSeinHazardRem}
              onChange={setLampuSeinHazardRem}
            />

            {/* 7. Wiper & Air Pembersih */}
            <CheckItemRow
              label="Wiper & Semprotan Air Pembersih Kaca"
              description="Karet wiper menyapu bersih tanpa goresan, tabung air wiper terisi."
              value={wiperAirPembersih}
              onChange={setWiperAirPembersih}
            />

            {/* 8. Klakson & Sirine Airside */}
            <CheckItemRow
              label="Klakson Kendaraan & Sirine Evakuasi Airside"
              description="Suara klakson nyaring, tombol sirine evakuasi berfungsi."
              value={klaksonSirineAirside}
              onChange={setKlaksonSirineAirside}
            />

            {/* 9. AC & Kelistrikan Kabin */}
            <CheckItemRow
              label="AC Kabin & Kelistrikan Dashboard"
              description="AC dingin, indikator baterai/aki normal, lighter/charger HT aktif."
              value={acKabinKelistrikan}
              onChange={setAcKabinKelistrikan}
            />

            {/* 10. Kebersihan Fisik */}
            <CheckItemRow
              label="Kebersihan Eksterior & Interior Mobil"
              description="Kabin bersih bebas sampah, bodi luar tidak berlumpur/kotor ekstrem."
              value={kebersihanKendaraan}
              onChange={setKebersihanKendaraan}
            />
          </div>
        </div>

        {/* SECTION 4: PERLENGKAPAN ALAT HALAU SATWA & EMERGENCY AIRSIDE */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center space-x-2 text-slate-900 font-bold text-sm">
              <Crosshair className="w-4 h-4 text-emerald-600" />
              <span>IV. PERLENGKAPAN KHUSUS WILDLIFE HAZARD &amp; ALAT HALAU SATWA</span>
            </div>
            <span className="text-xs text-slate-400 font-medium">Serah Terima Inventaris Lapangan</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 text-xs">
            {/* Radio HT Airside */}
            <CheckItemRow
              label="Radio Komunikasi HT Airside (VHF / Ground Control)"
              description="Frekuensi standby Tower/GMC, baterai cadangan terisi penuh."
              value={radioAirsideHT}
              onChange={setRadioAirsideHT}
            />

            {/* Bird Scarer Sound */}
            <CheckItemRow
              label="Bird Scarer Sound Device / Megaphone Pengusir Satwa"
              description="Perangkat suara akustik / sirene halau burung berfungsi nyaring."
              value={birdScarerSoundMegaphone}
              onChange={setBirdScarerSoundMegaphone}
            />

            {/* Laser Bird Disperser */}
            <CheckItemRow
              label="Laser Pengusir Burung (Green Laser Disperser)"
              description="Kondisi optik bersih, sinar laser hijau fokus & baterai siap pakai."
              value={laserBirdDisperser}
              onChange={setLaserBirdDisperser}
            />

            {/* Pyro Flare Gun & Amunisi */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex flex-col justify-between gap-2">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-bold text-slate-900">Pistol Suar (Pyro Flare Gun) &amp; Amunisi</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">Mekanisme pemicu aman, selongsong tersimpan di kotak terkunci.</p>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-[11px] text-slate-600 font-medium">Amunisi:</span>
                  <input
                    type="number"
                    value={amunisiFlareButir}
                    onChange={(e) => setAmunisiFlareButir(Number(e.target.value))}
                    className="w-16 p-1 border border-slate-300 rounded font-mono font-bold text-center text-xs"
                    title="Jumlah butir amunisi yang diserahterimakan"
                  />
                  <span className="text-[11px] text-slate-500">butir</span>
                </div>
              </div>
              <div className="flex items-center gap-1.5 self-end">
                {(['Baik / Normal', 'Kurang / Perhatian', 'Rusak / Mati / Nihil'] as CheckItemStatus[]).map((status) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => setPyroFlareGun(status)}
                    className={`px-2.5 py-1 rounded text-[11px] font-bold border transition cursor-pointer ${
                      pyroFlareGun === status
                        ? status === 'Baik / Normal'
                          ? 'bg-emerald-600 text-white border-emerald-600'
                          : status === 'Kurang / Perhatian'
                          ? 'bg-amber-600 text-white border-amber-600'
                          : 'bg-rose-600 text-white border-rose-600'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>

            {/* Teropong Binokular */}
            <CheckItemRow
              label="Teropong / Binokular 10x50 Lapangan"
              description="Lensa jernih bebas jamur, strap terpasang rapi di dalam kendaraan."
              value={binokularTeropong}
              onChange={setBinokularTeropong}
            />

            {/* Senter Taktis (Crucial for night shift) */}
            <div className={`p-3 rounded-lg border flex flex-col justify-between gap-2 ${
              dinas.includes('Malam') ? 'bg-indigo-50/50 border-indigo-200' : 'bg-slate-50 border-slate-200'
            }`}>
              <div>
                <div className="flex items-center gap-1.5">
                  <Flashlight className="w-4 h-4 text-indigo-600" />
                  <span className="font-bold text-slate-900">Senter Taktis / Searchlight High-Power</span>
                  {dinas.includes('Malam') && (
                    <span className="text-[10px] bg-indigo-100 text-indigo-700 px-1.5 py-0.2 rounded font-bold">
                      Krusial Dinas Malam
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">Senter pencari jarak jauh untuk memantau satwa di runway &amp; strip malam hari.</p>
              </div>
              <div className="flex items-center gap-1.5 self-end">
                {(['Baik / Normal', 'Kurang / Perhatian', 'Rusak / Mati / Nihil'] as CheckItemStatus[]).map((status) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => setSenterTaktisSearchlight(status)}
                    className={`px-2.5 py-1 rounded text-[11px] font-bold border transition cursor-pointer ${
                      senterTaktisSearchlight === status
                        ? status === 'Baik / Normal'
                          ? 'bg-emerald-600 text-white border-emerald-600'
                          : status === 'Kurang / Perhatian'
                          ? 'bg-amber-600 text-white border-amber-600'
                          : 'bg-rose-600 text-white border-rose-600'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>

            {/* Jaring / Animal Rescue Net */}
            <CheckItemRow
              label="Jaring Tangkap / Animal Handling Kit"
              description="Jaring tidak robek, sarung tangan pelindung satwa tersedia."
              value={jaringNetGunHandling}
              onChange={setJaringNetGunHandling}
            />

            {/* APAR Kendaraan */}
            <CheckItemRow
              label="APAR (Alat Pemadam Api Ringan) Kendaraan"
              description="Jarum manometer berada di zona hijau, pin pengaman tersegel."
              value={aparKendaraan}
              onChange={setAparKendaraan}
            />

            {/* Kotak P3K */}
            <CheckItemRow
              label="Kotak Pertolongan Pertama (P3K) Kendaraan"
              description="Obat antiseptik, perban, plester luka lengkap dan belum kadaluarsa."
              value={kotakP3K}
              onChange={setKotakP3K}
            />

            {/* Tool Kit & Dongkrak */}
            <CheckItemRow
              label="Tool Kit, Dongkrak &amp; Kunci Roda"
              description="Dongkrak hidrolik berfungsi, kunci roda dan segitiga pengaman lengkap."
              value={toolKitDongkrak}
              onChange={setToolKitDongkrak}
            />
          </div>
        </div>

        {/* SECTION 5: KESIMPULAN KELAYAKAN & BERITA ACARA SERAH TERIMA */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm space-y-5">
          <div className="flex items-center space-x-2 text-slate-900 font-bold text-sm border-b border-slate-100 pb-3">
            <FileCheck className="w-4 h-4 text-sky-600" />
            <span>V. KELAYAKAN OPERASI &amp; PENGESAHAN SERAH TERIMA TUGAS</span>
          </div>

          {/* Status Kelayakan Armada Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">
              Status Kelayakan Armada Kendaraan Operasional <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setStatusKelayakan('SIAP OPERASI (SERVICEABLE)')}
                className={`p-3.5 rounded-xl border text-left flex items-start space-x-3 transition cursor-pointer ${
                  statusKelayakan === 'SIAP OPERASI (SERVICEABLE)'
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-950 font-bold shadow-xs ring-2 ring-emerald-400/40'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <CheckCircle2 className={`w-5 h-5 shrink-0 mt-0.5 ${
                  statusKelayakan === 'SIAP OPERASI (SERVICEABLE)' ? 'text-emerald-600' : 'text-slate-400'
                }`} />
                <div>
                  <p className="text-xs font-bold">SIAP OPERASI (SERVICEABLE)</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">Semua sistem vital, rotari, dan alat halau satwa normal.</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setStatusKelayakan('SIAP DENGAN CATATAN (SERVICEABLE WITH LIMITATION)')}
                className={`p-3.5 rounded-xl border text-left flex items-start space-x-3 transition cursor-pointer ${
                  statusKelayakan === 'SIAP DENGAN CATATAN (SERVICEABLE WITH LIMITATION)'
                    ? 'border-amber-500 bg-amber-50 text-amber-950 font-bold shadow-xs ring-2 ring-amber-400/40'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <AlertTriangle className={`w-5 h-5 shrink-0 mt-0.5 ${
                  statusKelayakan === 'SIAP DENGAN CATATAN (SERVICEABLE WITH LIMITATION)' ? 'text-amber-600' : 'text-slate-400'
                }`} />
                <div>
                  <p className="text-xs font-bold">SIAP DENGAN CATATAN</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">Ada kekurangan minor yang tidak membahayakan safety.</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setStatusKelayakan('TIDAK SIAP OPERASI (UNSERVICEABLE)')}
                className={`p-3.5 rounded-xl border text-left flex items-start space-x-3 transition cursor-pointer ${
                  statusKelayakan === 'TIDAK SIAP OPERASI (UNSERVICEABLE)'
                    ? 'border-rose-500 bg-rose-50 text-rose-950 font-bold shadow-xs ring-2 ring-rose-400/40'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <XCircle className={`w-5 h-5 shrink-0 mt-0.5 ${
                  statusKelayakan === 'TIDAK SIAP OPERASI (UNSERVICEABLE)' ? 'text-rose-600' : 'text-slate-400'
                }`} />
                <div>
                  <p className="text-xs font-bold">TIDAK SIAP OPERASI</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">Kerusakan berat / rotari mati / rem blong. Dilarang masuk airside.</p>
                </div>
              </button>
            </div>
          </div>

          {/* Catatan Kendala & Catatan Serah Terima */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Catatan Temuan Kerusakan / Masalah Kendaraan
              </label>
              <textarea
                value={catatanKerusakanKendala}
                onChange={(e) => setCatatanKerusakanKendala(e.target.value)}
                rows={3}
                className="w-full p-2.5 border border-slate-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-sky-500 outline-hidden"
                placeholder="Contoh: Air wiper habis telah diisi, lampu dekat sebelah kiri agak bergetar saat melewati infield."
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Catatan Instruksi / Pesan Khusus Serah Terima
              </label>
              <textarea
                value={catatanSerahTerima}
                onChange={(e) => setCatatanSerahTerima(e.target.value)}
                rows={3}
                className="w-full p-2.5 border border-slate-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-sky-500 outline-hidden"
                placeholder="Contoh: Seluruh amunisi suar lengkap 12 butir, kunci mobil diserahkan kepada Petugas Dinas Pagi."
              />
            </div>
          </div>

          {/* Kolom Serah Terima Petugas */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
            <div className="flex items-center space-x-2 text-slate-800 font-bold text-xs">
              <UserCheck className="w-4 h-4 text-sky-600" />
              <span>BERITA ACARA SERAH TERIMA TUGAS PERSONIL</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Petugas Menyerahkan */}
              <div className="bg-white p-3 rounded-lg border border-slate-200">
                <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider block mb-1">
                  Petugas yang Menyerahkan (Dinas Sebelumnya) *
                </span>
                <input
                  type="text"
                  value={petugasMenyerahkan}
                  onChange={(e) => setPetugasMenyerahkan(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded text-xs font-bold text-slate-900 focus:ring-2 focus:ring-sky-500 outline-hidden"
                  placeholder="Nama Petugas (misal: Rahmat H.)"
                  required
                />
                {previousRoster.personnel.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-slate-100">
                    <span className="text-[10px] font-semibold text-amber-900 block mb-1">
                      Pilih dari {previousRoster.pleton} ({previousRoster.shiftType === 'PAGI' ? 'Dinas Pagi / APME' : 'Dinas Malam / APMG'}):
                    </span>
                    <div className="flex items-center gap-1 flex-wrap">
                      {previousRoster.personnel.map(p => {
                        const val = `${p.nama} (${p.nik})`;
                        const isSelected = petugasMenyerahkan === val;
                        return (
                          <button
                            key={p.nik}
                            type="button"
                            onClick={() => setPetugasMenyerahkan(val)}
                            className={`px-1.5 py-0.5 rounded text-[10px] border transition cursor-pointer ${
                              isSelected
                                ? 'bg-amber-600 text-white border-amber-700 font-bold'
                                : 'bg-slate-50 hover:bg-amber-50 text-slate-700 border-slate-200'
                            }`}
                          >
                            {p.nama}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
                <span className="text-[10px] text-slate-400 mt-1 block">Tanda tangan / verifikasi penyerahan</span>
              </div>

              {/* Petugas Menerima */}
              <div className="bg-white p-3 rounded-lg border border-slate-200">
                <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block mb-1">
                  Petugas yang Menerima (Dinas Selanjutnya) *
                </span>
                <input
                  type="text"
                  value={petugasMenerima}
                  onChange={(e) => setPetugasMenerima(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded text-xs font-bold text-slate-900 focus:ring-2 focus:ring-sky-500 outline-hidden"
                  placeholder="Nama Petugas (misal: Achmad Fauzi)"
                  required
                />
                {calculatedRoster.personnel.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-slate-100">
                    <span className="text-[10px] font-semibold text-emerald-900 block mb-1">
                      Pilih dari {calculatedRoster.pleton} ({calculatedRoster.shiftType === 'PAGI' ? 'Dinas Pagi / APME' : 'Dinas Malam / APMG'}):
                    </span>
                    <div className="flex items-center gap-1 flex-wrap">
                      {calculatedRoster.personnel.map(p => {
                        const val = `${p.nama} (${p.nik})`;
                        const isSelected = petugasMenerima === val;
                        return (
                          <button
                            key={p.nik}
                            type="button"
                            onClick={() => setPetugasMenerima(val)}
                            className={`px-1.5 py-0.5 rounded text-[10px] border transition cursor-pointer ${
                              isSelected
                                ? 'bg-emerald-600 text-white border-emerald-700 font-bold'
                                : 'bg-slate-50 hover:bg-emerald-50 text-slate-700 border-slate-200'
                            }`}
                          >
                            {p.nama}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
                <span className="text-[10px] text-slate-400 mt-1 block">Tanda tangan / verifikasi penerimaan</span>
              </div>

              {/* Supervisor / Lead Verifikator */}
              <div className="bg-white p-3 rounded-lg border border-slate-200">
                <span className="text-[10px] font-bold text-sky-700 uppercase tracking-wider block mb-1">
                  Pengawas / Lead WHU (Mengetahui)
                </span>
                <input
                  type="text"
                  value={supervisorLead}
                  onChange={(e) => setSupervisorLead(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded text-xs font-bold text-slate-900 focus:ring-2 focus:ring-sky-500 outline-hidden"
                  placeholder="Rachmaditya (Dept Head WHU)"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">Otoritas verifikasi bandara</span>
              </div>
            </div>
          </div>
        </div>

        {/* VI. DOKUMENTASI FISIK KENDARAAN & PERALATAN */}
        <DocumentationUpload
          photos={fotos}
          onPhotosChange={setFotos}
          keterangan={keteranganDokumentasi}
          onKeteranganChange={setKeteranganDokumentasi}
          maxPhotos={5}
          sectionNumber="VI"
          title="DOKUMENTASI KONDISI KENDARAAN & PERALATAN"
          subtitle="Unggah bukti foto kondisi fisik kendaraan dinas, rotary airside, amunisi flare gun, atau kelengkapan halau satwa (maksimal 5 foto)."
          placeholderKeterangan="Deskripsi dokumentasi fisik kendaraan (misal: Foto 1: Tampilan bodi kendaraan & rotary light aktif, Foto 2: Odometer dan amunisi flare gun lengkap)..."
          themeColor="teal"
        />

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <div className="flex flex-wrap items-center gap-2">
            {(onCancelEdit || onCancel) && (
              <button
                type="button"
                onClick={onCancelEdit || onCancel}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold rounded-lg text-xs transition cursor-pointer"
              >
                Batal {isEditMode ? 'Edit' : ''}
              </button>
            )}
            <button
              type="button"
              onClick={handleMarkAllNormal}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg text-xs transition cursor-pointer flex items-center gap-1"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Standar Normal</span>
            </button>

            <button
              type="button"
              onClick={handleQuickDownloadPDF}
              className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-300 font-bold rounded-lg text-xs flex items-center gap-1.5 transition cursor-pointer shadow-xs"
              title="Unduh Bukti PDF Resmi untuk arsip dan verifikasi pimpinan"
            >
              <Download className="w-4 h-4 text-rose-600" />
              <span>Unduh Bukti PDF</span>
            </button>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Tombol Simpan Draft */}
            <button
              type="button"
              onClick={handleSaveDraft}
              disabled={isSubmitting}
              className="px-4 py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 font-bold rounded-lg text-xs sm:text-sm shadow-xs flex items-center gap-1.5 transition cursor-pointer"
              title="Simpan sementara sebagai draft agar bisa dilanjutkan nanti tanpa validasi serah terima"
            >
              <Bookmark className="w-4 h-4 text-amber-600 fill-amber-600/30" />
              <span>Simpan sebagai Draft</span>
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className={`px-6 py-2.5 text-white font-bold rounded-lg text-xs sm:text-sm shadow-md flex items-center gap-2 transition cursor-pointer ${
                initialData?.isDraft
                  ? 'bg-emerald-600 hover:bg-emerald-500'
                  : 'bg-sky-600 hover:bg-sky-500'
              }`}
            >
              <Save className="w-4 h-4" />
              <span>
                {initialData?.isDraft 
                  ? 'Terbitkan Laporan Resmi & Serah Terima' 
                  : initialData 
                  ? 'Perbarui Laporan Serah Terima' 
                  : 'Simpan Laporan & Serah Terima Kendaraan'}
              </span>
            </button>
          </div>
        </div>
      </form>

      {/* Completion & Leadership WAG Report Modal */}
      {showCompletionModal && savedReportObj && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="bg-slate-900 text-white p-5 border-b border-slate-800">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 rounded-xl bg-teal-600 text-white shadow-md">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[10px] font-mono bg-teal-500/20 text-teal-300 font-bold px-2 py-0.5 rounded uppercase">
                    BERHASIL DISIMPAN &amp; TERVERIFIKASI
                  </span>
                  <h3 className="font-bold text-lg text-white mt-1">
                    Laporan Kendaraan Siap Dikirim ke WAG Pimpinan
                  </h3>
                  <p className="text-xs text-slate-400">
                    No. Dokumen: <span className="font-mono text-sky-400 font-bold">{savedReportObj.reportNumber}</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Body */}
            <div className="p-5 space-y-4 text-xs text-slate-700">
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 space-y-1">
                <p className="font-bold text-emerald-900 text-sm flex items-center gap-1.5">
                  <Truck className="w-4 h-4 text-emerald-600" />
                  {savedReportObj.merkModel} ({savedReportObj.nomorLambung}) &bull; {savedReportObj.statusKelayakan}
                </p>
                <p className="text-emerald-800 text-[11px]">
                  Pemeriksaan dinas {savedReportObj.dinas} ({savedReportObj.pleton}) oleh <strong>{savedReportObj.petugasMenerima}</strong> (diserahkan oleh <strong>{savedReportObj.petugasMenyerahkan}</strong>).
                </p>
              </div>

              {/* 2 Step reporting guide for WAG */}
              <div className="bg-gradient-to-r from-sky-50 via-slate-50 to-teal-50 border border-sky-200 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-sky-600" />
                    Instruksi Pelaporan Resmi ke WhatsApp Group (WAG) Pimpinan:
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={handleQuickDownloadPDF}
                    className="p-3 bg-white hover:bg-rose-50 border-2 border-rose-300 hover:border-rose-500 rounded-xl text-left transition flex items-start gap-2.5 shadow-sm cursor-pointer group"
                  >
                    <div className="p-2 bg-rose-100 text-rose-700 rounded-lg group-hover:bg-rose-600 group-hover:text-white transition shrink-0">
                      <Download className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 text-xs group-hover:text-rose-900">
                        1. Unduh Bukti PDF
                      </p>
                      <p className="text-[10px] text-slate-500 mt-0.5 leading-snug">
                        Simpan bukti PDF resmi Berita Acara &amp; 5 Foto Dokumentasi.
                      </p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setShowCompletionModal(false);
                      if (onOpenBroadcast) onOpenBroadcast(savedReportObj);
                    }}
                    className="p-3 bg-white hover:bg-emerald-50 border-2 border-emerald-400 hover:border-emerald-600 rounded-xl text-left transition flex items-start gap-2.5 shadow-sm cursor-pointer group"
                  >
                    <div className="p-2 bg-emerald-100 text-emerald-700 rounded-lg group-hover:bg-emerald-600 group-hover:text-white transition shrink-0">
                      <Share2 className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 text-xs group-hover:text-emerald-900">
                        2. Buka WAG Pimpinan
                      </p>
                      <p className="text-[10px] text-slate-500 mt-0.5 leading-snug">
                        Kirim ringkasan pesan WhatsApp lalu lampirkan file PDF.
                      </p>
                    </div>
                  </button>
                </div>
              </div>

              {pdfDownloadedToast && (
                <div className="p-2.5 bg-sky-100 border border-sky-300 rounded-lg text-sky-900 flex items-center gap-2 text-xs font-semibold">
                  <Check className="w-4 h-4 text-sky-700" />
                  <span>File Bukti PDF Resmi ({savedReportObj.reportNumber}) berhasil diunduh ke perangkat Anda!</span>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2">
              {onNavigateToHistory && (
                <button
                  type="button"
                  onClick={() => {
                    setShowCompletionModal(false);
                    onNavigateToHistory();
                  }}
                  className="px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg text-xs font-semibold transition cursor-pointer"
                >
                  Buka Arsip Riwayat
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  setShowCompletionModal(false);
                }}
                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition cursor-pointer ml-auto"
              >
                Selesai / Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Subcomponent row for checklist items
const CheckItemRow: React.FC<{
  label: string;
  description: string;
  value: CheckItemStatus;
  onChange: (status: CheckItemStatus) => void;
}> = ({ label, description, value, onChange }) => {
  return (
    <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex flex-col justify-between gap-2">
      <div>
        <p className="font-bold text-slate-900">{label}</p>
        <p className="text-[11px] text-slate-500 mt-0.5">{description}</p>
      </div>

      <div className="flex items-center gap-1.5 self-end">
        {(['Baik / Normal', 'Kurang / Perhatian', 'Rusak / Mati / Nihil'] as CheckItemStatus[]).map((status) => (
          <button
            key={status}
            type="button"
            onClick={() => onChange(status)}
            className={`px-2.5 py-1 rounded text-[11px] font-bold border transition cursor-pointer ${
              value === status
                ? status === 'Baik / Normal'
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                  : status === 'Kurang / Perhatian'
                  ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                  : 'bg-rose-600 text-white border-rose-600 shadow-xs'
                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
            }`}
          >
            {status}
          </button>
        ))}
      </div>
    </div>
  );
};
