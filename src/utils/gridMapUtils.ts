import { PatrolReport, OccurrenceReport, WildlifeStrikeReport } from '../types';

export const GRID_ROWS = ['A', 'B', 'C', 'D', 'E', 'F', 'G'] as const;
export const GRID_COLUMNS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14] as const;

export type GridRow = typeof GRID_ROWS[number];
export type GridColumn = typeof GRID_COLUMNS[number];

export interface GridCellInfo {
  code: string;
  row: GridRow;
  col: number;
  name: string;
  facility: string;
  nearestRunway: string;
  nearestArff: string;
}

// Aerodrome feature mapping based on official WIII / CGK Grid Map 2025
export function getGridCellInfo(cellCode: string): GridCellInfo {
  const row = cellCode.charAt(0).toUpperCase() as GridRow;
  const col = parseInt(cellCode.slice(1), 10);

  let name = `Sektor ${cellCode} - Area Airside`;
  let facility = 'Perimeter & Infield Airside';
  let nearestRunway = 'Infield';
  let nearestArff = 'ARFF Station 17 Main (± 1.2 km)';

  if (row === 'A') {
    nearestRunway = 'Runway 3 (06-24)';
    nearestArff = 'ARFF Station 17 North (± 800m)';
    if (col <= 3) name = `Sektor ${cellCode} - Threshold 06 & Perimeter Barat Laut`;
    else if (col <= 10) name = `Sektor ${cellCode} - Strip Sisi Utara Runway 3 (06-24)`;
    else name = `Sektor ${cellCode} - Threshold 24 & Perimeter Timur Laut`;
  } else if (row === 'B') {
    nearestRunway = 'Runway 3 (06-24) & TWY Zulu';
    nearestArff = col <= 7 ? 'ARFF Station 17 North (± 400m)' : 'ARFF Station 17 Main (± 1.0 km)';
    if (col >= 4 && col <= 6) facility = 'Pos Damkar ARFF 17 North & Taxiway Zulu';
    else if (col >= 3 && col <= 12) facility = 'Runway 3 Flexible 3000m × 60m';
  } else if (row === 'C') {
    nearestRunway = 'Runway 2 (07L-25R)';
    nearestArff = 'ARFF Station 17 Main (± 700m)';
    if (col <= 2) facility = 'DPPU Pertamina & Kolam Retensi Air Barat';
    else if (col <= 12) facility = 'Runway 2 Rigid 3660m × 60m & Rapid Exit TWY';
    else facility = 'Threshold 25R & Stopway Timur';
  } else if (row === 'D') {
    nearestRunway = 'Runway 2 (07L-25R) / Parallel TWY November';
    nearestArff = col >= 7 && col <= 9 ? 'ARFF Station 17 Main (Pusat / Standby)' : 'ARFF Station 17 Main';
    if (col >= 6 && col <= 9) facility = 'Tower JATSC (AirNav), AOCC & Terminal 2';
    else if (col >= 10 && col <= 13) facility = 'Terminal 3 East Pier & Apron Internasional';
    else if (col >= 13) facility = 'Kolam Retensi Air ARFF Timur';
  } else if (row === 'E') {
    nearestRunway = 'Parallel Taxiway Papa / Infield Central';
    nearestArff = 'ARFF Station 17 South (± 650m)';
    if (col >= 6 && col <= 9) facility = 'Terminal 1 (Domestik) & Apron Barat';
    else facility = 'Infield Rerumputan Central & Jalur Drainase';
  } else if (row === 'F') {
    nearestRunway = 'Runway 1 (07R-25L) Infield';
    nearestArff = col <= 6 ? 'ARFF Station 17 South (± 300m)' : 'ARFF Station 17 Main';
    if (col >= 4 && col <= 6) facility = 'Pos Damkar ARFF 17 South & Taxiway Alpha';
    else if (col >= 11 && col <= 13) facility = 'Cargo Terminal & Apron Kargo';
    else facility = 'Parallel Taxiway Papa South & Infield Runway 1';
  } else if (row === 'G') {
    nearestRunway = 'Runway 1 (07R-25L)';
    nearestArff = 'ARFF Station 17 South (± 500m)';
    if (col <= 3) facility = 'Threshold 07R & Approach Lights';
    else if (col <= 12) facility = 'Runway 1 Rigid 3600m × 60m';
    else facility = 'Threshold 25L & PAPI / Perimeter Selatan';
  }

  return {
    code: cellCode,
    row,
    col,
    name,
    facility,
    nearestRunway,
    nearestArff
  };
}

// Parses grid codes from free text or structured fields
export function extractGridCode(raw?: string, fallbackText?: string): string | null {
  const searchIn = `${raw || ''} ${fallbackText || ''}`.trim();
  if (!searchIn) return null;

  // Exact match pattern for Grid e.g. "C8", "Grid C8", "G-12", "C 8", "GRID E7"
  const match = searchIn.match(/\b([A-Ga-g])\s*[-_./\s]?\s*([1-9]|1[0-4])\b/i);
  if (match) {
    const row = match[1].toUpperCase();
    const col = parseInt(match[2], 10);
    if (GRID_ROWS.includes(row as any) && col >= 1 && col <= 14) {
      return `${row}${col}`;
    }
  }

  // Fallback intelligent location mapping based on aviation keywords
  const textLower = searchIn.toLowerCase();
  if (textLower.includes('07l') || textLower.includes('25r') || textLower.includes('rwy 2') || textLower.includes('runway 2')) {
    if (textLower.includes('threshold 07l') || textLower.includes('ujung barat')) return 'C3';
    if (textLower.includes('threshold 25r') || textLower.includes('ujung timur')) return 'C12';
    if (textLower.includes('c3') || textLower.includes('charlie')) return 'C8';
    return 'C8';
  }
  if (textLower.includes('07r') || textLower.includes('25l') || textLower.includes('rwy 1') || textLower.includes('runway 1')) {
    if (textLower.includes('threshold 07r') || textLower.includes('ujung barat')) return 'G3';
    if (textLower.includes('threshold 25l') || textLower.includes('ujung timur')) return 'G12';
    return 'G8';
  }
  if (textLower.includes('06-24') || textLower.includes('06/24') || textLower.includes('rwy 3') || textLower.includes('runway 3')) {
    if (textLower.includes('threshold 06')) return 'B3';
    if (textLower.includes('threshold 24')) return 'B11';
    return 'B7';
  }
  if (textLower.includes('terminal 3') || textLower.includes('t3')) return 'D11';
  if (textLower.includes('terminal 2') || textLower.includes('t2')) return 'D7';
  if (textLower.includes('terminal 1') || textLower.includes('t1')) return 'E7';
  if (textLower.includes('cargo') || textLower.includes('kargo')) return 'F12';
  if (textLower.includes('kolam') || textLower.includes('retensi') || textLower.includes('drainase')) return 'C2';
  if (textLower.includes('tower') || textLower.includes('airnav') || textLower.includes('aocc')) return 'D7';

  return null;
}

export interface CellIncidentAggregates {
  cellCode: string;
  strikes: WildlifeStrikeReport[];
  occurrences: OccurrenceReport[];
  patrols: PatrolReport[];
  totalIncidents: number;
  hasDamage: boolean;
  threatLevel: 'critical' | 'warning' | 'patrol' | 'normal';
}

// Aggregates all reports per 14x7 grid cell
export function aggregateGridIncidents(
  strikes: WildlifeStrikeReport[],
  occurrences: OccurrenceReport[],
  patrols: PatrolReport[]
): Map<string, CellIncidentAggregates> {
  const map = new Map<string, CellIncidentAggregates>();

  // Initialize all grid cells
  GRID_ROWS.forEach(r => {
    GRID_COLUMNS.forEach(c => {
      const code = `${r}${c}`;
      map.set(code, {
        cellCode: code,
        strikes: [],
        occurrences: [],
        patrols: [],
        totalIncidents: 0,
        hasDamage: false,
        threatLevel: 'normal'
      });
    });
  });

  // Assign Strikes
  strikes.forEach(s => {
    const code = extractGridCode(s.gridLocation, `${s.lokasi} ${s.runwayTaxiway}`) || 'C8';
    const entry = map.get(code) || {
      cellCode: code,
      strikes: [],
      occurrences: [],
      patrols: [],
      totalIncidents: 0,
      hasDamage: false,
      threatLevel: 'normal'
    };
    entry.strikes.push(s);
    entry.totalIncidents += 1;
    if (s.indikasiKerusakan === 'Ada') {
      entry.hasDamage = true;
    }
    entry.threatLevel = 'critical'; // Strike is top threat level
    map.set(code, entry);
  });

  // Assign Occurrences
  occurrences.forEach(o => {
    const code = extractGridCode(o.gridLocation, `${o.lokasi} ${o.runwayTaxiwayArea}`) || 'G12';
    const entry = map.get(code) || {
      cellCode: code,
      strikes: [],
      occurrences: [],
      patrols: [],
      totalIncidents: 0,
      hasDamage: false,
      threatLevel: 'normal'
    };
    entry.occurrences.push(o);
    entry.totalIncidents += 1;
    if (entry.threatLevel !== 'critical') {
      entry.threatLevel = 'warning';
    }
    map.set(code, entry);
  });

  // Assign Patrols
  patrols.forEach(p => {
    const code = extractGridCode(p.gridLocation, p.rutePatroli);
    if (code && map.has(code)) {
      const entry = map.get(code)!;
      entry.patrols.push(p);
      if (entry.threatLevel === 'normal') {
        entry.threatLevel = 'patrol';
      }
    }
  });

  return map;
}
