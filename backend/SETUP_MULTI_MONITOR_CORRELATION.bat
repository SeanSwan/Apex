@echo off
echo ===============================================
echo APEX AI MULTI-MONITOR CORRELATION DATABASE SETUP
echo ===============================================
echo.

echo Checking Node.js installation...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org
    pause
    exit /b 1
)

echo Node.js version:
node --version
echo.

echo Setting up Multi-Monitor Threat Correlation database...
echo.

cd /d "%~dp0"
node setup-multi-monitor-correlation-db.mjs

if %errorlevel% equ 0 (
    echo.
    echo ===============================================
    echo SUCCESS: Multi-Monitor Correlation database setup complete!
    echo ===============================================
    echo.
    echo You can now:
    echo 1. Start the backend server: npm start
    echo 2. Launch the AI engine with correlation support
    echo 3. Configure monitor relationships for your setup
    echo 4. Begin automatic cross-monitor threat tracking
    echo.
    echo Features enabled:
    echo - Cross-monitor threat correlation with AI-powered matching
    echo - Threat handoff between monitors with ^<500ms latency
    echo - Comprehensive audit trail for all correlation events
    echo - Spatial relationship modeling for accurate predictions
    echo.
) else (
    echo.
    echo ===============================================
    echo ERROR: Database setup failed!
    echo ===============================================
    echo.
    echo Please check:
    echo 1. PostgreSQL is running
    echo 2. Database credentials in .env file are correct
    echo 3. Database exists and is accessible
    echo 4. Rules Configuration system is set up (recommended)
    echo.
)

echo Press any key to continue...
pause >nul
