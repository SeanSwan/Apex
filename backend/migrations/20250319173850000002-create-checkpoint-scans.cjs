'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    try {
      // Step 1: Create the table first
      await queryInterface.createTable('checkpoint_scans', {
        id: {
          type: Sequelize.UUID,
          defaultValue: Sequelize.UUIDV4,
          primaryKey: true
        },
        patrol_id: {
          type: Sequelize.UUID,
          allowNull: false,
          references: {
            model: 'patrols',
            key: 'id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE'
        },
        checkpoint_id: {
          type: Sequelize.UUID,
          allowNull: false,
          references: {
            model: 'checkpoints',
            key: 'id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE'
        },
        guard_id: {
          type: Sequelize.UUID,
          allowNull: false,
          references: {
            model: 'users',
            key: 'id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE'
        },
        property_id: {
          type: Sequelize.UUID,
          allowNull: false,
          references: {
            model: 'properties',
            key: 'id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE'
        },
        // Scan details
        scan_time: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.NOW
        },
        sequence_number: {
          type: Sequelize.INTEGER
        },
        scheduled_time: {
          type: Sequelize.DATE
        },
        // Verification methods
        verification_method: {
          type: Sequelize.STRING,
          allowNull: false,
          defaultValue: 'qr_code'
        },
        verification_data: {
          type: Sequelize.STRING
        },
        verification_successful: {
          type: Sequelize.BOOLEAN,
          defaultValue: true
        },
        // Location tracking
        latitude: {
          type: Sequelize.FLOAT
        },
        longitude: {
          type: Sequelize.FLOAT
        },
        accuracy_meters: {
          type: Sequelize.FLOAT
        },
        gps_verified: {
          type: Sequelize.BOOLEAN,
          defaultValue: false
        },
        location_deviation_meters: {
          type: Sequelize.FLOAT
        },
        // Compliance checks
        on_time: {
          type: Sequelize.BOOLEAN,
          defaultValue: true
        },
        time_deviation_minutes: {
          type: Sequelize.INTEGER
        },
        completed_actions: {
          type: Sequelize.JSONB,
          defaultValue: []
        },
        skipped_actions: {
          type: Sequelize.JSONB,
          defaultValue: []
        },
        action_compliance: {
          type: Sequelize.FLOAT,
          defaultValue: 100
        },
        // Status and results
        status: {
          type: Sequelize.STRING,
          allowNull: false,
          defaultValue: 'completed'
        },
        issue_reported: {
          type: Sequelize.BOOLEAN,
          defaultValue: false
        },
        issue_type: {
          type: Sequelize.STRING
        },
        issue_description: {
          type: Sequelize.TEXT
        },
        issue_severity: {
          type: Sequelize.STRING
        },
        reported_incident_id: {
          type: Sequelize.UUID,
          references: {
            model: 'incidents',
            key: 'id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL'
        },
        reported_maintenance_id: {
          type: Sequelize.UUID,
          references: {
            model: 'maintenance_requests',
            key: 'id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL'
        },
        // Notes and documentation
        notes: {
          type: Sequelize.TEXT
        },
        photos: {
          type: Sequelize.JSONB,
          defaultValue: []
        },
        videos: {
          type: Sequelize.JSONB,
          defaultValue: []
        },
        // Device information
        device_id: {
          type: Sequelize.STRING
        },
        device_type: {
          type: Sequelize.STRING
        },
        app_version: {
          type: Sequelize.STRING
        },
        battery_level: {
          type: Sequelize.FLOAT
        },
        // System fields
        created_at: {
          type: Sequelize.DATE,
          defaultValue: Sequelize.NOW
        },
        updated_at: {
          type: Sequelize.DATE,
          defaultValue: Sequelize.NOW
        }
      });
      
      console.log('Created checkpoint_scans table');
      
      // Step 2: Add indexes one by one with checks for existing columns
      // Helper function to safely create an index
      const safeCreateIndex = async (tableName, columnName) => {
        try {
          // First check if the index already exists
          const indexName = `${tableName}_${columnName}`;
          const checkIndex = await queryInterface.sequelize.query(
            `SELECT EXISTS (
              SELECT 1 FROM pg_indexes
              WHERE tablename = '${tableName}'
              AND indexname = '${indexName}'
            )`,
            { type: queryInterface.sequelize.QueryTypes.SELECT }
          );
          
          if (checkIndex[0].exists) {
            console.log(`Index ${indexName} already exists, skipping`);
            return;
          }
          
          // Then check if the column exists
          const checkColumn = await queryInterface.sequelize.query(
            `SELECT EXISTS (
              SELECT 1 FROM information_schema.columns
              WHERE table_name = '${tableName}'
              AND column_name = '${columnName}'
            )`,
            { type: queryInterface.sequelize.QueryTypes.SELECT }
          );
          
          if (!checkColumn[0].exists) {
            console.log(`Column ${columnName} does not exist in ${tableName}, cannot create index`);
            return;
          }
          
          // Create the index
          await queryInterface.addIndex(tableName, [columnName]);
          console.log(`Created index on ${tableName}.${columnName}`);
        } catch (error) {
          console.error(`Error creating index on ${tableName}.${columnName}: ${error.message}`);
          // Don't throw - we want to continue with other indexes
        }
      };
      
      // Add each index individually with safety checks
      await safeCreateIndex('checkpoint_scans', 'patrol_id');
      await safeCreateIndex('checkpoint_scans', 'checkpoint_id');
      await safeCreateIndex('checkpoint_scans', 'guard_id');
      await safeCreateIndex('checkpoint_scans', 'property_id');
      await safeCreateIndex('checkpoint_scans', 'scan_time');
      await safeCreateIndex('checkpoint_scans', 'status');
      await safeCreateIndex('checkpoint_scans', 'issue_reported');
      
    } catch (error) {
      // If the error is about the table already existing, just continue
      if (error.message.includes('already exists')) {
        console.log('checkpoint_scans table already exists');
        
        // Still try to create any missing indexes
        try {
          await queryInterface.addIndex('checkpoint_scans', ['patrol_id']);
          console.log('Added patrol_id index');
        } catch (err) {
          console.log('patrol_id index already exists or could not be created');
        }
        
        try {
          await queryInterface.addIndex('checkpoint_scans', ['checkpoint_id']);
          console.log('Added checkpoint_id index');
        } catch (err) {
          console.log('checkpoint_id index already exists or could not be created');
        }
        
        try {
          await queryInterface.addIndex('checkpoint_scans', ['guard_id']);
          console.log('Added guard_id index');
        } catch (err) {
          console.log('guard_id index already exists or could not be created');
        }
        
        try {
          await queryInterface.addIndex('checkpoint_scans', ['property_id']);
          console.log('Added property_id index');
        } catch (err) {
          console.log('property_id index already exists or could not be created');
        }
        
        try {
          await queryInterface.addIndex('checkpoint_scans', ['scan_time']);
          console.log('Added scan_time index');
        } catch (err) {
          console.log('scan_time index already exists or could not be created');
        }
        
        try {
          await queryInterface.addIndex('checkpoint_scans', ['status']);
          console.log('Added status index');
        } catch (err) {
          console.log('status index already exists or could not be created');
        }
        
        try {
          await queryInterface.addIndex('checkpoint_scans', ['issue_reported']);
          console.log('Added issue_reported index');
        } catch (err) {
          console.log('issue_reported index already exists or could not be created');
        }
      } else {
        // For any other error, throw it
        throw error;
      }
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('checkpoint_scans');
  }
};