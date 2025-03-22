/**
 * Report Comment Model
 * 
 * Represents comments and feedback on security reports with threading capabilities.
 * Supports internal discussions, client feedback, and issue tracking with resolution status.
 * 
 * @module models/ReportComment
 */

import { Model, DataTypes } from 'sequelize';
import { sanitizeHtml } from '../utils/sanitizers.mjs';

class ReportComment extends Model {
  /**
   * Initialize the ReportComment model with schema definition and configuration
   * @param {Sequelize} sequelize - Sequelize instance
   * @returns {Model} Initialized ReportComment model
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
        allowNull: false,
        validate: {
          isUUID: 4,
          notNull: { msg: 'User ID is required' }
        }
      },
      parent_comment_id: {
        type: DataTypes.UUID,
        validate: {
          isUUID: 4
        }
      },
      
      // Comment content
      content: {
        type: DataTypes.TEXT,
        allowNull: false,
        validate: {
          notEmpty: { msg: 'Comment content cannot be empty' }
        },
        set(value) {
          this.setDataValue('content', sanitizeHtml(value));
        }
      },
      
      // Comment metadata
      comment_type: {
        type: DataTypes.STRING,
        defaultValue: 'comment',
        allowNull: false,
        validate: {
          notNull: { msg: 'Comment type is required' },
          isIn: {
            args: [['comment', 'feedback', 'issue', 'question', 'suggestion', 'approval', 'revision']],
            msg: 'Invalid comment type'
          }
        }
      },
      visibility: {
        type: DataTypes.STRING,
        defaultValue: 'all',
        allowNull: false,
        validate: {
          notNull: { msg: 'Visibility is required' },
          isIn: {
            args: [['all', 'internal', 'client', 'manager']],
            msg: 'Invalid visibility option'
          }
        }
      },
      
      // Attachments (files, screenshots, etc.)
      attachments: {
        type: DataTypes.JSONB,
        defaultValue: [],
        validate: {
          isValidAttachmentArray(value) {
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
              
              if (!attachment.name || typeof attachment.name !== 'string') {
                throw new Error(`Attachment at index ${index} must have a name`);
              }
            });
          }
        }
      },
      
      // Comment status
      status: {
        type: DataTypes.STRING,
        defaultValue: 'active',
        allowNull: false,
        validate: {
          notNull: { msg: 'Status is required' },
          isIn: {
            args: [['active', 'archived', 'deleted', 'flagged']],
            msg: 'Invalid status value'
          }
        }
      },
      
      // Edit tracking
      is_edited: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      },
      edited_at: {
        type: DataTypes.DATE,
        validate: {
          isDate: true
        }
      },
      
      // Resolution tracking
      is_resolved: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      },
      resolved_at: {
        type: DataTypes.DATE,
        validate: {
          isDate: true
        }
      },
      resolved_by: {
        type: DataTypes.UUID,
        validate: {
          isUUID: 4
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
      modelName: 'ReportComment',
      tableName: 'report_comments',
      timestamps: true,
      underscored: true,
      hooks: {
        // Update timestamp automatically
        beforeUpdate: (comment) => {
          comment.updated_at = new Date();
        },
        
        // Mark as edited when content is changed
        beforeUpdate: (comment) => {
          const changedFields = comment.changed();
          
          if (changedFields && changedFields.includes('content')) {
            comment.is_edited = true;
            comment.edited_at = new Date();
          }
        },
        
        // If resolution status changes, update related fields
        beforeUpdate: (comment) => {
          const changedFields = comment.changed();
          
          if (changedFields && changedFields.includes('is_resolved') && comment.is_resolved) {
            comment.resolved_at = new Date();
            
            // If no resolver explicitly set, use the current user
            if (!comment.resolved_by) {
              throw new Error('Resolver ID must be provided when marking comment as resolved');
            }
          }
        },
        
        // Notify users when a comment is created
        afterCreate: async (comment, options) => {
          // This would connect to a notification service
          // Implementation would depend on the notification system
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
          fields: ['parent_comment_id']
        },
        {
          fields: ['comment_type']
        },
        {
          fields: ['status']
        },
        {
          fields: ['is_resolved']
        },
        {
          fields: ['created_at']
        }
      ]
    });
    
    return ReportComment;
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
    
    // User relationships
    this.belongsTo(models.User, { 
      foreignKey: 'user_id', 
      as: 'author' 
    });
    this.belongsTo(models.User, { 
      foreignKey: 'resolved_by', 
      as: 'resolver' 
    });
    
    // Self-referential relationship for comment threading
    this.belongsTo(this, { 
      foreignKey: 'parent_comment_id', 
      as: 'parentComment' 
    });
    this.hasMany(this, { 
      foreignKey: 'parent_comment_id', 
      as: 'replies' 
    });
  }
  
  /**
   * Instance method to create a reply to this comment
   * @param {Object} data - Reply data
   * @returns {Promise<ReportComment>} The newly created reply
   */
  async createReply(data) {
    return this.sequelize.models.ReportComment.create({
      ...data,
      report_id: this.report_id,
      parent_comment_id: this.id
    });
  }
  
  /**
   * Instance method to mark this comment as resolved
   * @param {UUID} resolverId - ID of user resolving the comment
   * @param {String} [resolutionNote] - Optional note explaining resolution
   * @returns {Promise<ReportComment>} Updated comment
   */
  async markAsResolved(resolverId, resolutionNote = null) {
    const updates = {
      is_resolved: true,
      resolved_at: new Date(),
      resolved_by: resolverId
    };
    
    if (resolutionNote) {
      // Create a resolution reply automatically
      await this.createReply({
        user_id: resolverId,
        content: resolutionNote,
        comment_type: 'resolution',
        visibility: this.visibility
      });
    }
    
    return this.update(updates);
  }
  
  /**
   * Instance method to update the comment content
   * @param {String} newContent - Updated content
   * @returns {Promise<ReportComment>} Updated comment
   */
  async updateContent(newContent) {
    return this.update({
      content: newContent,
      is_edited: true,
      edited_at: new Date()
    });
  }
  
  /**
   * Instance method to add an attachment to the comment
   * @param {Object} attachment - Attachment data
   * @returns {Promise<ReportComment>} Updated comment
   */
  async addAttachment(attachment) {
    const currentAttachments = this.attachments || [];
    
    // Validate attachment structure
    if (!attachment.url || !attachment.type || !attachment.name) {
      throw new Error('Attachment must have url, type, and name properties');
    }
    
    return this.update({
      attachments: [...currentAttachments, attachment]
    });
  }
  
  /**
   * Instance method to remove an attachment by index
   * @param {Number} index - Index of attachment to remove
   * @returns {Promise<ReportComment>} Updated comment
   */
  async removeAttachment(index) {
    const currentAttachments = this.attachments || [];
    
    if (index < 0 || index >= currentAttachments.length) {
      throw new Error('Invalid attachment index');
    }
    
    const updatedAttachments = [...currentAttachments];
    updatedAttachments.splice(index, 1);
    
    return this.update({
      attachments: updatedAttachments
    });
  }
  
  /**
   * Class method to find comments requiring attention
   * @param {UUID} reportId - Optional report ID to filter by
   * @returns {Promise<Array<ReportComment>>} Unresolved comments
   */
  static async findUnresolvedIssues(reportId = null) {
    const where = {
      comment_type: 'issue',
      is_resolved: false,
      status: 'active'
    };
    
    if (reportId) {
      where.report_id = reportId;
    }
    
    return this.findAll({
      where,
      include: [
        {
          model: this.sequelize.models.User,
          as: 'author',
          attributes: ['id', 'name', 'email']
        },
        {
          model: this.sequelize.models.Report,
          as: 'report',
          attributes: ['id', 'report_number', 'title']
        }
      ],
      order: [['created_at', 'ASC']]
    });
  }
  
  /**
   * Class method to get the full comment thread
   * @param {UUID} rootCommentId - ID of the root comment
   * @returns {Promise<Object>} Threaded comment structure
   */
  static async getCommentThread(rootCommentId) {
    const rootComment = await this.findByPk(rootCommentId, {
      include: [
        {
          model: this.sequelize.models.User,
          as: 'author',
          attributes: ['id', 'name', 'email']
        }
      ]
    });
    
    if (!rootComment) {
      throw new Error('Root comment not found');
    }
    
    // Get all replies to this comment
    const replies = await this.findAll({
      where: {
        parent_comment_id: rootCommentId,
        status: 'active'
      },
      include: [
        {
          model: this.sequelize.models.User,
          as: 'author',
          attributes: ['id', 'name', 'email']
        }
      ],
      order: [['created_at', 'ASC']]
    });
    
    // Build thread structure
    return {
      ...rootComment.toJSON(),
      replies: replies.map(reply => reply.toJSON())
    };
  }
  
  /**
   * Class method to get all comments for a report
   * @param {UUID} reportId - Report ID
   * @param {Object} options - Filter options
   * @returns {Promise<Array<Object>>} Threaded comments
   */
  static async getCommentsForReport(reportId, options = {}) {
    const where = {
      report_id: reportId,
      status: 'active'
    };
    
    // Apply visibility filter
    if (options.visibility) {
      where.visibility = options.visibility;
    }
    
    // Apply comment type filter
    if (options.commentType) {
      where.comment_type = options.commentType;
    }
    
    // Only get root comments (those without parent)
    where.parent_comment_id = null;
    
    // Get root comments
    const rootComments = await this.findAll({
      where,
      include: [
        {
          model: this.sequelize.models.User,
          as: 'author',
          attributes: ['id', 'name', 'email']
        }
      ],
      order: [['created_at', 'DESC']]
    });
    
    // For each root comment, get its thread
    const threadsPromises = rootComments.map(comment => 
      this.getCommentThread(comment.id)
    );
    
    return Promise.all(threadsPromises);
  }
}

export default ReportComment;