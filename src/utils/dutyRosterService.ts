/**
 * Roster & Shift Schedule Service based on Official Document:
 * "JADWAL DINAS WILDLIFE HAZARD - CGK BULAN OKTOBER 2026"
 * Disahkan oleh: RACHMADITYA (Wildlife Hazard Department Head)
 * 
 * Shift Codes:
 * - APME: 08:00 - 20:00 WIB (Dinas Pagi)
 * - APMG: 20:00 - 08:00 WIB (Dinas Malam)
 * - FREE: LIBUR
 */

import { Pleton, Dinas } from '../types';
import { parseIndonesianDateToYYYYMMDD, getTodayDateString } from './dateUtils';
import { OFFICIAL_OCTOBER_DAILY_ENTRIES } from '../data/officialOctoberRoster';

export interface RosterPersonnel {
  nama: string;
  nik: string;
  pleton: Pleton;
  pletonCode: 'ALPHA' | 'BRAVO' | 'CHARLIE' | 'DELTA';
}

/**
 * Official Personnel for October 2026:
 * Disahkan: RACHMADITYA (Wildlife Hazard Department Head) - Tangerang, 25 September 2026
 */
export const OFFICIAL_ROSTER_PERSONNEL: Record<'ALPHA' | 'BRAVO' | 'CHARLIE' | 'DELTA', RosterPersonnel[]> = {
  ALPHA: [
    { nama: 'NURJAYA', nik: '20242880', pleton: 'Pleton Alpha', pletonCode: 'ALPHA' },
    { nama: 'YUDISTIRA ADY P.', nik: '20245256', pleton: 'Pleton Alpha', pletonCode: 'ALPHA' }
  ],
  BRAVO: [
    { nama: 'MOHAMAD DANIL', nik: '20244166', pleton: 'Pleton Bravo', pletonCode: 'BRAVO' },
    { nama: 'RIO WIJAYANTO', nik: '20243777', pleton: 'Pleton Bravo', pletonCode: 'BRAVO' }
  ],
  CHARLIE: [
    { nama: 'YUDHA ABADI S.', nik: '20246882', pleton: 'Pleton Charlie', pletonCode: 'CHARLIE' },
    { nama: 'M. SYAFRIZAL L. TOBING', nik: '20245727', pleton: 'Pleton Charlie', pletonCode: 'CHARLIE' }
  ],
  DELTA: [
    { nama: 'KUKUH BRILIYANDHI', nik: '20242969', pleton: 'Pleton Delta', pletonCode: 'DELTA' },
    { nama: 'M. RIZKI ROMADHON S.', nik: '20245602', pleton: 'Pleton Delta', pletonCode: 'DELTA' }
  ]
};

// Active personnel cache that can be dynamically updated when a monthly roster is uploaded
const CUSTOM_PERSONNEL_STORAGE_KEY = 'whms_custom_roster_personnel';

let inMemoryCustomPersonnel: Record<'ALPHA' | 'BRAVO' | 'CHARLIE' | 'DELTA', RosterPersonnel[]> | null = null;

export function getActiveRosterPersonnel(): Record<'ALPHA' | 'BRAVO' | 'CHARLIE' | 'DELTA', RosterPersonnel[]> {
  if (inMemoryCustomPersonnel) {
    return inMemoryCustomPersonnel;
  }
  try {
    const raw = localStorage.getItem(CUSTOM_PERSONNEL_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.ALPHA && parsed.BRAVO && parsed.CHARLIE && parsed.DELTA) {
        inMemoryCustomPersonnel = parsed;
        return inMemoryCustomPersonnel!;
      }
    }
  } catch {}
  return OFFICIAL_ROSTER_PERSONNEL;
}

export function setActiveRosterPersonnel(custom: Record<'ALPHA' | 'BRAVO' | 'CHARLIE' | 'DELTA', RosterPersonnel[]>): void {
  inMemoryCustomPersonnel = custom;
  try {
    localStorage.setItem(CUSTOM_PERSONNEL_STORAGE_KEY, JSON.stringify(custom));
  } catch {}
}

export function resetToOfficialRosterPersonnel(): void {
  inMemoryCustomPersonnel = null;
  try {
    localStorage.removeItem(CUSTOM_PERSONNEL_STORAGE_KEY);
  } catch {}
}

// Anchor date: October 2, 2026 (Month 9 in 0-indexed JavaScript Date)
// Day 2: Pagi (APME) = ALPHA, Malam (APMG) = DELTA
const OCT_ANCHOR_DATE = new Date(2026, 9, 2);

export interface DayShiftInfo {
  dateStr: string; // YYYY-MM-DD
  dayNumber: number; // 1 - 31
  pagiPleton: Pleton;
  pagiPletonCode: 'ALPHA' | 'BRAVO' | 'CHARLIE' | 'DELTA';
  pagiPersonnel: RosterPersonnel[];
  malamPleton: Pleton;
  malamPletonCode: 'ALPHA' | 'BRAVO' | 'CHARLIE' | 'DELTA';
  malamPersonnel: RosterPersonnel[];
}

/**
 * Calculates the cycle index (0, 1, 2, 3) for October 2026 cycle.
 * Cycle Mapping:
 * - 0: Pagi = ALPHA, Malam = DELTA (with Rio Wijayanto backfill on Days 6, 14, 22, 30)
 * - 1: Pagi = BRAVO, Malam = ALPHA
 * - 2: Pagi = CHARLIE, Malam = BRAVO
 * - 3: Pagi = DELTA, Malam = CHARLIE
 */
export function getCycleIndexForDate(date: Date): number {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffTime = d.getTime() - OCT_ANCHOR_DATE.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
  return ((diffDays % 4) + 4) % 4;
}

/**
 * Returns the full shift allocation for any date based on the official October 2026 roster.
 */
export function getRosterForDate(dateInput: Date | string): DayShiftInfo {
  let dateObj: Date;

  if (typeof dateInput === 'string') {
    const parsed = parseIndonesianDateToYYYYMMDD(dateInput);
    if (parsed) {
      const parts = parsed.split('-').map(Number);
      dateObj = new Date(parts[0], parts[1] - 1, parts[2]);
    } else {
      dateObj = new Date();
    }
  } else {
    dateObj = new Date(dateInput.getFullYear(), dateInput.getMonth(), dateInput.getDate());
  }

  const dayNumber = dateObj.getDate();
  const year = dateObj.getFullYear();
  const month = dateObj.getMonth(); // 9 = October in JS (0-indexed)

  const padYear = dateObj.getFullYear();
  const padMonth = String(dateObj.getMonth() + 1).padStart(2, '0');
  const padDay = String(dateObj.getDate()).padStart(2, '0');
  const dateStr = `${padYear}-${padMonth}-${padDay}`;

  // If in October 2026, use official verified schedule table entries
  if (year === 2026 && month === 9) {
    const exactEntry = OFFICIAL_OCTOBER_DAILY_ENTRIES.find(e => e.tanggal === dayNumber);
    if (exactEntry) {
      const parsePersonnelList = (str: string, defaultCode: 'ALPHA' | 'BRAVO' | 'CHARLIE' | 'DELTA'): RosterPersonnel[] => {
        return str.split(',').map(item => {
          const trimmed = item.trim();
          const match = trimmed.match(/^(.*?)\s*\((\d+)\)$/);
          const nama = match ? match[1].trim() : trimmed;
          const nik = match ? match[2].trim() : '';
          
          let pletonCode = defaultCode;
          if (nama === 'RIO WIJAYANTO') pletonCode = 'BRAVO';
          else if (nama === 'NURJAYA' || nama.includes('YUDISTIRA')) pletonCode = 'ALPHA';
          else if (nama.includes('DANIL')) pletonCode = 'BRAVO';
          else if (nama.includes('YUDHA') || nama.includes('SYAFRIZAL')) pletonCode = 'CHARLIE';
          else if (nama.includes('KUKUH') || nama.includes('RIZKI')) pletonCode = 'DELTA';

          const formatPleton = (c: 'ALPHA' | 'BRAVO' | 'CHARLIE' | 'DELTA'): Pleton => {
            switch (c) {
              case 'ALPHA': return 'Pleton Alpha';
              case 'BRAVO': return 'Pleton Bravo';
              case 'CHARLIE': return 'Pleton Charlie';
              case 'DELTA': return 'Pleton Delta';
            }
          };

          return {
            nama,
            nik,
            pleton: formatPleton(pletonCode),
            pletonCode
          };
        });
      };

      const pagiCode = (exactEntry.pagiPleton.includes('Alpha') ? 'ALPHA' :
                        exactEntry.pagiPleton.includes('Bravo') ? 'BRAVO' :
                        exactEntry.pagiPleton.includes('Charlie') ? 'CHARLIE' : 'DELTA') as 'ALPHA' | 'BRAVO' | 'CHARLIE' | 'DELTA';

      const malamCode = (exactEntry.malamPleton.includes('Alpha') ? 'ALPHA' :
                         exactEntry.malamPleton.includes('Bravo') ? 'BRAVO' :
                         exactEntry.malamPleton.includes('Charlie') ? 'CHARLIE' : 'DELTA') as 'ALPHA' | 'BRAVO' | 'CHARLIE' | 'DELTA';

      return {
        dateStr,
        dayNumber,
        pagiPleton: exactEntry.pagiPleton as Pleton,
        pagiPletonCode: pagiCode,
        pagiPersonnel: parsePersonnelList(exactEntry.pagiPetugas, pagiCode),
        malamPleton: exactEntry.malamPleton as Pleton,
        malamPletonCode: malamCode,
        malamPersonnel: parsePersonnelList(exactEntry.malamPetugas, malamCode)
      };
    }
  }

  // General rotation calculation for other months
  const cycleIndex = getCycleIndexForDate(dateObj);

  let pagiCode: 'ALPHA' | 'BRAVO' | 'CHARLIE' | 'DELTA';
  let malamCode: 'ALPHA' | 'BRAVO' | 'CHARLIE' | 'DELTA';

  switch (cycleIndex) {
    case 0:
      pagiCode = 'ALPHA';
      malamCode = 'DELTA';
      break;
    case 1:
      pagiCode = 'BRAVO';
      malamCode = 'ALPHA';
      break;
    case 2:
      pagiCode = 'CHARLIE';
      malamCode = 'BRAVO';
      break;
    case 3:
    default:
      pagiCode = 'DELTA';
      malamCode = 'CHARLIE';
      break;
  }

  const personnelSource = getActiveRosterPersonnel();
  const pagiPersonnel = [...(personnelSource[pagiCode] || OFFICIAL_ROSTER_PERSONNEL[pagiCode])];
  const malamPersonnel = [...(personnelSource[malamCode] || OFFICIAL_ROSTER_PERSONNEL[malamCode])];

  const formatPletonName = (code: 'ALPHA' | 'BRAVO' | 'CHARLIE' | 'DELTA'): Pleton => {
    switch (code) {
      case 'ALPHA': return 'Pleton Alpha';
      case 'BRAVO': return 'Pleton Bravo';
      case 'CHARLIE': return 'Pleton Charlie';
      case 'DELTA': return 'Pleton Delta';
    }
  };

  return {
    dateStr,
    dayNumber,
    pagiPleton: formatPletonName(pagiCode),
    pagiPletonCode: pagiCode,
    pagiPersonnel,
    malamPleton: formatPletonName(malamCode),
    malamPletonCode: malamCode,
    malamPersonnel
  };
}

/**
 * Determines whether a time string or hour is Dinas Pagi or Dinas Malam:
 * - APME (Dinas Pagi): 08:00 s/d 19:59
 * - APMG (Dinas Malam): 20:00 s/d 07:59
 */
export function determineShiftByTime(timeOrHour?: string | number): 'PAGI' | 'MALAM' {
  let hour: number;

  if (typeof timeOrHour === 'number') {
    hour = timeOrHour;
  } else if (typeof timeOrHour === 'string') {
    const match = timeOrHour.match(/(\d{1,2}):(\d{2})/);
    if (match) {
      hour = parseInt(match[1], 10);
    } else {
      hour = new Date().getHours();
    }
  } else {
    hour = new Date().getHours();
  }

  if (hour >= 8 && hour < 20) {
    return 'PAGI';
  } else {
    return 'MALAM';
  }
}

export interface ActiveDutyInfo {
  shiftType: 'PAGI' | 'MALAM';
  shiftCode?: string;
  dinas: Dinas;
  pleton: Pleton;
  pletonCode: 'ALPHA' | 'BRAVO' | 'CHARLIE' | 'DELTA';
  personnel: RosterPersonnel[];
  podFormattedList: string[];
  podSingleString: string;
  dayInfo: DayShiftInfo;
  isNightOvernight: boolean; // true if between 00:00 - 07:59 (continuing previous day's night shift)
}

/**
 * Automatically calculates the active shift and active platoon for any date & time.
 * If time is omitted, uses the current local time.
 */
export function getActiveDutyInfo(dateInput?: string | Date, timeInput?: string): ActiveDutyInfo {
  let dateObj: Date;

  if (dateInput instanceof Date) {
    dateObj = new Date(dateInput);
  } else if (typeof dateInput === 'string' && dateInput.trim()) {
    const parsed = parseIndonesianDateToYYYYMMDD(dateInput);
    if (parsed) {
      const parts = parsed.split('-').map(Number);
      dateObj = new Date(parts[0], parts[1] - 1, parts[2]);
    } else {
      dateObj = new Date();
    }
  } else {
    dateObj = new Date();
  }

  // Determine shift
  const shiftType = determineShiftByTime(timeInput);
  
  // Check if current hour is in the overnight portion (00:00 - 07:59)
  let hour: number;
  if (timeInput) {
    const match = timeInput.match(/(\d{1,2}):(\d{2})/);
    hour = match ? parseInt(match[1], 10) : new Date().getHours();
  } else {
    hour = new Date().getHours();
  }

  const isNightOvernight = hour >= 0 && hour < 8;

  // In airside operational practice:
  // If no date was explicitly set by user and it's 00:00 - 07:59, the active night shift
  // is the night shift of yesterday evening (e.g. shift started 20:00 yesterday).
  let targetDateForRoster = dateObj;
  if (!dateInput && isNightOvernight) {
    targetDateForRoster = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate() - 1);
  }

  const dayInfo = getRosterForDate(targetDateForRoster);

  const isPagi = shiftType === 'PAGI';
  const dinas: Dinas = isPagi ? 'Dinas Pagi (08:00 - 20:00)' : 'Dinas Malam (20:00 - 08:00)';
  const pleton: Pleton = isPagi ? dayInfo.pagiPleton : dayInfo.malamPleton;
  const pletonCode = isPagi ? dayInfo.pagiPletonCode : dayInfo.malamPletonCode;
  const personnel = isPagi ? dayInfo.pagiPersonnel : dayInfo.malamPersonnel;

  const podFormattedList = personnel.map(p => `${p.nama} (${p.nik})`);
  const podSingleString = podFormattedList.join(', ');

  return {
    shiftType,
    shiftCode: isPagi ? 'APME' : 'APMG',
    dinas,
    pleton,
    pletonCode,
    personnel,
    podFormattedList,
    podSingleString,
    dayInfo,
    isNightOvernight
  };
}

/**
 * Returns the entire month schedule for October 2026 (or any month)
 * to display in the interactive Roster Table modal.
 */
export function getMonthRosterList(year = 2026, month = 9): DayShiftInfo[] {
  const list: DayShiftInfo[] = [];
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  for (let d = 1; d <= daysInMonth; d++) {
    const curDate = new Date(year, month, d);
    list.push(getRosterForDate(curDate));
  }

  return list;
}

/**
 * Calculates the previous duty shift and platoon that hands over the duty/vehicle.
 * If current shift is PAGI, previous was MALAM (which started yesterday 20:00).
 * If current shift is MALAM, previous was PAGI (today 08:00 - 20:00).
 */
export function getPreviousDutyInfo(dateInput?: string | Date, timeInput?: string): ActiveDutyInfo {
  const current = getActiveDutyInfo(dateInput, timeInput);
  
  if (current.shiftType === 'PAGI') {
    let dateObj: Date;
    if (dateInput instanceof Date) {
      dateObj = new Date(dateInput);
    } else if (typeof dateInput === 'string' && dateInput.trim()) {
      const parsed = parseIndonesianDateToYYYYMMDD(dateInput);
      if (parsed) {
        const parts = parsed.split('-').map(Number);
        dateObj = new Date(parts[0], parts[1] - 1, parts[2]);
      } else {
        dateObj = new Date();
      }
    } else {
      dateObj = new Date();
    }
    const prevDate = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate() - 1);
    const dayInfo = getRosterForDate(prevDate);
    const shiftType = 'MALAM';
    const dinas: Dinas = 'Dinas Malam (20:00 - 08:00)';
    const pleton: Pleton = dayInfo.malamPleton;
    const pletonCode = dayInfo.malamPletonCode;
    const personnel = dayInfo.malamPersonnel;
    const podFormattedList = personnel.map(p => `${p.nama} (${p.nik})`);
    const podSingleString = podFormattedList.join(', ');
    return {
      shiftType,
      dinas,
      pleton,
      pletonCode,
      personnel,
      podFormattedList,
      podSingleString,
      dayInfo,
      isNightOvernight: false
    };
  } else {
    const dayInfo = current.dayInfo;
    const shiftType = 'PAGI';
    const dinas: Dinas = 'Dinas Pagi (08:00 - 20:00)';
    const pleton: Pleton = dayInfo.pagiPleton;
    const pletonCode = dayInfo.pagiPletonCode;
    const personnel = dayInfo.pagiPersonnel;
    const podFormattedList = personnel.map(p => `${p.nama} (${p.nik})`);
    const podSingleString = podFormattedList.join(', ');
    return {
      shiftType,
      dinas,
      pleton,
      pletonCode,
      personnel,
      podFormattedList,
      podSingleString,
      dayInfo,
      isNightOvernight: false
    };
  }
}
