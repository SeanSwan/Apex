// File: frontend/src/services/reportService.ts

import axios from 'axios';
import { ReportData, ClientData, MetricsData } from '../types/reports';

// Using Vite environment variables with fallbacks
// This provides type safety while still having sensible defaults
const API_URL = import.meta.env.VITE_API_URL || '/api';
const IS_DEV = import.meta.env.DEV; // Built-in Vite environment variable
const USE_API = import.meta.env.VITE_USE_API === 'true';

/**
 * Get all clients that the current user has access to
 * @returns Array of clients
 */
export const getClientsForUser = async (): Promise<ClientData[]> => {
  // In development, we can use mock data if needed
  if (IS_DEV && !USE_API) {
    return getMockClients();
  }
  
  try {
    const response = await axios.get(`${API_URL}/clients`);
    return response.data;
  } catch (error) {
    console.error('Failed to fetch clients:', error);
    throw error;
  }
};

/**
 * Get metrics data for a specific client and date range
 * @param clientId Client ID
 * @param startDate Start date for metrics
 * @param endDate End date for metrics
 * @returns Metrics data
 */
export const getClientMetrics = async (
  clientId: string, 
  startDate: Date, 
  endDate: Date
): Promise<MetricsData> => {
  // In development, we can use mock data if needed
  if (IS_DEV && !USE_API) {
    return getMockMetrics(clientId);
  }
  
  try {
    const response = await axios.get(`${API_URL}/clients/${clientId}/metrics`, {
      params: {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      },
    });
    return response.data;
  } catch (error) {
    console.error('Failed to fetch client metrics:', error);
    throw error;
  }
};

/**
 * Get previous reports for a client
 * @param clientId Client ID
 * @param limit Maximum number of reports to return
 * @returns Array of report data
 */
export const getClientReports = async (
  clientId: string,
  limit: number = 5
): Promise<Partial<ReportData>[]> => {
  try {
    const response = await axios.get(`${API_URL}/clients/${clientId}/reports`, {
      params: { limit },
    });
    return response.data;
  } catch (error) {
    console.error('Failed to fetch client reports:', error);
    throw error;
  }
};

/**
 * Save report draft
 * @param reportData Report data to save
 * @returns Saved report data with ID
 */
export const saveReportDraft = async (reportData: ReportData): Promise<ReportData> => {
  // In development, we can simulate a successful save
  if (IS_DEV && !USE_API) {
    await new Promise(resolve => setTimeout(resolve, 800)); // Simulate API delay
    return { ...reportData, id: 'mock-id-' + Date.now() } as ReportData;
  }
  
  try {
    const response = await axios.post(`${API_URL}/reports/draft`, reportData);
    return response.data;
  } catch (error) {
    console.error('Failed to save report draft:', error);
    throw error;
  }
};

/**
 * Load report draft
 * @param reportId Report ID
 * @returns Report data
 */
export const loadReportDraft = async (reportId: string): Promise<ReportData> => {
  try {
    const response = await axios.get(`${API_URL}/reports/${reportId}`);
    return response.data;
  } catch (error) {
    console.error('Failed to load report draft:', error);
    throw error;
  }
};

/**
 * Upload a report PDF to CDN/storage
 * @param pdfBlob PDF blob to upload
 * @returns URL of the uploaded file
 */
export const uploadReportToCDN = async (pdfBlob: Blob): Promise<string> => {
  // In development, simulate a successful upload
  if (IS_DEV && !USE_API) {
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate upload delay
    return `https://storage.example.com/reports/mock-report-${Date.now()}.pdf`;
  }
  
  try {
    const formData = new FormData();
    formData.append('file', pdfBlob, 'report.pdf');
    
    const response = await axios.post(`${API_URL}/upload/report`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    return response.data.url;
  } catch (error) {
    console.error('Failed to upload report to CDN:', error);
    throw error;
  }
};

/**
 * Send report to recipients
 * @param sendData Data needed to send the report
 * @returns Success status
 */
export const sendReport = async (sendData: {
  clientId: string;
  reportUrl: string;
  deliveryOptions: any;
  subject: string;
  message: string;
}): Promise<{ success: boolean; messageId?: string }> => {
  // In development, simulate a successful send
  if (IS_DEV && !USE_API) {
    await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate API delay
    return { success: true, messageId: 'mock-message-id-' + Date.now() };
  }
  
  try {
    const response = await axios.post(`${API_URL}/reports/send`, sendData);
    return response.data;
  } catch (error) {
    console.error('Failed to send report:', error);
    throw error;
  }
};

// MOCK DATA HELPERS (for development only)

const getMockClients = (): ClientData[] => {
  return [
    {
      id: '1',
      name: 'Bell Warner Center',
      siteName: 'Bell Warner Center',
      location: '21050 Kittridge Street Canoga Park, CA 91303',
      city: 'Canoga Park',
      state: 'CA',
      zipCode: '91303',
      contactEmail: 'contact@bellwarner.com',
      cameraType: 'SmartPSS Lite',
      cameras: 58,
      lastReportDate: new Date().toISOString(),
      isActive: true,
      isVIP: true,
      contacts: [
        { name: 'John Bell', email: 'john@bellwarner.com', phone: '+18183456789', isPrimary: true },
        { name: 'Sarah Warner', email: 'sarah@bellwarner.com', phone: '+18183456780', isPrimary: false },
      ],
    },
    {
      id: '2',
      name: 'Oakridge Apartments',
      siteName: 'Oakridge Residential Complex',
      location: '8601 Lincoln Blvd, Los Angeles, CA 90045',
      city: 'Los Angeles',
      state: 'CA',
      zipCode: '90045',
      contactEmail: 'security@oakridge.com',
      cameraType: 'Hikvision IP',
      cameras: 42,
      lastReportDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      isActive: true,
      isNew: true,
      contacts: [
        { name: 'Michael Chen', email: 'michael@oakridge.com', phone: '+13102345678', isPrimary: true },
      ],
    },
    {
      id: '3',
      name: 'Westfield Mall',
      siteName: 'Westfield Shopping Center',
      location: '6600 Topanga Canyon Blvd, Canoga Park, CA 91303',
      city: 'Canoga Park',
      state: 'CA',
      zipCode: '91303',
      contactEmail: 'operations@westfield.com',
      cameraType: 'Dahua 4K',
      cameras: 124,
      lastReportDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      isActive: true,
      contacts: [
        { name: 'Amanda Jenkins', email: 'amanda@westfield.com', phone: '+18183457890', isPrimary: true },
        { name: 'Robert Williams', email: 'robert@westfield.com', phone: '+18183457891', isPrimary: false },
      ],
    },
  ];
};

const getMockMetrics = (clientId: string): MetricsData => {
  return {
    humanIntrusions: {
      Monday: 1284,
      Tuesday: 1016,
      Wednesday: 1149,
      Thursday: 632,
      Friday: 667,
      Saturday: 816,
      Sunday: 1245,
    },
    vehicleIntrusions: {
      Monday: 2184,
      Tuesday: 2147,
      Wednesday: 2204,
      Thursday: 1967,
      Friday: 2074,
      Saturday: 1828,
      Sunday: 2210,
    },
    aiAccuracy: 98.7,
    responseTime: 0.8,
    proactiveAlerts: 20478,
    potentialThreats: 1,
    operationalUptime: 100,
    totalMonitoringHours: 168,
    totalCameras: clientId === '1' ? 58 : clientId === '2' ? 42 : 124,
    camerasOnline: clientId === '1' ? 58 : clientId === '2' ? 40 : 122,
  };
};