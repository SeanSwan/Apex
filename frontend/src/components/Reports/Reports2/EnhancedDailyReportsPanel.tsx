// File: frontend/src/components/Reports2/EnhancedDailyReportsPanel.tsx

import React, { useState, useCallback, useEffect } from 'react';
import styled from 'styled-components';
import { format } from 'date-fns';
import { DailyReport, AIOptions } from '../../types/reports';
import { AIReportAssistant } from './AIReportAssistant';
import { Button } from '../ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../ui/tabs';
import { Badge } from '../ui/badge';
import { Label } from '../ui/label';
import { Switch } from '../ui/switch';
import { 
  Check, 
  Edit, 
  Calendar, 
  Clock, 
  AlertTriangle, 
  Shield, 
  CheckCircle, 
  Info, 
  Lock, 
  FileCheck, 
  FileText, 
  PanelLeftClose, 
  PanelLeftOpen,
  Sparkles,
  ChevronDown,
  ChevronUp,
  RefreshCw
} from 'lucide-react';

// Styled components with enhanced responsive design
const Section = styled.div`
  margin-bottom: 2rem;
`;

const SectionTitle = styled.h3`
  font-size: 1.25rem;
  margin-bottom: 1rem;
  color: #333;
  font-weight: 600;
  border-bottom: 2px solid #f0f0f0;
  padding-bottom: 0.5rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const ReportTabs = styled(Tabs)`
  margin-bottom: 2rem;
`;

const ReportTabsList = styled(TabsList)`
  display: flex;
  overflow-x: auto;
  scrollbar-width: thin;
  padding-bottom: 4px;
  margin-bottom: 1rem;
  
  &::-webkit-scrollbar {
    height: 4px;
  }
  
  &::-webkit-scrollbar-track {
    background: #f1f1f1;
  }
  
  &::-webkit-scrollbar-thumb {
    background: #888;
    border-radius: 4px;
  }
  
  &::-webkit-scrollbar-thumb:hover {
    background: #555;
  }
  
  @media (max-width: 768px) {
    gap: 0.25rem;
  }
`;

const ReportTabsTrigger = styled(TabsTrigger)<{ completed?: boolean }>`
  position: relative;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  white-space: nowrap;
  padding: 0.75rem 1rem;
  
  &[data-state="active"] {
    background-color: ${props => props.completed ? '#e8f5e9' : '#e6f1fe'};
    color: ${props => props.completed ? '#2e7d32' : '#0070f3'};
    font-weight: 600;
  }
  
  @media (max-width: 768px) {
    font-size: 0.85rem;
    padding: 0.5rem 0.75rem;
  }
  
  &::after {
    content: '';
    display: ${props => props.completed ? 'block' : 'none'};
    position: absolute;
    top: 4px;
    right: 4px;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background-color: ${props => props.completed ? '#2e7d32' : 'transparent'};
  }
`;

const ReportTabsContent = styled(TabsContent)`
  padding: 1rem;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  
  @media (max-width: 640px) {
    padding: 0.75rem;
  }
`;

const ProgressContainer = styled.div`
  margin-bottom: 1.5rem;
`;

const ProgressDetails = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
  
  @media (max-width: 640px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.25rem;
  }
`;

const ProgressText = styled.span`
  font-size: 0.875rem;
  color: #555;
  
  @media (max-width: 640px) {
    width: 100%;
    display: flex;
    justify-content: space-between;
  }
`;

const ProgressBar = styled.div`
  height: 8px;
  background-color: #f0f0f0;
  border-radius: 4px;
  overflow: hidden;
`;

const ProgressFill = styled.div<{ progress: number; completed: boolean }>`
  height: 100%;
  width: ${props => `${props.progress}%`};
  background-color: ${props => props.completed ? '#2e7d32' : '#0070f3'};
  transition: width 0.3s ease-in-out;
`;

const TextAreaContainer = styled.div`
  position: relative;
  margin: 1rem 0;
`;

const TextArea = styled.textarea`
  width: 100%;
  min-height: 200px;
  padding: 1rem;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  font-family: inherit;
  font-size: 0.95rem;
  line-height: 1.6;
  resize: vertical;
  transition: border-color 0.2s ease;
  
  &:focus {
    outline: none;
    border-color: #0070f3;
    box-shadow: 0 0 0 2px rgba(0, 112, 243, 0.2);
  }
  
  @media (max-width: 640px) {
    min-height: 180px;
    padding: 0.75rem;
    font-size: 0.875rem;
  }
`;

const CharCount = styled.div<{ isLow: boolean }>`
  position: absolute;
  bottom: 0.5rem;
  right: 0.75rem;
  font-size: 0.75rem;
  color: ${props => props.isLow ? '#dc3545' : '#6c757d'};
  background-color: rgba(255, 255, 255, 0.8);
  padding: 0.125rem 0.25rem;
  border-radius: 4px;
`;

const AIPromptIndicator = styled.div`
  position: absolute;
  top: 0.5rem;
  right: 0.75rem;
  font-size: 0.75rem;
  color: #6c757d;
  display: flex;
  align-items: center;
  gap: 0.25rem;
  transition: opacity 0.3s ease;
  
  opacity: 0;
  animation: fadeIn 0.5s ease-in forwards;
  
  @keyframes fadeIn {
    0% { opacity: 0; }
    100% { opacity: 1; }
  }
`;

const ControlsRow = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 1rem;
  flex-wrap: wrap;
  gap: 0.75rem;
  
  @media (max-width: 768px) {
    flex-direction: column;
  }
`;

const ControlGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  
  @media (max-width: 768px) {
    width: 100%;
    justify-content: space-between;
  }
  
  @media (max-width: 480px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
`;

const ControlLabel = styled.label`
  font-size: 0.875rem;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  
  @media (max-width: 480px) {
    width: 100%;
  }
`;

const Select = styled.select`
  padding: 0.5rem;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  font-size: 0.875rem;
  background-color: white;
  min-width: 180px;
  
  &:focus {
    outline: none;
    border-color: #0070f3;
    box-shadow: 0 0 0 2px rgba(0, 112, 243, 0.2);
  }
  
  @media (max-width: 480px) {
    width: 100%;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 0.75rem;
  margin-top: 1rem;
  
  @media (max-width: 640px) {
    flex-direction: column;
    gap: 0.5rem;
  }
`;

const ExpandedButtonGroup = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  
  @media (max-width: 640px) {
    flex-direction: column;
    width: 100%;
  }
`;

const StyledButton = styled(Button)`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  
  @media (max-width: 640px) {
    width: 100%;
    justify-content: center;
  }
`;

const SecurityCodeBadge = styled(Badge)<{ code: string }>`
  padding: 0.35rem 0.5rem;
  font-size: 0.75rem;
  
  background-color: ${props => {
    switch(props.code) {
      case 'Code 4': return '#d1fae5';
      case 'Code 3': return '#fff9c4';
      case 'Code 2': return '#ffccbc';
      case 'Code 1': return '#fecaca';
      default: return '#e0e0e0';
    }
  }};
  
  color: ${props => {
    switch(props.code) {
      case 'Code 4': return '#047857';
      case 'Code 3': return '#f57f17';
      case 'Code 2': return '#d84315';
      case 'Code 1': return '#b91c1c';
      default: return '#616161';
    }
  }};
`;

const SummarySection = styled.div`
  margin-top: 2rem;
  padding: 1.5rem;
  background-color: #f8fbff;
  border-radius: 8px;
  border-left: 4px solid #0070f3;
  
  @media (max-width: 640px) {
    padding: 1rem;
  }
`;

const SummarySectionTitle = styled.h4`
  font-size: 1.125rem;
  margin-bottom: 1rem;
  color: #333;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const SignatureSection = styled.div`
  margin-top: 1.5rem;
`;

const InputGroup = styled.div`
  margin-bottom: 1rem;
`;

const InputLabel = styled(Label)`
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
`;

const TextInput = styled.input`
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  font-size: 0.95rem;
  
  &:focus {
    outline: none;
    border-color: #0070f3;
    box-shadow: 0 0 0 2px rgba(0, 112, 243, 0.2);
  }
  
  @media (max-width: 640px) {
    padding: 0.5rem;
    font-size: 0.875rem;
  }
`;

const AIOptionsSection = styled.div`
  margin-top: 2rem;
  padding: 1.5rem;
  background-color: #f9f5ff;
  border-radius: 8px;
  border-left: 4px solid #7c3aed;
  
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
  transition: background-color 0.2s ease;
  
  &:hover {
    background-color: rgba(124, 58, 237, 0.05);
  }
`;

const Checkbox = styled.input`
  width: 16px;
  height: 16px;
  cursor: pointer;
`;

const TemplateListContainer = styled.div`
  margin-top: 1rem;
  padding: 0.75rem;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  max-height: 0;
  overflow: hidden;
  transition: max-height 0.3s ease;
  
  &.expanded {
    max-height: 300px;
    overflow-y: auto;
  }
`;

const TemplateItem = styled.div`
  padding: 0.75rem;
  border-radius: 4px;
  border: 1px solid #e0e0e0;
  margin-bottom: 0.5rem;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    border-color: #0070f3;
    background-color: #f0f7ff;
  }
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const TemplateTitle = styled.div`
  font-weight: 500;
  margin-bottom: 0.25rem;
`;

const TemplatePreview = styled.div`
  font-size: 0.75rem;
  color: #666;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const CollapseButton = styled.button<{ expanded: boolean }>`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: none;
  border: none;
  padding: 0.5rem;
  font-size: 0.875rem;
  color: #0070f3;
  cursor: pointer;
  margin-left: auto;
  
  &:hover {
    text-decoration: underline;
  }
`;

const AutosaveIndicator = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.75rem;
  color: #6c757d;
  animation: pulse 2s infinite;
  
  @keyframes pulse {
    0% { opacity: 0.6; }
    50% { opacity: 1; }
    100% { opacity: 0.6; }
  }
`;

const WordCountBadge = styled.div<{ count: number }>`
  padding: 0.25rem 0.5rem;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 500;
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  margin-left: 0.5rem;
  
  background-color: ${props => {
    if (props.count < 50) return '#fecaca';
    if (props.count < 100) return '#fff9c4';
    return '#d1fae5';
  }};
  
  color: ${props => {
    if (props.count < 50) return '#b91c1c';
    if (props.count < 100) return '#f57f17';
    return '#047857';
  }};
`;

interface EnhancedDailyReportsPanelProps {
  dailyReports: DailyReport[];
  onReportChange: (day: string, content: string, status?: string, securityCode?: string) => void;
  dateRange: { start: Date; end: Date };
  summaryNotes: string;
  onSummaryChange: (text: string) => void;
  signature: string;
  onSignatureChange: (text: string) => void;
  aiOptions: AIOptions;
  onAIOptionChange: (options: Partial<AIOptions>) => void;
  contactEmail?: string;
  onContactEmailChange?: (email: string) => void;
}

/**
 * Enhanced Daily Reports Panel component for security reporting
 * Provides an intuitive interface for creating and managing daily security reports
 */
const EnhancedDailyReportsPanel: React.FC<EnhancedDailyReportsPanelProps> = ({
  dailyReports,
  onReportChange,
  dateRange,
  summaryNotes,
  onSummaryChange,
  signature,
  onSignatureChange,
  aiOptions,
  onAIOptionChange,
  contactEmail = '',
  onContactEmailChange,
}) => {
  const [activeDay, setActiveDay] = useState<string>(dailyReports[0]?.day || 'Monday');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isAutosaving, setIsAutosaving] = useState<boolean>(false);
  const [showTemplates, setShowTemplates] = useState<boolean>(false);
  const [typingAI, setTypingAI] = useState<boolean>(false);
  const [templateType, setTemplateType] = useState<'standard' | 'detailed' | 'incident'>('standard');
  const [contactEmailValue, setContactEmailValue] = useState<string>(contactEmail);
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  
  // Auto-update contact email if the prop changes
  useEffect(() => {
    setContactEmailValue(contactEmail);
  }, [contactEmail]);
  
  // Handle contact email changes
  const handleContactEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setContactEmailValue(e.target.value);
    if (onContactEmailChange) {
      onContactEmailChange(e.target.value);
    }
  };
  
  // Get active report based on selected day
  const getActiveReport = useCallback(() => {
    return dailyReports.find(report => report.day === activeDay) || dailyReports[0];
  }, [activeDay, dailyReports]);
  
  // Auto-save functionality with debounce
  const triggerAutosave = useCallback(() => {
    setIsAutosaving(true);
    
    // Simulate saving delay
    const timer = setTimeout(() => {
      setIsAutosaving(false);
    }, 1500);
    
    return () => clearTimeout(timer);
  }, []);
  
  // Handle report content changes
  const handleContentChange = (day: string, content: string) => {
    const report = dailyReports.find(r => r.day === day);
    const status = (report?.status === 'Completed') ? 'In Progress' : report?.status || 'In Progress';
    
    onReportChange(day, content, status, report?.securityCode);
    triggerAutosave();
    
    // If AI is enabled, simulate typing effect
    if (aiOptions.enabled && aiOptions.suggestContent && content.length > 100) {
      setTypingAI(true);
      
      setTimeout(() => {
        setTypingAI(false);
      }, 5000); // Show typing indicator for 5 seconds
    }
  };
  
  // Handle report status changes
  const handleStatusChange = (day: string, status: string) => {
    const report = dailyReports.find(r => r.day === day);
    if (report) {
      onReportChange(day, report.content, status, report.securityCode);
      triggerAutosave();
    }
  };
  
  // Handle security code changes
  const handleSecurityCodeChange = (day: string, code: string) => {
    const report = dailyReports.find(r => r.day === day);
    if (report) {
      onReportChange(day, report.content, report.status, code);
      triggerAutosave();
    }
  };
  
  // Mark report as completed
  const markAsCompleted = (day: string) => {
    const report = dailyReports.find(r => r.day === day);
    if (report) {
      handleStatusChange(day, 'Completed');
      
      // Move to next uncompleted report if available
      const reportIndex = dailyReports.findIndex(r => r.day === day);
      const nextIncompleteReport = dailyReports.slice(reportIndex + 1).find(r => r.status !== 'Completed');
      
      if (nextIncompleteReport) {
        setActiveDay(nextIncompleteReport.day);
      }
    }
  };
  
  // Generate report with AI
  const generateReport = async (day: string) => {
    if (!aiOptions.enabled) return;
    
    setIsGenerating(true);
    
    try {
      const report = dailyReports.find(r => r.day === day);
      
      // Create formatted date string for selected day
      const dayIndex = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].indexOf(day);
      const reportDate = new Date(dateRange.start);
      reportDate.setDate(reportDate.getDate() + dayIndex);
      
      // Simulate AI-generated content
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Base content to build on - either existing content or a simple starter
      const baseContent = report?.content && report.content.length > 50 
        ? report.content 
        : `${day}, ${format(reportDate, 'MMM d, yyyy')}: Security monitoring active.`;
      
      // Generate a more detailed report based on the day and existing content
      let aiContent = '';
      
      if (day === 'Monday' || day === 'Tuesday' || day === 'Wednesday' || day === 'Thursday' || day === 'Friday') {
        aiContent = `${day}, ${format(reportDate, 'MMM d, yyyy')}:\n\nSecurity monitoring began at 00:00 hours with all systems fully operational. Regular staff arrivals were observed between 08:00-09:30 AM with proper credential verification throughout. Perimeter checks were conducted at 10:00 AM, 2:00 PM, and 6:00 PM with no security concerns identified.\n\nAll access points remained secure throughout the day with standard business traffic only. Cameras and alarm systems maintained 100% uptime with no technical issues reported. No unauthorized access attempts were detected. Final security verification was completed at 22:00 hours with all systems secure.`;
      } else {
        aiContent = `${day}, ${format(reportDate, 'MMM d, yyyy')}:\n\nWeekend security protocol in effect with reduced on-site staff presence. All security systems functioning normally with continuous 24-hour monitoring active. Perimeter inspections conducted at 09:00 AM, 1:00 PM, and 5:00 PM verified all access points secure.\n\nMinimal authorized personnel on premises with proper access credentials verified. No security incidents or unauthorized access attempts detected. Video surveillance systems and alarm functionality confirmed operational with 100% uptime maintained. End-of-day security confirmation completed at 20:00 hours.`;
      }
      
      // If the report already has substantial content, enhance it instead of replacing
      if (baseContent.length > 100) {
        // Add more specific details while preserving the original content
        const enhancedContent = `${baseContent}\n\nAdditional security details: All visitor management protocols were strictly followed with proper sign-in procedures enforced. Environmental controls remained stable throughout monitoring period with no alerts triggered. Network security systems reported no unusual activity or potential intrusion attempts. All required compliance checks were completed and properly documented per security protocols.`;
        
        onReportChange(day, enhancedContent, 'In Progress', report?.securityCode);
      } else {
        // Use the AI-generated content
        onReportChange(day, aiContent, 'In Progress', report?.securityCode || 'Code 4');
      }
    } catch (error) {
      console.error('Failed to generate report:', error);
    } finally {
      setIsGenerating(false);
    }
  };
  
  // Generate weekly summary with AI
  const generateSummary = async () => {
    if (!aiOptions.enabled) return;
    
    setIsGenerating(true);
    
    try {
      // Simulate AI processing delay
      await new Promise(resolve => setTimeout(resolve, 2500));
      
      // Generate comprehensive summary based on daily reports
      const completedReports = dailyReports.filter(r => r.content && r.content.length > 50);
      
      if (completedReports.length > 0) {
        const aiSummary = `Weekly security monitoring summary for period ${format(dateRange.start, 'MMM d')} to ${format(dateRange.end, 'MMM d, yyyy')}:\n\nAll designated areas maintained complete security coverage throughout the monitoring period with 99.8% system uptime achieved. A total of ${completedReports.length} daily security reports were completed with proper documentation. Access control systems functioned without incident, with all entry points properly secured at all times.\n\nNo significant security events or breaches were detected during this reporting period. All security personnel followed established protocols for perimeter checks, visitor management, and access credential verification. Video surveillance systems operated at optimal capacity with all footage properly archived according to retention policies.\n\nRecommendations for enhanced security measures include increasing patrol frequency during ${dailyReports[3]?.day || 'Thursday'} when higher visitor traffic was observed. All security compliance requirements were met in accordance with established regulations and internal policies.`;
        
        onSummaryChange(aiSummary);
      } else {
        const genericSummary = `Weekly security monitoring summary for period ${format(dateRange.start, 'MMM d')} to ${format(dateRange.end, 'MMM d, yyyy')}:\n\nSecurity monitoring was maintained throughout the reporting period with all systems functioning within normal parameters. Standard security protocols were followed with regular perimeter checks and access control verification. No significant security events were identified during this reporting period.\n\nAll required documentation and compliance checks were completed according to established security policies. Surveillance systems maintained proper functionality with footage retention policies followed. Security personnel performed all assigned duties with appropriate attention to detail and procedural adherence.`;
        
        onSummaryChange(genericSummary);
      }
    } catch (error) {
      console.error('Failed to generate summary:', error);
    } finally {
      setIsGenerating(false);
    }
  };
  
  // Calculate completion percentage
  const completionPercentage = Math.round(
    (dailyReports.filter(report => report.status === 'Completed').length / dailyReports.length) * 100
  );
  
  const isCompletionFinished = completionPercentage === 100;
  
  // Get appropriate template based on selected day and type
  const getReportTemplate = (day: string) => {
    // Create formatted date string for selected day
    const dayIndex = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].indexOf(day);
    const reportDate = new Date(dateRange.start);
    reportDate.setDate(reportDate.getDate() + dayIndex);
    const formattedDate = format(reportDate, 'MMM d, yyyy');
    
    if (templateType === 'standard') {
      return `${day}, ${formattedDate}:\n\nSecurity monitoring active throughout the day with all systems operational. Regular perimeter checks conducted at scheduled intervals. All access points remained secure with proper credential verification enforced. No security incidents or unauthorized access detected. Video surveillance systems functioning normally.\n\nSecurity Code: Code 4 (All Clear)`;
    } else if (templateType === 'detailed') {
      return `${day}, ${formattedDate}:\n\nSecurity monitoring began at 00:00 hours with all systems operational and proper shift handover completed. Morning perimeter inspection conducted at 08:00 hours verified all access points secure and functioning correctly. Staff arrivals between 08:15-09:30 included proper credential verification with no exceptions noted.\n\nMidday security checks at 12:00 hours confirmed continued secure status of all areas. Afternoon patrol at 16:00 hours included specific attention to loading dock and parking areas with all security protocols maintained. Evening transition to night security posture occurred at 20:00 hours with reduced on-site staff but enhanced monitoring protocols activated.\n\nNo security incidents or unauthorized access attempts were detected throughout the monitoring period. All surveillance systems maintained 100% uptime with no technical issues identified. End-of-day security confirmation completed at 23:45 with all systems and access points verified secure.\n\nSecurity Code: Code 4 (All Clear)`;
    } else {
      return `${day}, ${formattedDate}:\n\n[INCIDENT REPORT]\nSecurity monitoring detected a potential security concern at [TIME]. Incident involved [BRIEF DESCRIPTION OF EVENT] which was observed in the [LOCATION] area. Security personnel responded according to established protocols within [X] minutes of initial detection.\n\nImmediate actions taken included [DESCRIBE RESPONSE MEASURES]. The incident was contained and resolved by [RESOLUTION DETAILS]. No breach of secure areas occurred, and all sensitive assets remained protected throughout the event.\n\nFollow-up measures include [DESCRIBE ANY ADDITIONAL STEPS TAKEN]. This incident has been fully documented according to security reporting requirements with all relevant details preserved for future reference. Management has been notified according to escalation procedures.\n\nSecurity Code: Code 3 (Attention Required)`;
    }
  };
  
  // Report templates
  const reportTemplates = [
    {
      title: 'Standard Security Report',
      type: 'standard',
      preview: 'Basic daily security status with standard monitoring details'
    },
    {
      title: 'Detailed Security Timeline',
      type: 'detailed',
      preview: 'Comprehensive report with time-specific security activities'
    },
    {
      title: 'Incident Report Template',
      type: 'incident',
      preview: 'Template for reporting security incidents or concerns'
    }
  ];
  
  // Get word count for active report
  const getWordCount = (text: string) => {
    if (!text) return 0;
    return text.trim().split(/\s+/).length;
  };
  
  // Determine if content is sufficient
  const isContentSufficient = (content: string) => {
    return getWordCount(content) >= 50;
  };
  
  const activeReport = getActiveReport();
  const wordCount = getWordCount(activeReport?.content || '');
  
  return (
    <Section>
      <SectionTitle>
        <FileText size={20} />
        Daily Security Reports
        
        {isAutosaving && (
          <AutosaveIndicator>
            <RefreshCw size={14} className="animate-spin" />
            Saving...
          </AutosaveIndicator>
        )}
      </SectionTitle>
      
      {/* Progress indicator */}
      <ProgressContainer>
        <ProgressDetails>
          <ProgressText>
            <span>Completion Progress:</span>
            <span>{dailyReports.filter(report => report.status === 'Completed').length} of {dailyReports.length} days</span>
          </ProgressText>
          <ProgressText>{completionPercentage}%</ProgressText>
        </ProgressDetails>
        <ProgressBar>
          <ProgressFill 
            progress={completionPercentage} 
            completed={isCompletionFinished}
          />
        </ProgressBar>
      </ProgressContainer>
      
      {/* Report tabs */}
      <ReportTabs value={activeDay} onValueChange={setActiveDay}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
          <div style={{ fontWeight: 500, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Calendar size={16} />
            Daily Reports
          </div>
          
          <CollapseButton 
            expanded={!sidebarCollapsed}
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          >
            {sidebarCollapsed ? (
              <>
                <PanelLeftOpen size={16} />
                Show All Days
              </>
            ) : (
              <>
                <PanelLeftClose size={16} />
                Hide Days
              </>
            )}
          </CollapseButton>
        </div>
        
        {!sidebarCollapsed && (
          <ReportTabsList>
            {dailyReports.map((report) => (
              <ReportTabsTrigger
                key={report.day}
                value={report.day}
                completed={report.status === 'Completed'}
              >
                {report.day.substring(0, 3)}
                {report.status === 'Completed' && <Check size={12} />}
                {report.content && (
                  <WordCountBadge count={getWordCount(report.content)}>
                    {getWordCount(report.content)}
                  </WordCountBadge>
                )}
              </ReportTabsTrigger>
            ))}
          </ReportTabsList>
        )}
        
        {/* Each day's content panel */}
        {dailyReports.map((report) => (
          <ReportTabsContent key={report.day} value={report.day}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <div style={{ fontWeight: 600, fontSize: '1.125rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Calendar size={18} />
                {report.day}, {format(dateRange.start, 'MMM d')} - {format(dateRange.end, 'MMM d, yyyy')}
              </div>
            </div>
            
            <ControlsRow>
              <ControlGroup>
                <ControlLabel>
                  <Shield size={16} />
                  Status:
                </ControlLabel>
                <Select
                  value={report.status}
                  onChange={(e) => handleStatusChange(report.day, e.target.value)}
                >
                  <option value="To update">To update</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed</option>
                </Select>
              </ControlGroup>
              
              <ControlGroup>
                <ControlLabel>
                  <AlertTriangle size={16} />
                  Security Code:
                </ControlLabel>
                <Select
                  value={report.securityCode}
                  onChange={(e) => handleSecurityCodeChange(report.day, e.target.value)}
                >
                  <option value="Code 4">Code 4 (All Clear)</option>
                  <option value="Code 3">Code 3 (Attention Required)</option>
                  <option value="Code 2">Code 2 (Minor Incident)</option>
                  <option value="Code 1">Code 1 (Serious Incident)</option>
                </Select>
              </ControlGroup>
            </ControlsRow>
            
            <TextAreaContainer>
              <TextArea
                value={report.content || ''}
                onChange={(e) => handleContentChange(report.day, e.target.value)}
                placeholder={`Enter security report for ${report.day}...`}
              />
              <CharCount isLow={getWordCount(report.content || '') < 50}>
                {getWordCount(report.content || '')} words
              </CharCount>
              
              {typingAI && (
                <AIPromptIndicator>
                  <Sparkles size={14} />
                  AI suggesting improvements...
                </AIPromptIndicator>
              )}
            </TextAreaContainer>
            
            <ButtonGroup>
              <ExpandedButtonGroup>
                <StyledButton
                  variant="outline"
                  onClick={() => {
                    setShowTemplates(!showTemplates);
                  }}
                >
                  <FileText size={16} />
                  {showTemplates ? 'Hide Templates' : 'Use Template'}
                </StyledButton>
                
                <StyledButton
                  variant="outline" 
                  onClick={() => generateReport(report.day)}
                  disabled={isGenerating || !aiOptions.enabled}
                >
                  <Sparkles size={16} />
                  {isGenerating ? 'Generating...' : 'AI Generate'}
                </StyledButton>
              </ExpandedButtonGroup>
              
              <StyledButton
                variant={isContentSufficient(report.content || '') ? 'default' : 'outline'}
                onClick={() => markAsCompleted(report.day)}
                disabled={!isContentSufficient(report.content || '')}
              >
                <CheckCircle size={16} />
                {report.status === 'Completed' ? 'Completed' : 'Mark as Completed'}
              </StyledButton>
            </ButtonGroup>
            
            {/* Template selection */}
            <TemplateListContainer className={showTemplates ? 'expanded' : ''}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <div style={{ fontWeight: 500 }}>Select Template Type:</div>
                <Select 
                  value={templateType}
                  onChange={(e) => setTemplateType(e.target.value as any)}
                  style={{ width: 'auto' }}
                >
                  <option value="standard">Standard Report</option>
                  <option value="detailed">Detailed Report</option>
                  <option value="incident">Incident Report</option>
                </Select>
              </div>
              
              <TemplateItem onClick={() => {
                handleContentChange(report.day, getReportTemplate(report.day));
                setShowTemplates(false);
              }}>
                <TemplateTitle>{reportTemplates.find(t => t.type === templateType)?.title}</TemplateTitle>
                <TemplatePreview>{reportTemplates.find(t => t.type === templateType)?.preview}</TemplatePreview>
              </TemplateItem>
              
              <StyledButton 
                variant="outline" 
                onClick={() => setShowTemplates(false)}
                style={{ marginTop: '0.5rem', width: '100%' }}
              >
                Close Templates
              </StyledButton>
            </TemplateListContainer>
            
            {/* AI Assistant */}
            {aiOptions.enabled && report.content && report.content.length > 20 && (
              <div style={{ marginTop: '1.5rem' }}>
                <AIReportAssistant
                  day={report.day}
                  content={report.content}
                  securityCode={report.securityCode as any}
                  onChange={(content) => handleContentChange(report.day, content)}
                  aiOptions={aiOptions}
                  dateRange={dateRange}
                />
              </div>
            )}
          </ReportTabsContent>
        ))}
      </ReportTabs>
      
      {/* Summary section */}
      <SummarySection>
        <SummarySectionTitle>
          <FileCheck size={18} />
          Additional Notes & Compliance
        </SummarySectionTitle>
        
        <TextAreaContainer>
          <TextArea
            value={summaryNotes}
            onChange={(e) => {
              onSummaryChange(e.target.value);
              triggerAutosave();
            }}
            placeholder="Enter additional notes, compliance information, or general summary of the week's activity..."
          />
          <CharCount isLow={getWordCount(summaryNotes) < 50}>
            {getWordCount(summaryNotes)} words
          </CharCount>
        </TextAreaContainer>
        
        <StyledButton
          variant="outline"
          onClick={generateSummary}
          disabled={isGenerating || !aiOptions.enabled}
        >
          <Sparkles size={16} />
          {isGenerating ? 'Generating...' : 'Generate Summary with AI'}
        </StyledButton>
      </SummarySection>
      
      {/* Signature section */}
      <SignatureSection>
        <SummarySectionTitle>
          <Lock size={18} />
          Contact Information
        </SummarySectionTitle>
        
        <InputGroup>
          <InputLabel htmlFor="signature">Contact Name / Signature:</InputLabel>
          <TextInput
            id="signature"
            type="text"
            value={signature}
            onChange={(e) => {
              onSignatureChange(e.target.value);
              triggerAutosave();
            }}
            placeholder="Enter your name/signature"
          />
        </InputGroup>
        
        <InputGroup>
          <InputLabel htmlFor="contactEmail">Contact Email:</InputLabel>
          <TextInput
            id="contactEmail"
            type="email"
            value={contactEmailValue}
            onChange={handleContactEmailChange}
            placeholder="Enter your email"
          />
        </InputGroup>
      </SignatureSection>
      
      {/* AI options section */}
      <AIOptionsSection>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <SummarySectionTitle>
            <Sparkles size={18} />
            AI Report Enhancement Options
          </SummarySectionTitle>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontSize: '0.875rem' }}>Enable AI</span>
            <Switch 
              checked={aiOptions.enabled}
              onCheckedChange={(checked) => onAIOptionChange({ enabled: checked })}
            />
          </div>
        </div>
        
        <div style={{ fontSize: '0.875rem', color: '#6c757d', marginBottom: '1rem' }}>
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
        </CheckboxGroup>
      </AIOptionsSection>
    </Section>
  );
};

export default EnhancedDailyReportsPanel;