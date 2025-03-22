'use strict';

import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const { Client } = pg;

async function fixCheckpointScansMigration() {
  let client;
  try {
    // IMPORTANT: Change these values to match your database configuration
    // You can find these in your config.cjs or in your .env file
    const dbConfig = {
      host: 'localhost',
      port: 5432,
      database: 'defense_db', // CHANGE THIS to your database name
      user: 'postgres',      // CHANGE THIS to your database username
      password: 'password'   // CHANGE THIS to your database password
    };
    
    console.log(`Connecting to database ${dbConfig.database} on ${dbConfig.host}:${dbConfig.port} as ${dbConfig.user}`);
    
    client = new Client(dbConfig);
    await client.connect();
    console.log('Connected to database successfully');

    // Ensure the uuid-ossp extension exists
    await client.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
    console.log('Ensured uuid-ossp extension is available');

    // Check if table exists
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'checkpoint_scans'
      )
    `);

    const tableExists = tableCheck.rows[0].exists;

    if (tableExists) {
      console.log('Checkpoint_scans table already exists, will check and create any missing indexes');
    } else {
      // Create the table
      await client.query(`
        CREATE TABLE "checkpoint_scans" (
          "id" UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
          "patrol_id" UUID NOT NULL REFERENCES "patrols" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
          "checkpoint_id" UUID NOT NULL REFERENCES "checkpoints" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
          "guard_id" UUID NOT NULL REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
          "property_id" UUID NOT NULL REFERENCES "properties" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
          "scan_time" TIMESTAMP WITH TIME ZONE NOT NULL,
          "sequence_number" INTEGER,
          "scheduled_time" TIMESTAMP WITH TIME ZONE,
          "verification_method" VARCHAR(255) NOT NULL DEFAULT 'qr_code',
          "verification_data" VARCHAR(255),
          "verification_successful" BOOLEAN DEFAULT true,
          "latitude" FLOAT,
          "longitude" FLOAT,
          "accuracy_meters" FLOAT,
          "gps_verified" BOOLEAN DEFAULT false,
          "location_deviation_meters" FLOAT,
          "on_time" BOOLEAN DEFAULT true,
          "time_deviation_minutes" INTEGER,
          "completed_actions" JSONB DEFAULT '[]',
          "skipped_actions" JSONB DEFAULT '[]',
          "action_compliance" FLOAT DEFAULT 100.0,
          "status" VARCHAR(255) NOT NULL DEFAULT 'completed',
          "issue_reported" BOOLEAN DEFAULT false,
          "issue_type" VARCHAR(255),
          "issue_description" TEXT,
          "issue_severity" VARCHAR(255),
          "reported_incident_id" UUID REFERENCES "incidents" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
          "reported_maintenance_id" UUID REFERENCES "maintenance_requests" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
          "notes" TEXT,
          "photos" JSONB DEFAULT '[]',
          "videos" JSONB DEFAULT '[]',
          "device_id" VARCHAR(255),
          "device_type" VARCHAR(255),
          "app_version" VARCHAR(255),
          "battery_level" FLOAT,
          "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
      `);
      console.log('Created checkpoint_scans table');
    }

    // Define the indexes we want to ensure exist
    const indexesToCreate = [
      { name: 'checkpoint_scans_patrol_id', columns: '"patrol_id"' },
      { name: 'checkpoint_scans_checkpoint_id', columns: '"checkpoint_id"' },
      { name: 'checkpoint_scans_guard_id', columns: '"guard_id"' },
      { name: 'checkpoint_scans_property_id', columns: '"property_id"' },
      { name: 'checkpoint_scans_scan_time', columns: '"scan_time"' },
      { name: 'checkpoint_scans_status', columns: '"status"' },
      { name: 'checkpoint_scans_patrol_checkpoint', columns: '"patrol_id", "checkpoint_id"' },
      { name: 'checkpoint_scans_guard_scan_time', columns: '"guard_id", "scan_time"' },
      { name: 'checkpoint_scans_property_scan_time', columns: '"property_id", "scan_time"' }
    ];

    // Create each index if it doesn't exist
    for (const index of indexesToCreate) {
      const indexCheck = await client.query(`
        SELECT EXISTS (
          SELECT 1 FROM pg_indexes 
          WHERE schemaname = 'public' 
          AND tablename = 'checkpoint_scans' 
          AND indexname = $1
        )
      `, [index.name]);

      if (!indexCheck.rows[0].exists) {
        try {
          await client.query(`CREATE INDEX "${index.name}" ON "checkpoint_scans" (${index.columns})`);
          console.log(`Created index ${index.name}`);
        } catch (error) {
          console.error(`Error creating index ${index.name}: ${error.message}`);
        }
      } else {
        console.log(`Index ${index.name} already exists`);
      }
    }

    // Check if SequelizeMeta table exists
    const metaTableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'SequelizeMeta'
      )
    `);

    if (metaTableCheck.rows[0].exists) {
      // Mark the migration as complete in SequelizeMeta if not already present
      const metaCheck = await client.query(`
        SELECT EXISTS (
          SELECT FROM "SequelizeMeta" 
          WHERE name = '20250319173850000002-create-checkpoint-scans.cjs'
        )
      `);

      if (!metaCheck.rows[0].exists) {
        await client.query(`
          INSERT INTO "SequelizeMeta" (name) 
          VALUES ('20250319173850000002-create-checkpoint-scans.cjs')
        `);
        console.log('Marked migration as complete in SequelizeMeta');
      } else {
        console.log('Migration already marked as complete in SequelizeMeta');
      }
    } else {
      console.log('SequelizeMeta table does not exist, skipping migration marking');
    }

    console.log('Database fix completed successfully');
  } catch (error) {
    console.error('Error during database fix:', error);
  } finally {
    try {
      if (client) {
        await client.end();
        console.log('Database connection closed');
      }
    } catch (err) {
      console.error('Error closing database connection:', err);
    }
  }
}

// Run the fix
fixCheckpointScansMigration().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});