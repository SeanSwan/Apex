@echo off
echo.
echo ================================================================
echo 🔄 FORCE RESTART CLIENT PORTAL - EMERGENCY LOGOUT FIX
echo ================================================================
echo.
echo The emergency logout code is in the file but needs to be loaded!
echo.
echo 🛑 FORCE STOPPING ALL CLIENT PORTAL PROCESSES...

REM Kill ALL node processes to ensure clean restart
taskkill /F /IM node.exe 2>nul
echo ✅ All Node.js processes stopped

echo.
echo ⏳ Waiting 5 seconds for complete shutdown...
timeout /t 5 >nul

echo.
echo 🚀 STARTING CLIENT PORTAL WITH FRESH CODE LOAD...
cd /d "C:\Users\APEX AI\Desktop\defense\client-portal"

REM Clear npm cache to ensure fresh load
echo 🧹 Clearing npm cache...
npm cache clean --force 2>nul

echo.
echo 🔄 Starting with fresh code reload...
start "APEX AI - Client Portal (EMERGENCY LOGOUT - FRESH CODE)" cmd /k "echo. && echo ================================================================ && echo 🚨 APEX AI CLIENT PORTAL - EMERGENCY LOGOUT (FRESH CODE LOAD) && echo ================================================================ && echo. && echo 🔧 CODE STATUS: && echo    ✅ Emergency logout function with debugging applied && echo    ✅ Console logging for button clicks added && echo    ✅ Nuclear storage clearing implemented && echo    ✅ Browser navigation forcing enabled && echo. && echo 🌐 CLIENT PORTAL: http://localhost:5173 && echo 🔑 TEST CREDENTIALS: sarah.johnson@luxeapartments.com / Demo123! && echo. && echo 🧪 TESTING INSTRUCTIONS: && echo    1. Keep browser console open (F12) && echo    2. Login to client portal && echo    3. Click user avatar (top right) && echo    4. Click 'Sign Out' && echo    5. WATCH CONSOLE FOR DEBUG MESSAGES && echo. && echo 📊 EXPECTED CONSOLE MESSAGES: && echo    🔴 'LOGOUT BUTTON CLICKED - Starting emergency logout' && echo    🚨 'EMERGENCY LOGOUT: Starting direct logout process' && echo    🧹 'EMERGENCY LOGOUT: Clearing localStorage' && echo    🌐 'EMERGENCY LOGOUT: Forcing browser redirect' && echo. && echo 🚀 Starting fresh development server... && echo. && npm run dev"

echo.
echo ================================================================
echo ✅ CLIENT PORTAL FORCE RESTARTED WITH FRESH CODE!
echo ================================================================
echo.
echo 🎯 CRITICAL TESTING STEPS:
echo.
echo    🌐 1. GO TO: http://localhost:5173
echo.
echo    🛠️ 2. OPEN BROWSER CONSOLE: Press F12 (CRITICAL!)
echo       Keep the console open during testing
echo.
echo    🔐 3. LOGIN: Click "Access Client Portal"
echo       📧 Email: sarah.johnson@luxeapartments.com
echo       🔐 Password: Demo123!
echo.
echo    🚨 4. TEST EMERGENCY LOGOUT:
echo       ✅ Click user avatar (top right corner)
echo       ✅ Click "Sign Out" button
echo       ✅ WATCH console for debug messages
echo.
echo 🎯 IF YOU SEE THESE CONSOLE MESSAGES, THE CODE IS LOADED:
echo    🔴 "LOGOUT BUTTON CLICKED - Starting emergency logout"
echo    🚨 "EMERGENCY LOGOUT: Starting direct logout process"
echo    🧹 "EMERGENCY LOGOUT: Clearing localStorage"
echo    🌐 "EMERGENCY LOGOUT: Forcing browser redirect"
echo.
echo 💪 IF NO MESSAGES APPEAR, SOMETHING IS WRONG WITH:
echo    ❌ Button not being clicked
echo    ❌ User menu not opening
echo    ❌ Code not loading properly
echo.
echo ⚠️  IMPORTANT: Keep this window open for the portal to work!
echo    Backend server should still be running separately.
echo.
pause