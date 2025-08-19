@echo off
echo ========================================
echo STARTING APEX AI CLIENT PORTAL
echo ========================================
echo.

cd /d "C:\Users\APEX AI\Desktop\defense\client-portal"

echo Checking if backend is running...
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

echo Starting client portal frontend...
echo This will open http://localhost:3000 in your browser
echo.

npm run dev
