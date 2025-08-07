#!/usr/bin/env node

/**
 * VOICE AI DISPATCHER - COMPREHENSIVE SYSTEM VERIFICATION
 * ======================================================
 * Validates all Voice AI Dispatcher components and integrations
 * Tests database connectivity, model loading, and frontend compatibility
 */

import dotenv from 'dotenv';
import { Sequelize } from 'sequelize';
import path from 'path';
import { fileURLToPath } from 'url';
import { existsSync, mkdirSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });

class VoiceAISystemVerifier {
  constructor() {
    this.sequelize = new Sequelize({
      dialect: 'postgres',
      host: process.env.PG_HOST || 'localhost',
      port: parseInt(process.env.PG_PORT) || 5432,
      database: process.env.PG_DB || 'apex',
      username: process.env.PG_USER || 'postgres',
      password: process.env.PG_PASSWORD || '',
      logging: false,
      define: {
        timestamps: true,
        underscored: true
      }
    });
    
    this.testResults = {
      database: { status: 'pending', details: [] },
      models: { status: 'pending', details: [] },
      apiKeys: { status: 'pending', details: [] },
      directories: { status: 'pending', details: [] },
      mcp: { status: 'pending', details: [] }
    };
  }
  
  async testDatabaseConnectivity() {
    console.log('🔌 Testing database connectivity...');
    
    try {
      await this.sequelize.authenticate();
      this.testResults.database.status = 'success';
      this.testResults.database.details.push('✅ Database connection successful');
      
      // Test query execution
      const [results] = await this.sequelize.query('SELECT NOW() as current_time');
      this.testResults.database.details.push(`✅ Query execution successful: ${results[0].current_time}`);
      
      return true;
    } catch (error) {
      this.testResults.database.status = 'error';
      this.testResults.database.details.push(`❌ Database connection failed: ${error.message}`);
      return false;
    }
  }
  
  async testVoiceAIModels() {
    console.log('📋 Testing Voice AI Dispatcher database models...');
    
    const requiredTables = [
      { name: 'contact_lists', description: 'Notification contact management' },
      { name: 'standard_operating_procedures', description: 'AI decision logic and SOPs' },
      { name: 'call_logs', description: 'Voice call records and transcripts' }
    ];
    
    let allTablesExist = true;
    
    for (const table of requiredTables) {
      try {
        const [results] = await this.sequelize.query(`
          SELECT column_name, data_type 
          FROM information_schema.columns 
          WHERE table_name = '${table.name}' 
          AND table_schema = 'public'
          ORDER BY ordinal_position
        `);
        
        if (results.length > 0) {
          this.testResults.models.details.push(`✅ ${table.name} (${results.length} columns) - ${table.description}`);
          
          // Test basic operations
          const [countResult] = await this.sequelize.query(`SELECT COUNT(*) as count FROM ${table.name}`);
          this.testResults.models.details.push(`   📊 Current records: ${countResult[0].count}`);
        } else {
          this.testResults.models.details.push(`❌ ${table.name} - Table missing or inaccessible`);
          allTablesExist = false;
        }
      } catch (error) {
        this.testResults.models.details.push(`⚠️  ${table.name} - Error: ${error.message}`);
        allTablesExist = false;
      }
    }
    
    this.testResults.models.status = allTablesExist ? 'success' : 'error';
    return allTablesExist;
  }
  
  async testAPIKeyConfiguration() {
    console.log('🔐 Testing API key configuration...');
    
    const requiredKeys = [
      { key: 'TWILIO_ACCOUNT_SID', service: 'Twilio Voice', required: true },
      { key: 'TWILIO_AUTH_TOKEN', service: 'Twilio Authentication', required: true },
      { key: 'TWILIO_PHONE_NUMBER', service: 'Twilio Phone Number', required: true },
      { key: 'DEEPGRAM_API_KEY', service: 'Deepgram Speech-to-Text', required: true },
      { key: 'ELEVENLABS_API_KEY', service: 'ElevenLabs Text-to-Speech', required: true },
      { key: 'OLLAMA_BASE_URL', service: 'Local LLM (Ollama)', required: true },
      { key: 'JWT_SECRET', service: 'Authentication Security', required: true }
    ];
    
    let allKeysConfigured = true;
    
    for (const { key, service, required } of requiredKeys) {
      const value = process.env[key];
      
      if (!value || value.includes('your_') || value.includes('xxx')) {
        if (required) {
          this.testResults.apiKeys.details.push(`❌ ${key} - ${service} (NOT CONFIGURED)`);
          allKeysConfigured = false;
        } else {
          this.testResults.apiKeys.details.push(`⚠️  ${key} - ${service} (Optional, not configured)`);
        }
      } else {
        // Mask sensitive values for display
        const maskedValue = value.length > 8 ? 
          `${value.substring(0, 4)}****${value.substring(value.length - 4)}` : 
          '****';
        this.testResults.apiKeys.details.push(`✅ ${key} - ${service} (${maskedValue})`);
      }
    }
    
    this.testResults.apiKeys.status = allKeysConfigured ? 'warning' : 'error';
    return allKeysConfigured;
  }
  
  async testDirectoryStructure() {
    console.log('📁 Testing directory structure...');
    
    const requiredDirs = [
      { path: './recordings', description: 'Call recordings storage' },
      { path: './temp', description: 'Temporary file processing' },
      { path: '../apex_ai_engine/agents', description: 'AI Agent modules' },
      { path: '../apex_ai_engine/mcp_server', description: 'MCP Server components' },
      { path: '../frontend/src/components/UnifiedDispatchConsole', description: 'Frontend Voice UI components' }
    ];
    
    let allDirsExist = true;
    
    for (const { path: dirPath, description } of requiredDirs) {
      const fullPath = path.resolve(__dirname, dirPath);
      
      if (existsSync(fullPath)) {
        this.testResults.directories.details.push(`✅ ${dirPath} - ${description}`);
      } else {
        this.testResults.directories.details.push(`❌ ${dirPath} - ${description} (MISSING)`);
        
        // Try to create directory if it's a simple one
        if (dirPath.startsWith('./')) {
          try {
            mkdirSync(fullPath, { recursive: true });
            this.testResults.directories.details.push(`   🔧 Created directory: ${dirPath}`);
          } catch (error) {
            this.testResults.directories.details.push(`   ⚠️  Could not create: ${error.message}`);
            allDirsExist = false;
          }
        } else {
          allDirsExist = false;
        }
      }
    }
    
    this.testResults.directories.status = allDirsExist ? 'success' : 'error';
    return allDirsExist;
  }
  
  async testMCPServerComponents() {
    console.log('🤖 Testing MCP Server components...');
    
    const mcpFiles = [
      { path: '../apex_ai_engine/mcp_server/mcp_main.py', description: 'MCP Main orchestrator' },
      { path: '../apex_ai_engine/agents/voice_dispatch_agent.py', description: 'Voice AI Dispatch Agent' },
      { path: '../apex_ai_engine/agents/data_agent.py', description: 'Data persistence agent' },
      { path: '../apex_ai_engine/mcp_server/decision_matrix_engine.py', description: 'AI decision engine' }
    ];
    
    let allFilesExist = true;
    
    for (const { path: filePath, description } of mcpFiles) {
      const fullPath = path.resolve(__dirname, filePath);
      
      if (existsSync(fullPath)) {
        this.testResults.mcp.details.push(`✅ ${path.basename(filePath)} - ${description}`);
      } else {
        this.testResults.mcp.details.push(`❌ ${path.basename(filePath)} - ${description} (MISSING)`);
        allFilesExist = false;
      }
    }
    
    this.testResults.mcp.status = allFilesExist ? 'success' : 'error';
    return allFilesExist;
  }
  
  async generateReport() {
    console.log('\n📊 VOICE AI DISPATCHER - SYSTEM VERIFICATION REPORT');
    console.log('=' .repeat(70));
    
    const categories = [
      { name: 'Database Connectivity', key: 'database' },
      { name: 'Voice AI Models', key: 'models' },
      { name: 'API Configuration', key: 'apiKeys' },
      { name: 'Directory Structure', key: 'directories' },
      { name: 'MCP Components', key: 'mcp' }
    ];
    
    let overallStatus = 'success';
    
    for (const { name, key } of categories) {
      const result = this.testResults[key];
      const statusIcon = result.status === 'success' ? '✅' : 
                        result.status === 'warning' ? '⚠️' : '❌';
      
      console.log(`\n${statusIcon} ${name.toUpperCase()}: ${result.status.toUpperCase()}`);
      result.details.forEach(detail => console.log(`   ${detail}`));
      
      if (result.status === 'error') overallStatus = 'error';
      else if (result.status === 'warning' && overallStatus === 'success') overallStatus = 'warning';
    }
    
    console.log('\n' + '=' .repeat(70));
    console.log(`🎯 OVERALL SYSTEM STATUS: ${overallStatus.toUpperCase()}`);
    
    if (overallStatus === 'success') {
      console.log('🎉 Voice AI Dispatcher is ready for integration testing!');
      console.log('\n📋 NEXT STEPS:');
      console.log('1. Configure actual API keys for live testing');
      console.log('2. Run database migrations if any tables are missing');
      console.log('3. Start MCP server: cd apex_ai_engine/mcp_server && python mcp_main.py');
      console.log('4. Test frontend components: cd frontend && npm run dev');
    } else if (overallStatus === 'warning') {
      console.log('⚠️  System is functional but requires API key configuration');
      console.log('\n🔧 REQUIRED ACTIONS:');
      console.log('1. Configure Twilio, Deepgram, and ElevenLabs API keys');
      console.log('2. Install and configure Ollama with llama3 model');
      console.log('3. Test end-to-end voice call workflow');
    } else {
      console.log('❌ Critical issues must be resolved before deployment');
      console.log('\n🚨 IMMEDIATE ACTIONS REQUIRED:');
      console.log('1. Fix database connectivity issues');
      console.log('2. Run missing database migrations');
      console.log('3. Ensure all required files and directories exist');
    }
    
    return overallStatus;
  }
  
  async execute() {
    console.log('🚀 APEX AI - Voice AI Dispatcher System Verification');
    console.log('=' .repeat(60));
    console.log('Validating all components for Voice AI Dispatcher integration...\n');
    
    try {
      // Run all verification tests
      await this.testDatabaseConnectivity();
      await this.testVoiceAIModels();
      await this.testAPIKeyConfiguration();
      await this.testDirectoryStructure();
      await this.testMCPServerComponents();
      
      // Generate comprehensive report
      const overallStatus = await this.generateReport();
      
      await this.sequelize.close();
      
      // Exit with appropriate code
      process.exit(overallStatus === 'error' ? 1 : 0);
      
    } catch (error) {
      console.error('❌ CRITICAL SYSTEM VERIFICATION ERROR:', error.message);
      await this.sequelize.close();
      process.exit(1);
    }
  }
}

// Execute the system verification
const verifier = new VoiceAISystemVerifier();
verifier.execute().catch(console.error);
