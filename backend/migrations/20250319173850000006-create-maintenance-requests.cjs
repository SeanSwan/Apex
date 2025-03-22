'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    try {
      // First create the table
      await queryInterface.createTable('maintenance_requests', {
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
        reported_by: {
          type: Sequelize.UUID,
          allowNull: false,
          references: {
            model: 'users',
            key: 'id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'RESTRICT'
        },
        // Basic request information
        request_number: {
          type: Sequelize.STRING,
          unique: true,
          allowNull: false
        },
        title: {
          type: Sequelize.STRING,
          allowNull: false
        },
        description: {
          type: Sequelize.TEXT,
          allowNull: false
        },
        // Request details
        request_type: {
          type: Sequelize.STRING,
          allowNull: false
        },
        priority: {
          type: Sequelize.STRING,
          allowNull: false,
          defaultValue: 'medium'
        },
        // Location details
        location: {
          type: Sequelize.STRING,
          allowNull: false
        },
        building: {
          type: Sequelize.STRING
        },
        floor: {
          type: Sequelize.STRING
        },
        room: {
          type: Sequelize.STRING
        },
        location_details: {
          type: Sequelize.TEXT
        },
        // Associated items
        zone_id: {
          type: Sequelize.UUID,
          references: {
            model: 'security_zones',
            key: 'id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL'
        },
        access_point_id: {
          type: Sequelize.UUID,
          references: {
            model: 'access_points',
            key: 'id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL'
        },
        camera_id: {
          type: Sequelize.UUID,
          references: {
            model: 'cameras',
            key: 'id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL'
        },
        checkpoint_id: {
          type: Sequelize.UUID,
          references: {
            model: 'checkpoints',
            key: 'id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL'
        },
        equipment_id: {
          type: Sequelize.UUID,
          references: {
            model: 'equipment',
            key: 'id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL'
        },
        // Status tracking
        status: {
          type: Sequelize.STRING,
          allowNull: false,
          defaultValue: 'open'
        },
        reported_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.NOW
        },
        assigned_at: {
          type: Sequelize.DATE
        },
        started_at: {
          type: Sequelize.DATE
        },
        completed_at: {
          type: Sequelize.DATE
        },
        closed_at: {
          type: Sequelize.DATE
        },
        due_date: {
          type: Sequelize.DATE
        },
        estimated_completion_date: {
          type: Sequelize.DATE
        },
        // Assignment
        assigned_to: {
          type: Sequelize.UUID,
          references: {
            model: 'users',
            key: 'id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL'
        },
        assigned_by: {
          type: Sequelize.UUID,
          references: {
            model: 'users',
            key: 'id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL'
        },
        assignment_notes: {
          type: Sequelize.TEXT
        },
        // External service provider
        requires_external_service: {
          type: Sequelize.BOOLEAN,
          defaultValue: false
        },
        service_provider: {
          type: Sequelize.STRING
        },
        service_provider_contact: {
          type: Sequelize.STRING
        },
        service_provider_reference: {
          type: Sequelize.STRING
        },
        scheduled_service_date: {
          type: Sequelize.DATE
        },
        // Documentation
        photos: {
          type: Sequelize.JSONB,
          defaultValue: []
        },
        videos: {
          type: Sequelize.JSONB,
          defaultValue: []
        },
        documents: {
          type: Sequelize.JSONB,
          defaultValue: []
        },
        before_photos: {
          type: Sequelize.JSONB,
          defaultValue: []
        },
        after_photos: {
          type: Sequelize.JSONB,
          defaultValue: []
        },
        // Resolution
        resolution: {
          type: Sequelize.TEXT
        },
        resolution_code: {
          type: Sequelize.STRING
        },
        resolution_notes: {
          type: Sequelize.TEXT
        },
        resolved_by: {
          type: Sequelize.UUID,
          references: {
            model: 'users',
            key: 'id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL'
        },
        verification_required: {
          type: Sequelize.BOOLEAN,
          defaultValue: false
        },
        verified: {
          type: Sequelize.BOOLEAN,
          defaultValue: false
        },
        verified_by: {
          type: Sequelize.UUID,
          references: {
            model: 'users',
            key: 'id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL'
        },
        verified_at: {
          type: Sequelize.DATE
        },
        // Cost and billing
        estimated_cost: {
          type: Sequelize.DECIMAL(10, 2)
        },
        actual_cost: {
          type: Sequelize.DECIMAL(10, 2)
        },
        billable: {
          type: Sequelize.BOOLEAN,
          defaultValue: false
        },
        invoice_number: {
          type: Sequelize.STRING
        },
        invoice_date: {
          type: Sequelize.DATE
        },
        // Parts and materials
        parts_required: {
          type: Sequelize.JSONB,
          defaultValue: []
        },
        parts_ordered: {
          type: Sequelize.BOOLEAN,
          defaultValue: false
        },
        parts_received: {
          type: Sequelize.BOOLEAN,
          defaultValue: false
        },
        // Client communication
        client_visible: {
          type: Sequelize.BOOLEAN,
          defaultValue: true
        },
        client_notified: {
          type: Sequelize.BOOLEAN,
          defaultValue: false
        },
        client_notification_sent_at: {
          type: Sequelize.DATE
        },
        client_approval_required: {
          type: Sequelize.BOOLEAN,
          defaultValue: false
        },
        client_approved: {
          type: Sequelize.BOOLEAN,
          defaultValue: false
        },
        client_approved_at: {
          type: Sequelize.DATE
        },
        client_notes: {
          type: Sequelize.TEXT
        },
        // Tracking
        related_incident_id: {
          type: Sequelize.UUID,
          references: {
            model: 'incidents',
            key: 'id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL'
        },
        follow_up_required: {
          type: Sequelize.BOOLEAN,
          defaultValue: false
        },
        follow_up_date: {
          type: Sequelize.DATE
        },
        follow_up_notes: {
          type: Sequelize.TEXT
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
      
      console.log('Created maintenance_requests table');
      
      // Add a delay to ensure the table is fully created
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Helper function to safely create indexes
      const safeCreateIndex = async (tableName, columnNames, options = {}) => {
        try {
          // Format column names for display
          const columnsDisplay = Array.isArray(columnNames) ? columnNames.join(', ') : columnNames;
          
          // Generate consistent index name
          const indexName = options.name || 
                          `${tableName}_${Array.isArray(columnNames) ? columnNames.join('_') : columnNames}${options.unique ? '_unique' : ''}`;
          
          // First check if the index already exists
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
          );
          
          if (indexExists[0].exists) {
            console.log(`Index ${indexName} already exists, skipping`);
            return;
          }
          
          // Check if all columns exist
          const columnsToCheck = Array.isArray(columnNames) ? columnNames : [columnNames];
          for (const column of columnsToCheck) {
            const columnExists = await queryInterface.sequelize.query(
              `SELECT EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_schema = 'public'
                AND table_name = $1
                AND column_name = $2
              )`,
              { 
                type: queryInterface.sequelize.QueryTypes.SELECT,
                replacements: [tableName, column]
              }
            );
            
            if (!columnExists[0].exists) {
              console.log(`Column ${column} does not exist in table ${tableName}, cannot create index`);
              return;
            }
          }
          
          // Create the index directly using SQL
          const uniqueClause = options.unique ? 'UNIQUE' : '';
          const columnsList = columnsToCheck.map(col => `"${col}"`).join(', ');
          
          await queryInterface.sequelize.query(
            `CREATE ${uniqueClause} INDEX IF NOT EXISTS "${indexName}" ON "${tableName}" (${columnsList})`
          );
          console.log(`Created ${options.unique ? 'unique ' : ''}index ${indexName}`);
        } catch (error) {
          console.error(`Error creating index: ${error.message}`);
        }
      };
      
      // Add indexes with the safe approach
      await safeCreateIndex('maintenance_requests', 'request_number', { unique: true });
      await safeCreateIndex('maintenance_requests', 'property_id');
      await safeCreateIndex('maintenance_requests', 'reported_by');
      await safeCreateIndex('maintenance_requests', 'assigned_to');
      await safeCreateIndex('maintenance_requests', 'status');
      await safeCreateIndex('maintenance_requests', 'priority');
      await safeCreateIndex('maintenance_requests', 'due_date');
      await safeCreateIndex('maintenance_requests', 'reported_at');
      
    } catch (error) {
      // If table already exists, just try to create any missing indexes
      if (error.message.includes('already exists')) {
        console.log('Maintenance requests table already exists');
        
        // Try to create each index directly - with error handling for each
        const indexesToCreate = [
          { name: 'maintenance_requests_request_number', columns: ['request_number'], unique: true },
          { name: 'maintenance_requests_property_id', columns: ['property_id'] },
          { name: 'maintenance_requests_reported_by', columns: ['reported_by'] },
          { name: 'maintenance_requests_assigned_to', columns: ['assigned_to'] },
          { name: 'maintenance_requests_status', columns: ['status'] },
          { name: 'maintenance_requests_priority', columns: ['priority'] },
          { name: 'maintenance_requests_due_date', columns: ['due_date'] },
          { name: 'maintenance_requests_reported_at', columns: ['reported_at'] }
        ];
        
        for (const index of indexesToCreate) {
          try {
            // Check if columns exist first
            const columnsExist = await Promise.all(
              index.columns.map(async column => {
                const result = await queryInterface.sequelize.query(
                  `SELECT EXISTS (
                    SELECT 1 FROM information_schema.columns
                    WHERE table_schema = 'public'
                    AND table_name = 'maintenance_requests'
                    AND column_name = $1
                  )`,
                  { 
                    type: queryInterface.sequelize.QueryTypes.SELECT,
                    replacements: [column]
                  }
                );
                return { column, exists: result[0].exists };
              })
            );
            
            // Check if any columns don't exist
            const missingColumns = columnsExist.filter(c => !c.exists);
            if (missingColumns.length > 0) {
              console.log(`Cannot create index ${index.name}: columns ${missingColumns.map(c => c.column).join(', ')} don't exist`);
              continue;
            }
            
            // Create the index with raw SQL
            const uniqueClause = index.unique ? 'UNIQUE' : '';
            const columnsList = index.columns.map(col => `"${col}"`).join(', ');
            
            await queryInterface.sequelize.query(
              `CREATE ${uniqueClause} INDEX IF NOT EXISTS "${index.name}" ON "maintenance_requests" (${columnsList})`
            );
            console.log(`Created index ${index.name}`);
          } catch (indexError) {
            console.log(`Error creating index ${index.name}: ${indexError.message}`);
          }
        }
      } else {
        // For any other error, rethrow it
        throw error;
      }
    }
  },

  async down(queryInterface, Sequelize) {
    try {
      await queryInterface.dropTable('maintenance_requests');
      console.log('Dropped maintenance_requests table');
    } catch (error) {
      console.error(`Error dropping maintenance_requests table: ${error.message}`);
    }
  }
};