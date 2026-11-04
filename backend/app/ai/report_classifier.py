"""
NEERPATH AI Report Classifier & Text Triage Engine.
Identifies:
- Waterlogging reports
- Road blockage reports
- Heavy rainfall reports
- Infrastructure damage reports
- Potentially suspicious / spam reports
Includes human-in-the-loop review flags.
"""
import re
from typing import List, Dict, Any, Optional
from pydantic import BaseModel
from datetime import datetime, timezone

class ClassificationCategory(str):
    WATERLOGGING = "WATERLOGGING"
    ROAD_BLOCKAGE = "ROAD_BLOCKAGE"
    HEAVY_RAINFALL = "HEAVY_RAINFALL"
    INFRASTRUCTURE_DAMAGE = "INFRASTRUCTURE_DAMAGE"
    SUSPICIOUS_SPAM = "SUSPICIOUS_SPAM"
    GENERAL_OBSERVATION = "GENERAL_OBSERVATION"

class ClassifiedReportResult(BaseModel):
    primary_category: str
    confidence_score: float
    detected_keywords: List[str]
    is_potentially_suspicious: bool
    suspicious_reason: Optional[str] = None
    requires_human_priority_review: bool
    extracted_entities: Dict[str, Any]
    summary_sentiment: str  # URGENT, CAUTION, INFORMATIVE

class ReportClassifier:
    KEYWORDS = {
        ClassificationCategory.WATERLOGGING: [
            "water", "flooded", "waterlogging", "submerged", "waist", "knee", "ankle",
            "puddle", "drain", "clogged", "overflow", "stagnant", "neeru", "waterlog"
        ],
        ClassificationCategory.ROAD_BLOCKAGE: [
            "block", "blocked", "closed", "impassable", "traffic jam", "stuck",
            "stranded", "stalled", "divert", "diversion", "gridlock", "jam", "barrier"
        ],
        ClassificationCategory.HEAVY_RAINFALL: [
            "rain", "downpour", "heavy rain", "torrential", "monsoon", "cloudburst",
            "storm", "shower", "thunderstorm", "gale", "mazhe", "cyclone"
        ],
        ClassificationCategory.INFRASTRUCTURE_DAMAGE: [
            "pothole", "cave in", "sinkhole", "landslide", "mudslide", "collapsed",
            "tree fallen", "pole fallen", "wire broken", "bridge damage", "cracked road"
        ],
        ClassificationCategory.SUSPICIOUS_SPAM: [
            "test", "asdf", "dummy", "fake", "buy", "discount", "promo", "crypto",
            "free", "click here", "http://", "https://"
        ]
    }

    def classify_text(self, text: Optional[str], location_name: str = "") -> ClassifiedReportResult:
        full_text = f"{location_name} {text or ''}".lower()
        tokens = set(re.findall(r'\b\w+\b', full_text))

        category_scores: Dict[str, float] = {}
        matched_words: Dict[str, List[str]] = {}

        for category, kws in self.KEYWORDS.items():
            matches = [kw for kw in kws if kw in full_text]
            matched_words[category] = matches
            category_scores[category] = len(matches) / max(1, len(kws) * 0.4)

        # Check for suspicious spam indicators
        is_suspicious = False
        suspicious_reason = None

        if len(matched_words[ClassificationCategory.SUSPICIOUS_SPAM]) > 0:
            is_suspicious = True
            suspicious_reason = f"Contains suspicious keyword/link: {', '.join(matched_words[ClassificationCategory.SUSPICIOUS_SPAM])}"
        elif len(text.strip() if text else "") < 5 and not location_name:
            is_suspicious = True
            suspicious_reason = "Extremely short or vague submission"

        # Determine primary category
        primary_cat = ClassificationCategory.GENERAL_OBSERVATION
        max_score = 0.0

        for cat in [
            ClassificationCategory.ROAD_BLOCKAGE,
            ClassificationCategory.INFRASTRUCTURE_DAMAGE,
            ClassificationCategory.WATERLOGGING,
            ClassificationCategory.HEAVY_RAINFALL
        ]:
            if category_scores.get(cat, 0.0) > max_score and category_scores[cat] > 0.05:
                max_score = category_scores[cat]
                primary_cat = cat

        if is_suspicious:
            primary_cat = ClassificationCategory.SUSPICIOUS_SPAM
            max_score = max(max_score, 0.85)

        # Confidence calculation based on matched terms
        match_count = len(matched_words.get(primary_cat, []))
        confidence = min(0.98, max(0.40, 0.40 + (match_count * 0.15)))
        if is_suspicious:
            confidence = 0.90

        # Human Review Priority
        requires_human_review = (
            primary_cat in [ClassificationCategory.ROAD_BLOCKAGE, ClassificationCategory.INFRASTRUCTURE_DAMAGE]
            or is_suspicious
            or "submerged" in full_text
            or "stranded" in full_text
        )

        sentiment = "URGENT" if primary_cat in [ClassificationCategory.ROAD_BLOCKAGE, ClassificationCategory.INFRASTRUCTURE_DAMAGE] else "CAUTION" if primary_cat == ClassificationCategory.WATERLOGGING else "INFORMATIVE"

        return ClassifiedReportResult(
            primary_category=primary_cat,
            confidence_score=round(confidence, 2),
            detected_keywords=matched_words.get(primary_cat, []),
            is_potentially_suspicious=is_suspicious,
            suspicious_reason=suspicious_reason,
            requires_human_priority_review=requires_human_review,
            extracted_entities={
                "location_tokens": [t for t in ["kottara", "pumpwell", "kadri", "car street", "baikampady", "state bank", "bejai"] if t in full_text],
                "severity_indicators": [s for s in ["waist", "knee", "submerged", "ankle", "deep"] if s in full_text]
            },
            summary_sentiment=sentiment
        )

report_classifier = ReportClassifier()
