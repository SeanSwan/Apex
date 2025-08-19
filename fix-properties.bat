@echo off
echo ========================================
echo APEX AI - PROPERTIES FIX
echo ========================================
echo.
echo Creating missing properties and incidents...
echo.

cd /d "C:\Users\APEX AI\Desktop\defense\backend"

echo Running properties and incidents fix...
node scripts/fix-properties-and-incidents.mjs

echo.
if %ERRORLEVEL% EQU 0 (
    echo ========================================
    echo ✅ PROPERTIES FIX SUCCESSFUL!
    echo ========================================
    echo All missing data created successfully.
    echo Phase 2 is now complete!
    echo Next step: Run setup-phase-3.bat
    echo ========================================
) else (
    echo ========================================
    echo ❌ PROPERTIES FIX FAILED!
    echo ========================================
    echo Please check error messages above.
    echo ========================================
)

echo.
echo Press any key to continue...
pause > nul
