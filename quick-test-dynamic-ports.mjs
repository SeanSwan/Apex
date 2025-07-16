// APEX AI DYNAMIC PORT ALLOCATION - QUICK TEST
// ==========================================
// Quick verification that the dynamic port system is working

import { findAvailablePort, getPortStatus } from './utils/findAvailablePort.mjs';
import { getServerStatus } from './utils/discoverServerPorts.mjs';
import chalk from 'chalk';

async function quickTest() {
  console.log(chalk.cyan('🚀 APEX AI DYNAMIC PORT SYSTEM - QUICK TEST'));
  console.log(chalk.cyan('==============================================\n'));
  
  try {
    // Test 1: Port availability checker
    console.log(chalk.blue('📋 Test 1: Port Availability Checker'));
    const frontendPort = await findAvailablePort(5173, 3);
    const backendPort = await findAvailablePort(5000, 3);
    
    console.log(chalk.green(`✅ Next available frontend port: ${frontendPort}`));
    console.log(chalk.green(`✅ Next available backend port: ${backendPort}\n`));
    
    // Test 2: Port status overview
    console.log(chalk.blue('📋 Test 2: Current Port Status'));
    const portStatus = await getPortStatus();
    
    Object.entries(portStatus).forEach(([port, available]) => {
      const status = available ? chalk.green('Available') : chalk.red('In Use');
      console.log(`   Port ${port}: ${status}`);
    });
    
    // Test 3: Server discovery (if servers are running)
    console.log(chalk.blue('\n📋 Test 3: Server Discovery'));
    const serverStatus = await getServerStatus();
    
    console.log(`   Frontend: ${serverStatus.frontend.url} (${serverStatus.frontend.source})`);
    console.log(`   Backend: ${serverStatus.backend.url} (${serverStatus.backend.source})`);
    
    if (serverStatus.summary.all_systems_ready) {
      console.log(chalk.green('   ✅ All systems ready!'));
    } else {
      console.log(chalk.yellow('   ⚠️  Servers may not be running yet'));
    }
    
    console.log(chalk.green('\n🎉 DYNAMIC PORT SYSTEM IS WORKING!'));
    console.log(chalk.blue('\nNext steps:'));
    console.log(chalk.white('1. Run: restart-dynamic-servers.bat'));
    console.log(chalk.white('2. Run: node test-integration-dynamic.mjs'));
    console.log(chalk.white('3. Enjoy zero port conflicts! 🎯'));
    
  } catch (error) {
    console.error(chalk.red(`❌ Test failed: ${error.message}`));
    console.log(chalk.yellow('\nTroubleshooting:'));
    console.log(chalk.white('1. Ensure Node.js is installed'));
    console.log(chalk.white('2. Verify utils directory exists'));
    console.log(chalk.white('3. Check file permissions'));
  }
}

quickTest();
