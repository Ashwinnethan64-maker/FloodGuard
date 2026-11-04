"""
NEERPATH AI Intelligence Engine - Transparent Road-Level Flood Risk Modeling.
Provisional thresholds are explicitly documented as assumptions requiring local calibration with Mangaluru disaster management authorities.
"""
from enum import Enum
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
from datetime import datetime, timezone
import math

class RiskCategory(str, Enum):
    LOW = "LOW"
    MODERATE = "MODERATE"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"
    INSUFFICIENT_DATA = "INSUFFICIENT_DATA"

class RiskFactorBreakdown(BaseModel):
    factor_name: str
    weight: float
    raw_value: float
    normalized_score: float  # 0.0 to 1.0
    weighted_contribution: float
    explanation: str

class RoadRiskAssessment(BaseModel):
    road_id: str
    road_name: str
    ward: str
    risk_category: RiskCategory
    composite_risk_score: float = Field(..., ge=0.0, le=1.0)
    data_completeness_pct: float = Field(..., ge=0.0, le=100.0)
    confidence_level: str  # HIGH, MEDIUM, LOW
    contributing_factors: List[RiskFactorBreakdown]
    plain_language_explanation: str
    mitigation_advisory: str
    assumptions_note: str
    model_version: str = "neerpath-heuristics-v3.0-provisional"
    calculated_at: datetime
    data_sources_used: List[str]

class RiskEngineConfig(BaseModel):
    # Configurable weights (sum to 1.0)
    weight_rainfall_intensity: float = 0.25
    weight_rainfall_accumulation_24h: float = 0.20
    weight_active_verified_incidents: float = 0.25
    weight_historical_susceptibility: float = 0.15
    weight_elevation_topography: float = 0.10
    weight_freshness_penalty: float = 0.05

    # Provisional thresholds (Assumptions requiring local Mangaluru calibration)
    threshold_critical: float = 0.75
    threshold_high: float = 0.52
    threshold_moderate: float = 0.28
    
    # Rainfall intensity reference marks (mm/h)
    rain_heavy_mm_h: float = 30.0
    rain_torrential_mm_h: float = 60.0
    
    # 24h accumulation reference marks (mm)
    accum_24h_severe_mm: float = 120.0

class FloodRiskEngine:
    def __init__(self, config: Optional[RiskEngineConfig] = None):
        self.config = config or RiskEngineConfig()

    def assess_road_segment(
        self,
        road_id: str,
        road_name: str,
        ward: str,
        elevation_meters: float,
        historical_susceptibility_score: float,
        current_rainfall_rate_mm_h: float,
        rainfall_24h_accumulation_mm: float,
        nearby_verified_incidents_count: int,
        nearby_water_depth_cm: float,
        data_freshness_seconds: int = 120,
        has_weather_station: bool = True
    ) -> RoadRiskAssessment:
        now = datetime.now(timezone.utc)
        data_sources = ["Open-Meteo AWS Telemetry", "Mangaluru Corridors PostGIS Database"]

        # Check data completeness
        completeness = 100.0
        if not has_weather_station:
            completeness -= 40.0
        if data_freshness_seconds > 3600:
            completeness -= 30.0

        if completeness < 50.0:
            return RoadRiskAssessment(
                road_id=road_id,
                road_name=road_name,
                ward=ward,
                risk_category=RiskCategory.INSUFFICIENT_DATA,
                composite_risk_score=0.0,
                data_completeness_pct=completeness,
                confidence_level="LOW",
                contributing_factors=[],
                plain_language_explanation="Insufficient real-time sensory data to calculate reliable road risk index.",
                mitigation_advisory="Proceed with commuter caution. Awaiting telemetry refresh.",
                assumptions_note="Thresholds provisional; requires calibrated local sensors.",
                calculated_at=now,
                data_sources_used=data_sources
            )

        factors: List[RiskFactorBreakdown] = []

        # 1. Rainfall Intensity Score
        norm_rain = min(1.0, current_rainfall_rate_mm_h / self.config.rain_torrential_mm_h)
        contrib_rain = norm_rain * self.config.weight_rainfall_intensity
        factors.append(RiskFactorBreakdown(
            factor_name="Rainfall Intensity (1h)",
            weight=self.config.weight_rainfall_intensity,
            raw_value=current_rainfall_rate_mm_h,
            normalized_score=round(norm_rain, 3),
            weighted_contribution=round(contrib_rain, 3),
            explanation=f"Current rainfall rate {current_rainfall_rate_mm_h} mm/h contributes {round(contrib_rain*100, 1)}% to risk."
        ))

        # 2. 24h Accumulation Score
        norm_accum = min(1.0, rainfall_24h_accumulation_mm / self.config.accum_24h_severe_mm)
        contrib_accum = norm_accum * self.config.weight_rainfall_accumulation_24h
        factors.append(RiskFactorBreakdown(
            factor_name="24-Hour Rainfall Accumulation",
            weight=self.config.weight_rainfall_accumulation_24h,
            raw_value=rainfall_24h_accumulation_mm,
            normalized_score=round(norm_accum, 3),
            weighted_contribution=round(contrib_accum, 3),
            explanation=f"Soil saturation from {rainfall_24h_accumulation_mm} mm 24h accumulation adds {round(contrib_accum*100, 1)}%."
        ))

        # 3. Verified Nearby Flooding Incidents & Water Depth
        incident_factor = min(1.0, (nearby_verified_incidents_count * 0.4) + (nearby_water_depth_cm / 60.0))
        contrib_incidents = incident_factor * self.config.weight_active_verified_incidents
        if nearby_verified_incidents_count > 0:
            data_sources.append(f"{nearby_verified_incidents_count} Verified Ground Incidents")
        factors.append(RiskFactorBreakdown(
            factor_name="Verified Ground Inundation",
            weight=self.config.weight_active_verified_incidents,
            raw_value=nearby_water_depth_cm,
            normalized_score=round(incident_factor, 3),
            weighted_contribution=round(contrib_incidents, 3),
            explanation=f"{nearby_verified_incidents_count} active verified reports nearby with {nearby_water_depth_cm} cm water depth."
        ))

        # 4. Historical Flood Susceptibility
        norm_hist = max(0.0, min(1.0, historical_susceptibility_score))
        contrib_hist = norm_hist * self.config.weight_historical_susceptibility
        factors.append(RiskFactorBreakdown(
            factor_name="Historical Vulnerability Score",
            weight=self.config.weight_historical_susceptibility,
            raw_value=historical_susceptibility_score,
            normalized_score=round(norm_hist, 3),
            weighted_contribution=round(contrib_hist, 3),
            explanation=f"Corridor baseline historical flooding susceptibility index is {historical_susceptibility_score}."
        ))

        # 5. Elevation & Topographic Inversion
        # Lower elevation (<6m e.g. Kottara Chowki / State Bank) has much higher risk than ridge elevation (Kadri Hills 34m)
        elevation_risk = max(0.0, min(1.0, (25.0 - elevation_meters) / 22.0))
        contrib_elevation = elevation_risk * self.config.weight_elevation_topography
        factors.append(RiskFactorBreakdown(
            factor_name="Topographic Elevation Inversion",
            weight=self.config.weight_elevation_topography,
            raw_value=elevation_meters,
            normalized_score=round(elevation_risk, 3),
            weighted_contribution=round(contrib_elevation, 3),
            explanation=f"Road elevation is {elevation_meters}m MSL; lower terrain accelerates stormwater runoff accumulation."
        ))

        # 6. Freshness Penalty
        freshness_decay = min(1.0, data_freshness_seconds / 1800.0)  # decays over 30 mins
        contrib_freshness = freshness_decay * self.config.weight_freshness_penalty
        factors.append(RiskFactorBreakdown(
            factor_name="Telemetry Freshness Penalty",
            weight=self.config.weight_freshness_penalty,
            raw_value=float(data_freshness_seconds),
            normalized_score=round(freshness_decay, 3),
            weighted_contribution=round(contrib_freshness, 3),
            explanation=f"Last observation updated {data_freshness_seconds}s ago."
        ))

        # Composite Score
        composite_score = sum(f.weighted_contribution for f in factors)
        composite_score = max(0.0, min(1.0, composite_score))

        # Classify Category
        if composite_score >= self.config.threshold_critical:
            category = RiskCategory.CRITICAL
            advisory = "EXTREME DANGER: Road highly likely submerged or impassable. Do not attempt crossing."
        elif composite_score >= self.config.threshold_high:
            category = RiskCategory.HIGH
            advisory = "HIGH RISK: Small vehicles and two-wheelers advised to divert. Substantial waterlogging present."
        elif composite_score >= self.config.threshold_moderate:
            category = RiskCategory.MODERATE
            advisory = "CAUTION: Surface water accumulation observed. Drive at reduced speed."
        else:
            category = RiskCategory.LOW
            advisory = "NORMAL TRANSIT: Road corridor passable with standard monsoon wet-weather caution."

        # Plain language explanation synthesis
        top_driver = max(factors, key=lambda x: x.weighted_contribution)
        explanation = (
            f"Risk index for {road_name} is {category.value} ({round(composite_score * 100, 1)}/100). "
            f"Primary contributing driver is {top_driver.factor_name} ({top_driver.explanation})."
        )

        confidence = "HIGH" if completeness >= 85 else "MEDIUM" if completeness >= 60 else "LOW"

        return RoadRiskAssessment(
            road_id=road_id,
            road_name=road_name,
            ward=ward,
            risk_category=category,
            composite_risk_score=round(composite_score, 3),
            data_completeness_pct=round(completeness, 1),
            confidence_level=confidence,
            contributing_factors=factors,
            plain_language_explanation=explanation,
            mitigation_advisory=advisory,
            assumptions_note="Provisional empirical thresholds (v3.0). Requires local calibration with Mangaluru storm-water drainage data.",
            model_version="neerpath-heuristics-v3.0-provisional",
            calculated_at=now,
            data_sources_used=data_sources
        )

flood_risk_engine = FloodRiskEngine()
