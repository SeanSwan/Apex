// Enhanced Professional Theme Builder with Advanced Features
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import styled, { css, keyframes } from 'styled-components';
import DragDropImageUpload from './DragDropImageUpload';
import { ThemeSettings } from '../../types/reports';
import { 
  Palette, Monitor, Type, Layers, Image, Sparkles, 
  Eye, RotateCcw, Save, Download, Zap, Sun, Moon,
  Blend, Grid, Settings, ChevronDown, ChevronUp,
  Copy, Check, Paintbrush, Sliders
} from 'lucide-react';

import defaultMarbleBackground from '../../assets/marble-texture.png';

// Enhanced Theme Settings Interface
interface ExtendedThemeSettings extends ThemeSettings {
  companyLogo?: string;
  clientLogo?: string;
  headerImage?: string;
  backgroundImage?: string;
  backgroundOpacity: number;
  reportTitle?: string;
  gradientDirection?: 'linear' | 'radial';
  gradientAngle?: number;
  enableGradient?: boolean;
  shadowIntensity?: number;
  borderRadius?: number;
  textShadow?: boolean;
  cardStyle?: 'modern' | 'classic' | 'minimal' | 'luxury';
  animationsEnabled?: boolean;
  darkMode?: boolean;
  customCSS?: string;
}

// Enhanced Animation Keyframes
const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
`;

const slideIn = keyframes`
  from { transform: translateX(-20px); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
`;

const pulse = keyframes`
  0% { box-shadow: 0 0 0 0 rgba(255, 215, 0, 0.4); }
  70% { box-shadow: 0 0 0 10px rgba(255, 215, 0, 0); }
  100% { box-shadow: 0 0 0 0 rgba(255, 215, 0, 0); }
`;

// Styled Components
const Section = styled.div`
  margin-top: 2rem;
  animation: ${fadeIn} 0.6s ease-out;
`;

const SectionTitle = styled.h3`
  font-size: 1.5rem;
  margin-bottom: 1.5rem;
  color: #FFD700;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  border-bottom: 3px solid rgba(255, 215, 0, 0.3);
  padding-bottom: 0.75rem;
  
  &::after {
    content: '';
    flex: 1;
    height: 2px;
    background: linear-gradient(90deg, rgba(255, 215, 0, 0.3) 0%, transparent 100%);
  }
`;

const TabContainer = styled.div`
  display: flex;
  margin-bottom: 2rem;
  background: rgba(0, 0, 0, 0.4);
  border-radius: 12px;
  padding: 0.5rem;
  backdrop-filter: blur(10px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  overflow-x: auto;
  gap: 0.5rem;
`;

interface TabProps {
  $active: boolean;
}

const Tab = styled.button<TabProps>`
  padding: 0.75rem 1.5rem;
  border: none;
  background: ${props => props.$active 
    ? 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)' 
    : 'transparent'};
  color: ${props => props.$active ? '#000' : '#ccc'};
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  white-space: nowrap;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  position: relative;
  overflow: hidden;
  
  &:hover {
    background: ${props => props.$active 
      ? 'linear-gradient(135deg, #FFA500 0%, #FF8C00 100%)' 
      : 'rgba(255, 215, 0, 0.1)'};
    color: ${props => props.$active ? '#000' : '#FFD700'};
    transform: translateY(-2px);
  }
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
    transition: left 0.5s;
  }
  
  &:hover::before {
    left: 100%;
  }
`;

const ContentContainer = styled.div`
  animation: ${slideIn} 0.4s ease-out;
`;

const SettingsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 2rem;
  margin-top: 1.5rem;
`;

const SettingCard = styled.div`
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%);
  border-radius: 16px;
  padding: 2rem;
  backdrop-filter: blur(15px);
  border: 1px solid rgba(255, 215, 0, 0.2);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
  
  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 12px 48px rgba(255, 215, 0, 0.15);
    border-color: rgba(255, 215, 0, 0.4);
  }
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: linear-gradient(90deg, #FFD700, #FFA500, #FFD700);
    opacity: 0;
    transition: opacity 0.3s ease;
  }
  
  &:hover::before {
    opacity: 1;
  }
`;

const SettingGroup = styled.div`
  margin-bottom: 2rem;
  position: relative;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 0.75rem;
  font-weight: 600;
  color: #e0e0e0;
  font-size: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  
  &::after {
    content: '';
    flex: 1;
    height: 1px;
    background: linear-gradient(90deg, rgba(255, 215, 0, 0.3), transparent);
    margin-left: 1rem;
  }
`;

const ColorInput = styled.input`
  width: 100%;
  height: 50px;
  padding: 0;
  border: 3px solid rgba(255, 215, 0, 0.3);
  border-radius: 12px;
  cursor: pointer;
  background-color: transparent;
  transition: all 0.3s ease;
  position: relative;
  
  &:hover {
    border-color: rgba(255, 215, 0, 0.6);
    box-shadow: 0 0 20px rgba(255, 215, 0, 0.3);
  }
  
  &:focus {
    outline: none;
    border-color: #FFD700;
    animation: ${pulse} 2s infinite;
  }
`;

const RangeSlider = styled.input`
  width: 100%;
  height: 8px;
  -webkit-appearance: none;
  background: linear-gradient(90deg, rgba(255, 215, 0, 0.3), rgba(255, 215, 0, 0.7));
  border-radius: 5px;
  outline: none;
  cursor: pointer;
  margin: 1rem 0;
  
  &::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 24px;
    height: 24px;
    background: linear-gradient(135deg, #FFD700, #FFA500);
    border-radius: 50%;
    cursor: pointer;
    box-shadow: 0 4px 12px rgba(255, 215, 0, 0.4);
    transition: all 0.3s ease;
  }
  
  &::-webkit-slider-thumb:hover {
    transform: scale(1.2);
    box-shadow: 0 6px 20px rgba(255, 215, 0, 0.6);
  }
  
  &::-moz-range-thumb {
    width: 24px;
    height: 24px;
    background: linear-gradient(135deg, #FFD700, #FFA500);
    border-radius: 50%;
    cursor: pointer;
    border: none;
    box-shadow: 0 4px 12px rgba(255, 215, 0, 0.4);
  }
`;

const SelectInput = styled.select`
  width: 100%;
  padding: 1rem;
  border: 2px solid rgba(255, 215, 0, 0.3);
  border-radius: 12px;
  background: rgba(0, 0, 0, 0.4);
  color: #e0e0e0;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);

  &:focus {
    border-color: #FFD700;
    outline: none;
    box-shadow: 0 0 0 3px rgba(255, 215, 0, 0.2);
  }
  
  &:hover {
    border-color: rgba(255, 215, 0, 0.6);
  }
  
  option {
    background: #2a2a2a;
    color: #e0e0e0;
    padding: 0.5rem;
  }
`;

const TextInput = styled.input`
  width: 100%;
  padding: 1rem;
  border: 2px solid rgba(255, 215, 0, 0.3);
  border-radius: 12px;
  background: rgba(0, 0, 0, 0.4);
  color: #e0e0e0;
  font-size: 1rem;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);

  &:focus {
    border-color: #FFD700;
    outline: none;
    box-shadow: 0 0 0 3px rgba(255, 215, 0, 0.2);
  }
  
  &:hover {
    border-color: rgba(255, 215, 0, 0.6);
  }

  &::placeholder {
    color: #888;
  }
`;

const TextArea = styled.textarea`
  width: 100%;
  min-height: 120px;
  padding: 1rem;
  border: 2px solid rgba(255, 215, 0, 0.3);
  border-radius: 12px;
  background: rgba(0, 0, 0, 0.4);
  color: #e0e0e0;
  font-family: 'Courier New', monospace;
  font-size: 0.9rem;
  resize: vertical;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);

  &:focus {
    border-color: #FFD700;
    outline: none;
    box-shadow: 0 0 0 3px rgba(255, 215, 0, 0.2);
  }
  
  &:hover {
    border-color: rgba(255, 215, 0, 0.6);
  }

  &::placeholder {
    color: #888;
  }
`;

interface PresetButtonProps {
  $active?: boolean;
}

const PresetButton = styled.button<PresetButtonProps>`
  padding: 1rem 1.5rem;
  margin: 0.5rem;
  background: ${props => props.$active 
    ? 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)' 
    : 'rgba(255, 255, 255, 0.1)'};
  color: ${props => props.$active ? '#000' : '#e0e0e0'};
  border: 2px solid ${props => props.$active ? '#FFD700' : 'rgba(255, 215, 0, 0.3)'};
  border-radius: 12px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
  backdrop-filter: blur(10px);

  &:hover {
    background: ${props => props.$active 
      ? 'linear-gradient(135deg, #FFA500 0%, #FF8C00 100%)' 
      : 'rgba(255, 215, 0, 0.2)'};
    border-color: #FFD700;
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(255, 215, 0, 0.3);
  }
  
  &::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    width: 0;
    height: 0;
    background: rgba(255, 255, 255, 0.3);
    transition: all 0.3s ease;
    border-radius: 50%;
    transform: translate(-50%, -50%);
  }
  
  &:active::before {
    width: 300px;
    height: 300px;
  }
`;

interface PreviewContainerProps {
  $bgColor: string;
  $textColor: string;
  $backgroundImage?: string;
  $gradientDirection?: string;
  $enableGradient?: boolean;
  $borderRadius?: number;
  $shadowIntensity?: number;
  $cardStyle?: string;
}

const PreviewContainer = styled.div<PreviewContainerProps>`
  margin-top: 2rem;
  padding: 2rem;
  border-radius: ${props => props.$borderRadius || 12}px;
  background: ${props => {
    if (props.$enableGradient && props.$gradientDirection) {
      return `linear-gradient(${props.$gradientDirection}, ${props.$bgColor}, ${props.$textColor}20)`;
    }
    return props.$bgColor;
  }};
  color: ${props => props.$textColor};
  position: relative;
  overflow: hidden;
  backdrop-filter: blur(15px);
  border: 2px solid rgba(255, 215, 0, 0.3);
  box-shadow: ${props => {
    const intensity = props.$shadowIntensity || 1;
    return `0 ${8 * intensity}px ${32 * intensity}px rgba(0, 0, 0, ${0.3 * intensity})`;
  }};
  transition: all 0.3s ease;

  ${props => props.$backgroundImage && css`
    background-image: url(${props.$backgroundImage});
    background-size: cover;
    background-position: center;
    background-blend-mode: overlay;
  `}
  
  ${props => props.$cardStyle === 'luxury' && css`
    background: linear-gradient(135deg, 
      rgba(255, 215, 0, 0.1) 0%, 
      rgba(255, 255, 255, 0.05) 50%, 
      rgba(255, 215, 0, 0.1) 100%);
    border: 2px solid #FFD700;
    box-shadow: 
      0 0 30px rgba(255, 215, 0, 0.3),
      inset 0 1px 0 rgba(255, 255, 255, 0.2);
  `}
  
  ${props => props.$cardStyle === 'minimal' && css`
    background: rgba(255, 255, 255, 0.02);
    border: 1px solid rgba(255, 255, 255, 0.1);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
    backdrop-filter: blur(20px);
  `}
  
  &:hover {
    border-color: rgba(255, 215, 0, 0.6);
    box-shadow: ${props => {
      const intensity = props.$shadowIntensity || 1;
      return `0 ${12 * intensity}px ${48 * intensity}px rgba(255, 215, 0, ${0.2 * intensity})`;
    }};
  }
`;

const PreviewHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid rgba(255, 215, 0, 0.2);
`;

const ImagePreview = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  gap: 1rem;
  position: relative;
  z-index: 2;

  img {
    max-height: 80px;
    max-width: 45%;
    object-fit: contain;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 12px;
    padding: 0.5rem;
    border: 2px solid rgba(255, 215, 0, 0.3);
    transition: all 0.3s ease;
    
    &:hover {
      border-color: rgba(255, 215, 0, 0.6);
      transform: scale(1.05);
    }
  }
`;

interface PreviewTitleProps {
  $accentColor: string;
  $textShadow?: boolean;
}

const PreviewTitle = styled.h3<PreviewTitleProps>`
  margin-bottom: 1rem;
  color: ${props => props.$accentColor};
  position: relative;
  z-index: 2;
  font-size: 1.5rem;
  font-weight: 700;
  text-shadow: ${props => props.$textShadow ? '0 2px 4px rgba(0, 0, 0, 0.5)' : 'none'};
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateX(5px);
  }
`;

const PreviewText = styled.p`
  margin-bottom: 1rem;
  position: relative;
  z-index: 2;
  line-height: 1.6;
  font-size: 1rem;
`;

const PreviewHighlight = styled.div`
  padding: 1rem;
  border-radius: 8px;
  position: relative;
  z-index: 2;
  margin: 1rem 0;
  border-left: 4px solid #FFD700;
  background: rgba(255, 215, 0, 0.1);
  transition: all 0.3s ease;
  
  &:hover {
    background: rgba(255, 215, 0, 0.2);
    transform: translateX(5px);
  }
`;

const ActionBar = styled.div`
  display: flex;
  gap: 1rem;
  margin-top: 2rem;
  flex-wrap: wrap;
  justify-content: center;
`;

const ActionButton = styled.button`
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 12px;
  background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%);
  color: #000;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  align-items: center;
  gap: 0.5rem;
  box-shadow: 0 4px 16px rgba(255, 215, 0, 0.3);
  
  &:hover {
    background: linear-gradient(135deg, #FFA500 0%, #FF8C00 100%);
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(255, 215, 0, 0.4);
  }
  
  &:active {
    transform: translateY(0);
  }
`;

const ToggleSwitch = styled.label`
  position: relative;
  display: inline-block;
  width: 60px;
  height: 34px;
  margin-left: auto;

  input {
    opacity: 0;
    width: 0;
    height: 0;
  }

  span {
    position: absolute;
    cursor: pointer;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(255, 255, 255, 0.2);
    transition: 0.4s;
    border-radius: 34px;
    border: 2px solid rgba(255, 215, 0, 0.3);

    &:before {
      position: absolute;
      content: "";
      height: 24px;
      width: 24px;
      left: 3px;
      bottom: 3px;
      background: linear-gradient(135deg, #FFD700, #FFA500);
      transition: 0.4s;
      border-radius: 50%;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
    }
  }

  input:checked + span {
    background: rgba(255, 215, 0, 0.3);
    border-color: #FFD700;
  }

  input:checked + span:before {
    transform: translateX(26px);
    box-shadow: 0 2px 8px rgba(255, 215, 0, 0.4);
  }
`;

const CollapsibleSection = styled.div<{ $expanded: boolean }>`
  background: rgba(0, 0, 0, 0.2);
  border-radius: 12px;
  margin: 1rem 0;
  overflow: hidden;
  transition: all 0.3s ease;
  border: 1px solid rgba(255, 215, 0, 0.2);
  
  &:hover {
    border-color: rgba(255, 215, 0, 0.4);
  }
`;

const CollapsibleHeader = styled.div`
  padding: 1rem 1.5rem;
  cursor: pointer;
  background: rgba(255, 215, 0, 0.05);
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: all 0.3s ease;
  
  &:hover {
    background: rgba(255, 215, 0, 0.1);
  }
`;

const CollapsibleContent = styled.div<{ $expanded: boolean }>`
  max-height: ${props => props.$expanded ? '2000px' : '0'};
  overflow: hidden;
  transition: max-height 0.3s ease;
  padding: ${props => props.$expanded ? '1.5rem' : '0 1.5rem'};
`;

// Enhanced Theme Presets with more variety
const themePresets = [
  {
    name: 'Professional Dark',
    primaryColor: '#FFFFFF',
    secondaryColor: '#1A1A1A',
    accentColor: '#FFD700',
    fontFamily: 'Inter, sans-serif',
    backgroundImage: defaultMarbleBackground,
    cardStyle: 'modern',
    enableGradient: false,
    shadowIntensity: 1.2,
    borderRadius: 12,
  },
  {
    name: 'Luxury Gold',
    primaryColor: '#2c3e50',
    secondaryColor: '#f8f9fa',
    accentColor: '#FFD700',
    fontFamily: 'Georgia, serif',
    backgroundImage: undefined,
    cardStyle: 'luxury',
    enableGradient: true,
    gradientDirection: '135deg',
    shadowIntensity: 1.5,
    borderRadius: 16,
  },
  {
    name: 'Minimal Clean',
    primaryColor: '#2c3e50',
    secondaryColor: '#ffffff',
    accentColor: '#3498db',
    fontFamily: 'Helvetica, sans-serif',
    backgroundImage: undefined,
    cardStyle: 'minimal',
    enableGradient: false,
    shadowIntensity: 0.5,
    borderRadius: 8,
  },
  {
    name: 'Corporate Blue',
    primaryColor: '#ffffff',
    secondaryColor: '#1e3a8a',
    accentColor: '#60a5fa',
    fontFamily: 'Arial, sans-serif',
    backgroundImage: undefined,
    cardStyle: 'modern',
    enableGradient: true,
    gradientDirection: '45deg',
    shadowIntensity: 1,
    borderRadius: 10,
  },
  {
    name: 'Security Red',
    primaryColor: '#f8fafc',
    secondaryColor: '#1f2937',
    accentColor: '#ef4444',
    fontFamily: 'Roboto, sans-serif',
    backgroundImage: undefined,
    cardStyle: 'modern',
    enableGradient: false,
    shadowIntensity: 1.3,
    borderRadius: 14,
  },
  {
    name: 'Elegant Purple',
    primaryColor: '#faf5ff',
    secondaryColor: '#4c1d95',
    accentColor: '#a855f7',
    fontFamily: 'Playfair Display, serif',
    backgroundImage: undefined,
    cardStyle: 'luxury',
    enableGradient: true,
    gradientDirection: '315deg',
    shadowIntensity: 1.4,
    borderRadius: 18,
  },
];

interface ThemeBuilderProps {
  settings: ExtendedThemeSettings;
  onChange: (settings: Partial<ExtendedThemeSettings>) => void;
}

const ThemeBuilder: React.FC<ThemeBuilderProps> = ({ settings, onChange }) => {
  const [activeTab, setActiveTab] = useState<string>('presets');
  const [activePreset, setActivePreset] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    basic: true,
    advanced: false,
    effects: false,
    custom: false,
  });
  const [copiedColor, setCopiedColor] = useState<string | null>(null);

  // Enhanced settings with defaults
  const enhancedSettings = useMemo(() => ({
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
  }), [settings]);

  const applyPreset = useCallback((preset: typeof themePresets[0]) => {
    setActivePreset(preset.name);
    onChange({
      primaryColor: preset.primaryColor,
      secondaryColor: preset.secondaryColor,
      accentColor: preset.accentColor,
      fontFamily: preset.fontFamily,
      backgroundImage: preset.backgroundImage,
      cardStyle: preset.cardStyle,
      enableGradient: preset.enableGradient,
      gradientDirection: preset.gradientDirection,
      shadowIntensity: preset.shadowIntensity,
      borderRadius: preset.borderRadius,
    });
  }, [onChange]);

  const handleImageUpload = useCallback((type: 'headerImage' | 'backgroundImage' | 'companyLogo' | 'clientLogo', imageData: string | null) => {
    onChange({ [type]: imageData });
  }, [onChange]);

  const toggleSection = useCallback((section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  }, []);

  const copyColorToClipboard = useCallback(async (color: string, colorName: string) => {
    try {
      await navigator.clipboard.writeText(color);
      setCopiedColor(colorName);
      setTimeout(() => setCopiedColor(null), 2000);
    } catch (err) {
      console.error('Failed to copy color:', err);
    }
  }, []);

  const resetToDefaults = useCallback(() => {
    onChange({
      primaryColor: '#FFFFFF',
      secondaryColor: '#1A1A1A',
      accentColor: '#FFD700',
      fontFamily: 'Inter, sans-serif',
      backgroundOpacity: 0.7,
      reportTitle: 'AI Live Monitoring Report',
      headerImage: defaultMarbleBackground,
      backgroundImage: defaultMarbleBackground,
      shadowIntensity: 1,
      borderRadius: 12,
      textShadow: false,
      cardStyle: 'modern',
      enableGradient: false,
      customCSS: '',
    });
    setActivePreset(null);
  }, [onChange]);

  const tabs = [
    { id: 'presets', label: 'Presets', icon: Palette },
    { id: 'colors', label: 'Colors', icon: Paintbrush },
    { id: 'layout', label: 'Layout', icon: Grid },
    { id: 'media', label: 'Media', icon: Image },
    { id: 'effects', label: 'Effects', icon: Sparkles },
    { id: 'advanced', label: 'Advanced', icon: Settings },
  ];

  return (
    <Section>
      <SectionTitle>
        <Palette size={24} />
        Advanced Theme Customization
      </SectionTitle>

      <TabContainer>
        {tabs.map(tab => {
          const IconComponent = tab.icon;
          return (
            <Tab
              key={tab.id}
              $active={activeTab === tab.id}
              onClick={() => setActiveTab(tab.id)}
            >
              <IconComponent size={18} />
              {tab.label}
            </Tab>
          );
        })}
      </TabContainer>

      <ContentContainer>
        {activeTab === 'presets' && (
          <div>
            <h4 style={{ color: '#FFD700', marginBottom: '1.5rem', fontSize: '1.25rem' }}>
              Professional Theme Presets
            </h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
              {themePresets.map(preset => (
                <PresetButton
                  key={preset.name}
                  $active={activePreset === preset.name}
                  onClick={() => applyPreset(preset)}
                >
                  {preset.name}
                </PresetButton>
              ))}
            </div>
            <ActionBar>
              <ActionButton onClick={resetToDefaults}>
                <RotateCcw size={18} />
                Reset to Defaults
              </ActionButton>
            </ActionBar>
          </div>
        )}

        {activeTab === 'colors' && (
          <SettingsGrid>
            <SettingCard>
              <SettingGroup>
                <Label>
                  <Paintbrush size={18} />
                  Primary Color (Text/Foreground)
                </Label>
                <ColorInput
                  type="color"
                  value={enhancedSettings.primaryColor ?? '#FFFFFF'}
                  onChange={(e) => onChange({ primaryColor: e.target.value })}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
                  <span style={{ fontSize: '0.9rem', color: '#ccc' }}>
                    {enhancedSettings.primaryColor ?? '#FFFFFF'}
                  </span>
                  <button
                    onClick={() => copyColorToClipboard(enhancedSettings.primaryColor ?? '#FFFFFF', 'primary')}
                    style={{ background: 'none', border: 'none', color: '#FFD700', cursor: 'pointer' }}
                  >
                    {copiedColor === 'primary' ? <Check size={16} /> : <Copy size={16} />}
                  </button>
                </div>
              </SettingGroup>
            </SettingCard>

            <SettingCard>
              <SettingGroup>
                <Label>
                  <Layers size={18} />
                  Secondary Color (Background/Overlay)
                </Label>
                <ColorInput
                  type="color"
                  value={enhancedSettings.secondaryColor ?? '#1A1A1A'}
                  onChange={(e) => onChange({ secondaryColor: e.target.value })}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
                  <span style={{ fontSize: '0.9rem', color: '#ccc' }}>
                    {enhancedSettings.secondaryColor ?? '#1A1A1A'}
                  </span>
                  <button
                    onClick={() => copyColorToClipboard(enhancedSettings.secondaryColor ?? '#1A1A1A', 'secondary')}
                    style={{ background: 'none', border: 'none', color: '#FFD700', cursor: 'pointer' }}
                  >
                    {copiedColor === 'secondary' ? <Check size={16} /> : <Copy size={16} />}
                  </button>
                </div>
              </SettingGroup>
            </SettingCard>

            <SettingCard>
              <SettingGroup>
                <Label>
                  <Zap size={18} />
                  Accent Color (Highlights)
                </Label>
                <ColorInput
                  type="color"
                  value={enhancedSettings.accentColor ?? '#FFD700'}
                  onChange={(e) => onChange({ accentColor: e.target.value })}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
                  <span style={{ fontSize: '0.9rem', color: '#ccc' }}>
                    {enhancedSettings.accentColor ?? '#FFD700'}
                  </span>
                  <button
                    onClick={() => copyColorToClipboard(enhancedSettings.accentColor ?? '#FFD700', 'accent')}
                    style={{ background: 'none', border: 'none', color: '#FFD700', cursor: 'pointer' }}
                  >
                    {copiedColor === 'accent' ? <Check size={16} /> : <Copy size={16} />}
                  </button>
                </div>
              </SettingGroup>
            </SettingCard>

            <SettingCard>
              <SettingGroup>
                <Label>
                  <Blend size={18} />
                  Enable Gradient Background
                  <ToggleSwitch>
                    <input
                      type="checkbox"
                      checked={enhancedSettings.enableGradient ?? false}
                      onChange={(e) => onChange({ enableGradient: e.target.checked })}
                    />
                    <span></span>
                  </ToggleSwitch>
                </Label>
                {enhancedSettings.enableGradient && (
                  <>
                    <Label style={{ marginTop: '1rem' }}>Gradient Angle: {enhancedSettings.gradientAngle ?? 135}°</Label>
                    <RangeSlider
                      type="range"
                      min="0"
                      max="360"
                      step="15"
                      value={enhancedSettings.gradientAngle ?? 135}
                      onChange={(e) => onChange({ gradientAngle: parseInt(e.target.value) })}
                    />
                  </>
                )}
              </SettingGroup>
            </SettingCard>
          </SettingsGrid>
        )}

        {activeTab === 'layout' && (
          <SettingsGrid>
            <SettingCard>
              <SettingGroup>
                <Label>
                  <Type size={18} />
                  Font Family
                </Label>
                <SelectInput
                  value={enhancedSettings.fontFamily ?? 'Inter, sans-serif'}
                  onChange={(e) => onChange({ fontFamily: e.target.value })}
                >
                  <option value="Inter, sans-serif">Inter (Modern)</option>
                  <option value="Arial, sans-serif">Arial (Standard)</option>
                  <option value="Georgia, serif">Georgia (Traditional)</option>
                  <option value="Roboto, sans-serif">Roboto (Clean)</option>
                  <option value="Verdana, sans-serif">Verdana (Readable)</option>
                  <option value="Helvetica, sans-serif">Helvetica (Professional)</option>
                  <option value="Times New Roman, serif">Times New Roman (Formal)</option>
                  <option value="Playfair Display, serif">Playfair Display (Elegant)</option>
                  <option value="Montserrat, sans-serif">Montserrat (Contemporary)</option>
                </SelectInput>
              </SettingGroup>
            </SettingCard>

            <SettingCard>
              <SettingGroup>
                <Label>
                  <Grid size={18} />
                  Card Style
                </Label>
                <SelectInput
                  value={enhancedSettings.cardStyle ?? 'modern'}
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
                <Label>Border Radius: {enhancedSettings.borderRadius ?? 12}px</Label>
                <RangeSlider
                  type="range"
                  min="0"
                  max="30"
                  step="2"
                  value={enhancedSettings.borderRadius ?? 12}
                  onChange={(e) => onChange({ borderRadius: parseInt(e.target.value) })}
                />
              </SettingGroup>
            </SettingCard>

            <SettingCard>
              <SettingGroup>
                <Label>
                  Report Title
                </Label>
                <TextInput
                  type="text"
                  placeholder="AI Live Monitoring Report"
                  value={enhancedSettings.reportTitle || ''}
                  onChange={(e) => onChange({ reportTitle: e.target.value })}
                />
              </SettingGroup>
            </SettingCard>
          </SettingsGrid>
        )}

        {activeTab === 'media' && (
          <SettingsGrid>
            <SettingCard>
              <SettingGroup>
                <Label>Company Logo</Label>
                <DragDropImageUpload
                  label="companyLogo"
                  onImageUpload={(imageData) => handleImageUpload('companyLogo', imageData)}
                  storedImage={enhancedSettings.companyLogo}
                />
              </SettingGroup>
            </SettingCard>

            <SettingCard>
              <SettingGroup>
                <Label>Client Logo</Label>
                <DragDropImageUpload
                  label="clientLogo"
                  onImageUpload={(imageData) => handleImageUpload('clientLogo', imageData)}
                  storedImage={enhancedSettings.clientLogo}
                />
              </SettingGroup>
            </SettingCard>

            <SettingCard>
              <SettingGroup>
                <Label>Header Background Image</Label>
                <DragDropImageUpload
                  label="headerImage"
                  onImageUpload={(imageData) => handleImageUpload('headerImage', imageData)}
                  storedImage={enhancedSettings.headerImage}
                />
              </SettingGroup>
            </SettingCard>

            <SettingCard>
              <SettingGroup>
                <Label>Report Background Image</Label>
                <DragDropImageUpload
                  label="backgroundImage"
                  onImageUpload={(imageData) => handleImageUpload('backgroundImage', imageData)}
                  storedImage={enhancedSettings.backgroundImage}
                />
                <Label style={{ marginTop: '1rem' }}>
                  Background Opacity: {(enhancedSettings.backgroundOpacity ?? 0.7).toFixed(1)}
                </Label>
                <RangeSlider
                  type="range"
                  min="0.1"
                  max="1"
                  step="0.1"
                  value={enhancedSettings.backgroundOpacity ?? 0.7}
                  onChange={(e) => onChange({ backgroundOpacity: parseFloat(e.target.value) })}
                />
              </SettingGroup>
            </SettingCard>
          </SettingsGrid>
        )}

        {activeTab === 'effects' && (
          <SettingsGrid>
            <SettingCard>
              <SettingGroup>
                <Label>Shadow Intensity: {(enhancedSettings.shadowIntensity ?? 1).toFixed(1)}</Label>
                <RangeSlider
                  type="range"
                  min="0"
                  max="3"
                  step="0.1"
                  value={enhancedSettings.shadowIntensity ?? 1}
                  onChange={(e) => onChange({ shadowIntensity: parseFloat(e.target.value) })}
                />
              </SettingGroup>
            </SettingCard>

            <SettingCard>
              <SettingGroup>
                <Label>
                  <Sparkles size={18} />
                  Text Shadow
                  <ToggleSwitch>
                    <input
                      type="checkbox"
                      checked={enhancedSettings.textShadow ?? false}
                      onChange={(e) => onChange({ textShadow: e.target.checked })}
                    />
                    <span></span>
                  </ToggleSwitch>
                </Label>
              </SettingGroup>
            </SettingCard>

            <SettingCard>
              <SettingGroup>
                <Label>
                  <Zap size={18} />
                  Animations Enabled
                  <ToggleSwitch>
                    <input
                      type="checkbox"
                      checked={enhancedSettings.animationsEnabled ?? true}
                      onChange={(e) => onChange({ animationsEnabled: e.target.checked })}
                    />
                    <span></span>
                  </ToggleSwitch>
                </Label>
              </SettingGroup>
            </SettingCard>

            <SettingCard>
              <SettingGroup>
                <Label>
                  {enhancedSettings.darkMode ? <Moon size={18} /> : <Sun size={18} />}
                  Dark Mode
                  <ToggleSwitch>
                    <input
                      type="checkbox"
                      checked={enhancedSettings.darkMode ?? true}
                      onChange={(e) => onChange({ darkMode: e.target.checked })}
                    />
                    <span></span>
                  </ToggleSwitch>
                </Label>
              </SettingGroup>
            </SettingCard>
          </SettingsGrid>
        )}

        {activeTab === 'advanced' && (
          <div>
            <CollapsibleSection $expanded={expandedSections.custom}>
              <CollapsibleHeader onClick={() => toggleSection('custom')}>
                <h4 style={{ margin: 0, color: '#FFD700' }}>Custom CSS</h4>
                {expandedSections.custom ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </CollapsibleHeader>
              <CollapsibleContent $expanded={expandedSections.custom}>
                <Label>Custom CSS (Advanced Users)</Label>
                <TextArea
                  placeholder="/* Add your custom CSS here */&#10;.preview-container {&#10;  /* Your styles */&#10;}"
                  value={enhancedSettings.customCSS || ''}
                  onChange={(e) => onChange({ customCSS: e.target.value })}
                />
                <div style={{ marginTop: '1rem', padding: '1rem', background: 'rgba(255, 215, 0, 0.1)', borderRadius: '8px', fontSize: '0.85rem', color: '#ccc' }}>
                  <strong style={{ color: '#FFD700' }}>Pro Tip:</strong> Use CSS variables for consistent theming:
                  <br />• <code>--primary-color</code> • <code>--secondary-color</code> • <code>--accent-color</code>
                </div>
              </CollapsibleContent>
            </CollapsibleSection>

            <ActionBar>
              <ActionButton onClick={() => onChange({ customCSS: '' })}>
                <RotateCcw size={18} />
                Clear Custom CSS
              </ActionButton>
            </ActionBar>
          </div>
        )}
      </ContentContainer>

      {/* Enhanced Live Preview */}
      <PreviewContainer
        $backgroundImage={enhancedSettings.backgroundImage}
        $bgColor={enhancedSettings.secondaryColor ?? '#1A1A1A'}
        $textColor={enhancedSettings.primaryColor ?? '#FFFFFF'}
        $gradientDirection={`${enhancedSettings.gradientAngle ?? 135}deg`}
        $enableGradient={enhancedSettings.enableGradient}
        $borderRadius={enhancedSettings.borderRadius}
        $shadowIntensity={enhancedSettings.shadowIntensity}
        $cardStyle={enhancedSettings.cardStyle}
      >
        <PreviewHeader>
          <h4 style={{ margin: 0, color: '#FFD700' }}>Live Theme Preview</h4>
          <Eye size={20} color="#FFD700" />
        </PreviewHeader>

        <ImagePreview>
          {enhancedSettings.companyLogo && (
            <img src={enhancedSettings.companyLogo} alt="Company Logo Preview" />
          )}
          {enhancedSettings.clientLogo && (
            <img src={enhancedSettings.clientLogo} alt="Client Logo Preview" />
          )}
        </ImagePreview>

        <PreviewTitle 
          $accentColor={enhancedSettings.accentColor ?? '#FFD700'}
          $textShadow={enhancedSettings.textShadow}
        >
          {enhancedSettings.reportTitle || 'AI Live Monitoring Report'}
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
          background: `linear-gradient(135deg, ${enhancedSettings.primaryColor}20, ${enhancedSettings.accentColor}20)`,
          borderRadius: `${enhancedSettings.borderRadius || 12}px`,
          border: `2px solid ${enhancedSettings.accentColor}40`
        }}>
          <div style={{ color: enhancedSettings.accentColor, fontWeight: 'bold', marginBottom: '0.5rem' }}>
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
          color: enhancedSettings.accentColor,
          fontSize: '0.9rem',
          textAlign: 'center',
          opacity: 0.8
        }}>
          Professional security reporting • AI-enhanced monitoring • Real-time analytics
        </div>
      </PreviewContainer>

      <ActionBar>
        <ActionButton onClick={() => setActiveTab('presets')}>
          <Palette size={18} />
          Quick Presets
        </ActionButton>
        <ActionButton onClick={resetToDefaults}>
          <RotateCcw size={18} />
          Reset All
        </ActionButton>
        <ActionButton onClick={() => console.log('Saving theme...')}>
          <Save size={18} />
          Save Theme
        </ActionButton>
        <ActionButton onClick={() => console.log('Exporting theme...')}>
          <Download size={18} />
          Export Theme
        </ActionButton>
      </ActionBar>
    </Section>
  );
};

export default ThemeBuilder;