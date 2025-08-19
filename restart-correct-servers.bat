@echo off
echo ========================================
echo APEX AI - STOP ALL PROCESSES & RESTART
echo ========================================
echo.
echo Stopping all Node.js processes and clearing ports...
echo.

echo Killing all Node.js processes...
taskkill /F /IM node.exe 2>nul
taskkill /F /IM nodemon.exe 2>nul
timeout /t 2 >nul

echo Checking if ports are now free...
netstat -ano | findstr :5001
if errorlevel 1 (
    echo SUCCESS: Port 5001 is now free
) else (
    echo WARNING: Port 5001 still in use
)

netstat -ano | findstr :5173  
if errorlevel 1 (
    echo SUCCESS: Port 5173 is now free
) else (
    echo WARNING: Port 5173 still in use
)

echo.
echo All processes stopped. Now we'll start the correct servers...
echo.

echo ========================================
echo STARTING CORRECT SERVERS
echo ========================================
echo.

echo [1/2] Starting BACKEND server on port 5001...
cd /d "%~dp0backend"
start "APEX Backend" cmd /k "echo APEX AI Backend Server && echo Port: 5001 && echo ====================== && npm start"

echo Waiting for backend to start...
timeout /t 5 >nul

echo [2/2] Starting CLIENT PORTAL on port 5173...
cd /d "%~dp0client-portal"

echo.
echo ========================================
echo CLIENT PORTAL STARTING...
echo ========================================
echo.
echo Backend: http://localhost:5001 (separate window)
echo Frontend: http://localhost:5173 (this window)
echo.
echo TESTING STEPS:
echo 1. Browser should open to http://localhost:5173
echo 2. Click "Enter Platform" button
echo 3. Role selection modal should appear
echo 4. Select "Client Portal"
echo 5. Login modal should appear
echo 6. Use demo credentials:
echo    Email: sarah.johnson@luxeapartments.com
echo    Password: Demo123!
echo.

npm run dev
