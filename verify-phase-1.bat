@echo off
echo ========================================
echo APEX AI - DATABASE VERIFICATION
echo ========================================
echo.
echo Checking if Phase 1 completed successfully...
echo.

cd /d "C:\Users\APEX AI\Desktop\defense\backend"

echo Testing database connection and verifying tables...
echo.
node scripts/verify-and-setup-database.mjs

echo.
echo ========================================
echo Verification complete!
echo If you see green checkmarks above, 
echo Phase 1 was successful.
echo ========================================
echo.
echo Press any key to continue...
pause > nul
