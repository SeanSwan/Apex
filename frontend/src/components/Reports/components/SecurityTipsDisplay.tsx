/**
 * Security Tips Display Component - Day-based Security Recommendations
 * Extracted from AIReportAssistant for better modularity
 * Production-ready security tips with interactive features and customization
 */

import React, { useState, useMemo, useEffect } from 'react';
import styled from 'styled-components';
import {
  Shield,
  Lightbulb,
  ChevronRight,
  Star,
  Clock,
  Users,
  AlertCircle,
  CheckCircle,
  Bookmark,
  RotateCcw,
  Filter,
  Search
} from 'lucide-react';

import {
  getSecurityTipsForDay,
  getDayIndex,
  AI_RESPONSIVE_BREAKPOINTS,
  aiAnimations
} from '../constants/aiAssistantConstants';
import {
  TipsSection,
  TipsHeader,
  MultiColumnLayout,
  TipContainer,
  TipTitle,
  TipContent,
  StatusMessage,
  StatusDescription
} from '../shared/AIAssistantStyledComponents';

/**
 * Security tip interface with enhanced metadata
 */
export interface SecurityTip {
  title: string;
  content: string;
  category?: 'access' | 'surveillance' | 'patrol' | 'compliance' | 'personnel' | 'emergency';
  priority?: 'low' | 'medium' | 'high';
  estimatedTime?: string;
  applicability?: 'all' | 'weekday' | 'weekend';
  id?: string;
}

/**
 * Security tips display props
 */
export interface SecurityTipsDisplayProps {
  day: string;
  maxTips?: number;
  showCategories?: boolean;
  showPriority?: boolean;
  showSearch?: boolean;
  enableFavorites?: boolean;
  onTipSelect?: (tip: SecurityTip) => void;
  onFavoriteToggle?: (tipId: string, isFavorite: boolean) => void;
  className?: string;
  layout?: 'grid' | 'list' | 'columns';
  compactMode?: boolean;
}

/**
 * Tip filter options
 */
export interface TipFilterOptions {
  category?: string;
  priority?: string;
  searchQuery?: string;
  showFavoritesOnly?: boolean;
}

/**
 * Enhanced styled components
 */
const TipsContainer = styled.div<{ $layout: 'grid' | 'list' | 'columns'; $compact: boolean }>`
  ${props => {
    if (props.$layout === 'grid') {
      return `
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
        gap: ${props.$compact ? '0.75rem' : '1rem'};
      `;
    } else if (props.$layout === 'list') {
      return `
        display: flex;
        flex-direction: column;
        gap: ${props.$compact ? '0.5rem' : '0.75rem'};
      `;
    } else {
      return `
        columns: 2;
        column-gap: 2rem;
        column-fill: balance;
      `;
    }
  }}

  @media (max-width: ${AI_RESPONSIVE_BREAKPOINTS.tablet}) {
    ${props => props.$layout === 'grid' ? `
      grid-template-columns: 1fr;
    ` : props.$layout === 'columns' ? `
      columns: 1;
      column-gap: 0;
    ` : ''}
  }
`;

const EnhancedTipContainer = styled(TipContainer)<{ 
  $priority?: string; 
  $compact: boolean;
  $interactive: boolean;
}>`
  position: relative;
  cursor: ${props => props.$interactive ? 'pointer' : 'default'};
  padding: ${props => props.$compact ? '0.75rem' : '1rem'};
  animation: ${aiAnimations.fadeIn} 0.3s ease-out;
  break-inside: avoid;
  
  border-left: 4px solid ${props => {
    switch (props.$priority) {
      case 'high': return '#ef4444';
      case 'medium': return '#f59e0b';
      case 'low': return '#10b981';
      default: return '#7c3aed';
    }
  }};

  &:hover {
    transform: ${props => props.$interactive ? 'translateY(-2px)' : 'none'};
    box-shadow: ${props => props.$interactive ? '0 4px 12px rgba(124, 58, 237, 0.15)' : '0 2px 8px rgba(124, 58, 237, 0.1)'};
  }

  &:active {
    transform: ${props => props.$interactive ? 'translateY(0)' : 'none'};
  }
`;

const TipHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 0.5rem;
`;

const TipTitleEnhanced = styled(TipTitle)<{ $compact: boolean }>`
  font-size: ${props => props.$compact ? '0.875rem' : '0.9375rem'};
  line-height: 1.4;
  flex: 1;
  margin-right: 0.5rem;
  margin-bottom: 0;
`;

const TipActions = styled.div`
  display: flex;
  align-items: center;
  gap: 0.375rem;
`;

const TipActionButton = styled.button<{ $active?: boolean; $variant?: 'favorite' | 'expand' }>`
  background: ${props => props.$active ? 
    props.$variant === 'favorite' ? '#fef3c7' : '#e0e7ff' 
    : 'transparent'
  };
  border: 1px solid ${props => props.$active ? 
    props.$variant === 'favorite' ? '#f59e0b' : '#7c3aed'
    : '#e5e7eb'
  };
  padding: 0.25rem;
  border-radius: 4px;
  color: ${props => props.$active ? 
    props.$variant === 'favorite' ? '#f59e0b' : '#7c3aed'
    : '#6b7280'
  };
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: ${props => 
      props.$variant === 'favorite' ? '#fef3c7' : '#e0e7ff'
    };
    border-color: ${props => 
      props.$variant === 'favorite' ? '#f59e0b' : '#7c3aed'
    };
    color: ${props => 
      props.$variant === 'favorite' ? '#f59e0b' : '#7c3aed'
    };
  }
`;

const TipMetadata = styled.div<{ $compact: boolean }>`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: ${props => props.$compact ? '0.375rem' : '0.5rem'};
  font-size: 0.75rem;
  color: #6b7280;
`;

const TipBadge = styled.span<{ $type: 'category' | 'priority' | 'time' }>`
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.125rem 0.375rem;
  border-radius: 12px;
  font-size: 0.6875rem;
  font-weight: 500;
  
  ${props => {
    switch (props.$type) {
      case 'category':
        return `
          background: #e0f2fe;
          color: #0369a1;
        `;
      case 'priority':
        return `
          background: #fef3c7;
          color: #d97706;
        `;
      case 'time':
        return `
          background: #f3e8ff;
          color: #7c3aed;
        `;
      default:
        return `
          background: #f3f4f6;
          color: #4b5563;
        `;
    }
  }}
`;

const FilterContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-bottom: 1rem;
  padding: 1rem;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 6px;

  @media (max-width: ${AI_RESPONSIVE_BREAKPOINTS.mobile}) {
    flex-direction: column;
    gap: 0.5rem;
  }
`;

const FilterGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const FilterLabel = styled.label`
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
  white-space: nowrap;
`;

const FilterSelect = styled.select`
  padding: 0.375rem 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  font-size: 0.875rem;
  background: white;
  cursor: pointer;

  &:focus {
    outline: none;
    border-color: #7c3aed;
    box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.1);
  }
`;

const SearchInput = styled.input`
  padding: 0.375rem 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  font-size: 0.875rem;
  min-width: 200px;
  
  &:focus {
    outline: none;
    border-color: #7c3aed;
    box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.1);
  }

  &::placeholder {
    color: #9ca3af;
  }

  @media (max-width: ${AI_RESPONSIVE_BREAKPOINTS.mobile}) {
    min-width: auto;
    width: 100%;
  }
`;

const TipStats = styled.div`
  display: flex;
  justify-content: center;
  gap: 2rem;
  margin-bottom: 1rem;
  padding: 0.75rem;
  background: #f8fafc;
  border-radius: 6px;
  
  @media (max-width: ${AI_RESPONSIVE_BREAKPOINTS.mobile}) {
    gap: 1rem;
  }
`;

const StatItem = styled.div`
  text-align: center;
`;

const StatValue = styled.div`
  font-size: 1.25rem;
  font-weight: 700;
  color: #7c3aed;
`;

const StatLabel = styled.div`
  font-size: 0.75rem;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

/**
 * Enhanced SecurityTipsDisplay component
 */
export const SecurityTipsDisplay: React.FC<SecurityTipsDisplayProps> = ({
  day,
  maxTips = 4,
  showCategories = true,
  showPriority = true,
  showSearch = false,
  enableFavorites = false,
  onTipSelect,
  onFavoriteToggle,
  className,
  layout = 'columns',
  compactMode = false
}) => {
  const [filters, setFilters] = useState<TipFilterOptions>({});
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [expandedTips, setExpandedTips] = useState<Set<string>>(new Set());

  // Enhanced tips with metadata
  const enhancedTips = useMemo(() => {
    const baseTips = getSecurityTipsForDay(day);
    
    return baseTips.map((tip, index) => ({
      ...tip,
      id: `${day}-${index}`,
      category: categorizeSecurityTip(tip.title, tip.content),
      priority: prioritizeSecurityTip(tip.title, tip.content, day),
      estimatedTime: estimateTimeForTip(tip.content),
      applicability: determineApplicability(day)
    } as SecurityTip));
  }, [day]);

  // Filtered tips based on current filters
  const filteredTips = useMemo(() => {
    let tips = enhancedTips;

    // Apply category filter
    if (filters.category && filters.category !== 'all') {
      tips = tips.filter(tip => tip.category === filters.category);
    }

    // Apply priority filter
    if (filters.priority && filters.priority !== 'all') {
      tips = tips.filter(tip => tip.priority === filters.priority);
    }

    // Apply search filter
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      tips = tips.filter(tip => 
        tip.title.toLowerCase().includes(query) ||
        tip.content.toLowerCase().includes(query)
      );
    }

    // Apply favorites filter
    if (filters.showFavoritesOnly) {
      tips = tips.filter(tip => favorites.has(tip.id!));
    }

    return tips.slice(0, maxTips);
  }, [enhancedTips, filters, maxTips, favorites]);

  // Load favorites from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('security_tips_favorites');
      if (stored) {
        setFavorites(new Set(JSON.parse(stored)));
      }
    } catch (error) {
      console.warn('Error loading favorites:', error);
    }
  }, []);

  // Save favorites to localStorage when changed
  useEffect(() => {
    try {
      localStorage.setItem('security_tips_favorites', JSON.stringify([...favorites]));
    } catch (error) {
      console.warn('Error saving favorites:', error);
    }
  }, [favorites]);

  const handleFavoriteToggle = (tipId: string) => {
    const newFavorites = new Set(favorites);
    const isFavorite = newFavorites.has(tipId);
    
    if (isFavorite) {
      newFavorites.delete(tipId);
    } else {
      newFavorites.add(tipId);
    }
    
    setFavorites(newFavorites);
    onFavoriteToggle?.(tipId, !isFavorite);
  };

  const handleTipExpand = (tipId: string) => {
    const newExpanded = new Set(expandedTips);
    if (newExpanded.has(tipId)) {
      newExpanded.delete(tipId);
    } else {
      newExpanded.add(tipId);
    }
    setExpandedTips(newExpanded);
  };

  const updateFilter = (key: keyof TipFilterOptions, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({});
  };

  const categories = ['all', 'access', 'surveillance', 'patrol', 'compliance', 'personnel', 'emergency'];
  const priorities = ['all', 'high', 'medium', 'low'];

  if (filteredTips.length === 0 && Object.keys(filters).length === 0) {
    return (
      <TipsSection className={className}>
        <StatusMessage $variant="info">
          No security tips available for {day}
        </StatusMessage>
        <StatusDescription>
          Security tips help maintain optimal security protocols throughout different days of the week.
        </StatusDescription>
      </TipsSection>
    );
  }

  return (
    <TipsSection className={className}>
      <TipsHeader>
        <Lightbulb size={16} />
        Security Tips for {day}
        {enhancedTips.length > maxTips && (
          <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>
            (Showing {filteredTips.length} of {enhancedTips.length})
          </span>
        )}
      </TipsHeader>

      {/* Statistics */}
      <TipStats>
        <StatItem>
          <StatValue>{filteredTips.length}</StatValue>
          <StatLabel>Tips Shown</StatLabel>
        </StatItem>
        <StatItem>
          <StatValue>{favorites.size}</StatValue>
          <StatLabel>Favorites</StatLabel>
        </StatItem>
        <StatItem>
          <StatValue>{filteredTips.filter(t => t.priority === 'high').length}</StatValue>
          <StatLabel>High Priority</StatLabel>
        </StatItem>
      </TipStats>

      {/* Filters */}
      {(showSearch || showCategories || showPriority) && (
        <FilterContainer>
          {showCategories && (
            <FilterGroup>
              <FilterLabel htmlFor="category-filter">Category:</FilterLabel>
              <FilterSelect
                id="category-filter"
                value={filters.category || 'all'}
                onChange={(e) => updateFilter('category', e.target.value)}
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>
                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </option>
                ))}
              </FilterSelect>
            </FilterGroup>
          )}

          {showPriority && (
            <FilterGroup>
              <FilterLabel htmlFor="priority-filter">Priority:</FilterLabel>
              <FilterSelect
                id="priority-filter"
                value={filters.priority || 'all'}
                onChange={(e) => updateFilter('priority', e.target.value)}
              >
                {priorities.map(priority => (
                  <option key={priority} value={priority}>
                    {priority.charAt(0).toUpperCase() + priority.slice(1)}
                  </option>
                ))}
              </FilterSelect>
            </FilterGroup>
          )}

          {showSearch && (
            <FilterGroup>
              <Search size={16} color="#6b7280" />
              <SearchInput
                type="text"
                placeholder="Search tips..."
                value={filters.searchQuery || ''}
                onChange={(e) => updateFilter('searchQuery', e.target.value)}
              />
            </FilterGroup>
          )}

          {enableFavorites && (
            <FilterGroup>
              <FilterLabel>
                <input
                  type="checkbox"
                  checked={filters.showFavoritesOnly || false}
                  onChange={(e) => updateFilter('showFavoritesOnly', e.target.checked)}
                  style={{ marginRight: '0.5rem' }}
                />
                Favorites Only
              </FilterLabel>
            </FilterGroup>
          )}

          {Object.keys(filters).length > 0 && (
            <TipActionButton onClick={clearFilters}>
              <RotateCcw size={14} />
            </TipActionButton>
          )}
        </FilterContainer>
      )}

      {/* Tips Display */}
      {filteredTips.length > 0 ? (
        <TipsContainer $layout={layout} $compact={compactMode}>
          {filteredTips.map((tip) => (
            <EnhancedTipContainer
              key={tip.id}
              $priority={tip.priority}
              $compact={compactMode}
              $interactive={!!onTipSelect}
              onClick={() => onTipSelect?.(tip)}
            >
              <TipHeader>
                <TipTitleEnhanced $compact={compactMode}>
                  <Shield size={14} />
                  {tip.title}
                </TipTitleEnhanced>
                
                <TipActions>
                  {enableFavorites && (
                    <TipActionButton
                      $active={favorites.has(tip.id!)}
                      $variant="favorite"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleFavoriteToggle(tip.id!);
                      }}
                    >
                      {favorites.has(tip.id!) ? <Star size={12} fill="currentColor" /> : <Star size={12} />}
                    </TipActionButton>
                  )}
                  
                  <TipActionButton
                    $active={expandedTips.has(tip.id!)}
                    $variant="expand"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleTipExpand(tip.id!);
                    }}
                  >
                    <ChevronRight 
                      size={12} 
                      style={{ 
                        transform: expandedTips.has(tip.id!) ? 'rotate(90deg)' : 'rotate(0deg)',
                        transition: 'transform 0.2s ease'
                      }} 
                    />
                  </TipActionButton>
                </TipActions>
              </TipHeader>

              {(showCategories || showPriority || tip.estimatedTime) && (
                <TipMetadata $compact={compactMode}>
                  {showCategories && tip.category && (
                    <TipBadge $type="category">
                      <Users size={10} />
                      {tip.category}
                    </TipBadge>
                  )}
                  
                  {showPriority && tip.priority && (
                    <TipBadge $type="priority">
                      <AlertCircle size={10} />
                      {tip.priority}
                    </TipBadge>
                  )}
                  
                  {tip.estimatedTime && (
                    <TipBadge $type="time">
                      <Clock size={10} />
                      {tip.estimatedTime}
                    </TipBadge>
                  )}
                </TipMetadata>
              )}

              <TipContent>
                {expandedTips.has(tip.id!) ? tip.content : `${tip.content.substring(0, 120)}${tip.content.length > 120 ? '...' : ''}`}
              </TipContent>
            </EnhancedTipContainer>
          ))}
        </TipsContainer>
      ) : (
        <StatusMessage $variant="warning">
          No tips match your current filters
        </StatusMessage>
      )}
    </TipsSection>
  );
};

/**
 * Utility functions for tip enhancement
 */
const categorizeSecurityTip = (title: string, content: string): string => {
  const titleLower = title.toLowerCase();
  const contentLower = content.toLowerCase();
  
  if (titleLower.includes('access') || contentLower.includes('credential') || contentLower.includes('entry')) {
    return 'access';
  } else if (titleLower.includes('camera') || titleLower.includes('surveillance') || contentLower.includes('monitor')) {
    return 'surveillance';
  } else if (titleLower.includes('patrol') || titleLower.includes('inspection') || contentLower.includes('walk')) {
    return 'patrol';
  } else if (titleLower.includes('compliance') || titleLower.includes('regulation') || contentLower.includes('requirement')) {
    return 'compliance';
  } else if (titleLower.includes('personnel') || titleLower.includes('staff') || contentLower.includes('team')) {
    return 'personnel';
  } else if (titleLower.includes('emergency') || titleLower.includes('incident') || contentLower.includes('response')) {
    return 'emergency';
  } else {
    return 'general';
  }
};

const prioritizeSecurityTip = (title: string, content: string, day: string): string => {
  const titleLower = title.toLowerCase();
  const contentLower = content.toLowerCase();
  
  // High priority indicators
  if (titleLower.includes('emergency') || titleLower.includes('critical') || 
      contentLower.includes('immediate') || contentLower.includes('urgent')) {
    return 'high';
  }
  
  // Weekend priorities
  if ((day === 'Saturday' || day === 'Sunday') && 
      (titleLower.includes('weekend') || titleLower.includes('reduced'))) {
    return 'high';
  }
  
  // Medium priority indicators
  if (titleLower.includes('check') || titleLower.includes('verify') || 
      contentLower.includes('ensure') || contentLower.includes('maintain')) {
    return 'medium';
  }
  
  return 'low';
};

const estimateTimeForTip = (content: string): string => {
  const wordCount = content.split(' ').length;
  
  if (wordCount < 30) return '< 5 min';
  if (wordCount < 60) return '5-10 min';
  if (wordCount < 100) return '10-15 min';
  return '15+ min';
};

const determineApplicability = (day: string): string => {
  if (day === 'Saturday' || day === 'Sunday') {
    return 'weekend';
  } else {
    return 'weekday';
  }
};

export default SecurityTipsDisplay;
