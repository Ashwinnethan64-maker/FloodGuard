import { useEffect, useState } from 'react';
import { apiClient } from '../services/api';
import type { FloodIncident, RoadSegment, RoadStatus, VerificationStatus } from '../types/api';
import { useAuth } from '../context/AuthContext';
import { 
  UserCheck, 
  ShieldAlert, 
  RefreshCw, 
  Activity,
  Eye,
  Copy
} from 'lucide-react';
import { Link } from 'react-router-dom';

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
    <div className="max-w-7xl w-full mx-auto p-4 sm:p-6 flex flex-col gap-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-cyan-400" />
            <h1 className="text-xl font-bold text-white">Emergency Dispatcher & Admin Verification</h1>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Triage citizen submissions, verify photographs & coordinates, detect duplicates, and record audit history
          </p>
        </div>

        <button
          onClick={loadData}
          className="self-start sm:self-auto flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
          <span>Refresh Queue</span>
        </button>
      </div>

      {/* Protocol Banner */}
      <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 flex items-start gap-3">
        <ShieldAlert className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <strong className="text-cyan-300">Dispatcher Directive:</strong> Every verified report directly affects public navigation routing across Mangaluru. Inspect submitted coordinates, compare against nearby reports (duplicate detection), check water depth, and record verification notes for audit logs.
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto text-xs">
        {(['ALL', 'PENDING', 'VERIFIED', 'RESOLVED', 'REJECTED'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setFilterStatus(tab)}
            className={`px-3 py-1.5 rounded-xl font-semibold transition-all ${
              filterStatus === tab
                ? 'bg-cyan-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
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
      <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col">
        {loading ? (
          <div className="py-16 flex justify-center text-slate-400">
            <Activity className="w-6 h-6 animate-spin text-cyan-400" />
          </div>
        ) : filteredIncidents.length === 0 ? (
          <div className="py-16 text-center text-slate-500 text-xs">
            No incidents matching filter "{filterStatus}".
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {filteredIncidents.map((inc) => (
              <div
                key={inc.id}
                className="p-4 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700/80 transition-all flex flex-col md:flex-row gap-4 justify-between"
              >
                {/* Photo thumbnail if present */}
                {inc.image_url && (
                  <div className="w-full md:w-36 h-28 rounded-lg overflow-hidden border border-slate-800 shrink-0 bg-slate-900">
                    <img
                      src={inc.image_url}
                      alt="Incident photograph"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-bold text-white">{inc.location_name}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      inc.verification_status === 'VERIFIED'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                        : inc.verification_status === 'PENDING'
                        ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                        : inc.verification_status === 'RESOLVED'
                        ? 'bg-blue-500/10 text-blue-400 border border-blue-500/30'
                        : 'bg-slate-700/50 text-slate-400 border border-slate-600'
                    }`}>
                      {inc.verification_status}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-slate-900 text-cyan-300 border border-slate-800">
                      {inc.incident_category}
                    </span>
                  </div>

                  <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                    {inc.description || 'No description provided.'}
                  </p>

                  {/* Duplicate Detection Alert Badge */}
                  {inc.potential_duplicates && inc.potential_duplicates.length > 0 && (
                    <div className="mt-2 p-2 rounded-lg bg-indigo-950/40 border border-indigo-800/60 text-[11px] text-indigo-300 flex items-center gap-2">
                      <Copy className="w-3.5 h-3.5 shrink-0 text-indigo-400" />
                      <span>
                        <strong>Duplicate Detection:</strong> {inc.potential_duplicates.length} nearby candidate(s) ({inc.potential_duplicates[0].reason})
                      </span>
                    </div>
                  )}

                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 mt-2.5">
                    <span>Depth: <strong className="text-cyan-300">{inc.reported_water_depth}</strong></span>
                    <span>•</span>
                    <span>2W: <strong className={inc.passable_two_wheelers ? 'text-emerald-400' : 'text-rose-400'}>{inc.passable_two_wheelers ? 'Passable' : 'Blocked'}</strong></span>
                    <span>•</span>
                    <span>4W: <strong className={inc.passable_four_wheelers ? 'text-emerald-400' : 'text-rose-400'}>{inc.passable_four_wheelers ? 'Passable' : 'Blocked'}</strong></span>
                    <span>•</span>
                    <span className="text-slate-500 font-mono text-[10px]">
                      {inc.geometry.coordinates[1].toFixed(4)}°N, {inc.geometry.coordinates[0].toFixed(4)}°E
                    </span>
                  </div>

                  {inc.verification_notes && (
                    <div className="mt-2 text-[11px] text-slate-400 italic bg-slate-900/60 p-2 rounded border border-slate-800">
                      Dispatcher note: "{inc.verification_notes}"
                    </div>
                  )}
                </div>

                {/* Review Action Button */}
                <div className="flex md:flex-col justify-end items-end gap-2 shrink-0">
                  <button
                    onClick={() => handleOpenReview(inc)}
                    className="px-3.5 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-sm flex items-center gap-1.5"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Review & Verify</span>
                  </button>
                  <Link
                    to={`/incidents/${inc.id}`}
                    className="text-xs text-slate-400 hover:text-slate-200 underline"
                  >
                    View Dossier
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Review Modal */}
      {selectedIncident && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-6 flex flex-col gap-5 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-base font-bold text-white">Incident Verification Dossier</h3>
                <span className="text-xs text-slate-400">ID: {selectedIncident.id}</span>
              </div>
              <button
                onClick={() => setSelectedIncident(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {selectedIncident.image_url && (
              <div className="w-full h-48 rounded-xl overflow-hidden border border-slate-800 bg-black">
                <img
                  src={selectedIncident.image_url}
                  alt="Incident full preview"
                  className="w-full h-full object-contain"
                />
              </div>
            )}

            <div className="text-xs text-slate-300 flex flex-col gap-1.5">
              <div><strong>Location:</strong> {selectedIncident.location_name}</div>
              <div><strong>Category:</strong> {selectedIncident.incident_category}</div>
              <div><strong>Water Depth:</strong> {selectedIncident.reported_water_depth} (~{selectedIncident.estimated_depth_cm || 20} cm)</div>
              <div><strong>Observed Time:</strong> {new Date(selectedIncident.observed_time).toLocaleString()}</div>
              <div><strong>Coordinates:</strong> {selectedIncident.geometry.coordinates[1]}° N, {selectedIncident.geometry.coordinates[0]}° E</div>
              <div><strong>Description:</strong> {selectedIncident.description || 'None'}</div>
            </div>

            {/* Target Road Status Selection */}
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Assign Road Corridor Status (if Approving):
              </label>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setTargetRoadStatus('CAUTION')}
                  className={`py-2 px-3 rounded-lg border font-semibold ${
                    targetRoadStatus === 'CAUTION'
                      ? 'bg-amber-600 text-white border-amber-500'
                      : 'bg-slate-950 border-slate-800 text-slate-400'
                  }`}
                >
                  CAUTION (Passable with care)
                </button>
                <button
                  type="button"
                  onClick={() => setTargetRoadStatus('BLOCKED')}
                  className={`py-2 px-3 rounded-lg border font-semibold ${
                    targetRoadStatus === 'BLOCKED'
                      ? 'bg-rose-600 text-white border-rose-500'
                      : 'bg-slate-950 border-slate-800 text-slate-400'
                  }`}
                >
                  BLOCKED (Completely impassable)
                </button>
              </div>
            </div>

            {/* Verification Notes */}
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Verification Notes / Patrol Justification:
              </label>
              <textarea
                rows={2}
                placeholder="e.g. Traffic patrol unit 3 confirmed underpass water level at 40cm. Diverting small vehicles."
                value={verificationNotes}
                onChange={(e) => setVerificationNotes(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
              />
            </div>

            {/* Actions */}
            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800">
              <button
                disabled={!!actionLoading}
                onClick={() => handleExecuteVerification('VERIFIED')}
                className="py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all disabled:opacity-50"
              >
                Approve (Verify)
              </button>
              <button
                disabled={!!actionLoading}
                onClick={() => handleExecuteVerification('RESOLVED')}
                className="py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all disabled:opacity-50"
              >
                Mark Resolved
              </button>
              <button
                disabled={!!actionLoading}
                onClick={() => handleExecuteVerification('REJECTED')}
                className="py-2.5 rounded-xl bg-slate-800 hover:bg-rose-900/60 text-slate-300 hover:text-rose-200 text-xs font-bold border border-slate-700 transition-all disabled:opacity-50"
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
