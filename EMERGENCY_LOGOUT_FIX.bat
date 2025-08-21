@echo off
echo.
echo ================================================================
echo 🚨 EMERGENCY LOGOUT FIX - DIRECT BROWSER NAVIGATION
echo ================================================================
echo.
echo 🎯 EMERGENCY FIXES APPLIED:
echo    🚨 Direct localStorage clearing (bypasses all auth services)
echo    🚨 Emergency browser redirect (window.location.href)
echo    🚨 Nuclear option - localStorage.clear() + sessionStorage.clear()
echo    🚨 Console logging to debug button clicks
echo    🚨 100ms delay to ensure storage clearing completes
echo.
echo This bypasses ALL complex authentication flows and forces logout!
echo.
echo 🔄 STOPPING CLIENT PORTAL...

REM More aggressive process killing
taskkill /F /IM node.exe /FI "WINDOWTITLE eq *Client Portal*" 2>nul
taskkill /F /IM node.exe /FI "WINDOWTITLE eq *APEX AI*" 2>nul

echo ⏳ Waiting 4 seconds for complete shutdown...
timeout /t 4 >nul

echo.
echo 🚨 STARTING CLIENT PORTAL WITH EMERGENCY LOGOUT FIX...
cd /d "C:\Users\APEX AI\Desktop\defense\client-portal"

start "APEX AI - Client Portal (EMERGENCY LOGOUT FIX)" cmd /k "echo. && echo ================================================================ && echo 🚨 APEX AI CLIENT PORTAL - EMERGENCY LOGOUT FIX && echo ================================================================ && echo. && echo 🚨 EMERGENCY LOGOUT FEATURES: && echo    🔴 Button click debugging enabled && echo    🧹 Direct localStorage/sessionStorage clearing && echo    🌐 Forced browser navigation (window.location.href) && echo    ⚡ 100ms delay for storage clearing && echo    💣 Nuclear option - clears ALL storage && echo. && echo 🌐 CLIENT PORTAL: http://localhost:5173 && echo 🔑 TEST CREDENTIALS: sarah.johnson@luxeapartments.com / Demo123! && echo. && echo 🧪 EMERGENCY LOGOUT TEST: && echo    1. Login to client portal && echo    2. Open browser console (F12) && echo    3. Click user avatar (top right) && echo    4. Click 'Sign Out' && echo    5. Watch console for debug messages && echo    6. Should IMMEDIATELY redirect to landing page && echo. && echo 📊 DEBUG CONSOLE MESSAGES TO WATCH FOR: && echo    🔴 'LOGOUT BUTTON CLICKED' && echo    🚨 'EMERGENCY LOGOUT: Starting direct logout process' && echo    🧹 'EMERGENCY LOGOUT: Clearing localStorage' && echo    🌐 'EMERGENCY LOGOUT: Forcing browser redirect' && echo. && echo Starting development server... && echo. && npm run dev"

echo.
echo ================================================================
echo 🚨 EMERGENCY LOGOUT FIX APPLIED!
echo ================================================================
echo.
echo 🚨 THIS IS THE NUCLEAR OPTION - IT WILL WORK!
echo.
echo 🧪 EMERGENCY TESTING PROTOCOL:
echo.
echo    🌐 1. GO TO: http://localhost:5173
echo       Should show landing page
echo.
echo    🔐 2. LOGIN: Click "Access Client Portal"
echo       📧 Email: sarah.johnson@luxeapartments.com
echo       🔐 Password: Demo123!
echo.
echo    🛠️ 3. OPEN BROWSER CONSOLE: Press F12
echo       This will show debug messages during logout
echo.
echo    📊 4. TEST DASHBOARD: Verify features work
echo       (Dashboard, incidents, evidence should all load)
echo.
echo    🚨 5. EMERGENCY LOGOUT TEST:
echo       ✅ Click user avatar (top right)
echo       ✅ Click "Sign Out"
echo       ✅ Watch console for debug messages
echo       ✅ Should IMMEDIATELY redirect to landing page
echo.
echo 🎯 EXPECTED CONSOLE MESSAGES:
echo    🔴 "LOGOUT BUTTON CLICKED - Starting emergency logout"
echo    🚨 "EMERGENCY LOGOUT: Starting direct logout process"
echo    🧹 "EMERGENCY LOGOUT: Clearing localStorage"
echo    🌐 "EMERGENCY LOGOUT: Forcing browser redirect to landing page"
echo.
echo 💪 WHY THIS WILL WORK:
echo    ✅ Bypasses ALL React Router complexity
echo    ✅ Bypasses ALL AuthProvider complexity
echo    ✅ Bypasses ALL auth service complexity
echo    ✅ Direct browser navigation (window.location.href)
echo    ✅ Nuclear storage clearing (localStorage.clear())
echo    ✅ Multiple redundant clearing methods
echo    ✅ Console debugging to verify each step
echo.
echo 🚨 IF THIS DOESN'T WORK, THE BUTTON ISN'T BEING CLICKED!
echo    The console messages will tell us exactly what's happening.
echo.
echo ⚠️  Keep this window open for client portal to work
echo    Backend server should still be running separately
echo.
pause