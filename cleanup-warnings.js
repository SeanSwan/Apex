#!/usr/bin/env node

/**
 * Quick fix script for common ESLint warnings
 * Fixes unused React imports and other auto-fixable issues
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🧹 Cleaning up common ESLint warnings...\n');

// 1. Update browserslist database
console.log('📦 Updating browserslist database...');
try {
  execSync('npx update-browserslist-db@latest', { stdio: 'inherit' });
  console.log('✅ Browserslist updated\n');
} catch (error) {
  console.log('⚠️ Browserslist update failed (non-critical)\n');
}

// 2. Auto-fix ESLint issues
console.log('🔧 Auto-fixing ESLint issues...');
try {
  execSync('npm run lint:fix', { stdio: 'inherit', cwd: path.join(__dirname, 'frontend') });
  console.log('✅ Auto-fixable ESLint issues resolved\n');
} catch (error) {
  console.log('⚠️ Some ESLint issues require manual fixing\n');
}

// 3. Remove unused React imports from JSX files
console.log('⚛️ Removing unused React imports...');

function removeUnusedReactImports(dir) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory() && !file.includes('node_modules') && !file.includes('.git')) {
      removeUnusedReactImports(filePath);
    } else if (file.endsWith('.jsx') || file.endsWith('.tsx')) {
      let content = fs.readFileSync(filePath, 'utf8');
      
      // Check if file has JSX but imports React unnecessarily
      if (content.includes('import React') && !content.includes('React.')) {
        // Remove unused React import
        content = content.replace(/import React,?\s*{\s*([^}]*)\s*}\s*from\s*['"]react['"];?\n?/g, (match, imports) => {
          if (imports.trim()) {
            return `import { ${imports} } from 'react';\n`;
          }
          return '';
        });
        
        content = content.replace(/import React\s*from\s*['"]react['"];?\n?/g, '');
        
        fs.writeFileSync(filePath, content);
        console.log(`  ✓ Fixed ${filePath}`);
      }
    }
  });
}

const frontendSrc = path.join(__dirname, 'frontend', 'src');
if (fs.existsSync(frontendSrc)) {
  removeUnusedReactImports(frontendSrc);
  console.log('✅ Unused React imports removed\n');
}

console.log('🎉 Cleanup complete! Your development environment should be much cleaner now.\n');
console.log('💡 To see remaining warnings: npm run lint:verbose');
console.log('🚀 To start development: npm start');
