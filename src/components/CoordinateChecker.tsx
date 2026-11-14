import React, { useState, useMemo } from 'react';
import { 
  MapPin, 
  Navigation, 
  AlertTriangle, 
  CheckCircle2, 
  Crosshair, 
  Compass, 
  Loader2, 
  Info,
  RotateCcw,
  Sliders,
  Check
} from 'lucide-react';
import { 
  DEFAULT_AIRPORT_ARP, 
  OPERATIONAL_RADIUS_PRESETS, 
  AIRPORT_COORDINATE_PRESETS, 
  evaluatePatrolCoordinates, 
  parseCombinedCoordinates, 
  CoordinatePreset,
  CoordinateCheckResult
} from '../utils/geoUtils';

interface CoordinateCheckerProps {
  latitude: string;
  longitude: string;
  onLatitudeChange: (lat: string) => void;
  onLongitudeChange: (lon: string) => void;
  operationalRadiusKm: number;
  onOperationalRadiusChange: (radius: number) => void;
  onPresetSelect?: (preset: CoordinatePreset) => void;
  confirmedOutsideReason?: string;
  onConfirmedOutsideReasonChange?: (reason: string) => void;
  onValidationChange?: (result: CoordinateCheckResult) => void;
}

export const CoordinateChecker: React.FC<CoordinateCheckerProps> = ({
  latitude,
  longitude,
  onLatitudeChange,
  onLongitudeChange,
  operationalRadiusKm,
  onOperationalRadiusChange,
  onPresetSelect,
  confirmedOutsideReason = '',
  onConfirmedOutsideReasonChange,
  onValidationChange
}) => {
  const [isGpsLoading, setIsGpsLoading] = useState<boolean>(false);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [pastedCoordInput, setPastedCoordInput] = useState<string>('');
  const [showRadiusCustomInput, setShowRadiusCustomInput] = useState<boolean>(false);
  const [customRadiusValue, setCustomRadiusValue] = useState<string>(String(operationalRadiusKm));

  // Evaluate coordinates against operational radius in real time
  const evalResult = useMemo(() => {
    const result = evaluatePatrolCoordinates(
      latitude, 
      longitude, 
      operationalRadiusKm, 
      DEFAULT_AIRPORT_ARP
    );
    if (onValidationChange) {
      onValidationChange(result);
    }
    return result;
  }, [latitude, longitude, operationalRadiusKm, onValidationChange]);

  // Handler for GPS Geolocation
  const handleGetLiveGPS = () => {
    setGpsError(null);
    if (!navigator.geolocation) {
      setGpsError('Perangkat atau browser tidak mendukung fitur GPS Geolocation.');
      return;
    }

    setIsGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsGpsLoading(false);
        const lat = pos.coords.latitude.toFixed(5);
        const lon = pos.coords.longitude.toFixed(5);
        onLatitudeChange(lat);
        onLongitudeChange(lon);
      },
      (err) => {
        setIsGpsLoading(false);
        switch (err.code) {
          case err.PERMISSION_DENIED:
            setGpsError('Izin akses lokasi GPS ditolak oleh browser/pengguna.');
            break;
          case err.POSITION_UNAVAILABLE:
            setGpsError('Sinyal GPS lokasi tidak terdeteksi saat ini.');
            break;
          case err.TIMEOUT:
            setGpsError('Permintaan sinyal GPS habis waktu (timeout).');
            break;
          default:
            setGpsError(`Gagal mendapatkan lokasi GPS: ${err.message}`);
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  // Handler for parsing pasted combined coordinate (e.g. "-6.1285, 106.6620")
  const handleApplyPastedCoordinate = () => {
    if (!pastedCoordInput.trim()) return;
    const parsed = parseCombinedCoordinates(pastedCoordInput);
    if (parsed) {
      onLatitudeChange(parsed.latitude.toFixed(5));
      onLongitudeChange(parsed.longitude.toFixed(5));
      setPastedCoordInput('');
      setGpsError(null);
    } else {
      setGpsError('Format koordinat tempel tidak valid. Gunakan format contoh: -6.12850, 106.66200');
    }
  };

  const handleSelectPreset = (presetName: string) => {
    const preset = AIRPORT_COORDINATE_PRESETS.find(p => p.name === presetName);
    if (preset) {
      onLatitudeChange(preset.latitude.toFixed(5));
      onLongitudeChange(preset.longitude.toFixed(5));
      if (onPresetSelect) {
        onPresetSelect(preset);
      }
      setGpsError(null);
    }
  };

  const handleResetToInfield = () => {
    const infieldPreset = AIRPORT_COORDINATE_PRESETS.find(p => p.grid === 'Grid E7') || AIRPORT_COORDINATE_PRESETS[0];
    onLatitudeChange(infieldPreset.latitude.toFixed(5));
    onLongitudeChange(infieldPreset.longitude.toFixed(5));
    if (onPresetSelect) {
      onPresetSelect(infieldPreset);
    }
    setGpsError(null);
  };

  return (
    <div className="bg-slate-50/80 border border-slate-200 rounded-lg p-3.5 space-y-3.5">
      {/* Header with Airport Reference Details */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-2.5">
        <div className="flex items-center space-x-2">
          <div className="w-7 h-7 rounded-md bg-sky-100 text-sky-700 flex items-center justify-center font-bold">
            <Compass className="w-4 h-4 text-sky-700" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <span>Pemeriksaan Geospasial &amp; Validasi Koordinat Patroli</span>
              <span className="bg-sky-100 text-sky-800 text-[10px] px-1.5 py-0.2 rounded font-mono font-bold">
                WIII / CGK
              </span>
            </h4>
            <p className="text-[10px] text-slate-500">
              Verifikasi titik lokasi terhadap Titik Referensi Bandara (ARP: {DEFAULT_AIRPORT_ARP.latitude}, {DEFAULT_AIRPORT_ARP.longitude})
            </p>
          </div>
        </div>

        {/* Airport Reference Info */}
        <div className="text-[10px] text-slate-600 bg-white px-2 py-1 rounded border border-slate-200 flex items-center gap-1.5 w-fit">
          <MapPin className="w-3 h-3 text-sky-600 shrink-0" />
          <span>ARP: <strong>{DEFAULT_AIRPORT_ARP.name}</strong></span>
        </div>
      </div>

      {/* Radius Operasional Selection Bar */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5 text-sky-600" />
            <span>Batas Radius Operasional Bandara yang Ditentukan:</span>
          </label>
          <span className="text-[10px] text-slate-500 font-mono">
            Radius Aktif: <strong className="text-sky-700">{operationalRadiusKm} km</strong>
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {OPERATIONAL_RADIUS_PRESETS.map((preset) => {
            const isSelected = operationalRadiusKm === preset.radiusKm;
            return (
              <button
                key={preset.radiusKm}
                type="button"
                onClick={() => {
                  onOperationalRadiusChange(preset.radiusKm);
                  setShowRadiusCustomInput(false);
                }}
                className={`p-2 rounded border text-left transition cursor-pointer flex flex-col justify-between ${
                  isSelected 
                    ? 'bg-sky-50/90 border-sky-500 ring-1 ring-sky-500 text-sky-900' 
                    : 'bg-white border-slate-200 hover:bg-slate-100 text-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-xs flex items-center gap-1">
                    {isSelected && <Check className="w-3.5 h-3.5 text-sky-600" />}
                    {preset.label}
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 line-clamp-2 leading-relaxed">
                  {preset.description}
                </p>
              </button>
            );
          })}
        </div>

        {/* Custom Radius Option */}
        <div className="mt-2 flex items-center gap-2">
          {!showRadiusCustomInput ? (
            <button
              type="button"
              onClick={() => setShowRadiusCustomInput(true)}
              className="text-[11px] text-sky-700 hover:text-sky-800 underline flex items-center gap-1 cursor-pointer"
            >
              + Gunakan Radius Khusus (Kustom km)
            </button>
          ) : (
            <div className="flex items-center gap-2 bg-white px-2 py-1 rounded border border-slate-300 w-full sm:w-auto">
              <span className="text-xs text-slate-600 font-semibold">Radius Kustom:</span>
              <input
                type="number"
                min="0.5"
                max="50"
                step="0.5"
                value={customRadiusValue}
                onChange={(e) => setCustomRadiusValue(e.target.value)}
                className="w-20 px-2 py-0.5 text-xs border border-slate-300 rounded text-center font-bold"
              />
              <span className="text-xs text-slate-500">km</span>
              <button
                type="button"
                onClick={() => {
                  const num = parseFloat(customRadiusValue);
                  if (!isNaN(num) && num > 0) {
                    onOperationalRadiusChange(num);
                  }
                }}
                className="px-2 py-0.5 text-xs bg-sky-600 hover:bg-sky-500 text-white rounded font-bold cursor-pointer"
              >
                Terapkan
              </button>
              <button
                type="button"
                onClick={() => setShowRadiusCustomInput(false)}
                className="text-xs text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                Batal
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Inputs for Coordinates */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 pt-1">
        {/* Latitude */}
        <div className="md:col-span-3">
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Latitude (° Lintang) <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={latitude}
            onChange={(e) => onLatitudeChange(e.target.value)}
            placeholder="-6.12850"
            className="w-full px-3 py-1.5 text-xs font-mono border border-slate-300 rounded focus:ring-1 focus:ring-sky-500 bg-white"
          />
          <p className="text-[10px] text-slate-400 mt-0.5">Contoh: -6.12850 (Selatan)</p>
        </div>

        {/* Longitude */}
        <div className="md:col-span-3">
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Longitude (° Bujur) <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={longitude}
            onChange={(e) => onLongitudeChange(e.target.value)}
            placeholder="106.66200"
            className="w-full px-3 py-1.5 text-xs font-mono border border-slate-300 rounded focus:ring-1 focus:ring-sky-500 bg-white"
          />
          <p className="text-[10px] text-slate-400 mt-0.5">Contoh: 106.66200 (Timur)</p>
        </div>

        {/* GPS Live & Preset Dropdown */}
        <div className="md:col-span-6 flex flex-col justify-between">
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Alat Cepat: GPS Lapangan / Preset Titik Bandara
          </label>
          <div className="flex flex-wrap gap-2">
            {/* GPS Detection Button */}
            <button
              type="button"
              onClick={handleGetLiveGPS}
              disabled={isGpsLoading}
              className="px-3 py-1.5 bg-sky-700 hover:bg-sky-600 disabled:bg-sky-400 text-white rounded text-xs font-bold flex items-center gap-1.5 shadow-2xs transition cursor-pointer"
              title="Ambil titik koordinat dari sensor GPS perangkat saat ini"
            >
              {isGpsLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Mendeteksi GPS...</span>
                </>
              ) : (
                <>
                  <Navigation className="w-3.5 h-3.5" />
                  <span>Ambil GPS Lapangan</span>
                </>
              )}
            </button>

            {/* Presets Dropdown */}
            <select
              onChange={(e) => handleSelectPreset(e.target.value)}
              className="flex-1 min-w-[170px] px-2.5 py-1.5 text-xs border border-slate-300 rounded bg-white font-medium text-slate-700 focus:ring-1 focus:ring-sky-500"
              defaultValue=""
            >
              <option value="" disabled>Pilih Preset Titik Bandara...</option>
              <optgroup label="Area Airside Bandara (Dalam Radius):">
                {AIRPORT_COORDINATE_PRESETS.filter(p => p.type !== 'outside').map(p => (
                  <option key={p.name} value={p.name}>
                    {p.name} ({p.grid})
                  </option>
                ))}
              </optgroup>
              <optgroup label="Area Luar Radius (Uji Peringatan Sistem):">
                {AIRPORT_COORDINATE_PRESETS.filter(p => p.type === 'outside').map(p => (
                  <option key={p.name} value={p.name}>
                    {p.name} ({p.grid})
                  </option>
                ))}
              </optgroup>
            </select>
          </div>

          {/* Paste combined string bar */}
          <div className="mt-1.5 flex items-center gap-1.5">
            <input
              type="text"
              value={pastedCoordInput}
              onChange={(e) => setPastedCoordInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleApplyPastedCoordinate();
                }
              }}
              placeholder="Tempel Lat, Long (contoh: -6.1285, 106.6620)..."
              className="flex-1 px-2.5 py-1 text-[11px] font-mono border border-slate-300 rounded bg-white"
            />
            <button
              type="button"
              onClick={handleApplyPastedCoordinate}
              className="px-2.5 py-1 bg-slate-200 hover:bg-slate-300 text-slate-800 text-[11px] font-bold rounded cursor-pointer transition"
            >
              Terapkan
            </button>
          </div>
        </div>
      </div>

      {/* GPS Error alert */}
      {gpsError && (
        <div className="p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700 flex items-center justify-between">
          <span>{gpsError}</span>
          <button 
            type="button" 
            onClick={() => setGpsError(null)} 
            className="text-red-500 hover:text-red-800 font-bold ml-2 cursor-pointer"
          >
            ×
          </button>
        </div>
      )}

      {/* VALIDATION STATUS & WARNING SECTION */}
      {evalResult.statusLevel === 'invalid_format' && (
        <div className="p-3 bg-red-50 border border-red-300 rounded-lg text-xs text-red-800 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">Format Koordinat Tidak Valid</p>
            <p className="text-[11px]">{evalResult.message}</p>
          </div>
        </div>
      )}

      {evalResult.statusLevel === 'valid_inside' && (
        <div className="p-3 bg-emerald-50/90 border border-emerald-300 rounded-lg text-xs text-emerald-900 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="font-bold text-emerald-900">
                Koordinat Terverifikasi di Dalam Radius Operasional Bandara
              </span>
            </div>
            <span className="px-2 py-0.5 bg-emerald-200 text-emerald-900 rounded font-mono font-bold text-[10px]">
              STATUS: VALID AIRSIDE
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs pt-1 border-t border-emerald-200/60 font-mono">
            <div className="bg-white/80 p-2 rounded border border-emerald-200">
              <span className="text-[10px] text-slate-500 block font-sans">Jarak ke ARP WIII</span>
              <strong className="text-emerald-800 text-sm">{evalResult.distanceFromArpKm} km</strong>
            </div>
            <div className="bg-white/80 p-2 rounded border border-emerald-200">
              <span className="text-[10px] text-slate-500 block font-sans">Batas Maksimal</span>
              <strong className="text-slate-800 text-sm">{evalResult.maxRadiusAllowedKm} km</strong>
            </div>
            <div className="bg-white/80 p-2 rounded border border-emerald-200">
              <span className="text-[10px] text-slate-500 block font-sans">Sisa Margin Batas</span>
              <strong className="text-emerald-700 text-sm">+{evalResult.remainingMarginKm} km</strong>
            </div>
            <div className="bg-white/80 p-2 rounded border border-emerald-200">
              <span className="text-[10px] text-slate-500 block font-sans">Arah Kompas / Sektor</span>
              <strong className="text-slate-800 text-sm">{evalResult.cardinalDirection} ({evalResult.bearingDegree}°)</strong>
            </div>
          </div>

          <p className="text-[11px] text-emerald-800 flex items-center gap-1 font-sans">
            <Info className="w-3.5 h-3.5 shrink-0" />
            Lokasi patroli ({evalResult.latitude}, {evalResult.longitude}) memenuhi parameter operasional airside dan aman untuk pelaporan.
          </p>
        </div>
      )}

      {/* OUT OF BOUNDS WARNING BANNER */}
      {evalResult.statusLevel === 'warning_outside' && (
        <div className="p-3.5 bg-rose-50 border-2 border-rose-400 rounded-lg text-rose-900 space-y-3 shadow-xs">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-start space-x-2">
              <div className="w-8 h-8 rounded-full bg-rose-100 border border-rose-300 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-4 h-4 text-rose-700 animate-pulse" />
              </div>
              <div>
                <h5 className="font-black text-sm text-rose-900 uppercase tracking-wide flex items-center gap-2">
                  <span>PERINGATAN: KOORDINAT DI LUAR RADIUS OPERASIONAL BANDARA!</span>
                </h5>
                <p className="text-xs text-rose-800 mt-0.5">
                  Titik koordinat patroli terdeteksi berada di luar batas radius operasional yang telah ditentukan ({evalResult.maxRadiusAllowedKm} km).
                </p>
              </div>
            </div>
            <span className="px-2.5 py-1 bg-rose-700 text-white rounded font-bold text-[10px] uppercase font-mono tracking-wider shrink-0">
              OUT OF BOUNDS
            </span>
          </div>

          {/* Metric Comparison Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
            <div className="bg-white p-2 rounded border border-rose-200 shadow-2xs">
              <span className="text-[10px] text-slate-500 block font-sans">Jarak Terdeteksi</span>
              <strong className="text-rose-700 text-sm">{evalResult.distanceFromArpKm} km</strong>
            </div>
            <div className="bg-white p-2 rounded border border-rose-200 shadow-2xs">
              <span className="text-[10px] text-slate-500 block font-sans">Batas Maksimal</span>
              <strong className="text-slate-800 text-sm">{evalResult.maxRadiusAllowedKm} km</strong>
            </div>
            <div className="bg-white p-2 rounded border border-rose-300 shadow-2xs bg-rose-50/50">
              <span className="text-[10px] text-rose-700 block font-sans font-bold">Kelebihan Jarak</span>
              <strong className="text-rose-700 text-sm font-black">+{evalResult.excessDistanceKm} km</strong>
            </div>
            <div className="bg-white p-2 rounded border border-rose-200 shadow-2xs">
              <span className="text-[10px] text-slate-500 block font-sans">Arah Kompas</span>
              <strong className="text-slate-800 text-sm">{evalResult.cardinalDirection} ({evalResult.bearingDegree}°)</strong>
            </div>
          </div>

          {/* Detailed Aviation Explanatory Warning */}
          <div className="bg-white/90 p-2.5 rounded border border-rose-200 text-xs text-slate-700 space-y-1 font-sans">
            <p className="font-semibold text-rose-900">
              Perhatian untuk Petugas Unit Wildlife Hazard:
            </p>
            <p className="text-[11px] leading-relaxed">
              Titik koordinat <strong>({evalResult.latitude}, {evalResult.longitude})</strong> berada sejauh <strong>{evalResult.distanceFromArpKm} km</strong> dari ARP Bandara Soekarno-Hatta (WIII), melampaui batas perimeter keselamatan operasi airside yang ditentukan (<strong>{evalResult.maxRadiusAllowedKm} km</strong>).
            </p>
            <p className="text-[11px] text-slate-600">
              SOP mewajibkan patroli rutin pergerakan udara dilaksanakan di dalam kawasan airside (runway, taxiway, infield, dan pagar perimeter bandara).
            </p>
          </div>

          {/* Remedial Actions */}
          <div className="pt-1 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 border-t border-rose-200">
            <button
              type="button"
              onClick={handleResetToInfield}
              className="px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 rounded text-xs font-bold flex items-center justify-center gap-1.5 shadow-2xs transition cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-600" />
              <span>Reset ke Koordinat Runway 1 Infield (Grid E7)</span>
            </button>

            <button
              type="button"
              onClick={handleGetLiveGPS}
              className="px-3 py-1.5 bg-rose-700 hover:bg-rose-600 text-white rounded text-xs font-bold flex items-center justify-center gap-1.5 shadow-2xs transition cursor-pointer"
            >
              <Crosshair className="w-3.5 h-3.5" />
              <span>Deteksi Ulang GPS Lapangan</span>
            </button>
          </div>

          {/* Justification input if this is legitimately an off-airport wildlife inspection */}
          <div className="p-2.5 bg-amber-50/80 border border-amber-300 rounded space-y-1.5">
            <label className="block text-xs font-bold text-amber-900">
              Justifikasi Khusus (Jika ini merupakan Survei Habitat Satwa di Luar Perimeter / Off-Airport):
            </label>
            <input
              type="text"
              value={confirmedOutsideReason}
              onChange={(e) => onConfirmedOutsideReasonChange && onConfirmedOutsideReasonChange(e.target.value)}
              placeholder="Contoh: Survei habitat migrasi burung kuntul di persawahan/rawa Tanjung Pasir luar perimeter..."
              className="w-full px-2.5 py-1.5 text-xs border border-amber-300 rounded bg-white focus:ring-1 focus:ring-amber-500 font-sans"
            />
            <p className="text-[10px] text-amber-800">
              *Jika titik di luar radius sengaja diambil untuk evaluasi atraktan eksternal ICAO, isi catatan justifikasi di atas sebelum menyimpan.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
