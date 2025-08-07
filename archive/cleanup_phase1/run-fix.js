console.log('Clearing npm cache...');
const { execSync } = require('child_process');

try {
  // Clear npm cache
  execSync('npm cache clean --force', { stdio: 'inherit' });
  console.log('✓ npm cache cleared');
  
  // Change to frontend directory and install
  process.chdir('C:\\Users\\ogpsw\\Desktop\\defense\\frontend');
  console.log('✓ Changed to frontend directory');
  
  console.log('Installing dependencies...');
  execSync('npm install', { stdio: 'inherit' });
  console.log('✓ Dependencies installed');
  
  // Verify Vite
  console.log('Verifying Vite installation...');
  execSync('npx vite --version', { stdio: 'inherit' });
  console.log('✓ Vite verified');
  
} catch (error) {
  console.error('Error during fix:', error.message);
  process.exit(1);
}
