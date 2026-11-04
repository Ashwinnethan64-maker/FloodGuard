import type { 
  RoadSegment, 
  FloodIncident, 
  WeatherSummary, 
  RoadStatus, 
  VerificationStatus, 
  IncidentCategory, 
  WaterDepthCategory, 
  SeverityLevel,
  RoadRiskAssessment,
  HotspotAnalysisResponse,
  ModelEvaluationMetrics,
  RoutePlanResponse,
  SystemAlert,
  ResponderTacticalSummary,
  DemoScenarioStatus,
  IoTDeviceRegistration
} from '../types/api';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

export interface DashboardSummary {
  data_mode: string;
  metrics: {
    total_incidents_reported: number;
    active_verified_incidents: number;
    pending_citizen_reports: number;
    rejected_reports: number;
    resolved_incidents: number;
    roads_caution_count: number;
    roads_blocked_count: number;
    roads_open_count: number;
    roads_unverified_count: number;
    monitored_corridors_total: number;
  };
  recent_incidents: FloodIncident[];
  high_risk_corridors: RoadSegment[];
}

export interface IncidentSubmitPayload {
  location_name: string;
  incident_category: IncidentCategory;
  description?: string;
  reported_water_depth: WaterDepthCategory;
  severity: SeverityLevel;
  observed_time?: string;
  passable_two_wheelers: boolean;
  passable_four_wheelers: boolean;
  passable_emergency_vehicles: boolean;
  latitude: number;
  longitude: number;
  image_url?: string;
  reporter_name?: string;
}

export interface IncidentVerifyPayload {
  verified: boolean;
  status: VerificationStatus;
  new_road_status?: RoadStatus;
  verification_notes?: string;
  verified_by?: string;
}

export const apiClient = {
  async getHealth() {
    const res = await fetch(`${API_BASE}/health`);
    if (!res.ok) throw new Error(`Health check failed: ${res.statusText}`);
    return res.json();
  },

  async getDashboardSummary(): Promise<DashboardSummary> {
    const res = await fetch(`${API_BASE}/dashboard/summary`);
    if (!res.ok) throw new Error(`Dashboard summary failed: ${res.statusText}`);
    return res.json();
  },

  async getRoads(status?: RoadStatus): Promise<RoadSegment[]> {
    const url = status ? `${API_BASE}/roads?status=${status}` : `${API_BASE}/roads`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to fetch roads: ${res.statusText}`);
    return res.json();
  },

  async getRoadById(roadId: string): Promise<RoadSegment> {
    const res = await fetch(`${API_BASE}/roads/${roadId}`);
    if (!res.ok) throw new Error(`Failed to fetch road details: ${res.statusText}`);
    return res.json();
  },

  async getIncidents(status?: VerificationStatus): Promise<FloodIncident[]> {
    const url = status ? `${API_BASE}/incidents?status=${status}` : `${API_BASE}/incidents`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to fetch incidents: ${res.statusText}`);
    return res.json();
  },

  async getIncidentById(incidentId: string): Promise<FloodIncident> {
    const res = await fetch(`${API_BASE}/incidents/${incidentId}`);
    if (!res.ok) throw new Error(`Failed to fetch incident details: ${res.statusText}`);
    return res.json();
  },

  async getWeather(lat = 12.9141, lon = 74.8560, refresh = false): Promise<WeatherSummary> {
    const url = `${API_BASE}/weather?lat=${lat}&lon=${lon}${refresh ? '&refresh=true' : ''}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to fetch weather: ${res.statusText}`);
    return res.json();
  },

  async submitIncident(payload: IncidentSubmitPayload): Promise<FloodIncident> {
    const res = await fetch(`${API_BASE}/incidents`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`Failed to submit incident: ${res.statusText}`);
    return res.json();
  },

  async uploadIncidentImage(file: File): Promise<{ status: string; image_url: string; filename: string }> {
    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch(`${API_BASE}/incidents/upload-image`, {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || `Image upload failed: ${res.statusText}`);
    }
    return res.json();
  },

  async verifyIncident(incidentId: string, payload: IncidentVerifyPayload): Promise<FloodIncident> {
    const res = await fetch(`${API_BASE}/incidents/${incidentId}/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`Failed to verify incident: ${res.statusText}`);
    return res.json();
  },

  async registerPushDevice(token: string, deviceLabel = 'Web Browser'): Promise<{ status: string; registered: boolean; active_subscribers_count: number }> {
    const res = await fetch(`${API_BASE}/alerts/register-device`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, device_label: deviceLabel })
    });
    if (!res.ok) throw new Error(`Failed to register push device: ${res.statusText}`);
    return res.json();
  },
};
// Phase 3 AI Intelligence Client Methods
export const aiApiClient = {
  async getRoadRisks(): Promise<RoadRiskAssessment[]> {
    const res = await fetch(`${API_BASE}/ai/road-risk`);
    if (!res.ok) throw new Error(`Failed to fetch road risk assessments: ${res.statusText}`);
    return res.json();
  },

  async getSingleRoadRisk(roadId: string): Promise<RoadRiskAssessment> {
    const res = await fetch(`${API_BASE}/ai/road-risk/${roadId}`);
    if (!res.ok) throw new Error(`Failed to fetch road risk for ${roadId}: ${res.statusText}`);
    return res.json();
  },

  async getHotspotAnalysis(): Promise<HotspotAnalysisResponse> {
    const res = await fetch(`${API_BASE}/ai/hotspots`);
    if (!res.ok) throw new Error(`Failed to fetch hotspot analysis: ${res.statusText}`);
    return res.json();
  },

  async getModelInfo(): Promise<ModelEvaluationMetrics> {
    const res = await fetch(`${API_BASE}/ai/model-info`);
    if (!res.ok) throw new Error(`Failed to fetch model info: ${res.statusText}`);
    return res.json();
  },

  async classifyText(text: string, location = ''): Promise<any> {
    const res = await fetch(`${API_BASE}/ai/classify-report?text=${encodeURIComponent(text)}&location=${encodeURIComponent(location)}`, {
      method: 'POST'
    });
    if (!res.ok) throw new Error(`Classification failed: ${res.statusText}`);
    return res.json();
  }
};
// Phase 4 Routing & Dispatch API Methods
export const routingApiClient = {
  async planRoute(
    originLat: number,
    originLon: number,
    destLat: number,
    destLon: number,
    originName: string,
    destName: string,
    profile = 'driving-car'
  ): Promise<RoutePlanResponse> {
    const params = new URLSearchParams({
      origin_lat: originLat.toString(),
      origin_lon: originLon.toString(),
      dest_lat: destLat.toString(),
      dest_lon: destLon.toString(),
      origin_name: originName,
      dest_name: destName,
      profile
    });
    const res = await fetch(`${API_BASE}/routing/plan?${params.toString()}`);
    if (!res.ok) throw new Error(`Routing evaluation failed: ${res.statusText}`);
    return res.json();
  },

  async getPresets(): Promise<{ locations: { name: string; coordinates: [number, number] }[] }> {
    const res = await fetch(`${API_BASE}/routing/presets`);
    if (!res.ok) throw new Error(`Failed to fetch routing presets: ${res.statusText}`);
    return res.json();
  },

  async getAlerts(limit = 20): Promise<SystemAlert[]> {
    const res = await fetch(`${API_BASE}/alerts?limit=${limit}`);
    if (!res.ok) throw new Error(`Failed to fetch alerts: ${res.statusText}`);
    return res.json();
  },

  async acknowledgeAlert(alertId: string): Promise<any> {
    const res = await fetch(`${API_BASE}/alerts/${alertId}/ack`, { method: 'POST' });
    if (!res.ok) throw new Error(`Failed to acknowledge alert: ${res.statusText}`);
    return res.json();
  },

  async getResponderTacticalSummary(): Promise<ResponderTacticalSummary> {
    const res = await fetch(`${API_BASE}/responder/tactical-summary`);
    if (!res.ok) throw new Error(`Failed to fetch tactical summary: ${res.statusText}`);
    return res.json();
  }
};
// Phase 5 Demo & IoT Client Methods
export const demoApiClient = {
  async getStatus(): Promise<DemoScenarioStatus> {
    const res = await fetch(`${API_BASE}/demo/status`);
    if (!res.ok) throw new Error(`Failed to fetch demo status: ${res.statusText}`);
    return res.json();
  },

  async triggerStep1(): Promise<any> {
    const res = await fetch(`${API_BASE}/demo/trigger-step-1`, { method: 'POST' });
    if (!res.ok) throw new Error(`Step 1 failed: ${res.statusText}`);
    return res.json();
  },

  async triggerStep2(): Promise<any> {
    const res = await fetch(`${API_BASE}/demo/trigger-step-2`, { method: 'POST' });
    if (!res.ok) throw new Error(`Step 2 failed: ${res.statusText}`);
    return res.json();
  },

  async triggerStep3(): Promise<any> {
    const res = await fetch(`${API_BASE}/demo/trigger-step-3`, { method: 'POST' });
    if (!res.ok) throw new Error(`Step 3 failed: ${res.statusText}`);
    return res.json();
  },

  async triggerStep4(): Promise<any> {
    const res = await fetch(`${API_BASE}/demo/trigger-step-4`, { method: 'POST' });
    if (!res.ok) throw new Error(`Step 4 failed: ${res.statusText}`);
    return res.json();
  },

  async reset(): Promise<any> {
    const res = await fetch(`${API_BASE}/demo/reset`, { method: 'POST' });
    if (!res.ok) throw new Error(`Reset failed: ${res.statusText}`);
    return res.json();
  },

  async getIoTDevices(): Promise<IoTDeviceRegistration[]> {
    const res = await fetch(`${API_BASE}/iot/devices`);
    if (!res.ok) throw new Error(`Failed to fetch IoT devices: ${res.statusText}`);
    return res.json();
  },

  async registerPushDevice(token: string, deviceLabel = 'Web Browser'): Promise<{ status: string; registered: boolean; active_subscribers_count: number }> {
    const res = await fetch(`${API_BASE}/alerts/register-device`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, device_label: deviceLabel })
    });
    if (!res.ok) throw new Error(`Failed to register push device: ${res.statusText}`);
    return res.json();
  }
};
