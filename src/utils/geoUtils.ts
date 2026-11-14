// Utility functions for Airport Reference Point (ARP) & Operational Radius Validation

export interface AirportReference {
  code: string;
  name: string;
  latitude: number;
  longitude: number;
  elevationMeters: number;
}

export const DEFAULT_AIRPORT_ARP: AirportReference = {
  code: 'WIII / CGK',
  name: 'Bandara Internasional Soekarno-Hatta (Jakarta)',
  latitude: -6.1256,
  longitude: 106.6558,
  elevationMeters: 10
};

export interface RadiusPreset {
  radiusKm: number;
  label: string;
  description: string;
  badgeColor: string;
}

export const OPERATIONAL_RADIUS_PRESETS: RadiusPreset[] = [
  {
    radiusKm: 3.0,
    label: '3.0 km - Zona Bahaya Kritis & Infield (Merah)',
    description: 'Area inti landas pacu (runway strip) dan infield tengah dengan risiko bahaya satwa tertinggi (arsir merah).',
    badgeColor: 'rose'
  },
  {
    radiusKm: 5.0,
    label: '5.0 km - Perimeter Airside & Fasilitas (Kuning)',
    description: 'Batas pagar perimeter bandara, taxiway, apron, dan fasilitas drainase airside (arsir kuning).',
    badgeColor: 'amber'
  },
  {
    radiusKm: 13.0,
    label: '13.0 km - Zona Pemantauan ICAO 7 NM (Orange)',
    description: 'Radius standar ICAO Doc 9137 Part 3 & Doc 9388 untuk evaluasi atraktan dan pergerakan satwa liar eksternal (arsir orange).',
    badgeColor: 'orange'
  }
];

export interface CoordinatePreset {
  name: string;
  grid: string;
  latitude: number;
  longitude: number;
  type: 'airside' | 'perimeter' | 'outside';
  note: string;
}

export const AIRPORT_COORDINATE_PRESETS: CoordinatePreset[] = [
  {
    name: 'Titik Referensi Bandara (ARP WIII)',
    grid: 'ARP',
    latitude: -6.12560,
    longitude: 106.65580,
    type: 'airside',
    note: 'Titik pusat geometris bandara Soekarno-Hatta (0.0 km)'
  },
  {
    name: 'Runway 07R / 25L Infield',
    grid: 'Grid E7',
    latitude: -6.12850,
    longitude: 106.66200,
    type: 'airside',
    note: 'Area rerumputan infield Runway 1 (± 0.75 km dari ARP)'
  },
  {
    name: 'Runway 07L / 25R (TWY C3)',
    grid: 'Grid C8',
    latitude: -6.11800,
    longitude: 106.65100,
    type: 'airside',
    note: 'Area Runway 2 dan Taxiway C3 (± 0.99 km dari ARP)'
  },
  {
    name: 'Runway 3 Utara Central',
    grid: 'Grid A7',
    latitude: -6.10800,
    longitude: 106.64500,
    type: 'airside',
    note: 'Strip Runway 3 sisi utara bandara (± 2.31 km dari ARP)'
  },
  {
    name: 'Kolam Retensi Barat (Drainase)',
    grid: 'Grid D2',
    latitude: -6.12900,
    longitude: 106.63800,
    type: 'airside',
    note: 'Water retention basin dekat perimeter barat (± 2.00 km dari ARP)'
  },
  {
    name: 'Threshold 25L Selatan (Approach)',
    grid: 'Grid G12',
    latitude: -6.13400,
    longitude: 106.67200,
    type: 'perimeter',
    note: 'Ujung pendaratan Runway 25L sisi selatan (± 2.01 km dari ARP)'
  },
  {
    name: 'Pesisir Rawa Tanjung Pasir',
    grid: 'Off-Grid Utara',
    latitude: -6.01500,
    longitude: 106.67800,
    type: 'outside',
    note: 'Habitat burung migrasi utara (± 12.5 km dari ARP - Di luar 8km)'
  },
  {
    name: 'Kota Jakarta Pusat (Uji Peringatan)',
    grid: 'Off-Airport',
    latitude: -6.17540,
    longitude: 106.82720,
    type: 'outside',
    note: 'Titik di luar bandara untuk menguji peringatan sistem (± 19.6 km dari ARP)'
  }
];

/**
 * Calculates great-circle distance between two coordinate pairs using Haversine formula
 * @returns distance in kilometers
 */
export function calculateHaversineDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's mean radius in kilometers
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((R * c).toFixed(3));
}

/**
 * Calculates the initial bearing from point 1 to point 2
 * @returns bearing in degrees (0 - 360)
 */
export function calculateBearingDegree(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const lat1Rad = (lat1 * Math.PI) / 180;
  const lat2Rad = (lat2 * Math.PI) / 180;
  const dLonRad = ((lon2 - lon1) * Math.PI) / 180;

  const y = Math.sin(dLonRad) * Math.cos(lat2Rad);
  const x =
    Math.cos(lat1Rad) * Math.sin(lat2Rad) -
    Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLonRad);

  let brng = (Math.atan2(y, x) * 180) / Math.PI;
  brng = (brng + 360) % 360;
  return Math.round(brng);
}

/**
 * Converts degree bearing into Indonesian cardinal direction name
 */
export function getCardinalDirectionIndonesian(degrees: number): string {
  const directions = [
    { label: 'Utara', min: 337.5, max: 360 },
    { label: 'Utara', min: 0, max: 22.5 },
    { label: 'Timur Laut', min: 22.5, max: 67.5 },
    { label: 'Timur', min: 67.5, max: 112.5 },
    { label: 'Tenggara', min: 112.5, max: 157.5 },
    { label: 'Selatan', min: 157.5, max: 202.5 },
    { label: 'Barat Daya', min: 202.5, max: 247.5 },
    { label: 'Barat', min: 247.5, max: 292.5 },
    { label: 'Barat Laut', min: 292.5, max: 337.5 }
  ];

  const match = directions.find(d => degrees >= d.min && degrees < d.max);
  return match ? match.label : 'Utara';
}

export interface CoordinateCheckResult {
  isValidCoordinate: boolean;
  latitude: number;
  longitude: number;
  distanceFromArpKm: number;
  isWithinRadius: boolean;
  maxRadiusAllowedKm: number;
  excessDistanceKm: number;
  remainingMarginKm: number;
  bearingDegree: number;
  cardinalDirection: string;
  statusLevel: 'valid_inside' | 'warning_outside' | 'invalid_format' | 'empty';
  message: string;
  arpUsed: AirportReference;
}

/**
 * Evaluates coordinates against airport operational radius
 */
export function evaluatePatrolCoordinates(
  latInput: string | number | undefined | null,
  lonInput: string | number | undefined | null,
  maxRadiusKm: number = 8.0,
  arp: AirportReference = DEFAULT_AIRPORT_ARP
): CoordinateCheckResult {
  if (latInput === undefined || lonInput === undefined || latInput === '' || lonInput === '') {
    return {
      isValidCoordinate: false,
      latitude: 0,
      longitude: 0,
      distanceFromArpKm: 0,
      isWithinRadius: true,
      maxRadiusAllowedKm: maxRadiusKm,
      excessDistanceKm: 0,
      remainingMarginKm: maxRadiusKm,
      bearingDegree: 0,
      cardinalDirection: '-',
      statusLevel: 'empty',
      message: 'Koordinat belum dimasukkan. Masukkan latitude & longitude atau gunakan GPS.',
      arpUsed: arp
    };
  }

  const lat = typeof latInput === 'number' ? latInput : parseFloat(latInput.toString().replace(',', '.'));
  const lon = typeof lonInput === 'number' ? lonInput : parseFloat(lonInput.toString().replace(',', '.'));

  if (isNaN(lat) || isNaN(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
    return {
      isValidCoordinate: false,
      latitude: 0,
      longitude: 0,
      distanceFromArpKm: 0,
      isWithinRadius: false,
      maxRadiusAllowedKm: maxRadiusKm,
      excessDistanceKm: 0,
      remainingMarginKm: 0,
      bearingDegree: 0,
      cardinalDirection: '-',
      statusLevel: 'invalid_format',
      message: 'Format koordinat tidak valid. Nilai latitude (-90 s/d 90) dan longitude (-180 s/d 180).',
      arpUsed: arp
    };
  }

  const distance = calculateHaversineDistanceKm(arp.latitude, arp.longitude, lat, lon);
  const bearing = calculateBearingDegree(arp.latitude, arp.longitude, lat, lon);
  const direction = getCardinalDirectionIndonesian(bearing);
  const isWithin = distance <= maxRadiusKm;
  const excess = isWithin ? 0 : Number((distance - maxRadiusKm).toFixed(2));
  const margin = isWithin ? Number((maxRadiusKm - distance).toFixed(2)) : 0;

  return {
    isValidCoordinate: true,
    latitude: lat,
    longitude: lon,
    distanceFromArpKm: distance,
    isWithinRadius: isWithin,
    maxRadiusAllowedKm: maxRadiusKm,
    excessDistanceKm: excess,
    remainingMarginKm: margin,
    bearingDegree: bearing,
    cardinalDirection: direction,
    statusLevel: isWithin ? 'valid_inside' : 'warning_outside',
    message: isWithin
      ? `Koordinat valid di dalam radius operasional bandara (${distance} km dari ARP).`
      : `PERINGATAN: Titik koordinat berjarak ${distance} km dari ARP, melampaui batas radius ${maxRadiusKm} km (+${excess} km ke arah ${direction}).`,
    arpUsed: arp
  };
}

/**
 * Parses user input that might be a combined string like "-6.1285, 106.6620"
 */
export function parseCombinedCoordinates(text: string): { latitude: number; longitude: number } | null {
  if (!text) return null;
  const clean = text.trim();
  // Match patterns like: -6.1234, 106.5678 or -6.1234 106.5678 or lat: -6.1234, lon: 106.5678
  const parts = clean.split(/[,;\s]+/).map(p => p.replace(/[^\d.-]/g, '')).filter(Boolean);
  if (parts.length >= 2) {
    const lat = parseFloat(parts[0]);
    const lon = parseFloat(parts[1]);
    if (!isNaN(lat) && !isNaN(lon) && lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180) {
      return { latitude: lat, longitude: lon };
    }
  }
  return null;
}
