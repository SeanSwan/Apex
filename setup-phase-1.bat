@echo off
echo ========================================
echo APEX AI - CLIENT PORTAL SETUP
echo ========================================
echo.
echo Phase 1: Database Setup
echo ------------------------
echo.

cd /d "C:\Users\APEX AI\Desktop\defense\backend"

echo Running database verification and setup...
echo.
node scripts/verify-and-setup-database.mjs

echo.
if %ERRORLEVEL% EQU 0 (
    echo ========================================
    echo ✅ Phase 1 SUCCESSFUL!
    echo ========================================
    echo All database tables created successfully.
    echo Next step: Run setup-phase-2.bat
    echo ========================================
) else (
    echo ========================================
    echo ❌ Phase 1 FAILED!
    echo ========================================
    echo Please check error messages above.
    echo ========================================
)
echo.
echo Press any key to continue...
pause > nul
