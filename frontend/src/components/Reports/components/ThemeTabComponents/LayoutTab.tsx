/**
 * LayoutTab Component - Extracted from ThemeBuilder
 * Handles layout settings like fonts, card styles, border radius, and report title
 */

import React from 'react';
import { FONT_FAMILIES } from '../../constants';
import { ExtendedThemeSettings } from '../../utils';
import {
  SettingsGrid,
  SettingCard,
  SettingGroup,
  Label,
  SelectInput,
  TextInput,
  RangeSlider
} from '../../shared';

interface LayoutTabProps {
  settings: ExtendedThemeSettings;
  onChange: (settings: Partial<ExtendedThemeSettings>) => void;
}

const LayoutTab: React.FC<LayoutTabProps> = ({ settings, onChange }) => {
  return (
    <SettingsGrid>
      <SettingCard>
        <SettingGroup>
          <Label>Font Family</Label>
          <SelectInput
            value={settings.fontFamily ?? 'Inter, sans-serif'}
            onChange={(e) => onChange({ fontFamily: e.target.value })}
          >
            {FONT_FAMILIES.map(font => (
              <option key={font.value} value={font.value}>
                {font.label}
              </option>
            ))}
          </SelectInput>
        </SettingGroup>
      </SettingCard>

      <SettingCard>
        <SettingGroup>
          <Label>Card Style</Label>
          <SelectInput
            value={settings.cardStyle ?? 'modern'}
            onChange={(e) => onChange({ cardStyle: e.target.value as any })}
          >
            <option value="modern">Modern</option>
            <option value="classic">Classic</option>
            <option value="minimal">Minimal</option>
            <option value="luxury">Luxury</option>
          </SelectInput>
        </SettingGroup>
      </SettingCard>

      <SettingCard>
        <SettingGroup>
          <Label>Border Radius: {settings.borderRadius ?? 12}px</Label>
          <RangeSlider
            type="range"
            min="0"
            max="30"
            step="2"
            value={settings.borderRadius ?? 12}
            onChange={(e) => onChange({ borderRadius: parseInt(e.target.value) })}
          />
        </SettingGroup>
      </SettingCard>

      <SettingCard>
        <SettingGroup>
          <Label>Report Title</Label>
          <TextInput
            type="text"
            placeholder="AI Live Monitoring Report"
            value={settings.reportTitle || ''}
            onChange={(e) => onChange({ reportTitle: e.target.value })}
          />
        </SettingGroup>
      </SettingCard>
    </SettingsGrid>
  );
};

export default LayoutTab;
