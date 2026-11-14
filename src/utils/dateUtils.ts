/**
 * Utility functions for Indonesian Calendar & Time Handling in WHU Reports
 */

export const ID_MONTHS = [
  'januari', 'februari', 'maret', 'april', 'mei', 'juni',
  'juli', 'agustus', 'september', 'oktober', 'november', 'desember'
];

export const EN_MONTHS = [
  'january', 'february', 'march', 'april', 'may', 'june',
  'july', 'august', 'september', 'october', 'november', 'december'
];

/**
 * Robustly normalizes any month representation to month index (0 to 11).
 * Supports: 0-11, 1-12, 'Januari', 'Jan', 'September', '09', 'Sept 2026', etc.
 */
export function getNormalizedMonthIndex(monthInput: string | number | undefined | null): number {
  if (monthInput === undefined || monthInput === null) return -1;
  if (typeof monthInput === 'number') {
    if (monthInput >= 0 && monthInput <= 11) return monthInput;
    if (monthInput >= 1 && monthInput <= 12) return monthInput - 1;
    return -1;
  }
  const str = String(monthInput).trim().toLowerCase();
  if (!str) return -1;

  // Check digits (e.g. "9", "09", "12")
  const pureNumMatch = str.match(/^0?([1-9]|1[0-2])$/);
  if (pureNumMatch) {
    return parseInt(pureNumMatch[1], 10) - 1;
  }

  // Common month abbreviations and aliases
  const monthAliases: Record<string, number> = {
    jan: 0, januari: 0, january: 0,
    feb: 1, februari: 1, february: 1,
    mar: 2, maret: 2, march: 2,
    apr: 3, april: 3,
    mei: 4, may: 4,
    jun: 5, juni: 5, june: 5,
    jul: 6, juli: 6, july: 6,
    agu: 7, ags: 7, agt: 7, agustus: 7, aug: 7, august: 7,
    sep: 8, sept: 8, september: 8,
    okt: 9, oct: 9, oktober: 9, october: 9,
    nov: 10, november: 10,
    des: 11, dec: 11, desember: 11, december: 11
  };

  const wordMatch = str.match(/\b(jan(?:uari|uary)?|feb(?:ruari|ruary)?|mar(?:et|ch)?|apr(?:il)?|mei|may|jun(?:i|e)?|jul(?:i|y)?|ag[ust]{1,5}|aug(?:ust)?|sep(?:tember)?|okt(?:ober)?|oct(?:ober)?|nov(?:ember)?|des(?:ember)?|dec(?:ember)?)\b/i);
  if (wordMatch) {
    const key = wordMatch[1].toLowerCase().slice(0, 3);
    if (monthAliases[key] !== undefined) {
      return monthAliases[key];
    }
  }

  // Check Indonesian
  for (let i = 0; i < ID_MONTHS.length; i++) {
    const full = ID_MONTHS[i];
    const prefix = full.slice(0, 3);
    if (str.includes(full) || str.startsWith(prefix)) {
      return i;
    }
  }

  // Check English
  for (let i = 0; i < EN_MONTHS.length; i++) {
    const full = EN_MONTHS[i];
    const prefix = full.slice(0, 3);
    if (str.includes(full) || str.startsWith(prefix)) {
      return i;
    }
  }

  return -1;
}

/**
 * Attempts to parse Month and Year from a file name or title string.
 * Example: "Laporan_Bulanan_WHMS_Maret_2026.pdf" -> { month: "Maret", year: 2026 }
 */
export function parseMonthYearFromFilename(filename: string): { month?: string; year?: number } {
  if (!filename) return {};
  const clean = filename.replace(/\.(pdf|docx?|xlsx?|csv)$/i, '');
  const lower = clean.toLowerCase();

  // 1. Search for 4 digit year (2020 - 2035)
  const yearMatch = lower.match(/\b(20[2-3]\d)\b/);
  let year = yearMatch ? parseInt(yearMatch[1], 10) : undefined;

  // 2. Check for 2-digit year suffix e.g. "Feb26", "Des25", "Sep26"
  if (!year) {
    const shortYearMatch = lower.match(/(?:jan|feb|mar|apr|mei|may|jun|jul|agu|ags|agt|aug|sep|okt|oct|nov|des|dec)[_-]?([2-3]\d)\b/i);
    if (shortYearMatch) {
      year = 2000 + parseInt(shortYearMatch[1], 10);
    }
  }

  // 3. Search for month by name or abbreviation
  let month: string | undefined = undefined;
  const monthIdx = getNormalizedMonthIndex(lower);
  if (monthIdx !== -1) {
    month = ID_MONTHS[monthIdx].charAt(0).toUpperCase() + ID_MONTHS[monthIdx].slice(1);
  }

  // 4. If month still not found, check numerical pattern YYYY-MM or MM-YYYY
  if (!month) {
    const numDateMatch = lower.match(/(?:^|[_\s-])(20\d{2})[_\s-](0?[1-9]|1[0-2])(?:$|[_\s-])/) ||
                         lower.match(/(?:^|[_\s-])(0?[1-9]|1[0-2])[_\s-](20\d{2})(?:$|[_\s-])/);
    if (numDateMatch) {
      const p1 = parseInt(numDateMatch[1], 10);
      const p2 = parseInt(numDateMatch[2], 10);
      const mNum = p1 > 1000 ? p2 : p1;
      const yNum = p1 > 1000 ? p1 : p2;
      if (mNum >= 1 && mNum <= 12) {
        month = ID_MONTHS[mNum - 1].charAt(0).toUpperCase() + ID_MONTHS[mNum - 1].slice(1);
        if (!year) year = yNum;
      }
    }
  }

  return { month, year };
}

const MONTH_NAMES_ID: { [key: string]: string } = {
  januari: '01',
  februari: '02',
  maret: '03',
  april: '04',
  mei: '05',
  juni: '06',
  juli: '07',
  agustus: '08',
  september: '09',
  oktober: '10',
  november: '11',
  desember: '12'
};

/**
 * Returns today's date in YYYY-MM-DD format based on local time
 */
export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Returns current time in HH:MM format
 */
export function getCurrentTimeString(): string {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

/**
 * Formats a YYYY-MM-DD date string into Indonesian formal format:
 * Example: "2026-09-12" -> "Sabtu, 12 September 2026"
 */
export function formatDateToIndonesian(isoDate: string): string {
  if (!isoDate) return '';
  const parts = isoDate.split('-');
  if (parts.length !== 3) return isoDate;

  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);

  const dateObj = new Date(year, month, day);
  if (isNaN(dateObj.getTime())) return isoDate;

  return dateObj.toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
}

/**
 * Attempts to parse an Indonesian date string (e.g. "Rabu, 09 September 2026")
 * into YYYY-MM-DD format for HTML date inputs.
 */
export function parseIndonesianDateToYYYYMMDD(text: string): string {
  if (!text) return '';
  // If already YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(text.trim())) {
    return text.trim();
  }

  // Check if standard ISO format
  if (text.includes('T')) {
    const isoPart = text.split('T')[0];
    if (/^\d{4}-\d{2}-\d{2}$/.test(isoPart)) {
      return isoPart;
    }
  }

  // Parse "Hari, DD Bulan YYYY" or "DD Bulan YYYY"
  const cleaned = text.replace(/^[a-zA-Z]+,\s*/, '').trim();
  const tokens = cleaned.split(/\s+/);
  if (tokens.length >= 3) {
    const day = tokens[0].replace(/\D/g, '').padStart(2, '0');
    const monthName = tokens[1].toLowerCase();
    const year = tokens[2].replace(/\D/g, '');

    const monthNumber = MONTH_NAMES_ID[monthName];
    if (day && monthNumber && year && year.length === 4) {
      return `${year}-${monthNumber}-${day}`;
    }
  }

  return '';
}

/**
 * Calculate duration in minutes between two HH:MM strings.
 * Handles overnight roll-overs (e.g. 23:00 to 01:00 = 120 minutes)
 */
export function calculateDurationInMinutes(startHHMM: string, endHHMM: string): number | null {
  if (!startHHMM || !endHHMM) return null;
  const startParts = startHHMM.split(':');
  const endParts = endHHMM.split(':');
  if (startParts.length < 2 || endParts.length < 2) return null;

  const startMins = parseInt(startParts[0], 10) * 60 + parseInt(startParts[1], 10);
  const endMins = parseInt(endParts[0], 10) * 60 + parseInt(endParts[1], 10);

  if (isNaN(startMins) || isNaN(endMins)) return null;

  if (endMins >= startMins) {
    return endMins - startMins;
  } else {
    // Cross midnight
    return 24 * 60 - startMins + endMins;
  }
}
