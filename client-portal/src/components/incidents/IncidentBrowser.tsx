// client-portal/src/components/incidents/IncidentBrowser.tsx
/**
 * Incident Browser Component
 * ==========================
 * Advanced incident investigation interface providing comprehensive search,
 * filtering, sorting, and export capabilities for security incident analysis
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  ChevronDownIcon, 
  ChevronUpIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowDownTrayIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  MapPinIcon,
  ShieldCheckIcon,
  EyeIcon,
  AdjustmentsHorizontalIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { ClientAPI, formatIncidentType, getSeverityColor, getStatusColor, isRecentIncident, getConfidenceBadgeColor } from '@/services/clientAPI';
import { 
  Incident, 
  IncidentFilters, 
  PaginatedResponse, 
  FilterOption,
  SortConfig 
} from '@/types/client.types';

// ===========================
// INTERFACES & TYPES
// ===========================

interface IncidentBrowserProps {
  onIncidentSelect?: (incident: Incident) => void;
  initialFilters?: IncidentFilters;
  showHeader?: boolean;
  showExport?: boolean;
  maxHeight?: string;
}

interface FilterPanelProps {
  filters: IncidentFilters;
  onFiltersChange: (filters: IncidentFilters) => void;
  filterOptions: {
    incidentTypes: FilterOption[];
    severities: FilterOption[];
    statuses: FilterOption[];
    properties: FilterOption[];
  } | null;
  isVisible: boolean;
  onToggle: () => void;
}

interface ExportProgress {
  isExporting: boolean;
  progress: number;
  message: string;
}

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
  const handleFilterChange = (field: keyof IncidentFilters, value: any) => {
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
          Advanced Filters
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
        {/* Incident Type Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Incident Type
          </label>
          <select
            value={filters.incidentType || ''}
            onChange={(e) => handleFilterChange('incidentType', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
          >
            <option value="">All Types</option>
            {filterOptions?.incidentTypes.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label} {option.count && `(${option.count})`}
              </option>
            ))}
          </select>
        </div>

        {/* Severity Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Severity Level
          </label>
          <select
            value={filters.severity || ''}
            onChange={(e) => handleFilterChange('severity', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
          >
            <option value="">All Severities</option>
            {filterOptions?.severities.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label} {option.count && `(${option.count})`}
              </option>
            ))}
          </select>
        </div>

        {/* Status Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Status
          </label>
          <select
            value={filters.status || ''}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
          >
            <option value="">All Statuses</option>
            {filterOptions?.statuses.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label} {option.count && `(${option.count})`}
              </option>
            ))}
          </select>
        </div>

        {/* Property Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Property
          </label>
          <select
            value={filters.propertyId || ''}
            onChange={(e) => handleFilterChange('propertyId', e.target.value ? parseInt(e.target.value) : undefined)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
          >
            <option value="">All Properties</option>
            {filterOptions?.properties.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label} {option.address && `- ${option.address}`}
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
// MAIN INCIDENT BROWSER COMPONENT
// ===========================

export const IncidentBrowser: React.FC<IncidentBrowserProps> = ({
  onIncidentSelect,
  initialFilters = {},
  showHeader = true,
  showExport = true,
  maxHeight = 'calc(100vh - 200px)'
}) => {
  // ===========================
  // STATE MANAGEMENT
  // ===========================

  const [incidents, setIncidents] = useState<PaginatedResponse<Incident> | null>(null);
  const [filterOptions, setFilterOptions] = useState<{
    incidentTypes: FilterOption[];
    severities: FilterOption[];
    statuses: FilterOption[];
    properties: FilterOption[];
  } | null>(null);
  
  const [filters, setFilters] = useState<IncidentFilters>(initialFilters);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortConfig, setSortConfig] = useState<SortConfig>({ 
    key: 'incidentDate', 
    direction: 'desc' 
  });
  
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [exportProgress, setExportProgress] = useState<ExportProgress>({
    isExporting: false,
    progress: 0,
    message: ''
  });

  // ===========================
  // DATA FETCHING
  // ===========================

  const loadIncidents = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await ClientAPI.Incidents.getIncidents({
        page: currentPage,
        limit: pageSize,
        sortBy: sortConfig.key,
        sortOrder: sortConfig.direction,
        search: searchQuery || undefined,
        ...filters
      });

      setIncidents(response);
    } catch (err: any) {
      console.error('Failed to load incidents:', err);
      setError(err.message || 'Failed to load incidents');
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, pageSize, sortConfig, searchQuery, filters]);

  const loadFilterOptions = useCallback(async () => {
    try {
      const options = await ClientAPI.Incidents.getFilterOptions();
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
  }, [loadFilterOptions]);

  useEffect(() => {
    loadIncidents();
  }, [loadIncidents]);

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

  const handleIncidentClick = (incident: Incident) => {
    if (onIncidentSelect) {
      onIncidentSelect(incident);
    }
  };

  const handleExport = async (format: 'csv' | 'json' = 'csv') => {
    try {
      setExportProgress({
        isExporting: true,
        progress: 0,
        message: 'Preparing export...'
      });

      await ClientAPI.Incidents.exportIncidents(
        { search: searchQuery, ...filters },
        format,
        (progress) => {
          setExportProgress(prev => ({
            ...prev,
            progress,
            message: `Exporting... ${progress}%`
          }));
        }
      );

      setExportProgress({
        isExporting: false,
        progress: 100,
        message: 'Export completed!'
      });

      // Clear success message after 3 seconds
      setTimeout(() => {
        setExportProgress({ isExporting: false, progress: 0, message: '' });
      }, 3000);

    } catch (err: any) {
      console.error('Export failed:', err);
      setExportProgress({
        isExporting: false,
        progress: 0,
        message: 'Export failed. Please try again.'
      });
    }
  };

  // ===========================
  // RENDER HELPERS
  // ===========================

  const renderSortIcon = (key: string) => {
    if (sortConfig.key !== key) {
      return <AdjustmentsHorizontalIcon className="h-4 w-4 text-gray-400" />;
    }
    return sortConfig.direction === 'asc' 
      ? <ChevronUpIcon className="h-4 w-4 text-blue-600" />
      : <ChevronDownIcon className="h-4 w-4 text-blue-600" />;
  };

  const renderTableHeader = (key: string, label: string, className: string = '') => (
    <th 
      onClick={() => handleSort(key)}
      className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-50 select-none ${className}`}
    >
      <div className="flex items-center gap-2">
        {label}
        {renderSortIcon(key)}
      </div>
    </th>
  );

  const renderIncidentRow = (incident: Incident) => (
    <tr 
      key={incident.id}
      onClick={() => handleIncidentClick(incident)}
      className="bg-white hover:bg-gray-50 cursor-pointer transition-colors duration-150"
    >
      {/* Incident Number & Type */}
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex flex-col">
          <div className="text-sm font-medium text-gray-900">
            #{incident.incidentNumber}
          </div>
          <div className="text-sm text-gray-500">
            {formatIncidentType(incident.incidentType)}
          </div>
        </div>
      </td>

      {/* Severity */}
      <td className="px-6 py-4 whitespace-nowrap">
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${getSeverityColor(incident.severity)}`}>
          {incident.severity === 'critical' && <ExclamationTriangleIcon className="h-3 w-3 mr-1" />}
          {incident.severity}
        </span>
      </td>

      {/* Status */}
      <td className="px-6 py-4 whitespace-nowrap">
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${getStatusColor(incident.status)}`}>
          {incident.status === 'resolved' && <ShieldCheckIcon className="h-3 w-3 mr-1" />}
          {incident.status}
        </span>
      </td>

      {/* Date & Time */}
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center text-sm text-gray-900">
          {isRecentIncident(incident.incidentDate) && (
            <span className="flex h-2 w-2 mr-2">
              <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
            </span>
          )}
          <div>
            <div>{new Date(incident.incidentDate).toLocaleDateString()}</div>
            <div className="text-xs text-gray-500">
              {new Date(incident.incidentDate).toLocaleTimeString([], { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </div>
          </div>
        </div>
      </td>

      {/* Location */}
      <td className="px-6 py-4">
        <div className="flex items-start">
          <MapPinIcon className="h-4 w-4 text-gray-400 mt-0.5 mr-2 flex-shrink-0" />
          <div className="text-sm text-gray-900">
            <div className="font-medium">{incident.propertyName}</div>
            <div className="text-gray-500 truncate max-w-xs">{incident.location}</div>
          </div>
        </div>
      </td>

      {/* AI Confidence */}
      <td className="px-6 py-4 whitespace-nowrap">
        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getConfidenceBadgeColor(incident.aiConfidence)}`}>
          {incident.aiConfidence}%
        </span>
      </td>

      {/* Evidence */}
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        {incident.evidenceCount > 0 ? (
          <div className="flex items-center">
            <EyeIcon className="h-4 w-4 mr-1" />
            {incident.evidenceCount} file{incident.evidenceCount !== 1 ? 's' : ''}
          </div>
        ) : (
          <span className="text-gray-400">No files</span>
        )}
      </td>

      {/* Actions */}
      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleIncidentClick(incident);
          }}
          className="text-blue-600 hover:text-blue-900 transition-colors"
        >
          View Details
        </button>
      </td>
    </tr>
  );

  const renderPagination = () => {
    if (!incidents?.data.pagination) return null;

    const { currentPage: page, totalPages, totalItems, hasNextPage, hasPrevPage } = incidents.data.pagination;

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
              <span className="font-medium">{totalItems}</span> results
            </p>
            <select
              value={pageSize}
              onChange={(e) => setPageSize(parseInt(e.target.value))}
              className="border border-gray-300 rounded px-2 py-1 text-sm"
            >
              <option value={10}>10 per page</option>
              <option value={25}>25 per page</option>
              <option value={50}>50 per page</option>
              <option value={100}>100 per page</option>
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
            <h2 className="text-xl font-bold text-gray-900">Security Incidents</h2>
          </div>
        )}
        <div className="p-8 text-center">
          <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-red-500" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Error Loading Incidents</h3>
          <p className="mt-1 text-sm text-gray-500">{error}</p>
          <div className="mt-6">
            <button
              onClick={loadIncidents}
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
    <div className="bg-white rounded-lg shadow-sm border border-gray-200" style={{ maxHeight }}>
      {/* Header */}
      {showHeader && (
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Security Incidents</h2>
              <p className="mt-1 text-sm text-gray-600">
                Comprehensive incident analysis and investigation
              </p>
            </div>
            <div className="flex items-center gap-3">
              {showExport && (
                <div className="flex items-center gap-2">
                  {exportProgress.message && (
                    <span className="text-sm text-gray-600">{exportProgress.message}</span>
                  )}
                  <button
                    onClick={() => handleExport('csv')}
                    disabled={exportProgress.isExporting}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                  >
                    <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
                    Export CSV
                  </button>
                </div>
              )}
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
              placeholder="Search incidents by number, type, location, or description..."
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

      {/* Table */}
      <div className="overflow-x-auto" style={{ maxHeight: 'calc(100% - 200px)' }}>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50 sticky top-0">
            <tr>
              {renderTableHeader('incidentNumber', 'Incident')}
              {renderTableHeader('severity', 'Severity')}
              {renderTableHeader('status', 'Status')}
              {renderTableHeader('incidentDate', 'Date & Time')}
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Location
              </th>
              {renderTableHeader('aiConfidence', 'AI Confidence')}
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Evidence
              </th>
              <th className="relative px-6 py-3">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, index) => (
                <tr key={index} className="animate-pulse">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="h-4 bg-gray-200 rounded w-24"></div>
                    <div className="h-3 bg-gray-200 rounded w-32 mt-1"></div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="h-6 bg-gray-200 rounded-full w-16"></div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="h-6 bg-gray-200 rounded-full w-20"></div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="h-4 bg-gray-200 rounded w-20"></div>
                    <div className="h-3 bg-gray-200 rounded w-16 mt-1"></div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="h-4 bg-gray-200 rounded w-32"></div>
                    <div className="h-3 bg-gray-200 rounded w-40 mt-1"></div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="h-6 bg-gray-200 rounded-full w-12"></div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="h-4 bg-gray-200 rounded w-16"></div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="h-4 bg-gray-200 rounded w-20 ml-auto"></div>
                  </td>
                </tr>
              ))
            ) : incidents?.data.items.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-6 py-12 text-center">
                  <div className="text-gray-500">
                    <ClockIcon className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No incidents found</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      {Object.keys(filters).length > 0 || searchQuery
                        ? 'Try adjusting your search criteria or filters.'
                        : 'No security incidents have been reported yet.'}
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              incidents?.data.items.map(renderIncidentRow)
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {!isLoading && renderPagination()}
    </div>
  );
};

export default IncidentBrowser;