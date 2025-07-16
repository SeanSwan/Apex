@echo off
echo.
echo ================================================
echo APEX AI PHASE 5A INTEGRATION TESTING LAUNCHER
echo ================================================
echo.
echo Starting backend and frontend servers for integration testing...
echo.

REM Check if we're in the correct directory
if not exist "backend" (
    echo ERROR: backend directory not found!
    echo Please run this script from the defense project root directory.
    echo Current directory: %CD%
    pause
    exit /b 1
)

if not exist "frontend" (
    echo ERROR: frontend directory not found!
    echo Please run this script from the defense project root directory.
    echo Current directory: %CD%
    pause
    exit /b 1
)

echo [1/4] Checking Node.js installation...
node --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js not found! Please install Node.js first.
    pause
    exit /b 1
)
echo     ✅ Node.js found

echo [2/4] Starting Backend Server (Port 5000)...
start "APEX AI Backend Server" cmd /k "cd backend && echo Starting backend server... && npm run dev"

echo     ⏳ Waiting for backend to initialize...
timeout /t 5 /nobreak >nul

echo [3/4] Starting Frontend Server (Port 5173)...  
start "APEX AI Frontend Server" cmd /k "cd frontend && echo Starting frontend server... && npm run dev"

echo     ⏳ Waiting for frontend to initialize...
timeout /t 3 /nobreak >nul

echo [4/4] Opening Integration Test Guide...
start "" "PHASE_5A_INTEGRATION_TESTING_GUIDE.md"

echo.
echo ================================================
echo 🚀 SERVERS STARTED SUCCESSFULLY!
echo ================================================
echo.
echo Backend Server:  http://localhost:5000
echo Frontend Server: http://localhost:5173
echo.
echo NEXT STEPS FOR PHASE 5A INTEGRATION TESTING:
echo.
echo 1. Wait for both servers to fully start (check terminal windows)
echo 2. Run integration tests: node test-integration.mjs  
echo 3. Open browser to: http://localhost:5173
echo 4. Check Developer Tools Console for WebSocket connection
echo 5. Monitor Network tab for API calls
echo.
echo To run automated integration tests:
echo     node test-integration.mjs
echo.
echo To stop servers: Close the terminal windows or press Ctrl+C
echo.
echo ================================================
echo 📋 Integration Testing Guide opened automatically
echo Follow the step-by-step instructions for complete testing
echo ================================================
echo.
pause
