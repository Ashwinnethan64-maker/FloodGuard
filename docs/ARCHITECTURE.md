# NEERPATH System Architecture & Engineering Dossier

## 1. System Philosophy
NEERPATH is an AI-powered, GIS-based road-level flood intelligence and emergency route management platform specifically engineered for the unique monsoonal challenges of Mangaluru, Karnataka.

```
                          ┌─────────────────────────────────────┐
                          │     External Weather Telemetry      │
                          │   (Open-Meteo Mangaluru AWS Grid)   │
                          └──────────────────┬──────────────────┘
                                             │
                                             ▼
┌─────────────────────────┐       ┌─────────────────────┐       ┌────────────────────────┐
│   Citizen Commuter UI   │ ────► │  NEERPATH API Layer │ ◄───► │ Emergency Dispatcher & │
│ (React + Vite + MapLibre│       │      (FastAPI)      │       │    Patrol Console      │
└─────────────────────────┘       └──────────┬──────────┘       └────────────────────────┘
                                             │
               ┌─────────────────────────────┼────────────────────────────┐
               ▼                             ▼                            ▼
┌─────────────────────────────┐ ┌─────────────────────────┐ ┌───────────────────────────┐
│ PostGIS Geospatial Database │ │ AI Risk Scoring Engine  │ │  Flood-Aware Route Engine │
│ (Corridors, RLS, Incidents) │ │(Rainfall+Elevation+Heur)│ │(Hard Exclusion + Penalty) │
└─────────────────────────────┘ └─────────────────────────┘ └───────────────────────────┘
```

---

## 2. Component Directory

| Module | Location | Purpose |
| :--- | :--- | :--- |
| **Geospatial Map** | `frontend/src/components/map/MangaluruMap.tsx` | MapLibre GL JS engine rendering road lines, pulsing incident pins, location jumping |
| **Flood Routing** | `backend/app/services/routing_service.py` | Hard exclusion of blocked roads, multi-tier risk penalty, and transit time recalculation |
| **AI Risk Engine** | `backend/app/ai/risk_engine.py` | Multi-factor empirical weighting with plain-language explainability rationales |
| **ML Pipeline** | `backend/app/ai/ml_pipeline.py` | Random Forest held-out test split validation on calibrated historical records |
| **NLP Classifier** | `backend/app/ai/report_classifier.py` | Inundation text triage, keyword extraction, and spam detection |
| **Image Analyzer** | `backend/app/ai/image_analyzer.py` | OpenCV specular reflection ratio & water presence heuristics |
| **Guided Demo** | `frontend/src/pages/DemonstrationPage.tsx` | 4-step live interactive walkthrough proving the complete platform loop |
| **IoT Registry** | `backend/app/services/iot_service.py` | ESP32 ultrasonic water-depth and tipping-bucket ingestion specification |
| **Alert Service** | `backend/app/services/alert_service.py` | In-memory broadcast & acknowledgment notifications (FCM ready) |
| **PostGIS Database** | `database/001_schema.sql` | 10 tables, spatial indexes, and Row Level Security policies |

---

## 3. Data Integrity & Safety Invariants
1. **Never auto-block on citizen rumors**: Citizen reports default strictly to `PENDING` & `UNVERIFIED`. Only authorized dispatchers can mark a road `BLOCKED`.
2. **Never guarantee route safety**: All routes are marked as advisory due to the rapid onset of coastal Karnataka flash inundations.
3. **No fabricated statistics**: Real-time AWS observations are strictly disambiguated from numerical ECMWF weather forecasts.

