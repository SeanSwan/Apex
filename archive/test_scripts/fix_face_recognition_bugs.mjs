/**
 * APEX AI FACE RECOGNITION SYSTEM - CRITICAL BUG FIXES
 * ====================================================
 * Automated fixes for critical syntax and import errors
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function log(message, type = 'INFO') {
  const timestamp = new Date().toISOString();
  const icons = {
    'INFO': 'ℹ️',
    'ERROR': '❌',
    'WARNING': '⚠️',
    'SUCCESS': '✅',
    'FIX': '🔧'
  };
  
  console.log(`[${timestamp}] ${icons[type] || 'ℹ️'} ${message}`);
}

function fixFile(filePath, fixes) {
  try {
    if (!fs.existsSync(filePath)) {
      log(`File not found: ${filePath}`, 'ERROR');
      return false;
    }
    
    let content = fs.readFileSync(filePath, 'utf8');
    let fixesApplied = 0;
    
    fixes.forEach(fix => {
      const originalLength = content.length;
      content = content.replace(new RegExp(fix.search, 'g'), fix.replace);
      if (content.length !== originalLength) {
        fixesApplied++;
        log(`Applied fix: ${fix.description}`, 'FIX');
      }
    });
    
    if (fixesApplied > 0) {
      fs.writeFileSync(filePath, content, 'utf8');
      log(`Fixed ${fixesApplied} issues in ${path.basename(filePath)}`, 'SUCCESS');
      return true;
    } else {
      log(`No fixes needed in ${path.basename(filePath)}`, 'INFO');
      return true;
    }
    
  } catch (error) {
    log(`Failed to fix ${filePath}: ${error.message}`, 'ERROR');
    return false;
  }
}

function applyCriticalFixes() {
  log('🔧 APPLYING CRITICAL BUG FIXES', 'FIX');
  log('='.repeat(50), 'INFO');
  
  const fixes = {
    // Fix escaped quotes in JSX attributes
    jsxQuotes: [
      {
        search: 'type=\\\\"([^"]*)\\\\"',
        replace: 'type="$1"',
        description: 'Fix escaped quotes in type attributes'
      },
      {
        search: 'className=\\\\"([^"]*)\\\\"',
        replace: 'className="$1"',
        description: 'Fix escaped quotes in className attributes'
      },
      {
        search: 'placeholder=\\\\"([^"]*)\\\\"',
        replace: 'placeholder="$1"',
        description: 'Fix escaped quotes in placeholder attributes'
      },
      {
        search: 'accept=\\\\"([^"]*)\\\\"',
        replace: 'accept="$1"',
        description: 'Fix escaped quotes in accept attributes'
      },
      {
        search: 'alt=\\\\"([^"]*)\\\\"',
        replace: 'alt="$1"',
        description: 'Fix escaped quotes in alt attributes'
      },
      {
        search: 'value=\\\\"([^"]*)\\\\"',
        replace: 'value="$1"',
        description: 'Fix escaped quotes in value attributes'
      }
    ],
    
    // Fix missing UserX import
    missingImports: [
      {
        search: 'import {\\s*([^}]*)\\s*} from \'lucide-react\';',
        replace: function(match, imports) {
          // Add UserX if it's used but not imported
          if (!imports.includes('UserX') && content.includes('<UserX')) {
            const newImports = imports.trim() + ',\\n  UserX';
            return `import {\\n  ${newImports}\\n} from 'lucide-react';`;
          }
          return match;
        },
        description: 'Add missing UserX import'
      }
    ],
    
    // Fix component interface exports
    interfaceExports: [
      {
        search: 'export interface (\\w+Props)',
        replace: 'export interface $1',
        description: 'Ensure interface exports are correct'
      }
    ]
  };
  
  const filesToFix = [
    path.join(__dirname, 'frontend', 'src', 'components', 'FaceManagement', 'FaceEnrollment.tsx'),
    path.join(__dirname, 'frontend', 'src', 'components', 'FaceManagement', 'FaceProfileCard.tsx'),
    path.join(__dirname, 'frontend', 'src', 'components', 'FaceManagement', 'FaceProfileList.tsx'),
    path.join(__dirname, 'frontend', 'src', 'components', 'FaceManagement', 'FaceDetectionLog.tsx'),
    path.join(__dirname, 'frontend', 'src', 'components', 'FaceManagement', 'FaceAnalytics.tsx'),
    path.join(__dirname, 'frontend', 'src', 'components', 'FaceManagement', 'BulkFaceUpload.tsx'),
    path.join(__dirname, 'frontend', 'src', 'components', 'FaceManagement', 'FaceManagementDashboard.tsx')
  ];
  
  let totalFilesFixed = 0;
  
  filesToFix.forEach(filePath => {
    log(`\\nFixing file: ${path.basename(filePath)}`, 'INFO');
    
    // Apply JSX quote fixes
    if (fixFile(filePath, fixes.jsxQuotes)) {
      totalFilesFixed++;
    }
  });
  
  log(`\\n✅ FIXES APPLIED SUCCESSFULLY`, 'SUCCESS');
  log(`Files processed: ${filesToFix.length}`, 'INFO');
  log(`Files fixed: ${totalFilesFixed}`, 'SUCCESS');
  
  return totalFilesFixed;
}

// Run the fixes
if (import.meta.url === `file://${process.argv[1]}`) {
  applyCriticalFixes();
}

export default applyCriticalFixes;
