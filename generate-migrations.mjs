// generate-migrations.mjs
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';
import util from 'util';

const execPromise = util.promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const MODELS_DIR = path.join(__dirname, 'backend', 'models');
const MIGRATIONS_DIR = path.join(__dirname, 'backend', 'migrations');
const DATE_PREFIX = new Date().toISOString().replace(/[-T:.Z]/g, '').slice(0, 14);

/**
 * Analyze a model file to extract schema information
 */
async function analyzeModel(filePath) {
  try {
    const content = await fs.readFile(filePath, 'utf8');
    
    // Extract model name from class declaration or export
    let modelName = path.basename(filePath, '.mjs');
    modelName = modelName.charAt(0).toUpperCase() + modelName.slice(1);
    
    // Try to extract table name
    const tableNameMatch = content.match(/tableName: ['"](.*?)['"]/);
    const tableName = tableNameMatch 
      ? tableNameMatch[1] 
      : modelName.replace(/([a-z])([A-Z])/g, '$1_$2').toLowerCase() + 's';
    
    // Extract fields with types
    const fields = [];
    // Look for fields in Model.init 
    const modelInitBlock = content.match(/Model\.init\(\s*{([^}]+)}/s);
    
    if (modelInitBlock) {
      const fieldDefinitions = modelInitBlock[1];
      const fieldMatches = [...fieldDefinitions.matchAll(/(\w+):\s*{[^}]*type:\s*DataTypes\.([A-Z_]+)[^}]*}/gs)];
      
      for (const match of fieldMatches) {
        const [, name, type] = match;
        if (name !== 'id' && name !== 'created_at' && name !== 'updated_at') {
          fields.push({ name, type });
        }
      }
    }
    
    return {
      modelName,
      tableName,
      fields
    };
  } catch (error) {
    console.error(`Error analyzing model ${path.basename(filePath)}:`, error.message);
    return { modelName: path.basename(filePath, '.mjs'), tableName: null, fields: [] };
  }
}

/**
 * Generate migration file content based on model analysis
 */
function generateMigrationContent(modelInfo) {
  const fieldDefinitions = modelInfo.fields.map(field => {
    return `      ${field.name}: {
        type: Sequelize.${field.type},
        // TODO: Add additional field properties (allowNull, unique, etc.)
      },`;
  }).join('\n');

  return `'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('${modelInfo.tableName}', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
${fieldDefinitions || '      // TODO: Add model-specific columns here'}
      created_at: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('${modelInfo.tableName}');
  }
};
`;
}

/**
 * Main function to process all models and generate migrations
 */
async function generateMigrations() {
  try {
    console.log('Starting migration file generation process...');
    
    // Ensure migrations directory exists
    await fs.mkdir(MIGRATIONS_DIR, { recursive: true });
    
    // Get all model files
    const files = await fs.readdir(MODELS_DIR);
    const modelFiles = files.filter(file => 
      file.endsWith('.mjs') && 
      file !== 'index.mjs'
    );
    
    console.log(`Found ${modelFiles.length} model files to process.`);
    
    // Process each model
    for (let i = 0; i < modelFiles.length; i++) {
      const file = modelFiles[i];
      const fullPath = path.join(MODELS_DIR, file);
      
      // Analyze model
      console.log(`Analyzing model: ${file}...`);
      const modelInfo = await analyzeModel(fullPath);
      
      if (!modelInfo.tableName) {
        console.log(`Could not determine table name for ${file}, skipping...`);
        continue;
      }
      
      // Generate migration file name
      const paddedIndex = String(i + 1).padStart(6, '0');
      const migrationFileName = `${DATE_PREFIX}${paddedIndex}-create-${
        modelInfo.tableName.replace(/_/g, '-')
      }.js`;
      
      const migrationPath = path.join(MIGRATIONS_DIR, migrationFileName);
      
      // Generate migration content
      const migrationContent = generateMigrationContent(modelInfo);
      
      // Write migration file
      await fs.writeFile(migrationPath, migrationContent);
      
      console.log(`Created migration file: ${migrationFileName}`);
      console.log(`Fields detected: ${modelInfo.fields.length === 0 ? 'None (manual addition required)' : modelInfo.fields.map(f => f.name).join(', ')}`);
    }
    
    console.log('\nMigration files generated successfully!');
    console.log('\nNext steps:');
    console.log('1. Review the generated migration files in the migrations directory');
    console.log('2. Add/modify fields as needed in each migration file');
    console.log('3. Run migrations with: cd backend && npx sequelize-cli db:migrate');
    
  } catch (error) {
    console.error('Error generating migrations:', error);
  }
}

// Start the process
generateMigrations();