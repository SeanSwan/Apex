@echo off
echo ========================================
echo APEX AI - CLIENT PORTAL SETUP
echo ========================================
echo.
echo Phase 2: Test Data Population
echo ------------------------------
echo.

cd /d "C:\Users\APEX AI\Desktop\defense\backend"

echo Populating database with realistic test data...
echo This will create:
echo - 3 client companies
echo - 6 properties
echo - 4 client portal users
echo - 100+ realistic incidents
echo - Evidence files and metadata
echo.
node scripts/populate-test-data.mjs

echo.
echo ========================================
echo Phase 2 Complete!
echo Next: Run setup-phase-3.bat
echo ========================================
pause
