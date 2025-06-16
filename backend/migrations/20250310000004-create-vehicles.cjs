// File: defense/backend/migrations/20250310000004-create-vehicles.cjs (RENAME this file)
'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('vehicles', { // Use snake_case table name
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true
      },
      call_sign: { // Use snake_case column names in migration
        type: Sequelize.STRING,
        unique: true,
        allowNull: true
      },
      make: {
        type: Sequelize.STRING,
        allowNull: true
      },
      model: {
        type: Sequelize.STRING,
        allowNull: true
      },
      year: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      license_plate: {
        type: Sequelize.STRING,
        unique: true,
        allowNull: false
      },
      vin: {
        type: Sequelize.STRING,
        unique: true,
        allowNull: true
      },
      color: {
        type: Sequelize.STRING,
        allowNull: true
      },
      status: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: 'available'
      },
      condition_status: {
          type: Sequelize.STRING,
          allowNull: false,
          defaultValue: 'operational'
      },
      condition_notes: {
          type: Sequelize.TEXT,
          allowNull: true
      },
      current_driver_guard_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'guards', // Ensure guards table exists first
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      last_known_latitude: {
        type: Sequelize.FLOAT,
        allowNull: true
      },
      last_known_longitude: {
        type: Sequelize.FLOAT,
        allowNull: true
      },
      last_location_timestamp: {
        type: Sequelize.DATE,
        allowNull: true
      },
      odometer: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      fuel_level_percent: {
        type: Sequelize.FLOAT,
        allowNull: true
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });
    // Add Indexes
    await queryInterface.addIndex('vehicles', ['license_plate']);
    await queryInterface.addIndex('vehicles', ['vin']);
    await queryInterface.addIndex('vehicles', ['call_sign']);
    await queryInterface.addIndex('vehicles', ['status']);
    await queryInterface.addIndex('vehicles', ['current_driver_guard_id']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('vehicles', { cascade: true }); // Keep cascade for safety during rollback
  }
};