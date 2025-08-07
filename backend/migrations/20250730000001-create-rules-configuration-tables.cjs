/**
 * MIGRATION: CREATE GEOFENCING ZONES AND SECURITY RULES TABLES
 * ============================================================
 * Creates database tables for storing geofencing zones and dynamic security rules
 * Supports the APEX AI Rules Configuration system
 */

'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Create geofencing_zones table
    await queryInterface.createTable('geofencing_zones', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      zone_id: {
        type: Sequelize.STRING(100),
        allowNull: false,
        unique: true,
        comment: 'Unique identifier for the geofencing zone'
      },
      name: {
        type: Sequelize.STRING(255),
        allowNull: false,
        comment: 'Human-readable name for the zone'
      },
      polygon_points: {
        type: Sequelize.TEXT,
        allowNull: false,
        comment: 'JSON array of polygon coordinates [[x1,y1], [x2,y2], ...]'
      },
      zone_type: {
        type: Sequelize.ENUM('restricted', 'monitored', 'entry_exit', 'parking', 'perimeter', 'sensitive', 'public', 'emergency'),
        allowNull: false,
        defaultValue: 'monitored',
        comment: 'Type of zone for different security rules'
      },
      coordinate_system: {
        type: Sequelize.ENUM('normalized', 'pixel', 'camera_relative'),
        allowNull: false,
        defaultValue: 'normalized',
        comment: 'Coordinate system used for polygon points'
      },
      camera_id: {
        type: Sequelize.STRING(100),
        allowNull: true,
        comment: 'Associated camera identifier'
      },
      monitor_id: {
        type: Sequelize.STRING(100),
        allowNull: true,
        comment: 'Associated monitor identifier'
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        comment: 'Whether the zone is actively monitored'
      },
      confidence_threshold: {
        type: Sequelize.DECIMAL(3, 2),
        allowNull: false,
        defaultValue: 0.75,
        comment: 'Minimum confidence threshold for detections in this zone'
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Optional description of the zone'
      },
      metadata: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Additional metadata stored as JSON'
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
      comment: 'Stores geofencing zones for spatial threat detection'
    });

    // Create security_rules table
    await queryInterface.createTable('security_rules', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      rule_id: {
        type: Sequelize.STRING(100),
        allowNull: false,
        unique: true,
        comment: 'Unique identifier for the security rule'
      },
      name: {
        type: Sequelize.STRING(255),
        allowNull: false,
        comment: 'Human-readable name for the rule'
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Detailed description of what the rule does'
      },
      zone_ids: {
        type: Sequelize.TEXT,
        allowNull: false,
        comment: 'JSON array of zone IDs this rule applies to'
      },
      conditions: {
        type: Sequelize.TEXT,
        allowNull: false,
        comment: 'JSON array of conditions that must be met'
      },
      actions: {
        type: Sequelize.TEXT,
        allowNull: false,
        comment: 'JSON array of actions to take when rule is triggered'
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        comment: 'Whether the rule is currently active'
      },
      priority: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 5,
        comment: 'Rule priority (1-10, higher numbers = higher priority)'
      },
      confidence_threshold: {
        type: Sequelize.DECIMAL(3, 2),
        allowNull: false,
        defaultValue: 0.75,
        comment: 'Minimum confidence threshold for rule activation'
      },
      cooldown_period: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 60,
        comment: 'Minimum seconds between rule triggers'
      },
      max_triggers_per_hour: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
        comment: 'Maximum triggers per hour (0 = unlimited)'
      },
      rule_type: {
        type: Sequelize.ENUM('detection', 'behavioral', 'temporal', 'composite'),
        allowNull: false,
        defaultValue: 'detection',
        comment: 'Type of rule for categorization'
      },
      metadata: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Additional metadata stored as JSON'
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
      comment: 'Stores dynamic security rules for threat evaluation'
    });

    // Create rule_execution_log table for audit trail
    await queryInterface.createTable('rule_execution_log', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      rule_id: {
        type: Sequelize.STRING(100),
        allowNull: false,
        comment: 'ID of the rule that was executed'
      },
      zone_id: {
        type: Sequelize.STRING(100),
        allowNull: true,
        comment: 'Zone where the rule was triggered'
      },
      threat_data: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'JSON data of the threat that triggered the rule'
      },
      conditions_met: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'JSON array of which conditions were satisfied'
      },
      actions_executed: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'JSON array of actions that were executed'
      },
      execution_result: {
        type: Sequelize.ENUM('success', 'partial', 'failed'),
        allowNull: false,
        defaultValue: 'success',
        comment: 'Result of rule execution'
      },
      confidence_score: {
        type: Sequelize.DECIMAL(3, 2),
        allowNull: true,
        comment: 'Confidence score of the threat detection'
      },
      processing_time_ms: {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: 'Time taken to process the rule in milliseconds'
      },
      error_details: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Error details if execution failed'
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    }, {
      comment: 'Audit log for security rule executions'
    });

    // Add indexes for performance
    await queryInterface.addIndex('geofencing_zones', ['camera_id'], {
      name: 'idx_geofencing_zones_camera_id'
    });
    
    await queryInterface.addIndex('geofencing_zones', ['monitor_id'], {
      name: 'idx_geofencing_zones_monitor_id'
    });
    
    await queryInterface.addIndex('geofencing_zones', ['zone_type'], {
      name: 'idx_geofencing_zones_zone_type'
    });
    
    await queryInterface.addIndex('geofencing_zones', ['is_active'], {
      name: 'idx_geofencing_zones_is_active'
    });

    await queryInterface.addIndex('security_rules', ['is_active'], {
      name: 'idx_security_rules_is_active'
    });
    
    await queryInterface.addIndex('security_rules', ['priority'], {
      name: 'idx_security_rules_priority'
    });
    
    await queryInterface.addIndex('security_rules', ['rule_type'], {
      name: 'idx_security_rules_rule_type'
    });

    await queryInterface.addIndex('rule_execution_log', ['rule_id'], {
      name: 'idx_rule_execution_log_rule_id'
    });
    
    await queryInterface.addIndex('rule_execution_log', ['zone_id'], {
      name: 'idx_rule_execution_log_zone_id'
    });
    
    await queryInterface.addIndex('rule_execution_log', ['created_at'], {
      name: 'idx_rule_execution_log_created_at'
    });
  },

  async down(queryInterface, Sequelize) {
    // Drop tables in reverse order
    await queryInterface.dropTable('rule_execution_log');
    await queryInterface.dropTable('security_rules');
    await queryInterface.dropTable('geofencing_zones');
  }
};