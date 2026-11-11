import pytest
from app.services.road_service import road_service
from app.schemas.flood import (
    IncidentCreate,
    IncidentCategory,
    WaterDepthCategory,
    SeverityLevel,
    VerificationStatus,
    RoadStatus
)

def test_road_service_loads_initial_corridors():
    roads = road_service.get_all_roads()
    assert len(roads) >= 7
    kottara = next(r for r in roads if "Kottara" in r.name)
    assert kottara.current_status in [RoadStatus.BLOCKED, RoadStatus.CAUTION]

def test_duplicate_detection_proximity():
    # Submit a report near Kottara Chowki (74.8445, 12.9050)
    dups = road_service.detect_duplicates(
        latitude=12.9052,
        longitude=74.8447,
        description="Heavy water underpass Kottara stalled traffic",
        time_window_minutes=180.0,
        distance_threshold_meters=800.0
    )
    assert len(dups) >= 1
    assert dups[0].distance_meters < 800.0
    assert "inc-001" in dups[0].incident_id

def test_citizen_report_submission_and_non_blocking_rule():
    payload = IncidentCreate(
        location_name="Kadri Hills Road / Circuit House Stretch",
        incident_category=IncidentCategory.ROAD_INUNDATION,
        description="Water accumulation on corner",
        reported_water_depth=WaterDepthCategory.ANKLE_DEEP,
        severity=SeverityLevel.LOW,
        passable_two_wheelers=True,
        passable_four_wheelers=True,
        passable_emergency_vehicles=True,
        latitude=12.8870,
        longitude=74.8630
    )
    inc = road_service.submit_citizen_incident(payload)
    assert inc.verification_status == VerificationStatus.PENDING
    
    # Road status must be UNVERIFIED, NOT BLOCKED
    road = road_service.get_road_by_id(inc.road_segment_id)
    assert road.current_status == RoadStatus.UNVERIFIED

def test_admin_verification_workflow():
    payload = IncidentCreate(
        location_name="Pumpwell Circle East Ramp",
        incident_category=IncidentCategory.UNDERPASS_FLOODING,
        description="High standing water on bus exit",
        reported_water_depth=WaterDepthCategory.WAIST_DEEP,
        severity=SeverityLevel.CRITICAL,
        passable_two_wheelers=False,
        passable_four_wheelers=False,
        passable_emergency_vehicles=False,
        latitude=12.8625,
        longitude=74.8695
    )
    inc = road_service.submit_citizen_incident(payload)
    assert inc.verification_status == VerificationStatus.PENDING

    # Admin verifies and marks BLOCKED with notes
    verified_inc = road_service.verify_incident(
        incident_id=inc.id,
        verified=True,
        status=VerificationStatus.VERIFIED,
        new_road_status=RoadStatus.BLOCKED,
        notes="Ground patrol confirmed deep flooding. Blocked road.",
        verified_by="Inspector Ramesh"
    )
    assert verified_inc.verification_status == VerificationStatus.VERIFIED
    assert len(verified_inc.verification_history) >= 1
    assert verified_inc.verification_history[-1].notes == "Ground patrol confirmed deep flooding. Blocked road."

    # Road corridor must now reflect BLOCKED
    road = road_service.get_road_by_id(verified_inc.road_segment_id)
    assert road.current_status == RoadStatus.BLOCKED

