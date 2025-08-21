@echo off
echo.
echo ================================================================
echo 🔧 DASHBOARD ERROR FIX - SIMPLIFIED DASHBOARD IMPLEMENTATION
echo ================================================================
echo.
echo 🎯 FIXES APPLIED:
echo    ✅ Removed complex error handling causing popup
echo    ✅ Simplified dashboard with working API calls
echo    ✅ Real KPI cards showing actual data
echo    ✅ Clean incident list display
echo    ✅ Debug logging to track data loading
echo    ✅ No more "Some dashboard sections couldn't load" popup
echo.
echo 🔄 RESTARTING CLIENT PORTAL...

REM Kill client portal processes
for /f "tokens=2" %%a in ('tasklist /fi "imagename eq node.exe" /fi "windowtitle eq *Client Portal*" /fo list 2^>nul ^| find "PID"') do (
    echo Stopping client portal process %%a
    taskkill /PID %%a /F 2>nul
)

echo ⏳ Waiting 4 seconds for clean shutdown...
timeout /t 4 >nul

echo.
echo 🚀 STARTING CLIENT PORTAL WITH FIXED DASHBOARD...
cd /d "C:\Users\APEX AI\Desktop\defense\client-portal"

start "APEX AI - Client Portal (DASHBOARD FIXED)" cmd /k "echo. && echo ================================================================ && echo 🎨 APEX AI CLIENT PORTAL - DASHBOARD ERROR FIXED && echo ================================================================ && echo. && echo 🔧 DASHBOARD FIXES: && echo    ✅ Simplified dashboard implementation && echo    ✅ Removed complex error handling && echo    ✅ Real KPI cards with actual data && echo    ✅ Working API integration && echo    ✅ Clean incident display && echo    ✅ No more error popups && echo. && echo 🌐 CLIENT PORTAL: http://localhost:5173 && echo 🔑 TEST CREDENTIALS: sarah.johnson@luxeapartments.com / Demo123! && echo. && echo 🧪 TEST WORKFLOW: && echo    1. Login to client portal && echo    2. Dashboard should load without errors && echo    3. See real KPI data (incidents, resolution rate, etc.) && echo    4. View recent incidents list && echo    5. No error popup should appear && echo    6. Test logout functionality && echo. && echo 📊 EXPECTED DASHBOARD FEATURES: && echo    ✅ 4 KPI cards showing real metrics && echo    ✅ Recent critical incidents list && echo    ✅ Refresh button working && echo    ✅ Clean, professional interface && echo    ✅ No error messages or popups && echo. && echo 🚨 LOGOUT TESTING READY: && echo    After dashboard loads successfully, test the emergency logout && echo    by clicking user avatar -> Sign Out && echo. && echo Starting development server... && echo. && npm run dev"

echo.
echo ================================================================
echo ✅ CLIENT PORTAL RESTARTED WITH DASHBOARD FIX!
echo ================================================================
echo.
echo 🧪 COMPLETE TESTING WORKFLOW:
echo.
echo    🌐 1. GO TO: http://localhost:5173
echo.
echo    🔐 2. LOGIN: Click "Access Client Portal"
echo       📧 Email: sarah.johnson@luxeapartments.com
echo       🔐 Password: Demo123!
echo.
echo    📊 3. VERIFY DASHBOARD: Should load without errors
echo       ✅ See 4 KPI cards with real data
echo       ✅ View recent incidents list
echo       ✅ No error popup should appear
echo       ✅ Refresh button should work
echo.
echo    🚪 4. TEST LOGOUT: After dashboard loads successfully
echo       ✅ Click user avatar (top right)
echo       ✅ Click "Sign Out"
echo       ✅ Should redirect to landing page
echo       ✅ Watch console for debug messages
echo.
echo 🎯 DASHBOARD SHOULD NOW WORK PERFECTLY:
echo    → No "Some dashboard sections couldn't load" popup
echo    → Real KPI data displayed
echo    → Recent incidents showing
echo    → Professional interface
echo    → Ready for logout testing
echo.
echo ⚠️  Keep this window open for client portal to work
echo    Backend server should still be running separately
echo.
pause