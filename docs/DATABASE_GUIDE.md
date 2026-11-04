# NEERPATH Database Setup & Architecture Guide

## Overview
NEERPATH uses PostgreSQL with PostGIS extensions (compatible with Supabase) to manage road corridors, flood incidents, weather telemetry, citizen reporting, and spatial risk assessments for Mangaluru, Karnataka.

## Supported Roles
- `resident`: General citizen who views road statuses, requests routes, and submits incident reports.
- `responder`: Emergency personnel / Traffic police who patrol, update road clearance, and attend to bottlenecks.
- `administrator`: Municipal disaster management officers who verify incidents, push city-wide alerts, and manage system configuration.

## Schema Migrations

Run the SQL files in order against your Supabase or local PostgreSQL database:
1. `database/001_schema.sql` - PostGIS extensions, ENUM types, tables, spatial indexes, and Row Level Security (RLS) policies.
2. `database/002_demo_seed.sql` - Clearly identified Mangaluru demonstration corridors, seed incidents, and user profiles.

## Key Tables
- `profiles`: User accounts linked with Supabase Auth `auth.users(id)` and role-based policies.
- `roads`: Mangaluru road network lines (`GEOMETRY(LineString, 4326)`), elevation, historical risk scores, and OpenStreetMap IDs.
- `road_status`: Dynamic status (`OPEN`, `CAUTION`, `BLOCKED`, `UNVERIFIED`) linked to roads with temporal validities.
- `incidents`: Verified & citizen flood incidents with Point geometry (`GEOMETRY(Point, 4326)`).
- `citizen_reports`: Raw citizen triage reports.
- `weather_records`: Open-Meteo Mangaluru station recordings cache.
- `risk_assessments`: AI/heuristic flood risk scores per road.
- `route_requests`: Flood-avoidant transit queries with safety disclaimers.
- `notifications`: User-specific risk and dispatch alerts.
- `audit_logs`: Traceability logs for every status transition.

