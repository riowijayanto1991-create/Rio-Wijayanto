export type Pleton = 'Pleton Alpha' | 'Pleton Bravo' | 'Pleton Charlie' | 'Pleton Delta';
export type Dinas = 'Dinas Pagi (08:00 - 20:00)' | 'Dinas Malam (20:00 - 08:00)';
export type Cuaca = 'Cerah' | 'Berawan' | 'Hujan Ringan' | 'Hujan Lebat' | 'Berkabut';
export type SatwaKondisi = 'Hidup' | 'Mati' | 'Terluka' | 'Tidak teridentifikasi' | 'Carcass/Sisa' | 'Tidak ditemukan';
export type OccurrenceStatus = 'Selesai' | 'Dalam Monitoring' | 'Perlu Tindak Lanjut';
export type FlightPhase = 'Take-off roll' | 'Initial climb' | 'Approach' | 'Landing roll' | 'Taxi' | 'Lainnya';
export type StrikeDamage = 'Tidak ada' | 'Ada' | 'Belum diketahui';
export type StrikeStatus = 'Initial Report' | 'Preliminary Report' | 'Final Report';
export type SourceInfo = 'ATC' | 'Pilot/Crew' | 'AMC' | 'WHU' | 'Lainnya';

export interface SpeciesObservation {
  id: string;
  spesies: string;
  jumlah: number;
  keterangan?: string;
}

export interface SelectiveLethalItem {
  id: string;
  spesies: string;
  jumlah: number;
}

export interface OfficerDigitalSignature {
  signerName: string;
  signerNipp?: string;
  signerRole: string; // e.g. "Person on Duty (POD) Pelapor", "Petugas Penerima", "Supervisor / Head WHU"
  signedAt: string;   // ISO timestamp
  signatureDataUrl?: string; // Canvas base64 drawing data URL
  verificationHash: string;  // e.g. "AP-WHU-2026-X7K9"
  unitSeal?: boolean;
}

export interface ReportSignatures {
  officer?: OfficerDigitalSignature;       // Petugas pelapor / pelaksana / driver
  receiver?: OfficerDigitalSignature;      // Petugas penerima (khusus serah terima kendaraan)
  supervisor?: OfficerDigitalSignature;    // Verifikator / Dept Head / Supervisor
}

export interface PatrolReport {
  id: string;
  reportNumber: string;
  createdAt: string;
  updatedAt?: string;
  isDraft?: boolean;
  draftSavedAt?: string;
  
  // I. DATA KEGIATAN
  hariTanggal: string;
  pleton: Pleton;
  dinas: Dinas;
  pod: string[]; // Person on Duty
  waktuPatroli: string;
  durasi: string;
  cuaca: Cuaca;
  suhu: string;
  situasiOperasional: string;

  // II. RUTE PATROLI
  rutePatroli: string;
  gridLocation?: string; // e.g. "F8 - RWY 1 Infield", "C5 - RWY 2"
  whmpZoneId?: string;   // e.g. "zone-1"
  whmpZoneName?: string; // e.g. "Zona 1: Runway Strips & RESA"
  whmpZoneIsCritical?: boolean; // Zones 1..3 flagged as critical per WHMP
  coordinates?: {
    latitude: number;
    longitude: number;
    distanceFromArpKm: number;
    isWithinOperationalRadius: boolean;
    maxRadiusAllowedKm: number;
    bearingDegree?: number;
    cardinalDirection?: string;
    verifiedAt?: string;
    confirmedOutsideReason?: string;
  };

  // III. TEMUAN SATWA LIAR
  temuanSatwa: SpeciesObservation[];
  totalPopulasiTeramati: number;

  // IV. MONITORING HABITAT DAN VEGETASI
  kondisiVegetasi: string;
  kondisiDrainase: string;
  potensiAttractant: string;
  habitatManagement: string;
  areaPerhatian: string;

  // V. TINDAKAN PENGENDALIAN
  nonLethal: {
    mobileDispersal: string;
    auditoryDeterrent: string;
    visualDeterrent: string;
    monitoringFlyway: string;
  };
  selectiveLethal: {
    items: SelectiveLethalItem[];
    totalLethal: number;
  };

  // VI. KESIMPULAN
  kesimpulan: string[];

  // VII. MITIGASI
  mitigasi: string[];

  // VIII. DOKUMENTASI & FOTO
  keteranganDokumentasi?: string;
  fotos?: string[]; // Maksimal 5 foto (data URLs / image URLs)

  // IX. PENGESAHAN & TANDA TANGAN DIGITAL
  signatures?: ReportSignatures;
}

export interface OccurrenceReport {
  id: string;
  reportNumber: string;
  createdAt: string;
  updatedAt?: string;
  isDraft?: boolean;
  draftSavedAt?: string;

  // I. DATA OCCURRENCE
  hariTanggal: string;
  waktuKejadian: string;
  pleton: Pleton;
  dinas: Dinas;
  pod: string;
  lokasi: string;
  gridLocation?: string; // e.g. "G12", "C8"
  runwayTaxiwayArea: string;
  whmpZoneId?: string;   // e.g. "zone-1"
  whmpZoneName?: string; // e.g. "Zona 1: Runway Strips & RESA"
  whmpZoneIsCritical?: boolean; // Zones 1..3 flagged as critical per WHMP
  jenisOccurrence: string;
  coordinates?: {
    latitude: number;
    longitude: number;
    distanceFromArpKm?: number;
  };

  // II. KRONOLOGI KEJADIAN
  kronologi: string;

  // III. IDENTIFIKASI SATWA
  jenisSatwa: string;
  jumlahSatwa: number;
  kondisiSatwa: 'Hidup' | 'Mati' | 'Terluka' | 'Tidak teridentifikasi';
  aktivitasPergerakan: string;

  // IV. KONDISI OPERASIONAL
  cuaca: Cuaca;
  suhu: string;
  visibility: string;
  kondisiRunwayTaxiway: string;
  aktivitasPergerakanPesawat: string;

  // V. POTENSI HAZARD
  jenisPotensiHazard: string;
  potensiDampakOperasi: string;

  // VI. TINDAKAN YANG DILAKUKAN
  tindakan: {
    deteksiMonitoring: string;
    mobileDispersal: string;
    auditoryVisualDeterrent: string;
    koordinasi: string;
    tindakanLainnya: string;
  };

  // VII. HASIL PENANGANAN
  hasilPenanganan: string;
  status: OccurrenceStatus;

  // VIII. REKOMENDASI / MITIGASI
  rekomendasiMitigasi: string[];

  // IX. DOKUMENTASI
  fotoVideoAda: boolean;
  keteranganDokumentasi: string;
  fotoUrl?: string;
  fotos?: string[]; // Maksimal 5 foto dokumentasi (data URLs)

  // X. PENGESAHAN & TANDA TANGAN DIGITAL
  signatures?: ReportSignatures;
}

export interface WildlifeStrikeReport {
  id: string;
  reportNumber: string;
  createdAt: string;
  updatedAt?: string;
  isDraft?: boolean;
  draftSavedAt?: string;

  // I. DATA KEJADIAN
  hariTanggal: string;
  waktuKejadian: string;
  pleton: Pleton;
  dinas: Dinas;
  pod: string;
  lokasi: string;
  gridLocation?: string; // e.g. "C8", "B9"
  runwayTaxiway: string;
  whmpZoneId?: string;   // e.g. "zone-1"
  whmpZoneName?: string; // e.g. "Zona 1: Runway Strips & RESA"
  whmpZoneIsCritical?: boolean; // Zones 1..3 flagged as critical per WHMP
  coordinates?: {
    latitude: number;
    longitude: number;
    distanceFromArpKm?: number;
  };
  sumberInformasi: SourceInfo;
  sumberInformasiLainnya?: string;

  // II. DATA PESAWAT
  operatorAirline: string;
  flightNumber: string;
  aircraftType: string;
  registration: string;
  origin: string;
  destination: string;
  posisiPesawat: string;

  // III. DATA WILDLIFE
  jenisWildlife: string;
  jumlahWildlife: number;
  identifikasi: 'Teridentifikasi' | 'Belum teridentifikasi';
  kondisiWildlife: 'Hidup' | 'Mati' | 'Terluka' | 'Carcass/Sisa' | 'Tidak ditemukan';

  // IV. KRONOLOGI WILDLIFE STRIKE
  kronologiStrike: string;
  fasePenerbangan: FlightPhase;
  fasePenerbanganLainnya?: string;
  bagianPesawatTerdampak: string;

  // V. DAMPAK TERHADAP PESAWAT
  indikasiKerusakan: StrikeDamage;
  bagianKerusakan: string;
  dampakPenerbangan: string;
  keteranganDampak: string;

  // VI. TINDAKAN WILDLIFE HAZARD UNIT
  tindakanUnit: {
    penerimaanInformasi: string;
    verifikasiLokasi: string;
    pengumpulanEvidence: string;
    pengamananPembersihan: string;
    dispersalPengendalian: string;
    koordinasi: string;
    dokumentasi: string;
  };

  // VII. HASIL INVESTIGASI AWAL
  investigasiAwal: {
    spesies: string;
    lokasiHotspot: string;
    kondisiHabitat: string;
    potensiAttractant: string;
    polaFlyway: string;
    indikasiPenyebab: string;
  };

  // VIII. MITIGASI DAN TINDAK LANJUT
  mitigasi: string[];
  rekomendasi: string;

  // IX. DOKUMENTASI / EVIDENCE
  evidence: {
    fotoSatwaCarcass: boolean;
    fotoLokasi: boolean;
    fotoKerusakan: boolean;
    video: boolean;
    evidenceLain: string;
  };
  fotoUrl?: string;
  fotos?: string[]; // Maksimal 5 foto dokumentasi
  keteranganDokumentasi?: string;

  // X. STATUS LAPORAN
  statusLaporan: StrikeStatus;
  tindakLanjut: boolean;
  keteranganStatus: string;

  // XI. PENGESAHAN & TANDA TANGAN DIGITAL
  signatures?: ReportSignatures;
}

export interface ManagementRecipient {
  id: string;
  name: string;
  role: string;
  phone: string;
  email: string;
  department: string;
  notifyOnStrike: boolean;
  notifyOnOccurrence: boolean;
  notifyOnPatrol: boolean;
}

export interface NotificationLog {
  id: string;
  timestamp: string;
  reportType: 'PATROL' | 'OCCURRENCE' | 'STRIKE' | 'VEHICLE';
  reportNumber: string;
  title: string;
  recipientName: string;
  recipientRole: string;
  channel: 'WHATSAPP' | 'EMAIL' | 'IN_APP';
  status: 'TERKIRIM' | 'PENDING' | 'DIBACA';
  messageSummary: string;
}

export type FuelLevel = 'Full (1/1)' | '3/4' | '1/2' | '1/4' | 'Kritis / Cadangan (E)';
export type CheckItemStatus = 'Baik / Normal' | 'Kurang / Perhatian' | 'Rusak / Mati / Nihil';
export type VehicleServiceability = 
  | 'SIAP OPERASI (SERVICEABLE)' 
  | 'SIAP DENGAN CATATAN (SERVICEABLE WITH LIMITATION)' 
  | 'TIDAK SIAP OPERASI (UNSERVICEABLE)';

export interface VehicleCheckReport {
  id: string;
  reportNumber: string;
  createdAt: string;
  updatedAt?: string;
  isDraft?: boolean;
  draftSavedAt?: string;

  // I. DATA DINAS & SERAH TERIMA
  hariTanggal: string;
  dinas: 'Dinas Pagi (08:00 - 20:00)' | 'Dinas Malam (20:00 - 08:00)';
  waktuPengecekan: string;
  pleton: Pleton;
  petugasMenyerahkan: string; // Petugas Dinas Sebelumnya
  petugasMenerima: string;    // Petugas Dinas Selanjutnya
  supervisorLead: string;     // Lead / Supervisor WHU Verifikator

  // II. DATA KENDARAAN OPERASIONAL
  nomorLambung: string;       // e.g. WHU-01, WHU-02, WHU-03
  platNomor: string;          // e.g. B 9123 PUA
  merkModel: string;          // e.g. Toyota Hilux 4x4 Double Cabin
  odometerKM: number;         // Angka Odometer saat serah terima
  levelBBM: FuelLevel;

  // III. PENGECEKAN MESIN, MEKANIKAL & KELISTRIKAN
  oliMesinCoolant: CheckItemStatus;
  sistemRemTangan: CheckItemStatus;
  kondisiBanTekanan: CheckItemStatus;
  lampuUtamaJauhDekat: CheckItemStatus;
  lampuRotaryStroboAirside: CheckItemStatus; // Wajib amber airside
  lampuSeinHazardRem: CheckItemStatus;
  wiperAirPembersih: CheckItemStatus;
  klaksonSirineAirside: CheckItemStatus;
  acKabinKelistrikan: CheckItemStatus;
  kebersihanKendaraan: CheckItemStatus;

  // IV. PERLENGKAPAN ALAT HALAU SATWA & EMERGENCY AIRSIDE
  radioAirsideHT: CheckItemStatus;          // Radio Ground Control / Tower
  birdScarerSoundMegaphone: CheckItemStatus;
  laserBirdDisperser: CheckItemStatus;
  pyroFlareGun: CheckItemStatus;
  amunisiFlareButir: number;                // Jumlah fisik amunisi pyrotechnic
  binokularTeropong: CheckItemStatus;
  senterTaktisSearchlight: CheckItemStatus;  // Sangat penting untuk Dinas Malam
  jaringNetGunHandling: CheckItemStatus;
  aparKendaraan: CheckItemStatus;
  kotakP3K: CheckItemStatus;
  toolKitDongkrak: CheckItemStatus;

  // V. KESIMPULAN KELAYAKAN & CATATAN SERAH TERIMA
  statusKelayakan: VehicleServiceability;
  catatanKerusakanKendala: string;
  catatanSerahTerima: string;
  fotoKendaraanUrl?: string;
  fotos?: string[]; // Maksimal 5 foto dokumentasi armada/peralatan
  keteranganDokumentasi?: string;

  // VI. PENGESAHAN & TANDA TANGAN DIGITAL
  signatures?: ReportSignatures;
}

export type MonthlyDocumentCategory = 
  | 'Laporan Bulanan Lengkap (Comprehensive WHMS)'
  | 'Rekapitulasi Wildlife Strike Bulanan (ICAO IBIS)'
  | 'Laporan Evaluasi & Rekomendasi Habitat'
  | 'Laporan Inspeksi & Patroli Rutin Bulanan'
  | 'Laporan Kelaikan Armada & Peralatan WHU'
  | 'Data Tabular & Logbook Operasional (Excel Spreadsheet)'
  | 'Dokumen Pendukung / Lampiran Teknis';

export type DocumentFormatType = 'pdf' | 'word' | 'excel';

export interface ParsedMonthlyRecord {
  bulan: string;            // Standard Indonesian name (e.g. "September", "Januari")
  bulanIndex: number;       // 0 to 11 (0 = Januari, 8 = September)
  tahun: number;            // e.g. 2025, 2026
  periodKey: string;        // "2025-09", "2026-01"
  totalStrike: number;
  strikeWithDamage: number;
  totalOccurrence: number;
  totalSatwa: number;       // Bird population / Satwa Teramati
  totalPatroli?: number;    // Total Airside Wildlife Patrols
  spesiesDominan?: string;
  sourceSheets: string[];
}

export interface BirdSpeciesPopulationRow {
  namaSpesies: string;
  namaLatin?: string;
  countsByPeriod: Record<string, number>; // key: "2025-09" => count
  totalSemuaPeriode: number;
}

export interface BirdPopulationData {
  periods: Array<{ key: string; bulan: string; bulanIndex: number; tahun: number; label: string }>;
  species: BirdSpeciesPopulationRow[];
  totalByPeriod: Record<string, number>;
  grandTotal: number;
}

export interface MonthlyReportDocument {
  id: string;
  title: string;
  periodeBulan: string; // e.g. "Januari", "Februari", ...
  periodeTahun: number; // e.g. 2025, 2026
  kategoriLaporan: MonthlyDocumentCategory;
  fileName: string;
  fileType: DocumentFormatType; // 'pdf' | 'word' | 'excel'
  fileMime: string;
  fileSize: number; // in bytes
  fileData?: string; // base64 data URL
  uploadedAt: string;
  uploadedBy: string;
  pleton?: string;
  catatanRingkasan?: string;
  totalStrikeBulanIni?: number;
  strikeWithDamageBulanIni?: number;
  totalPatroliBulanIni?: number;
  totalOccurrenceBulanIni?: number;
  totalSatwaBulanIni?: number;
  spesiesDominan?: string;
  areaRawanUtama?: string;
  statusVerifikasi: 'Terverifikasi' | 'Menunggu Review' | 'Arsip Resmi';
  sheetNames?: string[]; // for Excel workbooks
  totalRows?: number; // for Excel spreadsheets
  monthlyBreakdown?: ParsedMonthlyRecord[]; // Parsed historical multi-month data (Sep - Agt)
  birdPopulationData?: BirdPopulationData; // Parsed 1.7.2 History Populasi Burung
  tags?: string[];
}

export interface DutyRosterPersonnel {
  nama: string;
  nik: string;
  pleton: Pleton | string;
  pletonCode: 'ALPHA' | 'BRAVO' | 'CHARLIE' | 'DELTA' | string;
  jabatan?: string;
  shiftPattern?: string;
}

export interface DutyRosterDayEntry {
  tanggal: number; // 1 - 31
  hari?: string; // e.g. "Senin", "Selasa"
  dateStr?: string; // e.g. "2026-09-01"
  pagiPleton: Pleton | string;
  pagiPetugas: string; // e.g. "Budi Santoso, Ahmad Fadli"
  malamPleton: Pleton | string;
  malamPetugas: string; // e.g. "Rian Pratama, Dwi Kurniawan"
  cadanganLepas?: string;
  keterangan?: string;
}

export interface DutyRosterDocument {
  id: string;
  title: string;
  periodeBulan: string; // e.g. "September"
  periodeTahun: number; // e.g. 2026
  fileName: string;
  fileType: 'excel' | 'pdf';
  fileMime: string;
  fileSize: number; // in bytes
  fileData?: string; // base64 data URL
  uploadedAt: string;
  uploadedBy: string;
  disahkanOleh?: string; // e.g. "RACHMADITYA (Dept. Head)"
  catatan?: string;
  status: 'Aktif' | 'Arsip';
  statusDokumen?: 'Resmi Berlaku' | 'Revisi / Pengganti' | 'Draft / Usulan';
  pleton?: string;
  keterangan?: string;
  sheetNames?: string[]; // For Excel
  totalRows?: number;
  personnelList?: DutyRosterPersonnel[];
  pletonMembers?: Record<string, DutyRosterPersonnel[]>;
  parsedEntries?: DutyRosterDayEntry[];
}

export interface GeminiTrendPattern {
  id: string;
  patternTitle: string;
  category: 'WAKTU_TEMPORAL' | 'SPASIAL_HOTSPOT' | 'SPESIES_BERISIKO' | 'FAKTOR_LINGKUNGAN' | 'OPERASIONAL';
  description: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  evidenceData: string;
  affectedRunwayOrZone: string;
}

export interface GeminiHotspotAlert {
  locationName: string;
  gridCode: string;
  riskFactor: string;
  dominantSpecies: string;
  recommendedPatrolFrequency: string;
}

export interface GeminiMitigationRecommendation {
  id: string;
  title: string;
  category: 'HABITAT' | 'TAKTIK_PENGUSIRAN' | 'OPERASIONAL_ATC' | 'MONITORING';
  urgency: 'SEGERA' | 'JANGKA_PENDEK' | 'JANGKA_PANJANG';
  actionSteps: string[];
  responsibleUnit: string;
  regulatoryRef: string;
  expectedImpact: string;
}

export interface GeminiTrendAnalysis {
  id: string;
  generatedAt: string;
  modelUsed: string;
  overallRiskLevel: 'RENDAH' | 'SEDANG' | 'TINGGI' | 'KRITIS';
  riskScore: number;
  executiveSummary: string;
  dataAnalyzed: {
    totalPatrols: number;
    totalOccurrences: number;
    totalStrikes: number;
    totalWildlifeObserved: number;
    dateRange: string;
  };
  identifiedPatterns: GeminiTrendPattern[];
  hotspotAlerts: GeminiHotspotAlert[];
  mitigationRecommendations: GeminiMitigationRecommendation[];
  notamAdvisory: {
    recommended: boolean;
    proposedText: string;
    validitySuggestion: string;
    targetRunway: string;
  };
  projectedTrendNext30Days: string;
  isHeuristicFallback?: boolean;
}

export interface ManualMonthlyWSREntry {
  monthIndex: number; // 0..11
  monthName: string;
  year: number;
  totalStrike: number;
  strikeWithDamage: number;
  strikeNoDamage: number;
  totalOccurrence?: number;
  totalPatroli?: number;
  totalSatwa?: number;
  notes?: string;
  updatedAt?: string;
  updatedBy?: string;
}

export interface ManualMonthlyWSRDoc {
  id: string;
  year: number;
  entries: Record<number, ManualMonthlyWSREntry>;
  updatedAt: string;
  updatedBy?: string;
}


