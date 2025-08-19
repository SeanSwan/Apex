// client-portal/src/services/clientAPI.ts
/**
 * Client Portal API Service - ENHANCED FOR EXECUTIVE DASHBOARD
 * =============================================================
 * Handles all API communications for the Aegis Client Portal
 * including dashboard data, incidents, evidence, and analytics
 */

import axios, { AxiosResponse, AxiosRequestConfig } from 'axios';
import toast from 'react-hot-toast';

// ===========================
// CONFIGURATION & CONSTANTS
// ===========================

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';
const CLIENT_API_BASE = `${API_BASE_URL}/client/v1`;

// Request timeout configuration
const DEFAULT_TIMEOUT = 30000; // 30 seconds
const LONG_REQUEST_TIMEOUT = 60000; // 60 seconds for exports/downloads

// ===========================
// AXIOS INSTANCE CONFIGURATION
// ===========================

// Create axios instance for API requests
const apiClient = axios.create({
  baseURL: CLIENT_API_BASE,
  timeout: DEFAULT_TIMEOUT,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'X-Client-Portal': 'aegis-v1.0'
  }
});

// Request interceptor to add auth token and handle request logging
apiClient.interceptors.request.use(
  (config) => {
    // Add authentication token
    const token = localStorage.getItem('aegis_access_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Add request timestamp for debugging
    config.metadata = { startTime: Date.now() };
    
    // Log API requests in development
    if (import.meta.env.DEV) {
      console.log(`[CLIENT-API] ${config.method?.toUpperCase()} ${config.url}`, config.params || config.data);
    }
    
    return config;
  },
  (error) => {
    console.error('[CLIENT-API] Request error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor to handle responses and errors
apiClient.interceptors.response.use(
  (response) => {
    // Log response time in development
    if (import.meta.env.DEV && response.config.metadata) {
      const duration = Date.now() - response.config.metadata.startTime;
      console.log(`[CLIENT-API] Response ${response.status} in ${duration}ms:`, response.config.url);
    }
    
    return response;
  },
  async (error) => {
    const { response, config } = error;
    
    // Log error details
    console.error('[CLIENT-API] Response error:', {
      status: response?.status,
      url: config?.url,
      message: response?.data?.message || error.message
    });
    
    // Handle authentication errors
    if (response?.status === 401) {
      toast.error('Session expired. Please log in again.');
      // Clear auth data
      localStorage.removeItem('aegis_access_token');
      localStorage.removeItem('aegis_user_data');
      window.location.href = '/';
      return Promise.reject(error);
    }
    
    // Handle rate limiting
    if (response?.status === 429) {
      const retryAfter = response.headers['retry-after'] || 60;
      toast.error(`Too many requests. Please wait ${retryAfter} seconds.`);
    }
    
    // Handle server errors
    if (response?.status >= 500) {
      toast.error('Server error. Please try again later.');
    }
    
    return Promise.reject(error);
  }
);

// ===========================
// API REQUEST HELPERS
// ===========================

/**
 * Make GET request with proper error handling
 */
const apiGet = async <T>(
  endpoint: string, 
  params?: Record<string, any>,
  config?: AxiosRequestConfig
): Promise<T> => {
  try {
    const response: AxiosResponse<T> = await apiClient.get(endpoint, {
      params,
      ...config
    });
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || error.message || 'Request failed');
  }
};

/**
 * Make POST request with proper error handling
 */
const apiPost = async <T>(
  endpoint: string, 
  data?: any,
  config?: AxiosRequestConfig
): Promise<T> => {
  try {
    const response: AxiosResponse<T> = await apiClient.post(endpoint, data, config);
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || error.message || 'Request failed');
  }
};

// ===========================
// MAIN CLIENT API - EXECUTIVE DASHBOARD COMPATIBLE
// ===========================

export const clientAPI = {
  /**
   * Get dashboard overview with KPIs and trends
   * Compatible with ExecutiveDashboard.tsx
   */
  getDashboardOverview: async (options: {
    dateRange?: string;
    includeComparative?: boolean;
    includePredictive?: boolean;
  } = {}) => {
    const { dateRange = '30' } = options;
    
    const response = await apiGet<{
      success: boolean;
      data: any;
    }>('/dashboard/overview', { dateRange });
    
    if (!response.success || !response.data) {
      throw new Error('Invalid dashboard data received');
    }
    
    return response;
  },

  /**
   * Get security hotspots for visualization
   * Compatible with ExecutiveDashboard.tsx
   */
  getSecurityHotspots: async (options: {
    startDate?: string;
    endDate?: string;
    riskThreshold?: string;
  } = {}) => {
    const { riskThreshold = 'medium' } = options;
    let dateRange = '30';
    
    // Calculate dateRange from dates if provided
    if (options.startDate && options.endDate) {
      const start = new Date(options.startDate);
      const end = new Date(options.endDate);
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      dateRange = diffDays.toString();
    }
    
    const response = await apiGet<{
      success: boolean;
      data: {
        propertyHotspots: any[];
        locationHotspots: any[];
      };
    }>('/hotspots', { dateRange, riskThreshold });
    
    if (!response.success || !response.data) {
      throw new Error('Invalid hotspots data received');
    }
    
    return {
      data: {
        hotspots: response.data.propertyHotspots,
        clusters: response.data.locationHotspots
      }
    };
  },

  /**
   * Get incidents list
   * Compatible with ExecutiveDashboard.tsx
   */
  getIncidents: async (options: {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    severity?: string;
    status?: string;
    incidentType?: string;
    search?: string;
  } = {}) => {
    const {
      page = 1,
      limit = 25,
      sortBy = 'incidentDate',
      sortOrder = 'desc',
      ...filters
    } = options;
    
    const params = {
      page,
      limit,
      sortBy,
      sortOrder,
      ...filters
    };
    
    const response = await apiGet<{
      success: boolean;
      data: {
        items?: any[];
        incidents?: any[];
        pagination?: any;
      };
    }>('/incidents', params);
    
    if (!response.success || !response.data) {
      throw new Error('Invalid incidents data received');
    }
    
    // Handle both response formats
    const incidents = response.data.items || response.data.incidents || [];
    
    return {
      data: {
        incidents: incidents,
        pagination: response.data.pagination
      }
    };
  },

  /**
   * Get incident details by ID
   */
  getIncidentDetails: async (incidentId: number) => {
    const response = await apiGet<{
      success: boolean;
      data: any;
    }>(`/incidents/${incidentId}`);
    
    if (!response.success || !response.data) {
      throw new Error('Incident not found');
    }
    
    return response.data;
  },

  /**
   * Get evidence files
   */
  getEvidenceFiles: async (options: {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    incidentId?: number;
    fileType?: string;
  } = {}) => {
    const {
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      ...filters
    } = options;
    
    const params = {
      page,
      limit,
      sortBy,
      sortOrder,
      ...filters
    };
    
    return apiGet('/evidence', params);
  },

  /**
   * Download evidence file
   */
  downloadEvidenceFile: async (
    evidenceId: number,
    filename: string,
    onProgress?: (progress: number) => void
  ) => {
    try {
      const response = await apiClient.get(`/evidence/${evidenceId}/download`, {
        responseType: 'blob',
        timeout: LONG_REQUEST_TIMEOUT,
        onDownloadProgress: (progressEvent) => {
          if (onProgress && progressEvent.total) {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            onProgress(progress);
          }
        }
      });
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
    } catch (error: any) {
      throw new Error(error.response?.data?.message || error.message || 'Download failed');
    }
  },

  /**
   * Get dashboard properties
   */
  getProperties: async (dateRange: string = '30') => {
    const response = await apiGet<{
      success: boolean;
      data: {
        properties: any[];
      };
    }>('/dashboard/properties', { dateRange });
    
    if (!response.success || !response.data) {
      throw new Error('Invalid properties data received');
    }
    
    return response.data.properties;
  },

  /**
   * Get incident types breakdown
   */
  getIncidentTypes: async (dateRange: string = '30') => {
    const response = await apiGet<{
      success: boolean;
      data: {
        incidentTypes: any[];
      };
    }>('/dashboard/incident-types', { dateRange });
    
    if (!response.success || !response.data) {
      throw new Error('Invalid incident types data received');
    }
    
    return response.data.incidentTypes;
  }
};

// ===========================
// UTILITY FUNCTIONS
// ===========================

/**
 * Format file size in human readable format
 */
export const formatFileSize = (bytes: number): string => {
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let size = bytes;
  let unitIndex = 0;
  
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  
  return `${Math.round(size * 10) / 10} ${units[unitIndex]}`;
};

/**
 * Format incident type for display
 */
export const formatIncidentType = (type: string): string => {
  return type
    .replace(/_/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase());
};

/**
 * Get severity color class
 */
export const getSeverityColor = (severity: string): string => {
  const colors = {
    low: 'text-green-600 bg-green-50',
    medium: 'text-yellow-600 bg-yellow-50',
    high: 'text-orange-600 bg-orange-50',
    critical: 'text-red-600 bg-red-50'
  };
  return colors[severity as keyof typeof colors] || 'text-gray-600 bg-gray-50';
};

/**
 * Get status color class
 */
export const getStatusColor = (status: string): string => {
  const colors = {
    reported: 'text-blue-600 bg-blue-50',
    investigating: 'text-yellow-600 bg-yellow-50',
    resolved: 'text-green-600 bg-green-50',
    closed: 'text-gray-600 bg-gray-50'
  };
  return colors[status as keyof typeof colors] || 'text-gray-600 bg-gray-50';
};

/**
 * Check if incident is recent (within 24 hours)
 */
export const isRecentIncident = (incidentDate: string): boolean => {
  const incident = new Date(incidentDate);
  const now = new Date();
  const twentyFourHours = 24 * 60 * 60 * 1000;
  
  return (now.getTime() - incident.getTime()) < twentyFourHours;
};

/**
 * Calculate confidence badge color
 */
export const getConfidenceBadgeColor = (confidence: number): string => {
  if (confidence >= 95) return 'text-green-700 bg-green-100';
  if (confidence >= 85) return 'text-blue-700 bg-blue-100';
  if (confidence >= 70) return 'text-yellow-700 bg-yellow-100';
  return 'text-red-700 bg-red-100';
};

// Capitalized export for backward compatibility
export const ClientAPI = clientAPI;

// Default export for backward compatibility
export default clientAPI;
