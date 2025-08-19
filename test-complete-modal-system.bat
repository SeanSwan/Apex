@echo off
echo ========================================
echo APEX AI - FINAL MODAL SYSTEM TEST
echo ========================================
echo.
echo This script will test the complete modal system
echo from homepage to authentication.
echo.

set \"PROJECT_DIR=C:\\Users\\APEX AI\\Desktop\\defense\"
set \"CLIENT_DIR=%PROJECT_DIR%\\client-portal\"

echo Starting backend server...
cd /d \"%PROJECT_DIR%\\backend\"
start \"APEX Backend\" cmd /k \"echo APEX AI Backend Server (Port 5001) & echo ============================= & npm start\"

echo Waiting for backend to initialize...
timeout /t 3 >nul

echo Starting client portal with modal system...
cd /d \"%CLIENT_DIR%\"

echo.
echo ========================================
echo MODAL SYSTEM TESTING CHECKLIST
echo ========================================
echo.
echo WHEN THE BROWSER OPENS, TEST THESE STEPS:
echo.
echo 1. Homepage should load with video background
echo 2. You should see a single \"Enter Platform\" button
echo 3. Click the \"Enter Platform\" button
echo 4. Role selection modal should appear with blur effect
echo 5. You should see 4 role options:
echo    - Client Portal (Available)
echo    - Dispatch Console (In Development)  
echo    - Administrator (Restricted Access)
echo    - Guard Portal (In Development)
echo 6. Click \"Client Portal\" option
echo 7. Client login modal should appear
echo 8. Enter demo credentials:
echo    Email: sarah.johnson@luxeapartments.com
echo    Password: Demo123!
echo 9. Should redirect to client dashboard
echo.
echo ========================================
echo TROUBLESHOOTING GUIDE
echo ========================================
echo.
echo IF MODAL DOESN'T APPEAR:
echo - Check browser console (F12) for errors
echo - Verify network tab shows successful file loads
echo - Try hard refresh (Ctrl+F5)
echo.
echo IF BUTTON DOESN'T WORK:
echo - Right-click button and \"Inspect Element\"
echo - Verify onclick attribute exists
echo - Check for JavaScript errors in console
echo.
echo IF AUTHENTICATION FAILS:
echo - Verify backend is running on port 5001
echo - Check network tab for API call status
echo - Confirm demo credentials are typed correctly
echo.
echo ========================================
echo STARTING CLIENT PORTAL...
echo ========================================
echo.
echo Backend: http://localhost:5001 (should be running)
echo Frontend: http://localhost:5173 (starting now)
echo.
echo Browser should open automatically!
echo.

npm run dev
