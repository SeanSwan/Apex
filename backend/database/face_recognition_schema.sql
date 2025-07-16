-- ========================================
-- APEX AI FACE RECOGNITION DATABASE SCHEMA
-- ========================================
-- Production-ready schema for face recognition system
-- Supports enrollment, detection tracking, and analytics

-- Enable UUID extension for PostgreSQL
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Face Profiles Table
-- Stores enrolled face data and metadata
CREATE TABLE face_profiles (
    face_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    
    -- Face encoding vector (stored as binary or text)
    encoding_vector TEXT NOT NULL, -- Base64 encoded face embeddings
    encoding_method VARCHAR(50) DEFAULT 'face_recognition_128d', -- Algorithm used
    
    -- Image storage
    image_path VARCHAR(500), -- Path to original enrollment image
    image_filename VARCHAR(255), -- Original filename
    image_size INTEGER, -- File size in bytes
    
    -- Status and metadata
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'archived')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by VARCHAR(255), -- User who enrolled this face
    
    -- Additional metadata
    notes TEXT, -- Optional notes about the person
    department VARCHAR(100), -- For employee categorization
    access_level VARCHAR(50), -- Security clearance level
    tags TEXT[], -- Array of tags for categorization
    
    -- Constraints
    CONSTRAINT face_profiles_name_check CHECK (LENGTH(TRIM(name)) > 0),
    CONSTRAINT face_profiles_encoding_check CHECK (LENGTH(encoding_vector) > 0)
);

-- Face Detections Table  
-- Logs all face detection events from cameras
CREATE TABLE face_detections (
    detection_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    face_id UUID REFERENCES face_profiles(face_id) ON DELETE SET NULL,
    
    -- Detection source
    camera_id VARCHAR(100) NOT NULL, -- Links to camera system
    camera_name VARCHAR(255), -- Human-readable camera name
    
    -- Detection results
    confidence DECIMAL(5,4) NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
    is_match BOOLEAN NOT NULL DEFAULT FALSE, -- True if matched to known face
    
    -- Bounding box coordinates (normalized 0-1)
    bbox_x DECIMAL(6,4) CHECK (bbox_x >= 0 AND bbox_x <= 1),
    bbox_y DECIMAL(6,4) CHECK (bbox_y >= 0 AND bbox_y <= 1), 
    bbox_width DECIMAL(6,4) CHECK (bbox_width >= 0 AND bbox_width <= 1),
    bbox_height DECIMAL(6,4) CHECK (bbox_height >= 0 AND bbox_height <= 1),
    
    -- Timestamp and metadata
    detected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    image_snapshot_path VARCHAR(500), -- Path to detection snapshot
    
    -- AI processing metadata
    processing_time_ms INTEGER, -- How long detection took
    model_version VARCHAR(50), -- AI model version used
    additional_metadata JSONB, -- Flexible storage for extra data
    
    -- Alert generation
    alert_generated BOOLEAN DEFAULT FALSE,
    alert_id UUID, -- Links to alert system if alert was created
    
    -- Performance indexes will be added below
    CONSTRAINT face_detections_confidence_check CHECK (confidence >= 0.0 AND confidence <= 1.0)
);

-- Face Recognition Analytics Table
-- Aggregated statistics for reporting and optimization
CREATE TABLE face_recognition_analytics (
    analytics_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date_recorded DATE NOT NULL DEFAULT CURRENT_DATE,
    
    -- Daily aggregation stats
    total_detections INTEGER DEFAULT 0,
    known_face_detections INTEGER DEFAULT 0,
    unknown_face_detections INTEGER DEFAULT 0,
    unique_faces_detected INTEGER DEFAULT 0,
    
    -- Performance metrics
    avg_confidence DECIMAL(5,4),
    avg_processing_time_ms DECIMAL(8,2),
    
    -- System health
    failed_detections INTEGER DEFAULT 0,
    system_uptime_minutes INTEGER DEFAULT 0,
    
    -- Camera coverage
    active_cameras INTEGER DEFAULT 0,
    cameras_with_detections INTEGER DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure one record per date
    CONSTRAINT face_analytics_unique_date UNIQUE (date_recorded)
);

-- ========================================
-- INDEXES FOR PERFORMANCE
-- ========================================

-- Face Profiles indexes
CREATE INDEX idx_face_profiles_status ON face_profiles(status);
CREATE INDEX idx_face_profiles_created_at ON face_profiles(created_at);
CREATE INDEX idx_face_profiles_name ON face_profiles(name);
CREATE INDEX idx_face_profiles_department ON face_profiles(department);

-- Face Detections indexes (critical for real-time queries)
CREATE INDEX idx_face_detections_face_id ON face_detections(face_id);
CREATE INDEX idx_face_detections_camera_id ON face_detections(camera_id);
CREATE INDEX idx_face_detections_detected_at ON face_detections(detected_at);
CREATE INDEX idx_face_detections_is_match ON face_detections(is_match);
CREATE INDEX idx_face_detections_confidence ON face_detections(confidence);

-- Composite indexes for common query patterns
CREATE INDEX idx_face_detections_camera_time ON face_detections(camera_id, detected_at);
CREATE INDEX idx_face_detections_face_time ON face_detections(face_id, detected_at);
CREATE INDEX idx_face_detections_match_time ON face_detections(is_match, detected_at);

-- Analytics indexes
CREATE INDEX idx_face_analytics_date ON face_recognition_analytics(date_recorded);

-- ========================================
-- TRIGGERS FOR AUTOMATIC UPDATES
-- ========================================

-- Update timestamp trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to face_profiles
CREATE TRIGGER update_face_profiles_updated_at 
    BEFORE UPDATE ON face_profiles 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- VIEWS FOR COMMON QUERIES
-- ========================================

-- Active face profiles with recent detection stats
CREATE VIEW face_profiles_with_stats AS
SELECT 
    fp.face_id,
    fp.name,
    fp.status,
    fp.department,
    fp.created_at,
    COALESCE(recent_stats.detection_count, 0) as recent_detections,
    recent_stats.last_detected,
    COALESCE(recent_stats.avg_confidence, 0) as avg_confidence
FROM face_profiles fp
LEFT JOIN (
    SELECT 
        face_id,
        COUNT(*) as detection_count,
        MAX(detected_at) as last_detected,
        AVG(confidence) as avg_confidence
    FROM face_detections 
    WHERE detected_at >= NOW() - INTERVAL '30 days'
    GROUP BY face_id
) recent_stats ON fp.face_id = recent_stats.face_id
WHERE fp.status = 'active';

-- Daily detection summary
CREATE VIEW daily_detection_summary AS
SELECT 
    DATE(detected_at) as detection_date,
    COUNT(*) as total_detections,
    COUNT(CASE WHEN is_match = true THEN 1 END) as known_detections,
    COUNT(CASE WHEN is_match = false THEN 1 END) as unknown_detections,
    COUNT(DISTINCT face_id) FILTER (WHERE face_id IS NOT NULL) as unique_known_faces,
    COUNT(DISTINCT camera_id) as active_cameras,
    AVG(confidence) as avg_confidence,
    AVG(processing_time_ms) as avg_processing_time
FROM face_detections
GROUP BY DATE(detected_at)
ORDER BY detection_date DESC;

-- ========================================
-- SAMPLE DATA SETUP (FOR TESTING)
-- ========================================

-- Insert sample face profile for testing
INSERT INTO face_profiles (name, encoding_vector, status, department, notes, created_by)
VALUES 
    ('Test User', 'sample_encoding_vector_base64', 'active', 'Security', 'Test profile for system validation', 'system'),
    ('John Doe', 'another_sample_encoding_vector', 'active', 'Administration', 'Sample employee profile', 'admin');

-- Insert sample detection for testing
INSERT INTO face_detections (face_id, camera_id, camera_name, confidence, is_match, bbox_x, bbox_y, bbox_width, bbox_height)
SELECT 
    face_id, 
    'CAM_001', 
    'Main Entrance Camera',
    0.8500,
    true,
    0.25,
    0.15,
    0.30,
    0.40
FROM face_profiles 
WHERE name = 'Test User'
LIMIT 1;

-- ========================================
-- SECURITY & PERMISSIONS
-- ========================================

-- Create dedicated role for face recognition system
-- (This should be run by database administrator)
-- CREATE ROLE apex_face_recognition_user WITH LOGIN PASSWORD 'secure_password_here';
-- GRANT SELECT, INSERT, UPDATE, DELETE ON face_profiles TO apex_face_recognition_user;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON face_detections TO apex_face_recognition_user;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON face_recognition_analytics TO apex_face_recognition_user;
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO apex_face_recognition_user;

-- ========================================
-- MAINTENANCE FUNCTIONS
-- ========================================

-- Function to cleanup old detection records (keep last 90 days)
CREATE OR REPLACE FUNCTION cleanup_old_detections()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM face_detections 
    WHERE detected_at < NOW() - INTERVAL '90 days';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    -- Log cleanup action
    INSERT INTO face_recognition_analytics (date_recorded, total_detections)
    VALUES (CURRENT_DATE, -deleted_count)
    ON CONFLICT (date_recorded) DO NOTHING;
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Function to update daily analytics
CREATE OR REPLACE FUNCTION update_daily_analytics()
RETURNS VOID AS $$
BEGIN
    INSERT INTO face_recognition_analytics (
        date_recorded,
        total_detections,
        known_face_detections,
        unknown_face_detections,
        unique_faces_detected,
        avg_confidence,
        avg_processing_time_ms,
        active_cameras,
        cameras_with_detections
    )
    SELECT 
        CURRENT_DATE,
        COUNT(*),
        COUNT(CASE WHEN is_match = true THEN 1 END),
        COUNT(CASE WHEN is_match = false THEN 1 END),
        COUNT(DISTINCT face_id) FILTER (WHERE face_id IS NOT NULL),
        AVG(confidence),
        AVG(processing_time_ms),
        COUNT(DISTINCT camera_id),
        COUNT(DISTINCT camera_id) FILTER (WHERE detected_at >= CURRENT_DATE)
    FROM face_detections
    WHERE detected_at >= CURRENT_DATE
    ON CONFLICT (date_recorded) DO UPDATE SET
        total_detections = EXCLUDED.total_detections,
        known_face_detections = EXCLUDED.known_face_detections,
        unknown_face_detections = EXCLUDED.unknown_face_detections,
        unique_faces_detected = EXCLUDED.unique_faces_detected,
        avg_confidence = EXCLUDED.avg_confidence,
        avg_processing_time_ms = EXCLUDED.avg_processing_time_ms,
        active_cameras = EXCLUDED.active_cameras,
        cameras_with_detections = EXCLUDED.cameras_with_detections;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- SCHEMA COMPLETE
-- ========================================

-- Generate completion report
SELECT 
    'APEX AI Face Recognition Schema' as system_name,
    'Successfully installed' as status,
    NOW() as installation_time,
    (SELECT COUNT(*) FROM face_profiles) as initial_profiles,
    (SELECT COUNT(*) FROM face_detections) as initial_detections;
