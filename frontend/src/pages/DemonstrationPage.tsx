import { useEffect, useState } from 'react';
import { demoApiClient } from '../services/api';
import type { DemoScenarioStatus, IoTDeviceRegistration } from '../types/api';
import { 
  Play, 
  RotateCcw, 
  CloudRain, 
  Send, 
  UserCheck, 
  Navigation, 
  CheckCircle2, 
  AlertTriangle,
  Wifi,
  Battery,
  ArrowRight
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const DemonstrationPage = () => {
  const [demoStatus, setDemoStatus] = useState<DemoScenarioStatus | null>(null);
  const [iotDevices, setIoTDevices] = useState<IoTDeviceRegistration[]>([]);
  const [, setLoading] = useState(true);
  const [triggeringStep, setTriggeringStep] = useState<number | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [status, devices] = await Promise.all([
        demoApiClient.getStatus(),
        demoApiClient.getIoTDevices(),
      ]);
      setDemoStatus(status);
      setIoTDevices(devices);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleStep = async (stepNum: number) => {
    try {
      setTriggeringStep(stepNum);
      if (stepNum === 1) await demoApiClient.triggerStep1();
      else if (stepNum === 2) await demoApiClient.triggerStep2();
      else if (stepNum === 3) await demoApiClient.triggerStep3();
      else if (stepNum === 4) await demoApiClient.triggerStep4();
      await loadData();
    } catch (err) {
      alert(`Simulation step ${stepNum} failed`);
    } finally {
      setTriggeringStep(null);
    }
  };

  const handleReset = async () => {
    try {
      setLoading(true);
      await demoApiClient.reset();
      await loadData();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl w-full mx-auto p-4 sm:p-6 flex flex-col gap-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-cyan-950 border border-cyan-800 flex items-center justify-center text-cyan-400">
              <Play className="w-4 h-4 fill-cyan-400" />
            </div>
            <h1 className="text-xl font-bold text-white">Live Guided Demonstration Console</h1>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-950 text-amber-400 border border-amber-800 uppercase tracking-wider">
              Simulation Mode
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            End-to-end interactive simulation proving the full NEERPATH intelligence and routing cycle
          </p>
        </div>

        <button
          onClick={handleReset}
          className="self-start sm:self-auto flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5 text-cyan-400" />
          <span>Reset Simulation</span>
        </button>
      </div>

      {/* Prominent Provenance Disclaimer */}
      <div className="p-4 rounded-xl bg-purple-950/30 border border-purple-800/60 text-xs text-purple-200 flex items-start gap-3">
        <AlertTriangle className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <strong className="text-purple-300">DEMO INTEGRITY CLAUSE:</strong> All activities triggered on this page simulate a heavy monsoon cloudburst event over Mangaluru. Records are explicitly attributed as <span className="font-bold underline">SIMULATED DEMO</span> to prevent confusion with real municipal emergencies.
        </div>
      </div>

      {/* 4 Interactive Guided Scenario Stages */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Step 1 */}
        <div className={`p-5 rounded-2xl border flex flex-col justify-between transition-all ${
          (demoStatus?.current_step || 0) >= 1
            ? 'bg-slate-900/90 border-cyan-500/60 shadow-lg shadow-cyan-950/50'
            : 'bg-slate-900/50 border-slate-800 opacity-80'
        }`}>
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400">Stage 01</span>
              <CloudRain className="w-4 h-4 text-cyan-400" />
            </div>
            <h3 className="text-sm font-bold text-white">Heavy Monsoon Cloudburst</h3>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Triggers simulated 55 mm/hr downpour over coastal Mangaluru; updates AWS sensors.
            </p>
          </div>

          <button
            onClick={() => handleStep(1)}
            disabled={triggeringStep !== null}
            className={`mt-4 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              (demoStatus?.current_step || 0) >= 1
                ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                : 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-sm'
            }`}
          >
            {(demoStatus?.current_step || 0) >= 1 ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>{(demoStatus?.current_step || 0) >= 1 ? 'Triggered (Active)' : 'Trigger Rain Event'}</span>
          </button>
        </div>

        {/* Step 2 */}
        <div className={`p-5 rounded-2xl border flex flex-col justify-between transition-all ${
          (demoStatus?.current_step || 0) >= 2
            ? 'bg-slate-900/90 border-cyan-500/60 shadow-lg shadow-cyan-950/50'
            : 'bg-slate-900/50 border-slate-800 opacity-80'
        }`}>
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400">Stage 02</span>
              <Send className="w-4 h-4 text-amber-400" />
            </div>
            <h3 className="text-sm font-bold text-white">Citizen Flood Report</h3>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Submits citizen report at Kottara underpass. Status strictly set to UNVERIFIED & PENDING.
            </p>
          </div>

          <button
            onClick={() => handleStep(2)}
            disabled={triggeringStep !== null}
            className={`mt-4 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              (demoStatus?.current_step || 0) >= 2
                ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                : 'bg-amber-600 hover:bg-amber-500 text-white shadow-sm'
            }`}
          >
            {(demoStatus?.current_step || 0) >= 2 ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>{(demoStatus?.current_step || 0) >= 2 ? 'Report Logged' : 'Submit Citizen Report'}</span>
          </button>
        </div>

        {/* Step 3 */}
        <div className={`p-5 rounded-2xl border flex flex-col justify-between transition-all ${
          (demoStatus?.current_step || 0) >= 3
            ? 'bg-slate-900/90 border-cyan-500/60 shadow-lg shadow-cyan-950/50'
            : 'bg-slate-900/50 border-slate-800 opacity-80'
        }`}>
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400">Stage 03</span>
              <UserCheck className="w-4 h-4 text-rose-400" />
            </div>
            <h3 className="text-sm font-bold text-white">Admin Verification</h3>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Traffic Police verifies ground depth (65cm) and officially transitions road to BLOCKED.
            </p>
          </div>

          <button
            onClick={() => handleStep(3)}
            disabled={triggeringStep !== null}
            className={`mt-4 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              (demoStatus?.current_step || 0) >= 3
                ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                : 'bg-rose-600 hover:bg-rose-500 text-white shadow-sm'
            }`}
          >
            {(demoStatus?.current_step || 0) >= 3 ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>{(demoStatus?.current_step || 0) >= 3 ? 'Corridor Blocked' : 'Verify & Mark Blocked'}</span>
          </button>
        </div>

        {/* Step 4 */}
        <div className={`p-5 rounded-2xl border flex flex-col justify-between transition-all ${
          (demoStatus?.current_step || 0) >= 4
            ? 'bg-slate-900/90 border-cyan-500/60 shadow-lg shadow-cyan-950/50'
            : 'bg-slate-900/50 border-slate-800 opacity-80'
        }`}>
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400">Stage 04</span>
              <Navigation className="w-4 h-4 text-emerald-400" />
            </div>
            <h3 className="text-sm font-bold text-white">Safe Routing Recalculation</h3>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Router detects blocked underpass and dynamically bypasses via Elevated Kadri Ridge.
            </p>
          </div>

          <button
            onClick={() => handleStep(4)}
            disabled={triggeringStep !== null}
            className={`mt-4 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              (demoStatus?.current_step || 0) >= 4
                ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm'
            }`}
          >
            {(demoStatus?.current_step || 0) >= 4 ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>{(demoStatus?.current_step || 0) >= 4 ? 'Bypass Computed' : 'Calculate Safe Bypass'}</span>
          </button>
        </div>
      </div>

      {/* Scenario Execution Log & Quick Navigation Links */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Step History Log */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col gap-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Simulation Execution Audit Trail ({demoStatus?.steps_history.length || 0})
            </h3>
            <span className="text-[10px] text-cyan-400 font-mono">Real-time Progression</span>
          </div>

          {demoStatus?.steps_history.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-xs">
              Click "Trigger Rain Event" above to initiate the live guided simulation.
            </div>
          ) : (
            <div className="flex flex-col gap-2.5">
              {demoStatus?.steps_history.map(s => (
                <div key={s.step_number} className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">Stage {s.step_number}: {s.title}</span>
                    <span className="text-[10px] font-mono text-cyan-400">
                      {new Date(s.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {s.description}
                  </p>
                  <span className="text-[10px] text-slate-500 uppercase mt-1">
                    Affected Corridor: {s.affected_corridor}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Verification & Routing Quick Jump */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-2">
              Inspect Live System State
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Jump directly to core platform interfaces to inspect how the simulated events updated the system:
            </p>

            <div className="flex flex-col gap-2 mt-4">
              <Link
                to="/routing"
                className="p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-cyan-500/50 text-xs font-semibold text-slate-200 flex items-center justify-between"
              >
                <span>Inspect Flood Routes</span>
                <ArrowRight className="w-3.5 h-3.5 text-cyan-400" />
              </Link>
              <Link
                to="/admin"
                className="p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-cyan-500/50 text-xs font-semibold text-slate-200 flex items-center justify-between"
              >
                <span>Inspect Admin Verification Queue</span>
                <ArrowRight className="w-3.5 h-3.5 text-cyan-400" />
              </Link>
              <Link
                to="/ai-engine"
                className="p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-cyan-500/50 text-xs font-semibold text-slate-200 flex items-center justify-between"
              >
                <span>Inspect AI Risk Factor Weights</span>
                <ArrowRight className="w-3.5 h-3.5 text-cyan-400" />
              </Link>
              <Link
                to="/responder"
                className="p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-cyan-500/50 text-xs font-semibold text-slate-200 flex items-center justify-between"
              >
                <span>Inspect Responder Tactical Console</span>
                <ArrowRight className="w-3.5 h-3.5 text-cyan-400" />
              </Link>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-800 text-[10px] text-slate-500">
            NEERPATH Automated Scenario Test Harness | Mangaluru (DK District)
          </div>
        </div>
      </div>

      {/* Optional Future IoT Device Ingestion Grid */}
      <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col gap-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Wifi className="w-4 h-4 text-cyan-400" />
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Optional IoT Telemetry Ingestion Mesh (ESP32 & Ultrasonic Sensors)
            </h3>
          </div>
          <span className="text-[10px] text-emerald-400 font-bold">MQTT / REST Ingestion Ready</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {iotDevices.map(d => (
            <div key={d.device_id} className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">{d.device_name}</span>
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                    {d.status}
                  </span>
                </div>
                <span className="text-[10px] text-slate-500 font-mono mt-0.5 block">{d.device_id}</span>
                <p className="text-xs text-slate-400 mt-2">
                  Sensor Type: <strong className="text-slate-300">{d.sensor_type}</strong>
                </p>
                <p className="text-[11px] text-slate-400">
                  Ward: {d.ward}
                </p>
              </div>

              <div className="mt-3 pt-2 border-t border-slate-800 text-[10px] text-slate-500 flex justify-between items-center">
                <span className="flex items-center gap-1 text-cyan-400">
                  <Battery className="w-3.5 h-3.5" />
                  {d.battery_percentage}% battery
                </span>
                <span>Firmware: {d.firmware_version}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
