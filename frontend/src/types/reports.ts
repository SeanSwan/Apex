// File: frontend/src/types/reports.ts

/**
 * Defines the possible statuses for a daily report entry.
 * Ensure these match the statuses used in your UI/logic (e.g., in DailyReportsPanel).
 */
export type DailyReportStatus = 'To update' | 'In Progress' | 'Completed' | 'Needs review' | 'completed' | 'pending' | 'in-progress' | 'cancelled';

/**
 * Defines the possible security codes for a daily report entry.
 * Ensure these match the codes used in your UI/logic (e.g., in DailyReportsPanel).
 */
export type SecurityCode = 'Code 1' | 'Code 2' | 'Code 3' | 'Code 4'; // Common security codes

/**
 * Represents a single day's entry in the report.
 */
export interface DailyReport {
  day: string; // e.g., 'Monday'
  content?: string;
  status: DailyReportStatus; // Use the specific type
  securityCode?: SecurityCode; // Use the specific type
  timestamp?: string; // Added to match existing code
}

// --- Client & Property Types ---

/**
 * Contact person associated with a client/property.
 */
export interface ClientContact {
  name: string;
  email: string;
  phone: string;
  isPrimary: boolean;
}

/**
 * Represents a client or property being monitored.
 */
export interface ClientData {
  id: string;            // Typically required
  name: string;          // Typically required
  siteName?: string;      // Optional display name
  location?: string;      // Made optional to match existing code
  city?: string;
  state?: string;
  zipCode?: string;
  contactEmail?: string;  // Important for delivery, but might be missing initially
  cameraType?: string;
  cameras?: number;       // Total number of cameras
  lastReportDate?: string | Date;
  isActive?: boolean;     // Status flags
  isVIP?: boolean;
  isNew?: boolean;
  contacts?: ClientContact[]; // List of contacts
  cameraDetails?: string; // More specific info
  clientLogo?: string;    // URL for client's logo
}

// --- Metrics & Analytics Types ---

/**
 * Key performance indicators and metrics collected during monitoring.
 * All fields should be present, even if zero.
 */
export interface MetricsData {
  humanIntrusions: Record<string, number>; // { Monday: 0, ... }
  vehicleIntrusions: Record<string, number>;
  aiAccuracy: number;
  responseTime: number; // in seconds, e.g., 0.8
  proactiveAlerts: number;
  potentialThreats: number;
  operationalUptime: number; // Percentage, e.g., 99.8
  totalMonitoringHours: number; // e.g., 168 for a week
  totalCameras: number;
  camerasOnline: number;
}

// --- Configuration & Settings Types ---

/**
 * Settings for customizing the appearance of reports (Theme).
 */
export interface ThemeSettings {
  primaryColor?: string;
  secondaryColor?: string; 
  accentColor?: string;
  fontFamily?: string;
  darkMode?: boolean;
  headerImage?: string;     // URL for header background
  backgroundImage?: string; // URL for main background image
  companyLogo?: string;     // URL for company logo (often left)
  clientLogo?: string;      // URL for client logo (often right)
  textColor?: string;       // Color for text on header background
  reportTitle?: string;     // Title displayed in the header
  backgroundOpacity?: number;// Opacity for header background image (0 to 1)
}

/**
 * Configuration options for AI assistance features.
 * All properties are required as ReportBuilder provides defaults.
 */
export interface AIOptions {
  enabled: boolean;
  autoCorrect: boolean;
  enhanceWriting: boolean;
  suggestContent: boolean;
  generateSummary: boolean;
  suggestImprovements: boolean;
  analyzeThreats: boolean;
  highlightPatterns: boolean;
}

/**
 * Configuration options for report delivery.
 * All properties are required as ReportBuilder provides defaults.
 */
export interface DeliveryOptions {
  // Channels
  email: boolean;
  sms: boolean;
  emailRecipients: string[];
  smsRecipients: string[];
  ccEmails?: string[]; // Keep optional if not always used
  bccEmails?: string[];// Keep optional if not always used

  // Scheduling
  scheduleDelivery: boolean;
  deliveryDate: Date; // Use Date object
  deliveryFrequency: 'daily' | 'weekly' | 'monthly'; // Specific options

  // Content & Formatting
  includeAttachments: boolean;
  deliveryFormat: 'pdf' | 'csv' | 'link'; // Specific options
  includeFullData: boolean;
  includeCharts: boolean;
}

// --- Media File Type ---
export interface MediaFile {
  id?: string;
  url: string;
  name: string;
  type: string; // Changed to string to be compatible with existing code
  size?: number;
  thumbnail?: string;
  dateCreated?: Date;
  description?: string;
  tags?: string[];
  expiryDate?: Date | string;
  shareLink?: string;
  uploadedAt?: string; // Consider using Date object if needed for calculations
}

// --- Video Link Type ---
export interface VideoLink {
  url: string;
  title: string;
  expiryDate: string | Date;
}

// --- Date Range Type ---
export interface DateRange {
  start: Date;
  end: Date;
}

// --- PDF Generation & Utility Types ---
// These don't directly affect component interactions but are useful for PDF logic
export interface PropertyDataItem { type: string; count: number | string; }
export interface PDFOptions { backgroundImage?: string; backgroundTheme?: string; returnBlob?: boolean; }

// jsPDF-AutoTable related types (simplified, expand if needed for type safety in PDF generation)
export interface HeadStyles { [key: string]: any; }
export interface TableMargins { top: number; right?: number; bottom?: number; left?: number; }
export interface CellStyles { [key: string]: any; }
export interface AutoTableOptions {
    startY?: number;
    head?: string[][];
    body: (string | number)[][];
    foot?: string[][];
    margin?: TableMargins | number;
    theme?: 'striped' | 'grid' | 'plain';
    styles?: CellStyles;
    headStyles?: HeadStyles;
    footStyles?: HeadStyles;
    bodyStyles?: CellStyles;
    alternateRowStyles?: CellStyles;
    columnStyles?: { [key: string | number]: CellStyles };
    [key: string]: any; // Allow other options
}