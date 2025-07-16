// COMPREHENSIVE FRONTEND TESTING SUITE
// ====================================
// Tests all frontend functionality for Phase 2 validation

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🎨 APEX AI FRONTEND COMPREHENSIVE TESTING SUITE');
console.log('==============================================\n');

// Test results tracker
const testResults = {
  passed: 0,
  failed: 0,
  warnings: 0,
  tests: []
};

function logTest(testName, status, message, details = null) {
  const timestamp = new Date().toISOString();
  const statusIcon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⚠️';
  
  console.log(`${statusIcon} ${testName}: ${message}`);
  if (details) {
    console.log(`   Details: ${details}`);
  }
  
  testResults.tests.push({
    name: testName,
    status,
    message,
    details,
    timestamp
  });
  
  if (status === 'PASS') testResults.passed++;
  else if (status === 'FAIL') testResults.failed++;
  else testResults.warnings++;
}

// Phase 1: Configuration and Structure Tests
console.log('📋 PHASE 1: FRONTEND CONFIGURATION VALIDATION\n');

// Test 1: Package.json structure and dependencies
function testPackageConfiguration() {
  const packagePath = path.resolve(__dirname, 'package.json');
  
  try {
    const packageContent = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    
    // Check critical dependencies
    const criticalDeps = [
      'react',
      'react-dom', 
      'react-router-dom',
      'styled-components',
      'socket.io-client',
      'typescript',
      'vite',
      'axios'
    ];
    
    let missingDeps = [];
    criticalDeps.forEach(dep => {
      if (!packageContent.dependencies[dep] && !packageContent.devDependencies[dep]) {
        missingDeps.push(dep);
      }
    });
    
    if (missingDeps.length === 0) {
      logTest('PACKAGE_DEPS', 'PASS', 'All critical dependencies are present');
    } else {
      logTest('PACKAGE_DEPS', 'FAIL', 'Missing critical dependencies', missingDeps.join(', '));
    }
    
    // Check scripts
    const requiredScripts = ['dev', 'build', 'typecheck'];
    let missingScripts = [];
    requiredScripts.forEach(script => {
      if (!packageContent.scripts[script]) {
        missingScripts.push(script);
      }
    });
    
    if (missingScripts.length === 0) {
      logTest('PACKAGE_SCRIPTS', 'PASS', 'All required scripts are present');
    } else {
      logTest('PACKAGE_SCRIPTS', 'WARN', 'Some scripts missing', missingScripts.join(', '));
    }
    
  } catch (error) {
    logTest('PACKAGE_CONFIG', 'FAIL', 'Package.json reading failed', error.message);
  }
}

// Test 2: TypeScript configuration
function testTypeScriptConfiguration() {
  const tsconfigPath = path.resolve(__dirname, 'tsconfig.json');
  
  try {
    const tsconfigContent = JSON.parse(fs.readFileSync(tsconfigPath, 'utf8'));
    
    // Check critical compiler options
    const compilerOptions = tsconfigContent.compilerOptions;
    
    if (compilerOptions && compilerOptions.jsx === 'react-jsx') {
      logTest('TSCONFIG_JSX', 'PASS', 'JSX configuration is correct');
    } else {
      logTest('TSCONFIG_JSX', 'FAIL', 'JSX configuration is incorrect or missing');
    }
    
    if (compilerOptions && compilerOptions.strict === true) {
      logTest('TSCONFIG_STRICT', 'PASS', 'Strict mode is enabled');
    } else {
      logTest('TSCONFIG_STRICT', 'WARN', 'Strict mode not enabled');
    }
    
    if (compilerOptions && compilerOptions.paths && compilerOptions.paths['@/*']) {
      logTest('TSCONFIG_PATHS', 'PASS', 'Path aliases are configured');
    } else {
      logTest('TSCONFIG_PATHS', 'WARN', 'Path aliases not configured');
    }
    
  } catch (error) {
    logTest('TSCONFIG', 'FAIL', 'TypeScript config reading failed', error.message);
  }
}

// Test 3: Vite configuration
function testViteConfiguration() {
  const viteConfigPath = path.resolve(__dirname, 'vite.config.ts');
  
  if (fs.existsSync(viteConfigPath)) {
    logTest('VITE_CONFIG', 'PASS', 'Vite configuration file exists');
    
    try {
      const viteConfigContent = fs.readFileSync(viteConfigPath, 'utf8');
      
      if (viteConfigContent.includes('proxy')) {
        logTest('VITE_PROXY', 'PASS', 'Backend proxy is configured');
      } else {
        logTest('VITE_PROXY', 'WARN', 'Backend proxy not found in config');
      }
      
      if (viteConfigContent.includes('@vitejs/plugin-react')) {
        logTest('VITE_REACT', 'PASS', 'React plugin is configured');
      } else {
        logTest('VITE_REACT', 'FAIL', 'React plugin not configured');
      }
      
    } catch (error) {
      logTest('VITE_READ', 'FAIL', 'Vite config reading failed', error.message);
    }
  } else {
    logTest('VITE_CONFIG', 'FAIL', 'Vite configuration file not found');
  }
}

// Phase 2: Source Code Structure Tests
console.log('\\n📦 PHASE 2: SOURCE CODE STRUCTURE VALIDATION\\n');

// Test 4: Critical source files
function testSourceStructure() {
  const criticalFiles = [
    'src/main.tsx',
    'src/App.tsx',
    'src/index.css'
  ];
  
  criticalFiles.forEach(filePath => {
    const fullPath = path.resolve(__dirname, filePath);
    if (fs.existsSync(fullPath)) {
      logTest(`FILE_${path.basename(filePath).replace('.', '_').toUpperCase()}`, 'PASS', 
        `${filePath} exists`);
    } else {
      logTest(`FILE_${path.basename(filePath).replace('.', '_').toUpperCase()}`, 'FAIL', 
        `${filePath} not found`);
    }
  });
}

// Test 5: Component directories
function testComponentStructure() {
  const criticalDirs = [
    'src/components',
    'src/components/LiveMonitoring',
    'src/hooks',
    'src/types',
    'src/services',
    'src/pages'
  ];
  
  criticalDirs.forEach(dirPath => {
    const fullPath = path.resolve(__dirname, dirPath);
    if (fs.existsSync(fullPath) && fs.lstatSync(fullPath).isDirectory()) {
      logTest(`DIR_${path.basename(dirPath).toUpperCase()}`, 'PASS', 
        `${dirPath} directory exists`);
    } else {
      logTest(`DIR_${path.basename(dirPath).toUpperCase()}`, 'FAIL', 
        `${dirPath} directory not found`);
    }
  });
}

// Test 6: Live Monitoring modular architecture
function testLiveMonitoringArchitecture() {
  const liveMonitoringPath = path.resolve(__dirname, 'src/components/LiveMonitoring');
  
  if (fs.existsSync(liveMonitoringPath)) {
    const expectedComponents = [
      'EnhancedLiveMonitoring.tsx',
      'CameraGrid',
      'AlertPanel', 
      'StatusBar',
      'types'
    ];
    
    expectedComponents.forEach(component => {
      const componentPath = path.join(liveMonitoringPath, component);
      if (fs.existsSync(componentPath)) {
        logTest(`LIVE_MONITOR_${component.toUpperCase().replace('.TSX', '')}`, 'PASS', 
          `${component} exists`);
      } else {
        logTest(`LIVE_MONITOR_${component.toUpperCase().replace('.TSX', '')}`, 'WARN', 
          `${component} not found`);
      }
    });
  } else {
    logTest('LIVE_MONITOR_DIR', 'FAIL', 'LiveMonitoring directory not found');
  }
}

// Test 7: WebSocket hook
function testWebSocketHook() {
  const wsHookPath = path.resolve(__dirname, 'src/hooks/useEnhancedWebSocket.ts');
  
  if (fs.existsSync(wsHookPath)) {
    logTest('WEBSOCKET_HOOK', 'PASS', 'Enhanced WebSocket hook exists');
    
    try {
      const hookContent = fs.readFileSync(wsHookPath, 'utf8');
      
      if (hookContent.includes('MESSAGE_TYPES')) {
        logTest('WEBSOCKET_TYPES', 'PASS', 'WebSocket message types defined');
      } else {
        logTest('WEBSOCKET_TYPES', 'WARN', 'WebSocket message types not found');
      }
      
      if (hookContent.includes('socket.io-client')) {
        logTest('WEBSOCKET_CLIENT', 'PASS', 'Socket.io client imported');
      } else {
        logTest('WEBSOCKET_CLIENT', 'FAIL', 'Socket.io client not imported');
      }
      
    } catch (error) {
      logTest('WEBSOCKET_READ', 'FAIL', 'WebSocket hook reading failed', error.message);
    }
  } else {
    logTest('WEBSOCKET_HOOK', 'FAIL', 'Enhanced WebSocket hook not found');
  }
}

// Phase 3: Dependencies Installation Tests  
console.log('\\n📦 PHASE 3: DEPENDENCIES INSTALLATION VALIDATION\\n');

// Test 8: Node modules installation
function testNodeModulesInstallation() {
  const nodeModulesPath = path.resolve(__dirname, 'node_modules');
  
  if (fs.existsSync(nodeModulesPath)) {
    logTest('NODE_MODULES', 'PASS', 'node_modules directory exists');
    
    // Check critical packages
    const criticalPackages = [
      'react',
      'react-dom',
      'styled-components',
      'socket.io-client',
      'vite',
      '@types/react'
    ];
    
    criticalPackages.forEach(pkg => {
      const pkgPath = path.join(nodeModulesPath, pkg);
      if (fs.existsSync(pkgPath)) {
        logTest(`PKG_${pkg.replace(/[@\\/]/g, '_').toUpperCase()}`, 'PASS', 
          `${pkg} installed`);
      } else {
        logTest(`PKG_${pkg.replace(/[@\\/]/g, '_').toUpperCase()}`, 'FAIL', 
          `${pkg} not installed`);
      }
    });
  } else {
    logTest('NODE_MODULES', 'FAIL', 'node_modules directory not found');
  }
}

// Test 9: Build configuration validation
function testBuildConfiguration() {
  // Check for essential build files
  const buildFiles = [
    'vite.config.ts',
    'tsconfig.json',
    'package.json'
  ];
  
  buildFiles.forEach(file => {
    const filePath = path.resolve(__dirname, file);
    if (fs.existsSync(filePath)) {
      logTest(`BUILD_${file.replace('.', '_').toUpperCase()}`, 'PASS', 
        `${file} exists for build process`);
    } else {
      logTest(`BUILD_${file.replace('.', '_').toUpperCase()}`, 'FAIL', 
        `${file} missing for build process`);
    }
  });
}

// Main test execution
async function runComprehensiveFrontendTests() {
  console.log('🎯 Starting comprehensive frontend validation...\\n');
  
  // Phase 1: Configuration
  testPackageConfiguration();
  testTypeScriptConfiguration();
  testViteConfiguration();
  
  // Phase 2: Source Structure
  testSourceStructure();
  testComponentStructure();
  testLiveMonitoringArchitecture();
  testWebSocketHook();
  
  // Phase 3: Dependencies
  testNodeModulesInstallation();
  testBuildConfiguration();
  
  // Final report
  console.log('\\n📊 COMPREHENSIVE FRONTEND TEST RESULTS');
  console.log('========================================');
  console.log(`✅ PASSED: ${testResults.passed}`);
  console.log(`⚠️  WARNINGS: ${testResults.warnings}`);
  console.log(`❌ FAILED: ${testResults.failed}`);
  console.log(`📋 TOTAL TESTS: ${testResults.tests.length}\\n`);
  
  if (testResults.failed === 0) {
    console.log('🎉 ALL CRITICAL FRONTEND TESTS PASSED!');
    console.log('📈 Frontend is ready for Phase 3 testing\\n');
    
    console.log('🚀 NEXT STEPS:');
    console.log('1. Run TypeScript check: npm run typecheck');
    console.log('2. Start frontend server: npm run dev');
    console.log('3. Test live monitoring: http://localhost:5173/live-monitoring');
    console.log('4. Proceed to AI Engine Testing (Phase 3)\\n');
  } else {
    console.log('⚠️  SOME TESTS FAILED - Review issues above');
    console.log('🔧 Fix critical issues before proceeding to Phase 3\\n');
  }
  
  return {
    success: testResults.failed === 0,
    results: testResults
  };
}

// Run the tests
runComprehensiveFrontendTests().catch(console.error);
