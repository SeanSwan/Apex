/**
 * Export Manager - Image Export and Download Utilities
 * Extracted from EnhancedPreviewPanel for better modularity
 * Production-ready export functionality with multiple format support
 */

import html2canvas from 'html2canvas';
import { format } from 'date-fns';
import { 
  EXPORT_CONFIG, 
  DATE_FORMAT_PATTERNS,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  LOADING_STATES,
  LoadingState
} from '../constants/previewPanelConstants';

/**
 * Export Format Types
 */
export type ExportFormat = 'png' | 'jpeg' | 'webp' | 'svg';

/**
 * Export Quality Settings
 */
export interface ExportQualitySettings {
  format: ExportFormat;
  quality: number;
  scale: number;
  width?: number;
  height?: number;
}

/**
 * Export Options Interface
 */
export interface ExportOptions {
  filename?: string;
  format?: ExportFormat;
  quality?: number;
  scale?: number;
  includeTimestamp?: boolean;
  customDimensions?: {
    width: number;
    height: number;
  };
  cropArea?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

/**
 * Export Result Interface
 */
export interface ExportResult {
  success: boolean;
  filename?: string;
  dataUrl?: string;
  fileSize?: number;
  dimensions?: {
    width: number;
    height: number;
  };
  format?: ExportFormat;
  error?: string;
  exportTime?: number;
}

/**
 * Canvas Generation Options
 */
export interface CanvasOptions {
  scale?: number;
  logging?: boolean;
  useCORS?: boolean;
  allowTaint?: boolean;
  backgroundColor?: string | null;
  width?: number;
  height?: number;
  windowWidth?: number;
  windowHeight?: number;
  scrollX?: number;
  scrollY?: number;
  ignoreElements?: (element: Element) => boolean;
}

/**
 * Download Options Interface
 */
export interface DownloadOptions {
  filename: string;
  dataUrl: string;
  format: ExportFormat;
  showNotification?: boolean;
}

/**
 * Export Manager Class - Handles all export operations
 */
export class ExportManager {
  /**
   * Export HTML element as image
   */
  static async exportElementAsImage(
    element: HTMLElement,
    options: ExportOptions = {}
  ): Promise<ExportResult> {
    const startTime = Date.now();
    
    try {
      console.log('🔄 Export: Starting image export with options:', options);

      // Validate element
      if (!element) {
        throw new Error('Element is required for export');
      }

      // Prepare export settings
      const exportSettings = this.prepareExportSettings(options);
      
      // Generate canvas
      const canvas = await this.generateCanvas(element, {
        scale: exportSettings.scale,
        logging: EXPORT_CONFIG.CANVAS.LOGGING,
        useCORS: EXPORT_CONFIG.CANVAS.USE_CORS,
        allowTaint: EXPORT_CONFIG.CANVAS.ALLOW_TAINT,
        width: exportSettings.customDimensions?.width,
        height: exportSettings.customDimensions?.height
      });

      // Process canvas (crop if needed)
      const processedCanvas = options.cropArea ? 
        this.cropCanvas(canvas, options.cropArea) : canvas;

      // Generate data URL
      const dataUrl = this.canvasToDataUrl(processedCanvas, exportSettings);
      
      // Generate filename
      const filename = this.generateFilename(
        options.filename, 
        exportSettings.format,
        options.includeTimestamp
      );

      // Calculate file size (approximate)
      const fileSize = this.estimateFileSize(dataUrl);

      const exportTime = Date.now() - startTime;

      console.log('✅ Export: Image export completed successfully', {
        filename,
        format: exportSettings.format,
        dimensions: { width: processedCanvas.width, height: processedCanvas.height },
        fileSize: `${(fileSize / 1024).toFixed(1)}KB`,
        exportTime: `${exportTime}ms`
      });

      return {
        success: true,
        filename,
        dataUrl,
        fileSize,
        dimensions: {
          width: processedCanvas.width,
          height: processedCanvas.height
        },
        format: exportSettings.format,
        exportTime
      };

    } catch (error) {
      const exportTime = Date.now() - startTime;
      console.error('❌ Export: Image export failed', error);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : ERROR_MESSAGES.EXPORT_FAILED,
        exportTime
      };
    }
  }

  /**
   * Download image directly from element
   */
  static async downloadElementAsImage(
    element: HTMLElement,
    options: ExportOptions = {}
  ): Promise<ExportResult> {
    try {
      // Export element as image
      const exportResult = await this.exportElementAsImage(element, options);
      
      if (!exportResult.success || !exportResult.dataUrl || !exportResult.filename) {
        throw new Error(exportResult.error || 'Export failed');
      }

      // Download the image
      await this.downloadDataUrl({
        filename: exportResult.filename,
        dataUrl: exportResult.dataUrl,
        format: exportResult.format || 'png',
        showNotification: true
      });

      console.log('✅ Export: Image download completed successfully');
      
      return exportResult;

    } catch (error) {
      console.error('❌ Export: Image download failed', error);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : ERROR_MESSAGES.EXPORT_FAILED
      };
    }
  }

  /**
   * Generate canvas from HTML element
   */
  private static async generateCanvas(
    element: HTMLElement,
    options: CanvasOptions = {}
  ): Promise<HTMLCanvasElement> {
    const canvasOptions = {
      scale: options.scale || EXPORT_CONFIG.CANVAS.SCALE,
      logging: options.logging ?? EXPORT_CONFIG.CANVAS.LOGGING,
      useCORS: options.useCORS ?? EXPORT_CONFIG.CANVAS.USE_CORS,
      allowTaint: options.allowTaint ?? EXPORT_CONFIG.CANVAS.ALLOW_TAINT,
      backgroundColor: options.backgroundColor,
      width: options.width || element.scrollWidth,
      height: options.height || element.scrollHeight,
      windowWidth: options.windowWidth || EXPORT_CONFIG.CANVAS.WINDOW_WIDTH,
      windowHeight: options.windowHeight || element.scrollHeight,
      scrollX: options.scrollX || 0,
      scrollY: options.scrollY || 0,
      ignoreElements: options.ignoreElements
    };

    console.log('🖼️ Export: Generating canvas with options:', canvasOptions);

    return await html2canvas(element, canvasOptions);
  }

  /**
   * Crop canvas to specified area
   */
  private static cropCanvas(
    canvas: HTMLCanvasElement,
    cropArea: { x: number; y: number; width: number; height: number; }
  ): HTMLCanvasElement {
    const croppedCanvas = document.createElement('canvas');
    const ctx = croppedCanvas.getContext('2d');
    
    if (!ctx) {
      throw new Error('Failed to get canvas context for cropping');
    }

    croppedCanvas.width = cropArea.width;
    croppedCanvas.height = cropArea.height;

    ctx.drawImage(
      canvas,
      cropArea.x,
      cropArea.y,
      cropArea.width,
      cropArea.height,
      0,
      0,
      cropArea.width,
      cropArea.height
    );

    return croppedCanvas;
  }

  /**
   * Convert canvas to data URL with specified format and quality
   */
  private static canvasToDataUrl(
    canvas: HTMLCanvasElement,
    settings: ExportQualitySettings
  ): string {
    const mimeType = this.getMimeType(settings.format);
    
    if (settings.format === 'png') {
      return canvas.toDataURL(mimeType);
    } else {
      return canvas.toDataURL(mimeType, settings.quality);
    }
  }

  /**
   * Get MIME type for export format
   */
  private static getMimeType(format: ExportFormat): string {
    const mimeTypes: Record<ExportFormat, string> = {
      png: 'image/png',
      jpeg: 'image/jpeg',
      webp: 'image/webp',
      svg: 'image/svg+xml'
    };
    
    return mimeTypes[format] || mimeTypes.png;
  }

  /**
   * Prepare export settings with defaults
   */
  private static prepareExportSettings(options: ExportOptions): ExportQualitySettings {
    return {
      format: options.format || 'png',
      quality: options.quality || EXPORT_CONFIG.IMAGE.QUALITY,
      scale: options.scale || EXPORT_CONFIG.IMAGE.SCALE,
      width: options.customDimensions?.width,
      height: options.customDimensions?.height
    };
  }

  /**
   * Generate filename with proper extension
   */
  private static generateFilename(
    baseFilename?: string,
    format: ExportFormat = 'png',
    includeTimestamp: boolean = true
  ): string {
    let filename = baseFilename || 'export';
    
    // Remove existing extension
    filename = filename.replace(/\.[^/.]+$/, '');
    
    // Add timestamp if requested
    if (includeTimestamp) {
      const timestamp = format(new Date(), DATE_FORMAT_PATTERNS.FILE_NAME);
      filename = `${filename}-${timestamp}`;
    }
    
    // Add format extension
    filename = `${filename}.${format}`;
    
    return filename;
  }

  /**
   * Estimate file size from data URL
   */
  private static estimateFileSize(dataUrl: string): number {
    // Remove data URL prefix to get base64 data
    const base64Data = dataUrl.split(',')[1] || '';
    
    // Calculate approximate file size
    const sizeInBytes = (base64Data.length * 3) / 4;
    
    // Account for any padding
    const padding = base64Data.match(/=/g);
    return sizeInBytes - (padding ? padding.length : 0);
  }

  /**
   * Download data URL as file
   */
  private static async downloadDataUrl(options: DownloadOptions): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        // Create download link
        const link = document.createElement('a');
        link.href = options.dataUrl;
        link.download = options.filename;
        link.style.display = 'none';
        
        // Add to DOM and trigger download
        document.body.appendChild(link);
        link.click();
        
        // Clean up
        setTimeout(() => {
          document.body.removeChild(link);
          resolve();
        }, 100);
        
        // Show notification if requested
        if (options.showNotification) {
          console.log(`✅ Downloaded: ${options.filename}`);
        }
        
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Convert blob to data URL
   */
  static blobToDataUrl(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error('Failed to convert blob to data URL'));
      reader.readAsDataURL(blob);
    });
  }

  /**
   * Convert data URL to blob
   */
  static dataUrlToBlob(dataUrl: string): Blob {
    const byteString = atob(dataUrl.split(',')[1]);
    const mimeString = dataUrl.split(',')[0].split(':')[1].split(';')[0];
    
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    
    return new Blob([ab], { type: mimeString });
  }

  /**
   * Get optimal export settings for different use cases
   */
  static getOptimalSettings(useCase: 'web' | 'print' | 'archive' | 'thumbnail'): ExportQualitySettings {
    const settingsMap: Record<string, ExportQualitySettings> = {
      web: {
        format: 'png',
        quality: 0.8,
        scale: 1
      },
      print: {
        format: 'png',
        quality: 0.95,
        scale: 2
      },
      archive: {
        format: 'png',
        quality: 1.0,
        scale: 2
      },
      thumbnail: {
        format: 'jpeg',
        quality: 0.7,
        scale: 0.5
      }
    };
    
    return settingsMap[useCase] || settingsMap.web;
  }
}

/**
 * React Hook for Export Management
 */
export interface UseExportManagerOptions {
  onSuccess?: (result: ExportResult) => void;
  onError?: (error: string) => void;
  onStart?: () => void;
  onComplete?: () => void;
}

export interface UseExportManagerReturn {
  exportAsImage: (element: HTMLElement, options?: ExportOptions) => Promise<ExportResult>;
  downloadAsImage: (element: HTMLElement, options?: ExportOptions) => Promise<ExportResult>;
  isExporting: boolean;
  lastResult: ExportResult | null;
  error: string | null;
}

/**
 * Custom hook for export management
 */
export const useExportManager = (hookOptions: UseExportManagerOptions = {}): UseExportManagerReturn => {
  const [isExporting, setIsExporting] = React.useState(false);
  const [lastResult, setLastResult] = React.useState<ExportResult | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const exportAsImage = React.useCallback(async (
    element: HTMLElement,
    options: ExportOptions = {}
  ): Promise<ExportResult> => {
    setIsExporting(true);
    setError(null);
    hookOptions.onStart?.();

    try {
      const result = await ExportManager.exportElementAsImage(element, options);
      setLastResult(result);

      if (result.success) {
        hookOptions.onSuccess?.(result);
      } else {
        setError(result.error || ERROR_MESSAGES.EXPORT_FAILED);
        hookOptions.onError?.(result.error || ERROR_MESSAGES.EXPORT_FAILED);
      }

      return result;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : ERROR_MESSAGES.EXPORT_FAILED;
      setError(errorMessage);
      hookOptions.onError?.(errorMessage);
      
      const result: ExportResult = {
        success: false,
        error: errorMessage
      };
      setLastResult(result);
      return result;

    } finally {
      setIsExporting(false);
      hookOptions.onComplete?.();
    }
  }, [hookOptions]);

  const downloadAsImage = React.useCallback(async (
    element: HTMLElement,
    options: ExportOptions = {}
  ): Promise<ExportResult> => {
    setIsExporting(true);
    setError(null);
    hookOptions.onStart?.();

    try {
      const result = await ExportManager.downloadElementAsImage(element, options);
      setLastResult(result);

      if (result.success) {
        hookOptions.onSuccess?.(result);
      } else {
        setError(result.error || ERROR_MESSAGES.EXPORT_FAILED);
        hookOptions.onError?.(result.error || ERROR_MESSAGES.EXPORT_FAILED);
      }

      return result;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : ERROR_MESSAGES.EXPORT_FAILED;
      setError(errorMessage);
      hookOptions.onError?.(errorMessage);
      
      const result: ExportResult = {
        success: false,
        error: errorMessage
      };
      setLastResult(result);
      return result;

    } finally {
      setIsExporting(false);
      hookOptions.onComplete?.();
    }
  }, [hookOptions]);

  return {
    exportAsImage,
    downloadAsImage,
    isExporting,
    lastResult,
    error
  };
};

// Export utility functions
export const exportUtils = {
  generateFilename: (base?: string, format: ExportFormat = 'png', timestamp = true) =>
    ExportManager['generateFilename'](base, format, timestamp),
  estimateFileSize: (dataUrl: string) => ExportManager['estimateFileSize'](dataUrl),
  getMimeType: (format: ExportFormat) => ExportManager['getMimeType'](format),
  getOptimalSettings: ExportManager.getOptimalSettings
};

// Default export
export default ExportManager;

// Add React import for the hook
import React from 'react';
