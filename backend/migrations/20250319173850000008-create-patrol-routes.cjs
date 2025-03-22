'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    try {
      // First, check the data type of the id column in patrol_routes table
      const patrolRoutesColumns = await queryInterface.sequelize.query(
        `SELECT column_name, data_type 
         FROM information_schema.columns 
         WHERE table_name = 'patrol_routes' AND column_name = 'id'`,
        { type: queryInterface.sequelize.QueryTypes.SELECT }
      );
      
      // Determine the correct type to use for patrol_route_id
      let patrolRouteIdType;
      if (patrolRoutesColumns.length > 0) {
        const dataType = patrolRoutesColumns[0].data_type.toLowerCase();
        console.log(`Found patrol_routes.id column with type: ${dataType}`);
        
        if (dataType.includes('int')) {
          patrolRouteIdType = Sequelize.INTEGER;
          console.log('Using INTEGER type for patrol_route_id');
        } else if (dataType.includes('uuid')) {
          patrolRouteIdType = Sequelize.UUID;
          console.log('Using UUID type for patrol_route_id');
        } else {
          // Default to UUID if we can't determine
          patrolRouteIdType = Sequelize.UUID;
          console.log(`Unrecognized data type: ${dataType}, defaulting to UUID`);
        }
      } else {
        // If we can't find the patrol_routes table, default to UUID
        patrolRouteIdType = Sequelize.UUID;
        console.log('Could not find patrol_routes table, defaulting to UUID type');
      }
      
      // Similar check for users table
      const usersColumns = await queryInterface.sequelize.query(
        `SELECT column_name, data_type 
         FROM information_schema.columns 
         WHERE table_name = 'users' AND column_name = 'id'`,
        { type: queryInterface.sequelize.QueryTypes.SELECT }
      );
      
      let guardIdType;
      if (usersColumns.length > 0) {
        const dataType = usersColumns[0].data_type.toLowerCase();
        console.log(`Found users.id column with type: ${dataType}`);
        
        if (dataType.includes('int')) {
          guardIdType = Sequelize.INTEGER;
          console.log('Using INTEGER type for guard_id');
        } else if (dataType.includes('uuid')) {
          guardIdType = Sequelize.UUID;
          console.log('Using UUID type for guard_id');
        } else {
          // Default to UUID if we can't determine
          guardIdType = Sequelize.UUID;
          console.log(`Unrecognized data type: ${dataType}, defaulting to UUID`);
        }
      } else {
        // If we can't find the users table, default to UUID
        guardIdType = Sequelize.UUID;
        console.log('Could not find users table, defaulting to UUID type');
      }
      
      // Create the table with the correct data types
      await queryInterface.createTable('patrol_route_assignments', {
        id: {
          type: Sequelize.UUID,
          defaultValue: Sequelize.UUIDV4,
          primaryKey: true
        },
        patrol_route_id: {
          type: patrolRouteIdType,
          allowNull: false,
          references: {
            model: 'patrol_routes',
            key: 'id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE'
        },
        guard_id: {
          type: guardIdType,
          allowNull: false,
          references: {
            model: 'users',
            key: 'id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE'
        },
        // Assignment details
        assignment_type: {
          type: Sequelize.STRING,
          allowNull: false,
          defaultValue: 'regular'
        },
        is_primary: {
          type: Sequelize.BOOLEAN,
          defaultValue: false
        },
        status: {
          type: Sequelize.STRING,
          allowNull: false,
          defaultValue: 'active'
        },
        // Schedule information
        recurring: {
          type: Sequelize.BOOLEAN,
          defaultValue: true
        },
        schedule: {
          type: Sequelize.JSONB,
          defaultValue: null
        },
        start_date: {
          type: Sequelize.DATE
        },
        end_date: {
          type: Sequelize.DATE
        },
        // Assignment management
        assigned_by: {
          type: guardIdType, // Use the same type as guard_id
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
        override_route_requirements: {
          type: Sequelize.BOOLEAN,
          defaultValue: false
        },
        // Performance metrics
        completion_rate: {
          type: Sequelize.FLOAT,
          defaultValue: 100
        },
        average_duration_minutes: {
          type: Sequelize.INTEGER
        },
        performance_rating: {
          type: Sequelize.INTEGER
        },
        last_patrol_date: {
          type: Sequelize.DATE
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
      
      console.log('Created patrol_route_assignments table');
      
      // Add a delay before creating indexes
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Helper function to safely create indexes
      const safeCreateIndex = async (tableName, columnNames, options = {}) => {
        try {
          // First check if all columns exist
          const columnsToCheck = Array.isArray(columnNames) ? columnNames : [columnNames];
          let allColumnsExist = true;
          
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
              allColumnsExist = false;
              break;
            }
          }
          
          if (!allColumnsExist) return;
          
          // Generate index name
          const indexName = options.name || 
                          `${tableName}_${Array.isArray(columnNames) ? columnNames.join('_') : columnNames}${options.unique ? '_unique' : ''}`;
          
          // Check if index already exists
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
          
          // Create index with raw SQL
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
      await safeCreateIndex('patrol_route_assignments', ['patrol_route_id', 'guard_id'], { unique: true });
      await safeCreateIndex('patrol_route_assignments', 'guard_id');
      await safeCreateIndex('patrol_route_assignments', 'status');
      await safeCreateIndex('patrol_route_assignments', 'start_date');
      await safeCreateIndex('patrol_route_assignments', 'end_date');
      
      console.log('All indexes created for patrol_route_assignments');
      
    } catch (error) {
      console.error('Error in migration:', error);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    try {
      await queryInterface.dropTable('patrol_route_assignments');
      console.log('Dropped patrol_route_assignments table');
    } catch (error) {
      console.error(`Error dropping patrol_route_assignments table: ${error.message}`);
    }
  }
};