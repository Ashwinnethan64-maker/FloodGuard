import pytest
from app.services.gemini_service import gemini_service
from app.core.config import settings

def test_gemini_config_and_model():
    assert settings.GEMINI_MODEL == "gemini-3.5-flash-lite"
    if settings.GEMINI_API_KEY:
        assert len(settings.GEMINI_API_KEY) > 0

def test_gemini_incident_analysis():
    result = gemini_service.analyze_incident_report(
        description="Waterlogging near Pumpwell Circle, water depth above 30 cm, autos unable to pass.",
        location_name="Pumpwell Circle",
        reported_category="ROAD_INUNDATION"
    )
    assert result is not None
    assert result.urgency_tier in ["LOW", "MEDIUM", "HIGH", "CRITICAL"]
    assert isinstance(result.passable_vehicles, dict)
    assert "two_wheelers" in result.passable_vehicles
    assert len(result.tactical_summary) > 0

def test_gemini_risk_explanation():
    result = gemini_service.explain_road_risk(
        road_name="NH-66 Kottara Chowki Underpass",
        ward="Kottara",
        elevation=4.5,
        rainfall_rate_mm_h=25.0,
        water_depth_cm=40.0,
        current_status="BLOCKED"
    )
    assert result is not None
    assert result.flood_risk_level in ["LOW", "MODERATE", "HIGH", "CRITICAL"]
    assert len(result.recommended_action) > 0
    assert len(result.alternative_route_tip) > 0

