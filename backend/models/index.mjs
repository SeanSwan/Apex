// Simplified models/index.mjs to fix association errors
// This is a temporary fix to get the server running

import sequelize from '../config/database.mjs';

// Simple model exports without complex associations for now
const db = {
  sequelize,
  Sequelize: sequelize.Sequelize
};

// Test database connection
const testDbConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully.');
  } catch (error) {
    console.error('❌ Unable to connect to the database:', error.message);
  }
};

// Run the test
testDbConnection();

export default db;