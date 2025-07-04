/**
 * Media File Hooks - Custom React Hooks for Media Management
 * Extracted from MediaManagementSystem for better modularity
 * Production-ready hooks with comprehensive state management
 */

import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { MediaFile } from '../../../types/reports';
import { 
  MEDIA_TYPES,
  SORT_OPTIONS,
  SORT_ORDER,
  VIEW_MODES,
  TIMING_CONSTANTS,
  MediaTypeType,
  SortOptionType,
  SortOrderType,
  ViewModeType
} from '../constants/mediaConstants';
import {
  ExtendedMediaFile,
  FileValidationResult,
  UploadResult,
  FilterResult,
  mediaFileUtils,
  searchUtils,
  uploadUtils,
  validationUtils,
  clipboardUtils,
  errorUtils,
  idUtils
} from '../utils/mediaUtils';

/**
 * Media files state management hook
 */
export interface UseMediaFilesResult {
  files: MediaFile[];
  setFiles: React.Dispatch<React.SetStateAction<MediaFile[]>>;
  addFiles: (newFiles: MediaFile[]) => void;
  updateFile: (id: string, updates: Partial<MediaFile>) => void;
  deleteFiles: (ids: string[]) => void;
  clearFiles: () => void;
  totalCount: number;
  getFileById: (id: string) => MediaFile | undefined;
}

export const useMediaFiles = (initialFiles: Partial<MediaFile>[] = []): UseMediaFilesResult => {
  const [files, setFiles] = useState<MediaFile[]>(() => {
    return initialFiles.length > 0 ? mediaFileUtils.mapInitialMedia(initialFiles) : [];
  });

  const addFiles = useCallback((newFiles: MediaFile[]) => {
    setFiles(prev => [...newFiles, ...prev]);
  }, []);

  const updateFile = useCallback((id: string, updates: Partial<MediaFile>) => {
    setFiles(prev => prev.map(file => 
      file.id === id ? { ...file, ...updates } : file
    ));
  }, []);

  const deleteFiles = useCallback((ids: string[]) => {
    setFiles(prev => prev.filter(file => !ids.includes(file.id)));
  }, []);

  const clearFiles = useCallback(() => {
    setFiles([]);
  }, []);

  const getFileById = useCallback((id: string) => {
    return files.find(file => file.id === id);
  }, [files]);

  return {
    files,
    setFiles,
    addFiles,
    updateFile,
    deleteFiles,
    clearFiles,
    totalCount: files.length,
    getFileById
  };
};

/**
 * File upload management hook
 */
export interface UseFileUploadResult {
  uploadedFiles: File[];
  setUploadedFiles: React.Dispatch<React.SetStateAction<File[]>>;
  isUploading: boolean;
  uploadProgress: Record<string, number>;
  uploadErrors: Record<string, string>;
  handleFileSelect: (files: File[]) => void;
  handleUpload: (onComplete?: (results: UploadResult[]) => void) => Promise<void>;
  removeUploadedFile: (index: number) => void;
  clearUploadQueue: () => void;
  canUpload: boolean;
}

export const useFileUpload = (): UseFileUploadResult => {
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [uploadErrors, setUploadErrors] = useState<Record<string, string>>({});

  const handleFileSelect = useCallback((files: File[]) => {
    const validFiles = files.filter(file => {
      const validation = validationUtils.validateFile(file);
      if (!validation.isValid) {
        setUploadErrors(prev => ({
          ...prev,
          [file.name]: validation.errors.join(', ')
        }));
        return false;
      }
      return true;
    });

    setUploadedFiles(prev => [...prev, ...validFiles]);
    
    // Clear any previous errors for valid files
    validFiles.forEach(file => {
      setUploadErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[file.name];
        return newErrors;
      });
    });
  }, []);

  const handleUpload = useCallback(async (onComplete?: (results: UploadResult[]) => void) => {
    if (uploadedFiles.length === 0) return;

    setIsUploading(true);
    setUploadProgress({});
    setUploadErrors({});

    try {
      const results = await uploadUtils.batchUpload(
        uploadedFiles,
        (fileIndex, progress) => {
          const fileName = uploadedFiles[fileIndex]?.name;
          if (fileName) {
            setUploadProgress(prev => ({
              ...prev,
              [fileName]: progress
            }));
          }
        },
        (fileIndex, result) => {
          const fileName = uploadedFiles[fileIndex]?.name;
          if (fileName && !result.success) {
            setUploadErrors(prev => ({
              ...prev,
              [fileName]: result.error || 'Upload failed'
            }));
          }
        }
      );

      onComplete?.(results);
    } catch (error) {
      console.error('Batch upload failed:', error);
    } finally {
      setIsUploading(false);
    }
  }, [uploadedFiles]);

  const removeUploadedFile = useCallback((index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  }, []);

  const clearUploadQueue = useCallback(() => {
    setUploadedFiles([]);
    setUploadProgress({});
    setUploadErrors({});
  }, []);

  const canUpload = useMemo(() => {
    return uploadedFiles.length > 0 && !isUploading;
  }, [uploadedFiles.length, isUploading]);

  return {
    uploadedFiles,
    setUploadedFiles,
    isUploading,
    uploadProgress,
    uploadErrors,
    handleFileSelect,
    handleUpload,
    removeUploadedFile,
    clearUploadQueue,
    canUpload
  };
};

/**
 * File selection management hook
 */
export interface UseFileSelectionResult {
  selectedFiles: string[];
  setSelectedFiles: React.Dispatch<React.SetStateAction<string[]>>;
  toggleFileSelection: (fileId: string) => void;
  selectAll: (fileIds: string[]) => void;
  clearSelection: () => void;
  isSelected: (fileId: string) => boolean;
  selectedCount: number;
  hasSelection: boolean;
}

export const useFileSelection = (initialSelection: string[] = []): UseFileSelectionResult => {
  const [selectedFiles, setSelectedFiles] = useState<string[]>(initialSelection);

  const toggleFileSelection = useCallback((fileId: string) => {
    setSelectedFiles(prev => 
      prev.includes(fileId) 
        ? prev.filter(id => id !== fileId)
        : [...prev, fileId]
    );
  }, []);

  const selectAll = useCallback((fileIds: string[]) => {
    setSelectedFiles(fileIds);
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedFiles([]);
  }, []);

  const isSelected = useCallback((fileId: string) => {
    return selectedFiles.includes(fileId);
  }, [selectedFiles]);

  const selectedCount = selectedFiles.length;
  const hasSelection = selectedCount > 0;

  return {
    selectedFiles,
    setSelectedFiles,
    toggleFileSelection,
    selectAll,
    clearSelection,
    isSelected,
    selectedCount,
    hasSelection
  };
};

/**
 * File filtering and search hook
 */
export interface UseFileFiltersResult {
  activeTab: MediaTypeType | 'all';
  setActiveTab: (tab: MediaTypeType | 'all') => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  sortBy: SortOptionType;
  setSortBy: (sort: SortOptionType) => void;
  sortOrder: SortOrderType;
  setSortOrder: (order: SortOrderType) => void;
  viewMode: ViewModeType;
  setViewMode: (mode: ViewModeType) => void;
  filteredFiles: MediaFile[];
  filterFiles: (files: MediaFile[]) => MediaFile[];
  resetFilters: () => void;
}

export const useFileFilters = (files: MediaFile[]): UseFileFiltersResult => {
  const [activeTab, setActiveTab] = useState<MediaTypeType | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<SortOptionType>(SORT_OPTIONS.DATE);
  const [sortOrder, setSortOrder] = useState<SortOrderType>(SORT_ORDER.DESC);
  const [viewMode, setViewMode] = useState<ViewModeType>(VIEW_MODES.GRID);

  // Debounce search term
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(searchTerm);
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, TIMING_CONSTANTS.searchDebounceDelay);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const filterFiles = useCallback((filesToFilter: MediaFile[]) => {
    let filtered = [...filesToFilter];

    // Filter by type
    filtered = searchUtils.filterByType(filtered, activeTab);

    // Filter by search term
    filtered = searchUtils.filterBySearch(filtered, debouncedSearchTerm);

    // Sort files
    filtered = searchUtils.sortFiles(filtered, sortBy, sortOrder);

    return filtered;
  }, [activeTab, debouncedSearchTerm, sortBy, sortOrder]);

  const filteredFiles = useMemo(() => {
    return filterFiles(files);
  }, [files, filterFiles]);

  const resetFilters = useCallback(() => {
    setActiveTab('all');
    setSearchTerm('');
    setSortBy(SORT_OPTIONS.DATE);
    setSortOrder(SORT_ORDER.DESC);
  }, []);

  return {
    activeTab,
    setActiveTab,
    searchTerm,
    setSearchTerm,
    sortBy,
    setSortBy,
    sortOrder,
    setSortOrder,
    viewMode,
    setViewMode,
    filteredFiles,
    filterFiles,
    resetFilters
  };
};

/**
 * File validation hook
 */
export interface UseFileValidationResult {
  validateFiles: (files: File[]) => FileValidationResult[];
  isValidFile: (file: File) => boolean;
  getValidationErrors: (file: File) => string[];
  validateFileName: (name: string) => boolean;
  validateDescription: (description: string) => boolean;
  validateTags: (tags: string[]) => boolean;
}

export const useFileValidation = (): UseFileValidationResult => {
  const validateFiles = useCallback((files: File[]): FileValidationResult[] => {
    return files.map(file => validationUtils.validateFile(file));
  }, []);

  const isValidFile = useCallback((file: File): boolean => {
    const result = validationUtils.validateFile(file);
    return result.isValid;
  }, []);

  const getValidationErrors = useCallback((file: File): string[] => {
    const result = validationUtils.validateFile(file);
    return result.errors;
  }, []);

  const validateFileName = useCallback((name: string): boolean => {
    const result = validationUtils.validateFileName(name);
    return result.isValid;
  }, []);

  const validateDescription = useCallback((description: string): boolean => {
    const result = validationUtils.validateDescription(description);
    return result.isValid;
  }, []);

  const validateTags = useCallback((tags: string[]): boolean => {
    const result = validationUtils.validateTags(tags);
    return result.isValid;
  }, []);

  return {
    validateFiles,
    isValidFile,
    getValidationErrors,
    validateFileName,
    validateDescription,
    validateTags
  };
};

/**
 * Modal management hook
 */
export interface UseFileModalsResult {
  showPreviewModal: boolean;
  showUploadModal: boolean;
  showEditModal: boolean;
  showShareModal: boolean;
  showDeleteModal: boolean;
  currentFile: MediaFile | null;
  openPreview: (file: MediaFile) => void;
  openUpload: () => void;
  openEdit: (file: MediaFile) => void;
  openShare: (file: MediaFile) => void;
  openDelete: (file?: MediaFile) => void;
  closeAllModals: () => void;
  closeModal: (modalType: string) => void;
}

export const useFileModals = (): UseFileModalsResult => {
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [currentFile, setCurrentFile] = useState<MediaFile | null>(null);

  const openPreview = useCallback((file: MediaFile) => {
    setCurrentFile(file);
    setShowPreviewModal(true);
  }, []);

  const openUpload = useCallback(() => {
    setShowUploadModal(true);
  }, []);

  const openEdit = useCallback((file: MediaFile) => {
    setCurrentFile(file);
    setShowEditModal(true);
  }, []);

  const openShare = useCallback((file: MediaFile) => {
    setCurrentFile(file);
    setShowShareModal(true);
  }, []);

  const openDelete = useCallback((file?: MediaFile) => {
    if (file) {
      setCurrentFile(file);
    }
    setShowDeleteModal(true);
  }, []);

  const closeAllModals = useCallback(() => {
    setShowPreviewModal(false);
    setShowUploadModal(false);
    setShowEditModal(false);
    setShowShareModal(false);
    setShowDeleteModal(false);
    setCurrentFile(null);
  }, []);

  const closeModal = useCallback((modalType: string) => {
    switch (modalType) {
      case 'preview':
        setShowPreviewModal(false);
        break;
      case 'upload':
        setShowUploadModal(false);
        break;
      case 'edit':
        setShowEditModal(false);
        break;
      case 'share':
        setShowShareModal(false);
        break;
      case 'delete':
        setShowDeleteModal(false);
        break;
    }
    
    // Clear current file when closing edit/preview/share/delete modals
    if (['preview', 'edit', 'share', 'delete'].includes(modalType)) {
      setCurrentFile(null);
    }
  }, []);

  return {
    showPreviewModal,
    showUploadModal,
    showEditModal,
    showShareModal,
    showDeleteModal,
    currentFile,
    openPreview,
    openUpload,
    openEdit,
    openShare,
    openDelete,
    closeAllModals,
    closeModal
  };
};

/**
 * Clipboard operations hook
 */
export interface UseClipboardResult {
  copyToClipboard: (text: string) => Promise<boolean>;
  copyFileUrl: (file: MediaFile) => Promise<boolean>;
  copyShareLink: (file: MediaFile) => Promise<boolean>;
  copiedText: string | null;
  isCopying: boolean;
  copySuccess: boolean;
}

export const useClipboard = (): UseClipboardResult => {
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [isCopying, setIsCopying] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  const copyToClipboard = useCallback(async (text: string): Promise<boolean> => {
    setIsCopying(true);
    
    try {
      const success = await clipboardUtils.copyToClipboard(text);
      
      if (success) {
        setCopiedText(text);
        setCopySuccess(true);
        
        // Clear success state after delay
        setTimeout(() => {
          setCopySuccess(false);
          setCopiedText(null);
        }, TIMING_CONSTANTS.copyFeedbackDuration);
      }
      
      return success;
    } catch (error) {
      console.error('Copy failed:', error);
      return false;
    } finally {
      setIsCopying(false);
    }
  }, []);

  const copyFileUrl = useCallback(async (file: MediaFile): Promise<boolean> => {
    return copyToClipboard(file.url);
  }, [copyToClipboard]);

  const copyShareLink = useCallback(async (file: MediaFile): Promise<boolean> => {
    if (!file.shareLink) return false;
    return copyToClipboard(file.shareLink);
  }, [copyToClipboard]);

  return {
    copyToClipboard,
    copyFileUrl,
    copyShareLink,
    copiedText,
    isCopying,
    copySuccess
  };
};

/**
 * File actions hook (CRUD operations)
 */
export interface UseFileActionsResult {
  createFile: (file: File) => Promise<MediaFile>;
  updateFile: (id: string, updates: Partial<MediaFile>) => void;
  deleteFile: (id: string) => void;
  deleteMultiple: (ids: string[]) => void;
  duplicateFile: (id: string) => MediaFile | null;
  shareFile: (id: string) => string | null;
  downloadFile: (id: string) => void;
  previewFile: (id: string) => MediaFile | null;
}

export const useFileActions = (
  files: MediaFile[],
  setFiles: React.Dispatch<React.SetStateAction<MediaFile[]>>
): UseFileActionsResult => {
  
  const createFile = useCallback(async (file: File): Promise<MediaFile> => {
    const mediaFile = mediaFileUtils.createFromFile(file);
    
    // Generate thumbnail if supported
    const thumbnail = await mediaFileUtils.generateThumbnail(file);
    if (thumbnail) {
      mediaFile.thumbnail = thumbnail;
    }
    
    setFiles(prev => [mediaFile, ...prev]);
    return mediaFile;
  }, [setFiles]);

  const updateFile = useCallback((id: string, updates: Partial<MediaFile>) => {
    setFiles(prev => prev.map(file => 
      file.id === id ? { ...file, ...updates } : file
    ));
  }, [setFiles]);

  const deleteFile = useCallback((id: string) => {
    setFiles(prev => {
      const file = prev.find(f => f.id === id);
      if (file) {
        // Clean up object URL if it exists
        mediaFileUtils.cleanupObjectURL(file.url);
        if (file.thumbnail) {
          mediaFileUtils.cleanupObjectURL(file.thumbnail);
        }
      }
      return prev.filter(file => file.id !== id);
    });
  }, [setFiles]);

  const deleteMultiple = useCallback((ids: string[]) => {
    setFiles(prev => {
      // Clean up object URLs
      prev.forEach(file => {
        if (ids.includes(file.id)) {
          mediaFileUtils.cleanupObjectURL(file.url);
          if (file.thumbnail) {
            mediaFileUtils.cleanupObjectURL(file.thumbnail);
          }
        }
      });
      
      return prev.filter(file => !ids.includes(file.id));
    });
  }, [setFiles]);

  const duplicateFile = useCallback((id: string): MediaFile | null => {
    const file = files.find(f => f.id === id);
    if (!file) return null;

    const duplicated: MediaFile = {
      ...file,
      id: idUtils.generateId(),
      name: `${file.name} (copy)`,
      dateCreated: new Date(),
      uploadedAt: new Date().toISOString()
    };

    setFiles(prev => [duplicated, ...prev]);
    return duplicated;
  }, [files, setFiles]);

  const shareFile = useCallback((id: string): string | null => {
    const file = files.find(f => f.id === id);
    if (!file) return null;

    if (!file.shareLink) {
      const shareLink = `https://example.com/shared/${idUtils.generateShortId()}`;
      updateFile(id, { shareLink });
      return shareLink;
    }

    return file.shareLink;
  }, [files, updateFile]);

  const downloadFile = useCallback((id: string) => {
    const file = files.find(f => f.id === id);
    if (!file) return;

    const link = document.createElement('a');
    link.href = file.url;
    link.download = file.name;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [files]);

  const previewFile = useCallback((id: string): MediaFile | null => {
    return files.find(f => f.id === id) || null;
  }, [files]);

  return {
    createFile,
    updateFile,
    deleteFile,
    deleteMultiple,
    duplicateFile,
    shareFile,
    downloadFile,
    previewFile
  };
};

/**
 * Main media management hook that combines all functionality
 */
export interface UseMediaManagementResult {
  // File management
  files: MediaFile[];
  filteredFiles: MediaFile[];
  totalCount: number;
  
  // Selection
  selectedFiles: string[];
  selectedCount: number;
  hasSelection: boolean;
  toggleFileSelection: (fileId: string) => void;
  selectAll: () => void;
  clearSelection: () => void;
  
  // Filtering
  activeTab: MediaTypeType | 'all';
  setActiveTab: (tab: MediaTypeType | 'all') => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  sortBy: SortOptionType;
  setSortBy: (sort: SortOptionType) => void;
  sortOrder: SortOrderType;
  setSortOrder: (order: SortOrderType) => void;
  viewMode: ViewModeType;
  setViewMode: (mode: ViewModeType) => void;
  
  // Upload
  uploadedFiles: File[];
  isUploading: boolean;
  uploadProgress: Record<string, number>;
  uploadErrors: Record<string, string>;
  handleFileSelect: (files: File[]) => void;
  handleUpload: () => Promise<void>;
  clearUploadQueue: () => void;
  
  // Modals
  showPreviewModal: boolean;
  showUploadModal: boolean;
  showEditModal: boolean;
  showShareModal: boolean;
  showDeleteModal: boolean;
  currentFile: MediaFile | null;
  openPreview: (file: MediaFile) => void;
  openUpload: () => void;
  openEdit: (file: MediaFile) => void;
  openShare: (file: MediaFile) => void;
  openDelete: (file?: MediaFile) => void;
  closeModal: (modalType: string) => void;
  
  // Actions
  updateFile: (id: string, updates: Partial<MediaFile>) => void;
  deleteFile: (id: string) => void;
  deleteSelected: () => void;
  
  // Clipboard
  copyFileUrl: (file: MediaFile) => Promise<boolean>;
  copyShareLink: (file: MediaFile) => Promise<boolean>;
  copySuccess: boolean;
}

export const useMediaManagement = (
  initialFiles: Partial<MediaFile>[] = [],
  onMediaSelect?: (files: MediaFile[]) => void
): UseMediaManagementResult => {
  
  // Core file management
  const { files, setFiles, addFiles, updateFile, deleteFiles } = useMediaFiles(initialFiles);
  
  // Selection management
  const { 
    selectedFiles, 
    toggleFileSelection, 
    selectAll: selectAllFiles, 
    clearSelection,
    selectedCount,
    hasSelection
  } = useFileSelection();
  
  // Filtering and search
  const {
    activeTab,
    setActiveTab,
    searchTerm,
    setSearchTerm,
    sortBy,
    setSortBy,
    sortOrder,
    setSortOrder,
    viewMode,
    setViewMode,
    filteredFiles
  } = useFileFilters(files);
  
  // Upload management
  const {
    uploadedFiles,
    isUploading,
    uploadProgress,
    uploadErrors,
    handleFileSelect,
    handleUpload: uploadFiles,
    clearUploadQueue
  } = useFileUpload();
  
  // Modal management
  const {
    showPreviewModal,
    showUploadModal,
    showEditModal,
    showShareModal,
    showDeleteModal,
    currentFile,
    openPreview,
    openUpload,
    openEdit,
    openShare,
    openDelete,
    closeModal
  } = useFileModals();
  
  // Clipboard operations
  const { copyFileUrl, copyShareLink, copySuccess } = useClipboard();

  // Handle upload completion
  const handleUpload = useCallback(async () => {
    await uploadFiles((results) => {
      const successfulUploads = results
        .filter(result => result.success && result.file)
        .map(result => result.file!);
      
      if (successfulUploads.length > 0) {
        addFiles(successfulUploads);
        clearUploadQueue();
        closeModal('upload');
      }
    });
  }, [uploadFiles, addFiles, clearUploadQueue, closeModal]);

  // Handle select all
  const selectAll = useCallback(() => {
    selectAllFiles(filteredFiles.map(file => file.id));
  }, [selectAllFiles, filteredFiles]);

  // Handle delete selected
  const deleteSelected = useCallback(() => {
    if (selectedFiles.length > 0) {
      deleteFiles(selectedFiles);
      clearSelection();
    }
  }, [selectedFiles, deleteFiles, clearSelection]);

  // Handle delete single file
  const deleteFile = useCallback((id: string) => {
    deleteFiles([id]);
    if (selectedFiles.includes(id)) {
      clearSelection();
    }
  }, [deleteFiles, selectedFiles, clearSelection]);

  // Notify parent of selection changes
  useEffect(() => {
    if (onMediaSelect) {
      const selectedMedia = files.filter(file => selectedFiles.includes(file.id));
      onMediaSelect(selectedMedia);
    }
  }, [selectedFiles, files, onMediaSelect]);

  return {
    // File management
    files,
    filteredFiles,
    totalCount: files.length,
    
    // Selection
    selectedFiles,
    selectedCount,
    hasSelection,
    toggleFileSelection,
    selectAll,
    clearSelection,
    
    // Filtering
    activeTab,
    setActiveTab,
    searchTerm,
    setSearchTerm,
    sortBy,
    setSortBy,
    sortOrder,
    setSortOrder,
    viewMode,
    setViewMode,
    
    // Upload
    uploadedFiles,
    isUploading,
    uploadProgress,
    uploadErrors,
    handleFileSelect,
    handleUpload,
    clearUploadQueue,
    
    // Modals
    showPreviewModal,
    showUploadModal,
    showEditModal,
    showShareModal,
    showDeleteModal,
    currentFile,
    openPreview,
    openUpload,
    openEdit,
    openShare,
    openDelete,
    closeModal,
    
    // Actions
    updateFile,
    deleteFile,
    deleteSelected,
    
    // Clipboard
    copyFileUrl,
    copyShareLink,
    copySuccess
  };
};

/**
 * MEDIA HOOKS COMPLETION SUMMARY:
 * ✅ useMediaFiles - Core file state management
 * ✅ useFileUpload - Upload handling with progress tracking
 * ✅ useFileSelection - Selection state with bulk operations
 * ✅ useFileFilters - Search, filter, and sort functionality
 * ✅ useFileValidation - Comprehensive validation hooks
 * ✅ useFileModals - Modal state management
 * ✅ useClipboard - Clipboard operations with feedback
 * ✅ useFileActions - CRUD operations with cleanup
 * ✅ useMediaManagement - Main composite hook
 * 
 * These hooks provide a complete state management solution for the
 * MediaManagementSystem with proper separation of concerns and reusability.
 */

export default {
  useMediaFiles,
  useFileUpload,
  useFileSelection,
  useFileFilters,
  useFileValidation,
  useFileModals,
  useClipboard,
  useFileActions,
  useMediaManagement
};
