@echo off
echo ========================================
echo APEX AI - FINAL VERIFICATION & STARTUP
echo ========================================
echo.

echo Checking project structure...
if not exist "client-portal\src\components\landing\LandingPage.tsx" (
    echo ❌ Landing page component missing
    exit /b 1
)

if not exist "client-portal\src\components\app\MainAppPlaceholder.tsx" (
    echo ❌ Main app placeholder missing
    exit /b 1
)

echo ✅ All components present
echo.

echo Checking backend status...
curl -s http://localhost:5001/api/health >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Backend server is not running
    echo    Please run: setup-phase-3-fixed.bat first
    echo.
    pause
    exit /b 1
)

echo ✅ Backend server is ready
echo.

echo ========================================
echo 🚀 STARTING APEX AI PLATFORM
echo ========================================
echo.
echo New Landing Page Structure:
echo.
echo 🏠 MAIN LANDING PAGE
echo    URL: http://localhost:5173
echo    Features: Platform selection with two options
echo.
echo 🏢 CLIENT PORTAL OPTION
echo    Access: Click "Client Portal" button
echo    Login: sarah.johnson@luxeapartments.com / Demo123!
echo    Features: Dashboard, Incidents, Evidence, Analytics
echo.
echo 🖥️  OPERATIONS APP OPTION  
echo    Access: Click "Login to App" button
echo    Status: Development placeholder (no login required)
echo    Features: Coming soon message with roadmap
echo.
echo ========================================
echo Browser will open to the new landing page...
echo ========================================
echo.

cd /d "C:\Users\APEX AI\Desktop\defense\client-portal"
start http://localhost:5173

npm run dev
