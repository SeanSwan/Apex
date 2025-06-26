// reportBuilder.constants.ts - Constants and Default Configurations
// Centralized configuration for report builder components

import marbleTexture from '../../assets/marble-texture.png';
import { AIOptions, DeliveryOptions } from '../../types/reports';

// Color palette for consistent theming
export const REPORT_COLORS = {
  gold: '#D4AF37',
  lightGold: '#F4D160',
  black: '#000000',
  darkBlack: '#0A0A0A',
  silver: '#C0C0C0',
  lightSilver: '#E8E8E8',
  white: '#FFFFFF',
  background: '#0f1419',
  text: '#FAF0E6',
  textSecondary: '#F0E6D2'
} as const;

// Default AI options configuration
export const DEFAULT_AI_OPTIONS: AIOptions = {
  enabled: true,
  autoCorrect: true,
  enhanceWriting: true,
  suggestContent: true,
  suggestImprovements: true,
  analyzeThreats: false,
  generateSummary: true,
  highlightPatterns: false,
} as const;

// Default delivery options configuration
export const DEFAULT_DELIVERY_OPTIONS: DeliveryOptions = {
  emailRecipients: [],
  scheduleDelivery: false,
  deliveryDate: new Date(),
  email: true,
  sms: false,
  smsRecipients: [],
  includeFullData: true,
  includeCharts: true,
  deliveryFrequency: 'weekly',
  includeAttachments: true,
  deliveryFormat: 'pdf',
  ccEmails: [],
  bccEmails: [],
} as const;

// Default theme settings configuration
export const DEFAULT_THEME_SETTINGS = {
  primaryColor: REPORT_COLORS.gold,
  secondaryColor: REPORT_COLORS.black,
  accentColor: REPORT_COLORS.text,
  fontFamily: 'Arial, sans-serif',
  reportTitle: 'AI Live Monitoring Report',
  backgroundOpacity: 0.7,
  headerImage: marbleTexture,
  backgroundImage: marbleTexture,
  companyLogo: '',
  clientLogo: '',
  textColor: REPORT_COLORS.textSecondary,
} as const;

// Security company contact information (always enforced)
export const SECURITY_COMPANY_CONTACT = {
  email: 'it@defenseic.com',
  signature: 'Sean Swan',
  companyName: 'Defense International',
} as const;

// Chart generation settings
export const CHART_GENERATION_CONFIG = {
  MAX_LOADING_ATTEMPTS: 15,
  LOADING_CHECK_INTERVAL: 500, // ms
  STABILIZATION_DELAY: 1000, // ms
  PREVIEW_DEBOUNCE_TIME: 500, // ms
  VISUALIZATION_DEBOUNCE_TIME: 1000, // ms
  IMMEDIATE_GENERATION_DELAY: 100, // ms
  HTML_TO_CANVAS_OPTIONS: {
    scale: 2,
    useCORS: true,
    backgroundColor: '#1e1e1e',
    logging: false,
    allowTaint: true,
    foreignObjectRendering: true,
  },
  IMAGE_QUALITY: 0.95,
} as const;

// PDF generation settings
export const PDF_GENERATION_CONFIG = {
  STANDARD_QUALITY: 0.8,
  COMPRESSED_QUALITY: 0.6,
  SCALE_FACTOR: 2,
  REMOVE_WATERMARKS: true,
} as const;

// localStorage keys for persistence
export const STORAGE_KEYS = {
  ACTIVE_TAB: 'activeTab',
  SELECTED_CLIENT: 'selectedClient',
  THEME_SETTINGS: 'themeSettings',
  AI_OPTIONS: 'aiOptions',
  DELIVERY_OPTIONS: 'deliveryOptions',
  REPORT_MEDIA: 'reportMedia',
  CURRENT_DATE: 'currentDate',
} as const;

// Event names for component communication
export const CUSTOM_EVENTS = {
  METRICS_UPDATED: 'metricsUpdated',
  DAILY_REPORTS_UPDATED: 'dailyReportsUpdated',
  FORCE_SAVE_BEFORE_TAB_SWITCH: 'forceSaveBeforeTabSwitch',
  TAB_SWITCH_DATA_SYNC: 'tabSwitchDataSync',
} as const;

// Validation constants
export const VALIDATION = {
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'],
  ALLOWED_VIDEO_TYPES: ['video/mp4', 'video/webm', 'video/ogg'],
  MAX_EMAIL_RECIPIENTS: 10,
  MIN_REPORT_TITLE_LENGTH: 5,
  MAX_REPORT_TITLE_LENGTH: 100,
} as const;

// Debug and development settings
export const DEBUG_CONFIG = {
  ENABLE_CONSOLE_LOGGING: true,
  LOG_CHART_GENERATION: true,
  LOG_STATE_CHANGES: true,
  LOG_EVENT_DISPATCHING: true,
  PERFORMANCE_MONITORING: true,
} as const;

// Animation and transition settings
export const ANIMATION_CONFIG = {
  TAB_TRANSITION_DURATION: 300, // ms
  CHART_FADE_DURATION: 200, // ms
  LOADING_SPINNER_SPEED: 1.5, // seconds per rotation
  PULSE_ANIMATION_DURATION: 2, // seconds
} as const;

export default {
  REPORT_COLORS,
  DEFAULT_AI_OPTIONS,
  DEFAULT_DELIVERY_OPTIONS,
  DEFAULT_THEME_SETTINGS,
  SECURITY_COMPANY_CONTACT,
  CHART_GENERATION_CONFIG,
  PDF_GENERATION_CONFIG,
  STORAGE_KEYS,
  CUSTOM_EVENTS,
  VALIDATION,
  DEBUG_CONFIG,
  ANIMATION_CONFIG,
};
