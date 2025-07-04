/**
 * ThemePreview Component - Extracted from ThemeBuilder
 * Displays live preview of theme settings with sample content
 */

import React from 'react';
import { Eye } from 'lucide-react';
import { ExtendedThemeSettings } from '../../utils';
import {
  PreviewContainer,
  PreviewHeader,
  ImagePreview,
  PreviewTitle,
  PreviewText,
  PreviewHighlight
} from '../../shared';

interface ThemePreviewProps {
  settings: ExtendedThemeSettings;
}

const ThemePreview: React.FC<ThemePreviewProps> = ({ settings }) => {
  return (
    <PreviewContainer
      $backgroundImage={settings.backgroundImage}
      $bgColor={settings.secondaryColor ?? '#1A1A1A'}
      $textColor={settings.primaryColor ?? '#FFFFFF'}
      $gradientDirection={`${settings.gradientAngle ?? 135}deg`}
      $enableGradient={settings.enableGradient}
      $borderRadius={settings.borderRadius}
      $shadowIntensity={settings.shadowIntensity}
      $cardStyle={settings.cardStyle}
    >
      <PreviewHeader>
        <h4>Live Theme Preview</h4>
        <Eye size={20} color="#FFD700" />
      </PreviewHeader>

      <ImagePreview>
        {settings.companyLogo && (
          <img src={settings.companyLogo} alt="Company Logo Preview" />
        )}
        {settings.clientLogo && (
          <img src={settings.clientLogo} alt="Client Logo Preview" />
        )}
      </ImagePreview>

      <PreviewTitle 
        $accentColor={settings.accentColor ?? '#FFD700'}
        $textShadow={settings.textShadow}
      >
        {settings.reportTitle || 'AI Live Monitoring Report'}
      </PreviewTitle>

      <PreviewText>
        This is a comprehensive preview of your customized report theme. The report will include 
        real-time security monitoring data, AI-driven analytics, daily activity summaries, and 
        professional client presentation materials.
      </PreviewText>

      <PreviewHighlight>
        <strong>Security Metrics:</strong> Advanced AI detection with 99.3% accuracy, 
        real-time threat assessment, and automated response protocols.
      </PreviewHighlight>

      <div style={{ 
        marginTop: '1.5rem', 
        padding: '1rem',
        background: `linear-gradient(135deg, ${settings.primaryColor}20, ${settings.accentColor}20)`,
        borderRadius: `${settings.borderRadius || 12}px`,
        border: `2px solid ${settings.accentColor}40`
      }}>
        <div style={{ color: settings.accentColor, fontWeight: 'bold', marginBottom: '0.5rem' }}>
          Sample Data Visualization
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
          <span>Human Activities: 47</span>
          <span>Vehicle Activities: 23</span>
          <span>Security Alerts: 3</span>
        </div>
      </div>

      <div style={{ 
        marginTop: '1rem', 
        color: settings.accentColor,
        fontSize: '0.9rem',
        textAlign: 'center',
        opacity: 0.8
      }}>
        Professional security reporting • AI-enhanced monitoring • Real-time analytics
      </div>
    </PreviewContainer>
  );
};

export default ThemePreview;
