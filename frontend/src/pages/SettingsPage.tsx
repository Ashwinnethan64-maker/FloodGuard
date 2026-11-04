import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { CheckCircle2, Bell, AlertCircle, Loader2 } from 'lucide-react';
import { requestFCMToken } from '../services/firebase';
import { apiClient } from '../services/api';

export const SettingsPage = () => {
  const { user } = useAuth();
  const [fcmLoading, setFcmLoading] = useState(false);
  const [fcmStatus, setFcmStatus] = useState<string | null>(null);
  const [fcmError, setFcmError] = useState<string | null>(null);

  const handleEnablePushNotifications = async () => {
    try {
      setFcmLoading(true);
      setFcmError(null);
      setFcmStatus(null);

      const res = await requestFCMToken();
      if (res.token) {
        // Register token with backend
        await apiClient.registerPushDevice(res.token, 'Resident Browser');
        setFcmStatus('Push notifications successfully enabled and registered with NEERPATH.');
      } else {
        setFcmError(res.error || 'Failed to acquire FCM notification token.');
      }
    } catch (err: any) {
      setFcmError(err.message || 'Error configuring push notifications.');
    } finally {
      setFcmLoading(false);
    }
  };

  return (
    <div className="max-w-4xl w-full mx-auto p-4 sm:p-6 flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold text-white">Profile & System Settings</h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Manage local Mangaluru telemetry filters and account preferences
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-cyan-600 to-blue-500 flex items-center justify-center text-white text-xl font-bold shadow-lg shadow-cyan-900/40 mb-3">
            {user?.full_name ? user.full_name[0] : 'U'}
          </div>
          <h2 className="text-sm font-bold text-white">{user?.full_name || 'Guest User'}</h2>
          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800 mt-1">
            {user?.role || 'Anonymous'}
          </span>
          <p className="text-xs text-slate-400 mt-2">{user?.email}</p>

          <div className="w-full mt-6 pt-4 border-t border-slate-800 text-left text-xs text-slate-400 flex flex-col gap-2">
            <div className="flex justify-between">
              <span>Jurisdiction:</span>
              <span className="text-slate-200">{user?.ward || 'Mangaluru'}</span>
            </div>
            <div className="flex justify-between">
              <span>Status:</span>
              <span className="text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Active
              </span>
            </div>
          </div>
        </div>

        {/* Configuration Preferences */}
        <div className="md:col-span-2 p-6 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col gap-5">
          <h3 className="text-sm font-bold text-white">GIS & Monsoonal Grid Preferences</h3>

          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
              <div>
                <span className="text-xs font-semibold text-white block">Auto-Sync Weather Station Telemetry</span>
                <span className="text-[11px] text-slate-500">Refreshes rainfall data every 5 minutes from Open-Meteo AWS</span>
              </div>
              <input type="checkbox" defaultChecked className="accent-cyan-500 rounded" />
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
              <div>
                <span className="text-xs font-semibold text-white block">Emergency Dispatch Audio Chimes</span>
                <span className="text-[11px] text-slate-500">Play tone when a road is marked BLOCKED by admin patrol</span>
              </div>
              <input type="checkbox" defaultChecked className="accent-cyan-500 rounded" />
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
              <div>
                <span className="text-xs font-semibold text-white block">High Contrast GIS Cartography</span>
                <span className="text-[11px] text-slate-500">Enhanced road line casing for night & heavy storm visibility</span>
              </div>
              <input type="checkbox" defaultChecked className="accent-cyan-500 rounded" />
            </div>

            {/* Firebase Cloud Messaging Web Push Card */}
            <div className="p-4 rounded-xl bg-cyan-950/20 border border-cyan-800/40 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs font-bold text-white">Browser Push Notifications (Firebase FCM)</span>
                </div>
                <button
                  type="button"
                  onClick={handleEnablePushNotifications}
                  disabled={fcmLoading}
                  className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-cyan-900/40"
                >
                  {fcmLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{fcmStatus ? 'Subscribed' : 'Enable Push Alerts'}</span>
                </button>
              </div>

              <p className="text-[11px] text-slate-400">
                Receive instant desktop/mobile push alerts for road blockages, flash waterlogging, and red alerts in Mangaluru.
              </p>

              {fcmStatus && (
                <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium bg-emerald-950/40 p-2 rounded-lg border border-emerald-800/40">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  <span>{fcmStatus}</span>
                </div>
              )}

              {fcmError && (
                <div className="flex items-center gap-1.5 text-xs text-amber-400 font-medium bg-amber-950/40 p-2 rounded-lg border border-amber-800/40">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{fcmError}</span>
                </div>
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800 text-[11px] text-slate-500">
            Platform: NEERPATH v1.0.0 | PostGIS Spatial Engine | Mangaluru (DK District)
          </div>
        </div>
      </div>
    </div>
  );
};
