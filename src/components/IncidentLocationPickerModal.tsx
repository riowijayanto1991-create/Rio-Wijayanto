import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import { 
  MapPin, 
  Crosshair, 
  Check, 
  X, 
  Navigation, 
  Compass, 
  Layers, 
  AlertTriangle 
} from 'lucide-react';
import { DEFAULT_AIRPORT_ARP } from '../utils/geoUtils';
import { 
  CGK_RUNWAYS, 
  CGK_AIRSIDE_ZONES, 
  identifyLocationFromCoordinates 
} from '../utils/airsideGeoData';

interface IncidentLocationPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialLatitude?: number;
  initialLongitude?: number;
  onSelectLocation: (data: {
    latitude: number;
    longitude: number;
    gridLocation: string;
    runwayTaxiway: string;
    lokasi: string;
    distanceFromArpKm: number;
  }) => void;
}

export const IncidentLocationPickerModal: React.FC<IncidentLocationPickerModalProps> = ({
  isOpen,
  onClose,
  initialLatitude,
  initialLongitude,
  onSelectLocation
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const pinMarkerRef = useRef<L.Marker | null>(null);

  const startLat = initialLatitude || DEFAULT_AIRPORT_ARP.latitude;
  const startLon = initialLongitude || DEFAULT_AIRPORT_ARP.longitude;

  const [currentCoord, setCurrentCoord] = useState<{
    latitude: number;
    longitude: number;
    nearestZone: string;
    estimatedGrid: string;
    distanceFromArpKm: number;
    cardinalDirection: string;
  }>(() => {
    const info = identifyLocationFromCoordinates(startLat, startLon);
    return {
      latitude: startLat,
      longitude: startLon,
      ...info
    };
  });

  const [tileMode, setTileMode] = useState<'osm' | 'satellite'>('osm');

  useEffect(() => {
    if (!isOpen) return;

    const timeout = setTimeout(() => {
      if (!mapContainerRef.current) return;

      if (!mapInstanceRef.current) {
        const map = L.map(mapContainerRef.current, {
          center: [startLat, startLon],
          zoom: 15,
          minZoom: 12,
          maxZoom: 18,
          zoomControl: true
        });

        mapInstanceRef.current = map;

        // Base Tile Layer
        const tileUrl = tileMode === 'satellite'
          ? 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
          : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

        L.tileLayer(tileUrl, { maxZoom: 18 }).addTo(map);

        // Draw runway lines with geo-referenced casing and threshold badges
        CGK_RUNWAYS.forEach(rwy => {
          // Pavement casing (translucent to superimpose cleanly on OSM grey runway)
          L.polyline(rwy.coordinates, {
            color: '#1e293b',
            weight: 10,
            opacity: 0.35,
            lineCap: 'square'
          }).addTo(map);

          // Centerline
          L.polyline(rwy.coordinates, {
            color: rwy.color,
            weight: 3.5,
            opacity: 0.95
          }).addTo(map);

          // Threshold badges
          if (rwy.thresholds) {
            const startIcon = L.divIcon({
              className: 'picker-thresh-badge',
              html: `<span class="px-1 py-0.5 rounded bg-slate-900 text-white text-[8px] font-mono font-bold shadow border border-slate-600">${rwy.thresholds.startCode}</span>`,
              iconSize: [24, 14],
              iconAnchor: [12, 7]
            });
            L.marker(rwy.thresholds.startCoord, { icon: startIcon, interactive: false }).addTo(map);

            const endIcon = L.divIcon({
              className: 'picker-thresh-badge',
              html: `<span class="px-1 py-0.5 rounded bg-slate-900 text-white text-[8px] font-mono font-bold shadow border border-slate-600">${rwy.thresholds.endCode}</span>`,
              iconSize: [24, 14],
              iconAnchor: [12, 7]
            });
            L.marker(rwy.thresholds.endCoord, { icon: endIcon, interactive: false }).addTo(map);
          }
        });

        // Draggable pin marker
        const pinIcon = L.divIcon({
          className: 'custom-picker-pin',
          html: `
            <div class="relative flex items-center justify-center cursor-move">
              <span class="absolute w-8 h-8 rounded-full bg-rose-500/40 animate-ping"></span>
              <div class="w-8 h-8 rounded-full bg-rose-600 border-2 border-white shadow-xl flex items-center justify-center text-white font-bold ring-2 ring-rose-400">
                📍
              </div>
            </div>
          `,
          iconSize: [32, 32],
          iconAnchor: [16, 28]
        });

        const marker = L.marker([startLat, startLon], {
          icon: pinIcon,
          draggable: true
        }).addTo(map);

        marker.on('dragend', (ev) => {
          const pos = ev.target.getLatLng();
          const info = identifyLocationFromCoordinates(pos.lat, pos.lng);
          setCurrentCoord({
            latitude: parseFloat(pos.lat.toFixed(5)),
            longitude: parseFloat(pos.lng.toFixed(5)),
            ...info
          });
        });

        pinMarkerRef.current = marker;

        // Click map to reposition
        map.on('click', (e: L.LeafletMouseEvent) => {
          const { lat, lng } = e.latlng;
          const info = identifyLocationFromCoordinates(lat, lng);
          const newCoords = {
            latitude: parseFloat(lat.toFixed(5)),
            longitude: parseFloat(lng.toFixed(5)),
            ...info
          };
          setCurrentCoord(newCoords);
          if (pinMarkerRef.current) {
            pinMarkerRef.current.setLatLng([lat, lng]);
          }
        });
      } else {
        mapInstanceRef.current.invalidateSize();
      }
    }, 150);

    return () => {
      clearTimeout(timeout);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [isOpen, startLat, startLon]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in">
      <div className="bg-white rounded-2xl max-w-3xl w-full overflow-hidden shadow-2xl border border-slate-200 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-rose-500/20 text-rose-400 border border-rose-500/30">
              <Crosshair className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base text-white">
                Tandai Titik &amp; Area Insiden Satwa di Peta
              </h3>
              <p className="text-[11px] text-slate-400">
                Klik atau seret pin pada peta untuk menentukan posisi runway/taxiway dan koordinat GPS.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Map Container */}
        <div className="relative flex-1 min-h-[380px] bg-slate-100">
          <div ref={mapContainerRef} className="w-full h-full min-h-[380px]" />

          {/* Quick selection overlay banner */}
          <div className="absolute top-3 left-3 z-20 bg-slate-900/85 backdrop-blur text-white px-3 py-1.5 rounded-xl border border-slate-700/80 shadow text-xs flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Klik lokasi pada peta bandara</span>
          </div>
        </div>

        {/* Selected Coordinates & Zone Bar */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 space-y-3">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <div className="bg-white p-2.5 rounded-xl border border-slate-200">
              <span className="text-[10px] text-slate-400 block font-medium">Estimasi Runway / Area</span>
              <span className="font-bold text-sky-900 truncate block mt-0.5" title={currentCoord.nearestZone}>
                {currentCoord.nearestZone}
              </span>
            </div>
            <div className="bg-white p-2.5 rounded-xl border border-slate-200">
              <span className="text-[10px] text-slate-400 block font-medium">Grid Map CGK</span>
              <span className="font-mono font-bold text-amber-900 block mt-0.5">
                {currentCoord.estimatedGrid}
              </span>
            </div>
            <div className="bg-white p-2.5 rounded-xl border border-slate-200">
              <span className="text-[10px] text-slate-400 block font-medium">Latitude (GPS)</span>
              <span className="font-mono font-bold text-slate-900 block mt-0.5">
                {currentCoord.latitude}°
              </span>
            </div>
            <div className="bg-white p-2.5 rounded-xl border border-slate-200">
              <span className="text-[10px] text-slate-400 block font-medium">Longitude (GPS)</span>
              <span className="font-mono font-bold text-slate-900 block mt-0.5">
                {currentCoord.longitude}°
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
            <span className="text-xs text-slate-500">
              Jarak dari ARP: <strong className="text-slate-800">{currentCoord.distanceFromArpKm} km</strong> ({currentCoord.cardinalDirection})
            </span>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  onSelectLocation({
                    latitude: currentCoord.latitude,
                    longitude: currentCoord.longitude,
                    gridLocation: currentCoord.estimatedGrid,
                    runwayTaxiway: currentCoord.nearestZone,
                    lokasi: currentCoord.nearestZone,
                    distanceFromArpKm: currentCoord.distanceFromArpKm
                  });
                  onClose();
                }}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Gunakan Titik &amp; Area Ini</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
