#!/usr/bin/env node

/**
 * VOICE AI SYSTEM INTEGRITY VALIDATOR - MASTER PROMPT v52.0
 * ==========================================================
 * Comprehensive system validation for Voice AI WebSocket integration
 * Validates all components, file integrity, and system readiness
 * 
 * Usage:
 * node validate-voice-ai-system.mjs
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class VoiceAISystemValidator {
  constructor() {
    this.validationResults = [];
    this.errors = [];
    this.warnings = [];
  }

  /**
   * Log validation result
   */
  logResult(component, status, message, details = null) {
    const result = {
      component,
      status,
      message,
      details,
      timestamp: new Date().toISOString()
    };
    
    this.validationResults.push(result);
    
    const statusIcon = status === 'PASS' ? '✅' : status === 'WARN' ? '⚠️' : '❌';
    console.log(`${statusIcon} ${component}: ${message}`);
    
    if (details) {
      console.log(`   Details: ${JSON.stringify(details, null, 2)}`);
    }
    
    if (status === 'FAIL') {
      this.errors.push(result);
    } else if (status === 'WARN') {
      this.warnings.push(result);
    }
  }

  /**
   * Check if file exists and validate its contents
   */
  validateFile(filePath, expectedContent = null, description = '') {
    const component = `File: ${path.basename(filePath)}`;
    
    try {
      if (!fs.existsSync(filePath)) {
        this.logResult(component, 'FAIL', `File not found: ${filePath}`);
        return false;
      }
      
      const stats = fs.statSync(filePath);
      const content = fs.readFileSync(filePath, 'utf8');
      
      // Basic file validation
      if (content.length === 0) {
        this.logResult(component, 'FAIL', 'File is empty');
        return false;
      }
      
      // Content validation if provided
      if (expectedContent) {
        if (Array.isArray(expectedContent)) {
          // Check for required strings
          const missingContent = expectedContent.filter(req => !content.includes(req));
          if (missingContent.length > 0) {
            this.logResult(component, 'FAIL', `Missing required content: ${missingContent.join(', ')}`);
            return false;
          }
        }
      }
      
      this.logResult(component, 'PASS', `File validated successfully ${description}`, {
        size: stats.size,
        lines: content.split('\n').length
      });
      
      return true;
      
    } catch (error) {
      this.logResult(component, 'FAIL', `Validation failed: ${error.message}`);
      return false;
    }
  }

  /**
   * Validate directory structure
   */
  validateDirectoryStructure() {
    console.log('\n📁 Validating Directory Structure...\n');
    
    const baseDir = path.resolve(__dirname, '..');
    const requiredDirs = [
      'src/components/UnifiedDispatchConsole',
      'src/services',
      'test'
    ];
    
    for (const dir of requiredDirs) {
      const fullPath = path.join(baseDir, dir);
      if (fs.existsSync(fullPath)) {
        this.logResult(`Directory: ${dir}`, 'PASS', 'Directory exists');
      } else {
        this.logResult(`Directory: ${dir}`, 'FAIL', 'Directory missing');
      }
    }
  }

  /**
   * Validate frontend WebSocket components
   */
  validateFrontendComponents() {
    console.log('\n🖥️ Validating Frontend Components...\n');
    
    const baseDir = path.resolve(__dirname, '..');
    const componentDir = path.join(baseDir, 'src/components/UnifiedDispatchConsole');
    
    // Core WebSocket components
    const components = [
      {
        file: 'CallInterventionPanelWebSocket.tsx',
        required: [
          'webSocketManager',
          'MESSAGE_TYPES',
          'handleTakeoverClick',
          'sendWebSocketMessage',
          'request_takeover',
          'emergency_escalate'
        ]
      },
      {
        file: 'LiveCallMonitorWebSocket.tsx',
        required: [
          'webSocketManager',
          'CallInterventionPanelWebSocket',
          'handleWebSocketMessage',
          'VOICE_CALL_STARTED',
          'VOICE_HUMAN_TAKEOVER'
        ]
      },
      {
        file: 'index.ts',
        required: [
          'CallInterventionPanelWebSocket',
          'LiveCallMonitorWebSocket',
          'CallInterventionStatus',
          'VoiceCall'
        ]
      }
    ];
    
    for (const component of components) {
      const filePath = path.join(componentDir, component.file);
      this.validateFile(filePath, component.required, `(${component.required.length} required elements)`);
    }
  }

  /**
   * Validate WebSocket service
   */
  validateWebSocketService() {
    console.log('\n🔌 Validating WebSocket Service...\n');
    
    const baseDir = path.resolve(__dirname, '..');
    const serviceFile = path.join(baseDir, 'src/services/webSocketManager.ts');
    
    const requiredElements = [
      'MESSAGE_TYPES',
      'VOICE_CALL_STARTED',
      'VOICE_HUMAN_TAKEOVER',
      'VOICE_EMERGENCY_ALERT',
      'subscribeToMessage',
      'sendMessage',
      'isConnected'
    ];
    
    this.validateFile(serviceFile, requiredElements, '(WebSocket service)');
  }

  /**
   * Validate backend WebSocket handlers
   */
  validateBackendComponents() {
    console.log('\n🖲️ Validating Backend Components...\n');
    
    const backendDir = path.resolve(__dirname, '../../backend');
    
    // WebSocket handlers
    const voiceSocketFile = path.join(backendDir, 'src/voiceAISocket.mjs');
    const requiredBackendElements = [
      'initializeVoiceAIWebSocket',
      'handleTakeoverRequest',
      'handleEmergencyEscalation',
      'broadcastToSubscribedClients',
      'request_takeover',
      'emergency_escalate'
    ];
    
    this.validateFile(voiceSocketFile, requiredBackendElements, '(Backend WebSocket handlers)');
    
    // Routes
    const routesDir = path.join(backendDir, 'routes');
    if (fs.existsSync(routesDir)) {
      this.logResult('Backend Routes', 'PASS', 'Routes directory exists');
    } else {
      this.logResult('Backend Routes', 'WARN', 'Routes directory not found - may use different structure');
    }
  }

  /**
   * Validate test infrastructure
   */
  validateTestInfrastructure() {
    console.log('\n🧪 Validating Test Infrastructure...\n');
    
    const baseDir = path.resolve(__dirname, '..');
    const testFile = path.join(baseDir, 'test/voiceAIWebSocketIntegrationTest.ts');
    
    const requiredTestElements = [
      'VoiceAIWebSocketTester',
      'testWebSocketConnection',
      'testTakeoverRequestFlow',
      'testEmergencyEscalationFlow',
      'runVoiceAIIntegrationTests'
    ];
    
    this.validateFile(testFile, requiredTestElements, '(Integration test suite)');
  }

  /**
   * Validate package dependencies
   */
  validateDependencies() {
    console.log('\n📦 Validating Dependencies...\n');
    
    const baseDir = path.resolve(__dirname, '..');
    const packageJsonFile = path.join(baseDir, '../package.json');
    
    try {
      if (fs.existsSync(packageJsonFile)) {
        const packageJson = JSON.parse(fs.readFileSync(packageJsonFile, 'utf8'));
        const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
        
        const requiredDeps = [
          'react',
          'socket.io-client',
          'lucide-react'
        ];
        
        const missingDeps = requiredDeps.filter(dep => !dependencies[dep]);
        
        if (missingDeps.length === 0) {
          this.logResult('Dependencies', 'PASS', 'All required dependencies found', {
            totalDeps: Object.keys(dependencies).length,
            requiredDeps: requiredDeps.length
          });
        } else {
          this.logResult('Dependencies', 'WARN', `Missing dependencies: ${missingDeps.join(', ')}`);
        }
      } else {
        this.logResult('Dependencies', 'WARN', 'package.json not found in expected location');
      }
    } catch (error) {
      this.logResult('Dependencies', 'FAIL', `Dependency validation failed: ${error.message}`);
    }
  }

  /**
   * Check TypeScript/JavaScript syntax
   */
  validateSyntax() {
    console.log('\n🔍 Validating Syntax...\n');
    
    const baseDir = path.resolve(__dirname, '..');
    const filesToCheck = [
      'src/components/UnifiedDispatchConsole/CallInterventionPanelWebSocket.tsx',
      'src/components/UnifiedDispatchConsole/LiveCallMonitorWebSocket.tsx',
      'test/voiceAIWebSocketIntegrationTest.ts'
    ];
    
    for (const file of filesToCheck) {
      const filePath = path.join(baseDir, file);
      
      try {
        if (fs.existsSync(filePath)) {
          const content = fs.readFileSync(filePath, 'utf8');
          
          // Basic syntax checks
          const braceCount = (content.match(/\{/g) || []).length - (content.match(/\}/g) || []).length;
          const parenCount = (content.match(/\(/g) || []).length - (content.match(/\)/g) || []).length;
          const bracketCount = (content.match(/\[/g) || []).length - (content.match(/\]/g) || []).length;
          
          if (braceCount !== 0 || parenCount !== 0 || bracketCount !== 0) {
            this.logResult(`Syntax: ${path.basename(file)}`, 'WARN', 'Potential syntax issues detected', {
              braceImbalance: braceCount,
              parenImbalance: parenCount,
              bracketImbalance: bracketCount
            });
          } else {
            this.logResult(`Syntax: ${path.basename(file)}`, 'PASS', 'Basic syntax validation passed');
          }
        }
      } catch (error) {
        this.logResult(`Syntax: ${path.basename(file)}`, 'FAIL', `Syntax validation failed: ${error.message}`);
      }
    }
  }

  /**
   * Generate comprehensive validation report
   */
  generateReport() {
    console.log('\n' + '='.repeat(80));
    console.log('                    VOICE AI SYSTEM VALIDATION REPORT');
    console.log('='.repeat(80));
    
    const totalChecks = this.validationResults.length;
    const passedChecks = this.validationResults.filter(r => r.status === 'PASS').length;
    const warnChecks = this.warnings.length;
    const failedChecks = this.errors.length;
    const successRate = totalChecks > 0 ? ((passedChecks / totalChecks) * 100).toFixed(2) : '0.00';
    
    console.log(`\n📊 VALIDATION SUMMARY:`);
    console.log(`   Total Checks: ${totalChecks}`);
    console.log(`   Passed: ${passedChecks} ✅`);
    console.log(`   Warnings: ${warnChecks} ⚠️`);
    console.log(`   Failed: ${failedChecks} ❌`);
    console.log(`   Success Rate: ${successRate}%\n`);
    
    if (this.errors.length > 0) {
      console.log('🚨 CRITICAL ISSUES:');
      this.errors.forEach(error => {
        console.log(`   ❌ ${error.component}: ${error.message}`);
      });
      console.log('');
    }
    
    if (this.warnings.length > 0) {
      console.log('⚠️  WARNINGS:');
      this.warnings.forEach(warning => {
        console.log(`   ⚠️  ${warning.component}: ${warning.message}`);
      });
      console.log('');
    }
    
    // System readiness assessment
    if (failedChecks === 0) {
      console.log('🎉 SYSTEM STATUS: READY FOR INTEGRATION TESTING');
      console.log('   All critical components validated successfully.');
      console.log('   You can now run: npm run test:integration');
    } else if (failedChecks <= 2 && warnChecks <= 5) {
      console.log('⚠️  SYSTEM STATUS: NEEDS ATTENTION');
      console.log('   Some issues detected. Review and fix before proceeding.');
    } else {
      console.log('❌ SYSTEM STATUS: NOT READY');
      console.log('   Critical issues detected. System integration may fail.');
    }
    
    console.log('\n' + '='.repeat(80));
    console.log(`Validation completed at: ${new Date().toISOString()}`);
    console.log('='.repeat(80));
    
    return {
      totalChecks,
      passedChecks,
      warnChecks,
      failedChecks,
      successRate: parseFloat(successRate),
      ready: failedChecks === 0
    };
  }

  /**
   * Run all validation checks
   */
  async runValidation() {
    console.log('🔍 Starting Voice AI System Validation...\n');
    
    this.validateDirectoryStructure();
    this.validateFrontendComponents();
    this.validateWebSocketService();
    this.validateBackendComponents();
    this.validateTestInfrastructure();
    this.validateDependencies();
    this.validateSyntax();
    
    return this.generateReport();
  }
}

// CLI execution
if (import.meta.url === `file://${__filename}`) {
  const validator = new VoiceAISystemValidator();
  
  validator.runValidation()
    .then((summary) => {
      process.exit(summary.ready ? 0 : 1);
    })
    .catch((error) => {
      console.error('❌ Validation failed:', error);
      process.exit(1);
    });
}

export default VoiceAISystemValidator;
