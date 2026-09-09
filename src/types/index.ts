export type Pleton = 'Pleton 1' | 'Pleton 2' | 'Pleton 3' | 'Pleton 4';
export type Dinas = 'Dinas Pagi (06:00 - 14:00)' | 'Dinas Siang (14:00 - 22:00)' | 'Dinas Malam (22:00 - 06:00)';
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

export interface PatrolReport {
  id: string;
  reportNumber: string;
  createdAt: string;
  
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
}

export interface OccurrenceReport {
  id: string;
  reportNumber: string;
  createdAt: string;

  // I. DATA OCCURRENCE
  hariTanggal: string;
  waktuKejadian: string;
  pleton: Pleton;
  dinas: Dinas;
  pod: string;
  lokasi: string;
  gridLocation?: string; // e.g. "G12", "C8"
  runwayTaxiwayArea: string;
  jenisOccurrence: string;

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
}

export interface WildlifeStrikeReport {
  id: string;
  reportNumber: string;
  createdAt: string;

  // I. DATA KEJADIAN
  hariTanggal: string;
  waktuKejadian: string;
  pleton: Pleton;
  dinas: Dinas;
  pod: string;
  lokasi: string;
  gridLocation?: string; // e.g. "C8", "B9"
  runwayTaxiway: string;
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

  // X. STATUS LAPORAN
  statusLaporan: StrikeStatus;
  tindakLanjut: boolean;
  keteranganStatus: string;
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
  reportType: 'PATROL' | 'OCCURRENCE' | 'STRIKE';
  reportNumber: string;
  title: string;
  recipientName: string;
  recipientRole: string;
  channel: 'WHATSAPP' | 'EMAIL' | 'IN_APP';
  status: 'TERKIRIM' | 'PENDING' | 'DIBACA';
  messageSummary: string;
}
