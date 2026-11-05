import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { CheckCircle2, Bell, AlertCircle, Loader2 } from 'lucide-react';
import { requestFCMToken } from '../services/firebase';
import { apiClient } from '../services/api';
import { Card, Button, Badge } from '../components/ui';

export const SettingsPage = () => {
  const { user } = useAuth();
  const [fcmLoading, setFcmLoading] = useState(false);
  const [fcmStatus, setFcmStatus] = useState<string | null>(null);
  const [fcmError, setFcmError] = useState<string | null>(null);
  const [fcmHelp, setFcmHelp] = useState<string | null>(null);

  const handleEnablePushNotifications = async () => {
    try {
      setFcmLoading(true);
      setFcmError(null);
      setFcmHelp(null);
      setFcmStatus(null);

      const res = await requestFCMToken();
      if (res.token) {
        await apiClient.registerPushDevice(res.token, 'Resident Browser');
        setFcmStatus('Push alerts successfully registered with NEERPATH emergency grid.');
      } else {
        setFcmError(res.error || 'Failed to acquire notification token.');
        if (res.errorDetails) {
          setFcmHelp(res.errorDetails);
        }
      }
    } catch (err: any) {
      setFcmError(err.message || 'Error configuring push notifications.');
    } finally {
      setFcmLoading(false);
    }
  };

  return (
    <div className="max-w-4xl w-full mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#e5edf5]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-light text-[#061b31] tracking-tight">
              Profile & System Preferences
            </h1>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-[4px] bg-[#e8e9ff] text-[#533afd] border border-[#d8dbff] uppercase tracking-wider">
              Workstation Settings
            </span>
          </div>
          <p className="text-xs text-[#64748d] mt-1">
            Manage local Mangaluru telemetry filters, dispatch alerts, and user account parameters.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Profile Card */}
        <Card className="p-6 flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-[4px] bg-[#e8e9ff] border border-[#d8dbff] text-[#533afd] flex items-center justify-center text-xl font-bold mb-3">
            {user?.full_name ? user.full_name[0] : 'U'}
          </div>
          <h2 className="text-sm font-semibold text-[#061b31]">{user?.full_name || 'Guest User'}</h2>
          <Badge status="OPEN" className="mt-1">
            {user?.role || 'Resident'}
          </Badge>
          <p className="text-xs text-[#64748d] mt-2">{user?.email}</p>

          <div className="w-full mt-6 pt-4 border-t border-[#f1f5f9] text-left text-xs text-[#64748d] space-y-2">
            <div className="flex justify-between">
              <span>Ward / Area:</span>
              <span className="text-[#061b31] font-medium">{user?.ward || 'Mangaluru'}</span>
            </div>
            <div className="flex justify-between">
              <span>Security State:</span>
              <span className="text-[#059669] flex items-center gap-1 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Active Session
              </span>
            </div>
          </div>
        </Card>

        {/* Configuration Preferences */}
        <div className="md:col-span-2 space-y-4">
          <Card
            className="p-6 space-y-4"
            title="GIS & Monsoonal Grid Preferences"
            subtitle="Configure automatic sync and audio indicators"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-[4px] bg-[#f8fafd] border border-[#e5edf5]">
                <div>
                  <span className="text-xs font-semibold text-[#061b31] block">Auto-Sync Weather Station Telemetry</span>
                  <span className="text-[11px] text-[#64748d]">Refreshes rainfall data every 5 minutes from Open-Meteo AWS</span>
                </div>
                <input type="checkbox" defaultChecked className="accent-[#533afd] rounded-[2px]" />
              </div>

              <div className="flex items-center justify-between p-3 rounded-[4px] bg-[#f8fafd] border border-[#e5edf5]">
                <div>
                  <span className="text-xs font-semibold text-[#061b31] block">Emergency Dispatch Audio Chimes</span>
                  <span className="text-[11px] text-[#64748d]">Play tone when a corridor is marked BLOCKED by admin patrol</span>
                </div>
                <input type="checkbox" defaultChecked className="accent-[#533afd] rounded-[2px]" />
              </div>

              <div className="flex items-center justify-between p-3 rounded-[4px] bg-[#f8fafd] border border-[#e5edf5]">
                <div>
                  <span className="text-xs font-semibold text-[#061b31] block">High Contrast GIS Cartography</span>
                  <span className="text-[11px] text-[#64748d]">Enhanced road line casing for night & heavy storm visibility</span>
                </div>
                <input type="checkbox" defaultChecked className="accent-[#533afd] rounded-[2px]" />
              </div>
            </div>
          </Card>

          {/* Browser Push Notifications (FCM) */}
          <Card
            id="notifications"
            className="p-6 space-y-3"
            title="Emergency Notification Feeds"
            subtitle="Browser push alerts powered by Firebase Cloud Messaging"
            headerAction={<Bell className="w-4 h-4 text-[#533afd]" />}
          >
            <p className="text-xs text-[#64748d] leading-relaxed">
              Receive immediate push notifications when red monsoon alerts are declared or arterial routes to Wenlock Hospital become impassable.
            </p>

            <Button
              type="button"
              onClick={handleEnablePushNotifications}
              disabled={fcmLoading}
              size="sm"
            >
              {fcmLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>{fcmStatus ? 'Subscribed to Alerts' : 'Enable Emergency Push Alerts'}</span>
            </Button>

            {fcmStatus && (
              <div className="flex items-center gap-2 text-xs text-[#059669] bg-[#ecfdf5] border border-[#a7f3d0] p-2.5 rounded-[4px]">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{fcmStatus}</span>
              </div>
            )}

            {fcmError && (
              <div className="space-y-1.5 bg-[#fef2f2] border border-[#fecaca] p-3 rounded-[4px]">
                <div className="flex items-start gap-2 text-xs text-[#dc2626]">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span className="font-medium">{fcmError}</span>
                </div>
                {fcmHelp && (
                  <p className="text-[11px] text-[#991b1b] pl-6 leading-relaxed">
                    {fcmHelp}
                  </p>
                )}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};
