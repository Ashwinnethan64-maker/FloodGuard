import { useEffect, useState, useCallback } from 'react';
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
import { Card, Button, Badge } from '../components/ui';

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

  const handleCalculateRoute = useCallback(async () => {
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
  }, [originCoords, destCoords, originName, destName, profile]);

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
  }, [handleCalculateRoute]);

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

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 pb-4 border-b border-[#e5edf5]">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-lg sm:text-xl font-light text-[#061b31] tracking-tight">
              Flood-Aware Alternative Route Engine
            </h1>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-sm bg-[#e8e9ff] text-[#533afd] border border-[#d8dbff] uppercase tracking-wider shrink-0">
              Dijkstra + Inundation Cost
            </span>
          </div>
          <p className="text-xs text-[#64748d] mt-1 leading-relaxed">
            Dynamic transit path evaluation: excludes verified blocked corridors and heavily penalizes low-elevation waterlogged segments.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-white border border-[#e5edf5] px-3 py-1.5 rounded-sm text-xs text-[#061b31] self-start sm:self-auto shrink-0">
          <span className="w-2 h-2 rounded-full bg-[#059669] animate-pulse"></span>
          <span className="text-[#50617a]">PostGIS Geometric Exclusion</span>
        </div>
      </div>

      {/* Safety Notice */}
      <div className="p-4 rounded-sm bg-[#fffbeb] border border-[#fde68a] text-xs text-[#92400e] flex items-start gap-3">
        <AlertTriangle className="w-4 h-4 text-[#d97706] shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <strong className="text-[#78350f]">Transit Safety Advisory:</strong> Recommended routes reflect empirical depth sensors and citizen incident reports. <span className="font-semibold underline">Safety cannot be unconditionally guaranteed.</span> Never attempt to drive through fast-moving runoff or submerged dips.
        </div>
      </div>

      {/* Origin / Destination Input Bar */}
      <Card className="p-4 sm:p-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 items-end">
          <div>
            <label className="text-[11px] font-medium text-[#061b31] uppercase tracking-wider block mb-1.5">
              Origin Corridor
            </label>
            <select
              value={originName}
              onChange={(e) => handleOriginChange(e.target.value)}
              className="w-full bg-white border border-[#e5edf5] rounded-sm px-3 py-2 text-xs text-[#061b31] focus:outline-none focus:border-[#533afd]"
            >
              {locations.map(l => (
                <option key={`origin-${l.name}`} value={l.name}>{l.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[11px] font-medium text-[#061b31] uppercase tracking-wider block mb-1.5">
              Destination Corridor
            </label>
            <select
              value={destName}
              onChange={(e) => handleDestChange(e.target.value)}
              className="w-full bg-white border border-[#e5edf5] rounded-sm px-3 py-2 text-xs text-[#061b31] focus:outline-none focus:border-[#533afd]"
            >
              {locations.map(l => (
                <option key={`dest-${l.name}`} value={l.name}>{l.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[11px] font-medium text-[#061b31] uppercase tracking-wider block mb-1.5">
              Vehicle Profile
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setProfile('driving-car')}
                className={`py-2 px-2.5 rounded-sm border text-xs font-medium flex items-center justify-center gap-1.5 transition-colors touch-manipulation ${
                  profile === 'driving-car'
                    ? 'bg-[#533afd] text-white border-[#533afd]'
                    : 'bg-[#f8fafd] text-[#50617a] border-[#e5edf5] hover:bg-[#e8e9ff]'
                }`}
              >
                <Car className="w-3.5 h-3.5" />
                <span>Driving</span>
              </button>
              <button
                type="button"
                onClick={() => setProfile('foot-walking')}
                className={`py-2 px-2.5 rounded-sm border text-xs font-medium flex items-center justify-center gap-1.5 transition-colors touch-manipulation ${
                  profile === 'foot-walking'
                    ? 'bg-[#533afd] text-white border-[#533afd]'
                    : 'bg-[#f8fafd] text-[#50617a] border-[#e5edf5] hover:bg-[#e8e9ff]'
                }`}
              >
                <Footprints className="w-3.5 h-3.5" />
                <span>Walking</span>
              </button>
            </div>
          </div>

          <Button
            onClick={handleCalculateRoute}
            disabled={loading}
            size="md"
            className="w-full justify-center py-2.5"
          >
            <Navigation className="w-3.5 h-3.5" />
            <span>{loading ? 'Evaluating...' : 'Calculate Safe Routes'}</span>
          </Button>
        </div>
      </Card>

      {/* Main Routing Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Route Alternatives List */}
        <Card
          className="p-5 flex flex-col gap-3"
          title={`Route Alternatives (${routePlan?.routes.length || 0})`}
          subtitle="Ranked dynamically by composite flood risk"
        >
          {loading ? (
            <div className="py-16 flex justify-center text-[#64748d]">
              <Activity className="w-6 h-6 animate-spin text-[#533afd]" />
            </div>
          ) : routePlan?.no_viable_route_found ? (
            <div className="p-4 rounded-sm bg-[#fef2f2] border border-[#fecaca] text-[#dc2626] text-xs text-center flex flex-col items-center gap-2">
              <XCircle className="w-7 h-7 text-[#dc2626]" />
              <span className="font-semibold">No sufficiently reliable corridor exists.</span>
              <p className="text-[11px] text-[#64748d]">
                All candidate corridors traverse confirmed blocked flood underpasses. Commuters are advised to shelter in place until waters recede.
              </p>
            </div>
          ) : (
            routePlan?.routes.map((r) => (
              <div
                key={r.route_id}
                onClick={() => setSelectedRoute(r)}
                className={`p-3.5 rounded-sm border transition-all cursor-pointer flex flex-col gap-2 ${
                  selectedRoute?.route_id === r.route_id
                    ? 'bg-[#e8e9ff]/50 border-[#533afd]'
                    : 'bg-[#f8fafd] border-[#e5edf5] hover:border-[#cbd5e1]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-sm bg-[#e5edf5] text-[#061b31] font-semibold text-[10px] flex items-center justify-center">
                      #{r.rank}
                    </span>
                    <span className="text-xs font-semibold text-[#061b31] line-clamp-1">{r.label}</span>
                  </div>
                  <Badge status={r.risk_tier as any}>
                    {r.risk_tier}
                  </Badge>
                </div>

                <div className="flex items-center gap-4 text-xs text-[#50617a]">
                  <div className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-[#64748d]" />
                    <span>{r.distance_km} km</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-[#64748d]" />
                    <span>~{r.estimated_duration_minutes} mins</span>
                  </div>
                </div>

                <p className="text-[11px] text-[#64748d] line-clamp-2 leading-relaxed">
                  {r.summary_explanation}
                </p>

                {r.contains_blocked_segment && (
                  <div className="text-[10px] text-[#dc2626] font-semibold flex items-center gap-1">
                    <XCircle className="w-3 h-3" />
                    <span>Contains Verified Blocked Road</span>
                  </div>
                )}
              </div>
            ))
          )}
        </Card>

        {/* Selected Route Inspection Dossier & Trajectory Details */}
        <div className="lg:col-span-2">
          {selectedRoute && (
            <Card
              className="p-6 flex flex-col gap-4"
              title={selectedRoute.label}
              subtitle={`${originName} → ${destName}`}
              headerAction={
                <div className="flex items-center gap-3 sm:gap-4 text-xs font-semibold text-[#061b31]">
                  <div className="text-left sm:text-right">
                    <span className="text-[10px] text-[#64748d] block uppercase tracking-wider">Distance</span>
                    <span className="text-sm text-[#533afd]">{selectedRoute.distance_km} km</span>
                  </div>
                  <div className="text-left sm:text-right">
                    <span className="text-[10px] text-[#64748d] block uppercase tracking-wider">Est. Transit</span>
                    <span className="text-sm">{selectedRoute.estimated_duration_minutes} mins</span>
                  </div>
                </div>
              }
            >
              <div className="flex items-center gap-2">
                <Badge status={selectedRoute.risk_tier as any}>
                  {selectedRoute.risk_tier} RISK
                </Badge>
                <span className="text-xs text-[#64748d] font-mono">
                  Risk Index: {(selectedRoute.composite_flood_risk_score * 100).toFixed(0)}/100
                </span>
              </div>

              {/* Traversed Segments Condition Matrix */}
              <div>
                <h4 className="text-xs font-semibold text-[#061b31] uppercase tracking-wider mb-2">
                  Traversed Road Segments & Hazard Penalties
                </h4>

                <div className="flex flex-col gap-2">
                  {selectedRoute.evaluated_segments.map(seg => (
                    <div
                      key={seg.segment_id}
                      className="p-3 rounded-sm bg-[#f8fafd] border border-[#e5edf5] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-[#061b31]">{seg.road_name}</span>
                          <Badge status={seg.status as any} />
                        </div>
                        {seg.warning_message && (
                          <p className="text-[11px] text-[#d97706] mt-1 font-medium">
                            ⚠️ {seg.warning_message}
                          </p>
                        )}
                      </div>

                      <div className="text-right sm:text-right shrink-0">
                        <span className="text-[#64748d] text-[11px] block">
                          Water: <strong className="text-[#061b31]">{seg.water_depth_cm} cm</strong>
                        </span>
                        <span className="text-[10px] text-[#64748d]">
                          Penalty factor: {seg.penalty_multiplier}x
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Route Explanation Rationale */}
              <div className="p-3.5 rounded-sm bg-[#f8fafd] border border-[#e5edf5] text-xs">
                <span className="font-semibold text-[#533afd] block mb-1">Route Engine Decision Rationale:</span>
                <p className="text-[#50617a] leading-relaxed text-[11px]">
                  {selectedRoute.summary_explanation}
                </p>
              </div>

              <div className="text-[10px] text-[#64748d] italic">
                {selectedRoute.safety_disclaimer}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};
