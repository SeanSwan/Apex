/**
 * ROUTING & OPTIMIZATION SERVICE - APEX AI
 * ========================================
 * Master Prompt v29.4-APEX Implementation
 * 
 * Features:
 * - GPS route optimization for guard dispatch
 * - Real-time traffic integration
 * - Multi-point route planning
 * - ETA calculation with dynamic updates
 * - Emergency route prioritization
 */

import express from 'express';
import { getIO, emitSocketEvent } from '../../src/socket.js';
import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';
// Using built-in fetch (Node.js 18+)

dotenv.config();
const router = express.Router();

// PostgreSQL connection pool
const pool = new Pool({
  user: process.env.PG_USER,
  host: process.env.PG_HOST,
  database: process.env.PG_DB,
  password: process.env.PG_PASSWORD,
  port: Number(process.env.PG_PORT),
});

/**
 * ROUTE OPTIMIZATION ENGINE
 * ========================
 * Calculate optimal routes with real-time traffic data
 */
const calculateOptimalRoute = async (origin, destination, options = {}) => {
  try {
    const {
      optimize = true,
      avoid_traffic = true,
      emergency_mode = false,
      walking_mode = true
    } = options;

    // Distance calculation (Haversine formula)
    const distance = calculateHaversineDistance(
      origin.latitude, origin.longitude,
      destination.latitude, destination.longitude
    );

    // Base travel speeds (meters per second)
    const speeds = {
      walking: 1.4,      // 5 km/h
      running: 3.5,      // 12.6 km/h  
      vehicle: 8.3,      // 30 km/h average urban
      emergency: 13.9    // 50 km/h emergency response
    };

    // Select travel mode
    const travelMode = emergency_mode ? 'emergency' : 
                      walking_mode ? 'walking' : 'vehicle';
    
    const baseSpeed = speeds[travelMode];
    
    // Calculate base travel time
    let estimatedTime = distance / baseSpeed;

    // Add complexity factors
    if (optimize && distance > 500) {
      // Complex route optimization for longer distances
      estimatedTime *= 1.2; // 20% buffer for navigation
    }

    // Traffic adjustment (simulated - would integrate with Google Maps/MapBox)
    if (avoid_traffic && !walking_mode) {
      const trafficMultiplier = await getTrafficMultiplier(origin, destination);
      estimatedTime *= trafficMultiplier;
    }

    // Emergency mode adjustments
    if (emergency_mode) {
      estimatedTime *= 0.7; // 30% faster for emergency response
    }

    // Building/indoor navigation buffer
    const indoorNavigationBuffer = 60; // 1 minute for building navigation
    estimatedTime += indoorNavigationBuffer;

    // Generate route waypoints (simplified)
    const waypoints = generateRouteWaypoints(origin, destination, distance);

    return {
      origin,
      destination,
      distance_meters: Math.round(distance),
      estimated_time_seconds: Math.round(estimatedTime),
      eta_formatted: formatDuration(estimatedTime),
      travel_mode: travelMode,
      route_type: optimize ? 'optimized' : 'direct',
      waypoints,
      traffic_considered: avoid_traffic,
      confidence: 0.85,
      alternative_routes: await generateAlternativeRoutes(origin, destination, distance)
    };

  } catch (error) {
    console.error('Route calculation error:', error);
    throw error;
  }
};

/**
 * Haversine distance calculation
 */
const calculateHaversineDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3; // Earth radius in meters
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c;
};

/**
 * Traffic multiplier simulation (replace with real traffic API)
 */
const getTrafficMultiplier = async (origin, destination) => {
  // Simulate traffic based on time of day
  const hour = new Date().getHours();
  
  // Rush hour traffic (7-9 AM, 5-7 PM)
  if ((hour >= 7 && hour <= 9) || (hour >= 17 && hour <= 19)) {
    return 1.5; // 50% longer due to traffic
  }
  
  // Late night (minimal traffic)
  if (hour >= 22 || hour <= 6) {
    return 0.9; // 10% faster
  }
  
  // Normal traffic
  return 1.1; // 10% buffer for normal traffic
};

/**
 * Generate route waypoints
 */
const generateRouteWaypoints = (origin, destination, distance) => {
  const waypoints = [origin];
  
  // For longer routes, add intermediate waypoints
  if (distance > 1000) {
    const segments = Math.ceil(distance / 500); // 500m segments
    
    for (let i = 1; i < segments; i++) {
      const ratio = i / segments;
      const lat = origin.latitude + (destination.latitude - origin.latitude) * ratio;
      const lng = origin.longitude + (destination.longitude - origin.longitude) * ratio;
      
      waypoints.push({
        latitude: lat,
        longitude: lng,
        type: 'intermediate'
      });
    }
  }
  
  waypoints.push(destination);
  return waypoints;
};

/**
 * Generate alternative routes
 */
const generateAlternativeRoutes = async (origin, destination, mainDistance) => {
  // Simplified alternative route generation
  // In production, integrate with mapping service API
  
  return [
    {
      route_id: 'alt_1',
      name: 'Alternative Route 1',
      distance_meters: Math.round(mainDistance * 1.15),
      estimated_time_seconds: Math.round((mainDistance * 1.15) / 1.4 + 60),
      description: 'Alternate path via main corridors'
    },
    {
      route_id: 'alt_2', 
      name: 'Emergency Route',
      distance_meters: Math.round(mainDistance * 0.95),
      estimated_time_seconds: Math.round((mainDistance * 0.95) / 2.0 + 30),
      description: 'Direct emergency response route'
    }
  ];
};

/**
 * Format duration in human-readable format
 */
const formatDuration = (seconds) => {
  if (seconds < 60) return `${Math.round(seconds)}s`;
  if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
  return `${Math.floor(seconds / 3600)}h ${Math.round((seconds % 3600) / 60)}m`;
};

/**
 * POST /api/routing/calculate
 * Calculate optimal route for guard dispatch
 */
router.post('/calculate', async (req, res) => {
  const { 
    origin, 
    alert_id, 
    destination,
    optimize = true,
    emergency_mode = false,
    walking_mode = true
  } = req.body;

  try {
    let finalDestination = destination;

    // If alert_id provided, get destination from alert location
    if (alert_id && !destination) {
      const alertQuery = `
        SELECT 
          cz.latitude,
          cz.longitude,
          cz.zone_name,
          c.name as camera_name,
          c.location as camera_location
        FROM ai_alerts_log aal
        JOIN camera_zones cz ON cz.camera_id = aal.camera_id
        JOIN cameras c ON c.camera_id = aal.camera_id
        WHERE aal.alert_id = $1
      `;
      
      const alertResult = await pool.query(alertQuery, [alert_id]);
      
      if (alertResult.rows.length === 0) {
        return res.status(404).json({ error: 'Alert location not found' });
      }
      
      const alertLocation = alertResult.rows[0];
      finalDestination = {
        latitude: parseFloat(alertLocation.latitude),
        longitude: parseFloat(alertLocation.longitude),
        name: alertLocation.camera_name,
        zone: alertLocation.zone_name,
        type: 'alert_location'
      };
    }

    if (!origin || !finalDestination) {
      return res.status(400).json({ error: 'Origin and destination coordinates required' });
    }

    // Calculate optimal route
    const routeData = await calculateOptimalRoute(origin, finalDestination, {
      optimize,
      emergency_mode,
      walking_mode,
      avoid_traffic: true
    });

    // Store route calculation for analytics
    const routeId = `route_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    
    await pool.query(
      'INSERT INTO route_calculations (route_id, origin, destination, route_data, alert_id, calculated_at) VALUES ($1, $2, $3, $4, $5, $6)',
      [
        routeId,
        JSON.stringify(origin),
        JSON.stringify(finalDestination),
        JSON.stringify(routeData),
        alert_id,
        new Date()
      ]
    );

    // Real-time route update via WebSocket
    emitSocketEvent('route_calculated', {
      route_id: routeId,
      alert_id,
      eta: routeData.eta_formatted,
      distance: routeData.distance_meters,
      timestamp: new Date().toISOString()
    });

    res.json({
      success: true,
      route_id: routeId,
      route: routeData,
      message: `Route calculated: ${routeData.eta_formatted} ETA`
    });

  } catch (error) {
    console.error('Route calculation error:', error);
    res.status(500).json({
      error: 'Failed to calculate route',
      details: error.message
    });
  }
});

/**
 * POST /api/routing/update-eta
 * Update ETA based on real-time position
 */
router.post('/update-eta', async (req, res) => {
  const { route_id, current_position, guard_id } = req.body;

  try {
    // Get original route
    const routeQuery = 'SELECT * FROM route_calculations WHERE route_id = $1';
    const routeResult = await pool.query(routeQuery, [route_id]);
    
    if (routeResult.rows.length === 0) {
      return res.status(404).json({ error: 'Route not found' });
    }

    const originalRoute = routeResult.rows[0];
    const destination = JSON.parse(originalRoute.destination);

    // Recalculate from current position
    const updatedRoute = await calculateOptimalRoute(current_position, destination, {
      optimize: true,
      walking_mode: true
    });

    // Update guard location
    if (guard_id) {
      await pool.query(
        'UPDATE guards SET last_known_latitude = $1, last_known_longitude = $2, last_location_update = $3 WHERE guard_id = $4',
        [current_position.latitude, current_position.longitude, new Date(), guard_id]
      );
    }

    // Real-time ETA update
    emitSocketEvent('eta_updated', {
      route_id,
      guard_id,
      updated_eta: updatedRoute.eta_formatted,
      current_position,
      remaining_distance: updatedRoute.distance_meters,
      timestamp: new Date().toISOString()
    });

    res.json({
      success: true,
      route_id,
      updated_eta: updatedRoute.eta_formatted,
      remaining_distance: updatedRoute.distance_meters,
      current_position
    });

  } catch (error) {
    console.error('ETA update error:', error);
    res.status(500).json({
      error: 'Failed to update ETA',
      details: error.message
    });
  }
});

/**
 * GET /api/routing/active-routes
 * Get all active routes for monitoring
 */
router.get('/active-routes', async (req, res) => {
  try {
    const query = `
      SELECT 
        rc.*,
        gd.guard_id,
        g.name as guard_name,
        g.last_known_latitude,
        g.last_known_longitude,
        aal.alert_type,
        aal.priority
      FROM route_calculations rc
      LEFT JOIN guard_dispatches gd ON gd.alert_id = rc.alert_id
      LEFT JOIN guards g ON g.guard_id = gd.guard_id
      LEFT JOIN ai_alerts_log aal ON aal.alert_id = rc.alert_id
      WHERE rc.calculated_at >= NOW() - INTERVAL '2 hours'
      AND gd.status IN ('dispatched', 'en_route')
      ORDER BY rc.calculated_at DESC
    `;

    const result = await pool.query(query);

    res.json({
      success: true,
      active_routes: result.rows,
      count: result.rows.length
    });

  } catch (error) {
    console.error('Active routes error:', error);
    res.status(500).json({
      error: 'Failed to get active routes',
      details: error.message
    });
  }
});

/**
 * POST /api/routing/emergency-route
 * Calculate emergency response route with highest priority
 */
router.post('/emergency-route', async (req, res) => {
  const { origin, destination, alert_id } = req.body;

  try {
    // Emergency route with all optimizations enabled
    const emergencyRoute = await calculateOptimalRoute(origin, destination, {
      optimize: true,
      emergency_mode: true,
      walking_mode: false, // Use fastest transport
      avoid_traffic: true
    });

    // Mark as emergency route
    emergencyRoute.route_type = 'emergency';
    emergencyRoute.priority = 'critical';

    // Store emergency route
    const routeId = `emergency_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    
    await pool.query(
      'INSERT INTO route_calculations (route_id, origin, destination, route_data, alert_id, route_type, calculated_at) VALUES ($1, $2, $3, $4, $5, $6, $7)',
      [
        routeId,
        JSON.stringify(origin),
        JSON.stringify(destination),
        JSON.stringify(emergencyRoute),
        alert_id,
        'emergency',
        new Date()
      ]
    );

    // Emergency route broadcast
    emitSocketEvent('emergency_route_calculated', {
      route_id: routeId,
      alert_id,
      eta: emergencyRoute.eta_formatted,
      priority: 'critical',
      timestamp: new Date().toISOString()
    });

    // Log emergency routing event
    await pool.query(
      'INSERT INTO security_events (event_type, event_data, timestamp) VALUES ($1, $2, $3)',
      [
        'emergency_route_calculated',
        JSON.stringify({
          route_id: routeId,
          alert_id,
          eta_seconds: emergencyRoute.estimated_time_seconds
        }),
        new Date()
      ]
    );

    res.json({
      success: true,
      route_id: routeId,
      emergency_route: emergencyRoute,
      message: `Emergency route calculated: ${emergencyRoute.eta_formatted} ETA`
    });

  } catch (error) {
    console.error('Emergency route error:', error);
    res.status(500).json({
      error: 'Failed to calculate emergency route',
      details: error.message
    });
  }
});

/**
 * GET /api/routing/analytics
 * Route performance analytics
 */
router.get('/analytics', async (req, res) => {
  const { time_period = '24h' } = req.query;

  try {
    let timeFilter;
    switch (time_period) {
      case '1h': timeFilter = "NOW() - INTERVAL '1 hour'"; break;
      case '24h': timeFilter = "NOW() - INTERVAL '24 hours'"; break;
      case '7d': timeFilter = "NOW() - INTERVAL '7 days'"; break;
      default: timeFilter = "NOW() - INTERVAL '24 hours'";
    }

    const analyticsQuery = `
      SELECT 
        COUNT(*) as total_routes,
        AVG((route_data->>'estimated_time_seconds')::int) as avg_eta_seconds,
        AVG((route_data->>'distance_meters')::int) as avg_distance_meters,
        COUNT(CASE WHEN route_type = 'emergency' THEN 1 END) as emergency_routes,
        COUNT(CASE WHEN (route_data->>'estimated_time_seconds')::int <= 300 THEN 1 END) as quick_routes
      FROM route_calculations 
      WHERE calculated_at >= ${timeFilter}
    `;

    const result = await pool.query(analyticsQuery);
    const analytics = result.rows[0];

    res.json({
      success: true,
      analytics: {
        total_routes: parseInt(analytics.total_routes),
        average_eta_seconds: Math.round(parseFloat(analytics.avg_eta_seconds) || 0),
        average_distance_meters: Math.round(parseFloat(analytics.avg_distance_meters) || 0),
        emergency_routes: parseInt(analytics.emergency_routes),
        quick_routes_percentage: analytics.total_routes > 0 ? 
          Math.round((parseInt(analytics.quick_routes) / parseInt(analytics.total_routes)) * 100) : 0
      },
      time_period
    });

  } catch (error) {
    console.error('Route analytics error:', error);
    res.status(500).json({
      error: 'Failed to get route analytics',
      details: error.message
    });
  }
});

export default router;