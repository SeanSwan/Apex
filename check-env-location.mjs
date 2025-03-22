// check-env-location.mjs
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the current file's directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define various paths to check
const paths = {
  desktop: path.resolve(process.env.USERPROFILE || process.env.HOME, 'Desktop', '.env'),
  projectRoot: path.resolve(__dirname, '.env'),
  backend: path.resolve(__dirname, 'backend', '.env')
};

console.log('Checking for .env file existence:');

// Check each path
Object.entries(paths).forEach(([location, filePath]) => {
  const exists = fs.existsSync(filePath);
  console.log(`- ${location}: ${filePath} (${exists ? 'EXISTS' : 'NOT FOUND'})`);
  
  if (exists) {
    // Read first few lines to check content (without showing sensitive data)
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const lines = content.split('\n').slice(0, 3);
      console.log(`  First few lines: ${lines.map(l => l.trim()).join(', ')}...`);
    } catch (err) {
      console.log(`  Unable to read file: ${err.message}`);
    }
  }
});

// Check for incorrect or misplaced .env files
const desktopEnvExists = fs.existsSync(paths.desktop);
const projectRootEnvExists = fs.existsSync(paths.projectRoot);
const backendEnvExists = fs.existsSync(paths.backend);

console.log('\nEnvironment file analysis:');

if (desktopEnvExists && (!projectRootEnvExists && !backendEnvExists)) {
  console.log('⚠️ WARNING: Found .env file on Desktop but not in project - this is likely causing issues!');
  console.log('Recommended action: Copy the .env file from your Desktop to your project root directory');
  
  // Offer to copy the file
  console.log('\nWould you like to copy the .env file from Desktop to your project? (y/n)');
  process.stdin.once('data', (data) => {
    const answer = data.toString().trim().toLowerCase();
    if (answer === 'y' || answer === 'yes') {
      try {
        // Copy to project root
        fs.copyFileSync(paths.desktop, paths.projectRoot);
        console.log(`✅ Copied .env file to: ${paths.projectRoot}`);
        
        // Also copy to backend if it doesn't exist
        if (!backendEnvExists) {
          fs.copyFileSync(paths.desktop, paths.backend);
          console.log(`✅ Also copied .env file to: ${paths.backend}`);
        }
        
        console.log('Please restart your application for changes to take effect.');
      } catch (err) {
        console.error(`❌ Error copying file: ${err.message}`);
      }
    } else {
      console.log('No changes made. Please manually copy your .env file to the correct location.');
    }
    process.exit(0);
  });
} else if (projectRootEnvExists && !backendEnvExists) {
  console.log('ℹ️ Found .env file in project root, but not in backend directory.');
  console.log('Recommended action: Copy the .env file to the backend directory as well');
} else if (!projectRootEnvExists && backendEnvExists) {
  console.log('ℹ️ Found .env file in backend directory, but not in project root.');
  console.log('This setup should work, but some tools might expect the .env file in the project root.');
} else if (projectRootEnvExists && backendEnvExists) {
  console.log('✅ Found .env files in both project root and backend directory - this is the optimal setup.');
} else {
  console.log('❌ No .env file found in any expected location!');
  console.log('Please create a .env file in your project root directory with the necessary environment variables.');
}

// If not waiting for user input, exit
if (!(desktopEnvExists && (!projectRootEnvExists && !backendEnvExists))) {
  process.exit(0);
}