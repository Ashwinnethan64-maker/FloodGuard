"""
NEERPATH Emergency Notification & Patrol Alert Dispatch Engine.
- Location-aware alerts for responders and residents.
- Triggers on:
    * New verified incidents
    * Road status transitions (e.g. OPEN -> BLOCKED)
    * High-risk storm warnings
    * Selected transit route condition updates
- Compatible with Firebase Cloud Messaging (FCM) webhook integration.
"""
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field
from datetime import datetime, timezone
import uuid

class AlertSeverity(str):
    INFO = "INFO"
    WARNING = "WARNING"
    URGENT = "URGENT"
    CRITICAL = "CRITICAL"

class SystemAlert(BaseModel):
    id: str = Field(default_factory=lambda: f"alert-{uuid.uuid4().hex[:8]}")
    title: str
    message: str
    severity: str  # INFO, WARNING, URGENT, CRITICAL
    alert_type: str  # ROAD_STATUS_CHANGE, INCIDENT_VERIFIED, HIGH_RISK_WEATHER, ROUTE_ALTERATION
    location_name: Optional[str] = None
    affected_corridor_id: Optional[str] = None
    coordinates: Optional[List[float]] = None
    is_read: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class AlertDispatchService:
    def __init__(self):
        # In-memory store initialized with realistic Mangaluru emergency broadcasts
        self._alerts: List[SystemAlert] = [
            SystemAlert(
                id="alert-001",
                title="ROAD BLOCKED: Kottara Chowki Underpass Closed",
                message="Ground patrol confirmed 65cm standing water under NH-66 flyover. Commuters diverted to Kuntikan bypass.",
                severity="CRITICAL",
                alert_type="ROAD_STATUS_CHANGE",
                location_name="NH-66 Kottara Chowki Flyover Underpass",
                affected_corridor_id="corridor-kottara-chowki",
                coordinates=[74.8445, 12.9050],
                created_at=datetime.now(timezone.utc)
            ),
            SystemAlert(
                id="alert-002",
                title="CAUTION ADVISORY: Pumpwell Junction Lane 1 Submerged",
                message="Flash stormwater runoff at Mahaveera Circle. Slow transit; two-wheelers advised extreme caution.",
                severity="WARNING",
                alert_type="ROAD_STATUS_CHANGE",
                location_name="Pumpwell Circle / Mahaveera Circle Junction",
                affected_corridor_id="corridor-pumpwell-circle",
                coordinates=[74.8695, 12.8625],
                created_at=datetime.now(timezone.utc)
            ),
            SystemAlert(
                id="alert-003",
                title="COASTAL WEATHER ALERT: Orange Warning Issued",
                message="Open-Meteo DK District station recorded heavy localized precipitation exceeding 30 mm/h.",
                severity="URGENT",
                alert_type="HIGH_RISK_WEATHER",
                location_name="Mangaluru Urban Area",
                created_at=datetime.now(timezone.utc)
            )
        ]

    def get_all_alerts(self, limit: int = 20) -> List[SystemAlert]:
        return sorted(self._alerts, key=lambda a: a.created_at, reverse=True)[:limit]

    def broadcast_alert(
        self,
        title: str,
        message: str,
        severity: str,
        alert_type: str,
        location_name: Optional[str] = None,
        affected_corridor_id: Optional[str] = None,
        coordinates: Optional[List[float]] = None
    ) -> SystemAlert:
        alert = SystemAlert(
            id=f"alert-{uuid.uuid4().hex[:8]}",
            title=title,
            message=message,
            severity=severity,
            alert_type=alert_type,
            location_name=location_name,
            affected_corridor_id=affected_corridor_id,
            coordinates=coordinates,
            created_at=datetime.now(timezone.utc)
        )
        self._alerts.insert(0, alert)
        return alert

    def mark_as_read(self, alert_id: str) -> bool:
        for a in self._alerts:
            if a.id == alert_id:
                a.is_read = True
                return True
        return False

alert_dispatch_service = AlertDispatchService()

