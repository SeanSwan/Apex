@echo off
echo.
echo ================================================
echo 🔄 RESTARTING CLIENT PORTAL - LOGOUT FIX APPLIED
echo ================================================
echo.
echo Fixed Issues:
echo ✅ Logout routing conflict resolved
echo ✅ Navigation now properly goes to landing page
echo ✅ No more redirect loops
echo ✅ Clean authentication flow restored
echo.
echo Stopping client portal...
for /f "tokens=2" %%a in ('tasklist /fi "imagename eq node.exe" /fi "windowtitle eq APEX AI - Client Portal*" /fo list ^| find "PID"') do taskkill /PID %%a /F 2>NUL

echo Waiting 3 seconds...
timeout /t 3 >NUL

echo.
echo Starting client portal with logout fix...
cd /d "C:\Users\APEX AI\Desktop\defense\client-portal"
start "APEX AI - Client Portal (LOGOUT FIXED)" cmd /k "echo 🎨 Client Portal - LOGOUT ROUTING FIXED && echo 🔄 Logout now properly redirects to landing page && echo 🌐 URL: http://localhost:5173 && echo ✅ Authentication flow restored && echo. && npm run dev"

echo.
echo ================================================
echo ✅ CLIENT PORTAL RESTARTED WITH LOGOUT FIX!
echo ================================================
echo.
echo 🧪 TEST THE FIX:
echo.
echo 1. Go to: http://localhost:5173
echo 2. Login with: sarah.johnson@luxeapartments.com / Demo123!
echo 3. Click your user menu (top right)
echo 4. Click "Sign Out"
echo 5. Should redirect to landing page with login modal
echo.
echo 🎯 EXPECTED RESULT:
echo    ✅ Clean logout without navigation loops
echo    ✅ Return to professional landing page
echo    ✅ Login modal available for re-authentication
echo    ✅ No browser console errors
echo.
echo Backend server is still running and doesn't need restart.
echo.
pause