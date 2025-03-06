// File: frontend/src/components/Reports/HeaderCustomization.tsx
/**
 * HeaderCustomization.tsx
 *
 * Allows users to customize the report header and background.
 * - Users can select a header image via drag & drop.
 * - They can choose from 10+ themes, including a "Custom" option.
 * - If "Custom" is selected, users can set their own colors.
 * - A background image can also be set (with drag & drop) along with an opacity slider.
 *
 * Future enhancements:
 *   - Animate transitions when images/themes change.
 *   - Persist theme settings to the database.
 */

import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import DragDropImageUpload from './DragDropImageUpload';

// Container for the customization section.
const Container = styled.div`
  padding: 1rem;
  margin-bottom: 1rem;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  background: #f8f8f8;
`;

// Title styling.
const SectionTitle = styled.h2`
  font-size: 1.25rem;
  margin-bottom: 0.5rem;
`;

// Flex container for image options.
const ImageSelection = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 1rem;
`;

// Container for theme selection.
const BackgroundSelection = styled.div`
  margin: 1rem 0;
`;

// Button for selecting a theme.
// Using $active instead of active to prevent the prop from leaking to the DOM
const ThemeButton = styled.button<{ $active: boolean }>`
  margin-right: 0.5rem;
  padding: 0.5rem 1rem;
  border: ${(props) => (props.$active ? '2px solid #007bff' : '1px solid #ccc')};
  background: ${(props) => (props.$active ? '#e6f0ff' : '#fff')};
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.2s ease;
  &:hover {
    background: #e6f0ff;
  }
`;

// Styled input for text.
const TextInput = styled.input`
  padding: 0.5rem;
  width: 100%;
  margin-top: 0.5rem;
  border: 1px solid #ccc;
  border-radius: 4px;
`;

// Styled input for opacity.
const RangeInput = styled.input`
  margin-top: 0.5rem;
  width: 100%;
`;

interface HeaderCustomizationProps {
  headerImage: string;
  setHeaderImage: (image: string) => void;
  backgroundTheme: string;
  setBackgroundTheme: (theme: string) => void;
  backgroundImage: string;
  setBackgroundImage: (url: string) => void;
  backgroundOpacity: number;
  setBackgroundOpacity: (opacity: number) => void;
}

const presetThemes = [
  { name: 'Default', value: 'theme-default' },
  { name: 'Dark', value: 'theme-dark' },
  { name: 'Blue', value: 'theme-blue' },
  { name: 'Green', value: 'theme-green' },
  { name: 'Purple', value: 'theme-purple' },
  { name: 'Orange', value: 'theme-orange' },
  { name: 'Modern', value: 'theme-modern' },
  { name: 'Classic', value: 'theme-classic' },
  { name: 'Minimal', value: 'theme-minimal' },
  { name: 'Custom', value: 'theme-custom' },
];

const HeaderCustomization: React.FC<HeaderCustomizationProps> = ({
  headerImage,
  setHeaderImage,
  backgroundTheme,
  setBackgroundTheme,
  backgroundImage,
  setBackgroundImage,
  backgroundOpacity,
  setBackgroundOpacity,
}) => {
  // State for custom theme inputs (only used if "Custom" is selected)
  const [customBackgroundColor, setCustomBackgroundColor] = useState('#ffffff');
  const [customTextColor, setCustomTextColor] = useState('#000000');
  const [customAccentColor, setCustomAccentColor] = useState('#007bff');

  // Optionally load previously saved custom theme settings from localStorage.
  useEffect(() => {
    const savedBg = localStorage.getItem('customBackgroundColor');
    const savedText = localStorage.getItem('customTextColor');
    const savedAccent = localStorage.getItem('customAccentColor');
    if (savedBg) setCustomBackgroundColor(savedBg);
    if (savedText) setCustomTextColor(savedText);
    if (savedAccent) setCustomAccentColor(savedAccent);
  }, []);

  // Save custom theme settings when they change.
  useEffect(() => {
    if (backgroundTheme === 'theme-custom') {
      localStorage.setItem('customBackgroundColor', customBackgroundColor);
      localStorage.setItem('customTextColor', customTextColor);
      localStorage.setItem('customAccentColor', customAccentColor);
    }
  }, [customBackgroundColor, customTextColor, customAccentColor, backgroundTheme]);

  return (
    <Container>
      <SectionTitle>Customize Report Header & Background</SectionTitle>

      {/* Drag & Drop for Header Image */}
      <DragDropImageUpload
        label="headerImage"
        onImageUpload={setHeaderImage}
        storedImage={localStorage.getItem('headerImage') || headerImage}
      />

      {/* Drag & Drop for Background Image */}
      <DragDropImageUpload
        label="backgroundImage"
        onImageUpload={setBackgroundImage}
        storedImage={localStorage.getItem('backgroundImage') || backgroundImage}
      />

      {/* Opacity Slider for Background Image */}
      <div>
        <strong>Background Image Opacity: {backgroundOpacity}</strong>
        <RangeInput
          type="range"
          min="0.1"
          max="1"
          step="0.1"
          value={backgroundOpacity}
          onChange={(e) => setBackgroundOpacity(parseFloat(e.target.value))}
        />
      </div>

      {/* Theme Selection */}
      <BackgroundSelection>
        <strong>Select Background Theme:</strong>
        <div>
          {presetThemes.map((theme) => (
            <ThemeButton
              key={theme.value}
              $active={backgroundTheme === theme.value}
              onClick={() => setBackgroundTheme(theme.value)}
            >
              {theme.name}
            </ThemeButton>
          ))}
        </div>
      </BackgroundSelection>

      {/* If "Custom" theme is selected, show custom theme inputs */}
      {backgroundTheme === 'theme-custom' && (
        <div>
          <strong>Customize Your Theme:</strong>
          <div>
            <label>Background Color:</label>
            <TextInput
              type="color"
              value={customBackgroundColor}
              onChange={(e) => setCustomBackgroundColor(e.target.value)}
            />
          </div>
          <div>
            <label>Text Color:</label>
            <TextInput
              type="color"
              value={customTextColor}
              onChange={(e) => setCustomTextColor(e.target.value)}
            />
          </div>
          <div>
            <label>Accent Color:</label>
            <TextInput
              type="color"
              value={customAccentColor}
              onChange={(e) => setCustomAccentColor(e.target.value)}
            />
          </div>
          {/* Future Enhancement: Preview custom theme changes live */}
        </div>
      )}
    </Container>
  );
};

export default HeaderCustomization;