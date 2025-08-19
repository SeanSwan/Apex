@echo off
echo ========================================
echo APEX AI - STARTUP CONFIGURATION FIXED
echo ========================================
echo.
echo WHAT WAS CHANGED:
echo OLD: start-frontend pointed to "frontend" (operations dashboard)
echo NEW: start-frontend points to "client-portal" (modal system)
echo.
echo Now when you run "npm start" it will start:
echo [BACKEND]  - Port 5001 (API server)
echo [FRONTEND] - Port 5173 (Client portal with modal system)
echo.
echo ========================================
echo TESTING THE FIX
echo ========================================
echo.

echo Killing any existing processes...
taskkill /F /IM node.exe 2>nul
timeout /t 2 >nul

echo Starting with corrected configuration...
echo.
echo You should see:
echo [BACKEND]  - Backend server starting on port 5001
echo [FRONTEND] - Client portal starting on port 5173
echo.
echo When browser opens, you should see:
echo - Video background homepage
echo - "Enter Platform" button
echo - NOT the operations dashboard
echo.
echo ========================================
echo RUNNING: npm start
echo ========================================
echo.

npm start
