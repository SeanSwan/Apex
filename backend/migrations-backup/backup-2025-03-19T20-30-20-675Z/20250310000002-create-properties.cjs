'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
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
        type: Sequelize.INTEGER,
        references: {
          model: 'users',
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
        defaultValue: Sequelize.NOW
      },
      updated_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      }
    });

    // Add indexes for performance
    await queryInterface.addIndex('properties', ['code'], { unique: true });
    await queryInterface.addIndex('properties', ['client_id']);
    await queryInterface.addIndex('properties', ['status']);
    await queryInterface.addIndex('properties', ['type']);
    await queryInterface.addIndex('properties', ['city', 'state']);
    await queryInterface.addIndex('properties', ['next_patrol_due']);
    await queryInterface.addIndex('properties', ['contract_status']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('properties');
  }
};