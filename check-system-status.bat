@echo off
echo ========================================
echo APEX AI - SYSTEM STATUS CHECK
echo ========================================
echo.

echo Checking backend server status...
curl -s http://localhost:5001/api/health >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo ✅ Backend server: RUNNING on port 5001
) else (
    echo ❌ Backend server: NOT RUNNING
    echo    Please restart setup-phase-3-fixed.bat
)

echo.
echo Checking client portal status...
curl -s http://localhost:3000 >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo ✅ Client portal: RUNNING on port 3000
    echo.
    echo ========================================
    echo 🎉 SYSTEM READY!
    echo ========================================
    echo Navigate to: http://localhost:3000
    echo Login with: sarah.johnson@luxeapartments.com
    echo Password: Demo123!
    echo ========================================
) else (
    echo ❌ Client portal: NOT RUNNING
    echo    Run: start-client-portal-fixed.bat
)

echo.
echo Press any key to continue...
pause > nul
