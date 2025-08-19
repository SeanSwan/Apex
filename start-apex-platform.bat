@echo off
echo ========================================
echo APEX AI - COMPLETE PLATFORM STARTUP
echo ========================================
echo.

echo Checking backend server status...
curl -s http://localhost:5001/api/health >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Backend server is not running on port 5001
    echo Please start the backend first with: setup-phase-3-fixed.bat
    echo.
    pause
    exit /b 1
)

echo ✅ Backend server is running on port 5001
echo.

echo Starting APEX AI Platform with Landing Page...
echo.
echo ========================================
echo PLATFORM ACCESS POINTS:
echo ========================================
echo 🏠 Landing Page:     http://localhost:5173
echo 🏢 Client Portal:    http://localhost:5173/client-portal/login  
echo 🖥️  Operations App:   http://localhost:5173/app
echo ========================================
echo.

cd /d "C:\Users\APEX AI\Desktop\defense\client-portal"

echo Browser will open to the landing page...
start http://localhost:5173

npm run dev
