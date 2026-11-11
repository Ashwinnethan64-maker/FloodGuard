import { useEffect, useState } from 'react';
import { apiClient } from '../services/api';
import type { RoadSegment, FloodIncident, WeatherSummary, RoadStatus } from '../types/api';
import { MangaluruMap } from '../components/map/MangaluruMap';
import { 
  Activity, 
  MapPin, 
  ArrowRight,
  Filter
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card, Button, Badge } from '../components/ui';

export const InteractiveMapPage = () => {
  const [roads, setRoads] = useState<RoadSegment[]>([]);
  const [incidents, setIncidents] = useState<FloodIncident[]>([]);
  const [weather, setWeather] = useState<WeatherSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<RoadStatus | 'ALL'>('ALL');

  useEffect(() => {
    async function fetchMapData() {
      try {
        setLoading(true);
        const [rData, iData, wData] = await Promise.all([
          apiClient.getRoads(),
          apiClient.getIncidents(),
          apiClient.getWeather(),
        ]);
        setRoads(rData);
        setIncidents(iData);
        setWeather(wData);
      } catch (err) {
        console.error('Failed to load map data', err);
      } finally {
        setLoading(false);
      }
    }
    fetchMapData();
  }, []);

  const selectedIncident = incidents.find(i => i.id === selectedIncidentId);

  const filteredRoads = statusFilter === 'ALL'
    ? roads
    : roads.filter(r => r.current_status === statusFilter);

  return (
    <div className="space-y-6">
      {/* Top Map Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#e5edf5]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-light text-[#061b31] tracking-tight">
              Mangaluru Interactive GIS Map
            </h1>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-sm bg-[#e8e9ff] text-[#533afd] border border-[#d8dbff] uppercase tracking-wider">
              PostGIS Linestring Layer
            </span>
          </div>
          <p className="text-xs text-[#64748d] mt-1">
            Real-time status of critical flood bottlenecks across Mangaluru urban area
          </p>
        </div>

        {weather && (
          <div className="flex items-center gap-3 bg-white border border-[#e5edf5] px-3 py-1.5 rounded-sm text-xs text-[#061b31]">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#059669] animate-pulse"></span>
              <span className="font-semibold">{weather.current_observation.current_precipitation_rate_mm_h} mm/hr</span>
            </span>
            <span className="text-[#e5edf5]">|</span>
            <span className="text-[#d97706] font-medium">{weather.monsoon_alert_level.split('-')[0]}</span>
          </div>
        )}
      </div>

      {/* Filter Toolbar & Legend Bar */}
      <div className="bg-white border border-[#e5edf5] rounded-sm p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Left: Map Engine Indicator */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-sm bg-[#ecfdf5] border border-[#a7f3d0] text-[#059669] font-medium">
            <span className="w-2 h-2 rounded-full bg-[#059669] animate-pulse" />
            <span>Leaflet + OpenStreetMap GIS</span>
          </div>
        </div>

        {/* Middle: Corridor Filter */}
        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-[#64748d]" />
          <span className="font-medium text-[#50617a]">Filter Corridors:</span>
          {(['ALL', 'OPEN', 'CAUTION', 'BLOCKED'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-2.5 py-1 rounded-sm text-xs font-medium border transition-colors ${
                statusFilter === st
                  ? 'bg-[#533afd] text-white border-[#533afd]'
                  : 'bg-[#f8fafd] text-[#50617a] border-[#e5edf5] hover:bg-[#e8e9ff]'
              }`}
            >
              {st === 'ALL' ? 'All Corridors' : st}
            </button>
          ))}
        </div>

        {/* Clear Legend */}
        <div className="flex items-center gap-4 text-[11px] text-[#64748d]">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-[2px] bg-[#059669]" />
            <span>Passable (Dry)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-[2px] bg-[#d97706]" />
            <span>Caution (Waterlogged)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-[2px] bg-[#dc2626]" />
            <span>Submerged (Inundated)</span>
          </div>
        </div>
      </div>

      {/* Main Map + Side Details Split */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          {loading ? (
            <div className="h-[600px] w-full rounded-sm bg-white border border-[#e5edf5] flex items-center justify-center text-[#64748d] gap-2">
              <Activity className="w-6 h-6 animate-spin text-[#533afd]" />
              <span className="text-xs">Loading Mangaluru GIS Network Layers...</span>
            </div>
          ) : (
            <div className="bg-white border border-[#e5edf5] rounded-sm overflow-hidden p-1">
              <MangaluruMap
                roads={filteredRoads}
                incidents={incidents}
                selectedIncidentId={selectedIncidentId}
                onSelectIncident={(id) => setSelectedIncidentId(id)}
                heightClass="h-[620px]"
              />
            </div>
          )}
        </div>

        {/* Side Panel: Corridor Inspector */}
        <Card
          className="p-5 flex flex-col justify-between"
          title="Corridor Inspector"
          subtitle="Point-and-click segment analysis"
        >
          <div>
            {selectedIncident ? (
              <div className="space-y-4">
                <div>
                  <Badge status={selectedIncident.verification_status as any} />
                  <h3 className="text-sm font-semibold text-[#061b31] mt-2">
                    {selectedIncident.location_name}
                  </h3>
                  <p className="text-xs text-[#64748d] mt-1 leading-relaxed">
                    {selectedIncident.description || 'No description provided for this incident.'}
                  </p>
                </div>

                <div className="p-3 rounded-sm bg-[#f8fafd] border border-[#e5edf5] text-xs space-y-2">
                  <div className="flex justify-between">
                    <span className="text-[#64748d]">Reported Depth:</span>
                    <span className="font-semibold text-[#061b31]">{selectedIncident.reported_water_depth}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#64748d]">Two-Wheeler Access:</span>
                    <span className={selectedIncident.passable_two_wheelers ? 'text-[#059669] font-medium' : 'text-[#dc2626] font-medium'}>
                      {selectedIncident.passable_two_wheelers ? 'Passable' : 'Blocked'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#64748d]">Four-Wheeler Access:</span>
                    <span className={selectedIncident.passable_four_wheelers ? 'text-[#059669] font-medium' : 'text-[#dc2626] font-medium'}>
                      {selectedIncident.passable_four_wheelers ? 'Passable' : 'Blocked'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#64748d]">Data Source:</span>
                    <span className="text-[#061b31] font-mono text-[10px]">{selectedIncident.source}</span>
                  </div>
                </div>

                <Link to={`/incidents/${selectedIncident.id}`}>
                  <Button size="sm" className="w-full justify-center">
                    <span>Inspect Full Incident Dossier</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="text-center py-16 text-[#64748d] space-y-2">
                <MapPin className="w-8 h-8 text-[#94a3b8] mx-auto" />
                <p className="text-xs">
                  Click any road corridor line or incident marker on the map to inspect live observations and clearance directives.
                </p>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-[#f1f5f9] text-[11px] text-[#64748d] space-y-1">
            <div>Spatial Bounding Box: Mangaluru Urban</div>
            <div className="font-mono text-[10px] text-[#50617a]">12.85°N – 12.98°N, 74.80°E – 74.92°E</div>
          </div>
        </Card>
      </div>
    </div>
  );
};
