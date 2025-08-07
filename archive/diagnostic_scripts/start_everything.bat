@echo off
echo.
echo 🚀 APEX AI FACE RECOGNITION - ONE-COMMAND STARTUP
echo ==================================================
echo.

echo 📁 Navigating to backend directory...
cd /d "%~dp0backend"

echo 📦 Installing backend dependencies...
call npm install

echo.
echo 🚀 Starting backend server in background...
start /B npm run dev

echo ✅ Backend server started in background
echo ⏳ Waiting for server to initialize...
timeout /t 10 /nobreak >nul

echo.
echo 🔄 Returning to main directory...
cd /d "%~dp0"

echo 🔍 Checking system status...
node check_system_status.mjs

echo.
echo 🗄️ Setting up database...
node setup_face_recognition_database.mjs

echo.
echo 🧪 Running integration tests...
node test_face_recognition_integration.mjs

echo.
echo 🎉 SETUP COMPLETE!
echo ==================
echo.
echo ✅ Face Recognition system is ready!
echo 🌐 Access it at: http://localhost:3000/face-management
echo.
echo ⚠️  Backend server is running in background
echo 💡 Server will stop when you close this window
echo.

pause
