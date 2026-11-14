// Airside Geographic Features & Coordinates for Soekarno-Hatta International Airport (CGK / WIII)
import { 
  DEFAULT_AIRPORT_ARP, 
  calculateHaversineDistanceKm, 
  calculateBearingDegree, 
  getCardinalDirectionIndonesian 
} from './geoUtils';
import { GRID_ROWS, GRID_COLUMNS } from './gridMapUtils';

export interface AirsideFeature {
  id: string;
  name: string;
  category: 'runway' | 'taxiway' | 'apron' | 'perimeter' | 'water';
  coordinates: [number, number][]; // [lat, lng]
  description: string;
  color: string;
  lengthMeters?: number;
  trueBearingDeg?: number;
  headingText?: string;
  thresholds?: {
    startCode: string;
    startCoord: [number, number];
    endCode: string;
    endCoord: [number, number];
  };
}

// Major runways at CGK with official AIP Indonesia WIII AD 2.12 (AIRAC AMDT 151, berlaku 03 Okt 2024) threshold coordinates
export const CGK_RUNWAYS: AirsideFeature[] = [
  {
    id: 'rwy-07l-25r',
    name: 'Runway 07L / 25R (Runway 2 Utara)',
    category: 'runway',
    coordinates: [
      [-6.121017, 106.638825],
      [-6.108964, 106.669061]
    ],
    description: 'Runway Rigid 3,600m × 60m - Sisi Utara (Threshold 07L: -6.121017, 106.638825 | Threshold 25R: -6.108964, 106.669061 - AIP WIII AD 2.12)',
    color: '#0284c7',
    lengthMeters: 3600,
    trueBearingDeg: 68.3,
    headingText: '068° / 248° True',
    thresholds: {
      startCode: '07L',
      startCoord: [-6.121017, 106.638825],
      endCode: '25R',
      endCoord: [-6.108964, 106.669061]
    }
  },
  {
    id: 'rwy-07r-25l',
    name: 'Runway 07R / 25L (Runway 1 Selatan)',
    category: 'runway',
    coordinates: [
      [-6.142558, 106.643661],
      [-6.130303, 106.674394]
    ],
    description: 'Runway Rigid 3,660m × 60m - Sisi Selatan (Threshold 07R: -6.142558, 106.643661 | Threshold 25L: -6.130303, 106.674394 - AIP WIII AD 2.12)',
    color: '#0d9488',
    lengthMeters: 3660,
    trueBearingDeg: 68.3,
    headingText: '068° / 248° True',
    thresholds: {
      startCode: '07R',
      startCoord: [-6.142558, 106.643661],
      endCode: '25L',
      endCoord: [-6.130303, 106.674394]
    }
  },
  {
    id: 'rwy-06-24',
    name: 'Runway 06 / 24 (Runway 3)',
    category: 'runway',
    coordinates: [
      [-6.113886, 106.644592],
      [-6.103842, 106.669767]
    ],
    description: 'Runway Flexible 3,000m × 60m - Paling Utara (Threshold 06: -6.113886, 106.644592 | Threshold 24: -6.103842, 106.669767 - AIP WIII AD 2.12)',
    color: '#6366f1',
    lengthMeters: 3000,
    trueBearingDeg: 68.3,
    headingText: '068° / 248° True',
    thresholds: {
      startCode: '06',
      startCoord: [-6.113886, 106.644592],
      endCode: '24',
      endCoord: [-6.103842, 106.669767]
    }
  }
];

// Key taxiways & airside facilities
export const CGK_AIRSIDE_ZONES: AirsideFeature[] = [
  {
    id: 'twy-n',
    name: 'Taxiway November (Parallel RWY 2)',
    category: 'taxiway',
    coordinates: [
      [-6.1228, 106.6395],
      [-6.1107, 106.6685]
    ],
    description: 'Rapid exit taxiways NC1 - NC6, NP, N1-N7',
    color: '#f59e0b'
  },
  {
    id: 'twy-p',
    name: 'Taxiway Papa (Parallel RWY 1)',
    category: 'taxiway',
    coordinates: [
      [-6.1408, 106.6445],
      [-6.1285, 106.6735]
    ],
    description: 'Rapid exit taxiways SC1 - SC5, SP, P1-P7',
    color: '#f59e0b'
  },
  {
    id: 'apron-t1',
    name: 'Terminal 1 & Apron Barat',
    category: 'apron',
    coordinates: [
      [-6.1305, 106.6500],
      [-6.1320, 106.6550],
      [-6.1290, 106.6560],
      [-6.1280, 106.6510]
    ],
    description: 'Area Domestik Terminal 1 & Parking Stands 1A-1C',
    color: '#8b5cf6'
  },
  {
    id: 'apron-t2',
    name: 'Terminal 2 & Tower JATSC',
    category: 'apron',
    coordinates: [
      [-6.1265, 106.6520],
      [-6.1275, 106.6570],
      [-6.1245, 106.6580],
      [-6.1235, 106.6530]
    ],
    description: 'Terminal 2, Apron Sub-terminal 2D-2F, & ATC Tower AirNav',
    color: '#8b5cf6'
  },
  {
    id: 'apron-t3',
    name: 'Terminal 3 Ultimate & Apron Internasional',
    category: 'apron',
    coordinates: [
      [-6.1195, 106.6590],
      [-6.1220, 106.6660],
      [-6.1170, 106.6680],
      [-6.1155, 106.6620]
    ],
    description: 'Terminal 3 Pier Timur/Barat & Apron Remote',
    color: '#8b5cf6'
  },
  {
    id: 'water-pond-west',
    name: 'Kolam Retensi Barat (Water Retention)',
    category: 'water',
    coordinates: [
      [-6.1295, 106.6370],
      [-6.1310, 106.6395],
      [-6.1285, 106.6405],
      [-6.1275, 106.6380]
    ],
    description: 'Hotspot satwa air (Kuntul, Pecuk, Belibis) dekat DPPU',
    color: '#06b6d4'
  },
  {
    id: 'water-pond-east',
    name: 'Kolam Retensi Timur & Rawakucing',
    category: 'water',
    coordinates: [
      [-6.1210, 106.6730],
      [-6.1235, 106.6760],
      [-6.1200, 106.6775],
      [-6.1180, 106.6740]
    ],
    description: 'Area drainase timur, potensi perlintasan flyway burung',
    color: '#06b6d4'
  }
];

/**
 * Grid mapping to approximate real-world Lat/Lng bounds:
 * Rows A to G (North to South), Columns 1 to 14 (West to East)
 */
const CGK_BOUNDS = {
  north: -6.1010,
  south: -6.1460,
  west: 106.6350,
  east: 106.6780
};

export const getGridCellCoordinates = (gridCode: string): [number, number] => {
  const cleanCode = gridCode.trim().toUpperCase().replace(/[^A-G0-9]/g, '');
  const rowLetter = cleanCode.charAt(0);
  const colNum = parseInt(cleanCode.slice(1), 10);

  const rowIndex = GRID_ROWS.indexOf(rowLetter as any);
  if (rowIndex === -1 || isNaN(colNum) || colNum < 1 || colNum > 14) {
    return [DEFAULT_AIRPORT_ARP.latitude, DEFAULT_AIRPORT_ARP.longitude];
  }

  const latStep = (CGK_BOUNDS.north - CGK_BOUNDS.south) / 7;
  const lonStep = (CGK_BOUNDS.east - CGK_BOUNDS.west) / 14;

  // Center of cell
  const lat = CGK_BOUNDS.north - (rowIndex + 0.5) * latStep;
  const lon = CGK_BOUNDS.west + (colNum - 0.5) * lonStep;

  return [parseFloat(lat.toFixed(5)), parseFloat(lon.toFixed(5))];
};

/**
 * Identify closest Airside Zone, Runway, and Grid from Lat/Lng
 */
export const identifyLocationFromCoordinates = (lat: number, lon: number): {
  nearestZone: string;
  estimatedGrid: string;
  distanceFromArpKm: number;
  bearingDegree: number;
  cardinalDirection: string;
  isWithinAirsidePerimeter: boolean;
} => {
  const distArp = calculateHaversineDistanceKm(lat, lon, DEFAULT_AIRPORT_ARP.latitude, DEFAULT_AIRPORT_ARP.longitude);
  const bearing = calculateBearingDegree(DEFAULT_AIRPORT_ARP.latitude, DEFAULT_AIRPORT_ARP.longitude, lat, lon);
  const cardinal = getCardinalDirectionIndonesian(bearing);

  // Estimate grid
  const latStep = (CGK_BOUNDS.north - CGK_BOUNDS.south) / 7;
  const lonStep = (CGK_BOUNDS.east - CGK_BOUNDS.west) / 14;

  let rowIndex = Math.floor((CGK_BOUNDS.north - lat) / latStep);
  let colIndex = Math.floor((lon - CGK_BOUNDS.west) / lonStep) + 1;

  rowIndex = Math.max(0, Math.min(6, rowIndex));
  colIndex = Math.max(1, Math.min(14, colIndex));

  const estimatedGrid = `Grid ${GRID_ROWS[rowIndex]}${colIndex}`;

  // Find closest runway or facility
  let nearestZone = 'Perimeter & Infield Airside';
  let minDistance = 999;

  // Check Runways
  CGK_RUNWAYS.forEach(rwy => {
    const midLat = (rwy.coordinates[0][0] + rwy.coordinates[1][0]) / 2;
    const midLon = (rwy.coordinates[0][1] + rwy.coordinates[1][1]) / 2;
    const d = calculateHaversineDistanceKm(lat, lon, midLat, midLon);
    if (d < minDistance) {
      minDistance = d;
      nearestZone = rwy.name;
    }
  });

  // Check specific zones if very close
  CGK_AIRSIDE_ZONES.forEach(zone => {
    const centerLat = zone.coordinates.reduce((acc, c) => acc + c[0], 0) / zone.coordinates.length;
    const centerLon = zone.coordinates.reduce((acc, c) => acc + c[1], 0) / zone.coordinates.length;
    const d = calculateHaversineDistanceKm(lat, lon, centerLat, centerLon);
    if (d < 0.6 && d < minDistance) {
      minDistance = d;
      nearestZone = zone.name;
    }
  });

  const isWithinAirsidePerimeter = distArp <= 5.0;

  return {
    nearestZone,
    estimatedGrid,
    distanceFromArpKm: parseFloat(distArp.toFixed(2)),
    bearingDegree: Math.round(bearing),
    cardinalDirection: cardinal,
    isWithinAirsidePerimeter
  };
};

/**
 * Resolves map coordinates for any report, falling back to grid or keyword heuristics
 */
export const resolveReportCoordinates = (report: any): [number, number] => {
  // 1. Explicit coordinate check
  if (report?.coordinates?.latitude && report?.coordinates?.longitude) {
    return [report.coordinates.latitude, report.coordinates.longitude];
  }

  // 2. Grid Location match
  if (report?.gridLocation) {
    const gridMatch = report.gridLocation.match(/([A-Ga-g])\s*[-_./\s]?\s*([1-9]|1[0-4])/);
    if (gridMatch) {
      return getGridCellCoordinates(`${gridMatch[1].toUpperCase()}${gridMatch[2]}`);
    }
  }

  // 3. Runway / Taxiway text heuristic
  const searchStr = `${report?.runwayTaxiway || ''} ${report?.runwayTaxiwayArea || ''} ${report?.lokasi || ''} ${report?.rutePatroli || ''}`.toLowerCase();

  if (searchStr.includes('06') || searchStr.includes('24') || searchStr.includes('rwy 3') || searchStr.includes('runway 3')) {
    if (searchStr.includes('06') || searchStr.includes('barat')) return [-6.1090, 106.6450];
    if (searchStr.includes('24') || searchStr.includes('timur')) return [-6.1060, 106.6680];
    return [-6.1080, 106.6570];
  }

  if (searchStr.includes('07l') || searchStr.includes('25r') || searchStr.includes('rwy 2') || searchStr.includes('runway 2')) {
    if (searchStr.includes('07l') || searchStr.includes('barat')) return [-6.1200, 106.6380];
    if (searchStr.includes('25r') || searchStr.includes('timur')) return [-6.1165, 106.6640];
    return [-6.1180, 106.6510];
  }

  if (searchStr.includes('07r') || searchStr.includes('25l') || searchStr.includes('rwy 1') || searchStr.includes('runway 1')) {
    if (searchStr.includes('07r') || searchStr.includes('barat')) return [-6.1340, 106.6420];
    if (searchStr.includes('25l') || searchStr.includes('timur')) return [-6.1310, 106.6670];
    return [-6.1325, 106.6550];
  }

  if (searchStr.includes('terminal 3') || searchStr.includes('t3')) return [-6.1190, 106.6620];
  if (searchStr.includes('terminal 2') || searchStr.includes('t2')) return [-6.1255, 106.6550];
  if (searchStr.includes('terminal 1') || searchStr.includes('t1')) return [-6.1305, 106.6530];
  if (searchStr.includes('kolam') || searchStr.includes('drainase')) return [-6.1290, 106.6380];

  // Default to ARP with subtle jitter so multiple markers don't overlap completely
  const jitterLat = (Math.random() - 0.5) * 0.004;
  const jitterLon = (Math.random() - 0.5) * 0.004;
  return [
    parseFloat((DEFAULT_AIRPORT_ARP.latitude + jitterLat).toFixed(5)),
    parseFloat((DEFAULT_AIRPORT_ARP.longitude + jitterLon).toFixed(5))
  ];
};
