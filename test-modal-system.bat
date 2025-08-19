@echo off
echo ========================================
echo APEX AI - MODAL SYSTEM TEST & STARTUP
echo ========================================
echo.
echo Testing the new futuristic modal login system
echo with backend integration and client portal access.
echo.

set "PROJECT_DIR=C:\Users\APEX AI\Desktop\defense"

echo Checking project structure...
if not exist "%PROJECT_DIR%\client-portal" (
    echo ❌ ERROR: Client portal directory not found
    pause
    exit /b 1
)

if not exist "%PROJECT_DIR%\backend" (
    echo ❌ ERROR: Backend directory not found
    pause
    exit /b 1
)

echo ✅ Project structure verified
echo.

echo Starting backend server on port 5001...
cd /d "%PROJECT_DIR%\backend"
start "APEX Backend" cmd /k "echo APEX AI Backend Server & echo ======================== & npm start"
echo ✅ Backend starting...
echo.

echo Waiting 5 seconds for backend to initialize...
timeout /t 5 >nul

echo Starting client portal with modal system...
cd /d "%PROJECT_DIR%\client-portal"

echo.
echo ========================================
echo MODAL SYSTEM FEATURES TO TEST:
echo ========================================
echo 1. Homepage displays single "ACCESS PORTAL" button
echo 2. Click button opens role selection modal
echo 3. Video background blurs during modal overlay
echo 4. Select "Client Portal" opens client login modal
echo 5. Demo credentials work: sarah.johnson@luxeapartments.com / Demo123!
echo 6. Successful login redirects to dashboard
echo 7. All other roles show appropriate development messages
echo.
echo TEST CREDENTIALS:
echo Email: sarah.johnson@luxeapartments.com
echo Password: Demo123!
echo.
echo ========================================
echo MODAL SYSTEM TESTING CHECKLIST:
echo ========================================
echo □ Homepage loads with single access button
echo □ Role selection modal opens with 4 options
echo □ Video background blurs properly
echo □ Client login modal appears when selected
echo □ Authentication works with demo credentials
echo □ User redirected to dashboard after login
echo □ Modal animations are smooth and futuristic
echo □ All styling maintains APEX AI theme
echo.

echo Browser should open automatically to:
echo http://localhost:5173
echo.
echo Backend running on: http://localhost:5001
echo Client Portal running on: http://localhost:5173
echo.
echo Press any key to start the development server...
pause >nul

npm run dev
