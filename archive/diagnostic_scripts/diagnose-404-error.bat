@echo off
echo ===============================================
echo       APEX AI - 404 ERROR DIAGNOSTIC TOOL
echo ===============================================
echo.

echo [1/5] Checking if backend server is running...
curl -s http://localhost:5000/api/health > nul 2>&1
if errorlevel 1 (
    echo ❌ Backend server is NOT running on port 5000
    echo    Try running: npm run start-backend
) else (
    echo ✅ Backend server is running
)

echo.
echo [2/5] Checking if frontend server is running...
curl -s http://localhost:5173 > nul 2>&1
if errorlevel 1 (
    echo ❌ Frontend server is NOT running on port 5173
    echo    Try running: npm run start-frontend
) else (
    echo ✅ Frontend server is running
)

echo.
echo [3/5] Checking Node processes...
echo Active Node.js processes:
tasklist | findstr "node.exe" 2>nul
if errorlevel 1 (
    echo ❌ No Node.js processes running
) else (
    echo ✅ Node.js processes found
)

echo.
echo [4/5] Checking critical files...
if exist "frontend\src\components\Reports\DailyReportsPanel.tsx" (
    echo ✅ DailyReportsPanel.tsx exists
) else (
    echo ❌ DailyReportsPanel.tsx is missing
)

if exist "frontend\src\components\Reports\constants\index.ts" (
    echo ✅ Constants barrel export exists
) else (
    echo ❌ Constants barrel export is missing
)

if exist "frontend\src\components\Reports\utils\index.ts" (
    echo ✅ Utils barrel export exists
) else (
    echo ❌ Utils barrel export is missing
)

echo.
echo [5/5] Checking dependencies...
if exist "frontend\node_modules" (
    echo ✅ Frontend dependencies installed
) else (
    echo ❌ Frontend dependencies missing - run: cd frontend && npm install
)

if exist "backend\node_modules" (
    echo ✅ Backend dependencies installed
) else (
    echo ❌ Backend dependencies missing - run: cd backend && npm install
)

echo.
echo ===============================================
echo NEXT STEPS TO FIX 404 ERROR:
echo ===============================================
echo 1. If servers not running: Run start-apex-servers.bat
echo 2. If dependencies missing: Run npm run install-all
echo 3. If import errors persist: Check console for specific errors
echo 4. Check browser Network tab for exact 404 resource
echo ===============================================
pause
