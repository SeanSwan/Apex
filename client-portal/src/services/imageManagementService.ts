// client-portal/src/services/imageManagementService.ts
/**
 * APEX AI PROPERTY IMAGE MANAGEMENT SERVICE
 * ========================================
 * Comprehensive service for managing property images across admin and client portals
 * Features: Upload, download, gallery management, progress tracking, error handling
 */

import { apiService } from './apiService';

// ===========================
// TYPE DEFINITIONS
// ===========================

export interface PropertyImage {
  id?: string;
  filename: string;
  originalName: string;
  size: number;
  url?: string;
  thumbnailUrl?: string;
  watermarkedUrl?: string;
  downloadUrl?: string;
  uploadedAt?: string;
  isPrimary?: boolean;
  description?: string;
  dimensions?: {
    width: number | null;
    height: number | null;
  };
}

export interface PropertyImageGallery {
  property: {
    id: string;
    name: string;
    address: string;
    clientName?: string;
  };
  gallery: {
    images: PropertyImage[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  };
  metadata: {
    totalImages: number;
    lastUpdated: string | null;
    primaryImage: string | null;
  };
}

export interface ImageUploadProgress {
  filename: string;
  progress: number;
  status: 'uploading' | 'completed' | 'error';
  error?: string;
}

export interface ImageUploadResult {
  success: boolean;
  newImages: number;
  totalImages: number;
  errors?: string[];
}

export interface ImageStatistics {
  totalProperties: number;
  propertiesWithImages: number;
  totalImages: number;
  averageImagesPerProperty: string;
  lastImageUpload: string | null;
}

// ===========================
// IMAGE MANAGEMENT SERVICE
// ===========================

class ImageManagementService {
  private uploadProgressCallbacks: Map<string, (progress: ImageUploadProgress) => void> = new Map();

  /**
   * Upload images to a property (Admin only)
   */
  async uploadPropertyImages(
    propertyId: string,
    files: File[],
    onProgress?: (progress: ImageUploadProgress) => void
  ): Promise<ImageUploadResult> {
    try {
      const formData = new FormData();
      
      // Add files to form data
      files.forEach(file => {
        formData.append('images', file);
      });

      // Create XMLHttpRequest for upload progress tracking
      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        
        // Track upload progress
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable && onProgress) {
            const progress = Math.round((event.loaded * 100) / event.total);
            files.forEach(file => {
              onProgress({
                filename: file.name,
                progress,
                status: 'uploading'
              });
            });
          }
        });

        // Handle completion
        xhr.addEventListener('load', () => {
          try {
            const response = JSON.parse(xhr.responseText);
            
            if (xhr.status === 200 && response.success) {
              // Mark all files as completed
              if (onProgress) {
                files.forEach(file => {
                  onProgress({
                    filename: file.name,
                    progress: 100,
                    status: 'completed'
                  });
                });
              }
              
              resolve(response.data);
            } else {
              // Mark files as error
              if (onProgress) {
                files.forEach(file => {
                  onProgress({
                    filename: file.name,
                    progress: 0,
                    status: 'error',
                    error: response.message || 'Upload failed'
                  });
                });
              }
              
              reject(new Error(response.message || 'Upload failed'));
            }
          } catch (parseError) {
            reject(new Error('Invalid response from server'));
          }
        });

        // Handle errors
        xhr.addEventListener('error', () => {
          if (onProgress) {
            files.forEach(file => {
              onProgress({
                filename: file.name,
                progress: 0,
                status: 'error',
                error: 'Network error'
              });
            });
          }
          reject(new Error('Network error during upload'));
        });

        // Configure and send request
        const token = localStorage.getItem('authToken');
        xhr.open('POST', `/api/internal/v1/properties/${propertyId}/images`);
        
        if (token) {
          xhr.setRequestHeader('Authorization', `Bearer ${token}`);
        }
        
        xhr.send(formData);
      });

    } catch (error) {
      console.error('Error uploading property images:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to upload images');
    }
  }

  /**
   * Get all images for a property (Client Portal)
   */
  async getPropertyImages(propertyId: string): Promise<PropertyImage[]> {
    try {
      const response = await apiService.get(`/api/client/v1/property-images/${propertyId}`);
      
      if (response.success) {
        return response.data.images || [];
      } else {
        throw new Error(response.message || 'Failed to fetch property images');
      }
    } catch (error) {
      console.error('Error fetching property images:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to fetch property images');
    }
  }

  /**
   * Get property image gallery with pagination (Client Portal)
   */
  async getPropertyGallery(
    propertyId: string,
    page: number = 1,
    limit: number = 12
  ): Promise<PropertyImageGallery> {
    try {
      const response = await apiService.get(
        `/api/client/v1/property-images/gallery/${propertyId}`,
        { page, limit }
      );
      
      if (response.success) {
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to fetch property gallery');
      }
    } catch (error) {
      console.error('Error fetching property gallery:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to fetch property gallery');
    }
  }

  /**
   * Download a property image (Client Portal)
   */
  async downloadPropertyImage(
    propertyId: string,
    filename: string,
    watermarked: boolean = true
  ): Promise<Blob> {
    try {
      const endpoint = watermarked 
        ? `/api/client/v1/property-images/${propertyId}/download/${filename}`
        : `/property-images/${filename}`;

      const token = localStorage.getItem('authToken');
      
      const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
      });

      if (!response.ok) {
        throw new Error(`Download failed: ${response.statusText}`);
      }

      return await response.blob();
    } catch (error) {
      console.error('Error downloading property image:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to download image');
    }
  }

  /**
   * Get image statistics for client properties
   */
  async getImageStatistics(): Promise<ImageStatistics> {
    try {
      const response = await apiService.get('/api/client/v1/property-images/stats');
      
      if (response.success) {
        return response.data.statistics;
      } else {
        throw new Error(response.message || 'Failed to fetch image statistics');
      }
    } catch (error) {
      console.error('Error fetching image statistics:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to fetch image statistics');
    }
  }

  /**
   * Validate image files before upload
   */
  validateImageFiles(files: File[]): { valid: File[]; invalid: { file: File; reason: string }[] } {
    const valid: File[] = [];
    const invalid: { file: File; reason: string }[] = [];

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    const maxSize = 10 * 1024 * 1024; // 10MB
    const maxFiles = 5;

    // Check file count
    if (files.length > maxFiles) {
      files.slice(maxFiles).forEach(file => {
        invalid.push({
          file,
          reason: `Maximum ${maxFiles} files allowed`
        });
      });
    }

    // Check each file
    files.slice(0, maxFiles).forEach(file => {
      if (!allowedTypes.includes(file.type)) {
        invalid.push({
          file,
          reason: 'Invalid file type. Only JPG, PNG, GIF, and WebP are allowed'
        });
      } else if (file.size > maxSize) {
        invalid.push({
          file,
          reason: 'File size exceeds 10MB limit'
        });
      } else {
        valid.push(file);
      }
    });

    return { valid, invalid };
  }

  /**
   * Create image preview URLs for display before upload
   */
  createImagePreviews(files: File[]): Promise<{ file: File; previewUrl: string }[]> {
    return Promise.all(
      files.map(file => 
        new Promise<{ file: File; previewUrl: string }>((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => {
            resolve({
              file,
              previewUrl: e.target?.result as string
            });
          };
          reader.readAsDataURL(file);
        })
      )
    );
  }

  /**
   * Format file size for display
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Generate thumbnail URL for an image
   */
  getThumbnailUrl(image: PropertyImage): string {
    return image.thumbnailUrl || image.url || `/property-images/thumbnails/${image.filename}`;
  }

  /**
   * Generate full-size image URL
   */
  getFullImageUrl(image: PropertyImage, watermarked: boolean = false): string {
    if (watermarked && image.watermarkedUrl) {
      return image.watermarkedUrl;
    }
    return image.url || `/property-images/${image.filename}`;
  }

  /**
   * Check if an image is the primary image for a property
   */
  isPrimaryImage(image: PropertyImage): boolean {
    return image.isPrimary || false;
  }

  /**
   * Get image dimensions if available
   */
  getImageDimensions(image: PropertyImage): string | null {
    if (image.dimensions?.width && image.dimensions?.height) {
      return `${image.dimensions.width} × ${image.dimensions.height}`;
    }
    return null;
  }

  /**
   * Cleanup preview URLs to prevent memory leaks
   */
  cleanupPreviewUrls(previewUrls: string[]): void {
    previewUrls.forEach(url => {
      if (url.startsWith('blob:')) {
        URL.revokeObjectURL(url);
      }
    });
  }
}

// Export singleton instance
export const imageManagementService = new ImageManagementService();
export default imageManagementService;
