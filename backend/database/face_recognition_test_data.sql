-- ========================================
-- APEX AI FACE RECOGNITION TEST DATA SETUP
-- ========================================
-- Comprehensive test data for live simulations
-- Run this after the main schema to populate test data

-- Clear existing test data (if any)
DELETE FROM face_detections;
DELETE FROM face_recognition_analytics;
DELETE FROM face_profiles WHERE created_by = 'test_simulation';

-- ========================================
-- TEST FACE PROFILES
-- ========================================

INSERT INTO face_profiles (
    name, 
    encoding_vector, 
    status, 
    department, 
    access_level, 
    notes, 
    created_by,
    image_filename,
    created_at
) VALUES 
-- Security Personnel
('John Smith', 'encoded_vector_john_smith_base64_placeholder_128_dimensions', 'active', 'Security', 'Administrative', 'Head of Security Operations', 'test_simulation', 'john_smith.jpg', NOW() - INTERVAL '30 days'),
('Sarah Connor', 'encoded_vector_sarah_connor_base64_placeholder_128_dimensions', 'active', 'Security', 'Security', 'Night Shift Supervisor', 'test_simulation', 'sarah_connor.jpg', NOW() - INTERVAL '25 days'),
('Mike Rodriguez', 'encoded_vector_mike_rodriguez_base64_placeholder_128_dimensions', 'active', 'Security', 'Standard', 'Security Guard - Main Entrance', 'test_simulation', 'mike_rodriguez.jpg', NOW() - INTERVAL '20 days'),

-- Management
('Emily Johnson', 'encoded_vector_emily_johnson_base64_placeholder_128_dimensions', 'active', 'Management', 'Executive', 'Chief Operations Officer', 'test_simulation', 'emily_johnson.jpg', NOW() - INTERVAL '45 days'),
('David Chen', 'encoded_vector_david_chen_base64_placeholder_128_dimensions', 'active', 'Management', 'Administrative', 'Facility Manager', 'test_simulation', 'david_chen.jpg', NOW() - INTERVAL '35 days'),

-- Operations
('Lisa Park', 'encoded_vector_lisa_park_base64_placeholder_128_dimensions', 'active', 'Operations', 'Standard', 'Operations Coordinator', 'test_simulation', 'lisa_park.jpg', NOW() - INTERVAL '15 days'),
('Robert Williams', 'encoded_vector_robert_williams_base64_placeholder_128_dimensions', 'active', 'Operations', 'Standard', 'Maintenance Supervisor', 'test_simulation', 'robert_williams.jpg', NOW() - INTERVAL '12 days'),

-- Administration
('Jennifer Davis', 'encoded_vector_jennifer_davis_base64_placeholder_128_dimensions', 'active', 'Administration', 'Administrative', 'HR Manager', 'test_simulation', 'jennifer_davis.jpg', NOW() - INTERVAL '40 days'),
('Thomas Anderson', 'encoded_vector_thomas_anderson_base64_placeholder_128_dimensions', 'active', 'Administration', 'Elevated', 'IT Administrator', 'test_simulation', 'thomas_anderson.jpg', NOW() - INTERVAL '28 days'),

-- Guests and Contractors
('Alex Turner', 'encoded_vector_alex_turner_base64_placeholder_128_dimensions', 'active', 'Guest', 'Basic', 'Visiting Executive - TechCorp', 'test_simulation', 'alex_turner.jpg', NOW() - INTERVAL '7 days'),
('Maria Santos', 'encoded_vector_maria_santos_base64_placeholder_128_dimensions', 'active', 'Contractor', 'Restricted', 'Cleaning Services Supervisor', 'test_simulation', 'maria_santos.jpg', NOW() - INTERVAL '10 days'),

-- Inactive/Archived Profiles for Testing
('Former Employee', 'encoded_vector_former_employee_base64_placeholder_128_dimensions', 'archived', 'Security', 'Standard', 'Former security guard - access revoked', 'test_simulation', 'former_employee.jpg', NOW() - INTERVAL '60 days'),
('Temp Worker', 'encoded_vector_temp_worker_base64_placeholder_128_dimensions', 'inactive', 'Operations', 'Basic', 'Temporary contractor - project completed', 'test_simulation', 'temp_worker.jpg', NOW() - INTERVAL '5 days');

-- ========================================
-- REALISTIC FACE DETECTION EVENTS
-- ========================================

-- Generate detection events for the last 30 days
-- This creates a realistic pattern of face detections

-- Get face IDs for generating detections
DO $$
DECLARE
    face_record RECORD;
    detection_date DATE;
    detection_time TIME;
    camera_configs TEXT[] := ARRAY[
        'CAM_001:Main Entrance Camera',
        'CAM_002:Lobby Security Camera', 
        'CAM_003:Parking Garage Camera',
        'CAM_004:Emergency Exit Camera',
        'CAM_005:Executive Floor Camera',
        'CAM_006:Operations Area Camera'
    ];
    camera_config TEXT;
    camera_parts TEXT[];
    detection_count INTEGER;
    confidence_val DECIMAL;
    processing_time INTEGER;
    bbox_x_val DECIMAL;
    bbox_y_val DECIMAL;
    bbox_w_val DECIMAL;
    bbox_h_val DECIMAL;
BEGIN
    -- Loop through each active face profile
    FOR face_record IN 
        SELECT face_id, name, department, access_level 
        FROM face_profiles 
        WHERE status = 'active' AND created_by = 'test_simulation'
    LOOP
        -- Generate detections for last 30 days
        FOR i IN 0..29 LOOP
            detection_date := CURRENT_DATE - INTERVAL '1 day' * i;
            
            -- Different people have different detection frequencies
            detection_count := CASE 
                WHEN face_record.department = 'Security' THEN FLOOR(RANDOM() * 8) + 2  -- 2-10 detections per day
                WHEN face_record.department = 'Management' THEN FLOOR(RANDOM() * 4) + 1 -- 1-5 detections per day
                WHEN face_record.department = 'Operations' THEN FLOOR(RANDOM() * 6) + 1 -- 1-7 detections per day
                WHEN face_record.department = 'Administration' THEN FLOOR(RANDOM() * 3) + 1 -- 1-4 detections per day
                WHEN face_record.department = 'Guest' THEN FLOOR(RANDOM() * 2) + 0 -- 0-2 detections per day
                WHEN face_record.department = 'Contractor' THEN FLOOR(RANDOM() * 3) + 0 -- 0-3 detections per day
                ELSE FLOOR(RANDOM() * 2) + 1
            END;
            
            -- Generate detections for this day
            FOR j IN 1..detection_count LOOP
                -- Random time during business hours (7 AM to 8 PM)
                detection_time := TIME '07:00:00' + (INTERVAL '13 hours' * RANDOM());
                
                -- Select random camera
                camera_config := camera_configs[FLOOR(RANDOM() * array_length(camera_configs, 1)) + 1];
                camera_parts := string_to_array(camera_config, ':');
                
                -- Confidence varies by person and camera quality
                confidence_val := 0.65 + (RANDOM() * 0.3); -- 0.65 to 0.95
                
                -- Processing time varies
                processing_time := 50 + FLOOR(RANDOM() * 200); -- 50-250ms
                
                -- Random bounding box (normalized coordinates)
                bbox_x_val := 0.1 + (RANDOM() * 0.6); -- 0.1 to 0.7
                bbox_y_val := 0.1 + (RANDOM() * 0.5); -- 0.1 to 0.6
                bbox_w_val := 0.15 + (RANDOM() * 0.25); -- 0.15 to 0.4
                bbox_h_val := 0.2 + (RANDOM() * 0.3); -- 0.2 to 0.5
                
                INSERT INTO face_detections (
                    face_id,
                    camera_id,
                    camera_name,
                    confidence,
                    is_match,
                    bbox_x,
                    bbox_y,
                    bbox_width,
                    bbox_height,
                    detected_at,
                    processing_time_ms,
                    model_version,
                    alert_generated
                ) VALUES (
                    face_record.face_id,
                    camera_parts[1],
                    camera_parts[2],
                    confidence_val,
                    true, -- Known face
                    bbox_x_val,
                    bbox_y_val,
                    bbox_w_val,
                    bbox_h_val,
                    detection_date + detection_time,
                    processing_time,
                    'yolov8_face_v1.2',
                    CASE WHEN RANDOM() < 0.05 THEN true ELSE false END -- 5% chance of alert
                );
            END LOOP;
        END LOOP;
    END LOOP;
    
    -- Generate unknown face detections (security concerns)
    FOR i IN 0..29 LOOP
        detection_date := CURRENT_DATE - INTERVAL '1 day' * i;
        
        -- 1-3 unknown detections per day
        detection_count := FLOOR(RANDOM() * 3) + 1;
        
        FOR j IN 1..detection_count LOOP
            -- Random time, more likely during off-hours
            detection_time := CASE 
                WHEN RANDOM() < 0.3 THEN TIME '22:00:00' + (INTERVAL '8 hours' * RANDOM()) -- 30% night time
                ELSE TIME '07:00:00' + (INTERVAL '13 hours' * RANDOM()) -- 70% day time
            END;
            
            camera_config := camera_configs[FLOOR(RANDOM() * array_length(camera_configs, 1)) + 1];
            camera_parts := string_to_array(camera_config, ':');
            
            -- Lower confidence for unknown faces
            confidence_val := 0.3 + (RANDOM() * 0.4); -- 0.3 to 0.7
            processing_time := 75 + FLOOR(RANDOM() * 300); -- 75-375ms (slower for unknown)
            
            bbox_x_val := 0.1 + (RANDOM() * 0.6);
            bbox_y_val := 0.1 + (RANDOM() * 0.5);
            bbox_w_val := 0.15 + (RANDOM() * 0.25);
            bbox_h_val := 0.2 + (RANDOM() * 0.3);
            
            INSERT INTO face_detections (
                face_id,
                camera_id,
                camera_name,
                confidence,
                is_match,
                bbox_x,
                bbox_y,
                bbox_width,
                bbox_height,
                detected_at,
                processing_time_ms,
                model_version,
                alert_generated
            ) VALUES (
                NULL, -- Unknown face
                camera_parts[1],
                camera_parts[2],
                confidence_val,
                false, -- Unknown face
                bbox_x_val,
                bbox_y_val,
                bbox_w_val,
                bbox_h_val,
                detection_date + detection_time,
                processing_time,
                'yolov8_face_v1.2',
                CASE WHEN RANDOM() < 0.8 THEN true ELSE false END -- 80% chance of alert for unknown
            );
        END LOOP;
    END LOOP;
END $$;

-- ========================================
-- GENERATE ANALYTICS DATA
-- ========================================

-- Populate daily analytics for the last 30 days
INSERT INTO face_recognition_analytics (
    date_recorded,
    total_detections,
    known_face_detections,
    unknown_face_detections,
    unique_faces_detected,
    avg_confidence,
    avg_processing_time_ms,
    active_cameras,
    cameras_with_detections,
    system_uptime_minutes
)
SELECT 
    DATE(detected_at) as date_recorded,
    COUNT(*) as total_detections,
    COUNT(CASE WHEN is_match = true THEN 1 END) as known_face_detections,
    COUNT(CASE WHEN is_match = false THEN 1 END) as unknown_face_detections,
    COUNT(DISTINCT face_id) FILTER (WHERE face_id IS NOT NULL) as unique_faces_detected,
    AVG(confidence) as avg_confidence,
    AVG(processing_time_ms) as avg_processing_time_ms,
    COUNT(DISTINCT camera_id) as active_cameras,
    COUNT(DISTINCT camera_id) as cameras_with_detections,
    1440 as system_uptime_minutes -- 24 hours in minutes
FROM face_detections 
WHERE detected_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY DATE(detected_at)
ORDER BY date_recorded DESC;

-- ========================================
-- SIMULATION SUMMARY
-- ========================================

-- Display summary of generated test data
SELECT 
    'FACE RECOGNITION TEST DATA SUMMARY' as summary_type,
    '' as separator,
    (SELECT COUNT(*) FROM face_profiles WHERE created_by = 'test_simulation') as total_test_profiles,
    (SELECT COUNT(*) FROM face_profiles WHERE created_by = 'test_simulation' AND status = 'active') as active_profiles,
    (SELECT COUNT(*) FROM face_detections WHERE detected_at >= CURRENT_DATE - INTERVAL '30 days') as total_detections_30_days,
    (SELECT COUNT(*) FROM face_detections WHERE is_match = true AND detected_at >= CURRENT_DATE - INTERVAL '30 days') as known_detections_30_days,
    (SELECT COUNT(*) FROM face_detections WHERE is_match = false AND detected_at >= CURRENT_DATE - INTERVAL '30 days') as unknown_detections_30_days,
    (SELECT COUNT(*) FROM face_recognition_analytics) as analytics_records_created,
    (SELECT ROUND(AVG(confidence)::numeric, 3) FROM face_detections WHERE detected_at >= CURRENT_DATE - INTERVAL '7 days') as avg_confidence_last_7_days,
    NOW() as data_generated_at;

-- Create indexes for optimal test performance
CREATE INDEX IF NOT EXISTS idx_test_face_detections_recent 
ON face_detections(detected_at) 
WHERE detected_at >= CURRENT_DATE - INTERVAL '30 days';

CREATE INDEX IF NOT EXISTS idx_test_face_profiles_simulation 
ON face_profiles(created_by) 
WHERE created_by = 'test_simulation';

-- ========================================
-- SIMULATION COMPLETE
-- ========================================

SELECT 
    '✅ Face Recognition Test Data Setup Complete!' as status,
    'Ready for live simulations and testing' as message,
    COUNT(DISTINCT fp.face_id) as profiles_created,
    COUNT(fd.detection_id) as detections_generated,
    COUNT(DISTINCT fd.camera_id) as cameras_simulated
FROM face_profiles fp
LEFT JOIN face_detections fd ON fp.face_id = fd.face_id
WHERE fp.created_by = 'test_simulation';
