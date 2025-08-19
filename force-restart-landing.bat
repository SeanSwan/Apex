@echo off
echo ========================================
echo APEX AI - FORCE RESTART WITH LANDING PAGE
echo ========================================
echo.

echo STOPPING any existing dev servers...
taskkill /F /IM node.exe >nul 2>&1
taskkill /F /IM npm.exe >nul 2>&1
timeout /t 2 >nul

echo Clearing npm cache...
cd /d "C:\Users\APEX AI\Desktop\defense\client-portal"
npm cache clean --force >nul 2>&1

echo Checking backend status...
curl -s http://localhost:5001/api/health >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Backend server is not running
    echo Please start backend first: setup-phase-3-fixed.bat
    echo.
    pause
    exit /b 1
)

echo ✅ Backend running on port 5001
echo.

echo ========================================
echo 🚀 FORCE RESTARTING CLIENT PORTAL
echo ========================================
echo.
echo Expected Landing Page URL: http://localhost:5173
echo.
echo What you SHOULD see:
echo ✅ APEX IQ SECURITY AI PLATFORM header
echo ✅ Two access cards: "Client Portal" and "Login to App"
echo ✅ Dark theme matching your homepage
echo.
echo If you still see the 6-card layout, there's a routing conflict!
echo ========================================
echo.

echo Waiting 3 seconds then opening browser...
timeout /t 3 >nul

start http://localhost:5173

echo Starting fresh dev server...
npm run dev
