@echo off
echo ========================================
echo 🚀 APEX AI CLIENT PORTAL - FIXED STARTUP
echo ========================================
echo.
echo Starting the APEX AI Client Portal with all fixes applied...
echo.

echo ========================================
echo STEP 1: CLEANUP AND PREPARATION
echo ========================================
echo.

echo Stopping any existing Node.js processes...
taskkill /f /im node.exe >nul 2>&1
echo ✅ Cleaned up existing processes

echo.
echo Waiting for ports to be released...
timeout /t 2 /nobreak >nul

echo ========================================
echo STEP 2: START BACKEND SERVER
echo ========================================
echo.

cd /d "C:\Users\APEX AI\Desktop\defense\backend"
echo Starting backend server on port 5001...
start "APEX Backend" cmd /k "title APEX AI Backend - Port 5001 & npm start"

echo ⏳ Waiting for backend to start (15 seconds)...
timeout /t 15 /nobreak >nul

echo ========================================
echo STEP 3: START CLIENT PORTAL  
echo ========================================
echo.

cd /d "C:\Users\APEX AI\Desktop\defense\client-portal"
echo.
echo 🎯 CLIENT PORTAL CONFIGURATION:
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo 🌐 URL: http://localhost:5173
echo 🔗 Backend API: http://localhost:5001
echo 🔐 Test Login: sarah.johnson@luxeapartments.com / Demo123!
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo.

timeout /t 3 /nobreak >nul

echo Opening browser to http://localhost:5173...
start http://localhost:5173

echo.
echo 🚀 Starting client portal with Vite...
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
npm run dev
