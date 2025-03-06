// File: frontend/src/types/reports.ts

/**
 * Represents a client contact person
 */
export interface ClientContact {
  name: string;
  email: string;
  phone: string;
  isPrimary: boolean;
}

/**
 * Represents client data
 */
export interface ClientData {
  id: string;
  name: string;
  siteName: string;
  location: string;
  city: string;
  state: string;
  zipCode: string;
  contactEmail: string;
  cameraType: string;
  cameras: number;
  lastReportDate: string;
  isActive: boolean;
  isVIP?: boolean;
  isNew?: boolean;
  contacts: ClientContact[];
}

/**
 * Daily metrics data structure
 */
export type DailyMetrics = {
  Monday: number;
  Tuesday: number;
  Wednesday: number;
  Thursday: number;
  Friday: number;
  Saturday: number;
  Sunday: number;
};

/**
 * Represents metrics data for a client
 */
export interface MetricsData {
  humanIntrusions: DailyMetrics;
  vehicleIntrusions: DailyMetrics;
  aiAccuracy: number;
  responseTime: number;
  proactiveAlerts: number;
  potentialThreats: number;
  operationalUptime: number;
  totalMonitoringHours: number;
  totalCameras: number;
  camerasOnline: number;
}

/**
 * Report status types
 */
export type ReportStatus = 'draft' | 'sent' | 'archived';

/**
 * Represents a report data object
 */
export interface ReportData {
  id?: string;
  clientId: string;
  title?: string;
  summary?: string;
  metrics?: MetricsData;
  createdAt?: string;
  updatedAt?: string;
  status?: ReportStatus;
  author?: string;
  recipients?: string[];
  attachments?: string[];
  reportUrl?: string;
}

/**
 * Delivery options for sending a report
 */
export interface DeliveryOptions {
  email?: boolean;
  sms?: boolean;
  recipients: string[];
}

/**
 * Options for sending a report
 */
export interface SendReportOptions {
  clientId: string;
  reportUrl: string;
  deliveryOptions: DeliveryOptions;
  subject: string;
  message: string;
}

/**
 * Response from sending a report
 */
export interface SendReportResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}