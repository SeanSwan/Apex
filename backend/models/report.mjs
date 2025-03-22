/**
 * Report Model
 * 
 * Represents comprehensive security reports generated in the security operations management system.
 * This model includes fields for report content, approval workflow, media attachments,
 * templating, version control, and delivery tracking.
 * 
 * @module models/Report
 */

import { Model, DataTypes } from 'sequelize';
import { sanitizeHtml } from '../utils/sanitizers.mjs';
import { generateReportNumber } from '../utils/generators.mjs';

class Report extends Model {
  /**
   * Initialize the Report model with schema definition and configuration
   * @param {Sequelize} sequelize - Sequelize instance
   * @returns {Model} Initialized Report model
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
      
      // Foreign keys - Property and Creator
      property_id: {
        type: DataTypes.UUID,
        allowNull: false,
        validate: {
          isUUID: 4,
          notNull: { msg: 'Property ID is required' }
        }
      },
      created_by: {
        type: DataTypes.UUID,
        allowNull: false,
        validate: {
          isUUID: 4,
          notNull: { msg: 'Creator ID is required' }
        }
      },
      
      // Basic report information
      report_number: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: false,
        validate: {
          notEmpty: { msg: 'Report number cannot be empty' }
        }
      },
      title: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notEmpty: { msg: 'Report title cannot be empty' },
          len: [2, 255]
        },
        set(value) {
          this.setDataValue('title', sanitizeHtml(value));
        }
      },
      report_type: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notEmpty: { msg: 'Report type is required' },
          isIn: {
            args: [['incident', 'patrol', 'monthly', 'quarterly', 'annual', 'audit', 'assessment', 'custom']],
            msg: 'Invalid report type'
          }
        }
      },
      report_subtype: {
        type: DataTypes.STRING,
        validate: {
          len: [0, 100]
        },
        set(value) {
          this.setDataValue('report_subtype', sanitizeHtml(value));
        }
      },
      date_range_start: {
        type: DataTypes.DATEONLY,
        validate: {
          isDate: true
        }
      },
      date_range_end: {
        type: DataTypes.DATEONLY,
        validate: {
          isDate: true,
          isAfterStartDate(value) {
            if (this.date_range_start && value && new Date(value) < new Date(this.date_range_start)) {
              throw new Error('End date must be after start date');
            }
          }
        }
      },
      
      // Content fields
      summary: {
        type: DataTypes.TEXT,
        set(value) {
          this.setDataValue('summary', sanitizeHtml(value));
        }
      },
      content: {
        type: DataTypes.TEXT,
        allowNull: false,
        validate: {
          notEmpty: { msg: 'Report content cannot be empty' }
        },
        set(value) {
          this.setDataValue('content', sanitizeHtml(value));
        }
      },
      content_json: {
        type: DataTypes.JSONB,
        defaultValue: {},
        validate: {
          isValidJson(value) {
            if (value && typeof value === 'object') {
              try {
                // Ensure the structure is as expected
                if (!value.sections || !Array.isArray(value.sections)) {
                  throw new Error('Content JSON must include sections array');
                }
              } catch (error) {
                throw new Error(`Invalid content JSON structure: ${error.message}`);
              }
            }
          }
        }
      },
      findings: {
        type: DataTypes.TEXT,
        set(value) {
          this.setDataValue('findings', sanitizeHtml(value));
        }
      },
      recommendations: {
        type: DataTypes.TEXT,
        set(value) {
          this.setDataValue('recommendations', sanitizeHtml(value));
        }
      },
      conclusion: {
        type: DataTypes.TEXT,
        set(value) {
          this.setDataValue('conclusion', sanitizeHtml(value));
        }
      },
      
      // Incident-related fields
      incident_id: {
        type: DataTypes.UUID,
        validate: {
          isUUID: 4
        }
      },
      incident_count: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        validate: {
          isInt: true,
          min: 0
        }
      },
      related_incidents: {
        type: DataTypes.JSONB,
        defaultValue: [],
        validate: {
          isArray(value) {
            if (!Array.isArray(value)) {
              throw new Error('Related incidents must be an array');
            }
          }
        }
      },
      
      // Patrol-related fields
      patrol_id: {
        type: DataTypes.UUID,
        validate: {
          isUUID: 4
        }
      },
      patrol_count: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        validate: {
          isInt: true,
          min: 0
        }
      },
      related_patrols: {
        type: DataTypes.JSONB,
        defaultValue: [],
        validate: {
          isArray(value) {
            if (!Array.isArray(value)) {
              throw new Error('Related patrols must be an array');
            }
          }
        }
      },
      
      // Media and attachments
      photos: {
        type: DataTypes.JSONB,
        defaultValue: [],
        validate: {
          isValidMediaArray(value) {
            if (!Array.isArray(value)) {
              throw new Error('Photos must be an array');
            }
            
            value.forEach((photo, index) => {
              if (!photo.url || typeof photo.url !== 'string') {
                throw new Error(`Photo at index ${index} must have a valid URL`);
              }
            });
          }
        }
      },
      videos: {
        type: DataTypes.JSONB,
        defaultValue: [],
        validate: {
          isValidMediaArray(value) {
            if (!Array.isArray(value)) {
              throw new Error('Videos must be an array');
            }
            
            value.forEach((video, index) => {
              if (!video.url || typeof video.url !== 'string') {
                throw new Error(`Video at index ${index} must have a valid URL`);
              }
            });
          }
        }
      },
      documents: {
        type: DataTypes.JSONB,
        defaultValue: [],
        validate: {
          isValidMediaArray(value) {
            if (!Array.isArray(value)) {
              throw new Error('Documents must be an array');
            }
            
            value.forEach((doc, index) => {
              if (!doc.url || typeof doc.url !== 'string') {
                throw new Error(`Document at index ${index} must have a valid URL`);
              }
              if (!doc.name || typeof doc.name !== 'string') {
                throw new Error(`Document at index ${index} must have a name`);
              }
            });
          }
        }
      },
      attachments: {
        type: DataTypes.JSONB,
        defaultValue: [],
        validate: {
          isValidMediaArray(value) {
            if (!Array.isArray(value)) {
              throw new Error('Attachments must be an array');
            }
            
            value.forEach((attachment, index) => {
              if (!attachment.url || typeof attachment.url !== 'string') {
                throw new Error(`Attachment at index ${index} must have a valid URL`);
              }
              if (!attachment.type || typeof attachment.type !== 'string') {
                throw new Error(`Attachment at index ${index} must have a type`);
              }
            });
          }
        }
      },
      
      // Statistics and metrics
      metrics: {
        type: DataTypes.JSONB,
        defaultValue: {}
      },
      charts: {
        type: DataTypes.JSONB,
        defaultValue: []
      },
      tables: {
        type: DataTypes.JSONB,
        defaultValue: []
      },
      
      // Template and formatting
      template_id: {
        type: DataTypes.UUID,
        validate: {
          isUUID: 4
        }
      },
      custom_css: {
        type: DataTypes.TEXT,
        set(value) {
          // Simple sanitization for CSS
          if (value) {
            const sanitized = value.replace(/<\/?script/gi, '');
            this.setDataValue('custom_css', sanitized);
          }
        }
      },
      theme: {
        type: DataTypes.STRING,
        defaultValue: 'standard',
        validate: {
          isIn: {
            args: [['standard', 'dark', 'light', 'client', 'custom']],
            msg: 'Invalid theme selection'
          }
        }
      },
      
      // Approval workflow
      approval_status: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'draft',
        validate: {
          isIn: {
            args: [['draft', 'pending_approval', 'changes_requested', 'approved', 'rejected']],
            msg: 'Invalid approval status'
          }
        }
      },
      approval_notes: {
        type: DataTypes.TEXT,
        set(value) {
          this.setDataValue('approval_notes', sanitizeHtml(value));
        }
      },
      approved_by: {
        type: DataTypes.UUID,
        validate: {
          isUUID: 4
        }
      },
      approved_at: {
        type: DataTypes.DATE,
        validate: {
          isDate: true
        }
      },
      
      // Publication status
      is_published: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      },
      published_at: {
        type: DataTypes.DATE,
        validate: {
          isDate: true
        }
      },
      published_by: {
        type: DataTypes.UUID,
        validate: {
          isUUID: 4
        }
      },
      expiration_date: {
        type: DataTypes.DATEONLY,
        validate: {
          isDate: true,
          isFutureDate(value) {
            if (value && new Date(value) <= new Date()) {
              throw new Error('Expiration date must be in the future');
            }
          }
        }
      },
      
      // Client visibility and delivery
      client_visible: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
      },
      client_id: {
        type: DataTypes.UUID,
        validate: {
          isUUID: 4
        }
      },
      delivery_status: {
        type: DataTypes.STRING,
        defaultValue: 'pending',
        validate: {
          isIn: {
            args: [['pending', 'sent', 'delivered', 'failed', 'scheduled']],
            msg: 'Invalid delivery status'
          }
        }
      },
      delivery_method: {
        type: DataTypes.STRING,
        validate: {
          isIn: {
            args: [['email', 'portal', 'api', 'download', 'print', null]],
            msg: 'Invalid delivery method'
          }
        }
      },
      delivery_recipients: {
        type: DataTypes.JSONB,
        defaultValue: [],
        validate: {
          isValidRecipientArray(value) {
            if (!Array.isArray(value)) {
              throw new Error('Delivery recipients must be an array');
            }
            
            value.forEach((recipient, index) => {
              if (!recipient.email || typeof recipient.email !== 'string') {
                throw new Error(`Recipient at index ${index} must have a valid email`);
              }
              if (!recipient.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
                throw new Error(`Invalid email for recipient at index ${index}`);
              }
            });
          }
        }
      },
      delivery_timestamp: {
        type: DataTypes.DATE,
        validate: {
          isDate: true
        }
      },
      
      // Access tracking
      view_count: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        validate: {
          isInt: true,
          min: 0
        }
      },
      last_viewed_at: {
        type: DataTypes.DATE,
        validate: {
          isDate: true
        }
      },
      download_count: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        validate: {
          isInt: true,
          min: 0
        }
      },
      
      // Version control
      version: {
        type: DataTypes.INTEGER,
        defaultValue: 1,
        validate: {
          isInt: true,
          min: 1
        }
      },
      previous_version_id: {
        type: DataTypes.UUID,
        validate: {
          isUUID: 4,
          notOwnId(value) {
            if (value === this.id) {
              throw new Error('Previous version cannot reference the report itself');
            }
          }
        }
      },
      revision_notes: {
        type: DataTypes.TEXT,
        set(value) {
          this.setDataValue('revision_notes', sanitizeHtml(value));
        }
      },
      
      // System fields
      status: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'active',
        validate: {
          isIn: {
            args: [['active', 'archived', 'deleted']],
            msg: 'Invalid status value'
          }
        }
      },
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
      modelName: 'Report',
      tableName: 'reports',
      timestamps: true,
      underscored: true,
      hooks: {
        // Generate report number before creation if not provided
        beforeCreate: async (report) => {
          if (!report.report_number) {
            report.report_number = await generateReportNumber(report.report_type);
          }
          
          // Set date range to current date if not provided
          const currentDate = new Date().toISOString().split('T')[0];
          if (!report.date_range_start) {
            report.date_range_start = currentDate;
          }
          if (!report.date_range_end) {
            report.date_range_end = currentDate;
          }
        },
        
        // Update timestamps automatically
        beforeUpdate: (report) => {
          report.updated_at = new Date();
        },
        
        // Handle approval workflow
        afterUpdate: async (report, options) => {
          // If report was just approved, set approval timestamp
          if (report.changed('approval_status') && report.approval_status === 'approved' && !report.approved_at) {
            await report.update({ 
              approved_at: new Date() 
            }, { 
              transaction: options.transaction 
            });
          }
          
          // If report was just published, set publication timestamp
          if (report.changed('is_published') && report.is_published && !report.published_at) {
            await report.update({ 
              published_at: new Date() 
            }, { 
              transaction: options.transaction 
            });
          }
        }
      },
      // Define custom default scopes for query optimization
      defaultScope: {
        where: {
          status: 'active'
        }
      },
      scopes: {
        // Include all reports regardless of status
        withDeleted: {
          where: {}
        },
        // Only published reports
        published: {
          where: {
            status: 'active',
            is_published: true
          }
        },
        // Only reports pending approval
        pendingApproval: {
          where: {
            status: 'active',
            approval_status: 'pending_approval'
          }
        },
        // Reports for a specific client
        forClient(clientId) {
          return {
            where: {
              status: 'active',
              is_published: true,
              client_visible: true,
              client_id: clientId
            }
          };
        }
      }
    });
    
    return Report;
  }
  
  /**
   * Define model associations
   * @param {Object} models - All models in the application
   */
  static associate(models) {
    // Property relationship
    this.belongsTo(models.Property, { 
      foreignKey: 'property_id', 
      as: 'property' 
    });
    
    // User relationships
    this.belongsTo(models.User, { 
      foreignKey: 'created_by', 
      as: 'creator' 
    });
    this.belongsTo(models.User, { 
      foreignKey: 'approved_by', 
      as: 'approver' 
    });
    this.belongsTo(models.User, { 
      foreignKey: 'published_by', 
      as: 'publisher' 
    });
    this.belongsTo(models.User, { 
      foreignKey: 'client_id', 
      as: 'client' 
    });
    
    // Incident relationship
    this.belongsTo(models.Incident, { 
      foreignKey: 'incident_id', 
      as: 'incident' 
    });
    
    // Patrol relationship
    this.belongsTo(models.Patrol, { 
      foreignKey: 'patrol_id', 
      as: 'patrol' 
    });
    
    // Report template relationship
    this.belongsTo(models.ReportTemplate, { 
      foreignKey: 'template_id', 
      as: 'template' 
    });
    
    // Version relationship (self-referential)
    this.belongsTo(this, { 
      foreignKey: 'previous_version_id', 
      as: 'previousVersion' 
    });
    this.hasMany(this, { 
      foreignKey: 'previous_version_id', 
      as: 'subsequentVersions' 
    });
    
    // Report access logs
    this.hasMany(models.ReportAccessLog, { 
      foreignKey: 'report_id', 
      as: 'accessLogs' 
    });
    
    // Report comments
    this.hasMany(models.ReportComment, { 
      foreignKey: 'report_id', 
      as: 'comments' 
    });
  }
  
  /**
   * Instance method to create a new version of the report
   * @param {Object} changes - Changes to apply to the new version
   * @param {String} notes - Revision notes
   * @param {UUID} userId - ID of user creating the new version
   * @returns {Promise<Report>} The newly created report version
   */
  async createNewVersion(changes, notes, userId) {
    const currentData = this.toJSON();
    
    // Remove fields that shouldn't be copied
    delete currentData.id;
    delete currentData.created_at;
    delete currentData.updated_at;
    delete currentData.previous_version_id;
    delete currentData.version;
    delete currentData.revision_notes;
    delete currentData.view_count;
    delete currentData.download_count;
    delete currentData.last_viewed_at;
    delete currentData.is_published;
    delete currentData.published_at;
    delete currentData.published_by;
    delete currentData.approval_status;
    delete currentData.approved_at;
    delete currentData.approved_by;
    delete currentData.delivery_status;
    delete currentData.delivery_timestamp;
    
    // Create new version with incremented version number
    const newVersionData = {
      ...currentData,
      ...changes,
      previous_version_id: this.id,
      version: this.version + 1,
      revision_notes: notes,
      created_by: userId,
      approval_status: 'draft',
      is_published: false
    };
    
    return this.sequelize.models.Report.create(newVersionData);
  }
  
  /**
   * Instance method to record a view event
   * @param {UUID} userId - ID of user viewing the report
   * @param {String} accessType - Type of access (view, download, etc)
   * @returns {Promise<void>}
   */
  async recordView(userId, accessType = 'view') {
    // Update view count and last viewed timestamp
    await this.update({
      view_count: this.view_count + 1,
      last_viewed_at: new Date()
    });
    
    // Create access log entry
    await this.sequelize.models.ReportAccessLog.create({
      report_id: this.id,
      user_id: userId,
      access_type: accessType,
      timestamp: new Date()
    });
  }
  
  /**
   * Instance method to record a download event
   * @param {UUID} userId - ID of user downloading the report
   * @returns {Promise<void>}
   */
  async recordDownload(userId) {
    // Update download count
    await this.update({
      download_count: this.download_count + 1
    });
    
    // Create access log entry
    await this.sequelize.models.ReportAccessLog.create({
      report_id: this.id,
      user_id: userId,
      access_type: 'download',
      timestamp: new Date()
    });
  }
  
  /**
   * Instance method to submit report for approval
   * @param {String} notes - Notes for the approval request
   * @returns {Promise<Report>} Updated report
   */
  async submitForApproval(notes) {
    return this.update({
      approval_status: 'pending_approval',
      approval_notes: notes
    });
  }
  
  /**
   * Instance method to approve a report
   * @param {UUID} approverId - ID of user approving the report
   * @param {String} notes - Approval notes
   * @returns {Promise<Report>} Updated report
   */
  async approve(approverId, notes = '') {
    return this.update({
      approval_status: 'approved',
      approved_by: approverId,
      approved_at: new Date(),
      approval_notes: notes
    });
  }
  
  /**
   * Instance method to request changes to a report
   * @param {UUID} reviewerId - ID of user requesting changes
   * @param {String} notes - Change request notes
   * @returns {Promise<Report>} Updated report
   */
  async requestChanges(reviewerId, notes) {
    if (!notes) {
      throw new Error('Notes are required when requesting changes');
    }
    
    return this.update({
      approval_status: 'changes_requested',
      approval_notes: notes
    });
  }
  
  /**
   * Instance method to publish a report
   * @param {UUID} publisherId - ID of user publishing the report
   * @param {Object} deliveryOptions - Options for delivery
   * @returns {Promise<Report>} Updated report
   */
  async publish(publisherId, deliveryOptions = {}) {
    if (this.approval_status !== 'approved') {
      throw new Error('Cannot publish a report that has not been approved');
    }
    
    const updates = {
      is_published: true,
      published_by: publisherId,
      published_at: new Date()
    };
    
    // Add delivery options if provided
    if (deliveryOptions.method) {
      updates.delivery_method = deliveryOptions.method;
    }
    if (deliveryOptions.recipients) {
      updates.delivery_recipients = deliveryOptions.recipients;
    }
    if (deliveryOptions.status) {
      updates.delivery_status = deliveryOptions.status;
    }
    
    return this.update(updates);
  }
  
  /**
   * Class method to find reports requiring attention
   * @param {UUID} [propertyId] - Optional property ID to filter by
   * @returns {Promise<Array<Report>>} Reports needing attention
   */
  static async findReportsNeedingAttention(propertyId = null) {
    const where = {
      status: 'active',
      approval_status: ['pending_approval', 'changes_requested']
    };
    
    if (propertyId) {
      where.property_id = propertyId;
    }
    
    return this.findAll({
      where,
      order: [['updated_at', 'DESC']]
    });
  }
  
  /**
   * Generate a formatted report for export
   * @param {String} format - Export format (pdf, html, docx)
   * @returns {Promise<Buffer>} Formatted report data
   */
  async generateFormattedReport(format = 'pdf') {
    // Implementation would connect to a report generator service
    // This is a placeholder for the actual implementation
    throw new Error('Report generation not implemented');
  }
  
  /**
   * Send the report to recipients
   * @param {Array} recipients - List of recipient email addresses
   * @param {String} method - Delivery method
   * @returns {Promise<Object>} Delivery result
   */
  async sendReport(recipients, method = 'email') {
    if (!this.is_published) {
      throw new Error('Cannot send an unpublished report');
    }
    
    // Implementation would connect to email or notification service
    // This is a placeholder for the actual implementation
    throw new Error('Report delivery not implemented');
  }
}

export default Report;