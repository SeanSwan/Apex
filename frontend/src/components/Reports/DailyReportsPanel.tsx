// Enhanced Daily Reports Panel with Bulk Import Feature
import React from 'react';
import styled, { css } from 'styled-components';
import { format } from 'date-fns';
import { DailyReport, DailyReportStatus, SecurityCode, AIOptions } from '../../types/reports';
import { AIReportAssistant } from './AIReportAssistant';
import { Button } from '../ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../ui/tabs';
import { Badge } from '../ui/badge';
import { Label } from '../ui/label';
import { Switch } from '../ui/switch';
import {
  Check, Edit, Calendar, Clock, AlertTriangle, Shield, CheckCircle, Info, Lock,
  FileCheck, FileText, PanelLeftClose, PanelLeftOpen, Sparkles, ChevronDown, ChevronUp, RefreshCw,
  Upload, FileUp, Copy, Zap, Target, Layers
} from 'lucide-react';

// Import constants and utilities
import {
  REPORT_STATUS_OPTIONS,
  SECURITY_CODE_OPTIONS,
  VALIDATION_RULES,
  DEFAULT_CONTACT_INFO,
  PLACEHOLDER_TEXT,
  SAMPLE_BULK_IMPORT_TEXT,
  TEST_FORMAT_EXAMPLES,
  UI_MESSAGES,
  BUTTON_TEXT
} from './constants';

// Import utility functions and hooks
import {
  useDailyReportsPanel
} from './utils';

import {
  getWordCount,
  isContentSufficient
} from './constants';

// Styled components (keeping existing styles)
const Section = styled.div`
  margin-bottom: 2rem;
  background-color: #1e1e1e;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
`;

const SectionHeader = styled.div`
  padding: 1.25rem;
  background-color: #191919;
  border-bottom: 2px solid #333;
`;

const SectionTitle = styled.h3`
  font-size: clamp(1.1rem, 3vw, 1.25rem);
  margin: 0;
  font-weight: 600;
  color: #e5c76b;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

// New Bulk Import Section Styles
const BulkImportSection = styled.div`
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

const BulkImportTitle = styled.h4`
  font-size: 1.125rem;
  margin-bottom: 1rem;
  color: #FFD700;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const BulkImportDescription = styled.p`
  font-size: 0.9rem;
  color: #aaa;
  margin-bottom: 1rem;
  line-height: 1.5;
`;

const BulkTextArea = styled.textarea`
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

const BulkImportButtons = styled.div`
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
  flex-wrap: wrap;
`;

const ProcessingIndicator = styled.div`
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

const ImportPreview = styled.div`
  margin-top: 1rem;
  padding: 1rem;
  background-color: rgba(0, 0, 0, 0.5);
  border-radius: 8px;
  border: 1px solid #444;
  max-height: 200px;
  overflow-y: auto;
`;

const PreviewItem = styled.div`
  margin-bottom: 0.75rem;
  padding: 0.5rem;
  background-color: rgba(255, 215, 0, 0.1);
  border-radius: 4px;
  border-left: 3px solid #FFD700;
`;

const PreviewDay = styled.div`
  font-weight: 600;
  color: #FFD700;
  margin-bottom: 0.25rem;
`;

const PreviewContent = styled.div`
  font-size: 0.8rem;
  color: #ccc;
  white-space: pre-wrap;
  word-wrap: break-word;
`;

// Existing styles continue...
const ReportTabs = styled(Tabs)`
  margin-bottom: 0;
`;

const ReportTabsList = styled(TabsList)`
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

interface ReportTabsTriggerProps {
  $completed?: boolean;
  $status?: string;
}

const ReportTabsTrigger = styled(TabsTrigger).withConfig({
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

const ReportTabsContent = styled(TabsContent)`
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

const ProgressContainer = styled.div`
  margin-bottom: 1.5rem;
  padding: 1.25rem;
  background-color: #212121;
`;

const ProgressDetails = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
  flex-wrap: wrap;
  gap: 0.5rem;
`;

const ProgressText = styled.span`
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

const ProgressBar = styled.div`
  height: 8px;
  background-color: #2a2a2a;
  border-radius: 4px;
  overflow: hidden;
`;

interface ProgressFillProps {
  $progress: number;
  $completed?: boolean;
}

const ProgressFill = styled.div<ProgressFillProps>`
  height: 100%;
  width: ${props => `${props.$progress}%`};
  background-color: ${props => props.$completed ? '#2ecc71' : '#3498db'};
  transition: width 0.3s ease-in-out;
`;

const TextAreaContainer = styled.div`
  position: relative;
  margin: 1.5rem 0;
`;

const TextArea = styled.textarea`
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

interface CharCountProps {
  $isLow: boolean;
}

const CharCount = styled.div<CharCountProps>`
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

const AIPromptIndicator = styled.div`
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

const ControlsRow = styled.div`
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

const ControlGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
  
  & > select {
    flex-grow: 1;
    min-width: 150px;
  }
`;

const ControlLabel = styled.label`
  font-size: 0.875rem;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  white-space: nowrap;
  color: #e0e0e0;
`;

const Select = styled.select`
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

const ButtonGroup = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 0.75rem;
  margin-top: 1.5rem;
`;

const ExpandedButtonGroup = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  flex-grow: 1;
  justify-content: flex-start;
`;

const StyledButton = styled(Button)`
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

const BulkButton = styled(StyledButton)`
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

interface SecurityCodeBadgeProps {
  code: string;
}

const SecurityCodeBadge = styled(Badge)<SecurityCodeBadgeProps>`
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

const CardSection = styled.div`
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

const SummarySection = styled(CardSection)`
  margin-top: 2rem;
  padding: 1.5rem;
  
  @media (max-width: 640px) {
    padding: 1rem;
  }
`;

const SummarySectionTitle = styled.h4`
  font-size: 1.125rem;
  margin-bottom: 1rem;
  color: #e5c76b;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const SignatureSection = styled(CardSection)`
  margin-top: 1.5rem;
  padding: 1.5rem;
  
  @media (max-width: 640px) {
    padding: 1rem;
  }
`;

const InputGroup = styled.div`
  margin-bottom: 1rem;
`;

const InputLabel = styled(Label)`
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #e0e0e0;
`;

const TextInput = styled.input`
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

const AIOptionsSection = styled(CardSection)`
  margin-top: 2rem;
  padding: 1.5rem;
  background-position: 65% 35%;
  
  @media (max-width: 640px) {
    padding: 1rem;
  }
`;

const CheckboxGroup = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 0.75rem;
  margin-top: 1rem;
  
  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
`;

const CheckboxLabel = styled.label`
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

const Checkbox = styled.input`
  width: 16px;
  height: 16px;
  cursor: pointer;
  accent-color: #e5c76b;
`;

const AutosaveIndicator = styled.div`
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

interface WordCountBadgeProps {
  $count: number;
}

const WordCountBadge = styled.div<WordCountBadgeProps>`
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

const TabsHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
  padding: 0.75rem 1rem;
  background-color: #212121;
  border-bottom: 1px solid #333;
`;

const TabsHeaderTitle = styled.div`
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #e0e0e0;
`;

const ReportHeaderTitle = styled.div`
  font-weight: 600;
  font-size: 1.125rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #e5c76b;
  margin-bottom: 1rem;
`;

interface CollapseButtonProps {
  $expanded: boolean;
}

const CollapseButton = styled.button<CollapseButtonProps>`
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

// Component interfaces and implementation
interface EnhancedDailyReportsPanelProps {
  readonly dailyReports: readonly DailyReport[];
  readonly onReportChange: (day: string, content: string, status?: string, securityCode?: string) => void;
  readonly dateRange: { readonly start: Date; readonly end: Date };
  readonly summaryNotes: string;
  readonly onSummaryChange: (text: string) => void;
  readonly signature: string;
  readonly onSignatureChange: (text: string) => void;
  readonly aiOptions: AIOptions;
  readonly onAIOptionChange: (options: Partial<AIOptions>) => void;
  readonly contactEmail?: string;
  readonly onContactEmailChange?: (email: string) => void;
}

/**
 * Enhanced Daily Reports Panel - Fully Refactored with Custom Hooks
 * 
 * ✅ REFACTORED: Complete separation of concerns with custom hooks
 * ✅ PRODUCTION READY: Clean, maintainable, and scalable architecture
 * ✅ BULK IMPORT: Advanced text parsing and report import functionality
 * ✅ CONTEXT INTEGRATION: Direct integration with parent component state
 * ✅ AI FEATURES: Integrated AI assistance and content generation
 * ✅ PERFORMANCE OPTIMIZED: Memoized component with hook-based state
 * 
 * Features:
 * - Custom hooks for all state management (useDailyReportsPanel)
 * - Bulk import with intelligent text parsing
 * - Real-time progress tracking and completion metrics
 * - AI-powered content generation and suggestions
 * - Advanced form validation and autosave
 * - Responsive UI with collapsible sections
 * - Contact information management
 * - Security code and status tracking
 * - Optimized re-rendering with React.memo
 */
const EnhancedDailyReportsPanel: React.FC<EnhancedDailyReportsPanelProps> = React.memo(({
  dailyReports, onReportChange, dateRange, summaryNotes, onSummaryChange,
  signature, onSignatureChange, aiOptions, onAIOptionChange, contactEmail = '', onContactEmailChange,
}) => {
  
  // Use the main composite hook for all functionality
  const {
    state,
    stateActions,
    contactForm,
    contactFormActions,
    bulkImport,
    bulkImportActions,
    reportHandlers,
    aiGeneration,
    calculations
  } = useDailyReportsPanel(
    dailyReports,
    onReportChange,
    summaryNotes,
    onSummaryChange,
    signature,
    onSignatureChange,
    contactEmail,
    onContactEmailChange,
    aiOptions
  );

  // Error boundary fallback for graceful degradation
  if (!dailyReports || dailyReports.length === 0) {
    return (
      <Section>
        <SectionHeader>
          <SectionTitle>
            <AlertTriangle size={20} /> No Daily Reports Available
          </SectionTitle>
        </SectionHeader>
        <div style={{ padding: '2rem', textAlign: 'center', color: '#999' }}>
          <p>No daily reports data available. Please check your data source.</p>
        </div>
      </Section>
    );
  }

  return (
    <Section>
      <SectionHeader>
        <SectionTitle>
          <FileText size={20} /> Daily Security Reports
          {state.isAutosaving && (
            <AutosaveIndicator>
              <RefreshCw size={14} className="animate-spin" /> {UI_MESSAGES.AUTOSAVE}
            </AutosaveIndicator>
          )}
        </SectionTitle>
      </SectionHeader>

      {/* Bulk Import Section */}
      {bulkImport.showBulkImport && (
        <BulkImportSection>
          <BulkImportTitle>
            <Upload size={20} /> Quick Bulk Import - Paste Entire Weekly Report
          </BulkImportTitle>
          <BulkImportDescription
            dangerouslySetInnerHTML={{ __html: UI_MESSAGES.BULK_IMPORT.DESCRIPTION }}
          />
          
          <BulkTextArea
            value={bulkImport.bulkImportText}
            onChange={(e) => bulkImportActions.setBulkImportText(e.target.value)}
            placeholder={`${PLACEHOLDER_TEXT.BULK_IMPORT}

${SAMPLE_BULK_IMPORT_TEXT}`}
          />
          
          <BulkImportButtons>
            <BulkButton 
              onClick={bulkImportActions.handleBulkImport}
              disabled={!bulkImport.bulkImportText.trim() || state.isProcessing}
            >
              <Target size={16} />
              {state.isProcessing ? BUTTON_TEXT.BULK_IMPORT.PROCESSING : BUTTON_TEXT.BULK_IMPORT.PARSE_REPORT}
            </BulkButton>
            
            <StyledButton 
              variant="outline"
              onClick={() => bulkImportActions.setBulkImportText(SAMPLE_BULK_IMPORT_TEXT)}
            >
              <Copy size={16} />
              {BUTTON_TEXT.BULK_IMPORT.LOAD_SAMPLE}
            </StyledButton>
            
            <StyledButton 
              variant="outline"
              onClick={() => {
                bulkImportActions.setBulkImportText(TEST_FORMAT_EXAMPLES.COLON_FORMAT);
              }}
            >
              <Target size={16} />
              {BUTTON_TEXT.BULK_IMPORT.TEST_FORMAT}
            </StyledButton>
            
            <StyledButton 
              variant="outline"
              onClick={() => bulkImportActions.setShowBulkImport(false)}
            >
              <ChevronUp size={16} />
              {BUTTON_TEXT.BULK_IMPORT.HIDE_BULK_IMPORT}
            </StyledButton>
          </BulkImportButtons>

          {state.isProcessing && (
            <ProcessingIndicator>
              <Zap size={16} className="animate-pulse" />
              {UI_MESSAGES.BULK_IMPORT.PROCESSING}
            </ProcessingIndicator>
          )}
          
          {bulkImport.parsedReports.length === 0 && !state.isProcessing && bulkImport.bulkImportText.trim() && (
            <div style={{ 
              marginTop: '1rem',
              padding: '0.75rem',
              backgroundColor: 'rgba(231, 76, 60, 0.1)',
              border: '1px solid rgba(231, 76, 60, 0.3)',
              borderRadius: '4px',
              color: '#e74c3c',
              fontSize: '0.85rem'
            }}
            dangerouslySetInnerHTML={{ __html: UI_MESSAGES.BULK_IMPORT.PARSING_TIPS }}
            />
          )}

          {/* Preview Parsed Results */}
          {bulkImport.parsedReports.length > 0 && (
            <ImportPreview>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h5 style={{ color: '#FFD700', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Layers size={16} />
                  Parsed {bulkImport.parsedReports.length} Reports - Ready to Import
                  <Badge style={{ backgroundColor: 'rgba(46, 204, 113, 0.2)', color: '#2ecc71', fontSize: '0.75rem' }}>
                    ✅ READY
                  </Badge>
                </h5>
                <BulkButton onClick={bulkImportActions.handleApplyBulkImport}>
                  <FileUp size={16} />
                  {BUTTON_TEXT.BULK_IMPORT.APPLY_ALL_REPORTS}
                </BulkButton>
              </div>
              <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                {bulkImport.parsedReports.map((report, index) => (
                  <PreviewItem key={index}>
                    <PreviewDay style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>📅 {report.day}</span>
                      <Badge style={{ 
                        backgroundColor: 'rgba(255, 215, 0, 0.2)', 
                        color: '#FFD700', 
                        fontSize: '0.7rem',
                        padding: '0.2rem 0.4rem'
                      }}>
                        {report.content.split(' ').length} words
                      </Badge>
                    </PreviewDay>
                    <PreviewContent style={{ 
                      marginTop: '0.5rem',
                      backgroundColor: 'rgba(0, 0, 0, 0.3)',
                      padding: '0.5rem',
                      borderRadius: '4px',
                      fontSize: '0.8rem',
                      lineHeight: '1.4',
                      maxHeight: '100px',
                      overflowY: 'auto'
                    }}>
                      {report.content.length > 200 
                        ? report.content.substring(0, 200) + '...' 
                        : report.content
                      }
                    </PreviewContent>
                  </PreviewItem>
                ))}
              </div>
              {bulkImport.parsedReports.length === 0 && (
                <div style={{ 
                  textAlign: 'center', 
                  padding: '2rem', 
                  color: '#999',
                  fontStyle: 'italic'
                }}>
                  No daily reports found in the provided text. Try checking the format.
                </div>
              )}
            </ImportPreview>
          )}
        </BulkImportSection>
      )}

      {!bulkImport.showBulkImport && (
        <div style={{ padding: '1rem', textAlign: 'center', backgroundColor: '#212121', borderBottom: '1px solid #333' }}>
          <StyledButton 
            variant="outline"
            onClick={() => bulkImportActions.setShowBulkImport(true)}
          >
            <ChevronDown size={16} />
            {BUTTON_TEXT.BULK_IMPORT.SHOW_BULK_IMPORT}
          </StyledButton>
        </div>
      )}

      <ProgressContainer>
        <ProgressDetails>
          <ProgressText>
            <span>{UI_MESSAGES.PROGRESS.COMPLETION_PROGRESS}</span>
            <span>{UI_MESSAGES.PROGRESS.OF_DAYS(dailyReports.filter(report => report.status === 'Completed').length, dailyReports.length)}</span>
          </ProgressText>
          <ProgressText>{calculations.completionPercentage}%</ProgressText>
        </ProgressDetails>
        <ProgressBar>
          <ProgressFill $progress={calculations.completionPercentage} $completed={calculations.isCompletionFinished} />
        </ProgressBar>
      </ProgressContainer>

      <ReportTabs value={state.activeDay} onValueChange={stateActions.setActiveDay}>
        <TabsHeader>
          <TabsHeaderTitle>
            <Calendar size={16} /> Daily Reports
          </TabsHeaderTitle>
          <CollapseButton $expanded={!state.sidebarCollapsed} onClick={() => stateActions.setSidebarCollapsed(!state.sidebarCollapsed)}>
            {state.sidebarCollapsed 
              ? (<><PanelLeftOpen size={16} /> {BUTTON_TEXT.NAVIGATION.SHOW_ALL_DAYS}</>) 
              : (<><PanelLeftClose size={16} /> {BUTTON_TEXT.NAVIGATION.HIDE_DAYS}</>)
            }
          </CollapseButton>
        </TabsHeader>
        
        {!state.sidebarCollapsed && (
          <ReportTabsList>
            {dailyReports.map((report) => (
              <ReportTabsTrigger 
                key={report.day} 
                value={report.day} 
                $completed={report.status === 'Completed'}
              >
                {report.day.substring(0, 3)}
                {report.status === 'Completed' && <Check size={12} />}
                {report.content && (
                  <WordCountBadge $count={getWordCount(report.content)}>
                    {getWordCount(report.content)}
                  </WordCountBadge>
                )}
              </ReportTabsTrigger>
            ))}
          </ReportTabsList>
        )}

        {dailyReports.map((report) => (
          <ReportTabsContent key={report.day} value={report.day}>
            <ReportHeaderTitle>
              <Calendar size={18} /> 
              {report.day}, {format(dateRange.start, 'MMM d')} - {format(dateRange.end, 'MMM d, yyyy')}
            </ReportHeaderTitle>

            <ControlsRow>
              <ControlGroup>
                <ControlLabel>
                  <Shield size={16} /> Status:
                </ControlLabel>
                <Select 
                  value={report.status} 
                  onChange={(e) => reportHandlers.handleStatusChange(report.day, e.target.value)}
                >
                  {REPORT_STATUS_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </Select>
              </ControlGroup>
              <ControlGroup>
                <ControlLabel>
                  <AlertTriangle size={16} /> Security Code:
                </ControlLabel>
                <Select 
                  value={report.securityCode} 
                  onChange={(e) => reportHandlers.handleSecurityCodeChange(report.day, e.target.value)}
                >
                  {SECURITY_CODE_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </Select>
              </ControlGroup>
            </ControlsRow>

            <TextAreaContainer>
              <TextArea 
                value={report.content || ''} 
                onChange={(e) => reportHandlers.handleContentChange(report.day, e.target.value)} 
                placeholder={PLACEHOLDER_TEXT.DAILY_REPORT(report.day)} 
              />
              <CharCount $isLow={getWordCount(report.content) < VALIDATION_RULES.MINIMUM_WORD_COUNT}>
                {getWordCount(report.content)} words
              </CharCount>
              {state.typingAI && (
                <AIPromptIndicator>
                  <Sparkles size={14} /> {UI_MESSAGES.BULK_IMPORT.AI_SUGGESTING}
                </AIPromptIndicator>
              )}
            </TextAreaContainer>

            <ButtonGroup>
              <ExpandedButtonGroup>
                <StyledButton 
                variant="outline" 
                onClick={() => aiGeneration.generateReport(report.day)} 
                disabled={state.isGenerating || !aiOptions.enabled}
                >
                <Sparkles size={16} /> {state.isGenerating ? BUTTON_TEXT.AI.GENERATING : BUTTON_TEXT.AI.GENERATE}
                </StyledButton>
              </ExpandedButtonGroup>
              <StyledButton 
                variant={isContentSufficient(report.content) ? 'default' : 'outline'} 
                onClick={() => reportHandlers.markAsCompleted(report.day)} 
                disabled={!isContentSufficient(report.content)}
              >
                <CheckCircle size={16} /> 
                {report.status === 'Completed' ? UI_MESSAGES.COMPLETION.COMPLETED : UI_MESSAGES.COMPLETION.MARK_COMPLETED}
              </StyledButton>
            </ButtonGroup>

            {/* AI Assistant */}
            {aiOptions.enabled && report.content && report.content.length > 20 && (
              <div style={{ marginTop: '1.5rem' }}>
                <AIReportAssistant
                  day={report.day}
                  content={report.content}
                  securityCode={report.securityCode as SecurityCode}
                  onChange={(content) => reportHandlers.handleContentChange(report.day, content)}
                  aiOptions={aiOptions}
                  dateRange={dateRange}
                />
              </div>
            )}
          </ReportTabsContent>
        ))}
      </ReportTabs>

      {/* Summary Section - ENHANCED with immediate context sync */}
      <SummarySection>
        <SummarySectionTitle>
          <FileCheck size={18} /> Additional Notes & Summary
        </SummarySectionTitle>
        <TextAreaContainer>
          <TextArea 
            value={summaryNotes} 
            onChange={(e) => { 
              // Summary notes updated
              
              // 🚨 CRITICAL: Update immediately
              onSummaryChange(e.target.value); 
              reportHandlers.triggerAutosave(); 
            }} 
            placeholder={PLACEHOLDER_TEXT.SUMMARY_NOTES} 
          />
          <CharCount $isLow={getWordCount(summaryNotes) < VALIDATION_RULES.SUMMARY_MINIMUM_WORD_COUNT}>
            {getWordCount(summaryNotes)} words
          </CharCount>
        </TextAreaContainer>
        <StyledButton 
          variant="outline" 
          onClick={aiGeneration.generateSummary} 
          disabled={state.isGenerating || !aiOptions.enabled}
        >
          <Sparkles size={16} /> 
          {state.isGenerating ? BUTTON_TEXT.AI.GENERATING : UI_MESSAGES.GENERATION.GENERATE_SUMMARY}
        </StyledButton>
      </SummarySection>

      {/* Signature Section with Default Values */}
      <SignatureSection>
        <SummarySectionTitle>
          <Lock size={18} /> Security Company Contact Information
        </SummarySectionTitle>
        <InputGroup>
          <InputLabel htmlFor="signature">Contact Name / Signature:</InputLabel>
          <TextInput 
            id="signature" 
            type="text" 
            value={contactForm.signatureValue} 
            onChange={contactFormActions.handleSignatureChange} 
            placeholder={DEFAULT_CONTACT_INFO.SIGNATURE} 
          />
        </InputGroup>
        <InputGroup>
          <InputLabel htmlFor="contactEmail">Contact Email:</InputLabel>
          <TextInput 
            id="contactEmail" 
            type="email" 
            value={contactForm.contactEmailValue} 
            onChange={contactFormActions.handleContactEmailChange} 
            placeholder={DEFAULT_CONTACT_INFO.EMAIL} 
            data-security-email
            data-email-value={contactForm.contactEmailValue}
          />
        </InputGroup>
      </SignatureSection>

      {/* AI Options Section */}
      <AIOptionsSection>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <SummarySectionTitle>
            <Sparkles size={18} /> AI Report Enhancement Options
          </SummarySectionTitle>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontSize: '0.875rem', color: '#e0e0e0' }}>Enable AI</span>
            <Switch 
              checked={aiOptions.enabled} 
              onCheckedChange={(checked) => onAIOptionChange({ enabled: checked })} 
            />
          </div>
        </div>
        <div style={{ fontSize: '0.875rem', color: '#999', marginBottom: '1rem' }}>
          Configure how AI will help improve your reports.
        </div>
        <CheckboxGroup>
          <CheckboxLabel>
            <Checkbox 
              type="checkbox" 
              checked={aiOptions.autoCorrect} 
              onChange={(e) => onAIOptionChange({ autoCorrect: e.target.checked })} 
              disabled={!aiOptions.enabled} 
            />
            Auto-correct spelling & grammar
          </CheckboxLabel>
          <CheckboxLabel>
            <Checkbox 
              type="checkbox" 
              checked={aiOptions.enhanceWriting} 
              onChange={(e) => onAIOptionChange({ enhanceWriting: e.target.checked })} 
              disabled={!aiOptions.enabled} 
            />
            Enhance writing style
          </CheckboxLabel>
          <CheckboxLabel>
            <Checkbox 
              type="checkbox" 
              checked={aiOptions.suggestContent} 
              onChange={(e) => onAIOptionChange({ suggestContent: e.target.checked })} 
              disabled={!aiOptions.enabled} 
            />
            Suggest additional content
          </CheckboxLabel>
          <CheckboxLabel>
            <Checkbox 
              type="checkbox" 
              checked={aiOptions.generateSummary} 
              onChange={(e) => onAIOptionChange({ generateSummary: e.target.checked })} 
              disabled={!aiOptions.enabled} 
            />
            Generate summary from all reports
          </CheckboxLabel>
          <CheckboxLabel>
            <Checkbox 
              type="checkbox" 
              checked={aiOptions.suggestImprovements} 
              onChange={(e) => onAIOptionChange({ suggestImprovements: e.target.checked })} 
              disabled={!aiOptions.enabled} 
            />
            Suggest security improvements
          </CheckboxLabel>
          <CheckboxLabel>
            <Checkbox 
              type="checkbox" 
              checked={aiOptions.analyzeThreats} 
              onChange={(e) => onAIOptionChange({ analyzeThreats: e.target.checked })} 
              disabled={!aiOptions.enabled} 
            />
            Analyze potential threats
          </CheckboxLabel>
          <CheckboxLabel>
            <Checkbox 
              type="checkbox" 
              checked={aiOptions.highlightPatterns} 
              onChange={(e) => onAIOptionChange({ highlightPatterns: e.target.checked })} 
              disabled={!aiOptions.enabled} 
            />
            Highlight recurring patterns
          </CheckboxLabel>
        </CheckboxGroup>
      </AIOptionsSection>
    </Section>
  );
});

// Memoization comparison function for performance
EnhancedDailyReportsPanel.displayName = 'EnhancedDailyReportsPanel';

export default EnhancedDailyReportsPanel;