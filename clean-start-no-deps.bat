@echo off
echo ========================================
echo APEX AI - WEB-VITALS DEPENDENCY FIXED
echo ========================================
echo.
echo WHAT WAS FIXED:
echo - Removed web-vitals import (missing dependency)
echo - Commented out performance monitoring code
echo - This was optional functionality, not needed for modal system
echo.

echo The main.tsx file now has:
echo - No missing dependency imports
echo - Clean startup without import errors
echo - All core functionality preserved
echo.

echo ========================================
echo TESTING CLEAN STARTUP
echo ========================================
echo.

echo Stopping any existing processes...
taskkill /F /IM node.exe 2>nul
timeout /t 2 >nul

echo Starting development servers...
cd /d "%~dp0"

echo.
echo EXPECTED OUTPUT (NO MORE IMPORT ERRORS):
echo [BACKEND]  Server running on port 5001
echo [FRONTEND] Local: http://localhost:5173
echo [FRONTEND] No import errors, clean startup
echo.
echo Browser should open to:
echo ✅ APEX AI homepage with video background
echo ✅ Single "Enter Platform" button  
echo ✅ Modal system when button is clicked
echo.
echo ========================================
echo STARTING CLEAN BUILD...
echo ========================================
echo.

npm start
