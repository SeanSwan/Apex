// PropertyFormModal.tsx
/**
 * COMPREHENSIVE PROPERTY FORM MODAL
 * =================================
 * Modal component for creating and editing properties with:
 * - Complete form validation
 * - Image upload integration
 * - Client selection and management
 * - Emergency contact configuration
 * - Access codes management
 * - Real-time validation and feedback
 */

import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { 
  Building, 
  X, 
  Save, 
  Plus, 
  Edit,
  MapPin,
  User,
  Phone,
  Mail,
  Key,
  AlertTriangle,
  CheckCircle,
  Clock,
  Globe,
  Users,
  FileText
} from 'lucide-react';

import { Button } from '../ui/button';
import { useToast } from '../../hooks/use-toast';
import PropertyImageManager from './PropertyImageManager';

// Types
interface Property {
  id?: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  propertyType: 'luxury_apartment' | 'commercial' | 'residential' | 'corporate';
  clientId: string;
  timezone: string;
  emergencyContactInfo: {
    name: string;
    phone: string;
    email: string;
    alternatePhone?: string;
    relationship?: string;
  };
  specialInstructions: string;
  accessCodes: {
    main: string;
    emergency: string;
    maintenance: string;
    guest?: string;
  };
  operatingHours?: {
    weekdays: { open: string; close: string };
    weekends: { open: string; close: string };
  };
  propertyImages?: PropertyImage[];
  status: 'active' | 'inactive' | 'maintenance';
  securityLevel: 'basic' | 'standard' | 'enhanced' | 'maximum';
  notes?: string;
}

interface PropertyImage {
  filename: string;
  originalName: string;
  size: number;
  url: string;
  uploadedAt?: string;
}

interface Client {
  id: string;
  name: string;
  companyName: string;
  email: string;
  phone: string;
  address: string;
  status: 'active' | 'inactive';
}

interface PropertyFormModalProps {
  isOpen: boolean;
  mode: 'create' | 'edit';
  property?: Property | null;
  onClose: () => void;
  onSave: (property: Property) => Promise<void>;
  clients?: Client[];
  onLoadClients?: () => Promise<Client[]>;
}

// Styled Components
const ModalOverlay = styled.div<{ $isOpen: boolean }>`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: ${props => props.$isOpen ? 'flex' : 'none'};
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 2rem;
  overflow-y: auto;
`;

const ModalContainer = styled.div`
  background: rgba(20, 20, 20, 0.95);
  border-radius: 16px;
  border: 1px solid rgba(255, 215, 0, 0.3);
  max-width: 900px;
  width: 100%;
  max-height: 95vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  backdrop-filter: blur(20px);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
`;

const ModalHeader = styled.div`
  padding: 2rem;
  border-bottom: 1px solid rgba(255, 215, 0, 0.3);
  display: flex;
  justify-content: space-between;
  align-items: center;
  
  h2 {
    margin: 0;
    color: #FFD700;
    display: flex;
    align-items: center;
    gap: 0.75rem;
    font-size: 1.5rem;
    font-weight: 600;
  }
  
  .close-button {
    background: none;
    border: none;
    color: #666;
    cursor: pointer;
    padding: 0.5rem;
    border-radius: 8px;
    transition: all 0.2s ease;
    
    &:hover {
      background: rgba(255, 255, 255, 0.1);
      color: #FFD700;
    }
  }
`;

const ModalBody = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 2rem;
`;

const ModalFooter = styled.div`
  padding: 1.5rem 2rem;
  border-top: 1px solid rgba(255, 215, 0, 0.3);
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  align-items: center;
  
  .validation-summary {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: #EF4444;
    font-size: 0.9rem;
    
    &.valid {
      color: #22C55E;
    }
  }
`;

const FormSection = styled.div`
  margin-bottom: 2rem;
  
  .section-header {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-bottom: 1.5rem;
    padding-bottom: 0.75rem;
    border-bottom: 1px solid rgba(255, 215, 0, 0.2);
    
    h3 {
      margin: 0;
      color: #FFD700;
      font-size: 1.1rem;
      font-weight: 600;
    }
    
    .section-icon {
      padding: 0.5rem;
      background: rgba(255, 215, 0, 0.1);
      border-radius: 8px;
      color: #FFD700;
    }
  }
`;

const FormGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
  
  &.single-column {
    grid-template-columns: 1fr;
  }
  
  &.three-column {
    grid-template-columns: 1fr 1fr 1fr;
  }
`;

const FormGroup = styled.div<{ $hasError?: boolean; $fullWidth?: boolean }>`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  grid-column: ${props => props.$fullWidth ? '1 / -1' : 'auto'};
  
  label {
    color: #FFD700;
    font-size: 0.9rem;
    font-weight: 500;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    
    .required {
      color: #EF4444;
    }
    
    .optional {
      color: #666;
      font-weight: 400;
      font-size: 0.8rem;
    }
  }
  
  input, select, textarea {
    padding: 0.75rem 1rem;
    background: rgba(40, 40, 40, 0.9);
    border: 1px solid ${props => props.$hasError ? '#EF4444' : 'rgba(255, 215, 0, 0.3)'};
    border-radius: 8px;
    color: #E0E0E0;
    font-size: 0.9rem;
    transition: all 0.2s ease;
    
    &::placeholder {
      color: #666;
    }
    
    &:focus {
      outline: none;
      border-color: ${props => props.$hasError ? '#EF4444' : '#FFD700'};
      box-shadow: 0 0 0 3px ${props => props.$hasError ? 'rgba(239, 68, 68, 0.1)' : 'rgba(255, 215, 0, 0.1)'};
    }
    
    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }
  
  textarea {
    resize: vertical;
    min-height: 100px;
    line-height: 1.5;
  }
  
  .field-error {
    color: #EF4444;
    font-size: 0.8rem;
    display: flex;
    align-items: center;
    gap: 0.25rem;
    margin-top: 0.25rem;
  }
  
  .field-help {
    color: #B0B0B0;
    font-size: 0.8rem;
    line-height: 1.4;
    margin-top: 0.25rem;
  }
`;

const ClientSelector = styled.div`
  position: relative;
  
  .client-list {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    background: rgba(30, 30, 30, 0.95);
    border: 1px solid rgba(255, 215, 0, 0.3);
    border-radius: 8px;
    max-height: 200px;
    overflow-y: auto;
    z-index: 100;
    backdrop-filter: blur(10px);
    
    .client-option {
      padding: 0.75rem 1rem;
      cursor: pointer;
      transition: background-color 0.2s ease;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      
      &:hover {
        background: rgba(255, 215, 0, 0.1);
      }
      
      &:last-child {
        border-bottom: none;
      }
      
      .client-name {
        color: #E0E0E0;
        font-weight: 500;
      }
      
      .client-details {
        color: #B0B0B0;
        font-size: 0.8rem;
        margin-top: 0.25rem;
      }
    }
    
    .no-clients {
      padding: 1rem;
      text-align: center;
      color: #666;
      font-style: italic;
    }
  }
`;

const AccessCodeGroup = styled.div`
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 0.5rem;
  align-items: end;
  
  .generate-button {
    padding: 0.75rem;
    background: rgba(59, 130, 246, 0.2);
    border: 1px solid rgba(59, 130, 246, 0.3);
    border-radius: 8px;
    color: #3B82F6;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    
    &:hover {
      background: rgba(59, 130, 246, 0.3);
    }
  }
`;

const ValidationBadge = styled.div<{ $type: 'error' | 'warning' | 'success' }>`
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 500;
  
  background: ${props => {
    switch(props.$type) {
      case 'error': return 'rgba(239, 68, 68, 0.2)';
      case 'warning': return 'rgba(245, 158, 11, 0.2)';
      case 'success': return 'rgba(34, 197, 94, 0.2)';
    }
  }};
  
  color: ${props => {
    switch(props.$type) {
      case 'error': return '#EF4444';
      case 'warning': return '#F59E0B';
      case 'success': return '#22C55E';
    }
  }};
  
  border: 1px solid ${props => {
    switch(props.$type) {
      case 'error': return 'rgba(239, 68, 68, 0.5)';
      case 'warning': return 'rgba(245, 158, 11, 0.5)';
      case 'success': return 'rgba(34, 197, 94, 0.5)';
    }
  }};
`;

// Validation schema
const validateProperty = (property: Property): Record<string, string> => {
  const errors: Record<string, string> = {};
  
  if (!property.name.trim()) errors.name = 'Property name is required';
  if (!property.address.trim()) errors.address = 'Address is required';
  if (!property.city.trim()) errors.city = 'City is required';
  if (!property.state.trim()) errors.state = 'State is required';
  if (!property.clientId.trim()) errors.clientId = 'Client selection is required';
  
  if (property.emergencyContactInfo.name && !property.emergencyContactInfo.phone) {
    errors.emergencyPhone = 'Emergency contact phone is required when name is provided';
  }
  
  // Validate phone numbers
  const phoneRegex = /^\+?[\d\s\-\(\)]+$/;
  if (property.emergencyContactInfo.phone && !phoneRegex.test(property.emergencyContactInfo.phone)) {
    errors.emergencyPhone = 'Invalid phone number format';
  }
  
  // Validate email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (property.emergencyContactInfo.email && !emailRegex.test(property.emergencyContactInfo.email)) {
    errors.emergencyEmail = 'Invalid email format';
  }
  
  return errors;
};

// Utility functions
const generateAccessCode = (length: number = 6): string => {
  const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

const timezones = [
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/Phoenix',
  'America/Alaska',
  'Pacific/Honolulu'
];

const securityLevels = [
  { value: 'basic', label: 'Basic Security', description: 'Standard monitoring and patrol' },
  { value: 'standard', label: 'Standard Security', description: 'Enhanced monitoring with AI alerts' },
  { value: 'enhanced', label: 'Enhanced Security', description: 'Advanced AI detection and response' },
  { value: 'maximum', label: 'Maximum Security', description: 'Full AI automation with armed response' }
];

// Main Component
const PropertyFormModal: React.FC<PropertyFormModalProps> = ({
  isOpen,
  mode,
  property,
  onClose,
  onSave,
  clients = [],
  onLoadClients
}) => {
  const { toast } = useToast();
  
  // Form state
  const [formData, setFormData] = useState<Property>({
    name: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'United States',
    propertyType: 'luxury_apartment',
    clientId: '',
    timezone: 'America/New_York',
    emergencyContactInfo: {
      name: '',
      phone: '',
      email: '',
      alternatePhone: '',
      relationship: ''
    },
    specialInstructions: '',
    accessCodes: {
      main: '',
      emergency: '',
      maintenance: '',
      guest: ''
    },
    operatingHours: {
      weekdays: { open: '08:00', close: '18:00' },
      weekends: { open: '09:00', close: '17:00' }
    },
    status: 'active',
    securityLevel: 'standard',
    notes: ''
  });
  
  const [availableClients, setAvailableClients] = useState<Client[]>(clients);
  const [showClientList, setShowClientList] = useState(false);
  const [clientSearch, setClientSearch] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [images, setImages] = useState<PropertyImage[]>([]);

  // Initialize form data when modal opens or property changes
  useEffect(() => {
    if (isOpen) {
      if (mode === 'edit' && property) {
        setFormData(property);
        setImages(property.propertyImages || []);
      } else {
        // Reset form for create mode
        setFormData({
          name: '',
          address: '',
          city: '',
          state: '',
          zipCode: '',
          country: 'United States',
          propertyType: 'luxury_apartment',
          clientId: '',
          timezone: 'America/New_York',
          emergencyContactInfo: {
            name: '',
            phone: '',
            email: '',
            alternatePhone: '',
            relationship: ''
          },
          specialInstructions: '',
          accessCodes: {
            main: '',
            emergency: '',
            maintenance: '',
            guest: ''
          },
          operatingHours: {
            weekdays: { open: '08:00', close: '18:00' },
            weekends: { open: '09:00', close: '17:00' }
          },
          status: 'active',
          securityLevel: 'standard',
          notes: ''
        });
        setImages([]);
      }
      setErrors({});
      
      // Load clients if needed
      if (onLoadClients && availableClients.length === 0) {
        onLoadClients().then(setAvailableClients);
      }
    }
  }, [isOpen, mode, property, onLoadClients, availableClients.length]);

  // Handle form field changes
  const handleFieldChange = useCallback((field: string, value: any) => {
    setFormData(prev => {
      const keys = field.split('.');
      if (keys.length === 1) {
        return { ...prev, [field]: value };
      } else {
        // Handle nested objects
        const newData = { ...prev };
        let current: any = newData;
        for (let i = 0; i < keys.length - 1; i++) {
          current = current[keys[i]];
        }
        current[keys[keys.length - 1]] = value;
        return newData;
      }
    });
    
    // Clear field error when user starts typing
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  }, [errors]);

  // Handle form submission
  const handleSubmit = useCallback(async () => {
    const validationErrors = validateProperty(formData);
    
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      toast({
        title: "Validation Error",
        description: "Please fix the errors before submitting.",
        variant: "destructive"
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const propertyWithImages = {
        ...formData,
        propertyImages: images
      };
      
      await onSave(propertyWithImages);
      
      toast({
        title: mode === 'create' ? "Property Created" : "Property Updated",
        description: `Property "${formData.name}" has been ${mode === 'create' ? 'created' : 'updated'} successfully.`,
        variant: "default"
      });
      
      onClose();
    } catch (error) {
      console.error('Save error:', error);
      toast({
        title: "Save Failed",
        description: error.message || "Failed to save property. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, images, mode, onSave, onClose, toast]);

  // Filter clients based on search
  const filteredClients = availableClients.filter(client =>
    client.name.toLowerCase().includes(clientSearch.toLowerCase()) ||
    client.companyName.toLowerCase().includes(clientSearch.toLowerCase())
  );

  const validationCount = Object.keys(errors).length;
  const isValid = validationCount === 0 && formData.name && formData.address && formData.clientId;

  if (!isOpen) return null;

  return (
    <ModalOverlay $isOpen={isOpen}>
      <ModalContainer>
        <ModalHeader>
          <h2>
            {mode === 'create' ? <Plus size={24} /> : <Edit size={24} />}
            {mode === 'create' ? 'Create New Property' : 'Edit Property'}
          </h2>
          <button className="close-button" onClick={onClose}>
            <X size={20} />
          </button>
        </ModalHeader>
        
        <ModalBody>
          {/* Basic Information Section */}
          <FormSection>
            <div className="section-header">
              <div className="section-icon">
                <Building size={18} />
              </div>
              <h3>Basic Information</h3>
            </div>
            
            <FormGrid>
              <FormGroup $hasError={!!errors.name}>
                <label>
                  Property Name <span className="required">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Enter property name"
                  value={formData.name}
                  onChange={(e) => handleFieldChange('name', e.target.value)}
                />
                {errors.name && (
                  <div className="field-error">
                    <AlertTriangle size={12} />
                    {errors.name}
                  </div>
                )}
              </FormGroup>
              
              <FormGroup $hasError={!!errors.propertyType}>
                <label>Property Type</label>
                <select
                  value={formData.propertyType}
                  onChange={(e) => handleFieldChange('propertyType', e.target.value)}
                >
                  <option value="luxury_apartment">Luxury Apartment</option>
                  <option value="commercial">Commercial</option>
                  <option value="residential">Residential</option>
                  <option value="corporate">Corporate</option>
                </select>
              </FormGroup>
              
              <FormGroup $hasError={!!errors.clientId} $fullWidth>
                <label>
                  Client <span className="required">*</span>
                </label>
                <ClientSelector>
                  <input
                    type="text"
                    placeholder="Search and select client..."
                    value={clientSearch}
                    onChange={(e) => {
                      setClientSearch(e.target.value);
                      setShowClientList(true);
                    }}
                    onFocus={() => setShowClientList(true)}
                  />
                  {showClientList && (
                    <div className="client-list">
                      {filteredClients.length > 0 ? (
                        filteredClients.map(client => (
                          <div
                            key={client.id}
                            className="client-option"
                            onClick={() => {
                              handleFieldChange('clientId', client.id);
                              setClientSearch(`${client.companyName} (${client.name})`);
                              setShowClientList(false);
                            }}
                          >
                            <div className="client-name">{client.companyName}</div>
                            <div className="client-details">
                              Contact: {client.name} • {client.email}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="no-clients">No clients found</div>
                      )}
                    </div>
                  )}
                </ClientSelector>
                {errors.clientId && (
                  <div className="field-error">
                    <AlertTriangle size={12} />
                    {errors.clientId}
                  </div>
                )}
              </FormGroup>
            </FormGrid>
          </FormSection>

          {/* Address Information Section */}
          <FormSection>
            <div className="section-header">
              <div className="section-icon">
                <MapPin size={18} />
              </div>
              <h3>Address Information</h3>
            </div>
            
            <FormGrid>
              <FormGroup $hasError={!!errors.address} $fullWidth>
                <label>
                  Street Address <span className="required">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Enter street address"
                  value={formData.address}
                  onChange={(e) => handleFieldChange('address', e.target.value)}
                />
                {errors.address && (
                  <div className="field-error">
                    <AlertTriangle size={12} />
                    {errors.address}
                  </div>
                )}
              </FormGroup>
              
              <FormGroup $hasError={!!errors.city}>
                <label>
                  City <span className="required">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Enter city"
                  value={formData.city}
                  onChange={(e) => handleFieldChange('city', e.target.value)}
                />
                {errors.city && (
                  <div className="field-error">
                    <AlertTriangle size={12} />
                    {errors.city}
                  </div>
                )}
              </FormGroup>
              
              <FormGroup $hasError={!!errors.state}>
                <label>
                  State <span className="required">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Enter state"
                  value={formData.state}
                  onChange={(e) => handleFieldChange('state', e.target.value)}
                />
                {errors.state && (
                  <div className="field-error">
                    <AlertTriangle size={12} />
                    {errors.state}
                  </div>
                )}
              </FormGroup>
              
              <FormGroup>
                <label>Zip Code</label>
                <input
                  type="text"
                  placeholder="Enter zip code"
                  value={formData.zipCode}
                  onChange={(e) => handleFieldChange('zipCode', e.target.value)}
                />
              </FormGroup>
              
              <FormGroup>
                <label>Country</label>
                <input
                  type="text"
                  value={formData.country}
                  onChange={(e) => handleFieldChange('country', e.target.value)}
                />
              </FormGroup>
              
              <FormGroup>
                <label>
                  <Clock size={14} />
                  Timezone
                </label>
                <select
                  value={formData.timezone}
                  onChange={(e) => handleFieldChange('timezone', e.target.value)}
                >
                  {timezones.map(tz => (
                    <option key={tz} value={tz}>{tz}</option>
                  ))}
                </select>
              </FormGroup>
            </FormGrid>
          </FormSection>

          {/* Emergency Contact Section */}
          <FormSection>
            <div className="section-header">
              <div className="section-icon">
                <User size={18} />
              </div>
              <h3>Emergency Contact Information</h3>
            </div>
            
            <FormGrid>
              <FormGroup>
                <label>Contact Name</label>
                <input
                  type="text"
                  placeholder="Enter emergency contact name"
                  value={formData.emergencyContactInfo.name}
                  onChange={(e) => handleFieldChange('emergencyContactInfo.name', e.target.value)}
                />
              </FormGroup>
              
              <FormGroup>
                <label>Relationship</label>
                <input
                  type="text"
                  placeholder="e.g., Property Manager, Security Chief"
                  value={formData.emergencyContactInfo.relationship || ''}
                  onChange={(e) => handleFieldChange('emergencyContactInfo.relationship', e.target.value)}
                />
              </FormGroup>
              
              <FormGroup $hasError={!!errors.emergencyPhone}>
                <label>
                  <Phone size={14} />
                  Phone Number
                </label>
                <input
                  type="tel"
                  placeholder="Enter phone number"
                  value={formData.emergencyContactInfo.phone}
                  onChange={(e) => handleFieldChange('emergencyContactInfo.phone', e.target.value)}
                />
                {errors.emergencyPhone && (
                  <div className="field-error">
                    <AlertTriangle size={12} />
                    {errors.emergencyPhone}
                  </div>
                )}
              </FormGroup>
              
              <FormGroup>
                <label>Alternate Phone</label>
                <input
                  type="tel"
                  placeholder="Enter alternate phone"
                  value={formData.emergencyContactInfo.alternatePhone || ''}
                  onChange={(e) => handleFieldChange('emergencyContactInfo.alternatePhone', e.target.value)}
                />
              </FormGroup>
              
              <FormGroup $hasError={!!errors.emergencyEmail} $fullWidth>
                <label>
                  <Mail size={14} />
                  Email Address
                </label>
                <input
                  type="email"
                  placeholder="Enter email address"
                  value={formData.emergencyContactInfo.email}
                  onChange={(e) => handleFieldChange('emergencyContactInfo.email', e.target.value)}
                />
                {errors.emergencyEmail && (
                  <div className="field-error">
                    <AlertTriangle size={12} />
                    {errors.emergencyEmail}
                  </div>
                )}
              </FormGroup>
            </FormGrid>
          </FormSection>

          {/* Access Codes Section */}
          <FormSection>
            <div className="section-header">
              <div className="section-icon">
                <Key size={18} />
              </div>
              <h3>Access Codes</h3>
            </div>
            
            <FormGrid>
              <FormGroup>
                <label>Main Access Code</label>
                <AccessCodeGroup>
                  <input
                    type="text"
                    placeholder="Enter main access code"
                    value={formData.accessCodes.main}
                    onChange={(e) => handleFieldChange('accessCodes.main', e.target.value)}
                  />
                  <button
                    type="button"
                    className="generate-button"
                    onClick={() => handleFieldChange('accessCodes.main', generateAccessCode())}
                    title="Generate random code"
                  >
                    <RotateCw size={16} />
                  </button>
                </AccessCodeGroup>
              </FormGroup>
              
              <FormGroup>
                <label>Emergency Code</label>
                <AccessCodeGroup>
                  <input
                    type="text"
                    placeholder="Enter emergency code"
                    value={formData.accessCodes.emergency}
                    onChange={(e) => handleFieldChange('accessCodes.emergency', e.target.value)}
                  />
                  <button
                    type="button"
                    className="generate-button"
                    onClick={() => handleFieldChange('accessCodes.emergency', generateAccessCode())}
                    title="Generate random code"
                  >
                    <RotateCw size={16} />
                  </button>
                </AccessCodeGroup>
              </FormGroup>
              
              <FormGroup>
                <label>Maintenance Code</label>
                <AccessCodeGroup>
                  <input
                    type="text"
                    placeholder="Enter maintenance code"
                    value={formData.accessCodes.maintenance}
                    onChange={(e) => handleFieldChange('accessCodes.maintenance', e.target.value)}
                  />
                  <button
                    type="button"
                    className="generate-button"
                    onClick={() => handleFieldChange('accessCodes.maintenance', generateAccessCode())}
                    title="Generate random code"
                  >
                    <RotateCw size={16} />
                  </button>
                </AccessCodeGroup>
              </FormGroup>
              
              <FormGroup>
                <label>Guest Code <span className="optional">(optional)</span></label>
                <AccessCodeGroup>
                  <input
                    type="text"
                    placeholder="Enter guest code"
                    value={formData.accessCodes.guest || ''}
                    onChange={(e) => handleFieldChange('accessCodes.guest', e.target.value)}
                  />
                  <button
                    type="button"
                    className="generate-button"
                    onClick={() => handleFieldChange('accessCodes.guest', generateAccessCode())}
                    title="Generate random code"
                  >
                    <RotateCw size={16} />
                  </button>
                </AccessCodeGroup>
              </FormGroup>
            </FormGrid>
          </FormSection>

          {/* Security Configuration Section */}
          <FormSection>
            <div className="section-header">
              <div className="section-icon">
                <AlertTriangle size={18} />
              </div>
              <h3>Security Configuration</h3>
            </div>
            
            <FormGrid>
              <FormGroup>
                <label>Security Level</label>
                <select
                  value={formData.securityLevel}
                  onChange={(e) => handleFieldChange('securityLevel', e.target.value)}
                >
                  {securityLevels.map(level => (
                    <option key={level.value} value={level.value}>
                      {level.label}
                    </option>
                  ))}
                </select>
                <div className="field-help">
                  {securityLevels.find(l => l.value === formData.securityLevel)?.description}
                </div>
              </FormGroup>
              
              <FormGroup>
                <label>Property Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => handleFieldChange('status', e.target.value)}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="maintenance">Under Maintenance</option>
                </select>
              </FormGroup>
            </FormGrid>
          </FormSection>

          {/* Additional Information Section */}
          <FormSection>
            <div className="section-header">
              <div className="section-icon">
                <FileText size={18} />
              </div>
              <h3>Additional Information</h3>
            </div>
            
            <FormGrid className="single-column">
              <FormGroup>
                <label>Special Instructions</label>
                <textarea
                  placeholder="Enter any special instructions, protocols, or notes for this property..."
                  value={formData.specialInstructions}
                  onChange={(e) => handleFieldChange('specialInstructions', e.target.value)}
                />
                <div className="field-help">
                  Include access procedures, special security requirements, or any other important information.
                </div>
              </FormGroup>
              
              <FormGroup>
                <label>Internal Notes <span className="optional">(optional)</span></label>
                <textarea
                  placeholder="Enter internal notes (not visible to client)..."
                  value={formData.notes || ''}
                  onChange={(e) => handleFieldChange('notes', e.target.value)}
                />
                <div className="field-help">
                  These notes are for internal use only and will not be shared with the client.
                </div>
              </FormGroup>
            </FormGrid>
          </FormSection>

          {/* Property Images Section */}
          <FormSection>
            <div className="section-header">
              <div className="section-icon">
                <ImageIcon size={18} />
              </div>
              <h3>Property Images</h3>
            </div>
            
            <PropertyImageManager
              propertyId={mode === 'edit' ? formData.id : undefined}
              existingImages={images}
              onImagesChange={setImages}
              maxImages={10}
              maxFileSize={10}
              showPreview={true}
              enableBulkActions={true}
            />
          </FormSection>
        </ModalBody>
        
        <ModalFooter>
          <div className="validation-summary">
            {validationCount > 0 ? (
              <ValidationBadge $type="error">
                <AlertTriangle size={12} />
                {validationCount} error{validationCount !== 1 ? 's' : ''} found
              </ValidationBadge>
            ) : isValid ? (
              <ValidationBadge $type="success">
                <CheckCircle size={12} />
                Ready to save
              </ValidationBadge>
            ) : null}
          </div>
          
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          
          <Button
            onClick={handleSubmit}
            disabled={!isValid || isSubmitting}
          >
            <Save size={16} />
            {isSubmitting ? 'Saving...' : (mode === 'create' ? 'Create Property' : 'Update Property')}
          </Button>
        </ModalFooter>
      </ModalContainer>
    </ModalOverlay>
  );
};

export default PropertyFormModal;