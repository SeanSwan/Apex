/**
 * APEX AI ADMIN DASHBOARD QUICK VALIDATION
 * ========================================
 * Quick validation script to verify the completed implementation
 */

const fs = require('fs').promises;
const path = require('path');

async function validateImplementation() {
  console.log('🔍 APEX AI Admin Dashboard Implementation Validation\n');
  
  const validationResults = [];
  
  // Check required files
  const requiredFiles = [
    {
      path: './apex_ai_desktop_app/src/components/Dashboard/AdminDashboard.js',
      description: 'Main AdminDashboard component'
    },
    {
      path: './apex_ai_desktop_app/src/components/Dashboard/EnhancedCard.js',
      description: 'EnhancedCard component'
    },
    {
      path: './apex_ai_desktop_app/src/components/Dashboard/AdminDashboardSync.js',
      description: 'Sync integration'
    },
    {
      path: './apex_ai_desktop_app/src/App.js',
      description: 'Updated App.js with AdminDashboard'
    }
  ];

  console.log('📂 Checking required files...');
  for (const file of requiredFiles) {
    try {
      const stats = await fs.stat(file.path);
      const sizeKB = Math.round(stats.size / 1024);
      console.log(`  ✅ ${file.description}: ${sizeKB}KB`);
      validationResults.push({ file: file.description, status: 'Found', size: sizeKB });
    } catch (error) {
      console.log(`  ❌ ${file.description}: Not found`);
      validationResults.push({ file: file.description, status: 'Missing', error: error.message });
    }
  }

  // Check specific fix for Response Time card
  console.log('\n🔧 Checking the fixed Response Time card...');
  try {
    const adminDashboardContent = await fs.readFile('./apex_ai_desktop_app/src/components/Dashboard/AdminDashboard.js', 'utf8');
    
    // Check for the completed Response Time card with the fixed variant
    const hasResponseTimeCard = adminDashboardContent.includes('Response Time');
    const hasHistoryAction = adminDashboardContent.includes('response_history');
    const hasVariantSecondary = adminDashboardContent.includes("variant: 'secondary'");
    
    if (hasResponseTimeCard && hasHistoryAction && hasVariantSecondary) {
      console.log('  ✅ Response Time card: FIXED - variant: "secondary" completed');
      validationResults.push({ check: 'Response Time Fix', status: 'Complete' });
    } else {
      console.log('  ❌ Response Time card: Fix not found');
      validationResults.push({ check: 'Response Time Fix', status: 'Incomplete' });
    }
  } catch (error) {
    console.log('  ❌ Could not validate Response Time fix');
    validationResults.push({ check: 'Response Time Fix', status: 'Error', error: error.message });
  }

  // Check all 6 dashboard cards
  console.log('\n📊 Checking dashboard cards...');
  try {
    const adminDashboardContent = await fs.readFile('./apex_ai_desktop_app/src/components/Dashboard/AdminDashboard.js', 'utf8');
    
    const cards = [
      { name: 'System Health', check: 'systemHealth' },
      { name: 'Response Time', check: 'responseTime' },
      { name: 'AI Confidence', check: 'aiConfidence' },
      { name: 'Active Incidents', check: 'activeIncidents' },
      { name: 'Evidence Management', check: 'evidenceManagement' },
      { name: 'Property Statistics', check: 'propertyStats' }
    ];
    
    cards.forEach(card => {
      if (adminDashboardContent.includes(card.check)) {
        console.log(`  ✅ ${card.name} card: Implemented`);
        validationResults.push({ card: card.name, status: 'Implemented' });
      } else {
        console.log(`  ❌ ${card.name} card: Missing`);
        validationResults.push({ card: card.name, status: 'Missing' });
      }
    });
  } catch (error) {
    console.log('  ❌ Could not validate dashboard cards');
  }

  // Check App.js integration
  console.log('\n🔗 Checking App.js integration...');
  try {
    const appContent = await fs.readFile('./apex_ai_desktop_app/src/App.js', 'utf8');
    
    const hasImport = appContent.includes("import AdminDashboard from './components/Dashboard/AdminDashboard'");
    const hasTab = appContent.includes("id: 'admin-dashboard'");
    const isDefault = appContent.includes("useState('admin-dashboard')");
    
    if (hasImport && hasTab && isDefault) {
      console.log('  ✅ App.js integration: Complete - AdminDashboard is default tab');
      validationResults.push({ integration: 'App.js', status: 'Complete' });
    } else {
      console.log('  ⚠️  App.js integration: Partial');
      validationResults.push({ integration: 'App.js', status: 'Partial' });
    }
  } catch (error) {
    console.log('  ❌ Could not validate App.js integration');
  }

  // Summary
  console.log('\n📋 VALIDATION SUMMARY:');
  const fileChecks = validationResults.filter(r => r.file);
  const foundFiles = fileChecks.filter(r => r.status === 'Found').length;
  const totalFiles = fileChecks.length;
  
  console.log(`  Files: ${foundFiles}/${totalFiles} found`);
  
  const responseTimeFix = validationResults.find(r => r.check === 'Response Time Fix');
  if (responseTimeFix?.status === 'Complete') {
    console.log('  ✅ Response Time card fix: VERIFIED');
  } else {
    console.log('  ❌ Response Time card fix: NOT VERIFIED');
  }
  
  const cardChecks = validationResults.filter(r => r.card);
  const implementedCards = cardChecks.filter(r => r.status === 'Implemented').length;
  console.log(`  Dashboard cards: ${implementedCards}/6 implemented`);
  
  const integration = validationResults.find(r => r.integration);
  if (integration?.status === 'Complete') {
    console.log('  ✅ App.js integration: COMPLETE');
  } else {
    console.log('  ⚠️  App.js integration: Needs review');
  }

  if (foundFiles === totalFiles && responseTimeFix?.status === 'Complete' && implementedCards === 6) {
    console.log('\n🎉 VALIDATION RESULT: ✅ IMPLEMENTATION COMPLETE!');
    console.log('   The token cutoff issue has been resolved.');
    console.log('   AdminDashboard is ready for testing.');
  } else {
    console.log('\n⚠️  VALIDATION RESULT: Implementation needs attention');
  }
  
  console.log('\n🚀 NEXT STEPS:');
  console.log('  1. cd apex_ai_desktop_app');
  console.log('  2. npm start');
  console.log('  3. Verify AdminDashboard tab loads with Response Time card');
  
  return validationResults;
}

// Run validation
if (require.main === module) {
  validateImplementation().catch(console.error);
}

module.exports = { validateImplementation };
