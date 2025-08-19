#!/usr/bin/env node

/**
 * APEX AI - COMPREHENSIVE TEST DATA POPULATION
 * ==========================================
 * Creates realistic demo data for the client portal including:
 * - Test client companies with properties
 * - Client portal users with proper permissions
 * - Realistic incidents with various types and severities
 * - Evidence files and metadata
 * - Contact lists and standard operating procedures
 */

import dotenv from 'dotenv';
import { Sequelize } from 'sequelize';
import bcrypt from 'bcryptjs';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env') });

class TestDataPopulator {
  constructor() {
    this.sequelize = new Sequelize({
      dialect: 'postgres',
      host: process.env.PG_HOST || 'localhost',
      port: parseInt(process.env.PG_PORT) || 5432,
      database: process.env.PG_DB || 'apex',
      username: process.env.PG_USER || 'postgres',
      password: process.env.PG_PASSWORD || '',
      logging: false,
      define: {
        timestamps: true,
        underscored: false // Use camelCase for new tables
      }
    });
  }

  async validateConnection() {
    console.log('🔌 Validating database connection...');
    try {
      await this.sequelize.authenticate();
      console.log('✅ Database connection successful');
      return true;
    } catch (error) {
      console.error('❌ Database connection failed:', error.message);
      return false;
    }
  }

  async createClients() {
    console.log('\n🏢 Creating test client companies...');
    
    const clientsData = [
      {
        name: 'Luxe Apartments Management',
        email: 'contact@luxeapartments.com',
        phoneNumber: '+1-555-0123',
        address: '1500 Ocean Drive, Miami Beach, FL 33139',
        contractStart: '2024-01-01',
        contractEnd: '2025-12-31',
        isActive: true
      },
      {
        name: 'Metropolitan Housing Group',
        email: 'security@metrohousing.com',
        phoneNumber: '+1-555-0456',
        address: '2200 Market Street, Philadelphia, PA 19103',
        contractStart: '2024-06-01',
        contractEnd: '2026-05-31',
        isActive: true
      },
      {
        name: 'Prestige Property Partners',
        email: 'info@prestigeproperties.com',
        phoneNumber: '+1-555-0789',
        address: '8888 Sunset Boulevard, West Hollywood, CA 90069',
        contractStart: '2023-09-01',
        contractEnd: '2025-08-31',
        isActive: true
      }
    ];

    const clients = [];
    for (const clientData of clientsData) {
      try {
        const [client] = await this.sequelize.query(`
          INSERT INTO "Clients" (name, email, "phoneNumber", address, "contractStart", "contractEnd", "isActive", "createdAt", "updatedAt")
          VALUES (:name, :email, :phoneNumber, :address, :contractStart, :contractEnd, :isActive, NOW(), NOW())
          ON CONFLICT (email) DO UPDATE SET 
            name = EXCLUDED.name,
            "updatedAt" = NOW()
          RETURNING *
        `, {
          replacements: clientData,
          type: this.sequelize.QueryTypes.INSERT
        });
        
        clients.push(client[0]);
        console.log(`   ✅ Created client: ${clientData.name}`);
      } catch (error) {
        console.error(`   ❌ Error creating client ${clientData.name}:`, error.message);
      }
    }
    
    return clients;
  }

  async createProperties(clients) {
    console.log('\n🏘️ Creating properties for clients...');
    
    const propertiesData = [
      // Luxe Apartments Management properties
      {
        name: 'Oceanview Luxury Towers',
        address: '1550 Ocean Drive, Miami Beach, FL 33139',
        clientId: clients[0].id,
        propertyType: 'luxury_apartment',
        accessCodes: JSON.stringify({
          mainEntrance: "2580",
          serviceEntrance: "9647",
          garageAccess: "1234",
          rooftopAccess: "8765"
        }),
        specialInstructions: 'High-end luxury property. White-glove service required. Valet parking available 24/7.',
        isActive: true
      },
      {
        name: 'South Beach Executive Suites',
        address: '1600 Collins Avenue, Miami Beach, FL 33139',
        clientId: clients[0].id,
        propertyType: 'executive_apartment',
        accessCodes: JSON.stringify({
          mainLobby: "3691",
          poolArea: "7418",
          fitnessCenter: "2580"
        }),
        specialInstructions: 'Corporate housing for executives. Maintain professional standards at all times.',
        isActive: true
      },
      
      // Metropolitan Housing Group properties
      {
        name: 'Center City Residences',
        address: '2250 Market Street, Philadelphia, PA 19103',
        clientId: clients[1].id,
        propertyType: 'mixed_residential',
        accessCodes: JSON.stringify({
          mainEntrance: "4792",
          courtyard: "8314",
          laundryRoom: "5926"
        }),
        specialInstructions: 'Mixed-income housing. Be mindful of diverse resident population.',
        isActive: true
      },
      {
        name: 'Liberty Square Apartments',
        address: '2300 Arch Street, Philadelphia, PA 19103',
        clientId: clients[1].id,
        propertyType: 'affordable_housing',
        accessCodes: JSON.stringify({
          main: "1776",
          community: "7634"
        }),
        specialInstructions: 'Government-subsidized housing. Follow all federal compliance requirements.',
        isActive: true
      },
      
      // Prestige Property Partners properties
      {
        name: 'Hollywood Hills Estate',
        address: '9000 Sunset Boulevard, West Hollywood, CA 90069',
        clientId: clients[2].id,
        propertyType: 'luxury_estate',
        accessCodes: JSON.stringify({
          mainGate: "9876",
          guestHouse: "5432",
          poolHouse: "1357"
        }),
        specialInstructions: 'Ultra-luxury private estate. Discretion and privacy are paramount.',
        isActive: true
      },
      {
        name: 'Sunset Strip Penthouses',
        address: '8900 Sunset Boulevard, West Hollywood, CA 90069',
        clientId: clients[2].id,
        propertyType: 'luxury_penthouse',
        accessCodes: JSON.stringify({
          privateLift: "2468",
          rooftop: "1357",
          wine_cellar: "9876"
        }),
        specialInstructions: 'Celebrity clientele. No photos, no social media, complete confidentiality.',
        isActive: true
      }
    ];

    const properties = [];
    for (const propertyData of propertiesData) {
      try {
        const [property] = await this.sequelize.query(`
          INSERT INTO "Properties" (name, address, "clientId", "propertyType", "accessCodes", "specialInstructions", "isActive", "createdAt", "updatedAt")
          VALUES (:name, :address, :clientId, :propertyType, :accessCodes, :specialInstructions, :isActive, NOW(), NOW())
          ON CONFLICT (name, "clientId") DO UPDATE SET 
            address = EXCLUDED.address,
            "updatedAt" = NOW()
          RETURNING *
        `, {
          replacements: propertyData,
          type: this.sequelize.QueryTypes.INSERT
        });
        
        properties.push(property[0]);
        console.log(`   ✅ Created property: ${propertyData.name}`);
      } catch (error) {
        console.error(`   ❌ Error creating property ${propertyData.name}:`, error.message);
      }
    }
    
    return properties;
  }

  async createClientPortalUsers(clients) {
    console.log('\n👤 Creating client portal users...');
    
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash('Demo123!', saltRounds);
    
    const usersData = [
      // Luxe Apartments Management users
      {
        firstName: 'Sarah',
        lastName: 'Johnson',
        email: 'sarah.johnson@luxeapartments.com',
        password: hashedPassword,
        role: 'client_admin',
        clientId: clients[0].id,
        phoneNumber: '+1-555-0124',
        isActive: true,
        clientPermissions: JSON.stringify({
          dashboard: true,
          incidents: true,
          evidence: true,
          analytics: true,
          settings: true
        })
      },
      {
        firstName: 'Michael',
        lastName: 'Chen',
        email: 'michael.chen@luxeapartments.com',
        password: hashedPassword,
        role: 'client_user',
        clientId: clients[0].id,
        phoneNumber: '+1-555-0125',
        isActive: true,
        clientPermissions: JSON.stringify({
          dashboard: true,
          incidents: true,
          evidence: false,
          analytics: false,
          settings: false
        })
      },
      
      // Metropolitan Housing Group users
      {
        firstName: 'David',
        lastName: 'Rodriguez',
        email: 'david.rodriguez@metrohousing.com',
        password: hashedPassword,
        role: 'client_admin',
        clientId: clients[1].id,
        phoneNumber: '+1-555-0457',
        isActive: true,
        clientPermissions: JSON.stringify({
          dashboard: true,
          incidents: true,
          evidence: true,
          analytics: true,
          settings: true
        })
      },
      
      // Prestige Property Partners users  
      {
        firstName: 'Alexandra',
        lastName: 'Williams',
        email: 'alexandra.williams@prestigeproperties.com',
        password: hashedPassword,
        role: 'client_admin',
        clientId: clients[2].id,
        phoneNumber: '+1-555-0790',
        isActive: true,
        clientPermissions: JSON.stringify({
          dashboard: true,
          incidents: true,
          evidence: true,
          analytics: true,
          settings: true
        })
      }
    ];

    const users = [];
    for (const userData of usersData) {
      try {
        const [user] = await this.sequelize.query(`
          INSERT INTO "Users" ("firstName", "lastName", email, password, role, "clientId", "phoneNumber", "isActive", "clientPermissions", "createdAt", "updatedAt")
          VALUES (:firstName, :lastName, :email, :password, :role, :clientId, :phoneNumber, :isActive, :clientPermissions, NOW(), NOW())
          ON CONFLICT (email) DO UPDATE SET 
            "firstName" = EXCLUDED."firstName",
            "lastName" = EXCLUDED."lastName",
            "updatedAt" = NOW()
          RETURNING *
        `, {
          replacements: userData,
          type: this.sequelize.QueryTypes.INSERT
        });
        
        users.push(user[0]);
        console.log(`   ✅ Created user: ${userData.firstName} ${userData.lastName} (${userData.email})`);
      } catch (error) {
        console.error(`   ❌ Error creating user ${userData.firstName} ${userData.lastName}:`, error.message);
      }
    }
    
    return users;
  }

  async createIncidents(clients, properties, users) {
    console.log('\n🚨 Creating realistic incident data...');
    
    // Generate incidents for the past 60 days
    const incidents = [];
    const incidentTypes = [
      'package_theft', 'unauthorized_access', 'vandalism', 'noise_complaint',
      'trespassing', 'suspicious_activity', 'alarm_activation', 'maintenance_emergency',
      'weapon_detection', 'violence', 'medical_emergency', 'fire_alarm'
    ];
    
    const severities = ['low', 'medium', 'high', 'critical'];
    const statuses = ['reported', 'investigating', 'resolved', 'closed'];
    
    // Create incidents for each property
    for (const property of properties) {
      const client = clients.find(c => c.id === property.clientId);
      const clientUsers = users.filter(u => u.clientId === property.clientId);
      
      // Generate 15-25 incidents per property over 60 days
      const incidentCount = Math.floor(Math.random() * 11) + 15; // 15-25 incidents
      
      for (let i = 0; i < incidentCount; i++) {
        const incidentType = incidentTypes[Math.floor(Math.random() * incidentTypes.length)];
        const severity = this.getSeverityForIncidentType(incidentType);
        const status = this.getStatusForSeverity(severity);
        
        // Generate realistic dates (past 60 days)
        const daysAgo = Math.floor(Math.random() * 60);
        const incidentDate = new Date();
        incidentDate.setDate(incidentDate.getDate() - daysAgo);
        
        // Generate resolution data if resolved
        let resolvedAt = null;
        let resolvedBy = null;
        let resolutionNotes = null;
        
        if (status === 'resolved' || status === 'closed') {
          const resolutionDays = Math.floor(Math.random() * 7) + 1; // 1-7 days to resolve
          resolvedAt = new Date(incidentDate);
          resolvedAt.setDate(resolvedAt.getDate() + resolutionDays);
          resolvedBy = clientUsers[Math.floor(Math.random() * clientUsers.length)]?.id;
          resolutionNotes = this.getResolutionNotes(incidentType);
        }
        
        const incidentData = {
          incidentNumber: `INC-${property.id}-${Date.now()}-${i}`,
          propertyId: property.id,
          clientId: property.clientId,
          incidentType: incidentType,
          severity: severity,
          status: status,
          location: this.getLocationForProperty(property.propertyType),
          description: this.getDescriptionForIncident(incidentType, severity),
          incidentDate: incidentDate.toISOString(),
          aiConfidence: this.getAIConfidence(incidentType, severity),
          reportedBy: clientUsers[0]?.id || users[0].id,
          resolvedAt: resolvedAt?.toISOString() || null,
          resolvedBy: resolvedBy,
          resolutionNotes: resolutionNotes,
          authoritiesContacted: severity === 'critical' || incidentType.includes('weapon') || incidentType.includes('violence'),
          authoritiesReportNumber: severity === 'critical' ? `POL-${Math.floor(Math.random() * 100000)}` : null
        };
        
        try {
          const [incident] = await this.sequelize.query(`
            INSERT INTO "Incidents" (
              "incidentNumber", "propertyId", "clientId", "incidentType", severity, status,
              location, description, "incidentDate", "aiConfidence", "reportedBy",
              "resolvedAt", "resolvedBy", "resolutionNotes", "authoritiesContacted", 
              "authoritiesReportNumber", "createdAt", "updatedAt"
            )
            VALUES (
              :incidentNumber, :propertyId, :clientId, :incidentType, :severity, :status,
              :location, :description, :incidentDate, :aiConfidence, :reportedBy,
              :resolvedAt, :resolvedBy, :resolutionNotes, :authoritiesContacted,
              :authoritiesReportNumber, NOW(), NOW()
            )
            RETURNING *
          `, {
            replacements: incidentData,
            type: this.sequelize.QueryTypes.INSERT
          });
          
          incidents.push(incident[0]);
        } catch (error) {
          console.error(`   ❌ Error creating incident for ${property.name}:`, error.message);
        }
      }
      
      console.log(`   ✅ Created ${incidentCount} incidents for ${property.name}`);
    }
    
    console.log(`   📊 Total incidents created: ${incidents.length}`);
    return incidents;
  }

  async createEvidenceFiles(incidents) {
    console.log('\n📁 Creating evidence file records...');
    
    const evidenceTypes = ['video', 'image', 'audio', 'document'];
    const evidenceFiles = [];
    
    // Create 1-3 evidence files per high/critical incident
    for (const incident of incidents) {
      if (incident.severity === 'high' || incident.severity === 'critical') {
        const fileCount = Math.floor(Math.random() * 3) + 1; // 1-3 files
        
        for (let i = 0; i < fileCount; i++) {
          const fileType = evidenceTypes[Math.floor(Math.random() * evidenceTypes.length)];
          const fileName = this.generateFileName(incident, fileType, i);
          
          const evidenceData = {
            incidentId: incident.id,
            originalFileName: fileName,
            fileType: fileType,
            fileSize: this.getFileSize(fileType),
            filePath: `/evidence/${incident.clientId}/${incident.id}/${fileName}`,
            thumbnailPath: fileType.includes('video') || fileType.includes('image') 
              ? `/evidence/${incident.clientId}/${incident.id}/thumb_${fileName}` 
              : null,
            watermarkPath: `/evidence/${incident.clientId}/${incident.id}/wm_${fileName}`,
            isClientAccessible: true,
            metadata: JSON.stringify({
              timestamp: incident.incidentDate,
              location: incident.location,
              confidence: incident.aiConfidence,
              camera_id: `CAM-${Math.floor(Math.random() * 20) + 1}`,
              resolution: fileType.includes('video') ? '1920x1080' : fileType.includes('image') ? '2048x1536' : null,
              duration: fileType === 'video' ? Math.floor(Math.random() * 300) + 30 : null // 30-330 seconds
            }),
            uploadedBy: incident.reportedBy
          };
          
          try {
            const [evidence] = await this.sequelize.query(`
              INSERT INTO "EvidenceFiles" (
                "incidentId", "originalFileName", "fileType", "fileSize", "filePath",
                "thumbnailPath", "watermarkPath", "isClientAccessible", metadata,
                "uploadedBy", "createdAt", "updatedAt"
              )
              VALUES (
                :incidentId, :originalFileName, :fileType, :fileSize, :filePath,
                :thumbnailPath, :watermarkPath, :isClientAccessible, :metadata,
                :uploadedBy, NOW(), NOW()
              )
              RETURNING *
            `, {
              replacements: evidenceData,
              type: this.sequelize.QueryTypes.INSERT
            });
            
            evidenceFiles.push(evidence[0]);
          } catch (error) {
            console.error(`   ❌ Error creating evidence file for incident ${incident.incidentNumber}:`, error.message);
          }
        }
      }
    }
    
    console.log(`   📊 Total evidence files created: ${evidenceFiles.length}`);
    return evidenceFiles;
  }

  async createClientPortalSessions() {
    console.log('\n🔐 Creating client portal session tables...');
    
    // Create ClientPortalSessions table
    await this.sequelize.query(`
      CREATE TABLE IF NOT EXISTS "ClientPortalSessions" (
        id SERIAL PRIMARY KEY,
        "userId" INTEGER NOT NULL REFERENCES "Users"(id) ON DELETE CASCADE,
        "sessionToken" VARCHAR(255) UNIQUE NOT NULL,
        "refreshToken" VARCHAR(255) UNIQUE NOT NULL,
        "ipAddress" INET,
        "userAgent" TEXT,
        "lastActivity" TIMESTAMPTZ DEFAULT NOW(),
        "expiresAt" TIMESTAMPTZ NOT NULL,
        "isActive" BOOLEAN DEFAULT true,
        "createdAt" TIMESTAMPTZ DEFAULT NOW(),
        "updatedAt" TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    
    // Create ClientPortalAuditLog table
    await this.sequelize.query(`
      CREATE TABLE IF NOT EXISTS "ClientPortalAuditLog" (
        id SERIAL PRIMARY KEY,
        "userId" INTEGER REFERENCES "Users"(id) ON DELETE SET NULL,
        "clientId" INTEGER REFERENCES "Clients"(id) ON DELETE SET NULL,
        action VARCHAR(100) NOT NULL,
        "resourceType" VARCHAR(50),
        "resourceId" VARCHAR(100),
        details JSONB DEFAULT '{}',
        "ipAddress" INET,
        "userAgent" TEXT,
        "sessionId" VARCHAR(255),
        "createdAt" TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    
    // Create indexes
    await this.sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_client_sessions_user_id ON "ClientPortalSessions"("userId");
      CREATE INDEX IF NOT EXISTS idx_client_sessions_token ON "ClientPortalSessions"("sessionToken");
      CREATE INDEX IF NOT EXISTS idx_client_sessions_active ON "ClientPortalSessions"("isActive", "expiresAt");
      
      CREATE INDEX IF NOT EXISTS idx_client_audit_user_id ON "ClientPortalAuditLog"("userId");
      CREATE INDEX IF NOT EXISTS idx_client_audit_client_id ON "ClientPortalAuditLog"("clientId");
      CREATE INDEX IF NOT EXISTS idx_client_audit_action ON "ClientPortalAuditLog"(action);
      CREATE INDEX IF NOT EXISTS idx_client_audit_created ON "ClientPortalAuditLog"("createdAt");
    `);
    
    console.log('   ✅ Client portal session tables created');
  }

  // Helper methods for generating realistic data
  getSeverityForIncidentType(incidentType) {
    const severityMap = {
      'package_theft': ['low', 'medium'],
      'unauthorized_access': ['medium', 'high'],
      'vandalism': ['low', 'medium'],
      'noise_complaint': ['low'],
      'trespassing': ['medium', 'high'],
      'suspicious_activity': ['low', 'medium'],
      'alarm_activation': ['medium'],
      'maintenance_emergency': ['high'],
      'weapon_detection': ['critical'],
      'violence': ['critical'],
      'medical_emergency': ['critical'],
      'fire_alarm': ['high', 'critical']
    };
    
    const options = severityMap[incidentType] || ['low', 'medium'];
    return options[Math.floor(Math.random() * options.length)];
  }

  getStatusForSeverity(severity) {
    if (severity === 'critical') {
      return Math.random() > 0.2 ? 'resolved' : 'investigating'; // 80% resolved
    } else if (severity === 'high') {
      return Math.random() > 0.3 ? 'resolved' : 'investigating'; // 70% resolved
    } else {
      return Math.random() > 0.4 ? 'resolved' : 'reported'; // 60% resolved
    }
  }

  getLocationForProperty(propertyType) {
    const locationMap = {
      'luxury_apartment': ['Main Lobby', 'Pool Area', 'Parking Garage', 'Rooftop Deck', 'Fitness Center', 'Mailroom'],
      'executive_apartment': ['Executive Lobby', 'Business Center', 'Parking Entrance', 'Conference Room'],
      'mixed_residential': ['Community Entrance', 'Courtyard', 'Laundry Room', 'Playground', 'Parking Lot'],
      'affordable_housing': ['Main Entrance', 'Community Room', 'Mailboxes', 'Stairwell'],
      'luxury_estate': ['Main Gate', 'Pool House', 'Guest House', 'Driveway', 'Garden Area'],
      'luxury_penthouse': ['Private Elevator', 'Rooftop Terrace', 'Wine Cellar', 'Master Suite']
    };
    
    const locations = locationMap[propertyType] || ['Main Entrance', 'Common Area'];
    return locations[Math.floor(Math.random() * locations.length)];
  }

  getDescriptionForIncident(incidentType, severity) {
    const descriptions = {
      'package_theft': `${severity === 'high' ? 'Multiple packages' : 'Single package'} stolen from ${severity === 'low' ? 'mailroom' : 'resident doorstep'}. Suspect fled on foot.`,
      'unauthorized_access': `Individual attempted to gain ${severity === 'critical' ? 'forced' : 'unauthorized'} entry through ${severity === 'high' ? 'security door' : 'main entrance'}. ${severity === 'high' ? 'Door damaged.' : 'No damage reported.'}`,
      'vandalism': `${severity === 'high' ? 'Extensive graffiti and property damage' : 'Minor graffiti'} discovered on ${severity === 'high' ? 'multiple surfaces' : 'wall surface'}. Clean-up required.`,
      'noise_complaint': 'Resident reported excessive noise from neighboring unit during quiet hours. Multiple complaints received.',
      'trespassing': `${severity === 'high' ? 'Multiple individuals' : 'Single individual'} found in restricted area without authorization. ${severity === 'high' ? 'Refused to leave when asked.' : 'Left when confronted.'}`,
      'suspicious_activity': `Unusual behavior observed - individual loitering and ${severity === 'medium' ? 'photographing property' : 'checking doors'}. Duration: ${Math.floor(Math.random() * 60) + 10} minutes.`,
      'alarm_activation': 'Security alarm triggered in restricted area. Cause under investigation. No immediate threat identified.',
      'maintenance_emergency': `${severity === 'high' ? 'Major' : 'Minor'} maintenance issue requiring immediate attention. ${severity === 'high' ? 'Safety hazard present.' : 'Resident inconvenience.'}`,
      'weapon_detection': 'AI system detected potential weapon. Immediate response initiated. Area secured pending investigation.',
      'violence': 'Physical altercation detected between multiple individuals. Emergency services contacted immediately.',
      'medical_emergency': 'Medical emergency reported. First aid provided while awaiting emergency medical services.',
      'fire_alarm': `${severity === 'critical' ? 'Active fire alarm' : 'Smoke detector activation'} in residential area. ${severity === 'critical' ? 'Evacuation initiated.' : 'False alarm confirmed.'}`
    };
    
    return descriptions[incidentType] || 'Security incident reported requiring investigation and response.';
  }

  getResolutionNotes(incidentType) {
    const resolutions = {
      'package_theft': 'Security footage reviewed. Delivery protocols updated. Resident advised to use secure locker system.',
      'unauthorized_access': 'Access logs reviewed and system updated. Additional security measures implemented.',
      'vandalism': 'Damage documented and repair scheduled. Enhanced surveillance in affected area.',
      'noise_complaint': 'Mediated discussion between residents. Quiet hours policy reinforced.',
      'trespassing': 'Individual identified and banned from property. Security briefed on suspect description.',
      'suspicious_activity': 'Investigation completed. No criminal activity confirmed. Increased patrols implemented.',
      'alarm_activation': 'System checked and recalibrated. False alarm cause identified and resolved.',
      'maintenance_emergency': 'Emergency repairs completed. Preventive maintenance schedule updated.',
      'weapon_detection': 'False positive confirmed. AI system sensitivity adjusted. Training data updated.',
      'violence': 'Police report filed. Involved parties identified. Security protocols reviewed.',
      'medical_emergency': 'Emergency services response successful. First aid training for staff scheduled.',
      'fire_alarm': 'System inspection completed. Detector sensitivity adjusted. Fire safety plan reviewed.'
    };
    
    return resolutions[incidentType] || 'Incident investigated and appropriate measures taken.';
  }

  getAIConfidence(incidentType, severity) {
    // Higher confidence for critical incidents
    if (severity === 'critical') {
      return (Math.random() * 0.15 + 0.85).toFixed(2); // 85-100%
    } else if (severity === 'high') {
      return (Math.random() * 0.20 + 0.70).toFixed(2); // 70-90%
    } else {
      return (Math.random() * 0.30 + 0.50).toFixed(2); // 50-80%
    }
  }

  generateFileName(incident, fileType, index) {
    const timestamp = new Date(incident.incidentDate).toISOString().replace(/[:.]/g, '-');
    const extensions = {
      'video': 'mp4',
      'image': 'jpg',
      'audio': 'wav',
      'document': 'pdf'
    };
    
    return `${incident.incidentType}_${timestamp}_${index + 1}.${extensions[fileType]}`;
  }

  getFileSize(fileType) {
    const sizes = {
      'video': Math.floor(Math.random() * 500000000) + 50000000, // 50MB - 500MB
      'image': Math.floor(Math.random() * 10000000) + 1000000,   // 1MB - 10MB
      'audio': Math.floor(Math.random() * 50000000) + 5000000,   // 5MB - 50MB
      'document': Math.floor(Math.random() * 5000000) + 100000   // 100KB - 5MB
    };
    
    return sizes[fileType] || 1000000;
  }

  async printTestCredentials() {
    console.log('\n🔑 TEST LOGIN CREDENTIALS');
    console.log('=' .repeat(60));
    console.log('Use these credentials to test the client portal:');
    console.log('');
    console.log('🏢 Luxe Apartments Management (Admin)');
    console.log('   Email: sarah.johnson@luxeapartments.com');
    console.log('   Password: Demo123!');
    console.log('   Role: client_admin (full access)');
    console.log('');
    console.log('🏢 Luxe Apartments Management (User)');
    console.log('   Email: michael.chen@luxeapartments.com');
    console.log('   Password: Demo123!');
    console.log('   Role: client_user (limited access)');
    console.log('');
    console.log('🏢 Metropolitan Housing Group (Admin)');
    console.log('   Email: david.rodriguez@metrohousing.com');
    console.log('   Password: Demo123!');
    console.log('   Role: client_admin (full access)');
    console.log('');
    console.log('🏢 Prestige Property Partners (Admin)');
    console.log('   Email: alexandra.williams@prestigeproperties.com');
    console.log('   Password: Demo123!');
    console.log('   Role: client_admin (full access)');
    console.log('');
    console.log('=' .repeat(60));
  }

  async execute() {
    console.log('🚀 APEX AI - COMPREHENSIVE TEST DATA POPULATION');
    console.log('=' .repeat(80));
    console.log('Creating realistic demo data for client portal testing...\n');
    
    try {
      // Step 1: Validate connection
      const isConnected = await this.validateConnection();
      if (!isConnected) {
        throw new Error('Database connection failed');
      }
      
      // Step 2: Create client portal session tables
      await this.createClientPortalSessions();
      
      // Step 3: Create clients
      const clients = await this.createClients();
      
      // Step 4: Create properties
      const properties = await this.createProperties(clients);
      
      // Step 5: Create client portal users
      const users = await this.createClientPortalUsers(clients);
      
      // Step 6: Create incidents
      const incidents = await this.createIncidents(clients, properties, users);
      
      // Step 7: Create evidence files
      const evidenceFiles = await this.createEvidenceFiles(incidents);
      
      // Step 8: Print test credentials
      await this.printTestCredentials();
      
      console.log('\n🎉 SUCCESS: Test data population completed!');
      console.log('=' .repeat(80));
      console.log('📊 SUMMARY:');
      console.log(`   ✅ ${clients.length} client companies created`);
      console.log(`   ✅ ${properties.length} properties created`);
      console.log(`   ✅ ${users.length} client portal users created`);
      console.log(`   ✅ ${incidents.length} realistic incidents created`);
      console.log(`   ✅ ${evidenceFiles.length} evidence files created`);
      console.log('   ✅ Client portal session tables created');
      
      console.log('\n📋 NEXT STEPS:');
      console.log('1. ✅ Test data ready');
      console.log('2. Start backend server: cd backend && npm run dev');
      console.log('3. Start client portal: cd client-portal && npm run dev');
      console.log('4. Login with test credentials above');
      
      await this.sequelize.close();
      
    } catch (error) {
      console.error('\n❌ CRITICAL ERROR:', error.message);
      console.error(error.stack);
      
      await this.sequelize.close();
      process.exit(1);
    }
  }
}

// Execute the test data population
const populator = new TestDataPopulator();
populator.execute().catch(console.error);
