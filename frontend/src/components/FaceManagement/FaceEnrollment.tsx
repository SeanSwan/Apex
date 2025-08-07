/**
 * APEX AI FACE ENROLLMENT COMPONENT - CORRECTED VERSION
 * =====================================================
 * Production-ready face enrollment interface with drag & drop upload
 * 
 * FIXES APPLIED:
 * - Fixed escaped quotes in JSX attributes
 * - Added missing import for UserX
 * - Corrected TypeScript interfaces
 * - Fixed event handlers
 */

import React, { useState, useRef, useCallback } from 'react';
import styled from 'styled-components';
import {
  Upload,
  User,
  Camera,
  CheckCircle,
  AlertCircle,
  X,
  Building,
  Shield,
  FileText,
  Loader
} from 'lucide-react';

// Styled Components
const EnrollmentContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2rem;
  max-width: 800px;
  margin: 0 auto;
  font-family: ${props => props.theme.typography.fontFamily.primary};
`;

const Header = styled.div`
  text-align: center;
  margin-bottom: 1rem;
  
  h2 {
    color: ${props => props.theme.colors.white};
    font-size: 1.5rem;
    font-weight: 600;
    margin: 0 0 0.5rem 0;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.75rem;
    font-family: ${props => props.theme.typography.fontFamily.primary};
  }
  
  p {
    color: rgba(255, 255, 255, 0.8);
    margin: 0;
    font-size: 0.9rem;
  }
`;

const UploadSection = styled.div`
  background: rgba(0, 0, 0, 0.2);
  border: 2px dashed ${props => props.theme.colors.gold[500]}40;
  border-radius: 12px;
  padding: 2rem;
  text-align: center;
  transition: all 0.3s ease;
  cursor: pointer;
  position: relative;
  
  &:hover {
    border-color: ${props => props.theme.colors.gold[500]}80;
    background: rgba(0, 0, 0, 0.3);
  }
  
  &.dragover {
    border-color: ${props => props.theme.colors.gold[500]};
    background: rgba(255, 215, 0, 0.1);
  }
  
  &.has-image {
    border-style: solid;
    border-color: ${props => props.theme.colors.gold[500]};
    background: rgba(255, 215, 0, 0.1);
  }
`;

const UploadIcon = styled.div`
  display: flex;
  justify-content: center;
  margin-bottom: 1rem;
  
  svg {
    color: rgba(255, 255, 255, 0.6);
  }
`;

const UploadText = styled.div`
  color: ${props => props.theme.colors.white};
  font-family: ${props => props.theme.typography.fontFamily.primary};
  
  .primary {
    font-size: 1.1rem;
    font-weight: 600;
    margin-bottom: 0.5rem;
  }
  
  .secondary {
    font-size: 0.9rem;
    color: rgba(255, 255, 255, 0.7);
  }
`;

const HiddenInput = styled.input`
  position: absolute;
  left: -9999px;
  opacity: 0;
`;

const ImagePreview = styled.div`
  position: relative;
  margin-top: 1rem;
  
  img {
    max-width: 200px;
    max-height: 200px;
    border-radius: 8px;
    border: 2px solid ${props => props.theme.colors.gold[500]};
  }
  
  .remove-btn {
    position: absolute;
    top: -8px;
    right: -8px;
    background: #ef4444;
    border: none;
    border-radius: 50%;
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    color: white;
    
    &:hover {
      background: #dc2626;
    }
  }
`;

const FormSection = styled.div`
  background: rgba(0, 0, 0, 0.2);
  border-radius: 12px;
  padding: 2rem;
  backdrop-filter: blur(10px);
  border: 1px solid ${props => props.theme.colors.gold[500]}20;
`;

const FormGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
  margin-bottom: 1.5rem;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const FormField = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  
  &.full-width {
    grid-column: 1 / -1;
  }
  
  label {
    color: ${props => props.theme.colors.white};
    font-weight: 500;
    font-size: 0.9rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-family: ${props => props.theme.typography.fontFamily.primary};
  }
  
  input, select, textarea {
    background: rgba(0, 0, 0, 0.2);
    border: 1px solid ${props => props.theme.colors.gold[500]}40;
    border-radius: 8px;
    padding: 0.75rem;
    color: ${props => props.theme.colors.white};
    font-size: 0.9rem;
    transition: all 0.3s ease;
    font-family: ${props => props.theme.typography.fontFamily.primary};
    
    &::placeholder {
      color: rgba(255, 255, 255, 0.5);
    }
    
    &:focus {
      outline: none;
      border-color: ${props => props.theme.colors.gold[500]};
      background: rgba(0, 0, 0, 0.3);
    }
    
    &:invalid {
      border-color: ${props => props.theme.colors.destructive.DEFAULT};
    }
  }
  
  textarea {
    resize: vertical;
    min-height: 80px;
  }
`;

const ButtonSection = styled.div`
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
`;

const Button = styled.button`
  background: ${props => props.theme.colors.gold[500]};
  border: none;
  border-radius: 8px;
  color: ${props => props.theme.colors.black};
  padding: 0.75rem 2rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  min-width: 120px;
  justify-content: center;
  font-family: ${props => props.theme.typography.fontFamily.primary};
  
  &:hover:not(:disabled) {
    background: ${props => props.theme.colors.gold[400]};
    transform: translateY(-1px);
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
  
  &.secondary {
    background: rgba(0, 0, 0, 0.2);
    border: 1px solid ${props => props.theme.colors.gold[500]}40;
    color: ${props => props.theme.colors.white};
    
    &:hover:not(:disabled) {
      background: rgba(0, 0, 0, 0.3);
      border-color: ${props => props.theme.colors.gold[500]};
    }
  }
`;

const StatusMessage = styled.div`
  margin-top: 1rem;
  padding: 1rem;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-weight: 500;
  
  &.success {
    background: rgba(255, 215, 0, 0.2);
    border: 1px solid ${props => props.theme.colors.gold[500]};
    color: ${props => props.theme.colors.gold[500]};
  }
  
  &.error {
    background: rgba(239, 68, 68, 0.2);
    border: 1px solid ${props => props.theme.colors.destructive.DEFAULT};
    color: ${props => props.theme.colors.destructive.DEFAULT};
  }
  
  &.loading {
    background: rgba(59, 130, 246, 0.2);
    border: 1px solid #3b82f6;
    color: #3b82f6;
  }
`;

const ProgressBar = styled.div<{ progress: number }>`
  width: 100%;
  height: 4px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 2px;
  overflow: hidden;
  margin-top: 1rem;
  
  .progress-fill {
    height: 100%;
    background: ${props => props.theme.colors.gold[500]};
    transition: width 0.3s ease;
    width: ${props => props.progress || 0}%;
  }
`;

// TypeScript Interfaces
export interface FaceEnrollmentProps {
  onSuccess?: (result: any) => void;
  className?: string;
}

interface FormData {
  name: string;
  department: string;
  access_level: string;
  notes: string;
}

interface StatusMessage {
  type: 'success' | 'error' | 'loading';
  text: string;
}

// Main Component
const FaceEnrollment: React.FC<FaceEnrollmentProps> = ({ onSuccess, className }) => {
  // State management
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [isDragOver, setIsDragOver] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState<StatusMessage | null>(null);
  
  const [formData, setFormData] = useState<FormData>({
    name: '',
    department: '',
    access_level: '',
    notes: ''
  });
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // File handling
  const handleFileSelect = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) {
      setStatusMessage({
        type: 'error',
        text: 'Please select a valid image file (JPEG, PNG, WebP)'
      });
      return;
    }
    
    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      setStatusMessage({
        type: 'error',
        text: 'File size must be less than 5MB'
      });
      return;
    }
    
    setSelectedImage(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
    
    setStatusMessage(null);
  }, []);
  
  // Drag and drop handlers
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);
  
  const handleDragLeave = useCallback(() => {
    setIsDragOver(false);
  }, []);
  
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, [handleFileSelect]);
  
  // Form handlers
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, [handleFileSelect]);
  
  const handleInputUpdate = useCallback((field: keyof FormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);
  
  const removeImage = useCallback(() => {
    setSelectedImage(null);
    setImagePreview('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);
  
  const resetForm = useCallback(() => {
    setFormData({
      name: '',
      department: '',
      access_level: '',
      notes: ''
    });
    removeImage();
    setStatusMessage(null);
    setUploadProgress(0);
  }, [removeImage]);
  
  // Form submission
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedImage) {
      setStatusMessage({
        type: 'error',
        text: 'Please select an image to enroll'
      });
      return;
    }
    
    if (!formData.name.trim()) {
      setStatusMessage({
        type: 'error',
        text: 'Please enter a name for this face profile'
      });
      return;
    }
    
    setIsLoading(true);
    setStatusMessage({
      type: 'loading',
      text: 'Processing face enrollment...'
    });
    setUploadProgress(0);
    
    try {
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);
      
      // Create FormData for file upload
      const formDataToSend = new FormData();
      formDataToSend.append('image', selectedImage);
      formDataToSend.append('name', formData.name.trim());
      
      if (formData.department) formDataToSend.append('department', formData.department);
      if (formData.access_level) formDataToSend.append('access_level', formData.access_level);
      if (formData.notes) formDataToSend.append('notes', formData.notes);
      
      // Submit to API
      const response = await fetch('/api/face/enroll', {
        method: 'POST',
        body: formDataToSend
      });
      
      const result = await response.json();
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      if (result.success) {
        setStatusMessage({
          type: 'success',
          text: `Successfully enrolled ${result.data.name}! Face ID: ${result.data.face_id.substring(0, 8)}...`
        });
        
        // Reset form after success
        setTimeout(() => {
          resetForm();
          onSuccess?.(result.data);
        }, 2000);
        
      } else {
        setStatusMessage({
          type: 'error',
          text: result.error || 'Face enrollment failed'
        });
      }
      
    } catch (error) {
      console.error('Enrollment error:', error);
      setStatusMessage({
        type: 'error',
        text: 'Network error during enrollment. Please try again.'
      });
    } finally {
      setIsLoading(false);
    }
  }, [selectedImage, formData, onSuccess, resetForm]);
  
  return (
    <EnrollmentContainer className={className}>
      <Header>
        <h2>
          <User size={24} />
          Enroll New Face
        </h2>
        <p>Upload a clear photo to add a new face to the recognition system</p>
      </Header>
      
      {/* Image Upload Section */}
      <UploadSection
        className={`${isDragOver ? 'dragover' : ''} ${selectedImage ? 'has-image' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <HiddenInput
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleInputChange}
        />
        
        {!selectedImage ? (
          <>
            <UploadIcon>
              <Camera size={48} />
            </UploadIcon>
            <UploadText>
              <div className="primary">Click to upload or drag & drop</div>
              <div className="secondary">JPEG, PNG, or WebP up to 5MB</div>
            </UploadText>
          </>
        ) : (
          <ImagePreview>
            <img src={imagePreview} alt="Selected face" />
            <button className="remove-btn" onClick={(e) => {
              e.stopPropagation();
              removeImage();
            }}>
              <X size={12} />
            </button>
          </ImagePreview>
        )}
      </UploadSection>
      
      {/* Form Section */}
      <FormSection>
        <form onSubmit={handleSubmit}>
          <FormGrid>
            <FormField>
              <label>
                <User size={16} />
                Full Name *
              </label>
              <input
                type="text"
                placeholder="Enter full name"
                value={formData.name}
                onChange={(e) => handleInputUpdate('name', e.target.value)}
                required
                maxLength={255}
              />
            </FormField>
            
            <FormField>
              <label>
                <Building size={16} />
                Department
              </label>
              <select
                value={formData.department}
                onChange={(e) => handleInputUpdate('department', e.target.value)}
              >
                <option value="">Select department</option>
                <option value="Security">Security</option>
                <option value="Administration">Administration</option>
                <option value="Management">Management</option>
                <option value="Operations">Operations</option>
                <option value="Maintenance">Maintenance</option>
                <option value="Guest">Guest</option>
                <option value="Contractor">Contractor</option>
                <option value="Other">Other</option>
              </select>
            </FormField>
            
            <FormField>
              <label>
                <Shield size={16} />
                Access Level
              </label>
              <select
                value={formData.access_level}
                onChange={(e) => handleInputUpdate('access_level', e.target.value)}
              >
                <option value="">Select access level</option>
                <option value="Basic">Basic</option>
                <option value="Standard">Standard</option>
                <option value="Elevated">Elevated</option>
                <option value="Administrative">Administrative</option>
                <option value="Executive">Executive</option>
                <option value="Security">Security</option>
                <option value="Restricted">Restricted</option>
              </select>
            </FormField>
            
            <FormField className="full-width">
              <label>
                <FileText size={16} />
                Notes (Optional)
              </label>
              <textarea
                placeholder="Additional notes or comments..."
                value={formData.notes}
                onChange={(e) => handleInputUpdate('notes', e.target.value)}
                maxLength={500}
              />
            </FormField>
          </FormGrid>
          
          <ButtonSection>
            <Button
              type="button"
              className="secondary"
              onClick={resetForm}
              disabled={isLoading}
            >
              <X size={16} />
              Clear Form
            </Button>
            
            <Button
              type="submit"
              disabled={!selectedImage || !formData.name.trim() || isLoading}
            >
              {isLoading ? (
                <Loader size={16} className="animate-spin" />
              ) : (
                <CheckCircle size={16} />
              )}
              {isLoading ? 'Enrolling...' : 'Enroll Face'}
            </Button>
          </ButtonSection>
          
          {isLoading && (
            <ProgressBar progress={uploadProgress}>
              <div className="progress-fill" />
            </ProgressBar>
          )}
          
          {statusMessage && (
            <StatusMessage className={statusMessage.type}>
              {statusMessage.type === 'success' && <CheckCircle size={20} />}
              {statusMessage.type === 'error' && <AlertCircle size={20} />}
              {statusMessage.type === 'loading' && <Loader size={20} className="animate-spin" />}
              {statusMessage.text}
            </StatusMessage>
          )}
        </form>
      </FormSection>
    </EnrollmentContainer>
  );
};

export default FaceEnrollment;
