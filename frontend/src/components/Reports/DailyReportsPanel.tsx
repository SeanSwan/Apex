// File: frontend/src/components/Reports/DailyReportsPanel.tsx

import React, { useState } from 'react';
import styled from 'styled-components';
import { format } from 'date-fns';
import { DailyReport, AIOptions } from '../../types/reports';
import AIAssistant from './AIAssistant';

// Styled components
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
`;

const ReportAccordion = styled.div`
  margin-bottom: 1rem;
`;

const AccordionItem = styled.div`
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  margin-bottom: 0.5rem;
  overflow: hidden;
`;

const AccordionHeader = styled.div<{ completed: boolean }>`
  padding: 1rem;
  background-color: ${props => props.completed ? '#e8f5e9' : '#fff'};
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  
  &:hover {
    background-color: ${props => props.completed ? '#c8e6c9' : '#f5f5f5'};
  }
`;

const DayTitle = styled.span`
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const StatusBadge = styled.span<{ status?: string }>`
  font-size: 0.75rem;
  padding: 0.25rem 0.5rem;
  border-radius: 999px;
  font-weight: 500;
  
  background-color: ${props => {
    switch (props.status) {
      case 'Completed': return '#c8e6c9';
      case 'In Progress': return '#fff9c4';
      case 'To update': return '#ffccbc';
      default: return '#e0e0e0';
    }
  }};
  
  color: ${props => {
    switch (props.status) {
      case 'Completed': return '#2e7d32';
      case 'In Progress': return '#f57f17';
      case 'To update': return '#d84315';
      default: return '#616161';
    }
  }};
`;

const AccordionContent = styled.div<{ expanded: boolean }>`
  padding: ${props => props.expanded ? '1rem' : '0'};
  max-height: ${props => props.expanded ? '1000px' : '0'};
  opacity: ${props => props.expanded ? '1' : '0'};
  transition: all 0.3s ease-in-out;
  overflow: hidden;
`;

const TextArea = styled.textarea`
  width: 100%;
  min-height: 150px;
  padding: 0.75rem;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  font-family: inherit;
  font-size: 0.875rem;
  resize: vertical;
  
  &:focus {
    border-color: #0070f3;
    outline: none;
    box-shadow: 0 0 0 2px rgba(0, 112, 243, 0.2);
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  justify-content: space-between;
  margin-top: 1rem;
`;

const Button = styled.button<{ variant?: 'primary' | 'secondary' | 'success' }>`
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  font-size: 0.875rem;
  cursor: pointer;
  background-color: ${props => {
    switch (props.variant) {
      case 'primary': return '#0070f3';
      case 'secondary': return '#f5f5f5';
      case 'success': return '#28a745';
      default: return '#0070f3';
    }
  }};
  color: ${props => props.variant === 'secondary' ? '#333' : '#fff'};
  
  &:hover {
    background-color: ${props => {
      switch (props.variant) {
        case 'primary': return '#0060df';
        case 'secondary': return '#e0e0e0';
        case 'success': return '#218838';
        default: return '#0060df';
      }
    }};
  }
  
  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
`;

const SelectInput = styled.select`
  padding: 0.5rem;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  font-size: 0.875rem;
  
  &:focus {
    border-color: #0070f3;
    outline: none;
    box-shadow: 0 0 0 2px rgba(0, 112, 243, 0.2);
  }
`;

const SummarySection = styled.div`
  margin-top: 2rem;
`;

const AIOptionsSection = styled.div`
  margin-top: 2rem;
  padding: 1rem;
  background-color: #f8f9fa;
  border-radius: 8px;
`;

const CheckboxGroup = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  margin-top: 0.5rem;
`;

const CheckboxLabel = styled.label`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  font-size: 0.875rem;
`;

const SignatureInput = styled.input`
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  font-size: 0.875rem;
  margin-top: 0.5rem;
  
  &:focus {
    border-color: #0070f3;
    outline: none;
    box-shadow: 0 0 0 2px rgba(0, 112, 243, 0.2);
  }
`;

interface DailyReportsPanelProps {
  dailyReports: DailyReport[];
  onReportChange: (day: string, content: string, status?: string, securityCode?: string) => void;
  dateRange: { start: Date; end: Date };
  summaryNotes: string;
  onSummaryChange: (text: string) => void;
  signature: string;
  onSignatureChange: (text: string) => void;
  aiOptions: AIOptions;
  onAIOptionChange: (options: Partial<AIOptions>) => void;
}

const DailyReportsPanel: React.FC<DailyReportsPanelProps> = ({
  dailyReports,
  onReportChange,
  dateRange,
  summaryNotes,
  onSummaryChange,
  signature,
  onSignatureChange,
  aiOptions,
  onAIOptionChange,
}) => {
  const [expandedDay, setExpandedDay] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  
  // Toggle accordion
  const toggleDay = (day: string) => {
    setExpandedDay(expandedDay === day ? null : day);
  };
  
  // Handle report content changes
  const handleContentChange = (day: string, content: string) => {
    onReportChange(day, content, 'In Progress');
  };
  
  // Handle report status changes
  const handleStatusChange = (day: string, status: string) => {
    const report = dailyReports.find(r => r.day === day);
    if (report) {
      onReportChange(day, report.content, status);
    }
  };
  
  // Handle security code changes
  const handleSecurityCodeChange = (day: string, code: string) => {
    const report = dailyReports.find(r => r.day === day);
    if (report) {
      onReportChange(day, report.content, report.status, code);
    }
  };
  
  // Mark report as completed
  const markAsCompleted = (day: string) => {
    handleStatusChange(day, 'Completed');
    setExpandedDay(null);
  };
  
  // AI-assisted report generation for specific day
  const generateReportForDay = async (day: string) => {
    setLoading(true);
    try {
      const report = dailyReports.find(r => r.day === day);
      if (report) {
        // Get AI enhancement for the specific day
        const enhancedContent = await AIAssistant.enhanceContent(
          report.content || `${day} report for ${format(dateRange.start, 'MMM d')} - ${format(dateRange.end, 'MMM d, yyyy')}`, 
          day,
          aiOptions
        );
        
        onReportChange(day, enhancedContent, 'In Progress');
      }
    } catch (error) {
      console.error('Failed to generate report:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Generate summary with AI
  const generateSummary = async () => {
    setLoading(true);
    try {
      // Combine all report texts
      const reportTexts = dailyReports
        .map(report => `${report.day}: ${report.content}`)
        .join('\n\n');
      
      // Get AI-generated summary
      const summary = await AIAssistant.generateSummary(reportTexts, aiOptions);
      onSummaryChange(summary);
    } catch (error) {
      console.error('Failed to generate summary:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Calculate completion percentage
  const completionPercentage = Math.round(
    (dailyReports.filter(report => report.status === 'Completed').length / dailyReports.length) * 100
  );
  
  // Suggested report template
  const getReportTemplate = (day: string) => {
    return `${day}, ${format(dateRange.start, 'MMM d')} - ${format(dateRange.end, 'MMM d, yyyy')}:\n\nVirtual monitoring began at midnight, with security feeds covering all entry points, stairwells, and communal spaces. [Describe morning activity]. [Describe any notable events]. [Mention security status].\n\nSecurity Code: Code 4 (All Clear)`;
  };
  
  return (
    <Section>
      <SectionTitle>Daily Security Reports</SectionTitle>
      
      {/* Completion progress */}
      <div style={{ marginBottom: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
          <span>Completion Progress: {completionPercentage}%</span>
          <span>{dailyReports.filter(report => report.status === 'Completed').length} of {dailyReports.length} days</span>
        </div>
        <div style={{ height: '8px', backgroundColor: '#f0f0f0', borderRadius: '4px', overflow: 'hidden' }}>
          <div 
            style={{ 
              height: '100%', 
              width: `${completionPercentage}%`,
              backgroundColor: completionPercentage === 100 ? '#28a745' : '#0070f3',
              transition: 'width 0.3s ease-in-out'
            }} 
          />
        </div>
      </div>
      
      {/* Daily report accordions */}
      <ReportAccordion>
        {dailyReports.map((report) => (
          <AccordionItem key={report.day}>
            <AccordionHeader 
              completed={report.status === 'Completed'}
              onClick={() => toggleDay(report.day)}
            >
              <DayTitle>
                <span>{report.day}</span>
                <StatusBadge status={report.status}>{report.status}</StatusBadge>
              </DayTitle>
              <span>{expandedDay === report.day ? '▲' : '▼'}</span>
            </AccordionHeader>
            <AccordionContent expanded={expandedDay === report.day}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <label>Status:</label>
                    <SelectInput
                      value={report.status}
                      onChange={(e) => handleStatusChange(report.day, e.target.value)}
                    >
                      <option value="To update">To update</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Completed">Completed</option>
                    </SelectInput>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <label>Security Code:</label>
                    <SelectInput
                      value={report.securityCode}
                      onChange={(e) => handleSecurityCodeChange(report.day, e.target.value)}
                    >
                      <option value="Code 4">Code 4 (All Clear)</option>
                      <option value="Code 3">Code 3 (Attention Required)</option>
                      <option value="Code 2">Code 2 (Minor Incident)</option>
                      <option value="Code 1">Code 1 (Serious Incident)</option>
                    </SelectInput>
                  </div>
                </div>
                
                <TextArea
                  value={report.content}
                  onChange={(e) => handleContentChange(report.day, e.target.value)}
                  placeholder={getReportTemplate(report.day)}
                />
                
                <ButtonGroup>
                  <div>
                    <Button
                      variant="secondary"
                      onClick={() => handleContentChange(report.day, getReportTemplate(report.day))}
                      disabled={loading}
                    >
                      Use Template
                    </Button>
                    <Button
                      variant="primary"
                      style={{ marginLeft: '0.5rem' }}
                      onClick={() => generateReportForDay(report.day)}
                      disabled={loading}
                    >
                      AI Enhance
                    </Button>
                  </div>
                  <Button
                    variant="success"
                    onClick={() => markAsCompleted(report.day)}
                    disabled={!report.content || report.content.length < 50 || loading}
                  >
                    Mark as Completed
                  </Button>
                </ButtonGroup>
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </ReportAccordion>
      
      {/* Summary section */}
      <SummarySection>
        <SectionTitle>Additional Notes & Compliance</SectionTitle>
        <TextArea
          value={summaryNotes}
          onChange={(e) => onSummaryChange(e.target.value)}
          placeholder="Enter additional notes, compliance information, or general summary of the week's activity..."
        />
        <ButtonGroup>
          <Button
            variant="primary"
            onClick={generateSummary}
            disabled={loading || dailyReports.filter(r => r.content).length === 0}
          >
            Generate Summary with AI
          </Button>
        </ButtonGroup>
      </SummarySection>
      
      {/* Signature section */}
      <SummarySection>
        <SectionTitle>Contact Information</SectionTitle>
        <div style={{ marginBottom: '1rem' }}>
          <label>Contact Name / Signature:</label>
          <SignatureInput
            type="text"
            value={signature}
            onChange={(e) => onSignatureChange(e.target.value)}
            placeholder="Enter your name/signature"
          />
        </div>
        <div>
          <label>Contact Email:</label>
          <SignatureInput
            type="email"
            placeholder="Enter your email"
          />
        </div>
      </SummarySection>
      
      {/* AI options section */}
      <AIOptionsSection>
        <h4>AI Report Enhancement Options</h4>
        <p style={{ fontSize: '0.875rem', color: '#6c757d', marginBottom: '0.5rem' }}>
          Configure how AI will help improve your reports.
        </p>
        
        <CheckboxGroup>
          <CheckboxLabel>
            <input
              type="checkbox"
              checked={aiOptions.autoCorrect}
              onChange={(e) => onAIOptionChange({ autoCorrect: e.target.checked })}
            />
            Auto-correct spelling & grammar
          </CheckboxLabel>
          
          <CheckboxLabel>
            <input
              type="checkbox"
              checked={aiOptions.enhanceWriting}
              onChange={(e) => onAIOptionChange({ enhanceWriting: e.target.checked })}
            />
            Enhance writing style
          </CheckboxLabel>
          
          <CheckboxLabel>
            <input
              type="checkbox"
              checked={aiOptions.suggestContent}
              onChange={(e) => onAIOptionChange({ suggestContent: e.target.checked })}
            />
            Suggest additional content
          </CheckboxLabel>
          
          <CheckboxLabel>
            <input
              type="checkbox"
              checked={aiOptions.generateSummary}
              onChange={(e) => onAIOptionChange({ generateSummary: e.target.checked })}
            />
            Generate summary from all reports
          </CheckboxLabel>
        </CheckboxGroup>
      </AIOptionsSection>
    </Section>
  );
};

export default DailyReportsPanel;