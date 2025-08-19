// backend/final-readiness-check.mjs
/**
 * APEX AI FINAL READINESS CHECK
 * =============================
 * Verifies all dependencies and files are ready for unified setup
 */

import fs from 'fs';
import path from 'path';
import chalk from 'chalk';

console.log(chalk.blue.bold('\n🔍 APEX AI FINAL READINESS CHECK'));
console.log(chalk.blue('=================================\n'));

const requiredFiles = [
  'UNIFIED_DATABASE_SETUP.sql',
  'setup-unified-database.mjs',
  'verify-before-setup.mjs',
  'check-current-db-state.mjs',
  'database/unifiedQueries.mjs',
  'analyze-project-structure.mjs',
  'cleanup-old-files.mjs',
  '.env'
];

const requiredEnvVars = [
  'PG_HOST',
  'PG_PORT',
  'PG_USER',
  'PG_DB',
  'JWT_SECRET'
];

let readyForSetup = true;

console.log(chalk.yellow('📁 Checking required files...'));
for (const file of requiredFiles) {
  const filePath = path.join(process.cwd(), file);
  if (fs.existsSync(filePath)) {
    console.log(chalk.green(`✅ ${file}`));
  } else {
    console.log(chalk.red(`❌ ${file} - MISSING`));
    readyForSetup = false;
  }
}

console.log(chalk.yellow('\n🔧 Checking environment variables...'));
for (const envVar of requiredEnvVars) {
  if (process.env[envVar]) {
    console.log(chalk.green(`✅ ${envVar} is set`));
  } else {
    console.log(chalk.red(`❌ ${envVar} - NOT SET`));
    readyForSetup = false;
  }
}

console.log(chalk.yellow('\n📦 Checking Node.js dependencies...'));
try {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const requiredDeps = ['pg', 'chalk', 'sequelize', 'dotenv'];
  
  for (const dep of requiredDeps) {
    if (packageJson.dependencies[dep]) {
      console.log(chalk.green(`✅ ${dep} dependency available`));
    } else {
      console.log(chalk.red(`❌ ${dep} dependency - MISSING`));
      readyForSetup = false;
    }
  }
} catch (error) {
  console.log(chalk.red(`❌ Error reading package.json: ${error.message}`));
  readyForSetup = false;
}

console.log(chalk.yellow('\n💾 Checking database connectivity...'));
try {
  // Quick connection test
  const { Pool } = await import('pg');
  const pool = new Pool({
    user: process.env.PG_USER,
    host: process.env.PG_HOST,
    database: process.env.PG_DB,
    password: process.env.PG_PASSWORD || '',
    port: Number(process.env.PG_PORT) || 5432,
  });
  
  const client = await pool.connect();
  await client.query('SELECT NOW()');
  client.release();
  await pool.end();
  
  console.log(chalk.green('✅ Database connection successful'));
} catch (error) {
  console.log(chalk.red(`❌ Database connection failed: ${error.message}`));
  readyForSetup = false;
}

console.log(chalk.blue.bold('\n📋 READINESS SUMMARY'));
console.log(chalk.blue('==================='));

if (readyForSetup) {
  console.log(chalk.green.bold('🎉 ALL SYSTEMS READY!'));
  console.log(chalk.green('✅ All required files present'));
  console.log(chalk.green('✅ Environment variables configured'));
  console.log(chalk.green('✅ Dependencies available'));
  console.log(chalk.green('✅ Database connection working'));
  console.log(chalk.white('\n🚀 Ready to execute MASTER_UNIFIED_SETUP.bat'));
  console.log(chalk.white('   This will rebuild your database with a clean, unified foundation.'));
} else {
  console.log(chalk.red.bold('❌ SYSTEM NOT READY'));
  console.log(chalk.yellow('\n🔧 Please fix the issues above before proceeding:'));
  console.log(chalk.white('   1. Ensure all required files are present'));
  console.log(chalk.white('   2. Check your .env file configuration'));
  console.log(chalk.white('   3. Verify PostgreSQL is running'));
  console.log(chalk.white('   4. Install missing dependencies if needed'));
}

console.log(chalk.blue('\n' + '='.repeat(50)));
process.exit(readyForSetup ? 0 : 1);
