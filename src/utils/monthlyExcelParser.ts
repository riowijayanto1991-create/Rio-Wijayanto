import * as XLSX from 'xlsx';

/**
 * Universal safe number converter for Excel cell values.
 * Converts "NIL", "N/A", "-", "", null, undefined to 0.
 * Prevents NaN from propagating into totals, averages, and MoM percentages.
 */
export function toNumber(val: any): number {
  if (val === null || val === undefined) return 0;
  if (typeof val === 'number') {
    return isNaN(val) ? 0 : val;
  }
  if (typeof val === 'string') {
    const trimmed = val.trim().toUpperCase();
    if (['NIL', 'N/A', '-', '', 'NONE', 'NIHIL', 'NULL', 'NA', '#N/A', '0'].includes(trimmed)) {
      return 0;
    }
    // Clean currency, thousand separators, or stray characters
    const cleaned = trimmed.replace(/,/g, '').replace(/[^\d.-]/g, '');
    if (!cleaned) return 0;
    const num = Number(cleaned);
    return isNaN(num) ? 0 : num;
  }
  const num = Number(val);
  return isNaN(num) ? 0 : num;
}

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
  totalByPeriod: Record<string, number>; // key: "2025-09" => total
  grandTotal: number;
}

export interface ParsedMonthlyAttachmentResult {
  monthlyRecords: ParsedMonthlyRecord[];
  birdPopulationData: BirdPopulationData;
  detectedSheets: string[];
  summary: {
    totalPeriods: number;
    startPeriod: string;
    endPeriod: string;
    totalStrikesAllPeriods: number;
    totalOccurrencesAllPeriods: number;
    totalBirdPopulationAllPeriods: number;
  };
}

const ID_MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

const MONTH_SYNONYMS: Record<string, number> = {
  // Indonesian
  'januari': 0, 'jan': 0,
  'februari': 1, 'feb': 1,
  'maret': 2, 'mar': 2,
  'april': 3, 'apr': 3,
  'mei': 4,
  'juni': 5, 'jun': 5,
  'juli': 6, 'jul': 6,
  'agustus': 7, 'agu': 7, 'ags': 7, 'agt': 7,
  'september': 8, 'sep': 8, 'sept': 8,
  'oktober': 9, 'okt': 9, 'oct': 9,
  'november': 10, 'nov': 10,
  'desember': 11, 'des': 11, 'dec': 11,
  // English
  'january': 0,
  'february': 1,
  'march': 2,
  'may': 4,
  'june': 5,
  'july': 6,
  'august': 7,
  'october': 9,
  'december': 11
};

/**
 * Extracts month index (0-11) and year from text in a "PERIODE" column cell.
 * Handles patterns like:
 * - "SEPTEMBER 2025"
 * - "OKTOBER 2025"
 * - "JANUARI 2026"
 * - "SEP-25", "Sep 2025", "2025-09", etc.
 */
export function parsePeriodCell(cellValue: any, fallbackYear = 2025): {
  bulan: string;
  bulanIndex: number;
  tahun: number;
  periodKey: string;
} | null {
  if (cellValue === null || cellValue === undefined) return null;
  const str = String(cellValue).trim().toLowerCase();
  if (!str) return null;

  // Search 4-digit year first (e.g. 2025, 2026)
  const yearMatch = str.match(/\b(20\d{2})\b/);
  let year = yearMatch ? parseInt(yearMatch[1], 10) : fallbackYear;

  // Search 2-digit year (e.g. '25, '26, -25, -26)
  if (!yearMatch) {
    const shortYearMatch = str.match(/(?:['\-\s])(\d{2})$/);
    if (shortYearMatch) {
      year = 2000 + parseInt(shortYearMatch[1], 10);
    }
  }

  // Find month name
  let foundMonthIdx: number | null = null;
  for (const [key, idx] of Object.entries(MONTH_SYNONYMS)) {
    // Match word boundaries or substring
    const regex = new RegExp(`(^|[^a-z])${key}([^a-z]|$)`, 'i');
    if (regex.test(str)) {
      foundMonthIdx = idx;
      break;
    }
  }

  // If not found by word boundary, check simple include
  if (foundMonthIdx === null) {
    for (const [key, idx] of Object.entries(MONTH_SYNONYMS)) {
      if (str.includes(key)) {
        foundMonthIdx = idx;
        break;
      }
    }
  }

  if (foundMonthIdx === null) {
    // Check if format is MM/YYYY or YYYY-MM
    const dateNumMatch = str.match(/(\d{4})[/-](\d{1,2})/) || str.match(/(\d{1,2})[/-](\d{4})/);
    if (dateNumMatch) {
      if (dateNumMatch[1].length === 4) {
        year = parseInt(dateNumMatch[1], 10);
        const m = parseInt(dateNumMatch[2], 10);
        if (m >= 1 && m <= 12) foundMonthIdx = m - 1;
      } else {
        year = parseInt(dateNumMatch[2], 10);
        const m = parseInt(dateNumMatch[1], 10);
        if (m >= 1 && m <= 12) foundMonthIdx = m - 1;
      }
    }
  }

  if (foundMonthIdx === null) return null;

  const monthName = ID_MONTH_NAMES[foundMonthIdx];
  const periodKey = `${year}-${String(foundMonthIdx + 1).padStart(2, '0')}`;

  return {
    bulan: monthName,
    bulanIndex: foundMonthIdx,
    tahun: year,
    periodKey
  };
}

/**
 * Parses "DATA WILDLIFE STRIKE" sheet:
 * Reads period cell text directly (NOT row index), extracts strike metrics and damages.
 */
export function parseStrikeSheet(
  sheet: XLSX.WorkSheet,
  sheetName: string,
  recordsMap: Map<string, ParsedMonthlyRecord>
): void {
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' }) as any[][];
  if (!rows || rows.length === 0) return;

  // Identify column indices from header
  let headerRowIdx = -1;
  let periodeColIdx = -1;
  let totalStrikeColIdx = -1;
  let damageColIdx = -1;

  for (let r = 0; r < Math.min(rows.length, 10); r++) {
    const row = rows[r];
    if (!Array.isArray(row)) continue;

    for (let c = 0; c < row.length; c++) {
      const cellText = String(row[c] || '').toLowerCase().trim();
      if (cellText.includes('periode') || cellText === 'bulan' || cellText.includes('bulan / tahun') || cellText.includes('month')) {
        periodeColIdx = c;
        headerRowIdx = r;
      }
      if (cellText.includes('total strike') || cellText === 'strike' || cellText === 'strikes' || cellText.includes('jumlah strike')) {
        totalStrikeColIdx = c;
      }
      if (cellText.includes('damage') || cellText.includes('kerusakan') || cellText.includes('dgn kerusakan') || cellText.includes('dengan kerusakan')) {
        damageColIdx = c;
      }
    }
    if (periodeColIdx !== -1) break;
  }

  // Fallback column index search if header row wasn't cleanly marked
  if (periodeColIdx === -1) {
    // Scan all rows to locate where "September 2025" or similar text appears
    for (let r = 0; r < Math.min(rows.length, 15); r++) {
      const row = rows[r];
      if (!Array.isArray(row)) continue;
      for (let c = 0; c < row.length; c++) {
        if (parsePeriodCell(row[c])) {
          periodeColIdx = c;
          headerRowIdx = Math.max(0, r - 1);
          break;
        }
      }
      if (periodeColIdx !== -1) break;
    }
  }

  if (periodeColIdx === -1) return;

  // Scan rows below header
  for (let r = headerRowIdx + 1; r < rows.length; r++) {
    const row = rows[r];
    if (!Array.isArray(row)) continue;

    const periodCellVal = row[periodeColIdx];
    const parsedPeriod = parsePeriodCell(periodCellVal);
    if (!parsedPeriod) continue; // Skip non-period rows (e.g. totals or empty lines)

    // Determine numeric strike values with sanitization
    let strikeVal = 0;
    let damageVal = 0;

    if (totalStrikeColIdx !== -1 && row[totalStrikeColIdx] !== undefined) {
      strikeVal = toNumber(row[totalStrikeColIdx]);
    } else {
      // If column not found, find first numeric value on the row
      for (let c = periodeColIdx + 1; c < row.length; c++) {
        const num = toNumber(row[c]);
        if (num > 0 || String(row[c]).trim().toUpperCase() === 'NIL') {
          strikeVal = num;
          break;
        }
      }
    }

    if (damageColIdx !== -1 && row[damageColIdx] !== undefined) {
      damageVal = toNumber(row[damageColIdx]);
    }

    const key = parsedPeriod.periodKey;
    const existing = recordsMap.get(key);
    if (existing) {
      existing.totalStrike = strikeVal;
      existing.strikeWithDamage = damageVal;
      if (!existing.sourceSheets.includes(sheetName)) existing.sourceSheets.push(sheetName);
    } else {
      recordsMap.set(key, {
        bulan: parsedPeriod.bulan,
        bulanIndex: parsedPeriod.bulanIndex,
        tahun: parsedPeriod.tahun,
        periodKey: key,
        totalStrike: strikeVal,
        strikeWithDamage: damageVal,
        totalOccurrence: 0,
        totalSatwa: 0,
        sourceSheets: [sheetName]
      });
    }
  }
}

/**
 * Parses "DATA WILDLIFE OCCURRENCE" sheet:
 * Reads period cell text directly, maps to { bulan, tahun } key, extracts occurrences.
 */
export function parseOccurrenceSheet(
  sheet: XLSX.WorkSheet,
  sheetName: string,
  recordsMap: Map<string, ParsedMonthlyRecord>
): void {
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' }) as any[][];
  if (!rows || rows.length === 0) return;

  let headerRowIdx = -1;
  let periodeColIdx = -1;
  let totalOccColIdx = -1;

  for (let r = 0; r < Math.min(rows.length, 10); r++) {
    const row = rows[r];
    if (!Array.isArray(row)) continue;

    for (let c = 0; c < row.length; c++) {
      const cellText = String(row[c] || '').toLowerCase().trim();
      if (cellText.includes('periode') || cellText === 'bulan' || cellText.includes('bulan / tahun') || cellText.includes('month')) {
        periodeColIdx = c;
        headerRowIdx = r;
      }
      if (cellText.includes('total occurrence') || cellText === 'occurrence' || cellText.includes('jumlah occurrence') || cellText.includes('perjumpaan')) {
        totalOccColIdx = c;
      }
    }
    if (periodeColIdx !== -1) break;
  }

  if (periodeColIdx === -1) {
    for (let r = 0; r < Math.min(rows.length, 15); r++) {
      const row = rows[r];
      if (!Array.isArray(row)) continue;
      for (let c = 0; c < row.length; c++) {
        if (parsePeriodCell(row[c])) {
          periodeColIdx = c;
          headerRowIdx = Math.max(0, r - 1);
          break;
        }
      }
      if (periodeColIdx !== -1) break;
    }
  }

  if (periodeColIdx === -1) return;

  for (let r = headerRowIdx + 1; r < rows.length; r++) {
    const row = rows[r];
    if (!Array.isArray(row)) continue;

    const periodCellVal = row[periodeColIdx];
    const parsedPeriod = parsePeriodCell(periodCellVal);
    if (!parsedPeriod) continue;

    let occVal = 0;
    if (totalOccColIdx !== -1 && row[totalOccColIdx] !== undefined) {
      occVal = toNumber(row[totalOccColIdx]);
    } else {
      for (let c = periodeColIdx + 1; c < row.length; c++) {
        const num = toNumber(row[c]);
        if (num > 0 || String(row[c]).trim().toUpperCase() === 'NIL') {
          occVal = num;
          break;
        }
      }
    }

    const key = parsedPeriod.periodKey;
    const existing = recordsMap.get(key);
    if (existing) {
      existing.totalOccurrence = occVal;
      if (!existing.sourceSheets.includes(sheetName)) existing.sourceSheets.push(sheetName);
    } else {
      recordsMap.set(key, {
        bulan: parsedPeriod.bulan,
        bulanIndex: parsedPeriod.bulanIndex,
        tahun: parsedPeriod.tahun,
        periodKey: key,
        totalStrike: 0,
        strikeWithDamage: 0,
        totalOccurrence: occVal,
        totalSatwa: 0,
        sourceSheets: [sheetName]
      });
    }
  }
}

/**
 * Parses "1.7.2 HISTORY POPULASI BURUNG" sheet:
 * Fix for flawed merged headers:
 * - Do NOT rely on merged cell year ranges.
 * - Detects month sequence per column: when month index transitions from late year (e.g. DES / 11)
 *   to early year (JAN / 0) or drops, automatically increments the year.
 * - Sanitizes "NIL" and other text cells to 0 with toNumber().
 */
export function parseBirdPopulationSheet(
  sheet: XLSX.WorkSheet,
  sheetName: string,
  recordsMap: Map<string, ParsedMonthlyRecord>
): BirdPopulationData {
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' }) as any[][];
  
  const emptyResult: BirdPopulationData = {
    periods: [],
    species: [],
    totalByPeriod: {},
    grandTotal: 0
  };

  if (!rows || rows.length === 0) return emptyResult;

  // 1. Detect Base Year (look for 2025, 2024, etc. anywhere in header rows 0-6)
  let baseYear = 2025;
  for (let r = 0; r < Math.min(rows.length, 7); r++) {
    const row = rows[r];
    if (!Array.isArray(row)) continue;
    for (let c = 0; c < row.length; c++) {
      const match = String(row[c] || '').match(/\b(20\d{2})\b/);
      if (match) {
        const found = parseInt(match[1], 10);
        if (found >= 2020 && found <= 2035) {
          baseYear = found;
          break;
        }
      }
    }
  }

  // 2. Locate Month Columns Row (look for row containing "SEP", "OKT", "NOV", "DES", "JAN" or full names)
  interface ColumnMeta {
    colIdx: number;
    bulan: string;
    bulanIndex: number;
    tahun: number;
    periodKey: string;
  }
  const monthCols: ColumnMeta[] = [];
  let monthRowIdx = -1;
  let speciesColIdx = 0;

  for (let r = 0; r < Math.min(rows.length, 10); r++) {
    const row = rows[r];
    if (!Array.isArray(row)) continue;

    // Count how many cells in this row match a month name
    const detectedInRow: Array<{ colIdx: number; bulanIndex: number }> = [];
    for (let c = 0; c < row.length; c++) {
      const cellText = String(row[c] || '').trim().toLowerCase();
      if (!cellText) continue;

      if (cellText.includes('spesies') || cellText.includes('jenis burung') || cellText.includes('nama burung')) {
        speciesColIdx = c;
      }

      // Check month synonyms
      let matchedIdx: number | null = null;
      for (const [syn, mIdx] of Object.entries(MONTH_SYNONYMS)) {
        if (cellText === syn || cellText.startsWith(syn) || cellText.endsWith(syn)) {
          matchedIdx = mIdx;
          break;
        }
      }
      if (matchedIdx !== null) {
        detectedInRow.push({ colIdx: c, bulanIndex: matchedIdx });
      }
    }

    // If at least 3 months found in this row, this is the month header row!
    if (detectedInRow.length >= 3) {
      monthRowIdx = r;

      // Assign years chronologically ignoring flawed merged cells!
      // If first month is Sep (8) or later, year starts at baseYear (e.g. 2025).
      let currentYear = baseYear;
      let prevMonthIdx = -1;

      detectedInRow.forEach((item) => {
        // Rollover detection:
        // If previous month was late year (e.g. Nov=10, Des=11) and current is early year (Jan=0, Feb=1),
        // or if month index drops from >= 8 to <= 7:
        if (prevMonthIdx !== -1) {
          if (item.bulanIndex < prevMonthIdx || (prevMonthIdx >= 8 && item.bulanIndex <= 7)) {
            currentYear = baseYear + 1;
          }
        } else {
          // First column: if starting with Jan/Feb/etc., and baseYear was 2025 but file spans 2025-2026,
          // check if later columns have Sep-Dec. If so, late months are year 1 and early months are year 2.
          if (item.bulanIndex >= 8) {
            currentYear = baseYear;
          }
        }

        prevMonthIdx = item.bulanIndex;
        const periodKey = `${currentYear}-${String(item.bulanIndex + 1).padStart(2, '0')}`;
        monthCols.push({
          colIdx: item.colIdx,
          bulan: ID_MONTH_NAMES[item.bulanIndex],
          bulanIndex: item.bulanIndex,
          tahun: currentYear,
          periodKey
        });
      });

      break;
    }
  }

  if (monthRowIdx === -1 || monthCols.length === 0) return emptyResult;

  // 3. Scan Species Rows
  const speciesList: BirdSpeciesPopulationRow[] = [];
  const totalsByPeriod: Record<string, number> = {};
  monthCols.forEach(m => { totalsByPeriod[m.periodKey] = 0; });

  for (let r = monthRowIdx + 1; r < rows.length; r++) {
    const row = rows[r];
    if (!Array.isArray(row) || row.length === 0) continue;

    const rawSpeciesName = String(row[speciesColIdx] || '').trim();
    if (!rawSpeciesName) continue;

    // Stop or skip summary/total rows
    const lower = rawSpeciesName.toLowerCase();
    if (lower.startsWith('total') || lower.startsWith('jumlah') || lower.startsWith('rata') || lower.startsWith('keterangan')) {
      continue;
    }

    // Clean species name & optional latin name
    let namaSpesies = rawSpeciesName;
    let namaLatin: string | undefined = undefined;
    const parenMatch = rawSpeciesName.match(/^(.*?)\s*\((.*?)\)$/);
    if (parenMatch) {
      namaSpesies = parenMatch[1].trim();
      namaLatin = parenMatch[2].trim();
    }

    const counts: Record<string, number> = {};
    let speciesRowTotal = 0;

    monthCols.forEach(col => {
      const cellVal = row[col.colIdx];
      const count = toNumber(cellVal); // Sanitizes "NIL" to 0!
      counts[col.periodKey] = count;
      speciesRowTotal += count;
      totalsByPeriod[col.periodKey] = (totalsByPeriod[col.periodKey] || 0) + count;
    });

    speciesList.push({
      namaSpesies,
      namaLatin,
      countsByPeriod: counts,
      totalSemuaPeriode: speciesRowTotal
    });
  }

  // 4. Update the monthly records map with bird population counts
  monthCols.forEach(col => {
    const popCount = totalsByPeriod[col.periodKey] || 0;
    const existing = recordsMap.get(col.periodKey);

    // Find dominant species in this month
    let topSpeciesName = '';
    let topSpeciesCount = -1;
    speciesList.forEach(sp => {
      const count = sp.countsByPeriod[col.periodKey] || 0;
      if (count > topSpeciesCount && count > 0) {
        topSpeciesCount = count;
        topSpeciesName = sp.namaSpesies;
      }
    });

    if (existing) {
      existing.totalSatwa = popCount;
      if (topSpeciesName) existing.spesiesDominan = topSpeciesName;
      if (!existing.sourceSheets.includes(sheetName)) existing.sourceSheets.push(sheetName);
    } else {
      recordsMap.set(col.periodKey, {
        bulan: col.bulan,
        bulanIndex: col.bulanIndex,
        tahun: col.tahun,
        periodKey: col.periodKey,
        totalStrike: 0,
        strikeWithDamage: 0,
        totalOccurrence: 0,
        totalSatwa: popCount,
        spesiesDominan: topSpeciesName || undefined,
        sourceSheets: [sheetName]
      });
    }
  });

  const grandTotal = Object.values(totalsByPeriod).reduce((a, b) => a + b, 0);

  return {
    periods: monthCols.map(c => ({
      key: c.periodKey,
      bulan: c.bulan,
      bulanIndex: c.bulanIndex,
      tahun: c.tahun,
      label: `${c.bulan.slice(0, 3)} ${c.tahun}`
    })),
    species: speciesList,
    totalByPeriod: totalsByPeriod,
    grandTotal
  };
}

/**
 * Main parser entry point for monthly report Excel attachments:
 * Inspects all sheets, locates strike, occurrence, and bird population tables,
 * and compiles a unified chronological monthly dataset with no NaNs.
 */
export function parseMonthlyAttachmentWorkbook(workbook: XLSX.WorkBook): ParsedMonthlyAttachmentResult {
  const recordsMap = new Map<string, ParsedMonthlyRecord>();
  const sheets = workbook.SheetNames || [];
  let birdPopulationData: BirdPopulationData = {
    periods: [],
    species: [],
    totalByPeriod: {},
    grandTotal: 0
  };

  // 1. Process Bird Population Sheet
  const birdSheetName = sheets.find(s => {
    const up = s.toUpperCase();
    return up.includes('POPULASI') || up.includes('1.7.2') || up.includes('BURUNG') || up.includes('HISTORY POP');
  });

  if (birdSheetName && workbook.Sheets[birdSheetName]) {
    birdPopulationData = parseBirdPopulationSheet(workbook.Sheets[birdSheetName], birdSheetName, recordsMap);
  }

  // 2. Process Wildlife Strike Sheet
  const strikeSheetName = sheets.find(s => {
    const up = s.toUpperCase();
    return up.includes('DATA WILDLIFE STRIKE') || up.includes('STRIKE') || up.includes('TABRAKAN');
  });

  if (strikeSheetName && workbook.Sheets[strikeSheetName]) {
    parseStrikeSheet(workbook.Sheets[strikeSheetName], strikeSheetName, recordsMap);
  }

  // 3. Process Wildlife Occurrence Sheet
  const occSheetName = sheets.find(s => {
    const up = s.toUpperCase();
    return up.includes('DATA WILDLIFE OCCURRENCE') || up.includes('OCCURRENCE') || up.includes('PERJUMPAAN');
  });

  if (occSheetName && workbook.Sheets[occSheetName]) {
    parseOccurrenceSheet(workbook.Sheets[occSheetName], occSheetName, recordsMap);
  }

  // 4. Fallback: If no recognized sheets found, parse the first sheet generically
  if (recordsMap.size === 0 && sheets.length > 0) {
    const firstSheet = workbook.Sheets[sheets[0]];
    parseStrikeSheet(firstSheet, sheets[0], recordsMap);
    if (recordsMap.size === 0) {
      parseOccurrenceSheet(firstSheet, sheets[0], recordsMap);
    }
  }

  // Sort monthly records strictly chronologically by year, then monthIndex
  const sortedRecords = Array.from(recordsMap.values()).sort((a, b) => {
    if (a.tahun !== b.tahun) return a.tahun - b.tahun;
    return a.bulanIndex - b.bulanIndex;
  });

  // Calculate summary metrics
  const totalStrikes = sortedRecords.reduce((acc, r) => acc + r.totalStrike, 0);
  const totalOccurrences = sortedRecords.reduce((acc, r) => acc + r.totalOccurrence, 0);
  const totalBirdPop = sortedRecords.reduce((acc, r) => acc + r.totalSatwa, 0);

  const startPeriod = sortedRecords.length > 0 ? `${sortedRecords[0].bulan} ${sortedRecords[0].tahun}` : '-';
  const endPeriod = sortedRecords.length > 0 ? `${sortedRecords[sortedRecords.length - 1].bulan} ${sortedRecords[sortedRecords.length - 1].tahun}` : '-';

  return {
    monthlyRecords: sortedRecords,
    birdPopulationData,
    detectedSheets: sheets,
    summary: {
      totalPeriods: sortedRecords.length,
      startPeriod,
      endPeriod,
      totalStrikesAllPeriods: totalStrikes,
      totalOccurrencesAllPeriods: totalOccurrences,
      totalBirdPopulationAllPeriods: totalBirdPop
    }
  };
}

/**
 * Calculates Month-over-Month (MoM) metrics safely without generating NaN or Infinity.
 */
export function calculateSafeMoM(
  current: number,
  previous: number
): {
  delta: number;
  percent: number;
  direction: 'up' | 'down' | 'stable';
} {
  const cur = toNumber(current);
  const prev = toNumber(previous);
  const delta = cur - prev;

  let percent = 0;
  if (prev > 0) {
    percent = Math.round(((cur - prev) / prev) * 100);
  } else if (cur > 0) {
    percent = 100; // Increase from 0 to positive count
  } else {
    percent = 0; // Both 0 -> 0%
  }

  // Double-guard against NaN or non-finite values
  if (!Number.isFinite(percent) || isNaN(percent)) {
    percent = 0;
  }

  const direction: 'up' | 'down' | 'stable' = delta > 0 ? 'up' : delta < 0 ? 'down' : 'stable';

  return { delta, percent, direction };
}
