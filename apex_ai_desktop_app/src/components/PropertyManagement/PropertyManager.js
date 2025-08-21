/**
 * APEX AI DESKTOP - PROPERTY MANAGER COMPONENT
 * ============================================
 * Administrative property management with image upload capabilities
 * Features: Property CRUD, image upload, gallery management, real-time sync
 */

import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { 
  Building2, 
  Plus, 
  Edit, 
  Trash2, 
  Image as ImageIcon, 
  Upload, 
  Search,
  Filter,
  Save,
  X,
  MapPin,
  Phone,
  Mail,
  Calendar,
  AlertCircle,
  CheckCircle,
  Loader
} from 'lucide-react';

// ===========================
// STYLED COMPONENTS
// ===========================

const PropertyManagerContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  background: ${props => props.theme.colors.background};
  color: ${props => props.theme.colors.text};
`;

const Header = styled.div`
  display: flex;
  justify-content: between;
  align-items: center;
  padding: ${props => props.theme.spacing.lg};
  border-bottom: 1px solid ${props => props.theme.colors.border};
  background: ${props => props.theme.colors.backgroundLight};
`;

const Title = styled.h1`
  font-size: 24px;
  font-weight: 600;
  color: ${props => props.theme.colors.text};
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 0;
`;

const Controls = styled.div`
  display: flex;
  gap: ${props => props.theme.spacing.md};
  align-items: center;
`;

const SearchInput = styled.input`
  padding: 8px 12px;
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: ${props => props.theme.borderRadius.md};
  background: ${props => props.theme.colors.backgroundCard};
  color: ${props => props.theme.colors.text};
  width: 250px;

  &:focus {
    outline: none;
    border-color: ${props => props.theme.colors.primary};
  }
`;

const Button = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border: none;
  border-radius: ${props => props.theme.borderRadius.md};
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;

  ${props => props.variant === 'primary' && `
    background: ${props.theme.colors.primary};
    color: white;
    &:hover {
      background: ${props.theme.colors.primaryDark};
    }
  `}

  ${props => props.variant === 'secondary' && `
    background: ${props.theme.colors.backgroundCard};
    color: ${props.theme.colors.text};
    border: 1px solid ${props.theme.colors.border};
    &:hover {
      background: ${props.theme.colors.backgroundLight};
    }
  `}

  ${props => props.variant === 'danger' && `
    background: ${props.theme.colors.error};
    color: white;
    &:hover {
      background: #cc3333;
    }
  `}

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const PropertyGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: ${props => props.theme.spacing.lg};
  padding: ${props => props.theme.spacing.lg};
  overflow-y: auto;
  flex: 1;
`;

const PropertyCard = styled.div`
  background: ${props => props.theme.colors.backgroundCard};
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: ${props => props.theme.borderRadius.lg};
  overflow: hidden;
  transition: all 0.2s ease;

  &:hover {
    border-color: ${props => props.theme.colors.primary};
    box-shadow: 0 4px 12px rgba(0, 255, 136, 0.1);
  }
`;

const PropertyImageArea = styled.div`
  height: 200px;
  background: ${props => props.theme.colors.backgroundLight};
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const PropertyInfo = styled.div`
  padding: ${props => props.theme.spacing.md};
`;

const PropertyName = styled.h3`
  font-size: 18px;
  font-weight: 600;
  margin: 0 0 8px 0;
  color: ${props => props.theme.colors.text};
`;

const PropertyAddress = styled.p`
  color: ${props => props.theme.colors.textSecondary};
  margin: 0 0 12px 0;
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
`;

const PropertyMeta = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  margin-bottom: 16px;
`;

const MetaItem = styled.div`
  font-size: 12px;
  color: ${props => props.theme.colors.textMuted};
  display: flex;
  align-items: center;
  gap: 4px;
`;

const PropertyActions = styled.div`
  display: flex;
  gap: 8px;
  justify-content: flex-end;
`;

const Modal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const ModalContent = styled.div`
  background: ${props => props.theme.colors.backgroundCard};
  border-radius: ${props => props.theme.borderRadius.lg};
  padding: ${props => props.theme.spacing.xl};
  width: 90%;
  max-width: 800px;
  max-height: 90vh;
  overflow-y: auto;
`;

const FormGroup = styled.div`
  margin-bottom: ${props => props.theme.spacing.md};
`;

const Label = styled.label`
  display: block;
  margin-bottom: 4px;
  font-weight: 500;
  color: ${props => props.theme.colors.text};
`;

const Input = styled.input`
  width: 100%;
  padding: 10px 12px;
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: ${props => props.theme.borderRadius.md};
  background: ${props => props.theme.colors.background};
  color: ${props => props.theme.colors.text};

  &:focus {
    outline: none;
    border-color: ${props => props.theme.colors.primary};
  }
`;

const TextArea = styled.textarea`
  width: 100%;
  padding: 10px 12px;
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: ${props => props.theme.borderRadius.md};
  background: ${props => props.theme.colors.background};
  color: ${props => props.theme.colors.text};
  resize: vertical;
  min-height: 80px;

  &:focus {
    outline: none;
    border-color: ${props => props.theme.colors.primary};
  }
`;

const ImageUploadArea = styled.div`
  border: 2px dashed ${props => props.theme.colors.border};
  border-radius: ${props => props.theme.borderRadius.md};
  padding: ${props => props.theme.spacing.xl};
  text-align: center;
  cursor: pointer;
  transition: all 0.2s ease;
  background: ${props => props.theme.colors.background};

  &:hover {
    border-color: ${props => props.theme.colors.primary};
    background: ${props => props.theme.colors.backgroundLight};
  }

  &.drag-over {
    border-color: ${props => props.theme.colors.primary};
    background: ${props => props.theme.colors.backgroundLight};
  }
`;

const ImagePreviewGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 12px;
  margin-top: 16px;
`;

const ImagePreview = styled.div`
  position: relative;
  aspect-ratio: 1;
  border-radius: ${props => props.theme.borderRadius.md};
  overflow: hidden;
  border: 1px solid ${props => props.theme.colors.border};

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const RemoveImageButton = styled.button`
  position: absolute;
  top: 4px;
  right: 4px;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: none;
  background: ${props => props.theme.colors.error};
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  opacity: 0.8;

  &:hover {
    opacity: 1;
  }
`;

const LoadingOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
`;

// ===========================
// MAIN COMPONENT
// ===========================

const PropertyManager = () => {
  // ===========================
  // STATE MANAGEMENT
  // ===========================

  const [properties, setProperties] = useState([]);
  const [filteredProperties, setFilteredProperties] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' | 'edit' | 'images'
  const [selectedProperty, setSelectedProperty] = useState(null);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    propertyType: '',
    clientId: '',
    specialInstructions: '',
    accessCodes: ''
  });
  
  // Image upload state
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [uploadProgress, setUploadProgress] = useState({});
  const [isUploading, setIsUploading] = useState(false);

  // ===========================
  // DATA FETCHING
  // ===========================

  const fetchProperties = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/internal/v1/properties', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.success) {
        setProperties(data.data.properties);
        setFilteredProperties(data.data.properties);
      } else {
        throw new Error(data.message || 'Failed to fetch properties');
      }
    } catch (err) {
      console.error('Error fetching properties:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProperties();
  }, [fetchProperties]);

  // ===========================
  // SEARCH & FILTERING
  // ===========================

  useEffect(() => {
    if (!searchTerm) {
      setFilteredProperties(properties);
      return;
    }

    const filtered = properties.filter(property =>
      property.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      property.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
      property.city?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    setFilteredProperties(filtered);
  }, [searchTerm, properties]);

  // ===========================
  // MODAL HANDLERS
  // ===========================

  const openCreateModal = () => {
    setModalMode('create');
    setSelectedProperty(null);
    setFormData({
      name: '',
      address: '',
      city: '',
      state: '',
      zipCode: '',
      propertyType: '',
      clientId: '',
      specialInstructions: '',
      accessCodes: ''
    });
    setSelectedFiles([]);
    setImagePreviews([]);
    setShowModal(true);
  };

  const openEditModal = (property) => {
    setModalMode('edit');
    setSelectedProperty(property);
    setFormData({
      name: property.name || '',
      address: property.address || '',
      city: property.city || '',
      state: property.state || '',
      zipCode: property.zipCode || '',
      propertyType: property.propertyType || '',
      clientId: property.clientId || '',
      specialInstructions: property.specialInstructions || '',
      accessCodes: property.accessCodes || ''
    });
    setSelectedFiles([]);
    setImagePreviews([]);
    setShowModal(true);
  };

  const openImagesModal = (property) => {
    setModalMode('images');
    setSelectedProperty(property);
    setSelectedFiles([]);
    setImagePreviews([]);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedProperty(null);
    setSelectedFiles([]);
    setImagePreviews([]);
    setUploadProgress({});
  };

  // ===========================
  // FORM HANDLERS
  // ===========================

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const token = localStorage.getItem('authToken');
    const url = modalMode === 'edit' 
      ? `/api/internal/v1/properties/${selectedProperty.id}`
      : '/api/internal/v1/properties';
    
    const method = modalMode === 'edit' ? 'PUT' : 'POST';

    try {
      // Create FormData for file upload
      const formDataObj = new FormData();
      
      // Add form fields
      Object.keys(formData).forEach(key => {
        if (formData[key]) {
          formDataObj.append(key, formData[key]);
        }
      });

      // Add images for new properties
      if (modalMode === 'create' && selectedFiles.length > 0) {
        selectedFiles.forEach(file => {
          formDataObj.append('images', file);
        });
      }

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          // Don't set Content-Type for FormData
        },
        body: modalMode === 'edit' ? JSON.stringify(formData) : formDataObj
      });

      const data = await response.json();
      
      if (data.success) {
        await fetchProperties(); // Refresh the list
        closeModal();
      } else {
        throw new Error(data.message || 'Operation failed');
      }
    } catch (err) {
      console.error('Error saving property:', err);
      setError(err.message);
    }
  };

  // ===========================
  // IMAGE UPLOAD HANDLERS
  // ===========================

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    handleFiles(files);
  };

  const handleFiles = (files) => {
    const validFiles = files.filter(file => 
      file.type.startsWith('image/') && file.size <= 10 * 1024 * 1024
    );

    setSelectedFiles(prev => [...prev, ...validFiles]);

    // Create previews
    validFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreviews(prev => [...prev, {
          file,
          url: e.target.result
        }]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const uploadImages = async () => {
    if (!selectedProperty || selectedFiles.length === 0) return;

    setIsUploading(true);

    try {
      const formData = new FormData();
      selectedFiles.forEach(file => {
        formData.append('images', file);
      });

      const token = localStorage.getItem('authToken');
      const response = await fetch(`/api/internal/v1/properties/${selectedProperty.id}/images`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData
      });

      const data = await response.json();
      
      if (data.success) {
        await fetchProperties(); // Refresh the list
        setSelectedFiles([]);
        setImagePreviews([]);
      } else {
        throw new Error(data.message || 'Upload failed');
      }
    } catch (err) {
      console.error('Error uploading images:', err);
      setError(err.message);
    } finally {
      setIsUploading(false);
    }
  };

  // ===========================
  // RENDER HELPERS
  // ===========================

  const getPropertyImage = (property) => {
    if (property.property_images) {
      try {
        const images = JSON.parse(property.property_images);
        if (images.length > 0) {
          return `/property-images/${images[0].filename}`;
        }
      } catch (e) {
        console.error('Error parsing property images:', e);
      }
    }
    return null;
  };

  const getImageCount = (property) => {
    return property.image_count || 0;
  };

  // ===========================
  // MAIN RENDER
  // ===========================

  return (
    <PropertyManagerContainer>
      <Header>
        <Title>
          <Building2 size={28} />
          Property Management
        </Title>
        
        <Controls>
          <SearchInput
            type="text"
            placeholder="Search properties..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          
          <Button variant="primary" onClick={openCreateModal}>
            <Plus size={16} />
            Add Property
          </Button>
        </Controls>
      </Header>

      {error && (
        <div style={{ 
          padding: '16px', 
          background: '#fee', 
          color: '#c33', 
          borderBottom: '1px solid #fcc',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {isLoading ? (
        <div style={{ 
          flex: 1, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          flexDirection: 'column',
          gap: '16px'
        }}>
          <Loader size={32} style={{ animation: 'spin 1s linear infinite' }} />
          <div>Loading properties...</div>
        </div>
      ) : (
        <PropertyGrid>
          {filteredProperties.map(property => (
            <PropertyCard key={property.id}>
              <PropertyImageArea>
                {getPropertyImage(property) ? (
                  <img 
                    src={getPropertyImage(property)} 
                    alt={property.name}
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                ) : null}
                <div style={{ 
                  display: getPropertyImage(property) ? 'none' : 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '8px',
                  color: '#888'
                }}>
                  <ImageIcon size={32} />
                  <span style={{ fontSize: '14px' }}>
                    {getImageCount(property)} image{getImageCount(property) !== 1 ? 's' : ''}
                  </span>
                </div>
              </PropertyImageArea>

              <PropertyInfo>
                <PropertyName>{property.name}</PropertyName>
                
                <PropertyAddress>
                  <MapPin size={14} />
                  {property.address}
                  {property.city && `, ${property.city}`}
                  {property.state && `, ${property.state}`}
                </PropertyAddress>

                <PropertyMeta>
                  <MetaItem>
                    <Calendar size={12} />
                    {property.propertyType || 'Unknown Type'}
                  </MetaItem>
                  <MetaItem>
                    <ImageIcon size={12} />
                    {getImageCount(property)} images
                  </MetaItem>
                </PropertyMeta>

                <PropertyActions>
                  <Button
                    variant="secondary"
                    onClick={() => openImagesModal(property)}
                    style={{ fontSize: '12px', padding: '6px 12px' }}
                  >
                    <ImageIcon size={14} />
                    Images
                  </Button>
                  
                  <Button
                    variant="secondary"
                    onClick={() => openEditModal(property)}
                    style={{ fontSize: '12px', padding: '6px 12px' }}
                  >
                    <Edit size={14} />
                    Edit
                  </Button>
                </PropertyActions>
              </PropertyInfo>
            </PropertyCard>
          ))}
        </PropertyGrid>
      )}

      {/* Modal */}
      {showModal && (
        <Modal onClick={(e) => e.target === e.currentTarget && closeModal()}>
          <ModalContent>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'between', 
              alignItems: 'center', 
              marginBottom: '24px' 
            }}>
              <h2 style={{ margin: 0, fontSize: '20px' }}>
                {modalMode === 'create' && 'Add New Property'}
                {modalMode === 'edit' && 'Edit Property'}
                {modalMode === 'images' && `Manage Images - ${selectedProperty?.name}`}
              </h2>
              
              <Button variant="secondary" onClick={closeModal}>
                <X size={16} />
              </Button>
            </div>

            {modalMode === 'images' ? (
              <div>
                <ImageUploadArea
                  onClick={() => document.getElementById('imageInput').click()}
                  onDrop={(e) => {
                    e.preventDefault();
                    handleFiles(Array.from(e.dataTransfer.files));
                  }}
                  onDragOver={(e) => e.preventDefault()}
                >
                  <Upload size={32} style={{ marginBottom: '12px', color: '#888' }} />
                  <div style={{ fontSize: '16px', marginBottom: '8px' }}>
                    Drop images here or click to browse
                  </div>
                  <div style={{ fontSize: '14px', color: '#888' }}>
                    Supports JPG, PNG, GIF, WebP (max 10MB each)
                  </div>
                  <input
                    id="imageInput"
                    type="file"
                    multiple
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={handleFileSelect}
                  />
                </ImageUploadArea>

                {imagePreviews.length > 0 && (
                  <div>
                    <h4 style={{ marginTop: '24px', marginBottom: '12px' }}>
                      Selected Images ({imagePreviews.length})
                    </h4>
                    
                    <ImagePreviewGrid>
                      {imagePreviews.map((preview, index) => (
                        <ImagePreview key={index}>
                          <img src={preview.url} alt={`Preview ${index + 1}`} />
                          <RemoveImageButton onClick={() => removeImage(index)}>
                            <X size={12} />
                          </RemoveImageButton>
                        </ImagePreview>
                      ))}
                    </ImagePreviewGrid>

                    <div style={{ marginTop: '24px', textAlign: 'right' }}>
                      <Button
                        variant="primary"
                        onClick={uploadImages}
                        disabled={isUploading}
                      >
                        {isUploading ? (
                          <>
                            <Loader size={16} style={{ animation: 'spin 1s linear infinite' }} />
                            Uploading...
                          </>
                        ) : (
                          <>
                            <Upload size={16} />
                            Upload Images
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <FormGroup>
                    <Label>Property Name *</Label>
                    <Input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                    />
                  </FormGroup>

                  <FormGroup>
                    <Label>Property Type</Label>
                    <Input
                      type="text"
                      name="propertyType"
                      value={formData.propertyType}
                      onChange={handleInputChange}
                      placeholder="e.g., Apartment Complex, Office Building"
                    />
                  </FormGroup>

                  <FormGroup style={{ gridColumn: '1 / -1' }}>
                    <Label>Address *</Label>
                    <Input
                      type="text"
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      required
                    />
                  </FormGroup>

                  <FormGroup>
                    <Label>City</Label>
                    <Input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                    />
                  </FormGroup>

                  <FormGroup>
                    <Label>State</Label>
                    <Input
                      type="text"
                      name="state"
                      value={formData.state}
                      onChange={handleInputChange}
                    />
                  </FormGroup>

                  <FormGroup>
                    <Label>ZIP Code</Label>
                    <Input
                      type="text"
                      name="zipCode"
                      value={formData.zipCode}
                      onChange={handleInputChange}
                    />
                  </FormGroup>

                  <FormGroup>
                    <Label>Client ID</Label>
                    <Input
                      type="text"
                      name="clientId"
                      value={formData.clientId}
                      onChange={handleInputChange}
                    />
                  </FormGroup>

                  <FormGroup style={{ gridColumn: '1 / -1' }}>
                    <Label>Special Instructions</Label>
                    <TextArea
                      name="specialInstructions"
                      value={formData.specialInstructions}
                      onChange={handleInputChange}
                      placeholder="Any special instructions for this property..."
                    />
                  </FormGroup>

                  <FormGroup style={{ gridColumn: '1 / -1' }}>
                    <Label>Access Codes</Label>
                    <TextArea
                      name="accessCodes"
                      value={formData.accessCodes}
                      onChange={handleInputChange}
                      placeholder="Gate codes, door codes, etc..."
                    />
                  </FormGroup>
                </div>

                {modalMode === 'create' && (
                  <div style={{ marginTop: '24px' }}>
                    <Label>Property Images</Label>
                    <ImageUploadArea
                      onClick={() => document.getElementById('createImageInput').click()}
                      onDrop={(e) => {
                        e.preventDefault();
                        handleFiles(Array.from(e.dataTransfer.files));
                      }}
                      onDragOver={(e) => e.preventDefault()}
                    >
                      <Upload size={24} style={{ marginBottom: '8px', color: '#888' }} />
                      <div style={{ fontSize: '14px', marginBottom: '4px' }}>
                        Drop images here or click to browse
                      </div>
                      <div style={{ fontSize: '12px', color: '#888' }}>
                        Optional: Upload property images
                      </div>
                      <input
                        id="createImageInput"
                        type="file"
                        multiple
                        accept="image/*"
                        style={{ display: 'none' }}
                        onChange={handleFileSelect}
                      />
                    </ImageUploadArea>

                    {imagePreviews.length > 0 && (
                      <ImagePreviewGrid style={{ marginTop: '16px' }}>
                        {imagePreviews.map((preview, index) => (
                          <ImagePreview key={index}>
                            <img src={preview.url} alt={`Preview ${index + 1}`} />
                            <RemoveImageButton onClick={() => removeImage(index)}>
                              <X size={12} />
                            </RemoveImageButton>
                          </ImagePreview>
                        ))}
                      </ImagePreviewGrid>
                    )}
                  </div>
                )}

                <div style={{ 
                  marginTop: '32px', 
                  display: 'flex', 
                  gap: '12px', 
                  justifyContent: 'flex-end' 
                }}>
                  <Button type="button" variant="secondary" onClick={closeModal}>
                    Cancel
                  </Button>
                  
                  <Button type="submit" variant="primary">
                    <Save size={16} />
                    {modalMode === 'create' ? 'Create Property' : 'Save Changes'}
                  </Button>
                </div>
              </form>
            )}
          </ModalContent>
        </Modal>
      )}
    </PropertyManagerContainer>
  );
};

export default PropertyManager;
