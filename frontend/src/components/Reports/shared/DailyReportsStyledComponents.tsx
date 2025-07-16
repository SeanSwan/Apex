/**
 * Daily Reports Styled Components - UI Components for Daily Reports Panel
 * Extracted from DailyReportsPanel for better modularity
 * Production-ready styled components with responsive design and marble textures
 */

import styled, { css } from 'styled-components';
import { Button } from '../../ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../ui/tabs';
import { Badge } from '../../ui/badge';
import { Label } from '../../ui/label';

// ===== INTERFACES & TYPES =====

export interface ReportTabsTriggerProps {
  $completed?: boolean;
  $status?: string;
}

export interface ProgressFillProps {
  $progress: number;
  $completed?: boolean;
}

export interface CharCountProps {
  $isLow: boolean;
}

export interface SecurityCodeBadgeProps {
  code: string;
}

export interface WordCountBadgeProps {
  $count: number;
}

export interface CollapseButtonProps {
  $expanded: boolean;
}

// ===== MAIN LAYOUT COMPONENTS =====

/**
 * Main section container with dark theme and marble texture support
 */
export const Section = styled.div`
  margin-bottom: 2rem;
  background-color: #1e1e1e;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
`;

/**
 * Section header with gold accent styling
 */
export const SectionHeader = styled.div`
  padding: 1.25rem;
  background-color: #191919;
  border-bottom: 2px solid #333;
`;

/**
 * Section title with responsive font sizing
 */
export const SectionTitle = styled.h3`
  font-size: clamp(1.1rem, 3vw, 1.25rem);
  margin: 0;
  font-weight: 600;
  color: #e5c76b;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

// ===== BULK IMPORT COMPONENTS =====

/**
 * Bulk import section with gradient background and marble texture
 */
export const BulkImportSection = styled.div`
  padding: 1.5rem;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  border-bottom: 2px solid #333;
  position: relative;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-image: url('/src/assets/marble-texture.png');
    background-size: cover;
    background-position: center;
    opacity: 0.1;
    z-index: 0;
  }
  
  & > * {
    position: relative;
    z-index: 1;
  }
`;

/**
 * Bulk import title with gold styling
 */
export const BulkImportTitle = styled.h4`
  font-size: 1.125rem;
  margin-bottom: 1rem;
  color: #FFD700;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

/**
 * Bulk import description text
 */
export const BulkImportDescription = styled.p`
  font-size: 0.9rem;
  color: #aaa;
  margin-bottom: 1rem;
  line-height: 1.5;
`;

/**
 * Large text area for bulk report import
 */
export const BulkTextArea = styled.textarea`
  width: 100%;
  min-height: 300px;
  padding: 1rem;
  background-color: rgba(0, 0, 0, 0.7);
  color: #e0e0e0;
  border: 2px solid #444;
  border-radius: 8px;
  font-family: 'Courier New', monospace;
  font-size: 0.9rem;
  line-height: 1.6;
  resize: vertical;
  transition: border-color 0.2s ease;
  box-sizing: border-box;
  
  &:focus {
    outline: none;
    border-color: #FFD700;
    box-shadow: 0 0 0 2px rgba(255, 215, 0, 0.2);
  }
  
  &::placeholder {
    color: #666;
  }
`;

/**
 * Button container for bulk import actions
 */
export const BulkImportButtons = styled.div`
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
  flex-wrap: wrap;
`;

/**
 * Processing indicator with pulse animation
 */
export const ProcessingIndicator = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: #FFD700;
  margin-top: 0.5rem;
  animation: pulse 2s infinite;
  
  @keyframes pulse {
    0% { opacity: 0.6; }
    50% { opacity: 1; }
    100% { opacity: 0.6; }
  }
`;

/**
 * Import preview container
 */
export const ImportPreview = styled.div`
  margin-top: 1rem;
  padding: 1rem;
  background-color: rgba(0, 0, 0, 0.5);
  border-radius: 8px;
  border: 1px solid #444;
  max-height: 200px;
  overflow-y: auto;
`;

/**
 * Individual preview item with gold accent
 */
export const PreviewItem = styled.div`
  margin-bottom: 0.75rem;
  padding: 0.5rem;
  background-color: rgba(255, 215, 0, 0.1);
  border-radius: 4px;
  border-left: 3px solid #FFD700;
`;

/**
 * Preview day header
 */
export const PreviewDay = styled.div`
  font-weight: 600;
  color: #FFD700;
  margin-bottom: 0.25rem;
`;

/**
 * Preview content text
 */
export const PreviewContent = styled.div`
  font-size: 0.8rem;
  color: #ccc;
  white-space: pre-wrap;
  word-wrap: break-word;
`;

// ===== TAB SYSTEM COMPONENTS =====

/**
 * Main tabs container
 */
export const ReportTabs = styled(Tabs)`
  margin-bottom: 0;
`;

/**
 * Tabs list with horizontal scroll
 */
export const ReportTabsList = styled(TabsList)`
  display: flex;
  overflow-x: auto;
  scrollbar-width: thin;
  scrollbar-color: #666 #2a2a2a;
  padding: 1rem;
  margin-bottom: 0;
  gap: 0.5rem;
  background-color: #212121;
  border-bottom: 1px solid #333;
  
  &::-webkit-scrollbar {
    height: 6px;
  }
  
  &::-webkit-scrollbar-track {
    background: #2a2a2a;
    border-radius: 3px;
  }
  
  &::-webkit-scrollbar-thumb {
    background: #666;
    border-radius: 3px;
  }
  
  &::-webkit-scrollbar-thumb:hover {
    background: #888;
  }
  
  & > * {
    flex-shrink: 0;
  }
`;

/**
 * Individual tab trigger with completion status
 */
export const ReportTabsTrigger = styled(TabsTrigger).withConfig({
  shouldForwardProp: (prop) => !['$completed', '$status', 'status', 'completed'].includes(prop as string),
})<ReportTabsTriggerProps>`
  position: relative;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  white-space: nowrap;
  padding: 0.75rem 1rem;
  background-color: #2a2a2a;
  color: #ccc;
  border: 1px solid #444;
  
  &[data-state="active"] {
    background-color: ${props => props.$completed ? 'rgba(46, 125, 50, 0.2)' : 'rgba(0, 112, 243, 0.15)'};
    color: ${props => props.$completed ? '#2ecc71' : '#3498db'};
    font-weight: 600;
    border-color: ${props => props.$completed ? 'rgba(46, 125, 50, 0.5)' : 'rgba(0, 112, 243, 0.5)'};
  }
  
  @media (max-width: 768px) {
    font-size: 0.875rem;
    padding: 0.6rem 0.8rem;
  }
  
  &::after {
    content: '';
    display: ${props => props.$completed ? 'block' : 'none'};
    position: absolute;
    top: 4px;
    right: 4px;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background-color: ${props => props.$completed ? '#2ecc71' : 'transparent'};
  }
`;

/**
 * Tab content with marble texture background
 */
export const ReportTabsContent = styled(TabsContent)`
  background-image: url('/src/assets/marble-texture.png');
  background-size: cover;
  background-position: center;
  position: relative;
  padding: clamp(0.75rem, 3vw, 1.5rem);
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(20, 20, 20, 0.85);
    z-index: 0;
  }
  
  & > * {
    position: relative;
    z-index: 1;
  }
`;

/**
 * Tabs header with title and controls
 */
export const TabsHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
  padding: 0.75rem 1rem;
  background-color: #212121;
  border-bottom: 1px solid #333;
`;

/**
 * Tabs header title
 */
export const TabsHeaderTitle = styled.div`
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #e0e0e0;
`;

/**
 * Report header title with gold styling
 */
export const ReportHeaderTitle = styled.div`
  font-weight: 600;
  font-size: 1.125rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #e5c76b;
  margin-bottom: 1rem;
`;

/**
 * Collapse/expand button
 */
export const CollapseButton = styled.button<CollapseButtonProps>`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: none;
  border: none;
  padding: 0.5rem;
  font-size: 0.875rem;
  color: #e5c76b;
  cursor: pointer;
  margin-left: auto;
  
  &:hover {
    text-decoration: underline;
  }
`;

// ===== PROGRESS COMPONENTS =====

/**
 * Progress tracking container
 */
export const ProgressContainer = styled.div`
  margin-bottom: 1.5rem;
  padding: 1.25rem;
  background-color: #212121;
`;

/**
 * Progress details with responsive layout
 */
export const ProgressDetails = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
  flex-wrap: wrap;
  gap: 0.5rem;
`;

/**
 * Progress text with responsive alignment
 */
export const ProgressText = styled.span`
  font-size: 0.875rem;
  color: #ccc;
  flex-basis: calc(50% - 0.25rem);
  text-align: right;
  
  &:first-child {
    text-align: left;
  }
  
  @media (max-width: 480px) {
    flex-basis: 100%;
    text-align: left;
    
    &:last-child {
      font-weight: 600;
      text-align: right;
      color: #e5c76b;
    }
  }
`;

/**
 * Progress bar track
 */
export const ProgressBar = styled.div`
  height: 8px;
  background-color: #2a2a2a;
  border-radius: 4px;
  overflow: hidden;
`;

/**
 * Progress bar fill with completion styling
 */
export const ProgressFill = styled.div<ProgressFillProps>`
  height: 100%;
  width: ${props => `${props.$progress}%`};
  background-color: ${props => props.$completed ? '#2ecc71' : '#3498db'};
  transition: width 0.3s ease-in-out;
`;

/**
 * Word count badge with status colors
 */
export const WordCountBadge = styled.div<WordCountBadgeProps>`
  padding: 0.25rem 0.5rem;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 500;
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  margin-left: 0.5rem;
  background-color: ${props => {
    if (props.$count < 50) return 'rgba(231, 76, 60, 0.2)';
    if (props.$count < 100) return 'rgba(241, 196, 15, 0.2)';
    return 'rgba(46, 204, 113, 0.2)';
  }};
  color: ${props => {
    if (props.$count < 50) return '#e74c3c';
    if (props.$count < 100) return '#f1c40f';
    return '#2ecc71';
  }};
`;

// ===== FORM COMPONENTS =====

/**
 * Text area container with relative positioning
 */
export const TextAreaContainer = styled.div`
  position: relative;
  margin: 1.5rem 0;
`;

/**
 * Main text area for report content
 */
export const TextArea = styled.textarea`
  width: 100%;
  min-height: 200px;
  padding: 1rem;
  padding-bottom: 2rem;
  background-color: rgba(0, 0, 0, 0.3);
  color: #e0e0e0;
  border: 1px solid #444;
  border-radius: 8px;
  font-family: inherit;
  font-size: 0.95rem;
  line-height: 1.6;
  resize: vertical;
  transition: border-color 0.2s ease;
  box-sizing: border-box;
  
  &:focus {
    outline: none;
    border-color: #e5c76b;
    box-shadow: 0 0 0 2px rgba(229, 199, 107, 0.2);
  }
  
  &::placeholder {
    color: #777;
  }
  
  @media (max-width: 640px) {
    min-height: 180px;
    font-size: 0.9rem;
  }
`;

/**
 * Character count indicator
 */
export const CharCount = styled.div<CharCountProps>`
  position: absolute;
  bottom: 0.75rem;
  right: 0.75rem;
  font-size: 0.75rem;
  color: ${props => props.$isLow ? '#e74c3c' : '#999'};
  background-color: rgba(0, 0, 0, 0.6);
  padding: 0.125rem 0.35rem;
  border-radius: 4px;
  z-index: 1;
`;

/**
 * AI prompt indicator
 */
export const AIPromptIndicator = styled.div`
  position: absolute;
  top: 0.5rem;
  right: 0.75rem;
  font-size: 0.75rem;
  color: #e5c76b;
  display: flex;
  align-items: center;
  gap: 0.25rem;
  transition: opacity 0.3s ease;
  opacity: 0;
  animation: fadeIn 0.5s ease-in forwards;
  
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
`;

/**
 * Controls row with responsive grid
 */
export const ControlsRow = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 1.5rem;
  align-items: center;
  
  @media (max-width: 600px) {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
`;

/**
 * Control group for form elements
 */
export const ControlGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
  
  & > select {
    flex-grow: 1;
    min-width: 150px;
  }
`;

/**
 * Control label styling
 */
export const ControlLabel = styled.label`
  font-size: 0.875rem;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  white-space: nowrap;
  color: #e0e0e0;
`;

/**
 * Select dropdown styling
 */
export const Select = styled.select`
  padding: 0.5rem;
  background-color: #2a2a2a;
  color: #e0e0e0;
  border: 1px solid #444;
  border-radius: 4px;
  font-size: 0.875rem;
  width: 100%;
  
  &:focus {
    outline: none;
    border-color: #e5c76b;
    box-shadow: 0 0 0 2px rgba(229, 199, 107, 0.2);
  }
  
  option {
    background-color: #2a2a2a;
    color: #e0e0e0;
  }
`;

/**
 * Text input styling
 */
export const TextInput = styled.input`
  width: 100%;
  padding: 0.75rem;
  background-color: rgba(0, 0, 0, 0.3);
  color: #e0e0e0;
  border: 1px solid #444;
  border-radius: 4px;
  font-size: 0.95rem;
  
  &:focus {
    outline: none;
    border-color: #e5c76b;
    box-shadow: 0 0 0 2px rgba(229, 199, 107, 0.2);
  }
  
  &::placeholder {
    color: #777;
  }
  
  @media (max-width: 640px) {
    padding: 0.5rem;
    font-size: 0.875rem;
  }
`;

// ===== BUTTON COMPONENTS =====

/**
 * Button group container
 */
export const ButtonGroup = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 0.75rem;
  margin-top: 1.5rem;
`;

/**
 * Expanded button group
 */
export const ExpandedButtonGroup = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  flex-grow: 1;
  justify-content: flex-start;
`;

/**
 * Styled button with theme integration
 */
export const StyledButton = styled(Button)`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background-color: ${props => props.variant === 'default' ? '#e5c76b' : 'transparent'};
  color: ${props => props.variant === 'default' ? '#1a1a1a' : '#e0e0e0'};
  border: 1px solid ${props => props.variant === 'default' ? '#e5c76b' : '#444'};
  
  &:hover:not(:disabled) {
    background-color: ${props => props.variant === 'default' ? '#d4b65c' : 'rgba(229, 199, 107, 0.15)'};
    border-color: ${props => props.variant === 'default' ? '#d4b65c' : '#e5c76b'};
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

/**
 * Special bulk import button with gradient
 */
export const BulkButton = styled(StyledButton)`
  background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%);
  color: #1a1a1a;
  font-weight: 600;
  border: none;
  box-shadow: 0 2px 8px rgba(255, 215, 0, 0.3);
  
  &:hover:not(:disabled) {
    background: linear-gradient(135deg, #FFA500 0%, #FF8C00 100%);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(255, 215, 0, 0.4);
  }
`;

// ===== BADGE COMPONENTS =====

/**
 * Security code badge with dynamic colors
 */
export const SecurityCodeBadge = styled(Badge)<SecurityCodeBadgeProps>`
  padding: 0.35rem 0.5rem;
  font-size: 0.75rem;
  background-color: ${props => {
    switch(props.code) {
      case 'Code 4': return 'rgba(46, 204, 113, 0.2)';
      case 'Code 3': return 'rgba(241, 196, 15, 0.2)';
      case 'Code 2': return 'rgba(230, 126, 34, 0.2)';
      case 'Code 1': return 'rgba(231, 76, 60, 0.2)';
      default: return 'rgba(189, 195, 199, 0.2)';
    }
  }};
  color: ${props => {
    switch(props.code) {
      case 'Code 4': return '#2ecc71';
      case 'Code 3': return '#f1c40f';
      case 'Code 2': return '#e67e22';
      case 'Code 1': return '#e74c3c';
      default: return '#bdc3c7';
    }
  }};
`;

// ===== CARD SECTION COMPONENTS =====

/**
 * Base card section with marble texture and random positioning
 */
export const CardSection = styled.div`
  position: relative;
  background-image: url('/src/assets/marble-texture.png');
  background-size: ${() => 100 + Math.random() * 50}%;
  background-position: ${() => {
    const positions = ['top left', 'center', 'top right', 'bottom left', 'bottom right', '30% 70%', '70% 30%'];
    return positions[Math.floor(Math.random() * positions.length)];
  }};
  border-radius: 8px;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.7);
    z-index: 0;
  }
  
  & > * {
    position: relative;
    z-index: 1;
  }
`;

/**
 * Summary section with card styling
 */
export const SummarySection = styled(CardSection)`
  margin-top: 2rem;
  padding: 1.5rem;
  
  @media (max-width: 640px) {
    padding: 1rem;
  }
`;

/**
 * Summary section title
 */
export const SummarySectionTitle = styled.h4`
  font-size: 1.125rem;
  margin-bottom: 1rem;
  color: #e5c76b;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

/**
 * Signature section with card styling
 */
export const SignatureSection = styled(CardSection)`
  margin-top: 1.5rem;
  padding: 1.5rem;
  
  @media (max-width: 640px) {
    padding: 1rem;
  }
`;

/**
 * AI options section with card styling
 */
export const AIOptionsSection = styled(CardSection)`
  margin-top: 2rem;
  padding: 1.5rem;
  background-position: 65% 35%;
  
  @media (max-width: 640px) {
    padding: 1rem;
  }
`;

// ===== INPUT GROUP COMPONENTS =====

/**
 * Input group container
 */
export const InputGroup = styled.div`
  margin-bottom: 1rem;
`;

/**
 * Input label styling
 */
export const InputLabel = styled(Label)`
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #e0e0e0;
`;

// ===== CHECKBOX COMPONENTS =====

/**
 * Checkbox group with responsive grid
 */
export const CheckboxGroup = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 0.75rem;
  margin-top: 1rem;
  
  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
`;

/**
 * Checkbox label with hover effects
 */
export const CheckboxLabel = styled.label`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  cursor: pointer;
  padding: 0.375rem;
  border-radius: 4px;
  color: #e0e0e0;
  transition: background-color 0.2s ease;
  
  &:hover {
    background-color: rgba(229, 199, 107, 0.1);
  }
`;

/**
 * Checkbox input styling
 */
export const Checkbox = styled.input`
  width: 16px;
  height: 16px;
  cursor: pointer;
  accent-color: #e5c76b;
`;

// ===== UTILITY COMPONENTS =====

/**
 * Autosave indicator with pulse animation
 */
export const AutosaveIndicator = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.75rem;
  color: #999;
  animation: pulse 2s infinite;
  margin-left: 0.5rem;
  
  @keyframes pulse {
    0% { opacity: 0.6; }
    50% { opacity: 1; }
    100% { opacity: 0.6; }
  }
`;

// ===== DEFAULT EXPORT =====

export default {
  // Layout
  Section,
  SectionHeader,
  SectionTitle,
  
  // Bulk Import
  BulkImportSection,
  BulkImportTitle,
  BulkImportDescription,
  BulkTextArea,
  BulkImportButtons,
  ProcessingIndicator,
  ImportPreview,
  PreviewItem,
  PreviewDay,
  PreviewContent,
  
  // Tabs
  ReportTabs,
  ReportTabsList,
  ReportTabsTrigger,
  ReportTabsContent,
  TabsHeader,
  TabsHeaderTitle,
  ReportHeaderTitle,
  CollapseButton,
  
  // Progress
  ProgressContainer,
  ProgressDetails,
  ProgressText,
  ProgressBar,
  ProgressFill,
  WordCountBadge,
  
  // Forms
  TextAreaContainer,
  TextArea,
  CharCount,
  AIPromptIndicator,
  ControlsRow,
  ControlGroup,
  ControlLabel,
  Select,
  TextInput,
  
  // Buttons
  ButtonGroup,
  ExpandedButtonGroup,
  StyledButton,
  BulkButton,
  
  // Badges
  SecurityCodeBadge,
  
  // Cards
  CardSection,
  SummarySection,
  SummarySectionTitle,
  SignatureSection,
  AIOptionsSection,
  
  // Input Groups
  InputGroup,
  InputLabel,
  
  // Checkboxes
  CheckboxGroup,
  CheckboxLabel,
  Checkbox,
  
  // Utils
  AutosaveIndicator
};