/**
 * PresetsTab Component - Extracted from ThemeBuilder
 * Handles theme preset selection and application
 */

import React from 'react';
import { RotateCcw } from 'lucide-react';
import { THEME_PRESETS } from '../../constants';
import { PresetButton, ActionBar, ActionButton } from '../../shared';

interface PresetsTabProps {
  activePreset?: string;
  onPresetApply: (presetName: string) => void;
  onResetToDefaults: () => void;
}

const PresetsTab: React.FC<PresetsTabProps> = ({
  activePreset,
  onPresetApply,
  onResetToDefaults
}) => {
  return (
    <div>
      <h4 style={{ color: '#FFD700', marginBottom: '1.5rem', fontSize: '1.25rem' }}>
        Professional Theme Presets
      </h4>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
        {THEME_PRESETS.map(preset => (
          <PresetButton
            key={preset.name}
            $active={activePreset === preset.name}
            onClick={() => onPresetApply(preset.name)}
          >
            {preset.name}
          </PresetButton>
        ))}
      </div>
      <ActionBar>
        <ActionButton onClick={onResetToDefaults} $variant="secondary">
          <RotateCcw size={18} />
          Reset to Defaults
        </ActionButton>
      </ActionBar>
    </div>
  );
};

export default PresetsTab;
