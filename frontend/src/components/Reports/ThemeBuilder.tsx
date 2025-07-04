/**
 * Theme Builder - Main Component (FULLY REFACTORED)
 * Production-ready modular component using extracted tab components
 * Reduced from 38.85KB to ~10KB through proper decomposition
 */

import React, { useMemo, useCallback } from 'react';
import { 
  Palette, Layers, Image, Sparkles, 
  RotateCcw, Download, Settings 
} from 'lucide-react';

// Clean barrel imports
import { THEME_TABS, ThemeTabType } from './constants';
import { 
  themeManagementUtils, 
  useThemeBuilderState,
  useImageUpload,
  useThemeValidation,
  ExtendedThemeSettings
} from './utils';
import { 
  PresetsTab,
  ColorsTab, 
  LayoutTab,
  MediaTab,
  EffectsTab,
  AdvancedTab,
  ThemePreview
} from './components';
import {
  Section,
  SectionTitle,
  TabContainer,
  Tab,
  ContentContainer,
  LoadingSpinner,
  ErrorMessage,
  ActionBar,
  ActionButton
} from './shared';

/**
 * Component interfaces
 */
interface ThemeBuilderProps {
  settings: ExtendedThemeSettings;
  onChange: (settings: Partial<ExtendedThemeSettings>) => void;
}

/**
 * Main Theme Builder Component - Pure Orchestration
 */
const ThemeBuilder: React.FC<ThemeBuilderProps> = ({ settings, onChange }) => {
  // State management
  const { state, actions } = useThemeBuilderState();
  const { validationSummary, isValidating } = useThemeValidation(settings);
  const { uploadProgress, uploadErrors, handleImageUpload, clearImage } = useImageUpload(
    (type, imageData) => {
      onChange({ [type]: imageData });
    }
  );

  // Enhanced settings with defaults
  const enhancedSettings = useMemo<ExtendedThemeSettings>(() => ({
    ...settings,
    shadowIntensity: settings.shadowIntensity ?? 1,
    borderRadius: settings.borderRadius ?? 12,
    textShadow: settings.textShadow ?? false,
    cardStyle: settings.cardStyle ?? 'modern',
    animationsEnabled: settings.animationsEnabled ?? true,
    darkMode: settings.darkMode ?? true,
    enableGradient: settings.enableGradient ?? false,
    gradientDirection: settings.gradientDirection ?? 'linear',
    gradientAngle: settings.gradientAngle ?? 135,
    customCSS: settings.customCSS ?? '',
    backgroundOpacity: settings.backgroundOpacity ?? 0.7,
  }), [settings]);

  // Tab configuration
  const tabs = useMemo(() => [
    { id: THEME_TABS.PRESETS, label: 'Presets', icon: Palette },
    { id: THEME_TABS.COLORS, label: 'Colors', icon: Palette },
    { id: THEME_TABS.LAYOUT, label: 'Layout', icon: Layers },
    { id: THEME_TABS.MEDIA, label: 'Media', icon: Image },
    { id: THEME_TABS.EFFECTS, label: 'Effects', icon: Sparkles },
    { id: THEME_TABS.ADVANCED, label: 'Advanced', icon: Settings },
  ], []);

  // Event handlers
  const handlePresetApply = useCallback(async (presetName: string) => {
    actions.setIsLoading(true);
    try {
      const result = await themeManagementUtils.applyPreset(
        presetName, 
        enhancedSettings, 
        onChange, 
        actions.setActivePreset
      );
      
      if (!result.success) {
        console.error('Failed to apply preset:', result.error);
      }
    } finally {
      actions.setIsLoading(false);
    }
  }, [enhancedSettings, onChange, actions]);

  const handleResetToDefaults = useCallback(() => {
    themeManagementUtils.resetToDefaults(onChange, actions.setActivePreset);
  }, [onChange, actions.setActivePreset]);

  const handleExportTheme = useCallback(async () => {
    actions.setIsExporting(true);
    try {
      const result = await themeManagementUtils.exportTheme(enhancedSettings, 'json');
      if (!result.success) {
        console.error('Export failed:', result.error);
      }
    } finally {
      actions.setIsExporting(false);
    }
  }, [enhancedSettings, actions]);

  // Tab content renderer - Clean switch statement
  const renderTabContent = () => {
    switch (state.activeTab) {
      case THEME_TABS.PRESETS:
        return (
          <PresetsTab
            activePreset={state.activePreset}
            onPresetApply={handlePresetApply}
            onResetToDefaults={handleResetToDefaults}
          />
        );
      case THEME_TABS.COLORS:
        return (
          <ColorsTab
            settings={enhancedSettings}
            onChange={onChange}
          />
        );
      case THEME_TABS.LAYOUT:
        return (
          <LayoutTab
            settings={enhancedSettings}
            onChange={onChange}
          />
        );
      case THEME_TABS.MEDIA:
        return (
          <MediaTab
            settings={enhancedSettings}
            onChange={onChange}
          />
        );
      case THEME_TABS.EFFECTS:
        return (
          <EffectsTab
            settings={enhancedSettings}
            onChange={onChange}
          />
        );
      case THEME_TABS.ADVANCED:
        return (
          <AdvancedTab
            settings={enhancedSettings}
            onChange={onChange}
            expandedSections={state.expandedSections}
            onToggleSection={actions.toggleSection}
          />
        );
      default:
        return (
          <PresetsTab
            activePreset={state.activePreset}
            onPresetApply={handlePresetApply}
            onResetToDefaults={handleResetToDefaults}
          />
        );
    }
  };

  // Main render - Focused orchestration
  return (
    <Section>
      <SectionTitle>
        <Palette size={24} />
        Advanced Theme Customization
      </SectionTitle>

      {/* Validation Messages */}
      {validationSummary && !validationSummary.isValid && (
        <ErrorMessage>
          <span>⚠️</span>
          Theme validation errors: {validationSummary.errors.map(e => e.message).join(', ')}
        </ErrorMessage>
      )}

      {validationSummary && validationSummary.hasWarnings && (
        <div style={{ 
          padding: '1rem', 
          background: 'rgba(245, 158, 11, 0.1)', 
          border: '1px solid rgba(245, 158, 11, 0.3)', 
          borderRadius: '8px', 
          color: '#f59e0b', 
          marginBottom: '1rem' 
        }}>
          <span>⚠️</span> Theme warnings: {validationSummary.warnings.map(w => w.message).join(', ')}
        </div>
      )}

      {/* Tab Navigation */}
      <TabContainer>
        {tabs.map(tab => {
          const IconComponent = tab.icon;
          return (
            <Tab
              key={tab.id}
              $active={state.activeTab === tab.id}
              onClick={() => actions.setActiveTab(tab.id)}
            >
              <IconComponent size={18} />
              {tab.label}
            </Tab>
          );
        })}
      </TabContainer>

      {/* Loading State */}
      {(state.isLoading || isValidating) && (
        <div style={{ textAlign: 'center', margin: '2rem 0' }}>
          <LoadingSpinner />
          <p style={{ color: '#ccc', marginTop: '1rem' }}>
            {state.isLoading ? 'Applying theme...' : 'Validating settings...'}
          </p>
        </div>
      )}

      {/* Tab Content */}
      <ContentContainer>
        {renderTabContent()}
      </ContentContainer>

      {/* Live Preview Component */}
      <ThemePreview settings={enhancedSettings} />

      {/* Action Bar */}
      <ActionBar>
        <ActionButton onClick={() => actions.setActiveTab(THEME_TABS.PRESETS)} $variant="secondary">
          <Palette size={18} />
          Quick Presets
        </ActionButton>
        <ActionButton onClick={handleResetToDefaults} $variant="secondary">
          <RotateCcw size={18} />
          Reset All
        </ActionButton>
        <ActionButton 
          onClick={handleExportTheme} 
          disabled={state.isExporting}
        >
          <Download size={18} />
          {state.isExporting ? 'Exporting...' : 'Export Theme'}
        </ActionButton>
      </ActionBar>
    </Section>
  );
};

export default ThemeBuilder;
