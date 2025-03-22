'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    try {
      // Step 1: Create the table first
      await queryInterface.createTable('keys', {
        id: {
          type: Sequelize.UUID,
          defaultValue: Sequelize.UUIDV4,
          primaryKey: true
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
        // Key details
        key_code: {
          type: Sequelize.STRING,
          allowNull: false,
          unique: true
        },
        name: {
          type: Sequelize.STRING,
          allowNull: false
        },
        description: {
          type: Sequelize.TEXT
        },
        key_type: {
          type: Sequelize.STRING,
          allowNull: false,
          defaultValue: 'standard'
        },
        // Physical characteristics
        physical_key: {
          type: Sequelize.BOOLEAN,
          defaultValue: true
        },
        color: {
          type: Sequelize.STRING
        },
        markings: {
          type: Sequelize.STRING
        },
        key_number: {
          type: Sequelize.STRING
        },
        manufacturer: {
          type: Sequelize.STRING
        },
        model: {
          type: Sequelize.STRING
        },
        // Electronic credentials
        is_electronic: {
          type: Sequelize.BOOLEAN,
          defaultValue: false
        },
        credential_id: {
          type: Sequelize.STRING
        },
        card_number: {
          type: Sequelize.STRING
        },
        access_level: {
          type: Sequelize.STRING,
          defaultValue: 'standard'
        },
        // Access details
        access_zones: {
          type: Sequelize.JSONB,
          defaultValue: []
        },
        access_points: {
          type: Sequelize.JSONB,
          defaultValue: []
        },
        access_schedule: {
          type: Sequelize.JSONB,
          defaultValue: null
        },
        restricted_areas: {
          type: Sequelize.JSONB,
          defaultValue: []
        },
        // Status
        status: {
          type: Sequelize.STRING,
          allowNull: false,
          defaultValue: 'available'
        },
        active: {
          type: Sequelize.BOOLEAN,
          defaultValue: true
        },
        // Issuance tracking
        issued_to: {
          type: Sequelize.UUID,
          references: {
            model: 'users',
            key: 'id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL'
        },
        issued_by: {
          type: Sequelize.UUID,
          references: {
            model: 'users',
            key: 'id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL'
        },
        issued_date: {
          type: Sequelize.DATE
        },
        expected_return_date: {
          type: Sequelize.DATE
        },
        return_date: {
          type: Sequelize.DATE
        },
        returned_by: {
          type: Sequelize.UUID,
          references: {
            model: 'users',
            key: 'id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL'
        },
        received_by: {
          type: Sequelize.UUID,
          references: {
            model: 'users',
            key: 'id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL'
        },
        return_condition: {
          type: Sequelize.STRING
        },
        // Temporary keys and expiration
        temporary: {
          type: Sequelize.BOOLEAN,
          defaultValue: false
        },
        creation_date: {
          type: Sequelize.DATE,
          defaultValue: Sequelize.NOW
        },
        expiry_date: {
          type: Sequelize.DATE
        },
        deactivated_date: {
          type: Sequelize.DATE
        },
        deactivated_by: {
          type: Sequelize.UUID,
          references: {
            model: 'users',
            key: 'id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL'
        },
        deactivation_reason: {
          type: Sequelize.TEXT
        },
        // Security measures
        requires_signature: {
          type: Sequelize.BOOLEAN,
          defaultValue: true
        },
        signature_image: {
          type: Sequelize.STRING
        },
        requires_deposit: {
          type: Sequelize.BOOLEAN,
          defaultValue: false
        },
        deposit_amount: {
          type: Sequelize.DECIMAL(10, 2)
        },
        deposit_paid: {
          type: Sequelize.BOOLEAN,
          defaultValue: false
        },
        deposit_returned: {
          type: Sequelize.BOOLEAN,
          defaultValue: false
        },
        // Lost/stolen tracking
        reported_lost: {
          type: Sequelize.BOOLEAN,
          defaultValue: false
        },
        reported_lost_date: {
          type: Sequelize.DATE
        },
        reported_lost_by: {
          type: Sequelize.UUID,
          references: {
            model: 'users',
            key: 'id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL'
        },
        lost_report_details: {
          type: Sequelize.TEXT
        },
        // Key replacement
        replacement_for: {
          type: Sequelize.UUID,
          references: {
            model: 'keys',
            key: 'id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL'
        },
        replaced_by: {
          type: Sequelize.UUID,
          references: {
            model: 'keys',
            key: 'id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL'
        },
        replacement_reason: {
          type: Sequelize.TEXT
        },
        // Duplication tracking
        do_not_duplicate: {
          type: Sequelize.BOOLEAN,
          defaultValue: true
        },
        copies_made: {
          type: Sequelize.INTEGER,
          defaultValue: 0
        },
        // Audit and tracking
        last_audit_date: {
          type: Sequelize.DATE
        },
        last_audit_status: {
          type: Sequelize.STRING
        },
        last_audit_by: {
          type: Sequelize.UUID,
          references: {
            model: 'users',
            key: 'id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL'
        },
        // Usage tracking
        last_used: {
          type: Sequelize.DATE
        },
        usage_count: {
          type: Sequelize.INTEGER,
          defaultValue: 0
        },
        // Notes and documentation
        notes: {
          type: Sequelize.TEXT
        },
        photos: {
          type: Sequelize.JSONB,
          defaultValue: []
        },
        documents: {
          type: Sequelize.JSONB,
          defaultValue: []
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
      
      console.log('Created keys table');
      
      // Step 2: Wait for the table to be fully created before adding indexes
      // This brief delay can help ensure the table is fully created in the database
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Step 3: Helper function to safely create an index
      const safeCreateIndex = async (tableName, columnNames, options = {}) => {
        try {
          // Format column names for logging
          const columnNamesStr = Array.isArray(columnNames) ? columnNames.join(', ') : columnNames;
          
          // Build index name
          const indexName = options.name || 
                          `${tableName}_${Array.isArray(columnNames) ? columnNames.join('_') : columnNames}${options.unique ? '_unique' : ''}`;
          
          // First check if the index already exists
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
          
          // Check if columns exist before creating the index
          const columnsToCheck = Array.isArray(columnNames) ? columnNames : [columnNames];
          
          for (const column of columnsToCheck) {
            const checkColumn = await queryInterface.sequelize.query(
              `SELECT EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_name = '${tableName}'
                AND column_name = '${column}'
              )`,
              { type: queryInterface.sequelize.QueryTypes.SELECT }
            );
            
            if (!checkColumn[0].exists) {
              console.log(`Column ${column} does not exist in ${tableName}, cannot create index`);
              return;
            }
          }
          
          // Create the index using raw SQL for more control
          const createIndexSQL = options.unique
            ? `CREATE UNIQUE INDEX IF NOT EXISTS "${indexName}" ON "${tableName}" (${columnsToCheck.map(c => `"${c}"`).join(', ')})`
            : `CREATE INDEX IF NOT EXISTS "${indexName}" ON "${tableName}" (${columnsToCheck.map(c => `"${c}"`).join(', ')})`;
          
          await queryInterface.sequelize.query(createIndexSQL);
          console.log(`Created ${options.unique ? 'unique ' : ''}index on ${tableName}.${columnNamesStr}`);
        } catch (error) {
          console.error(`Error creating index on ${tableName}: ${error.message}`);
          // Don't throw - we want to continue with other indexes
        }
      };
      
      // Step 4: Add each index individually with safety checks
      await safeCreateIndex('keys', 'key_code', { unique: true });
      await safeCreateIndex('keys', 'property_id');
      await safeCreateIndex('keys', 'status');
      await safeCreateIndex('keys', 'key_type');
      await safeCreateIndex('keys', 'issued_to');
      await safeCreateIndex('keys', 'issued_date');
      await safeCreateIndex('keys', 'expiry_date');
      
    } catch (error) {
      // Handle case where table already exists
      if (error.message.includes('already exists')) {
        console.log('Keys table already exists, skipping table creation');
        
        // Try adding indexes anyway, one by one with error handling
        try {
          await queryInterface.sequelize.query(
            `CREATE UNIQUE INDEX IF NOT EXISTS "keys_key_code" ON "keys" ("key_code")`
          );
          console.log('Added unique index on key_code');
        } catch (err) {
          console.log('key_code index already exists or could not be created:', err.message);
        }
        
        try {
          await queryInterface.sequelize.query(
            `CREATE INDEX IF NOT EXISTS "keys_property_id" ON "keys" ("property_id")`
          );
          console.log('Added index on property_id');
        } catch (err) {
          console.log('property_id index already exists or could not be created');
        }
        
        try {
          await queryInterface.sequelize.query(
            `CREATE INDEX IF NOT EXISTS "keys_status" ON "keys" ("status")`
          );
          console.log('Added index on status');
        } catch (err) {
          console.log('status index already exists or could not be created');
        }
        
        try {
          await queryInterface.sequelize.query(
            `CREATE INDEX IF NOT EXISTS "keys_key_type" ON "keys" ("key_type")`
          );
          console.log('Added index on key_type');
        } catch (err) {
          console.log('key_type index already exists or could not be created');
        }
        
        try {
          await queryInterface.sequelize.query(
            `CREATE INDEX IF NOT EXISTS "keys_issued_to" ON "keys" ("issued_to")`
          );
          console.log('Added index on issued_to');
        } catch (err) {
          console.log('issued_to index already exists or could not be created');
        }
        
        try {
          await queryInterface.sequelize.query(
            `CREATE INDEX IF NOT EXISTS "keys_issued_date" ON "keys" ("issued_date")`
          );
          console.log('Added index on issued_date');
        } catch (err) {
          console.log('issued_date index already exists or could not be created');
        }
        
        try {
          await queryInterface.sequelize.query(
            `CREATE INDEX IF NOT EXISTS "keys_expiry_date" ON "keys" ("expiry_date")`
          );
          console.log('Added index on expiry_date');
        } catch (err) {
          console.log('expiry_date index already exists or could not be created');
        }
      } else {
        // For any other error, rethrow it
        throw error;
      }
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('keys');
  }
};