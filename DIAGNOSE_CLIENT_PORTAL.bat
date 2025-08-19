@echo off
echo ========================================
echo 🔍 APEX AI CLIENT PORTAL - DIAGNOSTIC
echo ========================================
echo.

echo Checking system status...
echo.

echo ========================================
echo BACKEND STATUS CHECK
echo ========================================
echo.

echo Testing backend connection...
curl -s http://localhost:5001/api/health >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo ✅ Backend API is RUNNING on port 5001
    curl -s http://localhost:5001/api/health 2>nul | findstr "status" >nul
    if %ERRORLEVEL% EQU 0 (
        echo ✅ Backend health check PASSED
    ) else (
        echo ⚠️  Backend is running but health check returned unexpected response
    )
) else (
    echo ❌ Backend API is NOT running on port 5001
    echo 💡 Solution: Start backend with: cd backend && npm start
)

echo.
echo ========================================
echo CLIENT PORTAL STATUS CHECK
echo ========================================
echo.

echo Testing client portal connection...
curl -s http://localhost:5173 >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo ✅ Client Portal is RUNNING on port 5173
) else (
    echo ❌ Client Portal is NOT running on port 5173
    echo 💡 Solution: Start client portal with: cd client-portal && npm run dev
)

echo.
echo ========================================
echo FILE SYSTEM STATUS CHECK
echo ========================================
echo.

if exist "C:\Users\APEX AI\Desktop\defense\client-portal\package.json" (
    echo ✅ Client portal files exist
) else (
    echo ❌ Client portal files missing
)

if exist "C:\Users\APEX AI\Desktop\defense\client-portal\node_modules" (
    echo ✅ Client portal dependencies installed
) else (
    echo ❌ Client portal dependencies missing
    echo 💡 Solution: cd client-portal && npm install
)

if exist "C:\Users\APEX AI\Desktop\defense\backend\package.json" (
    echo ✅ Backend files exist
) else (
    echo ❌ Backend files missing
)

if exist "C:\Users\APEX AI\Desktop\defense\backend\node_modules" (
    echo ✅ Backend dependencies installed
) else (
    echo ❌ Backend dependencies missing
    echo 💡 Solution: cd backend && npm install
)

echo.
echo ========================================
echo RECOMMENDED ACTIONS
echo ========================================
echo.

echo If everything shows ✅ above:
echo 1. Run: APEX_AI_CLIENT_PORTAL_STARTUP.bat
echo 2. Visit: http://localhost:5173
echo 3. Login with: sarah.johnson@luxeapartments.com / Demo123!
echo.

echo If there are ❌ errors above:
echo 1. Follow the 💡 solutions listed
echo 2. Run this diagnostic again
echo 3. Then run the startup script
echo.

echo ========================================
echo CURRENT BROWSER LINKS
echo ========================================
echo.
echo 🏠 Landing Page:     http://localhost:5173
echo 🏢 Client Portal:    http://localhost:5173/client-portal/login
echo 🔧 Backend Health:   http://localhost:5001/api/health
echo 📊 Backend API:      http://localhost:5001/api/client/v1/dashboard/overview
echo.

pause
