-- APEX AI SECURITY PLATFORM - COMPLETE TABLE SETUP
-- ==================================================
-- Copy and paste this entire script into pgAdmin Query Tool
-- Make sure you're connected to the 'apex' database

-- Step 1: Ensure swanadmin has proper permissions
GRANT CREATE ON SCHEMA public TO swanadmin;
GRANT ALL PRIVILEGES ON SCHEMA public TO swanadmin;

-- Step 2: Create all tables
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

-- Step 3: Grant ownership to swanadmin
ALTER TABLE "Users" OWNER TO swanadmin;
ALTER TABLE "Clients" OWNER TO swanadmin;
ALTER TABLE "Properties" OWNER TO swanadmin;
ALTER TABLE "Reports" OWNER TO swanadmin;
ALTER TABLE "Schedules" OWNER TO swanadmin;

-- Step 4: Grant all privileges
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO swanadmin;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO swanadmin;

-- Step 5: Insert sample data
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

-- Step 6: Verification (run these after the above)
SELECT 'Setup completed successfully!' as status;
SELECT COUNT(*) as user_count FROM "Users";
SELECT COUNT(*) as client_count FROM "Clients";
SELECT COUNT(*) as property_count FROM "Properties";
SELECT COUNT(*) as report_count FROM "Reports";
SELECT COUNT(*) as schedule_count FROM "Schedules";