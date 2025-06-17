#!/usr/bin/env node

/**
 * Simple cleanup script - Just update browserslist
 */

const { execSync } = require('child_process');

console.log('🧹 Updating browserslist database...\n');

try {
  execSync('npx update-browserslist-db@latest', { stdio: 'inherit' });
  console.log('\n✅ Browserslist updated successfully!');
  console.log('🚀 Your development environment is ready!');
} catch (error) {
  console.log('\n⚠️ Browserslist update failed (non-critical)');
  console.log('🚀 You can still continue with development!');
}
