-- ==============================================================================
-- NEERPATH: Mangaluru Road Flood Intelligence Platform
-- Full Supabase / PostgreSQL + PostGIS Production Schema & Storage Setup
-- ==============================================================================

-- 1. EXTENSIONS (Supabase requires PostGIS under schema extensions)
CREATE EXTENSION IF NOT EXISTS postgis WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;

-- Ensure public schema has access to extension functions
GRANT USAGE ON SCHEMA extensions TO postgres, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA extensions GRANT EXECUTE ON FUNCTIONS TO postgres, anon, authenticated, service_role;

-- 2. ENUMS & DOMAINS
DO $$ BEGIN
    CREATE TYPE user_role_enum AS ENUM ('resident', 'responder', 'administrator');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE road_status_enum AS ENUM ('OPEN', 'CAUTION', 'BLOCKED', 'UNVERIFIED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE data_source_enum AS ENUM (
        'WEATHER_STATION',
        'WEATHER_FORECAST',
        'CITIZEN_REPORT',
        'ADMIN_VERIFIED',
        'AI_ESTIMATE',
        'SIMULATED_DEMO'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE severity_level_enum AS ENUM ('NONE', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE water_depth_category_enum AS ENUM (
        'DRY',
        'DAMP_WET',
        'ANKLE_DEEP',
        'KNEE_DEEP',
        'WAIST_DEEP',
        'SUBMERGED'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE verification_status_enum AS ENUM (
        'PENDING',
        'VERIFIED',
        'REJECTED',
        'RESOLVED'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE incident_category_enum AS ENUM (
        'WATERLOGGING',
        'FLASH_FLOOD',
        'POTHOLE_HAZARD',
        'MANHOLE_OVERFLOW',
        'TREE_FALL_BLOCK',
        'LANDSLIDE_SLIP',
        'DRAINAGE_BREACH'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. USERS / PROFILES TABLE (Mirrors Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    phone_number TEXT,
    role user_role_enum NOT NULL DEFAULT 'resident',
    ward_or_jurisdiction TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 4. ROAD SEGMENTS (Mangaluru Network with PostGIS LineString)
CREATE TABLE IF NOT EXISTS public.road_segments (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    osm_id TEXT,
    ward TEXT NOT NULL,
    road_type TEXT NOT NULL,
    geometry extensions.geometry(LineString, 4326) NOT NULL,
    length_km NUMERIC(6, 3) NOT NULL DEFAULT 0.0,
    elevation_meters NUMERIC(5, 2) NOT NULL DEFAULT 15.0,
    historical_flood_risk_score NUMERIC(3, 2) NOT NULL DEFAULT 0.1,
    current_status road_status_enum NOT NULL DEFAULT 'OPEN',
    current_water_depth_cm NUMERIC(5, 1) NOT NULL DEFAULT 0.0,
    last_status_update TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    status_source data_source_enum NOT NULL DEFAULT 'AI_ESTIMATE',
    active_incidents_count INT NOT NULL DEFAULT 0,
    is_critical_artery BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 5. FLOOD INCIDENTS (Citizen and Responder Reports with PostGIS Point)
CREATE TABLE IF NOT EXISTS public.flood_incidents (
    id TEXT PRIMARY KEY DEFAULT ('NP-' || upper(substr(md5(random()::text), 1, 8))),
    reporter_id UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
    location_name TEXT NOT NULL,
    ward TEXT NOT NULL,
    coordinates extensions.geometry(Point, 4326) NOT NULL,
    incident_category incident_category_enum NOT NULL,
    reported_water_depth water_depth_category_enum NOT NULL DEFAULT 'DAMP_WET',
    estimated_depth_cm NUMERIC(5, 1) NOT NULL DEFAULT 10.0,
    severity severity_level_enum NOT NULL DEFAULT 'LOW',
    description TEXT,
    photo_url TEXT,
    observed_time TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    passable_two_wheelers BOOLEAN NOT NULL DEFAULT true,
    passable_four_wheelers BOOLEAN NOT NULL DEFAULT true,
    passable_emergency_vehicles BOOLEAN NOT NULL DEFAULT true,
    associated_road_id TEXT REFERENCES public.road_segments(id) ON DELETE SET NULL,
    verification_status verification_status_enum NOT NULL DEFAULT 'PENDING',
    verified_by UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
    verified_at TIMESTAMPTZ,
    admin_notes TEXT,
    ai_risk_score NUMERIC(3, 2) NOT NULL DEFAULT 0.35,
    is_duplicate_flag BOOLEAN NOT NULL DEFAULT false,
    potential_duplicate_of TEXT REFERENCES public.flood_incidents(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 6. WEATHER OBSERVATIONS
CREATE TABLE IF NOT EXISTS public.weather_observations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    station_name TEXT NOT NULL DEFAULT 'Mangaluru Central Weather Stn',
    latitude NUMERIC(8, 5) NOT NULL DEFAULT 12.9141,
    longitude NUMERIC(8, 5) NOT NULL DEFAULT 74.8560,
    observation_time TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    temperature_c NUMERIC(4, 1) NOT NULL,
    relative_humidity_percent NUMERIC(5, 2) NOT NULL,
    precipitation_intensity_mm_h NUMERIC(5, 2) NOT NULL,
    precipitation_accumulation_24h_mm NUMERIC(6, 2) NOT NULL,
    wind_speed_kmh NUMERIC(5, 2) NOT NULL,
    wind_direction_deg NUMERIC(5, 1),
    weather_condition_code TEXT NOT NULL,
    weather_condition_label TEXT NOT NULL,
    is_forecast BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 7. SPATIAL INDEXES
CREATE INDEX IF NOT EXISTS idx_road_segments_geom ON public.road_segments USING GIST (geometry);
CREATE INDEX IF NOT EXISTS idx_flood_incidents_geom ON public.flood_incidents USING GIST (coordinates);
CREATE INDEX IF NOT EXISTS idx_flood_incidents_status ON public.flood_incidents (verification_status);
CREATE INDEX IF NOT EXISTS idx_road_segments_status ON public.road_segments (current_status);

-- 8. ROW LEVEL SECURITY (RLS)
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.road_segments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flood_incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weather_observations ENABLE ROW LEVEL SECURITY;

-- 8.1 User Profiles Policies
CREATE POLICY "Public profiles are readable by authenticated users"
    ON public.user_profiles FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Users can update own profile"
    ON public.user_profiles FOR UPDATE
    TO authenticated
    USING (auth.uid() = id);

-- 8.2 Road Segments Policies (Public read, admin/system write)
CREATE POLICY "Road segments are publicly readable"
    ON public.road_segments FOR SELECT
    TO anon, authenticated
    USING (true);

CREATE POLICY "Road segments modifiable by service role and admins"
    ON public.road_segments FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles
            WHERE user_profiles.id = auth.uid()
            AND user_profiles.role IN ('administrator', 'responder')
        )
    );

-- 8.3 Flood Incidents Policies
CREATE POLICY "Incidents are readable by all"
    ON public.flood_incidents FOR SELECT
    TO anon, authenticated
    USING (true);

CREATE POLICY "Anyone can submit citizen reports"
    ON public.flood_incidents FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

CREATE POLICY "Admins and responders can update incidents"
    ON public.flood_incidents FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles
            WHERE user_profiles.id = auth.uid()
            AND user_profiles.role IN ('administrator', 'responder')
        )
    );

-- 8.4 Weather Observations Policies
CREATE POLICY "Weather observations publicly readable"
    ON public.weather_observations FOR SELECT
    TO anon, authenticated
    USING (true);

-- 9. SUPABASE STORAGE BUCKET FOR INCIDENT PHOTOS
-- Note: Run in Supabase SQL editor to ensure 'incident-photos' exists with public read access
INSERT INTO storage.buckets (id, name, public)
VALUES ('incident-photos', 'incident-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS Policies
CREATE POLICY "Public Access for Incident Photos"
    ON storage.objects FOR SELECT
    TO anon, authenticated
    USING (bucket_id = 'incident-photos');

CREATE POLICY "Citizens and Users can upload incident photos"
    ON storage.objects FOR INSERT
    TO anon, authenticated
    WITH CHECK (bucket_id = 'incident-photos');

