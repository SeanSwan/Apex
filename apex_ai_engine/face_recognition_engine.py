"""
APEX AI FACE RECOGNITION ENGINE
===============================
Core face recognition module for real-time identity verification
Integrates with YOLOv8 detection and PostgreSQL database

Features:
- Real-time face detection and recognition
- Database integration for known faces
- Alert generation for unknown/blacklisted individuals
- Performance optimization for multiple cameras
- Face enrollment and management

Dependencies:
- face_recognition
- opencv-python
- numpy
- psycopg2
- Pillow
"""

import cv2
import face_recognition
import numpy as np
import json
import logging
import time
import hashlib
import base64
from datetime import datetime
from typing import Dict, List, Tuple, Optional, Any
from pathlib import Path
import psycopg2
from psycopg2.extras import RealDictCursor
import threading
import queue

# Setup logging
logger = logging.getLogger(__name__)

class FaceRecognitionEngine:
    """
    Advanced face recognition engine for security applications
    """
    
    def __init__(self, db_config: Dict, 
                 confidence_threshold: float = 0.7,
                 face_locations_model: str = 'hog',
                 num_jitters: int = 1):
        """
        Initialize face recognition engine
        
        Args:
            db_config: Database connection configuration
            confidence_threshold: Minimum confidence for face matches
            face_locations_model: 'hog' or 'cnn' for face detection
            num_jitters: Number of times to re-sample for encoding
        """
        self.db_config = db_config
        self.confidence_threshold = confidence_threshold
        self.face_locations_model = face_locations_model
        self.num_jitters = num_jitters
        
        # Face database cache
        self.known_faces_cache = {}
        self.last_cache_update = 0
        self.cache_refresh_interval = 300  # 5 minutes
        
        # Performance tracking
        self.detection_stats = {
            'total_detections': 0,
            'known_faces': 0,
            'unknown_faces': 0,
            'processing_times': []
        }
        
        # Face quality thresholds
        self.quality_thresholds = {
            'min_face_size': 50,  # pixels
            'max_face_size': 500,  # pixels
            'min_confidence': 0.5,
            'blur_threshold': 100.0
        }
        
        logger.info("🧠 Face Recognition Engine initialized")
        
    def get_db_connection(self):
        """Get database connection"""
        try:
            return psycopg2.connect(
                host=self.db_config['host'],
                database=self.db_config['database'], 
                user=self.db_config['user'],
                password=self.db_config['password'],
                port=self.db_config['port'],
                cursor_factory=RealDictCursor
            )
        except Exception as e:
            logger.error(f"❌ Database connection failed: {e}")
            raise
            
    def load_known_faces(self, force_refresh: bool = False) -> Dict:
        """
        Load known face encodings from database with caching
        
        Args:
            force_refresh: Force reload from database
            
        Returns:
            Dictionary of face data indexed by face_id
        """
        current_time = time.time()
        
        # Check if cache needs refresh
        if (not force_refresh and 
            self.known_faces_cache and 
            (current_time - self.last_cache_update) < self.cache_refresh_interval):
            return self.known_faces_cache
        
        logger.info("📥 Loading known faces from database...")
        
        try:
            with self.get_db_connection() as conn:
                cursor = conn.cursor()
                
                query = """
                    SELECT 
                        face_id,
                        person_name,
                        person_type,
                        face_encoding,
                        confidence_threshold,
                        access_level,
                        status,
                        property_id,
                        total_detections,
                        last_seen
                    FROM face_profiles 
                    WHERE status = 'active'
                    ORDER BY person_name
                """
                
                cursor.execute(query)
                faces_data = cursor.fetchall()
                
                # Process face encodings
                known_faces = {}
                valid_faces = 0
                
                for face_data in faces_data:
                    try:
                        # Decode face encoding from database
                        encoding_bytes = face_data['face_encoding']
                        if encoding_bytes:
                            # Convert bytes back to numpy array
                            face_encoding = np.frombuffer(encoding_bytes, dtype=np.float64)
                            
                            # Validate encoding dimensions
                            if len(face_encoding) == 128:
                                known_faces[face_data['face_id']] = {
                                    'face_id': face_data['face_id'],
                                    'person_name': face_data['person_name'],
                                    'person_type': face_data['person_type'],
                                    'face_encoding': face_encoding,
                                    'confidence_threshold': float(face_data['confidence_threshold'] or self.confidence_threshold),
                                    'access_level': face_data['access_level'],
                                    'status': face_data['status'],
                                    'property_id': face_data['property_id'],
                                    'total_detections': face_data['total_detections'] or 0,
                                    'last_seen': face_data['last_seen']
                                }
                                valid_faces += 1
                            else:
                                logger.warning(f"⚠️ Invalid encoding for face_id {face_data['face_id']}")
                                
                    except Exception as e:
                        logger.error(f"❌ Error processing face_id {face_data['face_id']}: {e}")
                        continue
                
                self.known_faces_cache = known_faces
                self.last_cache_update = current_time
                
                logger.info(f"✅ Loaded {valid_faces} valid face encodings from {len(faces_data)} database records")
                return known_faces
                
        except Exception as e:
            logger.error(f"❌ Failed to load known faces: {e}")
            return {}
    
    def calculate_face_quality(self, face_image: np.ndarray, face_location: Tuple) -> float:
        """
        Calculate face quality score for filtering
        
        Args:
            face_image: Full frame image
            face_location: Face bounding box (top, right, bottom, left)
            
        Returns:
            Quality score between 0.0 and 1.0
        """
        try:
            top, right, bottom, left = face_location
            
            # Extract face region
            face_crop = face_image[top:bottom, left:right]
            
            if face_crop.size == 0:
                return 0.0
            
            # Calculate face size
            face_width = right - left
            face_height = bottom - top
            face_area = face_width * face_height
            
            # Size score (prefer medium-sized faces)
            size_score = 1.0
            if face_area < self.quality_thresholds['min_face_size'] ** 2:
                size_score = face_area / (self.quality_thresholds['min_face_size'] ** 2)
            elif face_area > self.quality_thresholds['max_face_size'] ** 2:
                size_score = (self.quality_thresholds['max_face_size'] ** 2) / face_area
            
            # Blur detection using Laplacian variance
            gray_face = cv2.cvtColor(face_crop, cv2.COLOR_BGR2GRAY) if len(face_crop.shape) == 3 else face_crop
            blur_score = cv2.Laplacian(gray_face, cv2.CV_64F).var()
            blur_normalized = min(blur_score / self.quality_thresholds['blur_threshold'], 1.0)
            
            # Aspect ratio score (prefer roughly square faces)
            aspect_ratio = face_width / face_height if face_height > 0 else 0
            aspect_score = 1.0 - abs(1.0 - aspect_ratio) if 0.5 <= aspect_ratio <= 2.0 else 0.5
            
            # Combined quality score
            quality_score = (size_score * 0.4 + blur_normalized * 0.4 + aspect_score * 0.2)
            
            return min(quality_score, 1.0)
            
        except Exception as e:
            logger.error(f"❌ Face quality calculation error: {e}")
            return 0.0
    
    def process_frame_for_faces(self, frame: np.ndarray, camera_id: str) -> List[Dict]:
        """
        Process frame for face detection and recognition
        
        Args:
            frame: Input video frame
            camera_id: Camera identifier
            
        Returns:
            List of face detection results
        """
        start_time = time.time()
        detections = []
        
        try:
            # Load known faces if needed
            known_faces = self.load_known_faces()
            
            if not known_faces:
                logger.warning("⚠️ No known faces loaded - running detection only")
            
            # Detect faces in frame
            face_locations = face_recognition.face_locations(
                frame, 
                model=self.face_locations_model
            )
            
            if not face_locations:
                return []
            
            # Generate face encodings
            face_encodings = face_recognition.face_encodings(
                frame, 
                face_locations, 
                num_jitters=self.num_jitters
            )
            
            # Process each detected face
            for face_encoding, face_location in zip(face_encodings, face_locations):
                detection = self.recognize_face(
                    face_encoding, 
                    face_location, 
                    frame, 
                    camera_id, 
                    known_faces
                )
                
                if detection:
                    detections.append(detection)
            
            # Update performance stats
            processing_time = (time.time() - start_time) * 1000  # Convert to ms
            self.detection_stats['total_detections'] += len(detections)
            self.detection_stats['processing_times'].append(processing_time)
            
            # Keep only last 100 processing times for moving average
            if len(self.detection_stats['processing_times']) > 100:
                self.detection_stats['processing_times'] = self.detection_stats['processing_times'][-100:]
            
            logger.debug(f"🔍 Processed {len(face_locations)} faces in {processing_time:.1f}ms")
            
        except Exception as e:
            logger.error(f"❌ Frame processing error: {e}")
        
        return detections
    
    def recognize_face(self, face_encoding: np.ndarray, face_location: Tuple, 
                      frame: np.ndarray, camera_id: str, known_faces: Dict) -> Optional[Dict]:
        """
        Recognize individual face against known database
        
        Args:
            face_encoding: 128-dimensional face encoding
            face_location: Face bounding box
            frame: Full frame image
            camera_id: Camera identifier
            known_faces: Dictionary of known face data
            
        Returns:
            Face detection result dictionary
        """
        try:
            # Calculate face quality
            quality_score = self.calculate_face_quality(frame, face_location)
            
            # Skip low-quality faces
            if quality_score < self.quality_thresholds['min_confidence']:
                logger.debug(f"⚠️ Skipping low-quality face (quality: {quality_score:.2f})")
                return None
            
            # Initialize detection result
            detection = {
                'camera_id': camera_id,
                'timestamp': datetime.now().isoformat(),
                'face_location': {
                    'top': int(face_location[0]),
                    'right': int(face_location[1]), 
                    'bottom': int(face_location[2]),
                    'left': int(face_location[3])
                },
                'bounding_box': self.convert_to_normalized_bbox(face_location, frame.shape),
                'face_quality_score': quality_score,
                'is_match': False,
                'person_name': 'Unknown',
                'person_type': 'unknown',
                'confidence': 0.0,
                'face_id': None,
                'access_level': None,
                'alert_recommended': False
            }
            
            # Compare against known faces if available
            if known_faces:
                best_match = self.find_best_match(face_encoding, known_faces)
                
                if best_match:
                    face_data = known_faces[best_match['face_id']]
                    confidence = best_match['confidence']
                    
                    # Use face-specific threshold or global threshold
                    threshold = face_data.get('confidence_threshold', self.confidence_threshold)
                    
                    if confidence >= threshold:
                        # Recognized face
                        detection.update({
                            'is_match': True,
                            'person_name': face_data['person_name'],
                            'person_type': face_data['person_type'],
                            'confidence': confidence,
                            'face_id': face_data['face_id'],
                            'access_level': face_data['access_level']
                        })
                        
                        # Determine if alert is needed
                        detection['alert_recommended'] = self.should_generate_alert(face_data, detection)
                        
                        self.detection_stats['known_faces'] += 1
                        logger.debug(f"✅ Recognized: {face_data['person_name']} ({confidence:.2f})")
                    else:
                        # Below threshold - treat as unknown
                        detection['alert_recommended'] = True
                        self.detection_stats['unknown_faces'] += 1
                        logger.debug(f"❓ Unknown face (best match: {confidence:.2f} < {threshold:.2f})")
                else:
                    # No match found
                    detection['alert_recommended'] = True
                    self.detection_stats['unknown_faces'] += 1
                    logger.debug("❓ No face match found")
            else:
                # No known faces loaded - treat as unknown
                detection['alert_recommended'] = True
                self.detection_stats['unknown_faces'] += 1
            
            # Store detection in database
            detection_id = self.save_face_detection(detection)
            detection['detection_id'] = detection_id
            
            return detection
            
        except Exception as e:
            logger.error(f"❌ Face recognition error: {e}")
            return None
    
    def find_best_match(self, face_encoding: np.ndarray, known_faces: Dict) -> Optional[Dict]:
        """
        Find best matching face from known faces database
        
        Args:
            face_encoding: Face encoding to match
            known_faces: Dictionary of known face data
            
        Returns:
            Best match information or None
        """
        if not known_faces:
            return None
        
        try:
            # Extract all known face encodings
            known_encodings = [face_data['face_encoding'] for face_data in known_faces.values()]
            face_ids = list(known_faces.keys())
            
            # Calculate face distances
            face_distances = face_recognition.face_distance(known_encodings, face_encoding)
            
            # Find the best match
            best_match_index = np.argmin(face_distances)
            best_distance = face_distances[best_match_index]
            
            # Convert distance to confidence score (lower distance = higher confidence)
            confidence = 1.0 - best_distance
            
            return {
                'face_id': face_ids[best_match_index],
                'confidence': confidence,
                'distance': best_distance
            }
            
        except Exception as e:
            logger.error(f"❌ Face matching error: {e}")
            return None
    
    def should_generate_alert(self, face_data: Dict, detection: Dict) -> bool:
        """
        Determine if an alert should be generated for this detection
        
        Args:
            face_data: Known face information
            detection: Current detection data
            
        Returns:
            True if alert should be generated
        """
        person_type = face_data.get('person_type', 'unknown')
        
        # Always alert for blacklisted individuals
        if person_type == 'blacklist':
            return True
        
        # Alert for VIP individuals (for security awareness)
        if person_type == 'vip':
            return True
        
        # Alert if access level is restricted
        if face_data.get('access_level') == 'restricted':
            return True
        
        # Check time-based access rules (can be expanded)
        current_hour = datetime.now().hour
        if person_type in ['visitor', 'contractor'] and (current_hour < 7 or current_hour > 22):
            return True
        
        # No alert needed for normal authorized individuals
        return False
    
    def convert_to_normalized_bbox(self, face_location: Tuple, frame_shape: Tuple) -> Dict:
        """
        Convert face location to normalized bounding box
        
        Args:
            face_location: (top, right, bottom, left) in pixels
            frame_shape: (height, width, channels)
            
        Returns:
            Normalized bounding box dictionary
        """
        top, right, bottom, left = face_location
        height, width = frame_shape[:2]
        
        return {
            'x': left / width,
            'y': top / height,
            'width': (right - left) / width,
            'height': (bottom - top) / height
        }
    
    def save_face_detection(self, detection: Dict) -> Optional[int]:
        """
        Save face detection to database
        
        Args:
            detection: Face detection data
            
        Returns:
            Detection ID or None if failed
        """
        try:
            with self.get_db_connection() as conn:
                cursor = conn.cursor()
                
                insert_query = """
                    INSERT INTO face_detections (
                        camera_id, face_id, person_name, person_type, confidence,
                        is_match, bounding_box, face_quality_score, timestamp
                    ) VALUES (
                        %(camera_id)s, %(face_id)s, %(person_name)s, %(person_type)s, %(confidence)s,
                        %(is_match)s, %(bounding_box)s, %(face_quality_score)s, %(timestamp)s
                    ) RETURNING detection_id
                """
                
                cursor.execute(insert_query, {
                    'camera_id': detection['camera_id'],
                    'face_id': detection.get('face_id'),
                    'person_name': detection['person_name'],
                    'person_type': detection['person_type'],
                    'confidence': detection['confidence'],
                    'is_match': detection['is_match'],
                    'bounding_box': json.dumps(detection['bounding_box']),
                    'face_quality_score': detection['face_quality_score'],
                    'timestamp': detection['timestamp']
                })
                
                detection_id = cursor.fetchone()['detection_id']
                conn.commit()
                
                # Update face profile last_seen and detection count
                if detection['face_id']:
                    self.update_face_profile_stats(detection['face_id'])
                
                return detection_id
                
        except Exception as e:
            logger.error(f"❌ Failed to save face detection: {e}")
            return None
    
    def update_face_profile_stats(self, face_id: int):
        """
        Update face profile statistics
        
        Args:
            face_id: Face profile ID to update
        """
        try:
            with self.get_db_connection() as conn:
                cursor = conn.cursor()
                
                update_query = """
                    UPDATE face_profiles 
                    SET last_seen = CURRENT_TIMESTAMP,
                        total_detections = total_detections + 1,
                        updated_at = CURRENT_TIMESTAMP
                    WHERE face_id = %s
                """
                
                cursor.execute(update_query, (face_id,))
                conn.commit()
                
        except Exception as e:
            logger.error(f"❌ Failed to update face profile stats: {e}")
    
    def enroll_face_from_image(self, image_path: str, person_name: str, 
                              person_type: str, property_id: int = None, 
                              added_by: int = None) -> Optional[int]:
        """
        Enroll a new face from image file
        
        Args:
            image_path: Path to image file
            person_name: Name of the person
            person_type: Type of person (resident, staff, etc.)
            property_id: Property ID
            added_by: User ID who added the face
            
        Returns:
            Face ID if successful, None if failed
        """
        try:
            # Load and process image
            image = face_recognition.load_image_file(image_path)
            
            # Detect faces in image
            face_locations = face_recognition.face_locations(image)
            
            if not face_locations:
                logger.warning(f"⚠️ No faces found in image: {image_path}")
                return None
            
            if len(face_locations) > 1:
                logger.warning(f"⚠️ Multiple faces found in image: {image_path} - using first face")
            
            # Use first detected face
            face_location = face_locations[0]
            
            # Calculate face quality
            quality_score = self.calculate_face_quality(image, face_location)
            
            if quality_score < 0.6:
                logger.warning(f"⚠️ Low quality face in image: {image_path} (quality: {quality_score:.2f})")
                return None
            
            # Generate face encoding
            face_encodings = face_recognition.face_encodings(image, [face_location])
            
            if not face_encodings:
                logger.error(f"❌ Failed to generate face encoding for: {image_path}")
                return None
            
            face_encoding = face_encodings[0]
            
            # Convert encoding to bytes for storage
            encoding_bytes = face_encoding.tobytes()
            
            # Generate image hash for duplicate detection
            image_hash = hashlib.md5(encoding_bytes).hexdigest()
            
            # Store face profile in database
            with self.get_db_connection() as conn:
                cursor = conn.cursor()
                
                # Check for duplicates
                duplicate_query = "SELECT face_id FROM face_profiles WHERE face_image_hash = %s"
                cursor.execute(duplicate_query, (image_hash,))
                
                if cursor.fetchone():
                    logger.warning(f"⚠️ Duplicate face detected for: {person_name}")
                    return None
                
                # Insert new face profile
                insert_query = """
                    INSERT INTO face_profiles (
                        person_name, person_type, face_encoding, property_id,
                        added_by, face_image_path, face_image_hash, 
                        status, verified
                    ) VALUES (
                        %s, %s, %s, %s, %s, %s, %s, 'active', false
                    ) RETURNING face_id
                """
                
                cursor.execute(insert_query, (
                    person_name, person_type, encoding_bytes, property_id,
                    added_by, image_path, image_hash
                ))
                
                face_id = cursor.fetchone()['face_id']
                conn.commit()
                
                # Force cache refresh
                self.load_known_faces(force_refresh=True)
                
                logger.info(f"✅ Face enrolled successfully: {person_name} (ID: {face_id})")
                return face_id
                
        except Exception as e:
            logger.error(f"❌ Face enrollment failed for {person_name}: {e}")
            return None
    
    def get_performance_stats(self) -> Dict:
        """
        Get face recognition performance statistics
        
        Returns:
            Performance statistics dictionary
        """
        processing_times = self.detection_stats['processing_times']
        
        return {
            'total_detections': self.detection_stats['total_detections'],
            'known_faces_detected': self.detection_stats['known_faces'],
            'unknown_faces_detected': self.detection_stats['unknown_faces'],
            'known_faces_in_db': len(self.known_faces_cache),
            'avg_processing_time_ms': np.mean(processing_times) if processing_times else 0,
            'max_processing_time_ms': np.max(processing_times) if processing_times else 0,
            'cache_last_updated': self.last_cache_update,
            'recognition_accuracy': (
                self.detection_stats['known_faces'] / max(self.detection_stats['total_detections'], 1)
            ) * 100
        }
    
    def cleanup_old_detections(self, days_to_keep: int = 30):
        """
        Clean up old face detection records
        
        Args:
            days_to_keep: Number of days of records to keep
        """
        try:
            with self.get_db_connection() as conn:
                cursor = conn.cursor()
                
                cleanup_query = """
                    DELETE FROM face_detections 
                    WHERE timestamp < NOW() - INTERVAL '%s days'
                """
                
                cursor.execute(cleanup_query, (days_to_keep,))
                deleted_count = cursor.rowcount
                conn.commit()
                
                logger.info(f"🧹 Cleaned up {deleted_count} old face detection records")
                
        except Exception as e:
            logger.error(f"❌ Cleanup failed: {e}")


# Utility functions for integration
def create_face_recognition_engine(db_config: Dict) -> FaceRecognitionEngine:
    """
    Factory function to create face recognition engine
    
    Args:
        db_config: Database configuration
        
    Returns:
        Configured FaceRecognitionEngine instance
    """
    return FaceRecognitionEngine(db_config)


if __name__ == "__main__":
    # Test configuration
    test_db_config = {
        'host': 'localhost',
        'database': 'apex',
        'user': 'swanadmin',
        'password': 'your_password',
        'port': 5432
    }
    
    # Create engine
    engine = FaceRecognitionEngine(test_db_config)
    
    # Load known faces
    known_faces = engine.load_known_faces()
    print(f"✅ Loaded {len(known_faces)} known faces")
    
    # Display performance stats
    stats = engine.get_performance_stats()
    print(f"📊 Performance Stats: {stats}")
