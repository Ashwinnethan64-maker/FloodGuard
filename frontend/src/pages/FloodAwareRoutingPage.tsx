import { useEffect, useState } from 'react';
import { routingApiClient } from '../services/api';
import type { RoutePlanResponse, EvaluatedRoute } from '../types/api';
import { 
  Navigation, 
  Clock, 
  MapPin, 
  AlertTriangle, 
  XCircle, 
  Car, 
  Footprints,
  Activity
} from 'lucide-react';

export const FloodAwareRoutingPage = () => {
  const [locations, setLocations] = useState<{ name: string; coordinates: [number, number] }[]>([]);
  const [originName, setOriginName] = useState('Kottara Chowki Junction');
  const [originCoords, setOriginCoords] = useState<[number, number]>([74.8445, 12.9050]);
  const [destName, setDestName] = useState('Pumpwell Circle (Mahaveera)');
  const [destCoords, setDestCoords] = useState<[number, number]>([74.8695, 12.8625]);
  const [profile, setProfile] = useState<'driving-car' | 'foot-walking'>('driving-car');

  const [routePlan, setRoutePlan] = useState<RoutePlanResponse | null>(null);
  const [selectedRoute, setSelectedRoute] = useState<EvaluatedRoute | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadPresets() {
      try {
        const data = await routingApiClient.getPresets();
        setLocations(data.locations);
      } catch (err) {
        console.error(err);
      }
    }
    loadPresets();
    handleCalculateRoute();
  }, []);

  const handleCalculateRoute = async () => {
    try {
      setLoading(true);
      const res = await routingApiClient.planRoute(
        originCoords[1],
        originCoords[0],
        destCoords[1],
        destCoords[0],
        originName,
        destName,
        profile
      );
      setRoutePlan(res);
      if (res.routes.length > 0) {
        setSelectedRoute(res.routes[0]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOriginChange = (locName: string) => {
    const found = locations.find(l => l.name === locName);
    if (found) {
      setOriginName(found.name);
      setOriginCoords(found.coordinates);
    }
  };

  const handleDestChange = (locName: string) => {
    const found = locations.find(l => l.name === locName);
    if (found) {
      setDestName(found.name);
      setDestCoords(found.coordinates);
    }
  };

  const getRiskBadge = (tier: string) => {
    switch (tier) {
      case 'LOW':
        return 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30';
      case 'MODERATE':
        return 'bg-amber-500/15 text-amber-400 border border-amber-500/30';
      case 'HIGH':
        return 'bg-orange-500/15 text-orange-400 border border-orange-500/30';
      case 'IMPASSABLE':
        return 'bg-rose-500/15 text-rose-400 border border-rose-500/30';
      default:
        return 'bg-slate-700 text-slate-400';
    }
  };

  return (
    <div className="max-w-7xl w-full mx-auto p-4 sm:p-6 flex flex-col gap-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-cyan-950 border border-cyan-800 flex items-center justify-center text-cyan-400">
              <Navigation className="w-4 h-4" />
            </div>
            <h1 className="text-xl font-bold text-white">Flood-Aware Route Recommendation Engine</h1>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Dynamic transit path evaluation: excludes verified blocked corridors and penalizes high-risk flood zones
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl text-xs text-slate-300">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>OpenRouteService & PostGIS Inundation Geometry</span>
        </div>
      </div>

      {/* Safety Notice */}
      <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200 flex items-start gap-3">
        <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <strong className="text-amber-300">Prominent Transit Safety Disclaimer:</strong> Alternative routes are recommendations calculated based on reported ground water levels and Open-Meteo rainfall. <span className="underline font-bold">Safety is never guaranteed.</span> Never attempt to drive or walk through flooded underpasses or fast-moving runoff.
        </div>
      </div>

      {/* Origin / Destination Input Bar */}
      <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
        <div>
          <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
            Origin Location
          </label>
          <select
            value={originName}
            onChange={(e) => handleOriginChange(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
          >
            {locations.map(l => (
              <option key={`origin-${l.name}`} value={l.name}>{l.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
            Destination Location
          </label>
          <select
            value={destName}
            onChange={(e) => handleDestChange(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
          >
            {locations.map(l => (
              <option key={`dest-${l.name}`} value={l.name}>{l.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
            Transit Profile
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setProfile('driving-car')}
              className={`py-2 px-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                profile === 'driving-car'
                  ? 'bg-cyan-600 text-white border-cyan-500'
                  : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
              }`}
            >
              <Car className="w-3.5 h-3.5" />
              <span>Driving</span>
            </button>
            <button
              type="button"
              onClick={() => setProfile('foot-walking')}
              className={`py-2 px-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                profile === 'foot-walking'
                  ? 'bg-cyan-600 text-white border-cyan-500'
                  : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
              }`}
            >
              <Footprints className="w-3.5 h-3.5" />
              <span>Walking</span>
            </button>
          </div>
        </div>

        <button
          onClick={handleCalculateRoute}
          disabled={loading}
          className="py-2.5 px-4 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition-all shadow-lg shadow-cyan-900/30 flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <Navigation className="w-4 h-4" />
          <span>{loading ? 'Evaluating Corridors...' : 'Calculate Safe Routes'}</span>
        </button>
      </div>

      {/* Main Routing Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Route Alternatives List */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col gap-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Route Alternatives ({routePlan?.routes.length || 0})
            </h3>
            <span className="text-[10px] text-slate-400">Ranked by Flood Risk</span>
          </div>

          {loading ? (
            <div className="py-12 flex justify-center text-slate-400">
              <Activity className="w-6 h-6 animate-spin text-cyan-400" />
            </div>
          ) : routePlan?.no_viable_route_found ? (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs text-center flex flex-col items-center gap-2">
              <XCircle className="w-8 h-8 text-rose-400" />
              <span className="font-bold">No sufficiently reliable route exists.</span>
              <p className="text-[11px] text-slate-400">
                All candidate corridors traverse confirmed blocked flood underpasses. Commuters are advised to shelter in place until waters recede.
              </p>
            </div>
          ) : (
            routePlan?.routes.map((r) => (
              <div
                key={r.route_id}
                onClick={() => setSelectedRoute(r)}
                className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col gap-2.5 ${
                  selectedRoute?.route_id === r.route_id
                    ? 'bg-cyan-950/40 border-cyan-500/70 shadow-lg shadow-cyan-950/40'
                    : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-slate-800 text-cyan-300 font-bold text-[10px] flex items-center justify-center">
                      #{r.rank}
                    </span>
                    <span className="text-xs font-bold text-white line-clamp-1">{r.label}</span>
                  </div>
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${getRiskBadge(r.risk_tier)}`}>
                    {r.risk_tier}
                  </span>
                </div>

                <div className="flex items-center gap-4 text-xs text-slate-300">
                  <div className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-500" />
                    <span>{r.distance_km} km</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                    <span>~{r.estimated_duration_minutes} mins</span>
                  </div>
                </div>

                <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                  {r.summary_explanation}
                </p>

                {r.contains_blocked_segment && (
                  <div className="text-[10px] text-rose-400 font-semibold flex items-center gap-1">
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Contains Verified Blocked Road</span>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Selected Route Inspection Dossier & Trajectory Details */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          {selectedRoute && (
            <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${getRiskBadge(selectedRoute.risk_tier)}`}>
                      {selectedRoute.risk_tier} RISK
                    </span>
                    <span className="text-xs text-slate-400 font-mono">
                      Risk Index: {(selectedRoute.composite_flood_risk_score * 100).toFixed(0)}/100
                    </span>
                  </div>
                  <h2 className="text-base font-bold text-white mt-1">{selectedRoute.label}</h2>
                  <p className="text-xs text-slate-400">{originName} → {destName}</p>
                </div>

                <div className="flex items-center gap-4 text-xs font-bold text-slate-200">
                  <div className="text-right">
                    <span className="text-[10px] text-slate-500 block uppercase">Distance</span>
                    <span className="text-base text-cyan-400">{selectedRoute.distance_km} km</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-500 block uppercase">Est. Travel Time</span>
                    <span className="text-base text-white">{selectedRoute.estimated_duration_minutes} mins</span>
                  </div>
                </div>
              </div>

              {/* Traversed Segments Condition Matrix */}
              <div>
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  Traversed Road Segments & Flood Hazard Warnings
                </h4>

                <div className="flex flex-col gap-2">
                  {selectedRoute.evaluated_segments.map(seg => (
                    <div
                      key={seg.segment_id}
                      className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-white">{seg.road_name}</span>
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                            seg.status === 'BLOCKED' ? 'bg-rose-500/20 text-rose-400' :
                            seg.status === 'CAUTION' ? 'bg-amber-500/20 text-amber-400' :
                            seg.status === 'UNVERIFIED' ? 'bg-purple-500/20 text-purple-400' :
                            'bg-emerald-500/20 text-emerald-400'
                          }`}>
                            {seg.status}
                          </span>
                        </div>
                        {seg.warning_message && (
                          <p className="text-[11px] text-amber-400/90 mt-1 font-medium">
                            ⚠️ {seg.warning_message}
                          </p>
                        )}
                      </div>

                      <div className="text-right sm:text-right shrink-0">
                        <span className="text-slate-400 text-[11px] block">
                          Water: <strong className="text-white">{seg.water_depth_cm} cm</strong>
                        </span>
                        <span className="text-[10px] text-slate-500">
                          Penalty factor: {seg.penalty_multiplier}x
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Route Explanation Rationale */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 text-xs">
                <span className="font-bold text-cyan-300 block mb-1">Route Engine Decision Rationale:</span>
                <p className="text-slate-300 leading-relaxed text-[11px]">
                  {selectedRoute.summary_explanation}
                </p>
              </div>

              <div className="text-[10px] text-slate-500 italic">
                {selectedRoute.safety_disclaimer}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
