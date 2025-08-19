@echo off
echo ========================================
echo ⚡ APEX AI CLIENT PORTAL - QUICK FIX
echo ========================================
echo.
echo This script fixes common issues that prevent
echo the client portal from being visible.
echo.

echo ========================================
echo STEP 1: KILL ANY RUNNING PROCESSES
echo ========================================
echo.

echo Stopping any existing Node.js processes...
taskkill /f /im node.exe >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo ✅ Stopped existing Node.js processes
) else (
    echo ℹ️  No Node.js processes were running
)

echo.
echo Waiting for ports to be released...
timeout /t 3 /nobreak >nul

echo ========================================
echo STEP 2: VERIFY DEPENDENCIES
echo ========================================
echo.

cd /d "C:\Users\APEX AI\Desktop\defense\backend"
echo Checking backend dependencies...
if not exist "node_modules" (
    echo 🔄 Installing backend dependencies...
    npm install
    echo ✅ Backend dependencies installed
) else (
    echo ✅ Backend dependencies already installed
)

echo.
cd /d "C:\Users\APEX AI\Desktop\defense\client-portal"
echo Checking client portal dependencies...
if not exist "node_modules" (
    echo 🔄 Installing client portal dependencies...
    npm install
    echo ✅ Client portal dependencies installed
) else (
    echo ✅ Client portal dependencies already installed
)

echo.
echo ========================================
echo STEP 3: CLEAR BUILD CACHE
echo ========================================
echo.

echo Clearing Vite cache...
if exist ".vite" rd /s /q ".vite" 2>nul
if exist "dist" rd /s /q "dist" 2>nul
echo ✅ Build cache cleared

echo.
echo ========================================
echo STEP 4: START FRESH SERVERS
echo ========================================
echo.

echo Starting backend server in background...
cd /d "C:\Users\APEX AI\Desktop\defense\backend"
start "APEX Backend" cmd /k "title APEX AI Backend Server & echo ================================ & echo APEX AI Backend Server & echo Port: 5001 & echo Status: Starting... & echo ================================ & npm start"

echo ⏳ Waiting for backend to initialize (20 seconds)...
timeout /t 20 /nobreak >nul

echo Checking backend status...
curl -s http://localhost:5001/api/health >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo ✅ Backend server is running successfully!
) else (
    echo ⚠️  Backend may still be starting. Will proceed with client portal...
)

echo.
echo Starting client portal...
cd /d "C:\Users\APEX AI\Desktop\defense\client-portal"

echo ========================================
echo 🎯 CLIENT PORTAL SHOULD NOW BE VISIBLE!
echo ========================================
echo.
echo 🌐 Your client portal will open automatically in:
echo    http://localhost:5173
echo.
echo 🔐 TEST LOGIN:
echo    Email: sarah.johnson@luxeapartments.com
echo    Password: Demo123!
echo.
echo 📱 FEATURES YOU'LL SEE:
echo    ✅ Professional landing page
echo    ✅ Executive dashboard with KPIs
echo    ✅ Incident browser and search
echo    ✅ Evidence locker with files
echo    ✅ APEX AI branding and styling
echo.

timeout /t 3 /nobreak >nul
start http://localhost:5173

echo ========================================
echo 🚀 STARTING CLIENT PORTAL...
echo ========================================
echo.

npm run dev
