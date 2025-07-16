/**
 * APEX AI FACE PROFILE LIST COMPONENT
 * ===================================
 * Comprehensive face profiles management interface
 * 
 * Features:
 * - Grid/list view toggle
 * - Search and filtering
 * - Pagination
 * - Bulk operations
 * - Real-time updates
 * - Status management
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import styled from 'styled-components';
import {
  Search,
  Filter,
  Grid,
  List,
  Users,
  Plus,
  RefreshCw,
  Download,
  Upload,
  ChevronLeft,
  ChevronRight,
  CheckSquare,
  Square,
  Trash2,
  Archive,
  AlertCircle,
  Loader
} from 'lucide-react';

import FaceProfileCard from './FaceProfileCard';

// Styled Components
const ListContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  height: 100%;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
  
  @media (max-width: 768px) {
    flex-direction: column;
    align-items: stretch;
  }
`;

const Title = styled.h2`
  color: white;
  font-size: 1.3rem;
  font-weight: 600;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const HeaderActions = styled.div`
  display: flex;
  gap: 1rem;
  align-items: center;
  flex-wrap: wrap;
`;

const SearchBar = styled.div`
  position: relative;
  flex: 1;
  min-width: 250px;
  
  input {
    width: 100%;
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 8px;
    padding: 0.75rem 2.5rem 0.75rem 1rem;
    color: white;
    font-size: 0.9rem;
    
    &::placeholder {
      color: rgba(255, 255, 255, 0.5);
    }
    
    &:focus {
      outline: none;
      border-color: #4ade80;
      background: rgba(255, 255, 255, 0.15);
    }
  }
  
  .search-icon {
    position: absolute;
    right: 0.75rem;
    top: 50%;
    transform: translateY(-50%);
    color: rgba(255, 255, 255, 0.5);
    pointer-events: none;
  }
`;

const FilterSection = styled.div`
  display: flex;
  gap: 1rem;
  align-items: center;
  flex-wrap: wrap;
`;

const FilterSelect = styled.select`
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 6px;
  padding: 0.5rem;
  color: white;
  font-size: 0.9rem;
  cursor: pointer;
  
  &:focus {
    outline: none;
    border-color: #4ade80;
  }
  
  option {
    background: #1f2937;
    color: white;
  }
`;

const ViewToggle = styled.div`
  display: flex;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 6px;
  overflow: hidden;
`;

const ViewButton = styled.button`
  background: rgba(255, 255, 255, 0.1);
  border: none;
  color: white;
  padding: 0.5rem;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  
  &:hover {
    background: rgba(255, 255, 255, 0.2);
  }
  
  &.active {
    background: #4ade80;
    color: white;
  }
`;

const ActionButton = styled.button`
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 6px;
  color: white;
  padding: 0.5rem 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
  
  &:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.2);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  &.primary {
    background: #4ade80;
    border-color: #4ade80;
    
    &:hover:not(:disabled) {
      background: #22c55e;
    }
  }
  
  &.danger {
    color: #ef4444;
    border-color: #ef4444;
    
    &:hover:not(:disabled) {
      background: rgba(239, 68, 68, 0.1);
    }
  }
`;

const StatsBar = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.8);
  
  .stats-left {
    display: flex;
    gap: 2rem;
  }
  
  .stats-right {
    display: flex;
    gap: 1rem;
    align-items: center;
  }
  
  .stat-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    
    .stat-value {
      color: white;
      font-weight: 600;
    }
  }
`;

const BulkActions = styled.div`
  display: flex;
  gap: 1rem;
  align-items: center;
  padding: 1rem;
  background: rgba(59, 130, 246, 0.1);
  border: 1px solid rgba(59, 130, 246, 0.3);
  border-radius: 8px;
  margin-bottom: 1rem;
  
  .selection-info {
    flex: 1;
    color: white;
    font-size: 0.9rem;
  }
  
  .bulk-button {
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 6px;
    color: white;
    padding: 0.5rem 1rem;
    cursor: pointer;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.9rem;
    
    &:hover {
      background: rgba(255, 255, 255, 0.2);
    }
    
    &.danger {
      color: #ef4444;
      border-color: #ef4444;
      
      &:hover {
        background: rgba(239, 68, 68, 0.1);
      }
    }
  }
`;

const ContentArea = styled.div`
  flex: 1;
  overflow-y: auto;
`;

const ProfilesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
  
  &.list-view {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 3rem 1rem;
  color: rgba(255, 255, 255, 0.6);
  
  .icon {
    margin-bottom: 1rem;
    opacity: 0.5;
  }
  
  h3 {
    color: white;
    margin: 0 0 0.5rem 0;
    font-size: 1.2rem;
  }
  
  p {
    margin: 0;
    font-size: 0.9rem;
  }
`;

const LoadingState = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 3rem;
  color: rgba(255, 255, 255, 0.6);
  gap: 1rem;
`;

const Pagination = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  
  .pagination-info {
    color: rgba(255, 255, 255, 0.8);
    font-size: 0.9rem;
  }
  
  .pagination-controls {
    display: flex;
    gap: 0.5rem;
    align-items: center;
  }
  
  .page-button {
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 6px;
    color: white;
    padding: 0.5rem;
    cursor: pointer;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    min-width: 36px;
    
    &:hover:not(:disabled) {
      background: rgba(255, 255, 255, 0.2);
    }
    
    &:disabled {
      opacity: 0.3;
      cursor: not-allowed;
    }
    
    &.active {
      background: #4ade80;
      border-color: #4ade80;
    }
  }
`;

const ErrorMessage = styled.div`
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 8px;
  padding: 1rem;
  color: #ef4444;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
`;

// Interface
export interface FaceProfileListProps {
  onRefresh?: () => void;
  className?: string;
}

const FaceProfileList: React.FC<FaceProfileListProps> = ({ onRefresh, className }) => {
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('active');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedProfiles, setSelectedProfiles] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  
  const itemsPerPage = 12;
  
  // Load face profiles
  const loadProfiles = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      setError(null);
      
      const params = new URLSearchParams({
        status: statusFilter,
        limit: itemsPerPage.toString(),
        offset: ((currentPage - 1) * itemsPerPage).toString()
      });
      
      if (searchTerm) params.append('search', searchTerm);
      if (departmentFilter) params.append('department', departmentFilter);
      
      const response = await fetch(`/api/faces?${params}`);
      const data = await response.json();
      
      if (data.success) {
        setProfiles(data.data.faces);
        setTotalCount(data.data.pagination.total);
        setTotalPages(Math.ceil(data.data.pagination.total / itemsPerPage));
      } else {
        setError(data.error || 'Failed to load face profiles');
      }
      
    } catch (error) {
      console.error('Error loading profiles:', error);
      setError('Network error loading face profiles');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [searchTerm, statusFilter, departmentFilter, currentPage]);
  
  // Initial load and refresh on filter changes
  useEffect(() => {
    loadProfiles();
  }, [loadProfiles]);
  
  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, departmentFilter]);
  
  // Handle refresh
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadProfiles(false);
    onRefresh?.();
  }, [loadProfiles, onRefresh]);
  
  // Handle profile selection
  const toggleProfileSelection = useCallback((profileId: string) => {
    setSelectedProfiles(prev => {
      const newSet = new Set(prev);
      if (newSet.has(profileId)) {
        newSet.delete(profileId);
      } else {
        newSet.add(profileId);
      }
      return newSet;
    });
  }, []);
  
  // Select all visible profiles
  const toggleSelectAll = useCallback(() => {
    const visibleIds = profiles.map(p => p.face_id);
    const allSelected = visibleIds.every(id => selectedProfiles.has(id));
    
    setSelectedProfiles(prev => {
      const newSet = new Set(prev);
      if (allSelected) {
        visibleIds.forEach(id => newSet.delete(id));
      } else {
        visibleIds.forEach(id => newSet.add(id));
      }
      return newSet;
    });
  }, [profiles, selectedProfiles]);
  
  // Clear selections
  const clearSelections = useCallback(() => {
    setSelectedProfiles(new Set());
  }, []);
  
  // Handle bulk delete
  const handleBulkDelete = useCallback(async () => {
    if (selectedProfiles.size === 0) return;
    
    const confirmed = window.confirm(
      `Are you sure you want to delete ${selectedProfiles.size} face profile(s)?`
    );
    
    if (!confirmed) return;
    
    try {
      const deletePromises = Array.from(selectedProfiles).map(id =>
        fetch(`/api/faces/${id}`, { method: 'DELETE' })
      );
      
      await Promise.all(deletePromises);
      
      clearSelections();
      await handleRefresh();
      
    } catch (error) {
      console.error('Bulk delete error:', error);
      setError('Failed to delete selected profiles');
    }
  }, [selectedProfiles, clearSelections, handleRefresh]);
  
  // Handle bulk archive
  const handleBulkArchive = useCallback(async () => {
    if (selectedProfiles.size === 0) return;
    
    try {
      const archivePromises = Array.from(selectedProfiles).map(id =>
        fetch(`/api/faces/${id}`, { 
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'archived' })
        })
      );
      
      await Promise.all(archivePromises);
      
      clearSelections();
      await handleRefresh();
      
    } catch (error) {
      console.error('Bulk archive error:', error);
      setError('Failed to archive selected profiles');
    }
  }, [selectedProfiles, clearSelections, handleRefresh]);
  
  // Get unique departments for filter
  const departments = useMemo(() => {
    const depts = new Set(profiles.map(p => p.department).filter(Boolean));
    return Array.from(depts).sort();
  }, [profiles]);
  
  // Calculate stats
  const stats = useMemo(() => {
    return {
      total: totalCount,
      active: profiles.filter(p => p.status === 'active').length,
      inactive: profiles.filter(p => p.status === 'inactive').length,
      withDetections: profiles.filter(p => p.total_detections > 0).length
    };
  }, [profiles, totalCount]);
  
  // Handle individual profile actions
  const handleProfileEdit = useCallback((profileId: string) => {
    // TODO: Implement edit functionality
    console.log('Edit profile:', profileId);
  }, []);
  
  const handleProfileDelete = useCallback(async (profileId: string) => {
    try {
      const response = await fetch(`/api/faces/${profileId}`, { method: 'DELETE' });
      const result = await response.json();
      
      if (result.success) {
        await handleRefresh();
      } else {
        setError(result.error || 'Failed to delete profile');
      }
    } catch (error) {
      console.error('Delete error:', error);
      setError('Network error deleting profile');
    }
  }, [handleRefresh]);
  
  const handleProfileView = useCallback((profileId: string) => {
    // TODO: Implement view details functionality
    console.log('View profile:', profileId);
  }, []);
  
  if (loading) {
    return (
      <LoadingState>
        <Loader size={24} className="animate-spin" />
        Loading face profiles...
      </LoadingState>
    );
  }
  
  return (
    <ListContainer className={className}>
      <Header>
        <Title>
          <Users size={20} />
          Face Profiles ({stats.total})
        </Title>
        
        <HeaderActions>
          <SearchBar>
            <input
              type="text"
              placeholder="Search faces..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Search size={16} className="search-icon" />
          </SearchBar>
          
          <FilterSection>
            <FilterSelect
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="archived">Archived</option>
            </FilterSelect>
            
            {departments.length > 0 && (
              <FilterSelect
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
              >
                <option value="">All Departments</option>
                {departments.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </FilterSelect>
            )}
          </FilterSection>
          
          <ViewToggle>
            <ViewButton
              className={viewMode === 'grid' ? 'active' : ''}
              onClick={() => setViewMode('grid')}
            >
              <Grid size={16} />
            </ViewButton>
            <ViewButton
              className={viewMode === 'list' ? 'active' : ''}
              onClick={() => setViewMode('list')}
            >
              <List size={16} />
            </ViewButton>
          </ViewToggle>
          
          <ActionButton onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </ActionButton>
        </HeaderActions>
      </Header>
      
      {error && (
        <ErrorMessage>
          <AlertCircle size={20} />
          {error}
        </ErrorMessage>
      )}
      
      <StatsBar>
        <div className="stats-left">
          <div className="stat-item">
            <span>Total:</span>
            <span className="stat-value">{stats.total}</span>
          </div>
          <div className="stat-item">
            <span>Active:</span>
            <span className="stat-value" style={{ color: '#4ade80' }}>{stats.active}</span>
          </div>
          <div className="stat-item">
            <span>With Detections:</span>
            <span className="stat-value" style={{ color: '#3b82f6' }}>{stats.withDetections}</span>
          </div>
        </div>
        <div className="stats-right">
          <div className="stat-item">
            <button onClick={toggleSelectAll}>
              {selectedProfiles.size === profiles.length && profiles.length > 0 ? (
                <CheckSquare size={16} />
              ) : (
                <Square size={16} />
              )}
            </button>
            <span>Select All</span>
          </div>
        </div>
      </StatsBar>
      
      {selectedProfiles.size > 0 && (
        <BulkActions>
          <div className="selection-info">
            {selectedProfiles.size} profile(s) selected
          </div>
          
          <button className="bulk-button" onClick={handleBulkArchive}>
            <Archive size={16} />
            Archive Selected
          </button>
          
          <button className="bulk-button danger" onClick={handleBulkDelete}>
            <Trash2 size={16} />
            Delete Selected
          </button>
          
          <button className="bulk-button" onClick={clearSelections}>
            Clear Selection
          </button>
        </BulkActions>
      )}
      
      <ContentArea>
        {profiles.length === 0 ? (
          <EmptyState>
            <Users size={48} className="icon" />
            <h3>No Face Profiles Found</h3>
            <p>No face profiles match your current search and filter criteria.</p>
          </EmptyState>
        ) : (
          <ProfilesGrid className={viewMode === 'list' ? 'list-view' : ''}>
            {profiles.map((profile: any) => (
              <FaceProfileCard
                key={profile.face_id}
                profile={profile}
                onEdit={handleProfileEdit}
                onDelete={handleProfileDelete}
                onViewDetails={handleProfileView}
              />
            ))}
          </ProfilesGrid>
        )}
      </ContentArea>
      
      {totalPages > 1 && (
        <Pagination>
          <div className="pagination-info">
            Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalCount)} of {totalCount} profiles
          </div>
          
          <div className="pagination-controls">
            <button
              className="page-button"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft size={16} />
            </button>
            
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const pageNum = currentPage <= 3 
                ? i + 1 
                : currentPage >= totalPages - 2 
                  ? totalPages - 4 + i 
                  : currentPage - 2 + i;
              
              if (pageNum < 1 || pageNum > totalPages) return null;
              
              return (
                <button
                  key={pageNum}
                  className={`page-button ${currentPage === pageNum ? 'active' : ''}`}
                  onClick={() => setCurrentPage(pageNum)}
                >
                  {pageNum}
                </button>
              );
            })}
            
            <button
              className="page-button"
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </Pagination>
      )}
    </ListContainer>
  );
};

export default FaceProfileList;