"""
APEX AI THREAT CORRELATION ENGINE - MULTI-MONITOR COORDINATION
==============================================================
Advanced threat correlation algorithms for cross-monitor threat tracking
Enables seamless threat following across multiple camera feeds and monitors

Key Features:
- AI-powered threat similarity analysis and matching
- Cross-monitor threat identity persistence
- Correlation confidence scoring and validation
- Real-time threat handoff coordination
- Performance optimized for <500ms handoff latency

TIER 2 Integration: Designed to work seamlessly with Tier2AlertCoordinator
"""

import asyncio
import logging
import time
import uuid
from typing import Dict, List, Optional, Tuple, Any, Set
from datetime import datetime, timedelta
from dataclasses import dataclass, asdict
from enum import Enum
import json
import math

logger = logging.getLogger(__name__)

class ThreatCorrelationStatus(Enum):
    """Status enum for threat correlation states"""
    PENDING = "pending"
    ACTIVE = "active"
    HANDOFF_IN_PROGRESS = "handoff_in_progress"
    COMPLETED = "completed"
    EXPIRED = "expired"
    FAILED = "failed"

class CorrelationConfidence(Enum):
    """Confidence levels for threat correlations"""
    LOW = 0.3
    MEDIUM = 0.6
    HIGH = 0.8
    VERY_HIGH = 0.95

@dataclass
class ThreatProfile:
    """Comprehensive threat profile for correlation analysis"""
    threat_id: str
    original_detection_id: str
    monitor_id: str
    zone_id: str
    threat_type: str
    threat_level: str
    confidence: float
    bbox: Tuple[int, int, int, int]  # x, y, width, height
    timestamp: datetime
    features: Dict[str, Any]  # AI feature vectors, colors, shapes, etc.
    movement_vector: Optional[Tuple[float, float]] = None  # velocity x, y
    last_seen: Optional[datetime] = None
    correlation_metadata: Dict[str, Any] = None
    
    def __post_init__(self):
        if self.correlation_metadata is None:
            self.correlation_metadata = {}
        if self.last_seen is None:
            self.last_seen = self.timestamp

@dataclass
class MonitorRelationship:
    """Defines spatial and logical relationships between monitors"""
    monitor_a: str
    monitor_b: str
    spatial_relationship: str  # 'adjacent', 'overlapping', 'sequential'
    transition_zones: List[Dict[str, Any]]  # Zones where handoffs typically occur
    average_handoff_time: float  # Historical average handoff time in seconds
    confidence_multiplier: float  # Boost correlation confidence for related monitors

@dataclass
class ThreatCorrelation:
    """Represents a correlation between threats across monitors"""
    correlation_id: str
    primary_threat: ThreatProfile
    correlated_threats: List[ThreatProfile]
    confidence_score: float
    correlation_status: ThreatCorrelationStatus
    created_at: datetime
    last_updated: datetime
    handoff_history: List[Dict[str, Any]]
    correlation_factors: Dict[str, float]  # What contributed to correlation score
    expected_monitors: Set[str]  # Monitors where this threat might appear next

class ThreatCorrelationEngine:
    """
    Advanced AI-powered threat correlation engine for multi-monitor coordination
    
    Provides intelligent threat tracking across multiple monitors with sophisticated
    correlation algorithms and real-time handoff coordination.
    """
    
    def __init__(self, config: Dict[str, Any] = None):
        """
        Initialize the threat correlation engine
        
        Args:
            config: Configuration dictionary for correlation parameters
        """
        self.config = config or {}
        
        # Core correlation settings
        self.min_correlation_confidence = self.config.get('min_correlation_confidence', 0.6)
        self.max_threat_age = self.config.get('max_threat_age_seconds', 300)  # 5 minutes
        self.handoff_timeout = self.config.get('handoff_timeout_seconds', 10)
        self.max_active_correlations = self.config.get('max_active_correlations', 100)
        
        # Feature analysis weights
        self.correlation_weights = {
            'spatial_proximity': self.config.get('weight_spatial', 0.3),
            'temporal_proximity': self.config.get('weight_temporal', 0.25),
            'threat_type_match': self.config.get('weight_threat_type', 0.2),
            'feature_similarity': self.config.get('weight_features', 0.15),
            'movement_prediction': self.config.get('weight_movement', 0.1)
        }
        
        # Active correlations and threat registry
        self.active_correlations: Dict[str, ThreatCorrelation] = {}
        self.threat_registry: Dict[str, ThreatProfile] = {}
        self.monitor_relationships: Dict[str, MonitorRelationship] = {}
        
        # Performance monitoring
        self.correlation_stats = {
            'total_correlations_attempted': 0,
            'successful_correlations': 0,
            'successful_handoffs': 0,
            'failed_handoffs': 0,
            'average_correlation_time': 0.0,
            'average_handoff_latency': 0.0
        }
        
        # Background cleanup task
        self._cleanup_task = None
        
        logger.info("🔗 Threat Correlation Engine initialized")
    
    async def start_correlation_engine(self):
        """Start the correlation engine background tasks"""
        if self._cleanup_task is None:
            self._cleanup_task = asyncio.create_task(self._cleanup_expired_correlations())
            logger.info("✅ Correlation engine background tasks started")
    
    async def stop_correlation_engine(self):
        """Stop the correlation engine and cleanup tasks"""
        if self._cleanup_task:
            self._cleanup_task.cancel()
            try:
                await self._cleanup_task
            except asyncio.CancelledError:
                pass
            self._cleanup_task = None
        logger.info("🛑 Correlation engine stopped")
    
    def register_monitor_relationship(self, monitor_a: str, monitor_b: str,
                                    spatial_relationship: str = 'adjacent',
                                    transition_zones: List[Dict[str, Any]] = None,
                                    confidence_multiplier: float = 1.2):
        """
        Register spatial and logical relationships between monitors
        
        Args:
            monitor_a: First monitor ID
            monitor_b: Second monitor ID  
            spatial_relationship: Type of relationship ('adjacent', 'overlapping', 'sequential')
            transition_zones: Zones where handoffs typically occur
            confidence_multiplier: Boost factor for correlations between these monitors
        """
        relationship_key = f"{monitor_a}-{monitor_b}"
        
        self.monitor_relationships[relationship_key] = MonitorRelationship(
            monitor_a=monitor_a,
            monitor_b=monitor_b,
            spatial_relationship=spatial_relationship,
            transition_zones=transition_zones or [],
            average_handoff_time=2.0,  # Default 2 seconds
            confidence_multiplier=confidence_multiplier
        )
        
        # Also register reverse relationship
        reverse_key = f"{monitor_b}-{monitor_a}"
        self.monitor_relationships[reverse_key] = MonitorRelationship(
            monitor_a=monitor_b,
            monitor_b=monitor_a,
            spatial_relationship=spatial_relationship,
            transition_zones=transition_zones or [],
            average_handoff_time=2.0,
            confidence_multiplier=confidence_multiplier
        )
        
        logger.info(f"📍 Registered monitor relationship: {monitor_a} ↔ {monitor_b} ({spatial_relationship})")
    
    async def analyze_threat_for_correlation(self, threat_data: Dict[str, Any]) -> Optional[ThreatCorrelation]:
        """
        Analyze a new threat detection for potential correlations with existing threats
        
        Args:
            threat_data: Comprehensive threat detection data
            
        Returns:
            ThreatCorrelation if correlation found, None otherwise
        """
        start_time = time.time()
        self.correlation_stats['total_correlations_attempted'] += 1
        
        try:
            # Create threat profile from detection data
            threat_profile = self._create_threat_profile(threat_data)
            
            # Store threat in registry
            self.threat_registry[threat_profile.threat_id] = threat_profile
            
            # Find potential correlations
            correlation_candidates = await self._find_correlation_candidates(threat_profile)
            
            if not correlation_candidates:
                logger.debug(f"🔍 No correlation candidates found for threat {threat_profile.threat_id}")
                return None
            
            # Analyze correlations and select best match
            best_correlation = await self._analyze_correlation_candidates(
                threat_profile, correlation_candidates
            )
            
            if best_correlation and best_correlation.confidence_score >= self.min_correlation_confidence:
                # Create or update correlation
                correlation = await self._create_or_update_correlation(threat_profile, best_correlation)
                
                # Update performance stats
                processing_time = time.time() - start_time
                self._update_correlation_stats(processing_time, success=True)
                
                logger.info(f"✅ Threat correlation established: {correlation.correlation_id} "
                          f"(confidence: {correlation.confidence_score:.2f})")
                
                return correlation
            else:
                logger.debug(f"🔍 Correlation confidence too low for threat {threat_profile.threat_id}")
                return None
                
        except Exception as e:
            logger.error(f"❌ Threat correlation analysis failed: {e}")
            processing_time = time.time() - start_time
            self._update_correlation_stats(processing_time, success=False)
            return None
    
    def _create_threat_profile(self, threat_data: Dict[str, Any]) -> ThreatProfile:
        """Create a comprehensive threat profile from detection data"""
        
        # Generate unique threat ID if not provided
        threat_id = threat_data.get('threat_id', f"threat_{int(time.time() * 1000)}_{uuid.uuid4().hex[:8]}")
        
        # Extract core threat information
        monitor_id = threat_data.get('monitor_id', 'unknown')
        zone_id = threat_data.get('zone_id', 'unknown')
        threat_type = threat_data.get('threat_type', 'unknown')
        threat_level = threat_data.get('threat_level', 'MEDIUM')
        confidence = threat_data.get('confidence', 0.75)
        bbox = threat_data.get('bbox', (0, 0, 100, 100))
        
        # Extract or generate AI features for correlation
        features = self._extract_threat_features(threat_data)
        
        # Calculate movement vector if possible
        movement_vector = self._calculate_movement_vector(threat_data)
        
        return ThreatProfile(
            threat_id=threat_id,
            original_detection_id=threat_data.get('detection_id', threat_id),
            monitor_id=monitor_id,
            zone_id=zone_id,
            threat_type=threat_type,
            threat_level=threat_level,
            confidence=confidence,
            bbox=bbox,
            timestamp=datetime.now(),
            features=features,
            movement_vector=movement_vector,
            correlation_metadata={
                'raw_detection_data': threat_data,
                'feature_extraction_method': 'enhanced_ai_v2',
                'correlation_eligible': True
            }
        )
    
    def _extract_threat_features(self, threat_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Extract AI features for correlation analysis
        
        This would typically use advanced computer vision features, but for now
        we'll use available detection data to create correlation features.
        """
        features = {}
        
        # Bounding box features
        bbox = threat_data.get('bbox', (0, 0, 100, 100))
        features['bbox_area'] = bbox[2] * bbox[3]  # width * height
        features['bbox_aspect_ratio'] = bbox[2] / max(bbox[3], 1)  # width / height
        features['bbox_center'] = (bbox[0] + bbox[2]/2, bbox[1] + bbox[3]/2)
        
        # Threat characteristics
        features['threat_type'] = threat_data.get('threat_type', 'unknown')
        features['threat_level'] = threat_data.get('threat_level', 'MEDIUM')
        features['confidence'] = threat_data.get('confidence', 0.75)
        
        # AI model features (if available)
        if 'ai_features' in threat_data:
            features.update(threat_data['ai_features'])
        
        # Color/appearance features (simulated for now)
        features['dominant_colors'] = threat_data.get('dominant_colors', ['unknown'])
        features['texture_features'] = threat_data.get('texture_features', {})
        
        # Behavioral features
        features['movement_speed'] = threat_data.get('movement_speed', 0.0)
        features['direction'] = threat_data.get('direction', 0.0)
        features['loitering_time'] = threat_data.get('loitering_time', 0.0)
        
        return features
    
    def _calculate_movement_vector(self, threat_data: Dict[str, Any]) -> Optional[Tuple[float, float]]:
        """Calculate movement vector from threat data"""
        try:
            if 'movement_vector' in threat_data:
                return threat_data['movement_vector']
            
            # Try to calculate from velocity components
            velocity_x = threat_data.get('velocity_x', 0.0)
            velocity_y = threat_data.get('velocity_y', 0.0)
            
            if velocity_x != 0.0 or velocity_y != 0.0:
                return (velocity_x, velocity_y)
            
            # Try to calculate from direction and speed
            direction = threat_data.get('direction')
            speed = threat_data.get('movement_speed', 0.0)
            
            if direction is not None and speed > 0:
                # Convert direction (degrees) to vector components
                direction_rad = math.radians(direction)
                velocity_x = speed * math.cos(direction_rad)
                velocity_y = speed * math.sin(direction_rad)
                return (velocity_x, velocity_y)
            
            return None
        except Exception:
            return None
    
    async def _find_correlation_candidates(self, threat_profile: ThreatProfile) -> List[ThreatProfile]:
        """Find potential correlation candidates from active threats"""
        candidates = []
        current_time = datetime.now()
        
        # Look through active correlations and recent threats
        for correlation in self.active_correlations.values():
            if correlation.correlation_status in [ThreatCorrelationStatus.ACTIVE, 
                                                 ThreatCorrelationStatus.HANDOFF_IN_PROGRESS]:
                # Check if this could be a continuation of an existing correlation
                time_diff = (current_time - correlation.last_updated).total_seconds()
                
                # Only consider recent correlations
                if time_diff <= self.handoff_timeout:
                    # Check if monitors are related
                    if self._are_monitors_related(threat_profile.monitor_id, 
                                                correlation.primary_threat.monitor_id):
                        candidates.append(correlation.primary_threat)
                        candidates.extend(correlation.correlated_threats)
        
        # Also check recent threats in registry
        for existing_threat in self.threat_registry.values():
            if existing_threat.threat_id == threat_profile.threat_id:
                continue  # Skip self
                
            time_diff = (current_time - existing_threat.last_seen).total_seconds()
            
            # Only consider recent threats
            if time_diff <= self.handoff_timeout:
                # Check if monitors are related
                if self._are_monitors_related(threat_profile.monitor_id, existing_threat.monitor_id):
                    candidates.append(existing_threat)
        
        logger.debug(f"🔍 Found {len(candidates)} correlation candidates for {threat_profile.threat_id}")
        return candidates
    
    def _are_monitors_related(self, monitor_a: str, monitor_b: str) -> bool:
        """Check if two monitors have a defined relationship"""
        if monitor_a == monitor_b:
            return False  # Same monitor, not a correlation
        
        relationship_key = f"{monitor_a}-{monitor_b}"
        return relationship_key in self.monitor_relationships
    
    async def _analyze_correlation_candidates(self, threat_profile: ThreatProfile, 
                                            candidates: List[ThreatProfile]) -> Optional[Dict[str, Any]]:
        """Analyze correlation candidates and return best match"""
        best_match = None
        best_score = 0.0
        
        for candidate in candidates:
            correlation_score = await self._calculate_correlation_score(threat_profile, candidate)
            
            if correlation_score > best_score:
                best_score = correlation_score
                best_match = {
                    'candidate': candidate,
                    'confidence_score': correlation_score,
                    'correlation_factors': self._get_correlation_factors(threat_profile, candidate)
                }
        
        return best_match
    
    async def _calculate_correlation_score(self, threat_a: ThreatProfile, 
                                         threat_b: ThreatProfile) -> float:
        """
        Calculate correlation confidence score between two threats
        
        Uses multiple factors weighted according to correlation_weights configuration
        """
        try:
            scores = {}
            
            # 1. Spatial Proximity Score
            scores['spatial_proximity'] = self._calculate_spatial_proximity_score(threat_a, threat_b)
            
            # 2. Temporal Proximity Score  
            scores['temporal_proximity'] = self._calculate_temporal_proximity_score(threat_a, threat_b)
            
            # 3. Threat Type Match Score
            scores['threat_type_match'] = self._calculate_threat_type_match_score(threat_a, threat_b)
            
            # 4. Feature Similarity Score
            scores['feature_similarity'] = self._calculate_feature_similarity_score(threat_a, threat_b)
            
            # 5. Movement Prediction Score
            scores['movement_prediction'] = self._calculate_movement_prediction_score(threat_a, threat_b)
            
            # Calculate weighted final score
            final_score = 0.0
            for factor, score in scores.items():
                weight = self.correlation_weights.get(factor, 0.0)
                final_score += score * weight
            
            # Apply monitor relationship bonus
            relationship_bonus = self._get_monitor_relationship_bonus(threat_a.monitor_id, threat_b.monitor_id)
            final_score *= relationship_bonus
            
            # Ensure score is within [0, 1] range
            final_score = max(0.0, min(1.0, final_score))
            
            logger.debug(f"🔢 Correlation score: {final_score:.3f} for {threat_a.threat_id} ↔ {threat_b.threat_id}")
            
            return final_score
            
        except Exception as e:
            logger.error(f"❌ Correlation score calculation failed: {e}")
            return 0.0
    
    def _calculate_spatial_proximity_score(self, threat_a: ThreatProfile, threat_b: ThreatProfile) -> float:
        """Calculate spatial proximity score based on expected movement between monitors"""
        try:
            # For different monitors, check if they're spatially related
            if threat_a.monitor_id != threat_b.monitor_id:
                relationship_key = f"{threat_a.monitor_id}-{threat_b.monitor_id}"
                if relationship_key in self.monitor_relationships:
                    relationship = self.monitor_relationships[relationship_key]
                    
                    # Higher score for adjacent/overlapping monitors
                    if relationship.spatial_relationship == 'overlapping':
                        return 0.9
                    elif relationship.spatial_relationship == 'adjacent':
                        return 0.8
                    elif relationship.spatial_relationship == 'sequential':
                        return 0.7
                    else:
                        return 0.5
                else:
                    return 0.3  # Unknown relationship, lower score
            else:
                # Same monitor - check if positions make sense for correlation
                bbox_a = threat_a.bbox
                bbox_b = threat_b.bbox
                
                # Calculate distance between centers
                center_a = (bbox_a[0] + bbox_a[2]/2, bbox_a[1] + bbox_a[3]/2)
                center_b = (bbox_b[0] + bbox_b[2]/2, bbox_b[1] + bbox_b[3]/2)
                
                distance = math.sqrt((center_a[0] - center_b[0])**2 + (center_a[1] - center_b[1])**2)
                
                # Normalize distance score (closer = higher score)
                max_distance = 1000  # Max reasonable distance for correlation
                normalized_distance = min(distance / max_distance, 1.0)
                return 1.0 - normalized_distance
        except Exception:
            return 0.0
    
    def _calculate_temporal_proximity_score(self, threat_a: ThreatProfile, threat_b: ThreatProfile) -> float:
        """Calculate temporal proximity score"""
        try:
            time_diff = abs((threat_a.timestamp - threat_b.timestamp).total_seconds())
            
            # Higher score for closer timestamps
            if time_diff <= 2.0:  # Within 2 seconds
                return 1.0
            elif time_diff <= 5.0:  # Within 5 seconds
                return 0.8
            elif time_diff <= 10.0:  # Within 10 seconds
                return 0.6
            else:
                # Exponential decay for longer times
                return max(0.0, 0.6 * math.exp(-time_diff / 10.0))
        except Exception:
            return 0.0
    
    def _calculate_threat_type_match_score(self, threat_a: ThreatProfile, threat_b: ThreatProfile) -> float:
        """Calculate threat type match score"""
        if threat_a.threat_type == threat_b.threat_type:
            return 1.0
        
        # Partial matches for related threat types
        type_similarities = {
            ('person', 'trespassing'): 0.8,
            ('vehicle', 'unauthorized_vehicle'): 0.9,
            ('weapon', 'violence'): 0.7,
            ('package', 'package_theft'): 0.9,
        }
        
        for (type1, type2), similarity in type_similarities.items():
            if (threat_a.threat_type == type1 and threat_b.threat_type == type2) or \
               (threat_a.threat_type == type2 and threat_b.threat_type == type1):
                return similarity
        
        return 0.0
    
    def _calculate_feature_similarity_score(self, threat_a: ThreatProfile, threat_b: ThreatProfile) -> float:
        """Calculate feature similarity score using available features"""
        try:
            similarities = []
            
            # Compare bounding box characteristics
            area_a = threat_a.features.get('bbox_area', 0)
            area_b = threat_b.features.get('bbox_area', 0)
            if area_a > 0 and area_b > 0:
                area_similarity = 1.0 - abs(area_a - area_b) / max(area_a, area_b)
                similarities.append(area_similarity)
            
            # Compare aspect ratios
            aspect_a = threat_a.features.get('bbox_aspect_ratio', 1.0)
            aspect_b = threat_b.features.get('bbox_aspect_ratio', 1.0)
            aspect_similarity = 1.0 - abs(aspect_a - aspect_b) / max(aspect_a, aspect_b)
            similarities.append(aspect_similarity)
            
            # Compare confidence levels
            conf_similarity = 1.0 - abs(threat_a.confidence - threat_b.confidence)
            similarities.append(conf_similarity)
            
            # Return average similarity if we have comparisons
            if similarities:
                return sum(similarities) / len(similarities)
            
            return 0.5  # Default neutral score
        except Exception:
            return 0.0
    
    def _calculate_movement_prediction_score(self, threat_a: ThreatProfile, threat_b: ThreatProfile) -> float:
        """Calculate movement prediction score based on expected trajectory"""
        try:
            # If we have movement vectors, predict if they align
            if threat_a.movement_vector and threat_b.movement_vector:
                vec_a = threat_a.movement_vector
                vec_b = threat_b.movement_vector
                
                # Calculate vector similarity (dot product normalized)
                dot_product = vec_a[0] * vec_b[0] + vec_a[1] * vec_b[1]
                magnitude_a = math.sqrt(vec_a[0]**2 + vec_a[1]**2)
                magnitude_b = math.sqrt(vec_b[0]**2 + vec_b[1]**2)
                
                if magnitude_a > 0 and magnitude_b > 0:
                    cosine_similarity = dot_product / (magnitude_a * magnitude_b)
                    # Convert to 0-1 score (1 = same direction, 0 = opposite)
                    return (cosine_similarity + 1) / 2
            
            # If no movement data, use neutral score
            return 0.5
        except Exception:
            return 0.0
    
    def _get_monitor_relationship_bonus(self, monitor_a: str, monitor_b: str) -> float:
        """Get relationship bonus multiplier for monitor pair"""
        if monitor_a == monitor_b:
            return 1.0  # No bonus for same monitor
        
        relationship_key = f"{monitor_a}-{monitor_b}"
        if relationship_key in self.monitor_relationships:
            return self.monitor_relationships[relationship_key].confidence_multiplier
        
        return 1.0  # No bonus for unknown relationships
    
    def _get_correlation_factors(self, threat_a: ThreatProfile, threat_b: ThreatProfile) -> Dict[str, float]:
        """Get detailed breakdown of correlation factors"""
        return {
            'spatial_proximity': self._calculate_spatial_proximity_score(threat_a, threat_b),
            'temporal_proximity': self._calculate_temporal_proximity_score(threat_a, threat_b),
            'threat_type_match': self._calculate_threat_type_match_score(threat_a, threat_b),
            'feature_similarity': self._calculate_feature_similarity_score(threat_a, threat_b),
            'movement_prediction': self._calculate_movement_prediction_score(threat_a, threat_b),
            'monitor_relationship_bonus': self._get_monitor_relationship_bonus(threat_a.monitor_id, threat_b.monitor_id)
        }
    
    async def _create_or_update_correlation(self, new_threat: ThreatProfile, 
                                          correlation_match: Dict[str, Any]) -> ThreatCorrelation:
        """Create a new correlation or update existing one"""
        candidate = correlation_match['candidate']
        confidence_score = correlation_match['confidence_score']
        correlation_factors = correlation_match['correlation_factors']
        
        # Check if candidate is already part of an active correlation
        existing_correlation = None
        for correlation in self.active_correlations.values():
            if (candidate.threat_id == correlation.primary_threat.threat_id or
                any(t.threat_id == candidate.threat_id for t in correlation.correlated_threats)):
                existing_correlation = correlation
                break
        
        current_time = datetime.now()
        
        if existing_correlation:
            # Update existing correlation
            existing_correlation.correlated_threats.append(new_threat)
            existing_correlation.confidence_score = max(existing_correlation.confidence_score, confidence_score)
            existing_correlation.last_updated = current_time
            existing_correlation.correlation_status = ThreatCorrelationStatus.HANDOFF_IN_PROGRESS
            
            # Add handoff record
            handoff_record = {
                'from_monitor': candidate.monitor_id,
                'to_monitor': new_threat.monitor_id,
                'handoff_time': current_time.isoformat(),
                'confidence': confidence_score,
                'factors': correlation_factors
            }
            existing_correlation.handoff_history.append(handoff_record)
            
            # Update expected monitors
            existing_correlation.expected_monitors.add(new_threat.monitor_id)
            
            logger.info(f"🔄 Updated correlation {existing_correlation.correlation_id} with new threat {new_threat.threat_id}")
            
            return existing_correlation
        else:
            # Create new correlation
            correlation_id = f"corr_{int(time.time() * 1000)}_{uuid.uuid4().hex[:8]}"
            
            # Predict expected monitors based on relationships
            expected_monitors = {new_threat.monitor_id, candidate.monitor_id}
            for monitor_id, relationship in self.monitor_relationships.items():
                if (relationship.monitor_a == new_threat.monitor_id or 
                    relationship.monitor_b == new_threat.monitor_id):
                    expected_monitors.add(relationship.monitor_a)
                    expected_monitors.add(relationship.monitor_b)
            
            correlation = ThreatCorrelation(
                correlation_id=correlation_id,
                primary_threat=candidate,  # Original threat
                correlated_threats=[new_threat],  # New correlated threat
                confidence_score=confidence_score,
                correlation_status=ThreatCorrelationStatus.ACTIVE,
                created_at=current_time,
                last_updated=current_time,
                handoff_history=[{
                    'from_monitor': candidate.monitor_id,
                    'to_monitor': new_threat.monitor_id,
                    'handoff_time': current_time.isoformat(),
                    'confidence': confidence_score,
                    'factors': correlation_factors
                }],
                correlation_factors=correlation_factors,
                expected_monitors=expected_monitors
            )
            
            # Store in active correlations
            self.active_correlations[correlation_id] = correlation
            
            # Update stats
            self.correlation_stats['successful_correlations'] += 1
            
            logger.info(f"✅ Created new correlation {correlation_id} between {candidate.threat_id} and {new_threat.threat_id}")
            
            return correlation
    
    async def _cleanup_expired_correlations(self):
        """Background task to cleanup expired correlations"""
        while True:
            try:
                current_time = datetime.now()
                expired_correlations = []
                
                for correlation_id, correlation in self.active_correlations.items():
                    # Check if correlation has expired
                    time_since_update = (current_time - correlation.last_updated).total_seconds()
                    
                    if time_since_update > self.max_threat_age:
                        correlation.correlation_status = ThreatCorrelationStatus.EXPIRED
                        expired_correlations.append(correlation_id)
                
                # Remove expired correlations
                for correlation_id in expired_correlations:
                    del self.active_correlations[correlation_id]
                    logger.debug(f"🧹 Cleaned up expired correlation {correlation_id}")
                
                # Also cleanup old threats from registry
                expired_threats = []
                for threat_id, threat in self.threat_registry.items():
                    time_since_seen = (current_time - threat.last_seen).total_seconds()
                    if time_since_seen > self.max_threat_age:
                        expired_threats.append(threat_id)
                
                for threat_id in expired_threats:
                    del self.threat_registry[threat_id]
                
                if expired_correlations or expired_threats:
                    logger.debug(f"🧹 Cleanup: removed {len(expired_correlations)} correlations, {len(expired_threats)} threats")
                
                # Sleep for cleanup interval
                await asyncio.sleep(60)  # Run cleanup every minute
                
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"❌ Correlation cleanup error: {e}")
                await asyncio.sleep(60)
    
    def _update_correlation_stats(self, processing_time: float, success: bool):
        """Update correlation performance statistics"""
        total_attempts = self.correlation_stats['total_correlations_attempted']
        current_avg = self.correlation_stats['average_correlation_time']
        
        # Update rolling average
        new_avg = ((current_avg * (total_attempts - 1)) + processing_time) / total_attempts
        self.correlation_stats['average_correlation_time'] = new_avg
        
        if success:
            self.correlation_stats['successful_correlations'] += 1
    
    async def initiate_threat_handoff(self, correlation_id: str, from_monitor: str, 
                                    to_monitor: str) -> Dict[str, Any]:
        """
        Initiate threat handoff between monitors
        
        Args:
            correlation_id: ID of the correlation being handed off
            from_monitor: Source monitor ID
            to_monitor: Target monitor ID
            
        Returns:
            Handoff result dictionary
        """
        start_time = time.time()
        
        try:
            if correlation_id not in self.active_correlations:
                return {
                    'success': False,
                    'error': f'Correlation {correlation_id} not found',
                    'handoff_latency': 0.0
                }
            
            correlation = self.active_correlations[correlation_id]
            correlation.correlation_status = ThreatCorrelationStatus.HANDOFF_IN_PROGRESS
            correlation.last_updated = datetime.now()
            
            # Record handoff attempt
            handoff_record = {
                'from_monitor': from_monitor,
                'to_monitor': to_monitor,
                'handoff_initiated': datetime.now().isoformat(),
                'status': 'in_progress'
            }
            
            correlation.handoff_history.append(handoff_record)
            
            # Update expected monitors
            correlation.expected_monitors.add(to_monitor)
            
            # Calculate handoff latency
            handoff_latency = time.time() - start_time
            
            # Update statistics
            self.correlation_stats['successful_handoffs'] += 1
            
            # Update rolling average handoff latency
            total_handoffs = self.correlation_stats['successful_handoffs']
            current_avg = self.correlation_stats['average_handoff_latency']
            new_avg = ((current_avg * (total_handoffs - 1)) + handoff_latency) / total_handoffs
            self.correlation_stats['average_handoff_latency'] = new_avg
            
            logger.info(f"🔄 Threat handoff initiated: {correlation_id} from {from_monitor} to {to_monitor} "
                       f"(latency: {handoff_latency:.3f}s)")
            
            return {
                'success': True,
                'correlation_id': correlation_id,
                'from_monitor': from_monitor,
                'to_monitor': to_monitor,
                'handoff_latency': handoff_latency,
                'expected_monitors': list(correlation.expected_monitors)
            }
            
        except Exception as e:
            self.correlation_stats['failed_handoffs'] += 1
            logger.error(f"❌ Threat handoff failed: {e}")
            
            return {
                'success': False,
                'error': str(e),
                'handoff_latency': time.time() - start_time
            }
    
    def get_active_correlations(self) -> Dict[str, Dict[str, Any]]:
        """Get all active correlations with serializable data"""
        active_correlations = {}
        
        for correlation_id, correlation in self.active_correlations.items():
            active_correlations[correlation_id] = {
                'correlation_id': correlation.correlation_id,
                'primary_threat': asdict(correlation.primary_threat),
                'correlated_threats': [asdict(t) for t in correlation.correlated_threats],
                'confidence_score': correlation.confidence_score,
                'status': correlation.correlation_status.value,
                'created_at': correlation.created_at.isoformat(),
                'last_updated': correlation.last_updated.isoformat(),
                'handoff_history': correlation.handoff_history,
                'correlation_factors': correlation.correlation_factors,
                'expected_monitors': list(correlation.expected_monitors)
            }
        
        return active_correlations
    
    def get_correlation_statistics(self) -> Dict[str, Any]:
        """Get comprehensive correlation engine statistics"""
        return {
            **self.correlation_stats,
            'active_correlations_count': len(self.active_correlations),
            'threats_in_registry': len(self.threat_registry),
            'monitor_relationships_count': len(self.monitor_relationships),
            'engine_uptime': time.time() - self.correlation_stats.get('engine_start_time', time.time()),
            'configuration': {
                'min_correlation_confidence': self.min_correlation_confidence,
                'max_threat_age': self.max_threat_age,
                'handoff_timeout': self.handoff_timeout,
                'correlation_weights': self.correlation_weights
            }
        }
    
    def update_threat_location(self, threat_id: str, new_monitor: str, new_zone: str, 
                             new_bbox: Tuple[int, int, int, int]):
        """Update threat location for continued tracking"""
        if threat_id in self.threat_registry:
            threat = self.threat_registry[threat_id]
            threat.monitor_id = new_monitor
            threat.zone_id = new_zone
            threat.bbox = new_bbox
            threat.last_seen = datetime.now()
            
            logger.debug(f"📍 Updated threat {threat_id} location: {new_monitor}/{new_zone}")

    def __del__(self):
        """Cleanup when engine is destroyed"""
        try:
            if self._cleanup_task:
                self._cleanup_task.cancel()
        except:
            pass
