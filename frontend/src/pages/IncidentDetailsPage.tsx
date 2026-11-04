import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { apiClient } from '../services/api';
import type { FloodIncident, RoadSegment } from '../types/api';
import { 
  ArrowLeft, 
  Activity,
  History,
  Copy
} from 'lucide-react';

export const IncidentDetailsPage = () => {
  const { id } = useParams<{ id: string }>();
  const [incident, setIncident] = useState<FloodIncident | null>(null);
  const [road, setRoad] = useState<RoadSegment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadIncident() {
      if (!id) return;
      try {
        setLoading(true);
        const data = await apiClient.getIncidentById(id);
        setIncident(data);
        if (data.road_segment_id) {
          try {
            const roadData = await apiClient.getRoadById(data.road_segment_id);
            setRoad(roadData);
          } catch {
            // Associated road not found
          }
        }
      } catch (err: any) {
        setError(err.message || 'Failed to fetch incident');
      } finally {
        setLoading(false);
      }
    }
    loadIncident();
  }, [id]);

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-24 text-slate-400 gap-2">
        <Activity className="w-8 h-8 animate-spin text-cyan-400" />
        <span className="text-xs">Loading incident dossier...</span>
      </div>
    );
  }

  if (error || !incident) {
    return (
      <div className="max-w-xl mx-auto p-6 mt-12 text-center">
        <div className="p-6 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm">
          {error || 'Incident not found'}
        </div>
        <Link to="/dashboard" className="mt-4 inline-block text-xs text-cyan-400 hover:underline">
          Return to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl w-full mx-auto p-4 sm:p-6 flex flex-col gap-6">
      <Link
        to="/dashboard"
        className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-cyan-400 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Dashboard</span>
      </Link>

      <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                incident.verification_status === 'VERIFIED'
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                  : incident.verification_status === 'PENDING'
                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                  : 'bg-slate-700 text-slate-300'
              }`}>
                {incident.verification_status} INCIDENT
              </span>
              <span className="text-xs text-slate-400">ID: {incident.id}</span>
            </div>
            <h1 className="text-xl font-bold text-white mt-1.5">{incident.location_name}</h1>
            <span className="text-xs text-cyan-400 font-semibold mt-1 block">
              Category: {incident.incident_category}
            </span>
          </div>

          <div className="text-right sm:text-right">
            <span className="text-xs text-slate-400 block">Report Provenance</span>
            <span className="text-xs font-mono font-semibold text-cyan-400 uppercase">
              {incident.source}
            </span>
            <span className="text-[11px] text-slate-500 block mt-0.5">
              Reporter: {incident.reporter_name || 'Anonymous Commuter'}
            </span>
          </div>
        </div>

        {/* Submitted Photograph Preview */}
        {incident.image_url && (
          <div className="w-full max-h-80 rounded-xl overflow-hidden border border-slate-800 bg-black flex items-center justify-center">
            <img
              src={incident.image_url}
              alt="Submitted flood photograph"
              className="max-h-80 w-auto object-contain"
            />
          </div>
        )}

        {/* Key Indicators */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-[10px] text-slate-500 uppercase block">Water Depth</span>
            <span className="text-sm font-bold text-white mt-1 block">
              {incident.reported_water_depth}
            </span>
            <span className="text-[10px] text-cyan-400">~{incident.estimated_depth_cm || 20} cm</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-[10px] text-slate-500 uppercase block">Two-Wheelers</span>
            <span className={`text-sm font-bold mt-1 block ${
              incident.passable_two_wheelers ? 'text-emerald-400' : 'text-rose-400'
            }`}>
              {incident.passable_two_wheelers ? 'Passable' : 'Impassable'}
            </span>
            <span className="text-[10px] text-slate-400">Bikes & Scooters</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-[10px] text-slate-500 uppercase block">Four-Wheelers</span>
            <span className={`text-sm font-bold mt-1 block ${
              incident.passable_four_wheelers ? 'text-emerald-400' : 'text-rose-400'
            }`}>
              {incident.passable_four_wheelers ? 'Passable' : 'Impassable'}
            </span>
            <span className="text-[10px] text-slate-400">Cars & Sedans</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-[10px] text-slate-500 uppercase block">Emergency Access</span>
            <span className={`text-sm font-bold mt-1 block ${
              incident.passable_emergency_vehicles ? 'text-emerald-400' : 'text-rose-400'
            }`}>
              {incident.passable_emergency_vehicles ? 'Passable' : 'Blocked'}
            </span>
            <span className="text-[10px] text-slate-400">Ambulance & Fire</span>
          </div>
        </div>

        {/* Potential Duplicates Section */}
        {incident.potential_duplicates && incident.potential_duplicates.length > 0 && (
          <div className="p-4 rounded-xl bg-indigo-950/30 border border-indigo-800/60">
            <div className="flex items-center gap-2 text-indigo-300 text-xs font-bold mb-2">
              <Copy className="w-4 h-4" />
              <span>Duplicate Detection Candidates ({incident.potential_duplicates.length})</span>
            </div>
            <div className="flex flex-col gap-2">
              {incident.potential_duplicates.map(dup => (
                <div key={dup.incident_id} className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800 text-xs flex justify-between items-center">
                  <div>
                    <span className="font-semibold text-slate-200">{dup.location_name}</span>
                    <span className="text-slate-500 ml-2 text-[11px]">({dup.reason})</span>
                  </div>
                  <Link to={`/incidents/${dup.incident_id}`} className="text-cyan-400 hover:underline text-[11px]">
                    Compare Dossier
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Verification History / Audit Trail */}
        {incident.verification_history && incident.verification_history.length > 0 && (
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
            <div className="flex items-center gap-2 text-slate-300 text-xs font-bold mb-3">
              <History className="w-4 h-4 text-cyan-400" />
              <span>Verification Audit Trail</span>
            </div>
            <div className="flex flex-col gap-2">
              {incident.verification_history.map(log => (
                <div key={log.id} className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-xs flex flex-col gap-1">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-emerald-400">{log.action}</span>
                    <span className="text-slate-500 text-[10px]">
                      {new Date(log.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <div className="text-slate-300">By: {log.verified_by_user}</div>
                  {log.notes && <div className="text-slate-400 italic">Notes: "{log.notes}"</div>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Description */}
        <div>
          <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
            Incident Description & Commuter Notes
          </h3>
          <p className="text-xs sm:text-sm text-slate-300 bg-slate-950 p-4 rounded-xl border border-slate-800 leading-relaxed">
            {incident.description || 'No detailed citizen notes provided.'}
          </p>
        </div>

        {/* Spatial Metadata */}
        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col gap-2 text-xs">
          <div className="flex justify-between text-slate-400">
            <span>WGS84 Coordinates:</span>
            <span className="font-mono text-slate-200">
              {incident.geometry.coordinates[1].toFixed(5)}° N, {incident.geometry.coordinates[0].toFixed(5)}° E
            </span>
          </div>
          <div className="flex justify-between text-slate-400">
            <span>Observed Time:</span>
            <span className="text-slate-200">
              {new Date(incident.observed_time).toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between text-slate-400">
            <span>Submission Timestamp:</span>
            <span className="text-slate-200">
              {new Date(incident.created_at).toLocaleString()}
            </span>
          </div>
        </div>

        {/* Road Association */}
        {road && (
          <div className="p-4 rounded-xl bg-cyan-950/20 border border-cyan-800/50 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-cyan-400 uppercase tracking-wider block font-bold">
                Associated Monitored Corridor
              </span>
              <h4 className="text-sm font-bold text-white mt-0.5">{road.name}</h4>
              <p className="text-xs text-slate-400">{road.ward} • Elevation: {road.elevation_meters}m</p>
            </div>
            <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-slate-800 text-white">
              Status: {road.current_status}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
