-- ============================================================================
-- WOTI Attendance v2 - Database Indexes
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
