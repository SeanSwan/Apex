// backend/config/database.mjs
import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

// Get current file directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define possible env file paths in order of preference
const possibleEnvPaths = [
  path.resolve(__dirname, '..', '.env'),               // backend/.env
  path.resolve(__dirname, '..', '..', '.env'),         // project root/.env
  path.resolve(__dirname, '..', '..', 'backend', '.env') // explicit backend/.env
];

// Find the first .env file that exists
let envPath = null;
for (const possiblePath of possibleEnvPaths) {
  if (fs.existsSync(possiblePath)) {
    envPath = possiblePath;
    break;
  }
}

// If no .env file found, use the project root as fallback
if (!envPath) {
  envPath = path.resolve(__dirname, '..', '..', '.env');
  console.warn(`Warning: No .env file found. Using default path: ${envPath}`);
}

// Load environment variables from the correct location
dotenv.config({ path: envPath });
console.log(`Loading database config from: ${envPath}`);

// Create Sequelize instance with fallback values for all required parameters
const sequelize = new Sequelize(
  process.env.PG_DB || 'postgres',
  process.env.PG_USER || 'postgres',
  process.env.PG_PASSWORD || '',
  {
    host: process.env.PG_HOST || 'localhost',
    port: Number(process.env.PG_PORT) || 5432,
    dialect: 'postgres',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
    define: {
      timestamps: true,
      underscored: true,
    }
  }
);

// Test the connection
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Connection to PostgreSQL has been established successfully.');
    return true;
  } catch (error) {
    console.error('❌ Unable to connect to PostgreSQL:', error.message);
    
    // Log helpful troubleshooting messages
    if (error.message.includes('password')) {
      console.log('🔧 HINT: Make sure your PG_PASSWORD environment variable is set correctly.');
      console.log('   - If using no password, leave it empty (PG_PASSWORD=)');
      console.log('   - If using a password, don\'t use quotes in the .env file');
    } else if (error.message.includes('ECONNREFUSED')) {
      console.log('🔧 HINT: Make sure PostgreSQL is running on your computer.');
      console.log('   - Check that the PostgreSQL service is started');
      console.log('   - Verify the host and port settings in your .env file');
    }
    
    return false;
  }
};

// Client Portal Database Query Methods
// ===================================

const ClientPortalQueries = {
  // Authentication Methods
  async authenticateClientUser(email, password) {
    try {
      const [results] = await sequelize.query(`
        SELECT u.id, u."firstName", u."lastName", u.email, u.role, u."clientId", 
               u."clientPermissions", c.name as "clientName"
        FROM "Users" u
        LEFT JOIN "Clients" c ON u."clientId" = c.id
        WHERE u.email = :email AND u.role IN ('client_admin', 'client_user') AND u."isActive" = true
      `, {
        replacements: { email },
        type: sequelize.QueryTypes.SELECT
      });
      return results[0] || null;
    } catch (error) {
      console.error('Error authenticating client user:', error);
      throw error;
    }
  },

  async createClientSession(userId, sessionToken, refreshToken, ipAddress, userAgent, expiresAt) {
    try {
      const [results] = await sequelize.query(`
        INSERT INTO "ClientPortalSessions" 
        ("userId", "sessionToken", "refreshToken", "ipAddress", "userAgent", "expiresAt")
        VALUES (:userId, :sessionToken, :refreshToken, :ipAddress, :userAgent, :expiresAt)
        RETURNING id, "sessionToken"
      `, {
        replacements: { userId, sessionToken, refreshToken, ipAddress, userAgent, expiresAt },
        type: sequelize.QueryTypes.INSERT
      });
      return results[0][0];
    } catch (error) {
      console.error('Error creating client session:', error);
      throw error;
    }
  },

  async validateClientSession(sessionToken) {
    try {
      const [results] = await sequelize.query(`
        SELECT s."userId", s."expiresAt", u."clientId", u."clientPermissions",
               u."firstName", u."lastName", u.email, u.role, c.name as "clientName"
        FROM "ClientPortalSessions" s
        JOIN "Users" u ON s."userId" = u.id
        LEFT JOIN "Clients" c ON u."clientId" = c.id
        WHERE s."sessionToken" = :sessionToken AND s."isActive" = true AND s."expiresAt" > NOW()
      `, {
        replacements: { sessionToken },
        type: sequelize.QueryTypes.SELECT
      });
      return results[0] || null;
    } catch (error) {
      console.error('Error validating client session:', error);
      throw error;
    }
  },

  // Dashboard KPI Methods
  async getClientDashboardKPIs(clientId, dateRange = '30 days') {
    try {
      const [results] = await sequelize.query(`
        SELECT 
          COUNT(*) as "totalIncidents",
          COUNT(*) FILTER (WHERE severity = 'critical') as "criticalIncidents",
          COUNT(*) FILTER (WHERE severity = 'high') as "highIncidents",
          COUNT(*) FILTER (WHERE status = 'resolved') as "resolvedIncidents",
          ROUND(AVG("aiConfidence"), 2) as "avgAIConfidence",
          COUNT(DISTINCT "propertyId") as "activeProperties"
        FROM "Incidents"
        WHERE "clientId" = :clientId 
          AND "incidentDate" >= NOW() - INTERVAL :dateRange
      `, {
        replacements: { clientId, dateRange },
        type: sequelize.QueryTypes.SELECT
      });
      return results[0];
    } catch (error) {
      console.error('Error getting dashboard KPIs:', error);
      throw error;
    }
  },

  async getClientIncidentTrends(clientId, dateRange = '30 days') {
    try {
      const [results] = await sequelize.query(`
        SELECT 
          DATE("incidentDate") as "date",
          COUNT(*) as "incidentCount",
          COUNT(*) FILTER (WHERE severity IN ('high', 'critical')) as "highSeverityCount"
        FROM "Incidents"
        WHERE "clientId" = :clientId 
          AND "incidentDate" >= NOW() - INTERVAL :dateRange
        GROUP BY DATE("incidentDate")
        ORDER BY "date" ASC
      `, {
        replacements: { clientId, dateRange },
        type: sequelize.QueryTypes.SELECT
      });
      return results;
    } catch (error) {
      console.error('Error getting incident trends:', error);
      throw error;
    }
  },

  // Incident Browser Methods
  async getClientIncidents(clientId, filters = {}) {
    try {
      let whereClause = 'WHERE i."clientId" = :clientId';
      const replacements = { clientId };

      // Add filters
      if (filters.incidentType) {
        whereClause += ' AND i."incidentType" = :incidentType';
        replacements.incidentType = filters.incidentType;
      }
      if (filters.severity) {
        whereClause += ' AND i.severity = :severity';
        replacements.severity = filters.severity;
      }
      if (filters.status) {
        whereClause += ' AND i.status = :status';
        replacements.status = filters.status;
      }
      if (filters.propertyId) {
        whereClause += ' AND i."propertyId" = :propertyId';
        replacements.propertyId = filters.propertyId;
      }
      if (filters.dateFrom) {
        whereClause += ' AND i."incidentDate" >= :dateFrom';
        replacements.dateFrom = filters.dateFrom;
      }
      if (filters.dateTo) {
        whereClause += ' AND i."incidentDate" <= :dateTo';
        replacements.dateTo = filters.dateTo;
      }

      const [results] = await sequelize.query(`
        SELECT 
          i.id, i."incidentNumber", i."incidentType", i.severity, i.status,
          i.location, i.description, i."aiConfidence", i."incidentDate",
          p.name as "propertyName", p.address as "propertyAddress",
          COUNT(e.id) as "evidenceCount"
        FROM "Incidents" i
        JOIN "Properties" p ON i."propertyId" = p.id
        LEFT JOIN "EvidenceFiles" e ON i.id = e."incidentId" AND e."isClientAccessible" = true
        ${whereClause}
        GROUP BY i.id, p.name, p.address
        ORDER BY i."incidentDate" DESC
        LIMIT :limit OFFSET :offset
      `, {
        replacements: { 
          ...replacements, 
          limit: filters.limit || 50, 
          offset: filters.offset || 0 
        },
        type: sequelize.QueryTypes.SELECT
      });
      return results;
    } catch (error) {
      console.error('Error getting client incidents:', error);
      throw error;
    }
  },

  async getClientIncidentDetails(clientId, incidentId) {
    try {
      const [results] = await sequelize.query(`
        SELECT 
          i.*, p.name as "propertyName", p.address as "propertyAddress",
          u."firstName" || ' ' || u."lastName" as "resolvedByName"
        FROM "Incidents" i
        JOIN "Properties" p ON i."propertyId" = p.id
        LEFT JOIN "Users" u ON i."resolvedBy" = u.id
        WHERE i.id = :incidentId AND i."clientId" = :clientId
      `, {
        replacements: { clientId, incidentId },
        type: sequelize.QueryTypes.SELECT
      });
      return results[0] || null;
    } catch (error) {
      console.error('Error getting incident details:', error);
      throw error;
    }
  },

  // Evidence Locker Methods
  async getClientEvidence(clientId, incidentId = null) {
    try {
      let whereClause = 'WHERE i."clientId" = :clientId AND e."isClientAccessible" = true';
      const replacements = { clientId };

      if (incidentId) {
        whereClause += ' AND e."incidentId" = :incidentId';
        replacements.incidentId = incidentId;
      }

      const [results] = await sequelize.query(`
        SELECT 
          e.id, e."incidentId", e."originalFileName", e."fileType", e."fileSize",
          e."thumbnailPath", e."watermarkPath", e."createdAt",
          i."incidentNumber", i."incidentType", i.location,
          p.name as "propertyName"
        FROM "EvidenceFiles" e
        JOIN "Incidents" i ON e."incidentId" = i.id
        JOIN "Properties" p ON i."propertyId" = p.id
        ${whereClause}
        ORDER BY e."createdAt" DESC
      `, {
        replacements,
        type: sequelize.QueryTypes.SELECT
      });
      return results;
    } catch (error) {
      console.error('Error getting client evidence:', error);
      throw error;
    }
  },

  // Analytics Methods
  async getClientAnalytics(clientId, dateRange = '30 days') {
    try {
      // Incident type breakdown
      const [incidentTypes] = await sequelize.query(`
        SELECT 
          "incidentType",
          COUNT(*) as count,
          ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 2) as percentage
        FROM "Incidents"
        WHERE "clientId" = :clientId 
          AND "incidentDate" >= NOW() - INTERVAL :dateRange
        GROUP BY "incidentType"
        ORDER BY count DESC
      `, {
        replacements: { clientId, dateRange },
        type: sequelize.QueryTypes.SELECT
      });

      // Response time analysis
      const [responseTimes] = await sequelize.query(`
        SELECT 
          AVG(EXTRACT(EPOCH FROM ("resolvedAt" - "incidentDate"))/60) as "avgResponseMinutes",
          MIN(EXTRACT(EPOCH FROM ("resolvedAt" - "incidentDate"))/60) as "minResponseMinutes",
          MAX(EXTRACT(EPOCH FROM ("resolvedAt" - "incidentDate"))/60) as "maxResponseMinutes"
        FROM "Incidents"
        WHERE "clientId" = :clientId 
          AND "resolvedAt" IS NOT NULL
          AND "incidentDate" >= NOW() - INTERVAL :dateRange
      `, {
        replacements: { clientId, dateRange },
        type: sequelize.QueryTypes.SELECT
      });

      // Property hotspots
      const [propertyHotspots] = await sequelize.query(`
        SELECT 
          p.name as "propertyName",
          COUNT(*) as "incidentCount",
          STRING_AGG(DISTINCT i."incidentType", ', ') as "commonIncidentTypes"
        FROM "Incidents" i
        JOIN "Properties" p ON i."propertyId" = p.id
        WHERE i."clientId" = :clientId 
          AND i."incidentDate" >= NOW() - INTERVAL :dateRange
        GROUP BY p.id, p.name
        ORDER BY "incidentCount" DESC
      `, {
        replacements: { clientId, dateRange },
        type: sequelize.QueryTypes.SELECT
      });

      return {
        incidentTypes,
        responseTimes: responseTimes[0],
        propertyHotspots
      };
    } catch (error) {
      console.error('Error getting client analytics:', error);
      throw error;
    }
  },

  // Audit Logging
  async logClientPortalActivity(userId, clientId, action, resourceType = null, resourceId = null, details = {}, ipAddress = null, userAgent = null, sessionId = null) {
    try {
      await sequelize.query(`
        INSERT INTO "ClientPortalAuditLog" 
        ("userId", "clientId", "action", "resourceType", "resourceId", "details", "ipAddress", "userAgent", "sessionId")
        VALUES (:userId, :clientId, :action, :resourceType, :resourceId, :details, :ipAddress, :userAgent, :sessionId)
      `, {
        replacements: { 
          userId, clientId, action, resourceType, resourceId, 
          details: JSON.stringify(details), ipAddress, userAgent, sessionId 
        },
        type: sequelize.QueryTypes.INSERT
      });
    } catch (error) {
      console.error('Error logging client portal activity:', error);
      // Don't throw here - audit logging should not break main functionality
    }
  },

  // Utility Methods
  async getClientProperties(clientId) {
    try {
      const [results] = await sequelize.query(`
        SELECT id, name, address, "propertyType"
        FROM "Properties"
        WHERE "clientId" = :clientId AND "isActive" = true
        ORDER BY name ASC
      `, {
        replacements: { clientId },
        type: sequelize.QueryTypes.SELECT
      });
      return results;
    } catch (error) {
      console.error('Error getting client properties:', error);
      throw error;
    }
  }
};

export { testConnection, ClientPortalQueries };
export default sequelize;