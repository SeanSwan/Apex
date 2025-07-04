/**
 * EffectsTab Component - Extracted from ThemeBuilder
 * Handles visual effects like shadows, animations, and dark mode
 */

import React from 'react';
import { ExtendedThemeSettings } from '../../utils';
import {
  SettingsGrid,
  SettingCard,
  SettingGroup,
  Label,
  RangeSlider,
  ToggleSwitch
} from '../../shared';

interface EffectsTabProps {
  settings: ExtendedThemeSettings;
  onChange: (settings: Partial<ExtendedThemeSettings>) => void;
}

const EffectsTab: React.FC<EffectsTabProps> = ({ settings, onChange }) => {
  return (
    <SettingsGrid>
      <SettingCard>
        <SettingGroup>
          <Label>Shadow Intensity: {(settings.shadowIntensity ?? 1).toFixed(1)}</Label>
          <RangeSlider
            type="range"
            min="0"
            max="3"
            step="0.1"
            value={settings.shadowIntensity ?? 1}
            onChange={(e) => onChange({ shadowIntensity: parseFloat(e.target.value) })}
          />
        </SettingGroup>
      </SettingCard>

      <SettingCard>
        <SettingGroup>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <Label>Text Shadow</Label>
            <ToggleSwitch>
              <input
                type="checkbox"
                checked={settings.textShadow ?? false}
                onChange={(e) => onChange({ textShadow: e.target.checked })}
              />
              <span></span>
            </ToggleSwitch>
          </div>
        </SettingGroup>
      </SettingCard>

      <SettingCard>
        <SettingGroup>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <Label>Animations Enabled</Label>
            <ToggleSwitch>
              <input
                type="checkbox"
                checked={settings.animationsEnabled ?? true}
                onChange={(e) => onChange({ animationsEnabled: e.target.checked })}
              />
              <span></span>
            </ToggleSwitch>
          </div>
        </SettingGroup>
      </SettingCard>

      <SettingCard>
        <SettingGroup>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <Label>Dark Mode</Label>
            <ToggleSwitch>
              <input
                type="checkbox"
                checked={settings.darkMode ?? true}
                onChange={(e) => onChange({ darkMode: e.target.checked })}
              />
              <span></span>
            </ToggleSwitch>
          </div>
        </SettingGroup>
      </SettingCard>
    </SettingsGrid>
  );
};

export default EffectsTab;
