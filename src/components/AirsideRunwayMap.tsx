import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  Layers, 
  MapPin, 
  Eye, 
  Info, 
  Plane, 
  AlertTriangle, 
  ShieldCheck, 
  Compass, 
  Maximize2,
  Minimize2,
  Crosshair,
  Radio,
  Flame,
  Download,
  Share2,
  CheckCircle2,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Search,
  Filter,
  Activity,
  ShieldAlert
} from 'lucide-react';
import { PatrolReport, OccurrenceReport, WildlifeStrikeReport } from '../types';
import { 
  GRID_ROWS, 
  GRID_COLUMNS, 
  getGridCellInfo, 
  extractGridCode, 
  aggregateGridIncidents,
  GridCellInfo
} from '../utils/gridMapUtils';
import { exportStrikePDF, exportOccurrencePDF, exportPatrolPDF } from '../utils/pdfExport';

interface AirsideRunwayMapProps {
  patrols: PatrolReport[];
  occurrences: OccurrenceReport[];
  strikes: WildlifeStrikeReport[];
  selectedGridCell?: string | null;
  onSelectReport?: (type: 'patrol' | 'occurrence' | 'strike', id: string) => void;
  onSelectGrid?: (gridCell: string) => void;
  onOpenBroadcast?: (type: 'PATROL' | 'OCCURRENCE' | 'STRIKE', report: any) => void;
}

export const AirsideRunwayMap: React.FC<AirsideRunwayMapProps> = ({
  patrols,
  occurrences,
  strikes,
  selectedGridCell: externalSelectedGrid,
  onSelectReport,
  onSelectGrid,
  onOpenBroadcast
}) => {
  const [activeLayer, setActiveLayer] = useState<'all' | 'strikes' | 'occurrences' | 'patrols'>('all');
  const [showGridOverlay, setShowGridOverlay] = useState<boolean>(true);
  const [showHeatmap, setShowHeatmap] = useState<boolean>(true);
  const [hoveredCell, setHoveredCell] = useState<string | null>(null);
  const [selectedCell, setSelectedCell] = useState<string | null>(externalSelectedGrid || null);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const mapContainerRef = useRef<HTMLDivElement>(null);

  // Sync external selection from parent (e.g. from Dashboard incident list)
  useEffect(() => {
    if (externalSelectedGrid) {
      setSelectedCell(externalSelectedGrid);
    }
  }, [externalSelectedGrid]);

  // Aggregate incidents per grid cell
  const incidentMap = useMemo(() => {
    return aggregateGridIncidents(strikes, occurrences, patrols);
  }, [strikes, occurrences, patrols]);

  // Cells that have strikes or occurrences
  const activeIncidentCells = useMemo(() => {
    const list: {
      code: string;
      strikes: WildlifeStrikeReport[];
      occurrences: OccurrenceReport[];
      threatLevel: 'critical' | 'warning' | 'patrol';
      hasDamage: boolean;
    }[] = [];

    incidentMap.forEach((entry, code) => {
      if (entry.strikes.length > 0 || entry.occurrences.length > 0) {
        list.push({
          code,
          strikes: entry.strikes,
          occurrences: entry.occurrences,
          threatLevel: entry.threatLevel as any,
          hasDamage: entry.hasDamage
        });
      }
    });

    return list.sort((a, b) => {
      // Prioritize strikes, then damage, then occurrences
      if (a.strikes.length !== b.strikes.length) return b.strikes.length - a.strikes.length;
      if (a.hasDamage && !b.hasDamage) return -1;
      if (!a.hasDamage && b.hasDamage) return 1;
      return b.occurrences.length - a.occurrences.length;
    });
  }, [incidentMap]);

  // Map dimensions
  const viewBoxWidth = 1400;
  const viewBoxHeight = 700;
  const colWidth = viewBoxWidth / 14; // 100 px per col
  const rowHeight = viewBoxHeight / 7; // 100 px per row

  // Coordinate helper
  const getCellCenter = (colNum: number, rowLetter: string) => {
    const cIdx = colNum - 1;
    const rIdx = GRID_ROWS.indexOf(rowLetter as any);
    return {
      x: cIdx * colWidth + colWidth / 2,
      y: rIdx * rowHeight + rowHeight / 2
    };
  };

  const handleCellClick = (cellCode: string) => {
    const nextCell = cellCode === selectedCell ? null : cellCode;
    setSelectedCell(nextCell);
    if (onSelectGrid && nextCell) {
      onSelectGrid(nextCell);
    }
  };

  // Get info for the selected cell
  const selectedCellDetails = useMemo(() => {
    if (!selectedCell) return null;
    const info = getGridCellInfo(selectedCell);
    const incidents = incidentMap.get(selectedCell) || {
      cellCode: selectedCell,
      strikes: [],
      occurrences: [],
      patrols: [],
      totalIncidents: 0,
      hasDamage: false,
      threatLevel: 'normal'
    };
    return { ...info, ...incidents };
  }, [selectedCell, incidentMap]);

  return (
    <div 
      id="airside-grid-map"
      ref={mapContainerRef}
      className={`bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl text-slate-200 transition-all duration-300 ${
        isFullscreen ? 'fixed inset-0 z-50 rounded-none overflow-y-auto' : ''
      }`}
    >
      {/* 1. Official Header & Operational Banner */}
      <div className="p-4 bg-gradient-to-r from-slate-950 via-slate-900 to-sky-950/40 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-sky-950 border border-sky-600/50 flex items-center justify-center text-sky-400 shadow-inner">
            <Compass className="w-5 h-5 animate-spin-slow" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-black tracking-widest text-amber-400 bg-amber-950/60 border border-amber-800/60 px-2 py-0.5 rounded">
                INJOURNEY AIRPORTS
              </span>
              <span className="text-[11px] font-mono text-slate-300 font-bold">ICAO: WIII / CGK</span>
              <span className="text-[10px] bg-sky-900/60 text-sky-300 font-mono px-2 py-0.5 rounded border border-sky-700">
                AERODROME GRID MAP 14×7 (REV. 2025)
              </span>
              {activeIncidentCells.length > 0 && (
                <span className="text-[10px] bg-rose-950/80 text-rose-300 font-mono px-2 py-0.5 rounded border border-rose-700 flex items-center gap-1 animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                  {activeIncidentCells.length} SEKTOR TERDAMPAK
                </span>
              )}
            </div>
            <h3 className="font-extrabold text-sm sm:text-base text-white tracking-wide mt-0.5 flex items-center gap-2">
              <span>AIRSIDE WILDLIFE INCIDENT &amp; HAZARD GRID RADAR</span>
              <span className="text-xs font-normal text-slate-400 hidden md:inline">
                | Soekarno-Hatta International Airport
              </span>
            </h3>
          </div>
        </div>

        {/* Map Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Heatmap Toggle */}
          <button
            onClick={() => setShowHeatmap(!showHeatmap)}
            className={`px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
              showHeatmap 
                ? 'bg-rose-950/80 border-rose-500/80 text-rose-300 shadow-sm' 
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
            }`}
            title="Tampilkan Zona Bahaya / Hotspot Satwa"
          >
            <Flame className="w-3.5 h-3.5 text-rose-400" />
            <span>Zona Hotspot {showHeatmap ? 'ON' : 'OFF'}</span>
          </button>

          {/* Grid Lines Toggle */}
          <button
            onClick={() => setShowGridOverlay(!showGridOverlay)}
            className={`px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
              showGridOverlay 
                ? 'bg-sky-950/80 border-sky-500/80 text-sky-300 shadow-sm' 
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
            }`}
            title="Toggle Grid Koordinat 14x7"
          >
            <Crosshair className="w-3.5 h-3.5 text-sky-400" />
            <span>Grid 14×7 {showGridOverlay ? 'ON' : 'OFF'}</span>
          </button>

          {/* Layer Filter Buttons */}
          <div className="flex items-center space-x-1 bg-slate-900 p-1 rounded-lg border border-slate-800 text-xs">
            <button
              onClick={() => setActiveLayer('all')}
              className={`px-2.5 py-1 rounded transition ${activeLayer === 'all' ? 'bg-sky-600 text-white font-bold shadow' : 'text-slate-400 hover:text-white'}`}
            >
              Semua ({strikes.length + occurrences.length + patrols.length})
            </button>
            <button
              onClick={() => setActiveLayer('strikes')}
              className={`px-2.5 py-1 rounded transition flex items-center gap-1 ${activeLayer === 'strikes' ? 'bg-rose-700 text-white font-bold shadow' : 'text-slate-400 hover:text-white'}`}
            >
              <span className="w-2 h-2 rounded-full bg-rose-400"></span>
              Strike ({strikes.length})
            </button>
            <button
              onClick={() => setActiveLayer('occurrences')}
              className={`px-2.5 py-1 rounded transition flex items-center gap-1 ${activeLayer === 'occurrences' ? 'bg-amber-600 text-white font-bold shadow' : 'text-slate-400 hover:text-white'}`}
            >
              <span className="w-2 h-2 rounded-full bg-amber-400"></span>
              Occurrence ({occurrences.length})
            </button>
            <button
              onClick={() => setActiveLayer('patrols')}
              className={`px-2.5 py-1 rounded transition flex items-center gap-1 ${activeLayer === 'patrols' ? 'bg-blue-600 text-white font-bold shadow' : 'text-slate-400 hover:text-white'}`}
            >
              <span className="w-2 h-2 rounded-full bg-blue-400"></span>
              Patroli ({patrols.length})
            </button>
          </div>

          {/* Fullscreen / Expand Toggle */}
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1.5 rounded-lg border border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white transition"
            title={isFullscreen ? 'Perkecil Tampilan' : 'Layar Penuh / Command Center Mode'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* 2. Airside Incident Quick-Jump Ticker (When there are strikes or occurrences) */}
      <div className="px-4 py-2.5 bg-slate-900/90 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center space-x-2">
          <Radio className="w-4 h-4 text-rose-500 animate-pulse" />
          <span className="font-bold text-slate-200">RADAR INSIDEN AIRSIDE:</span>
          {activeIncidentCells.length === 0 ? (
            <span className="text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Tidak ada kejadian aktif di runway/taxiway (Kondisi Clear)
            </span>
          ) : (
            <span className="text-slate-400">
              Pilih kejadian untuk fokus otomatis ke sektor grid:
            </span>
          )}
        </div>

        {/* Quick jump chips */}
        <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto max-w-full py-0.5">
          {activeIncidentCells.map(item => {
            const isSelected = selectedCell === item.code;
            const hasStrike = item.strikes.length > 0;
            const strikeFlight = item.strikes[0]?.flightNumber;
            const occSpecies = item.occurrences[0]?.jenisSatwa;

            return (
              <button
                key={`incident-chip-${item.code}`}
                onClick={() => handleCellClick(item.code)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-semibold flex items-center gap-1.5 transition cursor-pointer border ${
                  isSelected
                    ? 'bg-sky-600 text-white border-sky-400 shadow-md ring-2 ring-sky-400/40'
                    : hasStrike
                    ? 'bg-rose-950/70 text-rose-200 border-rose-700/80 hover:bg-rose-900'
                    : 'bg-amber-950/70 text-amber-200 border-amber-700/80 hover:bg-amber-900'
                }`}
              >
                <span className="font-mono font-bold bg-black/40 px-1 py-0.2 rounded text-[10px]">
                  {item.code}
                </span>
                {hasStrike ? (
                  <span className="flex items-center gap-1">
                    <Plane className="w-3 h-3 text-rose-400" />
                    <span>{strikeFlight ? `STRIKE ${strikeFlight}` : 'STRIKE'}</span>
                    {item.hasDamage && <span className="text-[9px] text-amber-300 font-bold">⚠️DMG</span>}
                  </span>
                ) : (
                  <span className="flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3 text-amber-400" />
                    <span>{occSpecies ? `OCC: ${occSpecies}` : 'OCCURRENCE'}</span>
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Aerodrome Coordinates Reference Banner */}
      <div className="px-4 py-1.5 bg-slate-950/90 border-b border-slate-800/80 text-[11px] flex flex-wrap items-center justify-between gap-y-1 text-slate-300 font-mono">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-slate-400">
          <span><strong>ARP WIII:</strong> 06°07'25" S &amp; 106°39'40" E</span>
          <span>•</span>
          <span><strong>ELEV:</strong> 34 Ft (10 m)</span>
          <span>•</span>
          <span><strong>Zona Waktu:</strong> WIB (UTC+7)</span>
        </div>
        <div className="flex flex-wrap items-center gap-x-3 text-xs">
          <span className="text-emerald-400 font-medium">RWY 1: 07R-25L (3600×60m Rigid)</span>
          <span className="text-slate-600">|</span>
          <span className="text-sky-400 font-medium">RWY 2: 07L-25R (3660×60m Rigid)</span>
          <span className="text-slate-600">|</span>
          <span className="text-amber-400 font-medium">RWY 3: 06-24 (3000×60m Flex)</span>
        </div>
      </div>

      {/* 4. Main Interactive Airside Map SVG Viewport */}
      <div className={`relative w-full aspect-[2/1] bg-[#0c131d] overflow-hidden select-none ${
        isFullscreen ? 'min-h-[600px] h-[calc(100vh-280px)] aspect-auto' : 'min-h-[420px] sm:min-h-[520px]'
      }`}>
        <svg
          viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`}
          className="w-full h-full"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Patterns and Gradients */}
            <pattern id="airsideGrass" width="40" height="40" patternUnits="userSpaceOnUse">
              <rect width="40" height="40" fill="#082017" />
              <circle cx="20" cy="20" r="1" fill="#0d3b2b" opacity="0.6" />
            </pattern>
            <linearGradient id="lakeWater" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#0369a1" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#075985" stopOpacity="0.8" />
            </linearGradient>

            {/* Glowing filter effects for strike/warning */}
            <filter id="glowRed" x="-30%" y="-30%" width="160%" height="160%">
              <feDropShadow dx="0" dy="0" stdDeviation="6" floodColor="#f43f5e" />
            </filter>
            <filter id="glowAmber" x="-30%" y="-30%" width="160%" height="160%">
              <feDropShadow dx="0" dy="0" stdDeviation="5" floodColor="#f59e0b" />
            </filter>
            <filter id="glowSky" x="-30%" y="-30%" width="160%" height="160%">
              <feDropShadow dx="0" dy="0" stdDeviation="5" floodColor="#0284c7" />
            </filter>
          </defs>

          {/* Base Airfield Grass Fill */}
          <rect x="0" y="0" width={viewBoxWidth} height={viewBoxHeight} fill="url(#airsideGrass)" />

          {/* Airport Boundary Lines */}
          <rect x="15" y="15" width={viewBoxWidth - 30} height={viewBoxHeight - 30} rx="10" fill="none" stroke="#1e3a2f" strokeWidth="2" strokeDasharray="8,6" />

          {/* Water Bodies & Open Water Storage */}
          {/* West Retention Ponds (Row C/D Col 1-2) */}
          <path d="M 60 210 Q 110 200 150 240 Q 120 310 60 290 Z" fill="url(#lakeWater)" stroke="#38bdf8" strokeWidth="1.5" />
          <text x="100" y="255" fill="#bae6fd" fontSize="10" fontWeight="bold" textAnchor="middle">12. OPEN WATER</text>

          {/* East Retention Basin (Row D/E Col 13-14) */}
          <path d="M 1250 330 Q 1330 310 1370 380 Q 1330 460 1260 430 Z" fill="url(#lakeWater)" stroke="#38bdf8" strokeWidth="1.5" />
          <text x="1310" y="385" fill="#bae6fd" fontSize="10" fontWeight="bold" textAnchor="middle">10. WATER ARFF</text>

          {/* Runway 3: 06 - 24 (Row A-B, Col 3 to 12) - Flexible Surface 3000 x 60m */}
          <g id="runway-3-06-24">
            <rect x="230" y="85" width="940" height="40" fill="#1e293b" stroke="#64748b" strokeWidth="2" rx="2" />
            <line x1="270" y1="105" x2="1130" y2="105" stroke="#f1f5f9" strokeWidth="2.5" strokeDasharray="28,20" />
            <rect x="240" y="88" width="6" height="34" fill="#ffffff" />
            <rect x="250" y="88" width="6" height="34" fill="#ffffff" />
            <text x="280" y="110" fill="#ffffff" fontSize="14" fontWeight="black" fontFamily="monospace">06</text>
            <rect x="1154" y="88" width="6" height="34" fill="#ffffff" />
            <rect x="1144" y="88" width="6" height="34" fill="#ffffff" />
            <text x="1115" y="110" fill="#ffffff" fontSize="14" fontWeight="black" fontFamily="monospace">24</text>
            <text x="700" y="78" fill="#e2e8f0" fontSize="11" fontWeight="bold" textAnchor="middle">RUNWAY 3: 06 - 24 (3000 x 60 m Flexible)</text>
          </g>

          {/* Runway 2: 07L - 25R (Row B-C, Col 2 to 13) - Rigid Surface 3660 x 60m */}
          <g id="runway-2-07L-25R">
            <rect x="140" y="195" width="1120" height="44" fill="#1e293b" stroke="#94a3b8" strokeWidth="2.5" rx="2" />
            <line x1="190" y1="217" x2="1210" y2="217" stroke="#ffffff" strokeWidth="3" strokeDasharray="30,20" />
            <rect x="152" y="199" width="7" height="36" fill="#ffffff" />
            <rect x="164" y="199" width="7" height="36" fill="#ffffff" />
            <text x="200" y="222" fill="#ffffff" fontSize="15" fontWeight="black" fontFamily="monospace">07L</text>
            <rect x="1241" y="199" width="7" height="36" fill="#ffffff" />
            <rect x="1229" y="199" width="7" height="36" fill="#ffffff" />
            <text x="1190" y="222" fill="#ffffff" fontSize="15" fontWeight="black" fontFamily="monospace">25R</text>
            <text x="700" y="188" fill="#93c5fd" fontSize="11" fontWeight="bold" textAnchor="middle">RUNWAY 2: 07L - 25R (3660 x 60 m Rigid)</text>
          </g>

          {/* Runway 1: 07R - 25L (Row F-G, Col 2 to 13) - Rigid Surface 3600 x 60m */}
          <g id="runway-1-07R-25L">
            <rect x="150" y="560" width="1100" height="44" fill="#1e293b" stroke="#94a3b8" strokeWidth="2.5" rx="2" />
            <line x1="200" y1="582" x2="1200" y2="582" stroke="#ffffff" strokeWidth="3" strokeDasharray="30,20" />
            <rect x="162" y="564" width="7" height="36" fill="#ffffff" />
            <rect x="174" y="564" width="7" height="36" fill="#ffffff" />
            <text x="210" y="587" fill="#ffffff" fontSize="15" fontWeight="black" fontFamily="monospace">07R</text>
            <rect x="1231" y="564" width="7" height="36" fill="#ffffff" />
            <rect x="1219" y="564" width="7" height="36" fill="#ffffff" />
            <text x="1180" y="587" fill="#ffffff" fontSize="15" fontWeight="black" fontFamily="monospace">25L</text>
            <text x="700" y="622" fill="#86efac" fontSize="11" fontWeight="bold" textAnchor="middle">RUNWAY 1: 07R - 25L (3600 x 60 m Rigid)</text>
          </g>

          {/* Taxiways */}
          <g id="taxiways" stroke="#f59e0b" strokeWidth="3.5" fill="none">
            <line x1="300" y1="239" x2="300" y2="560" stroke="#f59e0b" strokeWidth="4" />
            <line x1="300" y1="125" x2="300" y2="195" stroke="#f59e0b" strokeWidth="3" />
            <text x="312" y="270" fill="#fef08a" fontSize="10" fontWeight="bold" stroke="none">TWY W</text>

            <line x1="680" y1="239" x2="680" y2="350" stroke="#f59e0b" strokeWidth="4" />
            <line x1="720" y1="450" x2="720" y2="560" stroke="#f59e0b" strokeWidth="4" />

            <line x1="1100" y1="125" x2="1100" y2="239" stroke="#f59e0b" strokeWidth="3" />
            <line x1="1100" y1="239" x2="1100" y2="560" stroke="#f59e0b" strokeWidth="4" />
            <text x="1112" y="270" fill="#fef08a" fontSize="10" fontWeight="bold" stroke="none">TWY E</text>

            <line x1="150" y1="520" x2="1250" y2="520" stroke="#475569" strokeWidth="18" />
            <line x1="150" y1="520" x2="1250" y2="520" stroke="#f59e0b" strokeWidth="2" strokeDasharray="15,15" />
            <text x="700" y="524" fill="#fef08a" fontSize="10" fontWeight="bold" stroke="none" textAnchor="middle">PARALLEL TAXIWAY SOUTH (PAPA)</text>

            <line x1="140" y1="280" x2="1260" y2="280" stroke="#475569" strokeWidth="18" />
            <line x1="140" y1="280" x2="1260" y2="280" stroke="#f59e0b" strokeWidth="2" strokeDasharray="15,15" />
            <text x="700" y="284" fill="#fef08a" fontSize="10" fontWeight="bold" stroke="none" textAnchor="middle">PARALLEL TAXIWAY NORTH (NOVEMBER)</text>
          </g>

          {/* Central Buildings & Terminals */}
          {/* Terminal 1 (M) */}
          <g id="terminal-1">
            <path d="M 520 440 L 880 440 L 850 490 L 550 490 Z" fill="#334155" stroke="#64748b" strokeWidth="2" />
            <circle cx="580" cy="465" r="16" fill="#1e293b" stroke="#0ea5e9" strokeWidth="1.5" />
            <circle cx="700" cy="465" r="16" fill="#1e293b" stroke="#0ea5e9" strokeWidth="1.5" />
            <circle cx="820" cy="465" r="16" fill="#1e293b" stroke="#0ea5e9" strokeWidth="1.5" />
            <text x="700" y="470" fill="#ffffff" fontSize="12" fontWeight="black" textAnchor="middle">M. TERMINAL 1</text>
          </g>

          {/* Terminal 2 (N) */}
          <g id="terminal-2">
            <path d="M 520 350 L 880 350 L 850 305 L 550 305 Z" fill="#334155" stroke="#64748b" strokeWidth="2" />
            <circle cx="580" cy="328" r="16" fill="#1e293b" stroke="#0ea5e9" strokeWidth="1.5" />
            <circle cx="700" cy="328" r="16" fill="#1e293b" stroke="#0ea5e9" strokeWidth="1.5" />
            <circle cx="820" cy="328" r="16" fill="#1e293b" stroke="#0ea5e9" strokeWidth="1.5" />
            <text x="700" y="333" fill="#ffffff" fontSize="12" fontWeight="black" textAnchor="middle">N. TERMINAL 2</text>
          </g>

          {/* Terminal 3 (O) */}
          <g id="terminal-3">
            <rect x="980" y="320" width="230" height="150" rx="6" fill="#1e293b" stroke="#38bdf8" strokeWidth="2" />
            <rect x="990" y="330" width="40" height="130" fill="#0f172a" stroke="#0284c7" strokeWidth="1" />
            <rect x="1160" y="330" width="40" height="130" fill="#0f172a" stroke="#0284c7" strokeWidth="1" />
            <text x="1095" y="395" fill="#ffffff" fontSize="13" fontWeight="black" textAnchor="middle">O. TERMINAL 3</text>
            <text x="1095" y="412" fill="#7dd3fc" fontSize="9" fontWeight="bold" textAnchor="middle">EAST APRON &amp; PIER</text>
          </g>

          {/* Cargo Terminal (P) */}
          <g id="cargo-terminal">
            <rect x="1050" y="485" width="160" height="28" fill="#334155" stroke="#94a3b8" strokeWidth="1.5" rx="3" />
            <text x="1130" y="503" fill="#f1f5f9" fontSize="10" fontWeight="bold" textAnchor="middle">P. CARGO TERMINAL</text>
          </g>

          {/* DPPU Pertamina (A) */}
          <g id="dppu-pertamina">
            <circle cx="120" cy="260" r="18" fill="#450a0a" stroke="#ef4444" strokeWidth="1.5" />
            <text x="120" y="264" fill="#fca5a5" fontSize="9" fontWeight="black" textAnchor="middle">A. DPPU</text>
          </g>

          {/* Tower JATSC & Gedung AOCC */}
          <g id="jatsc-tower-aocc">
            <circle cx="680" cy="395" r="14" fill="#0f172a" stroke="#f59e0b" strokeWidth="2" />
            <text x="680" y="399" fill="#fef08a" fontSize="10" fontWeight="black" textAnchor="middle">L</text>
            <text x="680" y="420" fill="#cbd5e1" fontSize="9" fontWeight="bold" textAnchor="middle">TOWER JATSC</text>
            <rect x="715" y="385" width="45" height="22" fill="#1e3a8a" stroke="#60a5fa" strokeWidth="1.5" rx="3" />
            <text x="737" y="400" fill="#dbeafe" fontSize="9" fontWeight="bold" textAnchor="middle">R. AOCC</text>
          </g>

          {/* ARFF Fire Stations */}
          <g id="fire-stations">
            <rect x="420" y="160" width="30" height="18" fill="#7f1d1d" stroke="#f87171" strokeWidth="1" rx="2" />
            <text x="435" y="173" fill="#fecaca" fontSize="9" fontWeight="bold" textAnchor="middle">17</text>
            <rect x="780" y="388" width="32" height="18" fill="#7f1d1d" stroke="#f87171" strokeWidth="1" rx="2" />
            <text x="796" y="401" fill="#fecaca" fontSize="9" fontWeight="bold" textAnchor="middle">17 MAIN</text>
            <rect x="420" y="525" width="30" height="18" fill="#7f1d1d" stroke="#f87171" strokeWidth="1" rx="2" />
            <text x="435" y="538" fill="#fecaca" fontSize="9" fontWeight="bold" textAnchor="middle">17</text>
          </g>

          {/* Patrol Route Visual Tracking Line */}
          {(activeLayer === 'all' || activeLayer === 'patrols') && (
            <g id="patrol-route-line">
              <path
                d="M 120 70 L 1280 70 L 1280 630 L 120 630 Z"
                fill="none"
                stroke="#38bdf8"
                strokeWidth="2"
                strokeDasharray="8,6"
                opacity="0.8"
              />
              <path
                d="M 300 125 L 300 560 L 680 560 L 680 239 L 1100 239 L 1100 560"
                fill="none"
                stroke="#38bdf8"
                strokeWidth="1.5"
                strokeDasharray="4,4"
                opacity="0.6"
              />
            </g>
          )}

          {/* ============================================================== */}
          {/* 5. 14 x 7 GRID OVERLAY & HOTSPOT HEATMAP ZONES                  */}
          {/* ============================================================== */}
          {showGridOverlay && (
            <g id="grid-map-overlay">
              {/* Vertical Grid Lines (14 Columns) */}
              {GRID_COLUMNS.map(c => {
                const x = (c - 1) * colWidth;
                return (
                  <g key={`col-line-${c}`}>
                    <line
                      x1={x}
                      y1="0"
                      x2={x}
                      y2={viewBoxHeight}
                      stroke="#38bdf8"
                      strokeWidth={c === 1 ? 0 : 0.8}
                      strokeDasharray="4,3"
                      opacity="0.4"
                    />
                    {/* Top Column Number Badges */}
                    <rect x={x + 35} y="4" width="30" height="18" rx="3" fill="#0f172a" stroke="#0284c7" strokeWidth="1" />
                    <text x={x + 50} y="17" fill="#7dd3fc" fontSize="11" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
                      {c}
                    </text>
                    {/* Bottom Column Number Badges */}
                    <rect x={x + 35} y={viewBoxHeight - 22} width="30" height="18" rx="3" fill="#0f172a" stroke="#0284c7" strokeWidth="1" />
                    <text x={x + 50} y={viewBoxHeight - 9} fill="#7dd3fc" fontSize="11" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
                      {c}
                    </text>
                  </g>
                );
              })}

              {/* Horizontal Grid Lines (7 Rows A to G) */}
              {GRID_ROWS.map((r, rIdx) => {
                const y = rIdx * rowHeight;
                return (
                  <g key={`row-line-${r}`}>
                    <line
                      x1="0"
                      y1={y}
                      x2={viewBoxWidth}
                      y2={y}
                      stroke="#38bdf8"
                      strokeWidth={rIdx === 0 ? 0 : 0.8}
                      strokeDasharray="4,3"
                      opacity="0.4"
                    />
                    {/* Left Row Letter Badges */}
                    <rect x="4" y={y + 35} width="22" height="30" rx="3" fill="#0f172a" stroke="#0284c7" strokeWidth="1" />
                    <text x="15" y={y + 55} fill="#7dd3fc" fontSize="13" fontWeight="black" textAnchor="middle" fontFamily="monospace">
                      {r}
                    </text>
                    {/* Right Row Letter Badges */}
                    <rect x={viewBoxWidth - 26} y={y + 35} width="22" height="30" rx="3" fill="#0f172a" stroke="#0284c7" strokeWidth="1" />
                    <text x={viewBoxWidth - 15} y={y + 55} fill="#7dd3fc" fontSize="13" fontWeight="black" textAnchor="middle" fontFamily="monospace">
                      {r}
                    </text>
                  </g>
                );
              })}

              {/* Interactive Grid Cell Targets (Clickable/Hoverable/Heatmap) */}
              {GRID_ROWS.map(r =>
                GRID_COLUMNS.map(c => {
                  const cellCode = `${r}${c}`;
                  const x = (c - 1) * colWidth;
                  const y = GRID_ROWS.indexOf(r) * rowHeight;
                  const isHovered = hoveredCell === cellCode;
                  const isSelected = selectedCell === cellCode;
                  const cellIncidents = incidentMap.get(cellCode);
                  const hasStrike = (cellIncidents?.strikes.length || 0) > 0;
                  const hasOcc = (cellIncidents?.occurrences.length || 0) > 0;
                  const hasPatrol = (cellIncidents?.patrols.length || 0) > 0;

                  // Determine Heatmap color & opacity
                  let cellFill = 'transparent';
                  let cellOpacity = 0;
                  let cellStroke = 'none';
                  let strokeWidth = 1;

                  if (isSelected) {
                    cellFill = '#0284c7';
                    cellOpacity = 0.3;
                    cellStroke = '#38bdf8';
                    strokeWidth = 2.5;
                  } else if (showHeatmap && hasStrike && (activeLayer === 'all' || activeLayer === 'strikes')) {
                    cellFill = '#ef4444';
                    cellOpacity = isHovered ? 0.38 : 0.22;
                    cellStroke = '#f87171';
                    strokeWidth = 1.5;
                  } else if (showHeatmap && hasOcc && (activeLayer === 'all' || activeLayer === 'occurrences')) {
                    cellFill = '#f59e0b';
                    cellOpacity = isHovered ? 0.32 : 0.18;
                    cellStroke = '#fbbf24';
                    strokeWidth = 1.5;
                  } else if (isHovered) {
                    cellFill = '#38bdf8';
                    cellOpacity = 0.12;
                    cellStroke = '#7dd3fc';
                    strokeWidth = 1;
                  }

                  return (
                    <g key={`grid-cell-group-${cellCode}`}>
                      <rect
                        x={x}
                        y={y}
                        width={colWidth}
                        height={rowHeight}
                        fill={cellFill}
                        fillOpacity={cellOpacity}
                        stroke={cellStroke}
                        strokeWidth={strokeWidth}
                        className="cursor-pointer transition duration-150"
                        onMouseEnter={() => setHoveredCell(cellCode)}
                        onMouseLeave={() => setHoveredCell(null)}
                        onClick={() => handleCellClick(cellCode)}
                      >
                        <title>{`CGK Grid ${cellCode} - ${hasStrike ? `${cellIncidents?.strikes.length} Strike` : hasOcc ? `${cellIncidents?.occurrences.length} Occurrence` : 'Clear'}`}</title>
                      </rect>

                      {/* Small Sektor Corner Watermark */}
                      <text
                        x={x + 6}
                        y={y + 14}
                        fill={isSelected ? '#38bdf8' : hasStrike ? '#fca5a5' : hasOcc ? '#fde68a' : '#475569'}
                        fontSize="9"
                        fontWeight="bold"
                        fontFamily="monospace"
                        opacity={isHovered || isSelected || hasStrike || hasOcc ? 0.9 : 0.3}
                        pointerEvents="none"
                      >
                        {cellCode}
                      </text>
                    </g>
                  );
                })
              )}
            </g>
          )}

          {/* ============================================================== */}
          {/* 6. DYNAMIC INCIDENT PLOTTING (STRIKES & OCCURRENCES)           */}
          {/* ============================================================== */}
          {Array.from(incidentMap.entries()).map(([cellCode, data]) => {
            const rowLetter = cellCode.charAt(0);
            const colNumber = parseInt(cellCode.slice(1), 10);
            const pt = getCellCenter(colNumber, rowLetter);
            const isSelected = selectedCell === cellCode;

            const showStrikes = (activeLayer === 'all' || activeLayer === 'strikes') && data.strikes.length > 0;
            const showOccurrences = (activeLayer === 'all' || activeLayer === 'occurrences') && data.occurrences.length > 0;
            const showPatrols = (activeLayer === 'all' || activeLayer === 'patrols') && data.patrols.length > 0 && !showStrikes && !showOccurrences;

            if (!showStrikes && !showOccurrences && !showPatrols) return null;

            return (
              <g 
                key={`incident-marker-${cellCode}`}
                className="cursor-pointer group"
                onClick={(e) => {
                  e.stopPropagation();
                  handleCellClick(cellCode);
                }}
              >
                {/* 1. Strike Marker (High Priority Red Beacon) */}
                {showStrikes && (
                  <g transform={`translate(${pt.x}, ${pt.y - 12})`}>
                    {/* Animated Radar Pulse Rings */}
                    <circle cx="0" cy="0" r="24" fill="#ef4444" opacity="0.3" className="animate-ping" />
                    <circle cx="0" cy="0" r="16" fill="#dc2626" opacity="0.5" />
                    <circle cx="0" cy="0" r="12" fill="#b91c1c" stroke="#ffffff" strokeWidth="2.5" filter="url(#glowRed)" />
                    
                    {/* Strike Icon glyph */}
                    <text x="0" y="4" fill="#ffffff" fontSize="11" fontWeight="black" textAnchor="middle">
                      ⚡
                    </text>

                    {/* Flight & Sector Callout Badge */}
                    <g transform="translate(0, -22)">
                      <rect 
                        x="-36" 
                        y="-12" 
                        width="72" 
                        height="16" 
                        rx="4" 
                        fill="#7f1d1d" 
                        stroke="#fca5a5" 
                        strokeWidth="1.2" 
                        className="shadow"
                      />
                      <text x="0" y="0" fill="#ffffff" fontSize="9" fontWeight="extrabold" textAnchor="middle" fontFamily="monospace">
                        {data.strikes[0]?.flightNumber ? `STRIKE ${data.strikes[0].flightNumber}` : `STRIKE ${cellCode}`}
                      </text>
                    </g>

                    {/* Damage Alert Flag */}
                    {data.hasDamage && (
                      <g transform="translate(18, -6)">
                        <rect x="-4" y="-8" width="42" height="14" rx="3" fill="#450a0a" stroke="#f87171" strokeWidth="1" />
                        <text x="17" y="2" fill="#fecaca" fontSize="8" fontWeight="bold" textAnchor="middle">
                          DAMAGE
                        </text>
                      </g>
                    )}

                    {/* Multiple incident count badge */}
                    {data.strikes.length > 1 && (
                      <circle cx="12" cy="10" r="7" fill="#7f1d1d" stroke="#ffffff" strokeWidth="1" />
                    )}
                    {data.strikes.length > 1 && (
                      <text x="12" y="13" fill="#ffffff" fontSize="8" fontWeight="bold" textAnchor="middle">
                        {data.strikes.length}
                      </text>
                    )}
                  </g>
                )}

                {/* 2. Occurrence Marker (Amber Warning Beacon) */}
                {showOccurrences && (
                  <g transform={`translate(${showStrikes ? pt.x + 18 : pt.x}, ${showStrikes ? pt.y + 12 : pt.y})`}>
                    <circle cx="0" cy="0" r="20" fill="#f59e0b" opacity="0.3" className="animate-ping" />
                    <circle cx="0" cy="0" r="13" fill="#d97706" opacity="0.6" />
                    <circle cx="0" cy="0" r="10" fill="#b45309" stroke="#ffffff" strokeWidth="2" filter="url(#glowAmber)" />
                    <text x="0" y="3.5" fill="#ffffff" fontSize="9" fontWeight="black" textAnchor="middle">
                      ⚠️
                    </text>

                    {/* Callout Label */}
                    <g transform="translate(0, -18)">
                      <rect 
                        x="-34" 
                        y="-11" 
                        width="68" 
                        height="15" 
                        rx="3" 
                        fill="#78350f" 
                        stroke="#fde68a" 
                        strokeWidth="1" 
                      />
                      <text x="0" y="0" fill="#ffffff" fontSize="8.5" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
                        OCC {cellCode}
                      </text>
                    </g>
                  </g>
                )}

                {/* 3. Patrol Marker (Blue Inspection Pin) */}
                {showPatrols && (
                  <g transform={`translate(${pt.x}, ${pt.y})`}>
                    <circle cx="0" cy="0" r="9" fill="#0284c7" stroke="#ffffff" strokeWidth="2" filter="url(#glowSky)" />
                    <text x="0" y="3" fill="#ffffff" fontSize="8.5" fontWeight="black" textAnchor="middle">
                      P
                    </text>
                    <g transform="translate(0, -16)">
                      <rect x="-24" y="-10" width="48" height="13" rx="3" fill="#0c4a6e" stroke="#7dd3fc" strokeWidth="1" />
                      <text x="0" y="-1" fill="#ffffff" fontSize="8" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
                        GRID {cellCode}
                      </text>
                    </g>
                  </g>
                )}
              </g>
            );
          })}

          {/* ============================================================== */}
          {/* 7. HIGH-TECH TACTICAL TARGETING RETICLE ON SELECTED CELL        */}
          {/* ============================================================== */}
          {selectedCell && (() => {
            const rLetter = selectedCell.charAt(0);
            const cNum = parseInt(selectedCell.slice(1), 10);
            const x = (cNum - 1) * colWidth;
            const y = GRID_ROWS.indexOf(rLetter as any) * rowHeight;
            const cx = x + colWidth / 2;
            const cy = y + rowHeight / 2;

            return (
              <g id="tactical-crosshair-reticle" pointerEvents="none">
                {/* Outer Reticle Bracket Frame */}
                <path
                  d={`
                    M ${x + 6} ${y + 20} L ${x + 6} ${y + 6} L ${x + 20} ${y + 6}
                    M ${x + colWidth - 20} ${y + 6} L ${x + colWidth - 6} ${y + 6} L ${x + colWidth - 6} ${y + 20}
                    M ${x + colWidth - 6} ${y + rowHeight - 20} L ${x + colWidth - 6} ${y + rowHeight - 6} L ${x + colWidth - 20} ${y + rowHeight - 6}
                    M ${x + 20} ${y + rowHeight - 6} L ${x + 6} ${y + rowHeight - 6} L ${x + 6} ${y + rowHeight - 20}
                  `}
                  fill="none"
                  stroke="#38bdf8"
                  strokeWidth="2.5"
                />

                {/* Center Crosshair and Targeting Ring */}
                <circle cx={cx} cy={cy} r="28" fill="none" stroke="#38bdf8" strokeWidth="1.5" strokeDasharray="6,4" className="animate-spin-slow" />
                <line x1={cx - 36} y1={cy} x2={cx - 16} y2={cy} stroke="#38bdf8" strokeWidth="2" />
                <line x1={cx + 16} y1={cy} x2={cx + 36} y2={cy} stroke="#38bdf8" strokeWidth="2" />
                <line x1={cx} y1={cy - 36} x2={cx} y2={cy - 16} stroke="#38bdf8" strokeWidth="2" />
                <line x1={cx} y1={cy + 16} x2={cx} y2={cy + 36} stroke="#38bdf8" strokeWidth="2" />
                <circle cx={cx} cy={cy} r="2" fill="#38bdf8" />

                {/* Sektor Badge on Reticle */}
                <rect x={cx - 36} y={y + 10} width="72" height="18" rx="4" fill="#0284c7" stroke="#ffffff" strokeWidth="1" />
                <text x={cx} y={y + 22.5} fill="#ffffff" fontSize="10" fontWeight="black" textAnchor="middle" fontFamily="monospace">
                  TARGET: {selectedCell}
                </text>
              </g>
            );
          })()}

          {/* Coordinate HUD indicator in bottom left */}
          <g transform={`translate(20, ${viewBoxHeight - 45})`}>
            <rect width="250" height="30" rx="5" fill="#020617" fillOpacity="0.88" stroke="#334155" strokeWidth="1" />
            <text x="12" y="20" fill="#94a3b8" fontSize="10" fontFamily="monospace">
              KOORDINAT RADAR: <tspan fill="#38bdf8" fontWeight="bold">{selectedCell || hoveredCell || 'PILIH SEKTOR'}</tspan>
            </text>
          </g>

          {/* Scale bar indicator (0 - 500m - 1km) */}
          <g transform={`translate(${viewBoxWidth - 220}, ${viewBoxHeight - 40})`}>
            <rect width="190" height="25" rx="4" fill="#0f172a" fillOpacity="0.8" stroke="#334155" />
            <line x1="20" y1="13" x2="170" y2="13" stroke="#f1f5f9" strokeWidth="2" />
            <line x1="20" y1="8" x2="20" y2="18" stroke="#f1f5f9" strokeWidth="2" />
            <line x1="95" y1="8" x2="95" y2="18" stroke="#f1f5f9" strokeWidth="2" />
            <line x1="170" y1="8" x2="170" y2="18" stroke="#f1f5f9" strokeWidth="2" />
            <text x="20" y="22" fill="#cbd5e1" fontSize="8" fontFamily="monospace">0</text>
            <text x="95" y="22" fill="#cbd5e1" fontSize="8" fontFamily="monospace" textAnchor="middle">500m</text>
            <text x="170" y="22" fill="#cbd5e1" fontSize="8" fontFamily="monospace" textAnchor="end">1km</text>
          </g>
        </svg>
      </div>

      {/* 5. Tactical Detail Dispatch Panel (Interactive when cell selected) */}
      {selectedCellDetails && (
        <div className="p-4 sm:p-5 bg-slate-900 border-t border-slate-800 transition-all duration-200">
          {/* Header Sector Card */}
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div className="flex items-start space-x-3.5">
              <div className={`p-3 rounded-xl text-white shadow-md mt-0.5 ${
                selectedCellDetails.threatLevel === 'critical'
                  ? 'bg-rose-600 border border-rose-400 ring-4 ring-rose-950'
                  : selectedCellDetails.threatLevel === 'warning'
                  ? 'bg-amber-600 border border-amber-400 ring-4 ring-amber-950'
                  : 'bg-sky-600 border border-sky-400 ring-4 ring-sky-950'
              }`}>
                {selectedCellDetails.threatLevel === 'critical' ? (
                  <Flame className="w-6 h-6 animate-bounce" />
                ) : selectedCellDetails.threatLevel === 'warning' ? (
                  <AlertTriangle className="w-6 h-6" />
                ) : (
                  <MapPin className="w-6 h-6" />
                )}
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm sm:text-base font-black text-white">
                    {selectedCellDetails.name}
                  </span>
                  <span className="px-2.5 py-0.5 rounded font-mono font-black text-xs bg-sky-950 text-sky-300 border border-sky-700">
                    SEKTOR GRID {selectedCellDetails.code}
                  </span>
                  {selectedCellDetails.threatLevel === 'critical' && (
                    <span className="px-2.5 py-0.5 rounded font-bold text-xs bg-rose-950 text-rose-300 border border-rose-700 flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
                      ZONA MERAH: WILDLIFE STRIKE
                    </span>
                  )}
                  {selectedCellDetails.threatLevel === 'warning' && (
                    <span className="px-2.5 py-0.5 rounded font-bold text-xs bg-amber-950 text-amber-300 border border-amber-700 flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                      ZONA KUNING: OCCURRENCE AKTIF
                    </span>
                  )}
                </div>

                {/* Aerodrome Tactical References */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-4 gap-y-1 mt-1.5 text-xs text-slate-300 font-medium">
                  <div>
                    <span className="text-slate-500">Runway Terdekat:</span>{' '}
                    <span className="text-sky-300 font-semibold">{selectedCellDetails.nearestRunway}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Fasilitas / Area:</span>{' '}
                    <span className="text-slate-200">{selectedCellDetails.facility}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Respon Damkar:</span>{' '}
                    <span className="text-amber-300 font-semibold">{selectedCellDetails.nearestArff}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Close Button */}
            <div className="flex items-center space-x-2 self-end lg:self-center">
              <button
                onClick={() => setSelectedCell(null)}
                className="px-3.5 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition cursor-pointer"
              >
                Tutup Sektor
              </button>
            </div>
          </div>

          {/* Incidents in this Grid Cell */}
          <div className="mt-4 space-y-3">
            {/* If no incidents in this cell */}
            {selectedCellDetails.totalIncidents === 0 && (
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-slate-400 text-xs flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                  <span>
                    Tidak ada catatan insiden Wildlife Strike atau Occurrence di sektor <strong>{selectedCellDetails.code}</strong>. Status operasional bersih &amp; aman.
                  </span>
                </div>
                <span className="text-[11px] text-slate-500 font-mono">SOP ICAO DOC 9137 PART 3</span>
              </div>
            )}

            {/* Strikes in this cell */}
            {selectedCellDetails.strikes.map(strike => (
              <div 
                key={strike.id}
                className="p-4 rounded-xl bg-rose-950/40 border border-rose-800/80 hover:border-rose-600 transition shadow-sm text-xs space-y-2.5"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center space-x-2">
                    <span className="px-2 py-0.5 rounded bg-rose-600 text-white font-black text-[10px] tracking-wide">
                      WILDLIFE STRIKE
                    </span>
                    <span className="font-bold text-sm text-white">
                      {strike.flightNumber} ({strike.operatorAirline}) - {strike.aircraftType}
                    </span>
                    <span className="text-slate-400">• {strike.waktuKejadian}</span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-1.5">
                    {onSelectReport && (
                      <button
                        onClick={() => onSelectReport('strike', strike.id)}
                        className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded font-medium transition flex items-center gap-1 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5 text-sky-400" />
                        <span>Detail Laporan</span>
                      </button>
                    )}
                    <button
                      onClick={() => exportStrikePDF(strike)}
                      className="px-3 py-1 bg-rose-900/80 hover:bg-rose-800 text-rose-100 rounded font-medium transition flex items-center gap-1 cursor-pointer"
                      title="Unduh PDF Resmi"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>PDF</span>
                    </button>
                    {onOpenBroadcast && (
                      <button
                        onClick={() => onOpenBroadcast('STRIKE', strike)}
                        className="px-3 py-1 bg-sky-700 hover:bg-sky-600 text-white rounded font-medium transition flex items-center gap-1 cursor-pointer"
                        title="Kirim Notifikasi Broadcast ke EGM, AOCC, ATC"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                        <span>Broadcast WA</span>
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-slate-300 bg-black/30 p-2.5 rounded-lg border border-rose-900/40">
                  <div>
                    <span className="text-slate-400">Lokasi / Sektor:</span>{' '}
                    <strong className="text-white">{strike.lokasi} ({strike.runwayTaxiway})</strong>
                  </div>
                  <div>
                    <span className="text-slate-400">Satwa Terlibat:</span>{' '}
                    <strong className="text-amber-300">{strike.jenisWildlife} ({strike.jumlahWildlife} ekor)</strong>
                  </div>
                  <div>
                    <span className="text-slate-400">Fase Penerbangan:</span>{' '}
                    <strong className="text-white">{strike.fasePenerbangan}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400">Kerusakan Pesawat:</span>{' '}
                    <strong className={strike.indikasiKerusakan === 'Ada' ? 'text-red-400' : 'text-emerald-400'}>
                      {strike.indikasiKerusakan} {strike.bagianKerusakan ? `(${strike.bagianKerusakan})` : ''}
                    </strong>
                  </div>
                </div>

                <p className="text-slate-300 leading-relaxed">
                  <strong className="text-slate-400">Kronologi:</strong> {strike.kronologiStrike}
                </p>

                {/* Unit Action Guidance */}
                <div className="pt-2 border-t border-rose-900/40 text-[11px] text-slate-400 flex flex-wrap items-center justify-between gap-2">
                  <span>
                    <strong>Tindakan WHU:</strong> {strike.tindakanUnit.pengamananPembersihan} | Verifikasi: {strike.tindakanUnit.verifikasiLokasi}
                  </span>
                  <span className="text-rose-300 font-semibold">
                    POD Unit: {strike.pod || 'Petugas WHU'}
                  </span>
                </div>
              </div>
            ))}

            {/* Occurrences in this cell */}
            {selectedCellDetails.occurrences.map(occ => (
              <div 
                key={occ.id}
                className="p-4 rounded-xl bg-amber-950/30 border border-amber-800/80 hover:border-amber-600 transition shadow-sm text-xs space-y-2.5"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center space-x-2">
                    <span className="px-2 py-0.5 rounded bg-amber-600 text-white font-black text-[10px] tracking-wide">
                      OCCURRENCE
                    </span>
                    <span className="font-bold text-sm text-white">
                      {occ.reportNumber} - {occ.jenisOccurrence}
                    </span>
                    <span className="text-slate-400">• {occ.waktuKejadian}</span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-1.5">
                    {onSelectReport && (
                      <button
                        onClick={() => onSelectReport('occurrence', occ.id)}
                        className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded font-medium transition flex items-center gap-1 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5 text-sky-400" />
                        <span>Detail Laporan</span>
                      </button>
                    )}
                    <button
                      onClick={() => exportOccurrencePDF(occ)}
                      className="px-3 py-1 bg-amber-900/80 hover:bg-amber-800 text-amber-100 rounded font-medium transition flex items-center gap-1 cursor-pointer"
                      title="Unduh PDF Resmi"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>PDF</span>
                    </button>
                    {onOpenBroadcast && (
                      <button
                        onClick={() => onOpenBroadcast('OCCURRENCE', occ)}
                        className="px-3 py-1 bg-sky-700 hover:bg-sky-600 text-white rounded font-medium transition flex items-center gap-1 cursor-pointer"
                        title="Kirim Notifikasi Broadcast ke EGM, AOCC, ATC"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                        <span>Broadcast WA</span>
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-slate-300 bg-black/30 p-2.5 rounded-lg border border-amber-900/40">
                  <div>
                    <span className="text-slate-400">Lokasi / Area:</span>{' '}
                    <strong className="text-white">{occ.lokasi} ({occ.runwayTaxiwayArea})</strong>
                  </div>
                  <div>
                    <span className="text-slate-400">Satwa:</span>{' '}
                    <strong className="text-amber-300">{occ.jenisSatwa} ({occ.jumlahSatwa} ekor)</strong>
                  </div>
                  <div>
                    <span className="text-slate-400">Kondisi:</span>{' '}
                    <strong className="text-white">{occ.kondisiSatwa}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400">Status Penanganan:</span>{' '}
                    <strong className={occ.status === 'Selesai' ? 'text-emerald-400' : 'text-amber-400'}>
                      {occ.status}
                    </strong>
                  </div>
                </div>

                <p className="text-slate-300 leading-relaxed">
                  <strong className="text-slate-400">Kronologi:</strong> {occ.kronologi}
                </p>

                <div className="pt-2 border-t border-amber-900/40 text-[11px] text-slate-400 flex flex-wrap items-center justify-between gap-2">
                  <span>
                    <strong>Dispersal / Tindakan:</strong> {occ.tindakan.mobileDispersal || occ.hasilPenanganan}
                  </span>
                  <span className="text-amber-300 font-semibold">
                    POD Unit: {occ.pod || 'Petugas WHU'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 6. Official Sign-off & Document Attribution Footer */}
      <div className="p-3 bg-slate-950 border-t border-slate-900 text-[10px] text-slate-400 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <div>
          <span className="font-semibold text-slate-300">Disahkan Oleh:</span> Direktorat Jenderal Perhubungan Udara (04 AGUSTUS 2025)
        </div>
        <div className="font-mono text-slate-400">
          <span className="text-amber-400 font-bold">Diparaf oleh:</span> GM Bandar Udara Internasional Soekarno-Hatta (DWI ANANDA WICAKSANA - NIP: 20240719)
        </div>
      </div>
    </div>
  );
};
