// File: defense/backend/migrations/20250310000008-create-vehicle-inspections.cjs (RENAME this file)
'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('vehicle_inspections', { // Use snake_case table name
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true
      },
      vehicle_id: { // Use snake_case column name
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'vehicles', // Ensure vehicles table exists first
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      inspection_type: {
        type: Sequelize.STRING,
        allowNull: false
      },
      inspection_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      inspected_by_guard_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'guards', // Ensure guards table exists first
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT' // Or SET NULL based on policy
      },
      odometer_reading: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      fuel_level_percent: {
        type: Sequelize.FLOAT,
        allowNull: true
      },
      tires_ok: {
        type: Sequelize.BOOLEAN,
        allowNull: true
      },
      lights_ok: {
        type: Sequelize.BOOLEAN,
        allowNull: true
      },
      fluids_ok: {
        type: Sequelize.BOOLEAN,
        allowNull: true
      },
      damage_found: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      damage_description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      photos: {
        type: Sequelize.TEXT, // Or JSONB
        allowNull: true
      },
      overall_condition: {
          type: Sequelize.STRING,
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
    await queryInterface.addIndex('vehicle_inspections', ['vehicle_id']);
    await queryInterface.addIndex('vehicle_inspections', ['inspected_by_guard_id']);
    await queryInterface.addIndex('vehicle_inspections', ['inspection_type']);
    await queryInterface.addIndex('vehicle_inspections', ['inspection_at']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('vehicle_inspections');
  }
};