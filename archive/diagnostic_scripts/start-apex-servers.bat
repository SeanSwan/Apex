@echo off
echo ===============================================
echo       APEX AI SECURITY PLATFORM STARTUP
echo ===============================================
echo.
echo [1/4] Checking Node.js installation...
node --version > nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)
echo ✅ Node.js is available

echo.
echo [2/4] Checking npm installation...
npm --version > nul 2>&1
if errorlevel 1 (
    echo ERROR: npm is not available
    pause
    exit /b 1
)
echo ✅ npm is available

echo.
echo [3/4] Killing any existing Node processes...
taskkill /f /im node.exe > nul 2>&1
echo ✅ Cleared existing Node processes

echo.
echo [4/4] Starting APEX AI Security Platform...
echo.
echo 🚀 Frontend will be available at: http://localhost:5173
echo 🚀 Backend API will be available at: http://localhost:5000
echo.
echo Starting servers...
npm run start

echo.
echo ===============================================
echo If you see any 404 errors, check the console output above
echo for import/export errors or missing dependencies.
echo ===============================================
pause
