// APEX AI LIVE MONITORING - AUTO SWITCH CONTROLS COMPONENT
// Auto-switching controls for grid pagination

import React, { memo, useCallback } from 'react';
import styled from 'styled-components';
import { Play, Pause } from 'lucide-react';
import { ControlButton, StyledSelect, Section } from '../shared/StyledComponents';

// Styled Components
const AutoSwitchContainer = styled(Section)`
  gap: 0.5rem;
`;

const SwitchButton = styled(ControlButton)<{ $active: boolean }>`
  background: ${props => props.$active ? 'rgba(34, 197, 94, 0.2)' : 'rgba(40, 40, 40, 0.7)'};
  border-color: ${props => props.$active ? '#22C55E' : 'rgba(255, 215, 0, 0.3)'};
  color: ${props => props.$active ? '#22C55E' : '#E0E0E0'};
`;

// Auto Switch Controls Props
interface AutoSwitchControlsProps {
  autoSwitch: boolean;
  switchInterval: number;
  onToggle: () => void;
  onIntervalChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
}

// Auto Switch Controls Component
const AutoSwitchControls: React.FC<AutoSwitchControlsProps> = memo(({
  autoSwitch,
  switchInterval,
  onToggle,
  onIntervalChange
}) => {
  const handleToggle = useCallback(() => {
    onToggle();
  }, [onToggle]);

  return (
    <AutoSwitchContainer>
      <SwitchButton
        $active={autoSwitch}
        onClick={handleToggle}
      >
        {autoSwitch ? <Pause size={14} /> : <Play size={14} />}
        Auto-Switch
      </SwitchButton>
      
      <StyledSelect
        value={switchInterval}
        onChange={onIntervalChange}
      >
        <option value={15}>15s</option>
        <option value={30}>30s</option>
        <option value={60}>60s</option>
        <option value={120}>2m</option>
      </StyledSelect>
    </AutoSwitchContainer>
  );
});

AutoSwitchControls.displayName = 'AutoSwitchControls';

export { AutoSwitchControls };
