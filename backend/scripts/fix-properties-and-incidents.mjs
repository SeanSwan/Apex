#!/usr/bin/env node

/**
 * APEX AI - PROPERTIES AND INCIDENTS FIX
 * =======================================
 * Creates missing properties and incidents after user creation success
 */

import dotenv from 'dotenv';
import { Sequelize } from 'sequelize';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env') });

class PropertiesAndIncidentsFixer {
  constructor() {
    this.sequelize = new Sequelize({
      dialect: 'postgres',
      host: process.env.PG_HOST || 'localhost',
      port: parseInt(process.env.PG_PORT) || 5432,
      database: process.env.PG_DB || 'apex',
      username: process.env.PG_USER || 'postgres',
      password: process.env.PG_PASSWORD || '',
      logging: false
    });
  }

  async createProperties() {
    console.log('\n🏘️ Creating properties...');
    
    // Get client IDs first
    const [clients] = await this.sequelize.query(`
      SELECT id, name FROM "Clients" ORDER BY id
    `);
    
    if (clients.length === 0) {
      throw new Error('No clients found - please run Phase 2 first');
    }
    
    console.log(`Found ${clients.length} clients to create properties for`);
    
    const propertiesData = [
      // Luxe Apartments Management properties
      {
        name: 'Oceanview Luxury Towers',
        address: '1550 Ocean Drive, Miami Beach, FL 33139',
        clientId: clients[0].id,
        propertyType: 'luxury_apartment'
      },
      {
        name: 'South Beach Executive Suites', 
        address: '1600 Collins Avenue, Miami Beach, FL 33139',
        clientId: clients[0].id,
        propertyType: 'executive_apartment'
      },
      
      // Metropolitan Housing Group properties
      {
        name: 'Center City Residences',
        address: '2250 Market Street, Philadelphia, PA 19103',
        clientId: clients[1].id,
        propertyType: 'mixed_residential'
      },
      {
        name: 'Liberty Square Apartments',
        address: '2300 Arch Street, Philadelphia, PA 19103', 
        clientId: clients[1].id,
        propertyType: 'affordable_housing'
      },
      
      // Prestige Property Partners properties
      {
        name: 'Hollywood Hills Estate',
        address: '9000 Sunset Boulevard, West Hollywood, CA 90069',
        clientId: clients[2].id,
        propertyType: 'luxury_estate'
      },
      {
        name: 'Sunset Strip Penthouses',
        address: '8900 Sunset Boulevard, West Hollywood, CA 90069',
        clientId: clients[2].id,
        propertyType: 'luxury_penthouse'
      }
    ];

    const properties = [];
    for (const propertyData of propertiesData) {
      try {
        const [property] = await this.sequelize.query(`
          INSERT INTO "Properties" (name, address, "clientId", "propertyType", "isActive", "createdAt", "updatedAt")
          VALUES (:name, :address, :clientId, :propertyType, true, NOW(), NOW())
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

  async createIncidents(properties) {
    console.log('\n🚨 Creating realistic incidents...');
    
    // Get users for each client
    const [users] = await this.sequelize.query(`
      SELECT id, "clientId", "firstName", "lastName" FROM "Users" 
      WHERE role IN ('client_admin', 'client_user')
    `);
    
    const incidents = [];
    const incidentTypes = [
      'package_theft', 'unauthorized_access', 'vandalism', 'noise_complaint',
      'trespassing', 'suspicious_activity', 'alarm_activation'
    ];
    
    const severities = ['low', 'medium', 'high'];
    const statuses = ['reported', 'investigating', 'resolved'];
    
    // Create 10 incidents per property
    for (const property of properties) {
      const propertyUsers = users.filter(u => u.clientId === property.clientId);
      
      for (let i = 0; i < 10; i++) {
        const incidentType = incidentTypes[Math.floor(Math.random() * incidentTypes.length)];
        const severity = severities[Math.floor(Math.random() * severities.length)];
        const status = statuses[Math.floor(Math.random() * statuses.length)];
        
        // Generate date in last 30 days
        const daysAgo = Math.floor(Math.random() * 30);
        const incidentDate = new Date();
        incidentDate.setDate(incidentDate.getDate() - daysAgo);
        
        const incidentData = {
          incidentNumber: `INC-${property.id}-${Date.now()}-${i}`,
          propertyId: property.id,
          clientId: property.clientId,
          incidentType: incidentType,
          severity: severity,
          status: status,
          location: this.getRandomLocation(),
          description: this.getDescription(incidentType),
          incidentDate: incidentDate.toISOString(),
          aiConfidence: (Math.random() * 0.4 + 0.6).toFixed(2), // 60-100%
          reportedBy: propertyUsers[0]?.id || users[0].id
        };
        
        try {
          const [incident] = await this.sequelize.query(`
            INSERT INTO "Incidents" (
              "incidentNumber", "propertyId", "clientId", "incidentType", severity, status,
              location, description, "incidentDate", "aiConfidence", "reportedBy", "createdAt", "updatedAt"
            )
            VALUES (
              :incidentNumber, :propertyId, :clientId, :incidentType, :severity, :status,
              :location, :description, :incidentDate, :aiConfidence, :reportedBy, NOW(), NOW()
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
      
      console.log(`   ✅ Created 10 incidents for ${property.name}`);
    }
    
    return incidents;
  }

  getRandomLocation() {
    const locations = [
      'Main Lobby', 'Parking Garage', 'Pool Area', 'Fitness Center',
      'Mailroom', 'Common Area', 'Stairwell', 'Elevator', 'Rooftop'
    ];
    return locations[Math.floor(Math.random() * locations.length)];
  }

  getDescription(incidentType) {
    const descriptions = {
      'package_theft': 'Package stolen from delivery area. Suspect fled on foot.',
      'unauthorized_access': 'Individual attempted unauthorized entry through main entrance.',
      'vandalism': 'Graffiti discovered on exterior wall surface.',
      'noise_complaint': 'Resident reported excessive noise during quiet hours.',
      'trespassing': 'Individual found in restricted area without authorization.',
      'suspicious_activity': 'Unusual behavior observed - individual loitering near entrance.',
      'alarm_activation': 'Security alarm triggered. Cause under investigation.'
    };
    return descriptions[incidentType] || 'Security incident requiring investigation.';
  }

  async execute() {
    console.log('🚀 APEX AI - PROPERTIES AND INCIDENTS FIX');
    console.log('=' .repeat(60));
    
    try {
      await this.sequelize.authenticate();
      console.log('✅ Database connection successful');
      
      const properties = await this.createProperties();
      if (properties.length === 0) {
        throw new Error('No properties were created');
      }
      
      const incidents = await this.createIncidents(properties);
      
      console.log('\n🎉 FIX COMPLETE!');
      console.log('=' .repeat(60));
      console.log(`✅ ${properties.length} properties created`);
      console.log(`✅ ${incidents.length} incidents created`);
      console.log('✅ Ready for Phase 3 (backend server)');
      
      await this.sequelize.close();
      
    } catch (error) {
      console.error('\n❌ ERROR:', error.message);
      await this.sequelize.close();
      process.exit(1);
    }
  }
}

const fixer = new PropertiesAndIncidentsFixer();
fixer.execute().catch(console.error);
