import React, { useState, useEffect, useMemo } from 'react';
import { 
  FileText, 
  Plus, 
  Trash2, 
  Save, 
  Download, 
  Share2, 
  CheckCircle2, 
  FileSpreadsheet,
  AlertCircle,
  AlertTriangle,
  Edit3,
  X,
  Compass,
  MapPin,
  RotateCcw,
  Sparkles,
  Calendar,
  Users,
  Sun,
  Moon,
  Bookmark
} from 'lucide-react';
import { getActiveDutyInfo } from '../utils/dutyRosterService';
import { PatrolReport, Pleton, Dinas, Cuaca, SpeciesObservation, SelectiveLethalItem } from '../types';
import { exportPatrolPDF } from '../utils/pdfExport';
import { exportSinglePatrolToExcel } from '../utils/excelExport';
import { CoordinateChecker } from './CoordinateChecker';
import { DateTimeCalendarPicker } from './DateTimeCalendarPicker';
import { DocumentationUpload } from './DocumentationUpload';
import { 
  DEFAULT_AIRPORT_ARP, 
  evaluatePatrolCoordinates, 
  AIRPORT_COORDINATE_PRESETS 
} from '../utils/geoUtils';
import { generateSequentialReportNumber, formatReportCreationTime } from '../utils/reportNumberGenerator';
import { WHMP_ZONES } from '../config/whmpRiskConfig';

interface PatrolFormProps {
  onSaveReport: (report: PatrolReport) => void;
  onOpenBroadcast: (report: PatrolReport) => void;
  onNavigateToHistory?: () => void;
  initialData?: PatrolReport | null;
  isEditMode?: boolean;
  onCancelEdit?: () => void;
  onOpenDutyRoster?: () => void;
  existingReports?: PatrolReport[];
}

export const PatrolForm: React.FC<PatrolFormProps> = ({
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
    return generateSequentialReportNumber('PATROL', existingReports, initialData?.createdAt || new Date().toISOString());
  });

  useEffect(() => {
    if (!initialData && !isEditMode) {
      setReportNumber(generateSequentialReportNumber('PATROL', existingReports, createdAt));
    }
  }, [existingReports, initialData, isEditMode, createdAt]);

  const [hariTanggal, setHariTanggal] = useState<string>(initialData?.hariTanggal || '');
  const [pleton, setPleton] = useState<Pleton>(initialData?.pleton || 'Pleton Alpha');
  const [dinas, setDinas] = useState<Dinas>(initialData?.dinas || 'Dinas Pagi (08:00 - 20:00)');
  const [podList, setPodList] = useState<string[]>(initialData?.pod && initialData.pod.length > 0 ? initialData.pod : ['']);
  const [waktuPatroli, setWaktuPatroli] = useState<string>(initialData?.waktuPatroli || '');
  const [durasi, setDurasi] = useState<string>(initialData?.durasi || '');
  const [cuaca, setCuaca] = useState<Cuaca>(initialData?.cuaca || 'Cerah');
  const [suhu, setSuhu] = useState<string>(initialData?.suhu || '');
  const [situasiOperasional, setSituasiOperasional] = useState<string>(initialData?.situasiOperasional || '');

  // Auto Roster Synchronization
  const [autoRosterSync, setAutoRosterSync] = useState<boolean>(!initialData);

  const startTimeFromPatroli = useMemo(() => {
    const match = waktuPatroli.match(/(\d{1,2}:\d{2})/);
    return match ? match[1] : '';
  }, [waktuPatroli]);

  const calculatedRoster = useMemo(() => {
    return getActiveDutyInfo(hariTanggal, startTimeFromPatroli);
  }, [hariTanggal, startTimeFromPatroli]);

  // Synchronize pleton and dinas automatically when date/time changes
  useEffect(() => {
    if (autoRosterSync && !isEditMode) {
      setPleton(calculatedRoster.pleton);
      setDinas(calculatedRoster.dinas);
    }
  }, [calculatedRoster, autoRosterSync, isEditMode]);

  const handleApplyRosterPersonnel = () => {
    setPodList(calculatedRoster.podFormattedList);
  };

  // II. Rute Patroli
  const [rutePatroli, setRutePatroli] = useState<string>(initialData?.rutePatroli || '');
  const [gridLocation, setGridLocation] = useState<string>(initialData?.gridLocation || '');
  const [whmpZoneId, setWhmpZoneId] = useState<string>(initialData?.whmpZoneId || 'zone-1');

  // II.B Koordinat & Radius Operasional Bandara
  const [patrolLatitude, setPatrolLatitude] = useState<string>(
    initialData?.coordinates?.latitude ? String(initialData.coordinates.latitude) : ''
  );
  const [patrolLongitude, setPatrolLongitude] = useState<string>(
    initialData?.coordinates?.longitude ? String(initialData.coordinates.longitude) : ''
  );
  const [operationalRadiusKm, setOperationalRadiusKm] = useState<number>(
    initialData?.coordinates?.maxRadiusAllowedKm || 8.0
  );
  const [confirmedOutsideReason, setConfirmedOutsideReason] = useState<string>(
    initialData?.coordinates?.confirmedOutsideReason || ''
  );
  const [showOutsideRadiusWarningModal, setShowOutsideRadiusWarningModal] = useState<boolean>(false);

  // Evaluasi Geospasial terhadap Radius Operasional Bandara
  const coordEval = useMemo(() => {
    return evaluatePatrolCoordinates(
      patrolLatitude,
      patrolLongitude,
      operationalRadiusKm,
      DEFAULT_AIRPORT_ARP
    );
  }, [patrolLatitude, patrolLongitude, operationalRadiusKm]);

  // III. Temuan Satwa Liar
  const [temuanSatwa, setTemuanSatwa] = useState<SpeciesObservation[]>(initialData?.temuanSatwa || []);

  // IV. Monitoring Habitat dan Vegetasi
  const [kondisiVegetasi, setKondisiVegetasi] = useState<string>(initialData?.kondisiVegetasi || '');
  const [kondisiDrainase, setKondisiDrainase] = useState<string>(initialData?.kondisiDrainase || '');
  const [potensiAttractant, setPotensiAttractant] = useState<string>(initialData?.potensiAttractant || '');
  const [habitatManagement, setHabitatManagement] = useState<string>(initialData?.habitatManagement || '');
  const [areaPerhatian, setAreaPerhatian] = useState<string>(initialData?.areaPerhatian || '');

  // V. Tindakan Pengendalian
  const [mobileDispersal, setMobileDispersal] = useState<string>(initialData?.nonLethal?.mobileDispersal || '');
  const [auditoryDeterrent, setAuditoryDeterrent] = useState<string>(initialData?.nonLethal?.auditoryDeterrent || '');
  const [visualDeterrent, setVisualDeterrent] = useState<string>(initialData?.nonLethal?.visualDeterrent || '');
  const [monitoringFlyway, setMonitoringFlyway] = useState<string>(initialData?.nonLethal?.monitoringFlyway || '');

  // 5.2 Selective Lethal Control
  const [lethalItems, setLethalItems] = useState<SelectiveLethalItem[]>(initialData?.selectiveLethal?.items || []);

  // VI. Kesimpulan
  const [kesimpulanList, setKesimpulanList] = useState<string[]>(
    initialData?.kesimpulan && initialData.kesimpulan.length > 0 ? initialData.kesimpulan : ['']
  );

  // VII. Mitigasi
  const [mitigasiList, setMitigasiList] = useState<string[]>(
    initialData?.mitigasi && initialData.mitigasi.length > 0 ? initialData.mitigasi : ['']
  );

  // VIII. Dokumentasi & Foto
  const [keteranganDokumentasi, setKeteranganDokumentasi] = useState<string>(initialData?.keteranganDokumentasi || '');
  const [fotos, setFotos] = useState<string[]>(initialData?.fotos || []);

  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  // Populate form if initialData is provided (Edit Mode)
  useEffect(() => {
    if (initialData) {
      setHariTanggal(initialData.hariTanggal || '');
      setPleton(initialData.pleton || 'Pleton Alpha');
      setDinas(initialData.dinas || 'Dinas Pagi (08:00 - 20:00)');
      setPodList(initialData.pod && initialData.pod.length > 0 ? initialData.pod : ['']);
      setWaktuPatroli(initialData.waktuPatroli || '');
      setDurasi(initialData.durasi || '');
      setCuaca(initialData.cuaca || 'Cerah');
      setSuhu(initialData.suhu || '28°C');
      setSituasiOperasional(initialData.situasiOperasional || '');
      setRutePatroli(initialData.rutePatroli || '');
      setGridLocation(initialData.gridLocation || '');
      setWhmpZoneId(initialData.whmpZoneId || 'zone-1');
      if (initialData.coordinates) {
        setPatrolLatitude(String(initialData.coordinates.latitude));
        setPatrolLongitude(String(initialData.coordinates.longitude));
        setOperationalRadiusKm(initialData.coordinates.maxRadiusAllowedKm || 8.0);
        setConfirmedOutsideReason(initialData.coordinates.confirmedOutsideReason || '');
      }
      if (initialData.temuanSatwa) {
        setTemuanSatwa(initialData.temuanSatwa);
      }
      setKondisiVegetasi(initialData.kondisiVegetasi || '');
      setKondisiDrainase(initialData.kondisiDrainase || '');
      setPotensiAttractant(initialData.potensiAttractant || '');
      setHabitatManagement(initialData.habitatManagement || '');
      setAreaPerhatian(initialData.areaPerhatian || '');
      if (initialData.nonLethal) {
        setMobileDispersal(initialData.nonLethal.mobileDispersal || '');
        setAuditoryDeterrent(initialData.nonLethal.auditoryDeterrent || '');
        setVisualDeterrent(initialData.nonLethal.visualDeterrent || '');
        setMonitoringFlyway(initialData.nonLethal.monitoringFlyway || '');
      }
      if (initialData.selectiveLethal?.items) {
        setLethalItems(initialData.selectiveLethal.items);
      }
      if (initialData.kesimpulan) {
        setKesimpulanList(initialData.kesimpulan);
      }
      if (initialData.mitigasi) {
        setMitigasiList(initialData.mitigasi);
      }
      setKeteranganDokumentasi(initialData.keteranganDokumentasi || '');
      setFotos(initialData.fotos || []);
      setSavedSuccess(false);
    }
  }, [initialData]);

  // Calculations
  const totalPopulasi = temuanSatwa.reduce((acc, curr) => acc + (Number(curr.jumlah) || 0), 0);
  const totalLethal = lethalItems.reduce((acc, curr) => acc + (Number(curr.jumlah) || 0), 0);

  // Handlers for Satwa Liar
  const handleAddSatwa = () => {
    setTemuanSatwa([...temuanSatwa, { id: String(Date.now()), spesies: '', jumlah: 1, keterangan: '' }]);
  };

  const handleUpdateSatwa = (index: number, field: keyof SpeciesObservation, value: any) => {
    const updated = [...temuanSatwa];
    updated[index] = { ...updated[index], [field]: value };
    setTemuanSatwa(updated);
  };

  const handleRemoveSatwa = (index: number) => {
    setTemuanSatwa(temuanSatwa.filter((_, i) => i !== index));
  };

  // Handlers for Lethal
  const handleAddLethal = () => {
    setLethalItems([...lethalItems, { id: String(Date.now()), spesies: '', jumlah: 1 }]);
  };

  const handleRemoveLethal = (index: number) => {
    setLethalItems(lethalItems.filter((_, i) => i !== index));
  };

  // Build Report Object
  const currentReport: PatrolReport = {
    id: initialData?.id || `patrol-${Date.now()}`,
    reportNumber,
    createdAt,
    updatedAt: new Date().toISOString(),
    hariTanggal,
    pleton,
    dinas,
    pod: podList.filter(p => p.trim() !== '').length > 0 ? podList.filter(p => p.trim() !== '') : ['Petugas Pelaksana WHU'],
    waktuPatroli,
    durasi,
    cuaca,
    suhu,
    situasiOperasional,
    rutePatroli,
    gridLocation,
    coordinates: coordEval.isValidCoordinate ? {
      latitude: coordEval.latitude,
      longitude: coordEval.longitude,
      distanceFromArpKm: coordEval.distanceFromArpKm,
      isWithinOperationalRadius: coordEval.isWithinRadius,
      maxRadiusAllowedKm: coordEval.maxRadiusAllowedKm,
      bearingDegree: coordEval.bearingDegree,
      cardinalDirection: coordEval.cardinalDirection,
      verifiedAt: new Date().toISOString(),
      confirmedOutsideReason: !coordEval.isWithinRadius ? confirmedOutsideReason : undefined
    } : undefined,
    temuanSatwa,
    totalPopulasiTeramati: totalPopulasi,
    kondisiVegetasi,
    kondisiDrainase,
    potensiAttractant,
    habitatManagement,
    areaPerhatian,
    nonLethal: {
      mobileDispersal,
      auditoryDeterrent,
      visualDeterrent,
      monitoringFlyway
    },
    selectiveLethal: {
      items: lethalItems,
      totalLethal
    },
    kesimpulan: kesimpulanList.filter(k => k.trim() !== ''),
    mitigasi: mitigasiList.filter(m => m.trim() !== ''),
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
        const raw = localStorage.getItem('whu_draft_patrol_auto');
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && (parsed.hariTanggal || parsed.rutePatroli || (parsed.podList && parsed.podList.some((p: string) => p.trim() !== '')))) {
            setHasAutoDraft(true);
            setAutoDraftTimestamp(parsed._savedAt || '');
          }
        }
      } catch {}
    }
  }, [initialData]);

  const loadAutoDraft = () => {
    try {
      const raw = localStorage.getItem('whu_draft_patrol_auto');
      if (raw) {
        const d = JSON.parse(raw);
        if (d.hariTanggal) setHariTanggal(d.hariTanggal);
        if (d.waktuPatroli) setWaktuPatroli(d.waktuPatroli);
        if (d.durasi) setDurasi(d.durasi);
        if (d.pleton) setPleton(d.pleton);
        if (d.dinas) setDinas(d.dinas);
        if (d.podList && Array.isArray(d.podList)) setPodList(d.podList);
        if (d.cuaca) setCuaca(d.cuaca);
        if (d.suhu) setSuhu(d.suhu);
        if (d.situasiOperasional) setSituasiOperasional(d.situasiOperasional);
        if (d.rutePatroli) setRutePatroli(d.rutePatroli);
        if (d.gridLocation) setGridLocation(d.gridLocation);
        if (d.whmpZoneId) setWhmpZoneId(d.whmpZoneId);
        if (d.patrolLatitude) setPatrolLatitude(d.patrolLatitude);
        if (d.patrolLongitude) setPatrolLongitude(d.patrolLongitude);
        if (d.temuanSatwa || d.observations) setTemuanSatwa(d.temuanSatwa || d.observations);
        if (d.kondisiVegetasi) setKondisiVegetasi(d.kondisiVegetasi);
        if (d.kondisiDrainase) setKondisiDrainase(d.kondisiDrainase);
        if (d.potensiAttractant) setPotensiAttractant(d.potensiAttractant);
        if (d.habitatManagement) setHabitatManagement(d.habitatManagement);
        if (d.areaPerhatian) setAreaPerhatian(d.areaPerhatian);
        if (d.mobileDispersal) setMobileDispersal(d.mobileDispersal);
        if (d.auditoryDeterrent) setAuditoryDeterrent(d.auditoryDeterrent);
        if (d.visualDeterrent) setVisualDeterrent(d.visualDeterrent);
        if (d.monitoringFlyway) setMonitoringFlyway(d.monitoringFlyway);
        if (d.lethalItems) setLethalItems(d.lethalItems);
        if (d.kesimpulanList) setKesimpulanList(d.kesimpulanList);
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
      localStorage.removeItem('whu_draft_patrol_auto');
    } catch {}
    setHasAutoDraft(false);
  };

  // Debounced auto-save draft locally while filling
  useEffect(() => {
    if (!initialData && !savedSuccess) {
      const timer = setTimeout(() => {
        try {
          if (hariTanggal || rutePatroli || (podList.length > 0 && podList[0].trim() !== '')) {
            const draftData = {
              hariTanggal,
              waktuPatroli,
              durasi,
              pleton,
              dinas,
              podList,
              cuaca,
              suhu,
              situasiOperasional,
              rutePatroli,
              gridLocation,
              whmpZoneId,
              patrolLatitude,
              patrolLongitude,
              temuanSatwa,
              kondisiVegetasi,
              kondisiDrainase,
              potensiAttractant,
              habitatManagement,
              areaPerhatian,
              mobileDispersal,
              auditoryDeterrent,
              visualDeterrent,
              monitoringFlyway,
              lethalItems,
              kesimpulanList,
              mitigasiList,
              keteranganDokumentasi,
              fotos,
              _savedAt: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
            };
            localStorage.setItem('whu_draft_patrol_auto', JSON.stringify(draftData));
          }
        } catch {}
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [
    initialData,
    savedSuccess,
    hariTanggal,
    waktuPatroli,
    durasi,
    pleton,
    dinas,
    podList,
    cuaca,
    suhu,
    situasiOperasional,
    rutePatroli,
    gridLocation,
    patrolLatitude,
    patrolLongitude,
    temuanSatwa,
    kondisiVegetasi,
    kondisiDrainase,
    potensiAttractant,
    habitatManagement,
    areaPerhatian,
    mobileDispersal,
    auditoryDeterrent,
    visualDeterrent,
    monitoringFlyway,
    lethalItems,
    kesimpulanList,
    mitigasiList,
    keteranganDokumentasi,
    fotos
  ]);

  const executeSave = (asDraft: boolean = false) => {
    const coordinatesData = coordEval.isValidCoordinate ? {
      latitude: coordEval.latitude,
      longitude: coordEval.longitude,
      distanceFromArpKm: coordEval.distanceFromArpKm,
      isWithinOperationalRadius: coordEval.isWithinRadius,
      maxRadiusAllowedKm: coordEval.maxRadiusAllowedKm,
      bearingDegree: coordEval.bearingDegree,
      cardinalDirection: coordEval.cardinalDirection,
      verifiedAt: new Date().toISOString(),
      confirmedOutsideReason: !coordEval.isWithinRadius ? confirmedOutsideReason : undefined
    } : undefined;

    const finalReport: PatrolReport = {
      ...currentReport,
      id: initialData?.id || `patrol-${Date.now()}`,
      reportNumber: reportNumber,
      createdAt: createdAt,
      updatedAt: new Date().toISOString(),
      isDraft: asDraft,
      draftSavedAt: asDraft ? new Date().toISOString() : undefined,
      coordinates: coordinatesData,
      whmpZoneId,
      whmpZoneName: WHMP_ZONES.find(z => z.id === whmpZoneId)?.name || 'Zona 1: Runway Strips & RESA',
      whmpZoneIsCritical: WHMP_ZONES.find(z => z.id === whmpZoneId)?.isCritical ?? true,
      keteranganDokumentasi,
      fotos,
      pod: podList.filter(p => p.trim() !== '').length > 0 ? podList.filter(p => p.trim() !== '') : [asDraft ? 'Petugas WHU (Draft)' : 'Petugas Pelaksana WHU']
    };
    onSaveReport(finalReport);
    setIsLastSavedDraft(asDraft);
    setSavedSuccess(true);
    setShowOutsideRadiusWarningModal(false);
    try {
      localStorage.removeItem('whu_draft_patrol_auto');
    } catch {}
  };

  const handleSaveDraft = () => {
    executeSave(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    // Jika koordinat berada di luar radius operasional dan belum diisi justifikasi alasan luar perimeter
    if (coordEval.isValidCoordinate && !coordEval.isWithinRadius && !confirmedOutsideReason.trim()) {
      setShowOutsideRadiusWarningModal(true);
      return;
    }
    executeSave(false);
  };

  return (
    <form onSubmit={handleSave} className="max-w-4xl mx-auto bg-white rounded-xl border border-slate-200 shadow-sm p-6 sm:p-8 text-slate-800 space-y-8">
      {/* Official Header */}
      <div className="border-b border-slate-200 pb-5">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div>
            <span className="text-xs font-bold text-sky-800 uppercase tracking-widest">
              PT ANGKASA PURA INDONESIA - ARFF DIVISION
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-0.5 uppercase">
              {isEditMode ? 'EDIT WOR — WILDLIFE OBSERVATION REPORT' : '1. WOR — WILDLIFE OBSERVATION REPORT'}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Observasi dan pengumpulan data satwa liar • Unit Wildlife Hazard (WHS)
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
              onClick={() => exportPatrolPDF(currentReport)}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
              title="Download format PDF resmi"
            >
              <Download className="w-3.5 h-3.5 text-rose-600" />
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
                Terdapat data draft patroli yang belum diselesaikan (tersimpan otomatis pukul {autoDraftTimestamp || 'sebelumnya'}). Ingin melanjutkan pengisian?
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

      {/* Draft Mode Alert Banner (when opened from History) */}
      {initialData?.isDraft && (
        <div className="p-4 rounded-xl bg-amber-500/15 border-2 border-amber-400 text-amber-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-amber-600 text-white rounded-lg shrink-0">
              <Bookmark className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-sm text-slate-900">Mode Edit Draft WOR (Observasi Satwa)</span>
                <span className="px-2 py-0.5 bg-amber-200 text-amber-900 font-mono font-bold rounded text-[11px] border border-amber-300">
                  DRAFT • {initialData.reportNumber}
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

      {/* Edit Mode Alert Banner (for published reports) */}
      {isEditMode && initialData && !initialData.isDraft && (
        <div className="p-4 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-amber-500 text-white rounded-lg shrink-0">
              <Edit3 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-sm text-slate-900">Mode Edit Dokumen WOR (Observasi Satwa)</span>
                <span className="px-2 py-0.5 bg-amber-200 text-amber-900 font-mono font-bold rounded text-[11px] border border-amber-300">
                  {initialData.reportNumber}
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-0.5">
                Anda sedang mengubah dokumen resmi yang sudah tersimpan. Klik "Simpan Perubahan Laporan" untuk memperbarui data arsip.
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
              <strong>{isEditMode ? 'Perubahan Berhasil Diperbarui!' : 'Berhasil Disimpan!'}</strong> Laporan patroli telah disinkronkan ke sistem dan dashboard.
            </span>
          </div>
          <button
            type="button"
            onClick={() => onOpenBroadcast(currentReport)}
            className="px-3 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded text-xs font-semibold flex items-center gap-1 cursor-pointer"
          >
            <Share2 className="w-3.5 h-3.5" />
            Kirim Broadcast WA
          </button>
        </div>
      )}

      {/* Nomor Dokumen Resmi & Urutan Kronologis */}
      <div className="bg-sky-50/80 border border-sky-200 rounded-xl p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-700">No. Dokumen PDF:</span>
          <span className="font-mono font-bold text-sky-900 bg-white px-2.5 py-1 rounded-md border border-sky-300 shadow-2xs">
            {reportNumber}
          </span>
        </div>
        <span className="text-[11px] text-slate-500">
          Penomoran otomatis berurutan sesuai waktu pembuatan ({formatReportCreationTime(createdAt)})
        </span>
      </div>

      {/* I. DATA KEGIATAN */}
      <div className="space-y-4">
        <div className="bg-slate-100 px-3 py-1.5 rounded text-sm font-bold text-slate-800 border-l-4 border-sky-600">
          I. DATA KEGIATAN
        </div>

        {/* Kalender & Waktu Patroli */}
        <DateTimeCalendarPicker
          hariTanggal={hariTanggal}
          onHariTanggalChange={setHariTanggal}
          mode="range"
          waktuPatroli={waktuPatroli}
          onWaktuPatroliChange={setWaktuPatroli}
          durasi={durasi}
          onDurasiChange={setDurasi}
          accentColor="sky"
        />

        {/* Smart Roster Indicator Banner */}
        <div className="bg-sky-50/80 border border-sky-200 rounded-lg p-3 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 bg-sky-600 text-white rounded-md shrink-0">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-sky-950">Roster Otomatis CGK:</span>
                <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-sky-100 text-sky-800 border border-sky-300">
                  {calculatedRoster.pleton}
                </span>
                <span className="text-slate-600">
                  • {calculatedRoster.dinas} ({calculatedRoster.shiftCode})
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {autoRosterSync 
                  ? 'Pleton dan dinas otomatis disinkronkan berdasarkan tanggal & waktu patroli.' 
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

            <button
              type="button"
              onClick={handleApplyRosterPersonnel}
              className="px-2.5 py-1 bg-sky-700 hover:bg-sky-800 text-white rounded font-semibold text-[11px] flex items-center gap-1 cursor-pointer transition shadow-2xs"
              title="Isi Personil Pelapor otomatis dengan nama petugas dari jadwal roster"
            >
              <Users className="w-3 h-3" />
              <span>Isi Personel Roster</span>
            </button>

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

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-semibold text-slate-700">Pleton</label>
              {autoRosterSync && (
                <span className="text-[10px] text-sky-600 font-medium">Otomatis Roster</span>
              )}
            </div>
            <select
              value={pleton}
              onChange={e => {
                setPleton(e.target.value as Pleton);
                setAutoRosterSync(false);
              }}
              className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-sky-500 bg-white"
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
                <span className="text-[10px] text-sky-600 font-medium">Otomatis Waktu</span>
              )}
            </div>
            <select
              value={dinas}
              onChange={e => {
                setDinas(e.target.value as Dinas);
                setAutoRosterSync(false);
              }}
              className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-sky-500 bg-white"
            >
              <option value="Dinas Pagi (08:00 - 20:00)">Dinas Pagi (08:00 - 20:00)</option>
              <option value="Dinas Malam (20:00 - 08:00)">Dinas Malam (20:00 - 08:00)</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Cuaca &amp; Suhu</label>
            <div className="grid grid-cols-2 gap-2">
              <select
                value={cuaca}
                onChange={e => setCuaca(e.target.value as Cuaca)}
                className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-sky-500 bg-white"
              >
                <option value="Cerah">Cerah</option>
                <option value="Berawan">Berawan</option>
                <option value="Hujan Ringan">Hujan Ringan</option>
                <option value="Hujan Lebat">Hujan Lebat</option>
                <option value="Berkabut">Berkabut</option>
              </select>
              <input
                type="text"
                value={suhu}
                onChange={e => setSuhu(e.target.value)}
                placeholder="e.g. 28°C"
                className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-sky-500"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Situasi Operasional</label>
            <input
              type="text"
              value={situasiOperasional}
              onChange={e => setSituasiOperasional(e.target.value)}
              placeholder="e.g. Lalu lintas udara lancar, runway aktif normal"
              className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-sky-500"
            />
          </div>
        </div>

        {/* Nama Pelapor Pelaksana / Person on Duty (POD) */}
        <div className="mt-3 p-3 bg-sky-50/60 rounded-lg border border-sky-100">
          <div className="flex items-center justify-between mb-1.5">
            <label className="block font-semibold text-slate-800 text-xs">
              Nama Personil Pelapor / Pelaksana Tugas (Diisi Manual) :
            </label>
            <span className="text-[10px] text-sky-700 bg-sky-100/80 px-2 py-0.5 rounded font-mono">
              Diisi manual oleh petugas piket
            </span>
          </div>
          <div className="space-y-2">
            {podList.map((pod, idx) => (
              <div key={idx} className="flex items-center space-x-2">
                <span className="text-xs text-sky-700 font-bold w-5 text-right font-mono">{idx + 1}.</span>
                <input
                  type="text"
                  value={pod}
                  onChange={e => {
                    const next = [...podList];
                    next[idx] = e.target.value;
                    setPodList(next);
                  }}
                  placeholder="Ketik Nama Lengkap Petugas Pelaksana..."
                  className="flex-1 px-3 py-1.5 text-xs border border-slate-300 rounded focus:ring-1 focus:ring-sky-500 bg-white shadow-2xs"
                />
                {podList.length > 1 && (
                  <button
                    type="button"
                    onClick={() => setPodList(podList.filter((_, i) => i !== idx))}
                    className="text-slate-400 hover:text-red-600 p-1 rounded hover:bg-red-50 cursor-pointer"
                    title="Hapus Petugas"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
            <div className="flex items-center justify-between pt-1 flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setPodList([...podList, ''])}
                className="text-xs text-sky-700 hover:text-sky-800 font-semibold flex items-center gap-1 px-2 py-1 rounded bg-sky-100/70 hover:bg-sky-100 cursor-pointer transition"
              >
                <Plus className="w-3.5 h-3.5" /> Tambah Kolom Petugas Lain
              </button>
              <button
                type="button"
                onClick={handleApplyRosterPersonnel}
                className="text-xs text-slate-600 hover:text-sky-700 font-medium flex items-center gap-1 cursor-pointer transition"
              >
                <RotateCcw className="w-3 h-3" /> Muat Semua Personel Pleton Ini ({calculatedRoster.pleton})
              </button>
            </div>

            {/* Quick Chips of Roster Officers */}
            {calculatedRoster.personnel.length > 0 && (
              <div className="pt-2 mt-1 border-t border-sky-200/60 flex items-center gap-1.5 flex-wrap text-xs">
                <span className="text-[11px] font-semibold text-sky-900">Pilih Cepat Personel:</span>
                {calculatedRoster.personnel.map((p, pIdx) => {
                  const label = `${p.nama} (${p.nik})`;
                  const isSelected = podList.includes(label);
                  return (
                    <button
                      key={p.nik || `personnel-${pIdx}`}
                      type="button"
                      onClick={() => {
                        if (isSelected) {
                          const remaining = podList.filter(item => item !== label);
                          setPodList(remaining.length > 0 ? remaining : ['']);
                        } else {
                          if (podList.length === 1 && podList[0].trim() === '') {
                            setPodList([label]);
                          } else {
                            setPodList([...podList, label]);
                          }
                        }
                      }}
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold transition cursor-pointer border flex items-center gap-1 ${
                        isSelected 
                          ? 'bg-sky-700 text-white border-sky-800' 
                          : 'bg-white hover:bg-sky-100 text-sky-800 border-sky-300 shadow-2xs'
                      }`}
                    >
                      {isSelected ? <CheckCircle2 className="w-2.5 h-2.5" /> : <Plus className="w-2.5 h-2.5" />}
                      <span>{p.nama}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* II. RUTE PATROLI */}
      <div className="space-y-3">
        <div className="bg-slate-100 px-3 py-1.5 rounded text-sm font-bold text-slate-800 border-l-4 border-sky-600 flex items-center justify-between">
          <span>II. RUTE PATROLI &amp; SEKTOR GRID MAP</span>
          <span className="text-xs text-sky-700 font-mono">WHMP Bab II &amp; Grid Map 2025</span>
        </div>

        {/* Alokasi Zonasi Risiko WHMP (Bab II) */}
        <div className="bg-sky-50/70 border border-sky-200 rounded-lg p-3">
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
                Pilih zonasi sesuai dokumen Wildlife Hazard Management Plan. Zona 1–3 merupakan area kritis pergerakan pesawat.
              </p>
            </div>
            <div className="text-[11px] bg-white border border-sky-200 rounded px-2.5 py-1 text-slate-600 font-mono">
              Cakupan: <span className="font-semibold text-sky-800">{WHMP_ZONES.find(z => z.id === whmpZoneId)?.airsideArea || '-'}</span>
            </div>
          </div>
          <select
            value={whmpZoneId}
            onChange={e => setWhmpZoneId(e.target.value)}
            className="w-full px-3 py-2 text-xs border border-sky-300 rounded bg-white font-medium text-slate-800 focus:ring-1 focus:ring-sky-500"
          >
            {WHMP_ZONES.map(z => (
              <option key={z.id} value={z.id}>
                {z.name} {z.isCritical ? '⚠️ [CRITICAL ZONE]' : ''} — {z.description}
              </option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2">
            <label className="block font-semibold text-slate-700 text-xs mb-1">Deskripsi Rute Patroli</label>
            <textarea
              rows={2}
              value={rutePatroli}
              onChange={e => setRutePatroli(e.target.value)}
              placeholder="Tuliskan rute patroli perimeter, runway, taxiway, drainase..."
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded focus:ring-1 focus:ring-sky-500"
            />
          </div>
          <div>
            <label className="block font-semibold text-slate-700 text-xs mb-1">Fokus Koordinat Grid Utama</label>
            <div className="flex space-x-1.5">
              <input
                type="text"
                value={gridLocation}
                onChange={e => setGridLocation(e.target.value)}
                placeholder="e.g. Grid E7"
                className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded focus:ring-1 focus:ring-sky-500 font-mono font-bold text-sky-900"
              />
              <select
                onChange={e => {
                  const val = e.target.value;
                  setGridLocation(val);
                  const matched = AIRPORT_COORDINATE_PRESETS.find(p => p.grid === val);
                  if (matched) {
                    setPatrolLatitude(matched.latitude.toFixed(5));
                    setPatrolLongitude(matched.longitude.toFixed(5));
                  }
                }}
                className="px-2 py-1 text-xs border border-slate-300 rounded bg-slate-50 font-mono"
                defaultValue=""
              >
                <option value="" disabled>Pilih...</option>
                <option value="Grid E7">Grid E7 (RWY 1 Infield)</option>
                <option value="Grid C8">Grid C8 (RWY 2 / TWY C3)</option>
                <option value="Grid A7">Grid A7 (RWY 3 Central)</option>
                <option value="Grid G12">Grid G12 (Threshold 25L)</option>
                <option value="Grid B3">Grid B3 (Threshold 07L)</option>
                <option value="Grid D2">Grid D2 (Kolam Retensi Barat)</option>
                <option value="Grid D13">Grid D13 (Water Storage Timur)</option>
              </select>
            </div>
            <p className="text-[10px] text-slate-500 mt-1">Koordinat peta grid 14×7 Soekarno-Hatta (WIII)</p>
          </div>
        </div>

        {/* Pemeriksaan Koordinat GPS & Validasi Radius Operasional */}
        <div className="mt-3">
          <CoordinateChecker
            latitude={patrolLatitude}
            longitude={patrolLongitude}
            onLatitudeChange={setPatrolLatitude}
            onLongitudeChange={setPatrolLongitude}
            operationalRadiusKm={operationalRadiusKm}
            onOperationalRadiusChange={setOperationalRadiusKm}
            onPresetSelect={(preset) => {
              if (preset.grid && preset.grid !== 'ARP' && !preset.grid.startsWith('Off')) {
                setGridLocation(preset.grid);
              }
            }}
            confirmedOutsideReason={confirmedOutsideReason}
            onConfirmedOutsideReasonChange={setConfirmedOutsideReason}
          />
        </div>
      </div>

      {/* III. TEMUAN SATWA LIAR */}
      <div className="space-y-3">
        <div className="flex items-center justify-between bg-slate-100 px-3 py-1.5 rounded border-l-4 border-sky-600">
          <span className="text-sm font-bold text-slate-800">III. TEMUAN SATWA LIAR</span>
          <button
            type="button"
            onClick={handleAddSatwa}
            className="text-xs bg-sky-600 hover:bg-sky-500 text-white px-2.5 py-1 rounded flex items-center gap-1 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> Tambah Satwa
          </button>
        </div>

        <div className="overflow-x-auto border border-slate-200 rounded">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
              <tr>
                <th className="p-2 w-10 text-center">No</th>
                <th className="p-2">Jenis / Nama Satwa</th>
                <th className="p-2 w-28 text-center">Jumlah (Ekor)</th>
                <th className="p-2">Keterangan / Lokasi</th>
                <th className="p-2 w-12 text-center">Hapus</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {temuanSatwa.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-4 text-center text-slate-400 italic">
                    Belum ada data temuan satwa liar. Klik tombol <span className="font-semibold text-sky-600">"+ Tambah Satwa"</span> di atas untuk mencatat observasi.
                  </td>
                </tr>
              ) : (
                temuanSatwa.map((item, idx) => (
                  <tr key={item.id} className="hover:bg-slate-50">
                    <td className="p-2 text-center font-mono text-slate-400">{idx + 1}</td>
                    <td className="p-2">
                      <input
                        type="text"
                        value={item.spesies}
                        onChange={e => handleUpdateSatwa(idx, 'spesies', e.target.value)}
                        placeholder="e.g. Burung Kuntul Kerbau (Bubulcus ibis)"
                        className="w-full px-2 py-1 border border-slate-300 rounded text-xs"
                      />
                    </td>
                    <td className="p-2 text-center">
                      <input
                        type="number"
                        min={0}
                        value={item.jumlah}
                        onChange={e => handleUpdateSatwa(idx, 'jumlah', parseInt(e.target.value) || 0)}
                        className="w-20 px-2 py-1 border border-slate-300 rounded text-center text-xs font-semibold"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="text"
                        value={item.keterangan || ''}
                        onChange={e => handleUpdateSatwa(idx, 'keterangan', e.target.value)}
                        placeholder="Lokasi dan aktivitas..."
                        className="w-full px-2 py-1 border border-slate-300 rounded text-xs"
                      />
                    </td>
                    <td className="p-2 text-center">
                      <button
                        type="button"
                        onClick={() => handleRemoveSatwa(idx)}
                        className="text-slate-400 hover:text-red-600 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex justify-end p-2 bg-slate-50 rounded border border-slate-200">
          <p className="text-xs font-bold text-slate-800">
            Total Populasi Teramati : <span className="text-sky-700 text-sm">{totalPopulasi} ekor</span>
          </p>
        </div>
      </div>

      {/* IV. MONITORING HABITAT DAN VEGETASI */}
      <div className="space-y-3">
        <div className="bg-slate-100 px-3 py-1.5 rounded text-sm font-bold text-slate-800 border-l-4 border-sky-600">
          IV. MONITORING HABITAT DAN VEGETASI
        </div>

        <div className="space-y-3 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              1. Kondisi Vegetasi / Rumput :
            </label>
            <input
              type="text"
              value={kondisiVegetasi}
              onChange={e => setKondisiVegetasi(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-sky-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              2. Kondisi Drainase / Genangan Air :
            </label>
            <input
              type="text"
              value={kondisiDrainase}
              onChange={e => setKondisiDrainase(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-sky-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              3. Potensi Wildlife Attractant :
            </label>
            <input
              type="text"
              value={potensiAttractant}
              onChange={e => setPotensiAttractant(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-sky-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              4. Habitat Management :
            </label>
            <input
              type="text"
              value={habitatManagement}
              onChange={e => setHabitatManagement(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-sky-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              5. Area Perhatian :
            </label>
            <input
              type="text"
              value={areaPerhatian}
              onChange={e => setAreaPerhatian(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-sky-500"
            />
          </div>
        </div>
      </div>

      {/* V. TINDAKAN PENGENDALIAN */}
      <div className="space-y-4">
        <div className="bg-slate-100 px-3 py-1.5 rounded text-sm font-bold text-slate-800 border-l-4 border-sky-600">
          V. TINDAKAN PENGENDALIAN
        </div>

        <div className="space-y-3">
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
            5.1 Non-Lethal Control
          </h4>
          <div className="space-y-2 text-xs">
            <div>
              <label className="block text-slate-600 mb-0.5">• Mobile dispersal :</label>
              <input
                type="text"
                value={mobileDispersal}
                onChange={e => setMobileDispersal(e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-300 rounded focus:ring-1 focus:ring-sky-500"
              />
            </div>
            <div>
              <label className="block text-slate-600 mb-0.5">• Auditory deterrent :</label>
              <input
                type="text"
                value={auditoryDeterrent}
                onChange={e => setAuditoryDeterrent(e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-300 rounded focus:ring-1 focus:ring-sky-500"
              />
            </div>
            <div>
              <label className="block text-slate-600 mb-0.5">• Visual deterrent :</label>
              <input
                type="text"
                value={visualDeterrent}
                onChange={e => setVisualDeterrent(e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-300 rounded focus:ring-1 focus:ring-sky-500"
              />
            </div>
            <div>
              <label className="block text-slate-600 mb-0.5">• Monitoring flyway movement :</label>
              <input
                type="text"
                value={monitoringFlyway}
                onChange={e => setMonitoringFlyway(e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-300 rounded focus:ring-1 focus:ring-sky-500"
              />
            </div>
          </div>
        </div>

        {/* 5.2 Selective Lethal Control */}
        <div className="space-y-2 pt-2 border-t border-slate-100">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
              5.2 Selective Lethal Control
            </h4>
            <button
              type="button"
              onClick={handleAddLethal}
              className="text-xs text-sky-700 hover:text-sky-800 font-semibold flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Tambah Baris
            </button>
          </div>

          <div className="space-y-2">
            {lethalItems.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-1 bg-slate-50 px-3 rounded border border-dashed border-slate-200">
                Tidak ada satwa yang menjadi target selective lethal control pada patroli ini.
              </p>
            ) : (
              lethalItems.map((item, idx) => (
                <div key={item.id} className="flex items-center space-x-2 text-xs">
                  <span className="text-slate-400 font-mono">•</span>
                  <input
                    type="text"
                    value={item.spesies}
                    onChange={e => {
                      const next = [...lethalItems];
                      next[idx].spesies = e.target.value;
                      setLethalItems(next);
                    }}
                    placeholder="Spesies target selective lethal"
                    className="flex-1 px-3 py-1.5 border border-slate-300 rounded"
                  />
                  <div className="flex items-center space-x-1">
                    <input
                      type="number"
                      min={0}
                      value={item.jumlah}
                      onChange={e => {
                        const next = [...lethalItems];
                        next[idx].jumlah = parseInt(e.target.value) || 0;
                        setLethalItems(next);
                      }}
                      className="w-20 px-2 py-1.5 border border-slate-300 rounded text-center font-bold"
                    />
                    <span className="text-slate-500">ekor</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveLethal(idx)}
                    className="p-1 text-slate-400 hover:text-red-600"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
          <p className="text-xs font-bold text-slate-700 text-right">
            Total Selective Lethal : <span className="text-slate-900">{totalLethal} ekor</span>
          </p>
        </div>
      </div>

      {/* VI. KESIMPULAN */}
      <div className="space-y-3">
        <div className="flex items-center justify-between bg-slate-100 px-3 py-1.5 rounded border-l-4 border-sky-600">
          <span className="text-sm font-bold text-slate-800">VI. KESIMPULAN</span>
          <button
            type="button"
            onClick={() => setKesimpulanList([...kesimpulanList, ''])}
            className="text-xs text-sky-700 hover:text-sky-800 font-semibold flex items-center gap-1 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> Tambah Poin
          </button>
        </div>

        <div className="space-y-2">
          {kesimpulanList.map((item, idx) => (
            <div key={idx} className="flex items-start space-x-2 text-xs">
              <span className="font-bold text-slate-600 mt-2">{idx + 1}.</span>
              <input
                type="text"
                value={item}
                onChange={e => {
                  const next = [...kesimpulanList];
                  next[idx] = e.target.value;
                  setKesimpulanList(next);
                }}
                placeholder="Poin kesimpulan..."
                className="flex-1 px-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-sky-500"
              />
              {kesimpulanList.length > 1 && (
                <button
                  type="button"
                  onClick={() => setKesimpulanList(kesimpulanList.filter((_, i) => i !== idx))}
                  className="p-2 text-slate-400 hover:text-red-600"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* VII. MITIGASI */}
      <div className="space-y-3">
        <div className="flex items-center justify-between bg-slate-100 px-3 py-1.5 rounded border-l-4 border-sky-600">
          <span className="text-sm font-bold text-slate-800">VII. MITIGASI</span>
          <button
            type="button"
            onClick={() => setMitigasiList([...mitigasiList, ''])}
            className="text-xs text-sky-700 hover:text-sky-800 font-semibold flex items-center gap-1 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> Tambah Mitigasi
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
                placeholder="Tindakan mitigasi lanjutan..."
                className="flex-1 px-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-sky-500"
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

      {/* VIII. DOKUMENTASI KEGIATAN & FOTO LAPANGAN (MAKSIMAL 5 FOTO) */}
      <DocumentationUpload
        photos={fotos}
        onPhotosChange={setFotos}
        keterangan={keteranganDokumentasi}
        onKeteranganChange={setKeteranganDokumentasi}
        maxPhotos={5}
        sectionNumber="VIII"
        title="DOKUMENTASI KEGIATAN & FOTO LAPANGAN"
        subtitle="Unggah bukti dokumentasi foto kegiatan patroli & pemantauan satwa liar (maksimal 5 foto)."
        placeholderKeterangan="Deskripsi dokumentasi kegiatan patroli (misal: Foto 1: Pemantauan area Runway 07L, Foto 2: Burung kuntul di drainase sektor Bravo)..."
        themeColor="sky"
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
                  ? 'Draft Laporan WOR (Observasi Satwa) Berhasil Disimpan!' 
                  : isEditMode 
                  ? 'Perubahan Dokumen WOR Berhasil Diperbarui!' 
                  : 'Laporan WOR (Observasi Satwa) Resmi Berhasil Disimpan & Disinkronkan!'}
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
                className="flex-1 sm:flex-initial px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1 cursor-pointer transition shadow-xs"
              >
                <Share2 className="w-3.5 h-3.5" />
                Kirim WA
              </button>
            )}
          </div>
        </div>
      )}

      {/* Form Action Controls */}
      <div className="pt-6 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-2 flex-wrap">
          <button
            type="button"
            onClick={() => exportPatrolPDF(currentReport)}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
            title="Download PDF sesuai format resmi"
          >
            <Download className="w-4 h-4 text-rose-600" />
            Cetak PDF Resmi
          </button>
          <button
            type="button"
            onClick={() => exportSinglePatrolToExcel(currentReport)}
            className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer border border-emerald-200"
            title="Download Spreadsheet Excel"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            Export Excel
          </button>
        </div>

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
                : 'bg-sky-600 hover:bg-sky-500'
            }`}
          >
            <Save className="w-4 h-4" />
            <span>
              {initialData?.isDraft 
                ? 'Terbitkan Laporan Resmi' 
                : isEditMode 
                ? 'Simpan Perubahan Dokumen WOR' 
                : 'Simpan Laporan WOR (Observasi Satwa)'}
            </span>
          </button>
        </div>
      </div>

      {/* Outside Operational Radius Warning Confirmation Modal */}
      {showOutsideRadiusWarningModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden border border-rose-300">
            <div className="bg-rose-700 px-5 py-3.5 text-white flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-5 h-5 text-amber-300 animate-pulse" />
                <h3 className="font-bold text-sm uppercase tracking-wide">
                  Peringatan: Koordinat di Luar Radius Operasional
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowOutsideRadiusWarningModal(false)}
                className="text-white/80 hover:text-white text-lg font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs text-slate-700">
              <div className="p-3 bg-rose-50 rounded-lg border border-rose-200">
                <p className="font-bold text-rose-900 mb-1">
                  Titik Patroli Melampaui Batas Radius Bandara:
                </p>
                <div className="grid grid-cols-2 gap-2 mt-2 font-mono text-[11px]">
                  <div>
                    <span className="text-slate-500 block font-sans">Jarak ke ARP WIII:</span>
                    <strong className="text-rose-700 text-sm">{coordEval.distanceFromArpKm} km</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block font-sans">Batas Ditentukan:</span>
                    <strong className="text-slate-800 text-sm">{coordEval.maxRadiusAllowedKm} km</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block font-sans">Kelebihan Jarak:</span>
                    <strong className="text-rose-700 font-bold">+{coordEval.excessDistanceKm} km</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block font-sans">Arah Kompas:</span>
                    <strong className="text-slate-800">{coordEval.cardinalDirection} ({coordEval.bearingDegree}°)</strong>
                  </div>
                </div>
              </div>

              <p className="leading-relaxed">
                Standar ICAO Doc 9137 dan SOP Wildlife Hazard menghendaki inspeksi airside dilaksanakan di dalam area runway/perimeter bandara. Jika titik ini adalah survei satwa liar eksternal (off-airport attractant survey), silakan masukkan alasan atau justifikasi di bawah ini untuk melanjutkan penyimpanan.
              </p>

              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  Alasan / Justifikasi Patroli di Luar Perimeter: <span className="text-red-600">*</span>
                </label>
                <textarea
                  rows={2}
                  value={confirmedOutsideReason}
                  onChange={(e) => setConfirmedOutsideReason(e.target.value)}
                  placeholder="Contoh: Pemantauan kawanan burung kuntul di persawahan/rawa luar perimeter utara yang berpotensi melintasi runway..."
                  className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-rose-500 bg-white"
                />
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowOutsideRadiusWarningModal(false)}
                  className="w-full sm:w-auto px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-semibold transition cursor-pointer"
                >
                  Kembali &amp; Koreksi Titik
                </button>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => {
                      setPatrolLatitude('-6.12850');
                      setPatrolLongitude('106.66200');
                      setGridLocation('Grid E7');
                      setShowOutsideRadiusWarningModal(false);
                    }}
                    className="w-full sm:w-auto px-3 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded font-semibold transition cursor-pointer"
                  >
                    Reset ke Infield (E7)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (!confirmedOutsideReason.trim()) {
                        alert('Silakan masukkan alasan atau justifikasi patroli luar perimeter terlebih dahulu.');
                        return;
                      }
                      executeSave();
                    }}
                    className="w-full sm:w-auto px-4 py-2 bg-rose-700 hover:bg-rose-600 text-white rounded font-bold transition shadow cursor-pointer"
                  >
                    Konfirmasi &amp; Tetap Simpan
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </form>
  );
};
