import React, { useState, useEffect } from 'react';
import {
  Cloud,
  Sun,
  CloudSun,
  CloudRain,
  CloudLightning,
  CloudDrizzle,
  CloudFog,
  Wind,
  Compass,
  Droplets,
  Gauge,
  Eye,
  Thermometer,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Info,
  Clock,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Settings,
  HelpCircle,
  ExternalLink,
  Layers,
  ArrowUpRight,
  Plane
} from 'lucide-react';
import {
  AirportWeatherResponse,
  UnitSystem,
  BirdRiskLevel
} from '../types/weather';
import {
  formatAirportTime,
  formatTemperature,
  formatWindSpeed,
  formatVisibility,
  formatPressure,
  formatHeight
} from '../utils/weatherCalculations';
import birdRulesConfig from '../../config/birdActivityRules.json';

interface WeatherBirdActivityWidgetProps {
  airportId?: string;
  onRefresh?: () => void;
  className?: string;
}

export const WeatherBirdActivityWidget: React.FC<WeatherBirdActivityWidgetProps> = ({
  airportId = 'WIII',
  className = ''
}) => {
  const [weather, setWeather] = useState<AirportWeatherResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Unit system setting: 'aviation' (default) | 'metric' | 'imperial'
  const [unitSystem, setUnitSystem] = useState<UnitSystem>(() => {
    try {
      const saved = localStorage.getItem('whms_weather_unit_system');
      if (saved === 'metric' || saved === 'imperial' || saved === 'aviation') {
        return saved;
      }
    } catch {}
    return 'aviation';
  });

  // Wind unit preference for metric: 'kmh' or 'ms'
  const [metricWindUnit, setMetricWindUnit] = useState<'kmh' | 'ms'>('kmh');

  // Active view tab: 'current' | 'forecast'
  const [activeTab, setActiveTab] = useState<'current' | 'forecast'>('current');

  // Rule table info modal
  const [showRuleModal, setShowRuleModal] = useState<boolean>(false);
  const [showThermalTooltip, setShowThermalTooltip] = useState<boolean>(false);

  // Persist unit preference
  const handleUnitSystemChange = (system: UnitSystem) => {
    setUnitSystem(system);
    try {
      localStorage.setItem('whms_weather_unit_system', system);
    } catch {}
  };

  const fetchWeatherData = async (force: boolean = false) => {
    try {
      if (force) setRefreshing(true);
      else if (!weather) setLoading(true);
      setError(null);

      const url = `/api/weather/${encodeURIComponent(airportId)}${force ? '?refresh=true' : ''}`;
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`Gagal memuat cuaca (HTTP ${res.status})`);
      }
      const data: AirportWeatherResponse = await res.json();
      setWeather(data);
    } catch (err: any) {
      console.error('Weather fetch error:', err);
      setError(err?.message || 'Gagal memuat data cuaca');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchWeatherData(false);
    // Poll every 5 minutes
    const interval = setInterval(() => {
      fetchWeatherData(false);
    }, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [airportId]);

  // Weather Icon Component
  const renderWeatherIcon = (code: number, classNameStr: string = 'w-10 h-10') => {
    if (code === 95 || code === 96 || code === 99) {
      return <CloudLightning className={`${classNameStr} text-amber-500 animate-pulse`} />;
    }
    if (code >= 80 && code <= 82) {
      return <CloudRain className={`${classNameStr} text-blue-500`} />;
    }
    if (code >= 61 && code <= 65) {
      return <CloudRain className={`${classNameStr} text-sky-600`} />;
    }
    if (code >= 51 && code <= 55) {
      return <CloudDrizzle className={`${classNameStr} text-sky-400`} />;
    }
    if (code === 45 || code === 48) {
      return <CloudFog className={`${classNameStr} text-slate-400`} />;
    }
    if (code === 0) {
      return <Sun className={`${classNameStr} text-amber-400`} />;
    }
    if (code === 1 || code === 2) {
      return <CloudSun className={`${classNameStr} text-sky-400`} />;
    }
    return <Cloud className={`${classNameStr} text-slate-400`} />;
  };

  // Helper for Bird Risk Badge styling (Accessible: not conveyed by color alone)
  const getRiskBadgeDetails = (level: BirdRiskLevel) => {
    switch (level) {
      case 'HIGH':
        return {
          bg: 'bg-rose-50 dark:bg-rose-950/50',
          border: 'border-rose-300 dark:border-rose-800',
          text: 'text-rose-800 dark:text-rose-200',
          badgeBg: 'bg-rose-600 text-white',
          label: 'HIGH / TINGGI',
          symbol: '[!] RISIKO TINGGI',
          icon: AlertTriangle
        };
      case 'MODERATE':
        return {
          bg: 'bg-amber-50 dark:bg-amber-950/50',
          border: 'border-amber-300 dark:border-amber-800',
          text: 'text-amber-800 dark:text-amber-200',
          badgeBg: 'bg-amber-500 text-slate-900',
          label: 'MODERATE / WASPADA',
          symbol: '[▲] RISIKO SEDANG',
          icon: ShieldAlert
        };
      case 'LOW':
      default:
        return {
          bg: 'bg-emerald-50 dark:bg-emerald-950/50',
          border: 'border-emerald-300 dark:border-emerald-800',
          text: 'text-emerald-800 dark:text-emerald-200',
          badgeBg: 'bg-emerald-600 text-white',
          label: 'LOW / RENDAH',
          symbol: '[✓] RISIKO RENDAH',
          icon: CheckCircle2
        };
    }
  };

  if (loading && !weather) {
    return (
      <div className={`bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm animate-pulse ${className}`}>
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-3 mb-4">
          <div className="h-6 w-48 bg-slate-200 dark:bg-slate-700 rounded-lg"></div>
          <div className="h-6 w-24 bg-slate-200 dark:bg-slate-700 rounded-lg"></div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 space-y-4">
            <div className="h-16 w-32 bg-slate-200 dark:bg-slate-700 rounded-xl"></div>
            <div className="h-24 bg-slate-100 dark:bg-slate-700/60 rounded-xl"></div>
          </div>
          <div className="lg:col-span-5 space-y-3">
            <div className="h-8 bg-slate-100 dark:bg-slate-700/60 rounded-lg"></div>
            <div className="h-8 bg-slate-100 dark:bg-slate-700/60 rounded-lg"></div>
            <div className="h-8 bg-slate-100 dark:bg-slate-700/60 rounded-lg"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error && !weather) {
    return (
      <div className={`bg-white dark:bg-slate-800 rounded-2xl border border-rose-200 dark:border-rose-900/60 p-5 shadow-sm text-center ${className}`}>
        <AlertTriangle className="w-8 h-8 text-rose-500 mx-auto mb-2" />
        <h4 className="font-bold text-slate-900 dark:text-white text-sm">Gagal Mengambil Data Cuaca Bandara</h4>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">{error}</p>
        <button
          onClick={() => fetchWeatherData(true)}
          className="mt-3.5 px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs inline-flex items-center gap-1.5 cursor-pointer shadow-sm transition"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Coba Lagi</span>
        </button>
      </div>
    );
  }

  const cur = weather?.current;
  const metar = weather?.metar;
  const meta = weather?.meta;
  const birdRisk = weather?.birdActivityRisk;
  const riskDetails = getRiskBadgeDetails(birdRisk?.level || 'LOW');
  const RiskIcon = riskDetails.icon;

  // Formatted values based on active unit system (No mixed units within card)
  const tempFormatted = formatTemperature(cur?.temperature_c ?? null, unitSystem);
  const feelsLikeFormatted = formatTemperature(cur?.feelsLike_c ?? null, unitSystem);
  const dewPointFormatted = formatTemperature(cur?.dewPoint_c ?? null, unitSystem);
  const heatIndexFormatted = formatTemperature(cur?.heatIndex_c ?? null, unitSystem);
  const windFormatted = formatWindSpeed(cur?.windSpeed_kt ?? null, unitSystem, metricWindUnit);
  const windGustFormatted = cur?.windGust_kt ? formatWindSpeed(cur.windGust_kt, unitSystem, metricWindUnit) : null;
  const visFormatted = formatVisibility(cur?.visibility_km ?? null, unitSystem);
  const pressureFormatted = formatPressure(cur?.pressure_hpa ?? null, unitSystem);
  const thermalFormatted = formatHeight(cur?.thermalHeight_m ?? null, unitSystem);

  return (
    <div className={`bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden transition-colors ${className}`}>
      {/* 1. Header Bar: Title, Airport ICAO/IATA, Time in configured timezone (WIB), Units Toggle */}
      <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-700/80 bg-slate-50/70 dark:bg-slate-800/80">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-blue-600 text-white tracking-wider">
                {weather?.airport.icao || 'WIII'} / {weather?.airport.iata || 'CGK'}
              </span>
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                {weather?.airport.name || 'Soekarno-Hatta International Airport'}
              </span>
              <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-medium bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                Elev: {weather?.airport.elevation_m}m ({weather?.airport.elevation_ft}ft)
              </span>
            </div>

            <div className="flex items-center gap-2 mt-1">
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                {activeTab === 'current' ? 'Current Weather' : 'Weather Forecast (Next 12h)'} &amp; Bird Activity Conditions
              </h3>
            </div>
          </div>

          {/* Right Controls: Tabs, Units, Time, Refresh */}
          <div className="flex flex-wrap items-center gap-2">
            {/* View Tabs */}
            <div className="flex items-center bg-slate-200/80 dark:bg-slate-900 p-0.5 rounded-xl text-xs font-bold">
              <button
                onClick={() => setActiveTab('current')}
                className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                  activeTab === 'current'
                    ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Current Weather
              </button>
              <button
                onClick={() => setActiveTab('forecast')}
                className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                  activeTab === 'forecast'
                    ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Forecast 12h
              </button>
            </div>

            {/* Unit System Toggle (Requirement 1: Never mix units within one card) */}
            <div className="flex items-center bg-slate-200/80 dark:bg-slate-900 p-0.5 rounded-xl text-[11px] font-semibold" title="Pilih sistem satuan: Aviation (kt, ft, hPa), Metric (km/h, m, hPa), Imperial (mph, ft, inHg)">
              <button
                onClick={() => handleUnitSystemChange('aviation')}
                className={`px-2 py-1 rounded-lg transition cursor-pointer ${
                  unitSystem === 'aviation'
                    ? 'bg-blue-600 text-white font-bold shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Aviation
              </button>
              <button
                onClick={() => handleUnitSystemChange('metric')}
                className={`px-2 py-1 rounded-lg transition cursor-pointer ${
                  unitSystem === 'metric'
                    ? 'bg-blue-600 text-white font-bold shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Metric
              </button>
              <button
                onClick={() => handleUnitSystemChange('imperial')}
                className={`px-2 py-1 rounded-lg transition cursor-pointer ${
                  unitSystem === 'imperial'
                    ? 'bg-blue-600 text-white font-bold shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Imperial
              </button>
            </div>

            {/* Refresh Button */}
            <button
              onClick={() => fetchWeatherData(true)}
              disabled={refreshing}
              className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 transition cursor-pointer border border-slate-200 dark:border-slate-600"
              title="Perbarui data cuaca dari Open-Meteo & METAR"
              aria-label="Perbarui data cuaca"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-blue-600' : ''}`} />
            </button>
          </div>
        </div>

        {/* Timestamps & Stale Warning (Requirement 3: Never show stale data silently) */}
        <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>Waktu Bandara: <strong className="text-slate-700 dark:text-slate-200">{formatAirportTime(new Date(), weather?.airport.timezone || 'Asia/Jakarta')}</strong></span>
            <span className="text-slate-300 dark:text-slate-600">•</span>
            <span>Last updated: <strong className="text-slate-700 dark:text-slate-200">{meta?.lastUpdatedFormattedWib || '--:-- WIB'}</strong></span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] bg-slate-100 dark:bg-slate-700/60 px-2 py-0.5 rounded text-slate-600 dark:text-slate-300">
              {meta?.disclaimer || 'Model data, not an airport sensor reading'}
            </span>
          </div>
        </div>

        {/* Visible Stale Warning Banner if > 30 min old */}
        {meta?.isStale && (
          <div className="mt-3 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/40 text-amber-800 dark:text-amber-200 text-xs flex items-center gap-2 animate-pulse">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <div className="flex-1">
              <strong>Peringatan Data Kedaluwarsa ({meta.ageMinutes} menit yang lalu):</strong> Server cuaca belum mengirimkan pembaruan terkini. Informasi ini mungkin tidak mencerminkan perubahan mendadak di runway WIII.
            </div>
            <button
              onClick={() => fetchWeatherData(true)}
              className="px-2.5 py-1 bg-amber-600 text-white rounded-lg text-[10px] font-bold hover:bg-amber-700 cursor-pointer shrink-0"
            >
              Paksa Refresh
            </button>
          </div>
        )}
      </div>

      {/* 2. Main Content: Left Main Conditions + Right "Right Now" Stacked Panel */}
      {activeTab === 'current' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-100 dark:divide-slate-700/80">
          {/* LEFT PANEL (lg:col-span-7): Main Conditions & Bird Activity Risk Banner */}
          <div className="lg:col-span-7 p-4 sm:p-5 space-y-4">
            {/* Top Primary Temperature & Icon */}
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white font-mono">
                    {tempFormatted.value}
                  </span>
                  <span className="text-2xl sm:text-3xl font-bold text-slate-500 dark:text-slate-400 font-mono">
                    {tempFormatted.unit}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                  <span>Terasa seperti: <strong className="text-slate-800 dark:text-slate-200">{feelsLikeFormatted.value} {feelsLikeFormatted.unit}</strong></span>
                  <span className="text-slate-300 dark:text-slate-600">•</span>
                  <span>Dew Point: <strong className="text-slate-800 dark:text-slate-200">{dewPointFormatted.value} {dewPointFormatted.unit}</strong></span>
                </div>
              </div>

              {/* Weather Condition Badge & Icon */}
              <div className="flex flex-col items-end text-right">
                <div className="p-2 rounded-2xl bg-slate-100 dark:bg-slate-700/60 shadow-2xs mb-1">
                  {renderWeatherIcon(cur?.weatherCode ?? 0, 'w-10 h-10 sm:w-12 sm:h-12')}
                </div>
                <span className="font-bold text-xs sm:text-sm text-slate-800 dark:text-slate-200">
                  {cur?.conditionText || 'Cerah Berawan'}
                </span>
                <span className="text-[10px] text-slate-400">WMO Code: {cur?.weatherCode}</span>
              </div>
            </div>

            {/* Tropical Wet Season Indicators: Thunderstorm & Precipitation */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* Thunderstorm Indicator */}
              <div className={`p-3 rounded-xl border flex items-center gap-2.5 ${
                cur?.isThunderstorm
                  ? 'bg-rose-500/10 border-rose-500/40 text-rose-800 dark:text-rose-200'
                  : 'bg-slate-50 dark:bg-slate-700/30 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
              }`}>
                <div className={`p-2 rounded-lg ${cur?.isThunderstorm ? 'bg-rose-600 text-white animate-pulse' : 'bg-slate-200 dark:bg-slate-600 text-slate-500 dark:text-slate-300'}`}>
                  <CloudLightning className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Indikator Petir (TS)
                  </div>
                  <div className="text-xs font-bold mt-0.5">
                    {cur?.isThunderstorm ? '⚡ Badai Petir Terdeteksi Aktif' : 'Tidak Ada Badai Petir'}
                  </div>
                </div>
              </div>

              {/* Rain & Precipitation Probability */}
              <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/30 flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-sky-100 dark:bg-sky-950/60 text-sky-600 dark:text-sky-300">
                  <CloudRain className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Presipitasi &amp; Curah Hujan
                  </div>
                  <div className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                    {cur?.precipitation_mm ?? 0} mm • {cur?.precipitationProbability_pct ?? 0}% Peluang
                  </div>
                </div>
              </div>
            </div>

            {/* Mixing / Thermal Height Card with Tooltip */}
            <div className="p-3.5 rounded-xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/50 dark:bg-blue-950/20 relative">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-blue-900 dark:text-blue-300">
                    Mixing / Thermal Height (Kolom Termal)
                  </span>
                  <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-blue-200 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                    {cur?.thermalHeightIsEstimated ? 'Estimated' : 'Model'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowThermalTooltip(!showThermalTooltip)}
                  className="text-blue-600 hover:text-blue-800 dark:text-blue-400 p-0.5 rounded cursor-pointer"
                  title="Lihat metodologi dan catatan operasional"
                  aria-label="Informasi Thermal Height"
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-bold font-mono text-blue-950 dark:text-blue-100">
                  {thermalFormatted.value}
                </span>
                <span className="text-xs font-semibold text-blue-700 dark:text-blue-300">
                  {thermalFormatted.unit} AGL
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 ml-2">
                  (Spread T - Td: {cur?.temperature_c && cur?.dewPoint_c ? (cur.temperature_c - cur.dewPoint_c).toFixed(1) : '--'}°C)
                </span>
              </div>

              {/* Explanatory Tooltip / Note */}
              {(showThermalTooltip || true) && (
                <p className="text-[10.5px] text-blue-800/80 dark:text-blue-300/80 mt-1.5 leading-relaxed">
                  {cur?.thermalHeightFormulaNote || 'Estimasi 125 × (T - Td) m. Kondisi tropis lembap pesisir membuat estimasi ini tidak selalu presisi dan bukan nilai operasional resmi ICAO.'}
                </p>
              )}
            </div>

            {/* Requirement 4: BIRD ACTIVITY RISK INDICATOR (Low / Moderate / High) */}
            <div className={`p-4 rounded-xl border ${riskDetails.bg} ${riskDetails.border} shadow-2xs space-y-2.5`} role="region" aria-label={`Indikator Risiko Aktivitas Satwa: ${riskDetails.label}`}>
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className={`p-1.5 rounded-lg ${riskDetails.badgeBg}`}>
                    <RiskIcon className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                      Tingkat Risiko Aktivitas Burung &amp; Satwa
                    </span>
                    <h4 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white flex items-center gap-1.5">
                      <span className={`px-2 py-0.5 rounded-md text-xs font-extrabold uppercase ${riskDetails.badgeBg}`}>
                        {riskDetails.symbol}
                      </span>
                    </h4>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowRuleModal(true)}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-bold border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center gap-1 cursor-pointer shadow-2xs transition"
                >
                  <Settings className="w-3 h-3 text-slate-400" />
                  <span>Aturan Evaluasi</span>
                </button>
              </div>

              {/* Triggered Rule Display */}
              <div className="bg-white/80 dark:bg-slate-900/80 p-3 rounded-lg border border-slate-200/80 dark:border-slate-700/80 space-y-1 text-xs">
                <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-100">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  <span>Terpicu oleh: {birdRisk?.ruleTitle}</span>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                  {birdRisk?.description}
                </p>

                {/* Contributing factors tags */}
                {birdRisk?.contributingFactors && birdRisk.contributingFactors.length > 0 && (
                  <div className="pt-1.5 mt-1 border-t border-slate-100 dark:border-slate-800 flex flex-wrap gap-1">
                    {birdRisk.contributingFactors.map((factor, idx) => (
                      <span key={idx} className="px-1.5 py-0.2 rounded text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        • {factor}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Disclaimer on Placeholder Thresholds */}
              <div className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                <Info className="w-3 h-3 text-slate-400 shrink-0" />
                <span className="italic">{birdRulesConfig.approvalStatus === 'PENDING_WILDLIFE_HAZARD_TEAM_APPROVAL' ? '[Placeholder Thresholds - Menunggu validasi resmi Tim WHMS Bandara]' : 'Aturan Terkalibrasi'}</span>
              </div>
            </div>
          </div>

          {/* RIGHT PANEL (lg:col-span-5): "Right Now" Panel - Stacked Metrics Separated by Dividers */}
          <div className="lg:col-span-5 p-4 sm:p-5 flex flex-col justify-between space-y-3.5 bg-slate-50/40 dark:bg-slate-800/40">
            <div>
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-2 mb-2">
                <h4 className="font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Wind className="w-3.5 h-3.5 text-blue-600" />
                  <span>Right Now (Metrik Real-Time)</span>
                </h4>
                <span className="text-[10px] font-mono text-slate-400">WIII AD 2.2</span>
              </div>

              {/* Stacked Metrics Separated by Dividers */}
              <div className="divide-y divide-slate-100 dark:divide-slate-700/80 text-xs">
                {/* 1. Wind Speed & Direction */}
                <div className="py-2 flex items-center justify-between">
                  <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                    <Wind className="w-3.5 h-3.5 text-slate-400" />
                    <span>Angin Permukaan</span>
                  </span>
                  <div className="text-right">
                    <span className="font-bold text-slate-900 dark:text-white font-mono text-sm">
                      {windFormatted.value} {windFormatted.unit}
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 ml-1.5">
                      {cur?.windDirection_deg !== null ? `${cur?.windDirection_deg}° ${cur?.windDirection_compass}` : '--'}
                    </span>
                    {windGustFormatted && (
                      <span className="block text-[10px] text-amber-600 font-semibold font-mono">
                        Gust: {windGustFormatted.value} {windGustFormatted.unit}
                      </span>
                    )}
                  </div>
                </div>

                {/* 2. Humidity % and Dew Point */}
                <div className="py-2 flex items-center justify-between">
                  <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                    <Droplets className="w-3.5 h-3.5 text-sky-400" />
                    <span>Kelembapan Udara (RH)</span>
                  </span>
                  <div className="text-right">
                    <span className="font-bold text-slate-900 dark:text-white font-mono text-sm">
                      {cur?.humidity_pct ?? '--'}%
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 ml-1.5">
                      (Td: {dewPointFormatted.value} {dewPointFormatted.unit})
                    </span>
                  </div>
                </div>

                {/* 3. Surface Pressure & QNH */}
                <div className="py-2 flex items-center justify-between">
                  <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                    <Gauge className="w-3.5 h-3.5 text-slate-400" />
                    <span>Tekanan Udara / QNH</span>
                  </span>
                  <div className="text-right">
                    <span className="font-bold text-slate-900 dark:text-white font-mono text-sm">
                      {pressureFormatted.value} {pressureFormatted.unit}
                    </span>
                    {metar?.qnh_hpa && (
                      <span className="block text-[10px] text-blue-600 dark:text-blue-400 font-semibold font-mono">
                        METAR QNH: {metar.qnh_hpa} hPa
                      </span>
                    )}
                  </div>
                </div>

                {/* 4. Visibility */}
                <div className="py-2 flex items-center justify-between">
                  <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                    <Eye className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Jarak Pandang (Visibility)</span>
                  </span>
                  <div className="text-right">
                    <span className="font-bold text-slate-900 dark:text-white font-mono text-sm">
                      {visFormatted.value} {visFormatted.unit}
                    </span>
                    {visFormatted.secondary && (
                      <span className="block text-[10px] text-emerald-600 dark:text-emerald-400 font-mono">
                        {visFormatted.secondary}
                      </span>
                    )}
                  </div>
                </div>

                {/* 5. UV Index & Heat Index */}
                <div className="py-2 flex items-center justify-between">
                  <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                    <Sun className="w-3.5 h-3.5 text-amber-500" />
                    <span>UV &amp; Heat Index</span>
                  </span>
                  <div className="text-right">
                    <span className="font-bold text-slate-900 dark:text-white font-mono">
                      UV {cur?.uvIndex ?? '--'}
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 ml-1.5">
                      • Heat: {heatIndexFormatted.value} {heatIndexFormatted.unit}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Official Aviation METAR Sub-Card (Secondary Licensed Source) */}
            <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
              <div className="p-3 rounded-xl bg-slate-900 text-white space-y-2 border border-slate-800 shadow-2xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Plane className="w-3.5 h-3.5 text-sky-400" />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-sky-300">
                      METAR Resmi WIII (Aviation Weather)
                    </span>
                  </div>
                  {metar?.flightCategory && (
                    <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold font-mono ${
                      metar.flightCategory === 'VFR' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                    }`}>
                      {metar.flightCategory}
                    </span>
                  )}
                </div>

                {/* Raw METAR String */}
                <div className="font-mono text-[10.5px] p-2 rounded bg-slate-950 text-emerald-400 border border-slate-800 break-all select-all">
                  {metar?.raw || 'METAR WIII memuat data...'}
                </div>

                <div className="flex flex-wrap items-center justify-between text-[10px] text-slate-400 gap-1">
                  <span>Sumber: NOAA / ICAO Feed WIII</span>
                  <span>Obs: {metar?.observationTimeWib || '--:-- WIB'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* TAB 2: Hourly Forecast for Next 6-12 Hours (Requirement 2) */
        <div className="p-4 sm:p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                Prakiraan Cuaca &amp; Estimasi Aktivitas Satwa (12 Jam Mendatang)
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Proyeksi dinamika atmosfer sisi udara WIII dan perkiraan risiko penerbangan satwa liar.
              </p>
            </div>
            <span className="text-xs font-mono font-semibold text-slate-400">
              Interval 1 Jam
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {weather?.forecast12h.map((hour, idx) => {
              const hTemp = formatTemperature(hour.temp_c, unitSystem);
              const hWind = formatWindSpeed(hour.windSpeed_kt, unitSystem, metricWindUnit);
              const hRisk = getRiskBadgeDetails(hour.estimatedBirdRisk);

              return (
                <div
                  key={idx}
                  className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-700/20 hover:border-blue-300 dark:hover:border-blue-600 transition flex flex-col justify-between text-center space-y-2"
                >
                  <div>
                    <span className="font-bold text-xs text-slate-700 dark:text-slate-300 font-mono block">
                      {hour.hourLabel} WIB
                    </span>
                    <div className="my-2 flex justify-center">
                      {renderWeatherIcon(hour.weatherCode, 'w-8 h-8')}
                    </div>
                    <div className="text-base font-extrabold text-slate-900 dark:text-white font-mono">
                      {hTemp.value}{hTemp.unit}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                      {hour.conditionText}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 space-y-1 text-[10.5px]">
                    <div className="flex items-center justify-between text-slate-500">
                      <span>Peluang Hujan:</span>
                      <strong className="text-sky-600">{hour.precipitationProbability_pct}%</strong>
                    </div>
                    <div className="flex items-center justify-between text-slate-500">
                      <span>Angin:</span>
                      <strong className="text-slate-700 dark:text-slate-200">{hWind.value} {hWind.unit}</strong>
                    </div>
                    <div className="mt-1.5 pt-1 border-t border-slate-100 dark:border-slate-700">
                      <span className={`block px-1.5 py-0.5 rounded text-[9.5px] font-bold ${hRisk.badgeBg}`}>
                        {hRisk.label.split(' / ')[0]} RISK
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. Configurable Rule Table Modal */}
      {showRuleModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-blue-400" />
                <div>
                  <h4 className="font-bold text-sm">Tabel Aturan Evaluasi Risiko Satwa (Bird Activity Risk)</h4>
                  <p className="text-[11px] text-slate-400">Konfigurasi meteorologis operasional WIII Soekarno-Hatta</p>
                </div>
              </div>
              <button
                onClick={() => setShowRuleModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-4 sm:p-5 overflow-y-auto space-y-4 text-xs">
              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200">
                <div className="flex items-center gap-2 font-bold mb-1">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <span>Status: PENDING_WILDLIFE_HAZARD_TEAM_APPROVAL</span>
                </div>
                <p className="text-[11px] leading-relaxed">
                  Semua ambang batas (thresholds) di bawah ini merupakan nilai placeholder operasional standar yang harus divalidasi dan disahkan oleh Tim Wildlife Hazard Management Unit Bandara Soekarno-Hatta.
                </p>
              </div>

              <div className="space-y-3">
                {birdRulesConfig.rules.map((rule, idx) => (
                  <div
                    key={rule.id}
                    className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] text-slate-400">#{idx + 1}</span>
                        <span className="font-bold text-slate-900 dark:text-white text-xs">{rule.title}</span>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        rule.riskLevel === 'HIGH' ? 'bg-rose-600 text-white' : rule.riskLevel === 'MODERATE' ? 'bg-amber-500 text-slate-900' : 'bg-emerald-600 text-white'
                      }`}>
                        {rule.riskLevel}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-600 dark:text-slate-300">
                      {rule.description}
                    </p>

                    <div className="p-2 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-[10.5px] font-mono text-blue-700 dark:text-blue-300">
                      {rule.thresholdsNote}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-3 bg-slate-100 dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs">
              <span className="text-slate-500 text-[11px]">Tersimpan di: config/birdActivityRules.json</span>
              <button
                onClick={() => setShowRuleModal(false)}
                className="px-4 py-1.5 rounded-xl bg-slate-900 dark:bg-slate-700 text-white font-bold cursor-pointer hover:bg-slate-800"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
