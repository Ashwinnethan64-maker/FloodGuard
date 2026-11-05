import { useEffect, useState } from 'react';
import { routingApiClient, apiClient } from '../services/api';
import type { ResponderTacticalSummary, FloodIncident, SystemAlert, RoadStatus, VerificationStatus } from '../types/api';
import { useAuth } from '../context/AuthContext';
import { 
  Radio, 
  RefreshCw, 
  Navigation, 
  FileCheck2, 
  CheckCircle2, 
  XCircle, 
  Compass 
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card, Button, Badge } from '../components/ui';
import { useHashScroll } from '../hooks/useHashScroll';

export const ResponderDashboardPage = () => {
  const { user } = useAuth();
  useHashScroll();
  const [, setTacticalSummary] = useState<ResponderTacticalSummary | null>(null);
  const [incidents, setIncidents] = useState<FloodIncident[]>([]);
  const [alerts, setAlerts] = useState<SystemAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionAlertId, setActionAlertId] = useState<string | null>(null);

  // Field Verification Modal
  const [verifyingIncident, setVerifyingIncident] = useState<FloodIncident | null>(null);
  const [observedDepth, setObservedDepth] = useState('45 cm standing water');
  const [roadRecommendation, setRoadRecommendation] = useState<RoadStatus>('BLOCKED');
  const [notes, setNotes] = useState('');
  const [submittingAction, setSubmittingAction] = useState(false);

  const loadResponderData = async () => {
    try {
      setLoading(true);
      const [tacData, incData, alertData] = await Promise.all([
        routingApiClient.getResponderTacticalSummary(),
        apiClient.getIncidents(),
        routingApiClient.getAlerts(10),
      ]);
      setTacticalSummary(tacData);
      setIncidents(incData);
      setAlerts(alertData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadResponderData();
  }, []);

  const handleAcknowledgeAlert = async (alertId: string) => {
    try {
      setActionAlertId(alertId);
      await routingApiClient.acknowledgeAlert(alertId);
      setAlerts(prev => prev.map(a => a.id === alertId ? { ...a, is_read: true } : a));
    } catch (err) {
      console.error(err);
    } finally {
      setActionAlertId(null);
    }
  };

  const handleOpenVerify = (inc: FloodIncident) => {
    setVerifyingIncident(inc);
    setNotes(`On-site inspection completed by ${user?.full_name || 'Patrol Unit'}.`);
  };

  const handleSubmitFieldVerification = async (status: VerificationStatus) => {
    if (!verifyingIncident) return;
    try {
      setSubmittingAction(true);
      await apiClient.verifyIncident(verifyingIncident.id, {
        verified: status === 'VERIFIED',
        status: status,
        new_road_status: status === 'VERIFIED' ? roadRecommendation : undefined,
        verification_notes: `${notes} [Field Observation: ${observedDepth}]`,
        verified_by: user?.full_name || 'Field Patrol Officer'
      });
      setVerifyingIncident(null);
      await loadResponderData();
    } catch (err) {
      alert('Verification submission failed.');
    } finally {
      setSubmittingAction(false);
    }
  };

  const assignedTasks = incidents.filter(i => i.verification_status === 'PENDING');
  const completedTasks = incidents.filter(i => i.verification_status === 'VERIFIED' || i.verification_status === 'RESOLVED');

  return (
    <div className="space-y-6">
      {/* Top Tactical Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#e5edf5]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-light text-[#061b31] tracking-tight">
              Field Responder Dispatch Console
            </h1>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-[4px] bg-[#d97706] text-white uppercase tracking-wider">
              Authorized Responder Desk
            </span>
          </div>
          <p className="text-xs text-[#64748d] mt-1">
            Assigned flood zones, real-time barricade instructions, and on-site evidence verification for field units.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="bg-[#ecfdf5] border border-[#a7f3d0] text-[#059669] px-3 py-1.5 rounded-[4px] text-xs font-medium flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#059669] animate-pulse" />
            <span>Unit Status: Active Patrol</span>
          </div>
          <Button onClick={loadResponderData} variant="outline" size="sm" disabled={loading}>
            <RefreshCw className={`w-3.5 h-3.5 text-[#533afd] ${loading ? 'animate-spin' : ''}`} />
            <span>Sync Dispatch</span>
          </Button>
        </div>
      </div>

      {/* Responder Top Priority Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-white border border-[#e5edf5] rounded-[4px]">
          <span className="text-[10px] font-semibold text-[#64748d] uppercase tracking-wider block">Assigned Tasks</span>
          <div className="text-2xl font-light text-[#d97706] mt-1">{assignedTasks.length}</div>
          <span className="text-[11px] text-[#64748d] mt-1 block">Awaiting field inspection</span>
        </div>

        <div className="p-4 bg-white border border-[#e5edf5] rounded-[4px]">
          <span className="text-[10px] font-semibold text-[#64748d] uppercase tracking-wider block">Completed Verifications</span>
          <div className="text-2xl font-light text-[#059669] mt-1">{completedTasks.length}</div>
          <span className="text-[11px] text-[#64748d] mt-1 block">Corridors secured or cleared</span>
        </div>

        <div className="p-4 bg-white border border-[#e5edf5] rounded-[4px]">
          <span className="text-[10px] font-semibold text-[#64748d] uppercase tracking-wider block">Emergency Broadcasts</span>
          <div className="text-2xl font-light text-[#533afd] mt-1">{alerts.length}</div>
          <span className="text-[11px] text-[#64748d] mt-1 block">Active weather & road alerts</span>
        </div>
      </div>

      {/* Emergency Broadcasts Ticker */}
      {alerts.length > 0 && (
        <div className="p-3 rounded-[4px] bg-[#fffbeb] border border-[#fde68a] text-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-[#d97706] animate-pulse shrink-0" />
            <span className="font-semibold text-[#92400e]">Emergency Broadcast:</span>
            <span className="text-[#b45309]">{alerts[0].message}</span>
          </div>
          {!alerts[0].is_read && (
            <Button
              size="sm"
              variant="outline"
              disabled={actionAlertId === alerts[0].id}
              onClick={() => handleAcknowledgeAlert(alerts[0].id)}
              className="bg-white"
            >
              Acknowledge
            </Button>
          )}
        </div>
      )}

      {/* Main Field Tasks List */}
      <div id="assigned" className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-[#061b31] flex items-center gap-2">
            <Radio className="w-4 h-4 text-[#d97706]" />
            Active Field Assignments
          </h2>
          <Link to="/map">
            <Button size="sm" variant="outline">
              <Navigation className="w-3.5 h-3.5 text-[#533afd]" />
              <span>Open Tactical GIS Map</span>
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {assignedTasks.map(task => (
            <Card key={task.id} className="p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-2 border-b border-[#f1f5f9]">
                  <span className="text-xs font-semibold text-[#061b31]">{task.location_name}</span>
                  <Badge status="CAUTION">{task.incident_category}</Badge>
                </div>

                <div className="mt-3 space-y-1.5 text-xs text-[#50617a]">
                  <div className="flex justify-between">
                    <span className="text-[#64748d]">Reported Depth:</span>
                    <span className="font-semibold text-[#061b31]">{task.reported_water_depth}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#64748d]">Citizen Observation:</span>
                    <span className="italic truncate max-w-[200px]">{task.description || 'No description provided'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#64748d]">Reported At:</span>
                    <span>{new Date(task.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>

                {task.image_url && (
                  <div className="mt-3">
                    <img
                      src={task.image_url}
                      alt="Incident scene"
                      className="w-full h-32 object-cover rounded-[4px] border border-[#e5edf5]"
                    />
                  </div>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-[#e5edf5] flex gap-2">
                <Link to="/routes" className="flex-1">
                  <Button size="sm" variant="outline" className="w-full justify-center">
                    <Compass className="w-3.5 h-3.5 text-[#533afd]" />
                    <span>Route To Site</span>
                  </Button>
                </Link>
                <Button size="sm" onClick={() => handleOpenVerify(task)} className="flex-1 justify-center">
                  <FileCheck2 className="w-3.5 h-3.5" />
                  <span>Inspect & Verify</span>
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Road Condition Updates Section */}
      <div id="roads" className="pt-4 space-y-4 border-t border-[#e5edf5]">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-[#061b31] flex items-center gap-2">
              <Navigation className="w-4 h-4 text-[#533afd]" />
              Road Condition & Barricade Directives
            </h2>
            <p className="text-xs text-[#64748d] mt-0.5">
              Field barrier status for monitored arterial road links.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="p-3 bg-white border border-[#e5edf5] rounded-[4px] flex items-center justify-between">
            <div>
              <div className="font-semibold text-xs text-[#061b31]">Kottara Underpass</div>
              <div className="text-[10px] text-[#dc2626] font-medium">Barricades Deployed</div>
            </div>
            <Badge status="BLOCKED">BLOCKED</Badge>
          </div>
          <div className="p-3 bg-white border border-[#e5edf5] rounded-[4px] flex items-center justify-between">
            <div>
              <div className="font-semibold text-xs text-[#061b31]">Pumpwell Flyover Descent</div>
              <div className="text-[10px] text-[#d97706] font-medium">Speed Advisory 20km/h</div>
            </div>
            <Badge status="CAUTION">CAUTION</Badge>
          </div>
          <div className="p-3 bg-white border border-[#e5edf5] rounded-[4px] flex items-center justify-between">
            <div>
              <div className="font-semibold text-xs text-[#061b31]">Kadri Park Arterial</div>
              <div className="text-[10px] text-[#059669] font-medium">Clear for Traffic</div>
            </div>
            <Badge status="OPEN">OPEN</Badge>
          </div>
        </div>
      </div>

      {/* Field Verification Section */}
      <div id="verification" className="pt-4 space-y-4 border-t border-[#e5edf5]">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-[#061b31] flex items-center gap-2">
              <FileCheck2 className="w-4 h-4 text-[#059669]" />
              Field Evidence Verification Queue
            </h2>
            <p className="text-xs text-[#64748d] mt-0.5">
              Inspect on-site water logging, mark vehicle clearance, and submit evidence.
            </p>
          </div>
        </div>
        <p className="text-xs text-[#64748d]">
          Select any task above to record physical tape depth measurements and trigger roadblock advisories.
        </p>
      </div>

      {/* Completed Tasks History Section */}
      <div id="completed" className="pt-4 space-y-4 border-t border-[#e5edf5]">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-[#061b31] flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#059669]" />
              Completed Verification History
            </h2>
            <p className="text-xs text-[#64748d] mt-0.5">
              Archived tasks verified or resolved by on-duty patrol units.
            </p>
          </div>
          <span className="text-xs font-mono text-[#50617a]">{completedTasks.length} Completed</span>
        </div>

        <div className="bg-white border border-[#e5edf5] rounded-[4px] divide-y divide-[#f1f5f9] text-xs">
          {completedTasks.slice(0, 4).map(ct => (
            <div key={ct.id} className="p-3 flex items-center justify-between">
              <div>
                <span className="font-semibold text-[#061b31]">{ct.location_name}</span>
                <span className="text-[11px] text-[#64748d] block">{ct.verification_notes || 'Verified on site'}</span>
              </div>
              <Badge status={ct.verification_status as any}>{ct.verification_status}</Badge>
            </div>
          ))}
        </div>
      </div>

      {/* Field Verification Modal */}
      {verifyingIncident && (
        <div className="fixed inset-0 bg-[#061b31]/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-[#e5edf5] rounded-[6px] max-w-md w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#e5edf5]">
              <h3 className="text-sm font-semibold text-[#061b31]">
                Field Verification: {verifyingIncident.location_name}
              </h3>
              <Badge status="OPEN">On-Site</Badge>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold block mb-1">Observed Water Depth (Tape Measurement):</label>
                <input
                  type="text"
                  value={observedDepth}
                  onChange={(e) => setObservedDepth(e.target.value)}
                  placeholder="e.g. 50 cm standing water"
                  className="w-full bg-white border border-[#e5edf5] rounded-[4px] p-2 text-xs"
                />
              </div>

              <div>
                <label className="font-semibold block mb-1">Consequential Road Recommendation:</label>
                <div className="flex gap-2">
                  {(['OPEN', 'CAUTION', 'BLOCKED'] as const).map(st => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setRoadRecommendation(st)}
                      className={`flex-1 py-1.5 rounded-[4px] text-xs font-semibold border ${
                        roadRecommendation === st
                          ? 'bg-[#d97706] text-white border-[#d97706]'
                          : 'bg-white text-[#50617a] border-[#e5edf5]'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="font-semibold block mb-1">Patrol Officer Observations & Barricade Details:</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-white border border-[#e5edf5] rounded-[4px] p-2 text-xs"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-[#e5edf5] flex justify-between gap-2">
              <Button size="sm" variant="outline" onClick={() => setVerifyingIncident(null)}>
                Cancel
              </Button>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="text-[#dc2626] border-[#fecaca]"
                  disabled={submittingAction}
                  onClick={() => handleSubmitFieldVerification('REJECTED')}
                >
                  <XCircle className="w-3.5 h-3.5" />
                  <span>False Report</span>
                </Button>
                <Button
                  size="sm"
                  disabled={submittingAction}
                  onClick={() => handleSubmitFieldVerification('VERIFIED')}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Submit Verification</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
