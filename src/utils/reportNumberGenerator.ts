/**
 * reportNumberGenerator.ts
 * Utilitas penomoran dokumen resmi WHMS (Wildlife Hazard Management System)
 * PT Angkasa Pura Indonesia.
 *
 * Mengurutkan dan menetapkan nomor dokumen secara kronologis (sequential)
 * berdasarkan waktu pembuatan laporan (createdAt).
 * Format standar: WHU/{TYPE}/{TAHUN}/{BULAN}/{NOMOR_URUT_4_DIGIT}
 * Contoh:
 *   - Patroli Harian: WHU/PATROL/2026/09/0001, WHU/PATROL/2026/09/0002
 *   - Wildlife Occurrence: WHU/OCC/2026/09/0001, WHU/OCC/2026/09/0002
 *   - Wildlife Strike: WHU/STRIKE/2026/09/0001, WHU/STRIKE/2026/09/0002
 *   - Cek & Serah Kendaraan: WHU/VEH/2026/09/0001, WHU/VEH/2026/09/0002
 */

export type ReportTypeKey = 'PATROL' | 'OCC' | 'STRIKE' | 'VEH';

export interface ReportWithMeta {
  id?: string;
  reportNumber: string;
  createdAt?: string;
  hariTanggal?: string;
}

/**
 * Normalisasi tipe laporan menjadi kode prefix dokumen standar
 */
export function getReportPrefix(type: ReportTypeKey | 'patrol' | 'occurrence' | 'strike' | 'vehicle'): ReportTypeKey {
  const t = String(type).toUpperCase();
  if (t.includes('PATROL')) return 'PATROL';
  if (t.includes('OCC')) return 'OCC';
  if (t.includes('STRIKE')) return 'STRIKE';
  if (t.includes('VEH')) return 'VEH';
  return 'PATROL';
}

/**
 * Parse tanggal pembuatan menjadi objek { year, monthStr, dateObj }
 */
export function parseReportDate(dateOrIso?: string | Date): { year: number; monthStr: string; dateObj: Date } {
  let d: Date;
  if (!dateOrIso) {
    d = new Date();
  } else if (dateOrIso instanceof Date) {
    d = isNaN(dateOrIso.getTime()) ? new Date() : dateOrIso;
  } else {
    d = new Date(dateOrIso);
    if (isNaN(d.getTime())) {
      d = new Date();
    }
  }

  const year = d.getFullYear();
  const monthStr = String(d.getMonth() + 1).padStart(2, '0');
  return { year, monthStr, dateObj: d };
}

/**
 * Ekstrak komponen dari nomor laporan yang ada:
 * misal: "WHU/PATROL/2026/09/0004" -> { prefix: 'WHU/PATROL', year: 2026, month: '09', seq: 4, raw: '...' }
 */
export function parseExistingDocNumber(docNum?: string): {
  isValid: boolean;
  prefix?: string;
  year?: number;
  month?: string;
  seq?: number;
} {
  if (!docNum || typeof docNum !== 'string') return { isValid: false };
  const clean = docNum.trim();
  const match = clean.match(/^WHU\/([A-Z]+)\/(\d{4})\/(\d{2})\/(\d{1,6})$/i);
  if (!match) return { isValid: false };

  return {
    isValid: true,
    prefix: `WHU/${match[1].toUpperCase()}`,
    year: parseInt(match[2], 10),
    month: match[3],
    seq: parseInt(match[4], 10)
  };
}

/**
 * Generate nomor dokumen kronologis berikutnya untuk pembuatan laporan baru.
 * Nomor diurutkan berdasarkan laporan yang dibuat pada bulan dan tahun tersebut.
 */
export function generateSequentialReportNumber(
  type: ReportTypeKey | 'patrol' | 'occurrence' | 'strike' | 'vehicle',
  existingReports: ReportWithMeta[] = [],
  createdAtOrDate?: string | Date
): string {
  const prefixKey = getReportPrefix(type);
  const { year, monthStr, dateObj } = parseReportDate(createdAtOrDate);

  // Target prefix bulan dan tahun: misal "WHU/PATROL/2026/09/"
  const periodPrefix = `WHU/${prefixKey}/${year}/${monthStr}/`;

  // Filter laporan yang dibuat pada tahun dan bulan yang sama
  const sameMonthReports = (existingReports || []).filter(r => {
    // Cek apakah tanggal pembuatan (createdAt) berada di bulan dan tahun yang sama
    const rDate = parseReportDate(r.createdAt);
    if (rDate.year === year && rDate.monthStr === monthStr) return true;

    // Atau cek apakah reportNumber sudah menggunakan format periode yang sama
    if (r.reportNumber && r.reportNumber.toUpperCase().startsWith(periodPrefix)) return true;

    return false;
  });

  // Urutkan laporan yang sama periodenya secara kronologis berdasarkan waktu dibuat (createdAt)
  sameMonthReports.sort((a, b) => {
    const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return timeA - timeB;
  });

  // Cari nomor urut terbesar yang terdaftar di periode ini yang merupakan sequential number (bukan nomor acak > 500)
  let maxSeq = 0;
  const usedNumbers = new Set<string>();

  sameMonthReports.forEach(r => {
    if (!r.reportNumber) return;
    usedNumbers.add(r.reportNumber.toUpperCase().trim());
    const parsed = parseExistingDocNumber(r.reportNumber);
    if (parsed.isValid && parsed.year === year && parsed.month === monthStr && parsed.seq !== undefined) {
      // Hanya hitung angka urut wajar (< 1000) sebagai sequential base, untuk mengabaikan legacy random 4 digit (1000-9999)
      if (parsed.seq < 1000 && parsed.seq > maxSeq) {
        maxSeq = parsed.seq;
      }
    }
  });

  // Tentukan urutan berikutnya:
  // Harus minimal sama dengan jumlah laporan kronologis + 1, atau maxSeq + 1
  let nextSeq = Math.max(sameMonthReports.length + 1, maxSeq + 1);

  // Pastikan nomor unik dan belum pernah dipakai
  let candidate = `${periodPrefix}${String(nextSeq).padStart(4, '0')}`;
  while (usedNumbers.has(candidate.toUpperCase())) {
    nextSeq++;
    candidate = `${periodPrefix}${String(nextSeq).padStart(4, '0')}`;
  }

  return candidate;
}

/**
 * Dapatkan nomor dokumen berurutan sesuai kapan laporan dibuat (chronological index).
 * Berguna untuk menormalkan laporan yang awalnya memiliki nomor acak (legacy Math.random)
 * atau memastikan PDF dicetak dengan nomor urut kronologis yang tepat.
 */
export function getChronologicalDocNumber(
  currentReport: ReportWithMeta,
  allReportsOfType: ReportWithMeta[] = [],
  fallbackType: ReportTypeKey = 'PATROL'
): string {
  if (!currentReport) return '';

  const { year, monthStr } = parseReportDate(currentReport.createdAt);
  const parsedCurrent = parseExistingDocNumber(currentReport.reportNumber);
  
  // Tentukan prefix kode laporan
  let prefixKey: ReportTypeKey = fallbackType;
  if (parsedCurrent.isValid && parsedCurrent.prefix) {
    const rawType = parsedCurrent.prefix.replace('WHU/', '');
    prefixKey = getReportPrefix(rawType as any);
  }

  const periodPrefix = `WHU/${prefixKey}/${year}/${monthStr}/`;

  // Jika currentReport sudah memiliki nomor urut resmi yang rapi dan < 1000 (misal 0001, 0002),
  // cek apakah nomor tersebut valid
  if (
    parsedCurrent.isValid &&
    parsedCurrent.year === year &&
    parsedCurrent.month === monthStr &&
    parsedCurrent.seq !== undefined &&
    parsedCurrent.seq < 1000
  ) {
    // Nomor sudah sequential rapi, kembalikan dengan padding 4 digit standar
    return `${periodPrefix}${String(parsedCurrent.seq).padStart(4, '0')}`;
  }

  // Jika nomor bernilai acak (> 1000 atau format lama), hitung urutan kronologis berdasarkan createdAt
  const samePeriodReports = (allReportsOfType || []).filter(r => {
    const rDate = parseReportDate(r.createdAt);
    return rDate.year === year && rDate.monthStr === monthStr;
  });

  // Urutkan dari yang paling awal dibuat
  samePeriodReports.sort((a, b) => {
    const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return timeA - timeB;
  });

  // Cari posisi index currentReport dalam urutan kronologis
  const index = samePeriodReports.findIndex(r => r.id === currentReport.id || r.reportNumber === currentReport.reportNumber);
  const seqNumber = index >= 0 ? index + 1 : samePeriodReports.length + 1;

  return `${periodPrefix}${String(seqNumber).padStart(4, '0')}`;
}

/**
 * Format tanggal dan waktu pembuatan laporan secara resmi dalam Bahasa Indonesia
 */
export function formatReportCreationTime(createdAt?: string | Date): string {
  if (!createdAt) return '-';
  const d = typeof createdAt === 'string' ? new Date(createdAt) : createdAt;
  if (isNaN(d.getTime())) return '-';

  const dateStr = d.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  const timeStr = d.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit'
  });

  return `${dateStr}, ${timeStr} WIB`;
}
