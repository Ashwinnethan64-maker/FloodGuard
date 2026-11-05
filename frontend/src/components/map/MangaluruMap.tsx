import { useEffect, useRef, useState, useCallback } from 'react';
import * as maplibregl from 'maplibre-gl';
import type { Map, Marker } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import type { RoadSegment, FloodIncident, RoadStatus, VerificationStatus } from '../../types/api';
import { 
  Search, 
  Compass, 
  MapPin,
  Layers,
  AlertCircle
} from 'lucide-react';
import type { FeatureCollection } from 'geojson';

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
  const map = useRef<Map | null>(null);
  const markersRef = useRef<Marker[]>([]);
  const pickMarkerRef = useRef<Marker | null>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);

  const [showRoads, setShowRoads] = useState<boolean>(true);
  const [showIncidents, setShowIncidents] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedStatusFilter] = useState<RoadStatus | 'ALL'>('ALL');
  const [verificationFilter, setVerificationFilter] = useState<VerificationStatus | 'ALL'>('ALL');
  const [mapLoaded, setMapLoaded] = useState<boolean>(false);
  const [mapError, setMapError] = useState<string | null>(null);

  const keyLocations = [
    { name: 'Kottara Chowki (NH-66)', coords: [74.8445, 12.9050] as [number, number] },
    { name: 'Pumpwell Circle (Mahaveera)', coords: [74.8695, 12.8625] as [number, number] },
    { name: 'State Bank Service Bus Stand', coords: [74.8410, 12.8635] as [number, number] },
    { name: 'Kadri Hills / Park', coords: [74.8630, 12.8870] as [number, number] },
    { name: 'Baikampady Industrial Estate', coords: [74.8175, 12.9570] as [number, number] },
    { name: 'Car Street (Venkataramana Temple)', coords: [74.8455, 12.8725] as [number, number] },
    { name: 'KSRTC Bus Stand Bejai', coords: [74.8530, 12.8910] as [number, number] },
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

  // Helper to attach/update GeoJSON road corridors in MapLibre
  const renderRoadLayers = useCallback(() => {
    if (!map.current || !map.current.isStyleLoaded()) return;

    const geojsonData: FeatureCollection = {
      type: 'FeatureCollection',
      features: roads
        .filter(r => selectedStatusFilter === 'ALL' || r.current_status === selectedStatusFilter)
        .map(r => ({
          type: 'Feature',
          geometry: r.geometry,
          properties: {
            id: r.id,
            name: r.name,
            ward: r.ward,
            status: r.current_status,
            depth_cm: r.current_water_depth_cm,
            elevation: r.elevation_meters,
            source: r.last_source,
            color: getStatusColor(r.current_status)
          }
        }))
    };

    const source = map.current.getSource('mangaluru-roads') as maplibregl.GeoJSONSource | undefined;
    if (source) {
      source.setData(geojsonData);
    } else {
      map.current.addSource('mangaluru-roads', {
        type: 'geojson',
        data: geojsonData
      });

      // Outer glow / flood casing
      map.current.addLayer({
        id: 'roads-casing',
        type: 'line',
        source: 'mangaluru-roads',
        layout: {
          'line-join': 'round',
          'line-cap': 'round',
          'visibility': showRoads ? 'visible' : 'none'
        },
        paint: {
          'line-color': ['get', 'color'],
          'line-width': 8,
          'line-opacity': 0.35,
          'line-blur': 2
        }
      });

      // Inner road stroke
      map.current.addLayer({
        id: 'roads-inner',
        type: 'line',
        source: 'mangaluru-roads',
        layout: {
          'line-join': 'round',
          'line-cap': 'round',
          'visibility': showRoads ? 'visible' : 'none'
        },
        paint: {
          'line-color': ['get', 'color'],
          'line-width': 4.5
        }
      });

      // Click inspector popup
      map.current.on('click', 'roads-inner', (e) => {
        if (!e.features || !e.features[0] || !map.current) return;
        const props = e.features[0].properties as any;
        const coordinates = (e.features[0].geometry as any).coordinates[0];

        new maplibregl.Popup({ offset: 12, className: 'neerpath-map-popup' })
          .setLngLat(coordinates)
          .setHTML(`
            <div style="font-family: sans-serif; padding: 4px; color: #0f172a; min-width: 170px;">
              <div style="font-size: 11px; text-transform: uppercase; font-weight: bold; color: ${props.color}">
                ● ${props.status}
              </div>
              <div style="font-weight: 700; font-size: 13px; margin: 2px 0;">${props.name}</div>
              <div style="font-size: 11px; color: #475569;">${props.ward}</div>
              <div style="margin-top: 6px; font-size: 11px; border-top: 1px solid #e2e8f0; padding-top: 4px;">
                Water Depth: <strong>${props.depth_cm} cm</strong> | Elev: ${props.elevation}m
              </div>
              <div style="font-size: 9px; color: #64748b; margin-top: 2px;">
                Source: ${props.source}
              </div>
            </div>
          `)
          .addTo(map.current);
      });

      map.current.on('mouseenter', 'roads-inner', () => {
        if (map.current) map.current.getCanvas().style.cursor = 'pointer';
      });
      map.current.on('mouseleave', 'roads-inner', () => {
        if (map.current) map.current.getCanvas().style.cursor = '';
      });
    }
  }, [roads, selectedStatusFilter, showRoads]);

  // 1. Initialize MapLibre with CARTO Vector GL Basemap
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    const cartoKey = import.meta.env.VITE_CARTO_BASEMAPS_API_KEY?.trim() || 'cb1_52fv_1_ae65d0f9ce5b90bb3899dcda';
    
    // Modern CARTO Voyager Vector GL style endpoint with api_key
    const cartoStyleUrl = `https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json?api_key=${cartoKey}`;

    const mapInstance = new maplibregl.Map({
      container: mapContainer.current,
      style: cartoStyleUrl,
      center: [74.8560, 12.9141], // [Longitude, Latitude] in MapLibre
      zoom: 12.3,
      maxZoom: 18,
      minZoom: 10,
      transformRequest: (url: string) => {
        // Automatically inject CARTO key query parameter if fetching CARTO tiles, glyphs, or sprites
        if (url.includes('cartocdn.com') && !url.includes('key=') && !url.includes('api_key=')) {
          const separator = url.includes('?') ? '&' : '?';
          return {
            url: `${url}${separator}key=${cartoKey}`
          };
        }
        return { url };
      }
    });

    map.current = mapInstance;

    mapInstance.addControl(new maplibregl.NavigationControl({ showCompass: true }), 'top-right');
    mapInstance.addControl(new maplibregl.FullscreenControl(), 'top-right');

    mapInstance.on('style.load', () => {
      setMapLoaded(true);
      setMapError(null);
      renderRoadLayers();
    });

    mapInstance.on('load', () => {
      setMapLoaded(true);
      renderRoadLayers();
      mapInstance.resize();
    });

    mapInstance.on('error', (e: { error?: { message?: string } }) => {
      const errMsg = e?.error?.message || '';
      console.warn('[NEERPATH CARTO Map] Map event notice:', errMsg);
      if (errMsg.includes('401') || errMsg.includes('403') || errMsg.includes('key')) {
        setMapError('CARTO Basemaps API key authentication notice. Verify key validity.');
      }
    });

    // ResizeObserver for smooth sidebar collapse / drawer toggle
    if (window.ResizeObserver && mapContainer.current) {
      resizeObserverRef.current = new ResizeObserver(() => {
        mapInstance.resize();
      });
      resizeObserverRef.current.observe(mapContainer.current);
    }

    // Manual coordinate picker click listener
    mapInstance.on('click', (e: maplibregl.MapMouseEvent) => {
      if (enableManualLocationPick && onLocationPicked) {
        const { lng, lat } = e.lngLat;
        onLocationPicked(Number(lat.toFixed(6)), Number(lng.toFixed(6)));
      }
    });

    return () => {
      resizeObserverRef.current?.disconnect();
      markersRef.current.forEach(m => m.remove());
      pickMarkerRef.current?.remove();
      map.current?.remove();
      map.current = null;
    };
  }, [renderRoadLayers, enableManualLocationPick, onLocationPicked]);

  // Sync road visibility and layers
  useEffect(() => {
    if (map.current && map.current.isStyleLoaded()) {
      renderRoadLayers();
    }
  }, [renderRoadLayers]);

  useEffect(() => {
    if (!map.current || !map.current.isStyleLoaded()) return;
    const visibility = showRoads ? 'visible' : 'none';
    if (map.current.getLayer('roads-inner')) {
      map.current.setLayoutProperty('roads-inner', 'visibility', visibility);
    }
    if (map.current.getLayer('roads-casing')) {
      map.current.setLayoutProperty('roads-casing', 'visibility', visibility);
    }
  }, [showRoads]);

  // 2. Render Incident Markers
  useEffect(() => {
    if (!map.current) return;

    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    if (!showIncidents) return;

    const filtered = incidents.filter(i => 
      verificationFilter === 'ALL' || i.verification_status === verificationFilter
    );

    filtered.forEach(inc => {
      const el = document.createElement('div');
      el.className = 'cursor-pointer transform hover:scale-125 transition-transform z-20';
      
      let badgeColor = 'bg-amber-500 ring-amber-400';
      let symbol = '?';
      let titleLabel = 'Pending Citizen Report';

      if (inc.verification_status === 'VERIFIED') {
        badgeColor = 'bg-rose-600 ring-rose-400';
        symbol = '!';
        titleLabel = 'Admin-Verified Flood Incident';
      } else if (inc.verification_status === 'RESOLVED') {
        badgeColor = 'bg-emerald-600 ring-emerald-400';
        symbol = '✓';
        titleLabel = 'Resolved / Water Receded';
      } else if (inc.verification_status === 'REJECTED') {
        badgeColor = 'bg-slate-600 ring-slate-400 opacity-60';
        symbol = '✕';
        titleLabel = 'Rejected / False Alarm';
      }

      el.innerHTML = `
        <div class="relative flex items-center justify-center w-7 h-7 rounded-full ${badgeColor} text-white shadow-xl ring-2 ring-offset-2 ring-offset-slate-900">
          <span class="text-[11px] font-black">${symbol}</span>
          ${inc.verification_status === 'VERIFIED' ? `
            <span class="absolute -top-1 -right-1 flex h-2.5 w-2.5">
              <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span class="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
            </span>
          ` : ''}
        </div>
      `;

      el.addEventListener('click', () => {
        if (onSelectIncident) onSelectIncident(inc.id);
      });

      const popup = new maplibregl.Popup({ offset: 18 }).setHTML(`
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
      `);

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat(inc.geometry.coordinates)
        .setPopup(popup)
        .addTo(map.current!);

      markersRef.current.push(marker);
    });
  }, [incidents, showIncidents, verificationFilter, onSelectIncident]);

  // 3. Update Picked Location Pin
  useEffect(() => {
    if (!map.current) return;
    if (pickedLocation) {
      if (!pickMarkerRef.current) {
        const el = document.createElement('div');
        el.className = 'w-7 h-7 rounded-full bg-cyan-500 border-2 border-white flex items-center justify-center text-white shadow-xl animate-bounce';
        el.innerHTML = '📍';
        pickMarkerRef.current = new maplibregl.Marker({ element: el })
          .setLngLat([pickedLocation.lon, pickedLocation.lat])
          .addTo(map.current);
      } else {
        pickMarkerRef.current.setLngLat([pickedLocation.lon, pickedLocation.lat]);
      }
    } else {
      pickMarkerRef.current?.remove();
      pickMarkerRef.current = null;
    }
  }, [pickedLocation]);

  // 4. Pan to selected incident
  useEffect(() => {
    if (!selectedIncidentId || !map.current) return;
    const target = incidents.find(i => i.id === selectedIncidentId);
    if (target) {
      map.current.flyTo({
        center: target.geometry.coordinates,
        zoom: 14.5,
        essential: true,
      });
    }
  }, [selectedIncidentId, incidents]);

  // 5. Jump to key corridors
  const handleLocationSelect = (coords: [number, number]) => {
    if (!map.current) return;
    map.current.flyTo({
      center: coords,
      zoom: 14.2,
      essential: true,
    });
    setSearchQuery('');
  };

  return (
    <div className="relative w-full rounded-[4px] overflow-hidden border border-[#e5edf5] bg-[#f8fafd] shadow-xs">
      {/* Top Map Action Bar */}
      <div className="absolute top-3 left-3 z-10 flex flex-wrap items-center gap-2 max-w-[calc(100%-120px)]">
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
            <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-[#e5edf5] rounded-[4px] shadow-lg py-1 z-30 max-h-52 overflow-y-auto">
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

        {/* CARTO Vector Basemap Active Indicator */}
        <div className="hidden md:flex items-center gap-1.5 bg-white/95 backdrop-blur px-2.5 py-1 rounded-[4px] border border-[#e5edf5] text-[11px] text-[#50617a]">
          <Layers className="w-3 h-3 text-[#533afd]" />
          <span>CARTO Voyager Vector</span>
        </div>
      </div>

      {enableManualLocationPick && (
        <div className="absolute top-3 right-14 z-10 bg-[#e8e9ff] border border-[#d8dbff] text-[#533afd] px-3 py-1.5 rounded-[4px] text-xs flex items-center gap-1.5 shadow-xs font-medium">
          <MapPin className="w-3.5 h-3.5 animate-pulse" />
          <span>Click on map to drop incident pin</span>
        </div>
      )}

      {mapError && (
        <div className="absolute top-14 left-3 z-20 bg-amber-50 border border-amber-200 text-amber-900 px-3 py-1.5 rounded-[4px] text-xs flex items-center gap-2 shadow-sm max-w-md">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>{mapError}</span>
        </div>
      )}

      {/* Loading Skeleton */}
      {!mapLoaded && (
        <div className="absolute inset-0 bg-[#f8fafd] flex flex-col items-center justify-center z-10 text-[#64748d] gap-2 pointer-events-none">
          <div className="w-6 h-6 border-2 border-[#533afd] border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-medium">Rendering CARTO Vector Basemap...</span>
        </div>
      )}

      {/* Map Canvas */}
      <div ref={mapContainer} className={`w-full ${heightClass}`} />

      {/* Bottom Map Legend */}
      <div className="absolute bottom-3 left-3 z-10 flex flex-col sm:flex-row items-start sm:items-center gap-2">
        <div className="bg-white/95 backdrop-blur px-3 py-1.5 rounded-[4px] border border-[#e5edf5] text-[11px] shadow-xs flex items-center gap-3">
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-[2px] bg-[#dc2626]"></span>
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
            <span className="w-2.5 h-2.5 rounded-[2px] bg-[#64748d]"></span>
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
