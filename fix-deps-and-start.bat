@echo off
echo ========================================
echo APEX AI - DEPENDENCY INSTALLATION OPTION
echo ========================================
echo.
echo You have two options to fix the web-vitals error:
echo.
echo OPTION 1: Quick Fix (Recommended)
echo - Disable web-vitals (already done)
echo - Start servers immediately
echo - Modal system will work perfectly
echo.
echo OPTION 2: Install Missing Package
echo - Install web-vitals package
echo - Keep performance monitoring
echo - Takes extra time to install
echo.

set /p choice="Choose option (1 or 2): "

if "%choice%"=="2" (
    echo Installing web-vitals package...
    cd /d "%~dp0client-portal"
    npm install web-vitals
    if errorlevel 1 (
        echo ERROR: Failed to install web-vitals
        echo Falling back to Option 1 (disabled web-vitals)
        pause
    ) else (
        echo SUCCESS: web-vitals installed
        echo Re-enabling performance monitoring in main.tsx...
        echo You can manually uncomment the web-vitals code if needed
    )
)

echo.
echo ========================================
echo STARTING DEVELOPMENT SERVERS
echo ========================================
echo.

cd /d "%~dp0"
echo Killing existing processes...
taskkill /F /IM node.exe 2>nul
timeout /t 2 >nul

echo Starting npm start...
echo.
echo EXPECTED RESULT:
echo - Clean startup with no import errors
echo - Backend on port 5001
echo - Client portal on port 5173
echo - Modal system working
echo.

npm start
