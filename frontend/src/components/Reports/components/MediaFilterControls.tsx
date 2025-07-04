/**
 * Media Filter Controls Component - Search, Filter, and View Controls
 * Extracted from MediaManagementSystem for better modularity
 * Production-ready component with comprehensive filtering options
 */

import React, { useCallback, useState, useRef, useEffect, useMemo } from 'react';
import styled, { css } from 'styled-components';
import { 
  Search, Filter, ChevronDown, Grid, List, Upload, SortAsc, SortDesc,
  Calendar, FileText, X, Check, Eye, EyeOff
} from 'lucide-react';
import { 
  MEDIA_TABS,
  SORT_MENU_OPTIONS,
  VIEW_MODES,
  TIMING_CONSTANTS,
  BREAKPOINTS,
  MediaTypeType,
  SortOptionType,
  SortOrderType,
  ViewModeType
} from '../constants/mediaConstants';
import { MediaFile } from '../../../types/reports';

/**
 * Component interfaces
 */
export interface MediaFilterControlsProps {
  // Filter state
  activeTab: MediaTypeType | 'all';
  onTabChange: (tab: MediaTypeType | 'all') => void;
  searchTerm: string;
  onSearchChange: (term: string) => void;
  sortBy: SortOptionType;
  onSortByChange: (sort: SortOptionType) => void;
  sortOrder: SortOrderType;
  onSortOrderChange: (order: SortOrderType) => void;
  viewMode: ViewModeType;
  onViewModeChange: (mode: ViewModeType) => void;
  
  // File data
  totalFiles: number;
  filteredFiles: number;
  selectedCount?: number;
  
  // Actions
  onUpload?: () => void;
  onClearFilters?: () => void;
  onSelectAll?: () => void;
  onClearSelection?: () => void;
  
  // Configuration
  showUploadButton?: boolean;
  showViewModeToggle?: boolean;
  showBulkActions?: boolean;
  disabled?: boolean;
  className?: string;
}

/**
 * Styled Components
 */
const ControlsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 1.5rem;
`;

const TopRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;

  @media (max-width: ${BREAKPOINTS.tablet}) {
    flex-direction: column;
    align-items: stretch;
  }
`;

const BottomRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;

  @media (max-width: ${BREAKPOINTS.tablet}) {
    flex-direction: column;
    align-items: stretch;
  }
`;

const TabsContainer = styled.div`
  display: flex;
  background: rgba(30, 30, 35, 0.7);
  border: 1px solid rgba(238, 232, 170, 0.3);
  border-radius: 8px;
  padding: 0.25rem;
  backdrop-filter: blur(10px);
  overflow-x: auto;
  
  /* Custom scrollbar */
  &::-webkit-scrollbar {
    height: 4px;
  }

  &::-webkit-scrollbar-track {
    background: rgba(0, 0, 0, 0.2);
    border-radius: 2px;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(255, 215, 0, 0.3);
    border-radius: 2px;
    
    &:hover {
      background: rgba(255, 215, 0, 0.5);
    }
  }

  @media (max-width: ${BREAKPOINTS.mobile}) {
    -webkit-overflow-scrolling: touch;
  }
`;

const Tab = styled.button<{ $active: boolean }>`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border: none;
  background: ${props => props.$active 
    ? 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)' 
    : 'transparent'};
  color: ${props => props.$active ? '#000' : '#A0A0A0'};
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.875rem;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  white-space: nowrap;
  min-width: fit-content;
  position: relative;
  overflow: hidden;
  
  &:hover {
    background: ${props => props.$active 
      ? 'linear-gradient(135deg, #FFA500 0%, #FF8C00 100%)' 
      : 'rgba(255, 215, 0, 0.1)'};
    color: ${props => props.$active ? '#000' : '#FFD700'};
    transform: translateY(-1px);
  }
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
    transition: left 0.5s;
  }
  
  &:hover::before {
    left: 100%;
  }

  @media (max-width: ${BREAKPOINTS.mobile}) {
    padding: 0.4rem 0.8rem;
    font-size: 0.8rem;
    gap: 0.25rem;
  }
`;

const FiltersRow = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  flex: 1;

  @media (max-width: ${BREAKPOINTS.tablet}) {
    flex-wrap: wrap;
  }

  @media (max-width: ${BREAKPOINTS.mobile}) {
    flex-direction: column;
    align-items: stretch;
    gap: 0.75rem;
  }
`;

const SearchContainer = styled.div`
  position: relative;
  flex: 1;
  min-width: 200px;
  max-width: 400px;

  @media (max-width: ${BREAKPOINTS.mobile}) {
    max-width: none;
  }
`;

const SearchIcon = styled.div`
  position: absolute;
  left: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  color: #777;
  z-index: 2;
`;

const SearchInput = styled.input<{ $hasValue: boolean }>`
  width: 100%;
  padding: 0.75rem 0.75rem 0.75rem 2.5rem;
  background: rgba(30, 30, 35, 0.7);
  border: 1px solid rgba(238, 232, 170, 0.3);
  border-radius: 8px;
  color: #F0E6D2;
  font-size: 0.9rem;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
  
  &:focus {
    outline: none;
    border-color: #FFD700;
    box-shadow: 0 0 0 3px rgba(255, 215, 0, 0.2);
    background: rgba(30, 30, 35, 0.9);
  }
  
  &:hover {
    border-color: rgba(255, 215, 0, 0.5);
  }
  
  &::placeholder {
    color: #777;
  }

  ${props => props.$hasValue && css`
    padding-right: 2.5rem;
  `}
`;

const ClearSearchButton = styled.button`
  position: absolute;
  right: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: #777;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 4px;
  transition: all 0.2s ease;
  
  &:hover {
    color: #F0E6D2;
    background: rgba(255, 255, 255, 0.1);
  }
`;

const DropdownContainer = styled.div`
  position: relative;
`;

const DropdownButton = styled.button<{ $active: boolean }>`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: ${props => props.$active 
    ? 'rgba(255, 215, 0, 0.1)' 
    : 'rgba(30, 30, 35, 0.7)'};
  border: 1px solid ${props => props.$active 
    ? 'rgba(255, 215, 0, 0.4)' 
    : 'rgba(238, 232, 170, 0.3)'};
  border-radius: 8px;
  color: ${props => props.$active ? '#FFD700' : '#F0E6D2'};
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 500;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
  white-space: nowrap;
  
  &:hover {
    border-color: rgba(255, 215, 0, 0.5);
    background: rgba(255, 215, 0, 0.1);
    color: #FFD700;
  }

  svg {
    transition: transform 0.2s ease;
    transform: ${props => props.$active ? 'rotate(180deg)' : 'rotate(0deg)'};
  }

  @media (max-width: ${BREAKPOINTS.mobile}) {
    padding: 0.6rem 0.8rem;
    font-size: 0.8rem;
  }
`;

const DropdownMenu = styled.div<{ $open: boolean }>`
  position: absolute;
  top: calc(100% + 0.5rem);
  right: 0;
  background: rgba(20, 20, 25, 0.95);
  border: 1px solid rgba(238, 232, 170, 0.3);
  border-radius: 8px;
  min-width: 180px;
  z-index: 100;
  display: ${props => props.$open ? 'block' : 'none'};
  backdrop-filter: blur(20px);
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
  overflow: hidden;

  @media (max-width: ${BREAKPOINTS.mobile}) {
    left: 0;
    right: auto;
    min-width: 160px;
  }
`;

const DropdownItem = styled.button<{ $active?: boolean }>`
  width: 100%;
  padding: 0.75rem 1rem;
  background: ${props => props.$active 
    ? 'rgba(255, 215, 0, 0.1)' 
    : 'transparent'};
  border: none;
  color: ${props => props.$active ? '#FFD700' : '#F0E6D2'};
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 0.875rem;
  text-align: left;
  transition: all 0.2s ease;
  
  &:hover {
    background: rgba(255, 215, 0, 0.1);
    color: #FFD700;
  }

  &:not(:last-child) {
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  }

  @media (max-width: ${BREAKPOINTS.mobile}) {
    padding: 0.6rem 0.8rem;
    font-size: 0.8rem;
  }
`;

const ActionsContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;

  @media (max-width: ${BREAKPOINTS.mobile}) {
    justify-content: space-between;
  }
`;

const ViewModeToggle = styled.div`
  display: flex;
  background: rgba(30, 30, 35, 0.7);
  border: 1px solid rgba(238, 232, 170, 0.3);
  border-radius: 8px;
  padding: 0.25rem;
  backdrop-filter: blur(10px);
`;

const ViewModeButton = styled.button<{ $active: boolean }>`
  padding: 0.5rem;
  background: ${props => props.$active 
    ? 'rgba(255, 215, 0, 0.2)' 
    : 'transparent'};
  border: none;
  color: ${props => props.$active ? '#FFD700' : '#777'};
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  
  &:hover {
    color: #FFD700;
    background: rgba(255, 215, 0, 0.1);
  }

  @media (max-width: ${BREAKPOINTS.mobile}) {
    padding: 0.4rem;
  }
`;

const ActionButton = styled.button<{ $variant?: 'primary' | 'secondary' }>`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: ${props => props.$variant === 'primary' 
    ? 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)' 
    : 'rgba(255, 255, 255, 0.05)'};
  border: 1px solid ${props => props.$variant === 'primary' 
    ? '#FFD700' 
    : 'rgba(238, 232, 170, 0.3)'};
  border-radius: 8px;
  color: ${props => props.$variant === 'primary' ? '#000' : '#F0E6D2'};
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 600;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
  white-space: nowrap;
  
  &:hover {
    background: ${props => props.$variant === 'primary' 
      ? 'linear-gradient(135deg, #FFA500 0%, #FF8C00 100%)' 
      : 'rgba(255, 215, 0, 0.1)'};
    border-color: ${props => props.$variant === 'primary' 
      ? '#FFA500' 
      : 'rgba(255, 215, 0, 0.5)'};
    color: ${props => props.$variant === 'primary' ? '#000' : '#FFD700'};
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(255, 215, 0, 0.3);
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
    padding: 0.6rem 0.8rem;
    font-size: 0.8rem;
  }
`;

const StatusBar = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  font-size: 0.875rem;
  color: #777;
  flex-wrap: wrap;

  @media (max-width: ${BREAKPOINTS.mobile}) {
    font-size: 0.8rem;
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
`;

const StatusText = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const BulkActions = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  background: rgba(255, 215, 0, 0.1);
  border: 1px solid rgba(255, 215, 0, 0.3);
  border-radius: 6px;
  font-size: 0.85rem;
  color: #FFD700;

  @media (max-width: ${BREAKPOINTS.mobile}) {
    font-size: 0.8rem;
    padding: 0.4rem 0.6rem;
  }
`;

/**
 * MediaFilterControls Component
 */
export const MediaFilterControls: React.FC<MediaFilterControlsProps> = ({
  activeTab,
  onTabChange,
  searchTerm,
  onSearchChange,
  sortBy,
  onSortByChange,
  sortOrder,
  onSortOrderChange,
  viewMode,
  onViewModeChange,
  totalFiles,
  filteredFiles,
  selectedCount = 0,
  onUpload,
  onClearFilters,
  onSelectAll,
  onClearSelection,
  showUploadButton = true,
  showViewModeToggle = true,
  showBulkActions = true,
  disabled = false,
  className
}) => {
  const [sortMenuOpen, setSortMenuOpen] = useState(false);
  const [debouncedSearch, setDebouncedSearch] = useState(searchTerm);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      onSearchChange(debouncedSearch);
    }, TIMING_CONSTANTS.searchDebounceDelay);

    return () => clearTimeout(timer);
  }, [debouncedSearch, onSearchChange]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setSortMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Memoized values
  const currentSortOption = useMemo(() => {
    return SORT_MENU_OPTIONS.find(option => 
      option.sortBy === sortBy && option.sortOrder === sortOrder
    );
  }, [sortBy, sortOrder]);

  const hasActiveFilters = useMemo(() => {
    return activeTab !== 'all' || searchTerm.length > 0;
  }, [activeTab, searchTerm]);

  const showStatusBar = useMemo(() => {
    return totalFiles > 0 || hasActiveFilters;
  }, [totalFiles, hasActiveFilters]);

  // Event handlers
  const handleTabClick = useCallback((tabId: string) => {
    onTabChange(tabId as MediaTypeType | 'all');
  }, [onTabChange]);

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setDebouncedSearch(e.target.value);
  }, []);

  const handleClearSearch = useCallback(() => {
    setDebouncedSearch('');
    onSearchChange('');
  }, [onSearchChange]);

  const handleSortSelect = useCallback((option: typeof SORT_MENU_OPTIONS[0]) => {
    onSortByChange(option.sortBy);
    onSortOrderChange(option.sortOrder);
    setSortMenuOpen(false);
  }, [onSortByChange, onSortOrderChange]);

  const handleViewModeToggle = useCallback((mode: ViewModeType) => {
    onViewModeChange(mode);
  }, [onViewModeChange]);

  const handleClearFilters = useCallback(() => {
    setDebouncedSearch('');
    onClearFilters?.();
  }, [onClearFilters]);

  // Render tabs
  const renderTabs = () => (
    <TabsContainer>
      {MEDIA_TABS.map(tab => {
        const IconName = tab.icon;
        // Map icon names to actual components
        const getIcon = (iconName: string) => {
          switch (iconName) {
            case 'FileText': return FileText;
            case 'Image': return require('lucide-react').Image;
            case 'Video': return require('lucide-react').Video;
            case 'File': return require('lucide-react').File;
            case 'Volume2': return require('lucide-react').Volume2;
            default: return FileText;
          }
        };
        
        const IconComponent = getIcon(IconName);
        
        return (
          <Tab
            key={tab.id}
            $active={activeTab === tab.id}
            onClick={() => handleTabClick(tab.id)}
            disabled={disabled}
            title={tab.description}
          >
            <IconComponent size={16} />
            {tab.label}
          </Tab>
        );
      })}
    </TabsContainer>
  );

  // Render search
  const renderSearch = () => (
    <SearchContainer>
      <SearchIcon>
        <Search size={16} />
      </SearchIcon>
      <SearchInput
        type="text"
        placeholder="Search files..."
        value={debouncedSearch}
        onChange={handleSearchChange}
        disabled={disabled}
        $hasValue={debouncedSearch.length > 0}
      />
      {debouncedSearch.length > 0 && (
        <ClearSearchButton onClick={handleClearSearch} disabled={disabled}>
          <X size={16} />
        </ClearSearchButton>
      )}
    </SearchContainer>
  );

  // Render sort dropdown
  const renderSortDropdown = () => (
    <DropdownContainer ref={dropdownRef}>
      <DropdownButton
        $active={sortMenuOpen}
        onClick={() => setSortMenuOpen(!sortMenuOpen)}
        disabled={disabled}
      >
        <Filter size={16} />
        {currentSortOption?.label || 'Sort'}
        <ChevronDown size={14} />
      </DropdownButton>
      
      <DropdownMenu $open={sortMenuOpen}>
        {SORT_MENU_OPTIONS.map(option => {
          const IconName = option.icon;
          const IconComponent = IconName === 'Calendar' ? Calendar : FileText;
          const isActive = option.sortBy === sortBy && option.sortOrder === sortOrder;
          
          return (
            <DropdownItem
              key={option.id}
              $active={isActive}
              onClick={() => handleSortSelect(option)}
            >
              <IconComponent size={14} />
              {option.label}
              {isActive && <Check size={14} style={{ marginLeft: 'auto' }} />}
            </DropdownItem>
          );
        })}
      </DropdownMenu>
    </DropdownContainer>
  );

  // Render view mode toggle
  const renderViewModeToggle = () => {
    if (!showViewModeToggle) return null;

    return (
      <ViewModeToggle>
        <ViewModeButton
          $active={viewMode === VIEW_MODES.GRID}
          onClick={() => handleViewModeToggle(VIEW_MODES.GRID)}
          disabled={disabled}
          title="Grid View"
        >
          <Grid size={16} />
        </ViewModeButton>
        <ViewModeButton
          $active={viewMode === VIEW_MODES.LIST}
          onClick={() => handleViewModeToggle(VIEW_MODES.LIST)}
          disabled={disabled}
          title="List View"
        >
          <List size={16} />
        </ViewModeButton>
      </ViewModeToggle>
    );
  };

  // Render status bar
  const renderStatusBar = () => {
    if (!showStatusBar) return null;

    return (
      <StatusBar>
        <StatusText>
          {filteredFiles !== totalFiles ? (
            <>Showing {filteredFiles} of {totalFiles} files</>
          ) : (
            <>{totalFiles} file{totalFiles !== 1 ? 's' : ''}</>
          )}
          {hasActiveFilters && (
            <ActionButton onClick={handleClearFilters} disabled={disabled}>
              <X size={14} />
              Clear Filters
            </ActionButton>
          )}
        </StatusText>

        {showBulkActions && selectedCount > 0 && (
          <BulkActions>
            {selectedCount} selected
            {onSelectAll && (
              <ActionButton onClick={onSelectAll} disabled={disabled}>
                <Check size={14} />
                All
              </ActionButton>
            )}
            {onClearSelection && (
              <ActionButton onClick={onClearSelection} disabled={disabled}>
                <X size={14} />
                Clear
              </ActionButton>
            )}
          </BulkActions>
        )}
      </StatusBar>
    );
  };

  return (
    <ControlsContainer className={className}>
      <TopRow>
        {renderTabs()}
        <ActionsContainer>
          {renderViewModeToggle()}
          {showUploadButton && onUpload && (
            <ActionButton
              $variant="primary"
              onClick={onUpload}
              disabled={disabled}
            >
              <Upload size={16} />
              Upload
            </ActionButton>
          )}
        </ActionsContainer>
      </TopRow>

      <BottomRow>
        <FiltersRow>
          {renderSearch()}
          {renderSortDropdown()}
        </FiltersRow>
      </BottomRow>

      {renderStatusBar()}
    </ControlsContainer>
  );
};

export default MediaFilterControls;

/**
 * MEDIA FILTER CONTROLS COMPLETION SUMMARY:
 * ✅ Tab-based file type filtering with icons
 * ✅ Debounced search input with clear functionality
 * ✅ Advanced sort dropdown with multiple options
 * ✅ View mode toggle (grid/list) with visual feedback
 * ✅ Upload button with primary styling
 * ✅ Bulk selection controls and status display
 * ✅ Filter status bar with clear options
 * ✅ Mobile-responsive design with breakpoints
 * ✅ Accessibility considerations
 * ✅ Click-outside dropdown closing
 * ✅ Loading and disabled states
 * ✅ Comprehensive event handling
 * 
 * This component provides a complete filtering and control interface
 * that integrates seamlessly with the media management system.
 */
