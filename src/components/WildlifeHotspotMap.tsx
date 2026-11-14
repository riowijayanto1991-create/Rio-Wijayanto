import React, { useState, useEffect, useRef, useMemo } from 'react';
import L from 'leaflet';
import { 
  MapPin, 
  Layers, 
  Flame, 
  AlertTriangle, 
  ShieldAlert, 
  Crosshair, 
  Compass, 
  Filter, 
  Eye, 
  Share2, 
  Plus, 
  CheckCircle2, 
  Info, 
  Plane, 
  Bird, 
  Navigation,
  Sparkles,
  Maximize2,
  Minimize2,
  Search,
  Radio,
  RefreshCw,
  ExternalLink,
  GripHorizontal,
  ChevronDown,
  ChevronUp,
  Move,
  X,
  RotateCcw,
  Sliders,
  EyeOff
} from 'lucide-react';
import { PatrolReport, OccurrenceReport, WildlifeStrikeReport } from '../types';
import { DEFAULT_AIRPORT_ARP, OPERATIONAL_RADIUS_PRESETS } from '../utils/geoUtils';
import { 
  CGK_RUNWAYS, 
  CGK_AIRSIDE_ZONES, 
  identifyLocationFromCoordinates, 
  resolveReportCoordinates,
  getGridCellCoordinates 
} from '../utils/airsideGeoData';

// Injeksi pola arsir SVG diagonal untuk Radius 3 km (Merah), 5 km (Kuning), dan 13 km (Orange)
const injectLeafletHatchPattern = (map: L.Map) => {
  try {
    const overlayPane = map.getPanes().overlayPane;
    if (!overlayPane) return;
    let svg = overlayPane.querySelector('svg');
    if (!svg) return;

    let defs = svg.querySelector('defs');
    if (!defs) {
      defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
      svg.insertBefore(defs, svg.firstChild);
    }

    // 1. Pola Arsir Radius 3 km (Merah - Zona Bahaya Kritis)
    if (!defs.querySelector('#hatch-radius-3km')) {
      const pattern3 = document.createElementNS('http://www.w3.org/2000/svg', 'pattern');
      pattern3.setAttribute('id', 'hatch-radius-3km');
      pattern3.setAttribute('patternUnits', 'userSpaceOnUse');
      pattern3.setAttribute('width', '18');
      pattern3.setAttribute('height', '18');
      pattern3.setAttribute('patternTransform', 'rotate(45 0 0)');

      const bg3 = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      bg3.setAttribute('width', '18');
      bg3.setAttribute('height', '18');
      bg3.setAttribute('fill', '#ef4444');
      bg3.setAttribute('fill-opacity', '0.18');

      const line3a = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line3a.setAttribute('x1', '0');
      line3a.setAttribute('y1', '0');
      line3a.setAttribute('x2', '0');
      line3a.setAttribute('y2', '18');
      line3a.setAttribute('stroke', '#dc2626');
      line3a.setAttribute('stroke-width', '3.5');
      line3a.setAttribute('stroke-opacity', '0.85');

      const line3b = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line3b.setAttribute('x1', '9');
      line3b.setAttribute('y1', '0');
      line3b.setAttribute('x2', '9');
      line3b.setAttribute('y2', '18');
      line3b.setAttribute('stroke', '#b91c1c');
      line3b.setAttribute('stroke-width', '1.8');
      line3b.setAttribute('stroke-opacity', '0.65');

      pattern3.appendChild(bg3);
      pattern3.appendChild(line3a);
      pattern3.appendChild(line3b);
      defs.appendChild(pattern3);
    }

    // 2. Pola Arsir Radius 5 km (Kuning - Perimeter Airside)
    if (!defs.querySelector('#hatch-radius-5km')) {
      const pattern5 = document.createElementNS('http://www.w3.org/2000/svg', 'pattern');
      pattern5.setAttribute('id', 'hatch-radius-5km');
      pattern5.setAttribute('patternUnits', 'userSpaceOnUse');
      pattern5.setAttribute('width', '20');
      pattern5.setAttribute('height', '20');
      pattern5.setAttribute('patternTransform', 'rotate(45 0 0)');

      const bg5 = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      bg5.setAttribute('width', '20');
      bg5.setAttribute('height', '20');
      bg5.setAttribute('fill', '#eab308');
      bg5.setAttribute('fill-opacity', '0.15');

      const line5a = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line5a.setAttribute('x1', '0');
      line5a.setAttribute('y1', '0');
      line5a.setAttribute('x2', '0');
      line5a.setAttribute('y2', '20');
      line5a.setAttribute('stroke', '#ca8a04');
      line5a.setAttribute('stroke-width', '3.5');
      line5a.setAttribute('stroke-opacity', '0.85');

      const line5b = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line5b.setAttribute('x1', '10');
      line5b.setAttribute('y1', '0');
      line5b.setAttribute('x2', '10');
      line5b.setAttribute('y2', '20');
      line5b.setAttribute('stroke', '#eab308');
      line5b.setAttribute('stroke-width', '1.8');
      line5b.setAttribute('stroke-opacity', '0.65');

      pattern5.appendChild(bg5);
      pattern5.appendChild(line5a);
      pattern5.appendChild(line5b);
      defs.appendChild(pattern5);
    }

    // 3. Pola Arsir Radius 13 km (Orange - ICAO Doc 9137 7 NM)
    if (!defs.querySelector('#hatch-radius-13km')) {
      const pattern13 = document.createElementNS('http://www.w3.org/2000/svg', 'pattern');
      pattern13.setAttribute('id', 'hatch-radius-13km');
      pattern13.setAttribute('patternUnits', 'userSpaceOnUse');
      pattern13.setAttribute('width', '22');
      pattern13.setAttribute('height', '22');
      pattern13.setAttribute('patternTransform', 'rotate(45 0 0)');

      const bg13 = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      bg13.setAttribute('width', '22');
      bg13.setAttribute('height', '22');
      bg13.setAttribute('fill', '#f97316');
      bg13.setAttribute('fill-opacity', '0.14');

      const line13a = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line13a.setAttribute('x1', '0');
      line13a.setAttribute('y1', '0');
      line13a.setAttribute('x2', '0');
      line13a.setAttribute('y2', '22');
      line13a.setAttribute('stroke', '#ea580c');
      line13a.setAttribute('stroke-width', '3.5');
      line13a.setAttribute('stroke-opacity', '0.8');

      const line13b = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line13b.setAttribute('x1', '11');
      line13b.setAttribute('y1', '0');
      line13b.setAttribute('x2', '11');
      line13b.setAttribute('y2', '22');
      line13b.setAttribute('stroke', '#c2410c');
      line13b.setAttribute('stroke-width', '1.8');
      line13b.setAttribute('stroke-opacity', '0.55');

      pattern13.appendChild(bg13);
      pattern13.appendChild(line13a);
      pattern13.appendChild(line13b);
      defs.appendChild(pattern13);
    }
  } catch (err) {
    console.error('Error injecting SVG hatch patterns:', err);
  }
};

interface WildlifeHotspotMapProps {
  patrols: PatrolReport[];
  occurrences: OccurrenceReport[];
  strikes: WildlifeStrikeReport[];
  initialSelectedId?: string;
  onPreviewReport?: (type: 'patrol' | 'occurrence' | 'strike', id: string) => void;
  onOpenBroadcast?: (type: 'PATROL' | 'OCCURRENCE' | 'STRIKE', report: any) => void;
  onCreateReportWithLocation?: (
    type: 'occurrence' | 'strike', 
    locationData: { 
      latitude: number; 
      longitude: number; 
      gridLocation: string; 
      runwayTaxiway: string; 
      lokasi: string; 
    }
  ) => void;
}

export const WildlifeHotspotMap: React.FC<WildlifeHotspotMapProps> = ({
  patrols,
  occurrences,
  strikes,
  initialSelectedId,
  onPreviewReport,
  onOpenBroadcast,
  onCreateReportWithLocation
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const layersGroupRef = useRef<L.LayerGroup | null>(null);
  const pinMarkerRef = useRef<L.Marker | null>(null);

  // Map tile mode
  const [mapTileMode, setMapTileMode] = useState<'osm' | 'satellite'>('osm');

  // Interactive Pinpoint Mode state
  const [isPinpointMode, setIsPinpointMode] = useState<boolean>(false);
  const [selectedPoint, setSelectedPoint] = useState<{
    latitude: number;
    longitude: number;
    nearestZone: string;
    estimatedGrid: string;
    distanceFromArpKm: number;
    bearingDegree: number;
    cardinalDirection: string;
    isWithinAirsidePerimeter: boolean;
  } | null>(null);

  // Filters
  const [selectedType, setSelectedType] = useState<'ALL' | 'STRIKE' | 'OCCURRENCE'>('ALL');
  const [selectedArea, setSelectedArea] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [timeFilter, setTimeFilter] = useState<'ALL' | '24H' | '7D' | '30D'>('ALL');
  const [showHeatHalos, setShowHeatHalos] = useState<boolean>(true);
  const [showRunwayLines, setShowRunwayLines] = useState<boolean>(true);
  const [showRadiusRings, setShowRadiusRings] = useState<boolean>(true);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Floating & Non-Fixed Legend State (Tidak fix agar tidak mengganggu peta)
  const [isLegendOpen, setIsLegendOpen] = useState<boolean>(true);
  const [isLegendCollapsed, setIsLegendCollapsed] = useState<boolean>(false);
  const [legendCorner, setLegendCorner] = useState<'bottom-left' | 'bottom-right' | 'top-left' | 'top-right'>('bottom-left');
  const [legendPosition, setLegendPosition] = useState<{ x: number; y: number } | null>(null);
  const [isDraggingLegend, setIsDraggingLegend] = useState<boolean>(false);
  const dragStartRef = useRef<{ startX: number; startY: number; initialLeft: number; initialTop: number } | null>(null);
  const legendRef = useRef<HTMLDivElement | null>(null);

  // Filter incident datasets (Hanya Wildlife Strike & Occurrence yang diplot di peta)
  const filteredIncidents = useMemo(() => {
    const now = new Date().getTime();

    const isWithinTime = (dateStr: string) => {
      if (timeFilter === 'ALL') return true;
      try {
        const itemDate = new Date(dateStr).getTime();
        if (isNaN(itemDate)) return true;
        const diffHours = (now - itemDate) / (1000 * 60 * 60);
        if (timeFilter === '24H') return diffHours <= 24;
        if (timeFilter === '7D') return diffHours <= 24 * 7;
        if (timeFilter === '30D') return diffHours <= 24 * 30;
      } catch {
        return true;
      }
      return true;
    };

    const strikesList = strikes
      .filter(s => isWithinTime(s.createdAt || s.hariTanggal))
      .map(s => {
        const coords = resolveReportCoordinates(s);
        const locationStr = `${s.lokasi} ${s.runwayTaxiway} ${s.gridLocation || ''}`.toLowerCase();
        return {
          id: s.id,
          type: 'strike' as const,
          reportNumber: s.reportNumber,
          date: s.hariTanggal,
          time: s.waktuKejadian,
          pleton: s.pleton,
          dinas: s.dinas,
          location: s.lokasi || s.runwayTaxiway,
          gridLocation: s.gridLocation || 'Sektor RWY',
          runwayTaxiway: s.runwayTaxiway,
          species: s.jenisWildlife,
          count: s.jumlahWildlife || 1,
          condition: s.kondisiWildlife,
          damage: s.indikasiKerusakan,
          coords,
          rawReport: s,
          searchBlob: `${s.reportNumber} ${s.jenisWildlife} ${locationStr} ${s.operatorAirline} ${s.flightNumber}`.toLowerCase()
        };
      });

    const occsList = occurrences
      .filter(o => isWithinTime(o.createdAt || o.hariTanggal))
      .map(o => {
        const coords = resolveReportCoordinates(o);
        const locationStr = `${o.lokasi} ${o.runwayTaxiwayArea} ${o.gridLocation || ''}`.toLowerCase();
        return {
          id: o.id,
          type: 'occurrence' as const,
          reportNumber: o.reportNumber,
          date: o.hariTanggal,
          time: o.waktuKejadian,
          pleton: o.pleton,
          dinas: o.dinas,
          location: o.lokasi || o.runwayTaxiwayArea,
          gridLocation: o.gridLocation || 'Sektor Airside',
          runwayTaxiway: o.runwayTaxiwayArea,
          species: o.jenisSatwa,
          count: o.jumlahSatwa || 1,
          condition: o.kondisiSatwa,
          damage: 'Tidak ada',
          coords,
          rawReport: o,
          searchBlob: `${o.reportNumber} ${o.jenisSatwa} ${locationStr} ${o.jenisOccurrence}`.toLowerCase()
        };
      });

    let combined = [...strikesList, ...occsList];

    // Filter by type
    if (selectedType === 'STRIKE') combined = combined.filter(i => i.type === 'strike');
    else if (selectedType === 'OCCURRENCE') combined = combined.filter(i => i.type === 'occurrence');

    // Filter by runway / area
    if (selectedArea !== 'ALL') {
      combined = combined.filter(i => {
        const blob = `${i.location} ${i.runwayTaxiway} ${i.gridLocation}`.toLowerCase();
        if (selectedArea === 'RWY_07L_25R') return blob.includes('07l') || blob.includes('25r') || blob.includes('rwy 2') || blob.includes('runway 2');
        if (selectedArea === 'RWY_07R_25L') return blob.includes('07r') || blob.includes('25l') || blob.includes('rwy 1') || blob.includes('runway 1');
        if (selectedArea === 'RWY_06_24') return blob.includes('06') || blob.includes('24') || blob.includes('rwy 3') || blob.includes('runway 3');
        if (selectedArea === 'TAXIWAY') return blob.includes('twy') || blob.includes('taxiway') || blob.includes('november') || blob.includes('papa');
        if (selectedArea === 'APRON') return blob.includes('apron') || blob.includes('terminal') || blob.includes('stand');
        return true;
      });
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      combined = combined.filter(i => i.searchBlob.includes(q));
    }

    return combined;
  }, [strikes, occurrences, selectedType, selectedArea, searchQuery, timeFilter]);

  // Aggregate hotspot clusters / summary (berdasarkan insiden strike & occurrence)
  const hotspotAnalysis = useMemo(() => {
    const areaCounts: Record<string, { strikes: number; occurrences: number }> = {
      'Runway 07L / 25R (Utara)': { strikes: 0, occurrences: 0 },
      'Runway 07R / 25L (Selatan)': { strikes: 0, occurrences: 0 },
      'Runway 06 / 24 (Runway 3)': { strikes: 0, occurrences: 0 },
      'Taxiways & Infield Central': { strikes: 0, occurrences: 0 },
      'Kolam Retensi & Drainase': { strikes: 0, occurrences: 0 }
    };

    filteredIncidents.forEach(inc => {
      const text = `${inc.location} ${inc.runwayTaxiway}`.toLowerCase();
      let target = 'Taxiways & Infield Central';

      if (text.includes('07l') || text.includes('25r') || text.includes('rwy 2')) target = 'Runway 07L / 25R (Utara)';
      else if (text.includes('07r') || text.includes('25l') || text.includes('rwy 1')) target = 'Runway 07R / 25L (Selatan)';
      else if (text.includes('06') || text.includes('24') || text.includes('rwy 3')) target = 'Runway 06 / 24 (Runway 3)';
      else if (text.includes('kolam') || text.includes('drainase') || text.includes('retensi')) target = 'Kolam Retensi & Drainase';

      if (inc.type === 'strike') areaCounts[target].strikes++;
      else if (inc.type === 'occurrence') areaCounts[target].occurrences++;
    });

    return Object.entries(areaCounts)
      .map(([name, counts]) => ({
        name,
        strikes: counts.strikes,
        occurrences: counts.occurrences,
        totalHazard: counts.strikes * 3 + counts.occurrences * 2
      }))
      .sort((a, b) => b.totalHazard - a.totalHazard);
  }, [filteredIncidents]);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [DEFAULT_AIRPORT_ARP.latitude, DEFAULT_AIRPORT_ARP.longitude],
        zoom: 14,
        minZoom: 9,
        maxZoom: 18,
        zoomControl: false
      });

      // Add Zoom Control at bottom-right
      L.control.zoom({ position: 'bottomright' }).addTo(map);

      // Add scale control
      L.control.scale({ imperial: false, metric: true, position: 'bottomleft' }).addTo(map);

      // Create Layer Group for easy updates
      const layerGroup = L.layerGroup().addTo(map);
      layersGroupRef.current = layerGroup;
      mapInstanceRef.current = map;

      // Click event for interactive pinpoint marking
      map.on('click', (e: L.LeafletMouseEvent) => {
        const { lat, lng } = e.latlng;
        const locInfo = identifyLocationFromCoordinates(lat, lng);
        setSelectedPoint({
          latitude: parseFloat(lat.toFixed(5)),
          longitude: parseFloat(lng.toFixed(5)),
          ...locInfo
        });
      });
    }

    return () => {
      // Map cleanup on final unmount only
    };
  }, []);

  // Handler untuk mengarahkan kamera langsung ke seluruh luasan Radius 13 km ICAO
  const handleFocus13km = () => {
    const map = mapInstanceRef.current;
    if (!map) return;
    setShowRadiusRings(true);
    const latDelta = 13 / 111.32;
    const lngDelta = 13 / (111.32 * Math.cos(DEFAULT_AIRPORT_ARP.latitude * (Math.PI / 180)));
    const southWest = L.latLng(DEFAULT_AIRPORT_ARP.latitude - latDelta * 1.08, DEFAULT_AIRPORT_ARP.longitude - lngDelta * 1.08);
    const northEast = L.latLng(DEFAULT_AIRPORT_ARP.latitude + latDelta * 1.08, DEFAULT_AIRPORT_ARP.longitude + lngDelta * 1.08);
    map.flyToBounds(L.latLngBounds(southWest, northEast), { duration: 1.2, padding: [25, 25] });
  };

  // Handler untuk mengarahkan kamera langsung ke luasan Radius 5 km Kuning
  const handleFocus5km = () => {
    const map = mapInstanceRef.current;
    if (!map) return;
    setShowRadiusRings(true);
    const latDelta = 5 / 111.32;
    const lngDelta = 5 / (111.32 * Math.cos(DEFAULT_AIRPORT_ARP.latitude * (Math.PI / 180)));
    const southWest = L.latLng(DEFAULT_AIRPORT_ARP.latitude - latDelta * 1.08, DEFAULT_AIRPORT_ARP.longitude - lngDelta * 1.08);
    const northEast = L.latLng(DEFAULT_AIRPORT_ARP.latitude + latDelta * 1.08, DEFAULT_AIRPORT_ARP.longitude + lngDelta * 1.08);
    map.flyToBounds(L.latLngBounds(southWest, northEast), { duration: 1.2, padding: [25, 25] });
  };

  // Handler untuk mengarahkan kamera langsung ke luasan Radius 3 km Merah
  const handleFocus3km = () => {
    const map = mapInstanceRef.current;
    if (!map) return;
    setShowRadiusRings(true);
    const latDelta = 3 / 111.32;
    const lngDelta = 3 / (111.32 * Math.cos(DEFAULT_AIRPORT_ARP.latitude * (Math.PI / 180)));
    const southWest = L.latLng(DEFAULT_AIRPORT_ARP.latitude - latDelta * 1.08, DEFAULT_AIRPORT_ARP.longitude - lngDelta * 1.08);
    const northEast = L.latLng(DEFAULT_AIRPORT_ARP.latitude + latDelta * 1.08, DEFAULT_AIRPORT_ARP.longitude + lngDelta * 1.08);
    map.flyToBounds(L.latLngBounds(southWest, northEast), { duration: 1.2, padding: [25, 25] });
  };

  // Dragging event handlers untuk legenda floating agar tidak fixed dan tidak menghalangi peta
  const handleLegendMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button')) return;
    e.preventDefault();
    const rect = legendRef.current?.getBoundingClientRect();
    const containerRect = mapContainerRef.current?.getBoundingClientRect();
    if (!rect || !containerRect) return;

    dragStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initialLeft: rect.left - containerRect.left,
      initialTop: rect.top - containerRect.top
    };
    setIsDraggingLegend(true);
  };

  const handleLegendTouchStart = (e: React.TouchEvent) => {
    if ((e.target as HTMLElement).closest('button')) return;
    if (e.touches.length !== 1) return;
    const touch = e.touches[0];
    const rect = legendRef.current?.getBoundingClientRect();
    const containerRect = mapContainerRef.current?.getBoundingClientRect();
    if (!rect || !containerRect) return;

    dragStartRef.current = {
      startX: touch.clientX,
      startY: touch.clientY,
      initialLeft: rect.left - containerRect.left,
      initialTop: rect.top - containerRect.top
    };
    setIsDraggingLegend(true);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingLegend || !dragStartRef.current || !mapContainerRef.current) return;
      const containerRect = mapContainerRef.current.getBoundingClientRect();
      const deltaX = e.clientX - dragStartRef.current.startX;
      const deltaY = e.clientY - dragStartRef.current.startY;

      const newLeft = Math.max(10, Math.min(containerRect.width - 250, dragStartRef.current.initialLeft + deltaX));
      const newTop = Math.max(10, Math.min(containerRect.height - 80, dragStartRef.current.initialTop + deltaY));

      setLegendPosition({ x: newLeft, y: newTop });
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDraggingLegend || !dragStartRef.current || !mapContainerRef.current || e.touches.length !== 1) return;
      const touch = e.touches[0];
      const containerRect = mapContainerRef.current.getBoundingClientRect();
      const deltaX = touch.clientX - dragStartRef.current.startX;
      const deltaY = touch.clientY - dragStartRef.current.startY;

      const newLeft = Math.max(10, Math.min(containerRect.width - 250, dragStartRef.current.initialLeft + deltaX));
      const newTop = Math.max(10, Math.min(containerRect.height - 80, dragStartRef.current.initialTop + deltaY));

      setLegendPosition({ x: newLeft, y: newTop });
    };

    const handleEnd = () => {
      setIsDraggingLegend(false);
      dragStartRef.current = null;
    };

    if (isDraggingLegend) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleEnd);
      window.addEventListener('touchmove', handleTouchMove);
      window.addEventListener('touchend', handleEnd);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleEnd);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleEnd);
    };
  }, [isDraggingLegend]);

  // Update Base Tile Layer
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Find and remove existing tile layer
    map.eachLayer((layer) => {
      if (layer instanceof L.TileLayer) {
        map.removeLayer(layer);
      }
    });

    if (mapTileMode === 'satellite') {
      // ESRI World Imagery (High-Res Airfield Satellite Imagery)
      L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: '&copy; Esri &amp; Airfield Satellite Data',
        maxZoom: 18
      }).addTo(map);
    } else {
      // OpenStreetMap Carto Standard
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 18,
        subdomains: ['a', 'b', 'c']
      }).addTo(map);
    }
  }, [mapTileMode]);

  // Update Airside Geometries & Incident Markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    const layerGroup = layersGroupRef.current;
    if (!map || !layerGroup) return;

    // Clear previous drawings in layer group
    layerGroup.clearLayers();

    // 1. Draw Operational Radius Rings with Hatched Patterns (13km Orange, 5km Kuning, 3km Merah)
    if (showRadiusRings) {
      injectLeafletHatchPattern(map);

      // --- A. RADIUS 13.0 KM (ORANGE - ICAO DOC 9137 7 NM) ---
      const casing13km = L.circle([DEFAULT_AIRPORT_ARP.latitude, DEFAULT_AIRPORT_ARP.longitude], {
        radius: 13000,
        color: '#7c2d12',
        weight: 6,
        opacity: 0.35,
        fill: false,
        interactive: false
      });
      layerGroup.addLayer(casing13km);

      const perimeter13km = L.circle([DEFAULT_AIRPORT_ARP.latitude, DEFAULT_AIRPORT_ARP.longitude], {
        radius: 13000,
        color: '#ea580c', // Orange
        weight: 3.5,
        dashArray: '14, 8',
        opacity: 0.95,
        fill: false
      });
      perimeter13km.bindTooltip(
        `<b>Radius 13.0 km (7 NM) ICAO</b><br/>Zona Pemantauan Satwa Liar & Evaluasi Atraktan (Arsir Orange)`,
        { sticky: true, className: 'leaflet-custom-tooltip' }
      );
      layerGroup.addLayer(perimeter13km);

      const hatch13km = L.circle([DEFAULT_AIRPORT_ARP.latitude, DEFAULT_AIRPORT_ARP.longitude], {
        radius: 13000,
        color: '#ea580c',
        weight: 1,
        fillColor: '#f97316',
        fillOpacity: 0.18,
        className: 'leaflet-13km-hatch-circle'
      });
      hatch13km.bindPopup(`
        <div class="p-3 text-xs font-sans min-w-[270px] space-y-2">
          <div class="flex items-center gap-2 border-b border-orange-200 pb-2">
            <span class="px-2 py-0.5 rounded bg-orange-600 text-white font-bold text-xs">ICAO DOC 9137</span>
            <div>
              <h4 class="font-bold text-slate-900 text-sm">Radius 13.0 km (7 NM)</h4>
              <p class="text-[10px] text-orange-700 font-medium">Batas Evaluasi Atraktan &amp; Populasi Satwa Liar</p>
            </div>
          </div>
          <p class="text-slate-600 text-[11px] leading-relaxed">
            Berdasarkan standar <b>ICAO Doc 9137 Part 3</b> &amp; <b>Doc 9388</b>, area dalam radius 13 km dari ARP Bandara wajib dimonitoring terhadap sumber penarik satwa (TPA, persawahan, rawa basah, kolam ikan, tempat pemotongan hewan).
          </p>
          <div class="bg-orange-50 p-2.5 rounded-lg border border-orange-200 text-[10px] space-y-1 font-mono text-orange-900">
            <div>• Titik Pusat: ARP WIII (${DEFAULT_AIRPORT_ARP.latitude}, ${DEFAULT_AIRPORT_ARP.longitude})</div>
            <div>• Luas Area Pemantauan: ±530.9 km²</div>
            <div>• Pola Penanda: Arsir diagonal orange bergaris tebal</div>
          </div>
        </div>
      `);
      layerGroup.addLayer(hatch13km);
      const hatchEl13 = hatch13km.getElement();
      if (hatchEl13) {
        hatchEl13.setAttribute('fill', 'url(#hatch-radius-13km)');
        hatchEl13.setAttribute('fill-opacity', '1');
      }

      // Pin arah mata angin di lingkar 13 km
      const cardinalPoints13 = [
        { label: '▲ Radius 13.0 km (Utara - Pesisir Teluk Jakarta)', lat: DEFAULT_AIRPORT_ARP.latitude + (13 / 111.32), lng: DEFAULT_AIRPORT_ARP.longitude },
        { label: '▼ Radius 13.0 km (Selatan - Tangerang Kota)', lat: DEFAULT_AIRPORT_ARP.latitude - (13 / 111.32), lng: DEFAULT_AIRPORT_ARP.longitude },
        { label: '▶ Radius 13.0 km (Timur - Jakarta Barat)', lat: DEFAULT_AIRPORT_ARP.latitude, lng: DEFAULT_AIRPORT_ARP.longitude + (13 / (111.32 * Math.cos(DEFAULT_AIRPORT_ARP.latitude * (Math.PI / 180)))) },
        { label: '◀ Radius 13.0 km (Barat - Tangerang Utara)', lat: DEFAULT_AIRPORT_ARP.latitude, lng: DEFAULT_AIRPORT_ARP.longitude - (13 / (111.32 * Math.cos(DEFAULT_AIRPORT_ARP.latitude * (Math.PI / 180)))) }
      ];

      cardinalPoints13.forEach(pt => {
        const marker = L.marker([pt.lat, pt.lng], {
          icon: L.divIcon({
            className: 'cardinal-13km-icon',
            html: `
              <div class="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-orange-600/95 text-white font-bold text-[10px] shadow-lg border border-orange-200 whitespace-nowrap backdrop-blur-sm pointer-events-auto transform -translate-x-1/2 -translate-y-1/2 cursor-pointer hover:scale-105 transition-transform">
                <span class="w-1.5 h-1.5 rounded-full bg-orange-200 animate-pulse"></span>
                <span>13 km Orange</span>
              </div>
            `,
            iconSize: [0, 0]
          }),
          interactive: true
        });
        marker.bindTooltip(pt.label, { sticky: true, className: 'leaflet-custom-tooltip' });
        layerGroup.addLayer(marker);
      });

      // --- B. RADIUS 5.0 KM (KUNING - PERIMETER AIRSIDE & FASILITAS) ---
      const casing5km = L.circle([DEFAULT_AIRPORT_ARP.latitude, DEFAULT_AIRPORT_ARP.longitude], {
        radius: 5000,
        color: '#713f12',
        weight: 5,
        opacity: 0.35,
        fill: false,
        interactive: false
      });
      layerGroup.addLayer(casing5km);

      const perimeter5km = L.circle([DEFAULT_AIRPORT_ARP.latitude, DEFAULT_AIRPORT_ARP.longitude], {
        radius: 5000,
        color: '#ca8a04', // Kuning
        weight: 3.5,
        dashArray: '10, 6',
        opacity: 0.95,
        fill: false
      });
      perimeter5km.bindTooltip(
        `<b>Radius 5.0 km (Perimeter Airside)</b><br/>Batas Pagar Perimeter & Fasilitas Bandara (Arsir Kuning)`,
        { sticky: true, className: 'leaflet-custom-tooltip' }
      );
      layerGroup.addLayer(perimeter5km);

      const hatch5km = L.circle([DEFAULT_AIRPORT_ARP.latitude, DEFAULT_AIRPORT_ARP.longitude], {
        radius: 5000,
        color: '#ca8a04',
        weight: 1,
        fillColor: '#eab308',
        fillOpacity: 0.2,
        className: 'leaflet-5km-hatch-circle'
      });
      hatch5km.bindPopup(`
        <div class="p-3 text-xs font-sans min-w-[260px] space-y-2">
          <div class="flex items-center gap-2 border-b border-yellow-200 pb-2">
            <span class="px-2 py-0.5 rounded bg-yellow-500 text-slate-900 font-bold text-xs">AIRSIDE 5 KM</span>
            <div>
              <h4 class="font-bold text-slate-900 text-sm">Radius 5.0 km</h4>
              <p class="text-[10px] text-yellow-800 font-medium">Perimeter Fasilitas &amp; Daerah Kerja Bandara</p>
            </div>
          </div>
          <p class="text-slate-600 text-[11px] leading-relaxed">
            Mencakup seluruh pagar perimeter terluar bandara, runway strip 07L/25R, 07R/25L, 06/24, taxiway, apron terminal, serta kolam retensi penampungan air.
          </p>
          <div class="bg-yellow-50 p-2 rounded-lg border border-yellow-200 text-[10px] space-y-1 font-mono text-yellow-900">
            <div>• Luas Area: ±78.5 km²</div>
            <div>• Pola Penanda: Arsir diagonal kuning kontras</div>
          </div>
        </div>
      `);
      layerGroup.addLayer(hatch5km);
      const hatchEl5 = hatch5km.getElement();
      if (hatchEl5) {
        hatchEl5.setAttribute('fill', 'url(#hatch-radius-5km)');
        hatchEl5.setAttribute('fill-opacity', '1');
      }

      // Pin arah mata angin di lingkar 5 km (Utara & Selatan)
      const cardinalPoints5 = [
        { label: '▲ Radius 5.0 km (Utara Airside)', lat: DEFAULT_AIRPORT_ARP.latitude + (5 / 111.32), lng: DEFAULT_AIRPORT_ARP.longitude },
        { label: '▼ Radius 5.0 km (Selatan Perimeter)', lat: DEFAULT_AIRPORT_ARP.latitude - (5 / 111.32), lng: DEFAULT_AIRPORT_ARP.longitude }
      ];
      cardinalPoints5.forEach(pt => {
        const marker = L.marker([pt.lat, pt.lng], {
          icon: L.divIcon({
            className: 'cardinal-5km-icon',
            html: `
              <div class="flex items-center gap-1 px-2 py-0.5 rounded-full bg-yellow-500 text-slate-900 font-bold text-[9.5px] shadow-md border border-yellow-200 whitespace-nowrap transform -translate-x-1/2 -translate-y-1/2 pointer-events-auto">
                <span class="w-1.5 h-1.5 rounded-full bg-yellow-900"></span>
                <span>5 km Kuning</span>
              </div>
            `,
            iconSize: [0, 0]
          }),
          interactive: true
        });
        marker.bindTooltip(pt.label, { sticky: true, className: 'leaflet-custom-tooltip' });
        layerGroup.addLayer(marker);
      });

      // --- C. RADIUS 3.0 KM (MERAH - ZONA BAHAYA KRITIS & RUNWAY INFIELD) ---
      const casing3km = L.circle([DEFAULT_AIRPORT_ARP.latitude, DEFAULT_AIRPORT_ARP.longitude], {
        radius: 3000,
        color: '#450a0a',
        weight: 5,
        opacity: 0.35,
        fill: false,
        interactive: false
      });
      layerGroup.addLayer(casing3km);

      const perimeter3km = L.circle([DEFAULT_AIRPORT_ARP.latitude, DEFAULT_AIRPORT_ARP.longitude], {
        radius: 3000,
        color: '#dc2626', // Merah
        weight: 3.5,
        dashArray: '8, 6',
        opacity: 0.95,
        fill: false
      });
      perimeter3km.bindTooltip(
        `<b>Radius 3.0 km (Zona Bahaya Kritis)</b><br/>Area Landas Pacu & Infield Inti (Arsir Merah)`,
        { sticky: true, className: 'leaflet-custom-tooltip' }
      );
      layerGroup.addLayer(perimeter3km);

      const hatch3km = L.circle([DEFAULT_AIRPORT_ARP.latitude, DEFAULT_AIRPORT_ARP.longitude], {
        radius: 3000,
        color: '#dc2626',
        weight: 1,
        fillColor: '#ef4444',
        fillOpacity: 0.24,
        className: 'leaflet-3km-hatch-circle'
      });
      hatch3km.bindPopup(`
        <div class="p-3 text-xs font-sans min-w-[260px] space-y-2">
          <div class="flex items-center gap-2 border-b border-red-200 pb-2">
            <span class="px-2 py-0.5 rounded bg-red-600 text-white font-bold text-xs">KRITIS 3 KM</span>
            <div>
              <h4 class="font-bold text-slate-900 text-sm">Radius 3.0 km</h4>
              <p class="text-[10px] text-red-700 font-medium">Zona Bahaya Satwa Kritis Landas Pacu</p>
            </div>
          </div>
          <p class="text-slate-600 text-[11px] leading-relaxed">
            Area operasional penerbangan paling kritis di sekitar ARP. Keberadaan satwa di zona ini memiliki probabilitas tabrakan (wildlife strike) tertinggi dengan fase lepas landas dan pendaratan pesawat.
          </p>
          <div class="bg-red-50 p-2 rounded-lg border border-red-200 text-[10px] space-y-1 font-mono text-red-900">
            <div>• Luas Area: ±28.3 km²</div>
            <div>• Pola Penanda: Arsir diagonal merah bergaris tebal</div>
          </div>
        </div>
      `);
      layerGroup.addLayer(hatch3km);
      const hatchEl3 = hatch3km.getElement();
      if (hatchEl3) {
        hatchEl3.setAttribute('fill', 'url(#hatch-radius-3km)');
        hatchEl3.setAttribute('fill-opacity', '1');
      }

      // Pin arah mata angin di lingkar 3 km (Timur & Barat)
      const cardinalPoints3 = [
        { label: '▶ Radius 3.0 km (Timur Infield)', lat: DEFAULT_AIRPORT_ARP.latitude, lng: DEFAULT_AIRPORT_ARP.longitude + (3 / (111.32 * Math.cos(DEFAULT_AIRPORT_ARP.latitude * (Math.PI / 180)))) },
        { label: '◀ Radius 3.0 km (Barat Infield)', lat: DEFAULT_AIRPORT_ARP.latitude, lng: DEFAULT_AIRPORT_ARP.longitude - (3 / (111.32 * Math.cos(DEFAULT_AIRPORT_ARP.latitude * (Math.PI / 180)))) }
      ];
      cardinalPoints3.forEach(pt => {
        const marker = L.marker([pt.lat, pt.lng], {
          icon: L.divIcon({
            className: 'cardinal-3km-icon',
            html: `
              <div class="flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-600 text-white font-bold text-[9.5px] shadow-md border border-red-200 whitespace-nowrap transform -translate-x-1/2 -translate-y-1/2 pointer-events-auto">
                <span class="w-1.5 h-1.5 rounded-full bg-red-200 animate-ping"></span>
                <span>3 km Merah</span>
              </div>
            `,
            iconSize: [0, 0]
          }),
          interactive: true
        });
        marker.bindTooltip(pt.label, { sticky: true, className: 'leaflet-custom-tooltip' });
        layerGroup.addLayer(marker);
      });
    }

    // 2. Draw Runway & Taxiway Centerlines / Polygons if enabled
    if (showRunwayLines) {
      CGK_RUNWAYS.forEach(rwy => {
        // 1. Semi-transparent geo-referenced casing matching runway physical width (allows OSM grey runway to show through)
        const runwayCasing = L.polyline(rwy.coordinates, {
          color: '#1e293b',
          weight: 12,
          opacity: 0.35,
          lineCap: 'square',
          lineJoin: 'miter'
        });
        layerGroup.addLayer(runwayCasing);

        // 2. High-contrast geo-referenced colored centerline perfectly superimposed
        const runwayLine = L.polyline(rwy.coordinates, {
          color: rwy.color,
          weight: 3.5,
          opacity: 0.95,
          lineCap: 'round'
        });

        const startCoord = rwy.thresholds?.startCoord || rwy.coordinates[0];
        const endCoord = rwy.thresholds?.endCoord || rwy.coordinates[1];
        const startCode = rwy.thresholds?.startCode || 'THR-A';
        const endCode = rwy.thresholds?.endCode || 'THR-B';

        runwayLine.bindPopup(`
          <div class="p-2.5 text-xs font-sans min-w-[260px]">
            <div class="flex items-center justify-between gap-2 border-b border-slate-200 pb-1.5 mb-2">
              <span class="font-bold text-slate-900 text-sm">${rwy.name}</span>
              <span class="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-sky-100 text-sky-800 border border-sky-300">
                ${rwy.lengthMeters ? `${rwy.lengthMeters.toLocaleString()}m` : 'ICAO Runway'}
              </span>
            </div>
            <div class="space-y-1.5 text-slate-700 text-[11px]">
              <div class="flex items-center justify-between text-[10px] text-slate-500">
                <span>True Heading:</span>
                <span class="font-mono font-bold text-slate-800">${rwy.headingText || '068° / 248° True'}</span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-slate-500 font-medium">Threshold ${startCode}:</span>
                <span class="font-mono font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                  ${startCoord[0].toFixed(6)}, ${startCoord[1].toFixed(6)}
                </span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-slate-500 font-medium">Threshold ${endCode}:</span>
                <span class="font-mono font-semibold text-sky-700 bg-sky-50 px-1.5 py-0.5 rounded border border-sky-200">
                  ${endCoord[0].toFixed(6)}, ${endCoord[1].toFixed(6)}
                </span>
              </div>
              <div class="pt-1 text-[10px] text-slate-500 border-t border-slate-100 flex items-center justify-between">
                <span>Ref: AIP WIII AD 2.12</span>
                <strong class="text-emerald-700">WGS84 Calibrated</strong>
              </div>
            </div>
          </div>
        `);
        layerGroup.addLayer(runwayLine);

        // 3. Threshold Badges at physical runway endpoints
        if (rwy.thresholds) {
          // Threshold Start Marker (e.g. 07R, 07L, 06)
          const startThreshIcon = L.divIcon({
            className: 'rwy-thresh-start-div',
            html: `<div class="px-1.5 py-0.5 rounded-md bg-emerald-800 text-emerald-100 text-[9px] font-mono font-bold tracking-tight shadow-md border border-emerald-400/60 pointer-events-auto cursor-pointer flex items-center gap-0.5" title="Threshold ${rwy.thresholds.startCode} (${rwy.thresholds.startCoord.join(', ')})"><span>${rwy.thresholds.startCode}</span></div>`,
            iconSize: [32, 18],
            iconAnchor: [16, 9]
          });
          const startMarker = L.marker(rwy.thresholds.startCoord, { icon: startThreshIcon });
          startMarker.bindTooltip(`Threshold ${rwy.thresholds.startCode}: [${rwy.thresholds.startCoord[0]}, ${rwy.thresholds.startCoord[1]}]`, { sticky: true });
          layerGroup.addLayer(startMarker);

          // Threshold End Marker (e.g. 25L, 25R, 24)
          const endThreshIcon = L.divIcon({
            className: 'rwy-thresh-end-div',
            html: `<div class="px-1.5 py-0.5 rounded-md bg-sky-800 text-sky-100 text-[9px] font-mono font-bold tracking-tight shadow-md border border-sky-400/60 pointer-events-auto cursor-pointer flex items-center gap-0.5" title="Threshold ${rwy.thresholds.endCode} (${rwy.thresholds.endCoord.join(', ')})"><span>${rwy.thresholds.endCode}</span></div>`,
            iconSize: [32, 18],
            iconAnchor: [16, 9]
          });
          const endMarker = L.marker(rwy.thresholds.endCoord, { icon: endThreshIcon });
          endMarker.bindTooltip(`Threshold ${rwy.thresholds.endCode}: [${rwy.thresholds.endCoord[0]}, ${rwy.thresholds.endCoord[1]}]`, { sticky: true });
          layerGroup.addLayer(endMarker);
        }
      });

      // Draw Key Taxiways & Zones
      CGK_AIRSIDE_ZONES.forEach(zone => {
        if (zone.category === 'taxiway') {
          const twyLine = L.polyline(zone.coordinates, {
            color: zone.color,
            weight: 3.5,
            dashArray: '4, 4',
            opacity: 0.75
          });
          twyLine.bindTooltip(zone.name, { sticky: true });
          layerGroup.addLayer(twyLine);
        } else if (zone.category === 'apron' || zone.category === 'water') {
          const polygon = L.polygon(zone.coordinates, {
            color: zone.color,
            weight: 1.5,
            fillColor: zone.color,
            fillOpacity: zone.category === 'water' ? 0.25 : 0.12
          });
          polygon.bindTooltip(zone.name, { sticky: true });
          layerGroup.addLayer(polygon);
        }
      });
    }

    // 3. Draw ARP Center Point
    const arpIcon = L.divIcon({
      className: 'arp-pin-icon',
      html: `
        <div class="w-6 h-6 rounded-full bg-sky-600 border-2 border-white shadow-md flex items-center justify-center text-white text-[10px] font-bold">
          ARP
        </div>
      `,
      iconSize: [24, 24],
      iconAnchor: [12, 12]
    });
    const arpMarker = L.marker([DEFAULT_AIRPORT_ARP.latitude, DEFAULT_AIRPORT_ARP.longitude], { icon: arpIcon });
    arpMarker.bindPopup(`
      <div class="p-2 text-xs font-sans">
        <div class="font-bold text-slate-900">${DEFAULT_AIRPORT_ARP.name}</div>
        <div class="text-sky-700 font-semibold font-mono">ARP WIII / CGK (Titik Referensi Utama)</div>
        <div class="text-[11px] text-slate-500 mt-1">Lat: ${DEFAULT_AIRPORT_ARP.latitude}, Lon: ${DEFAULT_AIRPORT_ARP.longitude}</div>
        <div class="text-[10px] text-slate-400">Elevasi: ${DEFAULT_AIRPORT_ARP.elevationMeters} MDPL</div>
      </div>
    `);
    layerGroup.addLayer(arpMarker);

    // 4. Draw Incidents & Hotspot Heat Halos (Khusus Wildlife Strike & Occurrence)
    filteredIncidents.forEach(inc => {
      const [lat, lon] = inc.coords;

      // Draw Heat Halo if enabled
      if (showHeatHalos) {
        const radiusMeters = inc.type === 'strike' ? 220 : 150;
        const color = inc.type === 'strike' ? '#e11d48' : '#f59e0b';
        const halo = L.circle([lat, lon], {
          radius: radiusMeters,
          color,
          weight: 1,
          opacity: 0.4,
          fillColor: color,
          fillOpacity: inc.type === 'strike' ? 0.22 : 0.16
        });
        layerGroup.addLayer(halo);
      }

      // Marker Icon creation
      let markerHtml = '';
      if (inc.type === 'strike') {
        markerHtml = `
          <div class="relative flex items-center justify-center cursor-pointer group">
            <span class="absolute w-8 h-8 rounded-full bg-rose-500/40 animate-ping"></span>
            <div class="w-7 h-7 rounded-full bg-rose-700 border-2 border-white shadow-xl flex items-center justify-center text-white text-xs font-bold ring-2 ring-rose-500/50">
              ✈
            </div>
          </div>
        `;
      } else {
        markerHtml = `
          <div class="relative flex items-center justify-center cursor-pointer group">
            <div class="w-6 h-6 rounded-full bg-amber-500 border-2 border-white shadow-lg flex items-center justify-center text-white text-xs font-bold">
              ⚠
            </div>
          </div>
        `;
      }

      const icon = L.divIcon({
        className: `incident-marker-${inc.type}`,
        html: markerHtml,
        iconSize: [28, 28],
        iconAnchor: [14, 14]
      });

      const marker = L.marker([lat, lon], { icon });

      // Build popup content
      const typeBadge = inc.type === 'strike'
        ? '<span class="px-2 py-0.5 rounded bg-rose-100 text-rose-800 font-bold text-[10px] border border-rose-300">WILDLIFE STRIKE</span>'
        : '<span class="px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-bold text-[10px] border border-amber-300">OCCURRENCE</span>';

      const popupHtml = `
        <div class="p-3 text-xs font-sans max-w-[270px]">
          <div class="flex items-center justify-between gap-2 mb-1.5">
            ${typeBadge}
            <span class="text-[10px] font-mono text-slate-500 font-semibold">${inc.reportNumber}</span>
          </div>

          <div class="font-bold text-slate-900 text-sm mb-1">${inc.species} (${inc.count} ekor)</div>

          <div class="space-y-1 text-slate-600 text-[11px] mb-2.5">
            <div class="flex items-center justify-between">
              <span class="text-slate-400">Waktu &amp; Tanggal:</span>
              <span class="font-medium text-slate-800">${inc.date} ${inc.time}</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-slate-400">Pleton / Dinas:</span>
              <span class="font-medium text-slate-800">${inc.pleton}</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-slate-400">Area / Runway:</span>
              <span class="font-semibold text-sky-900">${inc.runwayTaxiway || inc.location}</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-slate-400">Grid CGK:</span>
              <span class="font-mono font-bold text-amber-900 bg-amber-50 px-1 rounded">${inc.gridLocation}</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-slate-400">Kondisi:</span>
              <span class="font-medium ${inc.condition === 'Mati' || inc.condition === 'Carcass/Sisa' ? 'text-rose-600 font-bold' : 'text-emerald-700'}">${inc.condition}</span>
            </div>
            ${inc.type === 'strike' ? `
              <div class="flex items-center justify-between pt-1 border-t border-slate-100">
                <span class="text-slate-400">Indikasi Rusak:</span>
                <span class="font-bold ${inc.damage === 'Ada' ? 'text-rose-600' : 'text-slate-700'}">${inc.damage}</span>
              </div>
            ` : ''}
          </div>

          <div class="pt-2 border-t border-slate-200 flex items-center justify-between gap-1.5">
            <button 
              id="btn-view-rep-${inc.id}" 
              class="w-full py-1.5 px-2.5 bg-sky-600 hover:bg-sky-500 text-white rounded font-medium text-center text-xs transition cursor-pointer shadow-sm"
            >
              Buka Dokumen Resmi →
            </button>
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml);

      marker.on('popupopen', () => {
        setTimeout(() => {
          const btn = document.getElementById(`btn-view-rep-${inc.id}`);
          if (btn && onPreviewReport) {
            btn.onclick = () => {
              onPreviewReport(inc.type, inc.rawReport.id);
            };
          }
        }, 50);
      });

      layerGroup.addLayer(marker);
    });

  }, [filteredIncidents, showRunwayLines, showHeatHalos, showRadiusRings, onPreviewReport]);

  // Handle Pinpoint marker display
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (selectedPoint) {
      if (!pinMarkerRef.current) {
        const pinIcon = L.divIcon({
          className: 'pinpoint-user-icon',
          html: `
            <div class="relative flex items-center justify-center cursor-move">
              <span class="absolute -top-1 w-9 h-9 rounded-full bg-emerald-500/30 animate-ping"></span>
              <div class="w-8 h-8 rounded-full bg-emerald-600 border-2 border-white shadow-2xl flex items-center justify-center text-white font-bold ring-4 ring-emerald-400/40">
                📍
              </div>
            </div>
          `,
          iconSize: [32, 32],
          iconAnchor: [16, 28]
        });

        const newMarker = L.marker([selectedPoint.latitude, selectedPoint.longitude], {
          icon: pinIcon,
          draggable: true
        }).addTo(map);

        newMarker.on('dragend', (ev) => {
          const pos = ev.target.getLatLng();
          const info = identifyLocationFromCoordinates(pos.lat, pos.lng);
          setSelectedPoint({
            latitude: parseFloat(pos.lat.toFixed(5)),
            longitude: parseFloat(pos.lng.toFixed(5)),
            ...info
          });
        });

        pinMarkerRef.current = newMarker;
      } else {
        pinMarkerRef.current.setLatLng([selectedPoint.latitude, selectedPoint.longitude]);
      }
    } else {
      if (pinMarkerRef.current) {
        map.removeLayer(pinMarkerRef.current);
        pinMarkerRef.current = null;
      }
    }
  }, [selectedPoint]);

  // Center on Airport Reference Point
  const handleResetView = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([DEFAULT_AIRPORT_ARP.latitude, DEFAULT_AIRPORT_ARP.longitude], 14, {
        animate: true
      });
    }
  };

  // User live GPS pinpoint
  const handleGetLiveGPS = () => {
    if (!navigator.geolocation) {
      alert('Browser Anda tidak mendukung deteksi GPS.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = parseFloat(pos.coords.latitude.toFixed(5));
        const lon = parseFloat(pos.coords.longitude.toFixed(5));
        const info = identifyLocationFromCoordinates(lat, lon);
        setSelectedPoint({
          latitude: lat,
          longitude: lon,
          ...info
        });
        if (mapInstanceRef.current) {
          mapInstanceRef.current.setView([lat, lon], 16, { animate: true });
        }
      },
      (err) => {
        alert(`Gagal mengambil sinyal GPS: ${err.message}`);
      }
    );
  };

  // Jump to specific runway (fit complete polyline bounds)
  const handleJumpToRunway = (rwyId: string) => {
    const rwy = CGK_RUNWAYS.find(r => r.id === rwyId);
    if (rwy && mapInstanceRef.current) {
      mapInstanceRef.current.fitBounds(rwy.coordinates, { padding: [60, 60], maxZoom: 16 });
    }
  };

  // Jump to specific runway threshold endpoint at high zoom level for OSM visual comparison
  const handleJumpToThreshold = (lat: number, lon: number) => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([lat, lon], 17, { animate: true });
    }
  };

  return (
    <div className={`space-y-4 ${isFullscreen ? 'fixed inset-0 z-50 bg-slate-900 p-4 overflow-y-auto' : ''}`}>
      {/* Header Bar */}
      <div className="bg-slate-900 text-white rounded-2xl p-4 sm:p-5 border border-slate-800 shadow-xl flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-sky-500/20 text-sky-300 border border-sky-500/30 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" />
              SISTEM PEMETAAN GEOGRAFIS AIRSIDE
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              ICAO GIS Hotspot WHMS
            </span>
          </div>
          <h2 className="text-lg sm:text-2xl font-bold tracking-tight text-white mt-1">
            Peta Hotspot Wildlife Hazard &amp; Titik Koordinat Sisi Udara
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Integrasi pemetaan interaktif WIII / CGK untuk menandai runway, taxiway, sebaran serangan satwa (strike), dan pemantauan hotspot risiko tinggi.
          </p>
        </div>

        {/* Quick controls on header */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Tile Toggle: OSM vs Satellite */}
          <div className="bg-slate-800 p-1 rounded-xl border border-slate-700 flex items-center text-xs">
            <button
              onClick={() => setMapTileMode('osm')}
              className={`px-2.5 py-1.5 rounded-lg font-semibold transition cursor-pointer ${
                mapTileMode === 'osm' 
                  ? 'bg-sky-600 text-white shadow' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              🗺️ Peta Vektor
            </button>
            <button
              onClick={() => setMapTileMode('satellite')}
              className={`px-2.5 py-1.5 rounded-lg font-semibold transition cursor-pointer ${
                mapTileMode === 'satellite' 
                  ? 'bg-sky-600 text-white shadow' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              🛰️ Citra Satelit Airfield
            </button>
          </div>

          {/* Reset Center */}
          <button
            onClick={handleResetView}
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl border border-slate-700 text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer shadow-sm"
            title="Reset pandangan ke ARP Pusat Bandara"
          >
            <Navigation className="w-3.5 h-3.5 text-sky-400" />
            <span>Pusat ARP</span>
          </button>

          {/* GPS Live Pinpoint */}
          <button
            onClick={handleGetLiveGPS}
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl border border-slate-700 text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer shadow-sm"
            title="Deteksi posisi GPS perangkat saat ini di lapangan"
          >
            <Crosshair className="w-3.5 h-3.5 text-emerald-400" />
            <span>GPS Saya</span>
          </button>

          {/* Fullscreen toggle */}
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700 text-xs transition cursor-pointer"
            title={isFullscreen ? 'Keluar layar penuh' : 'Layar penuh'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Filter & Interactive Toolbar */}
      <div className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-sm space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Type Filter Tabs (Wildlife Strike & Occurrence) */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <span className="text-slate-500 font-semibold mr-1 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" /> Filter:
            </span>
            <button
              onClick={() => setSelectedType('ALL')}
              className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                selectedType === 'ALL'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Semua Insiden ({strikes.length + occurrences.length})
            </button>
            <button
              onClick={() => setSelectedType('STRIKE')}
              className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 cursor-pointer ${
                selectedType === 'STRIKE'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'bg-rose-50 text-rose-800 hover:bg-rose-100 border border-rose-200'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-rose-500"></span>
              Wildlife Strike ({strikes.length})
            </button>
            <button
              onClick={() => setSelectedType('OCCURRENCE')}
              className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 cursor-pointer ${
                selectedType === 'OCCURRENCE'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
              Occurrence ({occurrences.length})
            </button>
          </div>

          {/* Pinpoint Mode Trigger */}
          <button
            onClick={() => {
              setIsPinpointMode(!isPinpointMode);
              if (!selectedPoint) {
                // Seed with initial ARP point
                setSelectedPoint({
                  latitude: DEFAULT_AIRPORT_ARP.latitude,
                  longitude: DEFAULT_AIRPORT_ARP.longitude,
                  nearestZone: 'Titik Pusat Bandara (ARP WIII)',
                  estimatedGrid: 'Grid C8',
                  distanceFromArpKm: 0,
                  bearingDegree: 0,
                  cardinalDirection: 'N',
                  isWithinAirsidePerimeter: true
                });
              }
            }}
            className={`px-3.5 py-1.5 rounded-xl font-bold text-xs transition flex items-center gap-2 cursor-pointer shadow-sm ${
              isPinpointMode
                ? 'bg-emerald-600 text-white ring-2 ring-emerald-500/50'
                : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-300'
            }`}
          >
            <Crosshair className="w-4 h-4" />
            <span>{isPinpointMode ? 'Mode Tandai Titik Aktif (Klik Peta)' : '📍 Tandai Titik / Area Insiden'}</span>
          </button>
        </div>

        {/* Secondary Filter Row */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2.5 border-t border-slate-100 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            {/* Area Dropdown */}
            <select
              value={selectedArea}
              onChange={e => setSelectedArea(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg border border-slate-300 bg-slate-50 text-slate-700 font-semibold focus:ring-1 focus:ring-sky-500"
            >
              <option value="ALL">Semua Runway &amp; Taxiway</option>
              <option value="RWY_07L_25R">Runway 07L / 25R (Utara)</option>
              <option value="RWY_07R_25L">Runway 07R / 25L (Selatan)</option>
              <option value="RWY_06_24">Runway 06 / 24 (Runway 3)</option>
              <option value="TAXIWAY">Taxiway November / Papa</option>
              <option value="APRON">Apron &amp; Terminals</option>
            </select>

            {/* Time Filter */}
            <select
              value={timeFilter}
              onChange={e => setTimeFilter(e.target.value as any)}
              className="px-2.5 py-1.5 rounded-lg border border-slate-300 bg-slate-50 text-slate-700 font-semibold focus:ring-1 focus:ring-sky-500"
            >
              <option value="ALL">Rentang: Semua Waktu</option>
              <option value="24H">24 Jam Terakhir</option>
              <option value="7D">7 Hari Terakhir</option>
              <option value="30D">30 Hari Terakhir</option>
            </select>

            {/* Runway quick jumps */}
            <div className="hidden sm:flex items-center gap-1 text-[11px] text-slate-500">
              <span>Lompat ke:</span>
              <button
                onClick={() => handleJumpToRunway('rwy-07l-25r')}
                className="px-2 py-0.5 rounded bg-slate-100 hover:bg-sky-50 text-sky-800 font-mono font-bold border border-slate-200 cursor-pointer"
              >
                RWY 07L/25R
              </button>
              <button
                onClick={() => handleJumpToRunway('rwy-07r-25l')}
                className="px-2 py-0.5 rounded bg-slate-100 hover:bg-emerald-50 text-emerald-800 font-mono font-bold border border-slate-200 cursor-pointer"
              >
                RWY 07R/25L
              </button>
              <button
                onClick={() => handleJumpToRunway('rwy-06-24')}
                className="px-2 py-0.5 rounded bg-slate-100 hover:bg-indigo-50 text-indigo-800 font-mono font-bold border border-slate-200 cursor-pointer"
              >
                RWY 06/24 (R3)
              </button>
            </div>
          </div>

          {/* Layer toggles & search */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Cari satwa, nomor laporan..."
                className="pl-8 pr-3 py-1 rounded-lg border border-slate-300 text-xs w-48 focus:ring-1 focus:ring-sky-500"
              />
            </div>

            {/* Heat Halos Toggle */}
            <label className="flex items-center gap-1.5 cursor-pointer text-slate-700 font-medium">
              <input
                type="checkbox"
                checked={showHeatHalos}
                onChange={e => setShowHeatHalos(e.target.checked)}
                className="rounded text-rose-600 focus:ring-rose-500 cursor-pointer"
              />
              <span>Heat Hotspot</span>
            </label>

            {/* Operational Radius Toggle */}
            <label className="flex items-center gap-1.5 cursor-pointer text-slate-700 font-medium">
              <input
                type="checkbox"
                checked={showRadiusRings}
                onChange={e => setShowRadiusRings(e.target.checked)}
                className="rounded text-sky-600 focus:ring-sky-500 cursor-pointer"
              />
              <span>Radius ICAO</span>
            </label>

            {/* Quick Focus Radius Presets: 3km, 5km, 13km */}
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
              <span className="text-[10px] text-slate-400 font-bold px-1.5 hidden sm:inline">Fokus:</span>
              <button
                onClick={handleFocus3km}
                className="px-2 py-0.5 rounded text-[11px] font-bold bg-red-50 hover:bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300 border border-red-200 dark:border-red-800 transition cursor-pointer"
                title="Fokuskan peta ke Radius 3 km (Merah - Zona Bahaya Kritis Landas Pacu)"
              >
                3 km
              </button>
              <button
                onClick={handleFocus5km}
                className="px-2 py-0.5 rounded text-[11px] font-bold bg-yellow-50 hover:bg-yellow-100 text-yellow-800 dark:bg-yellow-950/50 dark:text-yellow-300 border border-yellow-200 dark:border-yellow-800 transition cursor-pointer"
                title="Fokuskan peta ke Radius 5 km (Kuning - Perimeter Airside & Fasilitas Bandara)"
              >
                5 km
              </button>
              <button
                onClick={handleFocus13km}
                className="px-2 py-0.5 rounded text-[11px] font-bold bg-orange-50 hover:bg-orange-100 text-orange-800 dark:bg-orange-950/50 dark:text-orange-300 border border-orange-200 dark:border-orange-800 transition cursor-pointer"
                title="Fokuskan peta ke Radius 13 km (Orange - Evaluasi Atraktan ICAO Doc 9137)"
              >
                13 km
              </button>
            </div>

            {/* Toggle Legenda Peta (Floating & Bebas Digeser) */}
            <button
              onClick={() => {
                setIsLegendOpen(prev => !prev);
                setIsLegendCollapsed(false);
              }}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold border flex items-center gap-1.5 transition cursor-pointer shadow-xs ${
                isLegendOpen
                  ? 'bg-slate-800 text-amber-300 border-amber-500/50'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:bg-slate-50'
              }`}
              title="Tampilkan atau sembunyikan legenda peta agar tidak menghalangi tampilan area landas pacu"
            >
              <Flame className="w-3.5 h-3.5 text-rose-500" />
              <span>Legenda {isLegendOpen ? 'Aktif' : 'Tutup'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Map Visual Canvas */}
      <div className="relative rounded-2xl overflow-hidden border border-slate-300 shadow-md bg-slate-900">
        {/* Leaflet DOM container */}
        <div 
          ref={mapContainerRef} 
          className="w-full h-[540px] sm:h-[600px] z-10"
        />

        {/* Floating, Draggable, & Collapsible Legend Overlay (Tidak Fix Agar Tidak Mengganggu Peta) */}
        {isLegendOpen && (
          <div
            ref={legendRef}
            style={
              legendPosition
                ? { left: `${legendPosition.x}px`, top: `${legendPosition.y}px` }
                : undefined
            }
            className={`absolute z-20 select-none pointer-events-auto transition-all ${
              !legendPosition
                ? legendCorner === 'bottom-left'
                  ? 'bottom-6 left-4'
                  : legendCorner === 'bottom-right'
                  ? 'bottom-6 right-4'
                  : legendCorner === 'top-right'
                  ? 'top-16 right-4'
                  : 'top-16 left-4'
                : ''
            }`}
          >
            {isLegendCollapsed ? (
              /* Minimized Floating Pill: Sangat Ringkas & Tidak Mengganggu Peta */
              <button
                onClick={() => setIsLegendCollapsed(false)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/95 hover:bg-slate-800 text-white shadow-2xl border border-slate-700/80 backdrop-blur-md text-xs font-semibold cursor-pointer transition hover:scale-105 active:scale-95"
                title="Buka Legenda Peta Lengkap (Dapat digeser bebas di atas peta)"
              >
                <Flame className="w-3.5 h-3.5 text-rose-500 animate-pulse" />
                <span>Legenda Hotspot &amp; Radius</span>
                <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
              </button>
            ) : (
              /* Expanded Card yang Bebas Digeser ke Mana Saja */
              <div
                className={`bg-slate-900/95 text-white rounded-2xl border border-slate-700/80 shadow-2xl backdrop-blur-md text-[11px] w-64 overflow-hidden transition-all duration-150 ${
                  isDraggingLegend ? 'opacity-85 ring-2 ring-sky-500 scale-[1.01]' : ''
                }`}
              >
                {/* Draggable Grip Header */}
                <div
                  onMouseDown={handleLegendMouseDown}
                  onTouchStart={handleLegendTouchStart}
                  className="px-3 py-2 bg-slate-800/80 border-b border-slate-700/80 flex items-center justify-between cursor-grab active:cursor-grabbing text-slate-200"
                  title="Tahan dan geser untuk memindahkan posisi legenda ke mana saja di atas peta"
                >
                  <div className="flex items-center gap-1.5 font-bold text-xs text-slate-100">
                    <GripHorizontal className="w-3.5 h-3.5 text-slate-400" />
                    <Flame className="w-3.5 h-3.5 text-rose-500" />
                    <span>Legenda Hotspot Airside</span>
                  </div>

                  <div className="flex items-center gap-1 text-slate-400">
                    {/* Snap corner button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setLegendPosition(null);
                        setLegendCorner(prev => 
                          prev === 'bottom-left' ? 'bottom-right' :
                          prev === 'bottom-right' ? 'top-right' :
                          prev === 'top-right' ? 'top-left' : 'bottom-left'
                        );
                      }}
                      className="p-1 hover:text-white rounded hover:bg-slate-700/60 cursor-pointer"
                      title="Pindahkan sudut legenda (Bawah-Kiri / Bawah-Kanan / Atas-Kanan / Atas-Kiri)"
                    >
                      <RotateCcw className="w-3 h-3" />
                    </button>

                    {/* Minimize button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsLegendCollapsed(true);
                      }}
                      className="p-1 hover:text-white rounded hover:bg-slate-700/60 cursor-pointer"
                      title="Minimalkan legenda agar bidang peta lebih lapang"
                    >
                      <ChevronDown className="w-3.5 h-3.5" />
                    </button>

                    {/* Close button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsLegendOpen(false);
                      }}
                      className="p-1 hover:text-rose-400 rounded hover:bg-slate-700/60 cursor-pointer"
                      title="Sembunyikan legenda (Dapat diaktifkan kembali lewat toolbar)"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Legend Items Body */}
                <div className="p-3 space-y-2 max-h-[340px] overflow-y-auto">
                  {/* Incident markers (Hanya Wildlife Strike & Occurrence) */}
                  <div className="space-y-1.5">
                    <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                      Titik Kejadian Satwa
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-rose-600 border border-white shrink-0 shadow-sm"></span>
                      <span>Wildlife Strike (Risiko Tinggi)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-amber-500 border border-white shrink-0 shadow-sm"></span>
                      <span>Occurrence (Peringatan Bahaya)</span>
                    </div>
                  </div>

                  {/* Radius Zones with Hatched Patterns (3km Merah, 5km Kuning, 13km Orange) */}
                  <div className="pt-2 border-t border-slate-800 space-y-2">
                    <div className="text-[10px] font-semibold text-amber-400 uppercase tracking-wider flex items-center justify-between">
                      <span>Zonasi &amp; Radius Arsir</span>
                      <span className="text-[9px] text-slate-400 font-normal">ICAO Doc 9137</span>
                    </div>

                    {/* Radius 3 km Merah */}
                    <div className="flex items-start gap-2 bg-red-950/40 p-1.5 rounded-lg border border-red-500/40">
                      <span className="w-4 h-4 rounded mini-hatch-swatch-red border border-red-400 shrink-0 mt-0.5 shadow-sm"></span>
                      <div>
                        <div className="font-bold text-red-300">Arsir Radius 3.0 km (Merah)</div>
                        <div className="text-[9.5px] text-slate-300 leading-tight">
                          Zona Bahaya Kritis Landas Pacu &amp; Infield Inti
                        </div>
                      </div>
                    </div>

                    {/* Radius 5 km Kuning */}
                    <div className="flex items-start gap-2 bg-yellow-950/40 p-1.5 rounded-lg border border-yellow-500/40">
                      <span className="w-4 h-4 rounded mini-hatch-swatch-yellow border border-yellow-400 shrink-0 mt-0.5 shadow-sm"></span>
                      <div>
                        <div className="font-bold text-yellow-300">Arsir Radius 5.0 km (Kuning)</div>
                        <div className="text-[9.5px] text-slate-300 leading-tight">
                          Perimeter Airside &amp; Fasilitas Daerah Kerja Bandara
                        </div>
                      </div>
                    </div>

                    {/* Radius 13 km Orange */}
                    <div className="flex items-start gap-2 bg-orange-950/40 p-1.5 rounded-lg border border-orange-500/40">
                      <span className="w-4 h-4 rounded mini-hatch-swatch-orange border border-orange-400 shrink-0 mt-0.5 shadow-sm"></span>
                      <div>
                        <div className="font-bold text-orange-300">Arsir Radius 13.0 km (Orange)</div>
                        <div className="text-[9.5px] text-slate-300 leading-tight">
                          Zona Pemantauan ICAO 7 NM &amp; Evaluasi Atraktan
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Runways & ARP */}
                  <div className="pt-2 border-t border-slate-800 space-y-1.5 text-slate-300">
                    <div className="flex items-center gap-2">
                      <span className="w-4 h-1.5 bg-sky-400 rounded-full shrink-0"></span>
                      <span>Garis Strip Runway 60m</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-indigo-500 border border-indigo-200 shrink-0"></span>
                      <span>ARP WIII Soekarno-Hatta</span>
                    </div>
                  </div>
                </div>

                {/* Footer Controls */}
                <div className="px-3 py-2 bg-slate-800/60 border-t border-slate-700/60 flex items-center justify-between text-[10px]">
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-400">Fokus:</span>
                    <button
                      onClick={handleFocus3km}
                      className="text-red-400 hover:text-red-300 font-bold cursor-pointer"
                      title="Fokus Radius 3 km (Merah)"
                    >
                      3km
                    </button>
                    <span className="text-slate-600">•</span>
                    <button
                      onClick={handleFocus5km}
                      className="text-yellow-400 hover:text-yellow-300 font-bold cursor-pointer"
                      title="Fokus Radius 5 km (Kuning)"
                    >
                      5km
                    </button>
                    <span className="text-slate-600">•</span>
                    <button
                      onClick={handleFocus13km}
                      className="text-orange-400 hover:text-orange-300 font-bold cursor-pointer"
                      title="Fokus Radius 13 km (Orange)"
                    >
                      13km
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[9.5px] text-slate-500">Tahan &amp; geser header</span>
                    {legendPosition && (
                      <button
                        onClick={() => setLegendPosition(null)}
                        className="text-slate-400 hover:text-slate-200 flex items-center gap-1 cursor-pointer"
                        title="Kembalikan legenda ke sudut peta standar"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Reset</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Floating Active Inspector Card when Point is Marked */}
        {selectedPoint && (
          <div className="absolute top-4 right-4 z-20 bg-white/95 backdrop-blur-md rounded-2xl p-4 border border-slate-200 shadow-2xl max-w-sm w-full animate-in fade-in slide-in-from-top-3 text-xs">
            <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-2.5">
              <div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  📍 Titik Koordinat Terpilih
                </span>
                <h4 className="font-bold text-slate-900 text-sm mt-1">
                  {selectedPoint.nearestZone}
                </h4>
              </div>
              <button
                onClick={() => setSelectedPoint(null)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 cursor-pointer"
                title="Tutup panel"
              >
                ✕
              </button>
            </div>

            {/* Spatial Details */}
            <div className="grid grid-cols-2 gap-2 my-2.5 text-slate-700">
              <div className="bg-slate-50 p-2 rounded-lg border border-slate-100 font-mono">
                <span className="text-[10px] text-slate-400 block">Latitude (Lintang):</span>
                <span className="font-bold text-slate-900">{selectedPoint.latitude}°</span>
              </div>
              <div className="bg-slate-50 p-2 rounded-lg border border-slate-100 font-mono">
                <span className="text-[10px] text-slate-400 block">Longitude (Bujur):</span>
                <span className="font-bold text-slate-900">{selectedPoint.longitude}°</span>
              </div>
              <div className="bg-amber-50 p-2 rounded-lg border border-amber-100 font-mono">
                <span className="text-[10px] text-amber-700 block">Grid Map CGK:</span>
                <span className="font-bold text-amber-900">{selectedPoint.estimatedGrid}</span>
              </div>
              <div className="bg-sky-50 p-2 rounded-lg border border-sky-100">
                <span className="text-[10px] text-sky-700 block">Jarak dari ARP:</span>
                <span className="font-bold text-sky-900">
                  {selectedPoint.distanceFromArpKm} km ({selectedPoint.cardinalDirection})
                </span>
              </div>
            </div>

            <p className="text-[11px] text-slate-500 mb-3">
              Geser penanda di peta atau klik lokasi lain untuk memperbarui koordinat secara presisi.
            </p>

            {/* Quick Action Buttons */}
            <div className="space-y-1.5">
              {onCreateReportWithLocation && (
                <>
                  <button
                    onClick={() => {
                      onCreateReportWithLocation('occurrence', {
                        latitude: selectedPoint.latitude,
                        longitude: selectedPoint.longitude,
                        gridLocation: selectedPoint.estimatedGrid,
                        runwayTaxiway: selectedPoint.nearestZone,
                        lokasi: selectedPoint.nearestZone
                      });
                    }}
                    className="w-full py-2 px-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs transition flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                    title="WHR — Wildlife Hazard Report: identifikasi bahaya, evaluasi risiko, dan mitigasi"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Catat WHR — Wildlife Hazard Report di Titik Ini</span>
                  </button>

                  <button
                    onClick={() => {
                      onCreateReportWithLocation('strike', {
                        latitude: selectedPoint.latitude,
                        longitude: selectedPoint.longitude,
                        gridLocation: selectedPoint.estimatedGrid,
                        runwayTaxiway: selectedPoint.nearestZone,
                        lokasi: selectedPoint.nearestZone
                      });
                    }}
                    className="w-full py-2 px-3 rounded-xl bg-rose-700 hover:bg-rose-600 text-white font-semibold text-xs transition flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                    title="WSR — Wildlife Strike Report: pencatatan dugaan atau kejadian wildlife strike, bukti, dampak, dan status verifikasi"
                  >
                    <Plane className="w-3.5 h-3.5" />
                    <span>Catat WSR — Wildlife Strike Report di Titik Ini</span>
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Hotspot Analytic Cards & Priority Zones */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Metric 1 */}
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 shrink-0">
            <Flame className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-rose-700">
              Hotspot Strike Aktif
            </span>
            <div className="text-xl font-bold text-slate-900 mt-0.5">
              {strikes.length} Insiden Terpetakan
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {strikes.filter(s => s.indikasiKerusakan === 'Ada').length} insiden dengan kerusakan pesawat
            </p>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 shrink-0">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700">
              Occurrence &amp; Gangguan
            </span>
            <div className="text-xl font-bold text-slate-900 mt-0.5">
              {occurrences.length} Titik Kejadian
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Meliputi pergerakan satwa di runway &amp; taxiway
            </p>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-600 shrink-0">
            <Compass className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-sky-700">
              Zona Risiko Tertinggi
            </span>
            <div className="text-sm font-bold text-slate-900 mt-0.5 truncate">
              {hotspotAnalysis[0]?.name || 'Runway 07L / 25R'}
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Berdasarkan akumulasi bobot risiko strike &amp; frekuensi
            </p>
          </div>
        </div>
      </div>

      {/* Runway WGS84 Calibration & Visual Overlay Verification Panel */}
      <div className="bg-slate-900 text-white rounded-2xl p-5 border border-slate-800 shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800 pb-4 mb-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                AIP WIII AD 2.12 (AIRAC AMDT 151)
              </span>
              <span className="text-xs text-slate-400">Berlaku 03 Okt 2024 • WGS84 Geo-Referenced</span>
            </div>
            <h3 className="text-base sm:text-lg font-bold text-white mt-1 flex items-center gap-2">
              <Plane className="w-5 h-5 text-sky-400" />
              Kalibrasi Polyline Threshold Runway (RWY 06/24, RWY 07L/25R, RWY 07R/25L)
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Setiap garis runway dihitung mandiri dari threshold fisik ke threshold asli (bukan interpolasi offset paralel). Polyline geo-referenced Leaflet [lat, lng] berimpit tepat di tengah bentuk fisik aspal abu-abu runway pada tile basemap OSM.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[11px] text-slate-400">Mode Base Map:</span>
            <button
              onClick={() => setMapTileMode('osm')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                mapTileMode === 'osm' 
                  ? 'bg-sky-600 text-white shadow-sm' 
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              OSM Base Tile
            </button>
            <button
              onClick={() => setMapTileMode('satellite')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                mapTileMode === 'satellite' 
                  ? 'bg-sky-600 text-white shadow-sm' 
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              Satelit Esri
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {CGK_RUNWAYS.map(rwy => {
            const startC = rwy.thresholds?.startCoord || rwy.coordinates[0];
            const endC = rwy.thresholds?.endCoord || rwy.coordinates[1];
            const startCode = rwy.thresholds?.startCode || 'Start';
            const endCode = rwy.thresholds?.endCode || 'End';

            return (
              <div 
                key={rwy.id} 
                className="bg-slate-800/80 rounded-xl p-4 border border-slate-700/80 flex flex-col justify-between hover:border-slate-600 transition-colors"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="font-bold text-white text-sm flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: rwy.color }}></span>
                      {rwy.name.split(' (')[0]}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-900 text-slate-300 border border-slate-700">
                        {rwy.headingText || '068° / 248°'}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-900 text-sky-400 border border-slate-700">
                        {rwy.lengthMeters ? `${rwy.lengthMeters.toLocaleString()}m` : '3,600m'}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2 text-xs mb-4">
                    <div className="bg-slate-900/90 rounded-lg p-2.5 border border-slate-700/60">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-slate-400 font-medium">Threshold {startCode}:</span>
                        <button
                          onClick={() => handleJumpToThreshold(startC[0], startC[1])}
                          className="text-[10px] text-emerald-400 hover:text-emerald-300 underline font-semibold cursor-pointer"
                        >
                          Zoom Titik (17x)
                        </button>
                      </div>
                      <div className="font-mono text-[11px] text-emerald-300 bg-emerald-950/40 px-2 py-1 rounded border border-emerald-800/50">
                        lat: {startC[0].toFixed(6)}, lon: {startC[1].toFixed(6)}
                      </div>
                    </div>

                    <div className="bg-slate-900/90 rounded-lg p-2.5 border border-slate-700/60">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-slate-400 font-medium">Threshold {endCode}:</span>
                        <button
                          onClick={() => handleJumpToThreshold(endC[0], endC[1])}
                          className="text-[10px] text-sky-400 hover:text-sky-300 underline font-semibold cursor-pointer"
                        >
                          Zoom Titik (17x)
                        </button>
                      </div>
                      <div className="font-mono text-[11px] text-sky-300 bg-sky-900/40 px-2 py-1 rounded border border-sky-800/50">
                        lat: {endC[0].toFixed(6)}, lon: {endC[1].toFixed(6)}
                      </div>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleJumpToRunway(rwy.id)}
                  className="w-full py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow"
                >
                  <Crosshair className="w-3.5 h-3.5" />
                  <span>Inspeksi Keseluruhan {rwy.id.replace('rwy-', 'RWY ').toUpperCase()}</span>
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Hotspot Ranking Summary Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden text-xs">
        <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-rose-600" />
            <span className="font-bold text-slate-900">
              Peringkat Akumulasi Hotspot Wildlife Hazard per Area Sisi Udara
            </span>
          </div>
          <span className="text-[11px] text-slate-500 font-mono">
            {filteredIncidents.length} Data Teranalisis
          </span>
        </div>

        <div className="divide-y divide-slate-100">
          {hotspotAnalysis.map((area, idx) => (
            <div key={area.name} className="p-3 hover:bg-slate-50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <div className="flex items-center gap-3">
                <span className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${
                  idx === 0 
                    ? 'bg-rose-600 text-white' 
                    : idx === 1 
                    ? 'bg-amber-500 text-white' 
                    : 'bg-slate-200 text-slate-700'
                }`}>
                  {idx + 1}
                </span>
                <div>
                  <div className="font-bold text-slate-900 text-sm">{area.name}</div>
                  <div className="text-slate-500 text-[11px]">
                    {area.strikes} Strike • {area.occurrences} Occurrence
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
                <span className={`px-2.5 py-1 rounded-full font-bold text-[11px] ${
                  area.strikes > 0 
                    ? 'bg-rose-100 text-rose-800 border border-rose-300' 
                    : area.occurrences > 0 
                    ? 'bg-amber-100 text-amber-800 border border-amber-300' 
                    : 'bg-slate-100 text-slate-700'
                }`}>
                  Skor Hazard: {area.totalHazard}
                </span>

                <button
                  onClick={() => {
                    if (area.name.includes('07L')) handleJumpToRunway('rwy-07l-25r');
                    else if (area.name.includes('07R')) handleJumpToRunway('rwy-07r-25l');
                    else if (area.name.includes('06')) handleJumpToRunway('rwy-06-24');
                    else handleResetView();
                  }}
                  className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-300 rounded font-semibold text-slate-700 transition cursor-pointer"
                >
                  Fokus Peta →
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
