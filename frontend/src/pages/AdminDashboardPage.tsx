import { useEffect, useState } from 'react';
import { apiClient } from '../services/api';
import type { FloodIncident, RoadSegment, RoadStatus, VerificationStatus } from '../types/api';
import { useAuth } from '../context/AuthContext';
import { 
  ShieldAlert, 
  RefreshCw, 
  Activity,
  Eye,
  Copy
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card, Button, Badge } from '../components/ui';

export const AdminDashboardPage = () => {
  const { user } = useAuth();
  const [incidents, setIncidents] = useState<FloodIncident[]>([]);
  const [, setRoads] = useState<RoadSegment[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Review modal state
  const [selectedIncident, setSelectedIncident] = useState<FloodIncident | null>(null);
  const [verificationNotes, setVerificationNotes] = useState('');
  const [targetRoadStatus, setTargetRoadStatus] = useState<RoadStatus>('CAUTION');
  const [filterStatus, setFilterStatus] = useState<VerificationStatus | 'ALL'>('PENDING');

  const loadData = async () => {
    try {
      setLoading(true);
      const [incData, roadData] = await Promise.all([
        apiClient.getIncidents(),
        apiClient.getRoads(),
      ]);
      setIncidents(incData);
      setRoads(roadData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenReview = (inc: FloodIncident) => {
    setSelectedIncident(inc);
    setVerificationNotes(inc.verification_notes || '');
    setTargetRoadStatus(
      inc.reported_water_depth === 'WAIST_DEEP' || inc.reported_water_depth === 'SUBMERGED'
        ? 'BLOCKED'
        : 'CAUTION'
    );
  };

  const handleExecuteVerification = async (newVerificationStatus: VerificationStatus) => {
    if (!selectedIncident) return;
    try {
      setActionLoading(selectedIncident.id);
      await apiClient.verifyIncident(selectedIncident.id, {
        verified: newVerificationStatus === 'VERIFIED',
        status: newVerificationStatus,
        new_road_status: newVerificationStatus === 'VERIFIED' ? targetRoadStatus : undefined,
        verification_notes: verificationNotes || undefined,
        verified_by: user?.full_name || 'Admin Dispatcher'
      });
      setSelectedIncident(null);
      await loadData();
    } catch (err) {
      alert('Failed to update verification status.');
    } finally {
      setActionLoading(null);
    }
  };

  const filteredIncidents = incidents.filter(i => 
    filterStatus === 'ALL' || i.verification_status === filterStatus
  );

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#e5edf5]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-light text-[#061b31] tracking-tight">
              Disaster Cell Verification & Triage Portal
            </h1>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-[4px] bg-[#e8e9ff] text-[#533afd] border border-[#d8dbff] uppercase tracking-wider">
              Admin Access
            </span>
          </div>
          <p className="text-xs text-[#64748d] mt-1">
            Triage citizen submissions, verify photographs & coordinates, detect duplicates, and record audit history.
          </p>
        </div>

        <Button
          onClick={loadData}
          variant="outline"
          size="sm"
        >
          <RefreshCw className="w-3.5 h-3.5 text-[#533afd]" />
          <span>Refresh Queue</span>
        </Button>
      </div>

      {/* Protocol Directive Banner */}
      <div className="p-4 rounded-[4px] bg-white border border-[#e5edf5] text-xs text-[#50617a] flex items-start gap-3">
        <ShieldAlert className="w-4 h-4 text-[#533afd] shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <strong className="text-[#061b31]">Disaster Control Directive:</strong> Every verified report immediately propagates to the public route planner. Inspect submitted coordinates, compare against nearby reports (duplicate detection), and provide operational justification notes.
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-[#e5edf5] pb-2 overflow-x-auto text-xs">
        {(['ALL', 'PENDING', 'VERIFIED', 'RESOLVED', 'REJECTED'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setFilterStatus(tab)}
            className={`px-3 py-1.5 rounded-[4px] font-medium transition-colors ${
              filterStatus === tab
                ? 'bg-[#533afd] text-white'
                : 'text-[#50617a] hover:text-[#061b31] hover:bg-[#e8e9ff]'
            }`}
          >
            {tab} ({
              tab === 'ALL'
                ? incidents.length
                : incidents.filter(i => i.verification_status === tab).length
            })
          </button>
        ))}
      </div>

      {/* Incident Review Queue */}
      <Card
        className="p-5"
        title="Incident Review Queue"
        subtitle={`Showing ${filteredIncidents.length} submissions`}
      >
        {loading ? (
          <div className="py-20 flex justify-center text-[#64748d]">
            <Activity className="w-6 h-6 animate-spin text-[#533afd]" />
          </div>
        ) : filteredIncidents.length === 0 ? (
          <div className="py-20 text-center text-[#64748d] text-xs">
            No incident reports matching status filter "{filterStatus}".
          </div>
        ) : (
          <div className="space-y-4">
            {filteredIncidents.map((inc) => (
              <div
                key={inc.id}
                className="p-4 rounded-[4px] bg-[#f8fafd] border border-[#e5edf5] hover:border-[#cbd5e1] transition-colors flex flex-col md:flex-row gap-4 justify-between"
              >
                {/* Photo thumbnail */}
                {inc.image_url && (
                  <div className="w-full md:w-36 h-28 rounded-[4px] overflow-hidden border border-[#e5edf5] shrink-0 bg-white">
                    <img
                      src={inc.image_url}
                      alt="Incident photograph"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                <div className="flex-1 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold text-[#061b31]">{inc.location_name}</span>
                    <Badge status={inc.verification_status as any} />
                    <span className="text-[10px] px-2 py-0.5 rounded-[4px] bg-white text-[#50617a] border border-[#e5edf5]">
                      {inc.incident_category}
                    </span>
                  </div>

                  <p className="text-xs text-[#50617a] leading-relaxed">
                    {inc.description || 'No description provided.'}
                  </p>

                  {/* Duplicate Detection Alert Badge */}
                  {inc.potential_duplicates && inc.potential_duplicates.length > 0 && (
                    <div className="p-2.5 rounded-[4px] bg-[#e8e9ff] border border-[#d8dbff] text-[11px] text-[#533afd] flex items-center gap-2">
                      <Copy className="w-3.5 h-3.5 shrink-0" />
                      <span>
                        <strong>Duplicate Detection:</strong> {inc.potential_duplicates.length} nearby candidate(s) ({inc.potential_duplicates[0].reason})
                      </span>
                    </div>
                  )}

                  <div className="flex flex-wrap items-center gap-3 text-xs text-[#64748d]">
                    <span>Depth: <strong className="text-[#061b31]">{inc.reported_water_depth}</strong></span>
                    <span>•</span>
                    <span>2W: <strong className={inc.passable_two_wheelers ? 'text-[#059669]' : 'text-[#dc2626]'}>{inc.passable_two_wheelers ? 'Passable' : 'Blocked'}</strong></span>
                    <span>•</span>
                    <span>4W: <strong className={inc.passable_four_wheelers ? 'text-[#059669]' : 'text-[#dc2626]'}>{inc.passable_four_wheelers ? 'Passable' : 'Blocked'}</strong></span>
                    <span>•</span>
                    <span className="font-mono text-[10px] text-[#64748d]">
                      {inc.geometry.coordinates[1].toFixed(4)}°N, {inc.geometry.coordinates[0].toFixed(4)}°E
                    </span>
                  </div>

                  {inc.verification_notes && (
                    <div className="text-[11px] text-[#50617a] italic bg-white p-2.5 rounded-[4px] border border-[#e5edf5]">
                      Dispatcher note: "{inc.verification_notes}"
                    </div>
                  )}
                </div>

                {/* Review Action Button */}
                <div className="flex md:flex-col justify-end items-end gap-2 shrink-0">
                  <Button
                    onClick={() => handleOpenReview(inc)}
                    size="sm"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Review & Verify</span>
                  </Button>
                  <Link
                    to={`/incidents/${inc.id}`}
                    className="text-xs text-[#533afd] hover:underline"
                  >
                    View Dossier
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Review Modal */}
      {selectedIncident && (
        <div className="fixed inset-0 z-50 bg-[#061b31]/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-[#e5edf5] rounded-[4px] max-w-xl w-full p-6 flex flex-col gap-5 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#e5edf5]">
              <div>
                <h3 className="text-base font-semibold text-[#061b31]">Incident Verification Dossier</h3>
                <span className="text-xs text-[#64748d]">Incident ID: {selectedIncident.id}</span>
              </div>
              <button
                onClick={() => setSelectedIncident(null)}
                className="text-[#64748d] hover:text-[#061b31] p-1 text-sm font-semibold"
              >
                ✕
              </button>
            </div>

            {selectedIncident.image_url && (
              <div className="w-full h-48 rounded-[4px] overflow-hidden border border-[#e5edf5] bg-[#f8fafd]">
                <img
                  src={selectedIncident.image_url}
                  alt="Incident full preview"
                  className="w-full h-full object-contain"
                />
              </div>
            )}

            <div className="text-xs text-[#061b31] space-y-1.5 bg-[#f8fafd] p-4 rounded-[4px] border border-[#e5edf5]">
              <div><strong>Location:</strong> {selectedIncident.location_name}</div>
              <div><strong>Category:</strong> {selectedIncident.incident_category}</div>
              <div><strong>Water Depth:</strong> {selectedIncident.reported_water_depth} (~{selectedIncident.estimated_depth_cm || 20} cm)</div>
              <div><strong>Observed Time:</strong> {new Date(selectedIncident.observed_time).toLocaleString()}</div>
              <div><strong>Coordinates:</strong> {selectedIncident.geometry.coordinates[1]}° N, {selectedIncident.geometry.coordinates[0]}° E</div>
              <div><strong>Description:</strong> {selectedIncident.description || 'None provided'}</div>
            </div>

            {/* Target Road Status Selection */}
            <div>
              <label className="text-xs font-medium text-[#061b31] block mb-1.5">
                Assign Road Corridor Status (if Approving):
              </label>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setTargetRoadStatus('CAUTION')}
                  className={`py-2 px-3 rounded-[4px] border font-medium transition-colors ${
                    targetRoadStatus === 'CAUTION'
                      ? 'bg-[#fffbeb] text-[#d97706] border-[#fde68a] font-semibold'
                      : 'bg-white border-[#e5edf5] text-[#50617a]'
                  }`}
                >
                  CAUTION (Passable with care)
                </button>
                <button
                  type="button"
                  onClick={() => setTargetRoadStatus('BLOCKED')}
                  className={`py-2 px-3 rounded-[4px] border font-medium transition-colors ${
                    targetRoadStatus === 'BLOCKED'
                      ? 'bg-[#fef2f2] text-[#dc2626] border-[#fecaca] font-semibold'
                      : 'bg-white border-[#e5edf5] text-[#50617a]'
                  }`}
                >
                  BLOCKED (Completely impassable)
                </button>
              </div>
            </div>

            {/* Verification Notes */}
            <div>
              <label className="text-xs font-medium text-[#061b31] block mb-1.5">
                Verification Notes / Operational Justification:
              </label>
              <textarea
                rows={2}
                placeholder="e.g. Traffic patrol unit confirmed underpass water level at 40cm. Rerouting two-wheelers."
                value={verificationNotes}
                onChange={(e) => setVerificationNotes(e.target.value)}
                className="w-full bg-white border border-[#e5edf5] rounded-[4px] px-3 py-2 text-xs text-[#061b31] focus:outline-none focus:border-[#533afd]"
              />
            </div>

            {/* Actions */}
            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[#e5edf5]">
              <button
                disabled={!!actionLoading}
                onClick={() => handleExecuteVerification('VERIFIED')}
                className="py-2 px-3 rounded-[4px] bg-[#059669] hover:bg-[#047857] text-white text-xs font-medium transition-colors disabled:opacity-50"
              >
                Approve (Verify)
              </button>
              <button
                disabled={!!actionLoading}
                onClick={() => handleExecuteVerification('RESOLVED')}
                className="py-2 px-3 rounded-[4px] bg-[#533afd] hover:bg-[#7389ff] text-white text-xs font-medium transition-colors disabled:opacity-50"
              >
                Mark Resolved
              </button>
              <button
                disabled={!!actionLoading}
                onClick={() => handleExecuteVerification('REJECTED')}
                className="py-2 px-3 rounded-[4px] bg-white hover:bg-[#fef2f2] text-[#dc2626] border border-[#fecaca] text-xs font-medium transition-colors disabled:opacity-50"
              >
                Reject Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
