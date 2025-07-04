/**
 * Media File Card Component - Individual File Display Component
 * Extracted from MediaManagementSystem for better modularity
 * Production-ready component with grid/list view support
 */

import React, { useCallback, useMemo } from 'react';
import styled, { css } from 'styled-components';
import { 
  Eye, Pencil, Link, Trash2, Check, Play, FileText, Volume2, File,
  Image as ImageIcon, Video, Clock, Calendar, HardDrive
} from 'lucide-react';
import { MediaFile } from '../../../types/reports';
import { 
  VIEW_MODES,
  MEDIA_TYPES,
  ViewModeType,
  BREAKPOINTS
} from '../constants/mediaConstants';
import { 
  fileSizeUtils,
  dateUtils,
  fileTypeUtils
} from '../utils/mediaUtils';

/**
 * Component interfaces
 */
export interface MediaFileCardProps {
  file: MediaFile;
  viewMode: ViewModeType;
  isSelected: boolean;
  onToggleSelection: (fileId: string) => void;
  onPreview: (file: MediaFile) => void;
  onEdit: (file: MediaFile) => void;
  onShare: (file: MediaFile) => void;
  onDelete: (fileId: string) => void;
  showActions?: boolean;
  showMetadata?: boolean;
  className?: string;
}

/**
 * Styled Components
 */
const CardContainer = styled.div<{ $viewMode: ViewModeType; $selected: boolean }>`
  background: rgba(30, 30, 35, 0.7);
  border: 1px solid ${props => props.$selected ? '#FFD700' : 'rgba(238, 232, 170, 0.2)'};
  border-radius: 8px;
  padding: ${props => props.$viewMode === VIEW_MODES.GRID ? '1rem' : '0.75rem'};
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
  display: ${props => props.$viewMode === VIEW_MODES.GRID ? 'block' : 'flex'};
  align-items: ${props => props.$viewMode === VIEW_MODES.LIST ? 'center' : 'stretch'};
  gap: ${props => props.$viewMode === VIEW_MODES.LIST ? '1rem' : '0'};
  backdrop-filter: blur(10px);
  
  &:hover {
    border-color: #FFD700;
    box-shadow: 0 2px 8px rgba(255, 215, 0, 0.2);
    transform: translateY(-2px);
  }

  &:active {
    transform: translateY(0);
  }

  @media (max-width: ${BREAKPOINTS.mobile}) {
    padding: ${props => props.$viewMode === VIEW_MODES.GRID ? '0.75rem' : '0.5rem'};
    gap: ${props => props.$viewMode === VIEW_MODES.LIST ? '0.75rem' : '0'};
  }
`;

const SelectionBox = styled.div<{ $selected: boolean }>`
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  width: 20px;
  height: 20px;
  border: 2px solid ${props => props.$selected ? '#FFD700' : '#777'};
  background: ${props => props.$selected ? '#FFD700' : 'transparent'};
  border-radius: 3px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  z-index: 10;
  
  &:hover {
    border-color: #FFD700;
    background: ${props => props.$selected ? '#FFA500' : 'rgba(255, 215, 0, 0.1)'};
  }

  @media (max-width: ${BREAKPOINTS.mobile}) {
    width: 18px;
    height: 18px;
    top: 0.25rem;
    right: 0.25rem;
  }
`;

const FilePreview = styled.div<{ $viewMode: ViewModeType }>`
  ${props => props.$viewMode === VIEW_MODES.GRID ? css`
    aspect-ratio: 1;
    margin-bottom: 0.75rem;
  ` : css`
    width: 48px;
    height: 48px;
    flex-shrink: 0;
  `}
  
  background: rgba(20, 20, 25, 0.8);
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  position: relative;
  color: #777;
  border: 1px solid rgba(255, 255, 255, 0.1);
  
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.3s ease;
  }

  &:hover img {
    transform: scale(1.05);
  }

  @media (max-width: ${BREAKPOINTS.mobile}) {
    ${props => props.$viewMode === VIEW_MODES.LIST && css`
      width: 40px;
      height: 40px;
    `}
  }
`;

const PlayOverlay = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(0, 0, 0, 0.7);
  border-radius: 50%;
  padding: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  
  &:hover {
    background: rgba(0, 0, 0, 0.9);
    transform: translate(-50%, -50%) scale(1.1);
  }
`;

const FileIcon = styled.div<{ $size?: number }>`
  color: #777;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  font-size: ${props => props.$size || 24}px;
  transition: color 0.2s ease;

  &:hover {
    color: #FFD700;
  }
`;

const CardContent = styled.div<{ $viewMode: ViewModeType }>`
  display: flex;
  ${props => props.$viewMode === VIEW_MODES.GRID ? css`
    flex-direction: column;
    gap: 0.5rem;
  ` : css`
    flex: 1;
    justify-content: space-between;
    align-items: center;
    gap: 1rem;
  `}

  @media (max-width: ${BREAKPOINTS.mobile}) {
    gap: ${props => props.$viewMode === VIEW_MODES.LIST ? '0.5rem' : '0.25rem'};
  }
`;

const FileInfo = styled.div<{ $viewMode: ViewModeType }>`
  ${props => props.$viewMode === VIEW_MODES.LIST ? 'flex: 1;' : ''}
  min-width: 0; // Allow text truncation
`;

const FileName = styled.div<{ $viewMode: ViewModeType }>`
  color: #F0E6D2;
  font-weight: 500;
  font-size: ${props => props.$viewMode === VIEW_MODES.GRID ? '0.9rem' : '1rem'};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-bottom: ${props => props.$viewMode === VIEW_MODES.GRID ? '0.25rem' : '0'};
  transition: color 0.2s ease;

  &:hover {
    color: #FFD700;
  }

  @media (max-width: ${BREAKPOINTS.mobile}) {
    font-size: 0.85rem;
  }
`;

const FileDetails = styled.div<{ $viewMode: ViewModeType }>`
  display: flex;
  ${props => props.$viewMode === VIEW_MODES.GRID ? css`
    flex-direction: column;
    gap: 0.125rem;
  ` : css`
    gap: 1rem;
    align-items: center;
  `}

  @media (max-width: ${BREAKPOINTS.tablet}) {
    ${props => props.$viewMode === VIEW_MODES.LIST && css`
      flex-direction: column;
      gap: 0.25rem;
      align-items: flex-start;
    `}
  }

  @media (max-width: ${BREAKPOINTS.mobile}) {
    gap: ${props => props.$viewMode === VIEW_MODES.LIST ? '0.25rem' : '0.125rem'};
  }
`;

const DetailItem = styled.span<{ $highlight?: boolean }>`
  color: ${props => props.$highlight ? '#FFD700' : '#777'};
  font-size: 0.8rem;
  display: flex;
  align-items: center;
  gap: 0.25rem;
  transition: color 0.2s ease;

  &:hover {
    color: ${props => props.$highlight ? '#FFA500' : '#999'};
  }

  @media (max-width: ${BREAKPOINTS.mobile}) {
    font-size: 0.75rem;
  }
`;

const TagsContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
  margin-top: 0.25rem;
`;

const Tag = styled.span`
  background: rgba(255, 215, 0, 0.1);
  color: #FFD700;
  padding: 0.125rem 0.375rem;
  border-radius: 4px;
  font-size: 0.7rem;
  border: 1px solid rgba(255, 215, 0, 0.3);
  transition: all 0.2s ease;

  &:hover {
    background: rgba(255, 215, 0, 0.2);
    border-color: rgba(255, 215, 0, 0.5);
  }
`;

const ExpiryWarning = styled.div<{ $expired: boolean }>`
  color: ${props => props.$expired ? '#ef4444' : '#f59e0b'};
  font-size: 0.75rem;
  display: flex;
  align-items: center;
  gap: 0.25rem;
  margin-top: 0.25rem;
  font-weight: 500;
`;

const ActionsContainer = styled.div<{ $viewMode: ViewModeType }>`
  display: flex;
  gap: 0.25rem;
  ${props => props.$viewMode === VIEW_MODES.GRID ? css`
    margin-top: 0.5rem;
    justify-content: center;
  ` : css`
    flex-shrink: 0;
  `}

  @media (max-width: ${BREAKPOINTS.mobile}) {
    gap: 0.125rem;
  }
`;

const ActionButton = styled.button<{ $variant?: 'primary' | 'secondary' | 'danger' }>`
  background: ${props => {
    switch (props.$variant) {
      case 'danger': return 'rgba(239, 68, 68, 0.1)';
      case 'primary': return 'rgba(255, 215, 0, 0.1)';
      default: return 'rgba(255, 255, 255, 0.05)';
    }
  }};
  border: 1px solid ${props => {
    switch (props.$variant) {
      case 'danger': return 'rgba(239, 68, 68, 0.3)';
      case 'primary': return 'rgba(255, 215, 0, 0.3)';
      default: return 'rgba(255, 255, 255, 0.1)';
    }
  }};
  color: ${props => {
    switch (props.$variant) {
      case 'danger': return '#ef4444';
      case 'primary': return '#FFD700';
      default: return '#777';
    }
  }};
  cursor: pointer;
  padding: 0.375rem;
  border-radius: 4px;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 32px;
  height: 32px;
  
  &:hover {
    background: ${props => {
      switch (props.$variant) {
        case 'danger': return 'rgba(239, 68, 68, 0.2)';
        case 'primary': return 'rgba(255, 215, 0, 0.2)';
        default: return 'rgba(255, 255, 255, 0.1)';
      }
    }};
    border-color: ${props => {
      switch (props.$variant) {
        case 'danger': return 'rgba(239, 68, 68, 0.5)';
        case 'primary': return 'rgba(255, 215, 0, 0.5)';
        default: return 'rgba(255, 255, 255, 0.2)';
      }
    }};
    transform: translateY(-1px);
  }

  &:active {
    transform: translateY(0);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }

  @media (max-width: ${BREAKPOINTS.mobile}) {
    padding: 0.25rem;
    min-width: 28px;
    height: 28px;
  }
`;

/**
 * MediaFileCard Component
 */
export const MediaFileCard: React.FC<MediaFileCardProps> = ({
  file,
  viewMode,
  isSelected,
  onToggleSelection,
  onPreview,
  onEdit,
  onShare,
  onDelete,
  showActions = true,
  showMetadata = true,
  className
}) => {
  // Memoized computations
  const fileIcon = useMemo(() => {
    const iconSize = viewMode === VIEW_MODES.GRID ? 24 : 20;
    
    switch (file.type) {
      case MEDIA_TYPES.IMAGE:
        return <ImageIcon size={iconSize} />;
      case MEDIA_TYPES.VIDEO:
        return <Video size={iconSize} />;
      case MEDIA_TYPES.AUDIO:
        return <Volume2 size={iconSize} />;
      case MEDIA_TYPES.DOCUMENT:
        return <FileText size={iconSize} />;
      default:
        return <File size={iconSize} />;
    }
  }, [file.type, viewMode]);

  const isExpired = useMemo(() => {
    return file.expiryDate ? dateUtils.isExpired(file.expiryDate) : false;
  }, [file.expiryDate]);

  const showPlayOverlay = useMemo(() => {
    return file.type === MEDIA_TYPES.VIDEO;
  }, [file.type]);

  const canShare = useMemo(() => {
    return file.type === MEDIA_TYPES.VIDEO || !!file.shareLink;
  }, [file.type, file.shareLink]);

  // Event handlers
  const handleCardClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    onToggleSelection(file.id);
  }, [file.id, onToggleSelection]);

  const handleSelectionClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleSelection(file.id);
  }, [file.id, onToggleSelection]);

  const handlePreview = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onPreview(file);
  }, [file, onPreview]);

  const handleEdit = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit(file);
  }, [file, onEdit]);

  const handleShare = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onShare(file);
  }, [file, onShare]);

  const handleDelete = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(file.id);
  }, [file.id, onDelete]);

  // Render preview content
  const renderPreview = () => (
    <FilePreview $viewMode={viewMode}>
      {file.type === MEDIA_TYPES.IMAGE && file.thumbnail ? (
        <img src={file.thumbnail} alt={file.name} loading=\"lazy\" />
      ) : file.type === MEDIA_TYPES.VIDEO && file.thumbnail ? (
        <>
          <img src={file.thumbnail} alt={file.name} loading=\"lazy\" />
          {showPlayOverlay && (
            <PlayOverlay>
              <Play size={16} color=\"white\" fill=\"white\" />
            </PlayOverlay>
          )}
        </>
      ) : (
        <FileIcon>
          {fileIcon}
        </FileIcon>
      )}
    </FilePreview>
  );

  // Render file details
  const renderDetails = () => (
    <FileDetails $viewMode={viewMode}>
      <DetailItem>
        <HardDrive size={12} />
        {fileSizeUtils.formatFileSize(file.size)}
      </DetailItem>
      <DetailItem>
        <Calendar size={12} />
        {dateUtils.formatDateSafe(file.dateCreated)}
      </DetailItem>
      {file.expiryDate && (
        <DetailItem $highlight={isExpired}>
          <Clock size={12} />
          {isExpired ? 'Expired' : 'Expires'}: {dateUtils.formatDateSafe(file.expiryDate)}
        </DetailItem>
      )}
    </FileDetails>
  );

  // Render tags
  const renderTags = () => {
    if (!file.tags || file.tags.length === 0) return null;
    
    return (
      <TagsContainer>
        {file.tags.slice(0, 3).map((tag, index) => (
          <Tag key={index}>{tag}</Tag>
        ))}
        {file.tags.length > 3 && (
          <Tag>+{file.tags.length - 3}</Tag>
        )}
      </TagsContainer>
    );
  };

  // Render actions
  const renderActions = () => {
    if (!showActions) return null;

    return (
      <ActionsContainer $viewMode={viewMode}>
        <ActionButton
          $variant=\"primary\"
          onClick={handlePreview}
          title=\"Preview file\"
        >
          <Eye size={14} />
        </ActionButton>
        <ActionButton
          onClick={handleEdit}
          title=\"Edit file details\"
        >
          <Pencil size={14} />
        </ActionButton>
        {canShare && (
          <ActionButton
            onClick={handleShare}
            title=\"Share file\"
          >
            <Link size={14} />
          </ActionButton>
        )}
        <ActionButton
          $variant=\"danger\"
          onClick={handleDelete}
          title=\"Delete file\"
        >
          <Trash2 size={14} />
        </ActionButton>
      </ActionsContainer>
    );
  };

  return (
    <CardContainer
      $viewMode={viewMode}
      $selected={isSelected}
      onClick={handleCardClick}
      className={className}
    >
      <SelectionBox $selected={isSelected} onClick={handleSelectionClick}>
        {isSelected && <Check size={12} />}
      </SelectionBox>

      {renderPreview()}

      <CardContent $viewMode={viewMode}>
        <FileInfo $viewMode={viewMode}>
          <FileName $viewMode={viewMode} title={file.name}>
            {file.name}
          </FileName>
          
          {showMetadata && renderDetails()}
          
          {showMetadata && renderTags()}
          
          {isExpired && (
            <ExpiryWarning $expired={isExpired}>
              <Clock size={12} />
              File has expired
            </ExpiryWarning>
          )}
        </FileInfo>

        {renderActions()}
      </CardContent>
    </CardContainer>
  );
};

export default MediaFileCard;

/**
 * MEDIA FILE CARD COMPLETION SUMMARY:
 * ✅ Grid and list view support with responsive design
 * ✅ File type detection with appropriate icons
 * ✅ Thumbnail display for images and videos
 * ✅ Selection state with visual feedback
 * ✅ File metadata display (size, date, expiry)
 * ✅ Tags display with overflow handling
 * ✅ Action buttons with proper event handling
 * ✅ Expiry warnings and visual indicators
 * ✅ Mobile-responsive design
 * ✅ Accessibility considerations
 * ✅ Performance optimizations with memoization
 * 
 * This component provides a complete file card implementation that can be
 * used in both grid and list layouts with full feature support.
 */
