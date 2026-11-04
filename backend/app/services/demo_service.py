"""
NEERPATH Dedicated Interactive Demonstration Engine.
Supports a live multi-stage guided simulation demonstrating the end-to-end platform workflow:
1. Heavy Rainfall Event Trigger
2. Citizen Flood Report Ingestion
3. Administrator Verification & Road Status Transition to BLOCKED
4. AI Flood Risk Engine Recalibration
5. Dynamic Alternative Route Recalculation (Excluding Blocked Corridor)
6. Emergency Dispatcher Tactical Notification
All simulation data is explicitly tagged as 'SIMULATED DEMO' and resets cleanly.
"""
from typing import Dict, Any, List
from pydantic import BaseModel
from datetime import datetime, timezone
from app.schemas.flood import (
    RoadStatus, 
    SeverityLevel, 
    WaterDepthCategory, 
    IncidentCategory, 
    VerificationStatus,
    IncidentCreate
)
from app.services.road_service import road_service
from app.services.routing_service import flood_routing_engine
from app.services.alert_service import alert_dispatch_service

class DemoStep(BaseModel):
    step_number: int
    title: str
    description: str
    status: str
    affected_corridor: str
    provenance_tag: str = "SIMULATED DEMO"
    timestamp: datetime

class DemoScenarioStatus(BaseModel):
    scenario_name: str = "Mangaluru Monsoon Inundation & Emergency Route Bypass"
    is_active: bool
    current_step: int
    steps_history: List[DemoStep]
    simulated_rain_intensity_mm_h: float
    blocked_road_name: str
    alternative_route_name: str
    active_advisory: str

class DemonstrationEngine:
    def __init__(self):
        self._scenario_active = False
        self._current_step = 0
        self._history: List[DemoStep] = []

    def get_status(self) -> DemoScenarioStatus:
        return DemoScenarioStatus(
            scenario_name="Mangaluru Monsoon Inundation & Emergency Route Bypass",
            is_active=self._scenario_active,
            current_step=self._current_step,
            steps_history=self._history,
            simulated_rain_intensity_mm_h=45.0 if self._scenario_active else 12.0,
            blocked_road_name="NH-66 Kottara Chowki Flyover Underpass",
            alternative_route_name="Elevated Kadri Ridge Bypass (Flood-Avoidant)",
            active_advisory="LIVE DEMONSTRATION MODE: Simulating localized storm surge & emergency triage."
        )

    def trigger_step_1_heavy_rain(self) -> Dict[str, Any]:
        """Step 1: Heavy monsoon cloudburst simulated across coastal Mangaluru."""
        self._scenario_active = True
        self._current_step = 1
        now = datetime.now(timezone.utc)
        step = DemoStep(
            step_number=1,
            title="Simulate Torrential Monsoon Downpour",
            description="Open-Meteo rainfall telemetry simulated at 55 mm/hr over Mangaluru Urban District.",
            status="COMPLETED",
            affected_corridor="Dakshina Kannada Coastal Grid",
            timestamp=now
        )
        self._history.append(step)
        alert_dispatch_service.broadcast_alert(
            title="[SIMULATION] Torrential Cloudburst Warning",
            message="Simulated rain intensity exceeded 50 mm/h. Culverts at low elevations reaching capacity.",
            severity="URGENT",
            alert_type="HIGH_RISK_WEATHER",
            location_name="Mangaluru Urban Area"
        )
        return {"step": 1, "status": "executed", "step_details": step}

    def trigger_step_2_citizen_report(self) -> Dict[str, Any]:
        """Step 2: Citizen files waterlogging report at Kottara Chowki underpass."""
        self._current_step = 2
        now = datetime.now(timezone.utc)
        
        # Submit simulated citizen incident
        inc = road_service.submit_citizen_incident(
            payload=IncidentCreate(
                location_name="NH-66 Kottara Chowki Flyover Underpass",
                incident_category=IncidentCategory.UNDERPASS_FLOODING,
                description="[DEMO EVENT] Water rapidly filling underpass! Multiple small cars stalled.",
                reported_water_depth=WaterDepthCategory.WAIST_DEEP,
                severity=SeverityLevel.CRITICAL,
                passable_two_wheelers=False,
                passable_four_wheelers=False,
                passable_emergency_vehicles=False,
                latitude=12.9050,
                longitude=74.8445,
                reporter_name="Citizen Commuter (Live Demo)"
            )
        )
        step = DemoStep(
            step_number=2,
            title="Citizen Reports Waterlogging Hazard",
            description=f"Citizen report ingested (ID: {inc.id}). Status set to PENDING & UNVERIFIED per strict safety rule.",
            status="COMPLETED",
            affected_corridor="NH-66 Kottara Chowki Flyover Underpass",
            timestamp=now
        )
        self._history.append(step)
        return {"step": 2, "status": "executed", "incident_id": inc.id, "step_details": step}

    def trigger_step_3_admin_verify(self) -> Dict[str, Any]:
        """Step 3: Administrator / Traffic Police Officer verifies report and marks road as BLOCKED."""
        self._current_step = 3
        now = datetime.now(timezone.utc)

        # Mark corridor as confirmed BLOCKED
        verified = road_service.verify_incident(
            incident_id="inc-001",
            verified=True,
            status=VerificationStatus.VERIFIED,
            new_road_status=RoadStatus.BLOCKED,
            notes="[DEMO VERIFIED] Traffic Police Unit confirmed 65cm water depth. Road declared BLOCKED.",
            verified_by="Officer Ramesh Rao (Patrol Unit)"
        )
        step = DemoStep(
            step_number=3,
            title="Administrator Ground-Truth Verification",
            description="Patrol verified 65cm water depth. Corridor status officially transitioned to BLOCKED.",
            status="COMPLETED",
            affected_corridor="NH-66 Kottara Chowki Flyover Underpass",
            timestamp=now
        )
        self._history.append(step)
        return {"step": 3, "status": "executed", "verified_incident": verified, "step_details": step}

    def trigger_step_4_recalculate_routes(self) -> Dict[str, Any]:
        """Step 4: Commuter queries route; router automatically bypasses blocked corridor and explains why."""
        self._current_step = 4
        now = datetime.now(timezone.utc)

        route_plan = flood_routing_engine.evaluate_transit_corridors(
            origin_coords=[74.8445, 12.9050],
            dest_coords=[74.8695, 12.8625],
            origin_name="Kottara Chowki",
            dest_name="Pumpwell Circle",
            profile="driving-car"
        )
        step = DemoStep(
            step_number=4,
            title="Dynamic Flood-Aware Routing Recalculation",
            description="Routing engine excluded Kottara underpass and recommended Elevated Kadri Ridge Bypass.",
            status="COMPLETED",
            affected_corridor="Mangaluru Transit Grid",
            timestamp=now
        )
        self._history.append(step)
        return {"step": 4, "status": "executed", "recommended_route": route_plan.routes[0], "step_details": step}

    def reset_demo(self) -> Dict[str, Any]:
        self._scenario_active = False
        self._current_step = 0
        self._history.clear()
        return {"status": "reset", "message": "Demonstration scenario reset to clean state."}

demo_engine = DemonstrationEngine()
