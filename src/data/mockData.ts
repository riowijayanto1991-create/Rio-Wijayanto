import { 
  PatrolReport, 
  OccurrenceReport, 
  WildlifeStrikeReport, 
  ManagementRecipient, 
  NotificationLog,
  VehicleCheckReport,
  MonthlyReportDocument 
} from '../types';

// Baseline collections initialized empty as requested (sample reports removed)
export const INITIAL_PATROL_REPORTS: PatrolReport[] = [];

export const INITIAL_OCCURRENCE_REPORTS: OccurrenceReport[] = [];

export const INITIAL_STRIKE_REPORTS: WildlifeStrikeReport[] = [];

export const INITIAL_VEHICLE_REPORTS: VehicleCheckReport[] = [];

export const INITIAL_RECIPIENTS: ManagementRecipient[] = [
  {
    id: 'rec-dept-head',
    name: 'RACHMADITYA',
    role: 'Wildlife Hazard Department Head',
    phone: '+628119887766',
    email: 'rachmaditya@angkasapura.id',
    department: 'Wildlife Hazard Management Unit',
    notifyOnStrike: true,
    notifyOnOccurrence: true,
    notifyOnPatrol: true
  },
  {
    id: 'rec-1',
    name: 'Executive General Manager Bandara',
    role: 'Executive General Manager Bandara',
    phone: '+6281234567890',
    email: 'egm.cgk@angkasapura2.co.id',
    department: 'Executive Management Branch Office Bandara',
    notifyOnStrike: true,
    notifyOnOccurrence: true,
    notifyOnPatrol: false
  },
  {
    id: 'rec-2',
    name: 'Senior Manager Airport Safety, Security & Quality',
    role: 'Senior Manager Airport Safety, Security & Quality',
    phone: '+6281298765432',
    email: 'safety.cgk@angkasapura2.co.id',
    department: 'Safety, Security & Quality Directorate',
    notifyOnStrike: true,
    notifyOnOccurrence: true,
    notifyOnPatrol: true
  },
  {
    id: 'rec-3',
    name: 'Manager Airport Operation Center (AOCC / OCC)',
    role: 'Manager Airport Operation Center (AOCC / OCC)',
    phone: '+6281311223344',
    email: 'aocc.cgk@angkasapura2.co.id',
    department: 'Airport Operation Command Center',
    notifyOnStrike: true,
    notifyOnOccurrence: true,
    notifyOnPatrol: true
  },
  {
    id: 'rec-4',
    name: 'ARFF Division & Runway Safety Section Head',
    role: 'ARFF Division & Runway Safety Section Head',
    phone: '+6285211223344',
    email: 'amc.dept@angkasapura2.co.id',
    department: 'ARFF Division',
    notifyOnStrike: true,
    notifyOnOccurrence: true,
    notifyOnPatrol: true
  },
  {
    id: 'rec-5',
    name: 'Duty Air Traffic Controller (ATC / AirNav Indonesia)',
    role: 'Duty Air Traffic Controller (ATC / AirNav Indonesia)',
    phone: '+628177654321',
    email: 'tower.duty.jatsc@airnavindonesia.co.id',
    department: 'AirNav Indonesia Branch JATSC',
    notifyOnStrike: true,
    notifyOnOccurrence: true,
    notifyOnPatrol: false
  },
  {
    id: 'rec-6',
    name: 'Wildlife Hazard Supervisor & Officer',
    role: 'Wildlife Hazard Supervisor & Officer',
    phone: '+6281809988776',
    email: 'whu.supervisor@angkasapura2.co.id',
    department: 'Wildlife Hazard Operational Field Team',
    notifyOnStrike: true,
    notifyOnOccurrence: true,
    notifyOnPatrol: true
  }
];

export const INITIAL_NOTIFICATIONS: NotificationLog[] = [];

export const INITIAL_MONTHLY_DOCUMENTS: MonthlyReportDocument[] = [
  {
    id: 'monthly-2026-02-001',
    title: 'Laporan Bulanan Terpadu WHMS - Februari 2026',
    periodeBulan: 'Februari',
    periodeTahun: 2026,
    kategoriLaporan: 'Laporan Bulanan Lengkap (Comprehensive WHMS)',
    fileName: 'Laporan_Bulanan_WHMS_Februari_2026.pdf',
    fileType: 'pdf',
    fileMime: 'application/pdf',
    fileSize: 4120000,
    uploadedAt: '2026-03-02T09:00:00.000Z',
    uploadedBy: 'RACHMADITYA (Dept Head)',
    pleton: 'Staf Evaluasi & Data WHU',
    catatanRingkasan: 'Rekapitulasi operasional Februari 2026. Penurunan populasi kuntul pasca pemotongan rumput berkala di Strip Runway 07L.',
    totalStrikeBulanIni: 3,
    strikeWithDamageBulanIni: 0,
    totalPatroliBulanIni: 84,
    totalOccurrenceBulanIni: 8,
    totalSatwaBulanIni: 1420,
    spesiesDominan: 'Burung Kuntul Kerbau & Burung Layang-layang',
    areaRawanUtama: 'Runway 07L/25R & Taxiway Foxtrot',
    statusVerifikasi: 'Arsip Resmi'
  },
  {
    id: 'monthly-2026-01-002',
    title: 'Laporan Bulanan Terpadu WHMS - Januari 2026',
    periodeBulan: 'Januari',
    periodeTahun: 2026,
    kategoriLaporan: 'Laporan Bulanan Lengkap (Comprehensive WHMS)',
    fileName: 'Laporan_Bulanan_WHMS_Januari_2026.docx',
    fileType: 'word',
    fileMime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    fileSize: 2280000,
    uploadedAt: '2026-02-03T11:30:00.000Z',
    uploadedBy: 'Petugas WHU Pleton A',
    pleton: 'Pleton Alpha',
    catatanRingkasan: 'Monitoring intensif musim migrasi burung air (EAAF). Pengoperasian laser deterrent dan flare pyrotechnics harian.',
    totalStrikeBulanIni: 2,
    strikeWithDamageBulanIni: 1,
    totalPatroliBulanIni: 93,
    totalOccurrenceBulanIni: 12,
    totalSatwaBulanIni: 1850,
    spesiesDominan: 'Burung Air Migran & Blekok Sawah',
    areaRawanUtama: 'Holding Pond & Approach 25R',
    statusVerifikasi: 'Arsip Resmi'
  },
  {
    id: 'monthly-2025-12-001',
    title: 'Laporan Konsolidasi Akhir Tahun WHMS - Desember 2025',
    periodeBulan: 'Desember',
    periodeTahun: 2025,
    kategoriLaporan: 'Laporan Bulanan Lengkap (Comprehensive WHMS)',
    fileName: 'WHMS_Laporan_Bulanan_Desember_2025_Final.pdf',
    fileType: 'pdf',
    fileMime: 'application/pdf',
    fileSize: 3450000,
    uploadedAt: '2026-01-05T08:30:00.000Z',
    uploadedBy: 'RACHMADITYA (Dept Head)',
    pleton: 'Staf Evaluasi & Data WHU',
    catatanRingkasan: 'Laporan konsolidasi akhir tahun 2025. Evaluasi program mitigasi rumput infield Runway 07L/25R dan rekapitulasi dispersi satwa nokturnal.',
    totalStrikeBulanIni: 2,
    strikeWithDamageBulanIni: 0,
    totalPatroliBulanIni: 93,
    totalOccurrenceBulanIni: 9,
    totalSatwaBulanIni: 1680,
    spesiesDominan: 'Burung Kuntul & Anjing Liar Perimeter',
    areaRawanUtama: 'Perimeter Selatan & Runway 07R',
    statusVerifikasi: 'Arsip Resmi'
  },
  {
    id: 'monthly-2025-11-002',
    title: 'Rekapitulasi ICAO IBIS Wildlife Strike & Evaluasi - November 2025',
    periodeBulan: 'November',
    periodeTahun: 2025,
    kategoriLaporan: 'Rekapitulasi Wildlife Strike Bulanan (ICAO IBIS)',
    fileName: 'Rekap_Wildlife_Strike_ICAO_IBIS_Nov2025.docx',
    fileType: 'word',
    fileMime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    fileSize: 1820000,
    uploadedAt: '2025-12-03T10:15:00.000Z',
    uploadedBy: 'Petugas WHU',
    pleton: 'Pleton Alpha',
    catatanRingkasan: 'Analisis insiden strike burung wallet pada fase landing approach Runway 25R. Tidak ada kerusakan struktur pesawat.',
    totalStrikeBulanIni: 1,
    strikeWithDamageBulanIni: 0,
    totalPatroliBulanIni: 90,
    totalOccurrenceBulanIni: 7,
    totalSatwaBulanIni: 1250,
    spesiesDominan: 'Burung Walet Sapi & Pipit Bondol',
    areaRawanUtama: 'Threshold Runway 25R',
    statusVerifikasi: 'Arsip Resmi'
  },
  {
    id: 'monthly-2025-10-003',
    title: 'Laporan Evaluasi Habitat & Manajemen Drainase Airside - Oktober 2025',
    periodeBulan: 'Oktober',
    periodeTahun: 2025,
    kategoriLaporan: 'Laporan Evaluasi & Rekomendasi Habitat',
    fileName: 'Evaluasi_Habitat_Drainase_Airside_Okt_2025.pdf',
    fileType: 'pdf',
    fileMime: 'application/pdf',
    fileSize: 2680000,
    uploadedAt: '2025-11-02T14:20:00.000Z',
    uploadedBy: 'Petugas WHU',
    pleton: 'Pleton Bravo',
    catatanRingkasan: 'Hasil inspeksi bersama tim civil engineering mengenai pembersihan endapan sedimen parit drainase terbuka area Taxiway Echo.',
    totalStrikeBulanIni: 1,
    strikeWithDamageBulanIni: 0,
    totalPatroliBulanIni: 88,
    totalOccurrenceBulanIni: 5,
    totalSatwaBulanIni: 950,
    spesiesDominan: 'Burung Air & Biawak Saluran Air',
    areaRawanUtama: 'Saluran Drainase Terbuka Taxiway Echo',
    statusVerifikasi: 'Terverifikasi'
  }
];

// Export aliases
export const initialPatrolReports = INITIAL_PATROL_REPORTS;
export const initialOccurrenceReports = INITIAL_OCCURRENCE_REPORTS;
export const initialStrikeReports = INITIAL_STRIKE_REPORTS;
export const initialVehicleReports = INITIAL_VEHICLE_REPORTS;
export const initialManagementRecipients = INITIAL_RECIPIENTS;
export const initialNotificationLogs = INITIAL_NOTIFICATIONS;
export const initialMonthlyDocuments = INITIAL_MONTHLY_DOCUMENTS;
