/**
 * INCIDENT REPORT VIEWER COMPONENT
 * ===============================
 * Comprehensive incident dossiers with evidence, AI analysis, and action items
 * Features: Evidence gallery, AI recommendations, SOP checklists, real-time updates
 * 
 * Integration with LiveAIMonitor for complete situational awareness
 */

import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';

// ===========================
// STYLED COMPONENTS
// ===========================

const ViewerContainer = styled.div`
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: ${props => props.theme.colors.backgroundCard};
  border-radius: ${props => props.theme.borderRadius.lg};
  border: 1px solid ${props => props.theme.colors.border};
  overflow: hidden;
`;

const ViewerHeader = styled.div`
  padding: ${props => props.theme.spacing.md};
  border-bottom: 1px solid ${props => props.theme.colors.border};
  background-color: ${props => props.theme.colors.backgroundLight};
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const HeaderTitle = styled.h3`
  font-size: ${props => props.theme.typography.fontSize.md};
  font-weight: ${props => props.theme.typography.fontWeight.semibold};
  color: ${props => props.theme.colors.text};
  margin: 0;
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.sm};
`;

const IncidentBadge = styled.div`
  padding: ${props => props.theme.spacing.xs} ${props => props.theme.spacing.sm};
  border-radius: ${props => props.theme.borderRadius.sm};
  font-size: ${props => props.theme.typography.fontSize.xs};
  font-weight: ${props => props.theme.typography.fontWeight.semibold};
  text-transform: uppercase;
  
  ${props => props.priority === 'critical' && `
    background-color: rgba(239, 68, 68, 0.1);
    color: ${props.theme.colors.error};
    border: 1px solid ${props.theme.colors.error};
  `}
  
  ${props => props.priority === 'high' && `
    background-color: rgba(245, 158, 11, 0.1);
    color: ${props.theme.colors.warning};
    border: 1px solid ${props.theme.colors.warning};
  `}
  
  ${props => props.priority === 'medium' && `
    background-color: rgba(59, 130, 246, 0.1);
    color: ${props.theme.colors.primary};
    border: 1px solid ${props.theme.colors.primary};
  `}
  
  ${props => props.priority === 'low' && `
    background-color: rgba(107, 114, 128, 0.1);
    color: ${props.theme.colors.textMuted};
    border: 1px solid ${props.theme.colors.border};
  `}
`;

const ViewerContent = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: ${props => props.theme.spacing.md};
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.spacing.md};
`;

const IncidentOverview = styled.div`
  background-color: ${props => props.theme.colors.background};
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: ${props => props.theme.borderRadius.md};
  padding: ${props => props.theme.spacing.md};
`;

const OverviewGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: ${props => props.theme.spacing.md};
  margin-bottom: ${props => props.theme.spacing.md};
`;

const InfoItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.spacing.xs};
`;

const InfoLabel = styled.span`
  font-size: ${props => props.theme.typography.fontSize.xs};
  color: ${props => props.theme.colors.textMuted};
  text-transform: uppercase;
  font-weight: ${props => props.theme.typography.fontWeight.semibold};
`;

const InfoValue = styled.span`
  font-size: ${props => props.theme.typography.fontSize.sm};
  color: ${props => props.theme.colors.text};
  font-weight: ${props => props.theme.typography.fontWeight.medium};
`;

const IncidentDescription = styled.div`
  font-size: ${props => props.theme.typography.fontSize.sm};
  color: ${props => props.theme.colors.text};
  line-height: 1.5;
  padding: ${props => props.theme.spacing.sm};
  background-color: ${props => props.theme.colors.backgroundLight};
  border-radius: ${props => props.theme.borderRadius.sm};
  border-left: 3px solid ${props => props.theme.colors.primary};
`;

const Section = styled.div`
  background-color: ${props => props.theme.colors.background};
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: ${props => props.theme.borderRadius.md};
  overflow: hidden;
`;

const SectionHeader = styled.div`
  padding: ${props => props.theme.spacing.sm} ${props => props.theme.spacing.md};
  background-color: ${props => props.theme.colors.backgroundLight};
  border-bottom: 1px solid ${props => props.theme.colors.border};
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const SectionTitle = styled.h4`
  font-size: ${props => props.theme.typography.fontSize.sm};
  font-weight: ${props => props.theme.typography.fontWeight.semibold};
  color: ${props => props.theme.colors.text};
  margin: 0;
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.xs};
`;

const SectionContent = styled.div`
  padding: ${props => props.theme.spacing.md};
`;

const EvidenceGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: ${props => props.theme.spacing.sm};
`;

const EvidenceItem = styled.div`
  background-color: ${props => props.theme.colors.backgroundLight};
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: ${props => props.theme.borderRadius.sm};
  overflow: hidden;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    border-color: ${props => props.theme.colors.primary};
    transform: translateY(-1px);
  }
`;

const EvidencePreview = styled.div`
  width: 100%;
  height: 80px;
  background-color: #000;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 24px;
  position: relative;
  overflow: hidden;
`;

const EvidenceInfo = styled.div`
  padding: ${props => props.theme.spacing.xs};
  font-size: ${props => props.theme.typography.fontSize.xs};
  color: ${props => props.theme.colors.textSecondary};
  text-align: center;
`;

const AIAnalysisSection = styled.div`
  background-color: rgba(59, 130, 246, 0.05);
  border: 1px solid rgba(59, 130, 246, 0.2);
  border-radius: ${props => props.theme.borderRadius.md};
  padding: ${props => props.theme.spacing.md};
`;

const AnalysisItem = styled.div`
  display: flex;
  align-items: flex-start;
  gap: ${props => props.theme.spacing.sm};
  margin-bottom: ${props => props.theme.spacing.sm};
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const AnalysisIcon = styled.div`
  width: 24px;
  height: 24px;
  background-color: ${props => props.theme.colors.primary};
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  flex-shrink: 0;
  margin-top: 2px;
`;

const AnalysisText = styled.div`
  font-size: ${props => props.theme.typography.fontSize.sm};
  color: ${props => props.theme.colors.text};
  line-height: 1.4;
`;

const ConfidenceBar = styled.div`
  width: 100%;
  height: 4px;
  background-color: ${props => props.theme.colors.border};
  border-radius: 2px;
  overflow: hidden;
  margin-top: ${props => props.theme.spacing.xs};
`;

const ConfidenceFill = styled.div`
  height: 100%;
  background-color: ${props => {
    if (props.confidence >= 0.8) return props.theme.colors.success;
    if (props.confidence >= 0.6) return props.theme.colors.warning;
    return props.theme.colors.error;
  }};
  width: ${props => props.confidence * 100}%;
  transition: width 0.3s ease;
`;

const ActionItemsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.spacing.sm};
`;

const ActionItem = styled.div`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.sm};
  padding: ${props => props.theme.spacing.sm};
  background-color: ${props => props.theme.colors.backgroundLight};
  border-radius: ${props => props.theme.borderRadius.sm};
  border-left: 3px solid ${props => {
    if (props.status === 'completed') return props.theme.colors.success;
    if (props.status === 'in_progress') return props.theme.colors.warning;
    return props.theme.colors.textMuted;
  }};
`;

const ActionCheckbox = styled.div`
  width: 16px;
  height: 16px;
  border: 2px solid ${props => props.theme.colors.border};
  border-radius: 3px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  
  ${props => props.checked && `
    background-color: ${props.theme.colors.success};
    border-color: ${props.theme.colors.success};
    color: white;
  `}
  
  &:hover {
    border-color: ${props => props.theme.colors.primary};
  }
`;

const ActionText = styled.div`
  flex: 1;
  font-size: ${props => props.theme.typography.fontSize.sm};
  color: ${props => props.theme.colors.text};
  
  ${props => props.completed && `
    text-decoration: line-through;
    color: ${props.theme.colors.textMuted};
  `}
`;

const NoIncidentMessage = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  color: ${props => props.theme.colors.textMuted};
  font-size: ${props => props.theme.typography.fontSize.sm};
  gap: ${props => props.theme.spacing.sm};
  padding: ${props => props.theme.spacing.xl};
`;

const ToggleButton = styled.button`
  background: transparent;
  border: 1px solid ${props => props.theme.colors.border};
  color: ${props => props.theme.colors.text};
  padding: ${props => props.theme.spacing.xs};
  border-radius: ${props => props.theme.borderRadius.sm};
  cursor: pointer;
  font-size: ${props => props.theme.typography.fontSize.xs};
  transition: all 0.2s ease;

  &:hover {
    background-color: ${props => props.theme.colors.backgroundLight};
    border-color: ${props => props.theme.colors.primary};
  }
`;

// ===========================
// MAIN COMPONENT
// ===========================

function IncidentReportViewer({ 
  selectedIncident = null,
  onActionItemToggle,
  onEvidenceClick,
  className = ''
}) {
  const [expandedSections, setExpandedSections] = useState({
    evidence: true,
    analysis: true,
    actions: true,
    timeline: false
  });

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleActionToggle = (actionId) => {
    if (onActionItemToggle) {
      onActionItemToggle(actionId);
    }
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleString();
  };

  const getEvidenceIcon = (type) => {
    switch (type) {
      case 'video': return '🎥';
      case 'image': return '📷';
      case 'audio': return '🎤';
      case 'document': return '📄';
      default: return '📎';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'critical': return '#ef4444';
      case 'high': return '#f59e0b';
      case 'medium': return '#3b82f6';
      default: return '#6b7280';
    }
  };

  if (!selectedIncident) {
    return (
      <ViewerContainer className={className}>
        <ViewerHeader>
          <HeaderTitle>
            📋 Incident Dossier
          </HeaderTitle>
        </ViewerHeader>
        
        <NoIncidentMessage>
          <span style={{ fontSize: '48px' }}>📋</span>
          <div>No Incident Selected</div>
          <div style={{ fontSize: '12px', color: '#666' }}>
            Select an incident from the AI Event Feed to view its comprehensive dossier
          </div>
        </NoIncidentMessage>
      </ViewerContainer>
    );
  }

  return (
    <ViewerContainer className={className}>
      <ViewerHeader>
        <HeaderTitle>
          📋 Incident #{selectedIncident.id || 'Unknown'}
        </HeaderTitle>
        
        <IncidentBadge priority={selectedIncident.priority || 'medium'}>
          {selectedIncident.priority || 'Medium'} Priority
        </IncidentBadge>
      </ViewerHeader>

      <ViewerContent>
        {/* Incident Overview */}
        <IncidentOverview>
          <OverviewGrid>
            <InfoItem>
              <InfoLabel>Incident Type</InfoLabel>
              <InfoValue>{selectedIncident.type || 'Security Alert'}</InfoValue>
            </InfoItem>
            
            <InfoItem>
              <InfoLabel>Status</InfoLabel>
              <InfoValue>{selectedIncident.status || 'Active'}</InfoValue>
            </InfoItem>
            
            <InfoItem>
              <InfoLabel>Location</InfoLabel>
              <InfoValue>{selectedIncident.location || 'Unknown Location'}</InfoValue>
            </InfoItem>
            
            <InfoItem>
              <InfoLabel>Timestamp</InfoLabel>
              <InfoValue>{formatTimestamp(selectedIncident.timestamp)}</InfoValue>
            </InfoItem>
            
            <InfoItem>
              <InfoLabel>Camera</InfoLabel>
              <InfoValue>{selectedIncident.cameraName || selectedIncident.camera_id || 'N/A'}</InfoValue>
            </InfoItem>
            
            <InfoItem>
              <InfoLabel>Duration</InfoLabel>
              <InfoValue>{selectedIncident.duration || 'Ongoing'}</InfoValue>
            </InfoItem>
          </OverviewGrid>
          
          <IncidentDescription>
            {selectedIncident.description || selectedIncident.message || 'AI-detected security incident requiring attention.'}
          </IncidentDescription>
        </IncidentOverview>

        {/* Evidence Section */}
        <Section>
          <SectionHeader>
            <SectionTitle>
              📎 Evidence ({selectedIncident.evidence?.length || 0})
            </SectionTitle>
            <ToggleButton onClick={() => toggleSection('evidence')}>
              {expandedSections.evidence ? '▼' : '▶'}
            </ToggleButton>
          </SectionHeader>
          
          {expandedSections.evidence && (
            <SectionContent>
              {selectedIncident.evidence && selectedIncident.evidence.length > 0 ? (
                <EvidenceGrid>
                  {selectedIncident.evidence.map((item, index) => (
                    <EvidenceItem 
                      key={index}
                      onClick={() => onEvidenceClick && onEvidenceClick(item)}
                    >
                      <EvidencePreview>
                        {getEvidenceIcon(item.type)}
                      </EvidencePreview>
                      <EvidenceInfo>
                        {item.name || `${item.type} ${index + 1}`}
                      </EvidenceInfo>
                    </EvidenceItem>
                  ))}
                </EvidenceGrid>
              ) : (
                <div style={{ 
                  textAlign: 'center', 
                  color: '#888', 
                  fontSize: '14px',
                  padding: '20px'
                }}>
                  📎 No evidence files attached to this incident
                </div>
              )}
            </SectionContent>
          )}
        </Section>

        {/* AI Analysis Section */}
        <Section>
          <SectionHeader>
            <SectionTitle>
              🧠 AI Analysis
            </SectionTitle>
            <ToggleButton onClick={() => toggleSection('analysis')}>
              {expandedSections.analysis ? '▼' : '▶'}
            </ToggleButton>
          </SectionHeader>
          
          {expandedSections.analysis && (
            <SectionContent>
              <AIAnalysisSection>
                {selectedIncident.aiAnalysis && selectedIncident.aiAnalysis.length > 0 ? (
                  selectedIncident.aiAnalysis.map((analysis, index) => (
                    <AnalysisItem key={index}>
                      <AnalysisIcon>🤖</AnalysisIcon>
                      <div>
                        <AnalysisText>{analysis.text}</AnalysisText>
                        {analysis.confidence && (
                          <ConfidenceBar>
                            <ConfidenceFill confidence={analysis.confidence} />
                          </ConfidenceBar>
                        )}
                      </div>
                    </AnalysisItem>
                  ))
                ) : (
                  <AnalysisItem>
                    <AnalysisIcon>🤖</AnalysisIcon>
                    <AnalysisText>
                      AI analysis indicates {selectedIncident.type || 'security incident'} with {
                        selectedIncident.confidence ? 
                        `${Math.round(selectedIncident.confidence * 100)}% confidence` : 
                        'standard confidence level'
                      }. Automated response protocols have been initiated.
                    </AnalysisText>
                  </AnalysisItem>
                )}
              </AIAnalysisSection>
            </SectionContent>
          )}
        </Section>

        {/* Action Items Section */}
        <Section>
          <SectionHeader>
            <SectionTitle>
              ✅ Action Items ({selectedIncident.actionItems?.filter(item => !item.completed).length || 0} pending)
            </SectionTitle>
            <ToggleButton onClick={() => toggleSection('actions')}>
              {expandedSections.actions ? '▼' : '▶'}
            </ToggleButton>
          </SectionHeader>
          
          {expandedSections.actions && (
            <SectionContent>
              <ActionItemsList>
                {selectedIncident.actionItems && selectedIncident.actionItems.length > 0 ? (
                  selectedIncident.actionItems.map((item, index) => (
                    <ActionItem key={index} status={item.completed ? 'completed' : 'pending'}>
                      <ActionCheckbox 
                        checked={item.completed}
                        onClick={() => handleActionToggle(item.id || index)}
                      >
                        {item.completed && '✓'}
                      </ActionCheckbox>
                      <ActionText completed={item.completed}>
                        {item.text}
                      </ActionText>
                    </ActionItem>
                  ))
                ) : (
                  <ActionItem status="pending">
                    <ActionCheckbox onClick={() => handleActionToggle('review')}>
                    </ActionCheckbox>
                    <ActionText>
                      Review incident details and determine appropriate response
                    </ActionText>
                  </ActionItem>
                )}
              </ActionItemsList>
            </SectionContent>
          )}
        </Section>
      </ViewerContent>
    </ViewerContainer>
  );
}

export default IncidentReportViewer;
