/**
 * Theme Builder Utilities - Helper Functions and State Management
 * Extracted from ThemeBuilder for better modularity
 * Production-ready utilities for theme builder functionality
 */

import { useCallback, useState, useRef, useEffect } from 'react';
import { 
  TIMING_CONSTANTS,
  COLLAPSIBLE_SECTIONS,
  MEDIA_UPLOAD_TYPES,
  MediaUploadType,
  CollapsibleSectionType
} from '../constants/themeConstants';
import { themeValidator, ValidationSummary } from '../utils/themeValidator';
import { themeExporter, exportUtils } from '../utils/themeExporter';
import { themePresetsManager, ExtendedThemeSettings } from '../utils/themePresetsManager';

// Re-export ExtendedThemeSettings for convenience
export type { ExtendedThemeSettings };

/**
 * State management interfaces
 */
export interface ThemeBuilderState {
  activeTab: string;
  activePreset: string | null;
  expandedSections: Record<string, boolean>;
  copiedColor: string | null;
  isLoading: boolean;
  isExporting: boolean;
  lastSaveTime: string | null;
  validationSummary: ValidationSummary | null;
}

export interface ThemeBuilderActions {
  setActiveTab: (tab: string) => void;
  setActivePreset: (preset: string | null) => void;
  toggleSection: (section: string) => void;
  setCopiedColor: (color: string | null) => void;
  setIsLoading: (loading: boolean) => void;
  setIsExporting: (exporting: boolean) => void;
  setLastSaveTime: (time: string) => void;
  setValidationSummary: (summary: ValidationSummary | null) => void;
}

/**
 * Image handling utilities
 */
export const imageUtils = {
  /**
   * Convert file to base64 data URL
   */
  fileToDataURL: (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          resolve(event.target.result as string);
        } else {
          reject(new Error('Failed to read file'));
        }
      };
      reader.onerror = () => reject(new Error('File reading error'));
      reader.readAsDataURL(file);
    });
  },

  /**
   * Validate image file
   */
  validateImageFile: (file: File): { isValid: boolean; error?: string } => {
    const maxSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];

    if (!allowedTypes.includes(file.type)) {
      return {
        isValid: false,
        error: 'Invalid file type. Please use JPEG, PNG, GIF, or WebP.'
      };
    }

    if (file.size > maxSize) {
      return {
        isValid: false,
        error: 'File size too large. Please use files smaller than 5MB.'
      };
    }

    return { isValid: true };
  },

  /**
   * Resize image if needed
   */
  resizeImage: (
    dataURL: string, 
    maxWidth: number, 
    maxHeight: number, 
    quality: number = 0.8
  ): Promise<string> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        let { width, height } = img;

        // Calculate new dimensions
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width *= ratio;
          height *= ratio;
        }

        canvas.width = width;
        canvas.height = height;

        ctx?.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };

      img.src = dataURL;
    });
  },

  /**
   * Extract image metadata
   */
  getImageMetadata: (dataURL: string): Promise<{
    width: number;
    height: number;
    size: number;
    format: string;
  }> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0);
        
        canvas.toBlob((blob) => {
          if (blob) {
            resolve({
              width: img.width,
              height: img.height,
              size: blob.size,
              format: blob.type
            });
          } else {
            reject(new Error('Failed to get image metadata'));
          }
        });
      };
      
      img.onerror = () => reject(new Error('Invalid image'));
      img.src = dataURL;
    });
  }
};

/**
 * Color utilities for theme builder
 */
export const colorBuilderUtils = {
  /**
   * Copy color to clipboard with feedback
   */
  copyColorToClipboard: async (
    color: string, 
    colorName: string,
    setCopiedColor: (color: string | null) => void
  ): Promise<boolean> => {
    try {
      await navigator.clipboard.writeText(color);
      setCopiedColor(colorName);
      setTimeout(() => setCopiedColor(null), TIMING_CONSTANTS.colorCopyTimeout);
      return true;
    } catch (error) {
      console.error('Failed to copy color:', error);
      return false;
    }
  },

  /**
   * Generate complementary colors
   */
  generateComplementaryColors: (baseColor: string): string[] => {
    // Simple complementary color generation
    const hex = baseColor.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);

    // Complementary color
    const compR = 255 - r;
    const compG = 255 - g;
    const compB = 255 - b;
    const complementary = `#${compR.toString(16).padStart(2, '0')}${compG.toString(16).padStart(2, '0')}${compB.toString(16).padStart(2, '0')}`;

    // Triadic colors
    const triadic1 = colorBuilderUtils.rotateHue(baseColor, 120);
    const triadic2 = colorBuilderUtils.rotateHue(baseColor, 240);

    // Analogous colors
    const analogous1 = colorBuilderUtils.rotateHue(baseColor, 30);
    const analogous2 = colorBuilderUtils.rotateHue(baseColor, -30);

    return [complementary, triadic1, triadic2, analogous1, analogous2];
  },

  /**
   * Rotate hue of a color
   */
  rotateHue: (hexColor: string, degrees: number): string => {
    const hex = hexColor.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16) / 255;
    const g = parseInt(hex.substr(2, 2), 16) / 255;
    const b = parseInt(hex.substr(4, 2), 16) / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0;
    const s = max === 0 ? 0 : (max - min) / max;
    const v = max;

    if (max !== min) {
      const delta = max - min;
      switch (max) {
        case r:
          h = (g - b) / delta + (g < b ? 6 : 0);
          break;
        case g:
          h = (b - r) / delta + 2;
          break;
        case b:
          h = (r - g) / delta + 4;
          break;
      }
      h /= 6;
    }

    // Rotate hue
    h = (h + degrees / 360) % 1;
    if (h < 0) h += 1;

    // Convert back to RGB
    const c = v * s;
    const x = c * (1 - Math.abs(((h * 6) % 2) - 1));
    const m = v - c;

    let rNew = 0, gNew = 0, bNew = 0;

    if (h < 1/6) {
      rNew = c; gNew = x; bNew = 0;
    } else if (h < 2/6) {
      rNew = x; gNew = c; bNew = 0;
    } else if (h < 3/6) {
      rNew = 0; gNew = c; bNew = x;
    } else if (h < 4/6) {
      rNew = 0; gNew = x; bNew = c;
    } else if (h < 5/6) {
      rNew = x; gNew = 0; bNew = c;
    } else {
      rNew = c; gNew = 0; bNew = x;
    }

    const finalR = Math.round((rNew + m) * 255);
    const finalG = Math.round((gNew + m) * 255);
    const finalB = Math.round((bNew + m) * 255);

    return `#${finalR.toString(16).padStart(2, '0')}${finalG.toString(16).padStart(2, '0')}${finalB.toString(16).padStart(2, '0')}`;
  }
};

/**
 * Section management utilities
 */
export const sectionUtils = {
  /**
   * Get default expanded sections
   */
  getDefaultExpandedSections: (): Record<string, boolean> => ({
    [COLLAPSIBLE_SECTIONS.BASIC]: true,
    [COLLAPSIBLE_SECTIONS.ADVANCED]: false,
    [COLLAPSIBLE_SECTIONS.EFFECTS]: false,
    [COLLAPSIBLE_SECTIONS.CUSTOM]: false,
  }),

  /**
   * Toggle section state
   */
  toggleSection: (
    sectionId: string,
    expandedSections: Record<string, boolean>,
    setExpandedSections: (sections: Record<string, boolean>) => void
  ) => {
    setExpandedSections({
      ...expandedSections,
      [sectionId]: !expandedSections[sectionId]
    });
  },

  /**
   * Expand all sections
   */
  expandAllSections: (setExpandedSections: (sections: Record<string, boolean>) => void) => {
    const allExpanded = Object.values(COLLAPSIBLE_SECTIONS).reduce((acc, section) => {
      acc[section] = true;
      return acc;
    }, {} as Record<string, boolean>);
    
    setExpandedSections(allExpanded);
  },

  /**
   * Collapse all sections
   */
  collapseAllSections: (setExpandedSections: (sections: Record<string, boolean>) => void) => {
    const allCollapsed = Object.values(COLLAPSIBLE_SECTIONS).reduce((acc, section) => {
      acc[section] = false;
      return acc;
    }, {} as Record<string, boolean>);
    
    setExpandedSections(allCollapsed);
  }
};

/**
 * Theme management utilities
 */
export const themeManagementUtils = {
  /**
   * Apply preset with validation
   */
  applyPreset: async (
    presetName: string,
    currentSettings: ExtendedThemeSettings,
    onChange: (settings: Partial<ExtendedThemeSettings>) => void,
    setActivePreset: (preset: string | null) => void
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const result = themePresetsManager.applyPreset(presetName, currentSettings);
      
      if (result.success) {
        onChange(result.settings);
        setActivePreset(presetName);
        return { success: true };
      } else {
        return { success: false, error: result.errors.join(', ') };
      }
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  },

  /**
   * Save custom preset
   */
  saveCustomPreset: async (
    name: string,
    settings: ExtendedThemeSettings,
    options: {
      description?: string;
      author?: string;
    } = {}
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const result = themePresetsManager.createCustomPreset(name, settings, options);
      return { 
        success: result.success, 
        error: result.error 
      };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  },

  /**
   * Export theme
   */
  exportTheme: async (
    settings: ExtendedThemeSettings,
    format: 'json' | 'css' | 'scss' = 'json',
    filename?: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const result = await themeExporter.exportTheme(settings, format, { filename });
      
      if (result.success) {
        themeExporter.downloadTheme(result);
        return { success: true };
      } else {
        return { success: false, error: result.error };
      }
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  },

  /**
   * Import theme
   */
  importTheme: async (
    file: File
  ): Promise<{ success: boolean; settings?: ExtendedThemeSettings; error?: string }> => {
    try {
      const text = await file.text();
      const extension = file.name.split('.').pop()?.toLowerCase();
      
      let format: 'json' | 'css' | 'scss' = 'json';
      if (extension === 'css') format = 'css';
      else if (extension === 'scss') format = 'scss';
      
      const result = await themeExporter.importTheme(text, format, { 
        validateSettings: true, 
        autoCorrect: true 
      });
      
      if (result.success && result.settings) {
        return { 
          success: true, 
          settings: result.settings 
        };
      } else {
        return { success: false, error: result.error };
      }
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  },

  /**
   * Reset to defaults
   */
  resetToDefaults: (
    onChange: (settings: Partial<ExtendedThemeSettings>) => void,
    setActivePreset: (preset: string | null) => void
  ) => {
    const defaultSettings: Partial<ExtendedThemeSettings> = {
      primaryColor: '#FFFFFF',
      secondaryColor: '#1A1A1A',
      accentColor: '#FFD700',
      fontFamily: 'Inter, sans-serif',
      backgroundOpacity: 0.7,
      reportTitle: 'AI Live Monitoring Report',
      shadowIntensity: 1,
      borderRadius: 12,
      textShadow: false,
      cardStyle: 'modern',
      enableGradient: false,
      customCSS: '',
      animationsEnabled: true,
      darkMode: true
    };

    onChange(defaultSettings);
    setActivePreset(null);
  }
};

/**
 * Form utilities
 */
export const formUtils = {
  /**
   * Debounced onChange handler
   */
  createDebouncedHandler: <T>(
    handler: (value: T) => void,
    delay: number = TIMING_CONSTANTS.debounceDelay
  ) => {
    let timeoutId: NodeJS.Timeout;
    
    return (value: T) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => handler(value), delay);
    };
  },

  /**
   * Validate form field
   */
  validateField: (
    fieldName: string,
    value: any,
    settings: ExtendedThemeSettings
  ): { isValid: boolean; errors: string[] } => {
    const result = themeValidator.validateSingleSetting(fieldName, value, settings);
    const errors = result.filter(r => r.severity === 'error').map(r => r.message);
    
    return {
      isValid: errors.length === 0,
      errors
    };
  },

  /**
   * Auto-save manager
   */
  createAutoSave: (
    saveFunction: () => void,
    interval: number = TIMING_CONSTANTS.autoSaveInterval
  ) => {
    let intervalId: NodeJS.Timeout;
    
    const start = () => {
      stop(); // Clear any existing interval
      intervalId = setInterval(saveFunction, interval);
    };
    
    const stop = () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
    
    return { start, stop };
  }
};

/**
 * Performance utilities
 */
export const performanceUtils = {
  /**
   * Throttle function calls
   */
  throttle: <T extends (...args: any[]) => any>(
    func: T,
    delay: number
  ): T => {
    let timeoutId: NodeJS.Timeout | null = null;
    let lastExecTime = 0;
    
    return ((...args: any[]) => {
      const currentTime = Date.now();
      
      if (currentTime - lastExecTime > delay) {
        func(...args);
        lastExecTime = currentTime;
      } else {
        if (timeoutId) clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          func(...args);
          lastExecTime = Date.now();
        }, delay - (currentTime - lastExecTime));
      }
    }) as T;
  },

  /**
   * Measure performance of operations
   */
  measurePerformance: async <T>(
    operation: () => Promise<T> | T,
    label: string
  ): Promise<{ result: T; duration: number }> => {
    const startTime = performance.now();
    const result = await operation();
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    console.log(`⏱️ ${label}: ${duration.toFixed(2)}ms`);
    
    return { result, duration };
  },

  /**
   * Lazy load images
   */
  lazyLoadImage: (src: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  }
};

/**
 * Custom hook for theme builder state management
 */
export const useThemeBuilderState = (initialTab: string = 'presets') => {
  const [state, setState] = useState<ThemeBuilderState>({
    activeTab: initialTab,
    activePreset: null,
    expandedSections: sectionUtils.getDefaultExpandedSections(),
    copiedColor: null,
    isLoading: false,
    isExporting: false,
    lastSaveTime: null,
    validationSummary: null
  });

  const actions: ThemeBuilderActions = {
    setActiveTab: useCallback((tab: string) => {
      setState(prev => ({ ...prev, activeTab: tab }));
    }, []),

    setActivePreset: useCallback((preset: string | null) => {
      setState(prev => ({ ...prev, activePreset: preset }));
    }, []),

    toggleSection: useCallback((section: string) => {
      setState(prev => ({
        ...prev,
        expandedSections: {
          ...prev.expandedSections,
          [section]: !prev.expandedSections[section]
        }
      }));
    }, []),

    setCopiedColor: useCallback((color: string | null) => {
      setState(prev => ({ ...prev, copiedColor: color }));
    }, []),

    setIsLoading: useCallback((loading: boolean) => {
      setState(prev => ({ ...prev, isLoading: loading }));
    }, []),

    setIsExporting: useCallback((exporting: boolean) => {
      setState(prev => ({ ...prev, isExporting: exporting }));
    }, []),

    setLastSaveTime: useCallback((time: string) => {
      setState(prev => ({ ...prev, lastSaveTime: time }));
    }, []),

    setValidationSummary: useCallback((summary: ValidationSummary | null) => {
      setState(prev => ({ ...prev, validationSummary: summary }));
    }, [])
  };

  return { state, actions };
};

/**
 * Custom hook for image upload handling
 */
export const useImageUpload = (
  onImageUpload: (type: MediaUploadType, imageData: string | null) => void
) => {
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [uploadErrors, setUploadErrors] = useState<Record<string, string>>({});

  const handleImageUpload = useCallback(async (
    type: MediaUploadType,
    file: File
  ) => {
    try {
      setUploadProgress(prev => ({ ...prev, [type]: 0 }));
      setUploadErrors(prev => ({ ...prev, [type]: '' }));

      // Validate file
      const validation = imageUtils.validateImageFile(file);
      if (!validation.isValid) {
        setUploadErrors(prev => ({ ...prev, [type]: validation.error || 'Invalid file' }));
        return;
      }

      setUploadProgress(prev => ({ ...prev, [type]: 25 }));

      // Convert to data URL
      const dataURL = await imageUtils.fileToDataURL(file);
      setUploadProgress(prev => ({ ...prev, [type]: 50 }));

      // Resize if needed (for optimization)
      const resized = await imageUtils.resizeImage(dataURL, 1200, 800, 0.8);
      setUploadProgress(prev => ({ ...prev, [type]: 75 }));

      // Upload complete
      onImageUpload(type, resized);
      setUploadProgress(prev => ({ ...prev, [type]: 100 }));

      // Clear progress after delay
      setTimeout(() => {
        setUploadProgress(prev => ({ ...prev, [type]: 0 }));
      }, 2000);

    } catch (error) {
      setUploadErrors(prev => ({ 
        ...prev, 
        [type]: error instanceof Error ? error.message : 'Upload failed' 
      }));
      setUploadProgress(prev => ({ ...prev, [type]: 0 }));
    }
  }, [onImageUpload]);

  const clearImage = useCallback((type: MediaUploadType) => {
    onImageUpload(type, null);
    setUploadProgress(prev => ({ ...prev, [type]: 0 }));
    setUploadErrors(prev => ({ ...prev, [type]: '' }));
  }, [onImageUpload]);

  return {
    uploadProgress,
    uploadErrors,
    handleImageUpload,
    clearImage
  };
};

/**
 * Validation hook
 */
export const useThemeValidation = (settings: ExtendedThemeSettings) => {
  const [validationSummary, setValidationSummary] = useState<ValidationSummary | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  const validateSettings = useCallback(async () => {
    setIsValidating(true);
    try {
      const summary = themeValidator.validateThemeSettings(settings);
      setValidationSummary(summary);
      return summary;
    } finally {
      setIsValidating(false);
    }
  }, [settings]);

  // Auto-validate when settings change (debounced)
  useEffect(() => {
    const timeoutId = setTimeout(validateSettings, 500);
    return () => clearTimeout(timeoutId);
  }, [validateSettings]);

  return {
    validationSummary,
    isValidating,
    validateSettings
  };
};

export default {
  imageUtils,
  colorBuilderUtils,
  sectionUtils,
  themeManagementUtils,
  formUtils,
  performanceUtils,
  useThemeBuilderState,
  useImageUpload,
  useThemeValidation
};
