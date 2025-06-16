// File: defense/backend/models/contact.mjs
import { DataTypes, Model } from 'sequelize';

export default (sequelize) => {
  class Contact extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      // Example: Contact.belongsTo(models.Client, { foreignKey: 'clientId', as: 'client' });
    }
  }

  Contact.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    clientId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Clients', // Can be the table name string or the model class
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE', // Or 'SET NULL'/'RESTRICT' depending on requirements
      comment: 'Foreign key linking to the Client this contact belongs to.'
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'Name of the contact person.'
    },
    email: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        isEmail: true,
      },
      comment: 'Email address of the contact person.'
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Phone number of the contact person.'
    },
    isPrimary: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: 'Indicates if this is the primary contact for the client.'
    },
    // Add other fields as needed
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
    modelName: 'Contact',
    tableName: 'Contacts', // Explicitly define table name
    timestamps: true,
    underscored: false,
    // indexes: [ // Optional: Add indexes
    //   {
    //     fields: ['clientId'], // Index on the foreign key is usually beneficial
    //   },
    //   {
    //     fields: ['email'],
    //   }
    // ]
  });

  return Contact;
};