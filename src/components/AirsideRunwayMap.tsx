import React, { useState } from 'react';
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
  Crosshair
} from 'lucide-react';
import { PatrolReport, OccurrenceReport, WildlifeStrikeReport } from '../types';

interface AirsideRunwayMapProps {
  patrols: PatrolReport[];
  occurrences: OccurrenceReport[];
  strikes: WildlifeStrikeReport[];
  onSelectReport?: (type: 'patrol' | 'occurrence' | 'strike', id: string) => void;
  onSelectGrid?: (gridCell: string) => void;
}

export const AirsideRunwayMap: React.FC<AirsideRunwayMapProps> = ({
  patrols,
  occurrences,
  strikes,
  onSelectReport,
  onSelectGrid
}) => {
  const [activeLayer, setActiveLayer] = useState<'all' | 'strikes' | 'occurrences' | 'patrols'>('all');
  const [showGridOverlay, setShowGridOverlay] = useState<boolean>(true);
  const [hoveredCell, setHoveredCell] = useState<string | null>(null);
  const [selectedCell, setSelectedCell] = useState<string | null>(null);
  const [selectedPoint, setSelectedPoint] = useState<{
    type: 'strike' | 'occurrence' | 'patrol';
    title: string;
    location: string;
    grid: string;
    details: string;
    id: string;
  } | null>(null);

  // 14 Columns (1 to 14) and 7 Rows (A to G)
  const columns = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14];
  const rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];

  // Map dimensions
  const viewBoxWidth = 1400;
  const viewBoxHeight = 700;
  const colWidth = viewBoxWidth / 14; // 100 px per col
  const rowHeight = viewBoxHeight / 7; // 100 px per row

  // Coordinate helper: takes (col 1..14, row 'A'..'G') and returns pixel center
  const getCellCenter = (colNum: number, rowLetter: string) => {
    const cIdx = colNum - 1;
    const rIdx = rows.indexOf(rowLetter);
    return {
      x: cIdx * colWidth + colWidth / 2,
      y: rIdx * rowHeight + rowHeight / 2
    };
  };

  const handleCellClick = (cellCode: string) => {
    setSelectedCell(cellCode === selectedCell ? null : cellCode);
    if (onSelectGrid) {
      onSelectGrid(cellCode);
    }
  };

  return (
    <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-2xl text-slate-200">
      {/* Official Map Title Bar */}
      <div className="p-3 sm:p-4 bg-slate-900 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-lg bg-sky-950 border border-sky-700 flex items-center justify-center text-sky-400">
            <Compass className="w-5 h-5 animate-spin-slow" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-black tracking-widest text-amber-400 bg-amber-950/60 border border-amber-800/60 px-2 py-0.5 rounded">
                INJOURNEY AIRPORTS
              </span>
              <span className="text-[11px] font-mono text-slate-400">ICAO CODE: WIII</span>
              <span className="text-[10px] bg-sky-900/60 text-sky-300 font-mono px-2 py-0.5 rounded border border-sky-700">
                GRID MAP 2025 (REV. 00)
              </span>
            </div>
            <h3 className="font-extrabold text-sm sm:text-base text-white tracking-wide mt-0.5">
              SOEKARNO - HATTA INTERNATIONAL AIRPORT - CGK
            </h3>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Grid Toggle */}
          <button
            onClick={() => setShowGridOverlay(!showGridOverlay)}
            className={`px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
              showGridOverlay 
                ? 'bg-sky-600/90 border-sky-400 text-white shadow-sm' 
                : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
            }`}
          >
            <Crosshair className="w-3.5 h-3.5" />
            Grid 14×7 (A-G / 1-14) {showGridOverlay ? 'ON' : 'OFF'}
          </button>

          {/* Layer Filter Buttons */}
          <div className="flex items-center space-x-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
            <button
              onClick={() => setActiveLayer('all')}
              className={`px-2.5 py-1 rounded transition ${activeLayer === 'all' ? 'bg-sky-600 text-white font-bold' : 'text-slate-400 hover:text-white'}`}
            >
              Semua ({strikes.length + occurrences.length + patrols.length})
            </button>
            <button
              onClick={() => setActiveLayer('strikes')}
              className={`px-2.5 py-1 rounded transition ${activeLayer === 'strikes' ? 'bg-rose-700 text-white font-bold' : 'text-slate-400 hover:text-white'}`}
            >
              Strike ({strikes.length})
            </button>
            <button
              onClick={() => setActiveLayer('occurrences')}
              className={`px-2.5 py-1 rounded transition ${activeLayer === 'occurrences' ? 'bg-amber-600 text-white font-bold' : 'text-slate-400 hover:text-white'}`}
            >
              Occurrence ({occurrences.length})
            </button>
            <button
              onClick={() => setActiveLayer('patrols')}
              className={`px-2.5 py-1 rounded transition ${activeLayer === 'patrols' ? 'bg-blue-600 text-white font-bold' : 'text-slate-400 hover:text-white'}`}
            >
              Patroli ({patrols.length})
            </button>
          </div>
        </div>
      </div>

      {/* General Information Banner from Official Document */}
      <div className="px-4 py-2 bg-slate-900/90 border-b border-slate-800/80 text-[11px] flex flex-wrap items-center justify-between gap-y-1 text-slate-300 font-mono">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <span><strong>AES:</strong> 34 Ft (10,36 m)</span>
          <span>•</span>
          <span><strong>ARP:</strong> 6° 7' 25" S &amp; 106° 39' 40" E</span>
          <span>•</span>
          <span><strong>Time Region:</strong> UTC + 7</span>
        </div>
        <div className="flex flex-wrap items-center gap-x-3 text-slate-400">
          <span className="text-emerald-400 font-semibold">RWY 1: 07R-25L (3600×60m Rigid)</span>
          <span>|</span>
          <span className="text-sky-400 font-semibold">RWY 2: 07L-25R (3660×60m Rigid)</span>
          <span>|</span>
          <span className="text-amber-400 font-semibold">RWY 3: 06-24 (3000×60m Flexible)</span>
        </div>
      </div>

      {/* Main Interactive Map Container */}
      <div className="relative w-full aspect-[2/1] min-h-[380px] sm:min-h-[500px] bg-[#0c131d] overflow-hidden select-none">
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
            <filter id="glowRed" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#f43f5e" />
            </filter>
            <filter id="glowAmber" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#f59e0b" />
            </filter>
          </defs>

          {/* Base Airfield Grass Fill */}
          <rect x="0" y="0" width={viewBoxWidth} height={viewBoxHeight} fill="url(#airsideGrass)" />

          {/* Airport Boundary Lines */}
          <rect x="15" y="15" width={viewBoxWidth - 30} height={viewBoxHeight - 30} rx="10" fill="none" stroke="#1e3a2f" strokeWidth="2" strokeDasharray="8,6" />

          {/* Water Bodies & Open Water Storage (Ref #10 & #12 on Official Legend) */}
          {/* West Retention Ponds (Row C/D Col 1-2) */}
          <path d="M 60 210 Q 110 200 150 240 Q 120 310 60 290 Z" fill="url(#lakeWater)" stroke="#38bdf8" strokeWidth="1.5" />
          <text x="100" y="255" fill="#bae6fd" fontSize="10" fontWeight="bold" textAnchor="middle">12. OPEN WATER</text>

          {/* East Retention Basin (Row D/E Col 13-14) */}
          <path d="M 1250 330 Q 1330 310 1370 380 Q 1330 460 1260 430 Z" fill="url(#lakeWater)" stroke="#38bdf8" strokeWidth="1.5" />
          <text x="1310" y="385" fill="#bae6fd" fontSize="10" fontWeight="bold" textAnchor="middle">10. WATER ARFF</text>

          {/* Runway 3: 06 - 24 (Row A-B, Col 3 to 12) - Flexible Surface 3000 x 60m */}
          <g id="runway-3-06-24">
            <rect x="230" y="85" width="940" height="40" fill="#1e293b" stroke="#64748b" strokeWidth="2" rx="2" />
            {/* Centerline */}
            <line x1="270" y1="105" x2="1130" y2="105" stroke="#f1f5f9" strokeWidth="2.5" strokeDasharray="28,20" />
            {/* Threshold 06 */}
            <rect x="240" y="88" width="6" height="34" fill="#ffffff" />
            <rect x="250" y="88" width="6" height="34" fill="#ffffff" />
            <text x="280" y="110" fill="#ffffff" fontSize="14" fontWeight="black" fontFamily="monospace">06</text>
            {/* Threshold 24 */}
            <rect x="1154" y="88" width="6" height="34" fill="#ffffff" />
            <rect x="1144" y="88" width="6" height="34" fill="#ffffff" />
            <text x="1115" y="110" fill="#ffffff" fontSize="14" fontWeight="black" fontFamily="monospace">24</text>
            <text x="700" y="78" fill="#e2e8f0" fontSize="11" fontWeight="bold" textAnchor="middle">RUNWAY 3: 06 - 24 (3000 x 60 m Flexible)</text>
          </g>

          {/* Runway 2: 07L - 25R (Row B-C, Col 2 to 13) - Rigid Surface 3660 x 60m */}
          <g id="runway-2-07L-25R">
            <rect x="140" y="195" width="1120" height="44" fill="#1e293b" stroke="#94a3b8" strokeWidth="2.5" rx="2" />
            {/* Centerline */}
            <line x1="190" y1="217" x2="1210" y2="217" stroke="#ffffff" strokeWidth="3" strokeDasharray="30,20" />
            {/* Threshold 07L */}
            <rect x="152" y="199" width="7" height="36" fill="#ffffff" />
            <rect x="164" y="199" width="7" height="36" fill="#ffffff" />
            <text x="200" y="222" fill="#ffffff" fontSize="15" fontWeight="black" fontFamily="monospace">07L</text>
            {/* Threshold 25R */}
            <rect x="1241" y="199" width="7" height="36" fill="#ffffff" />
            <rect x="1229" y="199" width="7" height="36" fill="#ffffff" />
            <text x="1190" y="222" fill="#ffffff" fontSize="15" fontWeight="black" fontFamily="monospace">25R</text>
            <text x="700" y="188" fill="#93c5fd" fontSize="11" fontWeight="bold" textAnchor="middle">RUNWAY 2: 07L - 25R (3660 x 60 m Rigid)</text>
          </g>

          {/* Runway 1: 07R - 25L (Row F-G, Col 2 to 13) - Rigid Surface 3600 x 60m */}
          <g id="runway-1-07R-25L">
            <rect x="150" y="560" width="1100" height="44" fill="#1e293b" stroke="#94a3b8" strokeWidth="2.5" rx="2" />
            {/* Centerline */}
            <line x1="200" y1="582" x2="1200" y2="582" stroke="#ffffff" strokeWidth="3" strokeDasharray="30,20" />
            {/* Threshold 07R */}
            <rect x="162" y="564" width="7" height="36" fill="#ffffff" />
            <rect x="174" y="564" width="7" height="36" fill="#ffffff" />
            <text x="210" y="587" fill="#ffffff" fontSize="15" fontWeight="black" fontFamily="monospace">07R</text>
            {/* Threshold 25L */}
            <rect x="1231" y="564" width="7" height="36" fill="#ffffff" />
            <rect x="1219" y="564" width="7" height="36" fill="#ffffff" />
            <text x="1180" y="587" fill="#ffffff" fontSize="15" fontWeight="black" fontFamily="monospace">25L</text>
            <text x="700" y="622" fill="#86efac" fontSize="11" fontWeight="bold" textAnchor="middle">RUNWAY 1: 07R - 25L (3600 x 60 m Rigid)</text>
          </g>

          {/* Taxiway Network (Echo, Charlie, Alpha, Parallel, High Speed exits) */}
          <g id="taxiways" stroke="#f59e0b" strokeWidth="3.5" fill="none">
            {/* West Connecting Taxiways */}
            <line x1="300" y1="239" x2="300" y2="560" stroke="#f59e0b" strokeWidth="4" />
            <line x1="300" y1="125" x2="300" y2="195" stroke="#f59e0b" strokeWidth="3" />
            <text x="312" y="270" fill="#fef08a" fontSize="10" fontWeight="bold" stroke="none">TWY W</text>

            {/* Central Crossing Taxiway Charlie */}
            <line x1="680" y1="239" x2="680" y2="350" stroke="#f59e0b" strokeWidth="4" />
            <line x1="720" y1="450" x2="720" y2="560" stroke="#f59e0b" strokeWidth="4" />

            {/* East Connecting Taxiway Echo */}
            <line x1="1100" y1="125" x2="1100" y2="239" stroke="#f59e0b" strokeWidth="3" />
            <line x1="1100" y1="239" x2="1100" y2="560" stroke="#f59e0b" strokeWidth="4" />
            <text x="1112" y="270" fill="#fef08a" fontSize="10" fontWeight="bold" stroke="none">TWY E</text>

            {/* Parallel Taxiways South */}
            <line x1="150" y1="520" x2="1250" y2="520" stroke="#475569" strokeWidth="18" />
            <line x1="150" y1="520" x2="1250" y2="520" stroke="#f59e0b" strokeWidth="2" strokeDasharray="15,15" />
            <text x="700" y="524" fill="#fef08a" fontSize="10" fontWeight="bold" stroke="none" textAnchor="middle">PARALLEL TAXIWAY SOUTH (PAPA)</text>

            {/* Parallel Taxiways North */}
            <line x1="140" y1="280" x2="1260" y2="280" stroke="#475569" strokeWidth="18" />
            <line x1="140" y1="280" x2="1260" y2="280" stroke="#f59e0b" strokeWidth="2" strokeDasharray="15,15" />
            <text x="700" y="284" fill="#fef08a" fontSize="10" fontWeight="bold" stroke="none" textAnchor="middle">PARALLEL TAXIWAY NORTH (NOVEMBER)</text>
          </g>

          {/* Central Buildings & Terminals from Official Soekarno-Hatta Grid Map */}
          {/* Terminal 1 (M) - South-Central (Row E, Col 6-9) */}
          <g id="terminal-1">
            <path d="M 520 440 L 880 440 L 850 490 L 550 490 Z" fill="#334155" stroke="#64748b" strokeWidth="2" />
            {/* Pier Sub-terminals 1A, 1B, 1C */}
            <circle cx="580" cy="465" r="16" fill="#1e293b" stroke="#0ea5e9" strokeWidth="1.5" />
            <circle cx="700" cy="465" r="16" fill="#1e293b" stroke="#0ea5e9" strokeWidth="1.5" />
            <circle cx="820" cy="465" r="16" fill="#1e293b" stroke="#0ea5e9" strokeWidth="1.5" />
            <text x="700" y="470" fill="#ffffff" fontSize="12" fontWeight="black" textAnchor="middle">M. TERMINAL 1</text>
          </g>

          {/* Terminal 2 (N) - North-Central (Row C-D, Col 6-9) */}
          <g id="terminal-2">
            <path d="M 520 350 L 880 350 L 850 305 L 550 305 Z" fill="#334155" stroke="#64748b" strokeWidth="2" />
            {/* Pier Sub-terminals 2D, 2E, 2F */}
            <circle cx="580" cy="328" r="16" fill="#1e293b" stroke="#0ea5e9" strokeWidth="1.5" />
            <circle cx="700" cy="328" r="16" fill="#1e293b" stroke="#0ea5e9" strokeWidth="1.5" />
            <circle cx="820" cy="328" r="16" fill="#1e293b" stroke="#0ea5e9" strokeWidth="1.5" />
            <text x="700" y="333" fill="#ffffff" fontSize="12" fontWeight="black" textAnchor="middle">N. TERMINAL 2</text>
          </g>

          {/* Terminal 3 (O) - East Apron (Row D-E, Col 10-13) */}
          <g id="terminal-3">
            <rect x="980" y="320" width="230" height="150" rx="6" fill="#1e293b" stroke="#38bdf8" strokeWidth="2" />
            {/* Terminal 3 Pier branches */}
            <rect x="990" y="330" width="40" height="130" fill="#0f172a" stroke="#0284c7" strokeWidth="1" />
            <rect x="1160" y="330" width="40" height="130" fill="#0f172a" stroke="#0284c7" strokeWidth="1" />
            <text x="1095" y="395" fill="#ffffff" fontSize="13" fontWeight="black" textAnchor="middle">O. TERMINAL 3</text>
            <text x="1095" y="412" fill="#7dd3fc" fontSize="9" fontWeight="bold" textAnchor="middle">EAST APRON &amp; PIER</text>
          </g>

          {/* Cargo Terminal (P) - East South (Row F, Col 11-13) */}
          <g id="cargo-terminal">
            <rect x="1050" y="485" width="160" height="28" fill="#334155" stroke="#94a3b8" strokeWidth="1.5" rx="3" />
            <text x="1130" y="503" fill="#f1f5f9" fontSize="10" fontWeight="bold" textAnchor="middle">P. CARGO TERMINAL</text>
          </g>

          {/* DPPU Pertamina (A) - West (Row C, Col 1-2) */}
          <g id="dppu-pertamina">
            <circle cx="120" cy="260" r="18" fill="#450a0a" stroke="#ef4444" strokeWidth="1.5" />
            <text x="120" y="264" fill="#fca5a5" fontSize="9" fontWeight="black" textAnchor="middle">A. DPPU</text>
          </g>

          {/* Tower JATSC (L) & Gedung AOCC (R) - Central (Row D, Col 7) */}
          <g id="jatsc-tower-aocc">
            {/* Tower */}
            <circle cx="680" cy="395" r="14" fill="#0f172a" stroke="#f59e0b" strokeWidth="2" />
            <text x="680" y="399" fill="#fef08a" fontSize="10" fontWeight="black" textAnchor="middle">L</text>
            <text x="680" y="420" fill="#cbd5e1" fontSize="9" fontWeight="bold" textAnchor="middle">TOWER JATSC</text>
            {/* Gedung AOCC (R) */}
            <rect x="715" y="385" width="45" height="22" fill="#1e3a8a" stroke="#60a5fa" strokeWidth="1.5" rx="3" />
            <text x="737" y="400" fill="#dbeafe" fontSize="9" fontWeight="bold" textAnchor="middle">R. AOCC</text>
          </g>

          {/* ARFF Fire Stations (Legend 17) */}
          <g id="fire-stations">
            {/* North Fire Station (Row B, Col 5) */}
            <rect x="420" y="160" width="30" height="18" fill="#7f1d1d" stroke="#f87171" strokeWidth="1" rx="2" />
            <text x="435" y="173" fill="#fecaca" fontSize="9" fontWeight="bold" textAnchor="middle">17</text>
            {/* Main Fire Station (Row D, Col 8) */}
            <rect x="780" y="388" width="32" height="18" fill="#7f1d1d" stroke="#f87171" strokeWidth="1" rx="2" />
            <text x="796" y="401" fill="#fecaca" fontSize="9" fontWeight="bold" textAnchor="middle">17 MAIN</text>
            {/* South Fire Station (Row F, Col 5) */}
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
          {/* 14 x 7 GRID OVERLAY (COLUMNS 1-14, ROWS A-G)                     */}
          {/* ============================================================== */}
          {showGridOverlay && (
            <g id="grid-map-overlay">
              {/* Vertical Grid Lines (14 Columns) */}
              {columns.map(c => {
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
              {rows.map((r, rIdx) => {
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

              {/* Interactive Grid Cell Targets (Clickable/Hoverable) */}
              {rows.map(r =>
                columns.map(c => {
                  const cellCode = `${r}${c}`;
                  const x = (c - 1) * colWidth;
                  const y = rows.indexOf(r) * rowHeight;
                  const isHovered = hoveredCell === cellCode;
                  const isSelected = selectedCell === cellCode;

                  return (
                    <rect
                      key={`grid-cell-${cellCode}`}
                      x={x}
                      y={y}
                      width={colWidth}
                      height={rowHeight}
                      fill={isSelected ? '#0284c7' : isHovered ? '#38bdf8' : 'transparent'}
                      fillOpacity={isSelected ? 0.25 : isHovered ? 0.12 : 0}
                      stroke={isSelected ? '#38bdf8' : isHovered ? '#7dd3fc' : 'none'}
                      strokeWidth={isSelected ? 2 : 1}
                      className="cursor-pointer transition"
                      onMouseEnter={() => setHoveredCell(cellCode)}
                      onMouseLeave={() => setHoveredCell(null)}
                      onClick={() => handleCellClick(cellCode)}
                    >
                      <title>{`CGK Grid ${cellCode}`}</title>
                    </rect>
                  );
                })
              )}
            </g>
          )}

          {/* ============================================================== */}
          {/* PLOTTED INCIDENT MARKERS WITH REAL CGK GRID REFERENCES          */}
          {/* ============================================================== */}

          {/* 1. Wildlife Strike: GA-320 (B737-800) at Grid C8 (Intersection C3, RWY 2 07L/25R) */}
          {(activeLayer === 'all' || activeLayer === 'strikes') && (() => {
            const pt = getCellCenter(8, 'C');
            return (
              <g
                className="cursor-pointer group"
                transform={`translate(${pt.x - 20}, ${pt.y - 30})`}
                onClick={() => setSelectedPoint({
                  type: 'strike',
                  title: 'WILDLIFE STRIKE: GA-320 (B737-800)',
                  location: 'Runway 2 07L/25R - Intersection TWY C3',
                  grid: 'Grid C8',
                  details: 'Tabrakan Burung Layang-layang Api (Hirundo rustica) mengenai leading edge sayap kiri saat landing roll. Landasan swept & clear.',
                  id: strikes[0]?.id || 'strike-001'
                })}
              >
                <circle cx="0" cy="0" r="16" fill="#ef4444" opacity="0.4" className="animate-ping" />
                <circle cx="0" cy="0" r="11" fill="#dc2626" stroke="#ffffff" strokeWidth="2.5" filter="url(#glowRed)" />
                <text x="0" y="4" fill="#ffffff" fontSize="10" fontWeight="black" textAnchor="middle">S</text>
                {/* Grid Badge */}
                <rect x="-24" y="-24" width="48" height="14" rx="3" fill="#7f1d1d" stroke="#fca5a5" strokeWidth="1" />
                <text x="0" y="-14" fill="#ffffff" fontSize="8.5" fontWeight="bold" textAnchor="middle" fontFamily="monospace">GRID C8</text>
              </g>
            );
          })()}

          {/* 2. Occurrence: Flocking Kuntul Kerbau at Grid G12 (Threshold Runway 1 25L) */}
          {(activeLayer === 'all' || activeLayer === 'occurrences') && (() => {
            const pt = getCellCenter(12, 'G');
            return (
              <g
                className="cursor-pointer group"
                transform={`translate(${pt.x + 10}, ${pt.y - 20})`}
                onClick={() => setSelectedPoint({
                  type: 'occurrence',
                  title: 'OCCURRENCE: Flocking Kuntul Kerbau (15 Ekor)',
                  location: 'Threshold Runway 1 25L - Stopway / PAPI',
                  grid: 'Grid G12',
                  details: 'Kawanan 15 ekor burung melintas rendah di jalur glide path saat GA-152 posisi final approach. Dispersal pyrotechnic berhasil dalam 2 menit.',
                  id: occurrences[0]?.id || 'occ-001'
                })}
              >
                <circle cx="0" cy="0" r="15" fill="#f59e0b" opacity="0.4" className="animate-ping" />
                <circle cx="0" cy="0" r="10" fill="#d97706" stroke="#ffffff" strokeWidth="2.5" filter="url(#glowAmber)" />
                <text x="0" y="3.5" fill="#ffffff" fontSize="9" fontWeight="black" textAnchor="middle">O</text>
                {/* Grid Badge */}
                <rect x="-24" y="-24" width="48" height="14" rx="3" fill="#78350f" stroke="#fde68a" strokeWidth="1" />
                <text x="0" y="-14" fill="#ffffff" fontSize="8.5" fontWeight="bold" textAnchor="middle" fontFamily="monospace">GRID G12</text>
              </g>
            );
          })()}

          {/* 3. Patrol / Infield Habitat Checkpoint at Grid E7 (Runway 1 Infield) */}
          {(activeLayer === 'all' || activeLayer === 'patrols') && (() => {
            const pt = getCellCenter(7, 'E');
            return (
              <g
                className="cursor-pointer group"
                transform={`translate(${pt.x - 30}, ${pt.y + 10})`}
                onClick={() => setSelectedPoint({
                  type: 'patrol',
                  title: 'INSPEKSI HABITAT & VEGETASI WHU',
                  location: 'Infield Runway 07R/25L & Taxiway Alpha',
                  grid: 'Grid E7',
                  details: 'Pemantauan populasi satwa liar (Burung Kuntul 24 ekor, Blekok 8 ekor). Vegetasi rumput terkontrol 10-14 cm pasca pemotongan.',
                  id: patrols[0]?.id || 'patrol-001'
                })}
              >
                <circle cx="0" cy="0" r="9" fill="#0284c7" stroke="#ffffff" strokeWidth="2" />
                <text x="0" y="3" fill="#ffffff" fontSize="8.5" fontWeight="black" textAnchor="middle">P</text>
                {/* Grid Badge */}
                <rect x="-24" y="-22" width="48" height="13" rx="3" fill="#0c4a6e" stroke="#7dd3fc" strokeWidth="1" />
                <text x="0" y="-13" fill="#ffffff" fontSize="8" fontWeight="bold" textAnchor="middle" fontFamily="monospace">GRID E7</text>
              </g>
            );
          })()}

          {/* Hovered / Selected Grid coordinate HUD indicator in bottom left */}
          <g transform={`translate(20, ${viewBoxHeight - 45})`}>
            <rect width="210" height="28" rx="5" fill="#020617" fillOpacity="0.85" stroke="#334155" strokeWidth="1" />
            <text x="12" y="19" fill="#94a3b8" fontSize="10" fontFamily="monospace">
              KOORDINAT GRID: <tspan fill="#38bdf8" fontWeight="bold">{selectedCell || hoveredCell || 'PILIH SEL'}</tspan>
            </text>
          </g>

          {/* Scale bar indicator (0 - 500m - 1km matching official PDF) */}
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

      {/* Selected Marker Detail Card */}
      {selectedPoint && (
        <div className="p-4 bg-slate-900 border-t border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-start space-x-3">
            <div className={`p-2 rounded-lg text-white mt-0.5 ${
              selectedPoint.type === 'strike' ? 'bg-rose-600' :
              selectedPoint.type === 'occurrence' ? 'bg-amber-600' : 'bg-sky-600'
            }`}>
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-white text-sm">{selectedPoint.title}</span>
                <span className="px-2 py-0.5 rounded bg-sky-950 text-sky-300 font-mono font-bold text-[11px] border border-sky-800">
                  {selectedPoint.grid}
                </span>
              </div>
              <p className="text-slate-300 font-medium mt-0.5">📍 {selectedPoint.location}</p>
              <p className="text-slate-400 mt-1 max-w-2xl">{selectedPoint.details}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
            <button
              onClick={() => setSelectedPoint(null)}
              className="px-3.5 py-1.5 rounded-lg text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition"
            >
              Tutup
            </button>
            {onSelectReport && (
              <button
                onClick={() => onSelectReport(selectedPoint.type, selectedPoint.id)}
                className="px-4 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-semibold transition flex items-center gap-1.5 shadow"
              >
                <Eye className="w-4 h-4" />
                Buka Dokumen
              </button>
            )}
          </div>
        </div>
      )}

      {/* Official Sign-off & Document Attribution Footer matching the attached file */}
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
