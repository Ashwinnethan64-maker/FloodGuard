# NEERPATH – AI-Powered Road Intelligence
> *"Know the road. Navigate the risk."*

**Team:** Horizon Hacks  
**Team Leader:** Ashwin Nethan  
**Target Area:** Mangaluru, Karnataka, India  

---

## 🚀 Overview
NEERPATH is an AI-powered, GIS-based road-level flood intelligence and emergency route management platform designed specifically for the heavy monsoon conditions of Mangaluru, Karnataka. It empowers commuters, emergency dispatchers, and municipal responders to navigate flash waterlogging, triage citizen reports with AI, and plan resilient transit paths.

---

## 🌟 Core Modules & Architecture

```
neerpath/
├── backend/                  # FastAPI Application, Services, Schemas, Core Config
│   ├── app/
│   │   ├── ai/               # AI Risk Engine, NLP Classifier, OpenCV Analyzer, ML Pipeline
│   │   ├── api/              # REST Endpoints (Health, Dashboard, Roads, Incidents, Routing, Alerts, IoT, Demo)
│   │   ├── core/             # Pydantic Settings & Environment
│   │   ├── schemas/          # GeoJSON, Weather, Incident, & AI Schemas
│   │   ├── services/         # Road GIS, Routing, Alert Dispatch, IoT, & Demonstration Engines
│   │   └── main.py           # FastAPI ASGI entrypoint
│   ├── migrations/           # Initial PostGIS schema
│   ├── tests/                # 13 Automated Pytest Integration & Unit Tests
│   ├── uploads/              # Incident photograph uploads directory
│   ├── requirements.txt
│   └── .env.example
├── database/                 # Supabase / PostgreSQL / PostGIS SQL Scripts
│   ├── 001_schema.sql        # 10 Tables, PostGIS spatial indexes, and Row Level Security (RLS)
│   └── 002_demo_seed.sql     # Mangaluru demo seed corridors & test profiles
├── docs/                     # Engineering & Architecture Dossiers
│   ├── ARCHITECTURE.md       # Full system architecture and component catalog
│   ├── DATABASE_GUIDE.md     # PostGIS schema, RLS policies, & role definitions
│   └── DEPLOYMENT_GUIDE.md   # Production deployment for Render (backend) & Vercel (frontend)
├── frontend/                 # React 19 + Vite + TypeScript + Tailwind CSS
│   ├── src/
│   │   ├── components/       # Layout, MapLibre GL JS engine, interactive legend
│   │   ├── context/          # Role-based Auth (Resident, Responder, Administrator)
│   │   ├── pages/            # 10 Production Pages (Dashboard, Map, Routes, AI Engine, Demo, Responder, etc.)
│   │   ├── services/         # Strongly-typed API client
│   │   └── types/            # TypeScript interfaces
│   ├── vite.config.ts
│   └── .env.example
├── .gitignore
├── .env.example
└── README.md
```

---

## 🏃 Running the Application Locally

### 1. Backend Setup
```powershell
# Open terminal in project root
$env:PYTHONPATH="z:\NEERPATH\backend"
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```
- API Documentation (Swagger): `http://localhost:8000/docs`
- Health Diagnostic: `http://localhost:8000/api/health`

### 2. Frontend Setup
```powershell
cd z:\NEERPATH\frontend
npm run dev
```
- Web Application: `http://localhost:5173`

---

## 🎯 Guided Demonstration Workflow

A live 4-stage guided simulation is built directly into the UI at the **Live Demo** tab (`/demo`):

1. **Stage 1 (Torrential Rain)**: Triggers simulated 55 mm/hr downpour; updates AWS rainfall telemetry.
2. **Stage 2 (Citizen Report)**: Files an emergency flood hazard at Kottara underpass. Enforces safety rule: status defaults strictly to `PENDING` and does **not** close the road.
3. **Stage 3 (Admin Verification)**: Traffic Police verifies 65cm water depth; marks road corridor as `BLOCKED`.
4. **Stage 4 (Flood-Aware Bypass)**: Commuter queries route; the routing engine automatically excludes the blocked underpass and routes via the *Elevated Kadri Ridge Bypass*, explaining why the route was chosen.

---

## 🛡️ Data Quality & Safety Invariants
1. **Source Disambiguation**: Clear provenance markers (`WEATHER_STATION`, `FORECAST`, `CITIZEN_REPORT`, `ADMIN_VERIFIED`, `AI_ESTIMATE`, `SIMULATED_DEMO`).
2. **Non-Blocking Citizen Reports**: A citizen report never automatically marks a road as `BLOCKED` without official verification.
3. **Never Guarantee Safety**: All routes are marked as advisory due to coastal Karnataka flash inundations.
4. **Transparent AI**: Every risk assessment explicitly details its mathematical weights and drivers.
