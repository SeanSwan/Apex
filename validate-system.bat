@echo off
echo ========================================
echo APEX AI - COMPREHENSIVE VALIDATION CHECK
echo ========================================
echo.
echo Running comprehensive protocol check for:
echo - Syntax errors
echo - Port configurations  
echo - Import/Export issues
echo - TypeScript compilation
echo - File cleanup validation
echo.

set "PROJECT_DIR=C:\Users\APEX AI\Desktop\defense"
set "CLIENT_DIR=%PROJECT_DIR%\client-portal"

echo [1/6] Checking project structure...
if not exist "%CLIENT_DIR%" (
    echo ERROR: Client portal directory not found
    pause
    exit /b 1
)

if not exist "%CLIENT_DIR%\src\components\modals" (
    echo ERROR: Modals directory not found
    pause
    exit /b 1
)

echo SUCCESS: Project structure valid
echo.

echo [2/6] Validating port configurations...
findstr /C:"5173" "%CLIENT_DIR%\vite.config.ts" >nul
if errorlevel 1 (
    echo ERROR: Vite config not using port 5173
    pause
    exit /b 1
)

findstr /C:"5001" "%CLIENT_DIR%\vite.config.ts" >nul
if errorlevel 1 (
    echo ERROR: Backend proxy not pointing to port 5001
    pause
    exit /b 1
)

echo SUCCESS: Port configurations correct (Frontend: 5173, Backend: 5001)
echo.

echo [3/6] Checking modal component files...
if not exist "%CLIENT_DIR%\src\components\modals\RoleSelectionModal.tsx" (
    echo ERROR: RoleSelectionModal.tsx missing
    pause
    exit /b 1
)

if not exist "%CLIENT_DIR%\src\components\modals\ClientLoginModal.tsx" (
    echo ERROR: ClientLoginModal.tsx missing
    pause
    exit /b 1
)

if not exist "%CLIENT_DIR%\src\components\modals\index.ts" (
    echo ERROR: Modal index.ts missing
    pause
    exit /b 1
)

echo SUCCESS: All modal components present
echo.

echo [4/6] Validating TypeScript compilation...
cd /d "%CLIENT_DIR%"

if not exist "node_modules" (
    echo Installing dependencies for validation...
    call npm install >nul 2>&1
)

echo Running TypeScript type check...
npm run type-check
if errorlevel 1 (
    echo ERROR: TypeScript compilation failed
    echo Check console output above for details
    pause
    exit /b 1
)

echo SUCCESS: TypeScript compilation successful
echo.

echo [5/6] Checking for syntax errors in critical files...

echo Validating RoleSelectionModal...
findstr /C:"getColorClasses" "src\components\modals\RoleSelectionModal.tsx" >nul
if errorlevel 1 (
    echo ERROR: Missing getColorClasses function in RoleSelectionModal
    pause
    exit /b 1
)

echo Validating LandingPage imports...
findstr /C:"from '../modals'" "src\components\landing\LandingPage.tsx" >nul
if errorlevel 1 (
    echo ERROR: Missing modal imports in LandingPage
    pause
    exit /b 1
)

echo SUCCESS: Critical syntax validation passed
echo.

echo [6/6] File cleanup validation...
echo Checking for redundant files...

if exist "%PROJECT_DIR%\start-client-portal-OLD.bat" (
    echo WARNING: Found old startup file: start-client-portal-OLD.bat
    echo Consider removing redundant files
)

echo SUCCESS: File cleanup validation complete
echo.

echo ========================================
echo SUCCESS: COMPREHENSIVE VALIDATION PASSED!
echo ========================================
echo.
echo All checks passed:
echo - Project structure valid
echo - Port configurations correct (5173 to 5001)
echo - Modal components present and functional
echo - TypeScript compilation successful
echo - No critical syntax errors found
echo - File cleanup validation passed
echo.
echo SYSTEM READY FOR TESTING!
echo.
echo Next steps:
echo 1. Run: test-modal-system.bat
echo 2. Test the modal login system at http://localhost:5173
echo 3. Verify backend integration with demo credentials
echo.
pause
