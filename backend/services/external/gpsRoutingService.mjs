/**
 * APEX AI SECURITY PLATFORM - GPS & ROUTING SERVICE
 * =================================================
 * Real-time GPS tracking and route optimization for guard dispatch
 */

import axios from 'axios';

class GPSRoutingService {
  constructor() {
    this.provider = process.env.MAPS_PROVIDER || 'google'; // google, mapbox, here, osrm
    this.config = this.getProviderConfig();
    this.guardLocations = new Map(); // In-memory store for real-time locations
    this.initialized = this.config !== null;
  }

  getProviderConfig() {
    switch (this.provider) {
      case 'google':
        return {
          apiKey: process.env.GOOGLE_MAPS_API_KEY,
          baseUrl: 'https://maps.googleapis.com/maps/api',
          directions: '/directions/json',
          geocoding: '/geocode/json',
          distanceMatrix: '/distancematrix/json'
        };
      case 'mapbox':
        return {
          apiKey: process.env.MAPBOX_ACCESS_TOKEN,
          baseUrl: 'https://api.mapbox.com',
          directions: '/directions/v5/mapbox/walking',
          geocoding: '/geocoding/v5/mapbox.places',
          matrix: '/directions-matrix/v1/mapbox/walking'
        };
      case 'here':
        return {
          apiKey: process.env.HERE_API_KEY,
          baseUrl: 'https://router.hereapi.com/v8',
          directions: '/routes',
          geocoding: '/geocoder/autocomplete'
        };
      case 'osrm':
        return {
          baseUrl: process.env.OSRM_SERVER_URL || 'https://router.project-osrm.org',
          directions: '/route/v1/walking',
          matrix: '/table/v1/walking'
        };
      default:
        return null;
    }
  }

  /**
   * Update guard's real-time location
   * @param {string} guardId - Guard identifier
   * @param {Object} location - GPS coordinates and metadata
   */
  updateGuardLocation(guardId, location) {
    const locationData = {
      guard_id: guardId,
      latitude: location.latitude,
      longitude: location.longitude,
      accuracy: location.accuracy || 10,
      timestamp: new Date().toISOString(),
      speed: location.speed || 0,
      heading: location.heading || 0,
      battery_level: location.battery_level || null,
      app_status: location.app_status || 'active'
    };

    this.guardLocations.set(guardId, locationData);
    
    // Log location update
    console.log(`📍 Location updated for guard ${guardId}: ${location.latitude}, ${location.longitude}`);
    
    return locationData;
  }

  /**
   * Get current location of a guard
   * @param {string} guardId - Guard identifier
   */
  getGuardLocation(guardId) {
    return this.guardLocations.get(guardId) || null;
  }

  /**
   * Get all active guard locations
   */
  getAllGuardLocations() {
    return Array.from(this.guardLocations.values());
  }

  /**
   * Calculate optimal route between two points
   * @param {Object} origin - Starting coordinates
   * @param {Object} destination - Ending coordinates
   * @param {Object} options - Route calculation options
   */
  async calculateRoute(origin, destination, options = {}) {
    if (!this.initialized) {
      return this.calculateStraightLineRoute(origin, destination);
    }

    try {
      switch (this.provider) {
        case 'google':
          return await this.calculateGoogleRoute(origin, destination, options);
        case 'mapbox':
          return await this.calculateMapboxRoute(origin, destination, options);
        case 'here':
          return await this.calculateHereRoute(origin, destination, options);
        case 'osrm':
          return await this.calculateOSRMRoute(origin, destination, options);
        default:
          return this.calculateStraightLineRoute(origin, destination);
      }
    } catch (error) {
      console.error('Route calculation error:', error);
      // Fallback to straight-line calculation
      return this.calculateStraightLineRoute(origin, destination);
    }
  }

  /**
   * Google Maps route calculation
   */
  async calculateGoogleRoute(origin, destination, options) {
    const url = `${this.config.baseUrl}${this.config.directions}`;
    
    const params = {
      origin: `${origin.latitude},${origin.longitude}`,
      destination: `${destination.latitude},${destination.longitude}`,
      mode: options.mode || 'walking',
      key: this.config.apiKey,
      departure_time: options.departure_time || 'now',
      traffic_model: 'optimistic',
      alternatives: true
    };

    const response = await axios.get(url, { params });
    const route = response.data.routes[0];

    if (!route) {
      throw new Error('No route found');
    }

    return {
      provider: 'google',
      distance_meters: route.legs[0].distance.value,
      duration_seconds: route.legs[0].duration.value,
      duration_text: route.legs[0].duration.text,
      polyline: route.overview_polyline.points,
      steps: route.legs[0].steps.map(step => ({
        instruction: step.html_instructions.replace(/<[^>]*>/g, ''),
        distance: step.distance.value,
        duration: step.duration.value
      })),
      bounds: route.bounds,
      warnings: route.warnings || []
    };
  }

  /**
   * Mapbox route calculation
   */
  async calculateMapboxRoute(origin, destination, options) {
    const url = `${this.config.baseUrl}${this.config.directions}/${origin.longitude},${origin.latitude};${destination.longitude},${destination.latitude}`;
    
    const params = {
      access_token: this.config.apiKey,
      geometries: 'polyline',
      steps: true,
      voice_instructions: false
    };

    const response = await axios.get(url, { params });
    const route = response.data.routes[0];

    return {
      provider: 'mapbox',
      distance_meters: route.distance,
      duration_seconds: route.duration,
      duration_text: this.formatDuration(route.duration),
      polyline: route.geometry,
      steps: route.legs[0].steps.map(step => ({
        instruction: step.maneuver.instruction,
        distance: step.distance,
        duration: step.duration
      }))
    };
  }

  /**
   * HERE Maps route calculation
   */
  async calculateHereRoute(origin, destination, options) {
    const url = `${this.config.baseUrl}${this.config.directions}`;
    
    const params = {
      apikey: this.config.apiKey,
      origin: `${origin.latitude},${origin.longitude}`,
      destination: `${destination.latitude},${destination.longitude}`,
      transportMode: 'pedestrian',
      return: 'summary,polyline,instructions'
    };

    const response = await axios.get(url, { params });
    const route = response.data.routes[0];

    return {
      provider: 'here',
      distance_meters: route.sections[0].summary.length,
      duration_seconds: route.sections[0].summary.duration,
      duration_text: this.formatDuration(route.sections[0].summary.duration),
      polyline: route.sections[0].polyline,
      steps: route.sections[0].actions?.map(action => ({
        instruction: action.instruction,
        distance: action.length || 0,
        duration: action.duration || 0
      })) || []
    };
  }

  /**
   * OSRM route calculation (open source)
   */
  async calculateOSRMRoute(origin, destination, options) {
    const url = `${this.config.baseUrl}${this.config.directions}/${origin.longitude},${origin.latitude};${destination.longitude},${destination.latitude}`;
    
    const params = {
      geometries: 'polyline',
      steps: true,
      annotations: false
    };

    const response = await axios.get(url, { params });
    const route = response.data.routes[0];

    return {
      provider: 'osrm',
      distance_meters: route.distance,
      duration_seconds: route.duration,
      duration_text: this.formatDuration(route.duration),
      polyline: route.geometry,
      steps: route.legs[0].steps.map(step => ({
        instruction: step.maneuver.type,
        distance: step.distance,
        duration: step.duration
      }))
    };
  }

  /**
   * Fallback straight-line calculation
   */
  calculateStraightLineRoute(origin, destination) {
    const distance = this.calculateDistance(
      origin.latitude, origin.longitude,
      destination.latitude, destination.longitude
    );

    // Estimate walking time (1.4 m/s average walking speed)
    const walkingSpeed = 1.4; // meters per second
    const duration = Math.ceil(distance / walkingSpeed);

    return {
      provider: 'straight_line',
      distance_meters: Math.round(distance),
      duration_seconds: duration,
      duration_text: this.formatDuration(duration),
      polyline: null,
      steps: [
        {
          instruction: `Walk directly to destination`,
          distance: Math.round(distance),
          duration: duration
        }
      ],
      warning: 'Straight-line calculation used (no routing service available)'
    };
  }

  /**
   * Find nearest guards to a location
   * @param {Object} location - Target location
   * @param {number} maxDistance - Maximum distance in meters
   * @param {Array} excludeGuards - Guard IDs to exclude
   */
  async findNearestGuards(location, maxDistance = 5000, excludeGuards = []) {
    const nearbyGuards = [];
    
    for (const [guardId, guardLocation] of this.guardLocations) {
      if (excludeGuards.includes(guardId)) continue;
      
      const distance = this.calculateDistance(
        location.latitude, location.longitude,
        guardLocation.latitude, guardLocation.longitude
      );
      
      if (distance <= maxDistance) {
        // Calculate route for more accurate travel time
        const route = await this.calculateRoute(guardLocation, location);
        
        nearbyGuards.push({
          guard_id: guardId,
          current_location: guardLocation,
          straight_line_distance: Math.round(distance),
          route_distance: route.distance_meters,
          estimated_travel_time: route.duration_seconds,
          last_location_update: guardLocation.timestamp
        });
      }
    }
    
    // Sort by estimated travel time
    nearbyGuards.sort((a, b) => a.estimated_travel_time - b.estimated_travel_time);
    
    return nearbyGuards;
  }

  /**
   * Calculate distance between two coordinates using Haversine formula
   */
  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
  }

  /**
   * Format duration in seconds to human-readable text
   */
  formatDuration(seconds) {
    if (seconds < 60) return `${Math.round(seconds)}s`;
    if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
    return `${Math.floor(seconds / 3600)}h ${Math.round((seconds % 3600) / 60)}m`;
  }

  /**
   * Geocode address to coordinates
   * @param {string} address - Address to geocode
   */
  async geocodeAddress(address) {
    if (!this.initialized) {
      throw new Error('Geocoding service not configured');
    }

    try {
      switch (this.provider) {
        case 'google':
          return await this.geocodeGoogleAddress(address);
        case 'mapbox':
          return await this.geocodeMapboxAddress(address);
        default:
          throw new Error('Geocoding not supported for this provider');
      }
    } catch (error) {
      console.error('Geocoding error:', error);
      throw error;
    }
  }

  async geocodeGoogleAddress(address) {
    const url = `${this.config.baseUrl}${this.config.geocoding}`;
    const params = {
      address: address,
      key: this.config.apiKey
    };

    const response = await axios.get(url, { params });
    const result = response.data.results[0];

    if (!result) {
      throw new Error('Address not found');
    }

    return {
      latitude: result.geometry.location.lat,
      longitude: result.geometry.location.lng,
      formatted_address: result.formatted_address,
      place_id: result.place_id
    };
  }

  async geocodeMapboxAddress(address) {
    const url = `${this.config.baseUrl}${this.config.geocoding}/${encodeURIComponent(address)}.json`;
    const params = {
      access_token: this.config.apiKey,
      limit: 1
    };

    const response = await axios.get(url, { params });
    const result = response.data.features[0];

    if (!result) {
      throw new Error('Address not found');
    }

    return {
      latitude: result.center[1],
      longitude: result.center[0],
      formatted_address: result.place_name,
      place_id: result.id
    };
  }

  /**
   * Create geofence for property monitoring
   * @param {Object} center - Center coordinates
   * @param {number} radius - Radius in meters
   * @param {string} propertyId - Property identifier
   */
  createGeofence(center, radius, propertyId) {
    const geofence = {
      property_id: propertyId,
      center: center,
      radius: radius,
      created_at: new Date().toISOString(),
      alerts_enabled: true
    };

    // Store geofence (would typically be in database)
    console.log(`📍 Geofence created for property ${propertyId}: ${radius}m radius`);
    
    return geofence;
  }

  /**
   * Check if guard is within geofence
   * @param {string} guardId - Guard identifier
   * @param {Object} geofence - Geofence definition
   */
  isGuardInGeofence(guardId, geofence) {
    const guardLocation = this.getGuardLocation(guardId);
    
    if (!guardLocation) {
      return false;
    }

    const distance = this.calculateDistance(
      guardLocation.latitude, guardLocation.longitude,
      geofence.center.latitude, geofence.center.longitude
    );

    return distance <= geofence.radius;
  }

  /**
   * Get service health status
   */
  async getServiceHealth() {
    return {
      provider: this.provider,
      initialized: this.initialized,
      active_guard_tracking: this.guardLocations.size,
      last_check: new Date().toISOString()
    };
  }

  /**
   * Clean up old location data
   */
  cleanupOldLocations(maxAgeMinutes = 30) {
    const cutoffTime = new Date(Date.now() - maxAgeMinutes * 60 * 1000);
    let removedCount = 0;

    for (const [guardId, location] of this.guardLocations) {
      if (new Date(location.timestamp) < cutoffTime) {
        this.guardLocations.delete(guardId);
        removedCount++;
      }
    }

    if (removedCount > 0) {
      console.log(`🧹 Cleaned up ${removedCount} old guard locations`);
    }

    return removedCount;
  }
}

export default new GPSRoutingService();