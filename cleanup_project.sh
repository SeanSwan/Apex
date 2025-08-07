#!/bin/bash

# APEX AI PROJECT CLEANUP SCRIPT - MASTER PROMPT v49.0
# =====================================================
# Comprehensive cleanup and organization of project files

echo "🧹 Starting APEX AI Project Cleanup..."
echo "=================================="

# Create archive structure
mkdir -p archive/session_reports
mkdir -p archive/test_scripts
mkdir -p archive/old_documentation
mkdir -p archive/diagnostic_scripts
mkdir -p archive/backup_files

echo "📁 Archive directories created"

# Move session reports and handoff documents
echo "📋 Moving session reports..."
mv COMPREHENSIVE_HANDOFF_REPORT.md archive/session_reports/ 2>/dev/null
mv COMPREHENSIVE_SESSION_REPORT.md archive/session_reports/ 2>/dev/null
mv COMPREHENSIVE_STRATEGIC_ANALYSIS.md archive/session_reports/ 2>/dev/null
mv CRITICAL_FIXES_COMPLETED.md archive/session_reports/ 2>/dev/null
mv DAILY_REPORTS_AND_CHART_FIXED.md archive/session_reports/ 2>/dev/null
mv HANDOFF_REPORT_TIER1_COMPLETE.md archive/session_reports/ 2>/dev/null
mv TIER1_VIDEO_COMPLETION_REPORT.md archive/session_reports/ 2>/dev/null
mv TIER2_COMPLETE_IMPLEMENTATION_REPORT.md archive/session_reports/ 2>/dev/null
mv ULTRA_DETAILED_HANDOFF_REPORT.md archive/session_reports/ 2>/dev/null
mv SPRINT_3_COMPLETION_REPORT.md archive/session_reports/ 2>/dev/null
mv PHASE_1_IMPLEMENTATION_COMPLETE.md archive/session_reports/ 2>/dev/null
mv PHASE_2A_COMPLETION_GUIDE.md archive/session_reports/ 2>/dev/null
mv FINAL_ERROR_RESOLUTION_COMPLETE.md archive/session_reports/ 2>/dev/null
mv ENHANCED_WEBSOCKET_PIPELINE_COMPLETE.md archive/session_reports/ 2>/dev/null
mv DYNAMIC_RULES_ENGINE_IMPLEMENTATION_COMPLETE.md archive/session_reports/ 2>/dev/null
mv LOCALSTORAGE_PERSISTENCE_IMPLEMENTATION_COMPLETE.md archive/session_reports/ 2>/dev/null
mv MODULAR_ARCHITECTURE_ENHANCEMENT_COMPLETE.md archive/session_reports/ 2>/dev/null
mv STYLED_COMPONENTS_FIX_COMPLETE.md archive/session_reports/ 2>/dev/null
mv TOTAL_MONITORING_HOURS_168_HARDCODED_COMPLETE.md archive/session_reports/ 2>/dev/null

# Move old documentation
echo "📚 Moving old documentation..."
mv CODEBASE_ANALYSIS_COMPLETE.md archive/old_documentation/ 2>/dev/null
mv COMPLETE_FIX_SUMMARY.md archive/old_documentation/ 2>/dev/null
mv COMPLETE_SETUP_GUIDE.md archive/old_documentation/ 2>/dev/null
mv DEMO_MODE_GUIDE.md archive/old_documentation/ 2>/dev/null
mv DEMO_README.md archive/old_documentation/ 2>/dev/null
mv DEV-GUIDE.md archive/old_documentation/ 2>/dev/null
mv DYNAMIC_PORT_SYSTEM_GUIDE.md archive/old_documentation/ 2>/dev/null
mv ENHANCEMENT_DOCUMENTATION.md archive/old_documentation/ 2>/dev/null
mv FACE_RECOGNITION_SETUP_GUIDE.md archive/old_documentation/ 2>/dev/null
mv FACE_RECOGNITION_TESTING_GUIDE.md archive/old_documentation/ 2>/dev/null
mv frontend-integration-test-setup.md archive/old_documentation/ 2>/dev/null
mv GIT_COMMANDS.md archive/old_documentation/ 2>/dev/null
mv IMMEDIATE_ACTION_PLAN.md archive/old_documentation/ 2>/dev/null
mv NEXT_SESSION_QUICK_START.md archive/old_documentation/ 2>/dev/null
mv PHASE_5A_INTEGRATION_TESTING_GUIDE.md archive/old_documentation/ 2>/dev/null
mv PRODUCTION_ENHANCEMENT_GUIDE.md archive/old_documentation/ 2>/dev/null
mv PROPERTY_INFORMATION_CORRECTED.md archive/old_documentation/ 2>/dev/null
mv QUICK_CHART_FIX_TEST.md archive/old_documentation/ 2>/dev/null
mv QUICK_CHART_TEST.md archive/old_documentation/ 2>/dev/null
mv QUICK_START_GUIDE.md archive/old_documentation/ 2>/dev/null
mv QUICK_TEST_GUIDE.md archive/old_documentation/ 2>/dev/null
mv RECOMMENDATIONS_P0_CRITICAL.md archive/old_documentation/ 2>/dev/null
mv RECOMMENDATIONS_P1_P2.md archive/old_documentation/ 2>/dev/null
mv REPORT_PREVIEW_FIXES.md archive/old_documentation/ 2>/dev/null
mv RULES_CONFIGURATION_COMPLETE_GUIDE.md archive/old_documentation/ 2>/dev/null
mv SECURITY_HARDENING_RECOMMENDATIONS.md archive/old_documentation/ 2>/dev/null
mv TERMINAL_DATABASE_SETUP.md archive/old_documentation/ 2>/dev/null
mv VISUAL_DEMO_GUIDE.md archive/old_documentation/ 2>/dev/null

# Move test scripts
echo "🧪 Moving test scripts..."
mv analyze_face_recognition_bugs.mjs archive/test_scripts/ 2>/dev/null
mv baseline_analysis_report.mjs archive/test_scripts/ 2>/dev/null
mv check_database_status.mjs archive/test_scripts/ 2>/dev/null
mv check_db_config.mjs archive/test_scripts/ 2>/dev/null
mv check_system_status.mjs archive/test_scripts/ 2>/dev/null
mv check_system_status_port5000.mjs archive/test_scripts/ 2>/dev/null
mv file-tree.js archive/test_scripts/ 2>/dev/null
mv fix_face_recognition_bugs.mjs archive/test_scripts/ 2>/dev/null
mv integration_completion_summary.mjs archive/test_scripts/ 2>/dev/null
mv phase-5a-readiness-check.mjs archive/test_scripts/ 2>/dev/null
mv quick-test-dynamic-ports.mjs archive/test_scripts/ 2>/dev/null
mv quick_baseline_check.mjs archive/test_scripts/ 2>/dev/null
mv quick_db_check.mjs archive/test_scripts/ 2>/dev/null
mv run_baseline_tests.mjs archive/test_scripts/ 2>/dev/null
mv run_integration_test.mjs archive/test_scripts/ 2>/dev/null
mv run_simulation_test.mjs archive/test_scripts/ 2>/dev/null
mv setup_face_recognition_database.mjs archive/test_scripts/ 2>/dev/null
mv setup_face_recognition_database_port5000.mjs archive/test_scripts/ 2>/dev/null
mv start_everything.mjs archive/test_scripts/ 2>/dev/null
mv sync-env.js archive/test_scripts/ 2>/dev/null
mv test-integration-dynamic.mjs archive/test_scripts/ 2>/dev/null
mv test-integration-enhanced.mjs archive/test_scripts/ 2>/dev/null
mv test-integration.mjs archive/test_scripts/ 2>/dev/null
mv test_connection_fix.py archive/test_scripts/ 2>/dev/null
mv test_enhanced_integration.py archive/test_scripts/ 2>/dev/null
mv test_face_recognition_ai_engine.py archive/test_scripts/ 2>/dev/null
mv test_face_recognition_integration.mjs archive/test_scripts/ 2>/dev/null
mv test_face_recognition_integration_port5000.mjs archive/test_scripts/ 2>/dev/null
mv test_face_recognition_master.mjs archive/test_scripts/ 2>/dev/null
mv test_phase1_face_detection.mjs archive/test_scripts/ 2>/dev/null
mv verify_concurrently_setup.js archive/test_scripts/ 2>/dev/null
mv verify_database_setup.mjs archive/test_scripts/ 2>/dev/null
mv verify_demo.py archive/test_scripts/ 2>/dev/null
mv verify_integration_completion.mjs archive/test_scripts/ 2>/dev/null
mv vs-error-reporter.js archive/test_scripts/ 2>/dev/null

# Move diagnostic scripts (.bat files)
echo "🔧 Moving diagnostic scripts..."
mv check-env-location.mjs archive/diagnostic_scripts/ 2>/dev/null
mv check-server-status.bat archive/diagnostic_scripts/ 2>/dev/null
mv check-styled-final.bat archive/diagnostic_scripts/ 2>/dev/null
mv check-styled-props.bat archive/diagnostic_scripts/ 2>/dev/null
mv check-typescript.bat archive/diagnostic_scripts/ 2>/dev/null
mv diagnose-404-error.bat archive/diagnostic_scripts/ 2>/dev/null
mv diagnose-servers.bat archive/diagnostic_scripts/ 2>/dev/null
mv emergency-restart-fixed.bat archive/diagnostic_scripts/ 2>/dev/null
mv final-fix-test.bat archive/diagnostic_scripts/ 2>/dev/null
mv fix-backend-now.sh archive/diagnostic_scripts/ 2>/dev/null
mv fix-frontend-deps.bat archive/diagnostic_scripts/ 2>/dev/null
mv fix-frontend-now.sh archive/diagnostic_scripts/ 2>/dev/null
mv fix-npm-dependencies.bat archive/diagnostic_scripts/ 2>/dev/null
mv fix-npm-dependencies.ps1 archive/diagnostic_scripts/ 2>/dev/null
mv fix-port-5000.bat archive/diagnostic_scripts/ 2>/dev/null
mv FIX_CRITICAL_BUGS.bat archive/diagnostic_scripts/ 2>/dev/null
mv install-deps.sh archive/diagnostic_scripts/ 2>/dev/null
mv INTEGRATION_COMPLETE.bat archive/diagnostic_scripts/ 2>/dev/null
mv restart-after-duplicate-fix.bat archive/diagnostic_scripts/ 2>/dev/null
mv restart-dynamic-servers.bat archive/diagnostic_scripts/ 2>/dev/null
mv restart-servers-for-testing.bat archive/diagnostic_scripts/ 2>/dev/null
mv run_baseline_tests.bat archive/diagnostic_scripts/ 2>/dev/null
mv RUN_FACE_RECOGNITION_SIMULATION.bat archive/diagnostic_scripts/ 2>/dev/null
mv run_integration_test.bat archive/diagnostic_scripts/ 2>/dev/null
mv start-apex-servers.bat archive/diagnostic_scripts/ 2>/dev/null
mv start-phase-5a-testing.bat archive/diagnostic_scripts/ 2>/dev/null
mv startup_guide.bat archive/diagnostic_scripts/ 2>/dev/null
mv startup_guide.sh archive/diagnostic_scripts/ 2>/dev/null
mv START_APEX_AI_DEMO.bat archive/diagnostic_scripts/ 2>/dev/null
mv start_backend_and_setup.bat archive/diagnostic_scripts/ 2>/dev/null
mv start_backend_server.bat archive/diagnostic_scripts/ 2>/dev/null
mv start_enhanced_ai_system.bat archive/diagnostic_scripts/ 2>/dev/null
mv start_everything.bat archive/diagnostic_scripts/ 2>/dev/null
mv start_everything.sh archive/diagnostic_scripts/ 2>/dev/null
mv test-dynamic-system.bat archive/diagnostic_scripts/ 2>/dev/null
mv verify_integration_complete.bat archive/diagnostic_scripts/ 2>/dev/null

# Move backup and temporary files
echo "🗄️ Moving backup files..."
mv env.txt.backup.DANGEROUS_REMOVED archive/backup_files/ 2>/dev/null
mv integration_completion_report_1753471887671.json archive/backup_files/ 2>/dev/null
mv phase-5a-integration-test-results-2025-07-15T00-04-10-321Z.json archive/backup_files/ 2>/dev/null

# Remove obvious temporary or redundant directories if they exist
echo "🗑️ Checking for redundant directories..."
if [ -d "defense-old" ]; then
    echo "⚠️ Found defense-old directory - recommend manual review before deletion"
fi

if [ -d "temp" ] && [ -z "$(ls -A temp)" ]; then
    echo "🗑️ Removing empty temp directory"
    rmdir temp 2>/dev/null
fi

echo ""
echo "✅ Cleanup Complete!"
echo "===================="
echo "📋 Session reports moved to: archive/session_reports/"
echo "📚 Old documentation moved to: archive/old_documentation/"
echo "🧪 Test scripts moved to: archive/test_scripts/"
echo "🔧 Diagnostic scripts moved to: archive/diagnostic_scripts/"
echo "🗄️ Backup files moved to: archive/backup_files/"
echo ""
echo "🎯 Project root is now clean and organized!"
echo "💡 Key files remaining in root:"
echo "   - package.json (project config)"
echo "   - tsconfig.json (TypeScript config)"
echo "   - .gitignore (git config)"
echo "   - Core directories: backend/, frontend/, apex_ai_engine/, apex_ai_desktop_app/"
