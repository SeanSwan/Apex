/**
 * APEX AI FACE PROFILE CARD COMPONENT
 * ===================================
 * Individual face profile display card with actions
 * 
 * Features:
 * - Profile image display
 * - Status indicators
 * - Quick actions (edit, delete, view details)
 * - Detection statistics
 * - Department and access level badges
 */

import React, { useState } from 'react';
import styled from 'styled-components';
import {
  User,
  Eye,
  Trash2,
  Edit,
  Calendar,
  Building,
  Shield,
  Camera,
  Clock,
  AlertTriangle,
  CheckCircle,
  MoreVertical,
  UserX
} from 'lucide-react';

// Styled Components
const CardContainer = styled.div`
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  padding: 1.5rem;
  backdrop-filter: blur(10px);
  transition: all 0.3s ease;
  position: relative;
  
  &:hover {
    background: rgba(255, 255, 255, 0.15);
    border-color: rgba(255, 255, 255, 0.3);
    transform: translateY(-2px);
  }
`;

const CardHeader = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  margin-bottom: 1rem;
`;

const ProfileImage = styled.div`
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  border: 2px solid rgba(255, 255, 255, 0.3);
  position: relative;
  
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: 50%;
  }
  
  .placeholder-icon {
    color: rgba(255, 255, 255, 0.6);
  }
  
  .status-indicator {
    position: absolute;
    bottom: -2px;
    right: -2px;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    border: 2px solid white;
    
    &.active {
      background: #4ade80;
    }
    
    &.inactive {
      background: #6b7280;
    }
    
    &.archived {
      background: #ef4444;
    }
  }
`;

const ProfileInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const ProfileName = styled.h3`
  color: white;
  font-size: 1.1rem;
  font-weight: 600;
  margin: 0 0 0.25rem 0;
  word-break: break-word;
`;

const ProfileMeta = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
`;

const Badge = styled.span`
  background: rgba(255, 255, 255, 0.15);
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 0.25rem;
  
  &.department {
    background: rgba(59, 130, 246, 0.3);
    border: 1px solid rgba(59, 130, 246, 0.5);
  }
  
  &.access-level {
    background: rgba(168, 85, 247, 0.3);
    border: 1px solid rgba(168, 85, 247, 0.5);
  }
  
  &.status {
    &.active {
      background: rgba(74, 222, 128, 0.3);
      border: 1px solid rgba(74, 222, 128, 0.5);
    }
    
    &.inactive {
      background: rgba(107, 114, 128, 0.3);
      border: 1px solid rgba(107, 114, 128, 0.5);
    }
    
    &.archived {
      background: rgba(239, 68, 68, 0.3);
      border: 1px solid rgba(239, 68, 68, 0.5);
    }
  }
`;

const ActionsContainer = styled.div`
  position: relative;
`;

const ActionsButton = styled.button`
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 6px;
  color: white;
  padding: 0.5rem;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  
  &:hover {
    background: rgba(255, 255, 255, 0.2);
  }
`;

const ActionsMenu = styled.div`
  position: absolute;
  top: 100%;
  right: 0;
  background: rgba(0, 0, 0, 0.9);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  backdrop-filter: blur(20px);
  min-width: 150px;
  z-index: 10;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  
  &.hidden {
    display: none;
  }
`;

const ActionItem = styled.button`
  width: 100%;
  background: transparent;
  border: none;
  color: white;
  padding: 0.75rem 1rem;
  text-align: left;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
  
  &:hover {
    background: rgba(255, 255, 255, 0.1);
  }
  
  &:first-child {
    border-radius: 8px 8px 0 0;
  }
  
  &:last-child {
    border-radius: 0 0 8px 8px;
  }
  
  &.danger {
    color: #ef4444;
    
    &:hover {
      background: rgba(239, 68, 68, 0.1);
    }
  }
`;

const StatsSection = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
  gap: 1rem;
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
`;

const StatItem = styled.div`
  text-align: center;
  
  .stat-value {
    color: white;
    font-size: 1.2rem;
    font-weight: 600;
    margin: 0;
  }
  
  .stat-label {
    color: rgba(255, 255, 255, 0.7);
    font-size: 0.75rem;
    margin: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.25rem;
  }
`;

const CreatedDate = styled.div`
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.75rem;
  display: flex;
  align-items: center;
  gap: 0.25rem;
  margin-top: 0.5rem;
`;

const Notes = styled.div`
  color: rgba(255, 255, 255, 0.8);
  font-size: 0.8rem;
  margin-top: 0.5rem;
  font-style: italic;
  word-break: break-word;
  
  &:empty {
    display: none;
  }
`;

// Interface
export interface FaceProfileCardProps {
  profile: {
    face_id: string;
    name: string;
    department?: string;
    access_level?: string;
    status: 'active' | 'inactive' | 'archived';
    created_at: string;
    image_filename?: string;
    notes?: string;
    total_detections: number;
    last_detected?: string;
  };
  onEdit?: (profileId: string) => void;
  onDelete?: (profileId: string) => void;
  onViewDetails?: (profileId: string) => void;
  className?: string;
}

const FaceProfileCard: React.FC<FaceProfileCardProps> = ({
  profile,
  onEdit,
  onDelete,
  onViewDetails,
  className
}) => {
  const [showActions, setShowActions] = useState(false);
  
  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };
  
  // Format last detected time
  const formatLastDetected = (dateString?: string) => {
    if (!dateString) return 'Never';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return `${Math.floor(diffDays / 30)} months ago`;
  };
  
  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return '#4ade80';
      case 'inactive': return '#6b7280';
      case 'archived': return '#ef4444';
      default: return '#6b7280';
    }
  };
  
  // Handle action clicks
  const handleAction = (action: string) => {
    setShowActions(false);
    
    switch (action) {
      case 'view':
        onViewDetails?.(profile.face_id);
        break;
      case 'edit':
        onEdit?.(profile.face_id);
        break;
      case 'delete':
        if (window.confirm(`Are you sure you want to delete "${profile.name}"?`)) {
          onDelete?.(profile.face_id);
        }
        break;
    }
  };
  
  // Close actions menu when clicking outside
  React.useEffect(() => {
    const handleClickOutside = () => setShowActions(false);
    
    if (showActions) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [showActions]);
  
  return (
    <CardContainer className={className}>
      <CardHeader>
        <ProfileImage>
          {profile.image_filename ? (
            <img 
              src={`/api/faces/${profile.face_id}/image`} 
              alt={profile.name}
              onError={(e) => {
                // Fallback to placeholder on image load error
                e.currentTarget.style.display = 'none';
                const nextElement = e.currentTarget.nextElementSibling as HTMLElement;
                if (nextElement) nextElement.style.display = 'block';
              }}
            />
          ) : (
            <User size={32} className="placeholder-icon" />
          )}
          <div 
            className={`status-indicator ${profile.status}`}
            title={`Status: ${profile.status}`}
          />
        </ProfileImage>
        
        <ProfileInfo>
          <ProfileName>{profile.name}</ProfileName>
          
          <ProfileMeta>
            {profile.department && (
              <Badge className="department">
                <Building size={12} />
                {profile.department}
              </Badge>
            )}
            
            {profile.access_level && (
              <Badge className="access-level">
                <Shield size={12} />
                {profile.access_level}
              </Badge>
            )}
            
            <Badge className={`status ${profile.status}`}>
              {profile.status === 'active' ? (
                <CheckCircle size={12} />
              ) : profile.status === 'archived' ? (
                <UserX size={12} />
              ) : (
                <AlertTriangle size={12} />
              )}
              {profile.status.charAt(0).toUpperCase() + profile.status.slice(1)}
            </Badge>
          </ProfileMeta>
          
          <CreatedDate>
            <Calendar size={12} />
            Enrolled {formatDate(profile.created_at)}
          </CreatedDate>
          
          {profile.notes && (
            <Notes>"{profile.notes}"</Notes>
          )}
        </ProfileInfo>
        
        <ActionsContainer>
          <ActionsButton onClick={() => setShowActions(!showActions)}>
            <MoreVertical size={16} />
          </ActionsButton>
          
          <ActionsMenu className={showActions ? "" : "hidden"}>
            <ActionItem onClick={() => handleAction('view')}>
              <Eye size={14} />
              View Details
            </ActionItem>
            <ActionItem onClick={() => handleAction('edit')}>
              <Edit size={14} />
              Edit Profile
            </ActionItem>
            <ActionItem 
              className="danger"
              onClick={() => handleAction('delete')}
            >
              <Trash2 size={14} />
              Delete
            </ActionItem>
          </ActionsMenu>
        </ActionsContainer>
      </CardHeader>
      
      <StatsSection>
        <StatItem>
          <p className="stat-value">{profile.total_detections}</p>
          <p className="stat-label">
            <Camera size={12} />
            Detections
          </p>
        </StatItem>
        
        <StatItem>
          <p className="stat-value">{formatLastDetected(profile.last_detected)}</p>
          <p className="stat-label">
            <Clock size={12} />
            Last Seen
          </p>
        </StatItem>
      </StatsSection>
    </CardContainer>
  );
};

export default FaceProfileCard;