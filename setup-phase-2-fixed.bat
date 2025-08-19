@echo off
echo ========================================
echo APEX AI - PHASE 2 FIXED
echo ========================================
echo.
echo Running test data population (dependency fixed)...
echo.

cd /d "C:\Users\APEX AI\Desktop\defense\backend"

echo Creating test data with correct dependencies...
node scripts/populate-test-data.mjs

echo.
if %ERRORLEVEL% EQU 0 (
    echo ========================================
    echo ✅ Phase 2 SUCCESSFUL!
    echo ========================================
    echo Test data created successfully.
    echo Next step: Run setup-phase-3.bat
    echo ========================================
) else (
    echo ========================================
    echo ❌ Phase 2 FAILED!
    echo ========================================
    echo Please check error messages above.
    echo ========================================
)

echo.
echo Press any key to continue...
pause > nul
