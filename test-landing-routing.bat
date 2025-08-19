@echo off
echo ========================================
echo APEX AI - LANDING PAGE ROUTING TEST
echo ========================================
echo.

echo STEP 1: Testing if landing page routing works...
echo.

echo Stopping any existing servers...
taskkill /F /IM node.exe >nul 2>&1
timeout /t 2 >nul

echo Checking backend...
curl -s http://localhost:5001/api/health >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Backend not running - start setup-phase-3-fixed.bat first
    pause
    exit /b 1
)

echo ✅ Backend ready
echo.

cd /d "C:\Users\APEX AI\Desktop\defense\client-portal"

echo ========================================
echo 🧪 STARTING ROUTING TEST
echo ========================================
echo.
echo Expected Result: 
echo 🚨 Big red test page with "LANDING PAGE TEST"
echo 🚨 Two test buttons for Client Portal and Operations App
echo.
echo If you see this test page, routing is working!
echo If you still see the 6-card layout, there's a conflict!
echo.
echo Opening test page in 3 seconds...
timeout /t 3 >nul

start http://localhost:5173

npm run dev
