/**
 * FIND TYPESCRIPT INTERFACE IN APP.JSX
 * ===================================
 * Show the exact line with the issue
 */

import fs from 'fs';

const filePath = '../frontend/src/App.jsx';

try {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  
  console.log('🔍 Searching for TypeScript syntax around line 144...\n');
  
  // Show lines around 144
  const startLine = Math.max(0, 144 - 5);
  const endLine = Math.min(lines.length - 1, 144 + 5);
  
  for (let i = startLine; i <= endLine; i++) {
    const lineNumber = i + 1;
    const line = lines[i];
    const isTargetLine = lineNumber === 144;
    
    if (line && line.includes('interface')) {
      console.log(`❌ Line ${lineNumber}: ${line.trim()}`);
      console.log(`   ^^^ THIS IS THE PROBLEM LINE ^^^`);
    } else if (isTargetLine) {
      console.log(`➤  Line ${lineNumber}: ${line ? line.trim() : '(empty)'}`);
    } else {
      console.log(`   Line ${lineNumber}: ${line ? line.trim() : '(empty)'}`);
    }
  }
  
  // Search for all instances of 'interface'
  console.log('\n🔎 All instances of "interface" in the file:');
  lines.forEach((line, index) => {
    if (line.includes('interface') && !line.includes('//')) {
      console.log(`❌ Line ${index + 1}: ${line.trim()}`);
    }
  });
  
} catch (error) {
  console.error('Error reading file:', error.message);
}
