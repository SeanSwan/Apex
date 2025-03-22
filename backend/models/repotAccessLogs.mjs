/**
 * Report Access Log Model
 * 
 * Tracks detailed information about access events related to reports,
 * including views, downloads, and other interactions. This model supports
 * security auditing, usage analytics, and report popularity tracking.
 * 
 * @module models/ReportAccessLog
 */

import { Model, DataTypes } from 'sequelize';

class ReportAccessLog extends Model {
  /**
   * Initialize the ReportAccessLog model with schema definition and configuration
   * @param {Sequelize} sequelize - Sequelize instance
   * @returns {Model} Initialized ReportAccessLog model
   */
  static init(sequelize) {
    super.init({
      // Primary key
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        validate: {
          isUUID: 4
        }
      },
      
      // Foreign keys
      report_id: {
        type: DataTypes.UUID,
        allowNull: false,
        validate: {
          isUUID: 4,
          notNull: { msg: 'Report ID is required' }
        }
      },
      user_id: {
        type: DataTypes.UUID,
        validate: {
          isUUID: 4
        }
      },
      
      // Access details
      access_type: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'view',
        validate: {
          notNull: { msg: 'Access type is required' },
          isIn: {
            args: [['view', 'download', 'print', 'share', 'export', 'edit', 'comment']],
            msg: 'Invalid access type'
          }
        }
      },
      access_timestamp: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
        validate: {
          isDate: true,
          notNull: { msg: 'Access timestamp is required' }
        }
      },
      
      // Client information
      ip_address: {
        type: DataTypes.STRING,
        validate: {
          isIP: true
        }
      },
      user_agent: {
        type: DataTypes.STRING
      },
      device_type: {
        type: DataTypes.STRING,
        validate: {
          isIn: {
            args: [['desktop', 'tablet', 'mobile', 'unknown', null]],
            msg: 'Invalid device type'
          }
        }
      },
      
      // Metrics
      access_duration_seconds: {
        type: DataTypes.INTEGER,
        validate: {
          isInt: true,
          min: 0
        }
      },
      
      // Additional metadata
      access_details: {
        type: DataTypes.JSONB,
        defaultValue: {},
        validate: {
          isObject(value) {
            if (value && typeof value !== 'object') {
              throw new Error('Access details must be an object');
            }
          }
        }
      },
      
      // Timestamps
      created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        validate: {
          isDate: true
        }
      },
      updated_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        validate: {
          isDate: true
        }
      }
    }, {
      sequelize,
      modelName: 'ReportAccessLog',
      tableName: 'report_access_logs',
      timestamps: true,
      underscored: true,
      hooks: {
        // Update timestamp automatically
        beforeUpdate: (log) => {
          log.updated_at = new Date();
        },
        
        // Enhance with device type detection if not provided
        beforeCreate: (log) => {
          if (!log.device_type && log.user_agent) {
            // Simple detection logic - could be made more sophisticated
            const ua = log.user_agent.toLowerCase();
            if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) {
              log.device_type = 'mobile';
            } else if (ua.includes('ipad') || ua.includes('tablet')) {
              log.device_type = 'tablet';
            } else {
              log.device_type = 'desktop';
            }
          } else if (!log.device_type) {
            log.device_type = 'unknown';
          }
        }
      },
      indexes: [
        {
          fields: ['report_id']
        },
        {
          fields: ['user_id']
        },
        {
          fields: ['access_type']
        },
        {
          fields: ['access_timestamp']
        },
        {
          fields: ['report_id', 'access_timestamp']
        }
      ]
    });
    
    return ReportAccessLog;
  }
  
  /**
   * Define model associations
   * @param {Object} models - All models in the application
   */
  static associate(models) {
    // Report relationship
    this.belongsTo(models.Report, { 
      foreignKey: 'report_id', 
      as: 'report' 
    });
    
    // User relationship
    this.belongsTo(models.User, { 
      foreignKey: 'user_id', 
      as: 'user' 
    });
  }
  
  /**
   * Class method to detect suspicious access patterns
   * @param {UUID} reportId - Report ID to check
   * @param {Number} threshold - Number of accesses to consider suspicious
   * @param {Number} timeWindowMinutes - Time window in minutes
   * @returns {Promise<Boolean>} Whether suspicious access was detected
   */
  static async detectSuspiciousAccess(reportId, threshold = 20, timeWindowMinutes = 10) {
    const timeWindow = new Date();
    timeWindow.setMinutes(timeWindow.getMinutes() - timeWindowMinutes);
    
    const accessCount = await this.count({
      where: {
        report_id: reportId,
        access_timestamp: {
          [this.sequelize.Op.gte]: timeWindow
        }
      }
    });
    
    return accessCount > threshold;
  }
  
  /**
   * Class method to find most active users for a given report
   * @param {UUID} reportId - Report ID to check
   * @param {Number} limit - Maximum number of users to return
   * @returns {Promise<Array>} Most active users and their access counts
   */
  static async findMostActiveUsers(reportId, limit = 5) {
    const result = await this.findAll({
      where: {
        report_id: reportId
      },
      attributes: [
        'user_id',
        [this.sequelize.fn('COUNT', this.sequelize.col('user_id')), 'access_count']
      ],
      include: [
        {
          model: this.sequelize.models.User,
          as: 'user',
          attributes: ['id', 'name', 'email']
        }
      ],
      group: ['user_id', 'user.id', 'user.name', 'user.email'],
      order: [
        [this.sequelize.fn('COUNT', this.sequelize.col('user_id')), 'DESC']
      ],
      limit
    });
    
    return result;
  }
  
  /**
   * Class method to get report access metrics by time period
   * @param {UUID} reportId - Report ID to analyze
   * @param {String} period - Time period (day, week, month)
   * @returns {Promise<Object>} Access metrics
   */
  static async getAccessMetrics(reportId, period = 'day') {
    let timeFormat;
    let startDate = new Date();
    
    // Determine SQL date format and time range based on period
    switch (period) {
      case 'hour':
        timeFormat = 'YYYY-MM-DD HH24';
        startDate.setHours(startDate.getHours() - 24);
        break;
      case 'day':
        timeFormat = 'YYYY-MM-DD';
        startDate.setDate(startDate.getDate() - 30);
        break;
      case 'week':
        timeFormat = 'YYYY-WW';
        startDate.setDate(startDate.getDate() - 90);
        break;
      case 'month':
        timeFormat = 'YYYY-MM';
        startDate.setMonth(startDate.getMonth() - 12);
        break;
      default:
        timeFormat = 'YYYY-MM-DD';
        startDate.setDate(startDate.getDate() - 30);
    }
    
    // PostgreSQL-specific query to group by time period
    const result = await this.sequelize.query(`
      SELECT 
        TO_CHAR(access_timestamp, '${timeFormat}') as time_period,
        COUNT(*) as view_count,
        COUNT(DISTINCT user_id) as unique_users,
        AVG(access_duration_seconds) as avg_duration
      FROM report_access_logs
      WHERE 
        report_id = :reportId
        AND access_timestamp >= :startDate
      GROUP BY time_period
      ORDER BY time_period
    `, {
      replacements: { reportId, startDate },
      type: this.sequelize.QueryTypes.SELECT
    });
    
    return result;
  }
  
  /**
   * Create method with IP address detection
   * @param {Object} data - Access log data
   * @param {Object} req - Express request object (optional)
   * @returns {Promise<ReportAccessLog>} Created access log
   */
  static async createFromRequest(data, req = null) {
    // If request object is provided, extract IP and user agent
    if (req) {
      // Get IP address with fallbacks for proxied requests
      const ip = req.headers['x-forwarded-for'] || 
                req.connection.remoteAddress || 
                req.socket.remoteAddress || 
                req.connection.socket?.remoteAddress;
                
      data.ip_address = ip;
      data.user_agent = req.headers['user-agent'] || null;
      
      // Capture additional request details if enabled
      if (process.env.ENHANCED_SECURITY_LOGGING === 'true') {
        data.access_details = {
          ...data.access_details,
          headers: req.headers,
          method: req.method,
          path: req.path,
          query: req.query,
          referrer: req.headers.referer || req.headers.referrer
        };
      }
    }
    
    return this.create(data);
  }
}

export default ReportAccessLog;