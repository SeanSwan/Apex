/**
 * SOP EDITOR - MASTER PROMPT v52.0
 * =================================
 * Standard Operating Procedures management interface
 * Enhanced with error boundaries, loading states, and accessibility
 * 
 * Features:
 * - Create and edit SOPs for different incident types
 * - Property-specific SOP management
 * - Step-by-step procedure builder
 * - Contact list integration
 * - Approval workflow management
 * - Version control and history
 * - Real-time validation
 * - Full accessibility compliance
 * - Error boundary integration
 * - Loading skeleton states
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  FileText, Plus, Save, Edit3, Trash2, Eye, Clock, 
  AlertTriangle, CheckCircle, Users, Phone, Mail,
  ArrowUp, ArrowDown, X, Copy, RotateCcw, Search
} from 'lucide-react';
import ErrorBoundary from '../UnifiedDispatchConsole/ErrorBoundary';
import { SOPEditorSkeleton, LoadingSpinner } from '../UnifiedDispatchConsole/LoadingSkeletons';

interface SOP {
  id: string;
  name: string;
  incident_type: string;
  property_id?: string;
  description: string;
  steps: SOPStep[];
  contacts: SOPContact[];
  escalation_rules: EscalationRule[];
  created_at: string;
  updated_at: string;
  created_by: string;
  version: number;
  status: 'draft' | 'active' | 'archived';
  approval_status: 'pending' | 'approved' | 'rejected';
}

interface SOPStep {
  id: string;
  order: number;
  title: string;
  description: string;
  action_type: 'notification' | 'escalation' | 'documentation' | 'wait' | 'automated';
  timing_delay?: number;
  required: boolean;
  conditions?: string[];
}

interface SOPContact {
  id: string;
  name: string;
  role: string;
  phone?: string;
  email?: string;
  priority: number;
  notification_methods: ('sms' | 'email' | 'call' | 'push')[];
}

interface EscalationRule {
  id: string;
  trigger_condition: string;
  delay_minutes: number;
  escalate_to: string[];
  notification_message: string;
}

interface Property {
  id: string;
  name: string;
  address: string;
}

interface SOPEditorProps {
  className?: string;
  sopId?: string;
  propertyId?: string;
  onSave?: (sop: SOP) => void;
  onCancel?: () => void;
  readOnly?: boolean;
  accessibilityMode?: boolean;
}

const SOPEditor: React.FC<SOPEditorProps> = ({
  className = '',
  sopId,
  propertyId,
  onSave,
  onCancel,
  readOnly = false,
  accessibilityMode = false
}) => {
  const [sop, setSOP] = useState<SOP | null>(null);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'basic' | 'steps' | 'contacts' | 'escalation'>('basic');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const incidentTypes = [
    'noise_complaint',
    'lockout',
    'package_theft',
    'vandalism',
    'trespassing',
    'domestic_disturbance',
    'fire_alarm',
    'medical_emergency',
    'suspicious_activity',
    'maintenance_request',
    'general_inquiry'
  ];

  // Accessibility announcements
  const announceToScreenReader = useCallback((message: string) => {
    if (!accessibilityMode) return;
    
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', 'polite');
    announcement.setAttribute('aria-atomic', 'true');
    announcement.style.position = 'absolute';
    announcement.style.left = '-10000px';
    announcement.textContent = message;
    
    document.body.appendChild(announcement);
    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
  }, [accessibilityMode]);

  // Initialize SOP and load properties
  useEffect(() => {
    initializeEditor();
  }, [sopId, propertyId]);

  // Track unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  const initializeEditor = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load properties
      const propertiesResponse = await fetch('/api/properties');
      if (propertiesResponse.ok) {
        const propertiesData = await propertiesResponse.json();
        setProperties(propertiesData.properties || []);
      }

      if (sopId) {
        // Load existing SOP
        const sopResponse = await fetch(`/api/voice/sops/${sopId}`);
        if (!sopResponse.ok) {
          throw new Error('Failed to load SOP');
        }
        const sopData = await sopResponse.json();
        setSOP(sopData.sop);
        announceToScreenReader(`Loaded SOP: ${sopData.sop.name}`);
      } else {
        // Create new SOP
        const newSOP: SOP = {
          id: '',
          name: '',
          incident_type: 'general_inquiry',
          property_id: propertyId,
          description: '',
          steps: [],
          contacts: [],
          escalation_rules: [],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          created_by: 'current_user',
          version: 1,
          status: 'draft',
          approval_status: 'pending'
        };
        setSOP(newSOP);
        announceToScreenReader('Created new SOP draft');
      }
    } catch (err) {
      console.error('Failed to initialize SOP editor:', err);
      setError(err instanceof Error ? err.message : 'Failed to load SOP editor');
      announceToScreenReader('Error loading SOP editor');
    } finally {
      setLoading(false);
    }
  };

  const validateSOP = useCallback((sopToValidate: SOP): Record<string, string> => {
    const errors: Record<string, string> = {};

    if (!sopToValidate.name.trim()) {
      errors.name = 'SOP name is required';
    }

    if (!sopToValidate.description.trim()) {
      errors.description = 'Description is required';
    }

    if (sopToValidate.steps.length === 0) {
      errors.steps = 'At least one step is required';
    }

    // Validate steps
    sopToValidate.steps.forEach((step, index) => {
      if (!step.title.trim()) {
        errors[`step_${index}_title`] = `Step ${index + 1} title is required`;
      }
      if (!step.description.trim()) {
        errors[`step_${index}_description`] = `Step ${index + 1} description is required`;
      }
    });

    // Validate contacts
    sopToValidate.contacts.forEach((contact, index) => {
      if (!contact.name.trim()) {
        errors[`contact_${index}_name`] = `Contact ${index + 1} name is required`;
      }
      if (contact.notification_methods.length === 0) {
        errors[`contact_${index}_methods`] = `Contact ${index + 1} must have at least one notification method`;
      }
    });

    return errors;
  }, []);

  const handleSave = async () => {
    if (!sop) return;

    try {
      setSaving(true);
      setError(null);

      // Validate SOP
      const errors = validateSOP(sop);
      setValidationErrors(errors);

      if (Object.keys(errors).length > 0) {
        announceToScreenReader('Please fix validation errors before saving');
        return;
      }

      const url = sopId ? `/api/voice/sops/${sopId}` : '/api/voice/sops';
      const method = sopId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ sop })
      });

      if (!response.ok) {
        throw new Error('Failed to save SOP');
      }

      const savedSOP = await response.json();
      setSOP(savedSOP.sop);
      setHasUnsavedChanges(false);
      announceToScreenReader('SOP saved successfully');

      if (onSave) {
        onSave(savedSOP.sop);
      }
    } catch (err) {
      console.error('Failed to save SOP:', err);
      setError(err instanceof Error ? err.message : 'Failed to save SOP');
      announceToScreenReader('Error saving SOP');
    } finally {
      setSaving(false);
    }
  };

  const updateSOP = useCallback((updates: Partial<SOP>) => {
    if (readOnly) return;
    
    setSOP(prev => prev ? { ...prev, ...updates } : null);
    setHasUnsavedChanges(true);
  }, [readOnly]);

  const addStep = () => {
    if (!sop || readOnly) return;

    const newStep: SOPStep = {
      id: `step_${Date.now()}`,
      order: sop.steps.length + 1,
      title: '',
      description: '',
      action_type: 'notification',
      required: true,
      conditions: []
    };

    updateSOP({
      steps: [...sop.steps, newStep]
    });

    announceToScreenReader('New step added');
  };

  const updateStep = (stepId: string, updates: Partial<SOPStep>) => {
    if (!sop || readOnly) return;

    const updatedSteps = sop.steps.map(step =>
      step.id === stepId ? { ...step, ...updates } : step
    );

    updateSOP({ steps: updatedSteps });
  };

  const removeStep = (stepId: string) => {
    if (!sop || readOnly) return;

    const updatedSteps = sop.steps
      .filter(step => step.id !== stepId)
      .map((step, index) => ({ ...step, order: index + 1 }));

    updateSOP({ steps: updatedSteps });
    announceToScreenReader('Step removed');
  };

  const moveStep = (stepId: string, direction: 'up' | 'down') => {
    if (!sop || readOnly) return;

    const currentIndex = sop.steps.findIndex(step => step.id === stepId);
    if (currentIndex === -1) return;

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= sop.steps.length) return;

    const updatedSteps = [...sop.steps];
    [updatedSteps[currentIndex], updatedSteps[newIndex]] = 
    [updatedSteps[newIndex], updatedSteps[currentIndex]];

    // Update order numbers
    updatedSteps.forEach((step, index) => {
      step.order = index + 1;
    });

    updateSOP({ steps: updatedSteps });
    announceToScreenReader(`Step moved ${direction}`);
  };

  const addContact = () => {
    if (!sop || readOnly) return;

    const newContact: SOPContact = {
      id: `contact_${Date.now()}`,
      name: '',
      role: '',
      priority: sop.contacts.length + 1,
      notification_methods: ['email']
    };

    updateSOP({
      contacts: [...sop.contacts, newContact]
    });

    announceToScreenReader('New contact added');
  };

  const updateContact = (contactId: string, updates: Partial<SOPContact>) => {
    if (!sop || readOnly) return;

    const updatedContacts = sop.contacts.map(contact =>
      contact.id === contactId ? { ...contact, ...updates } : contact
    );

    updateSOP({ contacts: updatedContacts });
  };

  const removeContact = (contactId: string) => {
    if (!sop || readOnly) return;

    const updatedContacts = sop.contacts
      .filter(contact => contact.id !== contactId)
      .map((contact, index) => ({ ...contact, priority: index + 1 }));

    updateSOP({ contacts: updatedContacts });
    announceToScreenReader('Contact removed');
  };

  // Memoized filtered content
  const filteredSteps = useMemo(() => {
    if (!searchTerm || !sop) return sop?.steps || [];
    return sop.steps.filter(step =>
      step.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      step.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [sop?.steps, searchTerm]);

  const getIncidentTypeDisplayName = (type: string) => {
    return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  // Loading state
  if (loading) {
    return <SOPEditorSkeleton className={className} />;
  }

  if (!sop) {
    return (
      <div className={`bg-gray-900 rounded-lg border border-red-700 p-6 ${className}`}>
        <div className="text-center text-red-400">
          <AlertTriangle className="w-8 h-8 mx-auto mb-2" />
          <p>Failed to load SOP</p>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary
      componentName="SOPEditor"
      errorCategory="component"
      className={className}
    >
      <div className={`bg-gray-900 rounded-lg border border-gray-700 ${className}`} role="main" aria-label="SOP Editor">
        {/* Header */}
        <div className="border-b border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <FileText className="w-6 h-6 text-blue-400" aria-hidden="true" />
              <div>
                <h1 className="text-xl font-semibold text-white">
                  {sopId ? 'Edit SOP' : 'Create New SOP'}
                </h1>
                {sop.name && (
                  <p className="text-sm text-gray-400">{sop.name}</p>
                )}
              </div>
              {hasUnsavedChanges && (
                <div className="flex items-center space-x-1 text-yellow-400" role="status" aria-label="Unsaved changes">
                  <Clock className="w-4 h-4" aria-hidden="true" />
                  <span className="text-sm">Unsaved changes</span>
                </div>
              )}
            </div>
            
            <div className="flex space-x-2" role="group" aria-label="SOP actions">
              {onCancel && (
                <button
                  onClick={onCancel}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-700 focus:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 text-white rounded-lg transition-colors"
                  aria-label="Cancel editing"
                >
                  Cancel
                </button>
              )}
              
              {!readOnly && (
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 focus:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg flex items-center space-x-2 transition-colors"
                  aria-label="Save SOP"
                >
                  <Save className={`w-4 h-4 ${saving ? 'animate-pulse' : ''}`} aria-hidden="true" />
                  <span>{saving ? 'Saving...' : 'Save'}</span>
                </button>
              )}
            </div>
          </div>
          
          {/* Tab Navigation */}
          <div className="mt-4" role="tablist" aria-label="SOP editor sections">
            <div className="flex space-x-1 bg-gray-800 rounded-lg p-1">
              {[
                { id: 'basic', label: 'Basic Info', icon: FileText },
                { id: 'steps', label: 'Steps', icon: Edit3 },
                { id: 'contacts', label: 'Contacts', icon: Users },
                { id: 'escalation', label: 'Escalation', icon: AlertTriangle }
              ].map(tab => (
                <button
                  key={tab.id}
                  role="tab"
                  aria-selected={activeTab === tab.id}
                  aria-controls={`${tab.id}-panel`}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex-1 flex items-center justify-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    activeTab === tab.id
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-400 hover:text-white hover:bg-gray-700'
                  }`}
                >
                  <tab.icon className="w-4 h-4" aria-hidden="true" />
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          {/* Basic Info Tab */}
          {activeTab === 'basic' && (
            <div role="tabpanel" id="basic-panel" aria-labelledby="basic-tab">
              <div className="space-y-4">
                <div>
                  <label htmlFor="sop-name" className="block text-sm font-medium text-gray-300 mb-2">
                    SOP Name *
                  </label>
                  <input
                    id="sop-name"
                    type="text"
                    value={sop.name}
                    onChange={(e) => updateSOP({ name: e.target.value })}
                    disabled={readOnly}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                    placeholder="Enter SOP name"
                    aria-describedby={validationErrors.name ? 'sop-name-error' : undefined}
                    aria-invalid={!!validationErrors.name}
                  />
                  {validationErrors.name && (
                    <p id="sop-name-error" className="mt-1 text-sm text-red-400" role="alert">
                      {validationErrors.name}
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="incident-type" className="block text-sm font-medium text-gray-300 mb-2">
                    Incident Type
                  </label>
                  <select
                    id="incident-type"
                    value={sop.incident_type}
                    onChange={(e) => updateSOP({ incident_type: e.target.value })}
                    disabled={readOnly}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {incidentTypes.map(type => (
                      <option key={type} value={type}>
                        {getIncidentTypeDisplayName(type)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="property" className="block text-sm font-medium text-gray-300 mb-2">
                    Property (Optional)
                  </label>
                  <select
                    id="property"
                    value={sop.property_id || ''}
                    onChange={(e) => updateSOP({ property_id: e.target.value || undefined })}
                    disabled={readOnly}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="">All Properties</option>
                    {properties.map(property => (
                      <option key={property.id} value={property.id}>
                        {property.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-2">
                    Description *
                  </label>
                  <textarea
                    id="description"
                    value={sop.description}
                    onChange={(e) => updateSOP({ description: e.target.value })}
                    disabled={readOnly}
                    rows={4}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                    placeholder="Describe when and how this SOP should be used..."
                    aria-describedby={validationErrors.description ? 'description-error' : undefined}
                    aria-invalid={!!validationErrors.description}
                  />
                  {validationErrors.description && (
                    <p id="description-error" className="mt-1 text-sm text-red-400" role="alert">
                      {validationErrors.description}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="status" className="block text-sm font-medium text-gray-300 mb-2">
                      Status
                    </label>
                    <select
                      id="status"
                      value={sop.status}
                      onChange={(e) => updateSOP({ status: e.target.value as any })}
                      disabled={readOnly}
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <option value="draft">Draft</option>
                      <option value="active">Active</option>
                      <option value="archived">Archived</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Version
                    </label>
                    <div className="px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-gray-400">
                      v{sop.version}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Steps Tab */}
          {activeTab === 'steps' && (
            <div role="tabpanel" id="steps-panel" aria-labelledby="steps-tab">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-medium text-white">Procedure Steps</h2>
                  {!readOnly && (
                    <button
                      onClick={addStep}
                      className="flex items-center space-x-2 px-3 py-2 bg-green-600 hover:bg-green-700 focus:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 text-white rounded-lg transition-colors"
                      aria-label="Add new step"
                    >
                      <Plus className="w-4 h-4" aria-hidden="true" />
                      <span>Add Step</span>
                    </button>
                  )}
                </div>

                {validationErrors.steps && (
                  <p className="text-sm text-red-400" role="alert">
                    {validationErrors.steps}
                  </p>
                )}

                {/* Search */}
                {sop.steps.length > 3 && (
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" aria-hidden="true" />
                    <input
                      type="text"
                      placeholder="Search steps..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      aria-label="Search steps"
                    />
                  </div>
                )}

                {/* Steps List */}
                <div className="space-y-3">
                  {filteredSteps.length === 0 ? (
                    <div className="text-center py-8 text-gray-500" role="status">
                      <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" aria-hidden="true" />
                      <p>{searchTerm ? 'No steps found' : 'No steps added yet'}</p>
                    </div>
                  ) : (
                    filteredSteps.map((step, index) => (
                      <div
                        key={step.id}
                        className="p-4 bg-gray-800 rounded-lg border border-gray-700"
                        role="article"
                        aria-label={`Step ${step.order}: ${step.title || 'Untitled'}`}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center space-x-2">
                            <span className="flex items-center justify-center w-6 h-6 bg-blue-600 text-white text-sm font-medium rounded-full">
                              {step.order}
                            </span>
                            <input
                              type="text"
                              value={step.title}
                              onChange={(e) => updateStep(step.id, { title: e.target.value })}
                              disabled={readOnly}
                              placeholder="Step title"
                              className="flex-1 px-2 py-1 bg-transparent border-none text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500 rounded disabled:opacity-50"
                              aria-label={`Step ${step.order} title`}
                            />
                          </div>
                          
                          {!readOnly && (
                            <div className="flex items-center space-x-1" role="group" aria-label="Step actions">
                              <button
                                onClick={() => moveStep(step.id, 'up')}
                                disabled={index === 0}
                                className="p-1 text-gray-400 hover:text-white focus:text-white focus:outline-none focus:ring-1 focus:ring-blue-500 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                                aria-label="Move step up"
                              >
                                <ArrowUp className="w-4 h-4" aria-hidden="true" />
                              </button>
                              <button
                                onClick={() => moveStep(step.id, 'down')}
                                disabled={index === filteredSteps.length - 1}
                                className="p-1 text-gray-400 hover:text-white focus:text-white focus:outline-none focus:ring-1 focus:ring-blue-500 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                                aria-label="Move step down"
                              >
                                <ArrowDown className="w-4 h-4" aria-hidden="true" />
                              </button>
                              <button
                                onClick={() => removeStep(step.id)}
                                className="p-1 text-red-400 hover:text-red-300 focus:text-red-300 focus:outline-none focus:ring-1 focus:ring-red-500 rounded"
                                aria-label="Remove step"
                              >
                                <Trash2 className="w-4 h-4" aria-hidden="true" />
                              </button>
                            </div>
                          )}
                        </div>

                        <textarea
                          value={step.description}
                          onChange={(e) => updateStep(step.id, { description: e.target.value })}
                          disabled={readOnly}
                          placeholder="Describe what should be done in this step..."
                          rows={3}
                          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                          aria-label={`Step ${step.order} description`}
                        />

                        <div className="mt-3 grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs text-gray-400 mb-1">
                              Action Type
                            </label>
                            <select
                              value={step.action_type}
                              onChange={(e) => updateStep(step.id, { action_type: e.target.value as any })}
                              disabled={readOnly}
                              className="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
                            >
                              <option value="notification">Notification</option>
                              <option value="escalation">Escalation</option>
                              <option value="documentation">Documentation</option>
                              <option value="wait">Wait</option>
                              <option value="automated">Automated</option>
                            </select>
                          </div>

                          <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id={`required-${step.id}`}
                              checked={step.required}
                              onChange={(e) => updateStep(step.id, { required: e.target.checked })}
                              disabled={readOnly}
                              className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500 focus:ring-2 disabled:opacity-50"
                            />
                            <label htmlFor={`required-${step.id}`} className="text-sm text-gray-300">
                              Required step
                            </label>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Contacts Tab */}
          {activeTab === 'contacts' && (
            <div role="tabpanel" id="contacts-panel" aria-labelledby="contacts-tab">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-medium text-white">Contact List</h2>
                  {!readOnly && (
                    <button
                      onClick={addContact}
                      className="flex items-center space-x-2 px-3 py-2 bg-green-600 hover:bg-green-700 focus:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 text-white rounded-lg transition-colors"
                      aria-label="Add new contact"
                    >
                      <Plus className="w-4 h-4" aria-hidden="true" />
                      <span>Add Contact</span>
                    </button>
                  )}
                </div>

                <div className="space-y-3">
                  {sop.contacts.length === 0 ? (
                    <div className="text-center py-8 text-gray-500" role="status">
                      <Users className="w-8 h-8 mx-auto mb-2 opacity-50" aria-hidden="true" />
                      <p>No contacts added yet</p>
                    </div>
                  ) : (
                    sop.contacts.map((contact, index) => (
                      <div
                        key={contact.id}
                        className="p-4 bg-gray-800 rounded-lg border border-gray-700"
                        role="article"
                        aria-label={`Contact ${contact.priority}: ${contact.name || 'Unnamed'}`}
                      >
                        <div className="grid grid-cols-2 gap-3 mb-3">
                          <div>
                            <label className="block text-xs text-gray-400 mb-1">
                              Name *
                            </label>
                            <input
                              type="text"
                              value={contact.name}
                              onChange={(e) => updateContact(contact.id, { name: e.target.value })}
                              disabled={readOnly}
                              placeholder="Contact name"
                              className="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
                            />
                          </div>

                          <div>
                            <label className="block text-xs text-gray-400 mb-1">
                              Role
                            </label>
                            <input
                              type="text"
                              value={contact.role}
                              onChange={(e) => updateContact(contact.id, { role: e.target.value })}
                              disabled={readOnly}
                              placeholder="Job title or role"
                              className="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 mb-3">
                          <div>
                            <label className="block text-xs text-gray-400 mb-1">
                              Phone
                            </label>
                            <input
                              type="tel"
                              value={contact.phone || ''}
                              onChange={(e) => updateContact(contact.id, { phone: e.target.value })}
                              disabled={readOnly}
                              placeholder="+1 (555) 123-4567"
                              className="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
                            />
                          </div>

                          <div>
                            <label className="block text-xs text-gray-400 mb-1">
                              Email
                            </label>
                            <input
                              type="email"
                              value={contact.email || ''}
                              onChange={(e) => updateContact(contact.id, { email: e.target.value })}
                              disabled={readOnly}
                              placeholder="contact@example.com"
                              className="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
                            />
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <div>
                            <label className="block text-xs text-gray-400 mb-1">
                              Notification Methods
                            </label>
                            <div className="flex items-center space-x-3">
                              {['sms', 'email', 'call', 'push'].map(method => (
                                <label key={method} className="flex items-center space-x-1">
                                  <input
                                    type="checkbox"
                                    checked={contact.notification_methods.includes(method as any)}
                                    onChange={(e) => {
                                      const methods = e.target.checked
                                        ? [...contact.notification_methods, method as any]
                                        : contact.notification_methods.filter(m => m !== method);
                                      updateContact(contact.id, { notification_methods: methods });
                                    }}
                                    disabled={readOnly}
                                    className="w-3 h-3 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500 focus:ring-1 disabled:opacity-50"
                                  />
                                  <span className="text-xs text-gray-300 capitalize">{method}</span>
                                </label>
                              ))}
                            </div>
                          </div>

                          {!readOnly && (
                            <button
                              onClick={() => removeContact(contact.id)}
                              className="p-1 text-red-400 hover:text-red-300 focus:text-red-300 focus:outline-none focus:ring-1 focus:ring-red-500 rounded"
                              aria-label="Remove contact"
                            >
                              <Trash2 className="w-4 h-4" aria-hidden="true" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Escalation Tab */}
          {activeTab === 'escalation' && (
            <div role="tabpanel" id="escalation-panel" aria-labelledby="escalation-tab">
              <div className="space-y-4">
                <h2 className="text-lg font-medium text-white">Escalation Rules</h2>
                
                <div className="text-center py-8 text-gray-500" role="status">
                  <AlertTriangle className="w-8 h-8 mx-auto mb-2 opacity-50" aria-hidden="true" />
                  <p>Escalation rules configuration coming soon</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <div className="mx-4 mb-4 p-3 bg-red-900/20 border border-red-700 rounded-lg" role="alert">
            <div className="flex items-center space-x-2 text-red-400">
              <AlertTriangle className="w-4 h-4" aria-hidden="true" />
              <span className="font-medium">Error</span>
            </div>
            <p className="text-red-300 text-sm mt-1">{error}</p>
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
};

export default SOPEditor;
