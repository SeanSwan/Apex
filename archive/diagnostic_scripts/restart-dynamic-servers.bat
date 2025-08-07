@echo off
echo.
echo ================================================
echo APEX AI DYNAMIC SERVER RESTART SYSTEM
echo ================================================
echo.
echo This enhanced system will:
echo - Automatically find available ports starting from 5000 and 5173
echo - Handle port conflicts gracefully  
echo - Save port information for integration tests
echo - Start servers with dynamic port allocation
echo.

REM Step 1: Clear any existing processes
echo [1/4] Clearing existing server processes...
echo.
echo 🛑 Stopping any existing backend servers...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :500') do (
    echo   Killing process ID: %%a
    taskkill /F /PID %%a >nul 2>&1
)

echo 🛑 Stopping any existing frontend servers...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :517') do (
    echo   Killing process ID: %%a
    taskkill /F /PID %%a >nul 2>&1
)

echo ✅ Process cleanup completed
timeout /t 2 /nobreak >nul

REM Step 2: Check Node.js and project structure
echo.
echo [2/4] Verifying environment...
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ ERROR: Node.js not found! Please install Node.js first.
    pause
    exit /b 1
)

if not exist "backend" (
    echo ❌ ERROR: backend directory not found!
    echo Please run this script from the defense project root directory.
    pause
    exit /b 1
)

if not exist "frontend" (
    echo ❌ ERROR: frontend directory not found!
    echo Please run this script from the defense project root directory.
    pause
    exit /b 1
)

if not exist "utils" (
    echo ❌ ERROR: utils directory not found!
    echo The dynamic port utilities are missing.
    pause
    exit /b 1
)

echo ✅ Environment verification passed

REM Step 3: Start backend with dynamic port allocation
echo.
echo [3/4] Starting backend server with dynamic port allocation...
echo 🚀 Finding available port for backend (starting from 5000)...
start "APEX AI Backend (Dynamic Port)" cmd /c "cd . && echo Starting backend with dynamic port allocation... && node utils/startBackendDynamic.mjs && pause"

echo ⏳ Waiting for backend to initialize...
timeout /t 8 /nobreak >nul

REM Step 4: Start frontend with dynamic port allocation
echo.
echo [4/4] Starting frontend server with dynamic port allocation...
echo 🚀 Finding available port for frontend (starting from 5173)...
start "APEX AI Frontend (Dynamic Port)" cmd /c "cd . && echo Starting frontend with dynamic port allocation... && node utils/startFrontendDynamic.mjs && pause"

echo ⏳ Waiting for frontend to initialize...
timeout /t 6 /nobreak >nul

REM Step 5: Discover and display actual ports being used
echo.
echo [5/5] Discovering actual server ports...
echo.
echo 🔍 Checking what ports were allocated...

REM Check if port info files were created
if exist "backend-port-info.json" (
    echo ✅ Backend port info found
) else (
    echo ⚠️  Backend port info not yet available - may still be starting
)

if exist "frontend-port-info.json" (
    echo ✅ Frontend port info found
) else (
    echo ⚠️  Frontend port info not yet available - may still be starting
)

echo.
echo 📊 Running port discovery utility...
node utils/discoverServerPorts.mjs

echo.
echo ================================================
echo 🎯 DYNAMIC SERVER RESTART COMPLETE
echo ================================================
echo.
echo SERVERS STARTED WITH AUTOMATIC PORT ALLOCATION!
echo.
echo 📋 What happened:
echo   1. ✅ Cleared any port conflicts
echo   2. ✅ Started backend on next available port (from 5000+)
echo   3. ✅ Started frontend on next available port (from 5173+)
echo   4. ✅ Saved port information for integration tests
echo.
echo 📱 Check the terminal windows for actual URLs being used
echo.
echo 🧪 INTEGRATION TESTING:
echo   The integration tests will automatically discover the actual ports
echo   Run: node test-integration-dynamic.mjs
echo.
echo 🌐 MANUAL ACCESS:
echo   Check the server terminal windows for the actual URLs
echo   Usually: http://localhost:5173 or http://localhost:5174, etc.
echo.
echo ================================================
echo If servers fail to start, check terminal windows for errors
echo Port conflicts are now handled automatically!
echo ================================================
echo.
pause
