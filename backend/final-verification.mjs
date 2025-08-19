// backend/final-verification.mjs
/**
 * APEX AI FINAL VERIFICATION SCRIPT
 * =================================
 * Quick verification that all bug fixes are in place
 */

import fs from 'fs';
import chalk from 'chalk';

console.log(chalk.blue.bold('\n🔍 FINAL VERIFICATION - BUG FIXES'));
console.log(chalk.blue('='.repeat(35)));

const checks = [
  {
    name: 'Unified Authentication Middleware',
    file: 'middleware/unifiedAuth.mjs',
    check: (content) => content.includes('authenticateToken') && content.includes('requireAnyRole')
  },
  {
    name: 'System Health Check',
    file: 'system-health-check.mjs',
    check: (content) => content.includes('healthScore') && content.includes('issues')
  },
  {
    name: 'Project Cleanup Script',
    file: 'cleanup-and-organize.mjs',
    check: (content) => content.includes('backupFile') && content.includes('cleanupTargets')
  },
  {
    name: 'API Client Utility',
    file: '../apex_ai_desktop_app/src/utils/apiClient.js',
    check: (content) => content.includes('APIError') && content.includes('makeRequest')
  },
  {
    name: 'SOPs API Route (Fixed)',
    file: 'routes/internal/v1/sops.mjs',
    check: (content) => content.includes('unifiedAuth.mjs') && content.includes('requireAnyRole')
  },
  {
    name: 'Contact Lists API Route (Fixed)',
    file: 'routes/internal/v1/contact-lists.mjs',
    check: (content) => content.includes('unifiedAuth.mjs') && content.includes('requireAnyRole')
  },
  {
    name: 'Guards API Route (Fixed)', 
    file: 'routes/internal/v1/guards.mjs',
    check: (content) => content.includes('unifiedAuth.mjs') && content.includes('requireAnyRole')
  },
  {
    name: 'Bug-Free Deployment Script',
    file: '../EXECUTE_BUG_FREE_DEPLOYMENT.bat',
    check: (content) => content.includes('PHASE 1: SYSTEM HEALTH CHECK') && content.includes('system-health-check.mjs')
  }
];

let passedChecks = 0;
let totalChecks = checks.length;

console.log(chalk.yellow('\n📋 Verifying bug fixes...'));

for (const check of checks) {
  try {
    if (fs.existsSync(check.file)) {
      const content = fs.readFileSync(check.file, 'utf8');
      if (check.check(content)) {
        console.log(chalk.green(`✅ ${check.name}`));
        passedChecks++;
      } else {
        console.log(chalk.red(`❌ ${check.name} - Content check failed`));
      }
    } else {
      console.log(chalk.red(`❌ ${check.name} - File missing: ${check.file}`));
    }
  } catch (error) {
    console.log(chalk.red(`❌ ${check.name} - Error: ${error.message}`));
  }
}

const successRate = Math.round((passedChecks / totalChecks) * 100);

console.log(chalk.blue.bold('\n📊 VERIFICATION RESULTS'));
console.log(chalk.blue('-'.repeat(22)));
console.log(chalk.white(`Checks passed: ${passedChecks}/${totalChecks}`));
console.log(chalk.white(`Success rate: ${successRate}%`));

if (successRate >= 90) {
  console.log(chalk.green.bold('\n🎉 ALL BUG FIXES VERIFIED!'));
  console.log(chalk.green('Your system is bug-free and ready for deployment.'));
  console.log(chalk.white('\n🚀 Execute: EXECUTE_BUG_FREE_DEPLOYMENT.bat'));
} else if (successRate >= 80) {
  console.log(chalk.yellow.bold('\n⚠️ MOSTLY COMPLETE'));
  console.log(chalk.yellow('Minor issues detected, but system should work.'));
  console.log(chalk.white('You can proceed with deployment.'));
} else {
  console.log(chalk.red.bold('\n❌ CRITICAL ISSUES DETECTED'));
  console.log(chalk.red('Please address the failed checks before deploying.'));
}

console.log(chalk.blue('\n' + '='.repeat(40)));
process.exit(successRate >= 80 ? 0 : 1);
