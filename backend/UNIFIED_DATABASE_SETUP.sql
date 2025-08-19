-- APEX AI UNIFIED DATABASE SETUP - PRODUCTION READY
-- ===================================================
-- This script creates a completely unified, consistent database structure
-- that resolves all ID type conflicts and naming inconsistencies
-- 
-- IMPORTANT: This will DROP existing tables to ensure consistency
-- Back up any important data before running!

-- ===========================
-- STEP 1: CLEAN SLATE SETUP
-- ===========================

-- Drop existing tables in correct dependency order (if they exist)
DROP TABLE IF EXISTS "ClientPortalSessions" CASCADE;
DROP TABLE IF EXISTS "ClientPortalAuditLog" CASCADE;
DROP TABLE IF EXISTS standard_operating_procedures CASCADE;
DROP TABLE IF EXISTS contact_lists CASCADE; 
DROP TABLE IF EXISTS call_logs CASCADE;
DROP TABLE IF EXISTS incident_evidence CASCADE;
DROP TABLE IF EXISTS incidents CASCADE;
DROP TABLE IF EXISTS property_assignments CASCADE;
DROP TABLE IF EXISTS schedules CASCADE;
DROP TABLE IF EXISTS reports CASCADE;
DROP TABLE IF EXISTS properties CASCADE;
DROP TABLE IF EXISTS clients CASCADE;
DROP TABLE IF EXISTS guards CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Drop old quoted table names too
DROP TABLE IF EXISTS "Reports" CASCADE;
DROP TABLE IF EXISTS "Schedules" CASCADE;
DROP TABLE IF EXISTS "Properties" CASCADE; 
DROP TABLE IF EXISTS "Clients" CASCADE;
DROP TABLE IF EXISTS "Users" CASCADE;

-- Reset sequences if they exist
DROP SEQUENCE IF EXISTS users_id_seq CASCADE;
DROP SEQUENCE IF EXISTS clients_id_seq CASCADE;
DROP SEQUENCE IF EXISTS properties_id_seq CASCADE;

-- ===========================
-- STEP 2: CREATE CORE TABLES WITH UNIFIED ID SYSTEM
-- ===========================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- USERS TABLE (Master user table with complete role system)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Basic Authentication
    username VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    
    -- UNIFIED ROLE SYSTEM (8 roles as per Master Prompt)
    role VARCHAR(50) NOT NULL DEFAULT 'user' CHECK (
        role IN (
            'super_admin',    -- CTO level - highest privilege
            'admin_cto',      -- CTO specific role
            'admin_ceo',      -- CEO role
            'admin_cfo',      -- CFO role  
            'manager',        -- Dispatch management
            'client',         -- Property owners/managers
            'guard',          -- Security personnel
            'user'            -- Pending/unapproved accounts
        )
    ),
    
    -- Personal Information
    first_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255) NOT NULL,
    phone_number VARCHAR(20),
    emergency_contact_name VARCHAR(255),
    emergency_contact_phone VARCHAR(20),
    
    -- Profile Information
    profile_image VARCHAR(500),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(50),
    zip_code VARCHAR(20),
    date_of_birth DATE,
    hire_date DATE,
    employee_id VARCHAR(100) UNIQUE,
    
    -- Security & Licensing (for guards)
    security_license_number VARCHAR(100),
    security_license_expiry DATE,
    
    -- Client-specific Information
    company_name VARCHAR(255),
    company_position VARCHAR(100),
    client_id UUID, -- Will reference clients table
    
    -- Client Portal Permissions (JSONB for flexibility)
    client_permissions JSONB DEFAULT '{}',
    
    -- Security & Session Management
    last_login TIMESTAMP WITH TIME ZONE,
    reset_password_token VARCHAR(500),
    reset_password_expires TIMESTAMP WITH TIME ZONE,
    failed_login_attempts INTEGER DEFAULT 0,
    account_locked BOOLEAN DEFAULT false,
    account_locked_until TIMESTAMP WITH TIME ZONE,
    email_verified BOOLEAN DEFAULT false,
    email_verification_token VARCHAR(500),
    two_factor_auth_enabled BOOLEAN DEFAULT false,
    two_factor_auth_secret VARCHAR(500),
    
    -- Account Status
    is_active BOOLEAN DEFAULT true,
    status VARCHAR(50) DEFAULT 'pending' CHECK (
        status IN ('pending', 'active', 'suspended', 'terminated')
    ),
    
    -- System Fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_active TIMESTAMP WITH TIME ZONE,
    
    -- Preferences
    notifications_enabled BOOLEAN DEFAULT true,
    time_zone VARCHAR(100) DEFAULT 'America/New_York',
    language_preference VARCHAR(10) DEFAULT 'en-US'
);

-- CLIENTS TABLE (Property management companies)
CREATE TABLE clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone_number VARCHAR(20),
    address TEXT,
    contact_person_name VARCHAR(255),
    contact_person_email VARCHAR(255),
    contact_person_phone VARCHAR(20),
    
    -- Contract Information
    contract_start DATE,
    contract_end DATE,
    contract_type VARCHAR(100),
    billing_address TEXT,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    
    -- System Fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- PROPERTIES TABLE (Buildings/locations managed)
CREATE TABLE properties (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    address TEXT NOT NULL,
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    
    -- Property Details
    property_type VARCHAR(100),
    access_codes TEXT,
    special_instructions TEXT,
    emergency_contact_name VARCHAR(255),
    emergency_contact_phone VARCHAR(20),
    
    -- Geographic Information  
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    timezone VARCHAR(100) DEFAULT 'America/New_York',
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    
    -- System Fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- CONTACT LISTS TABLE (For automated notifications)
CREATE TABLE contact_lists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Basic Information
    name VARCHAR(200) NOT NULL,
    description TEXT,
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    
    -- List Configuration
    list_type VARCHAR(50) NOT NULL CHECK (
        list_type IN ('primary', 'emergency', 'management', 'maintenance', 'security', 'custom')
    ),
    priority_order INTEGER DEFAULT 1,
    
    -- Contact Data (JSONB for flexibility)
    contacts JSONB NOT NULL DEFAULT '[]',
    notification_methods JSONB NOT NULL DEFAULT '["sms", "email"]',
    notification_schedule JSONB,
    
    -- Escalation Settings
    escalation_delay_minutes INTEGER DEFAULT 5,
    max_escalation_attempts INTEGER DEFAULT 3,
    require_acknowledgment BOOLEAN DEFAULT false,
    
    -- Filtering Rules
    applicable_incident_types JSONB,
    excluded_incident_types JSONB,
    active_hours JSONB,
    timezone VARCHAR(50) DEFAULT 'America/New_York',
    
    -- Status & Lifecycle
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'archived')),
    effective_date TIMESTAMP WITH TIME ZONE,
    expiration_date TIMESTAMP WITH TIME ZONE,
    
    -- Management
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    managed_by UUID REFERENCES users(id) ON DELETE SET NULL,
    last_updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
    
    -- Usage Statistics
    times_used INTEGER DEFAULT 0,
    successful_notifications INTEGER DEFAULT 0,
    failed_notifications INTEGER DEFAULT 0,
    last_used_at TIMESTAMP WITH TIME ZONE,
    
    -- Audit & Compliance
    audit_log JSONB,
    compliance_notes TEXT,
    tags JSONB,
    notes TEXT,
    
    -- System Fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- STANDARD OPERATING PROCEDURES TABLE (AI decision engine)
CREATE TABLE standard_operating_procedures (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Basic Information
    title VARCHAR(200) NOT NULL,
    description TEXT,
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    
    -- Incident Classification
    incident_type VARCHAR(50) NOT NULL CHECK (
        incident_type IN (
            'noise_complaint', 'lockout', 'maintenance_emergency', 'security_breach',
            'medical_emergency', 'fire_alarm', 'suspicious_activity', 'package_theft',
            'vandalism', 'domestic_disturbance', 'utility_outage', 'elevator_emergency',
            'parking_violation', 'unauthorized_access', 'general_inquiry', 'other'
        )
    ),
    priority_level VARCHAR(20) NOT NULL DEFAULT 'medium' CHECK (
        priority_level IN ('low', 'medium', 'high', 'critical')
    ),
    
    -- AI Conversation Flow
    initial_response_script TEXT NOT NULL,
    information_gathering_questions JSONB,
    conversation_flow JSONB,
    automated_actions JSONB,
    
    -- Notification Settings
    notify_guard BOOLEAN DEFAULT true,
    notify_manager BOOLEAN DEFAULT false,
    notify_emergency_services BOOLEAN DEFAULT false,
    notification_delay_minutes INTEGER DEFAULT 0,
    
    -- Escalation Rules
    escalation_triggers JSONB,
    auto_escalate_after_minutes INTEGER,
    human_takeover_threshold DECIMAL(3,2) DEFAULT 0.70,
    
    -- Contact References
    primary_contact_list_id UUID REFERENCES contact_lists(id) ON DELETE SET NULL,
    emergency_contact_list_id UUID REFERENCES contact_lists(id) ON DELETE SET NULL,
    
    -- Documentation & Compliance
    compliance_requirements JSONB,
    documentation_requirements JSONB,
    
    -- Status & Lifecycle
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'inactive', 'archived')),
    version VARCHAR(20) NOT NULL DEFAULT '1.0',
    effective_date TIMESTAMP WITH TIME ZONE,
    expiration_date TIMESTAMP WITH TIME ZONE,
    
    -- Approval & Authorization
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
    approved_at TIMESTAMP WITH TIME ZONE,
    
    -- Usage Statistics
    times_used INTEGER DEFAULT 0,
    success_rate DECIMAL(5,4),
    last_used_at TIMESTAMP WITH TIME ZONE,
    
    -- Metadata
    tags JSONB,
    notes TEXT,
    
    -- System Fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- INCIDENTS TABLE (Security incident tracking)
CREATE TABLE incidents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    incident_number VARCHAR(50) UNIQUE NOT NULL,
    
    -- Basic Information
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    
    -- Incident Details
    incident_type VARCHAR(50) NOT NULL,
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    status VARCHAR(20) NOT NULL DEFAULT 'reported' CHECK (
        status IN ('reported', 'investigating', 'resolved', 'closed')
    ),
    
    location TEXT,
    description TEXT NOT NULL,
    
    -- AI Analysis
    ai_confidence DECIMAL(5,2),
    ai_analysis JSONB,
    detection_method VARCHAR(100),
    
    -- Timing
    incident_date TIMESTAMP WITH TIME ZONE NOT NULL,
    reported_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP WITH TIME ZONE,
    
    -- Reporting Information
    reported_by VARCHAR(255),
    reported_phone VARCHAR(20),
    reported_email VARCHAR(255),
    
    -- Resolution
    resolved_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    resolved_by_name VARCHAR(255),
    resolution_notes TEXT,
    
    -- Associated Records
    sop_used UUID REFERENCES standard_operating_procedures(id) ON DELETE SET NULL,
    
    -- Metadata
    evidence_count INTEGER DEFAULT 0,
    notification_count INTEGER DEFAULT 0,
    tags JSONB,
    
    -- System Fields  
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- CLIENT PORTAL SESSIONS TABLE (Authentication for client portal)
CREATE TABLE client_portal_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    
    -- Session Tokens
    session_token VARCHAR(500) UNIQUE NOT NULL,
    refresh_token VARCHAR(500) UNIQUE NOT NULL,
    
    -- Session Information
    ip_address INET,
    user_agent TEXT,
    device_info JSONB,
    
    -- Timing
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    logout_reason VARCHAR(100),
    
    -- Security
    failed_attempts INTEGER DEFAULT 0,
    security_flags JSONB
);

-- CLIENT PORTAL AUDIT LOG (Security compliance)
CREATE TABLE client_portal_audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- User Context
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
    session_id UUID REFERENCES client_portal_sessions(id) ON DELETE SET NULL,
    
    -- Action Details
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(100),
    resource_id UUID,
    
    -- Request Information
    endpoint VARCHAR(500),
    method VARCHAR(10),
    request_data JSONB,
    response_status INTEGER,
    
    -- Client Information
    ip_address INET,
    user_agent TEXT,
    session_token VARCHAR(500),
    
    -- Timing
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Additional Context
    metadata JSONB,
    error_details TEXT
);

-- ===========================
-- STEP 3: CREATE INDEXES FOR PERFORMANCE
-- ===========================

-- Users table indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_client_id ON users(client_id);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_users_is_active ON users(is_active);

-- Properties table indexes
CREATE INDEX idx_properties_client_id ON properties(client_id);
CREATE INDEX idx_properties_is_active ON properties(is_active);

-- Contact lists indexes
CREATE INDEX idx_contact_lists_property_id ON contact_lists(property_id);
CREATE INDEX idx_contact_lists_type ON contact_lists(list_type);
CREATE INDEX idx_contact_lists_status ON contact_lists(status);

-- SOPs indexes
CREATE INDEX idx_sops_property_id ON standard_operating_procedures(property_id);
CREATE INDEX idx_sops_incident_type ON standard_operating_procedures(incident_type);
CREATE INDEX idx_sops_status ON standard_operating_procedures(status);

-- Incidents indexes
CREATE INDEX idx_incidents_property_id ON incidents(property_id);
CREATE INDEX idx_incidents_client_id ON incidents(client_id);
CREATE INDEX idx_incidents_date ON incidents(incident_date);
CREATE INDEX idx_incidents_status ON incidents(status);
CREATE INDEX idx_incidents_severity ON incidents(severity);

-- Client portal session indexes
CREATE INDEX idx_client_sessions_user_id ON client_portal_sessions(user_id);
CREATE INDEX idx_client_sessions_client_id ON client_portal_sessions(client_id);
CREATE INDEX idx_client_sessions_token ON client_portal_sessions(session_token);
CREATE INDEX idx_client_sessions_active ON client_portal_sessions(is_active);

-- Audit log indexes
CREATE INDEX idx_audit_log_user_id ON client_portal_audit_log(user_id);
CREATE INDEX idx_audit_log_client_id ON client_portal_audit_log(client_id);
CREATE INDEX idx_audit_log_action ON client_portal_audit_log(action);
CREATE INDEX idx_audit_log_timestamp ON client_portal_audit_log(timestamp);

-- ===========================
-- STEP 4: ADD FOREIGN KEY CONSTRAINTS
-- ===========================

-- Add client reference to users table
ALTER TABLE users ADD CONSTRAINT fk_users_client_id 
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL;

-- ===========================
-- STEP 5: CREATE SAMPLE DATA
-- ===========================

-- Insert sample client
INSERT INTO clients (id, name, email, phone_number, address, contact_person_name, contact_person_email) VALUES
    (uuid_generate_v4(), 'ACME Property Management', 'contact@acme.com', '555-0201', '123 Business St, City, State', 'John Smith', 'john@acme.com'),
    (uuid_generate_v4(), 'SecureBuildings Inc', 'info@securebuildings.com', '555-0202', '456 Office Ave, City, State', 'Jane Doe', 'jane@securebuildings.com');

-- Get the client IDs for sample data
DO $$
DECLARE
    acme_client_id UUID;
    secure_client_id UUID;
    acme_property_id UUID;
    admin_user_id UUID;
    client_user_id UUID;
BEGIN
    -- Get client IDs
    SELECT id INTO acme_client_id FROM clients WHERE name = 'ACME Property Management';
    SELECT id INTO secure_client_id FROM clients WHERE name = 'SecureBuildings Inc';
    
    -- Insert sample properties
    INSERT INTO properties (id, name, address, client_id, property_type, special_instructions) VALUES
        (uuid_generate_v4(), 'ACME Headquarters', '123 Business St, City, State', acme_client_id, 'Office Building', 'Check all entry points hourly'),
        (uuid_generate_v4(), 'ACME Warehouse', '789 Industrial Rd, City, State', acme_client_id, 'Warehouse', 'Monitor loading dock area'),
        (uuid_generate_v4(), 'Secure Office Complex', '456 Office Ave, City, State', secure_client_id, 'Office Building', 'Patrol parking garage every 2 hours');
    
    -- Get property ID for sample data
    SELECT id INTO acme_property_id FROM properties WHERE name = 'ACME Headquarters';
    
    -- Insert sample users with different roles
    INSERT INTO users (id, username, email, password, role, first_name, last_name, phone_number, client_id, client_permissions) VALUES
        (uuid_generate_v4(), 'admin', 'admin@apex-ai.com', '$2b$10$hash', 'super_admin', 'System', 'Administrator', '555-0100', NULL, '{}'),
        (uuid_generate_v4(), 'manager', 'manager@apex-ai.com', '$2b$10$hash', 'manager', 'Dispatch', 'Manager', '555-0101', NULL, '{}'),
        (uuid_generate_v4(), 'guard1', 'guard1@apex-ai.com', '$2b$10$hash', 'guard', 'John', 'Guard', '555-0102', NULL, '{}'),
        (uuid_generate_v4(), 'client1', 'client@acme.com', '$2b$10$hash', 'client', 'John', 'Smith', '555-0201', acme_client_id, '{"dashboard": true, "incidents": true, "evidence": true, "analytics": false, "settings": false}'),
        (uuid_generate_v4(), 'clientadmin', 'admin@acme.com', '$2b$10$hash', 'client', 'Jane', 'Admin', '555-0202', acme_client_id, '{"dashboard": true, "incidents": true, "evidence": true, "analytics": true, "settings": true}');
    
    -- Get user IDs for sample data
    SELECT id INTO admin_user_id FROM users WHERE username = 'admin';
    SELECT id INTO client_user_id FROM users WHERE username = 'client1';
    
    -- Insert sample contact list
    INSERT INTO contact_lists (id, name, description, property_id, list_type, contacts, created_by) VALUES
        (uuid_generate_v4(), 'ACME Emergency Contacts', 'Primary emergency contact list for ACME Headquarters', 
         acme_property_id, 'emergency', 
         '[{"name": "Security Manager", "phone": "+15551234567", "email": "security@acme.com", "role": "primary"}]',
         admin_user_id);
         
END $$;

-- ===========================
-- FINAL STATUS CHECK
-- ===========================
SELECT 'APEX AI Database Setup Complete!' as status;
SELECT COUNT(*) as total_tables FROM information_schema.tables WHERE table_schema = 'public';
SELECT COUNT(*) as total_users FROM users;
SELECT COUNT(*) as total_clients FROM clients;  
SELECT COUNT(*) as total_properties FROM properties;

-- Display role distribution
SELECT role, COUNT(*) as count FROM users GROUP BY role ORDER BY count DESC;
