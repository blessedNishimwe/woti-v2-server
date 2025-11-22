-- ============================================================================
-- WOTI Attendance v2 - Initial Database Schema
-- ============================================================================
-- This migration creates the complete database schema for the WOTI Attendance
-- system including all tables, indexes, constraints, and triggers.
--
-- Tables created:
--   1. regions - Geographic top level
--   2. councils - Mid-level geographic hierarchy
--   3. facilities - Health facilities with geolocation
--   4. users - Staff with roles and hierarchy
--   5. attendance - Clock in/out records with offline sync metadata
--   6. activities - Audit logs and system activities
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- TABLE: regions
-- Description: Top-level geographic divisions (e.g., provinces/regions)
-- ============================================================================
CREATE TABLE regions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL UNIQUE,
    code VARCHAR(50) UNIQUE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE regions IS 'Top-level geographic divisions';
COMMENT ON COLUMN regions.id IS 'Unique identifier for the region';
COMMENT ON COLUMN regions.name IS 'Name of the region';
COMMENT ON COLUMN regions.code IS 'Short code for the region';

-- ============================================================================
-- TABLE: councils
-- Description: Mid-level geographic divisions within regions
-- ============================================================================
CREATE TABLE councils (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    region_id UUID NOT NULL REFERENCES regions(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50),
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(region_id, name)
);

COMMENT ON TABLE councils IS 'Mid-level geographic divisions within regions';
COMMENT ON COLUMN councils.id IS 'Unique identifier for the council';
COMMENT ON COLUMN councils.region_id IS 'Reference to parent region';
COMMENT ON COLUMN councils.name IS 'Name of the council';

-- ============================================================================
-- TABLE: facilities
-- Description: Health facilities with geolocation data
-- ============================================================================
CREATE TABLE facilities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    council_id UUID NOT NULL REFERENCES councils(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) UNIQUE,
    type VARCHAR(100),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    address TEXT,
    contact_phone VARCHAR(50),
    contact_email VARCHAR(255),
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'maintenance')),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT valid_coordinates CHECK (
        (latitude IS NULL AND longitude IS NULL) OR
        (latitude IS NOT NULL AND longitude IS NOT NULL AND
         latitude BETWEEN -90 AND 90 AND
         longitude BETWEEN -180 AND 180)
    )
);

COMMENT ON TABLE facilities IS 'Health facilities with geolocation data';
COMMENT ON COLUMN facilities.id IS 'Unique identifier for the facility';
COMMENT ON COLUMN facilities.council_id IS 'Reference to parent council';
COMMENT ON COLUMN facilities.latitude IS 'Latitude coordinate (-90 to 90)';
COMMENT ON COLUMN facilities.longitude IS 'Longitude coordinate (-180 to 180)';
COMMENT ON COLUMN facilities.status IS 'Operational status of the facility';
COMMENT ON COLUMN facilities.metadata IS 'Additional facility metadata in JSON format';

-- ============================================================================
-- TABLE: users
-- Description: System users with roles and hierarchical relationships
-- ============================================================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    facility_id UUID REFERENCES facilities(id) ON DELETE SET NULL,
    supervisor_id UUID REFERENCES users(id) ON DELETE SET NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(50),
    role VARCHAR(50) NOT NULL CHECK (role IN (
        'tester', 'data_clerk', 'focal', 'ddo', 'supervisor', 'backstopper', 'admin'
    )),
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    employee_id VARCHAR(100) UNIQUE,
    date_of_birth DATE,
    hire_date DATE,
    avatar_url TEXT,
    preferences JSONB DEFAULT '{}',
    last_login_at TIMESTAMP WITH TIME ZONE,
    password_changed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE users IS 'System users with roles and hierarchical relationships';
COMMENT ON COLUMN users.id IS 'Unique identifier for the user';
COMMENT ON COLUMN users.facility_id IS 'Assigned facility for the user';
COMMENT ON COLUMN users.supervisor_id IS 'Reference to supervisor (self-referencing)';
COMMENT ON COLUMN users.password_hash IS 'bcrypt hashed password (12 rounds)';
COMMENT ON COLUMN users.role IS 'User role for access control';
COMMENT ON COLUMN users.status IS 'Account status';
COMMENT ON COLUMN users.preferences IS 'User preferences in JSON format';

-- ============================================================================
-- TABLE: attendance
-- Description: Clock in/out records with offline sync support
-- ============================================================================
CREATE TABLE attendance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    facility_id UUID NOT NULL REFERENCES facilities(id) ON DELETE CASCADE,
    clock_in TIMESTAMP WITH TIME ZONE NOT NULL,
    clock_out TIMESTAMP WITH TIME ZONE,
    clock_in_latitude DECIMAL(10, 8),
    clock_in_longitude DECIMAL(11, 8),
    clock_out_latitude DECIMAL(10, 8),
    clock_out_longitude DECIMAL(11, 8),
    notes TEXT,
    status VARCHAR(50) DEFAULT 'clocked_in' CHECK (status IN ('clocked_in', 'clocked_out', 'incomplete')),
    
    -- Offline sync metadata
    synced BOOLEAN DEFAULT false,
    client_timestamp TIMESTAMP WITH TIME ZONE,
    server_timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    device_id VARCHAR(255),
    sync_version INTEGER DEFAULT 1,
    conflict_resolution_strategy VARCHAR(50) DEFAULT 'server_wins' CHECK (
        conflict_resolution_strategy IN ('client_wins', 'server_wins', 'manual')
    ),
    metadata JSONB DEFAULT '{}',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT valid_clock_times CHECK (clock_out IS NULL OR clock_out > clock_in),
    CONSTRAINT valid_clock_in_coords CHECK (
        (clock_in_latitude IS NULL AND clock_in_longitude IS NULL) OR
        (clock_in_latitude IS NOT NULL AND clock_in_longitude IS NOT NULL AND
         clock_in_latitude BETWEEN -90 AND 90 AND
         clock_in_longitude BETWEEN -180 AND 180)
    ),
    CONSTRAINT valid_clock_out_coords CHECK (
        (clock_out_latitude IS NULL AND clock_out_longitude IS NULL) OR
        (clock_out_latitude IS NOT NULL AND clock_out_longitude IS NOT NULL AND
         clock_out_latitude BETWEEN -90 AND 90 AND
         clock_out_longitude BETWEEN -180 AND 180)
    )
);

COMMENT ON TABLE attendance IS 'Clock in/out records with offline sync support';
COMMENT ON COLUMN attendance.id IS 'Unique identifier for the attendance record';
COMMENT ON COLUMN attendance.user_id IS 'Reference to user who clocked in/out';
COMMENT ON COLUMN attendance.facility_id IS 'Reference to facility where attendance occurred';
COMMENT ON COLUMN attendance.synced IS 'Whether record has been synced to server';
COMMENT ON COLUMN attendance.client_timestamp IS 'When record was created on mobile device';
COMMENT ON COLUMN attendance.server_timestamp IS 'When record was received by server';
COMMENT ON COLUMN attendance.device_id IS 'Unique identifier for mobile device';
COMMENT ON COLUMN attendance.sync_version IS 'Version number for conflict resolution';
COMMENT ON COLUMN attendance.conflict_resolution_strategy IS 'How to resolve sync conflicts';

-- ============================================================================
-- TABLE: activities
-- Description: Audit logs and system activities
-- ============================================================================
CREATE TABLE activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100),
    entity_id UUID,
    description TEXT,
    ip_address INET,
    user_agent TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE activities IS 'Audit logs and system activities';
COMMENT ON COLUMN activities.id IS 'Unique identifier for the activity';
COMMENT ON COLUMN activities.user_id IS 'User who performed the action';
COMMENT ON COLUMN activities.action IS 'Type of action performed';
COMMENT ON COLUMN activities.entity_type IS 'Type of entity affected';
COMMENT ON COLUMN activities.entity_id IS 'ID of entity affected';
COMMENT ON COLUMN activities.metadata IS 'Additional activity metadata';

-- ============================================================================
-- INDEXES for Performance Optimization
-- ============================================================================

-- Regions indexes
CREATE INDEX idx_regions_code ON regions(code);
CREATE INDEX idx_regions_name ON regions(name);

-- Councils indexes
CREATE INDEX idx_councils_region_id ON councils(region_id);
CREATE INDEX idx_councils_code ON councils(code);
CREATE INDEX idx_councils_name ON councils(name);

-- Facilities indexes
CREATE INDEX idx_facilities_council_id ON facilities(council_id);
CREATE INDEX idx_facilities_code ON facilities(code);
CREATE INDEX idx_facilities_status ON facilities(status);
CREATE INDEX idx_facilities_coordinates ON facilities(latitude, longitude);
CREATE INDEX idx_facilities_name ON facilities(name);

-- Users indexes
CREATE INDEX idx_users_facility_id ON users(facility_id);
CREATE INDEX idx_users_supervisor_id ON users(supervisor_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_users_employee_id ON users(employee_id);

-- Attendance indexes
CREATE INDEX idx_attendance_user_id ON attendance(user_id);
CREATE INDEX idx_attendance_facility_id ON attendance(facility_id);
CREATE INDEX idx_attendance_clock_in ON attendance(clock_in);
CREATE INDEX idx_attendance_clock_out ON attendance(clock_out);
CREATE INDEX idx_attendance_status ON attendance(status);
CREATE INDEX idx_attendance_synced ON attendance(synced);
CREATE INDEX idx_attendance_device_id ON attendance(device_id);
CREATE INDEX idx_attendance_user_date ON attendance(user_id, clock_in);
CREATE INDEX idx_attendance_facility_date ON attendance(facility_id, clock_in);

-- Activities indexes
CREATE INDEX idx_activities_user_id ON activities(user_id);
CREATE INDEX idx_activities_action ON activities(action);
CREATE INDEX idx_activities_entity_type ON activities(entity_type);
CREATE INDEX idx_activities_entity_id ON activities(entity_id);
CREATE INDEX idx_activities_created_at ON activities(created_at);

-- ============================================================================
-- TRIGGERS for auto-updating timestamps
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to all tables with updated_at column
CREATE TRIGGER update_regions_updated_at
    BEFORE UPDATE ON regions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_councils_updated_at
    BEFORE UPDATE ON councils
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_facilities_updated_at
    BEFORE UPDATE ON facilities
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_attendance_updated_at
    BEFORE UPDATE ON attendance
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- End of migration
-- ============================================================================
