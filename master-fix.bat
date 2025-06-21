@echo off
echo =====================================
echo DEFENSE PROJECT - COMPLETE FIX
echo =====================================
echo.
echo This script will fix all current issues:
echo 1. Frontend dependency resolution errors  
echo 2. Backend missing jsdom dependency
echo 3. Database connection setup check
echo 4. Complete application startup test
echo.

pause

echo.
echo ===== PHASE 1: FRONTEND DEPENDENCIES =====
echo.
call fix-frontend-deps.bat

echo.
echo ===== PHASE 2: BACKEND DEPENDENCIES =====  
echo.
call fix-backend-deps.bat

echo.
echo ===== PHASE 3: DATABASE SETUP CHECK =====
echo.
call check-database.bat

echo.
echo ===== PHASE 4: FINAL APPLICATION TEST =====
echo.
echo Starting complete application...
echo Both frontend and backend will start.
echo.
echo Frontend should be available at: http://localhost:5173
echo Backend should be available at: http://localhost:5000
echo.
echo Press Ctrl+C to stop when ready.
echo.
timeout /t 3

npm start

echo.
echo === COMPLETE FIX FINISHED ===
echo.
echo If everything started successfully:
echo ✓ All dependencies are installed
echo ✓ Both frontend and backend are working
echo ✓ You can begin development
echo.
echo If there are still issues, check the individual logs above.
echo.
pause
