'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('property_assignments', {
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
      user_id: {
        type: Sequelize.UUID,
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
        type: Sequelize.UUID,
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
        type: Sequelize.UUID,
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

    // Add indexes for performance
    await queryInterface.addIndex('property_assignments', ['property_id']);
    await queryInterface.addIndex('property_assignments', ['user_id']);
    await queryInterface.addIndex('property_assignments', ['status']);
    await queryInterface.addIndex('property_assignments', ['is_primary']);
    await queryInterface.addIndex('property_assignments', ['start_date']);
    await queryInterface.addIndex('property_assignments', ['end_date']);
    
    // Add compound index for property and user combinations
    await queryInterface.addIndex('property_assignments', ['property_id', 'user_id']);
    
    // Add compound index for active assignments
    await queryInterface.addIndex('property_assignments', ['property_id', 'status']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('property_assignments');
  }
};