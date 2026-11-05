# FLOODGUARD Vercel Environment Configuration Guide

This deployment setup is designed for FLOODGUARD using Vercel's **Multi-Service Architecture** defined in `vercel.json`.

---

## 1. Overview of Generated Files

| File | Target Vercel Service | Root Path | Visibility |
| :--- | :--- | :--- | :--- |
| `frontend.vercel.env` | **`frontend`** | `frontend/` | Public / Client-Side (Vite bundled) |
| `backend.vercel.env` | **`backend`** | `backend/` | Private / Serverless Runtime |

> [!IMPORTANT]
> Both files are automatically ignored by `.gitignore` (`frontend.vercel.env`, `backend.vercel.env`, and `*.vercel.env`). Never commit them or check them into GitHub.

---

## 2. Variables Breakdown & Classification

### A. Frontend Service (`frontend.vercel.env`)
These variables are baked into the client-side JavaScript bundle during `vite build`. None of them contain server secrets.

- **`VITE_API_BASE_URL=/api`**: Configured for relative same-domain routing via Vercel's multi-service `/api/(.*)` rewrite.
- **`VITE_SUPABASE_URL`**: Public Supabase Project URL.
- **`VITE_SUPABASE_PUBLISHABLE_KEY`**: Public Supabase anonymous client key.
- **`VITE_FIREBASE_API_KEY`**, **`VITE_FIREBASE_AUTH_DOMAIN`**, **`VITE_FIREBASE_PROJECT_ID`**, **`VITE_FIREBASE_STORAGE_BUCKET`**, **`VITE_FIREBASE_MESSAGING_SENDER_ID`**, **`VITE_FIREBASE_APP_ID`**, **`VITE_FIREBASE_MEASUREMENT_ID`**, **`VITE_FIREBASE_VAPID_KEY`**: Firebase Web SDK client configuration used for push notification subscription and analytics.
- **`VITE_MANGALURU_LAT`** & **`VITE_MANGALURU_LON`**: Default map center coordinates for Mangaluru (`12.9141`, `74.8560`).

### B. Backend Service (`backend.vercel.env`)
These variables are loaded securely at runtime by the FastAPI application and are never sent to the browser.

- **`ENVIRONMENT=production`**
- **`DATABASE_URL`**: PostgreSQL connection string (see [Placeholders to Replace](#3-values-you-must-replace)).
- **`SUPABASE_URL`**: Supabase project endpoint.
- **`SUPABASE_KEY` / `SUPABASE_SECRET_KEY`**: Supabase Service-Role Admin Secret (used for role management and backend verification).
- **`SUPABASE_PUBLISHABLE_KEY`**: Public Supabase key reference.
- **`ORS_API_KEY` & `ORS_BASE_URL`**: HeiGIT / OpenRouteService routing API key.
- **`GEMINI_API_KEY` & `GEMINI_MODEL`**: Google Gemini GenAI API key and model selection (`gemini-3.5-flash-lite`).
- **`OPEN_METEO_BASE_URL`**, **`OPEN_METEO_API_URL`**, **`OPEN_METEO_TIMEZONE`**, **`OPEN_METEO_FORECAST_DAYS`**: Open-Meteo weather parameters.
- **`CORS_ORIGINS`**: Permitted domains (`["https://*.vercel.app"]`).
- **`FIREBASE_PROJECT_ID`**, **`FIREBASE_SERVICE_ACCOUNT_KEY_PATH`**, **`FIREBASE_SERVICE_ACCOUNT_JSON`**: Backend Firebase Admin SDK integration (optional).
- **`MANGALURU_LAT`** & **`MANGALURU_LON`**: Baseline GIS coordinates.

---

## 3. Values You Must Replace

### `DATABASE_URL` in `backend.vercel.env`
Localhost databases are forbidden in production. `backend.vercel.env` contains the placeholder:
```bash
DATABASE_URL=REPLACE_WITH_PRODUCTION_SUPABASE_POSTGRES_DIRECT_OR_POOLER_URL
```
**Where to obtain it:**
1. Navigate to your Supabase Project Dashboard (`https://supabase.com/dashboard/project/vvhhccpzwdcodzpojrhi`).
2. Go to **Project Settings** > **Database** > **Connection String**.
3. Select **URI** (or **Session / Transaction Pooler** if deploying with serverless functions on port 6543 / 5432).
4. Replace the placeholder in `backend.vercel.env` before importing, or enter it directly in the Vercel Dashboard.

---

## 4. Credentials Identified for Security Rotation

During earlier development phases, the following API keys were pasted into prompts or unencrypted scratch files:

1. **Google Gemini API Key (`GEMINI_API_KEY`)**:
   - *Recommendation*: Generate a fresh API key in Google AI Studio and rotate the backend environment variable.
2. **Supabase Secret Key (`SUPABASE_SECRET_KEY` / `SUPABASE_KEY`)**:
   - *Recommendation*: If this secret was ever committed to version control, roll the service_role key in Supabase Project Settings > API.
3. **OpenRouteService Key (`ORS_API_KEY`)**:
   - *Recommendation*: Rotate in your HeiGIT / OpenRouteService dashboard if shared outside private channels.

---

## 5. How to Import into Vercel

### Step 1: Open Your Project on Vercel
1. Go to your FLOODGUARD project on [vercel.com](https://vercel.com).
2. Click **Settings** > **Environment Variables**.

### Step 2: Import for the `frontend` Service
1. Select the **Import .env** button.
2. Paste the contents of `frontend.vercel.env` (or drag and drop the file).
3. If using Vercel Services target selection, assign these variables to the **`frontend`** service.
4. Select environments: **Production**, **Preview**, and **Development**.
5. Click **Save**.

### Step 3: Import for the `backend` Service
1. In **Settings** > **Environment Variables**, select **Import .env**.
2. Paste the contents of `backend.vercel.env`.
3. Ensure you have replaced `DATABASE_URL` with your Supabase PostgreSQL connection string.
4. If using Vercel Services target selection, assign these variables to the **`backend`** service.
5. Select environments: **Production**, **Preview**, and **Development**.
6. Click **Save**.

---

## 6. Preview vs. Production Recommendations

- **`CORS_ORIGINS`**:
  - In Production: Keep strictly locked to your FLOODGUARD domain: `["https://floodguard.vercel.app", "https://*.vercel.app"]`.
  - In Preview: `https://*.vercel.app` allows your preview branch deployments to access the backend API securely without CORS rejection.
- **`ENVIRONMENT`**:
  - Set to `production` for Production deployments.
  - Optionally set to `staging` or `preview` for preview environments.

