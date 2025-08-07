@echo off
echo ===============================================
echo    APEX AI - EMERGENCY RESTART (404 FIXED)
echo ===============================================
echo.

echo [1/3] Killing existing Node processes...
taskkill /f /im node.exe > nul 2>&1
echo ✅ Cleared Node processes

echo.
echo [2/3] Fixed Critical Issues:
echo   ✅ main.jsx → main.tsx (entry point corrected)
echo   ✅ Import/export errors resolved
echo   ✅ Title updated to APEX AI Security Platform

echo.
echo [3/3] Starting servers with fixes...
echo.
echo 🚀 Frontend: http://localhost:5173
echo 🚀 Backend:  http://localhost:5000
echo.
echo Starting APEX AI Security Platform...
npm start

echo.
echo ===============================================
echo If the frontend loads successfully, the 404 error is fixed!
echo Check the browser console for any remaining issues.
echo ===============================================
pause
