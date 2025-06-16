#!/usr/bin/env node

/**
 * VS Studio Error Reporter & Prioritizer
 * =====================================
 * A comprehensive error detection and prioritization tool.
 *
 * 🔍 FEATURES: Scans code, prioritizes errors, suggests fixes, generates reports.
 * 💻 USAGE: ./vs-error-reporter.js [--file=<path>] [--quick] [--fix] [--report=<format>]
 */

/**
 * VS Studio Error Reporter & Prioritizer - Usage Instructions
 * =========================================================
 * 
 * OVERVIEW:
 * ---------
 * This tool helps detect, prioritize, and report code issues across your project.
 * It integrates with ESLint, Stylelint, TypeScript, and more to provide comprehensive 
 * error detection with intelligent prioritization.
 * 
 * INSTALLATION:
 * -------------
 * 1. Ensure Node.js is installed on your system
 * 2. Install required dependencies:
 *    npm install chalk ora glob figlet inquirer
 * 3. Make the script executable (Unix/Linux):
 *    chmod +x vs-error-reporter.js
 * 
 * BASIC USAGE:
 * ------------
 * Run the script with no arguments for interactive mode:
 *    ./vs-error-reporter.js
 * 
 * COMMAND LINE OPTIONS:
 * --------------------
 * --file=<path>      Analyze a specific file
 * --quick            Run a quick scan with current settings (non-interactive)
 * --fix              Attempt to automatically fix detected issues
 * --report=<format>  Generate and save a report (formats: terminal, html, markdown, json)
 * --report-name=<name> Custom name for the generated report file
 * --verbose          Show more detailed output during analysis
 * --no-prio          Disable error prioritization
 * --no-suggestions   Don't show fix suggestions
 * 
 * EXAMPLE COMMANDS:
 * ----------------
 * Quick scan entire project:
 *    ./vs-error-reporter.js --quick
 * 
 * Analyze a specific file with automatic fixing:
 *    ./vs-error-reporter.js --file=src/components/Header.jsx --fix
 * 
 * Generate an HTML report:
 *    ./vs-error-reporter.js --quick --report=html
 * 
 * CONFIGURATION:
 * -------------
 * The tool can be configured using a .vs-error-reporter.json file in your project root.
 * You can also run the configuration wizard in interactive mode.
 * 
 * Key configuration options:
 * - projectRoot: Base directory for analysis
 * - outputFormat: Report format (terminal, html, markdown, json)
 * - fileExtensions: File types to analyze
 * - ignoredFolders: Directories to skip
 * - ignoredFiles: File patterns to skip
 * - prioritizationEnabled: Enable/disable error prioritization
 * - priorityWeights: Customize importance of different error types
 * 
 * INTERACTIVE MODE:
 * ----------------
 * The interactive mode provides a menu-driven interface with options:
 * 1. Scan Entire Project - Analyze all files in the project
 * 2. Scan Specific File - Analyze a single file by path
 * 3. Search & Scan Files - Find and analyze files by pattern
 * 4. Configure Settings - Run the configuration wizard
 * 
 * ERROR PRIORITIZATION:
 * -------------------
 * Errors are categorized by priority:
 * - security: Security vulnerabilities (highest priority)
 * - critical: Errors that will cause runtime failures
 * - functionality: Issues that impact feature correctness
 * - performance: Issues that may cause slowdowns
 * - accessibility: Issues affecting user accessibility
 * - maintainability: Code quality and maintainability issues
 * - style: Code style and formatting issues (lowest priority)
 * 
 * REPORTS:
 * -------
 * Reports provide a summary of all detected issues, organized by priority and file.
 * The HTML report includes a fully interactive interface for exploring issues.
 * 
 * TROUBLESHOOTING:
 * --------------
 * - Ensure all required dependencies are installed
 * - Verify that ESLint/Stylelint/TypeScript are properly configured in your project
 * - For TypeScript projects, ensure tsconfig.json exists in your project root
 * - Check for permissions issues when writing reports
 * 
 * INTEGRATING WITH CI/CD:
 * ---------------------
 * For CI/CD integration, use the --quick and --report options:
 *    ./vs-error-reporter.js --quick --report=json --report-name=error-report
 * 
 * BEST PRACTICES:
 * -------------
 * - Run regular quick scans during development
 * - Generate HTML reports for comprehensive team reviews
 * - Use the prioritization system to fix critical issues first
 * - Save configuration to .vs-error-reporter.json for consistent analysis
 */

// Core dependencies
const fs = require('fs');
const path = require('path');
const util = require('util');
const { exec: callbackExec } = require('child_process');

// Promisify exec for async/await usage
const exec = util.promisify(callbackExec);

// External dependencies (must be installed)
const chalk = require('chalk');
const ora = require('ora');
const glob = require('glob');
const figlet = require('figlet');
const inquirer = require('inquirer');

// Then add this simple check
if (!chalk || !ora || !glob || !figlet || !inquirer) {
  console.error('Required dependencies not found. Please run:');
  console.error('npm install chalk ora glob figlet inquirer');
  process.exit(1);
}

// --- Configuration ---

const defaultConfig = {
  projectRoot: process.cwd(),
  outputFormat: 'terminal', // terminal, html, markdown, json
  verbose: false,
  fixAutomatically: false,
  autoSaveReport: false,
  quickScan: false,
  specificFile: null,
  specificDir: null,
  prioritizationEnabled: true,
  showSuggestions: true,
  maxErrorsPerFile: 50,
  ignoredFolders: ['node_modules', 'dist', 'build', '.git', 'coverage', '.cache', 'public', 'assets', 'vendor'],
  ignoredFiles: ['.env', '*.log', '*.lock', 'package-lock.json', 'yarn.lock', '*.min.js', '*.min.css'],
  // Let linters decide based on their config, but add common ones
  fileExtensions: ['.js', '.jsx', '.ts', '.tsx', '.vue', '.css', '.scss', '.less', '.json', '.md', '.sql'],
  isReactApp: false,
  isExpressApp: false,
  useTypeScript: false,
  usesPostgreSQL: false,
  detectRoutes: true, // Placeholder for future enhancement
  detectComponents: true, // Placeholder for future enhancement
  analyzePackageJson: true,
  checkDependencyVulnerabilities: false, // Requires 'npm audit' or similar - keep false for now
  importAnalysis: false, // Placeholder for future enhancement
  priorityWeights: {
    security: 10,
    critical: 9,
    functionality: 7,
    performance: 6,
    accessibility: 5,
    maintainability: 3,
    style: 1,
    other: 0 // Add 'other' for default cases
  },
  reportFilename: 'error-report' // Base name for saved reports
};

// --- Error Definitions (Define before use) ---

const ERROR_PRIORITIES = {
  // Security issues
  'no-eval': { priority: 'security', description: 'Using eval() can lead to security vulnerabilities', fix: 'Remove eval() and use safer alternatives' },
  'react/no-danger': { priority: 'security', description: 'Using dangerouslySetInnerHTML can lead to XSS vulnerabilities', fix: 'Avoid dangerouslySetInnerHTML or sanitize inputs' },
  'sql-injection': { priority: 'security', description: 'Potential SQL injection vulnerability', fix: 'Use parameterized queries or an ORM' },
  'no-secrets': { priority: 'security', description: 'Hardcoded secrets or credentials found', fix: 'Use environment variables for secrets' },

  // Critical errors
  'no-undef': { priority: 'critical', description: 'Using undefined variables will cause runtime errors', fix: 'Declare the variable or check spelling' },
  'react/jsx-no-undef': { priority: 'critical', description: 'Using undefined components in JSX', fix: 'Import the component or check the name' },
  'import/no-unresolved': { priority: 'critical', description: 'Import could not be resolved', fix: 'Check the import path, install dependency, or configure resolver' },
  'syntax error': { priority: 'critical', description: 'Syntax error preventing code execution', fix: 'Correct the syntax according to language rules' }, // Generic syntax

  // Functionality issues
  'react/prop-types': { priority: 'functionality', description: 'Missing prop type validation', fix: 'Add PropTypes or use TypeScript interfaces' },
  'react/jsx-key': { priority: 'functionality', description: 'Missing key prop for array elements', fix: 'Add a unique key prop to each item in the array' },
  'no-unreachable': { priority: 'functionality', description: 'Unreachable code detected', fix: 'Remove or fix the unreachable code' },
  'react-hooks/rules-of-hooks': { priority: 'functionality', description: 'React Hook called conditionally or out of order', fix: 'Call Hooks only at the top level of functional components or custom Hooks' },

  // Performance issues
  'react/no-array-index-key': { priority: 'performance', description: 'Using array index as key can lead to performance issues and bugs during re-renders', fix: 'Use a stable, unique identifier from your data as the key' },
  'react-hooks/exhaustive-deps': { priority: 'performance', description: 'Missing dependencies in React useEffect/useCallback', fix: 'Add all external variables used inside the hook to the dependency array' },
  'no-unused-vars': { priority: 'performance', description: 'Unused variables increase bundle size and can indicate dead code', fix: 'Remove unused variables or prefix with _ if intentionally unused' }, // Often flagged as warning, but impacts performance/readability

  // Accessibility issues
  'jsx-a11y/alt-text': { priority: 'accessibility', description: 'Images must have alt text for screen readers', fix: 'Add descriptive alt text to the image, or use alt="" for decorative images' },
  'jsx-a11y/accessible-emoji': { priority: 'accessibility', description: 'Emojis should be wrapped in <span> with role="img" and aria-label', fix: 'Wrap emoji in span with appropriate ARIA attributes' },
  'jsx-a11y/anchor-is-valid': { priority: 'accessibility', description: 'Anchor tags require valid href or button usage for interaction', fix: 'Provide a valid href or use a button element for click handlers' },

  // Maintainability issues
  'max-lines': { priority: 'maintainability', description: 'File is too long and may be hard to maintain', fix: 'Break down the file into smaller, focused modules or components' },
  'complexity': { priority: 'maintainability', description: 'Function has high cyclomatic complexity, making it hard to test and understand', fix: 'Refactor the function into smaller, single-responsibility functions' },
  'no-magic-numbers': { priority: 'maintainability', description: 'Magic numbers make code hard to understand and update', fix: 'Extract magic numbers to named constants with meaningful names' },

  // Style issues
  'indent': { priority: 'style', description: 'Incorrect indentation', fix: 'Fix indentation or run an auto-formatter (like Prettier)' },
  'quotes': { priority: 'style', description: 'Inconsistent quote style', fix: "Use consistent quotes (single or double) as per project standards" },
  'semi': { priority: 'style', description: 'Missing or unnecessary semicolons', fix: 'Add or remove semicolons consistently, or run an auto-formatter' },
  'prettier/prettier': { priority: 'style', description: 'Code formatting doesn\'t match Prettier rules', fix: 'Run prettier to format the code' }
};

const ERROR_DATABASE = {
  // Common error messages mapped to priorities/fixes if not covered by ruleId
  'React Hook useEffect has a missing dependency': { priority: 'performance', description: 'useEffect is missing a dependency that it uses', fix: 'Add the missing variable to the dependency array or remove it from the effect' },
  'Cannot read property': { priority: 'critical', description: 'Trying to access a property on an undefined or null object', fix: 'Add null/undefined checks (e.g., optional chaining `obj?.prop`) or ensure the object is initialized' },
  'req.body is undefined': { priority: 'functionality', description: 'Request body is undefined, likely missing body-parser middleware', fix: 'Ensure `express.json()` or `express.urlencoded()` middleware is used before routes' },
  'CORS': { priority: 'functionality', description: 'Cross-Origin Resource Sharing error', fix: 'Configure CORS headers on the server, e.g., using the `cors` middleware' },
  'non-serializable value': { priority: 'functionality', description: 'Non-serializable value detected (e.g., in Redux state)', fix: 'Ensure only serializable data (plain objects, arrays, primitives) are stored in state' },
  'Property .* does not exist on type': { priority: 'critical', description: 'TypeScript error: Property access on incorrect type', fix: 'Check type definitions, ensure property exists, or use type guards/assertions carefully' },
  'syntax error at or near': { priority: 'critical', description: 'SQL syntax error', fix: 'Verify SQL query syntax' },
  'is not defined': { priority: 'critical', description: 'Variable or function used before definition or not defined at all', fix: 'Declare the variable/function or check for typos' },
};

// --- Global State ---
let analysisResults = []; // Store results for reporting/fixing
let config = loadConfiguration(); // Load initial config

// --- Core Analysis Logic ---

/**
 * Determines the general type of a file based on its extension.
 */
function getFileType(filePath) {
  const extension = path.extname(filePath).toLowerCase();
  if (['.js', '.jsx', '.mjs', '.cjs'].includes(extension)) return 'javascript';
  if (['.ts', '.tsx'].includes(extension)) return 'typescript';
  if (['.css', '.scss', '.sass', '.less'].includes(extension)) return 'css';
  if (extension === '.json') return 'json';
  if (extension === '.sql') return 'sql';
  if (extension === '.vue') return 'vue';
  if (['.md', '.markdown'].includes(extension)) return 'markdown';
  // Add more types as needed
  return 'other';
}

/**
 * Assigns priority and suggestions to an error based on rules and patterns.
 */
function prioritizeError(rawError) {
    let priority = 'other'; // Default priority
    let description = '';
    let fix = '';
    const ruleId = rawError.ruleId || 'unknown';
    const message = rawError.message || '';

    // 1. Check specific rule ID in ERROR_PRIORITIES
    if (ruleId && ERROR_PRIORITIES[ruleId]) {
        priority = ERROR_PRIORITIES[ruleId].priority;
        description = ERROR_PRIORITIES[ruleId].description;
        fix = ERROR_PRIORITIES[ruleId].fix;
    } else {
        // 2. Check general error message patterns in ERROR_DATABASE
        for (const [pattern, info] of Object.entries(ERROR_DATABASE)) {
            try {
                // Use regex for patterns that look like regex, otherwise simple includes
                const regex = new RegExp(pattern, 'i'); // Case-insensitive match
                 if (message.includes(pattern) || regex.test(message)) {
                     priority = info.priority;
                     description = info.description || '';
                     fix = info.fix || '';
                     break; // Found a match
                 }
             } catch (e) { // Handle invalid regex patterns gracefully
                 if (message.toLowerCase().includes(pattern.toLowerCase())) {
                    priority = info.priority;
                    description = info.description || '';
                    fix = info.fix || '';
                    break; // Found a match
                 }
            }
        }
    }

     // 3. Infer priority based on severity if still 'other'
     if (priority === 'other') {
         if (rawError.severity === 2 || rawError.severity === 'error') {
             priority = 'critical'; // Assume lint errors are critical if not otherwise specified
         } else if (rawError.severity === 1 || rawError.severity === 'warning') {
             priority = 'maintainability'; // Assume warnings relate to maintainability/style
         }
     }


    return {
        ...rawError,
        priority,
        description: description || message, // Use message if no specific description
        fix: config.showSuggestions ? fix : '', // Only include fix if enabled
        score: config.priorityWeights[priority] || 0
    };
}


/**
 * Parses ESLint JSON output into a standardized error format.
 */
function parseEslintOutput(stdout, filePath) {
    let errors = [];
    try {
        const lintResults = JSON.parse(stdout);
        if (lintResults.length > 0 && lintResults[0].messages) {
            errors = lintResults[0].messages.map(msg => prioritizeError({
                line: msg.line,
                column: msg.column,
                message: msg.message,
                ruleId: msg.ruleId || 'eslint-issue',
                severity: msg.severity, // 1 for warning, 2 for error
                type: 'lint'
            }));
        }
    } catch (e) {
        console.error(chalk.red(`\nError parsing ESLint output for ${path.basename(filePath)}:`), e.message);
        // Optionally add a generic error if parsing fails but stdout exists
        if(stdout && stdout.length > 10) { // Avoid adding error for empty output
             errors.push(prioritizeError({
                 line: 1, column: 1, message: "Failed to parse ESLint output. Check ESLint setup or run manually.",
                 ruleId: 'reporter-error', severity: 2, type: 'reporter'
             }));
        }
    }
    return errors;
}

/**
 * Parses Stylelint JSON output into a standardized error format.
 */
function parseStylelintOutput(stdout, filePath) {
    let errors = [];
    try {
        const lintResults = JSON.parse(stdout);
        if (lintResults.length > 0 && lintResults[0].warnings) {
            errors = lintResults[0].warnings.map(msg => prioritizeError({
                line: msg.line,
                column: msg.column,
                message: msg.text,
                ruleId: msg.rule || 'stylelint-issue',
                severity: msg.severity === 'error' ? 2 : 1, // map 'error'/'warning' to numbers
                type: 'style'
            }));
        }
    } catch (e) {
        console.error(chalk.red(`\nError parsing Stylelint output for ${path.basename(filePath)}:`), e.message);
         if(stdout && stdout.length > 10) {
             errors.push(prioritizeError({
                 line: 1, column: 1, message: "Failed to parse Stylelint output. Check Stylelint setup or run manually.",
                 ruleId: 'reporter-error', severity: 2, type: 'reporter'
             }));
         }
    }
    return errors;
}

/**
 * Parses TypeScript error output (stderr) into a standardized error format.
 */
function parseTypeScriptErrors(stderr, filePath) {
    const errors = [];
    const lines = stderr.split('\n');
    const filename = path.basename(filePath); // Match errors specific to this file

    for (const line of lines) {
        // Format: path/to/file.ts(line,col): error TSxxxx: Message.
        // Or sometimes path/to/file.ts:line:col - error TSxxxx: Message.
         const match = line.match(/(?:\(|\:)(\d+)[,:](\d+)\)?:\s+error\s+TS(\d+):\s+(.*)/);

        if (match && line.startsWith(filePath)) { // Ensure the error line refers to the correct file
            errors.push(prioritizeError({
                line: parseInt(match[1], 10),
                column: parseInt(match[2], 10),
                message: match[4].trim(),
                ruleId: `TS${match[3]}`,
                severity: 2, // TypeScript errors are generally critical
                type: 'typescript'
            }));
        }
    }
    return errors;
}


/**
 * Basic analysis for SQL files using regex patterns.
 */
function analyzeSQLFile(filePath, content) {
    const errors = [];
    const lines = content.split('\n');

    const patterns = [
        { regex: /SELECT\s+\*\s+FROM/i, message: 'Avoid SELECT *. Specify required columns.', priority: 'performance', fix: 'List needed columns explicitly.' },
        { regex: /DELETE\s+FROM\s+\w+(\s*;)?\s*$/i, message: 'DELETE without WHERE clause. This will delete all rows!', priority: 'critical', fix: 'Add a WHERE clause or ensure this is intended.' },
        { regex: /UPDATE\s+\w+\s+SET\s+.*(\s*;)?\s*$/i, condition: (line) => !/WHERE/i.test(line), message: 'UPDATE without WHERE clause. This will update all rows!', priority: 'critical', fix: 'Add a WHERE clause or ensure this is intended.' },
        // Very basic check for potential SQL injection pattern - Needs refinement
        { regex: /CONCAT\(|\|\|.*\s*['"].*\s*\+\s*.*\s*['"]/, message: 'String concatenation in SQL query might lead to SQL injection.', priority: 'security', fix: 'Use parameterized queries or prepared statements.' },
         { regex: /DROP\s+TABLE\s+(IF\s+EXISTS\s+)?\w+(\s*;)?\s*$/i, message: 'DROP TABLE statement found. Ensure this is not accidental.', priority: 'critical', fix: 'Verify if dropping the table is intended and safe.' },
         { regex: /DROP\s+DATABASE\s+(IF\s+EXISTS\s+)?\w+(\s*;)?\s*$/i, message: 'DROP DATABASE statement found. Extremely dangerous!', priority: 'security', fix: 'Verify if dropping the database is intended and absolutely necessary.' },
    ];

    lines.forEach((line, index) => {
        patterns.forEach(pattern => {
            let match = false;
            if (pattern.condition) {
                 if (pattern.regex.test(line) && pattern.condition(line)) {
                     match = true;
                 }
            } else if (pattern.regex.test(line)) {
                 match = true;
            }

            if (match) {
                errors.push(prioritizeError({
                    line: index + 1,
                    column: 1, // Regex doesn't give column easily
                    message: pattern.message,
                    ruleId: 'sql-pattern',
                    severity: pattern.priority === 'critical' || pattern.priority === 'security' ? 2 : 1,
                    type: 'sql',
                    priority: pattern.priority, // Use priority from pattern
                    fix: pattern.fix
                }));
            }
        });
    });

    return errors;
}


/**
 * Analyzes a single file for errors using appropriate linters.
 */
async function analyzeFile(filePath, displayProgress = true) {
    const fileType = getFileType(filePath);
    const relativePath = path.relative(config.projectRoot, filePath);
    const spinner = displayProgress ? ora(`Analyzing ${relativePath}...`).start() : null;
    let errors = [];

    try {
        if (!fs.existsSync(filePath)) {
            if (spinner) spinner.fail(`File not found: ${relativePath}`);
            return { file: filePath, errors: [], fileType: 'not_found' };
        }

        const fileContent = fs.readFileSync(filePath, 'utf-8');
        if (fileContent.length === 0) {
            if (spinner) spinner.info(`Skipping empty file: ${relativePath}`);
             return { file: filePath, errors: [], fileType };
        }


        // --- Linter Execution ---
        if (fileType === 'javascript' || (fileType === 'typescript' && !config.useTypeScript)) { // Use ESLint for JS/TS if TS checking is off
            const command = `npx eslint "${filePath}" --format json --no-error-on-unmatched-pattern --quiet`;
            try {
                const { stdout } = await exec(command);
                errors.push(...parseEslintOutput(stdout, filePath));
            } catch (error) {
                // ESLint throws error if issues are found. Parse stdout even on error.
                if (error.stdout) {
                    errors.push(...parseEslintOutput(error.stdout, filePath));
                } else {
                     if (spinner) spinner.warn(`ESLint failed for ${relativePath}. Is it configured?`);
                     console.error(chalk.yellow(`\nESLint execution error for ${relativePath}:`), error.message);
                     errors.push(prioritizeError({ line: 1, column: 1, message: `ESLint execution failed: ${error.message}`, ruleId: 'eslint-exec-error', severity: 1, type: 'reporter' }));
                 }
             }
         }

         if (fileType === 'typescript' && config.useTypeScript) {
             // Run ESLint first for general rules
             const eslintCommand = `npx eslint "${filePath}" --format json --no-error-on-unmatched-pattern --quiet`;
             try {
                 const { stdout } = await exec(eslintCommand);
                 errors.push(...parseEslintOutput(stdout, filePath));
             } catch (error) {
                 if (error.stdout) errors.push(...parseEslintOutput(error.stdout, filePath));
                 else if (spinner) spinner.warn(`ESLint failed for TS file ${relativePath}. Might rely only on TSC.`);
             }

             // Then run TypeScript compiler for type errors
             // Try finding tsconfig.json automatically
             const tsconfigPath = path.join(config.projectRoot, 'tsconfig.json'); // Adjust if needed
             const tscCommand = `npx tsc --noEmit ${fs.existsSync(tsconfigPath) ? `--project "${tsconfigPath}"` : ''} "${filePath}"`;
             try {
                 // TSC outputs errors to stderr and exits with non-zero code if errors exist
                 await exec(tscCommand);
             } catch (error) {
                 // Errors are expected in stderr
                 if (error.stderr) {
                     errors.push(...parseTypeScriptErrors(error.stderr, filePath));
                 } else {
                     if (spinner) spinner.warn(`TSC execution failed unexpectedly for ${relativePath}`);
                     console.error(chalk.yellow(`\nTSC execution error for ${relativePath}:`), error.message);
                     errors.push(prioritizeError({ line: 1, column: 1, message: `TSC execution failed: ${error.message}`, ruleId: 'tsc-exec-error', severity: 1, type: 'reporter' }));
                 }
             }
         }

        if (fileType === 'css') {
            const command = `npx stylelint "${filePath}" --formatter json --quiet`;
             try {
                 const { stdout } = await exec(command);
                 errors.push(...parseStylelintOutput(stdout, filePath));
             } catch (error) {
                 // Stylelint also exits with non-zero on errors
                 if (error.stdout) {
                     errors.push(...parseStylelintOutput(error.stdout, filePath));
                 } else {
                     if (spinner) spinner.warn(`Stylelint failed for ${relativePath}. Is it configured?`);
                     console.error(chalk.yellow(`\nStylelint execution error for ${relativePath}:`), error.message);
                     errors.push(prioritizeError({ line: 1, column: 1, message: `Stylelint execution failed: ${error.message}`, ruleId: 'stylelint-exec-error', severity: 1, type: 'reporter' }));
                 }
             }
         }

        if (fileType === 'sql' && config.usesPostgreSQL) {
             errors.push(...analyzeSQLFile(filePath, fileContent));
        }

        // --- Post-processing ---
        // TODO: Add enhanceErrorsWithContextualInfo(filePath, errors) if implemented

        // Sort errors by priority (descending) then line number (ascending)
        if (config.prioritizationEnabled) {
            errors.sort((a, b) => (b.score || 0) - (a.score || 0) || a.line - b.line);
        } else {
             errors.sort((a, b) => a.line - b.line || a.column - b.column);
         }

        // Limit number of errors per file
        if (config.maxErrorsPerFile > 0 && errors.length > config.maxErrorsPerFile) {
            const originalCount = errors.length;
             errors = errors.slice(0, config.maxErrorsPerFile);
             errors.push({ // Add a marker error
                 line: errors[errors.length - 1]?.line || 1, column: 1, message: `... ${originalCount - config.maxErrorsPerFile} more issues truncated.`,
                 ruleId: 'reporter-truncate', severity: 0, type: 'reporter', priority: 'other', score: 0
             });
         }

        const result = { file: filePath, errors, fileType };

        if (spinner) {
            const issueCount = result.errors.filter(e => e.type !== 'reporter').length; // Exclude reporter messages from count
             if (issueCount > 0) {
                spinner.warn(`Found ${issueCount} issues in ${relativePath}`);
            } else {
                spinner.succeed(`No issues found in ${relativePath}`);
            }
        }

        // Optionally display results immediately (for single file scans)
        // if (displayProgress) displayFileResults(result); // Moved display logic to caller

        return result;

    } catch (error) {
        if (spinner) spinner.fail(`Unexpected error analyzing ${relativePath}`);
        console.error(chalk.red(`\nFailed to analyze ${relativePath}:`), error);
        return { file: filePath, errors: [
             { line: 1, column: 1, message: `Analysis failed: ${error.message}`, ruleId: 'analysis-crash', severity: 2, type: 'reporter', priority: 'critical', score: 10 }
        ], fileType };
    }
}


// --- UI & Display Functions ---

function displayBanner() {
    console.log('\n');
    try {
        console.log(chalk.blue(figlet.textSync('VS Error', { horizontalLayout: 'full' })));
        console.log(chalk.blue(figlet.textSync('Reporter', { horizontalLayout: 'full' })));
    } catch (e) { // Fallback if figlet fails
        console.log(chalk.blue.bold("=== VS Error Reporter ==="));
    }
    console.log(chalk.gray('\n  A comprehensive error detection and prioritization tool'));
    console.log(chalk.gray('  Analyzing project at:'), chalk.cyan(config.projectRoot));
    console.log(''); // Add space
}

function getPriorityColor(priority) {
    const colors = {
        security: chalk.bgRed.white.bold,
        critical: chalk.red.bold,
        functionality: chalk.magenta,
        performance: chalk.yellow,
        accessibility: chalk.cyan,
        maintainability: chalk.blue,
        style: chalk.gray,
        other: chalk.white
    };
    return colors[priority] || chalk.white;
}

function formatErrorText(error, showLine = true) {
    const priorityText = config.prioritizationEnabled && error.priority ?
        `[${getPriorityColor(error.priority)(error.priority.toUpperCase())}]` : '';

    const locationText = showLine && error.line ?
        `${chalk.cyan(error.line)}:${chalk.cyan(error.column || 1)}` : ''; // Default col to 1 if missing

     const messageText = error.message || 'No message';
     const ruleText = error.ruleId ? chalk.gray(`(${error.ruleId})`) : '';
     const fixText = error.fix ? chalk.green(`\n    └─ Suggestion: ${error.fix}`) : '';


    return `${priorityText} ${locationText} ${messageText} ${ruleText}${fixText}`;
}

/**
 * Displays a summary of results for a single file in the terminal.
 */
function displayFileResults(result) {
    if (!result || !result.errors || result.errors.length === 0) {
        // Optionally log if no errors were found, handled by caller usually
        // console.log(chalk.green(`✓ No issues found in ${path.relative(config.projectRoot, result.file)}`));
        return;
    }

    const relativePath = path.relative(config.projectRoot, result.file);
    console.log(`\n📄 ${chalk.bold.underline(relativePath)} (${result.errors.length} issues)`);

    result.errors.forEach(error => {
        console.log(`  ${formatErrorText(error)}`);
    });
     console.log(chalk.gray(`   Copy-paste location: ${result.file}:${result.errors[0]?.line || 1}:${result.errors[0]?.column || 1}`)); // Link to first error
 }

/**
 * Displays a summary of all results in the terminal.
 */
function displayResultsSummary(results) {
    const filesWithErrors = results.filter(r => r.errors && r.errors.length > 0);
    if (filesWithErrors.length === 0) {
        console.log(chalk.green('\n✨ No issues found in the analyzed files!'));
        return;
    }

    console.log(chalk.yellow(`\n=== Analysis Summary ===`));
    console.log(chalk.yellow(`Found issues in ${filesWithErrors.length} files.`));

    const totalErrors = filesWithErrors.reduce((sum, file) => sum + file.errors.length, 0);
    console.log(chalk.red(`Total issues found: ${totalErrors}`));

    if (config.prioritizationEnabled) {
        const priorityCounts = {};
        filesWithErrors.forEach(file => {
            file.errors.forEach(error => {
                 const priority = error.priority || 'other';
                 priorityCounts[priority] = (priorityCounts[priority] || 0) + 1;
            });
        });

        console.log(chalk.blue('\nIssues by Priority:'));
         const priorityOrder = Object.keys(config.priorityWeights).sort((a, b) => config.priorityWeights[b] - config.priorityWeights[a]);

         priorityOrder.forEach(priority => {
             if (priorityCounts[priority]) {
                 console.log(`  ${getPriorityColor(priority)(priority.toUpperCase())}: ${priorityCounts[priority]}`);
             }
         });
     }

    console.log(chalk.blue('\nFiles with Issues:'));
    filesWithErrors.forEach(result => {
        displayFileResults(result); // Display detailed errors for each file
    });
}


// --- Configuration Management ---

function loadConfiguration() {
    let currentConfig = { ...defaultConfig };

    // 1. Load from .vs-error-reporter.json
    const configPath = path.join(process.cwd(), '.vs-error-reporter.json');
    if (fs.existsSync(configPath)) {
        try {
            const userConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
            // Deep merge priorityWeights if present
            if (userConfig.priorityWeights) {
                userConfig.priorityWeights = {...currentConfig.priorityWeights, ...userConfig.priorityWeights};
            }
            currentConfig = { ...currentConfig, ...userConfig };
            if (currentConfig.verbose) console.log(chalk.gray('Loaded configuration from .vs-error-reporter.json'));
        } catch (error) {
            console.warn(chalk.yellow('Warning: Could not parse .vs-error-reporter.json:'), error.message);
        }
    }

    // 2. Override with Command Line Arguments
    const args = process.argv.slice(2);
    args.forEach(arg => {
        if (arg.startsWith('--file=')) currentConfig.specificFile = arg.split('=')[1];
        else if (arg.startsWith('--dir=')) currentConfig.specificDir = arg.split('=')[1];
        else if (arg.startsWith('--report=')) {
            currentConfig.outputFormat = arg.split('=')[1];
            currentConfig.autoSaveReport = true; // Assume report generation implies saving
        }
        else if (arg.startsWith('--report-name=')) currentConfig.reportFilename = arg.split('=')[1];
        else if (arg === '--quick') currentConfig.quickScan = true;
        else if (arg === '--verbose') currentConfig.verbose = true;
        else if (arg === '--fix') currentConfig.fixAutomatically = true;
        else if (arg === '--no-prio') currentConfig.prioritizationEnabled = false;
        else if (arg === '--no-suggestions') currentConfig.showSuggestions = false;
         // Handle potential path for project root
         else if (fs.existsSync(arg) && fs.statSync(arg).isDirectory()) {
             currentConfig.projectRoot = path.resolve(arg); // Allow specifying project root as argument
         }
    });

    // Ensure projectRoot is absolute
    currentConfig.projectRoot = path.resolve(currentConfig.projectRoot);


    // 3. Auto-detect project type (optional, based on package.json)
    if (currentConfig.analyzePackageJson) {
        try {
            const packageJsonPath = path.join(currentConfig.projectRoot, 'package.json');
            if (fs.existsSync(packageJsonPath)) {
                const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
                const deps = { ...(packageJson.dependencies || {}), ...(packageJson.devDependencies || {}) };

                if (!currentConfig.isReactApp && deps.react) currentConfig.isReactApp = true;
                if (!currentConfig.isExpressApp && deps.express) currentConfig.isExpressApp = true;
                 if (!currentConfig.useTypeScript && (deps.typescript || fs.existsSync(path.join(currentConfig.projectRoot, 'tsconfig.json')))) {
                     currentConfig.useTypeScript = true;
                 }
                 if (!currentConfig.usesPostgreSQL && (deps.pg || deps['pg-native'] || deps.sequelize || deps.knex || deps['node-postgres'])) {
                     currentConfig.usesPostgreSQL = true;
                 }
                if (currentConfig.verbose) console.log(chalk.gray('Auto-detected project types from package.json'));
            }
        } catch (error) {
            console.warn(chalk.yellow('Warning: Could not analyze package.json:'), error.message);
        }
    }

    // Ensure ignored folders and files are relative patterns for glob
    currentConfig.ignoredFolders = currentConfig.ignoredFolders.map(folder => `**/${folder}/**`);
    currentConfig.ignoredFiles = currentConfig.ignoredFiles.map(file => `**/${file}`);

    return currentConfig;
}

function saveConfiguration(configToSave) {
    const configPath = path.join(process.cwd(), '.vs-error-reporter.json');
    try {
        // Prune runtime/derived options before saving
        const { quickScan, specificFile, specificDir, verbose, ...savableConfig } = configToSave;
         // Revert ignored patterns back to simple names
         savableConfig.ignoredFolders = savableConfig.ignoredFolders.map(p => p.split('/')[1]); // '** /name/**' -> 'name'
         savableConfig.ignoredFiles = savableConfig.ignoredFiles.map(p => p.startsWith('**/') ? path.basename(p) : p); // '** /file.ext' -> 'file.ext'

        fs.writeFileSync(configPath, JSON.stringify(savableConfig, null, 2));
        console.log(chalk.green(`Configuration saved to ${configPath}`));
    } catch (error) {
        console.error(chalk.red(`Error saving configuration to ${configPath}:`), error.message);
    }
}

async function configurationWizard() {
    console.log(chalk.blue('\n=== Configuration Wizard ==='));

    const answers = await inquirer.prompt([
        { type: 'input', name: 'projectRoot', message: 'Project root directory:', default: config.projectRoot },
        { type: 'confirm', name: 'isReactApp', message: 'Is this a React application?', default: config.isReactApp },
        { type: 'confirm', name: 'isExpressApp', message: 'Is this an Express.js backend?', default: config.isExpressApp },
        { type: 'confirm', name: 'useTypeScript', message: 'Does the project use TypeScript?', default: config.useTypeScript },
        { type: 'confirm', name: 'usesPostgreSQL', message: 'Does the project use PostgreSQL?', default: config.usesPostgreSQL },
        {
            type: 'input',
            name: 'ignoredFolders',
            message: 'Folders to ignore (comma-separated):',
            default: config.ignoredFolders.map(p => p.split('/')[1]).join(', '), // Show simple names
             filter: input => input.split(',').map(f => f.trim()).filter(f => f), // Process input back to array
             validate: input => input.length > 0 || 'Please enter at least one folder or leave default.'
         },
         {
             type: 'input',
             name: 'ignoredFiles',
             message: 'Files/patterns to ignore (comma-separated):',
             default: config.ignoredFiles.map(p => path.basename(p)).join(', '), // Show simple names/patterns
             filter: input => input.split(',').map(f => f.trim()).filter(f => f),
             validate: input => input.length > 0 || 'Please enter at least one file/pattern or leave default.'
         },
         { type: 'confirm', name: 'prioritizationEnabled', message: 'Enable error prioritization?', default: config.prioritizationEnabled },
         { type: 'confirm', name: 'showSuggestions', message: 'Show fix suggestions?', default: config.showSuggestions },
        { type: 'confirm', name: 'saveConfig', message: 'Save this configuration to .vs-error-reporter.json?', default: true }
    ]);

    // Update config object (create a new object to avoid mutation issues if needed)
    config = {
        ...config, // Keep existing settings not covered by wizard
        projectRoot: path.resolve(answers.projectRoot || process.cwd()),
        isReactApp: answers.isReactApp,
        isExpressApp: answers.isExpressApp,
        useTypeScript: answers.useTypeScript,
        usesPostgreSQL: answers.usesPostgreSQL,
         ignoredFolders: answers.ignoredFolders.map(f => `**/${f}/**`), // Convert back to glob pattern
         ignoredFiles: answers.ignoredFiles.map(f => `**/${f}`), // Convert back to glob pattern
         prioritizationEnabled: answers.prioritizationEnabled,
         showSuggestions: answers.showSuggestions,
    };

    if (answers.saveConfig) {
        saveConfiguration(config);
    }

    console.log(chalk.green('\nConfiguration updated.'));
    return config; // Return updated config
}


// --- File Management ---

/**
 * Finds files matching a pattern within the project root, respecting ignores.
 */
function findFilesByPattern(pattern) {
    const spinner = ora(`Searching for files matching '${pattern}'...`).start();
    try {
        // Combine user ignores with default node_modules etc.
        const ignorePatterns = [...config.ignoredFolders, ...config.ignoredFiles];

        const files = glob.sync(pattern, {
            cwd: config.projectRoot,
            ignore: ignorePatterns,
            absolute: true,
            nodir: true // Don't match directories
        });

         if (files.length === 0) {
             spinner.warn(`No files found matching '${pattern}'`);
         } else {
             spinner.succeed(`Found ${files.length} matching files`);
         }
        return files;
    } catch (error) {
        spinner.fail(`Error searching for files: ${error.message}`);
        return [];
    }
}

/**
 * Finds all relevant project files based on configuration.
 */
function findProjectFiles() {
    const spinner = ora('Finding project files to analyze...').start();
    try {
        // Use configured extensions or intelligent defaults
        const extensions = config.fileExtensions.map(ext => ext.startsWith('.') ? ext.substring(1) : ext);
         const pattern = `**/*.{${extensions.join(',')}}`; // Glob pattern for specified extensions

        const ignorePatterns = [...config.ignoredFolders, ...config.ignoredFiles];

        const files = glob.sync(pattern, {
            cwd: config.projectRoot,
            ignore: ignorePatterns,
            absolute: true,
            nodir: true
        });

         if (files.length === 0) {
             spinner.warn(`No files found matching configured extensions: ${config.fileExtensions.join(', ')}`);
         } else {
             spinner.succeed(`Found ${files.length} files to analyze`);
         }
        return files;
    } catch (error) {
        spinner.fail(`Error finding project files: ${error.message}`);
        return [];
    }
}

// --- Reporting ---

/**
 * Generates a Markdown formatted report.
 */
function generateMarkdownReport(results) {
    const filesWithErrors = results.filter(r => r.errors && r.errors.length > 0);
    const totalErrors = filesWithErrors.reduce((sum, file) => sum + file.errors.length, 0);

    let report = `# VS Error Reporter - Analysis Report\n\n`;
    report += `**Date:** ${new Date().toISOString()}\n`;
    report += `**Project Root:** \`${config.projectRoot}\`\n`;
    report += `**Files Scanned:** ${results.length}\n`;
    report += `**Files with Issues:** ${filesWithErrors.length}\n`;
    report += `**Total Issues Found:** ${totalErrors}\n\n`;

    // --- Priority Summary ---
    if (config.prioritizationEnabled && totalErrors > 0) {
        report += '## Issues by Priority\n\n';
        const priorityCounts = {};
        filesWithErrors.forEach(file => {
            file.errors.forEach(error => {
                const priority = error.priority || 'other';
                priorityCounts[priority] = (priorityCounts[priority] || 0) + 1;
            });
        });

        report += '| Priority | Count |\n';
        report += '|----------|-------|\n';
        const priorityOrder = Object.keys(config.priorityWeights).sort((a, b) => config.priorityWeights[b] - config.priorityWeights[a]);
        priorityOrder.forEach(priority => {
            if (priorityCounts[priority]) {
                report += `| ${priority.toUpperCase()} | ${priorityCounts[priority]} |\n`;
            }
        });
        report += '\n';
    }

    // --- Files with Most Errors ---
    if (filesWithErrors.length > 1) {
        report += '## Files with Most Issues (Top 10)\n\n';
        report += '| File | Issue Count |\n';
        report += '|------|-------------|\n';
        const sortedResults = [...filesWithErrors].sort((a, b) => b.errors.length - a.errors.length);
        sortedResults.slice(0, 10).forEach(file => {
            const relativePath = path.relative(config.projectRoot, file.file);
            report += `| \`${relativePath}\` | ${file.errors.length} |\n`;
        });
        report += '\n';
    }

    // --- Detailed Error Listing ---
    report += '## Detailed Issues by File\n\n';
    if (filesWithErrors.length === 0) {
        report += "_No issues found in the analyzed files._\n";
    } else {
        const sortedDetailedResults = [...filesWithErrors].sort((a, b) => a.file.localeCompare(b.file)); // Sort alphabetically for consistency

        sortedDetailedResults.forEach(file => {
            const relativePath = path.relative(config.projectRoot, file.file);
            report += `### \`${relativePath}\` (${file.errors.length} issues)\n\n`;

             // Group errors by priority if enabled
             if (config.prioritizationEnabled) {
                 const groupedErrors = {};
                 file.errors.forEach(error => {
                     const priority = error.priority || 'other';
                     if (!groupedErrors[priority]) groupedErrors[priority] = [];
                     groupedErrors[priority].push(error);
                 });

                 const priorityOrder = Object.keys(config.priorityWeights).sort((a, b) => config.priorityWeights[b] - config.priorityWeights[a]);
                 priorityOrder.forEach(priority => {
                     if (groupedErrors[priority]) {
                         report += `#### ${priority.toUpperCase()} Issues (${groupedErrors[priority].length})\n\n`;
                         report += '| Line:Col | Message | Rule ID |\n';
                         report += '|----------|---------|---------|\n';
                         groupedErrors[priority].forEach(error => {
                              // Escape pipe characters in message for Markdown table
                             const message = (error.message || '').replace(/\|/g, '\\|');
                             report += `| ${error.line}:${error.column || 1} | ${message} | \`${error.ruleId || 'unknown'}\` |\n`;
                             if (error.fix) {
                                 report += `|   ↳ Suggestion | ${error.fix.replace(/\|/g, '\\|')} | |\n`;
                             }
                         });
                         report += '\n';
                     }
                 });
             } else {
                 // List all errors without grouping if prioritization is off
                 report += '| Line:Col | Message | Rule ID |\n';
                 report += '|----------|---------|---------|\n';
                 file.errors.forEach(error => {
                      const message = (error.message || '').replace(/\|/g, '\\|');
                      report += `| ${error.line}:${error.column || 1} | ${message} | \`${error.ruleId || 'unknown'}\` |\n`;
                     if (error.fix) {
                         report += `|   ↳ Suggestion | ${error.fix.replace(/\|/g, '\\|')} | |\n`;
                     }
                 });
                 report += '\n';
             }

            // Add copy-paste location helper
            report += `**Quick Nav:** \`${file.file}:${file.errors[0]?.line || 1}:${file.errors[0]?.column || 1}\`\n\n`;
            report += '---\n\n'; // Separator between files
        });
    }

    return report;
}


/**
 * Generates an HTML formatted report.
 */
function generateHtmlReport(results) {
    const filesWithErrors = results.filter(r => r.errors && r.errors.length > 0);
    const totalErrors = filesWithErrors.reduce((sum, file) => sum + file.errors.length, 0);

    // --- Priority Summary HTML ---
    let priorityHtml = '';
    if (config.prioritizationEnabled && totalErrors > 0) {
        const priorityCounts = {};
        filesWithErrors.forEach(file => {
            file.errors.forEach(error => {
                const priority = error.priority || 'other';
                priorityCounts[priority] = (priorityCounts[priority] || 0) + 1;
            });
        });

        const priorityOrder = Object.keys(config.priorityWeights).sort((a, b) => config.priorityWeights[b] - config.priorityWeights[a]);
        priorityOrder.forEach(priority => {
            if (priorityCounts[priority]) {
                const count = priorityCounts[priority];
                const percentage = totalErrors > 0 ? Math.round((count / totalErrors) * 100) : 0;
                const colorClass = {
                    security: 'bg-danger', critical: 'bg-danger', functionality: 'bg-warning',
                    performance: 'bg-warning text-dark', accessibility: 'bg-info text-dark',
                    maintainability: 'bg-primary', style: 'bg-secondary', other: 'bg-light text-dark'
                }[priority] || 'bg-secondary';

                priorityHtml += `
                    <div class="mb-2">
                        <div class="d-flex justify-content-between">
                            <span>${priority.toUpperCase()} (${count})</span>
                            <span>${percentage}%</span>
                        </div>
                        <div class="progress" style="height: 10px;">
                            <div class="progress-bar ${colorClass}" role="progressbar" style="width: ${percentage}%"
                                 aria-valuenow="${percentage}" aria-valuemin="0" aria-valuemax="100"></div>
                        </div>
                    </div>
                `;
            }
        });
    } else if (totalErrors === 0) {
         priorityHtml = '<p>No issues found.</p>';
     } else {
         priorityHtml = '<p>Prioritization disabled.</p>';
     }

    // --- File List HTML ---
    let fileListHtml = '';
    if (filesWithErrors.length === 0) {
        fileListHtml = '<div class="alert alert-success">No issues found in the analyzed files.</div>';
    } else {
         // Sort files: those with critical/security first, then by number of errors
         const sortedResults = [...filesWithErrors].sort((a, b) => {
             const maxScoreA = Math.max(0, ...a.errors.map(e => e.score || 0));
             const maxScoreB = Math.max(0, ...b.errors.map(e => e.score || 0));
             if (maxScoreA !== maxScoreB) return maxScoreB - maxScoreA;
             return b.errors.length - a.errors.length; // Secondary sort by error count
         });

        sortedResults.forEach((file, index) => {
            const relativePath = path.relative(config.projectRoot, file.file);
             // Create a safe ID for collapse target
             const fileId = `file-${index}-${Buffer.from(relativePath).toString('base64').replace(/[^a-zA-Z0-9]/g, '')}`;
             const highestPriority = config.prioritizationEnabled
                 ? file.errors.reduce((maxP, current) => {
                       const currentScore = config.priorityWeights[current.priority || 'other'] || 0;
                       const maxScore = config.priorityWeights[maxP || 'other'] || 0;
                       return currentScore > maxScore ? current.priority : maxP;
                   }, null)
                 : null;

            let headerBgClass = 'bg-light';
             if (highestPriority === 'security' || highestPriority === 'critical') headerBgClass = 'bg-danger text-white';
             else if (highestPriority === 'functionality' || highestPriority === 'performance') headerBgClass = 'bg-warning text-dark';


            fileListHtml += `
                <div class="accordion-item">
                    <h2 class="accordion-header" id="heading-${fileId}">
                        <button class="accordion-button collapsed ${headerBgClass}" type="button" data-bs-toggle="collapse" data-bs-target="#${fileId}" aria-expanded="false" aria-controls="${fileId}">
                            <span class="file-path me-auto">${relativePath}</span>
                            <span class="badge bg-dark ms-2">${file.errors.length} issues</span>
                        </button>
                    </h2>
                    <div id="${fileId}" class="accordion-collapse collapse" aria-labelledby="heading-${fileId}">
                        <div class="accordion-body">
            `;

            // Group or list errors within the file body
            const renderErrorRow = (error) => `
                <tr>
                     <td class="location">${error.line}:${error.column || 1}</td>
                    ${config.prioritizationEnabled ? `<td class="priority-${error.priority || 'other'}">${error.priority?.toUpperCase() || 'OTHER'}</td>` : ''}
                    <td>${escapeHtml(error.message || '')}</td>
                    <td><code>${escapeHtml(error.ruleId || 'unknown')}</code></td>
                 </tr>
                 ${error.fix ? `
                 <tr class="suggestion-row">
                     <td colspan="${config.prioritizationEnabled ? 4 : 3}" class="suggestion">
                         <strong>Suggestion:</strong> ${escapeHtml(error.fix)}
                     </td>
                 </tr>` : ''}
            `;

             fileListHtml += `
                 <table class="table table-sm table-hover error-table">
                     <thead>
                         <tr>
                             <th>Location</th>
                             ${config.prioritizationEnabled ? '<th>Priority</th>' : ''}
                             <th>Message</th>
                             <th>Rule</th>
                         </tr>
                     </thead>
                     <tbody>
             `;

             // Sort errors within file for display
             const sortedErrors = [...file.errors].sort((a, b) => config.prioritizationEnabled
                 ? ((b.score || 0) - (a.score || 0) || a.line - b.line)
                 : (a.line - b.line || a.column - b.column));

            sortedErrors.forEach(error => {
                 fileListHtml += renderErrorRow(error);
             });

             fileListHtml += `
                     </tbody>
                 </table>
                 <h6>Quick Navigation</h6>
                 <pre class="copy-location"><code>${escapeHtml(file.file)}:${file.errors[0]?.line || 1}:${file.errors[0]?.column || 1}</code></pre>
             `;


            fileListHtml += `
                        </div>
                    </div>
                </div>
            `;
        });
        // Wrap file list in accordion
        fileListHtml = `<div class="accordion" id="errorAccordion">${fileListHtml}</div>`;
    }

     // --- HTML Template ---
     const html = `
     <!DOCTYPE html>
     <html lang="en">
     <head>
         <meta charset="UTF-8">
         <meta name="viewport" content="width=device-width, initial-scale=1.0">
         <title>VS Error Reporter - Analysis Report</title>
         <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
         <style>
             body { padding: 20px; background-color: #f8f9fa; }
             .container { max-width: 1200px; background-color: #fff; padding: 30px; border-radius: 8px; box-shadow: 0 0 15px rgba(0,0,0,0.1); }
             h1, h2 { color: #0d6efd; }
             .summary-card { margin-bottom: 20px; }
             .file-path { font-family: monospace; font-size: 0.9em; word-break: break-all; }
             .error-table td, .error-table th { vertical-align: middle; }
             .error-table .location { font-family: monospace; white-space: nowrap; width: 80px; }
             .copy-location { background-color: #e9ecef; padding: 8px; border-radius: 4px; font-size: 0.9em; display: inline-block; }
             .suggestion { font-size: 0.9em; color: #198754; padding-left: 20px !important; }
             .suggestion-row { background-color: #f8f9fa; } /* Subtle background for suggestion row */
             .accordion-button { font-weight: 500; }
             .accordion-button:not(.collapsed) { color: #0c63e4; background-color: #e7f1ff; }
             .accordion-body { padding-top: 0; } /* Adjust padding */
     
             /* Priority classes */
             .priority-security, .priority-critical { color: #dc3545; font-weight: bold; }
             .priority-functionality { color: #fd7e14; font-weight: 500; }
             .priority-performance { color: #ffc107; font-weight: 500; }
             .priority-accessibility { color: #0dcaf0; }
             .priority-maintainability { color: #0d6efd; }
             .priority-style { color: #6c757d; }
             .priority-other { color: #adb5bd; }
     
             /* Header Backgrounds */
             .bg-danger.accordion-button:not(.collapsed) { background-color: #bb2d3b; }
             .bg-warning.accordion-button:not(.collapsed) { background-color: #ffca2c; }
         </style>
     </head>
     <body>
         <div class="container">
             <h1 class="mb-4">VS Error Reporter - Analysis Report</h1>
     
             <div class="row mb-4">
                 <div class="col-md-6">
                     <div class="card summary-card">
                         <div class="card-header">Summary</div>
                         <div class="card-body">
                             <p><strong>Date:</strong> ${new Date().toISOString()}</p>
                             <p><strong>Project Root:</strong> <code>${escapeHtml(config.projectRoot)}</code></p>
                             <p><strong>Files Scanned:</strong> ${results.length}</p>
                             <p><strong>Files with Issues:</strong> ${filesWithErrors.length}</p>
                             <p><strong>Total Issues Found:</strong> <span class="badge bg-${totalErrors > 0 ? 'danger' : 'success'}">${totalErrors}</span></p>
                         </div>
                     </div>
                 </div>
     
                 <div class="col-md-6">
                     <div class="card summary-card">
                         <div class="card-header">Issues by Priority</div>
                         <div class="card-body">
                             ${priorityHtml}
                         </div>
                     </div>
                 </div>
             </div>
     
             <h2>Detailed Issues by File</h2>
             ${fileListHtml}
     
         </div>
     
         <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
     </body>
     </html>
     `;
     
     return html;
     }
     
     // Simple HTML escape function
     function escapeHtml(unsafe) {
         if (!unsafe) return '';
         return unsafe
              .replace(/&/g, "&amp;")
              .replace(/</g, "&lt;")
              .replace(/>/g, "&gt;")
              .replace(/"/g, "&quot;")
              .replace(/'/g, "&#039;");
     }
     
     /**
      * Generates a JSON formatted report.
      */
     function generateJsonReport(results) {
         const reportData = {
             reportDate: new Date().toISOString(),
             projectRoot: config.projectRoot,
             totalFilesScanned: results.length,
             filesWithIssues: results.filter(r => r.errors && r.errors.length > 0).length,
             totalIssues: results.reduce((sum, file) => sum + (file.errors?.length || 0), 0),
             prioritizationEnabled: config.prioritizationEnabled,
             analysisResults: results // Include the raw results array
         };
         return JSON.stringify(reportData, null, 2); // Pretty print JSON
     }


/**
 * Generates a JSON formatted report.
 */
function generateJsonReport(results) {
    const reportData = {
        reportDate: new Date().toISOString(),
        projectRoot: config.projectRoot,
        totalFilesScanned: results.length,
        filesWithIssues: results.filter(r => r.errors && r.errors.length > 0).length,
        totalIssues: results.reduce((sum, file) => sum + (file.errors?.length || 0), 0),
        prioritizationEnabled: config.prioritizationEnabled,
        analysisResults: results // Include the raw results array
    };
    return JSON.stringify(reportData, null, 2); // Pretty print JSON
}


/**
 * Saves the report to a file based on the configured format.
 */
function saveReport(results) {
    let reportContent = '';
    let fileExtension = '';

    switch (config.outputFormat) {
        case 'html':
            reportContent = generateHtmlReport(results);
            fileExtension = '.html';
            break;
        case 'markdown':
        case 'md':
            reportContent = generateMarkdownReport(results);
            fileExtension = '.md';
            break;
        case 'json':
            reportContent = generateJsonReport(results);
            fileExtension = '.json';
            break;
        default:
            console.log(chalk.yellow(`Unsupported report format: ${config.outputFormat}. Cannot save.`));
            return;
    }

    const reportFilename = `${config.reportFilename}${fileExtension}`;
    const reportPath = path.join(config.projectRoot, reportFilename); // Save in project root

    try {
        fs.writeFileSync(reportPath, reportContent);
        console.log(chalk.green(`\n📊 Report saved successfully to: ${reportPath}`));
    } catch (error) {
        console.error(chalk.red(`\n❌ Error saving report to ${reportPath}:`), error.message);
    }
}

// --- Fixing Logic (Placeholder) ---

/**
 * Attempts to automatically fix errors (placeholder).
 * NOTE: Implementing reliable auto-fixing is complex and potentially dangerous.
 * Linters like ESLint (--fix) and Prettier are better suited for this.
 */
async function attemptFixes(results) {
    console.log(chalk.blue('\n🔧 Attempting automatic fixes (basic)...'));
    const fixableResults = results.filter(r => r.errors.some(e => e.fix)); // Check if any error has a 'fix' suggestion

     if (!fixableResults.length) {
         console.log(chalk.yellow('No specific fix suggestions available from this reporter. Try running linters with --fix.'));
         return;
     }

    // Example: Running ESLint --fix on files with lint errors
    const filesToFix = [...new Set(
        results
            .filter(r => r.errors.some(e => e.type === 'lint' || e.type === 'style'))
            .map(r => r.file)
    )];

    if (filesToFix.length > 0) {
        const spinner = ora(`Running linters with --fix on ${filesToFix.length} files...`).start();
        try {
             // Run ESLint fix
             const eslintCommand = `npx eslint "${filesToFix.join('" "')}" --fix --quiet`;
             await exec(eslintCommand);

             // Run Stylelint fix (if applicable)
             const cssFiles = filesToFix.filter(f => getFileType(f) === 'css');
             if (cssFiles.length > 0) {
                 const stylelintCommand = `npx stylelint "${cssFiles.join('" "')}" --fix --quiet`;
                 await exec(stylelintCommand);
             }

             // Consider running Prettier
             const prettierCommand = `npx prettier "${filesToFix.join('" "')}" --write --ignore-unknown`;
             await exec(prettierCommand);


             spinner.succeed(`Linters finished fixing attempts. Please review changes.`);
             console.log(chalk.yellow('Important: Review the changes made by the linters carefully!'));

             // Optionally re-analyze after fixing
             // await main(); // Or a specific re-scan function

        } catch (error) {
             // Don't fail execution, just report
             spinner.fail(`Error running linters with --fix.`);
             console.error(chalk.red('Fixing error details:'), error.stderr || error.message);
             console.log(chalk.yellow('Manual fixing might be required.'));
         }
    } else {
         console.log(chalk.yellow('No files with standard lint/style issues found to attempt auto-fixing.'));
     }
}


// --- Main Application Flow & Interaction ---

/**
 * Prompts the user for actions after analysis (report, fix, exit).
 */
async function promptPostAnalysis(results) {
    if (!results || results.length === 0) {
        // If no results (e.g., user cancelled scan), just go back to main menu
        await main();
        return;
    }

    const filesWithErrors = results.filter(r => r.errors && r.errors.length > 0);

     // Display summary first
     displayResultsSummary(results);

    if (filesWithErrors.length === 0) {
        // If no errors, maybe just offer to exit or go back
         await inquirer.prompt([
             { type: 'list', name: 'action', message: 'No issues found. What next?', choices: [{ name: 'Main Menu', value: 'menu' }, { name: 'Exit', value: 'exit' }] }
         ]).then(answers => {
             if (answers.action === 'menu') main();
             else process.exit(0);
         });
         return;
     }


    // Actions if errors were found
    const choices = [
        { name: `Generate Report (${config.outputFormat.toUpperCase()})`, value: 'report' },
        { name: 'View Detailed Summary Again', value: 'summary' },
    ];
     // Only offer fixing if not already done and suggestions exist or linters likely used
     if (!config.fixAutomatically && results.some(r => r.errors.some(e => e.fix || e.type === 'lint' || e.type === 'style'))) {
         choices.push({ name: 'Attempt Auto-Fix (using linters)', value: 'fix' });
     }
    choices.push(new inquirer.Separator());
    choices.push({ name: 'Back to Main Menu', value: 'menu' });
    choices.push({ name: 'Exit', value: 'exit' });


    const answers = await inquirer.prompt([
        {
            type: 'list',
            name: 'action',
            message: 'Analysis complete. What would you like to do next?',
            choices: choices
        }
    ]);

    switch (answers.action) {
        case 'report':
            saveReport(results);
            await promptPostAnalysis(results); // Loop back after saving
            break;
         case 'summary':
             // Already displayed, but maybe clear console and show again?
             console.clear();
             displayBanner();
             displayResultsSummary(results);
             await promptPostAnalysis(results);
             break;
        case 'fix':
            await attemptFixes(results);
             // Ask if user wants to rescan after fixing attempt
             const { rescan } = await inquirer.prompt([{ type: 'confirm', name: 'rescan', message: 'Fix attempt complete. Re-run analysis on the same files?', default: true }]);
             if (rescan) {
                 const filesToRescan = results.map(r => r.file);
                 const spinner = ora(`Re-analyzing ${filesToRescan.length} files...`).start();
                 const updatedResults = [];
                 for (let i = 0; i < filesToRescan.length; i++) {
                     spinner.text = `Re-analyzing file ${i + 1}/${filesToRescan.length}...`;
                     const result = await analyzeFile(filesToRescan[i], false); // No per-file progress needed now
                     if (result.errors.length > 0) {
                         updatedResults.push(result);
                     }
                 }
                 spinner.succeed('Re-analysis complete.');
                 analysisResults = updatedResults; // Update global results
                 await promptPostAnalysis(analysisResults); // Show updated results/prompt
             } else {
                 await promptPostAnalysis(results); // Show original results again
             }
            break;
        case 'menu':
            main(); // Restart main menu
            break;
        case 'exit':
            console.log(chalk.blue('\nThank you for using VS Error Reporter!'));
            process.exit(0);
            break;
    }
}

/**
 * Handles the Quick Scan mode.
 */
async function quickScan() {
    console.log(chalk.blue('Running quick scan with current settings...'));
    config.verbose = false; // Force non-verbose for quick scan display

    const files = findProjectFiles();
     if (files.length === 0) {
         console.log(chalk.yellow('No files found to scan based on configuration.'));
         process.exit(0);
     }

    const spinner = ora(`Analyzing ${files.length} files...`).start();
    const results = [];
    let filesWithIssues = 0;

    // Use Promise.all for potentially faster parallel analysis (careful with resource limits)
    // const analysisPromises = files.map((file, index) =>
    //     analyzeFile(file, false).then(result => {
    //         spinner.text = `Analyzing file ${index + 1}/${files.length}...`;
    //         if (result && result.errors.length > 0) {
    //             results.push(result);
    //             filesWithIssues++;
    //         }
    //     }).catch(err => {
    //          spinner.warn(`Error analyzing ${path.basename(file)} during quick scan.`);
    //          console.error(err); // Log error but continue
    //      })
    // );
    // await Promise.all(analysisPromises);

     // Sequential analysis (safer, easier progress)
     for (let i = 0; i < files.length; i++) {
         const progress = Math.round(((i + 1) / files.length) * 100);
         spinner.text = `Analyzing ${i + 1}/${files.length} (${progress}%) - ${path.basename(files[i])}...`;
         try {
            const result = await analyzeFile(files[i], false); // No per-file display
            if (result && result.errors.length > 0) {
                results.push(result);
                filesWithIssues++;
            }
         } catch (error) {
             // Log error but continue scan
             console.error(chalk.red(`\nError during quick scan of ${path.basename(files[i])}:`), error.message);
             spinner.warn(`Skipped ${path.basename(files[i])} due to error.`);
         }
     }


    spinner.succeed(`Analysis complete. Found issues in ${filesWithIssues} / ${files.length} files.`);
    analysisResults = results; // Store globally

    if (filesWithIssues > 0) {
        displayResultsSummary(analysisResults); // Show summary in terminal

        if (config.autoSaveReport) {
            saveReport(analysisResults);
        }

        if (config.fixAutomatically) {
            await attemptFixes(analysisResults);
        }
    } else {
        console.log(chalk.green('\n✅ No issues found in your project!'));
    }

    console.log(chalk.blue('\nQuick scan finished.'));
    process.exit(0); // Exit after quick scan
}

/**
 * Handles analyzing a specific file chosen by the user.
 */
async function analyzeSpecificFileFlow() {
    const answers = await inquirer.prompt([
        {
            type: 'input',
            name: 'filepath',
            message: 'Enter the relative path to the file (from project root):',
            validate: input => (input && input.trim() !== '') || 'Please enter a file path.',
            filter: input => input.trim() // Trim whitespace
        }
    ]);

    const filePath = path.resolve(config.projectRoot, answers.filepath);

     // Perform analysis with immediate display
     console.log(''); // Newline before analysis starts
     const result = await analyzeFile(filePath, true); // Display progress and results immediately

     if (!result) { // Handle case where analyzeFile might have failed badly
         console.error(chalk.red(`Analysis could not be completed for ${answers.filepath}.`));
         await main(); // Return to main menu
         return;
     }

    analysisResults = result.errors.length > 0 ? [result] : []; // Store result only if errors exist

    await promptPostAnalysis(analysisResults); // Ask what to do next
}

/**
 * Handles searching for files and analyzing the selection.
 */
async function searchAndAnalyzeFilesFlow() {
    const answers = await inquirer.prompt([
        {
            type: 'input',
            name: 'pattern',
            message: 'Enter filename or glob pattern to search (e.g., Header.jsx, src/**/*.js, *.css):',
            validate: input => (input && input.trim() !== '') || 'Please enter a search pattern.',
            filter: input => input.trim()
        }
    ]);

     // Add globstars if pattern seems like a simple filename without directory info
     let searchPattern = answers.pattern;
     if (!searchPattern.includes('*') && !searchPattern.includes('/') && !searchPattern.includes('\\')) {
         searchPattern = `**/*${searchPattern}*`; // Search all folders for the name
         console.log(chalk.gray(`Searching using pattern: ${searchPattern}`));
     }


    const matchingFiles = findFilesByPattern(searchPattern);

    if (matchingFiles.length === 0) {
        // No need for message here, findFilesByPattern already warns
        await main(); // Go back to main menu
        return;
    }

    let filesToAnalyze = [];

    if (matchingFiles.length === 1) {
        // If only one match, analyze it directly
        filesToAnalyze = matchingFiles;
        console.log(chalk.blue(`Only one file matched: ${path.relative(config.projectRoot, filesToAnalyze[0])}. Analyzing...`));
    } else {
        // Let user choose which files to analyze
        const fileChoices = matchingFiles.map(file => ({
            name: path.relative(config.projectRoot, file), // Show relative path
            value: file // Use absolute path as value
        }));

        fileChoices.unshift({ name: `Analyze all ${matchingFiles.length} matching files`, value: 'all' });
        fileChoices.push(new inquirer.Separator());
        fileChoices.push({ name: 'Cancel', value: 'cancel' });


        const selection = await inquirer.prompt([
            {
                type: 'list', // Use list for single selection or 'all'
                name: 'fileChoice',
                message: 'Select which file(s) to analyze:',
                 choices: fileChoices,
                 pageSize: 15 // Show more choices at once
            }
        ]);

        if (selection.fileChoice === 'all') {
            filesToAnalyze = matchingFiles;
        } else if (selection.fileChoice === 'cancel') {
            await main();
            return;
        } else {
            filesToAnalyze = [selection.fileChoice]; // Analyze the single selected file
        }
    }

    // --- Analyze Selected Files ---
     console.log(''); // Newline before analysis
    const spinner = ora(`Analyzing ${filesToAnalyze.length} selected files...`).start();
    const results = [];
     let filesWithIssues = 0;

     for (let i = 0; i < filesToAnalyze.length; i++) {
         const progress = Math.round(((i + 1) / filesToAnalyze.length) * 100);
         spinner.text = `Analyzing ${i + 1}/${filesToAnalyze.length} (${progress}%) - ${path.basename(filesToAnalyze[i])}...`;
         try {
             const result = await analyzeFile(filesToAnalyze[i], false); // No immediate display per file
             if (result && result.errors.length > 0) {
                 results.push(result);
                 filesWithIssues++;
             }
         } catch (error) {
             console.error(chalk.red(`\nError during analysis of ${path.basename(filesToAnalyze[i])}:`), error.message);
             spinner.warn(`Skipped ${path.basename(filesToAnalyze[i])} due to error.`);
         }
     }

     spinner.succeed(`Analysis complete. Found issues in ${filesWithIssues} / ${filesToAnalyze.length} files.`);
     analysisResults = results; // Store globally

     await promptPostAnalysis(analysisResults); // Show summary and next steps
 }


/**
 * Handles scanning the entire project.
 */
async function scanProjectFlow() {
    const files = findProjectFiles();
     if (files.length === 0) {
         console.log(chalk.yellow('No files found to scan based on configuration.'));
         await main(); // Go back to menu
         return;
     }

    const { confirmScan } = await inquirer.prompt([
        {
            type: 'confirm',
            name: 'confirmScan',
            message: `Found ${files.length} files to analyze in the project. This may take some time. Continue?`,
            default: true
        }
    ]);

    if (!confirmScan) {
        await main(); // Go back to menu
        return;
    }

    // --- Analyze All Project Files ---
     console.log(''); // Newline
    const spinner = ora(`Analyzing ${files.length} project files...`).start();
    const results = [];
    let filesWithIssues = 0;

    for (let i = 0; i < files.length; i++) {
        const progress = Math.round(((i + 1) / files.length) * 100);
        spinner.text = `Analyzing ${i + 1}/${files.length} (${progress}%) - ${path.basename(files[i])}...`;
         try {
            const result = await analyzeFile(files[i], false);
            if (result && result.errors.length > 0) {
                results.push(result);
                filesWithIssues++;
            }
         } catch (error) {
             console.error(chalk.red(`\nError during project scan of ${path.basename(files[i])}:`), error.message);
             spinner.warn(`Skipped ${path.basename(files[i])} due to error.`);
         }
    }

    spinner.succeed(`Project scan complete. Found issues in ${filesWithIssues} / ${files.length} files.`);
    analysisResults = results; // Store globally

    await promptPostAnalysis(analysisResults); // Show summary and next steps
}

/**
 * Main application entry point and menu loop.
 */
async function main() {
    console.clear(); // Clear console for a fresh menu
    displayBanner(); // Show banner each time menu loads

    // Handle command line args for direct actions (overrides interactive menu)
    if (config.quickScan) {
        await quickScan(); // Exits automatically
        return; // Should not be reached
    }
    if (config.specificFile) {
        console.log(chalk.blue(`Analyzing specific file from command line: ${config.specificFile}`));
         const filePath = path.resolve(config.projectRoot, config.specificFile);
         const result = await analyzeFile(filePath, true); // Show progress/results directly
         analysisResults = result.errors.length > 0 ? [result] : [];

         // Handle auto-report/fix for single file CLI scan
         if (analysisResults.length > 0) {
             if (config.autoSaveReport) saveReport(analysisResults);
             if (config.fixAutomatically) await attemptFixes(analysisResults);
         }
         process.exit(0); // Exit after single file analysis from CLI
         return; // Should not be reached
    }
     // Add handling for specificDir similar to specificFile if desired

    // --- Interactive Menu ---
    try {
        const answers = await inquirer.prompt([
            {
                type: 'list',
                name: 'action',
                message: 'What would you like to do?',
                choices: [
                    { name: 'Scan Entire Project', value: 'project' },
                    { name: 'Scan Specific File', value: 'file' },
                    { name: 'Search & Scan Files (Pattern)', value: 'search' },
                    new inquirer.Separator(),
                    { name: 'Configure Settings', value: 'config' },
                    { name: 'Exit', value: 'exit' }
                ],
                 pageSize: 10
            }
        ]);

        switch (answers.action) {
            case 'project':
                await scanProjectFlow();
                break;
            case 'file':
                await analyzeSpecificFileFlow();
                break;
            case 'search':
                await searchAndAnalyzeFilesFlow();
                break;
            case 'config':
                await configurationWizard();
                await main(); // Restart main menu with updated config
                break;
            case 'exit':
                console.log(chalk.blue('\nThank you for using VS Error Reporter!'));
                process.exit(0);
                break;
        }
    } catch (error) {
         // Catch potential errors during prompts or flow control
         console.error(chalk.red('\nAn unexpected error occurred in the main menu:'), error);
         console.log(chalk.yellow('Exiting application.'));
         process.exit(1);
     }
}

// --- Start the application ---
main().catch(error => {
    // Catch unhandled promise rejections from main async flow
    console.error(chalk.red('\n\nFATAL ERROR:'), error);
    process.exit(1);
});