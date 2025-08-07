'use strict';

/**
 * CONTACT LISTS TABLE MIGRATION - MASTER PROMPT v49.0
 * ===================================================
 * Creates the contact_lists table for Voice AI Dispatcher
 * This table stores notification contact lists for automated alerts
 */

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('contact_lists', {
      contact_list_id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
        comment: 'Unique identifier for each contact list'
      },
      
      // Basic List Information
      name: {
        type: Sequelize.STRING(200),
        allowNull: false,
        comment: 'Descriptive name of the contact list'
      },
      
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Description of when this contact list should be used'
      },
      
      property_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'properties',
          key: 'property_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        comment: 'Property this contact list belongs to'
      },
      
      // List Type & Priority
      list_type: {
        type: Sequelize.ENUM(
          'primary',        // Main contact list for regular incidents
          'emergency',      // Emergency services and critical contacts
          'management',     // Property management team
          'maintenance',    // Maintenance and facilities team
          'security',       // Security personnel and guards
          'custom'          // Custom contact list
        ),
        allowNull: false,
        comment: 'Type/category of this contact list'
      },
      
      priority_order: {
        type: Sequelize.INTEGER,
        defaultValue: 1,
        comment: 'Order in which this list should be processed (1 = highest)'
      },
      
      // Contact Information (JSONB for flexibility)
      contacts: {
        type: Sequelize.JSONB,
        allowNull: false,
        comment: 'JSON array of contact objects with name, phone, email, role, etc.'
      },
      
      // Notification Preferences
      notification_methods: {
        type: Sequelize.JSONB,
        allowNull: false,
        defaultValue: '["sms", "email"]',
        comment: 'JSON array of notification methods: sms, email, push, call'
      },
      
      notification_schedule: {
        type: Sequelize.JSONB,
        allowNull: true,
        comment: 'JSON object defining when notifications should be sent (business hours, 24/7, etc.)'
      },
      
      // Escalation Settings
      escalation_delay_minutes: {
        type: Sequelize.INTEGER,
        defaultValue: 5,
        comment: 'Minutes to wait before escalating to next contact in list'
      },
      
      max_escalation_attempts: {
        type: Sequelize.INTEGER,
        defaultValue: 3,
        comment: 'Maximum number of escalation attempts'
      },
      
      require_acknowledgment: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        comment: 'Whether contacts must acknowledge receipt of notification'
      },
      
      // Incident Type Filtering
      applicable_incident_types: {
        type: Sequelize.JSONB,
        allowNull: true,
        comment: 'JSON array of incident types this list applies to (null = all types)'
      },
      
      excluded_incident_types: {
        type: Sequelize.JSONB,
        allowNull: true,
        comment: 'JSON array of incident types this list should NOT be used for'
      },
      
      // Time-based Rules
      active_hours: {
        type: Sequelize.JSONB,
        allowNull: true,
        comment: 'JSON object defining when this contact list is active'
      },
      
      timezone: {
        type: Sequelize.STRING(50),
        defaultValue: 'America/New_York',
        comment: 'Timezone for this contact list'
      },
      
      // Status & Lifecycle
      status: {
        type: Sequelize.ENUM('active', 'inactive', 'archived'),
        allowNull: false,
        defaultValue: 'active',
        comment: 'Current status of this contact list'
      },
      
      effective_date: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'When this contact list becomes effective'
      },
      
      expiration_date: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'When this contact list expires'
      },
      
      // Management & Authorization
      created_by: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'user_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
        comment: 'User who created this contact list'
      },
      
      managed_by: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'user_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
        comment: 'User responsible for maintaining this contact list'
      },
      
      last_updated_by: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'user_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
        comment: 'User who last updated this contact list'
      },
      
      // Usage Statistics
      times_used: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        comment: 'Number of times this contact list has been used'
      },
      
      successful_notifications: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        comment: 'Number of successful notifications sent'
      },
      
      failed_notifications: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        comment: 'Number of failed notification attempts'
      },
      
      last_used_at: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'When this contact list was last used'
      },
      
      // Compliance & Audit
      audit_log: {
        type: Sequelize.JSONB,
        allowNull: true,
        comment: 'JSON array of audit entries for contact list changes'
      },
      
      compliance_notes: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Compliance-related notes for this contact list'
      },
      
      // Metadata
      tags: {
        type: Sequelize.JSONB,
        allowNull: true,
        comment: 'JSON array of tags for categorization'
      },
      
      notes: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Additional notes about this contact list'
      },
      
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      }
    }, {
      comment: 'Contact lists for automated notifications in Voice AI Dispatcher system'
    });

    // Create indexes for performance
    await queryInterface.addIndex('contact_lists', ['property_id'], {
      name: 'idx_contact_lists_property_id'
    });
    
    await queryInterface.addIndex('contact_lists', ['list_type'], {
      name: 'idx_contact_lists_type'
    });
    
    await queryInterface.addIndex('contact_lists', ['property_id', 'list_type'], {
      name: 'idx_contact_lists_property_type'
    });
    
    await queryInterface.addIndex('contact_lists', ['status'], {
      name: 'idx_contact_lists_status'
    });
    
    await queryInterface.addIndex('contact_lists', ['priority_order'], {
      name: 'idx_contact_lists_priority'
    });
    
    await queryInterface.addIndex('contact_lists', ['created_by'], {
      name: 'idx_contact_lists_created_by'
    });
    
    await queryInterface.addIndex('contact_lists', ['managed_by'], {
      name: 'idx_contact_lists_managed_by'
    });
    
    await queryInterface.addIndex('contact_lists', ['times_used'], {
      name: 'idx_contact_lists_usage'
    });
    
    await queryInterface.addIndex('contact_lists', ['effective_date'], {
      name: 'idx_contact_lists_effective'
    });
  },

  async down(queryInterface, Sequelize) {
    // Drop indexes first
    await queryInterface.removeIndex('contact_lists', 'idx_contact_lists_property_id');
    await queryInterface.removeIndex('contact_lists', 'idx_contact_lists_type');
    await queryInterface.removeIndex('contact_lists', 'idx_contact_lists_property_type');
    await queryInterface.removeIndex('contact_lists', 'idx_contact_lists_status');
    await queryInterface.removeIndex('contact_lists', 'idx_contact_lists_priority');
    await queryInterface.removeIndex('contact_lists', 'idx_contact_lists_created_by');
    await queryInterface.removeIndex('contact_lists', 'idx_contact_lists_managed_by');
    await queryInterface.removeIndex('contact_lists', 'idx_contact_lists_usage');
    await queryInterface.removeIndex('contact_lists', 'idx_contact_lists_effective');
    
    // Drop the table
    await queryInterface.dropTable('contact_lists');
  }
};
