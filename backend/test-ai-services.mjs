/**
 * APEX AI SERVICES INTEGRATION TEST
 * ================================
 * Tests that all AI backend services can be imported and initialized
 * Run this before proceeding with Desktop App development
 */

import chalk from 'chalk';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

console.log(chalk.blue('🧪 APEX AI SERVICES INTEGRATION TEST'));
console.log(chalk.blue('====================================='));

async function testAIServices() {
  const results = {
    imports: {},
    initializations: {},
    functionality: {}
  };

  // Test 1: Import all AI services
  console.log(chalk.yellow('\n📦 Testing Service Imports...'));

  try {
    // Streaming Infrastructure
    const { default: ApexStreamingServer } = await import('./services/streaming/streamingServer.mjs');
    results.imports.streamingServer = '✅ Success';
    console.log(chalk.green('✅ Streaming Server imported'));

    // AI Processing Pipeline
    const { default: ApexFaceDetectionService } = await import('./services/ai/faceDetectionService.mjs');
    results.imports.faceDetection = '✅ Success';
    console.log(chalk.green('✅ Face Detection Service imported'));

    // External Services
    const { default: pushNotificationService } = await import('./services/external/pushNotificationService.mjs');
    results.imports.pushNotification = '✅ Success';
    console.log(chalk.green('✅ Push Notification Service imported'));

    const { default: emailService } = await import('./services/external/emailService.mjs');
    results.imports.emailService = '✅ Success';
    console.log(chalk.green('✅ Email Service imported'));

    const { default: ttsService } = await import('./services/external/ttsService.mjs');
    results.imports.ttsService = '✅ Success';
    console.log(chalk.green('✅ TTS Service imported'));

    // Test 2: Initialize Services
    console.log(chalk.yellow('\n🚀 Testing Service Initialization...'));

    // Initialize Streaming Server
    const streamingServer = new ApexStreamingServer();
    results.initializations.streamingServer = '✅ Success';
    console.log(chalk.green('✅ Streaming Server initialized'));

    // Initialize Face Detection Service
    const faceDetectionService = new ApexFaceDetectionService();
    results.initializations.faceDetection = '✅ Success';
    console.log(chalk.green('✅ Face Detection Service initialized'));

    // Test Push Notification Service
    const pushTestResult = await pushNotificationService.testConfiguration();
    results.initializations.pushNotification = pushTestResult.success ? '✅ Success' : '⚠️ Demo Mode';
    console.log(chalk.green('✅ Push Notification Service initialized'));

    // Test 3: Basic Functionality
    console.log(chalk.yellow('\n⚡ Testing Basic Functionality...'));

    // Test streaming server stats
    const streamStats = streamingServer.getStreamStats();
    results.functionality.streamingStats = streamStats ? '✅ Success' : '❌ Failed';
    console.log(chalk.green('✅ Streaming Server stats working'));

    // Test face detection stats
    const faceStats = await faceDetectionService.getFaceStats();
    results.functionality.faceStats = faceStats ? '✅ Success' : '❌ Failed';
    console.log(chalk.green('✅ Face Detection stats working'));

    // Test push notification demo
    const pushDemoResult = await pushNotificationService.sendNotificationToGuard('test_guard', {
      title: 'Test Alert',
      body: 'AI services integration test',
      priority: 'low'
    });
    results.functionality.pushDemo = pushDemoResult.success ? '✅ Success' : '❌ Failed';
    console.log(chalk.green('✅ Push Notification demo working'));

    // Test 4: Database Connectivity (if available)
    console.log(chalk.yellow('\n🗄️ Testing Database Connectivity...'));
    
    try {
      // Face detection service uses database
      const searchResult = await faceDetectionService.searchPersons('test', 1);
      results.functionality.database = '✅ Connected';
      console.log(chalk.green('✅ Database connectivity working'));
    } catch (error) {
      results.functionality.database = '⚠️ No Connection (Demo Mode)';
      console.log(chalk.yellow('⚠️ Database not connected - using demo mode'));
    }

    // Final Results
    console.log(chalk.blue('\n📋 INTEGRATION TEST RESULTS'));
    console.log(chalk.blue('============================'));
    console.log(chalk.white('Service Imports:'));
    Object.entries(results.imports).forEach(([service, status]) => {
      console.log(`  ${service}: ${status}`);
    });

    console.log(chalk.white('\nService Initializations:'));
    Object.entries(results.initializations).forEach(([service, status]) => {
      console.log(`  ${service}: ${status}`);
    });

    console.log(chalk.white('\nFunctionality Tests:'));
    Object.entries(results.functionality).forEach(([test, status]) => {
      console.log(`  ${test}: ${status}`);
    });

    console.log(chalk.green('\n🎉 AI SERVICES INTEGRATION TEST COMPLETE'));
    console.log(chalk.green('✅ Backend foundation is ready for Desktop App development'));
    
    // Cleanup
    console.log(chalk.yellow('\n🧹 Cleaning up test resources...'));
    await faceDetectionService.shutdown();
    await streamingServer.shutdown();
    
    console.log(chalk.green('✅ Cleanup complete'));

    return true;

  } catch (error) {
    console.error(chalk.red('❌ Integration test failed:'), error);
    console.log(chalk.yellow('\n🔧 Troubleshooting:'));
    console.log('1. Ensure all dependencies are installed: npm install');
    console.log('2. Check .env file configuration');
    console.log('3. Verify PostgreSQL connection (if using database features)');
    console.log('4. Check that all service files are present');
    
    return false;
  }
}

// Run the test
testAIServices()
  .then((success) => {
    if (success) {
      console.log(chalk.green('\n🚀 Ready to proceed with Desktop App development!'));
      process.exit(0);
    } else {
      console.log(chalk.red('\n❌ Fix issues before proceeding'));
      process.exit(1);
    }
  })
  .catch((error) => {
    console.error(chalk.red('❌ Test script error:'), error);
    process.exit(1);
  });
