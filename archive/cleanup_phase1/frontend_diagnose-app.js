// Quick diagnostic script to check app status
const fs = require('fs');
const path = require('path');

console.log('🔍 DIAGNOSING APP ISSUES...\n');

// Check if key files exist
const filesToCheck = [
  'src/App.jsx',
  'src/main.jsx', 
  'src/components/Header/header.component.jsx',
  'src/components/HomePage/IntegratedHomePage.jsx',
  'src/components/Reports/EnhancedReportBuilder.tsx',
  'src/pages/ReportBuilder.tsx',
  'src/context/AuthContext.jsx',
  'package.json'
];

console.log('1. FILE EXISTENCE CHECK:');
filesToCheck.forEach(file => {
  const fullPath = path.join(__dirname, file);
  const exists = fs.existsSync(fullPath);
  console.log(`   ${exists ? '✅' : '❌'} ${file}`);
});

// Check package.json for critical dependencies
console.log('\n2. CRITICAL DEPENDENCIES CHECK:');
try {
  const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'), 'utf8'));
  const criticalDeps = [
    'react',
    'react-dom', 
    'react-router-dom',
    'styled-components',
    'framer-motion'
  ];
  
  criticalDeps.forEach(dep => {
    const hasMainDep = packageJson.dependencies?.[dep];
    const hasDevDep = packageJson.devDependencies?.[dep];
    const version = hasMainDep || hasDevDep;
    console.log(`   ${version ? '✅' : '❌'} ${dep}: ${version || 'MISSING'}`);
  });
} catch (error) {
  console.log('   ❌ Error reading package.json:', error.message);
}

// Check for syntax errors in main files
console.log('\n3. SYNTAX CHECK:');
const mainFiles = [
  'src/App.jsx',
  'src/main.jsx',
  'src/components/Header/header.component.jsx'
];

mainFiles.forEach(file => {
  try {
    const content = fs.readFileSync(path.join(__dirname, file), 'utf8');
    // Basic syntax checks
    const hasImportErrors = content.includes('import') && !content.match(/import\s+\w/);
    const hasExportErrors = !content.includes('export');
    const hasBracketMismatch = (content.match(/\{/g) || []).length !== (content.match(/\}/g) || []).length;
    
    if (hasImportErrors || hasExportErrors || hasBracketMismatch) {
      console.log(`   ⚠️  ${file}: Potential syntax issues detected`);
    } else {
      console.log(`   ✅ ${file}: Basic syntax looks good`);
    }
  } catch (error) {
    console.log(`   ❌ ${file}: Cannot read file`);
  }
});

console.log('\n4. QUICK FIXES TO TRY:');
console.log('   🔧 Run: npm install');
console.log('   🔧 Run: npm run dev');
console.log('   🔧 Clear browser cache and localStorage');
console.log('   🔧 Check browser console for errors');
console.log('   🔧 Try navigating directly to "/" in browser');

console.log('\n✨ DIAGNOSIS COMPLETE!');
