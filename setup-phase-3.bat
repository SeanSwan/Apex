@echo off
echo ========================================
echo APEX AI - CLIENT PORTAL SETUP
echo ========================================
echo.
echo Phase 3: Starting Backend Server
echo ----------------------------------
echo.

cd /d "C:\Users\APEX AI\Desktop\defense\backend"

echo Installing backend dependencies...
call npm install

echo.
echo Starting backend server on http://localhost:5000
echo.
echo IMPORTANT: Keep this window open!
echo The backend server must run for the client portal to work.
echo.
echo Press Ctrl+C to stop the server when done testing.
echo.
echo ========================================
echo Backend server starting...
echo ========================================
echo.

npm run dev
