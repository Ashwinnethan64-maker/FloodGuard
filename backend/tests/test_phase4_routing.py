import pytest
from app.services.routing_service import flood_routing_engine
from app.services.alert_service import alert_dispatch_service

def test_flood_aware_routing_penalties_and_blocked_handling():
    # Kottara Chowki to Pumpwell Circle
    res = flood_routing_engine.evaluate_transit_corridors(
        origin_coords=[74.8445, 12.9050],
        dest_coords=[74.8695, 12.8625],
        origin_name="Kottara Chowki",
        dest_name="Pumpwell Circle",
        profile="driving-car"
    )
    assert len(res.routes) >= 2
    
    # Recommended route must not be the blocked underpass route
    top_route = res.routes[0]
    assert top_route.is_viable is True
    assert top_route.contains_blocked_segment is False
    assert "Kadri" in top_route.label or "Flood-Avoidant" in top_route.label

    # Blocked route must be marked impassable
    blocked_route = next((r for r in res.routes if r.contains_blocked_segment), None)
    if blocked_route:
        assert blocked_route.is_viable is False
        assert blocked_route.risk_tier == "IMPASSABLE"

def test_alert_dispatch_service():
    initial_alerts = alert_dispatch_service.get_all_alerts()
    assert len(initial_alerts) >= 2
    
    # Broadcast emergency alert
    new_alert = alert_dispatch_service.broadcast_alert(
        title="TEST DIVERSION: Kuntikan Crossing Alert",
        message="Emergency bypass road active",
        severity="CRITICAL",
        alert_type="ROAD_STATUS_CHANGE",
        location_name="Kuntikan Junction",
        coordinates=[74.8480, 12.8970]
    )
    assert new_alert.id in [a.id for a in alert_dispatch_service.get_all_alerts()]
    
    # Acknowledge
    success = alert_dispatch_service.mark_as_read(new_alert.id)
    assert success is True
    acknowledged = next(a for a in alert_dispatch_service.get_all_alerts() if a.id == new_alert.id)
    assert acknowledged.is_read is True

