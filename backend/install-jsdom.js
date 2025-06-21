// Install jsdom dependency for backend
const { execSync } = require('child_process');
const path = require('path');

console.log('=== Installing jsdom in backend ===');

try {
  // Change to backend directory
  process.chdir(__dirname);
  console.log('Current directory:', process.cwd());
  
  // Install jsdom
  console.log('Installing jsdom...');
  execSync('npm install jsdom --save-dev', { stdio: 'inherit' });
  
  console.log('✅ jsdom installed successfully');
  
  // Verify installation
  console.log('\nVerifying jsdom installation...');
  try {
    require('jsdom');
    console.log('✅ jsdom can be required successfully');
  } catch (requireError) {
    console.log('❌ jsdom cannot be required:', requireError.message);
  }
  
  // Show package.json changes
  const packageJson = require('./package.json');
  if (packageJson.devDependencies && packageJson.devDependencies.jsdom) {
    console.log(`✅ jsdom added to package.json: ${packageJson.devDependencies.jsdom}`);
  } else {
    console.log('❌ jsdom not found in package.json devDependencies');
  }
  
} catch (error) {
  console.error('❌ Error installing jsdom:', error.message);
  process.exit(1);
}
