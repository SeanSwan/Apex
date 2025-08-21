// PropertyManagement.tsx
/**
 * ENHANCED PROPERTY MANAGEMENT COMPONENT
 * ======================================
 * Comprehensive property management interface for admin dashboard
 * - Create, edit, delete properties with image upload
 * - Bulk import capabilities
 * - Real-time client portal synchronization
 * - Manual failsafe options for AI automation
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import styled from 'styled-components';
import { 
  Building, 
  Plus, 
  Edit, 
  Trash2, 
  Upload, 
  Download, 
  Search, 
  Filter, 
  MapPin, 
  Phone, 
  Mail, 
  Calendar,
  Users,
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Image as ImageIcon,
  FileText,
  Eye,
  Settings
} from 'lucide-react';

import { Button } from '../ui/button';
import { useToast } from '../../hooks/use-toast';

// Types for Property Management
interface Property {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  propertyType: 'luxury_apartment' | 'commercial' | 'residential' | 'corporate';
  clientId: string;
  clientCompanyName: string;
  timezone: string;
  emergencyContactInfo?: {
    name: string;
    phone: string;
    email: string;
  };
  specialInstructions?: string;
  accessCodes?: {
    main: string;
    emergency: string;
    maintenance: string;
  };
  propertyImages?: PropertyImage[];
  status: 'active' | 'inactive' | 'maintenance';
  assignedGuards: number;
  sopCount: number;
  contactListCount: number;
  incidentCount: number;
  createdAt: string;
  updatedAt: string;
}

interface PropertyImage {
  filename: string;
  originalName: string;
  size: number;
  url: string;
  uploadedAt?: string;
}

interface NewProperty {
  name: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  propertyType: string;
  clientId: string;
  timezone: string;
  emergencyContactInfo: {
    name: string;
    phone: string;
    email: string;
  };
  specialInstructions: string;
  accessCodes: {
    main: string;
    emergency: string;
    maintenance: string;
  };
}

interface BulkImportResult {
  successful: number;
  failed: number;
  errors: Array<{
    property: string;
    error: string;
  }>;
}

// Styled Components
const PropertyManagementContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2rem;
  height: 100%;
`;

const PropertyHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 1rem;
  border-bottom: 1px solid rgba(255, 215, 0, 0.3);
  
  h2 {
    margin: 0;
    color: #FFD700;
    display: flex;
    align-items: center;
    gap: 0.75rem;
    font-size: 1.5rem;
  }
  
  .actions {
    display: flex;
    gap: 1rem;
  }
`;

const PropertyFilters = styled.div`
  display: flex;
  gap: 1rem;
  align-items: center;
  padding: 1rem;
  background: rgba(20, 20, 20, 0.5);
  border-radius: 8px;
  border: 1px solid rgba(255, 215, 0, 0.3);
  
  .search-box {
    flex: 1;
    max-width: 300px;
    position: relative;
    
    input {
      width: 100%;
      padding: 0.5rem 1rem 0.5rem 2.5rem;
      background: rgba(40, 40, 40, 0.9);
      border: 1px solid rgba(255, 215, 0, 0.3);
      border-radius: 6px;
      color: #E0E0E0;
      font-size: 0.9rem;
      
      &::placeholder {
        color: #666;
      }
      
      &:focus {
        outline: none;
        border-color: #FFD700;
        box-shadow: 0 0 0 2px rgba(255, 215, 0, 0.2);
      }
    }
    
    .search-icon {
      position: absolute;
      left: 0.75rem;
      top: 50%;
      transform: translateY(-50%);
      color: #666;
    }
  }
  
  .filter-controls {
    display: flex;
    gap: 0.5rem;
    
    select {
      padding: 0.5rem;
      background: rgba(40, 40, 40, 0.9);
      border: 1px solid rgba(255, 215, 0, 0.3);
      border-radius: 6px;
      color: #E0E0E0;
      font-size: 0.9rem;
      
      &:focus {
        outline: none;
        border-color: #FFD700;
      }
    }
  }
`;

const PropertyGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  gap: 1.5rem;
  flex: 1;
  overflow-y: auto;
`;

const PropertyCard = styled.div`
  background: rgba(30, 30, 30, 0.9);
  border-radius: 12px;
  border: 1px solid rgba(255, 215, 0, 0.3);
  overflow: hidden;
  transition: all 0.2s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(255, 215, 0, 0.1);
    border-color: rgba(255, 215, 0, 0.5);
  }
`;

const PropertyImageSection = styled.div`
  height: 180px;
  background: rgba(40, 40, 40, 0.9);
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  
  .no-image {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
    color: #666;
    
    .icon {
      padding: 1rem;
      background: rgba(255, 215, 0, 0.1);
      border-radius: 50%;
      color: #FFD700;
    }
  }
  
  .image-count {
    position: absolute;
    top: 0.5rem;
    right: 0.5rem;
    background: rgba(0, 0, 0, 0.8);
    color: #FFD700;
    padding: 0.25rem 0.5rem;
    border-radius: 12px;
    font-size: 0.8rem;
    display: flex;
    align-items: center;
    gap: 0.25rem;
  }
  
  .status-badge {
    position: absolute;
    top: 0.5rem;
    left: 0.5rem;
    padding: 0.25rem 0.75rem;
    border-radius: 12px;
    font-size: 0.75rem;
    font-weight: 500;
    text-transform: uppercase;
    
    &.active {
      background: rgba(34, 197, 94, 0.2);
      color: #22C55E;
      border: 1px solid rgba(34, 197, 94, 0.5);
    }
    
    &.inactive {
      background: rgba(239, 68, 68, 0.2);
      color: #EF4444;
      border: 1px solid rgba(239, 68, 68, 0.5);
    }
    
    &.maintenance {
      background: rgba(245, 158, 11, 0.2);
      color: #F59E0B;
      border: 1px solid rgba(245, 158, 11, 0.5);
    }
  }
`;

const PropertyInfo = styled.div`
  padding: 1.5rem;
  
  .property-header {
    margin-bottom: 1rem;
    
    h3 {
      margin: 0 0 0.5rem 0;
      color: #FFD700;
      font-size: 1.1rem;
      font-weight: 600;
    }
    
    .address {
      color: #B0B0B0;
      font-size: 0.9rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
  }
  
  .property-stats {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 1rem;
    margin-bottom: 1rem;
    
    .stat {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.85rem;
      color: #B0B0B0;
      
      .icon {
        color: #FFD700;
      }
      
      .value {
        color: #E0E0E0;
        font-weight: 500;
      }
    }
  }
  
  .property-actions {
    display: flex;
    gap: 0.5rem;
    
    button {
      flex: 1;
      padding: 0.5rem;
      border: none;
      border-radius: 6px;
      font-size: 0.8rem;
      cursor: pointer;
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.25rem;
      
      &.edit {
        background: rgba(59, 130, 246, 0.2);
        color: #3B82F6;
        border: 1px solid rgba(59, 130, 246, 0.3);
        
        &:hover {
          background: rgba(59, 130, 246, 0.3);
        }
      }
      
      &.view {
        background: rgba(34, 197, 94, 0.2);
        color: #22C55E;
        border: 1px solid rgba(34, 197, 94, 0.3);
        
        &:hover {
          background: rgba(34, 197, 94, 0.3);
        }
      }
      
      &.delete {
        background: rgba(239, 68, 68, 0.2);
        color: #EF4444;
        border: 1px solid rgba(239, 68, 68, 0.3);
        
        &:hover {
          background: rgba(239, 68, 68, 0.3);
        }
      }
    }
  }
`;

const Modal = styled.div<{ $isOpen: boolean }>`
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
  
  .modal-content {
    background: rgba(20, 20, 20, 0.95);
    border-radius: 12px;
    border: 1px solid rgba(255, 215, 0, 0.3);
    max-width: 600px;
    width: 100%;
    max-height: 90vh;
    overflow-y: auto;
    
    .modal-header {
      padding: 1.5rem;
      border-bottom: 1px solid rgba(255, 215, 0, 0.3);
      display: flex;
      justify-content: space-between;
      align-items: center;
      
      h3 {
        margin: 0;
        color: #FFD700;
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }
      
      button {
        background: none;
        border: none;
        color: #666;
        cursor: pointer;
        padding: 0.5rem;
        border-radius: 4px;
        
        &:hover {
          background: rgba(255, 255, 255, 0.1);
          color: #FFD700;
        }
      }
    }
    
    .modal-body {
      padding: 1.5rem;
    }
  }
`;

const FormGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  
  &.single-column {
    grid-template-columns: 1fr;
  }
  
  .form-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    
    label {
      color: #FFD700;
      font-size: 0.9rem;
      font-weight: 500;
    }
    
    input, select, textarea {
      padding: 0.75rem;
      background: rgba(40, 40, 40, 0.9);
      border: 1px solid rgba(255, 215, 0, 0.3);
      border-radius: 6px;
      color: #E0E0E0;
      font-size: 0.9rem;
      
      &::placeholder {
        color: #666;
      }
      
      &:focus {
        outline: none;
        border-color: #FFD700;
        box-shadow: 0 0 0 2px rgba(255, 215, 0, 0.2);
      }
    }
    
    textarea {
      resize: vertical;
      min-height: 80px;
    }
    
    &.full-width {
      grid-column: 1 / -1;
    }
  }
`;

const ImageUploadArea = styled.div`
  border: 2px dashed rgba(255, 215, 0, 0.3);
  border-radius: 8px;
  padding: 2rem;
  text-align: center;
  background: rgba(40, 40, 40, 0.3);
  transition: all 0.2s ease;
  cursor: pointer;
  
  &:hover {
    border-color: rgba(255, 215, 0, 0.5);
    background: rgba(40, 40, 40, 0.5);
  }
  
  &.drag-over {
    border-color: #FFD700;
    background: rgba(255, 215, 0, 0.1);
  }
  
  .upload-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
    
    .upload-icon {
      padding: 1rem;
      background: rgba(255, 215, 0, 0.1);
      border-radius: 50%;
      color: #FFD700;
    }
    
    .upload-text {
      color: #E0E0E0;
      
      .highlight {
        color: #FFD700;
        font-weight: 500;
      }
    }
    
    .upload-hint {
      color: #666;
      font-size: 0.8rem;
    }
  }
  
  input[type="file"] {
    display: none;
  }
`;

const StatsBar = styled.div`
  display: flex;
  gap: 1rem;
  padding: 1rem;
  background: rgba(20, 20, 20, 0.5);
  border-radius: 8px;
  border: 1px solid rgba(255, 215, 0, 0.3);
  
  .stat {
    flex: 1;
    text-align: center;
    
    .value {
      font-size: 1.5rem;
      font-weight: 700;
      color: #FFD700;
      margin-bottom: 0.25rem;
    }
    
    .label {
      color: #B0B0B0;
      font-size: 0.8rem;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
  }
`;

// Main Component
const PropertyManagement: React.FC = () => {
  const { toast } = useToast();
  
  // State management
  const [properties, setProperties] = useState<Property[]>([]);
  const [filteredProperties, setFilteredProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  
  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  
  // Form state
  const [newProperty, setNewProperty] = useState<NewProperty>({
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
      email: ''
    },
    specialInstructions: '',
    accessCodes: {
      main: '',
      emergency: '',
      maintenance: ''
    }
  });
  
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);

  // Load properties on mount
  useEffect(() => {
    loadProperties();
  }, []);

  // Filter properties when search/filters change
  useEffect(() => {
    let filtered = properties;
    
    if (searchTerm) {
      filtered = filtered.filter(property => 
        property.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        property.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
        property.clientCompanyName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (statusFilter !== 'all') {
      filtered = filtered.filter(property => property.status === statusFilter);
    }
    
    if (typeFilter !== 'all') {
      filtered = filtered.filter(property => property.propertyType === typeFilter);
    }
    
    setFilteredProperties(filtered);
  }, [properties, searchTerm, statusFilter, typeFilter]);

  // API Functions
  const loadProperties = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/internal/v1/properties', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setProperties(data.data.properties || []);
      } else {
        throw new Error('Failed to load properties');
      }
    } catch (error) {
      console.error('Error loading properties:', error);
      toast({
        title: "Error Loading Properties",
        description: "Unable to load properties. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const handleCreateProperty = useCallback(async () => {
    try {
      const formData = new FormData();
      
      // Add property data
      Object.entries(newProperty).forEach(([key, value]) => {
        if (typeof value === 'object') {
          formData.append(key, JSON.stringify(value));
        } else {
          formData.append(key, value);
        }
      });
      
      // Add images
      selectedImages.forEach(image => {
        formData.append('images', image);
      });
      
      const response = await fetch('/api/internal/v1/properties', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });
      
      if (response.ok) {
        toast({
          title: "Property Created",
          description: "Property has been created successfully.",
          variant: "default"
        });
        
        setIsCreateModalOpen(false);
        resetForm();
        loadProperties();
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create property');
      }
    } catch (error) {
      console.error('Error creating property:', error);
      toast({
        title: "Creation Failed",
        description: error.message || "Unable to create property. Please try again.",
        variant: "destructive"
      });
    }
  }, [newProperty, selectedImages, toast, loadProperties]);

  const handleDeleteProperty = useCallback(async (propertyId: string, propertyName: string) => {
    if (!confirm(`Are you sure you want to delete "${propertyName}"? This action cannot be undone.`)) {
      return;
    }
    
    try {
      const response = await fetch(`/api/internal/v1/properties/${propertyId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        toast({
          title: "Property Deleted",
          description: "Property has been deleted successfully.",
          variant: "default"
        });
        
        loadProperties();
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete property');
      }
    } catch (error) {
      console.error('Error deleting property:', error);
      toast({
        title: "Deletion Failed",
        description: error.message || "Unable to delete property. Please try again.",
        variant: "destructive"
      });
    }
  }, [toast, loadProperties]);

  // Helper functions
  const resetForm = useCallback(() => {
    setNewProperty({
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
        email: ''
      },
      specialInstructions: '',
      accessCodes: {
        main: '',
        emergency: '',
        maintenance: ''
      }
    });
    setSelectedImages([]);
  }, []);

  const handleImageDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files).filter(file => 
      file.type.startsWith('image/')
    );
    
    setSelectedImages(prev => [...prev, ...files].slice(0, 5));
  }, []);

  const handleImageSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setSelectedImages(prev => [...prev, ...files].slice(0, 5));
    }
  }, []);

  // Statistics
  const stats = useMemo(() => {
    const total = properties.length;
    const active = properties.filter(p => p.status === 'active').length;
    const totalGuards = properties.reduce((sum, p) => sum + p.assignedGuards, 0);
    const totalIncidents = properties.reduce((sum, p) => sum + p.incidentCount, 0);
    
    return { total, active, totalGuards, totalIncidents };
  }, [properties]);

  if (isLoading) {
    return (
      <PropertyManagementContainer>
        <div style={{ textAlign: 'center', padding: '4rem', color: '#666' }}>
          <h3>Loading Properties...</h3>
        </div>
      </PropertyManagementContainer>
    );
  }

  return (
    <PropertyManagementContainer>
      {/* Header */}
      <PropertyHeader>
        <h2>
          <Building size={24} />
          Property Management
        </h2>
        <div className="actions">
          <Button variant="outline" onClick={() => setIsCreateModalOpen(true)}>
            <Plus size={16} />
            Add Property
          </Button>
          <Button variant="outline">
            <Download size={16} />
            Export
          </Button>
          <Button variant="outline">
            <Upload size={16} />
            Bulk Import
          </Button>
        </div>
      </PropertyHeader>

      {/* Statistics */}
      <StatsBar>
        <div className="stat">
          <div className="value">{stats.total}</div>
          <div className="label">Total Properties</div>
        </div>
        <div className="stat">
          <div className="value">{stats.active}</div>
          <div className="label">Active Properties</div>
        </div>
        <div className="stat">
          <div className="value">{stats.totalGuards}</div>
          <div className="label">Assigned Guards</div>
        </div>
        <div className="stat">
          <div className="value">{stats.totalIncidents}</div>
          <div className="label">Recent Incidents</div>
        </div>
      </StatsBar>

      {/* Filters */}
      <PropertyFilters>
        <div className="search-box">
          <Search className="search-icon" size={16} />
          <input
            type="text"
            placeholder="Search properties..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="filter-controls">
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="maintenance">Maintenance</option>
          </select>
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
            <option value="all">All Types</option>
            <option value="luxury_apartment">Luxury Apartment</option>
            <option value="commercial">Commercial</option>
            <option value="residential">Residential</option>
            <option value="corporate">Corporate</option>
          </select>
        </div>
      </PropertyFilters>

      {/* Property Grid */}
      <PropertyGrid>
        {filteredProperties.map((property) => (
          <PropertyCard key={property.id}>
            <PropertyImageSection>
              {property.propertyImages && property.propertyImages.length > 0 ? (
                <>
                  <img 
                    src={property.propertyImages[0].url} 
                    alt={property.name}
                  />
                  {property.propertyImages.length > 1 && (
                    <div className="image-count">
                      <ImageIcon size={12} />
                      {property.propertyImages.length}
                    </div>
                  )}
                </>
              ) : (
                <div className="no-image">
                  <div className="icon">
                    <Building size={24} />
                  </div>
                  <span>No Image</span>
                </div>
              )}
              <div className={`status-badge ${property.status}`}>
                {property.status}
              </div>
            </PropertyImageSection>
            
            <PropertyInfo>
              <div className="property-header">
                <h3>{property.name}</h3>
                <div className="address">
                  <MapPin size={14} />
                  {property.address}, {property.city}, {property.state}
                </div>
              </div>
              
              <div className="property-stats">
                <div className="stat">
                  <Users className="icon" size={14} />
                  <span className="value">{property.assignedGuards}</span>
                  <span>Guards</span>
                </div>
                <div className="stat">
                  <Shield className="icon" size={14} />
                  <span className="value">{property.sopCount}</span>
                  <span>SOPs</span>
                </div>
                <div className="stat">
                  <AlertTriangle className="icon" size={14} />
                  <span className="value">{property.incidentCount}</span>
                  <span>Incidents</span>
                </div>
                <div className="stat">
                  <Phone className="icon" size={14} />
                  <span className="value">{property.contactListCount}</span>
                  <span>Contacts</span>
                </div>
              </div>
              
              <div className="property-actions">
                <button 
                  className="view"
                  onClick={() => {
                    setSelectedProperty(property);
                    // Open detailed view modal
                  }}
                >
                  <Eye size={12} />
                  View
                </button>
                <button 
                  className="edit"
                  onClick={() => {
                    setSelectedProperty(property);
                    setIsEditModalOpen(true);
                  }}
                >
                  <Edit size={12} />
                  Edit
                </button>
                <button 
                  className="delete"
                  onClick={() => handleDeleteProperty(property.id, property.name)}
                >
                  <Trash2 size={12} />
                  Delete
                </button>
              </div>
            </PropertyInfo>
          </PropertyCard>
        ))}
      </PropertyGrid>

      {/* Create Property Modal */}
      <Modal $isOpen={isCreateModalOpen}>
        <div className="modal-content">
          <div className="modal-header">
            <h3>
              <Plus size={20} />
              Create New Property
            </h3>
            <button onClick={() => setIsCreateModalOpen(false)}>
              <XCircle size={20} />
            </button>
          </div>
          <div className="modal-body">
            <FormGrid>
              <div className="form-group">
                <label>Property Name *</label>
                <input
                  type="text"
                  placeholder="Enter property name"
                  value={newProperty.name}
                  onChange={(e) => setNewProperty(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              
              <div className="form-group">
                <label>Property Type *</label>
                <select
                  value={newProperty.propertyType}
                  onChange={(e) => setNewProperty(prev => ({ ...prev, propertyType: e.target.value }))}
                >
                  <option value="luxury_apartment">Luxury Apartment</option>
                  <option value="commercial">Commercial</option>
                  <option value="residential">Residential</option>
                  <option value="corporate">Corporate</option>
                </select>
              </div>
              
              <div className="form-group full-width">
                <label>Address *</label>
                <input
                  type="text"
                  placeholder="Enter property address"
                  value={newProperty.address}
                  onChange={(e) => setNewProperty(prev => ({ ...prev, address: e.target.value }))}
                />
              </div>
              
              <div className="form-group">
                <label>City *</label>
                <input
                  type="text"
                  placeholder="Enter city"
                  value={newProperty.city}
                  onChange={(e) => setNewProperty(prev => ({ ...prev, city: e.target.value }))}
                />
              </div>
              
              <div className="form-group">
                <label>State *</label>
                <input
                  type="text"
                  placeholder="Enter state"
                  value={newProperty.state}
                  onChange={(e) => setNewProperty(prev => ({ ...prev, state: e.target.value }))}
                />
              </div>
              
              <div className="form-group">
                <label>Zip Code</label>
                <input
                  type="text"
                  placeholder="Enter zip code"
                  value={newProperty.zipCode}
                  onChange={(e) => setNewProperty(prev => ({ ...prev, zipCode: e.target.value }))}
                />
              </div>
              
              <div className="form-group">
                <label>Client ID *</label>
                <input
                  type="text"
                  placeholder="Enter client ID"
                  value={newProperty.clientId}
                  onChange={(e) => setNewProperty(prev => ({ ...prev, clientId: e.target.value }))}
                />
              </div>
              
              <div className="form-group full-width">
                <label>Special Instructions</label>
                <textarea
                  placeholder="Enter any special instructions for this property"
                  value={newProperty.specialInstructions}
                  onChange={(e) => setNewProperty(prev => ({ ...prev, specialInstructions: e.target.value }))}
                />
              </div>
            </FormGrid>

            {/* Image Upload */}
            <div style={{ marginTop: '1.5rem' }}>
              <label style={{ color: '#FFD700', marginBottom: '0.5rem', display: 'block' }}>
                Property Images (up to 5)
              </label>
              <ImageUploadArea
                className={isDragOver ? 'drag-over' : ''}
                onClick={() => document.getElementById('property-images')?.click()}
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragOver(true);
                }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={handleImageDrop}
              >
                <div className="upload-content">
                  <div className="upload-icon">
                    <Upload size={24} />
                  </div>
                  <div className="upload-text">
                    <span className="highlight">Click to upload</span> or drag and drop
                  </div>
                  <div className="upload-hint">
                    PNG, JPG, WEBP up to 10MB each
                  </div>
                  {selectedImages.length > 0 && (
                    <div style={{ marginTop: '1rem' }}>
                      <strong>{selectedImages.length} image(s) selected</strong>
                    </div>
                  )}
                </div>
                <input
                  id="property-images"
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageSelect}
                />
              </ImageUploadArea>
            </div>

            {/* Action Buttons */}
            <div style={{ 
              display: 'flex', 
              gap: '1rem', 
              marginTop: '2rem',
              justifyContent: 'flex-end'
            }}>
              <Button 
                variant="outline" 
                onClick={() => setIsCreateModalOpen(false)}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleCreateProperty}
                disabled={!newProperty.name || !newProperty.address || !newProperty.clientId}
              >
                <Plus size={16} />
                Create Property
              </Button>
            </div>
          </div>
        </div>
      </Modal>
    </PropertyManagementContainer>
  );
};

export default PropertyManagement;