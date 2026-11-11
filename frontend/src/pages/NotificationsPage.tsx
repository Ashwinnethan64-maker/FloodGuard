import { useEffect, useState } from 'react';
import { 
  Bell, 
  CheckCircle2, 
  Clock, 
  MapPin, 
  Check, 
  Filter
} from 'lucide-react';
import { routingApiClient } from '../services/api';
import type { SystemAlert } from '../types/api';
import { Card, Button, Badge } from '../components/ui';

export const NotificationsPage = () => {
  const [alerts, setAlerts] = useState<SystemAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'ALL' | 'UNREAD' | 'CRITICAL'>('ALL');

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const data = await routingApiClient.getAlerts(50);
      setAlerts(data);
    } catch (err) {
      console.error('Failed to load alerts', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  const handleAcknowledge = async (alertId: string) => {
    try {
      await routingApiClient.acknowledgeAlert(alertId);
      setAlerts(prev => prev.map(a => a.id === alertId ? { ...a, is_read: true } : a));
    } catch (err) {
      console.error('Failed to ack alert', err);
    }
  };

  const handleAcknowledgeAll = async () => {
    const unread = alerts.filter(a => !a.is_read);
    for (const a of unread) {
      try {
        await routingApiClient.acknowledgeAlert(a.id);
      } catch {
        // continue
      }
    }
    setAlerts(prev => prev.map(a => ({ ...a, is_read: true })));
  };

  const filteredAlerts = alerts.filter(a => {
    if (filter === 'UNREAD') return !a.is_read;
    if (filter === 'CRITICAL') return a.severity === 'CRITICAL' || a.severity === 'URGENT';
    return true;
  });

  const unreadCount = alerts.filter(a => !a.is_read).length;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#e5edf5]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-light text-[#061b31] tracking-tight">
              Emergency Dispatch & Road Notifications
            </h1>
            {unreadCount > 0 && (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-sm bg-[#fef2f2] text-[#dc2626] border border-[#fecaca] uppercase tracking-wider">
                {unreadCount} Unread
              </span>
            )}
          </div>
          <p className="text-xs text-[#64748d] mt-1">
            Real-time critical corridor inundation updates, hazard warnings, and patrol verification logs across Mangaluru.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Button
              onClick={handleAcknowledgeAll}
              variant="outline"
              size="sm"
            >
              <Check className="w-3.5 h-3.5 mr-1" />
              <span>Mark All as Read</span>
            </Button>
          )}
          <Button
            onClick={fetchAlerts}
            variant="outline"
            size="sm"
          >
            <span>Refresh</span>
          </Button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-[#64748d]" />
          <span className="text-xs font-medium text-[#50617a]">Filter Alerts:</span>
          {(['ALL', 'UNREAD', 'CRITICAL'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1 rounded-sm text-xs font-medium transition-colors ${
                filter === f
                  ? 'bg-[#533afd] text-white shadow-xs'
                  : 'bg-white border border-[#e5edf5] text-[#50617a] hover:bg-[#f8fafd]'
              }`}
            >
              {f === 'ALL' ? 'All Alerts' : f === 'UNREAD' ? `Unread (${unreadCount})` : 'Critical Hazards'}
            </button>
          ))}
        </div>
      </div>

      {/* Alerts Feed */}
      <Card
        className="p-5"
        title="Active Dispatch Feed"
        subtitle="Chronological sequence of Mangaluru road hazard events"
        headerAction={<Bell className="w-4 h-4 text-[#533afd]" />}
      >
        {loading ? (
          <div className="py-12 text-center text-xs text-[#64748d]">Loading notification feed...</div>
        ) : filteredAlerts.length === 0 ? (
          <div className="py-12 text-center text-xs text-[#64748d] space-y-1">
            <CheckCircle2 className="w-8 h-8 text-[#059669] mx-auto mb-2 opacity-80" />
            <p className="font-medium text-[#061b31]">No alerts matching current filter.</p>
            <p className="text-[#64748d]">All monitored Mangaluru corridors operating within nominal ranges.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredAlerts.map(alert => {
              const isCritical = alert.severity === 'CRITICAL' || alert.severity === 'URGENT';
              return (
                <div
                  key={alert.id}
                  className={`p-4 rounded-sm border transition-all flex flex-col sm:flex-row sm:items-start justify-between gap-3 ${
                    !alert.is_read
                      ? isCritical
                        ? 'bg-[#fff5f5] border-[#fecaca]'
                        : 'bg-[#f0f4ff] border-[#d8dbff]'
                      : 'bg-white border-[#e5edf5]'
                  }`}
                >
                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-xs text-[#061b31]">
                        {alert.title}
                      </span>
                      <Badge status={alert.severity === 'CRITICAL' ? 'BLOCKED' : alert.severity === 'WARNING' ? 'CAUTION' : 'OPEN'}>
                        {alert.severity}
                      </Badge>
                      <span className="text-[10px] font-mono text-[#64748d]">
                        {alert.alert_type}
                      </span>
                    </div>

                    <p className="text-xs text-[#50617a] leading-relaxed">
                      {alert.message}
                    </p>

                    <div className="flex flex-wrap items-center gap-4 text-[11px] text-[#64748d] pt-1">
                      {alert.location_name && (
                        <span className="flex items-center gap-1 text-[#061b31] font-medium">
                          <MapPin className="w-3 h-3 text-[#533afd]" />
                          {alert.location_name}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(alert.created_at).toLocaleString('en-IN', {
                          timeZone: 'Asia/Kolkata',
                          dateStyle: 'short',
                          timeStyle: 'short'
                        })}
                      </span>
                    </div>
                  </div>

                  {!alert.is_read && (
                    <Button
                      onClick={() => handleAcknowledge(alert.id)}
                      variant="outline"
                      size="sm"
                      className="shrink-0 text-xs self-start"
                    >
                      <span>Acknowledge</span>
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
};
