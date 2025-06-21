const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔍 DEFENSE PROJECT - DEPENDENCY VERIFICATION');
console.log('==========================================');

function checkFileExists(filePath, description) {
  const exists = fs.existsSync(filePath);
  console.log(`${exists ? '✅' : '❌'} ${description}: ${exists ? 'EXISTS' : 'MISSING'}`);
  return exists;
}

function checkPackageInstalled(packageName, directory, description) {
  try {
    process.chdir(directory);
    execSync(`npm list ${packageName}`, { stdio: 'pipe' });
    console.log(`✅ ${description}: ${packageName} is installed`);
    return true;
  } catch (error) {
    console.log(`❌ ${description}: ${packageName} is missing`);
    return false;
  }
}

function testImport(modulePath, description) {
  try {
    require(modulePath);
    console.log(`✅ ${description}: Can import successfully`);
    return true;
  } catch (error) {
    console.log(`❌ ${description}: Import failed - ${error.message}`);
    return false;
  }
}

async function verifyInstallation() {
  const projectRoot = path.resolve(__dirname);
  const frontendDir = path.join(projectRoot, 'frontend');
  const backendDir = path.join(projectRoot, 'backend');
  
  console.log(`📁 Project root: ${projectRoot}\n`);
  
  // Check directories exist
  console.log('=== DIRECTORY STRUCTURE ===');
  checkFileExists(frontendDir, 'Frontend directory');
  checkFileExists(backendDir, 'Backend directory');
  checkFileExists(path.join(frontendDir, 'package.json'), 'Frontend package.json');
  checkFileExists(path.join(backendDir, 'package.json'), 'Backend package.json');
  
  // Check node_modules
  console.log('\n=== NODE_MODULES ===');
  checkFileExists(path.join(frontendDir, 'node_modules'), 'Frontend node_modules');
  checkFileExists(path.join(backendDir, 'node_modules'), 'Backend node_modules');
  
  // Check backend dependencies
  console.log('\n=== BACKEND DEPENDENCIES ===');
  const originalDir = process.cwd();
  
  checkPackageInstalled('jsdom', backendDir, 'Backend');
  checkPackageInstalled('express', backendDir, 'Backend');
  checkPackageInstalled('cors', backendDir, 'Backend');
  
  // Test backend jsdom import
  try {
    process.chdir(backendDir);
    const jsdom = require('jsdom');
    console.log('✅ Backend: jsdom can be required and used');
  } catch (error) {
    console.log('❌ Backend: jsdom import failed -', error.message);
  }
  
  // Check frontend dependencies
  console.log('\n=== FRONTEND DEPENDENCIES ===');
  checkPackageInstalled('lucide-react', frontendDir, 'Frontend');
  checkPackageInstalled('@radix-ui/react-toast', frontendDir, 'Frontend');
  checkPackageInstalled('@radix-ui/react-slot', frontendDir, 'Frontend');
  checkPackageInstalled('class-variance-authority', frontendDir, 'Frontend');
  checkPackageInstalled('tailwind-merge', frontendDir, 'Frontend');
  checkPackageInstalled('@radix-ui/react-label', frontendDir, 'Frontend');
  checkPackageInstalled('@radix-ui/react-tabs', frontendDir, 'Frontend');
  checkPackageInstalled('@radix-ui/react-switch', frontendDir, 'Frontend');
  checkPackageInstalled('vite', frontendDir, 'Frontend');
  checkPackageInstalled('react', frontendDir, 'Frontend');
  
  // Test critical frontend imports (in Node context)
  console.log('\n=== FRONTEND IMPORT TESTS ===');
  process.chdir(frontendDir);
  
  try {
    // Test if we can at least require the packages that should work in Node
    const classVarianceAuthority = require('class-variance-authority');
    console.log('✅ Frontend: class-variance-authority can be required');
  } catch (error) {
    console.log('❌ Frontend: class-variance-authority import failed');
  }
  
  try {
    const tailwindMerge = require('tailwind-merge');
    console.log('✅ Frontend: tailwind-merge can be required');
  } catch (error) {
    console.log('❌ Frontend: tailwind-merge import failed');
  }
  
  // Check if critical files exist
  console.log('\n=== CRITICAL FILES ===');
  checkFileExists(path.join(frontendDir, 'src'), 'Frontend src directory');
  checkFileExists(path.join(frontendDir, 'vite.config.ts'), 'Vite config');
  checkFileExists(path.join(backendDir, 'src', 'server.mjs'), 'Backend server file');
  checkFileExists(path.join(backendDir, 'utils', 'sanitizers.mjs'), 'Backend sanitizers (problematic file)');
  
  // Test if the problematic backend file can be imported
  console.log('\n=== BACKEND IMPORT TESTS ===');
  process.chdir(backendDir);
  
  try {
    // This was the failing import
    const sanitizers = await import('./utils/sanitizers.mjs');
    console.log('✅ Backend: sanitizers.mjs imports successfully (jsdom fixed)');
  } catch (error) {
    console.log('❌ Backend: sanitizers.mjs still failing -', error.message);
  }
  
  // Return to original directory
  process.chdir(originalDir);
  
  console.log('\n🎯 VERIFICATION COMPLETE');
  console.log('=======================');
  console.log('If all items above show ✅, your dependencies are fixed!');
  console.log('\nNext steps:');
  console.log('1. Run: npm start');
  console.log('2. Both frontend and backend should start without dependency errors');
  console.log('3. Test at: http://localhost:5173 (frontend) and http://localhost:5000/api/health (backend)');
}

verifyInstallation().catch(error => {
  console.error('💥 Verification error:', error);
});
