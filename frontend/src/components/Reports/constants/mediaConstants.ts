/**
 * Media Constants - File Types, Extensions, and Configuration Values
 * Extracted from MediaManagementSystem for better modularity
 * Production-ready constants for media management functionality
 */

import { MediaFile } from '../../../types/reports';

// === MEDIA FILE TYPES ===
export const MEDIA_TYPES = {
  IMAGE: 'image',
  VIDEO: 'video',
  DOCUMENT: 'document',
  AUDIO: 'audio',
  OTHER: 'other',
  ALL: 'all'
} as const;

export type MediaTypeType = typeof MEDIA_TYPES[keyof typeof MEDIA_TYPES];

// === FILE EXTENSIONS MAPPING ===
export const FILE_EXTENSIONS = {
  image: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'ico', 'tiff'],
  video: ['mp4', 'webm', 'ogg', 'mov', 'avi', 'wmv', 'mkv', 'flv', '3gp', 'm4v'],
  document: ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'csv', 'rtf', 'odt'],
  audio: ['mp3', 'wav', 'aac', 'flac', 'm4a', 'ogg', 'wma', 'opus'],
  archive: ['zip', 'rar', '7z', 'tar', 'gz', 'bz2']
} as const;

// === MIME TYPE MAPPINGS ===
export const MIME_TYPE_PREFIXES = {
  image: 'image/',
  video: 'video/',
  audio: 'audio/',
  pdf: 'application/pdf',
  text: 'text/',
  application: 'application/'
} as const;

// === VIEW MODES ===
export const VIEW_MODES = {
  GRID: 'grid',
  LIST: 'list'
} as const;

export type ViewModeType = typeof VIEW_MODES[keyof typeof VIEW_MODES];

// === SORT OPTIONS ===
export const SORT_OPTIONS = {
  DATE: 'date',
  NAME: 'name',
  SIZE: 'size',
  TYPE: 'type'
} as const;

export type SortOptionType = typeof SORT_OPTIONS[keyof typeof SORT_OPTIONS];

// === SORT ORDER ===
export const SORT_ORDER = {
  ASC: 'asc',
  DESC: 'desc'
} as const;

export type SortOrderType = typeof SORT_ORDER[keyof typeof SORT_ORDER];

// === FILTER TYPES ===
export const FILTER_TYPES = {
  ALL: 'all',
  SELECTED: 'selected',
  RECENT: 'recent',
  EXPIRED: 'expired',
  SHARED: 'shared'
} as const;

export type FilterTypeType = typeof FILTER_TYPES[keyof typeof FILTER_TYPES];

// === MODAL TYPES ===
export const MODAL_TYPES = {
  PREVIEW: 'preview',
  UPLOAD: 'upload',
  EDIT: 'edit',
  SHARE: 'share',
  DELETE: 'delete',
  BULK_EDIT: 'bulk_edit'
} as const;

export type ModalTypeType = typeof MODAL_TYPES[keyof typeof MODAL_TYPES];

// === UPLOAD CONFIGURATION ===
export const UPLOAD_CONFIG = {
  maxFileSize: 100 * 1024 * 1024, // 100MB
  maxTotalSize: 500 * 1024 * 1024, // 500MB
  maxFiles: 50,
  chunkSize: 1024 * 1024, // 1MB chunks
  retryAttempts: 3,
  timeoutMs: 30000, // 30 seconds
  allowedTypes: [
    'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
    'video/mp4', 'video/webm', 'video/ogg', 'video/quicktime', 'video/x-msvideo',
    'audio/mp3', 'audio/wav', 'audio/aac', 'audio/flac', 'audio/ogg',
    'application/pdf', 'text/plain', 'text/csv',
    'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
  ]
} as const;

// === FILE SIZE CONSTANTS ===
export const FILE_SIZE = {
  units: ['B', 'KB', 'MB', 'GB', 'TB'],
  base: 1024,
  precision: 2
} as const;

// === TIMING CONSTANTS ===
export const TIMING_CONSTANTS = {
  uploadProgressInterval: 100, // ms
  autoSaveInterval: 5000, // 5 seconds
  copyFeedbackDuration: 2000, // 2 seconds
  searchDebounceDelay: 300, // ms
  previewLoadTimeout: 10000, // 10 seconds
  modalAnimationDuration: 200, // ms
  tooltipDelay: 500 // ms
} as const;

// === GRID CONFIGURATION ===
export const GRID_CONFIG = {
  minCardWidth: 200, // px
  maxCardWidth: 300, // px
  cardAspectRatio: 1.2,
  gap: '1rem',
  columns: {
    mobile: 2,
    tablet: 3,
    desktop: 4,
    wide: 6
  }
} as const;

// === LIST CONFIGURATION ===
export const LIST_CONFIG = {
  rowHeight: 72, // px
  compactRowHeight: 48, // px
  actionButtonSize: 32, // px
  thumbnailSize: 48 // px
} as const;

// === THUMBNAIL CONFIGURATION ===
export const THUMBNAIL_CONFIG = {
  defaultSize: 150, // px
  quality: 0.8,
  format: 'image/jpeg',
  maxDimensions: {
    width: 300,
    height: 300
  },
  placeholderColor: '#374151',
  loadingColor: '#6b7280'
} as const;

// === SHARING CONFIGURATION ===
export const SHARE_CONFIG = {
  defaultExpiryDays: 7,
  maxExpiryDays: 365,
  linkLength: 32,
  publicBaseUrl: 'https://cdn.example.com/shared',
  permissions: {
    VIEW: 'view',
    DOWNLOAD: 'download',
    EDIT: 'edit'
  }
} as const;

// === VALIDATION RULES ===
export const VALIDATION_RULES = {
  fileName: {
    minLength: 1,
    maxLength: 255,
    invalidChars: /[<>:"/\\|?*]/g,
    reservedNames: ['CON', 'PRN', 'AUX', 'NUL', 'COM1', 'COM2', 'COM3', 'COM4', 'COM5', 'COM6', 'COM7', 'COM8', 'COM9', 'LPT1', 'LPT2', 'LPT3', 'LPT4', 'LPT5', 'LPT6', 'LPT7', 'LPT8', 'LPT9']
  },
  description: {
    maxLength: 1000
  },
  tags: {
    maxCount: 10,
    maxTagLength: 50,
    separator: /[,;]/
  },
  search: {
    minLength: 1,
    maxLength: 100
  }
} as const;

// === ERROR MESSAGES ===
export const ERROR_MESSAGES = {
  upload: {
    fileTooLarge: (maxSize: string) => `File size exceeds ${maxSize} limit`,
    invalidType: (allowedTypes: string) => `File type not supported. Allowed: ${allowedTypes}`,
    uploadFailed: 'Upload failed. Please try again.',
    networkError: 'Network error occurred during upload',
    serverError: 'Server error occurred during upload',
    cancelled: 'Upload was cancelled'
  },
  validation: {
    fileNameRequired: 'File name is required',
    fileNameTooLong: `File name must be less than ${VALIDATION_RULES.fileName.maxLength} characters`,
    fileNameInvalid: 'File name contains invalid characters',
    descriptionTooLong: `Description must be less than ${VALIDATION_RULES.description.maxLength} characters`,
    tooManyTags: `Maximum ${VALIDATION_RULES.tags.maxCount} tags allowed`,
    tagTooLong: `Each tag must be less than ${VALIDATION_RULES.tags.maxTagLength} characters`
  },
  general: {
    notFound: 'File not found',
    accessDenied: 'Access denied',
    expired: 'File has expired',
    corruptedFile: 'File appears to be corrupted',
    unsupportedOperation: 'Operation not supported for this file type'
  }
} as const;

// === SUCCESS MESSAGES ===
export const SUCCESS_MESSAGES = {
  upload: {
    single: 'File uploaded successfully',
    multiple: (count: number) => `${count} files uploaded successfully`,
    complete: 'All uploads completed'
  },
  actions: {
    deleted: (count: number) => count === 1 ? 'File deleted' : `${count} files deleted`,
    shared: 'Share link copied to clipboard',
    saved: 'Changes saved successfully',
    copied: 'Copied to clipboard'
  }
} as const;

// === TAB CONFIGURATION ===
export const MEDIA_TABS = [
  {
    id: MEDIA_TYPES.ALL,
    label: 'All Files',
    icon: 'FileText',
    description: 'View all uploaded media files'
  },
  {
    id: MEDIA_TYPES.IMAGE,
    label: 'Images',
    icon: 'Image',
    description: 'Photos, screenshots, and image files'
  },
  {
    id: MEDIA_TYPES.VIDEO,
    label: 'Videos',
    icon: 'Video',
    description: 'Video recordings and clips'
  },
  {
    id: MEDIA_TYPES.DOCUMENT,
    label: 'Documents',
    icon: 'File',
    description: 'PDFs, reports, and text files'
  },
  {
    id: MEDIA_TYPES.AUDIO,
    label: 'Audio',
    icon: 'Volume2',
    description: 'Audio recordings and sound files'
  }
] as const;

// === SORT MENU OPTIONS ===
export const SORT_MENU_OPTIONS = [
  {
    id: 'date_desc',
    label: 'Newest First',
    icon: 'Calendar',
    sortBy: SORT_OPTIONS.DATE,
    sortOrder: SORT_ORDER.DESC
  },
  {
    id: 'date_asc',
    label: 'Oldest First',
    icon: 'Calendar',
    sortBy: SORT_OPTIONS.DATE,
    sortOrder: SORT_ORDER.ASC
  },
  {
    id: 'name_asc',
    label: 'Name (A-Z)',
    icon: 'FileText',
    sortBy: SORT_OPTIONS.NAME,
    sortOrder: SORT_ORDER.ASC
  },
  {
    id: 'name_desc',
    label: 'Name (Z-A)',
    icon: 'FileText',
    sortBy: SORT_OPTIONS.NAME,
    sortOrder: SORT_ORDER.DESC
  },
  {
    id: 'size_desc',
    label: 'Largest First',
    icon: 'FileText',
    sortBy: SORT_OPTIONS.SIZE,
    sortOrder: SORT_ORDER.DESC
  },
  {
    id: 'size_asc',
    label: 'Smallest First',
    icon: 'FileText',
    sortBy: SORT_OPTIONS.SIZE,
    sortOrder: SORT_ORDER.ASC
  },
  {
    id: 'type_asc',
    label: 'Type (A-Z)',
    icon: 'FileText',
    sortBy: SORT_OPTIONS.TYPE,
    sortOrder: SORT_ORDER.ASC
  }
] as const;

// === BULK ACTIONS CONFIGURATION ===
export const BULK_ACTIONS = {
  SHARE: 'share',
  DELETE: 'delete',
  DOWNLOAD: 'download',
  TAG: 'tag',
  MOVE: 'move',
  COPY: 'copy'
} as const;

export type BulkActionType = typeof BULK_ACTIONS[keyof typeof BULK_ACTIONS];

// === RESPONSIVE BREAKPOINTS ===
export const BREAKPOINTS = {
  mobile: '480px',
  tablet: '768px',
  desktop: '1024px',
  wide: '1440px'
} as const;

// === ACCESSIBILITY CONSTANTS ===
export const A11Y_CONFIG = {
  focusOutlineWidth: '2px',
  focusOutlineColor: '#FFD700',
  minimumTouchTarget: 44, // px
  animationReducedMotion: 'reduce',
  highContrastColors: {
    background: '#000000',
    foreground: '#FFFFFF',
    accent: '#FFFF00'
  }
} as const;

// === KEYBOARD SHORTCUTS ===
export const KEYBOARD_SHORTCUTS = {
  UPLOAD: 'KeyU',
  DELETE: 'Delete',
  SELECT_ALL: 'KeyA',
  ESCAPE: 'Escape',
  ENTER: 'Enter',
  SPACE: 'Space',
  ARROW_UP: 'ArrowUp',
  ARROW_DOWN: 'ArrowDown',
  ARROW_LEFT: 'ArrowLeft',
  ARROW_RIGHT: 'ArrowRight'
} as const;

// === ANIMATION CONSTANTS ===
export const ANIMATIONS = {
  duration: {
    fast: 150,
    normal: 300,
    slow: 500
  },
  easing: {
    ease: 'ease',
    easeIn: 'ease-in',
    easeOut: 'ease-out',
    easeInOut: 'ease-in-out',
    linear: 'linear'
  },
  spring: {
    tension: 300,
    friction: 30
  }
} as const;

// === UTILITY FUNCTIONS ===
export const getFileTypeFromExtension = (filename: string): MediaFile['type'] => {
  const extension = filename.split('.').pop()?.toLowerCase();
  if (!extension) return MEDIA_TYPES.OTHER;

  for (const [type, extensions] of Object.entries(FILE_EXTENSIONS)) {
    if (extensions.includes(extension)) {
      return type as MediaFile['type'];
    }
  }
  return MEDIA_TYPES.OTHER;
};

export const getFileTypeFromMimeType = (mimeType: string): MediaFile['type'] => {
  if (mimeType.startsWith(MIME_TYPE_PREFIXES.image)) return MEDIA_TYPES.IMAGE;
  if (mimeType.startsWith(MIME_TYPE_PREFIXES.video)) return MEDIA_TYPES.VIDEO;
  if (mimeType.startsWith(MIME_TYPE_PREFIXES.audio)) return MEDIA_TYPES.AUDIO;
  if (mimeType === MIME_TYPE_PREFIXES.pdf) return MEDIA_TYPES.DOCUMENT;
  if (mimeType.startsWith(MIME_TYPE_PREFIXES.text)) return MEDIA_TYPES.DOCUMENT;
  return MEDIA_TYPES.OTHER;
};

export const isValidFileType = (file: File): boolean => {
  return UPLOAD_CONFIG.allowedTypes.includes(file.type as any);
};

export const getTabByType = (type: MediaFile['type'] | 'all') => {
  return MEDIA_TABS.find(tab => tab.id === type);
};

export const getSortOption = (sortBy: SortOptionType, sortOrder: SortOrderType) => {
  return SORT_MENU_OPTIONS.find(option => 
    option.sortBy === sortBy && option.sortOrder === sortOrder
  );
};

/**
 * MEDIA CONSTANTS COMPLETION SUMMARY:
 * ✅ File type constants and mappings
 * ✅ MIME type configurations  
 * ✅ View mode and sort options
 * ✅ Upload configuration and limits
 * ✅ Validation rules and error messages
 * ✅ UI configuration (grid, list, thumbnails)
 * ✅ Timing and animation constants
 * ✅ Accessibility configuration
 * ✅ Keyboard shortcuts
 * ✅ Utility functions for type detection
 * 
 * This constants file provides a solid foundation for the MediaManagementSystem
 * decomposition, ensuring all hardcoded values are centralized and configurable.
 */
