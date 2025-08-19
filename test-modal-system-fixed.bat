@echo off
echo ========================================
echo APEX AI - MODAL SYSTEM TEST (FIXED)
echo ========================================
echo.
echo Testing the modal system with proper path handling
echo.

REM Get the current directory (should be defense folder)
set "CURRENT_DIR=%~dp0"
set "PROJECT_DIR=%CURRENT_DIR%"
echo Project directory: %PROJECT_DIR%

REM Check if we're in the right location
if not exist "%PROJECT_DIR%client-portal" (
    echo ERROR: Cannot find client-portal directory
    echo Please make sure you're running this from the defense folder
    echo Current directory: %CD%
    pause
    exit /b 1
)

if not exist "%PROJECT_DIR%backend" (
    echo ERROR: Cannot find backend directory
    echo Please make sure you're running this from the defense folder
    echo Current directory: %CD%
    pause
    exit /b 1
)

echo SUCCESS: Found project directories
echo.

echo Starting backend server...
echo Opening new window for backend...
start "APEX Backend Server" cmd /k "cd /d \"%PROJECT_DIR%backend\" && echo APEX AI Backend Server (Port 5001) && echo ============================= && npm start"

echo Waiting for backend to initialize...
timeout /t 5 >nul

echo.
echo ========================================
echo MODAL SYSTEM TESTING GUIDE
echo ========================================
echo.
echo The backend server is starting in a separate window.
echo Now we'll start the client portal...
echo.
echo WHEN THE BROWSER OPENS, TEST THESE STEPS:
echo.
echo [ ] 1. Homepage loads with video background
echo [ ] 2. Single "Enter Platform" button visible
echo [ ] 3. Click "Enter Platform" button
echo [ ] 4. Role selection modal appears with blur effect
echo [ ] 5. See 4 role options (Client Portal should be available)
echo [ ] 6. Click "Client Portal" option
echo [ ] 7. Client login modal appears
echo [ ] 8. Enter demo credentials:
echo        Email: sarah.johnson@luxeapartments.com
echo        Password: Demo123!
echo [ ] 9. Redirects to client dashboard
echo.
echo ========================================
echo TROUBLESHOOTING CHECKLIST
echo ========================================
echo.
echo IF NOTHING HAPPENS WHEN CLICKING BUTTON:
echo - Open browser developer tools (F12)
echo - Check Console tab for JavaScript errors
echo - Verify the button has onclick attribute
echo.
echo IF MODAL DOESN'T APPEAR:
echo - Check browser console for import errors
echo - Try hard refresh (Ctrl+F5)
echo - Verify TypeScript compilation was successful
echo.
echo IF AUTHENTICATION FAILS:
echo - Check if backend window shows "Server running on port 5001"
echo - Verify network requests in browser dev tools
echo - Confirm credentials are typed exactly as shown
echo.

echo Starting client portal...
cd /d "%PROJECT_DIR%client-portal"

echo.
echo ========================================
echo CLIENT PORTAL STARTING...
echo ========================================
echo.
echo Backend: http://localhost:5001 (separate window)
echo Frontend: http://localhost:5173 (starting now)
echo.
echo Press Ctrl+C to stop the development server
echo Browser should open automatically to http://localhost:5173
echo.

npm run dev
