import { DutyRosterDocument, DutyRosterPersonnel, DutyRosterDayEntry } from '../types';

export const OFFICIAL_OCTOBER_PERSONNEL: DutyRosterPersonnel[] = [
  { nama: 'NURJAYA', nik: '20242880', pleton: 'Pleton Alpha', pletonCode: 'ALPHA', jabatan: 'Petugas WHU' },
  { nama: 'YUDISTIRA ADY P.', nik: '20245256', pleton: 'Pleton Alpha', pletonCode: 'ALPHA', jabatan: 'Petugas WHU' },
  { nama: 'MOHAMAD DANIL', nik: '20244166', pleton: 'Pleton Bravo', pletonCode: 'BRAVO', jabatan: 'Petugas WHU' },
  { nama: 'RIO WIJAYANTO', nik: '20243777', pleton: 'Pleton Bravo', pletonCode: 'BRAVO', jabatan: 'Petugas WHU' },
  { nama: 'YUDHA ABADI S.', nik: '20246882', pleton: 'Pleton Charlie', pletonCode: 'CHARLIE', jabatan: 'Petugas WHU' },
  { nama: 'M. SYAFRIZAL L. TOBING', nik: '20245727', pleton: 'Pleton Charlie', pletonCode: 'CHARLIE', jabatan: 'Petugas WHU' },
  { nama: 'KUKUH BRILIYANDHI', nik: '20242969', pleton: 'Pleton Delta', pletonCode: 'DELTA', jabatan: 'Petugas WHU' },
  { nama: 'M. RIZKI ROMADHON S.', nik: '20245602', pleton: 'Pleton Delta', pletonCode: 'DELTA', jabatan: 'Petugas WHU' }
];

export const OFFICIAL_OCTOBER_PLETON_MEMBERS: Record<string, DutyRosterPersonnel[]> = {
  ALPHA: [
    { nama: 'NURJAYA', nik: '20242880', pleton: 'Pleton Alpha', pletonCode: 'ALPHA', jabatan: 'Petugas WHU' },
    { nama: 'YUDISTIRA ADY P.', nik: '20245256', pleton: 'Pleton Alpha', pletonCode: 'ALPHA', jabatan: 'Petugas WHU' }
  ],
  BRAVO: [
    { nama: 'MOHAMAD DANIL', nik: '20244166', pleton: 'Pleton Bravo', pletonCode: 'BRAVO', jabatan: 'Petugas WHU' },
    { nama: 'RIO WIJAYANTO', nik: '20243777', pleton: 'Pleton Bravo', pletonCode: 'BRAVO', jabatan: 'Petugas WHU' }
  ],
  CHARLIE: [
    { nama: 'YUDHA ABADI S.', nik: '20246882', pleton: 'Pleton Charlie', pletonCode: 'CHARLIE', jabatan: 'Petugas WHU' },
    { nama: 'M. SYAFRIZAL L. TOBING', nik: '20245727', pleton: 'Pleton Charlie', pletonCode: 'CHARLIE', jabatan: 'Petugas WHU' }
  ],
  DELTA: [
    { nama: 'KUKUH BRILIYANDHI', nik: '20242969', pleton: 'Pleton Delta', pletonCode: 'DELTA', jabatan: 'Petugas WHU' },
    { nama: 'M. RIZKI ROMADHON S.', nik: '20245602', pleton: 'Pleton Delta', pletonCode: 'DELTA', jabatan: 'Petugas WHU' }
  ]
};

const DAY_NAMES_OCTOBER_2026: Record<number, string> = {
  1: 'Kamis', 2: 'Jumat', 3: 'Sabtu', 4: 'Minggu', 5: 'Senin', 6: 'Selasa', 7: 'Rabu',
  8: 'Kamis', 9: 'Jumat', 10: 'Sabtu', 11: 'Minggu', 12: 'Senin', 13: 'Selasa', 14: 'Rabu',
  15: 'Kamis', 16: 'Jumat', 17: 'Sabtu', 18: 'Minggu', 19: 'Senin', 20: 'Selasa', 21: 'Rabu',
  22: 'Kamis', 23: 'Jumat', 24: 'Sabtu', 25: 'Minggu', 26: 'Senin', 27: 'Selasa', 28: 'Rabu',
  29: 'Kamis', 30: 'Jumat', 31: 'Sabtu'
};

export const OFFICIAL_OCTOBER_DAILY_ENTRIES: DutyRosterDayEntry[] = [
  {
    tanggal: 1,
    hari: DAY_NAMES_OCTOBER_2026[1],
    dateStr: '2026-10-01',
    pagiPleton: 'Pleton Delta',
    pagiPetugas: 'M. RIZKI ROMADHON S. (20245602)',
    malamPleton: 'Pleton Charlie',
    malamPetugas: 'YUDHA ABADI S. (20246882), M. SYAFRIZAL L. TOBING (20245727)',
    keterangan: 'Dinas Pagi: 1, Dinas Malam: 2'
  },
  {
    tanggal: 2,
    hari: DAY_NAMES_OCTOBER_2026[2],
    dateStr: '2026-10-02',
    pagiPleton: 'Pleton Alpha',
    pagiPetugas: 'NURJAYA (20242880), YUDISTIRA ADY P. (20245256)',
    malamPleton: 'Pleton Delta',
    malamPetugas: 'KUKUH BRILIYANDHI (20242969), M. RIZKI ROMADHON S. (20245602)',
    keterangan: 'Dinas Pagi: 2, Dinas Malam: 2'
  },
  {
    tanggal: 3,
    hari: DAY_NAMES_OCTOBER_2026[3],
    dateStr: '2026-10-03',
    pagiPleton: 'Pleton Bravo',
    pagiPetugas: 'MOHAMAD DANIL (20244166), RIO WIJAYANTO (20243777)',
    malamPleton: 'Pleton Alpha',
    malamPetugas: 'NURJAYA (20242880), YUDISTIRA ADY P. (20245256)',
    keterangan: 'Dinas Pagi: 2, Dinas Malam: 2'
  },
  {
    tanggal: 4,
    hari: DAY_NAMES_OCTOBER_2026[4],
    dateStr: '2026-10-04',
    pagiPleton: 'Pleton Charlie',
    pagiPetugas: 'YUDHA ABADI S. (20246882), M. SYAFRIZAL L. TOBING (20245727)',
    malamPleton: 'Pleton Bravo',
    malamPetugas: 'MOHAMAD DANIL (20244166), RIO WIJAYANTO (20243777)',
    keterangan: 'Dinas Pagi: 2, Dinas Malam: 2'
  },
  {
    tanggal: 5,
    hari: DAY_NAMES_OCTOBER_2026[5],
    dateStr: '2026-10-05',
    pagiPleton: 'Pleton Delta',
    pagiPetugas: 'KUKUH BRILIYANDHI (20242969), M. RIZKI ROMADHON S. (20245602)',
    malamPleton: 'Pleton Charlie',
    malamPetugas: 'YUDHA ABADI S. (20246882), M. SYAFRIZAL L. TOBING (20245727)',
    keterangan: 'Dinas Pagi: 2, Dinas Malam: 2'
  },
  {
    tanggal: 6,
    hari: DAY_NAMES_OCTOBER_2026[6],
    dateStr: '2026-10-06',
    pagiPleton: 'Pleton Alpha',
    pagiPetugas: 'NURJAYA (20242880), YUDISTIRA ADY P. (20245256), RIO WIJAYANTO (20243777)',
    malamPleton: 'Pleton Delta',
    malamPetugas: 'KUKUH BRILIYANDHI (20242969), M. RIZKI ROMADHON S. (20245602)',
    keterangan: 'Dinas Pagi: 3 (Backfill Rio Wijayanto), Dinas Malam: 2'
  },
  {
    tanggal: 7,
    hari: DAY_NAMES_OCTOBER_2026[7],
    dateStr: '2026-10-07',
    pagiPleton: 'Pleton Bravo',
    pagiPetugas: 'MOHAMAD DANIL (20244166), RIO WIJAYANTO (20243777)',
    malamPleton: 'Pleton Alpha',
    malamPetugas: 'NURJAYA (20242880), YUDISTIRA ADY P. (20245256)',
    keterangan: 'Dinas Pagi: 2, Dinas Malam: 2'
  },
  {
    tanggal: 8,
    hari: DAY_NAMES_OCTOBER_2026[8],
    dateStr: '2026-10-08',
    pagiPleton: 'Pleton Charlie',
    pagiPetugas: 'YUDHA ABADI S. (20246882), M. SYAFRIZAL L. TOBING (20245727)',
    malamPleton: 'Pleton Bravo',
    malamPetugas: 'MOHAMAD DANIL (20244166), RIO WIJAYANTO (20243777)',
    keterangan: 'Dinas Pagi: 2, Dinas Malam: 2'
  },
  {
    tanggal: 9,
    hari: DAY_NAMES_OCTOBER_2026[9],
    dateStr: '2026-10-09',
    pagiPleton: 'Pleton Delta',
    pagiPetugas: 'KUKUH BRILIYANDHI (20242969), M. RIZKI ROMADHON S. (20245602)',
    malamPleton: 'Pleton Charlie',
    malamPetugas: 'YUDHA ABADI S. (20246882), M. SYAFRIZAL L. TOBING (20245727)',
    keterangan: 'Dinas Pagi: 2, Dinas Malam: 2'
  },
  {
    tanggal: 10,
    hari: DAY_NAMES_OCTOBER_2026[10],
    dateStr: '2026-10-10',
    pagiPleton: 'Pleton Alpha',
    pagiPetugas: 'NURJAYA (20242880), YUDISTIRA ADY P. (20245256)',
    malamPleton: 'Pleton Delta',
    malamPetugas: 'KUKUH BRILIYANDHI (20242969), M. RIZKI ROMADHON S. (20245602)',
    keterangan: 'Dinas Pagi: 2, Dinas Malam: 2'
  },
  {
    tanggal: 11,
    hari: DAY_NAMES_OCTOBER_2026[11],
    dateStr: '2026-10-11',
    pagiPleton: 'Pleton Bravo',
    pagiPetugas: 'MOHAMAD DANIL (20244166), RIO WIJAYANTO (20243777)',
    malamPleton: 'Pleton Alpha',
    malamPetugas: 'NURJAYA (20242880), YUDISTIRA ADY P. (20245256)',
    keterangan: 'Dinas Pagi: 2, Dinas Malam: 2'
  },
  {
    tanggal: 12,
    hari: DAY_NAMES_OCTOBER_2026[12],
    dateStr: '2026-10-12',
    pagiPleton: 'Pleton Charlie',
    pagiPetugas: 'YUDHA ABADI S. (20246882), M. SYAFRIZAL L. TOBING (20245727)',
    malamPleton: 'Pleton Bravo',
    malamPetugas: 'MOHAMAD DANIL (20244166), RIO WIJAYANTO (20243777)',
    keterangan: 'Dinas Pagi: 2, Dinas Malam: 2'
  },
  {
    tanggal: 13,
    hari: DAY_NAMES_OCTOBER_2026[13],
    dateStr: '2026-10-13',
    pagiPleton: 'Pleton Delta',
    pagiPetugas: 'KUKUH BRILIYANDHI (20242969), M. RIZKI ROMADHON S. (20245602)',
    malamPleton: 'Pleton Charlie',
    malamPetugas: 'YUDHA ABADI S. (20246882), M. SYAFRIZAL L. TOBING (20245727)',
    keterangan: 'Dinas Pagi: 2, Dinas Malam: 2'
  },
  {
    tanggal: 14,
    hari: DAY_NAMES_OCTOBER_2026[14],
    dateStr: '2026-10-14',
    pagiPleton: 'Pleton Alpha',
    pagiPetugas: 'NURJAYA (20242880), YUDISTIRA ADY P. (20245256), RIO WIJAYANTO (20243777)',
    malamPleton: 'Pleton Delta',
    malamPetugas: 'KUKUH BRILIYANDHI (20242969), M. RIZKI ROMADHON S. (20245602)',
    keterangan: 'Dinas Pagi: 3 (Backfill Rio Wijayanto), Dinas Malam: 2'
  },
  {
    tanggal: 15,
    hari: DAY_NAMES_OCTOBER_2026[15],
    dateStr: '2026-10-15',
    pagiPleton: 'Pleton Bravo',
    pagiPetugas: 'MOHAMAD DANIL (20244166), RIO WIJAYANTO (20243777)',
    malamPleton: 'Pleton Alpha',
    malamPetugas: 'NURJAYA (20242880), YUDISTIRA ADY P. (20245256)',
    keterangan: 'Dinas Pagi: 2, Dinas Malam: 2'
  },
  {
    tanggal: 16,
    hari: DAY_NAMES_OCTOBER_2026[16],
    dateStr: '2026-10-16',
    pagiPleton: 'Pleton Charlie',
    pagiPetugas: 'YUDHA ABADI S. (20246882), M. SYAFRIZAL L. TOBING (20245727)',
    malamPleton: 'Pleton Bravo',
    malamPetugas: 'MOHAMAD DANIL (20244166), RIO WIJAYANTO (20243777)',
    keterangan: 'Dinas Pagi: 2, Dinas Malam: 2'
  },
  {
    tanggal: 17,
    hari: DAY_NAMES_OCTOBER_2026[17],
    dateStr: '2026-10-17',
    pagiPleton: 'Pleton Delta',
    pagiPetugas: 'KUKUH BRILIYANDHI (20242969), M. RIZKI ROMADHON S. (20245602)',
    malamPleton: 'Pleton Charlie',
    malamPetugas: 'YUDHA ABADI S. (20246882), M. SYAFRIZAL L. TOBING (20245727)',
    keterangan: 'Dinas Pagi: 2, Dinas Malam: 2'
  },
  {
    tanggal: 18,
    hari: DAY_NAMES_OCTOBER_2026[18],
    dateStr: '2026-10-18',
    pagiPleton: 'Pleton Alpha',
    pagiPetugas: 'NURJAYA (20242880), YUDISTIRA ADY P. (20245256)',
    malamPleton: 'Pleton Delta',
    malamPetugas: 'KUKUH BRILIYANDHI (20242969), M. RIZKI ROMADHON S. (20245602)',
    keterangan: 'Dinas Pagi: 2, Dinas Malam: 2'
  },
  {
    tanggal: 19,
    hari: DAY_NAMES_OCTOBER_2026[19],
    dateStr: '2026-10-19',
    pagiPleton: 'Pleton Bravo',
    pagiPetugas: 'MOHAMAD DANIL (20244166), RIO WIJAYANTO (20243777)',
    malamPleton: 'Pleton Alpha',
    malamPetugas: 'NURJAYA (20242880), YUDISTIRA ADY P. (20245256)',
    keterangan: 'Dinas Pagi: 2, Dinas Malam: 2'
  },
  {
    tanggal: 20,
    hari: DAY_NAMES_OCTOBER_2026[20],
    dateStr: '2026-10-20',
    pagiPleton: 'Pleton Charlie',
    pagiPetugas: 'YUDHA ABADI S. (20246882), M. SYAFRIZAL L. TOBING (20245727)',
    malamPleton: 'Pleton Bravo',
    malamPetugas: 'MOHAMAD DANIL (20244166), RIO WIJAYANTO (20243777)',
    keterangan: 'Dinas Pagi: 2, Dinas Malam: 2'
  },
  {
    tanggal: 21,
    hari: DAY_NAMES_OCTOBER_2026[21],
    dateStr: '2026-10-21',
    pagiPleton: 'Pleton Delta',
    pagiPetugas: 'KUKUH BRILIYANDHI (20242969), M. RIZKI ROMADHON S. (20245602)',
    malamPleton: 'Pleton Charlie',
    malamPetugas: 'YUDHA ABADI S. (20246882), M. SYAFRIZAL L. TOBING (20245727)',
    keterangan: 'Dinas Pagi: 2, Dinas Malam: 2'
  },
  {
    tanggal: 22,
    hari: DAY_NAMES_OCTOBER_2026[22],
    dateStr: '2026-10-22',
    pagiPleton: 'Pleton Alpha',
    pagiPetugas: 'NURJAYA (20242880), YUDISTIRA ADY P. (20245256), RIO WIJAYANTO (20243777)',
    malamPleton: 'Pleton Delta',
    malamPetugas: 'KUKUH BRILIYANDHI (20242969), M. RIZKI ROMADHON S. (20245602)',
    keterangan: 'Dinas Pagi: 3 (Backfill Rio Wijayanto), Dinas Malam: 2'
  },
  {
    tanggal: 23,
    hari: DAY_NAMES_OCTOBER_2026[23],
    dateStr: '2026-10-23',
    pagiPleton: 'Pleton Bravo',
    pagiPetugas: 'MOHAMAD DANIL (20244166), RIO WIJAYANTO (20243777)',
    malamPleton: 'Pleton Alpha',
    malamPetugas: 'NURJAYA (20242880), YUDISTIRA ADY P. (20245256)',
    keterangan: 'Dinas Pagi: 2, Dinas Malam: 2'
  },
  {
    tanggal: 24,
    hari: DAY_NAMES_OCTOBER_2026[24],
    dateStr: '2026-10-24',
    pagiPleton: 'Pleton Charlie',
    pagiPetugas: 'YUDHA ABADI S. (20246882), M. SYAFRIZAL L. TOBING (20245727)',
    malamPleton: 'Pleton Bravo',
    malamPetugas: 'MOHAMAD DANIL (20244166), RIO WIJAYANTO (20243777)',
    keterangan: 'Dinas Pagi: 2, Dinas Malam: 2'
  },
  {
    tanggal: 25,
    hari: DAY_NAMES_OCTOBER_2026[25],
    dateStr: '2026-10-25',
    pagiPleton: 'Pleton Delta',
    pagiPetugas: 'KUKUH BRILIYANDHI (20242969), M. RIZKI ROMADHON S. (20245602)',
    malamPleton: 'Pleton Charlie',
    malamPetugas: 'YUDHA ABADI S. (20246882), M. SYAFRIZAL L. TOBING (20245727)',
    keterangan: 'Dinas Pagi: 2, Dinas Malam: 2'
  },
  {
    tanggal: 26,
    hari: DAY_NAMES_OCTOBER_2026[26],
    dateStr: '2026-10-26',
    pagiPleton: 'Pleton Alpha',
    pagiPetugas: 'NURJAYA (20242880), YUDISTIRA ADY P. (20245256)',
    malamPleton: 'Pleton Delta',
    malamPetugas: 'KUKUH BRILIYANDHI (20242969), M. RIZKI ROMADHON S. (20245602)',
    keterangan: 'Dinas Pagi: 2, Dinas Malam: 2'
  },
  {
    tanggal: 27,
    hari: DAY_NAMES_OCTOBER_2026[27],
    dateStr: '2026-10-27',
    pagiPleton: 'Pleton Bravo',
    pagiPetugas: 'MOHAMAD DANIL (20244166), RIO WIJAYANTO (20243777)',
    malamPleton: 'Pleton Alpha',
    malamPetugas: 'NURJAYA (20242880), YUDISTIRA ADY P. (20245256)',
    keterangan: 'Dinas Pagi: 2, Dinas Malam: 2'
  },
  {
    tanggal: 28,
    hari: DAY_NAMES_OCTOBER_2026[28],
    dateStr: '2026-10-28',
    pagiPleton: 'Pleton Charlie',
    pagiPetugas: 'YUDHA ABADI S. (20246882), M. SYAFRIZAL L. TOBING (20245727)',
    malamPleton: 'Pleton Bravo',
    malamPetugas: 'MOHAMAD DANIL (20244166), RIO WIJAYANTO (20243777)',
    keterangan: 'Dinas Pagi: 2, Dinas Malam: 2'
  },
  {
    tanggal: 29,
    hari: DAY_NAMES_OCTOBER_2026[29],
    dateStr: '2026-10-29',
    pagiPleton: 'Pleton Delta',
    pagiPetugas: 'KUKUH BRILIYANDHI (20242969), M. RIZKI ROMADHON S. (20245602)',
    malamPleton: 'Pleton Charlie',
    malamPetugas: 'YUDHA ABADI S. (20246882), M. SYAFRIZAL L. TOBING (20245727)',
    keterangan: 'Dinas Pagi: 2, Dinas Malam: 2'
  },
  {
    tanggal: 30,
    hari: DAY_NAMES_OCTOBER_2026[30],
    dateStr: '2026-10-30',
    pagiPleton: 'Pleton Alpha',
    pagiPetugas: 'NURJAYA (20242880), YUDISTIRA ADY P. (20245256), RIO WIJAYANTO (20243777)',
    malamPleton: 'Pleton Delta',
    malamPetugas: 'KUKUH BRILIYANDHI (20242969), M. RIZKI ROMADHON S. (20245602)',
    keterangan: 'Dinas Pagi: 3 (Backfill Rio Wijayanto), Dinas Malam: 2'
  },
  {
    tanggal: 31,
    hari: DAY_NAMES_OCTOBER_2026[31],
    dateStr: '2026-10-31',
    pagiPleton: 'Pleton Bravo',
    pagiPetugas: 'MOHAMAD DANIL (20244166), RIO WIJAYANTO (20243777)',
    malamPleton: 'Pleton Alpha',
    malamPetugas: 'NURJAYA (20242880), YUDISTIRA ADY P. (20245256)',
    keterangan: 'Dinas Pagi: 2, Dinas Malam: 2'
  }
];

export const OFFICIAL_OCTOBER_ROSTER_DOCUMENT: DutyRosterDocument = {
  id: 'roster-oktober-2026',
  title: 'JADWAL DINAS WILDLIFE HAZARD - CGK BULAN OKTOBER 2026',
  periodeBulan: 'Oktober',
  periodeTahun: 2026,
  fileName: 'JADWAL DINAS WILDLIFE HAZARD - CGK BULAN OKTOBER 2026.pdf',
  fileType: 'pdf',
  fileMime: 'application/pdf',
  fileSize: 328450,
  uploadedAt: '2026-09-25T08:00:00.000Z',
  uploadedBy: 'RACHMADITYA (Dept. Head)',
  disahkanOleh: 'RACHMADITYA (Wildlife Hazard Department Head)',
  catatan: 'Jadwal dinas resmi operasional Unit Wildlife Hazard Bandara Internasional Soekarno-Hatta bulan Oktober 2026 disahkan oleh RACHMADITYA di Tangerang pada tanggal 25 September 2026.',
  status: 'Aktif',
  statusDokumen: 'Resmi Berlaku',
  pleton: 'Semua Pleton (4 Pleton)',
  keterangan: '8 Personel WHU: Pleton Alpha (Nurjaya, Yudistira), Bravo (Danil, Rio), Charlie (Yudha, Syafrizal), Delta (Kukuh, Rizki).',
  totalRows: 31,
  personnelList: OFFICIAL_OCTOBER_PERSONNEL,
  pletonMembers: OFFICIAL_OCTOBER_PLETON_MEMBERS,
  parsedEntries: OFFICIAL_OCTOBER_DAILY_ENTRIES
};
