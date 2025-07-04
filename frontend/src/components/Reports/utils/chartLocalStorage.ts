/**
 * Chart Local Storage Manager - Advanced Local Storage Management for Chart Data
 * Extracted from DataVisualizationPanel for better modularity
 * Production-ready local storage utilities with error handling and validation
 */

import { DailyReport, ClientData, MetricsData } from '../../../types/reports';
import { LOCAL_STORAGE_CONFIG } from '../constants/chartConstants';

/**
 * Interface for saved chart data structure
 */
interface SavedChartData {
  dailyReports: DailyReport[];
  metrics: MetricsData;
  client: ClientData | null;
  dateRange: { start: Date; end: Date };
  activeTab: string;
  timeframe: string;
  comparisonType: string;
  savedAt: string;
  version: string;
}

/**
 * Save chart data to local storage with comprehensive error handling
 * 
 * @param data - The data object to save
 * @returns Promise<boolean> - Success status
 */
export const saveToLocalStorage = async (data: any): Promise<boolean> => {
  try {
    const savedData = {
      ...data,
      savedAt: new Date().toISOString(),
      version: LOCAL_STORAGE_CONFIG.version
    };
    
    const serializedData = JSON.stringify(savedData);
    
    // Check if data is too large (most browsers limit to ~5-10MB)
    if (serializedData.length > 5 * 1024 * 1024) { // 5MB limit
      console.warn('⚠️ Data size exceeds recommended limit, attempting to save anyway');
    }
    
    localStorage.setItem(LOCAL_STORAGE_CONFIG.key, serializedData);
    console.log('💾 Data saved to local storage successfully', {
      size: `${(serializedData.length / 1024).toFixed(1)}KB`,
      timestamp: savedData.savedAt
    });
    
    return true;
  } catch (error) {
    console.error('❌ Failed to save to local storage:', error);
    
    // Try to handle quota exceeded error
    if (error instanceof Error && error.name === 'QuotaExceededError') {
      console.warn('🗑️ Storage quota exceeded, attempting cleanup...');
      await clearOldChartData();
      
      // Retry once after cleanup
      try {
        const retryData = {
          ...data,
          savedAt: new Date().toISOString(),
          version: LOCAL_STORAGE_CONFIG.version
        };
        localStorage.setItem(LOCAL_STORAGE_CONFIG.key, JSON.stringify(retryData));
        console.log('✅ Data saved successfully after cleanup');
        return true;
      } catch (retryError) {
        console.error('❌ Failed to save even after cleanup:', retryError);
      }
    }
    
    return false;
  }
};

/**
 * Load chart data from local storage with validation
 * 
 * @returns Promise<SavedChartData | null> - The loaded data or null if not found/invalid
 */
export const loadFromLocalStorage = async (): Promise<SavedChartData | null> => {
  try {
    const data = localStorage.getItem(LOCAL_STORAGE_CONFIG.key);
    
    if (!data) {
      console.info('📂 No saved data found in local storage');
      return null;
    }
    
    const parsed = JSON.parse(data) as SavedChartData;
    
    // Validate data structure
    if (!validateSavedData(parsed)) {
      console.warn('⚠️ Invalid data structure found, clearing storage');
      localStorage.removeItem(LOCAL_STORAGE_CONFIG.key);
      return null;
    }
    
    // Check version compatibility
    if (parsed.version !== LOCAL_STORAGE_CONFIG.version) {
      console.warn('⚠️ Version mismatch detected, data may be outdated');
      // Could implement migration logic here
    }
    
    console.log('📂 Data loaded from local storage:', {
      savedAt: parsed.savedAt,
      version: parsed.version,
      reportsCount: parsed.dailyReports?.length || 0
    });
    
    return parsed;
  } catch (error) {
    console.error('❌ Failed to load from local storage:', error);
    
    // Clear corrupted data
    try {
      localStorage.removeItem(LOCAL_STORAGE_CONFIG.key);
      console.log('🗑️ Corrupted data cleared from storage');
    } catch (clearError) {
      console.error('❌ Failed to clear corrupted data:', clearError);
    }
    
    return null;
  }
};

/**
 * Validate the structure of saved data
 * 
 * @param data - The data to validate
 * @returns boolean - Whether the data is valid
 */
const validateSavedData = (data: any): data is SavedChartData => {
  try {
    return (
      data &&
      typeof data === 'object' &&
      typeof data.savedAt === 'string' &&
      typeof data.version === 'string' &&
      Array.isArray(data.dailyReports) &&
      data.metrics &&
      typeof data.metrics === 'object'
    );
  } catch (error) {
    console.error('❌ Data validation failed:', error);
    return false;
  }
};

/**
 * Clear old chart data from local storage
 * Removes outdated or corrupted data
 */
export const clearOldChartData = async (): Promise<void> => {
  try {
    // Get all localStorage keys
    const allKeys = Object.keys(localStorage);
    
    // Remove old chart data (could be multiple versions)
    const chartKeys = allKeys.filter(key => 
      key.startsWith('apexAi') || 
      key.startsWith('chartData') ||
      key.includes('report')
    );
    
    chartKeys.forEach(key => {
      if (key !== LOCAL_STORAGE_CONFIG.key) {
        localStorage.removeItem(key);
        console.log(`🗑️ Removed old data: ${key}`);
      }
    });
    
    console.log('✅ Old chart data cleanup completed');
  } catch (error) {
    console.error('❌ Failed to clear old data:', error);
  }
};

/**
 * Get storage usage information
 * 
 * @returns Object with storage usage details
 */
export const getStorageInfo = (): { used: number; available: number; percentage: number } => {
  try {
    let used = 0;
    
    // Calculate used space
    Object.keys(localStorage).forEach(key => {
      const item = localStorage.getItem(key);
      if (item) {
        used += item.length;
      }
    });
    
    // Estimate available space (5MB typical limit)
    const estimated = 5 * 1024 * 1024; // 5MB in bytes
    const available = Math.max(0, estimated - used);
    const percentage = (used / estimated) * 100;
    
    return {
      used: Math.round(used / 1024), // KB
      available: Math.round(available / 1024), // KB
      percentage: Math.round(percentage)
    };
  } catch (error) {
    console.error('❌ Failed to get storage info:', error);
    return { used: 0, available: 0, percentage: 0 };
  }
};

/**
 * Auto-save functionality with debouncing
 * Prevents excessive save operations
 */
class AutoSaveManager {
  private saveTimeout: NodeJS.Timeout | null = null;
  private isEnabled = false;
  private currentData: any = null;
  private saveCallback: (() => void) | null = null;

  /**
   * Enable auto-save with callback
   * 
   * @param callback - Function to call for saving
   */
  enable(callback: () => void) {
    this.isEnabled = true;
    this.saveCallback = callback;
    console.log('🔄 Auto-save enabled');
  }

  /**
   * Disable auto-save
   */
  disable() {
    this.isEnabled = false;
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
      this.saveTimeout = null;
    }
    console.log('⏸️ Auto-save disabled');
  }

  /**
   * Schedule a save operation (debounced)
   * 
   * @param data - Data to save
   */
  scheduleSave(data: any) {
    if (!this.isEnabled || !this.saveCallback) return;

    this.currentData = data;

    // Clear existing timeout
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }

    // Schedule new save
    this.saveTimeout = setTimeout(() => {
      if (this.saveCallback) {
        this.saveCallback();
        console.log('⏰ Auto-save executed');
      }
    }, LOCAL_STORAGE_CONFIG.autoSaveInterval);
  }

  /**
   * Force immediate save
   */
  forceSave() {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
      this.saveTimeout = null;
    }
    
    if (this.saveCallback) {
      this.saveCallback();
      console.log('💾 Forced save executed');
    }
  }
}

// Export singleton instance
export const autoSaveManager = new AutoSaveManager();

/**
 * Export data to file for backup
 * 
 * @param data - Data to export
 * @param filename - Optional filename
 */
export const exportToFile = (data: any, filename: string = 'chart-data-backup.json') => {
  try {
    const exportData = {
      ...data,
      exportedAt: new Date().toISOString(),
      version: LOCAL_STORAGE_CONFIG.version
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { 
      type: 'application/json' 
    });
    
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    
    URL.revokeObjectURL(url);
    console.log('📁 Data exported to file successfully');
  } catch (error) {
    console.error('❌ Failed to export data:', error);
  }
};

/**
 * Import data from file
 * 
 * @param file - File to import from
 * @returns Promise<any> - Imported data
 */
export const importFromFile = (file: File): Promise<any> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        
        if (validateSavedData(data)) {
          console.log('📁 Data imported from file successfully');
          resolve(data);
        } else {
          reject(new Error('Invalid data format'));
        }
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
};
