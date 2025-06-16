/**
 * Check specific line 144 of App.jsx
 */

import fs from 'fs';

try {
  const content = fs.readFileSync('../frontend/src/App.jsx', 'utf8');
  const lines = content.split('\n');
  
  console.log('🔍 Checking line 144 specifically...\n');
  
  if (lines.length >= 144) {
    console.log(`Line 144: "${lines[143]}"`);
    console.log(`Line 143: "${lines[142]}"`);
    console.log(`Line 145: "${lines[144]}"`);
    
    // Check for interface keyword
    if (lines[143].includes('interface')) {
      console.log('❌ Found "interface" keyword on line 144');
    } else {
      console.log('✅ No "interface" keyword found on line 144');
    }
    
    // Let's also search for all lines containing "interface"
    console.log('\n🔍 All lines containing "interface":');
    lines.forEach((line, index) => {
      if (line.includes('interface') && !line.includes('//')) {
        console.log(`Line ${index + 1}: "${line.trim()}"`);
      }
    });
    
  } else {
    console.log(`File only has ${lines.length} lines, line 144 doesn't exist`);
  }
  
} catch (error) {
  console.log('Error:', error.message);
}
