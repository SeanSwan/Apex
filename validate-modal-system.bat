@echo off
echo ========================================
echo APEX AI - MODAL SYSTEM VALIDATION
echo ========================================
echo.
echo Checking if modal system is properly set up...
echo.

REM Check current directory
echo Current directory: %CD%
echo.

REM Check if key files exist
if exist "client-portal\src\components\modals\RoleSelectionModal.tsx" (
    echo [PASS] RoleSelectionModal.tsx exists
) else (
    echo [FAIL] RoleSelectionModal.tsx missing
)

if exist "client-portal\src\components\modals\ClientLoginModal.tsx" (
    echo [PASS] ClientLoginModal.tsx exists
) else (
    echo [FAIL] ClientLoginModal.tsx missing
)

if exist "client-portal\src\components\modals\index.ts" (
    echo [PASS] Modal index.ts exists
) else (
    echo [FAIL] Modal index.ts missing
)

if exist "client-portal\src\components\landing\LandingPage.tsx" (
    echo [PASS] LandingPage.tsx exists
) else (
    echo [FAIL] LandingPage.tsx missing
)

echo.
echo Checking for button fix...
findstr /C:"onClick={handleAccessPortal}" "client-portal\src\components\landing\LandingPage.tsx" >nul
if errorlevel 1 (
    echo [FAIL] Button onClick handler missing!
    echo.
    echo CRITICAL ISSUE: The Enter Platform button is not connected to the modal trigger.
    echo You need to add onClick={handleAccessPortal} to the button in LandingPage.tsx
    echo.
) else (
    echo [PASS] Button onClick handler found
)

echo.
echo Checking for modal imports...
findstr /C:"RoleSelectionModal, ClientLoginModal" "client-portal\src\components\landing\LandingPage.tsx" >nul
if errorlevel 1 (
    echo [FAIL] Modal imports missing in LandingPage
) else (
    echo [PASS] Modal imports found in LandingPage
)

echo.
echo ========================================
echo VALIDATION COMPLETE
echo ========================================
echo.
echo If all checks pass, the modal system should work.
echo.
echo TO TEST MANUALLY:
echo 1. Open two command prompts
echo 2. In first: cd backend && npm start
echo 3. In second: cd client-portal && npm run dev  
echo 4. Go to http://localhost:5173
echo 5. Click "Enter Platform" button
echo.
pause
