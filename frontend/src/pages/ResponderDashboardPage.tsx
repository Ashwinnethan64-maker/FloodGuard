import { useEffect, useState } from 'react';
import { routingApiClient, apiClient } from '../services/api';
import type { ResponderTacticalSummary, FloodIncident, SystemAlert } from '../types/api';
import { useAuth } from '../context/AuthContext';
import { 
  ShieldAlert, 
  Radio, 
  AlertTriangle, 
  XCircle, 
  Truck, 
  HeartPulse, 
  RefreshCw, 
  Bell, 
  Check
} from 'lucide-react';
import { Link } from 'react-router-dom';

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
        <div className="p-8 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 flex flex-col items-center gap-3">
          <ShieldAlert className="w-12 h-12 text-rose-400" />
          <h2 className="text-base font-bold text-white">Authorized Responder Access Required</h2>
          <p className="text-xs text-slate-400">
            This dashboard is restricted to Mangaluru Traffic Patrol, Fire & Emergency Responders, and Disaster Management Cell personnel.
          </p>
          <Link to="/login" className="mt-3 px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold">
            Switch to Responder / Admin Account
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl w-full mx-auto p-4 sm:p-6 flex flex-col gap-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-rose-950 border border-rose-800 flex items-center justify-center text-rose-400">
              <Truck className="w-4 h-4" />
            </div>
            <h1 className="text-xl font-bold text-white">Emergency Response Decision-Support Console</h1>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-950 text-rose-400 border border-rose-800 uppercase tracking-wider">
              Patrol Grid Active
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time bottleneck priorities, emergency hospital artery status, and patrol dispatch alerts
          </p>
        </div>

        <button
          onClick={loadResponderData}
          className="self-start sm:self-auto flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700"
        >
          <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
          <span>Refresh Tactical Feeds</span>
        </button>
      </div>

      {/* Responder Tactical Stat Cards */}
      {tacticalSummary && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl bg-rose-950/20 border border-rose-900/50 flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs text-rose-400">
              <span className="font-semibold uppercase tracking-wider">Impassable Corridors</span>
              <XCircle className="w-4 h-4" />
            </div>
            <div className="mt-2">
              <span className="text-3xl font-extrabold text-white">
                {tacticalSummary.summary_counts.impassable_roads_count}
              </span>
              <p className="text-[11px] text-slate-400 mt-1">
                Zero vehicle passability
              </p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-amber-950/20 border border-amber-900/50 flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs text-amber-400">
              <span className="font-semibold uppercase tracking-wider">Caution Corridors</span>
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div className="mt-2">
              <span className="text-3xl font-extrabold text-white">
                {tacticalSummary.summary_counts.caution_roads_count}
              </span>
              <p className="text-[11px] text-slate-400 mt-1">
                High standing water; patrol monitored
              </p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-cyan-950/20 border border-cyan-900/50 flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs text-cyan-400">
              <span className="font-semibold uppercase tracking-wider">Active Urgent Incidents</span>
              <Radio className="w-4 h-4" />
            </div>
            <div className="mt-2">
              <span className="text-3xl font-extrabold text-white">
                {tacticalSummary.summary_counts.urgent_incidents_active}
              </span>
              <p className="text-[11px] text-slate-400 mt-1">
                Awaiting clearance or patrol confirmation
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Two Column Tactical Split: Hospital Arteries & Dispatch Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Hospital Arteries & Critical Access Corridors */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col gap-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <HeartPulse className="w-4 h-4 text-rose-400" />
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                Emergency Hospital Inundation Arteries
              </h3>
            </div>
            <span className="text-[10px] text-emerald-400 font-bold">Ambulance Route Clearance</span>
          </div>

          <div className="flex flex-col gap-2.5">
            {tacticalSummary?.emergency_hospital_arteries.map(h => (
              <div key={h.facility} className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">{h.facility}</span>
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                    h.risk_tier === 'LOW' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' :
                    'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                  }`}>
                    {h.risk_tier} RISK
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 flex items-center justify-between">
                  <span>Corridor: {h.access_corridor}</span>
                  <span className="font-semibold text-slate-200">{h.accessibility}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Blocked Road Closures Table */}
          <div className="mt-2 pt-3 border-t border-slate-800">
            <span className="text-[11px] font-bold text-rose-400 uppercase tracking-wider block mb-2">
              Verified Blocked Segments Requiring Diversion
            </span>
            <div className="flex flex-col gap-2">
              {tacticalSummary?.critical_blocked_roads.map(b => (
                <div key={b.id} className="p-2.5 rounded-lg bg-rose-950/20 border border-rose-900/40 text-xs flex justify-between items-center">
                  <div>
                    <span className="font-semibold text-white block">{b.name}</span>
                    <span className="text-[10px] text-slate-400">{b.ward}</span>
                  </div>
                  <span className="font-mono text-rose-400 font-bold text-xs">{b.water_depth_cm} cm water</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Live Patrol Alerts & Notifications Broadcast */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col gap-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-cyan-400" />
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                Patrol Dispatch Alerts & Broadcast Stream
              </h3>
            </div>
            <span className="text-[10px] text-slate-400">Firebase Cloud Messaging Compatible</span>
          </div>

          <div className="flex flex-col gap-2.5 max-h-[460px] overflow-y-auto pr-1">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className={`p-3.5 rounded-xl border flex flex-col gap-2 transition-all ${
                  alert.is_read
                    ? 'bg-slate-950/60 border-slate-800 text-slate-400'
                    : 'bg-slate-950 border-cyan-800/80 text-slate-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${
                      alert.severity === 'CRITICAL' ? 'bg-rose-500 animate-ping' :
                      alert.severity === 'URGENT' ? 'bg-amber-500' : 'bg-cyan-500'
                    }`}></span>
                    <span className="text-xs font-bold text-white">{alert.title}</span>
                  </div>
                  <span className="text-[9px] font-mono text-slate-500">
                    {new Date(alert.created_at).toLocaleTimeString()}
                  </span>
                </div>

                <p className="text-xs text-slate-400 leading-relaxed">
                  {alert.message}
                </p>

                <div className="flex items-center justify-between pt-1 text-[10px] text-slate-500 border-t border-slate-800/60">
                  <span>Type: {alert.alert_type}</span>
                  {!alert.is_read && (
                    <button
                      onClick={() => handleAcknowledgeAlert(alert.id)}
                      disabled={actionAlertId === alert.id}
                      className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-semibold"
                    >
                      <Check className="w-3 h-3" />
                      <span>Acknowledge</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
