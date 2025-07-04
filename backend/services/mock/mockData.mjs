/**
 * MOCK DATA SERVICE - FOR DEVELOPMENT WITHOUT DATABASE
 * ===================================================
 * Provides mock data for development and demo purposes
 * Use this while PostgreSQL is not available
 */

// Mock Users
export const mockUsers = [
  {
    id: 'user-001',
    username: 'admin',
    email: 'admin@apexai.com',
    role: 'admin',
    first_name: 'Admin',
    last_name: 'User',
    created_at: new Date().toISOString()
  },
  {
    id: 'user-002',
    username: 'guard01',
    email: 'guard01@apexai.com',
    role: 'guard',
    first_name: 'Security',
    last_name: 'Guard',
    created_at: new Date().toISOString()
  }
];

// Mock Properties
export const mockProperties = [
  {
    id: 'prop-001',
    name: 'Apex AI Headquarters',
    address: '123 Security Blvd, Tech City, CA 90210',
    type: 'commercial',
    status: 'active',
    client_id: 'user-001'
  },
  {
    id: 'prop-002', 
    name: 'Data Center Alpha',
    address: '456 Server St, Cloud City, CA 90211',
    type: 'data_center',
    status: 'active',
    client_id: 'user-001'
  }
];

// Mock Cameras for Apex AI
export const mockCameras = [
  {
    id: 'cam_entrance_1',
    name: 'Main Entrance',
    rtsp_url: 'rtsp://wowzaec2demo.streamlock.net/vod/mp4:BigBuckBunny_115k.mov',
    location: 'Building A - Ground Floor',
    status: 'active',
    property_id: 'prop-001'
  },
  {
    id: 'cam_parking_1',
    name: 'Parking Garage',
    rtsp_url: 'rtsp://wowzaec2demo.streamlock.net/vod/mp4:BigBuckBunny_115k.mov',
    location: 'Underground Parking',
    status: 'active',
    property_id: 'prop-001'
  },
  {
    id: 'cam_elevator_1',
    name: 'Elevator Bank',
    rtsp_url: 'rtsp://wowzaec2demo.streamlock.net/vod/mp4:BigBuckBunny_115k.mov',
    location: 'Building A - Lobby',
    status: 'active',
    property_id: 'prop-001'
  },
  {
    id: 'cam_rooftop_1',
    name: 'Rooftop Access',
    rtsp_url: 'rtsp://wowzaec2demo.streamlock.net/vod/mp4:BigBuckBunny_115k.mov',
    location: 'Building A - Roof',
    status: 'active',
    property_id: 'prop-001'
  }
];

// Mock AI Alerts
export const mockAIAlerts = [
  {
    id: 'alert-001',
    alert_type: 'unknown_person',
    camera_id: 'cam_entrance_1',
    confidence: 0.87,
    description: 'Unknown person detected at main entrance',
    timestamp: new Date().toISOString(),
    priority: 'high',
    status: 'active'
  },
  {
    id: 'alert-002',
    alert_type: 'loitering',
    camera_id: 'cam_parking_1',
    confidence: 0.92,
    description: 'Person loitering in parking garage for 5+ minutes',
    timestamp: new Date(Date.now() - 300000).toISOString(), // 5 minutes ago
    priority: 'medium',
    status: 'resolved'
  }
];

// Mock Reports
export const mockReports = [
  {
    id: 'report-001',
    title: 'Daily Security Report',
    property_id: 'prop-001',
    guard_id: 'user-002',
    status: 'completed',
    created_at: new Date().toISOString(),
    total_incidents: 2,
    total_patrols: 8,
    ai_detections: 15
  }
];

/**
 * Mock API Service - Simple in-memory data operations
 */
export class MockDataService {
  constructor() {
    this.users = [...mockUsers];
    this.properties = [...mockProperties];
    this.cameras = [...mockCameras];
    this.aiAlerts = [...mockAIAlerts];
    this.reports = [...mockReports];
  }

  // User operations
  async getUsers() {
    return this.users;
  }

  async getUserById(id) {
    return this.users.find(user => user.id === id);
  }

  async getUserByUsername(username) {
    return this.users.find(user => user.username === username);
  }

  // Property operations
  async getProperties() {
    return this.properties;
  }

  async getPropertyById(id) {
    return this.properties.find(prop => prop.id === id);
  }

  // Camera operations
  async getCameras() {
    return this.cameras;
  }

  async getCameraById(id) {
    return this.cameras.find(cam => cam.id === id);
  }

  async getCamerasByProperty(propertyId) {
    return this.cameras.filter(cam => cam.property_id === propertyId);
  }

  // AI Alert operations
  async getAIAlerts() {
    return this.aiAlerts.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }

  async createAIAlert(alertData) {
    const alert = {
      id: `alert-${Date.now()}`,
      ...alertData,
      timestamp: new Date().toISOString()
    };
    this.aiAlerts.unshift(alert);
    return alert;
  }

  async updateAIAlert(id, updates) {
    const index = this.aiAlerts.findIndex(alert => alert.id === id);
    if (index !== -1) {
      this.aiAlerts[index] = { ...this.aiAlerts[index], ...updates };
      return this.aiAlerts[index];
    }
    return null;
  }

  // Report operations
  async getReports() {
    return this.reports.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }

  async getReportById(id) {
    return this.reports.find(report => report.id === id);
  }

  // Health check
  async healthCheck() {
    return {
      status: 'healthy',
      mode: 'mock_data',
      timestamp: new Date().toISOString(),
      data_counts: {
        users: this.users.length,
        properties: this.properties.length,
        cameras: this.cameras.length,
        ai_alerts: this.aiAlerts.length,
        reports: this.reports.length
      }
    };
  }
}

// Create singleton instance
export const mockDataService = new MockDataService();

export default mockDataService;
