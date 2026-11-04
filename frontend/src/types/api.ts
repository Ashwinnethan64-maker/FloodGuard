export type RoadStatus = 'OPEN' | 'CAUTION' | 'BLOCKED' | 'UNVERIFIED';

export type DataSource =
  | 'WEATHER_STATION'
  | 'WEATHER_FORECAST'
  | 'CITIZEN_REPORT'
  | 'ADMIN_VERIFIED'
  | 'AI_ESTIMATE'
  | 'SIMULATED_DEMO';

export type SeverityLevel = 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type IncidentCategory =
  | 'ROAD_INUNDATION'
  | 'UNDERPASS_FLOODING'
  | 'DRAIN_OVERFLOW'
  | 'LANDSLIDE_MUDSLIDE'
  | 'TREE_FALL_HAZARD'
  | 'RIVER_BACKFLOW'
  | 'GENERAL_WATERLOGGING';

export type WaterDepthCategory =
  | 'DRY'
  | 'DAMP_WET'
  | 'ANKLE_DEEP'
  | 'KNEE_DEEP'
  | 'WAIST_DEEP'
  | 'SUBMERGED';

export type VerificationStatus = 'PENDING' | 'VERIFIED' | 'REJECTED' | 'RESOLVED';

export interface GeoPoint {
  type: 'Point';
  coordinates: [number, number]; // [lng, lat]
}

export interface GeoLineString {
  type: 'LineString';
  coordinates: [number, number][]; // array of [lng, lat]
}

export interface VerificationLogEntry {
  id: string;
  verified_by_user: string;
  action: string;
  assigned_road_status?: RoadStatus;
  notes?: string;
  timestamp: string;
}

export interface DuplicateCandidate {
  incident_id: string;
  location_name: string;
  distance_meters: number;
  time_difference_minutes: number;
  text_similarity_score: number;
  reason: string;
}

export interface RoadSegment {
  id: string;
  name: string;
  ward: string;
  elevation_meters: number;
  historical_flood_risk_score: number;
  current_status: RoadStatus;
  current_severity: SeverityLevel;
  current_water_depth_cm: number;
  confidence_score: number;
  last_source: DataSource;
  geometry: GeoLineString;
  created_at: string;
  updated_at: string;
}

export interface FloodIncident {
  id: string;
  road_segment_id?: string;
  location_name: string;
  incident_category: IncidentCategory;
  description?: string;
  reported_water_depth: WaterDepthCategory;
  estimated_depth_cm?: number;
  severity: SeverityLevel;
  observed_time: string;
  passable_two_wheelers: boolean;
  passable_four_wheelers: boolean;
  passable_emergency_vehicles: boolean;
  source: DataSource;
  verification_status: VerificationStatus;
  verification_notes?: string;
  verification_history: VerificationLogEntry[];
  potential_duplicates: DuplicateCandidate[];
  ai_confidence_score?: number;
  ai_tags: string[];
  image_url?: string;
  reporter_name?: string;
  geometry: GeoPoint;
  created_at: string;
  updated_at: string;
}

export interface WeatherObservation {
  station_name: string;
  latitude: number;
  longitude: number;
  temperature_celsius: number;
  relative_humidity_pct: number;
  current_precipitation_rate_mm_h: number;
  observed_weather_code: number;
  observed_condition: string;
  wind_speed_kmh: number;
  wind_direction_degrees?: number;
  surface_pressure_hpa?: number;
  source: DataSource;
  observation_timestamp: string;
  retrieved_at: string;
}

export interface HourlyForecastItem {
  forecast_time: string;
  precipitation_amount_mm: number;
  precipitation_probability_pct: number;
  temperature_celsius: number;
  wind_speed_kmh: number;
  condition: string;
  is_forecast: boolean;
}

export interface DailyForecastItem {
  date: string;
  precipitation_sum_mm: number;
  rain_sum_mm: number;
  is_forecast: boolean;
}

export interface WeatherSummary {
  location: string;
  data_provenance: string;
  current_observation: WeatherObservation;
  twenty_four_hour_accumulated_mm: number;
  monsoon_alert_level: string;
  is_cached: boolean;
  cache_age_seconds: number;
  hourly_forecast: HourlyForecastItem[];
  daily_forecast?: DailyForecastItem[];
}
// Add Phase 3 AI Intelligence Types
export type RiskCategory = 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL' | 'INSUFFICIENT_DATA';

export interface RiskFactorBreakdown {
  factor_name: string;
  weight: number;
  raw_value: number;
  normalized_score: number;
  weighted_contribution: number;
  explanation: string;
}

export interface RoadRiskAssessment {
  road_id: string;
  road_name: string;
  ward: string;
  risk_category: RiskCategory;
  composite_risk_score: number;
  data_completeness_pct: number;
  confidence_level: 'HIGH' | 'MEDIUM' | 'LOW';
  contributing_factors: RiskFactorBreakdown[];
  plain_language_explanation: string;
  mitigation_advisory: string;
  assumptions_note: string;
  model_version: string;
  calculated_at: string;
  data_sources_used: string[];
}

export interface ModelEvaluationMetrics {
  model_name: string;
  status: string;
  test_accuracy: number;
  test_f1_macro: number;
  training_samples_count: number;
  test_samples_count: number;
  feature_importances: Record<string, number>;
  provenance_note: string;
}

export interface HotspotVulnerability {
  corridor_id: string;
  corridor_name: string;
  ward: string;
  elevation_msl_meters: number;
  historical_vulnerability_index: number;
  typical_bottleneck_reason: string;
  current_status: RoadStatus;
}

export interface HotspotAnalysisResponse {
  region: string;
  vulnerability_analysis: HotspotVulnerability[];
  drainage_convergence_zones: string[];
}
// Phase 4 Routing & Emergency Response Types
export interface RouteSegmentEvaluation {
  segment_id: string;
  road_name: string;
  status: RoadStatus;
  risk_score: number;
  water_depth_cm: number;
  is_blocked: boolean;
  penalty_multiplier: number;
  warning_message?: string;
}

export interface EvaluatedRoute {
  route_id: string;
  label: string;
  profile: string;
  distance_km: number;
  estimated_duration_minutes: number;
  composite_flood_risk_score: number;
  risk_tier: 'LOW' | 'MODERATE' | 'HIGH' | 'IMPASSABLE';
  is_viable: boolean;
  contains_blocked_segment: boolean;
  safety_disclaimer: string;
  route_geometry: GeoLineString;
  evaluated_segments: RouteSegmentEvaluation[];
  summary_explanation: string;
  rank: number;
}

export interface RoutePlanResponse {
  origin_name: string;
  destination_name: string;
  origin_coordinates: [number, number];
  destination_coordinates: [number, number];
  profile: string;
  routes: EvaluatedRoute[];
  no_viable_route_found: boolean;
  general_monsoon_advisory: string;
  evaluated_at: string;
}

export interface SystemAlert {
  id: string;
  title: string;
  message: string;
  severity: 'INFO' | 'WARNING' | 'URGENT' | 'CRITICAL';
  alert_type: string;
  location_name?: string;
  affected_corridor_id?: string;
  coordinates?: [number, number];
  is_read: boolean;
  created_at: string;
}

export interface ResponderTacticalSummary {
  tactical_timestamp: string;
  monitored_region: string;
  summary_counts: {
    impassable_roads_count: number;
    caution_roads_count: number;
    urgent_incidents_active: number;
  };
  critical_blocked_roads: {
    id: string;
    name: string;
    ward: string;
    water_depth_cm: number;
    coordinates: [number, number][];
  }[];
  emergency_hospital_arteries: {
    facility: string;
    access_corridor: string;
    accessibility: string;
    risk_tier: string;
  }[];
  active_alerts: SystemAlert[];
}
// Phase 5 Demo & IoT Types
export interface DemoStep {
  step_number: number;
  title: string;
  description: string;
  status: string;
  affected_corridor: string;
  provenance_tag: string;
  timestamp: string;
}

export interface DemoScenarioStatus {
  scenario_name: string;
  is_active: boolean;
  current_step: number;
  steps_history: DemoStep[];
  simulated_rain_intensity_mm_h: number;
  blocked_road_name: string;
  alternative_route_name: string;
  active_advisory: string;
}

export interface IoTDeviceRegistration {
  device_id: string;
  device_name: string;
  sensor_type: string;
  corridor_id: string;
  ward: string;
  latitude: number;
  longitude: number;
  firmware_version: string;
  battery_percentage: number;
  status: string;
  last_heartbeat: string;
}

// Google Gemini AI Intelligence Types
export interface GeminiIncidentAnalysis {
  category_suggestion: string;
  urgency_tier: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  estimated_water_depth_cm?: number | null;
  passable_vehicles: {
    two_wheelers: boolean;
    four_wheelers: boolean;
    emergency_vehicles: boolean;
  };
  key_hazards: string[];
  is_suspicious_or_spam: boolean;
  suspicion_reason?: string | null;
  tactical_summary: string;
  confidence_score: number;
}

export interface GeminiRiskExplanation {
  corridor_name: string;
  flood_risk_level: string;
  geomorphology_factor: string;
  monsoon_context: string;
  recommended_action: string;
  alternative_route_tip: string;
}
