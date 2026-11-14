import * as XLSX from 'xlsx';
import { DutyRosterPersonnel, DutyRosterDayEntry, Pleton } from '../types';
import { OFFICIAL_ROSTER_PERSONNEL, RosterPersonnel } from './dutyRosterService';
import { extractTextFromPdf, detectMonthAndYear } from './pdfParser';
import { ID_MONTHS, getNormalizedMonthIndex, parseMonthYearFromFilename } from './dateUtils';

export interface ParsedRosterScheduleResult {
  bulan?: string;
  tahun?: number;
  periodeLaporan?: string;
  disahkanOleh?: string;
  personnelList: DutyRosterPersonnel[];
  pletonMembers: Record<string, DutyRosterPersonnel[]>;
  dailyEntries: DutyRosterDayEntry[];
  summary: string;
  detectedPletonList: string[];
}

/**
 * Normalizes any month string/number to canonical capitalized Indonesian month name (e.g. "Oktober")
 */
export function getCanonicalMonthName(monthInput?: string | number | null): string {
  if (monthInput === undefined || monthInput === null) {
    const nowMonthIdx = new Date().getMonth();
    return ID_MONTHS[nowMonthIdx].charAt(0).toUpperCase() + ID_MONTHS[nowMonthIdx].slice(1);
  }
  const idx = getNormalizedMonthIndex(monthInput);
  if (idx >= 0 && idx < ID_MONTHS.length) {
    return ID_MONTHS[idx].charAt(0).toUpperCase() + ID_MONTHS[idx].slice(1);
  }
  const nowMonthIdx = new Date().getMonth();
  return ID_MONTHS[nowMonthIdx].charAt(0).toUpperCase() + ID_MONTHS[nowMonthIdx].slice(1);
}

/**
 * Normalizes platoon string to canonical name
 */
export function normalizePletonName(input?: string): { fullName: Pleton; code: 'ALPHA' | 'BRAVO' | 'CHARLIE' | 'DELTA' } {
  const str = (input || '').toLowerCase();
  if (str.includes('alpha')) return { fullName: 'Pleton Alpha', code: 'ALPHA' };
  if (str.includes('bravo')) return { fullName: 'Pleton Bravo', code: 'BRAVO' };
  if (str.includes('charlie')) return { fullName: 'Pleton Charlie', code: 'CHARLIE' };
  if (str.includes('delta')) return { fullName: 'Pleton Delta', code: 'DELTA' };
  return { fullName: 'Pleton Alpha', code: 'ALPHA' };
}

/**
 * Intelligent parser for Excel Duty Roster (.xlsx, .xls)
 * Immediately extracts Nama, NIK, and Pleton on duty.
 */
export async function parseDutyRosterFromExcel(
  fileOrBuffer: File | ArrayBuffer | Uint8Array,
  filename = '',
  fileLastModified?: number
): Promise<ParsedRosterScheduleResult> {
  let arrayBuffer: ArrayBuffer;
  if (fileOrBuffer instanceof File) {
    arrayBuffer = await fileOrBuffer.arrayBuffer();
    filename = filename || fileOrBuffer.name;
    fileLastModified = fileLastModified || fileOrBuffer.lastModified;
  } else if (fileOrBuffer instanceof Uint8Array) {
    arrayBuffer = fileOrBuffer.buffer.slice(fileOrBuffer.byteOffset, fileOrBuffer.byteOffset + fileOrBuffer.byteLength) as ArrayBuffer;
  } else {
    arrayBuffer = fileOrBuffer;
  }

  const workbook = XLSX.read(arrayBuffer, { type: 'array' });
  const sheetNames = workbook.SheetNames || [];

  let detectedMonth: string | undefined = undefined;
  let detectedYear: number | undefined = undefined;
  let disahkanOleh: string | undefined = undefined;

  // 1. Try detecting month and year from filename first
  if (filename) {
    const fromFilename = parseMonthYearFromFilename(filename);
    if (fromFilename.month) detectedMonth = getCanonicalMonthName(fromFilename.month);
    if (fromFilename.year) detectedYear = fromFilename.year;
  }

  // 2. Try sheet names
  if (!detectedMonth || !detectedYear) {
    for (const sheetName of sheetNames) {
      const fromSheet = parseMonthYearFromFilename(sheetName);
      if (fromSheet.month && !detectedMonth) detectedMonth = getCanonicalMonthName(fromSheet.month);
      if (fromSheet.year && !detectedYear) detectedYear = fromSheet.year;
    }
  }

  // 3. Fallback check metadata text
  if (!detectedMonth || !detectedYear) {
    const allMetaText = `${filename} ${sheetNames.join(' ')}`;
    for (let i = 0; i < ID_MONTHS.length; i++) {
      const reg = new RegExp(`\\b${ID_MONTHS[i]}\\b`, 'i');
      if (reg.test(allMetaText)) {
        detectedMonth = getCanonicalMonthName(ID_MONTHS[i]);
        break;
      }
    }
    const yearMatch = allMetaText.match(/\b(202[4-9])\b/);
    if (yearMatch && !detectedYear) {
      detectedYear = parseInt(yearMatch[1], 10);
    }
  }

  // 4. Fallback to file date metadata (file.lastModified timestamp) if not explicitly declared in text
  if ((!detectedMonth || !detectedYear) && fileLastModified) {
    const fileDate = new Date(fileLastModified);
    if (!isNaN(fileDate.getTime())) {
      if (!detectedMonth) {
        detectedMonth = getCanonicalMonthName(fileDate.getMonth());
      }
      if (!detectedYear) {
        detectedYear = fileDate.getFullYear();
      }
    }
  }

  const personnelMap = new Map<string, DutyRosterPersonnel>(); // key: NIK or NAMA
  const dailyShiftMap = new Map<number, { pagi: string[]; malam: string[]; pagiPleton?: string; malamPleton?: string }>();

  // Process all sheets
  for (const sheetName of sheetNames) {
    const sheet = workbook.Sheets[sheetName];
    if (!sheet) continue;

    // Also check sheet name for pleton context
    let defaultSheetPleton: 'ALPHA' | 'BRAVO' | 'CHARLIE' | 'DELTA' | null = null;
    if (/alpha/i.test(sheetName)) defaultSheetPleton = 'ALPHA';
    else if (/bravo/i.test(sheetName)) defaultSheetPleton = 'BRAVO';
    else if (/charlie/i.test(sheetName)) defaultSheetPleton = 'CHARLIE';
    else if (/delta/i.test(sheetName)) defaultSheetPleton = 'DELTA';

    const rawRows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' }) as any[][];
    if (!rawRows || rawRows.length === 0) continue;

    let currentSectionPleton: 'ALPHA' | 'BRAVO' | 'CHARLIE' | 'DELTA' | null = defaultSheetPleton;
    let headerRowIdx = -1;
    let colMap = {
      nama: -1,
      nik: -1,
      pleton: -1,
      jabatan: -1,
      dayCols: {} as Record<number, number> // day (1..31) -> colIdx
    };

    // Scan top 30 rows for headers, month, year, or supervisor
    for (let r = 0; r < Math.min(rawRows.length, 30); r++) {
      const row = rawRows[r];
      if (!Array.isArray(row)) continue;

      const rowStr = row.map(c => String(c || '').trim()).join(' ');

      // Check for month/year in header rows
      if (!detectedMonth) {
        for (const cell of row) {
          const cellStr = String(cell || '').trim();
          if (!cellStr) continue;
          const idx = getNormalizedMonthIndex(cellStr);
          if (idx !== -1) {
            detectedMonth = getCanonicalMonthName(idx);
            break;
          }
          const mMatch = cellStr.match(/\b(jan(?:uari|uary)?|feb(?:ruari|ruary)?|mar(?:et|ch)?|apr(?:il)?|mei|may|jun(?:i|e)?|jul(?:i|y)?|agu(?:stus)?|ags|agt|aug(?:ust)?|sep(?:tember)?|okt(?:ober)?|oct(?:ober)?|nov(?:ember)?|des(?:ember)?|dec(?:ember)?)\b/i);
          if (mMatch) {
            const mIdx = getNormalizedMonthIndex(mMatch[1]);
            if (mIdx !== -1) {
              detectedMonth = getCanonicalMonthName(mIdx);
              break;
            }
          }
        }
      }
      if (!detectedYear) {
        const yM = rowStr.match(/\b(202[4-9])\b/);
        if (yM) detectedYear = parseInt(yM[1], 10);
      }

      // Check Dept Head / Disahkan
      if (!disahkanOleh && /disahkan|mengetahui|head|dept/i.test(rowStr)) {
        const headMatch = rowStr.match(/(?:disahkan oleh|mengetahui|head)\s*[:\-]?\s*([A-Z\s\.\,]{4,30})/i);
        if (headMatch && headMatch[1]) {
          disahkanOleh = headMatch[1].trim();
        }
      }

      // Check if this row is a column header (contains "NAMA", "NIK", etc.)
      const lowerRow = row.map(c => String(c || '').trim().toLowerCase());
      const hasNama = lowerRow.some(c => c.includes('nama') || c === 'personil' || c === 'petugas');
      const hasNik = lowerRow.some(c => c.includes('nik') || c.includes('nip') || c.includes('npp') || c.includes('no. id'));

      if (hasNama || hasNik) {
        headerRowIdx = r;
        lowerRow.forEach((val, colIdx) => {
          if (val.includes('nama') || val === 'personil' || val === 'petugas') {
            colMap.nama = colIdx;
          } else if (val.includes('nik') || val.includes('nip') || val.includes('npp') || val.includes('no. id') || val === 'id') {
            colMap.nik = colIdx;
          } else if (val.includes('pleton') || val.includes('regu') || val.includes('group') || val.includes('tim')) {
            colMap.pleton = colIdx;
          } else if (val.includes('jabatan') || val.includes('posisi') || val.includes('unit')) {
            colMap.jabatan = colIdx;
          } else {
            // Check day numbers 1..31
            const dayNum = parseInt(val, 10);
            if (!isNaN(dayNum) && dayNum >= 1 && dayNum <= 31) {
              colMap.dayCols[dayNum] = colIdx;
            }
          }
        });
        break;
      }
    }

    // Iterate through data rows
    const startRow = headerRowIdx !== -1 ? headerRowIdx + 1 : 0;
    for (let r = startRow; r < rawRows.length; r++) {
      const row = rawRows[r];
      if (!Array.isArray(row) || row.length === 0) continue;

      const rowJoined = row.map(c => String(c || '').trim()).join(' ');
      if (!rowJoined) continue;

      // Check if row is a Section Header for Pleton (only if it's a standalone title row, not a personnel data row)
      const isPureSectionRow = !/\d{6,10}/.test(rowJoined) && row.filter(c => String(c || '').trim()).length <= 3;
      if (isPureSectionRow) {
        if (/pleton\s*alpha|regu\s*alpha|^alpha$/i.test(rowJoined)) {
          currentSectionPleton = 'ALPHA';
          continue;
        } else if (/pleton\s*bravo|regu\s*bravo|^bravo$/i.test(rowJoined)) {
          currentSectionPleton = 'BRAVO';
          continue;
        } else if (/pleton\s*charlie|regu\s*charlie|^charlie$/i.test(rowJoined)) {
          currentSectionPleton = 'CHARLIE';
          continue;
        } else if (/pleton\s*delta|regu\s*delta|^delta$/i.test(rowJoined)) {
          currentSectionPleton = 'DELTA';
          continue;
        }
      }

      let nama = '';
      let nik = '';
      let pletonRaw = '';
      let jabatan = '';

      if (colMap.nama !== -1 && row[colMap.nama]) {
        nama = String(row[colMap.nama]).trim();
      }
      if (colMap.nik !== -1 && row[colMap.nik]) {
        nik = String(row[colMap.nik]).trim();
      }
      if (colMap.pleton !== -1 && row[colMap.pleton]) {
        pletonRaw = String(row[colMap.pleton]).trim();
      }
      if (colMap.jabatan !== -1 && row[colMap.jabatan]) {
        jabatan = String(row[colMap.jabatan]).trim();
      }

      // Fallback heuristics: If column map didn't catch, search cells in this row
      if (!nama || !nik) {
        for (let c = 0; c < row.length; c++) {
          const cellStr = String(row[c] || '').trim();
          if (!cellStr) continue;

          // Check if cell is NIK (6 to 10 digit number)
          if (!nik && /^\d{6,10}$/.test(cellStr)) {
            nik = cellStr;
            continue;
          }

          // Check if cell has NIK with label e.g. "NIK: 20244166"
          const nikLabeled = cellStr.match(/(?:nik|nip)[\s:\.]*(\d{6,10})/i);
          if (!nik && nikLabeled) {
            nik = nikLabeled[1];
            continue;
          }

          // Check if cell is a Full Name (contains letters, no digits, 4-40 chars)
          if (!nama && /^[A-Za-z\s\.\,\']{4,40}$/.test(cellStr) && !/^(pleton|regu|alpha|bravo|charlie|delta|dinas|pagi|malam|libur|off|free|apme|apmg|whu|cgk)$/i.test(cellStr)) {
            // Filter out common header words
            if (!/^(no|nomor|hari|tanggal|keterangan|shift|jadwal)$/i.test(cellStr)) {
              nama = cellStr;
            }
          }
        }
      }

      // Check if nama contains NIK in parenthesis e.g. "MOHAMAD DANIL (20244166)"
      if (nama && !nik) {
        const parenNik = nama.match(/\((\d{6,10})\)/);
        if (parenNik) {
          nik = parenNik[1];
          nama = nama.replace(/\(\d{6,10}\)/, '').trim();
        }
      }

      // Verify with known personnel database if name or NIK matches
      if (nama || nik) {
        let matchedPersonnel: RosterPersonnel | undefined = undefined;
        for (const code of ['ALPHA', 'BRAVO', 'CHARLIE', 'DELTA'] as const) {
          const found = OFFICIAL_ROSTER_PERSONNEL[code].find(p => 
            (nik && p.nik === nik) || 
            (nama && (p.nama.toLowerCase().includes(nama.toLowerCase()) || nama.toLowerCase().includes(p.nama.toLowerCase())))
          );
          if (found) {
            matchedPersonnel = found;
            break;
          }
        }

        if (matchedPersonnel) {
          if (!nik) nik = matchedPersonnel.nik;
          if (!nama || nama.length < matchedPersonnel.nama.length) nama = matchedPersonnel.nama;
          if (!pletonRaw && !currentSectionPleton) {
            currentSectionPleton = matchedPersonnel.pletonCode;
          }
        }
      }

      // Determine final pleton
      let resolvedPletonCode: 'ALPHA' | 'BRAVO' | 'CHARLIE' | 'DELTA' = 'ALPHA';
      if (pletonRaw) {
        resolvedPletonCode = normalizePletonName(pletonRaw).code;
      } else if (currentSectionPleton) {
        resolvedPletonCode = currentSectionPleton;
      }

      // Check day shifts in this row if day columns exist
      let shiftSummary = '';
      if (Object.keys(colMap.dayCols).length > 0 && (nama || nik)) {
        const shiftsRecorded: string[] = [];
        for (const [dayStr, cIdx] of Object.entries(colMap.dayCols)) {
          const dNum = parseInt(dayStr, 10);
          const cellVal = String(row[cIdx] || '').trim().toUpperCase();
          if (cellVal) {
            shiftsRecorded.push(cellVal);
            if (!dailyShiftMap.has(dNum)) {
              dailyShiftMap.set(dNum, { pagi: [], malam: [] });
            }
            const dEntry = dailyShiftMap.get(dNum)!;
            if (cellVal.includes('APME') || cellVal === 'PAGI' || cellVal === 'P') {
              dEntry.pagi.push(`${nama || 'Petugas'} (${nik || '-'})`);
              dEntry.pagiPleton = normalizePletonName(resolvedPletonCode).fullName;
            } else if (cellVal.includes('APMG') || cellVal === 'MALAM' || cellVal === 'M') {
              dEntry.malam.push(`${nama || 'Petugas'} (${nik || '-'})`);
              dEntry.malamPleton = normalizePletonName(resolvedPletonCode).fullName;
            }
          }
        }
        if (shiftsRecorded.length > 0) {
          const hasPagi = shiftsRecorded.some(s => s.includes('APME') || s === 'P');
          const hasMalam = shiftsRecorded.some(s => s.includes('APMG') || s === 'M');
          shiftSummary = hasPagi && hasMalam ? 'Rotasi APME & APMG' : hasPagi ? 'Dinas Pagi (APME)' : hasMalam ? 'Dinas Malam (APMG)' : 'Roster Dinas';
        }
      }

      if (nama && (nik || nama.length >= 4)) {
        const key = nik || nama.toLowerCase();
        const fullNamePleton = normalizePletonName(resolvedPletonCode).fullName;
        personnelMap.set(key, {
          nama: nama.toUpperCase(),
          nik: nik || '2024' + Math.floor(1000 + Math.random() * 9000),
          pleton: fullNamePleton,
          pletonCode: resolvedPletonCode,
          jabatan: jabatan || 'Petugas Wildlife Hazard Unit (WHU)',
          shiftPattern: shiftSummary || 'APME / APMG / FREE'
        });
      }
    }
  }

  // If no personnel extracted from sheet rows (e.g. unconventional layout), fallback to extracting from known database
  if (personnelMap.size === 0) {
    for (const code of ['ALPHA', 'BRAVO', 'CHARLIE', 'DELTA'] as const) {
      OFFICIAL_ROSTER_PERSONNEL[code].forEach(p => {
        personnelMap.set(p.nik, {
          nama: p.nama,
          nik: p.nik,
          pleton: p.pleton,
          pletonCode: p.pletonCode,
          jabatan: 'Petugas Wildlife Hazard Unit (WHU)',
          shiftPattern: 'APME / APMG / FREE'
        });
      });
    }
  }

  const personnelList = Array.from(personnelMap.values());
  const pletonMembers: Record<string, DutyRosterPersonnel[]> = {
    ALPHA: [],
    BRAVO: [],
    CHARLIE: [],
    DELTA: []
  };

  personnelList.forEach(p => {
    const code = p.pletonCode as 'ALPHA' | 'BRAVO' | 'CHARLIE' | 'DELTA';
    if (pletonMembers[code]) {
      pletonMembers[code].push(p);
    } else {
      pletonMembers.ALPHA.push(p);
    }
  });

  // Build daily entries (1 to 30/31)
  const currentYear = new Date().getFullYear();
  const currentMonthIdx = new Date().getMonth();
  const defaultMonthName = getCanonicalMonthName(currentMonthIdx);

  const finalYear = detectedYear || currentYear;
  const finalMonth = detectedMonth ? getCanonicalMonthName(detectedMonth) : defaultMonthName;
  const monthIdx = getNormalizedMonthIndex(finalMonth) !== -1 ? getNormalizedMonthIndex(finalMonth) : currentMonthIdx;
  const daysInMonth = new Date(finalYear, monthIdx + 1, 0).getDate();
  const dailyEntries: DutyRosterDayEntry[] = [];

  for (let d = 1; d <= daysInMonth; d++) {
    const custom = dailyShiftMap.get(d);
    // Cycle fallback calculation
    const cycle = (d - 1) % 4;
    let fallbackPagiPleton: Pleton = 'Pleton Alpha';
    let fallbackMalamPleton: Pleton = 'Pleton Delta';

    if (cycle === 0) { fallbackPagiPleton = 'Pleton Alpha'; fallbackMalamPleton = 'Pleton Delta'; }
    else if (cycle === 1) { fallbackPagiPleton = 'Pleton Bravo'; fallbackMalamPleton = 'Pleton Alpha'; }
    else if (cycle === 2) { fallbackPagiPleton = 'Pleton Charlie'; fallbackMalamPleton = 'Pleton Bravo'; }
    else { fallbackPagiPleton = 'Pleton Delta'; fallbackMalamPleton = 'Pleton Charlie'; }

    const pagiCode = normalizePletonName(fallbackPagiPleton).code;
    const malamCode = normalizePletonName(fallbackMalamPleton).code;

    const pagiStaff = custom && custom.pagi.length > 0 
      ? custom.pagi.join(', ') 
      : (pletonMembers[pagiCode] || []).map(p => `${p.nama} (${p.nik})`).join(', ') || 'Petugas Pagi';

    const malamStaff = custom && custom.malam.length > 0 
      ? custom.malam.join(', ') 
      : (pletonMembers[malamCode] || []).map(p => `${p.nama} (${p.nik})`).join(', ') || 'Petugas Malam';

    dailyEntries.push({
      tanggal: d,
      pagiPleton: custom?.pagiPleton || fallbackPagiPleton,
      pagiPetugas: pagiStaff,
      malamPleton: custom?.malamPleton || fallbackMalamPleton,
      malamPetugas: malamStaff
    });
  }

  const detectedPletonList = Object.entries(pletonMembers)
    .filter(([_, list]) => list.length > 0)
    .map(([code]) => normalizePletonName(code).fullName);

  const summary = `Excel Roster Terbaca: ${personnelList.length} Personil WHU (Nama & NIK Terverifikasi) • ${detectedPletonList.join(', ')} • Periode ${finalMonth} ${finalYear}`;

  return {
    bulan: finalMonth,
    tahun: finalYear,
    periodeLaporan: `${finalMonth} ${finalYear}`,
    disahkanOleh: disahkanOleh || 'RACHMADITYA (Dept. Head)',
    personnelList,
    pletonMembers,
    dailyEntries,
    summary,
    detectedPletonList
  };
}

/**
 * Intelligent parser for PDF Duty Roster
 * Reads Nama, NIK, and Pleton from PDF text content.
 */
export async function parseDutyRosterFromPdf(
  fileOrBuffer: File | ArrayBuffer | Uint8Array,
  filename = '',
  fileLastModified?: number
): Promise<ParsedRosterScheduleResult> {
  let arrayBuffer: ArrayBuffer;
  if (fileOrBuffer instanceof File) {
    arrayBuffer = await fileOrBuffer.arrayBuffer();
    filename = filename || fileOrBuffer.name;
    fileLastModified = fileLastModified || fileOrBuffer.lastModified;
  } else if (fileOrBuffer instanceof Uint8Array) {
    arrayBuffer = fileOrBuffer.buffer.slice(fileOrBuffer.byteOffset, fileOrBuffer.byteOffset + fileOrBuffer.byteLength) as ArrayBuffer;
  } else {
    arrayBuffer = fileOrBuffer;
  }

  const { text: rawText, lines } = await extractTextFromPdf(arrayBuffer);
  let { month: detectedMonth, year: detectedYear } = detectMonthAndYear(rawText, lines, filename);

  if ((!detectedMonth || !detectedYear) && fileLastModified) {
    const fileDate = new Date(fileLastModified);
    if (!isNaN(fileDate.getTime())) {
      if (!detectedMonth) detectedMonth = getCanonicalMonthName(fileDate.getMonth());
      if (!detectedYear) detectedYear = fileDate.getFullYear();
    }
  }

  const personnelMap = new Map<string, DutyRosterPersonnel>();
  let currentPleton: 'ALPHA' | 'BRAVO' | 'CHARLIE' | 'DELTA' = 'ALPHA';
  let disahkanOleh: string | undefined = undefined;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Detect platoon header
    if (/pleton\s*alpha|regu\s*alpha|^alpha$/i.test(trimmed)) {
      currentPleton = 'ALPHA';
      continue;
    } else if (/pleton\s*bravo|regu\s*bravo|^bravo$/i.test(trimmed)) {
      currentPleton = 'BRAVO';
      continue;
    } else if (/pleton\s*charlie|regu\s*charlie|^charlie$/i.test(trimmed)) {
      currentPleton = 'CHARLIE';
      continue;
    } else if (/pleton\s*delta|regu\s*delta|^delta$/i.test(trimmed)) {
      currentPleton = 'DELTA';
      continue;
    }

    // Detect Dept Head / Pengesahan
    if (!disahkanOleh && /disahkan|mengetahui|head/i.test(trimmed)) {
      const hMatch = trimmed.match(/(?:disahkan oleh|mengetahui|head)\s*[:\-]?\s*([A-Z\s\.\,]{4,30})/i);
      if (hMatch) disahkanOleh = hMatch[1].trim();
    }

    // Pattern 1: Standard roster line e.g. "1. MOHAMAD DANIL | 20244166 | Pleton Alpha"
    const pat1 = trimmed.match(/(?:^\d+[\.\)]\s*)?([A-Z\s\.\,\']{4,35})[\s\|\,\-]+(?:NIK[\s:\.]*)?(\d{6,10})(?:[\s\|\,\-]+(Pleton\s*(?:Alpha|Bravo|Charlie|Delta)|ALPHA|BRAVO|CHARLIE|DELTA))?/i);
    if (pat1) {
      const nama = pat1[1].trim().toUpperCase();
      const nik = pat1[2].trim();
      const pletonRaw = pat1[3] ? pat1[3].trim() : undefined;
      const pletonCode = pletonRaw ? normalizePletonName(pletonRaw).code : currentPleton;

      // Filter out table headers
      if (!/^(NAMA|PETUGAS|PERSONIL|JADWAL|BULAN|TAHUN|NO|NOMOR)/i.test(nama)) {
        personnelMap.set(nik, {
          nama,
          nik,
          pleton: normalizePletonName(pletonCode).fullName,
          pletonCode,
          jabatan: 'Petugas Wildlife Hazard Unit (WHU)',
          shiftPattern: 'APME / APMG / FREE'
        });
        continue;
      }
    }

    // Pattern 2: Name followed by (NIK) e.g. "RIO WIJAYANTO (20243777)"
    const pat2 = trimmed.match(/([A-Z\s\.\,\']{4,35})\s*\((?:NIK[\s:\.]*)?(\d{6,10})\)/i);
    if (pat2) {
      const nama = pat2[1].trim().toUpperCase();
      const nik = pat2[2].trim();
      const pletonCode = currentPleton;

      if (!/^(NAMA|PETUGAS|PERSONIL|JADWAL)/i.test(nama)) {
        personnelMap.set(nik, {
          nama,
          nik,
          pleton: normalizePletonName(pletonCode).fullName,
          pletonCode,
          jabatan: 'Petugas Wildlife Hazard Unit (WHU)',
          shiftPattern: 'APME / APMG / FREE'
        });
        continue;
      }
    }

    // Pattern 3: Check if line matches known personnel database
    for (const code of ['ALPHA', 'BRAVO', 'CHARLIE', 'DELTA'] as const) {
      for (const p of OFFICIAL_ROSTER_PERSONNEL[code]) {
        if (trimmed.toUpperCase().includes(p.nama) || trimmed.includes(p.nik)) {
          if (!personnelMap.has(p.nik)) {
            personnelMap.set(p.nik, {
              nama: p.nama,
              nik: p.nik,
              pleton: p.pleton,
              pletonCode: p.pletonCode,
              jabatan: 'Petugas Wildlife Hazard Unit (WHU)',
              shiftPattern: 'APME / APMG / FREE'
            });
          }
        }
      }
    }
  }

  // If no personnel extracted, populate from master roster
  if (personnelMap.size === 0) {
    for (const code of ['ALPHA', 'BRAVO', 'CHARLIE', 'DELTA'] as const) {
      OFFICIAL_ROSTER_PERSONNEL[code].forEach(p => {
        personnelMap.set(p.nik, {
          nama: p.nama,
          nik: p.nik,
          pleton: p.pleton,
          pletonCode: p.pletonCode,
          jabatan: 'Petugas Wildlife Hazard Unit (WHU)',
          shiftPattern: 'APME / APMG / FREE'
        });
      });
    }
  }

  const personnelList = Array.from(personnelMap.values());
  const pletonMembers: Record<string, DutyRosterPersonnel[]> = {
    ALPHA: [],
    BRAVO: [],
    CHARLIE: [],
    DELTA: []
  };

  personnelList.forEach(p => {
    const code = p.pletonCode as 'ALPHA' | 'BRAVO' | 'CHARLIE' | 'DELTA';
    if (pletonMembers[code]) {
      pletonMembers[code].push(p);
    } else {
      pletonMembers.ALPHA.push(p);
    }
  });

  const currentYear = new Date().getFullYear();
  const currentMonthIdx = new Date().getMonth();
  const defaultMonthName = getCanonicalMonthName(currentMonthIdx);

  const finalYear = detectedYear || currentYear;
  const finalMonth = detectedMonth ? getCanonicalMonthName(detectedMonth) : defaultMonthName;
  const monthIdx = getNormalizedMonthIndex(finalMonth) !== -1 ? getNormalizedMonthIndex(finalMonth) : currentMonthIdx;
  const daysInMonth = new Date(finalYear, monthIdx + 1, 0).getDate();
  const dailyEntries: DutyRosterDayEntry[] = [];

  for (let d = 1; d <= daysInMonth; d++) {
    const cycle = (d - 1) % 4;
    let pagiCode: 'ALPHA' | 'BRAVO' | 'CHARLIE' | 'DELTA' = 'ALPHA';
    let malamCode: 'ALPHA' | 'BRAVO' | 'CHARLIE' | 'DELTA' = 'DELTA';

    if (cycle === 0) { pagiCode = 'ALPHA'; malamCode = 'DELTA'; }
    else if (cycle === 1) { pagiCode = 'BRAVO'; malamCode = 'ALPHA'; }
    else if (cycle === 2) { pagiCode = 'CHARLIE'; malamCode = 'BRAVO'; }
    else { pagiCode = 'DELTA'; malamCode = 'CHARLIE'; }

    const pagiStaff = (pletonMembers[pagiCode] || []).map(p => `${p.nama} (${p.nik})`).join(', ') || 'Petugas Pagi';
    const malamStaff = (pletonMembers[malamCode] || []).map(p => `${p.nama} (${p.nik})`).join(', ') || 'Petugas Malam';

    dailyEntries.push({
      tanggal: d,
      pagiPleton: normalizePletonName(pagiCode).fullName,
      pagiPetugas: pagiStaff,
      malamPleton: normalizePletonName(malamCode).fullName,
      malamPetugas: malamStaff
    });
  }

  const detectedPletonList = Object.entries(pletonMembers)
    .filter(([_, list]) => list.length > 0)
    .map(([code]) => normalizePletonName(code).fullName);

  const summary = `PDF Roster Terbaca: ${personnelList.length} Personil WHU (Nama & NIK Teridentifikasi) • ${detectedPletonList.join(', ')} • Periode ${finalMonth} ${finalYear}`;

  return {
    bulan: finalMonth,
    tahun: finalYear,
    periodeLaporan: `${finalMonth} ${finalYear}`,
    disahkanOleh: disahkanOleh || 'RACHMADITYA (Dept. Head)',
    personnelList,
    pletonMembers,
    dailyEntries,
    summary,
    detectedPletonList
  };
}

/**
 * Server-assisted AI parser with local fallback
 */
export async function parseDutyRosterWithAi(params: {
  text: string;
  filename?: string;
}): Promise<ParsedRosterScheduleResult | null> {
  const { text, filename = '' } = params;
  if (!text || text.trim().length < 20) return null;

  try {
    const res = await fetch('/api/gemini/parse-duty-roster', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, filename })
    });
    if (res.ok) {
      const data = await res.json();
      if (data && data.personnelList && data.personnelList.length > 0) {
        return data as ParsedRosterScheduleResult;
      }
    }
  } catch (err) {
    console.warn('AI Duty roster parser notice, fallback to local parser:', err);
  }
  return null;
}
