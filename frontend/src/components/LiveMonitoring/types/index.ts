// APEX AI LIVE MONITORING - TYPE DEFINITIONS
// Enhanced TypeScript interfaces for improved type safety and modularity

export interface CameraFeed {
  camera_id: string;
  name: string;
  location: string;
  property_id: string;
  property_name: string;
  rtsp_url: string;
  status: 'online' | 'offline' | 'error' | 'loading';
  stream_url?: string;
  last_frame?: string;
  ai_detections?: AIDetection[];
  face_detections?: FaceDetection[];
  priority: number; // 1-10, higher = more important
  zone: string;
  capabilities: CameraCapabilities;
}

export interface CameraCapabilities {
  supports_ptz: boolean;
  supports_audio: boolean;
  supports_night_vision: boolean;
  supports_zoom: boolean;
}

export interface AIDetection {
  detection_id: string;
  timestamp: string;
  detection_type: 'person' | 'vehicle' | 'weapon' | 'package' | 'animal';
  confidence: number;
  bounding_box: BoundingBox;
  alert_level: 'low' | 'medium' | 'high' | 'critical';
}

export interface FaceDetection {
  face_id: string;
  timestamp: string;
  person_id?: string; // null if unknown person
  name?: string;
  confidence: number;
  bounding_box: BoundingBox;
  is_known: boolean;
  threat_level: 'safe' | 'unknown' | 'watch_list' | 'threat';
}

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface GridConfig {
  layout: '4x4' | '6x6' | '8x8' | '10x10' | '12x12';
  auto_switch: boolean;
  switch_interval: number; // seconds
  display_mode: 'all' | 'property' | 'zone' | 'alerts' | 'priority';
  quality: 'thumbnail' | 'preview' | 'standard' | 'hd';
}

export interface Property {
  id: string;
  name: string;
  count: number;
}

export interface MonitoringStats {
  online: number;
  alerts: number;
  faceDetections: number;
  total: number;
}

export interface StreamingMessage {
  type: 'stream_started' | 'stream_status' | 'ai_detection' | 'face_detection';
  camera_id: string;
  stream_url?: string;
  status?: CameraFeed['status'];
  detection?: AIDetection | FaceDetection;
}

export interface CameraGridProps {
  cameras: CameraFeed[];
  gridConfig: GridConfig;
  selectedCamera: string | null;
  onCameraSelect: (cameraId: string) => void;
  onQualityChange: (quality: GridConfig['quality']) => void;
}

export interface CameraCardProps {
  camera: CameraFeed;
  isSelected: boolean;
  onSelect: (cameraId: string) => void;
  gridLayout: GridConfig['layout'];
}

export interface StatusBarProps {
  streamingStatus: 'disconnected' | 'connecting' | 'connected';
  stats: MonitoringStats;
  properties: Property[];
  currentLayout: GridConfig['layout'];
  currentQuality: GridConfig['quality'];
  currentPage: number;
  totalPages: number;
  autoSwitchTimer?: number;
}

export interface ControlsBarProps {
  gridConfig: GridConfig;
  properties: Property[];
  searchTerm: string;
  filterProperty: string;
  onLayoutChange: (layout: GridConfig['layout']) => void;
  onAutoSwitchToggle: () => void;
  onQualityChange: (quality: GridConfig['quality']) => void;
  onDisplayModeChange: (mode: GridConfig['display_mode']) => void;
  onSwitchIntervalChange: (interval: number) => void;
  onSearchChange: (term: string) => void;
  onFilterPropertyChange: (propertyId: string) => void;
}

export interface DetectionOverlayProps {
  aiDetections?: AIDetection[];
  faceDetections?: FaceDetection[];
  isSelected: boolean;
}

export interface CameraControlsProps {
  camera: CameraFeed;
  onZoom?: () => void;
  onAudio?: () => void;
  onFullscreen?: () => void;
  onPTZ?: (direction: 'up' | 'down' | 'left' | 'right') => void;
}
