// backend/cleanup-old-files.mjs
/**
 * APEX AI PROJECT CLEANUP SCRIPT
 * ==============================
 * Archives old, inconsistent files after unified setup
 */

import fs from 'fs';
import path from 'path';
import chalk from 'chalk';

console.log(chalk.blue.bold('\n🧹 APEX AI PROJECT CLEANUP'));
console.log(chalk.blue('===========================\n'));

const projectRoot = 'C:\\Users\\APEX AI\\Desktop\\defense';
const archiveDir = path.join(projectRoot, 'archive', 'pre-unified-setup');

// Files to archive (old inconsistent files)
const filesToArchive = [
  // Old SQL setup files that conflict with unified setup
  'backend/COMPLETE_SETUP.sql',
  'backend/APEX_AI_DATABASE_SETUP.sql',
  'backend/DATABASE_SETUP_GUIDE.md',
  'backend/PGADMIN_MANUAL_SETUP.md',
  'backend/QUICK_FIX_GUIDE.md',
  'backend/TERMINAL_SETUP_GUIDE.md',
  
  // Old migration files with inconsistent schemas
  'backend/migrations/20250310000001-create-users.cjs',
  'backend/migrations/20250330171606-create-clients.js',
  'backend/migrations/20250330171629-create-contacts.js',
  
  // Conflicting setup scripts
  'backend/setup-clean-voice-database.mjs',
  'backend/setup-complete-database.mjs',
  'backend/setup-database-admin.mjs',
  'backend/setup-database-nodejs.mjs',
  'backend/setup-database.mjs',
  'backend/setup-db.mjs',
  'backend/setup-missing-tables.mjs',
  'backend/setup-postgresql.mjs',
  'backend/setup-voice-ai-compatible.mjs',
  'backend/setup-voice-ai-database.mjs',
  'backend/setup-voice-ai-final.mjs',
  'backend/setup.mjs',
  
  // Old test and verification scripts that may conflict
  'backend/test-db-connection.mjs',
  'backend/verify-database-setup.mjs',
  'backend/verify-voice-migrations.mjs',
  'backend/verify-voice-system.mjs',
  
  // Temporary and repair scripts
  'backend/comprehensive-repair.mjs',
  'backend/quick-status-check.mjs',
  'backend/simple-server-test.mjs',
  
  // Old batch files
  'backend/SETUP_MULTI_MONITOR_CORRELATION.bat',
  'backend/SETUP_RULES_CONFIGURATION.bat',
  
  // Conflicting database configurations
  'backend/apex-ai-setup.mjs',
  'backend/create-missing-tables.mjs',
  'backend/create-tables-direct.mjs',
  'backend/create-tables-postgres.mjs',
  'backend/create-tables-superuser.mjs',
  
  // Old client portal launch scripts (may have wrong config)
  'check-and-start-portal.bat',
  'execute-client-portal-startup.bat',
  'final-landing-fix.bat',
  'final-launch-with-landing.bat',
  'fix-dependencies-and-run-phase-2.bat',
  'fix-properties.bat',
  'force-restart-landing.bat',
  'start-apex-platform.bat',
  'start-client-portal-fixed.bat',
  'start-client-portal.bat',
  'start-fixed-ports.bat',
  'switch-to-real-landing.bat',
  'test-landing-routing.bat',
  
  // Old setup phases (may have wrong dependencies)
  'setup-phase-1.bat',
  'setup-phase-2-fixed.bat',
  'setup-phase-2.bat',
  'setup-phase-3-fixed.bat',
  'setup-phase-3.bat',
  'setup-phase-4.bat',
  'verify-phase-1.bat'
];

async function createArchiveDirectory() {
  try {
    if (!fs.existsSync(archiveDir)) {
      fs.mkdirSync(archiveDir, { recursive: true });
      console.log(chalk.green(`✅ Created archive directory: ${archiveDir}`));
    }
    return true;
  } catch (error) {
    console.error(chalk.red('❌ Failed to create archive directory:'), error.message);
    return false;
  }
}

async function archiveFile(relativePath) {
  const sourcePath = path.join(projectRoot, relativePath);
  const archivePath = path.join(archiveDir, relativePath);
  
  // Check if source file exists
  if (!fs.existsSync(sourcePath)) {
    console.log(chalk.gray(`⏭️ Skipping ${relativePath} (doesn't exist)`));
    return;
  }
  
  try {
    // Create directory structure in archive
    const archiveFileDir = path.dirname(archivePath);
    if (!fs.existsSync(archiveFileDir)) {
      fs.mkdirSync(archiveFileDir, { recursive: true });
    }
    
    // Copy file to archive
    fs.copyFileSync(sourcePath, archivePath);
    
    // Remove original file
    fs.unlinkSync(sourcePath);
    
    console.log(chalk.green(`✅ Archived: ${relativePath}`));
  } catch (error) {
    console.error(chalk.red(`❌ Failed to archive ${relativePath}:`), error.message);
  }
}

async function cleanupProject() {
  console.log(chalk.yellow('📁 Creating archive directory...'));
  const archiveCreated = await createArchiveDirectory();
  
  if (!archiveCreated) {
    console.error(chalk.red('❌ Cannot proceed without archive directory'));
    return false;
  }
  
  console.log(chalk.yellow(`\\n🗂️ Archiving ${filesToArchive.length} old files...`));
  
  let archivedCount = 0;
  let skippedCount = 0;
  
  for (const filePath of filesToArchive) {
    const fullPath = path.join(projectRoot, filePath);
    if (fs.existsSync(fullPath)) {
      await archiveFile(filePath);
      archivedCount++;
    } else {
      skippedCount++;
    }
  }
  
  console.log(chalk.green(`\\n📊 Cleanup Summary:`));
  console.log(chalk.cyan(`   ✅ Archived: ${archivedCount} files`));
  console.log(chalk.gray(`   ⏭️ Skipped: ${skippedCount} files (didn't exist)`));
  
  // Create a cleanup log
  const cleanupLog = {
    timestamp: new Date().toISOString(),
    archivedFiles: filesToArchive.filter(file => 
      fs.existsSync(path.join(archiveDir, file))
    ),
    summary: {
      totalFilesProcessed: filesToArchive.length,
      archivedCount,
      skippedCount
    }
  };
  
  const logPath = path.join(archiveDir, 'cleanup-log.json');
  fs.writeFileSync(logPath, JSON.stringify(cleanupLog, null, 2));
  console.log(chalk.blue(`📝 Cleanup log saved: ${logPath}`));
  
  console.log(chalk.green.bold('\\n🎉 PROJECT CLEANUP COMPLETE!'));
  console.log(chalk.white('Old conflicting files have been safely archived.'));
  console.log(chalk.white('Your project now has a clean foundation for the unified system.'));
  
  return true;
}

// Execute cleanup
cleanupProject()
  .then(success => {
    if (success) {
      console.log(chalk.green('\\n✅ Cleanup completed successfully'));
    } else {
      console.log(chalk.red('\\n❌ Cleanup completed with errors'));
    }
  })
  .catch(error => {
    console.error(chalk.red('\\n❌ Cleanup failed:'), error);
  });
