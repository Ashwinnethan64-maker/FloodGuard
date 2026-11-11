import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { RoadSegment, FloodIncident, RoadStatus, VerificationStatus } from '../../types/api';
import { 
  Search, 
  Compass, 
  MapPin, 
  Crosshair, 
  RotateCcw
} from 'lucide-react';

// 1. Resolve Leaflet standard marker icon URL issues in Vite/Webpack
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

interface MangaluruMapProps {
  roads?: RoadSegment[];
  incidents?: FloodIncident[];
  selectedIncidentId?: string | null;
  onSelectIncident?: (id: string) => void;
  heightClass?: string;
  enableManualLocationPick?: boolean;
  onLocationPicked?: (lat: number, lon: number, address?: string) => void;
  pickedLocation?: { lat: number; lon: number } | null;
  routeCoordinates?: [number, number][]; // Optional route polyline overlay [lat, lon]
}

export const MangaluruMap = ({
  roads = [],
  incidents = [],
  selectedIncidentId,
  onSelectIncident,
  heightClass = 'h-[620px]',
  enableManualLocationPick = false,
  onLocationPicked,
  pickedLocation,
  routeCoordinates,
}: MangaluruMapProps) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const roadLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const incidentLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const pickMarkerRef = useRef<L.Marker | null>(null);
  const routePolylineRef = useRef<L.Polyline | null>(null);
  const userLocationMarkerRef = useRef<L.CircleMarker | null>(null);

  const [mapLoaded, setMapLoaded] = useState<boolean>(false);
  const [showRoads, setShowRoads] = useState<boolean>(true);
  const [showIncidents, setShowIncidents] = useState<boolean>(true);
  const [verificationFilter, setVerificationFilter] = useState<VerificationStatus | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [locatingUser, setLocatingUser] = useState<boolean>(false);

  // Mangaluru Center Baseline Coordinates
  const MANGALURU_CENTER: [number, number] = [12.9141, 74.8560];
  const INITIAL_ZOOM = 13;

  const keyLocations = [
    { name: 'Kottara Chowki (NH-66)', coords: [12.9050, 74.8445] as [number, number] },
    { name: 'Pumpwell Circle (Mahaveera)', coords: [12.8625, 74.8695] as [number, number] },
    { name: 'State Bank Service Bus Stand', coords: [12.8635, 74.8410] as [number, number] },
    { name: 'Kadri Hills / Park', coords: [12.8870, 74.8630] as [number, number] },
    { name: 'Baikampady Industrial Estate', coords: [12.9570, 74.8175] as [number, number] },
    { name: 'Car Street (Temple)', coords: [12.8725, 74.8455] as [number, number] },
    { name: 'KSRTC Bus Stand Bejai', coords: [12.8910, 74.8530] as [number, number] },
  ];

  const getStatusColor = (status: RoadStatus) => {
    switch (status) {
      case 'OPEN':
        return '#059669'; // Emerald
      case 'CAUTION':
        return '#d97706'; // Amber
      case 'BLOCKED':
        return '#dc2626'; // Red / Submerged
      case 'UNVERIFIED':
        return '#7c3aed'; // Purple
      default:
        return '#64748b';
    }
  };

  // 1. Initialize Leaflet Map with OpenStreetMap Basemap Tiles
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Create Map Instance
    const map = L.map(mapContainerRef.current, {
      center: MANGALURU_CENTER,
      zoom: INITIAL_ZOOM,
      minZoom: 10,
      maxZoom: 19,
      zoomControl: false, // We'll add zoomControl to top-right
      attributionControl: true,
    });

    // Add OpenStreetMap Standard Raster Tile Layer
    // Using official tile.openstreetmap.org endpoint per usage policy
    const osmLayer = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors • FLOODGUARD GIS',
    });
    osmLayer.addTo(map);

    // Zoom control in top-right
    L.control.zoom({ position: 'topright' }).addTo(map);

    // Layer groups for dynamic toggling without full reinitialization
    const roadGroup = L.layerGroup().addTo(map);
    const incidentGroup = L.layerGroup().addTo(map);
    roadLayerGroupRef.current = roadGroup;
    incidentLayerGroupRef.current = incidentGroup;

    mapInstanceRef.current = map;
    setMapLoaded(true);

    // Invalidate size on container layout stabilization
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 150);

    // ResizeObserver to detect layout / sidebar collapse changes
    const resizeObserver = new ResizeObserver(() => {
      map.invalidateSize();
    });
    if (mapContainerRef.current) {
      resizeObserver.observe(mapContainerRef.current);
    }

    // Manual location picker listener
    map.on('click', (e: L.LeafletMouseEvent) => {
      if (enableManualLocationPick && onLocationPicked) {
        const { lat, lng } = e.latlng;
        onLocationPicked(Number(lat.toFixed(6)), Number(lng.toFixed(6)));
      }
    });

    return () => {
      clearTimeout(timer);
      resizeObserver.disconnect();
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // 2. Render Road Segments (PostGIS LineStrings)
  useEffect(() => {
    if (!mapInstanceRef.current || !roadLayerGroupRef.current) return;
    const roadGroup = roadLayerGroupRef.current;
    roadGroup.clearLayers();

    if (!showRoads) return;

    roads.forEach(road => {
      if (!road.geometry || !road.geometry.coordinates) return;

      // Road geometry is GeoJSON [lon, lat] pairs. Leaflet expects [lat, lon]
      const latLngs: [number, number][] = road.geometry.coordinates.map(pt => [pt[1], pt[0]]);
      const strokeColor = getStatusColor(road.current_status);

      // Background casing line for glow
      const casing = L.polyline(latLngs, {
        color: strokeColor,
        weight: 8,
        opacity: 0.35,
        lineCap: 'round',
        lineJoin: 'round',
      });

      // Foreground sharp corridor line
      const line = L.polyline(latLngs, {
        color: strokeColor,
        weight: 4.5,
        opacity: 0.95,
        lineCap: 'round',
        lineJoin: 'round',
      });

      // Interactive popup
      const popupContent = `
        <div style="font-family: inherit; font-size: 12px; color: #061b31; min-width: 180px; padding: 2px;">
          <div style="font-size: 10px; font-weight: 700; text-transform: uppercase; color: ${strokeColor}; margin-bottom: 2px;">
            ● Road Corridor: ${road.current_status}
          </div>
          <div style="font-weight: 700; font-size: 13px; color: #061b31;">${road.name}</div>
          <div style="font-size: 11px; color: #64748d; margin-top: 1px;">Ward: ${road.ward}</div>
          <div style="margin-top: 6px; padding-top: 6px; border-top: 1px solid #e5edf5; font-size: 11px;">
            Water Depth: <strong>${road.current_water_depth_cm > 0 ? `${road.current_water_depth_cm} cm` : 'Dry'}</strong><br/>
            Elevation: <strong>${road.elevation_meters}m</strong> | Source: <span style="font-family: monospace;">${road.last_source}</span>
          </div>
        </div>
      `;
      line.bindPopup(popupContent, { offset: [0, -4] });

      casing.addTo(roadGroup);
      line.addTo(roadGroup);
    });
  }, [roads, showRoads]);

  // 3. Render Incident Markers
  useEffect(() => {
    if (!mapInstanceRef.current || !incidentLayerGroupRef.current) return;
    const incGroup = incidentLayerGroupRef.current;
    incGroup.clearLayers();

    if (!showIncidents) return;

    const filtered = incidents.filter(i => 
      verificationFilter === 'ALL' || i.verification_status === verificationFilter
    );

    filtered.forEach(inc => {
      if (!inc.geometry || !inc.geometry.coordinates) return;
      // inc.geometry.coordinates is [lon, lat]
      const lat = inc.geometry.coordinates[1];
      const lon = inc.geometry.coordinates[0];

      let badgeBg = '#d97706'; // Amber / Pending
      let symbol = '?';
      let titleLabel = 'Pending Citizen Report';

      if (inc.verification_status === 'VERIFIED') {
        badgeBg = '#dc2626'; // Red
        symbol = '!';
        titleLabel = 'Verified Submerged Bottleneck';
      } else if (inc.verification_status === 'RESOLVED') {
        badgeBg = '#059669'; // Green
        symbol = '✓';
        titleLabel = 'Resolved / Water Cleared';
      } else if (inc.verification_status === 'REJECTED') {
        badgeBg = '#64748d'; // Grey
        symbol = '✕';
        titleLabel = 'Rejected Report';
      }

      // Create high-contrast custom HTML circle divIcon
      const customIcon = L.divIcon({
        className: 'custom-flood-pin',
        iconSize: [28, 28],
        iconAnchor: [14, 14],
        html: `
          <div style="
            width: 28px;
            height: 28px;
            border-radius: 9999px;
            background-color: ${badgeBg};
            color: #ffffff;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
            font-weight: 900;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.2);
            border: 2px solid #ffffff;
            cursor: pointer;
            transition: transform 0.15s ease;
          ">
            ${symbol}
          </div>
        `
      });

      const marker = L.marker([lat, lon], { icon: customIcon });

      const popupContent = `
        <div style="font-family: inherit; font-size: 12px; color: #061b31; max-width: 220px; padding: 2px;">
          <div style="font-size: 10px; font-weight: 700; text-transform: uppercase; color: ${badgeBg}; margin-bottom: 2px;">
            ${titleLabel}
          </div>
          <div style="font-weight: 700; font-size: 13px; color: #061b31;">${inc.location_name}</div>
          <div style="font-size: 11px; color: #533afd; font-weight: 600; margin-top: 1px;">Category: ${inc.incident_category}</div>
          <p style="font-size: 11px; color: #64748d; margin: 4px 0;">${inc.description || 'No description provided.'}</p>
          <div style="font-size: 10px; border-top: 1px solid #e5edf5; padding-top: 4px; color: #50617a;">
            Water Depth: <strong>${inc.reported_water_depth}</strong> | 
            4W: <strong style="color: ${inc.passable_four_wheelers ? '#059669' : '#dc2626'}">${inc.passable_four_wheelers ? 'Passable' : 'Submerged'}</strong>
          </div>
          <div style="font-size: 9px; color: #94a3b8; margin-top: 4px;">
            Source: ${inc.source} • ${new Date(inc.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
      `;

      marker.bindPopup(popupContent, { offset: [0, -10] });

      marker.on('click', () => {
        if (onSelectIncident) onSelectIncident(inc.id);
      });

      marker.addTo(incGroup);
    });
  }, [incidents, showIncidents, verificationFilter, onSelectIncident]);

  // 4. Update Manual Picked Location Marker
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    if (pickedLocation) {
      if (!pickMarkerRef.current) {
        const pickIcon = L.divIcon({
          className: 'pick-pin',
          iconSize: [30, 30],
          iconAnchor: [15, 30],
          html: `<div style="font-size: 26px; line-height: 1; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));">📍</div>`
        });
        pickMarkerRef.current = L.marker([pickedLocation.lat, pickedLocation.lon], { icon: pickIcon }).addTo(map);
      } else {
        pickMarkerRef.current.setLatLng([pickedLocation.lat, pickedLocation.lon]);
      }
    } else {
      pickMarkerRef.current?.remove();
      pickMarkerRef.current = null;
    }
  }, [pickedLocation]);

  // 5. Update Optional Route Polyline
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    if (routePolylineRef.current) {
      routePolylineRef.current.remove();
      routePolylineRef.current = null;
    }

    if (routeCoordinates && routeCoordinates.length > 1) {
      const polyline = L.polyline(routeCoordinates, {
        color: '#533afd',
        weight: 6,
        opacity: 0.9,
        lineCap: 'round',
        lineJoin: 'round',
      }).addTo(map);

      routePolylineRef.current = polyline;
      map.fitBounds(polyline.getBounds(), { padding: [40, 40] });
    }
  }, [routeCoordinates]);

  // 6. Pan to Selected Incident
  useEffect(() => {
    if (!selectedIncidentId || !mapInstanceRef.current) return;
    const target = incidents.find(i => i.id === selectedIncidentId);
    if (target && target.geometry?.coordinates) {
      mapInstanceRef.current.setView(
        [target.geometry.coordinates[1], target.geometry.coordinates[0]],
        15,
        { animate: true }
      );
    }
  }, [selectedIncidentId, incidents]);

  // Jump to Preset Corridor
  const handleLocationSelect = (coords: [number, number]) => {
    if (!mapInstanceRef.current) return;
    mapInstanceRef.current.setView(coords, 15, { animate: true });
    setSearchQuery('');
  };

  // Reset to Mangaluru Center
  const handleResetView = () => {
    if (!mapInstanceRef.current) return;
    mapInstanceRef.current.setView(MANGALURU_CENTER, INITIAL_ZOOM, { animate: true });
  };

  // Geolocation: Find User Location
  const handleLocateMe = () => {
    if (!navigator.geolocation || !mapInstanceRef.current) {
      alert('Geolocation is not supported by your browser.');
      return;
    }

    setLocatingUser(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setLocatingUser(false);
        if (mapInstanceRef.current) {
          mapInstanceRef.current.setView([latitude, longitude], 15, { animate: true });

          if (userLocationMarkerRef.current) {
            userLocationMarkerRef.current.setLatLng([latitude, longitude]);
          } else {
            userLocationMarkerRef.current = L.circleMarker([latitude, longitude], {
              radius: 8,
              fillColor: '#3b82f6',
              color: '#ffffff',
              weight: 2.5,
              opacity: 1,
              fillOpacity: 0.9,
            }).addTo(mapInstanceRef.current);
          }
        }
      },
      (err) => {
        setLocatingUser(false);
        alert(`Location permission denied or unavailable: ${err.message}`);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  return (
    <div className="relative w-full rounded-sm overflow-hidden border border-[#e5edf5] bg-white shadow-xs">
      {/* Top Map Control Bar */}
      <div className="absolute top-2 sm:top-3 left-2 sm:left-3 z-[1000] flex flex-wrap items-center gap-1.5 sm:gap-2 max-w-[calc(100%-16px)] sm:max-w-[calc(100%-80px)]">
        {/* Quick Corridor Search Dropdown */}
        <div className="relative">
          <div className="flex items-center gap-1.5 sm:gap-2 bg-white/95 backdrop-blur px-2.5 sm:px-3 py-1.5 rounded-sm border border-[#e5edf5] shadow-xs text-xs text-[#061b31]">
            <Search className="w-3.5 h-3.5 text-[#533afd] shrink-0" />
            <input
              type="text"
              placeholder="Jump corridor..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent text-[#061b31] outline-none placeholder:text-[#94a3b8] w-24 xs:w-32 sm:w-44 text-[11px] sm:text-xs"
            />
          </div>

          {searchQuery && (
            <div className="absolute top-full left-0 mt-1 w-56 sm:w-64 bg-white border border-[#e5edf5] rounded-sm shadow-lg py-1 z-[1100] max-h-52 overflow-y-auto">
              {keyLocations
                .filter(l => l.name.toLowerCase().includes(searchQuery.toLowerCase()))
                .map(loc => (
                  <button
                    key={loc.name}
                    type="button"
                    onClick={() => handleLocationSelect(loc.coords)}
                    className="w-full text-left px-3 py-2 text-xs text-[#50617a] hover:bg-[#e8e9ff] hover:text-[#533afd] flex items-center justify-between transition-colors"
                  >
                    <span className="truncate pr-2">{loc.name}</span>
                    <Compass className="w-3 h-3 text-[#64748d] shrink-0" />
                  </button>
                ))}
            </div>
          )}
        </div>

        {/* Verification Filter Selector */}
        <div className="hidden sm:flex items-center gap-1 bg-white/95 backdrop-blur p-1 rounded-sm border border-[#e5edf5] text-xs shadow-xs">
          {(['ALL', 'PENDING', 'VERIFIED', 'RESOLVED', 'REJECTED'] as const).map(vStatus => (
            <button
              key={vStatus}
              type="button"
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

        {/* Action Controls: Recenter & Geolocation */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handleResetView}
            className="p-1.5 rounded-sm bg-white/95 backdrop-blur border border-[#e5edf5] text-[#533afd] hover:bg-[#e8e9ff] shadow-xs text-xs flex items-center gap-1"
            title="Fit to Mangaluru Center"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Mangaluru</span>
          </button>

          <button
            type="button"
            onClick={handleLocateMe}
            disabled={locatingUser}
            className="p-1.5 rounded-sm bg-white/95 backdrop-blur border border-[#e5edf5] text-[#059669] hover:bg-[#ecfdf5] shadow-xs text-xs flex items-center gap-1 disabled:opacity-50"
            title="Locate My Position"
          >
            <Crosshair className={`w-3.5 h-3.5 ${locatingUser ? 'animate-spin' : ''}`} />
            <span className="hidden md:inline">{locatingUser ? 'Locating...' : 'My Location'}</span>
          </button>
        </div>
      </div>

      {/* Manual Pin Drop Indicator */}
      {enableManualLocationPick && (
        <div className="absolute top-14 right-3 z-[1000] bg-[#e8e9ff] border border-[#d8dbff] text-[#533afd] px-3 py-1.5 rounded-sm text-xs flex items-center gap-1.5 shadow-xs font-medium">
          <MapPin className="w-3.5 h-3.5 animate-pulse" />
          <span>Click on map to drop hazard coordinate</span>
        </div>
      )}

      {/* Loading Canvas Placeholder */}
      {!mapLoaded && (
        <div className="absolute inset-0 bg-[#f8fafd] flex flex-col items-center justify-center z-10 text-[#64748d] gap-2 pointer-events-none">
          <div className="w-6 h-6 border-2 border-[#533afd] border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-medium">Loading OpenStreetMap raster basemap...</span>
        </div>
      )}

      {/* Leaflet Map DOM Mount Node */}
      <div 
        ref={mapContainerRef} 
        className={`w-full ${heightClass}`} 
        style={{ minHeight: '520px' }}
      />

      {/* Bottom Floating Legend Bar */}
      <div className="absolute bottom-2 sm:bottom-3 left-2 sm:left-3 z-[1000] flex flex-wrap items-center gap-1.5 sm:gap-2 max-w-[calc(100%-16px)]">
        <div className="bg-white/95 backdrop-blur px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-sm border border-[#e5edf5] text-[10px] sm:text-[11px] shadow-xs flex flex-wrap items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-1 sm:gap-1.5">
            <span className="w-2 sm:w-2.5 h-2 sm:h-2.5 rounded-[2px] bg-[#dc2626] shrink-0" />
            <span className="text-[#061b31] font-medium">Submerged</span>
          </div>
          <div className="flex items-center gap-1 sm:gap-1.5">
            <span className="w-2 sm:w-2.5 h-2 sm:h-2.5 rounded-[2px] bg-[#d97706] shrink-0" />
            <span className="text-[#061b31] font-medium">Caution</span>
          </div>
          <div className="flex items-center gap-1 sm:gap-1.5">
            <span className="w-2 sm:w-2.5 h-2 sm:h-2.5 rounded-[2px] bg-[#059669] shrink-0" />
            <span className="text-[#061b31] font-medium">Passable</span>
          </div>
        </div>

        <div className="bg-white/95 backdrop-blur px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-sm border border-[#e5edf5] text-[10px] sm:text-[11px] shadow-xs flex items-center gap-2 sm:gap-3">
          <label className="flex items-center gap-1.5 cursor-pointer text-[#50617a] hover:text-[#061b31]">
            <input
              type="checkbox"
              checked={showRoads}
              onChange={(e) => setShowRoads(e.target.checked)}
              className="rounded-[2px] accent-[#533afd]"
            />
            <span>Corridors ({roads.length})</span>
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
