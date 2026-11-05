import { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { RoadSegment, FloodIncident, RoadStatus, VerificationStatus } from '../../types/api';
import { 
  Search, 
  Compass, 
  MapPin 
} from 'lucide-react';

interface MangaluruMapProps {
  roads: RoadSegment[];
  incidents: FloodIncident[];
  selectedIncidentId?: string | null;
  onSelectIncident?: (id: string) => void;
  heightClass?: string;
  enableManualLocationPick?: boolean;
  onLocationPicked?: (lat: number, lon: number, address?: string) => void;
  pickedLocation?: { lat: number; lon: number } | null;
}

export const MangaluruMap = ({
  roads,
  incidents,
  selectedIncidentId,
  onSelectIncident,
  heightClass = 'h-[540px]',
  enableManualLocationPick = false,
  onLocationPicked,
  pickedLocation
}: MangaluruMapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const roadLayerGroup = useRef<L.LayerGroup | null>(null);
  const incidentLayerGroup = useRef<L.LayerGroup | null>(null);
  const pickMarkerRef = useRef<L.Marker | null>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);

  const [showRoads, setShowRoads] = useState<boolean>(true);
  const [showIncidents, setShowIncidents] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedStatusFilter] = useState<RoadStatus | 'ALL'>('ALL');
  const [verificationFilter, setVerificationFilter] = useState<VerificationStatus | 'ALL'>('ALL');
  const [mapLoaded, setMapLoaded] = useState<boolean>(false);

  const keyLocations = [
    { name: 'Kottara Chowki (NH-66)', coords: [12.9050, 74.8445] as [number, number] },
    { name: 'Pumpwell Circle (Mahaveera)', coords: [12.8625, 74.8695] as [number, number] },
    { name: 'State Bank Service Bus Stand', coords: [12.8635, 74.8410] as [number, number] },
    { name: 'Kadri Hills / Park', coords: [12.8870, 74.8630] as [number, number] },
    { name: 'Baikampady Industrial Estate', coords: [12.9570, 74.8175] as [number, number] },
    { name: 'Car Street (Venkataramana Temple)', coords: [12.8725, 74.8455] as [number, number] },
    { name: 'KSRTC Bus Stand Bejai', coords: [12.8910, 74.8530] as [number, number] },
  ];

  const getStatusColor = (status: RoadStatus) => {
    switch (status) {
      case 'OPEN':
        return '#10b981';
      case 'CAUTION':
        return '#f59e0b';
      case 'BLOCKED':
        return '#f43f5e';
      case 'UNVERIFIED':
        return '#a855f7';
      default:
        return '#64748b';
    }
  };

  // 1. Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;

    // Mangaluru center: [12.9141, 74.8560] (Lat, Lon in Leaflet)
    const map = L.map(mapContainer.current, {
      center: [12.9141, 74.8560],
      zoom: 13,
      zoomControl: true,
      minZoom: 10,
      maxZoom: 18,
    });
    mapRef.current = map;

    // Free, high-reliability CartoDB Voyager tiles (OpenStreetMap-based, clean street labels, no API key required)
    const tileLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions" target="_blank">CARTO</a> | NEERPATH GIS',
      subdomains: 'abcd',
    });
    tileLayer.addTo(map);

    // Create persistent layer groups for toggling
    roadLayerGroup.current = L.layerGroup().addTo(map);
    incidentLayerGroup.current = L.layerGroup().addTo(map);

    tileLayer.on('load', () => {
      setMapLoaded(true);
    });
    setMapLoaded(true);

    // Manual location picker click listener
    map.on('click', (e: L.LeafletMouseEvent) => {
      if (enableManualLocationPick && onLocationPicked) {
        onLocationPicked(Number(e.latlng.lat.toFixed(6)), Number(e.latlng.lng.toFixed(6)));
      }
    });

    // Resize observer to handle tab or sidebar transitions smoothly
    if (window.ResizeObserver && mapContainer.current) {
      resizeObserverRef.current = new ResizeObserver(() => {
        map.invalidateSize();
      });
      resizeObserverRef.current.observe(mapContainer.current);
    }

    // Force size check after DOM mount
    setTimeout(() => {
      map.invalidateSize();
    }, 150);

    return () => {
      resizeObserverRef.current?.disconnect();
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // 2. Render Road Corridors
  const renderRoads = useCallback(() => {
    if (!mapRef.current || !roadLayerGroup.current) return;
    roadLayerGroup.current.clearLayers();

    if (!showRoads) return;

    const filteredRoads = roads.filter(
      r => selectedStatusFilter === 'ALL' || r.current_status === selectedStatusFilter
    );

    filteredRoads.forEach(road => {
      if (!road.geometry || !road.geometry.coordinates) return;

      // Leaflet expects [lat, lng] while GeoJSON uses [lng, lat]
      const latLngs: [number, number][] = (road.geometry.coordinates as [number, number][]).map(
        ([lng, lat]) => [lat, lng]
      );

      const color = getStatusColor(road.current_status);

      // Outer glow/casing
      const outerLine = L.polyline(latLngs, {
        color,
        weight: 8,
        opacity: 0.35,
        lineCap: 'round',
        lineJoin: 'round',
      });

      // Inner road stroke
      const innerLine = L.polyline(latLngs, {
        color,
        weight: 4.5,
        opacity: 0.95,
        lineCap: 'round',
        lineJoin: 'round',
      });

      const popupContent = `
        <div style="font-family: sans-serif; padding: 4px; color: #0f172a; min-width: 170px;">
          <div style="font-size: 11px; text-transform: uppercase; font-weight: bold; color: ${color};">
            ● ${road.current_status}
          </div>
          <div style="font-weight: 700; font-size: 13px; margin: 2px 0;">${road.name}</div>
          <div style="font-size: 11px; color: #475569;">${road.ward}</div>
          <div style="margin-top: 6px; font-size: 11px; border-top: 1px solid #e2e8f0; padding-top: 4px;">
            Water Depth: <strong>${road.current_water_depth_cm} cm</strong> | Elev: ${road.elevation_meters}m
          </div>
          <div style="font-size: 9px; color: #64748b; margin-top: 2px;">
            Source: ${road.last_source}
          </div>
        </div>
      `;

      innerLine.bindPopup(popupContent, { offset: [0, -6] });
      outerLine.bindPopup(popupContent, { offset: [0, -6] });

      roadLayerGroup.current?.addLayer(outerLine);
      roadLayerGroup.current?.addLayer(innerLine);
    });
  }, [roads, selectedStatusFilter, showRoads]);

  useEffect(() => {
    renderRoads();
  }, [renderRoads]);

  // 3. Render Incident Markers with custom DOM HTML icons
  const renderIncidents = useCallback(() => {
    if (!mapRef.current || !incidentLayerGroup.current) return;
    incidentLayerGroup.current.clearLayers();

    if (!showIncidents) return;

    const filtered = incidents.filter(
      i => verificationFilter === 'ALL' || i.verification_status === verificationFilter
    );

    filtered.forEach(inc => {
      const [lng, lat] = inc.geometry.coordinates;

      let badgeColor = '#d97706'; // Pending amber
      let symbol = '?';
      let titleLabel = 'Pending Citizen Report';

      if (inc.verification_status === 'VERIFIED') {
        badgeColor = '#e11d48'; // Rose red
        symbol = '!';
        titleLabel = 'Admin-Verified Flood Incident';
      } else if (inc.verification_status === 'RESOLVED') {
        badgeColor = '#059669'; // Emerald
        symbol = '✓';
        titleLabel = 'Resolved / Water Receded';
      } else if (inc.verification_status === 'REJECTED') {
        badgeColor = '#475569'; // Slate
        symbol = '✕';
        titleLabel = 'Rejected / False Alarm';
      }

      const customIcon = L.divIcon({
        className: 'neerpath-leaflet-marker',
        html: `
          <div style="
            position: relative;
            width: 28px;
            height: 28px;
            border-radius: 50%;
            background-color: ${badgeColor};
            color: #ffffff;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 900;
            font-size: 12px;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.3);
            border: 2px solid #ffffff;
            cursor: pointer;
            transition: transform 0.15s ease;
          ">
            <span>${symbol}</span>
            ${inc.verification_status === 'VERIFIED' ? `
              <span style="
                position: absolute;
                top: -2px;
                right: -2px;
                width: 8px;
                height: 8px;
                border-radius: 50%;
                background-color: #f43f5e;
                border: 1.5px solid #ffffff;
              "></span>
            ` : ''}
          </div>
        `,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
        popupAnchor: [0, -14],
      });

      const marker = L.marker([lat, lng], { icon: customIcon });

      const popupContent = `
        <div style="font-family: sans-serif; padding: 4px; color: #0f172a; max-width: 240px;">
          <div style="font-size: 10px; font-weight: bold; text-transform: uppercase; color: #475569;">
            ${titleLabel}
          </div>
          <div style="font-weight: 700; font-size: 13px; margin: 3px 0;">${inc.location_name}</div>
          <div style="font-size: 11px; color: #0369a1; font-weight: 600;">Category: ${inc.incident_category}</div>
          <p style="font-size: 11px; color: #475569; margin: 4px 0 6px;">${inc.description || 'No citizen description provided.'}</p>
          <div style="font-size: 10px; border-top: 1px solid #e2e8f0; padding-top: 4px;">
            <span>Depth: <strong>${inc.reported_water_depth}</strong></span> | 
            <span>2W: <strong>${inc.passable_two_wheelers ? 'Passable' : 'Blocked'}</strong></span>
          </div>
          <div style="font-size: 9px; color: #64748b; margin-top: 4px;">
            Provenance: ${inc.source} | ${new Date(inc.created_at).toLocaleTimeString()}
          </div>
        </div>
      `;

      marker.bindPopup(popupContent);

      marker.on('click', () => {
        if (onSelectIncident) onSelectIncident(inc.id);
      });

      incidentLayerGroup.current?.addLayer(marker);
    });
  }, [incidents, verificationFilter, showIncidents, onSelectIncident]);

  useEffect(() => {
    renderIncidents();
  }, [renderIncidents]);

  // 4. Update Picked Location Pin
  useEffect(() => {
    if (!mapRef.current) return;

    if (pickedLocation) {
      const icon = L.divIcon({
        className: 'neerpath-pick-pin',
        html: `
          <div style="
            width: 30px;
            height: 30px;
            border-radius: 50%;
            background-color: #06b6d4;
            color: #ffffff;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 16px;
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.4);
            border: 2px solid #ffffff;
          ">
            📍
          </div>
        `,
        iconSize: [30, 30],
        iconAnchor: [15, 15],
      });

      if (!pickMarkerRef.current) {
        pickMarkerRef.current = L.marker([pickedLocation.lat, pickedLocation.lon], { icon }).addTo(mapRef.current);
      } else {
        pickMarkerRef.current.setLatLng([pickedLocation.lat, pickedLocation.lon]);
      }
    } else {
      if (pickMarkerRef.current && mapRef.current) {
        mapRef.current.removeLayer(pickMarkerRef.current);
        pickMarkerRef.current = null;
      }
    }
  }, [pickedLocation]);

  // 5. Pan to selected incident
  useEffect(() => {
    if (!selectedIncidentId || !mapRef.current) return;
    const target = incidents.find(i => i.id === selectedIncidentId);
    if (target) {
      const [lng, lat] = target.geometry.coordinates;
      mapRef.current.flyTo([lat, lng], 15, { duration: 1 });
    }
  }, [selectedIncidentId, incidents]);

  // 6. Jump to key locations
  const handleLocationSelect = (coords: [number, number]) => {
    if (!mapRef.current) return;
    mapRef.current.flyTo(coords, 15, { duration: 1 });
    setSearchQuery('');
  };

  return (
    <div className="relative w-full rounded-[4px] overflow-hidden border border-[#e5edf5] bg-[#f8fafd] shadow-xs">
      {/* Top Map Action Bar */}
      <div className="absolute top-3 left-3 z-[1000] flex flex-wrap items-center gap-2 max-w-[calc(100%-120px)]">
        {/* Quick Location Search */}
        <div className="relative">
          <div className="flex items-center gap-2 bg-white/95 backdrop-blur px-3 py-1.5 rounded-[4px] border border-[#e5edf5] shadow-xs text-xs text-[#061b31]">
            <Search className="w-3.5 h-3.5 text-[#533afd]" />
            <input
              type="text"
              placeholder="Jump to corridor..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent text-[#061b31] outline-none placeholder:text-[#94a3b8] w-36 sm:w-44"
            />
          </div>

          {searchQuery && (
            <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-[#e5edf5] rounded-[4px] shadow-lg py-1 z-[1010] max-h-52 overflow-y-auto">
              {keyLocations
                .filter(l => l.name.toLowerCase().includes(searchQuery.toLowerCase()))
                .map(loc => (
                  <button
                    key={loc.name}
                    onClick={() => handleLocationSelect(loc.coords)}
                    className="w-full text-left px-3 py-2 text-xs text-[#50617a] hover:bg-[#e8e9ff] hover:text-[#533afd] flex items-center justify-between transition-colors"
                  >
                    <span>{loc.name}</span>
                    <Compass className="w-3 h-3 text-[#64748d]" />
                  </button>
                ))}
            </div>
          )}
        </div>

        {/* Verification Filter Selector */}
        <div className="hidden sm:flex items-center gap-1 bg-white/95 backdrop-blur p-1 rounded-[4px] border border-[#e5edf5] text-xs">
          {(['ALL', 'PENDING', 'VERIFIED', 'RESOLVED', 'REJECTED'] as const).map(vStatus => (
            <button
              key={vStatus}
              onClick={() => setVerificationFilter(vStatus)}
              className={`px-2 py-0.5 rounded-[2px] font-medium transition-colors text-[11px] ${
                verificationFilter === vStatus
                  ? 'bg-[#533afd] text-white shadow-2xs'
                  : 'text-[#64748d] hover:text-[#061b31]'
              }`}
            >
              {vStatus}
            </button>
          ))}
        </div>
      </div>

      {enableManualLocationPick && (
        <div className="absolute top-3 right-14 z-[1000] bg-[#e8e9ff] border border-[#d8dbff] text-[#533afd] px-3 py-1.5 rounded-[4px] text-xs flex items-center gap-1.5 shadow-xs font-medium">
          <MapPin className="w-3.5 h-3.5 animate-pulse" />
          <span>Click on map to drop incident pin</span>
        </div>
      )}

      {/* Loading Skeleton */}
      {!mapLoaded && (
        <div className="absolute inset-0 bg-[#f8fafd] flex flex-col items-center justify-center z-[999] text-[#64748d] gap-2 pointer-events-none">
          <div className="w-6 h-6 border-2 border-[#533afd] border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-medium">Rendering Mangaluru GIS Basemap...</span>
        </div>
      )}

      {/* Map Canvas */}
      <div ref={mapContainer} className={`w-full ${heightClass}`} style={{ minHeight: '400px' }} />

      {/* Bottom Map Legend */}
      <div className="absolute bottom-3 left-3 z-[1000] flex flex-col sm:flex-row items-start sm:items-center gap-2">
        <div className="bg-white/95 backdrop-blur px-3 py-1.5 rounded-[4px] border border-[#e5edf5] text-[11px] shadow-xs flex items-center gap-3">
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-[2px] bg-[#e11d48]"></span>
            <span className="text-[#061b31] font-medium">Verified</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-[2px] bg-[#d97706]"></span>
            <span className="text-[#061b31] font-medium">Pending</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-[2px] bg-[#059669]"></span>
            <span className="text-[#061b31] font-medium">Resolved</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-[2px] bg-[#475569]"></span>
            <span className="text-[#061b31] font-medium">Rejected</span>
          </div>
        </div>

        <div className="bg-white/95 backdrop-blur px-3 py-1.5 rounded-[4px] border border-[#e5edf5] text-[11px] shadow-xs flex items-center gap-3">
          <label className="flex items-center gap-1.5 cursor-pointer text-[#50617a] hover:text-[#061b31]">
            <input
              type="checkbox"
              checked={showRoads}
              onChange={(e) => setShowRoads(e.target.checked)}
              className="rounded-[2px] accent-[#533afd]"
            />
            <span>Corridors</span>
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer text-[#50617a] hover:text-[#061b31]">
            <input
              type="checkbox"
              checked={showIncidents}
              onChange={(e) => setShowIncidents(e.target.checked)}
              className="rounded-[2px] accent-[#533afd]"
            />
            <span>Incidents ({incidents.length})</span>
          </label>
        </div>
      </div>
    </div>
  );
};
