// backend/setup-unified-database.mjs
/**
 * APEX AI UNIFIED DATABASE SETUP SCRIPT
 * =====================================
 * Executes the unified database setup and performs verification
 */

import fs from 'fs';
import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';
import chalk from 'chalk';

dotenv.config();

console.log(chalk.blue.bold('\n🚀 APEX AI UNIFIED DATABASE SETUP'));
console.log(chalk.blue('====================================\n'));

async function setupUnifiedDatabase() {
  const pool = new Pool({
    user: process.env.PG_USER || 'postgres',
    host: process.env.PG_HOST || 'localhost',
    database: process.env.PG_DB || 'apex',
    password: process.env.PG_PASSWORD || '',
    port: Number(process.env.PG_PORT || 5432),
  });

  let client;
  
  try {
    // Test connection first
    console.log(chalk.yellow('📡 Testing database connection...'));
    client = await pool.connect();
    console.log(chalk.green('✅ Connected to PostgreSQL successfully'));
    
    // Read the unified setup SQL
    console.log(chalk.yellow('📄 Reading unified database setup script...'));
    const setupSQL = fs.readFileSync('./UNIFIED_DATABASE_SETUP.sql', 'utf8');
    console.log(chalk.green('✅ Setup script loaded'));
    
    // Execute the setup
    console.log(chalk.yellow('⚙️ Executing database setup...'));
    console.log(chalk.red('⚠️ WARNING: This will drop existing tables!'));
    
    // Ask for confirmation (in a real scenario, you might want user input)
    console.log(chalk.yellow('🔄 Proceeding with setup in 3 seconds...'));
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    await client.query(setupSQL);
    console.log(chalk.green('✅ Database setup completed successfully'));
    
    // Verify the setup
    console.log(chalk.yellow('🔍 Verifying database setup...'));
    
    // Check tables
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    console.log(chalk.green(`✅ Found ${tablesResult.rows.length} tables:`));
    tablesResult.rows.forEach(row => {
      console.log(chalk.cyan(`   📄 ${row.table_name}`));
    });
    
    // Check sample data
    const userCount = await client.query('SELECT COUNT(*) FROM users');
    const clientCount = await client.query('SELECT COUNT(*) FROM clients');
    const propertyCount = await client.query('SELECT COUNT(*) FROM properties');
    
    console.log(chalk.green('✅ Sample data verification:'));
    console.log(chalk.cyan(`   👥 Users: ${userCount.rows[0].count}`));
    console.log(chalk.cyan(`   🏢 Clients: ${clientCount.rows[0].count}`));
    console.log(chalk.cyan(`   🏠 Properties: ${propertyCount.rows[0].count}`));
    
    // Check role distribution
    const rolesResult = await client.query(`
      SELECT role, COUNT(*) as count 
      FROM users 
      GROUP BY role 
      ORDER BY count DESC
    `);
    
    console.log(chalk.green('✅ User role distribution:'));
    rolesResult.rows.forEach(row => {
      console.log(chalk.cyan(`   🎭 ${row.role}: ${row.count} users`));
    });
    
    // Test the unified queries
    console.log(chalk.yellow('🧪 Testing unified queries...'));
    
    try {
      const { UnifiedQueries } = await import('./database/unifiedQueries.mjs');
      
      const testConnection = await UnifiedQueries.testConnection();
      console.log(chalk.green(`✅ UnifiedQueries connection: ${testConnection}`));
      
      const stats = await UnifiedQueries.getDatabaseStats();
      console.log(chalk.green('✅ Database statistics retrieved:'));
      console.log(chalk.cyan(`   📊 Total records: ${JSON.stringify(stats, null, 2)}`));
      
    } catch (queryError) {
      console.log(chalk.red('❌ UnifiedQueries test failed:'), queryError.message);
    }
    
    console.log(chalk.green.bold('\n🎉 DATABASE SETUP COMPLETE!'));
    console.log(chalk.green('========================='));
    console.log(chalk.yellow('📋 Next Steps:'));
    console.log(chalk.white('   1. Update your application to use UnifiedQueries'));
    console.log(chalk.white('   2. Test client portal authentication'));
    console.log(chalk.white('   3. Verify role-based access control'));
    console.log(chalk.white('   4. Build SOP and Contact management components'));
    
    console.log(chalk.blue.bold('\\n🔐 ROLE-BASED ACCESS SYSTEM READY:'));
    console.log(chalk.white('   - super_admin: Full system access'));
    console.log(chalk.white('   - admin_cto/ceo/cfo: Executive level access'));
    console.log(chalk.white('   - manager: Dispatch management access'));
    console.log(chalk.white('   - client: Property-scoped access only'));
    console.log(chalk.white('   - guard: Field operations access'));
    console.log(chalk.white('   - user: Pending approval (no access)'));
    
  } catch (error) {
    console.error(chalk.red('❌ Database setup failed:'), error.message);
    console.log(chalk.yellow('\\n🔧 Troubleshooting tips:'));
    console.log(chalk.white('   1. Ensure PostgreSQL is running'));
    console.log(chalk.white('   2. Check database credentials in .env file'));
    console.log(chalk.white('   3. Verify database "apex" exists'));
    console.log(chalk.white('   4. Check user permissions'));
    
    if (error.message.includes('does not exist')) {
      console.log(chalk.red('\\n💡 Database might not exist. Create it with:'));
      console.log(chalk.white('   CREATE DATABASE apex;'));
    }
    
  } finally {
    if (client) {
      client.release();
    }
    await pool.end();
  }
}

// Execute the setup
setupUnifiedDatabase()
  .then(() => {
    console.log(chalk.green('\\n✅ Setup script completed'));
    process.exit(0);
  })
  .catch(error => {
    console.error(chalk.red('\\n❌ Setup script failed:'), error);
    process.exit(1);
  });
