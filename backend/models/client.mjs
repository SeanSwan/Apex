// defense/backend/models/client.mjs
import { DataTypes, Model } from 'sequelize';

export default (sequelize) => {
  class Client extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // --- MOVE ASSOCIATION LOGIC HERE ---
      Client.hasMany(models.Contact, { // Use models.Contact
        foreignKey: 'clientId',
        as: 'contacts',
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      });

      // Also associate with Property (assuming Property model is in models.Property)
      Client.hasMany(models.Property, {
         foreignKey: 'client_id', // Make sure this FK exists and is correct in Property model
         as: 'properties' // Or 'managedProperties' if you prefer that alias
      });
      // --- END ASSOCIATION LOGIC ---
    }
  }

  Client.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'The primary name of the client entity or company.'
    },
    siteName: {
      type: DataTypes.STRING,
      allowNull: true, // Can be same as name
      comment: 'Specific site name if different from the main client name.'
    },
    location: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Street address.'
    },
    city: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    state: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    zipCode: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    contactEmail: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        isEmail: true,
      },
      comment: 'Primary contact email for the client/site.'
    },
    cameraType: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'General type or brand of cameras used.'
    },
    cameras: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0,
      comment: 'Number of cameras monitored at the site.'
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      comment: 'Indicates if the client monitoring is currently active.'
    },
    isVIP: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: 'Indicates if the client is marked as VIP.'
    },
    isNew: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: 'Indicates if the client is considered new.'
    },
    cameraDetails: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Additional free-text details about the camera setup.'
    },
    createdAt: {
        allowNull: false,
        type: DataTypes.DATE
    },
    updatedAt: {
        allowNull: false,
        type: DataTypes.DATE
    }
  }, {
    sequelize,
    modelName: 'Client',
    tableName: 'Clients',
    timestamps: true,
    underscored: false, // Sticking with camelCase based on your definition
  });

  return Client;
};