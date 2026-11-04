import { useEffect, useState } from 'react';
import { apiClient } from '../services/api';
import type { RoadSegment, FloodIncident, WeatherSummary } from '../types/api';
import { MangaluruMap } from '../components/map/MangaluruMap';
import { 
  Activity, 
  MapPin, 
  Compass, 
  ArrowRight
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const InteractiveMapPage = () => {
  const [roads, setRoads] = useState<RoadSegment[]>([]);
  const [incidents, setIncidents] = useState<FloodIncident[]>([]);
  const [weather, setWeather] = useState<WeatherSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>(null);

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

  return (
    <div className="flex-1 flex flex-col p-4 sm:p-6 max-w-7xl w-full mx-auto gap-4">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold text-white">Mangaluru Interactive GIS Map</h1>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800">
              Live GeoJSON + PostGIS
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Real-time status of critical flood bottlenecks across Mangaluru urban area
          </p>
        </div>

        {weather && (
          <div className="flex items-center gap-3 bg-slate-900 border border-slate-800 px-3.5 py-1.5 rounded-xl text-xs text-slate-300">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
              {weather.current_observation.current_precipitation_rate_mm_h} mm/hr
            </span>
            <span className="text-slate-600">|</span>
            <span className="text-amber-400 font-medium">{weather.monsoon_alert_level.split('-')[0]}</span>
          </div>
        )}
      </div>

      {/* Main Map + Side Details Split */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 flex-1">
        <div className="lg:col-span-3 flex flex-col">
          {loading ? (
            <div className="h-[600px] w-full rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 gap-2">
              <Activity className="w-6 h-6 animate-spin text-cyan-400" />
              <span className="text-xs">Loading Mangaluru GIS Network...</span>
            </div>
          ) : (
            <MangaluruMap
              roads={roads}
              incidents={incidents}
              selectedIncidentId={selectedIncidentId}
              onSelectIncident={(id) => setSelectedIncidentId(id)}
              heightClass="h-[620px]"
            />
          )}
        </div>

        {/* Side Panel: Selected Corridor / Incident Inspector */}
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3 pb-3 border-b border-slate-800">
              <Compass className="w-4 h-4 text-cyan-400" />
              <h2 className="text-xs font-bold text-white uppercase tracking-wider">
                Corridor Inspector
              </h2>
            </div>

            {selectedIncident ? (
              <div className="flex flex-col gap-3">
                <div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    selectedIncident.verification_status === 'VERIFIED'
                      ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                      : 'bg-purple-500/10 text-purple-400 border border-purple-500/30'
                  }`}>
                    {selectedIncident.verification_status}
                  </span>
                  <h3 className="text-sm font-bold text-white mt-2">
                    {selectedIncident.location_name}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    {selectedIncident.description || 'No description provided.'}
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-800 text-xs flex flex-col gap-2">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Water Depth:</span>
                    <span className="font-semibold text-cyan-300">{selectedIncident.reported_water_depth}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">2-Wheeler Access:</span>
                    <span className={selectedIncident.passable_two_wheelers ? 'text-emerald-400' : 'text-rose-400'}>
                      {selectedIncident.passable_two_wheelers ? 'Passable' : 'Blocked'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">4-Wheeler Access:</span>
                    <span className={selectedIncident.passable_four_wheelers ? 'text-emerald-400' : 'text-rose-400'}>
                      {selectedIncident.passable_four_wheelers ? 'Passable' : 'Blocked'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Source:</span>
                    <span className="text-slate-300 font-mono text-[10px]">{selectedIncident.source}</span>
                  </div>
                </div>

                <Link
                  to={`/incidents/${selectedIncident.id}`}
                  className="mt-2 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold"
                >
                  <span>View Full Incident Report</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            ) : (
              <div className="text-center py-12 text-slate-500 flex flex-col items-center gap-2">
                <MapPin className="w-8 h-8 text-slate-700" />
                <p className="text-xs">Click any road corridor or incident pin on the map to inspect live conditions.</p>
              </div>
            )}
          </div>

          <div className="mt-4 pt-4 border-t border-slate-800/80 text-[11px] text-slate-500">
            Mangaluru GIS Boundary: 12.85°N to 12.98°N, 74.80°E to 74.92°E
          </div>
        </div>
      </div>
    </div>
  );
};
