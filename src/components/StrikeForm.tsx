import React, { useState, useEffect, useMemo } from 'react';
import { 
  AlertTriangle, 
  Save, 
  Download, 
  Share2, 
  CheckCircle2, 
  Plus, 
  Trash2, 
  Plane, 
  FileSpreadsheet,
  Edit3,
  X,
  Sparkles,
  Calendar,
  Users,
  RotateCcw,
  Bookmark
} from 'lucide-react';
import { 
  WildlifeStrikeReport, 
  Pleton, 
  Dinas, 
  SourceInfo, 
  FlightPhase, 
  StrikeDamage, 
  StrikeStatus 
} from '../types';
import { exportStrikePDF } from '../utils/pdfExport';
import { DateTimeCalendarPicker } from './DateTimeCalendarPicker';
import { DocumentationUpload } from './DocumentationUpload';
import { IncidentLocationPickerModal } from './IncidentLocationPickerModal';
import { getActiveDutyInfo } from '../utils/dutyRosterService';
import { MapPin, Navigation } from 'lucide-react';
import { generateSequentialReportNumber, formatReportCreationTime } from '../utils/reportNumberGenerator';
import { WHMP_ZONES } from '../config/whmpRiskConfig';

interface StrikeFormProps {
  onSaveReport: (report: WildlifeStrikeReport) => void;
  onOpenBroadcast: (report: WildlifeStrikeReport) => void;
  onNavigateToHistory?: () => void;
  initialData?: WildlifeStrikeReport | null;
  isEditMode?: boolean;
  onCancelEdit?: () => void;
  onOpenDutyRoster?: () => void;
  existingReports?: WildlifeStrikeReport[];
}

export const StrikeForm: React.FC<StrikeFormProps> = ({
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
    return generateSequentialReportNumber('STRIKE', existingReports, initialData?.createdAt || new Date().toISOString());
  });

  useEffect(() => {
    if (!initialData && !isEditMode) {
      setReportNumber(generateSequentialReportNumber('STRIKE', existingReports, createdAt));
    }
  }, [existingReports, initialData, isEditMode, createdAt]);

  // I. DATA KEJADIAN
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
  const [runwayTaxiway, setRunwayTaxiway] = useState<string>(initialData?.runwayTaxiway || '');
  const [coordinates, setCoordinates] = useState<{ latitude: number; longitude: number; distanceFromArpKm?: number } | undefined>(
    initialData?.coordinates
  );
  const [whmpZoneId, setWhmpZoneId] = useState<string>(initialData?.whmpZoneId || 'zone-1');
  const [isMapPickerOpen, setIsMapPickerOpen] = useState<boolean>(false);
  const [sumberInformasi, setSumberInformasi] = useState<SourceInfo>(initialData?.sumberInformasi || 'Pilot/Crew');
  const [sumberLainnya, setSumberLainnya] = useState<string>(initialData?.sumberInformasiLainnya || '');

  // II. DATA PESAWAT
  const [operatorAirline, setOperatorAirline] = useState<string>(initialData?.operatorAirline || '');
  const [flightNumber, setFlightNumber] = useState<string>(initialData?.flightNumber || '');
  const [aircraftType, setAircraftType] = useState<string>(initialData?.aircraftType || '');
  const [registration, setRegistration] = useState<string>(initialData?.registration || '');
  const [origin, setOrigin] = useState<string>(initialData?.origin || '');
  const [destination, setDestination] = useState<string>(initialData?.destination || '');
  const [posisiPesawat, setPosisiPesawat] = useState<string>(initialData?.posisiPesawat || '');

  // III. DATA WILDLIFE
  const [jenisWildlife, setJenisWildlife] = useState<string>(initialData?.jenisWildlife || '');
  const [jumlahWildlife, setJumlahWildlife] = useState<number>(initialData?.jumlahWildlife || 1);
  const [identifikasi, setIdentifikasi] = useState<'Teridentifikasi' | 'Belum teridentifikasi'>(
    initialData?.identifikasi || 'Belum teridentifikasi'
  );
  const [kondisiWildlife, setKondisiWildlife] = useState<'Hidup' | 'Mati' | 'Terluka' | 'Carcass/Sisa' | 'Tidak ditemukan'>(
    initialData?.kondisiWildlife || 'Mati'
  );

  // IV. KRONOLOGI WILDLIFE STRIKE
  const [kronologiStrike, setKronologiStrike] = useState<string>(initialData?.kronologiStrike || '');
  const [fasePenerbangan, setFasePenerbangan] = useState<FlightPhase>(initialData?.fasePenerbangan || 'Landing roll');
  const [bagianPesawatTerdampak, setBagianPesawatTerdampak] = useState<string>(initialData?.bagianPesawatTerdampak || '');

  // V. DAMPAK TERHADAP PESAWAT
  const [indikasiKerusakan, setIndikasiKerusakan] = useState<StrikeDamage>(initialData?.indikasiKerusakan || 'Tidak ada');
  const [bagianKerusakan, setBagianKerusakan] = useState<string>(initialData?.bagianKerusakan || '');
  const [dampakPenerbangan, setDampakPenerbangan] = useState<string>(initialData?.dampakPenerbangan || '');
  const [keteranganDampak, setKeteranganDampak] = useState<string>(initialData?.keteranganDampak || '');

  // VI. TINDAKAN WILDLIFE HAZARD UNIT
  const [penerimaanInformasi, setPenerimaanInformasi] = useState<string>(initialData?.tindakanUnit?.penerimaanInformasi || '');
  const [verifikasiLokasi, setVerifikasiLokasi] = useState<string>(initialData?.tindakanUnit?.verifikasiLokasi || '');
  const [pengumpulanEvidence, setPengumpulanEvidence] = useState<string>(initialData?.tindakanUnit?.pengumpulanEvidence || '');
  const [pengamananPembersihan, setPengamananPembersihan] = useState<string>(initialData?.tindakanUnit?.pengamananPembersihan || '');
  const [dispersalPengendalian, setDispersalPengendalian] = useState<string>(initialData?.tindakanUnit?.dispersalPengendalian || '');
  const [koordinasi, setKoordinasi] = useState<string>(initialData?.tindakanUnit?.koordinasi || '');
  const [dokumentasi, setDokumentasi] = useState<string>(initialData?.tindakanUnit?.dokumentasi || '');

  // VII. HASIL INVESTIGASI AWAL
  const [investigasiSpesies, setInvestigasiSpesies] = useState<string>(initialData?.investigasiAwal?.spesies || '');
  const [investigasiHotspot, setInvestigasiHotspot] = useState<string>(initialData?.investigasiAwal?.lokasiHotspot || '');
  const [investigasiKondisiHabitat, setInvestigasiKondisiHabitat] = useState<string>(initialData?.investigasiAwal?.kondisiHabitat || '');
  const [investigasiPotensiAttractant, setInvestigasiPotensiAttractant] = useState<string>(initialData?.investigasiAwal?.potensiAttractant || '');
  const [investigasiPolaFlyway, setInvestigasiPolaFlyway] = useState<string>(initialData?.investigasiAwal?.polaFlyway || '');
  const [investigasiIndikasiPenyebab, setInvestigasiIndikasiPenyebab] = useState<string>(initialData?.investigasiAwal?.indikasiPenyebab || '');

  // VIII. MITIGASI DAN TINDAK LANJUT
  const [mitigasiList, setMitigasiList] = useState<string[]>(
    initialData?.mitigasi && initialData.mitigasi.length > 0 ? initialData.mitigasi : ['']
  );
  const [rekomendasi, setRekomendasi] = useState<string>(initialData?.rekomendasi || '');

  // IX. DOKUMENTASI / EVIDENCE
  const [fotoSatwaCarcass, setFotoSatwaCarcass] = useState<boolean>(initialData?.evidence?.fotoSatwaCarcass || false);
  const [fotoLokasi, setFotoLokasi] = useState<boolean>(initialData?.evidence?.fotoLokasi || false);
  const [fotoKerusakan, setFotoKerusakan] = useState<boolean>(initialData?.evidence?.fotoKerusakan || false);
  const [video, setVideo] = useState<boolean>(initialData?.evidence?.video || false);
  const [evidenceLain, setEvidenceLain] = useState<string>(initialData?.evidence?.evidenceLain || '');
  const [fotos, setFotos] = useState<string[]>(initialData?.fotos || []);
  const [keteranganDokumentasi, setKeteranganDokumentasi] = useState<string>(initialData?.keteranganDokumentasi || '');

  // X. STATUS LAPORAN
  const [statusLaporan, setStatusLaporan] = useState<StrikeStatus>(initialData?.statusLaporan || 'Initial Report');
  const [tindakLanjut, setTindakLanjut] = useState<boolean>(initialData?.tindakLanjut || false);
  const [keteranganStatus, setKeteranganStatus] = useState<string>(initialData?.keteranganStatus || '');

  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  // Populate form if initialData is provided (Edit Mode)
  useEffect(() => {
    if (initialData) {
      setHariTanggal(initialData.hariTanggal || '');
      setWaktuKejadian(initialData.waktuKejadian || '');
      setPleton(initialData.pleton || 'Pleton Bravo');
      setDinas(initialData.dinas || 'Dinas Pagi (08:00 - 20:00)');
      setPod(initialData.pod || '');
      setLokasi(initialData.lokasi || '');
      setGridLocation(initialData.gridLocation || '');
      setRunwayTaxiway(initialData.runwayTaxiway || '');
      setSumberInformasi(initialData.sumberInformasi || 'Pilot/Crew');
      setSumberLainnya(initialData.sumberInformasiLainnya || '');
      setOperatorAirline(initialData.operatorAirline || '');
      setFlightNumber(initialData.flightNumber || '');
      setAircraftType(initialData.aircraftType || '');
      setRegistration(initialData.registration || '');
      setOrigin(initialData.origin || '');
      setDestination(initialData.destination || '');
      setPosisiPesawat(initialData.posisiPesawat || '');
      setJenisWildlife(initialData.jenisWildlife || '');
      setJumlahWildlife(initialData.jumlahWildlife ?? 1);
      setIdentifikasi(initialData.identifikasi || 'Teridentifikasi');
      setKondisiWildlife(initialData.kondisiWildlife || 'Carcass/Sisa');
      setKronologiStrike(initialData.kronologiStrike || '');
      setFasePenerbangan(initialData.fasePenerbangan || 'Landing roll');
      setBagianPesawatTerdampak(initialData.bagianPesawatTerdampak || '');
      setIndikasiKerusakan(initialData.indikasiKerusakan || 'Tidak ada');
      setBagianKerusakan(initialData.bagianKerusakan || '');
      setDampakPenerbangan(initialData.dampakPenerbangan || '');
      setKeteranganDampak(initialData.keteranganDampak || '');
      if (initialData.tindakanUnit) {
        setPenerimaanInformasi(initialData.tindakanUnit.penerimaanInformasi || '');
        setVerifikasiLokasi(initialData.tindakanUnit.verifikasiLokasi || '');
        setPengumpulanEvidence(initialData.tindakanUnit.pengumpulanEvidence || '');
        setPengamananPembersihan(initialData.tindakanUnit.pengamananPembersihan || '');
        setDispersalPengendalian(initialData.tindakanUnit.dispersalPengendalian || '');
        setKoordinasi(initialData.tindakanUnit.koordinasi || '');
        setDokumentasi(initialData.tindakanUnit.dokumentasi || '');
      }
      if (initialData.investigasiAwal) {
        setInvestigasiSpesies(initialData.investigasiAwal.spesies || '');
        setInvestigasiHotspot(initialData.investigasiAwal.lokasiHotspot || '');
        setInvestigasiKondisiHabitat(initialData.investigasiAwal.kondisiHabitat || '');
        setInvestigasiPotensiAttractant(initialData.investigasiAwal.potensiAttractant || '');
        setInvestigasiPolaFlyway(initialData.investigasiAwal.polaFlyway || '');
        setInvestigasiIndikasiPenyebab(initialData.investigasiAwal.indikasiPenyebab || '');
      }
      if (initialData.mitigasi) {
        setMitigasiList(initialData.mitigasi);
      }
      setRekomendasi(initialData.rekomendasi || '');
      if (initialData.evidence) {
        setFotoSatwaCarcass(!!initialData.evidence.fotoSatwaCarcass);
        setFotoLokasi(!!initialData.evidence.fotoLokasi);
        setFotoKerusakan(!!initialData.evidence.fotoKerusakan);
        setVideo(!!initialData.evidence.video);
        setEvidenceLain(initialData.evidence.evidenceLain || '');
      }
      setFotos(initialData.fotos || []);
      setKeteranganDokumentasi(initialData.keteranganDokumentasi || '');
      setCoordinates(initialData.coordinates);
      setWhmpZoneId(initialData.whmpZoneId || 'zone-1');
      setStatusLaporan(initialData.statusLaporan || 'Final Report');
      setTindakLanjut(!!initialData.tindakLanjut);
      setKeteranganStatus(initialData.keteranganStatus || '');
      setSavedSuccess(false);
    }
  }, [initialData]);

  const currentReport: WildlifeStrikeReport = {
    id: initialData?.id || `strike-${Date.now()}`,
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
    runwayTaxiway,
    coordinates,
    sumberInformasi,
    sumberInformasiLainnya: sumberLainnya,
    operatorAirline,
    flightNumber,
    aircraftType,
    registration,
    origin,
    destination,
    posisiPesawat,
    jenisWildlife,
    jumlahWildlife,
    identifikasi,
    kondisiWildlife,
    kronologiStrike,
    fasePenerbangan,
    bagianPesawatTerdampak,
    indikasiKerusakan,
    bagianKerusakan,
    dampakPenerbangan,
    keteranganDampak,
    tindakanUnit: {
      penerimaanInformasi,
      verifikasiLokasi,
      pengumpulanEvidence,
      pengamananPembersihan,
      dispersalPengendalian,
      koordinasi,
      dokumentasi
    },
    investigasiAwal: {
      spesies: investigasiSpesies,
      lokasiHotspot: investigasiHotspot,
      kondisiHabitat: investigasiKondisiHabitat,
      potensiAttractant: investigasiPotensiAttractant,
      polaFlyway: investigasiPolaFlyway,
      indikasiPenyebab: investigasiIndikasiPenyebab
    },
    mitigasi: mitigasiList.filter(m => m.trim() !== ''),
    rekomendasi,
    evidence: {
      fotoSatwaCarcass,
      fotoLokasi,
      fotoKerusakan,
      video,
      evidenceLain
    },
    fotos,
    keteranganDokumentasi,
    statusLaporan,
    tindakLanjut,
    keteranganStatus
  };

  const [isLastSavedDraft, setIsLastSavedDraft] = useState<boolean>(false);
  const [hasAutoDraft, setHasAutoDraft] = useState<boolean>(false);
  const [autoDraftTimestamp, setAutoDraftTimestamp] = useState<string>('');

  // Check for auto-saved draft in localStorage on mount
  useEffect(() => {
    if (!initialData) {
      try {
        const raw = localStorage.getItem('whu_draft_strike_auto');
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && (parsed.hariTanggal || parsed.flightNumber || parsed.operatorAirline || parsed.kronologiStrike || (parsed.pod && parsed.pod.trim() !== ''))) {
            setHasAutoDraft(true);
            setAutoDraftTimestamp(parsed._savedAt || '');
          }
        }
      } catch {}
    }
  }, [initialData]);

  const loadAutoDraft = () => {
    try {
      const raw = localStorage.getItem('whu_draft_strike_auto');
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
        if (d.runwayTaxiway) setRunwayTaxiway(d.runwayTaxiway);
        if (d.coordinates) setCoordinates(d.coordinates);
        if (d.sumberInformasi) setSumberInformasi(d.sumberInformasi);
        if (d.sumberInformasiLainnya || d.sumberLainnya) setSumberLainnya(d.sumberInformasiLainnya || d.sumberLainnya);
        if (d.operatorAirline) setOperatorAirline(d.operatorAirline);
        if (d.flightNumber) setFlightNumber(d.flightNumber);
        if (d.aircraftType) setAircraftType(d.aircraftType);
        if (d.registration) setRegistration(d.registration);
        if (d.origin) setOrigin(d.origin);
        if (d.destination) setDestination(d.destination);
        if (d.posisiPesawat) setPosisiPesawat(d.posisiPesawat);
        if (d.jenisWildlife) setJenisWildlife(d.jenisWildlife);
        if (d.jumlahWildlife) setJumlahWildlife(d.jumlahWildlife);
        if (d.identifikasi) setIdentifikasi(d.identifikasi);
        if (d.kondisiWildlife) setKondisiWildlife(d.kondisiWildlife);
        if (d.kronologiStrike) setKronologiStrike(d.kronologiStrike);
        if (d.fasePenerbangan) setFasePenerbangan(d.fasePenerbangan);
        if (d.bagianPesawatTerdampak) setBagianPesawatTerdampak(d.bagianPesawatTerdampak);
        if (d.indikasiKerusakan) setIndikasiKerusakan(d.indikasiKerusakan);
        if (d.bagianKerusakan) setBagianKerusakan(d.bagianKerusakan);
        if (d.dampakPenerbangan) setDampakPenerbangan(d.dampakPenerbangan);
        if (d.keteranganDampak) setKeteranganDampak(d.keteranganDampak);
        if (d.penerimaanInformasi) setPenerimaanInformasi(d.penerimaanInformasi);
        if (d.verifikasiLokasi) setVerifikasiLokasi(d.verifikasiLokasi);
        if (d.pengumpulanEvidence) setPengumpulanEvidence(d.pengumpulanEvidence);
        if (d.pengamananPembersihan) setPengamananPembersihan(d.pengamananPembersihan);
        if (d.dispersalPengendalian) setDispersalPengendalian(d.dispersalPengendalian);
        if (d.koordinasi) setKoordinasi(d.koordinasi);
        if (d.dokumentasi) setDokumentasi(d.dokumentasi);
        if (d.investigasiSpesies) setInvestigasiSpesies(d.investigasiSpesies);
        if (d.investigasiHotspot) setInvestigasiHotspot(d.investigasiHotspot);
        if (d.investigasiKondisiHabitat) setInvestigasiKondisiHabitat(d.investigasiKondisiHabitat);
        if (d.investigasiPotensiAttractant) setInvestigasiPotensiAttractant(d.investigasiPotensiAttractant);
        if (d.investigasiPolaFlyway) setInvestigasiPolaFlyway(d.investigasiPolaFlyway);
        if (d.investigasiIndikasiPenyebab) setInvestigasiIndikasiPenyebab(d.investigasiIndikasiPenyebab);
        if (d.mitigasiList) setMitigasiList(d.mitigasiList);
        if (d.rekomendasi) setRekomendasi(d.rekomendasi);
        if (d.statusLaporan) setStatusLaporan(d.statusLaporan);
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
      localStorage.removeItem('whu_draft_strike_auto');
    } catch {}
    setHasAutoDraft(false);
  };

  // Debounced auto-save draft locally while filling
  useEffect(() => {
    if (!initialData && !savedSuccess) {
      const timer = setTimeout(() => {
        try {
          if (hariTanggal || flightNumber || operatorAirline || kronologiStrike || pod.trim() !== '') {
            const draftData = {
              hariTanggal,
              waktuKejadian,
              pleton,
              dinas,
              pod,
              lokasi,
              gridLocation,
              whmpZoneId,
              runwayTaxiway,
              coordinates,
              sumberInformasi,
              sumberLainnya,
              operatorAirline,
              flightNumber,
              aircraftType,
              registration,
              origin,
              destination,
              posisiPesawat,
              jenisWildlife,
              jumlahWildlife,
              identifikasi,
              kondisiWildlife,
              kronologiStrike,
              fasePenerbangan,
              bagianPesawatTerdampak,
              indikasiKerusakan,
              bagianKerusakan,
              dampakPenerbangan,
              keteranganDampak,
              penerimaanInformasi,
              verifikasiLokasi,
              pengumpulanEvidence,
              pengamananPembersihan,
              dispersalPengendalian,
              koordinasi,
              dokumentasi,
              investigasiSpesies,
              investigasiHotspot,
              investigasiKondisiHabitat,
              investigasiPotensiAttractant,
              investigasiPolaFlyway,
              investigasiIndikasiPenyebab,
              mitigasiList,
              rekomendasi,
              statusLaporan,
              keteranganDokumentasi,
              fotos,
              _savedAt: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
            };
            localStorage.setItem('whu_draft_strike_auto', JSON.stringify(draftData));
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
    runwayTaxiway,
    coordinates,
    sumberInformasi,
    sumberLainnya,
    operatorAirline,
    flightNumber,
    aircraftType,
    registration,
    origin,
    destination,
    posisiPesawat,
    jenisWildlife,
    jumlahWildlife,
    identifikasi,
    kondisiWildlife,
    kronologiStrike,
    fasePenerbangan,
    bagianPesawatTerdampak,
    indikasiKerusakan,
    bagianKerusakan,
    dampakPenerbangan,
    keteranganDampak,
    penerimaanInformasi,
    verifikasiLokasi,
    pengumpulanEvidence,
    pengamananPembersihan,
    dispersalPengendalian,
    koordinasi,
    dokumentasi,
    investigasiSpesies,
    investigasiHotspot,
    investigasiKondisiHabitat,
    investigasiPotensiAttractant,
    investigasiPolaFlyway,
    investigasiIndikasiPenyebab,
    mitigasiList,
    rekomendasi,
    statusLaporan,
    keteranganDokumentasi,
    fotos
  ]);

  const executeSave = (asDraft: boolean = false) => {
    const finalReport: WildlifeStrikeReport = {
      ...currentReport,
      id: initialData?.id || `strike-${Date.now()}`,
      reportNumber: reportNumber,
      createdAt: createdAt,
      updatedAt: new Date().toISOString(),
      isDraft: asDraft,
      draftSavedAt: asDraft ? new Date().toISOString() : undefined,
      fotos,
      keteranganDokumentasi,
      pod: pod.trim() !== '' ? pod : (asDraft ? 'Petugas WHU (Draft)' : 'Petugas Pelapor WHU')
    };
    onSaveReport(finalReport);
    setIsLastSavedDraft(asDraft);
    setSavedSuccess(true);
    try {
      localStorage.removeItem('whu_draft_strike_auto');
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
    <form onSubmit={handleSave} className="max-w-4xl mx-auto bg-white rounded-xl border border-red-200 shadow-sm p-6 sm:p-8 text-slate-800 space-y-8">
      {/* Official Header */}
      <div className="border-b-2 border-red-600 pb-5">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div>
            <span className="text-xs font-bold text-red-700 uppercase tracking-widest">
              PT ANGKASA PURA INDONESIA - AIRSIDE SAFETY &amp; QUALITY
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-0.5 uppercase flex items-center justify-center sm:justify-start gap-2">
              <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
              <span>{isEditMode ? 'EDIT WSR — WILDLIFE STRIKE REPORT' : '3. WSR — WILDLIFE STRIKE REPORT'}</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Pencatatan dugaan atau kejadian wildlife strike, bukti, dampak, dan status verifikasi • ICAO IBIS &amp; Doc 9388
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0 flex-wrap justify-center sm:justify-end">
            <button
              type="button"
              onClick={handleSaveDraft}
              className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition shadow-xs cursor-pointer"
              title="Simpan sementara sebagai draft investigasi awal tanpa memicu flash report broadcast darurat"
            >
              <Bookmark className="w-4 h-4 fill-current" />
              <span>Simpan Draft</span>
            </button>
            <button
              type="button"
              onClick={() => exportStrikePDF(currentReport)}
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
                Terdapat data draft wildlife strike yang belum diselesaikan (tersimpan otomatis pukul {autoDraftTimestamp || 'sebelumnya'}). Ingin melanjutkan pengisian?
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
                <span className="font-bold text-sm text-slate-900">Mode Edit Draft WSR (Wildlife Strike)</span>
                <span className="px-2 py-0.5 bg-amber-200 text-amber-900 font-mono font-bold rounded text-[11px] border border-amber-300">
                  DRAFT WSR • {initialData.reportNumber}
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
                <span className="font-bold text-sm text-slate-900">Mode Edit Dokumen WSR (Wildlife Strike)</span>
                <span className="px-2 py-0.5 bg-amber-200 text-amber-900 font-mono font-bold rounded text-[11px] border border-amber-300">
                  {initialData.reportNumber}
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-0.5">
                Anda sedang mengubah laporan wildlife strike resmi yang sudah tersimpan. Klik "Simpan Perubahan Laporan" untuk memperbarui data arsip.
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
              <strong>{isEditMode ? 'Perubahan Berhasil Diperbarui!' : 'Laporan Strike Berhasil Disimpan!'}</strong> Data arsip strike telah disinkronkan ke sistem dan dashboard.
            </span>
          </div>
          <button
            type="button"
            onClick={() => onOpenBroadcast(currentReport)}
            className="px-3 py-1 bg-red-700 hover:bg-red-800 text-white rounded text-xs font-semibold flex items-center gap-1 cursor-pointer"
          >
            <Share2 className="w-3.5 h-3.5" />
            Broadcast Flash Report WA
          </button>
        </div>
      )}

      {/* Nomor Dokumen Resmi & Urutan Kronologis */}
      <div className="bg-red-50/80 border border-red-200 rounded-xl p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-700">No. Dokumen PDF:</span>
          <span className="font-mono font-bold text-red-950 bg-white px-2.5 py-1 rounded-md border border-red-300 shadow-2xs">
            {reportNumber}
          </span>
        </div>
        <span className="text-[11px] text-slate-500">
          Penomoran otomatis berurutan sesuai waktu pembuatan ({formatReportCreationTime(createdAt)})
        </span>
      </div>

      {/* I. DATA KEJADIAN */}
      <div className="space-y-4">
        <div className="bg-red-50 px-3 py-1.5 rounded text-sm font-bold text-red-900 border-l-4 border-red-600">
          I. DATA KEJADIAN
        </div>

        {/* Kalender & Waktu Kejadian */}
        <DateTimeCalendarPicker
          hariTanggal={hariTanggal}
          onHariTanggalChange={setHariTanggal}
          mode="single"
          waktu={waktuKejadian}
          onWaktuChange={setWaktuKejadian}
          accentColor="red"
        />

        {/* Smart Roster Indicator Banner */}
        <div className="bg-red-50/80 border border-red-200 rounded-lg p-3 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 bg-red-600 text-white rounded-md shrink-0">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-red-950">Roster Otomatis CGK:</span>
                <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-red-100 text-red-900 border border-red-300">
                  {calculatedRoster.pleton}
                </span>
                <span className="text-slate-600">
                  • {calculatedRoster.dinas} ({calculatedRoster.shiftCode})
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {autoRosterSync 
                  ? 'Pleton dan dinas otomatis disinkronkan berdasarkan tanggal & waktu kejadian strike.' 
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
                className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white rounded font-semibold text-[11px] flex items-center gap-1 cursor-pointer transition shadow-2xs"
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
                <Calendar className="w-3 h-3 text-red-600" />
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
                <span className="text-[10px] text-red-600 font-medium">Otomatis Roster</span>
              )}
            </div>
            <select
              value={pleton}
              onChange={e => {
                setPleton(e.target.value as Pleton);
                setAutoRosterSync(false);
              }}
              className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-red-500 bg-white"
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
                <span className="text-[10px] text-red-600 font-medium">Otomatis Waktu</span>
              )}
            </div>
            <select
              value={dinas}
              onChange={e => {
                setDinas(e.target.value as Dinas);
                setAutoRosterSync(false);
              }}
              className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-red-500 bg-white"
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
              placeholder="Ketik Nama Lengkap Petugas Pelapor / Person on Duty..."
              className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-red-500 bg-white"
            />
            {/* Quick chips of roster personnel */}
            {calculatedRoster.personnel.length > 0 && (
              <div className="mt-1.5 flex items-center gap-1 flex-wrap">
                <span className="text-[10px] text-slate-500">Pilih Cepat:</span>
                {calculatedRoster.personnel.map((p, pIdx) => {
                  const label = `${p.nama} (${p.nik})`;
                  return (
                    <button
                      key={p.nik || `strike-personnel-${pIdx}`}
                      type="button"
                      onClick={() => setPod(label)}
                      className={`px-1.5 py-0.5 rounded text-[10px] border transition cursor-pointer ${
                        pod === label 
                          ? 'bg-red-700 text-white border-red-800' 
                          : 'bg-white hover:bg-red-50 text-slate-700 border-slate-300'
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
          <div className="bg-rose-50/70 border border-rose-200 rounded-xl p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
            <div>
              <div className="flex items-center gap-1.5 font-bold text-rose-900 text-xs">
                <MapPin className="w-4 h-4 text-rose-700" />
                <span>Pemetaan Titik &amp; Area Strike (Peta Interaktif Sisi Udara)</span>
              </div>
              <p className="text-[11px] text-rose-700/80 mt-0.5">
                {coordinates ? (
                  <span className="font-mono font-bold text-rose-900">
                    GPS: {coordinates.latitude}, {coordinates.longitude} ({coordinates.distanceFromArpKm} km dari ARP)
                  </span>
                ) : (
                  'Tandai posisi tabrakan satwa di runway/taxiway untuk pemetaan hotspot risiko penerbangan.'
                )}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsMapPickerOpen(true)}
              className="px-3.5 py-1.5 bg-rose-700 hover:bg-rose-600 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer shrink-0"
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
              placeholder="e.g. RWY 25R Touchdown Zone"
              className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-red-500"
              required
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1 flex items-center justify-between">
              <span>Koordinat Grid Map CGK 2025</span>
              <span className="text-[10px] text-sky-700 font-mono">14 Col × 7 Row (A-G)</span>
            </label>
            <div className="flex space-x-2">
              <input
                type="text"
                value={gridLocation}
                onChange={e => setGridLocation(e.target.value)}
                placeholder="e.g. Grid C8"
                className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-red-500 font-mono font-bold text-sky-800"
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

          <div className="sm:col-span-2">
            <label className="block font-semibold text-slate-700 mb-1">Runway / Taxiway</label>
            <input
              type="text"
              value={runwayTaxiway}
              onChange={e => setRunwayTaxiway(e.target.value)}
              placeholder="e.g. Runway 25R"
              className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-red-500"
              required
            />
          </div>

          {/* Alokasi Zonasi Risiko WHMP (Bab II) */}
          <div className="sm:col-span-2 bg-rose-50/60 border border-rose-200 rounded-lg p-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-800">Alokasi Zonasi Risiko WHMP (Bab II)</span>
                  {WHMP_ZONES.find(z => z.id === whmpZoneId)?.isCritical ? (
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-bold bg-rose-100 text-rose-700 border border-rose-300">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-pulse"></span>
                      CRITICAL ZONE 1-3 (STRIKE HOTSPOT)
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-100 text-emerald-700 border border-emerald-300">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                      NON-CRITICAL ZONE (4-6)
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500">
                  Klasifikasi zonasi insiden strike sesuai dokumen WHMP Soekarno-Hatta (Zona 1–3 beririsan langsung dengan pergerakan penerbangan).
                </p>
              </div>
              <div className="text-[11px] bg-white border border-rose-200 rounded px-2.5 py-1 text-slate-600 font-mono">
                Cakupan: <span className="font-semibold text-rose-900">{WHMP_ZONES.find(z => z.id === whmpZoneId)?.airsideArea || '-'}</span>
              </div>
            </div>
            <select
              value={whmpZoneId}
              onChange={e => setWhmpZoneId(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-rose-300 rounded bg-white font-medium text-slate-800 focus:ring-1 focus:ring-rose-500"
            >
              {WHMP_ZONES.map(z => (
                <option key={z.id} value={z.id}>
                  {z.name} {z.isCritical ? '⚠️ [CRITICAL ZONE]' : ''} — {z.description}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Sumber Informasi */}
        <div className="text-xs pt-1">
          <label className="block font-semibold text-slate-700 mb-2">Sumber Informasi :</label>
          <div className="flex flex-wrap gap-4">
            {(['ATC', 'Pilot/Crew', 'AMC', 'WHU', 'Lainnya'] as const).map(src => (
              <label key={src} className="flex items-center space-x-1.5 cursor-pointer font-medium text-slate-700">
                <input
                  type="radio"
                  name="sumberInformasi"
                  checked={sumberInformasi === src}
                  onChange={() => setSumberInformasi(src)}
                  className="w-4 h-4 text-red-600 focus:ring-red-500"
                />
                <span>■ {src}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* II. DATA PESAWAT */}
      <div className="space-y-4">
        <div className="bg-red-50 px-3 py-1.5 rounded text-sm font-bold text-red-900 border-l-4 border-red-600">
          II. DATA PESAWAT
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Operator / Airline</label>
            <input
              type="text"
              value={operatorAirline}
              onChange={e => setOperatorAirline(e.target.value)}
              placeholder="e.g. Garuda Indonesia"
              className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-red-500"
              required
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Flight Number</label>
            <input
              type="text"
              value={flightNumber}
              onChange={e => setFlightNumber(e.target.value)}
              placeholder="e.g. GA-320"
              className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-red-500 font-bold"
              required
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Aircraft Type</label>
            <input
              type="text"
              value={aircraftType}
              onChange={e => setAircraftType(e.target.value)}
              placeholder="e.g. B737-800 / A320"
              className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-red-500"
              required
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Registration</label>
            <input
              type="text"
              value={registration}
              onChange={e => setRegistration(e.target.value)}
              placeholder="e.g. PK-GMF"
              className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-red-500 font-mono"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Origin</label>
            <input
              type="text"
              value={origin}
              onChange={e => setOrigin(e.target.value)}
              placeholder="SUB (Surabaya)"
              className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-red-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Destination</label>
            <input
              type="text"
              value={destination}
              onChange={e => setDestination(e.target.value)}
              placeholder="CGK (Jakarta)"
              className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-red-500"
            />
          </div>

          <div className="sm:col-span-3">
            <label className="block font-semibold text-slate-700 mb-1">Posisi Pesawat Saat Kejadian</label>
            <input
              type="text"
              value={posisiPesawat}
              onChange={e => setPosisiPesawat(e.target.value)}
              placeholder="e.g. Touchdown & Roll Out Runway 25R"
              className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-red-500"
            />
          </div>
        </div>
      </div>

      {/* III. DATA WILDLIFE */}
      <div className="space-y-4">
        <div className="bg-red-50 px-3 py-1.5 rounded text-sm font-bold text-red-900 border-l-4 border-red-600">
          III. DATA WILDLIFE
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Jenis Satwa</label>
            <input
              type="text"
              value={jenisWildlife}
              onChange={e => setJenisWildlife(e.target.value)}
              placeholder="e.g. Burung Layang-layang Api (Hirundo rustica)"
              className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-red-500"
              required
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Jumlah</label>
            <input
              type="number"
              min={1}
              value={jumlahWildlife}
              onChange={e => setJumlahWildlife(parseInt(e.target.value) || 1)}
              className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-red-500 font-bold"
              required
            />
          </div>
        </div>

        {/* Identifikasi & Kondisi */}
        <div className="space-y-2 text-xs">
          <div>
            <span className="font-semibold text-slate-700 mr-4">Identifikasi :</span>
            {(['Teridentifikasi', 'Belum teridentifikasi'] as const).map(idOpt => (
              <label key={idOpt} className="inline-flex items-center space-x-1.5 mr-4 cursor-pointer">
                <input
                  type="radio"
                  name="identifikasiSatwa"
                  checked={identifikasi === idOpt}
                  onChange={() => setIdentifikasi(idOpt)}
                  className="w-4 h-4 text-red-600 focus:ring-red-500"
                />
                <span>■ {idOpt}</span>
              </label>
            ))}
          </div>

          <div className="pt-2">
            <span className="font-semibold text-slate-700 block mb-1.5">Kondisi :</span>
            <div className="flex flex-wrap gap-4">
              {(['Hidup', 'Mati', 'Terluka', 'Carcass/Sisa', 'Tidak ditemukan'] as const).map(cond => (
                <label key={cond} className="inline-flex items-center space-x-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="kondisiWildlife"
                    checked={kondisiWildlife === cond}
                    onChange={() => setKondisiWildlife(cond)}
                    className="w-4 h-4 text-red-600 focus:ring-red-500"
                  />
                  <span>■ {cond}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* IV. KRONOLOGI WILDLIFE STRIKE */}
      <div className="space-y-4">
        <div className="bg-red-50 px-3 py-1.5 rounded text-sm font-bold text-red-900 border-l-4 border-red-600">
          IV. KRONOLOGI WILDLIFE STRIKE
        </div>

        <textarea
          rows={4}
          value={kronologiStrike}
          onChange={e => setKronologiStrike(e.target.value)}
          placeholder="Uraikan detail waktu, kronologi kejadian strike, laporan dari pilot/ATC, dan aksi sweeping..."
          className="w-full px-3 py-2 text-xs border border-slate-300 rounded focus:ring-1 focus:ring-red-500"
          required
        />

        <div className="text-xs">
          <label className="block font-bold text-slate-800 uppercase tracking-wide mb-2">
            FASE PENERBANGAN :
          </label>
          <div className="flex flex-wrap gap-4">
            {(['Take-off roll', 'Initial climb', 'Approach', 'Landing roll', 'Taxi', 'Lainnya'] as const).map(phase => (
              <label key={phase} className="flex items-center space-x-1.5 cursor-pointer font-medium text-slate-700">
                <input
                  type="radio"
                  name="fasePenerbangan"
                  checked={fasePenerbangan === phase}
                  onChange={() => setFasePenerbangan(phase)}
                  className="w-4 h-4 text-red-600 focus:ring-red-500"
                />
                <span>■ {phase}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="text-xs">
          <label className="block font-bold text-slate-800 uppercase tracking-wide mb-1">
            BAGIAN PESAWAT YANG TERDAMPAK :
          </label>
          <input
            type="text"
            value={bagianPesawatTerdampak}
            onChange={e => setBagianPesawatTerdampak(e.target.value)}
            placeholder="e.g. Leading Edge Sayap Kiri, Engine #1, Radome, Windshield..."
            className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-red-500"
            required
          />
        </div>
      </div>

      {/* V. DAMPAK TERHADAP PESAWAT */}
      <div className="space-y-4">
        <div className="bg-red-50 px-3 py-1.5 rounded text-sm font-bold text-red-900 border-l-4 border-red-600">
          V. DAMPAK TERHADAP PESAWAT
        </div>

        <div className="text-xs">
          <label className="block font-semibold text-slate-700 mb-2">Indikasi Kerusakan :</label>
          <div className="flex flex-wrap gap-4">
            {(['Tidak ada', 'Ada', 'Belum diketahui'] as const).map(ind => (
              <label key={ind} className="flex items-center space-x-1.5 cursor-pointer font-bold text-slate-800">
                <input
                  type="radio"
                  name="indikasiKerusakan"
                  checked={indikasiKerusakan === ind}
                  onChange={() => setIndikasiKerusakan(ind)}
                  className="w-4 h-4 text-red-600 focus:ring-red-500"
                />
                <span>■ {ind}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Bagian Kerusakan :</label>
            <input
              type="text"
              value={bagianKerusakan}
              onChange={e => setBagianKerusakan(e.target.value)}
              placeholder="Deskripsi dent, retak, atau residu..."
              className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-red-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Dampak Penerbangan :</label>
            <input
              type="text"
              value={dampakPenerbangan}
              onChange={e => setDampakPenerbangan(e.target.value)}
              placeholder="Normal / Delay / Aborted take-off / RTB"
              className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-red-500"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block font-semibold text-slate-700 mb-1">Keterangan :</label>
            <input
              type="text"
              value={keteranganDampak}
              onChange={e => setKeteranganDampak(e.target.value)}
              placeholder="Catatan dari teknisi maskapai / Release to service"
              className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-red-500"
            />
          </div>
        </div>
      </div>

      {/* VI. TINDAKAN WILDLIFE HAZARD UNIT */}
      <div className="space-y-3">
        <div className="bg-red-50 px-3 py-1.5 rounded text-sm font-bold text-red-900 border-l-4 border-red-600">
          VI. TINDAKAN WILDLIFE HAZARD UNIT
        </div>

        <div className="space-y-2 text-xs">
          <div>
            <label className="block text-slate-600 mb-0.5">1. Penerimaan informasi :</label>
            <input
              type="text"
              value={penerimaanInformasi}
              onChange={e => setPenerimaanInformasi(e.target.value)}
              className="w-full px-3 py-1.5 border border-slate-300 rounded focus:ring-1 focus:ring-red-500"
            />
          </div>
          <div>
            <label className="block text-slate-600 mb-0.5">2. Verifikasi lokasi :</label>
            <input
              type="text"
              value={verifikasiLokasi}
              onChange={e => setVerifikasiLokasi(e.target.value)}
              className="w-full px-3 py-1.5 border border-slate-300 rounded focus:ring-1 focus:ring-red-500"
            />
          </div>
          <div>
            <label className="block text-slate-600 mb-0.5">3. Pengumpulan evidence :</label>
            <input
              type="text"
              value={pengumpulanEvidence}
              onChange={e => setPengumpulanEvidence(e.target.value)}
              className="w-full px-3 py-1.5 border border-slate-300 rounded focus:ring-1 focus:ring-red-500"
            />
          </div>
          <div>
            <label className="block text-slate-600 mb-0.5">4. Pengamanan / pembersihan :</label>
            <input
              type="text"
              value={pengamananPembersihan}
              onChange={e => setPengamananPembersihan(e.target.value)}
              className="w-full px-3 py-1.5 border border-slate-300 rounded focus:ring-1 focus:ring-red-500"
            />
          </div>
          <div>
            <label className="block text-slate-600 mb-0.5">5. Dispersal / pengendalian :</label>
            <input
              type="text"
              value={dispersalPengendalian}
              onChange={e => setDispersalPengendalian(e.target.value)}
              className="w-full px-3 py-1.5 border border-slate-300 rounded focus:ring-1 focus:ring-red-500"
            />
          </div>
          <div>
            <label className="block text-slate-600 mb-0.5">6. Koordinasi :</label>
            <input
              type="text"
              value={koordinasi}
              onChange={e => setKoordinasi(e.target.value)}
              className="w-full px-3 py-1.5 border border-slate-300 rounded focus:ring-1 focus:ring-red-500"
            />
          </div>
          <div>
            <label className="block text-slate-600 mb-0.5">7. Dokumentasi :</label>
            <input
              type="text"
              value={dokumentasi}
              onChange={e => setDokumentasi(e.target.value)}
              className="w-full px-3 py-1.5 border border-slate-300 rounded focus:ring-1 focus:ring-red-500"
            />
          </div>
        </div>
      </div>

      {/* VII. HASIL INVESTIGASI AWAL */}
      <div className="space-y-3">
        <div className="bg-red-50 px-3 py-1.5 rounded text-sm font-bold text-red-900 border-l-4 border-red-600">
          VII. HASIL INVESTIGASI AWAL
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Spesies :</label>
            <input
              type="text"
              value={investigasiSpesies}
              onChange={e => setInvestigasiSpesies(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-red-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Lokasi / Hotspot :</label>
            <input
              type="text"
              value={investigasiHotspot}
              onChange={e => setInvestigasiHotspot(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-red-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Kondisi Habitat :</label>
            <input
              type="text"
              value={investigasiKondisiHabitat}
              onChange={e => setInvestigasiKondisiHabitat(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-red-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Potensi Attractant :</label>
            <input
              type="text"
              value={investigasiPotensiAttractant}
              onChange={e => setInvestigasiPotensiAttractant(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-red-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Pola Flyway :</label>
            <input
              type="text"
              value={investigasiPolaFlyway}
              onChange={e => setInvestigasiPolaFlyway(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-red-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Indikasi Penyebab :</label>
            <input
              type="text"
              value={investigasiIndikasiPenyebab}
              onChange={e => setInvestigasiIndikasiPenyebab(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-red-500"
            />
          </div>
        </div>
      </div>

      {/* VIII. MITIGASI DAN TINDAK LANJUT */}
      <div className="space-y-3">
        <div className="flex items-center justify-between bg-red-50 px-3 py-1.5 rounded border-l-4 border-red-600">
          <span className="text-sm font-bold text-red-900">VIII. MITIGASI DAN TINDAK LANJUT</span>
          <button
            type="button"
            onClick={() => setMitigasiList([...mitigasiList, ''])}
            className="text-xs text-red-700 hover:text-red-800 font-semibold flex items-center gap-1 cursor-pointer"
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
                className="flex-1 px-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-red-500"
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

        <div className="text-xs pt-1">
          <label className="block font-semibold text-slate-700 mb-1">Rekomendasi :</label>
          <input
            type="text"
            value={rekomendasi}
            onChange={e => setRekomendasi(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-red-500"
          />
        </div>
      </div>

      {/* IX. DOKUMENTASI / EVIDENCE */}
      <div className="space-y-3">
        <div className="bg-red-50 px-3 py-1.5 rounded text-sm font-bold text-red-900 border-l-4 border-red-600">
          IX. DOKUMENTASI / EVIDENCE
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div>
            <span className="font-semibold block mb-1">Foto Satwa/Carcass:</span>
            <div className="space-x-3">
              <label className="cursor-pointer">
                <input type="radio" checked={fotoSatwaCarcass} onChange={() => setFotoSatwaCarcass(true)} className="mr-1 text-red-600" />
                ■ Ada
              </label>
              <label className="cursor-pointer">
                <input type="radio" checked={!fotoSatwaCarcass} onChange={() => setFotoSatwaCarcass(false)} className="mr-1 text-red-600" />
                ■ Tidak
              </label>
            </div>
          </div>

          <div>
            <span className="font-semibold block mb-1">Foto Lokasi:</span>
            <div className="space-x-3">
              <label className="cursor-pointer">
                <input type="radio" checked={fotoLokasi} onChange={() => setFotoLokasi(true)} className="mr-1 text-red-600" />
                ■ Ada
              </label>
              <label className="cursor-pointer">
                <input type="radio" checked={!fotoLokasi} onChange={() => setFotoLokasi(false)} className="mr-1 text-red-600" />
                ■ Tidak
              </label>
            </div>
          </div>

          <div>
            <span className="font-semibold block mb-1">Foto Kerusakan:</span>
            <div className="space-x-3">
              <label className="cursor-pointer">
                <input type="radio" checked={fotoKerusakan} onChange={() => setFotoKerusakan(true)} className="mr-1 text-red-600" />
                ■ Ada
              </label>
              <label className="cursor-pointer">
                <input type="radio" checked={!fotoKerusakan} onChange={() => setFotoKerusakan(false)} className="mr-1 text-red-600" />
                ■ Tidak
              </label>
            </div>
          </div>

          <div>
            <span className="font-semibold block mb-1">Video:</span>
            <div className="space-x-3">
              <label className="cursor-pointer">
                <input type="radio" checked={video} onChange={() => setVideo(true)} className="mr-1 text-red-600" />
                ■ Ada
              </label>
              <label className="cursor-pointer">
                <input type="radio" checked={!video} onChange={() => setVideo(false)} className="mr-1 text-red-600" />
                ■ Tidak
              </label>
            </div>
          </div>
        </div>

        <div className="text-xs pt-1">
          <label className="block font-semibold text-slate-700 mb-1">Evidence lain :</label>
          <input
            type="text"
            value={evidenceLain}
            onChange={e => setEvidenceLain(e.target.value)}
            placeholder="Sampel bulu, DNA, tagging koordinat..."
            className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-red-500"
          />
        </div>

        {/* Unggah Bukti Foto Lapangan (Maksimal 5 Foto) */}
        <div className="pt-2">
          <DocumentationUpload
            photos={fotos}
            onPhotosChange={(newPhotos) => {
              setFotos(newPhotos);
              if (newPhotos.length > 0) {
                setFotoSatwaCarcass(true);
              }
            }}
            keterangan={keteranganDokumentasi}
            onKeteranganChange={setKeteranganDokumentasi}
            maxPhotos={5}
            sectionNumber="IX.B"
            title="UNGGAH BUKTI FOTO EVIDENCE STRIKE"
            subtitle="Unggah bukti dokumentasi foto bangkai satwa liar, bekas darah/bulu, lokasi runway, atau komponen pesawat yang terdampak (maksimal 5 foto)."
            placeholderKeterangan="Deskripsi bukti foto investigasi (misal: Foto 1: Bangkai burung Tyto alba di batas runway 07L, Foto 2: Bekas benturan pada radome pesawat)..."
            themeColor="red"
          />
        </div>
      </div>

      {/* X. STATUS LAPORAN */}
      <div className="space-y-4">
        <div className="bg-red-50 px-3 py-1.5 rounded text-sm font-bold text-red-900 border-l-4 border-red-600">
          X. STATUS LAPORAN
        </div>

        <div className="space-y-2 text-xs">
          <div className="flex flex-wrap gap-4">
            {(['Initial Report', 'Preliminary Report', 'Final Report'] as const).map(st => (
              <label key={st} className="flex items-center space-x-1.5 cursor-pointer font-bold text-slate-800">
                <input
                  type="radio"
                  name="statusLaporan"
                  checked={statusLaporan === st}
                  onChange={() => setStatusLaporan(st)}
                  className="w-4 h-4 text-red-600 focus:ring-red-500"
                />
                <span>■ {st}</span>
              </label>
            ))}
          </div>

          <div className="flex items-center space-x-6 pt-2">
            <span className="font-semibold text-slate-700">Tindak Lanjut :</span>
            <label className="flex items-center space-x-1.5 cursor-pointer">
              <input
                type="radio"
                name="tindakLanjut"
                checked={tindakLanjut}
                onChange={() => setTindakLanjut(true)}
                className="w-4 h-4 text-red-600"
              />
              <span>■ Ya</span>
            </label>
            <label className="flex items-center space-x-1.5 cursor-pointer">
              <input
                type="radio"
                name="tindakLanjut"
                checked={!tindakLanjut}
                onChange={() => setTindakLanjut(false)}
                className="w-4 h-4 text-red-600"
              />
              <span>■ Tidak</span>
            </label>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Keterangan :</label>
            <input
              type="text"
              value={keteranganStatus}
              onChange={e => setKeteranganStatus(e.target.value)}
              placeholder="Catatan status investigasi..."
              className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-red-500"
            />
          </div>
        </div>
      </div>

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
                  ? 'Draft Laporan WSR (Strike Report) Berhasil Disimpan!' 
                  : isEditMode 
                  ? 'Perubahan Dokumen WSR Berhasil Diperbarui!' 
                  : 'Laporan WSR (Strike Report) Resmi Berhasil Disimpan & Disinkronkan!'}
              </p>
              <p className="text-xs mt-0.5">
                Nomor: <span className="font-mono font-semibold">{currentReport.reportNumber}</span> • {
                  isLastSavedDraft 
                    ? 'Tersimpan sebagai draft investigasi awal. Anda dapat melanjutkannya kapan saja melalui menu Arsip Laporan.' 
                    : 'Data investigasi tersimpan di database operasional dan dashboard.'
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
                className="flex-1 sm:flex-initial px-3 py-1.5 bg-red-700 hover:bg-red-800 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1 cursor-pointer transition shadow-xs"
              >
                <Share2 className="w-3.5 h-3.5" />
                Flash Report WA
              </button>
            )}
          </div>
        </div>
      )}

      {/* Action Footer */}
      <div className="pt-6 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => exportStrikePDF(currentReport)}
          className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
        >
          <Download className="w-4 h-4 text-rose-600" />
          Cetak PDF Resmi
        </button>

        <div className="flex items-center space-x-2 flex-wrap">
          {/* Tombol Simpan Draft */}
          <button
            type="button"
            onClick={handleSaveDraft}
            className="px-3.5 py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-lg text-xs font-bold flex items-center gap-1.5 transition shadow-xs cursor-pointer"
            title="Simpan sementara sebagai draft investigasi awal untuk dilanjutkan nanti tanpa memicu flash report darurat"
          >
            <Bookmark className="w-4 h-4 text-amber-600" />
            <span>Simpan sebagai Draft</span>
          </button>

          <button
            type="button"
            onClick={() => onOpenBroadcast(currentReport)}
            className="px-4 py-2 bg-red-700 hover:bg-red-600 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition shadow cursor-pointer"
          >
            <Share2 className="w-4 h-4" />
            Broadcast Flash Report WA
          </button>

          <button
            type="submit"
            className={`px-5 py-2 text-white rounded-lg text-xs font-bold flex items-center gap-2 transition shadow-md cursor-pointer ${
              initialData?.isDraft 
                ? 'bg-emerald-600 hover:bg-emerald-500' 
                : isEditMode 
                ? 'bg-amber-600 hover:bg-amber-500' 
                : 'bg-rose-800 hover:bg-rose-700'
            }`}
          >
            <Save className="w-4 h-4" />
            <span>
              {initialData?.isDraft 
                ? 'Terbitkan Laporan Resmi' 
                : isEditMode 
                ? 'Simpan Perubahan Laporan WSR' 
                : 'Simpan Laporan WSR (Strike Report)'}
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
          setRunwayTaxiway(data.runwayTaxiway);
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
