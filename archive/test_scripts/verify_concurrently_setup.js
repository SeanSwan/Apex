#!/usr/bin/env node
/**
 * APEX AI - CONCURRENTLY SETUP VERIFICATION
 * ==========================================
 * Verifies that the concurrently setup is working correctly
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 APEX AI - Concurrently Setup Verification');
console.log('=' .repeat(50));

// Check if required files exist
const requiredFiles = [
    'package.json',
    'frontend/package.json', 
    'backend/package.json',
    'frontend/src',
    'backend/src'
];

let allFilesExist = true;

console.log('\n📁 Checking required files...');
requiredFiles.forEach(file => {
    const exists = fs.existsSync(path.join(__dirname, file));
    const status = exists ? '✅' : '❌';
    console.log(`${status} ${file}`);
    if (!exists) allFilesExist = false;
});

if (!allFilesExist) {
    console.log('\n❌ Some required files are missing!');
    process.exit(1);
}

// Check package.json scripts
console.log('\n📋 Checking package.json scripts...');

try {
    const rootPkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    const frontendPkg = JSON.parse(fs.readFileSync('frontend/package.json', 'utf8'));
    const backendPkg = JSON.parse(fs.readFileSync('backend/package.json', 'utf8'));
    
    // Check concurrently dependency
    const hasConcurrently = rootPkg.devDependencies && rootPkg.devDependencies.concurrently;
    console.log(`${hasConcurrently ? '✅' : '❌'} Concurrently dependency`);
    
    // Check start script
    const hasStartScript = rootPkg.scripts && rootPkg.scripts.start;
    const startScriptValid = hasStartScript && rootPkg.scripts.start.includes('concurrently');
    console.log(`${startScriptValid ? '✅' : '❌'} Root start script with concurrently`);
    
    // Check frontend dev script
    const frontendDev = frontendPkg.scripts && frontendPkg.scripts.dev;
    const frontendDevValid = frontendDev && frontendDev.includes('vite');
    console.log(`${frontendDevValid ? '✅' : '❌'} Frontend dev script (Vite)`);
    
    // Check backend dev script  
    const backendDev = backendPkg.scripts && backendPkg.scripts.dev;
    const backendDevValid = backendDev && backendDev.includes('nodemon');
    console.log(`${backendDevValid ? '✅' : '❌'} Backend dev script (Nodemon)`);
    
    console.log('\n🎯 Configuration Analysis:');
    console.log('─'.repeat(30));
    
    if (rootPkg.scripts) {
        console.log('📋 Available Scripts:');
        Object.keys(rootPkg.scripts).forEach(script => {
            if (['start', 'dev', 'start-frontend', 'start-backend'].includes(script)) {
                console.log(`   • ${script}: ${rootPkg.scripts[script]}`);
            }
        });
    }
    
    console.log('\n🚀 USAGE INSTRUCTIONS:');
    console.log('─'.repeat(30));
    console.log('1. Start everything:     npm start');
    console.log('2. Start frontend only:  npm run start-frontend');  
    console.log('3. Start backend only:   npm run start-backend');
    console.log('4. Alternative dev mode: npm run dev');
    
    console.log('\n📱 EXPECTED URLS:');
    console.log('─'.repeat(30));
    console.log('• Frontend Dashboard: http://localhost:3000');
    console.log('• Backend API:        http://localhost:5000');
    console.log('• Socket.io:          ws://localhost:5000');
    
    console.log('\n🎬 DEMO WORKFLOW:');
    console.log('─'.repeat(30));
    console.log('Terminal 1: npm start');
    console.log('Terminal 2: cd apex_ai_engine && python fixed_correlation_demo.py');
    console.log('Browser:    http://localhost:3000');
    
    if (startScriptValid && frontendDevValid && backendDevValid && hasConcurrently) {
        console.log('\n🎉 CONCURRENTLY SETUP IS PERFECT!');
        console.log('✅ Your npm start command will work exactly as intended');
        console.log('✅ Both frontend and backend will start simultaneously');
        console.log('✅ You\'ll see colored output for each service');
        console.log('✅ Ready for full visual correlation demo!');
    } else {
        console.log('\n⚠️  Some configuration issues detected');
        console.log('Please check the failed items above');
    }
    
} catch (error) {
    console.log(`❌ Error reading package.json files: ${error.message}`);
    process.exit(1);
}

console.log('\n' + '='.repeat(50));
