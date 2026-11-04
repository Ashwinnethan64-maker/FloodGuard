# NEERPATH Production Deployment Guide

This guide details deployment of the **NEERPATH** system:
- **Frontend:** Vercel (React 19 + Vite + TypeScript)
- **Backend:** Render / Railway (FastAPI + Python 3.14 + Uvicorn)
- **Database:** Supabase (PostgreSQL 15+ with PostGIS)

---

## 1. Database Deployment (Supabase)

1. Create a project at [supabase.com](https://supabase.com).
2. Open the **SQL Editor** in the Supabase Dashboard.
3. Run [`database/001_schema.sql`](file:///z:/NEERPATH/database/001_schema.sql):
   - Activates `postgis` & `uuid-ossp`.
   - Creates tables: `profiles`, `roads`, `incidents`, `citizen_reports`, `road_status`, `weather_records`, `risk_assessments`, `route_requests`, `notifications`, `audit_logs`.
   - Applies PostGIS `GIST` indexes and Row Level Security (RLS) policies.
4. Run [`database/002_demo_seed.sql`](file:///z:/NEERPATH/database/002_demo_seed.sql) to populate initial Mangaluru demonstration corridors and test accounts.
5. In **Project Settings -> API**, obtain the `Project URL` and `anon public key`.

---

## 2. Backend Deployment (Render)

1. Link your GitHub repository to [render.com](https://render.com).
2. Create a new **Web Service**:
   - **Environment:** `Python 3`
   - **Root Directory:** `backend`
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
3. Configure Environment Variables in Render:
   ```env
   ENVIRONMENT=production
   DATABASE_URL=postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres
   SUPABASE_URL=https://[YOUR_PROJECT].supabase.co
   SUPABASE_KEY=[YOUR_SERVICE_KEY]
   OPEN_METEO_BASE_URL=https://api.open-meteo.com/v1
   CORS_ORIGINS=https://[YOUR_VERCEL_APP].vercel.app
   MANGALURU_LAT=12.9141
   MANGALURU_LON=74.8560
   ```
4. Health check endpoint: `https://[RENDER_APP_URL]/api/health`

---

## 3. Frontend Deployment (Vercel)

1. Import the repository into [vercel.com](https://vercel.com).
2. Set **Root Directory:** `frontend`.
3. Framework Preset: `Vite`.
4. Configure Environment Variables in Vercel:
   ```env
   VITE_API_BASE_URL=https://[RENDER_APP_URL]/api
   VITE_MANGALURU_LAT=12.9141
   VITE_MANGALURU_LON=74.8560
   ```
5. Deploy. Vercel automatically builds `dist/` with output code splitting.

---

## 4. Production Monitoring & Health Checks
- **Automated Health Check:** `GET /api/health` returns status of the router, AI engine, and IoT interface.
- **Log Monitoring:** Render automatically streams stdout/stderr Uvicorn logs.
- **Sentry Integration:** Optional Sentry SDK hook configured in `backend/app/core/config.py`.

