/**
 * Weather conversions, thermal height calculations, and timezone formatters
 * for Soekarno-Hatta International Airport (WIII/CGK).
 */

import { UnitSystem } from '../types/weather';

export const COMPASS_POINTS = [
  'N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE',
  'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'
] as const;

/**
 * Convert degrees (0-360) to 16-point cardinal compass string
 */
export function degreesToCompass(deg: number | null | undefined): string {
  if (deg === null || deg === undefined || isNaN(deg)) return '--';
  const normalized = ((deg % 360) + 360) % 360;
  const index = Math.round(normalized / 22.5) % 16;
  return COMPASS_POINTS[index];
}

/**
 * Format date in configured airport timezone (Asia/Jakarta / WIB / UTC+7)
 * Never formats in browser local timezone.
 */
export function formatAirportTime(
  dateInput: string | number | Date,
  timeZone: string = 'Asia/Jakarta',
  options?: { showDate?: boolean; showSeconds?: boolean }
): string {
  try {
    const date = new Date(dateInput);
    if (isNaN(date.getTime())) return '--:-- WIB';

    const timeFormatter = new Intl.DateTimeFormat('id-ID', {
      timeZone,
      hour: '2-digit',
      minute: '2-digit',
      second: options?.showSeconds ? '2-digit' : undefined,
      hour12: false
    });

    const timeStr = timeFormatter.format(date).replace(/\./g, ':');

    if (options?.showDate) {
      const dateFormatter = new Intl.DateTimeFormat('id-ID', {
        timeZone,
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
      return `${dateFormatter.format(date)} ${timeStr} WIB`;
    }

    return `${timeStr} WIB`;
  } catch (err) {
    console.error('Error formatting airport time:', err);
    return '--:-- WIB';
  }
}

/**
 * Thermal / Mixing Height estimation: 125 * (T - Td) meters
 * Edge cases:
 * - If T or Td is missing/null: returns null
 * - If T <= Td (condensation/fog at surface): returns 0 meters (never negative)
 * - Rounded to nearest integer
 */
export function calculateThermalHeight(
  tempC: number | null | undefined,
  dewPointC: number | null | undefined
): { height_m: number | null; isEstimated: boolean; note: string } {
  if (tempC === null || tempC === undefined || dewPointC === null || dewPointC === undefined) {
    return {
      height_m: null,
      isEstimated: true,
      note: 'Data temperatur atau dew point tidak tersedia'
    };
  }

  // Dew point depression (T - Td)
  const depression = tempC - dewPointC;

  if (depression <= 0) {
    // Saturated or supersaturated air: condensation layer at surface level
    return {
      height_m: 0,
      isEstimated: true,
      note: 'Udara jenuh (T ≤ Td): Lapisan pencampuran berada di permukaan tanah (kondensasi/kabut).'
    };
  }

  // Standard approximation: 125m per 1°C spread
  const calculatedHeight = Math.min(4500, Math.round(125 * depression));

  return {
    height_m: calculatedHeight,
    isEstimated: true,
    note: 'Estimasi 125 × (T - Td) m. Kondisi tropis lembap pesisir membuat estimasi ini tidak selalu presisi dan bukan nilai operasional resmi ICAO.'
  };
}

/**
 * Checks whether weather data is older than threshold (default 30 min)
 */
export function checkWeatherStaleness(
  fetchedAt: string | number | Date,
  staleThresholdMinutes: number = 30
): { isStale: boolean; ageMinutes: number } {
  try {
    const fetchTime = new Date(fetchedAt).getTime();
    if (isNaN(fetchTime)) return { isStale: true, ageMinutes: 999 };
    const now = Date.now();
    const ageMs = Math.max(0, now - fetchTime);
    const ageMinutes = Math.floor(ageMs / (1000 * 60));
    return {
      isStale: ageMinutes > staleThresholdMinutes,
      ageMinutes
    };
  } catch {
    return { isStale: true, ageMinutes: 999 };
  }
}

/**
 * Calculate Heat Index in °C using NOAA/NWS Rothfusz regression equation
 */
export function calculateHeatIndex(tempC: number | null, humidityPct: number | null): number | null {
  if (tempC === null || humidityPct === null) return null;
  // Heat index only applies when temp >= 27°C (80°F) and RH >= 40%
  if (tempC < 27 || humidityPct < 40) return tempC;

  const T = (tempC * 9) / 5 + 32; // Fahrenheit
  const R = humidityPct;

  const hiF =
    -42.379 +
    2.04901523 * T +
    10.14333127 * R -
    0.22475541 * T * R -
    0.00683783 * T * T -
    0.05481717 * R * R +
    0.00122874 * T * T * R +
    0.00085282 * T * R * R -
    0.00000199 * T * T * R * R;

  const hiC = ((hiF - 32) * 5) / 9;
  return Math.round(hiC * 10) / 10;
}

/**
 * Format values according to the chosen UnitSystem without mixing units within the widget
 */
export function formatTemperature(tempC: number | null, unitSystem: UnitSystem): { value: string; unit: string } {
  if (tempC === null || tempC === undefined) return { value: '--', unit: unitSystem === 'imperial' ? '°F' : '°C' };
  if (unitSystem === 'imperial') {
    const f = Math.round((tempC * 9) / 5 + 32);
    return { value: `${f}`, unit: '°F' };
  }
  return { value: `${Math.round(tempC)}`, unit: '°C' };
}

export function formatWindSpeed(
  speedKt: number | null,
  unitSystem: UnitSystem,
  preferredUnit?: 'kt' | 'kmh' | 'ms'
): { value: string; unit: string } {
  if (speedKt === null || speedKt === undefined) {
    const defaultUnit = unitSystem === 'imperial' ? 'mph' : unitSystem === 'aviation' ? 'kt' : 'km/h';
    return { value: '--', unit: defaultUnit };
  }

  if (unitSystem === 'imperial') {
    const mph = Math.round(speedKt * 1.15078);
    return { value: `${mph}`, unit: 'mph' };
  }

  if (unitSystem === 'metric') {
    if (preferredUnit === 'ms') {
      const ms = (speedKt * 0.514444).toFixed(1);
      return { value: `${ms}`, unit: 'm/s' };
    }
    const kmh = Math.round(speedKt * 1.852);
    return { value: `${kmh}`, unit: 'km/h' };
  }

  // Aviation default: knots
  return { value: `${Math.round(speedKt)}`, unit: 'kt' };
}

export function formatVisibility(visKm: number | null, unitSystem: UnitSystem): { value: string; unit: string; secondary?: string } {
  if (visKm === null || visKm === undefined) return { value: '--', unit: unitSystem === 'imperial' ? 'mi' : 'km' };

  if (unitSystem === 'imperial') {
    const miles = (visKm * 0.621371).toFixed(1);
    return { value: `${miles}`, unit: 'mi' };
  }

  // Aviation or Metric: show km, and if < 5 km also display meters clearly
  if (visKm < 5) {
    const meters = Math.round(visKm * 1000);
    return {
      value: `${visKm.toFixed(1)}`,
      unit: 'km',
      secondary: `(${meters.toLocaleString()} m)`
    };
  }

  return { value: `${Math.round(visKm)}`, unit: 'km' };
}

export function formatPressure(hpa: number | null, unitSystem: UnitSystem): { value: string; unit: string } {
  if (hpa === null || hpa === undefined) return { value: '--', unit: unitSystem === 'imperial' ? 'inHg' : 'hPa' };
  if (unitSystem === 'imperial') {
    const inHg = (hpa * 0.029529983).toFixed(2);
    return { value: `${inHg}`, unit: 'inHg' };
  }
  return { value: `${Math.round(hpa)}`, unit: 'hPa' };
}

export function formatHeight(heightM: number | null, unitSystem: UnitSystem): { value: string; unit: string } {
  if (heightM === null || heightM === undefined) return { value: '--', unit: unitSystem === 'metric' ? 'm' : 'ft' };
  if (unitSystem === 'metric') {
    return { value: `${Math.round(heightM)}`, unit: 'm' };
  }
  // Aviation & Imperial: feet
  const ft = Math.round(heightM * 3.28084);
  return { value: `${ft.toLocaleString()}`, unit: 'ft' };
}

/**
 * Interpret WMO Weather Code
 */
export function interpretWmoCode(code: number): {
  label: string;
  isThunderstorm: boolean;
  isRain: boolean;
  isFog: boolean;
  iconName: string;
} {
  switch (code) {
    case 0:
      return { label: 'Cerah Berawan', isThunderstorm: false, isRain: false, isFog: false, iconName: 'sun' };
    case 1:
      return { label: 'Sebagian Berawan', isThunderstorm: false, isRain: false, isFog: false, iconName: 'sun-cloud' };
    case 2:
      return { label: 'Berawan Sedang', isThunderstorm: false, isRain: false, isFog: false, iconName: 'cloud' };
    case 3:
      return { label: 'Mendung Tebal', isThunderstorm: false, isRain: false, isFog: false, iconName: 'clouds' };
    case 45:
    case 48:
      return { label: 'Berkabut (Fog)', isThunderstorm: false, isRain: false, isFog: true, iconName: 'fog' };
    case 51:
    case 53:
    case 55:
      return { label: 'Gerimis Ringan', isThunderstorm: false, isRain: true, isFog: false, iconName: 'drizzle' };
    case 61:
      return { label: 'Hujan Ringan', isThunderstorm: false, isRain: true, isFog: false, iconName: 'rain' };
    case 63:
      return { label: 'Hujan Sedang', isThunderstorm: false, isRain: true, isFog: false, iconName: 'rain' };
    case 65:
      return { label: 'Hujan Lebat Tropis', isThunderstorm: false, isRain: true, isFog: false, iconName: 'heavy-rain' };
    case 80:
    case 81:
    case 82:
      return { label: 'Hujan Lokal Airfield', isThunderstorm: false, isRain: true, isFog: false, iconName: 'rain' };
    case 95:
      return { label: 'Badai Petir (Thunderstorm)', isThunderstorm: true, isRain: true, isFog: false, iconName: 'thunderstorm' };
    case 96:
    case 99:
      return { label: 'Badai Petir & Angin Kencang', isThunderstorm: true, isRain: true, isFog: false, iconName: 'thunderstorm' };
    default:
      return { label: 'Kondisi Cuaca Umum', isThunderstorm: false, isRain: false, isFog: false, iconName: 'cloud' };
  }
}
