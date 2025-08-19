@echo off
echo ========================================
echo 🚨 APEX AI CLIENT PORTAL - EMERGENCY FIX
echo ========================================
echo.
echo ✅ CRITICAL FIXES APPLIED:
echo    - AuthService file corruption FIXED
echo    - Proper TypeScript formatting RESTORED
echo    - Module exports CORRECTED
echo    - X-Frame-Options meta tag REMOVED
echo    - Web manifest CREATED
echo    - Favicon system CONFIGURED
echo.

echo Killing any existing processes...
taskkill /f /im node.exe >nul 2>&1

echo Clearing all caches...
cd /d "C:\Users\APEX AI\Desktop\defense\client-portal"
if exist ".vite" rd /s /q ".vite" 2>nul
if exist "dist" rd /s /q "dist" 2>nul
if exist "node_modules/.vite" rd /s /q "node_modules/.vite" 2>nul

echo.
echo ========================================
echo 🎯 EMERGENCY RESTART IN PROGRESS...
echo ========================================
echo.
echo Browser will open automatically to:
echo http://localhost:5173
echo.
echo 🔐 TEST CREDENTIALS:
echo Email:    sarah.johnson@luxeapartments.com
echo Password: Demo123!
echo.
echo ✅ EXPECTED RESULTS:
echo - Clean browser console (no errors)
echo - Working authentication system
echo - Professional landing page
echo - Functional client portal dashboard
echo.

timeout /t 3 /nobreak >nul
start http://localhost:5173

echo Starting client portal with emergency fixes...
npm run dev
