/*
File: backend/config/db.js

Description:
This file configures the PostgreSQL database connection using Sequelize.
It loads environment variables from the .env file and establishes a connection with a pooling configuration.
Future enhancements:
  - Enable query logging for development and disable for production.
  - Add retry strategies for transient connection errors.
*/

import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

const sequelize = new Sequelize(
  process.env.PG_DB,       // Database name
  process.env.PG_USER,     // Database user
  process.env.PG_PASSWORD, // Database password
  {
    host: process.env.PG_HOST,   // Database host
    port: Number(process.env.PG_PORT) || 5432, // Database port (default 5432)
    dialect: 'postgres',         // Use PostgreSQL dialect
    logging: false,              // Disable logging for production
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
  }
);

// Test the connection and log status.
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('Connection to PostgreSQL has been established successfully.');
  } catch (error) {
    console.error('Unable to connect to PostgreSQL:', error);
  }
};

testConnection();

export default sequelize;
