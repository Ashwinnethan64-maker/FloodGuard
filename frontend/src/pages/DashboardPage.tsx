import { useEffect, useState } from 'react';
import { apiClient, type DashboardSummary } from '../services/api';
import type { RoadSegment, FloodIncident, WeatherSummary } from '../types/api';
import { MangaluruMap } from '../components/map/MangaluruMap';
import {
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Droplets,
  Layers,
  Activity,
  ArrowRight,
  ExternalLink,
  RefreshCw
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { Link } from 'react-router-dom';
import { Card, Button, Badge } from '../components/ui';

export const DashboardPage = () => {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [roads, setRoads] = useState<RoadSegment[]>([]);
  const [incidents, setIncidents] = useState<FloodIncident[]>([]);
  const [weather, setWeather] = useState<WeatherSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [weatherRefreshing, setWeatherRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>(null);

  const loadData = async (forceWeatherRefresh = false) => {
    try {
      if (forceWeatherRefresh) setWeatherRefreshing(true);
      else setLoading(true);
      setError(null);
      const [sumData, roadsData, incData, weatherData] = await Promise.all([
        apiClient.getDashboardSummary(),
        apiClient.getRoads(),
        apiClient.getIncidents(),
        apiClient.getWeather(12.9141, 74.8560, forceWeatherRefresh),
      ]);
      setSummary(sumData);
      setRoads(roadsData);
      setIncidents(incData);
      setWeather(weatherData);
    } catch (err: any) {
      setError(err.message || 'Error connecting to NEERPATH Backend API');
    } finally {
      setLoading(false);
      setWeatherRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-28 text-[#64748d] gap-3">
        <Activity className="w-7 h-7 text-[#533afd] animate-spin" />
        <span className="text-xs font-medium text-[#061b31]">
          Synchronizing Mangaluru monsoon spatial telemetry & incident records...
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="p-4 rounded-[4px] bg-[#fef2f2] border border-[#fecaca] text-[#dc2626] text-xs flex items-center justify-between">
          <span>{error}</span>
          <Button variant="danger" size="sm" onClick={() => loadData()}>
            Retry Connection
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header and Intro */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#e5edf5]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-light text-[#061b31] tracking-tight">
              Operational Inundation Dashboard
            </h1>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-[4px] bg-[#e8e9ff] text-[#533afd] border border-[#d8dbff] uppercase tracking-wider">
              {summary?.data_mode || 'SIMULATED DEMO DATA'}
            </span>
          </div>
          <p className="text-xs text-[#64748d] mt-1">
            Real-time open weather telemetry, PostGIS corridor statuses, and citizen reports across Mangaluru wards.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/report">
            <Button size="sm">
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Report Road Hazard</span>
            </Button>
          </Link>
          <Link to="/map">
            <Button variant="outline" size="sm">
              <Layers className="w-3.5 h-3.5" />
              <span>Full GIS Map</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* 4 Key Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Incidents */}
        <Card className="p-5">
          <div className="flex items-center justify-between text-xs text-[#64748d]">
            <span className="font-medium">Total Reported</span>
            <HelpCircle className="w-4 h-4 text-[#64748d]" />
          </div>
          <div className="mt-2">
            <span className="text-3xl font-light text-[#061b31] tracking-tight">
              {summary?.metrics.total_incidents_reported ?? incidents.length}
            </span>
            <p className="text-[11px] text-[#64748d] mt-1">
              Recorded in Mangaluru
            </p>
          </div>
        </Card>

        {/* Verified Incidents */}
        <Card className="p-5">
          <div className="flex items-center justify-between text-xs text-[#64748d]">
            <span className="font-medium">Verified Active</span>
            <CheckCircle2 className="w-4 h-4 text-[#059669]" />
          </div>
          <div className="mt-2">
            <span className="text-3xl font-light text-[#059669] tracking-tight">
              {summary?.metrics.active_verified_incidents ?? 0}
            </span>
            <p className="text-[11px] text-[#64748d] mt-1">
              Field Patrol & Admin Verified
            </p>
          </div>
        </Card>

        {/* Caution Roads */}
        <Card className="p-5">
          <div className="flex items-center justify-between text-xs text-[#64748d]">
            <span className="font-medium">Caution Road Links</span>
            <AlertTriangle className="w-4 h-4 text-[#d97706]" />
          </div>
          <div className="mt-2">
            <span className="text-3xl font-light text-[#d97706] tracking-tight">
              {summary?.metrics.roads_caution_count ?? 0}
            </span>
            <p className="text-[11px] text-[#64748d] mt-1">
              Passable with caution (10-30cm)
            </p>
          </div>
        </Card>

        {/* Blocked Corridors */}
        <Card className="p-5">
          <div className="flex items-center justify-between text-xs text-[#64748d]">
            <span className="font-medium">Blocked Arterials</span>
            <XCircle className="w-4 h-4 text-[#dc2626]" />
          </div>
          <div className="mt-2">
            <span className="text-3xl font-light text-[#dc2626] tracking-tight">
              {summary?.metrics.roads_blocked_count ?? 0}
            </span>
            <p className="text-[11px] text-[#64748d] mt-1">
              Inundated bottlenecks (&gt;35cm)
            </p>
          </div>
        </Card>
      </div>

      {/* Weather Telemetry Row (Measured Observation vs Forecast explicitly distinguished) */}
      {weather && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Current Measured Observation Box */}
          <Card
            className="p-5 flex flex-col justify-between"
            title="Measured Weather Observation"
            subtitle="Authoritative meteorological gauge telemetry"
            headerAction={
              <button
                onClick={() => loadData(true)}
                disabled={weatherRefreshing}
                className="flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-[4px] bg-[#f8fafd] hover:bg-[#e8e9ff] text-[#533afd] border border-[#e5edf5] transition-colors"
                title="Refresh Open-Meteo observation"
              >
                <RefreshCw className={`w-3 h-3 ${weatherRefreshing ? 'animate-spin' : ''}`} />
                <span>{weather.is_cached ? 'Cached' : 'Live'}</span>
              </button>
            }
          >
            <div>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-4xl font-light text-[#061b31]">
                  {weather.current_observation.current_precipitation_rate_mm_h}
                </span>
                <span className="text-xs text-[#64748d]">mm / hr rain</span>
              </div>

              <div className="flex items-center gap-1.5 text-xs font-semibold text-[#533afd] mt-2">
                <Droplets className="w-3.5 h-3.5" />
                <span>{weather.current_observation.observed_condition}</span>
              </div>

              <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-[#f1f5f9] text-xs">
                <div>
                  <span className="text-[#64748d] block text-[10px] uppercase tracking-wider">24h Measured Accumulation</span>
                  <span className="font-semibold text-[#061b31] text-sm">
                    {weather.twenty_four_hour_accumulated_mm} mm
                  </span>
                </div>
                <div>
                  <span className="text-[#64748d] block text-[10px] uppercase tracking-wider">Temperature</span>
                  <span className="font-semibold text-[#061b31] text-sm">
                    {weather.current_observation.temperature_celsius}°C
                  </span>
                </div>
                <div>
                  <span className="text-[#64748d] block text-[10px] uppercase tracking-wider">Relative Humidity</span>
                  <span className="font-medium text-[#061b31]">
                    {weather.current_observation.relative_humidity_pct}%
                  </span>
                </div>
                <div>
                  <span className="text-[#64748d] block text-[10px] uppercase tracking-wider">Wind Velocity</span>
                  <span className="font-medium text-[#061b31]">
                    {weather.current_observation.wind_speed_kmh} km/h
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-[#f1f5f9] space-y-2">
              <div className="p-2.5 rounded-[4px] bg-[#fffbeb] border border-[#fde68a] text-[#d97706] text-[11px] font-medium flex items-center gap-2">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                <span>{weather.monsoon_alert_level}</span>
              </div>
              <div className="text-[10px] text-[#64748d] flex items-center justify-between">
                <span>Observed: {new Date(weather.current_observation.observation_timestamp).toLocaleTimeString()}</span>
                <span>Source: {weather.current_observation.source}</span>
              </div>
            </div>
          </Card>

          {/* Rainfall Forecast Trend Chart (Explicitly Marked as Forecast) */}
          <Card
            className="lg:col-span-2 p-5 flex flex-col justify-between"
            title="Precipitation Forecast Trend (Next 12 Hours)"
            subtitle="Probabilistic rainfall projection calibrated for Mangaluru coastal terrain"
            headerAction={
              <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-[4px] bg-[#e8e9ff] text-[#533afd] border border-[#d8dbff]">
                ECMWF Model Forecast
              </span>
            }
          >
            <div className="h-44 w-full mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={weather.hourly_forecast} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="rainGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#533afd" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#533afd" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="2 2" stroke="#e5edf5" />
                  <XAxis dataKey="forecast_time" stroke="#64748d" tick={{ fontSize: 10 }} />
                  <YAxis stroke="#64748d" tick={{ fontSize: 10 }} unit="mm" />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e5edf5', borderRadius: '4px', fontSize: '11px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}
                    labelStyle={{ color: '#061b31', fontWeight: 600 }}
                  />
                  <Area
                    type="monotone"
                    dataKey="precipitation_amount_mm"
                    name="Rainfall Forecast (mm)"
                    stroke="#533afd"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#rainGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="text-[10px] text-[#64748d] mt-2 flex justify-between items-center">
              <span>{weather.data_provenance}</span>
              <span>Coordinates: {weather.current_observation.latitude}°N, {weather.current_observation.longitude}°E</span>
            </div>

            {/* 7-Day Precipitation Outlook */}
            {weather.daily_forecast && weather.daily_forecast.length > 0 && (
              <div className="mt-3 pt-3 border-t border-[#f1f5f9]">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-[#64748d]">7-Day Monsoon Outlook (Daily Total)</span>
                  <span className="text-[10px] text-[#64748d]">ECMWF / Open-Meteo Multi-Day</span>
                </div>
                <div className="grid grid-cols-7 gap-1.5 text-center">
                  {weather.daily_forecast.map((df) => (
                    <div key={df.date} className="p-2 rounded-[4px] bg-[#f8fafd] border border-[#e5edf5]">
                      <span className="block text-[10px] text-[#64748d] font-mono">
                        {df.date.split('-').slice(1).join('/')}
                      </span>
                      <span className="block text-xs font-semibold text-[#533afd] mt-0.5">
                        {df.precipitation_sum_mm}
                      </span>
                      <span className="block text-[9px] text-[#64748d]">mm</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Map Overview Section */}
      <Card
        className="p-5 space-y-3"
        title="Mangaluru Road-Level Inundation Grid"
        subtitle="Live GIS vector layer with real-time hazard markers and passability boundaries"
        headerAction={
          <Link to="/map">
            <Button variant="outline" size="sm">
              <span>Inspect GIS Engine</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Button>
          </Link>
        }
      >
        <MangaluruMap
          roads={roads}
          incidents={incidents}
          selectedIncidentId={selectedIncidentId}
          onSelectIncident={(id) => setSelectedIncidentId(id)}
          heightClass="h-[460px]"
        />
      </Card>

      {/* Corridors & Recent Incidents Split */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monitored Corridors List */}
        <Card
          className="p-5"
          title={`Monitored Corridors (${roads.length})`}
          subtitle="PostGIS linestring overlays of known bottlenecks"
          headerAction={
            <span className="text-[11px] text-[#64748d]">7 Key Hotspots</span>
          }
        >
          <div className="flex flex-col gap-2 max-h-[380px] overflow-y-auto pr-1">
            {roads.map((road) => (
              <div
                key={road.id}
                className="p-3 rounded-[4px] bg-[#f8fafd] border border-[#e5edf5] hover:border-[#cbd5e1] transition-all flex items-center justify-between gap-3"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-[#061b31]">{road.name}</span>
                    <Badge status={road.current_status as any} />
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-[#64748d] mt-1">
                    <span>{road.ward}</span>
                    <span>•</span>
                    <span>{road.elevation_meters}m elevation</span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs font-semibold text-[#061b31] block">
                    {road.current_water_depth_cm > 0 ? `${road.current_water_depth_cm} cm` : 'Dry'}
                  </span>
                  <span className="text-[10px] text-[#64748d] uppercase">
                    {road.last_source}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Recent Flood Incidents Feed */}
        <Card
          className="p-5"
          title={`Recent Hazard Reports (${incidents.length})`}
          subtitle="Citizen submissions with verification audit status"
          headerAction={
            <Link to="/report">
              <Button size="sm" variant="secondary">
                Submit Report
              </Button>
            </Link>
          }
        >
          <div className="flex flex-col gap-2 max-h-[380px] overflow-y-auto pr-1">
            {incidents.map((inc) => (
              <div
                key={inc.id}
                onClick={() => setSelectedIncidentId(inc.id)}
                className={`p-3 rounded-[4px] border transition-all cursor-pointer ${
                  selectedIncidentId === inc.id
                    ? 'bg-[#e8e9ff]/50 border-[#533afd]'
                    : 'bg-[#f8fafd] border-[#e5edf5] hover:border-[#cbd5e1]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#061b31]">{inc.location_name}</span>
                  <Badge status={inc.verification_status as any} />
                </div>
                {inc.description && (
                  <p className="text-xs text-[#64748d] mt-1 line-clamp-1">{inc.description}</p>
                )}
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-[#e5edf5] text-[10px] text-[#64748d]">
                  <span>Water Depth: {inc.reported_water_depth}</span>
                  <Link
                    to={`/incidents/${inc.id}`}
                    className="text-[#533afd] hover:underline flex items-center gap-1 font-medium"
                  >
                    <span>Inspect Dossier</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};
