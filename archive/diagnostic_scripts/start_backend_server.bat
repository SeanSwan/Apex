@echo off
echo.
echo 🚀 STARTING APEX AI BACKEND SERVER
echo =================================
echo.

echo 📍 Current directory: %CD%
echo 📁 Navigating to backend directory...

cd /d "C:\Users\APEX AI\Desktop\defense\backend"

echo 📁 Now in: %CD%
echo.

echo 📦 Installing/updating dependencies...
call npm install

echo.
echo 🚀 Starting APEX AI Backend Server...
echo.
echo ⚠️  IMPORTANT: This window will show server logs
echo ⚠️  DO NOT CLOSE this window - keep it open!
echo ⚠️  The server needs to stay running
echo.
echo 💡 After server starts, open a NEW terminal and run:
echo    cd "C:\Users\APEX AI\Desktop\defense"
echo    node check_system_status.mjs
echo    node setup_face_recognition_database.mjs
echo.

echo 🔄 Starting server now...
echo.

npm run dev

pause
