// Save this as findReferences.js in your project root

const fs = require('fs');
const path = require('path');

// Configuration
const searchString = 'oldserver.mjs';
const directoriesToSearch = [
  path.join(__dirname, 'backend', 'routes'),
  path.join(__dirname, 'backend', 'middleware'),
  path.join(__dirname, 'backend', 'models'),
  path.join(__dirname, 'backend', 'services'),
  path.join(__dirname, 'backend', 'src')
];

// Function to search for the string in a file
function searchInFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    
    let foundReferences = false;
    
    lines.forEach((line, lineNumber) => {
      if (line.includes(searchString)) {
        console.log(`Found in ${filePath} at line ${lineNumber + 1}:`);
        console.log(`  ${line.trim()}`);
        foundReferences = true;
      }
    });
    
    return foundReferences;
  } catch (error) {
    console.error(`Error reading file ${filePath}:`, error.message);
    return false;
  }
}

// Function to recursively search directories
function searchDirectory(dirPath) {
  try {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      
      if (entry.isDirectory()) {
        // Skip node_modules and dist directories
        if (entry.name !== 'node_modules' && entry.name !== 'dist') {
          searchDirectory(fullPath);
        }
      } else if (entry.isFile() && (
        entry.name.endsWith('.js') || 
        entry.name.endsWith('.mjs') || 
        entry.name.endsWith('.ts'))) {
        searchInFile(fullPath);
      }
    }
  } catch (error) {
    console.error(`Error searching directory ${dirPath}:`, error.message);
  }
}

// Main execution
console.log(`Searching for references to '${searchString}'...`);

directoriesToSearch.forEach(dir => {
  if (fs.existsSync(dir)) {
    console.log(`Searching in ${dir}...`);
    searchDirectory(dir);
  } else {
    console.log(`Directory not found: ${dir}`);
  }
});

console.log('Search completed.');