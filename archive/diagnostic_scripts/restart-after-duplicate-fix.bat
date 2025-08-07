@echo off
echo ===============================================
echo   APEX AI - DUPLICATE EXPORTS FIXED
echo ===============================================
echo.

echo ✅ FIXES COMPLETED:
echo   1. TextArea → ThemeTextArea
echo   2. DailyReportsSection → PreviewDailyReportsSection  
echo   3. SecurityCodeBadge → PreviewSecurityCodeBadge
echo.

echo [1/2] Killing existing Node processes...
taskkill /f /im node.exe > nul 2>&1
echo ✅ Cleared Node processes

echo.
echo [2/2] Starting servers with duplicate export fixes...
echo.
echo 🚀 Frontend: http://localhost:5173
echo 🚀 Backend:  http://localhost:5000
echo.

npm start

echo.
echo ===============================================
echo If no "Multiple exports" errors appear, the issue is fixed!
echo ===============================================
pause
