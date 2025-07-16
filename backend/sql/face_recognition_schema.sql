-- APEX AI FACE RECOGNITION SYSTEM - DATABASE SCHEMA
-- ==================================================
-- Phase 2 Implementation: Face Recognition & Identity Management
-- Run this after APEX_AI_DATABASE_SETUP.sql
-- ==================================================

-- ========================================
-- FACE RECOGNITION TABLES
-- ========================================

-- Face profiles for known individuals
CREATE TABLE IF NOT EXISTS face_profiles (
  face_id SERIAL PRIMARY KEY,
  person_name VARCHAR(255) NOT NULL,
  person_type VARCHAR(50) NOT NULL DEFAULT 'unknown' 
    CHECK (person_type IN ('resident', 'staff', 'visitor', 'contractor', 'delivery', 'unknown', 'blacklist', 'vip')),
  face_encoding BYTEA NOT NULL, -- Stored 128-dimensional face encoding
  confidence_threshold DECIMAL(3,2) DEFAULT 0.70 CHECK (confidence_threshold BETWEEN 0.1 AND 1.0),
  
  -- Property and access management
  property_id INTEGER REFERENCES "Properties"(id) ON DELETE CASCADE,
  access_level VARCHAR(50) DEFAULT 'basic' 
    CHECK (access_level IN ('basic', 'elevated', 'restricted', 'emergency_only')),
  
  -- Identity information
  employee_id VARCHAR(100),
  unit_number VARCHAR(50),
  contact_phone VARCHAR(20),
  emergency_contact JSONB DEFAULT '{}',
  
  -- Face image management
  face_image_path VARCHAR(500), -- Path to stored face image
  face_image_hash VARCHAR(128), -- Hash for duplicate detection
  encoding_version VARCHAR(20) DEFAULT 'v1.0', -- Track encoding algorithm version
  
  -- Tracking and audit
  added_by INTEGER REFERENCES "Users"(id) ON DELETE SET NULL,
  last_seen TIMESTAMP WITH TIME ZONE,
  total_detections INTEGER DEFAULT 0,
  
  -- Status and validation
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending', 'archived')),
  verified BOOLEAN DEFAULT false, -- Manual verification flag
  notes TEXT,
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Face detections log for all face recognition events
CREATE TABLE IF NOT EXISTS face_detections (
  detection_id SERIAL PRIMARY KEY,
  
  -- Detection basics
  camera_id VARCHAR(50) NOT NULL REFERENCES cameras(camera_id) ON DELETE CASCADE,
  face_id INTEGER REFERENCES face_profiles(face_id) ON DELETE SET NULL,
  
  -- Recognition results
  person_name VARCHAR(255), -- Cached name for quick queries
  person_type VARCHAR(50),
  confidence DECIMAL(4,3) NOT NULL CHECK (confidence BETWEEN 0.0 AND 1.0),
  is_match BOOLEAN NOT NULL DEFAULT false,
  
  -- Spatial data
  bounding_box JSONB NOT NULL, -- {x, y, width, height} normalized coordinates
  face_landmarks JSONB, -- Optional face landmarks for pose analysis
  face_quality_score DECIMAL(3,2), -- Face image quality assessment
  
  -- Alert generation
  alert_generated BOOLEAN DEFAULT false,
  alert_id VARCHAR(50), -- Link to generated alert if any
  
  -- Image storage
  detection_image_path VARCHAR(500), -- Full frame image
  face_crop_path VARCHAR(500), -- Cropped face image
  image_hash VARCHAR(128), -- For duplicate detection
  
  -- Processing metadata
  processing_time_ms INTEGER, -- How long recognition took
  model_version VARCHAR(20) DEFAULT 'v1.0',
  
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  -- Index for performance
  FOREIGN KEY (alert_id) REFERENCES ai_alerts_log(alert_id) ON DELETE SET NULL
);

-- Face enrollment sessions for bulk face addition
CREATE TABLE IF NOT EXISTS face_enrollment_sessions (
  session_id SERIAL PRIMARY KEY,
  session_name VARCHAR(255) NOT NULL,
  property_id INTEGER REFERENCES "Properties"(id) ON DELETE CASCADE,
  created_by INTEGER REFERENCES "Users"(id) ON DELETE SET NULL,
  
  -- Session statistics
  faces_processed INTEGER DEFAULT 0,
  faces_enrolled INTEGER DEFAULT 0,
  faces_rejected INTEGER DEFAULT 0,
  
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'failed', 'cancelled')),
  started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP WITH TIME ZONE,
  
  -- Configuration
  batch_size INTEGER DEFAULT 50,
  quality_threshold DECIMAL(3,2) DEFAULT 0.60,
  confidence_threshold DECIMAL(3,2) DEFAULT 0.70,
  
  notes TEXT,
  metadata JSONB DEFAULT '{}'
);

-- Access control events based on face recognition
CREATE TABLE IF NOT EXISTS face_access_events (
  event_id SERIAL PRIMARY KEY,
  
  -- Face detection reference
  detection_id INTEGER REFERENCES face_detections(detection_id) ON DELETE CASCADE,
  face_id INTEGER REFERENCES face_profiles(face_id) ON DELETE SET NULL,
  
  -- Access decision
  access_granted BOOLEAN NOT NULL DEFAULT false,
  access_reason VARCHAR(100), -- 'authorized', 'unknown_person', 'blacklisted', 'after_hours'
  
  -- Location and timing
  camera_id VARCHAR(50) NOT NULL REFERENCES cameras(camera_id),
  location_name VARCHAR(255),
  event_timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  -- Guard response
  guard_notified BOOLEAN DEFAULT false,
  guard_response VARCHAR(100), -- 'investigating', 'cleared', 'escalated'
  response_time_seconds INTEGER,
  
  -- Audit trail
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ========================================
-- FACE RECOGNITION ANALYTICS TABLES
-- ========================================

-- Daily face recognition statistics
CREATE TABLE IF NOT EXISTS face_recognition_stats (
  stat_id SERIAL PRIMARY KEY,
  date_recorded DATE NOT NULL,
  property_id INTEGER REFERENCES "Properties"(id) ON DELETE CASCADE,
  camera_id VARCHAR(50) REFERENCES cameras(camera_id) ON DELETE CASCADE,
  
  -- Detection metrics
  total_detections INTEGER DEFAULT 0,
  known_person_detections INTEGER DEFAULT 0,
  unknown_person_detections INTEGER DEFAULT 0,
  
  -- Recognition accuracy
  true_positives INTEGER DEFAULT 0,
  false_positives INTEGER DEFAULT 0,
  false_negatives INTEGER DEFAULT 0,
  accuracy_rate DECIMAL(5,4), -- Calculated accuracy percentage
  
  -- Performance metrics
  avg_processing_time_ms DECIMAL(8,2),
  total_processing_time_ms BIGINT,
  
  -- Alert generation
  alerts_generated INTEGER DEFAULT 0,
  false_alarms INTEGER DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  -- Unique constraint to prevent duplicates
  UNIQUE(date_recorded, property_id, camera_id)
);

-- ========================================
-- CREATE INDEXES FOR PERFORMANCE
-- ========================================

-- Face profiles indexes
CREATE INDEX IF NOT EXISTS idx_face_profiles_person_type ON face_profiles(person_type);
CREATE INDEX IF NOT EXISTS idx_face_profiles_property ON face_profiles(property_id);
CREATE INDEX IF NOT EXISTS idx_face_profiles_status ON face_profiles(status);
CREATE INDEX IF NOT EXISTS idx_face_profiles_last_seen ON face_profiles(last_seen);
CREATE INDEX IF NOT EXISTS idx_face_profiles_name ON face_profiles(person_name);
CREATE INDEX IF NOT EXISTS idx_face_profiles_image_hash ON face_profiles(face_image_hash);

-- Face detections indexes
CREATE INDEX IF NOT EXISTS idx_face_detections_camera ON face_detections(camera_id);
CREATE INDEX IF NOT EXISTS idx_face_detections_face_id ON face_detections(face_id);
CREATE INDEX IF NOT EXISTS idx_face_detections_timestamp ON face_detections(timestamp);
CREATE INDEX IF NOT EXISTS idx_face_detections_confidence ON face_detections(confidence);
CREATE INDEX IF NOT EXISTS idx_face_detections_is_match ON face_detections(is_match);
CREATE INDEX IF NOT EXISTS idx_face_detections_alert ON face_detections(alert_generated);

-- Face access events indexes
CREATE INDEX IF NOT EXISTS idx_face_access_camera ON face_access_events(camera_id);
CREATE INDEX IF NOT EXISTS idx_face_access_timestamp ON face_access_events(event_timestamp);
CREATE INDEX IF NOT EXISTS idx_face_access_granted ON face_access_events(access_granted);

-- Face recognition stats indexes
CREATE INDEX IF NOT EXISTS idx_face_stats_date ON face_recognition_stats(date_recorded);
CREATE INDEX IF NOT EXISTS idx_face_stats_property ON face_recognition_stats(property_id);
CREATE INDEX IF NOT EXISTS idx_face_stats_camera ON face_recognition_stats(camera_id);

-- ========================================
-- GRANT PERMISSIONS
-- ========================================

-- Grant ownership to swanadmin
ALTER TABLE face_profiles OWNER TO swanadmin;
ALTER TABLE face_detections OWNER TO swanadmin;
ALTER TABLE face_enrollment_sessions OWNER TO swanadmin;
ALTER TABLE face_access_events OWNER TO swanadmin;
ALTER TABLE face_recognition_stats OWNER TO swanadmin;

-- Grant all privileges
GRANT ALL PRIVILEGES ON TABLE face_profiles TO swanadmin;
GRANT ALL PRIVILEGES ON TABLE face_detections TO swanadmin;
GRANT ALL PRIVILEGES ON TABLE face_enrollment_sessions TO swanadmin;
GRANT ALL PRIVILEGES ON TABLE face_access_events TO swanadmin;
GRANT ALL PRIVILEGES ON TABLE face_recognition_stats TO swanadmin;

-- Grant sequence privileges
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO swanadmin;

-- ========================================
-- INSERT SAMPLE DATA FOR TESTING
-- ========================================

-- Sample face profiles (using mock encodings for testing)
INSERT INTO face_profiles (
  person_name, person_type, face_encoding, property_id, 
  access_level, employee_id, status, verified
) VALUES 
(
  'John Smith', 
  'resident', 
  E'\\x0123456789abcdef', -- Mock encoding - will be replaced with real encodings
  1, 
  'basic', 
  'RES001', 
  'active', 
  true
),
(
  'Sarah Johnson', 
  'staff', 
  E'\\x123456789abcdef0', 
  1, 
  'elevated', 
  'STAFF001', 
  'active', 
  true
),
(
  'Mike Wilson', 
  'blacklist', 
  E'\\x23456789abcdef01', 
  1, 
  'restricted', 
  NULL, 
  'active', 
  true
)
ON CONFLICT DO NOTHING;

-- ========================================
-- USEFUL QUERIES FOR FACE RECOGNITION
-- ========================================

-- Create view for recent face detections with person info
CREATE OR REPLACE VIEW recent_face_detections AS
SELECT 
  fd.detection_id,
  fd.camera_id,
  fd.person_name,
  fd.person_type,
  fd.confidence,
  fd.is_match,
  fd.alert_generated,
  fd.timestamp,
  fp.access_level,
  fp.status as person_status,
  c.name as camera_name,
  c.location as camera_location
FROM face_detections fd
LEFT JOIN face_profiles fp ON fd.face_id = fp.face_id
LEFT JOIN cameras c ON fd.camera_id = c.camera_id
WHERE fd.timestamp >= NOW() - INTERVAL '24 hours'
ORDER BY fd.timestamp DESC;

-- Create view for face recognition statistics
CREATE OR REPLACE VIEW face_recognition_summary AS
SELECT 
  fp.person_type,
  COUNT(*) as total_profiles,
  COUNT(CASE WHEN fp.status = 'active' THEN 1 END) as active_profiles,
  COUNT(CASE WHEN fp.verified = true THEN 1 END) as verified_profiles,
  AVG(fp.total_detections) as avg_detections_per_person,
  MAX(fp.last_seen) as most_recent_detection
FROM face_profiles fp
GROUP BY fp.person_type
ORDER BY total_profiles DESC;

-- ========================================
-- VERIFICATION QUERIES
-- ========================================

SELECT 'Face Recognition Database Schema Created Successfully!' as status;

SELECT 
  'Face Profiles' as table_name, 
  COUNT(*) as record_count 
FROM face_profiles
UNION ALL
SELECT 
  'Face Detections' as table_name, 
  COUNT(*) as record_count 
FROM face_detections
UNION ALL
SELECT 
  'Face Access Events' as table_name, 
  COUNT(*) as record_count 
FROM face_access_events
UNION ALL
SELECT 
  'Face Enrollment Sessions' as table_name, 
  COUNT(*) as record_count 
FROM face_enrollment_sessions
UNION ALL
SELECT 
  'Face Recognition Stats' as table_name, 
  COUNT(*) as record_count 
FROM face_recognition_stats;

-- Show sample face profiles
SELECT 
  face_id,
  person_name,
  person_type,
  access_level,
  status,
  verified,
  total_detections,
  created_at
FROM face_profiles 
ORDER BY created_at DESC;

SELECT 'Face Recognition schema ready for implementation!' as final_status;