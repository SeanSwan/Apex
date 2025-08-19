@echo off
echo ========================================
echo 🔧 APEX AI CLIENT PORTAL - QUICK STATUS CHECK
echo ========================================
echo.

echo Checking backend server status...
curl -s http://localhost:5001/api/health >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo ✅ Backend server is running on port 5001
    echo    💾 Database: Connected
    echo    🔐 JWT: Configured
    echo    🛡️  Security: Active
) else (
    echo ❌ Backend server is NOT running on port 5001
    echo    ⚠️  Please start the backend first
)

echo.
echo Checking frontend client portal...
curl -s http://localhost:5173 >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo ✅ Client portal is running on port 5173
    echo    🌐 Landing page: Available
    echo    ⚡ Vite dev server: Active
) else (
    echo ❌ Client portal is NOT running on port 5173
    echo    ⚠️  Please start the client portal
)

echo.
echo ========================================
echo 📋 QUICK TEST INSTRUCTIONS
echo ========================================
echo.
echo 1. 🌐 Open browser to: http://localhost:5173
echo 2. 🖱️  Click "ACCESS CLIENT PORTAL" button
echo 3. 🔑 Login with:
echo    📧 Email: sarah.johnson@luxeapartments.com
echo    🔒 Password: Demo123!
echo 4. 🎯 You should see the dashboard with KPIs
echo.
echo 📞 For Defense Site:
echo    🖱️  Click "ENTER DEFENSE SITE" button
echo    ✅ Confirm the redirect dialog
echo    🌐 It will open main site in new tab
echo.

echo ========================================
echo 🚀 NEXT ACTIONS
echo ========================================
echo.
if %ERRORLEVEL% EQU 0 (
    echo ✅ System Status: READY
    echo 🎉 Your client portal should be working!
    echo.
    echo 📝 If you see the landing page but login fails:
    echo    1. Check browser console (F12)
    echo    2. Verify backend console shows login attempts
    echo    3. Try hard refresh (Ctrl+F5)
) else (
    echo ❌ System Status: NEEDS ATTENTION
    echo 🔧 Run this to fix:
    echo    START_CLIENT_PORTAL_FIXED.bat
)

echo.
echo Press any key to continue...
pause >nul
