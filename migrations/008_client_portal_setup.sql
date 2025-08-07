-- APEX AI SECURITY PLATFORM - CLIENT PORTAL SETUP MIGRATION
-- ===========================================================
-- Migration: 008_client_portal_setup.sql
-- Purpose: Extend existing database to support secure client portal access
-- Compatibility: Works with existing Users, Clients, Properties, Reports tables

-- Step 1: Add Client Portal Roles to existing Users table
-- =====================================================
ALTER TABLE "Users" 
  ADD COLUMN IF NOT EXISTS "clientId" INTEGER REFERENCES "Clients"(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS "clientPermissions" JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS "lastLoginAt" TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS "passwordResetToken" VARCHAR(255),
  ADD COLUMN IF NOT EXISTS "passwordResetExpires" TIMESTAMP WITH TIME ZONE;

-- Add indexes for client portal performance
CREATE INDEX IF NOT EXISTS idx_users_client_id ON "Users"("clientId");
CREATE INDEX IF NOT EXISTS idx_users_role_active ON "Users"(role, "isActive");
CREATE INDEX IF NOT EXISTS idx_users_email_active ON "Users"(email, "isActive");

-- Step 2: Create Client Portal Sessions table
-- ==========================================
CREATE TABLE IF NOT EXISTS "ClientPortalSessions" (
  id SERIAL PRIMARY KEY,
  "userId" INTEGER NOT NULL REFERENCES "Users"(id) ON DELETE CASCADE,
  "sessionToken" VARCHAR(255) UNIQUE NOT NULL,
  "refreshToken" VARCHAR(255),
  "ipAddress" INET,
  "userAgent" TEXT,
  "expiresAt" TIMESTAMP WITH TIME ZONE NOT NULL,
  "isActive" BOOLEAN DEFAULT true,
  "lastActivity" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_client_sessions_token ON "ClientPortalSessions"("sessionToken");
CREATE INDEX IF NOT EXISTS idx_client_sessions_user_active ON "ClientPortalSessions"("userId", "isActive");
CREATE INDEX IF NOT EXISTS idx_client_sessions_expires ON "ClientPortalSessions"("expiresAt");

-- Step 3: Create Incidents table (for client portal incident browsing)
-- ===================================================================
CREATE TABLE IF NOT EXISTS "Incidents" (
  id SERIAL PRIMARY KEY,
  "incidentNumber" VARCHAR(50) UNIQUE NOT NULL,
  "propertyId" INTEGER NOT NULL REFERENCES "Properties"(id) ON DELETE CASCADE,
  "clientId" INTEGER NOT NULL REFERENCES "Clients"(id) ON DELETE CASCADE,
  "reportedBy" VARCHAR(100), -- caller name or AI system
  "reportedPhone" VARCHAR(20),
  "incidentType" VARCHAR(100) NOT NULL, -- 'noise_complaint', 'trespassing', 'theft', 'weapon_detected', etc.
  "severity" VARCHAR(20) DEFAULT 'low', -- 'low', 'medium', 'high', 'critical'
  "status" VARCHAR(50) DEFAULT 'reported', -- 'reported', 'investigating', 'resolved', 'closed'
  "location" VARCHAR(255), -- specific area within property
  "description" TEXT NOT NULL,
  "aiConfidence" DECIMAL(5,2), -- AI detection confidence score (0.00-100.00)
  "responseActions" JSONB DEFAULT '[]', -- array of actions taken
  "notificationsSent" JSONB DEFAULT '[]', -- record of who was notified
  "resolvedAt" TIMESTAMP WITH TIME ZONE,
  "resolvedBy" INTEGER REFERENCES "Users"(id) ON DELETE SET NULL,
  "resolutionNotes" TEXT,
  "incidentDate" TIMESTAMP WITH TIME ZONE NOT NULL,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for client portal querying
CREATE INDEX IF NOT EXISTS idx_incidents_client_id ON "Incidents"("clientId");
CREATE INDEX IF NOT EXISTS idx_incidents_property_id ON "Incidents"("propertyId");
CREATE INDEX IF NOT EXISTS idx_incidents_type_severity ON "Incidents"("incidentType", "severity");
CREATE INDEX IF NOT EXISTS idx_incidents_status ON "Incidents"("status");
CREATE INDEX IF NOT EXISTS idx_incidents_date ON "Incidents"("incidentDate");
CREATE INDEX IF NOT EXISTS idx_incidents_number ON "Incidents"("incidentNumber");

-- Step 4: Create Evidence Locker table
-- ===================================
CREATE TABLE IF NOT EXISTS "EvidenceFiles" (
  id SERIAL PRIMARY KEY,
  "incidentId" INTEGER NOT NULL REFERENCES "Incidents"(id) ON DELETE CASCADE,
  "fileName" VARCHAR(255) NOT NULL,
  "originalFileName" VARCHAR(255) NOT NULL,
  "fileType" VARCHAR(50) NOT NULL, -- 'video', 'image', 'audio', 'document'
  "mimeType" VARCHAR(100) NOT NULL,
  "fileSize" BIGINT NOT NULL,
  "filePath" TEXT NOT NULL, -- secure file system path
  "fileHash" VARCHAR(64) NOT NULL, -- SHA-256 for integrity
  "watermarked" BOOLEAN DEFAULT false,
  "watermarkPath" TEXT, -- path to watermarked version for client access
  "thumbnailPath" TEXT, -- thumbnail for quick preview
  "metadata" JSONB DEFAULT '{}', -- camera info, timestamp, etc.
  "uploadedBy" INTEGER REFERENCES "Users"(id) ON DELETE SET NULL,
  "isClientAccessible" BOOLEAN DEFAULT true,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_evidence_incident_id ON "EvidenceFiles"("incidentId");
CREATE INDEX IF NOT EXISTS idx_evidence_file_type ON "EvidenceFiles"("fileType");
CREATE INDEX IF NOT EXISTS idx_evidence_client_access ON "EvidenceFiles"("isClientAccessible");

-- Step 5: Create Call Logs table (for voice AI dispatcher)
-- ========================================================
CREATE TABLE IF NOT EXISTS "CallLogs" (
  id SERIAL PRIMARY KEY,
  "callId" VARCHAR(100) UNIQUE NOT NULL, -- Twilio call SID
  "incidentId" INTEGER REFERENCES "Incidents"(id) ON DELETE SET NULL,
  "propertyId" INTEGER NOT NULL REFERENCES "Properties"(id) ON DELETE CASCADE,
  "clientId" INTEGER NOT NULL REFERENCES "Clients"(id) ON DELETE CASCADE,
  "callerPhone" VARCHAR(20) NOT NULL,
  "callerName" VARCHAR(255),
  "callDirection" VARCHAR(20) NOT NULL, -- 'inbound', 'outbound'
  "callStatus" VARCHAR(50) NOT NULL, -- 'in-progress', 'completed', 'failed', 'no-answer'
  "duration" INTEGER, -- call duration in seconds
  "aiHandled" BOOLEAN DEFAULT true,
  "humanTakeover" BOOLEAN DEFAULT false,
  "takeoverReason" TEXT,
  "takeoverAt" TIMESTAMP WITH TIME ZONE,
  "takeoverBy" INTEGER REFERENCES "Users"(id) ON DELETE SET NULL,
  "callSummary" TEXT,
  "transcript" TEXT,
  "recordingPath" TEXT, -- path to call recording file
  "recordingUrl" TEXT, -- Twilio recording URL
  "callStarted" TIMESTAMP WITH TIME ZONE NOT NULL,
  "callEnded" TIMESTAMP WITH TIME ZONE,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_call_logs_client_id ON "CallLogs"("clientId");
CREATE INDEX IF NOT EXISTS idx_call_logs_property_id ON "CallLogs"("propertyId");
CREATE INDEX IF NOT EXISTS idx_call_logs_incident_id ON "CallLogs"("incidentId");
CREATE INDEX IF NOT EXISTS idx_call_logs_call_started ON "CallLogs"("callStarted");

-- Step 6: Create Contact Lists table (for automated notifications)
-- ===============================================================
CREATE TABLE IF NOT EXISTS "ContactLists" (
  id SERIAL PRIMARY KEY,
  "propertyId" INTEGER NOT NULL REFERENCES "Properties"(id) ON DELETE CASCADE,
  "clientId" INTEGER NOT NULL REFERENCES "Clients"(id) ON DELETE CASCADE,
  "contactType" VARCHAR(50) NOT NULL, -- 'property_manager', 'security_supervisor', 'emergency'
  "contactName" VARCHAR(255) NOT NULL,
  "contactEmail" VARCHAR(255),
  "contactPhone" VARCHAR(20),
  "contactMethod" VARCHAR(20) DEFAULT 'both', -- 'email', 'sms', 'both', 'call'
  "notificationTypes" JSONB DEFAULT '["all"]', -- which incident types to notify for
  "priority" INTEGER DEFAULT 1, -- notification order (1 = first)
  "isActive" BOOLEAN DEFAULT true,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_contact_lists_property_id ON "ContactLists"("propertyId");
CREATE INDEX IF NOT EXISTS idx_contact_lists_client_id ON "ContactLists"("clientId");
CREATE INDEX IF NOT EXISTS idx_contact_lists_active ON "ContactLists"("isActive");

-- Step 7: Create Standard Operating Procedures table
-- =================================================
CREATE TABLE IF NOT EXISTS "StandardOperatingProcedures" (
  id SERIAL PRIMARY KEY,
  "propertyId" INTEGER NOT NULL REFERENCES "Properties"(id) ON DELETE CASCADE,
  "clientId" INTEGER NOT NULL REFERENCES "Clients"(id) ON DELETE CASCADE,
  "incidentType" VARCHAR(100) NOT NULL,
  "procedureName" VARCHAR(255) NOT NULL,
  "procedureSteps" JSONB NOT NULL, -- array of step objects
  "autoActions" JSONB DEFAULT '[]', -- automated actions to take
  "escalationRules" JSONB DEFAULT '{}', -- when to escalate and how
  "requiredContacts" JSONB DEFAULT '[]', -- who must be notified
  "isActive" BOOLEAN DEFAULT true,
  "version" INTEGER DEFAULT 1,
  "createdBy" INTEGER REFERENCES "Users"(id) ON DELETE SET NULL,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_sop_property_id ON "StandardOperatingProcedures"("propertyId");
CREATE INDEX IF NOT EXISTS idx_sop_client_id ON "StandardOperatingProcedures"("clientId");
CREATE INDEX IF NOT EXISTS idx_sop_incident_type ON "StandardOperatingProcedures"("incidentType");
CREATE INDEX IF NOT EXISTS idx_sop_active ON "StandardOperatingProcedures"("isActive");

-- Step 8: Create Client Portal Audit Log
-- =====================================
CREATE TABLE IF NOT EXISTS "ClientPortalAuditLog" (
  id SERIAL PRIMARY KEY,
  "userId" INTEGER REFERENCES "Users"(id) ON DELETE SET NULL,
  "clientId" INTEGER NOT NULL REFERENCES "Clients"(id) ON DELETE CASCADE,
  "action" VARCHAR(100) NOT NULL, -- 'login', 'view_incident', 'download_evidence', etc.
  "resourceType" VARCHAR(50), -- 'incident', 'evidence', 'dashboard', etc.
  "resourceId" INTEGER,
  "details" JSONB DEFAULT '{}',
  "ipAddress" INET,
  "userAgent" TEXT,
  "sessionId" VARCHAR(255),
  "timestamp" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_audit_log_client_id ON "ClientPortalAuditLog"("clientId");
CREATE INDEX IF NOT EXISTS idx_audit_log_user_id ON "ClientPortalAuditLog"("userId");
CREATE INDEX IF NOT EXISTS idx_audit_log_action ON "ClientPortalAuditLog"("action");
CREATE INDEX IF NOT EXISTS idx_audit_log_timestamp ON "ClientPortalAuditLog"("timestamp");

-- Step 9: Grant proper permissions
-- ===============================
ALTER TABLE "ClientPortalSessions" OWNER TO swanadmin;
ALTER TABLE "Incidents" OWNER TO swanadmin;  
ALTER TABLE "EvidenceFiles" OWNER TO swanadmin;
ALTER TABLE "CallLogs" OWNER TO swanadmin;
ALTER TABLE "ContactLists" OWNER TO swanadmin;
ALTER TABLE "StandardOperatingProcedures" OWNER TO swanadmin;
ALTER TABLE "ClientPortalAuditLog" OWNER TO swanadmin;

GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO swanadmin;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO swanadmin;

-- Step 10: Insert sample client portal users and data
-- =================================================

-- Add client portal roles (these users can access the Aegis portal)
INSERT INTO "Users" ("firstName", "lastName", email, password, role, "phoneNumber", "clientId", "clientPermissions") VALUES
('Sarah', 'Johnson', 'sarah.johnson@acme.com', '$2b$10$hash_placeholder', 'client_admin', '555-0301', 1, '{"dashboard": true, "incidents": true, "evidence": true, "analytics": true, "settings": true}'),
('David', 'Smith', 'david.smith@acme.com', '$2b$10$hash_placeholder', 'client_user', '555-0302', 1, '{"dashboard": true, "incidents": true, "evidence": false, "analytics": false, "settings": false}'),
('Lisa', 'Chen', 'lisa.chen@securebuildings.com', '$2b$10$hash_placeholder', 'client_admin', '555-0303', 2, '{"dashboard": true, "incidents": true, "evidence": true, "analytics": true, "settings": true}')
ON CONFLICT (email) DO NOTHING;

-- Add sample incidents for demonstration
INSERT INTO "Incidents" ("incidentNumber", "propertyId", "clientId", "reportedBy", "reportedPhone", "incidentType", "severity", "location", "description", "aiConfidence", "incidentDate") VALUES
('INC-2025-001', 1, 1, 'AI Dispatcher', 'system', 'noise_complaint', 'low', 'Apartment 2B', 'Resident reported loud music from neighboring unit after 10 PM quiet hours', 95.50, '2025-08-05 22:30:00'),
('INC-2025-002', 1, 1, 'John Doe', '555-0123', 'trespassing', 'medium', 'Main Lobby', 'Individual without key card gained entry by following resident', 88.75, '2025-08-05 18:15:00'),
('INC-2025-003', 3, 2, 'AI Vision System', 'system', 'package_theft', 'high', 'Mailroom', 'AI detected suspicious individual taking multiple packages', 92.30, '2025-08-06 14:20:00')
ON CONFLICT ("incidentNumber") DO NOTHING;

-- Add sample contact lists
INSERT INTO "ContactLists" ("propertyId", "clientId", "contactType", "contactName", "contactEmail", "contactPhone", "notificationTypes", "priority") VALUES
(1, 1, 'property_manager', 'Sarah Johnson', 'sarah.johnson@acme.com', '555-0301', '["all"]', 1),
(1, 1, 'security_supervisor', 'Mike Security', 'security@acme.com', '555-0401', '["trespassing", "weapon_detected", "violence"]', 2),
(3, 2, 'property_manager', 'Lisa Chen', 'lisa.chen@securebuildings.com', '555-0303', '["all"]', 1)
ON CONFLICT DO NOTHING;

-- Add sample SOPs
INSERT INTO "StandardOperatingProcedures" ("propertyId", "clientId", "incidentType", "procedureName", "procedureSteps", "autoActions", "escalationRules") VALUES
(1, 1, 'noise_complaint', 'Standard Noise Complaint Response', 
  '[{"step": 1, "action": "Contact reporting party for details"}, {"step": 2, "action": "Attempt to contact noise source"}, {"step": 3, "action": "Document resolution or escalation"}]',
  '["notify_property_manager", "create_incident_report"]',
  '{"escalate_after_minutes": 30, "escalate_to": ["property_manager"]}'),
(1, 1, 'trespassing', 'Trespassing Protocol', 
  '[{"step": 1, "action": "Assess threat level"}, {"step": 2, "action": "Contact security guard"}, {"step": 3, "action": "Monitor situation"}, {"step": 4, "action": "Call authorities if necessary"}]',
  '["dispatch_guard", "notify_supervisor"]',
  '{"escalate_after_minutes": 15, "escalate_to": ["security_supervisor", "police"]}')
ON CONFLICT DO NOTHING;

-- Step 11: Verification queries
-- ============================
SELECT 'Client Portal Setup Completed Successfully!' as status;

SELECT 
  COUNT(*) FILTER (WHERE role = 'client_admin') as client_admin_users,
  COUNT(*) FILTER (WHERE role = 'client_user') as client_users,
  COUNT(*) as total_users 
FROM "Users";

SELECT COUNT(*) as incident_count FROM "Incidents";
SELECT COUNT(*) as contact_count FROM "ContactLists";
SELECT COUNT(*) as sop_count FROM "StandardOperatingProcedures";

-- Display sample data for verification
SELECT 
  i.id, 
  i."incidentNumber", 
  p.name as property_name,
  c.name as client_name,
  i."incidentType",
  i.severity,
  i.status,
  i."incidentDate"
FROM "Incidents" i
JOIN "Properties" p ON i."propertyId" = p.id
JOIN "Clients" c ON i."clientId" = c.id
ORDER BY i."incidentDate" DESC;
