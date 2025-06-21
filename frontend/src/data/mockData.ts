// Mock Data for Enhanced Report Builder - CORRECTED CLIENT LIST
import { ClientData, MetricsData, DailyReport, SecurityCode, DailyReportStatus } from '../types/reports';

// CORRECTED: Real property information from actual client data
export const mockClients: ClientData[] = [
  {
    id: '1',
    name: 'Bell Warner Center',
    siteName: 'Bell Warner Center',
    location: '21050 Kittridge St',
    city: 'Canoga Park',
    state: 'CA',
    zipCode: '91303',
    cameraType: 'Axis Fixed Dome',
    cameraDetails: 'Professional fixed dome surveillance system with advanced analytics',
    cameras: 15, // CORRECTED: Bell Warner Center has 15 cameras
    contactEmail: 'manager@bellwarnercenter.com',
    isActive: true,
    isVIP: true,
    isNew: false,
    lastReportDate: new Date().toISOString(),
    contacts: [
      {
        name: 'Sarah Johnson',
        email: 'sarah.johnson@bellwarnercenter.com',
        phone: '(818) 555-0123',
        isPrimary: true
      }
    ]
  },
  {
    id: '2',
    name: 'The Charlie Perris',
    siteName: 'The Charlie Perris',
    location: '2700 N Perris Blvd.',
    city: 'Perris',
    state: 'CA',
    zipCode: '92571',
    cameraType: 'Hikvision PTZ',
    cameraDetails: 'Advanced PTZ cameras with pan, tilt, and zoom capabilities',
    cameras: 30, // CORRECTED: The Charlie Perris has 30 cameras
    contactEmail: 'manager@thecharlieperris.com',
    isActive: true,
    isVIP: false,
    isNew: false,
    lastReportDate: new Date(Date.now() - 86400000).toISOString(), // Yesterday
    contacts: [
      {
        name: 'Charlie Property Manager',
        email: 'manager@thecharlieperris.com',
        phone: '(951) 555-0124',
        isPrimary: true
      }
    ]
  },
  {
    id: '3',
    name: 'Modera ARGYLE',
    siteName: 'Modera ARGYLE',
    location: '6220 Selma Avenue',
    city: 'Los Angeles',
    state: 'CA',
    zipCode: '90028',
    cameraType: 'Dahua PTZ',
    cameraDetails: 'High-performance PTZ surveillance system with AI analytics',
    cameras: 44, // CORRECTED: Modera ARGYLE has 44 cameras
    contactEmail: 'management@moderaargyle.com',
    isActive: true,
    isVIP: true,
    isNew: false,
    lastReportDate: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
    contacts: [
      {
        name: 'Modera Property Manager',
        email: 'manager@moderaargyle.com',
        phone: '(323) 555-0125',
        isPrimary: true
      }
    ]
  }
];

// Mock Metrics Data - Updated for Bell Warner Center defaults
export const mockMetricsData: MetricsData = {
  humanIntrusions: { 
    Monday: 8, 
    Tuesday: 5, 
    Wednesday: 12, 
    Thursday: 7, 
    Friday: 9, 
    Saturday: 4, 
    Sunday: 3 
  },
  vehicleIntrusions: { 
    Monday: 3, 
    Tuesday: 2, 
    Wednesday: 4, 
    Thursday: 3, 
    Friday: 5, 
    Saturday: 2, 
    Sunday: 0 
  },
  potentialThreats: 3,
  proactiveAlerts: 15,
  responseTime: 0.5, // Bell Warner Center premium response
  aiAccuracy: 99.3, // Bell Warner Center premium accuracy  
  totalCameras: 15, // CORRECTED: Bell Warner Center camera count
  camerasOnline: 15, // Show full availability
  totalMonitoringHours: 168, // HARDCODED: 24/7 for 1 week (24 × 7 days)
  operationalUptime: 99.3 // Bell Warner Center premium uptime
};

// Mock Daily Reports
export const mockDailyReports: DailyReport[] = [
  {
    day: 'Monday',
    content: 'Standard security patrol completed. No incidents reported. All entry points secure.',
    status: 'Completed' as DailyReportStatus,
    securityCode: 'Code 4' as SecurityCode,
    timestamp: new Date().toISOString()
  },
  {
    day: 'Tuesday', 
    content: 'Routine surveillance conducted. Minor delivery activity observed during business hours.',
    status: 'Completed' as DailyReportStatus,
    securityCode: 'Code 4' as SecurityCode,
    timestamp: new Date().toISOString()
  },
  {
    day: 'Wednesday',
    content: 'Increased foot traffic noted in main lobby area. All visitors properly screened.',
    status: 'Completed' as DailyReportStatus,
    securityCode: 'Code 3' as SecurityCode,
    timestamp: new Date().toISOString()
  },
  {
    day: 'Thursday',
    content: 'Security sweep conducted. Maintenance personnel access logged and monitored.',
    status: 'Completed' as DailyReportStatus,
    securityCode: 'Code 4' as SecurityCode,
    timestamp: new Date().toISOString()
  },
  {
    day: 'Friday',
    content: 'Weekend security protocol initiated. Additional surveillance on common areas.',
    status: 'Completed' as DailyReportStatus,
    securityCode: 'Code 3' as SecurityCode,
    timestamp: new Date().toISOString()
  },
  {
    day: 'Saturday',
    content: 'Quiet evening shift. Perimeter checks completed without incident.',
    status: 'Completed' as DailyReportStatus,
    securityCode: 'Code 4' as SecurityCode,
    timestamp: new Date().toISOString()
  },
  {
    day: 'Sunday',
    content: 'Regular Sunday operations. No security concerns or unusual activity detected.',
    status: 'Completed' as DailyReportStatus,
    securityCode: 'Code 4' as SecurityCode,
    timestamp: new Date().toISOString()
  }
];

// Function to generate metrics based on client camera count
export const generateMetricsForClient = (client: ClientData): MetricsData => {
  const baseCameras = client.cameras || 12;
  
  // Show full camera availability instead of uptime percentage
  const camerasOnline = baseCameras; // Always show full availability
  
  // Scale other metrics based on property size
  const scaleFactor = baseCameras / 12; // Scale relative to Highland Properties baseline
  
  console.log('🔧 Generating metrics for client:', {
    clientName: client.name,
    clientCameras: client.cameras,
    baseCameras,
    camerasOnline,
    scaleFactor
  });
  
  return {
    ...mockMetricsData,
    totalCameras: baseCameras,
    camerasOnline: camerasOnline, // Show full camera availability
    // HARDCODED: Always 168 hours (24/7 for 1 week)
    totalMonitoringHours: 168,
    // Adjust accuracy based on camera technology
    aiAccuracy: client.cameraType?.includes('4K') ? 99.3 : 
                client.cameraType?.includes('AI') ? 97.5 : 95.2,
    // Scale alerts based on property activity
    proactiveAlerts: Math.floor(mockMetricsData.proactiveAlerts * Math.sqrt(scaleFactor)),
    potentialThreats: Math.floor(mockMetricsData.potentialThreats * Math.sqrt(scaleFactor / 2)),
    // Better response time for premium properties
    responseTime: client.isVIP ? 0.5 : 1.2,
    // Higher uptime for premium systems
    operationalUptime: client.isVIP ? 99.3 : 95.1
  };
};

// Export all mock data
export default {
  mockClients,
  mockMetricsData,
  mockDailyReports,
  generateMetricsForClient
};
