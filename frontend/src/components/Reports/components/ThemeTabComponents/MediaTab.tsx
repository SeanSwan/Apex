/**
 * MediaTab Component - Extracted from ThemeBuilder
 * Handles media uploads for logos, header image, and background image
 */

import React from 'react';
import { ExtendedThemeSettings } from '../../utils';
import {
  SettingsGrid,
  SettingCard,
  SettingGroup,
  Label,
  RangeSlider
} from '../../shared';
// Note: DragDropImageUpload should be imported from barrel export
// But since it's in the parent Reports directory, we'll keep direct import for now
import DragDropImageUpload from '../../DragDropImageUpload';

interface MediaTabProps {
  settings: ExtendedThemeSettings;
  onChange: (settings: Partial<ExtendedThemeSettings>) => void;
}

const MediaTab: React.FC<MediaTabProps> = ({ settings, onChange }) => {
  return (
    <SettingsGrid>
      <SettingCard>
        <SettingGroup>
          <Label>Company Logo</Label>
          <DragDropImageUpload
            label="companyLogo"
            onImageUpload={(imageData) => onChange({ companyLogo: imageData })}
            storedImage={settings.companyLogo}
          />
        </SettingGroup>
      </SettingCard>

      <SettingCard>
        <SettingGroup>
          <Label>Client Logo</Label>
          <DragDropImageUpload
            label="clientLogo"
            onImageUpload={(imageData) => onChange({ clientLogo: imageData })}
            storedImage={settings.clientLogo}
          />
        </SettingGroup>
      </SettingCard>

      <SettingCard>
        <SettingGroup>
          <Label>Header Background Image</Label>
          <DragDropImageUpload
            label="headerImage"
            onImageUpload={(imageData) => onChange({ headerImage: imageData })}
            storedImage={settings.headerImage}
          />
        </SettingGroup>
      </SettingCard>

      <SettingCard>
        <SettingGroup>
          <Label>Report Background Image</Label>
          <DragDropImageUpload
            label="backgroundImage"
            onImageUpload={(imageData) => onChange({ backgroundImage: imageData })}
            storedImage={settings.backgroundImage}
          />
          <Label style={{ marginTop: '1rem' }}>
            Background Opacity: {(settings.backgroundOpacity ?? 0.7).toFixed(1)}
          </Label>
          <RangeSlider
            type="range"
            min="0.1"
            max="1"
            step="0.1"
            value={settings.backgroundOpacity ?? 0.7}
            onChange={(e) => onChange({ backgroundOpacity: parseFloat(e.target.value) })}
          />
        </SettingGroup>
      </SettingCard>
    </SettingsGrid>
  );
};

export default MediaTab;
