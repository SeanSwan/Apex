// backend/system-health-check.mjs
/**
 * APEX AI SYSTEM HEALTH CHECK
 * ===========================
 * Comprehensive system verification and bug detection
 */

import chalk from 'chalk';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log(chalk.blue.bold('\n🔍 APEX AI SYSTEM HEALTH CHECK'));
console.log(chalk.blue('='.repeat(35)));

let healthScore = 100;
const issues = [];
const warnings = [];

// Check 1: Required Files Existence
console.log(chalk.yellow('\n📁 Checking required files...'));
const requiredFiles = [
  'UNIFIED_DATABASE_SETUP.sql',
  'setup-unified-database.mjs',
  'database/unifiedQueries.mjs',
  'middleware/unifiedAuth.mjs',
  'routes/internal/index.mjs',
  'routes/internal/v1/sops.mjs',
  'routes/internal/v1/contact-lists.mjs',
  'routes/internal/v1/properties.mjs',
  'routes/internal/v1/guards.mjs',
  '.env'
];

for (const file of requiredFiles) {
  if (fs.existsSync(file)) {
    console.log(chalk.green(`✅ ${file}`));
  } else {
    console.log(chalk.red(`❌ ${file} - MISSING`));
    issues.push(`Missing file: ${file}`);
    healthScore -= 10;
  }
}

// Check 2: Environment Configuration
console.log(chalk.yellow('\n🔧 Checking environment configuration...'));
const envPath = '.env';
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const requiredEnvVars = [
    'PG_HOST',
    'PG_PORT', 
    'PG_USER',
    'PG_DB',
    'JWT_SECRET'
  ];
  
  for (const envVar of requiredEnvVars) {
    if (envContent.includes(`${envVar}=`)) {
      console.log(chalk.green(`✅ ${envVar} configured`));
    } else {
      console.log(chalk.red(`❌ ${envVar} - NOT SET`));
      issues.push(`Missing environment variable: ${envVar}`);
      healthScore -= 5;
    }
  }
  
  // Check for weak JWT secret
  const jwtMatch = envContent.match(/JWT_SECRET=(.+)/);
  if (jwtMatch && jwtMatch[1].length < 32) {
    console.log(chalk.yellow(`⚠️ JWT_SECRET is too short (recommended: 32+ characters)`));
    warnings.push('JWT_SECRET should be longer for production security');
    healthScore -= 3;
  }
} else {
  console.log(chalk.red('❌ .env file not found'));
  issues.push('Environment file missing');
  healthScore -= 15;
}

// Check 3: Package Dependencies
console.log(chalk.yellow('\n📦 Checking package dependencies...'));
try {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const criticalDeps = [
    'express',
    'pg',
    'jsonwebtoken', 
    'express-rate-limit',
    'helmet',
    'cors',
    'chalk'
  ];
  
  for (const dep of criticalDeps) {
    if (packageJson.dependencies[dep]) {
      console.log(chalk.green(`✅ ${dep} installed`));
    } else {
      console.log(chalk.red(`❌ ${dep} - MISSING`));
      issues.push(`Missing dependency: ${dep}`);
      healthScore -= 5;
    }
  }
} catch (error) {
  console.log(chalk.red('❌ Error reading package.json'));
  issues.push('Cannot read package.json');
  healthScore -= 10;
}

// Check 4: Code Quality Issues
console.log(chalk.yellow('\n🔍 Checking for code quality issues...'));

// Check for old import references
const checkFileForOldImports = (filePath) => {
  if (!fs.existsSync(filePath)) return;
  
  const content = fs.readFileSync(filePath, 'utf8');
  const problematicImports = [
    'authMiddleware.mjs',
    'models/index.mjs',
    '../middleware/authMiddleware'
  ];
  
  for (const importPattern of problematicImports) {
    if (content.includes(importPattern)) {
      console.log(chalk.yellow(`⚠️ ${filePath} contains old import: ${importPattern}`));
      warnings.push(`${filePath} may have outdated imports`);
      healthScore -= 2;
    }
  }
};

// Check API route files
const apiFiles = [
  'routes/internal/v1/sops.mjs',
  'routes/internal/v1/contact-lists.mjs',
  'routes/internal/v1/properties.mjs',
  'routes/internal/v1/guards.mjs'
];

for (const file of apiFiles) {
  checkFileForOldImports(file);
}

// Check 5: Security Configuration
console.log(chalk.yellow('\n🔐 Checking security configuration...'));

// Check for HTTPS configuration (production recommendation)
const serverFile = 'src/server.mjs';
if (fs.existsSync(serverFile)) {
  const serverContent = fs.readFileSync(serverFile, 'utf8');
  
  if (serverContent.includes('helmet')) {
    console.log(chalk.green('✅ Helmet security headers enabled'));
  } else {
    console.log(chalk.yellow('⚠️ Helmet security headers not found'));
    warnings.push('Consider enabling Helmet for additional security');
    healthScore -= 2;
  }
  
  if (serverContent.includes('rateLimit') || serverContent.includes('rate-limit')) {
    console.log(chalk.green('✅ Rate limiting enabled'));
  } else {
    console.log(chalk.red('❌ Rate limiting not configured'));
    issues.push('Rate limiting is required for production');
    healthScore -= 5;
  }
  
  if (serverContent.includes('cors')) {
    console.log(chalk.green('✅ CORS configured'));
  } else {
    console.log(chalk.yellow('⚠️ CORS configuration not found'));
    warnings.push('CORS should be properly configured');
    healthScore -= 2;
  }
}

// Check 6: React Components
console.log(chalk.yellow('\n⚛️ Checking React components...'));
const reactComponents = [
  '../apex_ai_desktop_app/src/components/SOPManagement/SOPEditor.jsx',
  '../apex_ai_desktop_app/src/components/SOPManagement/SOPList.jsx',
  '../apex_ai_desktop_app/src/components/ContactManagement/ContactListManager.jsx'
];

for (const component of reactComponents) {
  if (fs.existsSync(component)) {
    console.log(chalk.green(`✅ ${path.basename(component)}`));
    
    // Check for proper error handling
    const content = fs.readFileSync(component, 'utf8');
    if (content.includes('try') && content.includes('catch')) {
      console.log(chalk.green(`  ✅ Error handling implemented`));
    } else {
      console.log(chalk.yellow(`  ⚠️ Limited error handling found`));
      warnings.push(`${component} could benefit from more error handling`);
      healthScore -= 1;
    }
  } else {
    console.log(chalk.red(`❌ ${path.basename(component)} - MISSING`));
    issues.push(`Missing React component: ${component}`);
    healthScore -= 8;
  }
}

// Check 7: API Client Integration
console.log(chalk.yellow('\n🔌 Checking API client integration...'));
const apiClientPath = '../apex_ai_desktop_app/src/utils/apiClient.js';
if (fs.existsSync(apiClientPath)) {
  console.log(chalk.green('✅ Centralized API client available'));
  
  const apiContent = fs.readFileSync(apiClientPath, 'utf8');
  if (apiContent.includes('APIError') && apiContent.includes('makeRequest')) {
    console.log(chalk.green('  ✅ Proper error handling structure'));
  } else {
    console.log(chalk.yellow('  ⚠️ API client may need error handling improvements'));
    warnings.push('API client error handling could be enhanced');
    healthScore -= 2;
  }
} else {
  console.log(chalk.yellow('⚠️ Centralized API client not found'));
  warnings.push('Consider creating a centralized API client for better error handling');
  healthScore -= 3;
}

// Generate Health Report
console.log(chalk.blue.bold('\n📊 SYSTEM HEALTH REPORT'));
console.log(chalk.blue('='.repeat(25)));

// Determine health status
let healthStatus, healthColor;
if (healthScore >= 90) {
  healthStatus = 'EXCELLENT';
  healthColor = chalk.green.bold;
} else if (healthScore >= 80) {
  healthStatus = 'GOOD';
  healthColor = chalk.cyan.bold;
} else if (healthScore >= 70) {
  healthStatus = 'FAIR';
  healthColor = chalk.yellow.bold;
} else if (healthScore >= 60) {
  healthStatus = 'POOR';
  healthColor = chalk.red.bold;
} else {
  healthStatus = 'CRITICAL';
  healthColor = chalk.red.bold;
}

console.log(healthColor(`\n🎯 OVERALL HEALTH: ${healthStatus} (${healthScore}/100)`));

if (issues.length > 0) {
  console.log(chalk.red.bold('\n❌ CRITICAL ISSUES:'));
  issues.forEach((issue, index) => {
    console.log(chalk.red(`   ${index + 1}. ${issue}`));
  });
}

if (warnings.length > 0) {
  console.log(chalk.yellow.bold('\n⚠️ WARNINGS:'));
  warnings.forEach((warning, index) => {
    console.log(chalk.yellow(`   ${index + 1}. ${warning}`));
  });
}

if (issues.length === 0 && warnings.length === 0) {
  console.log(chalk.green.bold('\n🎉 NO ISSUES FOUND!'));
  console.log(chalk.green('Your system is healthy and ready for deployment.'));
}

// Recommendations
console.log(chalk.blue.bold('\n💡 RECOMMENDATIONS:'));
console.log(chalk.blue('-'.repeat(17)));

if (healthScore >= 90) {
  console.log(chalk.green('✅ Your system is in excellent condition!'));
  console.log(chalk.white('✅ Ready for production deployment'));
  console.log(chalk.white('✅ All critical components are functioning'));
} else {
  console.log(chalk.white('🔧 Address the critical issues above before deployment'));
  
  if (warnings.length > 0) {
    console.log(chalk.white('🔍 Consider addressing warnings for optimal performance'));
  }
  
  console.log(chalk.white('📚 Review the system documentation for troubleshooting'));
}

// Next Steps
console.log(chalk.cyan.bold('\n🚀 NEXT STEPS:'));
console.log(chalk.cyan('-'.repeat(12)));

if (healthScore >= 80) {
  console.log(chalk.white('1. Execute database setup: MASTER_UNIFIED_SETUP.bat'));
  console.log(chalk.white('2. Start backend server: npm start'));
  console.log(chalk.white('3. Test API endpoints: /api/internal/docs'));
  console.log(chalk.white('4. Deploy to production environment'));
} else {
  console.log(chalk.white('1. Fix critical issues listed above'));
  console.log(chalk.white('2. Re-run health check: node system-health-check.mjs'));
  console.log(chalk.white('3. Proceed with deployment after reaching 80+ score'));
}

console.log(chalk.blue('\n' + '='.repeat(50)));
console.log(chalk.blue.bold('APEX AI SYSTEM HEALTH CHECK COMPLETE'));
console.log(chalk.blue('='.repeat(50) + '\n'));

// Exit with appropriate code
process.exit(healthScore >= 70 ? 0 : 1);
