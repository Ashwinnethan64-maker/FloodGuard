import pytest
from app.services.routing_service import flood_routing_engine
from app.core.supabase import get_supabase_client
from app.core.config import settings

def test_supabase_client_initialization():
    client = get_supabase_client()
    assert client is not None
    # Verify client has storage and auth namespaces
    assert hasattr(client, "storage")
    assert hasattr(client, "auth")

def test_routing_engine_heigit_corridor_evaluation():
    # Kottara Chowki to Pumpwell Circle
    res = flood_routing_engine.evaluate_transit_corridors(
        origin_coords=[74.8445, 12.9050],
        dest_coords=[74.8695, 12.8625],
        origin_name="Kottara Chowki",
        dest_name="Pumpwell Circle",
        profile="driving-car"
    )
    assert res is not None
    assert len(res.routes) >= 2
    # Verify ranked routes have disclaimer and geometries
    for r in res.routes:
        assert r.safety_disclaimer != ""
        assert len(r.route_geometry.coordinates) > 0

def test_settings_cors_and_heigit_config():
    assert "https://api.heigit.org/openrouteservice" in settings.ORS_BASE_URL
    assert settings.SUPABASE_URL.startswith("https://")
    assert isinstance(settings.CORS_ORIGINS, list)

