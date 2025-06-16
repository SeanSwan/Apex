// File: defense/backend/models/vehicle.mjs
import { DataTypes, Model } from 'sequelize';

export default (sequelize) => {
  class Vehicle extends Model {
    static associate(models) {
      // Associations defined in index.mjs
      // Example: Vehicle.hasMany(models.VehicleInspection, { foreignKey: 'vehicleId', as: 'inspections' });
      // Example: Vehicle.hasMany(models.VehicleDamage, { foreignKey: 'vehicleId', as: 'damages' });
      // Example: Vehicle.belongsTo(models.Guard, { foreignKey: 'currentDriverGuardId', as: 'currentDriver' });
    }
  }

  Vehicle.init({
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    call_sign: { // snake_case to match potential underscored: true, but model uses camelCase
      type: DataTypes.STRING,
      unique: true,
      allowNull: true
    },
    make: {
      type: DataTypes.STRING,
      allowNull: true // Allow null initially
    },
    model: {
      type: DataTypes.STRING,
      allowNull: true
    },
    year: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    license_plate: { // licensePlate in model
      type: DataTypes.STRING,
      unique: true,
      allowNull: false // License plate should likely be required
    },
    vin: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: true
    },
    color: {
      type: DataTypes.STRING,
      allowNull: true
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'available',
       // validate: { isIn: [['available', 'on_patrol', 'responding', 'on_scene', 'out_of_service', 'maintenance', 'damaged', 'inactive']] } // Validation best at model level
    },
    condition_status: { // conditionStatus in model
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'operational',
        // validate: { isIn: [['operational', 'minor_damage', 'major_damage', 'requires_service']] }
    },
    condition_notes: { // conditionNotes in model
        type: DataTypes.TEXT,
        allowNull: true
    },
    current_driver_guard_id: { // currentDriverGuardId in model
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: 'guards', key: 'id' } // Define FK relationship conceptually here
    },
    last_known_latitude: { // lastKnownLatitude in model
      type: DataTypes.FLOAT,
      allowNull: true
    },
    last_known_longitude: { // lastKnownLongitude in model
      type: DataTypes.FLOAT,
      allowNull: true
    },
    last_location_timestamp: { // lastLocationTimestamp in model
      type: DataTypes.DATE, // DATE includes timestamp with time zone
      allowNull: true
    },
    odometer: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    fuel_level_percent: { // fuelLevelPercent in model
      type: DataTypes.FLOAT,
      allowNull: true
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    // createdAt and updatedAt are handled by Sequelize
  }, {
    sequelize,
    modelName: 'Vehicle',
    tableName: 'vehicles',
    timestamps: true, // Automatically adds createdAt and updatedAt
    underscored: true, // Matches the migration's snake_case column names
    // indexes: [...] // Indexes defined in migration
  });

  return Vehicle;
};