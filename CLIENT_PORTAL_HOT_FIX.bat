@echo off
echo ========================================
echo 🔥 APEX AI CLIENT PORTAL - HOT FIX
echo ========================================
echo.
echo ✅ FIXES APPLIED:
echo    - AuthService export error FIXED
echo    - X-Frame-Options meta tag REMOVED  
echo    - Web manifest file CREATED
echo    - Favicon files CONFIGURED
echo.

echo Restarting client portal with fixes...
echo.

cd /d "C:\Users\APEX AI\Desktop\defense\client-portal"

echo Clearing development cache...
if exist ".vite" rd /s /q ".vite" 2>nul
if exist "dist" rd /s /q "dist" 2>nul

echo.
echo ========================================
echo 🎯 CLIENT PORTAL RESTARTING...
echo ========================================
echo.
echo The browser will refresh automatically with fixes applied.
echo.
echo 🔐 LOGIN CREDENTIALS:
echo Email:    sarah.johnson@luxeapartments.com
echo Password: Demo123!
echo.
echo ✅ EXPECTED FIXES:
echo - No more AuthService import errors
echo - No more X-Frame-Options warnings
echo - No more manifest 404 errors
echo - Clean console with working authentication
echo.

timeout /t 3 /nobreak >nul
start http://localhost:5173

npm run dev
