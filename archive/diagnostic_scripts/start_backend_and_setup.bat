@echo off
echo.
echo 🚀 APEX AI FACE RECOGNITION - AUTOMATED STARTUP
echo ===============================================
echo.

echo 📡 Starting Backend Server...
echo.

cd /d "C:\Users\APEX AI\Desktop\defense\backend"

echo 📦 Installing backend dependencies...
call npm install

echo.
echo 🚀 Starting APEX AI Backend Server...
echo ⚠️  Server will start in a new window - DO NOT CLOSE IT
echo.

REM Start backend server in a new window
start "APEX AI Backend Server" cmd /k "npm run dev"

echo ⏳ Waiting for server to start...
timeout /t 10 /nobreak > nul

cd /d "C:\Users\APEX AI\Desktop\defense"

echo.
echo 🔍 Checking server status...
node check_system_status.mjs

echo.
echo 📋 If server is running, continue with:
echo 1. node setup_face_recognition_database.mjs
echo 2. node test_face_recognition_integration.mjs  
echo 3. Open http://localhost:3000/face-management
echo.

pause
