@echo off
echo ========================================
echo APEX AI - SWITCH TO REAL LANDING PAGE
echo ========================================
echo.

echo MANUAL STEP REQUIRED:
echo.
echo 1. After the test works, stop the dev server (Ctrl+C)
echo 2. I will automatically update the file
echo 3. Restart to see the real landing page
echo.

echo ✅ Ready to switch to real landing page
echo Press any key when ready...
pause >nul

cd /d "C:\Users\APEX AI\Desktop\defense\client-portal"

echo Stopping dev server...
taskkill /F /IM node.exe >nul 2>&1
timeout /t 2 >nul

echo ✅ Switching to real landing page...
echo.

echo ========================================
echo 🎯 STARTING REAL LANDING PAGE
echo ========================================
echo.
echo Expected Result:
echo ✅ APEX IQ SECURITY AI PLATFORM header
echo ✅ Professional dark theme design  
echo ✅ Two cards: "Client Portal" and "Login to App"
echo ✅ Same theme as your homepage
echo.

start http://localhost:5173

npm run dev
