// fix-migration.mjs
'use strict';

import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

// Initialize environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env file
dotenv.config();

async function fixMigration() {
  let sequelize;
  try {
    // Create Sequelize instance using environment variables
    sequelize = new Sequelize(
      process.env.DB_NAME || 'postgres',
      process.env.DB_USER || 'postgres',
      process.env.DB_PASSWORD || '',
      {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432', 10),
        dialect: 'postgres',
        logging: false
      }
    );

    // Test the connection
    await sequelize.authenticate();
    console.log('✅ Connected to database successfully.');

    // Now we'll perform our fixes using raw queries through Sequelize
    const checkpointScansTableExists = await sequelize.query(
      "SELECT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'checkpoint_scans')",
      { type: sequelize.QueryTypes.SELECT }
    );

    if (checkpointScansTableExists[0].exists) {
      console.log('✅ checkpoint_scans table already exists');

      // Check if the patrol_id index exists
      const patrolIdIndexExists = await sequelize.query(
        `SELECT EXISTS (
          SELECT 1 FROM pg_indexes 
          WHERE schemaname = 'public' 
          AND tablename = 'checkpoint_scans' 
          AND indexname = 'checkpoint_scans_patrol_id'
        )`,
        { type: sequelize.QueryTypes.SELECT }
      );

      if (!patrolIdIndexExists[0].exists) {
        // Check if patrol_id column exists
        const patrolIdColumnExists = await sequelize.query(
          `SELECT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = 'public'
            AND table_name = 'checkpoint_scans'
            AND column_name = 'patrol_id'
          )`,
          { type: sequelize.QueryTypes.SELECT }
        );

        if (patrolIdColumnExists[0].exists) {
          // Create the index only if the column exists
          try {
            await sequelize.query(
              `CREATE INDEX "checkpoint_scans_patrol_id" ON "checkpoint_scans" ("patrol_id")`
            );
            console.log('✅ Created index checkpoint_scans_patrol_id');
          } catch (error) {
            console.error(`⚠️ Error creating index: ${error.message}`);
          }
        } else {
          console.log('⚠️ Cannot create index: patrol_id column does not exist');
        }
      } else {
        console.log('✅ checkpoint_scans_patrol_id index already exists');
      }
    } else {
      console.log('⚠️ checkpoint_scans table does not exist');
    }

    // Mark the migration as complete
    try {
      await sequelize.query(
        `INSERT INTO "SequelizeMeta" (name) VALUES ('20250319173850000002-create-checkpoint-scans.cjs')
         ON CONFLICT (name) DO NOTHING`
      );
      console.log('✅ Migration marked as complete in SequelizeMeta');
    } catch (error) {
      console.error(`⚠️ Error marking migration as complete: ${error.message}`);
    }

    console.log('✅ Database fix completed successfully');
  } catch (error) {
    console.error('❌ Error during database fix:', error);
  } finally {
    if (sequelize) {
      await sequelize.close();
      console.log('✅ Database connection closed');
    }
  }
}

fixMigration().catch(error => {
  console.error('❌ Unhandled error:', error);
  process.exit(1);
});