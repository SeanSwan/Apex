const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);

/**
 * Generate a file tree with custom depth settings
 * - Regular folders: limited to maxDepth
 * - Special folders: can go deeper
 */
async function generateCustomDepthFileTree(startPath = '.', options = {}) {
  // Default options
  const config = {
    maxDepth: 2,                   // Default max depth for most folders
    specialFolders: ['berryAdmin'], // Folders that should go deeper
    specialFoldersMaxDepth: 10,    // Max depth for special folders
    excludePatterns: [             // Always exclude these
      /^node_modules$/,
      /^\.git$/,
      /^\.DS_Store$/,
      /^\.env(\..+)?$/,
      /^\.next$/,
      /^\.cache$/,
      /^npm-debug\.log$/,
      /^yarn-debug\.log$/,
      /^yarn-error\.log$/
    ],
    ...options
  };

  // Function to check if a path should be excluded
  function shouldExclude(itemPath) {
    const basename = path.basename(itemPath);
    return config.excludePatterns.some(pattern => pattern.test(basename));
  }
  
  // Check if a path is or contains a special folder
  function isSpecialPath(itemPath, currentDepth = 0) {
    // If we're at the root level, special path detection doesn't apply yet
    if (currentDepth === 0) return false;
    
    const relativePath = path.relative(startPath, itemPath);
    const pathParts = relativePath.split(path.sep);
    
    // Check if any part of the path matches a special folder
    return config.specialFolders.some(specialFolder => 
      pathParts.some(part => part === specialFolder)
    );
  }
  
  // Function to recursively build the file tree
  async function buildTree(currentPath, currentDepth = 0, indent = '') {
    let result = '';
    
    // Check if we've reached max depth for this path
    const isSpecial = isSpecialPath(currentPath, currentDepth);
    const maxDepthForPath = isSpecial ? config.specialFoldersMaxDepth : config.maxDepth;
    
    if (currentDepth > maxDepthForPath) {
      return result + `${indent}... (more files/folders not shown)\n`;
    }
    
    try {
      const items = await readdir(currentPath);
      const filteredItems = items.filter(item => {
        const itemPath = path.join(currentPath, item);
        return !shouldExclude(itemPath);
      });
      
      for (let i = 0; i < filteredItems.length; i++) {
        const item = filteredItems[i];
        const itemPath = path.join(currentPath, item);
        const stats = await stat(itemPath);
        const isLast = i === filteredItems.length - 1;
        const prefix = indent + (isLast ? '└── ' : '├── ');
        const nextIndent = indent + (isLast ? '    ' : '│   ');
        
        // Special case: if this is a berryAdmin folder or inside one, mark it
        const isBerryAdmin = config.specialFolders.includes(item) || isSpecialPath(itemPath, currentDepth);
        const marker = isBerryAdmin ? ' 📌' : '';
        
        result += `${prefix}${item}${stats.isDirectory() ? '/' : ''}${marker}\n`;
        
        if (stats.isDirectory()) {
          // If this is berryAdmin or we're inside it, set isSpecial flag
          const nextIsSpecial = config.specialFolders.includes(item) || isSpecial;
          const subtree = await buildTree(
            itemPath, 
            currentDepth + 1, 
            nextIndent
          );
          result += subtree;
        }
      }
      
      return result;
    } catch (err) {
      console.error(`Error accessing ${currentPath}: ${err.message}`);
      return '';
    }
  }
  
  const rootDir = path.basename(path.resolve(startPath));
  console.log(`File tree for ${rootDir}:`);
  console.log(`- Regular folders: limited to ${config.maxDepth} levels deep`);
  console.log(`- Special folders (${config.specialFolders.join(', ')}): showing all levels 📌`);
  console.log(`${rootDir}/`);
  
  const tree = await buildTree(startPath);
  console.log(tree);
  
  return tree;
}

// Check if a directory was provided as a command-line argument
const targetDir = process.argv[2] || '.';

// Parse additional arguments
const specialFolders = process.argv[3] ? process.argv[3].split(',') : ['berryAdmin'];
const maxDepth = process.argv[4] ? parseInt(process.argv[4]) : 2;

// Run the function with custom options
generateCustomDepthFileTree(targetDir, {
  specialFolders: specialFolders,
  maxDepth: maxDepth
})
.catch(err => {
  console.error('Error generating file tree:', err);
});