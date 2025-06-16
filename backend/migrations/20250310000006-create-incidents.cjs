// File: defense/backend/migrations/20250310000006-create-incidents.cjs
'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Helper function to create indexes if they don't exist (copied from other migrations)
    const createIndexIfNotExists = async (tableName, columns, options = {}) => {
      try {
        // Create an index name (matches Sequelize's default or uses provided name)
        const indexName = options.name || queryInterface.queryGenerator.indexName(tableName, columns).replace(/"/g, '');

        // Check if index already exists using raw query specific to PostgreSQL
        const indexes = await queryInterface.sequelize.query(
          `SELECT indexname FROM pg_indexes WHERE indexname = $1 AND tablename = $2 AND schemaname = 'public'`,
          {
            bind: [indexName, tableName],
            type: queryInterface.sequelize.QueryTypes.SELECT
          }
        );

        if (indexes.length === 0) {
          await queryInterface.addIndex(tableName, columns, options);
          console.log(`Created index ${indexName} on ${tableName}`);
        } else {
          console.log(`Index ${indexName} on ${tableName} already exists, skipping creation`);
        }
      } catch (error) {
        console.error(`Error checking or creating index on ${tableName} for columns ${columns}:`, error.message);
        // Optionally re-throw the error if you want migration to fail hard
        // throw error;
      }
    };

    // Check if incidents table already exists
    const tables = await queryInterface.sequelize.query(
        "SELECT tablename FROM pg_catalog.pg_tables WHERE schemaname = 'public' AND tablename = 'incidents'",
        { type: queryInterface.sequelize.QueryTypes.SELECT }
      );

    // Only create table if it doesn't exist
    if (tables.length === 0) {
        await queryInterface.createTable('incidents', { // Use snake_case table name
        id: {
            type: Sequelize.INTEGER,
            autoIncrement: true,
            primaryKey: true,
            allowNull: false
        },
        property_id: { // snake_case column name
            type: Sequelize.INTEGER,
            references: {
            model: 'properties', // snake_case table name
            key: 'id'
            },
            allowNull: false,
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE'
        },
        reported_by_id: { // snake_case column name
            type: Sequelize.INTEGER,
            references: {
            model: 'users', // snake_case table name
            key: 'id'
            },
            allowNull: false,
            onUpdate: 'CASCADE',
            onDelete: 'SET NULL'
        },
        incident_time: { // snake_case column name
            type: Sequelize.DATE,
            allowNull: false
        },
        incident_type: { // snake_case column name
            type: Sequelize.STRING,
            allowNull: false,
        },
        severity: {
            type: Sequelize.STRING,
            defaultValue: 'low',
            allowNull: false
        },
        location_details: { // snake_case column name
            type: Sequelize.STRING,
            allowNull: true
        },
        description: {
            type: Sequelize.TEXT,
            allowNull: false
        },
        action_taken: { // snake_case column name
            type: Sequelize.TEXT,
            allowNull: true
        },
        authorities_contacted: { // snake_case column name
            type: Sequelize.BOOLEAN,
            defaultValue: false,
            allowNull: false
        },
        authorities_report_number: { // snake_case column name
            type: Sequelize.STRING,
            allowNull: true
        },
        witness_information: { // snake_case column name
            type: Sequelize.TEXT,
            allowNull: true
        },
        evidence_collected: { // snake_case column name
            type: Sequelize.TEXT,
            allowNull: true
        },
        photos: {
            type: Sequelize.TEXT, // Consider JSONB
            allowNull: true
        },
        status: {
            type: Sequelize.STRING,
            defaultValue: 'open',
            allowNull: false
        },
        resolution_notes: { // snake_case column name
            type: Sequelize.TEXT,
            allowNull: true
        },
        resolved_at: { // snake_case column name
            type: Sequelize.DATE,
            allowNull: true
        },
        resolved_by_id: { // snake_case column name
            type: Sequelize.INTEGER,
            references: {
            model: 'users',
            key: 'id'
            },
            allowNull: true,
            onUpdate: 'CASCADE',
            onDelete: 'SET NULL'
        },
        created_at: { // snake_case column name
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        },
        updated_at: { // snake_case column name
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        }
        });
        console.log('Incidents table created.');
    } else {
      console.log('Incidents table already exists, skipping creation');
    }

    // Use the helper function to add indexes safely
    await createIndexIfNotExists('incidents', ['property_id'], { name: 'incidents_property_id' }); // Explicit name matching previous attempt
    await createIndexIfNotExists('incidents', ['reported_by_id'], { name: 'incidents_reported_by_id' }); // Explicit name
    await createIndexIfNotExists('incidents', ['incident_type'], { name: 'incidents_incident_type' }); // Explicit name
    await createIndexIfNotExists('incidents', ['status'], { name: 'incidents_status' }); // Explicit name
    // Add others if needed, e.g., resolved_by_id
    await createIndexIfNotExists('incidents', ['resolved_by_id'], { name: 'incidents_resolved_by_id' }); // Explicit name

  },

  async down(queryInterface, Sequelize) {
    // Correctly drop the incidents table
    // Note: Dropping the table implicitly drops its indexes.
    // If you wanted to only drop indexes in down, you would use removeIndex.
    await queryInterface.dropTable('incidents');
    console.log('Incidents table dropped.');
  }
};