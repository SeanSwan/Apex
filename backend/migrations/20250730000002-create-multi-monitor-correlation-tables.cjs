/**
 * MIGRATION: CREATE MULTI-MONITOR THREAT CORRELATION TABLES
 * =========================================================
 * Creates database tables for storing cross-monitor threat correlations and handoff data
 * Supports the APEX AI Multi-Monitor Threat Coordination system
 */

'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Create monitor_relationships table
    await queryInterface.createTable('monitor_relationships', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      relationship_id: {
        type: Sequelize.STRING(100),
        allowNull: false,
        unique: true,
        comment: 'Unique identifier for the monitor relationship'
      },
      monitor_a: {
        type: Sequelize.STRING(100),
        allowNull: false,
        comment: 'First monitor identifier'
      },
      monitor_b: {
        type: Sequelize.STRING(100),
        allowNull: false,
        comment: 'Second monitor identifier'
      },
      spatial_relationship: {
        type: Sequelize.ENUM('adjacent', 'overlapping', 'sequential', 'isolated'),
        allowNull: false,
        defaultValue: 'adjacent',
        comment: 'Type of spatial relationship between monitors'
      },
      transition_zones: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'JSON array of zones where handoffs typically occur'
      },
      average_handoff_time: {
        type: Sequelize.DECIMAL(5, 3),
        allowNull: false,
        defaultValue: 2.000,
        comment: 'Historical average handoff time in seconds'
      },
      confidence_multiplier: {
        type: Sequelize.DECIMAL(3, 2),
        allowNull: false,
        defaultValue: 1.20,
        comment: 'Boost factor for correlations between these monitors'
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        comment: 'Whether this relationship is actively used for correlation'
      },
      metadata: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Additional relationship metadata stored as JSON'
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
    }, {
      comment: 'Stores spatial and logical relationships between monitors for correlation'
    });

    // Create cross_monitor_threats table
    await queryInterface.createTable('cross_monitor_threats', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      threat_id: {
        type: Sequelize.STRING(100),
        allowNull: false,
        unique: true,
        comment: 'Unique identifier for the threat'
      },
      original_detection_id: {
        type: Sequelize.STRING(100),
        allowNull: false,
        comment: 'Original detection ID from AI engine'
      },
      monitor_id: {
        type: Sequelize.STRING(100),
        allowNull: false,
        comment: 'Monitor where threat was detected'
      },
      zone_id: {
        type: Sequelize.STRING(100),
        allowNull: false,
        comment: 'Zone where threat was detected'
      },
      threat_type: {
        type: Sequelize.STRING(50),
        allowNull: false,
        comment: 'Type of threat detected'
      },
      threat_level: {
        type: Sequelize.ENUM('LOW', 'MEDIUM', 'HIGH', 'CRITICAL', 'WEAPON'),
        allowNull: false,
        defaultValue: 'MEDIUM',
        comment: 'Severity level of the threat'
      },
      confidence: {
        type: Sequelize.DECIMAL(3, 2),
        allowNull: false,
        comment: 'AI confidence score for the threat detection'
      },
      bbox_x: {
        type: Sequelize.INTEGER,
        allowNull: false,
        comment: 'Bounding box X coordinate'
      },
      bbox_y: {
        type: Sequelize.INTEGER,
        allowNull: false,
        comment: 'Bounding box Y coordinate'
      },
      bbox_width: {
        type: Sequelize.INTEGER,
        allowNull: false,
        comment: 'Bounding box width'
      },
      bbox_height: {
        type: Sequelize.INTEGER,
        allowNull: false,
        comment: 'Bounding box height'
      },
      features: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'JSON of AI feature vectors and characteristics for correlation'
      },
      movement_vector_x: {
        type: Sequelize.DECIMAL(8, 4),
        allowNull: true,
        comment: 'Movement velocity X component'
      },
      movement_vector_y: {
        type: Sequelize.DECIMAL(8, 4),
        allowNull: true,
        comment: 'Movement velocity Y component'
      },
      last_seen: {
        type: Sequelize.DATE,
        allowNull: false,
        comment: 'Timestamp when threat was last observed'
      },
      correlation_metadata: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Additional correlation metadata stored as JSON'
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        comment: 'Whether threat is still actively tracked'
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
    }, {
      comment: 'Stores threat profiles for cross-monitor correlation analysis'
    });

    // Create threat_correlations table
    await queryInterface.createTable('threat_correlations', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      correlation_id: {
        type: Sequelize.STRING(100),
        allowNull: false,
        unique: true,
        comment: 'Unique identifier for the threat correlation'
      },
      primary_threat_id: {
        type: Sequelize.STRING(100),
        allowNull: false,
        comment: 'ID of the primary threat in the correlation'
      },
      correlated_threat_ids: {
        type: Sequelize.TEXT,
        allowNull: false,
        comment: 'JSON array of correlated threat IDs'
      },
      confidence_score: {
        type: Sequelize.DECIMAL(3, 2),
        allowNull: false,
        comment: 'Overall confidence score for the correlation'
      },
      correlation_status: {
        type: Sequelize.ENUM('pending', 'active', 'handoff_in_progress', 'completed', 'expired', 'failed'),
        allowNull: false,
        defaultValue: 'pending',
        comment: 'Current status of the correlation'
      },
      correlation_factors: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'JSON breakdown of factors contributing to correlation score'
      },
      expected_monitors: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'JSON array of monitors where threat might appear next'
      },
      handoff_history: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'JSON array of handoff events and their outcomes'
      },
      last_updated: {
        type: Sequelize.DATE,
        allowNull: false,
        comment: 'Timestamp of last correlation update'
      },
      expires_at: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'When this correlation expires if not updated'
      },
      metadata: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Additional correlation metadata stored as JSON'
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
    }, {
      comment: 'Stores correlations between threats across multiple monitors'
    });

    // Create threat_handoff_log table for audit trail
    await queryInterface.createTable('threat_handoff_log', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      handoff_id: {
        type: Sequelize.STRING(100),
        allowNull: false,
        unique: true,
        comment: 'Unique identifier for the handoff event'
      },
      correlation_id: {
        type: Sequelize.STRING(100),
        allowNull: false,
        comment: 'ID of the correlation being handed off'
      },
      threat_id: {
        type: Sequelize.STRING(100),
        allowNull: false,
        comment: 'Primary threat ID being handed off'
      },
      from_monitor: {
        type: Sequelize.STRING(100),
        allowNull: false,
        comment: 'Source monitor for the handoff'
      },
      to_monitor: {
        type: Sequelize.STRING(100),
        allowNull: false,
        comment: 'Target monitor for the handoff'
      },
      from_zone: {
        type: Sequelize.STRING(100),
        allowNull: true,
        comment: 'Source zone for the handoff'
      },
      to_zone: {
        type: Sequelize.STRING(100),
        allowNull: true,
        comment: 'Target zone for the handoff'
      },
      handoff_status: {
        type: Sequelize.ENUM('initiated', 'in_progress', 'successful', 'failed', 'timeout'),
        allowNull: false,
        defaultValue: 'initiated',
        comment: 'Status of the handoff operation'
      },
      handoff_latency_ms: {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: 'Time taken for handoff in milliseconds'
      },
      confidence_score: {
        type: Sequelize.DECIMAL(3, 2),
        allowNull: false,
        comment: 'Confidence score for the handoff correlation'
      },
      correlation_factors: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'JSON of factors that contributed to successful correlation'
      },
      handoff_reason: {
        type: Sequelize.ENUM('automatic', 'predicted_movement', 'manual', 'escalation'),
        allowNull: false,
        defaultValue: 'automatic',
        comment: 'Reason for initiating the handoff'
      },
      success_metrics: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'JSON of success metrics and performance data'
      },
      error_details: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Error details if handoff failed'
      },
      initiated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        comment: 'When handoff was initiated'
      },
      completed_at: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'When handoff was completed (success or failure)'
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    }, {
      comment: 'Audit log for cross-monitor threat handoff operations'
    });

    // Add indexes for optimal performance
    
    // Monitor relationships indexes
    await queryInterface.addIndex('monitor_relationships', ['monitor_a', 'monitor_b'], {
      name: 'idx_monitor_relationships_pair',
      unique: true
    });
    
    await queryInterface.addIndex('monitor_relationships', ['spatial_relationship'], {
      name: 'idx_monitor_relationships_spatial'
    });
    
    await queryInterface.addIndex('monitor_relationships', ['is_active'], {
      name: 'idx_monitor_relationships_active'
    });

    // Cross-monitor threats indexes
    await queryInterface.addIndex('cross_monitor_threats', ['monitor_id'], {
      name: 'idx_cross_monitor_threats_monitor'
    });
    
    await queryInterface.addIndex('cross_monitor_threats', ['zone_id'], {
      name: 'idx_cross_monitor_threats_zone'
    });
    
    await queryInterface.addIndex('cross_monitor_threats', ['threat_type'], {
      name: 'idx_cross_monitor_threats_type'
    });
    
    await queryInterface.addIndex('cross_monitor_threats', ['threat_level'], {
      name: 'idx_cross_monitor_threats_level'
    });
    
    await queryInterface.addIndex('cross_monitor_threats', ['last_seen'], {
      name: 'idx_cross_monitor_threats_last_seen'
    });
    
    await queryInterface.addIndex('cross_monitor_threats', ['is_active'], {
      name: 'idx_cross_monitor_threats_active'
    });
    
    await queryInterface.addIndex('cross_monitor_threats', ['created_at'], {
      name: 'idx_cross_monitor_threats_created'
    });

    // Threat correlations indexes
    await queryInterface.addIndex('threat_correlations', ['primary_threat_id'], {
      name: 'idx_threat_correlations_primary'
    });
    
    await queryInterface.addIndex('threat_correlations', ['correlation_status'], {
      name: 'idx_threat_correlations_status'
    });
    
    await queryInterface.addIndex('threat_correlations', ['confidence_score'], {
      name: 'idx_threat_correlations_confidence'
    });
    
    await queryInterface.addIndex('threat_correlations', ['last_updated'], {
      name: 'idx_threat_correlations_updated'
    });
    
    await queryInterface.addIndex('threat_correlations', ['expires_at'], {
      name: 'idx_threat_correlations_expires'
    });

    // Threat handoff log indexes
    await queryInterface.addIndex('threat_handoff_log', ['correlation_id'], {
      name: 'idx_threat_handoff_log_correlation'
    });
    
    await queryInterface.addIndex('threat_handoff_log', ['threat_id'], {
      name: 'idx_threat_handoff_log_threat'
    });
    
    await queryInterface.addIndex('threat_handoff_log', ['from_monitor', 'to_monitor'], {
      name: 'idx_threat_handoff_log_monitors'
    });
    
    await queryInterface.addIndex('threat_handoff_log', ['handoff_status'], {
      name: 'idx_threat_handoff_log_status'
    });
    
    await queryInterface.addIndex('threat_handoff_log', ['handoff_latency_ms'], {
      name: 'idx_threat_handoff_log_latency'
    });
    
    await queryInterface.addIndex('threat_handoff_log', ['initiated_at'], {
      name: 'idx_threat_handoff_log_initiated'
    });
    
    await queryInterface.addIndex('threat_handoff_log', ['completed_at'], {
      name: 'idx_threat_handoff_log_completed'
    });

    // Add foreign key-like constraints (referenced tables may not exist yet)
    // These will help maintain data integrity for cross-monitor relationships
    
    console.log('✅ Multi-monitor threat correlation tables created successfully');
    console.log('📊 Created 4 tables: monitor_relationships, cross_monitor_threats, threat_correlations, threat_handoff_log');
    console.log('🔍 Added 20+ optimized indexes for high-performance correlation queries');
  },

  async down(queryInterface, Sequelize) {
    // Drop tables in reverse order to handle any dependencies
    await queryInterface.dropTable('threat_handoff_log');
    await queryInterface.dropTable('threat_correlations');
    await queryInterface.dropTable('cross_monitor_threats');
    await queryInterface.dropTable('monitor_relationships');
    
    console.log('🧹 Multi-monitor threat correlation tables dropped');
  }
};