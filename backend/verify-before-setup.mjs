// backend/verify-before-setup.mjs
/**
 * APEX AI PRE-SETUP VERIFICATION
 * ==============================
 * Checks current database state before running unified setup
 */

import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';
import chalk from 'chalk';

dotenv.config();

console.log(chalk.blue.bold('🔍 APEX AI PRE-SETUP VERIFICATION'));
console.log(chalk.blue('=================================\\n'));

async function verifyPreSetup() {
  const pool = new Pool({
    user: process.env.PG_USER || 'postgres',
    host: process.env.PG_HOST || 'localhost',
    database: process.env.PG_DB || 'apex',
    password: process.env.PG_PASSWORD || '',
    port: Number(process.env.PG_PORT || 5432),
  });

  try {
    console.log(chalk.yellow('📡 Testing database connection...'));
    const client = await pool.connect();
    console.log(chalk.green('✅ Connected to PostgreSQL successfully\\n'));

    // Check environment variables
    console.log(chalk.yellow('🔧 Environment Configuration:'));
    console.log(chalk.cyan(`   Database: ${process.env.PG_DB || '(not set)'}`));
    console.log(chalk.cyan(`   User: ${process.env.PG_USER || '(not set)'}`));
    console.log(chalk.cyan(`   Host: ${process.env.PG_HOST || '(not set)'}`));
    console.log(chalk.cyan(`   Port: ${process.env.PG_PORT || '(not set)'}`));
    console.log(chalk.cyan(`   Password: ${process.env.PG_PASSWORD ? 'Set' : 'Not set'}\\n`));

    // Check existing tables
    console.log(chalk.yellow('📋 Current Tables:'));
    const tablesResult = await client.query(`
      SELECT table_name, table_type
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    
    if (tablesResult.rows.length === 0) {
      console.log(chalk.green('✅ No tables found - clean slate for setup'));
    } else {
      console.log(chalk.yellow(`⚠️ Found ${tablesResult.rows.length} existing tables:`));
      tablesResult.rows.forEach(row => {
        console.log(chalk.red(`   ❌ ${row.table_name} (${row.table_type}) - WILL BE DROPPED`));
      });
    }

    // Check for data in key tables
    console.log(chalk.yellow('\\n💾 Existing Data Check:'));
    const keyTables = ['users', 'Users', 'properties', 'Properties', 'incidents', 'Incidents'];
    let hasData = false;
    
    for (const tableName of keyTables) {
      try {
        const result = await client.query(`SELECT COUNT(*) FROM "${tableName}"`);
        const count = parseInt(result.rows[0].count);
        if (count > 0) {
          console.log(chalk.red(`   ⚠️ ${tableName}: ${count} records - WILL BE LOST`));
          hasData = true;
        }
      } catch (error) {
        try {
          const result = await client.query(`SELECT COUNT(*) FROM ${tableName}`);
          const count = parseInt(result.rows[0].count);
          if (count > 0) {
            console.log(chalk.red(`   ⚠️ ${tableName}: ${count} records - WILL BE LOST`));
            hasData = true;
          }
        } catch (error2) {
          // Table doesn't exist - that's fine
        }
      }
    }
    
    if (!hasData) {
      console.log(chalk.green('✅ No critical data found'));
    }

    // Check migration status
    console.log(chalk.yellow('\\n📊 Migration Status:'));
    try {
      const migrationsResult = await client.query('SELECT COUNT(*) FROM "SequelizeMeta"');
      const migrationCount = parseInt(migrationsResult.rows[0].count);
      console.log(chalk.yellow(`⚠️ ${migrationCount} migrations have been run - migration table WILL BE RESET`));
    } catch (error) {
      console.log(chalk.green('✅ No migration tracking table found'));
    }

    console.log(chalk.blue.bold('\\n📋 VERIFICATION SUMMARY'));
    console.log(chalk.blue('======================'));
    
    if (tablesResult.rows.length > 0 || hasData) {
      console.log(chalk.red.bold('⚠️ WARNING: EXISTING DATA WILL BE LOST!'));
      console.log(chalk.yellow('\\n🔄 The unified setup will:'));
      console.log(chalk.white('   1. DROP all existing tables'));
      console.log(chalk.white('   2. DELETE all existing data'));
      console.log(chalk.white('   3. CREATE new unified table structure'));
      console.log(chalk.white('   4. INSERT sample data'));
      console.log(chalk.white('   5. Set up proper role-based access control'));
      
      console.log(chalk.red.bold('\\n💾 BACKUP RECOMMENDATION:'));
      console.log(chalk.white('   Consider backing up important data with:'));
      console.log(chalk.cyan('   pg_dump -U postgres -h localhost apex > backup.sql'));
      
    } else {
      console.log(chalk.green.bold('✅ READY FOR SETUP!'));
      console.log(chalk.green('Database is clean - no data will be lost'));
    }
    
    console.log(chalk.blue.bold('\\n🚀 NEXT STEPS:'));
    console.log(chalk.white('   1. Review this verification output'));
    console.log(chalk.white('   2. Backup any important data (if needed)'));
    console.log(chalk.white('   3. Run: node setup-unified-database.mjs'));
    console.log(chalk.white('   4. Test the new unified system'));

    client.release();
    await pool.end();

  } catch (error) {
    console.error(chalk.red('❌ Verification failed:'), error.message);
    console.log(chalk.yellow('\\n🔧 Troubleshooting:'));
    console.log(chalk.white('   1. Ensure PostgreSQL is running'));
    console.log(chalk.white('   2. Check .env file database settings'));
    console.log(chalk.white('   3. Verify database "apex" exists'));
    console.log(chalk.white('   4. Test connection with: psql -U postgres -h localhost'));
    
    if (error.message.includes('database') && error.message.includes('does not exist')) {
      console.log(chalk.red('\\n💡 Database "apex" does not exist. Create it with:'));
      console.log(chalk.cyan('   createdb -U postgres apex'));
    }
  }
}

verifyPreSetup();
