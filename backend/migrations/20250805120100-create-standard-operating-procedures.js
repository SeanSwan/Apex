'use strict';

/**
 * STANDARD OPERATING PROCEDURES TABLE MIGRATION - MASTER PROMPT v49.0
 * ===================================================================
 * Creates the standard_operating_procedures table for Voice AI Dispatcher
 * This table stores property-specific SOPs that guide AI decision-making
 */

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('standard_operating_procedures', {
      sop_id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
        comment: 'Unique identifier for each SOP'
      },
      
      // Basic SOP Information
      title: {
        type: Sequelize.STRING(200),
        allowNull: false,
        comment: 'Descriptive title of the SOP'
      },
      
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Detailed description of when this SOP applies'
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
        comment: 'Property this SOP belongs to'
      },
      
      // Incident Classification
      incident_type: {
        type: Sequelize.ENUM(
          'noise_complaint',
          'lockout',
          'maintenance_emergency',
          'security_breach',
          'medical_emergency',
          'fire_alarm',
          'suspicious_activity',
          'package_theft',
          'vandalism',
          'domestic_disturbance',
          'utility_outage',
          'elevator_emergency',
          'parking_violation',
          'unauthorized_access',
          'general_inquiry',
          'other'
        ),
        allowNull: false,
        comment: 'Type of incident this SOP handles'
      },
      
      priority_level: {
        type: Sequelize.ENUM('low', 'medium', 'high', 'critical'),
        allowNull: false,
        defaultValue: 'medium',
        comment: 'Priority level for this type of incident'
      },
      
      // AI Conversation Flow
      initial_response_script: {
        type: Sequelize.TEXT,
        allowNull: false,
        comment: 'Initial AI response when this SOP is triggered'
      },
      
      information_gathering_questions: {
        type: Sequelize.JSONB,
        allowNull: true,
        comment: 'JSON array of questions AI should ask to gather information'
      },
      
      conversation_flow: {
        type: Sequelize.JSONB,
        allowNull: true,
        comment: 'JSON object defining conversation decision tree'
      },
      
      // Automated Actions
      automated_actions: {
        type: Sequelize.JSONB,
        allowNull: true,
        comment: 'JSON array of actions AI should take automatically'
      },
      
      // Notification Settings
      notify_guard: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
        comment: 'Whether to notify on-duty guard'
      },
      
      notify_manager: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        comment: 'Whether to notify property manager'
      },
      
      notify_emergency_services: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        comment: 'Whether to contact emergency services'
      },
      
      notification_delay_minutes: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        comment: 'Delay before sending notifications (in minutes)'
      },
      
      // Escalation Rules
      escalation_triggers: {
        type: Sequelize.JSONB,
        allowNull: true,
        comment: 'JSON object defining when to escalate to human'
      },
      
      auto_escalate_after_minutes: {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: 'Auto-escalate to human after X minutes'
      },
      
      human_takeover_threshold: {
        type: Sequelize.DECIMAL(3,2),
        defaultValue: 0.70,
        comment: 'AI confidence threshold below which to escalate (0.00-1.00)'
      },
      
      // Contact Information
      primary_contact_list_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'contact_lists',
          key: 'contact_list_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
        comment: 'Primary contact list to use for notifications'
      },
      
      emergency_contact_list_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'contact_lists',
          key: 'contact_list_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
        comment: 'Emergency contact list for critical incidents'
      },
      
      // Documentation & Compliance
      compliance_requirements: {
        type: Sequelize.JSONB,
        allowNull: true,
        comment: 'JSON object with compliance requirements for this SOP'
      },
      
      documentation_requirements: {
        type: Sequelize.JSONB,
        allowNull: true,
        comment: 'What information must be documented for this incident type'
      },
      
      // Status & Lifecycle
      status: {
        type: Sequelize.ENUM('draft', 'active', 'inactive', 'archived'),
        allowNull: false,
        defaultValue: 'draft',
        comment: 'Current status of this SOP'
      },
      
      version: {
        type: Sequelize.STRING(20),
        allowNull: false,
        defaultValue: '1.0',
        comment: 'Version number of this SOP'
      },
      
      effective_date: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'When this SOP becomes effective'
      },
      
      expiration_date: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'When this SOP expires'
      },
      
      // Approval & Authorization
      created_by: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'user_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
        comment: 'User who created this SOP'
      },
      
      approved_by: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'user_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
        comment: 'User who approved this SOP'
      },
      
      approved_at: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'When this SOP was approved'
      },
      
      // Usage Statistics
      times_used: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        comment: 'Number of times this SOP has been invoked'
      },
      
      success_rate: {
        type: Sequelize.DECIMAL(5,4),
        allowNull: true,
        comment: 'Success rate of this SOP (0.0000-1.0000)'
      },
      
      last_used_at: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'When this SOP was last used'
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
        comment: 'Additional notes about this SOP'
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
      comment: 'Property-specific Standard Operating Procedures for Voice AI Dispatcher'
    });

    // Create indexes for performance
    await queryInterface.addIndex('standard_operating_procedures', ['property_id'], {
      name: 'idx_sop_property_id'
    });
    
    await queryInterface.addIndex('standard_operating_procedures', ['incident_type'], {
      name: 'idx_sop_incident_type'
    });
    
    await queryInterface.addIndex('standard_operating_procedures', ['property_id', 'incident_type'], {
      name: 'idx_sop_property_incident'
    });
    
    await queryInterface.addIndex('standard_operating_procedures', ['status'], {
      name: 'idx_sop_status'
    });
    
    await queryInterface.addIndex('standard_operating_procedures', ['priority_level'], {
      name: 'idx_sop_priority'
    });
    
    await queryInterface.addIndex('standard_operating_procedures', ['effective_date'], {
      name: 'idx_sop_effective_date'
    });
    
    await queryInterface.addIndex('standard_operating_procedures', ['created_by'], {
      name: 'idx_sop_created_by'
    });
    
    await queryInterface.addIndex('standard_operating_procedures', ['times_used'], {
      name: 'idx_sop_usage'
    });
  },

  async down(queryInterface, Sequelize) {
    // Drop indexes first
    await queryInterface.removeIndex('standard_operating_procedures', 'idx_sop_property_id');
    await queryInterface.removeIndex('standard_operating_procedures', 'idx_sop_incident_type');
    await queryInterface.removeIndex('standard_operating_procedures', 'idx_sop_property_incident');
    await queryInterface.removeIndex('standard_operating_procedures', 'idx_sop_status');
    await queryInterface.removeIndex('standard_operating_procedures', 'idx_sop_priority');
    await queryInterface.removeIndex('standard_operating_procedures', 'idx_sop_effective_date');
    await queryInterface.removeIndex('standard_operating_procedures', 'idx_sop_created_by');
    await queryInterface.removeIndex('standard_operating_procedures', 'idx_sop_usage');
    
    // Drop the table
    await queryInterface.dropTable('standard_operating_procedures');
  }
};
