// client-portal/src/components/common/PropertyImageGallery.tsx
/**
 * APEX AI PROPERTY IMAGE GALLERY COMPONENT
 * ========================================
 * Professional image gallery for displaying property images
 * Features: Lightbox view, pagination, download, responsive grid, metadata display
 */

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Image, 
  Download, 
  ZoomIn, 
  X, 
  ChevronLeft, 
  ChevronRight, 
  Star,
  Calendar,
  FileImage,
  Eye,
  Grid
} from 'lucide-react';
import { 
  imageManagementService, 
  type PropertyImage, 
  type PropertyImageGallery as PropertyImageGalleryType 
} from '../../services/imageManagementService';

// ===========================
// TYPE DEFINITIONS
// ===========================

interface PropertyImageGalleryProps {
  propertyId: string;
  images?: PropertyImage[];
  showDownload?: boolean;
  showMetadata?: boolean;
  enableLightbox?: boolean;
  gridCols?: 2 | 3 | 4 | 5 | 6;
  className?: string;
  onImageClick?: (image: PropertyImage, index: number) => void;
  onDownload?: (image: PropertyImage) => void;
}

interface LightboxState {
  isOpen: boolean;
  currentIndex: number;
  images: PropertyImage[];
}

// ===========================
// MAIN COMPONENT
// ===========================

export const PropertyImageGallery: React.FC<PropertyImageGalleryProps> = ({
  propertyId,
  images: initialImages,
  showDownload = true,
  showMetadata = true,
  enableLightbox = true,
  gridCols = 4,
  className = '',
  onImageClick,
  onDownload
}) => {
  // ===========================
  // STATE MANAGEMENT
  // ===========================

  const [galleryData, setGalleryData] = useState<PropertyImageGalleryType | null>(null);
  const [images, setImages] = useState<PropertyImage[]>(initialImages || []);
  const [isLoading, setIsLoading] = useState(!initialImages);
  const [error, setError] = useState<string | null>(null);
  const [lightbox, setLightbox] = useState<LightboxState>({
    isOpen: false,
    currentIndex: 0,
    images: []
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // ===========================
  // DATA FETCHING
  // ===========================

  const fetchGalleryData = useCallback(async (page: number = 1) => {
    if (initialImages) return; // Don't fetch if images provided directly

    setIsLoading(true);
    setError(null);

    try {
      const data = await imageManagementService.getPropertyGallery(propertyId, page, 12);
      setGalleryData(data);
      setImages(data.gallery.images);
    } catch (err) {
      console.error('Error fetching gallery:', err);
      setError(err instanceof Error ? err.message : 'Failed to load images');
    } finally {
      setIsLoading(false);
    }
  }, [propertyId, initialImages]);

  useEffect(() => {
    if (!initialImages) {
      fetchGalleryData(currentPage);
    }
  }, [fetchGalleryData, currentPage, initialImages]);

  // ===========================
  // LIGHTBOX HANDLERS
  // ===========================

  const openLightbox = useCallback((index: number) => {
    if (enableLightbox) {
      setLightbox({
        isOpen: true,
        currentIndex: index,
        images
      });
    }
  }, [enableLightbox, images]);

  const closeLightbox = useCallback(() => {
    setLightbox(prev => ({ ...prev, isOpen: false }));
  }, []);

  const nextImage = useCallback(() => {
    setLightbox(prev => ({
      ...prev,
      currentIndex: (prev.currentIndex + 1) % prev.images.length
    }));
  }, []);

  const prevImage = useCallback(() => {
    setLightbox(prev => ({
      ...prev,
      currentIndex: prev.currentIndex === 0 ? prev.images.length - 1 : prev.currentIndex - 1
    }));
  }, []);

  // ===========================
  // IMAGE HANDLERS
  // ===========================

  const handleImageClick = useCallback((image: PropertyImage, index: number) => {
    if (onImageClick) {
      onImageClick(image, index);
    } else if (enableLightbox) {
      openLightbox(index);
    }
  }, [onImageClick, enableLightbox, openLightbox]);

  const handleDownload = useCallback(async (image: PropertyImage) => {
    if (onDownload) {
      onDownload(image);
      return;
    }

    try {
      const blob = await imageManagementService.downloadPropertyImage(
        propertyId,
        image.filename,
        true // Watermarked for client portal
      );
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = image.originalName || image.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download error:', err);
      // Could show a toast notification here
    }
  }, [onDownload, propertyId]);

  // ===========================
  // KEYBOARD HANDLERS
  // ===========================

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!lightbox.isOpen) return;

      switch (e.key) {
        case 'Escape':
          closeLightbox();
          break;
        case 'ArrowRight':
          nextImage();
          break;
        case 'ArrowLeft':
          prevImage();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [lightbox.isOpen, closeLightbox, nextImage, prevImage]);

  // ===========================
  // RENDER HELPERS
  // ===========================

  const getGridClassName = () => {
    const gridClasses = {
      2: 'grid-cols-1 sm:grid-cols-2',
      3: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3',
      4: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4',
      5: 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5',
      6: 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6'
    };
    return gridClasses[gridCols];
  };

  const renderImageCard = (image: PropertyImage, index: number) => {
    const thumbnailUrl = imageManagementService.getThumbnailUrl(image);
    const isPrimary = imageManagementService.isPrimaryImage(image);
    const dimensions = imageManagementService.getImageDimensions(image);

    return (
      <div
        key={image.filename}
        className="group relative bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 border border-gray-200"
      >
        {/* Primary Badge */}
        {isPrimary && (
          <div className="absolute top-2 left-2 z-10">
            <div className="bg-yellow-500 text-white text-xs font-medium px-2 py-1 rounded-full flex items-center">
              <Star className="w-3 h-3 mr-1" />
              Primary
            </div>
          </div>
        )}

        {/* Image */}
        <div 
          className="aspect-square bg-gray-100 cursor-pointer overflow-hidden"
          onClick={() => handleImageClick(image, index)}
        >
          <img
            src={thumbnailUrl}
            alt={image.originalName || `Property image ${index + 1}`}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
            loading="lazy"
          />
          
          {/* Hover Overlay */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-200 flex items-center justify-center">
            <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              {enableLightbox && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    openLightbox(index);
                  }}
                  className="bg-white/90 hover:bg-white text-gray-800 rounded-full p-2 mr-2 transition-colors"
                  title="View full size"
                >
                  <ZoomIn className="w-5 h-5" />
                </button>
              )}
              
              {showDownload && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDownload(image);
                  }}
                  className="bg-white/90 hover:bg-white text-gray-800 rounded-full p-2 transition-colors"
                  title="Download image"
                >
                  <Download className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Image Info */}
        {showMetadata && (
          <div className="p-3">
            <div className="text-sm font-medium text-gray-900 truncate">
              {image.originalName || image.filename}
            </div>
            
            <div className="mt-1 space-y-1">
              {image.size && (
                <div className="text-xs text-gray-600">
                  {imageManagementService.formatFileSize(image.size)}
                </div>
              )}
              
              {dimensions && (
                <div className="text-xs text-gray-600">
                  {dimensions}
                </div>
              )}
              
              {image.uploadedAt && (
                <div className="text-xs text-gray-500 flex items-center">
                  <Calendar className="w-3 h-3 mr-1" />
                  {new Date(image.uploadedAt).toLocaleDateString()}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderLightbox = () => {
    if (!lightbox.isOpen || lightbox.images.length === 0) return null;

    const currentImage = lightbox.images[lightbox.currentIndex];
    const fullImageUrl = imageManagementService.getFullImageUrl(currentImage);

    return (
      <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center">
        {/* Close Button */}
        <button
          onClick={closeLightbox}
          className="absolute top-4 right-4 z-10 bg-white/20 hover:bg-white/30 text-white rounded-full p-2 transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Navigation Buttons */}
        {lightbox.images.length > 1 && (
          <>
            <button
              onClick={prevImage}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-10 bg-white/20 hover:bg-white/30 text-white rounded-full p-2 transition-colors"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            
            <button
              onClick={nextImage}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-10 bg-white/20 hover:bg-white/30 text-white rounded-full p-2 transition-colors"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </>
        )}

        {/* Image */}
        <div className="max-w-full max-h-full p-4">
          <img
            src={fullImageUrl}
            alt={currentImage.originalName || `Property image ${lightbox.currentIndex + 1}`}
            className="max-w-full max-h-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>

        {/* Image Info */}
        <div className="absolute bottom-4 left-4 right-4 bg-black/50 text-white p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">
                {currentImage.originalName || currentImage.filename}
              </div>
              <div className="text-sm text-gray-300">
                {lightbox.currentIndex + 1} of {lightbox.images.length}
              </div>
            </div>
            
            {showDownload && (
              <button
                onClick={() => handleDownload(currentImage)}
                className="bg-white/20 hover:bg-white/30 rounded-full p-2 transition-colors"
                title="Download image"
              >
                <Download className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderPagination = () => {
    if (!galleryData?.gallery.pagination || galleryData.gallery.pagination.totalPages <= 1) {
      return null;
    }

    const { page, totalPages, hasPrev, hasNext } = galleryData.gallery.pagination;

    return (
      <div className="flex items-center justify-between mt-6">
        <div className="text-sm text-gray-600">
          Page {page} of {totalPages}
        </div>
        
        <div className="flex space-x-2">
          <button
            onClick={() => setCurrentPage(page - 1)}
            disabled={!hasPrev}
            className="px-3 py-2 text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Previous
          </button>
          
          <button
            onClick={() => setCurrentPage(page + 1)}
            disabled={!hasNext}
            className="px-3 py-2 text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Next
          </button>
        </div>
      </div>
    );
  };

  // ===========================
  // MAIN RENDER
  // ===========================

  if (isLoading) {
    return (
      <div className={`property-image-gallery ${className}`}>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <FileImage className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <div className="text-gray-600">Loading images...</div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`property-image-gallery ${className}`}>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <FileImage className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <div className="text-red-600 mb-2">Failed to load images</div>
            <div className="text-gray-600 text-sm">{error}</div>
          </div>
        </div>
      </div>
    );
  }

  if (images.length === 0) {
    return (
      <div className={`property-image-gallery ${className}`}>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Image className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <div className="text-gray-600 mb-2">No images available</div>
            <div className="text-gray-500 text-sm">
              Property images will appear here once uploaded
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`property-image-gallery ${className}`}>
      {/* Header */}
      {galleryData?.property && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900">
            {galleryData.property.name} - Property Images
          </h3>
          <p className="text-sm text-gray-600">
            {galleryData.metadata.totalImages} image{galleryData.metadata.totalImages !== 1 ? 's' : ''}
            {galleryData.metadata.lastUpdated && (
              <span className="ml-2">
                • Last updated {new Date(galleryData.metadata.lastUpdated).toLocaleDateString()}
              </span>
            )}
          </p>
        </div>
      )}

      {/* View Controls */}
      <div className="flex items-center justify-between mb-4">
        <div className="text-sm text-gray-600">
          {images.length} image{images.length !== 1 ? 's' : ''}
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded ${viewMode === 'grid' ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:bg-gray-100'}`}
            title="Grid view"
          >
            <Grid className="w-4 h-4" />
          </button>
          
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded ${viewMode === 'list' ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:bg-gray-100'}`}
            title="List view"
          >
            <Eye className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Image Grid */}
      <div className={`grid gap-4 ${getGridClassName()}`}>
        {images.map(renderImageCard)}
      </div>

      {/* Pagination */}
      {renderPagination()}

      {/* Lightbox */}
      {renderLightbox()}
    </div>
  );
};

export default PropertyImageGallery;
