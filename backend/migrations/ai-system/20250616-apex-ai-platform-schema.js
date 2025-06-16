/**
 * APEX AI PLATFORM - DATABASE SCHEMA MIGRATION
 * =============================================
 * Master Prompt v29.4-APEX Implementation
 * 
 * Creates all database tables for Proactive Intelligence system:
 * - AI Alerts with Dynamic Risk Scoring
 * - Threat Vector Analysis
 * - Enhanced Guard Dispatch
 * - Camera Control & Monitoring
 * - Notifications & Security Events
 * - Route Optimization
 * - Executive Intelligence Briefings
 */

'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // ========================================
    // AI ALERTS & PROACTIVE INTELLIGENCE
    // ========================================

    // Enhanced AI Alerts with risk scoring and threat analysis
    await queryInterface.createTable('ai_alerts_log', {
      alert_id: {
        type: Sequelize.STRING(50),
        primaryKey: true,
        allowNull: false
      },
      timestamp: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      camera_id: {
        type: Sequelize.STRING(50),
        allowNull: false,
        references: {
          model: 'cameras',
          key: 'camera_id'
        }
      },
      alert_type: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      priority: {
        type: Sequelize.ENUM('low', 'medium', 'high', 'critical'),
        allowNull: false,
        defaultValue: 'medium'
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      detection_details: {
        type: Sequelize.JSONB,
        allowNull: false,
        comment: 'Original detection data from AI model'
      },
      risk_analysis: {
        type: Sequelize.JSONB,
        allowNull: true,
        comment: 'Dynamic risk scoring analysis'
      },
      ai_copilot_actions: {
        type: Sequelize.JSONB,
        allowNull: true,
        comment: 'AI-generated next best action recommendations'
      },
      threat_vector_id: {
        type: Sequelize.STRING(50),
        allowNull: true,
        references: {
          model: 'threat_vectors',
          key: 'vector_id'
        }
      },
      status: {
        type: Sequelize.ENUM('pending', 'acknowledged', 'dispatched', 'resolved', 'false_positive'),
        allowNull: false,
        defaultValue: 'pending'
      },
      acknowledged_by: {
        type: Sequelize.STRING(50),
        allowNull: true
      },
      acknowledged_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      assigned_guard: {
        type: Sequelize.STRING(50),
        allowNull: true,
        references: {
          model: 'guards',
          key: 'guard_id'
        }
      },
      operator_metadata: {
        type: Sequelize.JSONB,
        allowNull: true,
        comment: 'Operator station, browser info, etc.'
      },
      resolution_time: {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: 'Time to resolution in seconds'
      },
      false_positive_reason: {
        type: Sequelize.TEXT,
        allowNull: true
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
    });

    // Threat Vector Analysis table
    await queryInterface.createTable('threat_vectors', {
      vector_id: {
        type: Sequelize.STRING(50),
        primaryKey: true,
        allowNull: false
      },
      data: {
        type: Sequelize.JSONB,
        allowNull: false,
        comment: 'Correlated alert data and pattern analysis'
      },
      pattern_type: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      escalation_factor: {
        type: Sequelize.DECIMAL(3, 2),
        allowNull: true
      },
      status: {
        type: Sequelize.ENUM('active', 'resolved', 'false_positive'),
        allowNull: false,
        defaultValue: 'active'
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
    });

    // ========================================
    // CAMERA SYSTEM & CONTROL
    // ========================================

    // Enhanced cameras table with AI capabilities
    await queryInterface.createTable('cameras', {
      camera_id: {
        type: Sequelize.STRING(50),
        primaryKey: true,
        allowNull: false
      },
      name: {
        type: Sequelize.STRING(200),
        allowNull: false
      },
      location: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      rtsp_url: {
        type: Sequelize.STRING(500),
        allowNull: true
      },
      control_url: {
        type: Sequelize.STRING(500),
        allowNull: true,
        comment: 'URL for PTZ and camera control commands'
      },
      status: {
        type: Sequelize.ENUM('online', 'offline', 'error', 'maintenance'),
        allowNull: false,
        defaultValue: 'offline'
      },
      capabilities: {
        type: Sequelize.JSONB,
        allowNull: true,
        comment: 'PTZ, audio, AI features supported by camera'
      },
      ai_enabled: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },
      resolution: {
        type: Sequelize.STRING(20),
        allowNull: true
      },
      frame_rate: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      night_vision: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      last_maintenance: {
        type: Sequelize.DATE,
        allowNull: true
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
    });

    // Camera zones with risk scoring parameters
    await queryInterface.createTable('camera_zones', {
      zone_id: {
        type: Sequelize.STRING(50),
        primaryKey: true,
        allowNull: false
      },
      camera_id: {
        type: Sequelize.STRING(50),
        allowNull: false,
        references: {
          model: 'cameras',
          key: 'camera_id'
        }
      },
      zone_name: {
        type: Sequelize.STRING(200),
        allowNull: false
      },
      latitude: {
        type: Sequelize.DECIMAL(10, 8),
        allowNull: true
      },
      longitude: {
        type: Sequelize.DECIMAL(11, 8),
        allowNull: true
      },
      sensitivity_level: {
        type: Sequelize.ENUM('public', 'restricted', 'high_security', 'critical_infrastructure'),
        allowNull: false,
        defaultValue: 'public'
      },
      risk_multiplier: {
        type: Sequelize.DECIMAL(3, 2),
        allowNull: false,
        defaultValue: 1.0,
        comment: 'Multiplier for dynamic risk scoring'
      },
      time_sensitivity_map: {
        type: Sequelize.JSONB,
        allowNull: true,
        comment: 'Hour-based risk multipliers'
      },
      boundary_coordinates: {
        type: Sequelize.JSONB,
        allowNull: true,
        comment: 'Polygon coordinates for zone boundaries'
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
    });

    // Camera command logging
    await queryInterface.createTable('camera_command_log', {
      command_id: {
        type: Sequelize.UUID,
        primaryKey: true,
        defaultValue: Sequelize.UUIDV4
      },
      camera_id: {
        type: Sequelize.STRING(50),
        allowNull: false,
        references: {
          model: 'cameras',
          key: 'camera_id'
        }
      },
      command: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      parameters: {
        type: Sequelize.JSONB,
        allowNull: true
      },
      response: {
        type: Sequelize.JSONB,
        allowNull: true
      },
      status: {
        type: Sequelize.ENUM('sent', 'executed', 'failed', 'timeout'),
        allowNull: false,
        defaultValue: 'sent'
      },
      timestamp: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      }
    });

    // Camera audio/voice interventions log
    await queryInterface.createTable('camera_audio_log', {
      audio_id: {
        type: Sequelize.UUID,
        primaryKey: true,
        defaultValue: Sequelize.UUIDV4
      },
      camera_id: {
        type: Sequelize.STRING(50),
        allowNull: false,
        references: {
          model: 'cameras',
          key: 'camera_id'
        }
      },
      audio_type: {
        type: Sequelize.ENUM('speaker_playback', 'voice_warning', 'deterrent'),
        allowNull: false
      },
      parameters: {
        type: Sequelize.JSONB,
        allowNull: true
      },
      text_content: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      timestamp: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      }
    });

    // Enhanced monitoring sessions
    await queryInterface.createTable('camera_monitoring_log', {
      monitoring_id: {
        type: Sequelize.UUID,
        primaryKey: true,
        defaultValue: Sequelize.UUIDV4
      },
      camera_id: {
        type: Sequelize.STRING(50),
        allowNull: false,
        references: {
          model: 'cameras',
          key: 'camera_id'
        }
      },
      monitoring_type: {
        type: Sequelize.ENUM('standard', 'enhanced', 'emergency'),
        allowNull: false,
        defaultValue: 'standard'
      },
      detection_context: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      activated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      deactivated_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      duration_minutes: {
        type: Sequelize.INTEGER,
        allowNull: true
      }
    });

    // ========================================
    // GUARD MANAGEMENT & DISPATCH
    // ========================================

    // Enhanced guards table
    await queryInterface.createTable('guards', {
      guard_id: {
        type: Sequelize.STRING(50),
        primaryKey: true,
        allowNull: false
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        }
      },
      name: {
        type: Sequelize.STRING(200),
        allowNull: false
      },
      phone_number: {
        type: Sequelize.STRING(20),
        allowNull: true
      },
      email: {
        type: Sequelize.STRING(200),
        allowNull: true
      },
      status: {
        type: Sequelize.ENUM('on_duty', 'off_duty', 'break', 'responding', 'available'),
        allowNull: false,
        defaultValue: 'off_duty'
      },
      assigned_zone: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      experience_level: {
        type: Sequelize.ENUM('junior', 'standard', 'senior', 'supervisor'),
        allowNull: false,
        defaultValue: 'standard'
      },
      skills: {
        type: Sequelize.JSONB,
        allowNull: true,
        comment: 'Special skills and certifications'
      },
      last_known_latitude: {
        type: Sequelize.DECIMAL(10, 8),
        allowNull: true
      },
      last_known_longitude: {
        type: Sequelize.DECIMAL(11, 8),
        allowNull: true
      },
      last_location_update: {
        type: Sequelize.DATE,
        allowNull: true
      },
      last_check_in: {
        type: Sequelize.DATE,
        allowNull: true
      },
      active_alerts: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      last_dispatch: {
        type: Sequelize.DATE,
        allowNull: true
      },
      performance_rating: {
        type: Sequelize.DECIMAL(3, 2),
        allowNull: true,
        comment: 'Performance rating 1.0-5.0'
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
    });

    // Guard dispatch system
    await queryInterface.createTable('guard_dispatches', {
      dispatch_id: {
        type: Sequelize.STRING(50),
        primaryKey: true,
        allowNull: false
      },
      alert_id: {
        type: Sequelize.STRING(50),
        allowNull: false,
        references: {
          model: 'ai_alerts_log',
          key: 'alert_id'
        }
      },
      guard_id: {
        type: Sequelize.STRING(50),
        allowNull: false,
        references: {
          model: 'guards',
          key: 'guard_id'
        }
      },
      priority: {
        type: Sequelize.ENUM('normal', 'urgent', 'emergency', 'backup'),
        allowNull: false,
        defaultValue: 'normal'
      },
      status: {
        type: Sequelize.ENUM('dispatched', 'en_route', 'on_scene', 'completed', 'cancelled'),
        allowNull: false,
        defaultValue: 'dispatched'
      },
      estimated_arrival: {
        type: Sequelize.DATE,
        allowNull: true
      },
      actual_arrival: {
        type: Sequelize.DATE,
        allowNull: true
      },
      completion_time: {
        type: Sequelize.DATE,
        allowNull: true
      },
      route_data: {
        type: Sequelize.JSONB,
        allowNull: true,
        comment: 'Route optimization and GPS data'
      },
      guard_location: {
        type: Sequelize.JSONB,
        allowNull: true,
        comment: 'Real-time guard location updates'
      },
      special_instructions: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      backup_required: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      backup_for_dispatch: {
        type: Sequelize.STRING(50),
        allowNull: true,
        references: {
          model: 'guard_dispatches',
          key: 'dispatch_id'
        }
      },
      status_notes: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      created_by: {
        type: Sequelize.STRING(50),
        allowNull: true
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
    });

    // Guard devices for push notifications
    await queryInterface.createTable('guard_devices', {
      device_id: {
        type: Sequelize.UUID,
        primaryKey: true,
        defaultValue: Sequelize.UUIDV4
      },
      guard_id: {
        type: Sequelize.STRING(50),
        allowNull: false,
        references: {
          model: 'guards',
          key: 'guard_id'
        }
      },
      device_tokens: {
        type: Sequelize.JSONB,
        allowNull: true,
        comment: 'FCM/APNs device tokens for push notifications'
      },
      device_type: {
        type: Sequelize.ENUM('ios', 'android', 'web'),
        allowNull: false
      },
      device_info: {
        type: Sequelize.JSONB,
        allowNull: true
      },
      notification_preferences: {
        type: Sequelize.JSONB,
        allowNull: true
      },
      last_active: {
        type: Sequelize.DATE,
        allowNull: true
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
    });

    // ========================================
    // NOTIFICATIONS & COMMUNICATIONS
    // ========================================

    // Guard notifications
    await queryInterface.createTable('guard_notifications', {
      notification_id: {
        type: Sequelize.STRING(50),
        primaryKey: true,
        allowNull: false
      },
      guard_id: {
        type: Sequelize.STRING(50),
        allowNull: false,
        references: {
          model: 'guards',
          key: 'guard_id'
        }
      },
      type: {
        type: Sequelize.ENUM('dispatch', 'emergency', 'backup', 'shift_reminder', 'incident_update', 'system_alert'),
        allowNull: false
      },
      title: {
        type: Sequelize.STRING(200),
        allowNull: false
      },
      message: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      data: {
        type: Sequelize.JSONB,
        allowNull: true,
        comment: 'Additional notification data and read status'
      },
      priority: {
        type: Sequelize.ENUM('low', 'normal', 'high', 'emergency'),
        allowNull: false,
        defaultValue: 'normal'
      },
      delivery_status: {
        type: Sequelize.JSONB,
        allowNull: true,
        comment: 'Delivery status for different channels (push, sms, etc.)'
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
    });

    // Security events audit log
    await queryInterface.createTable('security_events', {
      event_id: {
        type: Sequelize.STRING(50),
        primaryKey: true,
        allowNull: false
      },
      event_type: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      event_data: {
        type: Sequelize.JSONB,
        allowNull: false
      },
      user_id: {
        type: Sequelize.STRING(50),
        allowNull: true
      },
      guard_id: {
        type: Sequelize.STRING(50),
        allowNull: true,
        references: {
          model: 'guards',
          key: 'guard_id'
        }
      },
      ip_address: {
        type: Sequelize.INET,
        allowNull: true
      },
      user_agent: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      severity: {
        type: Sequelize.ENUM('low', 'medium', 'high', 'critical'),
        allowNull: false,
        defaultValue: 'medium'
      },
      timestamp: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      }
    });

    // ========================================
    // ROUTE OPTIMIZATION & GPS
    // ========================================

    // Route calculations and optimization
    await queryInterface.createTable('route_calculations', {
      route_id: {
        type: Sequelize.STRING(50),
        primaryKey: true,
        allowNull: false
      },
      origin: {
        type: Sequelize.JSONB,
        allowNull: false,
        comment: 'Origin coordinates and location info'
      },
      destination: {
        type: Sequelize.JSONB,
        allowNull: false,
        comment: 'Destination coordinates and location info'
      },
      route_data: {
        type: Sequelize.JSONB,
        allowNull: false,
        comment: 'Complete route calculation results'
      },
      alert_id: {
        type: Sequelize.STRING(50),
        allowNull: true,
        references: {
          model: 'ai_alerts_log',
          key: 'alert_id'
        }
      },
      route_type: {
        type: Sequelize.ENUM('direct', 'optimized', 'emergency'),
        allowNull: false,
        defaultValue: 'optimized'
      },
      calculated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      }
    });

    // ========================================
    // AI SERVICES & INTELLIGENCE
    // ========================================

    // AI TTS (Text-to-Speech) log
    await queryInterface.createTable('ai_tts_log', {
      tts_id: {
        type: Sequelize.UUID,
        primaryKey: true,
        defaultValue: Sequelize.UUIDV4
      },
      text: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      voice_type: {
        type: Sequelize.ENUM('warning', 'instruction', 'deterrent', 'emergency'),
        allowNull: false
      },
      language: {
        type: Sequelize.STRING(10),
        allowNull: false,
        defaultValue: 'en-US'
      },
      context: {
        type: Sequelize.JSONB,
        allowNull: true,
        comment: 'Detection context that triggered TTS'
      },
      audio_file_path: {
        type: Sequelize.STRING(500),
        allowNull: true
      },
      generated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      }
    });

    // Executive intelligence briefings
    await queryInterface.createTable('executive_briefings', {
      briefing_id: {
        type: Sequelize.STRING(50),
        primaryKey: true,
        allowNull: false
      },
      time_period: {
        type: Sequelize.STRING(20),
        allowNull: false
      },
      briefing_data: {
        type: Sequelize.JSONB,
        allowNull: false,
        comment: 'Complete briefing with metrics and analysis'
      },
      recipient_emails: {
        type: Sequelize.JSONB,
        allowNull: true,
        comment: 'Email addresses of briefing recipients'
      },
      sent_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      generated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      }
    });

    // Camera presets for PTZ positions
    await queryInterface.createTable('camera_presets', {
      preset_id: {
        type: Sequelize.STRING(50),
        primaryKey: true,
        allowNull: false
      },
      camera_id: {
        type: Sequelize.STRING(50),
        allowNull: false,
        references: {
          model: 'cameras',
          key: 'camera_id'
        }
      },
      preset_name: {
        type: Sequelize.STRING(200),
        allowNull: false
      },
      position_data: {
        type: Sequelize.JSONB,
        allowNull: true,
        comment: 'PTZ position coordinates'
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      }
    });

    // ========================================
    // INDEXES FOR PERFORMANCE
    // ========================================

    // AI Alerts indexes
    await queryInterface.addIndex('ai_alerts_log', ['timestamp', 'priority']);
    await queryInterface.addIndex('ai_alerts_log', ['camera_id', 'status']);
    await queryInterface.addIndex('ai_alerts_log', ['status', 'acknowledged_at']);
    await queryInterface.addIndex('ai_alerts_log', ['threat_vector_id']);

    // Guard dispatch indexes
    await queryInterface.addIndex('guard_dispatches', ['alert_id']);
    await queryInterface.addIndex('guard_dispatches', ['guard_id', 'status']);
    await queryInterface.addIndex('guard_dispatches', ['created_at', 'priority']);

    // Security events indexes
    await queryInterface.addIndex('security_events', ['timestamp', 'severity']);
    await queryInterface.addIndex('security_events', ['event_type', 'timestamp']);

    // Notifications indexes
    await queryInterface.addIndex('guard_notifications', ['guard_id', 'created_at']);
    await queryInterface.addIndex('guard_notifications', ['type', 'priority']);

    // Camera command log indexes
    await queryInterface.addIndex('camera_command_log', ['camera_id', 'timestamp']);
    await queryInterface.addIndex('camera_command_log', ['command', 'status']);

    console.log('✅ APEX AI Platform database schema created successfully!');
    console.log('🚀 Proactive Intelligence system ready for deployment.');
  },

  down: async (queryInterface, Sequelize) => {
    // Drop all tables in reverse order to handle foreign key constraints
    const tablesToDrop = [
      'camera_presets',
      'executive_briefings',
      'ai_tts_log',
      'route_calculations',
      'security_events',
      'guard_notifications',
      'guard_devices',
      'guard_dispatches',
      'guards',
      'camera_monitoring_log',
      'camera_audio_log',
      'camera_command_log',
      'camera_zones',
      'cameras',
      'threat_vectors',
      'ai_alerts_log'
    ];

    for (const table of tablesToDrop) {
      try {
        await queryInterface.dropTable(table);
        console.log(`Dropped table: ${table}`);
      } catch (error) {
        console.warn(`Warning: Could not drop table ${table}:`, error.message);
      }
    }
  }
};