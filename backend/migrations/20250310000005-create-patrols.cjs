'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Check if the "patrols" table already exists
    const tables = await queryInterface.sequelize.query(
      "SELECT tablename FROM pg_catalog.pg_tables WHERE schemaname = 'public' AND tablename = 'patrols'",
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    if (tables.length === 0) {
      // Table does not exist; create it with all columns using compatible types.
      await queryInterface.createTable('patrols', {
        id: {
          type: Sequelize.UUID,
          defaultValue: Sequelize.UUIDV4,
          primaryKey: true
        },
        property_id: {
          type: Sequelize.INTEGER, // Must match properties.id type
          allowNull: false,
          references: {
            model: 'properties',
            key: 'id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE'
        },
        patrol_route_id: {
          type: Sequelize.INTEGER, // Assuming patrol_routes uses INTEGER
          references: {
            model: 'patrol_routes',
            key: 'id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL'
        },
        guard_id: {
          type: Sequelize.INTEGER, // Must match users.id type
          allowNull: false,
          references: {
            model: 'users',
            key: 'id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'RESTRICT'
        },
        patrol_number: {
          type: Sequelize.STRING,
          unique: true,
          allowNull: false
        },
        patrol_type: {
          type: Sequelize.STRING,
          allowNull: false,
          defaultValue: 'regular'
        },
        description: {
          type: Sequelize.TEXT
        },
        scheduled_at: {
          type: Sequelize.DATE
        },
        start_time: {
          type: Sequelize.DATE
        },
        end_time: {
          type: Sequelize.DATE
        },
        estimated_duration_minutes: {
          type: Sequelize.INTEGER
        },
        actual_duration_minutes: {
          type: Sequelize.INTEGER
        },
        status: {
          type: Sequelize.STRING,
          allowNull: false,
          defaultValue: 'scheduled'
        },
        started_on_time: {
          type: Sequelize.BOOLEAN
        },
        completed_on_time: {
          type: Sequelize.BOOLEAN
        },
        checkpoints_total: {
          type: Sequelize.INTEGER,
          defaultValue: 0
        },
        checkpoints_scanned: {
          type: Sequelize.INTEGER,
          defaultValue: 0
        },
        checkpoint_compliance: {
          type: Sequelize.FLOAT,
          defaultValue: 0
        },
        start_location: {
          type: Sequelize.JSONB
        },
        end_location: {
          type: Sequelize.JSONB
        },
        path_taken: {
          type: Sequelize.JSONB
        },
        distance_traveled: {
          type: Sequelize.FLOAT
        },
        findings: {
          type: Sequelize.TEXT
        },
        notes: {
          type: Sequelize.TEXT
        },
        issues_found: {
          type: Sequelize.BOOLEAN,
          defaultValue: false
        },
        incidents_reported: {
          type: Sequelize.INTEGER,
          defaultValue: 0
        },
        incident_ids: {
          type: Sequelize.JSONB,
          defaultValue: []
        },
        maintenance_issues: {
          type: Sequelize.JSONB,
          defaultValue: []
        },
        photos: {
          type: Sequelize.JSONB,
          defaultValue: []
        },
        videos: {
          type: Sequelize.JSONB,
          defaultValue: []
        },
        weather_conditions: {
          type: Sequelize.STRING
        },
        temperature: {
          type: Sequelize.FLOAT
        },
        weather_details: {
          type: Sequelize.JSONB
        },
        supervisor_id: {
          type: Sequelize.INTEGER, // Must match users.id type
          references: {
            model: 'users',
            key: 'id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL'
        },
        reviewed: {
          type: Sequelize.BOOLEAN,
          defaultValue: false
        },
        reviewed_at: {
          type: Sequelize.DATE
        },
        reviewed_by: {
          type: Sequelize.INTEGER, // Must match users.id type
          references: {
            model: 'users',
            key: 'id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL'
        },
        review_notes: {
          type: Sequelize.TEXT
        },
        review_rating: {
          type: Sequelize.INTEGER
        },
        billable: {
          type: Sequelize.BOOLEAN,
          defaultValue: true
        },
        billing_code: {
          type: Sequelize.STRING
        },
        client_visible: {
          type: Sequelize.BOOLEAN,
          defaultValue: true
        },
        client_notified: {
          type: Sequelize.BOOLEAN,
          defaultValue: false
        },
        client_notification_sent_at: {
          type: Sequelize.DATE
        },
        equipment_used: {
          type: Sequelize.JSONB,
          defaultValue: []
        },
        vehicle_id: {
          type: Sequelize.INTEGER, // Must match vehicles.id type
          references: {
            model: 'vehicles',
            key: 'id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL'
        },
        vehicle_start_mileage: {
          type: Sequelize.FLOAT
        },
        vehicle_end_mileage: {
          type: Sequelize.FLOAT
        },
        created_at: {
          type: Sequelize.DATE,
          defaultValue: Sequelize.NOW
        },
        updated_at: {
          type: Sequelize.DATE,
          defaultValue: Sequelize.NOW
        }
      });
    } else {
      // Table already exists; ensure critical columns exist.
      const tableDesc = await queryInterface.describeTable('patrols');

      if (!tableDesc.property_id) {
        await queryInterface.addColumn('patrols', 'property_id', {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: {
            model: 'properties',
            key: 'id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE'
        });
        console.log('Added missing column "property_id" to patrols');
      }
      if (!tableDesc.patrol_number) {
        await queryInterface.addColumn('patrols', 'patrol_number', {
          type: Sequelize.STRING,
          unique: true,
          allowNull: false
        });
        console.log('Added missing column "patrol_number" to patrols');
      }
      if (!tableDesc.guard_id) {
        await queryInterface.addColumn('patrols', 'guard_id', {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: {
            model: 'users',
            key: 'id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'RESTRICT'
        });
        console.log('Added missing column "guard_id" to patrols');
      }
      if (!tableDesc.patrol_route_id) {
        await queryInterface.addColumn('patrols', 'patrol_route_id', {
          type: Sequelize.INTEGER,
          references: {
            model: 'patrol_routes',
            key: 'id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL'
        });
        console.log('Added missing column "patrol_route_id" to patrols');
      }
      if (!tableDesc.status) {
        await queryInterface.addColumn('patrols', 'status', {
          type: Sequelize.STRING,
          allowNull: false,
          defaultValue: 'scheduled'
        });
        console.log('Added missing column "status" to patrols');
      }
      if (!tableDesc.scheduled_at) {
        await queryInterface.addColumn('patrols', 'scheduled_at', {
          type: Sequelize.DATE,
          allowNull: true
        });
        console.log('Added missing column "scheduled_at" to patrols');
      }
      if (!tableDesc.start_time) {
        await queryInterface.addColumn('patrols', 'start_time', {
          type: Sequelize.DATE,
          allowNull: true
        });
        console.log('Added missing column "start_time" to patrols');
      }
    }

    // Helper function to conditionally create an index if it doesn't already exist.
    const createIndexIfNotExists = async (tableName, columns, options = {}) => {
      const computedName = options.name ||
        `${tableName}_${columns.join('_')}${options.unique ? '_unique' : ''}`;
      // For unique indexes, also check for the alternate naming (without _unique)
      const alternateName = options.unique ? `${tableName}_${columns.join('_')}` : computedName;
      const indexes = await queryInterface.sequelize.query(
        `SELECT indexname FROM pg_indexes WHERE tablename = '${tableName}'`,
        { type: queryInterface.sequelize.QueryTypes.SELECT }
      );
      const indexNames = indexes.map(idx => idx.indexname);
      if (indexNames.includes(computedName) || (options.unique && indexNames.includes(alternateName))) {
        console.log(`Index ${computedName} (or ${alternateName}) already exists, skipping creation`);
      } else {
        await queryInterface.addIndex(tableName, columns, options);
        console.log(`Created index ${computedName}`);
      }
    };

    // Conditionally add indexes for performance.
    await createIndexIfNotExists('patrols', ['patrol_number'], { unique: true });
    await createIndexIfNotExists('patrols', ['property_id']);
    await createIndexIfNotExists('patrols', ['guard_id']);
    await createIndexIfNotExists('patrols', ['patrol_route_id']);
    await createIndexIfNotExists('patrols', ['status']);
    await createIndexIfNotExists('patrols', ['scheduled_at']);
    await createIndexIfNotExists('patrols', ['start_time']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('patrols');
  }
};
