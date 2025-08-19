@echo off
echo ========================================
echo APEX AI - COMPLETE PLATFORM STARTUP
echo ========================================
echo.
echo Starting complete APEX AI Security Platform:
echo 1. Backend API Server (Port 5001)
echo 2. Main Frontend - Employee Console (Port 5173)
echo 3. Client Portal - Property Managers (Port 3000)
echo.
echo ========================================
echo STARTUP SEQUENCE INITIATED
echo ========================================
echo.

REM Check if we're in the correct directory
if not exist "backend" (
    echo ERROR: backend directory not found!
    echo Please run this script from the defense directory.
    pause
    exit /b 1
)

if not exist "frontend" (
    echo ERROR: frontend directory not found!
    echo Please run this script from the defense directory.
    pause
    exit /b 1
)

if not exist "client-portal" (
    echo ERROR: client-portal directory not found!
    echo Please run this script from the defense directory.
    pause
    exit /b 1
)

echo ⏹️  Stopping any existing servers...
taskkill /F /IM node.exe 2>NUL
timeout /t 2 >NUL

echo.
echo 🚀 STEP 1: Starting Backend API Server...
echo ========================================
start "APEX AI - Backend API (Port 5001)" cmd /k "cd /d \"%~dp0backend\" && echo Starting backend server on http://localhost:5001... && npm run dev"

echo Waiting 5 seconds for backend to initialize...
timeout /t 5 >NUL

echo.
echo 🚀 STEP 2: Starting Main Frontend (Employee Console)...
echo ========================================
start "APEX AI - Main Frontend (Port 5173)" cmd /k "cd /d \"%~dp0frontend\" && echo Starting main frontend on http://localhost:5173... && npm run dev"

echo Waiting 3 seconds for main frontend to start...
timeout /t 3 >NUL

echo.
echo 🚀 STEP 3: Starting Client Portal...
echo ========================================
start "APEX AI - Client Portal (Port 3000)" cmd /k "cd /d \"%~dp0client-portal\" && echo Starting client portal on http://localhost:3000... && npm run dev"

echo.
echo ========================================
echo ✅ APEX AI PLATFORM STARTUP COMPLETE!
echo ========================================
echo.
echo 🌐 APPLICATIONS RUNNING:
echo.
echo 📡 Backend API:         http://localhost:5001
echo 🎛️  Main Frontend:       http://localhost:5173
echo 👥 Client Portal:       http://localhost:3000
echo.
echo ========================================
echo 🚀 GETTING STARTED
echo ========================================
echo.
echo FOR COMPANY EMPLOYEES (Dispatchers, Admins, Guards):
echo 1. Open: http://localhost:3000
echo 2. Click "Enter Platform" button
echo 3. Select your role (Dispatcher/Administrator/Guard)
echo 4. You'll be redirected to the main console
echo.
echo FOR PROPERTY MANAGERS (Clients):
echo 1. Open: http://localhost:3000
echo 2. Click "Enter Platform" button
echo 3. Select "Client Portal"
echo 4. Login with: sarah.johnson@luxeapartments.com / Demo123!
echo.
echo ========================================
echo ⚠️  IMPORTANT NOTES
echo ========================================
echo.
echo - Keep all 3 command windows open for the platform to work
echo - Backend must run for both frontends to function properly
echo - Press Ctrl+C in any window to stop that service
echo - Close this window after all services have started
echo.
echo Browser should automatically open to: http://localhost:3000
echo.

REM Wait a bit longer then open browser
timeout /t 5 >NUL
start "" "http://localhost:3000"

echo ========================================
echo 🎉 PLATFORM READY! Happy securing! 🛡️
echo ========================================
echo.
pause
