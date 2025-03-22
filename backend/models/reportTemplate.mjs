/**
 * Report Template Model
 * 
 * Defines reusable templates for security reports with customizable structure,
 * styling, and branding options. Templates can be client-specific or system-wide.
 * 
 * @module models/ReportTemplate
 */

import { Model, DataTypes } from 'sequelize';
import { sanitizeHtml } from '../utils/sanitizers.mjs';

class ReportTemplate extends Model {
  /**
   * Initialize the ReportTemplate model with schema definition and configuration
   * @param {Sequelize} sequelize - Sequelize instance
   * @returns {Model} Initialized ReportTemplate model
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
      
      // Basic template information
      name: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notEmpty: { msg: 'Template name cannot be empty' },
          len: [2, 255]
        },
        set(value) {
          this.setDataValue('name', sanitizeHtml(value));
        }
      },
      description: {
        type: DataTypes.TEXT,
        set(value) {
          this.setDataValue('description', sanitizeHtml(value));
        }
      },
      template_type: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'standard',
        validate: {
          notNull: { msg: 'Template type is required' },
          isIn: {
            args: [['standard', 'client', 'property', 'custom', 'system']],
            msg: 'Invalid template type'
          }
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
      
      // Foreign keys
      created_by: {
        type: DataTypes.UUID,
        allowNull: false,
        validate: {
          isUUID: 4,
          notNull: { msg: 'Creator ID is required' }
        }
      },
      client_id: {
        type: DataTypes.UUID,
        validate: {
          isUUID: 4
        }
      },
      property_id: {
        type: DataTypes.UUID,
        validate: {
          isUUID: 4
        }
      },
      
      // Template status
      is_default: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
      },
      is_system: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      },
      
      // Template structure
      structure: {
        type: DataTypes.JSONB,
        allowNull: false,
        defaultValue: {},
        validate: {
          isValidStructure(value) {
            if (typeof value !== 'object') {
              throw new Error('Structure must be an object');
            }
            
            // Basic structure validation
            if (!value.title && !value.layout) {
              throw new Error('Structure must include at least title or layout properties');
            }
          }
        }
      },
      sections: {
        type: DataTypes.JSONB,
        defaultValue: [],
        validate: {
          isValidSectionArray(value) {
            if (!Array.isArray(value)) {
              throw new Error('Sections must be an array');
            }
            
            value.forEach((section, index) => {
              if (!section.id || typeof section.id !== 'string') {
                throw new Error(`Section at index ${index} must have a string ID`);
              }
              
              if (!section.title || typeof section.title !== 'string') {
                throw new Error(`Section at index ${index} must have a title`);
              }
            });
          }
        }
      },
      fields: {
        type: DataTypes.JSONB,
        defaultValue: [],
        validate: {
          isValidFieldArray(value) {
            if (!Array.isArray(value)) {
              throw new Error('Fields must be an array');
            }
            
            value.forEach((field, index) => {
              if (!field.id || typeof field.id !== 'string') {
                throw new Error(`Field at index ${index} must have a string ID`);
              }
              
              if (!field.type || typeof field.type !== 'string') {
                throw new Error(`Field at index ${index} must have a type`);
              }
              
              if (!field.label || typeof field.label !== 'string') {
                throw new Error(`Field at index ${index} must have a label`);
              }
            });
          }
        }
      },
      
      // Styling and branding
      header_logo_url: {
        type: DataTypes.STRING,
        validate: {
          isUrl: {
            msg: 'Header logo URL must be a valid URL'
          }
        }
      },
      footer_logo_url: {
        type: DataTypes.STRING,
        validate: {
          isUrl: {
            msg: 'Footer logo URL must be a valid URL'
          }
        }
      },
      primary_color: {
        type: DataTypes.STRING,
        defaultValue: '#3366FF',
        validate: {
          isHexColor(value) {
            if (value && !value.match(/^#[0-9A-F]{6}$/i)) {
              throw new Error('Primary color must be a valid hex color');
            }
          }
        }
      },
      secondary_color: {
        type: DataTypes.STRING,
        defaultValue: '#FF6633',
        validate: {
          isHexColor(value) {
            if (value && !value.match(/^#[0-9A-F]{6}$/i)) {
              throw new Error('Secondary color must be a valid hex color');
            }
          }
        }
      },
      font_family: {
        type: DataTypes.STRING,
        defaultValue: 'Arial, sans-serif'
      },
      header_html: {
        type: DataTypes.TEXT,
        set(value) {
          this.setDataValue('header_html', sanitizeHtml(value, {
            allowedTags: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'span', 'div', 'img'],
            allowedAttributes: {
              '*': ['style', 'class'],
              'img': ['src', 'alt', 'width', 'height']
            }
          }));
        }
      },
      footer_html: {
        type: DataTypes.TEXT,
        set(value) {
          this.setDataValue('footer_html', sanitizeHtml(value, {
            allowedTags: ['p', 'span', 'div', 'img', 'a'],
            allowedAttributes: {
              '*': ['style', 'class'],
              'img': ['src', 'alt', 'width', 'height'],
              'a': ['href', 'target']
            }
          }));
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
      
      // Metadata
      tags: {
        type: DataTypes.JSONB,
        defaultValue: [],
        validate: {
          isArray(value) {
            if (!Array.isArray(value)) {
              throw new Error('Tags must be an array');
            }
          }
        }
      },
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
              throw new Error('Previous version cannot reference the template itself');
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
      },
      last_used_at: {
        type: DataTypes.DATE,
        validate: {
          isDate: true
        }
      }
    }, {
      sequelize,
      modelName: 'ReportTemplate',
      tableName: 'report_templates',
      timestamps: true,
      underscored: true,
      hooks: {
        // Update timestamps automatically
        beforeUpdate: (template) => {
          template.updated_at = new Date();
        },
        
        // Ensure only one default template per report type
        afterSave: async (template, options) => {
          if (template.is_default && template.changed('is_default')) {
            // Clear default flag on other templates of the same type
            await template.constructor.update({
              is_default: false
            }, {
              where: {
                id: {
                  [sequelize.Op.ne]: template.id
                },
                report_type: template.report_type,
                is_default: true
              },
              transaction: options.transaction
            });
          }
        },
        
        // Validate client and property constraints
        beforeValidate: (template) => {
          // If template type is client, client_id is required
          if (template.template_type === 'client' && !template.client_id) {
            throw new Error('Client ID is required for client-specific templates');
          }
          
          // If template type is property, property_id is required
          if (template.template_type === 'property' && !template.property_id) {
            throw new Error('Property ID is required for property-specific templates');
          }
          
          // System templates can only be created by admins (this check would be implemented elsewhere)
          if (template.is_system && template.isNewRecord) {
            // This validation would typically check user roles or permissions
          }
        }
      },
      indexes: [
        {
          fields: ['name']
        },
        {
          fields: ['template_type']
        },
        {
          fields: ['report_type']
        },
        {
          fields: ['created_by']
        },
        {
          fields: ['client_id']
        },
        {
          fields: ['property_id']
        },
        {
          fields: ['is_default']
        },
        {
          fields: ['is_active']
        },
        {
          fields: ['is_system']
        }
      ],
      scopes: {
        // Only active templates
        active: {
          where: {
            is_active: true
          }
        },
        // Only default templates
        defaults: {
          where: {
            is_default: true,
            is_active: true
          }
        },
        // System templates
        system: {
          where: {
            is_system: true,
            is_active: true
          }
        },
        // Client-specific templates
        forClient(clientId) {
          return {
            where: {
              is_active: true,
              [sequelize.Op.or]: [
                { template_type: 'standard' },
                { template_type: 'system' },
                { 
                  template_type: 'client',
                  client_id: clientId
                }
              ]
            }
          };
        },
        // Property-specific templates
        forProperty(propertyId) {
          return {
            where: {
              is_active: true,
              [sequelize.Op.or]: [
                { template_type: 'standard' },
                { template_type: 'system' },
                { 
                  template_type: 'property',
                  property_id: propertyId
                }
              ]
            }
          };
        }
      }
    });
    
    return ReportTemplate;
  }
  
  /**
   * Define model associations
   * @param {Object} models - All models in the application
   */
  static associate(models) {
    // User relationships
    this.belongsTo(models.User, { 
      foreignKey: 'created_by', 
      as: 'creator' 
    });
    this.belongsTo(models.User, { 
      foreignKey: 'client_id', 
      as: 'client' 
    });
    
    // Property relationship
    this.belongsTo(models.Property, { 
      foreignKey: 'property_id', 
      as: 'property' 
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
    
    // Reports using this template
    this.hasMany(models.Report, { 
      foreignKey: 'template_id', 
      as: 'reports' 
    });
  }
  
  /**
   * Instance method to create a new version of the template
   * @param {Object} changes - Changes to apply to the new version
   * @param {String} userId - ID of user creating the new version
   * @returns {Promise<ReportTemplate>} The newly created template version
   */
  async createNewVersion(changes, userId) {
    const currentData = this.toJSON();
    
    // Remove fields that shouldn't be copied
    delete currentData.id;
    delete currentData.created_at;
    delete currentData.updated_at;
    delete currentData.last_used_at;
    delete currentData.previous_version_id;
    delete currentData.version;
    delete currentData.is_default; // A new version shouldn't automatically be default
    
    // Create new version with incremented version number
    const newVersionData = {
      ...currentData,
      ...changes,
      previous_version_id: this.id,
      version: this.version + 1,
      created_by: userId
    };
    
    return this.sequelize.models.ReportTemplate.create(newVersionData);
  }
  
  /**
   * Instance method to mark this template as the default
   * @returns {Promise<ReportTemplate>} Updated template
   */
  async setAsDefault() {
    return this.update({
      is_default: true
    });
  }
  
  /**
   * Instance method to render a template with data
   * @param {Object} data - Report data to render with template
   * @returns {Object} Rendered report structure
   */
  renderTemplate(data) {
    // This would handle the actual rendering logic
    // Implementation would depend on the templating system
    
    // Update last used timestamp
    this.update({ 
      last_used_at: new Date() 
    });
    
    // Placeholder for actual rendering implementation
    const renderedTemplate = {
      structure: this.structure,
      content: {},
      styling: {
        primaryColor: this.primary_color,
        secondaryColor: this.secondary_color,
        fontFamily: this.font_family,
        customCss: this.custom_css,
        headerHtml: this.header_html,
        footerHtml: this.footer_html
      }
    };
    
    // Populate content based on data and template fields
    this.sections.forEach(section => {
      renderedTemplate.content[section.id] = {
        title: section.title,
        content: data[section.id] || section.defaultContent || ''
      };
    });
    
    return renderedTemplate;
  }
  
  /**
   * Class method to find the default template for a report type
   * @param {String} reportType - Report type to find template for
   * @returns {Promise<ReportTemplate>} Default template
   */
  static async findDefaultForType(reportType) {
    return this.findOne({
      where: {
        report_type: reportType,
        is_default: true,
        is_active: true
      }
    });
  }
  
  /**
   * Class method to find applicable templates for a report context
   * @param {String} reportType - Report type
   * @param {UUID} [clientId] - Optional client ID
   * @param {UUID} [propertyId] - Optional property ID
   * @returns {Promise<Array<ReportTemplate>>} Applicable templates
   */
  static async findApplicableTemplates(reportType, clientId = null, propertyId = null) {
    const where = {
      report_type: reportType,
      is_active: true
    };
    
    const orConditions = [
      { template_type: 'standard' },
      { template_type: 'system' }
    ];
    
    if (clientId) {
      orConditions.push({
        template_type: 'client',
        client_id: clientId
      });
    }
    
    if (propertyId) {
      orConditions.push({
        template_type: 'property',
        property_id: propertyId
      });
    }
    
    where[this.sequelize.Op.or] = orConditions;
    
    return this.findAll({
      where,
      order: [
        ['is_default', 'DESC'],
        ['updated_at', 'DESC']
      ]
    });
  }
  
  /**
   * Export template structure for external use
   * @returns {Object} Exportable template data
   */
  export() {
    const templateData = this.toJSON();
    
    // Remove sensitive or unnecessary fields
    delete templateData.id;
    delete templateData.created_by;
    delete templateData.created_at;
    delete templateData.updated_at;
    delete templateData.last_used_at;
    delete templateData.is_default;
    delete templateData.is_system;
    
    return {
      name: templateData.name,
      description: templateData.description,
      template_type: templateData.template_type,
      report_type: templateData.report_type,
      structure: templateData.structure,
      sections: templateData.sections,
      fields: templateData.fields,
      styling: {
        primary_color: templateData.primary_color,
        secondary_color: templateData.secondary_color,
        font_family: templateData.font_family,
        header_html: templateData.header_html,
        footer_html: templateData.footer_html,
        custom_css: templateData.custom_css
      },
      version: templateData.version,
      tags: templateData.tags
    };
  }
  
  /**
   * Import template from external data
   * @param {Object} data - Template data to import
   * @param {UUID} userId - ID of user importing the template
   * @returns {Promise<ReportTemplate>} Imported template
   */
  static async import(data, userId) {
    // Validate required fields
    if (!data.name || !data.report_type || !data.structure) {
      throw new Error('Template import requires name, report_type, and structure');
    }
    
    // Create template with imported data
    return this.create({
      name: data.name,
      description: data.description,
      template_type: data.template_type || 'custom',
      report_type: data.report_type,
      created_by: userId,
      structure: data.structure,
      sections: data.sections || [],
      fields: data.fields || [],
      primary_color: data.styling?.primary_color || '#3366FF',
      secondary_color: data.styling?.secondary_color || '#FF6633',
      font_family: data.styling?.font_family || 'Arial, sans-serif',
      header_html: data.styling?.header_html || '',
      footer_html: data.styling?.footer_html || '',
      custom_css: data.styling?.custom_css || '',
      tags: data.tags || []
    });
  }
}

export default ReportTemplate;