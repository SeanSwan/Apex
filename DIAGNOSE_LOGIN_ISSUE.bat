@echo off
echo ========================================
echo APEX AI - LOGIN ISSUE DIAGNOSIS
echo ========================================
echo.
echo This script will help diagnose the login redirect issue.
echo.
echo STEP 1: Starting all required services...
echo ========================================

REM Check if we're in the correct directory
if not exist "backend" (
    echo ERROR: backend directory not found!
    echo Please run this script from the defense directory.
    pause
    exit /b 1
)

if not exist "client-portal" (
    echo ERROR: client-portal directory not found!
    echo Please run this script from the defense directory.
    pause
    exit /b 1
)

echo 🛑 Stopping any existing services...
taskkill /F /IM node.exe 2>NUL
timeout /t 2 >NUL

echo.
echo 🚀 Starting Backend API Server...
start "APEX Backend (Port 5001)" cmd /k "cd /d \"%~dp0backend\" && echo Starting backend server... && npm run dev"

echo Waiting 8 seconds for backend to initialize...
timeout /t 8 >NUL

echo.
echo 🚀 Starting Client Portal...
start "APEX Client Portal (Port 3000)" cmd /k "cd /d \"%~dp0client-portal\" && echo Starting client portal... && npm run dev"

echo Waiting 5 seconds for client portal to start...
timeout /t 5 >NUL

echo.
echo ========================================
echo STEP 2: TESTING API CONNECTIVITY
echo ========================================
echo.
echo Testing backend API health...
curl -s http://localhost:5001/api/health > nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Backend API is responding on port 5001
) else (
    echo ❌ Backend API is not responding on port 5001
    echo Check the backend console for errors.
)

echo.
echo ========================================
echo STEP 3: OPENING BROWSER WITH DEBUG MODE
echo ========================================
echo.
echo Opening client portal with browser console for debugging...
echo 📋 TESTING INSTRUCTIONS:
echo.
echo 1. Browser will open to http://localhost:3000
echo 2. Open Developer Tools (F12)
echo 3. Go to Console tab
echo 4. Click "Access Client Portal" button
echo 5. Login with: sarah.johnson@luxeapartments.com / Demo123!
echo 6. Watch console for debug messages
echo.
echo Look for these debug messages:
echo   🔐 AuthProvider: Starting login process...
echo   🔐 AuthProvider: Login successful, setting user state...
echo   🎯 LandingPage: Login success callback triggered...
echo   🎯 LandingPage: Executing navigation to /client-portal/dashboard
echo   🚼 ProtectedRoute: Location: ...
echo.
echo If you see all these messages but still get redirected back,
echo the issue is likely in the ProtectedRoute logic.
echo.

timeout /t 3 >NUL
start "" "http://localhost:3000"

echo ========================================
echo STEP 4: COMMON SOLUTIONS TO TRY
echo ========================================
echo.
echo If login still fails:
echo.
echo A) Clear browser storage:
echo    - Open DevTools (F12)
echo    - Go to Application tab
echo    - Clear all localStorage and sessionStorage
echo    - Refresh page and try again
echo.
echo B) Check network requests:
echo    - Go to Network tab in DevTools
echo    - Try to login and watch for API calls
echo    - Look for /api/client/v1/auth/login
echo    - Check if it returns 200 status
echo.
echo C) If API calls fail:
echo    - Restart backend server
echo    - Check backend console for errors
echo    - Verify database is running
echo.
echo ========================================
echo 🔍 DIAGNOSIS COMPLETE
echo ========================================
echo.
echo The services are now running with debug logging enabled.
echo Follow the testing instructions above to identify the issue.
echo.
echo Keep both console windows open while testing.
echo Press any key to close this diagnosis script.
echo.
pause
