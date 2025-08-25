/**
 * APEX AI ADMIN DASHBOARD SYNCHRONIZATION INTEGRATION
 * ===================================================
 * Integration script to connect Admin Dashboard with Client Portal sync
 * Features: Real-time data sync, event triggering, cross-platform updates
 */

import { dashboardSyncService } from '../../shared-dashboard-sync.js';

// ===========================
// ADMIN DASHBOARD SYNC INTEGRATION
// ===========================

class AdminDashboardSyncIntegration {
  constructor() {
    this.isInitialized = false;
    this.syncService = null;
    this.eventListeners = new Map();
  }

  // ===========================
  // INITIALIZATION
  // ===========================

  async initialize() {
    try {
      console.log('🔄 Initializing Admin Dashboard Sync Integration...');
      
      // Import and initialize the dashboard sync service
      if (typeof window !== 'undefined') {
        this.syncService = window.dashboardSyncService || dashboardSyncService;
      } else {
        this.syncService = dashboardSyncService;
      }

      // Set up event listeners
      this.setupSyncEventListeners();
      
      // Start the sync service
      this.syncService.start();
      
      this.isInitialized = true;
      console.log('✅ Admin Dashboard Sync Integration initialized');

    } catch (error) {
      console.error('❌ Failed to initialize Admin Dashboard Sync Integration:', error);
      throw error;
    }
  }

  // ===========================
  // EVENT LISTENERS
  // ===========================

  setupSyncEventListeners() {
    if (!this.syncService) return;

    // Listen for property sync events
    this.syncService.on('property_synced', (event) => {
      console.log('🏢 Property synced:', event.propertyId);
      this.handlePropertySyncComplete(event);
    });

    // Listen for image sync events
    this.syncService.on('images_synced', (event) => {
      console.log('🖼️ Images synced:', event.propertyId);
      this.handleImageSyncComplete(event);
    });

    // Listen for sync completion
    this.syncService.on('sync_completed', (event) => {
      console.log('✅ Full sync completed:', event);
      this.handleFullSyncComplete(event);
    });

    // Listen for sync errors
    this.syncService.on('sync_error', (event) => {
      console.error('❌ Sync error:', event);
      this.handleSyncError(event);
    });
  }

  // ===========================
  // ADMIN DASHBOARD ACTIONS
  // ===========================

  /**
   * Trigger property data synchronization from admin dashboard
   */
  async syncPropertyFromAdmin(propertyId, propertyData) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      console.log(`🔄 Syncing property from admin: ${propertyId}`);
      
      // Queue sync event for the property
      this.syncService.queueSyncEvent({
        type: 'property_updated',
        source: 'admin_dashboard',
        propertyId: propertyId,
        data: propertyData
      });

      // Trigger immediate sync for this property
      await this.syncService.syncPropertyData(propertyId, 'admin_dashboard');
      
      console.log(`✅ Property sync triggered: ${propertyId}`);

    } catch (error) {
      console.error(`❌ Failed to sync property ${propertyId}:`, error);
      throw error;
    }
  }

  /**
   * Trigger image synchronization from admin dashboard
   */
  async syncImagesFromAdmin(propertyId, imageData) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      console.log(`🔄 Syncing images from admin: ${propertyId}`);
      
      // Queue sync event for images
      this.syncService.queueSyncEvent({
        type: 'images_uploaded',
        source: 'admin_dashboard',
        propertyId: propertyId,
        data: { images: imageData }
      });

      // Trigger immediate image sync
      await this.syncService.syncPropertyImages(propertyId, imageData);
      
      console.log(`✅ Image sync triggered: ${propertyId}`);

    } catch (error) {
      console.error(`❌ Failed to sync images for ${propertyId}:`, error);
      throw error;
    }
  }

  /**
   * Trigger full dashboard synchronization
   */
  async triggerFullSync(reason = 'Admin dashboard request') {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      console.log('🔄 Triggering full dashboard sync...');
      
      this.syncService.triggerSync(reason);
      
      console.log('✅ Full sync triggered');

    } catch (error) {
      console.error('❌ Failed to trigger full sync:', error);
      throw error;
    }
  }

  // ===========================
  // EVENT HANDLERS
  // ===========================

  handlePropertySyncComplete(event) {
    // Emit custom event for admin dashboard components to listen to
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('admin-property-synced', {
        detail: {
          propertyId: event.propertyId,
          timestamp: event.timestamp
        }
      }));
    }
  }

  handleImageSyncComplete(event) {
    // Emit custom event for admin dashboard components
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('admin-images-synced', {
        detail: {
          propertyId: event.propertyId,
          imageCount: event.imageCount,
          timestamp: event.timestamp
        }
      }));
    }
  }

  handleFullSyncComplete(event) {
    // Emit custom event for admin dashboard
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('admin-sync-completed', {
        detail: {
          duration: event.duration,
          propertiesSynced: event.propertiesSynced,
          timestamp: event.timestamp
        }
      }));
    }
  }

  handleSyncError(event) {
    // Emit error event for admin dashboard
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('admin-sync-error', {
        detail: {
          type: event.type,
          error: event.error,
          timestamp: event.timestamp
        }
      }));
    }
  }

  // ===========================
  // UTILITY METHODS
  // ===========================

  /**
   * Get sync statistics for admin dashboard display
   */
  getSyncStatistics() {
    if (!this.syncService) {
      return {
        lastSync: 'Not available',
        isActive: false,
        pendingEvents: 0
      };
    }

    return this.syncService.getSyncStatistics();
  }

  /**
   * Register custom event listener for sync events
   */
  addEventListener(eventType, callback) {
    if (!this.eventListeners.has(eventType)) {
      this.eventListeners.set(eventType, []);
    }
    
    this.eventListeners.get(eventType).push(callback);
    
    // Add DOM event listener if in browser
    if (typeof window !== 'undefined') {
      window.addEventListener(`admin-${eventType}`, callback);
    }
  }

  /**
   * Remove event listener
   */
  removeEventListener(eventType, callback) {
    if (this.eventListeners.has(eventType)) {
      const listeners = this.eventListeners.get(eventType);
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
    
    // Remove DOM event listener if in browser
    if (typeof window !== 'undefined') {
      window.removeEventListener(`admin-${eventType}`, callback);
    }
  }

  /**
   * Clean up and stop sync integration
   */
  cleanup() {
    console.log('🧹 Cleaning up Admin Dashboard Sync Integration...');
    
    // Remove all event listeners
    this.eventListeners.forEach((listeners, eventType) => {
      listeners.forEach(callback => {
        this.removeEventListener(eventType, callback);
      });
    });
    
    this.eventListeners.clear();
    
    // Stop sync service if we're the only user
    if (this.syncService) {
      // Note: Don't stop the service as other components might be using it
      this.syncService.removeAllListeners();
    }
    
    this.isInitialized = false;
    console.log('✅ Admin Dashboard Sync Integration cleaned up');
  }
}

// ===========================
// SINGLETON INSTANCE
// ===========================

export const adminDashboardSync = new AdminDashboardSyncIntegration();

// ===========================
// REACT HOOK FOR ADMIN DASHBOARD
// ===========================

export const useAdminDashboardSync = () => {
  const [syncStats, setSyncStats] = React.useState(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    // Initialize sync integration
    adminDashboardSync.initialize().catch(setError);

    // Set up event listeners for sync updates
    const handleSyncCompleted = (event) => {
      setSyncStats(adminDashboardSync.getSyncStatistics());
      setIsLoading(false);
    };

    const handleSyncError = (event) => {
      setError(event.detail.error);
      setIsLoading(false);
    };

    adminDashboardSync.addEventListener('sync-completed', handleSyncCompleted);
    adminDashboardSync.addEventListener('sync-error', handleSyncError);

    // Update sync stats initially
    setSyncStats(adminDashboardSync.getSyncStatistics());

    // Cleanup on unmount
    return () => {
      adminDashboardSync.removeEventListener('sync-completed', handleSyncCompleted);
      adminDashboardSync.removeEventListener('sync-error', handleSyncError);
    };
  }, []);

  const triggerPropertySync = async (propertyId, propertyData) => {
    setIsLoading(true);
    setError(null);
    try {
      await adminDashboardSync.syncPropertyFromAdmin(propertyId, propertyData);
    } catch (err) {
      setError(err.message);
      setIsLoading(false);
    }
  };

  const triggerImageSync = async (propertyId, imageData) => {
    setIsLoading(true);
    setError(null);
    try {
      await adminDashboardSync.syncImagesFromAdmin(propertyId, imageData);
    } catch (err) {
      setError(err.message);
      setIsLoading(false);
    }
  };

  const triggerFullSync = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await adminDashboardSync.triggerFullSync('Manual refresh from admin dashboard');
    } catch (err) {
      setError(err.message);
      setIsLoading(false);
    }
  };

  return {
    syncStats,
    isLoading,
    error,
    triggerPropertySync,
    triggerImageSync,
    triggerFullSync
  };
};

// Global window attachment for easy access
if (typeof window !== 'undefined') {
  window.adminDashboardSync = adminDashboardSync;
}

export default adminDashboardSync;
