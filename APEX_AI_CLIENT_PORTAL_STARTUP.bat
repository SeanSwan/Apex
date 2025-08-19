@echo off
echo ========================================
echo 🚀 APEX AI CLIENT PORTAL - FULL STARTUP
echo ========================================
echo.
echo This script will start your complete client portal system:
echo ✅ Backend API Server (Port 5001)
echo ✅ Client Portal Frontend (Port 5173)  
echo ✅ Landing Page with Access Portal
echo.

echo ========================================
echo STEP 1: STARTING BACKEND SERVER
echo ========================================
echo.

cd /d "C:\Users\APEX AI\Desktop\defense\backend"

echo Checking if backend is already running...
curl -s http://localhost:5001/api/health >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo ✅ Backend is already running on port 5001
) else (
    echo 🔄 Starting backend server...
    start "APEX AI Backend" cmd /k "echo APEX AI Backend Server & echo ======================== & npm start"
    echo.
    echo ⏳ Waiting for backend to start (15 seconds)...
    timeout /t 15 /nobreak >nul
    
    echo Verifying backend startup...
    curl -s http://localhost:5001/api/health >nul 2>&1
    if %ERRORLEVEL% EQU 0 (
        echo ✅ Backend server started successfully!
    ) else (
        echo ❌ Backend failed to start. Check the backend window for errors.
        pause
        exit /b 1
    )
)

echo.
echo ========================================
echo STEP 2: STARTING CLIENT PORTAL
echo ========================================
echo.

cd /d "C:\Users\APEX AI\Desktop\defense\client-portal"

echo 🔄 Starting client portal development server...
echo.
echo ========================================
echo 🎯 YOUR CLIENT PORTAL IS STARTING!
echo ========================================
echo.
echo 🏠 Landing Page:        http://localhost:5173
echo 🏢 Client Portal Login: http://localhost:5173/client-portal/login
echo 🖥️  Operations Console:  http://localhost:5173/app
echo.
echo ========================================
echo 🔐 TEST CREDENTIALS:
echo ========================================
echo Email:    sarah.johnson@luxeapartments.com
echo Password: Demo123!
echo.
echo ========================================
echo 📱 WHAT TO EXPECT:
echo ========================================
echo 1. Landing page with platform selection
echo 2. Professional client portal with:
echo    - Executive Dashboard with KPIs
echo    - Incident Browser with search/filter
echo    - Evidence Locker with secure files
echo    - Analytics and reporting
echo 3. Modern UI with APEX AI branding
echo.

echo 🌐 Opening browser to landing page...
timeout /t 3 /nobreak >nul
start http://localhost:5173

echo.
echo ========================================
echo 🚀 CLIENT PORTAL STARTING...
echo ========================================
echo.

npm run dev
