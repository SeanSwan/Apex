// APEX AI LIVE MONITORING - CONTROLS BAR COMPONENT
// Main controls including layout, filters, search, and auto-switch

import React, { memo, useCallback } from 'react';
import styled from 'styled-components';
import { 
  Grid3X3,
  Play,
  Pause,
  Search
} from 'lucide-react';
import { ControlsBarProps } from '../types';
import { ControlButton, StyledSelect, Section } from '../shared/StyledComponents';
import { GridLayoutSelector } from './GridLayoutSelector';
import { FilterControls } from './FilterControls';
import { AutoSwitchControls } from './AutoSwitchControls';

// Styled Components for Controls Bar
const ControlsContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 2rem;
  background: rgba(20, 20, 20, 0.9);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  height: auto;
  min-height: 60px;
`;

const LeftControls = styled(Section)`
  gap: 2rem;
`;

const RightControls = styled(Section)`
  gap: 1rem;
`;

const QualityControls = styled(Section)`
  gap: 0.5rem;
  
  label {
    font-size: 0.8rem;
    color: #B0B0B0;
  }
`;

const DisplayModeControls = styled(Section)`
  gap: 0.5rem;
  
  label {
    font-size: 0.8rem;
    color: #B0B0B0;
  }
`;

// Controls Bar Component
const ControlsBar: React.FC<ControlsBarProps> = memo(({
  gridConfig,
  properties,
  searchTerm,
  filterProperty,
  onLayoutChange,
  onAutoSwitchToggle,
  onQualityChange,
  onDisplayModeChange,
  onSwitchIntervalChange,
  onSearchChange,
  onFilterPropertyChange
}) => {
  // Memoized event handlers
  const handleQualityChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    onQualityChange(e.target.value as any);
  }, [onQualityChange]);

  const handleDisplayModeChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    onDisplayModeChange(e.target.value as any);
  }, [onDisplayModeChange]);

  const handleSwitchIntervalChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    onSwitchIntervalChange(parseInt(e.target.value));
  }, [onSwitchIntervalChange]);

  return (
    <ControlsContainer>
      <LeftControls>
        {/* Grid Layout Selector */}
        <GridLayoutSelector
          currentLayout={gridConfig.layout}
          onLayoutChange={onLayoutChange}
        />
        
        {/* Auto-Switch Controls */}
        <AutoSwitchControls
          autoSwitch={gridConfig.auto_switch}
          switchInterval={gridConfig.switch_interval}
          onToggle={onAutoSwitchToggle}
          onIntervalChange={handleSwitchIntervalChange}
        />
      </LeftControls>
      
      <RightControls>
        {/* Quality Controls */}
        <QualityControls>
          <label>Quality:</label>
          <StyledSelect
            value={gridConfig.quality}
            onChange={handleQualityChange}
          >
            <option value="thumbnail">Thumbnail</option>
            <option value="preview">Preview</option>
            <option value="standard">Standard</option>
            <option value="hd">HD</option>
          </StyledSelect>
        </QualityControls>
        
        {/* Display Mode Controls */}
        <DisplayModeControls>
          <label>Display:</label>
          <StyledSelect
            value={gridConfig.display_mode}
            onChange={handleDisplayModeChange}
          >
            <option value="all">All Cameras</option>
            <option value="property">By Property</option>
            <option value="alerts">Active Alerts</option>
            <option value="priority">High Priority</option>
          </StyledSelect>
        </DisplayModeControls>
        
        {/* Filter Controls */}
        <FilterControls
          searchTerm={searchTerm}
          filterProperty={filterProperty}
          properties={properties}
          onSearchChange={onSearchChange}
          onFilterPropertyChange={onFilterPropertyChange}
        />
      </RightControls>
    </ControlsContainer>
  );
});

ControlsBar.displayName = 'ControlsBar';

export { ControlsBar };
