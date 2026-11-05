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
import { Card, Button, Badge } from '../components/ui';

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
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#e5edf5]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-light text-[#061b31] tracking-tight">
              Live Guided Demonstration Console
            </h1>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-[4px] bg-[#fffbeb] text-[#d97706] border border-[#fde68a] uppercase tracking-wider">
              Simulation Mode
            </span>
          </div>
          <p className="text-xs text-[#64748d] mt-1">
            End-to-end interactive simulation proving the full FLOODGUARD telemetry, verification, and dynamic routing cycle.
          </p>
        </div>

        <Button
          onClick={handleReset}
          variant="outline"
          size="sm"
        >
          <RotateCcw className="w-3.5 h-3.5 text-[#533afd]" />
          <span>Reset Simulation</span>
        </Button>
      </div>

      {/* Prominent Provenance Disclaimer */}
      <div className="p-4 rounded-[4px] bg-white border border-[#e5edf5] text-xs text-[#50617a] flex items-start gap-3">
        <AlertTriangle className="w-4 h-4 text-[#d97706] shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <strong className="text-[#061b31]">DEMONSTRATION INTEGRITY CLAUSE:</strong> All activities triggered on this page simulate a heavy cloudburst event over Mangaluru. Records are explicitly attributed as <span className="font-semibold underline">SIMULATED DEMO</span> to prevent confusion with genuine municipal weather states.
        </div>
      </div>

      {/* 4 Interactive Guided Scenario Stages */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Step 1 */}
        <Card className={`p-5 flex flex-col justify-between transition-colors ${
          (demoStatus?.current_step || 0) >= 1 ? 'border-[#533afd] bg-[#e8e9ff]/30' : 'bg-white'
        }`}>
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-[#533afd]">Stage 01</span>
              <CloudRain className="w-4 h-4 text-[#533afd]" />
            </div>
            <h3 className="text-sm font-semibold text-[#061b31]">Monsoon Cloudburst</h3>
            <p className="text-xs text-[#64748d] mt-1 leading-relaxed">
              Triggers simulated 55 mm/hr downpour over coastal Mangaluru; updates gauge readings.
            </p>
          </div>

          <Button
            onClick={() => handleStep(1)}
            disabled={triggeringStep !== null}
            size="sm"
            variant={(demoStatus?.current_step || 0) >= 1 ? 'secondary' : 'primary'}
            className="mt-4 w-full justify-center"
          >
            {(demoStatus?.current_step || 0) >= 1 ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>{(demoStatus?.current_step || 0) >= 1 ? 'Triggered (Active)' : 'Trigger Rain Event'}</span>
          </Button>
        </Card>

        {/* Step 2 */}
        <Card className={`p-5 flex flex-col justify-between transition-colors ${
          (demoStatus?.current_step || 0) >= 2 ? 'border-[#533afd] bg-[#e8e9ff]/30' : 'bg-white'
        }`}>
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-[#d97706]">Stage 02</span>
              <Send className="w-4 h-4 text-[#d97706]" />
            </div>
            <h3 className="text-sm font-semibold text-[#061b31]">Citizen Flood Report</h3>
            <p className="text-xs text-[#64748d] mt-1 leading-relaxed">
              Submits citizen report at Kottara underpass. Status strictly set to UNVERIFIED & PENDING.
            </p>
          </div>

          <Button
            onClick={() => handleStep(2)}
            disabled={triggeringStep !== null}
            size="sm"
            variant={(demoStatus?.current_step || 0) >= 2 ? 'secondary' : 'primary'}
            className="mt-4 w-full justify-center"
          >
            {(demoStatus?.current_step || 0) >= 2 ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>{(demoStatus?.current_step || 0) >= 2 ? 'Report Logged' : 'Submit Citizen Report'}</span>
          </Button>
        </Card>

        {/* Step 3 */}
        <Card className={`p-5 flex flex-col justify-between transition-colors ${
          (demoStatus?.current_step || 0) >= 3 ? 'border-[#533afd] bg-[#e8e9ff]/30' : 'bg-white'
        }`}>
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-[#dc2626]">Stage 03</span>
              <UserCheck className="w-4 h-4 text-[#dc2626]" />
            </div>
            <h3 className="text-sm font-semibold text-[#061b31]">Admin Verification</h3>
            <p className="text-xs text-[#64748d] mt-1 leading-relaxed">
              Traffic Police verifies ground depth (65cm) and officially transitions road to BLOCKED.
            </p>
          </div>

          <Button
            onClick={() => handleStep(3)}
            disabled={triggeringStep !== null}
            size="sm"
            variant={(demoStatus?.current_step || 0) >= 3 ? 'secondary' : 'primary'}
            className="mt-4 w-full justify-center"
          >
            {(demoStatus?.current_step || 0) >= 3 ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>{(demoStatus?.current_step || 0) >= 3 ? 'Corridor Blocked' : 'Verify & Mark Blocked'}</span>
          </Button>
        </Card>

        {/* Step 4 */}
        <Card className={`p-5 flex flex-col justify-between transition-colors ${
          (demoStatus?.current_step || 0) >= 4 ? 'border-[#533afd] bg-[#e8e9ff]/30' : 'bg-white'
        }`}>
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-[#059669]">Stage 04</span>
              <Navigation className="w-4 h-4 text-[#059669]" />
            </div>
            <h3 className="text-sm font-semibold text-[#061b31]">Safe Recalculation</h3>
            <p className="text-xs text-[#64748d] mt-1 leading-relaxed">
              Router detects blocked underpass and dynamically bypasses via Elevated Kadri Ridge.
            </p>
          </div>

          <Button
            onClick={() => handleStep(4)}
            disabled={triggeringStep !== null}
            size="sm"
            variant={(demoStatus?.current_step || 0) >= 4 ? 'secondary' : 'primary'}
            className="mt-4 w-full justify-center"
          >
            {(demoStatus?.current_step || 0) >= 4 ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>{(demoStatus?.current_step || 0) >= 4 ? 'Bypass Computed' : 'Calculate Safe Bypass'}</span>
          </Button>
        </Card>
      </div>

      {/* Scenario Execution Log & Quick Navigation Links */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Step History Log */}
        <Card
          className="lg:col-span-2 p-5 flex flex-col gap-3"
          title={`Simulation Execution Audit Trail (${demoStatus?.steps_history.length || 0})`}
          subtitle="Real-time timeline of simulated event propagation"
        >
          {demoStatus?.steps_history.length === 0 ? (
            <div className="py-16 text-center text-[#64748d] text-xs">
              Click "Trigger Rain Event" above to initiate the live guided simulation.
            </div>
          ) : (
            <div className="flex flex-col gap-2.5">
              {demoStatus?.steps_history.map(s => (
                <div key={s.step_number} className="p-3.5 rounded-[4px] bg-[#f8fafd] border border-[#e5edf5] flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-[#061b31]">Stage {s.step_number}: {s.title}</span>
                    <span className="text-[10px] font-mono text-[#533afd]">
                      {new Date(s.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-xs text-[#50617a] leading-relaxed">
                    {s.description}
                  </p>
                  <span className="text-[10px] text-[#64748d] uppercase mt-1">
                    Affected Corridor: {s.affected_corridor}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Verification & Routing Quick Jump */}
        <Card
          className="p-5 flex flex-col justify-between"
          title="Inspect Live System State"
          subtitle="Direct links to view updated subsystems"
        >
          <div className="space-y-2 mt-2">
            <Link
              to="/routing"
              className="p-3 rounded-[4px] bg-[#f8fafd] border border-[#e5edf5] hover:border-[#533afd] text-xs font-medium text-[#061b31] flex items-center justify-between transition-colors"
            >
              <span>Inspect Flood Routes</span>
              <ArrowRight className="w-3.5 h-3.5 text-[#533afd]" />
            </Link>
            <Link
              to="/admin"
              className="p-3 rounded-[4px] bg-[#f8fafd] border border-[#e5edf5] hover:border-[#533afd] text-xs font-medium text-[#061b31] flex items-center justify-between transition-colors"
            >
              <span>Inspect Admin Verification Queue</span>
              <ArrowRight className="w-3.5 h-3.5 text-[#533afd]" />
            </Link>
            <Link
              to="/ai-engine"
              className="p-3 rounded-[4px] bg-[#f8fafd] border border-[#e5edf5] hover:border-[#533afd] text-xs font-medium text-[#061b31] flex items-center justify-between transition-colors"
            >
              <span>Inspect AI Risk Factor Weights</span>
              <ArrowRight className="w-3.5 h-3.5 text-[#533afd]" />
            </Link>
            <Link
              to="/responder"
              className="p-3 rounded-[4px] bg-[#f8fafd] border border-[#e5edf5] hover:border-[#533afd] text-xs font-medium text-[#061b31] flex items-center justify-between transition-colors"
            >
              <span>Inspect Responder Tactical Console</span>
              <ArrowRight className="w-3.5 h-3.5 text-[#533afd]" />
            </Link>
          </div>

          <div className="mt-4 pt-4 border-t border-[#f1f5f9] text-[10px] text-[#64748d]">
            FLOODGUARD Automated Scenario Test Harness • Mangaluru (DK District)
          </div>
        </Card>
      </div>

      {/* IoT Device Ingestion Grid */}
      <Card
        className="p-5 flex flex-col gap-3"
        title="Optional IoT Telemetry Ingestion Mesh (ESP32 & Ultrasonic Sensors)"
        subtitle="MQTT / REST Ingestion ready for municipal drainage deployment"
        headerAction={<Wifi className="w-4 h-4 text-[#533afd]" />}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {iotDevices.map(d => (
            <div key={d.device_id} className="p-4 rounded-[4px] bg-[#f8fafd] border border-[#e5edf5] flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#061b31]">{d.device_name}</span>
                  <Badge status="OPEN">{d.status}</Badge>
                </div>
                <span className="text-[10px] text-[#64748d] font-mono mt-0.5 block">{d.device_id}</span>
                <p className="text-xs text-[#50617a] mt-2">
                  Sensor Type: <strong className="text-[#061b31]">{d.sensor_type}</strong>
                </p>
                <p className="text-[11px] text-[#64748d]">
                  Ward: {d.ward}
                </p>
              </div>

              <div className="mt-3 pt-2 border-t border-[#e5edf5] text-[10px] text-[#64748d] flex justify-between items-center">
                <span className="flex items-center gap-1 text-[#059669] font-medium">
                  <Battery className="w-3.5 h-3.5" />
                  {d.battery_percentage}% battery
                </span>
                <span>Firmware: {d.firmware_version}</span>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};
