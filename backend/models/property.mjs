import { Model, DataTypes } from 'sequelize';

export default (sequelize) => {
  class Property extends Model {
    // associations can be defined here
  }

  Property.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    address: {
      type: DataTypes.STRING,
      allowNull: false
    },
    image_url: {
      type: DataTypes.STRING,
      // Consider setting a default value or allowing null if an image isn't required
    },
    number: {
      type: DataTypes.STRING,
      // Validate as a phone number
      validate: {
        is: /^\+?[1-9]\d{1,14}$/i
      }
    },
    emergency_number: {
      type: DataTypes.STRING,
      // Validate as a phone number
      validate: {
        is: /^\+?[1-9]\d{1,14}$/i
      }
    },
    rating: {
      type: DataTypes.INTEGER,
      // Assuming rating is from 1 to 5
      validate: {
        min: 1,
        max: 5
      }
    },
    tow: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    client_since: {
      type: DataTypes.DATE,
      allowNull: false
    }
  }, {
    sequelize,
    modelName: 'Property',
  });

  return Property;
};