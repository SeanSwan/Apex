'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    try {
      // First, check the data type of columns in referenced tables
      let userIdType = Sequelize.UUID;
      let propertyIdType = Sequelize.UUID;
      
      try {
        const usersColumns = await queryInterface.sequelize.query(
          `SELECT column_name, data_type 
           FROM information_schema.columns 
           WHERE table_name = 'users' AND column_name = 'id'`,
          { type: queryInterface.sequelize.QueryTypes.SELECT }
        );
        
        if (usersColumns.length > 0) {
          const dataType = usersColumns[0].data_type.toLowerCase();
          console.log(`Found users.id column with type: ${dataType}`);
          
          if (dataType.includes('int')) {
            userIdType = Sequelize.INTEGER;
            console.log('Using INTEGER type for user_id');
          }
        }
        
        const propertiesColumns = await queryInterface.sequelize.query(
          `SELECT column_name, data_type 
           FROM information_schema.columns 
           WHERE table_name = 'properties' AND column_name = 'id'`,
          { type: queryInterface.sequelize.QueryTypes.SELECT }
        );
        
        if (propertiesColumns.length > 0) {
          const dataType = propertiesColumns[0].data_type.toLowerCase();
          console.log(`Found properties.id column with type: ${dataType}`);
          
          if (dataType.includes('int')) {
            propertyIdType = Sequelize.INTEGER;
            console.log('Using INTEGER type for property_id');
          }
        }
      } catch (error) {
        console.warn('Error checking column types, using default UUID types:', error.message);
      }
      
      // Check if the table already exists
      const tableExists = await queryInterface.sequelize.query(
        "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'property_assignments')",
        { type: queryInterface.sequelize.QueryTypes.SELECT }
      );
      
      if (!tableExists[0].exists) {
        // Create the table with the appropriate types
        await queryInterface.createTable('property_assignments', {
          id: {
            type: Sequelize.UUID,
            defaultValue: Sequelize.UUIDV4,
            primaryKey: true
          },
          property_id: {
            type: propertyIdType,
            allowNull: false,
            references: {
              model: 'properties',
              key: 'id'
            },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE'
          },
          user_id: {
            type: userIdType,
            allowNull: false,
            references: {
              model: 'users',
              key: 'id'
            },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE'
          },
          // Assignment details
          start_date: {
            type: Sequelize.DATEONLY,
            allowNull: false,
            defaultValue: Sequelize.NOW
          },
          end_date: {
            type: Sequelize.DATEONLY
          },
          assignment_type: {
            type: Sequelize.STRING,
            allowNull: false,
            defaultValue: 'regular'
          },
          role: {
            type: Sequelize.STRING,
            allowNull: false,
            defaultValue: 'guard'
          },
          // Assignment status
          status: {
            type: Sequelize.STRING,
            allowNull: false,
            defaultValue: 'active'
          },
          // Guard relationship to property
          is_primary: {
            type: Sequelize.BOOLEAN,
            defaultValue: false
          },
          is_backup: {
            type: Sequelize.BOOLEAN,
            defaultValue: false
          },
          is_special_assignment: {
            type: Sequelize.BOOLEAN,
            defaultValue: false
          },
          // Schedule details
          shift_type: {
            type: Sequelize.STRING
          },
          schedule_details: {
            type: Sequelize.JSONB,
            defaultValue: {}
          },
          hours_per_week: {
            type: Sequelize.FLOAT
          },
          // Assignment details
          assigned_by: {
            type: userIdType,
            references: {
              model: 'users',
              key: 'id'
            },
            onUpdate: 'CASCADE',
            onDelete: 'SET NULL'
          },
          assigned_at: {
            type: Sequelize.DATE,
            defaultValue: Sequelize.NOW
          },
          notes: {
            type: Sequelize.TEXT
          },
          // Post or zone assignments
          assigned_zones: {
            type: Sequelize.JSONB,
            defaultValue: []
          },
          assigned_posts: {
            type: Sequelize.JSONB,
            defaultValue: []
          },
          // Responsibilities
          duties: {
            type: Sequelize.JSONB,
            defaultValue: []
          },
          special_instructions: {
            type: Sequelize.TEXT
          },
          // Required skills and certifications
          required_skills: {
            type: Sequelize.JSONB,
            defaultValue: []
          },
          required_certifications: {
            type: Sequelize.JSONB,
            defaultValue: []
          },
          // Billing and payroll
          billing_code: {
            type: Sequelize.STRING
          },
          billing_rate: {
            type: Sequelize.DECIMAL(10, 2)
          },
          pay_rate: {
            type: Sequelize.DECIMAL(10, 2)
          },
          is_billable: {
            type: Sequelize.BOOLEAN,
            defaultValue: true
          },
          // Access control
          access_level: {
            type: Sequelize.STRING,
            defaultValue: 'standard'
          },
          access_credentials_issued: {
            type: Sequelize.BOOLEAN,
            defaultValue: false
          },
          access_card_number: {
            type: Sequelize.STRING
          },
          // Termination information
          termination_date: {
            type: Sequelize.DATEONLY
          },
          termination_reason: {
            type: Sequelize.TEXT
          },
          terminated_by: {
            type: userIdType,
            references: {
              model: 'users',
              key: 'id'
            },
            onUpdate: 'CASCADE',
            onDelete: 'SET NULL'
          },
          // Performance tracking
          performance_rating: {
            type: Sequelize.INTEGER
          },
          performance_notes: {
            type: Sequelize.TEXT
          },
          // Training and orientation
          orientation_completed: {
            type: Sequelize.BOOLEAN,
            defaultValue: false
          },
          orientation_date: {
            type: Sequelize.DATEONLY
          },
          training_completed: {
            type: Sequelize.BOOLEAN,
            defaultValue: false
          },
          training_date: {
            type: Sequelize.DATEONLY
          },
          // Client approval
          client_approved: {
            type: Sequelize.BOOLEAN,
            defaultValue: true
          },
          client_approved_by: {
            type: Sequelize.STRING
          },
          client_approved_date: {
            type: Sequelize.DATEONLY
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
        
        console.log('Created property_assignments table');
      } else {
        console.log('Property_assignments table already exists, skipping creation');
      }
      
      // Function to safely create an index
      const safeCreateIndex = async (tableName, columnNames, options = {}) => {
        try {
          // Generate index name
          const indexName = options.name || 
                          `${tableName}_${Array.isArray(columnNames) ? columnNames.join('_') : columnNames}`;
          
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
          
          // Create index using raw SQL
          const uniqueClause = options.unique ? 'UNIQUE' : '';
          const columnsList = columnsToCheck.map(col => `"${col}"`).join(', ');
          
          console.log(`Creating index ${indexName} on columns ${columnsList}`);
          await queryInterface.sequelize.query(
            `CREATE ${uniqueClause} INDEX IF NOT EXISTS "${indexName}" ON "${tableName}" (${columnsList})`
          );
          console.log(`Successfully created index ${indexName}`);
        } catch (error) {
          console.error(`Error creating index: ${error.message}`);
        }
      };
      
      // Add a delay to ensure table creation is complete
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Create all indexes safely
      await safeCreateIndex('property_assignments', 'property_id');
      await safeCreateIndex('property_assignments', 'user_id');
      await safeCreateIndex('property_assignments', 'status');
      await safeCreateIndex('property_assignments', 'is_primary');
      await safeCreateIndex('property_assignments', 'start_date');
      await safeCreateIndex('property_assignments', 'end_date');
      
      // Add compound indexes
      await safeCreateIndex('property_assignments', ['property_id', 'user_id']);
      await safeCreateIndex('property_assignments', ['property_id', 'status']);
      
      console.log('All indexes for property_assignments created or verified');
      
    } catch (error) {
      console.error('Error in property_assignments migration:', error);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    try {
      await queryInterface.dropTable('property_assignments');
      console.log('Dropped property_assignments table');
    } catch (error) {
      console.error(`Error dropping property_assignments table: ${error.message}`);
    }
  }
};