/**
 * ColorsTab Component - Extracted from ThemeBuilder
 * Handles color selection, gradient settings, and contrast analysis
 */

import React from 'react';
import { ColorPalette, ColorContrastDisplay } from '../';
import { ExtendedThemeSettings } from '../../utils';
import {
  SettingsGrid,
  SettingCard,
  SettingGroup,
  Label,
  RangeSlider,
  ToggleSwitch
} from '../../shared';

interface ColorsTabProps {
  settings: ExtendedThemeSettings;
  onChange: (settings: Partial<ExtendedThemeSettings>) => void;
}

const ColorsTab: React.FC<ColorsTabProps> = ({ settings, onChange }) => {
  return (
    <SettingsGrid>
      <SettingCard>
        <SettingGroup>
          <Label>Primary Color (Text/Foreground)</Label>
          <ColorPalette
            label="Primary Color"
            value={settings.primaryColor ?? '#FFFFFF'}
            onChange={(color) => onChange({ primaryColor: color })}
            showCopyButton
            showValidation
            onColorHover={(color) => console.log('Hovering:', color)}
          />
        </SettingGroup>
      </SettingCard>

      <SettingCard>
        <SettingGroup>
          <Label>Secondary Color (Background)</Label>
          <ColorPalette
            label="Secondary Color"
            value={settings.secondaryColor ?? '#1A1A1A'}
            onChange={(color) => onChange({ secondaryColor: color })}
            showCopyButton
            showValidation
          />
        </SettingGroup>
      </SettingCard>

      <SettingCard>
        <SettingGroup>
          <Label>Accent Color (Highlights)</Label>
          <ColorPalette
            label="Accent Color"
            value={settings.accentColor ?? '#FFD700'}
            onChange={(color) => onChange({ accentColor: color })}
            showCopyButton
            showValidation
            predefinedColors={['#FFD700', '#FFA500', '#FF8C00', '#DAA520', '#B8860B']}
          />
        </SettingGroup>
      </SettingCard>

      <SettingCard>
        <SettingGroup>
          <Label>Gradient Settings</Label>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <span>Enable Gradient Background</span>
            <ToggleSwitch>
              <input
                type="checkbox"
                checked={settings.enableGradient ?? false}
                onChange={(e) => onChange({ enableGradient: e.target.checked })}
              />
              <span></span>
            </ToggleSwitch>
          </div>
          {settings.enableGradient && (
            <>
              <Label>Gradient Angle: {settings.gradientAngle ?? 135}°</Label>
              <RangeSlider
                type="range"
                min="0"
                max="360"
                step="15"
                value={settings.gradientAngle ?? 135}
                onChange={(e) => onChange({ gradientAngle: parseInt(e.target.value) })}
              />
            </>
          )}
        </SettingGroup>
      </SettingCard>

      {/* Color Contrast Display */}
      {settings.primaryColor && settings.secondaryColor && (
        <SettingCard style={{ gridColumn: 'span 2' }}>
          <SettingGroup>
            <Label>Color Contrast Analysis</Label>
            <ColorContrastDisplay
              foregroundColor={settings.primaryColor}
              backgroundColor={settings.secondaryColor}
              showRatio
              showCompliance
            />
          </SettingGroup>
        </SettingCard>
      )}
    </SettingsGrid>
  );
};

export default ColorsTab;
