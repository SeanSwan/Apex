// File: defense/backend/models/vehicleDamage.mjs
import { DataTypes, Model } from 'sequelize';

export default (sequelize) => {
  class VehicleDamage extends Model {
    static associate(models) {
      // Associations defined in index.mjs
      // Example: VehicleDamage.belongsTo(models.Vehicle, { foreignKey: 'vehicleId', as: 'vehicle' });
      // Example: VehicleDamage.belongsTo(models.Guard, { foreignKey: 'reportedByGuardId', as: 'reporter' });
      // Example: VehicleDamage.belongsTo(models.Incident, { foreignKey: 'incidentId', as: 'incident' });
      // Example: VehicleDamage.belongsTo(models.VehicleInspection, { foreignKey: 'inspectionId', as: 'inspection' });
    }
  }

  VehicleDamage.init({
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
    reported_at: { // reportedAt in model
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    reported_by_guard_id: { // reportedByGuardId in model
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'guards', key: 'id' }
    },
    incident_id: { // incidentId in model
      type: DataTypes.INTEGER,
      allowNull: true, // Optional link
      references: { model: 'incidents', key: 'id' }
    },
    inspection_id: { // inspectionId in model
      type: DataTypes.INTEGER,
      allowNull: true, // Optional link
      references: { model: 'vehicle_inspections', key: 'id' }
    },
    damage_description: { // damageDescription in model
      type: DataTypes.TEXT,
      allowNull: false
    },
    damage_location: { // damageLocation in model
      type: DataTypes.STRING,
      allowNull: true
    },
    severity: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'minor',
      // validate: { isIn: [['cosmetic', 'minor', 'moderate', 'severe', 'safety_hazard']] }
    },
    estimated_repair_cost: { // estimatedRepairCost in model
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true
    },
    actual_repair_cost: { // actualRepairCost in model
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true
    },
    repair_status: { // repairStatus in model
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'reported',
      // validate: { isIn: [['reported', 'assessment', 'repair_pending', 'repair_in_progress', 'repaired', 'not_repairable']] }
    },
    repair_completed_at: { // repairCompletedAt in model
      type: DataTypes.DATE,
      allowNull: true
    },
    photos: {
      type: DataTypes.TEXT, // Or JSONB
      allowNull: true
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
     // createdAt and updatedAt are handled by Sequelize
  }, {
    sequelize,
    modelName: 'VehicleDamage',
    tableName: 'vehicle_damages',
    timestamps: true,
    underscored: true, // Matches the migration's snake_case column names
  });

  return VehicleDamage;
};