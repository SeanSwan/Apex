-- APEX AI - TABLES ONLY SETUP
-- ============================
-- Run this to create missing tables (database already exists)

-- Users table
CREATE TABLE IF NOT EXISTS "Users" (
    id SERIAL PRIMARY KEY,
    "firstName" VARCHAR(255) NOT NULL,
    "lastName" VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'guard',
    "phoneNumber" VARCHAR(20),
    "isActive" BOOLEAN DEFAULT true,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Clients table
CREATE TABLE IF NOT EXISTS "Clients" (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    "phoneNumber" VARCHAR(20),
    address TEXT,
    "contractStart" DATE,
    "contractEnd" DATE,
    "isActive" BOOLEAN DEFAULT true,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Properties table
CREATE TABLE IF NOT EXISTS "Properties" (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    address TEXT NOT NULL,
    "clientId" INTEGER REFERENCES "Clients"(id) ON DELETE CASCADE,
    "propertyType" VARCHAR(100),
    "accessCodes" TEXT,
    "specialInstructions" TEXT,
    "isActive" BOOLEAN DEFAULT true,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Reports table
CREATE TABLE IF NOT EXISTS "Reports" (
    id SERIAL PRIMARY KEY,
    "guardId" INTEGER REFERENCES "Users"(id) ON DELETE SET NULL,
    "clientId" INTEGER REFERENCES "Clients"(id) ON DELETE CASCADE,
    "propertyId" INTEGER REFERENCES "Properties"(id) ON DELETE CASCADE,
    "shiftDate" DATE NOT NULL,
    "startTime" TIME,
    "endTime" TIME,
    title VARCHAR(255),
    description TEXT,
    "incidentOccurred" BOOLEAN DEFAULT false,
    "incidentDescription" TEXT,
    "weatherConditions" VARCHAR(100),
    status VARCHAR(50) DEFAULT 'draft',
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Schedules table  
CREATE TABLE IF NOT EXISTS "Schedules" (
    id SERIAL PRIMARY KEY,
    "guardId" INTEGER REFERENCES "Users"(id) ON DELETE CASCADE,
    "propertyId" INTEGER REFERENCES "Properties"(id) ON DELETE CASCADE,
    "shiftDate" DATE NOT NULL,
    "startTime" TIME NOT NULL,
    "endTime" TIME NOT NULL,
    status VARCHAR(50) DEFAULT 'scheduled',
    notes TEXT,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insert sample data for testing
INSERT INTO "Users" ("firstName", "lastName", email, password, role, "phoneNumber") VALUES
('John', 'Guard', 'guard@example.com', '$2b$10$hash', 'guard', '555-0101'),
('Jane', 'Admin', 'admin@example.com', '$2b$10$hash', 'admin', '555-0102'),
('Mike', 'Supervisor', 'supervisor@example.com', '$2b$10$hash', 'supervisor', '555-0103')
ON CONFLICT (email) DO NOTHING;

INSERT INTO "Clients" (name, email, "phoneNumber", address, "contractStart", "contractEnd") VALUES
('ACME Corporation', 'contact@acme.com', '555-0201', '123 Business St, City, State', '2025-01-01', '2025-12-31'),
('SecureBuildings Inc', 'info@securebuildings.com', '555-0202', '456 Office Ave, City, State', '2025-01-01', '2025-12-31')
ON CONFLICT DO NOTHING;

INSERT INTO "Properties" (name, address, "clientId", "propertyType", "specialInstructions") VALUES
('ACME Headquarters', '123 Business St, City, State', 1, 'Office Building', 'Check all entry points hourly'),
('ACME Warehouse', '789 Industrial Rd, City, State', 1, 'Warehouse', 'Monitor loading dock area'),
('Secure Office Complex', '456 Office Ave, City, State', 2, 'Office Building', 'Patrol parking garage every 2 hours')
ON CONFLICT DO NOTHING;

-- Verification
SELECT 'Tables created successfully!' as status;
SELECT COUNT(*) as user_count FROM "Users";
SELECT COUNT(*) as client_count FROM "Clients";
SELECT COUNT(*) as property_count FROM "Properties";
