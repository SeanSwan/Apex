-- APEX AI SECURITY PLATFORM - AI TABLES SETUP (Phase 2A)
-- ==========================================================
-- This script creates all AI-specific tables needed for your
-- sophisticated alert and dispatch systems to function
--
-- Run this in pgAdmin connected to the 'apex' database AFTER
-- running COMPLETE_SETUP.sql
-- ==========================================================

-- Enable PostGIS extension for geographic data (if not already enabled)
CREATE EXTENSION IF NOT EXISTS postgis;

-- ========================================
-- CAMERA SYSTEM TABLES
-- ========================================

-- Main cameras table
CREATE TABLE IF NOT EXISTS cameras (
  camera_id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  location VARCHAR(255) NOT NULL,
  rtsp_url VARCHAR(500),
  status VARCHAR(20) DEFAULT 'offline' CHECK (status IN ('online', 'offline', 'error', 'maintenance')),
  property_id INTEGER REFERENCES "Properties"(id) ON DELETE CASCADE,
  capabilities JSONB DEFAULT '{}', -- stores camera features like PTZ, audio, etc.
  metadata JSONB DEFAULT '{}',
  last_heartbeat TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Camera zones for geographic mapping
CREATE TABLE IF NOT EXISTS camera_zones (
  zone_id SERIAL PRIMARY KEY,
  camera_id VARCHAR(50) REFERENCES cameras(camera_id) ON DELETE CASCADE,
  zone_name VARCHAR(255) NOT NULL,
  camera_name VARCHAR(255),
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  sensitivity_level VARCHAR(20) DEFAULT 'medium' CHECK (sensitivity_level IN ('low', 'medium', 'high', 'critical')),
  coverage_area POLYGON, -- Geographic coverage area
  property_id INTEGER REFERENCES "Properties"(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ========================================
-- ENHANCED GUARD SYSTEM TABLES
-- ========================================

-- Extended guard profiles (linked to Users table)
CREATE TABLE IF NOT EXISTS guards (
  guard_id VARCHAR(50) PRIMARY KEY,
  user_id INTEGER REFERENCES "Users"(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  status VARCHAR(20) DEFAULT 'off_duty' CHECK (status IN ('on_duty', 'off_duty', 'break', 'responding', 'available')),
  experience_level VARCHAR(20) DEFAULT 'junior' CHECK (experience_level IN ('junior', 'senior', 'supervisor', 'manager')),
  assigned_zone VARCHAR(100),
  active_alerts INTEGER DEFAULT 0,
  last_known_latitude DECIMAL(10, 8),
  last_known_longitude DECIMAL(11, 8),
  last_dispatch TIMESTAMP WITH TIME ZONE,
  last_check_in TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  device_tokens JSONB DEFAULT '[]', -- Mobile app push notification tokens
  certifications JSONB DEFAULT '[]',
  emergency_contact JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Guard devices for push notifications
CREATE TABLE IF NOT EXISTS guard_devices (
  device_id SERIAL PRIMARY KEY,
  guard_id VARCHAR(50) REFERENCES guards(guard_id) ON DELETE CASCADE,
  device_tokens JSONB NOT NULL DEFAULT '[]', -- Array of device tokens
  platform VARCHAR(20) CHECK (platform IN ('ios', 'android', 'web')),
  last_active TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ========================================
-- AI ALERT SYSTEM TABLES  
-- ========================================

-- Main AI alerts log with all detection data
CREATE TABLE IF NOT EXISTS ai_alerts_log (
  alert_id VARCHAR(50) PRIMARY KEY,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
  camera_id VARCHAR(50) REFERENCES cameras(camera_id) ON DELETE CASCADE,
  alert_type VARCHAR(100) NOT NULL,
  priority VARCHAR(20) NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  description TEXT NOT NULL,
  detection_details JSONB NOT NULL, -- Full AI detection data
  risk_analysis JSONB DEFAULT '{}', -- Dynamic risk scoring results
  ai_copilot_actions JSONB DEFAULT '[]', -- Recommended actions from AI
  threat_vector_id VARCHAR(50), -- Link to threat pattern analysis
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'acknowledged', 'dispatched', 'resolved', 'false_positive')),
  acknowledged_by VARCHAR(50),
  acknowledged_at TIMESTAMP WITH TIME ZONE,
  assigned_guard VARCHAR(50) REFERENCES guards(guard_id) ON DELETE SET NULL,
  operator_metadata JSONB DEFAULT '{}', -- Browser info, workstation, etc.
  resolution_notes TEXT,
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Threat vector analysis for connected alerts
CREATE TABLE IF NOT EXISTS threat_vectors (
  vector_id VARCHAR(50) PRIMARY KEY,
  data JSONB NOT NULL, -- Complete threat vector analysis
  pattern_type VARCHAR(100),
  escalation_factor DECIMAL(3,2) DEFAULT 1.0,
  alert_count INTEGER DEFAULT 0,
  first_alert_time TIMESTAMP WITH TIME ZONE,
  last_alert_time TIMESTAMP WITH TIME ZONE,
  geographic_span_meters INTEGER, -- How far alerts are spread
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'resolved', 'archived')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ========================================
-- DISPATCH SYSTEM TABLES
-- ========================================

-- Guard dispatch tracking with GPS routing
CREATE TABLE IF NOT EXISTS guard_dispatches (
  dispatch_id VARCHAR(50) PRIMARY KEY,
  alert_id VARCHAR(50) REFERENCES ai_alerts_log(alert_id) ON DELETE CASCADE,
  guard_id VARCHAR(50) REFERENCES guards(guard_id) ON DELETE CASCADE,
  priority VARCHAR(20) NOT NULL CHECK (priority IN ('low', 'normal', 'high', 'emergency', 'backup')),
  status VARCHAR(20) DEFAULT 'dispatched' CHECK (status IN ('dispatched', 'acknowledged', 'en_route', 'on_scene', 'completed', 'cancelled')),
  estimated_arrival TIMESTAMP WITH TIME ZONE,
  actual_arrival TIMESTAMP WITH TIME ZONE,
  route_data JSONB DEFAULT '{}', -- GPS route, ETA, distance
  guard_location JSONB, -- Real-time guard position updates  
  special_instructions TEXT,
  backup_required BOOLEAN DEFAULT false,
  backup_for_dispatch VARCHAR(50), -- If this is a backup dispatch
  status_notes TEXT,
  completion_time TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_by VARCHAR(50) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ========================================
-- NOTIFICATION SYSTEM TABLES
-- ========================================

-- Guard notifications log
CREATE TABLE IF NOT EXISTS guard_notifications (
  notification_id SERIAL PRIMARY KEY,
  guard_id VARCHAR(50) REFERENCES guards(guard_id) ON DELETE CASCADE,
  notification_data JSONB NOT NULL, -- Full notification payload
  notification_type VARCHAR(50) NOT NULL,
  priority VARCHAR(20) DEFAULT 'normal',
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  delivered_at TIMESTAMP WITH TIME ZONE,
  read_at TIMESTAMP WITH TIME ZONE,
  response_data JSONB, -- Guard's response if applicable
  platform VARCHAR(20), -- ios, android, web
  delivery_status VARCHAR(20) DEFAULT 'sent' CHECK (delivery_status IN ('sent', 'delivered', 'failed', 'read'))
);

-- ========================================
-- SECURITY & AUDIT TABLES
-- ========================================

-- Security events log for audit trail
CREATE TABLE IF NOT EXISTS security_events (
  event_id SERIAL PRIMARY KEY,
  event_type VARCHAR(100) NOT NULL,
  event_data JSONB NOT NULL,
  user_id INTEGER REFERENCES "Users"(id) ON DELETE SET NULL,
  guard_id VARCHAR(50) REFERENCES guards(guard_id) ON DELETE SET NULL,
  ip_address INET,
  user_agent TEXT,
  session_id VARCHAR(100),
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- AI model performance tracking
CREATE TABLE IF NOT EXISTS ai_model_metrics (
  metric_id SERIAL PRIMARY KEY,
  model_version VARCHAR(50) NOT NULL,
  metric_type VARCHAR(50) NOT NULL, -- 'accuracy', 'latency', 'throughput', etc.
  metric_value DECIMAL(10,4) NOT NULL,
  camera_id VARCHAR(50) REFERENCES cameras(camera_id) ON DELETE CASCADE,
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  metadata JSONB DEFAULT '{}'
);

-- ========================================
-- CREATE INDEXES FOR PERFORMANCE
-- ========================================

-- AI Alerts indexes
CREATE INDEX IF NOT EXISTS idx_ai_alerts_timestamp ON ai_alerts_log(timestamp);
CREATE INDEX IF NOT EXISTS idx_ai_alerts_camera ON ai_alerts_log(camera_id);
CREATE INDEX IF NOT EXISTS idx_ai_alerts_status ON ai_alerts_log(status);
CREATE INDEX IF NOT EXISTS idx_ai_alerts_priority ON ai_alerts_log(priority);
CREATE INDEX IF NOT EXISTS idx_ai_alerts_assigned_guard ON ai_alerts_log(assigned_guard);

-- Dispatch indexes
CREATE INDEX IF NOT EXISTS idx_dispatches_alert ON guard_dispatches(alert_id);
CREATE INDEX IF NOT EXISTS idx_dispatches_guard ON guard_dispatches(guard_id);
CREATE INDEX IF NOT EXISTS idx_dispatches_status ON guard_dispatches(status);
CREATE INDEX IF NOT EXISTS idx_dispatches_created ON guard_dispatches(created_at);

-- Guards indexes
CREATE INDEX IF NOT EXISTS idx_guards_status ON guards(status);
CREATE INDEX IF NOT EXISTS idx_guards_zone ON guards(assigned_zone);
CREATE INDEX IF NOT EXISTS idx_guards_location ON guards(last_known_latitude, last_known_longitude);

-- Camera indexes
CREATE INDEX IF NOT EXISTS idx_cameras_status ON cameras(status);
CREATE INDEX IF NOT EXISTS idx_cameras_property ON cameras(property_id);
CREATE INDEX IF NOT EXISTS idx_camera_zones_camera ON camera_zones(camera_id);

-- Security events indexes
CREATE INDEX IF NOT EXISTS idx_security_events_type ON security_events(event_type);
CREATE INDEX IF NOT EXISTS idx_security_events_timestamp ON security_events(timestamp);
CREATE INDEX IF NOT EXISTS idx_security_events_user ON security_events(user_id);

-- Notifications indexes
CREATE INDEX IF NOT EXISTS idx_notifications_guard ON guard_notifications(guard_id);
CREATE INDEX IF NOT EXISTS idx_notifications_sent ON guard_notifications(sent_at);
CREATE INDEX IF NOT EXISTS idx_notifications_status ON guard_notifications(delivery_status);

-- ========================================
-- GRANT PERMISSIONS
-- ========================================

-- Grant ownership to swanadmin
ALTER TABLE cameras OWNER TO swanadmin;
ALTER TABLE camera_zones OWNER TO swanadmin;
ALTER TABLE guards OWNER TO swanadmin;
ALTER TABLE guard_devices OWNER TO swanadmin;
ALTER TABLE ai_alerts_log OWNER TO swanadmin;
ALTER TABLE threat_vectors OWNER TO swanadmin;
ALTER TABLE guard_dispatches OWNER TO swanadmin;
ALTER TABLE guard_notifications OWNER TO swanadmin;
ALTER TABLE security_events OWNER TO swanadmin;
ALTER TABLE ai_model_metrics OWNER TO swanadmin;

-- Grant all privileges
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO swanadmin;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO swanadmin;

-- ========================================
-- INSERT SAMPLE DATA FOR TESTING
-- ========================================

-- Sample cameras
INSERT INTO cameras (camera_id, name, location, rtsp_url, status, capabilities) VALUES
('cam_entrance_1', 'Main Entrance', 'Building A - Lobby', 'rtsp://demo.url/stream1', 'online', '{"supports_ptz": true, "supports_audio": true, "supports_night_vision": true}'),
('cam_parking_1', 'Parking Garage', 'Underground Level 1', 'rtsp://demo.url/stream2', 'online', '{"supports_ptz": false, "supports_audio": false, "supports_night_vision": true}'),
('cam_elevator_1', 'Elevator Bank', 'Building A - Floor 1', 'rtsp://demo.url/stream3', 'online', '{"supports_ptz": false, "supports_audio": true, "supports_night_vision": false}'),
('cam_rooftop_1', 'Rooftop Access', 'Building A - Roof', 'rtsp://demo.url/stream4', 'offline', '{"supports_ptz": true, "supports_audio": true, "supports_night_vision": true}')
ON CONFLICT (camera_id) DO NOTHING;

-- Sample camera zones
INSERT INTO camera_zones (camera_id, zone_name, camera_name, latitude, longitude, sensitivity_level) VALUES
('cam_entrance_1', 'Zone A', 'Main Entrance', 40.7589, -73.9851, 'high'),
('cam_parking_1', 'Zone B', 'Parking Garage', 40.7580, -73.9840, 'medium'),
('cam_elevator_1', 'Zone A', 'Elevator Bank', 40.7585, -73.9845, 'medium'),
('cam_rooftop_1', 'Zone C', 'Rooftop Access', 40.7595, -73.9860, 'critical')
ON CONFLICT DO NOTHING;

-- Sample guards (you'll need to update these IDs to match actual User IDs)
INSERT INTO guards (guard_id, user_id, name, status, experience_level, assigned_zone, last_known_latitude, last_known_longitude) VALUES
('guard_001', 1, 'Marcus Johnson', 'on_duty', 'senior', 'Zone A', 40.7589, -73.9851),
('guard_002', 2, 'Sarah Williams', 'responding', 'senior', 'Zone B', 40.7580, -73.9840),
('guard_003', 3, 'David Chen', 'break', 'junior', 'Zone C', 40.7595, -73.9860)
ON CONFLICT (guard_id) DO NOTHING;

-- Sample alert for testing
INSERT INTO ai_alerts_log (
  alert_id, timestamp, camera_id, alert_type, priority, description, 
  detection_details, risk_analysis, ai_copilot_actions, status
) VALUES (
  'alert_demo_001',
  CURRENT_TIMESTAMP,
  'cam_entrance_1',
  'person_detection',
  'medium',
  'Person detected in restricted area after hours',
  '{"detection_id": "det_001", "detection_type": "person", "confidence": 0.87, "bounding_box": {"x": 0.3, "y": 0.2, "width": 0.2, "height": 0.4}, "alert_level": "medium"}',
  '{"risk_score": 6.2, "risk_level": "medium", "risk_breakdown": {"base_detection_risk": 3.0, "zone_multiplier": 2.5, "time_multiplier": 2.0, "confidence_factor": 0.87}}',
  '[{"action_type": "enhanced_monitoring", "priority": "high", "description": "Enable enhanced AI monitoring and zoom tracking", "estimated_time": 10, "confidence": 0.90}]',
  'pending'
) ON CONFLICT (alert_id) DO NOTHING;

-- ========================================
-- VERIFICATION QUERIES
-- ========================================

-- Verify tables were created successfully
SELECT 'APEX AI Database Setup Complete!' as status;

SELECT 
  'Cameras' as table_name, 
  COUNT(*) as record_count 
FROM cameras
UNION ALL
SELECT 
  'Camera Zones' as table_name, 
  COUNT(*) as record_count 
FROM camera_zones
UNION ALL
SELECT 
  'Guards' as table_name, 
  COUNT(*) as record_count 
FROM guards
UNION ALL
SELECT 
  'AI Alerts' as table_name, 
  COUNT(*) as record_count 
FROM ai_alerts_log
UNION ALL
SELECT 
  'Guard Dispatches' as table_name, 
  COUNT(*) as record_count 
FROM guard_dispatches
UNION ALL
SELECT 
  'Security Events' as table_name, 
  COUNT(*) as record_count 
FROM security_events;

-- Show the sample alert data
SELECT 
  alert_id,
  alert_type,
  priority,
  status,
  camera_id,
  description,
  timestamp
FROM ai_alerts_log 
ORDER BY timestamp DESC 
LIMIT 5;

SELECT 'Setup verification complete. Your APEX AI platform is ready for Phase 2A!' as final_status;