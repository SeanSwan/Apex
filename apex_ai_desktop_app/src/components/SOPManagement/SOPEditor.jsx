// apex_ai_desktop_app/src/components/SOPManagement/SOPEditor.jsx
/**
 * APEX AI SOP EDITOR COMPONENT
 * ============================
 * Professional interface for managing Standard Operating Procedures
 * Used by Voice AI Dispatcher for automated incident handling
 */

import React, { useState, useEffect } from 'react';
import './SOPEditor.css';

const SOPEditor = ({ userRole, userId, onClose, sopData = null, isEditing = false }) => {
  // Form state for SOP data
  const [formData, setFormData] = useState({
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

  const [properties, setProperties] = useState([]);
  const [contactLists, setContactLists] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [currentQuestion, setCurrentQuestion] = useState('');

  // Incident types based on Master Prompt
  const incidentTypes = [
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

  const priorityLevels = [
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

  const loadProperties = async () => {
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
  };

  const loadContactLists = async () => {
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
  };

  const handleInputChange = (field, value) => {
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
  };

  const addInformationGatheringQuestion = () => {
    if (currentQuestion.trim()) {
      setFormData(prev => ({
        ...prev,
        informationGatheringQuestions: [
          ...prev.informationGatheringQuestions,
          {
            id: Date.now(),
            question: currentQuestion.trim(),
            required: true,
            type: 'text'
          }
        ]
      }));
      setCurrentQuestion('');
    }
  };

  const removeQuestion = (questionId) => {
    setFormData(prev => ({
      ...prev,
      informationGatheringQuestions: prev.informationGatheringQuestions.filter(q => q.id !== questionId)
    }));
  };

  const addAutomatedAction = (action) => {
    setFormData(prev => ({
      ...prev,
      automatedActions: [
        ...prev.automatedActions,
        {
          id: Date.now(),
          action: action,
          enabled: true,
          delay: 0
        }
      ]
    }));
  };

  const removeAutomatedAction = (actionId) => {
    setFormData(prev => ({
      ...prev,
      automatedActions: prev.automatedActions.filter(a => a.id !== actionId)
    }));
  };

  const validateForm = () => {
    const newErrors = {};

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
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const url = isEditing 
        ? `/api/internal/v1/sops/${sopData.id}`
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
        onClose && onClose(true); // true indicates success
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
  };

  const getPriorityColor = (level) => {
    const priority = priorityLevels.find(p => p.value === level);
    return priority ? priority.color : '#6b7280';
  };

  // Check if user has permission to edit SOPs
  const canEdit = ['super_admin', 'admin_cto', 'admin_ceo', 'manager'].includes(userRole);

  if (!canEdit) {
    return (
      <div className="sop-editor-container">
        <div className="access-denied">
          <h2>Access Denied</h2>
          <p>You don't have permission to manage Standard Operating Procedures.</p>
          <button onClick={onClose} className="btn-secondary">Close</button>
        </div>
      </div>
    );
  }

  return (
    <div className="sop-editor-container">
      <div className="sop-editor-header">
        <h1>{isEditing ? 'Edit' : 'Create'} Standard Operating Procedure</h1>
        <div className="header-actions">
          <button 
            onClick={handleSave} 
            disabled={loading}
            className="btn-primary"
          >
            {loading ? 'Saving...' : 'Save SOP'}
          </button>
          <button onClick={onClose} className="btn-secondary">Cancel</button>
        </div>
      </div>

      <div className="sop-editor-content">
        {/* Basic Information */}
        <div className="form-section">
          <h3>Basic Information</h3>
          
          <div className="form-row">
            <div className="form-group">
              <label>Title *</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder="e.g., Noise Complaint Response Protocol"
                className={errors.title ? 'error' : ''}
              />
              {errors.title && <span className="error-message">{errors.title}</span>}
            </div>
            
            <div className="form-group">
              <label>Property *</label>
              <select
                value={formData.propertyId}
                onChange={(e) => handleInputChange('propertyId', e.target.value)}
                className={errors.propertyId ? 'error' : ''}
              >
                <option value="">Select Property</option>
                {properties.map(property => (
                  <option key={property.id} value={property.id}>
                    {property.name} - {property.address}
                  </option>
                ))}
              </select>
              {errors.propertyId && <span className="error-message">{errors.propertyId}</span>}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Incident Type</label>
              <select
                value={formData.incidentType}
                onChange={(e) => handleInputChange('incidentType', e.target.value)}
              >
                {incidentTypes.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="form-group">
              <label>Priority Level</label>
              <select
                value={formData.priorityLevel}
                onChange={(e) => handleInputChange('priorityLevel', e.target.value)}
                style={{ borderLeft: `4px solid ${getPriorityColor(formData.priorityLevel)}` }}
              >
                {priorityLevels.map(priority => (
                  <option key={priority.value} value={priority.value}>
                    {priority.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Describe when this SOP applies and its purpose"
              rows={3}
            />
          </div>
        </div>

        {/* AI Conversation Configuration */}
        <div className="form-section">
          <h3>AI Conversation Configuration</h3>
          
          <div className="form-group">
            <label>Initial Response Script *</label>
            <textarea
              value={formData.initialResponseScript}
              onChange={(e) => handleInputChange('initialResponseScript', e.target.value)}
              placeholder="Hello, this is APEX AI Security. I understand you're reporting a [incident type]. I'm here to help you with this situation..."
              rows={4}
              className={errors.initialResponseScript ? 'error' : ''}
            />
            {errors.initialResponseScript && <span className="error-message">{errors.initialResponseScript}</span>}
          </div>

          <div className="form-group">
            <label>Information Gathering Questions</label>
            <div className="questions-container">
              {formData.informationGatheringQuestions.map((question, index) => (
                <div key={question.id} className="question-item">
                  <span className="question-number">{index + 1}.</span>
                  <span className="question-text">{question.question}</span>
                  <button 
                    onClick={() => removeQuestion(question.id)}
                    className="btn-remove"
                    type="button"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
            
            <div className="add-question">
              <input
                type="text"
                value={currentQuestion}
                onChange={(e) => setCurrentQuestion(e.target.value)}
                placeholder="What is your location within the building?"
                onKeyPress={(e) => e.key === 'Enter' && addInformationGatheringQuestion()}
              />
              <button 
                onClick={addInformationGatheringQuestion}
                className="btn-add"
                type="button"
              >
                Add Question
              </button>
            </div>
          </div>
        </div>

        {/* Notification Settings */}
        <div className="form-section">
          <h3>Notification Settings</h3>
          
          <div className="form-row">
            <div className="checkbox-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={formData.notifyGuard}
                  onChange={(e) => handleInputChange('notifyGuard', e.target.checked)}
                />
                Notify Guard
              </label>
              
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={formData.notifyManager}
                  onChange={(e) => handleInputChange('notifyManager', e.target.checked)}
                />
                Notify Manager
              </label>
              
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={formData.notifyEmergencyServices}
                  onChange={(e) => handleInputChange('notifyEmergencyServices', e.target.checked)}
                />
                Notify Emergency Services
              </label>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Primary Contact List</label>
              <select
                value={formData.primaryContactListId}
                onChange={(e) => handleInputChange('primaryContactListId', e.target.value)}
              >
                <option value="">Select Contact List</option>
                {contactLists.filter(cl => cl.listType === 'primary' || cl.listType === 'security').map(cl => (
                  <option key={cl.id} value={cl.id}>
                    {cl.name} ({cl.listType})
                  </option>
                ))}
              </select>
            </div>
            
            <div className="form-group">
              <label>Emergency Contact List</label>
              <select
                value={formData.emergencyContactListId}
                onChange={(e) => handleInputChange('emergencyContactListId', e.target.value)}
              >
                <option value="">Select Emergency List</option>
                {contactLists.filter(cl => cl.listType === 'emergency').map(cl => (
                  <option key={cl.id} value={cl.id}>
                    {cl.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Notification Delay (minutes)</label>
              <input
                type="number"
                min="0"
                max="60"
                value={formData.notificationDelayMinutes}
                onChange={(e) => handleInputChange('notificationDelayMinutes', parseInt(e.target.value) || 0)}
              />
            </div>
          </div>
        </div>

        {/* Escalation Rules */}
        <div className="form-section">
          <h3>Escalation Rules</h3>
          
          <div className="form-row">
            <div className="form-group">
              <label>Human Takeover Threshold</label>
              <input
                type="number"
                min="0"
                max="1"
                step="0.05"
                value={formData.humanTakeoverThreshold}
                onChange={(e) => handleInputChange('humanTakeoverThreshold', parseFloat(e.target.value))}
                className={errors.humanTakeoverThreshold ? 'error' : ''}
              />
              <small>AI confidence threshold below which to escalate to human (0.00-1.00)</small>
              {errors.humanTakeoverThreshold && <span className="error-message">{errors.humanTakeoverThreshold}</span>}
            </div>
            
            <div className="form-group">
              <label>Auto-escalate After (minutes)</label>
              <input
                type="number"
                min="1"
                max="120"
                value={formData.autoEscalateAfterMinutes || ''}
                onChange={(e) => handleInputChange('autoEscalateAfterMinutes', parseInt(e.target.value) || null)}
                placeholder="Optional"
              />
              <small>Automatically escalate to human after this many minutes</small>
            </div>
          </div>
        </div>

        {/* Status and Metadata */}
        <div className="form-section">
          <h3>Status and Metadata</h3>
          
          <div className="form-row">
            <div className="form-group">
              <label>Status</label>
              <select
                value={formData.status}
                onChange={(e) => handleInputChange('status', e.target.value)}
              >
                <option value="draft">Draft</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="archived">Archived</option>
              </select>
            </div>
            
            <div className="form-group">
              <label>Version</label>
              <input
                type="text"
                value={formData.version}
                onChange={(e) => handleInputChange('version', e.target.value)}
                placeholder="1.0"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Effective Date</label>
              <input
                type="datetime-local"
                value={formData.effectiveDate}
                onChange={(e) => handleInputChange('effectiveDate', e.target.value)}
              />
            </div>
            
            <div className="form-group">
              <label>Expiration Date</label>
              <input
                type="datetime-local"
                value={formData.expirationDate}
                onChange={(e) => handleInputChange('expirationDate', e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <label>Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder="Additional notes about this SOP"
              rows={3}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default SOPEditor;
