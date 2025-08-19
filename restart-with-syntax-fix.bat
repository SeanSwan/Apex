@echo off
echo ========================================
echo APEX AI - BABEL SYNTAX ERROR FIXED
echo ========================================
echo.
echo WHAT WAS FIXED:
echo - Removed optional chaining assignment (?.=) syntax
echo - Replaced with traditional if-check before assignment
echo - This syntax is too new for current Babel configuration
echo.

echo The problematic line:
echo OLD: (window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__?.onCommitFiberRoot = 
echo NEW: Traditional if-check before assignment
echo.

echo Testing the fix...
cd /d "%~dp0client-portal"

echo Running TypeScript type check...
npm run type-check
if errorlevel 1 (
    echo ERROR: TypeScript issues still exist
    pause
    exit /b 1
) else (
    echo SUCCESS: TypeScript passes
)

echo.
echo ========================================
echo RESTARTING DEVELOPMENT SERVERS
echo ========================================
echo.

echo Stopping any existing processes...
taskkill /F /IM node.exe 2>nul
timeout /t 2 >nul

echo Starting with fixed syntax...
cd /d "%~dp0"

echo.
echo EXPECTED OUTPUT:
echo [BACKEND]  Server running on port 5001
echo [FRONTEND] Local: http://localhost:5173
echo.
echo Browser should open to:
echo - APEX AI homepage with video background
echo - Single "Enter Platform" button
echo - Modal system when clicked
echo.

npm start
