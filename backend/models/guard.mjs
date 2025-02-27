import { Model, DataTypes } from 'sequelize';

export default (sequelize) => {
  // Define the Guard class, extending Sequelize's Model
  class Guard extends Model {
    // Static method to define associations with other models
    static associate(models) {
      // This is where you define relationships between models
      // For example:
      // this.belongsTo(models.Group, { foreignKey: 'groupId' });
    }
  }

  // Initialize the Guard model with its attributes and options
  Guard.init({
    // Define each field of the Guard model

    name: {
      type: DataTypes.STRING,
      allowNull: false, // This field cannot be null
      validate: {
        notEmpty: true, // Ensures the name field is not empty
      },
    },
    groupId: {
      type: DataTypes.STRING,
      allowNull: false, // This field cannot be null
      validate: {
        notEmpty: true, // Ensures the groupId field is not empty
      },
    },
    image_url: {
      type: DataTypes.STRING,
      defaultValue: null, // If no value is provided, it will default to null
      validate: {
        isUrl: true, // Ensures the value is a valid URL
      },
    },
    rating: {
      type: DataTypes.INTEGER,
      validate: {
        min: 1,
        max: 5, // Ensures the rating is between 1 and 5
      },
    },
    seniority: {
      type: DataTypes.INTEGER,
      comment: 'Seniority in number of years', // This comment helps explain the field's purpose
      validate: {
        min: 0, // Ensures seniority is a positive number
      },
    },
    number: {
      type: DataTypes.STRING,
      validate: {
        is: /^\+?[1-9]\d{1,14}$/i, // Validates the number format (international phone number)
      },
    },
    address: {
      type: DataTypes.STRING,
      validate: {
        notEmpty: true, // Ensures the address field is not empty
      },
      // No additional constraints, can be null
    },
    cover_percentage: {
      type: DataTypes.INTEGER,
      validate: {
        min: 0,
        max: 100, // Ensures the percentage is between 0 and 100
      },
    },
    rank: {
      type: DataTypes.STRING,
      allowNull: false, // This field cannot be null
      validate: {
        notEmpty: true, // Ensures the rank field is not empty
      },
    },
    checkInTime: {
      type: DataTypes.DATE,
      // Stores date and time information
    },
  }, {
    // Model options
    sequelize, // Pass the sequelize instance
    modelName: 'Guard', // Set the model name
    timestamps: true, // Automatically add createdAt and updatedAt fields
    underscored: true, // Use snake_case for automatically generated field names
  });

  // Return the Guard model
  return Guard;
};