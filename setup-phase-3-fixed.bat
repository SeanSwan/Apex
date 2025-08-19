@echo off
echo ========================================
echo APEX AI - BACKEND SERVER (PORT 5001)
echo ========================================
echo.
echo Stopping any existing servers on port 5000/5001...
echo.
taskkill /F /IM node.exe 2>NUL
timeout /t 3 >NUL

cd /d "C:\Users\APEX AI\Desktop\defense\backend"

echo.
echo Starting backend server on http://localhost:5001
echo (Changed from port 5000 to avoid conflicts)
echo.
echo IMPORTANT: Keep this window open!
echo The backend server must run for the client portal to work.
echo.
echo Press Ctrl+C to stop the server when done testing.
echo.
echo ========================================
echo Backend server starting on PORT 5001...
echo ========================================
echo.

npm run dev
