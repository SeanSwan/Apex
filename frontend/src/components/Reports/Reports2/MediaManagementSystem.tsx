// File: frontend/src/components/Reports2/MediaManagementSystem.tsx

import React, { useState, useRef, useCallback, useEffect } from 'react';
import styled from 'styled-components';
import { format } from 'date-fns';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../ui/tabs';
import {
  Camera,
  Image,
  Video,
  Upload,
  FileText,
  Trash2,
  Pencil,
  Download,
  Link,
  Eye,
  X,
  Calendar,
  Search,
  AlertTriangle,
  File,
  Grid,
  List,
  Filter,
  ChevronDown,
  MoreHorizontal,
  Clock,
  Play,
  Pause,
  Loader2,
  CheckCircle,
  FilePlus,
  RefreshCw,
  Lock,
  Unlock,
  Copy
} from 'lucide-react';

// Styled components with responsive design
const Section = styled.div`
  margin-bottom: 2rem;
`;

const SectionTitle = styled.h3`
  font-size: 1.25rem;
  margin-bottom: 1rem;
  color: #333;
  font-weight: 600;
  border-bottom: 2px solid #f0f0f0;
  padding-bottom: 0.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  
  @media (max-width: 640px) {
    font-size: 1.125rem;
  }
`;

const TitleWithIcon = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const ViewModeButtons = styled.div`
  display: flex;
  gap: 0.25rem;
`;

const ViewModeButton = styled(Button)`
  padding: 0.375rem;
`;

const MediaTabs = styled(Tabs)`
  margin-bottom: 1rem;
`;

const MediaTabsList = styled(TabsList)`
  width: 100%;
  margin-bottom: 1rem;
`;

const MediaTabsTrigger = styled(TabsTrigger)`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  
  @media (max-width: 480px) {
    font-size: 0.75rem;
    
    svg {
      display: none;
    }
  }
`;

const FilterRow = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 1rem;
  flex-wrap: wrap;
  gap: 0.5rem;
  
  @media (max-width: 640px) {
    flex-direction: column;
  }
`;

const SearchInput = styled.div`
  position: relative;
  width: 300px;
  
  @media (max-width: 640px) {
    width: 100%;
  }
`;

const SearchIcon = styled.div`
  position: absolute;
  left: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  color: #9ca3af;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const Input = styled.input`
  padding: 0.625rem 0.75rem 0.625rem 2.25rem;
  width: 100%;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  font-size: 0.875rem;
  
  &:focus {
    outline: none;
    border-color: #0070f3;
    box-shadow: 0 0 0 2px rgba(0, 112, 243, 0.2);
  }
`;

const FilterDropdown = styled.div`
  position: relative;
  display: inline-block;
`;

const FilterButton = styled(Button)`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const FilterMenu = styled.div<{ open: boolean }>`
  position: absolute;
  right: 0;
  top: 100%;
  z-index: 10;
  width: 200px;
  background-color: white;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  padding: 0.5rem;
  margin-top: 0.5rem;
  display: ${props => props.open ? 'block' : 'none'};
`;

const FilterOption = styled.div`
  padding: 0.625rem 0.75rem;
  cursor: pointer;
  border-radius: 4px;
  font-size: 0.875rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  
  &:hover {
    background-color: #f3f4f6;
  }
`;

const DropZoneContainer = styled.div`
  border: 2px dashed #e5e7eb;
  border-radius: 8px;
  padding: 2rem;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s ease;
  background-color: #f9fafb;
  margin-bottom: 1.5rem;
  
  &:hover {
    border-color: #0070f3;
    background-color: #f0f7ff;
  }
  
  @media (max-width: 640px) {
    padding: 1.5rem;
  }
`;

const DropZoneIcon = styled.div`
  margin-bottom: 1rem;
  color: #6b7280;
  
  svg {
    width: 48px;
    height: 48px;
    margin: 0 auto;
  }
  
  @media (max-width: 640px) {
    margin-bottom: 0.75rem;
    
    svg {
      width: 36px;
      height: 36px;
    }
  }
`;

const DropZoneText = styled.div`
  margin-bottom: 0.5rem;
  font-weight: 500;
  font-size: 1rem;
  color: #374151;
  
  @media (max-width: 640px) {
    font-size: 0.875rem;
  }
`;

const DropZoneSubtext = styled.div`
  font-size: 0.875rem;
  color: #6b7280;
  
  @media (max-width: 640px) {
    font-size: 0.75rem;
  }
`;

const FilesContainer = styled.div<{ viewMode: 'grid' | 'list' }>`
  display: ${props => props.viewMode === 'grid' ? 'grid' : 'flex'};
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 1rem;
  flex-direction: ${props => props.viewMode === 'list' ? 'column' : 'row'};
  
  @media (max-width: 768px) {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  }
  
  @media (max-width: 480px) {
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  }
`;

const FileCard = styled.div<{ viewMode: 'grid' | 'list'; selected: boolean }>`
  border: 1px solid ${props => props.selected ? '#0070f3' : '#e5e7eb'};
  border-radius: 8px;
  overflow: hidden;
  box-shadow: ${props => props.selected ? '0 0 0 2px rgba(0, 112, 243, 0.2)' : 'none'};
  transition: all 0.2s ease;
  background-color: white;
  position: relative;
  
  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
  
  ${props => props.viewMode === 'list' && `
    display: flex;
    align-items: center;
    padding: 0.75rem;
    
    @media (max-width: 640px) {
      padding: 0.5rem;
    }
  `}
`;

const FilePreview = styled.div<{ viewMode: 'grid' | 'list' }>`
  position: relative;
  
  ${props => props.viewMode === 'grid' && `
    height: 120px;
    background-color: #f3f4f6;
    
    @media (max-width: 480px) {
      height: 100px;
    }
  `}
  
  ${props => props.viewMode === 'list' && `
    height: 60px;
    width: 60px;
    min-width: 60px;
    border-radius: 4px;
    overflow: hidden;
    background-color: #f3f4f6;
    margin-right: 1rem;
    
    @media (max-width: 640px) {
      height: 48px;
      width: 48px;
      min-width: 48px;
      margin-right: 0.75rem;
    }
  `}
  
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  
  svg {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    color: #6b7280;
  }
`;

const FileCardContent = styled.div<{ viewMode: 'grid' | 'list' }>`
  ${props => props.viewMode === 'grid' && `
    padding: 0.75rem;
    
    @media (max-width: 480px) {
      padding: 0.5rem;
    }
  `}
  
  ${props => props.viewMode === 'list' && `
    flex: 1;
    display: flex;
    justify-content: space-between;
    align-items: center;
    
    @media (max-width: 480px) {
      flex-direction: column;
      align-items: flex-start;
    }
  `}
`;

const FileInfo = styled.div<{ viewMode: 'grid' | 'list' }>`
  ${props => props.viewMode === 'list' && `
    flex: 1;
    
    @media (max-width: 480px) {
      width: 100%;
      margin-bottom: 0.5rem;
    }
  `}
`;

const FileName = styled.div<{ viewMode: 'grid' | 'list' }>`
  font-weight: 500;
  font-size: 0.875rem;
  margin-bottom: ${props => props.viewMode === 'grid' ? '0.25rem' : '0'};
  color: #111827;
  
  ${props => props.viewMode === 'grid' && `
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  `}
  
  @media (max-width: 480px) {
    font-size: 0.8125rem;
  }
`;

const FileDetails = styled.div<{ viewMode: 'grid' | 'list' }>`
  font-size: 0.75rem;
  color: #6b7280;
  
  ${props => props.viewMode === 'grid' && `
    margin-bottom: 0.25rem;
  `}
  
  @media (max-width: 480px) {
    font-size: 0.6875rem;
  }
`;

const FileActions = styled.div<{ viewMode: 'grid' | 'list' }>`
  display: flex;
  gap: 0.25rem;
  
  ${props => props.viewMode === 'list' && `
    @media (max-width: 480px) {
      width: 100%;
      justify-content: flex-end;
    }
  `}
`;

const IconButton = styled.button`
  background: none;
  border: none;
  color: #6b7280;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.25rem;
  border-radius: 4px;
  
  &:hover {
    background-color: #f3f4f6;
    color: #111827;
  }
`;

const SelectBox = styled.div<{ selected: boolean }>`
  position: absolute;
  top: 0.5rem;
  left: 0.5rem;
  z-index: 2;
  width: 20px;
  height: 20px;
  border: 2px solid ${props => props.selected ? '#0070f3' : 'white'};
  border-radius: 4px;
  background-color: ${props => props.selected ? '#0070f3' : 'rgba(255, 255, 255, 0.8)'};
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    border-color: #0070f3;
  }
`;

const TypeBadge = styled(Badge)<{ fileType: 'image' | 'video' | 'document' | 'audio' | 'other' }>`
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  font-size: 0.6875rem;
  text-transform: uppercase;
  
  background-color: ${props => {
    switch(props.fileType) {
      case 'image': return '#dbeafe';
      case 'video': return '#ede9fe';
      case 'document': return '#e0f2fe';
      case 'audio': return '#fef3c7';
      default: return '#f3f4f6';
    }
  }};
  
  color: ${props => {
    switch(props.fileType) {
      case 'image': return '#1e40af';
      case 'video': return '#5b21b6';
      case 'document': return '#0369a1';
      case 'audio': return '#b45309';
      default: return '#4b5563';
    }
  }};
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  text-align: center;
  background-color: #f9fafb;
  border-radius: 8px;
  border: 1px dashed #e5e7eb;
  
  @media (max-width: 640px) {
    padding: 1.5rem;
  }
`;

const EmptyStateIcon = styled.div`
  color: #9ca3af;
  margin-bottom: 1rem;
  
  svg {
    width: 48px;
    height: 48px;
  }
  
  @media (max-width: 640px) {
    margin-bottom: 0.75rem;
    
    svg {
      width: 36px;
      height: 36px;
    }
  }
`;

const EmptyStateTitle = styled.div`
  font-weight: 500;
  font-size: 1rem;
  color: #374151;
  margin-bottom: 0.5rem;
  
  @media (max-width: 640px) {
    font-size: 0.875rem;
  }
`;

const EmptyStateText = styled.div`
  font-size: 0.875rem;
  color: #6b7280;
  margin-bottom: 1.5rem;
  
  @media (max-width: 640px) {
    font-size: 0.75rem;
    margin-bottom: 1rem;
  }
`;

const BulkActions = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1rem;
  background-color: #f3f4f6;
  border-radius: 8px;
  margin-bottom: 1rem;
  
  @media (max-width: 640px) {
    padding: 0.5rem 0.75rem;
    flex-wrap: wrap;
    gap: 0.5rem;
  }
`;

const BulkActionsInfo = styled.div`
  font-size: 0.875rem;
  font-weight: 500;
  color: #4b5563;
  
  @media (max-width: 640px) {
    font-size: 0.8125rem;
  }
`;

const BulkActionsButtons = styled.div`
  display: flex;
  gap: 0.5rem;
  
  @media (max-width: 640px) {
    width: 100%;
    justify-content: flex-end;
  }
`;

const BulkActionButton = styled(Button)`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  
  @media (max-width: 640px) {
    font-size: 0.75rem;
    
    svg {
      width: 14px;
      height: 14px;
    }
  }
`;

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 50;
  padding: 1rem;
`;

const Modal = styled.div`
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
  width: 100%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
`;

const ModalHeader = styled.div`
  padding: 1rem;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  justify-content: space-between;
  align-items: center;
  
  @media (max-width: 640px) {
    padding: 0.75rem;
  }
`;

const ModalTitle = styled.div`
  font-weight: 600;
  font-size: 1.125rem;
  color: #111827;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  
  @media (max-width: 640px) {
    font-size: 1rem;
  }
`;

const ModalCloseButton = styled.button`
  background: none;
  border: none;
  color: #6b7280;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.25rem;
  border-radius: 4px;
  
  &:hover {
    background-color: #f3f4f6;
    color: #111827;
  }
`;

const ModalContent = styled.div`
  padding: 1rem;
  
  @media (max-width: 640px) {
    padding: 0.75rem;
  }
`;

const ModalActions = styled.div`
  padding: 1rem;
  border-top: 1px solid #e5e7eb;
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  
  @media (max-width: 640px) {
    padding: 0.75rem;
  }
`;

const VideoPreview = styled.div`
  width: 100%;
  height: 0;
  padding-bottom: 56.25%;
  position: relative;
  background-color: #111827;
  margin-bottom: 1rem;
  border-radius: 8px;
  overflow: hidden;
  
  video {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    object-fit: contain;
  }
`;

const ImagePreview = styled.div`
  width: 100%;
  padding-bottom: 100%;
  position: relative;
  margin-bottom: 1rem;
  border-radius: 8px;
  overflow: hidden;
  background-color: #f3f4f6;
  
  img {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    object-fit: contain;
  }
`;

const PreviewPlaceholder = styled.div`
  padding: 2rem;
  background-color: #f9fafb;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  margin-bottom: 1rem;
  
  svg {
    color: #9ca3af;
    margin-bottom: 1rem;
  }
`;

const FormGroup = styled.div`
  margin-bottom: 1rem;
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const FormLabel = styled.label`
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  font-size: 0.875rem;
  color: #374151;
`;

const FormInput = styled.input`
  width: 100%;
  padding: 0.625rem 0.75rem;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  font-size: 0.875rem;
  
  &:focus {
    outline: none;
    border-color: #0070f3;
    box-shadow: 0 0 0 2px rgba(0, 112, 243, 0.2);
  }
`;

const FormTextarea = styled.textarea`
  width: 100%;
  padding: 0.625rem 0.75rem;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  font-size: 0.875rem;
  min-height: 100px;
  resize: vertical;
  
  &:focus {
    outline: none;
    border-color: #0070f3;
    box-shadow: 0 0 0 2px rgba(0, 112, 243, 0.2);
  }
`;

const FormSelect = styled.select`
  width: 100%;
  padding: 0.625rem 0.75rem;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  font-size: 0.875rem;
  
  &:focus {
    outline: none;
    border-color: #0070f3;
    box-shadow: 0 0 0 2px rgba(0, 112, 243, 0.2);
  }
`;

const LoadingOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(255, 255, 255, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 20;
  border-radius: 8px;
`;

const CopyInput = styled.div`
  display: flex;
  margin-top: 0.5rem;
`;

const CopyInputField = styled.input`
  flex: 1;
  padding: 0.625rem 0.75rem;
  border: 1px solid #e5e7eb;
  border-right: none;
  border-top-left-radius: 6px;
  border-bottom-left-radius: 6px;
  font-size: 0.875rem;
  background-color: #f9fafb;
  
  &:focus {
    outline: none;
  }
`;

const CopyButton = styled.button`
  padding: 0.625rem 0.75rem;
  background-color: #f3f4f6;
  border: 1px solid #e5e7eb;
  border-top-right-radius: 6px;
  border-bottom-right-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  
  &:hover {
    background-color: #e5e7eb;
  }
`;

const ExpiryBadge = styled(Badge)`
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.75rem;
  margin-top: 0.5rem;
`;

const ShareOptions = styled.div`
  margin-top: 1rem;
  border-top: 1px solid #e5e7eb;
  padding-top: 1rem;
`;

const ShareOptionsTitle = styled.div`
  font-weight: 500;
  font-size: 0.875rem;
  margin-bottom: 0.75rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const ShareOptionsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.75rem;
  
  @media (max-width: 480px) {
    grid-template-columns: 1fr;
  }
`;

const FileMetadata = styled.div`
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #e5e7eb;
`;

const MetadataTitle = styled.div`
  font-weight: 500;
  font-size: 0.875rem;
  margin-bottom: 0.75rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const MetadataGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.5rem 1rem;
  
  @media (max-width: 480px) {
    grid-template-columns: 1fr;
  }
`;

const MetadataItem = styled.div`
  display: flex;
  flex-direction: column;
`;

const MetadataLabel = styled.div`
  font-size: 0.75rem;
  color: #6b7280;
`;

const MetadataValue = styled.div`
  font-size: 0.875rem;
  font-weight: 500;
  color: #111827;
`;

const UploadProgress = styled.div`
  margin-top: 1rem;
`;

const ProgressBar = styled.div`
  height: 8px;
  background-color: #e5e7eb;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 0.5rem;
`;

const ProgressFill = styled.div<{ progress: number }>`
  height: 100%;
  width: ${props => `${props.progress}%`};
  background-color: #0070f3;
  transition: width 0.3s ease;
`;

const ProgressInfo = styled.div`
  display: flex;
  justify-content: space-between;
  font-size: 0.75rem;
  color: #6b7280;
`;

// Define file type interface
interface MediaFile {
  id: string;
  name: string;
  type: 'image' | 'video' | 'document' | 'audio' | 'other';
  size: number;
  url: string;
  thumbnail?: string;
  dateCreated: Date;
  description?: string;
  tags?: string[];
  expiryDate?: Date;
  shareLink?: string;
}

interface MediaManagementSystemProps {
  onMediaSelect: (media: any[]) => void;
  clientId?: string;
  reportId?: string;
  initialMedia?: any[];
}

/**
 * Media Management System Component
 * 
 * A comprehensive system for managing media files including images,
 * videos, and documents with advanced features like expiration dates
 * and secure sharing.
 */
const MediaManagementSystem: React.FC<MediaManagementSystemProps> = ({
  onMediaSelect,
  clientId,
  reportId,
  initialMedia = [],
}) => {
  // File input ref
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // UI state
  const [activeTab, setActiveTab] = useState<'all' | 'images' | 'videos' | 'documents'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filterMenuOpen, setFilterMenuOpen] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [sortBy, setSortBy] = useState<'date' | 'name' | 'size'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  // Selection state
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  
  // Modal state
  const [previewFile, setPreviewFile] = useState<MediaFile | null>(null);
  const [showPreviewModal, setShowPreviewModal] = useState<boolean>(false);
  const [showUploadModal, setShowUploadModal] = useState<boolean>(false);
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  const [showShareModal, setShowShareModal] = useState<boolean>(false);
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  
  // Upload state
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  
  // Edit state
  const [editForm, setEditForm] = useState({
    name: '',
    description: '',
    tags: '',
    expiryDate: ''
  });
  
  // Form validation
  const [formErrors, setFormErrors] = useState<{[key: string]: string}>({});
  
  // Media files state
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>(initialMedia.length ? mapInitialMedia(initialMedia) : generateDummyMedia());
  
  // Map initial media to our format
  function mapInitialMedia(media: any[]): MediaFile[] {
    return media.map(item => ({
      id: item.id || generateId(),
      name: item.name || 'Unnamed file',
      type: getFileTypeFromUrl(item.url) || 'other',
      size: item.size || 0,
      url: item.url,
      thumbnail: item.thumbnail || item.url,
      dateCreated: item.dateCreated ? new Date(item.dateCreated) : new Date(),
      description: item.description || '',
      tags: item.tags || [],
      expiryDate: item.expiryDate ? new Date(item.expiryDate) : undefined,
      shareLink: item.shareLink
    }));
  }
  
  // Generate a random ID
  function generateId(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }
  
  // Determine file type from URL
  function getFileTypeFromUrl(url: string): 'image' | 'video' | 'document' | 'audio' | 'other' {
    const extension = url.split('.').pop()?.toLowerCase();
    
    if (!extension) return 'other';
    
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(extension)) {
      return 'image';
    } else if (['mp4', 'webm', 'ogg', 'mov'].includes(extension)) {
      return 'video';
    } else if (['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt'].includes(extension)) {
      return 'document';
    } else if (['mp3', 'wav', 'ogg', 'aac'].includes(extension)) {
      return 'audio';
    }
    
    return 'other';
  }
  
  // Generate dummy media for demonstration
  function generateDummyMedia(): MediaFile[] {
    const dummyMedia: MediaFile[] = [];
    
    // Add some dummy images
    for (let i = 1; i <= 5; i++) {
      dummyMedia.push({
        id: `image-${i}`,
        name: `Security Image ${i}.jpg`,
        type: 'image',
        size: Math.floor(Math.random() * 5000000) + 1000000, // 1-6MB
        url: `https://source.unsplash.com/random/800x600?security,${i}`,
        thumbnail: `https://source.unsplash.com/random/400x300?security,${i}`,
        dateCreated: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000),
        description: `Security surveillance image from camera ${i}`,
        tags: ['security', 'surveillance', 'camera']
      });
    }
    
    // Add some dummy videos
    for (let i = 1; i <= 3; i++) {
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 7); // 7 days from now
      
      dummyMedia.push({
        id: `video-${i}`,
        name: `Security Footage ${i}.mp4`,
        type: 'video',
        size: Math.floor(Math.random() * 50000000) + 10000000, // 10-60MB
        url: 'https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/720/Big_Buck_Bunny_720_10s_1MB.mp4', // Dummy video URL
        thumbnail: `https://source.unsplash.com/random/400x300?security,video,${i}`,
        dateCreated: new Date(Date.now() - Math.floor(Math.random() * 7) * 24 * 60 * 60 * 1000),
        description: `Security camera footage from area ${i}`,
        tags: ['security', 'footage', 'video'],
        expiryDate,
        shareLink: `https://share.example.com/security/video-${i}`
      });
    }
    
    // Add some dummy documents
    for (let i = 1; i <= 2; i++) {
      dummyMedia.push({
        id: `document-${i}`,
        name: `Incident Report ${i}.pdf`,
        type: 'document',
        size: Math.floor(Math.random() * 2000000) + 500000, // 0.5-2.5MB
        url: '#',
        dateCreated: new Date(Date.now() - Math.floor(Math.random() * 14) * 24 * 60 * 60 * 1000),
        description: `Incident report document ${i}`,
        tags: ['report', 'incident', 'document']
      });
    }
    
    return dummyMedia;
  }
  
  // Initialize selected media
  useEffect(() => {
    // If there are initialMedia items, select them by default
    if (initialMedia.length > 0) {
      const initialIds = mediaFiles.filter(file => 
        initialMedia.some(initial => 
          initial.url === file.url || initial.id === file.id
        )
      ).map(file => file.id);
      
      setSelectedFiles(initialIds);
    }
  }, [initialMedia, mediaFiles]);
  
  // Handle file selection changes
  useEffect(() => {
    // Get the selected media files
    const selectedMedia = mediaFiles.filter(file => selectedFiles.includes(file.id));
    
    // Call the onMediaSelect callback
    onMediaSelect(selectedMedia);
  }, [selectedFiles, mediaFiles, onMediaSelect]);
  
  // Open file picker
  const openFilePicker = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  
  // Handle file input change
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      setUploadedFiles(files);
      setShowUploadModal(true);
    }
  };
  
  // Handle drop zone
  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const files = Array.from(e.dataTransfer.files);
      setUploadedFiles(files);
      setShowUploadModal(true);
    }
  }, []);
  
  // Handle drag over
  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);
  
  // Handle file upload
  const handleUpload = async () => {
    if (uploadedFiles.length === 0) return;
    
    setIsUploading(true);
    setUploadProgress(0);
    
    try {
      // Simulate upload progress
      const totalFiles = uploadedFiles.length;
      let processedFiles = 0;
      
      const newMediaFiles: MediaFile[] = [];
      
      for (const file of uploadedFiles) {
        // Create a dummy URL (in a real app, you would upload to server and get a real URL)
        const url = URL.createObjectURL(file);
        
        // Determine file type
        let type: 'image' | 'video' | 'document' | 'audio' | 'other' = 'other';
        
        if (file.type.startsWith('image/')) {
          type = 'image';
        } else if (file.type.startsWith('video/')) {
          type = 'video';
        } else if (file.type.startsWith('audio/')) {
          type = 'audio';
        } else if (
          file.type === 'application/pdf' ||
          file.type.includes('word') ||
          file.type.includes('excel') ||
          file.type.includes('powerpoint') ||
          file.type === 'text/plain'
        ) {
          type = 'document';
        }
        
        // Create a new media file object
        const newMediaFile: MediaFile = {
          id: generateId(),
          name: file.name,
          type,
          size: file.size,
          url,
          thumbnail: type === 'image' ? url : undefined,
          dateCreated: new Date(),
          description: '',
          tags: []
        };
        
        // Add video expiry for videos
        if (type === 'video') {
          const expiryDate = new Date();
          expiryDate.setDate(expiryDate.getDate() + 7); // 7 days from now
          
          newMediaFile.expiryDate = expiryDate;
          newMediaFile.shareLink = `https://share.example.com/security/${newMediaFile.id}`;
        }
        
        newMediaFiles.push(newMediaFile);
        
        // Update progress
        processedFiles++;
        setUploadProgress((processedFiles / totalFiles) * 100);
        
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      // Add the new files to the media files array
      setMediaFiles(prev => [...newMediaFiles, ...prev]);
      
      // Select the newly uploaded files
      setSelectedFiles(prev => [...prev, ...newMediaFiles.map(file => file.id)]);
      
      // Close the upload modal after a short delay
      setTimeout(() => {
        setShowUploadModal(false);
        setIsUploading(false);
        setUploadedFiles([]);
      }, 500);
    } catch (error) {
      console.error('Error uploading files:', error);
      setIsUploading(false);
    }
  };
  
  // Handle file selection
  const toggleFileSelection = (fileId: string) => {
    setSelectedFiles(prev => {
      if (prev.includes(fileId)) {
        return prev.filter(id => id !== fileId);
      } else {
        return [...prev, fileId];
      }
    });
  };
  
  // Handle select all
  const handleSelectAll = () => {
    const visibleFiles = getFilteredFiles();
    
    if (selectedFiles.length === visibleFiles.length) {
      // Deselect all
      setSelectedFiles([]);
    } else {
      // Select all visible files
      setSelectedFiles(visibleFiles.map(file => file.id));
    }
  };
  
  // Handle file preview
  const handlePreview = (file: MediaFile) => {
    setPreviewFile(file);
    setShowPreviewModal(true);
  };
  
  // Handle file edit
  const handleEdit = (file: MediaFile) => {
    setPreviewFile(file);
    setEditForm({
      name: file.name,
      description: file.description || '',
      tags: file.tags?.join(', ') || '',
      expiryDate: file.expiryDate ? format(file.expiryDate, "yyyy-MM-dd'T'HH:mm") : ''
    });
    setShowEditModal(true);
  };
  
  // Handle file sharing
  const handleShare = (file: MediaFile) => {
    setPreviewFile(file);
    setShowShareModal(true);
  };
  
  // Handle file deletion
  const handleDelete = (fileIds: string[]) => {
    setSelectedFiles(fileIds);
    setShowDeleteModal(true);
  };
  
  // Confirm file deletion
  const confirmDelete = () => {
    setMediaFiles(prev => prev.filter(file => !selectedFiles.includes(file.id)));
    setSelectedFiles([]);
    setShowDeleteModal(false);
  };
  
  // Save file edits
  const saveFileEdits = () => {
    if (!previewFile) return;
    
    // Validate form
    const errors: {[key: string]: string} = {};
    
    if (!editForm.name.trim()) {
      errors.name = 'Name is required';
    }
    
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    
    // Parse tags
    const tags = editForm.tags
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0);
    
    // Update the file
    setMediaFiles(prev => prev.map(file => {
      if (file.id === previewFile.id) {
        return {
          ...file,
          name: editForm.name,
          description: editForm.description,
          tags,
          expiryDate: editForm.expiryDate ? new Date(editForm.expiryDate) : undefined
        };
      }
      return file;
    }));
    
    // Close the modal
    setShowEditModal(false);
    setFormErrors({});
  };
  
  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };
  
  // Format date
  const formatDate = (date: Date): string => {
    return format(date, 'MMM d, yyyy');
  };
  
  // Copy link to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // Could add a toast notification here
  };
  
  // Handle bulk share
  const handleBulkShare = () => {
    // Get the first selected file for demonstration
    const firstSelected = mediaFiles.find(file => selectedFiles.includes(file.id));
    
    if (firstSelected) {
      handleShare(firstSelected);
    }
  };
  
  // Filter files based on active tab, search term, and sort options
  const getFilteredFiles = (): MediaFile[] => {
    // Filter by type
    let filtered = mediaFiles;
    
    if (activeTab === 'images') {
      filtered = filtered.filter(file => file.type === 'image');
    } else if (activeTab === 'videos') {
      filtered = filtered.filter(file => file.type === 'video');
    } else if (activeTab === 'documents') {
      filtered = filtered.filter(file => file.type === 'document');
    }
    
    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(file => 
        file.name.toLowerCase().includes(term) ||
        file.description?.toLowerCase().includes(term) ||
        file.tags?.some(tag => tag.toLowerCase().includes(term))
      );
    }
    
    // Sort
    filtered = [...filtered].sort((a, b) => {
      if (sortBy === 'date') {
        return sortOrder === 'asc' 
          ? a.dateCreated.getTime() - b.dateCreated.getTime()
          : b.dateCreated.getTime() - a.dateCreated.getTime();
      } else if (sortBy === 'name') {
        return sortOrder === 'asc'
          ? a.name.localeCompare(b.name)
          : b.name.localeCompare(a.name);
      } else { // size
        return sortOrder === 'asc'
          ? a.size - b.size
          : b.size - a.size;
      }
    });
    
    return filtered;
  };
  
  const filteredFiles = getFilteredFiles();
  
  return (
    <Section>
      <SectionTitle>
        <TitleWithIcon>
          <Camera size={20} />
          Media Evidence
        </TitleWithIcon>
        
        <ViewModeButtons>
          <ViewModeButton
            variant={viewMode === 'grid' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('grid')}
          >
            <Grid size={16} />
          </ViewModeButton>
          <ViewModeButton
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('list')}
          >
            <List size={16} />
          </ViewModeButton>
        </ViewModeButtons>
      </SectionTitle>
      
      <MediaTabs defaultValue={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
        <MediaTabsList>
          <MediaTabsTrigger value="all">
            <FileText size={16} />
            All Files
          </MediaTabsTrigger>
          <MediaTabsTrigger value="images">
            <Image size={16} />
            Images
          </MediaTabsTrigger>
          <MediaTabsTrigger value="videos">
            <Video size={16} />
            Videos
          </MediaTabsTrigger>
          <MediaTabsTrigger value="documents">
            <File size={16} />
            Documents
          </MediaTabsTrigger>
        </MediaTabsList>
      </MediaTabs>
      
      <FilterRow>
        <SearchInput>
          <SearchIcon>
            <Search size={16} />
          </SearchIcon>
          <Input
            type="text"
            placeholder="Search files..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </SearchInput>
        
        <div>
          <Button
            variant="outline"
            onClick={openFilePicker}
          >
            <Upload size={16} className="mr-2" />
            Upload Files
          </Button>
          
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleFileInputChange}
            style={{ display: 'none' }}
          />
          
          <FilterDropdown>
            <FilterButton
              variant="outline"
              onClick={() => setFilterMenuOpen(!filterMenuOpen)}
              style={{ marginLeft: '0.5rem' }}
            >
              <Filter size={16} />
              Sort
              <ChevronDown size={14} />
            </FilterButton>
            
            <FilterMenu open={filterMenuOpen}>
              <FilterOption onClick={() => {
                setSortBy('date');
                setSortOrder('desc');
                setFilterMenuOpen(false);
              }}>
                <Calendar size={16} />
                Newest First
              </FilterOption>
              <FilterOption onClick={() => {
                setSortBy('date');
                setSortOrder('asc');
                setFilterMenuOpen(false);
              }}>
                <Calendar size={16} />
                Oldest First
              </FilterOption>
              <FilterOption onClick={() => {
                setSortBy('name');
                setSortOrder('asc');
                setFilterMenuOpen(false);
              }}>
                <FileText size={16} />
                Name (A-Z)
              </FilterOption>
              <FilterOption onClick={() => {
                setSortBy('name');
                setSortOrder('desc');
                setFilterMenuOpen(false);
              }}>
                <FileText size={16} />
                Name (Z-A)
              </FilterOption>
              <FilterOption onClick={() => {
                setSortBy('size');
                setSortOrder('desc');
                setFilterMenuOpen(false);
              }}>
                <FileText size={16} />
                Size (Largest)
              </FilterOption>
              <FilterOption onClick={() => {
                setSortBy('size');
                setSortOrder('asc');
                setFilterMenuOpen(false);
              }}>
                <FileText size={16} />
                Size (Smallest)
              </FilterOption>
            </FilterMenu>
          </FilterDropdown>
        </div>
      </FilterRow>
      
      <DropZoneContainer
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onClick={openFilePicker}
      >
        <DropZoneIcon>
          <Upload size={48} />
        </DropZoneIcon>
        <DropZoneText>Drag and drop files here or click to browse</DropZoneText>
        <DropZoneSubtext>Upload images, videos, and documents to include in your report</DropZoneSubtext>
      </DropZoneContainer>
      
      {selectedFiles.length > 0 && (
        <BulkActions>
          <BulkActionsInfo>
            {selectedFiles.length} file{selectedFiles.length !== 1 ? 's' : ''} selected
          </BulkActionsInfo>
          
          <BulkActionsButtons>
            <BulkActionButton
              variant="outline"
              size="sm"
              onClick={handleBulkShare}
            >
              <Link size={14} />
              Share
            </BulkActionButton>
            
            <BulkActionButton
              variant="destructive"
              size="sm"
              onClick={() => handleDelete(selectedFiles)}
            >
              <Trash2 size={14} />
              Delete
            </BulkActionButton>
          </BulkActionsButtons>
        </BulkActions>
      )}
      
      {filteredFiles.length > 0 ? (
        <FilesContainer viewMode={viewMode}>
          {filteredFiles.map((file) => (
            <FileCard
              key={file.id}
              viewMode={viewMode}
              selected={selectedFiles.includes(file.id)}
            >
              <SelectBox
                selected={selectedFiles.includes(file.id)}
                onClick={(e) => {
                  e.stopPropagation();
                  toggleFileSelection(file.id);
                }}
              >
                {selectedFiles.includes(file.id) && <Check size={12} />}
              </SelectBox>
              
              <TypeBadge fileType={file.type}>
                {file.type}
              </TypeBadge>
              
              <FilePreview viewMode={viewMode}>
                {file.type === 'image' && file.thumbnail && (
                  <img src={file.thumbnail} alt={file.name} />
                )}
                
                {file.type === 'video' && (
                  <>
                    {file.thumbnail ? (
                      <img src={file.thumbnail} alt={file.name} />
                    ) : (
                      <Video size={24} />
                    )}
                    <div style={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      width: '30px',
                      height: '30px',
                      borderRadius: '50%',
                      backgroundColor: 'rgba(0, 0, 0, 0.5)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <Play size={16} color="white" />
                    </div>
                  </>
                )}
                
                {file.type === 'document' && (
                  <FileText size={24} />
                )}
                
                {file.type === 'audio' && (
                  <Volume2 size={24} />
                )}
                
                {file.type === 'other' && (
                  <File size={24} />
                )}
              </FilePreview>
              
              <FileCardContent viewMode={viewMode}>
                <FileInfo viewMode={viewMode}>
                  <FileName viewMode={viewMode}>{file.name}</FileName>
                  <FileDetails viewMode={viewMode}>
                    {formatFileSize(file.size)} • {formatDate(file.dateCreated)}
                    {file.expiryDate && (
                      <div>
                        <span style={{ color: new Date() > file.expiryDate ? '#ef4444' : '#6b7280' }}>
                          {new Date() > file.expiryDate ? 'Expired' : 'Expires'}: {formatDate(file.expiryDate)}
                        </span>
                      </div>
                    )}
                  </FileDetails>
                </FileInfo>
                
                <FileActions viewMode={viewMode}>
                  <IconButton onClick={() => handlePreview(file)} title="Preview">
                    <Eye size={16} />
                  </IconButton>
                  
                  <IconButton onClick={() => handleEdit(file)} title="Edit">
                    <Pencil size={16} />
                  </IconButton>
                  
                  {(file.type === 'video' || file.shareLink) && (
                    <IconButton onClick={() => handleShare(file)} title="Share">
                      <Link size={16} />
                    </IconButton>
                  )}
                  
                  <IconButton onClick={() => handleDelete([file.id])} title="Delete">
                    <Trash2 size={16} />
                  </IconButton>
                </FileActions>
              </FileCardContent>
            </FileCard>
          ))}
        </FilesContainer>
      ) : (
        <EmptyState>
          <EmptyStateIcon>
            <FileText size={48} />
          </EmptyStateIcon>
          <EmptyStateTitle>No files found</EmptyStateTitle>
          <EmptyStateText>
            {searchTerm
              ? `No files matching "${searchTerm}" found. Try a different search term.`
              : 'Upload files to include in your report'}
          </EmptyStateText>
          <Button onClick={openFilePicker}>
            <Upload size={16} className="mr-2" />
            Upload Files
          </Button>
        </EmptyState>
      )}
      
      {/* Preview Modal */}
      {showPreviewModal && previewFile && (
        <ModalOverlay onClick={() => setShowPreviewModal(false)}>
          <Modal onClick={(e) => e.stopPropagation()}>
            <ModalHeader>
              <ModalTitle>
                {previewFile.type === 'image' && <Image size={18} />}
                {previewFile.type === 'video' && <Video size={18} />}
                {previewFile.type === 'document' && <FileText size={18} />}
                {previewFile.name}
              </ModalTitle>
              <ModalCloseButton onClick={() => setShowPreviewModal(false)}>
                <X size={18} />
              </ModalCloseButton>
            </ModalHeader>
            
            <ModalContent>
              {previewFile.type === 'image' && (
                <ImagePreview>
                  <img src={previewFile.url} alt={previewFile.name} />
                </ImagePreview>
              )}
              
              {previewFile.type === 'video' && (
                <VideoPreview>
                  <video controls>
                    <source src={previewFile.url} type="video/mp4" />
                    Your browser does not support the video tag.
                  </video>
                </VideoPreview>
              )}
              
              {previewFile.type === 'document' && (
                <PreviewPlaceholder>
                  <FileText size={48} />
                  <div>Document preview not available</div>
                </PreviewPlaceholder>
              )}
              
              <FileMetadata>
                <MetadataTitle>
                  <FileText size={16} />
                  File Information
                </MetadataTitle>
                
                <MetadataGrid>
                  <MetadataItem>
                    <MetadataLabel>Name</MetadataLabel>
                    <MetadataValue>{previewFile.name}</MetadataValue>
                  </MetadataItem>
                  
                  <MetadataItem>
                    <MetadataLabel>Type</MetadataLabel>
                    <MetadataValue>{previewFile.type}</MetadataValue>
                  </MetadataItem>
                  
                  <MetadataItem>
                    <MetadataLabel>Size</MetadataLabel>
                    <MetadataValue>{formatFileSize(previewFile.size)}</MetadataValue>
                  </MetadataItem>
                  
                  <MetadataItem>
                    <MetadataLabel>Date Added</MetadataLabel>
                    <MetadataValue>{formatDate(previewFile.dateCreated)}</MetadataValue>
                  </MetadataItem>
                  
                  {previewFile.expiryDate && (
                    <MetadataItem>
                      <MetadataLabel>Expiry Date</MetadataLabel>
                      <MetadataValue>
                        {formatDate(previewFile.expiryDate)}
                        {new Date() > previewFile.expiryDate && (
                          <span style={{ color: '#ef4444', marginLeft: '0.5rem' }}>
                            (Expired)
                          </span>
                        )}
                      </MetadataValue>
                    </MetadataItem>
                  )}
                  
                  {previewFile.tags && previewFile.tags.length > 0 && (
                    <MetadataItem>
                      <MetadataLabel>Tags</MetadataLabel>
                      <MetadataValue>{previewFile.tags.join(', ')}</MetadataValue>
                    </MetadataItem>
                  )}
                  
                  {previewFile.description && (
                    <MetadataItem style={{ gridColumn: '1 / -1' }}>
                      <MetadataLabel>Description</MetadataLabel>
                      <MetadataValue>{previewFile.description}</MetadataValue>
                    </MetadataItem>
                  )}
                </MetadataGrid>
              </FileMetadata>
            </ModalContent>
            
            <ModalActions>
              <Button
                variant="outline"
                onClick={() => setShowPreviewModal(false)}
              >
                Close
              </Button>
              <Button
                variant="default"
                onClick={() => {
                  setShowPreviewModal(false);
                  handleEdit(previewFile);
                }}
              >
                <Pencil size={16} className="mr-2" />
                Edit
              </Button>
            </ModalActions>
          </Modal>
        </ModalOverlay>
      )}
      
      {/* Edit Modal */}
      {showEditModal && previewFile && (
        <ModalOverlay onClick={() => setShowEditModal(false)}>
          <Modal onClick={(e) => e.stopPropagation()}>
            <ModalHeader>
              <ModalTitle>
                <Pencil size={18} />
                Edit File
              </ModalTitle>
              <ModalCloseButton onClick={() => setShowEditModal(false)}>
                <X size={18} />
              </ModalCloseButton>
            </ModalHeader>
            
            <ModalContent>
              <FormGroup>
                <FormLabel htmlFor="file-name">File Name</FormLabel>
                <FormInput
                  id="file-name"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  placeholder="Enter file name"
                />
                {formErrors.name && (
                  <div style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                    {formErrors.name}
                  </div>
                )}
              </FormGroup>
              
              <FormGroup>
                <FormLabel htmlFor="file-description">Description</FormLabel>
                <FormTextarea
                  id="file-description"
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  placeholder="Enter file description"
                />
              </FormGroup>
              
              <FormGroup>
                <FormLabel htmlFor="file-tags">Tags (comma separated)</FormLabel>
                <FormInput
                  id="file-tags"
                  value={editForm.tags}
                  onChange={(e) => setEditForm({ ...editForm, tags: e.target.value })}
                  placeholder="security, incident, evidence"
                />
              </FormGroup>
              
              {previewFile.type === 'video' && (
                <FormGroup>
                  <FormLabel htmlFor="file-expiry">Expiry Date</FormLabel>
                  <FormInput
                    id="file-expiry"
                    type="datetime-local"
                    value={editForm.expiryDate}
                    onChange={(e) => setEditForm({ ...editForm, expiryDate: e.target.value })}
                    min={format(new Date(), "yyyy-MM-dd'T'HH:mm")}
                  />
                </FormGroup>
              )}
            </ModalContent>
            
            <ModalActions>
              <Button
                variant="outline"
                onClick={() => setShowEditModal(false)}
              >
                Cancel
              </Button>
              <Button
                variant="default"
                onClick={saveFileEdits}
              >
                Save Changes
              </Button>
            </ModalActions>
          </Modal>
        </ModalOverlay>
      )}
      
      {/* Share Modal */}
      {showShareModal && previewFile && (
        <ModalOverlay onClick={() => setShowShareModal(false)}>
          <Modal onClick={(e) => e.stopPropagation()}>
            <ModalHeader>
              <ModalTitle>
                <Link size={18} />
                Share File
              </ModalTitle>
              <ModalCloseButton onClick={() => setShowShareModal(false)}>
                <X size={18} />
              </ModalCloseButton>
            </ModalHeader>
            
            <ModalContent>
              <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
                {previewFile.type === 'image' && previewFile.thumbnail && (
                  <img 
                    src={previewFile.thumbnail} 
                    alt={previewFile.name} 
                    style={{ maxHeight: '150px', margin: '0 auto', borderRadius: '4px' }}
                  />
                )}
                
                {previewFile.type === 'video' && previewFile.thumbnail && (
                  <div style={{ position: 'relative', width: '100%', maxWidth: '150px', margin: '0 auto' }}>
                    <img 
                      src={previewFile.thumbnail} 
                      alt={previewFile.name} 
                      style={{ width: '100%', borderRadius: '4px' }}
                    />
                    <div style={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      backgroundColor: 'rgba(0, 0, 0, 0.5)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <Play size={20} color="white" />
                    </div>
                  </div>
                )}
              </div>
              
              <FormGroup>
                <FormLabel>Share Link</FormLabel>
                <CopyInput>
                  <CopyInputField
                    value={previewFile.shareLink || `https://share.example.com/security/${previewFile.id}`}
                    readOnly
                  />
                  <CopyButton
                    onClick={() => copyToClipboard(previewFile.shareLink || `https://share.example.com/security/${previewFile.id}`)}
                    title="Copy to clipboard"
                  >
                    <Copy size={16} />
                  </CopyButton>
                </CopyInput>
                
                {previewFile.expiryDate && (
                  <ExpiryBadge variant="outline">
                    <Clock size={14} />
                    {new Date() > previewFile.expiryDate ? 'Expired' : 'Expires'} on {formatDate(previewFile.expiryDate)}
                  </ExpiryBadge>
                )}
              </FormGroup>
              
              <ShareOptions>
                <ShareOptionsTitle>
                  <Lock size={16} />
                  Security Settings
                </ShareOptionsTitle>
                
                <ShareOptionsGrid>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 500, fontSize: '0.875rem' }}>Password Protection</div>
                      <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>Require password to access</div>
                    </div>
                    <Switch checked={false} />
                  </div>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 500, fontSize: '0.875rem' }}>Download Prevention</div>
                      <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>View only, no downloads</div>
                    </div>
                    <Switch checked={true} />
                  </div>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 500, fontSize: '0.875rem' }}>Access Tracking</div>
                      <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>Log all access attempts</div>
                    </div>
                    <Switch checked={true} />
                  </div>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 500, fontSize: '0.875rem' }}>Expiry Date</div>
                      <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>Auto-expire access</div>
                    </div>
                    <Switch checked={!!previewFile.expiryDate} />
                  </div>
                </ShareOptionsGrid>
              </ShareOptions>
            </ModalContent>
            
            <ModalActions>
              <Button
                variant="outline"
                onClick={() => setShowShareModal(false)}
              >
                Close
              </Button>
              <Button
                variant="default"
              >
                <Link size={16} className="mr-2" />
                Update Share Settings
              </Button>
            </ModalActions>
          </Modal>
        </ModalOverlay>
      )}
      
      {/* Delete Modal */}
      {showDeleteModal && (
        <ModalOverlay onClick={() => setShowDeleteModal(false)}>
          <Modal onClick={(e) => e.stopPropagation()} style={{ maxWidth: '400px' }}>
            <ModalHeader>
              <ModalTitle>
                <AlertTriangle size={18} />
                Confirm Deletion
              </ModalTitle>
              <ModalCloseButton onClick={() => setShowDeleteModal(false)}>
                <X size={18} />
              </ModalCloseButton>
            </ModalHeader>
            
            <ModalContent>
              <div style={{ textAlign: 'center' }}>
                <AlertTriangle size={48} color="#ef4444" style={{ marginBottom: '1rem' }} />
                <div style={{ fontWeight: 600, fontSize: '1.125rem', marginBottom: '0.5rem' }}>
                  Delete {selectedFiles.length} file{selectedFiles.length !== 1 ? 's' : ''}?
                </div>
                <div style={{ color: '#6b7280', fontSize: '0.9375rem' }}>
                  This action cannot be undone. These files will be permanently removed.
                </div>
              </div>
            </ModalContent>
            
            <ModalActions>
              <Button
                variant="outline"
                onClick={() => setShowDeleteModal(false)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={confirmDelete}
              >
                Delete
              </Button>
            </ModalActions>
          </Modal>
        </ModalOverlay>
      )}
      
      {/* Upload Modal */}
      {showUploadModal && (
        <ModalOverlay onClick={() => !isUploading && setShowUploadModal(false)}>
          <Modal onClick={(e) => e.stopPropagation()}>
            <ModalHeader>
              <ModalTitle>
                <Upload size={18} />
                Upload Files
              </ModalTitle>
              {!isUploading && (
                <ModalCloseButton onClick={() => setShowUploadModal(false)}>
                  <X size={18} />
                </ModalCloseButton>
              )}
            </ModalHeader>
            
            <ModalContent>
              <div style={{ marginBottom: '1rem' }}>
                <div style={{ fontWeight: 500, marginBottom: '0.5rem' }}>
                  Selected Files ({uploadedFiles.length})
                </div>
                <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid #e5e7eb', borderRadius: '4px', padding: '0.5rem' }}>
                  {uploadedFiles.map((file, index) => (
                    <div key={index} style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      padding: '0.5rem', 
                      borderBottom: index < uploadedFiles.length - 1 ? '1px solid #f3f4f6' : 'none'
                    }}>
                      {file.type.startsWith('image/') && <Image size={16} style={{ marginRight: '0.5rem' }} />}
                      {file.type.startsWith('video/') && <Video size={16} style={{ marginRight: '0.5rem' }} />}
                      {file.type.startsWith('application/') && <FileText size={16} style={{ marginRight: '0.5rem' }} />}
                      {file.type.startsWith('audio/') && <Volume2 size={16} style={{ marginRight: '0.5rem' }} />}
                      <div style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {file.name}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#6b7280', marginLeft: '0.5rem' }}>
                        {formatFileSize(file.size)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {isUploading && (
                <UploadProgress>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <div style={{ fontWeight: 500, fontSize: '0.875rem' }}>Uploading...</div>
                    <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                      {Math.round(uploadProgress)}%
                    </div>
                  </div>
                  <ProgressBar>
                    <ProgressFill progress={uploadProgress} />
                  </ProgressBar>
                  <ProgressInfo>
                    <div>
                      Uploading {uploadedFiles.length} file{uploadedFiles.length !== 1 ? 's' : ''}
                    </div>
                    <div>
                      {Math.round(uploadProgress)}% complete
                    </div>
                  </ProgressInfo>
                </UploadProgress>
              )}
            </ModalContent>
            
            <ModalActions>
              {!isUploading && (
                <>
                  <Button
                    variant="outline"
                    onClick={() => setShowUploadModal(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="default"
                    onClick={handleUpload}
                  >
                    <Upload size={16} className="mr-2" />
                    Upload
                  </Button>
                </>
              )}
              
              {isUploading && (
                <Button
                  variant="outline"
                  disabled
                >
                  <Loader2 size={16} className="mr-2 animate-spin" />
                  Uploading...
                </Button>
              )}
            </ModalActions>
          </Modal>
        </ModalOverlay>
      )}
    </Section>
  );
};

export default MediaManagementSystem;