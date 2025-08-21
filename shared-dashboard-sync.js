/**
 * APEX AI CROSS-PLATFORM DASHBOARD SYNCHRONIZATION SERVICE
 * ========================================================
 * Ensures data consistency between Admin Dashboard and Client Portal
 * Features: Real-time sync, conflict resolution, automatic updates, fallback handling
 */

import { EventEmitter } from 'events';

// ===========================
// TYPE DEFINITIONS
// ===========================

interface SyncEvent {
  type: 'property_updated' | 'images_uploaded' | 'incident_created' | 'data_refresh';
  source: 'admin_dashboard' | 'client_portal';
  propertyId?: string;
  clientId?: string;
  data: any;
  timestamp: string;
}

interface SyncConfiguration {
  enableRealTimeSync: boolean;
  syncIntervalMs: number;
  retryAttempts: number;
  retryDelayMs: number;
  enableConflictResolution: boolean;
  debugMode: boolean;
}

interface PropertySyncData {
  id: string;
  name: string;
  imageCount: number;
  primaryImage: string | null;
  lastImageUpdate: string | null;
  lastModified: string;
  version: number;
}

interface ClientPortalSyncData {
  properties: PropertySyncData[];
  incidents: any[];
  statistics: any;
  lastSync: string;
}

// ===========================
// DASHBOARD SYNCHRONIZATION SERVICE
// ===========================

class DashboardSynchronizationService extends EventEmitter {
  private config: SyncConfiguration;
  private syncTimer: NodeJS.Timeout | null = null;
  private isSync: boolean = false;
  private lastSyncTimestamp: string | null = null;
  private adminDashboardData: Map<string, any> = new Map();
  private clientPortalData: Map<string, any> = new Map();
  private pendingSyncQueue: SyncEvent[] = [];

  constructor(config: Partial<SyncConfiguration> = {}) {
    super();
    
    this.config = {
      enableRealTimeSync: true,
      syncIntervalMs: 30000, // 30 seconds
      retryAttempts: 3,
      retryDelayMs: 5000,
      enableConflictResolution: true,
      debugMode: false,
      ...config
    };

    this.initialize();
  }

  // ===========================
  // INITIALIZATION
  // ===========================

  private initialize(): void {
    this.log('Initializing Dashboard Synchronization Service...');
    
    if (this.config.enableRealTimeSync) {
      this.startSyncTimer();
    }

    // Listen for window focus events to trigger sync
    if (typeof window !== 'undefined') {
      window.addEventListener('focus', () => {
        this.triggerSync('Window focus detected');
      });

      window.addEventListener('online', () => {
        this.triggerSync('Network connection restored');
      });
    }

    this.log('Dashboard Synchronization Service initialized');
  }

  // ===========================
  // SYNC TIMER MANAGEMENT
  // ===========================

  private startSyncTimer(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
    }

    this.syncTimer = setInterval(() => {
      this.performSynchronization();
    }, this.config.syncIntervalMs);

    this.log(`Sync timer started with interval: ${this.config.syncIntervalMs}ms`);
  }

  private stopSyncTimer(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = null;
      this.log('Sync timer stopped');
    }
  }

  // ===========================
  // PROPERTY SYNCHRONIZATION
  // ===========================

  /**
   * Sync property data between admin dashboard and client portal
   */
  async syncPropertyData(propertyId: string, source: 'admin_dashboard' | 'client_portal'): Promise<void> {
    try {
      this.log(`Syncing property data for: ${propertyId} from ${source}`);

      // Get latest property data from admin side
      const adminData = await this.fetchAdminPropertyData(propertyId);
      
      // Get current client portal data
      const clientData = await this.fetchClientPropertyData(propertyId);

      // Detect conflicts and resolve
      const resolvedData = this.config.enableConflictResolution 
        ? this.resolvePropertyConflicts(adminData, clientData, source)
        : adminData;

      // Update both sides with resolved data
      await this.updateAdminPropertyData(propertyId, resolvedData);
      await this.updateClientPropertyData(propertyId, resolvedData);

      // Store in local cache
      this.adminDashboardData.set(propertyId, resolvedData);
      this.clientPortalData.set(propertyId, resolvedData);

      // Emit sync complete event
      this.emit('property_synced', {
        propertyId,
        source,
        data: resolvedData,
        timestamp: new Date().toISOString()
      });

      this.log(`Property sync completed for: ${propertyId}`);

    } catch (error) {
      this.log(`Error syncing property ${propertyId}:`, error);
      this.emit('sync_error', {
        type: 'property_sync_error',
        propertyId,
        error: error.message,
        timestamp: new Date().toISOString()
      });
      
      throw error;
    }
  }

  /**
   * Sync property images between admin dashboard and client portal
   */
  async syncPropertyImages(propertyId: string, imageData: any[]): Promise<void> {
    try {
      this.log(`Syncing property images for: ${propertyId}`);

      // Update image metadata in both systems
      const imageMetadata = {
        propertyId,
        images: imageData,
        imageCount: imageData.length,
        primaryImage: imageData.length > 0 ? imageData[0].filename : null,
        lastImageUpdate: new Date().toISOString()
      };

      // Update admin dashboard
      await this.updateAdminImageData(propertyId, imageMetadata);
      
      // Update client portal cache
      await this.updateClientImageData(propertyId, imageMetadata);

      // Emit image sync event
      this.emit('images_synced', {
        propertyId,
        imageCount: imageData.length,
        timestamp: new Date().toISOString()
      });

      this.log(`Property images synced for: ${propertyId} (${imageData.length} images)`);

    } catch (error) {
      this.log(`Error syncing images for property ${propertyId}:`, error);
      throw error;
    }
  }

  // ===========================
  // DATA FETCHING
  // ===========================

  private async fetchAdminPropertyData(propertyId: string): Promise<any> {
    try {
      const token = this.getAuthToken();
      const response = await fetch(`/api/internal/v1/properties/${propertyId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Admin API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data.success ? data.data.property : null;

    } catch (error) {
      this.log(`Error fetching admin property data for ${propertyId}:`, error);
      return null;
    }
  }

  private async fetchClientPropertyData(propertyId: string): Promise<any> {
    try {
      const token = this.getAuthToken();
      const response = await fetch(`/api/client/v1/property-images/${propertyId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Client API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data.success ? data.data : null;

    } catch (error) {
      this.log(`Error fetching client property data for ${propertyId}:`, error);
      return null;
    }
  }

  // ===========================
  // CONFLICT RESOLUTION
  // ===========================

  private resolvePropertyConflicts(adminData: any, clientData: any, source: string): any {
    if (!adminData && !clientData) {
      return null;
    }

    if (!clientData) {
      return adminData;
    }

    if (!adminData) {
      return clientData;
    }

    // Use timestamp-based resolution (most recent wins)
    const adminTimestamp = new Date(adminData.updatedAt || adminData.lastModified || 0);
    const clientTimestamp = new Date(clientData.lastUpdated || clientData.updatedAt || 0);

    if (source === 'admin_dashboard' || adminTimestamp >= clientTimestamp) {
      this.log(`Conflict resolved: Using admin data (newer or admin source)`);
      return {
        ...adminData,
        syncedAt: new Date().toISOString(),
        resolvedBy: 'admin_priority'
      };
    } else {
      this.log(`Conflict resolved: Using client data (newer)`);
      return {
        ...clientData,
        syncedAt: new Date().toISOString(),
        resolvedBy: 'timestamp_priority'
      };
    }
  }

  // ===========================
  // DATA UPDATING
  // ===========================

  private async updateAdminPropertyData(propertyId: string, data: any): Promise<void> {
    // Update admin dashboard cache/state
    if (typeof window !== 'undefined' && window.adminDashboard) {
      window.adminDashboard.updatePropertyData(propertyId, data);
    }
    
    this.log(`Admin property data updated for: ${propertyId}`);
  }

  private async updateClientPropertyData(propertyId: string, data: any): Promise<void> {
    // Update client portal cache/state
    if (typeof window !== 'undefined' && window.clientPortal) {
      window.clientPortal.updatePropertyData(propertyId, data);
    }
    
    this.log(`Client property data updated for: ${propertyId}`);
  }

  private async updateAdminImageData(propertyId: string, imageData: any): Promise<void> {
    // Update admin dashboard image cache
    if (typeof window !== 'undefined' && window.adminDashboard) {
      window.adminDashboard.updateImageData(propertyId, imageData);
    }
    
    this.log(`Admin image data updated for: ${propertyId}`);
  }

  private async updateClientImageData(propertyId: string, imageData: any): Promise<void> {
    // Update client portal image cache
    if (typeof window !== 'undefined' && window.clientPortal) {
      window.clientPortal.updateImageData(propertyId, imageData);
    }
    
    this.log(`Client image data updated for: ${propertyId}`);
  }

  // ===========================
  // FULL SYNCHRONIZATION
  // ===========================

  async performSynchronization(): Promise<void> {
    if (this.isSync) {
      this.log('Sync already in progress, skipping...');
      return;
    }

    this.isSync = true;
    const startTime = Date.now();

    try {
      this.log('Starting full dashboard synchronization...');

      // Process pending sync events
      await this.processPendingSyncEvents();

      // Sync all properties
      await this.syncAllProperties();

      // Update last sync timestamp
      this.lastSyncTimestamp = new Date().toISOString();

      const duration = Date.now() - startTime;
      this.log(`Full synchronization completed in ${duration}ms`);

      this.emit('sync_completed', {
        duration,
        timestamp: this.lastSyncTimestamp,
        propertiesSynced: this.adminDashboardData.size
      });

    } catch (error) {
      this.log('Error during full synchronization:', error);
      this.emit('sync_error', {
        type: 'full_sync_error',
        error: error.message,
        timestamp: new Date().toISOString()
      });
    } finally {
      this.isSync = false;
    }
  }

  private async processPendingSyncEvents(): Promise<void> {
    if (this.pendingSyncQueue.length === 0) {
      return;
    }

    this.log(`Processing ${this.pendingSyncQueue.length} pending sync events...`);

    const events = [...this.pendingSyncQueue];
    this.pendingSyncQueue = [];

    for (const event of events) {
      try {
        await this.processSyncEvent(event);
      } catch (error) {
        this.log(`Error processing sync event:`, error);
        // Re-queue failed events for retry
        this.pendingSyncQueue.push(event);
      }
    }
  }

  private async processSyncEvent(event: SyncEvent): Promise<void> {
    switch (event.type) {
      case 'property_updated':
        if (event.propertyId) {
          await this.syncPropertyData(event.propertyId, event.source);
        }
        break;

      case 'images_uploaded':
        if (event.propertyId && event.data.images) {
          await this.syncPropertyImages(event.propertyId, event.data.images);
        }
        break;

      case 'data_refresh':
        await this.performSynchronization();
        break;

      default:
        this.log(`Unknown sync event type: ${event.type}`);
    }
  }

  private async syncAllProperties(): Promise<void> {
    try {
      // Get all properties from admin API
      const adminProperties = await this.fetchAllAdminProperties();
      
      if (!adminProperties || adminProperties.length === 0) {
        this.log('No properties found for synchronization');
        return;
      }

      // Sync each property
      for (const property of adminProperties) {
        try {
          await this.syncPropertyData(property.id, 'admin_dashboard');
        } catch (error) {
          this.log(`Failed to sync property ${property.id}:`, error);
          // Continue with other properties
        }
      }

      this.log(`Synchronized ${adminProperties.length} properties`);

    } catch (error) {
      this.log('Error syncing all properties:', error);
      throw error;
    }
  }

  private async fetchAllAdminProperties(): Promise<any[]> {
    try {
      const token = this.getAuthToken();
      const response = await fetch('/api/internal/v1/properties?limit=100', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Admin API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data.success ? data.data.properties : [];

    } catch (error) {
      this.log('Error fetching all admin properties:', error);
      return [];
    }
  }

  // ===========================
  // EVENT HANDLING
  // ===========================

  /**
   * Queue a sync event for processing
   */
  queueSyncEvent(event: Omit<SyncEvent, 'timestamp'>): void {
    const fullEvent: SyncEvent = {
      ...event,
      timestamp: new Date().toISOString()
    };

    this.pendingSyncQueue.push(fullEvent);
    this.log(`Queued sync event: ${event.type} from ${event.source}`);

    // Trigger immediate sync for high-priority events
    if (event.type === 'property_updated' || event.type === 'images_uploaded') {
      setTimeout(() => this.processSyncEvent(fullEvent), 1000);
    }
  }

  /**
   * Trigger immediate synchronization
   */
  triggerSync(reason: string = 'Manual trigger'): void {
    this.log(`Triggering immediate sync: ${reason}`);
    setTimeout(() => this.performSynchronization(), 500);
  }

  // ===========================
  // UTILITY METHODS
  // ===========================

  private getAuthToken(): string {
    return localStorage.getItem('authToken') || '';
  }

  private log(message: string, ...args: any[]): void {
    if (this.config.debugMode) {
      console.log(`[DashboardSync] ${message}`, ...args);
    }
  }

  // ===========================
  // PUBLIC API
  // ===========================

  /**
   * Start the synchronization service
   */
  start(): void {
    this.log('Starting Dashboard Synchronization Service...');
    
    if (this.config.enableRealTimeSync) {
      this.startSyncTimer();
    }
    
    // Perform initial sync
    setTimeout(() => this.performSynchronization(), 2000);
  }

  /**
   * Stop the synchronization service
   */
  stop(): void {
    this.log('Stopping Dashboard Synchronization Service...');
    this.stopSyncTimer();
    this.removeAllListeners();
  }

  /**
   * Get sync statistics
   */
  getSyncStatistics() {
    return {
      lastSyncTimestamp: this.lastSyncTimestamp,
      adminCacheSize: this.adminDashboardData.size,
      clientCacheSize: this.clientPortalData.size,
      pendingEvents: this.pendingSyncQueue.length,
      isActive: this.config.enableRealTimeSync,
      syncInterval: this.config.syncIntervalMs
    };
  }

  /**
   * Clear all cached data
   */
  clearCache(): void {
    this.adminDashboardData.clear();
    this.clientPortalData.clear();
    this.pendingSyncQueue = [];
    this.log('Cache cleared');
  }

  /**
   * Update sync configuration
   */
  updateConfig(newConfig: Partial<SyncConfiguration>): void {
    this.config = { ...this.config, ...newConfig };
    
    if (newConfig.enableRealTimeSync !== undefined) {
      if (newConfig.enableRealTimeSync) {
        this.startSyncTimer();
      } else {
        this.stopSyncTimer();
      }
    }
    
    if (newConfig.syncIntervalMs && this.config.enableRealTimeSync) {
      this.startSyncTimer(); // Restart with new interval
    }
    
    this.log('Configuration updated:', newConfig);
  }
}

// ===========================
// SINGLETON INSTANCE
// ===========================

export const dashboardSyncService = new DashboardSynchronizationService({
  enableRealTimeSync: true,
  syncIntervalMs: 30000,
  debugMode: process.env.NODE_ENV === 'development'
});

// Global window attachment for cross-component access
if (typeof window !== 'undefined') {
  window.dashboardSyncService = dashboardSyncService;
}

export default dashboardSyncService;
