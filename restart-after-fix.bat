@echo off
echo ========================================
echo APEX AI - TSCONFIG FIX & RESTART
echo ========================================
echo.
echo WHAT WAS FIXED:
echo - tsconfig.json had literal \n characters (invalid JSON)
echo - tsconfig.node.json had the same issue
echo - Both files have been corrected with proper formatting
echo.

echo Testing TypeScript configuration...
cd /d "%~dp0client-portal"

echo Running TypeScript type check...
npm run type-check
if errorlevel 1 (
    echo ERROR: TypeScript configuration still has issues
    echo Check the output above for details
    pause
    exit /b 1
) else (
    echo SUCCESS: TypeScript configuration is now valid
)

echo.
echo ========================================
echo RESTARTING WITH FIXED CONFIGURATION
echo ========================================
echo.

echo Stopping any existing processes...
taskkill /F /IM node.exe 2>nul
timeout /t 2 >nul

echo Starting servers with npm start...
cd /d "%~dp0"

echo.
echo EXPECTED OUTPUT:
echo [BACKEND]  Server running on port 5001
echo [FRONTEND] Local: http://localhost:5173
echo.
echo Browser should open to client portal homepage with:
echo - Video background
echo - "Enter Platform" button
echo - Modal system when clicked
echo.

npm start
