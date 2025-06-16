// File: defense/backend/migrations/20250310000009-create-vehicle-damages.cjs (RENAME this file)
'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('vehicle_damages', { // Use snake_case table name
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true
      },
      vehicle_id: { // Use snake_case column name
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'vehicles', // Ensure vehicles table exists
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      reported_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      reported_by_guard_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'guards', // Ensure guards table exists
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT' // Or SET NULL
      },
      incident_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'incidents', // Ensure incidents table exists
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      inspection_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'vehicle_inspections', // Ensure inspections table exists
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      damage_description: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      damage_location: {
        type: Sequelize.STRING,
        allowNull: true
      },
      severity: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: 'minor'
      },
      estimated_repair_cost: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true
      },
      actual_repair_cost: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true
      },
      repair_status: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: 'reported'
      },
      repair_completed_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      photos: {
        type: Sequelize.TEXT, // Or JSONB
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
    await queryInterface.addIndex('vehicle_damages', ['vehicle_id']);
    await queryInterface.addIndex('vehicle_damages', ['reported_by_guard_id']);
    await queryInterface.addIndex('vehicle_damages', ['incident_id']);
    await queryInterface.addIndex('vehicle_damages', ['inspection_id']);
    await queryInterface.addIndex('vehicle_damages', ['severity']);
    await queryInterface.addIndex('vehicle_damages', ['repair_status']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('vehicle_damages');
  }
};