@echo off
echo ========================================
echo APEX AI - TAILWIND CSS ERROR FIXED
echo ========================================
echo.
echo WHAT WAS FIXED:
echo - Changed "resize-vertical" to "resize-y" 
echo - This is the correct Tailwind CSS class name
echo - Line 433 in global.css now uses valid syntax
echo.

echo The problematic line:
echo OLD: @apply transition-colors duration-200 resize-vertical;
echo NEW: @apply transition-colors duration-200 resize-y;
echo.

echo ========================================
echo TESTING CSS COMPILATION
echo ========================================
echo.

echo Stopping any existing processes...
taskkill /F /IM node.exe 2>nul
timeout /t 2 >nul

echo Starting development servers...
cd /d "%~dp0"

echo.
echo EXPECTED OUTPUT (NO MORE CSS ERRORS):
echo [BACKEND]  Server running on port 5001
echo [FRONTEND] Local: http://localhost:5173
echo [FRONTEND] No PostCSS/Tailwind CSS errors
echo.
echo Browser should open to:
echo ✅ APEX AI homepage with video background
echo ✅ Single "Enter Platform" button
echo ✅ Modal system when button is clicked
echo ✅ No CSS compilation errors
echo.
echo ========================================
echo STARTING CLEAN BUILD...
echo ========================================
echo.

npm start
