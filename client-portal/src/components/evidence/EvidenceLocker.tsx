// client-portal/src/components/evidence/EvidenceLocker.tsx
/**
 * Evidence Locker Component
 * =========================
 * Advanced evidence management interface providing comprehensive gallery view,
 * search, filtering, and secure access to watermarked evidence files
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  ChevronDownIcon, 
  ChevronUpIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowDownTrayIcon,
  DocumentTextIcon,
  PhotoIcon,
  VideoCameraIcon,
  SpeakerWaveIcon,
  EyeIcon,
  AdjustmentsHorizontalIcon,
  XMarkIcon,
  ShieldCheckIcon,
  CalendarDaysIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  FolderIcon
} from '@heroicons/react/24/outline';
import { ClientAPI, formatFileSize, formatIncidentType } from '@/services/clientAPI';
import { 
  EvidenceFile, 
  EvidenceFilters, 
  EvidenceStats,
  PaginatedResponse, 
  FilterOption,
  SortConfig 
} from '@/types/client.types';

// ===========================
// INTERFACES & TYPES
// ===========================

interface EvidenceLockerProps {
  onEvidenceSelect?: (evidence: EvidenceFile) => void;
  initialFilters?: EvidenceFilters;
  showHeader?: boolean;
  showStats?: boolean;
  maxHeight?: string;
  viewMode?: 'grid' | 'list';
}

interface FilterPanelProps {
  filters: EvidenceFilters;
  onFiltersChange: (filters: EvidenceFilters) => void;
  filterOptions: {
    fileTypes: FilterOption[];
    incidents: FilterOption[];
  } | null;
  isVisible: boolean;
  onToggle: () => void;
}

interface StatsCardProps {
  stats: EvidenceStats;
  isLoading: boolean;
}

interface EvidenceGridProps {
  evidence: EvidenceFile[];
  isLoading: boolean;
  onEvidenceSelect: (evidence: EvidenceFile) => void;
  onDownload: (evidence: EvidenceFile) => void;
  downloadProgress: { [key: number]: number };
  viewMode: 'grid' | 'list';
}

interface DownloadProgress {
  isDownloading: boolean;
  progress: number;
  message: string;
}

// ===========================
// STATS CARD COMPONENT
// ===========================

const StatsCard: React.FC<StatsCardProps> = ({ stats, isLoading }) => {
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="text-center">
                <div className="h-8 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-16 mx-auto"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
        <FolderIcon className="h-5 w-5 text-blue-600 mr-2" />
        Evidence Storage Overview
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600 mb-1">
            {stats.totalFiles.toLocaleString()}
          </div>
          <div className="text-sm text-gray-500">Total Files</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-purple-600 mb-1">
            {stats.videoFiles.toLocaleString()}
          </div>
          <div className="text-sm text-gray-500">Video Files</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600 mb-1">
            {stats.imageFiles.toLocaleString()}
          </div>
          <div className="text-sm text-gray-500">Images</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-orange-600 mb-1">
            {stats.totalStorageFormatted}
          </div>
          <div className="text-sm text-gray-500">Storage Used</div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 pt-6 border-t border-gray-200">
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center">
            <SpeakerWaveIcon className="h-5 w-5 text-indigo-600 mr-2" />
            <span className="text-sm font-medium text-gray-700">Audio Files</span>
          </div>
          <span className="text-sm font-semibold text-indigo-600">
            {stats.audioFiles.toLocaleString()}
          </span>
        </div>
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center">
            <ShieldCheckIcon className="h-5 w-5 text-emerald-600 mr-2" />
            <span className="text-sm font-medium text-gray-700">Watermarked</span>
          </div>
          <span className="text-sm font-semibold text-emerald-600">
            {Math.round(stats.watermarkRate)}%
          </span>
        </div>
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center">
            <DocumentTextIcon className="h-5 w-5 text-gray-600 mr-2" />
            <span className="text-sm font-medium text-gray-700">Avg File Size</span>
          </div>
          <span className="text-sm font-semibold text-gray-600">
            {stats.avgFileSizeFormatted}
          </span>
        </div>
      </div>
    </div>
  );
};

// ===========================
// FILTER PANEL COMPONENT
// ===========================

const FilterPanel: React.FC<FilterPanelProps> = ({
  filters,
  onFiltersChange,
  filterOptions,
  isVisible,
  onToggle
}) => {
  const handleFilterChange = (field: keyof EvidenceFilters, value: any) => {
    onFiltersChange({
      ...filters,
      [field]: value || undefined
    });
  };

  const clearFilters = () => {
    onFiltersChange({});
  };

  const activeFilterCount = useMemo(() => {
    return Object.values(filters).filter(value => value && value !== '').length;
  }, [filters]);

  if (!isVisible) return null;

  return (
    <div className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <FunnelIcon className="h-5 w-5 text-blue-600" />
          Evidence Filters
          {activeFilterCount > 0 && (
            <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
              {activeFilterCount} active
            </span>
          )}
        </h3>
        <div className="flex items-center gap-2">
          {activeFilterCount > 0 && (
            <button
              onClick={clearFilters}
              className="text-sm text-gray-600 hover:text-gray-900 underline"
            >
              Clear All
            </button>
          )}
          <button
            onClick={onToggle}
            className="p-1 text-gray-400 hover:text-gray-600"
            title="Close Filters"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* File Type Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            File Type
          </label>
          <select
            value={filters.fileType || ''}
            onChange={(e) => handleFilterChange('fileType', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
          >
            <option value="">All Types</option>
            {filterOptions?.fileTypes.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label} {option.count && `(${option.count})`}
              </option>
            ))}
          </select>
        </div>

        {/* Incident Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Related Incident
          </label>
          <select
            value={filters.incidentId || ''}
            onChange={(e) => handleFilterChange('incidentId', e.target.value ? parseInt(e.target.value) : undefined)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
          >
            <option value="">All Incidents</option>
            {filterOptions?.incidents.map((option) => (
              <option key={option.value} value={option.value}>
                #{option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Date Range Filters */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Date From
          </label>
          <input
            type="date"
            value={filters.dateFrom || ''}
            onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Date To
          </label>
          <input
            type="date"
            value={filters.dateTo || ''}
            onChange={(e) => handleFilterChange('dateTo', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
          />
        </div>
      </div>
    </div>
  );
};

// ===========================
// EVIDENCE GRID COMPONENT
// ===========================

const EvidenceGrid: React.FC<EvidenceGridProps> = ({
  evidence,
  isLoading,
  onEvidenceSelect,
  onDownload,
  downloadProgress,
  viewMode
}) => {
  const getFileIcon = (fileType: string) => {
    const iconClass = "h-8 w-8";
    switch (fileType) {
      case 'video':
        return <VideoCameraIcon className={`${iconClass} text-blue-600`} />;
      case 'image':
        return <PhotoIcon className={`${iconClass} text-green-600`} />;
      case 'audio':
        return <SpeakerWaveIcon className={`${iconClass} text-purple-600`} />;
      default:
        return <DocumentTextIcon className={`${iconClass} text-gray-600`} />;
    }
  };

  const getFileTypeColor = (fileType: string) => {
    switch (fileType) {
      case 'video':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'image':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'audio':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getThumbnailUrl = (evidence: EvidenceFile) => {
    if (evidence.hasThumbnail) {
      return ClientAPI.Evidence.getThumbnailUrl(evidence.id);
    }
    return null;
  };

  if (isLoading) {
    return (
      <div className={`grid gap-4 ${viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' : 'grid-cols-1'}`}>
        {Array.from({ length: 8 }).map((_, index) => (
          <div key={index} className="bg-white rounded-lg border border-gray-200 animate-pulse">
            <div className="aspect-video bg-gray-200 rounded-t-lg"></div>
            <div className="p-4">
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-2/3 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (evidence.length === 0) {
    return (
      <div className="text-center py-12">
        <FolderIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">No Evidence Files</h3>
        <p className="mt-1 text-sm text-gray-500">
          No evidence files match your current search criteria.
        </p>
      </div>
    );
  }

  if (viewMode === 'list') {
    return (
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  File
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Incident
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Size
                </th>
                <th className="relative px-6 py-3">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {evidence.map((file) => (
                <tr 
                  key={file.id}
                  onClick={() => onEvidenceSelect(file)}
                  className="hover:bg-gray-50 cursor-pointer transition-colors duration-150"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      {getFileIcon(file.fileType)}
                      <div className="ml-3">
                        <div className="text-sm font-medium text-gray-900 truncate max-w-xs" title={file.originalFileName}>
                          {file.originalFileName}
                        </div>
                        {file.hasWatermark && (
                          <div className="flex items-center text-xs text-blue-600 mt-1">
                            <ShieldCheckIcon className="h-3 w-3 mr-1" />
                            Watermarked
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getFileTypeColor(file.fileType)}`}>
                      {file.fileType.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">#{file.incidentNumber}</div>
                    <div className="text-xs text-gray-500">{formatIncidentType(file.incidentType)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(file.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {file.fileSizeFormatted}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDownload(file);
                      }}
                      disabled={downloadProgress[file.id] !== undefined}
                      className="text-blue-600 hover:text-blue-900 transition-colors disabled:opacity-50"
                    >
                      {downloadProgress[file.id] !== undefined ? (
                        `${downloadProgress[file.id]}%`
                      ) : (
                        'Download'
                      )}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {evidence.map((file) => {
        const thumbnailUrl = getThumbnailUrl(file);
        
        return (
          <div 
            key={file.id} 
            className="bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow duration-200 cursor-pointer"
            onClick={() => onEvidenceSelect(file)}
          >
            {/* Thumbnail or Icon */}
            <div className="aspect-video bg-gray-100 rounded-t-lg flex items-center justify-center relative overflow-hidden">
              {thumbnailUrl ? (
                <img 
                  src={thumbnailUrl}
                  alt={file.originalFileName}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    // Fallback to icon if thumbnail fails to load
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    target.nextElementSibling?.classList.remove('hidden');
                  }}
                />
              ) : null}
              <div className={`${thumbnailUrl ? 'hidden' : ''} flex flex-col items-center`}>
                {getFileIcon(file.fileType)}
                <span className="text-xs text-gray-500 mt-2">{file.fileType.toUpperCase()}</span>
              </div>
              
              {/* File Type Badge */}
              <div className="absolute top-2 left-2">
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getFileTypeColor(file.fileType)}`}>
                  {file.fileType.toUpperCase()}
                </span>
              </div>
              
              {/* Watermark Indicator */}
              {file.hasWatermark && (
                <div className="absolute top-2 right-2">
                  <ShieldCheckIcon className="h-5 w-5 text-blue-600 bg-white bg-opacity-90 rounded-full p-1" title="Watermarked" />
                </div>
              )}
            </div>
            
            {/* File Info */}
            <div className="p-4">
              <h4 className="text-sm font-medium text-gray-900 truncate mb-2" title={file.originalFileName}>
                {file.originalFileName}
              </h4>
              
              <div className="text-xs text-gray-500 space-y-1 mb-3">
                <div className="flex items-center">
                  <DocumentTextIcon className="h-3 w-3 mr-1" />
                  Incident #{file.incidentNumber}
                </div>
                <div className="flex items-center">
                  <CalendarDaysIcon className="h-3 w-3 mr-1" />
                  {new Date(file.createdAt).toLocaleDateString()}
                </div>
                <div className="flex items-center">
                  <span className="text-xs">📊</span>
                  <span className="ml-1">{file.fileSizeFormatted}</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">
                  {file.propertyName}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDownload(file);
                  }}
                  disabled={downloadProgress[file.id] !== undefined}
                  className="inline-flex items-center px-2 py-1 text-xs border border-gray-300 rounded hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  <ArrowDownTrayIcon className="h-3 w-3 mr-1" />
                  {downloadProgress[file.id] !== undefined ? (
                    `${downloadProgress[file.id]}%`
                  ) : (
                    'Download'
                  )}
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ===========================
// MAIN EVIDENCE LOCKER COMPONENT
// ===========================

export const EvidenceLocker: React.FC<EvidenceLockerProps> = ({
  onEvidenceSelect,
  initialFilters = {},
  showHeader = true,
  showStats = true,
  maxHeight = 'calc(100vh - 200px)',
  viewMode: initialViewMode = 'grid'
}) => {
  // ===========================
  // STATE MANAGEMENT
  // ===========================

  const [evidenceFiles, setEvidenceFiles] = useState<PaginatedResponse<EvidenceFile> | null>(null);
  const [evidenceStats, setEvidenceStats] = useState<EvidenceStats | null>(null);
  const [filterOptions, setFilterOptions] = useState<{
    fileTypes: FilterOption[];
    incidents: FilterOption[];
  } | null>(null);
  
  const [filters, setFilters] = useState<EvidenceFilters>(initialFilters);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortConfig, setSortConfig] = useState<SortConfig>({ 
    key: 'createdAt', 
    direction: 'desc' 
  });
  
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(initialViewMode);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isStatsLoading, setIsStatsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState<{ [key: number]: number }>({});

  // ===========================
  // DATA FETCHING
  // ===========================

  const loadEvidenceFiles = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await ClientAPI.Evidence.getEvidenceFiles({
        page: currentPage,
        limit: pageSize,
        sortBy: sortConfig.key,
        sortOrder: sortConfig.direction,
        ...filters
      });

      setEvidenceFiles(response);
    } catch (err: any) {
      console.error('Failed to load evidence files:', err);
      setError(err.message || 'Failed to load evidence files');
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, pageSize, sortConfig, filters]);

  const loadEvidenceStats = useCallback(async () => {
    try {
      setIsStatsLoading(true);
      const stats = await ClientAPI.Evidence.getEvidenceStats();
      setEvidenceStats(stats);
    } catch (err: any) {
      console.error('Failed to load evidence stats:', err);
      // Don't set error state for stats since it's not critical
    } finally {
      setIsStatsLoading(false);
    }
  }, []);

  const loadFilterOptions = useCallback(async () => {
    try {
      const options = await ClientAPI.Evidence.getFilterOptions();
      setFilterOptions(options);
    } catch (err: any) {
      console.error('Failed to load filter options:', err);
      // Don't set error state for this since it's not critical
    }
  }, []);

  // ===========================
  // EFFECTS
  // ===========================

  useEffect(() => {
    loadFilterOptions();
    if (showStats) {
      loadEvidenceStats();
    }
  }, [loadFilterOptions, loadEvidenceStats, showStats]);

  useEffect(() => {
    loadEvidenceFiles();
  }, [loadEvidenceFiles]);

  // Reset to first page when filters change
  useEffect(() => {
    if (currentPage !== 1) {
      setCurrentPage(1);
    }
  }, [filters, searchQuery]);

  // ===========================
  // EVENT HANDLERS
  // ===========================

  const handleSort = (key: string) => {
    setSortConfig(prevSort => ({
      key,
      direction: prevSort.key === key && prevSort.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const handleEvidenceClick = (evidence: EvidenceFile) => {
    if (onEvidenceSelect) {
      onEvidenceSelect(evidence);
    }
  };

  const handleDownload = async (evidence: EvidenceFile) => {
    try {
      setDownloadProgress(prev => ({ ...prev, [evidence.id]: 0 }));

      await ClientAPI.Evidence.downloadEvidenceFile(
        evidence.id,
        evidence.originalFileName,
        (progress) => {
          setDownloadProgress(prev => ({ ...prev, [evidence.id]: progress }));
        }
      );

      // Clear progress after completion
      setTimeout(() => {
        setDownloadProgress(prev => {
          const newState = { ...prev };
          delete newState[evidence.id];
          return newState;
        });
      }, 2000);

    } catch (err: any) {
      console.error('Download failed:', err);
      setDownloadProgress(prev => {
        const newState = { ...prev };
        delete newState[evidence.id];
        return newState;
      });
    }
  };

  // ===========================
  // RENDER HELPERS
  // ===========================

  const renderPagination = () => {
    if (!evidenceFiles?.data.pagination) return null;

    const { currentPage: page, totalPages, totalItems, hasNextPage, hasPrevPage } = evidenceFiles.data.pagination;

    return (
      <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
        <div className="flex-1 flex justify-between sm:hidden">
          <button
            onClick={() => setCurrentPage(page - 1)}
            disabled={!hasPrevPage}
            className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <button
            onClick={() => setCurrentPage(page + 1)}
            disabled={!hasNextPage}
            className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
        <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <p className="text-sm text-gray-700">
              Showing <span className="font-medium">{((page - 1) * pageSize) + 1}</span> to{' '}
              <span className="font-medium">{Math.min(page * pageSize, totalItems)}</span> of{' '}
              <span className="font-medium">{totalItems}</span> files
            </p>
            <select
              value={pageSize}
              onChange={(e) => setPageSize(parseInt(e.target.value))}
              className="border border-gray-300 rounded px-2 py-1 text-sm"
            >
              <option value={10}>10 per page</option>
              <option value={20}>20 per page</option>
              <option value={40}>40 per page</option>
              <option value={80}>80 per page</option>
            </select>
          </div>
          <div>
            <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
              <button
                onClick={() => setCurrentPage(page - 1)}
                disabled={!hasPrevPage}
                className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              
              {/* Page numbers */}
              {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                let pageNum;
                if (totalPages <= 7) {
                  pageNum = i + 1;
                } else if (page <= 4) {
                  pageNum = i + 1;
                } else if (page >= totalPages - 3) {
                  pageNum = totalPages - 6 + i;
                } else {
                  pageNum = page - 3 + i;
                }

                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                      page === pageNum
                        ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                        : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}

              <button
                onClick={() => setCurrentPage(page + 1)}
                disabled={!hasNextPage}
                className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </nav>
          </div>
        </div>
      </div>
    );
  };

  // ===========================
  // ERROR STATE
  // ===========================

  if (error && !isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {showHeader && (
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">Evidence Locker</h2>
          </div>
        )}
        <div className="p-8 text-center">
          <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-red-500" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Error Loading Evidence Files</h3>
          <p className="mt-1 text-sm text-gray-500">{error}</p>
          <div className="mt-6">
            <button
              onClick={loadEvidenceFiles}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ===========================
  // MAIN RENDER
  // ===========================

  return (
    <div className="space-y-6" style={{ maxHeight }}>
      {/* Evidence Statistics */}
      {showStats && evidenceStats && (
        <StatsCard stats={evidenceStats} isLoading={isStatsLoading} />
      )}

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {/* Header */}
        {showHeader && (
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Evidence Locker</h2>
                <p className="mt-1 text-sm text-gray-600">
                  Secure access to watermarked evidence files
                </p>
              </div>
              <div className="flex items-center gap-3">
                {/* View Mode Toggle */}
                <div className="flex bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`px-3 py-1 text-sm rounded-md transition-colors ${
                      viewMode === 'grid' 
                        ? 'bg-white text-gray-900 shadow-sm' 
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Grid
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`px-3 py-1 text-sm rounded-md transition-colors ${
                      viewMode === 'list' 
                        ? 'bg-white text-gray-900 shadow-sm' 
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    List
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Search & Controls */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search by filename, incident, or location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                showFilters ? 'bg-blue-50 text-blue-700 border-blue-300' : 'text-gray-700 bg-white hover:bg-gray-50'
              }`}
            >
              <FunnelIcon className="h-4 w-4 mr-2" />
              Filters
              {Object.keys(filters).length > 0 && (
                <span className="ml-2 bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                  {Object.keys(filters).length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Filter Panel */}
        <FilterPanel
          filters={filters}
          onFiltersChange={setFilters}
          filterOptions={filterOptions}
          isVisible={showFilters}
          onToggle={() => setShowFilters(!showFilters)}
        />

        {/* Evidence Grid/List */}
        <div className="p-6">
          <EvidenceGrid
            evidence={evidenceFiles?.data.items || []}
            isLoading={isLoading}
            onEvidenceSelect={handleEvidenceClick}
            onDownload={handleDownload}
            downloadProgress={downloadProgress}
            viewMode={viewMode}
          />
        </div>

        {/* Pagination */}
        {!isLoading && renderPagination()}
      </div>
    </div>
  );
};

export default EvidenceLocker;