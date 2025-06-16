// File: defense/backend/migrations/20250310000002-create-properties.cjs
'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Check if properties table already exists
    const tables = await queryInterface.sequelize.query(
      "SELECT tablename FROM pg_catalog.pg_tables WHERE schemaname = 'public' AND tablename = 'properties'",
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    // Only create table if it doesn't exist
    if (tables.length === 0) {
      await queryInterface.createTable('properties', {
        id: {
          type: Sequelize.INTEGER,
          autoIncrement: true,
          primaryKey: true
        },
        // Basic property information
        name: {
          type: Sequelize.STRING,
          allowNull: false
        },
        code: {
          type: Sequelize.STRING,
          unique: true,
          allowNull: false
        },
        type: {
          type: Sequelize.STRING,
          allowNull: false
        },
        // Location information
        address: {
          type: Sequelize.STRING,
          allowNull: false
        },
        city: {
          type: Sequelize.STRING,
          allowNull: false
        },
        state: {
          type: Sequelize.STRING,
          allowNull: false
        },
        zip_code: {
          type: Sequelize.STRING,
          allowNull: false
        },
        country: {
          type: Sequelize.STRING,
          defaultValue: 'USA'
        },
        // Geo coordinates for mapping
        latitude: {
          type: Sequelize.FLOAT
        },
        longitude: {
          type: Sequelize.FLOAT
        },
        // Client information
        client_id: {
          type: Sequelize.INTEGER, // Verify this matches the users table PK type
          references: {
            model: 'users', // Ensure 'users' table exists before this migration runs
            key: 'id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL'
        },
        // Property details
        size_sq_ft: {
          type: Sequelize.INTEGER
        },
        num_buildings: {
          type: Sequelize.INTEGER,
          defaultValue: 1
        },
        num_floors: {
          type: Sequelize.INTEGER,
          defaultValue: 1
        },
        num_units: {
          type: Sequelize.INTEGER,
          defaultValue: 1
        },
        year_built: {
          type: Sequelize.INTEGER
        },
        // Security related information
        security_level: {
          type: Sequelize.STRING,
          defaultValue: 'standard'
        },
        has_gate: {
          type: Sequelize.BOOLEAN,
          defaultValue: false
        },
        has_reception: {
          type: Sequelize.BOOLEAN,
          defaultValue: false
        },
        has_security_office: {
          type: Sequelize.BOOLEAN,
          defaultValue: false
        },
        num_cameras: {
          type: Sequelize.INTEGER,
          defaultValue: 0
        },
        num_entry_points: {
          type: Sequelize.INTEGER,
          defaultValue: 1
        },
        requires_patrol: {
          type: Sequelize.BOOLEAN,
          defaultValue: true
        },
        patrol_frequency_hours: {
          type: Sequelize.FLOAT,
          defaultValue: 1.0
        },
        // Contact information
        emergency_contact_name: {
          type: Sequelize.STRING
        },
        emergency_contact_phone: {
          type: Sequelize.STRING
        },
        property_manager_name: {
          type: Sequelize.STRING
        },
        property_manager_phone: {
          type: Sequelize.STRING
        },
        property_manager_email: {
          type: Sequelize.STRING
        },
        // Security coverage and status tracking
        last_patrol_timestamp: {
          type: Sequelize.DATE
        },
        next_patrol_due: {
          type: Sequelize.DATE
        },
        active_guards: {
          type: Sequelize.INTEGER,
          defaultValue: 0
        },
        guard_hours_per_week: {
          type: Sequelize.FLOAT,
          defaultValue: 0
        },
        patrol_route: {
          type: Sequelize.TEXT
        },
        patrol_instructions: {
          type: Sequelize.TEXT
        },
        // Business information
        contract_start_date: {
          type: Sequelize.DATEONLY
        },
        contract_end_date: {
          type: Sequelize.DATEONLY
        },
        billing_rate: {
          type: Sequelize.DECIMAL(10, 2)
        },
        billing_frequency: {
          type: Sequelize.STRING,
          defaultValue: 'monthly'
        },
        contract_status: {
          type: Sequelize.STRING,
          defaultValue: 'active'
        },
        // Customization options
        theme_primary_color: {
          type: Sequelize.STRING,
          defaultValue: '#3366FF'
        },
        theme_secondary_color: {
          type: Sequelize.STRING,
          defaultValue: '#FF6633'
        },
        logo_url: {
          type: Sequelize.STRING
        },
        // System fields
        status: {
          type: Sequelize.STRING,
          defaultValue: 'active'
        },
        created_at: {
          type: Sequelize.DATE,
          defaultValue: Sequelize.NOW // Sequelize.NOW is generally preferred over literal
        },
        updated_at: {
          type: Sequelize.DATE,
          defaultValue: Sequelize.NOW
        }
      });
    } else {
      console.log('Properties table already exists, skipping creation');
    }

    // Helper function to create indexes if they don't exist
    const createIndexIfNotExists = async (tableName, columns, options = {}) => {
      try {
        // Create an index name that matches what Sequelize would generate
        const indexName = options.name ||
          `${tableName}_${Array.isArray(columns) ? columns.join('_') : columns}${options.unique ? '_unique' : ''}`;

        // Check if index already exists
        const indexes = await queryInterface.sequelize.query(
          `SELECT indexname FROM pg_indexes WHERE indexname = '${indexName}' AND tablename = '${tableName}'`,
          { type: queryInterface.sequelize.QueryTypes.SELECT }
        );

        if (indexes.length === 0) {
          await queryInterface.addIndex(tableName, columns, options);
          console.log(`Created index ${indexName}`);
        } else {
          console.log(`Index ${indexName} already exists, skipping creation`);
        }
      } catch (error) {
        console.error(`Error with index on ${columns}:`, error.message);
        // Decide if you want to throw the error or just log it
        // throw error;
      }
    };

    // Add each index with a safety check
    await createIndexIfNotExists('properties', ['code'], { name: 'properties_code_unique', unique: true }); // Explicitly named unique index
    await createIndexIfNotExists('properties', ['client_id'], { name: 'properties_client_id' });
    await createIndexIfNotExists('properties', ['status'], { name: 'properties_status' });
    await createIndexIfNotExists('properties', ['type'], { name: 'properties_type' });
    await createIndexIfNotExists('properties', ['city', 'state'], { name: 'properties_city_state' });
    await createIndexIfNotExists('properties', ['next_patrol_due'], { name: 'properties_next_patrol_due' });
    await createIndexIfNotExists('properties', ['contract_status'], { name: 'properties_contract_status' });
  },

  async down(queryInterface, Sequelize) {
    // Modified line: Added { cascade: true }
    await queryInterface.dropTable('properties', { cascade: true });
  }
};