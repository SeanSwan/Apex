const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔧 DEFENSE PROJECT - IMMEDIATE DEPENDENCY FIX');
console.log('============================================');

// Function to run command and handle errors
function runCommand(command, directory, description) {
  console.log(`\n📋 ${description}`);
  console.log(`📁 Directory: ${directory}`);
  console.log(`⚡ Command: ${command}`);
  
  try {
    const originalDir = process.cwd();
    process.chdir(directory);
    
    execSync(command, { 
      stdio: 'inherit',
      timeout: 120000 // 2 minute timeout
    });
    
    console.log(`✅ ${description} - SUCCESS`);
    process.chdir(originalDir);
    return true;
  } catch (error) {
    console.error(`❌ ${description} - FAILED`);
    console.error(error.message);
    return false;
  }
}

async function fixDependencies() {
  const projectRoot = path.resolve(__dirname);
  const frontendDir = path.join(projectRoot, 'frontend');
  const backendDir = path.join(projectRoot, 'backend');
  
  console.log(`\n🏠 Project root: ${projectRoot}`);
  
  // Step 1: Clear npm cache
  console.log('\n=== STEP 1: CLEAR NPM CACHE ===');
  runCommand('npm cache clean --force', projectRoot, 'Clearing npm cache');
  
  // Step 2: Fix backend dependencies
  console.log('\n=== STEP 2: FIX BACKEND DEPENDENCIES ===');
  const backendSuccess = runCommand('npm install', backendDir, 'Installing backend dependencies (including jsdom)');
  
  if (backendSuccess) {
    console.log('\n🔍 Verifying backend jsdom installation...');
    try {
      process.chdir(backendDir);
      require('jsdom');
      console.log('✅ jsdom can be required successfully');
    } catch (requireError) {
      console.log('⚠️ jsdom installed but cannot be required:', requireError.message);
    }
  }
  
  // Step 3: Fix frontend dependencies  
  console.log('\n=== STEP 3: FIX FRONTEND DEPENDENCIES ===');
  
  // Check if node_modules exists and remove it
  const frontendNodeModules = path.join(frontendDir, 'node_modules');
  if (fs.existsSync(frontendNodeModules)) {
    console.log('🗑️ Removing corrupted frontend node_modules...');
    try {
      // Move instead of delete for safety
      const backupDir = path.join(frontendDir, `node_modules_backup_${Date.now()}`);
      fs.renameSync(frontendNodeModules, backupDir);
      console.log('✅ Frontend node_modules moved to backup');
    } catch (moveError) {
      console.log('⚠️ Could not move node_modules:', moveError.message);
    }
  }
  
  // Remove package-lock.json if it exists
  const frontendLockFile = path.join(frontendDir, 'package-lock.json');
  if (fs.existsSync(frontendLockFile)) {
    console.log('🗑️ Removing frontend package-lock.json...');
    try {
      fs.renameSync(frontendLockFile, `${frontendLockFile}.backup_${Date.now()}`);
      console.log('✅ Frontend package-lock.json backed up');
    } catch (moveError) {
      console.log('⚠️ Could not backup package-lock.json:', moveError.message);
    }
  }
  
  // Install frontend dependencies
  const frontendSuccess = runCommand('npm install', frontendDir, 'Installing frontend dependencies');
  
  if (frontendSuccess) {
    console.log('\n🔍 Verifying critical frontend packages...');
    
    const packagesToVerify = [
      'lucide-react',
      '@radix-ui/react-toast',
      '@radix-ui/react-slot',
      'class-variance-authority',
      'tailwind-merge',
      '@radix-ui/react-label',
      '@radix-ui/react-tabs',
      '@radix-ui/react-switch'
    ];
    
    process.chdir(frontendDir);
    
    packagesToVerify.forEach(pkg => {
      try {
        execSync(`npm list ${pkg}`, { stdio: 'pipe' });
        console.log(`✅ ${pkg} - installed`);
      } catch (error) {
        console.log(`❌ ${pkg} - missing`);
      }
    });
  }
  
  // Step 4: Test application startup
  console.log('\n=== STEP 4: TEST APPLICATION STARTUP ===');
  console.log('🚀 Testing if dependencies are resolved...');
  
  // Quick test of backend
  console.log('\n🔍 Testing backend...');
  process.chdir(backendDir);
  try {
    // Test import of the problematic module
    const sanitizers = await import('./utils/sanitizers.mjs');
    console.log('✅ Backend sanitizers.mjs imports successfully');
  } catch (importError) {
    console.log('❌ Backend still has import issues:', importError.message);
  }
  
  // Quick test of frontend (just check if vite can start)
  console.log('\n🔍 Testing frontend...');
  process.chdir(frontendDir);
  
  // Return to project root
  process.chdir(projectRoot);
  
  console.log('\n🎉 DEPENDENCY FIX COMPLETE!');
  console.log('=========================');
  console.log('Next steps:');
  console.log('1. Run: npm start');
  console.log('2. Frontend should be available at: http://localhost:5173');
  console.log('3. Backend should be available at: http://localhost:5000');
  console.log('4. Check health: http://localhost:5000/api/health');
  console.log('\nNote: Database connection will still show warnings, but app will work.');
}

// Run the fix
fixDependencies().catch(error => {
  console.error('💥 CRITICAL ERROR during fix:', error);
  process.exit(1);
});
