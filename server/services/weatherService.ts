import fs from 'fs';
import path from 'path';
import {
  AirportConfig,
  AirportWeatherResponse,
  CurrentWeatherData,
  MetarData,
  HourlyForecastItem,
  WeatherMetadata
} from '../../src/types/weather';
import {
  calculateThermalHeight,
  calculateHeatIndex,
  checkWeatherStaleness,
  degreesToCompass,
  formatAirportTime,
  interpretWmoCode
} from '../../src/utils/weatherCalculations';
import { evaluateBirdActivityRisk } from '../../src/utils/birdActivityEvaluator';

// In-memory cache
interface CachedEntry {
  data: AirportWeatherResponse;
  timestamp: number;
}

let weatherCache: Record<string, CachedEntry> = {};

function getAirportConfig(airportId: string = 'WIII'): AirportConfig {
  try {
    const configPath = path.join(process.cwd(), 'config', 'airportConfig.json');
    if (fs.existsSync(configPath)) {
      const raw = fs.readFileSync(configPath, 'utf-8');
      const parsed = JSON.parse(raw);
      if (parsed.airport) {
        return parsed.airport;
      }
    }
  } catch (err) {
    console.error('Failed to load airportConfig.json:', err);
  }

  // Fallback verified WIII config
  return {
    id: 'WIII',
    icao: 'WIII',
    iata: 'CGK',
    name: 'Soekarno-Hatta International Airport',
    city: 'Tangerang',
    province: 'Banten',
    country: 'Indonesia',
    coordinates: {
      latitude: -6.1256,
      longitude: 106.6559,
      aipVerification: "Verified against AIP Indonesia WIII AD 2.2 ARP S 06°07'32\" E 106°39'21\""
    },
    elevation_m: 10.4,
    elevation_ft: 34,
    timezone: 'Asia/Jakarta',
    timezoneLabel: 'WIB',
    utcOffsetHours: 7,
    sources: {
      primary: 'Open-Meteo Numerical Weather Prediction Model',
      primaryDisclaimer: 'Model data, not an airport sensor reading',
      secondary: 'AviationWeather.gov / NOAA & ICAO Official METAR Feed (WIII)',
      cacheTtlMinutes: 10,
      staleThresholdMinutes: 30
    }
  };
}

/**
 * Fetch official METAR from AviationWeather.gov
 */
async function fetchOfficialMetar(icao: string): Promise<MetarData | null> {
  try {
    const url = `https://aviationweather.gov/api/data/metar?ids=${encodeURIComponent(icao)}&format=json`;
    const res = await fetch(url, { headers: { 'User-Agent': 'SoekarnoHattaWHMS/1.0 (Airside Wildlife Safety)' } });
    if (!res.ok) return null;
    const json: any[] = await res.json();
    if (!Array.isArray(json) || json.length === 0) return null;

    const m = json[0];
    const obsTimeUtc = m.reportTime || m.receiptTime || new Date().toISOString();
    const obsTimeWib = formatAirportTime(obsTimeUtc, 'Asia/Jakarta', { showDate: true });

    let cloudsSummary = m.cover || null;
    if (Array.isArray(m.clouds) && m.clouds.length > 0) {
      cloudsSummary = m.clouds.map((c: any) => `${c.cover || ''} ${c.base ? `${c.base}ft` : ''}`.trim()).join(', ');
    }

    // Convert visibility miles to meters if needed
    let visMeters: number | null = null;
    if (m.visib !== undefined && m.visib !== null) {
      // AviationWeather.gov gives miles, e.g. 4.35 mi ≈ 7000 m
      visMeters = Math.round(m.visib * 1609.34);
    }

    return {
      raw: m.rawOb || `METAR ${icao} ${m.temp}/${m.dewp}`,
      station: m.icaoId || icao,
      observationTimeUtc: obsTimeUtc,
      observationTimeWib: obsTimeWib,
      temp_c: m.temp ?? null,
      dewpoint_c: m.dewp ?? null,
      windDir_deg: m.wdir ?? null,
      windSpeed_kt: m.wspd ?? null,
      visibility_m: visMeters,
      qnh_hpa: m.altim ?? null,
      flightCategory: m.fltCat || null,
      cloudsSummary,
      sourceName: 'AviationWeather.gov (NOAA / ICAO Official WIII METAR)'
    };
  } catch (err) {
    console.warn(`Could not fetch METAR for ${icao}:`, err);
    return null;
  }
}

/**
 * Fetch and construct full airport weather package
 */
export async function getAirportWeather(
  airportId: string = 'WIII',
  forceRefresh: boolean = false
): Promise<AirportWeatherResponse> {
  const normId = airportId.toUpperCase().trim() || 'WIII';
  const config = getAirportConfig(normId);
  const cacheKey = config.icao;

  const now = Date.now();
  const cached = weatherCache[cacheKey];

  // 10-minute TTL cache
  const ttlMs = config.sources.cacheTtlMinutes * 60 * 1000;
  if (!forceRefresh && cached && now - cached.timestamp < ttlMs) {
    return cached.data;
  }

  const { latitude, longitude } = config.coordinates;

  // 1. Fetch Open-Meteo
  const openMeteoUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,dew_point_2m,apparent_temperature,precipitation,rain,weather_code,surface_pressure,wind_speed_10m,wind_direction_10m,wind_gusts_10m,visibility,uv_index&hourly=temperature_2m,precipitation_probability,weather_code,wind_speed_10m,wind_direction_10m&forecast_hours=12&timezone=Asia%2FJakarta`;

  let openMeteoData: any = null;
  try {
    const resp = await fetch(openMeteoUrl);
    if (!resp.ok) {
      throw new Error(`Open-Meteo error status ${resp.status}`);
    }
    openMeteoData = await resp.json();
  } catch (err) {
    console.error('Failed to fetch Open-Meteo data:', err);
    // If we have stale cache, return it with warning
    if (cached) {
      cached.data.meta.isStale = true;
      cached.data.meta.disclaimer += ' (Peringatan: Gagal menghubungi server cuaca terbaru, data arsip ditampilkan)';
      return cached.data;
    }
    throw err;
  }

  // 2. Fetch Secondary Official METAR
  const metar = await fetchOfficialMetar(config.icao);

  const cur = openMeteoData.current || {};
  const tempC = cur.temperature_2m ?? null;
  const dewC = cur.dew_point_2m ?? null;
  const rhPct = cur.relative_humidity_2m ?? null;
  const windKmh = cur.wind_speed_10m ?? null;
  const windDirDeg = cur.wind_direction_10m ?? null;
  const windGustKmh = cur.wind_gusts_10m ?? null;
  const visMeters = cur.visibility ?? null;
  const pressureHpa = cur.surface_pressure ?? null;
  const weatherCode = cur.weather_code ?? 0;
  const precipMm = cur.precipitation ?? 0;

  // Convert wind km/h to knots
  const windSpeedKt = windKmh !== null ? Math.round(windKmh * 0.539957) : null;
  const windSpeedMs = windKmh !== null ? parseFloat((windKmh / 3.6).toFixed(1)) : null;
  const windGustKt = windGustKmh !== null ? Math.round(windGustKmh * 0.539957) : null;
  const visKm = visMeters !== null ? parseFloat((visMeters / 1000).toFixed(1)) : null;

  const wmo = interpretWmoCode(weatherCode);
  const heatIndexC = calculateHeatIndex(tempC, rhPct);
  const thermalInfo = calculateThermalHeight(tempC, dewC);

  // Time in WIB
  const fetchedAtDate = new Date();
  const fetchedAtUtc = fetchedAtDate.toISOString();
  const fetchedAtWib = formatAirportTime(fetchedAtDate, config.timezone, { showDate: true, showSeconds: true });
  const lastUpdatedFormattedWib = formatAirportTime(fetchedAtDate, config.timezone);

  // Calculate WIB decimal hour (e.g. 14.5 = 14:30)
  const wibTimeFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: config.timezone,
    hour: 'numeric',
    minute: 'numeric',
    hour12: false
  });
  const parts = wibTimeFormatter.formatToParts(fetchedAtDate);
  const hourPart = parseInt(parts.find(p => p.type === 'hour')?.value || '12', 10);
  const minutePart = parseInt(parts.find(p => p.type === 'minute')?.value || '0', 10);
  const hourWibDecimal = hourPart + minutePart / 60;

  // Evaluate Bird Activity Risk using the rule table
  const birdRisk = evaluateBirdActivityRisk({
    thermalHeightM: thermalInfo.height_m,
    windSpeedKt: windSpeedKt,
    visibilityKm: visKm,
    isThunderstorm: wmo.isThunderstorm,
    rainfallMm: precipMm,
    humidityPct: rhPct,
    hourWib: hourWibDecimal
  });

  // Construct Next 12 Hours Forecast
  const hourly = openMeteoData.hourly || {};
  const forecast12h: HourlyForecastItem[] = [];

  if (Array.isArray(hourly.time)) {
    const maxItems = Math.min(12, hourly.time.length);
    for (let i = 0; i < maxItems; i++) {
      const timeIso = hourly.time[i];
      const hTemp = hourly.temperature_2m?.[i] ?? 30;
      const hPrecipProb = hourly.precipitation_probability?.[i] ?? 0;
      const hCode = hourly.weather_code?.[i] ?? 0;
      const hWindKmh = hourly.wind_speed_10m?.[i] ?? 0;
      const hWindDeg = hourly.wind_direction_10m?.[i] ?? 0;
      const hWindKt = Math.round(hWindKmh * 0.539957);
      const hWmo = interpretWmoCode(hCode);

      const d = new Date(timeIso);
      const hourStr = formatAirportTime(d, config.timezone);

      // Estimate hourly risk
      const hRisk = evaluateBirdActivityRisk({
        thermalHeightM: Math.round(125 * (hTemp - (dewC ?? (hTemp - 4)))),
        windSpeedKt: hWindKt,
        visibilityKm: 8,
        isThunderstorm: hWmo.isThunderstorm,
        rainfallMm: hPrecipProb > 60 ? 3 : 0,
        humidityPct: 75,
        hourWib: d.getHours() + d.getMinutes() / 60
      });

      forecast12h.push({
        timeWib: hourStr,
        hourLabel: hourStr.replace(' WIB', ''),
        temp_c: Math.round(hTemp),
        precipitationProbability_pct: hPrecipProb,
        weatherCode: hCode,
        conditionText: hWmo.label,
        windSpeed_kt: hWindKt,
        windDirection_compass: degreesToCompass(hWindDeg),
        estimatedBirdRisk: hRisk.level
      });
    }
  }

  const current: CurrentWeatherData = {
    temperature_c: tempC !== null ? Math.round(tempC * 10) / 10 : null,
    feelsLike_c: cur.apparent_temperature !== undefined ? Math.round(cur.apparent_temperature * 10) / 10 : null,
    humidity_pct: rhPct,
    dewPoint_c: dewC !== null ? Math.round(dewC * 10) / 10 : null,
    pressure_hpa: pressureHpa !== null ? Math.round(pressureHpa) : null,
    windSpeed_kt: windSpeedKt,
    windSpeed_kmh: windKmh !== null ? Math.round(windKmh) : null,
    windSpeed_ms: windSpeedMs,
    windDirection_deg: windDirDeg,
    windDirection_compass: degreesToCompass(windDirDeg),
    windGust_kt: windGustKt,
    visibility_km: visKm,
    visibility_m: visMeters,
    uvIndex: cur.uv_index !== undefined ? Math.round(cur.uv_index * 10) / 10 : null,
    heatIndex_c: heatIndexC,
    precipitation_mm: precipMm,
    precipitationProbability_pct: forecast12h[0]?.precipitationProbability_pct ?? null,
    isThunderstorm: wmo.isThunderstorm,
    weatherCode,
    conditionText: wmo.label,
    thermalHeight_m: thermalInfo.height_m,
    thermalHeightIsEstimated: thermalInfo.isEstimated,
    thermalHeightFormulaNote: thermalInfo.note
  };

  const staleness = checkWeatherStaleness(fetchedAtDate, config.sources.staleThresholdMinutes);

  const meta: WeatherMetadata = {
    fetchedAtUtc,
    fetchedAtWib,
    lastUpdatedFormattedWib,
    isStale: staleness.isStale,
    ageMinutes: staleness.ageMinutes,
    primarySource: config.sources.primary,
    secondarySource: config.sources.secondary,
    disclaimer: config.sources.primaryDisclaimer
  };

  const fullPayload: AirportWeatherResponse = {
    airport: config,
    current,
    metar,
    birdActivityRisk: birdRisk,
    forecast12h,
    meta
  };

  // Cache response
  weatherCache[cacheKey] = {
    data: fullPayload,
    timestamp: now
  };

  return fullPayload;
}
