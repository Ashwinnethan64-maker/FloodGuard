import { useEffect, useRef, useState } from 'react';
import * as maplibregl from 'maplibre-gl';
import type { Map, Marker } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import type { RoadSegment, FloodIncident, RoadStatus, VerificationStatus } from '../../types/api';
import { 
  Search, 
  Compass,
  MapPin
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

  const [showRoads, setShowRoads] = useState<boolean>(true);
  const [showIncidents, setShowIncidents] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedStatusFilter] = useState<RoadStatus | 'ALL'>('ALL');
  const [verificationFilter, setVerificationFilter] = useState<VerificationStatus | 'ALL'>('ALL');

  const keyLocations = [
    { name: 'Kottara Chowki (NH-66)', coords: [74.8445, 12.9050] },
    { name: 'Pumpwell Circle (Mahaveera)', coords: [74.8695, 12.8625] },
    { name: 'State Bank Service Bus Stand', coords: [74.8410, 12.8635] },
    { name: 'Kadri Hills / Park', coords: [74.8630, 12.8870] },
    { name: 'Baikampady Industrial Estate', coords: [74.8175, 12.9570] },
    { name: 'Car Street (Venkataramana Temple)', coords: [74.8455, 12.8725] },
    { name: 'KSRTC Bus Stand Bejai', coords: [74.8530, 12.8910] },
  ];

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    const maptilerKey = import.meta.env.VITE_MAPTILER_KEY;
    // MapTiler Streets v2 style with fallback to OSM raster tiles if key is absent or unreachable
    const mapStyle = (maptilerKey && maptilerKey !== 'demo_key_or_placeholder')
      ? `https://api.maptiler.com/maps/streets-v2/style.json?key=${maptilerKey}`
      : ({
          version: 8 as const,
          sources: {
            'osm-tiles': {
              type: 'raster' as const,
              tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
              tileSize: 256,
              attribution: '© OpenStreetMap contributors | Mangaluru GIS Grid'
            }
          },
          layers: [
            {
              id: 'osm-tiles-layer',
              type: 'raster' as const,
              source: 'osm-tiles',
              minzoom: 0,
              maxzoom: 19,
              paint: {
                'raster-brightness-max': 0.85,
                'raster-contrast': 0.15,
                'raster-saturation': -0.65,
              }
            }
          ]
        } as maplibregl.StyleSpecification);

    const mapInstance = new maplibregl.Map({
      container: mapContainer.current,
      style: mapStyle,
      center: [74.8560, 12.9141],
      zoom: 12.2,
      maxZoom: 18,
      minZoom: 10,
    });
    map.current = mapInstance;

    // Graceful error recovery: switch to OSM tiles if MapTiler fails to load (e.g. invalid key/quota)
    mapInstance.on('error', (e: { error?: { message?: string } }) => {
      if (e && e.error && typeof e.error.message === 'string' && e.error.message.includes('maptiler')) {
        console.warn('[NEERPATH MapTiler] MapTiler style error, reverting to OpenStreetMap raster tiles:', e.error.message);
        try {
          mapInstance.setStyle({
            version: 8 as const,
            sources: {
              'osm-tiles': {
                type: 'raster' as const,
                tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
                tileSize: 256,
                attribution: '© OpenStreetMap contributors | Mangaluru GIS Grid'
              }
            },
            layers: [
              {
                id: 'osm-tiles-layer',
                type: 'raster' as const,
                source: 'osm-tiles',
                minzoom: 0,
                maxzoom: 19
              }
            ]
          } as maplibregl.StyleSpecification);
        } catch (styleErr) {
          console.error('[NEERPATH MapTiler] Error applying fallback style:', styleErr);
        }
      }
    });

    mapInstance.addControl(new maplibregl.NavigationControl({ showCompass: true }), 'top-right');
    mapInstance.addControl(new maplibregl.FullscreenControl(), 'top-right');

    mapInstance.on('load', () => {
      renderRoadLayers();
    });

    // Map Click Handler for manual coordinate picking
    mapInstance.on('click', (e: maplibregl.MapMouseEvent) => {
      if (enableManualLocationPick && onLocationPicked) {
        const { lng, lat } = e.lngLat;
        onLocationPicked(Number(lat.toFixed(6)), Number(lng.toFixed(6)));
      }
    });

    return () => {
      markersRef.current.forEach(m => m.remove());
      pickMarkerRef.current?.remove();
      map.current?.remove();
      map.current = null;
    };
  }, []);

  // Update Picked Location Pin
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

  const renderRoadLayers = () => {
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

    if (map.current.getSource('mangaluru-roads')) {
      (map.current.getSource('mangaluru-roads') as maplibregl.GeoJSONSource).setData(geojsonData);
    } else {
      map.current.addSource('mangaluru-roads', {
        type: 'geojson',
        data: geojsonData
      });

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

      map.current.on('click', 'roads-inner', (e) => {
        if (!e.features || !e.features[0] || !map.current) return;
        const props = e.features[0].properties;
        const coordinates = (e.features[0].geometry as any).coordinates[0];

        new maplibregl.Popup({ offset: 12, className: 'neerpath-map-popup' })
          .setLngLat(coordinates)
          .setHTML(`
            <div style="font-family: sans-serif; padding: 4px; color: #0f172a;">
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
  };

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

  useEffect(() => {
    if (map.current && map.current.isStyleLoaded()) {
      renderRoadLayers();
    }
  }, [roads, selectedStatusFilter]);

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

  // Render Incident Markers with Phase 2 Distinct Status Styling
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
  }, [incidents, showIncidents, verificationFilter]);

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
                    onClick={() => handleLocationSelect(loc.coords as [number, number])}
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
        <div className="absolute top-3 right-14 z-10 bg-[#e8e9ff] border border-[#d8dbff] text-[#533afd] px-3 py-1.5 rounded-[4px] text-xs flex items-center gap-1.5 shadow-xs font-medium">
          <MapPin className="w-3.5 h-3.5 animate-pulse" />
          <span>Click on map to drop incident pin</span>
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
