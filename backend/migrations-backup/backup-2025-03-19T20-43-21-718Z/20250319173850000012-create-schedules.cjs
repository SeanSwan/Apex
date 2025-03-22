'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('schedules', {
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
      // Shift template this schedule is based on
      shift_template_id: {
        type: Sequelize.UUID,
        references: {
          model: 'shift_templates',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      // Basic schedule information
      title: {
        type: Sequelize.STRING
      },
      description: {
        type: Sequelize.TEXT
      },
      // Timing
      start_time: {
        type: Sequelize.DATE,
        allowNull: false
      },
      end_time: {
        type: Sequelize.DATE,
        allowNull: false
      },
      duration_hours: {
        type: Sequelize.FLOAT
      },
      // Location
      location: {
        type: Sequelize.STRING
      },
      zone_id: {
        type: Sequelize.UUID,
        references: {
          model: 'security_zones',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      post_id: {
        type: Sequelize.UUID,
        references: {
          model: 'posts',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      // Shift details
      shift_type: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: 'regular'
      },
      shift_category: {
        type: Sequelize.STRING,
        defaultValue: 'day'
      },
      recurring: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      recurrence_pattern: {
        type: Sequelize.JSONB,
        defaultValue: null
      },
      recurrence_end_date: {
        type: Sequelize.DATE
      },
      parent_recurring_id: {
        type: Sequelize.UUID,
        references: {
          model: 'schedules',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      // Requirements
      required_skills: {
        type: Sequelize.JSONB,
        defaultValue: []
      },
      required_certifications: {
        type: Sequelize.JSONB,
        defaultValue: []
      },
      required_equipment: {
        type: Sequelize.JSONB,
        defaultValue: []
      },
      minimum_rank: {
        type: Sequelize.STRING
      },
      specific_guard_only: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      // Duties and responsibilities
      duties: {
        type: Sequelize.JSONB,
        defaultValue: []
      },
      patrol_route_id: {
        type: Sequelize.UUID,
        references: {
          model: 'patrol_routes',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      special_instructions: {
        type: Sequelize.TEXT
      },
      // Status tracking
      status: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: 'scheduled'
      },
      published: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      confirmed: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      confirmed_at: {
        type: Sequelize.DATE
      },
      check_in_time: {
        type: Sequelize.DATE
      },
      check_out_time: {
        type: Sequelize.DATE
      },
      check_in_latitude: {
        type: Sequelize.FLOAT
      },
      check_in_longitude: {
        type: Sequelize.FLOAT
      },
      check_out_latitude: {
        type: Sequelize.FLOAT
      },
      check_out_longitude: {
        type: Sequelize.FLOAT
      },
      check_in_photo: {
        type: Sequelize.STRING
      },
      check_out_photo: {
        type: Sequelize.STRING
      },
      on_time: {
        type: Sequelize.BOOLEAN
      },
      late_minutes: {
        type: Sequelize.INTEGER
      },
      // Swap and change tracking
      swapped: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      swapped_with: {
        type: Sequelize.UUID,
        references: {
          model: 'schedules',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      swap_requested_by: {
        type: Sequelize.UUID,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      swap_approved_by: {
        type: Sequelize.UUID,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      swap_reason: {
        type: Sequelize.TEXT
      },
      modified: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      modified_by: {
        type: Sequelize.UUID,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      modified_at: {
        type: Sequelize.DATE
      },
      modification_reason: {
        type: Sequelize.TEXT
      },
      // Cancellation tracking
      canceled: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      canceled_by: {
        type: Sequelize.UUID,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      canceled_at: {
        type: Sequelize.DATE
      },
      cancellation_reason: {
        type: Sequelize.TEXT
      },
      // Scheduling metadata
      scheduled_by: {
        type: Sequelize.UUID,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      scheduled_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      },
      // Notifications
      notification_sent: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      last_notification_sent: {
        type: Sequelize.DATE
      },
      reminder_sent: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      reminder_sent_at: {
        type: Sequelize.DATE
      },
      // Payroll and billing
      is_billable: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      billing_code: {
        type: Sequelize.STRING
      },
      billing_rate: {
        type: Sequelize.DECIMAL(10, 2)
      },
      billing_notes: {
        type: Sequelize.TEXT
      },
      is_overtime: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      overtime_rate: {
        type: Sequelize.DECIMAL(10, 2)
      },
      overtime_approved_by: {
        type: Sequelize.UUID,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      overtime_notes: {
        type: Sequelize.TEXT
      },
      // Performance tracking
      performance_rating: {
        type: Sequelize.INTEGER
      },
      performance_notes: {
        type: Sequelize.TEXT
      },
      rated_by: {
        type: Sequelize.UUID,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      // Notes and documentation
      notes: {
        type: Sequelize.TEXT
      },
      guard_notes: {
        type: Sequelize.TEXT
      },
      supervisor_notes: {
        type: Sequelize.TEXT
      },
      attachments: {
        type: Sequelize.JSONB,
        defaultValue: []
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
    await queryInterface.addIndex('schedules', ['property_id']);
    await queryInterface.addIndex('schedules', ['user_id']);
    await queryInterface.addIndex('schedules', ['shift_template_id']);
    await queryInterface.addIndex('schedules', ['status']);
    await queryInterface.addIndex('schedules', ['start_time']);
    await queryInterface.addIndex('schedules', ['end_time']);
    await queryInterface.addIndex('schedules', ['patrol_route_id']);
    
    // Additional useful indexes
    await queryInterface.addIndex('schedules', ['property_id', 'user_id']);
    await queryInterface.addIndex('schedules', ['property_id', 'status']);
    await queryInterface.addIndex('schedules', ['user_id', 'status']);
    await queryInterface.addIndex('schedules', ['start_time', 'end_time']);
    await queryInterface.addIndex('schedules', ['confirmed']);
    await queryInterface.addIndex('schedules', ['parent_recurring_id']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('schedules');
  }
};