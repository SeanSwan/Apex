// apex_ai_desktop_app/src/components/ContactManagement/ContactListManager.jsx
/**
 * APEX AI CONTACT LIST MANAGER COMPONENT
 * ======================================
 * Professional interface for managing notification contact lists
 * Used by Voice AI Dispatcher for automated alert notifications
 */

import React, { useState, useEffect } from 'react';
import './ContactListManager.css';

const ContactListManager = ({ userRole, userId, onClose, contactListData = null, isEditing = false }) => {
  // Form state for contact list data
  const [formData, setFormData] = useState({
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

  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [currentContact, setCurrentContact] = useState({
    name: '',
    phone: '',
    email: '',
    role: '',
    priority: 1,
    department: '',
    isEmergencyContact: false
  });
  const [editingContactIndex, setEditingContactIndex] = useState(-1);
  const [testingNotifications, setTestingNotifications] = useState(false);

  // Contact list types based on Master Prompt
  const listTypes = [
    { value: 'primary', label: 'Primary', description: 'Main contact list for regular incidents' },
    { value: 'emergency', label: 'Emergency', description: 'Emergency services and critical contacts' },
    { value: 'management', label: 'Management', description: 'Property management team' },
    { value: 'maintenance', label: 'Maintenance', description: 'Maintenance and facilities team' },
    { value: 'security', label: 'Security', description: 'Security personnel and guards' },
    { value: 'custom', label: 'Custom', description: 'Custom contact list' }
  ];

  const notificationMethodOptions = [
    { value: 'sms', label: 'SMS', icon: '📱' },
    { value: 'email', label: 'Email', icon: '📧' },
    { value: 'call', label: 'Phone Call', icon: '📞' },
    { value: 'push', label: 'Push Notification', icon: '🔔' }
  ];

  const incidentTypes = [
    'noise_complaint', 'lockout', 'maintenance_emergency', 'security_breach',
    'medical_emergency', 'fire_alarm', 'suspicious_activity', 'package_theft',
    'vandalism', 'domestic_disturbance', 'utility_outage', 'elevator_emergency',
    'parking_violation', 'unauthorized_access', 'general_inquiry', 'other'
  ];

  const timezones = [
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

  const handleContactInputChange = (field, value) => {
    setCurrentContact(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleNotificationMethodToggle = (method) => {
    setFormData(prev => ({
      ...prev,
      notificationMethods: prev.notificationMethods.includes(method)
        ? prev.notificationMethods.filter(m => m !== method)
        : [...prev.notificationMethods, method]
    }));
  };

  const addContact = () => {
    const contactErrors = {};
    
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

    const newContact = {
      ...currentContact,
      id: editingContactIndex >= 0 ? formData.contacts[editingContactIndex].id : Date.now(),
      priority: parseInt(currentContact.priority) || 1
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
  };

  const editContact = (index) => {
    setCurrentContact(formData.contacts[index]);
    setEditingContactIndex(index);
  };

  const removeContact = (index) => {
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
  };

  const moveContactUp = (index) => {
    if (index > 0) {
      const newContacts = [...formData.contacts];
      [newContacts[index - 1], newContacts[index]] = [newContacts[index], newContacts[index - 1]];
      setFormData(prev => ({ ...prev, contacts: newContacts }));
    }
  };

  const moveContactDown = (index) => {
    if (index < formData.contacts.length - 1) {
      const newContacts = [...formData.contacts];
      [newContacts[index], newContacts[index + 1]] = [newContacts[index + 1], newContacts[index]];
      setFormData(prev => ({ ...prev, contacts: newContacts }));
    }
  };

  const testNotifications = async () => {
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
  };

  const validateForm = () => {
    const newErrors = {};

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
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const url = isEditing 
        ? `/api/internal/v1/contact-lists/${contactListData.id}`
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
        onClose && onClose(true); // true indicates success
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
  };

  // Check if user has permission to edit contact lists
  const canEdit = ['super_admin', 'admin_cto', 'admin_ceo', 'manager'].includes(userRole);

  if (!canEdit) {
    return (
      <div className="contact-manager-container">
        <div className="access-denied">
          <h2>Access Denied</h2>
          <p>You don't have permission to manage contact lists.</p>
          <button onClick={onClose} className="btn-secondary">Close</button>
        </div>
      </div>
    );
  }

  return (
    <div className="contact-manager-container">
      <div className="contact-manager-header">
        <h1>{isEditing ? 'Edit' : 'Create'} Contact List</h1>
        <div className="header-actions">
          <button 
            onClick={testNotifications}
            disabled={testingNotifications || formData.contacts.length === 0}
            className="btn-test"
          >
            {testingNotifications ? 'Testing...' : '🧪 Test Notifications'}
          </button>
          <button 
            onClick={handleSave} 
            disabled={loading}
            className="btn-primary"
          >
            {loading ? 'Saving...' : 'Save Contact List'}
          </button>
          <button onClick={onClose} className="btn-secondary">Cancel</button>
        </div>
      </div>

      <div className="contact-manager-content">
        {/* Basic Information */}
        <div className="form-section">
          <h3>Basic Information</h3>
          
          <div className="form-row">
            <div className="form-group">
              <label>Contact List Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="e.g., Emergency Response Team"
                className={errors.name ? 'error' : ''}
              />
              {errors.name && <span className="error-message">{errors.name}</span>}
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
              <label>List Type</label>
              <select
                value={formData.listType}
                onChange={(e) => handleInputChange('listType', e.target.value)}
              >
                {listTypes.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
              <small>{listTypes.find(t => t.value === formData.listType)?.description}</small>
            </div>
            
            <div className="form-group">
              <label>Priority Order</label>
              <input
                type="number"
                min="1"
                max="10"
                value={formData.priorityOrder}
                onChange={(e) => handleInputChange('priorityOrder', parseInt(e.target.value) || 1)}
              />
              <small>Lower numbers = higher priority (1 = highest)</small>
            </div>
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Describe when this contact list should be used"
              rows={3}
            />
          </div>
        </div>

        {/* Notification Methods */}
        <div className="form-section">
          <h3>Notification Methods</h3>
          
          <div className="notification-methods">
            {notificationMethodOptions.map(method => (
              <label key={method.value} className="method-checkbox">
                <input
                  type="checkbox"
                  checked={formData.notificationMethods.includes(method.value)}
                  onChange={() => handleNotificationMethodToggle(method.value)}
                />
                <span className="method-icon">{method.icon}</span>
                <span className="method-label">{method.label}</span>
              </label>
            ))}
          </div>
          {errors.notificationMethods && <span className="error-message">{errors.notificationMethods}</span>}
        </div>

        {/* Contacts Management */}
        <div className="form-section">
          <h3>Contacts</h3>
          
          {/* Add/Edit Contact Form */}
          <div className="contact-form">
            <div className="contact-form-row">
              <div className="form-group">
                <label>Name *</label>
                <input
                  type="text"
                  value={currentContact.name}
                  onChange={(e) => handleContactInputChange('name', e.target.value)}
                  placeholder="Contact Name"
                  className={errors.name ? 'error' : ''}
                />
              </div>
              
              <div className="form-group">
                <label>Phone</label>
                <input
                  type="tel"
                  value={currentContact.phone}
                  onChange={(e) => handleContactInputChange('phone', e.target.value)}
                  placeholder="+1 (555) 123-4567"
                />
              </div>
              
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  value={currentContact.email}
                  onChange={(e) => handleContactInputChange('email', e.target.value)}
                  placeholder="contact@example.com"
                />
              </div>
            </div>
            
            <div className="contact-form-row">
              <div className="form-group">
                <label>Role/Title</label>
                <input
                  type="text"
                  value={currentContact.role}
                  onChange={(e) => handleContactInputChange('role', e.target.value)}
                  placeholder="Security Manager"
                />
              </div>
              
              <div className="form-group">
                <label>Department</label>
                <input
                  type="text"
                  value={currentContact.department}
                  onChange={(e) => handleContactInputChange('department', e.target.value)}
                  placeholder="Security"
                />
              </div>
              
              <div className="form-group">
                <label>Priority</label>
                <select
                  value={currentContact.priority}
                  onChange={(e) => handleContactInputChange('priority', parseInt(e.target.value))}
                >
                  {[1, 2, 3, 4, 5].map(num => (
                    <option key={num} value={num}>
                      {num} {num === 1 ? '(Highest)' : num === 5 ? '(Lowest)' : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="contact-form-row">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={currentContact.isEmergencyContact}
                  onChange={(e) => handleContactInputChange('isEmergencyContact', e.target.checked)}
                />
                Emergency Contact (available 24/7)
              </label>
              
              <button 
                onClick={addContact}
                className="btn-add-contact"
                type="button"
              >
                {editingContactIndex >= 0 ? 'Update Contact' : 'Add Contact'}
              </button>
              
              {editingContactIndex >= 0 && (
                <button 
                  onClick={() => {
                    setEditingContactIndex(-1);
                    setCurrentContact({
                      name: '', phone: '', email: '', role: '', priority: 1, department: '', isEmergencyContact: false
                    });
                  }}
                  className="btn-cancel"
                  type="button"
                >
                  Cancel Edit
                </button>
              )}
            </div>
            
            {(errors.contact || errors.contacts) && (
              <span className="error-message">
                {errors.contact || errors.contacts}
              </span>
            )}
          </div>

          {/* Contacts List */}
          <div className="contacts-list">
            {formData.contacts.length === 0 ? (
              <div className="empty-contacts">
                <p>No contacts added yet. Add your first contact above.</p>
              </div>
            ) : (
              <div className="contacts-grid">
                {formData.contacts.map((contact, index) => (
                  <div key={contact.id || index} className="contact-card">
                    <div className="contact-info">
                      <div className="contact-name">
                        {contact.name}
                        {contact.isEmergencyContact && (
                          <span className="emergency-badge">24/7</span>
                        )}
                      </div>
                      <div className="contact-details">
                        {contact.role && <div className="contact-role">{contact.role}</div>}
                        {contact.department && <div className="contact-dept">{contact.department}</div>}
                        {contact.phone && <div className="contact-phone">📱 {contact.phone}</div>}
                        {contact.email && <div className="contact-email">📧 {contact.email}</div>}
                      </div>
                      <div className="contact-priority">Priority: {contact.priority}</div>
                    </div>
                    
                    <div className="contact-actions">
                      <button
                        onClick={() => moveContactUp(index)}
                        disabled={index === 0}
                        className="btn-move"
                        title="Move Up"
                      >
                        ↑
                      </button>
                      <button
                        onClick={() => moveContactDown(index)}
                        disabled={index === formData.contacts.length - 1}
                        className="btn-move"
                        title="Move Down"
                      >
                        ↓
                      </button>
                      <button
                        onClick={() => editContact(index)}
                        className="btn-edit-small"
                        title="Edit Contact"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => removeContact(index)}
                        className="btn-remove-small"
                        title="Remove Contact"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Escalation Settings */}
        <div className="form-section">
          <h3>Escalation Settings</h3>
          
          <div className="form-row">
            <div className="form-group">
              <label>Escalation Delay (minutes)</label>
              <input
                type="number"
                min="1"
                max="60"
                value={formData.escalationDelayMinutes}
                onChange={(e) => handleInputChange('escalationDelayMinutes', parseInt(e.target.value) || 5)}
              />
              <small>Time to wait before escalating to next contact</small>
            </div>
            
            <div className="form-group">
              <label>Max Escalation Attempts</label>
              <input
                type="number"
                min="1"
                max="10"
                value={formData.maxEscalationAttempts}
                onChange={(e) => handleInputChange('maxEscalationAttempts', parseInt(e.target.value) || 3)}
              />
              <small>Maximum number of escalation attempts</small>
            </div>
          </div>

          <div className="form-row">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={formData.requireAcknowledgment}
                onChange={(e) => handleInputChange('requireAcknowledgment', e.target.checked)}
              />
              Require Acknowledgment
              <small>Contacts must acknowledge receipt of notifications</small>
            </label>
          </div>
        </div>

        {/* Schedule and Settings */}
        <div className="form-section">
          <h3>Schedule and Settings</h3>
          
          <div className="form-row">
            <div className="form-group">
              <label>Timezone</label>
              <select
                value={formData.timezone}
                onChange={(e) => handleInputChange('timezone', e.target.value)}
              >
                {timezones.map(tz => (
                  <option key={tz} value={tz}>{tz}</option>
                ))}
              </select>
            </div>
            
            <div className="form-group">
              <label>Status</label>
              <select
                value={formData.status}
                onChange={(e) => handleInputChange('status', e.target.value)}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="archived">Archived</option>
              </select>
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
              placeholder="Additional notes about this contact list"
              rows={3}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactListManager;
