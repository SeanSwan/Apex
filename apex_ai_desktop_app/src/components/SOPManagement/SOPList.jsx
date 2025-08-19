// apex_ai_desktop_app/src/components/SOPManagement/SOPList.jsx
/**
 * APEX AI SOP LIST COMPONENT
 * ==========================
 * Professional list view for managing Standard Operating Procedures
 * Displays all SOPs with filtering, search, and management capabilities
 */

import React, { useState, useEffect } from 'react';
import SOPEditor from './SOPEditor.jsx';
import './SOPList.css';

const SOPList = ({ userRole, userId }) => {
  const [sops, setSops] = useState([]);
  const [filteredSOPs, setFilteredSOPs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterProperty, setFilterProperty] = useState('');
  const [filterIncidentType, setFilterIncidentType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [showEditor, setShowEditor] = useState(false);
  const [editingSOP, setEditingSOP] = useState(null);
  const [properties, setProperties] = useState([]);

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

  const statusOptions = [
    { value: 'draft', label: 'Draft', color: '#6b7280' },
    { value: 'active', label: 'Active', color: '#10b981' },
    { value: 'inactive', label: 'Inactive', color: '#f59e0b' },
    { value: 'archived', label: 'Archived', color: '#ef4444' }
  ];

  const priorityOptions = [
    { value: 'low', label: 'Low', color: '#10b981' },
    { value: 'medium', label: 'Medium', color: '#f59e0b' },
    { value: 'high', label: 'High', color: '#ef4444' },
    { value: 'critical', label: 'Critical', color: '#dc2626' }
  ];

  useEffect(() => {
    loadSOPs();
    loadProperties();
  }, []);

  useEffect(() => {
    filterSOPs();
  }, [sops, searchTerm, filterProperty, filterIncidentType, filterStatus, filterPriority]);

  const loadSOPs = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/internal/v1/sops', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setSops(data.sops || []);
      } else {
        console.error('Failed to load SOPs');
      }
    } catch (error) {
      console.error('Error loading SOPs:', error);
    } finally {
      setLoading(false);
    }
  };

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

  const filterSOPs = () => {
    let filtered = sops;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(sop =>
        sop.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sop.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sop.incidentType.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Property filter
    if (filterProperty) {
      filtered = filtered.filter(sop => sop.propertyId === filterProperty);
    }

    // Incident type filter
    if (filterIncidentType) {
      filtered = filtered.filter(sop => sop.incidentType === filterIncidentType);
    }

    // Status filter
    if (filterStatus) {
      filtered = filtered.filter(sop => sop.status === filterStatus);
    }

    // Priority filter
    if (filterPriority) {
      filtered = filtered.filter(sop => sop.priorityLevel === filterPriority);
    }

    setFilteredSOPs(filtered);
  };

  const handleCreateNew = () => {
    setEditingSOP(null);
    setShowEditor(true);
  };

  const handleEdit = (sop) => {
    setEditingSOP(sop);
    setShowEditor(true);
  };

  const handleEditorClose = (success) => {
    setShowEditor(false);
    setEditingSOP(null);
    
    if (success) {
      loadSOPs(); // Reload the list
    }
  };

  const handleDelete = async (sopId) => {
    if (!window.confirm('Are you sure you want to delete this SOP? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/internal/v1/sops/${sopId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });

      if (response.ok) {
        alert('SOP deleted successfully');
        loadSOPs();
      } else {
        alert('Failed to delete SOP');
      }
    } catch (error) {
      console.error('Error deleting SOP:', error);
      alert('Error deleting SOP');
    }
  };

  const handleDuplicate = async (sop) => {
    const duplicatedSOP = {
      ...sop,
      title: `${sop.title} (Copy)`,
      status: 'draft',
      version: '1.0',
      effectiveDate: '',
      expirationDate: '',
      timesUsed: 0,
      successRate: null,
      lastUsedAt: null
    };

    setEditingSOP(duplicatedSOP);
    setShowEditor(true);
  };

  const getPropertyName = (propertyId) => {
    const property = properties.find(p => p.id === propertyId);
    return property ? property.name : 'Unknown Property';
  };

  const getIncidentTypeLabel = (value) => {
    const type = incidentTypes.find(t => t.value === value);
    return type ? type.label : value;
  };

  const getStatusColor = (status) => {
    const statusOption = statusOptions.find(s => s.value === status);
    return statusOption ? statusOption.color : '#6b7280';
  };

  const getPriorityColor = (priority) => {
    const priorityOption = priorityOptions.find(p => p.value === priority);
    return priorityOption ? priorityOption.color : '#6b7280';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString();
  };

  const canEdit = ['super_admin', 'admin_cto', 'admin_ceo', 'manager'].includes(userRole);

  if (showEditor) {
    return (
      <SOPEditor
        userRole={userRole}
        userId={userId}
        onClose={handleEditorClose}
        sopData={editingSOP}
        isEditing={!!editingSOP}
      />
    );
  }

  return (
    <div className="sop-list-container">
      <div className="sop-list-header">
        <div className="header-info">
          <h1>Standard Operating Procedures</h1>
          <p>Manage AI-driven incident response protocols</p>
        </div>
        
        {canEdit && (
          <button 
            onClick={handleCreateNew}
            className="btn-primary"
          >
            + Create New SOP
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="filters-container">
        <div className="filter-row">
          <div className="search-group">
            <input
              type="text"
              placeholder="Search SOPs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>

          <select
            value={filterProperty}
            onChange={(e) => setFilterProperty(e.target.value)}
            className="filter-select"
          >
            <option value="">All Properties</option>
            {properties.map(property => (
              <option key={property.id} value={property.id}>
                {property.name}
              </option>
            ))}
          </select>

          <select
            value={filterIncidentType}
            onChange={(e) => setFilterIncidentType(e.target.value)}
            className="filter-select"
          >
            <option value="">All Incident Types</option>
            {incidentTypes.map(type => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="filter-select"
          >
            <option value="">All Statuses</option>
            {statusOptions.map(status => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </select>

          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="filter-select"
          >
            <option value="">All Priorities</option>
            {priorityOptions.map(priority => (
              <option key={priority.value} value={priority.value}>
                {priority.label}
              </option>
            ))}
          </select>
        </div>

        <div className="results-info">
          {filteredSOPs.length} of {sops.length} SOPs
        </div>
      </div>

      {/* SOPs List */}
      <div className="sops-grid">
        {loading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading SOPs...</p>
          </div>
        ) : filteredSOPs.length === 0 ? (
          <div className="empty-state">
            <h3>No SOPs Found</h3>
            <p>
              {sops.length === 0 
                ? "No Standard Operating Procedures have been created yet."
                : "No SOPs match your current filters."
              }
            </p>
            {canEdit && sops.length === 0 && (
              <button onClick={handleCreateNew} className="btn-primary">
                Create Your First SOP
              </button>
            )}
          </div>
        ) : (
          filteredSOPs.map(sop => (
            <div key={sop.id} className="sop-card">
              <div className="sop-card-header">
                <div className="sop-title-section">
                  <h3 className="sop-title">{sop.title}</h3>
                  <div className="sop-badges">
                    <span 
                      className="priority-badge"
                      style={{ backgroundColor: getPriorityColor(sop.priorityLevel) }}
                    >
                      {sop.priorityLevel.toUpperCase()}
                    </span>
                    <span 
                      className="status-badge"
                      style={{ backgroundColor: getStatusColor(sop.status) }}
                    >
                      {sop.status.toUpperCase()}
                    </span>
                  </div>
                </div>
                
                {canEdit && (
                  <div className="sop-actions">
                    <button 
                      onClick={() => handleEdit(sop)}
                      className="btn-edit"
                      title="Edit SOP"
                    >
                      ✏️
                    </button>
                    <button 
                      onClick={() => handleDuplicate(sop)}
                      className="btn-duplicate"
                      title="Duplicate SOP"
                    >
                      📋
                    </button>
                    <button 
                      onClick={() => handleDelete(sop.id)}
                      className="btn-delete"
                      title="Delete SOP"
                    >
                      🗑️
                    </button>
                  </div>
                )}
              </div>

              <div className="sop-card-content">
                <div className="sop-info-row">
                  <strong>Property:</strong> {getPropertyName(sop.propertyId)}
                </div>
                <div className="sop-info-row">
                  <strong>Incident Type:</strong> {getIncidentTypeLabel(sop.incidentType)}
                </div>
                {sop.description && (
                  <div className="sop-description">
                    {sop.description}
                  </div>
                )}
                
                <div className="sop-stats">
                  <div className="stat-item">
                    <span className="stat-label">Times Used:</span>
                    <span className="stat-value">{sop.timesUsed || 0}</span>
                  </div>
                  {sop.successRate && (
                    <div className="stat-item">
                      <span className="stat-label">Success Rate:</span>
                      <span className="stat-value">{Math.round(sop.successRate * 100)}%</span>
                    </div>
                  )}
                  <div className="stat-item">
                    <span className="stat-label">Version:</span>
                    <span className="stat-value">{sop.version}</span>
                  </div>
                </div>

                <div className="sop-dates">
                  <div className="date-item">
                    <span className="date-label">Created:</span>
                    <span className="date-value">{formatDate(sop.createdAt)}</span>
                  </div>
                  {sop.effectiveDate && (
                    <div className="date-item">
                      <span className="date-label">Effective:</span>
                      <span className="date-value">{formatDate(sop.effectiveDate)}</span>
                    </div>
                  )}
                  {sop.lastUsedAt && (
                    <div className="date-item">
                      <span className="date-label">Last Used:</span>
                      <span className="date-value">{formatDate(sop.lastUsedAt)}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default SOPList;
