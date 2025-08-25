// client-portal/src/types/sync.types.ts
/**
 * APEX AI SYNC SERVICE TYPE DEFINITIONS
 * ====================================
 * 
 * Comprehensive TypeScript definitions for the real-time synchronization
 * system between Admin Dashboard, Client Portal, and Live Monitoring.
 * 
 * Security-First Design:
 * - Zero Trust authentication for all sync events
 * - Immutable audit trail requirements
 * - Comprehensive data validation schemas
 * 
 * Master Prompt Compliance:
 * - Extreme modularity with single-responsibility types
 * - Production-ready error handling definitions
 * - Real-time capabilities with WebSocket support
 */

// ===========================
// CORE SYNC EVENT TYPES
// ===========================

export type SyncEventType = 
  | 'property_updated'
  | 'property_created'
  | 'property_deleted'
  | 'images_uploaded'
  | 'images_deleted'
  | 'incident_created'
  | 'incident_updated'
  | 'incident_resolved'
  | 'evidence_added'
  | 'evidence_deleted'
  | 'contact_list_updated'
  | 'user_permissions_changed'
  | 'ai_detection_triggered'
  | 'camera_status_changed'
  | 'system_health_updated'
  | 'guard_dispatched'
  | 'patrol_completed'
  | 'manual_data_entry'
  | 'bulk_data_upload'
  | 'configuration_changed'
  | 'emergency_alert'
  | 'full_system_refresh';

export type SyncEventSource = 
  | 'admin_dashboard'
  | 'client_portal'
  | 'live_monitoring'
  | 'ai_detection_system'
  | 'camera_feeds'
  | 'mobile_app'
  | 'api_integration'
  | 'scheduled_task'
  | 'system_automated';

export type SyncEventPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | 'EMERGENCY';

export type SecurityLevel = 'PUBLIC' | 'INTERNAL' | 'CONFIDENTIAL' | 'RESTRICTED' | 'TOP_SECRET';

// ===========================
// SYNC EVENT INTERFACE
// ===========================

export interface SyncEvent {
  // Event Identification
  id: string;
  type: SyncEventType;
  source: SyncEventSource;
  priority: SyncEventPriority;
  
  // Security & Audit
  userId: string;
  clientId: string;
  sessionId: string;
  securityLevel: SecurityLevel;
  sourceIP: string;
  userAgent: string;
  
  // Data Payload
  propertyId?: string;
  data: Record<string, any>;
  
  // Timestamps
  timestamp: string;
  createdAt: string;
  scheduledFor?: string;
  expiresAt?: string;
  
  // Processing Status
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  attempts: number;
  lastAttempt?: string;
  
  // Context & Metadata
  context: SyncEventContext;
  metadata: SyncEventMetadata;
}

export interface SyncEventContext {
  // Operation Context
  operationType: 'create' | 'read' | 'update' | 'delete' | 'batch';
  actionDescription: string;
  relatedEvents?: string[]; // Related event IDs
  
  // Source Context
  sourceComponent?: string;
  sourceFunction?: string;
  sourceVersion?: string;
  
  // Business Context
  businessReason?: string;
  complianceFlags?: string[];
  riskAssessment?: 'low' | 'medium' | 'high' | 'critical';
}

export interface SyncEventMetadata {
  // Performance Metrics
  processingTime?: number;
  retryCount: number;
  bandwidth?: number;
  
  // Data Metrics
  dataSize: number;
  compressionRatio?: number;
  validationTime?: number;
  
  // Error Information
  lastError?: string;
  errorCode?: string;
  stackTrace?: string;
  
  // Additional Context
  tags: string[];
  customFields?: Record<string, any>;
}

// ===========================
// PROPERTY SYNC DATA TYPES
// ===========================

export interface PropertySyncData {
  id: string;
  name: string;
  address: string;
  clientId: string;
  
  // Configuration
  settings: PropertySettings;
  features: PropertyFeatures;
  
  // Image Management
  imageCount: number;
  primaryImage: string | null;
  imageGallery: PropertyImage[];
  lastImageUpdate: string | null;
  
  // Operational Data
  cameraCount: number;
  activeIncidents: number;
  lastActivity: string | null;
  
  // Sync Metadata
  version: number;
  lastModified: string;
  lastSyncedAt: string;
  syncStatus: 'synced' | 'pending' | 'conflict' | 'error';
}

export interface PropertySettings {
  // Monitoring Configuration
  enableAIDetection: boolean;
  confidenceThreshold: number;
  alertPreferences: AlertPreferences;
  
  // Access Control
  accessHours: string;
  authorizedPersonnel: string[];
  emergencyContacts: ContactInfo[];
  
  // Camera Configuration
  cameraSettings: CameraSettings[];
  recordingSettings: RecordingSettings;
}

export interface PropertyFeatures {
  hasVoiceAI: boolean;
  hasLiveMonitoring: boolean;
  hasMobileApp: boolean;
  hasEmergencyDispatch: boolean;
  supportedIntegrations: string[];
}

export interface PropertyImage {
  id: string;
  filename: string;
  url: string;
  type: 'primary' | 'gallery' | 'floorplan' | 'camera_view';
  description?: string;
  uploadedAt: string;
  uploadedBy: string;
  metadata: ImageMetadata;
}

export interface ImageMetadata {
  size: number;
  dimensions: { width: number; height: number };
  format: string;
  checksum: string;
  location?: { x: number; y: number; zone: string };
}

// ===========================
// INCIDENT SYNC DATA TYPES
// ===========================

export interface IncidentSyncData {
  id: string;
  propertyId: string;
  type: IncidentType;
  severity: IncidentSeverity;
  status: IncidentStatus;
  
  // Core Incident Data
  title: string;
  description: string;
  location: IncidentLocation;
  detectedAt: string;
  resolvedAt?: string;
  
  // AI Detection Data
  aiConfidence: number;
  detectionMethod: DetectionMethod;
  triggeredBy: string;
  
  // Response Data
  responseTime?: number;
  actionsTaken: IncidentAction[];
  involvedPersonnel: string[];
  
  // Evidence & Media
  evidenceFiles: EvidenceFile[];
  associatedCameras: string[];
  
  // Sync Metadata
  version: number;
  lastModified: string;
  lastSyncedAt: string;
}

export type IncidentType = 
  | 'trespassing'
  | 'theft'
  | 'vandalism'
  | 'violence'
  | 'weapon_detected'
  | 'unauthorized_access'
  | 'suspicious_activity'
  | 'false_alarm'
  | 'maintenance_required'
  | 'system_malfunction';

export type IncidentSeverity = 'low' | 'medium' | 'high' | 'critical' | 'emergency';

export type IncidentStatus = 
  | 'detected'
  | 'investigating'
  | 'responding'
  | 'resolved'
  | 'false_positive'
  | 'escalated';

export interface IncidentLocation {
  zone: string;
  coordinates?: { x: number; y: number };
  cameraId: string;
  description: string;
  floorLevel?: string;
}

export type DetectionMethod = 
  | 'ai_vision'
  | 'motion_sensor'
  | 'audio_detection'
  | 'manual_report'
  | 'third_party_integration';

export interface IncidentAction {
  id: string;
  type: 'notification' | 'dispatch' | 'recording' | 'escalation' | 'resolution';
  description: string;
  performedBy: string;
  performedAt: string;
  result?: string;
}

export interface EvidenceFile {
  id: string;
  filename: string;
  type: 'video' | 'image' | 'audio' | 'document';
  url: string;
  thumbnailUrl?: string;
  size: number;
  duration?: number;
  capturedAt: string;
  cameraId?: string;
  watermarked: boolean;
  metadata: EvidenceMetadata;
}

export interface EvidenceMetadata {
  format: string;
  resolution?: string;
  fps?: number;
  codec?: string;
  checksum: string;
  encryptionStatus: boolean;
}

// ===========================
// SYSTEM HEALTH SYNC TYPES
// ===========================

export interface SystemHealthSyncData {
  // Overall System Status
  overallHealth: number; // 0-100 percentage
  status: 'optimal' | 'degraded' | 'critical' | 'offline';
  lastHealthCheck: string;
  
  // Component Health
  components: ComponentHealth[];
  
  // Performance Metrics
  performance: PerformanceMetrics;
  
  // Real-Time Statistics
  statistics: SystemStatistics;
}

export interface ComponentHealth {
  component: string;
  status: 'online' | 'offline' | 'degraded' | 'maintenance';
  health: number; // 0-100 percentage
  lastCheck: string;
  issues?: string[];
  metrics?: Record<string, any>;
}

export interface PerformanceMetrics {
  // Response Times
  averageResponseTime: number;
  apiResponseTime: number;
  databaseResponseTime: number;
  aiProcessingTime: number;
  
  // System Load
  cpuUsage: number;
  memoryUsage: number;
  diskUsage: number;
  networkLatency: number;
  
  // AI Performance
  aiConfidenceAverage: number;
  detectionAccuracy: number;
  falsePositiveRate: number;
}

export interface SystemStatistics {
  // Current Activity
  activeCameras: number;
  totalCameras: number;
  activeIncidents: number;
  onlineUsers: number;
  
  // Daily Metrics
  dailyIncidents: number;
  dailyDetections: number;
  dailyFalsePositives: number;
  
  // Performance Stats
  uptime: number;
  totalProcessedEvents: number;
  averageProcessingTime: number;
}

// ===========================
// SYNC CONFIGURATION TYPES
// ===========================

export interface SyncConfiguration {
  // Real-Time Settings
  enableRealTimeSync: boolean;
  syncIntervalMs: number;
  maxRetryAttempts: number;
  retryDelayMs: number;
  
  // Connection Settings
  websocketUrl: string;
  apiEndpoint: string;
  timeoutMs: number;
  heartbeatIntervalMs: number;
  
  // Security Settings
  requireAuthentication: boolean;
  enableEncryption: boolean;
  auditLevel: 'minimal' | 'standard' | 'comprehensive';
  
  // Performance Settings
  batchSize: number;
  compressionEnabled: boolean;
  cachingEnabled: boolean;
  priorityQueueEnabled: boolean;
  
  // Debug & Monitoring
  debugMode: boolean;
  enableMetrics: boolean;
  logLevel: 'error' | 'warn' | 'info' | 'debug' | 'trace';
}

// ===========================
// SYNC STATUS & METRICS TYPES
// ===========================

export interface SyncStatus {
  // Connection Status
  isConnected: boolean;
  connectionState: 'connecting' | 'connected' | 'disconnected' | 'reconnecting' | 'error';
  lastConnected?: string;
  reconnectAttempts: number;
  
  // Sync Status
  lastSyncTime?: string;
  syncInProgress: boolean;
  pendingEvents: number;
  failedEvents: number;
  
  // Performance
  averageLatency: number;
  totalSyncedEvents: number;
  syncErrors: string[];
}

export interface SyncMetrics {
  // Performance Metrics
  averageProcessingTime: number;
  throughputPerSecond: number;
  errorRate: number;
  
  // Event Metrics
  eventsByType: Record<SyncEventType, number>;
  eventsBySource: Record<SyncEventSource, number>;
  eventsByPriority: Record<SyncEventPriority, number>;
  
  // Time-based Metrics
  hourlyEvents: number[];
  dailyEvents: number[];
  peakUsageTime: string;
  
  // Health Metrics
  uptime: number;
  lastHealthCheck: string;
  healthScore: number;
}

// ===========================
// ERROR HANDLING TYPES
// ===========================

export interface SyncError {
  code: string;
  message: string;
  details?: Record<string, any>;
  timestamp: string;
  source: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  recoverable: boolean;
  retryable: boolean;
}

export interface SyncConflict {
  id: string;
  type: 'data_mismatch' | 'version_conflict' | 'permission_denied' | 'schema_mismatch';
  source1: SyncEventSource;
  source2: SyncEventSource;
  data1: any;
  data2: any;
  detectedAt: string;
  resolutionStrategy: 'manual' | 'admin_wins' | 'client_wins' | 'merge' | 'reject';
  resolvedAt?: string;
  resolvedBy?: string;
}

// ===========================
// UTILITY TYPES
// ===========================

export interface AlertPreferences {
  emailEnabled: boolean;
  smsEnabled: boolean;
  pushEnabled: boolean;
  emailAddresses: string[];
  phoneNumbers: string[];
  escalationDelayMinutes: number;
}

export interface ContactInfo {
  name: string;
  role: string;
  email: string;
  phone: string;
  priority: number;
}

export interface CameraSettings {
  id: string;
  name: string;
  location: string;
  enabled: boolean;
  recordingEnabled: boolean;
  aiDetectionEnabled: boolean;
  confidenceThreshold: number;
}

export interface RecordingSettings {
  quality: 'low' | 'medium' | 'high' | 'ultra';
  fps: number;
  retentionDays: number;
  motionTriggeredOnly: boolean;
  audioEnabled: boolean;
}

// ===========================
// API RESPONSE TYPES
// ===========================

export interface SyncAPIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: SyncError;
  metadata: {
    timestamp: string;
    requestId: string;
    duration: number;
    version: string;
  };
}

export interface SyncEventResponse extends SyncAPIResponse<SyncEvent> {}
export interface PropertySyncResponse extends SyncAPIResponse<PropertySyncData> {}
export interface IncidentSyncResponse extends SyncAPIResponse<IncidentSyncData> {}
export interface SystemHealthResponse extends SyncAPIResponse<SystemHealthSyncData> {}
export interface SyncStatusResponse extends SyncAPIResponse<SyncStatus> {}
export interface SyncMetricsResponse extends SyncAPIResponse<SyncMetrics> {}

// ===========================
// EXPORT BARREL
// ===========================

export type {
  SyncEvent,
  SyncEventContext,
  SyncEventMetadata,
  PropertySyncData,
  PropertySettings,
  PropertyFeatures,
  PropertyImage,
  ImageMetadata,
  IncidentSyncData,
  IncidentLocation,
  IncidentAction,
  EvidenceFile,
  EvidenceMetadata,
  SystemHealthSyncData,
  ComponentHealth,
  PerformanceMetrics,
  SystemStatistics,
  SyncConfiguration,
  SyncStatus,
  SyncMetrics,
  SyncError,
  SyncConflict,
  AlertPreferences,
  ContactInfo,
  CameraSettings,
  RecordingSettings,
  SyncAPIResponse,
  SyncEventResponse,
  PropertySyncResponse,
  IncidentSyncResponse,
  SystemHealthResponse,
  SyncStatusResponse,
  SyncMetricsResponse
};
