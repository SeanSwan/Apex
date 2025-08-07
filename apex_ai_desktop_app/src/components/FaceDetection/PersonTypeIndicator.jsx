/**
 * PERSON TYPE INDICATOR COMPONENT
 * ===============================
 * Visual indicators and badges for different person types in face detection
 * Displays consistent styling and information for residents, visitors, staff, etc.
 */

import React from 'react';
import styled from 'styled-components';

const IndicatorContainer = styled.div`
  display: inline-flex;
  align-items: center;
  gap: ${props => props.theme.spacing.xs};
  padding: ${props => props.theme.spacing.xs} ${props => props.theme.spacing.sm};
  border-radius: ${props => props.theme.borderRadius.md};
  font-size: ${props => props.theme.fontSizes.sm};
  font-weight: 500;
  background-color: ${props => props.bgColor};
  color: ${props => props.textColor};
  border: 2px solid ${props => props.borderColor};
  box-shadow: ${props => props.alert ? '0 0 8px rgba(255, 0, 0, 0.5)' : 'none'};
  animation: ${props => props.alert ? 'pulse 1s infinite' : 'none'};

  @keyframes pulse {
    0% { opacity: 1; }
    50% { opacity: 0.7; }
    100% { opacity: 1; }
  }
`;

const Icon = styled.span`
  font-size: ${props => props.theme.fontSizes.md};
  font-weight: bold;
`;

const Label = styled.span`
  text-transform: capitalize;
`;

const ConfidenceBar = styled.div`
  width: 30px;
  height: 4px;
  background-color: rgba(255, 255, 255, 0.3);
  border-radius: 2px;
  margin-left: ${props => props.theme.spacing.xs};
  position: relative;
  overflow: hidden;
`;

const ConfidenceFill = styled.div`
  height: 100%;
  background-color: ${props => props.color};
  width: ${props => props.percentage}%;
  border-radius: 2px;
  transition: width 0.3s ease;
`;

const AccessLevelIndicator = styled.div`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: ${props => props.color};
  margin-left: ${props => props.theme.spacing.xs};
`;

const PersonTypeIndicator = ({
  personType = 'unknown',
  personName = 'Unknown',
  confidence = 0,
  isMatch = false,
  accessLevel = null,
  alertRecommended = false,
  showConfidence = true,
  showAccessLevel = true,
  size = 'medium' // 'small', 'medium', 'large'
}) => {

  // Person type configurations
  const personTypeConfig = {
    resident: {
      icon: '🏠',
      label: 'Resident',
      bgColor: 'rgba(76, 175, 80, 0.2)',
      textColor: '#2E7D32',
      borderColor: '#4CAF50'
    },
    staff: {
      icon: '👔',
      label: 'Staff',
      bgColor: 'rgba(33, 150, 243, 0.2)',
      textColor: '#1565C0',
      borderColor: '#2196F3'
    },
    worker: {
      icon: '🔧',
      label: 'Worker',
      bgColor: 'rgba(255, 165, 0, 0.2)',
      textColor: '#E65100',
      borderColor: '#FF9800'
    },
    visitor: {
      icon: '👋',
      label: 'Visitor',
      bgColor: 'rgba(255, 235, 59, 0.2)',
      textColor: '#F57F17',
      borderColor: '#FFEB3B'
    },
    contractor: {
      icon: '🛠️',
      label: 'Contractor',
      bgColor: 'rgba(255, 152, 0, 0.2)',
      textColor: '#E65100',
      borderColor: '#FF9800'
    },
    vip: {
      icon: '⭐',
      label: 'VIP',
      bgColor: 'rgba(156, 39, 176, 0.2)',
      textColor: '#7B1FA2',
      borderColor: '#9C27B0'
    },
    blacklist: {
      icon: '🚫',
      label: 'Blacklisted',
      bgColor: 'rgba(244, 67, 54, 0.3)',
      textColor: '#C62828',
      borderColor: '#F44336'
    },
    unknown: {
      icon: '❓',
      label: 'Unknown',
      bgColor: 'rgba(158, 158, 158, 0.2)',
      textColor: '#424242',
      borderColor: '#9E9E9E'
    }
  };

  // Access level colors
  const accessLevelColors = {
    full: '#4CAF50',
    limited: '#FF9800',
    restricted: '#F44336',
    none: '#9E9E9E'
  };

  const config = personTypeConfig[personType] || personTypeConfig.unknown;
  
  // Determine confidence color
  const getConfidenceColor = (conf) => {
    if (conf >= 0.8) return '#4CAF50'; // Green
    if (conf >= 0.6) return '#FF9800'; // Orange  
    return '#F44336'; // Red
  };

  // Size configurations
  const sizeConfig = {
    small: {
      padding: '2px 6px',
      fontSize: '11px',
      iconSize: '12px'
    },
    medium: {
      padding: '4px 8px', 
      fontSize: '13px',
      iconSize: '14px'
    },
    large: {
      padding: '6px 12px',
      fontSize: '15px',
      iconSize: '16px'
    }
  };

  const currentSize = sizeConfig[size] || sizeConfig.medium;

  return (
    <IndicatorContainer
      bgColor={config.bgColor}
      textColor={config.textColor}
      borderColor={alertRecommended ? '#F44336' : config.borderColor}
      alert={alertRecommended}
      style={{
        padding: currentSize.padding,
        fontSize: currentSize.fontSize
      }}
    >
      <Icon style={{ fontSize: currentSize.iconSize }}>
        {config.icon}
      </Icon>
      
      <Label>
        {isMatch ? personName : config.label}
      </Label>

      {showConfidence && isMatch && (
        <ConfidenceBar>
          <ConfidenceFill 
            percentage={confidence * 100}
            color={getConfidenceColor(confidence)}
          />
        </ConfidenceBar>
      )}

      {showAccessLevel && accessLevel && (
        <AccessLevelIndicator 
          color={accessLevelColors[accessLevel] || accessLevelColors.none}
          title={`Access Level: ${accessLevel}`}
        />
      )}
    </IndicatorContainer>
  );
};

// Export sub-components for flexible usage
export const PersonTypeBadge = ({ personType, size = 'small' }) => {
  const config = {
    resident: { icon: 'R', color: '#4CAF50' },
    staff: { icon: 'S', color: '#2196F3' },
    worker: { icon: 'W', color: '#FF9800' },
    visitor: { icon: 'V', color: '#FFEB3B' },
    contractor: { icon: 'C', color: '#FF9800' },
    vip: { icon: '★', color: '#9C27B0' },
    blacklist: { icon: '!', color: '#F44336' },
    unknown: { icon: '?', color: '#9E9E9E' }
  };

  const BadgeCircle = styled.div`
    width: ${size === 'small' ? '20px' : size === 'large' ? '32px' : '24px'};
    height: ${size === 'small' ? '20px' : size === 'large' ? '32px' : '24px'};
    border-radius: 50%;
    background-color: ${props => props.color};
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: bold;
    font-size: ${size === 'small' ? '10px' : size === 'large' ? '14px' : '12px'};
    border: 2px solid rgba(255, 255, 255, 0.3);
  `;

  const typeConfig = config[personType] || config.unknown;

  return (
    <BadgeCircle color={typeConfig.color}>
      {typeConfig.icon}
    </BadgeCircle>
  );
};

export const ConfidenceIndicator = ({ confidence, size = 'medium' }) => {
  const ConfidenceContainer = styled.div`
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: ${size === 'small' ? '10px' : size === 'large' ? '14px' : '12px'};
  `;

  const getConfidenceColor = (conf) => {
    if (conf >= 0.8) return '#4CAF50';
    if (conf >= 0.6) return '#FF9800';
    return '#F44336';
  };

  return (
    <ConfidenceContainer>
      <span style={{ color: getConfidenceColor(confidence) }}>
        {(confidence * 100).toFixed(0)}%
      </span>
      <ConfidenceBar style={{ width: size === 'small' ? '20px' : '30px' }}>
        <ConfidenceFill 
          percentage={confidence * 100}
          color={getConfidenceColor(confidence)}
        />
      </ConfidenceBar>
    </ConfidenceContainer>
  );
};

export default PersonTypeIndicator;
