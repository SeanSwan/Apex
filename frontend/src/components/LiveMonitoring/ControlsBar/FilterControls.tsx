// APEX AI LIVE MONITORING - FILTER CONTROLS COMPONENT
// Search and property filtering controls

import React, { memo, useCallback } from 'react';
import styled from 'styled-components';
import { Search } from 'lucide-react';
import { Property } from '../types';
import { StyledInput, StyledSelect, Section } from '../shared/StyledComponents';

// Styled Components
const FilterContainer = styled(Section)`
  gap: 1rem;
`;

const SearchBox = styled.div`
  position: relative;
  
  input {
    width: 200px;
    padding: 0.5rem 1rem 0.5rem 2.25rem;
  }
  
  .search-icon {
    position: absolute;
    left: 0.75rem;
    top: 50%;
    transform: translateY(-50%);
    color: #666;
    pointer-events: none;
  }
`;

// Filter Controls Props
interface FilterControlsProps {
  searchTerm: string;
  filterProperty: string;
  properties: Property[];
  onSearchChange: (term: string) => void;
  onFilterPropertyChange: (propertyId: string) => void;
}

// Filter Controls Component
const FilterControls: React.FC<FilterControlsProps> = memo(({
  searchTerm,
  filterProperty,
  properties,
  onSearchChange,
  onFilterPropertyChange
}) => {
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onSearchChange(e.target.value);
  }, [onSearchChange]);

  const handlePropertyChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    onFilterPropertyChange(e.target.value);
  }, [onFilterPropertyChange]);

  return (
    <FilterContainer>
      <SearchBox>
        <Search className="search-icon" size={14} />
        <StyledInput
          type="text"
          placeholder="Search cameras..."
          value={searchTerm}
          onChange={handleSearchChange}
        />
      </SearchBox>
      
      <StyledSelect
        value={filterProperty}
        onChange={handlePropertyChange}
      >
        <option value="all">All Properties</option>
        {properties.map(prop => (
          <option key={prop.id} value={prop.id}>
            {prop.name} ({prop.count})
          </option>
        ))}
      </StyledSelect>
    </FilterContainer>
  );
});

FilterControls.displayName = 'FilterControls';

export { FilterControls };
