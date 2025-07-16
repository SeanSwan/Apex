/**
 * Media Gallery Component - Media and Video Evidence Display
 * Extracted from EnhancedPreviewPanel for better modularity
 * Production-ready component for media evidence rendering
 */

import React, { useState, useCallback } from 'react';
import styled from 'styled-components';
import { format } from 'date-fns';
import { 
  getRandomTexturePosition, 
  getRandomOpacity,
  getRandomTextureSize,
  MARBLE_TEXTURE_CONFIG,
  RESPONSIVE_BREAKPOINTS,
  GRID_CONFIG,
  COMPONENT_CONFIG,
  DATE_FORMAT_PATTERNS
} from '../constants/previewPanelConstants';
import { MediaFile, VideoLink } from '../../../types/reports';
import marbleTexture from '../../../assets/marble-texture.png';

/**
 * Media Gallery Props Interface
 */
export interface MediaGalleryProps {
  mediaFiles?: MediaFile[];
  videoLinks?: VideoLink[];
  accentColor?: string;
  className?: string;
  showThumbnails?: boolean;
  allowFullscreen?: boolean;
  isCompact?: boolean;
  onMediaClick?: (media: MediaFile, index: number) => void;
  onVideoClick?: (video: VideoLink, index: number) => void;
}

/**
 * Media Item Props Interface
 */
export interface MediaItemProps {
  media: MediaFile;
  index: number;
  accentColor?: string;
  showOverlay?: boolean;
  isCompact?: boolean;
  onClick?: (media: MediaFile, index: number) => void;
}

/**
 * Video Link Props Interface
 */
export interface VideoLinkItemProps {
  video: VideoLink;
  index: number;
  accentColor?: string;
  isCompact?: boolean;
  onClick?: (video: VideoLink, index: number) => void;
}

/**
 * Chart Image Props Interface
 */
export interface ChartImageProps {
  chartDataURL?: string;
  accentColor?: string;
  isCompact?: boolean;
  onChartClick?: () => void;
}

/**
 * Styled Components
 */
const MediaSection = styled.div<{ $isCompact?: boolean }>`
  margin-bottom: ${props => props.$isCompact ? '1.5rem' : '2rem'};
`;

const SectionHeader = styled.h2<{ $accentColor?: string; $isCompact?: boolean }>`
  color: ${props => props.$accentColor || '#e5c76b'};
  margin-bottom: ${props => props.$isCompact ? '1rem' : '1.25rem'};
  padding-bottom: 0.5rem;
  border-bottom: 2px solid ${props => props.$accentColor || '#e5c76b'};
  font-weight: 600;
  font-size: ${props => props.$isCompact ? '1.125rem' : '1.25rem'};
  display: flex;
  align-items: center;
  gap: 0.5rem;

  @media (max-width: ${RESPONSIVE_BREAKPOINTS.MOBILE}px) {
    font-size: ${props => props.$isCompact ? '1rem' : '1.125rem'};
  }
`;

const MediaGrid = styled.div<{ $isCompact?: boolean }>`
  display: grid;
  grid-template-columns: ${GRID_CONFIG.MEDIA.COLUMNS.DESKTOP};
  gap: ${props => props.$isCompact ? GRID_CONFIG.MEDIA.GAP.MOBILE : GRID_CONFIG.MEDIA.GAP.DESKTOP};
  margin-top: 1rem;

  @media (max-width: ${RESPONSIVE_BREAKPOINTS.TABLET}px) {
    grid-template-columns: ${GRID_CONFIG.MEDIA.COLUMNS.TABLET};
  }

  @media (max-width: ${RESPONSIVE_BREAKPOINTS.MOBILE}px) {
    grid-template-columns: ${GRID_CONFIG.MEDIA.COLUMNS.MOBILE};
    gap: ${GRID_CONFIG.MEDIA.GAP.MOBILE};
  }
`;

const MediaItem = styled.div<{ 
  $isClickable?: boolean; 
  $isCompact?: boolean;
}>`
  position: relative;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
  height: ${props => props.$isCompact ? COMPONENT_CONFIG.MEDIA_ITEM.HEIGHT.MOBILE : COMPONENT_CONFIG.MEDIA_ITEM.HEIGHT.DESKTOP};
  background-color: transparent;
  background-image: url(${marbleTexture});
  background-size: ${getRandomTextureSize()};
  background-position: ${getRandomTexturePosition()};
  cursor: ${props => props.$isClickable ? 'pointer' : 'default'};
  transition: transform 0.3s ease, box-shadow 0.3s ease;

  &:hover {
    transform: ${props => props.$isClickable ? 'scale(1.02)' : 'none'};
    box-shadow: ${props => props.$isClickable ? '0 6px 20px rgba(0, 0, 0, 0.4)' : '0 4px 6px rgba(0, 0, 0, 0.3)'};
  }

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, ${getRandomOpacity()});
    z-index: 0;
    border-radius: 8px;
  }

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    position: relative;
    z-index: 1;
    transition: opacity 0.3s ease;
  }

  .overlay {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    background: linear-gradient(transparent, rgba(0, 0, 0, 0.9));
    color: #e5c76b;
    padding: 1rem 0.75rem 0.75rem;
    font-size: 0.75rem;
    opacity: 0;
    transition: opacity 0.3s ease;
    z-index: 2;
    transform: translateY(100%);
    transition: transform 0.3s ease, opacity 0.3s ease;
  }

  &:hover .overlay {
    opacity: 1;
    transform: translateY(0);
  }

  @media (max-width: ${RESPONSIVE_BREAKPOINTS.MOBILE}px) {
    height: ${COMPONENT_CONFIG.MEDIA_ITEM.HEIGHT.MOBILE};
    
    .overlay {
      padding: 0.5rem;
      font-size: 0.7rem;
    }
  }
`;

const MediaPlaceholder = styled.div<{ $isCompact?: boolean }>`
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.2);
  color: #999;
  font-size: ${props => props.$isCompact ? '0.875rem' : '1rem'};
  text-align: center;
  padding: 1rem;
  position: relative;
  z-index: 1;

  &::before {
    content: '🖼️';
    display: block;
    font-size: ${props => props.$isCompact ? '2rem' : '3rem'};
    margin-bottom: 0.5rem;
  }
`;

const VideoLinksContainer = styled.div<{ $isCompact?: boolean }>`
  margin-top: ${props => props.$isCompact ? '1rem' : '1.5rem'};
`;

const VideoLinkItem = styled.div<{ $isCompact?: boolean; $isClickable?: boolean }>`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: ${props => props.$isCompact ? '0.5rem' : '0.75rem'};
  background-color: transparent;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.2);
  margin-bottom: ${props => props.$isCompact ? '0.5rem' : '0.75rem'};
  background-image: url(${marbleTexture});
  background-size: ${getRandomTextureSize()};
  background-position: ${getRandomTexturePosition()};
  position: relative;
  cursor: ${props => props.$isClickable ? 'pointer' : 'default'};
  transition: transform 0.2s ease, box-shadow 0.2s ease;

  &:hover {
    transform: ${props => props.$isClickable ? 'translateX(4px)' : 'none'};
    box-shadow: ${props => props.$isClickable ? '0 6px 12px rgba(0, 0, 0, 0.3)' : '0 4px 6px rgba(0, 0, 0, 0.2)'};
  }

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, ${getRandomOpacity()});
    z-index: 0;
    border-radius: 8px;
  }

  .link-info {
    flex: 1;
    position: relative;
    z-index: 1;
  }

  .link-title {
    font-weight: 600;
    font-size: ${props => props.$isCompact ? '0.8rem' : '0.875rem'};
    color: #e0e0e0;
    margin-bottom: 0.25rem;
  }

  .link-expiry {
    font-size: ${props => props.$isCompact ? '0.7rem' : '0.75rem'};
    color: #9e9e9e;
  }

  .badge {
    padding: 0.25rem 0.5rem;
    border-radius: 999px;
    font-size: ${props => props.$isCompact ? '0.7rem' : '0.75rem'};
    font-weight: 500;
    position: relative;
    z-index: 1;
    
    &.active {
      background-color: rgba(209, 250, 229, 0.2);
      color: #2ecc71;
    }

    &.expired {
      background-color: rgba(254, 202, 202, 0.2);
      color: #e74c3c;
    }
  }
`;

const ChartImageContainer = styled.div<{ $isCompact?: boolean; $isClickable?: boolean }>`
  margin: ${props => props.$isCompact ? '1rem 0' : '1.5rem 0'};
  text-align: center;
  background-color: transparent;
  padding: ${props => props.$isCompact ? '0.75rem' : '1rem'};
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.2);
  background-image: url(${marbleTexture});
  background-size: 170%;
  background-position: 40% 20%;
  position: relative;
  cursor: ${props => props.$isClickable ? 'pointer' : 'default'};
  transition: transform 0.3s ease, box-shadow 0.3s ease;

  &:hover {
    transform: ${props => props.$isClickable ? 'scale(1.01)' : 'none'};
    box-shadow: ${props => props.$isClickable ? '0 6px 16px rgba(0, 0, 0, 0.3)' : '0 4px 6px rgba(0, 0, 0, 0.2)'};
  }

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.62);
    z-index: 0;
    border-radius: 8px;
  }

  img {
    max-width: 100%;
    border-radius: 4px;
    position: relative;
    z-index: 1;
    box-shadow: 0 3px 6px rgba(0, 0, 0, 0.2);
    transition: transform 0.3s ease;
  }

  &:hover img {
    transform: ${props => props.$isClickable ? 'scale(1.02)' : 'none'};
  }
`;

const ChartPlaceholder = styled.div<{ $isCompact?: boolean }>`
  padding: ${props => props.$isCompact ? '1.5rem' : '2rem'};
  text-align: center;
  color: #999;
  position: relative;
  z-index: 1;

  p {
    margin: 0.5rem 0;
    font-size: ${props => props.$isCompact ? '0.875rem' : '1rem'};
  }

  .icon {
    font-size: ${props => props.$isCompact ? '2rem' : '3rem'};
    margin-bottom: 0.5rem;
    display: block;
  }

  .details {
    font-size: ${props => props.$isCompact ? '0.7rem' : '0.8rem'};
    color: #666;
    margin-top: 0.5rem;
  }
`;

const EmptyState = styled.div<{ $isCompact?: boolean }>`
  text-align: center;
  padding: ${props => props.$isCompact ? '2rem 1rem' : '3rem 2rem'};
  color: #999;
  
  .icon {
    font-size: ${props => props.$isCompact ? '2.5rem' : '4rem'};
    margin-bottom: 1rem;
    display: block;
    opacity: 0.5;
  }
  
  .message {
    font-size: ${props => props.$isCompact ? '0.875rem' : '1rem'};
    margin-bottom: 0.5rem;
  }
  
  .subtitle {
    font-size: ${props => props.$isCompact ? '0.75rem' : '0.875rem'};
    color: #666;
  }
`;

/**
 * Media Item Component
 */
export const MediaItemComponent: React.FC<MediaItemProps> = ({
  media,
  index,
  accentColor = '#e5c76b',
  showOverlay = true,
  isCompact = false,
  onClick
}) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const handleClick = () => {
    if (onClick) {
      onClick(media, index);
    }
  };

  const handleImageError = () => {
    setImageError(true);
  };

  const handleImageLoad = () => {
    setImageLoaded(true);
  };

  return (
    <MediaItem 
      $isClickable={!!onClick} 
      $isCompact={isCompact}
      onClick={handleClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      } : undefined}
    >
      {imageError ? (
        <MediaPlaceholder $isCompact={isCompact}>
          <div>
            <div>Image failed to load</div>
            <div style={{ fontSize: '0.7rem', marginTop: '0.5rem' }}>
              {media.name}
            </div>
          </div>
        </MediaPlaceholder>
      ) : (
        <img 
          src={media.thumbnail || media.url} 
          alt={media.name}
          onError={handleImageError}
          onLoad={handleImageLoad}
          style={{ opacity: imageLoaded ? 1 : 0.5 }}
        />
      )}
      
      {showOverlay && !imageError && (
        <div className="overlay">
          <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>
            {media.name}
          </div>
          {media.description && (
            <div style={{ fontSize: '0.7rem', opacity: 0.9 }}>
              {media.description}
            </div>
          )}
          {media.timestamp && (
            <div style={{ fontSize: '0.65rem', marginTop: '0.25rem', opacity: 0.8 }}>
              {format(new Date(media.timestamp), DATE_FORMAT_PATTERNS.DISPLAY)}
            </div>
          )}
        </div>
      )}
    </MediaItem>
  );
};

/**
 * Video Link Component
 */
export const VideoLinkComponent: React.FC<VideoLinkItemProps> = ({
  video,
  index,
  accentColor = '#e5c76b',
  isCompact = false,
  onClick
}) => {
  const isActive = new Date(video.expiryDate) > new Date();

  const handleClick = () => {
    if (onClick) {
      onClick(video, index);
    }
  };

  const formatExpiryDate = (date: string | Date) => {
    try {
      return format(new Date(date), DATE_FORMAT_PATTERNS.DISPLAY);
    } catch {
      return 'Invalid Date';
    }
  };

  return (
    <VideoLinkItem 
      $isCompact={isCompact}
      $isClickable={!!onClick}
      onClick={handleClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      } : undefined}
    >
      <div className="link-info">
        <div className="link-title">
          🎥 {video.title}
        </div>
        <div className="link-expiry">
          {isActive
            ? `Accessible until: ${formatExpiryDate(video.expiryDate)}`
            : 'Access expired'}
        </div>
      </div>
      <div className={`badge ${isActive ? 'active' : 'expired'}`}>
        {isActive ? 'Active' : 'Expired'}
      </div>
    </VideoLinkItem>
  );
};

/**
 * Chart Image Component
 */
export const ChartImage: React.FC<ChartImageProps> = ({
  chartDataURL,
  accentColor = '#e5c76b',
  isCompact = false,
  onChartClick
}) => {
  const [chartError, setChartError] = useState(false);

  const handleChartError = () => {
    setChartError(true);
    console.error('❌ Chart image failed to load');
  };

  const handleChartLoad = () => {
    console.log('✅ Chart image loaded successfully');
  };

  const isValidChart = chartDataURL && chartDataURL.startsWith('data:image');

  return (
    <ChartImageContainer 
      $isCompact={isCompact}
      $isClickable={!!onChartClick}
      onClick={onChartClick}
    >
      {isValidChart && !chartError ? (
        <img 
          src={chartDataURL} 
          alt="Weekly Security Analytics" 
          onLoad={handleChartLoad}
          onError={handleChartError}
        />
      ) : (
        <ChartPlaceholder $isCompact={isCompact}>
          <span className="icon">
            {chartDataURL ? '❌' : '📈'}
          </span>
          <p>
            {chartDataURL ? (
              <>Chart data detected but invalid format</>
            ) : (
              <>Chart visualization will appear here</>
            )}
          </p>
          {chartDataURL && (
            <div className="details">
              Length: {chartDataURL.length} chars
            </div>
          )}
          {!chartDataURL && (
            <div className="details">
              Navigate to the Visualize tab to generate charts
            </div>
          )}
        </ChartPlaceholder>
      )}
    </ChartImageContainer>
  );
};

/**
 * Main Media Gallery Component
 */
export const MediaGallery: React.FC<MediaGalleryProps> = ({
  mediaFiles = [],
  videoLinks = [],
  accentColor = '#e5c76b',
  className,
  showThumbnails = true,
  allowFullscreen = true,
  isCompact = false,
  onMediaClick,
  onVideoClick
}) => {
  const hasMedia = mediaFiles.length > 0;
  const hasVideos = videoLinks.length > 0;

  if (!hasMedia && !hasVideos) {
    return null;
  }

  return (
    <div className={className}>
      {hasMedia && (
        <MediaSection $isCompact={isCompact}>
          <SectionHeader $accentColor={accentColor} $isCompact={isCompact}>
            📷 Media Evidence
          </SectionHeader>
          
          {mediaFiles.length > 0 ? (
            <MediaGrid $isCompact={isCompact}>
              {mediaFiles.map((media, index) => (
                <MediaItemComponent
                  key={index}
                  media={media}
                  index={index}
                  accentColor={accentColor}
                  showOverlay={showThumbnails}
                  isCompact={isCompact}
                  onClick={allowFullscreen ? onMediaClick : undefined}
                />
              ))}
            </MediaGrid>
          ) : (
            <EmptyState $isCompact={isCompact}>
              <span className="icon">📷</span>
              <div className="message">No media evidence available</div>
              <div className="subtitle">Media files will appear here when uploaded</div>
            </EmptyState>
          )}
        </MediaSection>
      )}

      {hasVideos && (
        <MediaSection $isCompact={isCompact}>
          <SectionHeader $accentColor={accentColor} $isCompact={isCompact}>
            🎥 Secured Video Evidence
          </SectionHeader>
          
          {videoLinks.length > 0 ? (
            <VideoLinksContainer $isCompact={isCompact}>
              {videoLinks.map((video, index) => (
                <VideoLinkComponent
                  key={index}
                  video={video}
                  index={index}
                  accentColor={accentColor}
                  isCompact={isCompact}
                  onClick={onVideoClick}
                />
              ))}
            </VideoLinksContainer>
          ) : (
            <EmptyState $isCompact={isCompact}>
              <span className="icon">🎥</span>
              <div className="message">No video evidence available</div>
              <div className="subtitle">Video links will appear here when added</div>
            </EmptyState>
          )}
        </MediaSection>
      )}
    </div>
  );
};

/**
 * Compact Media Gallery
 */
export const CompactMediaGallery: React.FC<Omit<MediaGalleryProps, 'isCompact'>> = (props) => (
  <MediaGallery {...props} isCompact={true} />
);

// Default export
export default MediaGallery;

// Components are already exported individually above with 'export const' declarations

export type {
  MediaGalleryProps,
  MediaItemProps,
  VideoLinkItemProps,
  ChartImageProps
};
