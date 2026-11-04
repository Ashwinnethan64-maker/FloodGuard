import pytest
from app.ai.risk_engine import flood_risk_engine, RiskCategory
from app.ai.report_classifier import report_classifier
from app.ai.ml_pipeline import flood_ml_pipeline

def test_risk_engine_provisional_scoring():
    assessment = flood_risk_engine.assess_road_segment(
        road_id="corridor-kottara-chowki",
        road_name="NH-66 Kottara Chowki Flyover Underpass",
        ward="Kottara / Derebail",
        elevation_meters=4.5,
        historical_susceptibility_score=0.95,
        current_rainfall_rate_mm_h=45.0,
        rainfall_24h_accumulation_mm=130.0,
        nearby_verified_incidents_count=2,
        nearby_water_depth_cm=65.0,
        data_freshness_seconds=60
    )
    assert assessment.risk_category in [RiskCategory.HIGH, RiskCategory.CRITICAL]
    assert assessment.composite_risk_score > 0.60
    assert len(assessment.contributing_factors) >= 5
    assert "Explainable" in assessment.plain_language_explanation or "Risk index" in assessment.plain_language_explanation

def test_insufficient_data_handling():
    assessment = flood_risk_engine.assess_road_segment(
        road_id="test-road",
        road_name="Uninstrumented Stretch",
        ward="Rural Outskirts",
        elevation_meters=15.0,
        historical_susceptibility_score=0.2,
        current_rainfall_rate_mm_h=0.0,
        rainfall_24h_accumulation_mm=0.0,
        nearby_verified_incidents_count=0,
        nearby_water_depth_cm=0.0,
        data_freshness_seconds=7200,
        has_weather_station=False
    )
    assert assessment.risk_category == RiskCategory.INSUFFICIENT_DATA
    assert assessment.data_completeness_pct < 60.0

def test_nlp_report_classifier():
    res = report_classifier.classify_text(
        text="Water is knee deep near State Bank bus stand, small vehicles stalled",
        location_name="State Bank Circle"
    )
    assert res.primary_category == "WATERLOGGING"
    assert res.confidence_score > 0.50
    assert len(res.detected_keywords) > 0

def test_nlp_spam_detection():
    res = report_classifier.classify_text(
        text="Buy cheap crypto now click here http://spam.xyz",
        location_name=""
    )
    assert res.is_potentially_suspicious is True
    assert res.primary_category == "SUSPICIOUS_SPAM"

def test_ml_pipeline_held_out_evaluation():
    metrics = flood_ml_pipeline.train_and_evaluate()
    assert metrics.test_accuracy >= 0.80
    assert metrics.test_samples_count > 0
    assert "elevation_meters" in metrics.feature_importances
    assert "rainfall_1h_mm" in metrics.feature_importances

