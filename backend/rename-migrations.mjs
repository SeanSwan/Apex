// rename-migrations.mjs
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function renameMigrationFiles() {
  try {
    // Path to migrations directory
    const migrationsDir = path.join(__dirname, 'migrations');
    
    console.log(`Scanning migrations directory: ${migrationsDir}`);
    
    // Get all files in the migrations directory
    const files = await fs.readdir(migrationsDir);
    
    // Filter for JS files
    const jsFiles = files.filter(file => file.endsWith('.js'));
    
    console.log(`Found ${jsFiles.length} .js migration files to rename.`);
    
    // Process each JS file
    for (const file of jsFiles) {
      const oldPath = path.join(migrationsDir, file);
      const newPath = path.join(migrationsDir, file.replace('.js', '.cjs'));
      
      // Rename the file
      await fs.rename(oldPath, newPath);
      console.log(`Renamed: ${file} -> ${file.replace('.js', '.cjs')}`);
    }
    
    // Update .sequelizerc to ensure it points to the .cjs files
    const sequelizeRcPath = path.join(__dirname, '.sequelizerc');
    let sequelizeRcContent;
    
    try {
      sequelizeRcContent = await fs.readFile(sequelizeRcPath, 'utf8');
    } catch (err) {
      // If the file doesn't exist, create default content
      sequelizeRcContent = `const path = require('path');
module.exports = {
  'config': path.resolve('config', 'config.cjs'),
  'models-path': path.resolve('models'),
  'seeders-path': path.resolve('seeders'),
  'migrations-path': path.resolve('migrations')
};`;
    }
    
    // Write the .sequelizerc file
    await fs.writeFile(sequelizeRcPath, sequelizeRcContent, 'utf8');
    console.log(`Updated .sequelizerc file.`);
    
    console.log('\nAll migration files have been renamed successfully!');
    console.log('\nNext steps:');
    console.log('1. Run migrations: npx sequelize-cli db:migrate');
    console.log('2. When creating new migrations, use the .cjs extension:');
    console.log('   npx sequelize-cli migration:generate --name create-new-table.cjs');
    
  } catch (error) {
    console.error('Error renaming migration files:', error);
  }
}

renameMigrationFiles();