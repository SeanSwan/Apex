/**
 * APEX AI FACE RECOGNITION SYSTEM - COMPREHENSIVE BUG ANALYSIS
 * ============================================================
 * Automated analysis for syntax errors, import issues, and best practices
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Bug tracking
const bugReport = {
  criticalErrors: [],
  syntaxErrors: [],
  importErrors: [],
  typeErrors: [],
  bestPracticeViolations: [],
  deadCode: [],
  performanceIssues: [],
  securityIssues: []
};

// File analysis results
const analysisResults = {
  totalFiles: 0,
  filesAnalyzed: 0,
  errorsFound: 0,
  warningsFound: 0
};

function log(message, type = 'INFO') {
  const timestamp = new Date().toISOString();
  const icons = {
    'INFO': 'ℹ️',
    'ERROR': '❌',
    'WARNING': '⚠️',
    'SUCCESS': '✅',
    'CRITICAL': '🚨'
  };
  
  console.log(`[${timestamp}] ${icons[type] || 'ℹ️'} ${message}`);
}

function addBug(category, file, line, issue, severity = 'medium') {
  const bug = {
    file,
    line,
    issue,
    severity,
    timestamp: new Date().toISOString()
  };
  
  bugReport[category].push(bug);
  
  if (severity === 'critical') {
    analysisResults.errorsFound++;
    log(`CRITICAL: ${file}:${line} - ${issue}`, 'CRITICAL');
  } else if (severity === 'high') {
    analysisResults.errorsFound++;
    log(`ERROR: ${file}:${line} - ${issue}`, 'ERROR');
  } else {
    analysisResults.warningsFound++;
    log(`WARNING: ${file}:${line} - ${issue}`, 'WARNING');
  }
}

function analyzeReactComponent(filePath, content) {
  const fileName = path.basename(filePath);
  const lines = content.split('\\n');
  
  log(`Analyzing React component: ${fileName}`, 'INFO');
  
  // Check for escaped quotes in JSX
  lines.forEach((line, index) => {
    if (line.includes('\\\\"')) {
      addBug('syntaxErrors', fileName, index + 1, 
        'Escaped quotes in JSX attributes - should be regular quotes', 'critical');
    }
    
    if (line.includes('type=\\\\"') || line.includes('className=\\\\"')) {
      addBug('syntaxErrors', fileName, index + 1, 
        'Invalid JSX attribute syntax with escaped quotes', 'critical');
    }
    
    // Check for missing imports
    if (line.includes('useState') && !content.includes('import React, { useState')) {
      addBug('importErrors', fileName, index + 1, 
        'useState used but not imported from React', 'high');
    }
    
    if (line.includes('useCallback') && !content.includes('useCallback')) {
      addBug('importErrors', fileName, index + 1, 
        'useCallback used but not imported', 'high');
    }
    
    // Check for styled-components issues
    if (line.includes('styled.') && !content.includes('import styled from')) {
      addBug('importErrors', fileName, index + 1, 
        'styled-components used but not imported', 'high');
    }
    
    // Check for icon usage without import
    if (line.includes('<User ') && !content.includes('User,')) {
      addBug('importErrors', fileName, index + 1, 
        'User icon used but not imported from lucide-react', 'high');
    }
    
    // Check for console.log (should be removed in production)
    if (line.includes('console.log')) {
      addBug('bestPracticeViolations', fileName, index + 1, 
        'console.log statement found - should be removed for production', 'low');
    }
    
    // Check for any/unknown TypeScript types
    if (line.includes(': any') || line.includes('<any>')) {
      addBug('typeErrors', fileName, index + 1, 
        'Using "any" type - should be properly typed', 'medium');
    }
    
    // Check for missing key props in lists
    if (line.includes('.map(') && !line.includes('key=')) {
      const nextLine = lines[index + 1] || '';
      if (!nextLine.includes('key=')) {
        addBug('bestPracticeViolations', fileName, index + 1, 
          'Missing key prop in mapped component', 'medium');
      }
    }
    
    // Check for inline styles (should use styled-components)
    if (line.includes('style={{')) {
      addBug('bestPracticeViolations', fileName, index + 1, 
        'Inline styles used - prefer styled-components', 'low');
    }
    
    // Check for hard-coded strings (should be localized)
    if (line.includes('placeholder=') && line.includes('Enter ')) {
      addBug('bestPracticeViolations', fileName, index + 1, 
        'Hard-coded user-facing text - consider localization', 'low');
    }
  });
  
  // Check for missing TypeScript interfaces
  if (!content.includes('interface ') && fileName.endsWith('.tsx')) {
    addBug('typeErrors', fileName, 1, 
      'Component missing TypeScript interface for props', 'medium');
  }
  
  // Check for missing exports
  if (!content.includes('export default') && !content.includes('export {')) {
    addBug('importErrors', fileName, 1, 
      'Component missing default export', 'high');
  }
  
  // Check for memory leaks (missing cleanup)
  if (content.includes('setInterval') && !content.includes('clearInterval')) {
    addBug('performanceIssues', fileName, 1, 
      'setInterval used without cleanup - potential memory leak', 'high');
  }
  
  if (content.includes('addEventListener') && !content.includes('removeEventListener')) {
    addBug('performanceIssues', fileName, 1, 
      'Event listener added without cleanup', 'medium');
  }
}

function analyzeAPIFile(filePath, content) {
  const fileName = path.basename(filePath);
  const lines = content.split('\\n');
  
  log(`Analyzing API file: ${fileName}`, 'INFO');
  
  lines.forEach((line, index) => {
    // Check for SQL injection vulnerabilities
    if (line.includes('query(') && line.includes('+') && line.includes('req.')) {
      addBug('securityIssues', fileName, index + 1, 
        'Potential SQL injection - string concatenation in query', 'critical');
    }
    
    // Check for missing input validation
    if (line.includes('req.body') && !content.includes('validator')) {
      addBug('securityIssues', fileName, index + 1, 
        'Request body used without validation', 'high');
    }
    
    // Check for missing error handling
    if (line.includes('await ') && !lines.slice(Math.max(0, index - 5), index + 5).some(l => l.includes('try') || l.includes('catch'))) {
      addBug('bestPracticeViolations', fileName, index + 1, 
        'Async operation without error handling', 'medium');
    }
    
    // Check for hard-coded secrets
    if (line.includes('password') && line.includes('=') && line.includes("'")) {
      addBug('securityIssues', fileName, index + 1, 
        'Potential hard-coded password or secret', 'critical');
    }
    
    // Check for missing authentication
    if (line.includes('router.delete') && !content.includes('auth')) {
      addBug('securityIssues', fileName, index + 1, 
        'DELETE endpoint without authentication check', 'high');
    }
    
    // Check for missing rate limiting
    if (line.includes('router.post') && !content.includes('rateLimit')) {
      addBug('securityIssues', fileName, index + 1, 
        'POST endpoint without rate limiting', 'medium');
    }
  });
}

function analyzeDatabaseFile(filePath, content) {
  const fileName = path.basename(filePath);
  const lines = content.split('\\n');
  
  log(`Analyzing database file: ${fileName}`, 'INFO');
  
  lines.forEach((line, index) => {
    // Check for missing constraints
    if (line.includes('CREATE TABLE') && !content.includes('PRIMARY KEY')) {
      addBug('bestPracticeViolations', fileName, index + 1, 
        'Table without primary key', 'medium');
    }
    
    // Check for missing indexes on foreign keys
    if (line.includes('REFERENCES') && !content.includes('INDEX')) {
      addBug('performanceIssues', fileName, index + 1, 
        'Foreign key without corresponding index', 'medium');
    }
    
    // Check for VARCHAR without length
    if (line.includes('VARCHAR(') && !line.includes('VARCHAR(255)') && !line.includes('VARCHAR(100)')) {
      // This is actually OK, just noting it
    }
    
    // Check for missing NOT NULL on important fields
    if (line.includes('email') && !line.includes('NOT NULL')) {
      addBug('bestPracticeViolations', fileName, index + 1, 
        'Email field should be NOT NULL', 'low');
    }
  });
}

function analyzeFile(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      addBug('criticalErrors', path.basename(filePath), 1, 
        'File does not exist', 'critical');
      return;
    }
    
    const content = fs.readFileSync(filePath, 'utf8');
    const ext = path.extname(filePath);
    
    analysisResults.totalFiles++;
    
    // Check for empty files
    if (content.trim().length === 0) {
      addBug('deadCode', path.basename(filePath), 1, 
        'Empty file - potential dead code', 'medium');
      return;
    }
    
    analysisResults.filesAnalyzed++;
    
    // Analyze based on file type
    if (ext === '.tsx' || ext === '.ts') {
      analyzeReactComponent(filePath, content);
    } else if (ext === '.mjs' || ext === '.js') {
      analyzeAPIFile(filePath, content);
    } else if (ext === '.sql') {
      analyzeDatabaseFile(filePath, content);
    }
    
  } catch (error) {
    addBug('criticalErrors', path.basename(filePath), 1, 
      `Failed to read file: ${error.message}`, 'critical');
  }
}

function analyzeDirectory(dirPath) {
  try {
    const items = fs.readdirSync(dirPath);
    
    for (const item of items) {
      const itemPath = path.join(dirPath, item);
      const stat = fs.statSync(itemPath);
      
      if (stat.isDirectory()) {
        // Skip node_modules and other build directories
        if (!['node_modules', '.git', 'dist', 'build'].includes(item)) {
          analyzeDirectory(itemPath);
        }
      } else if (stat.isFile()) {
        const ext = path.extname(item);
        if (['.tsx', '.ts', '.mjs', '.js', '.sql'].includes(ext)) {
          analyzeFile(itemPath);
        }
      }
    }
  } catch (error) {
    log(`Failed to analyze directory ${dirPath}: ${error.message}`, 'ERROR');
  }
}

function generateReport() {
  log('\\n' + '='.repeat(60), 'INFO');
  log('APEX AI FACE RECOGNITION SYSTEM - BUG ANALYSIS REPORT', 'INFO');
  log('='.repeat(60), 'INFO');
  
  // Summary
  log(`\\nANALYSIS SUMMARY:`, 'INFO');
  log(`Files Analyzed: ${analysisResults.filesAnalyzed}/${analysisResults.totalFiles}`, 'INFO');
  log(`Critical Errors: ${bugReport.criticalErrors.length}`, 'ERROR');
  log(`Syntax Errors: ${bugReport.syntaxErrors.length}`, 'ERROR');
  log(`Import Errors: ${bugReport.importErrors.length}`, 'ERROR');
  log(`Type Errors: ${bugReport.typeErrors.length}`, 'WARNING');
  log(`Security Issues: ${bugReport.securityIssues.length}`, 'WARNING');
  log(`Performance Issues: ${bugReport.performanceIssues.length}`, 'WARNING');
  log(`Best Practice Violations: ${bugReport.bestPracticeViolations.length}`, 'WARNING');
  
  // Detailed reports
  const categories = [
    { name: 'CRITICAL ERRORS', bugs: bugReport.criticalErrors, icon: '🚨' },
    { name: 'SYNTAX ERRORS', bugs: bugReport.syntaxErrors, icon: '❌' },
    { name: 'IMPORT ERRORS', bugs: bugReport.importErrors, icon: '📦' },
    { name: 'TYPE ERRORS', bugs: bugReport.typeErrors, icon: '🔷' },
    { name: 'SECURITY ISSUES', bugs: bugReport.securityIssues, icon: '🛡️' },
    { name: 'PERFORMANCE ISSUES', bugs: bugReport.performanceIssues, icon: '⚡' },
    { name: 'BEST PRACTICE VIOLATIONS', bugs: bugReport.bestPracticeViolations, icon: '📋' }
  ];
  
  categories.forEach(category => {
    if (category.bugs.length > 0) {
      log(`\\n${category.icon} ${category.name} (${category.bugs.length}):`, 'INFO');
      log('-'.repeat(40), 'INFO');
      
      category.bugs.forEach((bug, index) => {
        log(`${index + 1}. ${bug.file}:${bug.line} - ${bug.issue} [${bug.severity}]`, 
            bug.severity === 'critical' ? 'CRITICAL' : bug.severity === 'high' ? 'ERROR' : 'WARNING');
      });
    }
  });
  
  // Recommendations
  log(`\\n💡 RECOMMENDATIONS:`, 'INFO');
  log('-'.repeat(40), 'INFO');
  
  if (bugReport.criticalErrors.length > 0) {
    log('1. Fix critical errors immediately - system will not run', 'CRITICAL');
  }
  if (bugReport.syntaxErrors.length > 0) {
    log('2. Fix syntax errors - components will not compile', 'ERROR');
  }
  if (bugReport.importErrors.length > 0) {
    log('3. Fix import errors - modules will not load', 'ERROR');
  }
  if (bugReport.securityIssues.length > 0) {
    log('4. Address security issues before production deployment', 'WARNING');
  }
  if (bugReport.performanceIssues.length > 0) {
    log('5. Optimize performance issues for better user experience', 'WARNING');
  }
  
  // Overall status
  const totalIssues = analysisResults.errorsFound + analysisResults.warningsFound;
  if (totalIssues === 0) {
    log('\\n✅ NO ISSUES FOUND - SYSTEM IS READY!', 'SUCCESS');
  } else if (bugReport.criticalErrors.length === 0 && bugReport.syntaxErrors.length === 0) {
    log('\\n⚠️ MINOR ISSUES FOUND - SYSTEM FUNCTIONAL BUT NEEDS IMPROVEMENTS', 'WARNING');
  } else {
    log('\\n🚨 CRITICAL ISSUES FOUND - SYSTEM WILL NOT FUNCTION PROPERLY', 'CRITICAL');
  }
  
  // Save report to file
  const reportData = {
    timestamp: new Date().toISOString(),
    summary: analysisResults,
    bugs: bugReport,
    recommendations: [
      'Fix all critical and syntax errors first',
      'Address import and type errors',
      'Review security issues before production',
      'Optimize performance where possible',
      'Follow React and TypeScript best practices'
    ]
  };
  
  try {
    const reportPath = path.join(__dirname, `bug_analysis_report_${Date.now()}.json`);
    fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2));
    log(`\\nDetailed report saved to: ${path.basename(reportPath)}`, 'SUCCESS');
  } catch (error) {
    log(`Failed to save report: ${error.message}`, 'ERROR');
  }
}

// Main analysis execution
function runBugAnalysis() {
  log('Starting comprehensive bug analysis...', 'INFO');
  
  const projectRoot = __dirname;
  const analysisDirectories = [
    path.join(projectRoot, 'frontend', 'src', 'components', 'FaceManagement'),
    path.join(projectRoot, 'backend', 'routes'),
    path.join(projectRoot, 'backend', 'database'),
    path.join(projectRoot, 'apex_ai_engine')
  ];
  
  // Analyze specific files
  const specificFiles = [
    path.join(projectRoot, 'frontend', 'src', 'components', 'index.ts'),
    path.join(projectRoot, 'backend', 'routes', 'api.mjs'),
    path.join(projectRoot, 'backend', 'package.json'),
    path.join(projectRoot, 'frontend', 'package.json')
  ];
  
  // Analyze directories
  analysisDirectories.forEach(dir => {
    if (fs.existsSync(dir)) {
      log(`Analyzing directory: ${path.basename(dir)}`, 'INFO');
      analyzeDirectory(dir);
    } else {
      addBug('criticalErrors', path.basename(dir), 1, 
        'Required directory does not exist', 'critical');
    }
  });
  
  // Analyze specific files
  specificFiles.forEach(file => {
    if (fs.existsSync(file)) {
      analyzeFile(file);
    } else {
      addBug('criticalErrors', path.basename(file), 1, 
        'Required file does not exist', 'critical');
    }
  });
  
  // Generate and display report
  generateReport();
  
  return {
    success: bugReport.criticalErrors.length === 0 && bugReport.syntaxErrors.length === 0,
    totalIssues: analysisResults.errorsFound + analysisResults.warningsFound,
    report: bugReport
  };
}

// Export for use or run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runBugAnalysis();
}

export default runBugAnalysis;
