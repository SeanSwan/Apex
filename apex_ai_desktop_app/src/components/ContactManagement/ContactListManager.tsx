// apex_ai_desktop_app/src/components/ContactManagement/ContactListManager.tsx
/**
 * APEX AI CONTACT LIST MANAGER COMPONENT (TYPESCRIPT VERSION)
 * ===========================================================
 * Professional interface for managing notification contact lists
 * Used by Voice AI Dispatcher for automated alert notifications
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

interface Contact {
  id?: number;
  name: string;
  phone: string;
  email: string;
  role: string;
  priority: number;
  department: string;
  isEmergencyContact: boolean;
}

interface ContactListData {
  id?: string;
  name: string;
  description: string;
  propertyId: string;
  listType: 'primary' | 'emergency' | 'management' | 'maintenance' | 'security' | 'custom';
  priorityOrder: number;
  contacts: Contact[];
  notificationMethods: string[];
  notificationSchedule: Record<string, any>;
  escalationDelayMinutes: number;
  maxEscalationAttempts: number;
  requireAcknowledgment: boolean;
  applicableIncidentTypes: string[];
  excludedIncidentTypes: string[];
  activeHours: Record<string, any>;
  timezone: string;
  status: 'active' | 'inactive' | 'archived';
  effectiveDate: string;
  expirationDate: string;
  tags: string[];
  notes: string;
  createdBy?: string;
  lastUpdatedBy?: string;
}

interface Property {
  id: string;
  name: string;
  address: string;
}

interface ListType {
  value: string;
  label: string;
  description: string;
}

interface NotificationMethod {
  value: string;
  label: string;
  icon: string;
}

interface ContactListManagerProps {
  userRole: string;
  userId: string;
  onClose?: (success?: boolean) => void;
  contactListData?: ContactListData | null;
  isEditing?: boolean;
}

interface FormErrors {
  [key: string]: string | null;
}

// ===========================
// STYLED COMPONENTS
// ===========================

const ManagerContainer = styled.div`
  width: 100%;
  height: 100vh;
  background-color: ${({ theme }) => theme.colors.background};
  color: ${({ theme }) => theme.colors.text};
  overflow-y: auto;
  font-family: ${({ theme }) => theme.typography.fontFamily};
`;

const ManagerHeader = styled.div`
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
  align-items: center;
`;

const Button = styled.button<{ variant?: 'primary' | 'secondary' | 'test' | 'add' | 'cancel' }>`
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

  ${({ variant, theme }) => {
    switch (variant) {
      case 'primary':
        return `
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
        `;
      case 'test':
        return `
          background-color: ${theme.colors.info};
          color: ${theme.colors.background};
          
          &:hover {
            background-color: ${theme.colors.secondary};
            transform: translateY(-1px);
          }
          
          &:disabled {
            background-color: ${theme.colors.border};
            cursor: not-allowed;
            transform: none;
          }
        `;
      case 'add':
        return `
          background-color: ${theme.colors.success};
          color: ${theme.colors.background};
          
          &:hover {
            background-color: #059669;
            transform: translateY(-1px);
          }
        `;
      case 'cancel':
        return `
          background-color: ${theme.colors.warning};
          color: ${theme.colors.background};
          
          &:hover {
            background-color: #d97706;
            transform: translateY(-1px);
          }
        `;
      default:
        return `
          background-color: transparent;
          color: ${theme.colors.text};
          border: 1px solid ${theme.colors.border};
          
          &:hover {
            background-color: ${theme.colors.backgroundLight};
            border-color: ${theme.colors.borderLight};
          }
        `;
    }
  }}
`;

const ManagerContent = styled.div`
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

const NotificationMethods = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: ${({ theme }) => theme.spacing.md};
`;

const MethodCheckbox = styled.label`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  cursor: pointer;
  padding: ${({ theme }) => theme.spacing.md};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  transition: all 0.2s ease;
  
  &:hover {
    background-color: ${({ theme }) => theme.colors.backgroundLight};
    border-color: ${({ theme }) => theme.colors.primary};
  }

  input[type="checkbox"] {
    accent-color: ${({ theme }) => theme.colors.primary};
  }
`;

const MethodIcon = styled.span`
  font-size: ${({ theme }) => theme.typography.fontSize.lg};
`;

const MethodLabel = styled.span`
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
`;

const ContactForm = styled.div`
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  padding: ${({ theme }) => theme.spacing.lg};
  background-color: ${({ theme }) => theme.colors.backgroundLight};
  margin-bottom: ${({ theme }) => theme.spacing.lg};
`;

const ContactFormRow = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: ${({ theme }) => theme.spacing.md};
  margin-bottom: ${({ theme }) => theme.spacing.md};
`;

const ContactsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: ${({ theme }) => theme.spacing.md};
`;

const ContactCard = styled.div`
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  padding: ${({ theme }) => theme.spacing.md};
  background-color: ${({ theme }) => theme.colors.backgroundLight};
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  transition: all 0.2s ease;

  &:hover {
    border-color: ${({ theme }) => theme.colors.primary};
    box-shadow: ${({ theme }) => theme.shadows.sm};
  }
`;

const ContactInfo = styled.div`
  flex: 1;
`;

const ContactName = styled.div`
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  font-size: ${({ theme }) => theme.typography.fontSize.md};
  color: ${({ theme }) => theme.colors.text};
  margin-bottom: ${({ theme }) => theme.spacing.xs};
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
`;

const EmergencyBadge = styled.span`
  background-color: ${({ theme }) => theme.colors.error};
  color: ${({ theme }) => theme.colors.background};
  padding: 2px 6px;
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
`;

const ContactDetails = styled.div`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.textSecondary};
  line-height: 1.4;
  margin-bottom: ${({ theme }) => theme.spacing.xs};
`;

const ContactActions = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.xs};
  flex-direction: column;
`;

const ActionButton = styled.button`
  background: none;
  border: 1px solid ${({ theme }) => theme.colors.border};
  color: ${({ theme }) => theme.colors.text};
  cursor: pointer;
  padding: ${({ theme }) => theme.spacing.xs};
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  transition: all 0.2s ease;
  
  &:hover {
    background-color: ${({ theme }) => theme.colors.backgroundCard};
    border-color: ${({ theme }) => theme.colors.primary};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const EmptyContacts = styled.div`
  text-align: center;
  padding: ${({ theme }) => theme.spacing.xl};
  color: ${({ theme }) => theme.colors.textMuted};
  font-style: italic;
  border: 2px dashed ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.md};
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

const ContactListManager: React.FC<ContactListManagerProps> = ({ 
  userRole, 
  userId, 
  onClose, 
  contactListData = null, 
  isEditing = false 
}) => {
  // Form state for contact list data
  const [formData, setFormData] = useState<ContactListData>({
    name: '',
    description: '',
    propertyId: '',
    listType: 'primary',
    priorityOrder: 1,
    contacts: [],
    notificationMethods: ['sms', 'email'],
    notificationSchedule: {},
    escalationDelayMinutes: 5,
    maxEscalationAttempts: 3,
    requireAcknowledgment: false,
    applicableIncidentTypes: [],
    excludedIncidentTypes: [],
    activeHours: {},
    timezone: 'America/New_York',
    status: 'active',
    effectiveDate: '',
    expirationDate: '',
    tags: [],
    notes: ''
  });

  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [currentContact, setCurrentContact] = useState<Contact>({
    name: '',
    phone: '',
    email: '',
    role: '',
    priority: 1,
    department: '',
    isEmergencyContact: false
  });
  const [editingContactIndex, setEditingContactIndex] = useState<number>(-1);
  const [testingNotifications, setTestingNotifications] = useState<boolean>(false);

  // Contact list types based on Master Prompt
  const listTypes: ListType[] = [
    { value: 'primary', label: 'Primary', description: 'Main contact list for regular incidents' },
    { value: 'emergency', label: 'Emergency', description: 'Emergency services and critical contacts' },
    { value: 'management', label: 'Management', description: 'Property management team' },
    { value: 'maintenance', label: 'Maintenance', description: 'Maintenance and facilities team' },
    { value: 'security', label: 'Security', description: 'Security personnel and guards' },
    { value: 'custom', label: 'Custom', description: 'Custom contact list' }
  ];

  const notificationMethodOptions: NotificationMethod[] = [
    { value: 'sms', label: 'SMS', icon: '📱' },
    { value: 'email', label: 'Email', icon: '📧' },
    { value: 'call', label: 'Phone Call', icon: '📞' },
    { value: 'push', label: 'Push Notification', icon: '🔔' }
  ];

  const timezones: string[] = [
    'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles',
    'America/Phoenix', 'America/Anchorage', 'Pacific/Honolulu'
  ];

  // Load initial data
  useEffect(() => {
    loadProperties();
    
    if (isEditing && contactListData) {
      setFormData({
        ...contactListData,
        contacts: contactListData.contacts || [],
        notificationMethods: contactListData.notificationMethods || ['sms', 'email'],
        applicableIncidentTypes: contactListData.applicableIncidentTypes || [],
        excludedIncidentTypes: contactListData.excludedIncidentTypes || [],
        tags: contactListData.tags || []
      });
    }
  }, [isEditing, contactListData]);

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

  const handleInputChange = useCallback((field: keyof ContactListData, value: any): void => {
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

  const handleContactInputChange = useCallback((field: keyof Contact, value: any): void => {
    setCurrentContact(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);

  const handleNotificationMethodToggle = useCallback((method: string): void => {
    setFormData(prev => ({
      ...prev,
      notificationMethods: prev.notificationMethods.includes(method)
        ? prev.notificationMethods.filter(m => m !== method)
        : [...prev.notificationMethods, method]
    }));
  }, []);

  const addContact = useCallback((): void => {
    const contactErrors: FormErrors = {};
    
    if (!currentContact.name.trim()) {
      contactErrors.name = 'Name is required';
    }
    
    if (!currentContact.phone.trim() && !currentContact.email.trim()) {
      contactErrors.contact = 'Either phone or email is required';
    }
    
    if (Object.keys(contactErrors).length > 0) {
      setErrors(contactErrors);
      return;
    }

    const newContact: Contact = {
      ...currentContact,
      id: editingContactIndex >= 0 ? formData.contacts[editingContactIndex].id : Date.now(),
      priority: parseInt(currentContact.priority.toString()) || 1
    };

    if (editingContactIndex >= 0) {
      // Edit existing contact
      const updatedContacts = [...formData.contacts];
      updatedContacts[editingContactIndex] = newContact;
      setFormData(prev => ({ ...prev, contacts: updatedContacts }));
      setEditingContactIndex(-1);
    } else {
      // Add new contact
      setFormData(prev => ({
        ...prev,
        contacts: [...prev.contacts, newContact]
      }));
    }

    // Reset form
    setCurrentContact({
      name: '',
      phone: '',
      email: '',
      role: '',
      priority: 1,
      department: '',
      isEmergencyContact: false
    });
    setErrors({});
  }, [currentContact, editingContactIndex, formData.contacts]);

  const editContact = useCallback((index: number): void => {
    setCurrentContact(formData.contacts[index]);
    setEditingContactIndex(index);
  }, [formData.contacts]);

  const removeContact = useCallback((index: number): void => {
    setFormData(prev => ({
      ...prev,
      contacts: prev.contacts.filter((_, i) => i !== index)
    }));
    
    if (editingContactIndex === index) {
      setEditingContactIndex(-1);
      setCurrentContact({
        name: '',
        phone: '',
        email: '',
        role: '',
        priority: 1,
        department: '',
        isEmergencyContact: false
      });
    }
  }, [editingContactIndex]);

  const moveContactUp = useCallback((index: number): void => {
    if (index > 0) {
      const newContacts = [...formData.contacts];
      [newContacts[index - 1], newContacts[index]] = [newContacts[index], newContacts[index - 1]];
      setFormData(prev => ({ ...prev, contacts: newContacts }));
    }
  }, [formData.contacts]);

  const moveContactDown = useCallback((index: number): void => {
    if (index < formData.contacts.length - 1) {
      const newContacts = [...formData.contacts];
      [newContacts[index], newContacts[index + 1]] = [newContacts[index + 1], newContacts[index]];
      setFormData(prev => ({ ...prev, contacts: newContacts }));
    }
  }, [formData.contacts]);

  const testNotifications = useCallback(async (): Promise<void> => {
    if (formData.contacts.length === 0) {
      alert('Add at least one contact to test notifications');
      return;
    }

    setTestingNotifications(true);
    
    try {
      const response = await fetch('/api/internal/v1/contact-lists/test-notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify({
          contacts: formData.contacts,
          notificationMethods: formData.notificationMethods,
          testMessage: 'This is a test notification from APEX AI Security System'
        })
      });

      if (response.ok) {
        const result = await response.json();
        alert(`Test notifications sent! Success: ${result.successful}, Failed: ${result.failed}`);
      } else {
        alert('Failed to send test notifications');
      }
    } catch (error) {
      console.error('Error testing notifications:', error);
      alert('Error testing notifications');
    } finally {
      setTestingNotifications(false);
    }
  }, [formData.contacts, formData.notificationMethods]);

  const validateForm = useCallback((): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Contact list name is required';
    }

    if (!formData.propertyId) {
      newErrors.propertyId = 'Property selection is required';
    }

    if (formData.contacts.length === 0) {
      newErrors.contacts = 'At least one contact is required';
    }

    if (formData.notificationMethods.length === 0) {
      newErrors.notificationMethods = 'At least one notification method is required';
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
        ? `/api/internal/v1/contact-lists/${contactListData?.id}`
        : '/api/internal/v1/contact-lists';
      
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
        alert(`Contact list ${isEditing ? 'updated' : 'created'} successfully!`);
        onClose?.(true); // true indicates success
      } else {
        const errorData = await response.json();
        alert(`Error: ${errorData.message || 'Failed to save contact list'}`);
      }
    } catch (error) {
      console.error('Error saving contact list:', error);
      alert('Error saving contact list. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [validateForm, isEditing, contactListData?.id, formData, userId, onClose]);

  // Check if user has permission to edit contact lists
  const canEdit = ['super_admin', 'admin_cto', 'admin_ceo', 'manager'].includes(userRole);

  if (!canEdit) {
    return (
      <ManagerContainer>
        <AccessDenied>
          <h2>🚫 Access Denied</h2>
          <p>You don't have permission to manage contact lists.</p>
          <Button variant="secondary" onClick={() => onClose?.()}>
            Close
          </Button>
        </AccessDenied>
      </ManagerContainer>
    );
  }

  return (
    <ManagerContainer>
      <ManagerHeader>
        <HeaderTitle>
          {isEditing ? 'Edit' : 'Create'} Contact List
        </HeaderTitle>
        <HeaderActions>
          <Button 
            variant="test"
            onClick={testNotifications}
            disabled={testingNotifications || formData.contacts.length === 0}
          >
            🧪 {testingNotifications ? 'Testing...' : 'Test Notifications'}
          </Button>
          <Button 
            variant="primary"
            onClick={handleSave} 
            disabled={loading}
          >
            💾 {loading ? 'Saving...' : 'Save Contact List'}
          </Button>
          <Button variant="secondary" onClick={() => onClose?.()}>
            ❌ Cancel
          </Button>
        </HeaderActions>
      </ManagerHeader>

      <ManagerContent>
        {/* Basic Information */}
        <FormSection>
          <SectionTitle>ℹ️ Basic Information</SectionTitle>
          
          <FormRow>
            <FormGroup>
              <Label>Contact List Name *</Label>
              <Input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="e.g., Emergency Response Team"
                hasError={!!errors.name}
              />
              {errors.name && <ErrorMessage>{errors.name}</ErrorMessage>}
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
              <Label>List Type</Label>
              <Select
                value={formData.listType}
                onChange={(e) => handleInputChange('listType', e.target.value)}
              >
                {listTypes.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </Select>
              <HelpText>{listTypes.find(t => t.value === formData.listType)?.description}</HelpText>
            </FormGroup>
            
            <FormGroup>
              <Label>Priority Order</Label>
              <Input
                type="number"
                min="1"
                max="10"
                value={formData.priorityOrder}
                onChange={(e) => handleInputChange('priorityOrder', parseInt(e.target.value) || 1)}
              />
              <HelpText>Lower numbers = higher priority (1 = highest)</HelpText>
            </FormGroup>
          </FormRow>

          <FormGroup>
            <Label>Description</Label>
            <TextArea
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Describe when this contact list should be used"
              rows={3}
            />
          </FormGroup>
        </FormSection>

        {/* Notification Methods */}
        <FormSection>
          <SectionTitle>📢 Notification Methods</SectionTitle>
          
          <NotificationMethods>
            {notificationMethodOptions.map(method => (
              <MethodCheckbox key={method.value}>
                <input
                  type="checkbox"
                  checked={formData.notificationMethods.includes(method.value)}
                  onChange={() => handleNotificationMethodToggle(method.value)}
                />
                <MethodIcon>{method.icon}</MethodIcon>
                <MethodLabel>{method.label}</MethodLabel>
              </MethodCheckbox>
            ))}
          </NotificationMethods>
          {errors.notificationMethods && <ErrorMessage>{errors.notificationMethods}</ErrorMessage>}
        </FormSection>

        {/* Contacts Management */}
        <FormSection>
          <SectionTitle>👥 Contacts</SectionTitle>
          
          {/* Add/Edit Contact Form */}
          <ContactForm>
            <ContactFormRow>
              <FormGroup>
                <Label>Name *</Label>
                <Input
                  type="text"
                  value={currentContact.name}
                  onChange={(e) => handleContactInputChange('name', e.target.value)}
                  placeholder="Contact Name"
                  hasError={!!errors.name}
                />
              </FormGroup>
              
              <FormGroup>
                <Label>Phone</Label>
                <Input
                  type="tel"
                  value={currentContact.phone}
                  onChange={(e) => handleContactInputChange('phone', e.target.value)}
                  placeholder="+1 (555) 123-4567"
                />
              </FormGroup>
              
              <FormGroup>
                <Label>Email</Label>
                <Input
                  type="email"
                  value={currentContact.email}
                  onChange={(e) => handleContactInputChange('email', e.target.value)}
                  placeholder="contact@example.com"
                />
              </FormGroup>
            </ContactFormRow>
            
            <ContactFormRow>
              <FormGroup>
                <Label>Role/Title</Label>
                <Input
                  type="text"
                  value={currentContact.role}
                  onChange={(e) => handleContactInputChange('role', e.target.value)}
                  placeholder="Security Manager"
                />
              </FormGroup>
              
              <FormGroup>
                <Label>Department</Label>
                <Input
                  type="text"
                  value={currentContact.department}
                  onChange={(e) => handleContactInputChange('department', e.target.value)}
                  placeholder="Security"
                />
              </FormGroup>
              
              <FormGroup>
                <Label>Priority</Label>
                <Select
                  value={currentContact.priority}
                  onChange={(e) => handleContactInputChange('priority', parseInt(e.target.value))}
                >
                  {[1, 2, 3, 4, 5].map(num => (
                    <option key={num} value={num}>
                      {num} {num === 1 ? '(Highest)' : num === 5 ? '(Lowest)' : ''}
                    </option>
                  ))}
                </Select>
              </FormGroup>
            </ContactFormRow>
            
            <ContactFormRow>
              <CheckboxLabel>
                <input
                  type="checkbox"
                  checked={currentContact.isEmergencyContact}
                  onChange={(e) => handleContactInputChange('isEmergencyContact', e.target.checked)}
                />
                🚨 Emergency Contact (available 24/7)
              </CheckboxLabel>
              
              <div style={{ display: 'flex', gap: '12px' }}>
                <Button 
                  variant="add"
                  onClick={addContact}
                  type="button"
                >
                  {editingContactIndex >= 0 ? '✏️ Update Contact' : '➕ Add Contact'}
                </Button>
                
                {editingContactIndex >= 0 && (
                  <Button 
                    variant="cancel"
                    onClick={() => {
                      setEditingContactIndex(-1);
                      setCurrentContact({
                        name: '', phone: '', email: '', role: '', priority: 1, department: '', isEmergencyContact: false
                      });
                    }}
                    type="button"
                  >
                    ❌ Cancel Edit
                  </Button>
                )}
              </div>
            </ContactFormRow>
            
            {(errors.contact || errors.contacts) && (
              <ErrorMessage>
                {errors.contact || errors.contacts}
              </ErrorMessage>
            )}
          </ContactForm>

          {/* Contacts List */}
          {formData.contacts.length === 0 ? (
            <EmptyContacts>
              <p>📭 No contacts added yet. Add your first contact above.</p>
            </EmptyContacts>
          ) : (
            <ContactsGrid>
              {formData.contacts.map((contact, index) => (
                <ContactCard key={contact.id || index}>
                  <ContactInfo>
                    <ContactName>
                      {contact.name}
                      {contact.isEmergencyContact && (
                        <EmergencyBadge>24/7</EmergencyBadge>
                      )}
                    </ContactName>
                    <ContactDetails>
                      {contact.role && <div>🏷️ {contact.role}</div>}
                      {contact.department && <div>🏢 {contact.department}</div>}
                      {contact.phone && <div>📱 {contact.phone}</div>}
                      {contact.email && <div>📧 {contact.email}</div>}
                      <div>⭐ Priority: {contact.priority}</div>
                    </ContactDetails>
                  </ContactInfo>
                  
                  <ContactActions>
                    <ActionButton
                      onClick={() => moveContactUp(index)}
                      disabled={index === 0}
                      title="Move Up"
                    >
                      ↑
                    </ActionButton>
                    <ActionButton
                      onClick={() => moveContactDown(index)}
                      disabled={index === formData.contacts.length - 1}
                      title="Move Down"
                    >
                      ↓
                    </ActionButton>
                    <ActionButton
                      onClick={() => editContact(index)}
                      title="Edit Contact"
                    >
                      ✏️
                    </ActionButton>
                    <ActionButton
                      onClick={() => removeContact(index)}
                      title="Remove Contact"
                      style={{ color: '#ef4444' }}
                    >
                      🗑️
                    </ActionButton>
                  </ContactActions>
                </ContactCard>
              ))}
            </ContactsGrid>
          )}
        </FormSection>

        {/* Escalation Settings */}
        <FormSection>
          <SectionTitle>⚡ Escalation Settings</SectionTitle>
          
          <FormRow>
            <FormGroup>
              <Label>Escalation Delay (minutes)</Label>
              <Input
                type="number"
                min="1"
                max="60"
                value={formData.escalationDelayMinutes}
                onChange={(e) => handleInputChange('escalationDelayMinutes', parseInt(e.target.value) || 5)}
              />
              <HelpText>Time to wait before escalating to next contact</HelpText>
            </FormGroup>
            
            <FormGroup>
              <Label>Max Escalation Attempts</Label>
              <Input
                type="number"
                min="1"
                max="10"
                value={formData.maxEscalationAttempts}
                onChange={(e) => handleInputChange('maxEscalationAttempts', parseInt(e.target.value) || 3)}
              />
              <HelpText>Maximum number of escalation attempts</HelpText>
            </FormGroup>
          </FormRow>

          <CheckboxLabel>
            <input
              type="checkbox"
              checked={formData.requireAcknowledgment}
              onChange={(e) => handleInputChange('requireAcknowledgment', e.target.checked)}
            />
            ✅ Require Acknowledgment
            <HelpText>Contacts must acknowledge receipt of notifications</HelpText>
          </CheckboxLabel>
        </FormSection>

        {/* Schedule and Settings */}
        <FormSection>
          <SectionTitle>⏰ Schedule and Settings</SectionTitle>
          
          <FormRow>
            <FormGroup>
              <Label>Timezone</Label>
              <Select
                value={formData.timezone}
                onChange={(e) => handleInputChange('timezone', e.target.value)}
              >
                {timezones.map(tz => (
                  <option key={tz} value={tz}>{tz}</option>
                ))}
              </Select>
            </FormGroup>
            
            <FormGroup>
              <Label>Status</Label>
              <Select
                value={formData.status}
                onChange={(e) => handleInputChange('status', e.target.value)}
              >
                <option value="active">✅ Active</option>
                <option value="inactive">⏸️ Inactive</option>
                <option value="archived">📦 Archived</option>
              </Select>
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
              placeholder="Additional notes about this contact list"
              rows={3}
            />
          </FormGroup>
        </FormSection>
      </ManagerContent>
    </ManagerContainer>
  );
};

export default ContactListManager;