'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('keys', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      property_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'properties',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      // Key details
      key_code: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      description: {
        type: Sequelize.TEXT
      },
      key_type: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: 'standard'
      },
      // Physical characteristics
      physical_key: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      color: {
        type: Sequelize.STRING
      },
      markings: {
        type: Sequelize.STRING
      },
      key_number: {
        type: Sequelize.STRING
      },
      manufacturer: {
        type: Sequelize.STRING
      },
      model: {
        type: Sequelize.STRING
      },
      // Electronic credentials
      is_electronic: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      credential_id: {
        type: Sequelize.STRING
      },
      card_number: {
        type: Sequelize.STRING
      },
      access_level: {
        type: Sequelize.STRING,
        defaultValue: 'standard'
      },
      // Access details
      access_zones: {
        type: Sequelize.JSONB,
        defaultValue: []
      },
      access_points: {
        type: Sequelize.JSONB,
        defaultValue: []
      },
      access_schedule: {
        type: Sequelize.JSONB,
        defaultValue: null
      },
      restricted_areas: {
        type: Sequelize.JSONB,
        defaultValue: []
      },
      // Status
      status: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: 'available'
      },
      active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      // Issuance tracking
      issued_to: {
        type: Sequelize.UUID,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      issued_by: {
        type: Sequelize.UUID,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      issued_date: {
        type: Sequelize.DATE
      },
      expected_return_date: {
        type: Sequelize.DATE
      },
      return_date: {
        type: Sequelize.DATE
      },
      returned_by: {
        type: Sequelize.UUID,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      received_by: {
        type: Sequelize.UUID,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      return_condition: {
        type: Sequelize.STRING
      },
      // Temporary keys and expiration
      temporary: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      creation_date: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      },
      expiry_date: {
        type: Sequelize.DATE
      },
      deactivated_date: {
        type: Sequelize.DATE
      },
      deactivated_by: {
        type: Sequelize.UUID,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      deactivation_reason: {
        type: Sequelize.TEXT
      },
      // Security measures
      requires_signature: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      signature_image: {
        type: Sequelize.STRING
      },
      requires_deposit: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      deposit_amount: {
        type: Sequelize.DECIMAL(10, 2)
      },
      deposit_paid: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      deposit_returned: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      // Lost/stolen tracking
      reported_lost: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      reported_lost_date: {
        type: Sequelize.DATE
      },
      reported_lost_by: {
        type: Sequelize.UUID,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      lost_report_details: {
        type: Sequelize.TEXT
      },
      // Key replacement
      replacement_for: {
        type: Sequelize.UUID,
        references: {
          model: 'keys',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      replaced_by: {
        type: Sequelize.UUID,
        references: {
          model: 'keys',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      replacement_reason: {
        type: Sequelize.TEXT
      },
      // Duplication tracking
      do_not_duplicate: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      copies_made: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      // Audit and tracking
      last_audit_date: {
        type: Sequelize.DATE
      },
      last_audit_status: {
        type: Sequelize.STRING
      },
      last_audit_by: {
        type: Sequelize.UUID,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      // Usage tracking
      last_used: {
        type: Sequelize.DATE
      },
      usage_count: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      // Notes and documentation
      notes: {
        type: Sequelize.TEXT
      },
      photos: {
        type: Sequelize.JSONB,
        defaultValue: []
      },
      documents: {
        type: Sequelize.JSONB,
        defaultValue: []
      },
      // System fields
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      },
      updated_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      }
    });

    // Add indexes for performance
    await queryInterface.addIndex('keys', ['key_code'], { unique: true });
    await queryInterface.addIndex('keys', ['property_id']);
    await queryInterface.addIndex('keys', ['status']);
    await queryInterface.addIndex('keys', ['key_type']);
    await queryInterface.addIndex('keys', ['issued_to']);
    await queryInterface.addIndex('keys', ['issued_date']);
    await queryInterface.addIndex('keys', ['expiry_date']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('keys');
  }
};