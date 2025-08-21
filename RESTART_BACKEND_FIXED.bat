@echo off
echo.
echo ================================================
echo 🔄 RESTARTING BACKEND WITH RATE LIMIT FIX
echo ================================================
echo.
echo Stopping current backend server...
taskkill /F /IM node.exe /T 2>NUL
echo Waiting 3 seconds...
timeout /t 3 >NUL

echo.
echo Starting backend server with updated rate limits...
cd /d "C:\Users\APEX AI\Desktop\defense\backend"
start "APEX AI - Backend API Server (FIXED)" cmd /k "echo 🔥 Backend API Server - Rate Limits FIXED && echo 📊 New Limits: 100 requests/minute (was 10) && echo 🌐 Server: http://localhost:5001 && echo 🔐 Dashboard: Full API access restored && echo. && npm start"

echo.
echo ================================================
echo ✅ BACKEND RESTARTED WITH RATE LIMIT FIX!
echo ================================================
echo.
echo Your client portal should now work perfectly!
echo Go back to: http://localhost:5173
echo.
echo 🔑 TEST CREDENTIALS:
echo    📧 Email: sarah.johnson@luxeapartments.com
echo    🔐 Password: Demo123!
echo.
pause