@echo off
echo ========================================
echo APEX AI - DEPENDENCY INSTALLATION
echo ========================================
echo.
echo Installing missing backend dependencies...
echo.

cd /d "C:\Users\APEX AI\Desktop\defense\backend"

echo Installing all backend dependencies (including bcrypt)...
call npm install

echo.
if %ERRORLEVEL% EQU 0 (
    echo ========================================
    echo ✅ Dependencies installed successfully!
    echo ========================================
    echo Now running test data population...
    echo.
    
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
        echo ❌ Test data population failed!
        echo ========================================
        echo Please check error messages above.
        echo ========================================
    )
) else (
    echo ========================================
    echo ❌ Dependency installation failed!
    echo ========================================
    echo Please check error messages above.
    echo ========================================
)

echo.
echo Press any key to continue...
pause > nul
