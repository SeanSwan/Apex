// apex_ai_desktop_app/src/components/SOPManagement/SOP_Editor.tsx
/**
 * APEX AI SOP EDITOR COMPONENT (TYPESCRIPT VERSION)
 * =================================================
 * Professional interface for managing Standard Operating Procedures
 * Used by Voice AI Dispatcher for automated incident handling
 * 
 * MASTER PROMPT v54.6 COMPLIANCE:
 * - TypeScript with proper interfaces and type safety
 * - Styled Components integration for consistent theming
 * - Enhanced user experience and maintainability
 */

import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';

// ===========================
// TYPES & INTERFACES
// ===========================

interface SOPData {
  id?: string;
  title: string;
  description: string;
  propertyId: string;
  incidentType: string;
  priorityLevel: 'low' | 'medium' | 'high' | 'critical';
  initialResponseScript: string;
  informationGatheringQuestions: InformationQuestion[];
  conversationFlow: Record<string, any>;
  automatedActions: AutomatedAction[];
  notifyGuard: boolean;
  notifyManager: boolean;
  notifyEmergencyServices: boolean;
  notificationDelayMinutes: number;
  escalationTriggers: Record<string, any>;
  autoEscalateAfterMinutes: number | null;
  humanTakeoverThreshold: number;
  primaryContactListId: string;
  emergencyContactListId: string;
  complianceRequirements: Record<string, any>;
  documentationRequirements: Record<string, any>;
  status: 'draft' | 'active' | 'inactive' | 'archived';
  version: string;
  effectiveDate: string;
  expirationDate: string;
  tags: string[];
  notes: string;
  createdBy?: string;
  lastUpdatedBy?: string;
}

interface InformationQuestion {
  id: number;
  question: string;
  required: boolean;
  type: 'text' | 'number' | 'boolean' | 'select';
}

interface AutomatedAction {
  id: number;
  action: string;
  enabled: boolean;
  delay: number;
}

interface Property {
  id: string;
  name: string;
  address: string;
}

interface ContactList {
  id: string;
  name: string;
  listType: 'primary' | 'emergency' | 'security';
}

interface IncidentType {
  value: string;
  label: string;
}

interface PriorityLevel {
  value: 'low' | 'medium' | 'high' | 'critical';
  label: string;
  color: string;
}

interface SOPEditorProps {
  userRole: string;
  userId: string;
  onClose?: (success?: boolean) => void;
  sopData?: SOPData | null;
  isEditing?: boolean;
}

interface FormErrors {
  [key: string]: string | null;
}

// ===========================
// STYLED COMPONENTS
// ===========================

const EditorContainer = styled.div`
  width: 100%;
  height: 100vh;
  background-color: ${({ theme }) => theme.colors.background};
  color: ${({ theme }) => theme.colors.text};
  overflow-y: auto;
  font-family: ${({ theme }) => theme.typography.fontFamily};
`;

const EditorHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: ${({ theme }) => theme.spacing.lg};
  border-bottom: 2px solid ${({ theme }) => theme.colors.border};
  background-color: ${({ theme }) => theme.colors.backgroundLight};
  position: sticky;
  top: 0;
  z-index: 100;
`;

const HeaderTitle = styled.h1`
  font-size: ${({ theme }) => theme.typography.fontSize.xl};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  color: ${({ theme }) => theme.colors.text};
  margin: 0;
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};

  &::before {
    content: '📋';
    font-size: ${({ theme }) => theme.typography.fontSize.lg};
  }
`;

const HeaderActions = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.md};
`;

const Button = styled.button<{ variant?: 'primary' | 'secondary' }>`
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.lg};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xs};

  ${({ variant, theme }) => variant === 'primary' ? `
    background-color: ${theme.colors.primary};
    color: ${theme.colors.background};
    
    &:hover {
      background-color: ${theme.colors.primaryDark};
      transform: translateY(-1px);
    }
    
    &:disabled {
      background-color: ${theme.colors.border};
      cursor: not-allowed;
      transform: none;
    }
  ` : `
    background-color: transparent;
    color: ${theme.colors.text};
    border: 1px solid ${theme.colors.border};
    
    &:hover {
      background-color: ${theme.colors.backgroundLight};
      border-color: ${theme.colors.borderLight};
    }
  `}
`;

const EditorContent = styled.div`
  padding: ${({ theme }) => theme.spacing.lg};
  max-width: 1200px;
  margin: 0 auto;
`;

const FormSection = styled.div`
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
  margin: 0 0 ${({ theme }) => theme.spacing.lg} 0;
  padding-bottom: ${({ theme }) => theme.spacing.sm};
  border-bottom: 2px solid ${({ theme }) => theme.colors.border};
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
`;

const FormRow = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: ${({ theme }) => theme.spacing.md};
  margin-bottom: ${({ theme }) => theme.spacing.md};
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
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xs};
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

const TextArea = styled.textarea<{ hasError?: boolean }>`
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
  border: 1px solid ${({ theme, hasError }) => hasError ? theme.colors.error : theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  background-color: ${({ theme }) => theme.colors.backgroundLight};
  color: ${({ theme }) => theme.colors.text};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-family: ${({ theme }) => theme.typography.fontFamily};
  resize: vertical;
  min-height: 80px;
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

const ErrorMessage = styled.span`
  color: ${({ theme }) => theme.colors.error};
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xs};

  &::before {
    content: '⚠️';
    font-size: ${({ theme }) => theme.typography.fontSize.xs};
  }
`;

const HelpText = styled.small`
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  font-style: italic;
`;

const QuestionContainer = styled.div`
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  padding: ${({ theme }) => theme.spacing.md};
  background-color: ${({ theme }) => theme.colors.backgroundLight};
`;

const QuestionItem = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  padding: ${({ theme }) => theme.spacing.sm};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  
  &:last-child {
    border-bottom: none;
  }
`;

const QuestionNumber = styled.span`
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  color: ${({ theme }) => theme.colors.primary};
  min-width: 24px;
`;

const QuestionText = styled.span`
  flex: 1;
  color: ${({ theme }) => theme.colors.text};
`;

const RemoveButton = styled.button`
  background: none;
  border: none;
  color: ${({ theme }) => theme.colors.error};
  cursor: pointer;
  padding: ${({ theme }) => theme.spacing.xs};
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  font-size: ${({ theme }) => theme.typography.fontSize.md};
  
  &:hover {
    background-color: ${({ theme }) => theme.colors.error}20;
  }
`;

const AddQuestionRow = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.sm};
  margin-top: ${({ theme }) => theme.spacing.md};
`;

const CheckboxGroup = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: ${({ theme }) => theme.spacing.md};
`;

const CheckboxLabel = styled.label`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  cursor: pointer;
  padding: ${({ theme }) => theme.spacing.sm};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  transition: background-color 0.2s ease;
  
  &:hover {
    background-color: ${({ theme }) => theme.colors.backgroundLight};
  }

  input[type="checkbox"] {
    accent-color: ${({ theme }) => theme.colors.primary};
  }
`;

const AccessDenied = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 60vh;
  text-align: center;
  gap: ${({ theme }) => theme.spacing.lg};

  h2 {
    color: ${({ theme }) => theme.colors.error};
    font-size: ${({ theme }) => theme.typography.fontSize.xl};
    margin: 0;
  }

  p {
    color: ${({ theme }) => theme.colors.textMuted};
    font-size: ${({ theme }) => theme.typography.fontSize.md};
    margin: 0;
  }
`;

// ===========================
// MAIN COMPONENT
// ===========================

const SOP_Editor: React.FC<SOPEditorProps> = ({ 
  userRole, 
  userId, 
  onClose, 
  sopData = null, 
  isEditing = false 
}) => {
  // Form state for SOP data
  const [formData, setFormData] = useState<SOPData>({
    title: '',
    description: '',
    propertyId: '',
    incidentType: 'general_inquiry',
    priorityLevel: 'medium',
    initialResponseScript: '',
    informationGatheringQuestions: [],
    conversationFlow: {},
    automatedActions: [],
    notifyGuard: true,
    notifyManager: false,
    notifyEmergencyServices: false,
    notificationDelayMinutes: 0,
    escalationTriggers: {},
    autoEscalateAfterMinutes: null,
    humanTakeoverThreshold: 0.70,
    primaryContactListId: '',
    emergencyContactListId: '',
    complianceRequirements: {},
    documentationRequirements: {},
    status: 'draft',
    version: '1.0',
    effectiveDate: '',
    expirationDate: '',
    tags: [],
    notes: ''
  });

  const [properties, setProperties] = useState<Property[]>([]);
  const [contactLists, setContactLists] = useState<ContactList[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [currentQuestion, setCurrentQuestion] = useState<string>('');

  // Incident types based on Master Prompt
  const incidentTypes: IncidentType[] = [
    { value: 'noise_complaint', label: 'Noise Complaint' },
    { value: 'lockout', label: 'Lockout' },
    { value: 'maintenance_emergency', label: 'Maintenance Emergency' },
    { value: 'security_breach', label: 'Security Breach' },
    { value: 'medical_emergency', label: 'Medical Emergency' },
    { value: 'fire_alarm', label: 'Fire Alarm' },
    { value: 'suspicious_activity', label: 'Suspicious Activity' },
    { value: 'package_theft', label: 'Package Theft' },
    { value: 'vandalism', label: 'Vandalism' },
    { value: 'domestic_disturbance', label: 'Domestic Disturbance' },
    { value: 'utility_outage', label: 'Utility Outage' },
    { value: 'elevator_emergency', label: 'Elevator Emergency' },
    { value: 'parking_violation', label: 'Parking Violation' },
    { value: 'unauthorized_access', label: 'Unauthorized Access' },
    { value: 'general_inquiry', label: 'General Inquiry' },
    { value: 'other', label: 'Other' }
  ];

  const priorityLevels: PriorityLevel[] = [
    { value: 'low', label: 'Low', color: '#10b981' },
    { value: 'medium', label: 'Medium', color: '#f59e0b' },
    { value: 'high', label: 'High', color: '#ef4444' },
    { value: 'critical', label: 'Critical', color: '#dc2626' }
  ];

  // Load initial data
  useEffect(() => {
    loadProperties();
    loadContactLists();
    
    if (isEditing && sopData) {
      setFormData({
        ...sopData,
        informationGatheringQuestions: sopData.informationGatheringQuestions || [],
        automatedActions: sopData.automatedActions || [],
        tags: sopData.tags || []
      });
    }
  }, [isEditing, sopData]);

  const loadProperties = useCallback(async (): Promise<void> => {
    try {
      const response = await fetch('/api/internal/v1/properties', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setProperties(data.properties || []);
      }
    } catch (error) {
      console.error('Error loading properties:', error);
    }
  }, []);

  const loadContactLists = useCallback(async (): Promise<void> => {
    try {
      const response = await fetch('/api/internal/v1/contact-lists', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setContactLists(data.contactLists || []);
      }
    } catch (error) {
      console.error('Error loading contact lists:', error);
    }
  }, []);

  const handleInputChange = useCallback((field: keyof SOPData, value: any): void => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: null
      }));
    }
  }, [errors]);

  const addInformationGatheringQuestion = useCallback((): void => {
    if (currentQuestion.trim()) {
      const newQuestion: InformationQuestion = {
        id: Date.now(),
        question: currentQuestion.trim(),
        required: true,
        type: 'text'
      };
      
      setFormData(prev => ({
        ...prev,
        informationGatheringQuestions: [
          ...prev.informationGatheringQuestions,
          newQuestion
        ]
      }));
      setCurrentQuestion('');
    }
  }, [currentQuestion]);

  const removeQuestion = useCallback((questionId: number): void => {
    setFormData(prev => ({
      ...prev,
      informationGatheringQuestions: prev.informationGatheringQuestions.filter(q => q.id !== questionId)
    }));
  }, []);

  const validateForm = useCallback((): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (!formData.propertyId) {
      newErrors.propertyId = 'Property selection is required';
    }

    if (!formData.initialResponseScript.trim()) {
      newErrors.initialResponseScript = 'Initial response script is required';
    }

    if (formData.humanTakeoverThreshold < 0 || formData.humanTakeoverThreshold > 1) {
      newErrors.humanTakeoverThreshold = 'Threshold must be between 0 and 1';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const handleSave = useCallback(async (): Promise<void> => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const url = isEditing 
        ? `/api/internal/v1/sops/${sopData?.id}`
        : '/api/internal/v1/sops';
      
      const method = isEditing ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify({
          ...formData,
          createdBy: userId,
          lastUpdatedBy: userId
        })
      });

      if (response.ok) {
        alert(`SOP ${isEditing ? 'updated' : 'created'} successfully!`);
        onClose?.(true); // true indicates success
      } else {
        const errorData = await response.json();
        alert(`Error: ${errorData.message || 'Failed to save SOP'}`);
      }
    } catch (error) {
      console.error('Error saving SOP:', error);
      alert('Error saving SOP. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [validateForm, isEditing, sopData?.id, formData, userId, onClose]);

  const getPriorityColor = useCallback((level: string): string => {
    const priority = priorityLevels.find(p => p.value === level);
    return priority ? priority.color : '#6b7280';
  }, [priorityLevels]);

  // Check if user has permission to edit SOPs
  const canEdit = ['super_admin', 'admin_cto', 'admin_ceo', 'manager'].includes(userRole);

  if (!canEdit) {
    return (
      <EditorContainer>
        <AccessDenied>
          <h2>🚫 Access Denied</h2>
          <p>You don't have permission to manage Standard Operating Procedures.</p>
          <Button variant="secondary" onClick={() => onClose?.()}>
            Close
          </Button>
        </AccessDenied>
      </EditorContainer>
    );
  }

  return (
    <EditorContainer>
      <EditorHeader>
        <HeaderTitle>
          {isEditing ? 'Edit' : 'Create'} Standard Operating Procedure
        </HeaderTitle>
        <HeaderActions>
          <Button 
            variant="primary"
            onClick={handleSave} 
            disabled={loading}
          >
            💾 {loading ? 'Saving...' : 'Save SOP'}
          </Button>
          <Button variant="secondary" onClick={() => onClose?.()}>
            ❌ Cancel
          </Button>
        </HeaderActions>
      </EditorHeader>

      <EditorContent>
        {/* Basic Information */}
        <FormSection>
          <SectionTitle>ℹ️ Basic Information</SectionTitle>
          
          <FormRow>
            <FormGroup>
              <Label>Title *</Label>
              <Input
                type="text"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder="e.g., Noise Complaint Response Protocol"
                hasError={!!errors.title}
              />
              {errors.title && <ErrorMessage>{errors.title}</ErrorMessage>}
            </FormGroup>
            
            <FormGroup>
              <Label>Property *</Label>
              <Select
                value={formData.propertyId}
                onChange={(e) => handleInputChange('propertyId', e.target.value)}
                hasError={!!errors.propertyId}
              >
                <option value="">Select Property</option>
                {properties.map(property => (
                  <option key={property.id} value={property.id}>
                    {property.name} - {property.address}
                  </option>
                ))}
              </Select>
              {errors.propertyId && <ErrorMessage>{errors.propertyId}</ErrorMessage>}
            </FormGroup>
          </FormRow>

          <FormRow>
            <FormGroup>
              <Label>Incident Type</Label>
              <Select
                value={formData.incidentType}
                onChange={(e) => handleInputChange('incidentType', e.target.value)}
              >
                {incidentTypes.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </Select>
            </FormGroup>
            
            <FormGroup>
              <Label>Priority Level</Label>
              <Select
                value={formData.priorityLevel}
                onChange={(e) => handleInputChange('priorityLevel', e.target.value)}
                style={{ borderLeft: `4px solid ${getPriorityColor(formData.priorityLevel)}` }}
              >
                {priorityLevels.map(priority => (
                  <option key={priority.value} value={priority.value}>
                    {priority.label}
                  </option>
                ))}
              </Select>
            </FormGroup>
          </FormRow>

          <FormGroup>
            <Label>Description</Label>
            <TextArea
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Describe when this SOP applies and its purpose"
              rows={3}
            />
          </FormGroup>
        </FormSection>

        {/* AI Conversation Configuration */}
        <FormSection>
          <SectionTitle>🤖 AI Conversation Configuration</SectionTitle>
          
          <FormGroup>
            <Label>Initial Response Script *</Label>
            <TextArea
              value={formData.initialResponseScript}
              onChange={(e) => handleInputChange('initialResponseScript', e.target.value)}
              placeholder="Hello, this is APEX AI Security. I understand you're reporting a [incident type]. I'm here to help you with this situation..."
              rows={4}
              hasError={!!errors.initialResponseScript}
            />
            {errors.initialResponseScript && <ErrorMessage>{errors.initialResponseScript}</ErrorMessage>}
          </FormGroup>

          <FormGroup>
            <Label>Information Gathering Questions</Label>
            <QuestionContainer>
              {formData.informationGatheringQuestions.map((question, index) => (
                <QuestionItem key={question.id}>
                  <QuestionNumber>{index + 1}.</QuestionNumber>
                  <QuestionText>{question.question}</QuestionText>
                  <RemoveButton onClick={() => removeQuestion(question.id)}>
                    ×
                  </RemoveButton>
                </QuestionItem>
              ))}
              
              <AddQuestionRow>
                <Input
                  type="text"
                  value={currentQuestion}
                  onChange={(e) => setCurrentQuestion(e.target.value)}
                  placeholder="What is your location within the building?"
                  onKeyPress={(e) => e.key === 'Enter' && addInformationGatheringQuestion()}
                  style={{ flex: 1 }}
                />
                <Button 
                  variant="primary"
                  onClick={addInformationGatheringQuestion}
                  type="button"
                >
                  ➕ Add Question
                </Button>
              </AddQuestionRow>
            </QuestionContainer>
          </FormGroup>
        </FormSection>

        {/* Notification Settings */}
        <FormSection>
          <SectionTitle>📢 Notification Settings</SectionTitle>
          
          <CheckboxGroup>
            <CheckboxLabel>
              <input
                type="checkbox"
                checked={formData.notifyGuard}
                onChange={(e) => handleInputChange('notifyGuard', e.target.checked)}
              />
              🛡️ Notify Guard
            </CheckboxLabel>
            
            <CheckboxLabel>
              <input
                type="checkbox"
                checked={formData.notifyManager}
                onChange={(e) => handleInputChange('notifyManager', e.target.checked)}
              />
              👔 Notify Manager
            </CheckboxLabel>
            
            <CheckboxLabel>
              <input
                type="checkbox"
                checked={formData.notifyEmergencyServices}
                onChange={(e) => handleInputChange('notifyEmergencyServices', e.target.checked)}
              />
              🚨 Notify Emergency Services
            </CheckboxLabel>
          </CheckboxGroup>

          <FormRow>
            <FormGroup>
              <Label>Primary Contact List</Label>
              <Select
                value={formData.primaryContactListId}
                onChange={(e) => handleInputChange('primaryContactListId', e.target.value)}
              >
                <option value="">Select Contact List</option>
                {contactLists.filter(cl => cl.listType === 'primary' || cl.listType === 'security').map(cl => (
                  <option key={cl.id} value={cl.id}>
                    {cl.name} ({cl.listType})
                  </option>
                ))}
              </Select>
            </FormGroup>
            
            <FormGroup>
              <Label>Emergency Contact List</Label>
              <Select
                value={formData.emergencyContactListId}
                onChange={(e) => handleInputChange('emergencyContactListId', e.target.value)}
              >
                <option value="">Select Emergency List</option>
                {contactLists.filter(cl => cl.listType === 'emergency').map(cl => (
                  <option key={cl.id} value={cl.id}>
                    {cl.name}
                  </option>
                ))}
              </Select>
            </FormGroup>
          </FormRow>

          <FormGroup>
            <Label>Notification Delay (minutes)</Label>
            <Input
              type="number"
              min="0"
              max="60"
              value={formData.notificationDelayMinutes}
              onChange={(e) => handleInputChange('notificationDelayMinutes', parseInt(e.target.value) || 0)}
            />
          </FormGroup>
        </FormSection>

        {/* Escalation Rules */}
        <FormSection>
          <SectionTitle>⚡ Escalation Rules</SectionTitle>
          
          <FormRow>
            <FormGroup>
              <Label>Human Takeover Threshold</Label>
              <Input
                type="number"
                min="0"
                max="1"
                step="0.05"
                value={formData.humanTakeoverThreshold}
                onChange={(e) => handleInputChange('humanTakeoverThreshold', parseFloat(e.target.value))}
                hasError={!!errors.humanTakeoverThreshold}
              />
              <HelpText>AI confidence threshold below which to escalate to human (0.00-1.00)</HelpText>
              {errors.humanTakeoverThreshold && <ErrorMessage>{errors.humanTakeoverThreshold}</ErrorMessage>}
            </FormGroup>
            
            <FormGroup>
              <Label>Auto-escalate After (minutes)</Label>
              <Input
                type="number"
                min="1"
                max="120"
                value={formData.autoEscalateAfterMinutes || ''}
                onChange={(e) => handleInputChange('autoEscalateAfterMinutes', parseInt(e.target.value) || null)}
                placeholder="Optional"
              />
              <HelpText>Automatically escalate to human after this many minutes</HelpText>
            </FormGroup>
          </FormRow>
        </FormSection>

        {/* Status and Metadata */}
        <FormSection>
          <SectionTitle>📊 Status and Metadata</SectionTitle>
          
          <FormRow>
            <FormGroup>
              <Label>Status</Label>
              <Select
                value={formData.status}
                onChange={(e) => handleInputChange('status', e.target.value)}
              >
                <option value="draft">📝 Draft</option>
                <option value="active">✅ Active</option>
                <option value="inactive">⏸️ Inactive</option>
                <option value="archived">📦 Archived</option>
              </Select>
            </FormGroup>
            
            <FormGroup>
              <Label>Version</Label>
              <Input
                type="text"
                value={formData.version}
                onChange={(e) => handleInputChange('version', e.target.value)}
                placeholder="1.0"
              />
            </FormGroup>
          </FormRow>

          <FormRow>
            <FormGroup>
              <Label>Effective Date</Label>
              <Input
                type="datetime-local"
                value={formData.effectiveDate}
                onChange={(e) => handleInputChange('effectiveDate', e.target.value)}
              />
            </FormGroup>
            
            <FormGroup>
              <Label>Expiration Date</Label>
              <Input
                type="datetime-local"
                value={formData.expirationDate}
                onChange={(e) => handleInputChange('expirationDate', e.target.value)}
              />
            </FormGroup>
          </FormRow>

          <FormGroup>
            <Label>Notes</Label>
            <TextArea
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder="Additional notes about this SOP"
              rows={3}
            />
          </FormGroup>
        </FormSection>
      </EditorContent>
    </EditorContainer>
  );
};

export default SOP_Editor;