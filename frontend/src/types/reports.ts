// File: frontend/src/types/reports.ts

export type DailyReportStatus = 'Completed' | 'In progress' | 'Pending';
export type SecurityCode = 'Code 1' | 'Code 2' | 'Code 3' | 'Code 4' | 'Code 5';

export interface ClientContact {
  name: string;
  email: string;
  phone: string;
  isPrimary: boolean;
}

export interface ClientData {
  id: string;
  name: string;
  siteName?: string;      // Added to match your mock data
  location: string;
  city: string;
  state: string;
  zipCode: string;
  contactEmail: string;
  cameraType: string;
  cameras: number;
  lastReportDate: string;
  isActive: boolean;
  isVIP?: boolean;        // Optional flag
  isNew?: boolean;        // Optional flag
  contacts: ClientContact[];
  cameraDetails?: string; // Optional detailed information
}

export interface DailyActivity {
  time: string;
  description: string;
}

export interface Incident {
  time: string;
  type: string;
  description: string;
}

export interface DailyReport {
  day: string;
  content: string;
  status: DailyReportStatus;
  securityCode: SecurityCode;
}

export interface MetricsData {
  humanIntrusions: Record<string, number>;
  vehicleIntrusions: Record<string, number>;
  aiAccuracy: number;
  responseTime: number;
  proactiveAlerts: number;    // Added to match your mock data
  potentialThreats: number;   // Added to match your mock data
  operationalUptime: number;
  totalMonitoringHours: number;
  totalCameras: number;
  camerasOnline: number;
}

export interface ThemeSettings {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  logoUrl?: string;
  fontFamily?: string;
  darkMode?: boolean;
}

export interface AIOptions {
  enabled: boolean;
  suggestImprovements: boolean;
  analyzeThreats: boolean;
  highlightPatterns: boolean;
}

export interface DeliveryOptions {
  email: boolean;
  sms: boolean;
  emailRecipients: string[];
  smsRecipients: string[];
  scheduleDelivery: boolean;
  deliveryDate: Date;
  includeFullData: boolean;
  includeCharts: boolean;
}

export interface ReportData {
  id: string;
  clientId: string;
  title: string;
  summary: string;
  recipients: string[];
  status: 'draft' | 'sent' | 'archived';
  reportUrl?: string;
  createdAt: string;
  updatedAt: string;
}

// Additional types for PDF generation
export interface PropertyDataItem {
  type: string;
  count: number | string;
}

export interface PDFOptions {
  backgroundImage?: string;
  backgroundTheme?: string;
  returnBlob?: boolean;
}

// Types for jsPDF autotable
export interface HeadStyles {
  fillColor: string | number[];
  textColor?: string | number[];
  fontStyle?: string;
  fontSize?: number;
  halign?: 'left' | 'center' | 'right';
  valign?: 'top' | 'middle' | 'bottom';
  lineWidth?: number;
  lineColor?: string | number[];
}

export interface TableMargins {
  top: number;
  right?: number;
  bottom?: number;
  left?: number;
}

export interface AutoTableOptions {
  startY: number;
  head: string[][];
  body: (string | number)[][];
  theme: string;
  headStyles: HeadStyles;
  margin: TableMargins;
  foot?: string[][];
  footStyles?: Record<string, unknown>;
  bodyStyles?: Record<string, unknown>;
  alternateRowStyles?: Record<string, unknown>;
  columnStyles?: Record<string, unknown>;
  didDrawCell?: (data: Record<string, unknown>) => void;
  didParseCell?: (data: Record<string, unknown>) => void;
  willDrawCell?: (data: Record<string, unknown>) => void;
  styles?: {
    cellPadding?: number;
    fontSize?: number;
    font?: string;
    lineColor?: string | number[];
    lineWidth?: number;
    overflow?: 'ellipsize' | 'visible' | 'hidden';
    fillColor?: string | number[];
    textColor?: string | number[];
    halign?: 'left' | 'center' | 'right';
    valign?: 'top' | 'middle' | 'bottom';
    fontStyle?: string;
    minCellHeight?: number;
    minCellWidth?: number;
  };
}