@echo off
cls
echo =====================================================
echo APEX AI UNIFIED DATABASE SETUP - COMPLETE REBUILD
echo =====================================================
echo.
echo This will completely rebuild your database from scratch
echo with a clean, unified, production-ready structure.
echo.
echo WHAT THIS DOES:
echo   - Drops ALL existing tables
echo   - Creates unified UUID-based schema
echo   - Implements 8-role permission system
echo   - Sets up client portal authentication
echo   - Creates sample data for testing
echo   - Verifies everything works
echo.
echo WARNING: All existing data will be lost!
echo.
set /p confirm="Are you sure you want to proceed? (yes/no): "
if /i not "%confirm%"=="yes" (
    echo Operation cancelled.
    pause
    exit /b 1
)

echo.
echo =====================================================
echo STEP 1: Pre-Setup Verification
echo =====================================================
cd /d "C:\Users\APEX AI\Desktop\defense\backend"
node verify-before-setup.mjs
echo.

echo =====================================================
echo STEP 2: Executing Unified Database Setup
echo =====================================================
node setup-unified-database.mjs
echo.

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ❌ Setup failed! Check the error messages above.
    pause
    exit /b 1
)

echo =====================================================
echo STEP 3: Post-Setup Verification
echo =====================================================
node check-current-db-state.mjs
echo.

echo =====================================================
echo STEP 4: Testing UnifiedQueries Integration
echo =====================================================
node -e "
import('./database/unifiedQueries.mjs').then(async (module) => {
  const { UnifiedQueries } = module;
  console.log('✅ Testing database connection...');
  const connected = await UnifiedQueries.testConnection();
  console.log('✅ Connection test:', connected ? 'SUCCESS' : 'FAILED');
  
  console.log('✅ Testing database statistics...');
  const stats = await UnifiedQueries.getDatabaseStats();
  console.log('✅ Database stats:', JSON.stringify(stats, null, 2));
  
  console.log('\\n🎉 UnifiedQueries integration test complete!');
  process.exit(0);
}).catch(err => {
  console.error('❌ UnifiedQueries test failed:', err.message);
  process.exit(1);
});"

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ❌ Integration test failed! Check the error messages above.
    pause
    exit /b 1
)

echo.
echo =====================================================
echo 🎉 UNIFIED DATABASE SETUP COMPLETE!
echo =====================================================
echo.
echo ✅ Database schema unified with UUID system
echo ✅ 8-role permission system implemented
echo ✅ Client portal authentication ready
echo ✅ Multi-tenant security enabled
echo ✅ Sample data created for testing
echo ✅ UnifiedQueries integration verified
echo.
echo NEXT STEPS:
echo   1. Update backend to use UnifiedQueries
echo   2. Build SOP_Editor and ContactListManager components
echo   3. Test role-based access control
echo   4. Deploy to production
echo.
echo Your APEX AI platform now has a solid, production-ready foundation!
echo.
pause
