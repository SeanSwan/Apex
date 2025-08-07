@echo off
echo.
echo ================================================
echo APEX AI PHASE 5A SERVER RECOVERY & RESTART
echo ================================================
echo.
echo This script will:
echo 1. Kill any processes using ports 5000 and 5173
echo 2. Start backend server on port 5000
echo 3. Start frontend server on port 5173  
echo 4. Verify both servers are accessible
echo 5. Prepare for integration testing
echo.

REM Step 1: Clear port conflicts
echo [1/5] Clearing port conflicts...
echo.
echo 🛑 Killing processes on port 5000 (Backend)...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5000') do (
    echo   Killing process ID: %%a
    taskkill /F /PID %%a >nul 2>&1
)

echo 🛑 Killing processes on port 5173 (Frontend)...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5173') do (
    echo   Killing process ID: %%a
    taskkill /F /PID %%a >nul 2>&1
)

echo ✅ Port cleanup completed
timeout /t 2 /nobreak >nul

REM Step 2: Start Backend Server
echo.
echo [2/5] Starting Backend Server...
if not exist "backend" (
    echo ❌ ERROR: backend directory not found!
    echo Please run this script from the defense project root directory.
    pause
    exit /b 1
)

echo 🚀 Starting backend on port 5000...
start "APEX AI Backend Server" cmd /c "cd backend && echo Backend starting... && npm run dev && pause"

echo ⏳ Waiting for backend to initialize...
timeout /t 8 /nobreak >nul

REM Step 3: Start Frontend Server  
echo.
echo [3/5] Starting Frontend Server...
if not exist "frontend" (
    echo ❌ ERROR: frontend directory not found!
    pause
    exit /b 1
)

echo 🚀 Starting frontend on port 5173...
start "APEX AI Frontend Server" cmd /c "cd frontend && echo Frontend starting... && npm run dev && pause"

echo ⏳ Waiting for frontend to initialize...
timeout /t 6 /nobreak >nul

REM Step 4: Verify Server Accessibility
echo.
echo [4/5] Verifying Server Accessibility...
echo.

echo 🔍 Testing Backend (http://localhost:5000)...
curl -s -o nul -w "Backend HTTP Status: %%{http_code}\n" http://localhost:5000 2>nul
if errorlevel 1 (
    echo ⚠️ Backend not responding - may still be starting up
) else (
    echo ✅ Backend is accessible
)

echo.
echo 🔍 Testing Frontend (http://localhost:5173)...
curl -s -o nul -w "Frontend HTTP Status: %%{http_code}\n" http://localhost:5173 2>nul
if errorlevel 1 (
    echo ⚠️ Frontend not responding - may still be starting up
) else (
    echo ✅ Frontend is accessible
)

REM Step 5: Integration Test Preparation
echo.
echo [5/5] Integration Test Preparation...
echo.
echo ================================================
echo 🎯 SERVERS STARTED - READY FOR TESTING
echo ================================================
echo.
echo Backend Server:  http://localhost:5000
echo Frontend Server: http://localhost:5173
echo.
echo MANUAL VERIFICATION STEPS:
echo 1. Check backend terminal window for startup messages
echo 2. Check frontend terminal window for "Local: http://localhost:5173"
echo 3. Open browser to http://localhost:5173
echo 4. Verify WebSocket connection in Developer Tools Console
echo.
echo INTEGRATION TESTING COMMANDS:
echo   cd "C:\Users\APEX AI\Desktop\defense"
echo   node test-integration.mjs
echo.
echo ================================================
echo If servers fail to start, check the terminal windows
echo for error messages and resolve any dependency issues.
echo ================================================
echo.
pause
