-- ==============================================================================
-- NEERPATH: Mangaluru Initial Demonstration Seed Data
-- Clearly identified as DEMO DATA / SIMULATED MONSOON SCENARIO
-- ==============================================================================

-- 1. Demo Profiles (Resident, Responder, Administrator)
-- IDs use predictable UUIDs for demonstration/testing
INSERT INTO profiles (id, email, full_name, role, phone_number, ward_location) VALUES
('11111111-1111-1111-1111-111111111111', 'admin@neerpath.in', 'Ashwin Nethan (Disaster Control Admin)', 'administrator', '+91 98450 12345', 'Mangaluru Central'),
('22222222-2222-2222-2222-222222222222', 'patrol.kadri@neerpath.in', 'Officer Ramesh Rao (Traffic Patrol)', 'responder', '+91 98450 23456', 'Kadri / Derebail'),
('33333333-3333-3333-3333-333333333333', 'citizen.kavoor@gmail.com', 'Kavitha Shenoy (Resident)', 'resident', '+91 98450 34567', 'Kavoor / Bejai')
ON CONFLICT (id) DO NOTHING;

-- 2. Demo Mangaluru Road Network Corridors
-- OpenStreetMap linestring references
INSERT INTO roads (id, osm_id, name, ward, road_type, elevation_meters, historical_flood_risk_score, geom) VALUES
('a0000000-0000-0000-0000-000000000001', 'way/4581203', 'NH-66 Kottara Chowki Flyover Underpass', 'Kottara / Derebail (Ward 17)', 'trunk', 4.5, 0.95, ST_GeomFromText('LINESTRING(74.8430 12.9035, 74.8445 12.9050, 74.8460 12.9068)', 4326)),
('a0000000-0000-0000-0000-000000000002', 'way/9283719', 'Pumpwell Circle / Mahaveera Circle Junction', 'Kankanady (Ward 48)', 'primary', 6.2, 0.88, ST_GeomFromText('LINESTRING(74.8680 12.8610, 74.8695 12.8625, 74.8710 12.8640)', 4326)),
('a0000000-0000-0000-0000-000000000003', 'way/1102948', 'Baikampady Industrial Estate Cross Road', 'Baikampady (Ward 3)', 'secondary', 3.8, 0.80, ST_GeomFromText('LINESTRING(74.8150 12.9550, 74.8175 12.9570, 74.8200 12.9590)', 4326)),
('a0000000-0000-0000-0000-000000000004', 'way/3391827', 'State Bank Service Bus Stand - Hamilton Circle', 'Port Ward (Ward 40)', 'primary', 3.2, 0.92, ST_GeomFromText('LINESTRING(74.8390 12.8620, 74.8410 12.8635, 74.8430 12.8650)', 4326)),
('a0000000-0000-0000-0000-000000000005', 'way/7728192', 'Kadri Hills Road / Circuit House Stretch', 'Kadri (Ward 33)', 'secondary', 34.0, 0.10, ST_GeomFromText('LINESTRING(74.8610 12.8850, 74.8630 12.8870, 74.8650 12.8890)', 4326)),
('a0000000-0000-0000-0000-000000000006', 'way/6652418', 'Car Street & Venkataramana Temple Square', 'Bunder (Ward 41)', 'tertiary', 5.0, 0.85, ST_GeomFromText('LINESTRING(74.8440 12.8710, 74.8455 12.8725, 74.8470 12.8740)', 4326)),
('a0000000-0000-0000-0000-000000000007', 'way/8817263', 'KSRTC Bus Stand - Bejai Main Road', 'Bejai (Ward 31)', 'primary', 18.0, 0.25, ST_GeomFromText('LINESTRING(74.8510 12.8890, 74.8530 12.8910, 74.8550 12.8930)', 4326))
ON CONFLICT (id) DO NOTHING;

-- 3. Demo Road Current Statuses
INSERT INTO road_status (road_id, status, severity, water_depth_cm, confidence_score, source, notes, is_current) VALUES
('a0000000-0000-0000-0000-000000000001', 'BLOCKED', 'CRITICAL', 65.0, 0.98, 'ADMIN_VERIFIED', '[DEMO DATA] Storm drain overflow at Kottara underpass. Divert via Kuntikan bypass.', TRUE),
('a0000000-0000-0000-0000-000000000002', 'CAUTION', 'HIGH', 25.0, 0.92, 'ADMIN_VERIFIED', '[DEMO DATA] Water logging at Pumpwell junction lane 1. 2-wheelers advise extreme caution.', TRUE),
('a0000000-0000-0000-0000-000000000003', 'CAUTION', 'MEDIUM', 20.0, 0.85, 'AI_ESTIMATE', '[DEMO DATA] Low elevation industrial zone drainage backlog.', TRUE),
('a0000000-0000-0000-0000-000000000004', 'UNVERIFIED', 'HIGH', 35.0, 0.65, 'CITIZEN_REPORT', '[DEMO DATA] Citizen reported high standing water near State Bank exit.', TRUE),
('a0000000-0000-0000-0000-000000000005', 'OPEN', 'NONE', 0.0, 1.0, 'WEATHER_STATION', '[DEMO DATA] Elevated ridge road, free flowing with zero water retention.', TRUE),
('a0000000-0000-0000-0000-000000000006', 'CAUTION', 'MEDIUM', 18.0, 0.89, 'ADMIN_VERIFIED', '[DEMO DATA] Temple square water runoff towards low-lying market.', TRUE),
('a0000000-0000-0000-0000-000000000007', 'OPEN', 'NONE', 2.0, 0.95, 'ADMIN_VERIFIED', '[DEMO DATA] Good drainage capacity, fully passable for all vehicles.', TRUE);

-- 4. Demo Incidents
INSERT INTO incidents (id, road_id, title, description, reported_water_depth, estimated_depth_cm, passable_two_wheelers, passable_four_wheelers, passable_emergency_vehicles, verification_status, source, ai_confidence_score, ai_tags, geom) VALUES
('b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'Kottara Underpass Inundation', '[DEMO DATA] Severe stormwater accumulation under NH-66 bridge. Multiple small vehicles stranded.', 'WAIST_DEEP', 65.0, FALSE, FALSE, FALSE, 'VERIFIED', 'ADMIN_VERIFIED', 0.98, '["Severe Inundation", "Underpass", "Demo Data"]'::jsonb, ST_GeomFromText('POINT(74.8445 12.9050)', 4326)),
('b0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000004', 'State Bank Bus Exit Waterlogging', '[DEMO DATA] Standing water reported along bus lane. Commuters wading through ankle-to-knee water.', 'KNEE_DEEP', 35.0, FALSE, TRUE, TRUE, 'PENDING', 'CITIZEN_REPORT', 0.68, '["Citizen Report", "Unverified", "Demo Data"]'::jsonb, ST_GeomFromText('POINT(74.8410 12.8635)', 4326)),
('b0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000002', 'Pumpwell Underpass Flash Flow', '[DEMO DATA] Flash runoff during heavy downpour. Traffic slow moving with caution signs placed.', 'ANKLE_DEEP', 25.0, TRUE, TRUE, TRUE, 'VERIFIED', 'ADMIN_VERIFIED', 0.91, '["Flash Runoff", "Police Monitored", "Demo Data"]'::jsonb, ST_GeomFromText('POINT(74.8695 12.8625)', 4326));

