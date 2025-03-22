'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    try {
      // First, determine the correct column types for foreign keys by checking referenced tables
      console.log('Checking data types of referenced columns...');
      
      // Check properties.id type
      let propertyIdType = Sequelize.UUID;
      try {
        const propertiesColumns = await queryInterface.sequelize.query(
          `SELECT column_name, data_type, udt_name 
           FROM information_schema.columns 
           WHERE table_name = 'properties' AND column_name = 'id'`,
          { type: queryInterface.sequelize.QueryTypes.SELECT }
        );
        
        if (propertiesColumns.length > 0) {
          const dataType = propertiesColumns[0].data_type.toLowerCase();
          const udtName = propertiesColumns[0].udt_name;
          console.log(`Found properties.id column with type: ${dataType} (${udtName})`);
          
          if (dataType.includes('int')) {
            propertyIdType = Sequelize.INTEGER;
            console.log('Using INTEGER type for property_id');
          } else if (udtName === 'uuid' || dataType.includes('uuid')) {
            propertyIdType = Sequelize.UUID;
            console.log('Using UUID type for property_id');
          }
        } else {
          console.log('Could not find properties.id column, defaulting to UUID');
        }
      } catch (error) {
        console.error('Error checking properties.id type:', error.message);
      }
      
      // Check users.id type
      let userIdType = Sequelize.UUID;
      try {
        const usersColumns = await queryInterface.sequelize.query(
          `SELECT column_name, data_type, udt_name 
           FROM information_schema.columns 
           WHERE table_name = 'users' AND column_name = 'id'`,
          { type: queryInterface.sequelize.QueryTypes.SELECT }
        );
        
        if (usersColumns.length > 0) {
          const dataType = usersColumns[0].data_type.toLowerCase();
          const udtName = usersColumns[0].udt_name;
          console.log(`Found users.id column with type: ${dataType} (${udtName})`);
          
          if (dataType.includes('int')) {
            userIdType = Sequelize.INTEGER;
            console.log('Using INTEGER type for user references');
          } else if (udtName === 'uuid' || dataType.includes('uuid')) {
            userIdType = Sequelize.UUID;
            console.log('Using UUID type for user references');
          }
        } else {
          console.log('Could not find users.id column, defaulting to UUID');
        }
      } catch (error) {
        console.error('Error checking users.id type:', error.message);
      }
      
      // Check incidents.id type
      let incidentIdType = Sequelize.UUID;
      try {
        const incidentsColumns = await queryInterface.sequelize.query(
          `SELECT column_name, data_type, udt_name 
           FROM information_schema.columns 
           WHERE table_name = 'incidents' AND column_name = 'id'`,
          { type: queryInterface.sequelize.QueryTypes.SELECT }
        );
        
        if (incidentsColumns.length > 0) {
          const dataType = incidentsColumns[0].data_type.toLowerCase();
          const udtName = incidentsColumns[0].udt_name;
          console.log(`Found incidents.id column with type: ${dataType} (${udtName})`);
          
          if (dataType.includes('int')) {
            incidentIdType = Sequelize.INTEGER;
            console.log('Using INTEGER type for incident_id');
          } else if (udtName === 'uuid' || dataType.includes('uuid')) {
            incidentIdType = Sequelize.UUID;
            console.log('Using UUID type for incident_id');
          }
        } else {
          console.log('Could not find incidents.id column, defaulting to UUID');
        }
      } catch (error) {
        console.error('Error checking incidents.id type:', error.message);
      }
      
      // Check patrols.id type
      let patrolIdType = Sequelize.UUID;
      try {
        const patrolsColumns = await queryInterface.sequelize.query(
          `SELECT column_name, data_type, udt_name 
           FROM information_schema.columns 
           WHERE table_name = 'patrols' AND column_name = 'id'`,
          { type: queryInterface.sequelize.QueryTypes.SELECT }
        );
        
        if (patrolsColumns.length > 0) {
          const dataType = patrolsColumns[0].data_type.toLowerCase();
          const udtName = patrolsColumns[0].udt_name;
          console.log(`Found patrols.id column with type: ${dataType} (${udtName})`);
          
          if (dataType.includes('int')) {
            patrolIdType = Sequelize.INTEGER;
            console.log('Using INTEGER type for patrol_id');
          } else if (udtName === 'uuid' || dataType.includes('uuid')) {
            patrolIdType = Sequelize.UUID;
            console.log('Using UUID type for patrol_id');
          }
        } else {
          console.log('Could not find patrols.id column, defaulting to UUID');
        }
      } catch (error) {
        console.error('Error checking patrols.id type:', error.message);
      }
      
      // Check if report_templates table exists
      let templateTableExists = false;
      try {
        const templateTable = await queryInterface.sequelize.query(
          "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'report_templates')",
          { type: queryInterface.sequelize.QueryTypes.SELECT }
        );
        templateTableExists = templateTable[0].exists;
        console.log(`Report templates table ${templateTableExists ? 'exists' : 'does not exist'}`);
      } catch (error) {
        console.error('Error checking report_templates table:', error.message);
      }
      
      // Now check if the reports table already exists
      const tableExists = await queryInterface.sequelize.query(
        "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'reports')",
        { type: queryInterface.sequelize.QueryTypes.SELECT }
      );
      
      if (!tableExists[0].exists) {
        // Create the table with the correct data types
        console.log('Creating reports table with compatible data types...');
        
        // Build table definition
        const tableDefinition = {
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
          created_by: {
            type: userIdType,
            allowNull: false,
            references: {
              model: 'users',
              key: 'id'
            },
            onUpdate: 'CASCADE',
            onDelete: 'RESTRICT'
          },
          // Basic report information
          report_number: {
            type: Sequelize.STRING,
            unique: true,
            allowNull: false
          },
          title: {
            type: Sequelize.STRING,
            allowNull: false
          },
          report_type: {
            type: Sequelize.STRING,
            allowNull: false
          },
          report_subtype: {
            type: Sequelize.STRING
          },
          date_range_start: {
            type: Sequelize.DATEONLY
          },
          date_range_end: {
            type: Sequelize.DATEONLY
          },
          // Content
          summary: {
            type: Sequelize.TEXT
          },
          content: {
            type: Sequelize.TEXT,
            allowNull: false
          },
          content_json: {
            type: Sequelize.JSONB
          },
          findings: {
            type: Sequelize.TEXT
          },
          recommendations: {
            type: Sequelize.TEXT
          },
          conclusion: {
            type: Sequelize.TEXT
          },
          // Incident details (if applicable)
          incident_id: {
            type: incidentIdType,
            references: {
              model: 'incidents',
              key: 'id'
            },
            onUpdate: 'CASCADE',
            onDelete: 'SET NULL'
          },
          incident_count: {
            type: Sequelize.INTEGER,
            defaultValue: 0
          },
          related_incidents: {
            type: Sequelize.JSONB,
            defaultValue: []
          },
          // Patrol details (if applicable)
          patrol_id: {
            type: patrolIdType,
            references: {
              model: 'patrols',
              key: 'id'
            },
            onUpdate: 'CASCADE',
            onDelete: 'SET NULL'
          },
          patrol_count: {
            type: Sequelize.INTEGER,
            defaultValue: 0
          },
          related_patrols: {
            type: Sequelize.JSONB,
            defaultValue: []
          },
          // Media and attachments
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
          attachments: {
            type: Sequelize.JSONB,
            defaultValue: []
          },
          // Statistics and metrics
          metrics: {
            type: Sequelize.JSONB,
            defaultValue: {}
          },
          charts: {
            type: Sequelize.JSONB,
            defaultValue: []
          },
          tables: {
            type: Sequelize.JSONB,
            defaultValue: []
          },
          // Template and formatting
          template_id: {
            type: Sequelize.UUID
          },
          custom_css: {
            type: Sequelize.TEXT
          },
          theme: {
            type: Sequelize.STRING,
            defaultValue: 'standard'
          },
          // Approval workflow
          approval_status: {
            type: Sequelize.STRING,
            allowNull: false,
            defaultValue: 'draft'
          },
          approval_notes: {
            type: Sequelize.TEXT
          },
          approved_by: {
            type: userIdType,
            references: {
              model: 'users',
              key: 'id'
            },
            onUpdate: 'CASCADE',
            onDelete: 'SET NULL'
          },
          approved_at: {
            type: Sequelize.DATE
          },
          // Publication status
          is_published: {
            type: Sequelize.BOOLEAN,
            defaultValue: false
          },
          published_at: {
            type: Sequelize.DATE
          },
          published_by: {
            type: userIdType,
            references: {
              model: 'users',
              key: 'id'
            },
            onUpdate: 'CASCADE',
            onDelete: 'SET NULL'
          },
          expiration_date: {
            type: Sequelize.DATEONLY
          },
          // Client visibility and delivery
          client_visible: {
            type: Sequelize.BOOLEAN,
            defaultValue: true
          },
          client_id: {
            type: userIdType,
            references: {
              model: 'users',
              key: 'id'
            },
            onUpdate: 'CASCADE',
            onDelete: 'SET NULL'
          },
          delivery_status: {
            type: Sequelize.STRING,
            defaultValue: 'pending'
          },
          delivery_method: {
            type: Sequelize.STRING
          },
          delivery_recipients: {
            type: Sequelize.JSONB,
            defaultValue: []
          },
          delivery_timestamp: {
            type: Sequelize.DATE
          },
          // Access tracking
          view_count: {
            type: Sequelize.INTEGER,
            defaultValue: 0
          },
          last_viewed_at: {
            type: Sequelize.DATE
          },
          download_count: {
            type: Sequelize.INTEGER,
            defaultValue: 0
          },
          // Version control
          version: {
            type: Sequelize.INTEGER,
            defaultValue: 1
          },
          previous_version_id: {
            type: Sequelize.UUID,
            references: {
              model: 'reports',
              key: 'id'
            },
            onUpdate: 'CASCADE',
            onDelete: 'SET NULL'
          },
          revision_notes: {
            type: Sequelize.TEXT
          },
          // System fields
          status: {
            type: Sequelize.STRING,
            allowNull: false,
            defaultValue: 'active'
          },
          created_at: {
            type: Sequelize.DATE,
            defaultValue: Sequelize.NOW
          },
          updated_at: {
            type: Sequelize.DATE,
            defaultValue: Sequelize.NOW
          }
        };
        
        // Add the template_id reference only if the report_templates table exists
        if (templateTableExists) {
          // Check template_id type
          let templateIdType = Sequelize.UUID;
          try {
            const templatesColumns = await queryInterface.sequelize.query(
              `SELECT column_name, data_type, udt_name 
               FROM information_schema.columns 
               WHERE table_name = 'report_templates' AND column_name = 'id'`,
              { type: queryInterface.sequelize.QueryTypes.SELECT }
            );
            
            if (templatesColumns.length > 0) {
              const dataType = templatesColumns[0].data_type.toLowerCase();
              const udtName = templatesColumns[0].udt_name;
              console.log(`Found report_templates.id column with type: ${dataType} (${udtName})`);
              
              if (dataType.includes('int')) {
                templateIdType = Sequelize.INTEGER;
                console.log('Using INTEGER type for template_id');
              } else if (udtName === 'uuid' || dataType.includes('uuid')) {
                templateIdType = Sequelize.UUID;
                console.log('Using UUID type for template_id');
              }
            }
          } catch (error) {
            console.error('Error checking template_id type:', error.message);
          }
          
          tableDefinition.template_id = {
            type: templateIdType,
            references: {
              model: 'report_templates',
              key: 'id'
            },
            onUpdate: 'CASCADE',
            onDelete: 'SET NULL'
          };
          console.log('Added template_id with foreign key constraint');
        } else {
          console.log('Adding template_id without foreign key constraint (will be added later)');
        }
        
        await queryInterface.createTable('reports', tableDefinition);
        console.log('Reports table created successfully');
      } else {
        console.log('Reports table already exists, skipping creation');
      }
      
      // Helper function to safely create indexes
      const safeCreateIndex = async (tableName, columnNames, options = {}) => {
        try {
          // Format column names for logging
          const columnsDisplay = Array.isArray(columnNames) ? columnNames.join(', ') : columnNames;
          
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
          
          // Create index with raw SQL
          const uniqueClause = options.unique ? 'UNIQUE' : '';
          const columnsList = columnsToCheck.map(col => `"${col}"`).join(', ');
          
          console.log(`Creating ${options.unique ? 'unique ' : ''}index on ${tableName}(${columnsDisplay})`);
          await queryInterface.sequelize.query(
            `CREATE ${uniqueClause} INDEX IF NOT EXISTS "${indexName}" ON "${tableName}" (${columnsList})`
          );
          console.log(`Successfully created index ${indexName}`);
        } catch (error) {
          console.error(`Error creating index: ${error.message}`);
        }
      };
      
      // Add a delay to ensure table creation is fully complete
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Create indexes with the safe approach
      console.log('Creating indexes for reports table...');
      await safeCreateIndex('reports', 'report_number', { unique: true });
      await safeCreateIndex('reports', 'property_id');
      await safeCreateIndex('reports', 'created_by');
      await safeCreateIndex('reports', 'report_type');
      await safeCreateIndex('reports', 'approval_status');
      await safeCreateIndex('reports', 'is_published');
      await safeCreateIndex('reports', 'client_id');
      await safeCreateIndex('reports', 'incident_id');
      await safeCreateIndex('reports', 'patrol_id');
      await safeCreateIndex('reports', ['date_range_start', 'date_range_end']);
      await safeCreateIndex('reports', 'status');
      
      // Add template_id index only if the column exists
      if (templateTableExists) {
        await safeCreateIndex('reports', 'template_id');
      }
      
      console.log('Reports migration completed successfully');
      
    } catch (error) {
      console.error('Error in reports migration:', error);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    try {
      await queryInterface.dropTable('reports');
      console.log('Dropped reports table');
    } catch (error) {
      console.error(`Error dropping reports table: ${error.message}`);
    }
  }
};