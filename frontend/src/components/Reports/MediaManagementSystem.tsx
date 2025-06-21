import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import styled, { css } from 'styled-components';
import { format } from 'date-fns';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Tabs, TabsList, TabsTrigger } from '../ui/tabs';
import { Switch } from '../ui/switch';
import {
    Camera, Image, Video, Upload, FileText, Trash2, Pencil,
    Link, Eye, X, Calendar, Search, AlertTriangle, File, Grid, List,
    Filter, ChevronDown, Clock, Play, Loader2, Lock, Copy, Check, Volume2
} from 'lucide-react';
// Import the updated MediaFile type where 'id' is required
import { MediaFile } from '../../types/reports';

// --- Props Interface Definition ---
interface MediaManagementSystemProps {
  onMediaSelect: (media: MediaFile[]) => void;
  initialMedia?: Partial<MediaFile>[]; // Allow partial for initial loading
  clientId?: string;
  reportId?: string;
}

// --- Utility Functions ---
const generateId = (): string => Math.random().toString(36).substring(2, 15);

const getFileType = (file: File | { name?: string; type?: string }): MediaFile['type'] => {
    const fileName = file.name || '';
    const fileType = (file as File).type || ''; // Prefer File.type if available
    const extension = fileName.split('.').pop()?.toLowerCase();

    if (fileType.startsWith('image/')) return 'image';
    if (fileType.startsWith('video/')) return 'video';
    if (fileType.startsWith('audio/')) return 'audio';
    if (fileType === 'application/pdf') return 'document';

    if (!extension) return 'other';
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(extension)) return 'image';
    if (['mp4', 'webm', 'ogg', 'mov', 'avi', 'wmv', 'mkv'].includes(extension)) return 'video';
    if (['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'csv'].includes(extension)) return 'document';
    if (['mp3', 'wav', 'aac', 'flac', 'm4a'].includes(extension)) return 'audio';
    return 'other';
};

const formatFileSize = (bytes?: number): string => {
    if (bytes === undefined || bytes === null || bytes === 0) return '0 B';
    const k = 1024; const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const formatDateSafe = (dateInput?: Date | string): string => {
    if (!dateInput) return 'N/A';
    try {
        const dateObj = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
        if (isNaN(dateObj.getTime())) return 'Invalid Date';
        return format(dateObj, 'MMM d, yyyy');
    } catch (e) { return 'Invalid Date'; }
};

const generateDummyMedia = (): MediaFile[] => []; // Keep empty for production

// Map initial data, ensuring required 'id' is present
const mapInitialMedia = (media: Partial<MediaFile>[]): MediaFile[] => media.map((item): MediaFile => {
    const ensureDateObject = (d: any): Date | undefined => {
        if (d instanceof Date && !isNaN(d.getTime())) return d;
        if (typeof d === 'string') { try { const p = new Date(d); if (!isNaN(p.getTime())) return p; } catch { /* ignore */ } }
        return undefined;
    };
    const getIsoString = (d: any): string => { const dateObj = ensureDateObject(d); return dateObj ? dateObj.toISOString() : new Date().toISOString(); };

    const fileType = item.type || getFileType({ name: item.name, type: undefined }) || 'other'; // Determine type early

    return {
        id: item.id || generateId(), // Ensure ID exists
        url: item.url || '#',
        name: item.name || 'Unnamed file',
        type: fileType,
        size: typeof item.size === 'number' ? item.size : 0,
        thumbnail: item.thumbnail || (fileType === 'image' ? item.url : undefined),
        dateCreated: ensureDateObject(item.dateCreated) ?? new Date(),
        description: item.description || '',
        tags: Array.isArray(item.tags) ? item.tags : [],
        expiryDate: ensureDateObject(item.expiryDate),
        shareLink: item.shareLink,
        uploadedAt: getIsoString(item.uploadedAt),
        file: item.file // Include the File object if provided initially
    };
});

// --- Styled Components (Abbreviated for brevity) ---
const Section = styled.div`
  background: rgba(26, 26, 26, 0.8);
  border-radius: 10px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  border: 1px solid rgba(238, 232, 170, 0.2);
`;

const SectionTitle = styled.h3`
  color: #EEE8AA;
  margin-bottom: 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 1.1rem;
  font-weight: 600;
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
  padding: 0.25rem 0.5rem;
`;

const MediaTabs = styled(Tabs)`
  margin-bottom: 1rem;
`;

const MediaTabsList = styled(TabsList)`
  background: rgba(30, 30, 35, 0.7);
  border: 1px solid rgba(238, 232, 170, 0.3);
`;

const MediaTabsTrigger = styled(TabsTrigger)`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #A0A0A0;
  
  &[data-state="active"] {
    color: #FFD700;
    background: rgba(255, 215, 0, 0.1);
  }
`;

const FilterRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  gap: 1rem;
  flex-wrap: wrap;
`;

const SearchInput = styled.div`
  position: relative;
  flex: 1;
  min-width: 200px;
`;

const SearchIcon = styled.div`
  position: absolute;
  left: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  color: #777;
`;

const Input = styled.input`
  width: 100%;
  padding: 0.5rem 0.75rem 0.5rem 2.5rem;
  background: rgba(30, 30, 35, 0.7);
  border: 1px solid rgba(238, 232, 170, 0.3);
  border-radius: 5px;
  color: #F0E6D2;
  font-size: 0.9rem;
  
  &:focus {
    outline: none;
    border-color: #FFD700;
    box-shadow: 0 0 0 2px rgba(255, 215, 0, 0.2);
  }
  
  &::placeholder {
    color: #777;
  }
`;

const FilterDropdown = styled.div`
  position: relative;
`;

const FilterButton = styled(Button)`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const FilterMenu = styled.div<{ $open: boolean }>`
  position: absolute;
  top: 100%;
  right: 0;
  background: rgba(20, 20, 25, 0.95);
  border: 1px solid rgba(238, 232, 170, 0.3);
  border-radius: 5px;
  min-width: 150px;
  z-index: 100;
  display: ${props => props.$open ? 'block' : 'none'};
  margin-top: 0.25rem;
`;

const FilterOption = styled.div`
  padding: 0.5rem 0.75rem;
  color: #F0E6D2;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
  
  &:hover {
    background: rgba(255, 215, 0, 0.1);
    color: #FFD700;
  }
`;

const DropZoneContainer = styled.div`
  border: 2px dashed rgba(238, 232, 170, 0.3);
  border-radius: 8px;
  padding: 2rem;
  text-align: center;
  cursor: pointer;
  margin-bottom: 1rem;
  transition: all 0.2s ease;
  
  &:hover {
    border-color: #FFD700;
    background: rgba(255, 215, 0, 0.05);
  }
`;

const DropZoneIcon = styled.div`
  color: #777;
  margin-bottom: 0.5rem;
`;

const DropZoneText = styled.div`
  color: #F0E6D2;
  font-weight: 500;
  margin-bottom: 0.25rem;
`;

const DropZoneSubtext = styled.div`
  color: #777;
  font-size: 0.9rem;
`;

const FilesContainer = styled.div<{ $viewMode: 'grid' | 'list' }>`
  display: ${props => props.$viewMode === 'grid' ? 'grid' : 'flex'};
  ${props => props.$viewMode === 'grid' ? css`
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 1rem;
  ` : css`
    flex-direction: column;
    gap: 0.5rem;
  `}
`;

const FileCard = styled.div<{ $viewMode: 'grid' | 'list'; $selected: boolean }>`
  background: rgba(30, 30, 35, 0.7);
  border: 1px solid ${props => props.$selected ? '#FFD700' : 'rgba(238, 232, 170, 0.2)'};
  border-radius: 8px;
  padding: ${props => props.$viewMode === 'grid' ? '1rem' : '0.75rem'};
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
  display: ${props => props.$viewMode === 'grid' ? 'block' : 'flex'};
  align-items: ${props => props.$viewMode === 'list' ? 'center' : 'stretch'};
  gap: ${props => props.$viewMode === 'list' ? '1rem' : '0'};
  
  &:hover {
    border-color: #FFD700;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  }
`;

const FilePreview = styled.div<{ $viewMode: 'grid' | 'list' }>`
  ${props => props.$viewMode === 'grid' ? css`
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
  
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const FileCardContent = styled.div<{ $viewMode: 'grid' | 'list' }>`
  display: flex;
  ${props => props.$viewMode === 'grid' ? css`
    flex-direction: column;
    gap: 0.5rem;
  ` : css`
    flex: 1;
    justify-content: space-between;
    align-items: center;
  `}
`;

const FileInfo = styled.div<{ $viewMode: 'grid' | 'list' }>`
  ${props => props.$viewMode === 'list' ? 'flex: 1;' : ''}
`;

const FileName = styled.div<{ $viewMode: 'grid' | 'list' }>`
  color: #F0E6D2;
  font-weight: 500;
  font-size: ${props => props.$viewMode === 'grid' ? '0.9rem' : '1rem'};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-bottom: ${props => props.$viewMode === 'grid' ? '0.25rem' : '0'};
`;

const FileDetails = styled.div<{ $viewMode: 'grid' | 'list' }>`
  display: flex;
  ${props => props.$viewMode === 'grid' ? css`
    flex-direction: column;
    gap: 0.125rem;
  ` : css`
    gap: 1rem;
  `}
  
  span {
    color: #777;
    font-size: 0.8rem;
  }
`;

const FileActions = styled.div<{ $viewMode: 'grid' | 'list' }>`
  display: flex;
  gap: 0.25rem;
  ${props => props.$viewMode === 'grid' ? css`
    margin-top: 0.5rem;
  ` : css`
    flex-shrink: 0;
  `}
`;

const IconButton = styled.button`
  background: none;
  border: none;
  color: #777;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 4px;
  transition: all 0.2s ease;
  
  &:hover {
    color: #FFD700;
    background: rgba(255, 215, 0, 0.1);
  }
`;

const SelectBox = styled.div<{ $selected: boolean }>`
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
  }
`;

const TypeBadge = styled(Badge)`
  background: rgba(255, 215, 0, 0.1);
  color: #FFD700;
  border: 1px solid rgba(255, 215, 0, 0.3);
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 3rem 1rem;
  color: #777;
`;

const EmptyStateIcon = styled.div`
  margin-bottom: 1rem;
  color: #555;
`;

const EmptyStateTitle = styled.div`
  font-size: 1.1rem;
  font-weight: 600;
  color: #F0E6D2;
  margin-bottom: 0.5rem;
`;

const EmptyStateText = styled.div`
  margin-bottom: 1.5rem;
  max-width: 300px;
  margin-left: auto;
  margin-right: auto;
`;

const BulkActions = styled.div`
  background: rgba(20, 20, 25, 0.8);
  border: 1px solid rgba(238, 232, 170, 0.3);
  border-radius: 6px;
  padding: 0.75rem 1rem;
  margin-bottom: 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
`;

const BulkActionsInfo = styled.div`
  color: #F0E6D2;
  font-weight: 500;
`;

const BulkActionsButtons = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const BulkActionButton = styled(Button)`
  font-size: 0.85rem;
  padding: 0.5rem 0.75rem;
`;

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const Modal = styled.div`
  background: rgba(20, 20, 25, 0.95);
  border: 1px solid rgba(238, 232, 170, 0.3);
  border-radius: 10px;
  max-width: 90vw;
  max-height: 90vh;
  overflow: auto;
  min-width: 400px;
`;

const ModalHeader = styled.div`
  padding: 1rem 1.5rem;
  border-bottom: 1px solid rgba(238, 232, 170, 0.2);
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const ModalTitle = styled.div`
  color: #EEE8AA;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const ModalCloseButton = styled.button`
  background: none;
  border: none;
  color: #777;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 4px;
  
  &:hover {
    color: #F0E6D2;
    background: rgba(255, 255, 255, 0.1);
  }
`;

const ModalContent = styled.div`
  padding: 1.5rem;
`;

const ModalActions = styled.div`
  padding: 1rem 1.5rem;
  border-top: 1px solid rgba(238, 232, 170, 0.2);
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
`;

const VideoPreview = styled.div`
  aspect-ratio: 16/9;
  background: rgba(0, 0, 0, 0.8);
  border-radius: 6px;
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
  
  video {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const ImagePreview = styled.div`
  max-height: 400px;
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.5);
  border-radius: 6px;
  overflow: hidden;
  
  img {
    max-width: 100%;
    max-height: 100%;
    object-fit: contain;
  }
`;

const PreviewPlaceholder = styled.div`
  aspect-ratio: 16/9;
  background: rgba(30, 30, 35, 0.8);
  border-radius: 6px;
  margin-bottom: 1rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #777;
  gap: 0.5rem;
`;

const FormGroup = styled.div`
  margin-bottom: 1rem;
`;

const FormLabel = styled.label`
  display: block;
  color: #F0E6D2;
  font-weight: 500;
  margin-bottom: 0.5rem;
`;

const FormInput = styled.input`
  width: 100%;
  padding: 0.5rem 0.75rem;
  background: rgba(30, 30, 35, 0.7);
  border: 1px solid rgba(238, 232, 170, 0.3);
  border-radius: 5px;
  color: #F0E6D2;
  font-size: 0.9rem;
  
  &:focus {
    outline: none;
    border-color: #FFD700;
    box-shadow: 0 0 0 2px rgba(255, 215, 0, 0.2);
  }
  
  &::placeholder {
    color: #777;
  }
`;

const FormTextarea = styled.textarea`
  width: 100%;
  padding: 0.5rem 0.75rem;
  background: rgba(30, 30, 35, 0.7);
  border: 1px solid rgba(238, 232, 170, 0.3);
  border-radius: 5px;
  color: #F0E6D2;
  font-size: 0.9rem;
  resize: vertical;
  min-height: 80px;
  
  &:focus {
    outline: none;
    border-color: #FFD700;
    box-shadow: 0 0 0 2px rgba(255, 215, 0, 0.2);
  }
  
  &::placeholder {
    color: #777;
  }
`;

const CopyInput = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const CopyInputField = styled.input`
  flex: 1;
  padding: 0.5rem 0.75rem;
  background: rgba(30, 30, 35, 0.7);
  border: 1px solid rgba(238, 232, 170, 0.3);
  border-radius: 5px;
  color: #F0E6D2;
  font-size: 0.9rem;
  
  &:focus {
    outline: none;
    border-color: #FFD700;
    box-shadow: 0 0 0 2px rgba(255, 215, 0, 0.2);
  }
`;

const CopyButton = styled.button`
  padding: 0.5rem 0.75rem;
  background: rgba(255, 215, 0, 0.1);
  border: 1px solid rgba(255, 215, 0, 0.3);
  border-radius: 5px;
  color: #FFD700;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background: rgba(255, 215, 0, 0.2);
  }
`;

const ExpiryBadge = styled(Badge)`
  margin-top: 0.5rem;
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
`;

const ShareOptions = styled.div`
  margin-top: 1rem;
`;

const ShareOptionsTitle = styled.div`
  color: #F0E6D2;
  font-weight: 500;
  margin-bottom: 0.5rem;
`;

const ShareOptionsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
  gap: 0.5rem;
`;

const FileMetadata = styled.div`
  background: rgba(30, 30, 35, 0.5);
  border: 1px solid rgba(238, 232, 170, 0.2);
  border-radius: 6px;
  padding: 1rem;
  margin-bottom: 1rem;
`;

const MetadataTitle = styled.div`
  color: #EEE8AA;
  font-weight: 600;
  margin-bottom: 0.75rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const MetadataGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 0.75rem;
`;

const MetadataItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;

const MetadataLabel = styled.div`
  color: #777;
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const MetadataValue = styled.div`
  color: #F0E6D2;
  font-weight: 500;
`;

const UploadProgress = styled.div`
  background: rgba(30, 30, 35, 0.5);
  border: 1px solid rgba(238, 232, 170, 0.2);
  border-radius: 6px;
  padding: 1rem;
  margin-bottom: 1rem;
`;

const ProgressBar = styled.div`
  background: rgba(30, 30, 35, 0.8);
  border-radius: 10px;
  height: 8px;
  overflow: hidden;
  margin-bottom: 0.5rem;
`;

const ProgressFill = styled.div<{ $progress: number }>`
  background: linear-gradient(90deg, #FFD700, #FFA500);
  height: 100%;
  width: ${props => props.$progress}%;
  transition: width 0.3s ease;
`;

const ProgressInfo = styled.div`
  display: flex;
  justify-content: space-between;
  color: #F0E6D2;
  font-size: 0.9rem;
`;

/**
 * Media Management System Component - FIXED VERSION
 */
const MediaManagementSystem: React.FC<MediaManagementSystemProps> = ({
  onMediaSelect,
  initialMedia = [],
  // clientId, // Optional prop is available
  // reportId,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  // --- State Declarations ---
  const [activeTab, setActiveTab] = useState<MediaFile['type'] | 'all'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filterMenuOpen, setFilterMenuOpen] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [sortBy, setSortBy] = useState<'date' | 'name' | 'size'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]); // Store required string IDs
  const [previewFile, setPreviewFile] = useState<MediaFile | null>(null);
  const [showPreviewModal, setShowPreviewModal] = useState<boolean>(false);
  const [showUploadModal, setShowUploadModal] = useState<boolean>(false);
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  const [showShareModal, setShowShareModal] = useState<boolean>(false);
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [editForm, setEditForm] = useState({ name: '', description: '', tags: '', expiryDate: '' });
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});
  
  // FIXED: Initialize state with better stability
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>(() => {
    if (initialMedia.length > 0) {
      return mapInitialMedia(initialMedia);
    }
    return generateDummyMedia();
  });
  
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  // FIXED: Initialize selection based on initial media - only run once
  const [isInitialized, setIsInitialized] = useState(false);
  
  useEffect(() => {
    if (!isInitialized && initialMedia.length > 0) {
      const mappedInitial = mapInitialMedia(initialMedia);
      const initialIds = mappedInitial.map(file => file.id);
      setSelectedFiles(initialIds);
      setIsInitialized(true);
    }
  }, [initialMedia, isInitialized]);

  // FIXED: Remove onMediaSelect from dependencies to prevent infinite loop
  const notifyParentOfSelection = useCallback(() => {
    const selectedMediaObjects = mediaFiles.filter(file => selectedFiles.includes(file.id));
    onMediaSelect(selectedMediaObjects);
  }, [selectedFiles, mediaFiles]);

  // FIXED: Use a separate effect that doesn't depend on onMediaSelect
  useEffect(() => {
    notifyParentOfSelection();
  }, [notifyParentOfSelection]);

  // --- Event Handlers & Callbacks ---
  const openFilePicker = useCallback(() => fileInputRef.current?.click(), []);
  const openVideoPicker = useCallback(() => videoInputRef.current?.click(), []);

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>, _type: 'image' | 'video') => {
    if (e.target.files?.length) {
      setUploadedFiles(prev => [...prev, ...Array.from(e.target.files || [])]);
      setShowUploadModal(true);
    }
    if (e.target) e.target.value = ''; // Allow re-selecting the same file
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault(); e.stopPropagation();
    if (e.dataTransfer.files?.length) {
      setUploadedFiles(prev => [...prev, ...Array.from(e.dataTransfer.files)]);
      setShowUploadModal(true);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => { 
    e.preventDefault(); 
    e.stopPropagation(); 
  }, []);

  // Upload Simulation - FIXED: Better callback dependencies
  const handleUpload = useCallback(async () => {
      if (uploadedFiles.length === 0) return;
      setIsUploading(true); 
      setUploadProgress(0);
      
      try {
          const newMediaFiles: MediaFile[] = [];
          for (let i = 0; i < uploadedFiles.length; i++) {
              const file = uploadedFiles[i];
              const mappedFile = mapInitialMedia([{ name: file.name, size: file.size, file: file }])[0];
              mappedFile.url = `https://cdn.example.com/${mappedFile.id}/${file.name}`;
              if(mappedFile.type === 'image' && !mappedFile.thumbnail) {
                  mappedFile.thumbnail = mappedFile.url;
              }

              newMediaFiles.push(mappedFile);
              setUploadProgress(((i + 1) / uploadedFiles.length) * 100);
              await new Promise(resolve => setTimeout(resolve, 200));
          }
          
          setMediaFiles(prev => [...newMediaFiles, ...prev]);
          setSelectedFiles(prev => [...prev, ...newMediaFiles.map(f => f.id)]);
          
          setTimeout(() => { 
              setShowUploadModal(false); 
              setIsUploading(false); 
              setUploadedFiles([]); 
          }, 500);
      } catch (error) { 
          console.error('Upload error:', error); 
          setIsUploading(false); 
      }
  }, [uploadedFiles]);

  const toggleFileSelection = useCallback((fileId: string) => {
    setSelectedFiles(prev => 
      prev.includes(fileId) 
        ? prev.filter(id => id !== fileId) 
        : [...prev, fileId]
    );
  }, []);

  const handlePreview = useCallback((file: MediaFile) => { 
    setPreviewFile(file); 
    setShowPreviewModal(true); 
  }, []);

  const handleEdit = useCallback((file: MediaFile) => {
    setPreviewFile(file);
    setEditForm({
        name: file.name,
        description: file.description || '',
        tags: file.tags?.join(', ') || '',
        expiryDate: file.expiryDate ? format(file.expiryDate, "yyyy-MM-dd'T'HH:mm") : ''
    });
    setFormErrors({});
    setShowEditModal(true);
 }, []);

  const handleShare = useCallback((file: MediaFile) => { 
    if (file.type !== 'video' && !file.shareLink) return; 
    setPreviewFile(file); 
    setCopiedLink(false); 
    setShowShareModal(true); 
  }, []);

  const handleDelete = useCallback((fileIds: string[]) => {
    const idsToDelete = fileIds.length > 0 ? fileIds : selectedFiles;
    if (idsToDelete.length === 0) return;
    setSelectedFiles(idsToDelete);
    setShowDeleteModal(true);
  }, [selectedFiles]);

  const confirmDelete = useCallback(() => {
    setMediaFiles(prev => prev.filter(file => !selectedFiles.includes(file.id)));
    setShowDeleteModal(false);
    setSelectedFiles([]);
 }, [selectedFiles]);

  const saveFileEdits = useCallback(() => {
    if (!previewFile) return;
    
    const errors: { [key: string]: string } = {};
    if (!editForm.name.trim()) errors.name = 'Name is required';
    if (Object.keys(errors).length > 0) { 
        setFormErrors(errors); 
        return; 
    }
    
    const tags = editForm.tags.split(',').map(tag => tag.trim()).filter(Boolean);
    let expiryDate: Date | undefined = undefined;
    if (editForm.expiryDate) { 
        try { 
            const d = new Date(editForm.expiryDate); 
            if (!isNaN(d.getTime())) expiryDate = d; 
        } catch { /* ignore */ } 
    }
    
    setMediaFiles(prev => prev.map(file => 
        file.id === previewFile.id 
            ? { ...file, name: editForm.name.trim(), description: editForm.description.trim(), tags, expiryDate } 
            : file
    ));
    setShowEditModal(false); 
    setFormErrors({});
 }, [previewFile, editForm]);

  const copyToClipboard = useCallback((text: string) => { 
    navigator.clipboard.writeText(text).then(() => { 
        setCopiedLink(true); 
        setTimeout(() => setCopiedLink(false), 2000); 
    }, (err) => console.error('Copy failed:', err)); 
  }, []);

  const handleBulkShare = useCallback(() => { 
    const f = mediaFiles.find(file => selectedFiles.includes(file.id) && (file.type === 'video' || file.shareLink)); 
    if (f) handleShare(f); 
  }, [mediaFiles, selectedFiles, handleShare]);

  // --- Filter and Sort Files - MEMOIZED for performance ---
  const filteredFiles = useMemo(() => {
    let files = [...mediaFiles];
    if (activeTab !== 'all') { 
        files = files.filter(file => file.type === activeTab); 
    }
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      files = files.filter(file => 
          file.name.toLowerCase().includes(term) || 
          (file.description && file.description.toLowerCase().includes(term)) || 
          (file.tags && file.tags.some(tag => tag.toLowerCase().includes(term)))
      );
    }
    return files.sort((a, b) => {
      const orderMultiplier = sortOrder === 'asc' ? 1 : -1;
      if (sortBy === 'date') {
        const dateA = a.dateCreated?.getTime() || 0;
        const dateB = b.dateCreated?.getTime() || 0;
        return (dateB - dateA) * orderMultiplier;
      }
      if (sortBy === 'name') { 
          return a.name.localeCompare(b.name) * orderMultiplier; 
      }
      if (sortBy === 'size') { 
          return ((a.size ?? 0) - (b.size ?? 0)) * orderMultiplier; 
      }
      return 0;
    });
  }, [mediaFiles, activeTab, searchTerm, sortBy, sortOrder]);

  // --- JSX Return ---
  return (
    <Section>
      <SectionTitle>
          <TitleWithIcon><Camera size={20} /> Media Evidence</TitleWithIcon>
          <ViewModeButtons>
              <ViewModeButton variant={viewMode === 'grid' ? 'default' : 'outline'} size="sm" onClick={() => setViewMode('grid')} title="Grid View"><Grid size={16} /></ViewModeButton>
              <ViewModeButton variant={viewMode === 'list' ? 'default' : 'outline'} size="sm" onClick={() => setViewMode('list')} title="List View"><List size={16} /></ViewModeButton>
          </ViewModeButtons>
      </SectionTitle>

      <MediaTabs defaultValue={activeTab} onValueChange={(value) => setActiveTab(value as MediaFile['type'] | 'all')}>
          <MediaTabsList>
              <MediaTabsTrigger value="all"><FileText size={16} /> All</MediaTabsTrigger>
              <MediaTabsTrigger value="image"><Image size={16} /> Images</MediaTabsTrigger>
              <MediaTabsTrigger value="video"><Video size={16} /> Videos</MediaTabsTrigger>
              <MediaTabsTrigger value="document"><File size={16} /> Docs</MediaTabsTrigger>
              <MediaTabsTrigger value="audio"><Volume2 size={16} /> Audio</MediaTabsTrigger>
          </MediaTabsList>
      </MediaTabs>

      <FilterRow>
          <SearchInput>
              <SearchIcon><Search size={16} /></SearchIcon>
              <Input type="text" placeholder="Search files..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </SearchInput>
          <div>
              <Button variant="outline" onClick={openFilePicker}><Upload size={16} className="mr-2" /> Upload</Button>
              <input ref={fileInputRef} type="file" multiple onChange={(e) => handleFileInputChange(e, 'image')} accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx,.txt" style={{ display: 'none' }} />
              <input ref={videoInputRef} type="file" multiple onChange={(e) => handleFileInputChange(e, 'video')} accept="video/*" style={{ display: 'none' }} />
              <FilterDropdown>
                  <FilterButton variant="outline" onClick={() => setFilterMenuOpen(!filterMenuOpen)} style={{ marginLeft: '0.5rem' }}>
                      <Filter size={16} /> Sort <ChevronDown size={14} />
                  </FilterButton>
                  <FilterMenu $open={filterMenuOpen}>
                      <FilterOption onClick={() => { setSortBy('date'); setSortOrder('desc'); setFilterMenuOpen(false); }}><Calendar size={16} /> Newest</FilterOption>
                      <FilterOption onClick={() => { setSortBy('date'); setSortOrder('asc'); setFilterMenuOpen(false); }}><Calendar size={16} /> Oldest</FilterOption>
                      <FilterOption onClick={() => { setSortBy('name'); setSortOrder('asc'); setFilterMenuOpen(false); }}><FileText size={16} /> Name (A-Z)</FilterOption>
                      <FilterOption onClick={() => { setSortBy('name'); setSortOrder('desc'); setFilterMenuOpen(false); }}><FileText size={16} /> Name (Z-A)</FilterOption>
                      <FilterOption onClick={() => { setSortBy('size'); setSortOrder('desc'); setFilterMenuOpen(false); }}><FileText size={16} /> Size (Largest)</FilterOption>
                      <FilterOption onClick={() => { setSortBy('size'); setSortOrder('asc'); setFilterMenuOpen(false); }}><FileText size={16} /> Size (Smallest)</FilterOption>
                  </FilterMenu>
              </FilterDropdown>
          </div>
      </FilterRow>

      <DropZoneContainer onDrop={handleDrop} onDragOver={handleDragOver} onClick={openFilePicker}>
          <DropZoneIcon><Upload size={48} /></DropZoneIcon>
          <DropZoneText>Drag & drop files or click to browse</DropZoneText>
          <DropZoneSubtext>Supports Images, Videos, PDFs, Documents</DropZoneSubtext>
      </DropZoneContainer>

      {selectedFiles.length > 0 && (
          <BulkActions>
              <BulkActionsInfo>{selectedFiles.length} file{selectedFiles.length !== 1 ? 's' : ''} selected</BulkActionsInfo>
              <BulkActionsButtons>
                  <BulkActionButton variant="outline" size="sm" onClick={handleBulkShare} disabled={!mediaFiles.some(f => selectedFiles.includes(f.id) && (f.type === 'video' || f.shareLink))}>
                      <Link size={14} /> Share
                  </BulkActionButton>
                  <BulkActionButton variant="destructive" size="sm" onClick={() => handleDelete(selectedFiles)}>
                      <Trash2 size={14} /> Delete Selected
                  </BulkActionButton>
              </BulkActionsButtons>
          </BulkActions>
      )}

      {filteredFiles.length > 0 ? (
        <FilesContainer $viewMode={viewMode}>
          {filteredFiles.map((file) => (
            <FileCard
                key={file.id}
                $viewMode={viewMode}
                $selected={selectedFiles.includes(file.id)}
                onClick={() => toggleFileSelection(file.id)}
            >
              <SelectBox $selected={selectedFiles.includes(file.id)} onClick={(e) => { e.stopPropagation(); toggleFileSelection(file.id); }}>
                {selectedFiles.includes(file.id) && <Check size={12} />}
              </SelectBox>
              <FilePreview $viewMode={viewMode}>
                {file.type === 'image' && <img src={file.thumbnail ?? file.url} alt={file.name} />}
                {file.type === 'video' && ( 
                    <> 
                        {file.thumbnail ? <img src={file.thumbnail ?? file.url} alt={file.name} /> : <Video />} 
                        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', background: 'rgba(0,0,0,0.5)', borderRadius: '50%', padding: '5px' }}>
                            <Play size={16} color="white" />
                        </div> 
                    </> 
                )}
                {file.type === 'document' && <FileText />}
                {file.type === 'audio' && <Volume2 />}
                {file.type === 'other' && <File />}
              </FilePreview>
              <FileCardContent $viewMode={viewMode}>
                <FileInfo $viewMode={viewMode}>
                  <FileName $viewMode={viewMode} title={file.name}>{file.name}</FileName>
                  <FileDetails $viewMode={viewMode}>
                     <span>{formatFileSize(file.size)}</span>
                     <span>{formatDateSafe(file.dateCreated)}</span>
                     {file.expiryDate && (
                        <span style={{ color: new Date() > file.expiryDate ? '#ef4444' : '#6b7280' }}>
                            {new Date() > file.expiryDate ? 'Expired' : 'Expires'}: {formatDateSafe(file.expiryDate)}
                        </span>
                     )}
                  </FileDetails>
                </FileInfo>
                <FileActions $viewMode={viewMode}>
                  <IconButton onClick={(e) => { e.stopPropagation(); handlePreview(file); }} title="Preview"><Eye size={16} /></IconButton>
                  <IconButton onClick={(e) => { e.stopPropagation(); handleEdit(file); }} title="Edit"><Pencil size={16} /></IconButton>
                  {(file.type === 'video' || file.shareLink) && <IconButton onClick={(e) => { e.stopPropagation(); handleShare(file); }} title="Share"><Link size={16} /></IconButton>}
                  <IconButton onClick={(e) => { e.stopPropagation(); handleDelete([file.id]); }} title="Delete"><Trash2 size={16} color="#ef4444" /></IconButton>
                </FileActions>
              </FileCardContent>
            </FileCard>
          ))}
        </FilesContainer>
      ) : (
        <EmptyState>
          <EmptyStateIcon><FileText size={48} /></EmptyStateIcon>
          <EmptyStateTitle>No files found</EmptyStateTitle>
          <EmptyStateText>{searchTerm ? `No files matching "${searchTerm}".` : 'Upload files using the button or drag & drop.'}</EmptyStateText>
          <Button onClick={openFilePicker}><Upload size={16} className="mr-2" /> Upload Files</Button>
        </EmptyState>
      )}

      {/* Modals would go here - abbreviated for brevity */}
      {showPreviewModal && previewFile && (
         <ModalOverlay onClick={() => setShowPreviewModal(false)}>
           <Modal onClick={(e) => e.stopPropagation()}>
             <ModalHeader>
                 <ModalTitle><FileText size={16} /> {previewFile.name}</ModalTitle>
                 <ModalCloseButton onClick={() => setShowPreviewModal(false)}><X size={18} /></ModalCloseButton>
             </ModalHeader>
             <ModalContent>
                 <FileMetadata>
                     <MetadataTitle><FileText size={16} />Details</MetadataTitle>
                     <MetadataGrid>
                         <MetadataItem><MetadataLabel>Size</MetadataLabel><MetadataValue>{formatFileSize(previewFile.size)}</MetadataValue></MetadataItem>
                         <MetadataItem><MetadataLabel>Type</MetadataLabel><MetadataValue>{previewFile.type}</MetadataValue></MetadataItem>
                         <MetadataItem><MetadataLabel>Uploaded</MetadataLabel><MetadataValue>{formatDateSafe(previewFile.dateCreated)}</MetadataValue></MetadataItem>
                         {previewFile.expiryDate && <MetadataItem><MetadataLabel>Expires</MetadataLabel><MetadataValue>{formatDateSafe(previewFile.expiryDate)}</MetadataValue></MetadataItem>}
                     </MetadataGrid>
                 </FileMetadata>
             </ModalContent>
             <ModalActions>
                 <Button variant="outline" onClick={() => setShowPreviewModal(false)}>Close</Button>
             </ModalActions>
           </Modal>
         </ModalOverlay>
       )}

    </Section>
  );
};

export default MediaManagementSystem;
