import math
import re
from typing import List, Dict, Any, Optional
from datetime import datetime, timezone
import uuid
from app.schemas.flood import (
    RoadSegmentResponse,
    RoadStatus,
    SeverityLevel,
    DataSource,
    IncidentResponse,
    IncidentCreate,
    IncidentCategory,
    WaterDepthCategory,
    VerificationStatus,
    VerificationLogEntry,
    DuplicateCandidate
)

# Realistic Mangaluru Corridors
MANGALURU_CORRIDORS: List[Dict[str, Any]] = [
    {
        "id": "corridor-kottara-chowki",
        "name": "NH-66 Kottara Chowki Flyover Underpass",
        "ward": "Kottara / Derebail (Ward 17)",
        "elevation_meters": 4.5,
        "historical_flood_risk_score": 0.95,
        "current_status": RoadStatus.BLOCKED,
        "current_severity": SeverityLevel.CRITICAL,
        "current_water_depth_cm": 65.0,
        "confidence_score": 0.98,
        "last_source": DataSource.ADMIN_VERIFIED,
        "coordinates": [
            [74.8430, 12.9035],
            [74.8445, 12.9050],
            [74.8460, 12.9068]
        ]
    },
    {
        "id": "corridor-pumpwell-circle",
        "name": "Pumpwell Circle / Mahaveera Circle Junction",
        "ward": "Kankanady (Ward 48)",
        "elevation_meters": 6.2,
        "historical_flood_risk_score": 0.88,
        "current_status": RoadStatus.CAUTION,
        "current_severity": SeverityLevel.HIGH,
        "current_water_depth_cm": 25.0,
        "confidence_score": 0.92,
        "last_source": DataSource.ADMIN_VERIFIED,
        "coordinates": [
            [74.8680, 12.8610],
            [74.8695, 12.8625],
            [74.8710, 12.8640]
        ]
    },
    {
        "id": "corridor-baikampady-industrial",
        "name": "Baikampady Industrial Estate Cross Road",
        "ward": "Baikampady (Ward 3)",
        "elevation_meters": 3.8,
        "historical_flood_risk_score": 0.80,
        "current_status": RoadStatus.CAUTION,
        "current_severity": SeverityLevel.MEDIUM,
        "current_water_depth_cm": 20.0,
        "confidence_score": 0.85,
        "last_source": DataSource.AI_ESTIMATE,
        "coordinates": [
            [74.8150, 12.9550],
            [74.8175, 12.9570],
            [74.8200, 12.9590]
        ]
    },
    {
        "id": "corridor-statebank-service-bus",
        "name": "State Bank Service Bus Stand - Hamilton Circle",
        "ward": "Port Ward (Ward 40)",
        "elevation_meters": 3.2,
        "historical_flood_risk_score": 0.92,
        "current_status": RoadStatus.UNVERIFIED,
        "current_severity": SeverityLevel.HIGH,
        "current_water_depth_cm": 35.0,
        "confidence_score": 0.65,
        "last_source": DataSource.CITIZEN_REPORT,
        "coordinates": [
            [74.8390, 12.8620],
            [74.8410, 12.8635],
            [74.8430, 12.8650]
        ]
    },
    {
        "id": "corridor-kadri-temple-road",
        "name": "Kadri Hills Road / Circuit House Stretch",
        "ward": "Kadri (Ward 33)",
        "elevation_meters": 34.0,
        "historical_flood_risk_score": 0.10,
        "current_status": RoadStatus.OPEN,
        "current_severity": SeverityLevel.NONE,
        "current_water_depth_cm": 0.0,
        "confidence_score": 1.0,
        "last_source": DataSource.WEATHER_STATION,
        "coordinates": [
            [74.8610, 12.8850],
            [74.8630, 12.8870],
            [74.8650, 12.8890]
        ]
    },
    {
        "id": "corridor-car-street-temple-square",
        "name": "Car Street & Venkataramana Temple Square",
        "ward": "Bunder (Ward 41)",
        "elevation_meters": 5.0,
        "historical_flood_risk_score": 0.85,
        "current_status": RoadStatus.CAUTION,
        "current_severity": SeverityLevel.MEDIUM,
        "current_water_depth_cm": 18.0,
        "confidence_score": 0.89,
        "last_source": DataSource.ADMIN_VERIFIED,
        "coordinates": [
            [74.8440, 12.8710],
            [74.8455, 12.8725],
            [74.8470, 12.8740]
        ]
    },
    {
        "id": "corridor-bejai-ksrtc-circle",
        "name": "KSRTC Bus Stand - Bejai Main Road",
        "ward": "Bejai (Ward 31)",
        "elevation_meters": 18.0,
        "historical_flood_risk_score": 0.25,
        "current_status": RoadStatus.OPEN,
        "current_severity": SeverityLevel.NONE,
        "current_water_depth_cm": 2.0,
        "confidence_score": 0.95,
        "last_source": DataSource.ADMIN_VERIFIED,
        "coordinates": [
            [74.8510, 12.8890],
            [74.8530, 12.8910],
            [74.8550, 12.8930]
        ]
    }
]

# Baseline flood incidents with complete Phase 2 fields
INITIAL_INCIDENTS: List[Dict[str, Any]] = [
    {
        "id": "inc-001",
        "road_segment_id": "corridor-kottara-chowki",
        "location_name": "Kottara Chowki Flyover Underpass",
        "incident_category": IncidentCategory.UNDERPASS_FLOODING,
        "description": "Stormwater drain overflow caused 65cm water accumulation. Multiple small cars stalled. Traffic police diverted vehicles via Kuntikan bypass.",
        "reported_water_depth": WaterDepthCategory.WAIST_DEEP,
        "estimated_depth_cm": 65.0,
        "severity": SeverityLevel.CRITICAL,
        "observed_time": datetime.now(timezone.utc),
        "passable_two_wheelers": False,
        "passable_four_wheelers": False,
        "passable_emergency_vehicles": False,
        "source": DataSource.ADMIN_VERIFIED,
        "verification_status": VerificationStatus.VERIFIED,
        "verification_notes": "Ground patrol confirmed underpass submerged. Diverted traffic toward Kuntikan.",
        "verification_history": [
            {
                "id": "vlog-001",
                "verified_by_user": "Ashwin Nethan (Disaster Control Admin)",
                "action": "VERIFIED",
                "assigned_road_status": RoadStatus.BLOCKED,
                "notes": "Verified severe standing water (>60cm). Marked road as BLOCKED.",
                "timestamp": datetime.now(timezone.utc)
            }
        ],
        "potential_duplicates": [],
        "ai_confidence_score": 0.98,
        "ai_tags": ["Severe Inundation", "Drain Overflow", "Stalled Vehicles", "Underpass Hazard"],
        "image_url": "https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?w=600&auto=format&fit=crop&q=80",
        "reporter_name": "Inspector Ramesh (Patrol Unit 4)",
        "geom_coords": [74.8445, 12.9050],
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc)
    },
    {
        "id": "inc-002",
        "road_segment_id": "corridor-statebank-service-bus",
        "location_name": "Near State Bank Circle Roundabout",
        "incident_category": IncidentCategory.ROAD_INUNDATION,
        "description": "Water logging observed near service bus exit. Commuters reporting knee deep water on slow lane.",
        "reported_water_depth": WaterDepthCategory.KNEE_DEEP,
        "estimated_depth_cm": 35.0,
        "severity": SeverityLevel.HIGH,
        "observed_time": datetime.now(timezone.utc),
        "passable_two_wheelers": False,
        "passable_four_wheelers": True,
        "passable_emergency_vehicles": True,
        "source": DataSource.CITIZEN_REPORT,
        "verification_status": VerificationStatus.PENDING,
        "verification_notes": None,
        "verification_history": [],
        "potential_duplicates": [],
        "ai_confidence_score": 0.72,
        "ai_tags": ["Citizen Unverified", "Partial Lane Blockage"],
        "image_url": "https://images.unsplash.com/photo-1547683905-f686c993aae5?w=600&auto=format&fit=crop&q=80",
        "reporter_name": "Sudhir Pai (Commuter)",
        "geom_coords": [74.8410, 12.8635],
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc)
    }
]

class RoadService:
    def __init__(self):
        self._roads: Dict[str, Dict[str, Any]] = {r["id"]: r for r in MANGALURU_CORRIDORS}
        self._incidents: Dict[str, Dict[str, Any]] = {i["id"]: i for i in INITIAL_INCIDENTS}

    def get_all_roads(self, status: Optional[RoadStatus] = None) -> List[RoadSegmentResponse]:
        results = []
        for r in self._roads.values():
            if status and r["current_status"] != status:
                continue
            results.append(RoadSegmentResponse(
                id=r["id"],
                name=r["name"],
                ward=r["ward"],
                elevation_meters=r["elevation_meters"],
                historical_flood_risk_score=r["historical_flood_risk_score"],
                current_status=r["current_status"],
                current_severity=r["current_severity"],
                current_water_depth_cm=r["current_water_depth_cm"],
                confidence_score=r["confidence_score"],
                last_source=r["last_source"],
                geometry={
                    "type": "LineString",
                    "coordinates": r["coordinates"]
                },
                created_at=datetime.now(timezone.utc),
                updated_at=datetime.now(timezone.utc)
            ))
        return results

    def get_road_by_id(self, road_id: str) -> Optional[RoadSegmentResponse]:
        r = self._roads.get(road_id)
        if not r:
            return None
        return RoadSegmentResponse(
            id=r["id"],
            name=r["name"],
            ward=r["ward"],
            elevation_meters=r["elevation_meters"],
            historical_flood_risk_score=r["historical_flood_risk_score"],
            current_status=r["current_status"],
            current_severity=r["current_severity"],
            current_water_depth_cm=r["current_water_depth_cm"],
            confidence_score=r["confidence_score"],
            last_source=r["last_source"],
            geometry={
                "type": "LineString",
                "coordinates": r["coordinates"]
            },
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc)
        )

    def get_all_incidents(self, verification_status: Optional[VerificationStatus] = None) -> List[IncidentResponse]:
        results = []
        for inc in self._incidents.values():
            if verification_status and inc["verification_status"] != verification_status:
                continue
            results.append(self._format_incident_response(inc))
        return results

    def get_incident_by_id(self, incident_id: str) -> Optional[IncidentResponse]:
        inc = self._incidents.get(incident_id)
        if not inc:
            return None
        return self._format_incident_response(inc)

    def detect_duplicates(
        self, 
        latitude: float, 
        longitude: float, 
        description: Optional[str] = None, 
        time_window_minutes: float = 120.0,
        distance_threshold_meters: float = 600.0
    ) -> List[DuplicateCandidate]:
        """
        Duplicate Detection:
        Evaluates (1) Haversine distance, (2) submission time proximity, (3) text similarity.
        Does not automatically reject reports; surfaces candidates for human dispatcher judgment.
        """
        candidates: List[DuplicateCandidate] = []
        now = datetime.now(timezone.utc)

        for inc in self._incidents.values():
            coords = inc["geom_coords"]
            dist_m = self._haversine_distance(latitude, longitude, coords[1], coords[0])
            
            created_at = inc.get("created_at")
            if not created_at:
                continue
                
            time_diff_min = abs((now - created_at).total_seconds()) / 60.0
            
            # Text similarity score (token Jaccard)
            sim_score = self._compute_text_similarity(description or "", inc.get("description") or "")

            # Flag as potential duplicate candidate if within 600m and 2 hours
            if dist_m <= distance_threshold_meters and time_diff_min <= time_window_minutes:
                reason_parts = [f"{int(dist_m)}m away", f"{int(time_diff_min)} mins ago"]
                if sim_score > 0.4:
                    reason_parts.append(f"{(sim_score*100):.0f}% text match")
                
                candidates.append(DuplicateCandidate(
                    incident_id=inc["id"],
                    location_name=inc["location_name"],
                    distance_meters=round(dist_m, 1),
                    time_difference_minutes=round(time_diff_min, 1),
                    text_similarity_score=round(sim_score, 2),
                    reason=" | ".join(reason_parts)
                ))

        return candidates

    def submit_citizen_incident(self, payload: IncidentCreate) -> IncidentResponse:
        inc_id = f"inc-{uuid.uuid4().hex[:8]}"
        now = datetime.now(timezone.utc)

        # Depth estimate in cm from category
        depth_map = {
            WaterDepthCategory.DRY: 0.0,
            WaterDepthCategory.DAMP_WET: 2.0,
            WaterDepthCategory.ANKLE_DEEP: 12.0,
            WaterDepthCategory.KNEE_DEEP: 35.0,
            WaterDepthCategory.WAIST_DEEP: 70.0,
            WaterDepthCategory.SUBMERGED: 110.0,
        }
        depth_cm = depth_map.get(payload.reported_water_depth, 15.0)

        # 1. Run duplicate detection
        duplicates = self.detect_duplicates(
            latitude=payload.latitude,
            longitude=payload.longitude,
            description=payload.description
        )

        ai_tags = ["Citizen Report", "Unverified"]
        if duplicates:
            ai_tags.append(f"{len(duplicates)} Potential Duplicate(s) Detected")
        if not payload.passable_two_wheelers:
            ai_tags.append("2W Impassable")
        if not payload.passable_four_wheelers:
            ai_tags.append("4W Impassable")

        closest_road_id = self._find_closest_road(payload.latitude, payload.longitude)

        incident_record = {
            "id": inc_id,
            "road_segment_id": closest_road_id,
            "location_name": payload.location_name,
            "incident_category": payload.incident_category,
            "description": payload.description,
            "reported_water_depth": payload.reported_water_depth,
            "estimated_depth_cm": depth_cm,
            "severity": payload.severity,
            "observed_time": payload.observed_time or now,
            "passable_two_wheelers": payload.passable_two_wheelers,
            "passable_four_wheelers": payload.passable_four_wheelers,
            "passable_emergency_vehicles": payload.passable_emergency_vehicles,
            "source": DataSource.CITIZEN_REPORT,
            "verification_status": VerificationStatus.PENDING,
            "verification_notes": None,
            "verification_history": [],
            "potential_duplicates": [d.model_dump() for d in duplicates],
            "ai_confidence_score": 0.65 if not duplicates else 0.85,
            "ai_tags": ai_tags,
            "image_url": payload.image_url,
            "reporter_name": payload.reporter_name or "Anonymous Citizen",
            "geom_coords": [payload.longitude, payload.latitude],
            "created_at": now,
            "updated_at": now
        }
        self._incidents[inc_id] = incident_record

        # Strict safety rule: Unverified citizen report marks road as UNVERIFIED if it was OPEN, NEVER as BLOCKED.
        if closest_road_id and closest_road_id in self._roads:
            current_r = self._roads[closest_road_id]
            if current_r["current_status"] == RoadStatus.OPEN:
                current_r["current_status"] = RoadStatus.UNVERIFIED
                current_r["last_source"] = DataSource.CITIZEN_REPORT

        return self._format_incident_response(incident_record)

    def verify_incident(
        self,
        incident_id: str,
        verified: bool,
        status: VerificationStatus = VerificationStatus.VERIFIED,
        new_road_status: Optional[RoadStatus] = None,
        notes: Optional[str] = None,
        verified_by: str = "Admin Dispatcher"
    ) -> Optional[IncidentResponse]:
        if incident_id not in self._incidents:
            return None

        inc = self._incidents[incident_id]
        now = datetime.now(timezone.utc)

        target_status = status if verified else VerificationStatus.REJECTED
        inc["verification_status"] = target_status
        inc["verification_notes"] = notes
        inc["updated_at"] = now

        # Append to verification audit trail
        log_entry = {
            "id": f"vlog-{uuid.uuid4().hex[:8]}",
            "verified_by_user": verified_by,
            "action": target_status.value,
            "assigned_road_status": new_road_status,
            "notes": notes,
            "timestamp": now
        }
        inc.setdefault("verification_history", []).append(log_entry)

        # Update associated road corridor if verified
        road_id = inc.get("road_segment_id")
        if road_id and road_id in self._roads:
            road = self._roads[road_id]
            if target_status == VerificationStatus.VERIFIED:
                road["current_status"] = new_road_status or (
                    RoadStatus.BLOCKED if inc["reported_water_depth"] in [WaterDepthCategory.WAIST_DEEP, WaterDepthCategory.SUBMERGED]
                    else RoadStatus.CAUTION
                )
                road["last_source"] = DataSource.ADMIN_VERIFIED
            elif target_status == VerificationStatus.RESOLVED:
                road["current_status"] = RoadStatus.OPEN
                road["last_source"] = DataSource.ADMIN_VERIFIED
            elif target_status == VerificationStatus.REJECTED:
                # If was unverified because of this report, revert to OPEN
                if road["current_status"] == RoadStatus.UNVERIFIED:
                    road["current_status"] = RoadStatus.OPEN
                    road["last_source"] = DataSource.AI_ESTIMATE

        return self._format_incident_response(inc)

    def _format_incident_response(self, inc: Dict[str, Any]) -> IncidentResponse:
        v_history = [
            VerificationLogEntry(**item) if isinstance(item, dict) else item
            for item in inc.get("verification_history", [])
        ]
        p_dups = [
            DuplicateCandidate(**item) if isinstance(item, dict) else item
            for item in inc.get("potential_duplicates", [])
        ]

        return IncidentResponse(
            id=inc["id"],
            road_segment_id=inc.get("road_segment_id"),
            location_name=inc["location_name"],
            incident_category=inc.get("incident_category", IncidentCategory.ROAD_INUNDATION),
            description=inc.get("description"),
            reported_water_depth=inc["reported_water_depth"],
            estimated_depth_cm=inc.get("estimated_depth_cm"),
            severity=inc.get("severity", SeverityLevel.MEDIUM),
            observed_time=inc.get("observed_time", inc.get("created_at")),
            passable_two_wheelers=inc["passable_two_wheelers"],
            passable_four_wheelers=inc["passable_four_wheelers"],
            passable_emergency_vehicles=inc["passable_emergency_vehicles"],
            source=inc["source"],
            verification_status=inc["verification_status"],
            verification_notes=inc.get("verification_notes"),
            verification_history=v_history,
            potential_duplicates=p_dups,
            ai_confidence_score=inc.get("ai_confidence_score"),
            ai_tags=inc.get("ai_tags", []),
            image_url=inc.get("image_url"),
            reporter_name=inc.get("reporter_name"),
            geometry={
                "type": "Point",
                "coordinates": inc["geom_coords"]
            },
            created_at=inc.get("created_at"),
            updated_at=inc.get("updated_at", inc.get("created_at"))
        )

    def _haversine_distance(self, lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        """Computes distance between 2 coordinates in meters."""
        R = 6371000.0  # Earth radius in meters
        phi1, phi2 = math.radians(lat1), math.radians(lat2)
        dphi = math.radians(lat2 - lat1)
        dlam = math.radians(lon2 - lon1)
        a = math.sin(dphi / 2)**2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlam / 2)**2
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
        return R * c

    def _compute_text_similarity(self, text1: str, text2: str) -> float:
        """Token-based Jaccard similarity between two incident descriptions."""
        tokens1 = set(re.findall(r'\w+', text1.lower()))
        tokens2 = set(re.findall(r'\w+', text2.lower()))
        if not tokens1 or not tokens2:
            return 0.0
        intersection = tokens1.intersection(tokens2)
        union = tokens1.union(tokens2)
        return len(intersection) / len(union)

    def _find_closest_road(self, lat: float, lon: float) -> Optional[str]:
        closest_id = None
        min_dist = float("inf")
        for road in self._roads.values():
            coords = road["coordinates"]
            for pt in coords:
                d = ((pt[1] - lat)**2 + (pt[0] - lon)**2) ** 0.5
                if d < min_dist:
                    min_dist = d
                    closest_id = road["id"]
        return closest_id

road_service = RoadService()
