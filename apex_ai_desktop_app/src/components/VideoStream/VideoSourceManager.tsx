// apex_ai_desktop_app/src/components/VideoStream/VideoSourceManager.tsx
/**
 * VIDEO SOURCE MANAGER COMPONENT
 * ==============================
 * Configuration interface for managing video sources (screen capture, RTSP, webcam)
 * Provides easy setup and testing of video streams for AI monitoring
 * 
 * MASTER PROMPT v54.6 COMPLIANCE:
 * - TypeScript with proper interfaces and type safety
 * - Styled Components integration for consistent theming
 * - User-friendly interface for video source configuration
 */

import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';

// ===========================
// TYPES & INTERFACES
// ===========================

interface VideoSource {
  id: string;
  name: string;
  type: 'screen_capture' | 'rtsp' | 'webcam' | 'file';
  url?: string;
  region?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  active: boolean;
  status?: 'connected' | 'disconnected' | 'error' | 'testing';
  lastFrame?: string;
  settings?: {
    resolution?: string;
    fps?: number;
    quality?: number;
  };
}

interface VideoSourceManagerProps {
  onSourceSelected?: (source: VideoSource) => void;
  onSourceTested?: (source: VideoSource, success: boolean) => void;
  currentSources?: VideoSource[];
}

interface ScreenDisplay {
  id: string;
  name: string;
  width: number;
  height: number;
  isPrimary: boolean;
}

// ===========================
// STYLED COMPONENTS
// ===========================

const ManagerContainer = styled.div`
  width: 100%;
  height: 100%;
  background-color: ${({ theme }) => theme.colors.background};
  color: ${({ theme }) => theme.colors.text};
  padding: ${({ theme }) => theme.spacing.lg};
  overflow-y: auto;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${({ theme }) => theme.spacing.xl};
  padding-bottom: ${({ theme }) => theme.spacing.md};
  border-bottom: 2px solid ${({ theme }) => theme.colors.border};
`;

const Title = styled.h2`
  font-size: ${({ theme }) => theme.typography.fontSize.xl};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  color: ${({ theme }) => theme.colors.text};
  margin: 0;
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};

  &::before {
    content: '📹';
    font-size: ${({ theme }) => theme.typography.fontSize.lg};
  }
`;

const QuickStartSection = styled.div`
  background-color: ${({ theme }) => theme.colors.backgroundCard};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  padding: ${({ theme }) => theme.spacing.lg};
  margin-bottom: ${({ theme }) => theme.spacing.xl};
`;

const SectionTitle = styled.h3`
  font-size: ${({ theme }) => theme.typography.fontSize.lg};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  color: ${({ theme }) => theme.colors.text};
  margin: 0 0 ${({ theme }) => theme.spacing.md} 0;
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
`;

const QuickStartGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: ${({ theme }) => theme.spacing.lg};
`;

const QuickStartCard = styled.div`
  background-color: ${({ theme }) => theme.colors.backgroundLight};
  border: 2px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  padding: ${({ theme }) => theme.spacing.lg};
  cursor: pointer;
  transition: all 0.3s ease;
  text-align: center;

  &:hover {
    border-color: ${({ theme }) => theme.colors.primary};
    background-color: ${({ theme }) => theme.colors.backgroundCard};
    transform: translateY(-2px);
    box-shadow: ${({ theme }) => theme.shadows.md};
  }
`;

const CardIcon = styled.div`
  font-size: 3rem;
  margin-bottom: ${({ theme }) => theme.spacing.md};
`;

const CardTitle = styled.h4`
  font-size: ${({ theme }) => theme.typography.fontSize.md};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  color: ${({ theme }) => theme.colors.text};
  margin: 0 0 ${({ theme }) => theme.spacing.sm} 0;
`;

const CardDescription = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.textMuted};
  margin: 0 0 ${({ theme }) => theme.spacing.md} 0;
  line-height: 1.4;
`;

const Button = styled.button<{ variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' }>`
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.lg};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: ${({ theme }) => theme.spacing.xs};
  width: 100%;

  ${({ variant, theme }) => {
    switch (variant) {
      case 'primary':
        return `
          background-color: ${theme.colors.primary};
          color: ${theme.colors.background};
          &:hover { background-color: ${theme.colors.primaryDark}; }
        `;
      case 'success':
        return `
          background-color: ${theme.colors.success};
          color: ${theme.colors.background};
          &:hover { background-color: #059669; }
        `;
      case 'warning':
        return `
          background-color: ${theme.colors.warning};
          color: ${theme.colors.background};
          &:hover { background-color: #d97706; }
        `;
      case 'danger':
        return `
          background-color: ${theme.colors.error};
          color: ${theme.colors.background};
          &:hover { background-color: #dc2626; }
        `;
      default:
        return `
          background-color: ${theme.colors.backgroundLight};
          color: ${theme.colors.text};
          border: 1px solid ${theme.colors.border};
          &:hover { background-color: ${theme.colors.backgroundCard}; }
        `;
    }
  }}

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const ConfigurationSection = styled.div`
  background-color: ${({ theme }) => theme.colors.backgroundCard};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  padding: ${({ theme }) => theme.spacing.lg};
  margin-bottom: ${({ theme }) => theme.spacing.xl};
`;

const FormGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: ${({ theme }) => theme.spacing.md};
  margin-bottom: ${({ theme }) => theme.spacing.lg};
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.xs};
`;

const Label = styled.label`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  color: ${({ theme }) => theme.colors.text};
`;

const Input = styled.input<{ hasError?: boolean }>`
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
  border: 1px solid ${({ theme, hasError }) => hasError ? theme.colors.error : theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  background-color: ${({ theme }) => theme.colors.backgroundLight};
  color: ${({ theme }) => theme.colors.text};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  transition: all 0.2s ease;

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary};
    box-shadow: 0 0 0 2px ${({ theme }) => theme.colors.primary}25;
  }

  &::placeholder {
    color: ${({ theme }) => theme.colors.textMuted};
  }
`;

const Select = styled.select<{ hasError?: boolean }>`
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
  border: 1px solid ${({ theme, hasError }) => hasError ? theme.colors.error : theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  background-color: ${({ theme }) => theme.colors.backgroundLight};
  color: ${({ theme }) => theme.colors.text};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  cursor: pointer;
  transition: all 0.2s ease;

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary};
    box-shadow: 0 0 0 2px ${({ theme }) => theme.colors.primary}25;
  }
`;

const HelpText = styled.small`
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
`;

const ErrorMessage = styled.span`
  color: ${({ theme }) => theme.colors.error};
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xs};

  &::before {
    content: '⚠️';
  }
`;

const SourcesList = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: ${({ theme }) => theme.spacing.md};
`;

const SourceCard = styled.div<{ status?: string }>`
  background-color: ${({ theme }) => theme.colors.backgroundLight};
  border: 2px solid ${({ status, theme }) => {
    switch (status) {
      case 'connected': return theme.colors.success;
      case 'error': return theme.colors.error;
      case 'testing': return theme.colors.warning;
      default: return theme.colors.border;
    }
  }};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  padding: ${({ theme }) => theme.spacing.md};
  transition: all 0.2s ease;

  &:hover {
    border-color: ${({ theme }) => theme.colors.primary};
    box-shadow: ${({ theme }) => theme.shadows.sm};
  }
`;

const SourceHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: ${({ theme }) => theme.spacing.sm};
`;

const SourceTitle = styled.h4`
  font-size: ${({ theme }) => theme.typography.fontSize.md};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  color: ${({ theme }) => theme.colors.text};
  margin: 0;
`;

const StatusBadge = styled.span<{ status?: string }>`
  padding: 2px 8px;
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  background-color: ${({ status, theme }) => {
    switch (status) {
      case 'connected': return theme.colors.success;
      case 'error': return theme.colors.error;
      case 'testing': return theme.colors.warning;
      default: return theme.colors.textMuted;
    }
  }};
  color: ${({ theme }) => theme.colors.background};
`;

const SourceDetails = styled.div`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.textSecondary};
  margin-bottom: ${({ theme }) => theme.spacing.md};
  line-height: 1.4;
`;

const SourceActions = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.sm};
`;

const ActionButton = styled.button<{ variant?: 'primary' | 'secondary' | 'danger' }>`
  padding: ${({ theme }) => theme.spacing.xs} ${({ theme }) => theme.spacing.sm};
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;
  flex: 1;

  ${({ variant, theme }) => {
    switch (variant) {
      case 'primary':
        return `
          background-color: ${theme.colors.primary};
          color: ${theme.colors.background};
          &:hover { background-color: ${theme.colors.primaryDark}; }
        `;
      case 'danger':
        return `
          background-color: ${theme.colors.error};
          color: ${theme.colors.background};
          &:hover { background-color: #dc2626; }
        `;
      default:
        return `
          background-color: ${theme.colors.backgroundCard};
          color: ${theme.colors.text};
          border: 1px solid ${theme.colors.border};
          &:hover { background-color: ${theme.colors.background}; }
        `;
    }
  }}
`;

// ===========================
// MAIN COMPONENT
// ===========================

const VideoSourceManager: React.FC<VideoSourceManagerProps> = ({
  onSourceSelected,
  onSourceTested,
  currentSources = []
}) => {
  const [sources, setSources] = useState<VideoSource[]>(currentSources);
  const [selectedType, setSelectedType] = useState<string>('');
  const [formData, setFormData] = useState({
    name: '',
    url: '',
    region: { x: 0, y: 0, width: 1920, height: 1080 },
    settings: { resolution: '1920x1080', fps: 30, quality: 80 }
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [testingSource, setTestingSource] = useState<string>('');
  const [availableDisplays, setAvailableDisplays] = useState<ScreenDisplay[]>([]);

  // Quick start options
  const quickStartOptions = [
    {
      type: 'screen_capture',
      icon: '🖥️',
      title: 'Screen Capture',
      description: 'Capture your desktop or specific regions for monitoring',
      action: () => setupScreenCapture()
    },
    {
      type: 'webcam',
      icon: '📷',
      title: 'Webcam',
      description: 'Use built-in or USB camera for live monitoring',
      action: () => setupWebcam()
    },
    {
      type: 'rtsp',
      icon: '📡',
      title: 'IP Camera (RTSP)',
      description: 'Connect to network cameras via RTSP stream',
      action: () => setupRTSP()
    },
    {
      type: 'file',
      icon: '📁',
      title: 'Video File',
      description: 'Load video files for testing and analysis',
      action: () => setupVideoFile()
    }
  ];

  // Initialize component
  useEffect(() => {
    loadAvailableDisplays();
    setSources(currentSources);
  }, [currentSources]);

  // Load available displays for screen capture
  const loadAvailableDisplays = useCallback(async () => {
    // Mock data - in real implementation, this would come from Electron API
    const displays: ScreenDisplay[] = [
      { id: 'display_1', name: 'Primary Display', width: 1920, height: 1080, isPrimary: true },
      { id: 'display_2', name: 'Secondary Display', width: 1440, height: 900, isPrimary: false }
    ];
    setAvailableDisplays(displays);
  }, []);

  // Setup screen capture
  const setupScreenCapture = useCallback(() => {
    setSelectedType('screen_capture');
    setFormData({
      name: 'Screen Capture',
      url: '',
      region: { x: 0, y: 0, width: 1920, height: 1080 },
      settings: { resolution: '1920x1080', fps: 15, quality: 80 }
    });
  }, []);

  // Setup webcam
  const setupWebcam = useCallback(() => {
    setSelectedType('webcam');
    setFormData({
      name: 'Webcam',
      url: '',
      region: { x: 0, y: 0, width: 640, height: 480 },
      settings: { resolution: '640x480', fps: 30, quality: 85 }
    });
  }, []);

  // Setup RTSP camera
  const setupRTSP = useCallback(() => {
    setSelectedType('rtsp');
    setFormData({
      name: 'IP Camera',
      url: 'rtsp://username:password@camera-ip:554/stream',
      region: { x: 0, y: 0, width: 1920, height: 1080 },
      settings: { resolution: '1920x1080', fps: 25, quality: 90 }
    });
  }, []);

  // Setup video file
  const setupVideoFile = useCallback(() => {
    setSelectedType('file');
    setFormData({
      name: 'Video File',
      url: 'path/to/video/file.mp4',
      region: { x: 0, y: 0, width: 1920, height: 1080 },
      settings: { resolution: 'auto', fps: 30, quality: 95 }
    });
  }, []);

  // Handle form input changes
  const handleInputChange = useCallback((field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  }, [errors]);

  // Validate form
  const validateForm = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Source name is required';
    }

    if (selectedType === 'rtsp' && !formData.url.trim()) {
      newErrors.url = 'RTSP URL is required';
    }

    if (selectedType === 'file' && !formData.url.trim()) {
      newErrors.url = 'Video file path is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData, selectedType]);

  // Create new video source
  const createVideoSource = useCallback(() => {
    if (!validateForm()) return;

    const newSource: VideoSource = {
      id: `source_${Date.now()}`,
      name: formData.name,
      type: selectedType as VideoSource['type'],
      url: formData.url || undefined,
      region: formData.region,
      active: false,
      status: 'disconnected',
      settings: formData.settings
    };

    setSources(prev => [...prev, newSource]);
    onSourceSelected?.(newSource);

    // Reset form
    setSelectedType('');
    setFormData({
      name: '',
      url: '',
      region: { x: 0, y: 0, width: 1920, height: 1080 },
      settings: { resolution: '1920x1080', fps: 30, quality: 80 }
    });
  }, [validateForm, formData, selectedType, onSourceSelected]);

  // Test video source
  const testVideoSource = useCallback(async (source: VideoSource) => {
    setTestingSource(source.id);
    
    // Update source status
    setSources(prev => 
      prev.map(s => s.id === source.id ? { ...s, status: 'testing' } : s)
    );

    try {
      // Mock test - in real implementation, this would test the actual source
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const success = Math.random() > 0.3; // 70% success rate for demo
      
      setSources(prev => 
        prev.map(s => s.id === source.id ? { 
          ...s, 
          status: success ? 'connected' : 'error' 
        } : s)
      );

      onSourceTested?.(source, success);
      
    } catch (error) {
      setSources(prev => 
        prev.map(s => s.id === source.id ? { ...s, status: 'error' } : s)
      );
      onSourceTested?.(source, false);
    } finally {
      setTestingSource('');
    }
  }, [onSourceTested]);

  // Remove video source
  const removeVideoSource = useCallback((sourceId: string) => {
    setSources(prev => prev.filter(s => s.id !== sourceId));
  }, []);

  return (
    <ManagerContainer>
      <Header>
        <Title>Video Source Manager</Title>
      </Header>

      {/* Quick Start Section */}
      <QuickStartSection>
        <SectionTitle>⚡ Quick Start</SectionTitle>
        <QuickStartGrid>
          {quickStartOptions.map(option => (
            <QuickStartCard key={option.type} onClick={option.action}>
              <CardIcon>{option.icon}</CardIcon>
              <CardTitle>{option.title}</CardTitle>
              <CardDescription>{option.description}</CardDescription>
              <Button variant="primary">
                🚀 Setup {option.title}
              </Button>
            </QuickStartCard>
          ))}
        </QuickStartGrid>
      </QuickStartSection>

      {/* Configuration Section */}
      {selectedType && (
        <ConfigurationSection>
          <SectionTitle>⚙️ Configure {selectedType.replace('_', ' ').toUpperCase()}</SectionTitle>
          
          <FormGrid>
            <FormGroup>
              <Label>Source Name</Label>
              <Input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Enter descriptive name"
                hasError={!!errors.name}
              />
              {errors.name && <ErrorMessage>{errors.name}</ErrorMessage>}
            </FormGroup>

            {(selectedType === 'rtsp' || selectedType === 'file') && (
              <FormGroup>
                <Label>{selectedType === 'rtsp' ? 'RTSP URL' : 'File Path'}</Label>
                <Input
                  type="text"
                  value={formData.url}
                  onChange={(e) => handleInputChange('url', e.target.value)}
                  placeholder={selectedType === 'rtsp' 
                    ? 'rtsp://username:password@ip:554/stream' 
                    : 'C:\\Videos\\sample.mp4'
                  }
                  hasError={!!errors.url}
                />
                {errors.url && <ErrorMessage>{errors.url}</ErrorMessage>}
              </FormGroup>
            )}

            <FormGroup>
              <Label>Resolution</Label>
              <Select
                value={formData.settings.resolution}
                onChange={(e) => handleInputChange('settings', {
                  ...formData.settings,
                  resolution: e.target.value
                })}
              >
                <option value="1920x1080">1920x1080 (Full HD)</option>
                <option value="1280x720">1280x720 (HD)</option>
                <option value="640x480">640x480 (VGA)</option>
                <option value="auto">Auto</option>
              </Select>
            </FormGroup>

            <FormGroup>
              <Label>Frame Rate (FPS)</Label>
              <Select
                value={formData.settings.fps}
                onChange={(e) => handleInputChange('settings', {
                  ...formData.settings,
                  fps: parseInt(e.target.value)
                })}
              >
                <option value={15}>15 FPS</option>
                <option value={25}>25 FPS</option>
                <option value={30}>30 FPS</option>
                <option value={60}>60 FPS</option>
              </Select>
            </FormGroup>

            <FormGroup>
              <Label>Quality (%)</Label>
              <Input
                type="range"
                min="50"
                max="100"
                value={formData.settings.quality}
                onChange={(e) => handleInputChange('settings', {
                  ...formData.settings,
                  quality: parseInt(e.target.value)
                })}
              />
              <HelpText>Current: {formData.settings.quality}%</HelpText>
            </FormGroup>
          </FormGrid>

          <Button variant="success" onClick={createVideoSource}>
            ✅ Create Video Source
          </Button>
        </ConfigurationSection>
      )}

      {/* Current Sources */}
      {sources.length > 0 && (
        <ConfigurationSection>
          <SectionTitle>📹 Current Video Sources</SectionTitle>
          <SourcesList>
            {sources.map(source => (
              <SourceCard key={source.id} status={source.status}>
                <SourceHeader>
                  <SourceTitle>{source.name}</SourceTitle>
                  <StatusBadge status={source.status}>
                    {source.status?.toUpperCase() || 'UNKNOWN'}
                  </StatusBadge>
                </SourceHeader>
                
                <SourceDetails>
                  <div>📱 Type: {source.type.replace('_', ' ').toUpperCase()}</div>
                  {source.url && <div>🔗 URL: {source.url}</div>}
                  <div>📐 Resolution: {source.settings?.resolution}</div>
                  <div>🎬 FPS: {source.settings?.fps}</div>
                </SourceDetails>
                
                <SourceActions>
                  <ActionButton 
                    variant="primary"
                    onClick={() => testVideoSource(source)}
                    disabled={testingSource === source.id}
                  >
                    {testingSource === source.id ? '🔄 Testing...' : '🧪 Test'}
                  </ActionButton>
                  <ActionButton onClick={() => onSourceSelected?.(source)}>
                    ▶️ Use
                  </ActionButton>
                  <ActionButton 
                    variant="danger"
                    onClick={() => removeVideoSource(source.id)}
                  >
                    🗑️
                  </ActionButton>
                </SourceActions>
              </SourceCard>
            ))}
          </SourcesList>
        </ConfigurationSection>
      )}
    </ManagerContainer>
  );
};

export default VideoSourceManager;