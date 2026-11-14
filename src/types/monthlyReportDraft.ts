/**
 * Types & Schema definition for Automated Monthly Report Document Draft (JSON)
 * Strictly conforms to PT Angkasa Pura Indonesia - Bandar Udara Internasional Soekarno-Hatta (CGK)
 * Standard Monthly Wildlife Hazard Report (87-Page Document Format)
 * 
 * Ready for direct injection into Word (.docx via docxtemplater) and PDF generation engines.
 */

export interface AirportCoordinates {
  latitude: string;
  longitude: string;
}

export interface RunwayDimensionItem {
  runway: string;
  dimensi: string;
  pcr: string;
  surface: string;
}

export interface RunwayTypeItem {
  runway: string;
  tipe: string;
}

export interface AirportOfficialData {
  namaBandara: string;
  lokasi: string;
  statusPenggunaan: string;
  koordinatARP: AirportCoordinates;
  penyelenggara: string;
  dimensiRunway: RunwayDimensionItem[];
  kodeReferensiBandarUdara: string;
  tipeRunway: RunwayTypeItem[];
  tipePesawatUdaraTerkritis: string;
  kategoriPKPPK: string;
  jamOperasi: string;
  nomorSertifikatBandarUdara: string;
  pengecualianExemption: string;
}

export interface OfficialPersonnelItem {
  no: number;
  namaPersonel: string;
  nip: string;
  grade: number;
  jabatan: string;
  keterangan: 'ORGANIK' | 'PERBANTUAN';
}

export interface PersonnelConditionSummary {
  totalOrganik: number;
  totalPerbantuan: number;
  totalKekuatan: number;
  rasioPerbantuanPersen: number;
  poinA: string;
  poinB: string;
  poinC: string;
}

export interface OfficialPersonnelSection {
  daftarPersonel: OfficialPersonnelItem[];
  rangkumanKondisiSDM: PersonnelConditionSummary;
}

export interface OfficialInventoryItem {
  no: number;
  namaBarang: string;
  jumlah: number;
  satuan: string;
  merkJenis: string;
  kondisiLaikOperasi: boolean;
  keteranganKondisi: 'LAIK OPERASI' | 'TIDAK LAIK OPERASI';
}

export interface InventorySection {
  daftarPeralatan: OfficialInventoryItem[];
  kesimpulanUmum: string;
}

export interface MonthlySpeciesPopulationItem {
  jenisSatwa: string;
  total: number;
  kategoriRisiko?: 'HIGH RISK' | 'MEDIUM RISK' | 'LOW RISK';
}

export interface HistoricalPopulationRow {
  jenisSatwa: string;
  counts: Record<string, number | 'NIL'>; // e.g. "SEP_2025": 4, ..., "AUG_2026": 13
  puncakBulan?: string;
  puncakJumlah?: number;
  trenStatus?: 'Meningkat' | 'Menurun' | 'Stabil' | 'Nihil' | 'Fluktuatif';
}

export interface PopulationSection {
  populasiBulanan: MonthlySpeciesPopulationItem[];
  totalPopulasiBulanan: number;
  historyPopulasiTahunan: HistoricalPopulationRow[];
  perbandinganTigaBulanTerakhir: {
    periode: string;
    narasi: string;
  };
  tigaLangkahStrategisSMS: {
    identifikasiHazard: {
      judul: string;
      deskripsi: string;
      poin: string[];
    };
    penilaianRisiko: {
      judul: string;
      deskripsi: string;
      poin: string[];
    };
    rencanaPengelolaan: {
      judul: string;
      deskripsi: string;
      matriksKegiatan: Array<{
        no: number;
        kegiatan: string;
        tujuanDanDeskripsi: string;
      }>;
    };
  };
}

export interface ZoneMappingItem {
  zona: number;
  label: string;
  deskripsiArea: string;
  spesiesTeramati: string[];
}

export interface DailyInspectionFinding {
  jenisSatwa: string;
  jumlah: number;
  satuan?: string;
}

export interface DailyInspectionSession {
  namaSesi: string; // e.g. "Inspeksi Awal Pagi", "Inspeksi Akhir Pagi", "Inspeksi Awal Malam", "Inspeksi Akhir Malam"
  waktuWib: string; // e.g. "10.00 – 12.03 WIB"
  zona: string[];   // e.g. ["Zona 1", "Zona 2", "Zona 3", "Zona 4", "Zona 6"]
  temuanSatwa: DailyInspectionFinding[];
  inherentRisk: string; // "5D"
  tindakanPengendalian: {
    nonLethal: string[];
    lethal: DailyInspectionFinding[];
  };
  criteria: 'Safe' | 'Unsafe';
  residualRisk: string; // "3C"
  status: 'Closed' | 'Open';
}

export interface DailyLogDayEntry {
  tanggalFormatted: string; // e.g. "Saturday, 01 August 2026"
  tanggalIso: string;       // e.g. "2026-08-01"
  hari: string;             // e.g. "Saturday"
  tanggalNumber: number;    // 1 - 31
  sesiInspeksi: DailyInspectionSession[];
}

export interface DailyLogAnalysis {
  ringkasanUmum: string;
  polaPeriodePagi: string;
  polaPeriodeSiang: string;
  polaPeriodeSore: string;
  polaPeriodeMalam: string;
  perilakuKhususCabakKota: string;
  efektivitasInspeksi: string;
}

export interface DailyLogSection {
  daftarLogHarian: DailyLogDayEntry[];
  analisaLaporanHarian: DailyLogAnalysis;
}

export interface LethalActivityItem {
  tanggalFormatted: string;
  kegiatanLokasi: string;
  jenisSatwaRincian: DailyInspectionFinding[];
  inherentRisk: string;
  tindakLanjut: string;
  criteria: string;
  residualRisk: string;
  status: string;
}

export interface LethalSpeciesSummaryItem {
  no: number;
  jenisSatwaLiar: string;
  jumlahIndividuDilumpuhkan: number;
  lokasiTindakan: string;
  persentaseDariTotal: number;
}

export interface MonthlyLethalSummarySection {
  rekapitulasiSpesies: LethalSpeciesSummaryItem[];
  totalPelumpuhanHewan: number;
  narasiEvaluasiLethal: string;
}

export interface StrikeIncidentItem {
  nomorLaporan: string; // e.g. "WLS-2026-025"
  tanggalFormatted: string;
  strikeTime: string;
  strikePhase: string;
  maskapaiDanRegistrasi: string;
  aircraftType: string;
  rutePesawat: string;
  runwayInUse: string;
  lokasiTerkonfirmasi: string;
  waktuTerkonfirmasi: string;
  jenisSatwa: string;
  kerusakanPesawat: 'Yes' | 'No' | 'Nil';
  deskripsiKerusakan: string;
  keterangan: string;
}

export interface AnnualStrikeRow {
  periodeBulan: string;
  birdstrike: number | 'NIL';
  othersWildlifeStrike: number | 'NIL';
}

export interface StrikeLocationRow {
  periodeBulan: string;
  onAirport: number | 'NIL';
  offAirport: number | 'NIL';
}

export interface WildlifeStrikeSection {
  daftarStrike: StrikeIncidentItem[];
  historisWildlifeStrikeTahunan: AnnualStrikeRow[];
  rekapitulasiLokasiStrike: StrikeLocationRow[];
  analisisTrenMoM: {
    persentasePerubahan: string;
    narasi: string;
  };
}

export interface OccurrenceIncidentItem {
  nomorLaporan: string; // e.g. "WLSC-2026-081"
  tanggalFormatted: string;
  waktu: string;
  sumberInformasi: string;
  jenisHazard: string;
  jumlah: string;
  lokasiHazard: string;
  tindakan: string;
  hasilTindakan: string;
  personel: string[];
}

export interface AnnualOccurrenceRow {
  periodeBulan: string;
  jumlahLaporan: number | 'NIL';
}

export interface WildlifeOccurrenceSection {
  daftarOccurrence: OccurrenceIncidentItem[];
  historisOccurrenceTahunan: AnnualOccurrenceRow[];
  analisisTrenMoM: {
    narasi: string;
  };
}

export interface HabitatMonitoringItem {
  nomorKegiatan: string; // e.g. "WLPH-2026048"
  tanggalFormatted: string;
  lokasi: string;
  luasJumlah: string; // e.g. "1 Ha", "2,5 Ha.", "4 Ha"
  luasHektarNumeric: number;
  dokumentasiDeskripsi: string;
  personel: string[];
}

export interface HabitatMonitoringSection {
  daftarKegiatan: HabitatMonitoringItem[];
  totalLuasHektar: number;
  totalKegiatan: number;
  narasiPengelolaanHabitat: string;
}

export interface OperationalMitigationEvaluation {
  narasiPembuka: string;
  langkahStrategis: string[];
  evaluasiMoM: string;
}

export interface TrendConclusionSection {
  poinA_dinamikaPopulasiDanMigrasi: string;
  poinB_dampakKondisiCuaca: string;
  poinC_efektivitasMitigasiOperasional: OperationalMitigationEvaluation;
  poinD_optimalisasiSdmDanInventaris: string;
  poinE_evaluasiStrategis: string;
}

export interface OfficialSignatory {
  jabatan: string;
  nama: string;
  nip?: string;
}

export interface DocumentSignOffSheet {
  tempatPenerbitan: string; // "Tangerang"
  tanggalPenerbitan: string; // "03 September 2026"
  pejabatDivisionHead: OfficialSignatory;
  pejabatDepartmentHead: OfficialSignatory;
}

export interface DocumentInfoCover {
  judul: string;
  subJudul: string;
  periodeBulan: string;
  periodeTahun: number;
  nomorDokumen: string;
  instansi: string;
  kantorCabang: string;
  unit: string;
  tanggalPenerbitan: string;
  dibuatOleh: string;
  formatVersion: string;
  totalHalamanStandar: number;
}

/**
 * Root Schema of the Automated Monthly Report Document Draft JSON
 */
export interface MonthlyReportDraftJSON {
  documentInfo: DocumentInfoCover;
  dataBandarUdara: AirportOfficialData;
  dataPersonel: OfficialPersonnelSection;
  dataInventarisPeralatan: InventorySection;
  populasiSatwaLiar: PopulationSection;
  zonaMappingWildlife: ZoneMappingItem[];
  logWildlifeHazardDaily: DailyLogSection;
  lethalControlActivity: LethalActivityItem[];
  dataLethalBulanBerjalan: MonthlyLethalSummarySection;
  wildlifeStrikePeriodeBerjalan: WildlifeStrikeSection;
  laporanKejadianBahayaSatwaLiar: WildlifeOccurrenceSection;
  monitoringPengelolaanHabitat: HabitatMonitoringSection;
  kesimpulanTrendBulanBerjalan: TrendConclusionSection;
  lembarPengesahan: DocumentSignOffSheet;
  templateIntegrationGuide: {
    deskripsi: string;
    wordDocxPlaceholders: Record<string, string>;
    loopTagsGuide: Record<string, string>;
  };
}
