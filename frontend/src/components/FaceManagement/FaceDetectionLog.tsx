/**
 * APEX AI FACE DETECTION LOG COMPONENT
 * ====================================
 * Real-time face detection event monitoring
 * 
 * Features:
 * - Live detection stream
 * - Camera filtering
 * - Known/unknown face toggle
 * - Detection confidence display
 * - Image snapshots
 * - Alert generation tracking
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import styled from 'styled-components';
import {
  Eye,
  Camera,
  User,
  UserX,
  Clock,
  Search,
  Filter,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  X,
  Play,
  Pause,
  Download,
  ZoomIn,
  MapPin,
  Loader
} from 'lucide-react';

// Styled Components
const LogContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  height: 100%;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
  
  @media (max-width: 768px) {
    flex-direction: column;
    align-items: stretch;
  }
`;

const Title = styled.h2`
  color: white;
  font-size: 1.3rem;
  font-weight: 600;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const HeaderControls = styled.div`
  display: flex;
  gap: 1rem;
  align-items: center;
  flex-wrap: wrap;
`;

const FilterGroup = styled.div`
  display: flex;
  gap: 0.5rem;
  align-items: center;
`;

const FilterSelect = styled.select`
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 6px;
  padding: 0.5rem;
  color: white;
  font-size: 0.9rem;
  cursor: pointer;
  
  &:focus {
    outline: none;
    border-color: #4ade80;
  }
  
  option {
    background: #1f2937;
    color: white;
  }
`;

const ToggleGroup = styled.div`
  display: flex;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 6px;
  overflow: hidden;
`;

const ToggleButton = styled.button`
  background: rgba(255, 255, 255, 0.1);
  border: none;
  color: white;
  padding: 0.5rem 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  
  &:hover {
    background: rgba(255, 255, 255, 0.2);
  }
  
  &.active {
    background: #4ade80;
    color: white;
  }
`;

const ActionButton = styled.button`
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 6px;
  color: white;
  padding: 0.5rem 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
  
  &:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.2);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  &.live {
    background: #ef4444;
    border-color: #ef4444;
    
    &:hover:not(:disabled) {
      background: #dc2626;
    }
  }
  
  &.paused {
    background: #4ade80;
    border-color: #4ade80;
    
    &:hover:not(:disabled) {
      background: #22c55e;
    }
  }
`;

const StatusBar = styled.div`
  background: rgba(255, 255, 255, 0.05);
  padding: 1rem;
  border-radius: 8px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.9rem;
  
  .status-left {
    display: flex;
    gap: 2rem;
    align-items: center;
  }
  
  .status-right {
    display: flex;
    gap: 1rem;
    align-items: center;
  }
  
  .status-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: rgba(255, 255, 255, 0.8);
    
    .status-value {
      color: white;
      font-weight: 600;
    }
    
    .status-indicator {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      
      &.live {
        background: #ef4444;
        animation: pulse 2s infinite;
      }
      
      &.paused {
        background: #6b7280;
      }
      
      &.error {
        background: #f59e0b;
      }
    }
  }
  
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }
`;

const DetectionsList = styled.div`
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const DetectionCard = styled.div`
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  padding: 1.5rem;
  transition: all 0.3s ease;
  position: relative;
  
  &:hover {
    background: rgba(255, 255, 255, 0.15);
    border-color: rgba(255, 255, 255, 0.3);
  }
  
  &.known-face {
    border-left: 4px solid #4ade80;
  }
  
  &.unknown-face {
    border-left: 4px solid #f59e0b;
  }
  
  &.high-confidence {
    border-left: 4px solid #3b82f6;
  }
`;

const DetectionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
`;

const DetectionInfo = styled.div`
  flex: 1;
`;

const DetectionTitle = styled.h3`
  color: white;
  font-size: 1.1rem;
  font-weight: 600;
  margin: 0 0 0.5rem 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const DetectionMeta = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.9rem;
  
  .meta-item {
    display: flex;
    align-items: center;
    gap: 0.25rem;
  }
`;

const DetectionActions = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const ActionIcon = styled.button`
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

const DetectionBody = styled.div`
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 1rem;
  align-items: center;
`;

const DetectionImage = styled.div`
  width: 80px;
  height: 80px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid rgba(255, 255, 255, 0.2);
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    border-color: #4ade80;
  }
  
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: 6px;
  }
  
  .placeholder {
    color: rgba(255, 255, 255, 0.5);
  }
`;

const DetectionDetails = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 1rem;
`;

const DetailItem = styled.div`
  .detail-label {
    color: rgba(255, 255, 255, 0.6);
    font-size: 0.75rem;
    margin-bottom: 0.25rem;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  
  .detail-value {
    color: white;
    font-weight: 600;
    font-size: 0.9rem;
  }
  
  .confidence-bar {
    width: 100%;
    height: 4px;
    background: rgba(255, 255, 255, 0.2);
    border-radius: 2px;
    overflow: hidden;
    margin-top: 0.25rem;
    
    .confidence-fill {
      height: 100%;
      background: linear-gradient(to right, #ef4444, #f59e0b, #4ade80);
      transition: width 0.3s ease;
    }
  }
`;

const AlertBadge = styled.span`
  background: #ef4444;
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.25rem;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 3rem 1rem;
  color: rgba(255, 255, 255, 0.6);
  
  .icon {
    margin-bottom: 1rem;
    opacity: 0.5;
  }
  
  h3 {
    color: white;
    margin: 0 0 0.5rem 0;
    font-size: 1.2rem;
  }
  
  p {
    margin: 0;
    font-size: 0.9rem;
  }
`;

const LoadingState = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 3rem;
  color: rgba(255, 255, 255, 0.6);
  gap: 1rem;
`;

// Interface
export interface FaceDetectionLogProps {
  className?: string;
}

const FaceDetectionLog: React.FC<FaceDetectionLogProps> = ({ className }) => {
  const [detections, setDetections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isLive, setIsLive] = useState(true);
  const [cameraFilter, setCameraFilter] = useState('');
  const [matchFilter, setMatchFilter] = useState('all');
  const [hoursFilter, setHoursFilter] = useState('24');
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    known: 0,
    unknown: 0,
    alerts: 0
  });
  
  const refreshInterval = useRef<NodeJS.Timeout | null>(null);
  
  // Load detections
  const loadDetections = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      
      const params = new URLSearchParams({
        hours: hoursFilter,
        limit: '50',
        offset: '0'
      });
      
      if (cameraFilter) params.append('camera_id', cameraFilter);
      if (matchFilter !== 'all') params.append('is_match', matchFilter);
      
      const response = await fetch(`/api/faces/detections?${params}`);
      const data = await response.json();
      
      if (data.success) {
        setDetections(data.data.detections);
        
        // Calculate stats
        const total = data.data.detections.length;
        const known = data.data.detections.filter(d => d.is_match).length;
        const unknown = total - known;
        const alerts = data.data.detections.filter(d => d.alert_generated).length;
        
        setStats({ total, known, unknown, alerts });
      }
      
    } catch (error) {
      console.error('Error loading detections:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [cameraFilter, matchFilter, hoursFilter]);
  
  // Setup live updates
  useEffect(() => {
    loadDetections();
    
    if (isLive) {
      refreshInterval.current = setInterval(() => {
        loadDetections(false);
      }, 5000); // Update every 5 seconds
    } else {
      if (refreshInterval.current) {
        clearInterval(refreshInterval.current);
        refreshInterval.current = null;
      }
    }
    
    return () => {
      if (refreshInterval.current) {
        clearInterval(refreshInterval.current);
      }
    };
  }, [loadDetections, isLive]);
  
  // Handle live toggle
  const toggleLive = useCallback(() => {
    setIsLive(prev => !prev);
  }, []);
  
  // Handle manual refresh
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadDetections(false);
  }, [loadDetections]);
  
  // Format timestamp
  const formatTimestamp = useCallback((timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    
    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }, []);
  
  // Get confidence color
  const getConfidenceColor = useCallback((confidence: number) => {
    if (confidence >= 0.8) return '#4ade80';
    if (confidence >= 0.6) return '#f59e0b';
    return '#ef4444';
  }, []);
  
  // Handle image zoom
  const handleImageZoom = useCallback((detectionId: string) => {
    // TODO: Implement image zoom modal
    console.log('Zoom image for detection:', detectionId);
  }, []);
  
  // Handle download snapshot
  const handleDownload = useCallback((detection: any) => {
    // TODO: Implement snapshot download
    console.log('Download snapshot for:', detection.detection_id);
  }, []);
  
  if (loading) {
    return (
      <LoadingState>
        <Loader size={24} className="animate-spin" />
        Loading detection log...
      </LoadingState>
    );
  }
  
  return (
    <LogContainer className={className}>
      <Header>
        <Title>
          <Eye size={20} />
          Live Detection Log
        </Title>
        
        <HeaderControls>
          <FilterGroup>
            <FilterSelect
              value={hoursFilter}
              onChange={(e) => setHoursFilter(e.target.value)}
            >
              <option value="1">Last Hour</option>
              <option value="6">Last 6 Hours</option>
              <option value="24">Last 24 Hours</option>
              <option value="168">Last Week</option>
            </FilterSelect>
            
            <FilterSelect
              value={cameraFilter}
              onChange={(e) => setCameraFilter(e.target.value)}
            >
              <option value="">All Cameras</option>
              <option value="CAM_001">Main Entrance</option>
              <option value="CAM_002">Lobby</option>
              <option value="CAM_003">Parking</option>
              <option value="CAM_004">Exit</option>
            </FilterSelect>
          </FilterGroup>
          
          <ToggleGroup>
            <ToggleButton
              className={matchFilter === 'all' ? 'active' : ''}
              onClick={() => setMatchFilter('all')}
            >
              All
            </ToggleButton>
            <ToggleButton
              className={matchFilter === 'true' ? 'active' : ''}
              onClick={() => setMatchFilter('true')}
            >
              <User size={14} />
              Known
            </ToggleButton>
            <ToggleButton
              className={matchFilter === 'false' ? 'active' : ''}
              onClick={() => setMatchFilter('false')}
            >
              <UserX size={14} />
              Unknown
            </ToggleButton>
          </ToggleGroup>
          
          <ActionButton
            className={isLive ? 'live' : 'paused'}
            onClick={toggleLive}
          >
            {isLive ? <Pause size={14} /> : <Play size={14} />}
            {isLive ? 'Live' : 'Paused'}
          </ActionButton>
          
          <ActionButton onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
            Refresh
          </ActionButton>
        </HeaderControls>
      </Header>
      
      {/* Status Bar */}
      <StatusBar>
        <div className="status-left">
          <div className="status-item">
            <div className={`status-indicator ${isLive ? 'live' : 'paused'}`}></div>
            <span className="status-value">{isLive ? 'LIVE' : 'PAUSED'}</span>
          </div>
          <div className="status-item">
            <span>Total:</span>
            <span className="status-value">{stats.total}</span>
          </div>
          <div className="status-item">
            <span>Known:</span>
            <span className="status-value" style={{ color: '#4ade80' }}>{stats.known}</span>
          </div>
          <div className="status-item">
            <span>Unknown:</span>
            <span className="status-value" style={{ color: '#f59e0b' }}>{stats.unknown}</span>
          </div>
        </div>
        <div className="status-right">
          <div className="status-item">
            <span>Alerts Generated:</span>
            <span className="status-value" style={{ color: '#ef4444' }}>{stats.alerts}</span>
          </div>
        </div>
      </StatusBar>
      
      <DetectionsList>
        {detections.length === 0 ? (
          <EmptyState>
            <Eye size={48} className="icon" />
            <h3>No Detections Found</h3>
            <p>No face detection events found for the selected time period and filters.</p>
          </EmptyState>
        ) : (
          detections.map((detection: any) => (
            <DetectionCard
              key={detection.detection_id}
              className={
                detection.is_match 
                  ? 'known-face' 
                  : detection.confidence >= 0.8 
                    ? 'high-confidence unknown-face' 
                    : 'unknown-face'
              }
            >
              <DetectionHeader>
                <DetectionInfo>
                  <DetectionTitle>
                    {detection.is_match ? (
                      <>
                        <User size={16} style={{ color: '#4ade80' }} />
                        {detection.matched_profile_name || 'Known Person'}
                      </>
                    ) : (
                      <>
                        <UserX size={16} style={{ color: '#f59e0b' }} />
                        Unknown Person
                      </>
                    )}
                    {detection.alert_generated && (
                      <AlertBadge>
                        <AlertTriangle size={12} />
                        Alert
                      </AlertBadge>
                    )}
                  </DetectionTitle>
                  
                  <DetectionMeta>
                    <div className="meta-item">
                      <Camera size={14} />
                      <span>{detection.camera_id || 'Unknown Camera'}</span>
                    </div>
                    <div className="meta-item">
                      <Clock size={14} />
                      <span>{formatTimestamp(detection.detected_at)}</span>
                    </div>
                    <div className="meta-item">
                      <MapPin size={14} />
                      <span>{detection.location || 'Unknown Location'}</span>
                    </div>
                  </DetectionMeta>
                </DetectionInfo>
                
                <DetectionActions>
                  <ActionIcon 
                    onClick={() => handleImageZoom(detection.detection_id)}
                    title="View Full Image"
                  >
                    <ZoomIn size={16} />
                  </ActionIcon>
                  <ActionIcon 
                    onClick={() => handleDownload(detection)}
                    title="Download Snapshot"
                  >
                    <Download size={16} />
                  </ActionIcon>
                </DetectionActions>
              </DetectionHeader>
              
              <DetectionBody>
                <DetectionImage onClick={() => handleImageZoom(detection.detection_id)}>
                  {detection.face_image_url ? (
                    <img src={detection.face_image_url} alt="Detected face" />
                  ) : (
                    <User size={32} className="placeholder" />
                  )}
                </DetectionImage>
                
                <DetectionDetails>
                  <DetailItem>
                    <div className="detail-label">Confidence</div>
                    <div className="detail-value">
                      {(detection.confidence * 100).toFixed(1)}%
                    </div>
                    <div className="confidence-bar">
                      <div 
                        className="confidence-fill"
                        style={{ 
                          width: `${detection.confidence * 100}%`,
                          backgroundColor: getConfidenceColor(detection.confidence)
                        }}
                      />
                    </div>
                  </DetailItem>
                  
                  <DetailItem>
                    <div className="detail-label">Processing Time</div>
                    <div className="detail-value">
                      {detection.processing_time_ms || 0}ms
                    </div>
                  </DetailItem>
                  
                  <DetailItem>
                    <div className="detail-label">Face Position</div>
                    <div className="detail-value">
                      {detection.bbox_x !== null ? 
                        `${Math.round(detection.bbox_x * 100)}, ${Math.round(detection.bbox_y * 100)}` : 
                        'Unknown'
                      }
                    </div>
                  </DetailItem>
                  
                  <DetailItem>
                    <div className="detail-label">Detection ID</div>
                    <div className="detail-value">
                      {detection.detection_id.substring(0, 8)}...
                    </div>
                  </DetailItem>
                </DetectionDetails>
              </DetectionBody>
            </DetectionCard>
          ))
        )}
      </DetectionsList>
    </LogContainer>
  );
};

export default FaceDetectionLog;