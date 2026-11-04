"""
NEERPATH Google Gemini AI Service.
Integrates Google GenAI SDK (gemini-3.5-flash-lite) for:
1. Citizen flood report classification and sentiment/urgency extraction.
2. Narrative description analysis (identifying estimated water depth, blockages, affected transit modes).
3. Duplicate or suspicious report verification assistance for emergency dispatchers.
4. Explainable monsoonal flood-risk insights for commuters and tactical responders.
Credentials are kept exclusively on the backend.
"""
import json
import logging
from typing import Dict, Any, List, Optional
from pydantic import BaseModel
from app.core.config import settings

logger = logging.getLogger(__name__)

class GeminiIncidentAnalysis(BaseModel):
    category_suggestion: str
    urgency_tier: str  # LOW, MEDIUM, HIGH, CRITICAL
    estimated_water_depth_cm: Optional[float] = None
    passable_vehicles: Dict[str, bool]
    key_hazards: List[str]
    is_suspicious_or_spam: bool
    suspicion_reason: Optional[str] = None
    tactical_summary: str
    confidence_score: float

class GeminiRiskExplanation(BaseModel):
    corridor_name: str
    flood_risk_level: str
    geomorphology_factor: str
    monsoon_context: str
    recommended_action: str
    alternative_route_tip: str

class GeminiService:
    def __init__(self):
        self._client = None
        self._initialized = False

    def _get_client(self):
        if self._initialized:
            return self._client

        api_key = settings.GEMINI_API_KEY
        if not api_key:
            logger.info("GEMINI_API_KEY is not set. Gemini AI will operate in fallback mode.")
            return None

        try:
            from google import genai
            self._client = genai.Client(api_key=api_key)
            self._initialized = True
            logger.info(f"Google GenAI SDK Client initialized with model {settings.GEMINI_MODEL}.")
            return self._client
        except Exception as exc:
            logger.warning(f"Failed to initialize Google GenAI SDK: {exc}")
            return None

    def analyze_incident_report(
        self,
        description: str,
        location_name: str,
        reported_category: str = "ROAD_INUNDATION"
    ) -> GeminiIncidentAnalysis:
        """
        Uses Gemini to parse citizen descriptions, extract depth, classify risk, and flag suspicious submissions.
        """
        client = self._get_client()
        if not client:
            return self._heuristic_report_fallback(description, location_name, reported_category)

        prompt = f"""
You are an expert AI flood intelligence analyst for NEERPATH operating in Mangaluru, Karnataka.
Analyze this citizen flood report:
- Location: {location_name}
- Citizen Reported Category: {reported_category}
- Citizen Description: "{description}"

Provide an accurate, safety-oriented assessment formatted strictly as valid JSON with these keys:
{{
  "category_suggestion": "ROAD_INUNDATION" | "UNDERPASS_FLOODING" | "DRAIN_OVERFLOW" | "LANDSLIDE_MUDSLIDE" | "TREE_FALL_HAZARD" | "RIVER_BACKFLOW" | "GENERAL_WATERLOGGING",
  "urgency_tier": "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
  "estimated_water_depth_cm": <float or null>,
  "passable_vehicles": {{
    "two_wheelers": <bool>,
    "four_wheelers": <bool>,
    "emergency_vehicles": <bool>
  }},
  "key_hazards": [<list of strings>],
  "is_suspicious_or_spam": <bool>,
  "suspicion_reason": <string or null>,
  "tactical_summary": "<concise 1-2 sentence emergency dispatch summary>",
  "confidence_score": <float between 0.5 and 0.99>
}}
Do not include markdown backticks or commentary, only raw JSON.
"""
        try:
            response = client.models.generate_content(
                model=settings.GEMINI_MODEL,
                contents=prompt
            )
            raw_text = response.text.strip()
            if raw_text.startswith("```"):
                raw_text = raw_text.split("```")[1]
                if raw_text.startswith("json"):
                    raw_text = raw_text[4:].strip()
            data = json.loads(raw_text)
            return GeminiIncidentAnalysis(**data)
        except Exception as exc:
            logger.warning(f"Gemini API analysis failed: {exc}. Using heuristic fallback.")
            return self._heuristic_report_fallback(description, location_name, reported_category)

    def explain_road_risk(
        self,
        road_name: str,
        ward: str,
        elevation: float,
        rainfall_rate_mm_h: float,
        water_depth_cm: float,
        current_status: str
    ) -> GeminiRiskExplanation:
        """
        Generates explainable, conversational flood-risk insights for a specific road corridor.
        """
        client = self._get_client()
        if not client:
            return self._heuristic_risk_fallback(road_name, ward, elevation, rainfall_rate_mm_h, water_depth_cm, current_status)

        prompt = f"""
You are the NEERPATH AI Road Safety Advisor for Mangaluru coastal district.
Explain the flood risk for this corridor:
- Road Name: {road_name} ({ward})
- Elevation: {elevation} meters above MSL
- Current Rainfall Rate: {rainfall_rate_mm_h} mm/hr
- Observed Water Depth: {water_depth_cm} cm
- Road Status: {current_status}

Provide an explainable monsoon safety brief strictly as valid JSON:
{{
  "corridor_name": "{road_name}",
  "flood_risk_level": "LOW" | "MODERATE" | "HIGH" | "CRITICAL",
  "geomorphology_factor": "<brief explanation of elevation and terrain drainage>",
  "monsoon_context": "<how current rain impacts this segment>",
  "recommended_action": "<actionable advice for commuters and responders>",
  "alternative_route_tip": "<suggested detour or elevated bypass corridor in Mangaluru>"
}}
Return raw JSON only.
"""
        try:
            response = client.models.generate_content(
                model=settings.GEMINI_MODEL,
                contents=prompt
            )
            raw_text = response.text.strip()
            if raw_text.startswith("```"):
                raw_text = raw_text.split("```")[1]
                if raw_text.startswith("json"):
                    raw_text = raw_text[4:].strip()
            data = json.loads(raw_text)
            return GeminiRiskExplanation(**data)
        except Exception as exc:
            logger.warning(f"Gemini risk explanation failed: {exc}. Using fallback.")
            return self._heuristic_risk_fallback(road_name, ward, elevation, rainfall_rate_mm_h, water_depth_cm, current_status)

    def _heuristic_report_fallback(self, description: str, location_name: str, category: str) -> GeminiIncidentAnalysis:
        desc_lower = (description or "").lower()
        is_suspicious = len(description.strip()) < 5 or any(w in desc_lower for w in ["test", "asdf", "fake", "spam"])
        has_depth = "knee" in desc_lower or "waist" in desc_lower or "submerged" in desc_lower or "blocked" in desc_lower
        
        depth = 45.0 if "waist" in desc_lower else 25.0 if "knee" in desc_lower else 10.0
        urgency = "CRITICAL" if "submerged" in desc_lower or "blocked" in desc_lower else "MEDIUM"

        return GeminiIncidentAnalysis(
            category_suggestion=category,
            urgency_tier=urgency,
            estimated_water_depth_cm=depth,
            passable_vehicles={
                "two_wheelers": depth < 15.0,
                "four_wheelers": depth < 30.0,
                "emergency_vehicles": depth < 50.0
            },
            key_hazards=["Standing stormwater runoff", "Pothole concealment"],
            is_suspicious_or_spam=is_suspicious,
            suspicion_reason="Report description is very short or contains placeholder terms" if is_suspicious else None,
            tactical_summary=f"Incident reported at {location_name}. Caution advised due to monsoonal water accumulation.",
            confidence_score=0.78
        )

    def _heuristic_risk_fallback(self, road_name: str, ward: str, elevation: float, rain: float, depth: float, status: str) -> GeminiRiskExplanation:
        is_lowland = elevation < 10.0
        risk = "CRITICAL" if status == "BLOCKED" or depth > 40.0 else "HIGH" if depth > 20.0 or rain > 25.0 else "MODERATE" if is_lowland else "LOW"
        return GeminiRiskExplanation(
            corridor_name=road_name,
            flood_risk_level=risk,
            geomorphology_factor=f"Low-lying coastal corridor at {elevation}m MSL prone to tidal rainwater bottleneck." if is_lowland else f"Elevated terrain ({elevation}m MSL) with active gravity runoff.",
            monsoon_context=f"Rainfall rate of {rain} mm/h producing ~{depth}cm surface water.",
            recommended_action="Do not attempt to traverse flooded underpass." if risk in ["CRITICAL", "HIGH"] else "Maintain low speed and headlight visibility.",
            alternative_route_tip="Use Kadri Hills or Kuntikan elevated ridge bypass." if is_lowland else "Corridor remains viable for emergency vehicles."
        )

gemini_service = GeminiService()

