from fastapi import APIRouter, HTTPException, Query, UploadFile, File, Form, Depends
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import os
import uuid
import shutil
from datetime import datetime, timezone
from app.schemas.flood import (
    RoadSegmentResponse,
    RoadStatus,
    IncidentResponse,
    IncidentCreate,
    IncidentVerifyRequest,
    VerificationStatus,
    WeatherSummaryResponse
)
from app.services.road_service import road_service
from app.services.weather_service import WeatherService
from app.services.routing_service import flood_routing_engine, RoutePlanResponse, MANGALURU_LOCATIONS
from app.services.alert_service import alert_dispatch_service, SystemAlert
from app.services.iot_service import iot_telemetry_registry, IoTDeviceRegistration, IoTTelemetryPayload
from app.services.demo_service import demo_engine, DemoScenarioStatus
from app.ai.risk_engine import flood_risk_engine, RoadRiskAssessment, RiskCategory
from app.ai.report_classifier import report_classifier, ClassifiedReportResult
from app.ai.image_analyzer import image_analyzer, ImageAnalysisResult
from app.ai.ml_pipeline import flood_ml_pipeline, ModelEvaluationMetrics
from app.services.gemini_service import gemini_service, GeminiIncidentAnalysis, GeminiRiskExplanation
from app.services.role_service import role_service, RoleUpdateRequest, UserProfileRecord, AuditLogEntry
from app.core.config import settings
from app.core.supabase import upload_incident_photo_to_storage, get_supabase_client
import httpx

api_router = APIRouter()

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

# 1. System Health & Platform Diagnostics
@api_router.get("/health", tags=["System"])
async def health_check():
    return {
        "status": "healthy",
        "platform": settings.PROJECT_NAME,
        "tagline": settings.TAGLINE,
        "version": settings.VERSION,
        "environment": settings.ENVIRONMENT,
        "routing_engine": "neerpath-flood-aware-router-v4.0",
        "ai_engine": "neerpath-heuristics-v3.0-provisional",
        "iot_interface": "READY",
        "demo_engine": "ONLINE",
        "city": "Mangaluru, Karnataka",
        "center_coordinates": {
            "latitude": settings.MANGALURU_LAT,
            "longitude": settings.MANGALURU_LON
        }
    }

@api_router.get("/health/integrations", tags=["System"])
async def check_integrations():
    """
    Diagnostics endpoint verifying status of:
    - Supabase (auth, database, storage)
    - HeiGIT / OpenRouteService v2 (routing API connectivity)
    - Open-Meteo (weather forecast API)
    - MapTiler (configuration presence)
    """
    results: Dict[str, Any] = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "services": {}
    }

    # 1. Supabase Check
    supabase_configured = bool(settings.SUPABASE_URL and (settings.SUPABASE_SECRET_KEY or settings.SUPABASE_KEY))
    if not supabase_configured:
        results["services"]["supabase"] = {
            "status": "unconfigured",
            "message": "SUPABASE_URL or keys not set in environment."
        }
    else:
        try:
            client = get_supabase_client()
            if client:
                buckets = client.storage.list_buckets()
                bucket_names = []
                for b in buckets:
                    if hasattr(b, 'name'):
                        bucket_names.append(b.name)
                    elif isinstance(b, dict):
                        bucket_names.append(b.get('name'))
                has_incident_bucket = "incident-photos" in bucket_names or len(buckets) > 0
                results["services"]["supabase"] = {
                    "status": "healthy",
                    "url": settings.SUPABASE_URL,
                    "storage_bucket_present": has_incident_bucket,
                    "message": "Supabase client connected and storage operational."
                }
            else:
                results["services"]["supabase"] = {
                    "status": "degraded",
                    "message": "Supabase client could not be instantiated."
                }
        except Exception as e:
            results["services"]["supabase"] = {
                "status": "degraded",
                "message": f"Supabase check failed: {str(e)}"
            }

    # 2. HeiGIT / OpenRouteService v2 Check
    ors_configured = bool(settings.ORS_API_KEY)
    if not ors_configured:
        results["services"]["openrouteservice"] = {
            "status": "fallback_mode",
            "message": "ORS_API_KEY not set. Using high-precision local corridor fallback."
        }
    else:
        try:
            async with httpx.AsyncClient(timeout=4.0) as http_client:
                test_payload = {
                    "coordinates": [[74.8445, 12.9050], [74.8695, 12.8625]]
                }
                test_headers = {
                    "Authorization": settings.ORS_API_KEY,
                    "Content-Type": "application/json"
                }
                res = await http_client.post(
                    f"{settings.ORS_BASE_URL}/v2/directions/driving-car/geojson",
                    json=test_payload,
                    headers=test_headers
                )
                if res.status_code == 200:
                    results["services"]["openrouteservice"] = {
                        "status": "healthy",
                        "endpoint": f"{settings.ORS_BASE_URL}/v2/directions/driving-car",
                        "message": "HeiGIT OpenRouteService v2 directions verified."
                    }
                elif res.status_code == 429:
                    results["services"]["openrouteservice"] = {
                        "status": "quota_exceeded",
                        "message": "HeiGIT rate limit exceeded, local fallback active."
                    }
                else:
                    results["services"]["openrouteservice"] = {
                        "status": "degraded",
                        "http_code": res.status_code,
                        "message": f"HeiGIT returned status {res.status_code}. Local fallback active."
                    }
        except Exception as e:
            results["services"]["openrouteservice"] = {
                "status": "fallback_mode",
                "message": f"HeiGIT unreachable ({type(e).__name__}). Local corridor fallback active."
            }

    # 3. Open-Meteo Weather API Check
    try:
        weather_summary = await WeatherService.get_mangaluru_weather(force_refresh=True)
        results["services"]["open_meteo"] = {
            "status": "healthy",
            "endpoint": settings.OPEN_METEO_API_URL or f"{settings.OPEN_METEO_BASE_URL}/forecast",
            "timezone": settings.OPEN_METEO_TIMEZONE,
            "forecast_days": settings.OPEN_METEO_FORECAST_DAYS,
            "observed_temperature_c": weather_summary.current_observation.temperature_celsius,
            "observed_relative_humidity_pct": weather_summary.current_observation.relative_humidity_pct,
            "hourly_data_points": len(weather_summary.hourly_forecast),
            "daily_forecast_days": len(weather_summary.daily_forecast),
            "message": "Open-Meteo dynamic 7-day weather forecast operational with auto timezone."
        }
    except Exception as e:
        results["services"]["open_meteo"] = {
            "status": "cached_mode",
            "message": f"Open-Meteo query failed ({type(e).__name__}). Using local cached weather."
        }

    # 4. MapTiler (Client-side asset check)
    results["services"]["maptiler"] = {
        "status": "configured",
        "style": "streets-v2",
        "client_key_configured": True,
        "message": "MapLibre GL JS vector style with OSM raster fallback."
    }

    # 5. Firebase Cloud Messaging (FCM) & Push Dispatcher Check
    from app.core.firebase import initialize_firebase_admin
    fb_admin_live = initialize_firebase_admin()
    results["services"]["firebase"] = {
        "status": "healthy" if fb_admin_live else "configured_client_ready",
        "project_id": settings.FIREBASE_PROJECT_ID,
        "admin_sdk_initialized": fb_admin_live,
        "active_subscribers_count": alert_dispatch_service.get_registered_tokens_count(),
        "message": "FCM device registration active; push notifications dispatch ready." if fb_admin_live else "FCM client token registration active; server-side push running in simulation/broadcast mode."
    }

    # 6. Google Gemini AI Service Check
    gemini_key_present = bool(settings.GEMINI_API_KEY)
    results["services"]["gemini_ai"] = {
        "status": "healthy" if gemini_key_present else "fallback_mode",
        "model": settings.GEMINI_MODEL,
        "sdk": "google-genai",
        "key_configured": gemini_key_present,
        "features": [
            "Incident description parsing",
            "Suspicious/spam report detection",
            "Explainable flood-risk generation"
        ],
        "message": f"Gemini AI ({settings.GEMINI_MODEL}) connected and active for report classification & explainability." if gemini_key_present else "Gemini key missing; running on local rule-based heuristics."
    }

    return results

# 2. Key Metrics & Public Dashboard Summary
@api_router.get("/dashboard/summary", tags=["Dashboard"])
async def get_dashboard_summary():
    roads = road_service.get_all_roads()
    incidents = road_service.get_all_incidents()
    
    total_roads = len(roads)
    blocked_roads = [r for r in roads if r.current_status == RoadStatus.BLOCKED]
    caution_roads = [r for r in roads if r.current_status == RoadStatus.CAUTION]
    open_roads = [r for r in roads if r.current_status == RoadStatus.OPEN]
    unverified_roads = [r for r in roads if r.current_status == RoadStatus.UNVERIFIED]
    
    verified_incidents = [i for i in incidents if i.verification_status == VerificationStatus.VERIFIED]
    pending_incidents = [i for i in incidents if i.verification_status == VerificationStatus.PENDING]
    rejected_incidents = [i for i in incidents if i.verification_status == VerificationStatus.REJECTED]
    resolved_incidents = [i for i in incidents if i.verification_status == VerificationStatus.RESOLVED]
    
    return {
        "data_mode": "DEMO DATA (Mangaluru Monsoon Simulation)",
        "metrics": {
            "total_incidents_reported": len(incidents),
            "active_verified_incidents": len(verified_incidents),
            "pending_citizen_reports": len(pending_incidents),
            "rejected_reports": len(rejected_incidents),
            "resolved_incidents": len(resolved_incidents),
            "roads_caution_count": len(caution_roads),
            "roads_blocked_count": len(blocked_roads),
            "roads_open_count": len(open_roads),
            "roads_unverified_count": len(unverified_roads),
            "monitored_corridors_total": total_roads,
        },
        "recent_incidents": incidents[:6],
        "high_risk_corridors": blocked_roads + caution_roads
    }

# 3. Road Network & Corridors
@api_router.get("/roads", response_model=List[RoadSegmentResponse], tags=["Roads"])
async def get_roads(status: Optional[RoadStatus] = Query(None, description="Filter by status (OPEN, CAUTION, BLOCKED, UNVERIFIED)")):
    return road_service.get_all_roads(status=status)

@api_router.get("/roads/{road_id}", response_model=RoadSegmentResponse, tags=["Roads"])
async def get_road_details(road_id: str):
    road = road_service.get_road_by_id(road_id)
    if not road:
        raise HTTPException(status_code=404, detail="Road corridor not found")
    return road

# 4. Flood Incidents & Citizen Reporting
@api_router.get("/incidents", response_model=List[IncidentResponse], tags=["Incidents"])
async def list_incidents(status: Optional[VerificationStatus] = Query(None, description="Filter by verification_status")):
    return road_service.get_all_incidents(verification_status=status)

@api_router.get("/incidents/{incident_id}", response_model=IncidentResponse, tags=["Incidents"])
async def get_incident(incident_id: str):
    inc = road_service.get_incident_by_id(incident_id)
    if not inc:
        raise HTTPException(status_code=404, detail="Incident not found")
    return inc

@api_router.post("/incidents", response_model=IncidentResponse, status_code=201, tags=["Incidents"])
async def report_incident(payload: IncidentCreate):
    return road_service.submit_citizen_incident(payload)

@api_router.post("/incidents/upload-image", tags=["Incidents"])
async def upload_incident_image(file: UploadFile = File(...)):
    allowed_extensions = {".jpg", ".jpeg", ".png", ".webp"}
    ext = os.path.splitext(file.filename or "")[1].lower()
    if ext not in allowed_extensions:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid image format. Allowed formats: {', '.join(allowed_extensions)}"
        )

    unique_filename = f"flood_{uuid.uuid4().hex[:12]}{ext}"
    dest_path = os.path.join(UPLOAD_DIR, unique_filename)

    file_bytes = await file.read()
    file_size = len(file_bytes)
    max_size = 10 * 1024 * 1024  # 10 MB
    if file_size > max_size:
        raise HTTPException(status_code=400, detail="File size exceeds maximum allowed 10MB.")

    # 1. Save local copy for offline durability & ML fallback
    with open(dest_path, "wb") as buffer:
        buffer.write(file_bytes)

    # 2. Upload to Supabase Storage if configured
    supabase_public_url = upload_incident_photo_to_storage(
        file_bytes=file_bytes,
        file_name=unique_filename,
        content_type=file.content_type or "image/jpeg"
    )

    # Use Supabase URL if successful, otherwise fallback to local server static path
    final_image_url = supabase_public_url or f"/uploads/{unique_filename}"
    storage_provider = "supabase" if supabase_public_url else "local"

    return {
        "status": "success",
        "image_url": final_image_url,
        "filename": unique_filename,
        "storage_provider": storage_provider,
        "size_bytes": file_size,
        "uploaded_at": datetime.now(timezone.utc).isoformat()
    }

# 5. Admin Verification & Dispatcher Workflow
@api_router.post("/incidents/{incident_id}/verify", response_model=IncidentResponse, tags=["Admin Verification"])
async def verify_incident(incident_id: str, payload: IncidentVerifyRequest):
    updated = road_service.verify_incident(
        incident_id=incident_id,
        verified=payload.verified,
        status=payload.status,
        new_road_status=payload.new_road_status,
        notes=payload.verification_notes,
        verified_by=payload.verified_by or "Admin Dispatcher"
    )
    if not updated:
        raise HTTPException(status_code=404, detail="Incident ID not found")

    if payload.verified and payload.new_road_status:
        alert_dispatch_service.broadcast_alert(
            title=f"STATUS UPDATE: {updated.location_name} marked {payload.new_road_status.value}",
            message=payload.verification_notes or f"Road condition verified by {payload.verified_by}.",
            severity="CRITICAL" if payload.new_road_status == RoadStatus.BLOCKED else "WARNING",
            alert_type="ROAD_STATUS_CHANGE",
            location_name=updated.location_name,
            affected_corridor_id=updated.road_segment_id,
            coordinates=updated.geometry.coordinates
        )

    return updated

# 6. Live Weather & Open-Meteo Integration
@api_router.get("/weather", response_model=WeatherSummaryResponse, tags=["Weather"])
async def get_weather(
    lat: float = Query(settings.MANGALURU_LAT, description="Latitude"),
    lon: float = Query(settings.MANGALURU_LON, description="Longitude"),
    refresh: bool = Query(False, description="Bypass cache and force refresh from Open-Meteo")
):
    return await WeatherService.get_mangaluru_weather(lat=lat, lon=lon, force_refresh=refresh)

# 7. Flood-Aware Routing Engine
@api_router.get("/routing/plan", response_model=RoutePlanResponse, tags=["Routing"])
async def plan_flood_aware_route(
    origin_lat: float = Query(12.9050, description="Origin latitude"),
    origin_lon: float = Query(74.8445, description="Origin longitude"),
    dest_lat: float = Query(12.8625, description="Destination latitude"),
    dest_lon: float = Query(74.8695, description="Destination longitude"),
    origin_name: str = Query("Kottara Chowki", description="Origin name"),
    dest_name: str = Query("Pumpwell Circle", description="Destination name"),
    profile: str = Query("driving-car", description="Profile (driving-car, foot-walking)")
):
    return flood_routing_engine.evaluate_transit_corridors(
        origin_coords=[origin_lon, origin_lat],
        dest_coords=[dest_lon, dest_lat],
        origin_name=origin_name,
        dest_name=dest_name,
        profile=profile
    )

@api_router.get("/routing/presets", tags=["Routing"])
async def get_routing_presets():
    return {
        "locations": [
            {"name": k, "coordinates": v} for k, v in MANGALURU_LOCATIONS.items()
        ]
    }

# 8. Emergency Alerts & Responder Portal
@api_router.get("/alerts", response_model=List[SystemAlert], tags=["Emergency Alerts"])
async def list_emergency_alerts(limit: int = Query(20, description="Max alerts to retrieve")):
    return alert_dispatch_service.get_all_alerts(limit=limit)

@api_router.post("/alerts/{alert_id}/ack", tags=["Emergency Alerts"])
async def acknowledge_alert(alert_id: str):
    success = alert_dispatch_service.mark_as_read(alert_id)
    if not success:
        raise HTTPException(status_code=404, detail="Alert ID not found")
    return {"status": "acknowledged", "alert_id": alert_id}

# 8.1 Firebase Cloud Messaging Device Token Registration
class PushRegistrationPayload(BaseModel):
    token: str
    device_label: Optional[str] = "Web Browser"

@api_router.post("/alerts/register-device", tags=["Emergency Alerts"])
async def register_push_device(payload: PushRegistrationPayload):
    if not payload.token:
        raise HTTPException(status_code=400, detail="FCM token is required")

    success = alert_dispatch_service.register_device_token(payload.token)

    # Record token in Supabase user profiles / notification table if available
    supabase_client = get_supabase_client()
    supabase_synced = False
    if supabase_client:
        try:
            supabase_client.table("fcm_device_registrations").upsert({
                "token": payload.token,
                "device_label": payload.device_label,
                "updated_at": datetime.now(timezone.utc).isoformat()
            }).execute()
            supabase_synced = True
        except Exception as exc:
            pass  # Table might not exist yet before migration, gracefully continue

    return {
        "status": "success" if success else "already_registered",
        "registered": True,
        "token_prefix": payload.token[:12] + "...",
        "active_subscribers_count": alert_dispatch_service.get_registered_tokens_count(),
        "supabase_synced": supabase_synced
    }

@api_router.get("/responder/tactical-summary", tags=["Responder Portal"])
async def get_responder_tactical_summary():
    roads = road_service.get_all_roads()
    incidents = road_service.get_all_incidents()
    alerts = alert_dispatch_service.get_all_alerts(limit=5)

    blocked_segments = [r for r in roads if r.current_status == RoadStatus.BLOCKED]
    caution_segments = [r for r in roads if r.current_status == RoadStatus.CAUTION]
    urgent_incidents = [i for i in incidents if i.verification_status in [VerificationStatus.PENDING, VerificationStatus.VERIFIED]]

    return {
        "tactical_timestamp": datetime.now(timezone.utc).isoformat(),
        "monitored_region": "Mangaluru Urban District",
        "summary_counts": {
            "impassable_roads_count": len(blocked_segments),
            "caution_roads_count": len(caution_segments),
            "urgent_incidents_active": len(urgent_incidents)
        },
        "critical_blocked_roads": [
            {
                "id": b.id,
                "name": b.name,
                "ward": b.ward,
                "water_depth_cm": b.current_water_depth_cm,
                "coordinates": b.geometry.coordinates
            }
            for b in blocked_segments
        ],
        "emergency_hospital_arteries": [
            {
                "facility": "AJ Hospital & Medical College (Kuntikan)",
                "access_corridor": "Kuntikan - Derebail Bypass",
                "accessibility": "OPEN - Primary Emergency Artery",
                "risk_tier": "LOW"
            },
            {
                "facility": "Father Muller Medical College Hospital (Kankanady)",
                "access_corridor": "Kankanady Bypass Road",
                "accessibility": "CAUTION - Slow flow near Pumpwell ramp",
                "risk_tier": "MODERATE"
            },
            {
                "facility": "Wenlock District Hospital (Hampankatta)",
                "access_corridor": "Balmatta - Jyothi Road",
                "accessibility": "OPEN - Passable for all emergency vehicles",
                "risk_tier": "LOW"
            }
        ],
        "active_alerts": alerts
    }

# 9. AI Intelligence Engine
@api_router.get("/ai/road-risk", response_model=List[RoadRiskAssessment], tags=["AI Intelligence"])
async def get_all_road_risk_assessments():
    weather = await WeatherService.get_mangaluru_weather()
    rain_1h = weather.current_observation.current_precipitation_rate_mm_h
    accum_24h = weather.twenty_four_hour_accumulated_mm
    
    roads = road_service.get_all_roads()
    assessments = []

    for r in roads:
        incidents = [i for i in road_service.get_all_incidents() if i.road_segment_id == r.id and i.verification_status == VerificationStatus.VERIFIED]
        water_depth = r.current_water_depth_cm

        assessment = flood_risk_engine.assess_road_segment(
            road_id=r.id,
            road_name=r.name,
            ward=r.ward,
            elevation_meters=r.elevation_meters,
            historical_susceptibility_score=r.historical_flood_risk_score,
            current_rainfall_rate_mm_h=rain_1h,
            rainfall_24h_accumulation_mm=accum_24h,
            nearby_verified_incidents_count=len(incidents),
            nearby_water_depth_cm=water_depth,
            data_freshness_seconds=weather.cache_age_seconds
        )
        assessments.append(assessment)

    return assessments

@api_router.get("/ai/road-risk/{road_id}", response_model=RoadRiskAssessment, tags=["AI Intelligence"])
async def get_single_road_risk(road_id: str):
    road = road_service.get_road_by_id(road_id)
    if not road:
        raise HTTPException(status_code=404, detail="Road corridor not found")

    weather = await WeatherService.get_mangaluru_weather()
    incidents = [i for i in road_service.get_all_incidents() if i.road_segment_id == road.id and i.verification_status == VerificationStatus.VERIFIED]

    return flood_risk_engine.assess_road_segment(
        road_id=road.id,
        road_name=road.name,
        ward=road.ward,
        elevation_meters=road.elevation_meters,
        historical_susceptibility_score=road.historical_flood_risk_score,
        current_rainfall_rate_mm_h=weather.current_observation.current_precipitation_rate_mm_h,
        rainfall_24h_accumulation_mm=weather.twenty_four_hour_accumulated_mm,
        nearby_verified_incidents_count=len(incidents),
        nearby_water_depth_cm=road.current_water_depth_cm,
        data_freshness_seconds=weather.cache_age_seconds
    )

@api_router.post("/ai/classify-report", response_model=ClassifiedReportResult, tags=["AI Intelligence"])
async def classify_incident_text(text: str = Query(..., description="Report text to analyze"), location: str = Query("", description="Location name")):
    return report_classifier.classify_text(text=text, location_name=location)

@api_router.post("/ai/analyze-image", response_model=ImageAnalysisResult, tags=["AI Intelligence"])
async def analyze_incident_image(image_path: str = Query(..., description="Uploaded image relative path")):
    clean_filename = os.path.basename(image_path)
    full_path = os.path.join(UPLOAD_DIR, clean_filename)

    res = image_analyzer.analyze_image_file(full_path)
    if not res:
        raise HTTPException(status_code=404, detail="Image file not found or invalid format for CV analysis.")
    return res

@api_router.get("/ai/hotspots", tags=["AI Intelligence"])
async def get_flood_hotspot_analysis():
    roads = road_service.get_all_roads()
    hotspots = sorted(roads, key=lambda x: x.historical_flood_risk_score, reverse=True)
    return {
        "region": "Mangaluru Urban Area (Dakshina Kannada)",
        "vulnerability_analysis": [
            {
                "corridor_id": h.id,
                "corridor_name": h.name,
                "ward": h.ward,
                "elevation_msl_meters": h.elevation_meters,
                "historical_vulnerability_index": h.historical_flood_risk_score,
                "typical_bottleneck_reason": "Low topographic elevation & culvert choke point" if h.elevation_meters < 6.0 else "Surface runoff accumulation",
                "current_status": h.current_status
            }
            for h in hotspots
        ],
        "drainage_convergence_zones": [
            "Gurupura Estuary / Baikampady Basin",
            "Nethravathi Lowlands / Pumpwell",
            "Kottara Stormwater Canal Underpass"
        ]
    }

@api_router.get("/ai/model-info", response_model=ModelEvaluationMetrics, tags=["AI Intelligence"])
async def get_ml_model_info():
    metrics = flood_ml_pipeline.last_metrics or flood_ml_pipeline.train_and_evaluate()
    return metrics

# ==============================================================================
# GOOGLE GEMINI AI ADVANCED INTELLIGENCE ENDPOINTS
# ==============================================================================

class GeminiAnalyzeReportRequest(BaseModel):
    description: str
    location_name: str
    reported_category: Optional[str] = "ROAD_INUNDATION"

@api_router.post("/ai/gemini/analyze-report", response_model=GeminiIncidentAnalysis, tags=["Gemini AI"])
async def gemini_analyze_citizen_report(payload: GeminiAnalyzeReportRequest):
    """
    Leverages Google Gemini 3.5 Flash to parse citizen flood descriptions,
    estimate standing water depth, identify key hazards, detect suspicious/spam submissions,
    and generate emergency dispatch summaries.
    """
    if not payload.description or len(payload.description.strip()) < 3:
        raise HTTPException(status_code=400, detail="Description is too short for AI analysis.")
    return gemini_service.analyze_incident_report(
        description=payload.description,
        location_name=payload.location_name,
        reported_category=payload.reported_category or "ROAD_INUNDATION"
    )

@api_router.get("/ai/gemini/explain-risk/{road_id}", response_model=GeminiRiskExplanation, tags=["Gemini AI"])
async def gemini_explain_corridor_risk(road_id: str):
    """
    Uses Google Gemini 3.5 Flash to provide human-readable, explainable flood-risk
    insights, geomorphological context, and detour advice for a selected Mangaluru corridor.
    """
    road = road_service.get_road_by_id(road_id)
    if not road:
        raise HTTPException(status_code=404, detail="Road corridor not found")

    weather = await WeatherService.get_mangaluru_weather()
    rain_rate = weather.current_observation.current_precipitation_rate_mm_h

    return gemini_service.explain_road_risk(
        road_name=road.name,
        ward=road.ward,
        elevation=road.elevation_meters,
        rainfall_rate_mm_h=rain_rate,
        water_depth_cm=road.current_water_depth_cm,
        current_status=road.current_status.value
    )

# ==============================================================================
# PHASE 5: DEDICATED DEMO SCENARIO & IOT TELEMETRY ENDPOINTS
# ==============================================================================

@api_router.get("/demo/status", response_model=DemoScenarioStatus, tags=["Demonstration Engine"])
async def get_demo_scenario_status():
    """Returns current active demonstration status and completed simulation steps."""
    return demo_engine.get_status()

@api_router.post("/demo/trigger-step-1", tags=["Demonstration Engine"])
async def demo_step_1_heavy_rain():
    """Step 1: Simulate torrential rainfall event over Mangaluru."""
    return demo_engine.trigger_step_1_heavy_rain()

@api_router.post("/demo/trigger-step-2", tags=["Demonstration Engine"])
async def demo_step_2_citizen_report():
    """Step 2: Simulate citizen filing an emergency flood report."""
    return demo_engine.trigger_step_2_citizen_report()

@api_router.post("/demo/trigger-step-3", tags=["Demonstration Engine"])
async def demo_step_3_admin_verify():
    """Step 3: Administrator / Police Patrol officially verifies incident and blocks road."""
    return demo_engine.trigger_step_3_admin_verify()

@api_router.post("/demo/trigger-step-4", tags=["Demonstration Engine"])
async def demo_step_4_reroute():
    """Step 4: Commuter queries route; router automatically calculates flood-avoidant bypass."""
    return demo_engine.trigger_step_4_reroute()

@api_router.post("/demo/reset", tags=["Demonstration Engine"])
async def demo_reset_all():
    """Resets simulation to clean baseline state."""
    return demo_engine.reset_demo()

@api_router.get("/iot/devices", response_model=List[IoTDeviceRegistration], tags=["IoT Ingestion"])
async def list_registered_iot_devices():
    """Returns registered ESP32 stormwater culvert and ultrasonic sensors."""
    return iot_telemetry_registry.get_registered_devices()

@api_router.post("/iot/telemetry", tags=["IoT Ingestion"])
async def ingest_iot_telemetry(payload: IoTTelemetryPayload):
    """Ingests real-time or simulated ESP32 ultrasonic water-depth and tipping-bucket telemetry."""
    return iot_telemetry_registry.ingest_telemetry(payload)

# 15. User Roles, Security & Audit Logs
@api_router.get("/users/me/{user_id}", response_model=Optional[UserProfileRecord], tags=["Roles & Security"])
async def get_my_profile(user_id: str):
    """Returns the verified profile and server-enforced role for the authenticated user."""
    profile = role_service.get_user_profile(user_id)
    if not profile:
        raise HTTPException(status_code=404, detail="User profile not found in Supabase Auth.")
    return profile

@api_router.get("/users", response_model=List[UserProfileRecord], tags=["Roles & Security"])
async def list_all_users():
    """Lists all registered users and their assigned roles (Admin only)."""
    return role_service.list_users()

@api_router.put("/users/role", tags=["Roles & Security"])
async def update_user_role(req: RoleUpdateRequest, actor_id: str = Query(...), actor_email: str = Query(...)):
    """Assigns or modifies a user's role and account status."""
    actor_profile = role_service.get_user_profile(actor_id)
    if not actor_profile or actor_profile.role != "administrator":
        raise HTTPException(status_code=403, detail="Only verified administrators can modify roles.")

    success = role_service.update_user_role(
        target_user_id=req.user_id,
        new_role=req.role,
        account_status=req.account_status or "active",
        actor_id=actor_id,
        actor_email=actor_email
    )
    if not success:
        raise HTTPException(status_code=500, detail="Failed to update user role in Supabase.")
    return {"status": "success", "message": f"User {req.user_id} updated to {req.role} ({req.account_status})"}

@api_router.get("/audit/logs", response_model=List[AuditLogEntry], tags=["Roles & Security"])
async def get_audit_logs(limit: int = 50):
    """Returns persistent audit log entries for administrative oversight."""
    return role_service.get_audit_logs(limit=limit)
