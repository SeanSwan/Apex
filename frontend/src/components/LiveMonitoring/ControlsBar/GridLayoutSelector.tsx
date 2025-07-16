// APEX AI LIVE MONITORING - GRID LAYOUT SELECTOR COMPONENT
// Grid layout selection controls (4x4, 6x6, 8x8, etc.)

import React, { memo, useCallback } from 'react';
import styled from 'styled-components';
import { Grid3X3 } from 'lucide-react';
import { GridConfig } from '../types';
import { ControlButton, Section } from '../shared/StyledComponents';

// Styled Components
const LayoutContainer = styled(Section)`
  gap: 0.5rem;
  
  label {
    font-size: 0.8rem;
    color: #B0B0B0;
  }
`;

const LayoutButtons = styled.div`
  display: flex;
  gap: 0.25rem;
`;

// Grid Layout Selector Props
interface GridLayoutSelectorProps {
  currentLayout: GridConfig['layout'];
  onLayoutChange: (layout: GridConfig['layout']) => void;
}

// Grid Layout Selector Component
const GridLayoutSelector: React.FC<GridLayoutSelectorProps> = memo(({
  currentLayout,
  onLayoutChange
}) => {
  const layouts: GridConfig['layout'][] = ['4x4', '6x6', '8x8', '10x10', '12x12'];

  const handleLayoutClick = useCallback((layout: GridConfig['layout']) => {
    onLayoutChange(layout);
  }, [onLayoutChange]);

  return (
    <LayoutContainer>
      <label>Layout:</label>
      <LayoutButtons>
        {layouts.map(layout => (
          <ControlButton
            key={layout}
            $active={currentLayout === layout}
            onClick={() => handleLayoutClick(layout)}
          >
            <Grid3X3 size={14} />
            {layout}
          </ControlButton>
        ))}
      </LayoutButtons>
    </LayoutContainer>
  );
});

GridLayoutSelector.displayName = 'GridLayoutSelector';

export { GridLayoutSelector };
