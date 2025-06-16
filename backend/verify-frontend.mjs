/**
 * APEX AI FRONTEND - FILE VERIFICATION
 * ===================================
 * Check for TypeScript syntax in JavaScript files
 */

import fs from 'fs';
import path from 'path';

console.log('🔍 Checking frontend files for TypeScript syntax issues...\n');

function checkFile(filePath, fileName) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    const issues = [];
    
    lines.forEach((line, index) => {
      const lineNumber = index + 1;
      
      // Check for TypeScript syntax in .jsx files
      if (line.includes(': React.FC')) {
        issues.push(`Line ${lineNumber}: TypeScript annotation ': React.FC' found`);
      }
      if (line.includes(': React.Component')) {
        issues.push(`Line ${lineNumber}: TypeScript annotation ': React.Component' found`);
      }
      if (line.match(/const\s+\w+:\s*\w+\s*=/)) {
        issues.push(`Line ${lineNumber}: Possible TypeScript type annotation found`);
      }
      if (line.includes('interface ') && !line.includes('//') && !line.includes('Mobile App Interface')) {
        issues.push(`Line ${lineNumber}: TypeScript interface found`);
      }
    });
    
    if (issues.length === 0) {
      console.log(`✅ ${fileName} - Clean (no TypeScript syntax)`);
    } else {
      console.log(`❌ ${fileName} - Issues found:`);
      issues.forEach(issue => console.log(`   ${issue}`));
    }
    
    return issues.length === 0;
    
  } catch (error) {
    console.log(`⚠️ ${fileName} - Could not read: ${error.message}`);
    return false;
  }
}

function checkFrontendFiles() {
  const frontendPath = '../frontend/src';
  const files = [
    'App.jsx',
    'App.tsx', // Check if this exists
    'index.js',
    'index.tsx' // Check if this exists
  ];
  
  let allClean = true;
  
  files.forEach(file => {
    const fullPath = path.join(frontendPath, file);
    if (fs.existsSync(fullPath)) {
      const isClean = checkFile(fullPath, file);
      allClean = allClean && isClean;
    } else {
      console.log(`ℹ️ ${file} - File does not exist (OK)`);
    }
  });
  
  console.log('\n📋 SUMMARY');
  console.log('===========');
  
  if (allClean) {
    console.log('✅ All checked files are clean of TypeScript syntax');
    console.log('🎯 Frontend should start without TypeScript errors');
    console.log('\n🚀 Next steps:');
    console.log('   1. cd ../frontend');
    console.log('   2. npm run dev');
  } else {
    console.log('❌ TypeScript syntax found in JavaScript files');
    console.log('🔧 Run the frontend fix script:');
    console.log('   fix-frontend.bat');
  }
  
  console.log('\n💡 If errors persist:');
  console.log('   - Clear browser cache (Ctrl+Shift+R)');
  console.log('   - Restart Vite dev server');
  console.log('   - Check for .d.ts files that might be interfering');
}

checkFrontendFiles();
