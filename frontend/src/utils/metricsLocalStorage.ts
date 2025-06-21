// File: frontend/src/utils/metricsLocalStorage.ts
/**
 * 🎯 APEX AI ALCHEMIST - LOCALSTORAGE PERSISTENCE FOR EDIT METRICS
 * 
 * This utility provides client-specific localStorage persistence for the Property Info
 * Edit Metrics functionality. Values are remembered across tab navigation and only
 * cleared on F5 (page refresh).
 * 
 * Key Features:
 * ✅ Client-specific storage keys to prevent data conflicts
 * ✅ JSON serialization for complex metric objects
 * ✅ Validation layer to ensure data integrity on restore
 * ✅ Graceful fallbacks if localStorage is unavailable
 * ✅ Automatic cleanup of old/invalid data
 */

import { MetricsData } from '../types/reports';

// Storage key prefix for Apex AI metrics
const STORAGE_PREFIX = 'apex-ai-metrics-edit';

// Version for schema validation
const STORAGE_VERSION = '1.0';

interface StoredMetricsData {
  version: string;
  clientId: string;
  clientName: string;
  timestamp: number;
  metrics: MetricsData;
  isEditing: boolean;
}

/**
 * Generate a client-specific storage key
 */
const getStorageKey = (clientId: string): string => {
  return `${STORAGE_PREFIX}-${clientId}`;
};

/**
 * Check if localStorage is available and working
 */
const isLocalStorageAvailable = (): boolean => {
  try {
    const test = '__localStorage_test__';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch (e) {
    console.warn('⚠️ localStorage not available:', e);
    return false;
  }
};

/**
 * Validate stored metrics data structure
 */
const validateStoredData = (data: any): data is StoredMetricsData => {
  if (!data || typeof data !== 'object') return false;
  
  const required = ['version', 'clientId', 'clientName', 'timestamp', 'metrics'];
  const hasRequiredFields = required.every(field => field in data);
  
  if (!hasRequiredFields) {
    console.warn('⚠️ Invalid stored metrics data - missing required fields');
    return false;
  }
  
  // Check if version is compatible
  if (data.version !== STORAGE_VERSION) {
    console.warn('⚠️ Stored metrics data version mismatch');
    return false;
  }
  
  // Validate metrics structure
  const metrics = data.metrics;
  if (!metrics || typeof metrics !== 'object') {
    console.warn('⚠️ Invalid metrics object in stored data');
    return false;
  }
  
  return true;
};

/**
 * Save edited metrics to localStorage for a specific client
 */
export const saveEditedMetrics = (
  clientId: string,
  clientName: string,
  metrics: MetricsData,
  isEditing: boolean = true
): boolean => {
  if (!isLocalStorageAvailable()) return false;
  
  try {
    const storageKey = getStorageKey(clientId);
    const dataToStore: StoredMetricsData = {
      version: STORAGE_VERSION,
      clientId,
      clientName,
      timestamp: Date.now(),
      metrics,
      isEditing
    };
    
    localStorage.setItem(storageKey, JSON.stringify(dataToStore));
    
    console.log('💾 Saved edited metrics to localStorage:', {
      client: clientName,
      storageKey,
      isEditing,
      metricsKeys: Object.keys(metrics)
    });
    
    return true;
  } catch (error) {
    console.error('❌ Failed to save edited metrics to localStorage:', error);
    return false;
  }
};

/**
 * Load edited metrics from localStorage for a specific client
 */
export const loadEditedMetrics = (
  clientId: string
): { metrics: MetricsData; isEditing: boolean } | null => {
  if (!isLocalStorageAvailable()) return null;
  
  try {
    const storageKey = getStorageKey(clientId);
    const storedData = localStorage.getItem(storageKey);
    
    if (!storedData) {
      console.log('📂 No stored edited metrics found for client:', clientId);
      return null;
    }
    
    const parsedData = JSON.parse(storedData);
    
    if (!validateStoredData(parsedData)) {
      // Clean up invalid data
      localStorage.removeItem(storageKey);
      return null;
    }
    
    // Check if data is not too old (optional - remove if not needed)
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours
    const dataAge = Date.now() - parsedData.timestamp;
    if (dataAge > maxAge) {
      console.log('🗑️ Stored metrics data too old, clearing:', {
        client: parsedData.clientName,
        ageHours: Math.round(dataAge / (60 * 60 * 1000))
      });
      localStorage.removeItem(storageKey);
      return null;
    }
    
    console.log('📂 Loaded edited metrics from localStorage:', {
      client: parsedData.clientName,
      isEditing: parsedData.isEditing,
      ageMinutes: Math.round(dataAge / (60 * 1000))
    });
    
    return {
      metrics: parsedData.metrics,
      isEditing: parsedData.isEditing
    };
    
  } catch (error) {
    console.error('❌ Failed to load edited metrics from localStorage:', error);
    return null;
  }
};

/**
 * Clear edited metrics from localStorage for a specific client
 */
export const clearEditedMetrics = (clientId: string): boolean => {
  if (!isLocalStorageAvailable()) return false;
  
  try {
    const storageKey = getStorageKey(clientId);
    localStorage.removeItem(storageKey);
    
    console.log('🗑️ Cleared edited metrics from localStorage for client:', clientId);
    return true;
  } catch (error) {
    console.error('❌ Failed to clear edited metrics from localStorage:', error);
    return false;
  }
};

/**
 * Check if there are edited metrics stored for a specific client
 */
export const hasEditedMetrics = (clientId: string): boolean => {
  if (!isLocalStorageAvailable()) return false;
  
  try {
    const storageKey = getStorageKey(clientId);
    const storedData = localStorage.getItem(storageKey);
    return storedData !== null;
  } catch (error) {
    console.error('❌ Failed to check for edited metrics in localStorage:', error);
    return false;
  }
};

/**
 * Get all stored metrics keys (for debugging/cleanup)
 */
export const getAllStoredMetricsKeys = (): string[] => {
  if (!isLocalStorageAvailable()) return [];
  
  try {
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(STORAGE_PREFIX)) {
        keys.push(key);
      }
    }
    return keys;
  } catch (error) {
    console.error('❌ Failed to get stored metrics keys:', error);
    return [];
  }
};

/**
 * Clean up old/invalid stored metrics (utility function)
 */
export const cleanupOldMetrics = (): number => {
  if (!isLocalStorageAvailable()) return 0;
  
  let cleanedCount = 0;
  const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days
  
  try {
    const keys = getAllStoredMetricsKeys();
    
    for (const key of keys) {
      try {
        const storedData = localStorage.getItem(key);
        if (!storedData) continue;
        
        const parsedData = JSON.parse(storedData);
        
        if (!validateStoredData(parsedData)) {
          localStorage.removeItem(key);
          cleanedCount++;
          console.log('🗑️ Removed invalid stored metrics:', key);
          continue;
        }
        
        const dataAge = Date.now() - parsedData.timestamp;
        if (dataAge > maxAge) {
          localStorage.removeItem(key);
          cleanedCount++;
          console.log('🗑️ Removed old stored metrics:', {
            key,
            client: parsedData.clientName,
            ageDays: Math.round(dataAge / (24 * 60 * 60 * 1000))
          });
        }
      } catch (error) {
        // If we can't parse this key, remove it
        localStorage.removeItem(key);
        cleanedCount++;
        console.log('🗑️ Removed corrupted stored metrics:', key);
      }
    }
    
    if (cleanedCount > 0) {
      console.log(`🧹 Cleaned up ${cleanedCount} old/invalid stored metrics`);
    }
    
    return cleanedCount;
  } catch (error) {
    console.error('❌ Failed to cleanup old metrics:', error);
    return 0;
  }
};

/**
 * Debug function to log all stored metrics
 */
export const debugStoredMetrics = (): void => {
  if (!isLocalStorageAvailable()) {
    console.log('🐛 DEBUG: localStorage not available');
    return;
  }
  
  const keys = getAllStoredMetricsKeys();
  console.log('🐛 DEBUG: Stored metrics overview:', {
    totalKeys: keys.length,
    keys: keys
  });
  
  keys.forEach(key => {
    try {
      const storedData = localStorage.getItem(key);
      if (storedData) {
        const parsedData = JSON.parse(storedData);
        if (validateStoredData(parsedData)) {
          console.log(`🐛 DEBUG: ${key}:`, {
            client: parsedData.clientName,
            isEditing: parsedData.isEditing,
            ageMinutes: Math.round((Date.now() - parsedData.timestamp) / (60 * 1000)),
            metricsKeys: Object.keys(parsedData.metrics)
          });
        }
      }
    } catch (error) {
      console.log(`🐛 DEBUG: Invalid data in ${key}:`, error);
    }
  });
};

// Export all functions
export default {
  saveEditedMetrics,
  loadEditedMetrics,
  clearEditedMetrics,
  hasEditedMetrics,
  getAllStoredMetricsKeys,
  cleanupOldMetrics,
  debugStoredMetrics
};