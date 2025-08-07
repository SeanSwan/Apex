#!/usr/bin/env node

/**
 * API VALIDATION SERVICE - MASTER PROMPT v52.0
 * =============================================
 * Service layer for API connectivity validation and management
 * 
 * Features:
 * - Cached API status monitoring
 * - Circuit breaker pattern implementation
 * - Graceful degradation handling
 * - Automatic retry logic
 * - Real-time status notifications
 * - Performance monitoring
 * - Configuration validation
 */

import { 
  checkAllSystemHealth, 
  checkEssentialHealth,
  checkTwilioHealth,
  checkDeepgramHealth,
  checkElevenLabsHealth,
  checkOllamaHealth,
  checkDatabaseHealth
} from '../utils/apiHealthCheck.mjs';

class ApiValidationService {
  constructor() {
    this.statusCache = new Map();
    this.cacheTimeout = 30000; // 30 seconds
    this.circuitBreakers = new Map();
    this.subscribers = new Set();
    this.lastFullCheck = null;
    
    // Initialize circuit breakers for each service
    const services = ['twilio', 'deepgram', 'elevenlabs', 'ollama', 'database'];
    services.forEach(service => {
      this.circuitBreakers.set(service, {
        state: 'closed', // closed, open, half-open
        failures: 0,
        lastFailure: null,
        timeout: 60000, // 1 minute
        threshold: 3 // failures before opening circuit
      });
    });

    // Start background health monitoring
    this.startBackgroundMonitoring();
  }

  /**
   * Subscribe to API status changes
   */
  subscribe(callback) {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  /**
   * Notify all subscribers of status changes
   */
  notifySubscribers(service, oldStatus, newStatus) {
    const notification = {
      service,
      oldStatus,
      newStatus,
      timestamp: new Date().toISOString()
    };

    this.subscribers.forEach(callback => {
      try {
        callback(notification);
      } catch (error) {
        console.error('Error notifying subscriber:', error);
      }
    });
  }

  /**
   * Get cached API status or perform fresh check
   */
  async getApiStatus(service, forceRefresh = false) {
    const cacheKey = `status_${service}`;
    const cachedResult = this.statusCache.get(cacheKey);
    
    // Return cached result if valid and not forcing refresh
    if (!forceRefresh && cachedResult && 
        (Date.now() - cachedResult.timestamp) < this.cacheTimeout) {
      return cachedResult.data;
    }

    // Check circuit breaker
    const circuitBreaker = this.circuitBreakers.get(service);
    if (circuitBreaker && circuitBreaker.state === 'open') {
      const timeSinceLastFailure = Date.now() - circuitBreaker.lastFailure;
      if (timeSinceLastFailure < circuitBreaker.timeout) {
        // Circuit is open, return last known status
        return cachedResult?.data || { 
          service, 
          status: 'error', 
          error: 'Service temporarily unavailable (circuit breaker open)' 
        };
      } else {
        // Try to half-open the circuit
        circuitBreaker.state = 'half-open';
      }
    }

    // Perform health check based on service
    let result;
    try {
      switch (service) {
        case 'twilio':
          result = await checkTwilioHealth();
          break;
        case 'deepgram':
          result = await checkDeepgramHealth();
          break;
        case 'elevenlabs':
          result = await checkElevenLabsHealth();
          break;
        case 'ollama':
          result = await checkOllamaHealth();
          break;
        case 'database':
          result = await checkDatabaseHealth();
          break;
        default:
          throw new Error(`Unknown service: ${service}`);
      }

      // Update circuit breaker on success
      if (result.status === 'connected') {
        this.resetCircuitBreaker(service);
      } else {
        this.recordFailure(service);
      }

      // Cache the result
      const oldStatus = cachedResult?.data?.status;
      this.statusCache.set(cacheKey, {
        data: result,
        timestamp: Date.now()
      });

      // Notify subscribers if status changed
      if (oldStatus && oldStatus !== result.status) {
        this.notifySubscribers(service, oldStatus, result.status);
      }

      return result;

    } catch (error) {
      this.recordFailure(service);
      
      const errorResult = {
        service,
        status: 'error',
        error: error.message,
        timestamp: new Date().toISOString()
      };

      // Cache error result for shorter time
      this.statusCache.set(cacheKey, {
        data: errorResult,
        timestamp: Date.now()
      });

      return errorResult;
    }
  }

  /**
   * Record failure and update circuit breaker
   */
  recordFailure(service) {
    const circuitBreaker = this.circuitBreakers.get(service);
    if (circuitBreaker) {
      circuitBreaker.failures++;
      circuitBreaker.lastFailure = Date.now();
      
      if (circuitBreaker.failures >= circuitBreaker.threshold) {
        circuitBreaker.state = 'open';
        console.warn(`🔴 Circuit breaker opened for ${service} service`);
      }
    }
  }

  /**
   * Reset circuit breaker on successful connection
   */
  resetCircuitBreaker(service) {
    const circuitBreaker = this.circuitBreakers.get(service);
    if (circuitBreaker) {
      circuitBreaker.failures = 0;
      circuitBreaker.state = 'closed';
      circuitBreaker.lastFailure = null;
    }
  }

  /**
   * Get comprehensive system status
   */
  async getSystemStatus(forceRefresh = false) {
    if (!forceRefresh && this.lastFullCheck && 
        (Date.now() - this.lastFullCheck.timestamp) < this.cacheTimeout) {
      return this.lastFullCheck.data;
    }

    try {
      const systemHealth = await checkAllSystemHealth();
      
      this.lastFullCheck = {
        data: systemHealth,
        timestamp: Date.now()
      };

      // Update individual service caches
      Object.entries(systemHealth.services).forEach(([service, result]) => {
        this.statusCache.set(`status_${service}`, {
          data: result,
          timestamp: Date.now()
        });
      });

      return systemHealth;

    } catch (error) {
      console.error('Error getting system status:', error);
      return {
        overall_status: 'error',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Get essential services status (database + ollama only)
   */
  async getEssentialStatus() {
    try {
      const essentialHealth = await checkEssentialHealth();
      return {
        overall_status: Object.values(essentialHealth).every(r => r.status === 'connected') ? 'healthy' : 'degraded',
        services: essentialHealth,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        overall_status: 'error',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Validate API configuration completeness
   */
  validateApiConfiguration() {
    const results = {
      twilio: this.validateTwilioConfig(),
      deepgram: this.validateDeepgramConfig(),
      elevenlabs: this.validateElevenLabsConfig(),
      ollama: this.validateOllamaConfig(),
      database: this.validateDatabaseConfig()
    };

    const overallValid = Object.values(results).every(result => result.valid);
    
    return {
      overall_valid: overallValid,
      services: results,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Validate Twilio configuration
   */
  validateTwilioConfig() {
    const requiredVars = ['TWILIO_ACCOUNT_SID', 'TWILIO_AUTH_TOKEN', 'TWILIO_PHONE_NUMBER'];
    const missing = requiredVars.filter(varName => !process.env[varName]);
    
    return {
      service: 'twilio',
      valid: missing.length === 0,
      missing_variables: missing,
      configured_variables: requiredVars.filter(varName => process.env[varName])
    };
  }

  /**
   * Validate Deepgram configuration
   */
  validateDeepgramConfig() {
    const requiredVars = ['DEEPGRAM_API_KEY'];
    const missing = requiredVars.filter(varName => !process.env[varName]);
    
    return {
      service: 'deepgram',
      valid: missing.length === 0,
      missing_variables: missing,
      configured_variables: requiredVars.filter(varName => process.env[varName])
    };
  }

  /**
   * Validate ElevenLabs configuration
   */
  validateElevenLabsConfig() {
    const requiredVars = ['ELEVENLABS_API_KEY'];
    const optionalVars = ['ELEVENLABS_VOICE_ID'];
    const missing = requiredVars.filter(varName => !process.env[varName]);
    
    return {
      service: 'elevenlabs',
      valid: missing.length === 0,
      missing_variables: missing,
      configured_variables: requiredVars.filter(varName => process.env[varName]),
      optional_variables: optionalVars.filter(varName => process.env[varName])
    };
  }

  /**
   * Validate Ollama configuration
   */
  validateOllamaConfig() {
    const defaultUrl = 'http://localhost:11434';
    const defaultModel = 'llama3:latest';
    
    return {
      service: 'ollama',
      valid: true, // Ollama uses defaults if not configured
      base_url: process.env.OLLAMA_BASE_URL || defaultUrl,
      model: process.env.OLLAMA_MODEL || defaultModel,
      using_defaults: !process.env.OLLAMA_BASE_URL || !process.env.OLLAMA_MODEL
    };
  }

  /**
   * Validate Database configuration
   */
  validateDatabaseConfig() {
    const requiredVars = ['PG_HOST', 'PG_DB', 'PG_USER'];
    const missing = requiredVars.filter(varName => !process.env[varName]);
    
    return {
      service: 'database',
      valid: missing.length === 0,
      missing_variables: missing,
      configured_variables: requiredVars.filter(varName => process.env[varName])
    };
  }

  /**
   * Get service readiness for Voice AI operations
   */
  async getVoiceAIReadiness() {
    const systemStatus = await this.getSystemStatus();
    const configValidation = this.validateApiConfiguration();
    
    // Essential services for Voice AI
    const essentialServices = ['database', 'ollama'];
    const voiceServices = ['twilio', 'deepgram', 'elevenlabs'];
    
    const essentialReady = essentialServices.every(service => 
      systemStatus.services[service]?.status === 'connected'
    );
    
    const voiceReady = voiceServices.every(service => 
      systemStatus.services[service]?.status === 'connected'
    );
    
    const configReady = configValidation.overall_valid;
    
    let readinessLevel;
    if (essentialReady && voiceReady && configReady) {
      readinessLevel = 'fully_operational';
    } else if (essentialReady && configReady) {
      readinessLevel = 'degraded_mode'; // Can run with local LLM only
    } else if (essentialReady) {
      readinessLevel = 'configuration_required';
    } else {
      readinessLevel = 'not_ready';
    }
    
    return {
      readiness_level: readinessLevel,
      essential_services_ready: essentialReady,
      voice_services_ready: voiceReady,
      configuration_ready: configReady,
      system_status: systemStatus,
      configuration_status: configValidation,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Start background monitoring
   */
  startBackgroundMonitoring() {
    // Check essential services every 30 seconds
    setInterval(async () => {
      try {
        await this.getEssentialStatus();
      } catch (error) {
        console.error('Background monitoring error:', error);
      }
    }, 30000);

    // Full system check every 5 minutes
    setInterval(async () => {
      try {
        await this.getSystemStatus(true);
      } catch (error) {
        console.error('Background full check error:', error);
      }
    }, 300000);
  }

  /**
   * Get circuit breaker status for all services
   */
  getCircuitBreakerStatus() {
    const status = {};
    this.circuitBreakers.forEach((breaker, service) => {
      status[service] = {
        state: breaker.state,
        failures: breaker.failures,
        last_failure: breaker.lastFailure,
        timeout: breaker.timeout
      };
    });
    return status;
  }

  /**
   * Manually reset circuit breaker for a service
   */
  resetCircuitBreakerManually(service) {
    if (this.circuitBreakers.has(service)) {
      this.resetCircuitBreaker(service);
      console.log(`🟢 Circuit breaker manually reset for ${service}`);
      return true;
    }
    return false;
  }
}

// Create singleton instance
const apiValidationService = new ApiValidationService();

export default apiValidationService;
export { ApiValidationService };
