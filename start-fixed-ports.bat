@echo off
echo ========================================
echo APEX AI - PORT CONFIGURATION FIXED
echo ========================================
echo.

echo ✅ Port configuration has been corrected:
echo    Frontend: http://localhost:5173 (Standard Vite port)
echo    Backend:  http://localhost:5001 (API server)
echo    CORS:     Configured for port 5173
echo.

echo Checking backend status...
curl -s http://localhost:5001/api/health >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Backend server is not running on port 5001
    echo Please restart the backend with: setup-phase-3-fixed.bat
    echo.
    pause
    exit /b 1
)

echo ✅ Backend server is ready on port 5001
echo.

echo ========================================
echo 🚀 LAUNCHING FIXED APEX AI PLATFORM
echo ========================================
echo.
echo CORRECT URLs:
echo 🏠 Landing Page:      http://localhost:5173
echo 🏢 Client Portal:     http://localhost:5173/client-portal/login
echo 🖥️  Operations App:    http://localhost:5173/app
echo.
echo Opening browser to: http://localhost:5173
echo ========================================
echo.

cd /d "C:\Users\APEX AI\Desktop\defense\client-portal"
start http://localhost:5173

npm run dev
