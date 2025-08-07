'use strict';

/**
 * CALL LOGS TABLE MIGRATION - MASTER PROMPT v49.0
 * ===============================================
 * Creates the call_logs table for Voice AI Dispatcher system
 * This table stores comprehensive records of all voice calls
 */

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('call_logs', {
      call_id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
        comment: 'Unique identifier for each call'
      },
      
      // Call Basic Information
      twilio_call_sid: {
        type: Sequelize.STRING(100),
        allowNull: false,
        unique: true,
        comment: 'Twilio unique call identifier'
      },
      
      caller_phone: {
        type: Sequelize.STRING(20),
        allowNull: false,
        comment: 'Caller phone number in E.164 format'
      },
      
      property_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'properties',
          key: 'property_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
        comment: 'Associated property if identified'
      },
      
      // Call Lifecycle
      call_status: {
        type: Sequelize.ENUM(
          'initiated',
          'in_progress', 
          'ai_handling',
          'human_takeover',
          'completed',
          'failed',
          'abandoned'
        ),
        allowNull: false,
        defaultValue: 'initiated',
        comment: 'Current status of the call'
      },
      
      call_direction: {
        type: Sequelize.ENUM('inbound', 'outbound'),
        allowNull: false,
        comment: 'Direction of the call'
      },
      
      started_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
        comment: 'When the call was initiated'
      },
      
      ended_at: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'When the call ended'
      },
      
      duration_seconds: {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: 'Total call duration in seconds'
      },
      
      // AI Processing Data
      transcript: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Full conversation transcript from Deepgram STT'
      },
      
      ai_confidence_score: {
        type: Sequelize.DECIMAL(5,4),
        allowNull: true,
        comment: 'AI confidence in understanding the call (0.0000-1.0000)'
      },
      
      incident_type_detected: {
        type: Sequelize.STRING(100),
        allowNull: true,
        comment: 'Type of incident identified by AI'
      },
      
      ai_actions_taken: {
        type: Sequelize.JSONB,
        allowNull: true,
        comment: 'JSON array of actions taken by AI during call'
      },
      
      // Human Intervention
      human_takeover_at: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'Timestamp when human operator took over'
      },
      
      human_operator_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'user_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
        comment: 'ID of human operator who took over call'
      },
      
      takeover_reason: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Reason for human takeover'
      },
      
      // Media & Evidence
      call_recording_url: {
        type: Sequelize.STRING(500),
        allowNull: true,
        comment: 'Twilio recording URL or local file path'
      },
      
      call_recording_duration: {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: 'Recording duration in seconds'
      },
      
      // Incident Creation
      incident_created: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        comment: 'Whether an incident was created from this call'
      },
      
      incident_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'incidents',
          key: 'incident_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
        comment: 'Associated incident ID if created'
      },
      
      // Quality & Compliance
      call_quality_rating: {
        type: Sequelize.INTEGER,
        allowNull: true,
        validate: {
          min: 1,
          max: 5
        },
        comment: 'Call quality rating (1-5) for post-call analysis'
      },
      
      compliance_notes: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Notes regarding compliance requirements'
      },
      
      // Emergency Services Integration
      police_called: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        comment: 'Whether police were contacted during this call'
      },
      
      police_call_log_id: {
        type: Sequelize.UUID,
        allowNull: true,
        comment: 'Reference to police call log if escalated'
      },
      
      // System Metadata
      ai_model_version: {
        type: Sequelize.STRING(50),
        allowNull: true,
        comment: 'Version of AI model used for this call'
      },
      
      sop_used: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'standard_operating_procedures',
          key: 'sop_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
        comment: 'Reference to SOP that was followed'
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
      comment: 'Comprehensive log of all voice calls handled by Voice AI Dispatcher'
    });

    // Create indexes for performance
    await queryInterface.addIndex('call_logs', ['twilio_call_sid'], {
      unique: true,
      name: 'idx_call_logs_twilio_sid'
    });
    
    await queryInterface.addIndex('call_logs', ['caller_phone'], {
      name: 'idx_call_logs_caller_phone'
    });
    
    await queryInterface.addIndex('call_logs', ['property_id'], {
      name: 'idx_call_logs_property_id'
    });
    
    await queryInterface.addIndex('call_logs', ['call_status'], {
      name: 'idx_call_logs_status'
    });
    
    await queryInterface.addIndex('call_logs', ['started_at'], {
      name: 'idx_call_logs_started_at'
    });
    
    await queryInterface.addIndex('call_logs', ['incident_id'], {
      name: 'idx_call_logs_incident_id'
    });
    
    await queryInterface.addIndex('call_logs', ['ai_confidence_score'], {
      name: 'idx_call_logs_confidence'
    });
  },

  async down(queryInterface, Sequelize) {
    // Drop indexes first
    await queryInterface.removeIndex('call_logs', 'idx_call_logs_twilio_sid');
    await queryInterface.removeIndex('call_logs', 'idx_call_logs_caller_phone');
    await queryInterface.removeIndex('call_logs', 'idx_call_logs_property_id');
    await queryInterface.removeIndex('call_logs', 'idx_call_logs_status');
    await queryInterface.removeIndex('call_logs', 'idx_call_logs_started_at');
    await queryInterface.removeIndex('call_logs', 'idx_call_logs_incident_id');
    await queryInterface.removeIndex('call_logs', 'idx_call_logs_confidence');
    
    // Drop the table
    await queryInterface.dropTable('call_logs');
  }
};
