import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.schemas.flood import RoadStatus, DataSource, WaterDepthCategory

client = TestClient(app)

def test_health_check():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["platform"] in ["NEERPATH", "FLOODGUARD"]
    assert "Mangaluru" in data["city"]

def test_get_roads():
    response = client.get("/api/roads")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) > 0
    # Check structure
    corridor = data[0]
    assert "name" in corridor
    assert "current_status" in corridor
    assert "geometry" in corridor
    assert corridor["geometry"]["type"] == "LineString"

def test_weather_endpoint():
    response = client.get("/api/weather")
    assert response.status_code == 200
    data = response.json()
    assert "Mangaluru" in data["location"]
    assert "current_observation" in data
    assert "current_precipitation_rate_mm_h" in data["current_observation"]
    assert "monsoon_alert_level" in data

def test_citizen_report_strict_rules():
    # Citizen report must default to PENDING and NOT automatically BLOCK the road
    payload = {
        "location_name": "Kuntikan Junction Cross",
        "description": "Water backing up from storm drain",
        "reported_water_depth": "KNEE_DEEP",
        "passable_two_wheelers": False,
        "passable_four_wheelers": True,
        "passable_emergency_vehicles": True,
        "latitude": 12.8980,
        "longitude": 74.8450
    }
    response = client.post("/api/incidents", json=payload)
    assert response.status_code == 201
    incident = response.json()
    assert incident["verification_status"] == "PENDING"
    assert incident["source"] == "CITIZEN_REPORT"

def test_admin_verification():
    # Admin verifies an incident
    inc_res = client.get("/api/incidents")
    incidents = inc_res.json()
    assert len(incidents) > 0
    target_id = incidents[0]["id"]
    
    verify_payload = {
        "verified": True,
        "status": "VERIFIED",
        "new_road_status": "CAUTION",
        "verification_notes": "Patrol confirmed standing water",
        "verified_by": "Test Inspector"
    }
    verify_res = client.post(f"/api/incidents/{target_id}/verify", json=verify_payload)
    assert verify_res.status_code == 200
    verified_data = verify_res.json()
    assert verified_data["verification_status"] == "VERIFIED"

