/**
 * Media Utilities - File Processing, Validation, and Helper Functions
 * Extracted from MediaManagementSystem for better modularity
 * Production-ready utilities with comprehensive error handling
 */

import { format } from 'date-fns';
import { MediaFile } from '../../../types/reports';
import { 
  MEDIA_TYPES,
  FILE_EXTENSIONS,
  MIME_TYPE_PREFIXES,
  UPLOAD_CONFIG,
  FILE_SIZE,
  VALIDATION_RULES,
  ERROR_MESSAGES,
  getFileTypeFromExtension,
  getFileTypeFromMimeType,
  isValidFileType
} from '../constants/mediaConstants';

/**
 * Extended MediaFile interface for internal processing
 */
export interface ExtendedMediaFile extends MediaFile {
  file?: File;
  uploadProgress?: number;
  uploadStatus?: 'pending' | 'uploading' | 'completed' | 'failed';
  error?: string;
}

/**
 * File validation result interface
 */
export interface FileValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  fileType: MediaFile['type'];
  suggestedName?: string;
}

/**
 * Upload result interface
 */
export interface UploadResult {
  success: boolean;
  file?: ExtendedMediaFile;
  error?: string;
  progress?: number;
}

/**
 * Search and filter result interface
 */
export interface FilterResult {
  files: MediaFile[];
  totalCount: number;
  filteredCount: number;
  hasMore: boolean;
}

/**
 * ID Generation Utilities
 */
export const idUtils = {
  /**
   * Generate unique ID for media files
   */
  generateId: (): string => {
    return `media_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  },

  /**
   * Generate short ID for sharing
   */
  generateShortId: (length: number = 8): string => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  },

  /**
   * Validate ID format
   */
  isValidId: (id: string): boolean => {
    return /^media_\\d+_[a-z0-9]+$/.test(id);
  }
};

/**
 * File Type Detection Utilities
 */
export const fileTypeUtils = {
  /**
   * Comprehensive file type detection
   */
  getFileType: (file: File | { name?: string; type?: string }): MediaFile['type'] => {
    const fileName = file.name || '';
    const fileType = (file as File).type || '';

    // First try MIME type detection
    if (fileType) {
      const typeFromMime = getFileTypeFromMimeType(fileType);
      if (typeFromMime !== MEDIA_TYPES.OTHER) {
        return typeFromMime;
      }
    }

    // Fallback to extension-based detection
    if (fileName) {
      return getFileTypeFromExtension(fileName);
    }

    return MEDIA_TYPES.OTHER;
  },

  /**
   * Check if file type is supported
   */
  isSupportedType: (file: File): boolean => {
    return isValidFileType(file);
  },

  /**
   * Get file type icon name
   */
  getFileTypeIcon: (type: MediaFile['type']): string => {
    switch (type) {
      case MEDIA_TYPES.IMAGE: return 'Image';
      case MEDIA_TYPES.VIDEO: return 'Video';
      case MEDIA_TYPES.AUDIO: return 'Volume2';
      case MEDIA_TYPES.DOCUMENT: return 'FileText';
      default: return 'File';
    }
  },

  /**
   * Get supported extensions for a type
   */
  getSupportedExtensions: (type: MediaFile['type']): string[] => {
    return FILE_EXTENSIONS[type as keyof typeof FILE_EXTENSIONS] || [];
  },

  /**
   * Check if file has thumbnail support
   */
  supportsThumbnail: (type: MediaFile['type']): boolean => {
    return type === MEDIA_TYPES.IMAGE || type === MEDIA_TYPES.VIDEO;
  }
};

/**
 * File Size Utilities
 */
export const fileSizeUtils = {
  /**
   * Format file size to human readable string
   */
  formatFileSize: (bytes?: number): string => {
    if (bytes === undefined || bytes === null || bytes === 0) return '0 B';
    
    const k = FILE_SIZE.base;
    const sizes = FILE_SIZE.units;
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(FILE_SIZE.precision)) + ' ' + sizes[i];
  },

  /**
   * Parse file size string to bytes
   */
  parseFileSize: (sizeString: string): number => {
    const units = FILE_SIZE.units;
    const regex = /^([0-9.]+)\\s*([A-Z]*B?)$/i;
    const match = sizeString.trim().match(regex);
    
    if (!match) return 0;
    
    const value = parseFloat(match[1]);
    const unit = match[2].toUpperCase();
    const unitIndex = units.findIndex(u => u === unit);
    
    if (unitIndex === -1) return value;
    
    return value * Math.pow(FILE_SIZE.base, unitIndex);
  },

  /**
   * Check if file size is within limits
   */
  isWithinSizeLimit: (size: number): boolean => {
    return size <= UPLOAD_CONFIG.maxFileSize;
  },

  /**
   * Get file size category
   */
  getSizeCategory: (bytes: number): 'small' | 'medium' | 'large' | 'very-large' => {
    const mb = bytes / (1024 * 1024);
    if (mb < 1) return 'small';
    if (mb < 10) return 'medium';
    if (mb < 50) return 'large';
    return 'very-large';
  }
};

/**
 * Date Formatting Utilities
 */
export const dateUtils = {
  /**
   * Safely format date with fallback
   */
  formatDateSafe: (dateInput?: Date | string): string => {
    if (!dateInput) return 'N/A';
    
    try {
      const dateObj = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
      if (isNaN(dateObj.getTime())) return 'Invalid Date';
      return format(dateObj, 'MMM d, yyyy');
    } catch (e) {
      return 'Invalid Date';
    }
  },

  /**
   * Format date with time
   */
  formatDateTime: (dateInput?: Date | string): string => {
    if (!dateInput) return 'N/A';
    
    try {
      const dateObj = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
      if (isNaN(dateObj.getTime())) return 'Invalid Date';
      return format(dateObj, 'MMM d, yyyy HH:mm');
    } catch (e) {
      return 'Invalid Date';
    }
  },

  /**
   * Get relative time string
   */
  getRelativeTime: (date: Date | string): string => {
    const now = new Date();
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const diffMs = now.getTime() - dateObj.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return dateUtils.formatDateSafe(dateObj);
  },

  /**
   * Check if date is expired
   */
  isExpired: (expiryDate?: Date | string): boolean => {
    if (!expiryDate) return false;
    const dateObj = typeof expiryDate === 'string' ? new Date(expiryDate) : expiryDate;
    return dateObj < new Date();
  },

  /**
   * Ensure date object
   */
  ensureDateObject: (dateInput: any): Date | undefined => {
    if (dateInput instanceof Date && !isNaN(dateInput.getTime())) return dateInput;
    if (typeof dateInput === 'string') {
      try {
        const parsed = new Date(dateInput);
        if (!isNaN(parsed.getTime())) return parsed;
      } catch {
        // ignore
      }
    }
    return undefined;
  },

  /**
   * Get ISO string safely
   */
  getISOString: (dateInput: any): string => {
    const dateObj = dateUtils.ensureDateObject(dateInput);
    return dateObj ? dateObj.toISOString() : new Date().toISOString();
  }
};

/**
 * File Validation Utilities
 */
export const validationUtils = {
  /**
   * Comprehensive file validation
   */
  validateFile: (file: File): FileValidationResult => {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    // Check file size
    if (!fileSizeUtils.isWithinSizeLimit(file.size)) {
      errors.push(ERROR_MESSAGES.upload.fileTooLarge(fileSizeUtils.formatFileSize(UPLOAD_CONFIG.maxFileSize)));
    }
    
    // Check file type
    const fileType = fileTypeUtils.getFileType(file);
    if (!fileTypeUtils.isSupportedType(file)) {
      const supportedTypes = Object.values(FILE_EXTENSIONS).flat().join(', ');
      errors.push(ERROR_MESSAGES.upload.invalidType(supportedTypes));
    }
    
    // Check file name
    const nameValidation = validationUtils.validateFileName(file.name);
    if (!nameValidation.isValid) {
      errors.push(...nameValidation.errors);
    }
    
    // Size-based warnings
    const sizeCategory = fileSizeUtils.getSizeCategory(file.size);
    if (sizeCategory === 'very-large') {
      warnings.push('Large file may take longer to upload and process');
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      fileType,
      suggestedName: nameValidation.suggestedName
    };
  },

  /**
   * Validate file name
   */
  validateFileName: (fileName: string): { isValid: boolean; errors: string[]; suggestedName?: string } => {
    const errors: string[] = [];
    
    if (!fileName || fileName.trim().length === 0) {
      errors.push(ERROR_MESSAGES.validation.fileNameRequired);
    }
    
    if (fileName.length > VALIDATION_RULES.fileName.maxLength) {
      errors.push(ERROR_MESSAGES.validation.fileNameTooLong);
    }
    
    if (VALIDATION_RULES.fileName.invalidChars.test(fileName)) {
      errors.push(ERROR_MESSAGES.validation.fileNameInvalid);
    }
    
    const nameWithoutExt = fileName.substring(0, fileName.lastIndexOf('.')) || fileName;
    if (VALIDATION_RULES.fileName.reservedNames.includes(nameWithoutExt.toUpperCase())) {
      errors.push('File name is reserved by the system');
    }
    
    // Generate suggested name if invalid
    let suggestedName: string | undefined;
    if (errors.length > 0) {
      suggestedName = fileName
        .replace(VALIDATION_RULES.fileName.invalidChars, '_')
        .substring(0, VALIDATION_RULES.fileName.maxLength);
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      suggestedName
    };
  },

  /**
   * Validate description
   */
  validateDescription: (description: string): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];
    
    if (description.length > VALIDATION_RULES.description.maxLength) {
      errors.push(ERROR_MESSAGES.validation.descriptionTooLong);
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  },

  /**
   * Validate tags
   */
  validateTags: (tags: string[]): { isValid: boolean; errors: string[]; validTags: string[] } => {
    const errors: string[] = [];
    const validTags: string[] = [];
    
    if (tags.length > VALIDATION_RULES.tags.maxCount) {
      errors.push(ERROR_MESSAGES.validation.tooManyTags);
    }
    
    for (const tag of tags) {
      const trimmed = tag.trim();
      if (trimmed.length === 0) continue;
      
      if (trimmed.length > VALIDATION_RULES.tags.maxTagLength) {
        errors.push(ERROR_MESSAGES.validation.tagTooLong);
      } else {
        validTags.push(trimmed);
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      validTags
    };
  },

  /**
   * Parse tags from string
   */
  parseTags: (tagString: string): string[] => {
    return tagString
      .split(VALIDATION_RULES.tags.separator)
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0);
  }
};

/**
 * Media File Processing Utilities
 */
export const mediaFileUtils = {
  /**
   * Map initial media data to MediaFile format
   */
  mapInitialMedia: (media: Partial<MediaFile>[]): MediaFile[] => {
    return media.map((item): MediaFile => {
      const fileType = item.type || fileTypeUtils.getFileType({ name: item.name, type: undefined }) || MEDIA_TYPES.OTHER;
      
      return {
        id: item.id || idUtils.generateId(),
        url: item.url || '#',
        name: item.name || 'Unnamed file',
        type: fileType,
        size: typeof item.size === 'number' ? item.size : 0,
        thumbnail: item.thumbnail || (fileType === MEDIA_TYPES.IMAGE ? item.url : undefined),
        dateCreated: dateUtils.ensureDateObject(item.dateCreated) ?? new Date(),
        description: item.description || '',
        tags: Array.isArray(item.tags) ? item.tags : [],
        expiryDate: dateUtils.ensureDateObject(item.expiryDate),
        shareLink: item.shareLink,
        uploadedAt: dateUtils.getISOString(item.uploadedAt)
      };
    });
  },

  /**
   * Create MediaFile from File object
   */
  createFromFile: (file: File): ExtendedMediaFile => {
    const fileType = fileTypeUtils.getFileType(file);
    
    return {
      id: idUtils.generateId(),
      url: URL.createObjectURL(file),
      name: file.name,
      type: fileType,
      size: file.size,
      thumbnail: fileType === MEDIA_TYPES.IMAGE ? URL.createObjectURL(file) : undefined,
      dateCreated: new Date(),
      description: '',
      tags: [],
      uploadedAt: new Date().toISOString(),
      file,
      uploadProgress: 0,
      uploadStatus: 'pending'
    };
  },

  /**
   * Generate thumbnail for media file
   */
  generateThumbnail: async (file: File): Promise<string | undefined> => {
    if (!fileTypeUtils.supportsThumbnail(fileTypeUtils.getFileType(file))) {
      return undefined;
    }

    return new Promise((resolve) => {
      if (file.type.startsWith('image/')) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();
        
        img.onload = () => {
          const maxSize = 150;
          const ratio = Math.min(maxSize / img.width, maxSize / img.height);
          canvas.width = img.width * ratio;
          canvas.height = img.height * ratio;
          
          ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL('image/jpeg', 0.8));
        };
        
        img.onerror = () => resolve(undefined);
        img.src = URL.createObjectURL(file);
      } else {
        resolve(undefined);
      }
    });
  },

  /**
   * Clean up object URLs
   */
  cleanupObjectURL: (url: string): void => {
    if (url.startsWith('blob:')) {
      URL.revokeObjectURL(url);
    }
  },

  /**
   * Check if file needs processing
   */
  needsProcessing: (file: MediaFile): boolean => {
    return !file.thumbnail && fileTypeUtils.supportsThumbnail(file.type);
  }
};

/**
 * Search and Filter Utilities
 */
export const searchUtils = {
  /**
   * Filter files by search term
   */
  filterBySearch: (files: MediaFile[], searchTerm: string): MediaFile[] => {
    if (!searchTerm || searchTerm.trim().length === 0) return files;
    
    const term = searchTerm.toLowerCase().trim();
    
    return files.filter(file => 
      file.name.toLowerCase().includes(term) ||
      (file.description && file.description.toLowerCase().includes(term)) ||
      (file.tags && file.tags.some(tag => tag.toLowerCase().includes(term)))
    );
  },

  /**
   * Filter files by type
   */
  filterByType: (files: MediaFile[], type: MediaFile['type'] | 'all'): MediaFile[] => {
    if (type === 'all') return files;
    return files.filter(file => file.type === type);
  },

  /**
   * Filter files by date range
   */
  filterByDateRange: (files: MediaFile[], startDate?: Date, endDate?: Date): MediaFile[] => {
    if (!startDate && !endDate) return files;
    
    return files.filter(file => {
      const fileDate = file.dateCreated;
      if (!fileDate) return false;
      
      if (startDate && fileDate < startDate) return false;
      if (endDate && fileDate > endDate) return false;
      
      return true;
    });
  },

  /**
   * Sort files
   */
  sortFiles: (files: MediaFile[], sortBy: string, sortOrder: 'asc' | 'desc'): MediaFile[] => {
    const sorted = [...files].sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'date':
          const dateA = a.dateCreated?.getTime() || 0;
          const dateB = b.dateCreated?.getTime() || 0;
          comparison = dateB - dateA; // Default newest first
          break;
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'size':
          comparison = (a.size || 0) - (b.size || 0);
          break;
        case 'type':
          comparison = a.type.localeCompare(b.type);
          break;
        default:
          return 0;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });
    
    return sorted;
  },

  /**
   * Get files with pagination
   */
  paginateFiles: (files: MediaFile[], page: number, pageSize: number): FilterResult => {
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedFiles = files.slice(startIndex, endIndex);
    
    return {
      files: paginatedFiles,
      totalCount: files.length,
      filteredCount: paginatedFiles.length,
      hasMore: endIndex < files.length
    };
  }
};

/**
 * Upload Progress Utilities
 */
export const uploadUtils = {
  /**
   * Simulate upload progress
   */
  simulateUpload: async (
    file: File,
    onProgress: (progress: number) => void
  ): Promise<UploadResult> => {
    return new Promise((resolve) => {
      let progress = 0;
      const increment = Math.random() * 10 + 5; // 5-15% increments
      
      const interval = setInterval(() => {
        progress += increment;
        
        if (progress >= 100) {
          progress = 100;
          clearInterval(interval);
          
          const mediaFile = mediaFileUtils.createFromFile(file);
          mediaFile.uploadStatus = 'completed';
          mediaFile.uploadProgress = 100;
          
          resolve({
            success: true,
            file: mediaFile,
            progress: 100
          });
        } else {
          onProgress(progress);
        }
      }, 100);
    });
  },

  /**
   * Batch upload files
   */
  batchUpload: async (
    files: File[],
    onProgress: (fileIndex: number, progress: number) => void,
    onComplete: (fileIndex: number, result: UploadResult) => void
  ): Promise<UploadResult[]> => {
    const results: UploadResult[] = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const result = await uploadUtils.simulateUpload(file, (progress) => {
        onProgress(i, progress);
      });
      
      results.push(result);
      onComplete(i, result);
    }
    
    return results;
  }
};

/**
 * Clipboard Utilities
 */
export const clipboardUtils = {
  /**
   * Copy text to clipboard
   */
  copyToClipboard: async (text: string): Promise<boolean> => {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      return false;
    }
  },

  /**
   * Copy file URL to clipboard
   */
  copyFileUrl: async (file: MediaFile): Promise<boolean> => {
    return clipboardUtils.copyToClipboard(file.url);
  },

  /**
   * Copy share link to clipboard
   */
  copyShareLink: async (file: MediaFile): Promise<boolean> => {
    if (!file.shareLink) return false;
    return clipboardUtils.copyToClipboard(file.shareLink);
  }
};

/**
 * Error Handling Utilities
 */
export const errorUtils = {
  /**
   * Get user-friendly error message
   */
  getErrorMessage: (error: unknown): string => {
    if (typeof error === 'string') return error;
    if (error instanceof Error) return error.message;
    return 'An unexpected error occurred';
  },

  /**
   * Check if error is network related
   */
  isNetworkError: (error: unknown): boolean => {
    const message = errorUtils.getErrorMessage(error).toLowerCase();
    return message.includes('network') || message.includes('fetch') || message.includes('connection');
  },

  /**
   * Retry operation with exponential backoff
   */
  retryOperation: async <T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 1000
  ): Promise<T> => {
    let lastError: unknown;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        
        if (attempt === maxRetries) break;
        
        const delay = baseDelay * Math.pow(2, attempt);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw lastError;
  }
};

/**
 * MEDIA UTILITIES COMPLETION SUMMARY:
 * ✅ ID generation and validation utilities
 * ✅ File type detection and classification
 * ✅ File size formatting and validation
 * ✅ Date formatting and manipulation
 * ✅ Comprehensive file validation
 * ✅ Media file processing and mapping
 * ✅ Search, filter, and sort utilities
 * ✅ Upload simulation and progress tracking
 * ✅ Clipboard operations
 * ✅ Error handling with retry logic
 * 
 * This utilities file provides all the core functionality needed for the
 * MediaManagementSystem, with proper error handling and TypeScript support.
 */

export default {
  idUtils,
  fileTypeUtils,
  fileSizeUtils,
  dateUtils,
  validationUtils,
  mediaFileUtils,
  searchUtils,
  uploadUtils,
  clipboardUtils,
  errorUtils
};
