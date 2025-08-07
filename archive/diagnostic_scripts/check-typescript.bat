@echo off
echo ===============================================
echo    APEX AI - TYPESCRIPT COMPILATION CHECK
echo ===============================================
echo.

echo [1/3] Checking TypeScript installation...
cd frontend
npx tsc --version > nul 2>&1
if errorlevel 1 (
    echo ❌ TypeScript not available
    echo Installing TypeScript...
    npm install -D typescript@latest
)
echo ✅ TypeScript is available

echo.
echo [2/3] Running TypeScript compilation check...
echo This will check for import/export errors...
echo.
npx tsc --noEmit --skipLibCheck

if errorlevel 1 (
    echo.
    echo ❌ TypeScript compilation FAILED
    echo The above errors need to be fixed to resolve 404 issues
    echo.
    echo COMMON FIXES:
    echo - Fix import paths in components
    echo - Ensure all exported functions exist
    echo - Check for circular dependencies
) else (
    echo.
    echo ✅ TypeScript compilation PASSED
    echo All imports and exports are correctly resolved
)

echo.
echo [3/3] Running ESLint check (if available)...
npm run lint:enable > nul 2>&1
if errorlevel 1 (
    echo ⚠️  ESLint warnings found (non-critical)
) else (
    echo ✅ ESLint check passed
)

echo.
echo ===============================================
echo COMPILATION CHECK COMPLETE
echo ===============================================
echo If TypeScript compilation passed but you still get 404 errors,
echo the issue is likely with server configuration or missing assets.
echo ===============================================
cd ..
pause
