import { useEffect, useState } from 'react';
import { routingApiClient, apiClient } from '../services/api';
import type { ResponderTacticalSummary, FloodIncident, SystemAlert } from '../types/api';
import { useAuth } from '../context/AuthContext';
import { 
  ShieldAlert, 
  Radio, 
  AlertTriangle, 
  XCircle, 
  HeartPulse, 
  RefreshCw, 
  Bell, 
  Check
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card, Button, Badge } from '../components/ui';

export const ResponderDashboardPage = () => {
  const { user } = useAuth();
  const [tacticalSummary, setTacticalSummary] = useState<ResponderTacticalSummary | null>(null);
  const [, setIncidents] = useState<FloodIncident[]>([]);
  const [alerts, setAlerts] = useState<SystemAlert[]>([]);
  const [, setLoading] = useState(true);
  const [actionAlertId, setActionAlertId] = useState<string | null>(null);

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

  const isAuthorized = user?.role === 'responder' || user?.role === 'administrator';

  if (!isAuthorized) {
    return (
      <div className="max-w-xl w-full mx-auto p-6 mt-16 text-center">
        <Card className="p-8 text-center flex flex-col items-center gap-3">
          <ShieldAlert className="w-12 h-12 text-[#dc2626]" />
          <h2 className="text-base font-semibold text-[#061b31]">Authorized Responder Access Required</h2>
          <p className="text-xs text-[#64748d] max-w-sm">
            This dashboard is restricted to Mangaluru Traffic Patrol, Fire & Emergency Responders, and Disaster Management Cell personnel.
          </p>
          <Link to="/login" className="mt-3">
            <Button size="sm">
              Switch to Responder / Admin Account
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#e5edf5]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-light text-[#061b31] tracking-tight">
              Emergency Response Decision-Support Console
            </h1>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-[4px] bg-[#fef2f2] text-[#dc2626] border border-[#fecaca] uppercase tracking-wider">
              Patrol Grid Active
            </span>
          </div>
          <p className="text-xs text-[#64748d] mt-1">
            Real-time bottleneck priorities, emergency hospital artery status, and patrol dispatch alerts.
          </p>
        </div>

        <Button
          onClick={loadResponderData}
          variant="outline"
          size="sm"
        >
          <RefreshCw className="w-3.5 h-3.5 text-[#533afd]" />
          <span>Refresh Tactical Feeds</span>
        </Button>
      </div>

      {/* Responder Tactical Stat Cards */}
      {tacticalSummary && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="p-5">
            <div className="flex items-center justify-between text-xs text-[#dc2626]">
              <span className="font-semibold uppercase tracking-wider">Impassable Corridors</span>
              <XCircle className="w-4 h-4" />
            </div>
            <div className="mt-2">
              <span className="text-3xl font-light text-[#dc2626] tracking-tight">
                {tacticalSummary.summary_counts.impassable_roads_count}
              </span>
              <p className="text-[11px] text-[#64748d] mt-1">
                Zero vehicle passability
              </p>
            </div>
          </Card>

          <Card className="p-5">
            <div className="flex items-center justify-between text-xs text-[#d97706]">
              <span className="font-semibold uppercase tracking-wider">Caution Corridors</span>
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div className="mt-2">
              <span className="text-3xl font-light text-[#d97706] tracking-tight">
                {tacticalSummary.summary_counts.caution_roads_count}
              </span>
              <p className="text-[11px] text-[#64748d] mt-1">
                High standing water; patrol monitored
              </p>
            </div>
          </Card>

          <Card className="p-5">
            <div className="flex items-center justify-between text-xs text-[#533afd]">
              <span className="font-semibold uppercase tracking-wider">Active Urgent Incidents</span>
              <Radio className="w-4 h-4" />
            </div>
            <div className="mt-2">
              <span className="text-3xl font-light text-[#533afd] tracking-tight">
                {tacticalSummary.summary_counts.urgent_incidents_active}
              </span>
              <p className="text-[11px] text-[#64748d] mt-1">
                Awaiting clearance or patrol confirmation
              </p>
            </div>
          </Card>
        </div>
      )}

      {/* Two Column Tactical Split */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Hospital Arteries & Critical Access Corridors */}
        <Card
          className="p-5 flex flex-col gap-3"
          title="Emergency Hospital Inundation Arteries"
          subtitle="Priority route clearance monitoring for emergency medical transit"
          headerAction={<HeartPulse className="w-4 h-4 text-[#dc2626]" />}
        >
          <div className="flex flex-col gap-2">
            {tacticalSummary?.emergency_hospital_arteries.map(h => (
              <div key={h.facility} className="p-3.5 rounded-[4px] bg-[#f8fafd] border border-[#e5edf5] flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#061b31]">{h.facility}</span>
                  <Badge status={h.risk_tier as any}>
                    {h.risk_tier} RISK
                  </Badge>
                </div>
                <div className="text-[11px] text-[#64748d] flex items-center justify-between">
                  <span>Corridor: {h.access_corridor}</span>
                  <span className="font-medium text-[#061b31]">{h.accessibility}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Blocked Road Closures Table */}
          <div className="mt-2 pt-3 border-t border-[#f1f5f9]">
            <span className="text-[11px] font-semibold text-[#dc2626] uppercase tracking-wider block mb-2">
              Verified Blocked Segments Requiring Diversion
            </span>
            <div className="flex flex-col gap-2">
              {tacticalSummary?.critical_blocked_roads.map(b => (
                <div key={b.id} className="p-2.5 rounded-[4px] bg-[#fef2f2] border border-[#fecaca] text-xs flex justify-between items-center">
                  <div>
                    <span className="font-semibold text-[#061b31] block">{b.name}</span>
                    <span className="text-[10px] text-[#64748d]">{b.ward}</span>
                  </div>
                  <span className="font-mono text-[#dc2626] font-semibold text-xs">{b.water_depth_cm} cm water</span>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Live Patrol Alerts & Notifications Broadcast */}
        <Card
          className="p-5 flex flex-col gap-3"
          title="Patrol Dispatch Alerts & Broadcast Stream"
          subtitle="Real-time incident dispatches and barricade notifications"
          headerAction={<Bell className="w-4 h-4 text-[#533afd]" />}
        >
          <div className="flex flex-col gap-2.5 max-h-[460px] overflow-y-auto pr-1">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className={`p-3.5 rounded-[4px] border flex flex-col gap-2 transition-colors ${
                  alert.is_read
                    ? 'bg-[#f8fafd] border-[#e5edf5] text-[#64748d]'
                    : 'bg-white border-[#533afd] text-[#061b31] shadow-2xs'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${
                      alert.severity === 'CRITICAL' ? 'bg-[#dc2626]' :
                      alert.severity === 'URGENT' ? 'bg-[#d97706]' : 'bg-[#533afd]'
                    }`}></span>
                    <span className="text-xs font-semibold text-[#061b31]">{alert.title}</span>
                  </div>
                  <span className="text-[10px] font-mono text-[#64748d]">
                    {new Date(alert.created_at).toLocaleTimeString()}
                  </span>
                </div>

                <p className="text-xs text-[#50617a] leading-relaxed">
                  {alert.message}
                </p>

                <div className="flex items-center justify-between pt-1 text-[10px] text-[#64748d] border-t border-[#f1f5f9]">
                  <span>Type: {alert.alert_type}</span>
                  {!alert.is_read && (
                    <button
                      onClick={() => handleAcknowledgeAlert(alert.id)}
                      disabled={actionAlertId === alert.id}
                      className="text-[#533afd] hover:text-[#7389ff] flex items-center gap-1 font-semibold"
                    >
                      <Check className="w-3 h-3" />
                      <span>Acknowledge</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};
