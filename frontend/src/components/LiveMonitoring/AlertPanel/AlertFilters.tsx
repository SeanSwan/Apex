// APEX AI LIVE MONITORING - ALERT FILTERS COMPONENT
// Filter controls for security alerts (type, severity, status, time, etc.)

import React, { memo, useCallback } from 'react';
import styled from 'styled-components';
import { 
  Filter, 
  Clock, 
  AlertTriangle, 
  Camera, 
  Building2,
  RotateCcw
} from 'lucide-react';
import { AlertFiltersProps, AlertFilters, SecurityAlert } from '../types';
import { StyledSelect, ControlButton, Section } from '../shared/StyledComponents';

// Styled Components for Alert Filters
const FiltersContainer = styled.div`
  padding: 1rem;
  background: rgba(15, 15, 15, 0.5);
`;

const FiltersGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-bottom: 1rem;
`;

const FilterGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const FilterLabel = styled.label`
  font-size: 0.75rem;
  color: #B0B0B0;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 0.25rem;
`;

const FilterActions = styled(Section)`
  justify-content: space-between;
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
`;

const FilterSummary = styled.div`
  font-size: 0.7rem;
  color: #888;
  display: flex;
  align-items: center;
  gap: 0.25rem;
`;

const ResetButton = styled(ControlButton)`
  font-size: 0.7rem;
  padding: 0.375rem 0.75rem;
`;

// Alert Filters Component
const AlertFiltersComponent: React.FC<AlertFiltersProps> = memo(({
  filters,
  properties,
  cameras,
  onFiltersChange,
  totalAlerts,
  filteredCount
}) => {
  // Event handlers
  const handleAlertTypeChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    onFiltersChange({
      ...filters,
      alertType: e.target.value as AlertFilters['alertType']
    });
  }, [filters, onFiltersChange]);

  const handleSeverityChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    onFiltersChange({
      ...filters,
      severity: e.target.value as AlertFilters['severity']
    });
  }, [filters, onFiltersChange]);

  const handleStatusChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    onFiltersChange({
      ...filters,
      status: e.target.value as AlertFilters['status']
    });
  }, [filters, onFiltersChange]);

  const handleCameraChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    onFiltersChange({
      ...filters,
      camera: e.target.value
    });
  }, [filters, onFiltersChange]);

  const handlePropertyChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    onFiltersChange({
      ...filters,
      property: e.target.value
    });
  }, [filters, onFiltersChange]);

  const handleTimeRangeChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    onFiltersChange({
      ...filters,
      timeRange: e.target.value as AlertFilters['timeRange']
    });
  }, [filters, onFiltersChange]);

  const handleResetFilters = useCallback(() => {
    onFiltersChange({
      alertType: 'all',
      severity: 'all',
      status: 'all',
      camera: 'all',
      property: 'all',
      timeRange: '24h'
    });
  }, [onFiltersChange]);

  // Check if any non-default filters are applied
  const hasActiveFilters = filters.alertType !== 'all' || 
                          filters.severity !== 'all' || 
                          filters.status !== 'all' || 
                          filters.camera !== 'all' || 
                          filters.property !== 'all' || 
                          filters.timeRange !== '24h';

  return (
    <FiltersContainer>
      <FiltersGrid>
        {/* Alert Type Filter */}
        <FilterGroup>
          <FilterLabel>
            <AlertTriangle size={12} />
            Alert Type
          </FilterLabel>
          <StyledSelect
            value={filters.alertType}
            onChange={handleAlertTypeChange}
          >
            <option value="all">All Types</option>
            <option value="weapon_detected">Weapon Detected</option>
            <option value="unknown_person">Unknown Person</option>
            <option value="suspicious_activity">Suspicious Activity</option>
            <option value="perimeter_breach">Perimeter Breach</option>
            <option value="loitering_detected">Loitering</option>
            <option value="ai_detection">AI Detection</option>
            <option value="face_detection">Face Detection</option>
          </StyledSelect>
        </FilterGroup>

        {/* Severity Filter */}
        <FilterGroup>
          <FilterLabel>
            <Filter size={12} />
            Severity
          </FilterLabel>
          <StyledSelect
            value={filters.severity}
            onChange={handleSeverityChange}
          >
            <option value="all">All Severities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </StyledSelect>
        </FilterGroup>

        {/* Status Filter */}
        <FilterGroup>
          <FilterLabel>
            <Clock size={12} />
            Status
          </FilterLabel>
          <StyledSelect
            value={filters.status}
            onChange={handleStatusChange}
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="acknowledged">Acknowledged</option>
            <option value="dismissed">Dismissed</option>
            <option value="resolved">Resolved</option>
          </StyledSelect>
        </FilterGroup>

        {/* Camera Filter */}
        <FilterGroup>
          <FilterLabel>
            <Camera size={12} />
            Camera
          </FilterLabel>
          <StyledSelect
            value={filters.camera}
            onChange={handleCameraChange}
          >
            <option value="all">All Cameras</option>
            {cameras.map(camera => (
              <option key={camera.camera_id} value={camera.camera_id}>
                {camera.name}
              </option>
            ))}
          </StyledSelect>
        </FilterGroup>

        {/* Property Filter */}
        <FilterGroup>
          <FilterLabel>
            <Building2 size={12} />
            Property
          </FilterLabel>
          <StyledSelect
            value={filters.property}
            onChange={handlePropertyChange}
          >
            <option value="all">All Properties</option>
            {properties.map(property => (
              <option key={property.id} value={property.id}>
                {property.name}
              </option>
            ))}
          </StyledSelect>
        </FilterGroup>

        {/* Time Range Filter */}
        <FilterGroup>
          <FilterLabel>
            <Clock size={12} />
            Time Range
          </FilterLabel>
          <StyledSelect
            value={filters.timeRange}
            onChange={handleTimeRangeChange}
          >
            <option value="all">All Time</option>
            <option value="1h">Last Hour</option>
            <option value="6h">Last 6 Hours</option>
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
          </StyledSelect>
        </FilterGroup>
      </FiltersGrid>

      <FilterActions>
        <FilterSummary>
          <Filter size={12} />
          Showing {filteredCount} of {totalAlerts} alerts
          {hasActiveFilters && (
            <span style={{ color: '#FFD700', marginLeft: '0.25rem' }}>
              (filtered)
            </span>
          )}
        </FilterSummary>

        {hasActiveFilters && (
          <ResetButton onClick={handleResetFilters}>
            <RotateCcw size={12} />
            Reset Filters
          </ResetButton>
        )}
      </FilterActions>
    </FiltersContainer>
  );
});

AlertFiltersComponent.displayName = 'AlertFiltersComponent';

export { AlertFiltersComponent as AlertFilters };
