-- ============================================================================
-- WOTI Attendance v2 - Regions and Councils Seed Data
-- ============================================================================
-- This seed file populates the regions and councils tables with
-- Rwanda's administrative divisions
-- ============================================================================

-- Insert Regions (Rwanda has 5 regions)
INSERT INTO regions (id, name, code, description) VALUES
    ('550e8400-e29b-41d4-a716-446655440001', 'City of Kigali', 'KGL', 'Capital city and administrative region'),
    ('550e8400-e29b-41d4-a716-446655440002', 'Eastern Province', 'EST', 'Eastern Province of Rwanda'),
    ('550e8400-e29b-41d4-a716-446655440003', 'Northern Province', 'NTH', 'Northern Province of Rwanda'),
    ('550e8400-e29b-41d4-a716-446655440004', 'Southern Province', 'STH', 'Southern Province of Rwanda'),
    ('550e8400-e29b-41d4-a716-446655440005', 'Western Province', 'WST', 'Western Province of Rwanda')
ON CONFLICT (name) DO NOTHING;

-- Insert Councils/Districts for City of Kigali
INSERT INTO councils (region_id, name, code, description) VALUES
    ('550e8400-e29b-41d4-a716-446655440001', 'Gasabo', 'KGL-GAS', 'Gasabo District'),
    ('550e8400-e29b-41d4-a716-446655440001', 'Kicukiro', 'KGL-KIC', 'Kicukiro District'),
    ('550e8400-e29b-41d4-a716-446655440001', 'Nyarugenge', 'KGL-NYA', 'Nyarugenge District')
ON CONFLICT (region_id, name) DO NOTHING;

-- Insert Councils/Districts for Eastern Province
INSERT INTO councils (region_id, name, code, description) VALUES
    ('550e8400-e29b-41d4-a716-446655440002', 'Bugesera', 'EST-BUG', 'Bugesera District'),
    ('550e8400-e29b-41d4-a716-446655440002', 'Gatsibo', 'EST-GAT', 'Gatsibo District'),
    ('550e8400-e29b-41d4-a716-446655440002', 'Kayonza', 'EST-KAY', 'Kayonza District'),
    ('550e8400-e29b-41d4-a716-446655440002', 'Kirehe', 'EST-KIR', 'Kirehe District'),
    ('550e8400-e29b-41d4-a716-446655440002', 'Ngoma', 'EST-NGO', 'Ngoma District'),
    ('550e8400-e29b-41d4-a716-446655440002', 'Nyagatare', 'EST-NYA', 'Nyagatare District'),
    ('550e8400-e29b-41d4-a716-446655440002', 'Rwamagana', 'EST-RWA', 'Rwamagana District')
ON CONFLICT (region_id, name) DO NOTHING;

-- Insert Councils/Districts for Northern Province
INSERT INTO councils (region_id, name, code, description) VALUES
    ('550e8400-e29b-41d4-a716-446655440003', 'Burera', 'NTH-BUR', 'Burera District'),
    ('550e8400-e29b-41d4-a716-446655440003', 'Gakenke', 'NTH-GAK', 'Gakenke District'),
    ('550e8400-e29b-41d4-a716-446655440003', 'Gicumbi', 'NTH-GIC', 'Gicumbi District'),
    ('550e8400-e29b-41d4-a716-446655440003', 'Musanze', 'NTH-MUS', 'Musanze District'),
    ('550e8400-e29b-41d4-a716-446655440003', 'Rulindo', 'NTH-RUL', 'Rulindo District')
ON CONFLICT (region_id, name) DO NOTHING;

-- Insert Councils/Districts for Southern Province
INSERT INTO councils (region_id, name, code, description) VALUES
    ('550e8400-e29b-41d4-a716-446655440004', 'Gisagara', 'STH-GIS', 'Gisagara District'),
    ('550e8400-e29b-41d4-a716-446655440004', 'Huye', 'STH-HUY', 'Huye District'),
    ('550e8400-e29b-41d4-a716-446655440004', 'Kamonyi', 'STH-KAM', 'Kamonyi District'),
    ('550e8400-e29b-41d4-a716-446655440004', 'Muhanga', 'STH-MUH', 'Muhanga District'),
    ('550e8400-e29b-41d4-a716-446655440004', 'Nyamagabe', 'STH-NYM', 'Nyamagabe District'),
    ('550e8400-e29b-41d4-a716-446655440004', 'Nyanza', 'STH-NYZ', 'Nyanza District'),
    ('550e8400-e29b-41d4-a716-446655440004', 'Nyaruguru', 'STH-NYR', 'Nyaruguru District'),
    ('550e8400-e29b-41d4-a716-446655440004', 'Ruhango', 'STH-RUH', 'Ruhango District')
ON CONFLICT (region_id, name) DO NOTHING;

-- Insert Councils/Districts for Western Province
INSERT INTO councils (region_id, name, code, description) VALUES
    ('550e8400-e29b-41d4-a716-446655440005', 'Karongi', 'WST-KAR', 'Karongi District'),
    ('550e8400-e29b-41d4-a716-446655440005', 'Ngororero', 'WST-NGO', 'Ngororero District'),
    ('550e8400-e29b-41d4-a716-446655440005', 'Nyabihu', 'WST-NYB', 'Nyabihu District'),
    ('550e8400-e29b-41d4-a716-446655440005', 'Nyamasheke', 'WST-NYM', 'Nyamasheke District'),
    ('550e8400-e29b-41d4-a716-446655440005', 'Rubavu', 'WST-RUB', 'Rubavu District'),
    ('550e8400-e29b-41d4-a716-446655440005', 'Rusizi', 'WST-RUS', 'Rusizi District'),
    ('550e8400-e29b-41d4-a716-446655440005', 'Rutsiro', 'WST-RUT', 'Rutsiro District')
ON CONFLICT (region_id, name) DO NOTHING;

-- ============================================================================
-- End of seed data
-- ============================================================================
