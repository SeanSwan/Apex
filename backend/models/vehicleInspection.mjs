// File: defense/backend/models/vehicleInspection.mjs
import { DataTypes, Model } from 'sequelize';

export default (sequelize) => {
  class VehicleInspection extends Model {
    static associate(models) {
      // Associations defined in index.mjs
      // Example: VehicleInspection.belongsTo(models.Vehicle, { foreignKey: 'vehicleId', as: 'vehicle' });
      // Example: VehicleInspection.belongsTo(models.Guard, { foreignKey: 'inspectedByGuardId', as: 'inspector' });
    }
  }

  VehicleInspection.init({
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    vehicle_id: { // vehicleId in model
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'vehicles', key: 'id' }
    },
    inspection_type: { // inspectionType in model
      type: DataTypes.STRING,
      allowNull: false, // 'pre_shift', 'post_shift'
      // validate: { isIn: [['pre_shift', 'post_shift']] }
    },
    inspection_at: { // inspectionAt in model
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    inspected_by_guard_id: { // inspectedByGuardId in model
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'guards', key: 'id' }
    },
    odometer_reading: { // odometerReading in model
      type: DataTypes.INTEGER,
      allowNull: true
    },
    fuel_level_percent: { // fuelLevelPercent in model
      type: DataTypes.FLOAT,
      allowNull: true
    },
    tires_ok: { // tiresOk in model
      type: DataTypes.BOOLEAN,
      allowNull: true
    },
    lights_ok: { // lightsOk in model
      type: DataTypes.BOOLEAN,
      allowNull: true
    },
    fluids_ok: { // fluidsOk in model
      type: DataTypes.BOOLEAN,
      allowNull: true
    },
    damage_found: { // damageFound in model
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    damage_description: { // damageDescription in model
      type: DataTypes.TEXT,
      allowNull: true
    },
    photos: {
      type: DataTypes.TEXT, // Or JSONB if preferred and supported
      allowNull: true
    },
    overall_condition: { // overallCondition in model
        type: DataTypes.STRING,
        allowNull: true // 'good', 'fair', 'poor'
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    // createdAt and updatedAt are handled by Sequelize
  }, {
    sequelize,
    modelName: 'VehicleInspection',
    tableName: 'vehicle_inspections',
    timestamps: true,
    underscored: true, // Matches the migration's snake_case column names
  });

  return VehicleInspection;
};