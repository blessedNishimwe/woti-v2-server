-- ============================================================================
-- WOTI Attendance v2 - Admin User Seed Data
-- ============================================================================
-- This seed file creates an initial admin user for system access
-- Default credentials:
--   Email: admin@woti.rw
--   Password: Admin@123 (CHANGE IN PRODUCTION!)
-- 
-- Password hash generated with bcrypt (12 rounds)
-- ============================================================================

-- Insert default admin user
-- Password: Admin@123 (bcrypt hash with 12 rounds)
-- IMPORTANT: Change this password immediately after first login in production!
INSERT INTO users (
    id,
    email,
    password_hash,
    first_name,
    last_name,
    role,
    status,
    employee_id,
    created_at,
    updated_at
) VALUES (
    '550e8400-e29b-41d4-a716-446655440099',
    'admin@woti.rw',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5ck0K2dQqfKbm',
    'System',
    'Administrator',
    'admin',
    'active',
    'ADMIN001',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
)
ON CONFLICT (email) DO NOTHING;

-- Log the admin user creation activity
INSERT INTO activities (
    user_id,
    action,
    entity_type,
    entity_id,
    description,
    metadata,
    created_at
) VALUES (
    '550e8400-e29b-41d4-a716-446655440099',
    'USER_CREATED',
    'user',
    '550e8400-e29b-41d4-a716-446655440099',
    'Initial admin user created during database seeding',
    '{"seeded": true, "role": "admin"}',
    CURRENT_TIMESTAMP
);

-- ============================================================================
-- End of seed data
-- ============================================================================
