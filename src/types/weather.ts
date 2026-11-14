export type UnitSystem = 'aviation' | 'metric' | 'imperial';

export interface AirportCoordinates {
  latitude: number;
  longitude: number;
  aipVerification?: string;
}

export interface AirportConfig {
  id: string;
  icao: string;
  iata: string;
  name: string;
  city: string;
  province: string;
  country: string;
  coordinates: AirportCoordinates;
  elevation_m: number;
  elevation_ft: number;
  timezone: string;
  timezoneLabel: string;
  utcOffsetHours: number;
  sources: {
    primary: string;
    primaryDisclaimer: string;
    secondary: string;
    cacheTtlMinutes: number;
    staleThresholdMinutes: number;
  };
}

export type BirdRiskLevel = 'LOW' | 'MODERATE' | 'HIGH';

export interface BirdActivityRisk {
  level: BirdRiskLevel;
  ruleId: string;
  ruleTitle: string;
  description: string;
  thresholdsNote: string;
  timeOfDayCategory: 'DAWN' | 'DAY' | 'DUSK' | 'NIGHT';
  contributingFactors: string[];
}

export interface MetarData {
  raw: string;
  station: string;
  observationTimeUtc: string;
  observationTimeWib: string;
  temp_c: number | null;
  dewpoint_c: number | null;
  windDir_deg: number | null;
  windSpeed_kt: number | null;
  visibility_m: number | null;
  qnh_hpa: number | null;
  flightCategory: string | null;
  cloudsSummary: string | null;
  sourceName: string;
}

export interface CurrentWeatherData {
  temperature_c: number | null;
  feelsLike_c: number | null;
  humidity_pct: number | null;
  dewPoint_c: number | null;
  pressure_hpa: number | null;
  windSpeed_kt: number | null;
  windSpeed_kmh: number | null;
  windSpeed_ms: number | null;
  windDirection_deg: number | null;
  windDirection_compass: string;
  windGust_kt: number | null;
  visibility_km: number | null;
  visibility_m: number | null;
  uvIndex: number | null;
  heatIndex_c: number | null;
  precipitation_mm: number | null;
  precipitationProbability_pct: number | null;
  isThunderstorm: boolean;
  weatherCode: number;
  conditionText: string;
  thermalHeight_m: number | null;
  thermalHeightIsEstimated: boolean;
  thermalHeightFormulaNote: string;
}

export interface HourlyForecastItem {
  timeWib: string;
  hourLabel: string;
  temp_c: number;
  precipitationProbability_pct: number;
  weatherCode: number;
  conditionText: string;
  windSpeed_kt: number;
  windDirection_compass: string;
  estimatedBirdRisk: BirdRiskLevel;
}

export interface WeatherMetadata {
  fetchedAtUtc: string;
  fetchedAtWib: string;
  lastUpdatedFormattedWib: string;
  isStale: boolean;
  ageMinutes: number;
  primarySource: string;
  secondarySource: string;
  disclaimer: string;
}

export interface AirportWeatherResponse {
  airport: AirportConfig;
  current: CurrentWeatherData;
  metar: MetarData | null;
  birdActivityRisk: BirdActivityRisk;
  forecast12h: HourlyForecastItem[];
  meta: WeatherMetadata;
}
