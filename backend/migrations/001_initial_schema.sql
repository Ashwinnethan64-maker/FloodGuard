-- NEERPATH: Mangaluru Road Flood Intelligence Schema
-- Database setup for PostgreSQL with PostGIS extension (Supabase compatible)

-- 1. Enable PostGIS
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Enumerations for strict data classification
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
    'ANKLE_DEEP',       -- ~5-15 cm (Passable for heavy/cars, caution for 2-wheelers)
    'KNEE_DEEP',        -- ~15-40 cm (Impassable for small cars and 2-wheelers)
    'WAIST_DEEP',       -- ~40-90 cm (Blocked for all non-specialized vehicles)
    'SUBMERGED'         -- >90 cm (Severe drowning hazard/structural hazard)
);

-- 3. Mangaluru Road Segments Table
CREATE TABLE IF NOT EXISTS road_segments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    osm_id VARCHAR(64),
    name VARCHAR(255) NOT NULL,
    ward VARCHAR(128) NOT NULL,
    elevation_meters NUMERIC(6, 2) DEFAULT 10.0,
    historical_flood_risk_score NUMERIC(3, 2) DEFAULT 0.0 CHECK (historical_flood_risk_score BETWEEN 0.0 AND 1.0),
    current_status road_status_enum DEFAULT 'OPEN',
    current_severity severity_level_enum DEFAULT 'NONE',
    current_water_depth_cm NUMERIC(6, 2) DEFAULT 0.0,
    confidence_score NUMERIC(3, 2) DEFAULT 1.0 CHECK (confidence_score BETWEEN 0.0 AND 1.0),
    last_source data_source_enum DEFAULT 'AI_ESTIMATE',
    geom GEOMETRY(LineString, 4326) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_road_segments_geom ON road_segments USING GIST (geom);
CREATE INDEX IF NOT EXISTS idx_road_segments_status ON road_segments(current_status);
CREATE INDEX IF NOT EXISTS idx_road_segments_ward ON road_segments(ward);

-- 4. Flood Incidents Table (Citizen + Station + Patrol)
CREATE TABLE IF NOT EXISTS flood_incidents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    road_segment_id UUID REFERENCES road_segments(id) ON DELETE SET NULL,
    location_name VARCHAR(255) NOT NULL,
    description TEXT,
    reported_water_depth water_depth_category_enum DEFAULT 'ANKLE_DEEP',
    estimated_depth_cm NUMERIC(6, 2),
    passable_two_wheelers BOOLEAN DEFAULT TRUE,
    passable_four_wheelers BOOLEAN DEFAULT TRUE,
    passable_emergency_vehicles BOOLEAN DEFAULT TRUE,
    source data_source_enum NOT NULL DEFAULT 'CITIZEN_REPORT',
    verification_status VARCHAR(32) DEFAULT 'PENDING' CHECK (verification_status IN ('PENDING', 'VERIFIED', 'REJECTED', 'RESOLVED')),
    verified_by_user_id UUID,
    verified_at TIMESTAMPTZ,
    ai_confidence_score NUMERIC(3, 2) CHECK (ai_confidence_score BETWEEN 0.0 AND 1.0),
    ai_tags JSONB DEFAULT '[]'::jsonb,
    image_url TEXT,
    geom GEOMETRY(Point, 4326) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_flood_incidents_geom ON flood_incidents USING GIST (geom);
CREATE INDEX IF NOT EXISTS idx_flood_incidents_source ON flood_incidents(source);
CREATE INDEX IF NOT EXISTS idx_flood_incidents_status ON flood_incidents(verification_status);

-- 5. Weather Readings Cache Table (Mangaluru localized stations & Open-Meteo)
CREATE TABLE IF NOT EXISTS weather_readings (
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
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_weather_timestamp ON weather_readings(timestamp DESC);

-- 6. Audit & Status Transition Logs
CREATE TABLE IF NOT EXISTS road_status_audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    road_segment_id UUID REFERENCES road_segments(id) ON DELETE CASCADE,
    previous_status road_status_enum,
    new_status road_status_enum NOT NULL,
    trigger_source data_source_enum NOT NULL,
    reason TEXT NOT NULL,
    actor_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

