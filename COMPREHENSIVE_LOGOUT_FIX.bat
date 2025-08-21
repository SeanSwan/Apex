@echo off
echo.
echo ================================================================
echo 🔧 COMPREHENSIVE LOGOUT FIX - FORCE BROWSER NAVIGATION
echo ================================================================
echo.
echo 🎯 FIXES APPLIED:
echo    ✅ AuthProvider now forces browser navigation (window.location.href)
echo    ✅ ClientLayout simplified to not interfere with navigation
echo    ✅ No more React Router conflicts during logout
echo    ✅ Guaranteed redirect to landing page on logout
echo.
echo 🔄 STOPPING CLIENT PORTAL...

REM Kill the specific client portal process
for /f "tokens=2" %%a in ('tasklist /fi "imagename eq node.exe" /fi "windowtitle eq *Client Portal*" /fo list 2^>nul ^| find "PID"') do (
    echo Killing client portal process %%a
    taskkill /PID %%a /F 2>nul
)

echo ⏳ Waiting 4 seconds for clean shutdown...
timeout /t 4 >nul

echo.
echo 🚀 STARTING CLIENT PORTAL WITH COMPREHENSIVE LOGOUT FIX...
cd /d "C:\Users\APEX AI\Desktop\defense\client-portal"

start "APEX AI - Client Portal (LOGOUT COMPREHENSIVE FIX)" cmd /k "echo. && echo ================================================================ && echo 🎨 APEX AI CLIENT PORTAL - LOGOUT COMPREHENSIVE FIX && echo ================================================================ && echo. && echo 🔧 LOGOUT FIX STATUS: && echo    ✅ Browser navigation forced (window.location.href) && echo    ✅ React Router conflicts eliminated && echo    ✅ AuthProvider handles all navigation && echo    ✅ Clean auth state clearing && echo. && echo 🌐 CLIENT PORTAL: http://localhost:5173 && echo 🔑 TEST CREDENTIALS: sarah.johnson@luxeapartments.com / Demo123! && echo. && echo 🧪 LOGOUT TEST WORKFLOW: && echo    1. Login to client portal && echo    2. Navigate around dashboard && echo    3. Click user avatar (top right) && echo    4. Click 'Sign Out' && echo    5. Should IMMEDIATELY redirect to landing page && echo. && echo Starting development server... && echo. && npm run dev"

echo.
echo ================================================================
echo ✅ CLIENT PORTAL RESTARTED WITH COMPREHENSIVE LOGOUT FIX!
echo ================================================================
echo.
echo 🧪 COMPLETE TESTING WORKFLOW:
echo.
echo    🔗 1. GO TO: http://localhost:5173
echo       (Should show professional landing page)
echo.
echo    🔐 2. LOGIN: Click "Access Client Portal"
echo       📧 Email: sarah.johnson@luxeapartments.com
echo       🔐 Password: Demo123!
echo.
echo    📊 3. TEST DASHBOARD: Verify all features work
echo       ✅ Executive dashboard loads
echo       ✅ Incidents page accessible
echo       ✅ Evidence locker functional
echo.
echo    🚪 4. TEST LOGOUT: Click user avatar → "Sign Out"
echo       ✅ Should IMMEDIATELY redirect to landing page
echo       ✅ Should show login modal available
echo       ✅ Should clear all authentication data
echo       ✅ Should NOT get stuck on dashboard
echo.
echo 🎯 EXPECTED LOGOUT BEHAVIOR:
echo    → Instant browser navigation to http://localhost:5173/
echo    → Professional landing page visible
echo    → "Access Client Portal" button available
echo    → No authentication errors in console
echo    → Can immediately log back in
echo.
echo 💪 THIS FIX USES BROWSER NAVIGATION INSTEAD OF REACT ROUTER
echo    This bypasses all routing conflicts and forces proper redirect!
echo.
echo ⚠️  IMPORTANT: Keep this command window open for client portal to work
echo    Backend server should still be running in separate window
echo.
pause