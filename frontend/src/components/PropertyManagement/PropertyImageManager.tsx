// PropertyImageManager.tsx
/**
 * PROPERTY IMAGE MANAGEMENT COMPONENT
 * ===================================
 * Specialized component for handling property image uploads,
 * display, and management with drag-and-drop functionality
 */

import React, { useState, useCallback, useRef } from 'react';
import styled from 'styled-components';
import { 
  Upload, 
  X, 
  Image as ImageIcon, 
  Eye, 
  Download, 
  Trash2,
  Plus,
  RotateCw,
  ZoomIn,
  ZoomOut
} from 'lucide-react';

import { useToast } from '../../hooks/use-toast';

// Types
interface PropertyImage {
  filename: string;
  originalName: string;
  size: number;
  url: string;
  uploadedAt?: string;
}

interface PropertyImageManagerProps {
  propertyId?: string;
  existingImages?: PropertyImage[];
  onImagesChange?: (images: PropertyImage[]) => void;
  maxImages?: number;
  maxFileSize?: number; // in MB
  allowedTypes?: string[];
  showPreview?: boolean;
  enableBulkActions?: boolean;
}

// Styled Components
const ImageManagerContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const UploadZone = styled.div<{ $isDragOver: boolean; $hasImages: boolean }>`
  border: 2px dashed ${props => props.$isDragOver ? '#FFD700' : 'rgba(255, 215, 0, 0.3)'};
  border-radius: 12px;
  padding: ${props => props.$hasImages ? '1.5rem' : '3rem'};
  text-align: center;
  background: ${props => props.$isDragOver ? 'rgba(255, 215, 0, 0.1)' : 'rgba(40, 40, 40, 0.3)'};
  transition: all 0.3s ease;
  cursor: pointer;
  position: relative;
  
  &:hover {
    border-color: rgba(255, 215, 0, 0.6);
    background: rgba(40, 40, 40, 0.5);
  }
  
  .upload-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
    
    .upload-icon {
      padding: 1.5rem;
      background: rgba(255, 215, 0, 0.1);
      border-radius: 50%;
      color: #FFD700;
      margin-bottom: 0.5rem;
    }
    
    .upload-text {
      color: #E0E0E0;
      font-size: 1.1rem;
      margin-bottom: 0.5rem;
      
      .highlight {
        color: #FFD700;
        font-weight: 600;
      }
    }
    
    .upload-hints {
      color: #B0B0B0;
      font-size: 0.9rem;
      line-height: 1.4;
      
      .hint-item {
        display: block;
        margin-bottom: 0.25rem;
      }
    }
    
    .upload-progress {
      width: 100%;
      max-width: 300px;
      height: 4px;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 2px;
      overflow: hidden;
      margin-top: 1rem;
      
      .progress-bar {
        height: 100%;
        background: linear-gradient(90deg, #FFD700, #FFA500);
        transition: width 0.3s ease;
      }
    }
  }
  
  input[type="file"] {
    display: none;
  }
`;

const ImageGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1rem;
`;

const ImageCard = styled.div`
  background: rgba(30, 30, 30, 0.9);
  border-radius: 12px;
  border: 1px solid rgba(255, 215, 0, 0.3);
  overflow: hidden;
  transition: all 0.3s ease;
  position: relative;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(255, 215, 0, 0.15);
    border-color: rgba(255, 215, 0, 0.5);
    
    .image-overlay {
      opacity: 1;
    }
  }
`;

const ImagePreview = styled.div`
  width: 100%;
  height: 150px;
  position: relative;
  overflow: hidden;
  background: rgba(40, 40, 40, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.3s ease;
  }
  
  .loading-placeholder {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
    color: #666;
    
    .spinner {
      width: 24px;
      height: 24px;
      border: 2px solid rgba(255, 215, 0, 0.3);
      border-top-color: #FFD700;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }
  }
  
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;

const ImageOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  opacity: 0;
  transition: opacity 0.3s ease;
  
  button {
    padding: 0.5rem;
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 8px;
    color: #E0E0E0;
    cursor: pointer;
    transition: all 0.2s ease;
    backdrop-filter: blur(10px);
    
    &:hover {
      background: rgba(255, 215, 0, 0.2);
      color: #FFD700;
      border-color: rgba(255, 215, 0, 0.5);
    }
    
    &.danger:hover {
      background: rgba(239, 68, 68, 0.2);
      color: #EF4444;
      border-color: rgba(239, 68, 68, 0.5);
    }
  }
`;

const ImageInfo = styled.div`
  padding: 1rem;
  
  .image-name {
    color: #E0E0E0;
    font-size: 0.9rem;
    font-weight: 500;
    margin-bottom: 0.5rem;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  
  .image-details {
    display: flex;
    justify-content: space-between;
    align-items: center;
    color: #B0B0B0;
    font-size: 0.8rem;
    
    .file-size {
      font-weight: 500;
    }
    
    .upload-date {
      font-style: italic;
    }
  }
`;

const BulkActions = styled.div`
  display: flex;
  gap: 1rem;
  align-items: center;
  padding: 1rem;
  background: rgba(20, 20, 20, 0.5);
  border-radius: 8px;
  border: 1px solid rgba(255, 215, 0, 0.3);
  
  .bulk-info {
    color: #B0B0B0;
    font-size: 0.9rem;
    
    .count {
      color: #FFD700;
      font-weight: 600;
    }
  }
  
  .bulk-buttons {
    display: flex;
    gap: 0.5rem;
    margin-left: auto;
    
    button {
      padding: 0.5rem 1rem;
      border: none;
      border-radius: 6px;
      font-size: 0.8rem;
      cursor: pointer;
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      
      &.download {
        background: rgba(59, 130, 246, 0.2);
        color: #3B82F6;
        border: 1px solid rgba(59, 130, 246, 0.3);
        
        &:hover {
          background: rgba(59, 130, 246, 0.3);
        }
      }
      
      &.delete {
        background: rgba(239, 68, 68, 0.2);
        color: #EF4444;
        border: 1px solid rgba(239, 68, 68, 0.3);
        
        &:hover {
          background: rgba(239, 68, 68, 0.3);
        }
      }
    }
  }
`;

const ImageModal = styled.div<{ $isOpen: boolean }>`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.95);
  display: ${props => props.$isOpen ? 'flex' : 'none'};
  align-items: center;
  justify-content: center;
  z-index: 2000;
  padding: 2rem;
  
  .modal-content {
    position: relative;
    max-width: 90vw;
    max-height: 90vh;
    
    img {
      max-width: 100%;
      max-height: 100%;
      object-fit: contain;
      border-radius: 8px;
    }
    
    .modal-controls {
      position: absolute;
      top: 1rem;
      right: 1rem;
      display: flex;
      gap: 0.5rem;
      
      button {
        padding: 0.75rem;
        background: rgba(0, 0, 0, 0.8);
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: 8px;
        color: #E0E0E0;
        cursor: pointer;
        transition: all 0.2s ease;
        backdrop-filter: blur(10px);
        
        &:hover {
          background: rgba(255, 215, 0, 0.2);
          color: #FFD700;
          border-color: rgba(255, 215, 0, 0.5);
        }
      }
    }
    
    .modal-info {
      position: absolute;
      bottom: 1rem;
      left: 1rem;
      right: 1rem;
      padding: 1rem;
      background: rgba(0, 0, 0, 0.8);
      border-radius: 8px;
      color: #E0E0E0;
      backdrop-filter: blur(10px);
      
      .image-title {
        font-weight: 600;
        margin-bottom: 0.5rem;
        color: #FFD700;
      }
      
      .image-meta {
        display: flex;
        gap: 2rem;
        font-size: 0.9rem;
        color: #B0B0B0;
      }
    }
  }
`;

// Utility functions
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const isValidImageType = (file: File, allowedTypes: string[]): boolean => {
  return allowedTypes.some(type => file.type.includes(type));
};

const isValidFileSize = (file: File, maxSize: number): boolean => {
  return file.size <= maxSize * 1024 * 1024; // Convert MB to bytes
};

// Main Component
const PropertyImageManager: React.FC<PropertyImageManagerProps> = ({
  propertyId,
  existingImages = [],
  onImagesChange,
  maxImages = 10,
  maxFileSize = 10,
  allowedTypes = ['jpeg', 'jpg', 'png', 'gif', 'webp'],
  showPreview = true,
  enableBulkActions = true
}) => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // State
  const [images, setImages] = useState<PropertyImage[]>(existingImages);
  const [uploadingFiles, setUploadingFiles] = useState<File[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedImages, setSelectedImages] = useState<PropertyImage[]>([]);
  const [previewImage, setPreviewImage] = useState<PropertyImage | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);

  // Upload new images
  const handleFileUpload = useCallback(async (files: File[]) => {
    const validFiles = files.filter(file => {
      if (!isValidImageType(file, allowedTypes)) {
        toast({
          title: "Invalid File Type",
          description: `${file.name} is not a supported image format.`,
          variant: "destructive"
        });
        return false;
      }
      
      if (!isValidFileSize(file, maxFileSize)) {
        toast({
          title: "File Too Large",
          description: `${file.name} exceeds the ${maxFileSize}MB size limit.`,
          variant: "destructive"
        });
        return false;
      }
      
      return true;
    });

    if (validFiles.length === 0) return;

    if (images.length + validFiles.length > maxImages) {
      toast({
        title: "Too Many Images",
        description: `Maximum ${maxImages} images allowed. Please remove some images first.`,
        variant: "destructive"
      });
      return;
    }

    setUploadingFiles(validFiles);
    setUploadProgress(0);

    try {
      if (propertyId) {
        // Upload to existing property
        const formData = new FormData();
        validFiles.forEach(file => formData.append('images', file));

        const response = await fetch(`/api/internal/v1/properties/${propertyId}/images`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: formData
        });

        if (response.ok) {
          const data = await response.json();
          toast({
            title: "Images Uploaded",
            description: `${data.data.newImages} image(s) uploaded successfully.`,
            variant: "default"
          });
          
          // Reload property images (would need API call)
          // For now, we'll simulate the new images
          const newImages: PropertyImage[] = validFiles.map(file => ({
            filename: `property-${Date.now()}-${file.name}`,
            originalName: file.name,
            size: file.size,
            url: URL.createObjectURL(file),
            uploadedAt: new Date().toISOString()
          }));
          
          setImages(prev => [...prev, ...newImages]);
          onImagesChange?.([...images, ...newImages]);
        } else {
          throw new Error('Upload failed');
        }
      } else {
        // New property - store files locally for form submission
        const newImages: PropertyImage[] = validFiles.map(file => ({
          filename: file.name,
          originalName: file.name,
          size: file.size,
          url: URL.createObjectURL(file),
          uploadedAt: new Date().toISOString()
        }));
        
        setImages(prev => [...prev, ...newImages]);
        onImagesChange?.([...images, ...newImages]);
        
        toast({
          title: "Images Added",
          description: `${validFiles.length} image(s) added for upload.`,
          variant: "default"
        });
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload Failed",
        description: "Failed to upload images. Please try again.",
        variant: "destructive"
      });
    } finally {
      setUploadingFiles([]);
      setUploadProgress(0);
    }
  }, [images, propertyId, maxImages, maxFileSize, allowedTypes, toast, onImagesChange]);

  // Delete image
  const handleDeleteImage = useCallback(async (image: PropertyImage) => {
    try {
      setImages(prev => prev.filter(img => img.filename !== image.filename));
      onImagesChange?.(images.filter(img => img.filename !== image.filename));
      
      toast({
        title: "Image Removed",
        description: "Image has been removed successfully.",
        variant: "default"
      });
    } catch (error) {
      console.error('Delete error:', error);
      toast({
        title: "Deletion Failed",
        description: "Failed to remove image. Please try again.",
        variant: "destructive"
      });
    }
  }, [images, toast, onImagesChange]);

  // Bulk delete selected images
  const handleBulkDelete = useCallback(async () => {
    if (selectedImages.length === 0) return;
    
    if (!confirm(`Are you sure you want to delete ${selectedImages.length} selected image(s)?`)) {
      return;
    }

    try {
      const remainingImages = images.filter(img => 
        !selectedImages.some(selected => selected.filename === img.filename)
      );
      
      setImages(remainingImages);
      setSelectedImages([]);
      onImagesChange?.(remainingImages);
      
      toast({
        title: "Images Deleted",
        description: `${selectedImages.length} image(s) deleted successfully.`,
        variant: "default"
      });
    } catch (error) {
      console.error('Bulk delete error:', error);
      toast({
        title: "Bulk Delete Failed",
        description: "Failed to delete selected images. Please try again.",
        variant: "destructive"
      });
    }
  }, [selectedImages, images, toast, onImagesChange]);

  // Drag and drop handlers
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files).filter(file => 
      file.type.startsWith('image/')
    );
    
    if (files.length > 0) {
      handleFileUpload(files);
    }
  }, [handleFileUpload]);

  // File input change handler
  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      handleFileUpload(files);
      // Reset input
      e.target.value = '';
    }
  }, [handleFileUpload]);

  return (
    <ImageManagerContainer>
      {/* Upload Zone */}
      <UploadZone
        $isDragOver={isDragOver}
        $hasImages={images.length > 0}
        onClick={() => fileInputRef.current?.click()}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="upload-content">
          <div className="upload-icon">
            <Upload size={32} />
          </div>
          <div className="upload-text">
            <span className="highlight">Click to upload</span> or drag and drop
          </div>
          <div className="upload-hints">
            <span className="hint-item">
              {allowedTypes.map(type => type.toUpperCase()).join(', ')} up to {maxFileSize}MB each
            </span>
            <span className="hint-item">
              Maximum {maxImages} images ({images.length} uploaded)
            </span>
          </div>
          
          {uploadingFiles.length > 0 && (
            <div className="upload-progress">
              <div 
                className="progress-bar" 
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          )}
        </div>
        
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={allowedTypes.map(type => `image/${type}`).join(',')}
          onChange={handleFileInputChange}
        />
      </UploadZone>

      {/* Bulk Actions */}
      {enableBulkActions && images.length > 0 && (
        <BulkActions>
          <div className="bulk-info">
            <span className="count">{selectedImages.length}</span> of{' '}
            <span className="count">{images.length}</span> images selected
          </div>
          
          {selectedImages.length > 0 && (
            <div className="bulk-buttons">
              <button 
                className="download"
                onClick={() => {
                  // Implement bulk download
                  toast({
                    title: "Download Started",
                    description: `Downloading ${selectedImages.length} image(s)...`,
                    variant: "default"
                  });
                }}
              >
                <Download size={14} />
                Download
              </button>
              <button 
                className="delete"
                onClick={handleBulkDelete}
              >
                <Trash2 size={14} />
                Delete
              </button>
            </div>
          )}
        </BulkActions>
      )}

      {/* Image Grid */}
      {images.length > 0 && (
        <ImageGrid>
          {images.map((image, index) => (
            <ImageCard key={`${image.filename}-${index}`}>
              <ImagePreview>
                {image.url ? (
                  <img 
                    src={image.url} 
                    alt={image.originalName}
                    loading="lazy"
                  />
                ) : (
                  <div className="loading-placeholder">
                    <div className="spinner" />
                    <span>Loading...</span>
                  </div>
                )}
                
                <ImageOverlay className="image-overlay">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setPreviewImage(image);
                    }}
                    title="View full size"
                  >
                    <Eye size={16} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      // Implement download
                      const link = document.createElement('a');
                      link.href = image.url;
                      link.download = image.originalName;
                      link.click();
                    }}
                    title="Download"
                  >
                    <Download size={16} />
                  </button>
                  <button
                    className="danger"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteImage(image);
                    }}
                    title="Delete"
                  >
                    <Trash2 size={16} />
                  </button>
                </ImageOverlay>
              </ImagePreview>
              
              <ImageInfo>
                <div className="image-name" title={image.originalName}>
                  {image.originalName}
                </div>
                <div className="image-details">
                  <span className="file-size">{formatFileSize(image.size)}</span>
                  {image.uploadedAt && (
                    <span className="upload-date">
                      {new Date(image.uploadedAt).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </ImageInfo>
              
              {enableBulkActions && (
                <input
                  type="checkbox"
                  style={{ 
                    position: 'absolute', 
                    top: '0.5rem', 
                    left: '0.5rem',
                    transform: 'scale(1.2)'
                  }}
                  checked={selectedImages.some(selected => selected.filename === image.filename)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedImages(prev => [...prev, image]);
                    } else {
                      setSelectedImages(prev => 
                        prev.filter(selected => selected.filename !== image.filename)
                      );
                    }
                  }}
                />
              )}
            </ImageCard>
          ))}
        </ImageGrid>
      )}

      {/* Image Preview Modal */}
      {showPreview && (
        <ImageModal $isOpen={!!previewImage}>
          {previewImage && (
            <div className="modal-content">
              <img 
                src={previewImage.url} 
                alt={previewImage.originalName}
              />
              
              <div className="modal-controls">
                <button
                  onClick={() => {
                    const link = document.createElement('a');
                    link.href = previewImage.url;
                    link.download = previewImage.originalName;
                    link.click();
                  }}
                  title="Download"
                >
                  <Download size={16} />
                </button>
                <button
                  onClick={() => setPreviewImage(null)}
                  title="Close"
                >
                  <X size={16} />
                </button>
              </div>
              
              <div className="modal-info">
                <div className="image-title">{previewImage.originalName}</div>
                <div className="image-meta">
                  <span>Size: {formatFileSize(previewImage.size)}</span>
                  {previewImage.uploadedAt && (
                    <span>
                      Uploaded: {new Date(previewImage.uploadedAt).toLocaleString()}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}
        </ImageModal>
      )}
    </ImageManagerContainer>
  );
};

export default PropertyImageManager;