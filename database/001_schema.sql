-- ==============================================================================
-- NEERPATH: Mangaluru Road Flood Intelligence Platform
-- Full Supabase / PostgreSQL + PostGIS Production Schema
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. ENUMS & DOMAINS
CREATE TYPE user_role_enum AS ENUM (
    'resident',
    'responder',
    'administrator'
);

CREATE TYPE road_status_enum AS ENUM (
    'OPEN',
    'CAUTION',
    'BLOCKED',
    'UNVERIFIED'
);

CREATE TYPE data_source_enum AS ENUM (
    'WEATHER_STATION',
    'WEATHER_FORECAST',
    'CITIZEN_REPORT',
    'ADMIN_VERIFIED',
    'AI_ESTIMATE',
    'SIMULATED_DEMO'
);

CREATE TYPE severity_level_enum AS ENUM (
    'NONE',
    'LOW',
    'MEDIUM',
    'HIGH',
    'CRITICAL'
);

CREATE TYPE water_depth_category_enum AS ENUM (
    'DRY',
    'DAMP_WET',
    'ANKLE_DEEP',
    'KNEE_DEEP',
    'WAIST_DEEP',
    'SUBMERGED'
);

CREATE TYPE verification_status_enum AS ENUM (
    'PENDING',
    'VERIFIED',
    'REJECTED',
    'RESOLVED'
);

CREATE TYPE notification_type_enum AS ENUM (
    'ROAD_BLOCKED',
    'ROAD_CAUTION',
    'WEATHER_ALERT',
    'INCIDENT_VERIFIED',
    'DISPATCH_ALERT'
);

-- 3. PROFILES TABLE (Supabase auth.users integration)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    role user_role_enum NOT NULL DEFAULT 'resident',
    phone_number VARCHAR(32),
    ward_location VARCHAR(128) DEFAULT 'Mangaluru',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. ROADS (Mangaluru Road Network)
CREATE TABLE IF NOT EXISTS roads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    osm_id VARCHAR(64),
    name VARCHAR(255) NOT NULL,
    ward VARCHAR(128) NOT NULL,
    road_type VARCHAR(64) DEFAULT 'primary',
    elevation_meters NUMERIC(6, 2) DEFAULT 10.0,
    historical_flood_risk_score NUMERIC(3, 2) DEFAULT 0.0 CHECK (historical_flood_risk_score BETWEEN 0.0 AND 1.0),
    geom GEOMETRY(LineString, 4326) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_roads_geom ON roads USING GIST (geom);
CREATE INDEX IF NOT EXISTS idx_roads_ward ON roads(ward);

-- 5. ROAD STATUS (Dynamic status updates on roads)
CREATE TABLE IF NOT EXISTS road_status (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    road_id UUID NOT NULL REFERENCES roads(id) ON DELETE CASCADE,
    status road_status_enum NOT NULL DEFAULT 'OPEN',
    severity severity_level_enum NOT NULL DEFAULT 'NONE',
    water_depth_cm NUMERIC(6, 2) DEFAULT 0.0,
    confidence_score NUMERIC(3, 2) DEFAULT 1.0 CHECK (confidence_score BETWEEN 0.0 AND 1.0),
    source data_source_enum NOT NULL DEFAULT 'SIMULATED_DEMO',
    notes TEXT,
    is_current BOOLEAN DEFAULT TRUE,
    effective_from TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    effective_until TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_road_status_current ON road_status(road_id, is_current);

-- 6. INCIDENTS (Central flood incident registry)
CREATE TABLE IF NOT EXISTS incidents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    road_id UUID REFERENCES roads(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    reported_water_depth water_depth_category_enum NOT NULL DEFAULT 'ANKLE_DEEP',
    estimated_depth_cm NUMERIC(6, 2),
    passable_two_wheelers BOOLEAN DEFAULT TRUE,
    passable_four_wheelers BOOLEAN DEFAULT TRUE,
    passable_emergency_vehicles BOOLEAN DEFAULT TRUE,
    verification_status verification_status_enum NOT NULL DEFAULT 'PENDING',
    source data_source_enum NOT NULL DEFAULT 'CITIZEN_REPORT',
    ai_confidence_score NUMERIC(3, 2) CHECK (ai_confidence_score BETWEEN 0.0 AND 1.0),
    ai_tags JSONB DEFAULT '[]'::jsonb,
    image_url TEXT,
    geom GEOMETRY(Point, 4326) NOT NULL,
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    verified_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_incidents_geom ON incidents USING GIST (geom);
CREATE INDEX IF NOT EXISTS idx_incidents_verification ON incidents(verification_status);
CREATE INDEX IF NOT EXISTS idx_incidents_source ON incidents(source);

-- 7. CITIZEN REPORTS (Raw citizen submissions prior to / alongside triage)
CREATE TABLE IF NOT EXISTS citizen_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    incident_id UUID REFERENCES incidents(id) ON DELETE CASCADE,
    reporter_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    reporter_name VARCHAR(128),
    reporter_phone VARCHAR(32),
    latitude NUMERIC(9, 6) NOT NULL,
    longitude NUMERIC(9, 6) NOT NULL,
    water_depth water_depth_category_enum NOT NULL,
    user_comment TEXT,
    has_photo BOOLEAN DEFAULT FALSE,
    photo_storage_path TEXT,
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. WEATHER RECORDS (Open-Meteo & station telemetry cache)
CREATE TABLE IF NOT EXISTS weather_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    station_name VARCHAR(128) NOT NULL,
    latitude NUMERIC(9, 6) NOT NULL,
    longitude NUMERIC(9, 6) NOT NULL,
    source data_source_enum NOT NULL DEFAULT 'WEATHER_STATION',
    is_forecast BOOLEAN DEFAULT FALSE,
    rainfall_1h_mm NUMERIC(6, 2) DEFAULT 0.0,
    rainfall_24h_mm NUMERIC(6, 2) DEFAULT 0.0,
    precipitation_probability NUMERIC(5, 2) DEFAULT 0.0,
    temperature_celsius NUMERIC(5, 2),
    relative_humidity_pct NUMERIC(5, 2),
    wind_speed_kmh NUMERIC(5, 2),
    alert_level VARCHAR(128),
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_weather_recorded_at ON weather_records(recorded_at DESC);

-- 9. RISK ASSESSMENTS (AI & GIS heuristic risk calculations per segment)
CREATE TABLE IF NOT EXISTS risk_assessments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    road_id UUID NOT NULL REFERENCES roads(id) ON DELETE CASCADE,
    calculated_risk_score NUMERIC(3, 2) NOT NULL CHECK (calculated_risk_score BETWEEN 0.0 AND 1.0),
    risk_level severity_level_enum NOT NULL,
    elevation_factor NUMERIC(3, 2),
    rainfall_factor NUMERIC(3, 2),
    river_proximity_factor NUMERIC(3, 2),
    active_incidents_count INT DEFAULT 0,
    explanation_summary TEXT,
    model_version VARCHAR(64) DEFAULT 'heuristics-v1.0',
    assessed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_risk_assessments_road ON risk_assessments(road_id);

-- 10. ROUTE REQUESTS (Alternative flood-aware transit queries)
CREATE TABLE IF NOT EXISTS route_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    origin_name VARCHAR(255) NOT NULL,
    destination_name VARCHAR(255) NOT NULL,
    origin_geom GEOMETRY(Point, 4326) NOT NULL,
    destination_geom GEOMETRY(Point, 4326) NOT NULL,
    vehicle_type VARCHAR(32) DEFAULT 'four_wheeler',
    avoid_blocked_roads BOOLEAN DEFAULT TRUE,
    recommended_route_geojson JSONB,
    risk_summary TEXT,
    safety_disclaimer_accepted BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 11. NOTIFICATIONS
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    notification_type notification_type_enum NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    action_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, is_read);

-- 12. AUDIT LOGS
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entity_name VARCHAR(64) NOT NULL,
    entity_id UUID NOT NULL,
    action VARCHAR(64) NOT NULL,
    performed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    old_data JSONB,
    new_data JSONB,
    reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE roads ENABLE ROW LEVEL SECURITY;
ALTER TABLE road_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE citizen_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE weather_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE risk_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE route_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- 1. Profiles: Public can read basic profile info; users can update own profile.
CREATE POLICY "Public profiles are viewable by authenticated users"
ON profiles FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert own profile"
ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE USING (auth.uid() = id);

-- 2. Roads & Status: Publicly readable by all users (anonymous and authenticated).
CREATE POLICY "Roads are viewable by everyone"
ON roads FOR SELECT USING (true);

CREATE POLICY "Road status is viewable by everyone"
ON road_status FOR SELECT USING (true);

-- Responders and Admins can update road status
CREATE POLICY "Admins and Responders can update road status"
ON road_status FOR ALL USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role IN ('administrator', 'responder')
    )
);

-- 3. Incidents: Everyone can view verified or unverified incidents; citizens can report; admins/responders verify.
CREATE POLICY "Incidents are viewable by everyone"
ON incidents FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create incidents"
ON incidents FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Admins and Responders can manage incidents"
ON incidents FOR UPDATE USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role IN ('administrator', 'responder')
    )
);

-- 4. Citizen Reports: Anyone authenticated can insert
CREATE POLICY "Citizens can insert reports"
ON citizen_reports FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Admins and Responders can view all citizen reports"
ON citizen_reports FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role IN ('administrator', 'responder')
    )
);

-- 5. Weather & Risk: Read-only for everyone
CREATE POLICY "Weather records viewable by everyone"
ON weather_records FOR SELECT USING (true);

CREATE POLICY "Risk assessments viewable by everyone"
ON risk_assessments FOR SELECT USING (true);

-- 6. Notifications: Users can view their own notifications
CREATE POLICY "Users can read own notifications"
ON notifications FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
ON notifications FOR UPDATE USING (auth.uid() = user_id);

