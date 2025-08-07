"""
APEX AI GEOFENCING MANAGER
==========================
Advanced polygon-based zone management for dynamic AI rules
Handles zone creation, validation, point-in-polygon detection, and zone coordination

Key Features:
- Polygon zone creation and validation
- Real-time point-in-polygon detection using ray casting algorithm
- Zone hierarchy and overlapping zone management
- Coordinate system normalization (screen/camera coordinates)
- Zone persistence and serialization
- Performance-optimized detection algorithms
- Multi-monitor zone coordination
"""

import math
import json
import logging
from typing import Dict, List, Tuple, Optional, Any, Union
from dataclasses import dataclass, asdict
from datetime import datetime
import uuid
from enum import Enum

logger = logging.getLogger(__name__)

class ZoneType(Enum):
    """Zone type classifications for different security areas"""
    RESTRICTED = "restricted"           # No entry allowed
    MONITORED = "monitored"            # Watch for specific activities
    ENTRY_EXIT = "entry_exit"          # Track entrances/exits
    PERIMETER = "perimeter"            # Boundary monitoring
    PARKING = "parking"                # Vehicle monitoring
    LOBBY = "lobby"                    # Public area monitoring
    CORRIDOR = "corridor"              # Hallway monitoring
    STAIRWELL = "stairwell"           # Emergency exit monitoring

class CoordinateSystem(Enum):
    """Coordinate system types for zone definitions"""
    SCREEN_PIXELS = "screen_pixels"    # Raw screen coordinates
    NORMALIZED = "normalized"          # 0.0-1.0 normalized coordinates
    CAMERA_FEED = "camera_feed"        # Camera feed coordinates

@dataclass
class GeofenceZone:
    """
    Represents a single geofenced zone with polygon boundaries
    """
    zone_id: str
    name: str
    polygon_points: List[Tuple[float, float]]  # List of (x, y) coordinates
    zone_type: ZoneType
    coordinate_system: CoordinateSystem
    camera_id: str
    monitor_id: str
    
    # Zone configuration
    is_active: bool = True
    confidence_threshold: float = 0.75
    zone_priority: int = 1  # Higher numbers = higher priority
    
    # Time-based restrictions
    time_restrictions: Optional[Dict[str, Any]] = None
    
    # Detection settings
    allowed_objects: Optional[List[str]] = None    # Object types allowed in zone
    restricted_objects: Optional[List[str]] = None  # Object types forbidden in zone
    max_occupancy: Optional[int] = None            # Maximum people allowed
    
    # Zone metadata
    created_at: str = ""
    created_by: str = "system"
    description: str = ""
    
    def __post_init__(self):
        """Initialize zone after creation"""
        if not self.created_at:
            self.created_at = datetime.now().isoformat()
        
        if not self.zone_id:
            self.zone_id = f"zone_{uuid.uuid4().hex[:8]}"
        
        # Validate polygon
        if len(self.polygon_points) < 3:
            raise ValueError(f"Zone {self.zone_id} must have at least 3 points for valid polygon")
        
        # Ensure polygon is closed (first point == last point)
        if self.polygon_points[0] != self.polygon_points[-1]:
            self.polygon_points.append(self.polygon_points[0])

    def to_dict(self) -> Dict[str, Any]:
        """Convert zone to dictionary for serialization"""
        zone_dict = asdict(self)
        zone_dict['zone_type'] = self.zone_type.value
        zone_dict['coordinate_system'] = self.coordinate_system.value
        return zone_dict
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'GeofenceZone':
        """Create zone from dictionary"""
        # Convert enum strings back to enums
        data['zone_type'] = ZoneType(data['zone_type'])
        data['coordinate_system'] = CoordinateSystem(data['coordinate_system'])
        return cls(**data)

class GeofencingManager:
    """
    Advanced geofencing manager for polygon-based zone detection
    
    Handles multiple zones, coordinate transformations, and optimized
    point-in-polygon detection for real-time threat analysis.
    """
    
    def __init__(self, config: Optional[Dict[str, Any]] = None):
        """
        Initialize geofencing manager
        
        Args:
            config: Configuration parameters
        """
        self.config = config or {}
        
        # Zone storage
        self.zones: Dict[str, GeofenceZone] = {}
        self.zones_by_camera: Dict[str, List[str]] = {}
        self.zones_by_monitor: Dict[str, List[str]] = {}
        
        # Performance optimization
        self.detection_cache: Dict[str, Dict[str, bool]] = {}
        self.cache_max_size = self.config.get('cache_max_size', 1000)
        
        # Coordinate transformation matrices
        self.coordinate_transforms: Dict[str, Dict[str, Any]] = {}
        
        # Statistics
        self.stats = {
            'total_zones': 0,
            'active_zones': 0,
            'detection_checks_performed': 0,
            'cache_hits': 0,
            'cache_misses': 0,
            'zones_by_type': {},
            'last_update': None
        }
        
        logger.info("🗺️ Geofencing Manager initialized")
    
    def create_zone(self, zone_data: Dict[str, Any]) -> GeofenceZone:
        """
        Create a new geofenced zone
        
        Args:
            zone_data: Zone configuration data
            
        Returns:
            Created GeofenceZone object
        """
        try:
            # Create zone object
            zone = GeofenceZone(**zone_data)
            
            # Validate zone
            self._validate_zone(zone)
            
            # Store zone
            self.zones[zone.zone_id] = zone
            
            # Update indices
            self._update_zone_indices(zone)
            
            # Update statistics
            self._update_stats()
            
            logger.info(f"📍 Created zone: {zone.zone_id} ({zone.name}) - {zone.zone_type.value}")
            
            return zone
            
        except Exception as e:
            logger.error(f"❌ Failed to create zone: {e}")
            raise
    
    def update_zone(self, zone_id: str, updates: Dict[str, Any]) -> bool:
        """
        Update existing zone configuration
        
        Args:
            zone_id: Zone identifier
            updates: Updated configuration data
            
        Returns:
            True if zone was updated successfully
        """
        if zone_id not in self.zones:
            logger.warning(f"⚠️ Zone {zone_id} not found for update")
            return False
        
        try:
            zone = self.zones[zone_id]
            
            # Update zone attributes
            for key, value in updates.items():
                if hasattr(zone, key):
                    setattr(zone, key, value)
            
            # Re-validate zone
            self._validate_zone(zone)
            
            # Update indices if camera/monitor changed
            if 'camera_id' in updates or 'monitor_id' in updates:
                self._rebuild_zone_indices()
            
            # Clear relevant cache entries
            self._clear_zone_cache(zone_id)
            
            # Update statistics
            self._update_stats()
            
            logger.info(f"✅ Updated zone: {zone_id}")
            
            return True
            
        except Exception as e:
            logger.error(f"❌ Failed to update zone {zone_id}: {e}")
            return False
    
    def delete_zone(self, zone_id: str) -> bool:
        """
        Delete a geofenced zone
        
        Args:
            zone_id: Zone identifier
            
        Returns:
            True if zone was deleted successfully
        """
        if zone_id not in self.zones:
            logger.warning(f"⚠️ Zone {zone_id} not found for deletion")
            return False
        
        try:
            # Remove zone
            zone = self.zones.pop(zone_id)
            
            # Update indices
            self._remove_zone_from_indices(zone)
            
            # Clear cache
            self._clear_zone_cache(zone_id)
            
            # Update statistics
            self._update_stats()
            
            logger.info(f"🗑️ Deleted zone: {zone_id}")
            
            return True
            
        except Exception as e:
            logger.error(f"❌ Failed to delete zone {zone_id}: {e}")
            return False
    
    def is_point_in_zone(self, point: Tuple[float, float], zone_id: str, 
                         coordinate_system: CoordinateSystem = CoordinateSystem.NORMALIZED) -> bool:
        """
        Check if a point is inside a specific zone using optimized ray casting
        
        Args:
            point: (x, y) coordinates to check
            zone_id: Zone identifier
            coordinate_system: Coordinate system of the input point
            
        Returns:
            True if point is inside the zone
        """
        if zone_id not in self.zones:
            return False
        
        zone = self.zones[zone_id]
        
        if not zone.is_active:
            return False
        
        # Check cache first
        cache_key = f"{zone_id}_{point[0]:.3f}_{point[1]:.3f}_{coordinate_system.value}"
        if cache_key in self.detection_cache.get(zone_id, {}):
            self.stats['cache_hits'] += 1
            return self.detection_cache[zone_id][cache_key]
        
        self.stats['cache_misses'] += 1
        self.stats['detection_checks_performed'] += 1
        
        try:
            # Transform coordinates if needed
            transformed_point = self._transform_coordinates(
                point, coordinate_system, zone.coordinate_system, zone.camera_id
            )
            
            # Perform ray casting algorithm
            result = self._point_in_polygon_ray_casting(transformed_point, zone.polygon_points)
            
            # Cache result
            self._cache_detection_result(zone_id, cache_key, result)
            
            return result
            
        except Exception as e:
            logger.error(f"❌ Point-in-zone detection failed for {zone_id}: {e}")
            return False
    
    def get_zones_containing_point(self, point: Tuple[float, float], 
                                   camera_id: Optional[str] = None,
                                   coordinate_system: CoordinateSystem = CoordinateSystem.NORMALIZED,
                                   zone_types: Optional[List[ZoneType]] = None) -> List[GeofenceZone]:
        """
        Get all zones that contain a specific point
        
        Args:
            point: (x, y) coordinates to check
            camera_id: Filter by camera (optional)
            coordinate_system: Coordinate system of the input point
            zone_types: Filter by zone types (optional)
            
        Returns:
            List of zones containing the point
        """
        containing_zones = []
        
        # Filter zones to check
        zones_to_check = []
        if camera_id:
            zone_ids = self.zones_by_camera.get(camera_id, [])
            zones_to_check = [self.zones[zid] for zid in zone_ids if zid in self.zones]
        else:
            zones_to_check = list(self.zones.values())
        
        # Filter by zone types if specified
        if zone_types:
            zones_to_check = [z for z in zones_to_check if z.zone_type in zone_types]
        
        # Check each zone
        for zone in zones_to_check:
            if self.is_point_in_zone(point, zone.zone_id, coordinate_system):
                containing_zones.append(zone)
        
        # Sort by priority (higher priority first)
        containing_zones.sort(key=lambda z: z.zone_priority, reverse=True)
        
        return containing_zones
    
    def get_zone_overlaps(self, zone_id: str) -> List[Tuple[str, float]]:
        """
        Calculate overlapping zones and their overlap percentages
        
        Args:
            zone_id: Zone to check for overlaps
            
        Returns:
            List of (overlapping_zone_id, overlap_percentage) tuples
        """
        if zone_id not in self.zones:
            return []
        
        primary_zone = self.zones[zone_id]
        overlaps = []
        
        # Check against other zones on same camera
        camera_zones = self.zones_by_camera.get(primary_zone.camera_id, [])
        
        for other_zone_id in camera_zones:
            if other_zone_id == zone_id:
                continue
                
            if other_zone_id not in self.zones:
                continue
                
            other_zone = self.zones[other_zone_id]
            
            # Calculate overlap using sampling method
            overlap_percentage = self._calculate_polygon_overlap(
                primary_zone.polygon_points, other_zone.polygon_points
            )
            
            if overlap_percentage > 0:
                overlaps.append((other_zone_id, overlap_percentage))
        
        return overlaps
    
    def validate_zone_configuration(self, zone_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Validate zone configuration and return validation results
        
        Args:
            zone_data: Zone configuration to validate
            
        Returns:
            Validation results with errors and warnings
        """
        validation_result = {
            'is_valid': True,
            'errors': [],
            'warnings': [],
            'suggestions': []
        }
        
        try:
            # Required fields check
            required_fields = ['name', 'polygon_points', 'zone_type', 'camera_id']
            for field in required_fields:
                if field not in zone_data or not zone_data[field]:
                    validation_result['errors'].append(f"Missing required field: {field}")
                    validation_result['is_valid'] = False
            
            # Polygon validation
            polygon_points = zone_data.get('polygon_points', [])
            if len(polygon_points) < 3:
                validation_result['errors'].append("Polygon must have at least 3 points")
                validation_result['is_valid'] = False
            elif len(polygon_points) < 4:
                validation_result['warnings'].append("Triangular zones may be too restrictive")
            
            # Self-intersection check
            if self._polygon_has_self_intersection(polygon_points):
                validation_result['errors'].append("Polygon has self-intersecting edges")
                validation_result['is_valid'] = False
            
            # Area validation
            area = self._calculate_polygon_area(polygon_points)
            if area < 0.001:  # Very small area
                validation_result['warnings'].append("Zone area is very small, may cause detection issues")
            elif area > 0.5:  # Large area
                validation_result['suggestions'].append("Large zone may benefit from subdivision")
            
            # Coordinate bounds check
            for point in polygon_points:
                x, y = point
                if not (0 <= x <= 1 and 0 <= y <= 1):
                    validation_result['warnings'].append("Some points are outside normalized bounds (0-1)")
                    break
            
            # Time restrictions validation
            time_restrictions = zone_data.get('time_restrictions')
            if time_restrictions:
                time_validation = self._validate_time_restrictions(time_restrictions)
                if not time_validation['is_valid']:
                    validation_result['errors'].extend(time_validation['errors'])
                    validation_result['is_valid'] = False
            
        except Exception as e:
            validation_result['errors'].append(f"Validation error: {str(e)}")
            validation_result['is_valid'] = False
        
        return validation_result
    
    def export_zones(self, camera_id: Optional[str] = None, 
                     zone_types: Optional[List[ZoneType]] = None) -> Dict[str, Any]:
        """
        Export zone configurations for backup or transfer
        
        Args:
            camera_id: Filter by camera (optional)
            zone_types: Filter by zone types (optional)
            
        Returns:
            Exported zone data
        """
        # Filter zones
        zones_to_export = list(self.zones.values())
        
        if camera_id:
            zones_to_export = [z for z in zones_to_export if z.camera_id == camera_id]
        
        if zone_types:
            zones_to_export = [z for z in zones_to_export if z.zone_type in zone_types]
        
        # Convert to exportable format
        export_data = {
            'export_timestamp': datetime.now().isoformat(),
            'export_version': '1.0',
            'total_zones': len(zones_to_export),
            'filters': {
                'camera_id': camera_id,
                'zone_types': [zt.value for zt in zone_types] if zone_types else None
            },
            'zones': [zone.to_dict() for zone in zones_to_export],
            'statistics': self.get_geofencing_stats()
        }
        
        logger.info(f"📤 Exported {len(zones_to_export)} zones")
        
        return export_data
    
    def import_zones(self, import_data: Dict[str, Any], 
                     overwrite_existing: bool = False) -> Dict[str, Any]:
        """
        Import zone configurations from backup or transfer
        
        Args:
            import_data: Exported zone data
            overwrite_existing: Whether to overwrite existing zones
            
        Returns:
            Import results
        """
        import_result = {
            'imported_count': 0,
            'skipped_count': 0,
            'error_count': 0,
            'errors': [],
            'imported_zone_ids': []
        }
        
        try:
            zones_data = import_data.get('zones', [])
            
            for zone_data in zones_data:
                try:
                    zone_id = zone_data.get('zone_id')
                    
                    # Check if zone exists
                    if zone_id in self.zones and not overwrite_existing:
                        import_result['skipped_count'] += 1
                        continue
                    
                    # Create or update zone
                    if zone_id in self.zones:
                        # Update existing
                        self.update_zone(zone_id, zone_data)
                    else:
                        # Create new
                        zone = GeofenceZone.from_dict(zone_data)
                        self.zones[zone.zone_id] = zone
                        self._update_zone_indices(zone)
                    
                    import_result['imported_count'] += 1
                    import_result['imported_zone_ids'].append(zone_id)
                    
                except Exception as e:
                    import_result['error_count'] += 1
                    import_result['errors'].append(f"Zone {zone_data.get('zone_id', 'unknown')}: {str(e)}")
            
            # Update statistics
            self._update_stats()
            
            logger.info(f"📥 Import complete: {import_result['imported_count']} imported, "
                       f"{import_result['skipped_count']} skipped, {import_result['error_count']} errors")
            
        except Exception as e:
            import_result['errors'].append(f"Import failed: {str(e)}")
            logger.error(f"❌ Zone import failed: {e}")
        
        return import_result
    
    def get_geofencing_stats(self) -> Dict[str, Any]:
        """
        Get comprehensive geofencing statistics
        
        Returns:
            Statistics dictionary
        """
        # Update current stats
        self._update_stats()
        
        # Add cache statistics
        cache_size = sum(len(zone_cache) for zone_cache in self.detection_cache.values())
        cache_hit_rate = 0
        if self.stats['cache_hits'] + self.stats['cache_misses'] > 0:
            cache_hit_rate = self.stats['cache_hits'] / (self.stats['cache_hits'] + self.stats['cache_misses'])
        
        extended_stats = {
            **self.stats,
            'cache_statistics': {
                'cache_size': cache_size,
                'cache_hit_rate': cache_hit_rate,
                'cache_hits': self.stats['cache_hits'],
                'cache_misses': self.stats['cache_misses']
            },
            'zone_distribution': {
                'zones_by_camera': {cam: len(zones) for cam, zones in self.zones_by_camera.items()},
                'zones_by_monitor': {mon: len(zones) for mon, zones in self.zones_by_monitor.items()}
            }
        }
        
        return extended_stats
    
    def clear_detection_cache(self, zone_id: Optional[str] = None):
        """
        Clear detection cache for optimization
        
        Args:
            zone_id: Clear cache for specific zone, or all if None
        """
        if zone_id:
            if zone_id in self.detection_cache:
                del self.detection_cache[zone_id]
                logger.debug(f"🧹 Cleared cache for zone {zone_id}")
        else:
            self.detection_cache.clear()
            logger.debug("🧹 Cleared all detection cache")
    
    def cleanup_inactive_zones(self) -> int:
        """
        Remove inactive zones and clean up indices
        
        Returns:
            Number of zones removed
        """
        inactive_zones = [zid for zid, zone in self.zones.items() if not zone.is_active]
        
        for zone_id in inactive_zones:
            self.delete_zone(zone_id)
        
        logger.info(f"🧹 Cleaned up {len(inactive_zones)} inactive zones")
        
        return len(inactive_zones)
    
    # ========== PRIVATE METHODS ==========
    
    def _validate_zone(self, zone: GeofenceZone):
        """Validate zone configuration"""
        # Basic validation already done in __post_init__
        
        # Additional validation
        if zone.confidence_threshold < 0 or zone.confidence_threshold > 1:
            raise ValueError(f"Confidence threshold must be between 0 and 1")
        
        if zone.zone_priority < 1:
            raise ValueError(f"Zone priority must be >= 1")
        
        # Validate polygon geometry
        if self._polygon_has_self_intersection(zone.polygon_points):
            raise ValueError(f"Zone {zone.zone_id} has self-intersecting polygon")
    
    def _update_zone_indices(self, zone: GeofenceZone):
        """Update zone lookup indices"""
        # Camera index
        if zone.camera_id not in self.zones_by_camera:
            self.zones_by_camera[zone.camera_id] = []
        if zone.zone_id not in self.zones_by_camera[zone.camera_id]:
            self.zones_by_camera[zone.camera_id].append(zone.zone_id)
        
        # Monitor index
        if zone.monitor_id not in self.zones_by_monitor:
            self.zones_by_monitor[zone.monitor_id] = []
        if zone.zone_id not in self.zones_by_monitor[zone.monitor_id]:
            self.zones_by_monitor[zone.monitor_id].append(zone.zone_id)
    
    def _remove_zone_from_indices(self, zone: GeofenceZone):
        """Remove zone from lookup indices"""
        # Camera index
        if zone.camera_id in self.zones_by_camera:
            if zone.zone_id in self.zones_by_camera[zone.camera_id]:
                self.zones_by_camera[zone.camera_id].remove(zone.zone_id)
            if not self.zones_by_camera[zone.camera_id]:
                del self.zones_by_camera[zone.camera_id]
        
        # Monitor index
        if zone.monitor_id in self.zones_by_monitor:
            if zone.zone_id in self.zones_by_monitor[zone.monitor_id]:
                self.zones_by_monitor[zone.monitor_id].remove(zone.zone_id)
            if not self.zones_by_monitor[zone.monitor_id]:
                del self.zones_by_monitor[zone.monitor_id]
    
    def _rebuild_zone_indices(self):
        """Rebuild all zone indices"""
        self.zones_by_camera.clear()
        self.zones_by_monitor.clear()
        
        for zone in self.zones.values():
            self._update_zone_indices(zone)
    
    def _update_stats(self):
        """Update geofencing statistics"""
        self.stats['total_zones'] = len(self.zones)
        self.stats['active_zones'] = sum(1 for zone in self.zones.values() if zone.is_active)
        
        # Count zones by type
        self.stats['zones_by_type'] = {}
        for zone in self.zones.values():
            zone_type = zone.zone_type.value
            self.stats['zones_by_type'][zone_type] = self.stats['zones_by_type'].get(zone_type, 0) + 1
        
        self.stats['last_update'] = datetime.now().isoformat()
    
    def _transform_coordinates(self, point: Tuple[float, float], 
                              from_system: CoordinateSystem, 
                              to_system: CoordinateSystem,
                              camera_id: str) -> Tuple[float, float]:
        """Transform coordinates between different systems"""
        if from_system == to_system:
            return point
        
        # For now, implement basic transformation
        # In production, this would use actual camera calibration data
        
        x, y = point
        
        if from_system == CoordinateSystem.SCREEN_PIXELS and to_system == CoordinateSystem.NORMALIZED:
            # Assume 1920x1080 screen - would be configurable in production
            return (x / 1920.0, y / 1080.0)
        elif from_system == CoordinateSystem.NORMALIZED and to_system == CoordinateSystem.SCREEN_PIXELS:
            return (x * 1920.0, y * 1080.0)
        else:
            # For other transformations, return as-is for now
            return point
    
    def _point_in_polygon_ray_casting(self, point: Tuple[float, float], 
                                      polygon: List[Tuple[float, float]]) -> bool:
        """
        Optimized ray casting algorithm for point-in-polygon detection
        
        Args:
            point: Point to test
            polygon: Polygon vertices
            
        Returns:
            True if point is inside polygon
        """
        x, y = point
        n = len(polygon)
        inside = False
        
        p1x, p1y = polygon[0]
        for i in range(1, n + 1):
            p2x, p2y = polygon[i % n]
            if y > min(p1y, p2y):
                if y <= max(p1y, p2y):
                    if x <= max(p1x, p2x):
                        if p1y != p2y:
                            xinters = (y - p1y) * (p2x - p1x) / (p2y - p1y) + p1x
                        if p1x == p2x or x <= xinters:
                            inside = not inside
            p1x, p1y = p2x, p2y
        
        return inside
    
    def _polygon_has_self_intersection(self, polygon: List[Tuple[float, float]]) -> bool:
        """Check if polygon has self-intersecting edges"""
        n = len(polygon)
        
        for i in range(n):
            for j in range(i + 2, n):
                if j == n - 1 and i == 0:  # Skip adjacent edges
                    continue
                
                # Check if line segments intersect
                if self._line_segments_intersect(
                    polygon[i], polygon[(i + 1) % n],
                    polygon[j], polygon[(j + 1) % n]
                ):
                    return True
        
        return False
    
    def _line_segments_intersect(self, p1: Tuple[float, float], p2: Tuple[float, float],
                                p3: Tuple[float, float], p4: Tuple[float, float]) -> bool:
        """Check if two line segments intersect"""
        def ccw(A, B, C):
            return (C[1] - A[1]) * (B[0] - A[0]) > (B[1] - A[1]) * (C[0] - A[0])
        
        return ccw(p1, p3, p4) != ccw(p2, p3, p4) and ccw(p1, p2, p3) != ccw(p1, p2, p4)
    
    def _calculate_polygon_area(self, polygon: List[Tuple[float, float]]) -> float:
        """Calculate polygon area using shoelace formula"""
        n = len(polygon)
        area = 0.0
        
        for i in range(n):
            j = (i + 1) % n
            area += polygon[i][0] * polygon[j][1]
            area -= polygon[j][0] * polygon[i][1]
        
        return abs(area) / 2.0
    
    def _calculate_polygon_overlap(self, polygon1: List[Tuple[float, float]], 
                                  polygon2: List[Tuple[float, float]]) -> float:
        """Calculate overlap percentage between two polygons using sampling"""
        # Simplified overlap calculation using grid sampling
        # In production, would use more sophisticated geometric algorithms
        
        # Get bounding boxes
        bbox1 = self._get_polygon_bbox(polygon1)
        bbox2 = self._get_polygon_bbox(polygon2)
        
        # Check if bounding boxes overlap
        if not self._bboxes_overlap(bbox1, bbox2):
            return 0.0
        
        # Get union bounding box
        union_bbox = self._get_union_bbox(bbox1, bbox2)
        
        # Sample points in union bbox
        sample_size = 100
        overlap_count = 0
        total_in_p1 = 0
        
        for i in range(sample_size):
            for j in range(sample_size):
                x = union_bbox[0] + (union_bbox[2] - union_bbox[0]) * i / sample_size
                y = union_bbox[1] + (union_bbox[3] - union_bbox[1]) * j / sample_size
                
                in_p1 = self._point_in_polygon_ray_casting((x, y), polygon1)
                in_p2 = self._point_in_polygon_ray_casting((x, y), polygon2)
                
                if in_p1:
                    total_in_p1 += 1
                    if in_p2:
                        overlap_count += 1
        
        if total_in_p1 == 0:
            return 0.0
        
        return (overlap_count / total_in_p1) * 100.0
    
    def _get_polygon_bbox(self, polygon: List[Tuple[float, float]]) -> Tuple[float, float, float, float]:
        """Get polygon bounding box (min_x, min_y, max_x, max_y)"""
        xs = [p[0] for p in polygon]
        ys = [p[1] for p in polygon]
        return (min(xs), min(ys), max(xs), max(ys))
    
    def _bboxes_overlap(self, bbox1: Tuple[float, float, float, float], 
                       bbox2: Tuple[float, float, float, float]) -> bool:
        """Check if two bounding boxes overlap"""
        return not (bbox1[2] < bbox2[0] or bbox2[2] < bbox1[0] or 
                   bbox1[3] < bbox2[1] or bbox2[3] < bbox1[1])
    
    def _get_union_bbox(self, bbox1: Tuple[float, float, float, float], 
                       bbox2: Tuple[float, float, float, float]) -> Tuple[float, float, float, float]:
        """Get union of two bounding boxes"""
        return (min(bbox1[0], bbox2[0]), min(bbox1[1], bbox2[1]),
                max(bbox1[2], bbox2[2]), max(bbox1[3], bbox2[3]))
    
    def _validate_time_restrictions(self, time_restrictions: Dict[str, Any]) -> Dict[str, Any]:
        """Validate time restriction configuration"""
        validation = {'is_valid': True, 'errors': []}
        
        # Add time restriction validation logic here
        # For now, assume valid
        
        return validation
    
    def _cache_detection_result(self, zone_id: str, cache_key: str, result: bool):
        """Cache detection result with size management"""
        if zone_id not in self.detection_cache:
            self.detection_cache[zone_id] = {}
        
        zone_cache = self.detection_cache[zone_id]
        
        # Manage cache size
        if len(zone_cache) >= self.cache_max_size:
            # Remove oldest entries (simple FIFO)
            keys_to_remove = list(zone_cache.keys())[:10]  # Remove 10 oldest
            for key in keys_to_remove:
                del zone_cache[key]
        
        zone_cache[cache_key] = result
    
    def _clear_zone_cache(self, zone_id: str):
        """Clear cache for specific zone"""
        if zone_id in self.detection_cache:
            del self.detection_cache[zone_id]
