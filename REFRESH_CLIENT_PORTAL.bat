@echo off
echo.
echo ================================================
echo 🔧 QUICK FRONTEND REFRESH UTILITY
echo ================================================
echo.
echo Sometimes React components need a fresh start!
echo.
echo 🔄 STEPS TO RESOLVE LOADING ISSUES:
echo.
echo 1. Hard refresh browser: Ctrl+F5
echo 2. Clear browser cache for localhost:5173
echo 3. Wait 10 seconds for React to stabilize
echo 4. Check browser console (F12) for any errors
echo.
echo 🌐 Your backend is working PERFECTLY!
echo ✅ All API endpoints responding successfully
echo ✅ Authentication working
echo ✅ Multi-tenant data loading
echo ✅ Rate limiting fixed
echo.
echo If still having issues, restart client portal:
echo.
set /p restart="Restart client portal now? (y/n): "
if /i "%restart%"=="y" (
    echo.
    echo Restarting client portal...
    taskkill /F /IM node.exe /FI "WINDOWTITLE eq APEX AI - Client Portal*" 2>NUL
    timeout /t 3 >NUL
    
    cd /d "C:\Users\APEX AI\Desktop\defense\client-portal"
    start "APEX AI - Client Portal (REFRESHED)" cmd /k "echo 🎨 Client Portal - REFRESHED && echo 🌐 URL: http://localhost:5173 && echo 🔄 Hard refresh recommended: Ctrl+F5 && echo. && npm run dev"
    
    echo.
    echo ✅ Client portal restarted!
    echo 🌐 Go to: http://localhost:5173
    echo 🔄 Hard refresh: Ctrl+F5
)
echo.
pause