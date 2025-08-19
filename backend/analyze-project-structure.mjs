// backend/analyze-project-structure.mjs
/**
 * APEX AI PROJECT STRUCTURE ANALYZER
 * ==================================
 * Analyzes current project to identify cleanup needs and missing components
 */

import fs from 'fs';
import path from 'path';
import chalk from 'chalk';

console.log(chalk.blue.bold('\n🔍 APEX AI PROJECT STRUCTURE ANALYSIS'));
console.log(chalk.blue('======================================\n'));

// Define the project root
const projectRoot = 'C:\\Users\\APEX AI\\Desktop\\defense';
const backendRoot = path.join(projectRoot, 'backend');

function analyzeDirectory(dirPath, level = 0) {
  const items = [];
  try {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      const relativePath = path.relative(projectRoot, fullPath);
      
      if (entry.isDirectory()) {
        // Skip node_modules and other large directories
        if (['node_modules', '.git', 'dist', 'build'].includes(entry.name)) {
          continue;
        }
        
        items.push({
          type: 'directory',
          name: entry.name,
          path: relativePath,
          level: level
        });
        
        // Recursively analyze subdirectories (limit depth)
        if (level < 3) {
          items.push(...analyzeDirectory(fullPath, level + 1));
        }
      } else {
        // Analyze file types
        const ext = path.extname(entry.name).toLowerCase();
        let category = 'other';
        
        if (['.mjs', '.js', '.ts'].includes(ext)) {
          category = 'javascript';
        } else if (['.sql'].includes(ext)) {
          category = 'database';
        } else if (['.tsx', '.jsx'].includes(ext)) {
          category = 'react';
        } else if (['.json'].includes(ext)) {
          category = 'config';
        } else if (['.md'].includes(ext)) {
          category = 'documentation';
        } else if (['.bat', '.sh'].includes(ext)) {
          category = 'scripts';
        }
        
        items.push({
          type: 'file',
          name: entry.name,
          path: relativePath,
          level: level,
          category: category,
          extension: ext
        });
      }
    }
  } catch (error) {
    console.error(`Error reading directory ${dirPath}:`, error.message);
  }
  
  return items;
}

function categorizeFiles(items) {
  const categories = {
    'Old Database Files': [],
    'Migration Files': [],
    'Model Files': [],
    'Setup Scripts': [],
    'React Components': [],
    'API Routes': [],
    'Middleware': [],
    'Configuration': [],
    'Documentation': [],
    'Cleanup Candidates': []
  };
  
  for (const item of items) {
    if (item.type === 'file') {
      const fileName = item.name.toLowerCase();
      const filePath = item.path.toLowerCase();
      
      // Categorize files
      if (fileName.includes('setup') || fileName.includes('migration') || fileName.includes('db-')) {
        if (fileName.includes('migration')) {
          categories['Migration Files'].push(item);
        } else {
          categories['Setup Scripts'].push(item);
        }
      } else if (filePath.includes('models') && item.category === 'javascript') {
        categories['Model Files'].push(item);
      } else if (filePath.includes('routes') && item.category === 'javascript') {
        categories['API Routes'].push(item);
      } else if (filePath.includes('middleware') && item.category === 'javascript') {
        categories['Middleware'].push(item);
      } else if (filePath.includes('components') && item.category === 'react') {
        categories['React Components'].push(item);
      } else if (item.category === 'config' || fileName.includes('config')) {
        categories['Configuration'].push(item);
      } else if (item.category === 'documentation') {
        categories['Documentation'].push(item);
      } else if (
        fileName.includes('old') || 
        fileName.includes('temp') || 
        fileName.includes('test') || 
        fileName.includes('backup') ||
        fileName.includes('original') ||
        fileName.includes('sequelize') ||
        fileName.startsWith('20250') // Old migration files
      ) {
        categories['Cleanup Candidates'].push(item);
      } else if (item.category === 'database') {
        categories['Old Database Files'].push(item);
      }
    }
  }
  
  return categories;
}

function identifyMissingComponents() {
  const requiredComponents = {
    'Backend API Endpoints': [
      'routes/internal/v1/sops.mjs',
      'routes/internal/v1/contacts.mjs', 
      'routes/internal/v1/guards.mjs',
      'routes/internal/v1/dispatch.mjs'
    ],
    'Desktop App Components': [
      'apex_ai_desktop_app/src/components/SOPManagement/SOPEditor.jsx',
      'apex_ai_desktop_app/src/components/ContactManagement/ContactListManager.jsx',
      'apex_ai_desktop_app/src/components/RoleManagement/UserRoleManager.jsx'
    ],
    'Client Portal Enhancements': [
      'client-portal/src/types/unified.types.ts',
      'client-portal/src/services/unifiedAPI.ts',
      'client-portal/src/hooks/useRoleBasedAccess.ts'
    ],
    'Database Integration': [
      'backend/database/unifiedQueries.mjs', // We created this
      'backend/middleware/unifiedAuth.mjs',
      'backend/services/roleBasedAccess.mjs'
    ]
  };
  
  const missingComponents = {};
  
  for (const [category, components] of Object.entries(requiredComponents)) {
    missingComponents[category] = [];
    
    for (const componentPath of components) {
      const fullPath = path.join(projectRoot, componentPath);
      if (!fs.existsSync(fullPath)) {
        missingComponents[category].push(componentPath);
      }
    }
  }
  
  return missingComponents;
}

// Execute analysis
console.log(chalk.yellow('📁 Analyzing project structure...'));
const allItems = analyzeDirectory(projectRoot);
const categorizedFiles = categorizeFiles(allItems);
const missingComponents = identifyMissingComponents();

// Display results
console.log(chalk.green('\\n📊 PROJECT ANALYSIS RESULTS'));
console.log(chalk.green('============================'));

// Show file categories
for (const [category, files] of Object.entries(categorizedFiles)) {
  if (files.length > 0) {
    console.log(chalk.cyan(`\\n${category} (${files.length} files):`));
    files.forEach(file => {
      const prefix = file.level > 0 ? '  '.repeat(file.level) : '';
      const status = category === 'Cleanup Candidates' ? chalk.red('❌') : chalk.blue('📄');
      console.log(`${prefix}${status} ${file.path}`);
    });
  }
}

// Show missing components
console.log(chalk.yellow('\\n🔍 MISSING COMPONENTS ANALYSIS'));
console.log(chalk.yellow('==============================='));

for (const [category, components] of Object.entries(missingComponents)) {
  if (components.length > 0) {
    console.log(chalk.red(`\\n❌ ${category}:`));
    components.forEach(component => {
      console.log(chalk.white(`   📝 ${component}`));
    });
  } else {
    console.log(chalk.green(`\\n✅ ${category}: All components exist`));
  }
}

// Cleanup recommendations
console.log(chalk.blue.bold('\\n🧹 CLEANUP RECOMMENDATIONS'));
console.log(chalk.blue('==========================='));

const cleanupCandidates = categorizedFiles['Cleanup Candidates'];
if (cleanupCandidates.length > 0) {
  console.log(chalk.yellow(`\\n⚠️ Found ${cleanupCandidates.length} files that can be safely removed:`));
  cleanupCandidates.forEach(file => {
    console.log(chalk.red(`   🗑️ ${file.path}`));
  });
  
  console.log(chalk.white('\\n💡 After database setup, consider moving these to an archive folder.'));
} else {
  console.log(chalk.green('\\n✅ No obvious cleanup candidates found.'));
}

// Development priority
console.log(chalk.green.bold('\\n🎯 DEVELOPMENT PRIORITIES'));
console.log(chalk.green('=========================='));

const priorities = [
  {
    phase: 'PHASE 1: Database Foundation',
    status: 'READY TO EXECUTE',
    tasks: [
      'Execute unified database setup',
      'Update UnifiedQueries integration',
      'Test role-based access control'
    ]
  },
  {
    phase: 'PHASE 2: Backend API Updates',
    status: 'NEXT',
    tasks: [
      'Create internal API routes for guards/dispatch',
      'Update authentication middleware',
      'Implement role-based data scoping'
    ]
  },
  {
    phase: 'PHASE 3: Desktop Components',
    status: 'AFTER DATABASE',
    tasks: [
      'Build SOPEditor component',
      'Build ContactListManager component',
      'Update desktop app navigation'
    ]
  },
  {
    phase: 'PHASE 4: Production Deployment',
    status: 'FINAL',
    tasks: [
      'Deploy client portal to Render/Vercel',
      'Create Windows installer',
      'Final integration testing'
    ]
  }
];

priorities.forEach((priority, index) => {
  const statusColor = priority.status === 'READY TO EXECUTE' ? chalk.green : 
                     priority.status === 'NEXT' ? chalk.yellow : chalk.white;
  
  console.log(statusColor(`\\n${index + 1}. ${priority.phase}`));
  console.log(statusColor(`   Status: ${priority.status}`));
  priority.tasks.forEach(task => {
    console.log(chalk.white(`   • ${task}`));
  });
});

console.log(chalk.blue.bold('\\n📋 ANALYSIS COMPLETE'));
console.log(chalk.blue('===================='));
console.log(chalk.white('Project structure analyzed successfully.'));
console.log(chalk.white('Ready to proceed with unified database setup.'));
