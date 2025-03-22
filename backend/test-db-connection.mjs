// backend/test-db-connection.mjs
import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current file directory and configure path to .env
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, '.env');

// Load environment variables
dotenv.config({ path: envPath });
console.log(`Loading environment variables from: ${envPath}`);

// Log database connection parameters (without showing the actual password)
console.log('Database connection parameters:');
console.log(`- Database: ${process.env.PG_DB}`);
console.log(`- User: ${process.env.PG_USER}`);
console.log(`- Host: ${process.env.PG_HOST}`);
console.log(`- Port: ${process.env.PG_PORT}`);
console.log(`- Password is set: ${process.env.PG_PASSWORD !== undefined}`);
console.log(`- Password is empty: ${process.env.PG_PASSWORD === ''}`);
console.log(`- Password type: ${typeof process.env.PG_PASSWORD}`);

// Create Sequelize instance with proper password handling
const sequelize = new Sequelize(
  process.env.PG_DB,
  process.env.PG_USER,
  process.env.PG_PASSWORD || '', // Handle empty password properly
  {
    host: process.env.PG_HOST,
    port: Number(process.env.PG_PORT) || 5432,
    dialect: 'postgres',
    logging: console.log,
    dialectOptions: {
      // Explicitly handle potential null values
      password: process.env.PG_PASSWORD || null
    }
  }
);

// Test the connection
async function testConnection() {
  try {
    console.log('Attempting to connect to PostgreSQL...');
    await sequelize.authenticate();
    console.log('✅ Connection to PostgreSQL has been established successfully.');
    
    // Try a simple query
    console.log('Testing simple query...');
    const [result] = await sequelize.query('SELECT NOW() as current_time');
    console.log('Query result:', result[0].current_time);
    
    return true;
  } catch (error) {
    console.error('❌ Unable to connect to PostgreSQL:', error.message);
    console.error('Error details:', error);
    
    if (error.message.includes('password')) {
      console.log('\n🔧 TROUBLESHOOTING TIPS:');
      console.log('1. Make sure your PG_PASSWORD environment variable is properly set');
      console.log('   - If using no password, use PG_PASSWORD= (no quotes)');
      console.log('   - If using a password, don\'t use quotes in the .env file');
      console.log('2. Verify that PostgreSQL is running: pg_isready -h localhost -p 5432');
      console.log('3. Check pg_hba.conf for authentication method (should be md5 or trust)');
      console.log('4. Try connecting with psql command line: psql -U postgres -h localhost');
    }
    
    return false;
  } finally {
    // Close the connection
    await sequelize.close();
  }
}

// Run the test
testConnection()
  .then(success => {
    if (success) {
      console.log('Database connection test completed successfully.');
    } else {
      console.log('Database connection test failed.');
    }
    process.exit(0);
  })
  .catch(err => {
    console.error('Unexpected error during test:', err);
    process.exit(1);
  });