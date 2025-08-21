// client-portal/src/components/common/PropertyImageUpload.tsx
/**
 * APEX AI PROPERTY IMAGE UPLOAD COMPONENT
 * =======================================
 * Professional drag-drop image upload interface for property management
 * Features: Drag-drop, progress tracking, validation, preview, bulk upload
 */

import React, { useState, useRef, useCallback } from 'react';
import { Upload, X, Image, AlertCircle, CheckCircle, Loader } from 'lucide-react';
import { 
  imageManagementService, 
  type PropertyImage, 
  type ImageUploadProgress,
  type ImageUploadResult 
} from '../../services/imageManagementService';

// ===========================
// TYPE DEFINITIONS
// ===========================

interface PropertyImageUploadProps {
  propertyId: string;
  propertyName: string;
  existingImages?: PropertyImage[];
  onUploadComplete?: (result: ImageUploadResult) => void;
  onUploadError?: (error: string) => void;
  maxFiles?: number;
  disabled?: boolean;
  className?: string;
}

interface FilePreview {
  file: File;
  previewUrl: string;
  progress?: ImageUploadProgress;
}

// ===========================
// MAIN COMPONENT
// ===========================

export const PropertyImageUpload: React.FC<PropertyImageUploadProps> = ({
  propertyId,
  propertyName,
  existingImages = [],
  onUploadComplete,
  onUploadError,
  maxFiles = 5,
  disabled = false,
  className = ''
}) => {
  // ===========================
  // STATE MANAGEMENT
  // ===========================

  const [isDragOver, setIsDragOver] = useState(false);
  const [filePreviews, setFilePreviews] = useState<FilePreview[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [uploadProgress, setUploadProgress] = useState<Map<string, ImageUploadProgress>>(new Map());
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  // ===========================
  // FILE HANDLING
  // ===========================

  const handleFiles = useCallback(async (files: FileList | File[]) => {
    if (disabled) return;

    const fileArray = Array.from(files);
    
    // Validate files
    const { valid, invalid } = imageManagementService.validateImageFiles(fileArray);
    
    // Set validation errors
    if (invalid.length > 0) {
      setValidationErrors(invalid.map(({ file, reason }) => `${file.name}: ${reason}`));
    } else {
      setValidationErrors([]);
    }

    // Create previews for valid files
    if (valid.length > 0) {
      try {
        const previews = await imageManagementService.createImagePreviews(valid);
        setFilePreviews(prev => [
          ...prev,
          ...previews.map(({ file, previewUrl }) => ({ file, previewUrl }))
        ]);
      } catch (error) {
        console.error('Error creating previews:', error);
        onUploadError?.('Failed to create image previews');
      }
    }
  }, [disabled, onUploadError]);

  // ===========================
  // DRAG & DROP HANDLERS
  // ===========================

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      setIsDragOver(true);
    }
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    
    if (disabled) return;

    const files = e.dataTransfer.files;
    handleFiles(files);
  }, [disabled, handleFiles]);

  // ===========================
  // FILE INPUT HANDLERS
  // ===========================

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      handleFiles(files);
    }
    
    // Reset input value to allow re-selecting same files
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [handleFiles]);

  const openFileDialog = useCallback(() => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  }, [disabled]);

  // ===========================
  // UPLOAD MANAGEMENT
  // ===========================

  const removePreview = useCallback((index: number) => {
    setFilePreviews(prev => {
      const newPreviews = [...prev];
      const removed = newPreviews.splice(index, 1)[0];
      
      // Cleanup preview URL
      if (removed.previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(removed.previewUrl);
      }
      
      return newPreviews;
    });
  }, []);

  const clearAllPreviews = useCallback(() => {
    // Cleanup all preview URLs
    filePreviews.forEach(preview => {
      if (preview.previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(preview.previewUrl);
      }
    });
    
    setFilePreviews([]);
    setValidationErrors([]);
    setUploadProgress(new Map());
  }, [filePreviews]);

  const uploadImages = useCallback(async () => {
    if (filePreviews.length === 0 || isUploading || disabled) return;

    setIsUploading(true);
    setUploadProgress(new Map());

    try {
      const files = filePreviews.map(preview => preview.file);
      
      const result = await imageManagementService.uploadPropertyImages(
        propertyId,
        files,
        (progress) => {
          setUploadProgress(prev => new Map(prev).set(progress.filename, progress));
        }
      );

      // Success
      onUploadComplete?.(result);
      clearAllPreviews();
      
    } catch (error) {
      console.error('Upload error:', error);
      onUploadError?.(error instanceof Error ? error.message : 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  }, [filePreviews, isUploading, disabled, propertyId, onUploadComplete, onUploadError, clearAllPreviews]);

  // ===========================
  // RENDER HELPERS
  // ===========================

  const getProgressForFile = (filename: string): ImageUploadProgress | undefined => {
    return uploadProgress.get(filename);
  };

  const renderFilePreview = (preview: FilePreview, index: number) => {
    const progress = getProgressForFile(preview.file.name);
    const isCompleted = progress?.status === 'completed';
    const hasError = progress?.status === 'error';

    return (
      <div 
        key={`${preview.file.name}-${index}`}
        className="relative group border-2 border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm hover:shadow-md transition-all duration-200"
      >
        {/* Image Preview */}
        <div className="aspect-square bg-gray-50 flex items-center justify-center">
          <img 
            src={preview.previewUrl}
            alt={preview.file.name}
            className="w-full h-full object-cover"
          />
        </div>

        {/* File Info Overlay */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
          <div className="text-white text-xs">
            <div className="font-medium truncate">{preview.file.name}</div>
            <div className="text-gray-300">
              {imageManagementService.formatFileSize(preview.file.size)}
            </div>
          </div>
        </div>

        {/* Progress Overlay */}
        {progress && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <div className="bg-white rounded-lg p-3 min-w-[120px]">
              {progress.status === 'uploading' && (
                <div className="text-center">
                  <Loader className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-600" />
                  <div className="text-sm font-medium">{progress.progress}%</div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${progress.progress}%` }}
                    />
                  </div>
                </div>
              )}
              
              {progress.status === 'completed' && (
                <div className="text-center text-green-600">
                  <CheckCircle className="w-6 h-6 mx-auto mb-1" />
                  <div className="text-sm font-medium">Complete</div>
                </div>
              )}
              
              {progress.status === 'error' && (
                <div className="text-center text-red-600">
                  <AlertCircle className="w-6 h-6 mx-auto mb-1" />
                  <div className="text-sm font-medium">Error</div>
                  {progress.error && (
                    <div className="text-xs text-gray-600 mt-1">{progress.error}</div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Remove Button */}
        {!isUploading && (
          <button
            onClick={() => removePreview(index)}
            className="absolute top-2 right-2 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200"
            title="Remove image"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    );
  };

  // ===========================
  // MAIN RENDER
  // ===========================

  return (
    <div className={`property-image-upload ${className}`}>
      {/* Header */}
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Property Images</h3>
        <p className="text-sm text-gray-600">
          Upload images for <strong>{propertyName}</strong>
        </p>
        {existingImages.length > 0 && (
          <p className="text-sm text-blue-600 mt-1">
            {existingImages.length} existing image{existingImages.length !== 1 ? 's' : ''}
          </p>
        )}
      </div>

      {/* Drop Zone */}
      <div
        ref={dropZoneRef}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={openFileDialog}
        className={`
          relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all duration-200
          ${isDragOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          ${isUploading ? 'pointer-events-none' : ''}
        `}
      >
        <div className="flex flex-col items-center">
          <Upload className={`w-12 h-12 mb-4 ${isDragOver ? 'text-blue-500' : 'text-gray-400'}`} />
          
          <h4 className="text-lg font-medium text-gray-900 mb-2">
            {isDragOver ? 'Drop images here' : 'Upload Property Images'}
          </h4>
          
          <p className="text-gray-600 mb-4">
            Drag and drop images here, or click to browse
          </p>
          
          <div className="text-sm text-gray-500">
            <p>Supports JPG, PNG, GIF, WebP</p>
            <p>Maximum {maxFiles} files, 10MB each</p>
          </div>
        </div>

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
          onChange={handleFileInputChange}
          className="hidden"
          disabled={disabled}
        />
      </div>

      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start">
            <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 mr-3 flex-shrink-0" />
            <div>
              <h4 className="text-sm font-medium text-red-800 mb-1">Upload Errors</h4>
              <ul className="text-sm text-red-700 list-disc list-inside space-y-1">
                {validationErrors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* File Previews */}
      {filePreviews.length > 0 && (
        <div className="mt-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-md font-medium text-gray-900">
              Selected Images ({filePreviews.length})
            </h4>
            
            {!isUploading && (
              <button
                onClick={clearAllPreviews}
                className="text-sm text-gray-600 hover:text-red-600 transition-colors"
              >
                Clear All
              </button>
            )}
          </div>

          {/* Preview Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {filePreviews.map(renderFilePreview)}
          </div>

          {/* Upload Button */}
          <div className="mt-6 flex justify-end">
            <button
              onClick={uploadImages}
              disabled={isUploading || disabled || filePreviews.length === 0}
              className={`
                px-6 py-3 rounded-lg font-medium flex items-center transition-all duration-200
                ${isUploading || disabled || filePreviews.length === 0
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg'
                }
              `}
            >
              {isUploading ? (
                <>
                  <Loader className="w-5 h-5 animate-spin mr-2" />
                  Uploading...
                </>
              ) : (
                <>
                  <Image className="w-5 h-5 mr-2" />
                  Upload {filePreviews.length} Image{filePreviews.length !== 1 ? 's' : ''}
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PropertyImageUpload;
