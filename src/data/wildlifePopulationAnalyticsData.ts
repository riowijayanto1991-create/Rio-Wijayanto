export interface MonthlyWildlifeMetric {
  year: number;
  monthIndex: number; // 0 = Jan, 11 = Des
  monthName: string;
  monthShort: string;
  periodKey: string; // "2025-01", "2026-09"
  label: string; // "Jan 2025", "Sep 2026"
  
  // Strike Metrics
  strikes: number;
  strikesWithDamage: number;
  strikesNoDamage: number;
  
  // Occurrence Metrics
  occurrences: number;
  
  // Bird Population Metrics
  totalBirdPopulation: number;
  patrolCount: number;
  
  // Aviation Operational Metrics
  aircraftMovements: number; // Jumlah pergerakan pesawat (take-off & landing)
  strikeRatePer10kMovements: number; // (strikes / aircraftMovements) * 10,000
  
  // Dominant species & Ecological Season
  dominantSpecies: string;
  season: 'migrasi' | 'pancaroba' | 'kemarau';
  seasonLabel: string;
  weatherRisk: string;
  recommendedMitigation: string;
  
  // Source info
  isRealData?: boolean;
}

export interface BirdSpeciesStats {
  id: string;
  namaIndonesia: string;
  namaLatin: string;
  kategoriRisiko: 'KRITIS' | 'TINGGI' | 'SEDANG' | 'RENDAH';
  bobotRataRataGram: number;
  perilakuFlocking: 'Soliter' | 'Kelompok Kecil (2-10)' | 'Kawanan Sedang (10-50)' | 'Kawanan Masif (>50)' | 'Soliter / Kelompok Kecil';
  habitatUtama: string;
  
  // Population by year
  populasi2025: number;
  populasi2026: number;
  populasi2027: number;
  
  // Strikes associated with this species
  strikes2025: number;
  strikes2026: number;
  
  deskripsiMitigasi: string;
}

export const MONTH_NAMES_INFO = [
  { short: 'Jan', full: 'Januari', season: 'migrasi' as const, seasonLabel: 'Musim Migrasi Burung Air (EAAF) & Curah Hujan Tinggi', weather: 'Hujan Monsun Barat' },
  { short: 'Feb', full: 'Februari', season: 'migrasi' as const, seasonLabel: 'Puncak Musim Migrasi Burung Air Lintas Benua', weather: 'Curah Hujan Tinggi & Genangan Airside' },
  { short: 'Mar', full: 'Maret', season: 'pancaroba' as const, seasonLabel: 'Pancaroba Awal (Transisi Hujan-Kemarau)', weather: 'Pancaroba & Angin Fluktuatif' },
  { short: 'Apr', full: 'April', season: 'pancaroba' as const, seasonLabel: 'Pancaroba (Pergerakan Serangga & Pipit)', weather: 'Lembab & Terik Siang Hari' },
  { short: 'Mei', full: 'Mei', season: 'pancaroba' as const, seasonLabel: 'Pancaroba Akhir Menuju Kemarau', weather: 'Cerah Berawan & Terik' },
  { short: 'Jun', full: 'Juni', season: 'kemarau' as const, seasonLabel: 'Musim Kemarau (Konsentrasi Satwa di Kolam)', weather: 'Kemarau & Suhu Tinggi' },
  { short: 'Jul', full: 'Juli', season: 'kemarau' as const, seasonLabel: 'Musim Kemarau (Thermal Soaring Burung Pemangsa)', weather: 'Kering & Angin Kencang' },
  { short: 'Ags', full: 'Agustus', season: 'kemarau' as const, seasonLabel: 'Puncak Musim Kemarau', weather: 'Kering & Debu Runway' },
  { short: 'Sep', full: 'September', season: 'pancaroba' as const, seasonLabel: 'Pancaroba Awal Menuju Hujan', weather: 'Pancaroba & Hujan Awal' },
  { short: 'Okt', full: 'Oktober', season: 'pancaroba' as const, seasonLabel: 'Pancaroba & Mulai Masuk Migrasi Burung', weather: 'Frekuensi Hujan Meningkat' },
  { short: 'Nov', full: 'November', season: 'migrasi' as const, seasonLabel: 'Awal Musim Migrasi Penuh (EAAF)', weather: 'Curah Hujan Lebat' },
  { short: 'Des', full: 'Desember', season: 'migrasi' as const, seasonLabel: 'Puncak Musim Migrasi & Monsun Hujan Akhir Tahun', weather: 'Curah Hujan Monsun Ekstrem' }
];

// Baseline data for 2025 (Full Year: Jan - Des 2025)
export const BASELINE_2025_DATA = [
  { monthIdx: 0, strikes: 6, damage: 1, occurrences: 14, birds: 1850, movements: 28500, dominant: 'Kuntul Kerbau' },
  { monthIdx: 1, strikes: 7, damage: 1, occurrences: 16, birds: 2100, movements: 27200, dominant: 'Blekok Sawah' },
  { monthIdx: 2, strikes: 5, damage: 0, occurrences: 11, birds: 1620, movements: 29100, dominant: 'Layang-layang' },
  { monthIdx: 3, strikes: 4, damage: 0, occurrences: 9,  birds: 1350, movements: 30200, dominant: 'Walet Sapi' },
  { monthIdx: 4, strikes: 3, damage: 0, occurrences: 8,  birds: 1180, movements: 31000, dominant: 'Pipit Bondol' },
  { monthIdx: 5, strikes: 2, damage: 0, occurrences: 6,  birds: 950,  movements: 31500, dominant: 'Dara Laut' },
  { monthIdx: 6, strikes: 2, damage: 0, occurrences: 7,  birds: 1020, movements: 32400, dominant: 'Elang Bondol' },
  { monthIdx: 7, strikes: 3, damage: 0, occurrences: 8,  birds: 1150, movements: 32100, dominant: 'Tekukur' },
  { monthIdx: 8, strikes: 4, damage: 0, occurrences: 10, birds: 1420, movements: 30800, dominant: 'Layang-layang' },
  { monthIdx: 9, strikes: 5, damage: 1, occurrences: 13, birds: 1750, movements: 31200, dominant: 'Trinil Pantai' },
  { monthIdx: 10, strikes: 7, damage: 1, occurrences: 15, birds: 2200, movements: 30500, dominant: 'Kuntul Kerbau' },
  { monthIdx: 11, strikes: 8, damage: 1, occurrences: 17, birds: 2450, movements: 32800, dominant: 'Blekok Sawah' }
];

// Baseline data for 2026 (Full Year: Jan - Des 2026)
// Bulan Jan-Agt 2026 terisi data resmi realisasi AP2 (26 strike, 86 occurrence, 3.978 satwa teramati)
export const BASELINE_2026_DATA = [
  { monthIdx: 0, strikes: 0, damage: 0, occurrences: 9,  birds: 385, movements: 31200, dominant: 'Blekok Sawah' },
  { monthIdx: 1, strikes: 4, damage: 0, occurrences: 15, birds: 311, movements: 30100, dominant: 'Kuntul' },
  { monthIdx: 2, strikes: 3, damage: 0, occurrences: 11, birds: 317, movements: 32400, dominant: 'Kuntul' },
  { monthIdx: 3, strikes: 3, damage: 0, occurrences: 14, birds: 583, movements: 33500, dominant: 'Blekok Sawah' },
  { monthIdx: 4, strikes: 1, damage: 0, occurrences: 17, birds: 625, movements: 34200, dominant: 'Blekok Sawah' },
  { monthIdx: 5, strikes: 7, damage: 0, occurrences: 9,  birds: 632, movements: 34800, dominant: 'Blekok Sawah' },
  { monthIdx: 6, strikes: 6, damage: 0, occurrences: 5,  birds: 507, movements: 35600, dominant: 'Blekok Sawah' },
  { monthIdx: 7, strikes: 2, damage: 0, occurrences: 6,  birds: 618, movements: 35100, dominant: 'Kuntul' },
  { monthIdx: 8, strikes: 1, damage: 0, occurrences: 5,  birds: 450, movements: 33900, dominant: 'Blekok Sawah' },
  { monthIdx: 9, strikes: 2, damage: 0, occurrences: 6,  birds: 520, movements: 34500, dominant: 'Kuntul' },
  { monthIdx: 10, strikes: 2, damage: 0, occurrences: 7, birds: 610, movements: 34200, dominant: 'Kuntul' },
  { monthIdx: 11, strikes: 2, damage: 0, occurrences: 8, birds: 680, movements: 36200, dominant: 'Blekok Sawah' }
];

// Baseline data for 2027 (Proyeksi Target ICAO Safety Performance Indicator)
export const BASELINE_2027_DATA = [
  { monthIdx: 0, strikes: 3, damage: 0, occurrences: 8,  birds: 1420, movements: 33500, dominant: 'Kuntul Kerbau' },
  { monthIdx: 1, strikes: 3, damage: 0, occurrences: 7,  birds: 1550, movements: 32100, dominant: 'Blekok Sawah' },
  { monthIdx: 2, strikes: 2, damage: 0, occurrences: 6,  birds: 1250, movements: 34800, dominant: 'Layang-layang' },
  { monthIdx: 3, strikes: 1, damage: 0, occurrences: 5,  birds: 1020, movements: 36000, dominant: 'Walet Sapi' },
  { monthIdx: 4, strikes: 1, damage: 0, occurrences: 4,  birds: 920,  movements: 36800, dominant: 'Pipit Bondol' },
  { monthIdx: 5, strikes: 1, damage: 0, occurrences: 4,  birds: 780,  movements: 37200, dominant: 'Dara Laut' },
  { monthIdx: 6, strikes: 1, damage: 0, occurrences: 4,  birds: 810,  movements: 38100, dominant: 'Elang Bondol' },
  { monthIdx: 7, strikes: 1, damage: 0, occurrences: 5,  birds: 880,  movements: 37600, dominant: 'Tekukur' },
  { monthIdx: 8, strikes: 2, damage: 0, occurrences: 5,  birds: 1050, movements: 36200, dominant: 'Layang-layang' },
  { monthIdx: 9, strikes: 3, damage: 0, occurrences: 7,  birds: 1310, movements: 37000, dominant: 'Trinil Pantai' },
  { monthIdx: 10, strikes: 4, damage: 0, occurrences: 8,  birds: 1620, movements: 36500, dominant: 'Kuntul Kerbau' },
  { monthIdx: 11, strikes: 4, damage: 1, occurrences: 9,  birds: 1750, movements: 38800, dominant: 'Blekok Sawah' }
];

// Master list of Bird Species for Population Analysis & Bar Charts
export const BIRD_SPECIES_MASTER: BirdSpeciesStats[] = [
  {
    id: 'sp-blekok',
    namaIndonesia: 'Blekok Sawah',
    namaLatin: 'Ardeola speciosa',
    kategoriRisiko: 'TINGGI',
    bobotRataRataGram: 320,
    perilakuFlocking: 'Kawanan Sedang (10-50)',
    habitatUtama: 'Drainase Terbuka, Parit Airside & Area Kolam Retensi',
    populasi2025: 1100,
    populasi2026: 920,
    populasi2027: 850,
    strikes2025: 9,
    strikes2026: 6,
    deskripsiMitigasi: 'Pemasangan bird netting pada drainase terbuka dan pengurasan genangan air pasca hujan lebat.'
  },
  {
    id: 'sp-kuntul',
    namaIndonesia: 'Burung Kuntul (Egretta)',
    namaLatin: 'Bubulcus ibis / Egretta',
    kategoriRisiko: 'TINGGI',
    bobotRataRataGram: 380,
    perilakuFlocking: 'Kawanan Sedang (10-50)',
    habitatUtama: 'Infield Strip Runway 07L/25R & Lahan Rumput Terbuka',
    populasi2025: 1050,
    populasi2026: 917,
    populasi2027: 820,
    strikes2025: 8,
    strikes2026: 5,
    deskripsiMitigasi: 'Pemotongan rumput berkala 15-20 cm untuk menekan serangga tanah & patroli mobile dispersal.'
  },
  {
    id: 'sp-cangak-merah',
    namaIndonesia: 'Cangak Merah',
    namaLatin: 'Ardea purpurea',
    kategoriRisiko: 'TINGGI',
    bobotRataRataGram: 650,
    perilakuFlocking: 'Kelompok Kecil (2-10)',
    habitatUtama: 'Area Rawa Perimeter & Infield Basah',
    populasi2025: 95,
    populasi2026: 83,
    populasi2027: 70,
    strikes2025: 2,
    strikes2026: 1,
    deskripsiMitigasi: 'Patroli perimeter rutin dan penembakan pyrotechnic untuk menjauhkan dari approach runway.'
  },
  {
    id: 'sp-pecuk-ular',
    namaIndonesia: 'Pecuk Ular Asia',
    namaLatin: 'Anhinga melanogaster',
    kategoriRisiko: 'TINGGI',
    bobotRataRataGram: 1200,
    perilakuFlocking: 'Soliter / Kelompok Kecil',
    habitatUtama: 'Kolam Penampungan Air & Saluran Drainase Utama',
    populasi2025: 90,
    populasi2026: 85,
    populasi2027: 65,
    strikes2025: 2,
    strikes2026: 1,
    deskripsiMitigasi: 'Pengurasan kolam dan penggunaan laser repellent hijau saat senja.'
  },
  {
    id: 'sp-biawak',
    namaIndonesia: 'Biawak Air (Varanus)',
    namaLatin: 'Varanus salvator',
    kategoriRisiko: 'SEDANG',
    bobotRataRataGram: 3500,
    perilakuFlocking: 'Soliter',
    habitatUtama: 'Drainase Perimeter & Saluran Gorong-gorong',
    populasi2025: 75,
    populasi2026: 67,
    populasi2027: 50,
    strikes2025: 1,
    strikes2026: 1,
    deskripsiMitigasi: 'Pemasangan kawat bronjong/grating di muara gorong-gorong perimeter pagar.'
  },
  {
    id: 'sp-kucing',
    namaIndonesia: 'Kucing Liar (Feral Cat)',
    namaLatin: 'Felis catus',
    kategoriRisiko: 'SEDANG',
    bobotRataRataGram: 2800,
    perilakuFlocking: 'Soliter',
    habitatUtama: 'Area Apron, Gudang Kargo & GSE Infield',
    populasi2025: 68,
    populasi2026: 56,
    populasi2027: 40,
    strikes2025: 1,
    strikes2026: 1,
    deskripsiMitigasi: 'Penangkapan manusiawi (humane trapping) bersama dinas karantina hewan.'
  },
  {
    id: 'sp-cangak-abu',
    namaIndonesia: 'Cangak Abu',
    namaLatin: 'Ardea cinerea',
    kategoriRisiko: 'TINGGI',
    bobotRataRataGram: 1400,
    perilakuFlocking: 'Soliter / Kelompok Kecil',
    habitatUtama: 'Holding Pond & Bantaran Sungai Luar',
    populasi2025: 45,
    populasi2026: 36,
    populasi2027: 30,
    strikes2025: 1,
    strikes2026: 0,
    deskripsiMitigasi: 'Pemasangan bird spikes pada pagar batas dan dispersi aktif suara bio-akustik.'
  },
  {
    id: 'sp-bangau-bluwok',
    namaIndonesia: 'Bangau Bluwok (Milky Stork)',
    namaLatin: 'Mycteria cinerea',
    kategoriRisiko: 'KRITIS',
    bobotRataRataGram: 2200,
    perilakuFlocking: 'Kelompok Kecil (2-10)',
    habitatUtama: 'Kawasan Konservasi Pantai & Rawa Dekat Runway 25L',
    populasi2025: 25,
    populasi2026: 21,
    populasi2027: 18,
    strikes2025: 1,
    strikes2026: 0,
    deskripsiMitigasi: 'Pemantauan intensif lintasan terbang (flyway) dan koordinasi warning pilot via Tower ATC.'
  },
  {
    id: 'sp-elang',
    namaIndonesia: 'Elang Bondol (Raptor)',
    namaLatin: 'Haliastur indus',
    kategoriRisiko: 'KRITIS',
    bobotRataRataGram: 720,
    perilakuFlocking: 'Soliter',
    habitatUtama: 'Thermal Soaring di Ketinggian 100-300m Approach Runway',
    populasi2025: 12,
    populasi2026: 8,
    populasi2027: 6,
    strikes2025: 1,
    strikes2026: 0,
    deskripsiMitigasi: 'Pengamatan teropong binokular jarak jauh, koordinasi pilot advisory melalui ATC saat terdeteksi soaring.'
  },
  {
    id: 'sp-satwa-lain',
    namaIndonesia: 'Satwa Lain (Pipit, Layang-layang, dll)',
    namaLatin: 'Other Passerines & Wildlife',
    kategoriRisiko: 'SEDANG',
    bobotRataRataGram: 35,
    perilakuFlocking: 'Kawanan Masif (>50)',
    habitatUtama: 'Bahu Runway & Vegetasi Rumput Infield',
    populasi2025: 2200,
    populasi2026: 1846,
    populasi2027: 1500,
    strikes2025: 3,
    strikes2026: 2,
    deskripsiMitigasi: 'Penyapuan vegetasi pakan, pemotongan rumput rutin, dan sirene kendaraan WHU.'
  }
];
