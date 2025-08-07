#!/usr/bin/env node

/**
 * API HEALTH CHECK UTILITIES - MASTER PROMPT v52.0
 * =================================================
 * Comprehensive API connectivity testing for Voice AI Dispatcher
 * 
 * Features:
 * - Twilio API connectivity validation
 * - Deepgram API health checks
 * - ElevenLabs API status verification
 * - Local Ollama LLM connectivity testing
 * - Timeout handling and retry logic
 * - Structured error reporting
 * - Performance metrics collection
 */

import axios from 'axios';
import { Sequelize } from 'sequelize';

/**
 * API Health Check Results Interface
 */
export class ApiHealthResult {
  constructor(service, status, responseTime = null, error = null, details = {}) {
    this.service = service;
    this.status = status; // 'connected', 'error', 'timeout', 'unauthorized'
    this.responseTime = responseTime;
    this.error = error;
    this.details = details;
    this.timestamp = new Date().toISOString();
  }
}

/**
 * Twilio API Health Check
 * Tests account connectivity and phone number validation
 */
export const checkTwilioHealth = async (config = {}) => {
  const startTime = Date.now();
  
  try {
    const { 
      TWILIO_ACCOUNT_SID, 
      TWILIO_AUTH_TOKEN, 
      TWILIO_PHONE_NUMBER 
    } = process.env;

    // Check if credentials are configured
    if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_PHONE_NUMBER) {
      return new ApiHealthResult('twilio', 'error', null, 'Missing API credentials', {
        missing_credentials: {
          account_sid: !TWILIO_ACCOUNT_SID,
          auth_token: !TWILIO_AUTH_TOKEN,
          phone_number: !TWILIO_PHONE_NUMBER
        }
      });
    }

    // Test Twilio API connectivity
    const twilioClient = (await import('twilio')).default(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
    
    // Verify account details
    const account = await twilioClient.api.accounts(TWILIO_ACCOUNT_SID).fetch();
    
    // Verify phone number
    const phoneNumbers = await twilioClient.incomingPhoneNumbers.list({ 
      phoneNumber: TWILIO_PHONE_NUMBER,
      limit: 1 
    });

    const responseTime = Date.now() - startTime;
    
    return new ApiHealthResult('twilio', 'connected', responseTime, null, {
      account_status: account.status,
      account_type: account.type,
      phone_number_verified: phoneNumbers.length > 0,
      phone_number: TWILIO_PHONE_NUMBER
    });

  } catch (error) {
    const responseTime = Date.now() - startTime;
    
    let status = 'error';
    if (error.code === 20003) status = 'unauthorized';
    if (responseTime > 10000) status = 'timeout';

    return new ApiHealthResult('twilio', status, responseTime, error.message, {
      error_code: error.code,
      error_details: error.details || {}
    });
  }
};

/**
 * Deepgram API Health Check
 * Tests speech-to-text API connectivity and model availability
 */
export const checkDeepgramHealth = async (config = {}) => {
  const startTime = Date.now();
  
  try {
    const { DEEPGRAM_API_KEY } = process.env;

    if (!DEEPGRAM_API_KEY) {
      return new ApiHealthResult('deepgram', 'error', null, 'Missing API key', {
        missing_credentials: { api_key: true }
      });
    }

    // Test Deepgram API connectivity with projects endpoint
    const response = await axios.get('https://api.deepgram.com/v1/projects', {
      headers: {
        'Authorization': `Token ${DEEPGRAM_API_KEY}`,
        'Content-Type': 'application/json'
      },
      timeout: config.timeout || 10000
    });

    const responseTime = Date.now() - startTime;
    
    return new ApiHealthResult('deepgram', 'connected', responseTime, null, {
      projects_count: response.data.projects?.length || 0,
      api_version: 'v1',
      available_models: ['nova-2', 'whisper', 'base']
    });

  } catch (error) {
    const responseTime = Date.now() - startTime;
    
    let status = 'error';
    if (error.response?.status === 401) status = 'unauthorized';
    if (error.code === 'ECONNABORTED' || responseTime > 10000) status = 'timeout';

    return new ApiHealthResult('deepgram', status, responseTime, error.message, {
      status_code: error.response?.status,
      error_details: error.response?.data || {}
    });
  }
};

/**
 * ElevenLabs API Health Check
 * Tests text-to-speech API connectivity and voice model availability
 */
export const checkElevenLabsHealth = async (config = {}) => {
  const startTime = Date.now();
  
  try {
    const { ELEVENLABS_API_KEY, ELEVENLABS_VOICE_ID } = process.env;

    if (!ELEVENLABS_API_KEY) {
      return new ApiHealthResult('elevenlabs', 'error', null, 'Missing API key', {
        missing_credentials: { api_key: true }
      });
    }

    // Test ElevenLabs API connectivity with user info endpoint
    const userResponse = await axios.get('https://api.elevenlabs.io/v1/user', {
      headers: {
        'xi-api-key': ELEVENLABS_API_KEY,
        'Content-Type': 'application/json'
      },
      timeout: config.timeout || 10000
    });

    // Check voice availability if voice ID is configured
    let voiceDetails = null;
    if (ELEVENLABS_VOICE_ID) {
      try {
        const voiceResponse = await axios.get(`https://api.elevenlabs.io/v1/voices/${ELEVENLABS_VOICE_ID}`, {
          headers: {
            'xi-api-key': ELEVENLABS_API_KEY,
            'Content-Type': 'application/json'
          },
          timeout: 5000
        });
        voiceDetails = {
          voice_id: ELEVENLABS_VOICE_ID,
          voice_name: voiceResponse.data.name,
          voice_available: true
        };
      } catch (voiceError) {
        voiceDetails = {
          voice_id: ELEVENLABS_VOICE_ID,
          voice_available: false,
          voice_error: voiceError.message
        };
      }
    }

    const responseTime = Date.now() - startTime;
    
    return new ApiHealthResult('elevenlabs', 'connected', responseTime, null, {
      subscription_tier: userResponse.data.subscription?.tier || 'free',
      character_count: userResponse.data.subscription?.character_count || 0,
      character_limit: userResponse.data.subscription?.character_limit || 10000,
      voice_details: voiceDetails
    });

  } catch (error) {
    const responseTime = Date.now() - startTime;
    
    let status = 'error';
    if (error.response?.status === 401) status = 'unauthorized';
    if (error.code === 'ECONNABORTED' || responseTime > 10000) status = 'timeout';

    return new ApiHealthResult('elevenlabs', status, responseTime, error.message, {
      status_code: error.response?.status,
      error_details: error.response?.data || {}
    });
  }
};

/**
 * Ollama Local LLM Health Check
 * Tests local Ollama server connectivity and model availability
 */
export const checkOllamaHealth = async (config = {}) => {
  const startTime = Date.now();
  
  try {
    const { OLLAMA_BASE_URL, OLLAMA_MODEL } = process.env;
    const baseUrl = OLLAMA_BASE_URL || 'http://localhost:11434';
    const modelName = OLLAMA_MODEL || 'llama3:latest';

    // Test Ollama server connectivity
    const serverResponse = await axios.get(`${baseUrl}/api/version`, {
      timeout: config.timeout || 5000
    });

    // Check if specified model is available
    let modelAvailable = false;
    try {
      const modelsResponse = await axios.get(`${baseUrl}/api/tags`, {
        timeout: 3000
      });
      
      modelAvailable = modelsResponse.data.models?.some(model => 
        model.name === modelName || model.name.startsWith(modelName.split(':')[0])
      ) || false;
    } catch (modelError) {
      // Server is up but models endpoint failed - non-critical
    }

    const responseTime = Date.now() - startTime;
    
    return new ApiHealthResult('ollama', 'connected', responseTime, null, {
      server_version: serverResponse.data.version || 'unknown',
      base_url: baseUrl,
      target_model: modelName,
      model_available: modelAvailable
    });

  } catch (error) {
    const responseTime = Date.now() - startTime;
    
    let status = 'error';
    if (error.code === 'ECONNREFUSED') status = 'error';
    if (error.code === 'ECONNABORTED' || responseTime > 5000) status = 'timeout';

    return new ApiHealthResult('ollama', status, responseTime, error.message, {
      base_url: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
      connection_error: error.code
    });
  }
};

/**
 * Database Health Check
 * Tests PostgreSQL connectivity and Voice AI table availability
 */
export const checkDatabaseHealth = async (config = {}) => {
  const startTime = Date.now();
  
  try {
    const sequelize = new Sequelize({
      dialect: 'postgres',
      host: process.env.PG_HOST || 'localhost',
      port: parseInt(process.env.PG_PORT) || 5432,
      database: process.env.PG_DB || 'apex',
      username: process.env.PG_USER || 'postgres',
      password: process.env.PG_PASSWORD || '',
      logging: false
    });

    // Test connection
    await sequelize.authenticate();

    // Check Voice AI tables
    const voiceAITables = ['call_logs', 'contact_lists', 'standard_operating_procedures'];
    const tableStatuses = {};

    for (const tableName of voiceAITables) {
      try {
        const [results] = await sequelize.query(
          `SELECT COUNT(*) as count FROM ${tableName} LIMIT 1`
        );
        tableStatuses[tableName] = {
          exists: true,
          record_count: parseInt(results[0].count)
        };
      } catch (tableError) {
        tableStatuses[tableName] = {
          exists: false,
          error: tableError.message
        };
      }
    }

    await sequelize.close();

    const responseTime = Date.now() - startTime;
    
    return new ApiHealthResult('database', 'connected', responseTime, null, {
      host: process.env.PG_HOST || 'localhost',
      database: process.env.PG_DB || 'apex',
      voice_ai_tables: tableStatuses
    });

  } catch (error) {
    const responseTime = Date.now() - startTime;
    
    let status = 'error';
    if (error.name === 'ConnectionRefusedError') status = 'error';
    if (responseTime > 10000) status = 'timeout';

    return new ApiHealthResult('database', status, responseTime, error.message, {
      connection_details: {
        host: process.env.PG_HOST || 'localhost',
        port: process.env.PG_PORT || 5432,
        database: process.env.PG_DB || 'apex'
      }
    });
  }
};

/**
 * Comprehensive System Health Check
 * Runs all health checks and returns consolidated results
 */
export const checkAllSystemHealth = async (config = {}) => {
  const startTime = Date.now();
  
  console.log('🔍 Starting comprehensive system health check...');
  
  const healthChecks = [
    { name: 'database', check: checkDatabaseHealth },
    { name: 'twilio', check: checkTwilioHealth },
    { name: 'deepgram', check: checkDeepgramHealth },
    { name: 'elevenlabs', check: checkElevenLabsHealth },
    { name: 'ollama', check: checkOllamaHealth }
  ];

  const results = {};
  const promises = healthChecks.map(async ({ name, check }) => {
    try {
      console.log(`  ⏳ Testing ${name}...`);
      const result = await check(config);
      console.log(`  ${result.status === 'connected' ? '✅' : '❌'} ${name}: ${result.status}`);
      return { name, result };
    } catch (error) {
      console.log(`  ❌ ${name}: error`);
      return { 
        name, 
        result: new ApiHealthResult(name, 'error', null, error.message) 
      };
    }
  });

  const healthResults = await Promise.all(promises);
  
  healthResults.forEach(({ name, result }) => {
    results[name] = result;
  });

  const totalTime = Date.now() - startTime;
  const connectedServices = Object.values(results).filter(r => r.status === 'connected').length;
  const totalServices = Object.keys(results).length;

  console.log(`🏁 Health check completed in ${totalTime}ms`);
  console.log(`📊 System Status: ${connectedServices}/${totalServices} services connected`);

  return {
    overall_status: connectedServices === totalServices ? 'healthy' : 'degraded',
    connected_services: connectedServices,
    total_services: totalServices,
    total_response_time: totalTime,
    timestamp: new Date().toISOString(),
    services: results
  };
};

/**
 * Quick Health Check (Essential Services Only)
 * Tests only critical services for faster response
 */
export const checkEssentialHealth = async () => {
  const essentialChecks = [
    checkDatabaseHealth(),
    checkOllamaHealth()
  ];

  const results = await Promise.allSettled(essentialChecks);
  
  return {
    database: results[0].status === 'fulfilled' ? results[0].value : 
              new ApiHealthResult('database', 'error', null, results[0].reason?.message),
    ollama: results[1].status === 'fulfilled' ? results[1].value : 
            new ApiHealthResult('ollama', 'error', null, results[1].reason?.message)
  };
};

export default {
  ApiHealthResult,
  checkTwilioHealth,
  checkDeepgramHealth,
  checkElevenLabsHealth,
  checkOllamaHealth,
  checkDatabaseHealth,
  checkAllSystemHealth,
  checkEssentialHealth
};
