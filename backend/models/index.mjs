// APEX AI SECURITY PLATFORM - MODEL INDEX
// =======================================
// Comprehensive model import and association setup

import sequelize from '../config/database.mjs';

// Import class-based models (already initialized)
import User from './user.mjs';
import Property from './property.mjs';
import Guard from './guard.mjs';
import Patrol from './patrol.mjs';
import Incident from './incident.mjs';
import Report from './report.mjs';
import Schedule from './schedule.mjs';
import Vehicle from './vehicle.mjs';
import VehicleInspection from './vehicleInspection.mjs';
import VehicleDamage from './vehicleDamage.mjs';
import Key from './key.mjs';
import MaintenanceRequest from './maintenanceRequest.mjs';
import ReportComment from './reportComment.mjs';
import ReportTemplate from './reportTemplate.mjs';
import Checkpoint from './checkpoint.mjs';
import CheckpointScan from './checkpointScan.mjs';
import PropertyAssignment from './propertyAssignment.mjs';

// Import function-based models (need sequelize parameter)
import ClientFunction from './client.mjs';
import ContactFunction from './contact.mjs';
import PatrolRouteFunction from './patrolRoute.mjs';

// Initialize function-based models
const Client = ClientFunction(sequelize);
const Contact = ContactFunction(sequelize);
const PatrolRoute = PatrolRouteFunction(sequelize);

// === MODEL ASSOCIATIONS ===

// User <-> Property (Client relationship)
User.hasMany(Property, {
  foreignKey: 'client_id',
  as: 'managedProperties',
  constraints: false,
  scope: {
    role: 'client'
  }
});
Property.belongsTo(User, {
  foreignKey: 'client_id',
  as: 'client'
});

// User <-> Guard (one-to-one relationship)
User.hasOne(Guard, {
  foreignKey: 'user_id',
  as: 'guardProfile',
  constraints: false
});
Guard.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user'
});

// Client <-> Contact (One-to-Many)
Client.hasMany(Contact, {
  foreignKey: 'clientId',
  as: 'contacts',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE'
});
Contact.belongsTo(Client, {
  foreignKey: 'clientId',
  as: 'client'
});

// Client <-> Property (One-to-Many)
Client.hasMany(Property, {
  foreignKey: 'client_id',
  as: 'properties'
});
Property.belongsTo(Client, {
  foreignKey: 'client_id',
  as: 'clientInfo'
});

// Guard <-> Property (Many-to-Many through PropertyAssignment)
Guard.belongsToMany(Property, {
  through: PropertyAssignment,
  foreignKey: 'guard_id',
  otherKey: 'property_id',
  as: 'assignedProperties'
});
Property.belongsToMany(Guard, {
  through: PropertyAssignment,
  foreignKey: 'property_id',
  otherKey: 'guard_id',
  as: 'assignedGuards'
});

// Guard <-> Patrol (One-to-Many)
Guard.hasMany(Patrol, {
  foreignKey: 'guard_id',
  as: 'patrols'
});
Patrol.belongsTo(Guard, {
  foreignKey: 'guard_id',
  as: 'guard'
});

// Property <-> Patrol (One-to-Many)
Property.hasMany(Patrol, {
  foreignKey: 'property_id',
  as: 'patrols'
});
Patrol.belongsTo(Property, {
  foreignKey: 'property_id',
  as: 'property'
});

// Property <-> Incident (One-to-Many)
Property.hasMany(Incident, {
  foreignKey: 'property_id',
  as: 'incidents'
});
Incident.belongsTo(Property, {
  foreignKey: 'property_id',
  as: 'property'
});

// User <-> Incident (Reported By - One-to-Many)
User.hasMany(Incident, {
  foreignKey: 'reported_by_id',
  as: 'reportedIncidents'
});
Incident.belongsTo(User, {
  foreignKey: 'reported_by_id',
  as: 'reportedBy'
});

// Guard <-> Report (One-to-Many)
Guard.hasMany(Report, {
  foreignKey: 'guardId',
  as: 'reports'
});
Report.belongsTo(Guard, {
  foreignKey: 'guardId',
  as: 'guard'
});

// Property <-> Report (One-to-Many)
Property.hasMany(Report, {
  foreignKey: 'propertyId',
  as: 'reports'
});
Report.belongsTo(Property, {
  foreignKey: 'propertyId',
  as: 'property'
});

// Client <-> Report (One-to-Many)
Client.hasMany(Report, {
  foreignKey: 'clientId',
  as: 'reports'
});
Report.belongsTo(Client, {
  foreignKey: 'clientId',
  as: 'client'
});

// Guard <-> Schedule (One-to-Many)
Guard.hasMany(Schedule, {
  foreignKey: 'guardId',
  as: 'schedules'
});
Schedule.belongsTo(Guard, {
  foreignKey: 'guardId',
  as: 'guard'
});

// Property <-> Schedule (One-to-Many)
Property.hasMany(Schedule, {
  foreignKey: 'propertyId',
  as: 'schedules'
});
Schedule.belongsTo(Property, {
  foreignKey: 'propertyId',
  as: 'property'
});

// Vehicle Associations
Guard.hasMany(Vehicle, {
  foreignKey: 'current_driver_guard_id',
  as: 'drivenVehicles'
});
Vehicle.belongsTo(Guard, {
  foreignKey: 'current_driver_guard_id',
  as: 'currentDriver'
});

Vehicle.hasMany(VehicleInspection, {
  foreignKey: 'vehicleId',
  as: 'inspections',
  onDelete: 'CASCADE'
});
VehicleInspection.belongsTo(Vehicle, {
  foreignKey: 'vehicleId',
  as: 'vehicle'
});

Guard.hasMany(VehicleInspection, {
  foreignKey: 'inspectedByGuardId',
  as: 'inspectionsPerformed'
});
VehicleInspection.belongsTo(Guard, {
  foreignKey: 'inspectedByGuardId',
  as: 'inspector'
});

Vehicle.hasMany(VehicleDamage, {
  foreignKey: 'vehicleId',
  as: 'damages',
  onDelete: 'CASCADE'
});
VehicleDamage.belongsTo(Vehicle, {
  foreignKey: 'vehicleId',
  as: 'vehicle'
});

// Checkpoint Associations
Property.hasMany(Checkpoint, {
  foreignKey: 'propertyId',
  as: 'checkpoints'
});
Checkpoint.belongsTo(Property, {
  foreignKey: 'propertyId',
  as: 'property'
});

Checkpoint.hasMany(CheckpointScan, {
  foreignKey: 'checkpointId',
  as: 'scans'
});
CheckpointScan.belongsTo(Checkpoint, {
  foreignKey: 'checkpointId',
  as: 'checkpoint'
});

Guard.hasMany(CheckpointScan, {
  foreignKey: 'guardId',
  as: 'checkpointScans'
});
CheckpointScan.belongsTo(Guard, {
  foreignKey: 'guardId',
  as: 'guard'
});

Patrol.hasMany(CheckpointScan, {
  foreignKey: 'patrolId',
  as: 'checkpointScans'
});
CheckpointScan.belongsTo(Patrol, {
  foreignKey: 'patrolId',
  as: 'patrol'
});

// Export all models
const db = {
  sequelize,
  Sequelize: sequelize.Sequelize,
  User,
  Property,
  Guard,
  Client,
  Contact,
  Patrol,
  Incident,
  Report,
  Schedule,
  Vehicle,
  VehicleInspection,
  VehicleDamage,
  PropertyAssignment,
  Checkpoint,
  CheckpointScan,
  PatrolRoute,
  Key,
  MaintenanceRequest,
  ReportComment,
  ReportTemplate
};

// Test database connection
const testDbConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully.');
    
    // Check if essential tables exist
    const tableChecks = [
      { model: 'Users', table: 'Users' },
      { model: 'Clients', table: 'Clients' },
      { model: 'Properties', table: 'Properties' },
      { model: 'Reports', table: 'Reports' }
    ];
    
    for (const check of tableChecks) {
      try {
        await sequelize.query(`SELECT 1 FROM "${check.table}" LIMIT 1`);
        console.log(`✅ ${check.model} table exists and is accessible`);
      } catch (error) {
        console.log(`⚠️ ${check.model} table does not exist yet - you may need to run migrations`);
      }
    }
    
  } catch (error) {
    console.error('❌ Unable to connect to the database:', error.message);
    if (error.message.includes('database "apex" does not exist')) {
      console.log('💡 Run the database setup script: psql -U postgres -f scripts/fix-database-complete.sql');
    }
  }
};

// Run the connection test
testDbConnection();

export default db;
