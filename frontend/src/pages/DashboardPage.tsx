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
  CloudRain,
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'OPEN':
        return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30';
      case 'CAUTION':
        return 'bg-amber-500/10 text-amber-400 border border-amber-500/30';
      case 'BLOCKED':
        return 'bg-rose-500/10 text-rose-400 border border-rose-500/30';
      default:
        return 'bg-purple-500/10 text-purple-400 border border-purple-500/30';
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-24 text-slate-400 gap-3">
        <Activity className="w-8 h-8 text-cyan-400 animate-spin" />
        <span className="text-sm font-medium">Synchronizing Mangaluru Weather & Inundation Telemetry...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-6 mt-8">
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm flex items-center justify-between">
          <span>{error}</span>
          <button
            onClick={() => loadData()}
            className="px-3 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl w-full mx-auto p-4 sm:p-6 flex flex-col gap-6">
      {/* Platform Banner / Data Mode Notice */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-cyan-950/40 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-950 text-cyan-400 border border-cyan-800 uppercase tracking-wider">
              {summary?.data_mode || 'SIMULATED DEMO DATA'}
            </span>
            <h2 className="text-sm font-bold text-white">Mangaluru Monsoon Inundation Intelligence</h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time open weather telemetry & citizen-reported road condition tracking.
          </p>
        </div>
        <Link
          to="/report"
          className="self-start sm:self-auto flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-sm"
        >
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>Report Road Flood</span>
        </Link>
      </div>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Incidents */}
        <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Total Reported</span>
            <HelpCircle className="w-4 h-4 text-slate-400" />
          </div>
          <div className="mt-2">
            <span className="text-3xl font-extrabold text-white tracking-tight">
              {summary?.metrics.total_incidents_reported ?? incidents.length}
            </span>
            <p className="text-[11px] text-slate-400 mt-1">
              Active across Mangaluru
            </p>
          </div>
        </div>

        {/* Active Verified */}
        <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Verified Incidents</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2">
            <span className="text-3xl font-extrabold text-emerald-400 tracking-tight">
              {summary?.metrics.active_verified_incidents ?? 0}
            </span>
            <p className="text-[11px] text-slate-400 mt-1">
              Admin & Patrol Verified
            </p>
          </div>
        </div>

        {/* Caution Roads */}
        <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Roads with Caution</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-2">
            <span className="text-3xl font-extrabold text-amber-400 tracking-tight">
              {summary?.metrics.roads_caution_count ?? 0}
            </span>
            <p className="text-[11px] text-slate-400 mt-1">
              Passable with caution
            </p>
          </div>
        </div>

        {/* Blocked Roads */}
        <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Blocked Segments</span>
            <XCircle className="w-4 h-4 text-rose-400" />
          </div>
          <div className="mt-2">
            <span className="text-3xl font-extrabold text-rose-500 tracking-tight">
              {summary?.metrics.roads_blocked_count ?? 0}
            </span>
            <p className="text-[11px] text-slate-400 mt-1">
              Impassable bottlenecks
            </p>
          </div>
        </div>
      </div>

      {/* Weather Telemetry Row (Measured Observation vs Forecast explicitly distinguished) */}
      {weather && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Current Measured Observation Box */}
          <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                <span className="font-semibold text-slate-300">Measured Weather Observation</span>
                <button
                  onClick={() => loadData(true)}
                  disabled={weatherRefreshing}
                  className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-cyan-400 border border-slate-700"
                >
                  <RefreshCw className={`w-3 h-3 ${weatherRefreshing ? 'animate-spin' : ''}`} />
                  <span>{weather.is_cached ? 'Cached' : 'Live'}</span>
                </button>
              </div>

              <div className="flex items-baseline gap-2 mt-3">
                <span className="text-4xl font-extrabold text-white">
                  {weather.current_observation.current_precipitation_rate_mm_h}
                </span>
                <span className="text-sm text-slate-400">mm / hr observed rain</span>
              </div>

              <p className="text-xs font-semibold text-cyan-300 mt-1 flex items-center gap-1.5">
                <Droplets className="w-3.5 h-3.5" />
                {weather.current_observation.observed_condition}
              </p>

              <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-slate-800/80 text-xs text-slate-300">
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase">Measured 24h Accumulation</span>
                  <span className="font-bold text-white text-base">
                    {weather.twenty_four_hour_accumulated_mm} mm
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase">Temperature</span>
                  <span className="font-bold text-white text-base">
                    {weather.current_observation.temperature_celsius}°C
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase">Humidity</span>
                  <span className="font-semibold text-white">
                    {weather.current_observation.relative_humidity_pct}%
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase">Wind Speed</span>
                  <span className="font-semibold text-white">
                    {weather.current_observation.wind_speed_kmh} km/h
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800 flex flex-col gap-1.5">
              <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[11px] font-medium flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{weather.monsoon_alert_level}</span>
              </div>
              <div className="text-[10px] text-slate-500 flex items-center justify-between">
                <span>Observed: {new Date(weather.current_observation.observation_timestamp).toLocaleTimeString()}</span>
                <span>Provenance: {weather.current_observation.source}</span>
              </div>
            </div>
          </div>

          {/* Rainfall Forecast Trend Chart (Explicitly Marked as Forecast) */}
          <div className="lg:col-span-2 p-5 rounded-2xl bg-slate-900/70 border border-slate-800 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-semibold text-slate-200">
                    Precipitation Forecast Trend (Next 12 Hours)
                  </h3>
                  <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800">
                    ECMWF Model Forecast (Not Measured)
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Precipitation rate forecast in mm/hr calibrated for Mangaluru coastal terrain
                </p>
              </div>
              <CloudRain className="w-4 h-4 text-cyan-400" />
            </div>

            <div className="h-44 w-full mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={weather.hourly_forecast} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="rainGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="forecast_time" stroke="#64748b" tick={{ fontSize: 10 }} />
                  <YAxis stroke="#64748b" tick={{ fontSize: 10 }} unit="mm" />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', fontSize: '11px' }}
                    labelStyle={{ color: '#94a3b8' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="precipitation_amount_mm"
                    name="Rainfall Forecast (mm)"
                    stroke="#06b6d4"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#rainGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="text-[10px] text-slate-500 mt-2 flex justify-between items-center">
              <span>{weather.data_provenance}</span>
              <span>Coordinates: {weather.current_observation.latitude}°N, {weather.current_observation.longitude}°E</span>
            </div>

            {/* 7-Day Precipitation Outlook */}
            {weather.daily_forecast && weather.daily_forecast.length > 0 && (
              <div className="mt-3 pt-3 border-t border-slate-800/80">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-semibold uppercase text-slate-400">7-Day Monsoon Outlook (Daily Total)</span>
                  <span className="text-[9px] text-slate-500">ECMWF / Open-Meteo Forecast</span>
                </div>
                <div className="grid grid-cols-7 gap-1 text-center">
                  {weather.daily_forecast.map((df) => (
                    <div key={df.date} className="p-1.5 rounded-lg bg-slate-950/60 border border-slate-800/60">
                      <span className="block text-[9px] text-slate-400 font-mono">
                        {df.date.split('-').slice(1).join('/')}
                      </span>
                      <span className="block text-xs font-bold text-cyan-300 mt-0.5">
                        {df.precipitation_sum_mm}
                      </span>
                      <span className="block text-[8px] text-slate-500">mm</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Mangaluru GIS Interactive Map */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-cyan-400" />
            <h3 className="font-semibold text-sm text-slate-200">
              Mangaluru Road-Level Inundation Grid
            </h3>
          </div>
          <Link
            to="/map"
            className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-medium"
          >
            <span>Full-Screen GIS Engine</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>

        <MangaluruMap
          roads={roads}
          incidents={incidents}
          selectedIncidentId={selectedIncidentId}
          onSelectIncident={(id) => setSelectedIncidentId(id)}
          heightClass="h-[460px]"
        />
      </div>

      {/* Corridors & Recent Incidents Split */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Road Corridors List */}
        <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-bold text-white">Monitored Corridors ({roads.length})</h4>
            <span className="text-xs text-slate-400">PostGIS Linestring Layer</span>
          </div>

          <div className="flex flex-col gap-2.5 max-h-[380px] overflow-y-auto pr-1">
            {roads.map((road) => (
              <div
                key={road.id}
                className="p-3 rounded-xl bg-slate-800/40 border border-slate-800 hover:border-slate-700 transition-all flex items-center justify-between gap-3"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white">{road.name}</span>
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${getStatusBadge(road.current_status)}`}>
                      {road.current_status}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-1">
                    <span>{road.ward}</span>
                    <span>•</span>
                    <span>{road.elevation_meters}m elevation</span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs font-semibold text-slate-200 block">
                    {road.current_water_depth_cm > 0 ? `${road.current_water_depth_cm} cm` : 'Dry'}
                  </span>
                  <span className="text-[9px] text-slate-500 uppercase">
                    {road.last_source}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Incidents Feed */}
        <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-bold text-white">Recent Flood Incidents ({incidents.length})</h4>
            <Link to="/report" className="text-xs text-cyan-400 hover:underline">
              Submit Report
            </Link>
          </div>

          <div className="flex flex-col gap-2.5 max-h-[380px] overflow-y-auto pr-1">
            {incidents.map((inc) => (
              <div
                key={inc.id}
                onClick={() => setSelectedIncidentId(inc.id)}
                className={`p-3 rounded-xl border transition-all cursor-pointer ${
                  selectedIncidentId === inc.id
                    ? 'bg-cyan-950/40 border-cyan-500/50'
                    : 'bg-slate-800/30 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-200">{inc.location_name}</span>
                  <span className={`text-[9px] font-semibold px-2 py-0.5 rounded-full ${
                    inc.verification_status === 'VERIFIED'
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : inc.verification_status === 'PENDING'
                      ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      : 'bg-slate-700 text-slate-300'
                  }`}>
                    {inc.verification_status}
                  </span>
                </div>
                {inc.description && (
                  <p className="text-xs text-slate-400 mt-1 line-clamp-1">{inc.description}</p>
                )}
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-800/60 text-[10px] text-slate-400">
                  <span>Depth: {inc.reported_water_depth}</span>
                  <Link
                    to={`/incidents/${inc.id}`}
                    className="text-cyan-400 hover:underline flex items-center gap-1 font-semibold"
                  >
                    <span>Details & Audit Trail</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
