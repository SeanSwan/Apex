'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    try {
      // Check if table already exists
      const tableExists = await queryInterface.sequelize.query(
        "SELECT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'checkpoint_scans')",
        { type: queryInterface.sequelize.QueryTypes.SELECT }
      ).then(result => result[0].exists);
      
      if (!tableExists) {
        // Create the table using raw SQL for full control
        await queryInterface.sequelize.query(`
          CREATE TABLE IF NOT EXISTS "checkpoint_scans" (
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
          );
        `);
        console.log('Created checkpoint_scans table using raw SQL');
        
        // Now create indexes in separate transactions, one by one
        // This approach helps isolate failures and ensures the table is fully created first
        
        const createIndexIfNotExists = async (indexName, tableName, columnList) => {
          try {
            // Check if index exists
            const indexExists = await queryInterface.sequelize.query(
              `SELECT EXISTS (
                SELECT 1 FROM pg_indexes 
                WHERE schemaname = 'public' 
                AND tablename = $1 
                AND indexname = $2
              )`,
              { 
                type: queryInterface.sequelize.QueryTypes.SELECT,
                replacements: [tableName, indexName]
              }
            ).then(result => result[0].exists);
            
            if (!indexExists) {
              // Create index
              await queryInterface.sequelize.query(
                `CREATE INDEX IF NOT EXISTS "${indexName}" ON "${tableName}" (${columnList})`
              );
              console.log(`Created index ${indexName}`);
            } else {
              console.log(`Index ${indexName} already exists, skipping`);
            }
          } catch (error) {
            console.error(`Error creating index ${indexName}: ${error.message}`);
            // Continue with migration even if this index fails
          }
        };
        
        // Create indexes one by one with 100ms gaps between them
        await new Promise(resolve => setTimeout(resolve, 100));
        await createIndexIfNotExists('checkpoint_scans_patrol_id', 'checkpoint_scans', '"patrol_id"');
        
        await new Promise(resolve => setTimeout(resolve, 100));
        await createIndexIfNotExists('checkpoint_scans_checkpoint_id', 'checkpoint_scans', '"checkpoint_id"');
        
        await new Promise(resolve => setTimeout(resolve, 100));
        await createIndexIfNotExists('checkpoint_scans_guard_id', 'checkpoint_scans', '"guard_id"');
        
        await new Promise(resolve => setTimeout(resolve, 100));
        await createIndexIfNotExists('checkpoint_scans_property_id', 'checkpoint_scans', '"property_id"');
        
        await new Promise(resolve => setTimeout(resolve, 100));
        await createIndexIfNotExists('checkpoint_scans_scan_time', 'checkpoint_scans', '"scan_time"');
        
        await new Promise(resolve => setTimeout(resolve, 100));
        await createIndexIfNotExists('checkpoint_scans_status', 'checkpoint_scans', '"status"');
        
        // Composite indexes
        await new Promise(resolve => setTimeout(resolve, 100));
        await createIndexIfNotExists('checkpoint_scans_patrol_checkpoint', 'checkpoint_scans', '"patrol_id", "checkpoint_id"');
        
        await new Promise(resolve => setTimeout(resolve, 100));
        await createIndexIfNotExists('checkpoint_scans_guard_scan_time', 'checkpoint_scans', '"guard_id", "scan_time"');
        
        await new Promise(resolve => setTimeout(resolve, 100));
        await createIndexIfNotExists('checkpoint_scans_property_scan_time', 'checkpoint_scans', '"property_id", "scan_time"');
        
      } else {
        console.log('Checkpoint_scans table already exists, skipping creation');
      }
      
      console.log('Checkpoint_scans migration completed successfully');
    } catch (error) {
      console.error('Error in checkpoint_scans migration:', error);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    try {
      // Drop the table with CASCADE to remove all dependencies
      await queryInterface.sequelize.query('DROP TABLE IF EXISTS "checkpoint_scans" CASCADE');
      console.log('Dropped checkpoint_scans table');
    } catch (error) {
      console.error('Error dropping checkpoint_scans table:', error);
      throw error;
    }
  }
};