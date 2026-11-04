from enum import Enum
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
import uuid

class RoadStatus(str, Enum):
    OPEN = "OPEN"
    CAUTION = "CAUTION"
    BLOCKED = "BLOCKED"
    UNVERIFIED = "UNVERIFIED"

class DataSource(str, Enum):
    WEATHER_STATION = "WEATHER_STATION"
    WEATHER_FORECAST = "WEATHER_FORECAST"
    CITIZEN_REPORT = "CITIZEN_REPORT"
    ADMIN_VERIFIED = "ADMIN_VERIFIED"
    AI_ESTIMATE = "AI_ESTIMATE"
    SIMULATED_DEMO = "SIMULATED_DEMO"

class SeverityLevel(str, Enum):
    NONE = "NONE"
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"

class IncidentCategory(str, Enum):
    ROAD_INUNDATION = "ROAD_INUNDATION"
    UNDERPASS_FLOODING = "UNDERPASS_FLOODING"
    DRAIN_OVERFLOW = "DRAIN_OVERFLOW"
    LANDSLIDE_MUDSLIDE = "LANDSLIDE_MUDSLIDE"
    TREE_FALL_HAZARD = "TREE_FALL_HAZARD"
    RIVER_BACKFLOW = "RIVER_BACKFLOW"
    GENERAL_WATERLOGGING = "GENERAL_WATERLOGGING"

class WaterDepthCategory(str, Enum):
    DRY = "DRY"
    DAMP_WET = "DAMP_WET"
    ANKLE_DEEP = "ANKLE_DEEP"       # ~5-15 cm
    KNEE_DEEP = "KNEE_DEEP"         # ~15-40 cm
    WAIST_DEEP = "WAIST_DEEP"       # ~40-90 cm
    SUBMERGED = "SUBMERGED"         # >90 cm

class VerificationStatus(str, Enum):
    PENDING = "PENDING"
    VERIFIED = "VERIFIED"
    REJECTED = "REJECTED"
    RESOLVED = "RESOLVED"

# GeoJSON Geometry representations
class GeoPoint(BaseModel):
    type: str = "Point"
    coordinates: List[float] = Field(..., description="[longitude, latitude]")

class GeoLineString(BaseModel):
    type: str = "LineString"
    coordinates: List[List[float]] = Field(..., description="Array of [lng, lat]")

# Verification Log
class VerificationLogEntry(BaseModel):
    id: str = Field(default_factory=lambda: f"vlog-{uuid.uuid4().hex[:8]}")
    verified_by_user: str
    action: str  # VERIFIED, REJECTED, RESOLVED, STATUS_CHANGED
    assigned_road_status: Optional[RoadStatus] = None
    notes: Optional[str] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)

# Potential Duplicate Reference
class DuplicateCandidate(BaseModel):
    incident_id: str
    location_name: str
    distance_meters: float
    time_difference_minutes: float
    text_similarity_score: float
    reason: str

# Road Segment Schemas
class RoadSegmentBase(BaseModel):
    name: str
    ward: str
    elevation_meters: float = 10.0
    historical_flood_risk_score: float = Field(0.0, ge=0.0, le=1.0)
    current_status: RoadStatus = RoadStatus.OPEN
    current_severity: SeverityLevel = SeverityLevel.NONE
    current_water_depth_cm: float = 0.0
    confidence_score: float = Field(1.0, ge=0.0, le=1.0)
    last_source: DataSource = DataSource.AI_ESTIMATE

class RoadSegmentCreate(RoadSegmentBase):
    coordinates: List[List[float]]

class RoadSegmentResponse(RoadSegmentBase):
    id: str
    geometry: GeoLineString
    created_at: datetime
    updated_at: datetime

# Flood Incident Schemas
class IncidentCreate(BaseModel):
    location_name: str
    incident_category: IncidentCategory = IncidentCategory.ROAD_INUNDATION
    description: Optional[str] = None
    reported_water_depth: WaterDepthCategory = WaterDepthCategory.ANKLE_DEEP
    severity: SeverityLevel = SeverityLevel.MEDIUM
    observed_time: Optional[datetime] = None
    passable_two_wheelers: bool = True
    passable_four_wheelers: bool = True
    passable_emergency_vehicles: bool = True
    latitude: float
    longitude: float
    image_url: Optional[str] = None
    reporter_name: Optional[str] = "Anonymous Commuter"
    reporter_contact: Optional[str] = None
    source: DataSource = DataSource.CITIZEN_REPORT

class IncidentVerifyRequest(BaseModel):
    verified: bool
    status: VerificationStatus = VerificationStatus.VERIFIED
    new_road_status: Optional[RoadStatus] = None
    verification_notes: Optional[str] = None
    verified_by: Optional[str] = "Admin Dispatcher"

class IncidentResponse(BaseModel):
    id: str
    road_segment_id: Optional[str] = None
    location_name: str
    incident_category: IncidentCategory = IncidentCategory.ROAD_INUNDATION
    description: Optional[str] = None
    reported_water_depth: WaterDepthCategory
    estimated_depth_cm: Optional[float] = None
    severity: SeverityLevel = SeverityLevel.MEDIUM
    observed_time: datetime
    passable_two_wheelers: bool
    passable_four_wheelers: bool
    passable_emergency_vehicles: bool
    source: DataSource
    verification_status: VerificationStatus
    verification_notes: Optional[str] = None
    verification_history: List[VerificationLogEntry] = []
    potential_duplicates: List[DuplicateCandidate] = []
    ai_confidence_score: Optional[float] = None
    ai_tags: List[str] = []
    image_url: Optional[str] = None
    reporter_name: Optional[str] = None
    geometry: GeoPoint
    created_at: datetime
    updated_at: datetime

# Weather Schemas - Strictly separates Measured Real Observations from Forecast
class WeatherObservation(BaseModel):
    station_name: str
    latitude: float
    longitude: float
    temperature_celsius: float
    relative_humidity_pct: float
    current_precipitation_rate_mm_h: float
    observed_weather_code: int
    observed_condition: str
    wind_speed_kmh: float
    wind_direction_degrees: Optional[float] = None
    surface_pressure_hpa: Optional[float] = None
    source: DataSource = DataSource.WEATHER_STATION
    observation_timestamp: datetime
    retrieved_at: datetime

class HourlyForecastItem(BaseModel):
    forecast_time: str
    precipitation_amount_mm: float
    precipitation_probability_pct: int
    temperature_celsius: float
    wind_speed_kmh: float
    condition: str
    is_forecast: bool = True

class DailyForecastItem(BaseModel):
    date: str
    precipitation_sum_mm: float
    rain_sum_mm: float
    is_forecast: bool = True

class WeatherSummaryResponse(BaseModel):
    location: str
    data_provenance: str = "Open-Meteo Automated Weather Station Telemetry + ECMWF Forecast Model"
    current_observation: WeatherObservation
    twenty_four_hour_accumulated_mm: float
    monsoon_alert_level: str
    is_cached: bool = False
    cache_age_seconds: int = 0
    hourly_forecast: List[HourlyForecastItem]
    daily_forecast: List[DailyForecastItem] = []
