@echo off
echo ========================================
echo APEX AI - FINAL LANDING PAGE SOLUTION
echo ========================================
echo.

echo Killing any existing processes...
taskkill /F /IM node.exe >nul 2>&1
taskkill /F /IM npm.exe >nul 2>&1
timeout /t 3 >nul

echo Checking backend...
curl -s http://localhost:5001/api/health >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Backend not running
    echo Please start: setup-phase-3-fixed.bat
    pause
    exit /b 1
)

echo ✅ Backend ready on port 5001
echo.

cd /d "C:\Users\APEX AI\Desktop\defense\client-portal"

echo Clearing browser cache recommendation...
echo Please press Ctrl+F5 in browser to force refresh
echo.

echo ========================================
echo 🎯 LANDING PAGE SHOULD NOW WORK!
echo ========================================
echo.
echo Expected at http://localhost:5173:
echo ✅ APEX IQ SECURITY AI PLATFORM header
echo ✅ Two access cards: Client Portal + Login to App  
echo ✅ Dark theme matching your homepage
echo ✅ Professional design
echo.
echo If you STILL see 6 cards, check if another app is running!
echo ========================================
echo.

start http://localhost:5173

npm run dev
