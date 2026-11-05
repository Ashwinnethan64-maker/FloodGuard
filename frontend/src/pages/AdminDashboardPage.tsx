import { useEffect, useState } from 'react';
import { apiClient, userApiClient, type UserProfileRecord, type AuditLogEntry } from '../services/api';
import type { FloodIncident, RoadSegment, RoadStatus, VerificationStatus, WeatherSummary } from '../types/api';
import { useAuth } from '../context/AuthContext';
import { 
  RefreshCw, 
  Eye, 
  CheckCircle2, 
  XCircle, 
  Users, 
  CloudRain,
  Navigation,
  Truck
} from 'lucide-react';
import { Button, Badge } from '../components/ui';
import { useHashScroll } from '../hooks/useHashScroll';

export const AdminDashboardPage = () => {
  const { user } = useAuth();
  useHashScroll();
  const [incidents, setIncidents] = useState<FloodIncident[]>([]);
  const [roads, setRoads] = useState<RoadSegment[]>([]);
  const [weather, setWeather] = useState<WeatherSummary | null>(null);
  const [usersList, setUsersList] = useState<UserProfileRecord[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Review modal state
  const [selectedIncident, setSelectedIncident] = useState<FloodIncident | null>(null);
  const [verificationNotes, setVerificationNotes] = useState('');
  const [targetRoadStatus, setTargetRoadStatus] = useState<RoadStatus>('CAUTION');
  const [assignedResponder, setAssignedResponder] = useState('Patrol Unit 04 (Kadri)');
  const [filterStatus, setFilterStatus] = useState<VerificationStatus | 'ALL'>('PENDING');

  // Role management modal
  const [editingUser, setEditingUser] = useState<UserProfileRecord | null>(null);
  const [newRole, setNewRole] = useState<'administrator' | 'responder' | 'resident'>('resident');
  const [newStatus, setNewStatus] = useState<'active' | 'pending' | 'suspended'>('active');

  const loadData = async () => {
    try {
      setLoading(true);
      const [incData, roadData, weatherData, uData, aLogs] = await Promise.all([
        apiClient.getIncidents(),
        apiClient.getRoads(),
        apiClient.getWeather(),
        userApiClient.listUsers().catch(() => []),
        userApiClient.getAuditLogs(10).catch(() => [])
      ]);
      setIncidents(incData);
      setRoads(roadData);
      setWeather(weatherData);
      setUsersList(uData);
      setAuditLogs(aLogs);
    } catch (err) {
      console.error('Admin data load failure:', err);
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
        verification_notes: verificationNotes ? `${verificationNotes} [Assigned: ${assignedResponder}]` : `[Assigned: ${assignedResponder}]`,
        verified_by: user?.full_name || 'Disaster Control Admin'
      });
      setSelectedIncident(null);
      await loadData();
    } catch (err) {
      alert('Failed to update verification status.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleSaveRole = async () => {
    if (!editingUser || !user) return;
    try {
      setActionLoading('role-update');
      await userApiClient.updateUserRole(
        editingUser.id,
        newRole,
        newStatus,
        user.id,
        user.email
      );
      setEditingUser(null);
      await loadData();
    } catch (e: any) {
      alert(e?.message || 'Failed to update user role');
    } finally {
      setActionLoading(null);
    }
  };

  const verifiedCount = incidents.filter(i => i.verification_status === 'VERIFIED').length;
  const pendingCount = incidents.filter(i => i.verification_status === 'PENDING').length;
  const blockedRoads = roads.filter(r => r.current_status === 'BLOCKED').length;
  const cautionRoads = roads.filter(r => r.current_status === 'CAUTION').length;

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
              Disaster Management Command Center
            </h1>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-[4px] bg-[#533afd] text-white uppercase tracking-wider">
              Administrator Console
            </span>
          </div>
          <p className="text-xs text-[#64748d] mt-1">
            Citywide Mangaluru flood operations, incident verification, responder assignments, and role-based security.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {weather && (
            <div className="hidden sm:flex items-center gap-2 bg-white border border-[#e5edf5] px-3 py-1.5 rounded-[4px] text-xs">
              <CloudRain className="w-3.5 h-3.5 text-[#533afd]" />
              <span className="font-semibold text-[#061b31]">{weather.current_observation.current_precipitation_rate_mm_h} mm/h</span>
              <span className="text-[#64748d]">| {weather.monsoon_alert_level.split('-')[0]}</span>
            </div>
          )}
          <Button onClick={loadData} variant="outline" size="sm" disabled={loading}>
            <RefreshCw className={`w-3.5 h-3.5 text-[#533afd] ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh Telemetry</span>
          </Button>
        </div>
      </div>

      {/* Citywide Metrics Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 bg-white border border-[#e5edf5] rounded-[4px]">
          <span className="text-[10px] font-semibold text-[#64748d] uppercase tracking-wider block">Total Reports</span>
          <div className="text-2xl font-light text-[#061b31] mt-1">{incidents.length}</div>
          <span className="text-[11px] text-[#533afd] font-medium mt-1 block">{pendingCount} awaiting triage</span>
        </div>

        <div className="p-4 bg-white border border-[#e5edf5] rounded-[4px]">
          <span className="text-[10px] font-semibold text-[#64748d] uppercase tracking-wider block">Verified Submerged</span>
          <div className="text-2xl font-light text-[#dc2626] mt-1">{verifiedCount}</div>
          <span className="text-[11px] text-[#64748d] mt-1 block">Active on public map</span>
        </div>

        <div className="p-4 bg-white border border-[#e5edf5] rounded-[4px]">
          <span className="text-[10px] font-semibold text-[#64748d] uppercase tracking-wider block">Corridors Blocked</span>
          <div className="text-2xl font-light text-[#d97706] mt-1">{blockedRoads}</div>
          <span className="text-[11px] text-[#64748d] mt-1 block">{cautionRoads} flagged caution</span>
        </div>

        <div className="p-4 bg-white border border-[#e5edf5] rounded-[4px]">
          <span className="text-[10px] font-semibold text-[#64748d] uppercase tracking-wider block">Registered Responders</span>
          <div className="text-2xl font-light text-[#059669] mt-1">
            {usersList.filter(u => u.role === 'responder').length || 4}
          </div>
          <span className="text-[11px] text-[#059669] font-medium mt-1 block">Kadri, Urwa & Panambur Units</span>
        </div>
      </div>

      {/* Incident Review & Triage Section */}
      <div id="incidents" className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-[#061b31]">Citizen Report Triage & Verification</h2>
            <Badge status="CAUTION">{filteredIncidents.length} Records</Badge>
          </div>

          <div className="flex items-center gap-1.5 bg-white border border-[#e5edf5] p-1 rounded-[4px] text-xs">
            {(['ALL', 'PENDING', 'VERIFIED', 'RESOLVED', 'REJECTED'] as const).map(st => (
              <button
                key={st}
                onClick={() => setFilterStatus(st)}
                className={`px-2.5 py-1 rounded-[3px] font-medium transition-colors ${
                  filterStatus === st
                    ? 'bg-[#533afd] text-white shadow-2xs'
                    : 'text-[#64748d] hover:text-[#061b31]'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        {/* Incidents Table */}
        <div className="bg-white border border-[#e5edf5] rounded-[4px] overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#f8fafd] border-b border-[#e5edf5] text-[#50617a]">
                <tr>
                  <th className="py-2.5 px-4 font-semibold">Incident / Location</th>
                  <th className="py-2.5 px-3 font-semibold">Water Depth</th>
                  <th className="py-2.5 px-3 font-semibold">Reported At</th>
                  <th className="py-2.5 px-3 font-semibold">Status</th>
                  <th className="py-2.5 px-3 font-semibold">Passability</th>
                  <th className="py-2.5 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f1f5f9]">
                {filteredIncidents.map(inc => (
                  <tr key={inc.id} className="hover:bg-[#f8fafd]/80 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-[#061b31]">{inc.location_name}</div>
                      <div className="text-[11px] text-[#64748d] truncate max-w-xs">{inc.description || 'No description'}</div>
                    </td>
                    <td className="py-3 px-3">
                      <span className="font-mono text-[#061b31]">{inc.reported_water_depth}</span>
                    </td>
                    <td className="py-3 px-3 text-[11px] text-[#64748d]">
                      {new Date(inc.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-3 px-3">
                      <Badge status={inc.verification_status as any}>{inc.verification_status}</Badge>
                    </td>
                    <td className="py-3 px-3">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                        inc.passable_four_wheelers ? 'bg-[#ecfdf5] text-[#059669]' : 'bg-[#fef2f2] text-[#dc2626]'
                      }`}>
                        {inc.passable_four_wheelers ? 'Passable' : 'Submerged'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleOpenReview(inc)}
                      >
                        <Eye className="w-3 h-3 text-[#533afd]" />
                        <span>Inspect & Triage</span>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Road Closure & Reopening Management Section */}
      <div id="roads" className="pt-4 space-y-4 border-t border-[#e5edf5]">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-[#061b31] flex items-center gap-2">
              <Navigation className="w-4 h-4 text-[#533afd]" />
              Road Corridor Clearance & Closure Directives
            </h2>
            <p className="text-xs text-[#64748d] mt-0.5">
              Live PostGIS corridor statuses across Mangaluru urban arterial network.
            </p>
          </div>
          <span className="text-xs font-mono text-[#50617a]">{roads.length} Monitored Segments</span>
        </div>

        <div className="bg-white border border-[#e5edf5] rounded-[4px] p-4 divide-y divide-[#f1f5f9]">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pb-3">
            {roads.slice(0, 6).map(r => (
              <div key={r.id} className="p-3 bg-[#f8fafd] border border-[#e5edf5] rounded-[4px] flex items-center justify-between">
                <div>
                  <div className="font-semibold text-xs text-[#061b31]">{r.name}</div>
                  <div className="text-[10px] text-[#64748d]">{r.ward} • {r.elevation_meters}m elev</div>
                </div>
                <Badge status={r.current_status as any}>{r.current_status}</Badge>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Responder Unit Management Section */}
      <div id="responders" className="pt-4 space-y-4 border-t border-[#e5edf5]">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-[#061b31] flex items-center gap-2">
              <Truck className="w-4 h-4 text-[#d97706]" />
              Responder Units & Tactical Field Stations
            </h2>
            <p className="text-xs text-[#64748d] mt-0.5">
              Authorized emergency patrol squads stationed across critical Mangaluru bottleneck sectors.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="p-4 bg-white border border-[#e5edf5] rounded-[4px]">
            <div className="flex items-center justify-between pb-2 border-b border-[#f1f5f9]">
              <span className="font-semibold text-xs text-[#061b31]">Kadri Patrol Unit 04</span>
              <span className="text-[10px] bg-[#ecfdf5] text-[#059669] font-semibold px-2 py-0.5 rounded">ON STATION</span>
            </div>
            <p className="text-xs text-[#64748d] mt-2">Station: Pumpwell / Mahaveera Circle</p>
            <p className="text-[11px] text-[#50617a]">Lead: Inspector Ramesh (VHF Channel 4)</p>
          </div>

          <div className="p-4 bg-white border border-[#e5edf5] rounded-[4px]">
            <div className="flex items-center justify-between pb-2 border-b border-[#f1f5f9]">
              <span className="font-semibold text-xs text-[#061b31]">Urwa Rescue Squad 01</span>
              <span className="text-[10px] bg-[#ecfdf5] text-[#059669] font-semibold px-2 py-0.5 rounded">EQUIPPED</span>
            </div>
            <p className="text-xs text-[#64748d] mt-2">Station: Kottara Chowki Underpass</p>
            <p className="text-[11px] text-[#50617a]">Lead: Officer Deepak (VHF Channel 2)</p>
          </div>

          <div className="p-4 bg-white border border-[#e5edf5] rounded-[4px]">
            <div className="flex items-center justify-between pb-2 border-b border-[#f1f5f9]">
              <span className="font-semibold text-xs text-[#061b31]">Panambur Coastal Defense</span>
              <span className="text-[10px] bg-[#ecfdf5] text-[#059669] font-semibold px-2 py-0.5 rounded">PATROL</span>
            </div>
            <p className="text-xs text-[#64748d] mt-2">Station: Baikampady Industrial Canal</p>
            <p className="text-[11px] text-[#50617a]">Lead: Officer Kiran (VHF Channel 6)</p>
          </div>
        </div>
      </div>

      {/* User & Role Management Table (Requirement 1A & 3) */}
      <div id="users" className="pt-4 space-y-4 border-t border-[#e5edf5]">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-[#061b31] flex items-center gap-2">
              <Users className="w-4 h-4 text-[#533afd]" />
              Role-Based Access & User Management
            </h2>
            <p className="text-xs text-[#64748d] mt-0.5">
              Source of truth: Supabase Auth Admin metadata with server-enforced role assignments.
            </p>
          </div>
        </div>

        <div className="bg-white border border-[#e5edf5] rounded-[4px] overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#f8fafd] border-b border-[#e5edf5] text-[#50617a]">
                <tr>
                  <th className="py-2.5 px-4 font-semibold">User</th>
                  <th className="py-2.5 px-3 font-semibold">Email</th>
                  <th className="py-2.5 px-3 font-semibold">Assigned Role</th>
                  <th className="py-2.5 px-3 font-semibold">Account Status</th>
                  <th className="py-2.5 px-4 font-semibold text-right">Administrative Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f1f5f9]">
                {usersList.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-[#64748d]">
                      Loading users from Supabase Auth...
                    </td>
                  </tr>
                ) : (
                  usersList.map(u => (
                    <tr key={u.id} className="hover:bg-[#f8fafd]/80 transition-colors">
                      <td className="py-3 px-4 font-semibold text-[#061b31]">
                        {u.full_name}
                      </td>
                      <td className="py-3 px-3 text-[11px] font-mono text-[#64748d]">
                        {u.email}
                      </td>
                      <td className="py-3 px-3">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                          u.role === 'administrator' ? 'bg-[#533afd] text-white' :
                          u.role === 'responder' ? 'bg-[#d97706] text-white' : 'bg-[#059669] text-white'
                        }`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span className={`text-[10px] px-2 py-0.5 rounded font-medium ${
                          u.account_status === 'active' ? 'bg-[#ecfdf5] text-[#059669]' : 'bg-[#fef2f2] text-[#dc2626]'
                        }`}>
                          {u.account_status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditingUser(u);
                            setNewRole(u.role as any);
                            setNewStatus(u.account_status as any);
                          }}
                        >
                          Modify Privileges
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* System Audit Logs (Requirement 1A & 8) */}
      <div className="pt-4 space-y-3 border-t border-[#e5edf5]">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-[#061b31]">
          Security & Dispatch Audit Logs
        </h3>
        <div className="bg-white border border-[#e5edf5] rounded-[4px] p-4 divide-y divide-[#f1f5f9] text-xs">
          {auditLogs.map(log => (
            <div key={log.id} className="py-2 flex items-center justify-between text-[#50617a]">
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] bg-[#f8fafd] px-1.5 py-0.5 rounded border border-[#e5edf5] font-semibold text-[#533afd]">
                  {log.action}
                </span>
                <span>{log.details}</span>
              </div>
              <span className="text-[10px] text-[#94a3b8] font-mono">
                {new Date(log.timestamp).toLocaleTimeString()}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Verification & Road Closure Modal */}
      {selectedIncident && (
        <div className="fixed inset-0 bg-[#061b31]/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-[#e5edf5] rounded-[6px] max-w-lg w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#e5edf5]">
              <h3 className="text-sm font-semibold text-[#061b31]">
                Review Citizen Submission: {selectedIncident.location_name}
              </h3>
              <Badge status={selectedIncident.verification_status as any}>{selectedIncident.verification_status}</Badge>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-[#f8fafd] border border-[#e5edf5] rounded-[4px] space-y-1">
                <div><strong>Category:</strong> {selectedIncident.incident_category}</div>
                <div><strong>Reported Water Depth:</strong> {selectedIncident.reported_water_depth}</div>
                <div><strong>Description:</strong> {selectedIncident.description || 'None provided'}</div>
              </div>

              {selectedIncident.image_url && (
                <div>
                  <label className="font-semibold block mb-1">Citizen Photograph Evidence:</label>
                  <img
                    src={selectedIncident.image_url}
                    alt="Flood Evidence"
                    className="w-full h-40 object-cover rounded-[4px] border border-[#e5edf5]"
                  />
                </div>
              )}

              <div>
                <label className="font-semibold block mb-1">Assign Tactical Responder Unit:</label>
                <select
                  value={assignedResponder}
                  onChange={(e) => setAssignedResponder(e.target.value)}
                  className="w-full bg-white border border-[#e5edf5] rounded-[4px] p-2 text-xs"
                >
                  <option value="Patrol Unit 04 (Kadri)">Kadri Patrol Unit 04 (Inspector Ramesh)</option>
                  <option value="Urwa Rescue Squad 01">Urwa Rescue Squad 01 (Officer Deepak)</option>
                  <option value="Panambur Coastal Defense">Panambur Coastal Patrol (Officer Kiran)</option>
                </select>
              </div>

              <div>
                <label className="font-semibold block mb-1">Target Road Corridor Status if Verified:</label>
                <div className="flex gap-2">
                  {(['OPEN', 'CAUTION', 'BLOCKED'] as const).map(st => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setTargetRoadStatus(st)}
                      className={`flex-1 py-1.5 rounded-[4px] text-xs font-semibold border ${
                        targetRoadStatus === st
                          ? 'bg-[#533afd] text-white border-[#533afd]'
                          : 'bg-white text-[#50617a] border-[#e5edf5]'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="font-semibold block mb-1">Official Verification Directives / Notes:</label>
                <textarea
                  rows={2}
                  value={verificationNotes}
                  onChange={(e) => setVerificationNotes(e.target.value)}
                  placeholder="Record on-site barricade order or verification rationale..."
                  className="w-full bg-white border border-[#e5edf5] rounded-[4px] p-2 text-xs"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-[#e5edf5] flex flex-wrap justify-between gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedIncident(null)}
              >
                Cancel
              </Button>

              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="text-[#dc2626] border-[#fecaca] hover:bg-[#fef2f2]"
                  disabled={actionLoading !== null}
                  onClick={() => handleExecuteVerification('REJECTED')}
                >
                  <XCircle className="w-3.5 h-3.5" />
                  <span>Reject</span>
                </Button>

                <Button
                  size="sm"
                  disabled={actionLoading !== null}
                  onClick={() => handleExecuteVerification('VERIFIED')}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Verify & Update Road State</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Role Modification Modal */}
      {editingUser && (
        <div className="fixed inset-0 bg-[#061b31]/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-[#e5edf5] rounded-[6px] max-w-sm w-full p-5 space-y-4 shadow-xl">
            <h3 className="text-sm font-semibold text-[#061b31]">
              Assign Role: {editingUser.email}
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold block mb-1">Role Assignment:</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as any)}
                  className="w-full bg-white border border-[#e5edf5] rounded-[4px] p-2 text-xs"
                >
                  <option value="resident">Citizen / Resident</option>
                  <option value="responder">Field Responder (Emergency Dispatch)</option>
                  <option value="administrator">Disaster Cell Administrator</option>
                </select>
              </div>

              <div>
                <label className="font-semibold block mb-1">Account Status:</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as any)}
                  className="w-full bg-white border border-[#e5edf5] rounded-[4px] p-2 text-xs"
                >
                  <option value="active">Active</option>
                  <option value="pending">Pending Verification</option>
                  <option value="suspended">Suspended (Access Revoked)</option>
                </select>
              </div>
            </div>

            <div className="pt-3 border-t border-[#e5edf5] flex justify-end gap-2">
              <Button size="sm" variant="outline" onClick={() => setEditingUser(null)}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleSaveRole} disabled={actionLoading !== null}>
                Save Permissions
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
