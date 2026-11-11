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
import { Card, Button, Badge } from '../components/ui';

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
      <div className="flex-1 flex flex-col items-center justify-center py-28 text-[#64748d] gap-2">
        <Activity className="w-7 h-7 animate-spin text-[#533afd]" />
        <span className="text-xs font-medium text-[#061b31]">Retrieving incident investigation dossier...</span>
      </div>
    );
  }

  if (error || !incident) {
    return (
      <div className="max-w-xl mx-auto p-6 mt-12 text-center">
        <Card className="p-8 text-center flex flex-col items-center gap-3">
          <div className="p-3 rounded-sm bg-[#fef2f2] border border-[#fecaca] text-[#dc2626] text-xs">
            {error || 'Incident report not found in Mangaluru registry'}
          </div>
          <Link to="/dashboard" className="mt-2">
            <Button variant="outline" size="sm">
              Return to Dashboard
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl w-full mx-auto space-y-6">
      <Link
        to="/dashboard"
        className="inline-flex items-center gap-1.5 text-xs text-[#64748d] hover:text-[#533afd] transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Operational Dashboard</span>
      </Link>

      <Card className="p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#e5edf5]">
          <div>
            <div className="flex items-center gap-2">
              <Badge status={incident.verification_status as any}>
                {incident.verification_status} INCIDENT
              </Badge>
              <span className="text-xs text-[#64748d]">ID: {incident.id}</span>
            </div>
            <h1 className="text-xl font-light text-[#061b31] mt-1.5 tracking-tight">{incident.location_name}</h1>
            <span className="text-xs text-[#533afd] font-medium mt-1 block">
              Category: {incident.incident_category}
            </span>
          </div>

          <div className="text-left sm:text-right">
            <span className="text-xs text-[#64748d] block">Data Provenance</span>
            <span className="text-xs font-mono font-semibold text-[#061b31] uppercase">
              {incident.source}
            </span>
            <span className="text-[11px] text-[#64748d] block mt-0.5">
              Reporter: {incident.reporter_name || 'Anonymous Commuter'}
            </span>
          </div>
        </div>

        {/* Submitted Photograph Preview */}
        {incident.image_url && (
          <div className="w-full max-h-80 rounded-sm overflow-hidden border border-[#e5edf5] bg-[#f8fafd] flex items-center justify-center p-2">
            <img
              src={incident.image_url}
              alt="Submitted flood photograph"
              className="max-h-72 w-auto object-contain rounded-[2px]"
            />
          </div>
        )}

        {/* Key Indicators */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-3.5 rounded-sm bg-[#f8fafd] border border-[#e5edf5]">
            <span className="text-[10px] text-[#64748d] uppercase tracking-wider block">Water Depth</span>
            <span className="text-sm font-semibold text-[#061b31] mt-1 block">
              {incident.reported_water_depth}
            </span>
            <span className="text-[10px] text-[#533afd]">~{incident.estimated_depth_cm || 20} cm</span>
          </div>

          <div className="p-3.5 rounded-sm bg-[#f8fafd] border border-[#e5edf5]">
            <span className="text-[10px] text-[#64748d] uppercase tracking-wider block">Two-Wheelers</span>
            <span className={`text-sm font-semibold mt-1 block ${
              incident.passable_two_wheelers ? 'text-[#059669]' : 'text-[#dc2626]'
            }`}>
              {incident.passable_two_wheelers ? 'Passable' : 'Impassable'}
            </span>
            <span className="text-[10px] text-[#64748d]">Bikes & Scooters</span>
          </div>

          <div className="p-3.5 rounded-sm bg-[#f8fafd] border border-[#e5edf5]">
            <span className="text-[10px] text-[#64748d] uppercase tracking-wider block">Four-Wheelers</span>
            <span className={`text-sm font-semibold mt-1 block ${
              incident.passable_four_wheelers ? 'text-[#059669]' : 'text-[#dc2626]'
            }`}>
              {incident.passable_four_wheelers ? 'Passable' : 'Impassable'}
            </span>
            <span className="text-[10px] text-[#64748d]">Cars & Sedans</span>
          </div>

          <div className="p-3.5 rounded-sm bg-[#f8fafd] border border-[#e5edf5]">
            <span className="text-[10px] text-[#64748d] uppercase tracking-wider block">Emergency Access</span>
            <span className={`text-sm font-semibold mt-1 block ${
              incident.passable_emergency_vehicles ? 'text-[#059669]' : 'text-[#dc2626]'
            }`}>
              {incident.passable_emergency_vehicles ? 'Passable' : 'Blocked'}
            </span>
            <span className="text-[10px] text-[#64748d]">Ambulance & Fire</span>
          </div>
        </div>

        {/* Potential Duplicates Section */}
        {incident.potential_duplicates && incident.potential_duplicates.length > 0 && (
          <div className="p-4 rounded-sm bg-[#e8e9ff] border border-[#d8dbff]">
            <div className="flex items-center gap-2 text-[#533afd] text-xs font-semibold mb-2">
              <Copy className="w-4 h-4" />
              <span>Duplicate Detection Candidates ({incident.potential_duplicates.length})</span>
            </div>
            <div className="space-y-2">
              {incident.potential_duplicates.map(dup => (
                <div key={dup.incident_id} className="p-2.5 rounded-sm bg-white border border-[#e5edf5] text-xs flex justify-between items-center">
                  <div>
                    <span className="font-semibold text-[#061b31]">{dup.location_name}</span>
                    <span className="text-[#64748d] ml-2 text-[11px]">({dup.reason})</span>
                  </div>
                  <Link to={`/incidents/${dup.incident_id}`} className="text-[#533afd] hover:underline text-[11px] font-medium">
                    Compare Dossier
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Verification History / Audit Trail */}
        {incident.verification_history && incident.verification_history.length > 0 && (
          <div className="p-4 rounded-sm bg-[#f8fafd] border border-[#e5edf5] space-y-3">
            <div className="flex items-center gap-2 text-[#061b31] text-xs font-semibold">
              <History className="w-4 h-4 text-[#533afd]" />
              <span>Verification Audit Trail</span>
            </div>
            <div className="space-y-2">
              {incident.verification_history.map(log => (
                <div key={log.id} className="p-2.5 rounded-sm bg-white border border-[#e5edf5] text-xs space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-[#059669]">{log.action}</span>
                    <span className="text-[#64748d] text-[10px]">
                      {new Date(log.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <div className="text-[#50617a]">Verified By: {log.verified_by_user}</div>
                  {log.notes && <div className="text-[#64748d] italic">Notes: "{log.notes}"</div>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Description */}
        <div>
          <h3 className="text-xs font-semibold text-[#061b31] uppercase tracking-wider mb-2">
            Incident Description & Commuter Notes
          </h3>
          <p className="text-xs sm:text-sm text-[#061b31] bg-[#f8fafd] p-4 rounded-sm border border-[#e5edf5] leading-relaxed">
            {incident.description || 'No detailed citizen notes provided.'}
          </p>
        </div>

        {/* Spatial Metadata */}
        <div className="p-4 rounded-sm bg-[#f8fafd] border border-[#e5edf5] space-y-1.5 text-xs">
          <div className="flex justify-between text-[#64748d]">
            <span>WGS84 Coordinates:</span>
            <span className="font-mono text-[#061b31]">
              {incident.geometry.coordinates[1].toFixed(5)}° N, {incident.geometry.coordinates[0].toFixed(5)}° E
            </span>
          </div>
          <div className="flex justify-between text-[#64748d]">
            <span>Observed Time:</span>
            <span className="text-[#061b31]">
              {new Date(incident.observed_time).toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between text-[#64748d]">
            <span>Submission Timestamp:</span>
            <span className="text-[#061b31]">
              {new Date(incident.created_at).toLocaleString()}
            </span>
          </div>
        </div>

        {/* Road Association */}
        {road && (
          <div className="p-4 rounded-sm bg-[#e8e9ff]/50 border border-[#d8dbff] flex items-center justify-between">
            <div>
              <span className="text-[10px] text-[#533afd] uppercase tracking-wider block font-semibold">
                Associated Monitored Corridor
              </span>
              <h4 className="text-sm font-semibold text-[#061b31] mt-0.5">{road.name}</h4>
              <p className="text-xs text-[#64748d]">{road.ward} • Elevation: {road.elevation_meters}m</p>
            </div>
            <Badge status={road.current_status as any} />
          </div>
        )}
      </Card>
    </div>
  );
};
