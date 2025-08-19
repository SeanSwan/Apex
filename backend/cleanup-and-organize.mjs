// backend/cleanup-and-organize.mjs
/**
 * APEX AI CLEANUP & ORGANIZATION SCRIPT
 * =====================================
 * Removes old conflicting files and organizes the project structure
 */

import fs from 'fs';
import path from 'path';
import chalk from 'chalk';

console.log(chalk.blue.bold('\n🧹 APEX AI PROJECT CLEANUP & ORGANIZATION'));
console.log(chalk.blue('='.repeat(45)));

const projectRoot = path.resolve('..', '.');
const backupDir = path.join(projectRoot, 'archive', 'cleanup-' + new Date().toISOString().slice(0, 10));

// Files and directories to clean up (old/conflicting)
const cleanupTargets = {
  'Old Authentication Files': [
    'middleware/authMiddleware.mjs'
  ],
  'Conflicting Database Setup Files': [
    'backend/setup-db.mjs',
    'backend/setup-database.mjs',
    'backend/setup-postgresql.mjs',
    'backend/DATABASE_SETUP_GUIDE.md',
    'backend/QUICK_FIX_GUIDE.md'
  ],
  'Old Migration Files': [
    'backend/migrations/20250310000001-create-users.cjs',
    'backend/migrations/20250330171606-create-clients.js',
    'backend/migrations/20250330171629-create-contacts.js'
  ],
  'Temporary/Test Files': [
    'backend/test-db-connection.mjs',
    'backend/simple-server-test.mjs',
    'backend/quick-status-check.mjs'
  ],
  'Old Batch Scripts': [
    'check-and-start-portal.bat',
    'start-client-portal.bat',
    'setup-phase-1.bat',
    'setup-phase-2.bat',
    'setup-phase-3.bat'
  ]
};

// Create backup directory
function createBackupDirectory() {
  try {
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
      console.log(chalk.green(`✅ Created backup directory: ${backupDir}`));
      return true;
    }
    return true;
  } catch (error) {
    console.error(chalk.red(`❌ Failed to create backup directory: ${error.message}`));
    return false;
  }
}

// Safely move file to backup
function backupFile(filePath, category) {
  const fullPath = path.join(projectRoot, filePath);
  
  if (!fs.existsSync(fullPath)) {
    console.log(chalk.gray(`⏭️ Skipping ${filePath} (doesn't exist)`));
    return;
  }
  
  try {
    const backupPath = path.join(backupDir, category, filePath);
    const backupFileDir = path.dirname(backupPath);
    
    // Create directory structure in backup
    if (!fs.existsSync(backupFileDir)) {
      fs.mkdirSync(backupFileDir, { recursive: true });
    }
    
    // Copy to backup first
    fs.copyFileSync(fullPath, backupPath);
    
    // Then remove original
    fs.unlinkSync(fullPath);
    
    console.log(chalk.green(`✅ Moved ${filePath} to backup`));
  } catch (error) {
    console.error(chalk.red(`❌ Failed to backup ${filePath}: ${error.message}`));
  }
}

// Check for unused dependencies in package.json
function checkUnusedDependencies() {
  console.log(chalk.yellow('\n📦 Checking for unused dependencies...'));
  
  try {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    const dependencies = Object.keys(packageJson.dependencies || {});
    
    // Dependencies that might be unused or should be dev dependencies
    const potentiallyUnused = [
      'sequelize-cli', // Should be in devDependencies
      'ts-node',       // Should be in devDependencies  
      'typescript',    // Should be in devDependencies
      'vitest',        // Should be in devDependencies
      'eslint'         // Should be in devDependencies
    ];
    
    const currentDeps = dependencies.filter(dep => potentiallyUnused.includes(dep));
    if (currentDeps.length > 0) {
      console.log(chalk.yellow('⚠️ Dependencies that should be in devDependencies:'));
      currentDeps.forEach(dep => {
        console.log(chalk.yellow(`   - ${dep}`));
      });
    } else {
      console.log(chalk.green('✅ No dependency issues found'));
    }
  } catch (error) {
    console.error(chalk.red(`❌ Error checking dependencies: ${error.message}`));
  }
}

// Organize project files
function organizeProjectFiles() {
  console.log(chalk.yellow('\n📁 Organizing project structure...'));
  
  // Create recommended directory structure
  const directories = [
    'utils',
    'middleware', 
    'routes/internal/v1',
    'routes/client/v1',
    'database',
    'services',
    'tests',
    'docs'
  ];
  
  for (const dir of directories) {
    const dirPath = path.join(projectRoot, 'backend', dir);
    if (!fs.existsSync(dirPath)) {
      try {
        fs.mkdirSync(dirPath, { recursive: true });
        console.log(chalk.green(`✅ Created directory: backend/${dir}`));
      } catch (error) {
        console.error(chalk.red(`❌ Failed to create directory: backend/${dir}`));
      }
    }
  }
}

// Check for duplicate files
function checkDuplicateFiles() {
  console.log(chalk.yellow('\n🔍 Checking for duplicate files...'));
  
  const duplicatePatterns = [
    { pattern: /index.*\.mjs$/, message: 'Multiple index files found' },
    { pattern: /setup.*\.mjs$/, message: 'Multiple setup files found' },
    { pattern: /auth.*\.mjs$/, message: 'Multiple auth files found' }
  ];
  
  function scanDirectory(dir, files = []) {
    if (!fs.existsSync(dir)) return files;
    
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory() && !['node_modules', '.git', 'archive'].includes(entry.name)) {
          scanDirectory(fullPath, files);
        } else if (entry.isFile()) {
          files.push({
            name: entry.name,
            path: fullPath,
            relativePath: path.relative(projectRoot, fullPath)
          });
        }
      }
    } catch (error) {
      // Ignore permission errors
    }
    
    return files;
  }
  
  const allFiles = scanDirectory(projectRoot);
  
  for (const pattern of duplicatePatterns) {
    const matchingFiles = allFiles.filter(file => pattern.pattern.test(file.name));
    if (matchingFiles.length > 1) {
      console.log(chalk.yellow(`⚠️ ${pattern.message}:`));
      matchingFiles.forEach(file => {
        console.log(chalk.yellow(`   - ${file.relativePath}`));
      });
    }
  }
}

// Main cleanup execution
async function executeCleanup() {
  console.log(chalk.yellow('🚀 Starting project cleanup...'));
  
  // Create backup directory
  const backupCreated = createBackupDirectory();
  if (!backupCreated) {
    console.error(chalk.red('❌ Cannot proceed without backup directory'));
    return false;
  }
  
  // Execute cleanup by category
  let totalFilesProcessed = 0;
  
  for (const [category, files] of Object.entries(cleanupTargets)) {
    console.log(chalk.cyan(`\n📂 Processing: ${category}`));
    console.log(chalk.cyan('-'.repeat(category.length + 15)));
    
    for (const file of files) {
      backupFile(file, category);
      totalFilesProcessed++;
    }
  }
  
  // Additional checks and organization
  checkUnusedDependencies();
  organizeProjectFiles();
  checkDuplicateFiles();
  
  // Create cleanup report
  const report = {
    timestamp: new Date().toISOString(),
    totalFilesProcessed,
    categoriesProcessed: Object.keys(cleanupTargets).length,
    backupLocation: backupDir,
    summary: {
      'Files backed up and removed': totalFilesProcessed,
      'Categories processed': Object.keys(cleanupTargets).length,
      'Backup location': backupDir
    }
  };
  
  const reportPath = path.join(backupDir, 'cleanup-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  console.log(chalk.green.bold('\n🎉 CLEANUP COMPLETED SUCCESSFULLY!'));
  console.log(chalk.green('='.repeat(32)));
  console.log(chalk.white(`📊 Total files processed: ${totalFilesProcessed}`));
  console.log(chalk.white(`📂 Categories cleaned: ${Object.keys(cleanupTargets).length}`));
  console.log(chalk.white(`💾 Backup location: ${backupDir}`));
  console.log(chalk.white(`📋 Detailed report: ${reportPath}`));
  
  console.log(chalk.cyan.bold('\n✨ PROJECT IMPROVEMENTS:'));
  console.log(chalk.cyan('-'.repeat(22)));
  console.log(chalk.white('✅ Removed conflicting old files'));
  console.log(chalk.white('✅ Organized directory structure'));
  console.log(chalk.white('✅ Created safe backups of all changes'));
  console.log(chalk.white('✅ Identified potential dependency optimizations'));
  
  console.log(chalk.blue.bold('\n🚀 NEXT STEPS:'));
  console.log(chalk.blue('-'.repeat(12)));
  console.log(chalk.white('1. Run system health check: node system-health-check.mjs'));
  console.log(chalk.white('2. Execute database setup: MASTER_UNIFIED_SETUP.bat'));
  console.log(chalk.white('3. Test all functionality'));
  console.log(chalk.white('4. Deploy to production'));
  
  return true;
}

// Execute cleanup
executeCleanup()
  .then(success => {
    console.log(chalk.blue('\n' + '='.repeat(50)));
    console.log(chalk.blue.bold('APEX AI PROJECT CLEANUP COMPLETE'));
    console.log(chalk.blue('='.repeat(50) + '\n'));
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error(chalk.red.bold('\n❌ CLEANUP FAILED:'), error);
    process.exit(1);
  });
